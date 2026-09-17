'use client';

// Whittle — the daily sudoku played backwards.
//
// Every other sudoku on the site hands you an empty grid and asks you to fill
// it. Whittle hands you a finished one and asks you to EMPTY it. The board
// opens with eighteen printed clues and the whole solution on show, and the
// play is taking clues away: a clue may come out only while the board still has
// exactly one solution, and the day ends when not one of the clues left can
// come out. The score is how few you leave standing.
//
// WHY THE SOLUTION IS ON SCREEN THE WHOLE TIME. Whittle asks nothing about what
// the answer is, so hiding it would only stack a second game on top of this
// one: solve the sudoku from memory, THEN reason about it. Showing it turns the
// board into the thing the player actually has to think about, which is whether
// lifting a clue would let some loop of squares swap round into a second
// answer. That is real sudoku uniqueness reasoning — the deadly pattern — and
// it is only findable if you can see the pattern.
//
// WHY A WRONG TAP DOES NOT END ANYTHING, AND WHY THAT IS SAFE. A tap on a clue
// that is holding the board together is a SLIP: it counts, it is the miss
// column, and it breaks nothing. There is no slip budget, because the obvious
// exploit does not work. Tapping every clue in turn removes every clue that is
// legal at the time, in board order, which is precisely a careless order, and a
// careless order lands one or two clues short of perfect on almost every board
// (that is `forgive`, the measured ramp). Fishing costs slips and buys an
// average score, so there is nothing to defend against.
//
// The legality rule lives in lib/whittle-core.js, which is the SAME module the
// generator measured `perfect` with. That is deliberate: a target computed
// under one rule and played under another is not a target.
//
// Same daily plumbing as every other board: banked puzzles gated by Eastern
// date on the server (app/whittle/page.js), per-puzzle localStorage saves,
// /whittle?p=N archive pinning, streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Flag, Smartphone } from 'lucide-react';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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
import { CELLS, boxOf, legalRemovals, bestRemoval, scoreFor } from '@/lib/whittle-core';

// Whittle's identity is the bronze end of the Sudoku row, the one warm dark
// step none of the other nine wears (Suds orange, Quilt magenta, Cages purple,
// Sando teal, Sixes blue, Towers sky, Mercury red, Knight indigo, Polka green).
// Every colour below is derived from COLORS.accent rather than written as a
// literal a second time.
const ACCENT = '#854d0e';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#fdf6e9',
  accentTint: '#f6e7c9',       // a square still holding a printed clue
  accentDeep: '#5c3406',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_whittle_help_seen';
const STATS_KEY = 'sot_whittle_stats';

// ─── 6x6 geometry, the same board Sixes is played on ───────────────────────
const N = 6;
const BOX_H = 2;
const BOX_W = 3;
const GRID_MAX = 396;

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
    gone: [],                      // cell indices whittled away, in the order they came out
    slips: 0,                      // taps on a clue that is holding the board together
    hintUsed: false,
    status: 'playing',             // playing | done (the board is stuck) | gave (ended early)
    t0: null,                      // stays null until the player presses Start: opening
    tEnd: null,                    // a game is not starting one (see CLAUDE.md)
  };
}

const HAPT = { ok: [8], slip: [26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function WhittleClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_whittle_${PUZZLE.num}`;
  const openFlat = useMemo(() => PUZZLE.given.flat(), [PUZZLE]);
  const solFlat = useMemo(() => PUZZLE.sol.flat(), [PUZZLE]);
  const PERFECT = PUZZLE.perfect;
  const OPEN_CLUES = PUZZLE.clues;

  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(-1);
  const [shake, setShake] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armGive, setArmGive] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('whittle', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('whittle'); }, [g.hintUsed]);
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

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('whittle');
  const STAGE = isStage('whittle', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('whittle');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('whittle'), '--stg-acc-lt': gameColorLight('whittle'), '--stg-onramp-lt': gameOnrampLight('whittle'), '--stg-acc-ink-lt': gameAccentInkLight('whittle') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);

  // ─── the board, and the one thing the game asks of it ────────────────────
  // `cur` is the printed board right now: the opening clues minus everything
  // whittled away. `legal` is every clue that could still come out, computed
  // ONCE per position rather than per tap, which also makes the end-of-day test
  // free — the day is over exactly when this list is empty.
  const goneSet = useMemo(() => new Set(g.gone), [g.gone]);
  const cur = useMemo(() => openFlat.map((v, i) => (goneSet.has(i) ? 0 : v)), [openFlat, goneSet]);
  const legal = useMemo(() => new Set(legalRemovals(cur)), [cur]);
  const left = useMemo(() => cur.reduce((n, v) => n + (v ? 1 : 0), 0), [cur]);
  const score = scoreFor(left, PERFECT);
  const perfectHit = left === PERFECT;

  const iq = useIqStanding({ game: 'whittle', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'whittle', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'whittle', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'whittle', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'whittle', active: LOFT && !playing });

  useEffect(() => {
    if (!armGive) return undefined;
    const t = setTimeout(() => setArmGive(false), 3500);
    return () => clearTimeout(t);
  }, [armGive]);
  useEffect(() => {
    if (shake < 0) return undefined;
    const t = setTimeout(() => setShake(-1), 420);
    return () => clearTimeout(t);
  }, [shake]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.gone)) setG({ ...freshState(), ...saved });
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
    // Same-device day breadcrumb — TODAY'S puzzle only, and only once the clock
    // is actually running, because a save file says 'playing' from the first
    // render whether or not anyone has moved.
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_whittle_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_whittle_day');
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
            if (d && Array.isArray(d.recent)) setStats((c) => mergeServerStats(c || getStats(), d.recent, puzzles));
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
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_whittle_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts. Opening the puzzle and
    // dismissing the start gate does not log a 0-score attempt.
    const acted = g.gone.length > 0 || g.slips > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: g.slips, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc, clueLeft) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const won = clueLeft === PERFECT;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: 10, g: g2.slips, won })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed carries the SLIPS, which is what the registry's
        // miss column prints and what the board's second term sorts on.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: 10, correct: won ? 1 : 0, guessesUsed: g2.slips, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((c) => (c.t0 ? c : { ...c, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // ─── the move ────────────────────────────────────────────────────────────
  // Lifting a clue is final. There is no undo and no putting one back, which is
  // what makes the ORDER the whole game: a clue taken early can be the one that
  // would have let two others out later, and the board never tells you until it
  // stops. It also means the day can end itself honestly — when nothing more
  // can come out, there is nothing left to decide.
  function lift(idx) {
    if (!playing || !g.t0) return;
    if (!cur[idx]) return;                       // an empty square is not a move and never costs
    if (!legal.has(idx)) {
      const g2 = { ...g, slips: g.slips + 1 };
      setShake(idx);
      vibrate(HAPT.slip);
      setG(g2);
      say('That clue is holding the board together. Take it out and the grid has more than one answer.');
      return;
    }
    const gone = [...g.gone, idx];
    const next = openFlat.map((v, i) => (gone.includes(i) ? 0 : v));
    const g2 = { ...g, gone };
    const nowLeft = next.reduce((n, v) => n + (v ? 1 : 0), 0);
    if (!legalRemovals(next).length) {
      g2.status = 'done';
      g2.tEnd = Date.now();
      const sc = scoreFor(nowLeft, PERFECT);
      vibrate(HAPT.win);
      postResult(g2, sc, nowLeft);
      setG(g2);
      setSel(-1);
      return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    setSel(-1);
  }

  function cellClick(idx) {
    if (!playing) return;
    if (!g.t0) return;
    if (cur[idx]) { lift(idx); return; }
    setSel((s) => (s === idx ? -1 : idx));       // a blank square only highlights, and costs nothing
  }

  // One free hint: lift the clue that keeps the board on the best line still
  // available from here. It searches, so it says so while it does.
  function useHint() {
    if (!hintOk || !playing || g.hintUsed || !g.t0 || thinking) return;
    setThinking(true);
    // Yield a frame so the "looking" state paints before the search blocks.
    setTimeout(() => {
      let idx = -1;
      try { idx = bestRemoval(cur); } catch (e) { idx = -1; }
      setThinking(false);
      if (idx < 0) return;
      setG((c) => ({ ...c, hintUsed: true }));
      setSel(idx);
      say('Hint: this one comes out, and it keeps the best finish still open.');
    }, 30);
  }

  function giveUp() {
    const g2 = { ...g, status: 'gave', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, scoreFor(left, PERFECT), left);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setSel(-1); setEndClosed(false); setArmGive(false);
  }

  // desktop keyboard: arrows move the highlight, Enter/Space lifts
  const onKey = useCallback((e) => {
    if (!playing || !g.t0) return;
    const k = e.key;
    if (k === 'Escape') { setSel(-1); return; }
    if (k === 'Enter' || k === ' ') { if (sel >= 0) { e.preventDefault(); lift(sel); } return; }
    if (sel < 0) { if (k.startsWith('Arrow')) { e.preventDefault(); setSel(0); } return; }
    const r = Math.floor(sel / N), c = sel % N;
    if (k === 'ArrowUp') { e.preventDefault(); setSel(((r + N - 1) % N) * N + c); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setSel(((r + 1) % N) * N + c); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); setSel(r * N + ((c + N - 1) % N)); return; }
    if (k === 'ArrowRight') { e.preventDefault(); setSel(r * N + ((c + 1) % N)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareUrl() {
    return withRef(`mindloftdaily.com/whittle${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    // One square per clue the day opened with: brown for a clue still standing,
    // white for one whittled away. It leaks nothing — WHICH clues came out is
    // the whole answer, and this says only how many.
    const squares = `${'⬜'.repeat(g.gone.length)}${'\u{1F7EB}'.repeat(left)}`;
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const slipBit = g.slips ? ` · ${g.slips} slip${g.slips === 1 ? '' : 's'}` : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Whittle #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · down to ${left}${perfectHit ? ' — perfect' : ` (perfect is ${PERFECT})`}${slipBit}${hintBit}${streakBit}`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Whittle #${PUZZLE.num} — the daily sudoku played backwards, from Mind Loft.\n${shareUrl()}`
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
  const selR = sel >= 0 ? Math.floor(sel / N) : -1;
  const selC = sel >= 0 ? sel % N : -1;
  const selB = sel >= 0 ? boxOf(selR, selC) : -1;
  const selVal = sel >= 0 ? solFlat[sel] : 0;

  function cellStyle(idx) {
    const r = Math.floor(idx / N), c = idx % N, b = boxOf(r, c);
    const isSel = idx === sel;
    const peer = sel >= 0 && !isSel && (r === selR || c === selC || b === selB);
    const sameVal = selVal && solFlat[idx] === selVal && !isSel;
    const standing = !!cur[idx];
    const heavyR = c % BOX_W === BOX_W - 1 && c !== N - 1;
    const heavyB = r % BOX_H === BOX_H - 1 && r !== N - 1;
    // A STANDING CLUE IS A FILLED CHIP, A LIFTED ONE IS BARE CELL. That is the
    // whole read of this board, so it is carried by the FILL, never by the ink
    // alone: on the stage the ink is a token and both states would otherwise
    // land within a shade of each other.
    let bg = STAGE ? 'var(--stg-cell)' : T.white;
    if (peer) bg = STAGE ? 'color-mix(in srgb, var(--stg-ink) 14%, var(--stg-cell))' : '#f4f5f7';
    if (sameVal) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 22%, var(--stg-cell))' : '#f1f3f6';
    if (standing) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 40%, var(--stg-cell))' : COLORS.accentTint;
    if (standing && (peer || sameVal)) bg = STAGE ? 'color-mix(in srgb, var(--stg-acc) 54%, var(--stg-cell))' : '#efd9b0';
    return {
      background: bg,
      boxShadow: isSel ? `inset 0 0 0 2.5px var(--stg-acc, ${COLORS.accentDeep})` : undefined,
      zIndex: isSel ? 1 : undefined,
      cursor: playing && started ? 'pointer' : 'default',
      borderRight: `${heavyR ? 2.5 : 1}px solid ${heavyR ? 'var(--stg-line3, rgba(28,30,36,0.85))' : 'var(--stg-cell-line, rgba(28,30,36,0.18))'}`,
      borderBottom: `${heavyB ? 2.5 : 1}px solid ${heavyB ? 'var(--stg-line3, rgba(28,30,36,0.85))' : 'var(--stg-cell-line, rgba(28,30,36,0.18))'}`,
      borderLeft: c === 0 ? 'none' : undefined,
      borderTop: r === 0 ? 'none' : undefined,
    };
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="A solved 6 by 6 sudoku, with eighteen of its digits printed as clues and the rest showing faintly. Your job is to take clues away. A clue can come out only while the grid still has exactly one answer, and the day ends when not one of the clues left can come out."
      steps={[
        <><b>Tap a printed clue</b> to whittle it away. If the grid would end up with more than one answer it stays put and you take a <b>slip</b>.</>,
        <>Nothing goes back. A clue is out for good, so the <b>order</b> is the whole game: take the wrong one early and the two you wanted later are stuck.</>,
        <>The board ends itself the moment nothing more can come out. <b>Perfect</b> is the fewest clues any order can leave, and it is printed on the board from the start.</>,
      ]}
      knack="Ask what would fill the square if the clue were gone. If the only digit that fits is the one already there, it comes out. The clue you cannot take is usually one of four squares sitting on the corners of a rectangle in two boxes, holding just two digits between them: lift it and those four can spin round into a second answer."
      footer="Ten out of ten for reaching perfect, and two points a clue for every one left above it, with a floor of one. Slips do not cost you score, only the tiebreak. One free hint, on your first ever play, lifts a clue that keeps the best finish open. Sundays are the least forgiving deal of the week."
    />
  );

  const detail = `${left} left${perfectHit ? ' · perfect' : ` · perfect is ${PERFECT}`}`;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="whittle" name="Whittle" collapsed={started} loft={LOFT} />}
      {LOFT && (
        <Cap gameKey="whittle" quizId={PUZZLE.quizId}
          name="Whittle"
          cat="Sudoku"
          outcome={playing ? null : (perfectHit ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Least forgiving' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${left}`, k: 'clues left' },
          ]}
        />
      )}
      <div className="wh-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.wh-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .wh-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .wh-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .wh-cell{display:flex;align-items:center;justify-content:center;font-family:${MONO};box-sizing:border-box;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;}
          .wh-clue{font-weight:700;color:${INK};}
          .wh-gone{font-weight:400;color:${STAGE ? 'var(--stg-mute2,#79839a)' : '#a9b0bd'};}
          .wh-shake{animation:wh-nudge 0.4s;}
          @keyframes wh-nudge{0%,100%{transform:translateX(0)}18%{transform:translateX(-4px)}38%{transform:translateX(4px)}58%{transform:translateX(-3px)}78%{transform:translateX(2px)}}
          .wh-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .wh-meter{display:flex;gap:3px;align-items:center;}
          .wh-pip{width:9px;height:14px;border-radius:2px;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="whittle"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Least forgiving</span>}
          blocks={'WHITTLE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Whittle is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>A solved sudoku with eighteen printed clues. Take away as many clues as you can: each one may come out only while the grid still has exactly one answer. Nothing goes back, so the order is everything.</p>
                <p style={{ margin: 0 }}>Today&rsquo;s perfect is <b>{PERFECT}</b> clues left standing.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="wh-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>left <b style={{ color: perfectHit ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{left}</b> / perfect {PERFECT}</span>
          </div>
          )}

          {/* THE PROGRESS METER. One pip per clue the day opened with, filling
              from the left as they come out, with the perfect mark drawn on it.
              It is the one readout that says at a glance both how far down the
              board is and how much further it can go. */}
          <div style={{ maxWidth: GRID_MAX, margin: '0 auto 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="wh-meter" aria-label={`${g.gone.length} of ${OPEN_CLUES - PERFECT} possible clues lifted`}>
              {Array.from({ length: OPEN_CLUES }).map((_, k) => {
                const lifted = k < g.gone.length;
                const beyond = k >= OPEN_CLUES - PERFECT;   // pips that can never come out
                return (
                  <span key={k} className="wh-pip" style={{
                    background: lifted ? `var(--stg-acc, ${COLORS.accent})` : (beyond ? 'var(--stg-line, rgba(28,30,36,0.13))' : `var(--stg-surf2, ${COLORS.accentTint})`),
                    outline: k === OPEN_CLUES - PERFECT - 1 ? `1.5px solid var(--stg-acc, ${COLORS.accentDeep})` : undefined,
                    outlineOffset: 1,
                  }} />
                );
              })}
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED, whiteSpace: 'nowrap' }}>
              {g.gone.length}/{OPEN_CLUES - PERFECT} out
            </span>
          </div>

          <div style={{ maxWidth: GRID_MAX, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`, aspectRatio: '1', border: '2.5px solid var(--stg-line3, rgba(28,30,36,0.85))', borderRadius: 4, overflow: 'hidden' }}>
              {Array.from({ length: CELLS }).map((_, idx) => {
                const standing = !!cur[idx];
                return (
                  <div key={idx} className={`wh-cell ${standing ? 'wh-clue' : 'wh-gone'}${shake === idx ? ' wh-shake' : ''}`}
                    style={cellStyle(idx)}
                    role={standing && started ? 'button' : undefined}
                    aria-label={standing ? `clue ${solFlat[idx]}, row ${Math.floor(idx / N) + 1} column ${(idx % N) + 1}` : undefined}
                    onClick={() => cellClick(idx)}>
                    <span style={{ fontSize: 'clamp(20px, 7vw, 30px)' }}>{solFlat[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})` }}>
                Tap a bold clue to take it out. {g.slips > 0 && <b style={{ color: `var(--stg-bad, ${COLORS.rust})` }}>{g.slips} slip{g.slips === 1 ? '' : 's'}</b>}
              </span>
              {hintOk && !g.hintUsed && (
                <button className="wh-tool" onClick={useHint} title="Lift a clue that keeps the best finish open (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(133,77,14,0.5)', color: ACC_DEEP_INK }}>
                  <Lightbulb size={14} /> {thinking ? 'Looking…' : 'Hint'}
                </button>
              )}
              <button onClick={() => { if (armGive) { if (Date.now() - armGive < ARM_MIN_MS) return; setArmGive(false); giveUp(); } else { setArmGive(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armGive ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Flag size={13} /> {armGive ? `Tap again — ends the day at ${left}` : 'End here'}
              </button>
            </div>
          )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, margin: '12px 0 0' }}>
                {perfectHit
                  ? `Whittled to ${left}. That is perfect — no order does better.`
                  : `Whittled to ${left}. Perfect on this board is ${PERFECT}, so ${left - PERFECT} more ${left - PERFECT === 1 ? 'was' : 'were'} there in a different order.`}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; the least forgiving deal of the week.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Whittle in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/whittle?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Whittle &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '').replace(', 2027', '')} archive.{' '}
                    <a href="/whittle" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Whittle &rarr;</a>
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
            name="Whittle"
            catRank={catRank}
            outcome={perfectHit ? 'won' : 'lost'}
            title={perfectHit ? 'Perfect' : `${score} of 10`}
            detail={`${detail} · ${elapsed}`}
            missLabel="Slips"
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Whittle all time` : 'all-time rank' }
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
                href: `/whittle?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              { tone: 'board', label: 'See the board', sub: 'What you left standing', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Whittle', sub: `No. ${prevPuzzle.num}, yesterday's board`, href: `/whittle?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This board again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        </div>

        {!STAGE && <GamePanel self="whittle" name="Whittle" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="whittle" name="Whittle" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="whittle"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="whittle" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Whittle to your Home Screen</div>
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
          self="whittle"
          won={perfectHit}
          headline={perfectHit ? <>Perfect whittle!</> : <>Down to {left}</>}
          subline={perfectHit
            ? <>the fewest clues this board allows, in {elapsed}</>
            : <>perfect on this board is {PERFECT}</>}
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
            <button className="wh-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Whittle</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Whittle is a free daily puzzle from Mind Loft, and it is a sudoku played backwards. Every other sudoku hands you an empty grid and asks you to fill it. Whittle hands you a finished 6 by 6 grid with eighteen of its digits printed as clues, and asks you to take clues away. A clue can come out only while the grid still has exactly one answer, so the whole game is deciding which one to lift next.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The solution is on show from the first second, because Whittle never asks what the answer is. It asks what the grid can survive losing. Nothing goes back once it is out, and the day ends the moment not one of the clues left can come out, so the order you choose is the score. Every board carries the proven fewest clues any order can leave, and reaching it is a perfect ten.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern, and Sunday is the least forgiving deal of the week. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. Want to fill a grid in instead? Try <a href="/sixes" style={{ color: INK, fontWeight: 800 }}>Sixes</a>, the mini sudoku on this same board, <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our classic 9 by 9, and <a href="/cages" style={{ color: INK, fontWeight: 800 }}>Cages</a>, the killer sudoku.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
