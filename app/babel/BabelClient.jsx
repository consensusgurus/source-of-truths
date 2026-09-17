'use client';

// Babel — the daily word tile endgame.
//
// The bag is empty. You hold five tiles (six on Sunday), your opponent holds
// the rest, and the whole game is the last few plays. Because nothing is left
// to draw, their rack is not a secret: it is the bag minus the board minus your
// own rack. There is deliberately NO tracker doing that subtraction for you —
// the launch version had one, and handing over the answer made the deduction
// ornamental. The bag is printed beside the board and the arithmetic is yours.
// Working out what they can DO with those tiles, and whether to race them out
// or block the lane they need, is the rest of it.
//
// Your score is SPREAD: your points from here minus theirs, including the
// end-of-game rack adjustment (go out and their leftovers come off their score
// and onto yours). The benchmark is the spread our solver ACHIEVES from your seat
// against
// the very defence the browser plays (solveLine in lib/babel-engine.js), so it
// is reachable by construction rather than a ceiling nobody can hit.
//
// Two dictionaries, deliberately. The opponent plays from a common-word list so
// it never answers with SLAGGY, while YOUR words are checked against the full
// 115k list Tuck already uses. The asymmetry runs in the player's favour.
//
// Same daily plumbing as Tuck/Suds/Stet: banked positions gated by Eastern date
// on the server (app/babel/page.js), per-puzzle localStorage saves, /babel?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, RotateCcw, CheckCircle2, SkipForward } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold, { HOLD_SHORT, HOLD_LONG } from '../useEndHold';
import EndHoldNote from '../EndHoldNote';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { isMobileDevice } from '@/lib/is-mobile';
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
import {
  SIZE, PREMIUM, PTS, BAG, buildLexicon, rowsToBoard, boardToRows,
  applyMove, validatePlacement, bestReply, rackSum, BAG_SIZE,
} from '@/lib/babel-engine';
import { T } from '@/lib/theme';
import { loadRackDict } from '@/lib/rack-dict';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#14532d',        // Babel identity — board-felt green
  accentSoft: '#e3efe6',
  green: T.successDeep,
  tile: '#f7edda',
  foe: '#7c2d12',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_babel_help_seen';
const STATS_KEY = 'sot_babel_stats';

// Premium square palette, in the order a tile player expects to read them.
const PREM = {
  T: { bg: '#e2725b', fg: T.white, label: '3W' },
  D: { bg: '#f0b5ac', fg: '#7a2e20', label: '2W' },
  t: { bg: '#4a90d9', fg: T.white, label: '3L' },
  d: { bg: '#b3d4ea', fg: '#1f4e6b', label: '2L' },
  '*': { bg: '#f0b5ac', fg: '#7a2e20', label: '★' },
};

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

const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

// The bag, printed once for reference. Sorted by letter value descending so
// the tiles a player actually tracks (Q, Z, X, J) sit at the front.
const BAG_ROWS = Object.keys(BAG)
  .sort((a, b) => (PTS[b] - PTS[a]) || a.localeCompare(b))
  .map((L) => [L, BAG[L]]);

// ─── personal stats + streak (localStorage), the Tuck/Circa pattern ────────
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
function mergeServerStats(cur, recent, puzzles) {
  const byId = new Map(puzzles.map((p) => [p.quizId, p]));
  let s = cur;
  for (const r of recent || []) {
    const p = byId.get(r.quizId);
    if (!p || s.rec[p.num]) continue;
    s = { ...s, rec: { ...s.rec, [p.num]: { s: r.score, t: r.total, g: r.guessesUsed, won: r.correct > 0 } } };
  }
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function deriveStats(stats, todayNum) {
  const rec = (stats && stats.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let played = nums.length, won = 0;
  for (const n of nums) if (rec[n].won) won++;
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) {
    if (rec[n] && rec[n].won) cur++;
    else if (n !== todayNum) break;
    else if (!rec[n]) continue;
    else break;
  }
  let max = 0, run = 0;
  for (let n = 1; n <= todayNum; n++) {
    if (rec[n] && rec[n].won) { run++; max = Math.max(max, run); } else run = 0;
  }
  return { played, won, cur, max };
}

export default function BabelClient({ puzzles, forceNum }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const BENCH = PUZZLE.benchmark;
  const START_RACK = PUZZLE.rack;
  const STORE_KEY = `sot_babel_${PUZZLE.num}`;

  const freshState = () => ({
    v: 1,
    rows: PUZZLE.board.slice(),
    rack: START_RACK.slice(),
    my: 0,
    foeScore: 0,
    log: [],
    passes: 0,
    status: 'playing',
    over: null,
    adj: 0,
    foeCells: [],      // squares from the opponent's most recent play, for the highlight
    t0: null,
    tEnd: null,
  });

  const [g, setG] = useState(freshState);
  const [pending, setPending] = useState([]);        // tiles laid this turn, not yet played
  const [armed, setArmed] = useState(null);          // rack index armed for placing
  const [sel, setSel] = useState(null);
  const [dir, setDir] = useState('h');
  const [thinking, setThinking] = useState(false);
  const [engineLex, setEngineLex] = useState(null);
  const [dict, setDict] = useState(null);
  const [dictErr, setDictErr] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState(null);
  const [board, setBoardData] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  // eslint-disable-next-line no-unused-vars -- the player chip moved into
  // DailyChrome (QuizNavHeader fetches its own identity); the fetch below
  // stays for the cross-device stats merge.
  const [player, setPlayer] = useState(null);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  // Hold the end card back so the move that ended the game is visible first.
  const endHold = useEndHold(1500);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('babel');
  const STAGE = isStage('babel', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('babel');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('babel'), '--stg-acc-lt': gameColorLight('babel'), '--stg-onramp-lt': gameOnrampLight('babel'), '--stg-acc-ink-lt': gameAccentInkLight('babel') };
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
  const preStart = playing && !g.t0;
  const focusMode = playing && !showChrome;
  const ready = !!engineLex && !!dict;

  // ---- dictionaries (static assets, fetched once) ----
  // The engine gets a trie over the common list; the player's words are checked
  // against a plain Set, which is far cheaper than a second trie. That Set now
  // spans BOTH word files (2-8 plus 9-15), because the board is 11 wide and the
  // base list alone rejected every 9, 10 and 11 letter word a player could lay.
  // The OPPONENT's lexicon is untouched: it plays the common list on purpose,
  // and every banked benchmark was solved against exactly that.
  useEffect(() => {
    let alive = true;
    fetch('/babel-common.txt')
      .then((r) => { if (!r.ok) throw new Error('lex'); return r.text(); })
      .then((t) => { if (alive) setEngineLex(buildLexicon(t.split('\n'))); })
      .catch(() => { if (alive) setDictErr(true); });
    loadRackDict({ upper: true })
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
        if (saved && saved.v === 1 && Array.isArray(saved.rows)) setG({ ...freshState(), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_babel_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_babel_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

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

  // ---- metrics + leaderboard ----
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
      .then((d) => { if (d && !d.error) setBoardData({ ...EMPTY_BOARD, ...d }); })
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
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'babel', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'babel', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'babel', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'babel', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'babel', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // ─── derived position ────────────────────────────────────────────────────
  const grid = useMemo(() => rowsToBoard(g.rows), [g.rows]);

  // The opponent's rack, derived exactly the way the player is meant to derive
  // it: the full bag, minus every tile on the board, minus the tiles in hand.
  // Nothing is hidden that the player could not work out, and nothing is sent
  // from the server, so the engine and the player read the same information.
  const foeRack = useMemo(() => {
    const left = { ...BAG };
    for (const row of g.rows) for (const ch of row) if (ch !== '.') left[ch] = (left[ch] || 0) - 1;
    for (const L of g.rack) left[L] = (left[L] || 0) - 1;
    const out = [];
    for (const L of Object.keys(left)) for (let i = 0; i < left[L]; i++) out.push(L);
    return out;
  }, [g.rows, g.rack]);

  const pendingAt = useMemo(() => {
    const m = new Map();
    for (const t of pending) m.set(`${t.r},${t.c}`, t);
    return m;
  }, [pending]);

  // The opponent's last play stays tinted until you answer it, so a reply that
  // arrives while you are looking elsewhere is never missed.
  const lastFoeCells = useMemo(() => new Set(g.foeCells || []), [g.foeCells]);

  // Which rack indices are currently sitting on the board this turn.
  const usedIdx = useMemo(() => new Set(pending.map((t) => t.idx)), [pending]);

  const preview = useMemo(() => {
    if (!pending.length || !dict) return null;
    return validatePlacement(grid, pending.map(({ r, c, L }) => ({ r, c, L })), dict);
  }, [pending, grid, dict]);

  const spread = g.my - g.foeScore + g.adj;

  // ─── placing tiles ───────────────────────────────────────────────────────
  function startClock() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); }
  function startGame() {
    startClock();
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function placeAt(r, c, idx) {
    setPending((cur) => cur.concat([{ r, c, L: g.rack[idx], idx }]));
    setArmed(null);
    setSel({ r, c });
    // Nudge the caret along so a word can be typed or tapped out in a run.
    const nr = dir === 'v' ? r + 1 : r;
    const nc = dir === 'h' ? c + 1 : c;
    if (nr < SIZE && nc < SIZE) setSel({ r: nr, c: nc });
  }

  function onCell(r, c) {
    if (!playing || thinking) return;
    startClock();
    const p = pendingAt.get(`${r},${c}`);
    if (p) { setPending((cur) => cur.filter((t) => !(t.r === r && t.c === c))); setSel({ r, c }); return; }
    if (grid[r][c]) { setSel(null); return; }
    if (armed !== null && !usedIdx.has(armed)) { placeAt(r, c, armed); return; }
    if (sel && sel.r === r && sel.c === c) { setDir((d) => (d === 'h' ? 'v' : 'h')); return; }
    setSel({ r, c });
  }

  // Keyboard entry: pick a square, type the word, backspace to take tiles back.
  useEffect(() => {
    if (!playing || thinking) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { setPending([]); setArmed(null); return; }
      if (e.key === 'Enter') { if (pending.length) playWord(); e.preventDefault(); return; }
      if (e.key === 'Backspace') {
        setPending((cur) => cur.slice(0, -1));
        e.preventDefault();
        return;
      }
      if (!sel) return;
      if (e.key === 'ArrowRight') { setDir('h'); setSel({ r: sel.r, c: Math.min(SIZE - 1, sel.c + 1) }); e.preventDefault(); return; }
      if (e.key === 'ArrowLeft') { setDir('h'); setSel({ r: sel.r, c: Math.max(0, sel.c - 1) }); e.preventDefault(); return; }
      if (e.key === 'ArrowDown') { setDir('v'); setSel({ r: Math.min(SIZE - 1, sel.r + 1), c: sel.c }); e.preventDefault(); return; }
      if (e.key === 'ArrowUp') { setDir('v'); setSel({ r: Math.max(0, sel.r - 1), c: sel.c }); e.preventDefault(); return; }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const L = e.key.toUpperCase();
        const idx = g.rack.findIndex((x, i) => x === L && !usedIdx.has(i));
        if (idx < 0) { say(`No ${L} left on your rack`); e.preventDefault(); return; }
        // Skip over tiles already on the board so a word can be typed straight through.
        let { r, c } = sel;
        while (r < SIZE && c < SIZE && grid[r][c]) { if (dir === 'h') c++; else r++; }
        if (r >= SIZE || c >= SIZE) { e.preventDefault(); return; }
        if (pendingAt.get(`${r},${c}`)) { e.preventDefault(); return; }
        startClock();
        placeAt(r, c, idx);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, dir, grid, g.rack, usedIdx, pendingAt, pending, playing, thinking]);

  // ─── turns ───────────────────────────────────────────────────────────────
  function finish(state, over) {
    // End-of-game rack adjustment. Going out collects double the other rack
    // (it comes off their score and lands on yours); a double pass just docks
    // each side its own leftovers.
    let adj = 0;
    if (over === 'you-out') adj = 2 * rackSum(foeRackFor(state));
    else if (over === 'foe-out') adj = -2 * rackSum(state.rack);
    else adj = rackSum(foeRackFor(state)) - rackSum(state.rack);
    return { ...state, status: 'done', over, adj, tEnd: Date.now(), t0: state.t0 || Date.now() };
  }
  function foeRackFor(state) {
    const left = { ...BAG };
    for (const row of state.rows) for (const ch of row) if (ch !== '.') left[ch] = (left[ch] || 0) - 1;
    for (const L of state.rack) left[L] = (left[L] || 0) - 1;
    const out = [];
    for (const L of Object.keys(left)) for (let i = 0; i < left[L]; i++) out.push(L);
    return out;
  }

  function playWord() {
    if (!playing || thinking || !ready || !pending.length) return;
    const res = validatePlacement(grid, pending.map(({ r, c, L }) => ({ r, c, L })), dict);
    if (!res.ok) { say(res.why); return; }
    const rows = g.rows.slice();
    for (const t of pending) rows[t.r] = rows[t.r].slice(0, t.c) + t.L + rows[t.r].slice(t.c + 1);
    const rack = g.rack.filter((_, i) => !usedIdx.has(i));
    const log = g.log.concat([{ who: 'you', word: res.words.map((w) => w.word).join(' / '), score: res.score }]);
    const next = { ...g, rows, rack, my: g.my + res.score, log, passes: 0, foeCells: [], t0: g.t0 || Date.now() };
    setPending([]); setArmed(null); setSel(null);
    if (!rack.length) { const done = finish(next, 'you-out'); setG(done); setEndClosed(false); endHold.hold(HOLD_SHORT, 'You went out.'); postResult(done); return; }
    setG(next);
    setThinking(true);
  }

  function passTurn() {
    if (!playing || thinking || !ready) return;
    const next = { ...g, log: g.log.concat([{ who: 'you', word: 'pass', score: 0 }]), passes: g.passes + 1, t0: g.t0 || Date.now() };
    setPending([]); setArmed(null);
    if (next.passes >= 2) { const done = finish(next, 'passes'); setG(done); setEndClosed(false); endHold.hold(HOLD_SHORT, 'Two passes in a row. That is the game.'); postResult(done); return; }
    setG(next);
    setThinking(true);
  }

  // The opponent's reply. Run on a timeout so React paints the "thinking" state
  // before the search blocks the thread; a five-tile endgame lands in about a
  // second and gets faster every turn as the racks empty.
  //
  // The search runs OUTSIDE setG and the result is handed over as a plain
  // value. Doing it inside a state updater would put a network post and a
  // second setState inside a function React is allowed to call twice, which is
  // exactly how a game ends up posting its result to the leaderboard twice.
  // `g` here is already the post-play state: setG and setThinking were batched
  // in the same event, so this effect only runs after both landed.
  useEffect(() => {
    if (!thinking || !engineLex) return undefined;
    const id = setTimeout(() => {
      const cur = g;
      const b = rowsToBoard(cur.rows);
      const foe = foeRackFor(cur);
      let out = cur;
      if (foe.length) {
        const { move } = bestReply(b, foe, cur.rack, engineLex);
        if (!move) {
          const next = { ...cur, log: cur.log.concat([{ who: 'foe', word: 'pass', score: 0 }]), passes: cur.passes + 1, foeCells: [] };
          out = next.passes >= 2 ? finish(next, 'passes') : next;
        } else {
          const { board: nb } = applyMove(b, foe, move);
          const next = {
            ...cur,
            rows: boardToRows(nb),
            foeScore: cur.foeScore + move.score,
            log: cur.log.concat([{ who: 'foe', word: move.word, score: move.score }]),
            passes: 0,
            foeCells: move.tiles.map((t) => `${t.r},${t.c}`),
          };
          out = foe.length - move.tiles.length === 0 ? finish(next, 'foe-out') : next;
        }
      }
      setG(out);
      setThinking(false);
      // The opponent going out is the ending this hold was written for: it
      // lands on THEIR move, with their word new on the board. Babel has no
      // verdict line on the board (its .loft-sol panel is held back with the
      // card), so this is the one game that passes a note.
      if (out.status === 'done') {
        setEndClosed(false);
        endHold.hold(out.over === 'foe-out' ? HOLD_LONG : HOLD_SHORT,
          out.over === 'foe-out' ? 'Your opponent went out.' : null);
        postResult(out);
      }
    }, 90);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, engineLex]);

  // ─── results ─────────────────────────────────────────────────────────────
  const REC_KEY = `sot_babel_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (g.status !== 'playing' || !g.t0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - g.t0) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const sc = Math.max(0, g.my - g.foeScore);
    return { quizId: PUZZLE.quizId, score: sc, total: BENCH, correct: 0, guessesUsed: g.rack.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(state) {
    abandon.markFlushed();
    const sp = state.my - state.foeScore + state.adj;
    // Spread can go negative on a bad line; the board stores a non-negative
    // score, and `guessesUsed` carries the tiles you were left holding, which
    // is the figure a tile player actually wants to see.
    const sc = Math.max(0, sp);
    const stuck = state.rack.length;
    const el = state.t0 ? Math.max(1, Math.round(((state.tEnd || Date.now()) - state.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: BENCH, g: stuck, won: sp >= BENCH })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: BENCH, correct: sp >= BENCH ? 1 : 0, guessesUsed: stuck, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoardData({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(REC_KEY); } catch (e) {}
    setG(freshState()); setPending([]); setArmed(null); setSel(null); setEndClosed(false);
  }

  const won = g.status === 'done' && spread >= BENCH;
  // Babel is the one game whose WIN sits ABOVE its COMPLETION: clearing the
  // solver benchmark is the win, but BEATING THE OPPONENT is a finished game and
  // the home slate has counted it green since 2026-08-10 (solvesOnScore /
  // dailySolvedRow in lib/daily-games). The verdict header used to be binary and
  // called a won endgame under the benchmark "Not solved", which contradicted the
  // slate and read as a loss. Middle tier now: beat them and it is COMPLETED
  // (the gold `part` band). "Not solved" is reserved for a loss or a dead heat.
  // DISPLAY ONLY. `won` still owns the posted `correct` flag, the share tick, the
  // streak and IQ Points; never widen those to the spread (see the note in
  // lib/daily-games above SOLVES_ON_SCORE).
  const beat = g.status === 'done' && !won && spread > 0;
  const verdictTone = won ? 'won' : (beat ? 'part' : 'lost');
  const verdictWord = won ? 'Solved' : (beat ? 'Completed' : 'Not solved');

  function copyShare() {
    const line = g.status === 'playing'
      ? `Babel ${PUZZLE.dateLabel} — mid-endgame.`
      : `Babel ${PUZZLE.dateLabel}\nSpread ${signed(spread)} vs benchmark ${signed(BENCH)}${won ? ' ✓' : ''}\n${g.over === 'you-out' ? 'Went out first.' : g.over === 'foe-out' ? 'Caught holding tiles.' : 'Board closed out.'}`;
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const text = `${line}${streakBit}\nmindloftdaily.com/babel`;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      notifyShareCredit();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="A word tile game, picked up at the very end. The bag is empty, so these are the last plays."
      banner={<>The benchmark is {signed(BENCH)}: the spread our solver makes from your seat against this same opponent, so it is a score somebody has actually made, not a theoretical ceiling. Greedy play gets {signed(PUZZLE.greedy)}.</>}
      steps={[
        <>You hold {START_RACK.length} tiles, your opponent holds the rest, and there is nothing left to draw.</>,
        <><b>Tap a tile, then tap a square</b>, or click a square and type.</>,
        <>Their rack is no secret, but nobody hands it to you: it is the <b>bag</b>, printed beside the board, minus the board, minus your own tiles. Working out what they can do with it is the rest.</>,
        <>You are scored on <b>spread</b>: your points from here minus theirs.</>,
      ]}
      knack="Go out first and their leftover tiles come off their score and onto yours, usually worth more than any single play. Get stuck holding tiles and it happens to you."
      footer="The 65-tile bag holds every letter, weighted toward the common ones, Q included and no blanks, sized for the 11 by 11 board and hidden from nobody. Your words are checked against the full Tuck dictionary; your opponent plays from a common-word list, so it never answers with something nobody has heard of."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, position: 'relative', background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="babel" name="Babel" collapsed={playing && !!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="babel" quizId={PUZZLE.quizId}
          name="Babel"
          cat="Word"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: spread, k: 'spread' },
            { v: BENCH, k: 'benchmark' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: spread, k: 'spread' },
            { v: BENCH, k: 'benchmark' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, padding: '18px 16px 0' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .sc-btn{font-family:${SANS};font-weight:800;font-size:13px;letter-spacing:0.02em;color:${INK};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.28));border-radius:9px;padding:9px 15px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .sc-btn:hover{background:var(--stg-surf2, ${COLORS.paper});}
          .sc-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .sc-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, #0f3d21) 86%, var(--stg-ink, var(--white)));}
          .sc-btn:disabled{opacity:0.42;cursor:default;}
          .sc-grid{display:grid;grid-template-columns:repeat(${SIZE},1fr);gap:2px;background:var(--stg-cell-line, #0d3b20);border:2px solid var(--stg-cell-line, ${COLORS.ink});border-radius:10px;padding:5px;max-width:460px;width:100%;box-shadow:5px 5px 0 rgba(28,30,36,0.16);}
          .sc-cell{position:relative;aspect-ratio:1;border-radius:3px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:clamp(13px,3.5vw,20px);color:${INK};cursor:pointer;user-select:none;background:${STAGE ? 'var(--stg-cell)' : '#dfe7e0'};}
          .sc-cell .pl{font-family:${MONO};font-size:clamp(6px,1.7vw,9px);font-weight:500;letter-spacing:-0.02em;opacity:0.95;}
          /* Laid tiles have to read at a glance against the premium colours and
             the green ground. The launch version used a pale cream on a pale
             board and the letters washed out, so the tile is warmer, the letter
             is near-black at full weight, and every tile carries a hard edge. */
          .sc-cell.tile{background:${STAGE ? 'var(--stg-surf2)' : '#f0dfba'};border:1px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(86,58,16,0.55)'};color:${STAGE ? 'var(--stg-ink)' : '#12141a'};text-shadow:${STAGE ? 'none' : '0 1px 0 rgba(255,255,255,0.5)'};box-shadow:inset 0 -3px 0 rgba(120,80,20,0.3);}
          .sc-cell.fresh{background:${STAGE ? 'color-mix(in srgb, var(--stg-good) 22%, var(--stg-raise))' : '#b9e0c6'};border-color:rgba(13,59,32,0.6);box-shadow:inset 0 -3px 0 color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 45%, transparent);}
          .sc-cell.foeplay{background:${STAGE ? 'var(--stg-surf2)' : '#f3cdb2'};border-color:rgba(124,45,18,0.6);box-shadow:inset 0 -3px 0 rgba(124,45,18,0.42);}
          .sc-cell.sel{outline:2.5px solid var(--stg-acc, ${COLORS.accent});outline-offset:-1px;z-index:1;}
          .sc-cell .pts{position:absolute;right:1px;bottom:0;font-size:clamp(5px,1.5vw,8px);font-weight:800;opacity:0.8;}
          .sc-cell .dirmark{position:absolute;right:1px;top:0;font-size:8px;color:var(--stg-acc-ink, ${COLORS.accent});}
          .sc-rack{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 6px;}
          .sc-tile{position:relative;width:42px;height:46px;background:${STAGE ? 'var(--stg-surf2)' : COLORS.tile};border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(120,80,20,0.45)'};border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:${INK};cursor:pointer;user-select:none;box-shadow:0 2px 0 rgba(120,80,20,0.28);}
          .sc-tile .pts{position:absolute;right:3px;bottom:1px;font-size:9px;font-weight:800;opacity:0.7;}
          .sc-tile.used{opacity:0.25;box-shadow:none;}
          .sc-tile.armed{outline:2.5px solid var(--stg-acc, ${COLORS.accent});outline-offset:2px;}
          .sc-bag{display:flex;flex-wrap:wrap;gap:3px;}
          .sc-bag span{font-family:${MONO};font-size:11px;font-weight:500;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:5px;padding:2px 5px;color:${FADED};}
          .sc-bag span b{color:${INK};font-weight:800;margin-right:2px;}
          .sc-log{font-family:${MONO};font-size:11.5px;font-weight:500;line-height:1.75;}
        ` }} />

        <div style={{ maxWidth: 700, margin: '0 auto' }}>


        {!LOFT && (
        <DailyMasthead
          slug="babel"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={10}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; six tiles</span>}
          blocks={'BABEL'.split('').map((ch, i) => (
            <div key={i} style={{ width: 42, height: 42, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 25, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
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
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', maxWidth: 460, margin: '0 auto 4px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Babel is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>The bag is empty and there are {START_RACK.length} tiles on your rack. The benchmark is <b>{signed(BENCH)}</b>. The board waits until you begin.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sc-btn" onClick={startGame} disabled={!ready} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>
                {ready ? 'Start' : dictErr ? 'Dictionary failed to load' : 'Loading the dictionary…'}
              </button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <>
        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 10, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
          <span style={{ fontSize: 12 }}>spread <b style={{ color: spread >= BENCH ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500, fontSize: 20 }}>{signed(spread)}</b></span>
          <span>benchmark <b style={{ color: ACC_INK, fontWeight: 500 }}>{signed(BENCH)}</b></span>
          <span>you <b style={{ color: INK, fontWeight: 500 }}>{g.my}</b></span>
          <span>them <b style={{ color: `var(--stg-ink, ${COLORS.foe})`, fontWeight: 500 }}>{g.foeScore}</b></span>
          <span style={{ marginLeft: 'auto' }}>{elapsed}</span>
        </div>

        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 320px', minWidth: 290, maxWidth: 460 }}>
            <div className="sc-grid" role="grid" aria-label="Babel board">
              {Array.from({ length: SIZE * SIZE }, (_, i) => {
                const r = Math.floor(i / SIZE), c = i % SIZE;
                const p = pendingAt.get(`${r},${c}`);
                const v = p ? p.L : grid[r][c];
                const prem = PREMIUM[r][c];
                const isSel = sel && sel.r === r && sel.c === c;
                const wasFoe = !p && grid[r][c] && g.log.length && lastFoeCells.has(`${r},${c}`);
                const style = v ? undefined : (PREM[prem] ? { background: PREM[prem].bg, color: PREM[prem].fg } : undefined);
                return (
                  <div
                    key={i}
                    className={`sc-cell${v ? ' tile' : ''}${p ? ' fresh' : ''}${wasFoe ? ' foeplay' : ''}${isSel ? ' sel' : ''}`}
                    style={style}
                    onClick={() => onCell(r, c)}
                    role="gridcell"
                    aria-label={`Row ${r + 1} column ${c + 1}${v ? `: ${v}` : PREM[prem] ? `: ${PREM[prem].label}` : ''}`}
                  >
                    {v ? (
                      <>{v}<span className="pts">{PTS[v]}</span></>
                    ) : PREM[prem] ? (
                      <span className="pl">{PREM[prem].label}</span>
                    ) : ''}
                    {isSel && !v && <span className="dirmark">{dir === 'h' ? '➜' : '⬇'}</span>}
                  </div>
                );
              })}
            </div>

            <div className="sc-rack">
              {g.rack.map((L, i) => (
                <div
                  key={i}
                  className={`sc-tile${usedIdx.has(i) ? ' used' : ''}${armed === i ? ' armed' : ''}`}
                  onClick={() => { if (!playing || thinking || usedIdx.has(i)) return; startClock(); setArmed((a) => (a === i ? null : i)); }}
                  role="button"
                  aria-label={`Tile ${L}, ${PTS[L]} points`}
                >
                  {L}<span className="pts">{PTS[L]}</span>
                </div>
              ))}
              {!g.rack.length && <span style={{ fontSize: 13, fontWeight: 700, color: `var(--stg-ink, ${COLORS.green})` }}>Rack empty — you went out.</span>}
            </div>

            <div style={{ textAlign: 'center', minHeight: 20, fontSize: 12.5, fontWeight: 700 }}>
              {thinking ? <span style={{ color: `var(--stg-ink, ${COLORS.foe})` }}>Your opponent is thinking…</span>
                : preview && !preview.ok ? <span style={{ color: `var(--stg-ink, ${COLORS.rust})` }}>{preview.why}</span>
                : preview && preview.ok ? <span style={{ color: `var(--stg-ink, ${COLORS.green})` }}>{preview.words.map((w) => `${w.word} ${w.score}`).join(' · ')} = {preview.score}</span>
                : playing ? <span style={{ color: FADED }}>Tap a tile then a square, or click a square and type.</span>
                : null}
            </div>

            {playing && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                <button type="button" className="sc-btn primary" disabled={!pending.length || thinking || (preview && !preview.ok)} onClick={playWord}>
                  <CheckCircle2 size={15} strokeWidth={2.4} /> Play{preview && preview.ok ? ` ${preview.score}` : ''}
                </button>
                <button type="button" className="sc-btn" disabled={!pending.length || thinking} onClick={() => { setPending([]); setArmed(null); }}>
                  <RotateCcw size={14} /> Recall
                </button>
                <button type="button" className="sc-btn" disabled={thinking} onClick={passTurn}>
                  <SkipForward size={14} /> Pass
                </button>
              </div>
            )}
          </div>

          {/* the bag + move log. There is deliberately NO tracker: the bag is
              printed here, the board is in front of you, and the subtraction is
              the puzzle. Handing over their rack was the launch version's
              mistake, and it made the deduction ornamental. */}
          <div style={{ flex: '1 1 190px', minWidth: 180 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, marginBottom: 6 }}>
              The bag &middot; {BAG_SIZE} tiles
            </div>
            <div className="sc-bag">
              {BAG_ROWS.map(([L, n]) => (
                <span key={L}><b>{L}</b>{n}</span>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: FADED, fontWeight: 600, marginTop: 7, lineHeight: 1.55 }}>
              No blanks. Nothing left to draw, so their <b style={{ color: INK }}>{foeRack.length} tiles</b> are whatever this bag has left once you subtract the board and your own rack.
            </div>

            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, margin: '16px 0 6px' }}>Moves</div>
            <div className="sc-log">
              {g.log.length ? g.log.map((m, i) => (
                <div key={i} style={{ color: m.who === 'you' ? `var(--stg-ink, ${COLORS.ink})` : COLORS.foe }}>
                  {m.who === 'you' ? 'You' : 'Them'} &middot; {m.word.toLowerCase()} {m.score ? <b>{m.score}</b> : ''}
                </div>
              )) : <span style={{ color: FADED }}>No plays yet.</span>}
              {g.status === 'done' && g.adj !== 0 && (
                <div style={{ color: g.adj > 0 ? COLORS.green : `var(--stg-bad, ${COLORS.rust})`, marginTop: 4 }}>
                  racks &middot; {signed(g.adj)}
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && !endHold.held && (
            <>
              <div style={{ maxWidth: 480, margin: '16px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 500, color: won ? COLORS.green : beat ? COLORS.gold : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{signed(spread)}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {won ? `The benchmark was ${signed(BENCH)}. You matched the book line.` : beat ? `You beat them by ${spread}. The benchmark was ${signed(BENCH)}, and greedy play gets ${signed(PUZZLE.greedy)}.` : `The benchmark was ${signed(BENCH)}. Greedy play gets ${signed(PUZZLE.greedy)}.`}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>
                      {g.over === 'you-out' ? 'You went out first.' : g.over === 'foe-out' ? 'They went out first.' : 'The board closed out.'} {elapsed}
                    </span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>A fresh endgame in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A fresh endgame lands at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/babel?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s position &rarr;</a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/babel" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Babel &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </>
          )}
          </div>
          <EndHoldNote show={LOFT} note={endHold.note} />
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Babel"
              catRank={catRank}
              outcome={verdictTone}
              title={verdictWord}
              detail={`${spread} spread \u00b7 ${BENCH} benchmark \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Babel all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Stuck"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/babel?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Babel', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/babel?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="babel" name="Babel" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="babel" name="Babel" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="babel"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="babel" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Babel to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s endgame, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>).
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
        </div>
      </div>

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard
          modal
          self="babel"
          won={won}
          completed
          score={<>{signed(spread)} spread &middot; benchmark {signed(BENCH)}</>}
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
            <button className="sc-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Babel</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Babel is a free daily word puzzle from Mind Loft: a word tile game picked up at the very end. The bag is empty, you hold five tiles and your opponent holds the rest, and the last few plays decide everything. Because nothing is left to draw, their rack is not a mystery. It is the bag minus the board minus your own tiles, which is exactly the arithmetic tournament players do on a tracking sheet. Babel prints the bag and leaves the subtraction to you.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          You are scored on spread: your points from here minus your opponent&rsquo;s. Going out first is the prize, because their leftover tiles come off their score and land on yours. That makes the real question a familiar one to any endgame player: race, or block the lane they need and make them sit on a tile they cannot play. Every position ships with a benchmark computed by the same solver that plays the defence, so it is always reachable and never a guess.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The bag is 65 tiles, weighted toward the common letters, with the Q in and no blanks. It is smaller than a full-size set because the board is 11 by 11, and it is printed on the page rather than left for you to remember. A fresh endgame lands every day at midnight Eastern, and the Sunday Edition deals six tiles a side instead of five. No app, no signup, play free in your browser and race the daily leaderboard. More dailies: <a href="/tuck" style={{ color: INK, fontWeight: 800 }}>Tuck</a>, our tile-tucking word puzzle, <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, our daily chess finish, and <a href="/lode" style={{ color: INK, fontWeight: 800 }}>Lode</a>, where rare words pay.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
