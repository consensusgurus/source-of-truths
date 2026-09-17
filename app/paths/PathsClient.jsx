'use client';

// Paths — the daily network puzzle.
//
// A lattice of dots, one depot, a handful of towns, and terrain in the way. Lay
// track along the lattice lines until every town is linked back to the depot,
// and do it for as little as you can. A plain lane costs 1, a ridge lane costs
// 2, a river crossing costs 3, a cliff cannot be laid at all, old track is
// free, and a spur that goes nowhere still costs you.
//
// Boards get harder across the week (PUZZLE.tier, set in puzzles.js). Monday to
// Wednesday is open ground, ridge and river. Thursday adds cliffs. Friday and
// Saturday add old track and a ninth town. Sunday is a 13x13 Edition with
// eleven towns and every element at once. Everything below reads the terrain off
// the board rather than assuming which elements are present, so a tier 1 board
// simply draws no cliffs and shows no cliff chip in the legend.
//
// PERFECT is the exact cheapest network that exists on the board, proved by a
// Dreyfus-Wagner Steiner-tree solve at bank time. PAR is the cushioned target
// from lib/par.js, so perfect is 10/10 and par is 8/10 on every board.
//
// Linking every town does NOT end the game, which is the whole point: the first
// network you find is never the cheapest one. Once everything is linked you can
// keep trimming, and you press Finish when you are done. The one exception is
// hitting perfect, which ends it there, since nothing better exists.
//
// Same daily plumbing as Hedge/Etch: banked boards gated by Eastern date on the
// server (app/paths/page.js), per-board localStorage saves, /paths?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { RotateCcw, X, Lightbulb, Eye, Smartphone, Trash2, Flag } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import DailyChrome from '../DailyChrome';
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
import DailyRules from '../DailyRules';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { parFor, stepFor, scoreFor } from '@/lib/par';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#065f46',        // Paths identity — deep green
  accentSoft: '#e6f4ee',
  green: T.successDeep,
  track: T.accent,          // laid track reads as the brand navy
  ridge: '#e6dcc6',
  ridgeInk: '#8a6a2f',
  river: '#bfdbfe',
  riverInk: '#1d4ed8',
  cliff: '#4b5563',         // a wall, not a price
  cliffInk: '#111827',
  rail: '#0f766e',          // old track, free to run along
  railSoft: '#99f6e4',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_paths_help_seen';
const STATS_KEY = 'sot_paths_stats';

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

const HAPT = { ok: [6], lift: [4], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const eKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
function freshState(count) {
  return { v: 1, e: Array(count).fill(0), mine: null, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

export default function PathsClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const n = PUZZLE.n;
  const STORE_KEY = `sot_paths_${PUZZLE.num}`;
  const perfect = PUZZLE.par;
  const parTarget = parFor(perfect);
  const step = stepFor(perfect);

  const DEPOT = PUZZLE.terms[0];
  const TOWNS = useMemo(() => PUZZLE.terms.slice(1), [PUZZLE]);

  // Every lane on the lattice, priced once. Horizontal lanes come first, then
  // vertical, and the index into that list is the only handle the game state
  // keeps, so a saved board stays valid as long as the board size does.
  // A blocked lane keeps its slot in the list so a saved board stays valid, it
  // just can never be laid and never costs anything.
  const LANES = useMemo(() => {
    const hills = new Set(PUZZLE.hills), bridges = new Set(PUZZLE.bridges);
    const cliffs = new Set(PUZZLE.cliffs || []), rails = new Set(PUZZLE.rails || []);
    const out = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n - 1; x++) out.push([y * n + x, y * n + x + 1]);
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n; x++) out.push([y * n + x, (y + 1) * n + x]);
    return out.map(([a, b], i) => {
      const k = eKey(a, b);
      const blocked = cliffs.has(k);
      return {
        i, a, b, blocked,
        rail: rails.has(k),
        cost: blocked ? 0 : rails.has(k) ? 0 : bridges.has(k) ? 3 : (hills.has(a) && hills.has(b)) ? 2 : 1,
        horiz: b - a === 1,
      };
    });
  }, [PUZZLE, n]);
  const HAS_CLIFFS = useMemo(() => LANES.some((l) => l.blocked), [LANES]);
  const HAS_RAILS = useMemo(() => LANES.some((l) => l.rail), [LANES]);
  const LANE_BY_KEY = useMemo(() => {
    const m = {};
    LANES.forEach((l) => { m[eKey(l.a, l.b)] = l.i; });
    return m;
  }, [LANES]);
  const SOL = useMemo(() => PUZZLE.sol.map(([a, b]) => LANE_BY_KEY[eKey(a, b)]).filter((i) => i !== undefined), [PUZZLE, LANE_BY_KEY]);

  const [g, setG] = useState(() => freshState(LANES.length));
  const gRef = useRef(g);
  const [canUndo, setCanUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [showPar, setShowPar] = useState(false);
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
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('paths', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('paths'); }, [g.hintUsed]);
  // eslint-disable-next-line no-unused-vars
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const undoRef = useRef([]);
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  const E = g.e;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('paths');
  const STAGE = isStage('paths', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('paths');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('paths'), '--stg-acc-lt': gameColorLight('paths'), '--stg-onramp-lt': gameOnrampLight('paths'), '--stg-acc-ink-lt': gameAccentInkLight('paths') };
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

  // What the reveal marks. `mine` is only set when a reveal overwrote the
  // board, so MINE is the player's own track on a given-up board and their
  // finished board on a solved one, and the three sets below are always
  // disjoint: laid and used, laid and not used, used and never laid.
  const MINE = g.mine || E;
  const SOL_SET = useMemo(() => new Set(SOL), [SOL]);
  const REVIEW = useMemo(() => {
    if (!showPar) return null;
    const right = [], wrong = [], missed = [];
    LANES.forEach((l) => {
      const laid = !!MINE[l.i], used = SOL_SET.has(l.i);
      if (laid && used) right.push(l);
      else if (laid) wrong.push(l);
      else if (used) missed.push(l);
    });
    return { right, wrong, missed };
  }, [showPar, MINE, SOL_SET, LANES]);

  useEffect(() => { gRef.current = g; }, [g]);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.e) && saved.e.length === LANES.length) {
          const next = { ...freshState(LANES.length), ...saved };
          gRef.current = next;
          setG(next);
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
        if (done || g.t0) localStorage.setItem('sot_paths_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_paths_day');
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
  const iq = useIqStanding({ game: 'paths', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'paths', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'paths', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'paths', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'paths', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const cost = useMemo(() => LANES.reduce((s, l) => s + (E[l.i] ? l.cost : 0), 0), [E, LANES]);
  const reached = useMemo(() => {
    const adj = {};
    LANES.forEach((l) => {
      if (!E[l.i]) return;
      (adj[l.a] = adj[l.a] || []).push(l.b);
      (adj[l.b] = adj[l.b] || []).push(l.a);
    });
    const seen = new Set([DEPOT]), q = [DEPOT];
    while (q.length) { const u = q.pop(); (adj[u] || []).forEach((v) => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
    return seen;
  }, [E, LANES, DEPOT]);
  const linked = TOWNS.filter((t) => reached.has(t)).length;
  const allLinked = linked === TOWNS.length;
  const over = Math.max(0, cost - perfect);
  // A player whose own network already costs `perfect` has found a cheapest
  // network of their own, just not this one, so their red lanes are a tie
  // rather than a mistake and the caption says so instead of accusing them.
  const tiedPerfect = won && cost === perfect;
  const liveScore = allLinked ? scoreFor(cost, perfect) : 0;
  const finalScore = g.status === 'won' ? scoreFor(cost, perfect) : 0;

  const REC_KEY = `sot_paths_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.e.some((v) => v) || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // The board's `guessesUsed` column is headed "Cost" for Paths (lib/daily-games.js),
  // and it carries the RAW spend, not the amount over perfect. A reader should not
  // have to know the board's perfect to tell how a run went, and the end card
  // headline already says "Linked for <cost>". Ordering is untouched by the choice:
  // `perfect` is a constant for a given board, so sorting on cost and sorting on
  // cost-minus-perfect produce the identical order, and nothing scores off this
  // field (it is a tiebreak and a display value only).
  function postResult(g2, score, spend) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: spend, won: score === 10 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: spend, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function commit(next) { gRef.current = next; setG(next); }

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function pushUndo(cur) {
    undoRef.current = [...undoRef.current.slice(-79), cur.e.slice()];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || gRef.current.status !== 'playing') return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    commit({ ...gRef.current, e: prev.slice() });
  }
  function clearAll() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.e.some((v) => v)) return;
    pushUndo(cur);
    commit({ ...cur, e: Array(LANES.length).fill(0) });
  }

  // Finishing the network exactly at perfect ends the board on the spot, because
  // nothing cheaper exists to look for. Anything else is the player's call.
  function laneCostSum(arr) { return LANES.reduce((s, l) => s + (arr[l.i] ? l.cost : 0), 0); }
  function allLinkedFor(arr) {
    const adj = {};
    LANES.forEach((l) => {
      if (!arr[l.i]) return;
      (adj[l.a] = adj[l.a] || []).push(l.b);
      (adj[l.b] = adj[l.b] || []).push(l.a);
    });
    const seen = new Set([DEPOT]), q = [DEPOT];
    while (q.length) { const u = q.pop(); (adj[u] || []).forEach((v) => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
    return TOWNS.every((t) => seen.has(t));
  }

  function setLane(idx, on) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (LANES[idx] && LANES[idx].blocked) return;
    if (cur.e[idx] === (on ? 1 : 0)) return;
    if (!cur.t0) startGame();
    const e = cur.e.slice();
    e[idx] = on ? 1 : 0;
    const g2 = { ...cur, e };
    if (!g2.t0) g2.t0 = Date.now();
    const spend = laneCostSum(e);
    if (on && spend === perfect && allLinkedFor(e)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10, spend);
      commit(g2);
      return;
    }
    vibrate(on ? HAPT.ok : HAPT.lift);
    commit(g2);
  }

  function finish() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !allLinkedFor(cur.e)) return;
    const spend = laneCostSum(cur.e);
    const g2 = { ...cur, status: 'won', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    vibrate(HAPT.win);
    postResult(g2, scoreFor(spend, perfect), spend);
    commit(g2);
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const missing = SOL.filter((i) => !cur.e[i]);
    if (!missing.length) { say('Your track already holds a whole cheapest network.'); return; }
    const idx = missing[Math.floor(Math.random() * missing.length)];
    pushUndo(cur);
    const e = cur.e.slice();
    e[idx] = 1;
    const g2 = { ...cur, e, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    vibrate(HAPT.ok);
    commit(g2);
    say('Hint laid: one lane of a cheapest network.');
  }

  // Giving up lays a cheapest network on the board, but the POINT of a reveal
  // is the comparison, so the track the player actually laid is kept in `mine`
  // and marked back over the top (owner, 2026-08-26). Without it every lane on
  // a given-up board is the solution's, so every lane reads as one they got
  // right and nothing tells them where they went wrong.
  function revealEnd() {
    const cur = gRef.current;
    const e = Array(LANES.length).fill(0);
    SOL.forEach((i) => { e[i] = 1; });
    const g2 = { ...cur, e, mine: cur.e, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0, perfect);
    commit(g2);
    setShowPar(true);
  }

  // Showing the gold network means showing the BOARD it is drawn on. On a loft
  // page the finished board is flipped away behind the end card, so a bare
  // setShowPar(true) painted the solution onto a face nobody could see and the
  // button read as dead (owner report, 2026-08-15). Turning it on flips the
  // board back up and scrolls to it; turning it off leaves the board where it is.
  function showParToggle() {
    const next = !showPar;
    setShowPar(next);
    if (!next) return;
    setRevealed(true);
    requestAnimationFrame(() => {
      try { if (svgRef.current) svgRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    });
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    commit(freshState(LANES.length));
    setEndClosed(false); setShowPar(false); setRevealed(false);
  }

  const onKey = useCallback((e) => {
    if (gRef.current.status !== 'playing') return;
    if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  // ---- drawing ----
  // One drag lays or lifts a run of track. The first lane you touch decides
  // which (touch a bare lane to lay, touch your own track to lift), and every
  // lane the finger crosses after that follows suit. The hit targets carry a
  // data-lane index and are read back with elementFromPoint, because a touch
  // drag keeps firing at the element it started on.
  function laneAt(ev) {
    const el = typeof document !== 'undefined' ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
    if (!el || !el.dataset || el.dataset.lane === undefined) return -1;
    const i = Number(el.dataset.lane);
    return Number.isInteger(i) ? i : -1;
  }
  function onPointerDown(ev) {
    if (gRef.current.status !== 'playing') return;
    const i = laneAt(ev);
    if (i < 0) return;
    ev.preventDefault();
    try { svgRef.current && svgRef.current.setPointerCapture(ev.pointerId); } catch (e) {}
    const on = !gRef.current.e[i];
    dragRef.current = on;
    pushUndo(gRef.current);
    setLane(i, on);
  }
  function onPointerMove(ev) {
    if (dragRef.current === null || gRef.current.status !== 'playing') return;
    const i = laneAt(ev);
    if (i < 0) return;
    if (!!gRef.current.e[i] !== dragRef.current) setLane(i, dragRef.current);
  }
  function endDrag() { dragRef.current = null; }
  useEffect(() => {
    const up = () => { dragRef.current = null; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []);

  // ---- board geometry ----
  const CELL = n <= 9 ? 52 : n <= 11 ? 42 : 36;
  const PAD = 26;
  const TOWN_R = Math.max(9.5, CELL * 0.25);   // towns and depot shrink with the
  const DEPOT_R = Math.max(11, CELL * 0.29);   // lattice so a 13x13 stays legible
  const SIZE = (n - 1) * CELL + PAD * 2;
  const X = (i) => PAD + (i % n) * CELL;
  const Y = (i) => PAD + Math.floor(i / n) * CELL;
  const HIT = Math.round(CELL * 0.42);
  const TOLL = Math.round(CELL * 0.2);   // how far a toll number sits off its lane
  const riverPath = useMemo(() => {
    const pts = [];
    for (let y = 0; y < n; y++) {
      const cx = PAD + (PUZZLE.rx[y] - 0.5) * CELL;
      pts.push([cx, PAD + (y - 0.5) * CELL], [cx, PAD + (y + 0.5) * CELL]);
    }
    return pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  }, [PUZZLE, n, CELL]);
  const townLetter = (i) => String.fromCharCode(65 + i);
  // A cell whose four corners all stand on the ridge has all four of its lanes
  // priced at 2, so filling it in is exactly as honest as the strips and reads
  // as one landform rather than a tan lattice with holes in it.
  const ridgeCells = useMemo(() => {
    const hills = new Set(PUZZLE.hills), out = [];
    for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
      const a = y * n + x;
      if (hills.has(a) && hills.has(a + 1) && hills.has(a + n) && hills.has(a + n + 1)) out.push(a);
    }
    return out;
  }, [PUZZLE, n]);

  // A cliff is drawn as a bar sitting across the lane it blocks, so it reads as
  // a wall in the gap rather than as a missing line.
  const cliffBars = useMemo(() => LANES.filter((l) => l.blocked).map((l) => {
    const mx = (X(l.a) + X(l.b)) / 2, my = (Y(l.a) + Y(l.b)) / 2;
    // full-cell span, so a run of blocked lanes reads as one unbroken wall
    // rather than a dashed line
    const len = CELL, thick = Math.max(5.5, CELL * 0.15);
    return l.horiz
      ? { i: l.i, x: mx - thick / 2, y: my - len / 2, w: thick, h: len }
      : { i: l.i, x: mx - len / 2, y: my - thick / 2, w: len, h: thick };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [LANES, CELL, n]);

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent}
      accentSoft={COLORS.accentSoft}
      lead="Link every town to the depot for as little track as you can."
      chips={[
        { label: 'Open 1', tone: 'grey' },
        { label: 'Ridge 2', style: { background: COLORS.ridge, border: `1.5px solid ${COLORS.ridgeInk}`, color: COLORS.ridgeInk } },
        { label: 'Crossing 3', style: { background: COLORS.river, border: `1.5px solid ${COLORS.riverInk}`, color: COLORS.riverInk } },
        ...(HAS_RAILS ? [{ label: 'Old track 0', style: { background: COLORS.railSoft, border: `1.5px solid ${COLORS.rail}`, color: COLORS.rail } }] : []),
        ...(HAS_CLIFFS ? [{ label: 'Cliff, no way through', style: { background: '#e5e7eb', border: `1.5px solid ${COLORS.cliff}`, color: COLORS.cliffInk } }] : []),
      ]}
      sub={<>Tan shading marks every lane that charges 2, which needs <b>both</b> ends on the ridge, so skirting the edge is free. The river is one unbroken barrier.{HAS_CLIFFS ? <> A dark bar is a <b>cliff</b>: that lane cannot be laid at any price, so route around it.</> : null}{HAS_RAILS ? <> A dashed green lane is <b>old track</b>, already on the ground: run along it and it costs you nothing.</> : null}</>}
      steps={[
        <>Drag or tap a lane to <b>lay track</b>, drag back over your track to lift it. Towns turn green as they connect.</>,
        <>Link all {TOWNS.length} towns, then keep <b>trimming</b>: your first network is never the cheapest, and dead-end spurs still cost you.</>,
        <><b>Undo</b> (Ctrl+Z) and <b>Clear</b> are free and unlimited. One free <b>hint</b>, on your first ever play, lays a lane of a cheapest network.</>,
        <>Linking everything does not end the round: press <b>Finish</b> when you cannot trim any further.</>,
      ]}
      knack={HAS_RAILS
        ? 'Follow the old track. A free lane is worth a detour to reach, and the network that uses it rarely looks like the short one.'
        : 'Share one crossing. You pay the river somewhere, and two lanes of detour on open ground beats paying 3 again.'}
      footer={<><b>Perfect</b>, the solver-proved cheapest network on the board, scores 10; a point comes off per {step} over, so par is 8. Ties break on cost, then time. Boards get harder across the week: cliffs from Thursday, old track and a ninth town on Friday and Saturday, and a 13&times;13 Sunday Edition with eleven towns.</>}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="paths" name="Paths" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Paths only scores a completed network, so a give-up is simply not solved and
          there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="paths" quizId={PUZZLE.quizId}
          name="Paths"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${n}\u00d7${n}` : null}
          figures={playing ? [
            { v: cost, k: 'cost' },
            { v: parTarget, k: 'par' },
            { v: `${linked}/${TOWNS.length}`, k: 'linked' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: cost, k: 'cost' },
            { v: parTarget, k: 'par' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="pt-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pt-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pt-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pt-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .pt-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .pt-tool.on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-color:var(--stg-acc, ${COLORS.accent});}
          .pt-hit{stroke:transparent;fill:none;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}
          .pt-svg{touch-action:none;width:100%;height:auto;display:block;-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="paths"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {n}&times;{n}</span>}
          blocks={'PATHS'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which
            runs full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Paths is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Link all {TOWNS.length} towns to the depot for as little as you can. Ridge lanes cost 2, river crossings cost 3{HAS_RAILS ? ', old track is free' : ''}{HAS_CLIFFS ? ', and a cliff cannot be crossed at all' : ''}. Perfect is <b>{perfect}</b> and par is <b>{parTarget}</b>.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pt-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>cost <b style={{ color: allLinked && cost === perfect ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{cost}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>par <b style={{ color: INK, fontWeight: 500 }}>{parTarget}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>linked <b style={{ color: allLinked ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{linked}</b>/{TOWNS.length}</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
          </div>
          )}

          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <svg ref={svgRef} className="pt-svg" viewBox={`0 -6 ${SIZE} ${SIZE + 12}`} role="img"
              aria-label={`Paths network puzzle, ${n} by ${n} lattice, ${TOWNS.length} towns`}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag}>
              {/* ridge: painted on exactly the lanes that charge 2, plus the
                  cells those lanes enclose, so what you see is what you pay */}
              {ridgeCells.map((a) => (
                <rect key={`rc${a}`} x={X(a)} y={Y(a)} width={CELL} height={CELL} fill={COLORS.ridge} style={{ pointerEvents: 'none' }} />
              ))}
              {LANES.filter((l) => l.cost === 2).map((l) => (
                <line key={`r${l.i}`} x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                  stroke={COLORS.ridge} strokeWidth={CELL * 0.44} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
              ))}
              {/* the river, one continuous barrier */}
              <path d={riverPath} fill="none" stroke={COLORS.river} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
              <path d={riverPath} fill="none" stroke="#7fb2f5" strokeWidth={2.4} opacity={0.7} strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
              {/* bare lanes. A cliff lane is drawn faintly and then walled off
                  below, so the lattice still reads as a grid */}
              {LANES.map((l) => (
                <line key={`l${l.i}`} x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                  stroke="#dfe4ec" strokeWidth={2} strokeLinecap="round" opacity={l.blocked ? 0.25 : l.cost > 1 ? 0.5 : 1} style={{ pointerEvents: 'none' }} />
              ))}
              {/* old track: already on the ground, free to run along */}
              {LANES.filter((l) => l.rail).map((l) => (
                <g key={`rl${l.i}`} style={{ pointerEvents: 'none' }}>
                  <line x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                    stroke={COLORS.railSoft} strokeWidth={Math.max(6, CELL * 0.17)} strokeLinecap="round" />
                  <line x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                    stroke={COLORS.rail} strokeWidth={2.4} strokeDasharray="3 4" strokeLinecap="round" />
                </g>
              ))}
              {/* The reveal is a MARKING, not just an answer key. A lane you
                  laid that a cheapest network also uses goes green, a lane you
                  laid that it does not use goes red, and a lane it uses that
                  you never laid stays gold, so the whole network is still on
                  the board AND every one of your own choices is answered.
                  The red lane carries a white dash on top of the fill, so it
                  reads apart from the green without relying on hue. */}
              {REVIEW ? (
                <g style={{ pointerEvents: 'none' }}>
                  {REVIEW.missed.map((l) => (
                    <line key={`m${l.i}`} x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                      stroke="#e8b43a" strokeWidth={4.5} strokeLinecap="round" strokeDasharray="2 7" />
                  ))}
                  {REVIEW.wrong.map((l) => (
                    <g key={`w${l.i}`}>
                      <line x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                        stroke={COLORS.rust} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
                      <line x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                        stroke={T.white} strokeWidth={2.2} strokeDasharray="1.5 4.5" />
                    </g>
                  ))}
                  {REVIEW.right.map((l) => (
                    <line key={`k${l.i}`} x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                      stroke={COLORS.green} strokeWidth={6} strokeLinecap="round" />
                  ))}
                </g>
              ) : (
                LANES.map((l) => (E[l.i] ? (
                  <line key={`t${l.i}`} x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)}
                    stroke={COLORS.track} strokeWidth={6} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
                ) : null))
              )}
              {/* what a crossing charges. The ridge says 2 with its shading */}
              {LANES.filter((l) => l.cost === 3 && !l.blocked).map((l) => (
                <text key={`c${l.i}`} x={(X(l.a) + X(l.b)) / 2 + (l.horiz ? 0 : TOLL)} y={(Y(l.a) + Y(l.b)) / 2 - (l.horiz ? TOLL : 0)}
                  fill={COLORS.riverInk} fontFamily={MONO} fontSize={10} fontWeight="500"
                  textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none', userSelect: 'none' }}>3</text>
              ))}
              {/* the old track says 0, the same way a crossing says 3 */}
              {LANES.filter((l) => l.rail).map((l) => (
                <text key={`z${l.i}`} x={(X(l.a) + X(l.b)) / 2 + (l.horiz ? 0 : TOLL)} y={(Y(l.a) + Y(l.b)) / 2 - (l.horiz ? TOLL : 0)}
                  fill={COLORS.rail} fontFamily={MONO} fontSize={10} fontWeight="500"
                  textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none', userSelect: 'none' }}>0</text>
              ))}
              {/* cliffs: a wall across the lane, drawn over everything so it is
                  never mistaken for track you could lay */}
              {cliffBars.map((c) => (
                <rect key={`x${c.i}`} x={c.x} y={c.y} width={c.w} height={c.h} rx={2}
                  fill={COLORS.cliff} stroke={COLORS.cliffInk} strokeWidth={1} style={{ pointerEvents: 'none' }} />
              ))}
              {/* plain dots */}
              {Array.from({ length: n * n }).map((_, k) => (PUZZLE.terms.includes(k) ? null : (
                <circle key={`d${k}`} cx={X(k)} cy={Y(k)} r={2.6} fill="#b9c1cf" style={{ pointerEvents: 'none' }} />
              )))}
              {/* depot */}
              <g style={{ pointerEvents: 'none' }}>
                <rect x={X(DEPOT) - DEPOT_R} y={Y(DEPOT) - DEPOT_R} width={DEPOT_R * 2} height={DEPOT_R * 2} rx={DEPOT_R * 0.3} fill={COLORS.ink} />
                <rect x={X(DEPOT) - DEPOT_R * 0.4} y={Y(DEPOT) - DEPOT_R * 0.4} width={DEPOT_R * 0.8} height={DEPOT_R * 0.8} rx={3} fill={T.white} />
              </g>
              {/* towns */}
              {TOWNS.map((t, k) => {
                const on = reached.has(t);
                return (
                  <g key={`t${t}`} style={{ pointerEvents: 'none' }}>
                    <circle cx={X(t)} cy={Y(t)} r={TOWN_R} fill={on ? COLORS.green : T.white} stroke={on ? COLORS.green : COLORS.ink} strokeWidth={2.5} />
                    <text x={X(t)} y={Y(t)} fill={on ? T.white : COLORS.ink} fontFamily={SANS} fontSize={Math.max(10, TOWN_R * 0.88)} fontWeight="800" textAnchor="middle" dominantBaseline="central">{townLetter(k)}</text>
                  </g>
                );
              })}
              {/* hit targets last so they always take the drag */}
              {playing && LANES.filter((l) => !l.blocked).map((l) => (
                <line key={`h${l.i}`} className="pt-hit" data-lane={l.i}
                  x1={X(l.a)} y1={Y(l.a)} x2={X(l.b)} y2={Y(l.b)} strokeWidth={HIT} />
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap', fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: FADED }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 15, height: 3, borderRadius: 2, background: '#c9d0dc' }} /> open 1</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 15, height: 9, borderRadius: 3, background: COLORS.ridge, boxShadow: `0 0 0 1px ${COLORS.ridgeInk}` }} /> ridge 2</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 15, height: 5, borderRadius: 3, background: COLORS.river, boxShadow: `0 0 0 1px ${COLORS.riverInk}` }} /> crossing 3</span>
            {HAS_RAILS && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 15, height: 5, borderRadius: 3, background: COLORS.railSoft, borderTop: `2px dashed ${COLORS.rail}` }} /> old track 0</span>
            )}
            {HAS_CLIFFS && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 13, borderRadius: 2, background: COLORS.cliff }} /> cliff, no way through</span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: COLORS.ink, boxShadow: `0 0 0 1px ${SURF_B}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 4, height: 4, borderRadius: 1, background: `var(--stg-surf, ${T.white})` }} /></span> depot</span>
          </div>
          {/* The marking's own key, printed only while the marking is up, so
              a red lane is never left for the reader to guess at. */}
          {REVIEW && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap', fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: FADED }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 16, height: 5, borderRadius: 3, background: COLORS.green }} /> yours, and in the network</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 16, height: 5, borderRadius: 3, background: COLORS.rust, borderTop: `2px dashed ${T.white}` }} /> yours, not in it</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 16, height: 4, borderRadius: 3, background: 'repeating-linear-gradient(90deg, #e8b43a 0 2px, transparent 2px 6px)' }} /> in it, not yours</span>
            </div>
          )}
          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <button className="pt-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Undo
              </button>
              <button className="pt-tool" onClick={clearAll} title="Lift all your track" style={{ opacity: cost > 0 ? 1 : 0.4, cursor: cost > 0 ? 'pointer' : 'default' }}>
                <Trash2 size={14} /> Clear
              </button>
              {hintOk && !g.hintUsed && (
                <button className="pt-tool" onClick={useHint} title="Lay one lane of a cheapest network (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(6,95,70,0.5)', color: ACC_INK }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
              {allLinked && (
                <button className="pt-tool on" onClick={finish} title="Lock in this network">
                  <Flag size={14} /> Finish for {cost}
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: allLinked ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {allLinked
                ? `Every town is linked for ${cost}. ${over === 0 ? 'That is perfect.' : `Perfect is ${perfect}, so there are ${over} to trim if you can find them.`}`
                : 'Drag along a lane to lay track, drag back over it to lift it. Every town has to reach the depot.'}
            </span>
            {identity && cost > 0 && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the round and shows a cheapest network' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <button className="pt-tool" onClick={showParToggle} style={{ marginBottom: 4 }}>
                {showPar ? 'Hide the cheapest network' : 'Show a cheapest network'}
              </button>
              <div style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '8px 0 0' }}>
                One network that costs {perfect}, marked against your own track: <b style={{ color: `var(--stg-ink, ${COLORS.green})` }}>green</b> is a lane you laid that it also uses, <b style={{ color: `var(--stg-ink, ${COLORS.rust})` }}>red</b> is a lane you laid that it does not, and <b style={{ color: '#a97c12' }}>gold</b> is a lane it uses that you never laid. Two staircases between the same dots always tie, so it is <i>a</i> cheapest network rather than the only one{tiedPerfect ? ', and because your own network costs the same, a red lane of yours is an equal-cost alternative rather than a mistake' : ''}, but every ridge lane and crossing in it is forced.{HAS_RAILS ? ' Notice where it runs along the old track.' : ''}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition &mdash; a bigger {n}&times;{n} board with {TOWNS.length} towns and every element at once.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Paths in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/paths?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Paths &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/paths" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Paths &rarr;</a>
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
          {LOFT && !playing && (
            <LoftFinish
              name="Paths"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${cost} cost \u00b7 ${parTarget} par \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Paths all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Cost"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/paths?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Paths', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/paths?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="paths" name="Paths" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="paths" name="Paths" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="paths"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="paths" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Paths to your Home Screen</div>
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
          self="paths"
          won={won}
          headline={won ? (over === 0 ? <>Perfect network!</> : <>Linked for {cost}</>) : <>You scored 0%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {over === 0 ? 'nothing cheaper exists' : `${over} over perfect ${perfect}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; a cheapest network is shown above</>}
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
            <button className="pt-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Paths</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Paths is a free daily network puzzle from Mind Loft. One depot, a scatter of towns, a river and two ridges, and the job is to link every town back to the depot for as little as you can. Ridge lanes cost double and crossings cost triple, so the shortest route and the cheapest one are rarely the same thing. Later in the week the map gets harder: cliffs block lanes outright, and stretches of old track are free to run along if you spot them.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The trick is that towns are cheaper to link in bunches than one at a time. A lane you lay to reach one town is free for the next town that runs along it, which is why the obvious connect-the-nearest-town network is always several over, and why one shared trunk line through a single crossing usually beats three separate detours around the river.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board carries a proven cheapest network, so a perfect score is real and nobody beats it. A new board drops at midnight Eastern, and the week ramps: open ground Monday to Wednesday, cliffs from Thursday, old track and a ninth town on Friday and Saturday, and a 13&times;13 Sunday Edition with eleven towns and every element at once. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/hedge" style={{ color: INK, fontWeight: 800 }}>Hedge</a>, our daily loop, <a href="/parker" style={{ color: INK, fontWeight: 800 }}>Parker</a>, our gridlock puzzle, and <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our border chain.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const text = playing
      ? `Paths #${PUZZLE.num} — the daily network puzzle from Mind Loft.\n${shareUrl()}`
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
  function shareUrl() {
    return withRef(`mindloftdaily.com/paths${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  // Five bands off the score, never the board: the shape of a network is the
  // answer, so nothing here can leak one.
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Paths #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${cost}${over === 0 ? ' (perfect)' : ` · ${over} over`} · ${elapsed}${hintBit}${streakBit}`
      : `Paths #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
}
