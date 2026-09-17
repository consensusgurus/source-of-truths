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
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
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
      ? `Tuck #${PUZZLE.num} — tuck ${RACK} letters into one grid. The benchmark is ${BENCH}.\n${withRef(`mindloftdaily.com/tuck${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
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
    if (dictErr) return { msg: 'Could not load the dictionary — refresh to try again.', cls: 'bad' };
    if (placedCount === 0) return { msg: 'Tap a square (or a rack tile), then type. Space flips direction ➜ / ⬇', cls: 'muted' };
    if (!allValid) return { msg: 'Red runs aren’t words yet', cls: 'bad' };
    if (stray || loneTiles > 0) return { msg: 'Single letters need to join a word', cls: 'bad' };
    if (!connected) return { msg: 'Valid words, but everything must connect into one grid', cls: 'bad' };
    if (placedCount === RACK) return { msg: `Perfect tuck! All ${RACK} letters placed — rebuild for more, or submit.`, cls: 'good' };
    return { msg: 'Valid grid! Keep tucking letters in…', cls: 'good' };
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
          .tk-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .tk-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, #7c3609) 86%, var(--stg-ink, var(--white)));}
          .tk-btn:disabled{opacity:0.45;cursor:default;}
          .tk-grid{display:grid;grid-template-columns:repeat(${SIZE},1fr);gap:3px;background:var(--stg-cell-line, #dfd8cb);border:2px solid var(--stg-cell-line, ${COLORS.ink});border-radius:10px;padding:6px;max-width:432px;width:100%;box-shadow:5px 5px 0 rgba(28,30,36,0.16);}
          .tk-cell{position:relative;aspect-ratio:1;background:${STAGE ? 'var(--stg-cell)' : '#fbf9f4'};border-radius:4px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:clamp(14px,3.4vw,21px);color:${INK};cursor:pointer;user-select:none;border:1px solid var(--stg-cell-line, rgba(28,30,36,0.08));}
          .tk-cell.filled{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 22%, var(--stg-cell))' : COLORS.tile};border-color:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 35%, transparent);box-shadow:inset 0 -2px 0 color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 18%, transparent);}
          .tk-cell.badword{background:${STAGE ? 'var(--stg-surf2)' : '#fbe3e0'};border-color:rgba(192,57,43,0.5);color:${COLORS.rust};}
          .tk-cell.sel{outline:2.5px solid var(--stg-acc, ${COLORS.accent});outline-offset:-1px;z-index:1;}
          .tk-dir{position:absolute;right:2px;bottom:1px;font-size:9px;color:var(--stg-acc-ink, ${COLORS.accent});}
          .tk-tray{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 4px;}
          .tk-tile{position:relative;width:40px;height:44px;background:${STAGE ? 'var(--stg-surf2)' : COLORS.tile};border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(146,64,14,0.45)'};border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:19px;color:${INK};cursor:pointer;user-select:none;box-shadow:0 2px 0 color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 25%, transparent);}
          .tk-tile .pts{position:absolute;right:3px;bottom:1px;font-size:9px;font-weight:800;color:var(--stg-acc-ink, ${COLORS.accent});}
          .tk-tile.used{opacity:0.28;box-shadow:none;}
          .tk-tile.armed{outline:2.5px solid var(--stg-acc, ${COLORS.accent});outline-offset:1px;}
          .tk-wtag{display:inline-flex;align-items:center;font-family:${MONO};font-size:11.5px;font-weight:500;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:6px;padding:2px 7px;margin:0 5px 5px 0;color:${INK};}
          .tk-wtag.invalid{color:${COLORS.rust};border-color:rgba(192,57,43,0.4);}
          .tk-status{font-size:12.5px;font-weight:700;min-height:18px;}
          .tk-status.bad{color:${COLORS.rust};}
          .tk-status.good{color:${COLORS.green};}
          .tk-status.muted{color:${FADED};}
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
              <button className="tk-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* score bar */}
        {!preStart && (
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 10, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
          <span style={{ fontSize: 12 }}>score <b style={{ color: liveScore >= BENCH && liveScore > 0 ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500, fontSize: 20 }}>{playing ? liveScore : finalScore}</b></span>
          <span>benchmark <b style={{ color: ACC_INK, fontWeight: 500 }}>{BENCH}</b></span>
          <span>tiles <b style={{ color: INK, fontWeight: 500 }}>{placedCount}</b>/{RACK}</span>
          {!playing && <span style={{ marginLeft: 'auto', color: `var(--stg-ink, ${COLORS.green})` }}>score submitted — sandbox mode</span>}
        </div>
        )}

        {!preStart && (
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 300px', minWidth: 280, maxWidth: 432 }}>
            <div className="tk-grid" ref={gridRef} role="grid" aria-label="Tuck board">
              {Array.from({ length: SIZE * SIZE }, (_, i) => {
                const r = Math.floor(i / SIZE), c = i % SIZE;
                const v = grid[r][c];
                const isSel = sel && sel.r === r && sel.c === c;
                return (
                  <div
                    key={i}
                    className={`tk-cell${v ? ' filled' : ''}${badCells.has(`${r},${c}`) ? ' badword' : ''}${isSel ? ' sel' : ''}`}
                    onClick={() => onCell(r, c)}
                    role="gridcell"
                    aria-label={`Row ${r + 1} column ${c + 1}${v ? `: ${v}` : ''}`}
                  >
                    {v || ''}
                    {isSel && <span className="tk-dir">{dir === 'h' ? '➜' : '⬇'}</span>}
                  </div>
                );
              })}
            </div>

            {/* rack */}
            <div className="tk-tray">
              {trayFlags.map((t, i) => (
                <div
                  key={i}
                  className={`tk-tile${t.used ? ' used' : ''}${armed === t.l && !t.used ? ' armed' : ''}`}
                  onClick={() => { if ((availCounts[t.l] || 0) > 0) { startClock(); setErase(false); setArmed((a) => (a === t.l ? null : t.l)); } }}
                  role="button"
                  aria-label={`Tile ${t.l}, ${PTS[t.l]} points${t.used ? ', used' : ''}`}
                >
                  {t.l}<span className="pts">{PTS[t.l]}</span>
                </div>
              ))}
            </div>
            <div className="tk-status" style={{ textAlign: 'center' }}>
              <span className={`tk-status ${statusLine.cls}`}>{statusLine.msg}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {playing && (
                <button
                  type="button"
                  className="tk-btn primary"
                  disabled={!isValid || liveScore <= 0 || !dict}
                  onClick={submitScore}
                >
                  <CheckCircle2 size={15} strokeWidth={2.4} /> {confirming ? `Submit ${liveScore} pts — sure?` : 'Submit score'}
                </button>
              )}
              {playing && (
                <button
                  type="button"
                  className={`tk-btn${erase ? ' primary' : ''}`}
                  aria-pressed={erase}
                  disabled={placedCount === 0 && !erase}
                  onClick={() => { setErase((v) => !v); setArmed(null); }}
                >
                  <Eraser size={14} /> {erase ? 'Tap tiles to remove' : 'Take back'}
                </button>
              )}
              <button type="button" className="tk-btn" onClick={clearGrid}><Trash2 size={14} /> Clear all</button>
              {confirming && <button type="button" className="tk-btn" onClick={() => setConfirming(false)}>Keep building</button>}
            </div>
            {playing && (
              <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
                One shot counts: only your first submitted grid ranks on the daily board.
              </div>
            )}
          </div>

          {/* words formed */}
          <div style={{ flex: '1 1 180px', minWidth: 170 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, marginBottom: 8 }}>Words formed</div>
            <div>
              {runs.length ? runs.map((x, i) => (
                <span key={i} className={`tk-wtag${dict && !dict.has(x.word.toLowerCase()) ? ' invalid' : ''}`}>
                  {x.word.toLowerCase()}{dict && !dict.has(x.word.toLowerCase()) ? ' ?' : ''}
                  <span style={{ marginLeft: 5, color: ACC_INK, fontWeight: 800, fontSize: 10 }}>{[...x.word].reduce((s, ch) => s + PTS[ch], 0)}</span>
                </span>
              )) : <span style={{ fontSize: 12, fontWeight: 600, color: FADED }}>No words yet.</span>}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, lineHeight: 1.55, marginTop: 10 }}>
              Every run of 2+ letters must be a word, across and down. Intersections score in both words. All {RACK} tiles placed is +10.
            </div>
          </div>
        </div>
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
                    {won ? `Beat the benchmark of ${BENCH} — the desk tips its cap.` : `Submitted against a benchmark of ${BENCH}.`}
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
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
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
