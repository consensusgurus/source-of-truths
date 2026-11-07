'use client';

// Saw, the tall daily jigsaw: Jig's sibling. GENERATED from app/jig/JigClient.jsx
// by scripts/fork-saw-client.py; do not hand edit, change Jig and re-run.
//
// Saw plays exactly like Jig (owner, 2026-11-07): the loose table on a
// computer, pieces snapping into place on a phone (the play box), the same tray,
// Peek, hint and scoring. Only the picture differs: a PORTRAIT Wikimedia Commons featured
// photo a day, cut 8x10 or 7x11 (scripts/gen-saw.mjs), so the pieces are larger
// on a phone. Its photos are re-used later by Swap, Slide and Spin
// (scripts/gen-photo-trio.mjs).

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Smartphone, Eye, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { endSolved } from '@/lib/end-verdict';
import HelpSheet from '../HelpSheet';


const ACCENT = '#0e7490';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#e6f4f7',
  accentDeep: '#0b5566',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const PEEK_COST_MS = 15000;
const PEEK_SHOW_MS = 2600;
const HOLD_MS = 240;   // press and hold this long on a touch screen and the piece lifts
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HELP_KEY = 'sot_saw_help_seen';
const STATS_KEY = 'sot_saw_stats';
const S = 100;           // one piece, in board units
const KNOB = 30;         // room a tab can reach past its square, in board units
// THE LOOSE TABLE (computers; owner, 2026-11-07, after playing Saw's launch:
// "keep them on desktop, apply to jig too, make phone the easy old way as a
// way to even the play ability"). On a computer there is no frame to snap to:
// a piece stays where it is dropped, two picture-neighbours lock when they meet
// in the right place, and a locked group moves as one. On a phone pieces snap
// into their own spot as before. The way a game is played is fixed when its
// clock starts (`mode` in the save), so resizing a window never changes it.
const JOIN = 0.3 * S;    // how close two pieces have to sit, relative to each other, to lock
const MARGIN = 0.4 * S;  // the table reaches this far past the picture on every side
const PAD = MARGIN + KNOB; // the drawing's room past the picture on the loose table
const SNAP = 0.42 * S;   // how close a drop has to land to its own spot

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
  return { played, perfect, cur, max, rec };
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

// ─── the cut ────────────────────────────────────────────────────────────────
// A classic tab-and-blank cut drawn from the puzzle's seed. Every interior
// edge is shared by two pieces and bulges into one of them; the outer edges
// are straight. Each piece is a closed path in board units (S per square).
function rng(seed) {
  let st = seed >>> 0;
  return () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
}
function cutPieces(C, R, seed) {
  const rnd = rng(seed);
  const Hz = [], Vt = [];
  for (let r = 0; r <= R; r++) { Hz[r] = []; for (let c = 0; c < C; c++) Hz[r][c] = (r === 0 || r === R) ? 0 : (rnd() < 0.5 ? 1 : -1); }
  for (let r = 0; r < R; r++) { Vt[r] = []; for (let c = 0; c <= C; c++) Vt[r][c] = (c === 0 || c === C) ? 0 : (rnd() < 0.5 ? 1 : -1); }
  // a little wobble per edge so no two tabs are identical
  const wob = {};
  const wobOf = (k) => { if (!wob[k]) wob[k] = [rnd() * 0.08 - 0.04, rnd() * 0.06 - 0.03]; return wob[k]; };
  const f = (n) => Math.round(n * 10) / 10;
  const edge = (x0, y0, x1, y1, sg, key) => {
    if (!sg) return ` L${x1} ${y1}`;
    const L = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / L, dy = (y1 - y0) / L, nx = dy, ny = -dx;
    // the wobble is a property of the EDGE, so both pieces sharing it agree:
    // walked backwards, the along-edge shift flips sign.
    const [w0, w1] = wobOf(key.k);
    const sh = key.rev ? -w0 : w0;
    const P = (u, v) => {
      const uu = u + sh, vv = v * (1 + w1);
      return `${f(x0 + dx * uu * L + nx * vv * L * sg)} ${f(y0 + dy * uu * L + ny * vv * L * sg)}`;
    };
    return ` L${P(0.35, 0)} C${P(0.40, 0)} ${P(0.42, 0.05)} ${P(0.38, 0.10)}`
      + ` C${P(0.32, 0.20)} ${P(0.42, 0.28)} ${P(0.50, 0.28)}`
      + ` C${P(0.58, 0.28)} ${P(0.68, 0.20)} ${P(0.62, 0.10)}`
      + ` C${P(0.58, 0.05)} ${P(0.60, 0)} ${P(0.65, 0)} L${x1} ${y1}`;
  };
  const out = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const x = c * S, y = r * S;
    const d = `M${x} ${y}`
      + edge(x, y, x + S, y, -Hz[r][c], { k: `h${r}-${c}`, rev: false })
      + edge(x + S, y, x + S, y + S, Vt[r][c + 1], { k: `v${r}-${c + 1}`, rev: false })
      + edge(x + S, y + S, x, y + S, Hz[r + 1][c], { k: `h${r + 1}-${c}`, rev: true })
      + edge(x, y + S, x, y, -Vt[r][c], { k: `v${r}-${c}`, rev: true })
      + ' Z';
    out.push({ i: r * C + c, r, c, x, y, d, edge: r === 0 || c === 0 || r === R - 1 || c === C - 1, corner: (r === 0 || r === R - 1) && (c === 0 || c === C - 1) });
  }
  return out;
}
function trayOrder(n, seed) {
  const rnd = rng(seed * 31 + 7);
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

// ─── the loose table ────────────────────────────────────────────────────────
// A group's shift is clamped so every piece of it stays on the table. The table
// is the picture plus MARGIN on every side, so a finished group fits only at
// (0, 0): the picture, centred.
function clampShift(m, dx, dy, C, R) {
  let r0 = R, r1 = -1, c0 = C, c1 = -1;
  for (const i of m) { const r = Math.floor(i / C), c = i % C; if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c; }
  const lo = (k0) => -MARGIN - k0 * S, hi = (k1, N) => (N - 1 - k1) * S + MARGIN;
  return [Math.max(lo(c0), Math.min(hi(c1, C), dx)), Math.max(lo(r0), Math.min(hi(r1, R), dy))];
}
// Lock group `id` to every group it now meets in the right place, repeatedly:
// two groups lock when a piece of one is the picture-neighbour of a piece of
// the other and their shifts differ by less than JOIN on both axes. The group
// that moved snaps onto the one it met, which never moves. Returns the new list
// and how many locks were made.
function joinGroups(cl, id, C) {
  let list = cl.map((x) => ({ ...x, m: x.m.slice() }));
  let joins = 0;
  for (let guard = 0; guard < 200; guard++) {
    const a = list.find((x) => x.id === id);
    if (!a) break;
    const owner = new Map();
    list.forEach((x) => x.m.forEach((i) => owner.set(i, x)));
    let hit = null;
    for (const i of a.m) {
      const r = Math.floor(i / C), c = i % C;
      const nb = [];
      if (c > 0) nb.push(i - 1);
      if (c < C - 1) nb.push(i + 1);
      if (r > 0) nb.push(i - C);
      nb.push(i + C);
      for (const j of nb) {
        const b = owner.get(j);
        if (!b || b === a) continue;
        if (Math.abs(a.dx - b.dx) < JOIN && Math.abs(a.dy - b.dy) < JOIN) { hit = b; break; }
      }
      if (hit) break;
    }
    if (!hit) break;
    // the moving group joins the one it met, keeps the top of the stack
    const merged = { id, dx: hit.dx, dy: hit.dy, m: [...hit.m, ...a.m] };
    list = list.filter((x) => x !== a && x !== hit);
    list.push(merged);
    joins++;
  }
  return { list, joins };
}

// ─── colors of note ────────────────────────────────────────────────────────
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h;
  if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}
function colorName([r, g, b]) {
  const [h, s, l] = hsl(r, g, b);
  if (l < 0.16) return 'Shadows';
  if (s < 0.1 || (s < 0.16 && (l < 0.25 || l > 0.8))) return l > 0.74 ? 'White' : l > 0.55 ? 'Light gray' : l > 0.4 ? 'Gray' : 'Dark gray';
  const base = h < 14 ? 'Red' : h < 40 ? 'Orange' : h < 66 ? 'Yellow' : h < 160 ? 'Green' : h < 196 ? 'Teal' : h < 255 ? 'Blue' : h < 292 ? 'Purple' : h < 340 ? 'Pink' : 'Red';
  if (l > 0.7) return `Light ${base.toLowerCase()}`;
  if (l < 0.3) return `Dark ${base.toLowerCase()}`;
  return base;
}
// k-means over each piece's average color, four groups, farthest-point seeded
// so the result is the same on every device.
function colorGroups(avgs) {
  const n = avgs.length;
  if (!n) return [];
  const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const K = Math.min(4, n);
  const cents = [avgs[0].slice()];
  while (cents.length < K) {
    let bi = 0, bd = -1;
    for (let i = 0; i < n; i++) { const d = Math.min(...cents.map((c) => dist(c, avgs[i]))); if (d > bd) { bd = d; bi = i; } }
    cents.push(avgs[bi].slice());
  }
  let lab = new Array(n).fill(0);
  for (let it = 0; it < 10; it++) {
    lab = avgs.map((p) => { let bi = 0, bd = Infinity; cents.forEach((c, k) => { const d = dist(c, p); if (d < bd) { bd = d; bi = k; } }); return bi; });
    for (let k = 0; k < K; k++) {
      const m = avgs.filter((_, i) => lab[i] === k);
      if (m.length) cents[k] = [0, 1, 2].map((j) => m.reduce((a, p) => a + p[j], 0) / m.length);
    }
  }
  const groups = cents.map((c, k) => ({ rgb: c, members: avgs.map((_, i) => i).filter((i) => lab[i] === k) }))
    .filter((gr) => gr.members.length)
    .sort((a, b) => b.members.length - a.members.length);
  const seen = {};
  return groups.map((gr) => {
    let name = colorName(gr.rgb);
    seen[name] = (seen[name] || 0) + 1;
    if (seen[name] > 1) name = `${name} ${seen[name]}`;
    const hex = '#' + gr.rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    return { name, hex, members: new Set(gr.members) };
  });
}

function freshState() {
  return {
    v: 1,
    mode: null,            // 'snap' (phone: pieces snap into their spot) or 'loose' (computer: the loose table), fixed at Start
    placed: [],            // snap: piece indices on the board, in the order they went in
    cl: [],                // loose: groups on the table, bottom to top: { id, dx, dy, m: [piece indices] }
    nid: 1,                // loose: the next group id
    pen: 0,                // milliseconds added by Peek
    peeks: 0,
    hintUsed: false,
    status: 'playing',     // playing | won | revealed
    t0: null,              // stays null until Start: opening a game is not starting it
    tEnd: null,
  };
}

const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60], bad: [20] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function SawClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const C = PUZZLE.cols, R = PUZZLE.rows;
  const NP = C * R;
  const BW = C * S, BH = R * S;
  const STORE_KEY = `sot_saw_${PUZZLE.num}`;
  const IMG = `/api/saw/img?n=${PUZZLE.num}`;
  const PIECES = useMemo(() => cutPieces(C, R, PUZZLE.seed), [C, R, PUZZLE.seed]);
  const ORDER = useMemo(() => trayOrder(NP, PUZZLE.seed), [NP, PUZZLE.seed]);

  const [g, setG] = useState(() => freshState());
  const [view, setView] = useState('edges');    // tray: edges | color | all (opens sorted)
  const [colPick, setColPick] = useState(0);    // which color group fills the first bin
  const [groups, setGroups] = useState(null);   // color groups measured from the photo
  const [imgOk, setImgOk] = useState(true);
  const [sel, setSel] = useState(-1);           // a piece picked with a tap, waiting for a tap on the board
  const [drag, setDrag] = useState(null);       // { i, size } while a piece is being dragged
  const [gdrag, setGdrag] = useState(null);     // loose table: { id, ddx, ddy } while a group is being moved
  const selRef = useRef(-1);
  const [flashMiss, setFlashMiss] = useState(false);
  const [peekUntil, setPeekUntil] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('saw', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('saw'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [boardH, setBoardH] = useState(0);
  // Full screen (owner 2026-10-15, phones and tablets from 2026-10-16): the
  // board card takes the whole window. Wide, the board sits beside a
  // full-height tray; narrow, the board sits on top and the tray fills the rest.
  // A browser that has the Fullscreen API (desktop, iPad) also hides its own
  // chrome; one that has none (iPhone) still gets the whole page.
  const [full, setFull] = useState(false);
  const [fitW, setFitW] = useState(0);
  const fullRef = useRef(false);
  // narrow = the phone layout (CSS breakpoint 820px). trayOpen = See more on a
  // phone: the two-row strip becomes a taller grid that scrolls up and down.
  const [narrow, setNarrow] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const vScroll = narrow && (full || trayOpen);   // the phone tray as an up-and-down grid
  const stripMode = narrow && !vScroll;            // the phone's two-row sideways strip
  // THE PLAY BOX (owner, 2026-11-07: "on mobile, user should be able to scroll
  // within the play box"). On a phone, once the clock runs, the board and the
  // tray share one box the height of the screen: the tray stays pinned under
  // the board and the board scrolls inside its own frame, so a piece never has
  // to travel past the edge of the screen. Zoom makes the board bigger inside
  // that frame (scroll both ways); a drag near the frame's edge scrolls it.
  const [zoom, setZoom] = useState(1);
  const [boxH, setBoxH] = useState(0);
  const boxRef = useRef(null);
  const autoScroll = useRef(null);
  selRef.current = sel;
  const playRef = useRef(null);
  const sideRef = useRef(null);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const boardRef = useRef(null);
  const ghostRef = useRef(null);
  const press = useRef(null);
  const missTimer = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const boxMode = narrow && !full && started;   // the phone play box (see zoom above)
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('saw');
  const STAGE = isStage('saw', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('saw');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('saw');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('saw'), '--stg-acc-lt': gameColorLight('saw'), '--stg-onramp-lt': gameOnrampLight('saw'), '--stg-acc-ink-lt': gameAccentInkLight('saw') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'saw', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'saw', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'saw', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'saw', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'saw', active: LOFT && !playing });

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
        const okIdx = (i) => Number.isInteger(i) && i >= 0 && i < NP;
        const okGroup = (x) => x && Number.isInteger(x.id) && Number.isFinite(x.dx) && Number.isFinite(x.dy) && Array.isArray(x.m) && x.m.length && x.m.every(okIdx);
        if (saved && saved.v === 1 && Array.isArray(saved.cl) && saved.cl.every(okGroup)) {
          setG({ ...freshState(), ...saved, mode: 'loose', placed: [] });
        } else if (saved && saved.v === 1 && Array.isArray(saved.placed) && saved.placed.every(okIdx)) {
          setG({ ...freshState(), ...saved, mode: saved.mode === 'loose' ? 'snap' : (saved.mode || 'snap'), cl: [] });
        }
      }
      setGateRules(false);
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
        if (done || g.t0) localStorage.setItem('sot_saw_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_saw_day');
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

  // ---- the photo's colors, measured once on a small canvas ----
  useEffect(() => {
    let dead = false;
    const im = new Image();
    im.onload = () => {
      if (dead) return;
      try {
        const px = 12;
        const cv = document.createElement('canvas');
        cv.width = C * px; cv.height = R * px;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        const iw = im.naturalWidth, ih = im.naturalHeight, want = C / R;
        let sx = 0, sy = 0, sw = iw, sh = ih;
        if (iw / ih > want) { sw = ih * want; sx = (iw - sw) / 2; } else { sh = iw / want; sy = (ih - sh) / 2; }
        cx.drawImage(im, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
        const data = cx.getImageData(0, 0, cv.width, cv.height).data;
        const avgs = [];
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          let a = 0, b = 0, d = 0, n = 0;
          for (let y = r * px; y < r * px + px; y++) for (let x = c * px; x < c * px + px; x++) {
            const k = (y * cv.width + x) * 4; a += data[k]; b += data[k + 1]; d += data[k + 2]; n++;
          }
          avgs.push([a / n, b / n, d / n]);
        }
        setGroups(colorGroups(avgs));
      } catch (e) { setGroups([]); }
    };
    im.onerror = () => { if (!dead) { setImgOk(false); setGroups([]); } };
    im.src = IMG;
    return () => { dead = true; };
  }, [IMG, C, R]);

  // the board's rendered height, so the desktop tray never runs past it
  useEffect(() => {
    const el = boardRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setBoardH(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [preStart]);

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

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const clockMs = g.t0 ? Math.max(0, (g.tEnd || nowTick) - g.t0) + (g.pen || 0) : 0;
  const elapsed = fmtTime(clockMs);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const LOOSE = g.mode === 'loose';
  const BP = LOOSE ? PAD : KNOB;   // the drawing's room past the picture
  const placedSet = useMemo(() => new Set(LOOSE ? g.cl.flatMap((x) => x.m) : g.placed), [LOOSE, g.cl, g.placed]);
  const placedCount = placedSet.size;
  const biggest = LOOSE ? g.cl.reduce((a, x) => Math.max(a, x.m.length), 0) : placedCount;
  const hideSol = LOFT && g.status === 'revealed' && !revealed;
  const shownOnBoard = hideSol ? new Set(g.pre || []) : placedSet;
  const shownGroups = LOOSE ? (hideSol ? (g.pre || []) : g.cl) : [];

  const REC_KEY = `sot_saw_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = placedSet.size > 0 || g.hintUsed || g.peeks > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now()) + (g.pen || 0)) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round((((g2.tEnd || Date.now()) - g2.t0) + (g2.pen || 0)) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: 0, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Nothing is counted against you, so a solver tie resolves on the clock
        // alone, Peek's seconds included.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now(), mode: cur.mode || (narrow ? 'snap' : 'loose') }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // The drag handlers live on window and outlast a render, so placement reads
  // the latest state through a ref rather than a closure that may be stale.
  const gRef = useRef(g);
  gRef.current = g;
  function placePiece(i, extra) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.placed.includes(i)) return;
    const g2 = { ...cur, ...(extra || null), placed: [...cur.placed, i] };
    if (!g2.t0) g2.t0 = Date.now();
    if (g2.placed.length === NP) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
    } else {
      vibrate(HAPT.ok);
    }
    gRef.current = g2;
    setG(g2);
    setSel(-1);
  }
  // Apply a new table (after a put-down or a group move), lock what now meets,
  // and finish when one group holds every piece.
  function commitTable(cl2, movedId, extra, nid2) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const { list, joins } = movedId != null ? joinGroups(cl2, movedId, C) : { list: cl2, joins: 0 };
    const g2 = { ...cur, ...(extra || null), cl: list, nid: nid2 != null ? nid2 : cur.nid };
    if (!g2.t0) g2.t0 = Date.now();
    if (list.length === 1 && list[0].m.length === NP) {
      // the whole picture: it settles into the middle of the table
      g2.cl = [{ ...list[0], dx: 0, dy: 0 }];
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
    } else if (joins) {
      vibrate(HAPT.ok);
    }
    gRef.current = g2;
    setG(g2);
    setSel(-1);
  }
  // A loose piece put down on the table, centred on board point (x, y).
  function putDown(i, x, y, extra) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.cl.some((k) => k.m.includes(i))) return;
    const p = PIECES[i];
    const [dx, dy] = clampShift([i], x - (p.x + S / 2), y - (p.y + S / 2), C, R);
    const id = cur.nid || 1;
    commitTable([...cur.cl, { id, dx, dy, m: [i] }], id, extra, id + 1);
  }

  function miss() {
    setFlashMiss(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => setFlashMiss(false), 420);
    vibrate(HAPT.bad);
  }

  // where a client point lands on the board, in board units
  function boardPoint(clientX, clientY) {
    const el = boardRef.current;
    if (!el) return null;
    const rc = el.getBoundingClientRect();
    const k = (BW + 2 * BP) / rc.width;
    return { x: (clientX - rc.left) * k - BP, y: (clientY - rc.top) * k - BP, over: clientX >= rc.left && clientX <= rc.right && clientY >= rc.top && clientY <= rc.bottom };
  }
  function tryDrop(i, cx, cy) {
    const p = PIECES[i];
    const pt = boardPoint(cx, cy);
    if (!pt) return;
    // the loose table: anywhere on it, the piece stays where it lands
    if (gRef.current.mode === 'loose') { if (pt.over) putDown(i, pt.x, pt.y); return; }
    const hx = p.x + S / 2, hy = p.y + S / 2;
    if (Math.hypot(pt.x - hx, pt.y - hy) <= SNAP) { placePiece(i); return; }
    if (pt.over) miss();
  }

  // ---- drag from the tray ----
  // A press on a tray piece becomes a drag once it moves; a press that does not
  // move is a tap, which picks the piece for a tap on the board. On touch the
  // piece rides above the finger so it is never hidden under it.
  function scaleNow() {
    const el = boardRef.current;
    if (!el) return 1;
    return el.getBoundingClientRect().width / (BW + 2 * BP);
  }
  // On a touch screen the tray scrolls one way and a piece is dragged the other:
  // the phone's two-row strip scrolls sideways, so a piece lifts when the finger
  // starts upward; the taller grids (See more, full screen, the tablet side
  // tray) scroll up and down, so a piece lifts when the finger starts sideways.
  // Press and hold lifts a piece in any direction. A swipe that is a scroll
  // never picks or lifts anything.
  function trayDown(e, i) {
    if (!playing || !g.t0) return;
    const touch = e.pointerType !== 'mouse';
    const pr = { i, x0: e.clientX, y0: e.clientY, touch, dragging: false, id: e.pointerId, el: e.currentTarget, axis: touch ? (stripMode ? 'y' : 'x') : null, hold: 0 };
    press.current = pr;
    if (touch) {
      pr.hold = setTimeout(() => {
        if (press.current !== pr || pr.dragging) return;
        pr.held = true;
        startDrag(pr, pr.x0, pr.y0);
        try { if (navigator.vibrate) navigator.vibrate(8); } catch (err) {}
      }, HOLD_MS);
    }
  }
  function startDrag(pr, x, y) {
    clearTimeout(pr.hold);
    pr.dragging = true;
    pr.cx = x; pr.cy = y;
    try { pr.el.setPointerCapture(pr.id); } catch (err) {}
    setSel(-1);
    setDrag({ i: pr.i, size: Math.round((S + 2 * KNOB) * scaleNow()) });
  }
  function ghostAt(cx, cy) {
    const gh = ghostRef.current;
    const pr = press.current;
    if (!gh || !pr) return;
    const sz = gh.offsetWidth;
    const lift = pr.touch ? sz * 0.62 : 0;
    gh.style.transform = `translate(${Math.round(cx - sz / 2)}px, ${Math.round(cy - sz / 2 - lift)}px)`;
  }
  // ---- moving a group on the table ----
  // Any piece on the table, alone or locked into a group, is pressed and dragged
  // with its whole group. Let go over the tray and a lone piece goes back into it.
  function tableDown(e, gid) {
    if (!playing || !g.t0) return;
    e.stopPropagation();
    press.current = { group: gid, x0: e.clientX, y0: e.clientY, id: e.pointerId, touch: e.pointerType !== 'mouse', dragging: false, k: 1 / scaleNow() };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function overTray(cx, cy) {
    const el = sideRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  }
  function groupUp(pr, cx, cy) {
    setGdrag(null);
    if (!pr.dragging) return;
    const cur = gRef.current;
    const grp = cur.cl.find((x) => x.id === pr.group);
    if (!grp || cur.status !== 'playing') return;
    const others = cur.cl.filter((x) => x !== grp);
    if (grp.m.length === 1 && overTray(cx, cy)) { commitTable(others, null); return; }
    const [dx, dy] = clampShift(grp.m, grp.dx + (cx - pr.x0) * pr.k, grp.dy + (cy - pr.y0) * pr.k, C, R);
    commitTable([...others, { ...grp, dx, dy }], grp.id);
  }
  const onMove = (e) => {
    const pr = press.current;
    if (!pr || e.pointerId !== pr.id) return;
    if (pr.group != null) {
      if (!pr.dragging && Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0) < 4) return;
      pr.dragging = true;
      setGdrag({ id: pr.group, ddx: (e.clientX - pr.x0) * pr.k, ddy: (e.clientY - pr.y0) * pr.k });
      return;
    }
    if (!pr.dragging) {
      const dx = e.clientX - pr.x0, dy = e.clientY - pr.y0;
      if (Math.hypot(dx, dy) < 7) return;
      // the tray's own scroll direction: let the browser have it
      if ((pr.axis === 'y' && Math.abs(dy) < Math.abs(dx)) || (pr.axis === 'x' && Math.abs(dx) < Math.abs(dy))) {
        clearTimeout(pr.hold);
        press.current = null;
        return;
      }
      startDrag(pr, e.clientX, e.clientY);
    }
    pr.cx = e.clientX; pr.cy = e.clientY;
    if (!pr.moved && Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0) >= 7) pr.moved = true;
    ghostAt(e.clientX, e.clientY);
    edgeScroll();
  };
  // In the play box, a piece held near the board frame's edge scrolls the board
  // that way, and keeps scrolling while it is held there.
  function edgeScroll() {
    const box = boxRef.current, pr = press.current;
    if (!boxMode || !box || !pr || !pr.dragging) { stopEdge(); return; }
    const r = box.getBoundingClientRect();
    const lift = pr.touch && ghostRef.current ? ghostRef.current.offsetWidth * 0.62 : 0;
    const x = pr.cx, y = pr.cy - lift;   // where the piece is, not the finger
    const E = 44, V = 14;
    const inX = x > r.left - 20 && x < r.right + 20;
    let vx = 0, vy = 0;
    if (inX && y < r.top + E && y > r.top - 60) vy = -V;
    else if (inX && y > r.bottom - E && y < r.bottom + 10) vy = V;
    if (y > r.top && y < r.bottom) { if (x < r.left + E) vx = -V; else if (x > r.right - E) vx = V; }
    if (!vx && !vy) { stopEdge(); return; }
    autoScroll.current = { vx, vy };
    if (!autoScroll.current.t) {
      const tick = () => {
        const a = autoScroll.current, b = boxRef.current;
        if (!a || !b) return;
        b.scrollTop += a.vy; b.scrollLeft += a.vx;
        a.t = requestAnimationFrame(tick);
      };
      autoScroll.current.t = requestAnimationFrame(tick);
    }
  }
  function stopEdge() {
    const a = autoScroll.current;
    if (a && a.t) cancelAnimationFrame(a.t);
    autoScroll.current = null;
  }
  const onUp = (e) => {
    const pr = press.current;
    if (!pr || e.pointerId !== pr.id) return;
    stopEdge();
    press.current = null;
    if (pr.group != null) { groupUp(pr, e.clientX, e.clientY); return; }
    clearTimeout(pr.hold);
    // a slow tap: lifted by the hold but never moved, so it picks the piece
    if (pr.dragging && pr.held && !pr.moved) {
      setDrag(null);
      setSel((s) => (s === pr.i ? -1 : pr.i));
      return;
    }
    if (!pr.dragging) {
      setSel((s) => (s === pr.i ? -1 : pr.i));
      return;
    }
    const gh = ghostRef.current;
    const sz = gh ? gh.offsetWidth : 0;
    const lift = pr.touch ? sz * 0.62 : 0;
    setDrag(null);
    tryDrop(pr.i, e.clientX, e.clientY - lift);
  };
  const onCancel = (e) => {
    const pr = press.current;
    if (!pr || e.pointerId !== pr.id) return;
    stopEdge();
    press.current = null;
    if (pr.group != null) { setGdrag(null); return; }
    clearTimeout(pr.hold);
    setDrag(null);
  };
  // window listeners registered once, calling the latest handlers through a ref
  const handlers = useRef(null);
  handlers.current = { onMove, onUp, onCancel };
  useEffect(() => {
    const mv = (e) => handlers.current.onMove(e);
    const up = (e) => handlers.current.onUp(e);
    const cn = (e) => handlers.current.onCancel(e);
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cn);
    // Once a piece is lifted the page must not scroll under the finger. Only a
    // non-passive touchmove can say so (a held piece in a tray that scrolls the
    // same way would otherwise be cancelled by the browser's own scroll).
    const tm = (e) => { const pr = press.current; if (pr && (pr.dragging || pr.group != null) && pr.touch && e.cancelable) e.preventDefault(); };
    document.addEventListener('touchmove', tm, { passive: false });
    return () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cn);
      document.removeEventListener('touchmove', tm);
    };
  }, []);
  useEffect(() => {
    if (drag && press.current) ghostAt(press.current.cx || press.current.x0, press.current.cy || press.current.y0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function boardTap(e) {
    if (!playing || sel < 0) return;
    const p = PIECES[sel];
    const pt = boardPoint(e.clientX, e.clientY);
    if (!pt) return;
    if (LOOSE) { putDown(sel, pt.x, pt.y); return; }
    if (Math.hypot(pt.x - (p.x + S / 2), pt.y - (p.y + S / 2)) <= S * 0.5) placePiece(sel);
    else miss();
  }

  // See more (phones): open the tray into a taller grid, and bring the board to
  // the top of the screen so the board and the opened tray share the view.
  function toggleTray() {
    const open = !trayOpen;
    setTrayOpen(open);
    if (!open || boxMode) return;
    requestAnimationFrame(() => {
      const el = playRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 8;
      try { window.scrollTo({ top, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, top); }
    });
  }

  function peek() {
    if (!playing || !g.t0 || Date.now() < peekUntil) return;
    setG((cur) => ({ ...cur, pen: (cur.pen || 0) + PEEK_COST_MS, peeks: (cur.peeks || 0) + 1 }));
    setPeekUntil(Date.now() + PEEK_SHOW_MS);
    setTimeout(() => setPeekUntil(0), PEEK_SHOW_MS + 30);
    say('Peek: 15 seconds added to your clock.');
  }

  // iPadOS Safari before 16.4 only has the webkit-prefixed API; iPhone Safari
  // has neither for a page, so there the CSS overlay is the whole of it.
  const fsElement = () => (typeof document === 'undefined' ? null : (document.fullscreenElement || document.webkitFullscreenElement || null));
  function enterFull() {
    fullRef.current = true;
    setFull(true);
    try {
      const el = document.documentElement;
      if (!fsElement()) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) {
          const pr = req.call(el);
          if (pr && pr.catch) pr.catch(() => {});
        }
      }
    } catch (e) {}
  }
  function exitFull() {
    fullRef.current = false;
    setFull(false);
    setFitW(0);
    try {
      if (fsElement()) {
        const ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex) { const pr = ex.call(document); if (pr && pr.catch) pr.catch(() => {}); }
      }
    } catch (e) {}
  }
  // The browser's own Esc (or iPad's close button) leaves its full screen;
  // follow it out.
  useEffect(() => {
    const onFs = () => { if (!fsElement() && fullRef.current) { fullRef.current = false; setFull(false); setFitW(0); } };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => { document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('webkitfullscreenchange', onFs); };
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 820px)');
    const f = () => setNarrow(mq.matches);
    f();
    if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', f); else if (mq.removeListener) mq.removeListener(f); };
  }, []);
  // The page underneath must not scroll while the board covers it.
  useEffect(() => {
    if (!full) return undefined;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => { root.style.overflow = prev; };
  }, [full]);
  // Size the board to the space it has: as wide as fits beside the tray, never
  // taller than the window allows. The board box carries the width, so the peek
  // image (placed in percentages of it) stays on the picture.
  useEffect(() => {
    if (!full) return undefined;
    const el = playRef.current;
    if (!el) return undefined;
    const ar = (BW + 2 * BP) / (BH + 2 * BP);
    const fit = () => {
      const r = el.getBoundingClientRect();
      let w;
      if (window.innerWidth <= 820) {
        // board on top, the tray below keeps at least ~44% of the height
        w = Math.min(r.width, r.height * 0.56 * ar);
      } else {
        const side = sideRef.current ? sideRef.current.getBoundingClientRect().width : 0;
        w = Math.min(r.width - side - 18, r.height * ar);
      }
      setFitW(Math.floor(Math.max(200, w)));
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', fit);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [full, BW, BH, narrow, BP]);
  // The play box: on a phone, once play starts, bring the board to the top of
  // the screen and make the box exactly the height that is left, so the board
  // frame and the tray under it are both always in view.
  useEffect(() => {
    if (!boxMode) { setBoxH(0); return undefined; }
    const el = playRef.current;
    if (!el) return undefined;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    // Bring the box to the top of the screen, then size it to what is left
    // below its top edge, leaving room for the Peek / Hint row under it. The
    // page around it settles for a moment as play starts (the chrome folds
    // away), so it is placed again a few times while that happens.
    const place = () => {
      const top0 = el.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo(0, Math.max(0, top0));
      const top = Math.max(0, el.getBoundingClientRect().top);
      const h = vv ? vv.height : window.innerHeight;
      setBoxH(Math.max(320, Math.floor(h - top - 66)));
    };
    const size = () => {
      const top = Math.max(0, el.getBoundingClientRect().top);
      const h = vv ? vv.height : window.innerHeight;
      setBoxH(Math.max(320, Math.floor(h - top - 66)));
    };
    place();
    const ts = [60, 250, 600].map((ms) => setTimeout(place, ms));
    const on = vv || window;
    on.addEventListener('resize', size);
    return () => { ts.forEach(clearTimeout); on.removeEventListener('resize', size); };
  }, [boxMode]);
  useEffect(() => () => stopEdge(), []);
  // A finished board leaves full screen so the end card can show.
  useEffect(() => { if (!playing && fullRef.current) exitFull(); }, [playing]);

  // One free hint, first play only: a corner (then an edge) drops into place.
  function useHint() {
    if (!hintOk || !playing || g.hintUsed || !g.t0) return;
    if (LOOSE) { looseHint(); return; }
    const pick = PIECES.find((p) => p.corner && !placedSet.has(p.i)) || PIECES.find((p) => p.edge && !placedSet.has(p.i)) || PIECES.find((p) => !placedSet.has(p.i));
    if (!pick) return;
    placePiece(pick.i, { hintUsed: true });
    say('Hint placed, one piece is in.');
  }

  function looseHint() {
    const free = (i) => !placedSet.has(i);
    const corner = PIECES.find((p) => p.corner && free(p.i)) || PIECES.find((p) => free(p.i));
    if (!corner) return;
    const near = [corner.i];
    const r = corner.r, c = corner.c;
    [[r, c + (c === 0 ? 1 : -1)], [r + (r === 0 ? 1 : -1), c]].forEach(([rr, cc]) => {
      const j = rr * C + cc;
      if (rr >= 0 && rr < R && cc >= 0 && cc < C && free(j)) near.push(j);
    });
    const id = g.nid || 1;
    commitTable([...g.cl, { id, dx: 0, dy: 0, m: near }], id, { hintUsed: true }, id + 1);
    say(`Hint: ${near.length} pieces are down, locked together.`);
  }

  function revealEnd() {
    const g2 = LOOSE
      ? { ...g, pre: g.cl.map((x) => ({ ...x, m: x.m.slice() })), preBig: biggest, cl: [{ id: 0, dx: 0, dy: 0, m: PIECES.map((p) => p.i) }], status: 'revealed', tEnd: Date.now() }
      : { ...g, pre: g.placed.slice(), placed: PIECES.map((p) => p.i), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setSel(-1); setEndClosed(false); setRevealed(false);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (selRef.current < 0 && fullRef.current) exitFull();
      setSel(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function shareText() {
    const peekBit = g.peeks ? ` · ${g.peeks} peek${g.peeks > 1 ? 's' : ''}` : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Saw #${PUZZLE.num} · ${NP} pieces in ${elapsed}${peekBit}${streakBit}`
      : `Saw #${PUZZLE.num} · gave up at ${LOOSE ? `${g.preBig || 0}/${NP} joined` : `${placedCount}/${NP}`}`;
    return `${head2}\n\u{1F9E9}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/saw${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Saw #${PUZZLE.num}, the tall daily jigsaw from Mind Loft.\n${shareUrl()}`
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

  // ---- the tray's contents ----
  const loose = useMemo(() => ORDER.filter((i) => !placedSet.has(i)), [ORDER, placedSet]);
  const haveColors = Array.isArray(groups) && groups.length >= 2;
  const colIdx = haveColors ? Math.min(colPick, groups.length - 1) : 0;
  const bins = useMemo(() => {
    if (view === 'all') return null;
    if (view === 'color' && haveColors) {
      const gr = groups[colIdx];
      return [
        { key: 'a', label: gr.name, items: loose.filter((i) => gr.members.has(i)) },
        { key: 'b', label: 'The rest', items: loose.filter((i) => !gr.members.has(i)) },
      ];
    }
    return [
      { key: 'a', label: 'Edges', items: loose.filter((i) => PIECES[i].edge) },
      { key: 'b', label: 'Middle', items: loose.filter((i) => !PIECES[i].edge) },
    ];
  }, [view, haveColors, groups, colIdx, loose, PIECES]);

  // A piece drawn on its own, in board units, cropped around its tabs. Every
  // drawing points its fill at the one photo pattern in the board's defs.
  const pieceSvg = (i, px, extraClass) => {
    const p = PIECES[i];
    return (
      <svg className={extraClass} width={px} height={px} viewBox={`${p.x - KNOB} ${p.y - KNOB} ${S + 2 * KNOB} ${S + 2 * KNOB}`} aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible' }}>
        <path d={p.d} fill={`url(#swpic-${PUZZLE.num})`} style={{ stroke: 'rgba(255,255,255,0.55)', strokeWidth: 2 }} />
      </svg>
    );
  };
  const trayPiece = (i) => (
    <button key={i} type="button" className={`jg-tp${sel === i ? ' sel' : ''}${drag && drag.i === i ? ' lifted' : ''}`}
      onPointerDown={(e) => trayDown(e, i)}
      onClick={(e) => { e.preventDefault(); if (e.detail === 0 && playing) setSel((s) => (s === i ? -1 : i)); }}
      aria-pressed={sel === i}
      aria-label={`Piece ${PIECES[i].edge ? 'from the edge' : 'from the middle'}${sel === i ? ', picked: tap its spot on the board' : ''}`}>
      {pieceSvg(i, '100%')}
    </button>
  );

  const statusText = LOOSE ? (sel >= 0
    ? 'Piece picked. Click anywhere on the table to put it down.'
    : placedCount
      ? `${biggest} of ${NP} joined in your biggest group. Pieces lock when they meet in the right place.`
      : `Put pieces down anywhere on the table. Two that belong together lock when they meet. ${NP} pieces today.`)
    : sel >= 0
    ? 'Piece picked. Tap where it goes on the board, or drag it there.'
    : placedCount
      ? `${placedCount} of ${NP} pieces in. Drag the next one onto the board.`
      : `Drag a piece onto the board. It snaps in when it is near its own spot. ${NP} pieces today.`;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Put the picture back together. Today's photo stands tall and is cut into pieces that interlock with tabs and blanks. On a computer you build it on a loose table, the way you would at home; on a phone each piece snaps into its own spot. Pieces never need turning."
      steps={[
        <><b>On a computer</b> there is no frame: drag a piece from the tray and it stays wherever you drop it. Bring two pieces together, side by side as they are in the picture, and they lock; a locked group moves as one, and a lone piece dragged back over the tray goes back in. <b>On a phone</b>, drop a piece near its own spot and it snaps in; anywhere else it slides back, at no cost. Tap a piece to pick it, then tap the board; press and hold to lift it.</>,
        <><b>The tray opens sorted.</b> <b>Edges</b> splits the loose pieces into edge pieces and the middle, <b>Colors</b> into one of the picture&rsquo;s colors and the rest, and <b>All</b> shows every loose piece in one bin.</>,
        <><b>Peek</b> shows the whole picture for a moment and adds 15 seconds to your clock. Edge pieces have a straight side; corners have two.</>,
      ]}
      knack="Do the edges first: the tray opens on Edges, so build the frame, then fill it a color at a time. A sky, a lake or a field falls fastest once its pieces are in one bin."
      footer="Finish the picture and you score a perfect 10, and because nothing is counted against you, the daily leaderboard is a straight race on the clock, Peek seconds included. One free hint, on your first ever play, drops a corner in (on a computer, with its two neighbours). Every Saw photo stands tall and is cut into 77 or 80 pieces."
    />
  );

  const peeking = peekUntil > Date.now();

  return (
    <div className={[STAGE ? 'stage-page' : (LOFT ? 'loft-page' : ''), full ? 'jg-isfull' : ''].filter(Boolean).join(' ') || undefined}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="saw" name="Saw" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="saw" quizId={PUZZLE.quizId}
          name="Saw"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${NP} pieces` : null}
          figures={[
            { v: elapsed, k: 'time' },
            LOOSE ? { v: `${biggest}/${NP}`, k: 'joined' } : { v: `${placedCount}/${NP}`, k: 'pieces' },
          ]}
        />
      )}
      <div className="jg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.jg-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .jg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .jg-meter{margin:0 0 12px;}
          .jg-mlab{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute, ${COLORS.faded});}
          .jg-mlab b{color:var(--stg-acc-ink, ${COLORS.accentDeep});font-weight:800;font-size:13px;letter-spacing:0;}
          .jg-mbar{height:8px;border-radius:3px;overflow:hidden;background:var(--stg-line2, rgba(11,15,26,0.18));margin-top:7px;}
          .jg-mbar span{display:block;height:100%;background:var(--stg-acc, ${COLORS.accent});transition:width .2s ease-out;}
          .jg-play{display:flex;gap:18px;align-items:flex-start;}
          .jg-boardbox{flex:999 1 560px;min-width:0;position:relative;}
          .jg-board{display:block;width:100%;height:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
          .jg-board.miss .jg-ground{fill:color-mix(in srgb, var(--stg-bad, #be123c) 22%, var(--stg-cell, #f2f4f8));}
          .jg-ground{fill:var(--stg-cell, #eef1f6);stroke:var(--stg-cell-line, rgba(11,15,26,0.3));stroke-width:2;transition:fill .15s;}
          .jg-peek{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .2s;}
          .jg-peek.on{opacity:1;}
          .jg-side{flex:1 1 300px;min-width:0;max-width:360px;display:flex;flex-direction:column;gap:10px;}
          .jg-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
          .jg-seg{display:inline-flex;padding:3px;border-radius:10px;border:1.5px solid var(--stg-line2, rgba(11,15,26,0.22));}
          .jg-seg button{font-family:${SANS};font-size:13px;font-weight:700;min-height:38px;padding:0 13px;border:0;border-radius:7px;background:transparent;color:var(--stg-ink2, ${COLORS.ink});cursor:pointer;}
          .jg-seg button[aria-pressed="true"]{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #ffffff);font-weight:800;}
          .jg-sw{display:flex;gap:6px;flex-wrap:wrap;}
          .jg-swb{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 11px 0 7px;border-radius:999px;border:1.5px solid var(--stg-line2, rgba(11,15,26,0.22));background:transparent;color:var(--stg-ink2, ${COLORS.ink});font-family:${SANS};font-size:12.5px;font-weight:700;cursor:pointer;}
          .jg-swb i{width:20px;height:20px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);display:block;}
          .jg-swb[aria-pressed="true"]{border:2.5px solid var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));font-weight:800;color:var(--stg-ink, ${COLORS.ink});}
          .jg-tray{border:1px solid var(--stg-line, rgba(11,15,26,0.14));border-radius:14px;padding:10px;overflow-y:auto;scrollbar-width:thin;}
          .jg-bin + .jg-bin{margin-top:10px;padding-top:10px;border-top:1px solid var(--stg-line, rgba(11,15,26,0.14));}
          .jg-binlab{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute, ${COLORS.faded});margin:0 2px 6px;}
          .jg-binlab b{color:var(--stg-ink, ${COLORS.ink});}
          .jg-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(62px, 1fr));gap:4px;}
          .jg-tp{aspect-ratio:1;padding:0;border:0;background:transparent;cursor:grab;border-radius:10px;touch-action:pan-y;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;}
          .jg-tp:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .jg-tp.sel{background:color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 26%, transparent);box-shadow:inset 0 0 0 2px var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));}
          .jg-tp.lifted{opacity:.25;}
          .jg-tp:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));outline-offset:1px;}
          .jg-empty{font-size:13px;font-weight:600;color:var(--stg-mute, ${COLORS.faded});padding:6px 2px;}
          .jg-ghost{position:fixed;left:0;top:0;z-index:80;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.35));will-change:transform;}
          .jg-foot{display:flex;align-items:center;gap:10px;border-top:1px solid var(--stg-line, rgba(11,15,26,0.14));padding-top:12px;margin-top:14px;flex-wrap:wrap;}
          .jg-msg{flex:1 1 260px;font-size:14px;font-weight:700;line-height:1.4;color:var(--stg-ink, ${COLORS.ink});}
          .jg-ob{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2, ${COLORS.ink});border:1.5px solid var(--stg-line2, rgba(11,15,26,0.24));border-radius:12px;padding:0 16px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;}
          .jg-ob:hover:not(:disabled){background:var(--stg-surf2, ${COLORS.accentSoft});}
          .jg-ob:disabled{opacity:.55;cursor:default;}
          .jg-below{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 4px 0;flex-wrap:wrap;}
          .jg-rule{font-size:12px;font-weight:600;color:var(--stg-mute, ${COLORS.faded});}
          .jg-link{font-family:${SANS};font-size:12.5px;font-weight:700;background:none;border:0;color:var(--stg-ink2, ${COLORS.ink});text-decoration:underline;text-underline-offset:3px;min-height:44px;padding:0 6px;cursor:pointer;}
          .jg-link.armed{color:var(--stg-bad, ${COLORS.rust});}
          .jg-credit{font-size:12px;font-weight:600;line-height:1.5;color:var(--stg-mute, ${COLORS.faded});margin:10px 0 0;}
          .jg-credit a{color:inherit;}
          .jg-top{display:flex;align-items:flex-end;gap:12px;margin:0 0 12px;}
          .jg-top .jg-meter{flex:1 1 auto;margin:0;}
          .jg-fs{flex:none;min-height:38px;padding:0 12px;font-size:13px;border-radius:10px;}
          .jg-zoom{position:relative;}
          .jg-board.lt{touch-action:none;}
          .lt-grp{cursor:grab;transition:transform .16s ease-out;}
          .lt-grp.mv{cursor:grabbing;transition:none;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35));}
          .lt-grp.settle{transition:transform .6s cubic-bezier(.2,.8,.2,1);}
          @media (prefers-reduced-motion: reduce){.lt-grp{transition:none !important;}}
          .jg-foot.inbox{margin-top:8px !important;padding-top:8px !important;}
          .jg-foot.inbox .jg-msg{display:none;}
          .jg-play.box{flex-direction:column;align-items:stretch;gap:8px;min-height:0;}
          .jg-play.box .jg-boardbox.scr{flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;border-radius:12px;scrollbar-width:thin;}
          .jg-play.box .jg-side{flex:none;gap:8px;}
          .jg-play.box .jg-tray.vs{max-height:42vh !important;max-height:42dvh !important;}
          .jg-play.box .jg-tray{padding:6px 8px;}
          .jg-play.box .jg-tray.bins:not(.vs) .jg-grid{grid-template-rows:58px;}
          .jg-play.box .jg-bin + .jg-bin{margin-top:6px;padding-top:6px;}
          .jg-play.box .jg-binlab{margin-bottom:4px;}
          .jg-play.box .jg-more{min-height:36px;}
          .jg-zm{display:inline-flex;border:1px solid var(--stg-line, rgba(11,15,26,0.16));border-radius:999px;overflow:hidden;margin-right:8px;flex:none;}
          .jg-zm button{min-width:38px;height:32px;border:0;background:transparent;font:800 17px/1 inherit;color:inherit;cursor:pointer;}
          .jg-zm button+button{border-left:1px solid var(--stg-line, rgba(11,15,26,0.16));}
          .jg-zm button:disabled{opacity:.35;cursor:default;}
          .jg-isfull .jg-wrap{z-index:200 !important;}
          .jg-isfull .jg-ghost{z-index:210;}
          .jg-card.jg-full{position:fixed;inset:0;z-index:5;margin:0 !important;border:0 !important;border-radius:0 !important;box-shadow:none !important;background:var(--stg-ground, ${T.surface}) !important;padding:16px 24px 14px !important;display:flex;flex-direction:column;overflow:hidden;}
          .jg-full .jg-play{flex:1 1 auto;min-height:0;align-items:stretch;justify-content:center;}
          .jg-full .jg-boardbox{flex:none;align-self:center;}
          .jg-full .jg-side{flex:0 0 380px;max-width:380px;min-height:0;}
          .jg-full .jg-tray{max-height:none !important;flex:1 1 auto;min-height:0;}
          .jg-full .jg-foot{margin-top:10px;padding-top:10px;}
          .jg-full .jg-below{padding-top:2px;}
          .jg-more{display:none;}
          @media(max-width:820px){
            .jg-play{flex-direction:column;align-items:stretch;gap:12px;}
            .jg-boardbox{flex:none;}
            .jg-side{max-width:none;flex:none;}
            .jg-tray{max-height:none !important;overflow-y:visible;padding:8px;}
            .jg-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2, 58px);grid-auto-columns:58px;grid-template-columns:none;overflow-x:auto;overscroll-behavior-x:contain;padding-bottom:4px;scrollbar-width:thin;}
            .jg-tp{touch-action:pan-x;}
            .jg-foot .jg-msg{display:none;}
            .jg-foot .jg-ob{flex:1 1 0;}
            .jg-tray.vs{max-height:max(260px, calc(100vh - var(--jg-bh, 300px) - 170px)) !important;max-height:max(260px, calc(100dvh - var(--jg-bh, 300px) - 170px)) !important;overflow-y:auto !important;overscroll-behavior:contain;}
            .jg-tray.vs .jg-grid{grid-auto-flow:row;grid-template-rows:none;grid-auto-columns:auto;grid-template-columns:repeat(auto-fill, minmax(56px, 1fr));overflow-x:visible;padding-bottom:0;}
            .jg-tray.vs .jg-tp{touch-action:pan-y;}
            .jg-more{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;min-height:44px;font-family:${SANS};font-size:13.5px;font-weight:800;border-radius:12px;border:1.5px solid var(--stg-line2, rgba(11,15,26,0.24));background:var(--stg-surf2, ${COLORS.accentSoft});color:var(--stg-ink, ${COLORS.ink});cursor:pointer;}
            .jg-fs{padding:0 10px;}
            .jg-card.jg-full{padding:calc(8px + env(safe-area-inset-top)) 10px calc(8px + env(safe-area-inset-bottom)) !important;}
            .jg-full .jg-top{margin-bottom:8px;}
            .jg-full .jg-play{gap:8px;}
            .jg-full .jg-side{flex:1 1 0;max-width:none;min-height:0;gap:8px;}
            .jg-full .jg-tray.vs{max-height:none !important;flex:1 1 auto;min-height:0;}
            .jg-full .jg-foot{margin-top:8px;padding-top:8px;}
            .jg-full .jg-below{display:none;}
          }
        ` }} />

        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="saw"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: SANS, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {NP} pieces</span>}
          blocks={'JIG'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column', maxWidth: 720, margin: '0 auto' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : null}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Today&rsquo;s tall photo is cut into {NP} pieces{PUZZLE.sunday ? ', the Sunday Edition' : ''}. Drag each one to its place; it snaps in when it is close. The picture stays a surprise until you start.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="jg-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Back' : 'How to play'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        <div className={`${STAGE ? 'stg-board' : (LOFT ? 'loft-card' : '')} jg-card${full ? ' jg-full' : ''}`} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>{LOOSE ? 'joined' : 'pieces'} <b style={{ color: placedCount === NP ? COLORS.green : INK, fontWeight: 700 }}>{LOOSE ? biggest : placedCount}</b>/{NP}</span>
          </div>
          )}

          <div className="jg-top">
          <div className="jg-meter" role="meter" aria-valuemin={0} aria-valuemax={NP} aria-valuenow={biggest} aria-label={LOOSE ? `Biggest group: ${biggest} of ${NP} pieces joined` : `Pieces placed: ${placedCount} of ${NP}`}>
            <span className="jg-mlab">{LOOSE ? 'Biggest group' : 'Pieces placed'} &middot; <b>{biggest}</b> of {NP}{LOOSE ? ' joined' : ''}{g.peeks ? <> &middot; {g.peeks} peek{g.peeks > 1 ? 's' : ''} (+{g.peeks * 15}s)</> : null}</span>
            <div className="jg-mbar" aria-hidden="true"><span style={{ width: `${(biggest / NP) * 100}%` }} /></div>
          </div>
          {started && (
            <button type="button" className="jg-ob jg-fs" onClick={full ? exitFull : enterFull} aria-pressed={full}
              title={full ? 'Leave full screen (Esc)' : 'Play on the whole screen'}>
              {full ? <Minimize2 size={15} aria-hidden="true" /> : <Maximize2 size={15} aria-hidden="true" />} {full ? 'Exit full screen' : 'Full screen'}
            </button>
          )}
          </div>

          <div className={`jg-play${boxMode ? ' box' : ''}`} ref={playRef} style={boxMode && boxH ? { height: boxH } : undefined}>
            <div className={`jg-boardbox${boxMode ? ' scr' : ''}`} ref={boxRef} style={full && fitW ? { width: fitW } : (narrow ? undefined : { maxWidth: `max(320px, calc((100vh - 230px) * ${((BW + 2 * BP) / (BH + 2 * BP)).toFixed(3)}))` })}>
             <div className="jg-zoom" style={boxMode && zoom > 1 ? { width: `${zoom * 100}%` } : undefined}>
              <svg ref={boardRef} className={`jg-board${flashMiss ? ' miss' : ''}${LOOSE && started ? ' lt' : ''}`} viewBox={`${-BP} ${-BP} ${BW + 2 * BP} ${BH + 2 * BP}`}
                role="img" aria-label={LOOSE ? `Saw table, ${biggest} of ${NP} pieces joined in the biggest group` : `Saw board, ${placedCount} of ${NP} pieces placed`} onClick={boardTap}>
                <defs>
                  <pattern id={`swpic-${PUZZLE.num}`} patternUnits="userSpaceOnUse" x="0" y="0" width={BW} height={BH}>
                    <image href={IMG} x="0" y="0" width={BW} height={BH} preserveAspectRatio="xMidYMid slice" />
                  </pattern>
                </defs>
                {LOOSE ? (
                  <>
                    {/* the table: no frame and no outlines, just somewhere to build */}
                    <rect className="jg-ground" x={-MARGIN - KNOB / 2} y={-MARGIN - KNOB / 2} width={BW + 2 * MARGIN + KNOB} height={BH + 2 * MARGIN + KNOB} rx={14} />
                    {/* Bigger groups lie underneath smaller ones, so a loose piece is never
                        lost under the picture taking shape; the group in hand is always on top. */}
                    {shownGroups
                      .map((grp, k) => ({ grp, k }))
                      .sort((x, y) => ((gdrag && x.grp.id === gdrag.id) - (gdrag && y.grp.id === gdrag.id)) || (y.grp.m.length - x.grp.m.length) || (x.k - y.k))
                      .map(({ grp }) => {
                        const mv = gdrag && gdrag.id === grp.id;
                        const tx = grp.dx + (mv ? gdrag.ddx : 0), ty = grp.dy + (mv ? gdrag.ddy : 0);
                        const done = won || (!playing && revealed);
                        return (
                          <g key={grp.id} className={`lt-grp${mv ? ' mv' : ''}${won ? ' settle' : ''}`} style={{ transform: `translate(${tx}px, ${ty}px)` }}
                            onPointerDown={playing ? (e) => tableDown(e, grp.id) : undefined}>
                            {grp.m.map((i) => (
                              <path key={i} d={PIECES[i].d} fill={`url(#swpic-${PUZZLE.num})`}
                                style={{ stroke: done ? 'rgba(255,255,255,0.10)' : (grp.m.length > 1 ? 'rgba(10,14,24,0.30)' : 'rgba(255,255,255,0.7)'), strokeWidth: 1.6 }} />
                            ))}
                          </g>
                        );
                      })}
                  </>
                ) : (
                  <>
                    <rect className="jg-ground" x={-6} y={-6} width={BW + 12} height={BH + 12} rx={10} />
                    {PIECES.filter((p) => shownOnBoard.has(p.i)).map((p) => (
                      <path key={p.i} className="jg-pc" d={p.d} fill={`url(#swpic-${PUZZLE.num})`} style={{ stroke: won || (!playing && revealed) ? 'rgba(255,255,255,0.10)' : 'rgba(10,14,24,0.45)', strokeWidth: 1.6 }} />
                    ))}
                  </>
                )}
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={`jg-peek${peeking ? ' on' : ''}`} src={IMG} alt="" aria-hidden="true"
                style={{ left: `${(BP / (BW + 2 * BP)) * 100}%`, top: `${(BP / (BH + 2 * BP)) * 100}%`, width: `${(BW / (BW + 2 * BP)) * 100}%`, height: `${(BH / (BH + 2 * BP)) * 100}%`, objectFit: 'cover', borderRadius: 4 }} />
              {!imgOk && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: FADED, textAlign: 'center', padding: 20 }}>
                  Today&rsquo;s photo did not load. Refresh the page to try again.
                </div>
              )}
             </div>
            </div>

            {playing && (
              <div className="jg-side" ref={sideRef}>
                <div className="jg-ctl">
                  {boxMode && (
                    <div className="jg-zm" role="group" aria-label="Board size">
                      <button type="button" onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 2) / 2))} disabled={zoom <= 1} aria-label="Smaller board">&minus;</button>
                      <button type="button" onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.5) * 2) / 2))} disabled={zoom >= 2.5} aria-label="Bigger board">+</button>
                    </div>
                  )}
                  <div className="jg-seg" role="group" aria-label="Sort the tray">
                    <button type="button" aria-pressed={view === 'edges'} onClick={() => setView('edges')}>Edges</button>
                    <button type="button" aria-pressed={view === 'color'} onClick={() => setView('color')} disabled={!haveColors}>Colors</button>
                    <button type="button" aria-pressed={view === 'all'} onClick={() => setView('all')}>All</button>
                  </div>
                </div>
                {view === 'color' && haveColors && (
                  <div className="jg-sw" role="group" aria-label="Color for the first bin">
                    {groups.map((gr, k) => (
                      <button key={gr.name} type="button" className="jg-swb" aria-pressed={k === colIdx} onClick={() => setColPick(k)}>
                        <i style={{ background: gr.hex }} />{gr.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className={`jg-tray${vScroll ? ' vs' : ''}${bins ? ' bins' : ''}`} style={{ maxHeight: boardH ? Math.max(220, boardH - (view === 'color' && haveColors ? 110 : 60)) : 460, '--jg-bh': `${Math.round(boardH)}px` }}>
                  {bins ? bins.map((b) => (
                    <div key={b.key} className="jg-bin">
                      <div className="jg-binlab"><b>{b.label}</b> &middot; {b.items.length}</div>
                      {b.items.length ? <div className="jg-grid">{b.items.map(trayPiece)}</div> : <div className="jg-empty">Nothing left in this bin.</div>}
                    </div>
                  )) : (
                    <div className="jg-bin">
                      <div className="jg-binlab"><b>Loose pieces</b> &middot; {loose.length}</div>
                      <div className="jg-grid">{loose.map(trayPiece)}</div>
                    </div>
                  )}
                </div>
                {narrow && !full && (trayOpen || loose.length > 12) && (
                  <button type="button" className="jg-more" aria-expanded={trayOpen} onClick={toggleTray}>
                    {trayOpen ? <><ChevronUp size={16} aria-hidden="true" /> Show fewer</> : <><ChevronDown size={16} aria-hidden="true" /> See more pieces &middot; {loose.length} left</>}
                  </button>
                )}
              </div>
            )}
          </div>

          {started && (
            <div className={`jg-foot${boxMode ? ' inbox' : ''}`}>
              <span className="jg-msg" aria-live="polite">{statusText}</span>
              <button type="button" className="jg-ob" onClick={peek} disabled={peeking} title="Show the whole picture for a moment (adds 15 seconds)">
                <Eye size={15} aria-hidden="true" /> Peek +15s
              </button>
              {hintOk && !g.hintUsed && (
                <button type="button" className="jg-ob" onClick={useHint} title="Drop a corner in (one hint, first play only)">
                  <Lightbulb size={15} aria-hidden="true" /> Hint
                </button>
              )}
            </div>
          )}

          {started && (
            <div className="jg-below">
              <span className="jg-rule">{LOOSE ? 'Put pieces down anywhere. Neighbours lock when they meet; a locked group moves as one.' : 'Drop a piece near its own spot and it snaps in. A wrong drop costs nothing.'}</span>
              {started ? (
                <button type="button" className={`jg-link${armReveal ? ' armed' : ''}`}
                  onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}>
                  {armReveal ? 'Tap again to reveal (ends the puzzle)' : 'Reveal'}
                </button>
              ) : <span />}
            </div>
          )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <p className="jg-credit">
                Today&rsquo;s picture: <b style={{ color: INK }}>{PUZZLE.name}</b>. Photo by {PUZZLE.by}, {PUZZLE.lic}, via{' '}
                <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(PUZZLE.t.replace(/ /g, '_'))}`} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>.
              </p>
              {!STAGE && isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              {!STAGE && (<p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Saw in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new picture drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/saw?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Saw &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/saw" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Saw &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
                  </>
                )}
              </p>)}
            </div>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide the picture</button>
          )}
        </div>
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Saw"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={endSolved(won)}
            detail={LOOSE ? `${won ? NP : (g.preBig || 0)}/${NP} joined · ${elapsed}` : `${won ? NP : (g.pre || []).length}/${NP} pieces · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Saw all time` : 'all-time rank' }
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
                href: `/saw?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the picture', sub: PUZZLE.name, onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the finished picture', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Saw', sub: `No. ${prevPuzzle.num}, yesterday's picture`, href: `/saw?p=${prevPuzzle.num}` },
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

        </div>

        {!STAGE && <GamePanel self="saw" name="Saw" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="saw" name="Saw" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="saw"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="saw" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Saw to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s picture, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s picture, every day.
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

      {drag && (
        <div ref={ghostRef} className="jg-ghost" style={{ width: drag.size, height: drag.size }} aria-hidden="true">
          <svg width={drag.size} height={drag.size} viewBox={`${PIECES[drag.i].x - KNOB} ${PIECES[drag.i].y - KNOB} ${S + 2 * KNOB} ${S + 2 * KNOB}`} style={{ display: 'block', overflow: 'visible' }}>
            <path d={PIECES[drag.i].d} fill={`url(#swpic-${PUZZLE.num})`} style={{ stroke: '#ffffff', strokeWidth: 2.5 }} />
          </svg>
        </div>
      )}

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="saw"
          won={won}
          headline={won ? <>Picture complete!</> : <>Picture revealed</>}
          subline={won
            ? <>{NP} pieces in {elapsed}{g.peeks ? <> &middot; {g.peeks} peek{g.peeks > 1 ? 's' : ''}</> : null}</>
            : <>{PUZZLE.name}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 220, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="saw" name="Saw">
            {rulesBody}
          </HelpSheet>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Saw</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Saw is a free daily online jigsaw puzzle from Mind Loft, the tall sibling of <a href="/jig" style={{ color: INK, fontWeight: 800 }}>Jig</a>. Every day brings a new portrait photograph, a featured picture from Wikimedia Commons, cut taller than wide into 77 or 80 classic interlocking pieces. Everyone gets the same picture and the same cut, so the daily leaderboard is a fair race.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          On a computer you build it on a loose table: a piece stays where you drop it, and two that belong together lock when they meet. On a phone each piece snaps into its own spot. Pieces never need turning. Sort the tray into edge pieces and the middle, or one of the picture&rsquo;s colors and the rest. Peek shows the whole picture for a moment and adds 15 seconds to the clock. On a phone the board and the tray share one box: the board scrolls inside it and the plus button makes it bigger. Full screen gives the board and the tray the whole screen.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Finish the picture for a perfect 10; the fastest time tops the board. No app, no signup, play free in your browser. Want a wide picture? <a href="/jig" style={{ color: INK, fontWeight: 800 }}>Jig</a> is the same daily jigsaw on a landscape photo, and the photos from both come back later in <a href="/swap" style={{ color: INK, fontWeight: 800 }}>Swap</a>, <a href="/slide" style={{ color: INK, fontWeight: 800 }}>Slide</a> and <a href="/spin" style={{ color: INK, fontWeight: 800 }}>Spin</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
