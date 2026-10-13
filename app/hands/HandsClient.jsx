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
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import {
  RANK_LABEL, SUIT_PIP, rankOf, suitOf, isRed, cardName,
  lineScores, totalOf, bustsOf, scoreForPoints, rowCells, colCells,
  SCORE, HAND_NAME, scoreHand,
} from './rules';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#7f1d1d',        // Hands identity, card table wine
  accentSoft: '#f6eaea',
  green: T.successDeep,
};
// The felt is the category accent mixed thin into the cell token, the same
// table Crib plays on, so it follows both registers. Card FACES are paper in
// both registers (playing cards are physical objects): white, near-black and
// red ink, exactly as Crib draws them.
const FELT = 'color-mix(in srgb, var(--stg-acc, #7f1d1d) 9%, var(--stg-cell, #f6eaea))';
const FACE = '#ffffff';
const FACE_INK = '#16181d';
const FACE_RED = '#b91c1c';
const FACE_EDGE = 'rgba(20,22,28,0.30)';
const A_FILL = 'var(--stg-acc, #7f1d1d)';
const ON_A = 'var(--stg-onramp, #ffffff)';
const A_INK = 'var(--stg-acc-ink, #7f1d1d)';
const A_TINT = 'color-mix(in srgb, var(--stg-acc, #7f1d1d) 16%, var(--stg-cell, #ffffff))';
const CELL = 'var(--stg-cell, #ffffff)';
const CELL_LINE = 'var(--stg-cell-line, rgba(28,30,36,0.35))';
const S_INK = 'var(--stg-ink, #16181d)';
const S_INK2 = 'var(--stg-ink2, #2c3446)';
const S_MUTE = 'var(--stg-mute, #525c70)';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = SANS;
const HELP_KEY = 'sot_hands_help_seen';
const STATS_KEY = 'sot_hands_stats';

// The pay table, best hand first, read straight off the rules' SCORE so the
// two can never disagree. Names come from HAND_NAME with the article dropped.
const handLabel = (v) => {
  const n = HAND_NAME[v] || 'nothing';
  const bare = n.replace(/^(a|an) /, '');
  return bare.charAt(0).toUpperCase() + bare.slice(1);
};
const PAY = Object.values(SCORE).sort((a, b) => b - a);
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

// A playing card face. `sz` sets the type: 'cell' (a grid square), 'cellS'
// (a phone grid square), 'big' (the card on offer), 'bigS' (the phone's card
// on offer). The face is white in both registers; `ghost` is the hover preview,
// the same face washed with the accent and outlined dashed, never dimmed with
// opacity (ink on a coloured ground keeps its full contrast).
const FACE_SIZES = {
  cell: { r: 17, s: 13, c: 26, top: 5, left: 7, pad: 12, rad: 8 },
  cellS: { r: 15, s: 12, c: 22, top: 4, left: 6, pad: 12, rad: 7 },
  big: { r: 24, s: 19, c: 52, top: 8, left: 10, pad: 16, rad: 11 },
  bigS: { r: 18, s: 14, c: 30, top: 5, left: 7, pad: 12, rad: 8 },
};
function CardFace({ card, sz = 'cell', ghost = false, ring = false }) {
  const red = isRed(card);
  const f = FACE_SIZES[sz] || FACE_SIZES.cell;
  const big = sz === 'big' || sz === 'bigS';
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: f.rad,
      background: ghost ? 'color-mix(in srgb, var(--stg-acc, #7f1d1d) 12%, #ffffff)' : FACE,
      border: ghost ? `2.5px dashed ${A_FILL}` : ring ? `3px solid ${A_FILL}` : `1.5px solid ${FACE_EDGE}`,
      boxShadow: ghost ? 'none' : ring ? `0 0 0 3px ${FELT}, 0 0 0 5px ${A_FILL}, 0 14px 22px rgba(0,0,0,.32)` : big ? '0 4px 10px rgba(0,0,0,.28)' : '0 3px 7px rgba(0,0,0,.22)',
      color: red ? FACE_RED : FACE_INK, fontFamily: SANS, userSelect: 'none',
    }}>
      <span style={{ position: 'absolute', top: f.top, left: f.left, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <b style={{ fontSize: f.r, fontWeight: 800, letterSpacing: '-0.03em' }}>{RANK_LABEL[rankOf(card)]}</b>
        <span style={{ fontSize: f.s }}>{SUIT_PIP[suitOf(card)]}</span>
      </span>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: f.c, paddingTop: f.pad, lineHeight: 1 }}>{SUIT_PIP[suitOf(card)]}</span>
    </div>
  );
}

// A small face for the muck slot: rank and suit centred.
function MiniCard({ card, w = 34, h = 48 }) {
  return (
    <span style={{ width: w, height: h, flex: 'none', boxSizing: 'border-box', borderRadius: 6, background: FACE, border: `1.5px solid ${FACE_EDGE}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 12, fontWeight: 800, color: isRed(card) ? FACE_RED : FACE_INK, lineHeight: 1 }}>
      {RANK_LABEL[rankOf(card)]}{SUIT_PIP[suitOf(card)]}
    </span>
  );
}

// One line's state, for its chip. `k` is how many cards the line holds now.
// A preview (the card on offer hovering a square on the line) adds one.
function lineChip({ k, full, value, preview, cardTxt, axis, n, wouldBe }) {
  if (preview) {
    const to = k + 1;
    if (to === 5) {
      return { kind: 'prev', k, to, wouldBe, t1: `\u2192 ${handLabel(wouldBe)}`, t2: `+${wouldBe}`, s: `\u2192+${wouldBe}` };
    }
    return { kind: 'prev', k, to, t1: axis === 'Row' ? `${k} \u2192 ${to} of 5` : `${k} \u2192 ${to}`, t2: `with ${cardTxt}`, s: `${k}\u2192${to}` };
  }
  if (full && value > 0) return { kind: 'made', t1: handLabel(value), t2: `+${value}`, s: `+${value}` };
  if (full) return { kind: 'bust', t1: 'No hand', t2: '+0', s: '+0' };
  return { kind: 'open', t1: `${k} of 5`, t2: `${axis} ${n}`, s: `${k}/5` };
}
const CHIP_LOOK = {
  open: { bg: 'transparent', bd: `1.5px solid ${CELL_LINE}`, ink: S_INK2, ink2: S_MUTE },
  bust: { bg: 'transparent', bd: `1.5px solid ${CELL_LINE}`, ink: S_MUTE, ink2: S_MUTE },
  prev: { bg: A_TINT, bd: `1.5px dashed ${A_FILL}`, ink: A_INK, ink2: A_INK },
  made: { bg: A_FILL, bd: `1.5px solid ${A_FILL}`, ink: ON_A, ink2: ON_A },
};

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
  // The board's hover / hold / focus preview: the empty square the card on
  // offer is shown ghosted in. heldRef swallows the click that ends a touch
  // hold, so holding previews and a second tap places.
  const [preview, setPreview] = useState(null);
  const heldRef = useRef(null);
  const holdTimer = useRef(null);
  // Phone layout at the client's own 560px breakpoint, decided by width.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const fit = () => { try { setNarrow(window.innerWidth <= 560); } catch (e) {} };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

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
  // A new card on offer (or the end) clears any preview.
  useEffect(() => { setPreview(null); heldRef.current = null; }, [consumed, g.status]);
  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);
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
      : total > par ? `${total - par} above par`
      : total === par ? 'level par'
      : `${par - total} short of par`;
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

  // ---- the board (round four, 2026-10-13) ---------------------------------
  // Everything below is drawn from state the board already holds: the grid, the
  // card on offer, the muck, par, ace and the deal's ceiling. The preview shows
  // ONLY the card already on offer, never a card still to come.
  const pvIdx = (preview != null && playing && started && current != null && grid[preview] == null) ? preview : null;
  const pvR = pvIdx != null ? Math.floor(pvIdx / 5) : -1;
  const pvC = pvIdx != null ? pvIdx % 5 : -1;
  const curTxt = current != null ? `${RANK_LABEL[rankOf(current)]}${SUIT_PIP[suitOf(current)]}` : '';
  const rowK = [0, 1, 2, 3, 4].map((i) => rowCells(grid, i).filter((x) => x != null).length);
  const colK = [0, 1, 2, 3, 4].map((j) => colCells(grid, j).filter((x) => x != null).length);
  const madeCount = {};
  scores.forEach((v, i) => { const full = i < 5 ? rowFull[i] : colFull[i - 5]; if (full && v > 0) madeCount[v] = (madeCount[v] || 0) + 1; });

  const cellHandlers = (idx) => ({
    onClick: () => {
      if (heldRef.current === idx) { heldRef.current = null; return; }
      place(idx);
    },
    onPointerEnter: (e) => { if (e.pointerType === 'mouse') setPreview(idx); },
    onPointerLeave: (e) => {
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
      if (e.pointerType === 'mouse') setPreview((p) => (p === idx ? null : p));
    },
    onPointerDown: (e) => {
      heldRef.current = null;
      if (e.pointerType === 'mouse') return;
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => { holdTimer.current = null; heldRef.current = idx; setPreview(idx); }, 380);
    },
    onPointerUp: () => { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } },
    onPointerCancel: () => { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } },
    onFocus: () => setPreview(idx),
    onBlur: () => setPreview((p) => (p === idx ? null : p)),
    onContextMenu: (e) => { e.preventDefault(); },
  });

  // The 5x5 of squares with a chip at the end of every row and under every
  // column. `cards` is the 25 squares; `interactive` wires the live board.
  const renderGrid = (cards, sc, rFull, cFull, rK, cK, interactive) => {
    const cw = narrow ? 54 : 62;
    const chipFor = (i) => {
      const isRow = i < 5;
      const n = isRow ? i : i - 5;
      const full = isRow ? rFull[n] : cFull[n];
      const prev = interactive && pvIdx != null && (isRow ? pvR === n : pvC === n);
      let wouldBe = 0;
      if (prev && (isRow ? rK[n] : cK[n]) === 4) {
        const line = (isRow ? rowCells(cards, n) : colCells(cards, n)).map((x, q) => (x == null && (isRow ? q === pvC : q === pvR) ? current : x));
        wouldBe = scoreHand(line);
      }
      return lineChip({ k: isRow ? rK[n] : cK[n], full, value: sc[i], preview: prev, cardTxt: curTxt, axis: isRow ? 'Row' : 'Col', n: n + 1, wouldBe });
    };
    const chipEl = (i) => {
      const ch = chipFor(i);
      const L = CHIP_LOOK[ch.kind];
      const isRow = i < 5;
      const label = `${isRow ? 'Row' : 'Column'} ${(i % 5) + 1}: ${ch.kind === 'made' ? `${handLabel(sc[i]).toLowerCase()}, ${sc[i]} points` : ch.kind === 'bust' ? 'complete, no hand' : ch.kind === 'prev' ? (ch.to === 5 ? `the ${curTxt} here would complete it as ${handLabel(ch.wouldBe).toLowerCase()}, ${ch.wouldBe} points` : `${ch.k} of 5, ${ch.to} with the ${curTxt}`) : ch.t1}`;
      if (narrow) {
        return (
          <span key={`ch${i}`} className="hd-chip" aria-label={label} title={label}
            style={{ height: isRow ? 40 : 30, boxSizing: 'border-box', borderRadius: 7, background: L.bg, border: L.bd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 11, fontWeight: 800, color: L.ink, whiteSpace: 'nowrap', minWidth: 0 }}>{ch.s}</span>
        );
      }
      return (
        <span key={`ch${i}`} className="hd-chip" aria-label={label} title={label}
          style={isRow
            ? { minHeight: 44, boxSizing: 'border-box', borderRadius: 8, background: L.bg, border: L.bd, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 9px', gap: 1, minWidth: 0 }
            : { minHeight: 56, height: '100%', boxSizing: 'border-box', borderRadius: 8, background: L.bg, border: L.bd, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4px 3px', gap: 2, minWidth: 0 }}>
          <b style={{ fontSize: isRow ? 12 : 11, fontWeight: 800, color: L.ink, lineHeight: 1.2 }}>{ch.t1}</b>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: L.ink2, lineHeight: 1.2 }}>{ch.t2}</span>
        </span>
      );
    };
    return (
      <div className="hd-board" style={{ display: 'grid', gridTemplateColumns: narrow ? `repeat(5, minmax(0, ${cw}px)) minmax(34px, 1fr)` : `repeat(5, minmax(0, ${cw}px)) minmax(72px, 1fr)`, gap: narrow ? 5 : '8px 7px', alignItems: 'center', width: '100%' }}>
        {[0, 1, 2, 3, 4].map((r) => (
          <React.Fragment key={`r${r}`}>
            {[0, 1, 2, 3, 4].map((c) => {
              const idx = r * 5 + c;
              const card = cards[idx];
              const sq = { aspectRatio: narrow ? '54 / 72' : '62 / 86', width: '100%', boxSizing: 'border-box', borderRadius: narrow ? 7 : 8, padding: 0, position: 'relative' };
              if (!interactive) {
                return <div key={idx} style={sq}>{card != null ? <CardFace card={card} sz={narrow ? 'cellS' : 'cell'} /> : null}</div>;
              }
              const live = playing && card == null && current != null && !!g.t0;
              const ghost = idx === pvIdx;
              return (
                <button key={idx} type="button" className={`hd-cell${live ? ' live' : ''}`} disabled={!live}
                  {...(live ? cellHandlers(idx) : {})}
                  aria-label={card != null ? cardName(card) : ghost ? `Row ${r + 1}, column ${c + 1}: place the ${cardName(current)} here` : `Empty square, row ${r + 1}, column ${c + 1}`}
                  style={{ ...sq, background: card != null ? 'transparent' : CELL, border: card != null ? 'none' : `1.5px solid ${CELL_LINE}`, cursor: live ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none', userSelect: 'none' }}>
                  {card != null ? <CardFace card={card} sz={narrow ? 'cellS' : 'cell'} /> : ghost ? <CardFace card={current} sz={narrow ? 'cellS' : 'cell'} ghost /> : null}
                </button>
              );
            })}
            {chipEl(r)}
          </React.Fragment>
        ))}
        {[0, 1, 2, 3, 4].map((c) => chipEl(5 + c))}
        <span aria-hidden="true" />
      </div>
    );
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
          .hd-felt{background:${FELT};border-radius:22px;touch-action:manipulation;}
          .hd-cell{transition:transform .1s ease;}
          .hd-cell.live:active{transform:translateY(1px);}
          .hd-cell.live:focus-visible{outline:2px solid var(--stg-ink, #16181d);outline-offset:2px;}
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

        {!preStart && (() => {
          const K = { fontFamily: SANS, fontSize: narrow ? 10 : 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: S_MUTE };
          const ceil = PUZZLE.ceiling || 0;
          const max = Math.max(ceil, ace, total, 1);
          const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100));
          const parP = pct(par), aceP = pct(ace);
          // A label sits beside its marker on the side away from the other one,
          // so par and ace never print over each other.
          const parAnchor = parP > 14 ? 'translateX(calc(-100% - 5px))' : 'translateX(5px)';
          const aceAnchor = aceP < 86 ? 'translateX(5px)' : 'translateX(calc(-100% - 5px))';
          const track = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? 4 : 8, marginBottom: narrow ? 10 : 18 }}>
              {!narrow && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span style={K}>Ten hands · five rows, five columns</span>
                  <span style={K}>Best this deal allows · <b style={{ color: S_INK }}>{ceil}</b></span>
                </div>
              )}
              <div role="img" aria-label={`Score track: ${total} points so far. Par ${par}, ace ${ace}, best this deal allows ${ceil}.`}
                style={{ position: 'relative', height: narrow ? 40 : 34 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: narrow ? 15 : 6, height: narrow ? 8 : 10, borderRadius: 5, background: CELL, border: `1px solid ${CELL_LINE}`, boxSizing: 'border-box' }} />
                <div style={{ position: 'absolute', left: 0, width: `${pct(total)}%`, minWidth: total > 0 ? 8 : 0, top: narrow ? 15 : 6, height: narrow ? 8 : 10, borderRadius: 5, background: A_FILL, transition: 'width .3s ease' }} />
                {[[parP, par, 'Par', S_INK2, parAnchor], [aceP, ace, 'Ace', 'var(--stg-warn, #8a5406)', aceAnchor]].map(([p, v, nm, col, tr]) => (
                  <React.Fragment key={nm}>
                    <span style={{ position: 'absolute', left: `${p}%`, top: narrow ? 11 : 0, width: 2, height: narrow ? 16 : 22, marginLeft: -1, background: col }} />
                    <span style={{ position: 'absolute', left: `${p}%`, top: narrow ? 0 : 21, transform: tr, fontFamily: SANS, fontSize: narrow ? 9 : 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: col, whiteSpace: 'nowrap' }}>{nm} {v}</span>
                  </React.Fragment>
                ))}
                {narrow && <span style={{ position: 'absolute', right: 0, top: 27, fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: S_MUTE }}>Best {ceil}</span>}
              </div>
            </div>
          );

          const left = 25 - g.placed.length;
          const toCome = Math.max(0, PUZZLE.deck.length - consumed - (current != null ? 1 : 0));
          const mucked = g.muckAt >= 0 ? PUZZLE.deck[g.muckAt] : null;
          const muckTitle = 'Throw this card away and take the next one, sight unseen. One a day.';
          const bigCard = (w, h, sz) => (
            <div key={consumed} className="hd-offer" style={{ width: w, height: h, flex: 'none' }}>
              {playing && current != null ? <CardFace card={current} sz={sz} ring={started} /> : (
                <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 10, background: CELL, border: `1.5px dashed ${CELL_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 12, fontWeight: 700, color: S_MUTE, textAlign: 'center', padding: 6 }}>Board full</div>
              )}
            </div>
          );
          const muckBtn = (full) => (
            <button className="hd-tool" onClick={muck} title={muckTitle}
              style={{ minHeight: 44, ...(full ? { width: '100%', justifyContent: 'center' } : null) }}>
              <Undo2 size={15} /> Muck this card
            </button>
          );
          const madeList = PAY.filter((v) => madeCount[v]).map((v) => `${handLabel(v).toLowerCase()}${madeCount[v] > 1 ? ` ×${madeCount[v]}` : ''} +${v * madeCount[v]}`);
          const offerLine = done ? 'Board full. That is the round.'
            : current != null ? (started ? <>Tap a square for the <span style={{ whiteSpace: 'nowrap' }}>{curTxt}</span>.</> : 'Press Start to deal.') : '';

          const payTable = (
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3, borderTop: `1px solid ${CELL_LINE}`, paddingTop: 10 }} aria-label="Pay table">
              <span style={{ ...K, fontSize: 10, fontWeight: 800, marginBottom: 3 }}>Pay table</span>
              {PAY.map((v) => {
                const hit = madeCount[v] || 0;
                return (
                  <div key={v} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 12, fontWeight: hit ? 800 : 600, color: hit ? A_INK : S_INK2 }}>
                    <span>{hit ? '✓ ' : ''}{handLabel(v)}{hit > 1 ? ` ×${hit}` : ''}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  </div>
                );
              })}
            </div>
          );

          const deskLeft = (
            <div style={{ width: 150, flex: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={K}>{done ? 'The deal · done' : `The deal · card ${Math.min(consumed + 1, PUZZLE.deck.length)}`}</span>
              {bigCard(104, 146, 'big')}
              <span style={{ fontSize: 13, fontWeight: 700, color: S_INK, lineHeight: 1.4 }}>{offerLine}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: S_MUTE, lineHeight: 1.4 }}>{left} square{left === 1 ? '' : 's'} left · {toCome} card{toCome === 1 ? '' : 's'} still to come</span>
              {mucked != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <MiniCard card={mucked} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: S_MUTE, lineHeight: 1.35 }}>Muck used<br />one per deal</span>
                </div>
              ) : !playing ? (
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: S_MUTE, lineHeight: 1.35, marginTop: 2 }}>Muck not used</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                  {muckBtn(true)}
                  <span style={{ fontSize: 11, fontWeight: 600, color: S_MUTE, lineHeight: 1.35 }}>One per deal. The next card comes blind.</span>
                </div>
              )}
              {payTable}
            </div>
          );

          const phoneHead = (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {bigCard(64, 90, 'bigS')}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: S_INK }}>{done ? 'Board full' : `Card ${Math.min(consumed + 1, PUZZLE.deck.length)} · ${started ? 'tap a square' : 'press Start'}`}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: S_MUTE, lineHeight: 1.35 }}>
                  {left} square{left === 1 ? '' : 's'} left · {mucked != null ? <>muck used ({RANK_LABEL[rankOf(mucked)]}{SUIT_PIP[suitOf(mucked)]})</> : `${toCome} to come`}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: madeList.length ? A_INK : S_MUTE, lineHeight: 1.35 }}>
                  {madeList.length ? `Made: ${madeList.join(' · ')}` : 'Made: nothing yet'}
                </span>
              </div>
              {mucked == null && playing && (
                <button className="hd-tool" onClick={muck} title={muckTitle} aria-label="Muck this card"
                  style={{ minHeight: 44, minWidth: 44, flexDirection: 'column', gap: 2, padding: '4px 8px', fontSize: 11 }}>
                  <Undo2 size={15} /> Muck
                </button>
              )}
            </div>
          );

          return (
            <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 0 : `2px solid ${COLORS.ink}`, borderRadius: STAGE ? 0 : 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
              {/* These figures move UP into the cap on a loft page; printing
                  them twice is the one thing to avoid. */}
              {!LOFT && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ whiteSpace: 'nowrap' }}>points <b style={{ color: total >= par ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{total}</b></span>
                <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
                <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>par <b style={{ color: ACC_INK, fontWeight: 500 }}>{par}</b> &middot; ace <b style={{ color: INK, fontWeight: 500 }}>{ace}</b></span>
              </div>
              )}

              {track}

              {narrow ? (
                <div className="hd-felt" style={{ padding: 12, borderRadius: 18, display: 'flex', flexDirection: 'column' }}>
                  {phoneHead}
                  <div style={{ marginTop: 14 }}>{renderGrid(grid, scores, rowFull, colFull, rowK, colK, true)}</div>
                  {playing && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: S_MUTE, lineHeight: 1.4, paddingTop: 10 }}>Press and hold a square to preview its row and column before you commit.</span>
                  )}
                </div>
              ) : (
                <div className="hd-felt" style={{ padding: '18px 18px 16px', display: 'flex', gap: 18 }}>
                  {deskLeft}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {renderGrid(grid, scores, rowFull, colFull, rowK, colK, true)}
                    {playing && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: S_MUTE, marginTop: 'auto', paddingTop: 8, lineHeight: 1.45 }}>Hovering a square shows what each of its two lines would hold. A line scores the moment its fifth card lands.</span>
                    )}
                  </div>
                </div>
              )}
              <div style={{ padding: '10px 2px 0', fontSize: narrow ? 11 : 12, fontWeight: 600, color: S_MUTE }}>Same deal for everybody. Every square serves one row and one column.</div>

              {done && (won || !LOFT || revealed) && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <button type="button" onClick={() => setShowBest((v) => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12.5, color: FADED, textDecoration: 'underline', textUnderlineOffset: 3, minHeight: 44 }}>
                    {showBest ? 'Hide the best arrangement' : `The best board found on these cards was ${PUZZLE.ceiling}. See it`}
                  </button>
                  {showBest && (
                    <div style={{ marginTop: 10, textAlign: 'left' }}>
                      <div className="hd-felt" style={{ padding: narrow ? 12 : 18, maxWidth: narrow ? undefined : 520, margin: '0 auto' }}>
                        <div style={{ ...K, marginBottom: 10 }}>The best known arrangement · {PUZZLE.ceiling}</div>
                        {renderGrid(PUZZLE.best, bestScores, [true, true, true, true, true], [true, true, true, true, true], [5, 5, 5, 5, 5], [5, 5, 5, 5, 5], false)}
                      </div>
                      <div style={{ fontSize: 12, color: FADED, fontWeight: 600, marginTop: 8, lineHeight: 1.5 }}>
                        The best arrangement of these 26 cards our search could find. It is not a target and not a proven maximum: you would have to have seen the whole deal coming to build it, which is exactly why the round is scored against par and ace, both of which are rounds played blind.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {done && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                You scored <span style={{ color: ACC_INK }}>{total} points</span>. Par was {par}, ace was {ace}.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {total >= ace ? 'You matched or beat the best round our solver found playing blind on this deal. That is as good as it gets without seeing the cards coming.'
                  : total > par ? `That is ${total - par} above par, with ${busts === 0 ? 'not a single hand wasted' : `${busts} of the ten hands worth nothing`}.`
                  : total === par ? 'Level par, exactly what an ordinary round comes home with.'
                  : `That is ${par - total} short of par. ${busts >= 4 ? 'Too many dead lines: a card that helps nothing is still costing you a square.' : 'Close enough that one or two placements were the difference.'}`}
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
              name="Hands"
              catRank={catRank}
              outcome={won ? 'won' : (finalScore > 0 ? 'part' : 'lost')}
              challengeMetric={done ? total : null}
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
          {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
          {!focusMode && <AddToHome name="Hands" />}
          <div id="stf-stats-slot" />
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
