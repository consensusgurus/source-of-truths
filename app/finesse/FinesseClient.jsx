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
// Same answer the board palette pass gave Hands, Taire and Shoe: the felt
// carried no information and was the largest object on the page, so it is a
// SURFACE and the table EDGE carries the category. A card face is light in
// either register, so it takes the token a chessboard light square does.
const FELT = 'var(--stg-surf2, #23303f)';
const FELT_EDGE = 'color-mix(in srgb, var(--stg-acc, #4c1d95) 60%, transparent)';
const CARD_FACE = 'var(--stg-sq-l, #fdfcf9)';
const CARD_EDGE = 'rgba(20,22,28,0.30)';
const RED_PIP = 'var(--stg-bad, #c8282e)';
const BLACK_PIP = T.ink;
const SLOT = 'var(--stg-cell, rgba(255,255,255,0.06))';
const SLOT_LINE = 'var(--stg-cell-line, rgba(255,255,255,0.30))';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_finesse_help_seen';
const STATS_KEY = 'sot_finesse_stats';

const SEAT_NAME = ['North', 'East', 'South', 'West'];
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

function CardFace({ card, R, size = 'md', dim = false, trump = false }) {
  const s = suitOf(card, R);
  const red = s === 1 || s === 2;
  const big = size === 'lg';
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: big ? 8 : 5, background: CARD_FACE,
      border: `1px solid ${CARD_EDGE}`,
      boxShadow: trump ? `inset 0 0 0 1.5px ${FELT_EDGE}` : 'none',
      color: red ? RED_PIP : BLACK_PIP, fontFamily: SANS, fontWeight: 800,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1, userSelect: 'none', opacity: dim ? 0.55 : 1,
    }}>
      <span style={{ fontSize: big ? 22 : 'clamp(11px,3.6vw,15px)', letterSpacing: '-0.04em' }}>{RANK_NAMES[R][rankOf(card, R)]}</span>
      <span style={{ fontSize: big ? 19 : 'clamp(10px,3vw,13px)', marginTop: 1 }}>{SUIT_GLYPH[s]}</span>
    </div>
  );
}

// A hand held sideways. East and West are read, never played from, so their
// cards are chips rather than cards: one line each, and six of them stack in
// the width a single upright card would need.
function SideCard({ card, R, trump }) {
  const s = suitOf(card, R);
  const red = s === 1 || s === 2;
  return (
    <div style={{
      height: 20, borderRadius: 4, background: CARD_FACE, border: `1px solid ${CARD_EDGE}`,
      boxShadow: trump ? `inset 0 0 0 1.5px ${FELT_EDGE}` : 'none',
      color: red ? RED_PIP : BLACK_PIP, fontFamily: SANS, fontWeight: 800, fontSize: 11,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, lineHeight: 1,
    }}>
      <span style={{ letterSpacing: '-0.03em' }}>{RANK_NAMES[R][rankOf(card, R)]}</span>
      <span>{SUIT_GLYPH[s]}</span>
    </div>
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

  const seatOrder = [0, 3, 1, 2];
  const handFor = (seat) => handOrder(pos.m[seat], R);
  const trickAt = (seat) => {
    const hit = pos.played.find((p) => p.seat === seat);
    return hit ? hit.card : null;
  };

  const turnLine = !started ? 'Ready'
    : !cardsLeft ? ''
    : pos.seat === 2 ? 'Your turn'
    : pos.seat === 0 ? 'Play the dummy'
    : `${SEAT_NAME[pos.seat]} to play`;

  const CSS = `
    .fn-felt{background:${FELT};border:9px solid ${FELT_EDGE};border-radius:12px;padding:10px 8px;touch-action:manipulation;}
    .fn-tbl{display:grid;grid-template-columns:52px minmax(0,1fr) 52px;grid-template-areas:"pn pn pn" "pw pc pe" "ps ps ps";gap:7px;}
    .fn-n{grid-area:pn;} .fn-w{grid-area:pw;} .fn-e{grid-area:pe;} .fn-s{grid-area:ps;} .fn-c{grid-area:pc;}
    .fn-seat{display:flex;flex-direction:column;gap:3px;min-width:0;}
    .fn-lbl{font-family:${MONO};font-size:8.5px;letter-spacing:0.13em;text-transform:uppercase;color:var(--stg-mute,rgba(255,255,255,0.6));text-align:center;padding-bottom:2px;border-bottom:1.5px solid transparent;}
    .fn-seat.on .fn-lbl{color:var(--stg-acc-ink,#e879f9);border-bottom-color:var(--stg-acc,#e879f9);}
    .fn-hand{display:flex;gap:3px;justify-content:center;}
    .fn-w .fn-hand,.fn-e .fn-hand{flex-direction:column;gap:2px;}
    .fn-cd{padding:0;border:0;background:none;width:36px;height:48px;flex:none;}
    .fn-cd.play{cursor:pointer;}
    .fn-cd.play:hover{transform:translateY(-3px);}
    .fn-cd:disabled{cursor:default;}
    .fn-gap{margin-left:5px;}
    .fn-c{display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;place-items:center;min-height:118px;}
    .fn-slot{width:30px;height:40px;border-radius:5px;background:${SLOT};border:1px solid ${SLOT_LINE};}
    .fn-slot.full{background:transparent;border-color:transparent;}
    .fn-sn{grid-column:2;grid-row:1;} .fn-sw{grid-column:1;grid-row:2;}
    .fn-se{grid-column:3;grid-row:2;} .fn-ss{grid-column:2;grid-row:3;}
    .fn-msg{grid-column:2;grid-row:2;font-family:${MONO};font-size:9.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--stg-mute,rgba(255,255,255,0.6));text-align:center;line-height:1.4;}
    .fn-drop{animation:fndrop .18s ease-out;}
    @keyframes fndrop{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}
    @media (prefers-reduced-motion:reduce){.fn-drop{animation:none;}.fn-cd.play:hover{transform:none;}}
    .fn-btn{font-family:${SANS};font-weight:800;font-size:13px;border:1px solid var(--stg-line2,rgba(28,30,36,0.35));background:none;color:var(--stg-ink2,#3f4757);border-radius:9px;padding:9px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
    .fn-btn:disabled{opacity:0.42;cursor:default;}
    .fn-discs{display:flex;gap:3px;}
    .fn-discs i{width:9px;height:9px;border-radius:50%;background:rgba(var(--stg-fieldink,255,255,255),0.16);display:block;}
    .fn-discs i.got{background:var(--stg-acc,${COLORS.accent});}
    .fn-discs i.lost{background:var(--stg-sq-d,#94a1b5);}
    .fn-line{font-family:${MONO};font-size:12px;line-height:1.85;color:var(--stg-ink,${COLORS.ink});}
    .fn-line b{font-weight:500;color:var(--stg-acc-ink,${COLORS.accent});}
  `;

  return (
    <div style={{ minHeight: '100vh', background: STAGE ? STAGE_GROUND : (LOFT ? T.navy : COLORS.cream), fontFamily: SANS, position: 'relative', overflowX: 'hidden', ...(STAGE ? STAGE_ACC : null) }} className={STAGE ? 'stage-page' : undefined} data-stage-theme={STAGE ? stageTheme : undefined}>
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
      <DailyChrome />

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
                  All four hands face up, {R} cards each, {PUZZLE.trump ? <>{SUIT_GLYPH[TRUMP]} trumps</> : 'no trumps'}. You play South and the dummy against a perfect defence. Take {TRICK_WORD[TARGET]} of the {R} tricks.
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
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>tricks <b style={{ color: INK, fontWeight: 500 }}>{pos.ns}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>tries <b style={{ color: misses > 0 ? `var(--stg-bad, ${COLORS.rust})` : INK, fontWeight: 500 }}>{g.tries}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>make <b style={{ color: ACC_INK, fontWeight: 500 }}>{TARGET}</b></span>
          </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: INK, fontWeight: 700, marginBottom: 10, flexWrap: 'wrap' }}>
            <span>{PUZZLE.trump ? <>Trumps <span style={{ color: TRUMP === 1 || TRUMP === 2 ? RED_PIP : INK, fontSize: 15 }}>{SUIT_GLYPH[TRUMP]}</span></> : 'No trumps'}</span>
            <span style={{ color: FADED }}>&middot;</span>
            <span>Make <b style={{ color: ACC_INK }}>{TRICK_WORD[TARGET]}</b> of {R}</span>
            <span className="fn-discs" style={{ marginLeft: 'auto' }}>
              {Array.from({ length: R }).map((_, i) => (
                <i key={i} className={i < pos.ns ? 'got' : i < pos.ns + pos.ew ? 'lost' : undefined} />
              ))}
            </span>
          </div>

          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <div className="fn-felt">
              <div className="fn-tbl">
                {seatOrder.map((seat) => {
                  const side = seat === 1 || seat === 3;
                  const cls = seat === 0 ? 'fn-n' : seat === 1 ? 'fn-e' : seat === 2 ? 'fn-s' : 'fn-w';
                  const cards = handFor(seat);
                  let prevSuit = -1;
                  return (
                    <div key={seat} className={`fn-seat ${cls}${pos.seat === seat && !!cardsLeft && playing ? ' on' : ''}`}>
                      <span className="fn-lbl">{seat === 0 ? 'Dummy' : seat === 2 ? 'You' : SEAT_NAME[seat]}</span>
                      <div className="fn-hand">
                        {cards.map((card) => {
                          const gap = prevSuit >= 0 && suitOf(card, R) !== prevSuit;
                          prevSuit = suitOf(card, R);
                          const trump = TRUMP >= 0 && suitOf(card, R) === TRUMP;
                          if (side) return <SideCard key={card} card={card} R={R} trump={trump} />;
                          const live = myTurn && pos.seat === seat && legal(pos.m, seat, pos.led, card);
                          return (
                            <button key={card} type="button" className={`fn-cd${live ? ' play' : ''}${gap ? ' fn-gap' : ''}`}
                              onClick={() => playCard(card)} disabled={!live}
                              aria-label={`${RANK_NAMES[R][rankOf(card, R)]} of ${['spades', 'hearts', 'diamonds', 'clubs'][suitOf(card, R)]}`}>
                              <CardFace card={card} R={R} trump={trump} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="fn-c">
                  {[0, 1, 2, 3].map((seat) => {
                    const card = trickAt(seat);
                    const cls = seat === 0 ? 'fn-sn' : seat === 1 ? 'fn-se' : seat === 2 ? 'fn-ss' : 'fn-sw';
                    return (
                      <div key={seat} className={`fn-slot ${cls}${card != null ? ' full' : ''}`}>
                        {card != null ? <div className="fn-drop" style={{ width: '100%', height: '100%' }}><CardFace card={card} R={R} trump={TRUMP >= 0 && suitOf(card, R) === TRUMP} /></div> : null}
                      </div>
                    );
                  })}
                  <div className="fn-msg">{thinking ? 'Thinking' : turnLine}</div>
                </div>
              </div>
            </div>
          </div>

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
              name="Finesse"
              catRank={catRank}
              outcome={done ? 'won' : 'part'}
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
