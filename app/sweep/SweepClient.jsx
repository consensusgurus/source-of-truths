'use client';

// Sweep — the daily minesweeper with no bottom edge.
//
// The field runs 200 rows down and every one of them is PROVEN deducible before
// it ships (lib/sweep-field, and scripts/verify-sweep re-proves the whole bank
// through that same module). That guarantee is the whole design: a run is one
// life, so if a board could force a guess, a run would end through no fault of
// the player. It cannot. Every death here is a misread.
//
// Same field for everybody on the day, and, like Blocks, unlimited runs with
// your BEST one taking the board (see isArcade in lib/daily-games). Replaying a
// deduction puzzle you have already seen would normally be pointless, but the
// field is 1,800 cells deep and nobody memorises it: what a second run buys you
// is a cleaner read of the same evidence.
//
// Score is CELLS UNCOVERED, a raw count with no ceiling, which is why Sweep is
// a tally game (`unit: 'cells'`). Ties break on FEWEST DIGS, so a player who
// lets the cascades do the work outranks one who clicked every cell by hand.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Flag, Pickaxe } from 'lucide-react';
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
import { regionHue } from '@/lib/category-ramp';
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
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { T } from '@/lib/theme';
import { arcadeRanksForKey } from '@/lib/daily-games';
import { COLS, ROWS, decodeField, idx, neighbors, numberAt } from '@/lib/sweep-field';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#0f766e', accentSoft: '#e2f2f0', covered: '#c9d2e2', coveredHi: '#b7c2d6',
};
// The number palette. Eight steps that stay legible on white at 13px, and
// deliberately NOT a rainbow: the low numbers you read constantly are cool and
// quiet, the high ones you meet rarely are hot, so a 6 catches the eye.
const NUM_COLOR = ['', '#2563eb', '#15803d', '#c0392b', '#233a63', '#a16207', '#0e7490', '#0b0d12', '#6b7280'];
// On the stage the eight counts take ramp ink (the 7 above is near-black and
// vanished on the dark register): sky, mint, rose, periwinkle, gold, magenta,
// violet, then page ink for 8. Loosely the classic order (1 cool, 3 red) so a
// habit still works. Resolved per register by --stg-dk, as regionStyle() does.
const NUM_RAMP = [null, 0, 2, 3, 7, 1, 6, 4, null];
const numInk = (n) => {
  const k = NUM_RAMP[n];
  if (k == null) return 'var(--stg-ink)';
  const h = regionHue(k);
  return `color-mix(in srgb, ${h.dk} var(--stg-dk, 100%), ${h.ink})`;
};
const HELP_KEY = 'sot_sweep_help_seen';
const STATS_KEY = 'sot_sweep_stats';
const VIEW_ROWS = 15;          // rows of field on screen at once
const LONG_PRESS_MS = 340;     // hold to flag, for a phone with no right button
const PRESS_SLOP_PX = 12;      // drift a long press tolerates before it reads as a scroll
const DIG_MAX_MS = 200;        // a press held longer than this NEVER digs. See the cell handlers.
const FLAG_HAPT = [8];         // the buzz that says the flag landed, so you know to lift
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

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

// ---- stats (identical shape to every other daily) --------------------------
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
// THE RECORD IS THE BEST RUN, NOT THE FIRST (owner, 2026-08-14). Sweep is an
// arcade game, so the board has taken a player's best run of the day since
// 2026-08-08 (see isArcade in lib/daily-games) while this kept whichever run
// happened to be first, which put the record, the day's tile and the streak on
// a different run from the one the board beside them was ranking.
//
// Ranked by the shared arcade comparator, so the run this keeps is the run the
// board ranks. Sweep is a tally game, so a run that opened NO cells ranks on
// digs survived rather than fewest spent, which is why the entry carries the dig
// count. A local entry carries no clock, so the comparator's time term is
// unreachable here and a dead heat keeps the earlier run, exactly as a tie does
// on both board scorers.
const RUN_RANK = arcadeRanksForKey('sweep');
const asRun = (e) => ({ score: e.s, guesses_used: e.g ?? null, time_elapsed: null });
function betterRun(next, prev) {
  if (!prev) return true;
  return RUN_RANK ? RUN_RANK(asRun(next), asRun(prev)) < 0 : false;
}
function recordStat(num, entry) {
  const s = getStats();
  if (!betterRun(entry, s.rec[num])) return s;
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
// ---- run state -------------------------------------------------------------
// `open` and `flag` are stored as index arrays rather than a 1,800-cell grid,
// because a deep run touches a few hundred cells and the save has to be small
// enough to write on every click.
function freshState() {
  return { v: 1, open: [], flag: [], score: 0, digs: 0, boom: -1, status: 'playing', t0: null, tEnd: null, ms: 0 };
}

export default function SweepClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const PAR = PUZZLE.par;
  const FIELD = useMemo(() => decodeField(PUZZLE.field), [PUZZLE.field]);
  const STORE_KEY = `sot_sweep_${PUZZLE.num}`;
  const REC_KEY = `sot_sweep_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(() => freshState());
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
  const [flagMode, setFlagMode] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const viewRef = useRef(null);
  const pressRef = useRef({ t: 0, x: 0, y: 0, touch: false, flaggedAt: 0, timer: null });
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  // Sets are the working copy; the arrays in state are what gets saved.
  const openSet = useMemo(() => new Set(g.open), [g.open]);
  const flagSet = useMemo(() => new Set(g.flag), [g.flag]);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);

  const playing = g.status === 'playing';
  // THE FINISHED WELL STAYS ON SCREEN FOR A BEAT before the card takes the
  // board over. Ends here arrive on the engine's move, not the player's, so
  // they get the long hold every time.
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('sweep');  const iq = useIqStanding({ game: 'sweep', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const STAGE = isStage('sweep', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('sweep');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('sweep'), '--stg-acc-lt': gameColorLight('sweep'), '--stg-onramp-lt': gameOnrampLight('sweep'), '--stg-acc-ink-lt': gameAccentInkLight('sweep') };
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
  const nextUp = useNextUnplayed({ self: 'sweep', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'sweep', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'sweep', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'sweep', active: LOFT && !playing });

  const started = playing && !!g.t0;
  const preStart = playing && !g.t0;
  const over = g.status !== 'playing';
  const focusMode = playing && !showChrome;
  const won = over && g.score >= PAR;
  // Arcade verdict, and it is deliberately NOT the same test as `won`. Par is
  // a BENCHMARK rather than a solve threshold, the posted score (cells uncovered)
  // is uncapped, and the day credits the player's BEST run, so an Arcade run
  // cannot be failed and NEVER renders the red band: green at or above par,
  // gold below it. `won` is untouched and still keys the stats record, the
  // streak and the perfect count, all of which do turn on clearing par.
  // Modelled on Babel's verdictTone/verdictWord, the other benchmark-scored
  // game.
  const verdictTone = won ? 'won' : 'part';
  const verdictWord = won ? 'Par cleared' : 'Run complete';
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);

  // How deep the dig has reached, which is what the viewport follows.
  const depth = useMemo(() => {
    let d = 0;
    for (const i of openSet) { const r = Math.floor(i / COLS); if (r + 1 > d) d = r + 1; }
    return d;
  }, [openSet]);

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 1 && Array.isArray(saved.open)) {
      const s = { ...freshState(), ...saved };
      gRef.current = s; setG(s);
    }
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    setHydrated(true);
  }, [STORE_KEY]);

  // ---- board + view ping ---------------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    const anon = getAnonId();
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}${anon ? `&anonId=${encodeURIComponent(anon)}` : ''}${em}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) });
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId]);

  // The hub's "played today" flag, same key shape every daily uses.
  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing';
      if (done || g.t0) localStorage.setItem('sot_sweep_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_sweep_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0]);

  // Elapsed time, for the tiebreak only. There is no clock pressure in Sweep,
  // so this counts only while the tab is actually in front of the player.
  useEffect(() => {
    if (!started) return undefined;
    const iv = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      const cur = gRef.current;
      if (cur.status !== 'playing' || !cur.t0) return;
      commit({ ...cur, ms: (cur.ms || 0) + 1000 });
    }, 1000);
    return () => clearInterval(iv);
  }, [started, commit]);

  // ---- posting -------------------------------------------------------------
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.score === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round(cur.ms / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return {
      quizId: PUZZLE.quizId, score: cur.score, total: PAR,
      correct: 0, guessesUsed: cur.digs, timeElapsed: el, abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((g2) => {
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    const el = Math.max(1, Math.round(g2.ms / 1000));
    // `g` is the dig count, and it is stored so betterRun can break a tie the
    // way the board does. A pre-2026-08-14 entry has none and reads as null,
    // which only ever costs it a tiebreak against an equal score.
    try { setStats(recordStat(PUZZLE.num, { s: g2.score, t: PAR, g: g2.digs, won: g2.score >= PAR })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score: g2.score, total: PAR, correct: g2.score >= PAR ? 1 : 0,
          // DIGS. Ties break on FEWEST, because the same cells off fewer clicks
          // means the cascades were read rather than clicked through by hand.
          guessesUsed: g2.digs, timeElapsed: el,
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
    try { window.dispatchEvent(new Event('sot:daily-updated')); } catch (e) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, PAR, identity]);

  // ---- the dig -------------------------------------------------------------
  // Opening a zero cascades to its neighbors, which is where a good run gets
  // its cells: the field is 9 wide, so a well-chosen zero can peel four rows.
  const openFrom = useCallback((state, startIdx) => {
    const open = new Set(state.open);
    const flag = new Set(state.flag);
    const stack = [startIdx];
    let gained = 0;
    while (stack.length) {
      const i = stack.pop();
      if (i < 0 || i >= ROWS * COLS) continue;
      if (open.has(i) || flag.has(i)) continue;
      open.add(i); gained++;
      const r = Math.floor(i / COLS), c = i % COLS;
      if (numberAt(FIELD, r, c) === 0) {
        for (const [rr, cc] of neighbors(r, c)) stack.push(idx(rr, cc));
      }
    }
    return { open: [...open], gained };
  }, [FIELD]);

  const dig = useCallback((i) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || flagSet.has(i) || openSet.has(i)) return;
    const t0 = cur.t0 || Date.now();
    if (FIELD[i]) {
      // The one way a run ends. The field is proven deducible, so this was
      // always readable: no board on the bank has ever required a guess.
      const g2 = { ...cur, t0, open: [...cur.open, i], boom: i, digs: cur.digs + 1, status: 'over', tEnd: Date.now() };
      commit(g2); postResult(g2); return;
    }
    const { open, gained } = openFrom({ ...cur, t0 }, i);
    commit({ ...cur, t0, open, score: cur.score + gained, digs: cur.digs + 1 });
  }, [FIELD, flagSet, openSet, openFrom, commit, postResult]);

  // Clicking a number whose mines are all flagged opens the rest of its
  // neighbors at once. It is how an experienced player moves, and it is also
  // how an experienced player dies: the game trusts your flags, it does not
  // check them.
  const chord = useCallback((i) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !openSet.has(i)) return;
    const r = Math.floor(i / COLS), c = i % COLS;
    const n = numberAt(FIELD, r, c);
    if (!n) return;
    let flags = 0; const rest = [];
    for (const [rr, cc] of neighbors(r, c)) {
      const j = idx(rr, cc);
      if (flagSet.has(j)) flags++;
      else if (!openSet.has(j)) rest.push(j);
    }
    if (flags !== n || !rest.length) return;
    const bomb = rest.find((j) => FIELD[j]);
    if (bomb != null) {
      const g2 = { ...cur, open: [...cur.open, bomb], boom: bomb, digs: cur.digs + 1, status: 'over', tEnd: Date.now() };
      commit(g2); postResult(g2); return;
    }
    let open = cur.open, gained = 0;
    let work = { ...cur };
    for (const j of rest) {
      const res = openFrom(work, j);
      work = { ...work, open: res.open };
      gained += res.gained;
      open = res.open;
    }
    commit({ ...cur, open, score: cur.score + gained, digs: cur.digs + 1 });
  }, [FIELD, openSet, flagSet, openFrom, commit, postResult]);

  const toggleFlag = useCallback((i) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || openSet.has(i)) return;
    const flag = new Set(cur.flag);
    if (flag.has(i)) flag.delete(i); else flag.add(i);
    commit({ ...cur, t0: cur.t0 || Date.now(), flag: [...flag] });
  }, [openSet, commit]);

  const startGame = useCallback(() => {
    const cur = gRef.current;
    const st = { ...cur, t0: Date.now() };
    commit(st);
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }, [commit]);

  // A fresh run on the SAME field. It clears nothing that records the day: the
  // stats entry and the posted rows stay, because every finished run posts and
  // the board keeps your best (arcade rule, lib/daily-games isArcade).
  const replayRun = useCallback(() => {
    releaseEnd();
    try { localStorage.removeItem(REC_KEY); } catch (e) {}
    commit({ ...freshState(), t0: Date.now() });
    setArmRestart(false);
    // FALSE, not true (fixed 2026-08-12): nothing else clears endClosed, so a
    // replayed run used to finish with no end card at all. See ChompClient.
    setEndClosed(false);
    if (viewRef.current) viewRef.current.scrollTop = 0;
  }, [releaseEnd, commit, REC_KEY]);

  // ---- the viewport follows the frontier ------------------------------------
  useEffect(() => {
    const el = viewRef.current;
    if (!el || !started) return;
    const cell = el.clientWidth / COLS;
    const want = Math.max(0, (depth - VIEW_ROWS + 4) * cell);
    if (want > el.scrollTop) el.scrollTo({ top: want, behavior: 'smooth' });
  }, [depth, started]);

  // ---- keyboard ------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'f' || e.key === 'F') setFlagMode((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- share ---------------------------------------------------------------
  function shareText() {
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    return `Sweep #${PUZZLE.num}${sun} · ${nf(g.score)} cell${g.score === 1 ? '' : 's'} · depth ${nf(depth)} · par ${nf(PAR)}\nmindloftdaily.com/sweep`;
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

  // ---- the live ladder -----------------------------------------------------
  // THE REAL BOARD, not a slice of one. Fixed here 2026-08-10 alongside the
  // identical pair of bugs in Blocks, which this panel was copied from:
  //
  //  1. IT READ THE WRONG AXIS. `board.leaderboard` is 'registered:all', which
  //     is signed-in players only and EVERY attempt they posted. Sweep is an
  //     arcade game, so it takes unlimited runs and keeps the best one, and one
  //     player's several runs could take most of the rows while an anonymous
  //     leader was not on the board at all. The axis that reads true here is
  //     'all:first' (`leaderboardFirst`), which on an arcade game is ONE ROW
  //     PER PLAYER, their best run, guests included. See buildLeaderboard in
  //     lib/quiz-anon.js. `leaderboard` stays only as a stale-payload fallback.
  //  2. IT SHOWED A WINDOW AROUND YOU, +/-2 rows, so a player on nothing opened
  //     near the bottom and could not see who was winning. The TOP FIVE now
  //     always render, and your live row pins beneath them behind a gap marker
  //     whenever this run sits outside them.
  const ladder = useMemo(() => {
    const anon = hydrated ? getAnonId() : null;
    const myKey = anon ? `a:${anon}` : null;
    const myName = String((identity && identity.username) || '').toLowerCase();
    // Drop my OWN stored row: the live run below is already on the ladder as
    // "You", so leaving it in lists the same person twice. Guests match on the
    // anon key buildLeaderboard returns; a signed-in player matches on the
    // display name, because the board carries no user_id to compare against.
    const isMine = (r) => (!!myKey && r.userKey === myKey)
      || (!!myName && String(r.username || '').toLowerCase() === myName);
    const rows = (board.leaderboardFirst || board.leaderboard || [])
      .filter((r) => !isMine(r))
      .slice(0, 40)
      .map((r) => ({ name: r.username || 'player', score: r.score, me: false }));
    const mine = g.score;
    let at = rows.findIndex((r) => r.score < mine);
    if (at < 0) at = rows.length;
    const out = rows.slice(0, at).concat([{ name: 'You', score: mine, me: true }], rows.slice(at))
      .map((r, i) => ({ ...r, rank: i + 1 }));
    const meAt = out.findIndex((r) => r.me);
    const TOP = 5;
    return {
      rows: out.slice(0, TOP).concat(meAt >= TOP ? [{ gap: true }, out[meAt]] : []),
      rank: meAt + 1,
      field: out.length,
    };
  }, [board.leaderboardFirst, board.leaderboard, g.score, identity, hydrated]);

  // ---- rules ---------------------------------------------------------------
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Uncover as much of the field as you can without touching a mine."
      banner={`Everyone digs the same field today${PUZZLE.sunday ? ', with more mines in it than a weekday' : ''}.`}
      sub="The top row is given to you already uncovered, so the first dig is a read and never a coin flip."
      steps={[
        <><b>Tap</b> a covered square to uncover it. A number counts the mines touching that square, and a blank clears everything around it.</>,
        <><b>Long press</b> (or right click, or the <b>Flag</b> button) to mark a mine. A press you hold never digs, so a mark that does not take costs you nothing. Flags cost nothing and score nothing.</>,
        <>Tap a <b>number</b> whose mines are all flagged to open the rest of its neighbours at once. Quick, and it trusts your flags without checking them.</>,
        <>There is no bottom. Keep going until you are wrong, then <b>play again</b> as many times as you like.</>,
      ]}
      knack="You never have to guess. Every field is checked before it ships and is solvable from the top row down with the two rules you already know, plus the one where a number's unknowns sit inside another number's. If you are stuck, the answer is on the board."
      footer={`Scored on CELLS UNCOVERED, and you can play the day as many times as you like, because Sweep keeps your BEST run rather than your first: your score IS the number of squares you uncover, with no ceiling on it, and ${nf(PAR)} is par for the day. Ties break on FEWEST DIGS, since the same cells off fewer clicks means you read the cascades rather than clicking through them. Sweep pays at most 1 IQ point a day however long the run goes and however many runs you play, so nobody can grind their way up the standings: the real competition is today’s leaderboard. Sundays put more mines in the same field.`}
    />
  );

  // ---- the field -----------------------------------------------------------
  const lastRow = Math.min(ROWS - 1, Math.max(VIEW_ROWS + 1, depth + 6));
  const cells = [];
  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = idx(r, c);
      const isOpen = openSet.has(i);
      const isFlag = flagSet.has(i);
      const isBoom = g.boom === i;
      const n = isOpen && !isBoom ? numberAt(FIELD, r, c) : 0;
      const showMine = over && FIELD[i] && !isBoom && isFlag;
      cells.push(
        <div
          key={i}
          onContextMenu={(e) => {
            e.preventDefault();
            // ONLY a real right click gets here. Android Chrome fires contextmenu
            // on a touch long press at ~500ms, which is AFTER our own timer has
            // already flagged the cell, so an unguarded handler toggled the flag
            // straight back off: hold longer, lose your mark. That was half the
            // complaint. The other half is the slop rule below.
            if (pressRef.current.touch) return;
            toggleFlag(i);
          }}
          // Long press is a TOUCH gesture only. A mouse that rests on the
          // button for half a second is still a click, and turning that into a
          // flag would make the desktop game feel haunted.
          onPointerDown={(e) => {
            const p = pressRef.current;
            if (e.pointerType === 'mouse') { p.touch = false; return; }
            // flaggedAt resets per press. Left standing it would swallow the
            // NEXT tap too, so a quick dig straight after a flag did nothing.
            p.touch = true; p.t = Date.now(); p.x = e.clientX; p.y = e.clientY; p.flaggedAt = 0;
            clearTimeout(p.timer);
            p.timer = setTimeout(() => {
              p.timer = null; p.flaggedAt = Date.now();
              vibrate(FLAG_HAPT);   // the mark is down, lift whenever you like
              toggleFlag(i);
            }, LONG_PRESS_MS);
          }}
          onPointerUp={() => { clearTimeout(pressRef.current.timer); pressRef.current.timer = null; }}
          // Drift tolerance, NOT zero tolerance. A finger on a 20px cell always
          // moves a pixel or two, and cancelling on that turned an intended flag
          // into a dig on the very cell the player had read as a mine. On a
          // one-life game that ends the run. Past PRESS_SLOP_PX it is a scroll.
          onPointerMove={(e) => {
            const p = pressRef.current;
            if (!p.timer) return;
            if (Math.abs(e.clientX - p.x) > PRESS_SLOP_PX || Math.abs(e.clientY - p.y) > PRESS_SLOP_PX) {
              clearTimeout(p.timer); p.timer = null;
            }
          }}
          onPointerCancel={() => { clearTimeout(pressRef.current.timer); pressRef.current.timer = null; }}
          onPointerLeave={() => { clearTimeout(pressRef.current.timer); pressRef.current.timer = null; }}
          onClick={() => {
            const p = pressRef.current;
            if (p.touch) {
              // The click after a long press is swallowed on a TIMESTAMP rather
              // than a boolean. A boolean survives a browser that skips the
              // click, and then eats the next legitimate tap.
              if (p.flaggedAt && Date.now() - p.flaggedAt < 900) return;
              // THE DEAD ZONE. A dig tap runs 80 to 120ms, so a press held past
              // DIG_MAX_MS was never a dig: it was a flag attempt that got
              // cancelled, and it used to fall through to dig(i) and detonate.
              // It is a no-op now. Tap again to dig.
              if (p.t && Date.now() - p.t > DIG_MAX_MS) return;
            }
            if (isOpen) chord(i);
            else if (flagMode) toggleFlag(i);
            else dig(i);
          }}
          style={{
            aspectRatio: '1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: SANS, fontWeight: 800, fontSize: 14, userSelect: 'none', WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
            cursor: over ? 'default' : 'pointer',
            background: isBoom ? '#dc2626' : showMine ? '#94a3b8' : isFlag ? '#fde68a' : isOpen ? 'var(--stg-panel, #fff)' : `var(--stg-cell, ${COLORS.covered})`,
            color: isBoom ? '#fff' : (STAGE && n ? numInk(n) : NUM_COLOR[n] || `var(--stg-mute, ${COLORS.faded})`),
            boxShadow: isOpen && !isBoom ? 'none' : 'inset 0 0 0 1px var(--stg-cell-line, transparent), inset 0 -2px 0 rgba(15,23,42,0.10)',
          }}
        >
          {isBoom ? '✹' : isFlag ? '⚑' : showMine ? '✹' : (isOpen && n ? n : '')}
        </div>
      );
    }
  }

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="sweep" name="Sweep" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="sweep" quizId={PUZZLE.quizId}
          name="Sweep"
          cat="Arcade"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: g.score, k: 'score' },
            { v: PAR, k: 'par' },
          ] : [
            { v: g.score, k: 'score' },
            { v: PAR, k: 'par' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
        <DailyMasthead
          slug="sweep"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>
              Sunday Edition &middot; denser field
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Sweep is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Uncover as much of the field as you can without hitting a mine. It never needs a guess, it has no bottom, and you can play the day again as often as you want. Your best run is the one that counts.</p>
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
          <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Depth <b style={{ color: INK }}>{nf(depth)}</b>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Digs <b style={{ color: INK }}>{nf(g.digs)}</b>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Flags <b style={{ color: INK }}>{nf(g.flag.length)}</b>
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8' }}>{fmtTime(g.ms)}</span>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', justifyContent: 'center' }}>
              <div
                ref={viewRef}
                className="sw-view"
                style={{
                  flex: 1, minWidth: 0, maxWidth: 360, height: VIEW_ROWS * 38,
                  overflowY: 'auto', overflowX: 'hidden', background: STAGE ? 'var(--stg-panel)' : '#eef1f6',
                  border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 3,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 3 }}>{cells}</div>
              </div>

              <aside className="sw-ladder" style={{ width: 132, flex: 'none', borderLeft: `1px solid ${COLORS.line}`, paddingLeft: 11, display: 'flex', flexDirection: 'column', fontSize: 11.5, color: FADED }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 7 }}>Today &middot; you #{ladder.rank}</div>
                {ladder.rows.map((r) => (r.gap ? (
                  <div key="gap" aria-hidden="true" style={{ textAlign: 'center', color: '#c3cad6', fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', lineHeight: '11px', padding: '4px 0 2px' }}>&middot;&middot;&middot;</div>
                ) : (
                  <div key={`${r.rank}-${r.name}`} style={{ display: 'flex', gap: 6, padding: '3px 0', color: r.me ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`, fontWeight: r.me ? 800 : 600 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, width: 30, flex: 'none', color: r.me ? `var(--stg-acc-ink, ${COLORS.accent})` : '#9aa2b1' }}>#{r.rank}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <span style={{ fontWeight: 800 }}>{r.score}</span>
                  </div>
                )))}
                <div style={{ marginTop: 'auto', paddingTop: 9, borderTop: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{nf(g.score)}<em style={{ fontStyle: 'normal', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}> cell{g.score === 1 ? '' : 's'}</em></div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: '#94a3b8', marginTop: 3 }}>par {nf(PAR)}</div>
                </div>
              </aside>
            </div>

            <div className="sw-strip" style={{ display: 'none', marginTop: 10, paddingTop: 9, borderTop: `1px solid ${COLORS.line}`, alignItems: 'center', gap: 10, fontSize: 11.5, color: FADED }}>
              <span style={{ fontWeight: 800, color: ACC_INK }}>You #{ladder.rank}</span>
              <span>par {nf(PAR)} cells</span>
              <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color: INK }}>{nf(g.score)}<em style={{ fontStyle: 'normal', fontSize: 10, color: '#94a3b8' }}> cell{g.score === 1 ? '' : 's'}</em></span>
            </div>

            {/* Dig or flag. A phone has no right button and a long press is a
                secret, so the mode is a visible switch as well. */}
            {!over && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <div style={{ display: 'inline-flex', border: `1px solid ${COLORS.line}`, borderRadius: 10, overflow: 'hidden' }}>
                  {[[false, 'Dig', Pickaxe], [true, 'Flag', Flag]].map(([mode, label, Icon]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFlagMode(mode)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, fontFamily: SANS, fontWeight: 800, fontSize: 14,
                        padding: '11px 22px', border: 'none', cursor: 'pointer',
                        background: flagMode === mode ? `var(--stg-acc, ${COLORS.accent})` : '#fff',
                        color: flagMode === mode ? T.white : `var(--stg-mute, ${COLORS.faded})`,
                      }}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="sw-keys" style={{ textAlign: 'center', marginTop: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: '#9aa2b1' }}>
              click to dig &middot; right click or long press to flag &middot; F switches mode &middot; click a finished number to open its neighbours &middot; a held press never digs
            </div>

            {over && (
              <button
                onClick={replayRun}
                style={{
                  marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: SANS, fontWeight: 800, fontSize: 15, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white,
                  background: STAGE ? STAGE_C : T.cta, border: `2px solid ${STAGE ? STAGE_C : T.cta}`, borderRadius: 10, padding: '13px 18px', cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} /> Play again
              </button>
            )}
            {!over && g.t0 && (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; replayRun(); } else setArmRestart(Date.now()); }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-acc-ink, ${COLORS.accent})` : '#9aa2b1', textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <RotateCcw size={13} /> {armRestart ? 'Press again to start over' : 'Restart run'}
                </button>
              </div>
            )}
          </div>
        )}


          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Sweep"
              catRank={catRank}
              outcome={verdictTone}
              title={verdictWord}
              detail={`${g.score} \u00b7 ${PAR} par`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Sweep all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Digs"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/sweep?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board',
                  sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Sweep', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/sweep?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Play again', sub: 'Another run, your best one counts', onClick: replayRun },
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
        {!STAGE && <GamePanel self="sweep" name="Sweep" onShow={() => setShowChrome(true)} />}

        {!focusMode && !identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="Put your name on today&rsquo;s board" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="sweep" name="Sweep" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid
            self="sweep"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            divider
            boardSlot={<DailyBoardPanel self="sweep" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
          />
          )}
        </div>

        {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
        <StageFold />
        <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Sweep</h2>
          <p style={{ margin: '0 0 9px' }}>
            Sweep is a daily minesweeper with no bottom edge. Everyone digs the same field on the same day, so the
            leaderboard compares reading rather than luck, and the field is checked before it ships: every square on it
            can be worked out from the top row down, so a run never ends on a guess.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            One life a run, and as many runs as you like. Your best one takes the board. However long you dig, Sweep pays
            at most 1 IQ point a day, so a long sitting cannot buy a place in the standings. On Sundays the same field
            carries more mines.
          </p>
          <p style={{ margin: 0 }}>
            More daily puzzles: <a href="/blocks" style={{ color: ACC_INK }}>Blocks</a>,{' '}
            <a href="/crux" style={{ color: ACC_INK }}>Crux</a>,{' '}
            <a href="/tally" style={{ color: ACC_INK }}>Tally</a>.
          </p>
        </section>
      </div>

      {/* OUTSIDE the page column on purpose: the column is a stacking context,
          and this card's backdrop sits at z-index 85. Nested inside, it paints
          under the masthead. See the same note in BlocksClient. */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="sweep"
          won={won}
          quizId={PUZZLE.quizId}
          completed
          score={<>{nf(g.score)} cell{g.score === 1 ? '' : 's'} uncovered &middot; par {nf(PAR)}</>}
          subline={<>depth {nf(depth)} &middot; {nf(g.digs)} dig{g.digs === 1 ? '' : 's'} &middot; {nf(g.flag.length)} flag{g.flag.length === 1 ? '' : 's'} &middot; {fmtTime(g.ms)}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={replayRun}
          onClose={() => setEndClosed(true)}
        />
      )}

      {showHelp && (
        <div
          onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ ...btn, marginTop: 14, background: COLORS.ink, borderColor: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <style>{`
        .sw-view::-webkit-scrollbar { width: 6px; }
        .sw-view::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        @media (max-width: 640px) {
          .sw-ladder { display: none !important; }
          .sw-strip { display: flex !important; }
          .sw-keys { display: none !important; }
        }
      `}</style>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
