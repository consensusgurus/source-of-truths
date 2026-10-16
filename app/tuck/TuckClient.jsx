'use client';

// Tuck — the daily tile-tucking word puzzle.
//
// Everyone gets the same 14 letters (15 in the Sunday Edition; a Scrabble-weighted rack, banked in
// app/tuck/puzzles.js). Build your own interlocking crossword on a 9×9 board:
// every run of 2+ letters must be a dictionary word, and everything must
// connect into one grid. Score = the Scrabble points of every word you form
// (letters at intersections count in BOTH words), +10 for tucking in the whole rack
// letters. Each rack ships with a BENCHMARK — beat it. It is a mark to beat
// rather than an average round, so it is not called par. From 2026-08-10 it is
// CALIBRATED to how players actually score on that rack (round(1.06 x the
// solver's best line), fitted to a ~37% win rate), because the solver builds
// only one shape and real players out-scored it by 10 to 22 points. See the
// header of app/tuck/puzzles.js.
//
// ONE SHOT COUNTS (owner ruling 2026-07-18): you can rebuild all you like
// before submitting, but only your first submitted grid ranks on the daily
// board. After submitting you can keep tinkering — sandbox only.
//
// The dictionary is fetched once as a static asset, never bundled, and comes
// in three files: public/tuck-dict.txt (2-8 letters, also the corpus the bank
// verifiers reason over, so frozen), public/tuck-dict-long.txt (9-15), and
// public/tuck-dict-extra.txt (ordinary short words the base list's rude-word
// screen removed, KNOB and PAWN among them). A 14-tile rack can spell a 9+
// letter run and the base list alone called every one of them invalid until
// 2026-08-09. See lib/rack-dict.js.
//
// The BENCHMARK solver in scripts/verify-tuck.mjs still searches 2-8 letter
// words only, deliberately: every banked benchmark was scored over that list
// and a benchmark is a mark to BEAT, so a wider player dictionary leaves each
// one reachable. Widening the solver would rewrite played boards.
//
// Same daily plumbing as Circa/Suds/Stet: banked racks gated by Eastern date
// on the server (app/tuck/page.js), per-puzzle localStorage saves, /tuck?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Shuffle, Eraser, Trash2, CheckCircle2 } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { isMobileDevice } from '@/lib/is-mobile';
import { loadRackDict } from '@/lib/rack-dict';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
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
import DailyRules from '../DailyRules';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#92400e',        // Tuck identity — tile-rack umber
  accentSoft: '#f5e9dc',
  green: T.successDeep,
  tile: '#f7edda',
};
// Tuck's tiles are ivory pieces, a physical object, so they keep these fixed
// values on both stage registers. The edge carries the 3:1 boundary on either
// ground; letters, points, the crossing dot and the bad-word red all clear 4.5:1
// on the face.
const TILE = {
  face: '#e6dcc8',
  edge: '#9c8a66',
  ink: '#1a1408',
  pts: '#5c4a26',
  dot: '#1a64a8',
  badFace: '#f6dcd6',
  bad: '#a31d12',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_tuck_help_seen';
const STATS_KEY = 'sot_tuck_stats';
const SIZE = 9;
const PTS = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10 };

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

// ─── Personal stats + streak (localStorage), Circa/Suds pattern ─────────────
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
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * (p.benchmark || 50)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: p.benchmark || 50, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function emptyGrid() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(null)); }
function freshState() {
  return {
    v: 1,
    grid: emptyGrid(),
    status: 'playing',          // playing | done (done = score submitted)
    submitted: null,            // { score, placed } once submitted
    t0: null,
    tEnd: null,
  };
}

export default function TuckClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_tuck_${PUZZLE.num}`;
  const TRAY = PUZZLE.letters;
  const BENCH = PUZZLE.benchmark;
  // Rack size is DATA, never a literal: weekdays deal 14 letters, the Sunday
  // Edition deals 15. Every count below derives from this.
  const RACK = PUZZLE.letters.length;

  const [g, setG] = useState(freshState);
  const [dict, setDict] = useState(null);          // Set of lowercase words
  const [dictErr, setDictErr] = useState(false);
  const [sel, setSel] = useState(null);            // { r, c }
  const [dir, setDir] = useState('h');
  const [armed, setArmed] = useState(null);        // armed tray letter
  const [erase, setErase] = useState(false);       // take-back mode: tap a placed tile to pull it back to the rack
  const [tapSeq, setTapSeq] = useState(0);          // consecutive taps on the selected cell; 3rd tap on a filled cell takes it back
  const [confirming, setConfirming] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact start card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // eslint-disable-next-line no-unused-vars -- the player chip moved into
  // DailyChrome (QuizNavHeader fetches its own identity); the fetch below
  // stays for the cross-device stats merge.
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const gridRef = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('tuck');
  const STAGE = isStage('tuck', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('tuck');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('tuck');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('tuck'), '--stg-acc-lt': gameColorLight('tuck'), '--stg-onramp-lt': gameOnrampLight('tuck'), '--stg-acc-ink-lt': gameAccentInkLight('tuck') };
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
  const preStart = playing && !g.t0;   // not begun: show the start tile where the board goes
  const started = playing && !!g.t0;    // clock running: show the board
  const focusMode = playing && !showChrome;

  // ---- dictionary (static assets, fetched once) ----
  useEffect(() => {
    let alive = true;
    loadRackDict()
      .then((d) => { if (alive) setDict(d); })
      .catch(() => { if (alive) setDictErr(true); });
    return () => { alive = false; };
  }, []);

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
        if (saved && saved.v === 1 && Array.isArray(saved.grid)) setG({ ...freshState(), ...saved });
      }
      // The start tile shows in place of the board until the player begins (t0 set
      // on Start). First-timers see the full rules on the tile; a returning player
      // gets the compact start card with a "Show instructions" toggle.
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_tuck_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_tuck_day'); })();
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

  // ---- metrics + leaderboard (same /api/quiz/* flow as every other board) ----
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
            if (d && Array.isArray(d.recent)) {
              setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
            }
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
  const iq = useIqStanding({ game: 'tuck', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'tuck', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'tuck', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'tuck', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'tuck', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // ─── grid derivations (pure, recomputed each render) ──────────────────────
  const grid = g.grid;
  const runs = useMemo(() => {
    const out = [];
    for (let r = 0; r < SIZE; r++) {
      let c = 0;
      while (c < SIZE) {
        if (grid[r][c]) {
          const s = c;
          while (c < SIZE && grid[r][c]) c++;
          if (c - s > 1) out.push({ word: grid[r].slice(s, c).join(''), cells: Array.from({ length: c - s }, (_, i) => [r, s + i]) });
        } else c++;
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let r = 0;
      while (r < SIZE) {
        if (grid[r][c]) {
          const s = r;
          while (r < SIZE && grid[r][c]) r++;
          if (r - s > 1) { let w = ''; for (let i = s; i < r; i++) w += grid[i][c]; out.push({ word: w, cells: Array.from({ length: r - s }, (_, i) => [s + i, c]) }); }
        } else r++;
      }
    }
    return out;
  }, [grid]);

  const placedCount = useMemo(() => grid.flat().filter(Boolean).length, [grid]);
  const connected = useMemo(() => {
    const placed = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) placed.push([r, c]);
    if (placed.length === 0) return true;
    const seen = new Set([placed[0].join(',')]);
    const q = [placed[0]];
    while (q.length) {
      const [r, c] = q.pop();
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc] && !seen.has(`${nr},${nc}`)) { seen.add(`${nr},${nc}`); q.push([nr, nc]); }
      }
    }
    return seen.size === placed.length;
  }, [grid]);

  const badCells = useMemo(() => {
    const bad = new Set();
    if (!dict) return bad;
    for (const x of runs) { if (!dict.has(x.word.toLowerCase())) x.cells.forEach(([r, c]) => bad.add(`${r},${c}`)); }
    return bad;
  }, [runs, dict]);
  const allValid = dict ? runs.every((x) => dict.has(x.word.toLowerCase())) : false;
  const stray = placedCount > 0 && runs.length === 0;
  // every placed tile must be part of at least one run (no floating singles)
  const inRun = useMemo(() => {
    const s = new Set();
    for (const x of runs) x.cells.forEach(([r, c]) => s.add(`${r},${c}`));
    return s;
  }, [runs]);
  const loneTiles = useMemo(() => {
    let n = 0;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] && !inRun.has(`${r},${c}`)) n++;
    return n;
  }, [grid, inRun]);
  const isValid = allValid && connected && runs.length > 0 && loneTiles === 0;
  const liveScore = useMemo(() => {
    if (!isValid) return 0;
    let s = 0;
    for (const x of runs) for (const ch of x.word) s += PTS[ch];
    if (placedCount === RACK) s += 10;
    return s;
  }, [isValid, runs, placedCount]);

  // Record an in-progress puzzle if the player interacts then leaves before
  // submitting. Loading the page does NOT count; the first tile placed sets
  // g.t0, which is the "started" signal here. On exit we post the current
  // partial score as a normal result (the server clamps the time), so every
  // started puzzle lands in the stats even when abandoned. A localStorage marker
  // stops a resume-then-leave-again cycle from posting the same abandon twice;
  // markFlushed() in submitScore suppresses the post when the puzzle is finished.
  const REC_KEY = `sot_tuck_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually places a tile. Merely opening the
    // puzzle and dismissing the start gate does not log a partial-score attempt.
    const acted = placedCount > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: liveScore, total: BENCH, correct: liveScore >= BENCH ? 1 : 0, guessesUsed: RACK - placedCount, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  const availCounts = useMemo(() => {
    const m = {};
    for (const l of TRAY) m[l] = (m[l] || 0) + 1;
    for (const row of grid) for (const x of row) if (x) m[x] = (m[x] || 0) - 1;
    return m;
  }, [TRAY, grid]);

  function startClock() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); }
  // Pressing Start begins the clock (sets t0) and marks the rules as seen.
  // A no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    startClock();
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function setCell(r, c, val) {
    setG((cur) => {
      const grid2 = cur.grid.map((row) => row.slice());
      grid2[r][c] = val;
      return { ...cur, grid: grid2, t0: cur.t0 || Date.now() };
    });
  }

  function onCell(r, c) {
    if (erase) {
      if (grid[r][c]) { setCell(r, c, null); setSel({ r, c }); }
      else setSel({ r, c });
      setTapSeq(0);
      return;
    }
    if (armed !== null) {
      if ((availCounts[armed] || 0) > 0) {
        setCell(r, c, armed);
        setArmed(null);
        setSel({ r, c });
        setTapSeq(0);
        advanceFrom(r, c);
        return;
      }
      setArmed(null);
    }
    if (sel && sel.r === r && sel.c === c) {
      // Taps on the already-selected cell cycle: 1 select, 2 flip direction,
      // 3 take a placed tile back to the rack (empty cells just keep flipping).
      const nextSeq = tapSeq + 1;
      if (grid[r][c] && nextSeq >= 3) { setCell(r, c, null); setTapSeq(0); return; }
      setDir((d) => (d === 'h' ? 'v' : 'h'));
      setTapSeq(nextSeq);
    } else { setSel({ r, c }); setTapSeq(1); }
  }
  function advanceFrom(r, c) {
    setSel((cur) => {
      if (!cur) return cur;
      if (dir === 'h' && c < SIZE - 1) return { r, c: c + 1 };
      if (dir === 'v' && r < SIZE - 1) return { r: r + 1, c };
      return { r, c };
    });
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!sel) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const { r, c } = sel;
      setTapSeq(0);
      if (e.key === ' ') { setDir((d) => (d === 'h' ? 'v' : 'h')); e.preventDefault(); return; }
      if (e.key === 'ArrowRight' && c < SIZE - 1) { setSel({ r, c: c + 1 }); e.preventDefault(); return; }
      if (e.key === 'ArrowLeft' && c > 0) { setSel({ r, c: c - 1 }); e.preventDefault(); return; }
      if (e.key === 'ArrowDown' && r < SIZE - 1) { setSel({ r: r + 1, c }); e.preventDefault(); return; }
      if (e.key === 'ArrowUp' && r > 0) { setSel({ r: r - 1, c }); e.preventDefault(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (grid[r][c]) setCell(r, c, null);
        else {
          let nr = r, nc = c;
          if (dir === 'h' && c > 0) nc = c - 1;
          else if (dir === 'v' && r > 0) nr = r - 1;
          setCell(nr, nc, null);
          setSel({ r: nr, c: nc });
        }
        e.preventDefault();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const L = e.key.toUpperCase();
        const cur = grid[r][c];
        const extra = cur === L ? 1 : 0;
        if ((availCounts[L] || 0) + extra > 0) {
          setCell(r, c, L);
          advanceFrom(r, c);
        } else {
          say(`No ${L} left in your rack`);
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, dir, grid, availCounts]);

  function clearGrid() {
    setG((cur) => ({ ...cur, grid: emptyGrid() }));
    setConfirming(false);
  }

  function postResult(g2, sc, placed) {
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: BENCH, g: RACK - placed, won: sc >= BENCH })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // total = the day's BENCHMARK (uniform for everyone, so the combined board's
        // completion normalization is stable); guessesUsed = unused letters, so
        // ties break toward the fuller rack.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: BENCH, correct: sc >= BENCH ? 1 : 0, guessesUsed: RACK - placed, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function submitScore() {
    if (!playing || !isValid || liveScore <= 0) return;
    if (!confirming) { setConfirming(true); return; }
    abandon.markFlushed();
    const g2 = { ...g, status: 'done', submitted: { score: liveScore, placed: placedCount }, tEnd: Date.now(), t0: g.t0 || Date.now() };
    setG(g2);
    setConfirming(false);
    setEndClosed(false);
    postResult(g2, liveScore, placedCount);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setSel(null); setArmed(null); setConfirming(false); setEndClosed(false);
  }

  const finalScore = g.submitted ? g.submitted.score : 0;
  const won = g.status === 'done' && finalScore >= BENCH;

  // ---- share art: a five-square score bar against the benchmark, no board shape ----
  // The old version printed the finished board's footprint. Everyone plays the
  // same rack and the day's high score wins, so that handed anyone who had not
  // played yet the geometry that scored. Never share the board shape here.
  function shareArt() {
    const g5 = finalScore <= 0 ? 0 : Math.max(1, Math.min(5, Math.round((finalScore / BENCH) * 5)));
    return '🟨'.repeat(g5) + '⬜'.repeat(5 - g5) + '\n';
  }
  function copyShare() {
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const text = playing
      ? `Tuck #${PUZZLE.num}: tuck ${RACK} letters into one grid. The benchmark is ${BENCH}.\n${withRef(`mindloftdaily.com/tuck${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Tuck #${PUZZLE.num} · ${finalScore} pts (benchmark ${BENCH})${finalScore >= BENCH ? ' · beat the benchmark' : ''}${streakBit}\n${shareArt()}${withRef(`mindloftdaily.com/tuck${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
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

  // tray render bookkeeping: mark used tiles
  const trayFlags = useMemo(() => {
    const placedOf = {};
    for (const row of grid) for (const x of row) if (x) placedOf[x] = (placedOf[x] || 0) + 1;
    const seenOf = {};
    return TRAY.map((l) => {
      seenOf[l] = (seenOf[l] || 0) + 1;
      const total = TRAY.filter((x) => x === l).length;
      const used = seenOf[l] > total - (placedOf[l] || 0);
      return { l, used };
    });
  }, [TRAY, grid]);

  const statusLine = (() => {
    if (erase && placedCount > 0) return { msg: 'Take-back mode: tap any tile to send it back to your rack.', cls: 'muted' };
    if (!dict && !dictErr) return { msg: 'Loading the dictionary…', cls: 'muted' };
    if (dictErr) return { msg: 'Could not load the dictionary. Refresh to try again.', cls: 'bad' };
    if (placedCount === 0) return { msg: 'Tap a square (or a rack tile), then type. Space flips direction ➜ / ⬇', cls: 'muted' };
    if (!allValid) return { msg: 'Red runs aren’t words yet', cls: 'bad' };
    if (stray || loneTiles > 0) return { msg: 'Single letters need to join a word', cls: 'bad' };
    if (!connected) return { msg: 'Valid words, but everything must connect into one grid', cls: 'bad' };
    if (placedCount === RACK) return { msg: `Perfect tuck! All ${RACK} letters placed. Rebuild for more, or submit.`, cls: 'good' };
    return { msg: 'Valid grid! Keep tucking letters in.', cls: 'good' };
  })();

  // Board readouts. Every one is derived from the grid already on screen.
  const shownScore = playing ? liveScore : finalScore;
  const meterMax = Math.max(1, Math.round(BENCH * 1.25));
  const pctOf = (v) => Math.max(0, Math.min(100, (v / meterMax) * 100));
  const bonusOpen = playing && placedCount < RACK;
  const runDir = (x) => (x.cells.length > 1 && x.cells[0][0] === x.cells[1][0] ? 'Across' : 'Down');
  const runPts = (x) => [...x.word].reduce((n, ch) => n + (PTS[ch] || 0), 0);
  const crossCells = (() => {
    const across = new Set(), down = new Set(), both = new Set();
    for (const x of runs) {
      const into = runDir(x) === 'Across' ? across : down;
      x.cells.forEach(([r, c]) => into.add(`${r},${c}`));
    }
    for (const k of across) if (down.has(k)) both.add(k);
    return both;
  })();
  const crossNote = (() => {
    const ls = [...crossCells].map((k) => { const [r, c] = k.split(',').map(Number); return grid[r][c]; }).filter(Boolean);
    if (!ls.length) return '';
    if (ls.length > 4) return 'Each of those letters is counted twice.';
    const named = ls.map((l) => `the ${l}`);
    const list = named.length === 1 ? named[0] : `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}`;
    return `${list.charAt(0).toUpperCase()}${list.slice(1)} ${ls.length === 1 ? 'is' : 'are'} counted twice.`;
  })();

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={<>Everyone gets the same <b>{RACK} letters</b>. Build your own little crossword with them.</>}
      banner={<>Today&rsquo;s <b>benchmark: {BENCH}</b>. It is set from how players really score on this rack, so it is beatable, but not by much less than your best.</>}
      steps={[
        <>Tap a square and type, or tap a rack tile then a square. <b>Space</b> flips the typing direction.</>,
        <>Every run of two or more letters must be a <b>real word</b>, across and down, and everything must connect into <b>one grid</b>.</>,
        <>To pull tiles back, tap <b>Take back</b> then tap any placed tile, triple-tap a placed tile (select, flip, remove), or press <b>Backspace</b> on a selected square.</>,
        <>Rebuild as much as you like, but <b>one shot counts</b>: only your first submitted grid ranks on the daily board.</>,
      ]}
      knack="A letter at an intersection counts in both of its words, so crossing your heavy tiles is worth more than lining them up."
      footer={`Standard tile points across all your words, plus 10 for tucking in all ${RACK} tiles. Ties break by fewest unused tiles, then fastest clock.`}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="tuck" name="Tuck" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="tuck" quizId={PUZZLE.quizId}
          name="Tuck"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: BENCH, k: 'benchmark' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: BENCH, k: 'benchmark' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="tk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.tk-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .tk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .tk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .tk-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));color:var(--stg-onramp, var(--white));}
          .tk-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, #7c3609) 86%, var(--stg-ink, var(--white)));}
          .tk-btn:disabled{opacity:0.45;cursor:default;}
          .tk-btn.big{min-height:48px;border-radius:12px;border-width:1.5px;padding:0 16px;font-size:14px;font-weight:700;justify-content:center;}
          .tk-btn.big.primary{font-weight:800;font-size:15px;padding:0 22px;}
          .tk-lab{font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${FADED};}
          .tk-lab b{color:${INK};font-size:14px;font-weight:800;letter-spacing:0;font-variant-numeric:tabular-nums;}
          .tk-band{display:flex;align-items:center;gap:22px;margin-bottom:16px;}
          .tk-score{font-size:40px;font-weight:800;line-height:1.05;color:${INK};font-variant-numeric:tabular-nums;}
          .tk-meter{position:relative;height:26px;}
          .tk-meter .trk{position:absolute;left:0;right:0;top:8px;height:12px;border-radius:6px;background:${STAGE ? 'var(--stg-cell)' : '#efe7d8'};box-shadow:inset 0 0 0 1px ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.3)'};}
          .tk-meter .fill{position:absolute;left:0;top:8px;height:12px;border-radius:6px;background:var(--stg-acc, ${COLORS.accent});}
          .tk-meter .bonus{position:absolute;top:8px;height:12px;box-sizing:border-box;border:1.5px dashed var(--stg-acc-ink, ${COLORS.accent});border-left:0;border-radius:0 6px 6px 0;}
          .tk-meter .mark{position:absolute;top:0;width:3px;height:26px;margin-left:-1px;border-radius:2px;background:${INK};}
          .tk-play{display:flex;gap:22px;align-items:flex-start;}
          .tk-boardcol{flex:0 1 452px;min-width:0;}
          .tk-grid{display:grid;grid-template-columns:repeat(${SIZE},1fr);gap:4px;background:${STAGE ? 'var(--stg-surf)' : '#efe7d8'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:16px;padding:12px;max-width:452px;width:100%;box-sizing:border-box;}
          .tk-cell{position:relative;aspect-ratio:1;box-sizing:border-box;background:var(--stg-cell, #fbf9f4);border:1px solid var(--stg-cell-line, rgba(28,30,36,0.3));border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:clamp(15px,3.6vw,22px);color:${INK};cursor:pointer;user-select:none;}
          /* Placed tiles are ivory pieces, a physical object with fixed colours that read on both grounds. */
          .tk-cell.filled{background:${TILE.face};border-color:${TILE.edge};box-shadow:inset 0 -3px 0 ${TILE.edge};color:${TILE.ink};}
          .tk-cell.badword{background:${TILE.badFace};border-color:${TILE.bad};box-shadow:inset 0 -3px 0 ${TILE.bad};color:${TILE.bad};}
          .tk-cell .pts{position:absolute;right:4px;bottom:2px;font-size:10px;font-weight:800;line-height:1;color:${TILE.pts};}
          .tk-cell.badword .pts{color:${TILE.bad};}
          .tk-cell .xdot{position:absolute;left:4px;top:4px;width:7px;height:7px;border-radius:4px;background:${TILE.dot};}
          .tk-cell.sel{border:2px solid var(--stg-acc-ink, ${COLORS.accent});}
          .tk-cell.filled.sel,.tk-cell.badword.sel{outline:2.5px solid var(--stg-acc-ink, ${COLORS.accent});outline-offset:1px;z-index:1;}
          .tk-dir{position:absolute;right:2px;bottom:1px;line-height:0;color:var(--stg-acc-ink, ${COLORS.accent});}
          .tk-cell.filled .tk-dir,.tk-cell.badword .tk-dir{display:none;}
          .tk-side{flex:1 1 180px;min-width:170px;display:flex;flex-direction:column;gap:8px;align-self:flex-start;max-height:452px;}
          /* WORDS FORMED IS A COMPACT LIST (owner, 2026-10-10): one line a word, scrolling inside the
             board's height, so a long game never grows the column and pushes the rack down. */
          .tk-wlist{display:flex;flex-direction:column;min-height:0;overflow-y:auto;border-radius:10px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));scrollbar-width:thin;}
          .tk-wrow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:baseline;gap:8px;padding:5px 10px;border-top:1px solid var(--stg-line, rgba(28,30,36,0.1));}
          .tk-wrow:first-child{border-top:0;}
          .tk-wrow .w{font-size:13px;font-weight:800;letter-spacing:0.06em;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .tk-wrow .w u{text-decoration:none;box-shadow:inset 0 -2px 0 ${TILE.dot};}
          .tk-wrow .d{font-size:10.5px;font-weight:700;color:${FADED};text-transform:uppercase;letter-spacing:0.08em;}
          .tk-wrow .p{font-size:14px;font-weight:800;color:${ACC_INK};font-variant-numeric:tabular-nums;min-width:22px;text-align:right;}
          .tk-wrow.bad .w,.tk-wrow.bad .p{color:var(--stg-bad, ${COLORS.rust});}
          .tk-wcard{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));}
          .tk-mini{position:relative;width:28px;height:30px;box-sizing:border-box;border-radius:5px;background:${TILE.face};border:1px solid ${TILE.edge};box-shadow:inset 0 -2px 0 ${TILE.edge};color:${TILE.ink};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;}
          .tk-mini .pts{position:absolute;right:2px;bottom:1px;font-size:8px;font-weight:800;line-height:1;color:${TILE.pts};}
          .tk-mini .xdot{position:absolute;left:3px;top:3px;width:5px;height:5px;border-radius:3px;background:${TILE.dot};}
          .tk-chips{display:none;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;}
          .tk-wchip{display:inline-flex;align-items:center;gap:6px;border-radius:9px;padding:6px 10px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));font-size:14px;font-weight:800;letter-spacing:0.04em;color:${INK};}
          .tk-wchip b{font-size:13px;letter-spacing:0;color:${ACC_INK};}
          .tk-wchip.invalid{color:var(--stg-bad, ${COLORS.rust});border-color:var(--stg-bad, ${COLORS.rust});}
          .tk-legend{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:${FADED};}
          .tk-legend i{position:relative;flex:0 0 auto;width:16px;height:16px;box-sizing:border-box;border-radius:3px;background:${TILE.face};border:1px solid ${TILE.edge};}
          .tk-legend i::after{content:"";position:absolute;left:2px;top:2px;width:5px;height:5px;border-radius:3px;background:${TILE.dot};}
          .tk-rackhd{display:flex;justify-content:space-between;align-items:baseline;padding:0 2px 6px;}
          .tk-tray{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:10px 12px 12px;border-radius:12px 12px 4px 4px;background:${STAGE ? 'var(--stg-surf2)' : '#efe7d8'};border-bottom:6px solid ${STAGE ? 'var(--stg-line3)' : 'rgba(28,30,36,0.3)'};}
          .tk-trayrow{display:flex;gap:6px;justify-content:center;}
          .tk-tile{position:relative;width:40px;height:46px;box-sizing:border-box;background:${TILE.face};border:1px solid ${TILE.edge};border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:${TILE.ink};cursor:pointer;user-select:none;box-shadow:inset 0 -4px 0 ${TILE.edge};}
          .tk-tile .pts{position:absolute;right:3px;bottom:3px;font-size:9px;font-weight:800;line-height:1;color:${TILE.pts};}
          .tk-tile.used{background:transparent;border:1.5px dashed var(--stg-cell-line, rgba(28,30,36,0.3));box-shadow:none;color:${FADED};cursor:default;}
          .tk-tile.used .pts{color:${FADED};}
          .tk-tile.armed{outline:2.5px solid var(--stg-acc-ink, ${COLORS.accent});outline-offset:2px;}
          .tk-status{font-size:13px;font-weight:700;min-height:18px;}
          .tk-status.bad{color:var(--stg-bad, ${COLORS.rust});}
          .tk-status.good{color:${INK};}
          .tk-status.muted{color:${FADED};}
          .tk-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px;}
          .tk-ph{display:none;}
          @media(max-width:640px){
            .tk-dk{display:none !important;}
            .tk-ph{display:inline;}
            .tk-band{gap:14px;margin-bottom:12px;}
            .tk-score{font-size:32px;}
            .tk-lab{font-size:10px;}
            .tk-lab b{font-size:13px;}
            .tk-meter{height:24px;}
            .tk-meter .trk,.tk-meter .fill,.tk-meter .bonus{top:7px;height:10px;}
            .tk-meter .mark{height:24px;}
            .tk-play{display:block;}
            .tk-grid{gap:3px;padding:6px;border-radius:12px;margin:0 auto;}
            .tk-cell{border-radius:5px;font-size:clamp(14px,4.6vw,18px);}
            .tk-cell .pts{right:2px;bottom:1px;font-size:8px;}
            .tk-cell .xdot{left:3px;top:3px;width:5px;height:5px;}
            .tk-side{display:none;}
            .tk-chips{display:flex;}
            .tk-tray{flex-direction:column;align-items:center;padding:8px 6px 10px;}
            .tk-tile{width:44px;height:48px;border-radius:8px;font-size:21px;}
            .tk-tile .pts{right:4px;}
            .tk-actions{flex-wrap:nowrap;gap:8px;}
            .tk-actions .tk-btn.big{flex:1 1 0;min-height:50px;padding:0 8px;}
            .tk-actions .tk-btn.big.primary{flex:1.5 1 0;}
            .tk-actions .tk-ico{display:none;}
          }
        ` }} />

        <div style={{ maxWidth: 700, margin: '0 auto' }}>


        {/* masthead */}
        {!LOFT && (
        <DailyMasthead
          slug="tuck"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={10}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 15 letters</span>}
          blocks={'TUCK'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

        {/* start tile — sits where the board goes; the rack stays sealed
            until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', maxWidth: 432, margin: '0 auto 4px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Tuck is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Everyone gets the same rack of {RACK} letters to tuck into one interlocking crossword. Your board waits until you begin.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="tk-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* score band: the score, a meter to the benchmark, what is left to beat */}
        {!preStart && (
        <div className="tk-band">
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 56 }}>
            <span className="tk-lab">Score</span>
            <span className="tk-score">{shownScore}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="tk-meter" role="img" aria-label={`Score ${shownScore} against a benchmark of ${BENCH}`}>
              <span className="trk" />
              {shownScore > 0 && <span className="fill" style={{ width: `${pctOf(shownScore)}%` }} />}
              {bonusOpen && <span className="bonus" style={{ left: `${pctOf(shownScore)}%`, width: `${Math.max(0, pctOf(shownScore + 10) - pctOf(shownScore))}%` }} />}
              <span className="mark" style={{ left: `${pctOf(BENCH)}%` }} />
            </div>
            <div className="tk-lab" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: ACC_INK, visibility: bonusOpen ? 'visible' : 'hidden' }}>+10 all tiles</span>
              <span style={{ color: INK }}>Benchmark {BENCH}</span>
            </div>
          </div>
          <div className="tk-dk" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 74 }}>
            <span className="tk-lab">{shownScore >= BENCH ? 'Above by' : 'To beat'}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: ACC_INK, fontVariantNumeric: 'tabular-nums' }}>{shownScore >= BENCH ? `+${shownScore - BENCH}` : BENCH - shownScore}</span>
          </div>
        </div>
        )}
        {!preStart && !playing && (
          <div className="tk-lab" style={{ margin: '-6px 0 12px', color: INK }}>Score submitted. The board is a sandbox now.</div>
        )}

        {!preStart && (
        <>
        <div className="tk-play">
          <div className="tk-boardcol">
            <div className="tk-grid" ref={gridRef} role="grid" aria-label="Tuck board">
              {Array.from({ length: SIZE * SIZE }, (_, i) => {
                const r = Math.floor(i / SIZE), c = i % SIZE;
                const v = grid[r][c];
                const isSel = sel && sel.r === r && sel.c === c;
                const key = `${r},${c}`;
                return (
                  <div
                    key={i}
                    className={`tk-cell${v ? ' filled' : ''}${badCells.has(key) ? ' badword' : ''}${isSel ? ' sel' : ''}`}
                    onClick={() => onCell(r, c)}
                    role="gridcell"
                    aria-label={`Row ${r + 1} column ${c + 1}${v ? `: ${v}` : ''}`}
                  >
                    {v || ''}
                    {v && <span className="pts">{PTS[v]}</span>}
                    {v && crossCells.has(key) && <span className="xdot" />}
                    {isSel && (
                      <span className="tk-dir" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === 'h' ? undefined : 'rotate(90deg)' }}><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* words formed (desktop column) */}
          <div className="tk-side">
            <span className="tk-lab">Words formed &middot; {runs.length}</span>
            {runs.length ? (
              <div className="tk-wlist">
                {runs.map((x, i) => {
                  const ok = !dict || dict.has(x.word.toLowerCase());
                  return (
                    <div key={i} className={`tk-wrow${ok ? '' : ' bad'}`} title={ok ? undefined : 'Not a word'}>
                      <span className="w">{x.cells.map(([r, c], j) => (crossCells.has(`${r},${c}`) ? <u key={j}>{grid[r][c]}</u> : <span key={j}>{grid[r][c]}</span>))}{ok ? '' : ' ?'}</span>
                      <span className="d">{runDir(x)}</span>
                      <span className="p">{runPts(x)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <span style={{ fontSize: 12, fontWeight: 600, color: FADED }}>No words yet.</span>}
            {crossCells.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span className="tk-legend"><i /></span>
                <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: FADED }}>A crossing tile, dotted on the board and underlined in the list, scores in both of its words. {crossNote}</span>
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: FADED }}>
              Every run of 2 or more letters must be a word, across and down, all in one grid. Crossings score in both words. All {RACK} tiles placed is +10.
            </span>
          </div>
        </div>

        {/* words formed (phone chips) */}
        <div className="tk-chips">
          {runs.map((x, i) => {
            const ok = !dict || dict.has(x.word.toLowerCase());
            return <span key={i} className={`tk-wchip${ok ? '' : ' invalid'}`}>{x.word}{ok ? '' : ' ?'}<b>{runPts(x)}</b></span>;
          })}
          {crossCells.size > 0 && <span className="tk-legend"><i />crossing counts twice</span>}
          {!runs.length && <span style={{ fontSize: 12, fontWeight: 600, color: FADED }}>Every run of 2 or more letters must be a word, across and down, all in one grid.</span>}
        </div>

        {/* rack */}
        <div style={{ marginTop: 16 }}>
          <div className="tk-rackhd">
            <span className="tk-lab">Your rack<span className="tk-dk"> &middot; {RACK} letters</span></span>
            <span className="tk-lab"><span className="tk-dk">Tiles placed</span><span className="tk-ph">Placed</span> <b>{placedCount}</b>/{RACK}</span>
          </div>
          <div className="tk-tray">
            {[trayFlags.slice(0, Math.ceil(RACK / 2)), trayFlags.slice(Math.ceil(RACK / 2))].map((row, ri) => (
              <div key={ri} className="tk-trayrow">
                {row.map((t, j) => {
                  const i = ri === 0 ? j : Math.ceil(RACK / 2) + j;
                  return (
                    <div
                      key={i}
                      className={`tk-tile${t.used ? ' used' : ''}${armed === t.l && !t.used ? ' armed' : ''}`}
                      onClick={() => { if ((availCounts[t.l] || 0) > 0) { startClock(); setErase(false); setArmed((a) => (a === t.l ? null : t.l)); } }}
                      role="button"
                      aria-label={`Tile ${t.l}, ${PTS[t.l]} points${t.used ? ', used' : ''}`}
                    >
                      {t.l}<span className="pts">{PTS[t.l]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, textAlign: 'center' }}>
          {statusLine.cls === 'good' && <CheckCircle2 size={16} strokeWidth={2.6} aria-hidden="true" style={{ flex: '0 0 auto', color: 'var(--stg-good, #15803d)' }} />}
          <span className={`tk-status ${statusLine.cls}`}>{statusLine.msg}</span>
        </div>

        <div className="tk-actions">
          {playing && (
            <button
              type="button"
              className={`tk-btn big${erase ? ' primary' : ''}`}
              aria-pressed={erase}
              disabled={placedCount === 0 && !erase}
              onClick={() => { setErase((v) => !v); setArmed(null); }}
            >
              <Eraser size={16} className="tk-ico" /> {erase ? 'Tap tiles to remove' : 'Take back'}
            </button>
          )}
          <button type="button" className="tk-btn big" onClick={clearGrid}><Trash2 size={16} className="tk-ico" /> Clear all</button>
          {playing && (
            <button
              type="button"
              className="tk-btn big primary"
              disabled={!isValid || liveScore <= 0 || !dict}
              onClick={submitScore}
            >
              <CheckCircle2 size={16} strokeWidth={2.6} className="tk-ico" /> {confirming ? `Submit ${liveScore} pts, sure?` : 'Submit score'}
            </button>
          )}
        </div>
        {confirming && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <button type="button" className="tk-btn big" onClick={() => setConfirming(false)}>Keep building</button>
          </div>
        )}
        {playing && (
          <div style={{ fontSize: 12, fontWeight: 600, color: FADED, textAlign: 'center', marginTop: 10, lineHeight: 1.45 }}>
            One shot counts: only your first submitted grid ranks on the daily board.
          </div>
        )}
        </>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '16px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{finalScore}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {won ? `Beat the benchmark of ${BENCH}. The desk tips its cap.` : `Submitted against a benchmark of ${BENCH}.`}
                    {' '}{g.submitted ? `${g.submitted.placed}/${RACK} tiles.` : ''}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>A fresh rack in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A fresh rack lands at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/tuck?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s rack &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/tuck" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Tuck &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
                  </>
                )}
              </p>
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Tuck"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={g.submitted ? finalScore : null}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${BENCH} benchmark \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Tuck all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Unused"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/tuck?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                // Tuck stores no solution grid (only the benchmark figure), so there
                // is no answer to reveal: this is always a return to the board
                // (owner, 2026-10-13).
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Tuck', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/tuck?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="tuck" name="Tuck" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="tuck" name="Tuck" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="tuck"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="tuck" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Tuck to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s rack, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s rack, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 640 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
        </div>
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="tuck"
          won={won}
          completed
          score={<>{finalScore} pts &middot; benchmark {BENCH}</>}
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

      {/* help modal */}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="tk-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Tuck — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Tuck</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Tuck is a free daily word puzzle from Mind Loft, the tile-tucking puzzle. Every player in the world gets the same rack of 14 standard-weighted letters (15 in the Sunday Edition) and an empty 9&times;9 board. There is no answer to find: you design your own interlocking grid, and the score-chasing is the puzzle. Long words, tight crossings, and premium letters at intersections all push the number up.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every run of two or more letters must be a dictionary word, across and down, and the whole build must connect into one grid. Letters at intersections score in both words, and placing every tile in the rack earns a 10-point bonus. Each day ships with a benchmark set from how players actually score on that rack, beat it and the day counts as a win. Roughly a third of finished grids do. Only your first submitted grid ranks on the daily leaderboard, so make it count.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A fresh rack lands every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our unscrambling puzzle, and <a href="/stet" style={{ color: INK, fontWeight: 800 }}>Stet</a>, our copy-desk puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
