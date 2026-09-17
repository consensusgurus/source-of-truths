'use client';

// Barter — the daily letter-trade lattice.
//
// Six words interlock in a 5x5 lattice (Sundays: eight words in 7x7). Every
// letter the answer needs is already on the board, scrambled. Tap two tiles to
// trade them. Solid blue = right letter on the right square (it locks); faded
// blue = that letter belongs somewhere else in a word crossing that square;
// grey = it belongs to a different word entirely. The budget is the proven
// minimum number of trades (par) plus five; solve at par for a perfect 10, and
// every extra trade costs two points. Run out of trades and the run is over
// with the board as you left it: Barter keeps its answer (see KEEPS_ANSWER in
// lib/daily-games), because its board ranks on attempts and a bust that handed
// over the target would let anyone re-execute it for a perfect 10.
//
// Same daily plumbing as Etch/Suds: banked boards gated by Eastern date on the
// server (app/barter/page.js), per-puzzle localStorage saves, /barter?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Smartphone } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
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
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, FEED_STRONG, FEED_STRONG_INK, FEED_SOFT, FEED_SOFT_INK, gameAccentInkLight } from '@/lib/category-ramp';
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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#be123c',        // Barter identity — trade rose
  accentSoft: '#fdeef2',
  // HOME AND ELSEWHERE ARE ONE HUE, TWO VALUES (owner, 2026-09-01). Green and
  // yellow were Wordle's convention borrowed whole, and on a Word stage they
  // argued with the sky the rest of the page is painted in. Both are now the
  // category step: see FEED_STRONG / FEED_SOFT in lib/category-ramp.js for why
  // the pair is a var() rather than a hex, and for the contrast measurements.
  home: FEED_STRONG,
  homeInk: FEED_STRONG_INK,
  near: FEED_SOFT,
  nearInk: FEED_SOFT_INK,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_barter_help_seen';
const STATS_KEY = 'sot_barter_stats';
const BUDGET_EXTRA = 5;     // budget is always par + 5

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

// ─── Personal stats + streak (localStorage), Suds/Etch pattern ──────────────
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
    const sc = Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

// ─── lattice geometry ───────────────────────────────────────────────────────
// Cells are the non-hole squares of an S x S lattice (holes at odd row AND odd
// column), flattened in reading order. Words run along every even row and
// every even column.
function latticeCells(S) {
  const cells = [];
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) if (!(r % 2 === 1 && c % 2 === 1)) cells.push([r, c]);
  return cells;
}
function flatFromGrid(grid, cells) { return cells.map(([r, c]) => grid[r][c]); }

// tile colors: 0 grey, 1 faded blue, 2 solid blue. The middle state is
// consumed per word line so duplicates read fairly; an intersection tile takes
// it if either of its
// crossing words still wants that letter.
function colorsOf(cur, target, lines) {
  const out = Array(cur.length).fill(0);
  for (let i = 0; i < cur.length; i++) if (cur[i] === target[i]) out[i] = 2;
  for (const line of lines) {
    const remain = {};
    for (const i of line) if (out[i] !== 2) remain[target[i]] = (remain[target[i]] || 0) + 1;
    for (const i of line) {
      if (out[i] === 2) continue;
      const ch = cur[i];
      if (remain[ch] > 0) { remain[ch]--; if (out[i] < 1) out[i] = 1; }
    }
  }
  return out;
}

function freshState(startFlat) {
  return { v: 1, cells: startFlat.slice(), swaps: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function BarterClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const S = PUZZLE.size;
  const CELLS = useMemo(() => latticeCells(S), [S]);
  const N = CELLS.length;
  const IDX = useMemo(() => {
    const m = {};
    CELLS.forEach(([r, c], i) => { m[r * S + c] = i; });
    return m;
  }, [CELLS, S]);
  const LINES = useMemo(() => {
    const ls = [];
    for (let r = 0; r < S; r += 2) { const l = []; for (let c = 0; c < S; c++) l.push(IDX[r * S + c]); ls.push(l); }
    for (let c = 0; c < S; c += 2) { const l = []; for (let r = 0; r < S; r++) l.push(IDX[r * S + c]); ls.push(l); }
    return ls;
  }, [S, IDX]);
  const TARGET = useMemo(() => flatFromGrid(PUZZLE.sol, CELLS), [PUZZLE, CELLS]);
  const START = useMemo(() => flatFromGrid(PUZZLE.start, CELLS), [PUZZLE, CELLS]);
  const WORDS = useMemo(() => LINES.map((line) => line.map((i) => TARGET[i]).join('')), [LINES, TARGET]);
  const PAR = PUZZLE.par;
  const BUDGET = PAR + BUDGET_EXTRA;
  const STORE_KEY = `sot_barter_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState(START));
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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
  // One free hint, first play only (see lib/hint-gate.js).
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('barter', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('barter'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const cells = g.cells;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('barter');
  const STAGE = isStage('barter', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('barter');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('barter'), '--stg-acc-lt': gameColorLight('barter'), '--stg-onramp-lt': gameOnrampLight('barter'), '--stg-acc-ink-lt': gameAccentInkLight('barter') };
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
  const swapsLeft = Math.max(0, BUDGET - g.swaps);
  const extra = Math.max(0, g.swaps - PAR);
  const finalScore = won ? Math.max(1, Math.min(10, 10 - 2 * extra)) : 0;
  const tileColors = useMemo(() => colorsOf(cells, TARGET, LINES), [cells, TARGET, LINES]);
  const homeCount = useMemo(() => { let k = 0; for (let i = 0; i < N; i++) if (cells[i] === TARGET[i]) k++; return k; }, [cells, TARGET, N]);

  useEffect(() => { gRef.current = g; }, [g]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === N) {
          const next = { ...freshState(START), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
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
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_barter_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_barter_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock (display only; the recorded time is a real Date.now() delta).
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

  // ---- metrics + leaderboard (shared /api/quiz/* flow) ----
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
            if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
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
  const iq = useIqStanding({ game: 'barter', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'barter', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'barter', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'barter', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'barter', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_barter_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.swaps > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const over = Math.max(0, g2.swaps - PAR);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: over, won: g2.status === 'won' && over === 0 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: over, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function finish(g2) {
    if (g2.status === 'won') {
      vibrate(HAPT.win);
      const over = Math.max(0, g2.swaps - PAR);
      postResult(g2, Math.max(1, Math.min(10, 10 - 2 * over)));
    } else {
      vibrate(HAPT.wrong);
      // The board is LEFT AS THE PLAYER LEFT IT (owner, 2026-08-26). It used to
      // fill in with TARGET here, which is the one thing a game ranked on
      // attempts cannot do. The explicit give-up that used to reach this branch
      // (Reveal & end) came off the board 2026-09-01; a lost run now arrives
      // here only from a real ending.
      postResult(g2, 0);
    }
    commit(g2);
    setSel(null);
  }

  function onTile(idx) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (!cur.t0) startGame();
    if (cur.cells[idx] === TARGET[idx]) { say('That tile is already home.'); return; }
    if (sel === null) { setSel(idx); return; }
    if (sel === idx) { setSel(null); return; }
    if (cur.cells[sel] === cur.cells[idx]) { say('Same letter both ways. That trade changes nothing.'); return; }
    const nextCells = cur.cells.slice();
    const tmp = nextCells[sel];
    nextCells[sel] = nextCells[idx];
    nextCells[idx] = tmp;
    const g2 = { ...cur, cells: nextCells, swaps: cur.swaps + 1 };
    setSel(null);
    const solved = nextCells.every((ch, i) => ch === TARGET[i]);
    if (solved) { g2.status = 'won'; g2.tEnd = Date.now(); finish(g2); return; }
    if (g2.swaps >= BUDGET) { g2.status = 'lost'; g2.tEnd = Date.now(); finish(g2); return; }
    const homed = (nextCells[sel] === TARGET[sel] ? 1 : 0) + (nextCells[idx] === TARGET[idx] ? 1 : 0);
    vibrate(homed ? HAPT.ok : HAPT.wrong.slice(0, 2));
    commit(g2);
  }

  // one free hint: perform one correct-placing trade WITHOUT spending a trade.
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    let pick = null;
    // prefer a two-way trade that homes both tiles
    outer:
    for (let i = 0; i < N; i++) {
      if (cur.cells[i] === TARGET[i]) continue;
      for (let j = i + 1; j < N; j++) {
        if (cur.cells[j] === TARGET[j]) continue;
        if (cur.cells[i] === TARGET[j] && cur.cells[j] === TARGET[i]) { pick = [i, j]; break outer; }
      }
    }
    if (!pick) {
      outer2:
      for (let i = 0; i < N; i++) {
        if (cur.cells[i] === TARGET[i]) continue;
        for (let j = 0; j < N; j++) {
          if (j === i || cur.cells[j] === TARGET[j]) continue;
          if (cur.cells[j] === TARGET[i]) { pick = [i, j]; break outer2; }
        }
      }
    }
    if (!pick) return;
    const nextCells = cur.cells.slice();
    const tmp = nextCells[pick[0]];
    nextCells[pick[0]] = nextCells[pick[1]];
    nextCells[pick[1]] = tmp;
    const g2 = { ...cur, cells: nextCells, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null);
    if (nextCells.every((ch, i) => ch === TARGET[i])) {
      g2.status = 'won'; g2.tEnd = Date.now(); finish(g2); return;
    }
    vibrate(HAPT.ok);
    commit(g2);
    say('Hint: one free trade, no cost to your budget.');
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState(START));
    setSel(null);
    setEndClosed(false);
  }

  const onKey = useCallback((e) => {
    if (e.key === 'Escape') setSel(null);
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareUrl() {
    return withRef(`mindloftdaily.com/barter${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(0, 5 - extra) : 0;
    const squares = '\u{1F7E6}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Barter #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${extra === 0 ? 'solved at par' : `${extra} over par`} · ${g.swaps} trades · ${elapsed}${hintBit}${streakBit}`
      : `Barter #${PUZZLE.num} · out of trades`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Barter #${PUZZLE.num} — the daily letter-trade puzzle from Mind Loft.\n${shareUrl()}`
      : shareText();
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

  const boardMax = S === 7 ? 520 : 420;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Every letter the answer needs is already on the board. Trade two tiles at a time until every word reads true."
      chips={[
        // THESE TWO CHIPS ARE THE COLOUR KEY, so they keep their fills where a
        // DailyRules tone gives its own up on the stage: a legend that has
        // surrendered the colour it is naming explains nothing. Both are the
        // same values the tiles use, read from COLORS, so the key cannot drift
        // away from the board.
        { label: 'Solid blue: right letter, right square. It locks.', style: { background: COLORS.home, border: `1.5px solid ${COLORS.home}`, color: COLORS.homeInk } },
        { label: 'Faded blue: belongs elsewhere in a word crossing that square', style: { background: COLORS.near, border: `1.5px solid ${COLORS.near}`, color: COLORS.nearInk } },
        { label: 'Grey: belongs to a different word', tone: 'grey' },
      ]}
      steps={[
        <>Words run along every <b>row and column</b> of tiles. Tap one tile, then another, and they <b>trade places</b>.</>,
        <>The colors re-read after every trade. A <b>solid blue</b> tile is home and locks in place; a <b>faded blue</b> one belongs somewhere else in a word through that square.</>,
        <>Your budget is <b>par + 5</b> trades. Par is the proven minimum for today&rsquo;s board, so a perfect game has no slack at all.</>,
        <>One free <b>hint</b>, on your first ever play, makes a correct trade at no cost.</>,
      ]}
      knack="Do not spend a trade to test a theory the colors can settle. Read the faded tiles across BOTH words at a crossing before you move anything, and hunt for trades that home two tiles at once — par is built entirely out of those."
      note={<>Run out of trades and the run ends with the board where you left it, so come back at it. The answer is one arrangement, and the colors always point at it.</>}
      footer="Solve at par for a perfect 10; every extra trade costs 2 points. Ties break on fewest trades over par, then fastest time. Sundays are a bigger 7×7 Edition."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="barter" name="Barter" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Barter scores a solve 10 down two per trade over par, so any solve is a win and
          a give-up is not. */}
      {LOFT && (
        <Cap gameKey="barter" quizId={PUZZLE.quizId}
          name="Barter"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · 7\u00d77` : null}
          figures={playing ? [
            { v: swapsLeft, k: 'trades left' },
            { v: PAR, k: 'par' },
            { v: elapsed, k: 'time' },
            { v: `${homeCount}/${N}`, k: 'home' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: PAR, k: 'par' },
            { v: `${homeCount}/${N}`, k: 'home' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="bt-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.bt-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .bt-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .bt-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .bt-tile{box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;border-radius:8px;font-family:${SANS};font-weight:900;text-transform:uppercase;transition:background 0.15s, transform 0.1s;}
          .bt-tile.play{cursor:pointer;}
          .bt-tile.sel{outline:3px solid var(--stg-acc, ${COLORS.accent});outline-offset:-1px;transform:scale(1.05);z-index:2;}
          .bt-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="barter"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 7&times;7</span>}
          blocks={'BARTER'.split('').map((ch, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 5 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which
            runs full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Barter is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Trade two tiles at a time until every word reads true. {WORDS.length} words, par {PAR}, budget {BUDGET} trades today.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="bt-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ whiteSpace: 'nowrap' }}>trades left <b style={{ color: playing && swapsLeft <= 2 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{swapsLeft}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>par <b style={{ color: INK, fontWeight: 500 }}>{PAR}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>home <b style={{ color: homeCount === N ? COLORS.home : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{homeCount}</b>/{N}</span>
          </div>
          )}

          <div style={{ maxWidth: boardMax, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${S}, minmax(0, 1fr))`, gap: 6, aspectRatio: '1 / 1' }}>
              {Array.from({ length: S * S }).map((_, k) => {
                const r = Math.floor(k / S), c = k % S;
                if (r % 2 === 1 && c % 2 === 1) return <div key={k} />;
                const idx = IDX[r * S + c];
                const col = tileColors[idx];
                const isSel = sel === idx;
                const bg = col === 2 ? COLORS.home : col === 1 ? COLORS.near : T.white;
                const ink = col === 2 ? COLORS.homeInk : col === 1 ? COLORS.nearInk : COLORS.ink;
                const canPlay = playing && col !== 2;
                return (
                  <div
                    key={k}
                    className={`bt-tile${canPlay ? ' play' : ''}${isSel ? ' sel' : ''}`}
                    onPointerDown={canPlay ? () => onTile(idx) : (playing ? () => onTile(idx) : undefined)}
                    style={{
                      background: bg,
                      color: ink,
                      border: col === 0 ? '2px solid rgba(28,30,36,0.35)' : '2px solid transparent',
                      fontSize: S === 7 ? 'clamp(13px, 3.4vw, 24px)' : 'clamp(16px, 4.6vw, 30px)',
                      boxShadow: col === 2 ? 'none' : '0 1.5px 0 rgba(28,30,36,0.18)',
                    }}
                  >
                    {cells[idx]}
                  </div>
                );
              })}
            </div>
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && (
                <button className="bt-tool" onClick={useHint} title="One correct trade at no cost (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(190,18,60,0.5)', color: ACC_INK }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: sel !== null ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {sel !== null
                ? 'Now tap the tile to trade it with. Tap it again to put it back.'
                : 'Tap two tiles to trade them. Solid blue tiles are locked.'}
            </span>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                The words: <span style={{ color: ACC_INK }}>{WORDS.map((w) => w.toUpperCase()).join(', ')}</span>.
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; a bigger 7&times;7 lattice.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Barter in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/barter?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Barter &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/barter" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Barter &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
              name="Barter"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${PAR} par \u00b7 ${`${homeCount}/${N}`} home \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Barter all time` : 'all-time rank' }
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
                  href: `/barter?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board',
                  sub: 'Your board, as you left it', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Barter', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/barter?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="barter" name="Barter" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="barter" name="Barter" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="barter"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="barter" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Barter to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="barter"
          won={won}
          headline={won ? (extra === 0 ? <>Solved at par!</> : <>Solved!</>) : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {extra === 0 ? `a perfect ${g.swaps}-trade game` : `${extra} over par`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the words are shown above</>}
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

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="bt-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Barter</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Barter is a free daily word puzzle from Mind Loft. Six words interlock in a lattice, and every letter the answer needs is already on the board, just in the wrong places. Tap two tiles to trade them: solid blue means a letter has found its home, faded blue means it belongs somewhere else in one of the words crossing that square, and grey means it belongs to a different word entirely.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The catch is the budget. Every board&rsquo;s par is the proven minimum number of trades, computed exactly, and you get par plus five. Careless trades are the whole game: a good player reads the faded tiles across both crossing words before touching anything, and the best trades home two tiles at once. Solve at par for a perfect score.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern, and Sundays step up to a 7&times;7 Edition with eight words. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our unscramble game, <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, and <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, our hidden-threads game.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
