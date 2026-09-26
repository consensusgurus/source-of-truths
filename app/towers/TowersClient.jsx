'use client';

// Towers — the daily skyscrapers puzzle.
//
// Every row and column holds the tower heights 1..N once each (weekdays N=5,
// the Sunday Edition N=7). The printed clues sit OUTSIDE the grid: each one
// counts the towers you can SEE looking down that row or column from there, a
// taller tower hiding every shorter one behind it. A 1 means the tallest
// tower stands at that edge; an N means the whole line ascends toward you.
// Not every clue is printed, and the weekday ramp is the printed-clue count.
// There is exactly one solution, always reachable by pure logic. A clue marks
// itself OK or off the moment its line is complete, like Sando's sums; wrong
// digits are otherwise never flagged.
//
// A solve is a flat 10 and the daily leaderboard is a race on the clock, the
// same lane as the sudoku family it runs with. Forked from
// app/towers/TowersClient.jsx re-based on a per-puzzle board size with border
// clue gutters and no boxes. Same daily plumbing as every other board: banked
// puzzles gated by Eastern date on the server (app/towers/page.js), per-puzzle
// localStorage saves, /towers?p=N archive pinning, streaks, and the shared
// /api/quiz/* flow.

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

// Towers identity is STEEL SKY (#075985), glass and girders, clear of Towers's
// royal blue and Ping's brighter sky. Every colour the board uses derives from
// COLORS.accent below rather than a literal hex a second time (the
// forked-sudoku lesson).
const ACCENT = '#075985';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#eaf4fa',
  accentTint: '#d3e9f5',       // a square holding the highlighted digit
  accentPick: '#b5dcf0',       // the selected square
  accentDeep: '#043751',       // pressed / shadow
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_towers_help_seen';
const STATS_KEY = 'sot_towers_stats';

// ─── geometry comes off the PUZZLE: weekdays are 5x5, Sundays 7x7 ──────────
// so N, CELLS and the board width are component consts derived from
// PUZZLE.size rather than module constants, and there are NO boxes: rows and
// columns are the only units.

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

function freshState(cellCount) {
  return {
    v: 1,
    cells: Array(cellCount).fill(0),   // player digit per square (0 = empty)
    notes: Array(cellCount).fill(0),   // pencil-mark bitmask per square (bit d set = candidate d)
    hintUsed: false,
    status: 'playing',             // playing | won | revealed
    t0: null,                      // stays null until the player presses Start: opening
    tEnd: null,                    // a game is not starting one (see CLAUDE.md)
  };
}

// Light haptics on supported devices (no-op on desktop / unsupported browsers).
const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60], note: [6] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function TowersClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.size;               // 5 on weekdays, 7 on the Sunday Edition
  const CELLS = N * N;
  const GRID_MAX = N === 7 ? 480 : 410; // px, gutters included
  // Towers prints nothing inside the grid; GIVEN stays as an all-empty grid so
  // every shared code path (pads, hints, erase guards) holds unchanged.
  const GIVEN = useMemo(() => Array.from({ length: N }, () => Array(N).fill(0)), [N]);
  const SOL = PUZZLE.sol;
  const STORE_KEY = `sot_towers_${PUZZLE.num}`;
  const givenFlat = useMemo(() => GIVEN.flat(), [GIVEN]);
  const solFlat = useMemo(() => SOL.flat(), [SOL]);
  const FREE = useMemo(() => {
    const out = [];
    for (let i = 0; i < CELLS; i++) if (!givenFlat[i]) out.push(i);
    return out;
  }, [givenFlat]);

  const [g, setG] = useState(() => freshState(PUZZLE.size * PUZZLE.size));
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('towers', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('towers'); }, [g.hintUsed]);
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
  const LOFT = isLoft('towers');
  const STAGE = isStage('towers', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('towers');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('towers'), '--stg-acc-lt': gameColorLight('towers'), '--stg-onramp-lt': gameOnrampLight('towers'), '--stg-acc-ink-lt': gameAccentInkLight('towers') };
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
  const iq = useIqStanding({ game: 'towers', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'towers', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'towers', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'towers', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'towers', active: LOFT && !playing });

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
          setG({ ...freshState(CELLS), ...saved, notes: Array.isArray(saved.notes) && saved.notes.length === CELLS ? saved.notes : Array(CELLS).fill(0) });
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
        if (done || g.t0) localStorage.setItem('sot_towers_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_towers_day');
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

  // A digit placed all N times greys out on the pad. This counts EVERY
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

  // A give-up writes the solution into cells, so the reveal stamps the real count
  // first (revealFilled) and every readout shows that, never the answer key.
  const liveFilled = useMemo(() => FREE.reduce((n, i) => n + (cells[i] ? 1 : 0), 0), [cells, FREE]);
  const filledCount = g.status === 'revealed' && g.revealFilled != null ? g.revealFilled : liveFilled;
  const hasEntries = useMemo(() => cells.some((v) => v) || notes.some((v) => v), [cells, notes]);

  function isSolved(cs) {
    for (const i of FREE) if (cs[i] !== solFlat[i]) return false;
    return true;
  }

  const REC_KEY = `sot_towers_rec_${PUZZLE.num}`;
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

  // remove a candidate from the notes of a square's row/column peers
  function scrubPeerNotes(noteArr, idx, d) {
    const r = Math.floor(idx / N), c = idx % N, m = 1 << d;
    for (let j = 0; j < CELLS; j++) {
      const rr = Math.floor(j / N), cc = j % N;
      if (rr === r || cc === c) { if (noteArr[j] & m) noteArr[j] = noteArr[j] & ~m; }
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

  // Core placement. `advance` is retained for call-site compatibility and no longer moves the selection to the next empty square, for
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
    // The selection STAYS on the square just filled (solver feedback, 2026-09-26):
    // sudoku is solved out of order, so the board never moves it for the player.
    // Tab still jumps to the next empty square when they ask for it.
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
    const g2 = { ...g, cells: next.map((v, i) => (givenFlat[i] ? 0 : v)), notes: Array(CELLS).fill(0), revealFilled: liveFilled, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    setG(freshState(CELLS)); setSel(-1); setArmed(0); setJustWon(false); setNoteMode(false); setEndClosed(false);
  }

  // desktop keyboard: arrows move, digits fill, 0/Backspace erase, N toggles notes
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
    if (new RegExp(`^[1-${N}]$`).test(k)) { enterDigit(sel, Number(k)); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, noteMode, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    // One square per column of the skyline. No board state leaks: it is all
    // N or none, exactly like the score.
    const squares = won ? '\u{1F7E6}'.repeat(N) : '⬜'.repeat(N);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Towers #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · solved in ${elapsed}${hintBit}${streakBit}`
      : `Towers #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/towers${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Towers #${PUZZLE.num} — the daily skyscrapers puzzle from Mind Loft.\n${shareUrl()}`
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

  // No boxes here: thin rules inside, one heavy frame around the play area
  // (drawn on the edge cells, since the clue gutters sit outside it).
  function cellStyle(idx) {
    const r = Math.floor(idx / N), c = idx % N;
    const isSel = idx === sel;
    const peer = sel >= 0 && !isSel && (r === selR || c === selC);
    const val = givenFlat[idx] || cells[idx];
    const sameVal = hlVal && val === hlVal && !isSel;
    // Same conversion Sixes needed: the digits moved to the stage's ink while
    // the cells stayed white, so the whole grid rendered pale-on-white. Tokens
    // with the Loft value as the fallback, so the Loft render is unchanged.
    let bg = STAGE ? 'var(--stg-cell)' : T.white;
    if (peer) bg = STAGE ? 'color-mix(in srgb, var(--stg-ink) 18%, var(--stg-cell))' : '#f3f5f8';
    if (sameVal) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 34%, var(--stg-cell))' : COLORS.accentTint;
    if (isSel) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 48%, var(--stg-cell))' : COLORS.accentPick;
    const thin = '1px solid var(--stg-cell-line, rgba(28,30,36,0.22))';
    const heavy = '2.5px solid var(--stg-line3, rgba(28,30,36,0.85))';
    return {
      background: bg,
      boxShadow: isSel ? `inset 0 0 0 2.5px var(--stg-acc, ${COLORS.accent})` : undefined,
      zIndex: isSel ? 1 : undefined,
      borderTop: r === 0 ? heavy : undefined,
      borderLeft: c === 0 ? heavy : undefined,
      borderRight: c === N - 1 ? heavy : thin,
      borderBottom: r === N - 1 ? heavy : thin,
    };
  }

  // The border clues. A clue lights up while its row or column is selected,
  // and marks itself the moment its line is completely filled: green OK when
  // the visible-tower count matches, red OFF when it does not (Sando's sums).
  function visOf(line) {
    let mx = 0, n = 0;
    for (const v of line) { if (v > mx) { mx = v; n += 1; } }
    return n;
  }
  function lineVals(kind, i) {
    const out = [];
    for (let k = 0; k < N; k++) out.push(kind === 'row' ? cells[i * N + k] : cells[k * N + i]);
    return out;
  }
  function clueState(side, i) {
    const v = PUZZLE.clues[side][i];
    if (!v) return null;
    const kind = side === 'left' || side === 'right' ? 'row' : 'col';
    const vals = lineVals(kind, i);
    const on = kind === 'row' ? i === selR : i === selC;
    if (vals.some((x) => !x)) return { v, on, mark: null };
    const seen = side === 'left' || side === 'top' ? visOf(vals) : visOf(vals.slice().reverse());
    return { v, on, mark: seen === v ? 'ok' : 'off' };
  }
  function clueEl(side, i) {
    const st = clueState(side, i);
    if (!st) return <div key={`${side}${i}`} />;
    return (
      <div key={`${side}${i}`} className={`tw-clue${st.on ? ' on' : ''}`}>
        <span>{st.v}</span>
        {st.mark && <span className={`tw-mark ${st.mark}`}>{st.mark === 'ok' ? 'OK' : 'OFF'}</span>}
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={`Every row and column holds the tower heights 1 to ${N}, once each. Each number printed outside the grid counts the towers you can SEE looking in from there: a taller tower hides every shorter one behind it.`}
      steps={[
        <>A <b>1</b> means the tallest tower stands right at that edge. A <b>{N}</b> means the whole line ascends toward you, 1 up to {N}. Not every clue is printed.</>,
        <><b>Tap a square then tap a number</b>, or pick a number first and tap every square it goes in. On desktop the <b>arrow keys and number keys</b> work too.</>,
        <>Turn on <b>Notes</b> (or press N) to pencil candidates. <b>Undo</b> (or Ctrl+Z) takes back your last move; <b>Clear</b> wipes the board.</>,
      ]}
      knack="A clue marks itself OK the moment its line is finished, so work line by line. The big clues and the 1s are the handholds: they pin the tallest towers first, and the rest of the skyline falls in behind them."
      footer="Every board has exactly one solution and can always be reached by logic, with no guessing. Solve the grid and you score a perfect 10, and because nothing is counted against you, the daily leaderboard is a straight race on the clock. One free hint, on your first ever play, fills a correct square. Sundays are a 7×7 Edition."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="towers" name="Towers" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Towers is scored all or nothing, so the outcome is only ever won or
          lost; there is no partial state for the amber cap to carry. */}
      {LOFT && (
        <Cap gameKey="towers" quizId={PUZZLE.quizId}
          name="Towers"
          cat="Sudoku"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 7×7' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${filledCount}/${FREE.length}`, k: 'filled' },
          ]}
        />
      )}
      <div className="tw-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.tw-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .tw-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .tw-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .tw-cell{display:flex;align-items:center;justify-content:center;font-family:${MONO};box-sizing:border-box;cursor:pointer;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;}
          .tw-given{font-weight:700;color:${INK};}
          .tw-user{font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});}
          .tw-notes{display:grid;grid-template-rows:repeat(2,1fr);width:100%;height:100%;padding:3px;box-sizing:border-box;}
          .tw-note{display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:11px;line-height:1;color:var(--stg-ink2, #8a93a3);}
          .tw-pad{width:100%;aspect-ratio:1;border-radius:9px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.5));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-family:${MONO};font-weight:500;color:${INK};cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 2px 0 rgba(28,30,36,0.4);}
          .tw-pad:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(28,30,36,0.4);}
          .tw-pad.done{color:var(--stg-mute2, #c3c8cf);box-shadow:none;background:${STAGE ? 'var(--stg-surf2)' : '#f4f5f7'};cursor:default;}
          .tw-pad.done span{text-decoration:line-through;}
          .tw-pad.armed{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 2px 0 var(--stg-acc, ${COLORS.accentDeep});}
          .tw-pad.armed .tw-pad-n{color:${STAGE ? 'color-mix(in srgb, var(--stg-onramp, #08222e) 68%, transparent)' : COLORS.accentTint};}
          .tw-pad .tw-pad-n{position:absolute;bottom:2px;right:4px;font-size:8px;color:var(--stg-mute2, #aab0bb);font-weight:500;}
          .tw-clue{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-family:${MONO};font-weight:500;font-size:clamp(12px,3vw,17px);color:${INK};user-select:none;line-height:1;min-width:0;min-height:0;}
          .tw-clue.on{color:var(--stg-acc-ink, ${COLORS.accent});font-weight:700;background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent);border-radius:4px;}
          .tw-mark{font-family:${MONO};font-weight:700;font-size:clamp(7px,1.8vw,9px);line-height:1;letter-spacing:0;}
          .tw-mark.ok{color:${COLORS.green};}
          .tw-mark.off{color:${COLORS.rust};}
          .tw-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .tw-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="towers"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 7&times;7</span>}
          blocks={'TOWERS'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* Start tile — sits where the board goes until the player presses
            Start, which begins the clock. The grid stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Towers is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Every row and column holds the tower heights 1 to {N}, once each. Each number printed outside the grid counts the towers you can see looking in from there: a taller tower hides every shorter one behind it.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="tw-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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

          {/* the skyline: clue gutters on all four sides of the play grid */}
          <div style={{ maxWidth: GRID_MAX, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `minmax(24px, 0.55fr) repeat(${N}, minmax(0, 1fr)) minmax(24px, 0.55fr)`, gridTemplateRows: `minmax(24px, 0.55fr) repeat(${N}, minmax(0, 1fr)) minmax(24px, 0.55fr)`, aspectRatio: '1' }}>
              <div />
              {Array.from({ length: N }).map((_, c) => clueEl('top', c))}
              <div />
              {Array.from({ length: N }).map((_, r) => (
                <React.Fragment key={`row${r}`}>
                  {clueEl('left', r)}
                  {Array.from({ length: N }).map((__, c) => {
                    const idx = r * N + c;
                    const val = cells[idx];
                    const cls = `tw-cell ${val ? 'tw-user' : ''}`;
                    return (
                      <div key={idx} className={cls} style={cellStyle(idx)}
                        onClick={() => cellClick(idx)}
                        onPointerDown={() => startLong(idx)}
                        onPointerUp={cancelLong}
                        onPointerLeave={cancelLong}
                        onPointerCancel={cancelLong}>
                        {val ? (
                          <span style={{ fontSize: N === 7 ? 'clamp(16px, 5vw, 24px)' : 'clamp(20px, 7vw, 30px)' }}>{val}</span>
                        ) : notes[idx] ? (
                          <div className="tw-notes" style={{ gridTemplateColumns: `repeat(${Math.ceil(N / 2)}, 1fr)` }}>
                            {Array.from({ length: N }).map((___, k) => (
                              <span key={k} className="tw-note">{(notes[idx] & (1 << (k + 1))) ? k + 1 : ''}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {clueEl('right', r)}
                </React.Fragment>
              ))}
              <div />
              {Array.from({ length: N }).map((_, c) => clueEl('bottom', c))}
              <div />
            </div>
          </div>

          {/* number pad + tools */}
          {playing && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gap: 6, maxWidth: GRID_MAX, margin: '16px auto 0' }}>
                {Array.from({ length: N }).map((_, k) => {
                  const d = k + 1;
                  const done = digitDone[d];
                  return (
                    <button key={d} className={`tw-pad${done ? ' done' : ''}${armed === d ? ' armed' : ''}`} onClick={() => { if (!done) padTap(d); }} aria-label={`enter ${d}`}>
                      <span style={{ fontSize: 'clamp(18px, 5.5vw, 25px)' }}>{d}</span>
                      {!done && <span className="tw-pad-n">{N - (padCounts[d] || 0)}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button className={`tw-tool${noteMode ? ' on' : ''}`} onClick={() => setNoteMode((m) => !m)} title="Toggle pencil notes (N)">
                  <Pencil size={14} /> Notes {noteMode ? 'on' : 'off'}
                </button>
                <button className="tw-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                  <RotateCcw size={14} /> Undo
                </button>
                <button className="tw-tool" onClick={() => eraseCell(sel)} title="Erase selected square (Backspace)">
                  <Eraser size={14} /> Erase
                </button>
                <button className="tw-tool" onClick={clearBoard} disabled={!hasEntries}
                  title="Clear every number you have entered and start the grid over on the same clock"
                  style={hasEntries
                    ? (armClear
                      ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderColor: 'rgba(192,57,43,0.5)', color: `var(--stg-ink, ${COLORS.rust})` }
                      : undefined)
                    : { opacity: 0.4, cursor: 'default' }}>
                  <Trash2 size={14} /> {armClear ? 'Tap again to clear' : 'Clear'}
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="tw-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(7,89,133,0.5)', color: ACC_DEEP_INK }}>
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
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition — a 7×7 skyline, two heights taller than the weekday board.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Towers in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new skyscrapers puzzle drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/towers?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Towers &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/towers" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Towers &rarr;</a>
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
            name="Towers"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${filledCount}/${FREE.length} filled · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Towers all time` : 'all-time rank' }
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
                href: `/towers?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished grid', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the solution', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Towers', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/towers?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="towers" name="Towers" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="towers" name="Towers" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {/* The tail is gone on a loft page: the end card already carries the
              board, the day, what to play next and the archive. */}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="towers"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="towers" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Towers to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s skyscrapers puzzle, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s skyscrapers puzzle, every day.
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
          self="towers"
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
            <button className="tw-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Towers — crawlable prose, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Towers</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Towers is a free daily skyscrapers puzzle from Mind Loft. Fill the grid with tower heights so that every row and every column holds each height exactly once, like a sudoku with no boxes. The clues sit outside the grid: each printed number counts the towers visible looking down that row or column from that side, because a taller tower hides every shorter one behind it.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          There is no arithmetic, only lines of sight. A 1 pins the tallest tower right at its edge; a clue equal to the grid size forces the whole line to ascend toward you. Every board has a single solution you can always reach by logic, with no guessing, and a clean solve scores a perfect 10 with the daily leaderboard decided on the clock.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern: 5×5 on weekdays with fewer clues as the week goes on, and a 7×7 Sunday Edition. No app, no signup, play free in your browser. It runs with the sudoku family: try <a href="/towers" style={{ color: INK, fontWeight: 800 }}>Towers</a>, the skyscrapers puzzle, <a href="/sando" style={{ color: INK, fontWeight: 800 }}>Sando</a>, the sandwich sudoku with border clues of its own, and <a href="/polka" style={{ color: INK, fontWeight: 800 }}>Polka</a>, the kropki.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
