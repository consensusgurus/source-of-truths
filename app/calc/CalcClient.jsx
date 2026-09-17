'use client';

// Calc — walk the calculator.
//
// The board is a checkerboard of buttons: (row + col) EVEN is a number, ODD is
// an operator. You walk from the top-left button to the bottom-right one, a
// touching button at a time, and because of the checkerboard the walk always
// hands you a number, then an operator, then a number. That walk IS a sum, it
// reads LEFT TO RIGHT like a calculator, and it has to come out at the target.
//
// Three rules do all the work. No button twice inside one route, which is what
// stops you sitting on a +1 loop. A division that would not come out whole is
// not a legal step at all, which is what keeps every running total an integer
// with no fractions ever shown. And the route must END on the bottom-right
// button, which is what makes the last operator before it the interesting one.
//
// SCORING. A target is worth 10. A weekday board sets one, so it scores 10 or 0
// out of 10; the Sunday Edition sets THREE on the one board, easiest first, and
// scores out of 30. Arriving at END on the wrong total costs a `try` and
// nothing else, and tries are the `miss` column on the daily board. Because a
// weekday is all or nothing, the losers would otherwise tie at zero, so a run
// also posts `progress`: targets landed, then how close the best wrong arrival
// got. That orders the day by how far people actually got rather than by who
// gave up quickest.
//
// Every board is machine-checked before it ships (scripts/verify-calc.mjs
// re-derives the route count and the shortest route for every target with its
// own solver), so a route to the target always exists. Same daily plumbing as
// every other board: banked puzzles gated by Eastern date on the server
// (app/calc/page.js), per-puzzle localStorage saves, /calc?p=N archive pinning,
// streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone, CornerUpLeft } from 'lucide-react';
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

// Calc identity is ROSE. The Numbers row is crowded and every neighbouring hue
// was already spoken for: Suds orange, Quilt magenta, Carve violet, Cages
// purple, Cipher and Sando teal, Tally and Pricer and Polka green, Crunch
// amber, Blitz olive, Sixes and Towers blue, Mercury brick. Rose is the one gap
// left, and it reads clear of Mercury's muted red at tile size. Every colour
// the board uses derives from COLORS.accent rather than a second literal hex.
const ACCENT = '#be123c';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#fff1f4',
  accentTint: '#ffdde5',
  accentPick: '#ffc6d3',
  accentDeep: '#8c0d2d',
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_calc_help_seen';
const STATS_KEY = 'sot_calc_stats';
const PER_TARGET = 10;       // a landed target is worth this much
const GRID_MAX = 460;        // px — comfortable for a 7x7 of round buttons

// ─── board geometry, all derived from the puzzle's own n ────────────────────
const isNumCell = (n, i) => ((((i / n) | 0) + (i % n)) % 2) === 0;
function neighboursOf(n, i) {
  const r = (i / n) | 0, c = i % n, a = [];
  if (r > 0) a.push(i - n);
  if (r < n - 1) a.push(i + n);
  if (c > 0) a.push(i - 1);
  if (c < n - 1) a.push(i + 1);
  return a;
}
// Left to right, like a calculator. Returns null when the route is illegal,
// which is only ever an inexact division or a total that has run away.
function evalRoute(n, cells, route) {
  if (!route || !route.length) return null;
  let acc = +cells[route[0]], op = null;
  for (let k = 1; k < route.length; k++) {
    const i = route[k];
    if (isNumCell(n, i)) {
      const v = +cells[i];
      if (op === '+') acc += v;
      else if (op === '-') acc -= v;
      else if (op === '*') acc *= v;
      else if (op === '/') { if (v === 0 || acc % v !== 0) return null; acc /= v; }
      op = null;
      if (!Number.isSafeInteger(acc) || Math.abs(acc) > 1e7) return null;
    } else op = cells[i];
  }
  return acc;
}
const glyphOf = (v) => (v === '*' ? '×' : v === '/' ? '÷' : v);

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
  return { played, perfect, cur, max, rec };
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
    const tot = PER_TARGET * p.targets.length;
    const sc = Math.max(0, Math.min(tot, Math.round(((m.scorePct || 0) / 100) * tot)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: tot, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState(nTargets) {
  return {
    v: 1,
    routes: Array(nTargets).fill(null), // the landed route per target, null until it lands
    shown: null,                        // routes drawn after Reveal. SEPARATE from
                                        // `routes` on purpose: reveal must never
                                        // inflate what the player actually landed
    path: [0],                          // the route being walked right now
    slot: 0,                            // which target is being walked at
    tries: 0,                           // arrivals at END on the wrong total
    near: null,                         // the closest a wrong arrival has come
    hintUsed: false,
    status: 'playing',                  // playing | won | revealed
    t0: null,                           // stays null until the first step: opening
    tEnd: null,                         // a game is not starting one (see CLAUDE.md)
  };
}

// Light haptics on supported devices (no-op on desktop / unsupported browsers).
const HAPT = { ok: [7], land: [10, 30, 16], wrong: [22], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function CalcClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.n;
  const CELLS = N * N;
  const END = CELLS - 1;
  const TARGETS = PUZZLE.targets;
  const TOTAL = PER_TARGET * TARGETS.length;
  const STORE_KEY = `sot_calc_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState(TARGETS.length));
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('calc', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('calc'); }, [g.hintUsed]);
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

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('calc');
  const STAGE = isStage('calc', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('calc');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('calc'), '--stg-acc-lt': gameColorLight('calc'), '--stg-onramp-lt': gameOnrampLight('calc'), '--stg-acc-ink-lt': gameAccentInkLight('calc') };
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
  const iq = useIqStanding({ game: 'calc', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'calc', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'calc', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'calc', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'calc', active: LOFT && !playing });

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
        if (saved && saved.v === 1 && Array.isArray(saved.routes) && saved.routes.length === TARGETS.length && Array.isArray(saved.path)) {
          setG({ ...freshState(TARGETS.length), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_calc_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_calc_day');
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

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const landed = useMemo(() => g.routes.filter(Boolean).length, [g.routes]);
  const score = landed * PER_TARGET;
  const path = g.path;
  const head = path[path.length - 1];
  const total = evalRoute(N, PUZZLE.cells, path);
  const atNumber = isNumCell(N, head);
  const atEnd = head === END;

  const canStep = useCallback((i) => {
    if (path.includes(i)) return false;
    if (!neighboursOf(N, head).includes(i)) return false;
    return evalRoute(N, PUZZLE.cells, path.concat([i])) !== null;
  }, [path, head, N, PUZZLE]);
  const reachable = useMemo(() => {
    const s = new Set();
    for (const j of neighboursOf(N, head)) if (canStep(j)) s.add(j);
    return s;
  }, [head, canStep, N]);

  // ---- result posting ----
  const REC_KEY = `sot_calc_rec_${PUZZLE.num}`;
  // `progress` orders the people who did NOT finish, deepest run first, so a
  // weekday's losers are not one flat tie at zero. Targets landed dominates;
  // within that, how close the best wrong arrival came.
  function progressOf(g2) {
    const near = g2.near == null ? 1000 : Math.min(1000, Math.abs(g2.near));
    return g2.routes.filter(Boolean).length * 1000 + (1000 - near);
  }
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually walks somewhere. Opening the
    // puzzle and dismissing the start gate does not log a 0-score attempt.
    const acted = g.path.length > 1 || g.routes.some(Boolean) || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: g.routes.filter(Boolean).length * PER_TARGET, total: TOTAL, correct: g.routes.filter(Boolean).length, guessesUsed: g.tries, progress: progressOf(g), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const hit = g2.routes.filter(Boolean).length;
    const sc = hit * PER_TARGET;
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.tries, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: hit, guessesUsed: g2.tries, progress: progressOf(g2), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  const firstOpenSlot = (routes, from) => {
    for (let k = 0; k < routes.length; k++) { const i = (from + 1 + k) % routes.length; if (!routes[i]) return i; }
    return -1;
  };

  // ---- walking the board ----
  function tap(i) {
    if (!playing) return;
    // tapping the button you are on, or the one behind you, steps back
    if (path.length > 1 && (i === head || i === path[path.length - 2])) {
      setG((cur) => ({ ...cur, path: cur.path.slice(0, -1) }));
      return;
    }
    if (!canStep(i)) {
      // The only two ways a touching button is refused: it is already in this
      // route, or stepping onto it would divide into something that is not a
      // whole number. Anything not touching is simply out of reach and silent.
      if (!neighboursOf(N, head).includes(i)) return;
      if (path.includes(i)) say('That button is already in this route. Each one is spent once you leave it.');
      else say(`${total} ÷ ${PUZZLE.cells[i]} would not come out whole, so that step is not legal.`);
      return;
    }
    const next = path.concat([i]);
    const g2 = { ...g, path: next };
    if (!g2.t0) g2.t0 = Date.now();
    if (i !== END) { vibrate(HAPT.ok); setG(g2); return; }

    // arrived at END: either the target lands, or it costs a try
    const val = evalRoute(N, PUZZLE.cells, next);
    const want = TARGETS[g.slot].target;
    if (val === want) {
      const routes = g2.routes.slice();
      routes[g.slot] = next;
      const nextSlot = firstOpenSlot(routes, g.slot);
      const done = nextSlot < 0;
      const g3 = { ...g2, routes, path: [0], slot: done ? g.slot : nextSlot };
      if (done) {
        g3.status = 'won';
        g3.tEnd = Date.now();
        vibrate(HAPT.win);
        postResult(g3);
        setG(g3);
        setJustWon(true);
        return;
      }
      vibrate(HAPT.land);
      setG(g3);
      say(`Target ${want} landed. Next up: ${TARGETS[nextSlot].target}.`);
      return;
    }
    const diff = Math.abs(val - want);
    const g4 = { ...g2, tries: g2.tries + 1, near: g2.near == null ? diff : Math.min(g2.near, diff) };
    vibrate(HAPT.wrong);
    setG(g4);
    say(`That route ends on ${val}, not ${want}. Step back and try another line.`);
  }

  function stepBack() {
    if (!playing || path.length < 2) return;
    setG((cur) => ({ ...cur, path: cur.path.slice(0, -1) }));
  }
  function clearRoute() {
    if (!playing || path.length < 2) return;
    setG((cur) => ({ ...cur, path: [0] }));
  }
  function pickSlot(k) {
    if (!playing || g.routes[k]) return;
    setG((cur) => ({ ...cur, slot: k, path: [0] }));
  }

  // One free hint: walk the opening of a real route to the current target. It
  // hands over the first three buttons, which is the number and operator that
  // start the sum plus the number they act on, so it points at a line without
  // handing over the answer.
  function useHint() {
    if (!hintOk || !playing || g.hintUsed) return;
    const want = TARGETS[g.slot];
    const opening = want.path.slice(0, Math.min(3, want.path.length - 1));
    const g2 = { ...g, path: opening, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    vibrate(HAPT.ok);
    setG(g2);
    say('Hint: a route to this target opens like this.');
  }

  function revealEnd() {
    // The revealed routes go in `shown`, never in `routes`, so the score, the
    // end card and the share squares all still read what the player landed.
    const shown = g.routes.map((r, k) => r || TARGETS[k].path.slice());
    const g2 = { ...g, shown, path: [0], status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(TARGETS.length));
    setJustWon(false);
    setEndClosed(false);
  }

  // desktop keyboard: arrows walk, Backspace steps back, Escape clears the route
  const onKey = useCallback((e) => {
    if (!playing) return;
    const k = e.key;
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); stepBack(); return; }
    if (k === 'Escape') { clearRoute(); return; }
    const r = (head / N) | 0, c = head % N;
    let want = -1;
    if (k === 'ArrowUp' && r > 0) want = head - N;
    else if (k === 'ArrowDown' && r < N - 1) want = head + N;
    else if (k === 'ArrowLeft' && c > 0) want = head - 1;
    else if (k === 'ArrowRight' && c < N - 1) want = head + 1;
    if (want >= 0) { e.preventDefault(); tap(want); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, head, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    // One square per target, landed or not. Nothing about the route leaks,
    // which is the whole point: the board is the same for everybody.
    const squares = TARGETS.map((_, k) => (g.routes[k] ? '\u{1F7E5}' : '⬜')).join('');
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const tryBit = g.tries ? ` · ${g.tries} ${g.tries === 1 ? 'try' : 'tries'}` : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Calc #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${elapsed}${tryBit}${hintBit}${streakBit}`
      : `Calc #${PUZZLE.num} · ${landed}/${TARGETS.length}${tryBit}`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/calc${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Calc #${PUZZLE.num} — walk the calculator, from Mind Loft.\n${shareUrl()}`
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

  // ── the running tape ──
  const tapeText = path.length === 1
    ? 'Tap a button touching START.'
    : path.map((i) => glyphOf(PUZZLE.cells[i])).join(' ') + (atNumber ? ' =' : '');

  // ── the route drawn under the buttons ──
  const boardRef = useRef(null);
  const [link, setLink] = useState(null);   // { pts, w, h } in board pixels
  // While playing this is the live route; once the game is over it is the route
  // that landed each target, or the revealed one after Reveal.
  const shownRoute = playing
    ? path
    : ((g.shown && g.shown[g.slot]) || g.routes[g.slot] || path);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return undefined;
    const measure = () => {
      const kids = el.children;
      if (!kids || kids.length < CELLS || shownRoute.length < 2) { setLink(null); return; }
      const bb = el.getBoundingClientRect();
      if (!bb.width) { setLink(null); return; }
      setLink({
        w: bb.width, h: bb.height,
        pts: shownRoute.map((i) => {
          const r = kids[i].getBoundingClientRect();
          return `${(r.left - bb.left + r.width / 2).toFixed(1)},${(r.top - bb.top + r.height / 2).toFixed(1)}`;
        }).join(' '),
      });
    };
    measure();
    // The board is a fluid grid, so the cell centres move with the viewport.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { window.removeEventListener('resize', measure); if (ro) ro.disconnect(); };
  }, [shownRoute, CELLS, hydrated]);

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Walk from START to END one button at a time. The buttons alternate, so the walk hands you a number, then an operator, then a number: the route you walk is a sum, and it has to come out at the target."
      steps={[
        <>Tap any button that <b>touches</b> the one you are on, up, down, left or right. Tap the button you are on, or the one behind you, to <b>step back</b>. Arrow keys work too.</>,
        <>The sum reads <b>left to right like a calculator</b>, so 7 + 8 &times; 2 is 30, not 23. The running total sits on the tape above the board.</>,
        <><b>No button twice</b> inside one route, and a division that would not come out whole is not a legal step, so those neighbours grey out.</>,
        <>Land on <b>END</b> holding exactly the target. Arriving on the wrong total costs a try and nothing else, so back up and take another line.</>,
      ]}
      knack="Work backwards as well as forwards. The last operator before END decides everything: ask what number would have to arrive there, and you have turned one long search into a short one."
      footer="Every board is checked before it ships, so a route to the target always exists. A landed target is worth 10, and the daily leaderboard breaks ties on tries, then the clock. One free hint, on your first ever play, walks the opening of a route for you. The Sunday Edition sets three targets on the one board, easiest first."
    />
  );

  const capFigures = [
    { v: elapsed, k: 'time' },
    TARGETS.length > 1 ? { v: `${landed}/${TARGETS.length}`, k: 'targets' } : { v: String(g.tries), k: g.tries === 1 ? 'try' : 'tries' },
  ];

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="calc" name="Calc" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="calc" quizId={PUZZLE.quizId}
          name="Calc"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : (landed ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 3 targets' : null}
          figures={capFigures}
        />
      )}
      <div className="cl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.cl-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .cl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accent};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accent};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .cl-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .cl-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .cl-key{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-family:${MONO};font-weight:500;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;padding:0;min-width:0;border-radius:50%;transition:transform .09s ease,background .12s ease,color .12s ease;}
          .cl-num{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent);color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border:1.5px solid var(--stg-surf2, ${COLORS.accentTint});}
          .cl-op{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${FADED};border:1.5px dashed rgba(28,30,36,0.22);}
          .cl-key.on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border:1.5px solid var(--stg-acc, ${COLORS.accent});}
          .cl-key.head{background:var(--stg-acc, ${COLORS.accentDeep});border-color:var(--stg-acc, ${COLORS.accentDeep});box-shadow:0 0 0 4px var(--stg-surf2, ${COLORS.accentTint});}
          .cl-key.reach{border:1.5px solid var(--stg-acc, ${COLORS.accent});}
          .cl-key.reach:hover{transform:scale(1.07);}
          .cl-key.blocked{opacity:.3;cursor:default;}
          .cl-key.term{border-radius:14px;}
          .cl-key.solved{background:${COLORS.green};border-color:${COLORS.green};color:var(--white);}
          .cl-flag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-family:${MONO};font-size:8px;letter-spacing:.1em;text-transform:uppercase;background:${COLORS.ink};color:var(--white);padding:1px 5px;border-radius:99px;font-weight:500;pointer-events:none;}
          .cl-goal{border: 2px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:11px;padding:6px 16px 8px;text-align:center;min-width:104px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};cursor:pointer;font-family:${SANS};}
          .cl-goal.act{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px var(--stg-surf2, ${COLORS.accentTint});}
          .cl-goal.got{border-color:${COLORS.green};background:${STAGE ? 'var(--stg-surf2)' : '#f2fbf6'};cursor:default;}
          .cl-goal .k{font-family:${MONO};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};}
          .cl-goal .v{font-size:34px;font-weight:800;line-height:1.1;letter-spacing:-.03em;color:${INK};font-variant-numeric:tabular-nums;}
          .cl-goal.got .v{color:${COLORS.green};}
          .cl-goal.solo{border:none;padding:0;min-width:0;background:none;}
          .cl-goal.solo .v{font-size:50px;}
        ` }} />

        <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="calc"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 3 targets</span>}
          blocks={'CALC'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* Start tile — sits where the board goes until the player presses
            Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Calc is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Walk from START to END one touching button at a time. The route you walk is a sum, it reads left to right like a calculator, and it has to come out at {TARGETS.length > 1 ? 'each target' : `${TARGETS[0].target}`}.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="cl-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, borderColor: STAGE ? STAGE_C : T.cta, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>tries <b style={{ color: INK, fontWeight: 500 }}>{g.tries}</b></span>
          </div>
          )}

          {/* the target, or Sunday's three */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 10 }}>
            {TARGETS.map((t, k) => {
              const got = !!g.routes[k];
              const solo = TARGETS.length === 1;
              return (
                <div key={k} className={`cl-goal${solo ? ' solo' : ''}${got ? ' got' : (k === g.slot ? ' act' : '')}`} onClick={() => pickSlot(k)}>
                  <div className="k">{solo ? 'Target' : `Target ${k + 1}${got ? ' ✓' : ''}`}</div>
                  <div className="v">{t.target}</div>
                </div>
              );
            })}
          </div>

          {/* the running tape */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 9, padding: '9px 12px', marginBottom: 12, minHeight: 44, overflowX: 'auto' }}>
            <span style={{ fontFamily: MONO, fontSize: 13.5, color: FADED, whiteSpace: 'nowrap', flex: 1 }}>{tapeText}</span>
            <b style={{ fontFamily: SANS, fontWeight: 800, fontSize: 21, fontVariantNumeric: 'tabular-nums', flex: 'none', paddingLeft: 10, borderLeft: '2px solid rgba(28,30,36,0.14)', color: atEnd ? (total === TARGETS[g.slot].target ? COLORS.green : `var(--stg-bad, ${COLORS.rust})`) : `var(--stg-ink, ${COLORS.ink})` }}>
              {atNumber ? total : '–'}
            </b>
          </div>

          {/* the board */}
          <div style={{ maxWidth: GRID_MAX, margin: '0 auto', position: 'relative' }}>
            {link && (
              <svg width={link.w} height={link.h} viewBox={`0 0 ${link.w} ${link.h}`} style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, pointerEvents: 'none' }} aria-hidden="true">
                <polyline points={link.pts} fill="none" stroke={COLORS.accent} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
              </svg>
            )}
            <div ref={boardRef} style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gap: N > 6 ? 6 : 8, position: 'relative', zIndex: 2 }}>
              {Array.from({ length: CELLS }).map((_, idx) => {
                const v = PUZZLE.cells[idx];
                const num = isNumCell(N, idx);
                const on = shownRoute.includes(idx);
                const isHead = playing && idx === head;
                const term = idx === 0 || idx === END;
                const blocked = playing && !on && neighboursOf(N, head).includes(idx) && !reachable.has(idx);
                const cls = ['cl-key', num ? 'cl-num' : 'cl-op', term ? 'term' : '', on ? 'on' : '', isHead ? 'head' : '',
                  playing && reachable.has(idx) ? 'reach' : '', blocked ? 'blocked' : '',
                  !playing && won && term ? 'solved' : ''].filter(Boolean).join(' ');
                return (
                  <button key={idx} type="button" className={cls} onClick={() => tap(idx)} aria-label={num ? `number ${v}` : `operator ${v}`}>
                    <span style={{ fontSize: N > 6 ? 'clamp(13px, 4.2vw, 20px)' : 'clamp(15px, 4.8vw, 23px)' }}>{glyphOf(v)}</span>
                    {term && <span className="cl-flag">{idx === 0 ? 'Start' : 'End'}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* tools */}
          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className="cl-tool" onClick={stepBack} disabled={path.length < 2} title="Step back one button (Backspace)" style={path.length < 2 ? { opacity: 0.4, cursor: 'default' } : undefined}>
                <CornerUpLeft size={14} /> Step back
              </button>
              <button className="cl-tool" onClick={clearRoute} disabled={path.length < 2} title="Back to START (Esc)" style={path.length < 2 ? { opacity: 0.4, cursor: 'default' } : undefined}>
                <RotateCcw size={14} /> Back to start
              </button>
              {hintOk && !g.hintUsed && (
                <button className="cl-tool" onClick={useHint} title="Walk the opening of a route (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: `var(--stg-surf2, ${COLORS.accentTint})`, color: ACC_DEEP_INK }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
              {atEnd
                ? `This route ends on ${total}. Step back to try another line.`
                : path.length === 1
                  ? 'Tap a button touching START to set off.'
                  : `Holding ${atNumber ? total : `${evalRoute(N, PUZZLE.cells, path.slice(0, -1))} ${glyphOf(PUZZLE.cells[head])}`}. ${reachable.size} way${reachable.size === 1 ? '' : 's'} on.`}
            </span>
            {identity && (path.length > 1 || landed > 0) && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows a route' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              {TARGETS.length > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '12px 0 0' }}>
                  {TARGETS.map((t, k) => (
                    <button key={k} type="button" onClick={() => setG((cur) => ({ ...cur, slot: k }))}
                      style={{ fontFamily: SANS, fontWeight: 800, fontSize: 12, borderRadius: 8, padding: '6px 11px', cursor: 'pointer', border: `1.5px solid var(--stg-acc, ${k === g.slot ? COLORS.accent : 'rgba(28,30,36,0.2)'})`, background: k === g.slot ? `color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent)` : T.white, color: g.routes[k] ? COLORS.green : COLORS.faded }}>
                      {t.target} {g.routes[k] ? '✓' : ''}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, margin: '10px 0 0' }}>
                {TARGETS[g.slot].routes === 1
                  ? <>Exactly one route on this board reaches {TARGETS[g.slot].target}, out of {PUZZLE.boardRoutes.toLocaleString()} legal routes.</>
                  : <>{TARGETS[g.slot].routes} routes reach {TARGETS[g.slot].target}, out of {PUZZLE.boardRoutes.toLocaleString()} legal routes. The shortest uses {TARGETS[g.slot].minLen} buttons.</>}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; three targets on the one board.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Calc in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/calc?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Calc &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/calc" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Calc &rarr;</a>
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
            name="Calc"
            catRank={catRank}
            outcome={won ? 'won' : (landed ? 'part' : 'lost')}
            title={won ? (TARGETS.length > 1 ? 'All three landed' : 'Target hit') : (landed ? `${landed} of ${TARGETS.length}` : 'Not solved')}
            detail={`${score}/${TOTAL} · ${elapsed}${g.tries ? ` · ${g.tries} ${g.tries === 1 ? 'try' : 'tries'}` : ''}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Calc all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            missLabel="Tries"
            archive={puzzles
              .filter((p) => p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/calc?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the route', sub: 'The line you walked', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show a route that works', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Calc', sub: `No. ${prevPuzzle.num}, yesterday's board`, href: `/calc?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This board again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        {/* end of the play stage; everything below is the light tail */}
        </div>

        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="calc" name="Calc" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="calc" name="Calc" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="calc"
            maxWidth={680}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="calc" quizId={PUZZLE.quizId} maxWidth={680} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Calc to your Home Screen</div>
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
          self="calc"
          won={won}
          headline={won ? <>Target hit!</> : <>Board revealed</>}
          subline={won
            ? <>{elapsed}{g.tries ? <> &middot; {g.tries} {g.tries === 1 ? 'try' : 'tries'}</> : null}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>a route that works is drawn above</>}
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
            <button className="cl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white, borderColor: COLORS.ink }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Calc — crawlable prose, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 680, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Calc</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Calc is a free daily number puzzle from Mind Loft. The board is a grid of calculator buttons that alternate number, operator, number. You walk from the top-left button to the bottom-right one, a touching button at a time, and the route you walk is a sum: it reads left to right the way a calculator does, so 7 + 8 &times; 2 comes out at 30 rather than 23. Land on the last button holding exactly the target and the day is yours.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Three rules do the work. No button can be used twice inside one route. A division that would not come out whole is not a legal step, so nothing is ever a fraction. And the route has to finish on the bottom-right button, which is what makes the last operator before it the one worth thinking about. Arriving on the wrong total costs a try and nothing else, so you can back up and take another line as often as you like.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Boards run six across early in the week and seven from Thursday, and every one is checked before it ships, so a route to the target always exists. Sundays are a harder Edition with three targets on the one board. A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. More number puzzles: <a href="/crunch" style={{ color: INK, fontWeight: 800 }}>Crunch</a>, six numbers into one target, and <a href="/cipher" style={{ color: INK, fontWeight: 800 }}>Cipher</a>, where every letter is a digit.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
