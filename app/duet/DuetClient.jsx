'use client';

// Duet — the daily balanced grid.
//
// Fill every square with a DOT or a RING. Every row, every column and every
// walled ROOM holds half of each; never three alike in a line, across or
// down; an '=' mark joins two squares that match, an 'x' two that differ.
// Each board has exactly one solution, always reachable by logic.
//
// Rule breaks ARE flagged as they happen (three alike, a line or room over
// its half, a broken mark), because a break is visible on the board anyway
// and flagging it gives nothing away about the answer. A square that is
// merely wrong is never flagged. A solve is a flat 10 and the daily board is
// a race on the clock, the same lane as Polka and Snug.
//
// Plumbing forked from app/polka/PolkaClient.jsx: banked boards gated by
// Eastern date on the server (app/duet/page.js), per-board localStorage
// saves, /duet?p=N archive pinning, streaks, the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone, Trash2 } from 'lucide-react';
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

// A new game gets no colour of its own: on the stage it wears the Logic step
// of the category ramp. ACCENT is only the legacy (pre-stage) fallback.
const ACCENT = '#1a7f37';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#e8f5ec',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_duet_help_seen';
const STATS_KEY = 'sot_duet_stats';
const GRID_MAX = 468;
const EMPTY = -1, RING = 0, DOT = 1;

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

// Every rule break on the board, for the live flags. Returns the squares
// that sit in a break and the marks that are broken.
function findBreaks(cells, p) {
  const n = p.n, half = n / 2;
  const bad = new Set();
  const badMark = new Set();
  const at = (r, c) => cells[r * n + c];
  for (let k = 0; k < n; k++) {
    for (const o of [0, 1]) {
      const idx = (i) => (o === 0 ? k * n + i : i * n + k);
      for (const v of [RING, DOT]) {
        let cnt = 0;
        for (let i = 0; i < n; i++) if (cells[idx(i)] === v) cnt++;
        if (cnt > half) for (let i = 0; i < n; i++) if (cells[idx(i)] === v) bad.add(idx(i));
      }
      for (let i = 0; i + 2 < n; i++) {
        const a = cells[idx(i)];
        if (a !== EMPTY && a === cells[idx(i + 1)] && a === cells[idx(i + 2)]) { bad.add(idx(i)); bad.add(idx(i + 1)); bad.add(idx(i + 2)); }
      }
    }
  }
  const rooms = {};
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) (rooms[p.rooms[r][c]] = rooms[p.rooms[r][c]] || []).push(r * n + c);
  for (const sq of Object.values(rooms)) {
    for (const v of [RING, DOT]) {
      const hit = sq.filter((i) => cells[i] === v);
      if (hit.length * 2 > sq.length) hit.forEach((i) => bad.add(i));
    }
  }
  p.edges.forEach(([a, b, c, d, t], i) => {
    const x = at(a, b), y = at(c, d);
    if (x !== EMPTY && y !== EMPTY && ((x === y) !== (t === '='))) badMark.add(i);
  });
  return { bad, badMark, any: bad.size + badMark.size > 0 };
}

// The edge marks, one SVG sheet over the grid on the cell borders. Pointer
// events off, so a tap always reaches the square underneath. Paint is
// currentColor / tokens, never an ink literal (the SVG paint contrast rule).
function MarksOverlay({ edges, n, badMark }) {
  return (
    <svg viewBox={`0 0 ${n} ${n}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }} aria-hidden="true">
      {edges.map(([a, b, c, d, t], i) => {
        const x = a === c ? Math.max(b, d) : b + 0.5;
        const y = a === c ? a + 0.5 : Math.max(a, c);
        const broken = badMark.has(i);
        const ink = broken ? 'var(--stg-bad, #be123c)' : 'var(--stg-ink, #0b0d12)';
        const s = 0.075;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={0.16} strokeWidth={0.035} style={{ fill: broken ? 'color-mix(in srgb, var(--stg-bad, #be123c) 20%, var(--stg-cell, #fff))' : 'var(--stg-cell, #ffffff)', stroke: broken ? 'var(--stg-bad, #be123c)' : 'var(--stg-cell-line, rgba(11,15,26,0.44))' }} />
            {t === '='
              ? <path d={`M${x - s} ${y - 0.035}H${x + s}M${x - s} ${y + 0.035}H${x + s}`} strokeWidth={0.032} strokeLinecap="round" style={{ stroke: ink, fill: 'none' }} />
              : <path d={`M${x - s * 0.8} ${y - s * 0.8}L${x + s * 0.8} ${y + s * 0.8}M${x + s * 0.8} ${y - s * 0.8}L${x - s * 0.8} ${y + s * 0.8}`} strokeWidth={0.032} strokeLinecap="round" style={{ stroke: ink, fill: 'none' }} />}
          </g>
        );
      })}
    </svg>
  );
}

function freshState(p) {
  const cells = Array(p.n * p.n).fill(EMPTY);
  for (const [r, c, v] of p.givens) cells[r * p.n + c] = v;
  return { v: 1, cells, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function DuetClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.n;
  const CELLS = N * N;
  const STORE_KEY = `sot_duet_${PUZZLE.num}`;
  const solFlat = useMemo(() => PUZZLE.sol.flat(), [PUZZLE]);
  const givenSet = useMemo(() => new Set(PUZZLE.givens.map(([r, c]) => r * N + c)), [PUZZLE, N]);
  const FREE = useMemo(() => {
    const out = [];
    for (let i = 0; i < CELLS; i++) if (!givenSet.has(i)) out.push(i);
    return out;
  }, [givenSet, CELLS]);

  const [g, setG] = useState(() => freshState(PUZZLE));
  const [sel, setSel] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('duet', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('duet'); }, [g.hintUsed]);
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

  const cells = g.cells;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('duet');
  const STAGE = isStage('duet', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('duet');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('duet'), '--stg-acc-lt': gameColorLight('duet'), '--stg-onramp-lt': gameOnrampLight('duet'), '--stg-acc-ink-lt': gameAccentInkLight('duet') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'duet', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'duet', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'duet', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'duet', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'duet', active: LOFT && !playing });

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
          setG({ ...freshState(PUZZLE), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_duet_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_duet_day');
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

  // ---- metrics (the shared /api/quiz/* flow) ----
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

  const liveFilled = useMemo(() => FREE.reduce((n, i) => n + (cells[i] !== EMPTY ? 1 : 0), 0), [cells, FREE]);
  const filledCount = g.status === 'revealed' && g.revealFilled != null ? g.revealFilled : liveFilled;
  const hasEntries = liveFilled > 0;
  const breaks = useMemo(() => (playing ? findBreaks(cells, PUZZLE) : { bad: new Set(), badMark: new Set(), any: false }), [cells, PUZZLE, playing]);

  function isSolved(cs) {
    for (const i of FREE) if (cs[i] !== solFlat[i]) return false;
    return true;
  }

  const REC_KEY = `sot_duet_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = FREE.some((i) => g.cells[i] !== EMPTY) || g.hintUsed;
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
        // Nothing counts against you, so the board resolves solver ties on the clock.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function pushUndo() {
    undoRef.current = [...undoRef.current.slice(-79), cells.slice()];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || !playing) return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    setG((cur) => ({ ...cur, cells: prev.slice() }));
  }

  // Put a value in a square. EMPTY clears it.
  function setCell(idx, v) {
    if (!playing || idx < 0 || givenSet.has(idx)) return;
    if (cells[idx] === v) return;
    pushUndo();
    const next = cells.slice();
    next[idx] = v;
    const g2 = { ...g, cells: next };
    if (!g2.t0) g2.t0 = Date.now();
    if (isSolved(next)) {
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
    if (FREE.every((i) => next[i] !== EMPTY) && !findBreaks(next, PUZZLE).any) say('Every square is filled, but the board is not solved yet.');
  }
  // Tap cycles empty -> dot -> ring -> empty.
  function cycle(idx) {
    const v = cells[idx];
    setCell(idx, v === EMPTY ? DOT : v === DOT ? RING : EMPTY);
  }
  function cellClick(idx) {
    setSel(idx);
    if (givenSet.has(idx)) return;
    cycle(idx);
  }

  function clearBoard() {
    if (!playing || !hasEntries) return;
    if (!armClear) { setArmClear(Date.now()); return; }
    if (Date.now() - armClear < ARM_MIN_MS) return;
    setArmClear(false);
    pushUndo();
    setG((cur) => ({ ...cur, cells: freshState(PUZZLE).cells }));
    say('Board cleared, back to the printed squares. Undo brings it back.');
  }

  // One free hint, first play only: fill the selected square if it is open or
  // wrong, else the first wrong or open square in reading order.
  function useHint() {
    if (!hintOk || !playing || g.hintUsed) return;
    let idx = (sel >= 0 && !givenSet.has(sel) && cells[sel] !== solFlat[sel]) ? sel : -1;
    if (idx < 0) idx = FREE.find((i) => cells[i] !== solFlat[i]);
    if (idx == null || idx < 0) return;
    const next = cells.slice();
    next[idx] = solFlat[idx];
    const g2 = { ...g, cells: next, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(idx);
    if (isSolved(next)) {
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
    const g2 = { ...g, cells: solFlat.slice(), revealFilled: liveFilled, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    setG(freshState(PUZZLE)); setSel(-1); setJustWon(false); setEndClosed(false);
  }

  // Desktop keyboard: arrows move, Space or Enter cycles, D or 1 a dot, R or 2
  // a ring, 0 / Backspace clears.
  const onKey = useCallback((e) => {
    if (!playing || !g.t0) return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'Escape') { setSel(-1); return; }
    const cur = sel < 0 ? 0 : sel;
    const r = Math.floor(cur / N), c = cur % N;
    if (k === 'ArrowUp') { e.preventDefault(); setSel(((r + N - 1) % N) * N + c); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setSel(((r + 1) % N) * N + c); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); setSel(r * N + (c + N - 1) % N); return; }
    if (k === 'ArrowRight') { e.preventDefault(); setSel(r * N + (c + 1) % N); return; }
    if (sel < 0) return;
    if (k === ' ' || k === 'Enter') { e.preventDefault(); cycle(sel); return; }
    if (k === 'd' || k === 'D' || k === '1') { setCell(sel, DOT); return; }
    if (k === 'r' || k === 'R' || k === '2') { setCell(sel, RING); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { setCell(sel, EMPTY); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    // Dots and rings, but never the board: all or nothing, like the score.
    const row = won ? '⚫⚪⚫⚪⚫⚪' : '⬜'.repeat(6);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Duet #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${N}×${N} solved in ${elapsed}${hintBit}${streakBit}`
      : `Duet #${PUZZLE.num} · gave up`;
    return `${head2}\n${row}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/duet${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Duet #${PUZZLE.num}, the daily dots-and-rings logic grid from Mind Loft.\n${shareUrl()}`
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

  const WALL = 'var(--stg-line3, rgba(28,30,36,0.85))';
  const THIN = 'var(--stg-cell-line, rgba(28,30,36,0.18))';
  function cellStyle(idx) {
    const r = Math.floor(idx / N), c = idx % N, id = PUZZLE.rooms[r][c];
    const wallR = c < N - 1 && PUZZLE.rooms[r][c + 1] !== id;
    const wallB = r < N - 1 && PUZZLE.rooms[r + 1][c] !== id;
    const given = givenSet.has(idx);
    const isBad = breaks.bad.has(idx);
    let bg = STAGE ? 'var(--stg-cell)' : T.white;
    if (given) bg = STAGE ? 'color-mix(in srgb, var(--stg-ink) 9%, var(--stg-cell))' : '#eef1f6';
    if (isBad) bg = 'color-mix(in srgb, var(--stg-bad, #be123c) 18%, var(--stg-cell, #ffffff))';
    return {
      background: bg,
      boxShadow: idx === sel && playing && g.t0 ? `inset 0 0 0 2.5px var(--stg-acc, ${COLORS.accent})` : undefined,
      borderRight: c === N - 1 ? 'none' : `${wallR ? 3 : 1}px solid ${wallR ? WALL : THIN}`,
      borderBottom: r === N - 1 ? 'none' : `${wallB ? 3 : 1}px solid ${wallB ? WALL : THIN}`,
      cursor: given || !playing ? 'default' : 'pointer',
    };
  }
  function markFor(idx) {
    const v = cells[idx];
    if (v === EMPTY) return null;
    const isBad = breaks.bad.has(idx);
    const given = givenSet.has(idx);
    if (v === DOT) {
      return <span aria-hidden="true" style={{ width: '54%', height: '54%', borderRadius: '50%', background: isBad ? 'var(--stg-bad, #be123c)' : (given ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-acc, ${COLORS.accent})`), display: 'block' }} />;
    }
    return <span aria-hidden="true" style={{ width: '50%', height: '50%', borderRadius: '50%', border: `${N >= 10 ? 3 : 4}px solid ${isBad ? 'var(--stg-bad, #be123c)' : (given ? `var(--stg-ink, ${COLORS.ink})` : 'var(--stg-ink2, #3f4757)')}`, boxSizing: 'border-box', display: 'block' }} />;
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Fill every square with a dot or a ring. Every row, every column and every walled room holds half dots and half rings, and never three alike in a line, across or down. An = between two squares means they match; an × means they differ."
      steps={[
        <><b>Tap a square</b> to cycle it: dot, then ring, then empty. On desktop the <b>arrow keys</b> move, <b>D</b> or <b>1</b> places a dot, <b>R</b> or <b>2</b> a ring, Space cycles.</>,
        <>Shaded squares are <b>printed</b> and cannot change. Thick lines are the <b>walls</b> between rooms.</>,
        <>A square turns red when it breaks a rule. <b>Undo</b> (or Ctrl+Z) takes back a move; <b>Clear</b> wipes the board.</>,
      ]}
      knack="Two alike side by side push the opposite onto both ends, and two alike with a gap push the opposite into the gap. A room is just another line with walls for edges: once half of it is dots, the rest are rings."
      footer="Every board has exactly one solution and can always be reached by logic, with no guessing. Solve it for a perfect 10; nothing is counted against you, so the daily leaderboard is a race on the clock. One free hint, on your first ever play, fills a correct square. Boards grow from 6×6 early in the week to 8×8, and the Sunday Edition is 10×10."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="duet" name="Duet" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="duet" quizId={PUZZLE.quizId}
          name="Duet"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 10×10' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${filledCount}/${FREE.length}`, k: 'filled' },
          ]}
        />
      )}
      <div className="du-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.du-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .du-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .du-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .du-cell{display:flex;align-items:center;justify-content:center;box-sizing:border-box;position:relative;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;overflow:hidden;padding:0;border-top:none;border-left:none;font:inherit;}
          .du-cell:focus-visible{outline:3px solid var(--stg-acc, ${COLORS.accent});outline-offset:-3px;}
          .du-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="duet"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 10×10</span>}
          blocks={'DUET'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Duet is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Fill every square with a dot or a ring. Every row, column and walled room is half and half, never three alike in a line. An = joins two squares that match, an × two that differ.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="du-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>filled <b style={{ color: INK, fontWeight: 500 }}>{filledCount}</b>/{FREE.length}</span>
          </div>
          )}

          <div style={{ maxWidth: GRID_MAX, margin: '0 auto' }}>
            <div role="grid" aria-label={`Duet board, ${N} by ${N}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`, aspectRatio: '1', border: `3px solid ${WALL}`, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              {Array.from({ length: CELLS }).map((_, idx) => {
                const v = cells[idx];
                const r = Math.floor(idx / N), c = idx % N;
                const word = v === EMPTY ? 'empty' : v === DOT ? 'dot' : 'ring';
                return (
                  <button key={idx} type="button" className="du-cell" style={cellStyle(idx)}
                    onClick={() => cellClick(idx)}
                    disabled={!playing}
                    aria-label={`Row ${r + 1}, column ${c + 1}, ${word}${givenSet.has(idx) ? ', printed' : ''}${breaks.bad.has(idx) ? ', breaks a rule' : ''}`}>
                    {markFor(idx)}
                  </button>
                );
              })}
              <MarksOverlay edges={PUZZLE.edges} n={N} badMark={breaks.badMark} />
            </div>
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className="du-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Undo
              </button>
              <button className="du-tool" onClick={clearBoard} disabled={!hasEntries}
                title="Clear every square you have filled and start over on the same clock"
                style={hasEntries
                  ? (armClear ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderColor: 'rgba(192,57,43,0.5)', color: `var(--stg-ink, ${COLORS.rust})` } : undefined)
                  : { opacity: 0.4, cursor: 'default' }}>
                <Trash2 size={14} /> {armClear ? 'Tap again to clear' : 'Clear'}
              </button>
              {hintOk && !g.hintUsed && (
                <button className="du-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ color: ACC_DEEP_INK }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--stg-line, rgba(28,30,36,0.10))', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: breaks.any ? 'var(--stg-bad, #be123c)' : `var(--stg-mute, ${COLORS.faded})` }}>
              {breaks.any ? 'Something on the board breaks a rule.' : 'Tap a square: dot, then ring, then empty.'}
            </span>
            {identity && filledCount > 0 && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again to end and show the solution' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: a 10×10 board, the biggest of the week.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Duet in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new Duet drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/duet?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Duet &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(/, 20\d\d$/, '')} archive.{' '}
                    <a href="/duet" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Duet &rarr;</a>
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
            name="Duet"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${N}×${N} · ${filledCount}/${FREE.length} filled · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Duet all time` : 'all-time rank' }
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
                href: `/duet?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished grid', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the solution', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Duet', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/duet?p=${prevPuzzle.num}` },
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

        {!STAGE && <GamePanel self="duet" name="Duet" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="duet" name="Duet" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="duet"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="duet" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Duet to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s Duet, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s Duet, every day.
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
          self="duet"
          won={won}
          headline={won ? <>Board solved!</> : <>Board revealed</>}
          subline={won
            ? <>solved in {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>the solved board is shown above</>}
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
            <button className="du-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Duet</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Duet is a free daily logic grid from Mind Loft. Fill every square with a dot or a ring so that every row, every column and every walled room holds exactly half of each, with never three alike in a line. An = mark between two squares says they match, an × says they differ.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          It is a balanced binary puzzle, the family sometimes called binairo or takuzu, with walled rooms that each have to balance too. Every board has a single solution you can always reach by logic, with no guessing. A square that breaks a rule turns red, but a square that is simply wrong is never flagged, and a clean solve scores a perfect 10 with the daily leaderboard decided on the clock.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern: 6×6 early in the week, 8×8 from Thursday, and a 10×10 Sunday Edition. No app, no signup, play free in your browser. More grid logic: try <a href="/plot" style={{ color: INK, fontWeight: 800 }}>Plot</a>, <a href="/hedge" style={{ color: INK, fontWeight: 800 }}>Hedge</a> and <a href="/polka" style={{ color: INK, fontWeight: 800 }}>Polka</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
