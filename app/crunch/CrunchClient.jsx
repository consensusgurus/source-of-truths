'use client';

// Crunch — the daily numbers round.
//
// Six numbers, one target between 101 and 999. Combine two of them with plus,
// minus, times or divide, and the answer replaces both and joins the pool. Every
// value along the way has to be a positive whole number, so no negatives and no
// fractions. You do not have to use all six.
//
// Scoring is Countdown's own scale, on the closest value you ever produce: spot
// on is ten, within five is seven, within ten is five, anything else is one.
// Walking away is the only way to score nothing, so there is never a reason to.
//
// Undo and start over are both free. This is not scored on move count, it is
// scored on how close you get, so there is nothing to protect by withholding a
// take-back. The state is just the list of steps taken, and the tiles on the
// table are replayed from it, which makes a save tiny and impossible to drift.
//
// Same daily plumbing as Park/Four/Mate: banked boards gated by Eastern date on
// the server (app/crunch/page.js), per-puzzle localStorage saves, /crunch?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, Smartphone, RotateCcw, Undo2 } from 'lucide-react';
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
import { solve, applyOp, scoreFor } from './solver';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#b45309',        // Crunch identity — chalk-on-slate amber
  accentSoft: '#fdf3e3', green: T.successDeep,
};
const TILE_FACE = '#f6efdd';   // the physical tile
const TILE_EDGE = T.ink;
const TILE_MADE = '#efe4c8';   // a tile you made rather than were dealt
const SLATE = '#22262e';       // the target board

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_crunch_help_seen';
const STATS_KEY = 'sot_crunch_stats';

const OPS = ['+', '-', 'x', '/'];
const OPL = { '+': '+', '-': '-', x: '×', '/': '÷' };

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

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const freshState = () => ({ v: 1, steps: [], hintUsed: false, status: 'playing', t0: null, tEnd: null, bestDiff: null });

// The tiles on the table, replayed from the steps. Nothing about the pool is
// stored, so a save can never disagree with what is on screen.
function replay(numbers, steps) {
  let pool = numbers.map((v, i) => ({ id: `n${i}`, v, made: false }));
  for (let si = 0; si < steps.length; si++) {
    const st = steps[si];
    const a = st[0], b = st[2], r = st[3];
    const ia = pool.findIndex((t) => t.v === a);
    if (ia < 0) break;
    pool = pool.filter((_, k) => k !== ia);
    const ib = pool.findIndex((t) => t.v === b);
    if (ib < 0) break;
    pool = pool.filter((_, k) => k !== ib);
    pool = [...pool, { id: `s${si}`, v: r, made: true }];
  }
  return pool;
}
export default function CrunchClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_crunch_${PUZZLE.num}`;
  const TARGET = PUZZLE.target;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [op, setOp] = useState(null);
  const [shake, setShake] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armLock, setArmLock] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('crunch', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('crunch'); }, [g.hintUsed]);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('crunch');
  const STAGE = isStage('crunch', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('crunch');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('crunch'), '--stg-acc-lt': gameColorLight('crunch'), '--stg-onramp-lt': gameOnrampLight('crunch'), '--stg-acc-ink-lt': gameAccentInkLight('crunch') };
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
  const used = g.steps.length;
  const need = PUZZLE.need;
  const bestDiff = g.bestDiff;
  const finalScore = won ? 10 : g.status === 'done' ? scoreFor(bestDiff == null ? 999 : bestDiff) : 0;

  const tiles = useMemo(() => replay(PUZZLE.numbers, g.steps), [PUZZLE, g.steps]);
  const selTile = useMemo(() => (sel == null ? null : tiles.find((t) => t.id === sel) || null), [sel, tiles]);

  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => { if (sel != null && !selTile) { setSel(null); setOp(null); } }, [sel, selTile]);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!armLock) return undefined;
    const t = setTimeout(() => setArmLock(false), 3500);
    return () => clearTimeout(t);
  }, [armLock]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.steps)) {
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
        if (done || g.t0) localStorage.setItem('sot_crunch_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_crunch_day');
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
  const iq = useIqStanding({ game: 'crunch', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'crunch', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'crunch', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'crunch', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'crunch', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_crunch_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!(cur.steps.length || cur.hintUsed) || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.steps.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.steps.length, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.steps.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function refuse(msg) {
    setShake((k) => k + 1);
    vibrate(HAPT.wrong);
    say(msg);
  }

  // a is the tile you picked first, b the second, so the order you tap is the
  // order the sum is written. That matters for minus and divide.
  function doStep(a, b, o) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const r = applyOp(a, b, o);
    if (r === null) {
      if (o === '-') refuse(a === b ? `${a} - ${b} leaves nothing. Take the smaller number from the bigger one.` : `${a} - ${b} goes negative. Take the smaller number from the bigger one.`);
      else if (o === '/') refuse(`${b} does not divide into ${a} evenly. Only whole answers count.`);
      else refuse('That one is not allowed.');
      return;
    }
    const steps = [...cur.steps, [a, o, b, r]];
    const d = Math.abs(r - TARGET);
    const g2 = { ...cur, steps, bestDiff: cur.bestDiff == null ? d : Math.min(cur.bestDiff, d) };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null); setOp(null); setArmLock(false);
    if (r === TARGET) {
      const done = { ...g2, status: 'won', tEnd: Date.now(), bestDiff: 0 };
      vibrate(HAPT.win);
      postResult(done, 10);
      commit(done);
      return;
    }
    vibrate(HAPT.ok);
    commit(g2);
  }

  function onTile(t) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); return; }
    if (sel == null) { setSel(t.id); return; }
    if (sel === t.id) { setSel(null); setOp(null); return; }
    if (!op) { setSel(t.id); return; }
    const a = selTile ? selTile.v : null;
    if (a == null) { setSel(t.id); setOp(null); return; }
    doStep(a, t.v, op);
  }

  function onOp(o) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); return; }
    if (sel == null) { say('Pick a number first, then an operation.'); return; }
    setOp((v) => (v === o ? null : o));
  }

  function undo() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.steps.length) return;
    commit({ ...cur, steps: cur.steps.slice(0, -1) });
    setSel(null); setOp(null); setArmLock(false);
  }

  function startOver() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.steps.length) return;
    commit({ ...cur, steps: [] });
    setSel(null); setOp(null); setArmLock(false);
    say('Back to the six you were dealt. Nothing lost, the clock keeps running.');
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    setSel(null); setOp(null);
    const r = solve(tiles.map((t) => t.v), TARGET);
    if (r && r.exact && r.steps && r.steps.length) {
      const [a, o, b] = r.steps[0];
      say(`Try ${a} ${OPL[o]} ${b}.`);
    } else {
      say('Nothing on the table reaches it exactly now. Undo a step or start over.');
    }
  }

  function lockIn() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.bestDiff == null) return;
    const g2 = { ...cur, status: 'done', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, scoreFor(cur.bestDiff));
    commit(g2);
    setSel(null); setOp(null);
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
    setSel(null); setOp(null);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setSel(null); setOp(null); setEndClosed(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/crunch${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const g5 = Math.max(0, Math.min(5, Math.round(finalScore / 2)));
    const squares = '\u{1F7E7}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Crunch #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${TARGET} exactly in ${used} step${used === 1 ? '' : 's'} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'done'
        ? `Crunch #${PUZZLE.num} · ${bestDiff} off ${TARGET} · ${elapsed}${hintBit}${streakBit}`
        : `Crunch #${PUZZLE.num} · walked away · target ${TARGET}`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Crunch #${PUZZLE.num} — the daily numbers round from Mind Loft. Six numbers, target ${TARGET}.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Make the target out of the six numbers."
      chips={[
        { label: 'Spot on = 10', tone: 'good' },
        { label: 'Within five = 7', tone: 'good' },
        { label: 'Within ten = 5', tone: 'warn' },
        { label: 'Anything else = 1', tone: 'grey' },
      ]}
      steps={[
        <><b>Tap a number</b>, <b>tap an operation</b>, then <b>tap a second number</b>. The answer replaces both and becomes a number you can use again.</>,
        <>Every value has to be a <b>positive whole number</b>, so 3 minus 7 is out and 7 divided by 2 is out.</>,
        <>You do not have to use all six. On this board an exact answer needs <b>{need} of the six</b>.</>,
        <><b>Undo</b> and <b>start over</b> cost nothing.</>,
      ]}
      knack="You are scored on the closest value you ever make, not on how many steps you take, so there is nothing to gain by hoarding take-backs."
      footer={<>Only walking away scores nothing. One free <b>hint</b>, on your first ever play, names a step that still works. Sundays are a harder set.</>}
    />
  );

  const statusLine = !playing
    ? (won ? `${TARGET} on the nose, in ${used} step${used === 1 ? '' : 's'}.`
      : g.status === 'done' ? `Locked in ${bestDiff} off.`
        : 'You walked away from it.')
    : sel == null ? 'Tap a number to begin a step.'
      : !op ? 'Now pick an operation.'
        : 'Now tap the second number.';

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="crunch" name="Crunch" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Crunch scores 10 for an exact hit and a graded score for the nearest miss, so
          a run that got close is a genuine partial and the cap goes amber. */}
      {LOFT && (
        <Cap gameKey="crunch" quizId={PUZZLE.quizId}
          name="Crunch"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : (finalScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · Needs ${need}` : null}
          figures={playing ? [
            { v: used, k: 'steps' },
            { v: elapsed, k: 'time' },
            { v: bestDiff == null ? '—' : (bestDiff === 0 ? 'exact' : `${bestDiff} off`), k: 'closest' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: used, k: 'steps' },
            { v: bestDiff == null ? '—' : (bestDiff === 0 ? 'exact' : `${bestDiff} off`), k: 'closest' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="cr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.cr-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .cr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .cr-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .cr-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .cr-rack{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:76px;touch-action:manipulation;}
          .cr-tile{width:76px;height:76px;border-radius:10px;border:2px solid ${STAGE ? 'var(--stg-line2)' : TILE_EDGE};background:${STAGE ? 'var(--stg-surf2)' : TILE_FACE};color:${INK};font-family:${MONO};font-weight:500;font-size:27px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:inset 0 -4px 0 rgba(28,30,36,0.13), 0 2px 0 rgba(28,30,36,0.22);transition:transform .12s ease;}
          .cr-tile:active{transform:translateY(1px);}
          .cr-tile.on{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);outline:3px solid var(--stg-acc, ${COLORS.accent});outline-offset:2px;}
          .cr-op{width:56px;height:52px;border-radius:9px;border:2px solid var(--blue-deep);background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};font-family:${MONO};font-size:22px;font-weight:500;cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .cr-op.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};}
          .cr-op:disabled{opacity:0.35;cursor:default;}
          .cr-rack.shake{animation:crshake .34s ease;}
          @keyframes crshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
          @media(max-width:420px){.cr-tile{width:62px;height:62px;font-size:23px;}.cr-op{width:50px;height:48px;}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="crunch" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Needs {need}</span>}
          blocks={'CRUNCH'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 5 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Crunch is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Six numbers, one target. Combine two at a time with plus, minus, times or divide, keeping every value a positive whole number. Undo and start over are free.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="cr-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ whiteSpace: 'nowrap' }}>steps <b style={{ color: INK, fontWeight: 500 }}>{used}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>closest <b style={{ color: bestDiff === 0 ? COLORS.green : `var(--stg-acc-ink, ${COLORS.accent})`, fontWeight: 500 }}>{bestDiff == null ? '—' : bestDiff === 0 ? 'exact' : `${bestDiff} off`}</b></span>
          </div>
          )}

          {/* the target board */}
          <div style={{ background: SLATE, borderRadius: 10, padding: '12px 14px 14px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.62)', fontWeight: 500 }}>Target</div>
            <div style={{ fontFamily: MONO, fontSize: 52, lineHeight: 1.05, fontWeight: 500, color: T.white, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{TARGET}</div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2 }}>needs {need} of the six</div>
          </div>

          {/* the tiles on the table */}
          <div key={shake} className={`cr-rack${shake ? ' shake' : ''}`}>
            {tiles.map((t) => (
              <button key={t.id} type="button" className={`cr-tile${sel === t.id ? ' on' : ''}`} onClick={() => onTile(t)}
                disabled={!playing} aria-label={`number ${t.v}`}
                style={{ background: STAGE ? (sel === t.id ? 'var(--stg-acc)' : t.made ? 'var(--stg-panel)' : 'var(--stg-surf2)')
                  : (sel === t.id ? COLORS.accentSoft : t.made ? TILE_MADE : TILE_FACE),
                  color: STAGE && sel === t.id ? 'var(--stg-onramp)' : undefined, opacity: playing ? 1 : 0.75, cursor: playing ? 'pointer' : 'default' }}>
                {t.v}
              </button>
            ))}
            {tiles.length === 1 && (
              <div style={{ width: '100%', textAlign: 'center', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, marginTop: 4 }}>
                That is every number used up. Undo or start over if you want another run at it.
              </div>
            )}
          </div>

          {/* the operations */}
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            {OPS.map((o) => (
              <button key={o} type="button" className={`cr-op${op === o ? ' on' : ''}`} onClick={() => onOp(o)}
                disabled={!playing} aria-label={`operation ${o}`}>{OPL[o]}</button>
            ))}
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>{statusLine}</span>
            {selTile && op && playing && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: INK, fontWeight: 500 }}>{selTile.v} {OPL[op]} ?</span>
            )}
          </div>

          {/* the steps taken so far */}
          {used > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(28,30,36,0.16)', paddingTop: 10 }}>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED, fontWeight: 500, marginBottom: 6 }}>Your working</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {g.steps.map((st, i) => (
                  <div key={i} style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 500, color: st[3] === TARGET ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums' }}>
                    {st[0]} {OPL[st[1]]} {st[2]} = {st[3]}
                    {st[3] !== TARGET && (
                      <span style={{ color: FADED, fontSize: 11.5 }}> &nbsp;{Math.abs(st[3] - TARGET)} off</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className="cr-tool" onClick={undo} disabled={!used} title="Take back the last step and put its two numbers back" style={{ opacity: used ? 1 : 0.4, cursor: used ? 'pointer' : 'default' }}>
                <Undo2 size={14} /> Undo
              </button>
              <button className="cr-tool" onClick={startOver} disabled={!used} title="Clear every step and go back to the six you were dealt" style={{ opacity: used ? 1 : 0.4, cursor: used ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Start over
              </button>
              {hintOk && !g.hintUsed && (
                <button className="cr-tool" onClick={useHint} title="Name a step that still reaches the target (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(180,83,9,0.5)', color: '#8a4008' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

          {playing && bestDiff != null && bestDiff > 0 && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="cr-tool" onClick={() => { if (armLock) { if (Date.now() - armLock < ARM_MIN_MS) return; setArmLock(false); lockIn(); } else { setArmLock(Date.now()); } }}
                style={{ background: armLock ? COLORS.ink : `var(--stg-surf, ${T.white})`, color: armLock ? T.white : COLORS.ink, borderColor: COLORS.ink }}>
                {armLock
                  ? `Tap again to end the board at ${scoreFor(bestDiff)}/10`
                  : `Lock in my closest, ${bestDiff} off · ${scoreFor(bestDiff)}/10`}
              </button>
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
              Number, operation, number. Undo as often as you like.
            </span>
            <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Eye size={13} /> {armReveal ? 'Tap again — ends the board and scores nothing' : 'Give up'}
            </button>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                The target was <span style={{ color: ACC_INK }}>{TARGET}</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {won
                  ? `Exact, using ${used} step${used === 1 ? '' : 's'}. An exact answer needed ${need} of the six numbers.`
                  : g.status === 'done'
                    ? `Your closest was ${bestDiff} off, worth ${finalScore} out of 10.`
                    : `It was reachable. An exact answer needed ${need} of the six.`}
              </div>
              {Array.isArray(PUZZLE.example) && PUZZLE.example.length > 0 && (
                <div style={{ marginTop: 12, background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED, fontWeight: 500, marginBottom: 5 }}>One way there</div>
                  {PUZZLE.example.map((st, i) => (
                    <div key={i} style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 500, color: INK, fontVariantNumeric: 'tabular-nums' }}>{st[0]} {OPL[st[1]]} {st[2]} = {st[3]}</div>
                  ))}
                  {PUZZLE.solutions > 1 && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: FADED, marginTop: 6 }}>One of {PUZZLE.solutions} exact routes to it.</div>
                  )}
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, a harder set.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Crunch in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/crunch?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Crunch &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/crunch" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Crunch &rarr;</a>
                    {' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
              name="Crunch"
              catRank={catRank}
              outcome={won ? 'won' : (finalScore > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${used} steps \u00b7 ${bestDiff == null ? '—' : (bestDiff === 0 ? 'exact' : `${bestDiff} off`)} closest \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Crunch all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Steps"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/crunch?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Crunch', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/crunch?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="crunch" name="Crunch" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="crunch" name="Crunch" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="crunch" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="crunch" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Crunch to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.</p>
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
        <DailyEndCard modal self="crunch" won={won}
          headline={won ? <>Bang on.</> : g.status === 'done' ? <>Close enough to count.</> : <>You scored 0%</>}
          subline={won
            ? <>10/10 &middot; {TARGET} in {used} step{used === 1 ? '' : 's'} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : g.status === 'done'
              ? <>{finalScore}/10 &middot; {bestDiff} off {TARGET} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
              : <>0/10 &middot; the target was {TARGET}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
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
            <button className="cr-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Crunch</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Crunch is a free daily numbers round from Mind Loft. Six numbers, one target between 101 and 999, and four operations. Combine two numbers, the answer replaces both, and you go again. Every value along the way has to be a positive whole number, and you never have to use all six.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board is checked by an exhaustive solver before it ships, so the target is always reachable and the difficulty rating, the fewest numbers any exact answer needs, is a fact rather than a guess. Scoring is the scale people already know: spot on is ten, within five is seven, within ten is five. Undo and start over cost nothing, because the score is about where you land, not how you got there.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/rung" style={{ color: INK, fontWeight: 800 }}>Rung</a>, <a href="/four" style={{ color: INK, fontWeight: 800 }}>Four</a>, our daily Connect Four position, and <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, our daily chess endgame.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
