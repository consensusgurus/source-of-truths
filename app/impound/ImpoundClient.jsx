'use client';

// Impound — the larger Parker. Same jam, a seven by seven lot.
//
// Twenty-odd blocks, and the red one has to reach the gap in the right wall.
// Every block is locked to one axis. Tap a block, tap where you want it, and it
// slides there if the lane is clear. Seven is odd, so the exit lane is the true
// middle rank with three ranks of traffic above it and three below, which Parker
// at 6x6 cannot do.
//
// WHY A SECOND GAME AND NOT A BIGGER PARKER. Parker's 6x6 is close to used up:
// its weekdays run a perfect line of 11 to 20 moves and its Sundays 32 to 38,
// against a genuine ceiling in the low fifties that only a handful of positions
// on that board reach. Impound OPENS its week where Parker's Saturday ends, at
// 16 to 20, and runs to 50 on a Sunday. Widening Parker itself was never on:
// every banked Parker board, every stored perfect and every leaderboard row
// behind them assumes six.
//
// This file is ParkerClient's twin on purpose. The two clients diverge only in
// their board size, their copy and their keys; the rules, the search and the
// exact minimum are ONE implementation in lib/jam-core.js, bound here through
// app/impound/solver.js. A rule fixed in one game must be fixed in the engine,
// never in a client, or the two games start disagreeing about what perfect is.
//
// Two numbers, and they are not the same number. PERFECT is the banked exact
// minimum, computed by breadth-first search, and it scores ten. PAR sits a
// cushion above it, is what a clean-but-not-flawless solve lands on, and scores
// eight. See lib/par.js for the arithmetic; the floor is one, so finishing
// always beats giving up.
//
// There is no undo, only a full restart, which is what keeps perfect meaningful:
// with a free take-back you could search the whole tree by hand. A restart puts
// the board back and resets the move count, but the clock keeps running.
//
// Same daily plumbing as Parker: banked boards gated by Eastern date on the
// server (app/impound/page.js), per-puzzle localStorage saves, /impound?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, Smartphone, RotateCcw } from 'lucide-react';
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
import { parFor, stepFor, scoreFor } from '@/lib/par';
import DailyMasthead from '../DailyMasthead';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { regionStyle, REGION_INK } from '@/lib/category-ramp';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import ValetDoorPop from '../circuits/ValetDoorPop';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isLoft } from '@/lib/loft';
import { N, EXIT_ROW, fromData, grid, moves as legalSlides, apply, solved, solve } from './solver';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#7c5c2e',        // Impound identity — weathered tarmac gold
  accentSoft: '#f6efe2', green: T.successDeep,
};
const LOT = 'var(--stg-surf, #e7e2d8)';        // the lot surface
const LOT_LINE = 'var(--stg-line, #c9c2b4)';
// The wall is the strongest rule on the board, which is what makes a gap in it
// mean anything. A dark brown frame vanished into a near-black page.
const WALL = 'var(--stg-line2, #2f2a24)';
const RED_BLOCK = T.danger;
const RED_EDGE = 'var(--stg-onramp, #7a2318)';
// Muted paint for the other blocks, cycled by index so a board reads as traffic
// rather than as a colour test.
// THE FLEET. Eighteen paints picked against a cream floor became four steps of
// lift with a one pixel edge in the category colour, which is exactly the shape
// of an unplayed tile on the home. The colour is still there and still doing its
// one job, telling one car from the car beside it; what changed is that it comes
// from the category rather than from this file, so it follows the light switch
// and a Logic board is recognisably a Logic board.
//
// PAINT and TRUCK are kept, unused by the stage path, because ?stage=0 renders
// the Loft board and the fallbacks below only cover the single-value constants.
const PAINT = ['#6b7f9e', '#8a9a6b', '#a8846b', '#7f9e94', '#9e8a6b', '#6b8a9e', '#a89a6b', '#8a6b7f', '#7f8a6b', '#9e6b6b', '#6b9e8a', '#8a7f9e'];
const TRUCK = ['#3f4a5c', '#4c5c3f', '#5c4c3f', '#3f5c55', '#5c553f', '#3f4f5c'];
// THE FLEET WEARS THE RAMP (owner, 2026-09-03, "proposed A"). Six region-ramp
// indices: never lime, which is Logic's accent and marks the block you hold, and
// never rose, orange or amber, the red car's neighbours. A block is its hue at
// 2.2x the register's tint mix into the cell, edged in the hue's ink, so the
// fleet is quiet on the dark stage and pastel on the light one, and the red is
// the loudest thing in the lot in both. Replaces four grey lifts told apart by
// edge weight (BLOCK_EDGE), which the owner found too uniform.
const FLEET = [0, 2, 1, 4, 7, 6];   // sky, mint, gold, violet, periwinkle, magenta (REGION_RAMP order)
const BLOCK_LIFT = FLEET.map(() => null);   // length only: blockTones() walks it
const BLOCK_FILL = 'color-mix(in srgb, var(--hue) calc(var(--stg-tint-mix, 26%) * 2.2), var(--stg-cell, #1a1d28))';

// WHICH LIFT A BLOCK GETS IS DECIDED BY THE BOARD, not by its place in the array.
// Four steps into a thirteen block lot means repeats, and a repeat only matters
// when the two blocks TOUCH, so each block takes the step none of its neighbours
// holds and the board has used least. Deterministic, so a board looks the same on
// every load, which `PAINT[i % 12]` never was: it could and did put two olives
// side by side.
//
// Computed from the STARTING layout and then fixed for the whole game. Blocks
// move, so adjacency changes as you play, but a car that changes colour while it
// slides is far worse than two same-weight cars that happen to meet later.
function blockCells(p) {
  const out = [];
  for (let k = 0; k < p.len; k++) out.push(p.horiz ? [p.fixed, p.pos + k] : [p.pos + k, p.fixed]);
  return out;
}
function blockTones(pieces) {
  const cells = pieces.map(blockCells);
  const touch = pieces.map(() => []);
  for (let a = 0; a < pieces.length; a++) {
    for (let b = a + 1; b < pieces.length; b++) {
      const hit = cells[a].some((x) => cells[b].some((y) => Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) === 1));
      if (hit) { touch[a].push(b); touch[b].push(a); }
    }
  }
  const col = pieces.map(() => -1);
  const used = BLOCK_LIFT.map(() => 0);
  // Block 0 is the red one and never takes a lift, so the walk starts at 1.
  for (let i = 1; i < pieces.length; i++) {
    const taken = {};
    touch[i].forEach((j) => { if (col[j] >= 0) taken[col[j]] = 1; });
    let best = -1;
    for (let h = 0; h < BLOCK_LIFT.length; h++) {
      if (taken[h]) continue;
      if (best < 0 || used[h] < used[best]) best = h;
    }
    if (best < 0) best = 0;
    col[i] = best;
    used[best] += 1;
  }
  return col;
}

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_impound_help_seen';
const STATS_KEY = 'sot_impound_stats';

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

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const freshState = () => ({ v: 1, moves: [], restarts: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null });

export default function ImpoundClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_impound_${PUZZLE.num}`;
  const START = useMemo(() => fromData(PUZZLE.pieces), [PUZZLE]);
  // Off START, not off `blocks`: the tone map has to be stable for the whole game.
  const blockTone = useMemo(() => blockTones(START), [START]);

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(0);
  const [hintBlock, setHintBlock] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('impound', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('impound'); }, [g.hintUsed]);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('impound');
  const STAGE = isStage('impound', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('impound');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('impound'), '--stg-acc-lt': gameColorLight('impound'), '--stg-onramp-lt': gameOnrampLight('impound'), '--stg-acc-ink-lt': gameAccentInkLight('impound') };
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
  const used = g.moves.length;
  // PUZZLE.par is the banked exact minimum. It is the PERFECT line now; par is
  // the cushioned target derived from it (lib/par.js). The banked field keeps
  // its old name so no board in the archive has to be rewritten.
  const perfect = PUZZLE.par;
  const par = parFor(perfect);
  const step = stepFor(perfect);
  const finalScore = won ? scoreFor(used, perfect) : 0;

  const blocks = useMemo(() => {
    let ps = START;
    for (const mv of g.moves) ps = apply(ps, mv);
    return ps;
  }, [START, g.moves]);
  const occ = useMemo(() => grid(blocks), [blocks]);
  const slides = useMemo(() => (playing ? legalSlides(blocks) : []), [blocks, playing]);

  // For the selected block, the cell you tap to send it there. Each legal
  // distance gets exactly one target: the leading edge of where it would land,
  // so a tap is never ambiguous.
  const targets = useMemo(() => {
    if (sel == null || !playing) return new Map();
    const p = blocks[sel];
    const m = new Map();
    for (const [i, d] of slides) {
      if (i !== sel) continue;
      const np = p.pos + d;
      const lead = d < 0 ? np : np + p.len - 1;
      const cell = p.horiz ? p.fixed * N + lead : lead * N + p.fixed;
      m.set(cell, [i, d]);
    }
    return m;
  }, [sel, blocks, slides, playing]);

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
        if (saved && saved.v === 1 && Array.isArray(saved.moves)) {
          const next = { ...freshState(), ...saved };
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
        if (done || g.t0) localStorage.setItem('sot_impound_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_impound_day');
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
  const iq = useIqStanding({ game: 'impound', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'impound', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'impound', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'impound', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'impound', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_impound_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!(cur.moves.length || cur.hintUsed) || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.moves.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.moves.length, won: g2.status === 'won' && g2.moves.length === perfect })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.moves.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function doMove(mv) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const nextMoves = [...cur.moves, mv];
    let ps = START;
    for (const m of nextMoves) ps = apply(ps, m);
    const g2 = { ...cur, moves: nextMoves };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null); setHintBlock(null);
    if (solved(ps)) {
      const done = { ...g2, status: 'won', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(done, scoreFor(done.moves.length, perfect));
      commit(done);
      return;
    }
    vibrate(HAPT.ok);
    commit(g2);
  }

  function onCell(cell) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); return; }
    const mv = targets.get(cell);
    if (mv) { doMove(mv); return; }
    const r = Math.floor(cell / N), c = cell % N;
    const b = occ ? occ[r][c] : -1;
    if (b >= 0) {
      // Most blocks on a jammed board are wedged in. Picking one of those up and
      // then being told to tap a destination that does not exist reads as a bug,
      // so a boxed-in block is refused outright rather than selected.
      if (!slides.some(([i]) => i === b)) {
        setSel(null);
        setShake((k) => k + 1);
        say(b === 0 ? 'The red block is wedged in. Clear its lane first.' : 'That one is boxed in. Nothing can move it yet.');
        return;
      }
      setSel((v) => (v === b ? null : b));
      return;
    }
    setSel(null);
  }

  function restart() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.moves.length) return;
    commit({ ...cur, moves: [], restarts: cur.restarts + 1 });
    setSel(null); setHintBlock(null);
    say('Back to the start. Your move count is reset, the clock is not.');
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const r = solve(blocks);
    if (!r || !r.next) return;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    setHintBlock(r.next[0]);
    setSel(r.next[0]);
    say(r.next[0] === 0 ? 'The red block itself moves next.' : 'That block moves next. Which way is still on you.');
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
    setSel(null);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setSel(null); setHintBlock(null); setEndClosed(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/impound${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const vs = used === perfect ? 'perfect'
      : used < par ? `${par - used} under par`
      : used === par ? 'level par'
      : `${used - par} over par`;
    const g5 = won ? Math.max(1, Math.round(scoreFor(used, perfect) / 2)) : 0;
    const squares = '\u{1F7EB}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Impound #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${used} moves, ${vs} · ${elapsed}${hintBit}${streakBit}`
      : `Impound #${PUZZLE.num} · left it impounded`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Impound #${PUZZLE.num} \u2014 the bigger daily sliding-block jam from Mind Loft. A seven by seven lot, you are in the red one, and there is one gap in the wall.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={<>Get the <b>red block</b> to the <b>exit</b>, the gap in the right-hand wall.</>}
      banner={<><b>Par is {par}</b> on this board, the number a clean solve lands on. <b>Perfect is {perfect}</b>, the fewest moves that exist here, found by exhaustive search rather than by hand, and nobody gets under it.</>}
      steps={[
        <><b>Tap a block</b> to pick it up, then <b>tap the square you want it to reach</b>, and it slides there if the lane is clear.</>,
        <>Every block is stuck on one axis: lying across it slides left and right, standing up only up and down. Nothing turns, nothing jumps.</>,
        <>Sliding one block any distance counts as <b>one move</b>. One free <b>hint</b>, on your first ever play, names the block to move next.</>,
      ]}
      knack={<>Work back from the exit lane: clear whatever stands in the red block&rsquo;s run first, then find what is pinning those.</>}
      note={<>There is <b>no undo</b>, only a <b>restart</b> that puts the board back and zeroes your moves, though the clock keeps running.</>}
      footer={<>Perfect scores 10 and every {step} moves over it costs a point, so par scores 8, down to a floor of one, and finishing always beats walking away. Sundays are a much longer jam.</>}
    />
  );

  const cellPct = 100 / N;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="impound" name="Impound" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Impound grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="impound" quizId={PUZZLE.quizId}
          name="Impound"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · Par ${par}` : null}
          figures={playing ? [
            { v: used, k: 'moves' },
            { v: elapsed, k: 'time' },
            { v: `${par} · ${perfect}`, k: 'par · perfect' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: used, k: 'moves' },
            { v: `${par} · ${perfect}`, k: 'par · perfect' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="pk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pk-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .pk-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .pk-lot{position:relative;width:100%;aspect-ratio:1 / 1;background:${LOT};border:10px solid ${WALL};border-radius:12px;touch-action:manipulation;overflow:visible;}
          .pk-cell{position:absolute;cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .pk-blk{position:absolute;border-radius:9px;pointer-events:none;box-shadow:inset 0 -3px 6px rgba(0,0,0,0.22), inset 0 2px 3px rgba(255,255,255,0.28);transition:left .18s cubic-bezier(.3,.7,.4,1), top .18s cubic-bezier(.3,.7,.4,1);}
          .pk-dot{position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(28,30,36,0.34);pointer-events:none;left:37%;top:37%;}
          .pk-lot.shake{animation:pkshake .34s ease;}
          @keyframes pkshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="impound" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Par {par}</span>}
          blocks={'PARKER'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 5 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Impound is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Slide the blocks and get the red one to the exit on the right. Par is {par} moves and perfect is {perfect}, the fewest that exist. No undo, only a restart.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pk-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>moves <b style={{ color: used > par ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{used}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>par <b style={{ color: ACC_INK, fontWeight: 500 }}>{par}</b> &middot; perfect <b style={{ color: INK, fontWeight: 500 }}>{perfect}</b></span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto', position: 'relative' }}>
            <div key={shake} className={`pk-lot${shake ? ' shake' : ''}`}>
              {/* THE EXIT, cut through the right wall on the escape row.
                  Painting it the lot colour was enough on the Loft, where a cream
                  slot sits in a dark brown frame. On the stage the wall and the
                  lot are two weights of the same white and the gap read as
                  nothing at all, which on a game whose whole object is "get the
                  red one out" is the one thing that cannot be missed.

                  So the opening is MARKED rather than merely left empty: an
                  accent-tinted slot, with the two cut ends of the wall lit in the
                  accent above and below it. All three sit inside the wall's own
                  10px band, because at 390px the lot fills the column and
                  anything hanging past it is clipped or pushes the page sideways.

                  Off the stage every token is undefined: the slot falls back to
                  the lot cream and both lips to transparent, so the Loft board is
                  exactly what it was. */}
              <div style={{ position: 'absolute', right: -10, top: `${EXIT_ROW * cellPct}%`, width: 10, height: `${cellPct}%`, background: `color-mix(in srgb, var(--stg-acc, ${LOT}) 26%, var(--stg-ground, ${LOT}))` }} />
              <div aria-hidden="true" style={{ position: 'absolute', right: -10, top: `${EXIT_ROW * cellPct}%`, width: 10, height: 3, background: 'var(--stg-acc, transparent)' }} />
              <div aria-hidden="true" style={{ position: 'absolute', right: -10, top: `calc(${(EXIT_ROW + 1) * cellPct}% - 3px)`, width: 10, height: 3, background: 'var(--stg-acc, transparent)' }} />
              {/* lot markings */}
              {Array.from({ length: N - 1 }).map((_, i) => (
                <React.Fragment key={i}>
                  <div style={{ position: 'absolute', left: `${(i + 1) * cellPct}%`, top: 0, bottom: 0, width: 1, background: LOT_LINE }} />
                  <div style={{ position: 'absolute', top: `${(i + 1) * cellPct}%`, left: 0, right: 0, height: 1, background: LOT_LINE }} />
                </React.Fragment>
              ))}
              {/* tap layer */}
              {Array.from({ length: N * N }).map((_, cell) => {
                const r = Math.floor(cell / N), c = cell % N;
                const isTarget = targets.has(cell);
                return (
                  <div key={cell} className="pk-cell" onClick={() => onCell(cell)} role="button" tabIndex={-1}
                    aria-label={`row ${r + 1} column ${c + 1}`}
                    style={{ left: `${c * cellPct}%`, top: `${r * cellPct}%`, width: `${cellPct}%`, height: `${cellPct}%`, zIndex: 3 }}>
                    {isTarget && <span className="pk-dot" />}
                  </div>
                );
              })}
              {/* blocks */}
              {blocks.map((p, i) => {
                const isRed = i === 0;
                const truck = p.len >= 3;
                const tone = blockTone[i] || 0;
                const fill = isRed ? RED_BLOCK
                  : STAGE ? BLOCK_FILL
                  : truck ? TRUCK[i % TRUCK.length] : PAINT[i % PAINT.length];
                const carEdge = STAGE
                  ? `${truck ? 2 : 1}px solid color-mix(in srgb, ${REGION_INK} 70%, transparent)`
                  : 'none';
                const top = p.horiz ? p.fixed : p.pos;
                const left = p.horiz ? p.pos : p.fixed;
                const w = p.horiz ? p.len : 1, h = p.horiz ? 1 : p.len;
                const on = sel === i;
                return (
                  <div key={i} className="pk-blk"
                    style={{
                      ...(STAGE && !isRed ? regionStyle(FLEET[tone]) : null),
                      left: `calc(${left * cellPct}% + 3px)`, top: `calc(${top * cellPct}% + 3px)`,
                      width: `calc(${w * cellPct}% - 6px)`, height: `calc(${h * cellPct}% - 6px)`,
                      background: fill, zIndex: 2,
                      // The accent at full strength is the one tone the fleet never
                      // reaches, so the block you are holding needs no second colour
                      // to be found. The hint takes the site's own assist amber:
                      // green is its confirm, and it sits next door to Logic's lime.
                      outline: on ? `3px solid var(--stg-acc, ${COLORS.ink})`
                        : hintBlock === i ? `3px solid var(--stg-warn, ${COLORS.green})` : 'none',
                      outlineOffset: on || hintBlock === i ? '1px' : 0,
                      border: isRed ? `2px solid ${RED_EDGE}` : carEdge,
                    }} />
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {!playing
                ? (won ? (used === perfect ? `Out in ${used}. That is perfect.` : `Out in ${used}. Par was ${par}.`) : 'You left it impounded.')
                : sel != null ? 'Now tap where it goes.' : 'Tap a block to pick it up.'}
            </span>
            {g.restarts > 0 && playing && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: FADED, fontWeight: 500 }}>{g.restarts} restart{g.restarts === 1 ? '' : 's'}</span>
            )}
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button className="pk-tool" onClick={restart} disabled={!used} title="Put every block back and zero the move count" style={{ opacity: used ? 1 : 0.4, cursor: used ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Restart board
              </button>
              {hintOk && !g.hintUsed && (
                <button className="pk-tool" onClick={useHint} title="Name the block that moves next (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(124,92,46,0.5)', color: '#6a4f27' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
              Tap a block, then tap where you want it. No undo.
            </span>
            <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Eye size={13} /> {armReveal ? 'Tap again — ends the board and scores nothing' : 'Give up'}
            </button>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                Par was <span style={{ color: ACC_INK }}>{par} moves</span>, perfect was <span style={{ color: INK }}>{perfect}</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {won
                  ? used === perfect ? 'You matched perfect, which is as good as this board gets. Nobody got out faster.'
                    : used < par ? `You got out in ${used}, ${par - used} under par and ${used - perfect} off perfect.`
                      : used === par ? `You got out in ${used}, level par, ${used - perfect} off perfect.`
                        : `You got out in ${used}, ${used - par} over par.`
                  : 'Perfect was found by exhaustive search, so it is real, not an estimate.'}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, a much longer jam.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Impound in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/impound?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Impound &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/impound" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Impound &rarr;</a>
                    {' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
              name="Impound"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore}/10 \u00b7 ${used} moves \u00b7 par ${par}, perfect ${perfect} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Impound all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Tries"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/impound?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Impound', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/impound?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="impound" name="Impound" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="impound" name="Impound" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="impound" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="impound" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Impound to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.</p>
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
        <DailyEndCard modal self="impound" won={won}
          headline={won ? (used === perfect ? <>Perfect. Nothing wasted.</> : used < par ? <>Under par.</> : <>You&rsquo;re out.</>) : <>You scored 0%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {used} moves &middot; par {par}, perfect {perfect} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; par here was {par}, perfect was {perfect}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {/* THE VALET GAUNTLET OFFER (owner, 2026-09-05): on the start gate, when
          none of today's three lots has been started on this device, twice
          ever. See app/circuits/ValetDoorPop.jsx for every condition. */}
      <ValetDoorPop ready={hydrated && preStart && isTodays} self="Impound" />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
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
            <button className="pk-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Impound</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Impound is a free daily sliding-block puzzle from Mind Loft, and it is Parker on a bigger lot. Seven by seven, around twenty blocks that each slide on one axis only, and a red block that has to reach the gap in the wall. Tap a block, tap where you want it, and it goes if the lane is clear. Seven is an odd number, so the exit lane is the true middle rank of the lot, with three ranks of traffic above it and three below.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board is machine generated and then solved exactly, by breadth-first search over the whole reachable position, so perfect really is the fewest moves that exist rather than somebody&rsquo;s guess. Par sits a cushion above perfect: it is the number a clean solve lands on, and it is beatable. Boards climb through the week, from about sixteen moves on Monday to the mid thirties by Saturday, and the Sunday Edition runs longer again. Every rung sits above the matching rung on Parker, which is the whole point of the bigger lot.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/check" style={{ color: INK, fontWeight: 800 }}>Check</a>, our daily checkers shot, <a href="/four" style={{ color: INK, fontWeight: 800 }}>Four</a>, our daily Connect Four position, and <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, our daily chess endgame.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
