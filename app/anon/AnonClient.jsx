'use client';

// Anon — the daily clueless acrostic, and the 50th game on the roster.
//
// A passage sits in the grid, one box per letter, and every box ALSO belongs to
// one answer in the bank below. So a letter typed in either half appears in the
// other at the same instant: the two halves are the same letters seen twice.
// There are no clues. What you get is a length and, on some answers, a category.
//
// THE BANK IS IN TWO PARTS, and that is the whole design.
//   spine  the first `spine` answers. Their FIRST letters spell the author, which
//          is the payoff and the reason the game is called Anon: the passage
//          arrives unattributed and you end by naming who wrote it.
//   free   the rest. No initial to obey, which is what leaves room for the
//          closed categories, and closed categories are the way into the board.
//
// WHY SOME ANSWERS HAVE NO CATEGORY. A category is only worth printing when a
// solver can enumerate it: every category here admits at most four words at that
// length, so 'planet, 5' is earth or venus and nothing else. Anything looser
// ('verb', 'noun') is noise dressed up as help, so those answers show no category
// at all rather than a fake one. Roughly half the board is open by design.
//
// WHY THERE IS NO CHECK BUTTON (owner, 2026-08-07). A wrong answer stops the
// passage reading as English, so the puzzle already tells you. A confirm button
// would make guess-and-check optimal on exactly the closed categories that
// provide the cold start: 'planet, 5' is a coin flip you could just flip. The
// game's own feedback is the feedback.
//
// Same daily plumbing as the rest of the roster: banked days gated by Eastern
// date on the server, per-day localStorage saves, /anon?p=N archive pinning,
// streaks and stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Flag, Delete } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import useIsMobile from '../quiz/[id]/useIsMobile';
import useRailClearance from '../useRailClearance';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import DailyMasthead from '../DailyMasthead';
import { nextCell, passageTokens, wordIndex } from './typing';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColorLight, gameColor, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import DailyRules from '../DailyRules';
import { isMobileDevice } from '@/lib/is-mobile';
import { T } from '@/lib/theme';

const COLORS = {
  ink: T.ink,
  faded: T.muted,
  accent: '#8c2f39',        // Anon identity — book cloth
  accentSoft: '#fdf2f3',
  accentDeep: '#6d2029',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_anon_help_seen';
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

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
function getAnonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('sot_quiz_anon', a); }
    return a;
  } catch (e) { return ''; }
}

// WHERE THE SELECTOR OPENS. On the first answer that CARRIES a category, never
// on spine #1. The rules tell the player to start with the sharpest category
// rather than the passage, and spine #1 is as often as not an open answer with
// nothing at all to act on, so opening there contradicted the instruction on the
// very first keystroke. Row order is untouched: the spine's positions map to the
// author's letters in order and cannot move (owner, 2026-08-09).
// A returning player gets the first categorized answer still holding an empty
// box, since the cursor itself is not saved.
function openingCell(A, fill) {
  const hasGap = (a) => a.c.some((n) => !(fill && fill[n]));
  const clued = A.filter((a) => a.cat);
  return (clued.find(hasGap) || clued[0] || A[0]).c[0];
}

const freshState = () => ({ v: 1, fill: null, t0: null, tEnd: null, status: 'playing' });
const EMPTY_BOARD = { plays: 0, best: null, leaderboard: [] };

// ── stats (same shape every daily uses) ──────────────────────────────────────
const STATS_KEY = 'sot_anon_stats';
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); return s && s.byNum ? s : { byNum: {} }; }
  catch (e) { return { byNum: {} }; }
}
function recordStat(num, rec) {
  const s = getStats();
  const s2 = { ...s, byNum: { ...s.byNum, [num]: rec } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(stats, todayNum) {
  if (!stats) return { played: 0, wins: 0, cur: 0, max: 0 };
  const byNum = stats.byNum || {};
  const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const wins = nums.filter((n) => byNum[n].won).length;
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) {
    const r = byNum[n];
    if (!r) { if (n === todayNum) continue; break; }
    if (!r.won) break;
    cur++;
  }
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    if (!byNum[n].won) { run = 0; prev = n; continue; }
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  return { played, wins, cur, max: Math.max(max, cur) };
}

export default function AnonClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const A = PUZZLE.a;
  const TOTAL = A.length;
  const STORE_KEY = `sot_anon_${PUZZLE.num}`;
  // Two different questions, and conflating them is what broke tablets.
  // `narrow` is about WIDTH: under 760px the passage and the bank cannot both be
  // on screen, so they split into tabs. `touchInput` is about the DEVICE: this
  // game reads letters off a window keydown and has no <input> anywhere, so a
  // machine with no physical keys can only type through our own keys. A tablet
  // answers no to the first and YES to the second, which is why one arrived on a
  // desktop layout with no way to type at all (reported 2026-08-08).
  const narrow = useIsMobile();
  const [touchInput, setTouchInput] = useState(false);
  useEffect(() => {
    try {
      setTouchInput(isMobileDevice()
        || window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    } catch (e) {}
  }, []);

  // The passage's letter cells, and the map from a cell to the answer that owns
  // it. Both halves render from this one map, which is what keeps them in step.
  const { sol, owner, oidx, N, tokens } = useMemo(() => {
    const sol = [], owner = [], oidx = [];
    A.forEach((a, ai) => a.c.forEach((n, k) => { sol[n] = a.w[k]; owner[n] = ai; oidx[n] = k; }));
    // tokens: the passage split into words, each a list of {cell} or {punc}
    return { sol, owner, oidx, N: sol.length, tokens: passageTokens(PUZZLE.q) };
  }, [PUZZLE, A]);

  // Which word each cell sits in, off the SAME tokens the passage renders from.
  // Only the dock's stepper reads it, and only while the passage is the half
  // being worked. See the head of ./typing.js.
  const words = useMemo(() => wordIndex(tokens), [tokens]);

  const [g, setG] = useState(freshState);
  const [cur, setCur] = useState(() => openingCell(A, null));
  // OPENS ON THE BANK, not the passage. A first-time player who lands on 124
  // empty boxes has nothing to act on and no idea what the game wants; the bank
  // is where the categories are, so it is the half that explains itself and the
  // half the solve actually starts from. The rules copy says the same thing:
  // start with the sharpest category, not the passage.
  const [view, setView] = useState('b');          // narrow only: passage or bank
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);
  const cellRefs = useRef({});
  // WHICH HALF the player is working in. Every letter has a cell in BOTH the
  // passage and the bank, and the ref map was keyed by cell index alone, so the
  // two copies overwrote each other and only the one that mounted last (the
  // passage) was ever reachable. focusCell therefore scrolled to the PASSAGE
  // copy on every keystroke, which on desktop threw the page down to the
  // acrostic the moment a bank row was typed in and left the row being filled
  // off screen above it (owner, 2026-08-24). Refs are keyed by half now, and
  // this records the half last clicked so the keyboard keeps scrolling the half
  // the player is actually reading. On a narrow screen only one half is
  // rendered at a time, so `view` decides there.
  const halfRef = useRef('b');

  const fill = g.fill || new Array(N).fill('');
  const playing = g.status === 'playing';
  const LOFT = isLoft('anon');
  // The register comes from the shared store, not from a private effect, so
  // the switch in the cap repaints this root without a prop between them.
  // Still resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE = isStage('anon', searchParams);
  // THE ACCENT AS A VARIABLE. It is only ever used as a CSS colour, so
  // every call site below themes itself and none of them had to be found.
  // The literals are published on the root element instead.
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('anon');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('anon'), '--stg-acc-lt': gameColorLight('anon'), '--stg-onramp-lt': gameOnrampLight('anon'), '--stg-acc-ink-lt': gameAccentInkLight('anon') };
  const Cap = STAGE ? StageChrome : LoftCap;
  // Anon is a Word game, so on the stage its book cloth red becomes the
  // category step. ON_ACC is the ink that rides on it, which is dark here
  // and white on the Loft page, and the two must never be crossed.
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  // THE ACCENT AS TEXT. On the light register the accent has two values,
  // because three of the ten category steps are pastels chosen to be a FILL
  // carrying dark ink, and a pastel cannot also be ink on paper. --stg-acc
  // still paints; this writes. Same value on the dark register.
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'color-mix(in srgb, var(--stg-acc) 16%, transparent)' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const panelStyle = { background: SURF, border: '1px solid ' + (STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.12)'), borderRadius: 12 };
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  // Focus mode: while the puzzle is live the leaderboard / share / other-games
  // block is folded away behind one button, the same arrangement every other
  // daily uses (owner rule, 2026-08-08). setShowChrome unfolds it for good.
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  // The pinned keys, and the page padding that keeps content out from under them.
  const railUp = touchInput && playing && !!g.t0;
  // The foot of the page has to clear the pinned rail, and the reservation has to
  // be a SPACER rather than padding on .an-wrap: on a Loft page LoftCap zeroes
  // that padding with !important, so the rail was covering the last stretch of the
  // passage and the final row of the bank outright (owner, 2026-08-15). The height
  // is read off the rail; the fallbacks are only for the first paint.
  const rail = useRailClearance(railUp, narrow ? 250 : 168);
  const preStart = playing && !g.t0;
  const curAnswer = owner[cur];

  const solved = useMemo(
    () => A.map((a) => a.c.every((n, k) => fill[n] === a.w[k])),
    [A, fill]
  );
  const nSolved = solved.filter(Boolean).length;
  const filledCount = fill.filter(Boolean).length;
  const won = nSolved === TOTAL;

  // The spine reads out as you get first letters. This is the payoff, so it is
  // always on screen rather than tucked behind the bank.
  const spineLetters = useMemo(
    () => A.slice(0, PUZZLE.spine).map((a) => fill[a.c[0]] || ''),
    [A, PUZZLE.spine, fill]
  );

  const breakAfter = useMemo(() => {
    const s2 = new Set();
    let last = -1;
    for (const tk of tokens) {
      for (const t of tk) if (t.n !== undefined) last = t.n;
      if (last >= 0) s2.add(last);
    }
    return s2;
  }, [tokens]);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.fill) && saved.fill.length === N) {
          setG({ ...freshState(), ...saved });
          setCur(openingCell(A, saved.fill));
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
        if (done || g.t0) localStorage.setItem('sot_anon_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_anon_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live clock, ticked from state rather than read during render.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!playing || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [playing, g.t0, g.tEnd]);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  // ---- metrics + leaderboard ----
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
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

  const REC_KEY = `sot_anon_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!playing || !g.t0 || !filledCount) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - g.t0) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: nSolved, total: TOTAL, correct: nSolved, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  const postResult = useCallback((g2, count) => {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: count, t: TOTAL, g: 0, won: count === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // guessesUsed is always 0: Anon has no checks and no hints, so two
        // players who both finish are separated by the clock alone.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: count, total: TOTAL, correct: count, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }, [abandon, PUZZLE, TOTAL, identity]);

  function start() {
    setG((c) => (c.t0 ? c : { ...c, t0: Date.now(), fill: c.fill || new Array(N).fill('') }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setGateRules(false);
  }

  // ---- input ----
  // THE HALF THE PLAYER IS WORKING IN, and it answers two questions now: which
  // copy of a cell to scroll to, and which way the cursor advances. On a narrow
  // screen only one half is rendered, so the Passage/Bank tab decides; on a
  // wide one both are on screen and the half last clicked does. Read through a
  // function and never captured, because halfRef is a ref: a callback closing
  // over its value would answer with the half of some earlier render.
  const workingHalf = useCallback(() => (narrow ? view : halfRef.current), [narrow, view]);

  // The cell for index n in the half the player is working in. A half that is
  // not rendered leaves a DETACHED node behind in the map (the ref callback only
  // writes, it never clears), so every candidate is checked for being connected
  // before it is used, or the fallback silently scrolls nothing.
  const cellEl = useCallback((n) => {
    const h = workingHalf();
    const pick = (k) => { const e = cellRefs.current[k]; return e && e.isConnected !== false ? e : null; };
    return pick(`${h}${n}`) || pick(`b${n}`) || pick(`q${n}`);
  }, [workingHalf]);

  const focusCell = useCallback((n, from) => {
    setCur(n);
    if (from) halfRef.current = from;
    const el = cellEl(n);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [cellEl]);

  // In the BANK the cursor walks the answer; in the PASSAGE it walks the
  // passage, so a word you can read can be typed straight through instead of
  // costing a click per letter. The rule itself lives in ./typing.js, where a
  // checker can run it against a real board.
  const move = useCallback(
    (n, d) => nextCell(workingHalf(), n, d, { A, owner, oidx, N }),
    [A, owner, oidx, N, workingHalf],
  );

  // The two steppers. `stepAnswer` is a BANK action wherever it is pressed —
  // Tab, and the dock arrows while the bank is showing — so it says so with the
  // `from` argument: on a wide screen that points the scroll at the bank row it
  // just moved to, rather than at whichever half was clicked last.
  const stepAnswer = useCallback((d) => {
    focusCell(A[(owner[cur] + TOTAL + d) % TOTAL].c[0], 'b');
  }, [A, owner, cur, TOTAL, focusCell]);

  const stepWord = useCallback((d) => {
    const W = words.first.length;
    if (!W) return;
    const wi = words.of[cur];
    focusCell(words.first[((wi === undefined ? 0 : wi) + W + d) % W], 'q');
  }, [words, cur, focusCell]);

  // "Next" means the next thing ON SCREEN: the next answer while the bank is
  // the half being worked, the next word of the passage while the passage is.
  const stepNext = useCallback((d) => {
    if (workingHalf() === 'q') stepWord(d); else stepAnswer(d);
  }, [workingHalf, stepWord, stepAnswer]);

  const type = useCallback((ch) => {
    if (!playing || !g.t0) return;
    setG((c) => {
      const f = (c.fill || new Array(N).fill('')).slice();
      f[cur] = ch;
      const next = { ...c, fill: f };
      const done = A.every((a) => a.c.every((n, k) => f[n] === a.w[k]));
      if (done) {
        next.status = 'done';
        next.tEnd = Date.now();
        postResult(next, TOTAL);
      }
      return next;
    });
    focusCell(move(cur, 1));
  }, [playing, g.t0, cur, N, A, TOTAL, postResult, focusCell, move]);

  // Delete repeats while held, the way the OS keyboard does. The repeat reads
  // the CURRENT backspace through a ref: the callback below is rebuilt whenever
  // the cursor moves, so a timer closing over it would keep deleting the cell
  // the player started on.
  const bsRef = useRef(null);
  const delTimer = useRef(null);
  const stopDelete = useCallback(() => { clearTimeout(delTimer.current); delTimer.current = null; }, []);
  const holdDelete = useCallback(() => {
    bsRef.current && bsRef.current();
    clearTimeout(delTimer.current);
    const again = () => { bsRef.current && bsRef.current(); delTimer.current = setTimeout(again, 85); };
    delTimer.current = setTimeout(again, 420);
  }, []);
  useEffect(() => stopDelete, [stopDelete]);

  const backspace = useCallback(() => {
    if (!playing || !g.t0) return;
    setG((c) => {
      const f = (c.fill || new Array(N).fill('')).slice();
      if (f[cur]) { f[cur] = ''; return { ...c, fill: f }; }
      return c;
    });
    if (!fill[cur]) focusCell(move(cur, -1));
  }, [playing, g.t0, cur, N, fill, focusCell, move]);
  useEffect(() => { bsRef.current = backspace; }, [backspace]);

  useEffect(() => {
    const onKey = (e) => {
      if (!playing || !g.t0 || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) { type(e.key.toUpperCase()); e.preventDefault(); }
      else if (e.key === 'Backspace') { backspace(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { focusCell(move(cur, 1)); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { focusCell(move(cur, -1)); e.preventDefault(); }
      else if (e.key === 'Tab') { stepAnswer(e.shiftKey ? -1 : 1); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, g.t0, cur, type, backspace, focusCell, move, stepAnswer]);

  function giveUp() {
    setG((c) => {
      const next = { ...c, fill: sol.slice(), status: 'gaveup', tEnd: Date.now() };
      postResult(next, nSolved);
      return next;
    });
  }
  function resetGame() {
    setG({ ...freshState(), fill: new Array(N).fill('') });
    setEndClosed(false);
    scrolledIn.current = false;
    setCur(openingCell(A, null));
    try { localStorage.removeItem(REC_KEY); } catch (e) {}
  }
  function copyShare() {
    const line = won
      ? `Anon #${PUZZLE.num} — the clueless acrostic\nNamed it in ${elapsed}`
      : `Anon #${PUZZLE.num} — the clueless acrostic\n${nSolved}/${TOTAL} answers`;
    try {
      navigator.clipboard.writeText(`${line}\nmindloftdaily.com/anon`);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch (e) {}
  }

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'anon', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'anon', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'anon', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'anon', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'anon', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // SPLIT is a third width question, after `narrow` and `touchInput`. Stacked,
  // the bank fills the screen on its own and the passage sits a scroll below it,
  // so typing in a bank row pushes the thing it changes out of sight (owner,
  // 2026-08-31). Side by side, both halves are on screen for the whole solve.
  // Under 1000px there is not enough width for two readable columns, so the
  // board stays stacked there and nothing about the phone layout moves.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const set = () => setWide(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);
  const split = wide && !narrow;

  const splitRef = useRef(null);
  const qPaneRef = useRef(null);

  // Cell size fitted to the space the cells actually have. Off the split that is
  // the viewport, like Strata's tiles: a 124-letter passage has to lay out on a
  // phone without becoming unreadable or overflowing. ON the split it is the
  // PANE, because the passage now has half the width it had and sizing its
  // letters against window.innerWidth overflows the column it is in.
  const [cw, setCw] = useState(26);
  useEffect(() => {
    const fit = () => {
      const pane = split && qPaneRef.current ? qPaneRef.current.clientWidth - 32 : 0;
      const avail = pane > 0 ? Math.min(pane, 720) : Math.min(window.innerWidth - 30, 720);
      setCw(Math.max(21, Math.min(27, Math.floor(avail / 14) - 3)));
    };
    fit();
    window.addEventListener('resize', fit);
    let ro = null;
    if (split && qPaneRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(fit);
      ro.observe(qPaneRef.current);
    }
    return () => { window.removeEventListener('resize', fit); if (ro) ro.disconnect(); };
  }, [split]);

  // THE PANE HEIGHT IS MEASURED, never a constant, for the same reason the home
  // console measures --dh-fit and Crux measures --cx-room: everything above the
  // panes (the cap, the stat line, the spine strip, the rail) changes height
  // with the board and the register, so a hardcoded budget is wrong the day it
  // is written. It cannot feed back, because shrinking a pane does not move the
  // top of the split, and it is read in DOCUMENT coordinates so a scrolled page
  // does not change the answer. Floored at 320 so a short screen degrades to
  // page scrolling rather than to a pane too small to use.
  const [paneH, setPaneH] = useState(0);
  useEffect(() => {
    if (!split) { setPaneH(0); return undefined; }
    const fit = () => {
      const el = splitRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // A FINISHED board sits behind the curtain at display:none, so its rect is
      // all zeros. Measuring then reads the top of the page and hands every pane
      // the whole viewport, which is how the revealed board ran 240px past the
      // fold. An unlaid-out board is not a measurement, so take nothing from it.
      if (!r.width && !r.height) return;
      const top = r.top + window.scrollY;
      const next = Math.max(320, Math.round(window.innerHeight - top - rail.height - 72));
      // 2px deadband. The observer below watches the split, whose height the
      // panes decide, so an exact-equal write is what keeps that from cycling.
      setPaneH((prev) => (Math.abs(prev - next) > 2 ? next : prev));
    };
    fit();
    const id = setTimeout(fit, 250);
    window.addEventListener('resize', fit);
    // Revealing the board from the curtain changes its size without firing a
    // resize, so the element itself has to be watched.
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && splitRef.current) {
      ro = new ResizeObserver(fit);
      ro.observe(splitRef.current);
    }
    return () => { clearTimeout(id); window.removeEventListener('resize', fit); if (ro) ro.disconnect(); };
  }, [split, rail.height, preStart, playing]);
  const ch = Math.round(cw * 1.26);

  // The stretch of passage around a cell, for the dock. -1 marks a word break so
  // the strip reads as words rather than one run of letters.
  const passageAround = useCallback((n) => {
    const lo = Math.max(0, n - 8), hi = Math.min(N - 1, n + 8);
    const out = [];
    for (let i = lo; i <= hi; i++) {
      out.push(i);
      if (i < hi && breakAfter.has(i)) out.push(-1);
    }
    return out;
  }, [N, breakAfter]);

  // The opening answer can sit well down a twenty row bank, and on a phone the
  // board only appears once Start is pressed, so the first letter typed could
  // otherwise land in a row below the fold. Bring it into view once, and only
  // when it is genuinely off screen, so a board that already shows it does not
  // jump. The pinned keys sit over the foot of the page, hence the inset.
  const scrolledIn = useRef(false);
  useEffect(() => {
    if (!g.t0 || scrolledIn.current) return undefined;
    scrolledIn.current = true;
    const id = requestAnimationFrame(() => {
      const el = cellEl(cur);
      if (!el || !el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect();
      const foot = rail.height;
      if (r.top < 60 || r.bottom > window.innerHeight - foot) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [g.t0, cur, rail.height, cellEl]);

  const cellCls = (n) => {
    const c = ['an-cell'];
    if (owner[n] === curAnswer) c.push('mine');
    if (n === cur) c.push('on');
    if (!playing && fill[n] !== sol[n]) c.push('miss');
    return c.join(' ');
  };

  function Cell({ n, small }) {
    return (
      <div
        ref={(el) => { if (el) cellRefs.current[`${small ? 'b' : 'q'}${n}`] = el; }}
        className={cellCls(n)}
        style={{ width: small ? cw - 2 : cw, height: small ? ch - 2 : ch }}
        onClick={() => focusCell(n, small ? 'b' : 'q')}
      >{fill[n] || ''}</div>
    );
  }

  // The clue for the answer the cursor is in, printed the way its bank row
  // prints it: spine letter, category, length, and `done` once it is right. It
  // exists because the PASSAGE view hides the bank, and on a clueless acrostic
  // the category is the only clue there is — looking at the passage should not
  // cost you it.
  function CurClue({ inDock }) {
    const a = A[curAnswer];
    if (!a) return null;
    return (
      <div className={inDock ? 'an-dockclue' : 'an-topclue'}>
        {curAnswer < PUZZLE.spine && <span className="an-tag">{spineLetters[curAnswer] || '?'}</span>}
        <span className={a.cat ? 'an-cat' : 'an-cat open'}>{a.cat || 'no category'}</span>
        <span className="an-len">{a.w.length}</span>
        {solved[curAnswer] && <span className="an-ok">done</span>}
      </div>
    );
  }

  function BankRow({ ai }) {
    const a = A[ai];
    const isSpine = ai < PUZZLE.spine;
    return (
      <div className={`an-row${owner[cur] === ai ? ' on' : ''}`}>
        <div className="an-rowhead">
          {isSpine && <span className="an-tag">{spineLetters[ai] || '?'}</span>}
          <span className={a.cat ? 'an-cat' : 'an-cat open'}>{a.cat || 'no category'}</span>
          <span className="an-len">{a.w.length}</span>
          {solved[ai] && <span className="an-ok">done</span>}
        </div>
        <div className="an-boxes">{a.c.map((n) => <Cell key={n} n={n} small />)}</div>
      </div>
    );
  }

  const passagePanel = (
    <div className="an-quote">
      {tokens.map((tk, i) => (
        <div className="an-word" key={i}>
          {tk.map((t, j) => (t.p ? <span className="an-punc" key={j}>{t.p}</span> : <Cell key={j} n={t.n} />))}
        </div>
      ))}
    </div>
  );

  const banksPanel = (
    <div className="an-banks">
      <div>
        <div className="an-bhead">The spine &middot; {PUZZLE.spine}<span>first letters spell who wrote it</span></div>
        {A.slice(0, PUZZLE.spine).map((a, i) => <BankRow key={i} ai={i} />)}
      </div>
      <div>
        <div className={split ? 'an-bhead second' : 'an-bhead'}>The free bank &middot; {TOTAL - PUZZLE.spine}<span>no initial to obey</span></div>
        {A.slice(PUZZLE.spine).map((a, i) => <BankRow key={i + PUZZLE.spine} ai={i + PUZZLE.spine} />)}
      </div>
    </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="anon" name="Anon" collapsed={!!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="anon" quizId={PUZZLE.quizId}
          progress={N ? filledCount / N : 0}
          name="Anon"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (nSolved > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${nSolved}/${TOTAL}`, k: 'solved' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${nSolved}/${TOTAL}`, k: 'solved' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="an-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.an-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .an-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${ACC_DEEP};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? INK : ACC_DEEP};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .an-btn:hover{background:${ACC_SOFT};}
          .an-btn.primary{background:${ACC};border-color:${ACC};color:${ON_ACC};}
          .an-btn.primary:hover{background:${ACC_DEEP};}
          .an-quote{display:flex;flex-wrap:wrap;gap:9px 13px;}
          .an-word{display:flex;gap:3px;}
          .an-cell{border:1px solid ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.18)'};border-bottom-width:2px;border-radius:4px;background:${STAGE ? 'var(--stg-cell)' : SURF};
            display:flex;align-items:center;justify-content:center;font-family:${SANS};font-weight:800;font-size:15px;
            color:${INK};cursor:pointer;flex:none;transition:background 90ms,border-color 90ms;}
          .an-cell.mine{background:${ACC_SOFT};border-color:#e3b9be;}
          .an-cell.on{outline:2px solid ${ACC};outline-offset:-2px;background:${ACC_SOFT};}
          .an-cell.miss{background:${STAGE ? 'rgba(220,38,38,0.22)' : '#fee2e2'};border-color:#dc2626;color:${STAGE ? '#ffc9c9' : '#7f1d1d'};}
          .an-punc{align-self:center;color:var(--stg-mute2, #b6bcc7);font-weight:800;width:6px;text-align:center;}
          .an-banks{display:grid;grid-template-columns:1.25fr 1fr;gap:14px 26px;}
          @media(max-width:900px){.an-banks{grid-template-columns:1fr;}}
          .an-split{display:grid;gap:16px;align-items:start;grid-template-columns:minmax(0,1.02fr) minmax(0,1fr);}
          .an-pane{min-width:0;overflow-y:auto;overscroll-behavior:contain;}
          .an-split .an-banks{grid-template-columns:1fr;}
          .an-bhead.second{margin-top:16px;padding-top:14px;border-top:1px solid var(--stg-line,rgba(28,30,36,0.12));}
          .an-bhead{font-family:${MONO};font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${FADED};
            margin:0 0 9px;display:flex;justify-content:space-between;gap:10px;}
          .an-bhead span{color:var(--stg-dim, #c3c8d1);}
          .an-row{border:1px solid transparent;border-radius:8px;padding:4px 6px;margin-bottom:7px;}
          .an-row.on{border-color:#e3b9be;background:${ACC_SOFT};}
          .an-rowhead{display:flex;align-items:baseline;gap:8px;margin-bottom:3px;}
          .an-tag{font-weight:900;font-size:13px;color:${ACC_INK};width:13px;}
          .an-cat{font-family:${MONO};font-size:10px;letter-spacing:0.07em;text-transform:uppercase;color:var(--stg-mute, #4b5563);}
          .an-cat.open{color:var(--stg-dim, #c3c8d1);font-style:italic;}
          .an-len{margin-left:auto;font-family:${MONO};font-size:10px;color:var(--stg-dim, #c3c8d1);}
          .an-ok{font-family:${MONO};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:${COLORS.green};}
          .an-boxes{display:flex;gap:3px;flex-wrap:wrap;}
          .an-seg{display:flex;border:1px solid ${STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.14)'};border-radius:9px;overflow:hidden;margin-bottom:12px;}
          .an-dock{background:#0f1f2e;border-radius:8px;margin:6px 0 0;padding:8px 9px 9px;}
          .an-dockhead{display:flex;align-items:center;gap:8px;}
          .an-segd{display:flex;border:1px solid #2b4675;border-radius:7px;overflow:hidden;}
          .an-segd button{border:0;background:#16294a;color:#93a8cc;font-family:${SANS};font-weight:800;font-size:12px;padding:6px 15px;cursor:pointer;}
          .an-segd button.on{background:${ACC};color:${ON_ACC};}
          .an-nav{margin-left:auto;display:flex;gap:6px;}
          .an-nav button{width:28px;height:28px;border-radius:6px;border:1px solid #2b4675;background:#16294a;color:#dbe9ff;cursor:pointer;font-weight:800;}
          .an-topclue{display:flex;align-items:baseline;gap:8px;margin:-4px 0 12px;padding:0 2px;}
          /* THE DOCK IS ITS OWN ISLAND. It carries a hardcoded navy palette that
             predates the stage and does not read --stg-*, so the clue printed on
             it is coloured from THAT palette: a --stg-mute here would go dark on
             the light register and vanish against the navy. The typography is
             still the bank row's, so the two read as the same object. */
          .an-dockclue{display:flex;align-items:baseline;gap:8px;margin-top:8px;}
          .an-dockclue .an-tag{color:#dbe9ff;}
          .an-dockclue .an-cat{color:#93a8cc;}
          .an-dockclue .an-cat.open{color:#6b80a6;}
          .an-dockclue .an-len{color:#6b80a6;}
          .an-dockclue .an-ok{color:#5fd3a3;}
          .an-dockbody{margin-top:7px;display:flex;gap:3px;overflow-x:auto;padding-bottom:2px;}
          .an-dcell{width:21px;height:26px;border-radius:4px;background:#16294a;border:1px solid #2b4675;display:flex;align-items:center;
            justify-content:center;font-weight:800;font-size:13px;color:var(--white);flex:none;}
          .an-dcell.on{background:${ACC};border-color:#b04a55;}
          .an-dcell.gap{background:none;border:0;width:7px;}
          .an-seg button{flex:1;border:0;background:${STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : 'var(--white)'};padding:10px 0;font-family:${SANS};font-weight:800;font-size:13.5px;color:${STAGE ? 'var(--stg-mute,#8b95a8)' : '#8b93a1'};cursor:pointer;}
          .an-seg button.on{background:${ACC};color:${ON_ACC};}
          .an-input{position:fixed;left:0;right:0;bottom:0;z-index:40;background:${STAGE ? 'var(--stg-raise,#0e131f)' : '#e5e8ef'};
            border-top:1.5px solid rgba(20,22,28,0.14);box-shadow:0 -4px 16px rgba(20,22,28,0.12);
            padding:0 8px calc(4px + env(safe-area-inset-bottom));}
          .an-inputin{max-width:500px;margin:0 auto;}
          .an-input .an-kb{background:none;border-radius:0;padding:7px 0 4px;}
          .an-kb{display:flex;flex-direction:column;gap:5px;background:${STAGE ? 'var(--stg-raise,#0e131f)' : '#e5e8ef'};border-radius:0 0 10px 10px;padding:7px 4px 9px;}
          .an-kr{display:flex;gap:5px;justify-content:center;}
          .an-kr button{flex:1;max-width:34px;height:42px;border:0;border-radius:6px;background:${STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : 'var(--white)'};color:${INK};font-family:${SANS};
            touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
            font-weight:800;font-size:15px;box-shadow:0 1px 0 #b9bfcb;cursor:pointer;}
          .an-kr button.wide{max-width:54px;font-size:11px;background:${STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : '#c9cfdb'};}
          .an-kr button.del{display:flex;align-items:center;justify-content:center;}
          .an-kr button:active{background:${STAGE ? 'var(--stg-line2,rgba(255,255,255,0.17))' : '#cfd6e2'};}
          .an-spine{display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin:0 0 14px;}
          .an-spine i{width:22px;height:28px;border-radius:4px;background:${ACC_SOFT};border:1px solid ${STAGE ? 'color-mix(in srgb, var(--stg-acc) 45%, transparent)' : '#e3b9be'};
            display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:900;font-size:15px;color:${ACC_INK};}
          .an-spine i.blank{color:${STAGE ? 'var(--stg-dim,#5a657d)' : '#dcc6c9'};background:${STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : 'var(--white)'};border-color:${STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.1)'};}
        `}</style>

        <div style={{ maxWidth: split ? 1180 : 900, margin: '0 auto' }}>
          {!LOFT && (
          <DailyMasthead
            slug="anon"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={4}
            helpTop={8}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Longer Passage</span>}
            blocks={'ANON'.split('').map((c, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 19, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{c}</div>
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

          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white, border: STAGE ? '1px solid var(--stg-line)' : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '20px 22px', margin: '4px 0 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 8px' }}>
                A clueless acrostic: a passage nobody signed, in {N} letters.
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: FADED, fontWeight: 600, margin: '0 0 12px' }}>
                Every box belongs to one answer below, so a letter you type appears in both halves at once.
                There are no clues. Finish it and the first letters of the spine will have spelled out
                <b style={{ color: ACC_DEEP_INK }}> who wrote it</b>.
              </p>
              {gateRules && (
                <div style={{ marginBottom: 14 }}>
                  <DailyRules
                    accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
                    lead="Fill the passage. The bank fills it, and it fills the bank."
                    steps={[
                      <>Type in either half. The same letter lands in the other one, because it is the same letter.</>,
                      <>Some answers carry a <b>category</b> you can list in your head: <i>planet, 5</i> is earth or venus. Those are the way in.</>,
                      <>About half carry <b>no category at all</b>. Those come from the passage reading as English.</>,
                      <>No checks and no hints. A wrong answer stops the passage making sense, which is the only tell you need.</>,
                    ]}
                    knack="Start with the sharpest category, not the passage. Eight letters land at once and the sentence opens up."
                    footer="Two players who both finish are separated by the clock."
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="an-btn primary" onClick={start}>Start</button>
                {!gateRules && <button className="an-btn" onClick={() => setGateRules(true)}>Show instructions</button>}
              </div>
            </div>
          )}

          {!preStart && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0 10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: FADED }}>
                  {nSolved}/{TOTAL} answers &middot; {filledCount}/{N} letters &middot; {elapsed}
                </div>
              </div>

              <div className="an-spine">
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, marginRight: 4 }}>Signed</span>
                {spineLetters.map((c, i) => <i key={i} className={c ? '' : 'blank'}>{c || '·'}</i>)}
              </div>

              {narrow && !railUp && (
                <div className="an-seg">
                  <button className={view === 'q' ? 'on' : ''} onClick={() => setView('q')}>Passage</button>
                  <button className={view === 'b' ? 'on' : ''} onClick={() => setView('b')}>Bank</button>
                </div>
              )}
              {narrow && !railUp && view === 'q' && <CurClue />}

              {split ? (
                /* THE PASSAGE IS ON THE LEFT because it is the object being read
                   and it fits without scrolling; the bank is on the right because
                   it is the long list you work down. Each pane scrolls inside its
                   own measured frame, so the PAGE does not scroll during a solve
                   and neither half can push the other off screen. */
                <div className="an-split" ref={splitRef} style={{ marginBottom: 16 }}>
                  <div className="an-pane" ref={qPaneRef} style={{ ...panelStyle, padding: '16px 16px 14px', maxHeight: paneH || undefined }}>
                    {passagePanel}
                  </div>
                  <div className="an-pane" style={{ ...panelStyle, padding: '16px 18px', maxHeight: paneH || undefined }}>
                    {banksPanel}
                  </div>
                </div>
              ) : (
                <>
                  {(!narrow || view === 'b') && (
                    <div style={{ ...panelStyle, padding: '16px 18px', marginBottom: 16 }}>
                      {banksPanel}
                    </div>
                  )}
                  {(!narrow || view === 'q') && (
                    <div style={{ ...panelStyle, padding: '16px 16px 14px', marginBottom: 16 }}>
                      {passagePanel}
                    </div>
                  )}
                </>
              )}

              {playing && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  <button className="an-btn" style={{ marginLeft: 'auto' }} onClick={giveUp}><Flag size={15} />Give up</button>
                </div>
              )}

            </>
          )}


          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Anon"
              catRank={catRank}
              outcome={won ? 'won' : (nSolved > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (nSolved > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${nSolved}/${TOTAL}`} solved \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Anon all time` : 'all-time rank' }
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
                  href: `/anon?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Anon', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/anon?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="anon" name="Anon" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="anon" name="Anon" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid
              self="anon"
              maxWidth={640}
              replay={!playing ? resetGame : null}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="anon" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
            )}
          </div>
        </div>
        {rail.height > 0 && <div aria-hidden style={{ height: rail.height }} />}
      </div>

          {/* The input rail, for any device with no physical keys. The keyboard is
          ours rather than the OS one, which would resize the viewport under the
          board. On a narrow screen the two halves cannot both be on screen, so
          the rail also carries the dock: the Passage/Bank switch and the answer
          stepper on one line, and under them the stretch of the OTHER half
          around the cell you are on, plus that answer's CLUE when the passage is
          the half showing, since the bank that would otherwise print it is not
          rendered at all in that view. Those are the two most-pressed controls in
          the game and they belong under the thumb, not at the top of a page the
          player has scrolled away from. At tablet width both halves are already
          visible, so a tablet gets the keys alone.

          The board clears it through the spacer at the foot of .an-wrap, whose
          height is measured off this element by useRailClearance. It was bottom
          padding on .an-wrap until 2026-08-15, which a Loft page zeroes with
          !important, so the rail sat on top of the end of the passage and the
          last row of the bank. */}
      {railUp && (
        <div className="an-input" ref={rail.ref}>
          <div className="an-inputin">
          {narrow && (
            <div className="an-dock">
              <div className="an-dockhead">
                <span className="an-segd">
                  <button className={view === 'q' ? 'on' : ''} onClick={() => setView('q')}>Passage</button>
                  <button className={view === 'b' ? 'on' : ''} onClick={() => setView('b')}>Bank</button>
                </span>
                <span className="an-nav">
                  <button onClick={() => stepNext(-1)} aria-label={view === 'q' ? 'Previous word' : 'Previous answer'}>&lsaquo;</button>
                  <button onClick={() => stepNext(1)} aria-label={view === 'q' ? 'Next word' : 'Next answer'}>&rsaquo;</button>
                </span>
              </div>
              {view === 'q' && <CurClue inDock />}
              <div className="an-dockbody">
                {(view === 'b' ? passageAround(cur) : A[curAnswer].c).map((n, i) => (
                  n < 0
                    ? <div key={`g${i}`} className="an-dcell gap" />
                    : <div key={n} className={`an-dcell${n === cur ? ' on' : ''}`} onClick={() => focusCell(n)}>{fill[n] || ''}</div>
                ))}
              </div>
            </div>
          )}
          <div className="an-kb">
            {ROWS.map((row, ri) => (
              <div className="an-kr" key={ri}>
                {ri === 2 && <button className="wide" onClick={() => stepNext(1)}>NEXT</button>}
                {[...row].map((c) => <button key={c} onClick={() => type(c.toUpperCase())}>{c.toUpperCase()}</button>)}
                {ri === 2 && (
                  <button
                    className="wide del"
                    aria-label="Delete"
                    onPointerDown={(e) => { e.preventDefault(); holdDelete(); }}
                    onPointerUp={stopDelete}
                    onPointerLeave={stopDelete}
                    onPointerCancel={stopDelete}
                    onContextMenu={(e) => e.preventDefault()}
                  ><Delete size={15} /></button>
                )}
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="anon"
          won={won}
          completed
          headline={won ? <>{PUZZLE.author}</> : <>{nSolved} of {TOTAL}</>}
          subline={<>Anon #{PUZZLE.num} &middot; {nSolved}/{TOTAL} answers &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 480, fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <HelpCircle size={19} color={COLORS.accent} />
              <b style={{ fontSize: 17, color: INK }}>How Anon works</b>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 10px' }}>
              The passage arrives unsigned. Every box in it belongs to exactly one answer in the bank,
              so the two halves are the same letters seen twice and a letter typed in either one shows up
              in the other. There are no clues at all.
            </p>
            <ul style={{ fontSize: 13.5, lineHeight: 1.7, color: INK, margin: '0 0 12px', paddingLeft: 20 }}>
              <li>The <b>spine</b> is the first {PUZZLE.spine} answers. Their first letters spell the author.</li>
              <li>The <b>free bank</b> obeys no first letter, which is where most of the categories live.</li>
              <li>A printed category is always one you can recite: it admits four words at most at that length.</li>
              <li>An answer marked <i>no category</i> has none. It comes from the passage, not the bank.</li>
              <li>No checks, no hints. A wrong answer makes the passage stop reading as English.</li>
              <li>Click or tap any box and type. On a touch screen the keys sit at the foot of the board. Arrow keys walk the passage, Tab jumps to the next answer.</li>
            </ul>
            <button className="an-btn primary" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
          </div>
        </div>
      )}

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
