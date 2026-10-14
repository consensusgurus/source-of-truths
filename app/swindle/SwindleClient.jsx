'use client';

// Swindle, the daily "White to play and draw".
//
// Each day: White to move and badly lost. Black is up at least five points and
// threatening mate. Exactly ONE first move saves the game by force: a
// stalemate, a perpetual check that runs into a threefold repetition, or a win
// of so much material that nobody can mate. Every other first move is a forced
// mate within three. You play White and play the draw out; nothing ends early
// and nothing on the board says whether the draw is still there (owner rule,
// 2026-08-11, "NOTHING TELLS YOU THE ROUND IS LOST WHILE YOU CAN STILL PLAY").
//
// HOW A MOVE IS JUDGED. The bank stores a BOOK per board: every line on which
// White keeps the draw inside the budget, with Black's reply on each. A White
// move that is not in the current node throws the draw away; it is counted,
// once, and shown only after the conclusion. From then on Black answers live
// with blackDefence from lib/swindle-core.js, the same function the book's
// replies were computed with, so the defence is one program on and off the
// book. A draw on the board is a solve whatever the book says: the position is
// the authority, not the stored line.
//
// All chess rules come from ../mate/chess.js (no castling, no en passant, a
// pawn on the far rank becomes a queen); scripts/verify-swindle.mjs refuses a
// board that could need the first two.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, Smartphone, RotateCcw } from 'lucide-react';
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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import {
  parseFen, applyMove, legalMoves, legalTargetsFrom, parseUci, uci,
  squareName, colorOf, inCheck, toSan, rowOf,
} from '../mate/chess';
import { posKey, extendHist, conclusion, blackDefence, bookStep, makeDrawSearch } from '@/lib/swindle-core';
import { makeMateSearch } from '../defend/defense';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { SwBoard } from './SwBoard';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#9a3412',       // Swindle identity, a burnt orange: the last ember of a lost game
  accentSoft: '#fdeee4',
  green: T.successDeep,
};

const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_swindle_help_seen';
const STATS_KEY = 'sot_swindle_stats';

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p && p.fen) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today && p.fen);
  return open.length ? open[open.length - 1] : puzzles.find((p) => p.fen) || puzzles[0];
}
function todayNumOf(puzzles) {
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1].num : puzzles[0].num;
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

// ─── Personal stats + streak (localStorage), the shared daily pattern ──────
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
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max };
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

// Walk the move list from the start: the board, the repetition history since
// the last capture or pawn move, where we are in the book, and the tallies.
// Keeping only the moves in state means a save is a handful of short strings
// and can never drift from the board.
function walk(START, PUZZLE, moves) {
  let b = START.board;
  let hist = [posKey(b, 'w')];
  let node = PUZZLE.book || null;   // White-to-move book node, or null off the book
  let entry = null;                 // the book entry after a White move
  let onBook = !!node;
  let kept = 0, threw = 0, wMoves = 0;
  for (let i = 0; i < moves.length; i++) {
    const { from, to } = parseUci(moves[i]);
    const white = i % 2 === 0;
    const nb = applyMove(b, from, to);
    hist = extendHist(hist, b, from, to, nb, white ? 'b' : 'w');
    b = nb;
    if (white) {
      wMoves++;
      const st = onBook ? bookStep(node, moves[i]) : { hold: false };
      if (onBook && st.hold) { kept++; entry = node[moves[i]]; }
      else { if (onBook) threw++; onBook = false; entry = null; }
      node = null;
    } else {
      if (onBook && Array.isArray(entry) && entry[0] === moves[i]) node = entry[1] || null;
      else onBook = false;
      entry = null;
    }
  }
  return { board: b, hist, node, entry, onBook, kept, threw, wMoves };
}

function freshState() {
  return { v: 1, moves: [], hintUsed: false, status: 'playing', end: null, t0: null, tEnd: null };
}

const END_LINE = {
  stalemate: 'Stalemate. Nobody can move, and the game is a draw.',
  repetition: 'The same position, a third time. A draw by repetition.',
  material: 'Nothing left that can mate. A draw.',
  whitemates: 'Checkmate, by you. Better than a draw.',
  mated: 'Checkmated. The draw is still in the position.',
  budget: 'Out of moves, and no draw on the board. It is still in there.',
  revealed: 'You ended it there. The draw is still in the position.',
};

export default function SwindleClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_swindle_${PUZZLE.num}`;
  const START = useMemo(() => parseFen(PUZZLE.fen), [PUZZLE]);
  const BUDGET = PUZZLE.budget;
  const canPromote = useMemo(
    () => START.board.some((p, sq) => p === 'P' && rowOf(sq) <= BUDGET),
    [START, BUDGET],
  );

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [hintPiece, setHintPiece] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const endHold = useEndHold(1200);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('swindle', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('swindle'); }, [g.hintUsed]);
  const [, setPlayer] = useState(null);
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

  const moves = g.moves;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('swindle');
  const STAGE = isStage('swindle', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('swindle');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('swindle'), '--stg-acc-lt': gameColorLight('swindle'), '--stg-onramp-lt': gameOnrampLight('swindle'), '--stg-acc-ink-lt': gameAccentInkLight('swindle') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const won = g.status === 'won';

  // Black's reply is appended a beat after yours, so an odd move count means it
  // is still in flight and the board is not yours to touch.
  const awaitingReply = moves.length % 2 === 1;
  const W = useMemo(() => walk(START, PUZZLE, moves), [START, PUZZLE, moves]);
  const pos = W.board;
  // THE TALLY. Kept from the first move and posted, shown only once the round
  // is over: a counter ticking up is itself a notice that the move was wrong.
  const errors = W.threw;
  const lastMove = moves.length ? parseUci(moves[moves.length - 1]) : null;
  const myTurn = playing && started && !awaitingReply;
  const whiteInCheck = useMemo(() => inCheck(pos, 'w'), [pos]);
  const blackInCheck = useMemo(() => inCheck(pos, 'b'), [pos]);
  const movesLeft = Math.max(0, BUDGET - W.wMoves);

  const sanList = useMemo(() => {
    let b = START.board;
    const out = [];
    for (const m of moves) {
      const { from, to } = parseUci(m);
      out.push(toSan(b, from, to));
      b = applyMove(b, from, to);
    }
    return out;
  }, [START, moves]);

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

  // ---- persistence ----
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
      if (PUZZLE.num === todayNumOf(puzzles)) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_swindle_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_swindle_day');
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
  const isTodays = PUZZLE.num === todayNumOf(puzzles);
  const iq = useIqStanding({ game: 'swindle', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'swindle', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'swindle', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'swindle', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'swindle', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, todayNumOf(puzzles));

  // HOW FAR THIS RUN GOT (migration 51): the White moves played that kept the
  // forced draw. A loss scores 0, and this is what orders the losers, deepest
  // first. It is NOT score.
  function progressOf(moveList) {
    return walk(START, PUZZLE, moveList).kept;
  }

  const REC_KEY = `sot_swindle_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const w = walk(START, PUZZLE, cur.moves);
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: w.threw, progress: w.kept, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const w = walk(START, PUZZLE, g2.moves);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: w.threw, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: w.threw, progress: w.kept, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function finish(g2, status, end) {
    g2.status = status;
    g2.end = end;
    g2.tEnd = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(g2, status === 'won' ? 10 : 0);
    // A loss lands on Black's move, so the player has not seen it yet: the board
    // holds for HOLD_LONG with the deciding move lit and the verdict readable.
    endHold.hold(status === 'won' ? HOLD_SHORT : HOLD_LONG);
    commit(g2);
  }

  // After every ply: has the game concluded? `toMove` is the side now to move.
  // A draw of any kind, or White mating, is a solve; White mated is a loss; and
  // once Black has answered White's last budgeted move with no draw on the
  // board, the round is lost.
  function settle(g2, w) {
    const toMove = g2.moves.length % 2 === 0 ? 'w' : 'b';
    const c = conclusion(w.board, toMove, w.hist);
    if (c === 'mate') { finish(g2, toMove === 'b' ? 'won' : 'lost', toMove === 'b' ? 'whitemates' : 'mated'); return true; }
    if (c) { finish(g2, 'won', c); return true; }
    if (toMove === 'w' && w.wMoves >= BUDGET) { finish(g2, 'lost', 'budget'); return true; }
    return false;
  }

  // Black's answer, a beat after yours so the board reads as a game. On the
  // book it is read from the bank (stored, and the same function's answer); off
  // it, blackDefence searches here. Either way every player who reaches the
  // same position meets the same reply.
  function replyTo(cur) {
    const w = walk(START, PUZZLE, cur.moves);
    if (w.onBook && Array.isArray(w.entry)) {
      const { from, to } = parseUci(w.entry[0]);
      if (legalMoves(w.board, 'b').some((m) => m.from === from && m.to === to)) return w.entry[0];
    }
    const def = blackDefence(w.board, w.hist, Math.max(0, BUDGET - w.wMoves), { mate: makeMateSearch(), draw: makeDrawSearch() });
    return def ? def.uci : null;
  }

  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) return;
      const mv = replyTo(cur);
      if (!mv) return;
      const g2 = { ...cur, moves: [...cur.moves, mv] };
      if (!settle(g2, walk(START, PUZZLE, g2.moves))) { commit(g2); vibrate(HAPT.ok); }
    }, 620);
  }
  // A save written inside that window would restore a half-finished pair, so the
  // reply is re-scheduled whenever the board is left waiting.
  useEffect(() => {
    if (!hydrated || !playing) return undefined;
    if (moves.length % 2 === 1) scheduleReply(moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, moves.length]);

  function tryMove(from, to) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    const g2 = { ...cur, moves: [...cur.moves, uci(from, to)] };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null);
    setHintPiece(null);
    // Every move gets the same neutral tick: a buzz on the move that threw the
    // draw away would be a notice you can feel.
    if (settle(g2, walk(START, PUZZLE, g2.moves))) return;
    vibrate(HAPT.ok);
    commit(g2);
    scheduleReply(g2.moves);
  }

  function onSquare(sq) {
    if (!playing) return;
    if (!gRef.current.t0) startGame();
    if (!myTurn) return;
    const piece = pos[sq];
    if (sel === sq) { setSel(null); return; }
    if (piece && colorOf(piece) === 'w') { setSel(sq); return; }
    if (sel != null) {
      const t = legalTargetsFrom(pos, 'w', sel);
      if (t.includes(sq)) { tryMove(sel, sq); return; }
      setSel(null);
    }
  }

  const targets = useMemo(() => (sel != null && myTurn ? legalTargetsFrom(pos, 'w', sel) : []), [sel, pos, myTurn]);

  // One free hint, first play only: names and rings the piece that makes the
  // saving move, never the square it goes to.
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed || cur.moves.length) return;
    const from = parseUci(PUZZLE.key).from;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    setHintPiece(from);
    const names = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
    say(`It is the ${names[(pos[from] || 'P').toUpperCase()]} that moves.`);
  }

  // Give up: the round ends, scores nothing, and the board is left as it stands.
  // The saving move is NOT played out: the position is replayable.
  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'revealed', end: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    endHold.hold(HOLD_SHORT);
    commit(g2);
    setSel(null);
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setArmReveal(false);
    setArmRestart(false);
    commit({ ...freshState(), t0: Date.now() });
    setSel(null); setHintPiece(null); setEndClosed(false);
  }

  function restartGame() {
    const cur = gRef.current;
    if (cur.status === 'playing' && cur.t0) {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      postResult({ ...cur, status: 'revealed', tEnd: Date.now() }, 0);
    }
    resetGame();
  }

  function shareUrl() {
    return withRef(`mindloftdaily.com/swindle${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  // No answers in the share: one square per White move, green while the draw
  // was kept, red on the move that let it go, grey after that.
  function shareText() {
    const ws = Math.ceil(moves.length / 2);
    let sq = '';
    for (let i = 0; i < ws; i++) sq += i < W.kept ? '\u{1F7E9}' : i === W.kept && W.threw ? '\u{1F7E5}' : '⬜';
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Swindle #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · drew it · ${errors === 0 ? 'clean' : `${errors} slip`} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'lost'
        ? `Swindle #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · lost · ${elapsed}`
        : `Swindle #${PUZZLE.num} · gave up`;
    return `${head}\n${sq}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Swindle #${PUZZLE.num}, White to play and draw, from Mind Loft.\n${shareUrl()}`
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
      lead="White to play and draw."
      banner={<>A draw saves you three ways: <b>stalemate</b> (the side to move has no legal move and is not in check), <b>perpetual check</b> (you check the king again and again until the same position comes up a <b>third time</b>, which is a draw by repetition), or leaving so little on the board that <b>nobody can checkmate</b>.</>}
      steps={[
        <>You are <b>White</b> and you are lost: Black is far ahead and threatening mate. Exactly <b>one</b> first move forces a draw. Every other first move gets you mated within <b>three</b> Black moves.</>,
        <><b>Tap one of your pieces</b> and the squares it can legally reach light up. <b>Tap one</b> to play the move. Black answers on its own.</>,
        <>Then <b>play the draw out</b>. Black tries hard to avoid it, and you have <b>{BUDGET} moves</b> to reach it.</>,
        <>One free <b>hint</b>, on your first ever play, shows which piece makes the saving move, never where it goes.</>,
      ]}
      knack={<>Losing your last free piece can be the point. If your king and pawns cannot move, the capture that wins your rook may leave you with no legal move at all.</>}
      note={<>You may play <b>any legal move</b> and there is <b>no take-back</b>. Nothing stops early and nothing on the board says how you are doing: let the draw slip and Black will play for the mate.{canPromote ? <> A pawn of yours that reaches the eighth rank <b>becomes a queen</b>.</> : null}</>}
      footer="A draw scores 10, and so does mating Black. Getting mated, running out of moves or giving up scores nothing. Ties break on fewest tries, then fastest time. The Sunday Edition is the deepest draw of the week."
    />
  );

  const verdict = !playing ? (END_LINE[g.end] || (won ? 'A draw.' : END_LINE.revealed)) : null;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="swindle" name="Swindle" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="swindle" quizId={PUZZLE.quizId}
          name="Swindle"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: movesLeft, k: 'moves left' },
          ] : [
            { v: errors, k: 'slips' },
            { v: BUDGET, k: 'moves' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sw-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sw-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .sw-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sw-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sw-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="swindle"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
          blocks={'SWINDLE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 36, height: 42, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 6 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Swindle is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>White to play and draw. Every first move but one gets you mated, and you have {BUDGET} moves to reach the draw. There is no take-back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sw-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {!playing && <span style={{ whiteSpace: 'nowrap' }}>slips <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>moves left <b style={{ color: ACC_INK, fontWeight: 500 }}>{movesLeft}</b></span>
          </div>
          )}

          <SwBoard
            pos={pos}
            sel={sel}
            targets={targets}
            lastMove={lastMove}
            hintSq={hintPiece}
            whiteInCheck={whiteInCheck}
            blackInCheck={blackInCheck}
            onSquare={onSquare}
          />

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? ACC_INK : (endHold.held ? INK : FADED) }}>
              {!playing
                ? verdict
                : awaitingReply
                  ? 'Black is thinking...'
                  : moves.length === 0
                    ? 'White to play and draw.'
                    : movesLeft <= 1
                      ? 'Your last move.'
                      : `White to play. ${movesLeft} moves left.`}
            </span>
            {sanList.length > 0 && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: FADED, fontWeight: 500 }}>
                {sanList.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s)).join(' ')}
              </span>
            )}
          </div>

          <div role="list" aria-label="Four ways to draw" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[['Stalemate', 'your turn, no legal move, not in check'], ['Perpetual check', 'check after check, forever'], ['Threefold', 'the same position three times'], ['Bare kings', 'too little left for anyone to mate']].map(([n, t]) => (
              <span key={n} role="listitem" title={t} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999, color: INK, boxShadow: `inset 0 0 0 1px ${STAGE ? 'var(--stg-line, rgba(255,255,255,.12))' : 'rgba(28,30,36,0.18)'}` }}>{n}</span>
            ))}
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && !moves.length && (
                <button className="sw-tool" onClick={useHint} title="Show the piece that makes the saving move (one hint, first play only)">
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {started && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.10)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                Tap a white piece, then tap where it goes. There is no take-back.
              </span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmRestart(false); setArmReveal(Date.now()); } }}
                  title={armReveal ? 'Ends the puzzle and scores nothing' : 'End the puzzle now, scoring nothing'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <Eye size={13} style={{ flexShrink: 0 }} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartGame(); } else { setArmReveal(false); setArmRestart(Date.now()); } }}
                  title={armRestart ? 'Records a 0 and resets the board' : 'Record a 0 and reset the board'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <RotateCcw size={13} style={{ flexShrink: 0 }} /> {armRestart ? 'Press again' : 'Restart'}
                </button>
              </span>
            </div>
            {(armReveal || armRestart) && (
              <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: `var(--stg-ink, ${COLORS.rust})`, marginTop: 6, textAlign: 'right', lineHeight: 1.4 }}>
                {armReveal ? 'Ends the puzzle and scores nothing.' : 'Records a 0 and resets the board.'}
              </div>
            )}
          </div>
        )}
        </div>
      )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && !endHold.held && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              {/* The saving move is shown ONLY to a player who found it. The
                  position is replayable, so naming it to someone who missed it
                  spends the puzzle for good. */}
              {won && W.kept > 0 ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                    The swindle: <span style={{ color: ACC_INK }}>{PUZZLE.keySan}</span>.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                    {PUZZLE.legal - 1} other first moves were on the board, and every one of them was mate within three.
                    {errors > 0 ? ' You let the draw slip once on the way and got it back anyway.' : ''}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  We are not printing the move. The draw is still there in the position, so take another run at it.
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, the deepest draw of the week.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Swindle in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new position drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/swindle?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Swindle &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}
                    <a href="/swindle" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Swindle &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
              name="Swindle"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${errors} ${errors === 1 ? 'slip' : 'slips'} · ${W.wMoves} of ${BUDGET} moves · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Swindle all time` : 'all-time rank' }
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
                  href: `/swindle?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Swindle', sub: `No. ${prevPuzzle.num}, yesterday’s puzzle`, href: `/swindle?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
      </div>

        {!STAGE && <GamePanel self="swindle" name="Swindle" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="swindle" name="Swindle" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="swindle"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="swindle" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Swindle to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s position, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s position, every day.
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

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard
          modal
          self="swindle"
          won={won}
          headline={won ? <>You drew it.</> : g.status === 'lost' ? <>{g.end === 'budget' ? 'Out of moves.' : 'Mated.'}</> : <>You scored 0%</>}
          subline={won
            ? <>Solved &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>Not solved &middot; the draw is still in the position</>}
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
            <button className="sw-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Swindle</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Swindle is a free daily chess puzzle from Mind Loft with a twist on the usual one: you are White, you are lost, and your job is to save half a point. A draw comes three ways. Stalemate is when the side to move has no legal move and is not in check. A perpetual check keeps checking the king until the same position appears a third time, which is a draw by repetition. And if so little is left that nobody could ever checkmate, the game is drawn on the spot.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          On every board exactly one first move forces the draw, and every other legal first move loses to a forced mate within three, checked by two independent chess programs. Tap a piece and its legal squares light up, so you never need chess notation. Then play it out: Black defends on its own and tries hard to dodge the draw, and you have a fixed number of moves to reach it. Any legal move can be played and none of them are taken back.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new position drops every day at midnight Eastern, the week runs from a one-move stalemate on Monday to longer perpetuals and traps by Saturday, and the Sunday Edition is the deepest draw of the week. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More chess: <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, the attacking side of the board, and <a href="/defend" style={{ color: INK, fontWeight: 800 }}>Defend</a>, the one move that survives.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
