'use client';

// Chomp — the daily route puzzle.
//
// A handful of mascots on a small board, eaten in order, one square per
// keypress. The BULLDOG always goes first and the rest are dealt fresh daily;
// the cast runs six to seven on a weekday and the full eight on a Sunday. Every
// board is 7x7 from 2026-08-11, but read the size off PUZZLE.w rather than
// assuming it: this game has been 13x13, then 10x10, then a mix of 8x8 and 7x7,
// and the copy on this page outlived every one of them. Two rules carry it, and
// everything else here serves them:
//
//   1. THE BODY NEVER RETRACTS. Every square the head touches is yours for the
//      rest of the run, so your trail is a permanent wall. The shortest hop to
//      the ibis is very often the move that strands the longhorn behind you.
//   2. A MASCOT IS SOLID UNTIL ITS TURN. You cannot cross the tiger on the way
//      to the gamecock. That falls out of rule 1: with a permanent trail, crossing
//      one early would leave it stranded under your own body forever, and a
//      visible wall is fairer than a board ruined twenty moves before anyone
//      notices.
//
// Boards from 2026-08-22 also carry BLEACHERS (`PUZZLE.walls`): bolted-down
// squares the head can never enter, rendered as dark benches. Movement legality
// lives in lib/chomp-engine.js; this file only draws them. Earlier boards have
// no walls field and render exactly as before.
//
// YOU DO NOT NEED THEM ALL (owner, 2026-08-08). The score is how far down the
// cast you got, so a run that stalls on the fifth still scores five. That is
// what makes a hard board survivable.
//
// GIVE UP, THEN TRY AGAIN (owner, 2026-08-08). The control sits at the FOOT of
// the card, not in the game furniture, the way Four does it: while you are
// playing it reads Give up and books the run exactly as it stands; once the run
// is over it becomes Try again and re-deals the same board. Only the first
// result is leaderboard eligible, so a retry costs nothing and cannot buy a
// better place. Give up is two-tap armed and has no keyboard shortcut, because
// a control that costs you the day should not be one stray keypress away.
//
// RESTART SITS BESIDE IT (owner, 2026-08-22). Give up followed by Try again was
// the only way back to a fresh board, which is two presses and a card in between
// for the thing a boxed-in player wants most. Restart is those two presses in
// one: it books the run exactly as Give up does and re-deals on the spot, with
// no end card. It RECORDS, and that is the point rather than an oversight -- a
// restart that recorded nothing would let a player re-deal until the board went
// their way and post only that, which is precisely what the first-attempt rule
// exists to stop. Two-tap armed like Give up, and each disarms the other.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Flag } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import AddToHome from '../AddToHome';
import useEndHold, { HOLD_SHORT, HOLD_LONG } from '../useEndHold';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { notifyShareCredit } from '../ShareCreditPop';
import { T } from '@/lib/theme';
import { DIRS, DIR_KEYS, freshState, applyMove, anyLegal, isCleared, fillOf, canEnter } from '@/lib/chomp-engine';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#a8430f', accentSoft: '#fbeadf', block: '#dc2626',
};
const HELP_KEY = 'sot_chomp_help_seen';
const STATS_KEY = 'sot_chomp_stats';
const BLOCK_MS = 260;
// The board is inset by PAD. Without it the outer ring of squares sat flush
// against the canvas edge and the rounded backing plate clipped their corners,
// so the edge cells read as cut off. Every draw below is offset by PAD and the
// canvas is sized for it.
const PAD = 5;
const LABEL = {
  bulldog: 'Bulldog', ibis: 'Ibis', gamecock: 'Gamecock', wildcat: 'Wildcat',
  seminole: 'Seminole', tiger: 'Tiger', eagle: 'Eagle', longhorn: 'Longhorn',
  knight: 'Knight', smokey: 'Smokey', bull: 'Bull',
};
// The cast ramps 8,8,9,9,9,10,11 through the week, so the win headline cannot
// name a number. It read "All seven." on every board until 2026-08-12.
const NUMWORD = { 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven' };

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
const nf = (n) => Number(n || 0).toLocaleString('en-US');
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
// How far down the cast you got, out of ten. Clearing every mascot is the only
// way to a 10; everything short of that scales.
function scoreOf(eaten, total) {
  if (eaten >= total) return 10;
  return Math.max(0, Math.min(9, Math.round((eaten / total) * 10)));
}

// ---- the board's geometry and words ---------------------------------------
// GAP is the gutter between squares; the arrow in an open square is drawn
// pointing left and rotated to the direction it names.
const GAP = 4;

// ---- stats (identical shape to every other daily) --------------------------
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
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
  const rec = (s && s.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
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
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

export default function ChompClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const CAST = PUZZLE.cast;
  const NPEL = CAST.length;
  const STORE_KEY = `sot_chomp_${PUZZLE.num}`;
  const REC_KEY = `sot_chomp_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(() => freshState(PUZZLE));
  const gRef = useRef(g);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(true);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [stats, setStats] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [armGive, setArmGive] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  const boxRef = useRef(null);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);

  const playing = g.status === 'playing';
  // THE FINISHED BOARD HOLDS BEFORE THE CARD (2026-08-22). Chomp had no hold at
  // all, so the stage flipped in the same tick the run ended and the walled-in
  // gator, which IS the explanation of the loss, was covered before it was read.
  // Longer on a loss than a win, per useEndHold: a clear is a move you played on
  // purpose, a wall-in is one you did not see coming.
  //
  // holdEnd / releaseEnd are pulled off as their own consts because they are the
  // stable callbacks; `endHold` itself is a fresh literal every render and must
  // never be a dependency.
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('chomp');  const iq = useIqStanding({ game: 'chomp', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const STAGE = isStage('chomp', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('chomp');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('chomp'), '--stg-acc-lt': gameColorLight('chomp'), '--stg-onramp-lt': gameOnrampLight('chomp'), '--stg-acc-ink-lt': gameAccentInkLight('chomp') };
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
  const nextUp = useNextUnplayed({ self: 'chomp', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'chomp', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'chomp', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'chomp', active: LOFT && !playing });

  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  // `started` means "mid-run" and goes false the instant a run ends, so it is
  // the WRONG gate for the footer controls: it took Try again down with it and
  // left no way back onto the board. `engaged` means "has been started at all".
  const engaged = !!g.t0;
  const cleared = g.pi >= NPEL;
  const over = g.status !== 'playing';
  const score10 = scoreOf(g.pi, NPEL);
  const won = over && cleared;
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);
  const fillPct = Math.round(fillOf(PUZZLE, g) * 100);

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 2 && Array.isArray(saved.body) && saved.body.length) {
      const s = { ...freshState(PUZZLE), ...saved, tMark: Date.now() };
      gRef.current = s; setG(s);
    }
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORE_KEY]);

  useEffect(() => {
    if (!started || over) return;
    const i = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, [started, over]);

  useEffect(() => {
    if (!hydrated) return;
    const anon = getAnonId();
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    fetch(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
      .catch(() => {});
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) });
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing';
      if (done || g.t0) localStorage.setItem('sot_chomp_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_chomp_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0]);

  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.moves === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round(cur.ms / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return {
      quizId: PUZZLE.quizId, score: scoreOf(cur.pi, NPEL), total: 10,
      correct: cur.pi >= NPEL ? 1 : 0, guessesUsed: cur.moves, timeElapsed: el, abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((g2) => {
    abandon.markFlushed();
    const done = g2.pi >= NPEL;
    // Every LIVE ending funnels through here and a hydrated finished run never
    // does, so returning to an old board still shows the card straight away.
    holdEnd(done ? HOLD_SHORT : HOLD_LONG);
    const sc = scoreOf(g2.pi, NPEL);
    const el = Math.max(1, Math.round(g2.ms / 1000));
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: 10, g: g2.moves, won: done })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score: sc, total: 10, correct: done ? 1 : 0,
          guessesUsed: g2.moves, timeElapsed: el,   // moves: ties break on fewest, then time
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, NPEL, identity]);

  const finish = useCallback((st) => {
    commit({ ...st, status: 'over', tEnd: Date.now() });
    postResult({ ...st, status: 'over' });
  }, [commit, postResult]);

  // ---- moving --------------------------------------------------------------
  const move = useCallback((which) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const d = DIRS[which];
    if (!d) return;
    const now = Date.now();
    const moved = applyMove(PUZZLE, cur, d);
    // an illegal move is REFUSED, never fatal, and never costs a move
    if (!moved) {
      const h = cur.body[0];
      setBlocked({ x: h[0] + d[0], y: h[1] + d[1], at: now });
      return;
    }
    // an idle stretch over two minutes is thinking, not playing, so the clock
    // that breaks leaderboard ties stops counting it
    const next = { ...moved, ms: cur.ms + Math.min(120000, now - (cur.tMark || now)), tMark: now };
    if (isCleared(PUZZLE, next) || !anyLegal(PUZZLE, next)) { finish(next); return; }
    commit(next);
  }, [PUZZLE, commit, finish]);

  const DAS = 250, ARR = 85;
  const repRef = useRef({ t: null, i: null });
  const stopRepeat = useCallback(() => {
    if (repRef.current.t) { clearTimeout(repRef.current.t); repRef.current.t = null; }
    if (repRef.current.i) { clearInterval(repRef.current.i); repRef.current.i = null; }
  }, []);
  const startRepeat = useCallback((which) => {
    stopRepeat();
    move(which);
    repRef.current.t = setTimeout(() => { repRef.current.i = setInterval(() => move(which), ARR); }, DAS);
  }, [move, stopRepeat]);
  useEffect(() => stopRepeat, [stopRepeat]);

  const holdProps = (which) => ({
    onPointerDown: (e) => { e.preventDefault(); e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); startRepeat(which); },
    onPointerUp: stopRepeat, onPointerLeave: stopRepeat, onPointerCancel: stopRepeat,
    onContextMenu: (e) => e.preventDefault(),
  });

  // NO drag-to-move on the board (owner, 2026-08-08). The swipe handler that
  // used to live here captured pointer events over the canvas, so a thumb trying
  // to SCROLL THE PAGE dragged the gator the length of the board instead. On a
  // phone the d-pad is the only movement control; the canvas is now inert and
  // `touchAction` is left alone so the page scrolls over it like any other
  // element.

  // ---- the board -----------------------------------------------------------
  // THE BOARD IS DOM AND SVG NOW (board redesign, 2026-10-13), not a canvas.
  // Every colour on it is a stage token read by the browser, so it follows the
  // light switch and the category ramp with nothing resolved by hand, and it
  // stays crisp at any pixel ratio. The pitch (square plus gap) is the one
  // number that has to be measured: it comes off the width of the box, and on
  // a desktop off the window height too, so the board never runs under the fold.
  //
  // A phone fires resize every time the address bar hides; the measure is cheap
  // and only sets state when the pitch actually changes.
  const [pitch, setPitch] = useState(56);
  const sizeBoard = useCallback(() => {
    const box = boxRef.current;
    if (!box || typeof window === 'undefined') return;
    const fw = Math.max(140, box.clientWidth);
    const phone = window.innerWidth <= 640;
    const fh = phone ? Infinity : window.innerHeight - 400;
    // The ceiling is per square, so a smaller board is allowed BIGGER squares
    // rather than shrinking on screen as the puzzles get harder.
    const p = Math.max(26, Math.min(64, Math.floor(Math.min((fw + GAP) / PUZZLE.w, (fh + GAP) / PUZZLE.h))));
    setPitch((cur) => (cur === p ? cur : p));
  }, [PUZZLE.w, PUZZLE.h]);

  const PITCH = pitch;
  const SQ = PITCH - GAP;
  const SQR = Math.max(5, Math.round(SQ * 0.15));
  const BW = PUZZLE.w * PITCH - GAP, BH = PUZZLE.h * PITCH - GAP;
  // NEVER A BLANK MASCOT SQUARE: until a mascot's art has actually loaded, and
  // for good if it fails, the square shows the mascot's order number instead.
  const [broken, setBroken] = useState({});
  const [loaded, setLoaded] = useState({});
  const markBroken = useCallback((m) => setBroken((b) => (b[m] ? b : { ...b, [m]: true })), []);
  const markLoaded = useCallback((m) => setLoaded((b) => (b[m] ? b : { ...b, [m]: true })), []);
  const wallSet = useMemo(() => new Set((PUZZLE.walls || []).map(([x, y]) => y * PUZZLE.w + x)), [PUZZLE.walls, PUZZLE.w]);
  const playable = PUZZLE.w * PUZZLE.h - (PUZZLE.walls ? PUZZLE.walls.length : 0);
  const railFrac = NPEL > 1 ? Math.min(g.pi, NPEL - 1) / (NPEL - 1) : 0;
  const ctr = (v) => v * PITCH + SQ / 2;
  const trailD = g.body.map(([x, y], i) => `${i ? 'L' : 'M'}${ctr(x)} ${ctr(y)}`).join(' ');
  // the head: eyes sit forward of centre, either side of the line of travel
  const head = useMemo(() => {
    const [hx, hy] = g.body[0];
    const f = g.facing && (g.facing[0] || g.facing[1]) ? g.facing : [1, 0];
    const cx = hx * PITCH + SQ / 2, cy = hy * PITCH + SQ / 2;
    const fw = SQ * 0.15, sd = SQ * 0.14;
    const px = -f[1], py = f[0];
    return {
      cx, cy, er: Math.max(2.5, SQ * 0.068), deg: Math.round(Math.atan2(f[1], f[0]) * 180 / Math.PI),
      eyes: [[cx + f[0] * fw + px * sd, cy + f[1] * fw + py * sd], [cx + f[0] * fw - px * sd, cy + f[1] * fw - py * sd]],
    };
  }, [g.body, g.facing, PITCH, SQ]);
  const dead = over && !cleared;
  // THE GATOR'S LEGS AND TAIL (owner, 2026-10-14: make it look like an
  // alligator). A front pair sits on the square behind the head, a back pair on
  // the square before the tail, each splayed out sideways and swept back; the
  // tail tapers to a point off the last square. Short bodies get what fits.
  const gator = useMemo(() => {
    const b = g.body, n = b.length, legs = [];
    const c = (v) => v * PITCH + SQ / 2;
    const legAt = (i) => {
      const [x, y] = b[i], [qx, qy] = b[i - 1];
      const dx = qx - x, dy = qy - y, px = -dy, py = dx, X = c(x), Y = c(y);
      const nx = i < n - 1 ? b[i + 1][0] - x : 0, ny = i < n - 1 ? b[i + 1][1] - y : 0;
      for (const sd of [1, -1]) {
        if (px * sd === nx && py * sd === ny) continue; // this side runs into the body at a bend
        const ax = X + px * sd * SQ * 0.1, ay = Y + py * sd * SQ * 0.1;
        const kx = X + px * sd * SQ * 0.3 + dx * SQ * 0.06, ky = Y + py * sd * SQ * 0.3 + dy * SQ * 0.06;
        const fx = X + px * sd * SQ * 0.38 - dx * SQ * 0.12, fy = Y + py * sd * SQ * 0.38 - dy * SQ * 0.12;
        legs.push({ d: `M${ax} ${ay}L${kx} ${ky}L${fx} ${fy}`, fx, fy });
      }
    };
    // a leg pair hidden under a bend reads as a stray bracket, so each pair
    // takes the nearest square where the body runs straight
    const straight = (i) => i > 0 && i < n - 1
      && b[i - 1][0] - b[i][0] === b[i][0] - b[i + 1][0] && b[i - 1][1] - b[i][1] === b[i][1] - b[i + 1][1];
    const pick = (from, to, step) => { for (let i = from; step > 0 ? i <= to : i >= to; i += step) if (straight(i)) return i; return from; };
    let front = -1;
    if (n >= 2) { front = n >= 3 ? pick(1, Math.min(3, n - 2), 1) : 1; legAt(front); }
    if (n >= 5) { const back = pick(n - 2, Math.max(front + 2, n - 4), -1); if (back > front + 1) legAt(back); }
    let tail = null;
    if (n >= 2) {
      const [x, y] = b[n - 1], [qx, qy] = b[n - 2];
      const dx = x - qx, dy = y - qy, px = -dy, py = dx, X = c(x), Y = c(y), w = SQ * 0.185;
      tail = `M${X + px * w} ${Y + py * w}L${X + dx * SQ * 0.48} ${Y + dy * SQ * 0.48}L${X - px * w} ${Y - py * w}Z`;
    }
    return { legs, tail };
  }, [g.body, PITCH, SQ]);
  const stillOpen = useMemo(() => {
    if (cleared) return false;
    const [hx, hy] = g.body[0];
    return DIR_KEYS.some((k) => canEnter(PUZZLE, { ...g, status: 'playing' }, hx + DIRS[k][0], hy + DIRS[k][1]));
  }, [PUZZLE, g, cleared]);
  const nextName = cleared ? null : LABEL[CAST[g.pi]];
  // NO MOVE HINTS (owner, 2026-10-14): the board no longer marks where the head
  // can go, the pad no longer lights the open keys, and the status line no
  // longer lists the ways on. Finding the way is the puzzle.
  const padTone = () => '';

  // THE STATUS LINE, every clause read off the live state.
  let statusMain;
  let statusSub = null;
  if (playing) {
    const lead = g.chewing && g.pi > 0
      ? `${LABEL[CAST[g.pi - 1]]} eaten.`
      : g.moves === 0 ? `The ${nextName} goes first.` : `Heading for the ${nextName}.`;
    statusMain = lead;
    // the solid-mascot reminder, only when one is actually touching the head
    const [hx, hy] = g.body[0];
    for (let k = g.pi + 1; k < PUZZLE.pellets.length; k++) {
      const [mx, my] = PUZZLE.pellets[k];
      const dx = mx - hx, dy = my - hy;
      if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
      const rel = dx < 0 ? 'to your left' : dx > 0 ? 'to your right' : dy < 0 ? 'above you' : 'below you';
      statusSub = `The ${LABEL[CAST[k]]} ${rel} is solid until its turn.`;
      break;
    }
  } else if (cleared) {
    statusMain = `All ${NPEL} eaten in ${nf(g.moves)} moves.`;
    statusSub = 'Your result is recorded.';
  } else if (stillOpen) {
    statusMain = `Run ended with ${g.pi} of ${NPEL} eaten. The ${nextName} was next.`;
    statusSub = 'Your result is recorded as it stood.';
  } else {
    statusMain = `Boxed in with ${g.pi} of ${NPEL} eaten. The ${nextName} was next.`;
    statusSub = 'Your result is recorded.';
  }
  const boardLabel = `Chomp board, ${PUZZLE.w} by ${PUZZLE.h}. ${g.pi} of ${NPEL} mascots eaten${nextName ? `, the ${nextName} is next` : ''}. ${g.body.length} of ${playable} squares covered.`;

  // Restart while playing, Try again once the run is over. Drawn in one place on
  // a desktop (the status row) and another on a phone (the foot), the same
  // control and the same two-tap arming either way.
  const restartCtl = () => (playing ? (
    <button
      onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartRun(); } else { setArmGive(false); setArmRestart(Date.now()); } }}
      title={armRestart ? 'Records this run as it stands, then deals the board again' : 'Record this run as it stands and start the board over'}
      className={`ch-ctl${armRestart ? ' is-armed' : ''}`}
    >
      <RotateCcw size={16} style={{ flexShrink: 0 }} aria-hidden="true" /> {armRestart ? 'Press again' : 'Restart'}
    </button>
  ) : (
    <button onClick={tryAgain} title="Play this board again. Your recorded result stands." className="ch-ctl is-again">
      <RotateCcw size={16} style={{ flexShrink: 0 }} aria-hidden="true" /> Try again
    </button>
  ));
  useEffect(() => {
    if (!armGive) return undefined;
    const t = setTimeout(() => setArmGive(false), 3500);
    return () => clearTimeout(t);
  }, [armGive]);
  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);
  useEffect(() => {
    if (!blocked) return;
    const t = setTimeout(() => setBlocked(null), BLOCK_MS);
    return () => clearTimeout(t);
  }, [blocked]);
  useEffect(() => {
    if (!hydrated) return;
    sizeBoard();
    const on = () => sizeBoard();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [hydrated, sizeBoard, started, preStart]);

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    const now = Date.now();
    commit({ ...cur, t0: now, tMark: now });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(sizeBoard, 0);
  }
  // GIVE UP books the run exactly as it stands and ends it; TRY AGAIN then
  // re-deals the same board. Two controls, one at a time, because they are two
  // different decisions: the first costs you the day, the second costs nothing
  // because the result is already recorded and recordStat is write-once.
  //
  // Give up is two-tap armed, in the house pattern Four uses: the armed label is
  // short and the button reserves a fixed width, so the row cannot reflow and
  // slide out from under a thumb mid-confirm. The consequence prints on its own
  // line below, where it cannot move the button either.
  const giveUp = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const now = Date.now();
    const ended = { ...cur, ms: cur.ms + Math.min(120000, now - (cur.tMark || now)) };
    commit({ ...ended, status: 'over', tEnd: now });
    postResult({ ...ended, status: 'over' });
  }, [commit, postResult]);

  const tryAgain = useCallback(() => {
    releaseEnd();
    const now = Date.now();
    // t0 is set straight away rather than dropping back to the start tile: that
    // tile exists to keep the FIRST attempt's clock honest, and this is not one.
    commit({ ...freshState(PUZZLE), t0: now, tMark: now });
    setBlocked(null);
    // FALSE, not true (fixed 2026-08-12). endClosed hides the end card, and
    // nothing else in this file ever cleared it, so a player who replayed once
    // and then CLEARED THE BOARD got no end card: the run finished, the result
    // posted, and the screen just sat there looking frozen. Replay is free here
    // and the rules push it, so the winning run is usually the second one and
    // almost every clear was swallowed. Setting it false on re-deal is the house
    // pattern (Four, Paths and Tuck all do it in resetGame). The card is hidden
    // while a run is live by the !playing gate, never by this flag.
    setEndClosed(false);
  }, [releaseEnd, PUZZLE, commit]);

  // RESTART = the give-up booking plus the re-deal, in one press. It posts the
  // run exactly as giveUp does (same clock arithmetic, same postResult, so
  // markFlushed suppresses any later abandon row and write-once recordStat keeps
  // the first result) and then hands straight to tryAgain, which releases the
  // end hold and deals the board again. It deliberately does NOT commit the
  // ended state first: tryAgain's own commit lands a tick later and would only
  // overwrite it, and nothing renders in between.
  const restartRun = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const now = Date.now();
    const ended = { ...cur, ms: cur.ms + Math.min(120000, now - (cur.tMark || now)) };
    postResult({ ...ended, status: 'over' });
    tryAgain();
  }, [postResult, tryAgain]);

  useEffect(() => {
    const onKey = (e) => {
      if (showHelp) { if (e.key === 'Escape') setShowHelp(false); return; }
      const map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
      };
      if (!map[e.key]) return;
      e.preventDefault();
      if (e.repeat) return;   // a held key is not a sequence of moves: every step here is permanent
      move(map[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, showHelp]);

  // ---- share ---------------------------------------------------------------
  // Counts only. Nothing here describes the route, so a shared result can never
  // hand somebody the board.
  function shareText() {
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    const line = cleared
      ? `all ${NPEL} in ${g.moves} moves`
      : `${g.pi}/${NPEL} · boxed in after ${g.moves} moves`;
    return `Chomp #${PUZZLE.num}${sun} · ${line}\nmindloftdaily.com/chomp`;
  }
  function copyShare() {
    const txt = shareText();
    if (notifyShareCredit(txt)) return;
    try {
      if (isMobileDevice() && navigator.share) { navigator.share({ text: txt }).catch(() => {}); return; }
      navigator.clipboard.writeText(txt);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch (e) {}
  }

  // ---- rules ---------------------------------------------------------------
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead={`Eat today's ${NPEL} mascots in order. Every square you touch stays yours, so your own trail is the maze, and today there is exactly ONE route that gets all ${NPEL}.`}
      banner={`Everyone gets the same board today${PUZZLE.sunday ? ", and today's Sunday Edition is the bigger " + PUZZLE.w + "x" + PUZZLE.h + " board with all " + NPEL + " mascots" : ''}.`}
      sub="The bulldog always goes first. Everything after it is a fresh order every day, and the cast gets SHORTER through the week: each mascot is a signpost on the one route, so the fewer of them there are, the more of it you have to work out." 
      steps={[
        <>Move one square at a time with the <b>arrow keys</b> or the pad. Nothing moves until you do.</>,
        <>Your body <b>never shrinks</b>. Where you have been is a wall for the rest of the run.</>,
        <>A mascot whose turn has not come is <b>solid</b>. You cannot cross the tiger to reach the gamecock.</>,
        <>There is <b>exactly one route</b> that eats the whole cast, and it uses <b>every square on the board</b>. Nothing is spare, so there is no second way round.</>,
        <>Steering into a wall is <b>refused</b>, not punished, and costs no move. The run ends only when the head has nowhere legal left to go.</>,
        <>Boxed in early? <b>Give up</b> ends the run and <b>records it as it stands</b>, and then <b>Try again</b> re-deals the same board. <b>Restart</b> does both in one press. Only your first result counts on the leaderboard, so a second run costs nothing.</>,
      ]}
      knack="Work backwards from the last mascot. Because the route has to cover every square and there is only one that does, the question at each junction is never 'which way is quicker' but 'which way can still come back for that corner'. When a move looks obviously right, that is usually the one worth checking."
      footer={`Scored on HOW FAR DOWN THE CAST YOU GOT, so you do not need all ${NPEL}: stall on the fifth and you still score five. Clearing the whole cast is a perfect 10. Ties break on fewest moves, then on time. Giving up or restarting records the run as it stood, and only your first result is leaderboard eligible. The cast SHRINKS through the week, from ten signposts on Monday to eight on Saturday, and the Sunday Edition moves up to an 8x8 board with the whole cast on it.`}
    />
  );

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };
  const dockBtn = { width: 46, height: 44, borderRadius: 9, border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' };
  const stat = (label, value, tone) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stg-ink2, #94a3b8)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: tone || INK, lineHeight: 1.2 }}>{value}</div>
    </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="chomp" name="Chomp" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="chomp" quizId={PUZZLE.quizId}
          name="Chomp"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: g.moves, k: 'moves' },
          ] : [
            { v: g.moves, k: 'moves' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
        <DailyMasthead
          slug="chomp"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>
              Sunday Edition &middot; all {NPEL}
            </span>
          )}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Chomp is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Eat today&apos;s {NPEL} mascots in order. Every square you touch stays yours for the rest of the run, so your trail and the bolted-down bleachers are all that stand in your way. Replay is free.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={startGame} style={{ ...btn, background: STAGE ? STAGE_C : T.cta, borderColor: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: STAGE ? '2px 0 0' : 14 }}>
            {/* THE CAST RAIL (board redesign, 2026-10-13). Every mascot in eating
                order as its own art in a round token, joined by a progress line.
                Eaten ones fade under an accent check, the next one is ringed in
                the accent. Desktop names every token; a phone shows the icons
                and names only the next one, in the line above. */}
            <div className="ch-castwrap">
              <div className="ch-casthead">
                <span className="ch-lbl ch-dsk">The cast &middot; eat in this order</span>
                <span className="ch-lbl ch-ph">
                  {cleared ? 'All eaten' : <>Next &middot; <b className="ch-nextname">{LABEL[CAST[g.pi]]}</b></>}
                </span>
                <span className="ch-lbl"><b style={{ color: 'var(--stg-acc-ink)' }}>{g.pi}</b> of {NPEL} eaten</span>
              </div>
              <div className="ch-rail">
                <span className="ch-rail-line" aria-hidden="true" />
                <span className="ch-rail-fill" aria-hidden="true" style={{ width: `calc((100% - var(--ch-tw)) * ${railFrac})` }} />
                {CAST.map((m, i) => {
                  const done = i < g.pi, next = i === g.pi;
                  return (
                    <div key={m} className={`ch-tok${next ? ' is-next' : ''}${done ? ' is-done' : ''}`}>
                      <span className="ch-tok-disc">
                        {!loaded[m] && <span className="ch-tok-num">{i + 1}</span>}
                        {!broken[m] && <img src={`/games/chomp/${m}.png`} alt="" onLoad={() => markLoaded(m)} onError={() => markBroken(m)} className={`ch-tok-img${loaded[m] ? '' : ' ch-wait'}`} />}
                        {done && (
                          <span className="ch-tok-check" aria-hidden="true">
                            <svg viewBox="0 0 12 12" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.2l2 2 4-4.4" /></svg>
                          </span>
                        )}
                      </span>
                      <span className="ch-tok-name ch-dsk">{LABEL[m]}</span>
                      <span className="ch-sr">{`${i + 1}. ${LABEL[m]}${done ? ', eaten' : next ? ', next' : ''}`}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ch-panel">
              <div ref={boxRef} className="ch-boxfit">
                <div className="ch-board" role="img" aria-label={boardLabel} style={{ width: BW, height: BH }}>
                  {/* the squares: yours tinted, bleachers bolted down */}
                  {Array.from({ length: PUZZLE.w * PUZZLE.h }, (_, idx) => {
                    const x = idx % PUZZLE.w, y = Math.floor(idx / PUZZLE.w);
                    const wall = wallSet.has(idx);
                    const mine = !wall && !!g.occ[idx];
                    return (
                      <span key={idx} className={`ch-sq${mine ? ' is-mine' : ''}${wall ? ' is-wall' : ''}`}
                        style={{ left: x * PITCH, top: y * PITCH, width: SQ, height: SQ, borderRadius: SQR }} />
                    );
                  })}
                  {/* the gator: one continuous accent body, then the head */}
                  <svg className="ch-trail" width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} aria-hidden="true">
                    {/* legs: a front pair just behind the head and a back pair near the tail */}
                    {gator.legs.map((l, k) => (
                      <g key={'lg' + k}>
                        <path d={l.d} fill="none" strokeWidth={Math.max(4, SQ * 0.14)} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--stg-acc)' }} />
                        <circle cx={l.fx} cy={l.fy} r={Math.max(3, SQ * 0.085)} style={{ fill: 'var(--stg-acc)' }} />
                      </g>
                    ))}
                    <path d={trailD} fill="none" strokeWidth={Math.round(SQ * 0.37)} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--stg-acc)' }} />
                    {gator.tail && <path d={gator.tail} style={{ fill: 'var(--stg-acc)' }} />}
                    {g.body.length > 1 && (
                      <path d={trailD} fill="none" strokeWidth={Math.max(2, SQ * 0.05)} strokeDasharray={`2 ${Math.round(SQ * 0.23)}`} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--stg-onramp)', strokeOpacity: 0.5 }} />
                    )}
                    {/* the head: a long snout with teeth, nostrils, and raised eyes */}
                    <g transform={`translate(${head.cx} ${head.cy}) rotate(${head.deg}) scale(${SQ})`}>
                      <path d="M-0.34 -0.22 Q-0.34 -0.31 -0.2 -0.31 L0.08 -0.25 L0.42 -0.16 Q0.53 -0.13 0.53 0 Q0.53 0.13 0.42 0.16 L0.08 0.25 L-0.2 0.31 Q-0.34 0.31 -0.34 0.22 Z" style={{ fill: 'var(--stg-acc)' }} />
                      <path d="M0.52 0 L0.04 0" fill="none" strokeWidth="0.03" strokeLinecap="round" style={{ stroke: 'var(--stg-onramp)', strokeOpacity: 0.85 }} />
                      <path d="M0.14 -0.235 L0.2 -0.22 L0.17 -0.17 Z M0.25 -0.21 L0.31 -0.195 L0.28 -0.145 Z M0.36 -0.18 L0.41 -0.165 L0.39 -0.12 Z M0.14 0.235 L0.2 0.22 L0.17 0.17 Z M0.25 0.21 L0.31 0.195 L0.28 0.145 Z M0.36 0.18 L0.41 0.165 L0.39 0.12 Z" style={{ fill: 'var(--stg-onramp)' }} />
                      <circle cx="0.47" cy="-0.05" r="0.022" style={{ fill: 'var(--stg-onramp)' }} />
                      <circle cx="0.47" cy="0.05" r="0.022" style={{ fill: 'var(--stg-onramp)' }} />
                      {[-1, 1].map((sd) => (
                        <g key={sd}>
                          <circle cx="-0.1" cy={sd * 0.2} r="0.115" style={{ fill: 'var(--stg-acc)' }} />
                          {dead ? (
                            <path d={`M-0.16 ${sd * 0.2 - 0.06}L-0.04 ${sd * 0.2 + 0.06}M-0.04 ${sd * 0.2 - 0.06}L-0.16 ${sd * 0.2 + 0.06}`} fill="none" strokeWidth="0.035" strokeLinecap="round" style={{ stroke: 'var(--stg-onramp)' }} />
                          ) : (
                            <>
                              <circle cx="-0.1" cy={sd * 0.2} r="0.075" style={{ fill: 'var(--stg-onramp)' }} />
                              <ellipse cx="-0.085" cy={sd * 0.2} rx="0.022" ry="0.055" style={{ fill: 'var(--stg-acc)' }} />
                            </>
                          )}
                        </g>
                      ))}
                    </g>
                  </svg>
                  {/* the mascots still to eat, numbered, the next one boxed in ink */}
                  {PUZZLE.pellets.map(([mx, my], i) => {
                    if (i < g.pi) return null;
                    const next = i === g.pi;
                    const m = CAST[i];
                    const inset = Math.round(SQ * 0.07);
                    return (
                      <span key={m} className={`ch-pel${next ? ' is-next' : ''}`}
                        style={{ left: mx * PITCH + inset, top: my * PITCH + inset, width: SQ - inset * 2, height: SQ - inset * 2, borderRadius: Math.round(SQ * 0.2), borderWidth: next ? (SQ >= 50 ? 3 : 2.5) : 0 }}>
                        {!loaded[m] && <span className="ch-pel-fallback">{i + 1}</span>}
                        {!broken[m] && <img src={`/games/chomp/${m}.png`} alt={LABEL[m]} onLoad={() => markLoaded(m)} onError={() => markBroken(m)} className={`ch-pel-img${loaded[m] ? '' : ' ch-wait'}`} />}
                        <span className="ch-pel-n" style={SQ < 50 ? { minWidth: 15, height: 15, fontSize: 9, left: -4, top: -4 } : null}>{i + 1}</span>
                      </span>
                    );
                  })}
                  {blocked && blocked.x >= 0 && blocked.y >= 0 && blocked.x < PUZZLE.w && blocked.y < PUZZLE.h && (
                    <span className="ch-blocked" style={{ left: blocked.x * PITCH, top: blocked.y * PITCH, width: SQ, height: SQ, borderRadius: SQR }} />
                  )}
                  {!cleared && SQ >= 50 && (() => {
                    const [nx, ny] = PUZZLE.pellets[g.pi];
                    const above = ny > 0;
                    const leftSide = nx < PUZZLE.w / 2;
                    return (
                      <span className="ch-nexttag ch-dsk" aria-hidden="true" style={{
                        top: above ? ny * PITCH - 22 : (ny + 1) * PITCH - 2,
                        ...(leftSide ? { left: nx * PITCH } : { right: BW - (nx * PITCH + SQ) }),
                      }}>Next &middot; {LABEL[CAST[g.pi]]}</span>
                    );
                  })()}
                </div>
              </div>

              <div className="ch-cov" style={{ width: BW }}>
                <span className="ch-lbl">Board covered &middot; {g.body.length} of {playable}</span>
                <div className="ch-cov-bar" aria-hidden="true">
                  {Array.from({ length: playable }, (_, k) => (
                    <span key={k} className={k < g.body.length ? 'is-on' : undefined} />
                  ))}
                </div>
              </div>

              {/* THE STATUS LINE: what just happened and what is open, in plain
                  words, read off the live state. Never a claim the board does not
                  support: the ways-on list is the engine's own canEnter. */}
              <div className="ch-status">
                <div className="ch-status-text" aria-live="polite">
                  <span className="ch-status-main">{statusMain}</span>
                  <span className="ch-status-sub">
                    {statusSub || (
                      <>
                        <span className="ch-keys">Arrow keys or WASD to move. A blocked move is refused, not fatal.</span>
                        <span className="ch-touchhint">Hold an arrow to keep going. A blocked move is refused, not fatal.</span>
                      </>
                    )}
                  </span>
                </div>
                {engaged && <span className="ch-dsk-flex">{restartCtl()}</span>}
              </div>
            </div>

            <div className="ch-dock">
              <div className="ch-pad">
                <button className={`ch-up${padTone('up')}`} {...holdProps('up')} aria-label="Move up">&#9650;</button>
                <button className={`ch-lf${padTone('left')}`} {...holdProps('left')} aria-label="Move left">&#9664;</button>
                <button className={`ch-dn${padTone('down')}`} {...holdProps('down')} aria-label="Move down">&#9660;</button>
                <button className={`ch-rt${padTone('right')}`} {...holdProps('right')} aria-label="Move right">&#9654;</button>
              </div>
            </div>

            {engaged && (
              <div className="ch-foot">
                <div className="ch-foot-row">
                  <span className="ch-foot-hint">
                    {playing ? 'Your trail stays put. Score is how far down the cast you get.' : 'Your result is recorded. Play it again as often as you like.'}
                  </span>
                  <span className="ch-ph-flex">{restartCtl()}</span>
                  {playing && (
                    <button
                      onClick={() => { if (armGive) { if (Date.now() - armGive < ARM_MIN_MS) return; setArmGive(false); giveUp(); } else { setArmRestart(false); setArmGive(Date.now()); } }}
                      title={armGive ? 'Ends the run and records it as it stands' : 'End the run now and record it as it stands'}
                      className={`ch-giveup${armGive ? ' is-armed' : ''}`}
                    >
                      <Flag size={13} style={{ flexShrink: 0 }} aria-hidden="true" /> {armGive ? 'Press again' : 'Give up'}
                    </button>
                  )}
                </div>
                {(armGive || armRestart) && (
                  <div className="ch-armline" style={{ color: armGive ? 'var(--stg-bad)' : 'var(--stg-acc-ink)' }}>
                    {armGive
                      ? 'Ends the run and records it as it stands.'
                      : 'Records this run as it stands, then deals the board again.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Only for players who have not joined. Rendering this unconditionally
            is the bug that makes a signed-in player get asked to sign up on
            every board; Turn and Paths gate it on !identity and so does this. */}

          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Chomp"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={won ? g.moves : null}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${nf(g.moves)} moves`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Chomp all time` : 'all-time rank' }
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
                  href: `/chomp?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Chomp', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/chomp?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: tryAgain },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        {/* end of the navy play stage; everything below is the light tail */}
        </div>
        {!identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        {LOFT && (
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="chomp" name="Chomp" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
        )}
        {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
        {!playing && <AddToHome name="Chomp" />}
        <div id="stf-stats-slot" />
        {!LOFT && (
        <DailyGamesGrid
          self="chomp"
          maxWidth={620}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          divider
          boardSlot={<DailyBoardPanel self="chomp" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
        />
        )}

        {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
        <StageFold />
        <section style={{ display: STAGE ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Chomp</h2>
          <p style={{ margin: '0 0 9px' }}>
            Chomp is a daily route puzzle. A handful of mascots sit on a small board and have to be eaten in order,
            and every square you touch belongs to you for the rest of the run. Nothing chases you and nothing is on a timer.
            The only obstacle is the trail you have already laid, which is why the shortest line to the fourth mascot is
            so often the line that walls off the fifth. The board is as tight as it can be: there is exactly ONE route that
            eats the whole cast, it uses every square on the board, and nothing is spare. One wrong turn in forty-eight
            moves and the run is over.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            You do not need all of them. The score is how far down the cast you got, so a run that stalls still counts.
            Everybody plays the same board on the same day, ties break on fewest moves, and giving up records the run as it
            stood, so the first attempt is the one that counts. The bulldog always leads and the rest are dealt fresh each
            day. Each mascot is a signpost on the one route, so the cast gets shorter through the week, from ten on Monday
            to eight on Saturday; the Sunday Edition moves up to a bigger 8x8 board and puts the whole cast on it.
          </p>
          <p style={{ margin: 0 }}>
            More daily puzzles: <a href="/parker" style={{ color: ACC_INK }}>Parker</a>,{' '}
            <a href="/etch" style={{ color: ACC_INK }}>Etch</a>,{' '}
            <a href="/hedge" style={{ color: ACC_INK }}>Hedge</a>.
          </p>
        </section>
      </div>

      {/* OUTSIDE the page column on purpose: the column is a stacking context and
          the end card's backdrop paints under the header from inside it. */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="chomp"
          won={won}
          quizId={PUZZLE.quizId}
          headline={won ? <>All {NUMWORD[NPEL] || NPEL}.</> : <>You got {g.pi} of {NPEL}</>}
          subline={won
            ? <>{nf(g.moves)} moves &middot; board {fillPct}% full &middot; {fmtTime(g.ms)}</>
            : <>Boxed in on the {LABEL[CAST[g.pi]] || 'next one'} &middot; {nf(g.moves)} moves &middot; board {fillPct}% full</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={tryAgain}
          onClose={() => setEndClosed(true)}
        />
      )}

      {showHelp && (
        <div
          onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ ...btn, marginTop: 14, background: COLORS.ink, borderColor: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .ch-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .ch-lbl { font-family: ${SANS}; font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--stg-mute, #525c70); font-variant-numeric: tabular-nums; }
        .ch-ph, .ch-ph-flex { display: none; }
        .ch-dsk-flex { display: inline-flex; }
        .ch-castwrap { display: flex; flex-direction: column; gap: 10px; }
        .ch-casthead { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
        .ch-nextname { color: var(--stg-ink, #0f1420); font-size: 13px; letter-spacing: 0; text-transform: none; }
        .ch-rail { --ch-tw: 58px; --ch-td: 40px; position: relative; display: flex; justify-content: space-between; }
        .ch-rail-line, .ch-rail-fill { position: absolute; left: calc(var(--ch-tw) / 2); top: calc(var(--ch-td) / 2 - 1.5px); height: 3px; border-radius: 2px; }
        .ch-rail-line { right: calc(var(--ch-tw) / 2); background: var(--stg-line2, #cdd3dd); }
        .ch-rail-fill { background: var(--stg-acc); }
        .ch-tok { position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; width: var(--ch-tw); }
        .ch-tok-disc { position: relative; width: var(--ch-td); height: var(--ch-td); box-sizing: border-box; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--stg-ground, #fff); border: 1.5px solid var(--stg-line2, #cdd3dd); }
        .ch-tok.is-next .ch-tok-disc { border: 0; box-shadow: 0 0 0 3px var(--stg-ground, #fff), 0 0 0 5px var(--stg-acc); }
        .ch-tok-img { display: block; width: 75%; height: 75%; object-fit: contain; }
        .ch-tok.is-done .ch-tok-img { opacity: .45; }
        .ch-wait { position: absolute; width: 1px !important; height: 1px !important; opacity: 0; }
        .ch-tok-num { font-family: ${SANS}; font-size: 13px; font-weight: 800; color: var(--stg-ink, #0f1420); }
        .ch-tok-check { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; box-sizing: border-box; padding: 3px; border-radius: 50%; background: var(--stg-acc); color: var(--stg-onramp, #fff); box-shadow: 0 0 0 2px var(--stg-ground, #fff); display: flex; }
        .ch-tok-name { font-family: ${SANS}; font-size: 11px; font-weight: 600; color: var(--stg-mute, #525c70); white-space: nowrap; }
        .ch-tok.is-next .ch-tok-name { font-weight: 800; color: var(--stg-ink, #0f1420); }

        .ch-panel { margin-top: 16px; background: var(--stg-surf, #fff); border: 1px solid var(--stg-line, #cdd3dd); border-radius: 20px; display: flex; flex-direction: column; align-items: center; padding: 20px 20px 16px; }
        .ch-boxfit { width: 100%; display: flex; justify-content: center; }
        .ch-board { position: relative; flex: none; }
        .ch-sq { position: absolute; box-sizing: border-box; background: var(--stg-b1, #f1f3f7); border: 1px solid var(--stg-line, #cdd3dd); }
        .ch-sq.is-mine { background: var(--stg-acc-tint, rgba(15,118,110,.18)); }
        .ch-sq.is-wall { background: var(--stg-sq-d, #94a1b5) repeating-linear-gradient(180deg, transparent 0 30%, var(--stg-ground, #fff) 30% 36%, transparent 36% 64%, var(--stg-ground, #fff) 64% 70%, transparent 70% 100%); border-color: var(--stg-sq-d, #94a1b5); }
        .ch-trail { position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible; }
        .ch-pel { position: absolute; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 0 solid var(--stg-ink, #0f1420); }
        .ch-pel.is-next { background: var(--stg-surf, #fff); }
        .ch-pel-img { display: block; width: 82%; height: 82%; object-fit: contain; opacity: .8; }
        .ch-pel.is-next .ch-pel-img { opacity: 1; }
        .ch-pel-fallback { width: 70%; height: 70%; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--stg-chip, #dfe4ec); color: var(--stg-ink, #0f1420); font-family: ${SANS}; font-weight: 800; font-size: 15px; }
        .ch-pel-n { position: absolute; left: -5px; top: -5px; min-width: 18px; height: 18px; padding: 0 4px; box-sizing: border-box; border-radius: 9px; background: var(--stg-chip, #dfe4ec); color: var(--stg-ink, #0f1420); font-family: ${SANS}; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .ch-pel.is-next .ch-pel-n { background: var(--stg-ink, #0f1420); color: var(--stg-ground, #fff); }
        .ch-blocked { position: absolute; box-sizing: border-box; border: 2.5px solid var(--stg-bad, #be123c); pointer-events: none; }
        .ch-nexttag { position: absolute; z-index: 2; padding: 3px 8px; border-radius: 7px; background: var(--stg-ink, #0f1420); color: var(--stg-ground, #fff); font-family: ${SANS}; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; pointer-events: none; }

        .ch-cov { display: flex; flex-direction: column; gap: 5px; margin-top: 16px; max-width: 100%; }
        .ch-cov-bar { display: flex; gap: 2px; }
        .ch-cov-bar span { flex: 1; height: 6px; border-radius: 2px; background: var(--stg-line2, #cdd3dd); }
        .ch-cov-bar span.is-on { background: var(--stg-acc); }

        .ch-status { width: 100%; margin-top: 16px; display: flex; align-items: center; gap: 10px; border-top: 1px solid var(--stg-line, #cdd3dd); padding-top: 14px; }
        .ch-status-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .ch-status-main { font-family: ${SANS}; font-size: 15px; font-weight: 700; line-height: 1.4; color: var(--stg-ink, #0f1420); }
        .ch-status-sub { font-family: ${SANS}; font-size: 12px; font-weight: 600; line-height: 1.45; color: var(--stg-mute, #525c70); }
        .ch-touchhint { display: none; }

        .ch-ctl { display: inline-flex; align-items: center; justify-content: center; gap: 7px; font-family: ${SANS}; font-weight: 700; font-size: 14px; background: transparent; color: var(--stg-ink2, #2c3446); border: 1.5px solid var(--stg-mute2, #78839a); border-radius: 12px; padding: 0 16px; min-height: 48px; min-width: 132px; cursor: pointer; }
        .ch-ctl.is-armed { color: var(--stg-acc-ink); border-color: var(--stg-acc); }
        .ch-ctl.is-again { color: var(--stg-acc-ink); border-color: var(--stg-acc); }
        .ch-foot { padding: 12px 0 0; }
        .ch-foot-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .ch-foot-hint { font-family: ${SANS}; font-size: 12px; font-weight: 600; color: var(--stg-mute, #525c70); }
        .ch-giveup { flex: none; display: inline-flex; align-items: center; justify-content: flex-end; gap: 5px; min-width: 104px; min-height: 44px; padding: 0 4px; background: none; border: 0; cursor: pointer; font-family: ${SANS}; font-size: 12px; font-weight: 700; color: var(--stg-ink2, #2c3446); }
        .ch-giveup.is-armed { color: var(--stg-bad, #be123c); }
        .ch-armline { font-family: ${SANS}; font-size: 11.5px; font-weight: 700; margin-top: 2px; text-align: right; line-height: 1.4; }

        .ch-dock { display: flex; justify-content: center; margin-top: 14px; }
        .ch-pad {
          display: grid;
          grid-template-areas: "lf up rt" "lf dn rt";
          grid-template-columns: repeat(3, 64px);
          grid-template-rows: repeat(2, 50px);
          gap: 6px;
          justify-content: center;
        }
        .ch-up { grid-area: up; }
        .ch-lf { grid-area: lf; }
        .ch-dn { grid-area: dn; }
        .ch-rt { grid-area: rt; }
        .ch-pad button { border-radius: 12px; border: 1.5px solid var(--stg-mute2, #78839a); background: var(--stg-surf, #fff); color: var(--stg-ink, #0f1420); font-family: ${SANS}; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
        @media (min-width: 901px) and (hover: hover) and (pointer: fine) {
          .ch-dock { display: none; }
        }
        @media (max-width: 640px) {
          .ch-dsk, .ch-dsk-flex, .ch-keys, .ch-foot-hint { display: none !important; }
          .ch-ph { display: inline; }
          .ch-ph-flex { display: flex; flex: 1; }
          .ch-ph-flex .ch-ctl { flex: 1; min-height: 46px; }
          .ch-touchhint { display: inline; }
          .ch-lbl { font-size: 10px; }
          .ch-castwrap { gap: 8px; }
          .ch-rail { --ch-tw: 30px; --ch-td: 30px; }
          .ch-rail-line, .ch-rail-fill { height: 2px; top: calc(var(--ch-td) / 2 - 1px); }
          .ch-tok-check { width: 14px; height: 14px; padding: 2px; }
          .ch-tok.is-next .ch-tok-disc { box-shadow: 0 0 0 2px var(--stg-ground, #fff), 0 0 0 4px var(--stg-acc); }
          .ch-panel { margin-top: 12px; border-radius: 18px; padding: 12px; }
          .ch-cov { margin-top: 10px; gap: 4px; }
          .ch-cov-bar { gap: 1px; }
          .ch-cov-bar span { height: 5px; border-radius: 1px; }
          .ch-status { margin-top: 12px; padding-top: 10px; }
          .ch-status-main { font-size: 14px; }
          .ch-foot-row { justify-content: flex-start; }
          .ch-giveup { font-size: 13px; padding: 0 10px; }
        }
      ` }} />

      {!STAGE && <Footer />}
    </div>
  );
}
