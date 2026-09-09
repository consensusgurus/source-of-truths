'use client';

// Defend — the daily chess save. Mate's mirror image.
//
// Each day: a position with BLACK to play, not in check, and White already
// threatening mate. Every legal move on the board loses to a forced checkmate
// EXCEPT ONE. You are the defender, so the puzzle is not finding a brilliancy,
// it is finding the one move that is not a catastrophe, with two or three
// convincing decoys sitting next to it.
//
// You play the position out rather than just naming the move: after your save
// White keeps coming with its stubbornest try and you have to hold for the whole
// budget, two moves on a weekday and three on a Sunday. ANY legal move can be
// played, none of them are taken back, and nothing ends early: a move that
// allows the mate lands on the board and White comes and plays the mate out
// (owner rule, 2026-08-11).
//
// The board is drawn from BLACK'S SIDE, because that is who you are.
//
// HOW A MOVE IS JUDGED. The first move is checked against the bank's stored key,
// which two independent solvers agreed is the ONLY move that survives. Every
// later move is judged live by the search in ./defense.js: any move that avoids
// mate for the remaining budget is accepted, because after the key the puzzle is
// no longer about a single move, it is about not getting mated. A checkmate or a
// stalemate delivered by you ends the day in your favour at any point, whatever
// the bank says, for the same reason Mate accepts any mate: the position is the
// authority, not the stored line.
//
// All chess rules come from ../mate/chess.js, the engine Mate ships, which skips
// castling and en passant because the bank guarantees neither is ever legal.
// scripts/verify-defend.mjs refuses a board that breaks the guarantee. Promotion
// is NOT skipped and is always to a queen: thirteen boards here can reach the
// far rank inside the hold, twelve of them with YOUR pawn, and the engine used
// to walk a pawn onto rank 1 and leave it there (fixed 2026-09-09, off a player
// report on Mate, which shares this engine).

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
  parseFen, applyMove, legalMoves, legalTargetsFrom, parseUci, uci,
  squareName, colorOf, inCheck, isCheckmate, toSan, rowOf,
} from '../mate/chess';
import { makeMateSearch, stubbornestReply } from './defense';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#2f4f4f',       // Defend identity — slate, the defending stone
  accentSoft: '#e9f0ef',
  green: T.successDeep,
};
// The same walnut board Mate uses. It is chess, and a player should recognise it
// as chess before reading a word.
// The squares come off the stage's own pair now, so the board follows the light
// switch. Beech and walnut were two mid-tone woods: the brightest surface on a
// near-black page, and a palette belonging to nothing else on the site.
const LIGHT_SQ = 'var(--stg-sq-l, #efd9b5)';
const DARK_SQ = 'var(--stg-sq-d, #b58863)';
const SEL_SQ = 'rgba(47,79,79,0.55)';
const LAST_SQ = 'rgba(232,180,58,0.55)';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_defend_help_seen';
const STATS_KEY = 'sot_defend_stats';

// Pieces are inline SVG rather than the Unicode chess glyphs, which are missing
// from plenty of system fonts and render as tofu. Same paths Mate draws, on the
// conventional 45x45 chess piece grid.
const PIECE_PATH = {
  K: 'M22.5 3.2 h4.6 v4.4 h4.4 v4.6 h-4.4 v3.1 a7.4 7.4 0 0 1 4.9 6.9 c0 2.6 -1.4 4.4 -3.1 6.6 l-1.9 2.4 h6.9 a3 3 0 0 1 3 3 v3.6 h-27 v-3.6 a3 3 0 0 1 3 -3 h6.9 l-1.9 -2.4 c-1.7 -2.2 -3.1 -4 -3.1 -6.6 a7.4 7.4 0 0 1 4.9 -6.9 v-3.1 h-4.4 v-4.6 h4.4 v-4.4 z',
  Q: 'M8.4 12.6 a2.7 2.7 0 1 1 2.7 2.7 l2.3 8.2 l3.4 -9.9 a2.7 2.7 0 1 1 3.1 -0.1 l3.6 10.4 l3.6 -10.4 a2.7 2.7 0 1 1 3.1 0.1 l3.4 9.9 l2.3 -8.2 a2.7 2.7 0 1 1 2.7 -2.7 a2.7 2.7 0 0 1 -1.6 2.5 l-3.4 12.4 h-19.6 l-3.4 -12.4 a2.7 2.7 0 0 1 -1.6 -2.5 z M12.8 30.5 h19.4 l0.9 3.2 h-21.2 z M10.5 35.6 h24 a2.6 2.6 0 0 1 2.6 2.6 v3.2 h-29.2 v-3.2 a2.6 2.6 0 0 1 2.6 -2.6 z',
  R: 'M10.2 8 h4.9 v3.4 h4.6 v-3.4 h5.6 v3.4 h4.6 v-3.4 h4.9 v8.4 l-3.2 3 v12.6 l3.2 3.1 v3.7 h-24.6 v-3.7 l3.2 -3.1 v-12.6 l-3.2 -3 z',
  B: 'M22.5 4.6 a2.9 2.9 0 0 1 1.9 5.1 c2.9 2.3 6.2 6.3 6.2 11 c0 2.8 -1.2 4.8 -2.6 6.6 h-11 c-1.4 -1.8 -2.6 -3.8 -2.6 -6.6 c0 -4.7 3.3 -8.7 6.2 -11 a2.9 2.9 0 0 1 1.9 -5.1 z M13.6 29.3 h17.8 a2 2 0 0 1 0 4 h-17.8 a2 2 0 0 1 0 -4 z M10 35.3 h25 a2.6 2.6 0 0 1 2.6 2.6 v3.5 h-30.2 v-3.5 a2.6 2.6 0 0 1 2.6 -2.6 z',
  N: 'M15.4 41.4 c0.6 -6.6 3.4 -10.2 7.4 -13.6 c2.1 -1.8 2.9 -3 2.8 -4.4 l-3.8 2.6 c-1.9 1.3 -3.6 1.6 -5 0.9 c-1.9 -1 -2.4 -3.3 -1.6 -5.6 l-2.4 0.7 c-1.2 0.3 -2.1 -0.6 -1.7 -1.8 c1.6 -4.9 4.6 -9 8.6 -11.6 l0.7 -2.9 a1.3 1.3 0 0 1 2.4 -0.2 l0.8 1.8 c4.3 0.3 8.3 2.6 10.6 6.6 c2 3.4 2.6 7.6 2.6 12.6 c0 6 -0.7 10.6 -1.4 14.9 z',
  P: 'M22.5 8.4 a5.6 5.6 0 0 1 3.6 9.9 c2.4 1.5 4.1 4 4.1 7.1 c0 2.3 -0.9 4 -1.9 5.6 h-11.6 c-1 -1.6 -1.9 -3.3 -1.9 -5.6 c0 -3.1 1.7 -5.6 4.1 -7.1 a5.6 5.6 0 0 1 3.6 -9.9 z M11.6 35.7 h21.8 a2.6 2.6 0 0 1 2.6 2.6 v3.1 h-27 v-3.1 a2.6 2.6 0 0 1 2.6 -2.6 z',
};
function Piece({ code }) {
  const white = code === code.toUpperCase();
  return (
    <svg className="df-pc" viewBox="0 0 45 45" aria-hidden="true" focusable="false">
      <path
        d={PIECE_PATH[code.toUpperCase()]}
        fill={white ? T.white : '#16181d'}
        stroke={white ? '#16181d' : T.white}
        strokeWidth={white ? 2 : 1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
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

// WHITE COLLECTING THE MATE IT WAS PROMISED.
//
// Returns the first move, in legalMoves order, that forces mate inside `budget`.
// The order is fixed, so this is as deterministic as scanning them all and two
// players who throw the save away the same way meet the same execution.
//
// It EARLY-EXITS, which is the whole reason it is not just matingMoves: that
// one costs a full search of every White move, and this runs on the player's
// phone inside the reply timeout. Measured over all 801 losing first moves in
// the bank, the worst case falls from 1386ms to 516ms and 774 of them come in
// under 100ms. The free immediate-mate scan goes first for the same reason.
function firstMatingMove(search, board, budget) {
  const moves = legalMoves(board, 'w');
  for (const mv of moves) if (isCheckmate(applyMove(board, mv.from, mv.to), 'b')) return mv.uci;
  if (budget < 2) return null;
  for (const mv of moves) {
    const next = applyMove(board, mv.from, mv.to);
    const replies = legalMoves(next, 'b');
    if (!replies.length) continue;                 // stalemate, which is not a mate
    if (replies.every((r) => search.forcesMateWithin(applyMove(next, r.from, r.to), 'w', budget - 1))) return mv.uci;
  }
  return null;
}

// `doomedAt` is the save you were on when the position went, or null while it is
// still savable. It exists because the round no longer ends on the move that
// allows the mate: it is the depth the leaderboard ranks the loss by, it stops
// every later move being tallied as another miss, and it is what tells White to
// stop defending stubbornly and go and collect the mate.
function freshState() {
  return { v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null, doomedAt: null };
}

export default function DefendClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_defend_${PUZZLE.num}`;
  const START = useMemo(() => parseFen(PUZZLE.fen), [PUZZLE]);
  const HOLD = PUZZLE.holdFor;
  // Is one of YOUR pawns within reach of the first rank inside the hold? A pawn
  // advances one rank per move of its own, so the count is just how far it has
  // to go; blockers are ignored, which can only add the sentence to a board that
  // never uses it. Mate does the same thing for the same reason (MateClient's
  // canPromote).
  const canPromote = useMemo(
    () => START.board.some((p, sq) => p === 'p' && 7 - rowOf(sq) <= HOLD),
    [START, HOLD],
  );

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  // The board no longer flashes: the only thing that used to bump this was the
  // move that lost the round, and that move is now just a move.
  const [shake] = useState(0);
  const [hintPiece, setHintPiece] = useState(null);
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
  const endHold = useEndHold(1200);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('defend', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('defend'); }, [g.hintUsed]);
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

  const moves = g.moves;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('defend');
  const STAGE = isStage('defend', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('defend');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('defend'), '--stg-acc-lt': gameColorLight('defend'), '--stg-onramp-lt': gameOnrampLight('defend'), '--stg-acc-ink-lt': gameAccentInkLight('defend') };
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
  const errors = g.errors;
  // What the round posted. Read ONLY by the cap, and only once the round is
  // over: End Game never shows a running verdict.
  const endScore = won ? 10 : 0;
  // White's reply is appended a beat after your move, so an odd move count means
  // it is still in flight and the board is not yours to touch.
  const awaitingReply = moves.length % 2 === 1;

  // The live position, rebuilt from the move list. Keeping only the moves in
  // state means a save is a handful of short strings and can never drift from
  // the board.
  const pos = useMemo(() => {
    let b = START.board;
    for (const m of moves) { const { from, to } = parseUci(m); b = applyMove(b, from, to); }
    return b;
  }, [START, moves]);
  const lastMove = moves.length ? parseUci(moves[moves.length - 1]) : null;
  const myTurn = playing && started && !awaitingReply;
  const whiteInCheck = useMemo(() => inCheck(pos, 'w'), [pos]);
  const blackInCheck = useMemo(() => inCheck(pos, 'b'), [pos]);

  // Saves made so far, and therefore how much of White's budget is left. Your
  // moves sit at the even indices, so the count is half the list rounded up
  // while a reply is in flight and exactly half otherwise.
  const savesMade = Math.floor(moves.length / 2) + (awaitingReply ? 1 : 0);
  const holdLeft = Math.max(0, HOLD - savesMade);

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
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_defend_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_defend_day');
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
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'defend', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'defend', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'defend', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'defend', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'defend', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // HOW FAR THIS RUN GOT (migration 51). A loss scores 0, which would otherwise
  // leave every losing player tied and let the board rank them by who lost
  // FASTEST. This is the ranking term that separates them: saves made. Half the
  // move list used to be exactly that count, because a wrong move ended the
  // puzzle on the spot. The round plays on from 2026-08-11, so the moves after
  // the save was lost are the mate being collected rather than saves, and the
  // recorded depth comes off `doomedAt` instead.
  // It is NOT score, so a loss still earns nothing; it only orders the losers.
  function progressOf(g2) {
    if (g2.status === 'won') return HOLD;
    if (g2.doomedAt != null) return g2.doomedAt;
    return Math.floor((g2.moves || []).length / 2);
  }

  const REC_KEY = `sot_defend_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.errors > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

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

  function commit(next) { gRef.current = next; setG(next); }

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // White's answer, a beat after yours so the board reads as a game rather than
  // as two moves landing at once.
  //
  // The FIRST reply is read from the bank. That one search is much the most
  // expensive (it is the full-budget one) and precomputing it also guarantees
  // every player faces the same defence on the move that decides the day. Later
  // replies run against a smaller budget and are cheap enough to search here.
  function replyTo(board2, afterCount, doomed) {
    // The bank's replies answer the SAVE. They are not answers to a move that
    // gave the mate away, so a doomed position skips them and is searched.
    //
    // White's first TWO answers are stored, because both positions are forced
    // and so identical for every player: the key is the only save, and the
    // follow-up after White's first answer is an only-move by construction. The
    // second is stored because searching it here is not free. On a hold-for-four
    // board it measured one to three seconds on a desktop, which is a frozen
    // page on a phone.
    const stored = doomed ? null
      : afterCount === 1 ? PUZZLE.reply
      : afterCount === 3 ? PUZZLE.reply2
      : null;
    if (stored) {
      const { from, to } = parseUci(stored);
      if (legalMoves(board2, 'w').some((m) => m.from === from && m.to === to)) return stored;
    }
    // afterCount is odd here (your move has landed, White's has not), so
    // floor(afterCount / 2) is the number of saves you have already made and
    // HOLD minus that is exactly the budget White has left to mate in. This is
    // the same argument stubbornestReply is called with in the generator, where
    // the count is zero and the budget is the whole of HOLD.
    const budget = Math.max(1, HOLD - Math.floor(afterCount / 2));
    const search = makeMateSearch();
    // ONCE THE SAVE IS GONE, WHITE TAKES THE MATE. stubbornestReply is the wrong
    // tool for that and would actively refuse it: it scores a move leaving Black
    // no reply as Infinity so the engine can never hand over a stalemate, which
    // rules out the mating move along with it. So the mating moves are asked for
    // directly and White walks the line in, lowest UCI for determinism.
    // Only a doomed position has a mate to collect, so the happy path never
    // pays for the search at all.
    if (doomed) {
      const mate = firstMatingMove(search, board2, budget);
      if (mate) return mate;
    }
    const best = stubbornestReply(board2, budget, search);
    return best ? best.uci : null;
  }

  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) return;
      let b = START.board;
      for (const m of cur.moves) { const { from, to } = parseUci(m); b = applyMove(b, from, to); }
      const mv = replyTo(b, cur.moves.length, cur.doomedAt != null);
      if (!mv) return;
      commit({ ...cur, moves: [...cur.moves, mv] });
      vibrate(HAPT.ok);
    }, 620);
  }
  // A save written inside that 620ms window would restore a half-finished move
  // pair, so the reply is re-scheduled whenever the board is left waiting.
  useEffect(() => {
    if (!hydrated || !playing) return undefined;
    if (moves.length % 2 === 1) scheduleReply(moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, moves.length]);

  function finish(g2, status, score) {
    g2.status = status;
    g2.tEnd = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(g2, score);
    // A loss lands on the OPPONENT's move, so the player has not seen it yet:
    // the board holds for HOLD_LONG with the deciding move still lit and the
    // verdict line readable. A win is your own move, so it keeps the old beat.
    endHold.hold(status === 'lost' ? HOLD_LONG : HOLD_SHORT);
    commit(g2);
  }

  function tryMove(from, to) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    const move = uci(from, to);
    const decision = cur.moves.length / 2;          // 0-based: which save this is
    const budget = HOLD - decision;                 // white moves left to mate in
    const next = applyMove(pos, from, to);
    const g2 = { ...cur, moves: [...cur.moves, move] };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null);
    setHintPiece(null);

    // Ending it yourself ends it in your favour, whatever the bank stores. A
    // counter-mate is a win outright and a stalemate is a draw, and a draw is a
    // save. Same reasoning as Mate accepting any mate: the position is the
    // authority, not the stored line.
    const whiteStuck = legalMoves(next, 'w').length === 0;
    if (whiteStuck) { finish(g2, 'won', 10); return; }

    // The first move is the puzzle, and its answer was proven unique by two
    // independent solvers, so it is checked against the bank rather than
    // re-searched in the browser. Later moves are judged live: past the key any
    // move that avoids the mate is a legitimate defence.
    const survives = decision === 0
      ? move === PUZZLE.key
      : !makeMateSearch().forcesMateWithin(next, 'w', budget);

    // A MOVE THAT ALLOWS THE MATE NO LONGER ENDS THE ROUND (owner rule,
    // 2026-08-11). It used to stop dead the instant the save was gone, which
    // handed down the verdict before White had played a thing. The move is
    // played now, White comes and collects the mate it was promised, and the
    // round ends when the mate is actually on the board. That ending is already
    // handled: the effect below finishes the game the moment Black has no legal
    // move, as lost when in check and won when stalemated.
    //
    // The miss is counted once, on the move that loses the save. Every later
    // move is also unsavable and tallying those would make the count read as
    // length of play rather than as mistakes.
    if (!survives && cur.doomedAt == null) {
      g2.errors = cur.errors + 1;
      g2.doomedAt = decision;
    }
    // Reaching the end of White's budget is the hold, but only from a position
    // that was still savable. A player mated on the last save has not held.
    if (g2.doomedAt == null && decision + 1 >= HOLD) { finish(g2, 'won', 10); return; }
    vibrate(HAPT.ok);
    commit(g2);
    scheduleReply(g2.moves);
  }

  // A reply that leaves you stalemated is a draw, and a draw is a save, so the
  // board is checked after White moves too. stubbornestReply avoids these on
  // purpose, but a bank whose reply was stored before a rule change should still
  // resolve correctly rather than strand the player with no legal move.
  useEffect(() => {
    if (!hydrated || !playing || awaitingReply || !moves.length) return;
    if (legalMoves(pos, 'b').length === 0) {
      const cur = gRef.current;
      if (cur.status !== 'playing') return;
      finish({ ...cur }, inCheck(pos, 'b') ? 'lost' : 'won', inCheck(pos, 'b') ? 0 : 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, awaitingReply, moves.length]);

  function onSquare(sq) {
    if (!playing) return;
    if (!gRef.current.t0) startGame();
    if (!myTurn) return;
    const piece = pos[sq];
    if (sel === sq) { setSel(null); return; }
    if (piece && colorOf(piece) === 'b') { setSel(sq); return; }
    if (sel != null) {
      const t = legalTargetsFrom(pos, 'b', sel);
      if (t.includes(sq)) { tryMove(sel, sq); return; }
      setSel(null);
    }
  }

  const targets = useMemo(() => (sel != null && myTurn ? legalTargetsFrom(pos, 'b', sel) : []), [sel, pos, myTurn]);

  // One free hint: names the piece that saves you, never the square. It is only
  // offered on the first move, because that is the only move with one answer.
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

  // Give up: the puzzle ends, scores nothing, and the board is left exactly as
  // it stands. The saving move is NOT played out: the position is replayable and
  // printing the move spends it for good.
  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'revealed', tEnd: Date.now() };
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
    return withRef(`mindloftdaily.com/defend${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? 5 : Math.min(4, progressOf(g) * 2);
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Defend #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · held for ${HOLD} · ${errors === 0 ? 'first try' : `${errors} miss${errors === 1 ? '' : 'es'}`} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'lost'
        ? `Defend #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · mated · ${elapsed}`
        : `Defend #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Defend #${PUZZLE.num} — the daily chess save from Mind Loft.\n${shareUrl()}`
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
      lead="Survive the attack."
      banner={<>You are <b>Black</b> and you move first. White is threatening mate. At least <b>five moves</b> look like they stop it and exactly <b>one</b> does.</>}
      steps={[
        <><b>Tap one of your pieces</b> and the squares it can legally reach light up. <b>Tap one</b> to play the move.</>,
        <>Every other legal move is <b>mate in {HOLD}</b>. Not most of them. Every one.</>,
        <>Finding it only buys the next one. White answers with its best try and <b>exactly one move survives again</b>, and you have to hold for <b>{HOLD} moves</b> in all.</>,
        <>One free <b>hint</b>, on your first ever play, tells you which piece moves, never where it goes.</>,
      ]}
      knack={<>Count what each move gives away, not what it attacks. At least five moves will look like they stop the mate, and the one that holds is rarely the loudest.</>}
      note={<>You may play <b>any legal move</b> and there is <b>no take-back</b>. Nothing is refused and nothing stops early: allow the mate and White will come and play it out on the board. Mating White yourself, or being stalemated, both count as holding.{canPromote ? <> A pawn of yours that reaches the first rank <b>becomes a queen</b>.</> : null}</>}
      footer="Holding scores 10, and getting mated scores nothing, the same as giving up. Ties break on fastest time. Weekdays hold for three, Sundays hold for four."
    />
  );

  const fileLabels = 'abcdefgh'.split('');

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="defend" name="Defend" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. END GAME: the cap shows exactly what the strip showed at that moment and
          no more. The tally is kept and posted throughout but only APPEARS once
          the round is over, because a counter ticking up is itself a notice that
          the move was wrong. What is left while you play is the clock and the
          puzzle's own brief, both of which announce nothing. */}
      {LOFT && (
        <Cap gameKey="defend" quizId={PUZZLE.quizId}
          name="Defend"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: Math.max(1, holdLeft), k: 'hold for' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'misses' },
            { v: HOLD, k: 'hold for' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="df-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.df-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .df-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .df-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .df-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .df-sq{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;}
          .df-pc{display:block;width:86%;height:86%;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.25));}
          .df-dot{position:absolute;width:28%;height:28%;border-radius:50%;background:rgba(28,30,36,0.32);pointer-events:none;}
          .df-ring{position:absolute;inset:6%;border-radius:50%;border:min(1.1vw,6px) solid rgba(28,30,36,0.3);pointer-events:none;}
          .df-board.shake{animation:dfshake .34s ease;}
          @keyframes dfshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
          .df-coord{position:absolute;font-family:${MONO};font-size:min(2vw,10px);font-weight:500;opacity:.62;pointer-events:none;}
        `}</style>

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="defend"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Hold for 4</span>}
          blocks={'DEFEND'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 5 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Defend is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Black to play. White mates in {HOLD} against every move on the board but one, and finding it only buys the next one. There is no take-back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="df-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            {/* Kept and posted throughout, shown only once the round is over:
                a counter ticking up is itself a notice that the move was wrong. */}
            {!playing && <span style={{ whiteSpace: 'nowrap' }}>misses <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {playing ? <>hold for <b style={{ color: ACC_INK, fontWeight: 500 }}>{Math.max(1, holdLeft)}</b></> : <>hold for <b style={{ color: INK, fontWeight: 500 }}>{HOLD}</b></>}
            </span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            {/* Drawn from Black's side: display index d maps to square 63 - d, so
                rank 1 is at the top and your own pieces are the near ones. */}
            <div
              key={shake}
              className={`df-board${shake ? ' shake' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gridTemplateRows: 'repeat(8, minmax(0, 1fr))', aspectRatio: '1 / 1', border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 4, overflow: 'hidden', touchAction: 'manipulation' }}
            >
              {Array.from({ length: 64 }).map((_, d) => {
                const sq = 63 - d;
                const dr = d >> 3, df = d & 7;
                const dark = (dr + df) % 2 === 1;
                const piece = pos[sq];
                const white = piece && colorOf(piece) === 'w';
                const isSel = sel === sq;
                const isTarget = targets.includes(sq);
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const isHint = hintPiece === sq;
                const checked = piece && piece.toUpperCase() === 'K' &&
                  ((white && whiteInCheck) || (!white && blackInCheck));
                let bg = dark ? DARK_SQ : LIGHT_SQ;
                if (isLast) bg = `linear-gradient(${LAST_SQ},${LAST_SQ}), ${bg}`;
                if (isSel) bg = `linear-gradient(${SEL_SQ},${SEL_SQ}), ${dark ? DARK_SQ : LIGHT_SQ}`;
                if (checked) bg = `radial-gradient(circle, rgba(192,57,43,0.85) 12%, rgba(192,57,43,0.25) 62%, transparent 74%), ${dark ? DARK_SQ : LIGHT_SQ}`;
                return (
                  <div
                    key={d}
                    className="df-sq"
                    onClick={() => onSquare(sq)}
                    role="button"
                    tabIndex={-1}
                    aria-label={squareName(sq) + (piece ? ` ${white ? 'white' : 'black'} ${piece.toUpperCase()}` : ' empty')}
                    style={{ background: bg, boxShadow: isHint ? `inset 0 0 0 3px ${T.successDeep}` : undefined }}
                  >
                    {df === 0 && (
                      <span className="df-coord" style={{ left: 2, top: 1, color: dark ? LIGHT_SQ : DARK_SQ }}>{dr + 1}</span>
                    )}
                    {dr === 7 && (
                      <span className="df-coord" style={{ right: 3, bottom: 1, color: dark ? LIGHT_SQ : DARK_SQ }}>{fileLabels[7 - df]}</span>
                    )}
                    {piece && <Piece code={piece} />}
                    {isTarget && !piece && <span className="df-dot" />}
                    {isTarget && piece && <span className="df-ring" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : (endHold.held ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`) }}>
              {!playing
                ? (won ? 'You held.' : g.status === 'lost' ? 'Mated. The save is still there.' : 'You ended it there. The save is still there.')
                : awaitingReply
                  ? 'White is thinking...'
                  : moves.length === 0
                    ? `Black to play. Mate in ${HOLD} against everything else.`
                    : holdLeft <= 1
                      ? 'One more move to hold.'
                      : `Black to play, hold for ${holdLeft}.`}
            </span>
            {sanList.length > 0 && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: FADED, fontWeight: 500 }}>
                {sanList.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}... ${s}` : s)).join(' ')}
              </span>
            )}
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && !moves.length && (
                <button className="df-tool" onClick={useHint} title="Name the piece that moves (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(47,79,79,0.5)', color: '#23413f' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a bare
            row has nothing to sit on, and the card is meant to hold the game. */}
        {started && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                Tap a black piece, then tap where it goes. There is no take-back.
              </span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmRestart(false); setArmReveal(Date.now()); } }}
                  title={armReveal ? 'Ends the puzzle and scores nothing' : 'End the puzzle now, scoring nothing'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <Eye size={13} style={{ flexShrink: 0 }} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartGame(); } else { setArmReveal(false); setArmRestart(Date.now()); } }}
                  title={armRestart ? 'Records a 0 and resets the board' : 'Record a 0 and reset the board'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
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
              {/* The saving move and the idea behind it are shown ONLY to a player
                  who found them. The position is replayable, so naming the move to
                  someone who missed it spends the puzzle for good. */}
              {won ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                    The save: <span style={{ color: ACC_INK }}>{PUZZLE.keySan}</span>.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>{PUZZLE.motif}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                    {PUZZLE.parries} moves on that board answered the threat. One of them held.
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  We are not printing the move. The save is still there in the position, so take another run at it.
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; a hold for four.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Defend in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new position drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/defend?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Defend &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/defend" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Defend &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
              name="Defend"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} misses \u00b7 ${HOLD} hold for \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Defend all time` : 'all-time rank' }
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
                  href: `/defend?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Defend', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/defend?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="defend" name="Defend" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="defend" name="Defend" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="defend"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="defend" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Defend to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s position, every day.</li>
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
          self="defend"
          won={won}
          headline={won ? <>You held.</> : g.status === 'lost' ? <>Mated.</> : <>You scored 0%</>}
          subline={won
            ? <>10/10 &middot; found the save &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : g.status === 'lost' ? <>0/10 &middot; that move allowed the mate</>
            : <>0/10 &middot; the save is still in the position</>}
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
            <button className="df-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Defend</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Defend is a free daily chess puzzle from Mind Loft, and it is the other half of a mate puzzle. You are Black, White is threatening checkmate, and your job is to find the one move that survives. Tap a piece and its legal squares light up, so you never need to know chess notation to play.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          On every board, every legal move loses to a forced mate except one, checked by three independent solvers. At least five of them answer the immediate threat, which is what makes the board hard: the moves that look like a defence mostly are not one. Then you play the position out, and White's answer leaves exactly one move that survives again, because finding the save is not the same as holding the game. Any legal move can be played and none of them are taken back.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new position drops every day at midnight Eastern, and Sundays step up to a hold for four. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, the same puzzle from the attacking side, <a href="/check" style={{ color: INK, fontWeight: 800 }}>Check</a>, our daily checkers shot, and <a href="/four" style={{ color: INK, fontWeight: 800 }}>Four</a>, our daily Connect Four position.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
