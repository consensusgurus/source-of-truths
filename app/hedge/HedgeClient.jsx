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
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
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

const CELL = 46, PAD = 24;

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

  const H = g.h, V = g.vt;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('hedge');
  const STAGE = isStage('hedge', searchParams);
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
    const g2 = { ...cur, h: solH.slice(), vt: solV.slice(), status: 'revealed', tEnd: Date.now() };
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
  const HIT = Math.round(CELL * 0.4);

  const segs = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) segs.push({ kind: 'h', i, j, idx: i * n + j, x1: X(j), y1: Y(i), x2: X(j + 1), y2: Y(i) });
  for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) segs.push({ kind: 'v', i, j, idx: i * (n + 1) + j, x1: X(j), y1: Y(i), x2: X(j), y2: Y(i + 1) });

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
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
            { v: `${rightDrawn}/${LOOP_LEN}`, k: 'loop' },
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
          .hg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .hg-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @media(max-width:560px){.hg-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.hg-ttl h1{font-size:21px;}.hg-ttl-dot{display:none;}}
          .hg-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .hg-tool.on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});}
          .hg-hit{stroke:transparent;fill:none;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}
          .hg-svg{touch-action:manipulation;width:100%;height:auto;display:block;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}
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

          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <svg className="hg-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Hedge loop puzzle, ${n} by ${n}`}>
              {/* clue numbers */}
              {PUZZLE.clues.map((row, i) => row.map((c, j) => {
                if (c === null || c === undefined) return null;
                const k = cellCount[i][j];
                // MET is said STRUCTURALLY, not by a lighter grey (owner,
                // 2026-09-02): mute and ink are two steps of one ramp, so the
                // met/unmet distinction was a lightness step that reads as one
                // colour at 17px in BOTH registers. The digit is struck through
                // instead, which reads the same light or dark and matches the
                // meaning: this clue is finished, cross it off. Note the token
                // is --stg-mute2; there is no --stg-mute in StageChrome, so the
                // old value silently fell back to the hardcoded grey and never
                // flipped with the register at all.
                const met = k === c;
                const col = k > c ? `var(--stg-bad, ${COLORS.rust})`
                  : met ? 'var(--stg-mute2, #c3c8d4)'
                  : `var(--stg-ink, ${COLORS.ink})`;
                const cx = X(j) + CELL / 2, cy = Y(i) + CELL / 2;
                return (
                  <g key={`c${i}-${j}`} style={{ color: col, pointerEvents: 'none', userSelect: 'none' }}>
                    <text x={cx} y={cy} fill="currentColor"
                      fontFamily={MONO} fontSize={17} fontWeight="500" textAnchor="middle" dominantBaseline="central">{c}</text>
                    {met && (
                      <line x1={cx - 6.5} x2={cx + 6.5} y1={cy} y2={cy}
                        stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    )}
                  </g>
                );
              }))}
              {/* crosses */}
              {segs.map((s) => {
                const st = s.kind === 'h' ? H[s.idx] : V[s.idx];
                if (st !== 2) return null;
                const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2, r = 5;
                return (
                  <g key={`x${s.kind}${s.idx}`} style={{ pointerEvents: 'none' }}>
                    <line x1={mx - r} y1={my - r} x2={mx + r} y2={my + r} stroke="#cdd3de" strokeWidth={2.4} strokeLinecap="round" />
                    <line x1={mx - r} y1={my + r} x2={mx + r} y2={my - r} stroke="#cdd3de" strokeWidth={2.4} strokeLinecap="round" />
                  </g>
                );
              })}
              {/* drawn lines */}
              {segs.map((s) => {
                const st = s.kind === 'h' ? H[s.idx] : V[s.idx];
                if (st !== 1) return null;
                const ok = (s.kind === 'h' ? solH[s.idx] : solV[s.idx]) === 1;
                return (
                  <line key={`l${s.kind}${s.idx}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                    stroke={ok ? COLORS.accent : COLORS.rust} strokeWidth={5} strokeLinecap="round"
                    style={{ pointerEvents: 'none' }} />
                );
              })}
              {/* dots */}
              {Array.from({ length: (n + 1) * (n + 1) }).map((_, k) => {
                const i = Math.floor(k / (n + 1)), j = k % (n + 1);
                return <circle key={`d${k}`} cx={X(j)} cy={Y(i)} r={2.6} fill="#9aa2b4" style={{ pointerEvents: 'none' }} />;
              })}
              {/* invisible hit targets, drawn last so they always take the tap */}
              {playing && segs.map((s) => (
                <line key={`h${s.kind}${s.idx}`} className="hg-hit" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  strokeWidth={HIT}
                  onClick={() => { if (longFired.current) { longFired.current = false; return; } tapSeg(s.kind, s.idx); }}
                  onContextMenu={(e) => { e.preventDefault(); if (longFired.current) { longFired.current = false; return; } drawLineSeg(s.kind, s.idx); }}
                  onPointerDown={(e) => { if (e.pointerType === 'touch') startPress(s.kind, s.idx, e); }}
                  onPointerMove={movePress}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  onPointerCancel={endPress} />
              ))}
            </svg>
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button className={`hg-tool${tool === 'x' ? ' on' : ''}`} onClick={() => setTool('x')} title="Mark no-line notes (default)" aria-pressed={tool === 'x'}>
                <span style={{ fontWeight: 900, fontSize: 14, lineHeight: 1 }}>&times;</span> Mark
              </button>
              <button className={`hg-tool${tool === 'line' ? ' on' : ''}`} onClick={() => setTool('line')} title="Draw the loop line" aria-pressed={tool === 'line'}>
                <span style={{ fontWeight: 900, fontSize: 14, lineHeight: 1 }}>&#9585;</span> Line
              </button>
              <button className="hg-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Undo
              </button>
              {hintOk && !g.hintUsed && (
                <button className="hg-tool" onClick={useHint} title="Draw one correct segment (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(8,145,178,0.5)', color: '#07647c' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: tool === 'line' ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {tool === 'line'
                ? 'Drawing lines: tap a segment to draw the loop, tap again to lift it. Switch to × to mark segments off.'
                : 'Marking: tap a segment for a × (no line here), tap again to clear. Switch to Line to draw — or hold / right-click any segment to draw one.'}
            </span>
            {identity && (rightDrawn > 0 || errors > 0) && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and draws the loop' : 'Reveal & end'}
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
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition &mdash; a bigger 10&times;10 grid.</div>
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
              name="Hedge"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
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
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Hedge to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s loop, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s loop, every day.
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
            <button className="hg-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
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
