'use client';

// Listed — rank the list, top to bottom.
//
// Each day: eight real things and one measurable quantity. Arrange them
// highest to lowest and submit. Every submit grades each row the way Wordle
// grades a letter:
//   green  = exactly right, and it LOCKS with its real figure revealed
//   amber  = off by one place, so it is nearly home
//   grey   = two or more places away
// Five submits. Score is 10 for a clean first submit, minus one per extra
// submit and one per item never locked. One free hint reveals the figure of
// the item sitting furthest from where it belongs.
//
// The amber tier is the whole point of the puzzle and the reason Listed is not
// just Dating with more rows: a near miss is worth knowing about, so the
// board teaches you something on every submit instead of only confirming.
//
// Same daily plumbing as Crux/Dating/Links: banked puzzles gated by Eastern
// date on the server (app/listed/page.js), per-puzzle localStorage saves,
// /listed?p=N archive pinning, streaks + stats, and the shared /api/quiz/*
// board flow. The display shuffle is SEEDED (mulberry32) — Math.random would
// mismatch SSR/hydration AND leak the answer (authored order is the answer).

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, ArrowUp, ArrowDown, Smartphone, Lightbulb, Eye, Check } from 'lucide-react';
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
  brand: '#86198f',
  brandInk: '#5b0f63',
  brandSoft: '#fdf2fe',
  lock: T.successDeep,
  lockInk: '#14532d',
  lockSoft: '#eefaf1',
  near: '#b7791f',
  nearInk: '#7c5410',
  nearSoft: '#fdf6e3',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_listed_help_seen';
const STATS_KEY = 'sot_listed_stats';
const MAX_CHECKS = 5;

// per-slot grade codes, also the share-grid alphabet
const GREY = 0, NEAR = 1, EXACT = 2;
const EMOJI = { 0: '⬜', 1: '\u{1F7E8}', 2: '\u{1F7E9}' };

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

// seeded display shuffle (Links/Dating pattern) — deterministic per puzzle,
// never the solved order, never Math.random (SSR mismatch + answer leak).
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededOrder(num, n) {
  const rand = mulberry32(Math.imul(num, 2654435761));
  // Keep drawing (deterministically) until the deal is a genuinely cold start:
  // nothing already in its correct slot, and at most two items within one slot
  // of home, so the opening board never hands out free greens or ambers.
  for (let tries = 0; tries < 64; tries++) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const exact = arr.filter((v, i) => v === i).length;
    const near = arr.filter((v, i) => Math.abs(v - i) === 1).length;
    if (exact === 0 && near <= 2) return arr;
  }
  return Array.from({ length: n }, (_, i) => (i + 2) % n);
}

// ─── Personal stats + streak (localStorage), Crux pattern ──────────────────
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

function freshState(num, n) {
  return {
    v: 1,
    order: seededOrder(num, n), // order[slot] = item index currently in that slot
    rows: [],                   // one int[] per submit: 0 grey, 1 near, 2 exact
    marks: null,                // last submit's grades, cleared on any reorder
    hintUsed: false,
    hintIdx: null,              // item index whose figure the hint revealed
    status: 'playing',          // playing | won | lost | revealed
    t0: null,
    tEnd: null,
  };
}

// A finished puzzle synthesized from the server's stored result, so a completed
// daily can be RESTORED on a second device. The board state lives only in the
// first device's localStorage; the result row is the cross-device record.
function restoredStateFromServer(n, srv) {
  const won = srv.correct === 1 || (Number(srv.score) || 0) >= 10;
  const status = won ? 'won' : ((Number(srv.score) || 0) > 0 ? 'lost' : 'revealed');
  const guesses = Math.max(1, Math.min(MAX_CHECKS, Number(srv.guessesUsed) || 1));
  const rows = [];
  for (let k = 0; k < guesses; k++) {
    rows.push(Array(n).fill(k === guesses - 1 && won ? EXACT : GREY));
  }
  const el = Math.max(1, Number(srv.timeElapsed) || 1);
  const now = Date.now();
  return { v: 1, order: Array.from({ length: n }, (_, i) => i), rows, marks: null, hintUsed: false, hintIdx: null, status, t0: now - el * 1000, tEnd: now, restored: true };
}

export default function ListedClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.items.length;
  const STORE_KEY = `sot_listed_${PUZZLE.num}`;
  const [g, setG] = useState(() => freshState(PUZZLE.num, N));
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shake, setShake] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [restoredScore, setRestoredScore] = useState(null);
  const restoreRef = useRef(false);
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
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('listed', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('listed'); }, [g.hintUsed]);
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
  const rowRefs = useRef([]);
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null); // {from, dy, target} while a desktop drag is live

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;   // not begun: show the start tile in place of the board
  const started = playing && !!g.t0;   // clock running: show the board
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('listed');
  const STAGE = isStage('listed', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('listed');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('listed'), '--stg-acc-lt': gameColorLight('listed'), '--stg-onramp-lt': gameOnrampLight('listed'), '--stg-acc-ink-lt': gameAccentInkLight('listed') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const won = g.status === 'won';
  const checksUsed = g.rows.length;
  const checksLeft = MAX_CHECKS - checksUsed;
  // a slot is locked once any submit graded it EXACT (locked rows never move)
  const lockedSlots = useMemo(() => {
    const l = Array(N).fill(false);
    for (const row of g.rows) for (let i = 0; i < N; i++) if (row[i] === EXACT) l[i] = true;
    return l;
  }, [g.rows, N]);
  const lockedCount = lockedSlots.filter(Boolean).length;
  const nearCount = useMemo(() => (g.marks ? g.marks.filter((m) => m === NEAR).length : 0), [g.marks]);

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
        if (saved && saved.v === 1 && Array.isArray(saved.order) && saved.order.length === N) setG({ ...freshState(PUZZLE.num, N), ...saved });
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
    // same-device day breadcrumb for cross-puzzle recommendations — only for
    // TODAY'S puzzle (archive replays must not mark today as played)
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_listed_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_listed_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Cross-device restore: this browser has no local puzzle for the puzzle, but the
  // signed-in player already finished it elsewhere. Rebuild the completed board
  // from their stored result so the end-of-puzzle card shows here too, instead of
  // the Start tile pretending they never played. Never overwrites an in-progress
  // or finished LOCAL puzzle, and posts nothing (they did not play on this device).
  useEffect(() => {
    if (!hydrated || restoreRef.current) return;
    if (g.status !== 'playing' || g.t0 || g.rows.length) return; // only a pristine board
    restoreRef.current = true;
    let cancelled = false;
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = idj.email; } catch (e) {}
      if (!anon && !em) return undefined;
      const qs = `quizId=${encodeURIComponent(PUZZLE.quizId)}&anonId=${encodeURIComponent(anon || '')}${em ? `&email=${encodeURIComponent(em)}` : ''}`;
      fetch(`/api/quiz/result?${qs}`)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled || !d || !d.found) return;
          setG((cur) => (cur.status !== 'playing' || cur.t0 || cur.rows.length) ? cur : restoredStateFromServer(N, d));
          setRestoredScore(Number(d.score) || 0);
        })
        .catch(() => {});
    } catch (e) {}
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

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
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const iq = useIqStanding({ game: 'listed', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'listed', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'listed', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'listed', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'listed', active: LOFT && !playing });

  // score: 10 for a clean first submit, -1 per extra submit, -1 per item never
  // locked. Revealed = 0.
  function scoreOf(g2) {
    if (g2.status === 'revealed') return 0;
    const rows = g2.rows;
    if (!rows.length) return 0;
    let locked = 0;
    const seen = Array(N).fill(false);
    for (const row of rows) for (let i = 0; i < N; i++) if (row[i] === EXACT) seen[i] = true;
    locked = seen.filter(Boolean).length;
    return Math.max(0, Math.min(10, 10 - (rows.length - 1) - (N - locked)));
  }
  const finalScore = playing ? 0 : (restoredScore != null ? restoredScore : scoreOf(g));

  const REC_KEY = `sot_listed_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (reordered a row, ran a
    // submit, or took the hint). Opening the puzzle and dismissing the start
    // gate does not log a 0-score attempt. Reorder is detected against the deal.
    const initOrder = seededOrder(PUZZLE.num, N);
    const acted = g.rows.length > 0 || g.hintUsed || (Array.isArray(g.order) && g.order.some((v, i) => v !== initOrder[i]));
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.rows.length, won: score === 10 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.rows.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // move the row in `slot` one step up/down, skipping locked slots
  function moveRow(slot, dir) {
    if (!playing || lockedSlots[slot]) return;
    let to = slot + dir;
    while (to >= 0 && to < N && lockedSlots[to]) to += dir;
    if (to < 0 || to >= N) return;
    const g2 = { ...g, order: [...g.order], marks: null };
    if (!g2.t0) g2.t0 = Date.now();
    [g2.order[slot], g2.order[to]] = [g2.order[to], g2.order[slot]];
    setG(g2);
  }

  // ─── desktop drag: insert the row from `from` at unlocked slot `to`,
  // shifting only the other unlocked rows (locked slots never move) ─────────
  function moveInsert(from, to) {
    if (!playing || from === to || lockedSlots[from] || lockedSlots[to]) return;
    const unlocked = [];
    for (let i = 0; i < N; i++) if (!lockedSlots[i]) unlocked.push(i);
    const seq = unlocked.map((s) => g.order[s]);
    const fi = unlocked.indexOf(from), ti = unlocked.indexOf(to);
    if (fi < 0 || ti < 0) return;
    const [it] = seq.splice(fi, 1);
    seq.splice(ti, 0, it);
    const g2 = { ...g, order: [...g.order], marks: null };
    if (!g2.t0) g2.t0 = Date.now();
    unlocked.forEach((s, i) => { g2.order[s] = seq[i]; });
    setG(g2);
  }
  // the unlocked slot whose row is vertically nearest the cursor. The dragged
  // row itself is measured at its UNTRANSFORMED spot (rect minus dy) — its
  // rendered rect follows the cursor, and would otherwise win every tie and
  // swallow downward drops.
  function dragTargetSlot(clientY, fromSlot, dy) {
    let best = null, bd = Infinity;
    for (let i = 0; i < N; i++) {
      if (lockedSlots[i]) continue;
      const el = rowRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      let mid = r.top + r.height / 2;
      if (i === fromSlot && dy != null) mid -= dy;
      const d = Math.abs(clientY - mid);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function startDrag(slot, e) {
    if (mobileUi || !playing || lockedSlots[slot]) return;
    if (e.button != null && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest('button')) return; // arrows keep working
    e.preventDefault();
    dragRef.current = { from: slot, y0: e.clientY, active: false };
    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const dy = ev.clientY - d.y0;
      if (!d.active && Math.abs(dy) < 4) return; // don't kill plain clicks
      d.active = true;
      setDrag({ from: d.from, dy, target: dragTargetSlot(ev.clientY, d.from, dy) });
    };
    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const d = dragRef.current;
      dragRef.current = null;
      // resolve the drop BEFORE clearing the drag state — the transform is
      // still applied, so the dragged row needs its dy correction
      if (d && d.active && ev.type !== 'pointercancel') {
        const t = dragTargetSlot(ev.clientY, d.from, ev.clientY - d.y0);
        if (t != null && t !== d.from) moveInsert(d.from, t);
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  // Grade every slot: exact, off by one, or further. Exact locks.
  function gradeOrder(order) {
    return order.map((it, slot) => {
      if (it === slot) return EXACT;
      return Math.abs(it - slot) === 1 ? NEAR : GREY;
    });
  }

  function submitOrder() {
    if (!playing || checksLeft <= 0) return;
    const g2 = { ...g, rows: [...g.rows] };
    if (!g2.t0) g2.t0 = Date.now();
    const row = gradeOrder(g2.order);
    g2.rows.push(row);
    g2.marks = row;
    const right = row.filter((c) => c === EXACT).length;
    const close = row.filter((c) => c === NEAR).length;
    if (right === N) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      postResult(g2, scoreOf(g2));
      setG(g2);
      setJustWon(true);
      return;
    }
    if (g2.rows.length >= MAX_CHECKS) {
      g2.status = 'lost';
      g2.tEnd = Date.now();
      postResult(g2, scoreOf(g2));
      setG(g2);
      return;
    }
    setShake(true);
    setTimeout(() => setShake(false), 500);
    const left = MAX_CHECKS - g2.rows.length;
    say(`${right} exact${close ? `, ${close} off by one` : ''}. ${left} submit${left === 1 ? '' : 's'} left.`);
    setG(g2);
  }

  // One free hint: reveal the figure of the unlocked item sitting furthest from
  // where it belongs.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    let best = null, bestDist = -1;
    for (let slot = 0; slot < N; slot++) {
      if (lockedSlots[slot]) continue;
      const it = g.order[slot];
      const d = Math.abs(slot - it);
      if (d > bestDist) { bestDist = d; best = it; }
    }
    if (best == null) return;
    const g2 = { ...g, hintUsed: true, hintIdx: best };
    if (!g2.t0) g2.t0 = Date.now();
    say(`Hint: ${PUZZLE.items[best].t} is ${PUZZLE.items[best].v}.`);
    setG(g2);
  }

  function revealEnd() {
    const g2 = { ...g, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(PUZZLE.num, N)); setJustWon(false); setEndClosed(false);
  }

  function shareText() {
    const grid = g.rows.map((row) => row.map((c) => EMOJI[c] || EMOJI[0]).join('')).join('\n');
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Listed #${PUZZLE.num} · ${finalScore}/10 · ${checksUsed} submit${checksUsed === 1 ? '' : 's'} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'lost'
        ? `Listed #${PUZZLE.num} · ${finalScore}/10 · ${lockedCount}/${N} ranked${hintBit}`
        : `Listed #${PUZZLE.num} · gave it up${hintBit}`;
    return grid ? `${head}\n${grid}\n${shareUrl()}` : `${head}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/listed${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Listed #${PUZZLE.num}: eight things, one ranking, five submits.\n${shareUrl()}`
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

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.brand} accentSoft={COLORS.brandSoft} accentDeep={COLORS.brandInk}
      lead={<>{N} real things, one ranking.</>}
      banner={<>Order them, {PUZZLE.hi.toLowerCase()} at the top, {PUZZLE.lo.toLowerCase()} at the bottom.</>}
      chips={[
        { label: 'Exactly right, locks with its figure', style: { background: `var(--stg-surf, ${COLORS.lockSoft})`, border: `1.5px solid var(--stg-line, ${COLORS.lock})`, color: `var(--stg-ink, ${COLORS.lockInk})` } },
        { label: 'Off by one place', style: { background: `var(--stg-surf, ${COLORS.nearSoft})`, border: `1.5px solid var(--stg-line, ${COLORS.near})`, color: `var(--stg-ink, ${COLORS.nearInk})` } },
        { label: 'Two or more places away', tone: 'grey' },
      ]}
      steps={[
        <>{mobileUi ? 'Tap the arrows to move a row.' : 'Drag a row where it belongs, or use the arrows.'}</>,
        <>You get <b>{MAX_CHECKS} submits</b>, and each one grades every row by the colors above.</>,
        <>One free <b>hint</b>, on your first ever play, reveals the figure of whichever item sits furthest from home.</>,
      ]}
      knack="Place the extremes first. Every row that locks with its real figure narrows what the rows around it can be."
      footer="Rank the whole board on your first submit for a perfect 10. Each extra submit costs a point, and each item you never lock costs one more. Boards are trivia, history or geography, and every ranking is a published number, never an opinion. New list daily at midnight Eastern."
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
      <DailyChrome slug="listed" name="Listed" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. The metric is a short token (population, height), so it reads as a figure.
          A partly-right ranking still scores, so the cap can go amber. */}
      {LOFT && (
        <Cap gameKey="listed" quizId={PUZZLE.quizId}
          name="Listed"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : (finalScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Nine items' : null}
          figures={playing ? [
            { v: PUZZLE.metric.toLowerCase(), k: 'ranked by' },
            { v: `${checksUsed}/${MAX_CHECKS}`, k: 'submits' },
            { v: lockedCount, k: 'locked' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: `${checksUsed}/${MAX_CHECKS}`, k: 'submits' },
            { v: lockedCount, k: 'locked' },
          ]}
        />
      )}
      <div className="ls-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ls-wrap{padding-left:14px !important;padding-right:14px !important;}}
          .ls-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ls-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ls-btn:disabled{opacity:.45;cursor:default;}
          @keyframes lsshake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-5px);}40%,80%{transform:translateX(5px);}}
          .ls-shake{animation:lsshake .45s ease;}
          .ls-arrow{width:34px;height:31px;border-radius:7px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.3));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}
          .ls-arrow:hover{background:var(--stg-surf2, ${COLORS.brandSoft});border-color:var(--stg-acc, ${COLORS.brand});color:var(--stg-acc-ink, ${COLORS.brand});}
          .ls-arrow:disabled{opacity:.25;cursor:default;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border-color:rgba(28,30,36,0.3);color:${INK};}
          @media(max-width:560px){.ls-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ls-ttl h1{font-size:21px;letter-spacing:0.02em;}.ls-ttl .ls-ttl-dt{font-size:15px;}.ls-ttl-dot{display:none;}}
          @media(max-width:430px){.ls-mh-tile{width:34px !important;height:34px !important;font-size:20px !important;}}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip (Crux pattern): quiet nav + player chip */}

        {/* masthead: pressed LISTED tiles with No./date inline, one rule beneath */}
        {!LOFT && (
        <DailyMasthead
          slug="listed"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.brand}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.brand})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Nine items</span>}
          blocks={'LISTED'.split('').map((ch, i) => (
              <div key={i} className="ls-mh-tile" style={{ width: 42, height: 42, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 25, background: i === 2 ? `var(--stg-acc, ${COLORS.brand})` : COLORS.ink, color: i === 2 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* start tile — sits where the board goes until the player presses Start,
            which begins the clock. The shuffled list stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Listed is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N} real things, shuffled. Rank them {PUZZLE.hi.toLowerCase()} to {PUZZLE.lo.toLowerCase()} in {MAX_CHECKS} submits.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ls-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        {/* the board */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            {PUZZLE.cat ? (
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-ink, ${COLORS.brandInk})`, background: `var(--stg-surf, ${COLORS.brandSoft})`, border: '1px solid rgba(134,25,143,0.35)', borderRadius: 5, padding: '2px 7px' }}>{PUZZLE.cat}</span>
            ) : null}
          </div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 15.5, lineHeight: 1.35, color: INK, marginBottom: 9 }}>{PUZZLE.title}</div>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>by <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.metric.toLowerCase()}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>submits <b style={{ color: checksUsed > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{checksUsed}/{MAX_CHECKS}</b> &middot; locked <b style={{ color: lockedCount > 0 ? COLORS.lock : COLORS.ink, fontWeight: 500 }}>{lockedCount}/{N}</b></span>
          </div>
          )}

          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: FADED, marginBottom: 7 }}>&uarr; {PUZZLE.hi}{!mobileUi && playing ? <span style={{ color: '#a8adb8' }}> &middot; drag rows or use the arrows</span> : null}</div>
          <div className={shake ? 'ls-shake' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 7, userSelect: drag ? 'none' : undefined }}>
            {g.order.map((it, slot) => {
              const locked = lockedSlots[slot];
              const mark = !locked && g.marks ? g.marks[slot] : null;
              const near = mark === NEAR;
              const done = g.status !== 'playing';
              const showVal = locked || done || (g.hintIdx === it && g.hintUsed);
              const valChip = showVal ? (
                <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 11.5, fontWeight: 500, color: locked ? `var(--stg-good, ${COLORS.lockInk})` : `var(--stg-ink, ${COLORS.brandInk})`, background: `var(--stg-surf2, ${locked ? COLORS.lockSoft : COLORS.brandSoft})`, border: `1px solid ${locked ? 'var(--stg-good, rgba(21,128,61,0.4))' : 'var(--stg-acc, rgba(134,25,143,0.35))'}`, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>{PUZZLE.items[it].v}</span>
              ) : null;
              const draggable = !mobileUi && playing && !locked;
              const dragging = drag && drag.from === slot;
              const dropHere = drag && !dragging && drag.target === slot;
              const bg = locked ? `var(--stg-surf2, ${COLORS.lockSoft})` : dropHere ? `color-mix(in srgb, var(--stg-acc, ${COLORS.brand}) 16%, transparent)` : near ? `var(--stg-surf2, ${COLORS.nearSoft})` : `var(--stg-surf, ${T.white})`;
              const bord = locked ? '1.5px solid var(--stg-good, rgba(21,128,61,0.5))' : dropHere ? `1.5px solid var(--stg-acc, ${COLORS.brand})` : near ? `1.5px solid var(--stg-warn, ${COLORS.near})` : '1.5px solid var(--stg-line2, rgba(28,30,36,0.32))';
              return (
                <div key={it} ref={(el) => { rowRefs.current[slot] = el; }} onPointerDown={draggable ? (e) => startDrag(slot, e) : undefined} title={draggable ? 'Drag to reorder' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, background: bg, border: bord, borderRadius: 9, padding: '9px 11px', cursor: draggable ? (dragging ? 'grabbing' : 'grab') : undefined, position: dragging ? 'relative' : undefined, zIndex: dragging ? 5 : undefined, transform: dragging ? `translateY(${drag.dy}px)` : undefined, boxShadow: dragging ? '0 8px 20px rgba(20,22,28,0.22)' : undefined, opacity: dragging ? 0.96 : undefined, touchAction: draggable ? 'none' : undefined }}>
                  <span style={{ flex: '0 0 auto', width: 20, fontFamily: MONO, fontSize: 11, color: near ? `var(--stg-warn, ${COLORS.nearInk})` : `var(--stg-mute, ${COLORS.faded})`, textAlign: 'center' }}>{locked ? <Check size={14} strokeWidth={3} style={{ color: `var(--stg-good, ${COLORS.lock})` }} /> : slot + 1}</span>
                  <span style={{ flex: '1 1 auto', minWidth: 0, fontFamily: SANS, fontWeight: 700, fontSize: 13.5, lineHeight: 1.35, color: locked ? `var(--stg-good, ${COLORS.lockInk})` : `var(--stg-ink, ${COLORS.ink})` }}>{PUZZLE.items[it].t}</span>
                  {near && playing ? <span title="Off by one place" style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-ink, ${COLORS.nearInk})`, background: STAGE ? 'var(--stg-surf2)' : '#fbeec4', border: `1px solid var(--stg-line, ${COLORS.near})`, borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap' }}>Off by one</span> : null}
                  {valChip}
                  {playing && !locked && (
                    <span style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <button className="ls-arrow" onClick={() => moveRow(slot, -1)} disabled={slot === 0 || lockedSlots.slice(0, slot).every(Boolean)} aria-label={`Move ${PUZZLE.hi.toLowerCase()}`}><ArrowUp size={15} strokeWidth={2.5} /></button>
                      <button className="ls-arrow" onClick={() => moveRow(slot, 1)} disabled={slot === N - 1 || lockedSlots.slice(slot + 1).every(Boolean)} aria-label={`Move ${PUZZLE.lo.toLowerCase()}`}><ArrowDown size={15} strokeWidth={2.5} /></button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: FADED, marginTop: 7 }}>&darr; {PUZZLE.lo}</div>
          {won && <div style={{ fontFamily: MONO, fontSize: 11, color: `var(--stg-ink, ${COLORS.lock})`, fontWeight: 500, marginTop: 8 }}>Ranked in {checksUsed} submit{checksUsed === 1 ? '' : 's'}.</div>}

        {/* Controls. These sit INSIDE the board card: on the navy stage a bare
            row of faded text has nothing to sit on, and the card is meant to
            hold the whole game. */}
        {/* the submit grid, so far */}
        {started && g.rows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)' }}>
            {g.rows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ flex: '0 0 auto', width: 20, fontFamily: MONO, fontSize: 10, color: FADED }}>{ri + 1}</span>
                {row.map((c, ci) => (
                  <span key={ci} style={{ width: 15, height: 15, borderRadius: 3, background: c === EXACT ? COLORS.lock : c === NEAR ? COLORS.near : '#d3d7de' }} />
                ))}
              </div>
            ))}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (!LOFT || revealed) && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: FADED, marginBottom: 7 }}>The real ranking</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PUZZLE.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 11, color: FADED, width: 16, textAlign: 'right', marginTop: 2 }}>{i + 1}</span>
                      <span style={{ flex: '0 0 auto', fontFamily: MONO, fontSize: 11, fontWeight: 500, color: `var(--stg-ink, ${COLORS.brandInk})`, background: `var(--stg-surf, ${COLORS.brandSoft})`, border: '1px solid rgba(134,25,143,0.35)', borderRadius: 6, padding: '2px 7px', minWidth: 74, textAlign: 'center', whiteSpace: 'nowrap', marginTop: 1 }}>{item.v}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontFamily: SANS, fontWeight: 700, fontSize: 12.5, lineHeight: 1.35, color: INK }}>{item.t}</span>
                        {item.d ? <span style={{ display: 'block', fontFamily: SANS, fontWeight: 600, fontSize: 11.5, lineHeight: 1.45, color: FADED, marginTop: 1 }}>{item.d}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: FADED, marginTop: 11, borderTop: '1px solid rgba(28,30,36,0.14)', paddingTop: 8 }}>Source: {PUZZLE.source}</div>
              </div>
              {!isTodays && (
                <p style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                  You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                  <a href="/listed" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Listed &rarr;</a>
                  {' · '}
                  <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                </p>
              )}
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
        </div>
        )}
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Listed"
            catRank={catRank}
            outcome={won ? 'won' : (finalScore > 0 ? 'part' : 'lost')}
            title={won ? 'Solved' : (finalScore > 0 ? 'Partly solved' : 'Not solved')}
            detail={`${finalScore}/10 \u00b7 ${checksUsed}/${MAX_CHECKS} submits \u00b7 ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Listed all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            missLabel="Checks"
            archive={puzzles
              .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
              .sort((x, y) => y.num - x.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/listed?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Listed', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/listed?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>

        {/* end of the navy play stage; everything below is the light tail */}
        </div>

        {/* controls */}
        {started && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="ls-btn" onClick={submitOrder} style={{ background: `var(--stg-acc, ${COLORS.brand})`, color: `var(--stg-onramp, ${T.white})`, borderColor: COLORS.brand }}>
                <Check size={15} strokeWidth={3} /> Submit my ranking ({checksLeft} left)
              </button>
              {hintOk && !g.hintUsed && (
                <button className="ls-btn" onClick={useHint} title="Reveal the figure of the item furthest from home (one hint, first play only)"
                  style={{ background: STAGE ? 'var(--stg-surf2)' : '#fdf6e3', border: '1.5px solid rgba(230,185,63,0.7)', color: '#8a6d1a', padding: '6px 12px', fontSize: 12.5 }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
              {identity && checksUsed > 0 && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again, this ends the puzzle and shows the real order' : 'Reveal the ranking & end'}
                </button>
              )}
            </div>
            {g.marks && nearCount > 0 && (
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: `var(--stg-ink, ${COLORS.nearInk})`, marginTop: 9 }}>
                {nearCount} row{nearCount === 1 ? ' is' : 's are'} off by exactly one place. Nudging beats rebuilding.
              </div>
            )}
          </div>
        )}


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="listed" name="Listed" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="listed" name="Listed" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="listed"
            maxWidth={620}
            light
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            boardSlot={<DailyBoardPanel self="listed" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: '#21b45e', color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Listed to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>, and the tile opens today&apos;s ranking, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s ranking, every day.
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

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="listed"
          won={won}
          headline={won ? <>Called it, top to bottom!</> : <>You scored {Math.round((((won || g.status === 'lost') ? finalScore : 0) / 10) * 100)}%</>}
          subline={<>{won
            ? <>{finalScore}/10 &middot; {checksUsed} submit{checksUsed === 1 ? '' : 's'} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : g.status === 'lost'
              ? <>{finalScore}/10 &middot; {lockedCount}/{N} locked &middot; the real ranking is below</>
              : <>0/10 &middot; the real ranking is below</>}</>}
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
            <button className="ls-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Listed — crawlable prose for search, server-rendered into the initial HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Listed</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Listed is a free daily ranking puzzle from Mind Loft. Each day deals eight real things and one measurable quantity, shuffled out of order. Your job is to rank them. You get five submits, and every submit grades each row: green means exactly right and locks it in with the real figure revealed, amber means you are off by exactly one place, and grey means you are further away than that.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The amber tier is what makes it a deduction puzzle rather than a quiz. Knowing a row is one place from home turns a wild guess into arithmetic, and a board that looks hopeless after one submit is usually two nudges from solved. Rank the whole list on your first submit and you score a perfect 10.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board is a trivia, history or geography board, and the three rotate through the week: box office and sports records one day, founding years or independence dates the next, deepest trenches or highest capitals after that. Every answer key is a published number from a named source, never an opinion and never a critics&rsquo; poll, so there is always exactly one right order. A new list drops every day at midnight Eastern, and the Sunday Edition adds a ninth item. No app, no signup: play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>, our put-history-in-order puzzle, <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, our word grouping puzzle, and <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a>, where the crowd is the answer key.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
