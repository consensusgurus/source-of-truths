'use client';

// Emcee — the daily mini crossword (M.C., say it fast).
//
// A classic mini: a 5x5 grid on weekdays (10 words), a 7x7 pinwheel on
// Sundays (22 words), numbered Across and Down clues, and a timer. Tap a
// square to select its word, tap again to flip direction, and type. Fill every
// square and press Check grid: a perfect fill wins, a
// wrong one marks the misses in red and counts a CHECK against you. Score is
// words correct out of the word count — finish the grid and it's a full
// score — with ties on the daily board broken by fewest checks, then time.
// One free hint reveals a letter.
//
// Same daily plumbing as Tally/Suds/Carve: banked puzzles gated by Eastern
// date on the server (app/emcee/page.js), per-puzzle localStorage saves,
// /emcee?p=N archive pinning, streaks + stats, and the shared /api/quiz/*
// board flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Lightbulb, Eye, Smartphone, ChevronLeft, ChevronRight, Delete, Check, ArrowLeftRight } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, FEED_STRONG, FEED_STRONG_INK, FEED_SOFT, FEED_SOFT_INK, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isLoft } from '@/lib/loft';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T as THEME } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: THEME.surface,
  paper: THEME.paper,
  ink: THEME.ink,
  ember: THEME.accent,
  rust: THEME.danger,
  faded: THEME.muted,
  accent: '#c026d3',       // Emcee identity — magenta
  accentSoft: '#fbeefc',
  green: THEME.successDeep,
  greenSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_emcee_help_seen';
const STATS_KEY = 'sot_emcee_stats';

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : puzzles[0];
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function msToMidnightET() {
  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et);
    next.setHours(24, 0, 0, 0);
    return next - et;
  } catch (e) {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next - now;
  }
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

// ─── Personal stats + streak (localStorage), Tally/Suds/Carve pattern ────────
function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s && s.v === 1 && s.rec) return s;
  } catch (e) {}
  return { v: 1, rec: {} };
}
function recordStat(num, entry) {
  const s = getStats();
  if (s.rec[num]) return s;
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const perfect = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, perfect, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const t = p.across.length + p.down.length;
    const sc = Math.max(0, Math.min(t, Math.round(((m.scorePct || 0) / 100) * t)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState(T) {
  return {
    v: 1,
    letters: Array(T).fill(''), // player letters, index r*N+c ('' on blocks too)
    wrong: [],                  // cell indexes marked wrong by the last check
    checks: 0,                  // failed full-grid checks (the tiebreak)
    hintUsed: false,
    status: 'playing',          // playing | won | revealed
    t0: null,
    tEnd: null,
  };
}

export default function EmceeClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.size;
  const T = N * N;
  // `rev` busts the saved board when a LIVE puzzle's grid or words change, so an
  // in-flight save can't bleed its old letters onto the new grid (the whole bank
  // from #28 on was rebuilt mid-day 2026-08-12). Bump rev in puzzles.js, never
  // edit a live grid without it. Stats stay keyed on num, so streaks survive.
  const REV = PUZZLE.rev ? `r${PUZZLE.rev}` : '';
  const STORE_KEY = `sot_emcee_${PUZZLE.num}${REV}`;
  const solFlat = useMemo(() => PUZZLE.grid.join('').split(''), [PUZZLE]);
  // Every word, Across first, each with its cell indexes in order.
  const WORDS = useMemo(() => {
    const mk = (w, dir) => ({
      ...w, dir,
      cells: Array.from({ length: w.len }, (_, i) => (dir === 'A' ? w.r * N + w.c + i : (w.r + i) * N + w.c)),
    });
    return [...PUZZLE.across.map((w) => mk(w, 'A')), ...PUZZLE.down.map((w) => mk(w, 'D'))];
  }, [PUZZLE, N]);
  const TOTAL = WORDS.length;
  // cell -> word index per direction
  const wordOf = useMemo(() => {
    const m = { A: Array(T).fill(-1), D: Array(T).fill(-1) };
    WORDS.forEach((w, i) => w.cells.forEach((c) => { m[w.dir][c] = i; }));
    return m;
  }, [WORDS, T]);
  const numAt = useMemo(() => {
    const m = {};
    for (const w of WORDS) {
      const start = w.cells[0];
      if (m[start] == null || w.n < m[start]) m[start] = w.n;
    }
    return m;
  }, [WORDS]);

  const [g, setG] = useState(() => freshState(T));
  const [cur, setCur] = useState(WORDS[0].cells[0]);
  const [dir, setDir] = useState('A');
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  // Phone: the full clue list sits behind the clue bar, one tap away.
  const [cluesOpen, setCluesOpen] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('emcee', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('emcee'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [, setTick] = useState(0); // 1s re-render while the clock runs
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const letters = g.letters;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;   // not begun: show the start tile in place of the board
  const started = playing && !!g.t0;   // clock running: show the board
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('emcee');
  const STAGE = isStage('emcee', searchParams);
  // A give-up writes the answers into letters; on the loft the grid keeps the
  // player's own letters until the end card's Reveal answer tile is pressed.
  const viewLetters = g.status === 'revealed' && LOFT && !revealed ? (g.playerLetters || g.letters.map(() => '')) : g.letters;
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('emcee');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('emcee'), '--stg-acc-lt': gameColorLight('emcee'), '--stg-onramp-lt': gameOnrampLight('emcee'), '--stg-acc-ink-lt': gameAccentInkLight('emcee') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  // THE ACCENT AS TEXT. On the light register the accent has two values,
  // because three of the ten category steps are pastels chosen to be a FILL
  // carrying dark ink, and a pastel cannot also be ink on paper (gold was
  // 1.68:1 on the light ground, amber 1.47). --stg-acc still paints; this
  // writes. On the dark register the two resolve to the same value.
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.letters) && saved.letters.length === T) {
          setG({ ...freshState(T), ...saved, wrong: Array.isArray(saved.wrong) ? saved.wrong : [] });
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    // same-device day breadcrumb for cross-puzzle recs — TODAY'S puzzle only
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_emcee_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_emcee_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. `elapsed` below is derived from the current time, and it
  // used to read Date.now() during render, so the displayed clock only advanced
  // when something else happened to re-render the board. This ticks a state
  // value while the game is actually running, so the readout moves on its own.
  // Display only: the elapsed time recorded on the result is still computed
  // from a real Date.now() delta at the moment the game ends.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  useEffect(() => {
    if (g.status === 'playing') return;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  // live clock while solving
  useEffect(() => {
    if (!playing || !g.t0) return undefined;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [playing, g.t0]);

  // ---- metrics + leaderboard (same /api/quiz/* flow as every other board) ----
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try {
        const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
        if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`;
      } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => {
            if (d && Array.isArray(d.recent)) {
              setStats((c) => mergeServerStats(c || getStats(), d.recent, puzzles));
            }
            if (d && d.found && d.name) setPlayer({ name: d.name, rank: (d.ranks && d.ranks.xp) || d.rank || null, key: d.userKey || null });
          })
          .catch(() => {});
      }
    } catch (e) {}
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const iq = useIqStanding({ game: 'emcee', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'emcee', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'emcee', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'emcee', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'emcee', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const isBlock = useCallback((i) => solFlat[i] === '#', [solFlat]);
  const curWordIdx = wordOf[dir][cur];
  const curWord = WORDS[curWordIdx] || WORDS[0];
  // the perpendicular word passing through the selected cell — faintly lit too
  const crossDir = dir === 'A' ? 'D' : 'A';
  const crossWordIdx = wordOf[crossDir][cur];
  const crossCells = crossWordIdx >= 0 ? WORDS[crossWordIdx].cells : [];

  const wordsCorrect = useCallback((ls) =>
    WORDS.reduce((k, w) => k + (w.cells.every((c) => ls[c] === solFlat[c]) ? 1 : 0), 0),
  [WORDS, solFlat]);
  const finalScore = won ? TOTAL : (g.status === 'revealed' ? (g.revealScore || 0) : 0);

  const REC_KEY = `sot_emcee_rec_${PUZZLE.num}${REV}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player acts: a letter typed, a failed check,
    // or a hint. Opening the grid and dismissing the start tile does not log
    // a 0-score attempt.
    const acted = g.letters.some((ch) => ch !== '') || g.checks > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: TOTAL, g: g2.checks, won: g2.status === 'won' && g2.checks === 0 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = failed grid checks, so the daily leaderboard (score,
        // then guesses, then time) resolves ties by cleanest solve then speed.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: TOTAL, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.checks, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Judge a FULL grid. Called only by checkGrid, never on a keystroke.
  function maybeCheck(g2) {
    const full = solFlat.every((ch, i) => ch === '#' || g2.letters[i] !== '');
    if (!full) return g2;
    const bad = [];
    for (let i = 0; i < T; i++) if (solFlat[i] !== '#' && g2.letters[i] !== solFlat[i]) bad.push(i);
    if (!bad.length) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      g2.wrong = [];
      return g2;
    }
    g2.checks += 1;
    g2.wrong = bad;
    return g2;
  }

  // The player's explicit turn-in. Only a full grid can be checked; each check
  // that finds a wrong square counts one against the player on the board.
  function checkGrid() {
    if (!playing) return;
    const full = solFlat.every((ch, i) => ch === '#' || g.letters[i] !== '');
    if (!full) { say('Fill every square, then check the grid.'); return; }
    const g2 = { ...g, letters: g.letters.slice() };
    if (!g2.t0) g2.t0 = Date.now();
    const checked = maybeCheck(g2);
    setG(checked);
    if (checked.status === 'won') { postResult(checked, TOTAL); setJustWon(true); return; }
    say('Not quite. The red squares are wrong: fix them and check again.');
  }

  const nextWord = useCallback((fromIdx, d0, needEmpty, ls) => {
    // scan words after fromIdx (wrapping, switching direction) for the next
    // one with an empty square; else just the next word.
    const order = [];
    const aws = WORDS.map((w, i) => i).filter((i) => WORDS[i].dir === 'A');
    const dws = WORDS.map((w, i) => i).filter((i) => WORDS[i].dir === 'D');
    const seq = d0 === 'A' ? [...aws, ...dws] : [...dws, ...aws];
    const at = seq.indexOf(fromIdx);
    for (let k = 1; k <= seq.length; k++) order.push(seq[(at + k) % seq.length]);
    if (needEmpty) {
      for (const i of order) if (WORDS[i].cells.some((c) => ls[c] === '')) return i;
    }
    return order[0];
  }, [WORDS]);

  function selectWord(i, ls) {
    const w = WORDS[i];
    setDir(w.dir);
    const empty = w.cells.find((c) => (ls || letters)[c] === '');
    setCur(empty != null ? empty : w.cells[0]);
  }

  // step through the clue list in fixed Across-then-Down order
  function stepWord(delta) {
    const at = curWordIdx < 0 ? 0 : curWordIdx;
    selectWord((at + delta + WORDS.length) % WORDS.length);
  }

  function cellClick(idx) {
    if (!playing || isBlock(idx)) return;
    if (idx === cur) { setDir((d) => (d === 'A' ? 'D' : 'A')); return; }
    setCur(idx);
    if (wordOf[dir][idx] < 0) setDir(dir === 'A' ? 'D' : 'A');
  }

  function typeLetter(ch) {
    if (!playing) return;
    const g2 = { ...g, letters: g.letters.slice(), wrong: g.wrong.filter((i) => i !== cur) };
    g2.letters[cur] = ch;
    if (!g2.t0) g2.t0 = Date.now();
    // Filling the last square no longer judges the grid: the player turns it
    // in with Check grid (or Enter on a full grid), owner call 2026-09-22.
    const checked = g2;
    setG(checked);
    // advance: next empty square in this word, else next unfinished word
    const w = WORDS[wordOf[dir][cur]] || curWord;
    const pos = w.cells.indexOf(cur);
    for (let k = pos + 1; k < w.cells.length; k++) {
      if (checked.letters[w.cells[k]] === '') { setCur(w.cells[k]); return; }
    }
    const anyEmpty = solFlat.some((c, i) => c !== '#' && checked.letters[i] === '');
    if (!anyEmpty) return; // full grid: stay put, Check grid is the next move
    const ni = nextWord(wordOf[dir][cur], dir, true, checked.letters);
    selectWord(ni, checked.letters);
  }

  function backspace() {
    if (!playing) return;
    if (letters[cur]) {
      const g2 = { ...g, letters: g.letters.slice(), wrong: g.wrong.filter((i) => i !== cur) };
      g2.letters[cur] = '';
      setG(g2);
      return;
    }
    const w = curWord;
    const pos = w.cells.indexOf(cur);
    if (pos > 0) {
      const back = w.cells[pos - 1];
      const g2 = { ...g, letters: g.letters.slice(), wrong: g.wrong.filter((i) => i !== back) };
      g2.letters[back] = '';
      setG(g2);
      setCur(back);
    }
  }

  function moveCur(dr, dc) {
    let r = Math.floor(cur / N), c = cur % N;
    for (let k = 0; k < N; k++) {
      r += dr; c += dc;
      if (r < 0 || r >= N || c < 0 || c >= N) return;
      const i = r * N + c;
      if (!isBlock(i)) { setCur(i); return; }
    }
  }

  // one free hint: reveal the current square (or the word's first empty one)
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    let idx = letters[cur] === '' ? cur : -1;
    if (idx < 0) idx = curWord.cells.find((c) => letters[c] === '') ?? -1;
    if (idx < 0) { for (let i = 0; i < T; i++) if (!isBlock(i) && letters[i] === '') { idx = i; break; } }
    if (idx < 0) return;
    const g2 = { ...g, letters: g.letters.slice(), wrong: g.wrong.filter((i) => i !== idx), hintUsed: true };
    g2.letters[idx] = solFlat[idx];
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say('Hint used: one letter filled in for you.');
  }

  function revealEnd() {
    const score = wordsCorrect(g.letters);
    const g2 = { ...g, letters: solFlat.map((ch) => (ch === '#' ? '' : ch)), playerLetters: g.letters.slice(), wrong: [], status: 'revealed', tEnd: Date.now(), revealScore: score };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, score);
    setG(g2);
  }

  // Dismissing the start tile begins the clock (sets t0) and marks rules seen.
  // No-op once started, so re-reading rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(T)); setCur(WORDS[0].cells[0]); setDir('A'); setJustWon(false); setEndClosed(false);
  }

  // physical keyboard
  const onKey = useCallback((e) => {
    if (!playing || showHelp || showA2hsHelp) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); typeLetter(k.toUpperCase()); return; }
    if (k === 'Backspace') { e.preventDefault(); backspace(); return; }
    if (k === 'ArrowUp') { e.preventDefault(); moveCur(-1, 0); return; }
    if (k === 'ArrowDown') { e.preventDefault(); moveCur(1, 0); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); moveCur(0, -1); return; }
    if (k === 'ArrowRight') { e.preventDefault(); moveCur(0, 1); return; }
    if (k === ' ') { e.preventDefault(); setDir((d) => (d === 'A' ? 'D' : 'A')); return; }
    if (k === 'Enter' && solFlat.every((ch, i) => ch === '#' || letters[i] !== '')) { e.preventDefault(); checkGrid(); return; }
    if (k === 'Tab' || k === 'Enter') { e.preventDefault(); selectWord(nextWord(curWordIdx, dir, true, letters)); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, showHelp, showA2hsHelp, g, cur, dir, curWordIdx, letters]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    const g5 = won ? 5 : Math.max(0, Math.min(5, Math.round((finalScore / TOTAL) * 5)));
    const squares = '⬛'.repeat(g5) + '⬜'.repeat(5 - g5); // ink squares
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Emcee #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${elapsed}${g.checks === 0 ? ' · clean' : ` · ${g.checks} check${g.checks === 1 ? '' : 's'}`}${hintBit}${streakBit}`
      : `Emcee #${PUZZLE.num} · ${finalScore}/${TOTAL} words`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/emcee${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Emcee #${PUZZLE.num}: the daily mini crossword from Mind Loft.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    } catch (e) {}
  }

  const filledWord = (w) => w.cells.every((c) => letters[c] !== '');
  const clueRow = (w, i) => {
    const active = i === curWordIdx && playing;
    // the crossing clue through the selected square is outlined in the accent
    const cross = i === crossWordIdx && playing && !active;
    // a fully filled clue fades to muted text (colour, never opacity)
    const done = playing && !active && !cross && filledWord(w);
    return (
      <button key={`${w.dir}${w.n}`} type="button" onClick={() => { if (playing) selectWord(i); }}
        aria-current={active ? 'true' : undefined}
        className={`mc-cluerow${active ? ' on' : ''}${cross ? ' cross' : ''}${done ? ' done' : ''}`}>
        <span className="mc-cn">{w.n}</span>
        <span className="mc-ct">{w.clue}</span>
      </button>
    );
  };

  const kbRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  // Letter and number sizes follow the square, measured off the grid's own
  // width (container units), so one rule serves 5x5, 7x7, desktop and phone.
  const cellPx = `calc(100cqw / ${N} * ${N === 7 ? 0.42 : 0.43})`;
  const numPx = `max(9px, calc(100cqw / ${N} * 0.145))`;
  const wordsFilled = WORDS.reduce((k, w) => k + (filledWord(w) ? 1 : 0), 0);
  const checks = g.checks;
  // What the player finished with, in the same unit the game posts: words
  // correct. A win is every word by definition; a reveal stores the count it
  // was standing on. Only the cap reads this, and only once the game is over.
  const endScore = won ? TOTAL : (g.revealScore || 0);
  const filledCount = solFlat.reduce((k, ch, i) => k + (ch !== '#' && letters[i] !== '' ? 1 : 0), 0);
  const whiteCount = solFlat.reduce((k, ch) => k + (ch !== '#' ? 1 : 0), 0);

  // Shared rules body — rendered in both the how-to-play modal and the start tile.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Fill every square of the mini crossword from the numbered Across and Down clues."
      steps={[
        <><b>Tap a square</b> to select its word, tap it again to flip direction, then type. On a keyboard, <b>space</b> flips direction and <b>tab</b> jumps to the next clue.</>,
        <>When every square is filled, press <b>Check grid</b>. A perfect fill wins on the spot; a wrong one marks the misses in red.</>,
        <>A wrong fill marks the misses <b style={{ color: `var(--stg-ink, ${COLORS.rust})` }}>red</b> and counts a <b>check</b> against you.</>,
        <>One free <b>hint</b>, on your first ever play, reveals a letter.</>,
      ]}
      knack="Nothing is judged until you check, so read your shakiest word against its crossing clue before you turn the grid in."
      footer="Finish the grid for a full score. Ties break on fewest checks, then fastest time, so a clean quick solve is the crown. Sundays go bigger: a 7×7 grid."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : THEME.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="emcee" name="Emcee" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Mounted here, outside mc-wrap, so the band runs full bleed like the
          chrome above it. The figures are the same three the strip carried, and
          on a finish the set changes to the ones worth keeping: the score leads,
          and the date line becomes the verdict while the cap itself takes the
          outcome colour. */}
      {LOFT && (
        <Cap gameKey="emcee" quizId={PUZZLE.quizId}
          name="Emcee"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (endScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 7×7' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: checks, k: 'checks' },
            { v: `${filledCount}/${whiteCount}`, k: 'squares' },
          ] : [
            { v: `${endScore}/${TOTAL}`, k: 'words' },
            { v: checks, k: 'checks' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="mc-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.mc-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .mc-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .mc-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes mcshake{0%,100%{transform:translateX(0);}25%{transform:translateX(-3px);}75%{transform:translateX(3px);}}
          @media(max-width:560px){.mc-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.mc-ttl h1{font-size:21px;letter-spacing:0.02em;}.mc-ttl .mc-ttl-dt{font-size:15px;}.mc-ttl-dot{display:none;}}
          /* THE BOARD (round six, 2026-10-14). Every colour is a stage token
             with a paper fallback; the one value the tokens do not carry is
             the black square, which must be darker than the square in BOTH
             registers, so it is published here per register as --mc-blk. */
          .mc-wrap{--mc-blk:#05070d;--mc-soft:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 24%, var(--stg-cell, #fff));}
          html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light'] .mc-wrap{--mc-blk:#1e2433;--mc-soft:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 17%, var(--stg-cell, #fff));}
          .mc-prog{display:flex;flex-direction:column;gap:8px;margin:0 0 14px;}
          .mc-prog-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute, ${COLORS.faded});}
          .mc-prog-row b{color:var(--stg-acc-ink, ${COLORS.accent});font-weight:800;}
          .mc-segs{display:flex;gap:3px;}
          .mc-segs span{flex:1;height:8px;border-radius:2px;background:var(--stg-line2, rgba(28,30,36,0.2));}
          .mc-segs span.on{background:var(--stg-acc, ${COLORS.accent});}
          .mc-panel{background:var(--stg-surf, #fff);border:1px solid var(--stg-line, rgba(28,30,36,0.18));border-radius:20px;padding:22px 24px 16px;display:flex;flex-direction:column;align-items:center;}
          .mc-gridbox{width:100%;margin:0 auto;container-type:inline-size;}
          .mc-grid{--xw-cell:color-mix(in srgb, var(--stg-cell, #fff) 84%, #fff);display:grid;aspect-ratio:1;border-radius:8px;overflow:hidden;gap:1px;background:color-mix(in srgb, var(--stg-cell-line, rgba(28,30,36,0.4)), var(--stg-ink, #0b0d12) 25%);box-shadow:0 0 0 2.5px var(--stg-ink, ${COLORS.ink});}
          .mc-cell{display:flex;align-items:center;justify-content:center;font-family:${SANS};box-sizing:border-box;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;background:var(--xw-cell);}
          .mc-cell.mc-blk{background:var(--mc-blk);cursor:default;}
          .mc-cell.mc-inword{background:var(--mc-soft);}
          .mc-cell.mc-sel{background:var(--stg-acc, ${COLORS.accent});box-shadow:inset 0 0 0 3px var(--stg-ink, ${COLORS.ink});}
          .mc-ch{font-weight:800;line-height:1;padding-top:.22em;color:var(--stg-ink, ${COLORS.ink});}
          .mc-cell.mc-rev .mc-ch{color:var(--stg-mute, ${COLORS.faded});}
          .mc-cell.mc-sel .mc-ch,.mc-cell.mc-sel .mc-num{color:var(--stg-onramp, #fff);}
          .mc-cell.mc-wrongmark:not(.mc-sel){background:color-mix(in srgb, var(--stg-bad, ${COLORS.rust}) 16%, var(--xw-cell));}
          .mc-cell.mc-wrongmark:not(.mc-sel) .mc-ch{color:var(--stg-bad, ${COLORS.rust});}
          .mc-cell.mc-wrongmark{animation:mcshake .3s ease;}
          .mc-num{position:absolute;top:.4em;left:.55em;font-family:${SANS};font-weight:800;line-height:1;color:var(--stg-ink2, rgba(28,30,36,0.7));pointer-events:none;}
          .mc-bar{width:100%;margin-top:16px;display:flex;align-items:stretch;gap:8px;}
          .mc-step{flex:0 0 48px;min-height:52px;border-radius:12px;border:1.5px solid var(--stg-line2, rgba(28,30,36,0.35));background:transparent;color:var(--stg-ink2, ${COLORS.ink});font-family:${SANS};cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}
          .mc-step:hover{background:var(--stg-surf2, ${COLORS.paper});}
          .mc-clue{flex:1 1 auto;min-width:0;border:0;border-radius:12px;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);display:flex;align-items:center;gap:10px;padding:8px 14px;font-family:${SANS};text-align:left;cursor:pointer;}
          .mc-clue-k{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
          .mc-clue-t{font-size:17px;font-weight:800;line-height:1.25;}
          .mc-hint-line{align-self:flex-start;margin:8px 2px 0;font-family:${SANS};font-size:12px;font-weight:600;color:var(--stg-mute, ${COLORS.faded});}
          .mc-cols{width:100%;margin-top:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;}
          .mc-colhd{font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute, ${COLORS.faded});padding:0 10px 4px;}
          .mc-collist{display:flex;flex-direction:column;gap:4px;}
          .mc-cluerow{display:flex;gap:10px;align-items:baseline;width:100%;min-height:44px;box-sizing:border-box;padding:10px;border:1.5px solid transparent;border-radius:9px;cursor:pointer;background:transparent;font-family:${SANS};text-align:left;color:var(--stg-ink, ${COLORS.ink});}
          .mc-cluerow:hover{background:var(--stg-surf2, ${COLORS.paper});}
          .mc-cluerow .mc-cn{font-size:12px;font-weight:800;min-width:16px;color:var(--stg-mute, ${COLORS.faded});}
          .mc-cluerow .mc-ct{font-size:14px;font-weight:600;line-height:1.35;}
          .mc-cluerow.done{color:var(--stg-mute, ${COLORS.faded});}
          .mc-cluerow.cross{border-color:var(--stg-acc, ${COLORS.accent});}
          .mc-cluerow.on,.mc-cluerow.on:hover{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);}
          .mc-cluerow.on .mc-cn{color:var(--stg-onramp, #fff);}
          .mc-cluerow.on .mc-ct{font-weight:800;}
          .mc-acts{width:100%;margin-top:18px;display:flex;align-items:center;justify-content:flex-end;gap:10px;border-top:1px solid var(--stg-line, rgba(28,30,36,0.15));padding-top:14px;}
          .mc-acts-note{flex:1;font-family:${SANS};font-size:12px;font-weight:600;color:var(--stg-mute, ${COLORS.faded});}
          .mc-act{font-family:${SANS};font-size:14px;min-height:48px;border-radius:12px;padding:0 16px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
          .mc-act.ghost{font-weight:700;background:transparent;color:var(--stg-ink2, ${COLORS.ink});border:1.5px solid var(--stg-line2, rgba(28,30,36,0.35));}
          .mc-act.ghost:hover{background:var(--stg-surf2, ${COLORS.paper});}
          .mc-act.go{font-weight:800;padding:0 18px;border:0;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);}
          .mc-act.go:disabled{background:var(--stg-chip, #e4e9f1);color:var(--stg-mute, ${COLORS.faded});cursor:not-allowed;}
          .mc-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 2px 0;font-family:${SANS};font-size:12px;font-weight:600;color:var(--stg-mute, ${COLORS.faded});}
          .mc-reveal{background:none;border:0;padding:0 2px;min-height:44px;cursor:pointer;font-family:${SANS};font-size:12px;font-weight:700;color:var(--stg-ink2, ${COLORS.ink});text-decoration:underline;text-underline-offset:3px;white-space:nowrap;}
          .mc-reveal.armed{color:var(--stg-bad, ${COLORS.rust});white-space:normal;text-align:right;}
          .mc-kb{width:100%;margin-top:14px;display:flex;flex-direction:column;gap:6px;}
          .mc-kbrow{display:flex;justify-content:center;gap:5px;}
          .mc-key{font-family:${SANS};font-weight:800;font-size:16px;border:1px solid var(--stg-line, rgba(28,30,36,0.2));border-radius:7px;background:var(--stg-cell, #fff);color:var(--stg-ink, ${COLORS.ink});box-shadow:0 1px 0 var(--stg-line2, rgba(28,30,36,0.35));height:48px;flex:1 1 0;max-width:40px;min-width:0;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .mc-key.wide{flex:1.6 1 0;max-width:58px;}
          .mc-key:active{transform:translateY(1px);background:var(--stg-surf2, ${COLORS.paper});}
          @media(max-width:700px){
            .mc-prog{margin:0 8px 12px;gap:7px;}
            .mc-prog-row{font-size:10px;letter-spacing:.07em;}
            .mc-segs{gap:2px;}
            .mc-segs span{height:6px;}
            .mc-panel{background:transparent;border:0;border-radius:0;padding:0;}
            .mc-bar{margin-top:14px;gap:6px;padding:0 4px;box-sizing:border-box;}
            .mc-step{flex-basis:44px;min-height:54px;}
            .mc-clue{flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;padding:6px 12px;}
            .mc-clue-k{font-size:10px;}
            .mc-hint-line{margin:8px 8px 0;}
            .mc-cols{grid-template-columns:1fr;gap:12px;margin-top:12px;padding:0 4px;box-sizing:border-box;}
            .mc-acts{border-top:0;padding:0 4px;margin-top:12px;box-sizing:border-box;}
            .mc-acts .mc-act{flex:1;}
            .mc-acts .mc-act.go{flex:1.4;}
            .mc-acts-note{display:none;}
            .mc-foot{padding:10px 8px 0;}
            .mc-kb{padding:0 2px;box-sizing:border-box;}
          }
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip: quiet nav + player chip */}

        {/* masthead: pressed EMCEE tiles with No./date inline — M and C lit (M.C.) */}
        {!LOFT && (
        <DailyMasthead
          slug="emcee"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${THEME.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 7&times;7</span>}
          blocks={'EMCEE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 || i === 2 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: THEME.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which runs
            full bleed and fills the first screen, so the board is the one lit
            object on the page while the clock is running. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* start tile — the grid and clues stay sealed until Start begins the clock */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '22px', display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Emcee is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>A mini crossword: fill every square from the numbered Across and Down clues.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="mc-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : THEME.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : THEME.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        {/* the board: progress, one panel (grid, clue bar, clue lists, actions), foot */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : `var(--stg-surf, ${THEME.white})`, border: STAGE ? 0 : `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: STAGE ? 0 : '13px 15px 15px', marginBottom: 12 }}>
          {/* These three figures move UP into the cap on a loft page. Printing
              them in both places is the one thing to avoid: the cap exists to
              give the board this row back. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>checks <b style={{ color: checks > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})` }}>{checks}</b></span>
          </div>
          )}

          {/* progress: squares filled, a segment per square, words filled */}
          {playing && (
            <div className="mc-prog">
              <div className="mc-prog-row">
                <span>{PUZZLE.sunday ? 'Sunday' : 'The mini'} &middot; <b>{filledCount}</b> of {whiteCount} squares</span>
                <span>{wordsFilled} of {TOTAL} words filled</span>
              </div>
              <div className="mc-segs" aria-hidden="true">
                {Array.from({ length: whiteCount }).map((_, i) => <span key={i} className={i < filledCount ? 'on' : undefined} />)}
              </div>
            </div>
          )}

          <div className="mc-panel">
            {/* the grid */}
            <div className="mc-gridbox" style={{ maxWidth: N === 7 ? 476 : 420 }}>
              <div className="mc-grid" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${N}, minmax(0, 1fr))` }}>
                {Array.from({ length: T }).map((_, idx) => {
                  if (isBlock(idx)) return <div key={idx} className="mc-cell mc-blk" />;
                  const inWord = playing && curWord.cells.includes(idx);
                  const sel = playing && idx === cur;
                  const wrongMark = g.wrong.includes(idx);
                  const revealMiss = g.status === 'revealed';
                  return (
                    <div key={idx}
                      className={`mc-cell${inWord && !sel ? ' mc-inword' : ''}${sel ? ' mc-sel' : ''}${wrongMark ? ' mc-wrongmark' : ''}${revealMiss ? ' mc-rev' : ''}`}
                      onClick={() => cellClick(idx)}>
                      {numAt[idx] != null && <span className="mc-num" style={{ fontSize: numPx }}>{numAt[idx]}</span>}
                      <span className="mc-ch" style={{ fontSize: cellPx }}>{viewLetters[idx]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* the active clue: previous, the clue in the accent, next */}
            {playing && (
              <div className="mc-bar" style={{ maxWidth: N === 7 ? 476 : 420 }}>
                <button type="button" aria-label="Previous clue" onClick={() => stepWord(-1)} className="mc-step">
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
                <button type="button" className="mc-clue"
                  aria-expanded={mobileUi ? cluesOpen : undefined}
                  title={mobileUi ? (cluesOpen ? 'Hide the clue list' : 'Show every clue') : 'Flip Across and Down'}
                  onClick={() => { if (mobileUi) setCluesOpen((v) => !v); else setDir((d) => (d === 'A' ? 'D' : 'A')); }}>
                  <span className="mc-clue-k">{curWord.n} {curWord.dir === 'A' ? 'Across' : 'Down'}</span>
                  <span className="mc-clue-t">{curWord.clue}</span>
                </button>
                <button type="button" aria-label="Next clue" onClick={() => stepWord(1)} className="mc-step">
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>
            )}
            {playing && mobileUi && (
              <span className="mc-hint-line">
                {cluesOpen ? 'Tap the clue to hide the list.' : `Tap the clue to see all ${TOTAL}.`} Tap a square again to turn {dir === 'A' ? 'Down' : 'Across'}.
              </span>
            )}

            {/* Across and Down, side by side. On a phone with the on-screen
                keyboard they sit behind the clue bar, one tap away. */}
            {(!playing || !mobileUi || cluesOpen) && (
              <div className="mc-cols">
                <div className="mc-collist">
                  <div className="mc-colhd">Across</div>
                  {WORDS.map((w, i) => (w.dir === 'A' ? clueRow(w, i) : null))}
                </div>
                <div className="mc-collist">
                  <div className="mc-colhd">Down</div>
                  {WORDS.map((w, i) => (w.dir === 'D' ? clueRow(w, i) : null))}
                </div>
              </div>
            )}

            {/* on-screen keyboard (mobile): QWERTY, flip direction, delete */}
            {playing && mobileUi && (
              <div className="mc-kb">
                {kbRows.map((row, ri) => (
                  <div key={ri} className="mc-kbrow">
                    {ri === 2 && (
                      <button type="button" aria-label="Flip direction" className="mc-key wide" onClick={() => setDir((d) => (d === 'A' ? 'D' : 'A'))}><ArrowLeftRight size={18} strokeWidth={2.5} /></button>
                    )}
                    {row.split('').map((ch) => (
                      <button type="button" key={ch} className="mc-key" onClick={() => typeLetter(ch)}>{ch}</button>
                    ))}
                    {ri === 2 && (
                      <button type="button" aria-label="Delete" className="mc-key wide" onClick={backspace}><Delete size={18} strokeWidth={2.5} /></button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {playing && (() => {
              const full = solFlat.every((ch, i) => ch === '#' || letters[i] !== '');
              return (
                <div className="mc-acts">
                  {!mobileUi && <span className="mc-acts-note">Space flips direction. Tab jumps to the next clue.</span>}
                  {hintOk && !g.hintUsed && (
                    <button type="button" className="mc-act ghost" onClick={useHint} title="Reveal one letter (one hint, first play only)">
                      {mobileUi ? 'Hint' : 'Hint · one letter'}
                    </button>
                  )}
                  <button type="button" className="mc-act go" onClick={checkGrid} disabled={!full}
                    title={full ? 'Turn in the grid' : 'Fill every square to check the grid'}>
                    Check grid
                  </button>
                </div>
              );
            })()}
          </div>

          {/* the foot: how Check works, and the small Reveal link */}
          {started && (
            <div className="mc-foot">
              <span>Check unlocks when every square is filled. A wrong check marks the misses.</span>
              {identity && (g.t0 || checks > 0) && (
                <button type="button" className={`mc-reveal${armReveal ? ' armed' : ''}`}
                  onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}>
                  {armReveal ? 'Tap again to end the puzzle and show the answers' : 'Reveal'}
                </button>
              )}
            </div>
          )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0', padding: '0 4px' }}>
              {isTodays ? (
                <>
                  {countdown ? <>Next Emcee in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new grid drops at midnight Eastern.'}
                  {prevPuzzle && (
                    <>
                      {' '}Meanwhile:{' '}
                      <a href={`/emcee?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                        play yesterday&rsquo;s Emcee &rarr;
                      </a>
                    </>
                  )}
                </>
              ) : (
                <>
                  You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                  <a href="/emcee" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Emcee &rarr;</a>
                  {' · '}
                  <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
                </>
              )}
            </p>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
        </div>
        )}
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Emcee"
            catRank={catRank}
            outcome={won ? 'won' : (endScore > 0 ? 'part' : 'lost')}
            title={won ? 'Solved' : (endScore > 0 ? 'Partly solved' : 'Not solved')}
            detail={`${endScore}/${TOTAL} \u00b7 ${checks} checks \u00b7 ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Emcee all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            missLabel="Checks"
            archive={puzzles
              .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
              .sort((x, y) => y.num - x.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/emcee?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Emcee', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/emcee?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>

        {/* end of the navy play stage. Everything below is the light tail:
            the result line, the games grid and the leaderboard panel, all
            unchanged from a non-loft page. */}
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="emcee" name="Emcee" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="emcee" name="Emcee" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="emcee"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="emcee" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${THEME.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : THEME.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Emcee to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s grid, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s grid, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: THEME.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
        </div>

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="emcee"
          won={won}
          headline={won ? <>Grid solved!</> : <>You scored {Math.round((finalScore / TOTAL) * 100)}%</>}
          subline={<>{won
            ? <>{TOTAL}/{TOTAL} words &middot; {checks === 0 ? 'clean solve' : `${checks} check${checks === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>{finalScore}/{TOTAL} words &middot; the finished grid is shown above</>}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: THEME.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* help modal */}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="mc-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: THEME.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Emcee — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Emcee</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Emcee is a free daily mini crossword from Mind Loft. Say the name fast and you&rsquo;ll hear the initials, M.C., because that&rsquo;s all it is: a proper mini crossword, five squares by five, with numbered Across and Down clues and a timer that only stops when the grid is right.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The words are everyday words and the clues play fair, so most grids fall in a minute or two, the puzzle is speed and cleanliness. Fill every square and press Check grid: wrong squares turn red and each failed check counts against you on the leaderboard, where ties break on fewest checks and then fastest time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new grid drops every day at midnight Eastern, and Sundays go bigger with a 7&times;7 pinwheel. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More word puzzles: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, our word-grouping puzzle, and <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our daily unscramble.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
