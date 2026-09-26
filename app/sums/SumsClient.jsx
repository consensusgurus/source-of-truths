'use client';

// Sums — the daily kakuro, the cross-sums crossword.
//
// Each day: a crossword-shaped grid. Every run of white squares carries a total
// in the black square at its head (across total top-right, down total
// bottom-left). Fill each run with digits 1 to 9 that add to its total, with no
// digit repeated inside a run. There is exactly one solution and it always
// falls to deduction alone. Sudoku manners: a wrong digit is NOT flagged, it
// looks like any other entry, and the grid is accepted only once every square
// is right. Nothing counts against you, so `miss` is null on the registry row
// and the day resolves on the clock, exactly like Sixes.
//
// Forked from app/sixes/SixesClient.jsx. What changed is the geometry: the
// board is PUZZLE.size square (7 on a weekday, 11 on the Sunday Edition), black
// squares carry the clues, a cell's peers are the two RUNS it sits in rather
// than a row, a column and a box, and the pad greys the digits its runs already
// hold. Everything else is the shared daily plumbing: banked puzzles gated by
// Eastern date on the server (app/sums/page.js), per-puzzle localStorage saves,
// /sums?p=N archive pinning, streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone, Pencil, Eraser, Trash2 } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import { isLoft } from '@/lib/loft';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

// Sums identity is ROSE, the one hue absent from the Numbers row (Suds orange,
// Quilt magenta, Carve violet, Cipher and Sando teal, Tally green, Crunch amber,
// Blitz olive, Cages purple, Sixes blue). The stage paints the Numbers category
// step; this pair only feeds the pre-stage surfaces. Every colour the board
// uses is derived from COLORS.accent below rather than written as a literal
// hex a second time.
const ACCENT = '#be185d';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#fce7f3',
  accentTint: '#fbcfe8',       // a square holding the highlighted digit
  accentPick: '#f9a8d4',       // the selected square
  accentDeep: '#831843',       // pressed / shadow
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_sums_help_seen';
const STATS_KEY = 'sot_sums_stats';

// ─── kakuro geometry. The board is PUZZLE.size square; the numbers below are
// derived from the puzzle inside the component, never typed out, because the
// Sunday Edition is a different size from the weekday board. ──
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ALL_NOTES = 0x3FE;

// Every run on the board, read off the solution's black pattern. A run is
// { dir, head, cells, total }, and `runsAt[cell]` lists the (up to two) runs a
// white square sits in. The totals come from the puzzle's own clue arrays.
function readRuns(p) {
  const N = p.size;
  const runs = [];
  const runsAt = Array.from({ length: N * N }, () => []);
  for (let r = 0; r < N; r++) {
    let c = 0;
    while (c < N) {
      if (p.sol[r][c] === 0) { c++; continue; }
      const s = c; while (c < N && p.sol[r][c] !== 0) c++;
      const cells = []; for (let x = s; x < c; x++) cells.push(r * N + x);
      runs.push({ dir: 'a', head: r * N + s - 1, cells, total: p.across[r][s - 1] });
    }
  }
  for (let c = 0; c < N; c++) {
    let r = 0;
    while (r < N) {
      if (p.sol[r][c] === 0) { r++; continue; }
      const s = r; while (r < N && p.sol[r][c] !== 0) r++;
      const cells = []; for (let x = s; x < r; x++) cells.push(x * N + c);
      runs.push({ dir: 'd', head: (s - 1) * N + c, cells, total: p.down[s - 1][c] });
    }
  }
  runs.forEach((run, i) => { for (const cell of run.cells) runsAt[cell].push(i); });
  return { runs, runsAt };
}

// Which digit SETS make `total` in `n` distinct digits. Memoised; the table is
// tiny (at most 12 sets for any total) and it is the whole trick of the game.
const COMBO_MEMO = new Map();
function combosFor(n, total) {
  const key = `${n}|${total}`;
  if (COMBO_MEMO.has(key)) return COMBO_MEMO.get(key);
  const out = [];
  const rec = (start, left, sum, set) => {
    if (left === 0) { if (sum === total) out.push(set.slice()); return; }
    for (let d = start; d <= 9; d++) { if (sum + d > total) break; set.push(d); rec(d + 1, left - 1, sum + d, set); set.pop(); }
  };
  rec(1, n, 0, []);
  COMBO_MEMO.set(key, out);
  return out;
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

// ─── personal stats + streak (localStorage), the shared daily pattern ───────
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

function freshState(cells = 49) {
  return {
    v: 1,
    cells: Array(cells).fill(0),   // player digit per square (0 = empty; black squares stay 0)
    notes: Array(cells).fill(0),   // pencil-mark bitmask per square (bit d set = candidate d)
    hintUsed: false,
    status: 'playing',             // playing | won | revealed
    t0: null,                      // stays null until the player presses Start: opening
    tEnd: null,                    // a game is not starting one (see CLAUDE.md)
  };
}

// Light haptics on supported devices (no-op on desktop / unsupported browsers).
const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60], note: [6] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function SumsClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.size;
  const CELLS = N * N;
  const SOL = PUZZLE.sol;
  const STORE_KEY = `sot_sums_${PUZZLE.num}`;
  const solFlat = useMemo(() => SOL.flat(), [SOL]);
  // In Sixes `givenFlat` marked the printed clues; here it marks the BLACK
  // squares (0 in sol), which are likewise never filled. Everything downstream
  // that skipped a given skips a black square.
  const givenFlat = useMemo(() => solFlat.map((v) => (v === 0 ? 1 : 0)), [solFlat]);
  const FREE = useMemo(() => {
    const out = [];
    for (let i = 0; i < CELLS; i++) if (!givenFlat[i]) out.push(i);
    return out;
  }, [givenFlat, CELLS]);
  const { runs: RUNS, runsAt: RUNS_AT } = useMemo(() => readRuns(PUZZLE), [PUZZLE]);
  // Seven squares at 62px on a weekday, eleven at 50px on a Sunday: the board
  // widens for the Edition rather than shrinking every square to fit a phone.
  const GRID_MAX = N > 7 ? 560 : 448;

  const [g, setG] = useState(() => freshState(CELLS));
  const [sel, setSel] = useState(-1);          // selected square index, -1 = none
  const [armed, setArmed] = useState(0);       // digit-first: the "picked up" number (0 = none)
  const [canUndo, setCanUndo] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (lib/hint-gate.js). Eligibility is re-read
  // whenever stats change, so the server-history merge can revoke it for a
  // returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('sums', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('sums'); }, [g.hintUsed]);
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
  const undoRef = useRef([]);
  const longRef = useRef(false);
  const longTimer = useRef(null);

  const cells = g.cells;
  const notes = g.notes;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('sums');
  const STAGE = isStage('sums', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('sums');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('sums'), '--stg-acc-lt': gameColorLight('sums'), '--stg-onramp-lt': gameOnrampLight('sums'), '--stg-acc-ink-lt': gameAccentInkLight('sums') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'sums', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'sums', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'sums', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'sums', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'sums', active: LOFT && !playing });

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
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === CELLS) {
          setG({ ...freshState(CELLS), ...saved, notes: Array.isArray(saved.notes) && saved.notes.length === CELLS ? saved.notes : Array(CELLS).fill(0) });
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
    // same-device day breadcrumb for cross-puzzle recs — TODAY'S puzzle only,
    // and only once the clock is actually running (t0), because a save file
    // says 'playing' from the first render whether or not anyone has moved.
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_sums_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_sums_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. Ticked from state while the game runs so the readout moves
  // on its own; the elapsed time RECORDED on the result is still a real
  // Date.now() delta taken at the moment the game ends.
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

  // ---- metrics + leaderboard (the shared /api/quiz/* flow) ----
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

  useEffect(() => {
    if (!armClear) return undefined;
    const t = setTimeout(() => setArmClear(false), 4000);
    return () => clearTimeout(t);
  }, [armClear]);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // A digit already sitting in either of the selected square's runs greys out
  // on the pad, because no digit repeats inside a run. This reads what the
  // player has PLACED, right or wrong, since telling them which entries are
  // wrong is the one thing this game never does.
  const digitDone = useMemo(() => {
    const out = {};
    if (sel < 0 || givenFlat[sel]) return out;
    for (const ri of RUNS_AT[sel]) for (const x of RUNS[ri].cells) if (x !== sel && cells[x]) out[cells[x]] = true;
    return out;
  }, [sel, cells, givenFlat, RUNS, RUNS_AT]);

  // The combo line: for each run the selected square sits in, the digit sets
  // that still make its total. A set is live when it contains every digit
  // already placed in the run; what is shown is the digits still to place.
  const comboInfo = useMemo(() => {
    if (sel < 0 || givenFlat[sel]) return [];
    return RUNS_AT[sel].map((ri) => {
      const run = RUNS[ri];
      const placed = run.cells.map((x) => cells[x]).filter(Boolean);
      const left = run.cells.length - placed.length;
      const sets = combosFor(run.cells.length, run.total).map((set) => {
        const live = placed.every((d) => set.includes(d)) && new Set(placed).size === placed.length;
        return { live, rest: set.filter((d) => !placed.includes(d)) };
      });
      return { dir: run.dir, total: run.total, len: run.cells.length, left, need: run.total - placed.reduce((a, b) => a + b, 0), sets };
    });
  }, [sel, cells, givenFlat, RUNS, RUNS_AT]);

  const filledCount = useMemo(() => FREE.reduce((n, i) => n + (cells[i] ? 1 : 0), 0), [cells, FREE]);
  const hasEntries = useMemo(() => cells.some((v) => v) || notes.some((v) => v), [cells, notes]);

  function isSolved(cs) {
    for (const i of FREE) if (cs[i] !== solFlat[i]) return false;
    return true;
  }

  const REC_KEY = `sot_sums_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts. Opening the puzzle and
    // dismissing the start gate does not log a 0-score attempt.
    const acted = g.cells.some((v) => v) || g.notes.some((v) => v) || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: 0, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Nothing is counted against you here, so the daily leaderboard (score,
        // then guesses, then time) resolves every solver tie on the clock alone.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // remove a candidate from the notes of every square sharing a run
  function scrubPeerNotes(noteArr, idx, d) {
    const m = 1 << d;
    for (const ri of RUNS_AT[idx]) for (const j of RUNS[ri].cells) { if (j !== idx && (noteArr[j] & m)) noteArr[j] = noteArr[j] & ~m; }
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // ---- undo (board positions only; a spent hint stays spent) ----
  function pushUndo() {
    undoRef.current = [...undoRef.current.slice(-49), { cells: cells.slice(), notes: notes.slice() }];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || !playing) return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    setSel(-1);
    setG((cur) => ({ ...cur, cells: prev.cells.slice(), notes: prev.notes.slice() }));
  }

  const nextEmpty = (cs, from) => {
    for (let k = 1; k <= CELLS; k++) { const i = (from + k) % CELLS; if (!givenFlat[i] && !cs[i]) return i; }
    return -1;
  };
  // The Sixes arrow keys wrapped inside a full grid; a kakuro has black squares,
  // so a step walks to the next WHITE square in that direction and wraps.
  const stepSel = (dr, dc) => {
    let r = Math.floor(sel / N), c = sel % N;
    for (let k = 0; k < N; k++) {
      r = (r + dr + N) % N; c = (c + dc + N) % N;
      if (!givenFlat[r * N + c]) return r * N + c;
    }
    return sel;
  };

  function toggleNote(idx, d) {
    if (!playing || idx < 0 || givenFlat[idx] || cells[idx]) return;
    pushUndo();
    const nextNotes = notes.slice();
    nextNotes[idx] = nextNotes[idx] ^ (1 << d);
    setG({ ...g, notes: nextNotes });
  }

  // Core placement. `advance` is retained for call-site compatibility and no longer moves the selection to the next empty square, for
  // pad/keyboard fills of the selected square, NOT for tap-to-place in
  // digit-first mode (there the player is already choosing each square).
  function placeDigit(idx, d, advance) {
    if (!playing || idx < 0 || givenFlat[idx]) return;
    if (cells[idx] === d) { eraseCell(idx); return; } // re-tap the same digit clears it
    pushUndo();
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = d;
    nextNotes[idx] = 0;
    // The entry is never checked against the solution here, so a wrong digit is
    // placed and shown exactly like a right one. Placing a number clears it from
    // peer pencil marks the way every sudoku does, right or wrong.
    scrubPeerNotes(nextNotes, idx, d);
    const g2 = { ...g, cells: nextCells, notes: nextNotes };
    if (!g2.t0) g2.t0 = Date.now();
    if (isSolved(nextCells)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2);
      setJustWon(true);
      return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    // No per-square feedback. If the grid is full but wrong, nudge at the board
    // level without pointing at the bad square.
    if (FREE.every((i) => nextCells[i])) say('Every square is filled, but the grid is not solved yet. Check the totals, and look for a repeated digit.');
    // The selection STAYS on the square just filled (solver feedback, 2026-09-26):
    // sudoku is solved out of order, so the board never moves it for the player.
    // Tab still jumps to the next empty square when they ask for it.
  }

  function enterDigit(idx, d) {
    if (noteMode) { toggleNote(idx, d); return; }
    placeDigit(idx, d, true);
  }

  // Number pad. With a square selected it fills that square and does NOT arm the
  // digit, so classic tapping never leaves a number stuck active. With nothing
  // selected it toggles the armed digit for digit-first placement.
  function padTap(d) {
    if (sel >= 0 && !givenFlat[sel]) {
      if (noteMode) toggleNote(sel, d);
      else placeDigit(sel, d, true);
      return;
    }
    setArmed((a) => (a === d ? 0 : d));
  }

  function eraseCell(idx) {
    if (!playing || idx < 0 || givenFlat[idx]) return;
    if (!cells[idx] && !notes[idx]) return;
    pushUndo();
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = 0;
    nextNotes[idx] = 0;
    setG({ ...g, cells: nextCells, notes: nextNotes });
  }

  // Clear the whole board: every digit and pencil mark the player put down goes
  // away and the printed clues stay. It sits between Erase (one square) and
  // Replay (a brand new game): the clock, the hint and the save slot are all
  // untouched, so it is a fresh grid inside the same run. Undoable like any move.
  function clearBoard() {
    if (!playing || !hasEntries) return;
    if (!armClear) { setArmClear(Date.now()); return; }
    if (Date.now() - armClear < ARM_MIN_MS) return;
    setArmClear(false);
    pushUndo();
    setSel(-1);
    setArmed(0);
    setG((cur) => ({ ...cur, cells: Array(CELLS).fill(0), notes: Array(CELLS).fill(0) }));
    say('Board cleared, back to the printed clues. Undo brings it back.');
  }

  function cellClick(idx) {
    if (longRef.current) { longRef.current = false; return; }
    if (armed) {
      if (givenFlat[idx]) return;
      if (noteMode) toggleNote(idx, armed);
      else placeDigit(idx, armed, false);
      return;
    }
    if (idx === sel) { setSel(-1); return; }
    setSel(idx);
  }

  // Long-press a square to pencil the armed digit without switching Notes mode.
  function pencilCell(idx) {
    if (!playing || idx < 0 || givenFlat[idx] || cells[idx] || !armed) return false;
    toggleNote(idx, armed);
    vibrate(HAPT.note);
    return true;
  }
  const startLong = (idx) => {
    longRef.current = false;
    if (longTimer.current) clearTimeout(longTimer.current);
    longTimer.current = setTimeout(() => { longRef.current = pencilCell(idx); }, 450);
  };
  const cancelLong = () => { if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; } };

  // One free hint: fill the correct digit into the selected empty square, else
  // the first empty square in reading order.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    let idx = (sel >= 0 && !givenFlat[sel] && cells[sel] !== solFlat[sel]) ? sel : -1;
    if (idx < 0) idx = FREE.find((i) => cells[i] !== solFlat[i]);
    if (idx == null || idx < 0) return;
    const d = solFlat[idx];
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = d;
    nextNotes[idx] = 0;
    scrubPeerNotes(nextNotes, idx, d);
    const g2 = { ...g, cells: nextCells, notes: nextNotes, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(idx);
    if (isSolved(nextCells)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    say('Hint placed, one square filled in.');
  }

  function revealEnd() {
    const next = solFlat.slice();
    const g2 = { ...g, cells: next.map((v, i) => (givenFlat[i] ? 0 : v)), notes: Array(CELLS).fill(0), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    setG(freshState(CELLS)); setSel(-1); setArmed(0); setJustWon(false); setNoteMode(false); setEndClosed(false);
  }

  // desktop keyboard: arrows move, 1–9 fill, 0/Backspace erase, N toggles notes
  const onKey = useCallback((e) => {
    if (!playing) return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'Escape') { setArmed(0); setSel(-1); return; }
    if (k === 'n' || k === 'N') { setNoteMode((m) => !m); return; }
    if (k === 'Tab') { e.preventDefault(); const nx = nextEmpty(cells, sel < 0 ? CELLS - 1 : sel); if (nx >= 0) setSel(nx); return; }
    if (sel < 0) return;
    if (k === 'ArrowUp') { e.preventDefault(); setSel(stepSel(-1, 0)); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setSel(stepSel(1, 0)); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); setSel(stepSel(0, -1)); return; }
    if (k === 'ArrowRight') { e.preventDefault(); setSel(stepSel(0, 1)); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { eraseCell(sel); return; }
    if (/^[1-9]$/.test(k)) { enterDigit(sel, Number(k)); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, noteMode, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    // Five squares, all or none, exactly like the score. No board state leaks.
    const squares = won ? '\u{1F7EA}'.repeat(5) : '⬜'.repeat(5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Sums #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · solved in ${elapsed}${hintBit}${streakBit}`
      : `Sums #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/sums${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Sums #${PUZZLE.num} — the daily kakuro from Mind Loft.\n${shareUrl()}`
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

  // ── selection-aware highlighting ──
  const selVal = sel >= 0 ? (givenFlat[sel] || cells[sel]) : 0;
  const hlVal = armed || selVal;
  // The selected square lights the RUNS it sits in, not its row and column: a
  // kakuro's constraint is the run, and lighting a whole row across a black
  // square would claim a relationship that is not there.
  const peerSet = useMemo(() => {
    const s = new Set();
    if (sel >= 0 && !givenFlat[sel]) for (const ri of RUNS_AT[sel]) for (const x of RUNS[ri].cells) s.add(x);
    return s;
  }, [sel, givenFlat, RUNS, RUNS_AT]);

  function cellStyle(idx) {
    const r = Math.floor(idx / N), c = idx % N;
    const black = !!givenFlat[idx];
    const isSel = idx === sel;
    const peer = !isSel && peerSet.has(idx);
    const val = cells[idx];
    const sameVal = !black && hlVal && val === hlVal && !isSel;
    // THE GRID NEVER CONVERTED (Sixes, owner 2026-08-31): every fill and rule
    // takes a token with its Loft value as the fallback, so the stage gets a
    // dark grid under its pale ink and the Loft render is unchanged.
    let bg = STAGE ? 'var(--stg-cell)' : T.white;
    // A clue square is the page GROUND, not a tint of the cell: on the dark
    // register a 9% ink mix over the ground came out within a few points of
    // the cell itself and the board read as one grey sheet (seen live 9/3).
    if (black) bg = STAGE ? 'var(--stg-ground)' : '#e9edf3';
    if (peer) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 16%, var(--stg-cell))' : COLORS.accentSoft;
    if (sameVal) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 34%, var(--stg-cell))' : COLORS.accentTint;
    if (isSel) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 48%, var(--stg-cell))' : COLORS.accentPick;
    return {
      background: bg,
      boxShadow: isSel ? `inset 0 0 0 2.5px var(--stg-acc, ${COLORS.accent})` : undefined,
      zIndex: isSel ? 1 : undefined,
      borderRight: '1px solid var(--stg-cell-line, rgba(28,30,36,0.18))',
      borderBottom: '1px solid var(--stg-cell-line, rgba(28,30,36,0.18))',
      borderLeft: c === 0 ? 'none' : undefined,
      borderTop: r === 0 ? 'none' : undefined,
      cursor: black ? 'default' : 'pointer',
    };
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="A run is a strip of white squares, across or down, and the black square at its head prints the run's total: the across total top right, the down total bottom left. Fill every run with digits 1 to 9 that add up to its total, and never repeat a digit inside a run."
      steps={[
        <><b>Some totals can only be made one way.</b> 3 in two squares is 1+2, 4 is 1+3, 16 is 7+9, 17 is 8+9. In three squares 6 is 1+2+3, 7 is 1+2+4, 23 is 6+8+9, 24 is 7+8+9. Those runs are where you start.</>,
        <><b>Tap a square then tap a number</b>, or pick a number first and tap every square it goes in. The line under the board lists the digit sets that still fit the square's runs. On desktop the <b>arrow keys and number keys</b> work too.</>,
        <>Turn on <b>Notes</b> (or press N) to pencil candidates, or with a number picked just <b>long-press</b> a square to pencil it. <b>Undo</b> (or Ctrl+Z) takes back your last move.</>,
      ]}
      knack="Where a fixed run crosses another run, the crossing square can only hold a digit both runs allow, and that one square usually cracks the second run. Wrong entries are not flagged, just like paper."
      footer="Every board has exactly one solution and can always be reached by deduction, with no guessing. Solve the grid and you score a perfect 10, and because nothing is counted against you, the daily leaderboard is a straight race on the clock. One free hint, on your first ever play, fills a correct number. Weekdays are 7x7; Sundays are an 11x11 Edition."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="sums" name="Sums" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Sums is scored all or nothing, so the outcome is only ever won or
          lost; there is no partial state for the amber cap to carry. */}
      {LOFT && (
        <Cap gameKey="sums" quizId={PUZZLE.quizId}
          name="Sums"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 11×11' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${filledCount}/${FREE.length}`, k: 'filled' },
          ]}
        />
      )}
      <div className="su-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        {/* dangerouslySetInnerHTML, not <style>{CSS}: React escapes text children and
            <style> is raw-text, so an apostrophe ships as &#x27; and the CSS parser
            drops the whole declaration. `content:''` on .su-clue::after is exactly
            that case, and the diagonal divider never draws on a server render. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.su-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .su-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .su-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .su-cell{display:flex;align-items:center;justify-content:center;font-family:${MONO};box-sizing:border-box;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;}
          .su-user{font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});}
          .su-notes{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);width:100%;height:100%;padding:2px;box-sizing:border-box;}
          .su-note{display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:${N > 7 ? 7.5 : 9.5}px;line-height:1;color:${STAGE ? 'var(--stg-mute2,#8a93a3)' : '#8a93a3'};}
          .su-black{cursor:default;}
          .su-clue::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom right,transparent calc(50% - 0.5px),var(--stg-line2, rgba(28,30,36,0.28)) calc(50% - 0.5px),var(--stg-line2, rgba(28,30,36,0.28)) calc(50% + 0.5px),transparent calc(50% + 0.5px));pointer-events:none;}
          .su-a,.su-d{position:absolute;font-family:${MONO};font-size:${N > 7 ? 'clamp(8px, 2.2vw, 11px)' : 'clamp(9.5px, 2.6vw, 13px)'};line-height:1;font-weight:500;color:${INK};z-index:1;}
          .su-a{top:${N > 7 ? 2 : 3}px;right:${N > 7 ? 2 : 4}px;}
          .su-d{bottom:${N > 7 ? 2 : 3}px;left:${N > 7 ? 2 : 4}px;}
          .su-a.done,.su-d.done{color:var(--stg-acc-ink, ${COLORS.accent});}
          .su-combo{font-family:${SANS};font-size:12px;color:${FADED};display:flex;flex-direction:column;gap:5px;min-height:22px;}
          .su-combo-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
          .su-combo-lbl{font-family:${MONO};font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--stg-acc-ink, ${COLORS.accent});white-space:nowrap;}
          .su-combo-left{white-space:nowrap;font-weight:700;color:${INK};}
          .su-combo-hint{font-weight:600;}
          .su-set{font-family:${MONO};font-size:12px;color:${INK};padding:1px 7px;border-radius:6px;background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 16%, var(--stg-cell))' : COLORS.accentSoft};white-space:nowrap;}
          .su-set.x{color:${FADED};text-decoration:line-through;background:transparent;padding:1px 2px;}
          .su-pad{width:100%;aspect-ratio:1;border-radius:9px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.5));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-family:${MONO};font-weight:500;color:${INK};cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 2px 0 rgba(28,30,36,0.4);}
          .su-pad:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(28,30,36,0.4);}
          .su-pad.done{color:${STAGE ? 'var(--stg-mute2,#c3c8cf)' : '#c3c8cf'};box-shadow:none;background:${STAGE ? 'var(--stg-surf2)' : '#f4f5f7'};cursor:default;}
          .su-pad.done span{text-decoration:line-through;text-decoration-thickness:2px;}
          .su-pad.armed{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 2px 0 var(--stg-acc, ${COLORS.accentDeep});}
          .su-pad.armed .su-pad-n{color:${STAGE ? 'color-mix(in srgb, var(--stg-onramp, #08222e) 68%, transparent)' : COLORS.accentTint};}
          .su-pad .su-pad-n{position:absolute;bottom:2px;right:4px;font-size:8px;color:${STAGE ? 'var(--stg-mute2,#aab0bb)' : '#aab0bb'};font-weight:500;}
          .su-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .su-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="sums"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 11&times;11</span>}
          blocks={'SUMS'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* Start tile — sits where the board goes until the player presses
            Start, which begins the clock. The grid stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Sums is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Every run of white squares adds up to the total printed at its head. Digits 1 to 9, and no digit repeats inside a run. {PUZZLE.sunday ? 'The Sunday Edition is 11×11.' : `A ${N}×${N} board, ${FREE.length} squares.`}</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="su-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* Both figures move UP into the cap on a loft page; printing them
              twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>filled <b style={{ color: filledCount === FREE.length ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{filledCount}</b>/{FREE.length}</span>
          </div>
          )}

          {/* the grid: black squares carry the totals, split on the diagonal */}
          <div style={{ maxWidth: GRID_MAX, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`, aspectRatio: '1', border: '2.5px solid var(--stg-line3, rgba(28,30,36,0.85))', borderRadius: 4, overflow: 'hidden' }}>
              {Array.from({ length: CELLS }).map((_, idx) => {
                const r = Math.floor(idx / N), c = idx % N;
                const black = !!givenFlat[idx];
                if (black) {
                  const a = PUZZLE.across[r][c], dn = PUZZLE.down[r][c];
                  const runDone = (dir) => {
                    const ri = RUNS.findIndex((run) => run.dir === dir && run.head === idx);
                    return ri >= 0 && RUNS[ri].cells.every((x) => cells[x]);
                  };
                  return (
                    <div key={idx} className={`su-cell su-black${a || dn ? ' su-clue' : ''}`} style={cellStyle(idx)}>
                      {a ? <span className={`su-a${runDone('a') ? ' done' : ''}`}>{a}</span> : null}
                      {dn ? <span className={`su-d${runDone('d') ? ' done' : ''}`}>{dn}</span> : null}
                    </div>
                  );
                }
                const val = cells[idx];
                const cls = `su-cell ${val ? 'su-user' : ''}`;
                return (
                  <div key={idx} className={cls} style={cellStyle(idx)}
                    onClick={() => cellClick(idx)}
                    onPointerDown={() => startLong(idx)}
                    onPointerUp={cancelLong}
                    onPointerLeave={cancelLong}
                    onPointerCancel={cancelLong}>
                    {val ? (
                      <span style={{ fontSize: N > 7 ? 'clamp(15px, 4.2vw, 24px)' : 'clamp(19px, 6.4vw, 29px)' }}>{val}</span>
                    ) : notes[idx] ? (
                      <div className="su-notes">
                        {DIGITS.map((d) => (
                          <span key={d} className="su-note">{(notes[idx] & (1 << d)) ? d : ''}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* The combo line: the whole trick of the game, read off the selected
              square's runs. Total, what is still owed, and every digit set that
              can still finish the run given what is already placed. */}
          {playing && (
            <div className="su-combo" style={{ maxWidth: GRID_MAX, margin: '10px auto 0' }}>
              {comboInfo.length ? comboInfo.map((ci) => {
                const live = ci.sets.filter((x) => x.live);
                const dead = ci.sets.filter((x) => !x.live);
                return (
                  <div key={ci.dir} className="su-combo-row">
                    <span className="su-combo-lbl">{ci.total} {ci.dir === 'a' ? 'across' : 'down'} in {ci.len}</span>
                    {ci.left > 0 && ci.left < ci.len && <span className="su-combo-left">{ci.need} left in {ci.left}</span>}
                    {ci.left === 0 && <span className="su-combo-left">{ci.need === 0 ? 'adds up' : 'does not add up'}</span>}
                    {ci.left > 0 && live.slice(0, 6).map((x, i) => <span key={`l${i}`} className="su-set">{x.rest.join(' ')}</span>)}
                    {ci.left > 0 && live.length > 6 && <span className="su-set x">+{live.length - 6} more</span>}
                    {ci.left > 0 && live.length === 0 && <span className="su-set x">no set fits what is placed</span>}
                    {ci.left > 0 && dead.length > 0 && dead.length <= 2 && dead.map((x, i) => <span key={`d${i}`} className="su-set x">{x.rest.join(' ')}</span>)}
                  </div>
                );
              }) : <div className="su-combo-row"><span className="su-combo-hint">Tap a square to see which digit sets fit its runs.</span></div>}
            </div>
          )}

          {/* number pad + tools */}
          {playing && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', gap: 5, maxWidth: GRID_MAX, margin: '14px auto 0' }}>
                {DIGITS.map((d) => {
                  const done = !!digitDone[d];
                  return (
                    <button key={d} className={`su-pad${done ? ' done' : ''}${armed === d ? ' armed' : ''}`} onClick={() => { if (!done) padTap(d); }} aria-label={`enter ${d}`}>
                      <span style={{ fontSize: 'clamp(16px, 4.6vw, 24px)' }}>{d}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button className={`su-tool${noteMode ? ' on' : ''}`} onClick={() => setNoteMode((m) => !m)} title="Toggle pencil notes (N)">
                  <Pencil size={14} /> Notes {noteMode ? 'on' : 'off'}
                </button>
                <button className="su-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                  <RotateCcw size={14} /> Undo
                </button>
                <button className="su-tool" onClick={() => eraseCell(sel)} title="Erase selected square (Backspace)">
                  <Eraser size={14} /> Erase
                </button>
                <button className="su-tool" onClick={clearBoard} disabled={!hasEntries}
                  title="Clear every number you have entered and start the grid over on the same clock"
                  style={hasEntries
                    ? (armClear
                      ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderColor: 'rgba(192,57,43,0.5)', color: `var(--stg-ink, ${COLORS.rust})` }
                      : undefined)
                    : { opacity: 0.4, cursor: 'default' }}>
                  <Trash2 size={14} /> {armClear ? 'Tap again to clear' : 'Clear'}
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="su-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(29,78,216,0.5)', color: ACC_DEEP_INK }}>
                    <Lightbulb size={14} /> Hint
                  </button>
                )}
              </div>
            </>
          )}

        {/* Controls sit INSIDE the board card on purpose: on the navy stage a
            bare row of faded text has nothing to sit on. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: armed ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {armed
                ? `Placing ${armed}: tap squares to fill, long-press to pencil. Tap ${armed} again to put it down.`
                : sel >= 0
                  ? (noteMode ? 'Tap a number to pencil it in' : 'Tap a number, or pick a number then tap squares')
                  : 'Tap a square then a number, or pick a number then tap squares'}
            </span>
            {identity && filledCount > 0 && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and fills the solution' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: an 11&times;11 board, the week&rsquo;s biggest grid.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Sums in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new kakuro drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/sums?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Sums &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/sums" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Sums &rarr;</a>
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
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Sums"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${filledCount}/${FREE.length} filled · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Sums all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            archive={puzzles
              .filter((p) => p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/sums?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished grid', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the solution', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Sums', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/sums?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        {/* end of the play stage; everything below is the light tail */}
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="sums" name="Sums" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="sums" name="Sums" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {/* The tail is gone on a loft page: the end card already carries the
              board, the day, what to play next and the archive. */}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="sums"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="sums" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Sums to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s kakuro, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s kakuro, every day.
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

      {/* end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="sums"
          won={won}
          headline={won ? <>Grid solved!</> : <>Grid revealed</>}
          subline={won
            ? <>solved in {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>the solved grid is shown above</>}
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
            <button className="su-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Sums — crawlable prose, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Sums</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Sums is a free daily kakuro from Mind Loft, the cross-sums crossword. Each day gives you a crossword-shaped grid where every run of white squares carries a total in the black square at its head: the across total top right, the down total bottom left. Fill every run with digits 1 to 9 that add up to its total, and never repeat a digit inside a run.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The whole trick is that some totals can only be made one way. Three in two squares is always 1 and 2, sixteen in two is always 7 and 9, twenty-four in three is always 7, 8 and 9. Those fixed runs are your footholds, and where one crosses another run the crossing square usually cracks it. The line under the board lists every digit set that still fits the square you have picked. Every board has a single solution you can always reach by deduction, with no guessing anywhere. Wrong entries are never flagged, so spotting your own slips is part of the puzzle, and because nothing is counted against you the daily leaderboard is a straight race on the clock.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new grid drops every day at midnight Eastern. Weekdays are 7&times;7 and step up through the week, and Sundays are an 11&times;11 Edition. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. Like the arithmetic? Try <a href="/cages" style={{ color: INK, fontWeight: 800 }}>Cages</a>, the killer sudoku, <a href="/sando" style={{ color: INK, fontWeight: 800 }}>Sando</a>, the sandwich sudoku, and <a href="/crunch" style={{ color: INK, fontWeight: 800 }}>Crunch</a>, six numbers and one target.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
