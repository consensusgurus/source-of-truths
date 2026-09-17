'use client';

// Plot — the daily rectangle partition.
//
// Each day: a grid with numbers scattered across it. Divide the whole board into
// rectangles so that every rectangle contains exactly one number and covers
// exactly that many cells. There is exactly one way to do it, and every board is
// reachable by pure deduction, so a plot is never a guess.
//
// Drag out a rectangle to claim it. A claim that is legal but not part of the
// solution glows red and counts as an error until you hand it back; tapping a
// finished plot returns it for nothing. Score is 10 minus half your errors,
// floor 1, so a clean solve is a perfect 10 and ties break on fewest errors then
// fastest time.
//
// Same daily plumbing as Etch/Suds: banked boards gated by Eastern date on the
// server (app/plot/page.js), per-puzzle localStorage saves, /plot?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow. Weekdays are
// 10x10; Sundays step up to a 12x12 Edition.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { RotateCcw, X, Lightbulb, Eye, Smartphone } from 'lucide-react';
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
import { regionStyle, regionMix, REGION_INK } from '@/lib/category-ramp';
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
  accent: '#78350f',        // Plot identity — surveyed earth
  accentSoft: '#fbf1e5',
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_plot_help_seen';
const STATS_KEY = 'sot_plot_stats';

// Plot fills, walked around a small ring so neighbours never share one. Each
// pair is a light ground and the darker edge/number that reads on it.
const TINT = [
  ['#e8eef7', '#2f4f7a'], ['#efe9f6', '#4b3f6e'], ['#e6f2ec', '#2f6350'],
  ['#f7ece8', '#7a4030'], ['#f2eee2', '#5f5636'], ['#e9f0f2', '#31585f'],
];
const WRONG_BG = '#f6d5d5';
const WRONG_EDGE = '#a33a3a';

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

// ─── Personal stats + streak (localStorage), Etch/Suds pattern ──────────────
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

// A claim is [row, col, width, height, clueIndex]. `wrong` is derived, never
// stored, so a save can never disagree with the board it is replayed against.
function freshState() {
  return { v: 1, plots: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}
const areaOf = (p) => p[2] * p[3];
const inRect = (p, r, c) => r >= p[0] && r < p[0] + p[3] && c >= p[1] && c < p[1] + p[2];

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function PlotClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.n, CELLS = N * N;
  const STORE_KEY = `sot_plot_${PUZZLE.num}`;
  const CLUES = PUZZLE.clues;
  // the one true tiling, keyed by clue index, for marking a legal-but-wrong claim
  const SOLKEY = useMemo(() => PUZZLE.sol.map((s) => s.join(',')), [PUZZLE]);
  const clueAt = useMemo(() => {
    const m = new Map();
    CLUES.forEach((cl, k) => m.set(cl[0] * N + cl[1], k));
    return m;
  }, [CLUES, N]);

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('plot', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('plot'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const [drag, setDrag] = useState(null);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const undoRef = useRef([]);
  const gridRef = useRef(null);
  const dragRef = useRef(null);

  const plots = g.plots;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('plot');
  const STAGE = isStage('plot', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('plot');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('plot'), '--stg-acc-lt': gameColorLight('plot'), '--stg-onramp-lt': gameOnrampLight('plot'), '--stg-acc-ink-lt': gameAccentInkLight('plot') };
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
  // What the game actually posted, mirroring the win path: 10 down one point
  // per two errors, floored at 1, and 0 for a give-up.
  const finalScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;
  const endScore = finalScore;

  // Which claims are legal but not part of the solution. Derived every render
  // from the board itself, so a restored save marks exactly what a live one does.
  const wrongSet = useMemo(() => {
    const s = new Set();
    plots.forEach((p, i) => { if (!SOLKEY.includes(p.slice(0, 4).join(','))) s.add(i); });
    return s;
  }, [plots, SOLKEY]);
  const owner = useMemo(() => {
    const m = new Int16Array(CELLS).fill(-1);
    plots.forEach((p, i) => {
      for (let r = p[0]; r < p[0] + p[3]; r++) for (let c = p[1]; c < p[1] + p[2]; c++) m[r * N + c] = i;
    });
    return m;
  }, [plots, CELLS, N]);
  const claimed = useMemo(() => plots.reduce((a, p) => a + areaOf(p), 0), [plots]);

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
        if (saved && saved.v === 1 && Array.isArray(saved.plots)) {
          const next = { ...freshState(), ...saved };
          gRef.current = next;
          setG(next);
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
        if (done || g.t0) localStorage.setItem('sot_plot_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_plot_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock, ticked in state rather than read during render so the
  // readout moves on its own. The time recorded on the result is still a real
  // Date.now() delta taken when the game ends.
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
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'plot', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'plot', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'plot', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'plot', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'plot', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_plot_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.plots.length > 0 || cur.errors > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.errors, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
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

  function pushUndo(ps) {
    undoRef.current = [...undoRef.current.slice(-59), ps.map((p) => p.slice())];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || gRef.current.status !== 'playing') return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    commit({ ...gRef.current, plots: prev.map((p) => p.slice()) });
  }

  // Every claim on the board is legal by construction (one clue, right area, no
  // overlap), so a board with every cell claimed IS the solution: the tiling is
  // unique, and a legal-but-wrong claim is marked and has to come back first.
  function solvedBy(ps) {
    if (ps.length !== CLUES.length) return false;
    let a = 0;
    for (const p of ps) {
      if (!SOLKEY.includes(p.slice(0, 4).join(','))) return false;
      a += areaOf(p);
    }
    return a === CELLS;
  }

  function claim(rect) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const [r, c, w, h] = rect;
    // overlap
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) {
      if (owner[rr * N + cc] >= 0) { say('That overlaps a plot you have already claimed.'); return; }
    }
    // exactly one clue inside, and the area has to match it
    let k = -1, count = 0;
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) {
      const j = clueAt.get(rr * N + cc);
      if (j !== undefined) { count++; k = j; }
    }
    // A 1x1 release is a TAP, not a drag, and a tap is already this board's
    // gesture for handing a plot BACK, so an accidental one must never cost an
    // error. The one 1x1 that is a real claim is a 1 on its own cell, which is
    // correct by construction, so tapping a 1 still claims it.
    if (w * h === 1 && !(count === 1 && CLUES[k][2] === 1)) return;
    if (!cur.t0) startGame();
    if (count !== 1 || CLUES[k][2] !== w * h) {
      const g2 = { ...cur, errors: cur.errors + 1 };
      if (!g2.t0) g2.t0 = Date.now();
      vibrate(HAPT.wrong);
      commit(g2);
      say(count === 0 ? 'Every plot needs a number in it.'
        : count > 1 ? 'A plot can only hold one number.'
        : `That is ${w * h} cells for a ${CLUES[k][2]}.`);
      return;
    }
    pushUndo(cur.plots);
    const next = [...cur.plots, [r, c, w, h, k]];
    const bad = !SOLKEY.includes([r, c, w, h].join(','));
    const g2 = { ...cur, plots: next, errors: cur.errors + (bad ? 1 : 0) };
    if (!g2.t0) g2.t0 = Date.now();
    if (!bad && solvedBy(next)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2);
      setJustWon(true);
      return;
    }
    vibrate(bad ? HAPT.wrong : HAPT.ok);
    commit(g2);
    if (bad) say('That fits the number, but it is not where the plot goes.');
  }

  function release(i) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || i < 0) return;
    pushUndo(cur.plots);
    commit({ ...cur, plots: cur.plots.filter((_, k) => k !== i) });
  }

  // ---- pointer: drag a rectangle out of the grid ----
  function cellFromPoint(x, y) {
    const el = gridRef.current;
    if (!el) return null;
    const b = el.getBoundingClientRect();
    if (!b.width || !b.height) return null;
    const c = Math.floor(((x - b.left) / b.width) * N);
    const r = Math.floor(((y - b.top) / b.height) * N);
    if (r < 0 || c < 0 || r >= N || c >= N) return null;
    return { r, c };
  }
  function onGridDown(e) {
    if (gRef.current.status !== 'playing') return;
    const p = cellFromPoint(e.clientX, e.clientY);
    if (!p) return;
    const hit = owner[p.r * N + p.c];
    if (hit >= 0) { release(hit); return; }
    if (!gRef.current.t0) startGame();
    dragRef.current = { a: p, b: p };
    setDrag({ a: p, b: p });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  }
  // Dragging OFF the board is the way out of a drag you did not mean to start.
  // The pointer is captured, so the grid keeps receiving moves once the finger
  // leaves it: we mark the drag `off` rather than ignoring the move, and a
  // release out there throws it away instead of claiming whatever the last
  // in-grid cell happened to be. The preview goes ghosted while you are
  // outside, so the cancel is visible BEFORE you let go.
  function onGridMove(e) {
    if (!dragRef.current) return;
    const p = cellFromPoint(e.clientX, e.clientY);
    const d = { a: dragRef.current.a, b: p || dragRef.current.b, off: !p };
    dragRef.current = d;
    setDrag(d);
  }
  function cancelDrag() {
    if (!dragRef.current) return false;
    dragRef.current = null;
    setDrag(null);
    return true;
  }
  function onGridUp() {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) return;
    if (d.off) { say('Dropped off the board. Nothing claimed.'); return; }
    claim(rectOf(d));
  }
  function rectOf(d) {
    const r = Math.min(d.a.r, d.b.r), c = Math.min(d.a.c, d.b.c);
    return [r, c, Math.abs(d.a.c - d.b.c) + 1, Math.abs(d.a.r - d.b.r) + 1];
  }
  useEffect(() => {
    const stop = () => { if (dragRef.current) { dragRef.current = null; setDrag(null); } };
    window.addEventListener('pointercancel', stop);
    return () => window.removeEventListener('pointercancel', stop);
  }, []);

  // one free hint: hand over one plot the player has not claimed yet
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const have = new Set(cur.plots.map((p) => p.slice(0, 4).join(',')));
    let idx = -1;
    for (let k = 0; k < PUZZLE.sol.length; k++) {
      if (have.has(SOLKEY[k])) continue;
      const [r, c, w, h] = PUZZLE.sol[k];
      let free = true;
      for (let rr = r; rr < r + h && free; rr++) for (let cc = c; cc < c + w; cc++) if (owner[rr * N + cc] >= 0) { free = false; break; }
      if (free) { idx = k; break; }
    }
    if (idx < 0) { say('Hand back a red plot first, the hint has nowhere to go.'); return; }
    const [r, c, w, h] = PUZZLE.sol[idx];
    const k = CLUES.findIndex((cl) => inRect([r, c, w, h], cl[0], cl[1]));
    pushUndo(cur.plots);
    const next = [...cur.plots, [r, c, w, h, k]];
    const g2 = { ...cur, plots: next, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    if (solvedBy(next)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    commit(g2);
    say('Hint placed, one plot surveyed for you.');
  }

  function revealEnd() {
    const cur = gRef.current;
    const full = PUZZLE.sol.map(([r, c, w, h]) => [r, c, w, h, CLUES.findIndex((cl) => inRect([r, c, w, h], cl[0], cl[1]))]);
    const g2 = { ...cur, plots: full, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    commit(freshState());
    setJustWon(false); setEndClosed(false);
  }

  const onKey = useCallback((e) => {
    if (gRef.current.status !== 'playing') return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'Escape' && cancelDrag()) { e.preventDefault(); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareUrl() {
    return withRef(`mindloftdaily.com/plot${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7EB}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Plot #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${errors === 0 ? 'clean' : `${errors} error${errors === 1 ? '' : 's'}`} · ${elapsed}${hintBit}${streakBit}`
      : `Plot #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Plot #${PUZZLE.num} — the daily rectangle puzzle from Mind Loft.\n${shareUrl()}`
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

  const preview = drag ? rectOf(drag) : null;
  const previewOk = useMemo(() => {
    if (!preview) return false;
    const [r, c, w, h] = preview;
    let count = 0, k = -1;
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) {
      if (owner[rr * N + cc] >= 0) return false;
      const j = clueAt.get(rr * N + cc);
      if (j !== undefined) { count++; k = j; }
    }
    return count === 1 && CLUES[k][2] === w * h;
  }, [preview, owner, clueAt, CLUES, N]);

  const numFs = N > 10 ? 'clamp(11px, 2.4vw, 17px)' : 'clamp(12px, 2.8vw, 19px)';
  const pct = (v) => `${(v / N) * 100}%`;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Divide the whole board into rectangles, one number in each."
      chips={[
        { label: 'A rectangle covers exactly its number', tone: 'grey' },
        { label: 'A wrong plot is an error', tone: 'bad' },
      ]}
      steps={[
        <>Every number is the <b>area</b> of the plot it belongs to. A <b>6</b> sits in a plot of six cells, so 1&times;6, 2&times;3, 3&times;2 or 6&times;1.</>,
        <><b>Drag</b> from one corner to the other to claim a plot. It has to hold <b>exactly one</b> number, and cover exactly that many cells. Changed your mind? Slide <b>off the board</b> and let go, and nothing is claimed.</>,
        <>Every cell ends up in a plot, and no two plots overlap. <b>Tap</b> a plot you have claimed to hand it back, which costs nothing, and a stray tap on a single square costs nothing either.</>,
        <><b>Undo</b> (or Ctrl+Z) takes back your last move, and one free <b>hint</b>, on your first ever play, surveys one plot for you.</>,
      ]}
      knack="Start where a number has nowhere else to go: a 1 is its own cell, and a number in a corner or against an edge usually has only one shape that fits."
      note={<>A plot that fits its number but is in the wrong place turns <b>red</b> and counts as an error. Hand it back to carry on.</>}
      footer="A clean solve with no errors is a perfect 10, every two errors cost a point. Ties break on fewest errors, then fastest time. Sundays are a bigger 12×12 Edition."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="plot" name="Plot" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Plot grades a win from 10 down, so any solve is a win and a give-up is
          not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="plot" quizId={PUZZLE.quizId}
          name="Plot"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · 12×12` : null}
          figures={playing ? [
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
            { v: `${claimed}/${CELLS}`, k: 'claimed' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="pl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pl-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pl-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .pl-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .pl-num{position:absolute;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-weight:800;pointer-events:none;line-height:1;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="plot"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 12&times;12</span>}
          blocks={'PLOT'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Plot is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Divide the board into rectangles, each holding one number and covering exactly that many cells. {N}&times;{N} today, {CLUES.length} plots.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pl-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid var(--stg-line, rgba(28,30,36,0.18))', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>errors <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>claimed <b style={{ color: claimed === CELLS ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{claimed}</b>/{CELLS}</span>
          </div>
          )}

          <div style={{ maxWidth: 470, margin: '0 auto' }}>
            <div
              ref={gridRef}
              onPointerDown={onGridDown}
              onPointerMove={onGridMove}
              onPointerUp={onGridUp}
              style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', touchAction: 'none', userSelect: 'none', cursor: playing ? 'crosshair' : 'default', background: STAGE ? SURF : T.white, border: `2px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.75)'}`, boxSizing: 'border-box' }}
            >
              {/* the empty grid */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, gridTemplateRows: `repeat(${N}, 1fr)` }}>
                {Array.from({ length: CELLS }).map((_, i) => (
                  <div key={i} style={{ borderRight: (i % N) === N - 1 ? 'none' : `1px solid var(--stg-line, rgba(28,30,36,0.16))`, borderBottom: Math.floor(i / N) === N - 1 ? 'none' : `1px solid var(--stg-line, rgba(28,30,36,0.16))` }} />
                ))}
              </div>
              {/* claimed plots */}
              {plots.map((p, i) => {
                const bad = wrongSet.has(i);
                const tint = TINT[p[4] % TINT.length];
                return (
                  <div key={`p${i}`} style={{
                    ...(STAGE ? regionStyle(p[4]) : null),
                    position: 'absolute', left: pct(p[1]), top: pct(p[0]), width: pct(p[2]), height: pct(p[3]),
                    // Stage: the plot's ramp hue mixed into the cell, edged in the hue's ink.
                    background: STAGE ? (bad ? 'color-mix(in srgb, var(--stg-bad) 38%, var(--stg-cell))' : regionMix(1)) : (bad ? WRONG_BG : tint[0]),
                    border: `2px solid ${STAGE ? (bad ? 'var(--stg-bad)' : REGION_INK) : (bad ? WRONG_EDGE : tint[1])}`,
                    borderRadius: 4, boxSizing: 'border-box', pointerEvents: 'none',
                  }} />
                );
              })}
              {/* the numbers sit above the fills */}
              {CLUES.map((cl, k) => {
                const i = owner[cl[0] * N + cl[1]];
                const bad = i >= 0 && wrongSet.has(i);
                const col = i >= 0 ? (bad ? (STAGE ? 'var(--stg-bad)' : WRONG_EDGE) : (STAGE ? REGION_INK : TINT[plots[i][4] % TINT.length][1])) : `var(--stg-ink, ${COLORS.ink})`;
                return (
                  <div key={`c${k}`} className="pl-num" style={{ ...(STAGE && i >= 0 ? regionStyle(plots[i][4]) : null), left: pct(cl[1]), top: pct(cl[0]), width: pct(1), height: pct(1), fontSize: numFs, color: col }}>{cl[2]}</div>
                );
              })}
              {/* the plot being dragged out */}
              {preview && (
                <div style={{
                  position: 'absolute', left: pct(preview[1]), top: pct(preview[0]), width: pct(preview[2]), height: pct(preview[3]),
                  border: `2px dashed ${drag && drag.off ? 'var(--stg-line2, rgba(28,30,36,0.3))' : previewOk ? `var(--stg-good, ${COLORS.green})` : 'var(--stg-line3, rgba(28,30,36,0.55))'}`,
                  background: drag && drag.off ? 'transparent' : previewOk ? 'rgba(21,128,61,0.13)' : 'var(--stg-surf, rgba(28,30,36,0.07))',
                  opacity: drag && drag.off ? 0.4 : 1,
                  borderRadius: 4, boxSizing: 'border-box', pointerEvents: 'none',
                }} />
              )}
            </div>
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className="pl-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Undo
              </button>
              {hintOk && !g.hintUsed && (
                <button className="pl-tool" onClick={useHint} title="Survey one plot for you (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(120,53,15,0.5)', color: ACC_INK }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--stg-line, rgba(28,30,36,0.10))', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
              Drag corner to corner to claim a plot. Tap a plot to hand it back. Drag off the board to cancel.
            </span>
            {identity && (claimed > 0 || errors > 0) && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows the map' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>Every plot surveyed, {CLUES.length} of them.</> : <>The map: <span style={{ color: ACC_INK }}>{CLUES.length} plots</span>, shown above.</>}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; a bigger 12&times;12 board.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Plot in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/plot?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Plot &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/plot" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Plot &rarr;</a>
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
              name="Plot"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} errors \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Plot all time` : 'all-time rank' }
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
                  href: `/plot?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Plot', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/plot?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="plot" name="Plot" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="plot" name="Plot" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="plot"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="plot" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Plot to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.
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
          self="plot"
          won={won}
          headline={won ? <>Board surveyed!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {errors === 0 ? 'clean, no errors' : `${errors} error${errors === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the map is shown above</>}
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
            <button className="pl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Plot</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Plot is a free daily rectangle puzzle from Mind Loft, the logic puzzle also known as shikaku or divide by squares. Numbers are scattered across the board, and each one is the size of the plot it belongs to. Divide the whole board into rectangles so that every rectangle holds exactly one number and covers exactly that many cells.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board has exactly one solution and is reachable by pure deduction, so there is never a moment where you have to guess. Drag corner to corner to claim a plot, tap one to hand it back, slide off the board mid-drag to cancel, and start where a number has nowhere else to go. A plot that fits its number but sits in the wrong place turns red, so you always know where you stand.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern, and Sundays step up to a 12&times;12 Edition. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/etch" style={{ color: INK, fontWeight: 800 }}>Etch</a>, our nonogram, <a href="/hedge" style={{ color: INK, fontWeight: 800 }}>Hedge</a>, our loop puzzle, and <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
