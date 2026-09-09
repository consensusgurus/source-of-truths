'use client';

// Mate — the daily chess endgame.
//
// Each day: a position with White to play and forced checkmate. Weekdays are
// mate in two, Sundays step up to a mate in three Edition. Tap one of your
// pieces, tap where it goes. There is exactly ONE first move that forces mate,
// and every other move on the board fails, so the puzzle is finding the key
// rather than trying things.
//
// You play the whole line, not just the key: after your first move Black
// answers with its stiffest defence and you have to finish the job. ANY legal
// move can be played, none of them are taken back, and nothing ends early: a
// move that is not the key lands on the board and the game plays ON from there,
// with Black defending live once you are off the solution tree, until you mate
// or run out of moves (owner rule, 2026-08-11). Score is the outcome, 10 for the
// mate and nothing otherwise, and ties break on fastest time.
//
// All chess rules live in ./chess.js, a small engine that skips castling and en
// passant because the bank guarantees neither is ever legal (that file's header
// explains the guarantee). A pawn that reaches the far rank becomes a QUEEN:
// promotion used to be skipped too, on a guarantee whose arithmetic was wrong,
// and a player who promoted into mate on the 2026-09-09 board was scored a loss
// (player report, 2026-09-09). The engine was cross-checked against python-chess
// over 460,652 positions with zero disagreements, and again over 31,280
// promotion-heavy positions after the promotion fix.
//
// Same daily plumbing as Suds/Etch/Hedge: banked boards gated by Eastern date on
// the server (app/mate/page.js), per-puzzle localStorage saves, /mate?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

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
import { gameColorLight, gameColor, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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
  parseFen, applyMove, legalTargetsFrom, parseUci, uci,
  squareName, colorOf, inCheck, isCheckmate, toSan, rowOf, fileOf, legalMoves,
} from './chess';
import { makeMateSearch } from '../defend/defense';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#6b4423',       // Mate identity — board walnut
  accentSoft: '#f6efe6',
  green: T.successDeep,
};
// The board itself. Warm walnut, the colours a chess player expects, so the
// game reads as chess before a word of copy is seen.
// The squares come off the stage's own pair now, so the board follows the light
// switch. Beech and walnut were two mid-tone woods: the brightest surface on a
// near-black page, and a palette belonging to nothing else on the site.
const LIGHT_SQ = 'var(--stg-sq-l, #efd9b5)';
const DARK_SQ = 'var(--stg-sq-d, #b58863)';
const SEL_SQ = 'rgba(107,68,35,0.55)';
const LAST_SQ = 'rgba(232,180,58,0.55)';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_mate_help_seen';
const STATS_KEY = 'sot_mate_stats';

// The pieces are drawn as inline SVG rather than with the Unicode chess glyphs
// (\u2654-\u265f). Those glyphs are NOT present in every system font: on a machine
// without them the board renders six identical tofu boxes and the game is
// unplayable, which is exactly what happened on a test render here. Inline paths
// look the same everywhere and let each piece carry a contrasting outline, so a
// white piece reads on a light square and a black piece on a dark one.
// Drawn on the conventional 45x45 chess piece grid.
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
    <svg className="mt-pc" viewBox="0 0 45 45" aria-hidden="true" focusable="false">
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

// ─── Personal stats + streak (localStorage), Suds/Etch pattern ─────────────
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

// ─── solution-tree navigation ──────────────────────────────────────────────
const expectedWhite = (node) => (node ? (node.key || node.move || node.mate || null) : null);
// `moves` alternates White, Black, White, ... and BOTH sides are part of the
// path. This followed only the odd indices until 2026-08-11, so a White move
// that was not the tree's left the walk sitting on the node it started from and
// Black was handed a SCRIPTED reply belonging to a line nobody had played. On
// the 8-11 board that reply is Kf3, the answer to 1.Ke5, and after 1.Qh5+ it is
// not even legal: it puts the king back on the queen's h5-g4-f3 diagonal. The
// board went illegal and then asked for a mate in one that did not exist (owner
// report, 2026-08-11). Over the whole bank the old walk produced an ILLEGAL
// reply on 324 of 1,986 off-key first moves, across 61 of the 62 boards, and
// stubbornestDefence could never run on move one because the lookup never
// failed.
//
// Returning null the moment a White move is not the tree's is what routes Black
// to the live defence, and it also keeps the miss count honest: tryMove tallies
// only while the node is non-null, i.e. on the move that LEAVES the line rather
// than on every move after it.
function nodeAfter(solution, moves) {
  let node = solution;
  for (let i = 0; i < moves.length; i++) {
    if (!node) return null;
    if (i % 2 === 0) { if (moves[i] !== expectedWhite(node)) return null; }
    else node = node.lines ? node.lines[moves[i]] : null;
  }
  return node;
}
// How many White moves are still needed from this node. Counted from the tree
// rather than from (mateIn - moves played), because a mate in three can finish
// early down some defences and the board should say "deliver mate" when it is
// actually mate next move.
function mateDistance(node) {
  if (!node) return 0;
  if (node.mate) return 1;
  let deepest = 0;
  for (const k of Object.keys(node.lines || {})) deepest = Math.max(deepest, mateDistance(node.lines[k]));
  return 1 + deepest;
}

// Every player must face the SAME defence or the leaderboard is not comparing
// like with like, so Black's reply is chosen deterministically from the puzzle
// id rather than at random. Replies are sorted first so the choice never depends
// on object key order.
function pickReply(node, quizId) {
  // Black plays its STIFFEST defence: only the replies that hold out longest are
  // eligible, and the hash breaks ties among those. Hashing over every legal
  // reply meant a Sunday mate in three could finish in two whenever the hash
  // landed on a reply that walks into the mate early. Every Sunday board in the
  // bank has at least one such reply (owner report, 2026-08-05).
  const all = Object.keys(node.lines).sort();
  const deepest = Math.max(...all.map((k) => mateDistance(node.lines[k])));
  const replies = all.filter((k) => mateDistance(node.lines[k]) === deepest);
  let h = 2166136261;
  for (let i = 0; i < quizId.length; i++) { h ^= quizId.charCodeAt(i); h = Math.imul(h, 16777619); }
  return replies[Math.abs(h) % replies.length];
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// BLACK'S DEFENCE OFF THE SOLUTION TREE.
//
// The bank stores a reply for every position ON the line and nothing at all off
// it, because until 2026-08-11 a move off the line ended the round on the spot.
// The round plays on now, so Black needs an answer to positions no generator
// ever saw.
//
// "Stubbornest" here is the mirror of Defend's: the reply that puts mate off
// longest, measured with the SAME forced-mate search Defend and its bank
// generator use, so the site has one engine rather than two that can drift.
// forcesMateWithin takes the attacking colour as an argument, so it reads from
// this side of the board unchanged; only stubbornestReply is White-shaped, which
// is why the pick is written out here instead of imported.
//
// Among replies that hold out equally long the one that WINS THE MOST MATERIAL
// is played, and only then the lowest UCI string, which cannot tie, so two
// players who leave the line at the same position still meet the same defence.
// Depth on its own let Black walk past a free piece: 1.Qh5+ on the 8-11 board
// hangs the queen, both Kxh5 and Kf4 dodge mate inside the budget, and the bare
// UCI tie-break took g4f4 (owner report, 2026-08-11). Material never outranks
// survival, it only settles a tie, so a capture that walks into mate is still
// refused: after 1.Qg2+ Black plays Kh5 and leaves the knight alone, because
// 1...Kxf5 2.Rf2 is mate.
//
// The values live INSIDE the function on purpose: verify-endgame-playout.mjs
// lifts this one function out of the file by brace-matching, so anything it
// leans on from module scope would be undefined in the harness.
function stubbornestDefence(board, budget) {
  const search = makeMateSearch();
  const VALUE = { q: 9, r: 5, b: 3, n: 3, p: 1 };
  let best = null;
  for (const mv of legalMoves(board, 'b')) {
    const next = applyMove(board, mv.from, mv.to);
    // The shallowest depth at which White can still force mate. A reply White
    // cannot punish inside the whole budget scores budget + 1 and wins outright.
    let survives = budget + 1;
    for (let n = 1; n <= budget; n++) {
      if (search.forcesMateWithin(next, 'w', n)) { survives = n; break; }
    }
    const gain = VALUE[String(board[mv.to] || '').toLowerCase()] || 0;
    const better = !best
      || survives > best.survives
      || (survives === best.survives && gain > best.gain)
      || (survives === best.survives && gain === best.gain && mv.uci < best.uci);
    if (better) best = { uci: mv.uci, survives, gain };
  }
  return best;
}

function freshState() {
  return { v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

export default function MateClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_mate_${PUZZLE.num}`;
  const START = useMemo(() => parseFen(PUZZLE.fen), [PUZZLE]);
  // Does the board have a pawn of yours that could reach the eighth rank inside
  // the budget? A pawn advances one rank per move whether it pushes or captures,
  // so the row index IS the number of moves it needs. Blockers are ignored,
  // which only ever says yes where the answer is no: this decides one sentence
  // of rules copy, and the cost of that sentence on a board where the pawn turns
  // out to be stuck is nil, while leaving it off a board where it promotes is
  // exactly the surprise this is here to prevent.
  const canPromote = useMemo(
    () => START.board.some((p, sq) => p === 'P' && rowOf(sq) <= PUZZLE.mateIn),
    [START, PUZZLE],
  );

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);           // selected square, or null
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
  // Hold the end card back so the move that ended the game is visible first.
  const endHold = useEndHold(1200);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('mate', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('mate'); }, [g.hintUsed]);
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
  const LOFT = isLoft('mate');
  // The register comes from the shared store, not from a private effect, so
  // the switch in the cap repaints this root without a prop between them.
  // Still resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE = isStage('mate', searchParams);
  // THE ACCENT AS A VARIABLE. It is only ever used as a CSS colour, so
  // every call site below themes itself and none of them had to be found.
  // The literals are published on the root element instead.
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('mate');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('mate'), '--stg-acc-lt': gameColorLight('mate'), '--stg-onramp-lt': gameOnrampLight('mate'), '--stg-acc-ink-lt': gameAccentInkLight('mate') };
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  // THE ACCENT AS TEXT. On the light register the accent has two values,
  // because three of the ten category steps are pastels chosen to be a FILL
  // carrying dark ink, and a pastel cannot also be ink on paper (gold was
  // 1.68:1 on the light ground, amber 1.47). --stg-acc still paints; this
  // writes. On the dark register the two resolve to the same value.
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  // The last-move wash is the accent, so on the light register it has to become
  // the accent's dark twin rather than staying the pale gold of the dark one.
  const LAST_TINT = STAGE ? 'color-mix(in srgb, var(--stg-acc) 55%, transparent)' : LAST_SQ;
  const won = g.status === 'won';
  const errors = g.errors;
  // What the round posted. Read ONLY by the cap, and only once the round is
  // over: End Game never shows a running verdict.
  const finalScore = won ? 10 : 0;
  const endScore = finalScore;
  // Black's reply is appended a beat after White's move, so an odd move count
  // means the reply is still in flight and the board is not yours to touch.
  const awaitingReply = moves.length % 2 === 1;

  // The live position, rebuilt from the move list. Keeping only the moves in
  // state means a save is four short strings and can never drift from the board.
  const pos = useMemo(() => {
    let b = START.board;
    for (const m of moves) { const { from, to } = parseUci(m); b = applyMove(b, from, to); }
    return b;
  }, [START, moves]);
  const lastMove = moves.length ? parseUci(moves[moves.length - 1]) : null;
  const myTurn = playing && started && !awaitingReply;
  const whiteInCheck = useMemo(() => inCheck(pos, 'w'), [pos]);
  const blackInCheck = useMemo(() => inCheck(pos, 'b'), [pos]);
  // Moves left for White, for the "mate in N" line above the board. This is
  // WHITE'S BUDGET, not the tree's distance. mateDistance reads the solution
  // tree, so a player who left it would watch the count collapse to "deliver
  // mate" and learn from the header that the line was gone. Moves made against
  // the puzzle's own mate-in-N is identical to the tree distance while you are
  // on the line, and keeps counting honestly once you are not.
  const movesLeft = Math.max(0, PUZZLE.mateIn - Math.ceil(moves.length / 2));

  // SAN of everything played, for the move list under the board.
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

  // WHY YOUR MOVE DID NOT COUNT.
  //
  // A player reported "there appears to be multiple mates, but it only accepts
  // 1" (2026-08-26, board 28). Nothing was wrong with the board: an exhaustive
  // sweep of the bank says every position has exactly ONE first move that forces
  // mate in the stated number, and the client refuses nothing, it plays every
  // legal move out to the end. What that player had found is a move that DOES
  // force mate, one move slower than the puzzle asks, which is true of about
  // HALF the legal first moves on a weekday board (768 of 1,671, measured).
  // Losing to one of those with no explanation reads as the game turning down a
  // real mate, so a finished loss now says which it was.
  //
  // Only the FIRST move is diagnosed, and only when it was not the key. Silence
  // therefore covers both "you played the key and lost the finish" and "your
  // move forces nothing", so it never tells a replaying player which of the two
  // they did, and the winning line is still never shown (revealEnd's rule: the
  // key is for solvers).
  //
  // Deferred to a timeout so the search never delays the move that ended the
  // round. The cap is mateIn + 1, one move past the ask: 3ms typical and 17ms
  // worst on a weekday board, 83ms / 300ms on a Sunday. One move deeper is
  // minutes rather than milliseconds, so it is not on offer.
  const [slowMate, setSlowMate] = useState(null);
  useEffect(() => {
    const over = g.status === 'lost' || g.status === 'revealed';
    const first = moves[0];
    const key = PUZZLE.solution ? PUZZLE.solution.key : null;
    if (!over || !first || first === key) { setSlowMate(null); return undefined; }
    let dead = false;
    const id = setTimeout(() => {
      let found = null;
      try {
        const { from, to } = parseUci(first);
        const after = applyMove(START.board, from, to);
        const search = makeMateSearch();
        for (let n = 1; n <= PUZZLE.mateIn; n++) {
          if (search.forcesMateWithin(after, 'w', n)) {
            found = { san: toSan(START.board, from, to), depth: n + 1 };
            break;
          }
        }
      } catch (e) { found = null; }
      if (!dead && found && found.depth > PUZZLE.mateIn) setSlowMate(found);
    }, 0);
    return () => { dead = true; clearTimeout(id); };
  }, [g.status, moves, PUZZLE, START]);

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
        if (done || g.t0) localStorage.setItem('sot_mate_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_mate_day');
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
  const iq = useIqStanding({ game: 'mate', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'mate', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'mate', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'mate', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'mate', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_mate_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.errors > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // HOW FAR THIS RUN GOT (migration 51). A loss here scores 0, which used to
  // leave every losing player tied and let the board rank them by who lost
  // FASTEST. This is the ranking term that separates them: the moves played on
  // the line. It can no longer be read off the move count alone: until the round
  // played on (2026-08-11) every White move in the list was correct by
  // construction, the first wrong one having ended the puzzle. A player can now
  // leave the line and keep moving, so the depth is White's moves less the one
  // that left it.
  // It is NOT score, so a loss still earns nothing; it only orders the losers,
  // deepest first, with the clock settling the rest.
  function progressOf(g2) {
    const whiteMoves = Math.ceil((g2.moves || []).length / 2);
    return Math.max(0, whiteMoves - (g2.errors || 0));
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

  function commit(next) { gRef.current = next; setG(next); }

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // Append Black's scripted defence a beat after White's move, so the board
  // reads as a game rather than as two moves landing at once.
  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) return;
      const n = nodeAfter(PUZZLE.solution, cur.moves);
      let b = START.board;
      for (const m of cur.moves) { const { from, to } = parseUci(m); b = applyMove(b, from, to); }
      // ON the tree the bank picks the defence, so everyone playing the line
      // faces the same one. OFF it there is nothing stored, so Black defends
      // live.
      let mv = n && n.lines ? pickReply(n, PUZZLE.quizId) : null;
      // A stored reply is only ever legal in the position it was generated for.
      // nodeAfter is what keeps the two in step; this is the backstop that puts
      // a tree bug on the floor rather than on the board.
      if (mv && !legalMoves(b, 'b').some((m) => m.uci === mv)) mv = null;
      if (!mv) {
        const best = stubbornestDefence(b, Math.max(1, PUZZLE.mateIn - Math.ceil(cur.moves.length / 2)));
        mv = best ? best.uci : null;
      }
      if (!mv) {
        // Black has no legal move and is not mated, which is stalemate: the game
        // is over and the mate never came. Same conclusion as running out of
        // budget, so it is scored the same way. (A real mate is caught in
        // tryMove, so control cannot reach here on a win.)
        const done = { ...cur, status: 'lost', tEnd: Date.now() };
        vibrate(HAPT.wrong);
        postResult(done, 0);
        endHold.hold(HOLD_LONG);
        commit(done);
        return;
      }
      commit({ ...cur, moves: [...cur.moves, mv] });
      vibrate(HAPT.ok);
    }, 620);
  }
  // A save made in that 620ms window would restore a half-finished move pair, so
  // the reply is re-scheduled whenever the board is left waiting for one.
  useEffect(() => {
    if (!hydrated || !playing) return undefined;
    if (moves.length % 2 === 1) scheduleReply(moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, moves.length]);

  function tryMove(from, to) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    const move = uci(from, to);
    const n = nodeAfter(PUZZLE.solution, cur.moves);
    const want = expectedWhite(n);
    const nextMoves = [...cur.moves, move];
    const g2 = { ...cur, moves: nextMoves };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null);
    setHintPiece(null);
    // A CHECKMATE IS A WIN, whatever the tree stores. The bank records exactly
    // one mating move per terminal node, but a position can have several: on the
    // 2026-08-08 board the tree says Rb1# while Qb1# mates just as dead, and a
    // player who found the queen was told "you missed it" (owner report,
    // Darrren1, 2026-08-08). 26 of the 62 banked boards carry at least one such
    // dual. The puzzle asks you to force mate in N, so any legal move that ends
    // the game inside N is a solve, and this is checked BEFORE the key test so
    // it covers the alternative mate and the mate that arrives a move early
    // alike. It cannot be reached before the mate is really on the board:
    // isCheckmate is the same routine the SAN '#' suffix uses.
    if (isCheckmate(applyMove(pos, from, to), 'b')) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      endHold.hold(HOLD_SHORT);
      commit(g2);
      return;
    }
    // OFF THE KEY IS NOT THE END OF THE ROUND (owner rule, 2026-08-11). The
    // puzzle used to stop dead on the first move that was not the bank's key,
    // which handed down the verdict before the player had played a single move
    // of the line. Every legal move is played now and Black keeps answering,
    // from the bank on the line and from a live search off it, until White
    // either mates or runs out of moves. Two things fall out of that and both
    // are wanted: a DUAL mate the bank does not store now wins on its merits,
    // and a player who blunders gets to see the position lost rather than being
    // told it was.
    //
    // The miss is counted only on the move that LEAVES the line. Once off it
    // every move is "not the key", and tallying each one would make the miss
    // count read as length of play rather than as mistakes.
    if (n && move !== want) g2.errors = cur.errors + 1;
    if (n && n.mate && move === want) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      endHold.hold(HOLD_SHORT);
      commit(g2);
      return;
    }
    // Budget spent with no mate on the board: that is the conclusion, and it is
    // a loss. Tested here rather than after Black's answer so the round never
    // asks for a reply to a move that can have no follow-up.
    if (Math.ceil(nextMoves.length / 2) >= PUZZLE.mateIn) {
      g2.status = 'lost';
      g2.tEnd = Date.now();
      vibrate(HAPT.wrong);
      postResult(g2, 0);
    // A loss lands on the OPPONENT's move, so the player has not seen it yet:
    // the board holds for HOLD_LONG with the deciding move still lit and the
    // verdict line readable. A win is your own move, so it keeps the old beat.
      endHold.hold(HOLD_LONG);
      commit(g2);
      return;
    }
    vibrate(HAPT.ok);
    commit(g2);
    scheduleReply(nextMoves);
  }

  function onSquare(sq) {
    if (!playing) return;
    if (!gRef.current.t0) startGame();
    if (!myTurn) return;
    const piece = pos[sq];
    if (sel === sq) { setSel(null); return; }
    if (piece && colorOf(piece) === 'w') { setSel(sq); return; }
    if (sel != null) {
      const targets = legalTargetsFrom(pos, 'w', sel);
      if (targets.includes(sq)) { tryMove(sel, sq); return; }
      setSel(null);
    }
  }

  const targets = useMemo(() => (sel != null && myTurn ? legalTargetsFrom(pos, 'w', sel) : []), [sel, pos, myTurn]);

  // One free hint: names the piece to move, never the square, so the player
  // still has to find the move.
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const n = nodeAfter(PUZZLE.solution, cur.moves);
    const want = expectedWhite(n);
    if (!want) return;
    const from = parseUci(want).from;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    setHintPiece(from);
    const names = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
    say(`It is the ${names[(pos[from] || 'P').toUpperCase()]} that moves.`);
  }

  // Give up: the puzzle ends and scores 0, and the board is left exactly as it
  // stands. This used to play the mating line out so the answer sat on the
  // board, but a mate-in-N is worth replaying and showing the line spends the
  // puzzle for good, so the key is now shown only to a solver.
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

  // A replay deals the same board again with the clock already running. The start
  // tile exists to keep the FIRST attempt's timer honest; a replay never becomes
  // the recorded result, so re-reading the directions is pure friction.
  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setArmReveal(false);
    setArmRestart(false);
    commit({ ...freshState(), t0: Date.now() });
    setSel(null); setHintPiece(null); setEndClosed(false);
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
      postResult({ ...cur, status: 'revealed', tEnd: Date.now() }, 0);
    }
    resetGame();
  }

  function shareUrl() {
    return withRef(`mindloftdaily.com/mate${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Mate #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · mate in ${PUZZLE.mateIn} · ${errors === 0 ? 'first try' : `${errors} miss${errors === 1 ? '' : 'es'}`} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'lost'
        ? `Mate #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · no mate · ${elapsed}`
        : `Mate #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Mate #${PUZZLE.num} — the daily chess endgame from Mind Loft.\n${shareUrl()}`
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
      lead="Find the mate."
      banner={<>You are <b>White</b> and you move first. There is a forced <b>checkmate in {PUZZLE.mateIn}</b> moves on the board.</>}
      steps={[
        <><b>Tap one of your pieces</b> and the squares it can legally reach light up. <b>Tap one</b> to play the move.</>,
        <>Play the whole line, not just the key. Black answers with its best defence, and you have to <b>finish the job</b>{PUZZLE.mateIn > 2 ? ', twice over on a Sunday' : ''}.</>,
        <>One free <b>hint</b>, on your first ever play, tells you which piece moves, never where it goes.</>,
      ]}
      knack={<>Count Black&rsquo;s escapes before you commit. The key is the move that leaves the defence no answer, not the loudest check.</>}
      note={<>Exactly <b>one</b> first move forces mate; every other move, however forcing it looks, lets Black wriggle out. You may play <b>any legal move</b> and there is <b>no take-back</b>. Nothing is refused and nothing stops early: Black keeps defending, and the round ends when you deliver mate or run out of moves.{canPromote ? <> A pawn of yours that reaches the eighth rank <b>becomes a queen</b>.</> : null}</>}
      footer="The mate scores 10, and missing it scores nothing, the same as giving up. Ties break on fastest time. Weekdays are mate in two, Sundays step up to mate in three."
    />
  );

  const fileLabels = 'abcdefgh'.split('');

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="mate" name="Mate" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. END GAME: the cap shows exactly what the strip showed at that moment and
          no more. The tally is kept and posted throughout but only APPEARS once
          the round is over, because a counter ticking up is itself a notice that
          the move was wrong. What is left while you play is the clock and the
          puzzle's own brief, both of which announce nothing. */}
      {LOFT && (
        <Cap gameKey="mate" quizId={PUZZLE.quizId}
          progress={moves.length / Math.max(1, PUZZLE.mateIn * 2 - 1)}
          name="Mate"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: Math.max(1, movesLeft), k: 'mate in' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'misses' },
            { v: PUZZLE.mateIn, k: 'mate in' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="mt-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.mt-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .mt-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid var(--blue-deep);background:${STAGE ? 'transparent' : 'var(--white)'};color:var(--blue-deep);border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .mt-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .mt-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2,rgba(255,255,255,0.17))' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .mt-sq{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;}
          .mt-pc{display:block;width:86%;height:86%;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.25));}
          .mt-dot{position:absolute;width:28%;height:28%;border-radius:50%;background:rgba(28,30,36,0.32);pointer-events:none;}
          .mt-ring{position:absolute;inset:6%;border-radius:50%;border:min(1.1vw,6px) solid rgba(28,30,36,0.3);pointer-events:none;}
          .mt-board.shake{animation:mtshake .34s ease;}
          @keyframes mtshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
          .mt-coord{position:absolute;font-family:${MONO};font-size:min(2vw,10px);font-weight:500;opacity:.62;pointer-events:none;}
        `}</style>

        <div style={{ maxWidth: 660, margin: '0 auto' }}>


        {!LOFT && (
        <DailyMasthead
          slug="mate"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Mate in 3</span>}
          blocks={'MATE'.split('').map((ch, i) => (
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
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Mate is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>White to play and force checkmate in {PUZZLE.mateIn}. Tap a piece, tap where it goes. Only one first move works, and there is no take-back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="mt-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={STAGE
          ? { background: 'transparent', border: 'none', borderRadius: 0, padding: 0, boxShadow: 'none', marginBottom: 12 }
          : { background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing them
              twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {/* Kept and posted throughout, shown only once the round is over:
                a counter ticking up is itself a notice that the move was wrong. */}
            {!playing && <span style={{ whiteSpace: 'nowrap' }}>misses <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {playing ? <>mate in <b style={{ color: ACC_INK, fontWeight: 500 }}>{Math.max(1, movesLeft)}</b></> : <>mate in <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.mateIn}</b></>}
            </span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <div
              key={shake}
              className={`mt-board${shake ? ' shake' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gridTemplateRows: 'repeat(8, minmax(0, 1fr))', aspectRatio: '1 / 1', border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 4, overflow: 'hidden', touchAction: 'manipulation' }}
            >
              {Array.from({ length: 64 }).map((_, sq) => {
                const r = rowOf(sq), f = fileOf(sq);
                const dark = (r + f) % 2 === 1;
                const piece = pos[sq];
                const white = piece && colorOf(piece) === 'w';
                const isSel = sel === sq;
                const isTarget = targets.includes(sq);
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const isHint = hintPiece === sq;
                const checked = piece && piece.toUpperCase() === 'K' &&
                  ((white && whiteInCheck) || (!white && blackInCheck));
                let bg = dark ? DARK_SQ : LIGHT_SQ;
                if (isLast) bg = `linear-gradient(${LAST_TINT},${LAST_TINT}), ${bg}`;
                if (isSel) bg = `linear-gradient(${SEL_SQ},${SEL_SQ}), ${dark ? DARK_SQ : LIGHT_SQ}`;
                if (checked) bg = `radial-gradient(circle, rgba(192,57,43,0.85) 12%, rgba(192,57,43,0.25) 62%, transparent 74%), ${dark ? DARK_SQ : LIGHT_SQ}`;
                return (
                  <div
                    key={sq}
                    className="mt-sq"
                    onClick={() => onSquare(sq)}
                    role="button"
                    tabIndex={-1}
                    aria-label={squareName(sq) + (piece ? ` ${white ? 'white' : 'black'} ${piece.toUpperCase()}` : ' empty')}
                    style={{ background: bg, boxShadow: isHint ? `inset 0 0 0 3px ${T.successDeep}` : undefined }}
                  >
                    {f === 0 && (
                      <span className="mt-coord" style={{ left: 2, top: 1, color: dark ? LIGHT_SQ : DARK_SQ }}>{8 - r}</span>
                    )}
                    {r === 7 && (
                      <span className="mt-coord" style={{ right: 3, bottom: 1, color: dark ? LIGHT_SQ : DARK_SQ }}>{fileLabels[f]}</span>
                    )}
                    {piece && <Piece code={piece} />}
                    {isTarget && !piece && <span className="mt-dot" />}
                    {isTarget && piece && <span className="mt-ring" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : (endHold.held ? `var(--stg-ink, ${COLORS.ink})` : FADED) }}>
              {!playing
                ? (won ? 'Checkmate.' : g.status === 'lost' ? 'Out of moves. The mate is still there.' : 'You ended it there. The mate is still there.')
                : awaitingReply
                  ? 'Black is thinking...'
                  : movesLeft <= 1
                    ? 'Deliver mate.'
                    : `White to play, mate in ${movesLeft}.`}
            </span>
            {sanList.length > 0 && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: FADED, fontWeight: 500 }}>
                {sanList.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s)).join(' ')}
              </span>
            )}
          </div>

          {slowMate && (
            <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: FADED, lineHeight: 1.45 }}>
              <b style={{ color: INK, fontWeight: 800 }}>{slowMate.san}</b>{' '}
              forces mate too, but in {slowMate.depth}, not {PUZZLE.mateIn}. Only a mate in
              exactly {PUZZLE.mateIn} counts here.
            </div>
          )}

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && (
                <button className="mt-tool" onClick={useHint} title="Name the piece that moves (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(107,68,35,0.5)', color: '#5c3a1e' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a bare
            row has nothing to sit on, and the card is meant to hold the game. */}
        {started && (
          /* Armed labels stay SHORT and each button reserves a fixed width: the
             old armed copy was far wider than the resting label, so the row
             reflowed on the first tap and the button slid out from under the
             reader's finger. The consequence prints below the row instead. */
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                Tap a white piece, then tap where it goes. There is no take-back.
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
              {/* The key move and the mating pattern are shown ONLY to a solver.
                  The position is replayable, so naming the move to someone who
                  missed it spends the puzzle for good. */}
              {won ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                    The key: <span style={{ color: ACC_INK }}>{PUZZLE.keySan}</span>.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>{PUZZLE.motif}.</div>
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  We are not printing the move. The forced mate is still there in the position, so take another run at it.
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; a mate in three.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Mate in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new position drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/mate?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Mate &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/mate" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Mate &rarr;</a>
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
              name="Mate"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} misses \u00b7 ${PUZZLE.mateIn} mate in \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Mate all time` : 'all-time rank' }
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
                  href: `/mate?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Mate', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/mate?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="mate" name="Mate" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="mate" name="Mate" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="mate"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="mate" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Mate to your Home Screen</div>
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
          self="mate"
          won={won}
          headline={won ? <>Checkmate!</> : g.status === 'lost' ? <>You missed it.</> : <>You scored 0%</>}
          subline={won
            ? <>10/10 &middot; found the key &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : g.status === 'lost' ? <>0/10 &middot; the mate never came</>
            : <>0/10 &middot; the mate is still in the position</>}
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
            <button className="mt-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Mate</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Mate is a free daily chess puzzle from Mind Loft. Every position has White to play and a forced checkmate, and your job is to find it. Tap a piece and its legal squares light up, so you never need to know chess notation to play.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Each board has exactly one first move that works, verified by two independent solvers, and the mate is in exactly the stated number of moves, never fewer. You play the line out to the end: Black answers your key move with its best defence and you have to finish. Any legal move can be played and none of them are taken back, so a move that does not force mate simply costs you one of the moves you needed.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new position drops every day at midnight Eastern, and Sundays step up to a mate in three. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/etch" style={{ color: INK, fontWeight: 800 }}>Etch</a>, our daily nonogram, <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku, and <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
