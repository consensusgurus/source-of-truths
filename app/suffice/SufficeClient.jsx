'use client';

// Suffice — the daily data-sufficiency game.
//
// Eight items a weekday, twelve on a Sunday. Each is a question you are NOT
// asked to answer and two statements; you say which statements would settle
// it. That is the whole trick of the format: the work is deciding whether the
// information is enough, and computing the actual value is wasted effort.
//
// Every item's answer is DECIDABLE, and machine-proved before it ships (see
// scripts/verify-suffice.mjs). The four families each decide sufficiency by a
// different mechanism, which is what stops sixty days reading the same way:
//   MOD   periodicity over a 2520 window, unbounded integers
//   LIN   row-space rank over exact rationals, unbounded reals
//   SETS  every split of a group of N
//   STAT  every sorted list of L integers
//
// The client never receives the answer key: app/suffice/page.js strips each
// item's `letter`, and this component re-derives it from `chk` with
// app/suffice/engine.js (the Sworn leak-guard pattern). engine.js builds
// scenarios lazily, so only the item in front of the player is ever compiled.
//
// Scoring: one point per correct item, out of 8 (12 on a Sunday). No partial
// credit, because a DS answer is one of five and half-right does not exist.
// Ties on the daily board break by fewest wrong, then fastest time.
//
// Same daily plumbing as Sworn/Alibi/Suds: banked days gated by Eastern date on
// the server, per-day localStorage saves, /suffice?p=N archive pinning, streaks
// and stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Check, Minus } from 'lucide-react';
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
import { getScenario, decide, linClassify, witness } from './engine';

const COLORS = {
  ink: T.ink,
  faded: T.muted,
  accent: '#4338ca',        // Suffice identity — deduction indigo
  accentSoft: '#e0e7ff',
  accentDeep: '#312e81',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_suffice_help_seen';

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

// ── the answer, re-derived in the browser so the key never ships ─────────────
// Memoised per item by the caller. LIN is pure rank arithmetic; the other three
// compile one scenario on demand.
function solveItem(it) {
  if (it.fam === 'LIN') return linClassify(it.chk.e1, it.chk.e2, it.chk.c);
  const sc = getScenario(it.fam, it.chk.scen);
  if (!sc) return null;
  const r = decide(sc, it.chk.q, it.chk.s1, it.chk.s2);
  return r && r.letter ? r.letter : null;
}

// The reveal. Which statements were enough follows from the letter alone, but
// the COUNTEREXAMPLE is what teaches: two concrete cases that satisfy the same
// statements and answer the question differently.
function explainItem(it, letter) {
  const enough = {
    A: [true, false, true], B: [false, true, true], C: [false, false, true],
    D: [true, true, true], E: [false, false, false],
  }[letter] || [false, false, false];
  let w = null;
  if (it.fam !== 'LIN') {
    const sc = getScenario(it.fam, it.chk.scen);
    if (sc) {
      // show the counterexample for the weakest thing that still fails
      if (!enough[2]) w = witness(sc, it.chk.q, [it.chk.s1, it.chk.s2]);
      else if (!enough[0]) w = witness(sc, it.chk.q, [it.chk.s1]);
      else if (!enough[1]) w = witness(sc, it.chk.q, [it.chk.s2]);
    }
  }
  return { enough, witness: w };
}

// ── the three questions ──────────────────────────────────────────────────────
// The owner-approved replacement for the five lettered choices (2026-10-07).
// The player answers three yes-or-no questions and the ANSWER IS DERIVED from
// them, mapping onto exactly the same internal letter the A to E buttons used
// to post, so scoring, saves and the board are untouched. The letter itself is
// never shown: the plain-English line below says the same thing in words.
//   (1) alone?  (2) alone?  together?
//   yes   yes    -           D  each alone is enough
//   yes   no     -           A  (1) alone
//   no    yes    -           B  (2) alone
//   no    no     yes         C  only together
//   no    no     no          E  not even together
// "Together" is only asked when neither alone is enough, because if either one
// settles it on its own, the pair settles it too.
function deriveLetter(a) {
  const [one, two, both] = a;
  if (one === null || two === null) return null;
  if (one && two) return 'D';
  if (one) return 'A';
  if (two) return 'B';
  if (both === null) return null;
  return both ? 'C' : 'E';
}
const LETTER_YN = { A: [true, false, null], B: [false, true, null], C: [false, false, true], D: [true, true, null], E: [false, false, false] };
const SUMMARY = {
  A: 'Statement (1) alone is enough, (2) alone is not.',
  B: 'Statement (2) alone is enough, (1) alone is not.',
  C: 'Both together are enough, neither alone is.',
  D: 'Each statement alone is enough.',
  E: 'Not enough, even with both together.',
};
const SHORT = { A: '(1) alone', B: '(2) alone', C: 'only together', D: 'each alone', E: 'not enough' };
const YN_QS = ['Is statement (1) alone enough?', 'Is statement (2) alone enough?', 'Are they enough together?'];
const NO_YN = [null, null, null];

const freshState = (n) => ({ v: 1, i: 0, picks: Array(n).fill(null), t0: null, tEnd: null, status: 'playing' });
const EMPTY_BOARD = { plays: 0, best: null, leaderboard: [] };

// ── stats (same shape every daily uses) ──────────────────────────────────────
const STATS_KEY = 'sot_suffice_stats';
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
// Shape matches what DailyBoardPanel wants: { current, best } under cur/max,
// the same contract Sworn and the rest of the roster pass.
function deriveStats(stats, todayNum) {
  if (!stats) return { played: 0, wins: 0, cur: 0, max: 0 };
  const byNum = stats.byNum || {};
  const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const wins = nums.filter((n) => byNum[n].won).length;
  // current streak: walk back from today, allowing today to be unplayed
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) {
    const r = byNum[n];
    if (!r) { if (n === todayNum) continue; break; }
    if (!r.won) break;
    cur++;
  }
  // best streak: longest run of consecutive won days anywhere in the record
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    if (!byNum[n].won) { run = 0; prev = n; continue; }
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  return { played, wins, cur, max: Math.max(max, cur) };
}

export default function SufficeClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const ITEMS = PUZZLE.items;
  const TOTAL = ITEMS.length;
  const STORE_KEY = `sot_suffice_${PUZZLE.num}`;

  // Re-derive every answer once per day, off the stripped data.
  const KEY = useMemo(() => ITEMS.map(solveItem), [ITEMS]);

  const [g, setG] = useState(() => freshState(TOTAL));
  const [revealed, setRevealed] = useState(false);   // showing the reveal panel
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [loftRevealed, setLoftRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  // The three yes/no answers for the item on screen. Local working state only:
  // what posts is the letter derived from them, at Submit.
  const [yn, setYn] = useState({ i: -1, a: NO_YN });
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('suffice');
  const STAGE = isStage('suffice', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('suffice');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('suffice'), '--stg-acc-lt': gameColorLight('suffice'), '--stg-onramp-lt': gameOnrampLight('suffice'), '--stg-acc-ink-lt': gameAccentInkLight('suffice') };
  const [stageTheme] = useStageTheme();
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
  const idx = Math.min(g.i, TOTAL - 1);
  const item = ITEMS[idx];
  const correct = g.picks.filter((p, i) => p && p === KEY[i]).length;
  const wrong = g.picks.filter((p, i) => p && p !== KEY[i]).length;
  const score = correct;

  useEffect(() => { try { setMobileUi(isMobileDevice()); } catch (e) {} }, []);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length === TOTAL) setG({ ...freshState(TOTAL), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_suffice_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_suffice_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live clock, ticked from state rather than read during render, so the
  // readout moves on its own instead of only when the board re-renders.
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

  // An abandoned day still records, per the site-wide rule that leaving mid-game
  // posts a normal partial result. Answering at least one item is the "started"
  // signal; opening the page and leaving is not a play.
  const REC_KEY = `sot_suffice_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!playing || !g.picks.some(Boolean)) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: correct, total: TOTAL, correct, guessesUsed: wrong, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc, wr) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: wr, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // guessesUsed = items answered wrong, so the daily board's ties break by
        // the surer player before the faster one.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: wr, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function start() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setGateRules(false);
  }

  function answer(k) {
    if (!playing || revealed || g.picks[idx]) return;
    setG((cur) => {
      const picks = cur.picks.slice();
      picks[idx] = k;
      return { ...cur, picks };
    });
    setRevealed(true);
  }

  function next() {
    setRevealed(false);
    if (idx + 1 >= TOTAL) {
      setG((cur) => {
        const g2 = { ...cur, status: 'done', tEnd: Date.now() };
        const c = g2.picks.filter((p, i) => p && p === KEY[i]).length;
        const w = g2.picks.filter((p, i) => p && p !== KEY[i]).length;
        postResult(g2, c, w);
        return g2;
      });
    } else {
      setG((cur) => ({ ...cur, i: cur.i + 1 }));
    }
  }

  function resetGame() {
    setG(freshState(TOTAL));
    setRevealed(false);
    setEndClosed(false);
    setYn({ i: -1, a: NO_YN });
  }

  function copyShare() {
    // Squares only. The pattern shows how you did, never which letter was
    // right, so a shared result cannot hand anyone the key.
    const marks = g.picks.map((p, i) => (p === KEY[i] ? '🟦' : '⬜')).join('');
    const txt = `Suffice #${PUZZLE.num}\n${score}/${TOTAL} · ${elapsed}\n${marks}\nmindloftdaily.com/suffice`;
    try {
      navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'suffice', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'suffice', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'suffice', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'suffice', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'suffice', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const picked = g.picks[idx];
  const answerKey = KEY[idx];
  // A pick that is already saved (a reload mid-item) shows its reveal too;
  // before, the item sat locked with no Next button and the day could not go on.
  const showReveal = revealed || !!picked;
  const ex = showReveal && answerKey ? explainItem(item, answerKey) : null;
  const ynCur = picked ? (LETTER_YN[picked] || NO_YN) : (yn.i === idx ? yn.a : NO_YN);
  const derived = picked || deriveLetter(ynCur);
  const truthYN = answerKey ? LETTER_YN[answerKey] : NO_YN;
  const bothNo = ynCur[0] === false && ynCur[1] === false;
  function setAns(q, v) {
    if (!playing || revealed || picked) return;
    const a = (yn.i === idx ? yn.a : NO_YN).slice();
    a[q] = v;
    if (a[0] === true || a[1] === true) a[2] = null;
    setYn({ i: idx, a });
  }

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="suffice" name="Suffice" collapsed={!!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="suffice" quizId={PUZZLE.quizId}
          name="Suffice"
          cat="Logic"
          outcome={playing ? null : (score === TOTAL ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sf-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sf-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .sf-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accentDeep};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sf-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .sf-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .sf-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 86%, var(--stg-ink, var(--white)));}
          .sf-stmts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px;}
          .sf-stmt{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:12px;padding:13px 15px;font-size:15px;line-height:1.5;color:${INK};display:flex;flex-direction:column;gap:6px;}
          .sf-stmt .n{font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:${STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep};}
          .sf-stmt .t{font-weight:700;}
          .sf-qlab{font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${FADED};margin:0 0 8px;}
          .sf-yn{display:flex;align-items:center;gap:14px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:12px;padding:10px 12px 10px 15px;margin-bottom:8px;}
          .sf-yn .q{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;font-size:15.5px;font-weight:800;color:${INK};line-height:1.35;}
          .sf-yn .why{font-size:12.5px;font-weight:600;color:${FADED};}
          .sf-yn.off .q > span:first-child{color:${FADED};}
          .sf-yn .vd{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:800;}
          .sf-yn .vd.ok{color:var(--stg-good, ${COLORS.green});}
          .sf-yn .vd.no{color:var(--stg-bad, #b91c1c);}
          .sf-yn .seg{flex:0 0 auto;display:flex;border:1.5px solid var(--stg-line3, rgba(28,30,36,0.45));border-radius:10px;overflow:hidden;}
          .sf-yn .seg button{min-width:66px;min-height:44px;border:0;background:transparent;color:${STAGE ? 'var(--stg-ink2)' : COLORS.ink};font-family:${SANS};font-weight:800;font-size:14px;cursor:pointer;}
          .sf-yn .seg button + button{border-left:1.5px solid var(--stg-line3, rgba(28,30,36,0.45));}
          .sf-yn .seg button:hover:not(:disabled){background:var(--stg-surf2, ${COLORS.accentSoft});}
          .sf-yn .seg button.on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);}
          .sf-yn .seg button:disabled{cursor:default;}
          .sf-yn.off .seg{opacity:0.4;}
          .sf-sum{display:flex;flex-direction:column;gap:3px;border:1.5px solid var(--stg-line2, rgba(28,30,36,0.25));border-left:4px solid var(--stg-acc, ${COLORS.accent});border-radius:12px;padding:12px 15px;margin:12px 0 0;}
          .sf-sum .l{font-family:${MONO};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${FADED};}
          .sf-sum .v{font-size:15.5px;font-weight:800;color:${INK};}
          .sf-submit{margin-top:12px;min-height:50px;padding:0 26px;font-size:15px;justify-content:center;}
          .sf-submit:disabled{opacity:0.45;cursor:default;}
          .sf-submit:disabled:hover{background:var(--stg-acc, ${COLORS.accent});}
          @media(max-width:640px){
            .sf-stmts{grid-template-columns:1fr;gap:8px;}
            .sf-yn{flex-direction:column;align-items:stretch;gap:9px;padding:12px 14px;}
            .sf-yn .seg{border:0;gap:8px;overflow:visible;}
            .sf-yn .seg button{flex:1;border:1.5px solid var(--stg-line3, rgba(28,30,36,0.45));border-radius:10px;}
            .sf-yn .seg button + button{border-left:1.5px solid var(--stg-line3, rgba(28,30,36,0.45));}
            .sf-yn .seg button.on{border-color:var(--stg-acc, ${COLORS.accent});}
            .sf-submit{width:100%;}
          }
          .sf-pip{width:100%;height:5px;border-radius:3px;background:rgba(28,30,36,0.13);}
          .sf-pip.on{background:var(--stg-acc, ${COLORS.accent});}
          .sf-pip.miss{background:#b91c1c;}
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {!LOFT && (
          <DailyMasthead
            slug="suffice"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={4}
            helpTop={8}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Twelve Items</span>}
            blocks={'SUFFICE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 19, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
          />
          )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (loftRevealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {/* start tile: full rules for a first-timer, compact card otherwise */}
          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '20px 22px', margin: '4px 0 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 8px' }}>
                {TOTAL} questions you do not have to answer.
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: FADED, fontWeight: 600, margin: '0 0 12px' }}>
                Each item gives you a question and two statements. You are not asked what the answer is,
                only whether the statements are <b style={{ color: ACC_DEEP_INK }}>enough to settle it</b>.
                Working out the actual value is wasted time. You answer three yes-or-no questions per
                item, and they add up to your answer.
              </p>
              {gateRules && (
                <div style={{ marginBottom: 14 }}>
                  <DailyRules
                    accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
                    steps={[
                      <>&ldquo;Enough&rdquo; means the question has the <b>same answer in every case</b> the statement allows.</>,
                      <>Answer three yes-or-no questions: is statement (1) <b>alone</b> enough, is statement (2) <b>alone</b> enough, and, only if both are No, are they enough <b>together</b>?</>,
                      <>One <b>counterexample</b>, two cases the statement allows that answer the question differently, makes it not enough.</>,
                      <>A line under the questions says what your three answers add up to. Press <b>Submit</b> to lock it in.</>,
                    ]}
                    knack="Hunt for the second case, not the answer. Find two values a statement still permits and it is insufficient, and you are done."
                    footer="One point per item. No going back once you answer."
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="sf-btn primary" onClick={start}>Start</button>
                {!gateRules && (
                  <button className="sf-btn" onClick={() => setGateRules(true)}>Show instructions</button>
                )}
              </div>
            </div>
          )}

          {!preStart && (
            <>
              {/* progress + clock */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0 12px' }}>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {ITEMS.map((_, i) => (
                    <div key={i} className={`sf-pip${g.picks[i] ? (g.picks[i] === KEY[i] ? ' on' : ' miss') : ''}`} />
                  ))}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: FADED }}>
                  {Math.min(idx + 1, TOTAL)}/{TOTAL} &middot; {elapsed}
                </div>
              </div>

              {playing && (
                <>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, fontWeight: 700, marginBottom: 6 }}>
                    Item {idx + 1}
                  </div>
                  <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 11, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ fontSize: 14, color: FADED, fontWeight: 600, marginBottom: 5 }}>{item.stem}</div>
                    <div style={{ fontSize: 17.5, fontWeight: 800, color: INK, lineHeight: 1.4 }}>{item.ask}</div>
                  </div>
                  <div className="sf-stmts">
                    <div className="sf-stmt"><span className="n">Statement (1)</span><span className="t">{item.s1}</span></div>
                    <div className="sf-stmt"><span className="n">Statement (2)</span><span className="t">{item.s2}</span></div>
                  </div>

                  <div className="sf-qlab">Answer three yes-or-no questions</div>
                  {YN_QS.map((qt, qi) => {
                    const off = qi === 2 && !bothNo;
                    const v = ynCur[qi];
                    const locked = !playing || showReveal;
                    const verdict = showReveal && v !== null && truthYN[qi] !== null ? (v === truthYN[qi]) : null;
                    return (
                      <div key={qi} className={`sf-yn${off ? ' off' : ''}`}>
                        <div className="q">
                          <span>{qt}</span>
                          {off && !locked && <span className="why">Only asked when neither statement alone is enough.</span>}
                          {verdict !== null && (
                            <span className={`vd ${verdict ? 'ok' : 'no'}`}>
                              {verdict ? <Check size={14} /> : <X size={14} />}
                              {verdict ? 'Right' : `Wrong, it is ${truthYN[qi] ? 'yes' : 'no'}`}
                            </span>
                          )}
                        </div>
                        <div className="seg" role="radiogroup" aria-label={qt}>
                          {[true, false].map((val) => (
                            <button key={String(val)} type="button" role="radio" aria-checked={v === val}
                              className={v === val ? 'on' : undefined}
                              disabled={off || locked}
                              onClick={() => setAns(qi, val)}>{val ? 'Yes' : 'No'}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {!showReveal && (
                    <>
                      {derived && (
                        <div className="sf-sum" aria-live="polite">
                          <span className="l">That makes your answer</span>
                          <span className="v">{SUMMARY[derived]}</span>
                        </div>
                      )}
                      <button className="sf-btn primary sf-submit" disabled={!derived || !playing} onClick={() => { if (derived) answer(derived); }}>
                        Submit
                      </button>
                    </>
                  )}

                  {/* the reveal: which statements were enough, and the
                      counterexample that proves the ones that were not */}
                  {showReveal && ex && (
                    <div style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `1px solid var(--stg-line, ${COLORS.accent})`, borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: ACC_DEEP_INK, marginBottom: 7 }}>
                        {picked === answerKey ? `Correct. ${SUMMARY[answerKey]}` : `Not quite. The answer: ${SUMMARY[answerKey]}`}
                      </div>
                      {picked && picked !== answerKey && (
                        <div style={{ fontSize: 13, color: FADED, fontWeight: 600, marginBottom: 7 }}>You said: {SUMMARY[picked]}</div>
                      )}
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: INK }}>
                        <div>(1) alone {ex.enough[0] ? 'settles it' : 'is not enough'}. (2) alone {ex.enough[1] ? 'settles it' : 'is not enough'}. Together they {ex.enough[2] ? 'settle it' : 'still do not'}.</div>
                        {ex.witness && (
                          <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid var(--stg-line, rgba(67,56,202,0.22))`, fontFamily: MONO, fontSize: 12.5 }}>
                            Both of these fit, and disagree:<br />
                            {ex.witness.a.show} &rarr; {ex.witness.a.answer}<br />
                            {ex.witness.b.show} &rarr; {ex.witness.b.answer}
                          </div>
                        )}
                      </div>
                      <button className="sf-btn primary" style={{ marginTop: 11 }} onClick={next}>
                        {idx + 1 >= TOTAL ? 'Finish' : 'Next item'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {!playing && (
                <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: INK, marginBottom: 8 }}>{score}/{TOTAL} &middot; {elapsed}</div>
                  {ITEMS.map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '5px 0', borderTop: i ? '1px solid rgba(28,30,36,0.08)' : 'none', fontSize: 13.5 }}>
                      <span style={{ fontFamily: MONO, color: FADED, flex: '0 0 auto', width: 20 }}>{i + 1}</span>
                      <span aria-label={g.picks[i] === KEY[i] ? 'right' : 'wrong'} style={{ flex: '0 0 auto', width: 22, height: 22, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: g.picks[i] === KEY[i] ? COLORS.green : '#b91c1c', color: T.white }}>{g.picks[i] === KEY[i] ? <Check size={14} /> : <X size={14} />}</span>
                      <span style={{ color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.ask}</span>
                      {g.picks[i] && g.picks[i] !== KEY[i] && <span style={{ marginLeft: 'auto', flex: '0 0 auto', fontFamily: MONO, fontSize: 12, color: FADED }}>{SHORT[KEY[i]] || ''}, you said {SHORT[g.picks[i]] || ''}</span>}
                      {!g.picks[i] && <Minus size={14} style={{ marginLeft: 'auto', flex: '0 0 auto', color: FADED }} />}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* The daily leaderboard renders INSIDE DailyGamesGrid's boardSlot,
              not as a sibling, which is the house arrangement every other
              daily uses. */}

          </div>
          {LOFT && !playing && loftRevealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setLoftRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Suffice"
              catRank={catRank}
              outcome={score === TOTAL ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={score === TOTAL ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Suffice all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Wrong"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/suffice?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score === TOTAL) ? 'board' : 'reveal', label: (score === TOTAL) ? 'Return to board' : 'Reveal answer',
                  sub: (score === TOTAL) ? 'Your finished board' : 'Show what you missed', onClick: () => setLoftRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Suffice', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/suffice?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="suffice" name="Suffice" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="suffice" name="Suffice" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {/* Add to Home Screen, then the finish card's stat cards (app/StageFinish.jsx), as every daily has them. */}
            {!focusMode && <AddToHome name="Suffice" />}
            <div id="stf-stats-slot" />
            {!LOFT && (
            <DailyGamesGrid
              self="suffice"
              maxWidth={640}
              replay={!playing ? resetGame : null}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="suffice" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
            )}
          </div>
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="suffice"
          won={score === TOTAL}
          completed
          headline={score === TOTAL ? <>A clean sheet</> : <>{score} of {TOTAL}</>}
          subline={<>Suffice #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {wrong} wrong &middot; {elapsed}</>}
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 460, fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <HelpCircle size={19} color={COLORS.accent} />
              <b style={{ fontSize: 17, color: INK }}>How Suffice works</b>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 10px' }}>
              Every item is a question plus two statements. You never answer the question. You decide
              whether the statements give enough information to answer it.
            </p>
            <ul style={{ fontSize: 13.5, lineHeight: 1.7, color: INK, margin: '0 0 12px', paddingLeft: 20 }}>
              <li>Answer three yes-or-no questions: is statement (1) alone enough, is statement (2) alone enough, and are they enough together.</li>
              <li>The third is only asked when both of the first two are No, because if either statement settles it alone, the pair settles it too.</li>
              <li>A statement is enough when every case it allows gives the same answer.</li>
              <li>Find one pair of cases that disagree and it is insufficient.</li>
              <li>One point per item, {TOTAL} on the board today.</li>
            </ul>
            <button className="sf-btn primary" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
          </div>
        </div>
      )}

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
