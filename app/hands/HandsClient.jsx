'use client';

// Hands — the daily poker solitaire.
//
// Twenty six cards off a standard deck, dealt one at a time. Twenty five of
// them land on a five by five grid, which is read as ten poker hands: five rows
// and five columns, every card serving one of each. A placed card never moves.
//
// The reason this works as a DAILY and ordinary poker does not: the shuffle is
// fixed. Everybody in the world gets the same 26 cards in the same order, so
// nobody is dealt a better night than anybody else and the leaderboard is
// ranking decisions rather than luck. What remains is a real decision every
// turn, because each card serves two hands at once and you commit before you
// know what is coming.
//
// One muck a day is the only lever, and it is blind: it discards the card on
// offer and takes the next one sight unseen. So the finished board is always
// these 26 cards minus exactly one, and when to spend it is the skill.
//
// Two targets, both REAL PLAYOUTS rather than formulas (see puzzles.js and
// rules.js). PAR is the median of four hundred blind solver runs on this exact
// deal and scores 8. ACE is the best of those runs and scores 10, so the top of
// the scale is something a person can actually reach. The CEILING quoted at the
// end is a third number and deliberately not a target: it is the best any
// arrangement of these cards can score, which needs you to have seen the whole
// deal coming.
//
// Same daily plumbing as Taire/Parker/Four: banked deals gated by Eastern date
// on the server (app/hands/page.js), per-puzzle localStorage saves, /hands?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Undo2 } from 'lucide-react';
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
  RANK_LABEL, SUIT_PIP, rankOf, suitOf, isRed, cardName,
  lineScores, totalOf, bustsOf, scoreForPoints, rowCells, colCells,
} from './rules';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#7f1d1d',        // Hands identity, card table wine
  accentSoft: '#f6eaea',
  green: T.successDeep,
};
// The felt carried no information and was the largest object in the game, so it is
// a surface now, and the table's EDGE carries the category instead. A card face
// is light in either register, so it takes the same token a chessboard's light
// square does. Loft (?stage=0) still renders the original felt via the fallback.
const FELT = 'var(--stg-surf2, #7c2230)';
const FELT_EDGE = 'color-mix(in srgb, var(--stg-acc, #511018) 60%, transparent)';
const CARD_FACE = 'var(--stg-sq-l, #fdfcf9)';
const CARD_EDGE = 'rgba(20,22,28,0.30)';
const RED_PIP = 'var(--stg-bad, #c8282e)';
const BLACK_PIP = T.ink;

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_hands_help_seen';
const STATS_KEY = 'sot_hands_stats';

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
    rec[p.num] = { s: sc, t: 10, g: null, won: sc >= 8 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { ok: [7], big: [10, 30, 16], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const freshState = () => ({ v: 1, placed: [], muckAt: -1, status: 'playing', t0: null, tEnd: null });

function CardFace({ card, size = 'md', dim = false }) {
  const red = isRed(card);
  const big = size === 'lg';
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: big ? 8 : 6, background: CARD_FACE,
      border: `1px solid ${CARD_EDGE}`,
      boxShadow: big ? '0 3px 8px rgba(20,22,28,0.34)' : '0 1px 3px rgba(20,22,28,0.28)',
      color: red ? RED_PIP : BLACK_PIP, fontFamily: SANS, fontWeight: 800,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1, userSelect: 'none', opacity: dim ? 0.55 : 1,
    }}>
      <span style={{ fontSize: big ? 30 : 'clamp(14px,4.4vw,17px)', letterSpacing: '-0.04em' }}>{RANK_LABEL[rankOf(card)]}</span>
      <span style={{ fontSize: big ? 26 : 'clamp(12px,3.6vw,15px)', marginTop: big ? 3 : 1 }}>{SUIT_PIP[suitOf(card)]}</span>
    </div>
  );
}

// Every counter on the board is the SAME square, whether it totals a row, a
// column, or the whole grid. They used to inherit their track's size, which made
// the row counters tall cards and the column counters short bars: two different
// shapes for one identical job, and the tall column pushed the board out past
// the felt. CHIP is the one number that governs them.
const CHIP = 26;

// A line's counter. A line that is still filling shows a dot rather than a zero,
// because it has not busted yet, it just is not a hand yet.
function ScoreChip({ value, complete, total }) {
  const premium = complete && value >= 10;
  const made = complete && value > 0;
  // A MADE HAND'S CHIP IS A LITTLE CARD and stays pale in both registers, so
  // its ink is the same near-black as a card's pips. A line that has not
  // finished is a RECESS in the felt, and that one has to follow the register:
  // it used to be white at 14% with white ink at 62%, which is a recess on the
  // dark felt and, on the pale one, invisible ink on an invisible box (measured
  // 1.11:1, the worst thing on the site).
  const bg = total || made ? 'var(--stg-sq-l, rgba(255,255,255,0.92))' : premium ? '#f7e2b0' : 'rgba(var(--stg-fieldink, 255,255,255), 0.14)';
  const bd = premium ? '#c99a2e' : made || total ? 'rgba(20,22,28,0.18)' : 'rgba(var(--stg-fieldink, 255,255,255), 0.30)';
  const fg = total ? COLORS.accent : premium ? '#7a5305' : made ? COLORS.ink : 'var(--stg-mute2, rgba(255,255,255,0.62))';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, border: `1px solid ${bd}`, borderRadius: 5,
      fontFamily: MONO, fontWeight: total ? 700 : 500, fontSize: 12, color: fg,
      width: CHIP, height: CHIP, flex: 'none',
    }}>{complete ? value : '·'}</div>
  );
}

// Centers a counter inside whatever track it lands in, so the column counters
// under a full-width cell and the row counters in the narrow last track are the
// same box in the same place.
function ChipCell({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>;
}

export default function HandsClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_hands_${PUZZLE.num}`;
  const searchParams = useSearchParams();

  const [g, setG] = useState(freshState);
  const gRef = useRef(g);
  const [stats, setStats] = useState({ v: 1, rec: {} });
  const [identity, setIdentity] = useState(null);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [toast, setToast] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [countdown, setCountdown] = useState('');
  const [showBest, setShowBest] = useState(false);
  const toastTimer = useRef(null);
  const endHold = useEndHold();

  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const grid = useMemo(() => {
    const out = new Array(25).fill(null);
    for (const [card, idx] of g.placed) out[idx] = card;
    return out;
  }, [g.placed]);

  const scores = useMemo(() => lineScores(grid), [grid]);
  // The reveal board is fixed for the day, so score it once rather than on every
  // tick of the clock.
  const bestScores = useMemo(() => lineScores(PUZZLE.best), [PUZZLE]);
  const rowFull = useMemo(() => [0, 1, 2, 3, 4].map((i) => rowCells(grid, i).every((c) => c != null)), [grid]);
  const colFull = useMemo(() => [0, 1, 2, 3, 4].map((j) => colCells(grid, j).every((c) => c != null)), [grid]);

  const consumed = g.placed.length + (g.muckAt >= 0 ? 1 : 0);
  const current = consumed < PUZZLE.deck.length ? PUZZLE.deck[consumed] : null;
  const muckLeft = g.muckAt < 0;
  const playing = g.status === 'playing';
  // Focus mode: while the puzzle is live the leaderboard / share / other-games
  // block is folded away behind one button, the same arrangement every other
  // daily uses (owner rule, 2026-08-08). setShowChrome unfolds it for good.
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('hands');
  const STAGE = isStage('hands', searchParams);
  // The register comes from the shared store the switch in the cap writes.
  // Resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('hands');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('hands'), '--stg-acc-lt': gameColorLight('hands'), '--stg-onramp-lt': gameOnrampLight('hands'), '--stg-acc-ink-lt': gameAccentInkLight('hands') };
  const Cap = STAGE ? StageChrome : LoftCap;
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
  const started = !!g.t0;
  const preStart = !started && playing;
  const done = g.status === 'done';
  const total = useMemo(() => totalOf(grid), [grid]);
  const par = PUZZLE.par;
  const ace = PUZZLE.ace;
  const won = done && total >= par;
  const finalScore = done ? scoreForPoints(total, par, ace) : 0;
  const busts = done ? bustsOf(grid) : 0;

  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.placed)) { setG(saved); gRef.current = saved; }
      }
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
  }, [STORE_KEY]);

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        if (g.status !== 'playing' || g.t0) localStorage.setItem('sot_hands_day', JSON.stringify({ d: etToday(), done: g.status !== 'playing' }));
        else localStorage.removeItem('sot_hands_day');
      }
    } catch (e) {}
  }, [g, STORE_KEY, PUZZLE, puzzles]);

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
    fetch(`/api/quiz/daily-game?game=hands&email=${encodeURIComponent(em)}`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((s) => mergeServerStats(s, d.recent, puzzles)); })
      .catch(() => {});
  }, [identity, puzzles]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'hands', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'hands', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'hands', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'hands', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'hands', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_hands_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.placed.length || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, finalGrid) {
    abandon.markFlushed();
    const tot = totalOf(finalGrid);
    const score = scoreForPoints(tot, par, ace);
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: tot, won: tot >= par })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: tot >= par ? 1 : 0, guessesUsed: bustsOf(finalGrid), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function place(idx) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || current == null) return;
    if (grid[idx] != null) return;
    if (!cur.t0) { startGame(); return; }
    const placed = [...cur.placed, [current, idx]];
    const g2 = { ...cur, placed };
    const nextGrid = new Array(25).fill(null);
    for (const [card, at] of placed) nextGrid[at] = card;
    // Did this card just complete a line worth something? Worth a nudge.
    const r = Math.floor(idx / 5), c = idx % 5;
    const nextScores = lineScores(nextGrid);
    const rDone = rowCells(nextGrid, r).every((x) => x != null);
    const cDone = colCells(nextGrid, c).every((x) => x != null);
    const gained = (rDone ? nextScores[r] : 0) + (cDone ? nextScores[5 + c] : 0);
    if (placed.length === 25) {
      const finished = { ...g2, status: 'done', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(finished, nextGrid);
      endHold.hold(1400);
      commit(finished);
      return;
    }
    if (gained >= 10) vibrate(HAPT.big); else vibrate(HAPT.ok);
    commit(g2);
  }

  function muck() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.muckAt >= 0) return;
    if (!cur.t0) { startGame(); return; }
    if (consumed >= PUZZLE.deck.length - 1) { say('Too late to muck, this is the last card.'); return; }
    commit({ ...cur, muckAt: consumed });
    vibrate(HAPT.big);
    say('Mucked. The next card is already on offer.');
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setEndClosed(false); setShowBest(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/hands${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    // Ten chips, one per hand, gold for a premium hand and hollow for a bust.
    // Deliberately a single row rather than a five by five block: a grid-shaped
    // strip would hand somebody else the shape of a good board.
    const chips = scores.map((v) => (v >= 10 ? '\u{1F7E8}' : v > 0 ? '\u{1F7E6}' : '⬜')).join('');
    const vs = total >= ace ? 'ace'
      : total > par ? `${total - par} over par`
      : total === par ? 'level par'
      : `${par - total} under par`;
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Hands #${PUZZLE.num} · ${total} pts, ${vs} · ${elapsed}${streakBit}`;
    return `${head}\n${chips}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Hands #${PUZZLE.num} — the daily poker solitaire from Mind Loft. Par ${par}.\n${shareUrl()}`
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
      lead="Build ten poker hands at once: five across and five down."
      banner={<><b>Par is {par}</b> on this deal, what an ordinary round comes home with: it scores 8. <b>Ace is {ace}</b>, the best our solver managed playing blind: it scores 10.</>}
      chips={[
        { label: 'Pair 1' }, { label: 'Two pair 3' }, { label: 'Flush 5' },
        { label: 'Three of a kind 6' }, { label: 'Full house 10' }, { label: 'Straight 12' },
        { label: 'Four of a kind 16' }, { label: 'Straight flush 25' }, { label: 'Royal flush 30' },
      ]}
      steps={[
        <>Cards come one at a time. <b>Tap any empty square</b> to place the card on offer. It never moves again, and there is no undo.</>,
        <>A full grid is <b>ten hands</b>, five across and five down. Every card counts in two of them at once, which is the whole puzzle.</>,
        <>You get <b>one muck</b> a day. It bins the card on offer and deals the next, sight unseen. Spend it well: there is only one.</>,
      ]}
      knack="A straight beats a flush here, because on a five by five grid flushes are the easy ones."
      footer="Par and ace are both real rounds somebody played, not formulas. Everybody today gets this same deal in this same order, so nothing here is luck."
    />
  );

  // AN EMPTY SQUARE IS A SLOT CUT IN THE FELT. --stg-cell is the token for
  // exactly that and it is opaque and tuned per register, so the slot is darker
  // than the felt on the dark register and lighter on the pale one, which is
  // what a slot looks like either way. The dashed edge is ink as an alpha
  // channel for the same reason: white on white was no edge at all.
  const cellStyle = (filled, live) => ({
    aspectRatio: '0.78', borderRadius: 6,
    border: filled ? 'none' : `1.5px dashed rgba(var(--stg-fieldink, 255,255,255), ${live ? '0.62' : '0.24'})`,
    background: filled ? 'transparent' : `var(--stg-cell, ${live ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'})`,
    cursor: live ? 'pointer' : 'default',
    padding: 0, WebkitTapHighlightColor: 'transparent',
  });

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="hands" name="Hands" collapsed={started}
        stats={started ? [{ k: 'Points', v: total }, { k: 'Par', v: par }] : null} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. A finished hand under par still scores, so it is a partial and the cap goes
          amber rather than red. */}
      {LOFT && (
        <Cap gameKey="hands" quizId={PUZZLE.quizId}
          name="Hands"
          cat="Cards"
          outcome={playing ? null : (won ? 'won' : (finalScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: total, k: 'points' },
            { v: elapsed, k: 'time' },
            { v: `${par} · ${ace}`, k: 'par · ace' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: total, k: 'points' },
            { v: `${par} · ${ace}`, k: 'par · ace' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="hd-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.hd-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .hd-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .hd-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .hd-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .hd-tool:disabled{opacity:0.4;cursor:default;}
          .hd-felt{background:${FELT};border:10px solid ${FELT_EDGE};border-radius:12px;padding:13px 12px 15px;touch-action:manipulation;}
          /* minmax(0,1fr) on the card tracks, NOT 1fr: a bare 1fr floors at the
             cell's min-content width, so the five card columns refused to shrink
             and pushed the counter track out through the felt's right border.
             The counter track is a fixed CHIP px, so it never competes for space. */
          .hd-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) ${CHIP}px;gap:6px;align-items:center;width:100%;}
          .hd-cell{transition:transform .1s ease;}
          .hd-cell:active{transform:translateY(1px);}
          .hd-offer{animation:hdpop .18s ease;}
          @keyframes hdpop{from{transform:scale(0.9);opacity:0.4;}to{transform:scale(1);opacity:1;}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="hands" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'HANDS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Hands is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Twenty five cards, one at a time, into a five by five grid. Every row and column is a poker hand, so each card counts twice. One muck, no undo. Par is {par} and ace is {ace}.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="hd-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ whiteSpace: 'nowrap' }}>points <b style={{ color: total >= par ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{total}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>par <b style={{ color: ACC_INK, fontWeight: 500 }}>{par}</b> &middot; ace <b style={{ color: INK, fontWeight: 500 }}>{ace}</b></span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <div className="hd-felt">
              {/* the card on offer, and the muck */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 13 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stg-ink2, rgba(255,255,255,0.72))', marginBottom: 5 }}>on offer</div>
                  <div key={consumed} className="hd-offer" style={{ width: 58, height: 76 }}>
                    {current != null ? <CardFace card={current} size="lg" /> : (
                      <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '1.5px dashed rgba(var(--stg-fieldink, 255,255,255), 0.34)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stg-mute2, rgba(255,255,255,0.6))', fontFamily: MONO, fontSize: 11 }}>done</div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: 'var(--stg-ink, rgba(255,255,255,0.86))', lineHeight: 1.45 }}>
                    {done ? 'Board full. That is the round.'
                      : current != null ? `${cardName(current)}. Tap a square.`
                      : ''}
                  </div>
                  <button className="hd-tool" onClick={muck} disabled={!muckLeft || !playing}
                    title="Throw this card away and take the next one, sight unseen. One a day."
                    style={{ marginTop: 8, background: muckLeft && playing ? `color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent)` : 'var(--stg-surf2, rgba(255,255,255,0.55))', borderColor: `color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 50%, transparent)`, color: `var(--stg-ink, #6d1a1a)` }}>
                    <Undo2 size={14} /> {muckLeft ? 'Muck (1 left)' : 'Muck used'}
                  </button>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--stg-ink2, rgba(255,255,255,0.6))', marginTop: 6 }}>
                    {25 - g.placed.length} square{25 - g.placed.length === 1 ? '' : 's'} left
                  </div>
                </div>
              </div>

              {/* the grid, with row scores down the right and column scores along the bottom */}
              <div className="hd-board">
                {Array.from({ length: 5 }).map((_, r) => (
                  <React.Fragment key={`r${r}`}>
                    {Array.from({ length: 5 }).map((_, c) => {
                      const idx = r * 5 + c;
                      const card = grid[idx];
                      const live = playing && card == null && current != null && !!g.t0;
                      return (
                        <button key={idx} className="hd-cell" onClick={() => place(idx)} disabled={!live}
                          aria-label={card != null ? cardName(card) : `empty square, row ${r + 1} column ${c + 1}`}
                          style={cellStyle(card != null, live)}>
                          {card != null ? <CardFace card={card} /> : null}
                        </button>
                      );
                    })}
                    <ChipCell><ScoreChip value={scores[r]} complete={rowFull[r]} /></ChipCell>
                  </React.Fragment>
                ))}
                {Array.from({ length: 5 }).map((_, c) => (
                  <ChipCell key={`c${c}`}><ScoreChip value={scores[5 + c]} complete={colFull[c]} /></ChipCell>
                ))}
                <ChipCell><ScoreChip value={total} complete total /></ChipCell>
              </div>
            </div>
          </div>

          {done && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button type="button" onClick={() => setShowBest((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12.5, color: FADED, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                {showBest ? 'Hide the best arrangement' : `The best board found on these cards was ${PUZZLE.ceiling}. See it`}
              </button>
              {showBest && (
                <div style={{ marginTop: 10, maxWidth: 430, margin: '10px auto 0' }}>
                  <div className="hd-felt" style={{ borderColor: 'var(--stg-line2, #3d3d46)', background: 'var(--stg-panel, #4a4a55)' }}>
                    <div className="hd-board">
                      {Array.from({ length: 5 }).map((_, r) => (
                        <React.Fragment key={`br${r}`}>
                          {Array.from({ length: 5 }).map((_, c) => (
                            <div key={`b${r}${c}`} style={{ aspectRatio: '0.78' }}><CardFace card={PUZZLE.best[r * 5 + c]} dim /></div>
                          ))}
                          <ChipCell><ScoreChip value={bestScores[r]} complete /></ChipCell>
                        </React.Fragment>
                      ))}
                      {Array.from({ length: 5 }).map((_, c) => (
                        <ChipCell key={`bc${c}`}><ScoreChip value={bestScores[5 + c]} complete /></ChipCell>
                      ))}
                      <ChipCell><ScoreChip value={PUZZLE.ceiling} complete total /></ChipCell>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: FADED, fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                    The best arrangement of these 26 cards our search could find. It is not a target and not a proven maximum: you would have to have seen the whole deal coming to build it, which is exactly why the round is scored against par and ace, both of which are rounds played blind.
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
                You scored <span style={{ color: ACC_INK }}>{total} points</span>. Par was {par}, ace was {ace}.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {total >= ace ? 'You matched or beat the best round our solver found playing blind on this deal. That is as good as it gets without seeing the cards coming.'
                  : total > par ? `That is ${total - par} over par, with ${busts === 0 ? 'not a single hand wasted' : `${busts} of the ten hands worth nothing`}.`
                  : total === par ? 'Level par, exactly what an ordinary round comes home with.'
                  : `That is ${par - total} under par. ${busts >= 4 ? 'Too many dead lines: a card that helps nothing is still costing you a square.' : 'Close enough that one or two placements were the difference.'}`}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Hands in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new deal drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/hands?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Hands &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/hands" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Hands &rarr;</a>
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
              name="Hands"
              catRank={catRank}
              outcome={won ? 'won' : (finalScore > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore}/10 \u00b7 ${total} points \u00b7 par ${par}, ace ${ace} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Hands all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Busts"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/hands?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Hands', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/hands?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="hands" name="Hands" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="hands" name="Hands" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={done ? resetGame : null} self="hands" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="hands" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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

      {/* `won` here means beat par, and `completed` is always true because a
          full board is the end of the round: there is no losing position in
          Hands, only a worse one. Falling short of par therefore reads "Not
          perfect." rather than "Defeated.", which is why hands stays OUT of
          DEFEAT_GAMES in DailyEndCard, exactly like Babel. headline/subline are
          deprecated on that component; `score` is the live prop. */}
      {done && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard modal self="hands" won={won} completed
          score={<>{total} pts &middot; par {par}</>}
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
            <button className="hd-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Hands</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Hands is a free daily poker puzzle from Mind Loft. Twenty five cards arrive one at a time and you place each one on a five by five grid, which is read as ten poker hands: five rows and five columns, with every card counting in two of them. A card you have placed never moves, so the whole game is deciding where it goes while the rest of the deal is still hidden.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Poker is usually a game of luck, and a daily leaderboard cannot rank luck. So the shuffle is fixed: every player in the world gets the same 26 cards in the same order, which turns the whole thing into a decision game. The one lever you have is a single muck, which throws the current card away and takes the next one without showing it to you first. Both of the numbers you play against are real rounds rather than formulas: par is the middle of four hundred blind solver runs on your exact deal, and ace is the best of them, so the top of the scale is genuinely reachable.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new deal drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/taire" style={{ color: INK, fontWeight: 800 }}>Taire</a>, our daily two-suit solitaire, <a href="/babel" style={{ color: INK, fontWeight: 800 }}>Babel</a>, the word tile endgame, and <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, our daily chess finish.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
