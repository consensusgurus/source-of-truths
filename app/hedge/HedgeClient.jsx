'use client';

// Hedge — the daily slitherlink (loop logic).
//
// Each day: a grid of numbered cells. Draw ONE single closed loop along the
// grid lines so that every number has exactly that many of its four sides on
// the loop. The loop never branches and never crosses itself. Unnumbered cells
// are free. There is exactly one solution.
//
// Tap a segment once for a line, again for a cross (your own "no line here"
// note, free and never scored), again to clear it. Drawing a segment that isn't
// part of the loop turns red and counts as an error. Score is 10 minus half
// your errors, floor 1, so a clean solve is a perfect 10, and ties break on
// fewest errors then fastest time.
//
// Same daily plumbing as Suds/Etch: banked boards gated by Eastern date on the
// server (app/hedge/page.js), per-puzzle localStorage saves, /hedge?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow. Weekdays are
// 7×7; Sundays step up to a 10×10 Edition.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, RotateCcw, X, Lightbulb, Eye, Smartphone } from 'lucide-react';
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
  accent: '#0891b2',       // Hedge identity — cyan
  accentSoft: '#e6f6fa',
  green: T.successDeep,
};
const PRESS_SLOP_PX = 12;      // drift a long press tolerates before it reads as a scroll, same as Sweep's
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_hedge_help_seen';
const STATS_KEY = 'sot_hedge_stats';
const TOOL_KEY = 'sot_hedge_tool';   // remembered drawing tool: 'x' | 'line'

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

// segment state: 0 = untouched, 1 = line drawn, 2 = crossed out (free note)
function freshState(nh, nv) {
  return { v: 1, h: Array(nh).fill(0), vt: Array(nv).fill(0), errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// PAD only has to hold a ringed loose-end dot on the outer edge (r = 0.14 of a
// cell), so it is kept tight: on a phone every unit of padding is a unit taken
// out of the squares, and the Sunday 10x10 needs them.
const CELL = 46, PAD = 16;

export default function HedgeClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const n = PUZZLE.n;
  const NH = (n + 1) * n, NV = n * (n + 1);
  const STORE_KEY = `sot_hedge_${PUZZLE.num}`;
  const hIdx = useCallback((i, j) => i * n + j, [n]);
  const vIdx = useCallback((i, j) => i * (n + 1) + j, [n]);

  const solH = useMemo(() => {
    const f = Array(NH).fill(0);
    for (const [i, j] of PUZZLE.H) f[i * n + j] = 1;
    return f;
  }, [PUZZLE, NH, n]);
  const solV = useMemo(() => {
    const f = Array(NV).fill(0);
    for (const [i, j] of PUZZLE.V) f[i * (n + 1) + j] = 1;
    return f;
  }, [PUZZLE, NV, n]);
  const LOOP_LEN = PUZZLE.H.length + PUZZLE.V.length;

  const [g, setG] = useState(() => freshState(NH, NV));
  const gRef = useRef(g);
  // Which mark a tap places. Defaults to × (the free "no line here" note) — you
  // rule far more segments out than you draw — and remembers the last choice
  // across days. Hold / right-click always draws the loop line, whatever the
  // tool.
  const [tool, setTool] = useState('x');   // 'x' | 'line'
  const pressTimer = useRef(null);
  const pressPos = useRef({ x: 0, y: 0 });
  const longFired = useRef(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('hedge', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('hedge'); }, [g.hintUsed]);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('hedge');
  const STAGE = isStage('hedge', searchParams);
  // A give-up writes the loop into h/vt; on the loft the board keeps the
  // player's own lines until the end card's Reveal answer tile is pressed.
  const hideAns = g.status === 'revealed' && LOFT && !revealed;
  const H = hideAns ? (g.playerH || Array(NH).fill(0)) : g.h;
  const V = hideAns ? (g.playerV || Array(NV).fill(0)) : g.vt;
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('hedge');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('hedge'), '--stg-acc-lt': gameColorLight('hedge'), '--stg-onramp-lt': gameOnrampLight('hedge'), '--stg-acc-ink-lt': gameAccentInkLight('hedge') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const errors = g.errors;
  // What the game actually posted, mirroring the win path: 10 down one
  // point per two errors, floored at 1, and 0 for a give-up. Only the cap
  // reads it, and only once the game is over.
  const endScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;
  const finalScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.h) && saved.h.length === NH && Array.isArray(saved.vt) && saved.vt.length === NV) {
          const next = { ...freshState(NH, NV), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      const t = localStorage.getItem(TOOL_KEY);
      if (t === 'x' || t === 'line') setTool(t);
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
        if (done || g.t0) localStorage.setItem('sot_hedge_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_hedge_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // remember the player's drawing tool across days
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
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'hedge', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'hedge', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'hedge', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'hedge', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'hedge', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const rightDrawn = useMemo(() => {
    let k = 0;
    for (let i = 0; i < NH; i++) if (H[i] === 1 && solH[i] === 1) k++;
    for (let i = 0; i < NV; i++) if (V[i] === 1 && solV[i] === 1) k++;
    return k;
  }, [H, V, solH, solV, NH, NV]);

  // how many drawn lines touch each cell, for clue dimming
  const cellCount = useMemo(() => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        let k = 0;
        if (H[i * n + j] === 1) k++;
        if (H[(i + 1) * n + j] === 1) k++;
        if (V[i * (n + 1) + j] === 1) k++;
        if (V[i * (n + 1) + j + 1] === 1) k++;
        row.push(k);
      }
      out.push(row);
    }
    return out;
  }, [H, V, n]);

  // THE BOARD READOUT (2026-10-14 board rebuild). Everything below is read off
  // the lines on the board, never off the solution: a dot's degree (loose end
  // at 1, a branch above 2), the pieces of loop, the numbers settled and the
  // numbers over. Wrong lines are the one exception, and they were already
  // drawn red before the rebuild.
  const loop = useMemo(() => {
    const D = n + 1;
    const deg = new Array(D * D).fill(0);
    const parent = Array.from({ length: D * D }, (_, k) => k);
    const find = (k) => { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; };
    const join = (a, b) => { const x = find(a), y = find(b); if (x !== y) parent[x] = y; };
    let drawn = 0, wrong = 0;
    for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) {
      const idx = i * n + j;
      if (H[idx] !== 1) continue;
      drawn++; if (solH[idx] !== 1) wrong++;
      const a = i * D + j, b = i * D + j + 1;
      deg[a]++; deg[b]++; join(a, b);
    }
    for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) {
      const idx = i * (n + 1) + j;
      if (V[idx] !== 1) continue;
      drawn++; if (solV[idx] !== 1) wrong++;
      const a = i * D + j, b = (i + 1) * D + j;
      deg[a]++; deg[b]++; join(a, b);
    }
    let ends = 0, branches = 0;
    const roots = new Set();
    for (let k = 0; k < D * D; k++) {
      if (!deg[k]) continue;
      if (deg[k] === 1) ends++;
      if (deg[k] > 2) branches++;
      roots.add(find(k));
    }
    let clues = 0, settled = 0, over = 0;
    PUZZLE.clues.forEach((row, i) => row.forEach((c, j) => {
      if (c === null || c === undefined) return;
      clues++;
      const k = cellCount[i][j];
      if (k === c) settled++; else if (k > c) over++;
    }));
    return { deg, drawn, wrong, ends, branches, pieces: roots.size, clues, settled, over };
  }, [H, V, solH, solV, n, PUZZLE, cellCount]);

  // One status sentence, plainest problem first.
  const statusLine = (() => {
    const L = loop;
    if (!L.drawn) return 'No loop yet. Start on the 0s and 3s, and mark a × wherever the loop cannot go.';
    if (L.wrong) return L.wrong === 1 ? 'A red line is not part of the loop. Tap it to lift it.' : `${L.wrong} red lines are not part of the loop. Tap one to lift it.`;
    if (L.branches) return L.branches === 1 ? 'A dot has more than two lines. The loop never branches.' : `${L.branches} dots have more than two lines. The loop never branches.`;
    if (L.over) return L.over === 1 ? 'A number has too many of its sides on the loop.' : `${L.over} numbers have too many of their sides on the loop.`;
    const piece = L.pieces === 1 ? 'One piece of loop' : `${L.pieces} pieces of loop`;
    if (L.ends) {
      const ends = L.ends === 2 ? 'two loose ends' : `${L.ends} loose ends`;
      return `${piece}, ${ends}. Join them into one closed loop.`;
    }
    if (L.pieces > 1) return `${L.pieces} closed loops. There can be only one.`;
    return 'The loop is closed. Check the numbers it still has to satisfy.';
  })();
  const statusBad = !!(loop.wrong || loop.branches || loop.over);

  function isSolved(hs, vs) {
    for (let i = 0; i < NH; i++) if ((hs[i] === 1) !== (solH[i] === 1)) return false;
    for (let i = 0; i < NV; i++) if ((vs[i] === 1) !== (solV[i] === 1)) return false;
    return true;
  }

  const REC_KEY = `sot_hedge_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.h.some((v) => v) || cur.vt.some((v) => v) || cur.errors > 0 || cur.hintUsed;
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

  function pushUndo(cur) {
    undoRef.current = [...undoRef.current.slice(-59), { h: cur.h.slice(), vt: cur.vt.slice() }];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || gRef.current.status !== 'playing') return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    commit({ ...gRef.current, h: prev.h.slice(), vt: prev.vt.slice() });
  }

  // Place a mark on a segment according to `asTool`. In 'line' mode a tap
  // toggles the loop line (drawing one that isn't part of the loop turns red and
  // counts an error); in 'x' mode it toggles the free "no line here" note, which
  // is never scored. A left-tap uses the selected tool; hold / right-click
  // always draws the line via asTool='line'.
  function applySeg(kind, idx, asTool) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (!cur.t0) startGame();
    const arr = kind === 'h' ? cur.h : cur.vt;
    const sol = kind === 'h' ? solH : solV;
    const next = asTool === 'line'
      ? (arr[idx] === 1 ? 0 : 1)    // line: draw the loop line / lift it
      : (arr[idx] === 2 ? 0 : 2);   // ×: toggle a no-line note (free, unscored)
    pushUndo(cur);
    const nh = kind === 'h' ? cur.h.slice() : cur.h;
    const nv = kind === 'v' ? cur.vt.slice() : cur.vt;
    if (kind === 'h') nh[idx] = next; else nv[idx] = next;
    const wrong = next === 1 && sol[idx] !== 1;
    const g2 = { ...cur, h: nh, vt: nv, errors: cur.errors + (wrong ? 1 : 0) };
    if (!g2.t0) g2.t0 = Date.now();
    if (!wrong && isSolved(nh, nv)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2);
      setJustWon(true);
      return;
    }
    vibrate(wrong ? HAPT.wrong : HAPT.ok);
    commit(g2);
  }
  function tapSeg(kind, idx) { applySeg(kind, idx, tool); }
  function drawLineSeg(kind, idx) { applySeg(kind, idx, 'line'); }

  // hold (mobile) or right-click (desktop) draws the loop line directly; the
  // longFired flag swallows the click/contextmenu that follows the long-press.
  function startPress(kind, idx, e) {
    longFired.current = false;
    if (e) pressPos.current = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      drawLineSeg(kind, idx);
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
    }, 420);
  }
  function endPress() { clearTimeout(pressTimer.current); pressTimer.current = null; }
  // DRIFT TOLERANCE, NOT ZERO TOLERANCE, per Sweep's own note: a finger on a
  // small target always moves a pixel or two, and cancelling on that would turn
  // an intended hold into the tap it was not. Past PRESS_SLOP_PX the finger has
  // gone somewhere else and the hold is abandoned.
  function movePress(e) {
    const p = pressPos.current;
    if (!pressTimer.current) return;
    if (Math.abs(e.clientX - p.x) > PRESS_SLOP_PX || Math.abs(e.clientY - p.y) > PRESS_SLOP_PX) endPress();
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    let kind = null, idx = -1;
    for (let i = 0; i < NH; i++) if (solH[i] === 1 && cur.h[i] !== 1) { kind = 'h'; idx = i; break; }
    if (idx < 0) for (let i = 0; i < NV; i++) if (solV[i] === 1 && cur.vt[i] !== 1) { kind = 'v'; idx = i; break; }
    if (idx < 0) return;
    pushUndo(cur);
    const nh = kind === 'h' ? cur.h.slice() : cur.h;
    const nv = kind === 'v' ? cur.vt.slice() : cur.vt;
    if (kind === 'h') nh[idx] = 1; else nv[idx] = 1;
    const g2 = { ...cur, h: nh, vt: nv, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    if (isSolved(nh, nv)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    commit(g2);
    say('Hint placed, one segment of the loop drawn.');
  }

  function revealEnd() {
    const cur = gRef.current;
    const g2 = { ...cur, h: solH.slice(), vt: solV.slice(), playerH: cur.h.slice(), playerV: cur.vt.slice(), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    commit(freshState(NH, NV));
    setJustWon(false); setEndClosed(false);
  }

  const onKey = useCallback((e) => {
    if (gRef.current.status !== 'playing') return;
    if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareUrl() {
    return withRef(`mindloftdaily.com/hedge${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E6}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Hedge #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${errors === 0 ? 'clean' : `${errors} error${errors === 1 ? '' : 's'}`} · ${elapsed}${hintBit}${streakBit}`
      : `Hedge #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Hedge #${PUZZLE.num} — the daily loop puzzle from Mind Loft.\n${shareUrl()}`
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

  // ---- board geometry ----
  const SIZE = n * CELL + PAD * 2;
  const X = (j) => PAD + j * CELL;
  const Y = (i) => PAD + i * CELL;
  // THE HIT AREA IS A DIAMOND, not a thick stroke (2026-10-14). Each segment
  // owns the rhombus between its two dots and the centres of the two squares
  // either side of it, so the diamonds tile the board and a tap anywhere in a
  // square takes the nearest of its four sides. Shrunk 8% toward the segment's
  // middle, which leaves a sliver of dead space at each square's centre and at
  // each dot, the two places a tap could mean more than one side. On a phone
  // 10x10 that is a 34px-long, 34px-wide target per segment.
  const HS = 0.92;
  const diamond = (x1, y1, x2, y2, horiz) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, h = CELL / 2;
    const pts = horiz
      ? [[x1, y1], [mx, my - h], [x2, y2], [mx, my + h]]
      : [[x1, y1], [mx + h, my], [x2, y2], [mx - h, my]];
    return pts.map(([x, y]) => `${(mx + (x - mx) * HS).toFixed(1)},${(my + (y - my) * HS).toFixed(1)}`).join(' ');
  };

  const segs = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) segs.push({ kind: 'h', i, j, idx: i * n + j, x1: X(j), y1: Y(i), x2: X(j + 1), y2: Y(i), hit: diamond(X(j), Y(i), X(j + 1), Y(i), true) });
  for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) segs.push({ kind: 'v', i, j, idx: i * (n + 1) + j, x1: X(j), y1: Y(i), x2: X(j), y2: Y(i + 1), hit: diamond(X(j), Y(i), X(j), Y(i + 1), false) });

  const rulesBody = (
    <DailyRules
      accent={STAGE ? 'var(--stg-acc)' : COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Draw one single closed loop along the grid lines."
      chips={[
        { label: 'Blank cell = no number, on purpose', tone: 'warn' },
        { label: '× = no line here', tone: 'grey' },
        { label: 'Red line = error', tone: 'bad' },
        { label: 'Dimmed number = sides settled', tone: 'good' },
      ]}
      sub={<>Nothing is missing: many cells carry no number, and that is how a slitherlink is built. Roughly a third to a half of the grid is deliberately blank, and the numbers you do get are always enough to pin down one answer.</>}
      steps={[
        <>A number is exactly how many of that cell&rsquo;s four sides the loop uses: a <b>3</b> uses three, a <b>0</b> none. A <b>blank cell carries no rule at all</b>, so the loop may take none, one, two, three or all four of its sides.</>,
        <>The loop never branches or crosses itself, so every corner it reaches has exactly two lines running out. That plus the numbers pins down a single answer.</>,
        <>The <b>&times;</b> / <b>Line</b> buttons set what a tap places, opening on <b>&times;</b>, a free note that is never scored, and remembering your choice next time. <b>Hold</b> a segment (right-click on a computer) to draw a line in either mode, and tap again to lift a line or clear a &times;.</>,
        <><b>Undo</b> (or Ctrl+Z) takes back your last move. One free <b>hint</b>, on your first ever play, draws a correct segment.</>,
      ]}
      knack="Start on the 0s and 3s: they settle sides outright, and every settled side forces the corners around it."
      footer={<>No errors scores a perfect 10, and every two errors cost a point. Ties break on fewest errors, then fastest time. Sundays are a bigger 10&times;10 Edition.</>}
    />
  );

  // The × Mark / Line tool, one segmented control.
  const toolSwitch = (
    <div className="hg-seg" role="group" aria-label="What a tap draws">
      <button type="button" className={`hg-tool${tool === 'x' ? ' on' : ''}`} onClick={() => setTool('x')} title="Mark no-line notes (default)" aria-pressed={tool === 'x'}>
        <span aria-hidden="true" style={{ fontWeight: 900, fontSize: 15, lineHeight: 1 }}>&times;</span> Mark
      </button>
      <button type="button" className={`hg-tool${tool === 'line' ? ' on' : ''}`} onClick={() => setTool('line')} title="Draw the loop line" aria-pressed={tool === 'line'}>
        <span aria-hidden="true" className="hg-swatch" /> Line
      </button>
    </div>
  );
  const actButtons = (
    <>
      <button type="button" className="hg-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo last move">
        <RotateCcw size={15} /> Undo
      </button>
      {hintOk && !g.hintUsed && (
        <button type="button" className="hg-btn" onClick={useHint} title="Draw one correct segment (one hint, first play only)" aria-label="Hint: draw one segment of the loop">
          <Lightbulb size={15} /> Hint
        </button>
      )}
    </>
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
      <DailyChrome slug="hedge" name="Hedge" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Hedge grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="hedge" quizId={PUZZLE.quizId}
          name="Hedge"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · 10×10` : null}
          figures={playing ? [
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="hg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.hg-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .hg-btn{font-family:${SANS};font-weight:700;font-size:14px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:transparent;color:${INK};border-radius:12px;padding:0 16px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;}
          .hg-btn:hover{background:var(--stg-surf2, rgba(28,30,36,0.06));}
          .hg-btn:disabled{color:var(--stg-mute, #6b7280);cursor:default;}
          .hg-btn:disabled:hover{background:transparent;}
          @media(max-width:560px){.hg-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.hg-ttl h1{font-size:21px;}.hg-ttl-dot{display:none;}}
          /* THE TOOL SWITCH (2026-10-14 board rebuild): one segmented control, the live
             segment filled with the accent, the same shape as Jesters' and Paths'. */
          .hg-seg{display:flex;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};border-radius:12px;padding:3px;gap:3px;flex:0 0 auto;}
          .hg-tool{font-family:${SANS};font-weight:700;font-size:13px;border:0;background:transparent;color:${INK};border-radius:9px;min-height:44px;padding:0 14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;}
          .hg-tool:hover{background:var(--stg-surf2, rgba(28,30,36,0.06));}
          .hg-tool.on,.hg-tool.on:hover{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));font-weight:800;}
          .hg-swatch{display:inline-block;width:16px;height:4px;border-radius:2px;background:currentColor;}
          /* The two stat chips above the board, and the framed board panel under them. */
          .hg-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 14px;}
          .hg-chips{display:flex;gap:10px;flex-wrap:wrap;min-width:0;}
          .hg-chip{border:1px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.2)'};border-radius:14px;padding:8px 14px;display:flex;flex-direction:column;gap:1px;min-width:0;}
          .hg-chipk{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:${FADED};white-space:nowrap;}
          .hg-chipv{font-size:18px;font-weight:800;color:${INK};font-variant-numeric:tabular-nums;line-height:1.25;white-space:nowrap;}
          .hg-chipof{font-size:14px;font-weight:700;color:${FADED};}
          .hg-short{display:none;}
          .hg-panel{background:var(--stg-surf, #ffffff);border:1px solid var(--stg-line, rgba(28,30,36,0.15));border-radius:20px;padding:18px 18px 16px;}
          .hg-cellrect{fill:color-mix(in srgb, var(--stg-ink, #1c1e24) 4%, var(--stg-cell, #ffffff));}
          .hg-foot{display:flex;align-items:center;gap:12px;border-top:1px solid var(--stg-line, rgba(28,30,36,0.15));margin-top:14px;padding-top:14px;}
          .hg-acts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
          .hg-tool-foot{display:none;}
          .hg-under{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:6px;}
          .hg-link{font-family:${SANS};font-weight:700;font-size:13px;background:none;border:0;color:${INK};text-decoration:underline;text-underline-offset:3px;min-height:44px;padding:0 10px;cursor:pointer;}
          @media(max-width:560px){
            .hg-top{margin-bottom:12px;}
            .hg-top .hg-seg{display:none;}
            .hg-chips{flex:1;flex-wrap:nowrap;gap:8px;}
            .hg-chip{flex:1;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;border-radius:12px;padding:7px 12px;}
            .hg-chipv{font-size:16px;}
            .hg-chipof{font-size:12px;}
            .hg-long{display:none;}
            .hg-short{display:inline;}
            /* On a phone the board takes the whole width: no frame, no inset. */
            .hg-panel{background:transparent;border:0;border-radius:0;padding:0;}
            .hg-foot{flex-direction:column;align-items:stretch;border-top:0;margin-top:12px;padding-top:0;}
            .hg-foot .hg-acts{display:none;}
            .hg-tool-foot{display:flex;gap:8px;margin-top:8px;}
            .hg-tool-foot .hg-seg{flex:1;}
            .hg-tool-foot .hg-tool{flex:1;min-height:46px;font-size:14px;padding:0 8px;}
            .hg-tool-foot .hg-btn{min-height:52px;padding:0 14px;}
            .hg-under{justify-content:flex-end;}
            .hg-under .hg-rule{display:none;}
          }
          .hg-hit{fill:transparent;stroke:none;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}
          .hg-svg{touch-action:manipulation;width:100%;height:auto;display:block;margin:0 auto;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>


        {!LOFT && (
        <DailyMasthead
          slug="hedge"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 10&times;10</span>}
          blocks={'HEDGE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Hedge is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Draw one closed loop so every number has exactly that many of its sides on the loop. {n}&times;{n} today.</p>
                <p style={{ margin: 0, fontWeight: 600, color: FADED }}>Plenty of cells carry no number. That is the puzzle, not a glitch: a blank cell has no rule, and the printed numbers are enough to pin down one answer.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="hg-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>errors <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>loop <b style={{ color: rightDrawn === LOOP_LEN ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{rightDrawn}</b>/{LOOP_LEN}</span>
          </div>
          )}

          {/* THE TWO CHIPS (2026-10-14 board rebuild): loose ends and numbers
              settled, both read off the lines on the board, with the tool switch
              beside them on a computer (on a phone it sits at the foot). They
              replace the old "loop x/24" cap figure. */}
          <div className="hg-top">
            <div className="hg-chips">
              <div className="hg-chip" role="status" aria-label={`${loop.ends} loose ${loop.ends === 1 ? 'end' : 'ends'}`}>
                <span className="hg-chipk">Loose ends</span>
                <span className="hg-chipv" style={{ color: loop.ends ? `var(--stg-acc-ink, ${COLORS.accent})` : INK }}>{loop.ends}</span>
              </div>
              <div className="hg-chip" role="status" aria-label={`${loop.settled} of ${loop.clues} numbers settled`}>
                <span className="hg-chipk"><span className="hg-long">Numbers settled</span><span className="hg-short">Settled</span></span>
                <span className="hg-chipv">{loop.settled}<span className="hg-chipof"> / {loop.clues}</span></span>
              </div>
            </div>
            {started && toolSwitch}
          </div>

          <div className="hg-panel">
            <svg className="hg-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ maxWidth: n >= 10 ? 560 : 480 }} role="img" aria-label={`Hedge loop puzzle, ${n} by ${n}`}>
              {/* the faint field the loop is drawn on */}
              <rect className="hg-cellrect" x={PAD} y={PAD} width={n * CELL} height={n * CELL} rx={6} style={{ pointerEvents: 'none' }} />
              {/* clue numbers: a settled number dims (no strike), an over-full one goes red */}
              {PUZZLE.clues.map((row, i) => row.map((c, j) => {
                if (c === null || c === undefined) return null;
                const k = cellCount[i][j];
                const met = k === c;
                const col = k > c ? `var(--stg-bad, ${COLORS.rust})`
                  : met ? `var(--stg-mute, ${COLORS.faded})`
                  : `var(--stg-ink, ${COLORS.ink})`;
                return (
                  <text key={`c${i}-${j}`} x={X(j) + CELL / 2} y={Y(i) + CELL / 2 + 1} fill="currentColor"
                    style={{ color: col, pointerEvents: 'none', userSelect: 'none' }}
                    fontFamily={SANS} fontSize={Math.round(CELL * 0.42)} fontWeight={met ? 600 : 800} textAnchor="middle" dominantBaseline="central">{c}</text>
                );
              }))}
              {/* crosses: the player's own "no line here" notes, in the mute ink */}
              {segs.map((s) => {
                const st = s.kind === 'h' ? H[s.idx] : V[s.idx];
                if (st !== 2) return null;
                const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2, r = CELL * 0.11;
                return (
                  <path key={`x${s.kind}${s.idx}`} d={`M${mx - r} ${my - r}L${mx + r} ${my + r}M${mx + r} ${my - r}L${mx - r} ${my + r}`}
                    style={{ stroke: `var(--stg-mute, ${COLORS.faded})`, pointerEvents: 'none' }} strokeWidth={2.4} strokeLinecap="round" fill="none" />
                );
              })}
              {/* drawn lines: the loop in the accent, a line off the loop in red */}
              {segs.map((s) => {
                const st = s.kind === 'h' ? H[s.idx] : V[s.idx];
                if (st !== 1) return null;
                const ok = (s.kind === 'h' ? solH[s.idx] : solV[s.idx]) === 1;
                return (
                  <line key={`l${s.kind}${s.idx}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    style={{ stroke: ok ? `var(--stg-acc, ${COLORS.accent})` : `var(--stg-bad, ${COLORS.rust})`, pointerEvents: 'none' }}
                    strokeWidth={Math.round(CELL * 0.13)} strokeLinecap="round" />
                );
              })}
              {/* dots: a loose end is ringed, a dot on the loop takes the accent, a branch goes red */}
              {Array.from({ length: (n + 1) * (n + 1) }).map((_, k) => {
                const i = Math.floor(k / (n + 1)), j = k % (n + 1);
                const d = loop.deg[k];
                if (d === 1) {
                  return <circle key={`d${k}`} cx={X(j)} cy={Y(i)} r={CELL * 0.13} className="hg-cellrect"
                    style={{ stroke: `var(--stg-acc, ${COLORS.accent})`, strokeWidth: CELL * 0.055, pointerEvents: 'none' }} />;
                }
                const fill = d > 2 ? `var(--stg-bad, ${COLORS.rust})` : d === 2 ? `var(--stg-acc, ${COLORS.accent})` : 'var(--stg-cell-dot, #9aa2b4)';
                const r = d > 2 ? CELL * 0.1 : d === 2 ? CELL * 0.075 : CELL * 0.06;
                return <circle key={`d${k}`} cx={X(j)} cy={Y(i)} r={r} style={{ fill, pointerEvents: 'none' }} />;
              })}
              {/* hit areas, drawn last so they always take the tap: one diamond per segment */}
              {playing && segs.map((s) => (
                <polygon key={`h${s.kind}${s.idx}`} className="hg-hit" points={s.hit}
                  onClick={() => { if (longFired.current) { longFired.current = false; return; } tapSeg(s.kind, s.idx); }}
                  onContextMenu={(e) => { e.preventDefault(); if (longFired.current) { longFired.current = false; return; } drawLineSeg(s.kind, s.idx); }}
                  onPointerDown={(e) => { if (e.pointerType === 'touch') startPress(s.kind, s.idx, e); }}
                  onPointerMove={movePress}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  onPointerCancel={endPress} />
              ))}
            </svg>

            {/* the status line, the helper line, and Undo / Hint (on a phone the
                tool switch joins them in one row under the lines) */}
            {started && (
              <div className="hg-foot">
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span aria-live="polite" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: statusBad ? `var(--stg-bad, ${COLORS.rust})` : INK }}>{statusLine}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: FADED }}>
                    Ringed dots are loose ends. A settled number dims. {mobileUi ? 'Hold a segment to draw a line in either mode.' : 'Hold or right-click a segment to draw a line in either mode.'}
                    {g.hintUsed ? ' Hint used.' : ''}
                  </span>
                </div>
                <div className="hg-acts">{actButtons}</div>
                <div className="hg-tool-foot">{toolSwitch}{actButtons}</div>
              </div>
            )}
          </div>

          {started && (
            <div className="hg-under">
              <span className="hg-rule" style={{ fontSize: 12, fontWeight: 600, color: FADED }}>A number counts its sides on the loop. Blank squares have no rule.</span>
              {identity && (rightDrawn > 0 || errors > 0) && (
                <button type="button" className="hg-link"
                  onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                  aria-label={armReveal ? 'Tap again to reveal the loop. This ends the day.' : 'Reveal the loop'}
                  style={armReveal ? { color: `var(--stg-bad, ${COLORS.rust})` } : undefined}>
                  {armReveal ? 'Tap again to reveal (ends the day)' : 'Reveal'}
                </button>
              )}
            </div>
          )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: a bigger 10&times;10 grid.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Hedge in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new loop drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/hedge?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Hedge &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/hedge" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Hedge &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
              name="Hedge"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={won ? errors : null}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} errors \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Hedge all time` : 'all-time rank' }
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
                  href: `/hedge?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Hedge', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/hedge?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="hedge" name="Hedge" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="hedge" name="Hedge" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="hedge"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="hedge" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Hedge to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s loop, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s loop, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: STAGE ? 'var(--stg-acc)' : COLORS.ink, color: STAGE ? 'var(--stg-onramp)' : T.white, cursor: 'pointer' }}>Got it</button>
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
          self="hedge"
          won={won}
          headline={won ? <>Loop closed!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {errors === 0 ? 'clean, no errors' : `${errors} error${errors === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the solved loop is shown above</>}
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
            <button className="hg-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: STAGE ? 'var(--stg-acc)' : COLORS.ink, borderColor: STAGE ? 'var(--stg-acc)' : COLORS.ink, color: STAGE ? 'var(--stg-onramp)' : T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Hedge</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Hedge is a free daily slitherlink from Mind Loft, the loop puzzle also known as fences or takegaki. Every day you get a grid of numbered cells, and one single closed loop that satisfies all of them. A number says exactly how many of that cell&rsquo;s four sides the loop uses. Only some cells are numbered, and the blank ones are meant to be blank: they carry no rule, so the loop is free to use as many of their sides as the numbers around them demand.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The deductions build on each other: a 0 kills four segments at once, a 3 in a corner forces its two outer walls, and every dot the loop reaches must have exactly two lines leaving it. Cross out the segments you have ruled out, watch each number dim as it is satisfied, and the loop closes itself.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new loop drops every day at midnight Eastern, and Sundays step up to a 10&times;10 Edition. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/etch" style={{ color: INK, fontWeight: 800 }}>Etch</a>, our picture logic, <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku, and <a href="/carve" style={{ color: INK, fontWeight: 800 }}>Carve</a>, our equal-sum grid.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
