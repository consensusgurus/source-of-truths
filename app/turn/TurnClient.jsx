'use client';

// Turn — the daily Othello endgame.
//
// The board is picked up with ten empty squares (twelve on Sundays), the game
// already won for you, and exactly ONE square that keeps it. A wrong square is
// not taken back: app/turn/othello.js solves any position to the last disc, so
// the engine plays the rest perfectly and the win never comes back.
//
// The two things to hold on to while reading this file:
//
//   1. a side with no legal move PASSES, so `turn` is not a parity of the move
//      count. Every place that would normally say `moves.length % 2` asks the
//      game object instead, and the client says the pass out loud rather than
//      silently handing the move back;
//   2. finding the key is not the whole job. Every move after it has to hold
//      the win too, which is why `errors` counts every drop in the outlook and
//      not just the first one.

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
import DailyRules from '../DailyRules';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { makeGame, idOrder, engineMove, SQ_NAME } from './othello';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#226218',
  accentSoft: '#e4f4e1',
  green: T.successDeep,
};

// The felt is the largest object in the game and says nothing, so it becomes the
// board surface. Both stops of each disc sit on one token, so a disc is flat on
// the stage and keeps its gloss on the Loft.
const FELT = 'var(--stg-surf, #407637)';        // the board itself
const FELT_LINE = 'var(--stg-line, #2f5a29)';   // the grid between squares
const DISC_YOU = 'var(--stg-acc, #16181c)';     // yours: the category, filled
const DISC_YOU_HI = 'var(--stg-acc, #454b55)';
const DISC_FOE = 'var(--stg-b3, #f5f2e9)';      // the engine's: the ground, lifted
const DISC_FOE_HI = 'var(--stg-b4, #ffffff)';
// THE PIP ON A LEGAL SQUARE. It cannot be a white literal: the felt is
// --stg-surf, which is #ffffff on the light register, so a white pip was a
// white circle on a white square and the six squares you were allowed to play
// showed nothing at all. The token carries a value per register, each measured
// on the square it sits on; the fallback is for the Loft's green felt, which is
// dark on both. See --stg-cell-dot in globals.css.
const DOT = 'var(--stg-cell-dot, rgba(255,255,255,0.42))';
const DOT_HOT = 'var(--stg-cell-dot2, rgba(255,255,255,0.85))';
// THE MARKER CANNOT BE THE ACCENT HERE, and it cannot be amber either. Turn is an
// End Game title, so its accent IS gold, and gold marks on gold discs is the
// collision this rule exists to avoid; --stg-warn is a neighbouring amber and no
// better. Ink is the one value that cannot be mistaken for either disc, on either
// register: bright on the dark board, dark on the light one.
const MARK = 'var(--stg-ink, #f2c94c)';         // the reveal ring and the hint

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_turn_help_seen';
const STATS_KEY = 'sot_turn_stats';

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
    return next.getTime() - et.getTime();
  } catch (e) {
    const n = new Date();
    const nx = new Date(n);
    nx.setHours(24, 0, 0, 0);
    return nx.getTime() - n.getTime();
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
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { v: 1, rec: {} };
    const s = JSON.parse(raw);
    return s && s.v === 1 && s.rec ? s : { v: 1, rec: {} };
  } catch (e) { return { v: 1, rec: {} }; }
}
function recordStat(num, entry) {
  const s = getStats();
  if (s.rec[num]) return s;
  s.rec[num] = entry;
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function deriveStats(s, todayNum) {
  const rec = (s && s.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const perfect = nums.filter((n) => rec[n].won).length;
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) { if (rec[n]) cur++; else break; }
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev !== null && n === prev + 1 ? run + 1 : 1; prev = n; if (run > max) max = run; }
  return { played, perfect, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!Array.isArray(recent) || !recent.length) return s;
  const byId = new Map(puzzles.map((p) => [p.quizId, p.num]));
  let touched = false;
  for (const m of recent) {
    if (!m || m.attempt !== 1) continue;
    const num = byId.get(m.quizId);
    if (!num || s.rec[num]) continue;
    const score = typeof m.scorePct === 'number' ? Math.round((m.scorePct / 100) * 10) : 0;
    s.rec[num] = { s: score, t: 10, g: m.guessesUsed || 0, won: score >= 10 };
    touched = true;
  }
  if (touched) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {} }
  return s;
}

const HAPT = { ok: [7], take: [6, 18, 6], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

function freshState() {
  return { v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

export default function TurnClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_turn_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [hoverSq, setHoverSq] = useState(null);
  const [shake, setShake] = useState(0);
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
  const endHold = useEndHold(1100);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('turn', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('turn'); }, [g.hintUsed]);
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
  const LOFT = isLoft('turn');
  const STAGE = isStage('turn', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('turn');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('turn'), '--stg-acc-lt': gameColorLight('turn'), '--stg-onramp-lt': gameOnrampLight('turn'), '--stg-acc-ink-lt': gameAccentInkLight('turn') };
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
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const won = g.status === 'won';
  const errors = g.errors;
  // What the round posted. Read ONLY by the cap, and only once the round is
  // over: End Game never shows a running verdict.
  const endScore = won ? 10 : 0;

  // ── the board, replayed from the move list ───────────────────────────────
  // Replaying is what makes a reload safe: nothing about the live position is
  // persisted except the squares played, in order, and the pass rule is
  // re-applied by the same engine the bank was verified with.
  const view = useMemo(() => {
    const st = makeGame(PUZZLE);
    const placedBy = new Map();
    let lastSq = null, lastFlips = [], lastBy = null;
    for (const sq of g.moves) {
      const who = st.turn;
      const flips = st.play(sq) || [];
      placedBy.set(sq, who);
      lastSq = sq; lastFlips = flips; lastBy = who;
    }
    const legal = st.over ? [] : st.moves();
    const legalSet = new Set(legal.map((m) => m.sq));
    // If the side that just moved is on move again, the other side had nothing
    // to play. That is a pass, and the player is told about it.
    const passedBack = lastBy !== null && !st.over && st.turn === lastBy;
    return {
      st,
      cells: Array.from(st.b),
      placedBy,
      lastSq,
      lastFlips: new Set(lastFlips),
      legalSet,
      passedBack,
      outlook: st.over ? st.margin : st.outlook(),
      score: st.score,
      turn: st.turn,
      over: st.over,
    };
  }, [PUZZLE, g.moves]);

  const myTurn = playing && started && view.turn === 1 && !view.over;

  // A hint marks three squares, one of which is the key. Deterministic from the
  // puzzle id so everyone who spends their one hint sees the same three.
  const hintSet = useMemo(() => {
    const st = makeGame(PUZZLE);
    const legal = st.moves().map((m) => m.sq);
    const order = idOrder(`${PUZZLE.quizId}-hint`, 64);
    const out = [PUZZLE.key];
    for (const i of order) { if (out.length >= 3) break; if (legal.includes(i) && i !== PUZZLE.key) out.push(i); }
    return new Set(out);
  }, [PUZZLE]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  useEffect(() => {
    if (g.status === 'playing') return undefined;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

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
        if (done || g.t0) localStorage.setItem('sot_turn_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_turn_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sot_quiz_identity');
      const id = raw ? JSON.parse(raw) : null;
      if (id && (id.email || id.username)) setIdentity(id);
      const qs = new URLSearchParams();
      const anon = getAnonId();
      if (anon) qs.set('anonId', anon);
      if (id && id.email) qs.set('email', id.email);
      qs.set('history', '1');
      meRequest(`/api/quiz/me?${qs.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          if (d && d.player) setPlayer(d.player);
          if (d && Array.isArray(d.recent)) {
            try { setStats(mergeServerStats(getStats(), d.recent, puzzles)); } catch (e) {}
          }
        })
        .catch(() => {});
    } catch (e) {}
    try {
      fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: PUZZLE.quizId }),
        }).catch(() => {});
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvt(e); };
    try { window.addEventListener('beforeinstallprompt', onPrompt); } catch (e) {}
    try {
      const sa = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
      setStandalone(!!sa);
      setMobileUi(isMobileDevice());
    } catch (e) {}
    return () => { try { window.removeEventListener('beforeinstallprompt', onPrompt); } catch (e) {} };
  }, []);

  const myStats = useMemo(() => deriveStats(stats, PUZZLE.num), [stats, PUZZLE.num]);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'turn', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'turn', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'turn', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'turn', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'turn', active: LOFT && !playing });

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }
  function commit(next) { gRef.current = next; setG(next); }

  const REC_KEY = `sot_turn_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.errors, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // HOW FAR THIS RUN GOT (migration 51). A loss here scores 0, which used to
  // leave every losing player tied and let the board rank them by who lost
  // FASTEST. This is the ranking term that separates them: discs held at the
  // final count. A capture keeps the turn here, so the move list has no fixed
  // parity to read your own moves off, and the discs you actually finished
  // with is both derivable and the number the game already reports to you.
  // It is NOT score, so a loss still earns nothing; it only orders the losers,
  // deepest first, with the clock settling the rest.
  function progressOf(g2) {
    try { return Math.max(0, stateAfter(g2.moves || []).score.mine); } catch (e) { return 0; }
  }

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.errors, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.errors, progress: progressOf(g2), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // A loss scores nothing, the same as giving up: you either kept the win or
  // you did not. Turn shipped after the ruling that zeroed Four, Chain, Check
  // and Mate and was never swept in with them, so a losing Turn player was
  // collecting completion points nobody else got (owner, 2026-08-09). How far
  // they got is now carried by `progress`, which ranks without paying.
  const SCORE = { won: 10, lost: 0, gaveup: 0 };
  function finish(g2, status) {
    const done = { ...g2, status, tEnd: Date.now() };
    if (!done.t0) done.t0 = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(done, SCORE[status] ?? 0);
    // A loss lands on the OPPONENT's move, so the player has not seen it yet:
    // the board holds for HOLD_LONG with the deciding move still lit and the
    // verdict line readable. A win is your own move, so it keeps the old beat.
    // Giving up is your own doing, so it takes the short beat like a win.
    endHold.hold(status === 'lost' ? HOLD_LONG : HOLD_SHORT);
    commit(done);
  }

  function startGame() {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    const next = { ...gRef.current, t0: Date.now() };
    commit(next);
  }

  // ── moves ────────────────────────────────────────────────────────────────
  //
  // Every move is applied by replaying the whole list through the engine, so
  // the client can never drift from the position the verifier scored.
  function stateAfter(moves) {
    const st = makeGame(PUZZLE);
    for (const sq of moves) st.play(sq);
    return st;
  }

  function applyMove(sq, isPlayer) {
    const before = stateAfter(gRef.current.moves);
    if (before.over) return;
    if (!before.moves().some((m) => m.sq === sq)) return;
    // Both outlook calls run on the SAME game object, so the second one reuses
    // the first one's search table instead of paying for the position twice.
    const outlookBefore = before.outlook();
    const flipped = before.play(sq);
    const outlookAfter = before.over ? before.margin : before.outlook();

    const moves = gRef.current.moves.concat([sq]);
    let next = { ...gRef.current, moves };
    if (!next.t0) next.t0 = Date.now();
    // A square that costs discs is COUNTED but never ANNOUNCED. The board used
    // to shake and say the win was gone the moment it went, which decided the
    // round out loud while there were still squares to play; the verdict now
    // waits for the board to be counted. The tally still feeds the errors
    // tie-break and the end card.
    if (isPlayer && outlookAfter < outlookBefore) {
      next.errors = next.errors + 1;
    }
    // The same tick either way, so touch never grades the move.
    if (isPlayer) vibrate(flipped && flipped.length > 2 ? HAPT.take : HAPT.ok);

    if (before.over) {
      finish(next, before.margin > 0 ? 'won' : 'lost');
      return;
    }
    commit(next);
  }

  function onSquare(sq) {
    if (!playing) return;
    if (!started) return;
    if (view.turn !== 1 || thinking) { setShake((s) => s + 1); return; }
    if (!view.legalSet.has(sq)) return;
    applyMove(sq, true);
  }

  // The engine answers on a timer so the player's disc paints first, and the
  // search runs INSIDE the timeout rather than in the click handler.
  useEffect(() => {
    if (!hydrated || !playing || !g.t0) return undefined;
    const st = stateAfter(g.moves);
    if (st.over || st.turn !== 2) { setThinking(false); return undefined; }
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing') { setThinking(false); return; }
      const now = stateAfter(cur.moves);
      if (now.over || now.turn !== 2) { setThinking(false); return; }
      const mv = engineMove(now, PUZZLE.quizId);
      setThinking(false);
      if (mv) applyMove(mv.sq, false);
    }, 430);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, g.t0, g.moves.length]);

  // Say the pass out loud. A silent hand-back is the single most confusing
  // thing that can happen on an Othello endgame board.
  const passSaid = useRef(0);
  useEffect(() => {
    if (!started || !view.passedBack) return;
    if (passSaid.current === g.moves.length) return;
    passSaid.current = g.moves.length;
    say(view.turn === 1 ? 'The engine has nothing to play. Your move again.' : 'You have nothing to play, so the engine goes again.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, view.passedBack, g.moves.length]);

  function useHint() {
    if (!hintOk || g.hintUsed) return;
    commit({ ...gRef.current, hintUsed: true, t0: gRef.current.t0 || Date.now() });
    say('One of the three ringed squares wins it.');
  }

  function revealEnd() {
    if (!armReveal) {
      setArmRestart(false);
      setArmReveal(Date.now());
      setTimeout(() => setArmReveal(false), 3500);
      return;
    }
    if (Date.now() - armReveal < ARM_MIN_MS) return;
    setArmReveal(false);
    finish(gRef.current, 'gaveup');
  }

  // A replay deals the same board again with the clock already running. The start
  // tile exists to keep the FIRST attempt's timer honest; a replay never becomes
  // the recorded result, so re-reading the directions is pure friction.
  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    passSaid.current = 0;
    commit({ ...freshState(), t0: Date.now() });
    setEndClosed(false);
    setHoverSq(null);
    setArmReveal(false);
    setArmRestart(false);
  }

  // Restart deals the same board again mid-game. The abandoned run is recorded
  // exactly as giving up records it, because this control only appears once the
  // player has pressed Start and walking away from a losing board cannot be
  // free. Unlike giving up it does NOT play the answer out: the player is about
  // to replay this very board.
  function restartGame() {
    if (!armRestart) {
      setArmReveal(false);
      setArmRestart(Date.now());
      setTimeout(() => setArmRestart(false), 3500);
      return;
    }
    if (Date.now() - armRestart < ARM_MIN_MS) return;
    setArmRestart(false);
    const cur = gRef.current;
    if (cur.status === 'playing' && cur.t0) {
      postResult({ ...cur, status: 'gaveup', tEnd: Date.now() }, SCORE.gaveup);
    }
    resetGame();
  }

  async function a2hsClick() {
    if (installEvt) {
      try { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); return; } catch (e) {}
    }
    setShowA2hsHelp(true);
  }

  function shareUrl() {
    return withRef(`mindloftdaily.com/turn${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const good = won ? Math.max(1, 5 - Math.min(4, errors)) : 0;
    const squares = won ? '\u{1F7E9}'.repeat(good) + '⬜'.repeat(5 - good) : g.status === 'lost' ? '\u{1F7E5}' + '⬜'.repeat(4) : '⬜'.repeat(5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const verdict = won ? `won ${view.score.mine}-${view.score.theirs}` : g.status === 'lost' ? `lost ${view.score.mine}-${view.score.theirs}` : 'gave up';
    const missBit = g.status === 'gaveup' ? '' : ` · ${errors === 0 ? 'clean' : `${errors} error${errors === 1 ? '' : 's'}`}`;
    return `Turn #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${verdict}${missBit} · ${elapsed}${hintBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Turn #${PUZZLE.num} — the daily Othello endgame from Mind Loft.\n${shareUrl()}`
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

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Othello, picked up at the end. You are black, and the game is already won for you."
      banner={<>{PUZZLE.empties} empty squares, and exactly <b>one</b> of them keeps the win.</>}
      steps={[
        <><b>Tap a ringed square</b> to play there. Your disc must trap a line of white discs against another black one, and every disc you trap flips.</>,
        <>With no legal square you <b>pass</b> and the engine goes again, which cuts both ways and is most of the tactics down here.</>,
        <>A wrong square is <b>not taken back</b>. The engine solves the position to the last disc, so once the win is gone it never comes back.</>,
        <>Finding the square is not the whole job: every move after it has to hold the win too. <b>Most discs</b> at the end takes it, and a level board is not a win.</>,
        <>One free <b>hint</b>, on your first ever play, rings three squares, one of which wins.</>,
      ]}
      knack="The habit to distrust is your own. Flipping as few discs as possible is good Othello most of the time, which is exactly why it is not always right here: some days the square that turns the whole row is the only move that wins, and some days neither extreme does. Read the board, not the reflex."
      footer="Winning scores 10, losing 1, giving up nothing. Ties break on fewest errors, then fastest time. Sundays step up to 12 empty squares."
    />
  );

  const statusLine = () => {
    if (!playing) {
      if (won) return `Board counted. You take it ${view.score.mine} to ${view.score.theirs}.`;
      if (g.status === 'lost') return view.score.mine === view.score.theirs
        ? `Board counted. Level at ${view.score.mine}, and level is not a win.`
        : `Board counted. The engine takes it ${view.score.theirs} to ${view.score.mine}.`;
      return 'You ended it there. The winning square is still in the position.';
    }
    if (thinking || view.turn === 2) return 'The engine is answering...';
    if (!started) return 'Ready when you are.';
    if (view.passedBack) return 'The engine has no move. Play again.';
    // No live evaluation: a line that stopped saying you were winning would
    // announce the loss by its absence, which is the leak the toast was.
    return g.moves.length === 0 ? 'Your move. One square keeps this.' : 'Your move.';
  };

  // ── board ────────────────────────────────────────────────────────────────
  // The winning square is ringed ONLY for a player who actually found it. Turn
  // is a replayable position, so ringing the key square for someone who lost or
  // gave up hands them the answer and spends the puzzle for good.
  const revealKey = won;
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const squares = [];
  for (let sq = 0; sq < 64; sq++) {
    const v = view.cells[sq];
    const open = view.legalSet.has(sq) && myTurn;
    const isKey = revealKey && sq === PUZZLE.key;
    const hinted = playing && g.hintUsed && view.legalSet.has(sq) && hintSet.has(sq);
    const hot = open && hoverSq === sq;
    const flipped = view.lastFlips.has(sq);
    const fresh = sq === view.lastSq;
    squares.push(
      <div
        key={sq}
        className={`tn-sq${open ? ' live' : ''}`}
        onMouseEnter={() => open && setHoverSq(sq)}
        onMouseLeave={() => setHoverSq(null)}
        onClick={() => open && onSquare(sq)}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: hot ? 'var(--stg-surf2, #4c8a41)' : FELT,
          cursor: open ? 'pointer' : 'default', touchAction: 'manipulation',
        }}
      >
        {v !== 0 && (
          <span
            className={`tn-disc${flipped ? ' tn-flip' : ''}${fresh ? ' tn-fresh' : ''}`}
            style={{
              width: '76%', height: '76%', borderRadius: '50%',
              background: v === 1
                ? `radial-gradient(circle at 34% 30%, ${DISC_YOU_HI}, ${DISC_YOU} 62%)`
                : `radial-gradient(circle at 34% 30%, ${DISC_FOE_HI}, ${DISC_FOE} 62%)`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
            }}
          />
        )}
        {v === 0 && open && (
          <span style={{ width: '26%', height: '26%', borderRadius: '50%', background: hot ? DOT_HOT : DOT }} />
        )}
        {v === 0 && hinted && !open && (
          <span style={{ width: '26%', height: '26%', borderRadius: '50%', background: MARK }} />
        )}
        {hinted && (
          <span aria-hidden="true" style={{ position: 'absolute', inset: '9%', borderRadius: '50%', border: `2.5px solid ${MARK}` }} />
        )}
        {isKey && (
          <span className="tn-key" aria-hidden="true" style={{ position: 'absolute', inset: '7%', borderRadius: '50%', border: `3px solid ${MARK}` }} />
        )}
      </div>,
    );
  }

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="turn" name="Turn" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. END GAME: the cap shows exactly what the strip showed at that moment and
          no more. The tally is kept and posted throughout but only APPEARS once
          the round is over, because a counter ticking up is itself a notice that
          the move was wrong. What is left while you play is the clock and the
          puzzle's own brief, both of which announce nothing. */}
      {LOFT && (
        <Cap gameKey="turn" quizId={PUZZLE.quizId}
          name="Turn"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: `${view.score.mine}\u2013${view.score.theirs}`, k: 'discs' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'errors' },
            { v: `${view.score.mine}\u2013${view.score.theirs}`, k: 'discs' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="tn-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.tn-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .tn-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accent};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accent};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .tn-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .tn-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:118px;box-sizing:border-box;}
          .tn-sq{-webkit-tap-highlight-color:transparent;transition:background .12s ease;}
          .tn-disc{display:block;}
          .tn-fresh{animation:tnpop .28s ease;}
          @keyframes tnpop{0%{transform:scale(0.25);}70%{transform:scale(1.07);}100%{transform:scale(1);}}
          .tn-flip{animation:tnflip .42s ease;}
          @keyframes tnflip{0%{transform:rotateY(0deg) scale(1);}50%{transform:rotateY(90deg) scale(0.92);}100%{transform:rotateY(0deg) scale(1);}}
          .tn-key{animation:tnkey 1.15s ease-in-out infinite;}
          @keyframes tnkey{0%,100%{box-shadow:0 0 0 0 rgba(242,201,76,0.65);}50%{box-shadow:0 0 0 7px rgba(242,201,76,0);}}
          .tn-board.shake{animation:tnshake .34s ease;}
          @keyframes tnshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
        `}</style>

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

          {!LOFT && (
          <DailyMasthead
            slug="turn"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={5}
            helpTop={13}
            marginBottom={16}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 12 squares</span>}
            blocks={'TURN'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Turn is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>{PUZZLE.empties} squares left and the game is won for you. Exactly one square keeps it. Play the wrong one and the engine, which solves this to the last disc, will not give it back.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="tn-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, borderColor: STAGE ? STAGE_C : T.cta, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
              {/* These figures move UP into the cap on a loft page; printing them
                  twice is the one thing to avoid. */}
              {!LOFT && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {/* Kept and posted throughout, shown only once the board is
                    counted: a counter ticking up is itself a notice. */}
                {!playing && <span style={{ whiteSpace: 'nowrap' }}>errors <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
                <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
                <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                  discs <b style={{ color: INK, fontWeight: 500 }}>{view.score.mine}</b>
                  <span style={{ opacity: 0.55 }}> &ndash; </span>
                  <b style={{ color: FADED, fontWeight: 500 }}>{view.score.theirs}</b>
                </span>
              </div>
              )}

              <div style={{ maxWidth: 430, margin: '0 auto' }}>
                <div
                  key={shake}
                  className={`tn-board${shake ? ' shake' : ''}`}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', gap: 2, aspectRatio: '1 / 1', background: FELT_LINE, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: 3, touchAction: 'manipulation', overflow: 'hidden' }}
                >
                  {squares}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: '3px 3px 0', fontFamily: MONO, fontSize: 9.5, color: FADED, textAlign: 'center' }}>
                  {files.map((f) => <span key={f}>{f}</span>)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: endHold.held ? 15 : 13.5, fontWeight: endHold.held ? 800 : 700, color: INK }}>{statusLine()}</div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: DISC_YOU, display: 'inline-block' }} /> you
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: DISC_FOE, border: '1px solid rgba(28,30,36,0.3)', display: 'inline-block', marginLeft: 4 }} /> engine
                </div>
              </div>

              {playing && hintOk && !g.hintUsed && g.moves.length === 0 && (
                <div style={{ marginTop: 10 }}>
                  <button className="tn-tool" onClick={useHint} title="Ring three squares, one of which wins (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})` }}>
                    <Lightbulb size={14} /> Hint
                  </button>
                </div>
              )}

            {/* Controls. These sit INSIDE the board card: on the navy stage a bare
                row has nothing to sit on, and the card is meant to hold the game. */}
          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 11, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: FADED }}>No take-back. Every square you play is played.</div>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className="tn-tool" onClick={revealEnd} style={{ borderColor: armReveal ? COLORS.rust : undefined, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : undefined }}>
                  <Eye size={14} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button className="tn-tool" onClick={restartGame} title="Record this as a loss and deal the same board again" style={{ borderColor: armRestart ? COLORS.rust : undefined, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : undefined }}>
                  <RotateCcw size={14} /> {armRestart ? 'Press again' : 'Restart'}
                </button>
              </span>
            </div>
          )}
            </div>
          )}


          <div className={STAGE ? undefined : 'loft-sol'}>
            {!playing && !endHold.held && (
              <div style={{ maxWidth: 472, margin: '0 auto 6px' }}>
                {/* The key square and the idea behind it go only to a solver, so
                    a player who lost can come back to the position intact. */}
                {won ? (
                  <>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, marginBottom: 6 }}>
                      The key: <span style={{ color: ACC_INK }}>{SQ_NAME(PUZZLE.key)}</span>, ringed on the board.
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: FADED, lineHeight: 1.55 }}>{PUZZLE.motif}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, lineHeight: 1.55 }}>
                    We are not naming the square. The win is still sitting in this position, so take another run at it.
                  </div>
                )}
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontStyle: 'italic', color: FADED, marginTop: 8 }}>The Sunday Edition, with two more squares to read.</div>
                )}
                {isTodays && myStats.cur >= 2 && (
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#b45309', marginTop: 8 }}>{myStats.cur}-day streak</div>
                )}
                <p style={{ fontSize: 12.5, fontWeight: 600, color: FADED, marginTop: 12, lineHeight: 1.6 }}>
                  {isTodays ? (
                    <>Next Turn in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>. {PUZZLE.num > 1 && (<a href={`/turn?p=${PUZZLE.num - 1}`} style={{ color: ACC_INK, fontWeight: 800 }}>Play yesterday&rsquo;s Turn &rarr;</a>)}</>
                  ) : (
                    <>You&rsquo;re playing the {PUZZLE.dateLabel} archive. <a href="/turn" style={{ color: ACC_INK, fontWeight: 800 }}>Back to today&rsquo;s Turn &rarr;</a></>
                  )}
                  {' '}<a href="/daily" style={{ color: ACC_INK, fontWeight: 800 }}>All daily puzzles</a>
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
              name="Turn"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} errors \u00b7 ${`${view.score.mine}\u2013${view.score.theirs}`} discs \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Turn all time` : 'all-time rank' }
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
                  href: `/turn?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Turn', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/turn?p=${prevPuzzle.num}` },
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
          {!STAGE && <GamePanel self="turn" name="Turn" onShow={() => setShowChrome(true)} />}

          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="turn" name="Turn" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid
              replay={!playing ? resetGame : null}
              self="turn"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              boardSlot={<DailyBoardPanel self="turn" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider
            />
            )}
            {!focusMode && mobileUi && !standalone && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="tn-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
              </div>
            )}
          </div>

          {showA2hsHelp && (
            <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: 20, maxWidth: 380, fontFamily: SANS }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Turn to your home screen</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                  {isIosDevice()
                    ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.'
                    : 'Open your browser menu and choose Install app, or Add to Home screen.'}
                </p>
                <button className="tn-btn" onClick={() => setShowA2hsHelp(false)}>Got it</button>
              </div>
            </div>
          )}

          {!focusMode && !identity && (
            <div id="daily-join" style={{ margin: '18px auto 0' }}>
              <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" />
            </div>
          )}
        </div>
      </div>

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard
          modal
          self="turn"
          won={won}
          defeat
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
          quizId={PUZZLE.quizId}
        />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 26, zIndex: 60, background: COLORS.ink, color: T.white, fontFamily: SANS, fontSize: 13.5, fontWeight: 700, padding: '10px 16px', borderRadius: 9, boxShadow: '0 6px 18px rgba(0,0,0,0.28)' }}>{toast}</div>
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: 20, maxWidth: 460, maxHeight: '86vh', overflowY: 'auto', fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>How to play</div>
              <button type="button" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: INK, display: 'flex' }} aria-label="Close"><X size={20} /></button>
            </div>
            {rulesBody}
            <div style={{ marginTop: 16 }}>
              <button className="tn-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
            </div>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Turn</h2>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          Turn is the daily Othello endgame. Everybody has played the game once, usually badly and usually as a child, by grabbing as many discs as possible and wondering why they lost. Almost nobody plays the last ten squares, which is where the whole thing is actually decided and where it stops being a game of chance.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          The disc count in the middle of a game means almost nothing, because any disc can flip back. What matters is squares: how many you can still play into, and how few you leave the other side. That is why flipping the fewest discs is usually right, and it is also why a bank that rewarded it every day would be teaching a habit rather than testing a read. About a third of these boards are days where the greedy square, the one that turns the whole row, is the only move that wins.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: 0 }}>
          Every board is a real position reached by a real game, solved to the last disc and checked so that exactly one square still wins it. More dailies: <a href="/chain" style={{ color: ACC_INK, fontWeight: 800 }}>Chain</a>, <a href="/four" style={{ color: ACC_INK, fontWeight: 800 }}>Four</a>, <a href="/mate" style={{ color: ACC_INK, fontWeight: 800 }}>Mate</a>, <a href="/check" style={{ color: ACC_INK, fontWeight: 800 }}>Check</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
