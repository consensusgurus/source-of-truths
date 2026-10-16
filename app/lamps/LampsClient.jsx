'use client';

// Lamps — the daily light-placement puzzle (the family known as akari).
//
// Place lamps on the white squares. A lamp lights its own square and every
// white square it can see along its row and column, up to the first wall.
// Light every square, never let one lamp shine on another, and give every
// numbered wall exactly that many lamps on its four sides. Each board has
// exactly one solution, always reachable by logic.
//
// Rule breaks ARE flagged as they happen (two lamps that see each other, a
// numbered wall with too many lamps), because a break is visible on the board
// anyway. A lamp that is merely wrong is never flagged. A solve is a flat 10
// and the daily board is a race on the clock, the same lane as Duet.
//
// Plumbing forked from app/duet/DuetClient.jsx.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Smartphone, Trash2 } from 'lucide-react';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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

// A new game gets no colour of its own: on the stage it wears the Logic step
// of the category ramp. ACCENT is only the legacy (pre-stage) fallback.
const ACCENT = '#9a6700';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#fdf3d7',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_lamps_help_seen';
const STATS_KEY = 'sot_lamps_stats';
const GRID_MAX = 468;
const EMPTY = 0, LAMP = 1, CROSS = 2;
// THE LIGHT, REGISTER-AWARE (2026-10-14 board rebuild). Lamps needs colours the
// stage does not carry: a warm glow, a lit square, a beam, and an unlit square
// that is clearly DARKER than a lit one in both registers (a near-black well on
// the dark stage, a soft slate on the light one). Each is either a hue mixed into
// the register's own cell, or the established two-value form keyed off
// --stg-dk (100% dark, 0% light; see Sweep and Shards), so there is no
// attribute selector here and nothing can flash the wrong register on boot.
// Set once on the board wrapper; everything inside reads var(--lm-*).
const dk = (darkVal, lightVal) => `color-mix(in srgb, ${darkVal} var(--stg-dk, 100%), ${lightVal})`;
const LIGHT_VARS = {
  '--lm-glow': dk('#f5c542', '#e0a810'),
  '--lm-lit': 'color-mix(in srgb, #f5c542 calc(28% - var(--stg-dk, 100%) * 0.1), var(--stg-cell, #ffffff))',
  '--lm-dark': dk('#10151f', '#c9d0dc'),
  '--lm-beam': dk('#c9a233', '#c98f0a'),
  '--lm-slab': dk('#2c3549', '#1e2433'),
  '--lm-slab-ink': dk('#e8ecf4', '#ffffff'),
  '--lm-hatch': dk('#1f2635', '#363e52'),
  '--lm-pip': dk('#5f6b85', '#7d889e'),
  '--lm-pip-ok': 'color-mix(in srgb, var(--stg-acc, #1a7f37) calc(55% + var(--stg-dk, 100%) * 0.45), #ffffff)',
  '--lm-pip-bad': 'color-mix(in srgb, var(--stg-bad, #be123c) calc(55% + var(--stg-dk, 100%) * 0.45), #ffffff)',
  '--lm-dot': dk('#8b95a8', '#1e2433'),
  '--lm-gap': 'color-mix(in srgb, var(--stg-ink, #0b0d12) 14%, var(--stg-cell, #ffffff))',
};
const NUM_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const numWord = (k) => NUM_WORDS[k] || String(k);

// The board's own width, measured, so cell-relative sizes (the lamp disc, the
// beam, the pips under a number) scale with N on every screen.
function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setW(el.clientWidth || 0);
    read();
    let ro = null;
    try { ro = new ResizeObserver(read); ro.observe(el); } catch (e) { window.addEventListener('resize', read); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', read); };
  });
  return w;
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

// Everything the board needs to know about a position: which whites are lit,
// which lamps see another lamp, which numbered walls are over or exactly met,
// and whether the whole thing is solved.
function analyze(cells, p) {
  const n = p.n;
  const N = n * n;
  const wall = (i) => p.grid[Math.floor(i / n)][i % n] !== '.';
  const lit = new Set(), badLamp = new Set(), badWall = new Set(), metWall = new Set();
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < N; i++) {
    if (wall(i) || cells[i] !== LAMP) continue;
    lit.add(i);
    const r = Math.floor(i / n), c = i % n;
    for (const [dr, dc] of DIRS) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && rr < n && cc >= 0 && cc < n && !wall(rr * n + cc)) {
        const j = rr * n + cc;
        lit.add(j);
        if (cells[j] === LAMP) { badLamp.add(i); badLamp.add(j); }
        rr += dr; cc += dc;
      }
    }
  }
  let whites = 0, wallsOk = true;
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / n), c = i % n, ch = p.grid[r][c];
    if (ch === '.') { whites++; continue; }
    if (ch === '#') continue;
    let k = 0;
    for (const [dr, dc] of DIRS) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n && !wall(rr * n + cc) && cells[rr * n + cc] === LAMP) k++;
    }
    const need = Number(ch);
    if (k > need) badWall.add(i);
    if (k === need) metWall.add(i); else wallsOk = false;
  }
  const allLit = lit.size === whites;
  return { lit, badLamp, badWall, metWall, allLit, any: badLamp.size + badWall.size > 0, solved: allLit && wallsOk && badLamp.size === 0 };
}

function freshState(p) {
  return { v: 1, cells: Array(p.n * p.n).fill(EMPTY), hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function LampsClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.n;
  const CELLS = N * N;
  const STORE_KEY = `sot_lamps_${PUZZLE.num}`;
  const isWall = useMemo(() => { const a = []; for (let i = 0; i < CELLS; i++) a.push(PUZZLE.grid[Math.floor(i / N)][i % N] !== '.'); return a; }, [PUZZLE, N, CELLS]);
  const WHITES = useMemo(() => { const out = []; for (let i = 0; i < CELLS; i++) if (!isWall[i]) out.push(i); return out; }, [isWall, CELLS]);
  const solCells = useMemo(() => { const a = Array(CELLS).fill(EMPTY); for (const i of PUZZLE.sol) a[i] = LAMP; return a; }, [PUZZLE, CELLS]);

  const [g, setG] = useState(() => freshState(PUZZLE));
  const [sel, setSel] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('lamps', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('lamps'); }, [g.hintUsed]);
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

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('lamps');
  const STAGE = isStage('lamps', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('lamps');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('lamps');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('lamps'), '--stg-acc-lt': gameColorLight('lamps'), '--stg-onramp-lt': gameOnrampLight('lamps'), '--stg-acc-ink-lt': gameAccentInkLight('lamps') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const [revealed, setRevealed] = useState(false);
  // A give-up keeps the player's lamps in g.cells; the solution paints only
  // once the end card's Reveal is pressed, so the finish beat leaks nothing.
  const cells = g.status === 'revealed' && (!LOFT || revealed) ? solCells : g.cells;
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'lamps', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'lamps', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'lamps', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'lamps', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'lamps', active: LOFT && !playing });

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
          setG({ ...freshState(PUZZLE), ...saved });
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
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_lamps_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_lamps_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

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

  // ---- metrics (the shared /api/quiz/* flow) ----
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

  const an = useMemo(() => analyze(cells, PUZZLE), [cells, PUZZLE]);
  const liveFilled = an.lit.size;
  const filledCount = g.status === 'revealed' && g.revealFilled != null ? g.revealFilled : liveFilled;
  const hasEntries = WHITES.some((i) => cells[i] !== EMPTY);
  const NONE = useMemo(() => new Set(), []);
  const breaks = playing ? an : { ...an, badLamp: NONE, badWall: NONE, any: false };

  const REC_KEY = `sot_lamps_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = WHITES.some((i) => g.cells[i] !== EMPTY) || g.hintUsed;
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
        // Nothing counts against you, so the board resolves solver ties on the clock.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function pushUndo() {
    undoRef.current = [...undoRef.current.slice(-79), cells.slice()];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || !playing) return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    setG((cur) => ({ ...cur, cells: prev.slice() }));
  }

  // Put a value in a white square. EMPTY clears it.
  function setCell(idx, v) {
    if (!playing || idx < 0 || isWall[idx]) return;
    if (cells[idx] === v) return;
    pushUndo();
    const next = cells.slice();
    next[idx] = v;
    const g2 = { ...g, cells: next };
    if (!g2.t0) g2.t0 = Date.now();
    const a2 = analyze(next, PUZZLE);
    if (a2.solved) {
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
    if (a2.allLit && !a2.any) say('Every square is lit, but a numbered wall is still short.');
  }
  // Tap cycles empty -> lamp -> cross -> empty.
  function cycle(idx) {
    const v = cells[idx];
    setCell(idx, v === EMPTY ? LAMP : v === LAMP ? CROSS : EMPTY);
  }
  function cellClick(idx) {
    if (isWall[idx]) return;
    setSel(idx);
    cycle(idx);
  }

  function clearBoard() {
    if (!playing || !hasEntries) return;
    if (!armClear) { setArmClear(Date.now()); return; }
    if (Date.now() - armClear < ARM_MIN_MS) return;
    setArmClear(false);
    pushUndo();
    setG((cur) => ({ ...cur, cells: freshState(PUZZLE).cells }));
    say('Board cleared. Undo brings it back.');
  }

  // One free hint, first play only: place one lamp that belongs.
  function useHint() {
    if (!hintOk || !playing || g.hintUsed) return;
    let idx = (sel >= 0 && solCells[sel] === LAMP && cells[sel] !== LAMP) ? sel : -1;
    if (idx < 0) idx = PUZZLE.sol.find((i) => cells[i] !== LAMP);
    if (idx == null || idx < 0) return;
    const next = cells.slice();
    next[idx] = LAMP;
    const g2 = { ...g, cells: next, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(idx);
    if (analyze(next, PUZZLE).solved) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    say('Hint placed, one lamp that belongs.');
  }

  function revealEnd() {
    const g2 = { ...g, revealFilled: liveFilled, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    setG(freshState(PUZZLE)); setSel(-1); setJustWon(false); setEndClosed(false);
  }

  // Desktop keyboard: arrows move, Space or Enter cycles, L or 1 a lamp, X or 2
  // a cross, 0 / Backspace clears.
  const onKey = useCallback((e) => {
    if (!playing || !g.t0) return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'Escape') { setSel(-1); return; }
    const cur = sel < 0 ? 0 : sel;
    const r = Math.floor(cur / N), c = cur % N;
    if (k === 'ArrowUp') { e.preventDefault(); setSel(((r + N - 1) % N) * N + c); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setSel(((r + 1) % N) * N + c); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); setSel(r * N + (c + N - 1) % N); return; }
    if (k === 'ArrowRight') { e.preventDefault(); setSel(r * N + (c + 1) % N); return; }
    if (sel < 0) return;
    if (k === ' ' || k === 'Enter') { e.preventDefault(); cycle(sel); return; }
    if (k === 'l' || k === 'L' || k === '1') { setCell(sel, LAMP); return; }
    if (k === 'x' || k === 'X' || k === '2') { setCell(sel, CROSS); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { setCell(sel, EMPTY); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    // Never the board: all or nothing, like the score.
    const row = won ? '\u{1F4A1}'.repeat(5) : '⬛'.repeat(5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Lamps #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${N}×${N} solved in ${elapsed}${hintBit}${streakBit}`
      : `Lamps #${PUZZLE.num} · gave up`;
    return `${head2}\n${row}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/lamps${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Lamps #${PUZZLE.num}, the daily light-every-square logic puzzle from Mind Loft.\n${shareUrl()}`
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

  // THE BOARD (2026-10-14 rebuild). Squares are separate rounded tiles on a
  // gap-coloured tray. An unlit square is a dark well, a lit one is warm, and a
  // beam runs along the centre of every square a lamp lights, from the lamp to
  // the wall, so you can see which lamp lights what. Walls are slabs: a blank
  // one is hatched, a numbered one carries its number and one pip per lamp it
  // wants, which fill as lamps touch it (warm while short, the accent once
  // exact, red when over).
  const GRID_PAD = N >= 10 ? 2 : 3;
  const GRID_GAP = N >= 10 ? 2 : 3;
  const gridBoxRef = useRef(null);
  const gridW = useWidth(gridBoxRef);
  const cellPx = gridW ? Math.max(18, (Math.min(gridW, GRID_MAX) - GRID_PAD * 2 - GRID_GAP * (N - 1)) / N) : (N >= 10 ? 40 : 56);
  const beamW = Math.max(2, Math.round(cellPx * 0.065));
  const beams = useMemo(() => {
    const h = new Set(), v = new Set();
    for (let i = 0; i < CELLS; i++) {
      if (isWall[i] || cells[i] !== LAMP) continue;
      const r = Math.floor(i / N), c = i % N;
      let c0 = c, c1 = c, r0 = r, r1 = r;
      while (c0 > 0 && !isWall[r * N + c0 - 1]) c0--;
      while (c1 < N - 1 && !isWall[r * N + c1 + 1]) c1++;
      while (r0 > 0 && !isWall[(r0 - 1) * N + c]) r0--;
      while (r1 < N - 1 && !isWall[(r1 + 1) * N + c]) r1++;
      if (c1 > c0) for (let x = c0; x <= c1; x++) h.add(r * N + x);
      if (r1 > r0) for (let y = r0; y <= r1; y++) v.add(y * N + c);
    }
    return { h, v };
  }, [cells, isWall, N, CELLS]);
  // How many lamps touch each numbered wall, for its pips.
  const touching = useMemo(() => {
    const out = {};
    for (let i = 0; i < CELLS; i++) {
      const ch = PUZZLE.grid[Math.floor(i / N)][i % N];
      if (ch === '.' || ch === '#') continue;
      const r = Math.floor(i / N), c = i % N;
      let k = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < N && cc >= 0 && cc < N && !isWall[rr * N + cc] && cells[rr * N + cc] === LAMP) k++;
      }
      out[i] = k;
    }
    return out;
  }, [cells, PUZZLE, isWall, N, CELLS]);
  const lampCount = WHITES.reduce((k, i) => k + (cells[i] === LAMP ? 1 : 0), 0);
  const darkCount = WHITES.length - an.lit.size;
  const shortWalls = Object.keys(touching).filter((i) => touching[i] < Number(PUZZLE.grid[Math.floor(i / N)][i % N])).length;
  const litPct = WHITES.length ? Math.round((an.lit.size / WHITES.length) * 100) : 0;

  function cellStyle(idx) {
    let bg;
    const ch = PUZZLE.grid[Math.floor(idx / N)][idx % N];
    if (isWall[idx]) {
      if (breaks.badWall.has(idx)) bg = 'var(--stg-bad, #be123c)';
      else if (ch === '#') bg = `repeating-linear-gradient(45deg, var(--lm-slab) 0 ${N >= 10 ? 4 : 6}px, var(--lm-hatch) ${N >= 10 ? 4 : 6}px ${N >= 10 ? 8 : 12}px)`;
      else bg = 'var(--lm-slab)';
    } else if (breaks.badLamp.has(idx)) bg = 'color-mix(in srgb, var(--stg-bad, #be123c) 30%, var(--lm-lit))';
    else if (an.lit.has(idx)) bg = 'var(--lm-lit)';
    else bg = 'var(--lm-dark)';
    return {
      background: bg,
      boxShadow: idx === sel && playing && g.t0 ? `inset 0 0 0 ${N >= 10 ? 2 : 3}px var(--stg-acc, ${COLORS.accent})` : undefined,
      cursor: isWall[idx] || !playing ? 'default' : 'pointer',
    };
  }
  function markFor(idx) {
    const r = Math.floor(idx / N), c = idx % N;
    if (isWall[idx]) {
      const ch = PUZZLE.grid[r][c];
      if (ch === '#') return null;
      const need = Number(ch), k = touching[idx] || 0, bad = breaks.badWall.has(idx);
      const pip = Math.max(3, Math.round(cellPx * 0.1));
      const pipFill = (i) => (bad || k > need ? 'var(--lm-slab-ink)' : k === need ? 'var(--lm-pip-ok)' : i < k ? 'var(--lm-glow)' : 'var(--lm-pip)');
      return (
        <>
          <span aria-hidden="true" style={{ fontFamily: SANS, fontWeight: 800, fontSize: Math.round(cellPx * 0.36), lineHeight: 1, color: 'var(--lm-slab-ink)' }}>{ch}</span>
          {need > 0 && (
            <span aria-hidden="true" style={{ display: 'flex', gap: Math.max(2, Math.round(pip * 0.5)), minHeight: pip }}>
              {Array.from({ length: need }, (_, i) => <span key={i} style={{ width: pip, height: pip, borderRadius: '50%', background: pipFill(i) }} />)}
            </span>
          )}
        </>
      );
    }
    const v = cells[idx];
    const mid = `calc(50% - ${beamW / 2}px)`;
    return (
      <>
        {beams.h.has(idx) && <span aria-hidden="true" className="lm-beam" style={{ left: 0, right: 0, top: mid, height: beamW }} />}
        {beams.v.has(idx) && <span aria-hidden="true" className="lm-beam" style={{ top: 0, bottom: 0, left: mid, width: beamW }} />}
        {v === LAMP && (() => {
          const isBad = breaks.badLamp.has(idx);
          const d = Math.round(cellPx * 0.48), ring = Math.max(2, Math.round(cellPx * 0.08)), halo = Math.round(cellPx * 0.3);
          return <span aria-hidden="true" style={{ position: 'relative', width: d, height: d, borderRadius: '50%', display: 'block', background: isBad ? 'var(--stg-bad, #be123c)' : 'var(--lm-glow)', boxShadow: isBad ? `0 0 0 ${ring}px var(--stg-cell, #ffffff)` : `0 0 0 ${ring}px var(--lm-lit), 0 0 ${halo}px ${Math.round(halo / 4)}px var(--lm-glow)` }} />;
        })()}
        {v === CROSS && <span aria-hidden="true" style={{ position: 'relative', width: Math.max(6, Math.round(cellPx * 0.15)), height: Math.max(6, Math.round(cellPx * 0.15)), borderRadius: '50%', background: 'var(--lm-dot)', display: 'block' }} />}
      </>
    );
  }

  // THE STATUS LINE, read straight off the board. It never names a square to
  // play; it only counts what is already there.
  const firstBadWall = [...breaks.badWall][0];
  const statusMain = !playing
    ? (won ? 'Every square is lit. Solved.' : 'The board is ended.')
    : breaks.badLamp.size
      ? 'Two lamps can see each other. One of them has to go.'
      : firstBadWall != null
        ? `The ${PUZZLE.grid[Math.floor(firstBadWall / N)][firstBadWall % N]} in row ${Math.floor(firstBadWall / N) + 1} has too many lamps beside it.`
        : lampCount === 0
          ? `No lamps yet. All ${WHITES.length} squares are dark.`
          : darkCount === 0
            ? `Every square is lit, but ${shortWalls === 1 ? 'a number is' : `${shortWalls} numbers are`} still short of lamps.`
            : `${numWord(lampCount)} lamp${lampCount === 1 ? '' : 's'} lit, no clashes. ${darkCount} square${darkCount === 1 ? '' : 's'} still dark.${shortWalls ? ` ${numWord(shortWalls)} number${shortWalls === 1 ? '' : 's'} still want${shortWalls === 1 ? 's' : ''} lamps.` : ''}`;
  const revealBtn = identity && hasEntries && playing && (
    <button type="button" className="lm-link" onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
      aria-label={armReveal ? 'Tap again to end the day and show the solution' : 'Reveal the solution'}
      style={armReveal ? { color: `var(--stg-bad, ${COLORS.rust})` } : undefined}>
      {armReveal ? 'Tap again to end and show the solution' : 'Reveal'}
    </button>
  );

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Place lamps on the white squares until every one of them is lit. A lamp lights its own square and shines along its row and column until it meets a wall. No lamp may shine on another lamp, and a numbered wall must have exactly that many lamps on its four sides."
      steps={[
        <><b>Tap a white square</b> to cycle it: lamp, then a small dot that marks it as empty, then blank. On desktop the <b>arrow keys</b> move, <b>L</b> or <b>1</b> places a lamp, <b>X</b> or <b>2</b> a dot, Space cycles.</>,
        <>Lit squares turn warm. A wall with <b>0</b> has no lamp beside it; a wall with <b>4</b> has one on every side. A blank wall can have any number.</>,
        <>Two lamps that see each other turn red, and so does a numbered wall with too many lamps. A number is underlined once it is met. <b>Undo</b> (or Ctrl+Z) takes back a move; <b>Clear</b> wipes the board.</>,
      ]}
      knack="Start with the walls that leave no choice: a 0, a 4, a 3 on an edge, a 2 in a corner. Then look for a dark square that only one open square can light, and put the lamp there."
      footer="Every board has exactly one solution and can always be reached by logic, with no guessing. Solve it for a perfect 10; nothing is counted against you, so the daily leaderboard is a race on the clock. One free hint, on your first ever play, places a lamp that belongs. Boards grow from 7×7 early in the week to 8×8, and the Sunday Edition is 10×10."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), ...LIGHT_VARS, minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="lamps" name="Lamps" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="lamps" quizId={PUZZLE.quizId}
          name="Lamps"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 10×10' : null}
          figures={[
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="lm-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.lm-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .lm-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .lm-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .lm-cell{border-radius:var(--lm-rad, 6px) !important;border:0;display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;box-sizing:border-box;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-width:0;min-height:0;overflow:hidden;padding:0;font:inherit;}
          .lm-cell:focus-visible{outline:3px solid var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));outline-offset:-3px;}
          .lm-cell:disabled{opacity:1;}
          .lm-beam{position:absolute;background:var(--lm-beam);opacity:.8;pointer-events:none;}
          .lm-top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:2px auto 14px;max-width:${GRID_MAX + 40}px;}
          .lm-cap{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${FADED};}
          .lm-meter{height:10px;border-radius:3px;background:var(--lm-dark);box-shadow:inset 0 0 0 1px var(--stg-line2, rgba(28,30,36,0.25));overflow:hidden;}
          .lm-meter span{display:block;height:100%;background:var(--lm-glow);transition:width .2s ease-out;}
          .lm-key{display:flex;gap:14px;font-size:11px;font-weight:700;color:${FADED};padding-bottom:1px;}
          .lm-key span{display:inline-flex;align-items:center;gap:6px;}
          .lm-key i{width:14px;height:14px;border-radius:3px;display:inline-block;}
          .lm-panel{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid ${SURF_B};border-radius:20px;padding:24px 20px 16px;}
          .lm-foot{display:flex;align-items:center;gap:12px;border-top:1px solid ${SURF_B};margin-top:18px;padding-top:14px;}
          .lm-status{font-size:15px;font-weight:700;line-height:1.4;min-height:2.8em;}
          .lm-help{font-size:12px;font-weight:600;line-height:1.4;color:${FADED};}
          .lm-acts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
          .lm-ob{font-family:${SANS};font-weight:700;font-size:14px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:transparent;color:${INK};border-radius:12px;padding:0 16px;min-height:48px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;}
          .lm-ob:hover{background:var(--stg-surf2, rgba(28,30,36,0.06));}
          .lm-ob:disabled{color:${FADED};cursor:default;}
          .lm-ob:disabled:hover{background:transparent;}
          .lm-link{font-family:${SANS};font-weight:700;font-size:12px;background:none;border:0;color:${INK};text-decoration:underline;text-underline-offset:3px;min-height:44px;padding:0 6px;cursor:pointer;}
          .lm-under{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:12px;font-weight:600;color:${FADED};}
          .lm-ph{display:none;}
          @media(max-width:560px){
            .lm-dk{display:none !important;}
            .lm-ph{display:inline;}
            .lm-help.lm-ph{display:block;}
            .lm-top{margin-bottom:14px;}
            .lm-key{display:none;}
            .lm-cap{font-size:10px;}
            .lm-meter{height:7px;border-radius:2px;}
            .lm-panel{background:transparent;border:0;padding:0;}
            .lm-foot{flex-direction:column;align-items:stretch;border-top:0;margin-top:16px;padding-top:0;}
            .lm-status{font-size:14px;min-height:0;}
            .lm-acts{justify-content:flex-start;flex-wrap:nowrap;margin-top:6px;}
            .lm-acts .lm-ob{flex:1 1 0;padding:0 10px;}
            .lm-acts .lm-ph .lm-link{font-size:13px;}
          }
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="lamps"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 10×10</span>}
          blocks={'LAMPS'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 2 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Lamps is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Light every white square. A lamp shines along its row and column until a wall. No lamp may shine on another, and a numbered wall touches exactly that many lamps.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="lm-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid var(--stg-line, rgba(28,30,36,0.18))', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>lit <b style={{ color: INK, fontWeight: 700 }}>{filledCount}</b>/{WHITES.length}</span>
          </div>
          )}

          {/* THE METER: how much of the board is still dark, over a bar that
              fills with light, and the key beside it on a computer. */}
          <div className="lm-top">
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="lm-cap">Still dark &middot; <b style={{ color: INK, fontWeight: 800, fontSize: 15, letterSpacing: 0 }}>{darkCount}</b> of {WHITES.length} squares</span>
              <div className="lm-meter" role="meter" aria-label={`${darkCount} of ${WHITES.length} squares still dark`} aria-valuemin={0} aria-valuemax={WHITES.length} aria-valuenow={an.lit.size}>
                <span style={{ width: `${litPct}%` }} />
              </div>
            </div>
            <div className="lm-key" aria-hidden="true">
              <span><i style={{ borderRadius: '50%', background: 'var(--lm-glow)' }} />Lamp</span>
              <span><i style={{ background: 'var(--lm-lit)' }} />Lit</span>
              <span><i style={{ background: 'var(--lm-dark)', boxShadow: 'inset 0 0 0 1px var(--stg-line2, rgba(28,30,36,0.25))' }} />Dark</span>
            </div>
          </div>

          <div className="lm-panel">
          <div ref={gridBoxRef} style={{ maxWidth: GRID_MAX, margin: '0 auto' }}>
            <div role="grid" aria-label={`Lamps board, ${N} by ${N}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`, gap: GRID_GAP, padding: GRID_PAD, aspectRatio: '1', background: 'var(--lm-gap)', borderRadius: N >= 10 ? 8 : 10, position: 'relative', '--lm-rad': `${Math.max(3, Math.round(cellPx * 0.1))}px` }}>
              {Array.from({ length: CELLS }).map((_, idx) => {
                const v = cells[idx];
                const r = Math.floor(idx / N), c = idx % N;
                const ch = PUZZLE.grid[r][c];
                const word = isWall[idx] ? (ch === '#' ? 'wall' : `wall, ${ch}, ${touching[idx] || 0} lamps touching`) : (v === LAMP ? 'lamp' : (an.lit.has(idx) ? 'lit' : 'dark'));
                return (
                  <button key={idx} type="button" className="lm-cell" style={cellStyle(idx)}
                    onClick={() => cellClick(idx)}
                    disabled={!playing || isWall[idx]}
                    aria-label={`Row ${r + 1}, column ${c + 1}, ${word}${(breaks.badLamp.has(idx) || breaks.badWall.has(idx)) ? ', breaks a rule' : ''}`}>
                    {markFor(idx)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* the status line, the helper, and the outline buttons */}
          {started && (
            <div className="lm-foot">
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span aria-live="polite" className="lm-status" style={{ color: breaks.any ? `var(--stg-bad, ${COLORS.rust})` : INK }}>{statusMain}</span>
                <span className="lm-help lm-dk">Pips under a number fill as lamps touch it. Grey dots are squares you have ruled out.</span>
                <span className="lm-help lm-ph">Tap: lamp, then dot, then blank. Pips fill as lamps touch a number.</span>
              </div>
              <div className="lm-acts">
                <button type="button" className="lm-ob" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo last move">
                  <RotateCcw size={15} /> Undo
                </button>
                <button type="button" className="lm-ob" onClick={clearBoard} disabled={!hasEntries}
                  title="Take every lamp off the board and start over on the same clock"
                  aria-label={armClear ? 'Tap again to clear the board' : 'Clear the board'}
                  style={hasEntries && armClear ? { borderColor: `var(--stg-bad, ${COLORS.rust})`, color: `var(--stg-bad, ${COLORS.rust})` } : undefined}>
                  <Trash2 size={15} /> {armClear ? 'Tap again to clear' : 'Clear'}
                </button>
                {hintOk && !g.hintUsed && (
                  <button type="button" className="lm-ob" onClick={useHint} title="Place one lamp that belongs (one hint, first play only)" aria-label="Hint: place one lamp">
                    <Lightbulb size={15} /> Hint
                  </button>
                )}
                <span className="lm-ph">{revealBtn}</span>
              </div>
            </div>
          )}
          </div>
          {started && (
            <div className="lm-under lm-dk">
              <span>Tap: lamp, then dot, then blank. L and X on a keyboard.{g.hintUsed ? ' Hint used.' : ''}</span>
              {revealBtn}
            </div>
          )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: a 10×10 board, the biggest of the week.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Lamps in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new Lamps drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/lamps?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Lamps &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(/, 20\d\d$/, '')} archive.{' '}
                    <a href="/lamps" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Lamps &rarr;</a>
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
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Lamps"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${N}×${N} · ${filledCount}/${WHITES.length} lit · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Lamps all time` : 'all-time rank' }
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
                href: `/lamps?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished grid', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the solution', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Lamps', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/lamps?p=${prevPuzzle.num}` },
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

        </div>

        {!STAGE && <GamePanel self="lamps" name="Lamps" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="lamps" name="Lamps" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="lamps"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="lamps" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Lamps to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s Lamps, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s Lamps, every day.
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
          self="lamps"
          won={won}
          headline={won ? <>Board solved!</> : <>Board revealed</>}
          subline={won
            ? <>solved in {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>the solved board is shown above</>}
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
            <button className="lm-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Lamps</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Lamps is a free daily logic puzzle from Mind Loft. Place lamps on a grid of white squares and walls until every white square is lit. A lamp shines along its row and column until it meets a wall, no lamp may shine on another, and a wall with a number on it must touch exactly that many lamps.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          It is a light-placement puzzle, the family sometimes called akari. Every board has a single solution you can always reach by logic, with no guessing. Two lamps that see each other turn red, but a lamp that is simply in the wrong place is never flagged, and a clean solve scores a perfect 10 with the daily leaderboard decided on the clock.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern: 7×7 early in the week, 8×8 from Thursday, and a 10×10 Sunday Edition. No app, no signup, play free in your browser. More grid logic: try <a href="/duet" style={{ color: INK, fontWeight: 800 }}>Duet</a>, <a href="/hedge" style={{ color: INK, fontWeight: 800 }}>Hedge</a> and <a href="/plot" style={{ color: INK, fontWeight: 800 }}>Plot</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
