'use client';

// Encore — the daily crossword. Encore is the mini you do in a minute; Encore is
// the one you sit down with.
//
// A 9x9 on weekdays (around 26 answers) and an 11x11 Sunday Edition (around
// 44), numbered Across and Down clues, and a timer. Tap a square to select its
// word, tap again to flip direction, and type. Fill every square and press Check
// grid: a perfect fill wins, a wrong one marks the
// misses in red and counts a CHECK against you. Score is words correct out of
// the word count, so finishing the grid is a full score, with ties on the daily
// board broken by fewest checks and then time. One free hint reveals a letter.
//
// Everything below the game rules is the shared daily plumbing, identical to
// Encore's: banked puzzles gated by Eastern date on the server
// (app/encore/page.js), per-puzzle localStorage saves, /encore?p=N archive
// pinning, streaks and stats, and the shared /api/quiz/* board flow. The one
// place the two genuinely differ is SIZE: every measurement here is derived
// from PUZZLE.size rather than hardcoded, because an 11x11 grid plus an
// on-screen keyboard has to fit a phone.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Lightbulb, Eye, Smartphone, ChevronLeft, ChevronRight, Delete, Check } from 'lucide-react';
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
  accent: '#1d4ed8',       // Encore identity — the deep blue
  accentSoft: '#eff6ff',
  green: THEME.successDeep,
  greenSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_encore_help_seen';
const STATS_KEY = 'sot_encore_stats';

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

export default function EncoreClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.size;
  const T = N * N;
  // `rev` busts the saved board when a LIVE puzzle's grid or words change, so an
  // in-flight save can't bleed its old letters onto the new grid (the whole bank
  // from #28 on was rebuilt mid-day 2026-08-12). Bump rev in puzzles.js, never
  // edit a live grid without it. Stats stay keyed on num, so streaks survive.
  const REV = PUZZLE.rev ? `r${PUZZLE.rev}` : '';
  const STORE_KEY = `sot_encore_${PUZZLE.num}${REV}`;
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('encore', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('encore'); }, [g.hintUsed]);
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
  const LOFT = isLoft('encore');
  const STAGE = isStage('encore', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('encore');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('encore'), '--stg-acc-lt': gameColorLight('encore'), '--stg-onramp-lt': gameOnrampLight('encore'), '--stg-acc-ink-lt': gameAccentInkLight('encore') };
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_encore_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_encore_day'); })();
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
  const iq = useIqStanding({ game: 'encore', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'encore', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'encore', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'encore', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'encore', active: LOFT && !playing });
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

  const REC_KEY = `sot_encore_rec_${PUZZLE.num}${REV}`;
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
    say('Hint used — one letter filled in for you.');
  }

  function revealEnd() {
    const score = wordsCorrect(g.letters);
    const g2 = { ...g, letters: solFlat.map((ch) => (ch === '#' ? '' : ch)), wrong: [], status: 'revealed', tEnd: Date.now(), revealScore: score };
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
      ? `Encore #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${elapsed}${g.checks === 0 ? ' · clean' : ` · ${g.checks} check${g.checks === 1 ? '' : 's'}`}${hintBit}${streakBit}`
      : `Encore #${PUZZLE.num} · ${finalScore}/${TOTAL} words`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/encore${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Encore #${PUZZLE.num} — the daily crossword from Mind Loft.\n${shareUrl()}`
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
    // the crossing clue through the selected square gets a faint secondary highlight
    const cross = i === crossWordIdx && playing && !active;
    return (
      <button key={`${w.dir}${w.n}`} onClick={() => { if (playing) selectWord(i); }}
        className="ec-cluerow"
        style={{ background: active ? (STAGE ? FEED_STRONG : COLORS.accentSoft) : (cross ? (STAGE ? FEED_SOFT : 'rgba(29,78,216,0.03)') : 'none'), borderLeft: active ? `3px solid ${STAGE ? FEED_STRONG_INK : COLORS.accent}` : (cross ? `3px solid ${STAGE ? FEED_STRONG : 'rgba(29,78,216,0.18)'}` : '3px solid transparent'), opacity: active || cross || !playing || !filledWord(w) ? 1 : 0.45 }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 500, color: active ? (STAGE ? FEED_STRONG_INK : COLORS.accent) : (cross ? (STAGE ? FEED_SOFT_INK : 'rgba(30,64,175,0.5)') : `var(--stg-mute, ${COLORS.faded})`), minWidth: 18, textAlign: 'right' }}>{w.n}</span>
        <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: active && STAGE ? FEED_STRONG_INK : INK, lineHeight: 1.35, textAlign: 'left' }}>{w.clue}</span>
      </button>
    );
  };

  const kbRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  // Sizes are derived from N, not hardcoded. An 11x11 Sunday grid has to sit
  // above an on-screen keyboard on a 390px phone, so the letter and the little
  // clue number both shrink with the grid rather than being tuned for one size.
  const cellPx = N >= 11 ? 'clamp(12px, 3.3vw, 21px)' : 'clamp(15px, 4.1vw, 25px)';
  const numPx = N >= 11 ? 7.5 : 9.5;
  const boardMax = N >= 11 ? 560 : 480;
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
      lead="Fill every square of the crossword from the numbered Across and Down clues."
      steps={[
        <><b>Tap a square</b> to select its word, tap it again to flip direction, then type. On a keyboard, <b>space</b> flips direction and <b>tab</b> jumps to the next clue.</>,
        <>When every square is filled, press <b>Check grid</b>. A perfect fill wins on the spot; a wrong one marks the misses in red.</>,
        <>A wrong fill marks the misses <b style={{ color: `var(--stg-ink, ${COLORS.rust})` }}>red</b> and counts a <b>check</b> against you.</>,
        <>One free <b>hint</b>, on your first ever play, reveals a letter.</>,
      ]}
      knack="Nothing is judged until you check, so read your shakiest word against its crossing clue before you turn the grid in."
      footer="Finish the grid for a full score. Ties break on fewest checks, then fastest time, so a clean solve is the crown. Weekdays are nine by nine; the Sunday Edition runs eleven by eleven."
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
      <DailyChrome slug="encore" name="Encore" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Mounted here, outside ec-wrap, so the band runs full bleed like the
          chrome above it. The figures are the same three the strip carried, and
          on a finish the set changes to the ones worth keeping: the score leads,
          and the date line becomes the verdict while the cap itself takes the
          outcome colour. */}
      {LOFT && (
        <Cap gameKey="encore" quizId={PUZZLE.quizId}
          name="Encore"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (endScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition \u00b7 11\u00d711' : null}
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
      <div className="ec-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ec-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ec-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ec-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes ecshake{0%,100%{transform:translateX(0);}25%{transform:translateX(-3px);}75%{transform:translateX(3px);}}
          @media(max-width:560px){.ec-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ec-ttl h1{font-size:21px;letter-spacing:0.02em;}.ec-ttl .ec-ttl-dt{font-size:15px;}.ec-ttl-dot{display:none;}}
          .ec-cell{display:flex;align-items:center;justify-content:center;font-family:${SANS};box-sizing:border-box;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;background:${STAGE ? 'var(--stg-cell)' : 'var(--white)'};}
          .ec-cell.ec-blk{background:${COLORS.ink};cursor:default;}
          .ec-cell.ec-inword{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 26%, var(--stg-cell))' : 'color-mix(in srgb, ' + COLORS.accent + ' 16%, transparent)'};}
          .ec-cell.ec-sel{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 38%, var(--stg-cell))' : '#dbeafe'};box-shadow:inset 0 0 0 2px var(--stg-acc, ${COLORS.accent});}
          .ec-cell.ec-wrongmark span{color:${COLORS.rust};}
          .ec-cell.ec-wrongmark{animation:ecshake .3s ease;}
          .ec-num{position:absolute;top:1px;left:3px;font-family:${MONO};font-weight:${STAGE ? 700 : 500};color:var(--stg-ink2, rgba(28,30,36,0.55));pointer-events:none;}
          .ec-cell.ec-inword .ec-num,.ec-cell.ec-sel .ec-num{color:var(--stg-ink, rgba(28,30,36,0.75));}
          .ec-cluerow{display:flex;gap:8px;align-items:flex-start;width:100%;padding:6px 8px 6px 6px;border:none;border-radius:0 7px 7px 0;cursor:pointer;background:none;}
          .ec-cluerow:hover{background:var(--stg-surf2, ${COLORS.paper});}
          .ec-key{font-family:${SANS};font-weight:800;font-size:15px;border:none;border-radius:6px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};box-shadow:0 2px 0 rgba(28,30,36,0.35);border: 1.5px solid var(--stg-line, rgba(28,30,36,0.4));height:44px;flex:1 1 0;min-width:0;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .ec-key:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(28,30,36,0.35);}
          .ec-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .ec-cols{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;}
          @media(max-width:560px){.ec-cols{grid-template-columns:1fr;}}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip: quiet nav + player chip */}

        {/* masthead: pressed ENCORE tiles with No./date inline — M and C lit (M.C.) */}
        {!LOFT && (
        <DailyMasthead
          slug="encore"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${THEME.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 11&times;11</span>}
          blocks={'ENCORE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 21, background: i === 0 || i === 5 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: THEME.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Encore is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>The big grid: fill every square from the numbered Across and Down clues.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ec-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : THEME.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : THEME.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
        {/* the board */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: `var(--stg-surf, ${THEME.white})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These three figures move UP into the cap on a loft page. Printing
              them in both places is the one thing to avoid: the cap exists to
              give the board this row back. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>checks <b style={{ color: checks > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{checks}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>squares <b style={{ color: filledCount === whiteCount ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{filledCount}</b>/{whiteCount}</span>
          </div>
          )}

          {/* the grid */}
          <div style={{ maxWidth: boardMax, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`, aspectRatio: '1', border: `2.5px solid var(--stg-cell-line, rgba(28,30,36,0.85))`, borderRadius: 4, overflow: 'hidden', gap: STAGE ? 2 : 1, background: 'var(--stg-cell-line, rgba(28,30,36,0.28))' }}>
              {Array.from({ length: T }).map((_, idx) => {
                if (isBlock(idx)) return <div key={idx} className="ec-cell ec-blk" />;
                const inWord = playing && curWord.cells.includes(idx);
                const sel = playing && idx === cur;
                const wrongMark = g.wrong.includes(idx);
                const revealMiss = g.status === 'revealed';
                return (
                  <div key={idx}
                    className={`ec-cell${inWord && !sel ? ' ec-inword' : ''}${sel ? ' ec-sel' : ''}${wrongMark ? ' ec-wrongmark' : ''}`}
                    onClick={() => cellClick(idx)}>
                    {numAt[idx] != null && <span className="ec-num" style={{ fontSize: numPx }}>{numAt[idx]}</span>}
                    <span style={{ fontSize: cellPx, fontWeight: 800, color: revealMiss ? `var(--stg-mute, ${COLORS.faded})` : `var(--stg-ink, ${COLORS.ink})` }}>{letters[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* current clue bar */}
          {playing && (
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, maxWidth: boardMax, margin: '12px auto 0' }}>
              <button aria-label="Previous clue" onClick={() => stepWord(-1)} className="ec-tool" style={{ padding: '7px 8px' }}>
                <ChevronLeft size={15} />
              </button>
              <div onClick={() => setDir((d) => (d === 'A' ? 'D' : 'A'))} style={{ flex: '1 1 auto', background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `1.5px solid rgba(29,78,216,0.4)`, borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: ACC_INK, whiteSpace: 'nowrap' }}>{curWord.n}{curWord.dir === 'A' ? 'A' : 'D'}</span>
                <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3 }}>{curWord.clue}</span>
              </div>
              <button aria-label="Next clue" onClick={() => stepWord(1)} className="ec-tool" style={{ padding: '7px 8px' }}>
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* on-screen keyboard (mobile) */}
          {playing && mobileUi && (
            <div style={{ maxWidth: boardMax, margin: '12px auto 0' }}>
              {kbRows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 4, marginTop: ri ? 5 : 0, padding: ri === 1 ? '0 12px' : 0 }}>
                  {row.split('').map((ch) => (
                    <button key={ch} className="ec-key" onClick={() => typeLetter(ch)}>{ch}</button>
                  ))}
                  {ri === 2 && (
                    <button aria-label="Delete" className="ec-key" style={{ flex: '1.6 1 0' }} onClick={backspace}><Delete size={17} /></button>
                  )}
                </div>
              ))}
            </div>
          )}

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && (
                <button className="ec-tool" onClick={useHint} title="Reveal one letter (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(29,78,216,0.5)', color: '#1e3a8a' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
              {(() => {
                const full = solFlat.every((ch, i) => ch === '#' || letters[i] !== '');
                return (
                  <button className="ec-tool" onClick={checkGrid} disabled={!full}
                    title={full ? 'Turn in the grid' : 'Fill every square to check the grid'}
                    style={full
                      ? { background: `var(--stg-acc, #1d4ed8)`, borderColor: `var(--stg-acc, #1d4ed8)`, color: `var(--stg-onramp, #fff)` }
                      : { opacity: 0.55, cursor: 'not-allowed' }}>
                    <Check size={14} /> Check grid
                  </button>
                );
              })()}
              {!mobileUi && (
                <span className="ec-tool" style={{ cursor: 'default', borderStyle: 'dashed', color: FADED }}>
                  Type to fill &middot; space flips Across/Down &middot; tab jumps &middot; enter checks a full grid
                </span>
              )}
            </div>
          )}
        </div>
        )}

        {/* clue lists */}
        {!preStart && (
        <div className={LOFT && !STAGE ? 'loft-card' : undefined} style={{ background: `var(--stg-surf, ${THEME.white})`, border: '1.5px solid rgba(20,22,28,0.12)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div className="ec-cols">
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, margin: '0 0 6px 6px' }}>Across</div>
              {WORDS.map((w, i) => (w.dir === 'A' ? clueRow(w, i) : null))}
            </div>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, margin: '0 0 6px 6px' }}>Down</div>
              {WORDS.map((w, i) => (w.dir === 'D' ? clueRow(w, i) : null))}
            </div>
          </div>

          {/* Controls. These live INSIDE the clue card rather than under it:
              on the navy stage a bare row of faded text has nothing to sit on
              and is close to unreadable, and "the card is the game" means the
              things you act on belong on the lit surface with the board. */}
          {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(20,22,28,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
              Fill the grid from the clues, then press Check grid. Wrong squares turn red, and every failed check counts on the board.
            </span>
            {identity && (g.t0 || checks > 0) && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows the answers' : 'Reveal & end'}
              </button>
            )}
          </div>
          )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
            <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
              {isTodays ? (
                <>
                  {countdown ? <>Next Encore in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new grid drops at midnight Eastern.'}
                  {prevPuzzle && (
                    <>
                      {' '}Meanwhile:{' '}
                      <a href={`/encore?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                        play yesterday&rsquo;s Encore &rarr;
                      </a>
                    </>
                  )}
                </>
              ) : (
                <>
                  You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                  <a href="/encore" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Encore &rarr;</a>
                  {' · '}
                  <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                </>
              )}
            </p>
            </>
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
            name="Encore"
            catRank={catRank}
            outcome={won ? 'won' : (endScore > 0 ? 'part' : 'lost')}
            title={won ? 'Solved' : (endScore > 0 ? 'Partly solved' : 'Not solved')}
            detail={`${endScore}/${TOTAL} \u00b7 ${checks} checks \u00b7 ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Encore all time` : 'all-time rank' }
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
                href: `/encore?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Encore', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/encore?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="encore" name="Encore" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="encore" name="Encore" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="encore"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="encore" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${THEME.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : THEME.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Encore to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s grid, every day.</li>
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
          self="encore"
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
            <button className="ec-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: THEME.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Encore — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Encore</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Encore is a free daily crossword from Mind Loft, and it is the long one. Nine squares by nine on weekdays, with around twenty-six numbered Across and Down answers, so it asks for a few minutes rather than a few seconds. If you want the sprint version, that is <a href="/emcee" style={{ color: INK, fontWeight: 800 }}>Emcee</a>, our five by five mini.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every grid is fully checked, which means every letter you write belongs to both an Across answer and a Down one, so a crossing always confirms you. The words are everyday words and the clues play fair. Fill every square and press Check grid: wrong squares turn red and each failed check counts against you on the leaderboard, where ties break on fewest checks and then fastest time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new grid drops every day at midnight Eastern, and the Sunday Edition steps up to eleven by eleven with around forty-four answers. No app, no signup, play free in your browser, keep a streak and race the daily leaderboard. More word puzzles: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, our word-grouping puzzle, and <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our daily unscramble.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
