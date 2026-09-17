'use client';

// Chomp — the daily route puzzle.
//
// A handful of mascots on a small board, eaten in order, one square per
// keypress. The BULLDOG always goes first and the rest are dealt fresh daily;
// the cast runs six to seven on a weekday and the full eight on a Sunday. Every
// board is 7x7 from 2026-08-11, but read the size off PUZZLE.w rather than
// assuming it: this game has been 13x13, then 10x10, then a mix of 8x8 and 7x7,
// and the copy on this page outlived every one of them. Two rules carry it, and
// everything else here serves them:
//
//   1. THE BODY NEVER RETRACTS. Every square the head touches is yours for the
//      rest of the run, so your trail is a permanent wall. The shortest hop to
//      the ibis is very often the move that strands the longhorn behind you.
//   2. A MASCOT IS SOLID UNTIL ITS TURN. You cannot cross the tiger on the way
//      to the gamecock. That falls out of rule 1: with a permanent trail, crossing
//      one early would leave it stranded under your own body forever, and a
//      visible wall is fairer than a board ruined twenty moves before anyone
//      notices.
//
// Boards from 2026-08-22 also carry BLEACHERS (`PUZZLE.walls`): bolted-down
// squares the head can never enter, rendered as dark benches. Movement legality
// lives in lib/chomp-engine.js; this file only draws them. Earlier boards have
// no walls field and render exactly as before.
//
// YOU DO NOT NEED THEM ALL (owner, 2026-08-08). The score is how far down the
// cast you got, so a run that stalls on the fifth still scores five. That is
// what makes a hard board survivable.
//
// GIVE UP, THEN TRY AGAIN (owner, 2026-08-08). The control sits at the FOOT of
// the card, not in the game furniture, the way Four does it: while you are
// playing it reads Give up and books the run exactly as it stands; once the run
// is over it becomes Try again and re-deals the same board. Only the first
// result is leaderboard eligible, so a retry costs nothing and cannot buy a
// better place. Give up is two-tap armed and has no keyboard shortcut, because
// a control that costs you the day should not be one stray keypress away.
//
// RESTART SITS BESIDE IT (owner, 2026-08-22). Give up followed by Try again was
// the only way back to a fresh board, which is two presses and a card in between
// for the thing a boxed-in player wants most. Restart is those two presses in
// one: it books the run exactly as Give up does and re-deals on the spot, with
// no end card. It RECORDS, and that is the point rather than an oversight -- a
// restart that recorded nothing would let a player re-deal until the board went
// their way and post only that, which is precisely what the first-attempt rule
// exists to stop. Two-tap armed like Give up, and each disarms the other.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, RotateCcw, Flag } from 'lucide-react';
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
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import useEndHold, { HOLD_SHORT, HOLD_LONG } from '../useEndHold';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { notifyShareCredit } from '../ShareCreditPop';
import { T } from '@/lib/theme';
import { DIRS, freshState, applyMove, anyLegal, isCleared, fillOf } from '@/lib/chomp-engine';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#a8430f', accentSoft: '#fbeadf', block: '#dc2626',
};
const HELP_KEY = 'sot_chomp_help_seen';
const STATS_KEY = 'sot_chomp_stats';
const BLOCK_MS = 260;
// The board is inset by PAD. Without it the outer ring of squares sat flush
// against the canvas edge and the rounded backing plate clipped their corners,
// so the edge cells read as cut off. Every draw below is offset by PAD and the
// canvas is sized for it.
const PAD = 5;
const LABEL = {
  bulldog: 'Bulldog', ibis: 'Ibis', gamecock: 'Gamecock', wildcat: 'Wildcat',
  seminole: 'Seminole', tiger: 'Tiger', eagle: 'Eagle', longhorn: 'Longhorn',
  knight: 'Knight', smokey: 'Smokey', bull: 'Bull',
};
// The cast ramps 8,8,9,9,9,10,11 through the week, so the win headline cannot
// name a number. It read "All seven." on every board until 2026-08-12.
const NUMWORD = { 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven' };

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
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };
const nf = (n) => Number(n || 0).toLocaleString('en-US');
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
// How far down the cast you got, out of ten. Clearing every mascot is the only
// way to a 10; everything short of that scales.
function scoreOf(eaten, total) {
  if (eaten >= total) return 10;
  return Math.max(0, Math.min(9, Math.round((eaten / total) * 10)));
}

// ---- the gator's head ------------------------------------------------------
// Drawn in LOCAL coordinates with +x pointing the way it is travelling, then
// rotated into place. Everything below is therefore written as if the gator
// always faces right, which is the only way jaw geometry stays readable.
//
// It is a long snout rather than a disc: two jaw halves hinged at the back, with
// teeth along the bite line, an eye ridge sitting proud on top, and a nostril at
// the tip. The jaws swing open on the move that swallows a mascot and clamp shut
// when the run ends.
const GATOR = { skin: '#3f8f3f', dark: '#2a6b2a', belly: '#8fca7a', teeth: '#ffffff' };

// THE BOARD'S PALETTE, read off the stage tokens at draw time.
//
// Canvas cannot use a CSS variable, so the values have to be resolved from the
// element and passed in. Doing it per draw rather than once at mount is what
// makes the board follow the light switch and the category ramp without any
// prop threading: both change the computed value, and the next frame picks it up.
//
// The gator takes the CATEGORY ACCENT rather than its old green, so the board
// reads as part of the page instead of as a widget dropped onto it. That frees
// the accent from also marking the next mascot, which now takes a plain ink ring:
// on a dark stage that is the highest-contrast marker available and it never
// competes with the animal.
function boardPalette(el) {
  const cs = typeof window !== 'undefined' && el ? getComputedStyle(el) : null;
  const v = (name, fallback) => {
    if (!cs) return fallback;
    const got = cs.getPropertyValue(name);
    return got && got.trim() ? got.trim() : fallback;
  };
  const acc = v('--stg-acc', GATOR.skin);
  return {
    plate: v('--stg-panel', '#ffffff'),
    grid: v('--stg-line', '#eef1f5'),
    edge: v('--stg-line2', v('--stg-line', '#e2e6ec')),
    bench: v('--stg-line2', '#333a48'),
    benchLine: v('--stg-mute2', 'rgba(255,255,255,0.30)'),
    ink: v('--stg-ink', '#1c1e24'),
    mute: v('--stg-mute2', '#c4ccd8'),
    onramp: v('--stg-onramp', '#ffffff'),
    skin: acc,
    belly: acc,
    dark: v('--stg-onramp', GATOR.dark),
    teeth: v('--stg-ink', '#ffffff'),
    accent: acc,
  };
}
function drawHead(ctx, cellXY, facing, cell, dead, chewing, pad, pal = boardPalette(null)) {
  const [hx, hy] = cellXY;
  const f = facing && (facing[0] || facing[1]) ? facing : [1, 0];
  const cx = pad + hx * cell + cell / 2, cy = pad + hy * cell + cell / 2;
  const c = cell;
  const gape = dead ? 0.04 : chewing ? 0.46 : 0.26;   // radians, per jaw

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.atan2(f[1], f[0]));

  // one jaw: a wedge from the hinge out to the snout, drawn either side of the
  // bite line. `sign` is -1 for the upper jaw, +1 for the lower.
  const jaw = (sign, len, thick, fill) => {
    ctx.save();
    ctx.rotate(sign * gape);
    ctx.beginPath();
    ctx.moveTo(-c * 0.34, 0);
    ctx.lineTo(len, 0);
    ctx.quadraticCurveTo(len + c * 0.05, sign * thick * 0.5, len - c * 0.06, sign * thick);
    ctx.lineTo(-c * 0.26, sign * thick * 1.05);
    ctx.quadraticCurveTo(-c * 0.40, sign * thick * 0.6, -c * 0.34, 0);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    // teeth along the bite line, biggest at the front
    if (gape > 0.10) {
      ctx.fillStyle = pal.teeth;
      for (let i = 0; i < 4; i++) {
        const x = len - c * 0.10 - i * c * 0.10;
        const w = c * (0.055 - i * 0.006);
        ctx.beginPath();
        ctx.moveTo(x - w, 0);
        ctx.lineTo(x + w, 0);
        ctx.lineTo(x, sign * c * 0.11);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  };

  jaw(1, c * 0.46, c * 0.20, pal.belly);     // lower jaw, paler, drawn first
  jaw(-1, c * 0.52, c * 0.26, pal.skin);     // upper jaw, on top

  // the eye ridge, sitting proud on the skull behind the snout
  ctx.save();
  ctx.rotate(-gape);
  const ex = -c * 0.14, ey = -c * 0.24;
  ctx.fillStyle = pal.skin;
  ctx.beginPath(); ctx.arc(ex, ey, c * 0.13, 0, 7); ctx.fill();
  ctx.fillStyle = dead ? pal.dark : pal.teeth;
  ctx.beginPath(); ctx.arc(ex, ey, c * 0.085, 0, 7); ctx.fill();
  if (dead) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, c * 0.035);
    ctx.beginPath();
    ctx.moveTo(ex - c * 0.05, ey - c * 0.05); ctx.lineTo(ex + c * 0.05, ey + c * 0.05);
    ctx.moveTo(ex + c * 0.05, ey - c * 0.05); ctx.lineTo(ex - c * 0.05, ey + c * 0.05);
    ctx.stroke();
  } else {
    // a slit pupil, because a round one reads as a frog
    ctx.fillStyle = '#0b0d12';
    ctx.beginPath();
    ctx.ellipse(ex, ey, Math.max(0.7, c * 0.022), c * 0.062, 0, 0, 7);
    ctx.fill();
  }
  // nostril at the very tip of the snout
  ctx.fillStyle = pal.dark;
  ctx.beginPath(); ctx.arc(c * 0.40, -c * 0.13, Math.max(0.8, c * 0.032), 0, 7); ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ---- stats (identical shape to every other daily) --------------------------
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
  const rec = (s && s.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

export default function ChompClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const CAST = PUZZLE.cast;
  const NPEL = CAST.length;
  const STORE_KEY = `sot_chomp_${PUZZLE.num}`;
  const REC_KEY = `sot_chomp_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(() => freshState(PUZZLE));
  const gRef = useRef(g);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(true);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [stats, setStats] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [armGive, setArmGive] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  const [sprites, setSprites] = useState({});
  const cvsRef = useRef(null);
  const boxRef = useRef(null);
  const cellRef = useRef(30);
  const blockRef = useRef(null);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);

  const playing = g.status === 'playing';
  // THE FINISHED BOARD HOLDS BEFORE THE CARD (2026-08-22). Chomp had no hold at
  // all, so the stage flipped in the same tick the run ended and the walled-in
  // gator, which IS the explanation of the loss, was covered before it was read.
  // Longer on a loss than a win, per useEndHold: a clear is a move you played on
  // purpose, a wall-in is one you did not see coming.
  //
  // holdEnd / releaseEnd are pulled off as their own consts because they are the
  // stable callbacks; `endHold` itself is a fresh literal every render and must
  // never be a dependency.
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('chomp');  const iq = useIqStanding({ game: 'chomp', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const STAGE = isStage('chomp', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('chomp');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('chomp'), '--stg-acc-lt': gameColorLight('chomp'), '--stg-onramp-lt': gameOnrampLight('chomp'), '--stg-acc-ink-lt': gameAccentInkLight('chomp') };
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
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'chomp', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'chomp', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'chomp', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'chomp', active: LOFT && !playing });

  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  // `started` means "mid-run" and goes false the instant a run ends, so it is
  // the WRONG gate for the footer controls: it took Try again down with it and
  // left no way back onto the board. `engaged` means "has been started at all".
  const engaged = !!g.t0;
  const cleared = g.pi >= NPEL;
  const over = g.status !== 'playing';
  const score10 = scoreOf(g.pi, NPEL);
  const won = over && cleared;
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);
  const elapsed = g.ms + (started && !over && g.tMark ? Date.now() - g.tMark : 0);
  const fillPct = Math.round(fillOf(PUZZLE, g) * 100);

  // the mascot art, loaded once
  useEffect(() => {
    let live = true;
    const out = {};
    let left = CAST.length;
    CAST.forEach((m) => {
      const im = new window.Image();
      im.src = `/games/chomp/${m}.png`;
      im.onload = im.onerror = () => { left -= 1; if (!left && live) setSprites({ ...out }); };
      out[m] = im;
    });
    return () => { live = false; };
  }, [CAST]);

  // ---- hydrate -------------------------------------------------------------
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 2 && Array.isArray(saved.body) && saved.body.length) {
      const s = { ...freshState(PUZZLE), ...saved, tMark: Date.now() };
      gRef.current = s; setG(s);
    }
    try { setGateRules(!localStorage.getItem(HELP_KEY)); } catch (e) {}
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORE_KEY]);

  useEffect(() => {
    if (!started || over) return;
    const i = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(i);
  }, [started, over]);

  useEffect(() => {
    if (!hydrated) return;
    const anon = getAnonId();
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    fetch(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
      .catch(() => {});
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) });
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing';
      if (done || g.t0) localStorage.setItem('sot_chomp_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_chomp_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0]);

  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.moves === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round(cur.ms / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return {
      quizId: PUZZLE.quizId, score: scoreOf(cur.pi, NPEL), total: 10,
      correct: cur.pi >= NPEL ? 1 : 0, guessesUsed: cur.moves, timeElapsed: el, abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((g2) => {
    abandon.markFlushed();
    const done = g2.pi >= NPEL;
    // Every LIVE ending funnels through here and a hydrated finished run never
    // does, so returning to an old board still shows the card straight away.
    holdEnd(done ? HOLD_SHORT : HOLD_LONG);
    const sc = scoreOf(g2.pi, NPEL);
    const el = Math.max(1, Math.round(g2.ms / 1000));
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: 10, g: g2.moves, won: done })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score: sc, total: 10, correct: done ? 1 : 0,
          guessesUsed: g2.moves, timeElapsed: el,   // moves: ties break on fewest, then time
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, NPEL, identity]);

  const finish = useCallback((st) => {
    commit({ ...st, status: 'over', tEnd: Date.now() });
    postResult({ ...st, status: 'over' });
  }, [commit, postResult]);

  // ---- moving --------------------------------------------------------------
  const move = useCallback((which) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const d = DIRS[which];
    if (!d) return;
    const now = Date.now();
    const moved = applyMove(PUZZLE, cur, d);
    // an illegal move is REFUSED, never fatal, and never costs a move
    if (!moved) {
      const h = cur.body[0];
      setBlocked({ x: h[0] + d[0], y: h[1] + d[1], at: now });
      return;
    }
    // an idle stretch over two minutes is thinking, not playing, so the clock
    // that breaks leaderboard ties stops counting it
    const next = { ...moved, ms: cur.ms + Math.min(120000, now - (cur.tMark || now)), tMark: now };
    if (isCleared(PUZZLE, next) || !anyLegal(PUZZLE, next)) { finish(next); return; }
    commit(next);
  }, [PUZZLE, commit, finish]);

  const DAS = 250, ARR = 85;
  const repRef = useRef({ t: null, i: null });
  const stopRepeat = useCallback(() => {
    if (repRef.current.t) { clearTimeout(repRef.current.t); repRef.current.t = null; }
    if (repRef.current.i) { clearInterval(repRef.current.i); repRef.current.i = null; }
  }, []);
  const startRepeat = useCallback((which) => {
    stopRepeat();
    move(which);
    repRef.current.t = setTimeout(() => { repRef.current.i = setInterval(() => move(which), ARR); }, DAS);
  }, [move, stopRepeat]);
  useEffect(() => stopRepeat, [stopRepeat]);

  const holdProps = (which) => ({
    onPointerDown: (e) => { e.preventDefault(); e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); startRepeat(which); },
    onPointerUp: stopRepeat, onPointerLeave: stopRepeat, onPointerCancel: stopRepeat,
    onContextMenu: (e) => e.preventDefault(),
  });

  // NO drag-to-move on the board (owner, 2026-08-08). The swipe handler that
  // used to live here captured pointer events over the canvas, so a thumb trying
  // to SCROLL THE PAGE dragged the gator the length of the board instead. On a
  // phone the d-pad is the only movement control; the canvas is now inert and
  // `touchAction` is left alone so the page scrolls over it like any other
  // element.

  // ---- canvas --------------------------------------------------------------
  // sizeBoard redraws through drawRef rather than closing over `draw`. It only
  // depends on the board dimensions, so a captured `draw` would be the one from
  // first render, back when the mascot art had not loaded. On desktop nothing
  // resizes after that and the state-driven redraw covers it, but a phone fires
  // resize every time the address bar hides, which repainted the board with an
  // empty sprite table and made the mascots vanish mid-run.
  const drawRef = useRef(null);
  const sizeBoard = useCallback(() => {
    const box = boxRef.current, cvs = cvsRef.current;
    if (!box || !cvs) return;
    const fw = Math.max(140, box.clientWidth);
    const fh = (typeof window !== 'undefined' ? window.innerHeight : 800) - 330;
    // The ceiling is per square, so a smaller board must be allowed BIGGER
    // squares or it shrinks on screen as the puzzles get harder. 46 keeps a 7x7
    // and an 8x8 at roughly the width the old 10x10 filled.
    const cell = Math.max(15, Math.min(46, Math.floor(Math.min((fw - PAD * 2) / PUZZLE.w, (fh - PAD * 2) / PUZZLE.h))));
    cellRef.current = cell;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const W = PUZZLE.w * cell + PAD * 2, H = PUZZLE.h * cell + PAD * 2;
    cvs.width = W * dpr; cvs.height = H * dpr;
    cvs.style.width = `${W}px`; cvs.style.height = `${H}px`;
    cvs.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    if (drawRef.current) drawRef.current();
  }, [PUZZLE.w, PUZZLE.h]);

  const draw = useCallback(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const cell = cellRef.current;
    const W = PUZZLE.w * cell + PAD * 2, H = PUZZLE.h * cell + PAD * 2;
    const st = gRef.current;
    const pal = boardPalette(cvs);
    // board coordinates -> canvas coordinates, gutter included
    const px = (x) => PAD + x * cell;
    const rr = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = pal.plate; rr(0, 0, W, H, 12); ctx.fill();
    ctx.strokeStyle = pal.grid; ctx.lineWidth = 1;
    for (let i = 1; i < PUZZLE.w; i++) { ctx.beginPath(); ctx.moveTo(px(i), PAD); ctx.lineTo(px(i), PAD + PUZZLE.h * cell); ctx.stroke(); }
    for (let i = 1; i < PUZZLE.h; i++) { ctx.beginPath(); ctx.moveTo(PAD, px(i)); ctx.lineTo(PAD + PUZZLE.w * cell, px(i)); ctx.stroke(); }
    ctx.strokeStyle = pal.edge; ctx.lineWidth = 1;
    rr(PAD - 0.5, PAD - 0.5, PUZZLE.w * cell + 1, PUZZLE.h * cell + 1, 4); ctx.stroke();

    // ---- the bleachers: bolted down, never enterable ------------------------
    for (const [wx, wy] of (PUZZLE.walls || [])) {
      ctx.fillStyle = pal.bench;
      rr(px(wx) + 1.5, px(wy) + 1.5, cell - 3, cell - 3, 4); ctx.fill();
      ctx.strokeStyle = pal.benchLine; ctx.lineWidth = Math.max(1, cell * 0.045);
      for (let k = 1; k <= 2; k++) {
        const yy = px(wy) + (cell * k) / 3 + 1;
        ctx.beginPath(); ctx.moveTo(px(wx) + cell * 0.18, yy); ctx.lineTo(px(wx) + cell * 0.82, yy); ctx.stroke();
      }
    }

    // ---- the gator's body ---------------------------------------------------
    // Solid green, the same skin as the head, and drawn as one continuous animal
    // rather than a row of tiles: each segment is a slab that OVERLAPS its
    // neighbours along the direction of travel, so the joins disappear. The last
    // segment tapers to a tail and a few segments carry legs, which is what
    // makes it read as growing rather than as a trail of paint.
    const body = st.body;
    const n = body.length;
    const dirTo = (a, b) => [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
    ctx.fillStyle = pal.skin;
    for (let i = 1; i < n; i++) {
      const [bx, by] = body[i];
      const inset = cell * 0.13;
      // grow the slab towards each neighbour so consecutive cells fuse
      let x0 = px(bx) + inset, y0 = px(by) + inset;
      let x1 = px(bx) + cell - inset, y1 = px(by) + cell - inset;
      for (const nb of [body[i - 1], body[i + 1]]) {
        if (!nb) continue;
        const d = dirTo(body[i], nb);
        if (d[0] > 0) x1 = px(bx) + cell;
        if (d[0] < 0) x0 = px(bx);
        if (d[1] > 0) y1 = px(by) + cell;
        if (d[1] < 0) y0 = px(by);
      }
      rr(x0, y0, x1 - x0, y1 - y0, Math.max(2, cell * 0.16));
      ctx.fill();

      // legs, on every third segment, poking out either side of the spine
      if (i % 3 === 1 && i < n - 1) {
        const d = dirTo(body[i], body[i - 1]);
        const perp = [-d[1], d[0]];
        const cxm = px(bx) + cell / 2, cym = px(by) + cell / 2;
        for (const sgn of [1, -1]) {
          const lx = cxm + perp[0] * sgn * cell * 0.36, ly = cym + perp[1] * sgn * cell * 0.36;
          ctx.beginPath();
          ctx.ellipse(lx, ly, cell * 0.15, cell * 0.09,
            Math.atan2(perp[1] * sgn, perp[0] * sgn), 0, 7);
          ctx.fill();
        }
      }
    }
    // the tail: a wedge running off the last segment, away from the body
    if (n > 1) {
      const tail = body[n - 1];
      const d = dirTo(body[n - 2], tail);
      const cxm = px(tail[0]) + cell / 2, cym = px(tail[1]) + cell / 2;
      const perp = [-d[1], d[0]];
      ctx.beginPath();
      ctx.moveTo(cxm + perp[0] * cell * 0.30, cym + perp[1] * cell * 0.30);
      ctx.lineTo(cxm + d[0] * cell * 0.62, cym + d[1] * cell * 0.62);
      ctx.lineTo(cxm - perp[0] * cell * 0.30, cym - perp[1] * cell * 0.30);
      ctx.closePath();
      ctx.fillStyle = pal.skin;
      ctx.fill();
    }

    // ---- the mascots still to eat, the next one lit -------------------------
    for (let i = st.pi; i < PUZZLE.pellets.length; i++) {
      const [mx, my] = PUZZLE.pellets[i];
      const next = i === st.pi;
      if (next) {
        // The accent belongs to the gator now, so the one square the player is
        // aiming at is marked in ink instead: the strongest contrast the stage
        // has, in either register, and it cannot be confused with the animal.
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = pal.ink;
        rr(px(mx) + 1, px(my) + 1, cell - 2, cell - 2, 5); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pal.ink; ctx.lineWidth = 2;
        rr(px(mx) + 1, px(my) + 1, cell - 2, cell - 2, 5); ctx.stroke();
      }
      const im = sprites[CAST[i]];
      ctx.globalAlpha = next ? 1 : 0.7;
      if (im && im.complete && im.naturalWidth) {
        ctx.drawImage(im, px(mx) + 2, px(my) + 2, cell - 4, cell - 4);
      } else {
        // never leave a mascot square blank: if the art has not landed yet, or
        // failed, fall back to a numbered disc so the board is always playable
        ctx.beginPath();
        ctx.arc(px(mx) + cell / 2, px(my) + cell / 2, cell * 0.34, 0, 7);
        ctx.fillStyle = next ? pal.ink : pal.mute;
        ctx.fill();
        ctx.fillStyle = next ? pal.plate : pal.onramp;
        ctx.font = `700 ${Math.round(cell * 0.44)}px ${SANS}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), px(mx) + cell / 2, px(my) + cell / 2 + 0.5);
      }
      ctx.globalAlpha = 1;
    }

    drawHead(ctx, st.body[0], st.facing, cell, st.status !== 'playing', st.chewing, PAD, pal);

    const bl = blockRef.current;
    if (bl && Date.now() - bl.at < BLOCK_MS && bl.x >= 0 && bl.y >= 0 && bl.x < PUZZLE.w && bl.y < PUZZLE.h) {
      ctx.strokeStyle = COLORS.block; ctx.lineWidth = 2;
      rr(px(bl.x) + 2, px(bl.y) + 2, cell - 4, cell - 4, 3); ctx.stroke();
    }
  }, [PUZZLE.w, PUZZLE.h, PUZZLE.pellets, PUZZLE.walls, CAST, sprites]);

  useEffect(() => { drawRef.current = draw; blockRef.current = blocked; draw(); }, [draw, g, blocked, sprites]);
  // the art arriving must repaint at the CURRENT size, not just on next state
  useEffect(() => { if (drawRef.current) drawRef.current(); }, [sprites]);
  useEffect(() => {
    if (!armGive) return undefined;
    const t = setTimeout(() => setArmGive(false), 3500);
    return () => clearTimeout(t);
  }, [armGive]);
  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);
  useEffect(() => {
    if (!blocked) return;
    const t = setTimeout(() => setBlocked(null), BLOCK_MS);
    return () => clearTimeout(t);
  }, [blocked]);
  useEffect(() => {
    if (!hydrated) return;
    sizeBoard();
    const on = () => sizeBoard();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [hydrated, sizeBoard, started, preStart]);

  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    const now = Date.now();
    commit({ ...cur, t0: now, tMark: now });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(sizeBoard, 0);
  }
  // GIVE UP books the run exactly as it stands and ends it; TRY AGAIN then
  // re-deals the same board. Two controls, one at a time, because they are two
  // different decisions: the first costs you the day, the second costs nothing
  // because the result is already recorded and recordStat is write-once.
  //
  // Give up is two-tap armed, in the house pattern Four uses: the armed label is
  // short and the button reserves a fixed width, so the row cannot reflow and
  // slide out from under a thumb mid-confirm. The consequence prints on its own
  // line below, where it cannot move the button either.
  const giveUp = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const now = Date.now();
    const ended = { ...cur, ms: cur.ms + Math.min(120000, now - (cur.tMark || now)) };
    commit({ ...ended, status: 'over', tEnd: now });
    postResult({ ...ended, status: 'over' });
  }, [commit, postResult]);

  const tryAgain = useCallback(() => {
    releaseEnd();
    const now = Date.now();
    // t0 is set straight away rather than dropping back to the start tile: that
    // tile exists to keep the FIRST attempt's clock honest, and this is not one.
    commit({ ...freshState(PUZZLE), t0: now, tMark: now });
    setBlocked(null);
    // FALSE, not true (fixed 2026-08-12). endClosed hides the end card, and
    // nothing else in this file ever cleared it, so a player who replayed once
    // and then CLEARED THE BOARD got no end card: the run finished, the result
    // posted, and the screen just sat there looking frozen. Replay is free here
    // and the rules push it, so the winning run is usually the second one and
    // almost every clear was swallowed. Setting it false on re-deal is the house
    // pattern (Four, Paths and Tuck all do it in resetGame). The card is hidden
    // while a run is live by the !playing gate, never by this flag.
    setEndClosed(false);
  }, [releaseEnd, PUZZLE, commit]);

  // RESTART = the give-up booking plus the re-deal, in one press. It posts the
  // run exactly as giveUp does (same clock arithmetic, same postResult, so
  // markFlushed suppresses any later abandon row and write-once recordStat keeps
  // the first result) and then hands straight to tryAgain, which releases the
  // end hold and deals the board again. It deliberately does NOT commit the
  // ended state first: tryAgain's own commit lands a tick later and would only
  // overwrite it, and nothing renders in between.
  const restartRun = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const now = Date.now();
    const ended = { ...cur, ms: cur.ms + Math.min(120000, now - (cur.tMark || now)) };
    postResult({ ...ended, status: 'over' });
    tryAgain();
  }, [postResult, tryAgain]);

  useEffect(() => {
    const onKey = (e) => {
      if (showHelp) { if (e.key === 'Escape') setShowHelp(false); return; }
      const map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
      };
      if (!map[e.key]) return;
      e.preventDefault();
      if (e.repeat) return;   // a held key is not a sequence of moves: every step here is permanent
      move(map[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, showHelp]);

  // ---- share ---------------------------------------------------------------
  // Counts only. Nothing here describes the route, so a shared result can never
  // hand somebody the board.
  function shareText() {
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    const line = cleared
      ? `all ${NPEL} in ${g.moves} moves`
      : `${g.pi}/${NPEL} · boxed in after ${g.moves} moves`;
    return `Chomp #${PUZZLE.num}${sun} · ${line}\nmindloftdaily.com/chomp`;
  }
  function copyShare() {
    const txt = shareText();
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
      lead={`Eat today's ${NPEL} mascots in order. Every square you touch stays yours, so your own trail is the maze, and today there is exactly ONE route that gets all ${NPEL}.`}
      banner={`Everyone gets the same board today${PUZZLE.sunday ? ", and today's Sunday Edition is the bigger " + PUZZLE.w + "x" + PUZZLE.h + " board with all " + NPEL + " mascots" : ''}.`}
      sub="The bulldog always goes first. Everything after it is a fresh order every day, and the cast gets SHORTER through the week: each mascot is a signpost on the one route, so the fewer of them there are, the more of it you have to work out." 
      steps={[
        <>Move one square at a time with the <b>arrow keys</b> or the pad. Nothing moves until you do.</>,
        <>Your body <b>never shrinks</b>. Where you have been is a wall for the rest of the run.</>,
        <>A mascot whose turn has not come is <b>solid</b>. You cannot cross the tiger to reach the gamecock.</>,
        <>There is <b>exactly one route</b> that eats the whole cast, and it uses <b>every square on the board</b>. Nothing is spare, so there is no second way round.</>,
        <>Steering into a wall is <b>refused</b>, not punished, and costs no move. The run ends only when the head has nowhere legal left to go.</>,
        <>Boxed in early? <b>Give up</b> ends the run and <b>records it as it stands</b>, and then <b>Try again</b> re-deals the same board. <b>Restart</b> does both in one press. Only your first result counts on the leaderboard, so a second run costs nothing.</>,
      ]}
      knack="Work backwards from the last mascot. Because the route has to cover every square and there is only one that does, the question at each junction is never 'which way is quicker' but 'which way can still come back for that corner'. When a move looks obviously right, that is usually the one worth checking."
      footer={`Scored on HOW FAR DOWN THE CAST YOU GOT, so you do not need all ${NPEL}: stall on the fifth and you still score five. Clearing the whole cast is a perfect 10. Ties break on fewest moves, then on time. Giving up or restarting records the run as it stood, and only your first result is leaderboard eligible. The cast SHRINKS through the week, from ten signposts on Monday to eight on Saturday, and the Sunday Edition moves up to an 8x8 board with the whole cast on it.`}
    />
  );

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };
  const dockBtn = { width: 46, height: 44, borderRadius: 9, border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' };
  const stat = (label, value, tone) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stg-ink2, #94a3b8)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: tone || INK, lineHeight: 1.2 }}>{value}</div>
    </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="chomp" name="Chomp" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="chomp" quizId={PUZZLE.quizId}
          name="Chomp"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: g.moves, k: 'moves' },
          ] : [
            { v: g.moves, k: 'moves' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
        <DailyMasthead
          slug="chomp"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>
              Sunday Edition &middot; all {NPEL}
            </span>
          )}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Chomp is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Eat today&apos;s {NPEL} mascots in order. Every square you touch stays yours for the rest of the run, so your trail and the bolted-down bleachers are all that stand in your way. Replay is free.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={startGame} style={{ ...btn, background: STAGE ? STAGE_C : T.cta, borderColor: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>
            {/* the cast, in eating order, with the next one lit */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 11 }}>
              {CAST.map((m, i) => {
                const done = i < g.pi, next = i === g.pi;
                return (
                  <div key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px 2px 3px', borderRadius: 20,
                    fontSize: 10.5, fontWeight: 800, letterSpacing: '0.02em',
                    // THE CAST CHIPS. The pending fill and its ink were both
                    // Loft values, so on the stage the row read as dark grey on
                    // dark (owner, 2026-08-31). The NEXT chip keeps the accent,
                    // which is the one thing the row has to say.
                    background: next ? `var(--stg-chip, ${COLORS.accentSoft})` : done ? 'transparent' : 'var(--stg-surf2, #f4f6f8)',
                    color: next ? `var(--stg-acc-ink, ${COLORS.accent})` : 'var(--stg-ink2, #94a3b8)',
                    opacity: done ? 0.4 : 1,
                  }}>
                    <img src={`/games/chomp/${m}.png`} alt="" width={18} height={18} style={{ display: 'block' }} />
                    {done ? '✓' : LABEL[m]}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, paddingBottom: 11, borderBottom: `1px solid ${COLORS.line}` }}>
              {stat('Eaten', `${g.pi}/${NPEL}`, COLORS.accent)}
              {stat('Moves', nf(g.moves))}
              {stat('Board', `${fillPct}%`)}
              {stat('Clock', fmtTime(elapsed))}
              <button onClick={() => setShowHelp(true)} aria-label="How to play" style={{ border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, background: STAGE ? SURF : '#fff', color: FADED, borderRadius: 7, width: 30, height: 28, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <HelpCircle size={15} />
              </button>
            </div>

            <div ref={boxRef} style={{ display: 'flex', justifyContent: 'center' }}>
              <canvas ref={cvsRef} style={{ display: 'block' }} />
            </div>

            <div className="ch-dock">
              <div className="ch-pad">
                <button className="ch-up" style={dockBtn} {...holdProps('up')} aria-label="Move up">&#9650;</button>
                <button className="ch-lf" style={dockBtn} {...holdProps('left')} aria-label="Move left">&#9664;</button>
                <button className="ch-dn" style={dockBtn} {...holdProps('down')} aria-label="Move down">&#9660;</button>
                <button className="ch-rt" style={dockBtn} {...holdProps('right')} aria-label="Move right">&#9654;</button>
              </div>
            </div>

            <div className="ch-keys" style={{ textAlign: 'center', marginTop: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--stg-ink2, #9aa2b1)' }}>
              &larr; &uarr; &darr; &rarr; or WASD &middot; hold to keep going &middot; a blocked move is refused, not fatal
            </div>
            <div className="ch-touchhint" style={{ display: 'none', textAlign: 'center', marginTop: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--stg-ink2, #9aa2b1)' }}>
              Use the pad to move &middot; hold an arrow to keep going
            </div>

            {engaged && (
              <div style={{ marginTop: 12, paddingTop: 11, borderTop: `1px solid ${COLORS.line}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                    {playing ? 'Where you have been is a wall. There is no take-back.' : 'Your result is recorded. Play it again as often as you like.'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                    {playing ? (
                      <>
                      {/* Both controls reserve a fixed width and each disarms
                          the other, so the row cannot reflow under a thumb
                          mid-confirm and two things can never be armed at once.
                          The icons tell the two 'Press again' states apart, and
                          the consequence line below names whichever is armed. */}
                      <button
                        onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartRun(); } else { setArmGive(false); setArmRestart(Date.now()); } }}
                        title={armRestart ? 'Records this run as it stands, then deals the board again' : 'Record this run as it stands and start the board over'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}
                      >
                        <RotateCcw size={13} style={{ flexShrink: 0 }} /> {armRestart ? 'Press again' : 'Restart'}
                      </button>
                      <button
                        onClick={() => { if (armGive) { if (Date.now() - armGive < ARM_MIN_MS) return; setArmGive(false); giveUp(); } else { setArmRestart(false); setArmGive(Date.now()); } }}
                        title={armGive ? 'Ends the run and records it as it stands' : 'End the run now and record it as it stands'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armGive ? COLORS.block : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}
                      >
                        <Flag size={13} style={{ flexShrink: 0 }} /> {armGive ? 'Press again' : 'Give up'}
                      </button>
                      </>
                    ) : (
                      <button
                        onClick={tryAgain}
                        title="Play this board again. Your recorded result stands."
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: ACC_INK, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}
                      >
                        <RotateCcw size={13} style={{ flexShrink: 0 }} /> Try again
                      </button>
                    )}
                  </span>
                </div>
                {(armGive || armRestart) && (
                  <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: armGive ? COLORS.block : `var(--stg-acc-ink, ${COLORS.accent})`, marginTop: 6, textAlign: 'right', lineHeight: 1.4 }}>
                    {armGive
                      ? 'Ends the run and records it as it stands.'
                      : 'Records this run as it stands, then deals the board again.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Only for players who have not joined. Rendering this unconditionally
            is the bug that makes a signed-in player get asked to sign up on
            every board; Turn and Paths gate it on !identity and so does this. */}

          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Chomp"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${nf(g.moves)} moves`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Chomp all time` : 'all-time rank' }
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
                  href: `/chomp?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Chomp', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/chomp?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: tryAgain },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        {/* end of the navy play stage; everything below is the light tail */}
        </div>
        {!identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        {LOFT && (
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="chomp" name="Chomp" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
        )}
        {!LOFT && (
        <DailyGamesGrid
          self="chomp"
          maxWidth={620}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          divider
          boardSlot={<DailyBoardPanel self="chomp" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
        />
        )}

        {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
        <StageFold />
        <section style={{ display: STAGE ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Chomp</h2>
          <p style={{ margin: '0 0 9px' }}>
            Chomp is a daily route puzzle. A handful of mascots sit on a small board and have to be eaten in order,
            and every square you touch belongs to you for the rest of the run. Nothing chases you and nothing is on a timer.
            The only obstacle is the trail you have already laid, which is why the shortest line to the fourth mascot is
            so often the line that walls off the fifth. The board is as tight as it can be: there is exactly ONE route that
            eats the whole cast, it uses every square on the board, and nothing is spare. One wrong turn in forty-eight
            moves and the run is over.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            You do not need all of them. The score is how far down the cast you got, so a run that stalls still counts.
            Everybody plays the same board on the same day, ties break on fewest moves, and giving up records the run as it
            stood, so the first attempt is the one that counts. The bulldog always leads and the rest are dealt fresh each
            day. Each mascot is a signpost on the one route, so the cast gets shorter through the week, from ten on Monday
            to eight on Saturday; the Sunday Edition moves up to a bigger 8x8 board and puts the whole cast on it.
          </p>
          <p style={{ margin: 0 }}>
            More daily puzzles: <a href="/parker" style={{ color: ACC_INK }}>Parker</a>,{' '}
            <a href="/etch" style={{ color: ACC_INK }}>Etch</a>,{' '}
            <a href="/hedge" style={{ color: ACC_INK }}>Hedge</a>.
          </p>
        </section>
      </div>

      {/* OUTSIDE the page column on purpose: the column is a stacking context and
          the end card's backdrop paints under the header from inside it. */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="chomp"
          won={won}
          quizId={PUZZLE.quizId}
          headline={won ? <>All {NUMWORD[NPEL] || NPEL}.</> : <>You got {g.pi} of {NPEL}</>}
          subline={won
            ? <>{nf(g.moves)} moves &middot; board {fillPct}% full &middot; {fmtTime(g.ms)}</>
            : <>Boxed in on the {LABEL[CAST[g.pi]] || 'next one'} &middot; {nf(g.moves)} moves &middot; board {fillPct}% full</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={tryAgain}
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
        .ch-dock { display: flex; justify-content: center; margin-top: 12px; }
        .ch-pad {
          display: grid;
          grid-template-areas: ". up ." "lf dn rt";
          grid-template-columns: repeat(3, 58px);
          gap: 5px;
          justify-content: center;
        }
        .ch-up { grid-area: up; }
        .ch-lf { grid-area: lf; }
        .ch-dn { grid-area: dn; }
        .ch-rt { grid-area: rt; }
        .ch-pad button { width: 100% !important; }
        @media (max-width: 640px) {
          .ch-keys { display: none !important; }
          .ch-touchhint { display: block !important; }
          .ch-dock { margin-top: 10px; }
          .ch-pad { grid-template-columns: repeat(3, 64px); gap: 6px; }
          .ch-pad button { height: 58px !important; }
        }
      ` }} />

      {!STAGE && <Footer />}
    </div>
  );
}
