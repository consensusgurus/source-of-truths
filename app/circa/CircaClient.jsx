'use client';

// Circa — the daily year hunt.
//
// One historical moment a day. Type a year (1000 to now) and get hot-and-cold
// feedback: an arrow that says earlier or later, and a heat band that says how
// close you are. Six guesses. Land within three years and the moment is placed
// — that's "circa", and it counts. Hit the exact year for a dead-on finish.
// Score starts at 10 for a first-guess exact and drops one per extra guess
// (a circa finish costs one more); ties on the daily board break by fewest
// guesses, then fastest time. One free hint reveals the century.
//
// Same daily plumbing as Suds/Tally/Span: banked moments gated by Eastern date
// on the server (app/circa/page.js), per-puzzle localStorage saves, /circa?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.
// Sundays are the same hunt with a trickier moment to place.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, RotateCcw, X, Lightbulb, Eye, Smartphone, ArrowUp, ArrowDown, Target } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
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
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#0e7490',       // Circa identity — aged-ink teal
  accentSoft: '#e8f7fa',
  green: T.successDeep,        // solved / dead on
  greenSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const HELP_KEY = 'sot_circa_help_seen';
const STATS_KEY = 'sot_circa_stats';

const YR_MIN = 1000;
const MAX_GUESSES = 6;
const SNAP = 3; // within this many years = "circa" — it counts as solved

// heat bands by |guess - year|, after the win checks (0 exact, <=SNAP circa)
const BANDS = [
  { max: 10, key: 'hot', label: 'within 10 years', color: '#9a3d0c', bg: '#ffedd5', border: 'rgba(234,88,12,0.55)', sq: '\u{1F7E7}' },
  { max: 50, key: 'warm', label: 'within 50 years', color: '#92610b', bg: '#fef3c7', border: 'rgba(217,119,6,0.5)', sq: '\u{1F7E8}' },
  { max: 200, key: 'cool', label: 'within 200 years', color: '#0a1730', bg: '#dbeafe', border: 'rgba(14,29,64,0.45)', sq: '\u{1F7E6}' },
  { max: Infinity, key: 'cold', label: 'over 200 years off', color: '#475569', bg: '#e2e8f0', border: 'rgba(71,85,105,0.4)', sq: '⬜' },
];
const bandOf = (diff) => BANDS.find((b) => diff <= b.max);

// A heat row is a PALE literal fill, so on the dark stage it carried the
// stage's near-white ink and the guessed year measured 1.04:1 (owner report,
// 2026-09-01). On the stage the band becomes an edge rather than a fill: its
// own hue at 13% over the raised surface, with the hue as the label colour.
// Ported from Ping's bandSkin, which is the same game with distances.
const STAGE_HUE = { hot: 'var(--stg-bad)', warm: 'var(--stg-warn)', cool: 'var(--stg-cool)', cold: 'var(--stg-mute)' };
function bandSkin(b, stage) {
  if (!stage) return { bg: b.bg, border: b.border, color: b.color };
  const h = STAGE_HUE[b.key] || 'var(--stg-acc-ink)';
  return {
    bg: `color-mix(in srgb, ${h} 13%, var(--stg-raise))`,
    border: `color-mix(in srgb, ${h} 48%, transparent)`,
    color: h,
  };
}

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

// ─── Personal stats + streak (localStorage), Suds/Tally pattern ─────────────
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
    const sc = Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    guesses: [],                // years guessed, in order
    hintUsed: false,
    status: 'playing',          // playing | won | revealed
    started: false,             // false until Start is pressed — keeps the moment covered
    t0: null,
    tEnd: null,
  };
}

export default function CircaClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const YEAR = PUZZLE.year;
  const STORE_KEY = `sot_circa_${PUZZLE.num}`;
  const yrMax = useMemo(() => Number(etToday().slice(0, 4)), []);

  const [g, setG] = useState(freshState);
  const [val, setVal] = useState('');
  const [showHelp, setShowHelp] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('circa', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('circa'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const inputRef = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  // idle = fresh puzzle, Start not yet pressed: the moment stays covered and the
  // clock is not running. Note an idle puzzle still has status 'playing', so the
  // end-of-puzzle branches below (which all key off !playing) are unaffected.
  const idle = playing && !g.started;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('circa');
  const STAGE = isStage('circa', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('circa');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('circa'), '--stg-acc-lt': gameColorLight('circa'), '--stg-onramp-lt': gameOnrampLight('circa'), '--stg-acc-ink-lt': gameAccentInkLight('circa') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const won = g.status === 'won';
  const guesses = g.guesses;
  const lastGuess = guesses.length ? guesses[guesses.length - 1] : null;
  const exact = won && lastGuess === YEAR;

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
        if (saved && saved.v === 1 && Array.isArray(saved.guesses)) {
          const merged = { ...freshState(), ...saved };
          // A puzzle already underway — or any save written before the Start gate
          // shipped — resumes straight to the board. The gate is only ever shown
          // for a genuinely fresh start.
          if (!merged.started && (merged.guesses.length || merged.hintUsed || merged.t0 || merged.status !== 'playing')) merged.started = true;
          setG(merged);
        }
      }
      if (!localStorage.getItem(HELP_KEY)) setShowHelp(true);
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_circa_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_circa_day'); })();
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
              setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
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
  const iq = useIqStanding({ game: 'circa', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'circa', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'circa', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'circa', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'circa', active: LOFT && !playing });
  // Retired (owner ruling 2026-07-20): once the final banked day (No. 7) is in
  // the past, no new puzzle drops — surface that before play, not just after.
  const gameRetired = pickPuzzle(puzzles, null).live < etToday();
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const finalScore = won ? Math.max(1, (exact ? 11 : 10) - guesses.length) : 0;

  // known bounds from the misses so far (never derived from the win guess)
  const bounds = useMemo(() => {
    let lo = null, hi = null;
    for (const y of guesses) {
      if (y < YEAR && (lo == null || y > lo)) lo = y;
      if (y > YEAR && (hi == null || y < hi)) hi = y;
    }
    return { lo, hi };
  }, [guesses, YEAR]);

  const REC_KEY = `sot_circa_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!g.t0 || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - g.t0) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.guesses.length, won: score === 10 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = guesses, so the daily leaderboard (score, then guesses,
        // then time) resolves ties by fewest guesses and then fastest finish.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.guesses.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // The Start gate. The moment is covered until this fires, and the clock starts
  // HERE rather than on the first guess — so time spent looking the answer up is
  // time on the board, which is what makes the gate worth having.
  function startGame() {
    if (!idle) return;
    setG({ ...g, started: true, t0: Date.now() });
    if (!mobileUi) setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 0);
  }

  function submitGuess() {
    if (!playing) return;
    const y = parseInt(val, 10);
    if (!Number.isInteger(y) || String(val).trim().length < 3 || y < YR_MIN || y > yrMax) {
      say(`Enter a year between ${YR_MIN} and ${yrMax}.`);
      return;
    }
    if (guesses.includes(y)) { say(`You already tried ${y}.`); return; }
    if (bounds.lo != null && y <= bounds.lo) { say(`You know it's after ${bounds.lo}.`); return; }
    if (bounds.hi != null && y >= bounds.hi) { say(`You know it's before ${bounds.hi}.`); return; }
    const g2 = { ...g, guesses: [...guesses, y] };
    if (!g2.t0) g2.t0 = Date.now();
    setVal('');
    const diff = Math.abs(y - YEAR);
    if (diff <= SNAP) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      postResult(g2, Math.max(1, (diff === 0 ? 11 : 10) - g2.guesses.length));
      setG(g2);
      setJustWon(true);
      return;
    }
    if (g2.guesses.length >= MAX_GUESSES) {
      g2.status = 'revealed';
      g2.tEnd = Date.now();
      postResult(g2, 0);
      setG(g2);
      return;
    }
    setG(g2);
    if (!mobileUi) { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }
  }

  // one free hint: reveal the century
  const centuryLabel = `the ${Math.floor(YEAR / 100) * 100}s`;
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const g2 = { ...g, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say(`Hint: it happened in ${centuryLabel}.`);
  }

  function revealEnd() {
    const g2 = { ...g, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setVal(''); setJustWon(false); setEndClosed(false);
  }

  function rowFor(y, i) {
    const isWin = g.status !== 'playing' && i === guesses.length - 1 && Math.abs(y - YEAR) <= SNAP;
    const diff = Math.abs(y - YEAR);
    if (isWin) {
      return {
        win: true, exact: diff === 0,
        label: diff === 0 ? 'dead on!' : `circa — ${diff} year${diff === 1 ? '' : 's'} off`,
        color: STAGE ? 'var(--stg-good)' : '#166534',
        bg: STAGE ? 'color-mix(in srgb, var(--stg-good) 15%, var(--stg-raise))' : COLORS.greenSoft,
        border: STAGE ? 'color-mix(in srgb, var(--stg-good) 50%, transparent)' : 'rgba(21,128,61,0.5)',
      };
    }
    const b = bandOf(diff);
    const skin = bandSkin(b, STAGE);
    return { win: false, later: y < YEAR, label: b.label, color: skin.color, bg: skin.bg, border: skin.border };
  }

  function shareText() {
    const squares = guesses.map((y, i) => {
      const diff = Math.abs(y - YEAR);
      if (g.status === 'won' && i === guesses.length - 1) return '\u{1F7E9}';
      return bandOf(diff).sq;
    }).join('');
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Circa #${PUZZLE.num} · ${exact ? 'dead on' : 'circa'} in ${guesses.length}/${MAX_GUESSES}${hintBit}${streakBit}`
      : `Circa #${PUZZLE.num} · stumped${hintBit}`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/circa${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Circa #${PUZZLE.num} — the daily year hunt from Mind Loft.\n${shareUrl()}`
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

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="circa" name="Circa" collapsed={playing && !!g.t0} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. "What year was this?" is a QUESTION, not a figure, so it stays in the card
          above the board; only the guess counter comes up here. */}
      {LOFT && (
        <Cap gameKey="circa" quizId={PUZZLE.quizId}
          name="Circa"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Tricky' : null}
          figures={playing ? [
            { v: `${Math.min(guesses.length + (playing ? 1 : 0), MAX_GUESSES)}/${MAX_GUESSES}`, k: 'guess' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: `${Math.min(guesses.length, MAX_GUESSES)}/${MAX_GUESSES}`, k: 'guesses' },
          ]}
        />
      )}
      <div className="cc-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.cc-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .cc-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .cc-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes ccfade{from{opacity:0;}}
          @keyframes ccstamp{from{opacity:0;transform:scale(.94);}}
          @keyframes ccrow{from{opacity:0;transform:translateY(-4px);}}
          @media(max-width:560px){.cc-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.cc-ttl h1{font-size:21px;letter-spacing:0.02em;}.cc-ttl .cc-ttl-dt{font-size:15px;}.cc-ttl-dot{display:none;}}
          .cc-inp{font-family:${MONO};font-weight:500;font-size:30px;letter-spacing:0.14em;text-align:center;width:150px;border:2px solid ${COLORS.ink};border-radius:9px;padding:9px 6px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .cc-inp:focus{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 18%, transparent);}
          .cc-go{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;border:2px solid var(--stg-acc, ${COLORS.accent});background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:9px;padding:0 22px;cursor:pointer;height:58px;}
          .cc-go:active{transform:translateY(1px);}
          .cc-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          @media(max-width:400px){.cc-inp{width:124px;font-size:26px;}.cc-go{padding:0 16px;}}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip: quiet nav + player chip (hidden in focus mode while playing) */}

        {/* masthead: pressed CIRCA tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="circa"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Tricky</span>}
          blocks={'CIRCA'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {gameRetired && (
          <div style={{ background: STAGE ? 'var(--stg-surf2)' : '#fff7ed', border: '1.5px solid rgba(180,83,9,0.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.5 }}>
            Circa has retired &mdash; this archive stays playable, but no new moments drop.{' '}
            Meet its successor: <a href="/outrank" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Outrank, the daily crowd-ranking puzzle &rarr;</a>
          </div>
        )}

        {/* the moment */}
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 17px 17px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>what year was this?</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>guess <b style={{ color: INK, fontWeight: 500 }}>{Math.min(guesses.length + (playing ? 1 : 0), MAX_GUESSES)}</b>/{MAX_GUESSES}</span>
          </div>
          )}
          {/* The PROMPT stays here. It is a question (and for Ping a
              control), not a figure, so it belongs with the board rather
              than in the cap. Restyled off the retired mono texture. */}
          {LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, borderBottom: '1px solid rgba(28,30,36,0.12)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span>What year was this?</span>
          </div>
          )}

          {idle ? (
            <div style={{ margin: '2px 0 4px' }}>
              <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '5px 0 3px', userSelect: 'none' }}>
                <div style={{ height: 18, borderRadius: 5, background: 'rgba(28,30,36,0.12)', width: '94%' }} />
                <div style={{ height: 18, borderRadius: 5, background: 'rgba(28,30,36,0.12)', width: '56%' }} />
              </div>
              <button className="cc-go" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, width: '100%', marginTop: 16 }}>Start</button>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 9, textAlign: 'center' }}>
                Today&rsquo;s moment appears when you start.
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em', color: INK, lineHeight: 1.25, margin: '2px 0 4px' }}>
              {PUZZLE.title}
            </div>
          )}
          {g.hintUsed && playing && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 800, color: '#9a3d0c', background: STAGE ? 'var(--stg-surf2)' : '#fff7ed', border: '1.5px solid rgba(234,88,12,0.4)', borderRadius: 7, padding: '4px 10px', marginTop: 6 }}>
              <Lightbulb size={13} /> It happened in {centuryLabel}.
            </div>
          )}

          {/* input row */}
          {playing && !idle && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'stretch' }}>
                <input
                  ref={inputRef}
                  className="cc-inp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Year"
                  value={val}
                  autoFocus={!mobileUi}
                  onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitGuess(); }}
                  aria-label="Your year guess"
                />
                <button className="cc-go" onClick={submitGuess}>Guess</button>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 8 }}>
                {bounds.lo != null || bounds.hi != null ? (
                  <>Narrowed to <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{bounds.lo != null ? bounds.lo + 1 : YR_MIN}&ndash;{bounds.hi != null ? bounds.hi - 1 : yrMax}</b> &middot; within {SNAP} years counts</>
                ) : (
                  <>Any year from {YR_MIN} to {yrMax} &middot; within {SNAP} years counts as circa</>
                )}
              </div>
            </div>
          )}

          {/* guess history */}
          {guesses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {guesses.map((y, i) => {
                const r = rowFor(y, i);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: r.bg, border: `1.5px solid ${r.border}`, borderRadius: 9, padding: '8px 12px', animation: i === guesses.length - 1 ? 'ccrow .25s ease' : undefined }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: FADED, width: 14, flex: '0 0 auto' }}>{i + 1}</span>
                    <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: INK, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.06em', flex: '0 0 auto' }}>{y}</span>
                    <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 800, color: r.color, textAlign: 'right' }}>
                      {r.win ? <Target size={14} strokeWidth={2.5} /> : (r.later ? <ArrowUp size={14} strokeWidth={2.5} /> : <ArrowDown size={14} strokeWidth={2.5} />)}
                      {r.win ? r.label : <>{r.later ? 'later' : 'earlier'} &middot; {r.label}</>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* tools */}
          {playing && !idle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && (
                <button className="cc-tool" onClick={useHint} title="Reveal the century (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(14,116,144,0.5)', color: '#155e70' }}>
                  <Lightbulb size={14} /> Hint: the century
                </button>
              )}
              {identity && guesses.length > 0 && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows the year' : 'Reveal & end'}
                </button>
              )}
            </div>
          )}
        </div>


          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                {/* the answer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? 'var(--stg-raise)' : PAPER, border: `1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.18)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{YEAR}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {PUZZLE.title}. <span style={{ color: FADED, fontWeight: 600 }}>{PUZZLE.d}</span>
                  </span>
                </div>
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition — a trickier moment to place.</div>
                )}
              </div>
              <p style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    Circa has retired &mdash; this was its final moment. Every past puzzle stays playable in{' '}
                    <a href="/daily" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>the archive</a>.
                    {' '}Meet its successor:{' '}
                    <a href="/outrank" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Outrank, the daily crowd-ranking puzzle &rarr;</a>
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/circa" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Circa &rarr;</a>
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
          {LOFT && !playing && (
            <LoftFinish
              name="Circa"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${`${Math.min(guesses.length, MAX_GUESSES)}/${MAX_GUESSES}`} guesses`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Circa all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/circa?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Circa', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/circa?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        {/* end of the navy play stage; everything below is the light tail */}
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="circa" name="Circa" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="circa" name="Circa" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="circa"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="circa" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Circa to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s moment, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s moment, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
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
          self="circa"
          won={won}
          headline={<>You scored {Math.round((finalScore / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {exact ? 'dead on' : 'circa'} in {guesses.length} guess{guesses.length === 1 ? '' : 'es'} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; out of guesses</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
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
            <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
              <p style={{ margin: '0 0 9px' }}>One historical moment a day. <b>Guess the year</b> it happened &mdash; any year from {YR_MIN} to today &mdash; in six tries. The moment stays covered until you press <b>Start</b>.</p>
              <p style={{ margin: '0 0 9px' }}>Every miss tells you two things: whether the real year is <b>earlier or later</b> than your guess, and how close you are &mdash; from <b style={{ color: 'var(--stg-ink2, #475569)' }}>cold</b> (200+ years off) through <b style={{ color: 'var(--stg-cool, #0a1730)' }}>cool</b> and <b style={{ color: 'var(--stg-warn, #92610b)' }}>warm</b> to <b style={{ color: 'var(--stg-bad, #9a3d0c)' }}>hot</b> (within 10).</p>
              <p style={{ margin: '0 0 9px' }}>Land <b>within {SNAP} years</b> and you&rsquo;ve placed it &mdash; that&rsquo;s circa, and it counts. Hitting the <b>exact year</b> is a dead-on finish. One free <b>hint</b>, on your first ever play, reveals the century.</p>
              <p style={{ margin: 0 }}>A dead-on first guess scores a perfect 10; every extra guess costs a point (a circa finish costs one more). Ties break on fewest guesses, then fastest time. Sundays bring a trickier moment.</p>
            </div>
            <button className="cc-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Circa — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Circa</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Circa is a free daily history puzzle from Mind Loft, the daily year hunt. Each day serves up one famous moment from the last thousand years: a battle, a disaster, a discovery, a first. Your job is to pin down the exact year it happened, in six guesses or fewer.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every guess plays hot and cold: an arrow tells you whether the true year is earlier or later, and a heat band tells you how close you are. Get within three years and the moment is placed, that&rsquo;s circa, and it counts as a win. Know it cold and name the exact year on your first try for a perfect score.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new moment drops every day at midnight Eastern, with a trickier one on Sundays. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>, our history-ordering puzzle, <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, and <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our geography puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
