'use client';

// Etch — the daily nonogram (picture logic).
//
// Each day: a grid whose row and column clues give the run lengths of filled
// squares, in order, separated by at least one gap. Fill every square the clues
// force and a picture appears. There is exactly one solution, and every board is
// reachable by pure line logic — no guessing is ever required.
//
// Filling a square that isn't part of the picture counts as an error and glows
// red until you clear it. Score is 10 minus half your errors, floor 1, so a
// clean solve is a perfect 10 and ties break on fewest errors then fastest time.
// Marks (×) are free: they're your own "definitely blank" notes.
//
// Same daily plumbing as Suds/Tally: banked boards gated by Eastern date on the
// server (app/etch/page.js), per-puzzle localStorage saves, /etch?p=N archive
// pinning, streaks + stats, and the shared /api/quiz/* board flow. Mon-Fri are
// 10×10, Saturday steps up to 15×15, and Sunday is a 20×20 Edition.
//
// Every size shown to a reader is read off PUZZLE.w, never written as a
// literal: archive boards from before 2026-08-18 ran the older schedule
// (Sunday 15×15, no Saturday step-up) and a hardcoded size would lie on them.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, RotateCcw, X, Lightbulb, Eye, Smartphone, Square, Ban } from 'lucide-react';
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
  accent: '#4d7c0f',       // Etch identity — moss
  accentSoft: '#f3f8e8',
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_etch_help_seen';
const STATS_KEY = 'sot_etch_stats';
const TOOL_KEY = 'sot_etch_tool';   // remembered tool: 'fill' | 'mark'

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

// ─── Personal stats + streak (localStorage), Suds/Tally pattern ─────────────
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

// cells: 0 = untouched, 1 = filled, 2 = marked blank (×, free, never scored)
function freshState(n) {
  return { v: 1, cells: Array(n).fill(0), errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

// run lengths of a line of cell states (only 1 counts as filled)
function runsOf(vals) {
  const out = []; let c = 0;
  for (const v of vals) { if (v === 1) c++; else if (c) { out.push(c); c = 0; } }
  if (c) out.push(c);
  return out.length ? out : [0];
}
const sameRuns = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// One SVG path per finished picture: each horizontal run of filled squares
// becomes a rectangle subpath, so a thumbnail is ONE dom node rather than w*h
// divs. The gallery draws every live board, so at 73 boards the naive version
// would be ~29,000 nodes.
function solPath(sol) {
  let d = '';
  for (let r = 0; r < sol.length; r++) {
    const row = sol[r];
    let c = 0;
    while (c < row.length) {
      if (row[c] === '#') { const st = c; while (c < row.length && row[c] === '#') c++; d += `M${st} ${r}h${c - st}v1h${-(c - st)}z`; }
      else c++;
    }
  }
  return d;
}

// The gallery. Every board you have SOLVED shows its picture; the rest stay
// blank plates, so the archive reads as a set to complete and an unsolved
// day never gives its picture away. A revealed board scores 0 and stays
// blank on purpose: seeing the answer is not developing it.
function EtchGallery({ puzzles, rec, currentNum }) {
  const items = useMemo(() => puzzles.slice().sort((a, b) => a.num - b.num), [puzzles]);
  const got = (p) => !!(rec[p.num] && rec[p.num].s > 0);
  const developed = items.filter(got).length;
  if (items.length < 2) return null;
  return (
    <div style={{ margin: '20px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-mute, ${COLORS.faded})` }}>Your gallery</span>
        <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 800, color: developed ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
          {developed} of {items.length} developed
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: 5 }}>
        {items.map((p) => {
          const done = got(p);
          const here = p.num === currentNum;
          return (
            <a
              key={p.num}
              href={`/etch?p=${p.num}`}
              aria-label={done ? `${p.subject}, ${p.dateLabel}` : `${p.dateLabel}, not developed yet`}
              title={done ? `${p.subject} \u00b7 ${p.dateLabel}` : `${p.dateLabel} \u00b7 not developed yet`}
              style={{
                display: 'block', borderRadius: 4, overflow: 'hidden', aspectRatio: '1',
                background: done ? `var(--stg-surf, ${T.white})` : 'var(--stg-surf, #eceff4)',
                border: here ? `2px solid var(--stg-acc, ${COLORS.accent})` : `1px solid ${done ? 'rgba(28,30,36,0.18)' : 'rgba(28,30,36,0.08)'}`,
                boxSizing: 'border-box', padding: done ? 2 : 0,
              }}
            >
              {done ? (
                <svg viewBox={`0 0 ${p.w} ${p.h}`} width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true" focusable="false">
                  <path d={solPath(p.sol)} fill="currentColor" style={{ color: p.sunday ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-ink, ${COLORS.ink})` }} />
                </svg>
              ) : null}
            </a>
          );
        })}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: `var(--stg-mute, ${COLORS.faded})`, margin: '8px 0 0' }}>
        Solve a day and its picture fills in here. Sundays develop in {'\u2009'}<span style={{ color: `var(--stg-ink, ${COLORS.accent})`, fontWeight: 800 }}>moss</span>.
      </div>
    </div>
  );
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
// Touch aiming. Hold still for AIM_HOLD_MS and the target square starts
// following your finger; move more than AIM_SLOP_PX first and it is a sweep,
// so a quick drag to fill a run never gets caught in aim mode.
const AIM_HOLD_MS = 260;
const AIM_SLOP_PX = 11;
const AIM_LABEL = { 0: 'Clear', 1: 'Fill', 2: 'Mark ×' };
// The clue gutter is narrower than a playing square ON A PHONE ONLY, which
// hands its width back to the squares. It is size-aware because the clue font
// shrinks more slowly than the board grows: measured in DM Mono at the sizes
// clueFs actually renders, a two-digit clue is 10.8px at 10x10, 8.4px at 15x15
// and 7.2px at 20x20, against gutters of 18.7 / 13.1 / 10.6px here. A flat
// 0.66 clipped the 20x20 by 0.6px. Re-measure before narrowing any of these.
function gutFor(w) { return w >= 18 ? 0.74 : w > 12 ? 0.7 : 0.66; }
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function EtchClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const W = PUZZLE.w, H = PUZZLE.h, N = W * H;
  const STORE_KEY = `sot_etch_${PUZZLE.num}`;
  const SOL = useMemo(() => {
    const f = Array(N).fill(0);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) f[r * W + c] = PUZZLE.sol[r][c] === '#' ? 1 : 0;
    return f;
  }, [PUZZLE, N, W, H]);
  const TOTAL = useMemo(() => SOL.reduce((a, b) => a + b, 0), [SOL]);
  const maxRowClue = useMemo(() => Math.max(...PUZZLE.rows.map((r) => r.length)), [PUZZLE]);
  const maxColClue = useMemo(() => Math.max(...PUZZLE.cols.map((c) => c.length)), [PUZZLE]);
  const gridCols = maxRowClue + W, gridRows = maxColClue + H;

  const [g, setG] = useState(() => freshState(N));
  const gRef = useRef(g);
  // Defaults to Mark (×) — most solving is ruling squares out, and a wrong fill
  // costs an error, so the safe default is the free mark. Remembers the last
  // choice across days; right-click a square to fill it directly in either mode.
  const [mode, setMode] = useState('mark');   // 'fill' | 'mark'
  const [canUndo, setCanUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('etch', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('etch'); }, [g.hintUsed]);
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
  const paintRef = useRef(null);
  // A TOUCH stroke is pending until the finger lifts: nothing is written and
  // nothing is scored while it is on screen. See onCellDown below for why.
  const pendRef = useRef(null);
  const aimTimer = useRef(null);
  const commitRef = useRef(() => {});
  const [pend, setPend] = useState(null);   // { run: number[], val } — the preview
  const [aim, setAim] = useState(null);     // { idx, val, aiming } — the callout
  // The callout FOLLOWS the finger, but its position is not React state: a
  // 20x20 board is ~540 divs and re-rendering them on every pointermove is
  // exactly the jank a phone cannot afford. Position is written straight to
  // the node, so a render only happens when the target SQUARE changes.
  const aimElRef = useRef(null);
  const aimPosRef = useRef({ x: 0, y: 0 });

  const cells = g.cells;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('etch');
  const STAGE = isStage('etch', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('etch');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('etch'), '--stg-acc-lt': gameColorLight('etch'), '--stg-onramp-lt': gameOnrampLight('etch'), '--stg-acc-ink-lt': gameAccentInkLight('etch') };
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
  const errors = g.errors;
  // What the game actually posted, mirroring the win path: 10 down one
  // point per two errors, floored at 1, and 0 for a give-up. Only the cap
  // reads it, and only once the game is over.
  const endScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;
  const finalScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;

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

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === N) {
          const next = { ...freshState(N), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
      const t = localStorage.getItem(TOOL_KEY);
      if (t === 'fill' || t === 'mark') setMode(t);
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
        if (done || g.t0) localStorage.setItem('sot_etch_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_etch_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // remember the player's tool across days
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(TOOL_KEY, mode); } catch (e) {}
  }, [mode, hydrated]);

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

  // ---- metrics + leaderboard (shared /api/quiz/* flow) ----
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
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'etch', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'etch', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'etch', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'etch', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'etch', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const filledRight = useMemo(() => {
    let k = 0;
    for (let i = 0; i < N; i++) if (SOL[i] === 1 && cells[i] === 1) k++;
    return k;
  }, [cells, SOL, N]);

  // per-line completion, for dimming a satisfied clue
  const rowDone = useMemo(() => PUZZLE.rows.map((clue, r) =>
    sameRuns(runsOf(cells.slice(r * W, r * W + W)), clue)), [cells, PUZZLE, W]);
  const colDone = useMemo(() => PUZZLE.cols.map((clue, c) => {
    const col = [];
    for (let r = 0; r < H; r++) col.push(cells[r * W + c]);
    return sameRuns(runsOf(col), clue);
  }), [cells, PUZZLE, W, H]);

  function isSolved(cs) {
    for (let i = 0; i < N; i++) {
      if (SOL[i] === 1 && cs[i] !== 1) return false;
      if (SOL[i] === 0 && cs[i] === 1) return false;
    }
    return true;
  }

  const REC_KEY = `sot_etch_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.cells.some((v) => v) || cur.errors > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.errors, won: g2.status === 'won' && g2.errors === 0 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.errors, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function pushUndo(cs) {
    undoRef.current = [...undoRef.current.slice(-59), cs.slice()];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || gRef.current.status !== 'playing') return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    commit({ ...gRef.current, cells: prev.slice() });
  }

  // core write. `val` is the target state for the square (0/1/2).
  function applyPaint(idx, val) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || idx < 0 || idx >= N) return;
    if (cur.cells[idx] === val) return;
    const nextCells = cur.cells.slice();
    nextCells[idx] = val;
    const wrong = val === 1 && SOL[idx] === 0;
    const g2 = { ...cur, cells: nextCells, errors: cur.errors + (wrong ? 1 : 0) };
    if (!g2.t0) g2.t0 = Date.now();
    if (!wrong && isSolved(nextCells)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2);
      setJustWon(true);
      return;
    }
    if (wrong) vibrate(HAPT.wrong);
    commit(g2);
  }

  function cellFromPoint(x, y) {
    try {
      const el = document.elementFromPoint(x, y);
      const t = el && el.closest ? el.closest('[data-i]') : null;
      return t ? Number(t.getAttribute('data-i')) : -1;
    } catch (e) { return -1; }
  }
  // the value a tap on this square would place, given the selected tool
  function toggleFor(idx) {
    const cur = gRef.current.cells[idx];
    return mode === 'fill' ? (cur === 1 ? 0 : 1) : (cur === 2 ? 0 : 2);
  }
  // A touch drag is LINE LOCKED: it runs along the row or the column, whichever
  // the finger has travelled further in. A fingertip covers several squares at
  // once, and a free-form path smears diagonally across ones nobody aimed at.
  function runBetween(a, b) {
    const r1 = Math.floor(a / W), c1 = a % W, r2 = Math.floor(b / W), c2 = b % W;
    const out = [];
    if (Math.abs(c2 - c1) >= Math.abs(r2 - r1)) {
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) out.push(r1 * W + c);
    } else {
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) out.push(r * W + c1);
    }
    return out;
  }
  function aimTop(y) { return y < 108 ? y + 42 : y - 66; }
  function aimLeft(x) {
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    return Math.max(56, Math.min(w - 56, x));
  }
  function positionAim(x, y) {
    aimPosRef.current = { x, y };
    const el = aimElRef.current;
    if (!el) return;
    el.style.left = aimLeft(x) + 'px';
    el.style.top = aimTop(y) + 'px';
  }
  function sameCells(a, b) {
    return a && b && a.length === b.length && a[0] === b[0] && a[a.length - 1] === b[b.length - 1];
  }
  function clearPending() {
    pendRef.current = null;
    clearTimeout(aimTimer.current);
    setPend(null);
    setAim(null);
  }
  // The whole touch stroke lands in ONE write, when the finger lifts. Errors
  // are counted HERE and nowhere else on this path, so a square you preview
  // and slide away from has never been filled and has never been scored.
  function commitPending() {
    const p = pendRef.current;
    clearPending();
    if (!p) return;
    if (p.off) return;                      // lifted off the board: nothing lands, nothing is scored
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const targets = p.run.filter((i) => i >= 0 && i < N && cur.cells[i] !== p.val);
    if (!targets.length) return;
    pushUndo(cur.cells);
    const next = cur.cells.slice();
    let errs = 0;
    for (const i of targets) {
      next[i] = p.val;
      if (p.val === 1 && SOL[i] === 0) errs++;
    }
    const g2 = { ...cur, cells: next, errors: cur.errors + errs };
    if (!g2.t0) g2.t0 = Date.now();
    if (!errs && isSolved(next)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2);
      setJustWon(true);
      return;
    }
    if (errs) vibrate(HAPT.wrong);
    commit(g2);
  }
  useEffect(() => { commitRef.current = commitPending; });
  // place it on the frame it first appears, before it can flash at 0,0
  useEffect(() => { if (aim) positionAim(aimPosRef.current.x, aimPosRef.current.y); }, [aim]);

  function onCellDown(e, idx) {
    if (e.button === 2) return;   // right-click is handled by onContextMenu (fill)
    if (gRef.current.status !== 'playing') return;
    if (!gRef.current.t0) startGame();
    const touch = e.pointerType === 'touch' || e.pointerType === 'pen';
    const val = toggleFor(idx);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    if (!touch) {
      // Mouse is unchanged: a click paints on the way down, a drag paints the
      // squares it crosses. A cursor is one pixel wide and needs no aiming.
      pushUndo(gRef.current.cells);
      paintRef.current = { val };
      applyPaint(idx, val);
      return;
    }
    // Touch. The squares are 12-25px on a phone against a 44px minimum target,
    // so the square under a fingertip is both hidden by it and easy to miss.
    // Nothing is written yet: the stroke previews, a callout above the finger
    // names the square it is on, and a press-and-hold lets the target follow
    // the finger so a miss can be corrected before it costs anything.
    pendRef.current = { val, run: [idx], anchor: idx, aiming: false, x0: e.clientX, y0: e.clientY };
    aimPosRef.current = { x: e.clientX, y: e.clientY };
    setPend({ run: [idx], val });
    setAim({ idx, val, aiming: false });
    clearTimeout(aimTimer.current);
    aimTimer.current = setTimeout(() => {
      const p = pendRef.current;
      if (!p || p.run.length > 1) return;   // already a sweep, leave it alone
      p.aiming = true;
      setAim((a) => (a ? { ...a, aiming: true } : a));
      vibrate(HAPT.ok);
    }, AIM_HOLD_MS);
  }
  // right-click fills a square directly, whatever the selected tool
  function fillDirect(idx) {
    if (gRef.current.status !== 'playing') return;
    if (!gRef.current.t0) startGame();
    const cur = gRef.current.cells[idx];
    const val = cur === 1 ? 0 : 1;
    pushUndo(gRef.current.cells);
    applyPaint(idx, val);
  }
  function onGridMove(e) {
    if (paintRef.current) {                 // mouse stroke, unchanged
      const idx = cellFromPoint(e.clientX, e.clientY);
      if (idx >= 0) applyPaint(idx, paintRef.current.val);
      return;
    }
    const p = pendRef.current;
    if (!p) return;
    positionAim(e.clientX, e.clientY);
    const idx = cellFromPoint(e.clientX, e.clientY);
    if (idx < 0) {
      // OFF THE BOARD, which is the natural way to bail out of a stroke. Mark
      // it rather than ignoring the move, so a release out here throws the
      // stroke away instead of committing whatever the last in-board run was.
      // The preview and the callout both go, so the cancel is visible BEFORE
      // the finger lifts and nothing is left naming a square you have left.
      if (!p.off) { p.off = true; clearTimeout(aimTimer.current); setPend(null); setAim(null); }
      return;
    }
    if (p.off) {
      // Back on the board: redraw. p.run is emptied so the sameCells guard
      // below cannot mistake the restored preview for "no change".
      p.off = false;
      p.run = [];
      setAim({ idx, val: p.val, aiming: p.aiming });
    }
    if (p.aiming) {
      // Aim mode: still one square, and it follows the finger. The action is
      // re-derived from whatever square is now under it, so sliding onto a
      // filled square offers to clear it rather than carrying the old value.
      if (p.run.length === 1 && p.run[0] === idx) return;
      const val = toggleFor(idx);
      p.anchor = idx;
      p.val = val;
      p.run = [idx];
      setPend({ run: [idx], val });
      setAim((a) => (a ? { ...a, idx, val } : a));
      return;
    }
    if (Math.abs(e.clientX - p.x0) <= AIM_SLOP_PX && Math.abs(e.clientY - p.y0) <= AIM_SLOP_PX) return;
    clearTimeout(aimTimer.current);         // a real sweep never enters aim mode
    const run = runBetween(p.anchor, idx);
    if (sameCells(run, p.run)) return;        // still the same squares, no render
    p.run = run;
    setPend({ run, val: p.val });
    setAim((a) => (a && a.idx !== idx ? { ...a, idx } : a));
  }
  useEffect(() => {
    const up = () => { paintRef.current = null; commitRef.current(); };
    const cancel = () => { paintRef.current = null; clearPending(); };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
  }, []);

  // one free hint: fill a correct square that is still empty
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    let idx = -1;
    for (let i = 0; i < N; i++) if (SOL[i] === 1 && cur.cells[i] !== 1) { idx = i; break; }
    if (idx < 0) return;
    const nextCells = cur.cells.slice();
    nextCells[idx] = 1;
    pushUndo(cur.cells);
    const g2 = { ...cur, cells: nextCells, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    if (isSolved(nextCells)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(g2.errors / 2))));
      commit(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    commit(g2);
    say('Hint placed, one square filled in.');
  }

  function revealEnd() {
    const cur = gRef.current;
    const g2 = { ...cur, cells: SOL.slice(), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    commit(freshState(N));
    setJustWon(false); setEndClosed(false);
  }

  // desktop keyboard: F/M switch tools, Ctrl+Z undoes
  const onKey = useCallback((e) => {
    if (gRef.current.status !== 'playing') return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'f' || k === 'F') { setMode('fill'); return; }
    if (k === 'm' || k === 'M' || k === 'x' || k === 'X') { setMode('mark'); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareUrl() {
    return withRef(`mindloftdaily.com/etch${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Etch #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${errors === 0 ? 'clean' : `${errors} error${errors === 1 ? '' : 's'}`} · ${elapsed}${hintBit}${streakBit}`
      : `Etch #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Etch #${PUZZLE.num} — the daily nonogram from Mind Loft.\n${shareUrl()}`
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

  const GUTM = gutFor(W);
  const pendSet = useMemo(() => (pend ? new Set(pend.run) : null), [pend]);
  const pendVal = pend ? pend.val : null;
  const clueFs = W >= 18 ? 'clamp(6px, 1.15vw, 10px)' : W > 12 ? 'clamp(7px, 1.5vw, 11px)' : 'clamp(9px, 2vw, 13px)';
  const boardMax = W >= 18 ? 740 : W > 12 ? 620 : 470;
  const shellMax = W >= 18 ? 760 : 660;
  const sizeLabel = `${W}\u00d7${H}`;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Fill the squares the clues force, and a picture appears."
      chips={[
        { label: 'Mark (M): a free ×, never scored', tone: 'grey' },
        { label: 'Fill (F): a wrong square is an error', tone: 'bad' },
      ]}
      steps={[
        <>The numbers on each <b>row</b> and <b>column</b> are the lengths of its filled runs, in order, with at least one blank between them. A row clued <b>4 2</b> is four filled, a gap, then two.</>,
        <>Choose what a tap places with <b>Fill</b> / <b>Mark</b>. It opens on <b>Mark</b>, pencilling a &times; on a square you have ruled out, and remembers your choice next time.</>,
        <>On <b>Fill</b>, tap a square or <b>drag</b> along a row or column to fill a run. A <b>right-click</b> fills one directly from either tool, and a clue is <b>crossed off</b> once its line matches.</>,
        <>On a touchscreen nothing is placed until you <b>lift</b> your finger, so a square you slide away from is never filled and never counts. <b>Press and hold</b>, then slide, to move the target square out from under your fingertip.</>,
        <><b>Undo</b> (or Ctrl+Z) takes back your last stroke, and one free <b>hint</b>, on your first ever play, fills a correct square.</>,
      ]}
      knack="One solution per board, reachable by pure logic, so you never have to guess. Marking what you have ruled out is free, filling it wrong is not."
      note={<>Filling a square that isn&rsquo;t part of the picture turns <b>red</b> and counts as an error. Clear it to carry on.</>}
      footer="A clean solve with no errors is a perfect 10, every two errors cost a point. Ties break on fewest errors, then fastest time. Monday to Friday is 10×10, Saturday steps up to 15×15, and Sunday is a 20×20 Edition."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="etch" name="Etch" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Etch grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="etch" quizId={PUZZLE.quizId}
          name="Etch"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${sizeLabel}` : null}
          figures={playing ? [
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
            { v: `${filledRight}/${TOTAL}`, k: 'filled' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'errors' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="et-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.et-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .et-grid{grid-template-columns:var(--et-cols);grid-template-rows:var(--et-rows);aspect-ratio:var(--et-ar);}
          /* Phone: the board takes back the card and stage padding, and the
             clue gutter narrows, so every square is about a fifth wider. */
          @media(max-width:560px){
            .et-grid{grid-template-columns:var(--et-cols-m);grid-template-rows:var(--et-rows-m);aspect-ratio:var(--et-ar-m);}
            .et-clue-r{padding-right:1px !important;}
            .et-card{padding-left:5px !important;padding-right:5px !important;}
            .et-wrap .loft-stage{padding-left:3px !important;padding-right:3px !important;}
          }
          .et-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .et-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @media(max-width:560px){.et-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.et-ttl h1{font-size:21px;}.et-ttl-dot{display:none;}}
          .et-cell{box-sizing:border-box;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;position:relative;}
          .et-clue{display:flex;align-items:center;justify-content:center;font-family:${MONO};font-weight:500;color:${INK};min-width:0;min-height:0;line-height:1;transition:opacity 0.18s ease;}
          /* A satisfied line is CROSSED OFF, not tinted. The old #c3c8d4 was a
             pale grey: on the dark register it sat 1.43:1 from the live ink
             beside it, so a finished clue and a live one read as the same
             thing. Opacity fades against whichever register is showing (the
             light one measured 1.6:1 on white, worse), and the rule through the
             digit is the part that carries at a glance on a 20x20 board. */
          .et-clue.done{opacity:0.45;text-decoration:line-through;text-decoration-thickness:max(1px, 0.14em);text-decoration-skip-ink:none;}
          .et-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .et-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
        ` }} />

        <div style={{ maxWidth: shellMax, margin: '0 auto' }}>


        {!LOFT && (
        <DailyMasthead
          slug="etch"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {sizeLabel}</span>}
          blocks={'ETCH'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Etch is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Fill the squares the row and column clues force, and a picture appears. {W}&times;{H} today.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="et-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'et-card stg-board' : (LOFT ? 'loft-card et-card' : 'et-card')} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>errors <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>filled <b style={{ color: filledRight === TOTAL ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{filledRight}</b>/{TOTAL}</span>
          </div>
          )}

          <div style={{ maxWidth: boardMax, margin: '0 auto' }}>
            <div
              onPointerMove={onGridMove}
              className="et-grid"
              style={{
                display: 'grid',
                touchAction: 'none',
                '--et-cols': `repeat(${maxRowClue}, minmax(0, 1fr)) repeat(${W}, minmax(0, 1fr))`,
                '--et-rows': `repeat(${maxColClue}, minmax(0, 1fr)) repeat(${H}, minmax(0, 1fr))`,
                '--et-ar': `${gridCols} / ${gridRows}`,
                '--et-cols-m': `repeat(${maxRowClue}, minmax(0, ${GUTM}fr)) repeat(${W}, minmax(0, 1fr))`,
                '--et-rows-m': `repeat(${maxColClue}, minmax(0, ${GUTM}fr)) repeat(${H}, minmax(0, 1fr))`,
                '--et-ar-m': `${(maxRowClue * GUTM + W).toFixed(3)} / ${(maxColClue * GUTM + H).toFixed(3)}`,
              }}
            >
              {Array.from({ length: gridRows * gridCols }).map((_, k) => {
                const gr = Math.floor(k / gridCols), gc = k % gridCols;
                const inClueTop = gr < maxColClue, inClueLeft = gc < maxRowClue;
                if (inClueTop && inClueLeft) return <div key={k} />;
                if (inClueTop) {
                  const c = gc - maxRowClue;
                  const list = PUZZLE.cols[c];
                  const off = maxColClue - list.length;
                  const v = gr >= off ? list[gr - off] : null;
                  return (
                    <div key={k} className={`et-clue${colDone[c] ? ' done' : ''}`} style={{ fontSize: clueFs, paddingBottom: 2, borderLeft: c % 5 === 0 && c !== 0 ? '2px solid rgba(28,30,36,0.35)' : undefined }}>
                      {v === null || v === 0 ? '' : v}
                    </div>
                  );
                }
                if (inClueLeft) {
                  const r = gr - maxColClue;
                  const list = PUZZLE.rows[r];
                  const off = maxRowClue - list.length;
                  const v = gc >= off ? list[gc - off] : null;
                  return (
                    <div key={k} className={`et-clue et-clue-r${rowDone[r] ? ' done' : ''}`} style={{ fontSize: clueFs, paddingRight: 3, justifyContent: 'flex-end', borderTop: r % 5 === 0 && r !== 0 ? '2px solid rgba(28,30,36,0.35)' : undefined }}>
                      {v === null || v === 0 ? '' : v}
                    </div>
                  );
                }
                const r = gr - maxColClue, c = gc - maxRowClue, idx = r * W + c;
                const v = cells[idx];
                const wrong = v === 1 && SOL[idx] === 0;
                // pv is what a pending TOUCH stroke would put here, or null.
                // It is a preview: not written, not scored, gone if the finger
                // slides off before it lifts.
                const pv = pendSet && pendSet.has(idx) ? pendVal : null;
                const bg = pv !== null
                  ? (pv === 1 ? 'rgba(28,30,36,0.42)' : pv === 0 ? 'rgba(28,30,36,0.05)' : T.white)
                  : wrong ? '#f4b8b8' : v === 1 ? COLORS.ink : T.white;
                return (
                  <div
                    key={k}
                    data-i={idx}
                    className="et-cell"
                    onPointerDown={(e) => onCellDown(e, idx)}
                    onContextMenu={(e) => { e.preventDefault(); fillDirect(idx); }}
                    style={{
                      background: bg,
                      boxShadow: pv !== null ? `inset 0 0 0 2px var(--stg-acc, ${COLORS.accent})` : undefined,
                      borderRight: `${c % 5 === 4 && c !== W - 1 ? 2 : 1}px solid ${c % 5 === 4 && c !== W - 1 ? 'rgba(28,30,36,0.75)' : 'rgba(28,30,36,0.22)'}`,
                      borderBottom: `${r % 5 === 4 && r !== H - 1 ? 2 : 1}px solid ${r % 5 === 4 && r !== H - 1 ? 'rgba(28,30,36,0.75)' : 'rgba(28,30,36,0.22)'}`,
                      borderLeft: c === 0 ? '2px solid rgba(28,30,36,0.75)' : undefined,
                      borderTop: r === 0 ? '2px solid rgba(28,30,36,0.75)' : undefined,
                    }}
                  >
                    {(pv !== null ? pv === 2 : v === 2) && (
                      <span style={{ fontFamily: MONO, fontSize: clueFs, color: pv === 2 ? `var(--stg-acc-ink, ${COLORS.accent})` : '#b9c0cc', lineHeight: 1 }}>&times;</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* The aim callout. A fingertip hides the square it is on, so the
              square it is on is named ABOVE the finger, along with what will
              happen when it lifts. Touch only: it is only ever set there. */}
          {aim && (
            <div ref={aimElRef} aria-hidden style={{
              position: 'fixed', zIndex: 60, pointerEvents: 'none',
              left: aimLeft(aimPosRef.current.x),
              top: aimTop(aimPosRef.current.y),
              transform: 'translateX(-50%)',
              background: COLORS.ink, color: T.white, borderRadius: 9,
              padding: '5px 10px 6px', textAlign: 'center', whiteSpace: 'nowrap',
              boxShadow: '0 5px 16px rgba(0,0,0,0.34)',
            }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.09em', opacity: 0.7, lineHeight: 1.4 }}>
                R{Math.floor(aim.idx / W) + 1} &middot; C{(aim.idx % W) + 1}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>{AIM_LABEL[aim.val]}</div>
              {aim.aiming && (
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: COLORS.accentSoft, lineHeight: 1.3 }}>slide to aim</div>
              )}
            </div>
          )}

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className={`et-tool${mode === 'fill' ? ' on' : ''}`} onClick={() => setMode('fill')} title="Fill squares (F)">
                <Square size={14} /> Fill
              </button>
              <button className={`et-tool${mode === 'mark' ? ' on' : ''}`} onClick={() => setMode('mark')} title="Mark a square blank (M)">
                <Ban size={14} /> Mark &times;
              </button>
              <button className="et-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Undo
              </button>
              {hintOk && !g.hintUsed && (
                <button className="et-tool" onClick={useHint} title="Fill one correct square (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(77,124,15,0.5)', color: '#3f6a0a' }}>
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
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: mode === 'mark' ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {mode === 'mark'
                ? (mobileUi
                    ? 'Marking: tap or drag, and it lands when you lift. Hold to aim.'
                    : 'Marking: tap or drag to pencil × on squares you have ruled out.')
                : (mobileUi
                    ? 'Filling: tap or drag, and it lands when you lift. Hold to aim.'
                    : 'Filling: tap a square, or drag across a run to fill it.')}
            </span>
            {identity && (filledRight > 0 || errors > 0) && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows the picture' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                The picture: <span style={{ color: ACC_INK }}>{PUZZLE.subject}</span>.
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition &mdash; a bigger {sizeLabel} grid.</div>
              )}
              {!PUZZLE.sunday && PUZZLE.w === 15 && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>Saturday steps up to a {sizeLabel} grid.</div>
              )}
              <EtchGallery puzzles={puzzles} rec={(stats && stats.rec) || {}} currentNum={PUZZLE.num} />
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Etch in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new picture drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/etch?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Etch &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/etch" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Etch &rarr;</a>
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
              name="Etch"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} \u00b7 ${errors} errors \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Etch all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Errors"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/etch?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Etch', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/etch?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="etch" name="Etch" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="etch" name="Etch" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="etch"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="etch" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Etch to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s picture, every day.</li>
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

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="etch"
          won={won}
          headline={won ? <>Picture solved!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {errors === 0 ? 'clean, no errors' : `${errors} error${errors === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the picture is shown above</>}
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
            <button className="et-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Etch</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Etch is a free daily nonogram from Mind Loft, the picture-logic puzzle also known as a picross or griddler. The numbers along each row and column tell you how many squares are filled in a row, in order, and your job is to work out which ones. Get them all and a picture appears.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board has exactly one solution and is reachable by pure line logic, so there is never a moment where you have to guess. Drag to fill a run, mark the squares you have ruled out with an ×, and watch each clue cross itself off as its line falls into place. Fill a square that isn&rsquo;t part of the picture and it turns red, so you always know where you stand.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new picture drops every day at midnight Eastern: 10&times;10 Monday to Friday, 15&times;15 on Saturday, and a 20&times;20 Edition on Sunday. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/hedge" style={{ color: INK, fontWeight: 800 }}>Hedge</a>, our loop puzzle, <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku, and <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
