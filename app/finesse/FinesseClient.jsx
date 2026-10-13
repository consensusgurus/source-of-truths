'use client';

// Finesse — the daily double dummy.
//
// All four hands are face up. You sit South and play BOTH your hand and the
// dummy opposite; East and West are played by an exact solver that sees every
// card and never errs. One suit is trumps (Monday and Tuesday, none), and the
// contract asks for a fixed number of the tricks available.
//
// WHY IT IS A PUZZLE AND NOT A CARD GAME. Nothing is hidden and nothing is
// shuffled at play time, so there is no luck anywhere in it: the contract is
// either there or it is not, and the deal was banked only if best play against
// best defence takes exactly the number asked for. A line that survives this
// defence is proved, not lucky, which is the same promise Taire makes with its
// par and the End Game titles make with a forced mate.
//
// THE DECK IS THE WEEK. Ace down to nine is Thursday; Monday is four ranks and
// no trumps, the Sunday Edition is the full eight. A bigger deck is a deeper
// tree and a later separation point, so the week ramps without adding a single
// rule. The rules are the same three every day: follow suit if you can, the
// highest card of the suit led wins, a trump beats anything that is not one.
//
// Coming up short does not lose the day. The board rewinds to trick one and the
// miss column is Tries, the Check and Turn manner: nothing is spent but the
// clock, which is also the tiebreak. keepsAnswer is true, so a finished board
// shows the winning line trick by trick — the line is the whole content of the
// puzzle, and a solved board that will not print it is a wasted asset.
//
// Same daily plumbing as Hands and Taire: banked deals gated by Eastern date on
// the server (app/finesse/page.js), per-puzzle localStorage saves, /finesse?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Undo2, RotateCcw } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold from '../useEndHold';
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
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import {
  RANK_NAMES, SUIT_GLYPH, SUITS, suitOf, rankOf, isNS, bits, parseHand, handOrder,
  makeSolver, analyse,
} from '@/lib/finesse-core';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#4c1d95',        // Finesse identity on the slate row only
  accentDeep: '#3b1580',
  accentSoft: '#ede9fe',
  green: T.successDeep,
};
// THE BOARD (round four, 2026-10-13): a compass table on a felt tinted with
// the category accent, the trick in a round well in the middle. Card faces
// are paper in both registers, as Crib's are: white, near-black and red ink.
const FELT = 'color-mix(in srgb, var(--stg-acc, #4c1d95) 9%, var(--stg-cell, #ffffff))';
const CARD_FACE = '#ffffff';
const CARD_EDGE = 'rgba(22,24,29,0.30)';
const RED_PIP = '#b91c1c';
const BLACK_PIP = '#16181d';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = SANS;
const HELP_KEY = 'sot_finesse_help_seen';
const STATS_KEY = 'sot_finesse_stats';

const POINTS_BY_TRY = [10, 8, 6, 4];
const pointsFor = (tries) => POINTS_BY_TRY[Math.min(Math.max(tries, 1) - 1, POINTS_BY_TRY.length - 1)];
const TRICK_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

function pickPuzzle(puzzles, forceNum) {
  if (!puzzles.length) return null;
  if (forceNum) {
    const hit = puzzles.find((p) => p.num === forceNum);
    if (hit) return hit;
  }
  return puzzles[puzzles.length - 1];
}
function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
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
  const beat = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, beat, cur, max };
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
    rec[p.num] = { s: sc, t: 10, g: null, won: sc > 0 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { ok: [7], big: [10, 30, 16], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// plays is every card played this attempt, in order, all four seats. The whole
// position is derivable from it, which is what makes take-back and the rewind
// one line each and keeps the save file to a list of small integers.
const freshState = () => ({ v: 1, plays: [], tries: 1, status: 'playing', t0: null, tEnd: null });

// One card face. Sized by its container (width set by the row it sits in,
// height by aspect ratio), and its type is sized off its own width with
// container units, so a Sunday's eight cards and a Monday's four read alike.
// Under 46px wide the corner index gives way to one centred rank and suit.
function CardFace({ card, R, trump = false }) {
  const s = suitOf(card, R);
  const red = s === 1 || s === 2;
  const rk = RANK_NAMES[R][rankOf(card, R)];
  return (
    <span className="fn-face" style={{ color: red ? RED_PIP : BLACK_PIP }}>
      <span className="fn-ix"><b>{rk}</b><span>{SUIT_GLYPH[s]}</span></span>
      <span className="fn-pip">{SUIT_GLYPH[s]}</span>
      <span className="fn-mini"><b>{rk}</b><span>{SUIT_GLYPH[s]}</span></span>
      {trump && <span className="fn-tr" aria-hidden="true" />}
    </span>
  );
}

export default function FinesseClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_finesse_${PUZZLE.num}`;
  const searchParams = useSearchParams();

  const R = PUZZLE.ranks;
  const TRUMP = PUZZLE.trump ? SUITS.indexOf(PUZZLE.trump) : -1;
  const TARGET = PUZZLE.target;
  const START = useMemo(
    () => [PUZZLE.north, PUZZLE.east, PUZZLE.south, PUZZLE.west].map((h) => parseHand(h, R)),
    [PUZZLE, R],
  );
  // ONE SOLVER FOR THE WHOLE DEAL, so its table survives from trick to trick.
  // The first defensive decision on a Sunday searches a 32-card tree; every one
  // after it is a lookup. That is also why the warm-up below matters.
  const solver = useMemo(() => makeSolver(R, TRUMP), [R, TRUMP, PUZZLE.num]);

  const [g, setG] = useState(freshState);
  const gRef = useRef(g);
  const [stats, setStats] = useState({ v: 1, rec: {} });
  const [identity, setIdentity] = useState(null);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showLine, setShowLine] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [toast, setToast] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [countdown, setCountdown] = useState('');
  const [thinking, setThinking] = useState(false);
  const toastTimer = useRef(null);
  const endHold = useEndHold();

  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  // The position, rebuilt from the play list. Cheap: it is at most 32 bit
  // clears, and it means there is exactly one description of the game state.
  const pos = useMemo(() => {
    let m = START.slice(), seat = 2, played = [], led = -1, ns = 0, ew = 0;
    const tricks = [], seats = [];
    for (const card of g.plays) {
      seats.push(seat);
      m = m.slice();
      m[seat] &= ~(1 << card);
      played = played.concat([{ seat, card }]);
      if (played.length === 1) led = suitOf(card, R);
      if (played.length === 4) {
        const w = solver.trickWinner(played);
        if (isNS(w)) ns++; else ew++;
        tricks.push({ cards: played, winner: w });
        played = []; led = -1; seat = w;
      } else seat = (seat + 1) % 4;
    }
    return { m, seat, played, led, ns, ew, tricks, seats };
  }, [g.plays, START, R, solver]);

  const cardsLeft = pos.m[0] | pos.m[1] | pos.m[2] | pos.m[3];
  const dealt = !cardsLeft && !pos.played.length;
  const made = pos.ns >= TARGET;
  const playing = g.status === 'playing';
  const done = g.status === 'done';
  const short = g.status === 'short';
  const started = !!g.t0;
  const preStart = !started && playing;
  const myTurn = playing && started && isNS(pos.seat) && !!cardsLeft;

  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('finesse');
  const STAGE = isStage('finesse', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('finesse');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('finesse'), '--stg-acc-lt': gameColorLight('finesse'), '--stg-onramp-lt': gameOnrampLight('finesse'), '--stg-acc-ink-lt': gameAccentInkLight('finesse') };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';

  const finalScore = done ? pointsFor(g.tries) : 0;
  const misses = Math.max(0, g.tries - 1);
  const won = done;

  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.plays)) { setG(saved); gRef.current = saved; }
      }
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
  }, [STORE_KEY]);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        if (g.status !== 'playing' || g.t0) localStorage.setItem('sot_finesse_day', JSON.stringify({ d: etToday(), done: g.status === 'done' }));
        else localStorage.removeItem('sot_finesse_day');
      }
    } catch (e) {}
  }, [g, STORE_KEY, PUZZLE, puzzles]);

  // WARM THE TABLE WHILE THE PLAYER READS. A double dummy is looked at for a
  // good few seconds before the first card is tapped, and the expensive search
  // is the FIRST one; every later position is already in the table. Doing it
  // when the board opens means the defence answers instantly for the whole
  // deal, rather than pausing once in the middle of the hand.
  useEffect(() => {
    if (!started) return;
    let cancelled = false;
    const id = setTimeout(() => { if (!cancelled) { try { solver.boundary(START, 2); } catch (e) {} } }, 60);
    return () => { cancelled = true; clearTimeout(id); };
  }, [started, solver, START]);

  useEffect(() => {
    if (!g.t0 || g.tEnd) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [g.t0, g.tEnd]);

  useEffect(() => {
    if (playing) return;
    const t = setInterval(() => setCountdown(fmtCountdown(msToMidnightET())), 1000);
    setCountdown(fmtCountdown(msToMidnightET()));
    return () => clearInterval(t);
  }, [playing]);

  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    try {
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    } catch (e) {}
  }, [PUZZLE.quizId]);

  useEffect(() => {
    const em = identity && identity.email;
    if (!em) return;
    fetch(`/api/quiz/daily-game?game=finesse&email=${encodeURIComponent(em)}`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((s) => mergeServerStats(s, d.recent, puzzles)); })
      .catch(() => {});
  }, [identity, puzzles]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'finesse', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'finesse', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'finesse', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'finesse', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'finesse', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_finesse_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.plays.length || cur.status === 'done') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: Math.max(0, cur.tries - 1), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const score = pointsFor(g2.tries);
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: Math.max(0, g2.tries - 1), won: true })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: 1, guessesUsed: Math.max(0, g2.tries - 1), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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
  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  // A card is legal if it follows the suit led, or the hand is void in it.
  function legal(m, seat, led, card) {
    if (led < 0) return true;
    const hasLed = bits(m[seat]).some((c) => suitOf(c, R) === led);
    return !hasLed || suitOf(card, R) === led;
  }

  function playCard(card) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (!cur.t0) { startGame(); return; }
    if (!isNS(pos.seat) || !legal(pos.m, pos.seat, pos.led, card)) return;
    const plays = [...cur.plays, card];
    vibrate(HAPT.ok);
    commit({ ...cur, plays });
  }

  // The defence answers on its own, one card at a time, so a trick plays out at
  // a readable pace instead of appearing complete.
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0) return;
    if (!cardsLeft) return;
    if (isNS(pos.seat)) return;
    let cancelled = false;
    setThinking(true);
    const id = setTimeout(() => {
      if (cancelled) return;
      let card;
      try { card = solver.defend(pos.m, pos.seat, pos.played, pos.led); }
      catch (e) { card = bits(pos.m[pos.seat])[0]; }
      setThinking(false);
      if (card == null) return;
      const cur = gRef.current;
      commit({ ...cur, plays: [...cur.plays, card] });
    }, 340);
    return () => { cancelled = true; clearTimeout(id); setThinking(false); };
  }, [g.plays, g.status, g.t0, pos, cardsLeft, solver]);

  // The deal is over: either the contract came home, or the board rewinds.
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0) return;
    if (cardsLeft || pos.played.length) return;
    if (!g.plays.length) return;
    const cur = gRef.current;
    if (pos.ns >= TARGET) {
      const finished = { ...cur, status: 'done', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(finished);
      endHold.hold(1400);
      commit(finished);
    } else {
      vibrate(HAPT.big);
      commit({ ...cur, status: 'short' });
    }
  }, [g.plays, g.status, g.t0, cardsLeft, pos, TARGET]);

  // Take back your last card, and the defence's answers with it: a tap must
  // never cost anything a player did not choose.
  function takeBack() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.plays.length) return;
    let cut = -1;
    for (let i = pos.seats.length - 1; i >= 0; i--) if (isNS(pos.seats[i])) { cut = i; break; }
    if (cut < 0) return;
    commit({ ...cur, plays: cur.plays.slice(0, cut) });
  }

  // Coming up short costs a try and the clock, and nothing else.
  function rewind() {
    const cur = gRef.current;
    commit({ ...cur, plays: [], status: 'playing', tries: cur.tries + 1 });
    setShowLine(false);
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setEndClosed(false); setShowLine(false);
  }

  // THE LINE IS DERIVED, NEVER BANKED. It comes out of the same solver the
  // defence uses, so the answer the archive prints and the opponent the player
  // met cannot drift apart. Computed only when asked for, on a board that is
  // already over.
  const line = useMemo(() => {
    if (!showLine) return null;
    try { return analyse(R, TRUMP, START, TARGET, solver); } catch (e) { return null; }
  }, [showLine, R, TRUMP, START, TARGET, solver]);

  function shareUrl() { return withRef(`mindloftdaily.com/finesse${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const tryBit = g.tries === 1 ? 'first try' : `${g.tries} tries`;
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const trumpBit = PUZZLE.trump ? `${SUIT_GLYPH[TRUMP]} trumps` : 'no trumps';
    return `Finesse #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${TRICK_WORD[TARGET]} of ${R}, ${trumpBit} · ${tryBit} · ${elapsed}${streakBit}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing || short
      ? `Finesse #${PUZZLE.num} — the daily double dummy from Mind Loft. ${TRICK_WORD[TARGET].replace(/^./, (c) => c.toUpperCase())} of ${R} tricks are there.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="All four hands are face up. Play South and the dummy against a defence that never errs."
      banner={<>Today is <b>{R} cards</b> a hand, {PUZZLE.trump ? <><b>{SUIT_GLYPH[TRUMP]} trumps</b></> : <b>no trumps</b>}, and the contract is <b>{TRICK_WORD[TARGET]} of {R}</b>. It is exactly makeable: best play takes {TRICK_WORD[TARGET]} and never more.</>}
      chips={[
        { label: 'Follow suit if you can' },
        { label: 'Highest of the suit led wins' },
        { label: PUZZLE.trump ? 'A trump beats anything else' : 'No trumps today' },
      ]}
      steps={[
        <>You play <b>two hands</b>: your own at the bottom and the <b>dummy</b> opposite. Tap a card to play it, and the defenders answer at once.</>,
        <>Everything is face up, so nothing is a guess. The only question is the <b>order</b> you play them in.</>,
        <>Come up short and the board <b>rewinds to trick one</b>. Nothing is lost but the clock, and the clock is the tiebreak.</>,
      ]}
      knack="Cashing a winner is rarely the move. Ask which hand you need to be in next, and play the card that gets you there."
      note={<>The deck runs ace down to {RANK_NAMES[R][0]} and every card of it is on the table, so what you can see is genuinely all there is. It grows through the week: four cards a hand on Monday, the full eight on Sunday.</>}
    />
  );

  const handFor = (seat) => handOrder(pos.m[seat], R);
  const trickAt = (seat) => {
    const hit = pos.played.find((p) => p.seat === seat);
    return hit ? hit.card : null;
  };

  // ---- everything the table reads, derived from the play list ----
  // Nothing here is new information: the winner of a trick in progress is the
  // three printed rules applied to cards already face up on the table.
  const SEAT_WORD = ['Dummy', 'East', 'You', 'West'];
  const SEAT_CAPS = ['DUMMY', 'EAST', 'YOU', 'WEST'];
  const SUIT_WORD = ['spades', 'hearts', 'diamonds', 'clubs'];
  const cardTxt = (c) => `${RANK_NAMES[R][rankOf(c, R)]}${SUIT_GLYPH[suitOf(c, R)]}`;
  const leaderOf = (played) => {
    let best = played[0];
    for (let i = 1; i < played.length; i++) {
      const c = played[i], cs = suitOf(c.card, R), bs = suitOf(best.card, R);
      if (cs === bs) { if (rankOf(c.card, R) > rankOf(best.card, R)) best = c; }
      else if (TRUMP >= 0 && cs === TRUMP && bs !== TRUMP) best = c;
    }
    return best;
  };
  const winningSeat = pos.played.length > 1 ? leaderOf(pos.played).seat : -1;
  const trickNo = pos.tricks.length + 1;
  const need = Math.max(0, TARGET - pos.ns);
  const cap1 = (w) => w.replace(/^./, (c) => c.toUpperCase());

  // The last play, in words.
  const lastLine = (() => {
    const n = g.plays.length;
    if (!started || !n) return '';
    if (!pos.played.length) {
      const t = pos.tricks[pos.tricks.length - 1];
      const wc = t.cards.find((x) => x.seat === t.winner).card;
      return `${t.winner === 2 ? 'You' : SEAT_WORD[t.winner]} won trick ${pos.tricks.length} with the ${cardTxt(wc)}.`;
    }
    const seat = pos.seats[n - 1];
    const card = g.plays[n - 1];
    const who = SEAT_WORD[seat];
    if (pos.played.length === 1) return `${who} led the ${cardTxt(card)}.`;
    const before = leaderOf(pos.played.slice(0, -1));
    const ledS = suitOf(pos.played[0].card, R);
    const cs = suitOf(card, R);
    if (winningSeat === seat) {
      const whose = before.seat === 2 ? 'your' : before.seat === 0 ? "dummy's" : `${SEAT_WORD[before.seat]}'s`;
      return `${who} ${cs !== ledS ? 'ruffed' : 'covered'} ${whose} ${cardTxt(before.card)} with the ${cardTxt(card)}.`;
    }
    return cs === ledS ? `${who} followed with the ${cardTxt(card)}.` : `${who} discarded the ${cardTxt(card)}.`;
  })();

  // What is legal now, in words.
  const nowLine = (() => {
    if (!started) return 'Ready.';
    if (done) return `Contract made: ${TRICK_WORD[pos.ns]} of ${R}.`;
    if (!playing || !cardsLeft) return '';
    const s = pos.seat;
    if (!isNS(s)) return thinking ? `${SEAT_WORD[s]} is thinking.` : `${SEAT_WORD[s]} to play.`;
    const mine = bits(pos.m[s]);
    if (pos.led < 0) return s === 2 ? 'Your lead: any card can go.' : 'Dummy to lead: any card can go.';
    const lit = mine.filter((c) => legal(pos.m, s, pos.led, c)).length;
    if (mine.some((c) => suitOf(c, R) === pos.led)) {
      return `${s === 2 ? 'You' : 'Dummy'} must follow ${SUIT_WORD[pos.led]}: ${lit === 1 ? 'one card is' : `${TRICK_WORD[lit] || lit} cards are`} lit.`;
    }
    return `${s === 2 ? 'You have' : 'Dummy has'} no ${SUIT_WORD[pos.led]}, so any of ${s === 2 ? 'your' : 'its'} ${TRICK_WORD[lit] || lit} cards can go.`;
  })();
  const ruleLine = `Follow suit if you can. Highest of the suit led wins${PUZZLE.trump ? ', and a trump beats anything else' : ''}. Short of ${TRICK_WORD[TARGET]}, the board rewinds to trick one.`;

  const CSS = `
    /* THE TABLE (round four, 2026-10-13). One grid: North across the top,
       West / the well / East across the middle, South across the bottom. Every
       size below the 560px line comes from the same rules at smaller values,
       and the well's cards are placed in percentages of the well. */
    .fn-felt{background:${FELT};border-radius:22px;padding:16px 16px 14px;display:grid;grid-template-columns:132px minmax(0,1fr) 132px;grid-template-areas:"pn pn pn" "pw pc pe" "ps ps ps";gap:12px 10px;touch-action:manipulation;}
    .fn-n{grid-area:pn;} .fn-w{grid-area:pw;} .fn-e{grid-area:pe;} .fn-s{grid-area:ps;} .fn-c{grid-area:pc;}
    .fn-n,.fn-s{display:flex;flex-direction:column;align-items:center;gap:9px;min-width:0;}
    .fn-tag{font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#5b6475);border-radius:6px;padding:4px 9px;border:1.5px solid transparent;line-height:1.2;text-align:center;}
    .fn-tag.on{background:var(--stg-acc,${COLORS.accent});color:var(--stg-onramp,#ffffff);}
    .fn-row{display:flex;gap:7px;justify-content:center;width:100%;}
    .fn-cd{--cw:min(68px,calc((100% - (var(--n) - 1) * 7px - var(--sg)) / var(--n)));padding:0;border:0;background:none;width:var(--cw);flex:none;aspect-ratio:68/96;border-radius:9px;transition:transform .15s ease;font-family:${SANS};position:relative;}
    .fn-cd.fn-gap{margin-left:6px;}
    .fn-face{position:absolute;inset:0;box-sizing:border-box;border-radius:9px;background:${CARD_FACE};border:1.5px solid ${CARD_EDGE};box-shadow:0 2px 6px rgba(0,0,0,.22);container-type:inline-size;display:block;user-select:none;line-height:1;}
    .fn-ix{position:absolute;top:7%;left:10%;display:flex;flex-direction:column;align-items:center;}
    .fn-ix b{font-size:28cqw;font-weight:800;letter-spacing:-.03em;}
    .fn-ix span{font-size:22cqw;margin-top:1px;}
    .fn-pip{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:46cqw;padding-top:16%;}
    .fn-mini{display:none;position:absolute;inset:0;flex-direction:column;align-items:center;justify-content:center;}
    .fn-mini b{font-size:40cqw;font-weight:800;letter-spacing:-.04em;}
    .fn-mini span{font-size:36cqw;margin-top:2px;}
    @container (max-width:46px){.fn-ix,.fn-pip{display:none;}.fn-mini{display:flex;}}
    .fn-tr{position:absolute;top:6%;right:8%;width:7px;height:7px;border-radius:50%;background:var(--stg-acc-ink-lt,${COLORS.accent});}
    /* A PLAYABLE CARD HAS TO SAY SO WITHOUT A CURSOR (reader report, 2026-10-03:
       "it says it is my turn but nothing is activated"). The live cards are
       lifted and ringed at rest, and the ring sits OUTSIDE the card. */
    .fn-cd.play{cursor:pointer;transform:translateY(-5px);}
    .fn-cd.play .fn-face{border:2.5px solid var(--stg-acc,${COLORS.accent});box-shadow:0 0 0 2px ${FELT},0 0 0 3.5px var(--stg-acc,${COLORS.accent}),0 8px 14px rgba(0,0,0,.3);}
    .fn-cd.play:hover{transform:translateY(-8px);}
    .fn-cd.play:focus-visible{outline:2px solid var(--stg-ink,${COLORS.ink});outline-offset:5px;}
    .fn-cd:disabled{cursor:default;}
    .fn-side{display:flex;flex-direction:column;justify-content:center;gap:8px;min-width:0;}
    .fn-e{align-items:flex-end;}
    .fn-slab{font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#5b6475);}
    .fn-slab.on{color:var(--stg-acc-ink,${COLORS.accent});font-weight:800;}
    .fn-pills{display:flex;flex-direction:column;gap:5px;width:100%;}
    .fn-pill{height:40px;box-sizing:border-box;border-radius:7px;background:${CARD_FACE};border:1.5px solid ${CARD_EDGE};display:flex;align-items:center;gap:6px;padding:0 10px;font-family:${SANS};font-size:17px;font-weight:800;letter-spacing:-.02em;}
    .fn-pill span{font-weight:600;}
    .fn-e .fn-pill{justify-content:flex-end;}
    .fn-pill.fn-gap{margin-top:5px;}
    .fn-pill.tr{box-shadow:inset 3px 0 0 var(--stg-acc-ink-lt,${COLORS.accent});}
    .fn-e .fn-pill.tr{box-shadow:inset -3px 0 0 var(--stg-acc-ink-lt,${COLORS.accent});}
    .fn-note{font-family:${SANS};font-size:11px;font-weight:600;color:var(--stg-mute,#5b6475);line-height:1.4;}
    .fn-c{display:flex;align-items:center;justify-content:center;min-width:0;}
    .fn-well{position:relative;width:min(290px,100%);aspect-ratio:1;border-radius:50%;background:var(--stg-ground,#eef1f5);border:1.5px solid var(--stg-line,rgba(28,30,36,0.18));container-type:inline-size;box-sizing:border-box;}
    .fn-wl{position:absolute;left:0;right:0;text-align:center;font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute,#5b6475);}
    .fn-slot{position:absolute;width:23.5%;aspect-ratio:68/96;box-sizing:border-box;border-radius:9px;}
    .fn-sn{top:11.5%;left:38.25%;} .fn-ss{top:55%;left:38.25%;} .fn-sw{top:33.2%;left:6.2%;} .fn-se{top:33.2%;right:6.2%;}
    .fn-slot.empty{border:2px dashed var(--stg-cell-line,rgba(28,30,36,0.35));background:var(--stg-cell,#ffffff);}
    .fn-slot.next{border:2.5px dashed var(--stg-acc,${COLORS.accent});background:color-mix(in srgb,var(--stg-acc,${COLORS.accent}) 18%,var(--stg-cell,#ffffff));display:flex;align-items:center;justify-content:center;text-align:center;font-family:${SANS};font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--stg-acc-ink,${COLORS.accent});line-height:1.3;}
    .fn-slot .fn-face{box-shadow:0 6px 12px rgba(0,0,0,.28);}
    .fn-slot.win .fn-face{box-shadow:0 0 0 3px var(--stg-ground,#eef1f5),0 0 0 5px var(--stg-warn,#b45309);}
    .fn-win{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);font-family:${SANS};font-size:9.5px;font-weight:800;letter-spacing:.08em;color:var(--stg-warn,#b45309);background:var(--stg-ground,#eef1f5);border-radius:5px;padding:2px 5px;white-space:nowrap;z-index:2;}
    .fn-drop{animation:fndrop .18s ease-out;position:absolute;inset:0;}
    @keyframes fndrop{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}
    .fn-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px 20px;flex-wrap:wrap;margin-bottom:16px;}
    .fn-k{font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#5b6475);}
    .fn-k b{font-weight:800;}
    .fn-ct{font-family:${SANS};font-size:22px;font-weight:800;color:var(--stg-ink,${COLORS.ink});letter-spacing:-.01em;}
    .fn-cs{font-family:${SANS};font-size:12px;font-weight:600;color:var(--stg-mute,#5b6475);}
    .fn-slots{display:flex;gap:6px;align-items:flex-end;}
    .fn-ts{display:flex;flex-direction:column;align-items:center;gap:4px;}
    .fn-tb{width:var(--tw,42px);height:var(--th,56px);box-sizing:border-box;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-size:14px;font-weight:800;background:var(--stg-cell,#ffffff);border:2px solid var(--stg-cell-line,rgba(28,30,36,0.35));}
    .fn-tb.beyond{border:1.5px dashed var(--stg-line,rgba(28,30,36,0.25));}
    .fn-tb.won{background:var(--stg-acc,${COLORS.accent});border-color:var(--stg-acc,${COLORS.accent});color:var(--stg-onramp,#ffffff);}
    .fn-tb.lost{color:var(--stg-mute,#5b6475);}
    .fn-tb.now{border:2px solid var(--stg-acc,${COLORS.accent});}
    .fn-tn{font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--stg-mute,#5b6475);}
    .fn-tn.now{color:var(--stg-acc-ink,${COLORS.accent});font-weight:800;}
    .fn-status{display:flex;flex-direction:column;gap:3px;padding:14px 2px 0;}
    .fn-say{font-family:${SANS};font-size:15px;font-weight:700;line-height:1.4;color:var(--stg-ink,${COLORS.ink});}
    .fn-rule{font-family:${SANS};font-size:12px;font-weight:600;color:var(--stg-mute,#5b6475);line-height:1.45;}
    .fn-dk{display:inline;}
    .fn-ph{display:none;}
    @media (max-width:560px){
      .fn-felt{border-radius:18px;padding:12px 10px;grid-template-columns:56px minmax(0,1fr) 56px;gap:12px 6px;}
      .fn-tag{font-size:10px;padding:3px 8px;border-radius:5px;}
      .fn-row{gap:6px;}
      .fn-cd{--cw:min(60px,calc((100% - (var(--n) - 1) * 6px - var(--sg)) / var(--n)));}
      .fn-cd.fn-gap{margin-left:4px;}
      .fn-slab{font-size:9px;font-weight:800;letter-spacing:.08em;}
      .fn-e .fn-slab{text-align:right;}
      .fn-pills{gap:4px;}
      .fn-pill{height:var(--ph,30px);border-radius:6px;font-size:14px;gap:2px;padding:0;justify-content:center;}
      .fn-e .fn-pill{justify-content:center;}
      .fn-pill.fn-gap{margin-top:3px;}
      .fn-note{display:none;}
      .fn-well{width:min(200px,100%);}
      .fn-wl{font-size:9px;letter-spacing:.1em;}
      .fn-slot{border-radius:7px;}
      .fn-slot .fn-face{border-radius:7px;}
      .fn-slot.next{font-size:9px;}
      .fn-win{font-size:8.5px;bottom:-8px;}
      .fn-dk{display:none;}
      .fn-ph{display:inline;}
      .fn-head{align-items:center;margin-bottom:12px;gap:8px 12px;}
      .fn-ct{font-size:16px;}
      .fn-cs{display:none;}
      .fn-tb{width:var(--twm,24px);height:var(--thm,32px);border-radius:5px;font-size:12px;}
      .fn-slots{gap:4px;}
      .fn-tn{display:none;}
      .fn-say{font-size:14px;}
      .fn-rule{font-size:11px;}
    }
    @media (prefers-reduced-motion:reduce){.fn-drop{animation:none;}.fn-cd{transition:none;}.fn-cd.play:hover{transform:translateY(-5px);}}
    .fn-btn{font-family:${SANS};font-weight:800;font-size:13px;border:1px solid var(--stg-line2,rgba(28,30,36,0.35));background:none;color:var(--stg-ink2,#3f4757);border-radius:9px;padding:9px 14px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
    .fn-btn:disabled{opacity:0.42;cursor:default;}
    .fn-line{font-family:${MONO};font-size:12px;line-height:1.85;color:var(--stg-ink,${COLORS.ink});}
    .fn-line b{font-weight:800;color:var(--stg-acc-ink,${COLORS.accent});}
  `;

  return (
    <div style={{ minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : (LOFT ? T.navy : COLORS.cream), color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, fontFamily: SANS, position: 'relative', overflowX: 'hidden', ...(STAGE ? STAGE_ACC : null) }} className={STAGE ? 'stage-page' : undefined} data-stage-theme={STAGE ? stageTheme : undefined}>
      <Grain />
      <Cap
        game="finesse" quizId={PUZZLE.quizId} name="Finesse" num={PUZZLE.num}
        dateLabel={PUZZLE.dateLabel} sunday={PUZZLE.sunday} accent={ACC}
        onHelp={() => setShowHelp(true)}
        figures={[
          { v: `${pos.ns}/${TARGET}`, k: 'tricks' },
          { v: g.tries, k: 'tries' },
          { v: elapsed, k: 'time' },
        ]}
      />
      <DailyChrome slug="finesse" name="Finesse" collapsed={started} loft={LOFT} />

      <div style={{ position: 'relative', zIndex: 2, padding: LOFT ? '0 16px 40px' : '18px 16px 40px' }}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="finesse" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'FINESSE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 34, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 21, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Finesse is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>
                  All four hands face up, {R} cards each, {PUZZLE.trump ? <>{SUIT_GLYPH[TRUMP]} trumps</> : 'no trumps'}. You play South and the dummy against a perfect defence. Take {TRICK_WORD[TARGET]} of the {R} tricks. Tap a lit card to play it.
                </p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="fn-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? ON_ACC : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 0 : `2px solid ${COLORS.ink}`, borderRadius: STAGE ? 0 : 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>tricks <b style={{ color: INK, fontWeight: 800 }}>{pos.ns}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>tries <b style={{ color: misses > 0 ? `var(--stg-bad, ${COLORS.rust})` : INK, fontWeight: 800 }}>{g.tries}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
          </div>
          )}

          {/* The contract, and one slot per trick: filled for a trick you
              took, outlined for the one in play, solid up to the target and
              dashed beyond it. */}
          {(() => {
            const many = R > 6;
            const vars = { '--tw': many ? '34px' : '42px', '--th': many ? '46px' : '56px', '--twm': many ? '18px' : '24px', '--thm': many ? '26px' : '32px' };
            return (
              <div className="fn-head">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                  <span className="fn-k fn-dk">The contract</span>
                  <span className="fn-ct">
                    {TARGET} of {R}<span className="fn-dk"> tricks</span> &middot; {PUZZLE.trump ? <>{SUIT_GLYPH[TRUMP]} trumps</> : 'no trumps'}
                  </span>
                  <span className="fn-cs">Exactly makeable. Best play takes {TRICK_WORD[TARGET]} and never more.</span>
                  <span className="fn-k fn-ph"><b style={{ color: ACC_INK }}>{pos.ns}</b> taken &middot; {need ? <>need <b style={{ color: INK }}>{need}</b> more</> : 'contract made'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div className="fn-slots" style={vars} role="img" aria-label={`${pos.ns} of ${TARGET} tricks taken, ${pos.tricks.length} of ${R} played`}>
                    {Array.from({ length: R }).map((_, i) => {
                      const t = pos.tricks[i];
                      const now = !t && i === pos.tricks.length && started && playing && !!cardsLeft;
                      const cls = t ? (isNS(t.winner) ? 'won' : 'lost') : now ? 'now' : (i < TARGET ? '' : 'beyond');
                      return (
                        <span key={i} className="fn-ts">
                          <span className={`fn-tb ${cls}`}>{t ? (isNS(t.winner) ? '✓' : '–') : ''}</span>
                          <span className={`fn-tn${now ? ' now' : ''}`}>{now ? 'NOW' : `T${i + 1}`}</span>
                        </span>
                      );
                    })}
                  </div>
                  <span className="fn-k fn-dk"><b style={{ color: ACC_INK }}>{pos.ns}</b> taken &middot; {need ? <>need <b style={{ color: INK }}>{need}</b> more</> : 'contract made'}</span>
                </div>
              </div>
            );
          })()}

          {(() => {
            const handRow = (seat) => {
              const cards = handFor(seat);
              const groups = new Set(handOrder(START[seat], R).map((c) => suitOf(c, R))).size;
              const turn = myTurn && pos.seat === seat;
              let prevSuit = -1;
              return (
                <div className="fn-hand fn-row" style={{ '--n': R, '--sg': `${Math.max(0, groups - 1) * 6}px` }}>
                  {cards.map((card) => {
                    const gap = prevSuit >= 0 && suitOf(card, R) !== prevSuit;
                    prevSuit = suitOf(card, R);
                    const trump = TRUMP >= 0 && suitOf(card, R) === TRUMP;
                    const live = turn && legal(pos.m, seat, pos.led, card);
                    return (
                      <button key={card} type="button" className={`fn-cd${live ? ' play' : ''}${gap ? ' fn-gap' : ''}`}
                        onClick={() => playCard(card)} disabled={!live}
                        aria-label={`${RANK_NAMES[R][rankOf(card, R)]} of ${SUIT_WORD[suitOf(card, R)]}${seat === 0 ? ', dummy' : ''}${live ? ', playable' : ''}`}>
                        <CardFace card={card} R={R} trump={trump} />
                      </button>
                    );
                  })}
                </div>
              );
            };
            const tag = (seat) => {
              const base = seat === 0 ? 'North · Dummy' : 'South · You';
              if (myTurn && pos.seat === seat) return <span className="fn-tag on">{base} · Your play</span>;
              const played = trickAt(seat) != null && playing;
              return <span className="fn-tag">{base}{played ? <> · Played<span className="fn-dk"> to this trick</span></> : ''}</span>;
            };
            const side = (seat) => {
              const cards = handFor(seat);
              const on = playing && started && !!cardsLeft && pos.seat === seat;
              let prevSuit = -1;
              return (
                <div className={`fn-side ${seat === 1 ? 'fn-e' : 'fn-w'}`}>
                  <span className={`fn-slab${on ? ' on' : ''}`}>
                    {seat === 1 ? 'East' : 'West'}
                    <span className="fn-dk">{on ? ' · To play' : ' · Defender'}</span>
                  </span>
                  <div className="fn-hand fn-pills" style={{ '--ph': R > 6 ? '24px' : '30px' }}>
                    {cards.map((card) => {
                      const s = suitOf(card, R);
                      const gap = prevSuit >= 0 && s !== prevSuit;
                      prevSuit = s;
                      const trump = TRUMP >= 0 && s === TRUMP;
                      return (
                        <span key={card} className={`fn-pill${gap ? ' fn-gap' : ''}${trump ? ' tr' : ''}`} style={{ color: s === 1 || s === 2 ? RED_PIP : BLACK_PIP }}>
                          {RANK_NAMES[R][rankOf(card, R)]}<span>{SUIT_GLYPH[s]}</span>
                        </span>
                      );
                    })}
                  </div>
                  {seat === 3 && <span className="fn-note">Plays perfectly.</span>}
                </div>
              );
            };
            const leadSeat = pos.played.length ? pos.played[0].seat : -1;
            const nextSeat = playing && started && !!cardsLeft ? pos.seat : -1;
            return (
              <>
                <div className="fn-felt fn-tbl">
                  <div className="fn-n">{tag(0)}{handRow(0)}</div>
                  {side(3)}
                  <div className="fn-c">
                    <div className="fn-well" aria-label={`Trick ${Math.min(trickNo, R)}${pos.played.length ? `: ${pos.played.map((p) => `${SEAT_WORD[p.seat]} ${cardTxt(p.card)}`).join(', ')}` : ''}`}>
                      <span className="fn-wl" style={{ top: '4.8%' }}>{cardsLeft || pos.played.length ? `Trick ${trickNo}` : 'All played'}</span>
                      {[0, 1, 2, 3].map((seat) => {
                        const card = trickAt(seat);
                        const cls = seat === 0 ? 'fn-sn' : seat === 1 ? 'fn-se' : seat === 2 ? 'fn-ss' : 'fn-sw';
                        if (card != null) {
                          const win = seat === winningSeat;
                          return (
                            <div key={seat} className={`fn-slot ${cls}${win ? ' win' : ''}`}>
                              <div className="fn-drop"><CardFace card={card} R={R} trump={TRUMP >= 0 && suitOf(card, R) === TRUMP} /></div>
                              {win && <span className="fn-win">WINNING</span>}
                            </div>
                          );
                        }
                        if (seat === nextSeat) {
                          return (
                            <div key={seat} className={`fn-slot ${cls} next`}>
                              <span><span className="fn-dk">{SEAT_CAPS[seat]}<br /></span>NEXT</span>
                            </div>
                          );
                        }
                        return <div key={seat} className={`fn-slot ${cls} empty`} />;
                      })}
                      <span className="fn-wl" style={{ top: '90.3%' }}>
                        {leadSeat >= 0 ? `${SEAT_CAPS[leadSeat]} led` : nextSeat >= 0 ? `${SEAT_CAPS[nextSeat]} ${nextSeat === 2 ? 'lead' : 'leads'}` : ''}
                      </span>
                    </div>
                  </div>
                  {side(1)}
                  <div className="fn-s">{handRow(2)}{tag(2)}</div>
                </div>

                <div className="fn-status" aria-live="polite">
                  <span className="fn-say">{[lastLine, nowLine].filter(Boolean).join(' ')}</span>
                  <span className="fn-rule">
                    <span className="fn-dk">{ruleLine}</span>
                    <span className="fn-ph">Short of {TRICK_WORD[TARGET]}, the board rewinds to trick one.</span>
                  </span>
                </div>
              </>
            );
          })()}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="fn-btn" onClick={takeBack} disabled={!playing || !started || !g.plays.length}>
              <Undo2 size={14} /> Take it back
            </button>
            <button type="button" className="fn-btn" onClick={rewind} disabled={!started || done || !g.plays.length}>
              <RotateCcw size={14} /> Start the deal again
            </button>
          </div>

          {short && (
            <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 11, background: STAGE ? 'var(--stg-b1, rgba(255,255,255,0.055))' : COLORS.accentSoft, border: `1px solid ${SURF_B}` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>{TRICK_WORD[pos.ns].replace(/^./, (c) => c.toUpperCase())}, not {TRICK_WORD[TARGET]}.</div>
              <div style={{ fontSize: 13.5, color: FADED, fontWeight: 600, margin: '5px 0 12px', lineHeight: 1.5 }}>
                {TRICK_WORD[TARGET].replace(/^./, (c) => c.toUpperCase())} are there against this defence. The board rewinds to trick one; only the clock and the try count move.
              </div>
              <button type="button" className="fn-btn" onClick={rewind} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? ON_ACC : T.white }}>Try again</button>
            </div>
          )}

          {done && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button type="button" onClick={() => setShowLine((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12.5, color: FADED, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {showLine ? 'Hide the line' : 'Show the winning line'}
              </button>
              {showLine && line && (
                <div style={{ marginTop: 10, textAlign: 'left', maxWidth: 400, margin: '10px auto 0' }}>
                  <div className="fn-line">
                    {line.tricks.map((t, i) => (
                      <div key={i}>
                        {`${i + 1}. `}
                        {t.cards.map((c, j) => (
                          <span key={j} style={{ color: isNS(c.seat) ? undefined : 'var(--stg-mute, #8b95a8)' }}>
                            {j ? ' ' : ''}{'NESW'[c.seat]}{' '}
                            {isNS(c.seat) ? <b>{RANK_NAMES[R][rankOf(c.card, R)] + SUIT_GLYPH[suitOf(c.card, R)]}</b> : RANK_NAMES[R][rankOf(c.card, R)] + SUIT_GLYPH[suitOf(c.card, R)]}
                          </span>
                        ))}
                        {isNS(t.winner) ? ' · yours' : ' · theirs'}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: FADED, fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                    One line that brings {TRICK_WORD[TARGET]} home against best defence. The deal turned at trick {PUZZLE.sep || 1}: that is where the only card that still makes it separates from the ones that look just as good.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {done && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {TRICK_WORD[TARGET].replace(/^./, (c) => c.toUpperCase())} of {R}, made <span style={{ color: ACC_INK }}>{g.tries === 1 ? 'first try' : `on try ${g.tries}`}</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {g.tries === 1
                  ? 'Found at the table, first time through. Against a defence that sees every card, that is the whole game.'
                  : `It took ${g.tries} runs at it. The clock is the tiebreak, so a line found late still counts.`}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Finesse in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new deal drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/finesse?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Finesse &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/finesse" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Finesse &rarr;</a>
                    {' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
              name="Finesse"
              catRank={catRank}
              outcome={done ? 'won' : 'part'}
              challengeMetric={done ? g.tries : null}
              title={done ? 'Made' : 'Not made'}
              detail={`${finalScore}/10 · ${TRICK_WORD[TARGET]} of ${R} · ${g.tries} tr${g.tries === 1 ? 'y' : 'ies'} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Finesse all time` : 'all-time rank' }
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
                  href: `/finesse?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: done ? 'board' : 'reveal', label: done ? 'Return to board' : 'Show the line',
                  sub: done ? 'Your finished deal' : 'The line that brings it home', onClick: () => { setRevealed(true); if (!done) setShowLine(true); } },
                prevPuzzle && { tone: 'another', label: 'Play another Finesse', sub: `No. ${prevPuzzle.num}, yesterday’s deal`, href: `/finesse?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This deal again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="finesse" name="Finesse" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="finesse" name="Finesse" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
          {!focusMode && <AddToHome name="Finesse" />}
          <div id="stf-stats-slot" />
          {!LOFT && (
          <DailyGamesGrid replay={done ? resetGame : null} self="finesse" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="finesse" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
          )}
        </div>
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => setIdentity(id)} />
          </div>
        )}
        </div>
      </div>

      {/* A deal cannot be failed, only paid for, so `won` is true whenever the
          board is done and Finesse stays OUT of DEFEAT_GAMES, exactly like
          Hands. headline/subline are deprecated on this component; `score` is
          the live prop. */}
      {done && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard modal self="finesse" won completed
          score={<>{TRICK_WORD[TARGET]} of {R} &middot; {g.tries} tr{g.tries === 1 ? 'y' : 'ies'}</>}
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
            <button className="fn-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white, borderColor: COLORS.ink }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Finesse</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Finesse is a free daily double dummy from Mind Loft: a bridge-style card puzzle with all four hands face up. You play South and the dummy opposite, one suit is trumps, and the contract names how many of the tricks you have to take. The two defenders are played by an exact solver that can see every card, so there is no luck anywhere in the deal and no bidding to learn.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The rules are three lines: follow the suit led if you can, the highest card of that suit wins, and a trump beats anything that is not a trump. Every deal is banked only after a search proves the contract is exactly makeable, so a line that survives the defence is proved rather than lucky. The deck grows through the week, from four cards a hand on Monday to the full eight on the Sunday Edition, which is the same puzzle at greater depth.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new deal drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More card dailies: <a href="/hands" style={{ color: INK, fontWeight: 800 }}>Hands</a>, the daily poker solitaire, <a href="/taire" style={{ color: INK, fontWeight: 800 }}>Taire</a>, our two-suit solitaire, and <a href="/shoe" style={{ color: INK, fontWeight: 800 }}>Shoe</a>, the daily blackjack shoe.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
