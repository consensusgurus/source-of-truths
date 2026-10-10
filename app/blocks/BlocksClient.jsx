'use client';

// Blocks — the daily falling-shapes game.
//
// Two things make it different from the rest of the roster and both are
// deliberate:
//
//  1. THE RUN PERSISTS ALL DAY, and you may replay it. The run survives across
//     visits. Leaving the page
//     pauses it and saves the board, so a player can come back through the day
//     and pick the same run up. That is why there is no clock pressure: the
//     drop rate is FIXED for the whole run (lib/blocks-seq GRAVITY_MS) and the
//     squeeze comes from a 16-row ceiling instead of a speed curve.
//  2. A LIVE LADDER. The day's leaderboard sits beside the well while you
//     play, so you can watch your projected score move. It is real data from
//     /api/quiz/board, fetched once; only YOUR row moves as you clear.
//
// The shape ORDER is generated from the day's quizId in lib/blocks-seq.js, so
// every player gets the same 6,000 shapes in the same order and the bank ships
// no board. Sundays narrow the well from 10 columns to 8.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Pause, Play, RotateCcw } from 'lucide-react';
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
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight, REGION_RAMP } from '@/lib/category-ramp';
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
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { T } from '@/lib/theme';
import { arcadeRanksForKey } from '@/lib/daily-games';
import {
  PIECES, ROT, shapeAt, buildSequence, GRAVITY_MS,
  LINE_POINTS, QUAD_BONUS, COMBO_STEP, scoreRows, PIECE_LABEL,
} from '@/lib/blocks-seq';
import { meRequest } from '@/app/quizMeClient';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#1d4ed8', accentSoft: '#e8edfa', well: '#93b4f0',
};
const HELP_KEY = 'sot_blocks_help_seen';
const STATS_KEY = 'sot_blocks_stats';
const LOCK_MS = 480;         // grounded grace before a shape sets
const LOCK_RESETS = 15;

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
// THE RECORD IS THE BEST RUN, NOT THE FIRST (owner, 2026-08-14). Blocks is an
// arcade game, so the board has taken a player's best run of the day since
// 2026-08-08 (see isArcade in lib/daily-games) while this refused to overwrite
// an existing entry, which left the record, the day's tile and the streak on
// run one. A player who topped out in 3 rows and then cleared 40 read their own
// board position as a stranger's. The two now answer the same way.
//
// Ranked by the shared arcade comparator, so the run this keeps is the run the
// board ranks. A local entry carries no clock, so the comparator's time term is
// unreachable here and a dead heat on rows AND shapes keeps the earlier run,
// which is what both board scorers do with a tie as well.
const RUN_RANK = arcadeRanksForKey('blocks');
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
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    // ANY attempt, and the BEST one wins (2026-08-14). This took attempt 1 only
    // and skipped a day that already had an entry, which is the same first-run
    // rule recordStat used to carry: a player who came back on a second device
    // was seeded with their opening run whatever they went on to score. The
    // arcade rule is the best run, on every device.
    if (!p) continue;
    // A row from BEFORE that puzzle's reset stamp is a ghost: it was deleted
    // server-side, so it must never seed the local record. It still arrives
    // here for a while because /api/quiz/me reads the shared results cache,
    // which serves the pre-delete row set until it refreshes, and re-seeding
    // from it would put the old 0-10 result back on every page load and outrank
    // the re-run whenever the stale score was the higher of the two.
    if (p.resetAt && Date.parse(m.createdAt || 0) < Date.parse(p.resetAt)) continue;
    // scorePct is the server's score/total, so that day's par brings the row
    // count back. It caps at 100, so a run ABOVE par reads as exactly par here;
    // only `won` and the streak read this record, so that costs nothing.
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * (p.par || 1)));
    // A server row carries no shape count, so it can only beat a local entry on
    // rows outright. That is the right way round: a local entry was recorded by
    // this device from the real run and is the more complete record, so a server
    // row ties into it rather than over it.
    const next = { s: sc, t: p.par, g: null, won: !!m.perfect };
    if (!betterRun(next, rec[p.num])) continue;
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = next;
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

// ---- the well --------------------------------------------------------------
function freshState(cols, rows) {
  return {
    v: 1, grid: Array.from({ length: rows }, () => Array(cols).fill(null)),
    idx: 0, cur: null, hold: null, held: false,
    raw: 0, lines: 0, quads: 0, combo: 0, bestCombo: 0, pieces: 0,
    status: 'playing', t0: null, tEnd: null, ms: 0,
  };
}
const topOffset = (m) => { for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) if (m[y][x]) return y; return 0; };
function spawnOf(key, cols) {
  const m = shapeAt(key, 0);
  return { k: key, r: 0, x: Math.floor((cols - m.length) / 2), y: -topOffset(m) };
}
// A BLOCKED SPAWN LIFTS ABOVE THE WELL, IT DOES NOT END THE RUN (owner report,
// 2026-08-15). Shapes spawned with their top row ON row 0, so the run ended the
// moment the stack reached row ONE: the player was looking at an empty top row
// while being told the well was full, and row 0 of a 16-row well could never be
// filled at all. The well's ceiling is now the ceiling. A shape that will not
// fit at row 0 is raised a row at a time until it clears the stack and plays
// from above the well, exactly as it does in the arcade; cells above row 0
// collide with nothing (see hits), so a lift always finds room, and the shape
// can still be slid sideways into a lower column on the way down.
//
// The run therefore ends at the OTHER end: settle tops it out when a shape
// comes to rest with any cell still above row 0, which is the stack genuinely
// overflowing the well rather than merely reaching the last row of it.
function liftIn(grid, cols, rows, p) {
  let guard = shapeAt(p.k, p.r).length + 1;
  while (guard-- > 0 && hits(grid, cols, rows, p, p.x, p.y)) p.y -= 1;
  return p;
}
function hits(grid, cols, rows, p, gx, gy, gr) {
  const m = shapeAt(p.k, gr === undefined ? p.r : gr);
  const px = gx === undefined ? p.x : gx, py = gy === undefined ? p.y : gy;
  for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
    if (!m[y][x]) continue;
    const bx = px + x, by = py + y;
    if (bx < 0 || bx >= cols || by >= rows) return true;
    if (by >= 0 && grid[by][bx]) return true;
  }
  return false;
}
const KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]];

// THE SHAPES WEAR THE SITE'S OWN COLOURS (owner, 2026-10-10). They were nine
// lightness steps of one blue; now each shape takes a step of the category
// ramp (lib/category-ramp REGION_RAMP), the pastel on the dark stage and the
// deep twin on the light one, so the well reads like the rest of Mind Loft.
// Amber is left out because it sits on top of gold, and lime's light twin is
// moved off the Logic green, which is indistinguishable from mint on paper.
// The two additions (corner, plus) carry a small white diamond, which is the
// cue the darkest-blue steps used to give. lib/blocks-seq PIECES keeps its
// blues for the verifier; nothing on screen reads them any more.
const PIECE_HUE = { I: 'sky', O: 'gold', T: 'violet', S: 'mint', Z: 'rose', J: 'periwinkle', L: 'orange', C: 'magenta', P: 'lime' };
const HUE_BY_NAME = Object.fromEntries(REGION_RAMP.map((h) => [h.name, h]));
const LIGHT_OVERRIDE = { lime: '#65a30d' };
function pieceFill(k, light) {
  const name = PIECE_HUE[k];
  const h = HUE_BY_NAME[name];
  if (!h) return '#94a3b8';
  return light ? (LIGHT_OVERRIDE[name] || h.lt) : h.dk;
}
const IS_EXTRA = { C: true, P: true };
const RAINBOW = ['sky', 'mint', 'lime', 'gold', 'orange', 'rose', 'magenta', 'violet', 'periwinkle'];

// A FOUR-ROW CLEAR BANKS A BONUS ROW (owner, 2026-10-10): four rows count as
// five. Date gated so no day already played is re-ranked; boards before this
// date score plain rows exactly as before.
const BONUS_FROM = '2026-10-11';
const scoreRun = (lines, quads, bonus) => scoreRows(lines) + (bonus ? Math.max(0, Number(quads) || 0) : 0);

// The next and held shapes, drawn small rather than named.
function MiniShape({ k, light, cell = 7 }) {
  if (!k || !ROT[k]) return <span style={{ opacity: 0.5 }}>&ndash;</span>;
  const m = shapeAt(k, 0);
  let x0 = 9, x1 = -1, y0 = 9, y1 = -1;
  m.forEach((row, y) => row.forEach((v, x) => { if (v) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
  const w = (x1 - x0 + 1) * cell, h = (y1 - y0 + 1) * cell;
  const fill = pieceFill(k, light);
  const rects = [];
  m.forEach((row, y) => row.forEach((v, x) => {
    if (!v) return;
    rects.push(<rect key={`${x}-${y}`} x={(x - x0) * cell + 0.5} y={(y - y0) * cell + 0.5} width={cell - 1} height={cell - 1} rx={1.6} fill={fill} />);
  }));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={PIECE_LABEL[k] || k} role="img" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {rects}
    </svg>
  );
}

export default function BlocksClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const COLS = PUZZLE.cols, ROWS = PUZZLE.rows, PAR = PUZZLE.par;   // par is ROWS
  const SEQ = useMemo(() => buildSequence(PUZZLE.quizId), [PUZZLE.quizId]);
  const STORE_KEY = `sot_blocks_${PUZZLE.num}`;
  const REC_KEY = `sot_blocks_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(() => freshState(COLS, ROWS));
  const gRef = useRef(g);
  const [hydrated, setHydrated] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(true);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [armRestart, setArmRestart] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [stats, setStats] = useState(null);
  const cvsRef = useRef(null);
  const boxRef = useRef(null);
  const cellRef = useRef(28);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

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
  const LOFT = isLoft('blocks');  const iq = useIqStanding({ game: 'blocks', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const STAGE = isStage('blocks', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('blocks');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('blocks'), '--stg-acc-lt': gameColorLight('blocks'), '--stg-onramp-lt': gameOnrampLight('blocks'), '--stg-acc-ink-lt': gameAccentInkLight('blocks') };
  const [stageTheme] = useStageTheme();
  const LIGHT = !STAGE || stageTheme === 'light';
  const lightRef = useRef(LIGHT);
  lightRef.current = LIGHT;
  const BONUS = (PUZZLE.live || '') >= BONUS_FROM;
  const reducedRef = useRef(false);
  useEffect(() => {
    try { reducedRef.current = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}
  }, []);
  // Animation state for the well. Nothing in here is game state: it is drawn
  // over the board and thrown away, so a reload or a replay simply has none.
  const fxRef = useRef({ clear: null, lock: null, trail: [], parts: [], floats: [], over: null });
  const wellWrapRef = useRef(null);
  const [burst, setBurst] = useState(null);
  const [lbTab, setLbTab] = useState('today');
  const [bestRuns, setBestRuns] = useState(null);
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
  const nextUp = useNextUnplayed({ self: 'blocks', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'blocks', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'blocks', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'blocks', active: LOFT && !playing });

  // Focus mode: while the puzzle is live the leaderboard / share / other-games
  // block is folded away behind one button, the same arrangement every other
  // daily uses (owner rule, 2026-08-08). setShowChrome unfolds it for good.
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const over = g.status !== 'playing';
  // ROWS ARE THE SCORE, uncapped (see lib/blocks-seq). Par is the day's
  // benchmark rather than a ceiling: clearing it wins the card, and every row
  // above it still counts on the board.
  const rowsCleared = scoreRun(g.lines, g.quads, BONUS);
  const won = over && rowsCleared >= PAR;
  // Arcade verdict, and it is deliberately NOT the same test as `won`. Par is
  // a BENCHMARK rather than a solve threshold, the posted score (rows cleared)
  // is uncapped, and the day credits the player's BEST run, so an Arcade run
  // cannot be failed and NEVER renders the red band: green at or above par,
  // gold below it. `won` is untouched and still keys the stats record, the
  // streak and the perfect count, all of which do turn on clearing par.
  // Modelled on Babel's verdictTone/verdictWord, the other benchmark-scored
  // game.
  const verdictTone = won ? 'won' : 'part';
  const verdictWord = won ? 'Par cleared' : 'Run complete';
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    // ONE-TIME REPLAY GRANT (see `resetAt` in puzzles.js). `finishedSince` is
    // the one thing that means this browser is already square with the reset:
    // it holds a run that ENDED after it.
    if (PUZZLE.resetAt) {
      const stamp = Date.parse(PUZZLE.resetAt);
      const ended = !!saved && saved.status !== 'playing';
      const finishedSince = ended && (saved.tEnd || 0) >= stamp;
      // A run that finished BEFORE the reset is dropped outright, so the well
      // opens fresh and the player gets their life back. The board, the
      // recorded-result guard and the hub's done flag go together, or the page
      // would simply reopen the end card on a result that no longer exists.
      // An IN-PROGRESS run is never dropped: it has posted nothing yet and
      // posts on the new scale when it ends.
      if (ended && !finishedSince) {
        saved = null;
        try {
          localStorage.removeItem(STORE_KEY);
          localStorage.removeItem('sot_blocks_day');
        } catch (e) {}
      }
      // Everything else this browser remembers about a POSTED result is stale
      // until it holds a run that finished after the reset, an in-progress run
      // included, because the row it refers to was deleted:
      //   REC_KEY, the guard that stops the abandon flush firing twice. Its
      //     row is gone, so leaving it set would mean a player who wanders off
      //     again mid-run ends the day with no row at all.
      //   the stats record, which is on the old 0-10 scale, and recordStat
      //     NEVER overwrites an existing entry, so leaving it would freeze the
      //     re-run at the old score. Only `won` and the streak read it.
      if (!finishedSince) {
        try {
          localStorage.removeItem(REC_KEY);
          const st = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
          if (st && st.rec && st.rec[PUZZLE.num] != null) {
            delete st.rec[PUZZLE.num];
            localStorage.setItem(STATS_KEY, JSON.stringify(st));
          }
        } catch (e) {}
      }
    }
    if (saved && saved.v === 1 && Array.isArray(saved.grid) && saved.grid.length === ROWS && saved.grid[0].length === COLS) {
      const s = { ...freshState(COLS, ROWS), ...saved };
      gRef.current = s; setG(s);
      if (s.status === 'playing' && s.t0) { pausedRef.current = true; setPaused(true); }
    }
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    setHydrated(true);
  }, [STORE_KEY, REC_KEY, COLS, ROWS, PUZZLE.num, PUZZLE.resetAt]);

  // ---- identity + board + view ping ---------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    const anon = getAnonId();
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
      .catch(() => {});
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    fetch('/api/quiz/blocks-best')
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.rows)) setBestRuns(d.rows); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) });
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  // ---- the hub slate flag --------------------------------------------------
  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing';
      if (done || g.t0) localStorage.setItem('sot_blocks_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_blocks_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0]);

  // ---- abandon flush -------------------------------------------------------
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.pieces === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round(cur.ms / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return {
      quizId: PUZZLE.quizId, score: scoreRun(cur.lines, cur.quads, BONUS), total: PAR,
      correct: 0, guessesUsed: cur.pieces, timeElapsed: el, abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((g2) => {
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    const sc = scoreRun(g2.lines, g2.quads, BONUS);
    const el = Math.max(1, Math.round(g2.ms / 1000));
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: PAR, g: g2.pieces, won: sc >= PAR })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score: sc, total: PAR, correct: sc >= PAR ? 1 : 0,
          // Shapes. Ties break on fewest, EXCEPT at zero rows, where the board
          // ranks on shapes SURVIVED instead (lib/daily-combined scoreGame).
          guessesUsed: g2.pieces, timeElapsed: el,
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, PAR, identity, BONUS]);

  // ---- the engine ----------------------------------------------------------
  const endRun = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'over', tEnd: Date.now(), cur: null };
    fxRef.current.over = { t0: performance.now() };
    commit(g2);
    postResult(g2);
  }, [commit, postResult]);

  const nextPiece = useCallback((st) => {
    if (st.idx >= SEQ.length) { st.status = 'over'; st.tEnd = Date.now(); st.cur = null; return st; }
    st.cur = liftIn(st.grid, COLS, ROWS, spawnOf(SEQ[st.idx], COLS));
    st.idx += 1; st.held = false;
    return st;
  }, [SEQ, COLS, ROWS]);

  const settle = useCallback((st) => {
    const m = shapeAt(st.cur.k, st.cur.r);
    let above = false;
    const lockCells = [];
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
      if (!m[y][x]) continue;
      const by = st.cur.y + y, bx = st.cur.x + x;
      if (by < 0) { above = true; continue; }
      st.grid[by][bx] = st.cur.k;
      lockCells.push([bx, by]);
    }
    st.pieces += 1;
    // ---- animation bookkeeping, before the rows are spliced out ----
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const fx = fxRef.current;
    const full = [];
    for (let y = 0; y < ROWS; y++) if (st.grid[y].every((c) => c)) full.push(y);
    fx.lock = full.length ? null : { cells: lockCells, t0: now };
    if (full.length) {
      const n = full.length;
      const keep = [];
      for (let y = 0; y < ROWS; y++) if (full.indexOf(y) < 0) keep.push(y);
      const shifts = {};
      keep.forEach((oy, i) => { shifts[n + i] = (n + i) - oy; });
      const dur = reducedRef.current ? 80 : ([0, 380, 440, 520, 900][n] || 900);
      fx.clear = { rows: full, keys: full.map((y) => st.grid[y].slice()), n, t0: now, dur, shifts, sparked: false };
    } else fx.clear = null;
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (st.grid[y].every((c) => c)) { st.grid.splice(y, 1); st.grid.unshift(Array(COLS).fill(null)); cleared += 1; y += 1; }
    }
    if (cleared) {
      st.raw += LINE_POINTS[cleared] || 1000;
      if (st.combo > 0) st.raw += COMBO_STEP * st.combo;
      if (cleared === 4) { st.quads += 1; st.raw += QUAD_BONUS; }
      st.combo += 1;
      if (st.combo > st.bestCombo) st.bestCombo = st.combo;
      st.lines += cleared;
      const gain = cleared + (cleared === 4 && BONUS ? 1 : 0);
      const mid = full.length ? (full[0] + full[full.length - 1]) / 2 : ROWS / 2;
      fx.floats.push({ text: `+${gain} row${gain === 1 ? '' : 's'}`, y: mid + 0.5, t0: now, big: cleared === 4 });
      if (cleared === 4 && !reducedRef.current) {
        const el = wellWrapRef.current;
        if (el) { el.classList.remove('bl-shake'); void el.offsetWidth; el.classList.add('bl-shake'); }
      }
      if (cleared === 4 || st.combo > 1) setBurst({ n: cleared, combo: st.combo, id: now });
    } else st.combo = 0;
    if (above) { st.status = 'over'; st.tEnd = Date.now(); st.cur = null; fx.over = { t0: now }; return st; }
    return nextPiece(st);
  }, [COLS, ROWS, nextPiece, BONUS]);

  const act = useCallback((what) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || pausedRef.current || !cur.cur) return;
    const st = { ...cur, grid: cur.grid.map((r) => r.slice()), cur: { ...cur.cur } };
    if (what === 'left' && !hits(st.grid, COLS, ROWS, st.cur, st.cur.x - 1)) st.cur.x -= 1;
    else if (what === 'right' && !hits(st.grid, COLS, ROWS, st.cur, st.cur.x + 1)) st.cur.x += 1;
    else if (what === 'down') { if (!hits(st.grid, COLS, ROWS, st.cur, st.cur.x, st.cur.y + 1)) { st.cur.y += 1; st.raw += 1; } }
    else if (what === 'cw' || what === 'ccw') {
      const len = ROT[st.cur.k].length;
      if (len > 1) {
        const nr = (st.cur.r + (what === 'cw' ? 1 : len - 1)) % len;
        for (const kk of KICKS) {
          if (!hits(st.grid, COLS, ROWS, st.cur, st.cur.x + kk[0], st.cur.y + kk[1], nr)) {
            st.cur.r = nr; st.cur.x += kk[0]; st.cur.y += kk[1]; break;
          }
        }
      }
    } else if (what === 'drop') {
      let y = st.cur.y;
      while (!hits(st.grid, COLS, ROWS, st.cur, st.cur.x, y + 1)) y += 1;
      if (y > st.cur.y && !reducedRef.current) {
        const dm = shapeAt(st.cur.k, st.cur.r);
        const now = performance.now();
        const fx = fxRef.current;
        let bottom = 0;
        for (let xx = 0; xx < dm.length; xx++) {
          let top = -1;
          for (let yy = 0; yy < dm.length; yy++) if (dm[yy][xx]) { if (top < 0) top = yy; bottom = Math.max(bottom, y + yy); }
          if (top >= 0) fx.trail.push({ x: st.cur.x + xx, y0: Math.max(0, st.cur.y + top), y1: y + top, k: st.cur.k, t0: now });
        }
        for (let q = 0; q < 8; q++) fx.parts.push({ x: (st.cur.x + Math.random() * dm.length), y: bottom + 1, vx: (Math.random() - 0.5) * 0.08, vy: -Math.random() * 0.06, g: 0.004, life: 0, max: 26, s: 0.12 + Math.random() * 0.1, dust: true });
        const el = wellWrapRef.current;
        if (el) { el.classList.remove('bl-bump'); void el.offsetWidth; el.classList.add('bl-bump'); }
      }
      st.raw += Math.max(0, y - st.cur.y) * 2;
      st.cur.y = y;
      settle(st);
      lockRef.current = 0; resetsRef.current = 0;
    } else if (what === 'hold') {
      if (st.held) return;
      const k = st.cur.k;
      if (st.hold) st.cur = spawnOf(st.hold, COLS);
      else if (st.idx < SEQ.length) { st.cur = spawnOf(SEQ[st.idx], COLS); st.idx += 1; }
      else return;
      st.hold = k; st.held = true;
      liftIn(st.grid, COLS, ROWS, st.cur);
    }
    commit(st);
    if (st.status !== 'playing') postResult(st);
  }, [COLS, ROWS, SEQ, settle, commit, postResult]);

  // ---- touch input ---------------------------------------------------------
  // A falling-shapes game lives or dies on how it moves under a thumb, so the
  // phone gets BOTH: a d-pad whose arrows auto-repeat while held, and swipe
  // gestures on the well itself. DAS/ARR are the arcade defaults, roughly: a
  // 170ms delay before the repeat starts (so a single tap is still a single
  // step) and then a step every 55ms sideways, 45ms down.
  const DAS = 170, ARR = 55, ARR_DOWN = 45;
  // Touch device? Resolved once after hydration (never during render, so the
  // server and client agree). Kills the keyboard as an input, and hides the
  // keyboard hint line at every width rather than only under 640px.
  const [touchOnly, setTouchOnly] = useState(false);
  useEffect(() => { setTouchOnly(isMobileDevice()); }, []);
  // If a keyboard IS up, touching the game puts it away. The join form sits
  // under the board, so a player who tapped it and then reached for the pad
  // was otherwise left playing behind the keyboard.
  const dropFocus = useCallback(() => {
    try {
      const el = typeof document !== 'undefined' ? document.activeElement : null;
      if (el && el !== document.body && typeof el.blur === 'function') el.blur();
    } catch (e) {}
  }, []);
  const repRef = useRef({ t: null, i: null });
  const stopRepeat = useCallback(() => {
    if (repRef.current.t) { clearTimeout(repRef.current.t); repRef.current.t = null; }
    if (repRef.current.i) { clearInterval(repRef.current.i); repRef.current.i = null; }
  }, []);
  const startRepeat = useCallback((what) => {
    stopRepeat();
    act(what);
    repRef.current.t = setTimeout(() => {
      repRef.current.i = setInterval(() => act(what), what === 'down' ? ARR_DOWN : ARR);
    }, DAS);
  }, [act, stopRepeat]);
  useEffect(() => stopRepeat, [stopRepeat]);

  const holdProps = (what) => ({
    onPointerDown: (e) => { e.preventDefault(); dropFocus(); e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); startRepeat(what); },
    onPointerUp: stopRepeat, onPointerLeave: stopRepeat, onPointerCancel: stopRepeat,
    onContextMenu: (e) => e.preventDefault(),
  });
  const tapProps = (what) => ({
    onPointerDown: (e) => { e.preventDefault(); dropFocus(); act(what); },
    onContextMenu: (e) => e.preventDefault(),
  });

  // Swipe on the well: drag sideways to move a column at a time, drag down to
  // soft drop, flick down hard-drops, and a tap that never moved rotates.
  const swRef = useRef(null);
  const wellProps = {
    onPointerDown: (e) => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || !cur.t0 || pausedRef.current) return;
      e.preventDefault();
      dropFocus();
      swRef.current = { x: e.clientX, y: e.clientY, ax: e.clientX, ay: e.clientY, t: Date.now(), moved: false, dropped: false };
      e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      const s = swRef.current;
      if (!s || s.dropped) return;
      const cell = Math.max(18, cellRef.current);
      let dx = e.clientX - s.ax;
      while (Math.abs(dx) >= cell) {
        act(dx > 0 ? 'right' : 'left');
        s.ax += dx > 0 ? cell : -cell;
        dx = e.clientX - s.ax;
        s.moved = true;
      }
      const dy = e.clientY - s.ay;
      if (dy >= cell && Math.abs(e.clientX - s.x) < cell * 1.5) {
        act('down'); s.ay += cell; s.moved = true;
      }
    },
    onPointerUp: (e) => {
      const s = swRef.current;
      swRef.current = null;
      if (!s) return;
      const dt = Date.now() - s.t;
      const dy = e.clientY - s.y, dx = Math.abs(e.clientX - s.x);
      const cell = Math.max(18, cellRef.current);
      if (!s.dropped && dy > cell * 3 && dx < cell * 1.5 && dt < 260) { act('drop'); return; }
      if (!s.moved && dt < 260) act('cw');
    },
    onPointerCancel: () => { swRef.current = null; },
    onContextMenu: (e) => e.preventDefault(),
  };

  const dropRef = useRef(0), lockRef = useRef(0), resetsRef = useRef(0), lastRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const step = (t) => {
      raf = requestAnimationFrame(step);
      const cur = gRef.current;
      if (cur.status !== 'playing' || !cur.t0 || pausedRef.current) { lastRef.current = t; drawWell(); return; }
      const dt = Math.min(120, t - (lastRef.current || t));
      lastRef.current = t;
      cur.ms += dt;
      dropRef.current += dt;
      const grounded = cur.cur && hits(cur.grid, COLS, ROWS, cur.cur, cur.cur.x, cur.cur.y + 1);
      if (grounded) {
        lockRef.current += dt;
        if (lockRef.current >= LOCK_MS) {
          const st = { ...cur, grid: cur.grid.map((r) => r.slice()), cur: { ...cur.cur } };
          settle(st);
          lockRef.current = 0; resetsRef.current = 0;
          commit(st);
          if (st.status !== 'playing') postResult(st);
        }
      } else {
        lockRef.current = 0;
        if (dropRef.current >= GRAVITY_MS) {
          dropRef.current = 0;
          if (cur.cur && !hits(cur.grid, COLS, ROWS, cur.cur, cur.cur.x, cur.cur.y + 1)) cur.cur.y += 1;
        }
      }
      drawWell();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [COLS, ROWS, settle, commit, postResult]);

  // ---- canvas --------------------------------------------------------------
  // THE ON-SCREEN KEYBOARD MUST NOT RESIZE THE WELL (owner report, 2026-08-10).
  // The well is sized off innerHeight and re-sized on every `resize`. On iOS,
  // opening the keyboard fires exactly that event with a viewport roughly 40%
  // shorter, so `fh` collapsed and the board dropped to the 14px cell floor:
  // the game became unplayable the moment anything focused a field, and the
  // join form sits directly under the board. Nothing recovered it until the
  // next resize.
  //
  // So the well is sized off the TALLEST height seen AT THIS WIDTH instead. A
  // shrink of more than a fifth at an unchanged width is a keyboard, never a
  // new layout (the URL bar is worth about a tenth, and is still honored), so
  // that height is ignored and the last good one stands. A rotation changes the
  // width, which re-latches honestly.
  const vhRef = useRef({ w: 0, h: 0 });
  const stableVH = useCallback(() => {
    if (typeof window === 'undefined') return 800;
    const w = window.innerWidth, h = window.innerHeight;
    const prev = vhRef.current;
    if (!prev.h || w !== prev.w) { vhRef.current = { w, h }; return h; }
    if (h < prev.h * 0.8) return prev.h;
    vhRef.current = { w, h };
    return h;
  }, []);

  const sizeWell = useCallback(() => {
    const box = boxRef.current, cvs = cvsRef.current;
    if (!box || !cvs) return;
    const phone = typeof window !== 'undefined' && window.innerWidth <= 640;
    const fw = Math.max(120, box.clientWidth - (phone ? 0 : 146));
    const fh = stableVH() - (phone ? 310 : 300);
    const cell = Math.max(14, Math.min(34, Math.floor(Math.min(fw / COLS, fh / ROWS))));
    cellRef.current = cell;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    cvs.width = COLS * cell * dpr; cvs.height = ROWS * cell * dpr;
    cvs.style.width = `${COLS * cell}px`; cvs.style.height = `${ROWS * cell}px`;
    const ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWell();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [COLS, ROWS, stableVH]);

  const drawWell = useCallback(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const cell = cellRef.current, W = COLS * cell, H = ROWS * cell;
    const rr = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    const light = lightRef.current;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const easeBack = (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    // A tile: the shape's colour with a soft sheen on its upper half and a
    // thin darker edge. `o.color` overrides the fill (the quad's rainbow, the
    // greyed stack), `o.flash` whitens it, `o.scale`/`o.rot` break it apart.
    const tile = (px, py, key, o = {}) => {
      const c = cell - 1, r = Math.max(2, c * 0.18);
      const col = o.color || pieceFill(key, light);
      ctx.save();
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      if (o.scale != null && o.scale !== 1) {
        const cx = px + cell / 2, cy = py + cell / 2;
        ctx.translate(cx, cy); ctx.scale(o.scale, o.scale); if (o.rot) ctx.rotate(o.rot); ctx.translate(-cx, -cy);
      }
      rr(px + 1, py + 1, c - 1, c - 1, r);
      ctx.fillStyle = col; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.stroke();
      rr(px + 3, py + 3, c - 5, (c - 5) * 0.42, r * 0.7);
      ctx.fillStyle = 'rgba(255,255,255,0.24)'; ctx.fill();
      if (IS_EXTRA[key] && !o.color && cell >= 14) {
        const d = cell * 0.14, cx = px + cell / 2, cy = py + cell / 2;
        ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
      }
      if (o.flash) { rr(px + 1, py + 1, c - 1, c - 1, r); ctx.fillStyle = `rgba(255,255,255,${Math.min(1, o.flash)})`; ctx.fill(); }
      ctx.restore();
    };
    // A canvas cannot be reached by a DOM contrast sweep, so the well reads the
    // stage tokens for itself, the way Chomp's boardPalette does. Off the stage
    // the custom properties are undefined and the fallbacks paint it white
    // exactly as before.
    const wcs = typeof window !== 'undefined' ? getComputedStyle(cvs) : null;
    const wtok = (name, fallback) => {
      const got = wcs && wcs.getPropertyValue(name);
      return got && got.trim() ? got.trim() : fallback;
    };
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const fx = fxRef.current;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = wtok('--stg-cell', '#ffffff'); rr(0, 0, W, H, 12); ctx.fill();
    // a faint grid, so a gap reads as a gap
    ctx.strokeStyle = light ? 'rgba(20,40,80,0.05)' : 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 1; x < COLS; x++) { ctx.moveTo(x * cell + 0.5, 0); ctx.lineTo(x * cell + 0.5, H); }
    for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, y * cell + 0.5); ctx.lineTo(W, y * cell + 0.5); }
    ctx.stroke();
    const st = gRef.current;

    // hard-drop trails
    fx.trail = fx.trail.filter((t) => now - t.t0 < 220);
    for (const t of fx.trail) {
      const a = 1 - (now - t.t0) / 220;
      const gr = ctx.createLinearGradient(0, t.y0 * cell, 0, t.y1 * cell);
      const tc = pieceFill(t.k, light);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, tc);
      ctx.globalAlpha = 0.4 * a; ctx.fillStyle = gr;
      ctx.fillRect(t.x * cell + cell * 0.2, t.y0 * cell, cell * 0.6, Math.max(0, (t.y1 - t.y0)) * cell);
      ctx.globalAlpha = 1;
    }

    // the clear: rows flash, then break apart from the middle out, then the
    // rows above drop into place with a little bounce
    const cl = fx.clear;
    let ce = 0, fallE = 1;
    if (cl) {
      ce = (now - cl.t0) / cl.dur;
      const fallStart = cl.t0 + cl.dur * 0.6;
      fallE = Math.max(0, Math.min(1, (now - fallStart) / 200));
      if (!cl.sparked && ce > 0.38 && !reducedRef.current) {
        cl.sparked = true;
        const quad = cl.n === 4;
        cl.rows.forEach((y, ri) => cl.keys[ri].forEach((k, x) => {
          const cnt = quad ? 4 : 2;
          for (let q = 0; q < cnt; q++) {
            const ang = Math.random() * Math.PI * 2, sp = (quad ? 0.26 : 0.15) * (0.4 + Math.random());
            const hue = quad ? pieceFill(Object.keys(PIECE_HUE)[(x + ri) % 9], light) : pieceFill(k, light);
            fx.parts.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(ang) * sp + (x - COLS / 2) * 0.01, vy: Math.sin(ang) * sp - (quad ? 0.2 : 0.12), g: 0.012, life: 0, max: quad ? 70 : 42, s: (quad ? 0.34 : 0.26) * (0.6 + Math.random() * 0.6), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: hue });
          }
        }));
        if (quad) {
          for (let q = 0; q < 60; q++) fx.parts.push({ x: Math.random() * COLS, y: -0.4, vx: (Math.random() - 0.5) * 0.12, vy: Math.random() * 0.08 + 0.04, g: 0.004, life: 0, max: 110, s: 0.22, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, col: pieceFill(Object.keys(PIECE_HUE)[q % 9], light), conf: true });
        }
      }
      if (ce >= 1 && fallE >= 1) fx.clear = null;
    }
    const lf = fx.lock && now - fx.lock.t0 < 200 ? fx.lock : null;
    const ov = fx.over ? Math.min(1, (now - fx.over.t0) / 700) : 0;
    const grey = wtok('--stg-mute', '#9aa2b1');
    for (let y = 0; y < ROWS; y++) {
      const sh = cl && cl.shifts[y] ? cl.shifts[y] * (1 - easeBack(fallE)) : 0;
      const greyRow = ov > 0 && (ROWS - 1 - y) < ov * ROWS;
      for (let x = 0; x < COLS; x++) {
        const k = st.grid[y][x];
        if (!k) continue;
        let flash = 0;
        if (lf && lf.cells.some((c) => c[0] === x && c[1] === y)) flash = 0.6 * (1 - (now - lf.t0) / 200);
        tile(x * cell, (y - sh) * cell, k, { flash, color: greyRow ? grey : null, alpha: greyRow ? 0.55 : 1 });
      }
    }
    if (cl && ce < 1) {
      const quad = cl.n === 4;
      const ph1 = Math.min(1, ce / 0.38);
      cl.rows.forEach((y, ri) => cl.keys[ri].forEach((k, x) => {
        if (!k) return;
        const dist = Math.abs(x - (COLS - 1) / 2) / (COLS / 2);
        const ph2 = Math.max(0, Math.min(1, (ce - 0.38 - dist * 0.25) / 0.4));
        if (ph2 >= 1) return;
        const color = quad ? pieceFill(Object.keys(PIECE_HUE)[Math.floor(x + now / 70) % 9], light) : null;
        tile(x * cell, y * cell, k, { flash: ph1 * (quad ? 0.3 : 0.85) * (1 - ph2), scale: 1 - ph2 * 0.9, rot: ph2 * (x % 2 ? 0.8 : -0.8), alpha: 1 - ph2 * 0.6, color });
      }));
      if (quad && !reducedRef.current) {
        const sx = (ce * 1.6 - 0.3) * W;
        const top = cl.rows[0] * cell;
        const gr = ctx.createLinearGradient(sx - 70, 0, sx + 70, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, top, W, cl.rows.length * cell);
      }
    }

    // the falling shape and its ghost
    if (st.cur && st.status === 'playing') {
      const m = shapeAt(st.cur.k, st.cur.r);
      const soft = pausedRef.current;
      if (!soft) {
        let gy = st.cur.y;
        while (!hits(st.grid, COLS, ROWS, st.cur, st.cur.x, gy + 1)) gy += 1;
        ctx.save(); ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.strokeStyle = pieceFill(st.cur.k, light); ctx.globalAlpha = 0.55;
        for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) if (m[y][x] && gy + y >= 0) { rr((st.cur.x + x) * cell + 3, (gy + y) * cell + 3, cell - 6, cell - 6, cell * 0.14); ctx.stroke(); }
        ctx.restore();
      }
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) if (m[y][x] && st.cur.y + y >= 0) tile((st.cur.x + x) * cell, (st.cur.y + y) * cell, st.cur.k, { alpha: soft ? 0.3 : 1 });
    }

    // particles, in cell units so a resize mid-burst stays put
    if (fx.parts.length) {
      fx.parts = fx.parts.filter((q) => q.life < q.max);
      for (const q of fx.parts) {
        q.life += 1; q.vy += q.g; q.x += q.vx; q.y += q.vy; q.vx *= 0.985; q.rot = (q.rot || 0) + (q.vr || 0);
        const a = 1 - q.life / q.max, sz = q.s * cell;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x * cell, q.y * cell); ctx.rotate(q.rot);
        if (q.dust) { ctx.fillStyle = grey; ctx.beginPath(); ctx.arc(0, 0, sz * a, 0, 7); ctx.fill(); }
        else if (q.conf) { ctx.fillStyle = q.col; ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2); }
        else { ctx.fillStyle = q.col; rr(-sz / 2, -sz / 2, sz, sz, sz * 0.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-sz / 2 + 1, -sz / 2 + 1, sz - 2, sz * 0.35); }
        ctx.restore();
      }
    }

    // floating "+2 rows"
    if (fx.floats.length) {
      fx.floats = fx.floats.filter((f) => now - f.t0 < 1100);
      for (const f of fx.floats) {
        const e = (now - f.t0) / 1100;
        ctx.save();
        ctx.globalAlpha = e < 0.15 ? e / 0.15 : 1 - Math.max(0, (e - 0.6) / 0.4);
        ctx.font = `800 ${f.big ? 22 : 17}px Manrope, system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(11,13,18,0.75)';
        const ty = (f.y - e * 1.4) * cell;
        ctx.strokeText(f.text, W / 2, ty);
        ctx.fillStyle = f.big ? '#f5c94a' : '#ffffff'; ctx.fillText(f.text, W / 2, ty);
        ctx.restore();
      }
    }

    ctx.strokeStyle = wtok('--stg-cell-line', COLORS.well); ctx.lineWidth = 2; rr(1, 1, W - 2, H - 2, 11); ctx.stroke();
  }, [COLS, ROWS]);

  useEffect(() => {
    if (!hydrated) return;
    sizeWell();
    const on = () => sizeWell();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [hydrated, sizeWell, started, preStart]);

  // leaving the page never costs a run
  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);

  useEffect(() => {
    const hide = () => { if (document.hidden) { pausedRef.current = true; setPaused(true); } };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);

  // ---- controls ------------------------------------------------------------
  const togglePause = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    lastRef.current = 0;
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (showHelp) { if (e.key === 'Escape') setShowHelp(false); return; }
      // A PHONE IS DRIVEN BY THE PAD, NEVER BY A KEYBOARD (owner rule,
      // 2026-08-10). On a touch device every key is ignored outright, so an
      // on-screen keyboard can never be an input to this game: the four dock
      // buttons and the swipe gestures on the well are the whole control set.
      // Gated on the DEVICE rather than the viewport width, per the project
      // rule, so a narrow desktop window keeps its arrow keys.
      if (touchOnly) return;
      const cur = gRef.current;
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); togglePause(); return; }
      if (cur.status !== 'playing' || !cur.t0 || pausedRef.current) return;
      const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].indexOf(k) >= 0) e.preventDefault();
      if (k === 'ArrowLeft') act('left');
      else if (k === 'ArrowRight') act('right');
      else if (k === 'ArrowDown') act('down');
      else if (k === 'ArrowUp' || k === 'x' || k === 'X') act('cw');
      else if (k === 'z' || k === 'Z') act('ccw');
      else if (k === ' ') act('drop');
      else if (k === 'c' || k === 'C') act('hold');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, togglePause, showHelp, touchOnly]);

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    const st = { ...cur, grid: cur.grid.map((r) => r.slice()), t0: Date.now() };
    nextPiece(st);
    lastRef.current = 0; dropRef.current = 0; lockRef.current = 0;
    pausedRef.current = false; setPaused(false);
    commit(st);
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(sizeWell, 0);
  }

  // ---- replay --------------------------------------------------------------
  // A fresh run on the SAME day's shape order (the sequence comes from the
  // quizId, so a replay is the same 6,000 shapes, not a new deal).
  //
  // It deliberately clears NOTHING that records the day: not REC_KEY, not the
  // stats entry, not the posted row. Every finished run posts, and both the
  // board and the local record keep your BEST one (arcade rule, see isArcade in
  // lib/daily-games), so a replay is a real attempt at a better place rather
  // than practice. This comment used to say the exact opposite, which was true
  // of the board until 2026-08-08 and of the local record until 2026-08-14.
  const replayRun = useCallback(() => {
    releaseEnd();
    const st = { ...freshState(COLS, ROWS), t0: Date.now() };
    fxRef.current = { clear: null, lock: null, trail: [], parts: [], floats: [], over: null };
    setBurst(null);
    nextPiece(st);
    lastRef.current = 0; dropRef.current = 0; lockRef.current = 0; resetsRef.current = 0;
    pausedRef.current = false; setPaused(false);
    setArmRestart(false);
    // FALSE, not true (fixed 2026-08-12): nothing else clears endClosed, so a
    // replayed run used to finish with no end card at all. See ChompClient.
    setEndClosed(false);
    commit(st);
    setTimeout(sizeWell, 0);
  }, [releaseEnd, COLS, ROWS, nextPiece, commit, sizeWell]);

  // ---- share ---------------------------------------------------------------
  function shareText() {
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    return `Blocks #${PUZZLE.num}${sun} · ${nf(rowsCleared)} row${rowsCleared === 1 ? '' : 's'} · par ${nf(PAR)} · ${nf(g.raw)} points\nmindloftdaily.com/blocks`;
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
  // THE REAL BOARD, not a slice of one (owner report, 2026-08-10). Two separate
  // bugs made this panel lie, and both are fixed here:
  //
  //  1. IT READ THE WRONG AXIS. `board.leaderboard` is 'registered:all', which
  //     is signed-in players only and EVERY attempt they posted. Blocks is an
  //     arcade game: it takes unlimited runs and it keeps your BEST one, so one
  //     player's four runs took four of the ten rows while the day's actual
  //     best run, an anonymous 70, was not on the board at all. The axis that
  //     reads true here is 'all:first' (`leaderboardFirst`), which on an arcade
  //     game is ONE ROW PER PLAYER, their best run, guests included: exactly
  //     what this game's own rules copy promises. See buildLeaderboard in
  //     lib/quiz-anon.js. `leaderboard` stays as the fallback only so an old
  //     cached payload still renders something.
  //  2. IT SHOWED A WINDOW AROUND YOU, +/-2 rows, so a player who had cleared
  //     nothing opened on ranks 8, 9 and 10 and could not see who was winning.
  //     The TOP FIVE now always render, and your live row pins beneath them
  //     behind a gap marker whenever this run sits outside them.
  //
  // Still fetched once and never polled: only YOUR row moves as you clear, so
  // nothing here is invented mid-run.
  const ladder = useMemo(() => {
    const anon = hydrated ? getAnonId() : null;
    const myKey = anon ? `a:${anon}` : null;
    const myName = String((identity && identity.username) || '').toLowerCase();
    // Drop my OWN stored row. The live run below is already on the ladder as
    // "You", so leaving it in lists the same person twice, once under their
    // name and once as You. Guests match on the anon key that buildLeaderboard
    // returns; a signed-in player matches on the display name, because the
    // board carries no user_id to compare against.
    const isMine = (r) => (!!myKey && r.userKey === myKey)
      || (!!myName && String(r.username || '').toLowerCase() === myName);
    const rows = (board.leaderboardFirst || board.leaderboard || [])
      .filter((r) => !isMine(r))
      .slice(0, 40)
      .map((r) => ({ name: r.username || 'player', score: r.score, me: false }));
    const mine = rowsCleared;
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
  }, [board.leaderboardFirst, board.leaderboard, rowsCleared, identity, hydrated]);

  // ALL TIME: the best single run on any day, one row per registered player
  // (/api/quiz/blocks-best). Your live run slots in when it would make the list.
  const bestRows = useMemo(() => {
    if (!bestRuns) return [];
    const myName = String((identity && identity.username) || '').toLowerCase();
    const rows = bestRuns.map((r) => ({ ...r, me: !!myName && String(r.name || '').toLowerCase() === myName }));
    const live = started ? rowsCleared : 0;
    if (live > 0) {
      const mineAt = rows.findIndex((r) => r.me);
      if (mineAt < 0 || rows[mineAt].score < live) {
        const rest = rows.filter((r) => !r.me);
        let at = rest.findIndex((r) => r.score < live);
        if (at < 0) at = rest.length;
        if (at < 5) return rest.slice(0, at).concat([{ name: 'You', score: live, me: true }], rest.slice(at)).slice(0, 5);
      }
    }
    return rows.slice(0, 5);
  }, [bestRuns, identity, started, rowsCleared]);

  // ---- rules ---------------------------------------------------------------
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Fit the falling shapes together and complete a full row to clear it."
      banner={`Everyone gets the same shapes in the same order today${PUZZLE.sunday ? ', in a narrower Sunday well' : ''}.`}
      sub="Nine shapes: the seven you know, plus a corner and a plus. The two additions carry a small white diamond."
      steps={[
        <>Move with <b>&larr; &rarr;</b>, rotate with <b>&uarr;</b>, and hard drop with <b>space</b> on a keyboard or a <b>flick down the well</b> on a phone.</>,
        <><b>Hold</b> a shape with <b>C</b> to save it for the gap it fits.</>,
        <>Complete a row to clear it, and clear on <b>consecutive shapes</b> to build a combo.</>,
        ...(BONUS ? [<>Clear <b>four rows with one shape</b> and it counts as <b>five</b>: a bonus row on top.</>] : []),
        <><b>Pause</b> whenever. The board is saved, so you can come back through the day and pick the same run up where you left it.</>,
      ]}
      knack="It never speeds up. The well is only 16 rows and the drop rate is the same on shape 400 as on shape one, so runs end because of a hole you left three shapes ago, not because your hands gave out."
      footer={`Scored on ROWS CLEARED, and you can play the day as many times as you like, because Blocks keeps your BEST run rather than your first: your score IS the number of rows you clear, with no ceiling on it${BONUS ? ', plus one bonus row for every four-row clear' : ''}, and ${nf(PAR)} rows is par for the day. Ties break on FEWEST SHAPES USED, then on time, since the same rows off fewer shapes is the tidier run, and a run that clears nothing ranks on shapes survived instead. The points figure on screen (100, 300, 500 and 800 a line, 1,200 for a quad, plus a combo bonus) is there to play against, not to be scored on. Blocks pays at most 1 IQ point a day however long the run goes and however many runs you play, so nobody can grind their way up the standings: the real competition is today\u2019s leaderboard. Sundays narrow the well from 10 columns to 8.`}
    />
  );

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };
  const dockBtn = { width: 46, height: 44, borderRadius: 9, border: STAGE ? '1px solid var(--stg-cell-line)' : `1px solid ${COLORS.line}`, background: STAGE ? 'var(--stg-cell)' : '#fff', color: STAGE ? 'var(--stg-ink,#e9edf4)' : FADED, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="blocks" name="Blocks" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="blocks" quizId={PUZZLE.quizId}
          name="Blocks"
          cat="Arcade"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: rowsCleared, k: 'rows' },
            { v: PAR, k: 'par' },
          ] : [
            { v: rowsCleared, k: 'rows' },
            { v: PAR, k: 'par' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
        <DailyMasthead
          slug="blocks"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>
              Sunday Edition &middot; 8 wide
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Blocks is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Fit the falling shapes together and clear full rows. It never speeds up, you can pause and come back whenever you like, and you can play the day again as often as you want. Your best run is the one that counts.</p>
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
          <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Shape <b style={{ color: INK }}>{nf(Math.max(1, g.idx))}</b>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8' }}>
                Next <span style={{ marginLeft: 4 }}><MiniShape k={SEQ[g.idx]} light={LIGHT} /></span>
              </span>
              {/* Hold sits up here rather than in the thumb zone: it is used a
                  fraction as often as move and rotate, and the dock below is
                  worth more to the two hands actually playing. */}
              <button
                {...tapProps('hold')}
                style={{ marginLeft: 'auto', border: `1px solid ${COLORS.line}`, background: g.held ? 'var(--stg-surf, #f1f5f9)' : 'var(--stg-surf, #fff)', color: g.held ? '#94a3b8' : COLORS.faded, borderRadius: 7, padding: '5px 10px', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', touchAction: 'none' }}
              >
                Hold{g.hold ? <span style={{ marginLeft: 6, opacity: g.held ? 0.45 : 1 }}><MiniShape k={g.hold} light={LIGHT} cell={6} /></span> : null}
              </button>
              <button onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} style={{ border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={() => setShowHelp(true)} aria-label="How to play" style={{ border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <HelpCircle size={15} />
              </button>
            </div>

            <div ref={boxRef} style={{ display: 'flex', gap: 14, alignItems: 'stretch', justifyContent: 'center' }}>
              <div ref={wellWrapRef} className="bl-wellwrap" style={{ position: 'relative', flex: 'none' }}>
                <canvas ref={cvsRef} {...wellProps} style={{ display: 'block', touchAction: 'none', cursor: started ? 'grab' : 'default' }} />
                {burst && burst.n === 4 && (
                  <div key={`q${burst.id}`} className="bl-banner" aria-live="polite">
                    <div className="bl-banner-big">FOUR ROWS</div>
                    {BONUS && <span className="bl-banner-sub">4 rows <em>+1 bonus</em> = 5</span>}
                  </div>
                )}
                {burst && burst.combo > 1 && (
                  <div key={`c${burst.id}`} className="bl-combo">Combo &times;{burst.combo}</div>
                )}
              </div>
              <aside className="bl-ladder" style={{ width: 132, flex: 'none', borderLeft: `1px solid ${COLORS.line}`, paddingLeft: 11, display: 'flex', flexDirection: 'column' }}>
                <div className="bl-tabs" role="tablist" aria-label="Leaderboard">
                  <button type="button" role="tab" aria-selected={lbTab === 'today'} onClick={() => setLbTab('today')}>Today</button>
                  <button type="button" role="tab" aria-selected={lbTab === 'all'} onClick={() => setLbTab('all')}>All time</button>
                </div>
                {lbTab === 'all' ? (
                  bestRows.length ? bestRows.map((r, i) => (
                    <div key={`${i}-${r.name}`} title={r.day ? `${r.name}, ${r.day}` : r.name} style={{
                      display: 'flex', alignItems: 'baseline', gap: 6, padding: '3.5px 6px', margin: '0 -6px',
                      fontSize: 11.5, color: r.me ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})`, fontWeight: r.me ? 800 : 500,
                      background: r.me ? (STAGE ? 'var(--stg-surf2)' : '#eef4ff') : 'transparent', borderRadius: 5,
                    }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, width: 22, flex: 'none', color: r.me ? `var(--stg-acc-ink, ${COLORS.accent})` : '#9aa2b1' }}>#{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                      <span style={{ fontWeight: 800 }}>{r.score}</span>
                    </div>
                  )) : (
                    <div style={{ fontSize: 11, color: FADED, lineHeight: 1.4 }}>{bestRuns ? 'No runs on the board yet.' : 'Loading…'}</div>
                  )
                ) : ladder.rows.map((r) => (r.gap ? (
                  <div key="gap" aria-hidden="true" style={{ textAlign: 'center', color: '#c3cad6', fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', lineHeight: '11px', padding: '4px 0 2px' }}>&middot;&middot;&middot;</div>
                ) : (
                  <div key={`${r.rank}-${r.name}`} style={{
                    display: 'flex', alignItems: 'baseline', gap: 6, padding: '3.5px 6px', margin: '0 -6px',
                    fontSize: 11.5, color: r.me ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})`, fontWeight: r.me ? 800 : 500,
                    background: r.me ? (STAGE ? 'var(--stg-surf2)' : '#eef4ff') : 'transparent', borderRadius: 5,
                  }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, width: 30, flex: 'none', color: r.me ? `var(--stg-acc-ink, ${COLORS.accent})` : '#9aa2b1' }}>#{r.rank}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <span style={{ fontWeight: 800 }}>{r.score}</span>
                  </div>
                )))}
                {lbTab === 'all' && <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 5, lineHeight: 1.35 }}>Best single run on any day</div>}
                <div style={{ marginTop: 'auto', paddingTop: 9, borderTop: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{nf(rowsCleared)}<em style={{ fontStyle: 'normal', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}> row{rowsCleared === 1 ? '' : 's'}</em></div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: '#94a3b8', marginTop: 3 }}>par {nf(PAR)}</div>
                </div>
              </aside>
            </div>

            <div className="bl-strip" style={{ display: 'none', marginTop: 10, paddingTop: 9, borderTop: `1px solid ${COLORS.line}`, alignItems: 'center', gap: 10, fontSize: 11.5, color: FADED }}>
              <span style={{ fontWeight: 800, color: ACC_INK }}>You #{ladder.rank}</span>
              <span>par {nf(PAR)} rows</span>
              {bestRows.length > 0 && <span title="Best single run on any day" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>Best ever {bestRows[0].score} &middot; {bestRows[0].name}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 800, color: INK }}>{nf(rowsCleared)}<em style={{ fontStyle: 'normal', fontSize: 10, color: '#94a3b8' }}> row{rowsCleared === 1 ? '' : 's'}</em></span>
            </div>

            {/* The pad IS the T piece: [[0,1,0],[1,1,1]], and nothing else.
                Up rotates, left and right move, the middle steps it down. One
                rotate, because picking a direction is not a decision anyone
                wants to make with a shape already falling, and no Drop key,
                because a flick down the well does it and the pad stays a shape
                rather than a control panel. Centered at every width. */}
            <div className="bl-dock">
              <div className="bl-pad">
                <button className="bl-rot" style={dockBtn} {...tapProps('cw')} aria-label="Rotate">&#8635;</button>
                <button className="bl-lft" style={dockBtn} {...holdProps('left')} aria-label="Move left">&#9664;</button>
                <button className="bl-dwn" style={dockBtn} {...holdProps('down')} aria-label="Soft drop">&#9660;</button>
                <button className="bl-rgt" style={dockBtn} {...holdProps('right')} aria-label="Move right">&#9654;</button>
              </div>
            </div>
            <div className="bl-keys" style={{ display: touchOnly ? 'none' : 'block', textAlign: 'center', marginTop: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: '#9aa2b1' }}>
              &larr; &rarr; move &middot; &darr; soft drop &middot; &uarr; / Z rotate &middot; space hard drop &middot; C hold &middot; P pause
            </div>
            <div className="bl-touchhint" style={{ display: touchOnly ? 'block' : 'none', textAlign: 'center', marginTop: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: '#9aa2b1' }}>
              Flick down the well to hard drop &middot; or swipe to move and tap to rotate &middot; hold an arrow to repeat
            </div>

            {/* PLAY AGAIN, on the page as well as on the end card. The end card
                is dismissible, and once it is gone a finished Blocks board had
                no route back onto itself at all. This bar is the prominent one:
                full width, filled, directly under the well where the run just
                ended. Mid-run the same control becomes a quiet two-tap Restart,
                because throwing away a long run should take a deliberate second
                press. Every finished run posts, and the board keeps your best. */}
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
                  title={armRestart ? 'Starts this run over' : 'Start this run over'}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-acc-ink, ${COLORS.accent})` : '#9aa2b1', textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <RotateCcw size={13} /> {armRestart ? 'Press again to start over' : 'Restart run'}
                </button>
              </div>
            )}

            {paused && playing && g.t0 && (
              <div style={{ position: 'absolute', inset: 0, background: 'var(--stg-raise, rgba(255,255,255,0.96))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 6 }}>
                <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Paused</div>
                  <p style={{ margin: '0 0 13px', fontSize: 13.5, lineHeight: 1.55, color: FADED }}>
                    Saved. Come back any time before midnight and pick this run up where you left it.
                  </p>
                  <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{nf(rowsCleared)}<span style={{ fontSize: 19, color: 'var(--stg-mute, #94a3b8)' }}> row{rowsCleared === 1 ? '' : 's'}</span></div>
                  <p style={{ margin: '7px 0 13px', fontSize: 13, color: FADED }}>par {nf(PAR)} &middot; {nf(g.raw)} points &middot; shape {nf(g.idx)} &middot; {fmtTime(g.ms)}</p>
                  <button onClick={togglePause} style={{ ...btn, background: STAGE ? STAGE_C : T.cta, borderColor: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Resume</button>
                </div>
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
              name="Blocks"
              catRank={catRank}
              outcome={verdictTone}
              challengeMetric={rowsCleared}
              title={verdictWord}
              detail={`${rowsCleared} rows \u00b7 ${PAR} par`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Blocks all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Shapes"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/blocks?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board',
                  sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Blocks', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/blocks?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="blocks" name="Blocks" onShow={() => setShowChrome(true)} />}
        {/* Only for players who have NOT joined. This was gated on focusMode
            alone, so a player who had already signed up was still asked to sign
            up under the board every day. Every other daily gates on !identity;
            Blocks was the last one that did not, and Chomp inherited the bug by
            being copied from here. */}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="Put your name on today&rsquo;s board" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
        {LOFT && (
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="blocks" name="Blocks" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
        )}
        {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
        {!focusMode && <AddToHome name="Blocks" />}
        <div id="stf-stats-slot" />
        {!LOFT && (
        <DailyGamesGrid
          self="blocks"
          maxWidth={620}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          divider
          boardSlot={<DailyBoardPanel self="blocks" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
        />
        )}
        </div>

        {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
        <StageFold />
        <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Blocks</h2>
          <p style={{ margin: '0 0 9px' }}>
            Blocks is a daily falling-shapes puzzle. Everyone plays the same order of shapes on the same day, so the
            leaderboard compares decisions rather than luck. There is no speed curve: the drop rate is fixed for the whole
            run, the well is a short 16 rows, and a run ends when the stack reaches the ceiling.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            Your run waits for you. Pause whenever, close the tab, come back after lunch: the board
            is saved and the same run picks up where you left it. On Sundays the well narrows from ten columns to eight.
            However long a run goes, Blocks pays at most 1 IQ point a day, so a long sitting cannot buy a place in the
            standings. The day&rsquo;s leaderboard is where the run actually counts.
          </p>
          <p style={{ margin: 0 }}>
            More daily puzzles: <a href="/crux" style={{ color: ACC_INK }}>Crux</a>,{' '}
            <a href="/tally" style={{ color: ACC_INK }}>Tally</a>,{' '}
            <a href="/etch" style={{ color: ACC_INK }}>Etch</a>.
          </p>
        </section>
      </div>


      {/* OUTSIDE the page column on purpose. The column is a stacking context
          (position:relative + zIndex:2, which it needs to clear the fixed Grain
          wash at 1), and DailyChrome caps the header group at 5. Nested inside
          the column, this card's .dec-backdrop z-index:85 is trapped in a
          z-index-2 context and paints UNDER the header. It shipped that way on
          2026-08-08 and the card hid behind the masthead. Every other daily
          renders it here, as a sibling after the column closes: keep it that
          way. */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="blocks"
          won={won}
          quizId={PUZZLE.quizId}
          completed
          score={<>{nf(rowsCleared)} row{rowsCleared === 1 ? '' : 's'} cleared &middot; par {nf(PAR)}</>}
          subline={<>{nf(g.raw)} points &middot; {nf(g.quads)} quad{g.quads === 1 ? '' : 's'} &middot; best combo {nf(g.bestCombo)} &middot; {nf(g.pieces)} shapes</>}
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
        /* the T piece, as a pad: rotate on top, move-left / down / move-right
           across the middle, Drop as the bar beneath. Centered at every width. */
        .bl-dock { display: flex; justify-content: center; margin-top: 12px; }
        .bl-pad {
          display: grid;
          grid-template-areas: ". rot ." "lft dwn rgt";
          grid-template-columns: repeat(3, 58px);
          gap: 8px;
          justify-content: center;
        }
        .bl-rot { grid-area: rot; }
        .bl-lft { grid-area: lft; }
        .bl-dwn { grid-area: dwn; }
        .bl-rgt { grid-area: rgt; }
        .bl-pad button { width: 100% !important; }
        .bl-tabs { display: flex; gap: 2px; margin: 0 0 8px; background: var(--stg-surf2, #eef1f6); border-radius: 7px; padding: 2px; }
        .bl-tabs button { flex: 1; border: 0; background: none; font: inherit; font-size: 9.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--stg-mute, #8b95a8); padding: 4px 0; border-radius: 5px; cursor: pointer; }
        .bl-tabs button[aria-selected="true"] { background: var(--stg-cell, #ffffff); color: var(--stg-ink, #0b0d12); box-shadow: 0 1px 2px rgba(0,0,0,.12); }
        .bl-wellwrap.bl-bump { animation: blBump .16s ease-out; }
        .bl-wellwrap.bl-shake { animation: blShake .55s cubic-bezier(.36,.07,.19,.97); }
        @keyframes blBump { 40% { transform: translateY(4px); } 100% { transform: none; } }
        @keyframes blShake { 10%,90% { transform: translate(-2px,1px); } 20%,80% { transform: translate(4px,-2px); } 30%,50%,70% { transform: translate(-6px,2px) rotate(-.6deg); } 40%,60% { transform: translate(6px,-1px) rotate(.6deg); } }
        .bl-banner { position: absolute; left: 50%; top: 38%; transform: translate(-50%,-50%) scale(.4); opacity: 0; pointer-events: none; text-align: center; white-space: nowrap; animation: blBan 1.5s cubic-bezier(.2,1.4,.35,1) forwards; z-index: 3; }
        .bl-banner-big { font-size: 38px; font-weight: 800; letter-spacing: -.03em; line-height: 1; background: linear-gradient(90deg, #7dd3fc, #c084fc, #fb7185, #e8b43a, #6ee7b7); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 3px 0 rgba(0,0,0,.3)); }
        .bl-banner-sub { display: inline-block; margin-top: 8px; font-size: 13px; font-weight: 800; color: #fff; background: #0b0d12; border-radius: 999px; padding: 5px 12px; }
        .bl-banner-sub em { font-style: normal; color: #f5c94a; }
        @keyframes blBan { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.4) rotate(-6deg); } 18% { opacity: 1; transform: translate(-50%,-50%) scale(1.12) rotate(2deg); } 30% { transform: translate(-50%,-50%) scale(1); } 78% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-62%) scale(.96); } }
        .bl-combo { position: absolute; right: 8px; top: 8px; font-size: 12px; font-weight: 800; color: #08222e; background: #fbbf24; border-radius: 999px; padding: 4px 10px; opacity: 0; pointer-events: none; animation: blCombo 1.2s ease forwards; z-index: 3; }
        @keyframes blCombo { 0% { opacity: 0; transform: scale(.6); } 15% { opacity: 1; transform: scale(1.15); } 30% { transform: scale(1); } 80% { opacity: 1; } 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .bl-wellwrap, .bl-banner, .bl-combo { animation-duration: .01ms !important; } }
        @media (max-width: 640px) {
          .bl-ladder { display: none !important; }
          .bl-strip { display: flex !important; }
          .bl-keys { display: none !important; }
          .bl-touchhint { display: block !important; }
          .bl-dock { margin-top: 10px; }
          .bl-pad { grid-template-columns: repeat(3, 64px); gap: 8px; }
          .bl-pad button { height: 58px !important; }
        }
      ` }} />

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
