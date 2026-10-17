'use client';

// Squash — the daily fruit-matching game.
//
// A match-three board of fruit, made a daily three ways:
//
//  1. THE BOARD IS THE DAY'S, REFILLS INCLUDED. Every player gets the same
//     opening board, and every column has its own seeded stream of fruit, so
//     the k-th fruit to drop into a column is the same for everybody
//     (lib/squash-engine.js). What falls is decided by your play, not luck.
//  2. A FIXED NUMBER OF MOVES. 25 swaps on a weekday, 30 on the Sunday Edition's
//     9x9 board. A swap that makes no match is undone and costs nothing.
//  3. SCORED ON POINTS against the day's par, which is measured off the engine
//     (scripts/gen-squash.mjs).
//
// It is an Arcade game: as many runs as you like, and the board keeps your
// BEST run (isArcade in lib/daily-games). Points are the score, raw and
// uncapped; ties break on the clock.
//
// A run in progress survives the tab: every move is saved, and the same run
// picks up where it left off.
//
// Plumbing forked from app/snake/SnakeClient.jsx.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw } from 'lucide-react';
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
  SQUASH_SIZE, FRUITS, newGame, move as playMove, swapValid, validMoves, pieces as piecesOf, clone, adjacent,
} from '@/lib/squash-engine';

const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#8a5a00', accentSoft: '#fdf3d7',
};
const HELP_KEY = 'sot_squash_help_seen';
const STATS_KEY = 'sot_squash_stats';
const BOARD_MAX = 480;
const IDLE_NUDGE_MS = 9000;

// The fruit, real colours: a match-three reads by colour first and shape
// second, so both are distinct. [body, rim, leaf]
const FRUIT_PAINT = [
  ['#e11d48', '#9f1239', '#16a34a'], // strawberry
  ['#f97316', '#c2410c', '#15803d'], // orange
  ['#facc15', '#a16207', '#4d7c0f'], // lemon
  ['#4ade80', '#15803d', '#166534'], // green apple
  ['#8b5cf6', '#5b21b6', '#4d7c0f'], // grapes
  ['#3b82f6', '#1e3a8a', '#1e3a8a'], // blueberry
];

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

// ---- stats: the record is the BEST run, as on Blocks and Snake ------------
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
const RUN_RANK = arcadeRanksForKey('squash');
const asRun = (e) => ({ score: e.s, guesses_used: e.g ?? null, time_elapsed: e.e ?? null });
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
    // scorePct is capped at 100, so a run above par reads as par here; only
    // `won` and the streak read this record, so that costs nothing.
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
function parseColor(c) {
  if (!c) return [0, 0, 0];
  const m = String(c).match(/-?[\d.]+/g);
  if (!m) return [0, 0, 0];
  const v = m.slice(0, 3).map(Number);
  return /^color\(/.test(c) ? v.map((x) => Math.round(x * 255)) : v;
}
const rgb = (a, al) => (al == null ? `rgb(${a[0]},${a[1]},${a[2]})` : `rgba(${a[0]},${a[1]},${a[2]},${al})`);
const mixc = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ---- the fruit ------------------------------------------------------------
// Drawn on the canvas at centre (x, y), radius r. Each fruit has its own
// silhouette as well as its colour, so the board reads without colour too.
function fruitPath(ctx, f, x, y, r) {
  ctx.beginPath();
  if (f === 0) { // strawberry: wide shoulders, a point at the bottom
    ctx.moveTo(x, y + r * 0.95);
    ctx.bezierCurveTo(x - r * 0.55, y + r * 0.7, x - r * 1.0, y + r * 0.05, x - r * 0.88, y - r * 0.42);
    ctx.bezierCurveTo(x - r * 0.75, y - r * 0.85, x + r * 0.75, y - r * 0.85, x + r * 0.88, y - r * 0.42);
    ctx.bezierCurveTo(x + r * 1.0, y + r * 0.05, x + r * 0.55, y + r * 0.7, x, y + r * 0.95);
  } else if (f === 1) { // orange: round
    ctx.arc(x, y + r * 0.05, r * 0.86, 0, Math.PI * 2);
  } else if (f === 2) { // lemon: a pointed oval
    ctx.moveTo(x - r * 0.98, y);
    ctx.bezierCurveTo(x - r * 0.75, y - r * 0.8, x + r * 0.75, y - r * 0.8, x + r * 0.98, y);
    ctx.bezierCurveTo(x + r * 0.75, y + r * 0.8, x - r * 0.75, y + r * 0.8, x - r * 0.98, y);
  } else if (f === 3) { // apple: two lobes on top
    ctx.moveTo(x, y - r * 0.55);
    ctx.bezierCurveTo(x - r * 0.35, y - r * 0.9, x - r * 1.0, y - r * 0.75, x - r * 0.9, y - r * 0.05);
    ctx.bezierCurveTo(x - r * 0.82, y + r * 0.6, x - r * 0.4, y + r * 0.95, x, y + r * 0.78);
    ctx.bezierCurveTo(x + r * 0.4, y + r * 0.95, x + r * 0.82, y + r * 0.6, x + r * 0.9, y - r * 0.05);
    ctx.bezierCurveTo(x + r * 1.0, y - r * 0.75, x + r * 0.35, y - r * 0.9, x, y - r * 0.55);
  } else if (f === 4) { // grapes: a bunch, as one outline of circles
    const g = r * 0.34;
    for (const [dx, dy] of [[-0.5, -0.45], [0, -0.45], [0.5, -0.45], [-0.25, 0.05], [0.25, 0.05], [0, 0.52]]) {
      ctx.moveTo(x + dx * r * 1.05 + g, y + dy * r * 1.05);
      ctx.arc(x + dx * r * 1.05, y + dy * r * 1.05, g, 0, Math.PI * 2);
    }
  } else { // blueberry: round with a five-point crown
    ctx.arc(x, y + r * 0.04, r * 0.8, 0, Math.PI * 2);
  }
}
function drawFruit(ctx, f, x, y, r, pal) {
  if (f < 0) return;
  const [body, rim, leaf] = FRUIT_PAINT[f];
  ctx.save();
  // drop shadow
  ctx.fillStyle = pal.dark ? 'rgba(0,0,0,0.35)' : 'rgba(15,23,42,0.16)';
  ctx.save(); ctx.translate(0, r * 0.1); fruitPath(ctx, f, x, y, r); ctx.fill(); ctx.restore();
  // body with a soft gradient
  const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
  gr.addColorStop(0, rgb(mixc(hex(body), [255, 255, 255], 0.35)));
  gr.addColorStop(0.55, body);
  gr.addColorStop(1, rim);
  ctx.fillStyle = gr;
  fruitPath(ctx, f, x, y, r); ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.07); ctx.strokeStyle = rim; ctx.stroke();
  // detail
  if (f === 0) { // seeds and a green cap
    ctx.fillStyle = 'rgba(255,240,170,0.9)';
    for (const [dx, dy] of [[-0.4, -0.15], [0, -0.2], [0.4, -0.15], [-0.22, 0.2], [0.22, 0.2], [0, 0.52]]) {
      ctx.beginPath(); ctx.ellipse(x + dx * r, y + dy * r, r * 0.05, r * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = leaf;
    for (const a of [-0.9, -0.3, 0.3, 0.9]) {
      ctx.beginPath(); ctx.ellipse(x + Math.sin(a) * r * 0.32, y - r * 0.7, r * 0.12, r * 0.28, a, 0, Math.PI * 2); ctx.fill();
    }
  } else if (f === 1) { // a dimple and a leaf
    ctx.fillStyle = rgb(hex(rim), 0.55);
    for (const [dx, dy] of [[-0.35, 0.1], [0.3, 0.3], [0.05, -0.25], [-0.15, 0.45], [0.45, -0.1]]) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.035, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = leaf; ctx.beginPath(); ctx.ellipse(x + r * 0.22, y - r * 0.8, r * 0.26, r * 0.12, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (f === 2) { // the lemon's tips
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(x - r * 0.96, y, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.96, y, r * 0.06, 0, Math.PI * 2); ctx.fill();
  } else if (f === 3) { // stem and leaf
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.5); ctx.quadraticCurveTo(x + r * 0.05, y - r * 0.85, x + r * 0.18, y - r * 0.98); ctx.stroke();
    ctx.fillStyle = leaf; ctx.beginPath(); ctx.ellipse(x + r * 0.38, y - r * 0.82, r * 0.24, r * 0.11, -0.4, 0, Math.PI * 2); ctx.fill();
  } else if (f === 4) { // a stem
    ctx.strokeStyle = '#4d7c0f'; ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - r * 0.78); ctx.lineTo(x + r * 0.12, y - r * 1.0); ctx.stroke();
  } else { // the crown
    ctx.fillStyle = rim;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.1 : r * 0.24;
      const px = x + Math.cos(a) * rr, py = y - r * 0.52 + Math.sin(a) * rr;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  // shine
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.36, y - r * 0.28, r * 0.15, r * 0.09, -0.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// The specials. A slicer wears two white bands the way it cuts, a bomb a ring
// of fuse, the punch bowl is its own piece.
function drawSpecial(ctx, p, x, y, r, pal, now) {
  if (p.sp === 'bowl') {
    ctx.save();
    const wob = Math.sin(now / 260) * r * 0.03;
    // glass bowl
    ctx.fillStyle = pal.dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.62, r * 0.55, r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createLinearGradient(x, y - r * 0.2, x, y + r * 0.7);
    gr.addColorStop(0, '#fb7185'); gr.addColorStop(1, '#be123c');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(x - r * 0.92, y - r * 0.12 + wob); ctx.quadraticCurveTo(x, y + r * 1.25, x + r * 0.92, y - r * 0.12 - wob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = pal.dark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.55)'; ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.beginPath(); ctx.moveTo(x - r * 0.95, y - r * 0.14); ctx.quadraticCurveTo(x, y + r * 1.3, x + r * 0.95, y - r * 0.14); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.13, r * 0.95, r * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
    // a bob of every fruit in the punch
    FRUIT_PAINT.forEach(([c], i) => {
      const a = now / 900 + (i * Math.PI * 2) / 6;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.55, y - r * 0.13 + Math.sin(a) * r * 0.12, r * 0.13, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    return;
  }
  drawFruit(ctx, p.f, x, y, r, pal);
  ctx.save();
  if (p.sp === 'h' || p.sp === 'v') {
    fruitPath(ctx, p.f, x, y, r); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    for (const o of [-0.26, 0.26]) {
      if (p.sp === 'h') ctx.fillRect(x - r * 1.1, y + o * r - r * 0.08, r * 2.2, r * 0.16);
      else ctx.fillRect(x + o * r - r * 0.08, y - r * 1.1, r * 0.16, r * 2.2);
    }
    ctx.restore(); ctx.save();
    // arrowheads beyond the fruit, the way it cuts
    ctx.fillStyle = pal.dark ? '#ffffff' : '#0b0d12';
    const tri = (ax, ay, dx, dy) => { ctx.beginPath(); ctx.moveTo(ax + dx * r * 0.22, ay + dy * r * 0.22); ctx.lineTo(ax - dy * r * 0.15, ay + dx * r * 0.15); ctx.lineTo(ax + dy * r * 0.15, ay - dx * r * 0.15); ctx.closePath(); ctx.fill(); };
    if (p.sp === 'h') { tri(x + r * 1.0, y, 1, 0); tri(x - r * 1.0, y, -1, 0); }
    else { tri(x, y + r * 1.0, 0, 1); tri(x, y - r * 1.0, 0, -1); }
  } else if (p.sp === 'bomb') {
    const pulse = 0.5 + 0.5 * Math.sin(now / 200);
    ctx.strokeStyle = pal.dark ? `rgba(255,255,255,${0.6 + 0.4 * pulse})` : `rgba(11,13,18,${0.55 + 0.4 * pulse})`;
    ctx.lineWidth = Math.max(2, r * 0.12); ctx.setLineDash([r * 0.22, r * 0.14]);
    ctx.beginPath(); ctx.arc(x, y, r * 1.08, now / 900, now / 900 + Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function freshG() {
  return { v: 1, status: 'playing', t0: null, tEnd: null, run: null, score: 0, used: 0, won: false, runs: 0 };
}
const HAPT = { squash: [6], big: [10, 30, 10], end: [20, 40, 20], bad: [4] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;

export default function SquashClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const SIZE = PUZZLE.size || SQUASH_SIZE;
  const MOVES = PUZZLE.moves || 25;
  const PAR = PUZZLE.par;
  const STORE_KEY = `sot_squash_${PUZZLE.num}`;
  const REC_KEY = `sot_squash_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(freshG);
  const gRef = useRef(g);
  const eRef = useRef(null);           // the live engine state
  const [fig, setFig] = useState({ score: 0, used: 0 });
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);     // an animation is running
  const busyRef = useRef(false);
  const [sel, setSel] = useState(null);         // [r, c] picked by a tap
  const selRef = useRef(null);
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
  const [callout, setCallout] = useState(null);  // { text, key }
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const cvsRef = useRef(null);
  const boxRef = useRef(null);
  const probeRef = useRef(null);
  const palRef = useRef(null);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  // ---- the display: where every piece is drawn, tweened between frames -----
  const dispRef = useRef(new Map());      // id -> { x, y, f, sp, s }
  const fxRef = useRef([]);               // particles, beams, rings, floating scores
  const tweenRef = useRef(null);          // { from, to, start, dur, ease, done }
  const stepsRef = useRef([]);            // queued animation steps
  const rafRef = useRef(null);
  const lastInputRef = useRef(Date.now());
  const nudgeRef = useRef(null);          // a valid move to wiggle when idle
  const cursorRef = useRef(null);         // keyboard cursor [r, c]

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);

  const playing = g.status === 'playing';
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('squash');
  const STAGE = isStage('squash', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('squash');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('squash');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('squash'), '--stg-acc-lt': gameColorLight('squash'), '--stg-onramp-lt': gameOnrampLight('squash'), '--stg-acc-ink-lt': gameAccentInkLight('squash') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const iq = useIqStanding({ game: 'squash', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'squash', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'squash', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'squash', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'squash', active: LOFT && !playing });

  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0 && !armed;
  const started = playing && !!g.t0;
  const over = g.status !== 'playing';
  const won = over && g.score >= PAR;
  const verdictTone = won ? 'won' : 'part';
  const verdictWord = won ? 'Par reached' : 'Run complete';
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);
  const bestToday = myStats.rec && myStats.rec[PUZZLE.num] ? myStats.rec[PUZZLE.num].s : null;
  const shownScore = playing ? fig.score : g.score;
  const shownUsed = playing ? fig.used : g.used;
  const movesLeft = Math.max(0, MOVES - shownUsed);

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 1) {
      const s = { ...freshG(), ...saved };
      if (s.run && s.run.size === SIZE && s.run.quizId === PUZZLE.quizId) {
        eRef.current = clone(s.run);
        setFig({ score: s.run.score, used: s.run.used });
      }
      if (s.status === 'playing' && s.t0 && s.run) setArmed(true);
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
  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing' || bestToday != null;
      if (done || g.t0) localStorage.setItem('sot_squash_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_squash_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0, bestToday]);

  const elapsed = (cur) => Math.min(36000, Math.max(1, Math.round(((cur.tEnd || Date.now()) - (cur.t0 || Date.now())) / 1000)));

  // ---- abandon flush -------------------------------------------------------
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current, e = eRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !e || e.used === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (er) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (er) {}
    return {
      quizId: PUZZLE.quizId, score: e.score, total: PAR,
      correct: 0, guessesUsed: e.used, timeElapsed: elapsed(cur), abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((e, el) => {
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    const sc = e.score;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: PAR, g: e.used, e: el, won: sc >= PAR })); } catch (er) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score: sc, total: PAR, correct: sc >= PAR ? 1 : 0,
          // Moves are fixed, so every finished run posts the same count and
          // the board breaks a points tie on the clock.
          guessesUsed: e.used, timeElapsed: el,
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).catch(() => {});
    } catch (er) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, PAR, identity]);

  // ---- palette ---------------------------------------------------------------
  const readPalette = useCallback(() => {
    const pr = probeRef.current;
    if (!pr || typeof window === 'undefined') return null;
    const raw = (expr) => { pr.style.color = expr; return getComputedStyle(pr).color; };
    const get = (expr) => parseColor(raw(expr));
    const acc = get(`var(--stg-acc-ink, ${COLORS.accent})`);
    const accFill = get(`var(--stg-acc, #fbbf24)`);
    const ink = get(`var(--stg-ink, ${COLORS.ink})`);
    const ground = get('var(--stg-ground, #f7f8fa)');
    const cell = get('var(--stg-cell, #ffffff)');
    const mute = get(`var(--stg-mute, ${COLORS.faded})`);
    const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
    const dark = lum(ground) < 0.4;
    const pal = {
      acc, accFill, ink, ground, cell, mute, dark,
      tileA: dark ? mixc(cell, [255, 255, 255], 0.03) : cell,
      tileB: dark ? mixc(cell, [255, 255, 255], 0.08) : mixc(cell, ink, 0.05),
      grid: raw('var(--stg-line2, rgba(128,128,128,0.2))'),
    };
    palRef.current = pal;
    return pal;
  }, []);

  // ---- drawing -------------------------------------------------------------
  const draw = useCallback((now = (typeof performance !== 'undefined' ? performance.now() : 0)) => {
    const cv = cvsRef.current;
    if (!cv) return;
    const pal = palRef.current || readPalette();
    if (!pal) return;
    const ctx = cv.getContext('2d');
    const W = parseFloat(cv.style.width) || 300, n = SIZE, cs = W / n;
    ctx.clearRect(0, 0, W, W);
    // the tray: a soft checker of squares
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      ctx.fillStyle = rgb((r + c) % 2 ? pal.tileB : pal.tileA);
      ctx.fillRect(Math.round(c * cs), Math.round(r * cs), Math.ceil(cs), Math.ceil(cs));
    }
    // the picked square and the keyboard cursor
    const ring = (rc, col, w) => {
      if (!rc) return;
      ctx.strokeStyle = col; ctx.lineWidth = w;
      const x = rc[1] * cs + 3, y = rc[0] * cs + 3, s = cs - 6, rr = cs * 0.2;
      ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + s, y, x + s, y + s, rr); ctx.arcTo(x + s, y + s, x, y + s, rr); ctx.arcTo(x, y + s, x, y, rr); ctx.arcTo(x, y, x + s, y, rr); ctx.closePath(); ctx.stroke();
    };
    if (selRef.current) {
      ctx.fillStyle = rgb(pal.accFill, 0.28);
      ctx.fillRect(selRef.current[1] * cs, selRef.current[0] * cs, cs, cs);
      ring(selRef.current, rgb(pal.acc), 3);
    }
    if (cursorRef.current && !selRef.current) ring(cursorRef.current, rgb(pal.mute), 2);

    // the pieces; the board clips anything still falling in from above
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, W); ctx.clip();
    const nudge = nudgeRef.current;
    const wig = nudge ? Math.sin(now / 90) * cs * 0.06 : 0;
    for (const [id, p] of dispRef.current) {
      let { x, y } = p;
      if (nudge && (nudge.ids.has(id))) { x += nudge.dx * wig / cs; y += nudge.dy * wig / cs; }
      const cx = x * cs + cs / 2, cy = y * cs + cs / 2, r = cs * 0.4 * (p.s == null ? 1 : p.s);
      if (r <= 0.5) continue;
      if (p.sp) drawSpecial(ctx, p, cx, cy, r, pal, now);
      else drawFruit(ctx, p.f, cx, cy, r, pal);
    }
    ctx.restore();

    // effects
    const fx = fxRef.current;
    for (let i = fx.length - 1; i >= 0; i--) {
      const e = fx[i], t = (now - e.t0) / e.dur;
      if (t >= 1) { fx.splice(i, 1); continue; }
      ctx.save();
      if (e.k === 'drop') { // juice: a drop flying out and fading
        const x = (e.x + e.vx * t) * cs, y = (e.y + e.vy * t + 1.2 * t * t) * cs;
        ctx.globalAlpha = 1 - t; ctx.fillStyle = e.col;
        ctx.beginPath(); ctx.arc(x, y, cs * e.sz * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
      } else if (e.k === 'beam') {
        ctx.globalAlpha = (1 - t) * 0.9;
        const gr = e.t === 'h' ? ctx.createLinearGradient(0, 0, W, 0) : ctx.createLinearGradient(0, 0, 0, W);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        const th = cs * (0.5 - 0.3 * t);
        if (e.t === 'h') ctx.fillRect(0, e.r * cs + cs / 2 - th / 2, W, th);
        else ctx.fillRect(e.c * cs + cs / 2 - th / 2, 0, th, W);
        ctx.globalAlpha = (1 - t) * 0.5; ctx.fillStyle = rgb(pal.accFill);
        if (e.t === 'h') ctx.fillRect(0, e.r * cs + cs / 2 - th, W, th * 2);
        else ctx.fillRect(e.c * cs + cs / 2 - th, 0, th * 2, W);
      } else if (e.k === 'ring') {
        ctx.globalAlpha = 1 - t; ctx.strokeStyle = e.col || rgb(pal.accFill); ctx.lineWidth = cs * 0.18 * (1 - t);
        ctx.beginPath(); ctx.arc(e.c * cs + cs / 2, e.r * cs + cs / 2, cs * (0.3 + e.d * 1.2 * easeOut(t)), 0, Math.PI * 2); ctx.stroke();
      } else if (e.k === 'pts') {
        ctx.globalAlpha = t < 0.7 ? 1 : (1 - t) / 0.3;
        ctx.font = `800 ${Math.round(cs * (e.big ? 0.62 : 0.46))}px ${SANS}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const x = e.x * cs + cs / 2, y = (e.y - 0.6 * easeOut(t)) * cs + cs / 2;
        ctx.lineWidth = 4; ctx.strokeStyle = pal.dark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.95)'; ctx.strokeText(e.text, x, y);
        ctx.fillStyle = pal.dark ? '#ffffff' : rgb(pal.ink); ctx.fillText(e.text, x, y);
      }
      ctx.restore();
    }
  }, [SIZE, readPalette]);

  // ---- the animation loop ----------------------------------------------------
  const syncDisp = useCallback((list) => {
    const m = new Map();
    for (const p of list) m.set(p.id, { x: p.c, y: p.r, f: p.f, sp: p.sp, s: 1 });
    dispRef.current = m;
  }, []);

  const tick = useCallback(() => {
    rafRef.current = null;
    const now = performance.now();
    const tw = tweenRef.current;
    if (tw) {
      const t = Math.min(1, (now - tw.start) / tw.dur);
      for (const [id, to] of tw.to) {
        const from = tw.from.get(id) || to;
        const d = dispRef.current.get(id);
        if (!d) continue;
        const k = (to.ease || tw.ease)(t);
        d.x = from.x + (to.x - from.x) * k;
        d.y = from.y + (to.y - from.y) * k;
        d.s = (from.s ?? 1) + ((to.s ?? 1) - (from.s ?? 1)) * k;
      }
      if (t >= 1) { tweenRef.current = null; if (tw.done) tw.done(); }
    }
    if (!tweenRef.current && stepsRef.current.length) {
      const st = stepsRef.current.shift();
      st(now);
    }
    draw(now);
    // keep drawing while anything moves: a tween, a queued step, an effect,
    // the idle nudge, or a bomb or punch bowl (both animate at rest)
    const live = tweenRef.current || stepsRef.current.length || fxRef.current.length || nudgeRef.current
      || [...dispRef.current.values()].some((p) => p.sp === 'bowl' || p.sp === 'bomb');
    if (live) rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const kick = useCallback(() => {
    if (rafRef.current == null && typeof window !== 'undefined') rafRef.current = requestAnimationFrame(tick);
  }, [tick]);
  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  // After a few idle seconds, a valid swap wiggles. It is the first one in
  // reading order, never the best, so it is a nudge rather than a hint.
  useEffect(() => {
    if (!hydrated) return undefined;
    const iv = setInterval(() => {
      const e = eRef.current, cur = gRef.current;
      if (busyRef.current || !e || cur.status !== 'playing' || nudgeRef.current || selRef.current) return;
      if (Date.now() - lastInputRef.current < IDLE_NUDGE_MS) return;
      const ms = validMoves(e);
      if (!ms.length) return;
      const [a, b] = ms[0];
      nudgeRef.current = { ids: new Set([e.grid[a[0]][a[1]].id, e.grid[b[0]][b[1]].id]), dx: b[1] - a[1], dy: b[0] - a[0] };
      kick();
    }, 1000);
    return () => clearInterval(iv);
  }, [hydrated, kick]);

  // A tween to the positions in `list`; pieces missing from `list` are left.
  const tweenTo = useCallback((list, dur, ease, done, extra) => {
    const from = new Map(), to = new Map();
    for (const p of list) {
      const d = dispRef.current.get(p.id);
      if (!d) continue;
      from.set(p.id, { x: d.x, y: d.y, s: d.s });
      to.set(p.id, { x: p.c, y: p.r, s: 1, ...(extra ? extra(p, d) : null) });
      d.f = p.f; d.sp = p.sp;
    }
    tweenRef.current = { from, to, start: performance.now(), dur, ease, done };
  }, []);

  const burst = useCallback((cleared, now) => {
    for (const p of cleared) {
      const col = p.f >= 0 ? FRUIT_PAINT[p.f][0] : '#fb7185';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + (p.id % 7);
        fxRef.current.push({ k: 'drop', x: p.c + 0.5, y: p.r + 0.5, vx: Math.cos(a) * 0.7, vy: Math.sin(a) * 0.7 - 0.4, sz: 0.06 + (i % 2) * 0.03, col, t0: now, dur: 420 });
      }
    }
  }, []);

  // Turn the engine's frames into animation steps.
  const playFrames = useCallback((frames, base, onDone) => {
    busyRef.current = true; setBusy(true);
    const steps = [];
    let running = base;
    for (const fr of frames) {
      if (fr.kind === 'swap') {
        steps.push(() => tweenTo(fr.pieces, 150, easeOut));
      } else if (fr.kind === 'clear') {
        steps.push((now) => {
          const ids = new Set(fr.cleared.map((p) => p.id));
          const to = new Map(), from = new Map();
          for (const id of ids) { const d = dispRef.current.get(id); if (d) { from.set(id, { x: d.x, y: d.y, s: 1 }); to.set(id, { x: d.x, y: d.y, s: 0 }); } }
          burst(fr.cleared, now);
          for (const b of fr.blasts) {
            if (b.t === 'h' || b.t === 'v') fxRef.current.push({ k: 'beam', t: b.t, r: b.r, c: b.c, t0: now, dur: 380 });
            else if (b.t === 'bomb') fxRef.current.push({ k: 'ring', r: b.r, c: b.c, d: b.d || 1, t0: now, dur: 420 });
            else if (b.t === 'bowl') fxRef.current.push({ k: 'ring', r: b.r, c: b.c, d: 4, col: '#fb7185', t0: now, dur: 600 });
          }
          if (fr.cleared.length) {
            const mx = fr.cleared.reduce((a, p) => a + p.c, 0) / fr.cleared.length, my = fr.cleared.reduce((a, p) => a + p.r, 0) / fr.cleared.length;
            fxRef.current.push({ k: 'pts', text: `+${nf(fr.points)}${fr.cascade > 1 ? ` x${fr.cascade}` : ''}`, x: mx, y: my, big: fr.points >= 300, t0: now, dur: 900 });
          }
          running += fr.points;
          const sc = running;
          setFig((f) => ({ ...f, score: sc }));
          if (fr.cascade >= 3 && fr.cascade <= 9) setCallout({ text: ['', '', '', 'Juicy', 'Sweet', 'Fruit punch', 'Smoothie', 'Squashed it', 'Pulped', 'Orchard'][fr.cascade] || 'Squashed it', key: now });
          vibrate(fr.points >= 300 ? HAPT.big : HAPT.squash);
          tweenRef.current = {
            from, to, start: now, dur: 200, ease: easeIn,
            done: () => {
              for (const id of ids) dispRef.current.delete(id);
              // new specials appear where they were made, popping in
              for (const p of fr.pieces) if (!dispRef.current.has(p.id)) {
                dispRef.current.set(p.id, { x: p.c, y: p.r, f: p.f, sp: p.sp, s: 0.2 });
                fxRef.current.push({ k: 'ring', r: p.r, c: p.c, d: 0.25, t0: performance.now(), dur: 380 });
              }
              const pops = fr.pieces.filter((p) => { const d = dispRef.current.get(p.id); return d && d.s < 1; });
              if (pops.length) tweenTo(pops, 160, easeOut);
            },
          };
        });
      } else if (fr.kind === 'fall') {
        steps.push(() => {
          const spawnFrom = new Map(fr.spawned.map((s) => [s.id, s.from]));
          let far = 1;
          for (const p of fr.pieces) {
            if (!dispRef.current.has(p.id)) {
              const fromRow = spawnFrom.has(p.id) ? spawnFrom.get(p.id) : -1;
              dispRef.current.set(p.id, { x: p.c, y: fromRow, f: p.f, sp: p.sp, s: 1 });
            }
            const d = dispRef.current.get(p.id);
            far = Math.max(far, p.r - d.y);
          }
          tweenTo(fr.pieces, Math.min(420, 110 + far * 45), easeIn);
        });
      } else if (fr.kind === 'shuffle') {
        steps.push((now) => {
          setCallout({ text: 'No moves left: shuffling', key: now });
          tweenTo(fr.pieces, 520, easeOut);
        });
      }
    }
    steps.push(() => {
      busyRef.current = false; setBusy(false);
      const e = eRef.current;
      if (e) syncDisp(piecesOf(e));
      if (onDone) onDone();
    });
    stepsRef.current.push(...steps);
    kick();
  }, [tweenTo, burst, kick, syncDisp]);

  const sizeBoard = useCallback(() => {
    const box = boxRef.current, cv = cvsRef.current;
    if (!box || !cv) return;
    const w = Math.max(200, Math.min(BOARD_MAX, Math.floor(box.clientWidth)));
    const dpr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr);
    cv.style.width = `${w}px`; cv.style.height = `${w}px`;
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!hydrated) return undefined;
    if (eRef.current && !dispRef.current.size) syncDisp(piecesOf(eRef.current));
    sizeBoard();
    kick();
    const on = () => sizeBoard();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [hydrated, sizeBoard, preStart, over, revealed, shake, syncDisp, kick]);

  useEffect(() => { palRef.current = null; const t = setTimeout(() => { readPalette(); draw(); }, 30); return () => clearTimeout(t); }, [stageTheme, readPalette, draw]);

  // ---- a run -----------------------------------------------------------------
  const finishRun = useCallback(() => {
    const e = eRef.current, cur = gRef.current;
    if (!e || cur.status !== 'playing') return;
    const tEnd = Date.now();
    const el = elapsed({ ...cur, tEnd });
    const g2 = { ...cur, status: 'over', tEnd, run: clone(e), score: e.score, used: e.used, won: e.score >= PAR, runs: (cur.runs || 0) + 1 };
    commit(g2);
    setFig({ score: e.score, used: e.used });
    setShake((x) => x + 1);
    vibrate(HAPT.end);
    postResult(e, el);
  }, [commit, postResult, PAR]);

  const tryMove = useCallback((a, b) => {
    const cur = gRef.current, e = eRef.current;
    if (!e || cur.status !== 'playing' || busyRef.current) return;
    lastInputRef.current = Date.now(); nudgeRef.current = null;
    selRef.current = null; setSel(null);
    if (!adjacent(a, b)) return;
    if (!swapValid(e, a, b)) {
      // a wobble: there and back, no move spent
      vibrate(HAPT.bad);
      busyRef.current = true; setBusy(true);
      const pa = e.grid[a[0]][a[1]], pb = e.grid[b[0]][b[1]];
      if (!pa || !pb) { busyRef.current = false; setBusy(false); return; }
      const there = [{ id: pa.id, f: pa.f, sp: pa.sp, r: b[0], c: b[1] }, { id: pb.id, f: pb.f, sp: pb.sp, r: a[0], c: a[1] }];
      const back = [{ id: pa.id, f: pa.f, sp: pa.sp, r: a[0], c: a[1] }, { id: pb.id, f: pb.f, sp: pb.sp, r: b[0], c: b[1] }];
      stepsRef.current.push(() => tweenTo(there, 120, easeOut), () => tweenTo(back, 140, easeOut), () => { busyRef.current = false; setBusy(false); setCallout({ text: 'No match there', key: Date.now() }); });
      kick();
      return;
    }
    const t0 = cur.t0 || Date.now();
    const base = e.score;
    const res = playMove(e, a, b);
    if (!res.ok) return;
    setFig((f) => ({ ...f, used: e.used }));
    const snap = clone(e);
    commit({ ...gRef.current, t0, run: snap, score: e.score, used: e.used });
    playFrames(res.frames, base, () => {
      setFig({ score: e.score, used: e.used });
      if (e.used >= e.max) finishRun();
    });
  }, [commit, playFrames, finishRun, tweenTo, kick]);

  // A fresh board. Nothing about the day is cleared: every finished run posts,
  // and the board and the local record keep the best.
  const armBoard = useCallback(() => {
    releaseEnd();
    const e = newGame({ quizId: PUZZLE.quizId, size: SIZE, moves: MOVES });
    eRef.current = e;
    stepsRef.current = []; tweenRef.current = null; fxRef.current = []; nudgeRef.current = null;
    busyRef.current = false; setBusy(false);
    selRef.current = null; setSel(null);
    syncDisp(piecesOf(e));
    setFig({ score: 0, used: 0 });
    setArmRestart(false);
    setEndClosed(false);
    setRevealed(false);
    lastInputRef.current = Date.now();
    const cur = gRef.current;
    commit({ ...cur, status: 'playing', t0: null, tEnd: null, run: clone(e), score: 0, used: 0, won: false });
    setArmed(true);
    try { localStorage.removeItem(REC_KEY); } catch (er) {}
    setTimeout(() => { sizeBoard(); kick(); }, 0);
  }, [releaseEnd, PUZZLE.quizId, SIZE, MOVES, commit, sizeBoard, REC_KEY, syncDisp, kick]);

  function startGame() {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    armBoard();
  }

  // ---- input: drag a fruit onto a neighbour, or tap one then the other -----
  const dragRef = useRef(null);
  const cellAt = (ev) => {
    const cv = cvsRef.current;
    if (!cv) return null;
    const rect = cv.getBoundingClientRect(), cs = rect.width / SIZE;
    const c = Math.floor((ev.clientX - rect.left) / cs), r = Math.floor((ev.clientY - rect.top) / cs);
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return null;
    return { r, c, cs, rect };
  };
  const boardProps = {
    onPointerDown: (ev) => {
      if (gRef.current.status !== 'playing' || !eRef.current || busyRef.current) return;
      const hit = cellAt(ev);
      if (!hit) return;
      cursorRef.current = null;
      dragRef.current = { r: hit.r, c: hit.c, x: ev.clientX, y: ev.clientY, cs: hit.cs, moved: false };
      try { ev.currentTarget.setPointerCapture && ev.currentTarget.setPointerCapture(ev.pointerId); } catch (er) {}
      kick();
    },
    onPointerMove: (ev) => {
      const d = dragRef.current;
      if (!d || d.moved) return;
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < d.cs * 0.38) return;
      d.moved = true;
      const b = Math.abs(dx) > Math.abs(dy) ? [d.r, d.c + Math.sign(dx)] : [d.r + Math.sign(dy), d.c];
      if (b[0] >= 0 && b[1] >= 0 && b[0] < SIZE && b[1] < SIZE) tryMove([d.r, d.c], b);
    },
    onPointerUp: () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d || d.moved || busyRef.current) return;
      const here = [d.r, d.c], s = selRef.current;
      if (s && s[0] === here[0] && s[1] === here[1]) { selRef.current = null; setSel(null); }
      else if (s && adjacent(s, here)) tryMove(s, here);
      else { selRef.current = here; setSel(here); }
      lastInputRef.current = Date.now(); nudgeRef.current = null;
      kick();
    },
    onPointerCancel: () => { dragRef.current = null; },
    onContextMenu: (ev) => ev.preventDefault(),
  };

  // Keyboard: arrows move a cursor, Enter or Space picks it up, and an arrow
  // with a fruit picked up swaps it that way.
  useEffect(() => {
    const onKey = (ev) => {
      if (showHelp) { if (ev.key === 'Escape') setShowHelp(false); return; }
      const tag = ev.target && ev.target.tagName;
      if (tag && /input|textarea|select|button/i.test(tag)) return;
      const cur = gRef.current;
      if (cur.status !== 'playing' || !eRef.current) return;
      const D = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[ev.key];
      if (D) {
        ev.preventDefault();
        const s = selRef.current;
        if (s) { tryMove(s, [s[0] + D[0], s[1] + D[1]]); cursorRef.current = [Math.max(0, Math.min(SIZE - 1, s[0] + D[0])), Math.max(0, Math.min(SIZE - 1, s[1] + D[1]))]; }
        else {
          const c = cursorRef.current || [Math.floor(SIZE / 2), Math.floor(SIZE / 2)];
          cursorRef.current = [Math.max(0, Math.min(SIZE - 1, c[0] + D[0])), Math.max(0, Math.min(SIZE - 1, c[1] + D[1]))];
        }
        lastInputRef.current = Date.now(); nudgeRef.current = null;
        kick();
      } else if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        if (selRef.current) { selRef.current = null; setSel(null); }
        else { const c = cursorRef.current || [Math.floor(SIZE / 2), Math.floor(SIZE / 2)]; cursorRef.current = c; selRef.current = c; setSel(c); }
        kick();
      } else if (ev.key === 'Escape') { selRef.current = null; setSel(null); kick(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, showHelp, SIZE, kick]);

  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);
  useEffect(() => {
    if (!callout) return undefined;
    const t = setTimeout(() => setCallout(null), 1300);
    return () => clearTimeout(t);
  }, [callout]);

  // ---- share ---------------------------------------------------------------
  function shareUrl() {
    return withRef(`mindloftdaily.com/squash${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    const a = bestToday != null ? Math.max(bestToday, g.score) : g.score;
    return `Squash #${PUZZLE.num}${sun} · ${nf(a)} points · par ${nf(PAR)}\n${shareUrl()}`;
  }
  function copyShare() {
    const txt = over ? shareText() : `Squash #${PUZZLE.num}, the daily fruit-matching game from Mind Loft. Same board for everybody.\n${shareUrl()}`;
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
      lead="Swap two fruit next to each other to line up three or more of the same fruit. They squash, everything above falls, and new fruit drops in from the top."
      banner={`Everyone gets the same board today, and the same fruit drops into each column. You have ${MOVES} moves${PUZZLE.sunday ? ' on the Sunday Edition’s bigger 9x9 board' : ''}.`}
      sub="A swap that makes no match slides back and costs nothing."
      steps={[
        <><b>Drag</b> a fruit onto its neighbour, or <b>tap</b> one and then the one beside it. On a keyboard, the arrows move a cursor, Enter picks a fruit up, and an arrow swaps it.</>,
        <>Bigger matches make special fruit. <b>Four in a line</b> makes a slicer that clears its whole row or column. An <b>L or a T</b> makes a bomb that clears the squares around it. <b>Five in a line</b> makes a punch bowl: swap it with any fruit and every fruit of that kind goes.</>,
        <>Swap two specials together for a <b>combo</b>: two slicers clear a cross, a slicer and a bomb clear three rows and three columns, two bombs clear a 5x5, and two punch bowls clear the whole board.</>,
      ]}
      knack="Fruit that falls makes new matches on its own, and every one of those pays more than the last: the second wave scores double, the third triple. Work near the bottom of the board to shake more loose, and save your specials for a combo."
      footer={`Scored on POINTS: every fruit squashed is 10 points, times the wave it fell in, plus a bonus for each special you make (60 for a slicer, 100 for a bomb, 200 for a punch bowl). ${nf(PAR)} is par for the day, and there is no ceiling. You can play the day as many times as you like, because Squash keeps your BEST run. Ties break on the clock. Squash pays at most 1 IQ point a day however many runs you play. The Sunday Edition is a 9x9 board with 30 moves.`}
    />
  );

  const tapRestart = () => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; armBoard(); } else setArmRestart(Date.now()); };
  const statusLine = over
    ? `${nf(g.score)} points in ${nf(g.used)} moves.${bestToday != null && bestToday > g.score ? ` Your best today is ${nf(bestToday)}.` : ''}`
    : !g.t0
      ? 'Make your first swap. Line up three of a kind.'
      : movesLeft === 0 ? 'Last fruit falling.'
        : `${nf(movesLeft)} move${movesLeft === 1 ? '' : 's'} left. ${shownScore >= PAR ? `${nf(shownScore - PAR)} past par.` : `${nf(PAR - shownScore)} to par.`}`;
  const parPct = Math.min(100, Math.round((shownScore / Math.max(1, PAR)) * 100));

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
        <DailyChrome slug="squash" name="Squash" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="squash" quizId={PUZZLE.quizId}
          name="Squash"
          cat="Arcade"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 9x9, 30 moves' : null}
          figures={[
            { v: nf(shownScore), k: 'points' },
            { v: nf(PAR), k: 'par' },
            { v: bestToday != null ? nf(bestToday) : '–', k: 'best' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
          <DailyMasthead
            slug="squash"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            helpTop={13}
            marginBottom={16}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && (
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>
                Sunday Edition &middot; 9x9, 30 moves
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
                      <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Squash is ready'}</div>
                      {gateRules ? rulesBody : (
                        <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                          <p style={{ margin: '0 0 6px' }}>Swap fruit to line up three of a kind. You have {MOVES} moves, the board is the same for everybody, and you can play as often as you like. Your best run is the one that counts.</p>
                        </div>
                      )}
                      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <button onClick={startGame} style={{ ...btn, background: STAGE ? STAGE_C : T.cta, borderColor: STAGE ? STAGE_C_INK : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                        <div>
                          <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                            {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!preStart && (
                    <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, position: 'relative', maxWidth: BOARD_MAX + 80, margin: '0 auto' }}>
                      {/* the meters: points against par, and the moves left */}
                      <div className="sq-meter">
                        <div className="sq-row">
                          <span>Points · <b className="sq-acc" data-sq-score="">{nf(shownScore)}</b> · par {nf(PAR)}</span>
                          <span className="sq-r">{shownScore >= PAR ? 'Past par · no ceiling' : `${parPct}% of par`}</span>
                        </div>
                        <div className="sq-bar" aria-hidden="true"><span style={{ width: `${parPct}%` }} /></div>
                        <div className="sq-row">
                          <span>Moves left · <b>{nf(movesLeft)}</b> of {nf(MOVES)}</span>
                        </div>
                        <div className="sq-segs" aria-hidden="true">
                          {Array.from({ length: MOVES }, (_, i) => <span key={i} className={i < movesLeft ? 'on' : undefined} />)}
                        </div>
                      </div>

                      <div ref={boxRef} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        <span ref={probeRef} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} />
                        <canvas
                          key={shake}
                          ref={cvsRef}
                          {...boardProps}
                          className={shake ? 'sq-shake' : undefined}
                          role="img"
                          aria-label={`Squash board, ${SIZE} by ${SIZE} fruit (${FRUITS.join(', ')}), ${shownScore} points, ${movesLeft} moves left`}
                          style={{ display: 'block', touchAction: 'none', maxWidth: '100%', borderRadius: 10, cursor: playing ? 'pointer' : 'default' }}
                        />
                        {callout && (
                          <div key={callout.key} className="sq-call" aria-live="polite">{callout.text}</div>
                        )}
                      </div>

                      <div className="sq-status">
                        <span className="sq-say" data-sq-status="">{statusLine}</span>
                        <span className="sq-help">{over ? 'Every run posts, and the board keeps your best one.' : (touchOnly ? 'Drag a fruit onto its neighbour, or tap one then the other.' : 'Drag a fruit onto its neighbour, or tap one then the other. Arrows and Enter work too.')}</span>
                      </div>

                      {playing && g.t0 && (
                        <div className="sq-tools">
                          <button type="button" className={`sq-btn sq-line${armRestart ? ' armed' : ''}`} onClick={tapRestart} disabled={busy} aria-label={armRestart ? 'Tap again to restart the run' : 'Restart run'}>{armRestart ? 'Tap again to restart' : 'Restart run'}</button>
                        </div>
                      )}

                      {over && (
                        <button
                          onClick={armBoard}
                          style={{
                            marginTop: 14, width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: SANS, fontWeight: 800, fontSize: 15, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white,
                            background: STAGE ? STAGE_C : T.cta, border: `2px solid ${STAGE ? STAGE_C_INK : T.cta}`, borderRadius: 12, padding: '13px 18px', cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={16} /> Play again
                        </button>
                      )}
                      <p className="sq-foot">{touchOnly ? 'Same board for everyone today. Your best run counts.' : 'Same board and the same falling fruit for everyone today. Play as often as you like; your best run counts.'}</p>
                    </div>
                  )}

                </div>
                {LOFT && !playing && !endHold.held && revealed && (
                  <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
                )}
              </div>
              {LOFT && !playing && !endHold.held && (
                <LoftFinish
                  name="Squash"
                  catRank={catRank}
                  outcome={verdictTone}
                  challengeMetric={Number.isFinite(g.score) ? g.score : null}
                  title={verdictWord}
                  detail={`${nf(g.score)} points · ${nf(PAR)} par`}
                  iq={iq}
                  board={dailyBoard}
                  gameRank={allTime && allTime.ready
                    ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '–',
                        label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Squash all time` : 'all-time rank' }
                    : null}
                  day={dayStats}
                  streak={isTodays ? myStats.cur : null}
                  archive={puzzles
                    .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                    .sort((x, y) => y.num - x.num)
                    .map((p) => ({
                      num: p.num,
                      dateLabel: p.dateLabel,
                      sunday: !!p.sunday,
                      href: `/squash?p=${p.num}`,
                      done: !!(myStats.rec && myStats.rec[p.num]),
                      score: (myStats.rec && myStats.rec[p.num]) ? myStats.rec[p.num].s : null,
                    }))}
                  options={[
                    { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                    { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                    prevPuzzle && { tone: 'another', label: 'Play another Squash', sub: `No. ${prevPuzzle.num}, yesterday’s board`, href: `/squash?p=${prevPuzzle.num}` },
                    nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                    { tone: 'replay', label: 'Play again', sub: 'Another run, your best one counts', onClick: armBoard },
                    { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="squash" name="Squash" onShow={() => setShowChrome(true)} />}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="Put your name on today&rsquo;s board" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="squash" name="Squash" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!focusMode && <AddToHome name="Squash" />}
          <div id="stf-stats-slot" />
          {!LOFT && (
            <DailyGamesGrid
              self="squash"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="squash" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
          )}
        </div>

        <StageFold />
        <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Squash</h2>
          <p style={{ margin: '0 0 9px' }}>
            Squash is a free daily match-three game from Mind Loft. Swap neighbouring fruit to line up three or more of a kind;
            they squash, the fruit above falls, and new fruit drops in from the top. Everyone plays the same board on the same day,
            and the same fruit drops into each column, so the leaderboard compares play rather than luck.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            Bigger matches make special fruit: four in a line makes a slicer that clears a row or column, an L or a T makes a bomb,
            and five in a line makes a punch bowl that clears every fruit of one kind. Falling fruit that makes new matches scores
            more with every wave. You get {MOVES} moves, play as many runs as you like, and your best one takes the board. The Sunday
            Edition is a 9x9 board with 30 moves.
          </p>
          <p style={{ margin: 0 }}>
            More arcade games: <a href="/blocks" style={{ color: ACC_INK }}>Blocks</a>,{' '}
            <a href="/snake" style={{ color: ACC_INK }}>Snake</a> and{' '}
            <a href="/sweep" style={{ color: ACC_INK }}>Sweep</a>.
          </p>
        </section>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="squash"
          won={won}
          quizId={PUZZLE.quizId}
          completed
          score={<>{nf(g.score)} points &middot; par {nf(PAR)}</>}
          subline={<>{nf(g.used)} moves</>}
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
        .sq-meter { display: flex; flex-direction: column; gap: 7px; margin: 0 auto 14px; max-width: ${BOARD_MAX}px; }
        .sq-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--stg-mute, #5f6774); }
        .sq-row b { color: var(--stg-ink, #0b0d12); font-weight: 800; font-variant-numeric: tabular-nums; }
        .sq-row b.sq-acc { color: var(--stg-acc-ink, #8a5a00); }
        .sq-bar { height: 8px; border-radius: 4px; background: var(--stg-line2, #c3cad6); overflow: hidden; }
        .sq-bar > span { display: block; height: 100%; background: var(--stg-acc, #fbbf24); border-radius: 4px; transition: width .35s ease-out; }
        .sq-segs { display: flex; gap: 3px; }
        .sq-segs > span { flex: 1; height: 6px; border-radius: 2px; background: var(--stg-line2, #c3cad6); opacity: .55; }
        .sq-segs > span.on { background: var(--stg-ink2, #3f4757); opacity: 1; }
        .sq-call { position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%); pointer-events: none; font-size: 26px; font-weight: 800; letter-spacing: -.01em; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.35), 0 0 18px rgba(0,0,0,.35); white-space: nowrap; animation: sqCall 1.3s ease-out 1 both; }
        @keyframes sqCall { 0% { opacity: 0; transform: translate(-50%, -30%) scale(.7); } 15% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); } 30% { transform: translate(-50%, -50%) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -75%) scale(1); } }
        .sq-status { display: flex; flex-direction: column; gap: 2px; max-width: ${BOARD_MAX}px; margin: 14px auto 0; }
        .sq-say { font-size: 15px; font-weight: 700; line-height: 1.3; color: var(--stg-ink, #0b0d12); }
        .sq-help { font-size: 12px; font-weight: 600; line-height: 1.35; color: var(--stg-mute, #5f6774); }
        .sq-tools { display: flex; justify-content: flex-end; max-width: ${BOARD_MAX}px; margin: 14px auto 0; }
        .sq-btn { font-family: ${SANS}; cursor: pointer; min-height: 44px; white-space: nowrap; border-radius: 12px; padding: 0 18px; font-size: 14px; font-weight: 700; -webkit-tap-highlight-color: transparent; }
        .sq-btn:disabled { cursor: default; opacity: .55; }
        .sq-line { background: transparent; border: 1.5px solid var(--stg-line3, #78839a); color: var(--stg-ink2, #3f4757); }
        .sq-line.armed { border-color: var(--stg-acc-ink, #8a5a00); color: var(--stg-acc-ink, #8a5a00); }
        .sq-foot { margin: 14px auto 0; max-width: ${BOARD_MAX}px; font-size: 12px; font-weight: 600; line-height: 1.4; color: var(--stg-mute, #5f6774); text-align: center; }
        @media (max-width: 560px) {
          .sq-row { font-size: 10px; }
          .sq-say { font-size: 14px; }
          .sq-help { font-size: 11.5px; }
          .sq-call { font-size: 21px; }
        }
        @keyframes sqShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .sq-shake { animation: sqShake .32s ease-out 1; }
        @media (prefers-reduced-motion: reduce) { .sq-shake, .sq-call { animation: none; } }
      ` }} />

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
