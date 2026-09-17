'use client';

// Cipher — the daily cryptarithm (alphametic).
//
// One equation a day: WORD + WORD = WORD, where every letter stands for a
// different digit 0-9, leading letters are never zero, and there is exactly
// ONE solution (every banked equation is machine-verified unique, see
// scripts/verify-cipher.mjs). Tap a letter, tap a digit — or just type. The
// digit pad shows which letter owns each digit; shared digits flag red.
//
// The board carries the scratch work so the player doesn't have to (owner,
// 2026-08-04, "too much guess and check if you don't make hand notes"):
//   • a carry/borrow row above the columns, derived automatically as far as the
//     assignment allows and pencil-editable beyond that frontier;
//   • a free per-column ✓/✗ under the equation, so a wrong digit is caught at
//     the column that broke instead of by one all-or-nothing check;
//   • a digit pad that carries the elimination on the KEYS: a digit owned by
//     another letter dims and names its owner, 0 greys out under a leading
//     letter, and Notes strikes through anything crossed off for the selected
//     letter. The old per-letter candidate rack (a 0-9 strip under every
//     letter box) was REMOVED 2026-08-08: readers took those ten numerals for
//     the letter's value rather than a list of what was still open, which is
//     the opposite of the help it was meant to be. Everything it tracked now
//     lives on the pad keys, where there is only ever one number per box.
// Column marks are sound: a column is marked correct only when its carry-in is
// derived, and marked wrong only when no legal carry-in could satisfy it.
//
// THERE IS NO CHECK BUTTON, and there must not be one again (owner rule,
// 2026-08-10). The scored Check was removed because the board already
// auto-calculates: the carry row derives itself and every column marks itself,
// so pressing a button to confirm what the board had just shown you was a
// formality that could only cost a point. The day now ends the instant the
// assignment is right.
//
// The win test is NOT the column marks alone. It is every column landing AND
// all assigned digits distinct AND no leading letter at zero. Those last two
// matter because the pad DIMS a taken digit and GREYS a leading zero without
// blocking either, so a player can hold an assignment whose arithmetic works
// but which is not the puzzle's one legal solution. When that happens the
// board would otherwise sit on a full row of green marks doing nothing, so the
// blocking condition is named on screen instead (see `blocked`).
//
// Scoring: solve it and the day scores a flat 10 of 10. There are no misses to
// count, so the daily board ranks on time and the registry's Miss column is
// null for cipher. Revealing the solution still ends the day at 0.
//
// Same daily plumbing as Circa/Suds/Stet: banked equations gated by Eastern
// date on the server (app/cipher/page.js), per-puzzle localStorage saves,
// /cipher?p=N archive pinning, streaks + stats, and the shared /api/quiz/*
// board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Delete, Pencil } from 'lucide-react';
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
import { isLoft } from '@/lib/loft';
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
import useRailClearance from '../useRailClearance';
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
  accent: '#0f766e',        // Cipher identity — codebreaker teal
  accentSoft: '#d9f0ee',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_cipher_help_seen';
const STATS_KEY = 'sot_cipher_stats';
const TOTAL = 10;

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

// ─── The unique solution, derived on demand (for Reveal only) ───────────────
// Every banked equation is verified unique, so this returns THE solution.
// Both ops are linear: the same signed-coefficient DFS the verifier uses.
// `signs` gives the coefficient sign per word: addition is [1,1,...,-1],
// subtraction A - B - ... = C is [1,-1,...,-1].
function solveLinear(words, signs) {
  const letters = [...new Set(words.join(''))];
  const coef = Object.fromEntries(letters.map((c) => [c, 0]));
  for (let w = 0; w < words.length; w++) { let m = 1; for (let i = words[w].length - 1; i >= 0; i--) { coef[words[w][i]] += signs[w] * m; m *= 10; } }
  const firsts = new Set(words.map((w) => w[0]));
  const order = letters.slice().sort((a, b) => Math.abs(coef[b]) - Math.abs(coef[a]));
  const cs = order.map((c) => coef[c]);
  const fs = order.map((c) => firsts.has(c));
  const n = order.length;
  const used = new Array(10).fill(false);
  const digits = new Array(n).fill(null);
  let found = null;
  const dfs = (i, acc) => {
    if (found) return;
    if (i === n) { if (acc === 0) { found = {}; order.forEach((c, k) => { found[c] = digits[k]; }); } return; }
    for (let d = 0; d < 10; d++) {
      if (used[d] || (d === 0 && fs[i])) continue;
      used[d] = true; digits[i] = d;
      let rem = 0;
      for (let k = i + 1; k < n; k++) rem += Math.abs(cs[k]);
      const next = acc + cs[i] * d;
      if (Math.abs(next) <= rem * 9) dfs(i + 1, next);
      used[d] = false;
      if (found) return;
    }
  };
  dfs(0, 0);
  return found;
}
function solveCipher(op, lhs, rhs) {
  if (op === 'sub') return solveLinear([...lhs, rhs], [1, ...lhs.slice(1).map(() => -1), -1]);
  return solveLinear([...lhs, rhs], [...lhs.map(() => 1), -1]);
}

// ─── Column model: the scaffolding that replaces hand-written notes ────────
// Cryptarithms are solved column by column, right to left, carrying (addition)
// or borrowing (subtraction) into the next. buildColumns turns the displayed
// equation into that column view; deriveColumns walks it from the right as far
// as the current assignment allows.
function buildColumns(op, lhs, rhs) {
  const W = op === 'sub' ? lhs[0].length : rhs.length;
  const cols = [];
  for (let i = 0; i < W; i++) {
    const at = (w) => (i < w.length ? w[w.length - 1 - i] : null);
    cols.push({
      top: op === 'sub' ? [at(lhs[0])].filter(Boolean) : lhs.map(at).filter(Boolean),
      sub: op === 'sub' ? lhs.slice(1).map(at).filter(Boolean) : [],
      res: at(rhs),
    });
  }
  return cols;
}
// One column's arithmetic. The carry out of an addition column is bounded by
// the ADDEND COUNT, not by a constant: n addends of distinct digits plus a
// carry-in of at most n-1 can never carry more than n-1 out, so two addends
// carry 0-1, three carry 0-2, and the four-addend Sunday Edition carries 0-3
// (9+8+7+6+3 = 33). Anything that enumerates possible carries must use
// maxCarry() rather than a literal 2. The banked four-addend boards happen to
// top out at a real carry of 2, so nothing was ever mismarked in production,
// but a literal 2 would show a false ✗ on a correct column the first time a
// Sunday genuinely carried 3, and a free mark that lies is worse than no mark.
// Subtraction borrows 0-2 (two subtrahends max, the only shape ever shipped).
function maxCarry(op, nOperands) {
  if (op === 'sub') return 2;
  return Math.max(1, nOperands - 1);
}
function stepColumn(c, carryIn, op) {
  const val = (ch) => (ch === null ? 0 : c._a[ch]);
  if (op === 'sub') {
    const t = val(c.top[0]) - c.sub.reduce((a, ch) => a + val(ch), 0) - carryIn;
    const borrow = t < 0 ? Math.ceil(-t / 10) : 0;
    return { digit: t + 10 * borrow, carryOut: borrow };
  }
  const s = c.top.reduce((a, ch) => a + val(ch), 0) + carryIn;
  return { digit: s % 10, carryOut: Math.floor(s / 10) };
}
// Per column: { carryIn, ok }. carryIn is the derived carry/borrow, or null
// where the chain has not reached that column. ok is true only for a column
// whose carry-in is derived and whose arithmetic lands; false either there or,
// past the frontier, when NO legal carry-in (0..maxCarry) could satisfy the
// column. Never guesses, so a ✓ is always earned and a ✗ is always real.
function deriveColumns(cols, assign, op, mc = 2) {
  const out = cols.map(() => ({ carryIn: null, ok: null }));
  const test = (c, k) => {
    const { digit, carryOut } = stepColumn(c, k, op);
    return { hit: digit === (c.res === null ? 0 : assign[c.res]), carryOut };
  };
  let carry = 0, live = true;
  for (let i = 0; i < cols.length; i++) {
    const c = { ...cols[i], _a: assign };
    const last = i === cols.length - 1;
    const full = [...c.top, ...c.sub, c.res].every((ch) => ch === null || assign[ch] !== undefined);
    if (live) {
      out[i].carryIn = carry;
      if (!full) { live = false; continue; }
      const r = test(c, carry);
      out[i].ok = r.hit && (!last || r.carryOut === 0);
      if (!out[i].ok) { live = false; continue; }
      carry = r.carryOut;
    } else if (full) {
      let any = false;
      for (let k = 0; k <= mc && !any; k++) {
        const r = test(c, k);
        if (r.hit && (!last || r.carryOut === 0)) any = true;
      }
      if (!any) out[i].ok = false;
    }
  }
  return out;
}

// ─── Personal stats + streak (localStorage), Circa/Suds pattern ─────────────
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
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    assign: {},               // letter -> digit
    excl: {},                 // letter -> [digits crossed off in Notes mode]
    carry: {},                // column index -> penciled carry/borrow (scratch only)
    status: 'playing',        // playing | done | lost
    t0: null,
    tEnd: null,
  };
}

export default function CipherClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_cipher_${PUZZLE.num}`;
  const LETTERS = useMemo(() => [...new Set((PUZZLE.lhs.join('') + PUZZLE.rhs).split(''))].sort(), [PUZZLE]);
  const FIRSTS = useMemo(() => new Set([...PUZZLE.lhs, PUZZLE.rhs].map((w) => w[0])), [PUZZLE]);
  const maxLen = Math.max(...PUZZLE.lhs.map((w) => w.length), PUZZLE.rhs.length);
  const OP = PUZZLE.op || 'add';
  const opGlyph = OP === 'sub' ? '−' : '+';
  const opWord = OP === 'sub' ? 'subtraction' : 'addition';
  const carryWord = OP === 'sub' ? 'borrow' : 'carry';
  // The Sunday badge reads off the puzzle, never a hardcoded string: the
  // Sunday Edition is four addends from 2026-08-09 on, but the archive still
  // serves the earlier three-addend and three-term-subtraction Sundays, and a
  // badge that lies about the board in front of you is worse than none.
  const N_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][PUZZLE.lhs.length] || PUZZLE.lhs.length;
  const sundayDetail = OP === 'sub' ? `${N_WORD}-term subtraction` : `${N_WORD} addends`;
  const eqnText = `${PUZZLE.lhs.join(` ${opGlyph} `)} = ${PUZZLE.rhs}`;

  const COLS = useMemo(() => buildColumns(OP, PUZZLE.lhs, PUZZLE.rhs), [OP, PUZZLE]);

  const [g, setG] = useState(freshState);
  const [noteMode, setNoteMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [clearArmed, setClearArmed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact start card
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
  // The dock is really a response to a narrow COLUMN, not to a phone per se, so
  // it tracks the viewport as well as the device. A resized desktop window or a
  // split-screen tablet gets it too, and it follows a rotation live.
  const [narrowUi, setNarrowUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  // Latches the auto-win so the effect below fires exactly once per puzzle.
  const finishedRef = useRef(false);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('cipher');
  const STAGE = isStage('cipher', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('cipher');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('cipher'), '--stg-acc-lt': gameColorLight('cipher'), '--stg-onramp-lt': gameOnrampLight('cipher'), '--stg-acc-ink-lt': gameAccentInkLight('cipher') };
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
  const preStart = playing && !g.t0;   // not begun: show the start tile where the board goes
  const started = playing && !!g.t0;    // clock running: show the board
  const focusMode = playing && !showChrome;
  // Phone layout: once the clock runs, the letter picker, the digit pad and
  // Check move into a fixed dock at the bottom of the viewport, and the inline
  // rack + pad come out of the scroll flow. Everything else is unchanged.
  const dockUi = (mobileUi || narrowUi) && started;
  // The foot of the page has to clear the pinned dock, and the reservation has to
  // be a SPACER rather than padding on .cf-wrap: on a Loft page LoftCap zeroes that
  // padding with !important, so the rail was covering the foot of the board
  // outright (found alongside the Anon report, 2026-08-15). The height is read off
  // the rail; the fallback is only for the first paint.
  const rail = useRailClearance(dockUi && playing, 232);
  // Solving IS the win, so there is nothing left for a score to grade but
  // whether you got there. A reveal ends the day at 0, as before.
  const won = g.status === 'done';
  const score = g.status === 'done' ? TOTAL : 0;

  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch {}
    let mq = null, onMq = null;
    try {
      mq = window.matchMedia('(max-width: 620px)');
      setNarrowUi(mq.matches);
      onMq = (e) => setNarrowUi(e.matches);
      if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
    } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      try { if (mq && onMq) { if (mq.removeEventListener) mq.removeEventListener('change', onMq); else mq.removeListener(onMq); } } catch {}
    };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && saved.assign) setG({ ...freshState(), ...saved });
      }
      // The start tile shows in place of the board until the player begins (t0 set
      // on Start). First-timers see the full rules on the tile; a returning player
      // gets the compact start card with a "Show instructions" toggle.
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_cipher_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_cipher_day'); })();
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
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  // Reveal used to unlock after three failed checks. With no checks to fail,
  // the honest analogue is time on the clock: it appears once the puzzle has
  // genuinely been sat with, and nowTick makes it turn up on its own.
  const revealOk = playing && !!g.t0 && nowTick - g.t0 >= 180000;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'cipher', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'cipher', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'cipher', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'cipher', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'cipher', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // Live column read-out. Free, and recomputed on every assignment.
  const MAXC = maxCarry(OP, PUZZLE.lhs.length);
  const colInfo = useMemo(() => deriveColumns(COLS, g.assign, OP, MAXC), [COLS, g.assign, OP, MAXC]);
  const colsSolved = colInfo.every((c) => c.ok === true);
  const badCol = colInfo.some((c) => c.ok === false);
  // Why an otherwise-correct board is not a win yet. The columns only test the
  // arithmetic, so a repeated digit or a zero under a leading letter can light
  // every column green while breaking a rule of the puzzle. Naming it beats
  // leaving the player staring at a full row of ticks.
  const blocked = (() => {
    const seen = {};
    for (const l of LETTERS) {
      const d = g.assign[l];
      if (d === undefined) continue;
      if (seen[d] !== undefined) return `${seen[d]} and ${l} are both ${d}. Every letter needs its own digit.`;
      seen[d] = l;
    }
    for (const f of LETTERS) {
      if (FIRSTS.has(f) && g.assign[f] === 0) return `${f} starts a word, so it cannot be 0.`;
    }
    return null;
  })();

  // The dock's one-line status. It absorbs the three separate messages the
  // desktop card spreads out (the tap hint and the column warning), because on
  // a phone only one line of chrome is affordable and the most urgent of them
  // is always the one worth showing.
  const dockTone = badCol || blocked ? 'bad' : '';
  const dockSay = blocked ? blocked
    : badCol ? 'A column is marked ✗. Fix that column and the rest follow.'
    : noteMode ? (selected !== null ? `Notes on. Tap digits to cross them off ${selected}.` : 'Notes on. Pick a letter, then cross digits off it.')
    : selected === null ? 'Pick a letter, then tap its digit.'
    : g.assign[selected] !== undefined ? `${selected} = ${g.assign[selected]}. Tap another digit to change it.`
    : `Tap a digit for ${selected}.`;

  const REC_KEY = `sot_cipher_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (assigns a digit).
    // Merely opening the puzzle and dismissing the start gate does not log.
    const acted = Object.keys(g.assign).length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: 0, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed is always 0 now that nothing can be failed, so the daily
        // board's ties fall straight through to time. Kept in the payload
        // rather than dropped, because the shared result API expects it.
        // (It used to carry the failed-check count, which broke ties by the
        // cleaner solve.)
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen.
  // A no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // Tap to select. Tapping the letter that is already selected CLEARS its digit
  // when it has one (and keeps it selected, ready for a replacement), so fixing a
  // wrong digit takes a second tap on the cell instead of a trip to the erase
  // button. An empty selected cell still just deselects, as before.
  function tapLetter(ch) {
    if (!playing) return;
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    if (selected === ch && g.assign[ch] !== undefined) {
      setG((cur) => {
        const assign = { ...cur.assign };
        delete assign[ch];
        return { ...cur, assign };
      });
      return;
    }
    setSelected((s) => (s === ch ? null : ch));
  }
  // Assign a digit to a named letter, then jump to the next unassigned one.
  function assignTo(ch, d) {
    if (!playing) return;
    // A short tick on assignment, so a docked-pad tap confirms itself without
    // the player having to look back up at the equation.
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    setG((prev) => ({ ...prev, assign: { ...prev.assign, [ch]: d }, t0: prev.t0 || Date.now() }));
    const after = { ...g.assign, [ch]: d };
    const next = LETTERS.find((l) => after[l] === undefined);
    setSelected(next !== undefined ? next : null);
  }
  // Notes mode: cross a candidate off a letter instead of assigning it. Purely
  // the player's bookkeeping, so it never costs a point and never blocks a move.
  function toggleExcl(ch, d) {
    if (!playing) return;
    setG((prev) => {
      const cur = prev.excl[ch] || [];
      const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
      return { ...prev, excl: { ...prev.excl, [ch]: next }, t0: prev.t0 || Date.now() };
    });
  }
  function setDigit(d) {
    if (!playing) return;
    if (selected === null) { say('Pick a letter first, then a digit.'); return; }
    if (noteMode) { toggleExcl(selected, d); return; }
    assignTo(selected, d);
  }
  // Pencil a carry the board cannot derive yet: blank -> 0 -> 1 -> ... -> MAXC
  // -> blank. The top of the cycle follows the addend count, so the four-addend
  // Sunday can pencil a 3. Scratch only, exactly like writing it above the
  // column on paper: it is never used to judge a column, so it can never
  // mislead.
  function cycleCarry(i) {
    if (!playing) return;
    setG((prev) => {
      const cur = prev.carry[i];
      const carry = { ...prev.carry };
      if (cur === undefined) carry[i] = 0;
      else if (cur >= MAXC) delete carry[i];
      else carry[i] = cur + 1;
      return { ...prev, carry, t0: prev.t0 || Date.now() };
    });
  }
  function eraseSelected() {
    if (!playing || selected === null) return;
    setG((cur) => {
      const assign = { ...cur.assign };
      delete assign[selected];
      return { ...cur, assign };
    });
  }

  useEffect(() => {
    if (!playing) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) { if (selected !== null) { setDigit(+e.key); e.preventDefault(); } }
      else if (/^[a-zA-Z]$/.test(e.key) && LETTERS.includes(e.key.toUpperCase())) { tapLetter(e.key.toUpperCase()); e.preventDefault(); }
      else if (e.key === 'Backspace') { eraseSelected(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, selected, g.assign, LETTERS]);

  // The board finishes itself. `colsSolved` already proves the arithmetic
  // (every column full, its carry-in derived from a real chain, and the last
  // column carrying out zero), and `blocked` covers the two constraints the
  // columns cannot see. Together they are the puzzle's one legal solution,
  // because every banked equation is machine-verified unique.
  //
  // Latched on a ref rather than on status alone: the effect reads `g` from
  // the render in which the win became true, and re-entering it after setG
  // would post the result twice.
  const solvedNow = playing && colsSolved && !blocked;
  useEffect(() => {
    if (!solvedNow || finishedRef.current) return;
    finishedRef.current = true;
    const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
    setG(g2);
    setEndClosed(false);
    postResult(g2, TOTAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedNow]);

  function reveal() {
    if (!playing) return;
    const sol = solveCipher(PUZZLE.op || 'add', PUZZLE.lhs, PUZZLE.rhs);
    const g2 = { ...g, assign: sol || g.assign, status: 'lost', tEnd: Date.now(), t0: g.t0 || Date.now() };
    finishedRef.current = true;
    setG(g2);
    setEndClosed(false);
    postResult(g2, 0);
  }

  function clearAll() {
    if (!playing) return;
    if (Object.keys(g.assign).length === 0) { setClearArmed(false); return; }
    if (!clearArmed) { setClearArmed(true); setTimeout(() => setClearArmed(false), 3000); return; }
    setClearArmed(false);
    setG((cur) => ({ ...cur, assign: {}, excl: {}, carry: {} }));
    setSelected(null);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    finishedRef.current = false;
    setG(freshState()); setSelected(null); setEndClosed(false);
  }

  function shareText() {
    const solvedBit = g.status === 'done'
      ? `🔐 Cracked in ${elapsed}`
      : '🔒 The cipher beat me today';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    return `Cipher #${PUZZLE.num} · ${eqnText}\n${solvedBit}${streakBit}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/cipher${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Cipher #${PUZZLE.num} — the daily cryptarithm from Mind Loft.\n${shareUrl()}`
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

  // digit -> letters owning it
  const digitOwners = {};
  for (const [l, d] of Object.entries(g.assign)) { (digitOwners[d] = digitOwners[d] || []).push(l); }

  // The carry (addition) / borrow (subtraction) written above each column.
  // A derived value is shown solid and locked; beyond the derived frontier the
  // cell is an empty pencil slot the player can cycle through 0..MAXC.
  function renderCarryRow() {
    const cells = [];
    for (let k = 0; k < maxLen; k++) {
      const i = maxLen - 1 - k;
      const usable = i >= 1 && i < COLS.length;
      const derived = usable && colInfo[i] && colInfo[i].carryIn !== null ? colInfo[i].carryIn : null;
      const penciled = g.carry[i];
      const shown = derived !== null ? derived : (penciled !== undefined ? penciled : '');
      cells.push(
        <button
          key={`k${k}`}
          type="button"
          className={`cf-carry${derived !== null ? ' fixed' : ''}${usable && playing ? '' : ' off'}`}
          disabled={!usable || derived !== null || !playing}
          onClick={() => cycleCarry(i)}
          aria-label={usable ? `${carryWord} into column ${i + 1}${shown === '' ? ', not set' : `, ${shown}`}` : undefined}
        >
          {shown}
        </button>
      );
    }
    return <div className="cf-row cf-carrow" key="carry"><span className="cf-op" />{cells}</div>;
  }
  // One free mark per column: ✓ when the column is fully determined and lands,
  // ✗ when it cannot land under any legal carry. Costs nothing.
  function renderMarkRow() {
    const cells = [];
    for (let k = 0; k < maxLen; k++) {
      const i = maxLen - 1 - k;
      const ok = i < COLS.length && colInfo[i] ? colInfo[i].ok : null;
      cells.push(
        <span key={`m${k}`} className={`cf-mk${ok === true ? ' good' : ok === false ? ' bad' : ''}`} aria-hidden={ok === null}>
          {ok === true ? '✓' : ok === false ? '✗' : ''}
        </span>
      );
    }
    return <div className="cf-row cf-mkrow" key="marks"><span className="cf-op" />{cells}</div>;
  }
  // Digits still open to a letter: everything not taken by another letter, minus
  // 0 on a leading letter. No longer LISTED anywhere (the 0-9 candidate strip
  // came off every letter box on 2026-08-08); it now only powers the green
  // "one digit left" ring on the mobile letter strip, which says the same thing
  // without putting a second number inside a letter box.
  function candidatesFor(ch) {
    const taken = new Set(Object.entries(g.assign).filter(([l]) => l !== ch).map(([, d]) => d));
    const out = [];
    for (let d = 0; d < 10; d++) {
      if (taken.has(d)) continue;
      if (d === 0 && FIRSTS.has(ch)) continue;
      out.push(d);
    }
    return out;
  }

  // The ten digit keys, shared by the desktop pad and the mobile dock. These
  // are the ONLY place a digit is listed: each key carries who owns it
  // (dimmed, with the owner's letter), 0 under a leading letter (disabled), and
  // anything crossed off for the selected letter in Notes (struck through).
  // That is the whole of the bookkeeping the candidate rack used to spell out,
  // in boxes that hold a digit rather than boxes that hold a letter.
  function renderPadKeys() {
    const selEx = selected !== null ? (g.excl[selected] || []) : [];
    return Array.from({ length: 10 }, (_, d) => {
      const owners = digitOwners[d] || [];
      const takenByOther = owners.some((l) => l !== selected);
      const illegal = selected !== null && d === 0 && FIRSTS.has(selected);
      const xed = selected !== null && selEx.includes(d);
      return (
        <button
          key={d}
          type="button"
          disabled={illegal}
          className={`cf-pk${takenByOther ? ' taken' : ''}${xed ? ' xed' : ''}`}
          onClick={() => setDigit(d)}
          aria-label={`Digit ${d}${owners.length ? `, taken by ${owners.join(', ')}` : ''}${illegal ? `, not allowed on ${selected} because it starts a word` : ''}`}
        >
          {d}
          {owners.length ? <span className="who">{owners.join('')}</span> : null}
        </button>
      );
    });
  }

  function renderRow(word, op, key) {
    const cells = [];
    for (let i = 0; i < maxLen - word.length; i++) cells.push(<span key={`sp${i}`} className="cf-cell" style={{ visibility: 'hidden' }} />);
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const d = g.assign[ch];
      const conflict = d !== undefined && digitOwners[d] && digitOwners[d].length > 1;
      cells.push(
        <button
          key={`c${i}`}
          type="button"
          className={`cf-cell${selected === ch ? ' on' : ''}${conflict ? ' bad' : ''}`}
          onClick={() => tapLetter(ch)}
          aria-label={`Letter ${ch}${d !== undefined ? `, digit ${d}` : ', unassigned'}`}
        >
          <span className="cf-ch">{ch}</span>
          <span className="cf-dg">{d !== undefined ? d : '·'}</span>
        </button>
      );
    }
    return (
      <div key={key} className="cf-row">
        <span className="cf-op">{op || ''}</span>
        {cells}
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const strategyLine = (<>There is <b>exactly one solution</b>, and you can reach it by pure logic &mdash; start with the leftmost column of the answer, and let the carries do the talking. No guessing required.</>);
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={<>A <b>cryptarithm</b>: every letter is a different digit, 0&ndash;9, and the {opWord} must work out.</>}
      steps={[
        <>Letters that start a word are <b>never zero</b>.</>,
        <><b>Tap a letter, then tap a digit</b>, or just type. Tap a filled letter again to clear it. The pad shows which letter owns each digit, and two letters sharing one both flag red.</>,
        <>The board keeps the scratch work: a digit already taken <b>dims on the pad</b> and shows whose it is, 0 greys out under a leading letter, <b>Notes</b> crosses off any digit you have ruled out, and the <b>{carryWord} row</b> above the equation fills in as far as your digits allow, with the rest yours to pencil.</>,
        <>A <b>✓ or ✗</b> under each column shows exactly which column works, so a wrong digit turns up where it happened.</>,
        <>There is <b>no button to press</b>. Get every column to ✓ with a different digit for every letter, and the puzzle locks itself the moment it lands.</>,
      ]}
      knack={<>There is <b>exactly one solution</b> and pure logic reaches it: start with the leftmost column of the answer and let the carries do the talking. No guessing required.</>}
      footer="Solve it and the day scores a perfect 10. Nothing costs you a point, so the daily leaderboard is a straight race on the clock. Revealing the answer ends the day at 0."
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
      <DailyChrome slug="cipher" name="Cipher" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="cipher" quizId={PUZZLE.quizId}
          name="Cipher"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${Object.keys(g.assign).length}/${LETTERS.length}`, k: 'placed' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: score, k: 'score' },
            { v: `${Object.keys(g.assign).length}/${LETTERS.length}`, k: 'placed' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="cf-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.cf-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .cf-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .cf-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .cf-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .cf-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, #0c5f59) 86%, var(--stg-ink, var(--white)));}
          .cf-btn.primary.ready{box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 22%, transparent);}
          .cf-row{display:flex;justify-content:flex-end;align-items:center;gap:4px;margin:3px 0;}
          .cf-op{width:26px;font-size:22px;font-weight:800;color:${FADED};text-align:center;flex:0 0 auto;}
          .cf-cell{width:46px;height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:9px;cursor:pointer;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.14));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};padding:0;font-family:${SANS};}
          .cf-cell:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .cf-cell.on{border-color:var(--stg-acc, ${COLORS.accent});background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);box-shadow:0 0 0 2px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 25%, transparent);}
          .cf-cell .cf-ch{font-size:21px;font-weight:800;color:${INK};line-height:1.1;}
          .cf-cell .cf-dg{font-size:14px;font-weight:800;color:var(--stg-acc-ink, ${COLORS.accent});height:17px;line-height:1.2;font-variant-numeric:tabular-nums;}
          .cf-cell.bad .cf-dg{color:${COLORS.rust};}
          .cf-rule{border-top:3px solid ${COLORS.ink};margin:7px 0 6px;}
          .cf-carrow,.cf-mkrow{margin:0;}
          .cf-carry{width:46px;height:20px;flex:0 0 auto;border-radius:5px;border:1px dashed rgba(28,30,36,0.22);background:transparent;font-family:${MONO};font-size:12px;font-weight:500;color:${FADED};cursor:pointer;padding:0;line-height:1;}
          .cf-carry:hover:not(:disabled){background:var(--stg-surf2, ${COLORS.accentSoft});border-color:var(--stg-acc, ${COLORS.accent});}
          .cf-carry.fixed{border:1px solid transparent;color:var(--stg-acc-ink, ${COLORS.accent});font-weight:700;cursor:default;}
          .cf-carry.off{border-color:transparent;cursor:default;}
          .cf-mk{width:46px;height:18px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;line-height:1;color:transparent;}
          .cf-mk.good{color:${COLORS.green};}
          .cf-mk.bad{color:${COLORS.rust};}
          /* The per-letter candidate rack (.cf-rack/.cf-chip/.cf-cands/.cf-cd)
             was REMOVED 2026-08-08. It printed a 0-9 strip inside every letter
             box and players read those numerals as the letter's digit. The pad
             keys below carry the same information one number to a box. */
          .cf-pad{display:grid;grid-template-columns:repeat(5,54px);gap:7px;justify-content:center;}
          .cf-pk{position:relative;height:50px;border-radius:9px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.2));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-size:19px;font-weight:800;cursor:pointer;font-family:${SANS};color:${INK};}
          .cf-pk:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .cf-pk .who{position:absolute;top:2px;right:5px;font-size:9px;color:var(--stg-acc-ink, ${COLORS.accent});font-weight:800;letter-spacing:0.02em;}
          .cf-pk.foot{height:38px;font-size:11.5px;text-transform:uppercase;letter-spacing:0.06em;color:${FADED};display:inline-flex;align-items:center;justify-content:center;gap:6px;}
          .cf-pk.note{grid-column:span 2;}
          .cf-pk.foot:not(.note){grid-column:span 3;}
          .cf-pk.note.on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .cf-pad.notes .cf-pk:not(.foot){border-style:dashed;border-color:var(--stg-acc, ${COLORS.accent});}
          /* Pad key states. A digit already owned by another letter, a 0 under a
             leading letter, or a digit crossed off in Notes now READS as such on
             the key itself, which is what the letter rack used to be for. */
          .cf-pk.taken{background:${STAGE ? 'var(--stg-surf2)' : '#f3f4f6'};color:rgba(28,30,36,0.32);}
          .cf-pk.xed{color:rgba(28,30,36,0.28);text-decoration:line-through;}
          .cf-pk:disabled{opacity:0.32;cursor:default;}
          .cf-pk:disabled:hover{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .cf-wrap button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
          /* A long Sunday equation can be wider than a phone column; let the
             equation scroll sideways instead of bleeding out of the card. */
          .cf-eqn{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
          .cf-eqn::-webkit-scrollbar{display:none;}

          /* ── Mobile dock ────────────────────────────────────────────────────
             On a phone the equation card, the letter rack and the digit pad
             stacked to roughly 690px inside a ~650px viewport, so the equation
             and the pad were never on screen together and every single move
             cost a scroll down and a scroll back. The pad, the letter picker
             and Check now ride in a fixed bar at the bottom (the same pattern
             Garble uses) and the equation scrolls behind it. The rack is
             retired on mobile: its job (which digits are still open) is now
             carried by the pad key states plus the per-letter count. */
          /* --stg-raise, an OPAQUE step, NOT --stg-surf: surf is white at 4.5%,
             a raised cell when it sits ON the ground and a sheet of glass when
             it is position:fixed with the board scrolling underneath it. Same
             defect Garble's keyboard had, fixed in the same pass (2026-09-01). */
          .cf-dock{position:fixed;left:0;right:0;bottom:0;z-index:40;background:${STAGE ? 'var(--stg-raise,#0e131f)' : 'var(--white)'};border-top:1.5px solid rgba(20,22,28,0.14);box-shadow:0 -5px 20px rgba(20,22,28,0.13);padding:7px 10px calc(7px + env(safe-area-inset-bottom));}
          .cf-dock.notes{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);border-top:2px solid var(--stg-acc, ${COLORS.accent});}
          .cf-dk{max-width:470px;margin:0 auto;display:flex;flex-direction:column;gap:6px;}
          .cf-say{font-size:11.5px;font-weight:800;line-height:1.35;text-align:center;color:${FADED};}
          .cf-say.bad{color:${COLORS.rust};}
          .cf-say.good{color:${COLORS.green};}
          .cf-strip{display:grid;gap:3px;}
          .cf-sc{height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:8px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};padding:0;cursor:pointer;font-family:${SANS};min-width:0;}
          .cf-sc .l{font-size:14px;font-weight:800;color:${INK};line-height:1;}
          .cf-sc .d{font-family:${MONO};font-size:14px;font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});line-height:1;font-variant-numeric:tabular-nums;}
          /* An unassigned letter shows a DOT, never a number. The count of
             digits still open used to render here as a pill and still read as
             the letter's value to enough people that the whole candidate
             system came out; the green .lone ring below is the one piece of
             that signal worth keeping, and it is not a numeral. */
          .cf-sc .d.dim{color:rgba(28,30,36,0.30);}
          .cf-sc.on{border-color:var(--stg-acc, ${COLORS.accent});background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);box-shadow:0 0 0 2px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 28%, transparent);}
          .cf-dock.notes .cf-sc{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .cf-dock.notes .cf-sc.on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});}
          .cf-dock.notes .cf-sc.on .l,.cf-dock.notes .cf-sc.on .d{color:var(--white);}
          .cf-dock.notes .cf-sc.on .d.dim{color:rgba(255,255,255,0.75);}
          .cf-sc.lone{border-color:${COLORS.green};box-shadow:inset 0 0 0 1px ${COLORS.green};}
          .cf-sc.lone .d.dim{color:${COLORS.green};}
          .cf-dock .cf-pad{grid-template-columns:repeat(5,1fr);gap:6px;width:100%;}
          .cf-dock .cf-pk{height:46px;font-size:20px;}
          .cf-dock .cf-pk .who{font-size:11px;top:3px;right:6px;}
          .cf-drow{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:6px;}
          .cf-db{height:44px;border-radius:9px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.2));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};font-family:${SANS};font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 6px;}
          .cf-db.on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .cf-db.go{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));font-size:13px;}
          .cf-db.go.ready{box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 28%, transparent);}
          .cf-db.warn{border-color:${COLORS.rust};color:${COLORS.rust};}
          @media(max-width:560px){.cf-cell{width:40px;height:52px;}.cf-cell .cf-ch{font-size:18px;}.cf-pad{grid-template-columns:repeat(5,1fr);width:100%;}.cf-carry,.cf-mk{width:40px;}.cf-carry{height:26px;}}
        ` }} />

        <div style={{ maxWidth: 640, margin: '0 auto' }}>


        {/* masthead: pressed CIPHER tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="cipher"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {sundayDetail}</span>}
          blocks={'CIPHER'.split('').map((ch, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

        {/* start tile — sits where the board goes; the equation stays sealed
            (not rendered) until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', maxWidth: 472, margin: '0 auto 12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Cipher is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Assign a different digit to every letter so the {opWord} works out. The equation stays sealed until you begin.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="cf-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the equation */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '18px 20px 16px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12, maxWidth: 472, marginLeft: 'auto', marginRight: 'auto' }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.14)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>every letter is a digit · {opWord}</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>placed <b style={{ color: INK, fontWeight: 500 }}>{Object.keys(g.assign).length}/{LETTERS.length}</b></span>
          </div>
          )}
          {LOFT && <div className={STAGE ? undefined : 'loft-prompt'}>{`every letter is a digit · ${opWord}`}</div>}
          <div className="cf-eqn" style={{ maxWidth: (maxLen + 1) * 50, margin: '0 auto' }}>
            {renderCarryRow()}
            {PUZZLE.lhs.map((w, i) => renderRow(w, (OP === 'sub' ? i > 0 : i === PUZZLE.lhs.length - 1) ? opGlyph : '', `l${i}`))}
            <div className="cf-rule" />
            {renderRow(PUZZLE.rhs, '', 'r')}
            {renderMarkRow()}
          </div>
          {playing && (
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: FADED, textAlign: 'center', marginTop: 2 }}>
              {carryWord}s on top · column marks below · it locks itself when it lands
            </div>
          )}
          {/* These three status lines are folded into the dock's single status
              line on a phone, so they only render in the desktop card. */}
          <div style={{ display: dockUi ? 'none' : 'block', fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, textAlign: 'center', margin: '10px 0 8px', minHeight: 16 }}>
            {playing
              ? (noteMode
                  ? (selected !== null
                      ? <>Notes on: crossing candidates off <b style={{ color: ACC_INK }}>{selected}</b></>
                      : 'Notes on: pick a letter, then tap digits to cross them off.')
                  : (selected !== null
                      ? <>Assigning a digit to <b style={{ color: ACC_INK }}>{selected}</b>{g.assign[selected] !== undefined ? <> · tap {selected} again to clear</> : null}</>
                      : 'Tap a letter, then a digit — or just type.'))
              : null}
          </div>

          {playing && !dockUi && (
            <div className={`cf-pad${noteMode ? ' notes' : ''}`}>
              {renderPadKeys()}
              <button type="button" className={`cf-pk foot note${noteMode ? ' on' : ''}`} onClick={() => setNoteMode((v) => !v)} aria-pressed={noteMode}><Pencil size={13} /> notes {noteMode ? 'on' : 'off'}</button>
              <button type="button" className="cf-pk foot" onClick={eraseSelected}><Delete size={13} /> erase letter</button>
            </div>
          )}
          {playing && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              {/* No Check button by design: the board ends the day itself. */}
              <button type="button" className="cf-btn" onClick={clearAll} style={clearArmed ? { borderColor: COLORS.rust, color: `var(--stg-ink, ${COLORS.rust})` } : undefined}>{clearArmed ? 'Clear all, tap again' : 'Clear'}</button>
              {revealOk && (
                <button type="button" className="cf-btn" style={{ borderColor: '#c3c8cf', color: FADED }} onClick={reveal}>Reveal (ends the day)</button>
              )}
            </div>
          )}
          {playing && !dockUi && (badCol || blocked) && (
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, textAlign: 'center', marginTop: 8, color: `var(--stg-ink, ${COLORS.rust})` }}>
              {blocked || `A column is marked ✗. Fix that column and the rest follow.`}
            </div>
          )}
        </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '0 auto 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : g.status === 'done' ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {g.status === 'done'
                      ? `Cracked. ${eqnText}`
                      : 'The cipher kept its secret today.'}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Cipher in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new equation drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/cipher?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Cipher &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/cipher" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Cipher &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
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
              name="Cipher"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${score} \u00b7 ${`${Object.keys(g.assign).length}/${LETTERS.length}`} placed \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Cipher all time` : 'all-time rank' }
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
                  href: `/cipher?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Cipher', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/cipher?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="cipher" name="Cipher" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="cipher" name="Cipher" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="cipher"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="cipher" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Cipher to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s equation, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s equation, every day.
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

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
        {rail.height > 0 && <div aria-hidden style={{ height: rail.height }} />}
      </div>

      {/* Mobile dock. Everything a move needs, which letter and which digit,
          pinned to the bottom of the viewport, so the
          equation above it is read rather than scrolled to and from. The letter
          strip replaces the 194px rack: an unassigned letter shows how many
          digits are still open to it (green ring when only one is left, which
          is the moment the rack's "lone" highlight used to flag), and the pad
          keys carry the rest of that bookkeeping themselves. */}
      {dockUi && playing && (
        <div className={`cf-dock${noteMode ? ' notes' : ''}`} ref={rail.ref}>
          <div className="cf-dk">
            <div className={`cf-say${dockTone === 'bad' ? ' bad' : dockTone === 'good' ? ' good' : ''}`}>{dockSay}</div>
            <div className="cf-strip" style={{ gridTemplateColumns: `repeat(${LETTERS.length}, minmax(0,1fr))` }}>
              {LETTERS.map((ch) => {
                const d = g.assign[ch];
                const ex = g.excl[ch] || [];
                const n = candidatesFor(ch).filter((x) => !ex.includes(x)).length;
                const lone = d === undefined && n === 1;
                // The count itself is NOT printed: a numeral inside a letter box
                // reads as that letter's digit. The green ring below carries the
                // one moment it mattered (a single digit left).
                return (
                  <button
                    key={ch}
                    type="button"
                    className={`cf-sc${selected === ch ? ' on' : ''}${lone ? ' lone' : ''}`}
                    onClick={() => tapLetter(ch)}
                    aria-label={`Letter ${ch}${d !== undefined ? `, digit ${d}` : `, unassigned, ${n} digit${n === 1 ? '' : 's'} still open`}`}
                  >
                    <span className="l">{ch}</span>
                    {d !== undefined ? <span className="d">{d}</span> : <span className="d dim" aria-hidden="true">&middot;</span>}
                  </button>
                );
              })}
            </div>
            <div className="cf-pad">{renderPadKeys()}</div>
            <div className="cf-drow">
              <button type="button" className={`cf-db${noteMode ? ' on' : ''}`} onClick={() => setNoteMode((v) => !v)} aria-pressed={noteMode}><Pencil size={13} /> Notes</button>
              <button type="button" className="cf-db" onClick={eraseSelected}><Delete size={13} /> Erase</button>
            </div>
          </div>
        </div>
      )}

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="cipher"
          won={won}
          completed={g.status === 'done'}
          headline={g.status === 'done' ? <>You cracked the cipher</> : <>The cipher held</>}
          subline={<>Cipher #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: dockUi ? 'calc(248px + env(safe-area-inset-bottom))' : 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
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
            <button className="cf-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Cipher — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Cipher</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Cipher is a free daily cryptarithm puzzle from Mind Loft. Each day serves one alphametic equation, the classic puzzle form where SEND + MORE = MONEY and every letter hides a digit. Assign a different digit to each letter so the arithmetic works, and know that the puzzle is machine-verified to have exactly one solution: if your logic is sound, you never have to guess.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The craft is in the columns, and Cipher hands you the tools instead of asking you to reach for paper. The digit pad dims a digit the moment another letter takes it and tells you whose it is, the carry row above the equation fills itself in as far as your digits reach, and each column carries its own &#10003; or &#10007; the moment it is decided. The leftmost letter of the answer is usually forced by a carry; from there each column narrows the field until the whole equation clicks open. There is no Check button and nothing to submit: because the board works the columns out with you, it simply ends the day the moment your assignment is right. A solve is a perfect 10, so the daily leaderboard is a straight race on the clock.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new equation drops every day at midnight Eastern, and the week ramps: two addends Monday through Wednesday, three Thursday through Saturday, and four in the Sunday Edition. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku, <a href="/tally" style={{ color: INK, fontWeight: 800 }}>Tally</a>, our number-balancing puzzle, and <a href="/alibi" style={{ color: INK, fontWeight: 800 }}>Alibi</a>, our whodunit logic puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
