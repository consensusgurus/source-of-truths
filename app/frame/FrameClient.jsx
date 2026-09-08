'use client';

// Frame — the daily frame sudoku.
//
// An ordinary 9×9 sudoku plus a number outside EVERY row and column end: the
// sum of the first three squares reading in from that edge. Thirty-six sums,
// all printed, every board, the way Sando prints all eighteen of its sandwich
// clues: the gutter is the game, so the board never withholds any of it. The
// ramp is the digits printed INSIDE the grid, Mon 14 down to Sat 4, and the
// Sunday Edition prints two.
//
// The board is an 11×11 grid: the 9×9 sudoku in the middle, the gutter on all
// four sides. Select a square and the two sums that speak about it (its row's
// on the side nearest it, its column's on the end nearest it) light up, and a
// gutter whose three squares are all filled marks itself right or wrong.
//
// Nothing about the RULES changes in code. A sum constrains which digits go
// where but never lets a digit repeat, so the note scrubber, the peer
// highlight and the win check are the ordinary sudoku ones.
//
// Classic sudoku manners: a wrong digit is NOT flagged, it looks like any
// other entry, and the grid is accepted only once every square is right.
// A solve is a flat 10 and the daily leaderboard is a race on the clock, the
// same lane as every sudoku on the slate. Forked from DiagClient.jsx (same
// 9×9 geometry) with the diagonal rule taken out and the gutter put in.
// Same daily plumbing as every other board: banked puzzles gated by Eastern
// date on the server (app/frame/page.js), per-puzzle localStorage saves,
// /frame?p=N archive pinning, streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone, Pencil, Eraser, Trash2 } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import { isLoft } from '@/lib/loft';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

// Frame's legacy slate hue is AMBER. The page itself is painted by the Sudoku
// category ramp (lib/category-ramp.js), so this pair only tells Frame apart
// from its siblings in the one table that still carries a per-game colour:
// Suds orange, Quilt magenta, Cages purple, Sando teal, Mercury deep red,
// Polka kelly green, Towers steel sky, Sixes royal blue, Knight indigo, Diag
// cyan and Whittle brown.
// Every colour the board uses derives from COLORS.accent below rather than a
// literal hex a second time (the forked-sudoku lesson).
const ACCENT = '#b45309';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#fdf3e3',
  accentTint: '#f9dfb5',       // a square holding the highlighted digit
  accentPick: '#f3c886',       // the selected square
  accentDeep: '#7a3608',       // pressed / shadow
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_frame_help_seen';
const STATS_KEY = 'sot_frame_stats';

// ─── 9×9 geometry, the classic grid. ────────────────────────────────────────
const N = 9;                 // digits, and the side of the grid
const CELLS = 81;
const BOX_H = 3;             // a box is 3 rows tall
const BOX_W = 3;             // and 3 columns wide
const boxOf = (r, c) => Math.floor(r / BOX_H) * BOX_H + Math.floor(c / BOX_W);
const GRID_MAX = 468;        // px — the same width Suds gives a 9×9

// The gutter. Each side carries nine entries, one per column (top, bottom)
// or row (left, right), and each entry speaks about the three squares of that
// line nearest its edge, reading inward. GUT is the gutter track as a share of
// a square; the grid is 11×11 with the sudoku in the middle.
const SIDES = ['top', 'bottom', 'left', 'right'];
const GUT = 0.66;
const GUT_PX = Math.round((GRID_MAX / N) * GUT);
const tripleCells = (side, k) => {
  if (side === 'top') return [k, N + k, 2 * N + k];
  if (side === 'bottom') return [8 * N + k, 7 * N + k, 6 * N + k];
  if (side === 'left') return [k * N, k * N + 1, k * N + 2];
  return [k * N + 8, k * N + 7, k * N + 6];
};
// The gutter entries that speak about square i: at most one per axis.
const GUTTERS_OF = Array.from({ length: CELLS }, (_, i) => {
  const r = Math.floor(i / N), c = i % N, out = [];
  if (r < 3) out.push(['top', c]);
  if (r > 5) out.push(['bottom', c]);
  if (c < 3) out.push(['left', r]);
  if (c > 5) out.push(['right', r]);
  return out;
});

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

// ─── personal stats + streak (localStorage), the shared daily pattern ───────
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

function freshState() {
  return {
    v: 1,
    cells: Array(CELLS).fill(0),   // player digit per square (0 = empty; clues live in GIVEN)
    notes: Array(CELLS).fill(0),   // pencil-mark bitmask per square (bit d set = candidate d)
    hintUsed: false,
    status: 'playing',             // playing | won | revealed
    t0: null,                      // stays null until the player presses Start: opening
    tEnd: null,                    // a game is not starting one (see CLAUDE.md)
  };
}

// Light haptics on supported devices (no-op on desktop / unsupported browsers).
const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60], note: [6] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function FrameClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const GIVEN = PUZZLE.given;
  const SOL = PUZZLE.sol;
  const STORE_KEY = `sot_frame_${PUZZLE.num}`;
  // The gutter clues, by side: nine sums per side, every one printed.
  const GUTTER = PUZZLE.sums;
  const givenFlat = useMemo(() => GIVEN.flat(), [GIVEN]);
  const solFlat = useMemo(() => SOL.flat(), [SOL]);
  const FREE = useMemo(() => {
    const out = [];
    for (let i = 0; i < CELLS; i++) if (!givenFlat[i]) out.push(i);
    return out;
  }, [givenFlat]);

  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(-1);          // selected square index, -1 = none
  const [armed, setArmed] = useState(0);       // digit-first: the "picked up" number (0 = none)
  const [canUndo, setCanUndo] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (lib/hint-gate.js). Eligibility is re-read
  // whenever stats change, so the server-history merge can revoke it for a
  // returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('frame', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('frame'); }, [g.hintUsed]);
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
  const undoRef = useRef([]);
  const longRef = useRef(false);
  const longTimer = useRef(null);

  const cells = g.cells;
  const notes = g.notes;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('frame');
  const STAGE = isStage('frame', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('frame');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('frame'), '--stg-acc-lt': gameColorLight('frame'), '--stg-onramp-lt': gameOnrampLight('frame'), '--stg-acc-ink-lt': gameAccentInkLight('frame') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'frame', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'frame', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'frame', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'frame', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'frame', active: LOFT && !playing });

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === CELLS) {
          setG({ ...freshState(), ...saved, notes: Array.isArray(saved.notes) && saved.notes.length === CELLS ? saved.notes : Array(CELLS).fill(0) });
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
    // same-device day breadcrumb for cross-puzzle recs — TODAY'S puzzle only,
    // and only once the clock is actually running (t0), because a save file
    // says 'playing' from the first render whether or not anyone has moved.
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_frame_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_frame_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. Ticked from state while the game runs so the readout moves
  // on its own; the elapsed time RECORDED on the result is still a real
  // Date.now() delta taken at the moment the game ends.
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

  // ---- metrics + leaderboard (the shared /api/quiz/* flow) ----
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

  useEffect(() => {
    if (!armClear) return undefined;
    const t = setTimeout(() => setArmClear(false), 4000);
    return () => clearTimeout(t);
  }, [armClear]);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // A digit placed all nine times greys out on the pad. This counts EVERY
  // placement, right or wrong, because counting only the correct ones would
  // leak which entries are wrong, and this game never tells you that.
  const padCounts = useMemo(() => {
    const cnt = {};
    for (let i = 0; i < CELLS; i++) { const v = givenFlat[i] || cells[i]; if (v) cnt[v] = (cnt[v] || 0) + 1; }
    return cnt;
  }, [cells, givenFlat]);
  const digitDone = useMemo(() => {
    const out = {};
    for (let d = 1; d <= N; d++) out[d] = (padCounts[d] || 0) >= N;
    return out;
  }, [padCounts]);

  const filledCount = useMemo(() => FREE.reduce((n, i) => n + (cells[i] ? 1 : 0), 0), [cells, FREE]);
  const hasEntries = useMemo(() => cells.some((v) => v) || notes.some((v) => v), [cells, notes]);

  function isSolved(cs) {
    for (const i of FREE) if (cs[i] !== solFlat[i]) return false;
    return true;
  }

  const REC_KEY = `sot_frame_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts. Opening the puzzle and
    // dismissing the start gate does not log a 0-score attempt.
    const acted = g.cells.some((v) => v) || g.notes.some((v) => v) || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: 0, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Nothing is counted against you here, so the daily leaderboard (score,
        // then guesses, then time) resolves every solver tie on the clock alone.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Remove a candidate from the notes of every square this one can SEE: its
  // row, its column and its box. A gutter clue never makes a digit repeat, so
  // the ordinary sudoku peers are the whole set.
  function scrubPeerNotes(noteArr, idx, d) {
    const r = Math.floor(idx / N), c = idx % N, b = boxOf(r, c), m = 1 << d;
    for (let j = 0; j < CELLS; j++) {
      const rr = Math.floor(j / N), cc = j % N;
      if (rr === r || cc === c || boxOf(rr, cc) === b) { if (noteArr[j] & m) noteArr[j] = noteArr[j] & ~m; }
    }
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // ---- undo (board positions only; a spent hint stays spent) ----
  function pushUndo() {
    undoRef.current = [...undoRef.current.slice(-49), { cells: cells.slice(), notes: notes.slice() }];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || !playing) return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    setSel(-1);
    setG((cur) => ({ ...cur, cells: prev.cells.slice(), notes: prev.notes.slice() }));
  }

  const nextEmpty = (cs, from) => {
    for (let k = 1; k <= CELLS; k++) { const i = (from + k) % CELLS; if (!givenFlat[i] && !cs[i]) return i; }
    return -1;
  };

  function toggleNote(idx, d) {
    if (!playing || idx < 0 || givenFlat[idx] || cells[idx]) return;
    pushUndo();
    const nextNotes = notes.slice();
    nextNotes[idx] = nextNotes[idx] ^ (1 << d);
    setG({ ...g, notes: nextNotes });
  }

  // Core placement. `advance` moves the selection to the next empty square, for
  // pad/keyboard fills of the selected square, NOT for tap-to-place in
  // digit-first mode (there the player is already choosing each square).
  function placeDigit(idx, d, advance) {
    if (!playing || idx < 0 || givenFlat[idx]) return;
    if (cells[idx] === d) { eraseCell(idx); return; } // re-tap the same digit clears it
    pushUndo();
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = d;
    nextNotes[idx] = 0;
    // The entry is never checked against the solution here, so a wrong digit is
    // placed and shown exactly like a right one. Placing a number clears it from
    // peer pencil marks the way every sudoku does, right or wrong.
    scrubPeerNotes(nextNotes, idx, d);
    const g2 = { ...g, cells: nextCells, notes: nextNotes };
    if (!g2.t0) g2.t0 = Date.now();
    if (isSolved(nextCells)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2);
      setJustWon(true);
      return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    // No per-square feedback. If the grid is full but wrong, nudge at the board
    // level without pointing at the bad square.
    if (FREE.every((i) => nextCells[i])) say('Every square is filled, but the grid is not solved yet. Look for a repeated digit.');
    if (advance) { const nx = nextEmpty(nextCells, idx); if (nx >= 0) setSel(nx); }
  }

  function enterDigit(idx, d) {
    if (noteMode) { toggleNote(idx, d); return; }
    placeDigit(idx, d, true);
  }

  // Number pad. With a square selected it fills that square and does NOT arm the
  // digit, so classic tapping never leaves a number stuck active. With nothing
  // selected it toggles the armed digit for digit-first placement.
  function padTap(d) {
    if (sel >= 0 && !givenFlat[sel]) {
      if (noteMode) toggleNote(sel, d);
      else placeDigit(sel, d, true);
      return;
    }
    setArmed((a) => (a === d ? 0 : d));
  }

  function eraseCell(idx) {
    if (!playing || idx < 0 || givenFlat[idx]) return;
    if (!cells[idx] && !notes[idx]) return;
    pushUndo();
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = 0;
    nextNotes[idx] = 0;
    setG({ ...g, cells: nextCells, notes: nextNotes });
  }

  // Clear the whole board: every digit and pencil mark the player put down goes
  // away and the printed clues stay. It sits between Erase (one square) and
  // Replay (a brand new game): the clock, the hint and the save slot are all
  // untouched, so it is a fresh grid inside the same run. Undoable like any move.
  function clearBoard() {
    if (!playing || !hasEntries) return;
    if (!armClear) { setArmClear(Date.now()); return; }
    if (Date.now() - armClear < ARM_MIN_MS) return;
    setArmClear(false);
    pushUndo();
    setSel(-1);
    setArmed(0);
    setG((cur) => ({ ...cur, cells: Array(CELLS).fill(0), notes: Array(CELLS).fill(0) }));
    say('Board cleared, back to the printed clues. Undo brings it back.');
  }

  function cellClick(idx) {
    if (longRef.current) { longRef.current = false; return; }
    if (armed) {
      if (givenFlat[idx]) return;
      if (noteMode) toggleNote(idx, armed);
      else placeDigit(idx, armed, false);
      return;
    }
    if (idx === sel) { setSel(-1); return; }
    setSel(idx);
  }

  // Long-press a square to pencil the armed digit without switching Notes mode.
  function pencilCell(idx) {
    if (!playing || idx < 0 || givenFlat[idx] || cells[idx] || !armed) return false;
    toggleNote(idx, armed);
    vibrate(HAPT.note);
    return true;
  }
  const startLong = (idx) => {
    longRef.current = false;
    if (longTimer.current) clearTimeout(longTimer.current);
    longTimer.current = setTimeout(() => { longRef.current = pencilCell(idx); }, 450);
  };
  const cancelLong = () => { if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; } };

  // One free hint: fill the correct digit into the selected empty square, else
  // the first empty square in reading order.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    let idx = (sel >= 0 && !givenFlat[sel] && cells[sel] !== solFlat[sel]) ? sel : -1;
    if (idx < 0) idx = FREE.find((i) => cells[i] !== solFlat[i]);
    if (idx == null || idx < 0) return;
    const d = solFlat[idx];
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = d;
    nextNotes[idx] = 0;
    scrubPeerNotes(nextNotes, idx, d);
    const g2 = { ...g, cells: nextCells, notes: nextNotes, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(idx);
    if (isSolved(nextCells)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    say('Hint placed, one square filled in.');
  }

  function revealEnd() {
    const next = solFlat.slice();
    const g2 = { ...g, cells: next.map((v, i) => (givenFlat[i] ? 0 : v)), notes: Array(CELLS).fill(0), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    setG(freshState()); setSel(-1); setArmed(0); setJustWon(false); setNoteMode(false); setEndClosed(false);
  }

  // desktop keyboard: arrows move, 1–9 fill, 0/Backspace erase, N toggles notes
  const onKey = useCallback((e) => {
    if (!playing) return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'Escape') { setArmed(0); setSel(-1); return; }
    if (k === 'n' || k === 'N') { setNoteMode((m) => !m); return; }
    if (k === 'Tab') { e.preventDefault(); const nx = nextEmpty(cells, sel < 0 ? CELLS - 1 : sel); if (nx >= 0) setSel(nx); return; }
    if (sel < 0) return;
    const r = Math.floor(sel / N), c = sel % N;
    if (k === 'ArrowUp') { e.preventDefault(); setSel(((r + N - 1) % N) * N + c); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setSel(((r + 1) % N) * N + c); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); setSel(r * N + (c + N - 1) % N); return; }
    if (k === 'ArrowRight') { e.preventDefault(); setSel(r * N + (c + 1) % N); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { eraseCell(sel); return; }
    if (/^[1-9]$/.test(k)) { enterDigit(sel, Number(k)); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, noteMode, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    // Nine orange squares, one line. No board state leaks: it is all nine or
    // none, exactly like the score.
    const squares = won ? '\u{1F7E7}'.repeat(N) : '⬜'.repeat(N);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Frame #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · solved in ${elapsed}${hintBit}${streakBit}`
      : `Frame #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/frame${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Frame #${PUZZLE.num} — the daily frame sudoku from Mind Loft.\n${shareUrl()}`
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

  // ── selection-aware highlighting ──
  const selVal = sel >= 0 ? (givenFlat[sel] || cells[sel]) : 0;
  const hlVal = armed || selVal;
  const selR = sel >= 0 ? Math.floor(sel / N) : -1;
  const selC = sel >= 0 ? sel % N : -1;
  const selB = sel >= 0 ? boxOf(selR, selC) : -1;
  // The gutter entries that speak about the selected square, as "side:k"
  // keys for an O(1) test per gutter cell.
  const selGutters = useMemo(() => new Set(sel >= 0 ? GUTTERS_OF[sel].map(([s, k]) => `${s}:${k}`) : []), [sel]);
  // Per gutter entry: are its three squares all filled, and do they satisfy
  // the clue? Read live off the board so a finished gutter can mark itself.
  const tripleState = (side, k) => {
    const clue = GUTTER[side][k];
    if (clue == null) return null;
    const vals = tripleCells(side, k).map((i) => givenFlat[i] || cells[i]);
    if (vals.some((v) => !v)) return { full: false };
    const sum = vals[0] + vals[1] + vals[2]; return { full: true, ok: sum === clue, diff: sum - clue };
  };

  // One gutter entry. `on` when the selection is among its three squares,
  // `done` once they are all filled, and then a mark: right or wrong.
  function gutterCell(side, k) {
    const clue = GUTTER[side][k];
    const st = tripleState(side, k);
    const on = selGutters.has(`${side}:${k}`) && clue != null;
    const cls = `fr-gut fr-${side}${on ? ' on' : ''}${st && st.full ? ' done' : ''}`;
    const line = side === 'top' || side === 'bottom' ? `Column ${k + 1}` : `Row ${k + 1}`;
    const edge = side === 'top' ? 'top' : side === 'bottom' ? 'bottom' : side === 'left' ? 'left' : 'right';
    const title = `${line}: its three squares nearest the ${edge} edge total ${clue}${st && st.full ? (st.ok ? '. They do.' : st.diff > 0 ? `. They run ${st.diff} over.` : `. They are ${-st.diff} short.`) : ''}`;
    return (
      <div key={`${side}${k}`} className={cls} title={title}>
        <span>{clue}</span>
        {st && st.full && <span className={`fr-mark${st.ok ? ' ok' : ' off'}`} aria-hidden="true">{st.ok ? '\u2713' : (st.diff > 0 ? `+${st.diff}` : String(st.diff))}</span>}
      </div>
    );
  }

  // The heavy rules fall on the BOX edges, after columns 2 and 5 and rows 2
  // and 5, derived from BOX_W / BOX_H rather than typed out.
  function cellStyle(idx) {
    const r = Math.floor(idx / N), c = idx % N, b = boxOf(r, c);
    const isSel = idx === sel;
    const peer = sel >= 0 && !isSel && (r === selR || c === selC || b === selB);
    const val = givenFlat[idx] || cells[idx];
    const sameVal = hlVal && val === hlVal && !isSel;
    // The heavy rules fall on every box edge INCLUDING the outer four, since the
    // container now wraps the gutters too and cannot carry the frame itself.
    const heavyR = c % BOX_W === BOX_W - 1;
    const heavyB = r % BOX_H === BOX_H - 1;
    const heavy = '2.5px solid var(--stg-line3, rgba(28,30,36,0.85))';
    // Same conversion Sixes needed: the digits moved to the stage's ink while
    // the cells stayed white, so the whole grid rendered pale-on-white. Tokens
    // with the Loft value as the fallback, so the Loft render is unchanged.
    let bg = STAGE ? 'var(--stg-cell)' : T.white;
    if (peer) bg = STAGE ? 'color-mix(in srgb, var(--stg-ink) 18%, var(--stg-cell))' : '#f3f5f8';
    if (sameVal) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 34%, var(--stg-cell))' : COLORS.accentTint;
    if (isSel) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 48%, var(--stg-cell))' : COLORS.accentPick;
    return {
      background: bg,
      boxShadow: isSel ? `inset 0 0 0 2.5px var(--stg-acc, ${COLORS.accent})` : undefined,
      borderRight: `${heavyR ? 2.5 : 1}px solid ${heavyR ? 'var(--stg-line3, rgba(28,30,36,0.85))' : 'var(--stg-cell-line, rgba(28,30,36,0.18))'}`,
      borderBottom: `${heavyB ? 2.5 : 1}px solid ${heavyB ? 'var(--stg-line3, rgba(28,30,36,0.85))' : 'var(--stg-cell-line, rgba(28,30,36,0.18))'}`,
      borderLeft: c === 0 ? heavy : undefined,
      borderTop: r === 0 ? heavy : undefined,
    };
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="An ordinary sudoku, plus a number outside every row and column end: the total of the first three squares reading in from that edge. Thirty-six sums, every one printed. Rows, columns and boxes still hold 1 to 9 exactly once."
      steps={[
        <><b>Tap a square then tap a number</b>, or pick a number first and tap every square it goes in. On desktop the <b>arrow keys and number keys</b> work too.</>,
        <>Turn on <b>Notes</b> (or press N) to pencil candidates, or with a number picked just <b>long-press</b> a square to pencil it.</>,
        <><b>Undo</b> (or Ctrl+Z) takes back your last move. <b>Clear</b> wipes every number you have entered and leaves the printed clues.</>,
      ]}
      knack="Start at the extremes. A 6 can only be 1, 2 and 3, and a 24 only 7, 8 and 9, and each of those pins three squares at once and knocks the same digits out of the rest of the box. A row's left sum and right sum together account for six of its nine squares, so the middle three are what is left of 45. Select any square and the two sums that speak about it light up."
      footer="Every board has exactly one solution and can always be reached by logic, with no guessing, and on every board the gutter is doing real work: the printed digits alone would fit more than one grid. Solve it and you score a perfect 10, and because nothing is counted against you, the daily leaderboard is a straight race on the clock. One free hint, on your first ever play, fills a correct number. Printed digits fall through the week from 14 on Monday to 4 on Saturday, and the Sunday Edition prints two."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="frame" name="Frame" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Frame is scored all or nothing, so the outcome is only ever won or
          lost; there is no partial state for the amber cap to carry. */}
      {LOFT && (
        <Cap gameKey="frame" quizId={PUZZLE.quizId}
          name="Frame"
          cat="Sudoku"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Two digits' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${filledCount}/${FREE.length}`, k: 'filled' },
          ]}
        />
      )}
      <div className="fr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.fr-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .fr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .fr-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .fr-cell{display:flex;align-items:center;justify-content:center;font-family:${MONO};box-sizing:border-box;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;}
          .fr-given{font-weight:700;color:${INK};}
          .fr-user{font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});}
          .fr-notes{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);width:100%;height:100%;padding:2px;box-sizing:border-box;}
          .fr-note{display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:9px;line-height:1;color:var(--stg-ink2, #8a93a3);}
          /* the gutter: mono, tight, and leaning toward the grid it labels */
          .fr-gut{display:flex;align-items:center;justify-content:center;gap:2px;font-family:${MONO};font-weight:500;font-size:clamp(11px,3vw,16px);color:${INK};box-sizing:border-box;user-select:none;line-height:1;white-space:nowrap;}
          .fr-gut.fr-top{flex-direction:column;justify-content:flex-end;padding-bottom:3px;}
          .fr-gut.fr-bottom{flex-direction:column;justify-content:flex-start;padding-top:3px;}
          .fr-gut.fr-left{justify-content:flex-end;padding-right:4px;}
          .fr-gut.fr-right{justify-content:flex-start;padding-left:4px;}
          .fr-mark{font-family:${MONO};font-weight:700;font-size:clamp(8px,2vw,11px);line-height:1;letter-spacing:0;}
          .fr-mark.ok{color:var(--stg-good, ${COLORS.green});}
          .fr-mark.off{color:var(--stg-bad, ${COLORS.rust});}
          .fr-gut.on{color:var(--stg-acc-ink, ${COLORS.accent});font-weight:700;background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);border-radius:4px;}
          .fr-gut.done{color:var(--stg-mute, #c3c8cf);}
          .fr-pad{width:100%;aspect-ratio:1;border-radius:9px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.5));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-family:${MONO};font-weight:500;color:${INK};cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 2px 0 rgba(28,30,36,0.4);}
          .fr-pad:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(28,30,36,0.4);}
          .fr-pad.done{color:var(--stg-mute2, #c3c8cf);box-shadow:none;background:${STAGE ? 'var(--stg-surf2)' : '#f4f5f7'};cursor:default;}
          .fr-pad.done span{text-decoration:line-through;}
          .fr-pad.armed{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 2px 0 var(--stg-acc, ${COLORS.accentDeep});}
          .fr-pad.armed .fr-pad-n{color:${STAGE ? 'color-mix(in srgb, var(--stg-onramp, #08222e) 68%, transparent)' : COLORS.accentTint};}
          .fr-pad .fr-pad-n{position:absolute;bottom:2px;right:4px;font-size:8px;color:var(--stg-mute2, #aab0bb);font-weight:500;}
          .fr-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .fr-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
        `}</style>

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="frame"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Two digits</span>}
          blocks={'FRAME'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* Start tile — sits where the board goes until the player presses
            Start, which begins the clock. The grid stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Frame is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>An ordinary sudoku, plus a number outside every row and column end: the total of the first three squares reading in from that edge. Rows, columns and boxes still hold 1 to 9 exactly once.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="fr-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* Both figures move UP into the cap on a loft page; printing them
              twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>filled <b style={{ color: filledCount === FREE.length ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{filledCount}</b>/{FREE.length}</span>
          </div>
          )}

          {/* 11×11: the gutter on all four sides, the 9×9 sudoku in the middle.
              The gutter tracks are narrower than a square so the grid still
              reads as the subject and the clues as the margin. */}
          <div style={{ maxWidth: GRID_MAX + 2 * GUT_PX, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `${GUT}fr repeat(${N}, minmax(0, 1fr)) ${GUT}fr`, gridTemplateRows: `${GUT}fr repeat(${N}, minmax(0, 1fr)) ${GUT}fr`, aspectRatio: '1' }}>
              <div aria-hidden="true" />
              {Array.from({ length: N }).map((_, c) => gutterCell('top', c))}
              <div aria-hidden="true" />
              {Array.from({ length: CELLS }).map((_, idx) => {
                const r = Math.floor(idx / N), c = idx % N;
                const given = givenFlat[idx];
                const val = given || cells[idx];
                const cls = `fr-cell ${given ? 'fr-given' : val ? 'fr-user' : ''}`;
                return (
                  <React.Fragment key={idx}>
                  {c === 0 && gutterCell('left', r)}
                  <div className={cls} style={cellStyle(idx)}
                    onClick={() => cellClick(idx)}
                    onPointerDown={() => startLong(idx)}
                    onPointerUp={cancelLong}
                    onPointerLeave={cancelLong}
                    onPointerCancel={cancelLong}>
                    {val ? (
                      <span style={{ fontSize: 'clamp(16px, 5vw, 23px)', position: 'relative', zIndex: 2 }}>{val}</span>
                    ) : notes[idx] ? (
                      <div className="fr-notes" style={{ position: 'relative', zIndex: 2 }}>
                        {Array.from({ length: N }).map((__, k) => (
                          <span key={k} className="fr-note">{(notes[idx] & (1 << (k + 1))) ? k + 1 : ''}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {c === N - 1 && gutterCell('right', r)}
                  </React.Fragment>
                );
              })}
              <div aria-hidden="true" />
              {Array.from({ length: N }).map((_, c) => gutterCell('bottom', c))}
              <div aria-hidden="true" />
            </div>
          </div>

          {/* number pad + tools */}
          {playing && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gap: 5, maxWidth: GRID_MAX, margin: '16px auto 0' }}>
                {Array.from({ length: N }).map((_, k) => {
                  const d = k + 1;
                  const done = digitDone[d];
                  return (
                    <button key={d} className={`fr-pad${done ? ' done' : ''}${armed === d ? ' armed' : ''}`} onClick={() => { if (!done) padTap(d); }} aria-label={`enter ${d}`}>
                      <span style={{ fontSize: 'clamp(15px, 4.5vw, 21px)' }}>{d}</span>
                      {!done && <span className="fr-pad-n">{N - (padCounts[d] || 0)}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button className={`fr-tool${noteMode ? ' on' : ''}`} onClick={() => setNoteMode((m) => !m)} title="Toggle pencil notes (N)">
                  <Pencil size={14} /> Notes {noteMode ? 'on' : 'off'}
                </button>
                <button className="fr-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                  <RotateCcw size={14} /> Undo
                </button>
                <button className="fr-tool" onClick={() => eraseCell(sel)} title="Erase selected square (Backspace)">
                  <Eraser size={14} /> Erase
                </button>
                <button className="fr-tool" onClick={clearBoard} disabled={!hasEntries}
                  title="Clear every number you have entered and start the grid over on the same clock"
                  style={hasEntries
                    ? (armClear
                      ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderColor: 'rgba(192,57,43,0.5)', color: `var(--stg-ink, ${COLORS.rust})` }
                      : undefined)
                    : { opacity: 0.4, cursor: 'default' }}>
                  <Trash2 size={14} /> {armClear ? 'Tap again to clear' : 'Clear'}
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="fr-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(153,27,27,0.5)', color: ACC_DEEP_INK }}>
                    <Lightbulb size={14} /> Hint
                  </button>
                )}
              </div>
            </>
          )}

        {/* Controls sit INSIDE the board card on purpose: on the navy stage a
            bare row of faded text has nothing to sit on. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: armed ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {armed
                ? `Placing ${armed}: tap squares to fill, long-press to pencil. Tap ${armed} again to put it down.`
                : sel >= 0
                  ? (noteMode ? 'Tap a number to pencil it in' : 'Tap a number, or pick a number then tap squares')
                  : 'Tap a square then a number, or pick a number then tap squares'}
            </span>
            {identity && filledCount > 0 && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and fills the solution' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition — two printed digits, against fourteen on a Monday, and the thirty-six sums carry the rest.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Frame in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new frame sudoku drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/frame?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Frame &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/frame" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Frame &rarr;</a>
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
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Frame"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${filledCount}/${FREE.length} filled · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Frame all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            archive={puzzles
              .filter((p) => p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/frame?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished grid', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the solution', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Frame', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/frame?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        {/* end of the play stage; everything below is the light tail */}
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="frame" name="Frame" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="frame" name="Frame" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {/* The tail is gone on a loft page: the end card already carries the
              board, the day, what to play next and the archive. */}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="frame"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="frame" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Frame to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s frame sudoku, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s frame sudoku, every day.
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

      {/* end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="frame"
          won={won}
          headline={won ? <>Grid solved!</> : <>Grid revealed</>}
          subline={won
            ? <>solved in {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>the solved grid is shown above</>}
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
            <button className="fr-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Frame — crawlable prose, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Frame</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Frame is a free daily frame sudoku from Mind Loft. Each day gives you a 9×9 grid with a number printed outside every row and column end: the sum of the three squares nearest that edge, reading inward. Thirty-six sums, all printed, every day, and rows, columns and 3×3 boxes still hold 1 through 9 exactly once. The sums do so much of the work that the board prints far fewer digits than an ordinary sudoku needs.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The reasoning is arithmetic on a fixed group of three: a 6 is 1, 2 and 3 in some order, a 24 is 7, 8 and 9, and the middle values are where the deduction lives. Select a square and the two sums that speak about it light up. Every board has a single solution you can always reach by logic, with no guessing, and on every board the gutter is load-bearing rather than decorative: the printed digits alone would fit more than one grid. Wrong entries are never flagged, so spotting your own slips is part of the puzzle, and a clean solve scores a perfect 10 with the daily leaderboard decided on the clock.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern; weekdays print fewer digits as the week goes on, from 14 on Monday down to 4 on Saturday, and the Sunday Edition prints two. No app, no signup, play free in your browser. Want the rest of the family? Try <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, the classic 9×9, <a href="/sando" style={{ color: INK, fontWeight: 800 }}>Sando</a>, the sandwich sudoku, <a href="/rim" style={{ color: INK, fontWeight: 800 }}>Rim</a>, the outside sudoku with nothing printed inside, and <a href="/diag" style={{ color: INK, fontWeight: 800 }}>Diag</a>, the one with the diagonals.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
