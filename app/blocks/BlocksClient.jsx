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
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
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
  const rowsCleared = scoreRows(g.lines);
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
      quizId: PUZZLE.quizId, score: scoreRows(cur.lines), total: PAR,
      correct: 0, guessesUsed: cur.pieces, timeElapsed: el, abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((g2) => {
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    const sc = scoreRows(g2.lines);
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
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, PAR, identity]);

  // ---- the engine ----------------------------------------------------------
  const endRun = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'over', tEnd: Date.now(), cur: null };
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
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
      if (!m[y][x]) continue;
      const by = st.cur.y + y, bx = st.cur.x + x;
      if (by < 0) { above = true; continue; }
      st.grid[by][bx] = st.cur.k;
    }
    st.pieces += 1;
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
    } else st.combo = 0;
    if (above) { st.status = 'over'; st.tEnd = Date.now(); st.cur = null; return st; }
    return nextPiece(st);
  }, [COLS, ROWS, nextPiece]);

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
    const tile = (x, y, key, alpha, ghost) => {
      const px = x * cell, py = y * cell, c = cell - 1, r = Math.max(2, c * 0.16);
      if (ghost) {
        ctx.globalAlpha = 0.3; ctx.strokeStyle = PIECES[key].c; ctx.lineWidth = 2;
        rr(px + 2.5, py + 2.5, c - 4, c - 4, r * 0.8); ctx.stroke(); ctx.globalAlpha = 1; return;
      }
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      rr(px + 1, py + 1, c - 1, c - 1, r);
      ctx.fillStyle = PIECES[key].c; ctx.fill();
      ctx.strokeStyle = PIECES[key].e; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalAlpha = 1;
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
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = wtok('--stg-cell', '#ffffff'); rr(0, 0, W, H, 12); ctx.fill();
    ctx.strokeStyle = wtok('--stg-cell-line', COLORS.well); ctx.lineWidth = 2; rr(1, 1, W - 2, H - 2, 11); ctx.stroke();
    const st = gRef.current;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (st.grid[y][x]) tile(x, y, st.grid[y][x]);
    if (!st.cur || st.status !== 'playing') return;
    const m = shapeAt(st.cur.k, st.cur.r);
    const soft = pausedRef.current;
    if (!soft) {
      let gy = st.cur.y;
      while (!hits(st.grid, COLS, ROWS, st.cur, st.cur.x, gy + 1)) gy += 1;
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) if (m[y][x] && gy + y >= 0) tile(st.cur.x + x, gy + y, st.cur.k, 1, true);
    }
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) if (m[y][x] && st.cur.y + y >= 0) tile(st.cur.x + x, st.cur.y + y, st.cur.k, soft ? 0.3 : 1);
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

  // ---- rules ---------------------------------------------------------------
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Fit the falling shapes together and complete a full row to clear it."
      banner={`Everyone gets the same shapes in the same order today${PUZZLE.sunday ? ', in a narrower Sunday well' : ''}.`}
      sub="Nine shapes: the seven you know, plus a corner and a plus. The two additions are the two darkest blues."
      steps={[
        <>Move with <b>&larr; &rarr;</b>, rotate with <b>&uarr;</b>, and hard drop with <b>space</b> on a keyboard or a <b>flick down the well</b> on a phone.</>,
        <><b>Hold</b> a shape with <b>C</b> to save it for the gap it fits.</>,
        <>Complete a row to clear it, and clear on <b>consecutive shapes</b> to build a combo.</>,
        <><b>Pause</b> whenever. The board is saved, so you can come back through the day and pick the same run up where you left it.</>,
      ]}
      knack="It never speeds up. The well is only 16 rows and the drop rate is the same on shape 400 as on shape one, so runs end because of a hole you left three shapes ago, not because your hands gave out."
      footer={`Scored on ROWS CLEARED, and you can play the day as many times as you like, because Blocks keeps your BEST run rather than your first: your score IS the number of rows you clear, with no ceiling on it, and ${nf(PAR)} rows is par for the day. Ties break on FEWEST SHAPES USED, then on time, since the same rows off fewer shapes is the tidier run, and a run that clears nothing ranks on shapes survived instead. The points figure on screen (100, 300, 500 and 800 a line, 1,200 for a quad, plus a combo bonus) is there to play against, not to be scored on. Blocks pays at most 1 IQ point a day however long the run goes and however many runs you play, so nobody can grind their way up the standings: the real competition is today\u2019s leaderboard. Sundays narrow the well from 10 columns to 8.`}
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
                Next <b style={{ color: INK }}>{PIECE_LABEL[SEQ[g.idx]] || '-'}</b>
              </span>
              {/* Hold sits up here rather than in the thumb zone: it is used a
                  fraction as often as move and rotate, and the dock below is
                  worth more to the two hands actually playing. */}
              <button
                {...tapProps('hold')}
                style={{ marginLeft: 'auto', border: `1px solid ${COLORS.line}`, background: g.held ? 'var(--stg-surf, #f1f5f9)' : 'var(--stg-surf, #fff)', color: g.held ? '#94a3b8' : COLORS.faded, borderRadius: 7, padding: '5px 10px', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', touchAction: 'none' }}
              >
                Hold{g.hold ? <> &middot; <b style={{ color: g.held ? '#94a3b8' : `var(--stg-ink, ${COLORS.ink})` }}>{PIECE_LABEL[g.hold]}</b></> : null}
              </button>
              <button onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} style={{ border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button onClick={() => setShowHelp(true)} aria-label="How to play" style={{ border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <HelpCircle size={15} />
              </button>
            </div>

            <div ref={boxRef} style={{ display: 'flex', gap: 14, alignItems: 'stretch', justifyContent: 'center' }}>
              <canvas ref={cvsRef} {...wellProps} style={{ display: 'block', touchAction: 'none', cursor: started ? 'grab' : 'default' }} />
              <aside className="bl-ladder" style={{ width: 132, flex: 'none', borderLeft: `1px solid ${COLORS.line}`, paddingLeft: 11, display: 'flex', flexDirection: 'column' }}>
                <div style={{ margin: '0 0 7px', fontSize: 8.5, letterSpacing: '0.13em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800 }}>Today&rsquo;s board</div>
                {ladder.rows.map((r) => (r.gap ? (
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
                <div style={{ marginTop: 'auto', paddingTop: 9, borderTop: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{nf(rowsCleared)}<em style={{ fontStyle: 'normal', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}> row{rowsCleared === 1 ? '' : 's'}</em></div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: '#94a3b8', marginTop: 3 }}>par {nf(PAR)}</div>
                </div>
              </aside>
            </div>

            <div className="bl-strip" style={{ display: 'none', marginTop: 10, paddingTop: 9, borderTop: `1px solid ${COLORS.line}`, alignItems: 'center', gap: 10, fontSize: 11.5, color: FADED }}>
              <span style={{ fontWeight: 800, color: ACC_INK }}>You #{ladder.rank}</span>
              <span>par {nf(PAR)} rows</span>
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

      <style>{`
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
        @media (max-width: 640px) {
          .bl-ladder { display: none !important; }
          .bl-strip { display: flex !important; }
          .bl-keys { display: none !important; }
          .bl-touchhint { display: block !important; }
          .bl-dock { margin-top: 10px; }
          .bl-pad { grid-template-columns: repeat(3, 64px); gap: 8px; }
          .bl-pad button { height: 58px !important; }
        }
      `}</style>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
