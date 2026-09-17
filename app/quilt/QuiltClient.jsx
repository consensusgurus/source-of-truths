'use client';

// Quilt — the daily 9×9 jigsaw sudoku.
//
// Each day: a 9×9 grid with printed clues. Fill every empty cell 1–9 so no
// digit repeats in any row, column, or region. The nine 3×3 boxes of an ordinary
// sudoku are replaced by nine connected irregular regions of nine cells each,
// carried per puzzle in `reg` and drawn here as a tint plus a heavy outline.
// There is exactly one solution, and it is always reachable without guessing.
// Classic sudoku: a wrong digit is NOT flagged — it looks like any other entry,
// and the grid is accepted only once every square is correct. A solve scores a
// perfect 10, and the daily leaderboard ranks solvers by fastest time.
// Notes let you pencil candidates; one free hint fills a correct cell.
//
// Same daily plumbing as Tally/Span: banked boards gated by Eastern date on the
// server (app/quilt/page.js), per-puzzle localStorage saves, /quilt?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow. Weekdays are
// a standard board; Sundays step up to a harder Edition with fewer clues.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, RotateCcw, X, Lightbulb, Eye, Smartphone, Pencil, Eraser, Trash2 } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
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
import { regionStyle, regionMix } from '@/lib/category-ramp';
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

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#a21caf',       // Quilt identity — fuchsia, well clear of Suds's orange
  accentSoft: '#fdf4ff',
  green: T.successDeep,        // correctness / solved
  greenSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const HELP_KEY = 'sot_quilt_help_seen';
const STATS_KEY = 'sot_quilt_stats';

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

// ─── Personal stats + streak (localStorage), Tally/Span pattern ─────────────
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
    cells: Array(81).fill(0),   // player digit per cell (0 = empty; givens live in GIVEN)
    notes: Array(81).fill(0),   // pencil-mark bitmask per cell (bit d set = candidate d)
    errors: 0,                  // retained for save-format compatibility; unused in classic mode
    hintUsed: false,
    status: 'playing',          // playing | won | revealed
    t0: null,
    tEnd: null,
  };
}

// Nine region colours, one per region index. THE REGISTER DECIDES HOW MUCH OF
// THE HUE LANDS, not this file: on the stage a cell is its hue mixed into
// --stg-cell by --stg-tint-mix, which is 26% on the dark register and 7% on the
// light one, so the quilt is a set of dark tinted cells on a dark page and a
// set of pale ones on a pale page. The digits stay the loudest thing in the
// cell either way, and the heavy rule along each region edge is what actually
// carries the shape.
//
// WHY THIS IS NOT ONE PALE LIST ANY MORE (owner report, 2026-09-02: "in dark
// mode, the lines showing the regions aren't visible, and the colours don't
// really work on the dark background"). The tints used to be pale in BOTH
// registers, with the digits pinned dark to suit them. That left the region
// rules -- white on the dark register, since they read --stg-line3 -- being
// drawn white on near-white, so every region boundary vanished and a
// near-white slab sat on a near-black page. A surface and its ink move
// TOGETHER; half a conversion is worse than none.
const REGION_HUE = ['#ec4899', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#06b6d4', '#f4643c', '#64748b', '#84cc16'];
// The Loft page (?stage=0) keeps its own pale literals, byte for byte.
const REGION_TINT = ['#fdf2f8', '#eff6ff', '#f0fdf4', '#fefce8', '#faf5ff', '#ecfeff', '#fff7ed', '#f1f5f9', '#f7fee7'];

// Light haptics on supported devices (no-op on desktop / unsupported browsers).
const HAPT = { ok: [8], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60], note: [6] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function QuiltClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const GIVEN = PUZZLE.given;
  // The region map, flattened to cell index. Everything that used to ask
  // "which 3x3 box is this?" asks REG instead.
  const REG = useMemo(() => {
    const f = Array(81).fill(0);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) f[r * 9 + c] = PUZZLE.reg[r][c];
    return f;
  }, [PUZZLE]);
  const SOL = PUZZLE.sol;
  const STORE_KEY = `sot_quilt_${PUZZLE.num}`;
  // flat given lookup + list of the cells the player must fill
  const givenFlat = useMemo(() => {
    const f = Array(81).fill(0);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) f[r * 9 + c] = GIVEN[r][c];
    return f;
  }, [GIVEN]);
  const solFlat = useMemo(() => {
    const f = Array(81).fill(0);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) f[r * 9 + c] = SOL[r][c];
    return f;
  }, [SOL]);
  const FREE = useMemo(() => {
    const out = [];
    for (let i = 0; i < 81; i++) if (!givenFlat[i]) out.push(i);
    return out;
  }, [givenFlat]);

  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(-1);          // selected cell index, -1 = none
  const [armed, setArmed] = useState(0);       // digit-first: the "picked up" number (0 = none)
  const [canUndo, setCanUndo] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);   // Clear board is a two-tap: arm, then confirm
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('quilt', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('quilt'); }, [g.hintUsed]);
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
  const undoRef = useRef([]);      // stack of { cells, notes } snapshots
  const longRef = useRef(false);   // true when the last cell interaction was a long-press
  const longTimer = useRef(null);  // pending long-press timer

  const cells = g.cells;
  const notes = g.notes;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;   // not begun: show the start tile in place of the board
  const started = playing && !!g.t0;   // clock running: show the board
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('quilt');
  const STAGE = isStage('quilt', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('quilt');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('quilt'), '--stg-acc-lt': gameColorLight('quilt'), '--stg-onramp-lt': gameOnrampLight('quilt'), '--stg-acc-ink-lt': gameAccentInkLight('quilt') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'quilt', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'quilt', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'quilt', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'quilt', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'quilt', active: LOFT && !playing });

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
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === 81) {
          setG({ ...freshState(), ...saved, notes: Array.isArray(saved.notes) && saved.notes.length === 81 ? saved.notes : Array(81).fill(0) });
        }
      }
      // The start tile shows in place of the board until the player begins (t0
      // set on Start). First-timers see the full rules on the tile; a returning
      // player gets the compact start card with a "Show instructions" toggle.
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    // same-device day breadcrumb for cross-puzzle recs — TODAY'S puzzle only
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_quilt_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_quilt_day'); })();
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

  // the Clear confirm never sits armed: it falls back on its own after 4s
  useEffect(() => {
    if (!armClear) return;
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
  // Classic sudoku: a solve is always a clean 10; the leaderboard ranks on time.

  // digits placed 9 times (right or wrong) → grey out on the pad. Counting every
  // placement, not just correct ones, keeps the pad from revealing wrong entries.
  const digitDone = useMemo(() => {
    const cnt = {};
    for (let i = 0; i < 81; i++) {
      const v = givenFlat[i] || cells[i];
      if (v) cnt[v] = (cnt[v] || 0) + 1;
    }
    const out = {};
    for (let d = 1; d <= 9; d++) out[d] = (cnt[d] || 0) >= 9;
    return out;
  }, [cells, givenFlat]);

  const filledCount = useMemo(() => FREE.reduce((n, i) => n + (cells[i] ? 1 : 0), 0), [cells, FREE]);
  // anything the player has put down (digits or pencil marks) — gates Clear
  const hasEntries = useMemo(() => cells.some((v) => v) || notes.some((v) => v), [cells, notes]);

  function isSolved(cs) {
    for (const i of FREE) if (cs[i] !== solFlat[i]) return false;
    return true;
  }

  const REC_KEY = `sot_quilt_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (placed a digit, penciled
    // a note, made an error, or took the hint). Opening the puzzle and dismissing
    // the start gate does not log a 0-score attempt.
    const acted = g.cells.some((v) => v) || g.notes.some((v) => v) || g.errors > 0 || g.hintUsed;
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
        // No error tracking in classic mode, so the daily leaderboard (score,
        // then guesses, then time) resolves solver ties purely on fastest finish.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // remove a candidate from the notes of a cell's row/column/box peers
  function scrubPeerNotes(noteArr, idx, d) {
    const r = Math.floor(idx / 9), c = idx % 9, b = REG[idx], m = 1 << d;
    for (let j = 0; j < 81; j++) {
      const rr = Math.floor(j / 9), cc = j % 9;
      if (rr === r || cc === c || REG[j] === b) { if (noteArr[j] & m) noteArr[j] = noteArr[j] & ~m; }
    }
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // ---- undo (restores board positions only; committed errors/hint stay) ----
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

  // next empty (non-given, unfilled) cell after `from`, wrapping around
  const nextEmpty = (cs, from) => {
    for (let k = 1; k <= 81; k++) { const i = (from + k) % 81; if (!givenFlat[i] && !cs[i]) return i; }
    return -1;
  };

  function toggleNote(idx, d) {
    if (!playing || idx < 0 || givenFlat[idx] || cells[idx]) return; // no notes on a filled/given cell
    pushUndo();
    const nextNotes = notes.slice();
    nextNotes[idx] = nextNotes[idx] ^ (1 << d);
    setG({ ...g, notes: nextNotes });
  }

  // core placement. `advance` moves the selection to the next empty cell — used
  // for pad/keyboard fills of the selected cell, NOT for tap-to-place in
  // digit-first mode (there the player is already choosing each cell).
  function placeDigit(idx, d, advance) {
    if (!playing || idx < 0 || givenFlat[idx]) return;
    if (cells[idx] === d) { eraseCell(idx); return; } // re-tap the same digit clears the cell
    pushUndo();
    const nextCells = cells.slice();
    const nextNotes = notes.slice();
    nextCells[idx] = d;
    nextNotes[idx] = 0; // a filled cell carries no pencil marks
    // Classic sudoku: the entry is never checked against the solution here, so a
    // wrong digit is placed and shown exactly like a right one. Placing a number
    // clears it from peer pencil marks the way every sudoku app does, right or wrong.
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
    // No per-tile feedback. If every square is now filled but the grid is not the
    // solution, nudge at the board level without pointing to the wrong square.
    if (FREE.every((i) => nextCells[i])) say('Every square is filled, but the grid is not solved yet. Look for a repeated digit.');
    if (advance) { const nx = nextEmpty(nextCells, idx); if (nx >= 0) setSel(nx); }
  }

  // keyboard dispatcher: honors the Notes toggle, advances on a pad-style fill
  function enterDigit(idx, d) {
    if (noteMode) { toggleNote(idx, d); return; }
    placeDigit(idx, d, true);
  }

  // number pad. With a cell selected it fills that cell (cell-first) and does
  // NOT arm the digit, so classic tapping never leaves a number "stuck" active.
  // With no cell selected it toggles the armed digit for digit-first placement,
  // so tapping the same number again cleanly puts it down.
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
  // away and the printed clues stay. This sits between Erase (one square) and
  // Replay (a brand new game): the clock, the hint, and the save slot are all
  // untouched, so it is a fresh grid inside the same run. Undoable like any move.
  function clearBoard() {
    if (!playing || !hasEntries) return;
    if (!armClear) { setArmClear(true); return; }   // first tap arms, second wipes
    setArmClear(false);
    pushUndo();
    setSel(-1);
    setArmed(0);
    setG((cur) => ({ ...cur, cells: Array(81).fill(0), notes: Array(81).fill(0) }));
    say('Board cleared, back to the printed clues. Undo brings it back.');
  }

  function cellClick(idx) {
    if (longRef.current) { longRef.current = false; return; } // long-press already penciled
    if (armed) {
      if (givenFlat[idx]) return; // stay in digit-first; ignore printed clues
      // place without moving the selection, so the armed digit stays decoupled
      // from any cell and re-tapping it on the pad puts it down cleanly
      if (noteMode) toggleNote(idx, armed);
      else placeDigit(idx, armed, false);
      return;
    }
    if (idx === sel) { setSel(-1); return; } // tap the selected cell again to deselect
    setSel(idx);
  }

  // long-press a cell to pencil the armed digit as a note, without switching the
  // global Notes mode. No-op when no digit is armed or the cell is filled/given.
  function pencilCell(idx) {
    if (!playing || idx < 0 || givenFlat[idx] || cells[idx] || !armed) return false;
    toggleNote(idx, armed);
    vibrate(HAPT.note);
    return true;
  }
  const startLong = (idx) => {
    longRef.current = false;
    if (longTimer.current) clearTimeout(longTimer.current);
    // longRef is set only if we actually penciled, so a hold with no armed digit
    // still falls through to a normal tap (select the cell)
    longTimer.current = setTimeout(() => { longRef.current = pencilCell(idx); }, 450);
  };
  const cancelLong = () => { if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; } };

  // one free hint: fill a correct digit into the selected empty cell, else the
  // first empty cell in reading order
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
    const g2 = { ...g, cells: next.map((v, i) => (givenFlat[i] ? 0 : v)), notes: Array(81).fill(0), status: 'revealed', tEnd: Date.now() };
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
    if (k === 'Escape') { setArmed(0); setSel(-1); return; } // drop any picked-up number / selection
    if (k === 'n' || k === 'N') { setNoteMode((m) => !m); return; }
    if (k === 'Tab') { e.preventDefault(); const nx = nextEmpty(cells, sel < 0 ? 80 : sel); if (nx >= 0) setSel(nx); return; }
    if (sel < 0) return;
    const r = Math.floor(sel / 9), c = sel % 9;
    if (k === 'ArrowUp') { e.preventDefault(); setSel(((r + 8) % 9) * 9 + c); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setSel(((r + 1) % 9) * 9 + c); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); setSel(r * 9 + (c + 8) % 9); return; }
    if (k === 'ArrowRight') { e.preventDefault(); setSel(r * 9 + (c + 1) % 9); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { eraseCell(sel); return; }
    if (/^[1-9]$/.test(k)) { enterDigit(sel, Number(k)); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, noteMode, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    const g5 = won ? 5 : 0;
    const squares = '\u{1F7E7}'.repeat(g5) + '⬜'.repeat(5 - g5); // orange squares
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Quilt #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · solved in ${elapsed}${hintBit}${streakBit}`
      : `Quilt #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/quilt${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Quilt #${PUZZLE.num} — the daily jigsaw sudoku from Mind Loft.\n${shareUrl()}`
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
  const hlVal = armed || selVal; // an armed digit (digit-first) also lights up its matches
  const selR = sel >= 0 ? Math.floor(sel / 9) : -1;
  const selC = sel >= 0 ? sel % 9 : -1;
  const selB = sel >= 0 ? REG[sel] : -1;

  // THE REGION RULE HAS TO BE THE STRONGEST LINE ON THE GRID or nine irregular
  // shapes stop reading as nine shapes. It used to be --stg-line3, which is
  // white on the dark register and was therefore drawn white on the pale tints;
  // --stg-fieldink is ink AS AN ALPHA CHANNEL (white on dark, near-black on
  // light), so the rule follows the page instead of arguing with it, and it
  // pulls the light register's walls clear of its hairlines at the same time
  // (--stg-line3 is 0.45 there and --stg-cell-line 0.44, so those two were
  // telling each other apart by thickness alone). The hairline BETWEEN two
  // cells of the same region stays --stg-cell-line, which each register
  // already tunes for exactly that job.
  const WALL = `rgba(var(--stg-fieldink, 28,30,36), ${STAGE ? '0.75' : '0.85'})`;
  const HAIR = 'var(--stg-cell-line, rgba(28,30,36,0.18))';
  // On the stage the nine regions index the shared REGION_RAMP (one vocabulary
  // with Carve, Cages, Jesters, Plot and Shards, owner 2026-09-03); the hue is
  // published on the cell by regionStyle() below and mixed in here.
  const regionTint = (b) => (STAGE ? regionMix(1) : (REGION_TINT[b] || T.white));

  function cellStyle(idx) {
    const r = Math.floor(idx / 9), c = idx % 9, b = REG[idx];
    const isSel = idx === sel;
    const peer = sel >= 0 && !isSel && (r === selR || c === selC || b === selB);
    const val = givenFlat[idx] || cells[idx];
    const sameVal = hlVal && val === hlVal && !isSel;
    // The region tint is the resting state, and on the stage the three
    // highlights are mixed INTO it rather than painted over it, so a
    // highlighted cell still says which region it belongs to. Peer is a
    // neutral lift; the two that carry the accent are the ones that MEAN
    // something (your digit elsewhere, and where you are), exactly as in Suds.
    const tint = regionTint(b);
    let bg = tint;
    if (peer) bg = STAGE ? `color-mix(in srgb, var(--stg-ink) 12%, ${tint})` : '#e9edf3';
    if (sameVal) bg = STAGE ? `color-mix(in srgb, var(--stg-acc) 24%, ${tint})` : '#fbe3f7';
    if (isSel) bg = STAGE ? `color-mix(in srgb, var(--stg-acc) 40%, ${tint})` : '#f6cdef';
    // A wall goes wherever the neighbour is in a different region. The last row
    // and column are the grid's own outer border, so they are left alone.
    const wallR = c !== 8 && REG[idx + 1] !== b;
    const wallB = r !== 8 && REG[idx + 9] !== b;
    return {
      ...(STAGE ? regionStyle(b) : null),
      background: bg,
      // Digit ink comes from .ql-given and .ql-user, both of which the register
      // already moves. An inline colour here outranks a stylesheet, so the flat
      // dark pin this used to carry was not merely wrong on a dark cell, it was
      // silently flattening the printed clue and the digit you entered into one
      // colour. The one cell that still needs pinning is the SELECTED one,
      // whose fill carries enough of the accent that the accent cannot also be
      // read on top of it.
      color: isSel ? `var(--stg-ink, ${COLORS.ink})` : undefined,
      boxShadow: isSel ? `inset 0 0 0 2.5px var(--stg-acc, ${COLORS.accent})` : undefined,
      zIndex: isSel ? 1 : undefined,
      borderRight: `${wallR ? 2.5 : 1}px solid ${wallR ? WALL : HAIR}`,
      borderBottom: `${wallB ? 2.5 : 1}px solid ${wallB ? WALL : HAIR}`,
      borderLeft: c === 0 ? 'none' : undefined,
      borderTop: r === 0 ? 'none' : undefined,
    };
  }

  // Classic sudoku shows no correctness signal, so the pad's remaining-count and
  // grey-out track EVERY placement of a digit (right or wrong), never just the
  // correct ones — otherwise the counter would leak which entries are wrong.
  const padCounts = useMemo(() => {
    const cnt = {};
    for (let i = 0; i < 81; i++) { const v = givenFlat[i] || cells[i]; if (v) cnt[v] = (cnt[v] || 0) + 1; }
    return cnt;
  }, [cells, givenFlat]);

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Fill every empty square so each row, each column and each coloured region holds the digits 1–9 with no repeats."
      steps={[
        <><b>Tap a square then tap a number</b>, or pick a number first and tap every square it goes in. On desktop the <b>arrow keys and number keys</b> work too.</>,
        <>Turn on <b>Notes</b> (or press N) to pencil candidates, or with a number picked just <b>long-press</b> a square to pencil it.</>,
        <><b>Undo</b> (or Ctrl+Z) takes back your last move. <b>Clear</b> wipes every number you have entered and leaves the printed clues.</>,
      ]}
      knack="The regions are the whole game. They are the same nine cells an ordinary sudoku box would be, just not in a square, so scan along a shape rather than across a block. Wrong entries are not flagged, so it is on you to spot them."
      footer="Every board has exactly one solution and can always be reached by logic alone, never by guessing. Solve the whole grid and you score a perfect 10, and the faster you finish, the higher you place on the daily leaderboard. One free hint, on your first ever play, fills a correct number. Sundays are a harder Edition with fewer clues."
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
      <DailyChrome slug="quilt" name="Quilt" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Quilt is scored all or nothing, so the outcome is only ever won or
          lost; there is no partial state for the amber cap to carry. */}
      {LOFT && (
        <Cap gameKey="quilt" quizId={PUZZLE.quizId}
          name="Quilt"
          cat="Sudoku"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Fewer clues' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${filledCount}/${FREE.length}`, k: 'filled' },
          ]}
        />
      )}
      <div className="ql-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ql-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ql-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ql-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes sdfade{from{opacity:0;}}
          @keyframes sdstamp{from{opacity:0;transform:scale(.94);}}
          @media(max-width:520px){.ql-htp-f{display:none;}.ql-htp-s{display:inline;}}
          @media(max-width:560px){.ql-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ql-ttl h1{font-size:21px;letter-spacing:0.02em;}.ql-ttl .ql-ttl-dt{font-size:15px;}.ql-ttl-dot{display:none;}}
          .ql-cell{display:flex;align-items:center;justify-content:center;font-family:${MONO};box-sizing:border-box;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;}
          .ql-given{font-weight:700;color:${INK};}
          .ql-user{font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});}
          .ql-notes{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);width:100%;height:100%;padding:2px;box-sizing:border-box;}
          .ql-note{display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:9px;line-height:1;color:var(--stg-ink2, #8a93a3);}
          .ql-pad{width:100%;aspect-ratio:1;border-radius:9px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.5));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-family:${MONO};font-weight:500;color:${INK};cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 2px 0 rgba(28,30,36,0.4);}
          .ql-pad:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(28,30,36,0.4);}
          .ql-pad.done{color:var(--stg-mute2, #c3c8cf);box-shadow:none;background:${STAGE ? 'var(--stg-surf2)' : '#f4f5f7'};cursor:default;}
          .ql-pad.done span{text-decoration:line-through;}
          .ql-pad.armed{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 2px 0 rgba(112,26,117,0.55);}
          .ql-pad.armed .ql-pad-n{color:${STAGE ? 'color-mix(in srgb, var(--stg-onramp, #08222e) 68%, transparent)' : '#f6d9f4'};}
          .ql-pad .ql-pad-n{position:absolute;bottom:2px;right:4px;font-size:8px;color:var(--stg-mute2, #aab0bb);font-weight:500;}
          .ql-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .ql-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip: quiet nav + player chip */}

        {/* masthead: pressed QUILT tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="quilt"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Fewer clues</span>}
          blocks={'QUILT'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which runs
            full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* start tile — sits where the board goes until the player presses Start,
            which begins the clock. The grid stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Quilt is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Fill the grid so every row, column, and coloured region holds the digits 1 to 9.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ql-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the board */}
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

          {/* 9×9 grid with heavy rules along the region borders */}
          <div style={{ maxWidth: 468, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', gridTemplateRows: 'repeat(9, minmax(0, 1fr))', aspectRatio: '1', border: `2.5px solid ${WALL}`, borderRadius: 4, overflow: 'hidden' }}>
              {Array.from({ length: 81 }).map((_, idx) => {
                const given = givenFlat[idx];
                const val = given || cells[idx];
                const base = cellStyle(idx);
                const cls = `ql-cell ${given ? 'ql-given' : val ? 'ql-user' : ''}`;
                return (
                  <div key={idx} className={cls} style={base}
                    onClick={() => cellClick(idx)}
                    onPointerDown={() => startLong(idx)}
                    onPointerUp={cancelLong}
                    onPointerLeave={cancelLong}
                    onPointerCancel={cancelLong}>
                    {val ? (
                      <span style={{ fontSize: 'clamp(16px, 5vw, 23px)' }}>{val}</span>
                    ) : notes[idx] ? (
                      <div className="ql-notes">
                        {Array.from({ length: 9 }).map((__, k) => (
                          <span key={k} className="ql-note">{(notes[idx] & (1 << (k + 1))) ? k + 1 : ''}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* number pad + tools */}
          {playing && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', gap: 5, maxWidth: 468, margin: '16px auto 0' }}>
                {Array.from({ length: 9 }).map((_, k) => {
                  const d = k + 1;
                  const done = digitDone[d];
                  return (
                    <button key={d} className={`ql-pad${done ? ' done' : ''}${armed === d ? ' armed' : ''}`} onClick={() => { if (!done) padTap(d); }} aria-label={`enter ${d}`}>
                      <span style={{ fontSize: 'clamp(15px, 4.5vw, 21px)' }}>{d}</span>
                      {!done && <span className="ql-pad-n">{9 - (padCounts[d] || 0)}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button className={`ql-tool${noteMode ? ' on' : ''}`} onClick={() => setNoteMode((m) => !m)} title="Toggle pencil notes (N)">
                  <Pencil size={14} /> Notes {noteMode ? 'on' : 'off'}
                </button>
                <button className="ql-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                  <RotateCcw size={14} /> Undo
                </button>
                <button className="ql-tool" onClick={() => eraseCell(sel)} title="Erase selected cell (Backspace)">
                  <Eraser size={14} /> Erase
                </button>
                <button className="ql-tool" onClick={clearBoard} disabled={!hasEntries}
                  title="Clear every number you have entered and start the grid over on the same clock"
                  style={hasEntries
                    ? (armClear
                      ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderColor: 'rgba(192,57,43,0.5)', color: `var(--stg-ink, ${COLORS.rust})` }
                      : undefined)
                    : { opacity: 0.4, cursor: 'default' }}>
                  <Trash2 size={14} /> {armClear ? 'Tap again to clear' : 'Clear'}
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="ql-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(234,88,12,0.5)', color: '#9a3d0c' }}>
                    <Lightbulb size={14} /> Hint
                  </button>
                )}
              </div>
            </>
          )}

        {/* Controls. These sit INSIDE the board card on purpose: on the navy
            stage a bare row of faded text has nothing to sit on and is close to
            unreadable, and the card is meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--stg-line, rgba(28,30,36,0.10))', flexWrap: 'wrap' }}>
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
          {/* result */}
          {!playing && (
            <>
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition — a harder grid with fewer clues.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Quilt in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new jigsaw drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/quilt?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Quilt &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/quilt" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Quilt &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </div>
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
        </div>
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Quilt"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${filledCount}/${FREE.length} filled · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Quilt all time` : 'all-time rank' }
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
                href: `/quilt?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Quilt', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/quilt?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        {/* end of the navy play stage; everything below is the light tail */}
        </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="quilt" name="Quilt" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="quilt" name="Quilt" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}

          {/* THE TAIL IS GONE ON A LOFT PAGE (owner, 2026-08-14). The end card
              now carries the board, the day, what to play next and the archive,
              so the games grid and leaderboard panel below were saying all of
              it a second time. Only Report an issue survives, promoted below. */}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="quilt"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="quilt" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Quilt to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s sudoku, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s sudoku, every day.
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

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="quilt"
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
            <button className="ql-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Quilt — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Quilt</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Quilt is a free daily jigsaw sudoku from Mind Loft. Each day gives you a fresh 9×9 grid, a handful of printed clues, and nine irregular regions in place of the usual 3×3 boxes. Fill in the rest so that every row, every column, and every region holds the digits 1 through 9 exactly once. There is always a single, logical solution, no guessing required.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Play it your way: tap a square and a number, pencil in candidates with Notes when a square could go two ways, and lean on the arrow keys and number row on a desktop keyboard. Wrong entries are never flagged, so spotting your own slips is part of the puzzle, and a clean solve earns a perfect score.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new puzzle drops every day at midnight Eastern, and Sundays step up to a harder Edition with fewer clues. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/tally" style={{ color: INK, fontWeight: 800 }}>Tally</a>, our number ledger, and <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our geography puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
