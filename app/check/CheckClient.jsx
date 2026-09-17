'use client';

// Check — the daily checkers shot.
//
// Every board is Red to play with a forced sweep: capture EVERY black piece
// inside a fixed number of your own moves. Weekdays take three, Sundays four.
// Exactly one first move does it, and every board in the bank turns on the same
// idea, which is exactly why no reader-facing copy may NAME that idea. Share
// cards, tile tags, metadata, the rules panel and the first-run help describe the
// GOAL only. The one place the key is named is the payoff block below, gated on
// !playing, which renders after the board is over.
//
// A wrong move is NOT refused, and nothing on the board announces it. The engine
// answers, the clock on your move budget keeps ticking down, and you play the
// rest out; whether the sweep is still alive is yours to work out, because the
// verdict waits for the budget to run down (owner rule, 2026-08-11). The engine
// is a depth-bounded exact search (app/check/draughts.js), so it answers any
// position, on or off the line, which is what makes that possible.
//
// Same daily plumbing as Park/Four/Mate: banked boards gated by Eastern date on
// the server (app/check/page.js), per-puzzle localStorage saves, /check?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, RotateCcw, Smartphone } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold, { HOLD_SHORT, HOLD_LONG } from '../useEndHold';
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
import {
  SIZE, deserialize, legalMoves, clearIn, scoreMoves, blackReply, countPieces,
  playable, isRed, isKing,
} from './draughts';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#166e5a',        // Check identity — board green
  accentSoft: '#e6f3ef', green: T.successDeep,
};
// Check shipped its own bone-and-green board, the odd one out of the four chess
// games. Same pair as the others now. The red and black PIECES are meaning and
// are left alone: both read on either square in either register.
const LIGHT_SQ = 'var(--stg-sq-l, #e9e2d0)';
const DARK_SQ = 'var(--stg-sq-d, #4f6b58)';
const RED_PC = T.danger, RED_PC_DK = '#7a2318';
const BLK_PC = '#26282e', BLK_PC_DK = '#0e0f12';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_check_help_seen';
const STATS_KEY = 'sot_check_stats';

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

const freshState = () => ({ v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null });

// Replay the stored path strings onto the banked board. Storing the paths rather
// than the boards keeps a save tiny and means it can never drift from the rules.
function replay(cells, keys) {
  let b = deserialize(cells);
  let red = true;
  for (const k of keys) {
    const m = legalMoves(b, red).find((x) => x.path.join('.') === k);
    if (!m) break;
    b = m.board;
    red = !red;
  }
  return { board: b, redToMove: red };
}

export default function CheckClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_check_${PUZZLE.num}`;
  const BUDGET = PUZZLE.clearIn;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(0);
  const [hintSq, setHintSq] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  // Hold the end card back so the move that ended the game is visible first.
  const endHold = useEndHold(1100);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('check', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('check'); }, [g.hintUsed]);
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
  const replyTimer = useRef(null);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('check');
  const STAGE = isStage('check', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('check');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('check'), '--stg-acc-lt': gameColorLight('check'), '--stg-onramp-lt': gameOnrampLight('check'), '--stg-acc-ink-lt': gameAccentInkLight('check') };
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
  const won = g.status === 'won';

  const { board: pos, redToMove } = useMemo(() => replay(PUZZLE.cells, g.moves), [PUZZLE, g.moves]);
  const redMovesMade = Math.ceil(g.moves.length / 2);
  const left = Math.max(0, BUDGET - redMovesMade);
  const blkLeft = countPieces(pos, false);
  const blkStart = PUZZLE.blk;
  const taken = blkStart - blkLeft;
  const awaitingReply = !redToMove && playing;
  const myTurn = playing && started && redToMove && !thinking;
  const finalScore = won ? 10 : 0;

  const myMoves = useMemo(() => (myTurn ? legalMoves(pos, true) : []), [pos, myTurn]);
  // One tap target per legal move: the square the piece finishes on. Two chains
  // that finish on the same square are vanishingly rare, and the richer capture
  // wins so the tap never costs you material by accident.
  const targets = useMemo(() => {
    const m = new Map();
    if (sel == null) return m;
    for (const mv of myMoves) {
      if (mv.from !== sel) continue;
      const cur = m.get(mv.to);
      if (!cur || mv.caught.length > cur.caught.length) m.set(mv.to, mv);
    }
    return m;
  }, [myMoves, sel]);
  const movable = useMemo(() => new Set(myMoves.map((m) => m.from)), [myMoves]);
  const lastPath = g.moves.length ? g.moves[g.moves.length - 1].split('.').map(Number) : [];

  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);
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
        if (done || g.t0) localStorage.setItem('sot_check_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_check_day');
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
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'check', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'check', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'check', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'check', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'check', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_check_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!(cur.moves.length || cur.hintUsed) || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.errors, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // HOW FAR THIS RUN GOT (migration 51). A loss here scores 0, which used to
  // leave every losing player tied and let the board rank them by who lost
  // FASTEST. This is the ranking term that separates them: black pieces swept
  // off the board. The sweep IS the puzzle, so pieces taken is the honest
  // measure of depth, and it is already what the share squares grade on.
  // It is NOT score, so a loss still earns nothing; it only orders the losers,
  // deepest first, with the clock settling the rest.
  function progressOf(g2) {
    const { board } = replay(PUZZLE.cells, g2.moves || []);
    return Math.max(0, PUZZLE.blk - countPieces(board, false));
  }

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.errors, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.errors, progress: progressOf(g2), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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
  function finish(g2, status, score) {
    const done = { ...g2, status, tEnd: Date.now() };
    if (!done.t0) done.t0 = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(done, score);
    // A loss lands on the OPPONENT's move, so the player has not seen it yet:
    // the board holds for HOLD_LONG with the deciding move still lit and the
    // verdict line readable. A win is your own move, so it keeps the old beat.
    endHold.hold(status === 'won' ? HOLD_SHORT : HOLD_LONG);
    commit(done);
  }

  // Black answers a beat after your move. The search runs inside the timeout, so
  // your capture animates before the engine thinks, and the same call tells us
  // whether your move just threw the sweep away.
  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) { setThinking(false); return; }
      const { board: b } = replay(PUZZLE.cells, cur.moves);
      const redLeft = Math.max(0, BUDGET - Math.ceil(cur.moves.length / 2));
      const rep = blackReply(b, redLeft + 1, PUZZLE.quizId);
      setThinking(false);
      // Black stuck with pieces still on the board is not a sweep, so the
      // objective has failed even though the game itself would be won. Falling
      // short scores nothing: the sweep is the whole puzzle, and a near miss is
      // still a miss (owner ruling, aligning Check with Four, Chain and Mate).
      if (!rep) { finish(cur, 'lost', 0); return; }
      const next = { ...cur, moves: [...cur.moves, rep.path.join('.')] };
      const after = rep.board;
      // The blunder was already counted when the move was played; black only
      // ever picks the best defence that was there anyway.
      if (redLeft === 0) { finish(next, 'lost', 0); return; }
      if (!legalMoves(after, true).length) { finish(next, 'lost', 0); return; }
      commit(next);
      vibrate(HAPT.ok);
    }, 430);
  }
  useEffect(() => {
    if (!hydrated || !playing || !g.t0) return undefined;
    if (g.moves.length % 2 === 1) scheduleReply(g.moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, g.t0, g.moves.length]);

  function playMove(mv) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    const redLeft = Math.max(0, BUDGET - Math.ceil(cur.moves.length / 2));
    const wasOn = clearIn(replay(PUZZLE.cells, cur.moves).board, redLeft) <= redLeft;
    const nextMoves = [...cur.moves, mv.path.join('.')];
    const g2 = { ...cur, moves: nextMoves };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null); setHintSq(null);
    if (countPieces(mv.board, false) === 0) { finish(g2, 'won', 10); return; }
    // Did that move cost the sweep? One search, comparing what was reachable
    // before the move with what is reachable after it. Note the budget passed
    // is redLeft, NOT redLeft - 1: see the convention note in draughts.js.
    const stillOn = clearIn(mv.board, redLeft, false) <= redLeft - 1;
    // A move that lets the sweep go is COUNTED but never ANNOUNCED. Saying so
    // the moment it happened decided the round out loud while there were still
    // moves in the budget; the verdict now waits for the budget to run out. The
    // tally still feeds the tie-break and the end card.
    if (wasOn && !stillOn) g2.errors = cur.errors + 1;
    vibrate(HAPT.ok);   // the same tick either way, so touch never grades the move
    commit(g2);
    scheduleReply(nextMoves);
  }

  function onSquare(sq) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); return; }
    if (!myTurn) return;
    const mv = targets.get(sq);
    if (mv) { playMove(mv); return; }
    if (movable.has(sq)) { setSel((v) => (v === sq ? null : sq)); return; }
    if (pos[sq] && isRed(pos[sq])) { setShake((k) => k + 1); say('That piece has no move. Captures are compulsory here.'); return; }
    setSel(null);
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const redLeft = Math.max(0, BUDGET - Math.ceil(cur.moves.length / 2));
    // The sweeping move if one is still there, otherwise the move that clears
    // the most. Both point at a piece and both say the same thing, so asking for
    // the hint can never be read as "the sweep is already gone". Infinity is a
    // real value here (a line that never clears), so the sort compares rather
    // than subtracts, which would give NaN.
    const winner = legalMoves(pos, true).find((m) => clearIn(m.board, redLeft, false) <= redLeft - 1)
      || (scoreMoves(pos, redLeft).sort((a, b) => (a.clear === b.clear ? 0 : a.clear < b.clear ? -1 : 1))[0] || {}).move
      || null;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    if (!winner) return;
    setHintSq(winner.from);
    setSel(winner.from);
    say('That is the piece to move. Where it goes is still on you.');
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    endHold.hold(HOLD_SHORT);
    commit(g2);
    setSel(null);
  }

  // A replay deals the same board again with the clock already running. The start
  // tile exists to keep the FIRST attempt's timer honest; a replay never becomes
  // the recorded result, so re-reading the directions is pure friction.
  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    setArmReveal(false);
    setArmRestart(false);
    commit({ ...freshState(), t0: Date.now() });
    setSel(null); setHintSq(null); setEndClosed(false);
  }

  // Restart deals the same board again mid-game. The abandoned run is recorded
  // exactly as giving up records it, because this control only appears once the
  // player has pressed Start and walking away from a losing board cannot be
  // free. Unlike giving up it does NOT play the answer out: the player is about
  // to replay this very board.
  function restartGame() {
    const cur = gRef.current;
    if (cur.status === 'playing' && cur.t0) {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      postResult({ ...cur, status: 'gaveup', tEnd: Date.now() }, 0);
    }
    resetGame();
  }

  function shareUrl() { return withRef(`mindloftdaily.com/check${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const g5 = won ? 5 : Math.max(1, Math.min(4, taken));
    const squares = (won ? '\u{1F534}' : '\u{1F7E4}').repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Check #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · swept the board in ${BUDGET} · ${g.errors === 0 ? 'clean' : `${g.errors} slip`} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'gaveup' ? `Check #${PUZZLE.num} · gave up`
      : `Check #${PUZZLE.num} · took ${taken} of ${blkStart} · ${elapsed}`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Check #${PUZZLE.num} — the daily checkers shot from Mind Loft.\n${shareUrl()}`
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
      lead={<>You are <b>red</b>, moving up the board. Capture <b>every black piece</b> within <b>{BUDGET} of your moves</b>.</>}
      steps={[
        <>Tap one of your pieces and its legal squares light up, then tap one to play it.</>,
        <>Standard checkers: men step one square diagonally forward, kings go both ways, and reaching the far row crowns you and ends the turn.</>,
        <><b>Captures are compulsory</b>, and a jump must be carried on for as long as the same piece can keep jumping.</>,
      ]}
      knack="Black never gets a choice about its reply. Work out what each of your moves forces black to do, and what the board looks like once it has done it."
      note={<>Exactly <b>one</b> first move clears the board in time, and a wrong one is <b>not taken back</b>: black answers, your budget still runs down, and the sweep is gone.</>}
      footer={<>Clearing the board scores 10. Falling short scores nothing, the same as giving up. One free <b>hint</b>, on your first ever play, names the piece to move. Sundays give you four moves instead of three, and need them.</>}
    />
  );

  const statusLine = () => {
    if (!playing) {
      if (won) return 'Board swept. Every piece.';
      if (g.status === 'gaveup') return 'You walked away.';
      return `You missed it. You took ${taken} of ${blkStart}.`;
    }
    if (thinking || awaitingReply) return 'Black is forced to answer...';
    if (sel != null) return 'Now tap where it goes.';
    return left === 1 ? 'Last move. It has to take everything left.' : `Your move. ${left} left to clear ${blkLeft}.`;
  };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="check" name="Check" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. END GAME: the cap shows exactly what the strip showed at that moment and no
          more. Taken, time and the move budget are all already on the board while
          you play, so surfacing them announces nothing; the score only appears
          once the round is over. */}
      {LOFT && (
        <Cap gameKey="check" quizId={PUZZLE.quizId}
          name="Check"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Clear in 4' : null}
          figures={playing ? [
            { v: `${taken}/${blkStart}`, k: 'taken' },
            { v: elapsed, k: 'time' },
            { v: left, k: 'moves left' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: `${taken}/${blkStart}`, k: 'taken' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="ck-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ck-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .ck-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ck-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ck-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .ck-sq{position:relative;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;}
          .ck-pc{width:76%;height:76%;border-radius:50%;pointer-events:none;box-shadow:inset 0 -3px 5px rgba(0,0,0,0.34), inset 0 3px 4px rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;}
          .ck-crown{width:54%;height:54%;display:block;overflow:visible;fill:rgba(255,255,255,0.9);filter:drop-shadow(0 1px 1.5px rgba(0,0,0,0.45));}
          .ck-dot{position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(255,255,255,0.62);pointer-events:none;}
          .ck-board.shake{animation:ckshake .34s ease;}
          @keyframes ckshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="check" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Clear in 4</span>}
          blocks={'CHECK'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Check is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>You are red. Take every black piece in {BUDGET} moves. Captures are compulsory, so black&rsquo;s reply is never a choice. One first move works, and there is no take-back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ck-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ whiteSpace: 'nowrap' }}>taken <b style={{ color: INK, fontWeight: 500 }}>{taken}/{blkStart}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {playing ? <>moves left <b style={{ color: left <= 1 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-acc-ink, ${COLORS.accent})`, fontWeight: 500 }}>{left}</b></> : <>clear in <b style={{ color: INK, fontWeight: 500 }}>{BUDGET}</b></>}
            </span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <div key={shake} className={`ck-board${shake ? ' shake' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${SIZE}, minmax(0, 1fr))`, aspectRatio: '1 / 1', border: `2px solid ${COLORS.ink}`, borderRadius: 6, overflow: 'hidden', touchAction: 'manipulation' }}>
              {Array.from({ length: SIZE * SIZE }).map((_, sq) => {
                const r = Math.floor(sq / SIZE), c = sq % SIZE;
                const dark = playable(r, c);
                const v = pos[sq];
                const isTarget = targets.has(sq);
                const isSel = sel === sq;
                const onPath = lastPath.includes(sq);
                const canLift = myTurn && movable.has(sq);
                let bg = dark ? DARK_SQ : LIGHT_SQ;
                if (onPath) bg = `linear-gradient(rgba(232,180,58,0.45),rgba(232,180,58,0.45)), ${bg}`;
                if (isSel) bg = `linear-gradient(rgba(255,255,255,0.32),rgba(255,255,255,0.32)), ${dark ? DARK_SQ : LIGHT_SQ}`;
                return (
                  <div key={sq} className="ck-sq" onClick={() => onSquare(sq)} role="button" tabIndex={-1}
                    aria-label={`row ${r + 1} column ${c + 1}${v ? (isRed(v) ? ' your piece' : ' black piece') : ''}`}
                    style={{ background: bg, cursor: dark && playing ? 'pointer' : 'default', boxShadow: hintSq === sq ? `inset 0 0 0 3px ${T.successDeep}` : canLift && sel == null ? 'inset 0 0 0 2px rgba(255,255,255,0.35)' : undefined }}>
                    {v !== 0 && (
                      <div className="ck-pc" style={{ background: isRed(v) ? `radial-gradient(circle at 34% 30%, ${RED_PC}, ${RED_PC_DK})` : `radial-gradient(circle at 34% 30%, ${BLK_PC}, ${BLK_PC_DK})` }}>
                        {isKing(v) && (
                          <svg className="ck-crown" viewBox="0 0 24 20" aria-hidden="true">
                            <path d="M1.9 5.6 7 10.2 12 1.9 17 10.2 22.1 5.6 20.3 15.3 3.7 15.3 Z" />
                            <rect x="3.5" y="16.6" width="17" height="2.6" rx="1.3" />
                          </svg>
                        )}
                      </div>
                    )}
                    {isTarget && <span className="ck-dot" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : (endHold.held ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`) }}>{statusLine()}</span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: FADED, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: RED_PC, display: 'inline-block' }} /> you
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: BLK_PC, display: 'inline-block', marginLeft: 6 }} /> black
            </span>
          </div>

          {playing && hintOk && !g.hintUsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button className="ck-tool" onClick={useHint} title="Name the piece that moves (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(22,110,90,0.5)', color: '#12543f' }}>
                <Lightbulb size={14} /> Hint
              </button>
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a bare
            row of faded text has nothing to sit on, and the card is meant to
            hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>Tap a red piece, then tap where it goes. No take-back.</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmRestart(false); setArmReveal(Date.now()); } }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the board and scores nothing' : 'Give up'}
              </button>
              <button onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartGame(); } else { setArmReveal(false); setArmRestart(Date.now()); } }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <RotateCcw size={13} /> {armRestart ? 'Tap again — records a loss and deals a fresh board' : 'Restart'}
              </button>
            </span>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && !endHold.held && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                The key was a <span style={{ color: ACC_INK }}>sacrifice</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                Captures are compulsory, so offering a piece is how you choose black&rsquo;s reply for them. The board falls in {BUDGET} because black never had a say.
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, four moves instead of three.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Check in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/check?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Check &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/check" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Check &rarr;</a>
                    {' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </div>
          )}
          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Check"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${`${taken}/${blkStart}`} taken \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Check all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Tries"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/check?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Check', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/check?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="check" name="Check" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="check" name="Check" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="check" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="check" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Check to your Home Screen</div>
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

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard modal self="check" won={won}
          headline={won ? <>Swept.</> : g.status === 'gaveup' ? <>You scored 0%</> : <>You missed it.</>}
          subline={won
            ? <>10/10 &middot; every piece in {BUDGET} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : g.status === 'gaveup' ? <>0/10 &middot; the sweep was there</>
            : <>{finalScore}/10 &middot; you took {taken} of {blkStart}, the sweep needed them all</>}
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
            <button className="ck-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Check</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Check is a free daily checkers puzzle from Mind Loft. Every board is red to play with a forced sweep on it: take every black piece inside three moves, four on Sundays. Tap a piece and its legal squares light up, so you never need notation to play.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Captures are compulsory in checkers, so black never chooses its own reply, and that is what makes a forced sweep possible at all. Finding the line is the puzzle, so we will not spoil it here. Every board in the bank was solved twice, by the engine that ships and by a second one written independently, to confirm the sweep exists, takes exactly the stated number of moves, and has exactly one first move that works.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/parker" style={{ color: INK, fontWeight: 800 }}>Parker</a>, our daily sliding-block jam, <a href="/four" style={{ color: INK, fontWeight: 800 }}>Four</a>, our daily Connect Four position, and <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, our daily chess endgame.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
