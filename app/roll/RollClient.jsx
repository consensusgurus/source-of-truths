'use client';

// Roll: the daily die-rolling puzzle, Topple's sibling (owner, 2026-10-20). A
// die sits on a floor of tiles; every move rolls it over one edge. Squares
// numbered 1 to N must be LIT IN ORDER, and a square lights when the die lands
// on it with that number on top. A NUMBERED SQUARE IS BLOCKED (owner ruling,
// 2026-10-20) unless it is the next one and the roll would land its number on
// top: the roll is refused and costs nothing, and so is a roll off the floor.
// Orange CRACKED squares crumble once the die rolls off them. No hint (owner,
// 2026-10-20).
//
// Scored like Topple and Parker (lib/par.js): PERFECT is the banked exact
// fewest rolls, found by breadth-first search and re-proved by an independent
// solver (scripts/verify-roll.mjs); it scores ten, PAR sits a cushion above it
// and scores eight, floor one. EVERY ROLL COUNTS: Undo takes a roll back and
// Restart sends the die home, but neither refunds the rolls already made, so
// trying lines by hand is never free. The clock keeps running too.
//
// The rules are lib/roll-engine.js, shared with the generator; the board
// (canvas, roll animation, pad, swipe) is ./RollBoard.jsx. Everything else is
// Topple's daily plumbing: banked boards gated by Eastern date on the server,
// per-puzzle localStorage saves, /roll?p=N archive pinning, streaks and stats,
// and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone } from 'lucide-react';
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
import { parFor, stepFor, scoreFor } from '@/lib/par';
import DailyMasthead from '../DailyMasthead';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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
import { parse, step, replay, rollsOf } from '@/lib/roll-engine';
import RollBoard from './RollBoard';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { endEfficiency, FAIL } from '@/lib/end-verdict';
import { scoreText } from '@/lib/daily-games';
import HelpSheet from '../HelpSheet';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#166534',        // Roll identity, a Logic green (legacy Loft surfaces only)
  accentSoft: '#dcfce7', green: T.successDeep,
};

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_roll_help_seen';
const STATS_KEY = 'sot_roll_stats';

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

const HAPT = { ok: [6], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// moves: the rolls in order, one letter each (U D L R), plus 'Z' for an undo
// and 'X' for a restart. The board is derived from them by replaying
// (lib/roll-engine.js replay). Refused rolls are never recorded.
const freshState = () => ({ v: 1, moves: [], restarts: 0, undos: 0, status: 'playing', t0: null, tEnd: null });
const DIR_WORD = { U: 'up', D: 'down', L: 'left', R: 'right' };

export default function RollClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_roll_${PUZZLE.num}`;
  const P = useMemo(() => parse(PUZZLE), [PUZZLE]);

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  // The roll on screen right now: { id, t0, from, dir, to, result }. Moves that
  // arrive while it plays wait in `queue`, so fast key presses are never lost
  // and never skip an animation.
  const [anim, setAnim] = useState(null);
  const animRef = useRef(null);
  const queue = useRef([]);
  const animSeq = useRef(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
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
  const LOFT = isLoft('roll');
  const STAGE = isStage('roll', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('roll');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('roll');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('roll'), '--stg-acc-lt': gameColorLight('roll'), '--stg-onramp-lt': gameOnrampLight('roll'), '--stg-acc-ink-lt': gameAccentInkLight('roll') };
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
  // 'X' (restart) and 'Z' (undo) in the move list are not rolls.
  const used = rollsOf(g.moves);
  const perfect = PUZZLE.perfect;
  const par = parFor(perfect);
  const step10 = stepFor(perfect);
  const finalScore = won ? scoreFor(used, perfect) : 0;

  // Where the die rests now: replay every roll from the start, undos and
  // restarts included.
  const rest = useMemo(() => replay(P, g.moves), [P, g.moves]);
  const die = rest.state;

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
        if (saved && saved.v === 1 && Array.isArray(saved.moves)) {
          let next = { ...freshState(), ...saved };
          // closed during the winning roll: the roll is saved, the status not
          // yet turned, and the result was already posted
          if (next.status === 'playing' && replay(P, next.moves).won) next = { ...next, status: 'won', tEnd: next.tEnd || Date.now() };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(false);
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
        if (done || g.t0) localStorage.setItem('sot_roll_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_roll_day');
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
  const iq = useIqStanding({ game: 'roll', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'roll', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'roll', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'roll', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'roll', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_roll_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!rollsOf(cur.moves) || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: rollsOf(cur.moves), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: rollsOf(g2.moves), won: g2.status === 'won' && rollsOf(g2.moves) === perfect })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: rollsOf(g2.moves), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  // One roll. A refused roll (off the floor, or a numbered square that is not
  // ready) tips the die and settles it back, says why, and is not recorded.
  // A real roll is recorded at once (so a closed tab mid-animation keeps it)
  // and the board plays it; a win is posted when it is recorded, and the board
  // turns over once the roll has landed.
  // A plain function, re-made every render so it always posts with the current
  // identity; the key handler and the animation queue reach it through a ref.
  function doMove(d) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || winPending.current) return;
    if (animRef.current) { if (queue.current.length < 2) queue.current.push(d); return; }
    const before = replay(P, cur.moves).state;
    const r = step(P, before, d);
    if (r.result === 'edge' || r.result === 'order' || r.result === 'face') {
      vibrate(HAPT.wrong);
      say(r.result === 'edge' ? `There is no floor ${DIR_WORD[d]} from here.`
        : r.result === 'order' ? `Square ${r.need} is shut until ${before.k} is lit.`
          : `That roll lands a ${r.top} on top, and square ${r.need} needs a ${r.need}.`);
      const a = { id: ++animSeq.current, t0: performance.now(), dir: d, result: 'bump' };
      animRef.current = a;
      setAnim(a);
      queue.current = [];
      return;
    }
    const g2 = { ...cur, moves: [...cur.moves, d] };
    if (!g2.t0) { g2.t0 = Date.now(); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }
    const a = { id: ++animSeq.current, t0: performance.now(), from: before, dir: d, to: r.state, result: r.result, crumble: r.crumble };
    animRef.current = a;
    setAnim(a);
    if (r.result === 'win') {
      const done = { ...g2, tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult({ ...done, status: 'won' }, scoreFor(rollsOf(done.moves), perfect));
      queue.current = [];
      winPending.current = true;
      commit(done);
      return;
    }
    vibrate(r.lit ? HAPT.win.slice(0, 2) : HAPT.ok);
    if (r.lit) say(r.state.k > P.N ? '' : `Square ${r.state.k - 1} lit. Now ${r.state.k}.`);
    commit(g2);
  }
  const doMoveRef = useRef(doMove);
  doMoveRef.current = doMove;
  const undoRef = useRef(null);

  const winPending = useRef(false);
  const onAnimEnd = useCallback((id) => {
    if (!animRef.current || animRef.current.id !== id) return;
    animRef.current = null;
    setAnim(null);
    if (winPending.current) {
      winPending.current = false;
      commit({ ...gRef.current, status: 'won' });
      return;
    }
    const nx = queue.current.shift();
    if (nx) setTimeout(() => doMoveRef.current(nx), 0);
  }, []);

  function onMove(d) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); }
    doMove(d);
  }

  // Keyboard: arrows or WASD, once the game is under way.
  useEffect(() => {
    if (!playing || preStart) return undefined;
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); undoRef.current(); return; }
      const m = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' }[e.key];
      if (!m) return;
      e.preventDefault();
      doMoveRef.current(m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, preStart]);

  function restart() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || animRef.current) return;
    if (!replay(P, cur.moves).depth) return;
    // Recorded as an 'X' in the move list: the replay sends the die home there
    // and mends the cracked squares, and rollsOf() does not count it, so the
    // rolls already made keep counting.
    commit({ ...cur, moves: [...cur.moves, 'X'], restarts: cur.restarts + 1 });
    say('Back to the start, cracked squares mended. Your rolls still count.');
  }

  function undo() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || animRef.current) return;
    if (!replay(P, cur.moves).depth) return;
    commit({ ...cur, moves: [...cur.moves, 'Z'], undos: (cur.undos || 0) + 1 });
  }

  undoRef.current = undo;

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    queue.current = [];
    postResult(g2, 0);
    commit(g2);
  }

  function giveUpTap() {
    if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); }
    else setArmReveal(Date.now());
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    queue.current = []; animRef.current = null; setAnim(null);
    commit(freshState());
    setEndClosed(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/roll${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const vs = used === perfect ? ', perfect' : '';
    const g5 = won ? Math.max(1, Math.round(scoreFor(used, perfect) / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Roll #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${used} rolls${vs} · ${elapsed}${streakBit}`
      : `Roll #${PUZZLE.num} · left squares unlit`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Roll #${PUZZLE.num}: the daily die-rolling puzzle from Mind Loft. Roll the die across the floor and light the numbered squares in order.\n${shareUrl()}`
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
      lead={<>Roll the <b>die</b> across the floor and light the <b>numbered squares</b> 1 to {P.N} <b>in order</b>. A square lights when the die lands on it with <b>that number on top</b>.</>}
      banner={<><b>Par is {par}</b> on this board, the number a clean solve lands on. <b>Perfect is {perfect}</b>, the fewest rolls that exist here, found by exhaustive search, and nobody gets under it.</>}
      steps={[
        <>Each roll <b>tips the die over one edge</b>, so the face that was on the side comes up on top. Use the <b>arrow keys</b>, a <b>swipe</b>, or the pad. You can see three faces: the top, the front and the right side.</>,
        <>A numbered square is <b>shut</b> until it is the <b>next one</b> and your roll would land <b>its number on top</b>. A shut square, or a roll off the floor, is refused and costs nothing. Once lit, a square is ordinary floor.</>,
        <><b>Cracked squares</b>, drawn with crack lines, they hold the die once and crumble as soon as it rolls off. A crumbled square is gone, so a careless line can wall you in.</>,
      ]}
      knack={<>Work out how the die must arrive before you go for a square: which face has to be on top, and which side it rolls in from. The pad marks the roll that would light the next square.</>}
      note={<><b>Undo</b> takes back a roll and <b>Restart</b> puts the die home with the cracked squares mended, but neither refunds a roll: every roll counts, and the clock keeps running.</>}
      footer={<>Any solve counts, and finishing always beats walking away. Your fastest solve of the day takes the board, with fewer rolls breaking a tie. Three numbers on Monday, more through the week, cracked squares from Thursday, and the Sunday Edition lights six on a bigger floor.</>}
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
      <DailyChrome slug="roll" name="Roll" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Roll grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="roll" quizId={PUZZLE.quizId}
          name="Roll"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: used, k: 'rolls' },
            { v: elapsed, k: 'time' },
            ...(STAGE ? [] : [{ v: perfect, k: 'perfect' }]),
          ] : [
            { v: won ? 'Solved' : 'Unfinished', k: 'result' },
            { v: used, k: 'rolls' },
            { v: perfect, k: 'perfect' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="pk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pk-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="roll" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
          blocks={'ROLL'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : null}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Light squares 1 to {P.N} in order, each with its own number on top. A square stays shut until it is next and the right number would land on it. Par is {par} rolls and perfect is {perfect}, the fewest that exist. Every roll counts.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pk-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Back' : 'How to play'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <RollBoard P={P} state={die} anim={anim} onAnimEnd={onAnimEnd} playing={playing}
            used={used} par={par} perfect={perfect}
            onMove={onMove} onUndo={undo} onRestart={restart} canUndo={!!rest.depth && !anim}
            armed={!!armReveal} onGiveUp={giveUpTap} themeKey={stageTheme} won={won}
            doneLine={won ? (used === perfect ? `All ${P.N} lit in ${used}. That is perfect.` : `All ${P.N} lit in ${used} rolls.`) : 'You left squares unlit.'} />
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                Perfect was <span style={{ color: ACC_INK }}>{perfect} rolls</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {won
                  ? used === perfect ? 'You matched perfect, which is as good as this board gets. Nobody can do it in fewer.'
                    : `You did it in ${used} rolls.`
                  : 'Perfect was found by exhaustive search, so it is real, not an estimate.'}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition: six squares on a bigger floor.</div>
              )}
              {!STAGE && isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              {!STAGE && (<p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Roll in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/roll?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Roll &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/roll" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Roll &rarr;</a>
                    {' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
                  </>
                )}
              </p>)}
            </div>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Roll"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={won ? used : null}
              title={endEfficiency(won, finalScore, used <= perfect)}
              detail={`${used} rolls \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Roll all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Moves"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/roll?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? scoreText('roll', stats.rec[p.num].s, stats.rec[p.num].t) : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Roll', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/roll?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="roll" name="Roll" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="roll" name="Roll" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="roll" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="roll" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Roll to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s board, every day.</li>
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
        <DailyEndCard modal self="roll" won={won}
          headline={won ? (used === perfect ? <>Perfect. Nothing wasted.</> : used < par ? <>Solved!</> : <>All lit.</>) : <>{FAIL}</>}
          subline={won
            ? <>{used} rolls &middot; {elapsed}</>
            : <>Perfect here was {perfect} rolls.</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
      )}

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="roll" name="Roll">
            {rulesBody}
          </HelpSheet>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Roll</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Roll is a free daily die rolling puzzle from Mind Loft. A die sits on a floor of tiles, and every move rolls it over one edge, so a side face comes up on top. Some squares carry a number, and the job is to light them in order: a square lights when the die lands on it with that number showing. A numbered square stays shut until it is the next one and your roll would land its number on top, and the cracked squares, drawn with crack lines, crumble once the die leaves them.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board is machine generated and then solved exactly, so perfect really is the fewest rolls that exist rather than somebody&rsquo;s guess, and it is confirmed by a second solver written independently of the first. Par sits a cushion above perfect: it is the number a clean solve lands on, and it is beatable. Monday lights three squares, the count climbs through the week, cracked squares arrive on Thursday, and the Sunday Edition lights six on the biggest floor.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/topple" style={{ color: INK, fontWeight: 800 }}>Topple</a>, our daily block rolling puzzle, <a href="/parker" style={{ color: INK, fontWeight: 800 }}>Parker</a>, our daily sliding-block jam, and <a href="/snug" style={{ color: INK, fontWeight: 800 }}>Snug</a>, our daily shape-fitting puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
