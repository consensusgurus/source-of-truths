'use client';

// Jester — the daily court-placement logic puzzle (Star Battle, one star).
//
// One board a day: seat exactly one jester in every row, every column, and
// every colored court; no two jesters may touch, not even diagonally. Every
// banked board is machine-verified to a UNIQUE solution and to fall to pure
// deduction (see scripts/verify-jester.mjs). Tap a cell to seat a 🃏 (jester);
// tap again to rule it out (✗), once more to clear. Hold or right-click
// also seats a jester directly. Auto-✗ marks are derived from the seated
// jesters, so lifting a jester clears the marks it stamped. The board solves
// itself the instant all jesters are seated legally.
//
// The client never receives the solution over the wire: the server page
// strips it, and this component re-derives the unique placement from the
// regions with a backtracking solver (instant at 8x8/9x9).
//
// Scoring: a solve is 10/10; the daily board ranks solvers by fewest
// placements (tap-downs of a jester), then fastest time. Revealing ends the
// day at 0. One free hint (seats one correct jester) — unregistered players
// only, per the house rule.
//
// Same daily plumbing as Circa/Suds/Alibi: banked boards gated by Eastern
// date on the server (app/jesters/page.js), per-puzzle localStorage saves,
// /jesters?p=N archive pinning, streaks + stats, and the shared /api/quiz/*
// board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Lightbulb, Eraser, Eye, Undo2 } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { regionStyle, regionMix } from '@/lib/category-ramp';
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
  accent: '#7c3aed',        // Jester identity — motley violet
  accentSoft: '#ede9fe',
  accentDeep: '#5b21b6',
  green: T.successDeep,
};
const REGION_FILLS = ['#fde2e2', '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff', '#fce7f3', '#e0f2fe', '#ffedd5', '#e2e8f0', '#d9f2ea'];
// A court that already holds its quota washes out, so the eye skips it. On a
// two-jester board this is the only "you finished something" signal left: one
// seated jester no longer closes its row, so the old auto-✗ cascade is gone.
const REGION_FILLS_DONE = REGION_FILLS.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  const wash = (x) => Math.round(x + (250 - x) * 0.66);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(wash);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
});
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_jester_help_seen';
const STATS_KEY = 'sot_jester_stats';
const TOOL_KEY = 'sot_jester_tool';   // remembered marking tool: 'x' | 'jester'
const TOTAL = 10;
const UNDO_MAX = 50;

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

// ─── Solver: re-derive THE unique placement from the regions (no answer wire)
// Works for one OR two jesters per row: `stars` is the quota for every row,
// column and court. Returns rows of column arrays, so a one-jester board comes
// back as [[3],[1],[5]...] and a Sunday two-jester board as [[2,8],[0,4]...].
function solveBoard(n, regions, stars = 1) {
  // every legal way a single row can seat its jesters (never adjacent)
  const rowCombos = [];
  (function build(start, acc) {
    if (acc.length === stars) { rowCombos.push(acc.slice()); return; }
    for (let c = start; c < n; c++) {
      if (acc.length && c - acc[acc.length - 1] < 2) continue;
      acc.push(c); build(c + 1, acc); acc.pop();
    }
  })(0, []);

  const colCount = Array(n).fill(0);
  const regCount = Array(n).fill(0);
  const rows = [];
  const walk = (r) => {
    if (r === n) return colCount.every((x) => x === stars) && regCount.every((x) => x === stars);
    for (const combo of rowCombos) {
      let ok = true;
      for (const c of combo) if (colCount[c] >= stars) { ok = false; break; }
      if (ok && r > 0) {
        for (const c of combo) {
          for (const pc of rows[r - 1]) if (Math.abs(c - pc) <= 1) { ok = false; break; }
          if (!ok) break;
        }
      }
      if (!ok) continue;
      const tally = {};
      for (const c of combo) { const id = regions[r][c]; tally[id] = (tally[id] || 0) + 1; }
      for (const id in tally) if (regCount[id] + tally[id] > stars) { ok = false; break; }
      if (!ok) continue;
      for (const c of combo) colCount[c]++;
      for (const id in tally) regCount[id] += tally[id];
      rows.push(combo);
      // every column must still be able to reach its quota in the rows left
      const left = n - r - 1;
      let reachable = true;
      for (let c = 0; c < n; c++) if (stars - colCount[c] > left * stars) { reachable = false; break; }
      if (reachable && walk(r + 1)) return true;
      rows.pop();
      for (const c of combo) colCount[c]--;
      for (const id in tally) regCount[id] -= tally[id];
    }
    return false;
  };
  return walk(0) ? rows.map((x) => x.slice()) : null;
}

// ─── Personal stats + streak (localStorage), Circa/Suds pattern ─────────────
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
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshCells(n) {
  return Array.from({ length: n }, () => Array(n).fill(0)); // 0 blank | 1 x | 2 jester
}
function freshState(n) {
  return {
    v: 1,
    cells: freshCells(n),
    locked: [],                 // [r,c] pairs seated by the hint (not removable)
    placements: 0,              // total jester tap-downs (daily-board tiebreak)
    hintUsed: false,
    status: 'playing',          // playing | done | lost
    t0: null,
    tEnd: null,
  };
}

// A little motley-hat mark, drawn inline so it is crisp at any cell size.
function JesterMark({ size = 22, color = `var(--stg-acc-ink, ${COLORS.accentDeep})`, conflict = false }) {
  const fill = conflict ? `var(--stg-bad, #b91c1c)` : color;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', color: fill }}>
      <path d="M3 15 5 6l4.2 4L12 3l2.8 7L19 6l2 9z" fill="currentColor" />
      <circle cx="3.4" cy="14.6" r="1.6" fill="currentColor" />
      <circle cx="5" cy="5.6" r="1.6" fill="currentColor" />
      <circle cx="12" cy="2.9" r="1.6" fill="currentColor" />
      <circle cx="19" cy="5.6" r="1.6" fill="currentColor" />
      <circle cx="20.6" cy="14.6" r="1.6" fill="currentColor" />
      <rect x="4" y="17" width="16" height="3.6" rx="1.4" fill="currentColor" />
    </svg>
  );
}

export default function JesterClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.size;
  // Sundays seat TWO jesters per row, column and court; every other day one.
  const STARS = PUZZLE.stars || 1;
  const SEATS = N * STARS;
  const STORE_KEY = `sot_jester_${PUZZLE.num}`;
  const SOLUTION = useMemo(() => solveBoard(N, PUZZLE.regions, STARS), [N, PUZZLE, STARS]);

  // Viewport width, measured on mount so the grid can be sized to fit. Null
  // until hydrated, so SSR and first paint agree on the desktop size.
  const [vw, setVw] = useState(null);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [g, setG] = useState(() => freshState(N));
  const [autoX, setAutoX] = useState(true);
  // Which marker a tap places. Defaults to ✗ (the negative marker) — most
  // players rule cells out far more than they seat jesters — and remembers the
  // player's last choice across days. Hold / right-click always seats a jester
  // regardless of the tool.
  const [tool, setTool] = useState('x');   // 'x' | 'jester'
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('jester', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('jester'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [revealArmed, setRevealArmed] = useState(false);
  const histRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  // Long-press plumbing: a held touch seats a jester; the flag suppresses the
  // click/contextmenu that follows so the jester isn't immediately cleared.
  const pressTimer = useRef(null);
  const longFired = useRef(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('jesters');
  const STAGE = isStage('jester', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('jester');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('jester'), '--stg-acc-lt': gameColorLight('jester'), '--stg-onramp-lt': gameOnrampLight('jester'), '--stg-acc-ink-lt': gameAccentInkLight('jester') };
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
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'done';
  const score = g.status === 'done' ? TOTAL : 0;

  // conflicts: pairs of jesters sharing a row/col/region or touching.
  // attackedSet: every cell any seated jester rules out (its row, column,
  // court and 8 neighbours). This DERIVES the auto-✗ overlay at render time
  // instead of stamping ✗ into storage, so lifting a jester makes its ✗'s
  // vanish on their own — while a cell still ruled out by another jester
  // (or ✗'d by hand) stays marked.
  // A row / column / court only quarrels once it holds MORE than its quota, and
  // a full unit is only pencilled out once it is FULL. On a two-jester board
  // seating one jester therefore does NOT close its row, which is the whole game.
  const { jesters, conflictSet, seated, attackedSet } = useMemo(() => {
    const js = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g.cells[r][c] === 2) js.push([r, c]);
    const bad = new Set();
    for (let i = 0; i < js.length; i++) for (let j = i + 1; j < js.length; j++) {
      const [r1, c1] = js[i], [r2, c2] = js[j];
      if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) { bad.add(r1 * N + c1); bad.add(r2 * N + c2); }
    }
    const rowsHeld = Array.from({ length: N }, () => []);
    const colsHeld = Array.from({ length: N }, () => []);
    const regsHeld = Array.from({ length: N }, () => []);
    for (const [r, c] of js) {
      rowsHeld[r].push([r, c]); colsHeld[c].push([r, c]); regsHeld[PUZZLE.regions[r][c]].push([r, c]);
    }
    for (const held of [rowsHeld, colsHeld, regsHeld]) {
      for (const unit of held) if (unit.length > STARS) for (const [r, c] of unit) bad.add(r * N + c);
    }
    const attacked = new Set();
    for (const [jr, jc] of js) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const r2 = jr + dr, c2 = jc + dc;
        if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N) attacked.add(r2 * N + c2);
      }
    }
    for (let r = 0; r < N; r++) if (rowsHeld[r].length >= STARS) for (let c = 0; c < N; c++) attacked.add(r * N + c);
    for (let c = 0; c < N; c++) if (colsHeld[c].length >= STARS) for (let r = 0; r < N; r++) attacked.add(r * N + c);
    for (let id = 0; id < N; id++) {
      if (regsHeld[id].length < STARS) continue;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (PUZZLE.regions[r][c] === id) attacked.add(r * N + c);
    }
    return { jesters: js, conflictSet: bad, seated: js.length, attackedSet: attacked };
  }, [g.cells, N, PUZZLE, STARS]);

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
        if (saved && saved.v === 1 && saved.cells && saved.cells.length === N) setG({ ...freshState(N), ...saved });
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      const t = localStorage.getItem(TOOL_KEY);
      if (t === 'x' || t === 'jester') setTool(t);
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_jester_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_jester_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // remember the player's marking tool across days
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(TOOL_KEY, tool); } catch (e) {}
  }, [tool, hydrated]);

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
  const iq = useIqStanding({ game: 'jester', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'jester', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'jester', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'jester', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'jester', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // Record an in-progress board if the player interacts then leaves before
  // finishing (Tuck's abandoned-puzzle pattern). Loading the page does NOT
  // count; the first tap sets g.t0, which is the "started" signal. On exit we
  // post a 0-score result so every started puzzle lands in the stats even when
  // abandoned. The localStorage marker stops a resume-then-leave-again cycle
  // from double-posting; markFlushed() in postResult suppresses the exit post
  // once the puzzle concludes normally (solve or reveal).
  const REC_KEY = `sot_jester_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually marks a cell (or takes a
    // hint). Opening the board and dismissing the start gate does not log a 0.
    const acted = g.cells.some((row) => row.some((v) => v > 0)) || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: g.placements, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.placements, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = jester placements, so the daily board's ties break by
        // the surer solver (fewest tap-downs), then by time.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: g2.placements, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Closing the start gate begins the clock (sets t0) and marks the rules as
  // seen. A no-op once started, so re-reading the rules never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // auto-solve the instant the seating is legal and complete
  useEffect(() => {
    if (!hydrated || !playing || !SOLUTION) return;
    if (seated === SEATS && conflictSet.size === 0) {
      setG((cur) => {
        if (cur.status !== 'playing') return cur;
        const g2 = { ...cur, status: 'done', tEnd: Date.now(), t0: cur.t0 || Date.now() };
        postResult(g2, TOTAL);
        return g2;
      });
      setEndClosed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seated, conflictSet, hydrated, playing, SEATS]);

  // Undo: snapshot cells + placement count before each mutation so one press
  // rolls back a misplaced jester AND the auto-x cascade it stamped. In-memory
  // only (never persisted), cleared on puzzle change and reset, Alibi's pattern.
  useEffect(() => { histRef.current = []; setCanUndo(false); }, [PUZZLE.num]);
  function pushHist(cells, placements) {
    const h = histRef.current;
    h.push({ cells: cells.map((row) => row.slice()), placements });
    if (h.length > UNDO_MAX) h.shift();
    setCanUndo(true);
  }
  function undo() {
    if (!playing) return;
    const prev = histRef.current.pop();
    if (!prev) { setCanUndo(false); return; }
    setG((cur) => ({ ...cur, cells: prev.cells, placements: prev.placements }));
    setCanUndo(histRef.current.length > 0);
    setRevealArmed(false);
  }
  function clearHist() { histRef.current = []; setCanUndo(false); }

  function isLocked(r, c) {
    return g.locked.some(([lr, lc]) => lr === r && lc === c);
  }

  // A single tap places the currently selected tool. In ✗ mode (the default) it
  // toggles a hand ✗ on a blank cell and clears any mark or jester already
  // there; in 🃏 mode it seats/lifts a jester. Seating a jester counts a
  // placement; with auto-✗ on it pencils out the whole row/column/court/
  // neighbours for free (a derived overlay, not stored ✗'s), so lifting the
  // jester takes those auto marks with it. Only 1 (a hand-placed ✗) or 2 (a
  // jester) is ever written to storage.
  function tapCell(r, c) {
    if (!playing) return;
    if (isLocked(r, c)) { say('The hint seated that jester — it stays.'); return; }
    pushHist(g.cells, g.placements);
    setG((cur) => {
      const cells = cur.cells.map((row) => row.slice());
      const v = cells[r][c];
      const next = tool === 'jester'
        ? (v === 2 ? 0 : 2)   // 🃏 mode: seat a jester / lift it
        : (v === 0 ? 1 : 0);  // ✗ mode: mark a blank cell, or clear a mark/jester
      cells[r][c] = next;
      const placements = next === 2 ? cur.placements + 1 : cur.placements;
      return { ...cur, cells, placements, t0: cur.t0 || Date.now() };
    });
  }

  // Hold (mobile) or right-click (desktop) drops a jester directly: blank/✗ →
  // 🃏, 🃏 → blank. Seating counts a placement. The auto-✗ pencil-out is a
  // derived overlay (see attackedSet), so no ✗'s are written here and lifting
  // the jester clears its marks automatically.
  function toggleJester(r, c) {
    if (!playing) return;
    if (isLocked(r, c)) { say('The hint seated that jester — it stays.'); return; }
    pushHist(g.cells, g.placements);
    setG((cur) => {
      const cells = cur.cells.map((row) => row.slice());
      const next = cells[r][c] === 2 ? 0 : 2;
      cells[r][c] = next;
      const placements = next === 2 ? cur.placements + 1 : cur.placements;
      return { ...cur, cells, placements, t0: cur.t0 || Date.now() };
    });
  }

  function startPress(r, c) {
    longFired.current = false;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      toggleJester(r, c);
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
    }, 420);
  }
  function endPress() { clearTimeout(pressTimer.current); }

  function clearBoard() {
    if (!playing) return;
    pushHist(g.cells, g.placements);
    setG((cur) => {
      const cells = freshCells(N);
      for (const [r, c] of cur.locked) cells[r][c] = 2;
      return { ...cur, cells };
    });
  }

  // one free hint: seat one correct jester (first play only)
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed || !SOLUTION) return;
    setG((cur) => {
      // prefer a seat the solution wants that is not filled yet
      let target = null;
      for (let r = 0; r < N && !target; r++) {
        for (const c of SOLUTION[r]) if (cur.cells[r][c] !== 2) { target = [r, c]; break; }
      }
      if (!target) return { ...cur, hintUsed: true };
      const [r, c] = target;
      const cells = cur.cells.map((row) => row.slice());
      // lift any jester in that row the solution does not want
      for (let c2 = 0; c2 < N; c2++) if (cells[r][c2] === 2 && !SOLUTION[r].includes(c2)) cells[r][c2] = 0;
      cells[r][c] = 2;
      return { ...cur, cells, locked: [...cur.locked, [r, c]], hintUsed: true, placements: cur.placements + 1, t0: cur.t0 || Date.now() };
    });
    say('One jester seated for you.');
  }

  function reveal() {
    if (!playing || !SOLUTION) return;
    if (!revealArmed) { setRevealArmed(true); setTimeout(() => setRevealArmed(false), 3500); return; }
    setRevealArmed(false);
    setG((cur) => {
      const cells = freshCells(N);
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) cells[r][c] = SOLUTION[r].includes(c) ? 2 : 1;
      }
      const g2 = { ...cur, cells, status: 'lost', tEnd: Date.now(), t0: cur.t0 || Date.now() };
      postResult(g2, 0);
      return g2;
    });
    setEndClosed(false);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(N)); setEndClosed(false); clearHist();
  }

  // Shrink to fit rather than scroll: a board you cannot see end to end makes
  // row and column counting impossible, which is most of a two-jester solve.
  // COUNTER_GUTTER is the margin the per-row remaining-seat numbers sit in.
  const COUNTER_GUTTER = vw && vw <= 560 ? 17 : 22;
  const boardBoxRef = useRef(null);
  const [boxW, setBoxW] = useState(0);
  const cellPx = useMemo(() => {
    const base = N >= 10 ? 38 : N === 9 ? 42 : 46;
    const frame = 6 + COUNTER_GUTTER;         // board border + counter gutter
    // The measured box when we have it, the old estimate only until the first
    // measurement lands, so the very first paint is never wildly wrong.
    const box = boxW || (vw ? Math.min(vw - (vw <= 560 ? 20 : 76), 640) : 0);
    if (!box) return base;
    const avail = Math.min(box, 640) - frame;
    // The floor is low enough that it never binds before the box does, so a
    // narrow phone still gets a whole board rather than a scroller.
    return Math.max(22, Math.min(base, Math.floor(avail / N)));
  }, [boxW, vw, N, COUNTER_GUTTER]);

  // Seats still to fill in each row and column. This is the whole mental load
  // on a two-jester board, where "does this row want one more or two?" is not
  // answerable at a glance the way it is when the quota is one.
  useEffect(() => {
    const el = boardBoxRef.current;
    if (!el) return undefined;
    const apply = () => setBoxW(el.clientWidth || 0);
    apply();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', apply);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', apply); };
  }, [preStart]);

  const { rowRemain, colRemain } = useMemo(() => {
    const rr = Array(N).fill(STARS), cc = Array(N).fill(STARS);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (g.cells[r][c] === 2) { rr[r]--; cc[c]--; }
    }
    return { rowRemain: rr, colRemain: cc };
  }, [g.cells, N, STARS]);

  // Courts that already hold their quota.
  const doneRegions = useMemo(() => {
    const tally = {};
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (g.cells[r][c] === 2) { const id = PUZZLE.regions[r][c]; tally[id] = (tally[id] || 0) + 1; }
    }
    const out = new Set();
    for (const id in tally) if (tally[id] >= STARS) out.add(Number(id));
    return out;
  }, [g.cells, N, STARS, PUZZLE]);

  const counterStyle = (v) => ({
    fontFamily: MONO, fontSize: Math.max(10, Math.round(cellPx * 0.32)), fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: v < 0 ? `var(--stg-bad, ${COLORS.rust})` : v === 0 ? 'var(--stg-dim, rgba(28,30,36,0.28))' : `var(--stg-ink, ${COLORS.ink})`,
  });

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead={<>Seat exactly <b>{STARS === 2 ? 'two jesters' : 'one jester'}</b> in every row, every column and every colored court.</>}
      chips={[
        { label: 'Red = quarrelling jesters', tone: 'bad' },
        { label: 'Edge number = seats still owed', tone: 'grey' },
        { label: 'Faded court = full', tone: 'good' },
      ]}
      steps={[
        <>Jesters are jealous, so <b>no two may touch</b>, not even diagonally.</>,
        <>The <b>✗</b> / <b>🃏</b> buttons set what a tap places, opening on <b>✗</b> to rule a cell out and remembering your choice. <b>Hold</b> a cell (right-click on a computer) to seat a jester in either mode, and tap a seated jester to lift it.</>,
        <>Leave <b>auto-✗</b> on and seating a jester pencils out its neighbours, plus its row, column or court once that one is full; lift the jester and those marks clear too. <b>Undo</b> rolls back your last move.</>,
        <>The board completes itself the moment the last jester is seated legally.</>,
      ]}
      knack="Every board has exactly one legal seating, reachable by pure deduction, so never guess. A court penned into a single row already owes that row its seat."
      footer="Ties break on fewest placements, then fastest time. Monday through Wednesday seat one jester apiece and climb in difficulty; Thursday through Sunday seat two per row, column and court on a bigger board, where a second in a row is correct and only a third quarrels. Sunday is the hardest court of the week."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="jester" name="Jesters" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="jester" quizId={PUZZLE.quizId}
          name="Jesters"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="je-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.je-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .je-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .je-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .je-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .je-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 86%, var(--stg-ink, var(--white)));}
          .je-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .je-tool.on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});}
          /* THE COURT READS BRIGHTER ON THE DARK STAGE (owner, 2026-09-08: "can we make
             this a bit brighter on dark mode?"). The shared region ramp mixes a hue into
             the cell at --stg-tint-mix, 26% dark / 12% light, and on Jesters the courts
             are the whole puzzle, so 26 read as a muddy heat map. The board re-declares
             the mix through --stg-dk (100% dark, 0% light): 52% on the dark register (owner
             asked for more after 40),
             the light register's 12% untouched. Other region boards keep the token. */
          .je-court{--stg-tint-mix:calc(12% + var(--stg-dk, 100%) * 0.40);}
          .je-cell{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;}
          .je-cell:hover::after{content:'';position:absolute;inset:0;background:rgba(28,30,36,0.07);}
          /* The mark is the register's INK, not a hardcoded near-black: on the dark stage
             rgba(28,30,36,.45) was invisible on every court (owner, 2026-09-08: "I can't
             even see the xs"). Ink at 85% on the dark register, 50% on the light one (via --stg-dk,
             so light stays where it was); the JSX's own .6 for auto marks multiplies in. */
          .je-x{color:color-mix(in srgb, var(--stg-ink, #1c1e24) calc(50% + var(--stg-dk, 100%) * 0.35), transparent);font-size:15px;font-weight:800;}
          @media(max-width:560px){.je-board-scroll{overflow-x:auto;padding-bottom:6px;}}
        `}</style>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead */}
        {!LOFT && (
        <DailyMasthead
          slug="jesters"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={3}
          helpTop={8}
          marginBottom={10}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {STARS === 2 ? <>Double Court {N}&times;{N}</> : <>Jubilee {N}&times;{N}</>}</span>}
          blocks={'JESTERS'.split('').map((ch, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 18, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

        {/* status bar */}
        {!preStart && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
          <span>seated <b style={{ color: INK, fontWeight: 500 }}>{seated}</b>/{SEATS}</span>
          <span>quarrels <b style={{ color: conflictSet.size ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{conflictSet.size ? conflictSet.size : 0}</b></span>
          {g.hintUsed && <span>&#128161; hint used</span>}
          {playing && (
            <label style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>
              <input type="checkbox" checked={autoX} onChange={(e) => setAutoX(e.target.checked)} style={{ accentColor: `var(--stg-acc, ${COLORS.accent})` }} />
              auto-✗ when you seat a jester
            </label>
          )}
        </div>
        )}

        {/* start gate — the court stays covered until Start begins the clock */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The court is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Seat {STARS === 2 ? 'two jesters' : 'one jester'} in every row, column and colored court, with none touching. The board stays covered until you begin.</p>
                {STARS === 2 && (
                  <p style={{ margin: '0 0 6px' }}>This court takes <b>two</b> per row, column and court, so a second jester in a row is correct here and only a third is a quarrel. The numbers around the edge count the seats each row and column still owes.</p>
                )}
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="je-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the board */}
        {!preStart && (
        <div className="je-board-scroll" ref={boardBoxRef} style={{ textAlign: 'center' }}>
         <div style={{ display: 'inline-block' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div className="je-court" style={{ display: 'inline-block', border: `3px solid ${T.ink}`, borderRadius: 10, overflow: 'hidden', background: T.ink, boxShadow: '0 2px 10px rgba(20,22,28,0.12)' }}>
            {PUZZLE.regions.map((row, r) => (
              <div key={r} style={{ display: 'flex' }}>
                {row.map((id, c) => {
                  const v = g.cells[r][c];
                  const conflict = v === 2 && conflictSet.has(r * N + c);
                  // ✗ shows for a hand-placed mark (v === 1) or, with auto-✗ on,
                  // any empty cell a seated jester rules out. Auto marks render a
                  // touch lighter and disappear the moment their jester is lifted.
                  const autoMark = autoX && v === 0 && attackedSet.has(r * N + c);
                  const showX = v === 1 || autoMark;
                  const locked = isLocked(r, c);
                  const bTop = r > 0 && PUZZLE.regions[r - 1][c] !== id ? `2px solid ${T.ink}` : r > 0 ? '1px solid rgba(28,30,36,0.18)' : 'none';
                  const bLeft = c > 0 && PUZZLE.regions[r][c - 1] !== id ? `2px solid ${T.ink}` : c > 0 ? '1px solid rgba(28,30,36,0.18)' : 'none';
                  return (
                    <div
                      key={c}
                      className="je-cell"
                      onClick={() => { if (longFired.current) { longFired.current = false; return; } tapCell(r, c); }}
                      onContextMenu={(e) => { e.preventDefault(); if (longFired.current) return; toggleJester(r, c); }}
                      onTouchStart={() => startPress(r, c)}
                      onTouchEnd={endPress}
                      onTouchMove={endPress}
                      onTouchCancel={endPress}
                      role="button"
                      aria-label={`Row ${r + 1}, column ${c + 1}: ${v === 2 ? 'jester' : showX ? 'ruled out' : 'blank'}${conflict ? ', quarrelling' : ''}. Tap to place the ${tool === 'jester' ? 'jester' : '✗ mark'}; hold or right-click to seat a jester directly.`}
                      style={{ ...(STAGE ? regionStyle(id) : null), width: cellPx, height: cellPx,
                        // Stage: the court's ramp hue mixed into the cell at the register's mix, a
                        // full court at half of it (it fades on either ground instead of washing
                        // toward a literal white), a quarrel in the page's own red. Loft: untouched.
                        background: STAGE
                          ? (conflict ? 'color-mix(in srgb, var(--stg-bad) 38%, var(--stg-cell))' : regionMix(doneRegions.has(id) ? 0.5 : 1))
                          : (conflict ? '#fecaca' : (doneRegions.has(id) ? REGION_FILLS_DONE : REGION_FILLS)[id % REGION_FILLS.length]), borderTop: bTop, borderLeft: bLeft, boxShadow: locked ? `inset 0 0 0 2px var(--stg-acc, ${COLORS.accent})` : 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'manipulation' }}
                    >
                      {v !== 2 && showX && <span className="je-x" style={autoMark ? { opacity: 0.6 } : undefined}>✗</span>}
                      {v === 2 && <JesterMark size={Math.round(cellPx * 0.6)} conflict={conflict} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {/* seats still to fill in each row */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 3 }}>
            {rowRemain.map((v, r) => (
              <div key={r} role="img" aria-label={v === 0 ? `Row ${r + 1} is full` : v < 0 ? `Row ${r + 1} has ${-v} too many` : `Row ${r + 1} needs ${v} more`}
                style={{ ...counterStyle(v), width: COUNTER_GUTTER, height: cellPx }}>{v === 0 ? '✓' : v}</div>
            ))}
          </div>
          </div>
          {/* seats still to fill in each column */}
          <div style={{ display: 'flex', paddingLeft: 3 }}>
            {colRemain.map((v, c) => (
              <div key={c} role="img" aria-label={v === 0 ? `Column ${c + 1} is full` : v < 0 ? `Column ${c + 1} has ${-v} too many` : `Column ${c + 1} needs ${v} more`}
                style={{ ...counterStyle(v), width: cellPx, height: COUNTER_GUTTER }}>{v === 0 ? '✓' : v}</div>
            ))}
            <div style={{ width: COUNTER_GUTTER }} />
          </div>
         </div>
        </div>
        )}

        {started && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0 2px' }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>Tap places</span>
            <button type="button" className={`je-tool${tool === 'x' ? ' on' : ''}`} onClick={() => setTool('x')} title="Rule cells out (default)" aria-pressed={tool === 'x'}>
              <span style={{ fontWeight: 900, fontSize: 14, lineHeight: 1 }}>✗</span> Mark
            </button>
            <button type="button" className={`je-tool${tool === 'jester' ? ' on' : ''}`} onClick={() => setTool('jester')} title="Seat a jester" aria-pressed={tool === 'jester'}>
              <JesterMark size={14} color={tool === 'jester' ? `var(--stg-onramp, ${T.white})` : `var(--stg-acc-ink, ${COLORS.accentDeep})`} /> Jester
            </button>
          </div>
        )}

        {started && (
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: FADED, textAlign: 'center', margin: '6px 0 0', lineHeight: 1.5 }}>
            {tool === 'jester'
              ? 'Seating jesters: tap to seat one, tap again to lift it. Switch to ✗ to rule cells out.'
              : 'Ruling out: tap to mark a cell ✗, tap again to clear it. Switch to 🃏 to seat jesters — or just hold / right-click any cell to seat one.'}
          </div>
        )}

        {started && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '12px 0 6px' }}>
            <button type="button" className="je-btn" onClick={clearBoard}><Eraser size={14} /> Clear board</button>
            <button type="button" className="je-btn" onClick={undo} disabled={!canUndo} aria-label="Undo last move" style={canUndo ? undefined : { borderColor: 'var(--stg-line2, #c3c8cf)', color: 'var(--stg-mute2, #c3c8cf)', cursor: 'default' }}><Undo2 size={14} /> Undo</button>
            {hintOk && !g.hintUsed && (
              <button type="button" className="je-btn" onClick={useHint} title="Seat one correct jester (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(124,58,237,0.5)', color: ACC_DEEP_INK }}>
                <Lightbulb size={14} /> Hint: seat one jester
              </button>
            )}
            <button type="button" className="je-btn" onClick={reveal} style={{ borderColor: revealArmed ? COLORS.rust : '#c3c8cf', color: revealArmed ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})` }}>
              <Eye size={14} /> {revealArmed ? 'Tap again to reveal (ends the day)' : 'Reveal'}
            </button>
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '12px auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {won
                      ? <>The whole court is seated &mdash; {g.placements} placement{g.placements === 1 ? '' : 's'}, {elapsed}.{g.hintUsed ? ' (1 hint)' : ''}</>
                      : 'The court dissolved in quarrels — the seating was revealed.'}
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>A new court convenes in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new court convenes at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/jesters?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          replay yesterday&rsquo;s court &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/jesters" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s court &rarr;</a>
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
              name="Jesters"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Jesters all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Placed"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/jesters?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Jesters', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/jesters?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="jesters" name="Jesters" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="jesters" name="Jesters" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="jester"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="jester" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Jesters to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s court, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s court, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 640 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
        </div>
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="jester"
          won={won}
          headline={won ? <>The court is seated</> : <>The court dissolved</>}
          subline={<>Jesters #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {g.placements} placement{g.placements === 1 ? '' : 's'} &middot; {elapsed}</>}
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
            {rulesBody}
            <button className="je-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Jester — crawlable prose for search, server-rendered */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Jesters</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Jesters is a free daily logic puzzle from Mind Loft, a placement puzzle in the classic Star Battle family. The royal court is divided into colored regions, and your job is to seat the jesters so that every row, every column and every court holds its quota: one apiece from Monday to Wednesday, two apiece on the bigger boards from Thursday through Sunday. No two jesters may ever touch, not even at the corners.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board is generated with a constraint solver and machine-verified twice over: once to guarantee exactly one legal seating, and once to confirm the whole board falls to pure step-by-step deduction, rule out cells, corner the possibilities, and the jesters seat themselves. No guessing, no trial and error, no app required.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new court convenes every day at midnight Eastern, each one graded so the week climbs from a gentle Monday, with two jesters per row, column and court from Thursday on and the hardest court of all on Sunday. Play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/sworn" style={{ color: INK, fontWeight: 800 }}>Sworn</a>, our daily liars puzzle, <a href="/alibi" style={{ color: INK, fontWeight: 800 }}>Alibi</a>, our nightly whodunit, and <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const solvedBit = g.status === 'done'
      ? `\u{1F0CF} Seated the court in ${elapsed} · ${g.placements} placements${hintBit}`
      : g.status === 'lost' ? '\u{1F0CF} The court dissolved' : '\u{1F0CF} Still seating the court…';
    const text = playing
      ? `Jesters #${PUZZLE.num} — the daily court-placement puzzle from Mind Loft.\n${withRef(`mindloftdaily.com/jesters${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Jesters — Court #${PUZZLE.num}\n${solvedBit}${streakBit}\n${withRef(`mindloftdaily.com/jesters${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
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
}
