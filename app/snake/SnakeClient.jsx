'use client';

// Snake — the daily snake game.
//
// The classic, with three changes that make it a daily:
//
//  1. THE APPLES ARE THE DAY'S. Every player gets the same apples in the same
//     order (lib/snake-engine.js dayPlan, seeded off the quizId), so the
//     leaderboard compares play rather than luck. An apple only moves off its
//     square when your own body is lying on it.
//  2. THE EDGES WRAP and there is no wall. The only way to end a run is to run
//     into yourself, so a run ends on your own decisions.
//  3. IT NEVER SPEEDS UP. One square every STEP_MS for the whole run. The
//     squeeze comes from your own length, not from the clock.
//
// It is an Arcade game: as many runs as you like, and the board keeps your
// BEST run (isArcade in lib/daily-games). Apples are the score, raw and
// uncapped; par is the day's benchmark. Ties break on fewest moves, except at
// zero apples, where the board ranks on moves survived (the tally rule, unit
// 'apples').
//
// A run in progress survives the tab: leaving the page pauses it and saves
// the board, and the same run picks up where it left off.
//
// Plumbing forked from app/lamps/LampsClient.jsx and app/blocks/BlocksClient.jsx.

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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { T } from '@/lib/theme';
import { arcadeRanksForKey } from '@/lib/daily-games';
import { meRequest } from '@/app/quizMeClient';
import {
  SNAKE_SIZE, STEP_MS, dayPlan, newGame, turn, step, peekNext, snapshot, restore,
} from '@/lib/snake-engine';

const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#8a5a00', accentSoft: '#fdf3d7',
};
const HELP_KEY = 'sot_snake_help_seen';
const STATS_KEY = 'sot_snake_stats';
const BOARD_MAX = 460;
const SAVE_EVERY = 12;   // ticks between saves of a run in progress

const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};

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
const nf = (n) => Number(n || 0).toLocaleString('en-US');
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- stats: the record is the BEST run, as on Blocks ----------------------
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
const RUN_RANK = arcadeRanksForKey('snake');
const asRun = (e) => ({ score: e.s, guesses_used: e.g ?? null, time_elapsed: null });
function betterRun(next, prev) {
  if (!prev) return true;
  return RUN_RANK ? RUN_RANK(asRun(next), asRun(prev)) < 0 : next.s > prev.s;
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
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max, rec };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p) continue;
    // scorePct is score/total capped at 100, so a run above par reads as par
    // here; only `won` and the streak read this record, so that costs nothing.
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * (p.par || 1)));
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

// ---- colour, read off the stage tokens ------------------------------------
// A canvas cannot be reached by a DOM contrast sweep, so the board reads the
// stage tokens for itself through a probe, which also turns var() and
// color-mix() into numbers a canvas can blend.
function parseColor(c) {
  if (!c) return [0, 0, 0];
  const m = String(c).match(/-?[\d.]+/g);
  if (!m) return [0, 0, 0];
  const v = m.slice(0, 3).map(Number);
  return /^color\(/.test(c) ? v.map((x) => Math.round(x * 255)) : v;
}
const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;
const mixc = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));

function freshG() {
  return { v: 1, status: 'playing', t0: null, tEnd: null, run: null, apples: 0, moves: 0, won: false, runs: 0 };
}

const HAPT = { eat: [8], end: [20, 40, 20] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function SnakeClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const SIZE = PUZZLE.size || SNAKE_SIZE;
  const GROW = PUZZLE.grow || 1;
  const PAR = PUZZLE.par;
  const PLAN = useMemo(() => dayPlan(PUZZLE.quizId, SIZE), [PUZZLE.quizId, SIZE]);
  const STORE_KEY = `sot_snake_${PUZZLE.num}`;
  const REC_KEY = `sot_snake_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(freshG);
  const gRef = useRef(g);
  const eRef = useRef(null);           // the live engine state
  const [fig, setFig] = useState({ apples: 0, moves: 0, len: 3 });
  const [armed, setArmed] = useState(false);   // board showing, waiting for the first turn
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [shake, setShake] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(true);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [touchOnly, setTouchOnly] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const cvsRef = useRef(null);
  const boxRef = useRef(null);
  const probeRef = useRef(null);
  const palRef = useRef(null);
  const viewedRef = useRef(false);
  const tickCount = useRef(0);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);

  const playing = g.status === 'playing';
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('snake');
  const STAGE = isStage('snake', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('snake');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('snake'), '--stg-acc-lt': gameColorLight('snake'), '--stg-onramp-lt': gameOnrampLight('snake'), '--stg-acc-ink-lt': gameAccentInkLight('snake') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const iq = useIqStanding({ game: 'snake', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'snake', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'snake', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'snake', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'snake', active: LOFT && !playing });

  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0 && !armed;
  const started = playing && !!g.t0;
  const over = g.status !== 'playing';
  const won = over && g.apples >= PAR;
  const verdictTone = won ? 'won' : 'part';
  const verdictWord = g.won ? 'Board filled' : won ? 'Par reached' : 'Run complete';
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);
  const bestToday = myStats.rec && myStats.rec[PUZZLE.num] ? myStats.rec[PUZZLE.num].s : null;
  const shownApples = playing ? fig.apples : g.apples;
  const shownMoves = playing ? fig.moves : g.moves;

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 1) {
      const s = { ...freshG(), ...saved };
      if (s.run && s.run.size === SIZE) {
        eRef.current = restore(s.run, PLAN);
        setFig({ apples: s.run.apples, moves: s.run.moves, len: s.run.snake.length });
      }
      if (s.status === 'playing' && s.t0 && s.run) { setArmed(true); pausedRef.current = true; setPaused(true); }
      else if (s.status === 'playing') { s.t0 = null; s.run = null; eRef.current = null; }
      gRef.current = s; setG(s);
    }
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    try { setTouchOnly(isMobileDevice()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- identity + view ping -----------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    const anon = getAnonId();
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  // ---- the hub slate flag --------------------------------------------------
  // Done once ANY run has finished today, so a replay in progress never puts a
  // played day back in the "to play" pile.
  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing' || bestToday != null;
      if (done || g.t0) localStorage.setItem('sot_snake_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_snake_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0, bestToday]);

  // ---- abandon flush -------------------------------------------------------
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current, e = eRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !e || e.moves === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (er) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (er) {}
    return {
      quizId: PUZZLE.quizId, score: e.apples, total: PAR,
      correct: 0, guessesUsed: e.moves, timeElapsed: Math.min(36000, Math.max(1, Math.round((e.moves * STEP_MS) / 1000))), abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((e) => {
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    const sc = e.apples;
    const el = Math.max(1, Math.round((e.moves * STEP_MS) / 1000));
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: PAR, g: e.moves, won: sc >= PAR })); } catch (er) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score: sc, total: PAR, correct: sc >= PAR ? 1 : 0,
          // Moves. Ties break on fewest, EXCEPT at zero apples, where the board
          // ranks on moves survived instead (the tally rule, unit 'apples').
          guessesUsed: e.moves, timeElapsed: el,
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).catch(() => {});
    } catch (er) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, PAR, identity]);

  const saveRun = useCallback(() => {
    const e = eRef.current, cur = gRef.current;
    if (!e || cur.status !== 'playing' || !cur.t0) return;
    commit({ ...cur, run: snapshot(e), apples: e.apples, moves: e.moves });
  }, [commit]);

  // ---- drawing -------------------------------------------------------------
  const readPalette = useCallback(() => {
    const pr = probeRef.current;
    if (!pr || typeof window === 'undefined') return null;
    const get = (expr) => { pr.style.color = expr; return parseColor(getComputedStyle(pr).color); };
    const acc = get(`var(--stg-acc-ink, ${COLORS.accent})`);
    const ink = get(`var(--stg-ink, ${COLORS.ink})`);
    const ground = get('var(--stg-ground, #f7f8fa)');
    const cell = get('var(--stg-cell, #ffffff)');
    const mute = get(`var(--stg-mute, ${COLORS.faded})`);
    const bad = get('var(--stg-bad, #be123c)');
    const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    const dark = lum(ground) < 0.4;
    const pal = {
      acc, ink, ground, cell, mute, bad, dark,
      head: mixc(acc, ink, 0.38),
      grid: `rgba(${ink[0]},${ink[1]},${ink[2]},${dark ? 0.06 : 0.085})`,
    };
    palRef.current = pal;
    return pal;
  }, []);

  const draw = useCallback(() => {
    const cv = cvsRef.current, e = eRef.current;
    if (!cv) return;
    const pal = palRef.current || readPalette();
    if (!pal) return;
    const ctx = cv.getContext('2d');
    const W = parseFloat(cv.style.width) || 300, n = SIZE, cs = W / n;
    ctx.clearRect(0, 0, W, W);
    // a light grid, and no outer wall: the edges wrap
    ctx.strokeStyle = pal.grid; ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) {
      const p0 = Math.min(W - 0.5, Math.round(i * cs) + 0.5);
      ctx.beginPath(); ctx.moveTo(p0, 0); ctx.lineTo(p0, W); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p0); ctx.lineTo(W, p0); ctx.stroke();
    }
    const S = e ? e.snake : [{ x: (n / 2) | 0, y: (n / 2) | 0 }, { x: ((n / 2) | 0) - 1, y: (n / 2) | 0 }, { x: ((n / 2) | 0) - 2, y: (n / 2) | 0 }];
    const dir = e ? e.dir : { x: 1, y: 0 };
    // the next apple, a faint dashed ring
    if (e && e.alive) {
      const nx = peekNext(e);
      if (nx) {
        ctx.save(); ctx.strokeStyle = rgb(pal.mute); ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5; ctx.setLineDash([2.5, 2.5]);
        ctx.beginPath(); ctx.arc(nx.x * cs + cs / 2, nx.y * cs + cs / 2, cs * 0.28, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    // the apple
    if (e && e.apple) {
      const ax = e.apple.x * cs + cs / 2, ay = e.apple.y * cs + cs / 2 + cs * 0.04;
      ctx.fillStyle = rgb(pal.ink); ctx.beginPath(); ctx.arc(ax, ay, cs * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgb(pal.cell); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(ax - cs * 0.1, ay - cs * 0.1, cs * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = rgb(pal.acc); ctx.lineWidth = Math.max(1.5, cs * 0.08); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay - cs * 0.24); ctx.quadraticCurveTo(ax + cs * 0.04, ay - cs * 0.36, ax + cs * 0.14, ay - cs * 0.4); ctx.stroke();
    }
    // the snake: one rounded tube, thick at the head and tapering to the tail
    const L = S.length;
    const ctr = (c) => ({ x: c.x * cs + cs / 2, y: c.y * cs + cs / 2 });
    const widthAt = (t) => cs * (0.74 - 0.26 * t);
    const colAt = (t) => rgb(mixc(pal.acc, pal.ground, t * 0.45));
    const seg = (a, b, t) => {
      ctx.strokeStyle = colAt(t); ctx.lineWidth = widthAt(t); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    };
    ctx.lineJoin = 'round';
    for (let s = L - 1; s >= 1; s--) {
      const a = S[s], b = S[s - 1], t = (s - 0.5) / Math.max(1, L - 1), pa = ctr(a), pb = ctr(b);
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) { seg(pa, pb, t); continue; }
      // across a wrap: run each half off its own edge
      const sx = Math.abs(dx) > 1 ? -Math.sign(dx) : dx, sy = Math.abs(dy) > 1 ? -Math.sign(dy) : dy;
      seg(pa, { x: pa.x + sx * cs * 0.75, y: pa.y + sy * cs * 0.75 }, t);
      seg({ x: pb.x - sx * cs * 0.75, y: pb.y - sy * cs * 0.75 }, pb, t);
    }
    // a soft sheen down the back, one stroke per unbroken run so the joins stay clean
    ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = rgb(pal.cell); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = cs * 0.13; ctx.beginPath();
    let open = false;
    for (let s = L - 1; s >= 1; s--) {
      const a = S[s], b = S[s - 1], q1 = ctr(a), q2 = ctr(b);
      if (Math.abs(b.x - a.x) + Math.abs(b.y - a.y) !== 1) { open = false; continue; }
      if (!open) { ctx.moveTo(q1.x, q1.y); open = true; }
      ctx.lineTo(q2.x, q2.y);
    }
    ctx.stroke(); ctx.restore();
    // the head, with eyes looking where it is going
    const h = ctr(S[0]), hr = cs * 0.43;
    ctx.fillStyle = rgb(pal.head); ctx.beginPath(); ctx.arc(h.x + dir.x * cs * 0.04, h.y + dir.y * cs * 0.04, hr, 0, Math.PI * 2); ctx.fill();
    const px = -dir.y, py = dir.x, fwd = cs * 0.1, side = cs * 0.17;
    for (const k of [1, -1]) {
      const ex = h.x + dir.x * fwd + px * side * k, ey = h.y + dir.y * fwd + py * side * k;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, ey, cs * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0b0d12'; ctx.beginPath(); ctx.arc(ex + dir.x * cs * 0.04, ey + dir.y * cs * 0.04, cs * 0.06, 0, Math.PI * 2); ctx.fill();
    }
    // where it ended
    if (e && e.death) {
      ctx.strokeStyle = rgb(pal.bad); ctx.lineWidth = 2.5;
      const x = e.death.x * cs + 2, y = e.death.y * cs + 2, w = cs - 4, r = cs * 0.25;
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + w, r); ctx.arcTo(x + w, y + w, x, y + w, r);
      ctx.arcTo(x, y + w, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.stroke();
    }
  }, [SIZE, readPalette]);

  const sizeBoard = useCallback(() => {
    const box = boxRef.current, cv = cvsRef.current;
    if (!box || !cv) return;
    const w = Math.max(180, Math.min(BOARD_MAX, Math.floor(box.clientWidth)));
    const dpr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr);
    cv.style.width = `${w}px`; cv.style.height = `${w}px`;
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!hydrated) return undefined;
    sizeBoard();
    const on = () => sizeBoard();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [hydrated, sizeBoard, preStart, over, revealed, shake]);

  // the register changed: read the tokens again
  useEffect(() => { palRef.current = null; const t = setTimeout(() => { readPalette(); draw(); }, 30); return () => clearTimeout(t); }, [stageTheme, readPalette, draw]);

  // ---- the loop ------------------------------------------------------------
  const finishRun = useCallback(() => {
    const e = eRef.current, cur = gRef.current;
    if (!e || cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'over', tEnd: Date.now(), run: snapshot(e), apples: e.apples, moves: e.moves, won: !!e.won, runs: (cur.runs || 0) + 1 };
    commit(g2);
    setFig({ apples: e.apples, moves: e.moves, len: e.snake.length });
    setShake((x) => x + 1);
    vibrate(HAPT.end);
    postResult(e);
    draw();
  }, [commit, postResult, draw]);

  const running = playing && !!g.t0 && !paused;
  useEffect(() => {
    if (!running) return undefined;
    const iv = setInterval(() => {
      const e = eRef.current;
      if (!e || pausedRef.current) return;
      const before = e.apples;
      step(e);
      if (!e.alive || e.won) { finishRun(); return; }
      tickCount.current += 1;
      if (e.apples !== before) { vibrate(HAPT.eat); saveRun(); }
      else if (tickCount.current % SAVE_EVERY === 0) saveRun();
      setFig({ apples: e.apples, moves: e.moves, len: e.snake.length });
      draw();
    }, STEP_MS);
    return () => clearInterval(iv);
  }, [running, finishRun, saveRun, draw]);

  const togglePause = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (pausedRef.current) saveRun();
  }, [saveRun]);

  // leaving the tab pauses the run and saves it
  useEffect(() => {
    const hide = () => {
      if (document.hidden && gRef.current.status === 'playing' && gRef.current.t0) {
        pausedRef.current = true; setPaused(true); saveRun();
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, [saveRun]);

  // A fresh board waiting for its first turn. Nothing about the day is cleared:
  // every finished run posts, and the board and the local record keep the best.
  const armBoard = useCallback(() => {
    releaseEnd();
    eRef.current = newGame({ size: SIZE, grow: GROW, plan: PLAN });
    pausedRef.current = false; setPaused(false);
    setFig({ apples: 0, moves: 0, len: 3 });
    setArmRestart(false);
    setEndClosed(false);
    setRevealed(false);
    tickCount.current = 0;
    const cur = gRef.current;
    commit({ ...cur, status: 'playing', t0: null, tEnd: null, run: null, apples: 0, moves: 0, won: false });
    setArmed(true);
    try { localStorage.removeItem(REC_KEY); } catch (e) {}
    setTimeout(() => { sizeBoard(); }, 0);
  }, [releaseEnd, SIZE, GROW, PLAN, commit, sizeBoard, REC_KEY]);

  function startGame() {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    armBoard();
  }

  // A turn: the first one starts the clock, any one resumes a paused run.
  const input = useCallback((name) => {
    const d = DIRS[name];
    const cur = gRef.current;
    if (!d || cur.status !== 'playing') return;
    let e = eRef.current;
    if (!e) return;
    if (pausedRef.current) { pausedRef.current = false; setPaused(false); }
    const ok = turn(e, d);
    if (!cur.t0) {
      if (!ok && !(d.x === e.dir.x && d.y === e.dir.y)) return;
      commit({ ...cur, t0: Date.now(), run: snapshot(e) });
    }
  }, [commit]);

  useEffect(() => {
    const onKey = (ev) => {
      if (showHelp) { if (ev.key === 'Escape') setShowHelp(false); return; }
      const tag = ev.target && ev.target.tagName;
      if (tag && /input|textarea|select/i.test(tag)) return;
      const cur = gRef.current;
      if (cur.status !== 'playing' || !eRef.current) return;
      if (KEYS[ev.key]) { ev.preventDefault(); input(KEYS[ev.key]); return; }
      if ((ev.key === ' ' || ev.key === 'p' || ev.key === 'P' || ev.key === 'Escape') && cur.t0) { ev.preventDefault(); togglePause(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [input, togglePause, showHelp]);

  // Swipe on the board: a drag of a few pixels in any direction is a turn.
  const swRef = useRef(null);
  const boardProps = {
    onPointerDown: (ev) => {
      if (gRef.current.status !== 'playing' || !eRef.current) return;
      swRef.current = { x: ev.clientX, y: ev.clientY };
      try { ev.currentTarget.setPointerCapture && ev.currentTarget.setPointerCapture(ev.pointerId); } catch (er) {}
    },
    onPointerMove: (ev) => {
      const s = swRef.current;
      if (!s) return;
      const dx = ev.clientX - s.x, dy = ev.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      swRef.current = { x: ev.clientX, y: ev.clientY };
    },
    onPointerUp: () => { swRef.current = null; },
    onPointerCancel: () => { swRef.current = null; },
    onContextMenu: (ev) => ev.preventDefault(),
  };
  const padProps = (name) => ({
    onPointerDown: (ev) => { ev.preventDefault(); input(name); },
    onContextMenu: (ev) => ev.preventDefault(),
  });

  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);

  // ---- share ---------------------------------------------------------------
  function shareUrl() {
    return withRef(`mindloftdaily.com/snake${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    const a = bestToday != null ? Math.max(bestToday, g.apples) : g.apples;
    return `Snake #${PUZZLE.num}${sun} · ${nf(a)} apple${a === 1 ? '' : 's'} · par ${nf(PAR)}\n${shareUrl()}`;
  }
  function copyShare() {
    const txt = over ? shareText() : `Snake #${PUZZLE.num}, the daily snake game from Mind Loft. Same apples for everybody.\n${shareUrl()}`;
    if (notifyShareCredit(txt)) return;
    try {
      if (isMobileDevice() && navigator.share) { navigator.share({ text: txt }).catch(() => {}); return; }
      navigator.clipboard.writeText(txt);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch (e) {}
  }

  // ---- rules ---------------------------------------------------------------
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Steer the snake to eat the apples. Every apple makes it longer, and the run ends when it runs into its own body."
      banner={`Everyone gets the same apples in the same order today${PUZZLE.sunday ? ', and on Sunday every apple grows you by two' : ''}.`}
      sub="There are no walls: leave one edge and you come back on the opposite one."
      steps={[
        <>Turn with the <b>arrow keys</b> or <b>W A S D</b> on a keyboard, or <b>swipe on the board</b> or use the pad on a phone. Your first turn starts the run.</>,
        <>The faint ring shows where the <b>next apple</b> will land, so you can plan a turn ahead. An apple only moves off its square if your own body is lying on it.</>,
        <><b>Pause</b> with space or P whenever you like. Leaving the page pauses too, and the run waits for you.</>,
      ]}
      knack="It never speeds up. The snake moves one square at the same pace from the first apple to the last, so a run ends on a corner you painted yourself into, not on your reflexes. Keep the body in long straight lines and leave yourself a way out."
      footer={`Scored on APPLES, and you can play the day as many times as you like, because Snake keeps your BEST run: your score is the number of apples you eat, with no ceiling, and ${nf(PAR)} is par for the day. Ties break on FEWEST MOVES, since the same apples in fewer moves is the tidier run, and a run that eats nothing ranks on moves survived instead. Snake pays at most 1 IQ point a day however many runs you play. The Sunday Edition grows the snake by two squares an apple instead of one.`}
    />
  );

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };
  const padBtn = { width: '100%', height: 52, borderRadius: 12, border: STAGE ? '1px solid var(--stg-cell-line)' : `1px solid ${COLORS.line}`, background: STAGE ? 'var(--stg-cell)' : '#fff', color: STAGE ? 'var(--stg-ink,#e9edf4)' : FADED, fontSize: 18, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' };
  const figLabel = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: FADED };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
        <DailyChrome slug="snake" name="Snake" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="snake" quizId={PUZZLE.quizId}
          name="Snake"
          cat="Arcade"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · grows by two' : null}
          figures={[
            { v: shownApples, k: 'apples' },
            { v: PAR, k: 'par' },
            { v: bestToday != null ? bestToday : '–', k: 'best' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
          <DailyMasthead
            slug="snake"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            helpTop={13}
            marginBottom={16}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && (
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>
                Sunday Edition &middot; grows by two
              </span>
            )}
          />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
            <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
              <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>
                <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

                  {preStart && (
                    <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '22px', display: 'flex', flexDirection: 'column', maxWidth: 560, margin: '0 auto', width: '100%' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Snake is ready'}</div>
                      {gateRules ? rulesBody : (
                        <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                          <p style={{ margin: '0 0 6px' }}>Eat the apples and do not run into yourself. The edges wrap, it never speeds up, and you can play the day as often as you like. Your best run is the one that counts.</p>
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
                    <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, position: 'relative', maxWidth: BOARD_MAX + 30, margin: '0 auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={figLabel}>Apples <b style={{ color: INK }}>{nf(shownApples)}</b></span>
                        <span style={figLabel}>Length <b style={{ color: INK }}>{nf(playing ? fig.len : (g.run && g.run.snake ? g.run.snake.length : fig.len))}</b></span>
                        <span style={figLabel}>Moves <b style={{ color: INK }}>{nf(shownMoves)}</b></span>
                        {playing && g.t0 && (
                          <button onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} style={{ marginLeft: 'auto', border: `1px solid ${SURF_B}`, background: SURF, color: FADED, borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {paused ? <Play size={14} /> : <Pause size={14} />}
                          </button>
                        )}
                        <button onClick={() => setShowHelp(true)} aria-label="How to play" style={{ marginLeft: playing && g.t0 ? 0 : 'auto', border: `1px solid ${SURF_B}`, background: SURF, color: FADED, borderRadius: 7, width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <HelpCircle size={15} />
                        </button>
                      </div>

                      <div ref={boxRef} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        <span ref={probeRef} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} />
                        <canvas
                          key={shake}
                          ref={cvsRef}
                          {...boardProps}
                          className={shake ? 'sn-shake' : undefined}
                          role="img"
                          aria-label={`Snake board, ${SIZE} by ${SIZE}, ${shownApples} apples eaten`}
                          style={{ display: 'block', touchAction: 'none', maxWidth: '100%' }}
                        />
                        {playing && (!g.t0 || paused) && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 14, pointerEvents: 'none' }}>
                            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', background: STAGE ? 'var(--stg-raise,#0e131f)' : '#fff', color: INK, border: `1px solid ${SURF_B}`, borderRadius: 999, padding: '7px 13px' }}>
                              {!g.t0 ? 'Turn to start' : 'Paused · any turn resumes'}
                            </span>
                          </div>
                        )}
                      </div>

                      {playing && (
                        <div className="sn-pad" style={{ marginTop: 12 }}>
                          <button className="sn-up" style={padBtn} {...padProps('up')} aria-label="Up">&#9650;</button>
                          <button className="sn-lf" style={padBtn} {...padProps('left')} aria-label="Left">&#9664;</button>
                          <button className="sn-dn" style={padBtn} {...padProps('down')} aria-label="Down">&#9660;</button>
                          <button className="sn-rt" style={padBtn} {...padProps('right')} aria-label="Right">&#9654;</button>
                        </div>
                      )}
                      {playing && (
                        <div style={{ textAlign: 'center', marginTop: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: FADED }}>
                          {touchOnly ? 'Swipe on the board or use the pad' : 'Arrows or W A S D to turn · space pauses'}
                        </div>
                      )}

                      {over && (
                        <button
                          onClick={armBoard}
                          style={{
                            marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: SANS, fontWeight: 800, fontSize: 15, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white,
                            background: STAGE ? STAGE_C : T.cta, border: `2px solid ${STAGE ? STAGE_C : T.cta}`, borderRadius: 10, padding: '13px 18px', cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={16} /> Play again
                        </button>
                      )}
                      {playing && g.t0 && (
                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; armBoard(); } else setArmRestart(Date.now()); }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? ACC_INK : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <RotateCcw size={13} /> {armRestart ? 'Press again to start over' : 'Restart run'}
                          </button>
                        </div>
                      )}
                      {over && (
                        <p style={{ margin: '12px 0 0', fontSize: 12.5, color: FADED, fontWeight: 600, textAlign: 'center' }}>
                          {g.won ? 'You filled the board.' : `${nf(g.apples)} apple${g.apples === 1 ? '' : 's'} in ${nf(g.moves)} moves, ${fmtTime(g.moves * STEP_MS)} of play.`}
                          {bestToday != null && bestToday > g.apples ? ` Your best today is ${nf(bestToday)}.` : ''}
                        </p>
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
                  name="Snake"
                  catRank={catRank}
                  outcome={verdictTone}
                  challengeMetric={Number.isFinite(g.apples) ? g.apples : null}
                  title={verdictWord}
                  detail={`${g.apples} apples · ${PAR} par`}
                  iq={iq}
                  board={dailyBoard}
                  gameRank={allTime && allTime.ready
                    ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                        label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Snake all time` : 'all-time rank' }
                    : null}
                  day={dayStats}
                  streak={isTodays ? myStats.cur : null}
                  missLabel="Moves"
                  archive={puzzles
                    .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                    .sort((x, y) => y.num - x.num)
                    .map((p) => ({
                      num: p.num,
                      dateLabel: p.dateLabel,
                      sunday: !!p.sunday,
                      href: `/snake?p=${p.num}`,
                      done: !!(myStats.rec && myStats.rec[p.num]),
                      score: (myStats.rec && myStats.rec[p.num]) ? myStats.rec[p.num].s : null,
                    }))}
                  options={[
                    { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                    { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                    prevPuzzle && { tone: 'another', label: 'Play another Snake', sub: `No. ${prevPuzzle.num}, yesterday’s apples`, href: `/snake?p=${prevPuzzle.num}` },
                    nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                    { tone: 'replay', label: 'Play again', sub: 'Another run, your best one counts', onClick: armBoard },
                    { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="snake" name="Snake" onShow={() => setShowChrome(true)} />}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="Put your name on today&rsquo;s board" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="snake" name="Snake" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
          {!focusMode && <AddToHome name="Snake" />}
          <div id="stf-stats-slot" />
          {!LOFT && (
            <DailyGamesGrid
              self="snake"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="snake" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
          )}
        </div>

        <StageFold />
        <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Snake</h2>
          <p style={{ margin: '0 0 9px' }}>
            Snake is a free daily snake game from Mind Loft. Steer the snake to eat the apples; every apple makes it longer,
            and the run ends when it runs into its own body. Everyone plays the same apples in the same order on the same day,
            so the leaderboard compares play rather than luck.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            There are no walls: leave one edge and you come back on the opposite one. The pace never changes, so a run ends on
            a corner you painted yourself into rather than on your reflexes. Play as many runs as you like; your best one takes
            the board. On the Sunday Edition every apple grows the snake by two squares instead of one.
          </p>
          <p style={{ margin: 0 }}>
            More arcade games: <a href="/blocks" style={{ color: ACC_INK }}>Blocks</a> and{' '}
            <a href="/sweep" style={{ color: ACC_INK }}>Sweep</a>.
          </p>
        </section>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="snake"
          won={won}
          quizId={PUZZLE.quizId}
          completed
          score={<>{nf(g.apples)} apple{g.apples === 1 ? '' : 's'} &middot; par {nf(PAR)}</>}
          subline={<>{nf(g.moves)} moves</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={armBoard}
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

      <style dangerouslySetInnerHTML={{ __html: `
        .sn-pad { display: grid; grid-template-areas: ". up ." "lf dn rt"; grid-template-columns: repeat(3, 64px); gap: 8px; justify-content: center; }
        .sn-up { grid-area: up; } .sn-lf { grid-area: lf; } .sn-dn { grid-area: dn; } .sn-rt { grid-area: rt; }
        @media (min-width: 900px) and (hover: hover) { .sn-pad { display: none; } }
        @keyframes snShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .sn-shake { animation: snShake .32s ease-out 1; }
        @media (prefers-reduced-motion: reduce) { .sn-shake { animation: none; } }
      ` }} />

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
