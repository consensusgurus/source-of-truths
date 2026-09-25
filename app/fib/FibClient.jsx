'use client';

// Fib — the daily lying-clue Latin square.
//
// Each day: an n x n grid where every row and column holds 1..n exactly once.
// Between some neighbouring squares sits an inequality sign, and the printed
// digits are always true. Exactly one sign is a lie. Solve the grid, then accuse
// the sign that lied to you.
//
// The twist is that a contradiction is never proof you were wrong — it might be
// the fib. Every board admits exactly one (grid, lying sign) pair across the
// whole search space, so both halves of the answer are provably unique.
//
// A sign greys out once your grid satisfies it and glows amber once your grid
// breaks it, which is only what the player could read off the board themselves.
// A wrong submission costs an error but never says which square is wrong.
// Score is 10 minus half your errors, floor 1, so a clean solve is a perfect 10
// and ties break on fewest errors then fastest time.
//
// Same daily plumbing as Etch/Suds: banked boards gated by Eastern date on the
// server (app/fib/page.js), per-puzzle localStorage saves, /fib?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow. Weekdays are
// 5x5; Sundays step up to a 6x6 Edition.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { RotateCcw, X, Lightbulb, Eye, Smartphone, Pencil, Check as CheckIcon } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
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
  accent: '#4c1d95',       // Fib identity — deep indigo
  accentSoft: '#f1edfb',
  amber: '#b45309',        // a sign your grid currently breaks
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_fib_help_seen';
const STATS_KEY = 'sot_fib_stats';
const TOOL_KEY = 'sot_fib_tool';   // remembered tool: 'write' | 'note'

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

// ─── Personal stats + streak (localStorage), Suds/Etch pattern ──────────────
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

// ─── puzzle helpers ────────────────────────────────────────────────────────
function givenMap(P) {
  const m = {};
  for (const [r, c, v] of P.givens) m[r * P.n + c] = v;
  return m;
}
function freshState(P) {
  const n = P.n;
  const vals = Array(n * n).fill(0);
  for (const [r, c, v] of P.givens) vals[r * n + c] = v;
  return { v: 1, vals, notes: Array(n * n).fill(0), acc: null, errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}
// A sign's live state from the current grid: 'idle' until both ends are filled,
// then 'ok' or 'broken'. This is only what a player can read off the board.
function clueState(cl, vals, n) {
  const a = vals[cl[0] * n + cl[1]], b = vals[cl[2] * n + cl[3]];
  if (!a || !b) return 'idle';
  const holds = cl[4] === '>' ? a > b : a < b;
  return holds ? 'ok' : 'broken';
}
// Vertical signs are the SAME ascii character turned a quarter turn, never the
// U+2227/U+2228 wedges: those are missing from DM Mono (and from Manrope on the
// share card), so they land on an arbitrary fallback font or render as tofu.
// Rotating '>' a quarter turn clockwise swings its open end from left to up, so
// it still points at the larger number, and '<' points down the same way.
function clueGlyph(cl) {
  return cl[4] === '>' ? '>' : '<';
}
const isVertical = (cl) => cl[0] !== cl[2];
// duplicates in a row or column, for free (unscored) feedback
function dupSet(vals, n) {
  const bad = new Set();
  for (let r = 0; r < n; r++) {
    const seen = {};
    for (let c = 0; c < n; c++) { const v = vals[r * n + c]; if (!v) continue; if (seen[v] !== undefined) { bad.add(seen[v]); bad.add(r * n + c); } else seen[v] = r * n + c; }
  }
  for (let c = 0; c < n; c++) {
    const seen = {};
    for (let r = 0; r < n; r++) { const v = vals[r * n + c]; if (!v) continue; if (seen[v] !== undefined) { bad.add(seen[v]); bad.add(r * n + c); } else seen[v] = r * n + c; }
  }
  return bad;
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function FibClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const n = PUZZLE.n, N = n * n;
  const STORE_KEY = `sot_fib_${PUZZLE.num}`;
  const GIVEN = useMemo(() => givenMap(PUZZLE), [PUZZLE]);
  const SOL = useMemo(() => {
    const f = Array(N).fill(0);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) f[r * n + c] = Number(PUZZLE.sol[r][c]);
    return f;
  }, [PUZZLE, N, n]);
  // sign lookup by the pair of cells it sits between
  const CLUE_AT = useMemo(() => {
    const m = {};
    PUZZLE.clues.forEach((cl, i) => { m[`${cl[0]},${cl[1]},${cl[2]},${cl[3]}`] = i; });
    return m;
  }, [PUZZLE]);

  const [g, setG] = useState(() => freshState(PUZZLE));
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState('write');   // 'write' | 'note'
  const [canUndo, setCanUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('fib', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('fib'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const undoRef = useRef([]);

  const vals = g.vals;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('fib');
  const STAGE = isStage('fib', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('fib');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('fib'), '--stg-acc-lt': gameColorLight('fib'), '--stg-onramp-lt': gameOnrampLight('fib'), '--stg-acc-ink-lt': gameAccentInkLight('fib') };
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
  const errors = g.errors;
  // What the game actually posted, mirroring the win path: 10 down one
  // point per two errors, floored at 1, and 0 for a give-up. Only the cap
  // reads it, and only once the game is over.
  const endScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;
  const finalScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;

  const liveFilled = useMemo(() => vals.reduce((a, v) => a + (v ? 1 : 0), 0), [vals]);
  // reveal writes SOL into vals; readouts show the stamped pre-reveal count
  const filled = g.status === 'revealed' && g.revealFilled != null ? g.revealFilled : liveFilled;
  const dups = useMemo(() => dupSet(vals, n), [vals, n]);
  const clueStates = useMemo(() => PUZZLE.clues.map((cl) => clueState(cl, vals, n)), [PUZZLE, vals, n]);
  const brokenCount = useMemo(() => clueStates.filter((s) => s === 'broken').length, [clueStates]);

  useEffect(() => { gRef.current = g; }, [g]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.vals) && saved.vals.length === N) {
          const next = { ...freshState(PUZZLE), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      const t = localStorage.getItem(TOOL_KEY);
      if (t === 'write' || t === 'note') setMode(t);
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_fib_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_fib_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(TOOL_KEY, mode); } catch (e) {}
  }, [mode, hydrated]);

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

  // ---- metrics + leaderboard (shared /api/quiz/* flow) ----
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
            if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
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
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'fib', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'fib', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'fib', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'fib', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'fib', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_fib_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.vals.some((v, i) => v && GIVEN[i] === undefined) || cur.errors > 0 || cur.acc !== null || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.errors, won: g2.status === 'won' && g2.errors === 0 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.errors, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function commit(next) { gRef.current = next; setG(next); }

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function pushUndo(st) {
    undoRef.current = [...undoRef.current.slice(-59), { vals: st.vals.slice(), notes: st.notes.slice(), acc: st.acc }];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || gRef.current.status !== 'playing') return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    commit({ ...gRef.current, vals: prev.vals.slice(), notes: prev.notes.slice(), acc: prev.acc });
  }

  function writeDigit(d) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || sel === null) return;
    if (GIVEN[sel] !== undefined) return;
    if (!cur.t0) startGame();
    pushUndo(cur);
    if (mode === 'note' && d > 0) {
      const notes = cur.notes.slice();
      notes[sel] = notes[sel] ^ (1 << d);
      commit({ ...cur, notes, t0: cur.t0 || Date.now() });
      return;
    }
    const nv = cur.vals.slice(), nn = cur.notes.slice();
    nv[sel] = nv[sel] === d ? 0 : d;
    nn[sel] = 0;
    vibrate(HAPT.ok);
    commit({ ...cur, vals: nv, notes: nn, t0: cur.t0 || Date.now() });
  }

  function accuse(i) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (!cur.t0) startGame();
    pushUndo(cur);
    commit({ ...cur, acc: cur.acc === i ? null : i, t0: cur.t0 || Date.now() });
  }

  const gridFull = liveFilled === N;
  const canSubmit = playing && gridFull && g.acc !== null;

  function submit() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const gridRight = cur.vals.every((v, i) => v === SOL[i]);
    if (gridRight && cur.acc === PUZZLE.liar) {
      const g2 = { ...cur, status: 'won', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2);
      setJustWon(true);
      return;
    }
    const g2 = { ...cur, errors: cur.errors + 1 };
    vibrate(HAPT.wrong);
    commit(g2);
    say(gridRight
      ? 'The grid holds up, but that is not the sign that lied.'
      : 'Not the answer. Something in the grid does not hold.');
  }

  // one free hint: fill a correct square that is still empty or wrong
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    let idx = -1;
    for (let i = 0; i < N; i++) if (GIVEN[i] === undefined && cur.vals[i] !== SOL[i]) { idx = i; break; }
    if (idx < 0) { say('Every square already matches. Name the sign that lied.'); return; }
    pushUndo(cur);
    const nv = cur.vals.slice(), nn = cur.notes.slice();
    nv[idx] = SOL[idx]; nn[idx] = 0;
    const g2 = { ...cur, vals: nv, notes: nn, hintUsed: true, t0: cur.t0 || Date.now() };
    vibrate(HAPT.ok);
    commit(g2);
    setSel(idx);
    say('Hint placed, one square filled in.');
  }

  function revealEnd() {
    const cur = gRef.current;
    const g2 = { ...cur, revealFilled: cur.vals.reduce((a, v) => a + (v ? 1 : 0), 0), vals: SOL.slice(), notes: Array(N).fill(0), acc: PUZZLE.liar, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    commit(freshState(PUZZLE));
    setSel(null); setJustWon(false); setEndClosed(false);
  }

  // desktop keyboard: digits write, arrows move, N toggles notes, Ctrl+Z undoes
  const onKey = useCallback((e) => {
    if (gRef.current.status !== 'playing') return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'n' || k === 'N') { setMode((m) => (m === 'note' ? 'write' : 'note')); return; }
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); writeDigit(0); return; }
    if (k >= '1' && k <= '9') { const d = Number(k); if (d <= n) { e.preventDefault(); writeDigit(d); } return; }
    if (sel === null) return;
    let r = Math.floor(sel / n), c = sel % n;
    if (k === 'ArrowUp') r = (r + n - 1) % n;
    else if (k === 'ArrowDown') r = (r + 1) % n;
    else if (k === 'ArrowLeft') c = (c + n - 1) % n;
    else if (k === 'ArrowRight') c = (c + 1) % n;
    else return;
    e.preventDefault();
    setSel(r * n + c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, n, mode]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareUrl() {
    return withRef(`mindloftdaily.com/fib${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7EA}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Fib #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · liar caught · ${errors === 0 ? 'clean' : `${errors} error${errors === 1 ? '' : 's'}`} · ${elapsed}${hintBit}${streakBit}`
      : `Fib #${PUZZLE.num} · the fib got away`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Fib #${PUZZLE.num} — the daily grid with one lying clue, from Mind Loft.\n${shareUrl()}`
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

  // THE BOARD IS THE SUBJECT, so it gets the room its container already had
  // (the card sits inside a 660px column, so this was leaving ~200px unused).
  const boardMax = n > 5 ? 520 : 470;
  const track = Array(n).fill('1fr').join(' 0.44fr ');
  // SIZED AGAINST THE CELL, NOT THE VIEWPORT (player report, 2026-09-01: "the
  // numbers are too small to read, especially the pencil marks"). The board is
  // capped, so on a phone the clamp FLOOR is what renders, and the floors were
  // set far below the cell they sit in: a 390px phone gave a 7px pencil mark in
  // a 14px box, and 6px in an 11.7px box on a Sunday 6x6. The house reference is
  // Suds, whose pencil mark is a flat 9px in a 17px box and whose value runs
  // 44-46% of the cell. These land the same ratios at BOTH ends of the clamp:
  // n=5 phone cell 50px / desktop 69px, n=6 phone 41px / desktop 63px.
  const cellFs = n > 5 ? 'clamp(18px, 4.9vw, 28px)' : 'clamp(21px, 5.9vw, 32px)';
  const signFs = n > 5 ? 'clamp(13px, 3.3vw, 18px)' : 'clamp(14px, 3.7vw, 21px)';
  const noteFs = n > 5 ? 'clamp(10px, 2.6vw, 12px)' : 'clamp(11px, 2.9vw, 14px)';

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Solve the grid, then name the one sign that is lying."
      chips={[
        { label: 'Grey sign: your grid satisfies it', tone: 'grey' },
        { label: 'Amber sign: your grid breaks it', tone: 'warn' },
        { label: 'Red digit: repeated in its line', tone: 'bad' },
      ]}
      steps={[
        <>Every row and column holds <b>1 to {n}</b> once each, and the <b>printed digits are true</b>. Each sign&rsquo;s open end points at the <b>larger</b> of its two neighbours.</>,
        <>Exactly <b>one sign lies</b>, so a contradiction is never proof you slipped up. It might be the fib, and that is the whole puzzle.</>,
        <>Tap a square then a number, or type. <b>Notes</b> (press N) pencils candidates, <b>Undo</b> is Ctrl+Z, and one free <b>hint</b>, on your first ever play, fills a correct square.</>,
        <>Fill the grid, then <b>tap the sign you are accusing</b> and hit <b>Submit</b>.</>,
      ]}
      knack="The colours are free and only report what you could read off the board yourself. Finish with exactly one amber sign and that is your liar."
      footer="One grid and one liar fit the board, so the answer is provable, never a guess. A clean solve scores a perfect 10, every two wrong submissions cost a point. Ties break on fewest errors, then fastest time. Sundays are a bigger 6×6 Edition."
    />
  );

  const SIDE = 2 * n - 1;
  const boardCells = [];
  for (let i = 0; i < SIDE * SIDE; i++) {
    const gr = Math.floor(i / SIDE), gc = i % SIDE;
    const rowIsCell = gr % 2 === 0, colIsCell = gc % 2 === 0;
    if (rowIsCell && colIsCell) {
      const r = gr / 2, c = gc / 2, idx = r * n + c;
      const v = vals[idx];
      const isGiven = GIVEN[idx] !== undefined;
      const isSel = sel === idx;
      const isDup = dups.has(idx);
      const noteMask = g.notes[idx];
      boardCells.push(
        <div
          key={i}
          onClick={() => { if (playing) { setSel(idx); if (!gRef.current.t0) startGame(); } }}
          style={{
            border: `1.5px solid ${isSel ? COLORS.accent : 'var(--stg-cell-line, rgba(28,30,36,0.3))'}`,
            boxShadow: isSel ? `inset 0 0 0 2px var(--stg-acc, ${COLORS.accent})` : undefined,
            borderRadius: 5,
            background: isGiven ? (STAGE ? 'var(--stg-surf2)' : COLORS.paper) : (STAGE ? 'var(--stg-cell)' : T.white),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: playing && !isGiven ? 'pointer' : 'default',
            userSelect: 'none', WebkitTapHighlightColor: 'transparent',
            minWidth: 0, minHeight: 0, position: 'relative',
          }}
        >
          {v ? (
            <span style={{ fontFamily: MONO, fontSize: cellFs, lineHeight: 1, fontWeight: 500, color: isDup ? `var(--stg-bad, ${COLORS.rust})` : isGiven ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-acc-ink, ${COLORS.accent})` }}>{v}</span>
          ) : noteMask ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '86%', height: '86%', alignItems: 'center', justifyItems: 'center' }}>
              {Array.from({ length: n }).map((_, k) => (
                <span key={k} style={{ fontFamily: MONO, fontSize: noteFs, lineHeight: 1, color: 'var(--stg-mute, #9aa2b1)' }}>
                  {noteMask & (1 << (k + 1)) ? k + 1 : ''}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );
      continue;
    }
    if (!rowIsCell && !colIsCell) { boardCells.push(<div key={i} />); continue; }
    const r1 = rowIsCell ? gr / 2 : (gr - 1) / 2;
    const c1 = colIsCell ? gc / 2 : (gc - 1) / 2;
    const r2 = rowIsCell ? r1 : r1 + 1;
    const c2 = colIsCell ? c1 : c1 + 1;
    const ci = CLUE_AT[`${r1},${c1},${r2},${c2}`];
    if (ci === undefined) { boardCells.push(<div key={i} />); continue; }
    const cl = PUZZLE.clues[ci];
    const st = clueStates[ci];
    const accused = g.acc === ci;
    const isLiar = !playing && ci === PUZZLE.liar;
    const col = isLiar ? COLORS.rust : st === 'broken' ? COLORS.amber : st === 'ok' ? 'var(--stg-ink2, #b6bdc9)' : FADED;
    boardCells.push(
      <div
        key={i}
        onClick={() => accuse(ci)}
        title={playing ? 'Accuse this sign of lying' : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: playing ? 'pointer' : 'default', userSelect: 'none',
          WebkitTapHighlightColor: 'transparent', minWidth: 0, minHeight: 0,
          borderRadius: 5,
          background: accused ? 'rgba(192,57,43,0.12)' : isLiar ? 'rgba(192,57,43,0.16)' : 'transparent',
          boxShadow: accused || isLiar ? `inset 0 0 0 1.5px ${COLORS.rust}` : undefined,
        }}
      >
        <span style={{ fontFamily: MONO, fontSize: signFs, lineHeight: 1, fontWeight: st === 'broken' || accused ? 500 : 400, color: col, display: 'inline-block', transform: isVertical(cl) ? 'rotate(90deg)' : undefined }}>{clueGlyph(cl)}</span>
      </div>
    );
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
      <DailyChrome slug="fib" name="Fib" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Fib grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="fib" quizId={PUZZLE.quizId}
          name="Fib"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · 6×6` : null}
          figures={playing ? [
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
            { v: `${filled}/${N}`, k: 'filled' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="fb-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.fb-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .fb-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .fb-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .fb-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .fb-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
          .fb-key{font-family:${MONO};font-weight:500;font-size:20px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.3));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};border-radius:8px;height:46px;min-width:46px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;}
          .fb-key:hover{background:var(--stg-surf2, ${COLORS.paper});}
          .fb-key.note{color:var(--stg-acc-ink, ${COLORS.accent});}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>


        {!LOFT && (
        <DailyMasthead
          slug="fib"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 6&times;6</span>}
          blocks={'FIB'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 2 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which
            runs full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Fib is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Every row and column holds 1 to {n} once, and the open end of each sign points at the larger number. One sign is lying. Solve the grid, then accuse it. {n}&times;{n} today.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="fb-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>errors <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>broken <b style={{ color: brokenCount === 1 ? COLORS.amber : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{brokenCount}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>filled <b style={{ color: filled === N ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{filled}</b>/{N}</span>
          </div>
          )}

          <div style={{ maxWidth: boardMax, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: track, gridTemplateRows: track, aspectRatio: '1 / 1', gap: 2 }}>
              {boardCells}
            </div>
          </div>

          {playing && (
            <>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 15, flexWrap: 'wrap' }}>
                {Array.from({ length: n }).map((_, k) => (
                  <button key={k} className={`fb-key${mode === 'note' ? ' note' : ''}`} onClick={() => writeDigit(k + 1)}>{k + 1}</button>
                ))}
                <button className="fb-key" onClick={() => writeDigit(0)} title="Erase" style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800 }}>Clear</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button className={`fb-tool${mode === 'note' ? ' on' : ''}`} onClick={() => setMode((m) => (m === 'note' ? 'write' : 'note'))} title="Pencil small candidates (N)">
                  <Pencil size={14} /> Notes
                </button>
                <button className="fb-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                  <RotateCcw size={14} /> Undo
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="fb-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(76,29,149,0.45)', color: ACC_INK }}>
                    <Lightbulb size={14} /> Hint
                  </button>
                )}
              </div>
              <div style={{ marginTop: 13, textAlign: 'center' }}>
                <button
                  className="fb-btn"
                  onClick={submit}
                  disabled={!canSubmit}
                  style={{ background: canSubmit ? COLORS.accent : (STAGE ? 'transparent' : T.white), color: canSubmit ? T.white : 'var(--stg-mute, rgba(28,30,36,0.4))', borderColor: canSubmit ? COLORS.accent : 'var(--stg-line2, rgba(28,30,36,0.25))', cursor: canSubmit ? 'pointer' : 'default', fontSize: 15, padding: '11px 26px' }}
                >
                  <CheckIcon size={16} /> Submit
                </button>
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 8 }}>
                  {g.acc === null
                    ? 'Tap the sign you are accusing of lying.'
                    : !gridFull
                      ? 'Sign accused. Fill every square to submit.'
                      : brokenCount !== 1
                        ? `Your grid breaks ${brokenCount} sign${brokenCount === 1 ? '' : 's'}, and only one clue lies.`
                        : 'One sign broken, one accused. Submit when you are sure.'}
                </div>
              </div>
            </>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && identity && (filled > PUZZLE.givens.length || errors > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows the answer' : 'Reveal & end'}
            </button>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                The sign ringed in <span style={{ color: `var(--stg-ink, ${COLORS.rust})` }}>red</span> is the one that lied.
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; a bigger 6&times;6 grid.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Fib in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new grid drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/fib?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Fib &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/fib" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Fib &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </div>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Fib"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} errors \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Fib all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Errors"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/fib?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Fib', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/fib?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="fib" name="Fib" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="fib" name="Fib" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="fib"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="fib" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Fib to your Home Screen</div>
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
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="fib"
          won={won}
          headline={won ? <>Liar caught!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {errors === 0 ? 'clean, no errors' : `${errors} error${errors === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the answer is shown above</>}
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

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="fb-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Fib</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Fib is a free daily logic puzzle from Mind Loft. It is a Latin square with inequality signs, close cousin to futoshiki, with one rule added that changes everything: exactly one of the signs is lying to you.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          That single change is what makes the puzzle. In an ordinary grid a contradiction means you slipped up somewhere and have to walk it back. Here it might mean you have just found the fib, so every chain of reasoning carries a second question, and the clue you trusted first is usually the one worth doubting.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board was checked to admit exactly one grid and exactly one lying sign, so the answer is provable and you never have to guess. A new grid drops every day at midnight Eastern, and Sundays step up to a 6&times;6 Edition. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/etch" style={{ color: INK, fontWeight: 800 }}>Etch</a>, our nonogram, <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku, and <a href="/hedge" style={{ color: INK, fontWeight: 800 }}>Hedge</a>, our loop puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
