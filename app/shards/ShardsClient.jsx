'use client';

// Shards - the daily jigsaw crossword.
//
// The grid arrives already solved but shattered into lettered polyomino shards.
// Reassemble them so every across and down run of 2+ letters is a real word.
// No clues; the letters are the clues. Each day's shard set has a VERIFIED
// UNIQUE reassembly (proven offline + in scripts/verify-daily-banks.mjs), so
// the one arrangement where every run is a dictionary word is the answer.
//
// Rules: shards are rigid (no rotation, no flip). Drag a shard onto the grid,
// or tap a shard then tap a cell. Placed shards can be picked up and moved
// freely; there is an Undo and a free Clear. The board auto-completes the
// moment every shard is placed and every run is a valid word - no submit.
//
// Difficulty ladder (from 2026-08-02): Mon-Thu 6x6, Fri-Sat 7x7, Sunday 8x8.
// Scoring (answer terms, like every daily) scales with the board and comes from
// the puzzle entry, not from constants here: start 100/150/200, floor 10/15/20,
// hints 10-15-20 / 15-20-30 / 20-30-40 for 6x6 / 7x7 / 8x8. Moving a placed shard
// costs 5 (a "misplacement"). The dictionary is the shared public/tuck-dict.txt,
// fetched once as a static asset. That is a SCRABBLE word list, so it accepts
// entries no ordinary reader would call words, and the rules copy below says so
// rather than leaving a player to discover it mid-grid. From 2026-08-20 no board
// carries a run shorter than three letters, which is where the worst of it lived:
// at length 2 the generator's common-word filter is useless (108 of the 124
// two-letter words in the list clear it, st and ja and pe among them), so those
// slots filled with Scrabble junk. Archive boards before that date still have
// them, which is why the copy is worded for both.
//
// Same daily plumbing as Tuck/Emcee: banked puzzles gated by Eastern date on the
// server (app/shards/page.js), per-puzzle localStorage saves, /shards?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, RotateCcw, Trash2, Lightbulb, CheckCircle2, Undo2 } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { regionStyle, regionMix, regionHue, REGION_INK } from '@/lib/category-ramp';
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
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#0d9488',       // Shards identity - teal
  accentDk: '#0b7c72',
  accentSoft: '#d7f0ec',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_shards_help_seen';
const STATS_KEY = 'sot_shards_stats';
// Per-shard tray/board tints (spoiler-free, purely to tell pieces apart).
const SHARD_TINTS = ['#0d9488', '#7c3aed', '#d97706', T.blue, T.danger, T.successDeep, '#c026d3', '#0e7490', '#b45309', '#4338ca'];

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

// ---- personal stats + streak (localStorage), Tuck/Circa pattern ----
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
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
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, perfect, cur, max };
}

// ---- shard geometry (derived once from PUZZLE) ----
// Each shard: normalized offsets [{dr,dc,ch}], w/h of bounding box, solved anchor
// (min row/col of its solved cells), a reading-order "handle" offset (used for
// tap placement), and its solved cell key set.
function deriveShards(PUZZLE) {
  return (PUZZLE.shards || []).map((sh, id) => {
    const rs = sh.cells.map((c) => c[0]);
    const cs = sh.cells.map((c) => c[1]);
    const minR = Math.min(...rs), minC = Math.min(...cs);
    const offs = sh.cells.map(([r, c, ch]) => ({ dr: r - minR, dc: c - minC, ch }));
    const h = Math.max(...offs.map((o) => o.dr)) + 1;
    const w = Math.max(...offs.map((o) => o.dc)) + 1;
    // handle = first cell in reading order (min dr, then min dc)
    const sorted = [...offs].sort((a, b) => a.dr - b.dr || a.dc - b.dc);
    return { id, offs, w, h, size: offs.length, minR, minC, handle: { dr: sorted[0].dr, dc: sorted[0].dc } };
  });
}

function freshState(n) {
  return { v: 1, placements: [], status: 'playing', t0: null, tEnd: null, misplaced: 0, hintsUsed: 0, locked: [], wet: null };
}

export default function ShardsClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.rows;
  const STORE_KEY = `sot_shards_${PUZZLE.num}`;
  const START = PUZZLE.start || 100;
  const FLOOR = PUZZLE.floor || 10;
  const HINTS = PUZZLE.hints || [10, 15, 20];
  const SHARDS = useMemo(() => deriveShards(PUZZLE), [PUZZLE]);
  const blockSet = useMemo(() => new Set((PUZZLE.blocks || []).map(([r, c]) => r * 100 + c)), [PUZZLE]);
  // The one correct letter per cell, keyed r*100+c. Hint 1 checks placements
  // against this rather than against each piece's own anchor, so interchangeable
  // twin pieces are never wrongly flagged (see useHint).
  const SOLUTION = useMemo(() => {
    const m = {};
    for (const sh of PUZZLE.shards || []) for (const [r, c, ch] of sh.cells) m[r * 100 + c] = ch;
    return m;
  }, [PUZZLE]);
  const fillCount = N * N - blockSet.size;
  // Tray order: a fixed, per-puzzle scramble so pieces aren't in solved order.
  const trayOrder = useMemo(() => {
    const idx = SHARDS.map((s) => s.id);
    let seed = PUZZLE.num * 2654435761 % 2147483647;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }, [SHARDS, PUZZLE]);

  const [g, setG] = useState(() => freshState(N));
  const [dict, setDict] = useState(null);
  const [dictErr, setDictErr] = useState(false);
  const [armed, setArmed] = useState(null);       // shard id armed for tap-placement
  const [drag, setDrag] = useState(null);         // { id, grab:{dr,dc}, x, y, from }
  const [hoverCell, setHoverCell] = useState(null); // {r,c} preview anchor during drag
  const [wrongHint, setWrongHint] = useState(null); // shard id flagged wrong by hint 1
  const [homeHint, setHomeHint] = useState(null);  // shard id whose true home is outlined (hint 3)
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
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
  const gridRef = useRef(null);
  const histRef = useRef([]);       // undo stack of prior puzzle states
  const finishedRef = useRef(false);
  const pendingRef = useRef(null);  // pointer-down candidate before it becomes a drag
  const draggedRef = useRef(false); // suppresses the click that trails a real drag
  // The drag listeners live on window and are attached once, so anything they
  // read has to come through a ref or they capture the first render forever.
  const fnRef = useRef({});

  const playing = g.status === 'playing';
  const LOFT = isLoft('shards');
  const STAGE = isStage('shards', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('shards');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('shards'), '--stg-acc-lt': gameColorLight('shards'), '--stg-onramp-lt': gameOnrampLight('shards'), '--stg-acc-ink-lt': gameAccentInkLight('shards') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;
  const focusMode = playing && !showChrome;

  // ---- dictionary (static asset, fetched once) ----
  useEffect(() => {
    let alive = true;
    fetch('/tuck-dict.txt')
      .then((r) => { if (!r.ok) throw new Error('dict'); return r.text(); })
      .then((t) => { if (alive) setDict(new Set(t.split('\n').map((w) => w.trim()).filter(Boolean))); })
      .catch(() => { if (alive) setDictErr(true); });
    return () => { alive = false; };
  }, []);

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
        if (saved && saved.v === 1 && Array.isArray(saved.placements)) setG({ ...freshState(N), ...saved });
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
        const dn = g.status !== 'playing';
        if (dn || g.t0) localStorage.setItem('sot_shards_day', JSON.stringify({ d: etToday(), done: dn }));
        else localStorage.removeItem('sot_shards_day');
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

  // ---- metrics + leaderboard ----
  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && d.found && d.name) setPlayer({ name: d.name, rank: (d.ranks && d.ranks.xp) || d.rank || null, key: d.userKey || null }); })
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

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'shards', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'shards', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'shards', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'shards', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'shards', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  // ---- derived board occupancy ----
  // occ[r*100+c] = shard id occupying that cell
  const occ = useMemo(() => {
    const m = new Map();
    for (const s of SHARDS) {
      const p = g.placements[s.id];
      if (!p) continue;
      for (const o of s.offs) m.set((p.r + o.dr) * 100 + (p.c + o.dc), { id: s.id, ch: o.ch });
    }
    return m;
  }, [g.placements, SHARDS]);
  const placedCount = useMemo(() => SHARDS.filter((s) => g.placements[s.id]).length, [g.placements, SHARDS]);
  // The wet piece is on the board and blocks other pieces, but it is invisible
  // to the validator: no ticks, no solve credit, until the player commits it.
  // Without this the free-adjustment window becomes an oracle, since a player
  // could shuffle a costless piece around until a tick lit up and read the
  // answer straight off the board.
  const occCommitted = useMemo(() => {
    if (g.wet == null) return occ;
    const m = new Map();
    for (const [k, v] of occ) if (v.id !== g.wet) m.set(k, v);
    return m;
  }, [occ, g.wet]);
  const trayShards = useMemo(() => trayOrder.filter((id) => !g.placements[id]), [trayOrder, g.placements]);

  // fully-filled runs and which are valid words (for ticks + win)
  const { runTicks, allValid, allCovered } = useMemo(() => {
    const occ = occCommitted; // ticks and the win check ignore the wet piece
    const ticks = [];
    let valid = true;
    const get = (r, c) => (blockSet.has(r * 100 + c) ? '#' : (occ.get(r * 100 + c)?.ch || null));
    const scan = (cells) => {
      const filled = cells.every((k) => occ.has(k));
      const word = cells.map((k) => occ.get(k)?.ch || '').join('');
      if (cells.length >= 2) {
        if (filled && dict) {
          const ok = dict.has(word.toLowerCase());
          if (ok) ticks.push(cells);
          else valid = false;
        } else valid = false;
      }
    };
    // across
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        if (!blockSet.has(r * 100 + c)) { const cells = []; while (c < N && !blockSet.has(r * 100 + c)) { cells.push(r * 100 + c); c++; } if (cells.length >= 2) scan(cells); }
        else c++;
      }
    }
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        if (!blockSet.has(r * 100 + c)) { const cells = []; while (r < N && !blockSet.has(r * 100 + c)) { cells.push(r * 100 + c); r++; } if (cells.length >= 2) scan(cells); }
        else r++;
      }
    }
    const covered = occ.size === fillCount;
    return { runTicks: ticks, allValid: valid, allCovered: covered };
  }, [occCommitted, dict, N, blockSet, fillCount]);

  const solved = placedCount === SHARDS.length && allCovered && allValid && !!dict;
  const liveScore = Math.max(FLOOR, START - 5 * g.misplaced - hintsCost(g.hintsUsed, HINTS));

  // ---- placement helpers ----
  function canPlace(shard, ar, ac, ignoreId) {
    for (const o of shard.offs) {
      const r = ar + o.dr, c = ac + o.dc;
      if (r < 0 || c < 0 || r >= N || c >= N) return false;
      if (blockSet.has(r * 100 + c)) return false;
      const cell = occ.get(r * 100 + c);
      if (cell && cell.id !== ignoreId) return false;
    }
    return true;
  }
  function pushHistory(cur) { histRef.current.push(JSON.stringify({ placements: cur.placements, misplaced: cur.misplaced, wet: cur.wet })); if (histRef.current.length > 60) histRef.current.shift(); }

  function placeShard(id, ar, ac) {
    const shard = SHARDS[id];
    setG((cur) => {
      if (cur.status !== 'playing') return cur;
      const prev = cur.placements[id];
      const samespot = prev && prev.r === ar && prev.c === ac;
      if (samespot) return cur; // dropped back exactly where it was: no-op, no penalty
      if (!canPlaceWith(cur, shard, ar, ac, id)) return cur;
      pushHistory(cur);
      const pl = cur.placements.slice();
      pl[id] = { r: ar, c: ac };
      // Nudging the wet piece is free. Moving a committed one costs a miss and
      // hands the wet window back, so the correction itself can be fine-tuned.
      // Placing any piece commits whichever piece was wet before it.
      const cost = prev && cur.wet !== id ? 1 : 0;
      return { ...cur, placements: pl, t0: cur.t0 || Date.now(), misplaced: cur.misplaced + cost, wet: id };
    });
    setArmed(null); setWrongHint(null);
  }
  function canPlaceWith(cur, shard, ar, ac, ignoreId) {
    const om = new Map();
    for (const s of SHARDS) { const p = cur.placements[s.id]; if (!p || s.id === ignoreId) continue; for (const o of s.offs) om.set((p.r + o.dr) * 100 + (p.c + o.dc), s.id); }
    for (const o of shard.offs) {
      const r = ar + o.dr, c = ac + o.dc;
      if (r < 0 || c < 0 || r >= N || c >= N) return false;
      if (blockSet.has(r * 100 + c)) return false;
      if (om.has(r * 100 + c)) return false;
    }
    return true;
  }
  function pickUp(id) {
    if (g.locked.includes(id)) { say('That shard is locked by a hint.'); return; }
    setG((cur) => {
      if (cur.status !== 'playing' || !cur.placements[id]) return cur;
      pushHistory(cur);
      const pl = cur.placements.slice();
      pl[id] = null;
      return { ...cur, placements: pl, misplaced: cur.misplaced + (cur.wet === id ? 0 : 1), wet: cur.wet === id ? null : cur.wet };
    });
    setWrongHint(null);
  }
  function undo() {
    if (!histRef.current.length) return;
    const snap = JSON.parse(histRef.current.pop());
    setG((cur) => ({ ...cur, placements: snap.placements, misplaced: snap.misplaced, wet: snap.wet === undefined ? null : snap.wet }));
    setArmed(null); setWrongHint(null);
  }
  function clearBoard() {
    setG((cur) => (cur.status !== 'playing' ? cur : { ...cur, placements: [], misplaced: cur.misplaced, locked: cur.locked, wet: null }));
    // re-lock hinted shards at their true home so a Clear does not discard a paid hint
    setTimeout(() => setG((cur) => {
      if (cur.status !== 'playing' || !cur.locked.length) return cur;
      const pl = cur.placements.slice();
      for (const id of cur.locked) { const s = SHARDS[id]; pl[id] = { r: s.minR, c: s.minC }; }
      return { ...cur, placements: pl };
    }), 0);
    histRef.current = [];
    setArmed(null); setWrongHint(null);
  }

  // ---- pointer drag ----
  // Resolve a screen point to a board cell from the grid's own geometry rather
  // than document.elementFromPoint. The old hit test returned null whenever the
  // pointer sat on the board padding, the border, or a hair past the edge, so
  // those drops were thrown away in silence and the piece snapped back looking
  // stuck. Cell (0,0) is measured live, so padding, borders and zoom all cancel.
  const EDGE_TOL = 0.5; // half a cell of slop around the board
  function cellFromPoint(x, y) {
    const grid = gridRef.current;
    if (!grid) return null;
    const first = grid.querySelector('[data-cell]');
    if (!first) return null;
    const b = first.getBoundingClientRect();
    if (!b.width || !b.height) return null;
    const fc = (x - b.left) / b.width, fr = (y - b.top) / b.height;
    if (fc < -EDGE_TOL || fr < -EDGE_TOL || fc > N + EDGE_TOL || fr > N + EDGE_TOL) return null;
    return {
      r: Math.min(N - 1, Math.max(0, Math.floor(fr))),
      c: Math.min(N - 1, Math.max(0, Math.floor(fc))),
    };
  }
  // Pull the grab handle onto a cell the piece actually occupies. Grabbing the
  // hollow corner of an L or S shape used to anchor the whole drag on empty
  // space, so the piece landed a cell or two from where it looked like it would.
  function snapGrab(shard, dr, dc) {
    if (shard.offs.some((o) => o.dr === dr && o.dc === dc)) return { dr, dc };
    let best = shard.offs[0], bd = Infinity;
    for (const o of shard.offs) {
      const d = Math.abs(o.dr - dr) + Math.abs(o.dc - dc);
      if (d < bd) { bd = d; best = o; }
    }
    return { dr: best.dr, dc: best.dc };
  }
  // Every drag is trailed by a synthetic click on whatever ends up under the
  // pointer. Unblocked, that click re-arms or picks up the piece just dropped,
  // which is what made placed tiles look like they popped straight back out.
  function suppressClick() {
    draggedRef.current = true;
    let timer = 0;
    const clear = () => {
      draggedRef.current = false;
      window.removeEventListener('click', swallow, true);
      if (timer) clearTimeout(timer);
    };
    const swallow = (ev) => {
      // Only eat a click that lands back on the board or the tray, so a player
      // who drops a piece and immediately hits Undo still gets their button.
      const t = ev.target;
      if (t && t.closest && t.closest('.sh-cell, .sh-piece')) { ev.stopPropagation(); ev.preventDefault(); }
      clear();
    };
    window.addEventListener('click', swallow, true);
    timer = setTimeout(clear, 450);
  }
  // Pointer-down on a shard records a candidate; it only becomes a drag once the
  // pointer moves past a small threshold, so a plain click stays a click (used
  // for tap-to-arm / tap-to-pick-up) and never counts as a move.
  function beginPointer(e, id, grab, from) {
    if (!playing) return;
    if (g.locked.includes(id)) return;
    if (e.button != null && e.button > 0) return; // right and middle clicks are not drags
    if (pendingRef.current) return;               // one pointer owns the board at a time
    startClock();
    // Capturing the pointer keeps move, up and cancel coming to us even once the
    // pointer leaves the tile or the window. Without it a mouse released off the
    // page, or a touch the browser reclaimed, left the ghost pinned on screen
    // with the piece frozen underneath.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    pendingRef.current = {
      id,
      grab: snapGrab(SHARDS[id], grab.dr, grab.dc),
      from,
      el: e.currentTarget,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      // A finger wobbles several pixels on a plain tap, so touch needs a wider
      // deadzone than a mouse or every tap turned into an accidental micro-drag.
      slop: e.pointerType === 'mouse' ? 4 : 9,
      // A fingertip completely covers a 40px cell, so a touch drag was aimed
      // blind. Lift the piece and the hit test by just over a cell so the
      // player can see the square they are dropping onto. Both move together,
      // so the drop still lands exactly where the ghost is drawn.
      lift: e.pointerType === 'mouse' ? 0 : Math.round(CELL * 1.15),
      activated: false,
    };
  }
  useEffect(() => {
    const mine = (e, p) => p && (e.pointerId == null || e.pointerId === p.pointerId);
    const release = (p) => {
      try { if (p.el && p.el.releasePointerCapture) p.el.releasePointerCapture(p.pointerId); } catch (err) {}
    };
    const move = (e) => {
      const p = pendingRef.current;
      if (!mine(e, p)) return;
      const dx = e.clientX - p.startX, dy = e.clientY - p.startY;
      if (!p.activated) {
        if (Math.hypot(dx, dy) < p.slop) return;
        p.activated = true;
        setArmed(null);
        setDrag({ id: p.id, grab: p.grab, x: e.clientX, y: e.clientY, from: p.from, lift: p.lift });
      }
      if (e.cancelable) e.preventDefault();
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      const cell = fnRef.current.cellFromPoint(e.clientX, e.clientY - p.lift);
      setHoverCell(cell ? { r: cell.r - p.grab.dr, c: cell.c - p.grab.dc } : null);
    };
    const up = (e) => {
      const p = pendingRef.current;
      if (!mine(e, p)) return;
      release(p);
      pendingRef.current = null;
      if (!p.activated) return; // never moved: let the click handler treat it as a tap
      suppressClick();
      const f = fnRef.current;
      const cell = f.cellFromPoint(e.clientX, e.clientY - p.lift);
      if (cell) {
        const ar = cell.r - p.grab.dr, ac = cell.c - p.grab.dc;
        if (f.canPlaceWith(f.g, SHARDS[p.id], ar, ac, p.id)) f.placeShard(p.id, ar, ac);
        else f.say('That piece will not fit there.');
      }
      setDrag(null); setHoverCell(null);
    };
    // The browser can take a gesture back mid-drag (a scroll it decided to own, a
    // system edge swipe, a second finger). That fired no mouseup and no touchend
    // under the old handlers, so the drag state was never torn down.
    const cancel = (e) => {
      const p = pendingRef.current;
      if (!mine(e, p)) return;
      release(p);
      pendingRef.current = null;
      if (p.activated) suppressClick();
      setDrag(null); setHoverCell(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SHARDS, N]);

  // Commit the wet piece: tap it a second time on the board, or press the Lock
  // in button, which is the discoverable path since a bare tap gesture is
  // invisible until someone tells you about it.
  function commitWet() {
    setG((cur) => {
      if (cur.status !== 'playing' || cur.wet == null) return cur;
      pushHistory(cur);
      return { ...cur, wet: null };
    });
    setArmed(null);
    say('Piece locked in.');
  }

  // tap on a board cell: place the armed shard (handle lands on the cell)
  function onCellTap(r, c) {
    if (!playing) return;
    // A tap on the wet piece is only ever select-or-commit: the first tap
    // selects it, a second tap on it locks it in. There is deliberately no
    // timing window. A double-tap deadline is hostile on a phone, and since a
    // tap on the wet piece has no other meaning, it does not need one. Checked
    // before the armed branch so this always wins the gesture, and so the
    // select tap can never shove the piece sideways.
    const here = occ.get(r * 100 + c);
    if (here && here.id === g.wet && !g.locked.includes(here.id)) {
      if (armed === here.id) { commitWet(); return; }
      setArmed(here.id);
      return;
    }
    if (armed != null) {
      const s = SHARDS[armed];
      const ar = r - s.handle.dr, ac = c - s.handle.dc;
      if (canPlaceWith(g, s, ar, ac, armed)) { placeShard(armed, ar, ac); return; }
      say('That shard will not fit there.');
      return;
    }
    const cell = occ.get(r * 100 + c);
    if (cell) {
      if (g.locked.includes(cell.id)) { say('That shard is locked by a hint.'); return; }
      setArmed(cell.id); // arm a placed shard so the next cell tap moves it; tap it again to pick up
    }
  }
  function onShardTap(id) {
    if (!playing) return;
    startClock();
    if (armed === id) {
      // second tap: if it is placed, pick it up; if in tray, just disarm
      if (g.placements[id]) pickUp(id);
      setArmed(null);
    } else setArmed(id);
  }

  // Refreshed every render so the window-level drag listeners never act on a
  // stale board.
  fnRef.current = { g, placeShard, canPlaceWith, cellFromPoint, say };

  function startClock() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); }
  function startGame() { startClock(); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }

  // ---- hints (in order, once each) ----
  function useHint(which) {
    if (!playing) return;
    if (which !== g.hintsUsed + 1) return; // enforce order
    if (which === 1) {
      // Nothing on the board is nothing to check, so refuse BEFORE the hint is
      // spent. The button is disabled at zero placements; this is the guard behind
      // it, not a message the player normally sees.
      if (placedCount === 0) { say('Place a shard first. This hint checks the work already on the board.'); return; }
      // Judge a placement by the LETTERS it lays down, not by whether the piece
      // sits on its own solved anchor. Cuts now deliberately repeat shard shapes,
      // and two pieces that share a shape AND its letters are interchangeable: a
      // swapped pair still spells the one correct grid, so flagging one of them
      // as "wrong" would be a lie the player cannot act on.
      const wrong = SHARDS.find((s) => {
        const p = g.placements[s.id];
        if (!p) return false;
        return s.offs.some((o) => SOLUTION[(p.r + o.dr) * 100 + (p.c + o.dc)] !== o.ch);
      });
      setG((cur) => ({ ...cur, hintsUsed: 1 }));
      if (wrong) { setWrongHint(wrong.id); setArmed(null); say('The flagged shard is not in its true home.'); }
      else say('Every placed shard is correct so far.');
    } else if (which === 2) {
      // lock the most clarifying UNPLACED shard into its true home (largest, then rarest letter)
      const unplaced = SHARDS.filter((s) => !g.placements[s.id]);
      if (!unplaced.length) { say('Every shard is already placed.'); return; }
      const pick = unplaced.slice().sort((a, b) => b.size - a.size || rarity(b) - rarity(a))[0];
      setG((cur) => {
        pushHistory(cur);
        const pl = cur.placements.slice();
        // The hinted home may already be occupied by a wrongly-placed shard.
        // Return those to the tray first: this lock bypasses canPlaceWith, so
        // without the eviction two shards would end up stacked on the same cells.
        const home = new Set(pick.offs.map((o) => (pick.minR + o.dr) * 100 + (pick.minC + o.dc)));
        for (const s of SHARDS) {
          const p = pl[s.id];
          if (!p || s.id === pick.id) continue;
          if (s.offs.some((o) => home.has((p.r + o.dr) * 100 + (p.c + o.dc)))) pl[s.id] = null;
        }
        pl[pick.id] = { r: pick.minR, c: pick.minC };
        return { ...cur, placements: pl, hintsUsed: 2, locked: [...cur.locked, pick.id], wet: cur.wet != null && pl[cur.wet] ? cur.wet : null };
      });
      setArmed(null); setWrongHint(null);
      say('One shard has been locked into its true home.');
    } else if (which === 3) {
      if (armed == null) { say('Select a shard first, then use this hint to see its home.'); return; }
      setHomeHint(armed);
      setG((cur) => ({ ...cur, hintsUsed: 3 }));
      say('Its true home is outlined on the board.');
      setTimeout(() => setHomeHint(null), 6000);
    }
  }
  function rarity(s) { const w = 'ZQXJKVBPYGFWMUCLDRHSNIOATE'; return s.offs.reduce((m, o) => Math.min(m, w.indexOf(o.ch)), 99); }

  // ---- win detection ----
  useEffect(() => {
    if (solved && g.status === 'playing' && !finishedRef.current) {
      finishedRef.current = true;
      const sc = Math.max(FLOOR, START - 5 * g.misplaced - hintsCost(g.hintsUsed, HINTS));
      const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
      setG(g2);
      setEndClosed(false);
      abandon.markFlushed();
      postResult(g2, sc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  const REC_KEY = `sot_shards_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = placedCount > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: liveScore, total: START, correct: 0, guessesUsed: g.misplaced + g.hintsUsed, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: START, m: g2.misplaced, h: g2.hintsUsed, won: true })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: START, correct: 1, guessesUsed: g2.misplaced + g2.hintsUsed, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    finishedRef.current = false; histRef.current = [];
    setG(freshState(N)); setArmed(null); setEndClosed(false);
  }

  const finalScore = g.status === 'done' ? Math.max(FLOOR, START - 5 * g.misplaced - hintsCost(g.hintsUsed, HINTS)) : liveScore;
  const won = g.status === 'done';

  // ---- share art: a five-square score bar, the house pattern (Etch, Mate, Tally) ----
  // It deliberately carries NO grid information. The old mosaic painted every
  // cell with the colour of the shard that owns it IN THE SOLUTION, plus the
  // block pattern, so a share was a readable answer key: it showed exactly where
  // every piece goes. Never reintroduce grid-shaped share art here.
  function shareArt() {
    const g5 = Math.max(1, Math.min(5, Math.round((finalScore / START) * 5)));
    return '🟩'.repeat(g5) + '⬜'.repeat(5 - g5) + '\n';
  }
  function copyShare() {
    const url = withRef(`mindloftdaily.com/shards${isTodays ? '' : `?p=${PUZZLE.num}`}`);
    const text = playing
      ? `Shards No. ${PUZZLE.num} - reassemble the shattered crossword.\n${url}`
      : `Shards No. ${PUZZLE.num} - ${finalScore}/${START} · ${elapsed} · ${g.misplaced} miss${g.misplaced === 1 ? '' : 'es'} · ${g.hintsUsed} hint${g.hintsUsed === 1 ? '' : 's'}\n${shareArt()}${url}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const statusLine = (() => {
    if (!dict && !dictErr) return { msg: 'Loading the dictionary...', cls: 'muted' };
    if (dictErr) return { msg: 'Could not load the dictionary - refresh to try again.', cls: 'bad' };
    if (g.wet != null) return { msg: 'Nudge it as much as you like for free. Tap it again to lock it in, and only then does it count.', cls: 'muted' };
    if (placedCount === 0) return { msg: 'Drag a shard onto the grid, or tap a shard then tap a square.', cls: 'muted' };
    if (placedCount < SHARDS.length) return { msg: `${placedCount} of ${SHARDS.length} shards placed. A tick marks each finished word.`, cls: 'muted' };
    if (!allValid) return { msg: 'All placed, but some runs are not in the word list yet. Rearrange the pieces.', cls: 'bad' };
    return { msg: 'Solved!', cls: 'good' };
  })();

  const homeCells = homeHint != null ? new Set(SHARDS[homeHint].offs.map((o) => (SHARDS[homeHint].minR + o.dr) * 100 + (SHARDS[homeHint].minC + o.dc))) : null;
  const tickCells = useMemo(() => { const s = new Set(); for (const cells of runTicks) { if (cells.length) s.add(cells[cells.length - 1]); } return s; }, [runTicks]);

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Reassemble the shattered grid so every across and down run of letters reads as a word."
      chips={[
        { label: 'Wet piece, free to move', tone: 'warn' },
        { label: 'Locked in, moving costs 5', tone: 'bad' },
      ]}
      steps={[
        <>The lettered pieces are rigid: no turning, no flipping. <b>Drag</b> one onto the grid, or <b>tap a piece then tap a square</b>.</>,
        <>The piece you just placed is <b>wet</b>. Shift it around as much as you like for nothing: it earns no ticks and counts toward nothing until you <b>tap it again to lock it in</b>.</>,
        <>Moving a piece you have already locked in costs a <b>miss of 5</b> and makes it wet again, so you can fine-tune the correction.</>,
        <><b>Undo</b> takes back a move and <b>Clear</b> is free. A tick appears on each finished valid word, and the board finishes itself once every piece is locked in and every word checks out.</>,
        <>Words are checked against a <b>Scrabble word list</b>, which is broader than everyday English and accepts some odd short entries. Grids from 20 August 2026 are built from common words only; older grids in the archive can still turn up a Scrabble two-letter word such as ST, JA or PE.</>,
      ]}
      knack="There are no clues but the letters, and exactly one reassembly is correct, so place the pieces whose runs can only spell one thing and let the rest fall in."
      footer={<>Start at {START}. Three hints, in order, cost {HINTS[0]}, {HINTS[1]} and {HINTS[2]}. Score never drops below {FLOOR}. Ties break by fewest misses, then fastest clock.</>}
    />
  );

  // Cell size shrinks as the grid grows so the board still clears a 360px phone
  // without horizontal scroll. Budget: 360 viewport - 20 page padding = 340 usable,
  // against N*CELL + 10 board padding + 4 border. 8x8 at 40px = 334 (41px overflows
  // by 2). 7x7 at 46px = 336. The tray also needs more room at 8x8, 13-15 pieces.
  const CELL = N === 5 ? 62 : N === 6 ? 54 : N === 7 ? 46 : 40;
  const TRAYCELL = N === 5 ? 30 : N === 6 ? 28 : N === 7 ? 26 : 24;
  const TRAYMAX = N >= 8 ? 640 : N === 7 ? 580 : 520;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="shards" name="Shards" collapsed={playing && !!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="shards" quizId={PUZZLE.quizId}
          name="Shards"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: liveScore, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sh-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sh-wrap{padding-left:10px !important;padding-right:10px !important;}}
          @media(max-width:560px){.sh-cols{gap:0 !important;}.sh-trayhead{display:none;}.sh-tray{margin-top:10px !important;}}
          .sh-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 15px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sh-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sh-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .sh-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDk}) 86%, var(--stg-ink, var(--white)));}
          .sh-btn:disabled{opacity:0.4;cursor:default;}
          .sh-board{display:grid;grid-template-columns:repeat(${N},${CELL}px);gap:0;background:var(--stg-raise, #cfd8d6);border:2px solid var(--stg-cell-line, ${COLORS.ink});border-radius:10px;padding:5px;box-shadow:5px 5px 0 rgba(28,30,36,0.14);width:max-content;touch-action:none;}
          .sh-cell{position:relative;width:${CELL}px;height:${CELL}px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${Math.round(CELL * 0.42)}px;color:${INK};user-select:none;border:1px solid var(--stg-cell-line, #b9c4c2);background:${STAGE ? 'var(--stg-cell)' : '#fbfdfc'};}
          .sh-cell.block{background:${COLORS.ink};border-color:var(--stg-ink, ${COLORS.ink});}
          .sh-cell.filled{background:var(--tint,color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent));border:1px solid rgba(0,0,0,0.14);color:#0b2b28;cursor:grab;touch-action:none;}
          .sh-cell.filled:active{cursor:grabbing;}
          .sh-cell.dragging{opacity:0.26;}
          .sh-cell.armed{outline:3px solid var(--stg-acc, ${COLORS.accent});outline-offset:-3px;z-index:2;}
          .sh-cell.wet{outline:2px dashed var(--stg-acc, ${COLORS.accentDk});outline-offset:-2px;z-index:2;}
          .sh-cell.wrong{outline:3px solid ${COLORS.rust};outline-offset:-3px;z-index:2;}
          .sh-cell.home{box-shadow:inset 0 0 0 3px var(--stg-acc, ${COLORS.accent});}
          .sh-cell.hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);}
          .sh-cell.hoverbad{background:${STAGE ? 'var(--stg-surf2)' : '#f6dcda'};}
          .sh-cell.locked::after{content:'';position:absolute;top:3px;right:3px;width:6px;height:6px;border-radius:50%;background:var(--stg-acc, ${COLORS.accent});}
          .sh-tick{position:absolute;bottom:1px;right:2px;color:${COLORS.green};line-height:1;}
          .sh-tray{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:16px auto 4px;max-width:${TRAYMAX}px;}
          .sh-piece{position:relative;display:grid;gap:2px;padding:5px;border-radius:9px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.16));box-shadow:0 2px 0 rgba(28,30,36,0.12);cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;}
          .sh-piece:active{cursor:grabbing;}
          .sh-piece.dragging{opacity:0.3;}
          .sh-piece.armed{outline:3px solid var(--stg-acc, ${COLORS.accent});outline-offset:1px;}
          .sh-pc{touch-action:none;width:${TRAYCELL}px;height:${TRAYCELL}px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:${Math.round(TRAYCELL * 0.5)}px;border-radius:4px;color:var(--white);}
          .sh-pc.empty{background:transparent;}
          .sh-ghost{position:fixed;z-index:200;pointer-events:none;display:grid;gap:2px;opacity:0.92;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.25));}
          .sh-status{font-size:12.5px;font-weight:700;min-height:18px;text-align:center;}
          .sh-trayhead{font-family:${MONO};font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:${FADED};margin-bottom:8px;text-align:center;}
          .sh-status.bad{color:${COLORS.rust};}
          .sh-status.good{color:${COLORS.green};}
          .sh-status.muted{color:${FADED};}
          .sh-hintbar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:10px;}
          .sh-hint{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid var(--stg-acc, ${COLORS.accent});color:${COLORS.accentDk};background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);border-radius:999px;padding:7px 13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .sh-hint:disabled{opacity:0.4;cursor:default;border-color:#cbd5d3;color:${FADED};background:${STAGE ? 'var(--stg-surf2)' : '#eef2f1'};}
        ` }} />

        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {/* masthead */}
          {!LOFT && (
          <DailyMasthead
            slug="shards"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={5}
            helpTop={10}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {N}x{N}</span>}
            blocks={'SHARDS'.split('').map((ch, i) => (
                <div key={i} style={{ width: 34, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 21, background: i % 2 === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.55)', transform: `rotate(${(i % 2 ? 1.5 : -1.5)}deg)` }}>{ch}</div>
              ))}
          />
          )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {/* start tile */}
          {preStart && (
            <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', maxWidth: 452, margin: '0 auto 4px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Shards is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>A solved mini crossword, shattered into {SHARDS.length} lettered pieces. Reassemble it so every word reads true. Your grid waits until you begin.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="sh-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* score bar */}
          {!preStart && (
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 10, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
              <span style={{ fontSize: 12 }}>score <b style={{ color: `var(--stg-ink, ${COLORS.accentDk})`, fontWeight: 500, fontSize: 20 }}>{playing ? liveScore : finalScore}</b><span style={{ fontSize: 11 }}>/{START}</span></span>
              <span>placed <b style={{ color: INK, fontWeight: 500 }}>{placedCount}</b>/{SHARDS.length}</span>
              <span>misses <b style={{ color: INK, fontWeight: 500 }}>{g.misplaced}</b></span>
              <span>hints <b style={{ color: INK, fontWeight: 500 }}>{g.hintsUsed}</b>/3</span>
              {!playing && <span style={{ marginLeft: 'auto', color: `var(--stg-ink, ${COLORS.green})` }}>solved</span>}
            </div>
          )}

          {!preStart && (
            <div className="sh-status" style={{ marginBottom: 10 }}>
              <span className={`sh-status ${statusLine.cls}`}>{statusLine.msg}</span>
            </div>
          )}

          {!preStart && (
            <div className="sh-cols" style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* board */}
                <div className="sh-board" ref={gridRef} role="grid" aria-label="Shards grid">
                  {Array.from({ length: N * N }, (_, i) => {
                    const r = Math.floor(i / N), c = i % N, k = r * 100 + c;
                    const isBlock = blockSet.has(k);
                    const cell = occ.get(k);
                    const isHome = homeCells && homeCells.has(k);
                    const isArmedCell = cell && armed === cell.id;
                    const isWrong = cell && wrongHint === cell.id;
                    const isLocked = cell && g.locked.includes(cell.id);
                    // drag hover preview
                    let hoverCls = '';
                    if (drag && hoverCell) {
                      const s = SHARDS[drag.id];
                      const covers = s.offs.some((o) => hoverCell.r + o.dr === r && hoverCell.c + o.dc === c);
                      if (covers) hoverCls = canPlaceWith(g, s, hoverCell.r, hoverCell.c, drag.id) ? ' hover' : ' hoverbad';
                    }
                    const tint = cell ? SHARD_TINTS[cell.id % SHARD_TINTS.length] : null;
                    return (
                      <div
                        key={i}
                        data-cell="1" data-r={r} data-c={c}
                        className={`sh-cell${isBlock ? ' block' : ''}${cell ? ' filled' : ''}${isArmedCell ? ' armed' : ''}${isWrong ? ' wrong' : ''}${isHome ? ' home' : ''}${isLocked ? ' locked' : ''}${cell && g.wet === cell.id ? ' wet' : ''}${cell && drag && drag.id === cell.id ? ' dragging' : ''}${hoverCls}`}
                        style={tint
                          // Stage: a placed piece is its ramp hue at twice the register's mix (a piece
                          // is a mark you pick up, so it sits a step above a region), edged in the
                          // hue's ink, lettered in page ink. Loft: the lightened tint, untouched.
                          ? (STAGE
                            ? { ...regionStyle(cell.id), '--tint': COLORS.accentSoft, background: regionMix(2), color: 'var(--stg-ink)', borderColor: `color-mix(in srgb, ${REGION_INK} 55%, transparent)` }
                            : { '--tint': COLORS.accentSoft, background: tintBg(tint), color: '#12312e' })
                          : undefined}
                        onClick={() => { if (!draggedRef.current) onCellTap(r, c); }}
                        onPointerDown={(e) => { if (cell && !isBlock) { const grab = { dr: r - g.placements[cell.id].r, dc: c - g.placements[cell.id].c }; beginPointer(e, cell.id, grab, 'board'); } }}
                        role="gridcell"
                      >
                        {isBlock ? '' : (cell ? cell.ch : '')}
                        {tickCells.has(k) ? <span className="sh-tick"><CheckCircle2 size={Math.round(CELL * 0.24)} strokeWidth={3} /></span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* tray + controls */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 240, flex: '1 1 240px', maxWidth: 320 }}>
                <div className="sh-trayhead">Shards - {trayShards.length} to place</div>
                <div className="sh-tray">
                  {trayShards.map((id) => {
                    const s = SHARDS[id];
                    const tint = STAGE ? 'var(--hue)' : SHARD_TINTS[id % SHARD_TINTS.length];
                    return (
                      <div
                        key={id}
                        className={`sh-piece${armed === id ? ' armed' : ''}${drag && drag.id === id ? ' dragging' : ''}`}
                        style={{ ...(STAGE ? regionStyle(id) : null), gridTemplateColumns: `repeat(${s.w}, ${TRAYCELL}px)`, gridTemplateRows: `repeat(${s.h}, ${TRAYCELL}px)` }}
                        onClick={() => { if (!draggedRef.current) onShardTap(id); }}
                        onPointerDown={(e) => {
                          // Grab the sub-cell actually pressed. Hardcoding {0,0}
                          // made the piece leap so its bounding-box corner sat
                          // under the finger, and on an L or S shape that corner
                          // is empty space, so the drop landed nowhere near it.
                          const pc = e.target && e.target.closest ? e.target.closest('[data-pc]') : null;
                          const grab = pc
                            ? { dr: Number(pc.getAttribute('data-pdr')) || 0, dc: Number(pc.getAttribute('data-pdc')) || 0 }
                            : { dr: 0, dc: 0 };
                          beginPointer(e, id, grab, 'tray');
                        }}
                        role="button" aria-label={`Shard ${id + 1}, ${s.size} cells`}
                      >
                        {Array.from({ length: s.w * s.h }, (_, i) => {
                          const dr = Math.floor(i / s.w), dc = i % s.w;
                          const o = s.offs.find((x) => x.dr === dr && x.dc === dc);
                          return <div key={i} className={`sh-pc${o ? '' : ' empty'}`} data-pc="1" data-pdr={dr} data-pdc={dc} style={o ? { background: tint, gridColumn: dc + 1, gridRow: dr + 1 } : { gridColumn: dc + 1, gridRow: dr + 1 }}>{o ? o.ch : ''}</div>;
                        })}
                      </div>
                    );
                  })}
                  {trayShards.length === 0 && <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, padding: '8px 0' }}>All pieces are on the grid.</div>}
                </div>

                {playing && (
                  <>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                      <button type="button" className="sh-btn" onClick={undo} disabled={!histRef.current.length}><Undo2 size={14} /> Undo</button>
                      <button type="button" className="sh-btn" onClick={clearBoard} disabled={placedCount === 0}><Trash2 size={14} /> Clear</button>
                      {g.wet != null && (
                        <button type="button" className="sh-btn" onClick={commitWet} style={{ background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, borderColor: COLORS.ink }}><CheckCircle2 size={14} /> Lock in</button>
                      )}
                    </div>
                    <div className="sh-hintbar">
                      <button type="button" className="sh-hint" disabled={g.hintsUsed >= 1 || placedCount === 0} title={placedCount === 0 ? 'Place a shard first' : undefined} onClick={() => useHint(1)}><Lightbulb size={13} /> Check placed (-{HINTS[0]})</button>
                      <button type="button" className="sh-hint" disabled={g.hintsUsed !== 1} onClick={() => useHint(2)}><Lightbulb size={13} /> Lock a piece (-{HINTS[1]})</button>
                      <button type="button" className="sh-hint" disabled={g.hintsUsed !== 2} onClick={() => useHint(3)}><Lightbulb size={13} /> Show home (-{HINTS[2]})</button>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                      Hints unlock in order. The board finishes itself when every word reads true.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* result line */}

          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
            {!playing && (
              <>
                <div style={{ maxWidth: 472, margin: '18px auto 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                    <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: `var(--stg-ink, ${COLORS.green})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{finalScore}</span>
                    <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                      Solved. {finalScore} of {START}, with {g.misplaced} miss{g.misplaced === 1 ? '' : 'es'} and {g.hintsUsed} hint{g.hintsUsed === 1 ? '' : 's'}. <span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                    </span>
                  </div>
                </div>
                <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px auto 0', maxWidth: 472 }}>
                  {isTodays ? (
                    <>
                      {countdown ? <>A fresh grid in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A fresh grid lands at midnight Eastern.'}
                      {prevPuzzle && (<>{' '}Meanwhile:{' '}<a href={`/shards?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s grid &rarr;</a></>)}
                    </>
                  ) : (
                    <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}<a href="/shards" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Shards &rarr;</a>{' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a></>
                  )}
                </p>
              </>
            )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Shards"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Shards all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Miss"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/shards?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Shards', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/shards?p=${prevPuzzle.num}` },
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
          {!STAGE && <GamePanel self="shards" name="Shards" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="shards" name="Shards" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid replay={!playing ? resetGame : null}
              self="shards"
              maxWidth={640}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              boardSlot={<DailyBoardPanel self="shards" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider
            />
            )}
            {!focusMode && mobileUi && !standalone && (
              <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
                <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
              </button>
            )}
          </div>
          {!focusMode && !identity && (
            <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 640 }}>
              <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
            </div>
          )}
        </div>
      </div>

      {/* dragging ghost */}
      {drag && (() => {
        const s = SHARDS[drag.id];
        const tint = STAGE ? 'var(--hue)' : SHARD_TINTS[drag.id % SHARD_TINTS.length];
        // Always board scale: the ghost has to be the size of the thing that is
        // about to land, and the old tray-scale branch made it balloon under the
        // pointer the instant the clock started.
        const gcell = CELL;
        return (
          <div className="sh-ghost" style={{ ...(STAGE ? regionStyle(drag.id) : null), left: drag.x - (drag.grab.dc + 0.5) * gcell, top: drag.y - (drag.lift || 0) - (drag.grab.dr + 0.5) * gcell, gridTemplateColumns: `repeat(${s.w}, ${gcell}px)`, gridTemplateRows: `repeat(${s.h}, ${gcell}px)` }}>
            {Array.from({ length: s.w * s.h }, (_, i) => {
              const dr = Math.floor(i / s.w), dc = i % s.w;
              const o = s.offs.find((x) => x.dr === dr && x.dc === dc);
              return <div key={i} style={{ gridColumn: dc + 1, gridRow: dr + 1, width: gcell, height: gcell, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: Math.round(gcell * 0.44), color: T.white, background: o ? tint : 'transparent', borderRadius: 4, border: o ? '1px solid rgba(0,0,0,0.15)' : 'none' }}>{o ? o.ch : ''}</div>;
            })}
          </div>
        );
      })()}

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal self="shards" won={won} completed
          score={<>{finalScore}/{START} pts</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="sh-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {showA2hsHelp && (
        <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Shards to your Home Screen</div>
            {isIosDevice() ? (
              <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b> - the tile opens today&apos;s grid, every day.</li>
              </ol>
            ) : (
              <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s grid, every day.</p>
            )}
            <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Shards - crawlable prose */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Shards</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Shards is a free daily word puzzle from Mind Loft, a jigsaw crossword. The grid arrives already solved but shattered into lettered puzzle pieces, and you reassemble it so that every across and down run of letters reads as a word. There are no clues. The letters are the clues, and the shapes are how you fit them back together.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every day&rsquo;s pieces have exactly one valid reassembly, checked by a solver before it ships, so there is always a single right answer to find. Pieces never rotate or flip. Drag them onto the grid or tap to place, move them as often as you like, and lean on three optional hints when you are stuck. You start at {START} and finish the moment the last word clicks into place. Answers are checked against a Scrabble word list, so it is broader than everyday English and accepts some unusual short entries.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A fresh grid lands every day at midnight Eastern, with a larger Sunday Edition. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/emcee" style={{ color: INK, fontWeight: 800 }}>Emcee</a>, our mini crossword, <a href="/tuck" style={{ color: INK, fontWeight: 800 }}>Tuck</a>, our tile-tucking puzzle, and <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}

function hintsCost(used, HINTS) { let s = 0; for (let i = 0; i < used; i++) s += HINTS[i] || 0; return s; }
function tintBg(hex) {
  // soft tint of the shard color for a placed cell background
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const mix = (x) => Math.round(x + (255 - x) * 0.72);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
