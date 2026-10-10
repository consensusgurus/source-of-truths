'use client';

// Strata — the daily word game you excavate.
//
// Every letter on the grid belongs to one of the day's hidden words, and all of
// them are members of one unstated category. Trace a word and it lifts out; the
// letters above it FALL, and the reshaped board is what lets you read the next
// word. A weekday grid is 5x5, a Sunday Edition is 6x7 and runs two threads at
// once rather than one.
//
// WHY THERE IS NO FAIL STATE. A wrong trace costs nothing and nothing is ever
// taken away from you, because scripts/verify-strata.mjs proves, per board, that
// no reachable state is a dead end. Whatever order you clear in, the board can
// still be finished, so there is no stranding to undo and no way to spoil a day.
// The only currency is the clock and the hints you spend.
//
// WHY THE COLLAPSE IS NOT DECORATION. The same verifier proves the gate: only
// one or two words can be read on the untouched grid, and at least one word
// cannot be read until several others have fallen out. So the board really does
// hand you the next word, and a solve is a sequence, not a word search.
//
// The client never receives the answer key's POSITIONS: app/strata/page.js
// strips `owners` (the cell to word map) and `pool`, so where each word sits has
// to be found by search, exactly as the player finds it. Placements are proved
// unique per board, which is why a traced set of cells is always the right set
// and a correct-looking trace is never refused.
//
// Same daily plumbing as the rest of the roster: banked days gated by Eastern
// date on the server, per-day localStorage saves, /strata?p=N archive pinning,
// streaks and stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Lightbulb, Flag, RotateCcw } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
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
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import DailyRules from '../DailyRules';
import { isMobileDevice } from '@/lib/is-mobile';
import { T } from '@/lib/theme';
import { makeCells, positions, adjacent, findOne, gridOf } from '@/lib/strata-core';

const COLORS = {
  ink: T.ink,
  faded: T.muted,
  accent: '#9a3412',        // Strata identity — oxide, for the sediment it is named after
  accentSoft: '#fdf0e7',
  accentDeep: '#7c2d12',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_strata_help_seen';
const FALL_MS = 340;      // must match the CSS transition below
const LIFT_MS = 260;      // how long a found word sits lit before it drops out

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

// The dig site's measurements for a phone (<=640) or a desktop board. A Sunday
// grid is seven wide, so it trades band and gap for tile size to keep a tile
// at a 44px touch target on a 390px phone.
function boardGeom(narrow, cols) {
  const wide = cols > 5;
  if (narrow) return { gap: wide ? 4 : 7, band: wide ? 6 : 12, mar: wide ? 4 : 8, max: 58 };
  return { gap: wide ? 8 : 10, band: 20, mar: 16, max: 70 };
}

const freshState = () => ({ v: 1, found: [], hints: 0, thread: false, t0: null, tEnd: null, status: 'playing' });
const EMPTY_BOARD = { plays: 0, best: null, leaderboard: [] };

// ── stats (same shape every daily uses) ──────────────────────────────────────
const STATS_KEY = 'sot_strata_stats';
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

export default function StrataClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const { rows, cols, words } = PUZZLE;
  const TOTAL = words.length;
  const STORE_KEY = `sot_strata_${PUZZLE.num}`;

  const { cells, columns } = useMemo(() => makeCells(PUZZLE), [PUZZLE]);

  const [g, setG] = useState(freshState);
  const [trace, setTrace] = useState([]);          // cell ids, in traced order
  const [lifting, setLifting] = useState(null);    // { ids, word } lit before it drops
  const [flash, setFlash] = useState(null);        // hint pulse: cell id
  const [bad, setBad] = useState(false);
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
  const press = useRef(null);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('strata');
  const STAGE = isStage('strata', searchParams);
  // The register comes from the shared store the switch in the cap writes.
  // Resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('strata');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('strata'), '--stg-acc-lt': gameColorLight('strata'), '--stg-onramp-lt': gameOnrampLight('strata'), '--stg-acc-ink-lt': gameAccentInkLight('strata') };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  // Focus mode: while the puzzle is live the leaderboard / share / other-games
  // block is folded away behind one button, the same arrangement every other
  // daily uses (owner rule, 2026-08-08). setShowChrome unfolds it for good.
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0;
  const foundWords = g.found;
  const foundSet = useMemo(() => new Set(foundWords), [foundWords]);

  // Cells that have gone. `lifting` is still ON the board (lit up) so the drop
  // reads as a consequence of the find rather than happening at the same instant.
  const removed = useMemo(() => {
    const s = new Set();
    for (const rec of foundWords) for (const id of rec.ids) s.add(id);
    return s;
  }, [foundWords]);

  const at = useMemo(() => positions(rows, cols, columns, removed), [rows, cols, columns, removed]);
  const traceSet = useMemo(() => new Set(trace), [trace]);
  const liftSet = useMemo(() => new Set(lifting ? lifting.ids : []), [lifting]);
  const remaining = useMemo(() => words.filter((w) => !foundWords.some((f) => f.word === w)), [words, foundWords]);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.found)) setG({ ...freshState(), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_strata_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_strata_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live clock, ticked from state rather than read during render, so the readout
  // moves on its own instead of only when the board re-renders.
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

  const REC_KEY = `sot_strata_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!playing || !g.t0 || !g.found.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - g.t0) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: g.found.length, total: TOTAL, correct: g.found.length, guessesUsed: g.hints, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  const postResult = useCallback((g2) => {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const sc = g2.found.length;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.hints, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // guessesUsed = hints spent. Nothing else can go wrong on a Strata board,
        // so hints are the only thing that separates two players who both cleared
        // it, ahead of the clock.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: g2.hints, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }, [abandon, PUZZLE, TOTAL, identity]);

  function start() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setGateRules(false);
  }

  // ---- tracing ----
  const commit = useCallback((ids) => {
    const word = ids.map((id) => cells[id].ch).join('');
    if (!remaining.includes(word)) {
      if (ids.length > 2) { setBad(true); setTimeout(() => setBad(false), 320); }
      setTrace([]);
      return;
    }
    setTrace([]);
    setLifting({ ids, word });
    setTimeout(() => {
      setLifting(null);
      setG((cur) => {
        if (cur.found.some((f) => f.word === word)) return cur;
        const next = { ...cur, found: cur.found.concat([{ word, ids }]) };
        if (next.found.length === TOTAL) {
          next.status = 'done';
          next.tEnd = Date.now();
          postResult(next);
        }
        return next;
      });
    }, LIFT_MS);
  }, [cells, remaining, TOTAL, postResult]);

  // TWO WAYS IN, ONE CODE PATH. Tap the letters one at a time, or hold and drag
  // through them. Tapping is the primary mode and is exact, which matters here
  // because diagonals are legal: a dragged path across a diagonal passes over
  // the corner of the orthogonal neighbour on its way, and that neighbour used
  // to get picked up, so a clean diagonal came out as a wrong word. Two fixes,
  // and tapping is the one that always works.
  //
  //   drag  the hit test ignores anything outside the middle of a tile, so
  //         clipping a corner in passing does nothing
  //   tap   nothing is in passing at all. Tap the last letter again to drop the
  //         whole trace, or tap any earlier letter to walk back to it.
  const extend = useCallback((id, fromDrag) => {
    if (!playing || lifting || !g.t0) return;
    setTrace((cur) => {
      if (!cur.length) return [id];
      const i = cur.indexOf(id);
      if (i >= 0) {
        // tapping the letter you are sitting on clears the trace; anything
        // earlier walks back to it. A drag only ever walks back.
        if (!fromDrag && i === cur.length - 1) return [];
        return cur.slice(0, i + 1);
      }
      const a = at.get(cur[cur.length - 1]);
      const b = at.get(id);
      if (!a || !b || !adjacent(a, b)) return fromDrag ? cur : [id];
      const next = cur.concat([id]);
      // Auto-accept the moment the trace spells an unfound word. There is no
      // Enter key here and no submit button: the house rule for a typed daily is
      // that a correct answer is taken as soon as it is correct, and a traced
      // one is no different.
      const w = next.map((x) => cells[x].ch).join('');
      if (remaining.includes(w)) { setTimeout(() => commit(next), 0); return next; }
      return next;
    });
  }, [playing, lifting, g.t0, at, cells, remaining, commit]);

  function onDown(id, e) {
    if (e && e.preventDefault) e.preventDefault();
    press.current = { id, last: id, moved: false };
    extend(id, false);
  }

  useEffect(() => {
    const move = (e) => {
      const p = press.current;
      if (!p) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const t = el && el.closest && el.closest('.st-tile');
      if (!t || t.dataset.cid === undefined) return;
      const r = t.getBoundingClientRect();
      const dx = e.clientX - (r.x + r.width / 2);
      const dy = e.clientY - (r.y + r.height / 2);
      if (Math.hypot(dx, dy) > r.width * 0.44) return;      // corner clip, not a pick
      const id = Number(t.dataset.cid);
      if (id === p.last) return;
      p.last = id; p.moved = true;
      extend(id, true);
    };
    const up = () => {
      const p = press.current;
      press.current = null;
      // A tap leaves the trace standing so the next tap can extend it. Only a
      // real drag commits on release.
      if (p && p.moved) setTrace((cur) => { if (cur.length > 1) setTimeout(() => commit(cur), 0); return cur; });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [commit, extend]);

  // ---- hints ----
  function revealThread() {
    if (!playing || g.thread) return;
    setG((cur) => ({ ...cur, thread: true, hints: cur.hints + 1 }));
  }
  function showStart() {
    if (!playing || !remaining.length) return;
    const grid = gridOf(rows, cols, columns, removed);
    for (const w of remaining) {
      const path = findOne(grid, w, cells, rows, cols);
      if (path) {
        setFlash(path[0]);
        setTimeout(() => setFlash(null), 1800);
        setG((cur) => ({ ...cur, hints: cur.hints + 1 }));
        return;
      }
    }
  }
  function giveUp() {
    if (!playing) return;
    setG((cur) => {
      const next = { ...cur, status: 'done', tEnd: Date.now() };
      postResult(next);
      return next;
    });
  }

  // ---- the backstop ----
  // A VERIFIED BOARD CAN NEVER REACH THIS. scripts/verify-strata.mjs walks every
  // state a player can trace into and fails any board with a dead end, so this
  // is here for the day that proof is wrong again rather than for the game.
  //
  // It was wrong once. The state walk modelled a found word as losing the cells
  // the bank says it OWNS, not the cells the player traced, and those differ the
  // moment a word's only readable trace runs through a letter belonging to a word
  // still on the board. #5 (2026-08-10) shipped that way: THUMB's opening trace
  // eats HEART's T, and half of that day's play-throughs ended on a board holding
  // HEART's letters in a shape HEART cannot be read in. The engine is fixed and
  // the bank is clean, but "you cannot get stuck" is printed in the rules two
  // inches above the grid, so the game should be able to make that true by itself.
  //
  // Taking the last word back costs NOTHING: not a hint, not the clock, not the
  // score. The board is at fault, never the player, and charging them for our
  // proof having a hole in it is the wrong way round.
  const stuck = useMemo(() => {
    if (!playing || !g.t0 || lifting || !remaining.length) return false;
    const grid = gridOf(rows, cols, columns, removed);
    return !remaining.some((w) => findOne(grid, w, cells, rows, cols));
  }, [playing, g.t0, lifting, remaining, rows, cols, columns, removed, cells]);

  // Can the rest of the board still be cleared from here, in SOME order? The same
  // question the verifier asks, asked from one state instead of all of them. It
  // is only ever called on a stuck board, which a clean bank never produces, and
  // a real board settles it in a few dozen states.
  const finishable = useCallback((rem0, left0) => {
    const seen = new Set();
    let budget = 4000;
    const go = (rem, left) => {
      if (!left.length) return true;
      if (--budget < 0) return false;
      const k = `${[...rem].sort((a, b) => a - b).join(',')}|${left.join(',')}`;
      if (seen.has(k)) return false;
      seen.add(k);
      const grid = gridOf(rows, cols, columns, rem);
      for (const w of left) {
        const path = findOne(grid, w, cells, rows, cols);
        if (!path) continue;
        const rem2 = new Set(rem); for (const id of path) rem2.add(id);
        if (go(rem2, left.filter((x) => x !== w))) return true;
      }
      return false;
    };
    return go(rem0, left0);
  }, [rows, cols, columns, cells]);

  // How far back the board has to go to be winnable again. One step is not enough
  // on a genuinely broken board: rewinding WRIST on #5 hands back a grid whose
  // only readable word is WRIST, so the player is stuck again on the next tap and
  // has to keep pressing. Walk back to the deepest state the board can still be
  // FINISHED from, so one press always ends the problem. 0 means back to a clean
  // grid, which on #5 is the honest answer: its opening THUMB is the fatal move.
  const unstickTo = useMemo(() => {
    if (!stuck) return null;
    for (let k = g.found.length - 1; k >= 0; k--) {
      const keep = g.found.slice(0, k);
      const rem = new Set();
      for (const f of keep) for (const id of f.ids) rem.add(id);
      if (finishable(rem, words.filter((w) => !keep.some((f) => f.word === w)))) return k;
    }
    return Math.max(0, g.found.length - 1);
  }, [stuck, g.found, words, finishable]);

  function unstick() {
    if (unstickTo === null) return;
    setTrace([]);
    setG((cur) => ({ ...cur, found: cur.found.slice(0, unstickTo) }));
  }

  function resetGame() {
    setG(freshState());
    setTrace([]); setLifting(null); setEndClosed(false);
  }

  function copyShare() {
    // The pattern is a LINE, never a grid, and it says nothing about where any
    // word sat or what it was. Filled = found on your own, hollow = you took a
    // hint somewhere on the day.
    const marks = foundWords.map(() => '▪').join('') + '▫'.repeat(TOTAL - foundWords.length);
    const txt = `Strata #${PUZZLE.num}\n${foundWords.length}/${TOTAL} · ${elapsed}${g.hints ? ` · ${g.hints} hint${g.hints > 1 ? 's' : ''}` : ''}\n${marks}\nmindloftdaily.com/strata`;
    try {
      navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'strata', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'strata', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'strata', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'strata', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'strata', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const won = foundWords.length === TOTAL;
  const threadLabel = (PUZZLE.themes || []).join(' + ');

  // Tile size is a number fitted to the viewport rather than a CSS variable
  // stepped by breakpoints, so a 6x7 Sunday board fills a phone exactly instead
  // of landing on whichever of three fixed sizes happens to fit.
  //
  // CORRECTION, and it is worth writing down because it cost an hour: this was
  // first changed on the theory that Chrome could not transition a value of the
  // form calc(var(--x) * n + mpx), because the tiles' computed `top` was sitting
  // on the old row while the inline style already showed the new one, and the
  // top transition reported playState "running" at currentTime 0 forever. That
  // theory was WRONG. The tab being measured was a background tab, and Chrome
  // throttles CSS transitions in a hidden tab, so they never tick. The board was
  // falling correctly the whole time. calc(var()) would have been fine. Keeping
  // the px version on its own merits, not because the old one was broken.
  //
  // The lesson for the next person measuring a live daily through an automated
  // tab: check document.visibilityState before believing an animation is stuck,
  // or call el.getAnimations().forEach(a => a.finish()) and measure after.
  //
  // Round three (2026-10-10): the board sits in a dig site, a strata band down
  // each side and bedrock under it, beside a dig log on desktop and under one
  // on a phone. boardGeom() is the one place the gap, band and margin are
  // decided, so the fit below and the render agree on them.
  const [tile, setTile] = useState(56);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const nar = w <= 640;
      const geo = boardGeom(nar, cols);
      // The page gutter: 12px a side on a phone-sized stage, 38 otherwise; the
      // board column then sits beside a 164px log (plus its 24px gap) on desktop.
      const content = w <= (STAGE ? 700 : 560) ? w - 24 : Math.min(760, w - 76);
      const avail = (nar ? content : Math.min(content - 188, 462)) - 2 * geo.band - 2 * geo.mar;
      setNarrow(nar);
      setTile(Math.max(30, Math.min(geo.max, Math.floor((avail - geo.gap * (cols - 1)) / cols))));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [cols, STAGE]);
  const { gap, band: BAND, mar: BMAR } = boardGeom(narrow, cols);
  const step = tile + gap;
  const boardW = cols * tile + gap * (cols - 1);
  const boardH = rows * tile + gap * (rows - 1);

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="strata" name="Strata" collapsed={!!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="strata" quizId={PUZZLE.quizId}
          name="Strata"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (foundWords.length > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${foundWords.length}/${TOTAL}`, k: 'found' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${foundWords.length}/${TOTAL}`, k: 'found' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="st-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.st-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .st-btn{font-family:${SANS};font-weight:${STAGE ? 700 : 800};font-size:14px;border:${STAGE ? '1.5px solid var(--stg-cell-line)' : `2px solid ${COLORS.accentDeep}`};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border-radius:${STAGE ? 12 : 8}px;padding:9px 16px;min-height:48px;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;}
          .st-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .st-btn:disabled{opacity:0.4;cursor:default;}
          .st-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .st-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 86%, var(--stg-ink, var(--white)));}
          .st-board{position:relative;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none;}
          .st-tile{position:absolute;display:flex;align-items:center;justify-content:center;
            font-family:${SANS};font-weight:800;border-radius:10px;cursor:pointer;box-sizing:border-box;
            background:var(--st-stone, ${STAGE ? 'var(--stg-cell)' : 'var(--white)'});border:1.5px solid ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.28)'};color:${INK};
            transition:top ${FALL_MS}ms cubic-bezier(.4,.05,.35,1),left ${FALL_MS}ms cubic-bezier(.4,.05,.35,1),background 120ms,color 120ms,border-color 120ms,transform 160ms,opacity ${LIFT_MS}ms;}
          .st-tile.on{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));transform:scale(1.04);}
          .st-tile.lift{background:${STAGE ? 'var(--stg-good)' : COLORS.green};border-color:${STAGE ? 'var(--stg-good)' : COLORS.green};color:${STAGE ? 'var(--stg-ground)' : 'var(--white)'};opacity:0.15;transform:scale(0.82);}
          .st-hole{position:absolute;box-sizing:border-box;border-radius:10px;border:1.5px dashed ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.3)'};pointer-events:none;}
          .st-k{font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${FADED};}
          .st-k b{font-size:14px;letter-spacing:0;color:${INK};font-weight:800;}
          .st-clear{font-family:${SANS};font-weight:700;font-size:13px;background:transparent;color:${FADED};border:0;padding:0 8px;min-height:44px;min-width:44px;text-decoration:underline;cursor:pointer;}
          @media(max-width:640px){.st-k{font-size:10px;}.st-k b{font-size:13px;}.st-tile,.st-hole{border-radius:9px;}}
          .st-tile.bad{background:${STAGE ? 'var(--stg-surf2)' : '#fee2e2'};border-color:${STAGE ? 'var(--stg-bad)' : '#b91c1c'};color:${STAGE ? 'var(--stg-bad)' : '#7f1d1d'};}
          .st-tile.flash{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px var(--stg-surf2, ${COLORS.accentSoft});}
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {!LOFT && (
          <DailyMasthead
            slug="strata"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={4}
            helpTop={8}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Two Threads</span>}
            blocks={'STRATA'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 19, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '20px 22px', margin: '4px 0 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 8px' }}>
                {TOTAL} words are buried in {rows * cols} letters.
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: FADED, fontWeight: 600, margin: '0 0 12px' }}>
                Every letter belongs to one of them, and they are all members of{' '}
                {PUZZLE.sunday ? <b style={{ color: ACC_DEEP_INK }}>two categories you are not told</b> : <b style={{ color: ACC_DEEP_INK }}>one category you are not told</b>}.
                Trace a word and it lifts out. Then the letters above it fall, and the board you were reading is gone.
              </p>
              {gateRules && (
                <div style={{ marginBottom: 14 }}>
                  <DailyRules
                    accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
                    steps={[
                      <>Tap the letters one at a time, or <b>hold and drag</b> through them. <b>Diagonals count</b>.</>,
                      <>Most of today&rsquo;s words cannot be read yet. They arrive when the board falls.</>,
                      <>A <b>wrong trace costs nothing</b>. You cannot get stuck, in any order.</>,
                    ]}
                    knack="Take whatever you can read now. Every word you lift drops the letters above it into the next one."
                    footer="Hints are the only thing that separates two players who both finish."
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="st-btn primary" onClick={start}>Start digging</button>
                {!gateRules && <button className="st-btn" onClick={() => setGateRules(true)}>Show instructions</button>}
              </div>
            </div>
          )}

          {!preStart && (() => {
            // ---- the dig site (round three, 2026-10-10) ----
            // Every readout here is state the board already had on screen: the
            // found words, the remaining words' LENGTHS (the old slot row printed
            // them as dots), the hint count and the trace. Nothing new is told.
            const A_FILL = STAGE ? 'var(--stg-acc)' : COLORS.accent;
            const A_TINT = STAGE ? 'color-mix(in srgb, var(--stg-acc) 18%, transparent)' : COLORS.accentSoft;
            const CELL_LINE = STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.3)';
            const BAD = STAGE ? 'var(--stg-bad)' : '#b91c1c';
            const PANEL = STAGE ? 'var(--stg-surf)' : 'rgba(28,30,36,0.04)';
            const GROUND = STAGE ? 'var(--stg-ground)' : T.surface;
            // Stone darkens with depth, from the cell color at the surface
            // toward the page ground at the bottom row, in either register.
            const stone = (r) => {
              const t = Math.round((r / Math.max(1, rows - 1)) * 62);
              return STAGE
                ? `color-mix(in srgb, var(--stg-cell) ${100 - t}%, var(--stg-ground))`
                : `color-mix(in srgb, #ffffff ${100 - t}%, #e7e2d8)`;
            };
            const showMissed = !playing && (won || !LOFT || revealed);
            const logRows = foundWords.map((f, i) => ({ k: f.word, found: true, tag: `Lift ${i + 1}`, t: f.word }))
              .concat(remaining.map((w) => ({ k: w, found: false, missed: showMissed, tag: showMissed ? 'Missed' : `Buried · ${w.length} letters`, t: showMissed ? w : '·'.repeat(w.length) })));
            const rowInk = (s) => (s.found ? ACC_DEEP_INK : (s.missed ? BAD : FADED));
            const rowEdge = (s) => (s.found ? A_FILL : (s.missed ? BAD : CELL_LINE));
            const lede = PUZZLE.sunday ? 'two categories you are not told' : 'one category you are not told';

            // Where a letter used to be: every grid square no tile stands on.
            const taken = new Set();
            at.forEach((p) => { if (p) taken.add(`${p[0]},${p[1]}`); });
            const holes = [];
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!taken.has(`${r},${c}`)) holes.push([r, c]);

            // A strata band down one side of the board, one stone shade per row
            // and a wavy seam between rows. SVG paint goes through currentColor.
            const sideBand = (side) => {
              const B = BAND;
              let d = '';
              for (let r = 1; r < rows; r++) {
                const y = r * step - gap / 2;
                const s = ((r + (side === 'r' ? 1 : 0)) % 2) ? -1 : 1;
                d += `M0 ${y}q${B / 4} ${s * B / 4} ${B / 2} 0t${B / 2} 0`;
              }
              return (
                <svg width={B} height={boardH} viewBox={`0 0 ${B} ${boardH}`} aria-hidden="true" style={{ flex: '0 0 auto', display: 'block' }}>
                  {Array.from({ length: rows }, (_, r) => {
                    const y0 = r === 0 ? 0 : r * step - gap / 2;
                    const y1 = r === rows - 1 ? boardH : (r + 1) * step - gap / 2;
                    return <rect key={r} x="0" y={y0} width={B} height={y1 - y0} fill="currentColor" style={{ color: stone(r) }} />;
                  })}
                  {d && <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: FADED }} />}
                </svg>
              );
            };
            const hatch = (h) => ({ display: 'block', height: h, borderRadius: 3, boxSizing: 'border-box', background: `repeating-linear-gradient(135deg, ${FADED} 0 2px, transparent 2px 7px)`, border: `1px solid ${FADED}` });

            const site = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? 5 : 6, width: boardW + 2 * BAND + 2 * BMAR, maxWidth: '100%', margin: narrow ? '0 auto' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '0 2px' }}>
                  <span className="st-k" style={{ fontSize: 10 }}>Surface</span>
                  <span className="st-k" style={{ fontSize: 10, textAlign: 'right' }}>Letters fall down their column</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'stretch', boxSizing: 'border-box', padding: narrow ? '8px 0' : '16px 0', borderRadius: narrow ? 12 : 14, background: PANEL }}>
                  {sideBand('l')}
                  <div className="st-board" style={{ width: boardW, height: boardH, margin: `0 ${BMAR}px` }}>
                    {holes.map(([r, c]) => (
                      <span key={`h${r},${c}`} className="st-hole" style={{ width: tile, height: tile, top: r * step, left: c * step }} />
                    ))}
                    {cells.map((cell) => {
                      const pos = at.get(cell.id);
                      const gone = removed.has(cell.id) && !liftSet.has(cell.id);
                      if (gone && !pos) return null;
                      const p = pos || at.get(cell.id);
                      const cls = ['st-tile'];
                      if (liftSet.has(cell.id)) cls.push('lift');
                      else if (traceSet.has(cell.id)) cls.push(bad ? 'bad' : 'on');
                      if (flash === cell.id) cls.push('flash');
                      if (!p) return null;
                      return (
                        <div
                          key={cell.id}
                          className={cls.join(' ')}
                          style={{
                            width: tile, height: tile, fontSize: Math.round(tile * 0.42),
                            top: p[0] * step, left: p[1] * step,
                            '--st-stone': stone(p[0]),
                          }}
                          data-cid={cell.id}
                          onPointerDown={(e) => onDown(cell.id, e)}
                        >{cell.ch}</div>
                      );
                    })}
                  </div>
                  {sideBand('r')}
                </div>
                {narrow ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...hatch(8), flex: 1 }} />
                    <span className="st-k" style={{ fontSize: 10 }}>Bedrock, the floor</span>
                  </div>
                ) : (
                  <span style={hatch(10)} />
                )}
              </div>
            );

            const traceRow = playing && (
              <>
                {/* What you have spelled so far. Tapping has no finger on the
                    board to look at, so the trace needs to be readable as text. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: narrow ? 10 : 12, flexWrap: 'wrap', padding: narrow ? '12px 0 0' : '18px 0 0', marginLeft: narrow ? 0 : 188 }}>
                  <span className="st-k">Tracing</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }} aria-live="polite" aria-label={trace.length ? `Tracing ${trace.map((id) => cells[id].ch).join('')}` : 'Nothing traced'}>
                    {trace.map((id, i) => (
                      <span key={`${id}-${i}`} style={{ width: narrow ? 34 : 36, height: narrow ? 38 : 40, boxSizing: 'border-box', borderRadius: 8, background: bad ? (STAGE ? 'var(--stg-surf2)' : '#fee2e2') : A_FILL, border: bad ? `1.5px solid ${BAD}` : 'none', color: bad ? BAD : ON_ACC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: narrow ? 19 : 20, fontWeight: 800 }}>{cells[id].ch}</span>
                    ))}
                    <span aria-hidden="true" style={{ width: narrow ? 34 : 36, height: narrow ? 38 : 40, boxSizing: 'border-box', borderRadius: 8, border: `1.5px dashed ${CELL_LINE}` }} />
                  </div>
                  {narrow && <div style={{ flex: 1 }} />}
                  <button className="st-clear" onClick={() => setTrace([])} style={{ visibility: trace.length ? 'visible' : 'hidden' }} tabIndex={trace.length ? 0 : -1}>clear</button>
                </div>
                <div style={{ padding: narrow ? '4px 0 0' : '6px 0 0', marginLeft: narrow ? 0 : 188, fontFamily: SANS, fontSize: 12, fontWeight: 600, lineHeight: 1.45, color: FADED }}>
                  Tap letters one at a time or drag through them. Diagonals count. A wrong trace costs nothing.
                </div>
              </>
            );

            const threadBtn = (
              <button className="st-btn" onClick={revealThread} disabled={g.thread} style={narrow ? { flex: 1 } : undefined}>
                <Lightbulb size={15} />{g.thread ? 'Thread shown' : PUZZLE.sunday ? 'Name the threads' : 'Name the thread'}
              </button>
            );
            const startBtn = <button className="st-btn" onClick={showStart} style={narrow ? { flex: 1 } : undefined}><Lightbulb size={15} />Show me a start</button>;
            const giveBtn = <button className="st-btn" onClick={giveUp}><Flag size={15} />Give up</button>;
            const costLine = <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED }}>Each costs a hint.</span>;

            const stuckCard = stuck && (
              <div style={{ border: `1.5px solid var(--stg-line, ${COLORS.accentDeep})`, borderRadius: 10, padding: '12px 14px', margin: '16px 0 0', background: `var(--stg-surf, ${COLORS.accentSoft})` }}>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 14, color: ACC_DEEP_INK, marginBottom: 4 }}>
                  Nothing left to read. That is our fault, not yours.
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: FADED, fontWeight: 600, marginBottom: 10 }}>
                  This board should never have been able to do that. Put {unstickTo === 0 ? 'the board' : 'it'} back
                  to where it can still be finished and try another order. It costs nothing: no hint, no time,
                  no points.
                </div>
                <button className="st-btn primary" onClick={unstick}>
                  <RotateCcw size={15} />
                  {unstickTo === 0
                    ? 'Put every word back'
                    : `Put ${foundWords.length - unstickTo} word${foundWords.length - unstickTo > 1 ? 's' : ''} back`}
                </button>
              </div>
            );

            const threadLine = g.thread && (
              <div className="st-k" style={{ color: ACC_DEEP_INK, padding: '6px 0 0' }}>Thread: {threadLabel}</div>
            );

            if (narrow) {
              return (
                <div style={{ paddingBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <span className="st-k">Dig log &middot; {foundWords.length} of {TOTAL} lifted</span>
                      <span className="st-k">Hints <b>{g.hints}</b></span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {logRows.map((s) => (
                        <span key={s.k} aria-label={s.found ? `Lifted ${s.t}` : (s.missed ? `Missed ${s.t}` : `Buried word, ${s.k.length} letters`)}
                          style={{ flex: `${s.found || s.missed ? 1.15 : 1} 1 0`, minWidth: 54, height: 38, boxSizing: 'border-box', borderRadius: 9, border: `1.5px ${s.found ? 'solid' : 'dashed'} ${rowEdge(s)}`, background: s.found ? A_TINT : 'transparent', color: rowInk(s), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontFamily: SANS, fontSize: 13, fontWeight: 800, letterSpacing: s.found || s.missed ? '0.06em' : '0.18em' }}>{s.t}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED }}>All {TOTAL} share {lede}.</span>
                    {threadLine}
                  </div>
                  <div style={{ paddingTop: 12 }}>{site}</div>
                  {traceRow}
                  {stuckCard}
                  {playing && (
                    <>
                      <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>{threadBtn}{startBtn}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8 }}>{costLine}{giveBtn}</div>
                    </>
                  )}
                </div>
              );
            }

            // The rail's lit length runs to the last lifted word's node. Each log
            // row is a 13px tag line, a 5px gap and a 36px chip, 12px apart.
            const PITCH = 66;
            const railLit = foundWords.length ? Math.min((foundWords.length - 1) * PITCH + 22, (logRows.length - 1) * PITCH + 22) : 0;
            return (
              <div style={{ paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: FADED }}>{TOTAL} words buried in {rows * cols} letters, all from {lede}.</span>
                  <span className="st-k" style={{ flex: '0 0 auto' }}>Hints <b>{g.hints}</b></span>
                </div>
                {threadLine}
                <div style={{ display: 'flex', gap: 24, paddingTop: 16 }}>
                  <div style={{ width: 164, flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
                    <span className="st-k">Dig log</span>
                    <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, padding: '2px 0 12px' }}>{foundWords.length} of {TOTAL} lifted</span>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 18 }}>
                      <span aria-hidden="true" style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 3, borderRadius: 2, background: CELL_LINE }} />
                      {railLit > 0 && <span aria-hidden="true" style={{ position: 'absolute', left: 5, top: 6, height: railLit, width: 3, borderRadius: 2, background: A_FILL }} />}
                      {logRows.map((s) => (
                        <div key={s.k} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <span aria-hidden="true" style={{ position: 'absolute', left: -18, top: 21, width: 13, height: 13, boxSizing: 'border-box', borderRadius: 7, background: s.found ? A_FILL : GROUND, border: `2px solid ${s.found ? A_FILL : rowEdge(s)}` }} />
                          <span className="st-k" style={{ fontSize: 10, lineHeight: '13px', color: rowInk(s) }}>{s.tag}</span>
                          <span aria-label={s.found ? `Lifted ${s.t}` : (s.missed ? `Missed ${s.t}` : `Buried word, ${s.k.length} letters`)}
                            style={{ height: 36, boxSizing: 'border-box', borderRadius: 9, border: `1.5px ${s.found ? 'solid' : 'dashed'} ${rowEdge(s)}`, background: s.found ? A_TINT : 'transparent', color: rowInk(s), display: 'flex', alignItems: 'center', padding: '0 12px', fontFamily: SANS, fontSize: 15, fontWeight: 800, letterSpacing: s.found || s.missed ? '0.08em' : '0.3em', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.t}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14 }}>
                      <span aria-hidden="true" style={{ ...hatch(10), width: 22, flex: '0 0 auto', borderRadius: 2 }} />
                      <span className="st-k">Bedrock, the floor</span>
                    </div>
                  </div>
                  {site}
                </div>
                {traceRow}
                {stuckCard}
                {playing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 16 }}>
                    {threadBtn}{startBtn}{costLine}
                    <div style={{ flex: 1 }} />
                    {giveBtn}
                  </div>
                )}
              </div>
            );
          })()}


          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Strata"
              catRank={catRank}
              outcome={won ? 'won' : (foundWords.length > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (foundWords.length > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${foundWords.length}/${TOTAL}`} found \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Strata all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Hints"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/strata?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Strata', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/strata?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="strata" name="Strata" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="strata" name="Strata" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
            {!focusMode && <AddToHome name="Strata" />}
            <div id="stf-stats-slot" />
            {!LOFT && (
            <DailyGamesGrid
              self="strata"
              maxWidth={640}
              replay={!playing ? resetGame : null}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="strata" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
            )}
          </div>
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="strata"
          won={won}
          completed
          headline={won ? <>Down to bedrock</> : <>{foundWords.length} of {TOTAL}</>}
          subline={<>Strata #{PUZZLE.num} &middot; {foundWords.length}/{TOTAL} &middot; {g.hints} hint{g.hints === 1 ? '' : 's'} &middot; {elapsed}</>}
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 470, fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <HelpCircle size={19} color={COLORS.accent} />
              <b style={{ fontSize: 17, color: INK }}>How Strata works</b>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 10px' }}>
              Every letter on the grid belongs to one of today&rsquo;s hidden words, and the words are all
              members of {PUZZLE.sunday ? 'two categories' : 'a category'} you are not told. Trace a word through
              neighbouring letters and it lifts out. The letters above it then fall, which is the point:
              most of the words cannot be read until the board has collapsed under them.
            </p>
            <ul style={{ fontSize: 13.5, lineHeight: 1.7, color: INK, margin: '0 0 12px', paddingLeft: 20 }}>
              <li>Tap the letters one at a time, or hold and drag through them. Diagonals count.</li>
              <li>Tapping the letter you are on drops the trace; tapping an earlier one walks back to it.</li>
              <li>A word is taken the moment your trace spells it. There is nothing to press.</li>
              <li>A wrong trace costs nothing, and there is no order that can strand you.</li>
              <li>Two hints are on offer: name the thread, or light up where a word starts.</li>
              <li>{TOTAL} words today{PUZZLE.sunday ? ', across two threads on a bigger grid' : ''}.</li>
            </ul>
            <button className="st-btn primary" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
          </div>
        </div>
      )}

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
