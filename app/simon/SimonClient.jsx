'use client';

// Simon — the daily repeat-the-sequence memory game (owner, 2026-11-07).
//
// Nine pads in a 3x3 grid. The game lights a sequence, you tap it back, and
// every round adds one pad to the end. One wrong tap ends the run. Three
// things make it a daily:
//
//  1. THE SEQUENCE IS THE DAY'S. Every player gets the same pads in the same
//     order (lib/simon-engine.js dayPlan, seeded off the quizId), so the board
//     compares memory rather than luck.
//  2. THE PACE NEVER CHANGES. Every pad is lit for the same beat from round one
//     to the last (owner: steady pace). The squeeze is the length, not a clock.
//  3. NO SOUND AT ALL (owner). The pads carry a shape each as well as a colour,
//     so the sequence can be followed without either.
//
// It is an Arcade game: as many runs as you like, and the board keeps your
// BEST run (isArcade in lib/daily-games). The score is the longest sequence
// repeated in full, raw and uncapped; par is the day's benchmark. Ties break on
// the faster total TAPPING time (the shows are not counted), and nothing else.
//
// A run does not survive a reload: leaving the page mid-run posts it as it
// stood (the abandon flush), and the next visit starts a fresh run.
//
// Plumbing forked from app/snake/SnakeClient.jsx.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight, regionStyle, regionMix, REGION_INK } from '@/lib/category-ramp';
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
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { T } from '@/lib/theme';
import { arcadeRanksForKey } from '@/lib/daily-games';
import { meRequest } from '@/app/quizMeClient';
import { ARCADE_RUN } from '@/lib/end-verdict';
import { PADS, LIT_MS, GAP_MS, LEAD_MS, TAP_MS, dayPlan, newGame, press as pressPad, roundPads } from '@/lib/simon-engine';
import HelpSheet from '../HelpSheet';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const COLORS = {
  ink: T.ink, cream: '#f7f8fa', faded: '#3f4757', line: '#e5e7eb',
  accent: '#8a5a00', accentSoft: '#fdf3d7',
};
const HELP_KEY = 'sot_simon_help_seen';
const STATS_KEY = 'sot_simon_stats';
const BOARD_MAX = 440;
const NEXT_MS = 650;     // the beat after a round is repeated, before the next show
const MISS_MS = 1500;    // the missed pad and the wanted pad stay up this long

// Keys: 1 to 9 in reading order, or the three rows of the keyboard's left hand.
const KEYS = {
  1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8,
  q: 0, w: 1, e: 2, a: 3, s: 4, d: 5, z: 6, x: 7, c: 8,
};

// One outline shape a pad, so the sequence reads without its colour.
const SHAPES = [
  <circle key="c" cx="50" cy="50" r="34" />,
  <path key="t" d="M50 14 L86 80 L14 80 Z" />,
  <rect key="s" x="18" y="18" width="64" height="64" rx="4" />,
  <path key="d" d="M50 10 L90 50 L50 90 L10 50 Z" />,
  <path key="h" d="M50 12 L84 31 L84 69 L50 88 L16 69 L16 31 Z" />,
  <path key="st" d="M50 10 L60.5 38 L90 38 L66 56 L75 86 L50 68 L25 86 L34 56 L10 38 L39.5 38 Z" />,
  <path key="p" d="M39 14 H61 V39 H86 V61 H61 V86 H39 V61 H14 V39 H39 Z" />,
  <path key="m" d="M60 12 A38 38 0 1 0 88 62 A29 29 0 1 1 60 12 Z" />,
  <path key="hr" d="M50 84 C22 64 12 49 12 35 C12 22 22 14 33 14 C41 14 47 19 50 25 C53 19 59 14 67 14 C78 14 88 22 88 35 C88 49 78 64 50 84 Z" />,
];
const SHAPE_NAMES = ['circle', 'triangle', 'square', 'diamond', 'hexagon', 'star', 'plus', 'crescent', 'heart'];

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
const nf = (n) => Number(n || 0).toLocaleString('en-US');
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
const steps = (n) => `${nf(n)} step${n === 1 ? '' : 's'}`;

// ---- stats: the record is the BEST run, as on the other Arcade games -------
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
const RUN_RANK = arcadeRanksForKey('simon');
const asRun = (e) => ({ score: e.s, guesses_used: null, time_elapsed: e.el ?? null });
function betterRun(next, prev) {
  if (!prev) return true;
  return RUN_RANK ? RUN_RANK(asRun(next), asRun(prev)) < 0 : next.s > prev.s;
}
function recordStat(num, entry) {
  const s = getStats();
  if (!betterRun(entry, s.rec[num])) return s;
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
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max, rec };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p) continue;
    // scorePct is capped at 100, so a run above par reads as par here; only
    // `won` and the streak read this record, so that costs nothing.
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * (p.par || 1)));
    const next = { s: sc, t: p.par, el: null, won: !!m.perfect };
    if (!betterRun(next, rec[p.num])) continue;
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = next;
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshG() {
  return { v: 1, status: 'playing', t0: null, tEnd: null, score: 0, inputMs: 0, gaveUp: false, runs: 0 };
}

const HAPT = { tap: [6], round: [10], end: [20, 40, 20] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function SimonClient({ puzzles = [], forceNum = null }) {
  const searchParams = useSearchParams();
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const PAR = PUZZLE.par;
  const PLAN = useMemo(() => dayPlan(PUZZLE.quizId), [PUZZLE.quizId]);
  const STORE_KEY = `sot_simon_${PUZZLE.num}`;
  const REC_KEY = `sot_simon_rec_${PUZZLE.num}`;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;

  const [g, setG] = useState(freshG);
  const gRef = useRef(g);
  const eRef = useRef(null);            // the live engine state
  const [phase, setPhase] = useState('idle');   // idle | watch | input | next | miss
  const phaseRef = useRef('idle');
  const [lit, setLit] = useState(null);         // the pad the show is lighting
  const [tapped, setTapped] = useState(null);   // the pad the player just tapped
  const [miss, setMiss] = useState(null);       // { pad, want } after a wrong tap
  const [fig, setFig] = useState({ round: 1, pos: 0, score: 0 });
  const [armed, setArmed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [armGiveUp, setArmGiveUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [touchOnly, setTouchOnly] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const timers = useRef([]);
  const inputStart = useRef(0);
  const replayOnShow = useRef(false);
  const viewedRef = useRef(false);
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);

  const commit = useCallback((next) => {
    gRef.current = next;
    setG(next);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
  }, [STORE_KEY]);
  const setPh = useCallback((p) => { phaseRef.current = p; setPhase(p); }, []);
  const clearTimers = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const later = useCallback((fn, ms) => { timers.current.push(setTimeout(fn, ms)); }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const playing = g.status === 'playing';
  const endHold = useEndHold();
  const holdEnd = endHold.hold;
  const releaseEnd = endHold.release;
  const LOFT = isLoft('simon');
  const STAGE = isStage('simon', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('simon');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('simon');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('simon'), '--stg-acc-lt': gameColorLight('simon'), '--stg-onramp-lt': gameOnrampLight('simon'), '--stg-acc-ink-lt': gameAccentInkLight('simon') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const iq = useIqStanding({ game: 'simon', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'simon', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'simon', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'simon', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'simon', active: LOFT && !playing });

  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !armed;
  const started = playing && !!g.t0;
  const over = g.status !== 'playing';
  const won = over && g.score >= PAR;
  const verdictTone = won ? 'won' : 'part';
  const verdictWord = g.score === 0 ? 'Fail' : ARCADE_RUN;
  const myStats = useMemo(() => deriveStats(stats || { rec: {} }, PUZZLE.num), [stats, PUZZLE.num]);
  const bestToday = myStats.rec && myStats.rec[PUZZLE.num] ? myStats.rec[PUZZLE.num].s : null;
  const shownScore = playing ? fig.score : g.score;

  // ---- hydrate -------------------------------------------------------------
  // A run left mid-way was posted by the abandon flush as it stood; it does not
  // resume (the show cannot be paused fairly), so the next visit starts fresh.
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (saved && saved.v === 1) {
      const s = { ...freshG(), ...saved };
      if (s.status === 'playing') { s.t0 = null; s.score = 0; s.inputMs = 0; }
      gRef.current = s; setG(s);
    }
    setStats(getStats());
    try { setIdentity(JSON.parse(localStorage.getItem('sot_quiz_identity'))); } catch (e) {}
    try { setTouchOnly(isMobileDevice()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- identity + view ping -----------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    const anon = getAnonId();
    let em = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) em = `&email=${encodeURIComponent(id.email)}`; } catch (e) {}
    meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
      .then((r) => r.json())
      .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
      .catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
      } catch (e) {}
    }
  }, [hydrated, PUZZLE.quizId, puzzles]);

  // ---- the hub slate flag --------------------------------------------------
  useEffect(() => {
    if (!hydrated || !isTodays) return;
    try {
      const done = g.status !== 'playing' || bestToday != null;
      if (done || g.t0) localStorage.setItem('sot_simon_day', JSON.stringify({ d: etToday(), done }));
      else localStorage.removeItem('sot_simon_day');
    } catch (e) {}
  }, [hydrated, isTodays, g.status, g.t0, bestToday]);

  // the tapping clock so far, the round in progress included
  const tapMs = useCallback(() => {
    const cur = gRef.current;
    return (cur.inputMs || 0) + (phaseRef.current === 'input' && inputStart.current ? Date.now() - inputStart.current : 0);
  }, []);
  const secs = (ms) => Math.min(36000, Math.max(1, Math.round(ms / 1000)));

  // ---- abandon flush -------------------------------------------------------
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current, e = eRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !e || e.taps === 0) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (er) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (er) {}
    return {
      quizId: PUZZLE.quizId, score: e.score, total: PAR,
      correct: 0, timeElapsed: secs(tapMs()), abandoned: true,
      email: (identity && identity.email) || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  const postResult = useCallback((score, ms) => {
    abandon.markFlushed();
    holdEnd(HOLD_LONG);
    const el = secs(ms);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: PAR, el, won: score >= PAR })); } catch (er) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: PUZZLE.quizId, score, total: PAR, correct: score >= PAR ? 1 : 0,
          // No second figure: ties break on the faster tapping time alone.
          timeElapsed: el,
          email: (identity && identity.email) || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).catch(() => {});
    } catch (er) {}
  }, [holdEnd, abandon, PUZZLE.quizId, PUZZLE.num, PAR, identity]);

  // ---- the show ------------------------------------------------------------
  const playRound = useCallback(() => {
    const e = eRef.current;
    if (!e || !e.alive) return;
    clearTimers();
    replayOnShow.current = false;
    setLit(null); setTapped(null);
    setPh('watch');
    setFig({ round: e.round, pos: 0, score: e.score });
    const pads = roundPads(e);
    let t = LEAD_MS;
    pads.forEach((pd) => {
      later(() => setLit(pd), t);
      later(() => setLit(null), t + LIT_MS);
      t += LIT_MS + GAP_MS;
    });
    later(() => { inputStart.current = Date.now(); setPh('input'); }, t - GAP_MS + 60);
  }, [clearTimers, later, setPh]);

  const finishRun = useCallback((gaveUp) => {
    const e = eRef.current, cur = gRef.current;
    if (!e || cur.status !== 'playing') return;
    clearTimers();
    const ms = tapMs();
    inputStart.current = 0;
    setPh('idle'); setLit(null); setTapped(null);
    const g2 = { ...cur, status: 'over', tEnd: Date.now(), score: e.score, inputMs: ms, gaveUp: !!gaveUp, runs: (cur.runs || 0) + 1 };
    commit(g2);
    setFig({ round: e.round, pos: e.pos, score: e.score });
    vibrate(HAPT.end);
    postResult(e.score, ms);
  }, [clearTimers, tapMs, setPh, commit, postResult]);

  // A fresh run. Nothing about the day is cleared: every finished run posts,
  // and the board and the local record keep the best.
  const armBoard = useCallback(() => {
    releaseEnd();
    clearTimers();
    eRef.current = newGame(PLAN);
    inputStart.current = 0;
    setMiss(null); setLit(null); setTapped(null);
    setArmGiveUp(false);
    setEndClosed(false);
    setRevealed(false);
    const cur = gRef.current;
    commit({ ...cur, status: 'playing', t0: Date.now(), tEnd: null, score: 0, inputMs: 0, gaveUp: false });
    setArmed(true);
    try { localStorage.removeItem(REC_KEY); } catch (e) {}
    playRound();
  }, [releaseEnd, clearTimers, PLAN, commit, REC_KEY, playRound]);

  function startGame() {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    armBoard();
  }

  const tap = useCallback((pad) => {
    const e = eRef.current;
    if (!e || phaseRef.current !== 'input' || gRef.current.status !== 'playing') return;
    setTapped(pad);
    later(() => setTapped((x) => (x === pad ? null : x)), TAP_MS);
    const res = pressPad(e, pad);
    if (res === 'ok') { vibrate(HAPT.tap); setFig({ round: e.round, pos: e.pos, score: e.score }); return; }
    const now = Date.now();
    const cur = gRef.current;
    const ms = (cur.inputMs || 0) + (inputStart.current ? now - inputStart.current : 0);
    inputStart.current = 0;
    gRef.current = { ...cur, inputMs: ms };
    if (res === 'round') {
      vibrate(HAPT.round);
      setFig({ round: e.round - 1, pos: e.round - 1, score: e.score });
      setPh('next');
      if (!e.alive) { later(() => finishRun(false), NEXT_MS); return; }
      later(() => playRound(), NEXT_MS);
      return;
    }
    if (res === 'miss') {
      setMiss({ pad, want: e.miss.want });
      setPh('miss');
      later(() => finishRun(false), MISS_MS);
    }
  }, [later, setPh, playRound, finishRun]);

  const giveUp = useCallback(() => {
    if (gRef.current.status !== 'playing' || !eRef.current) return;
    if (!armGiveUp) { setArmGiveUp(Date.now()); return; }
    if (Date.now() - armGiveUp < 400) return;
    finishRun(true);
  }, [armGiveUp, finishRun]);
  useEffect(() => {
    if (!armGiveUp) return undefined;
    const t = setTimeout(() => setArmGiveUp(false), 3500);
    return () => clearTimeout(t);
  }, [armGiveUp]);

  // A hidden tab during the show would miss it: the show stops and plays again
  // from the top when the page comes back. The tapping clock keeps running
  // while hidden (owner, 2026-10-18: no pausing a daily's clock).
  useEffect(() => {
    const vis = () => {
      if (document.hidden) {
        if (phaseRef.current === 'watch') { clearTimers(); setLit(null); replayOnShow.current = true; }
      } else if (replayOnShow.current && gRef.current.status === 'playing') {
        playRound();
      }
    };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [clearTimers, playRound]);

  useEffect(() => {
    const onKey = (ev) => {
      if (showHelp) { if (ev.key === 'Escape') setShowHelp(false); return; }
      const tag = ev.target && ev.target.tagName;
      if (tag && /input|textarea|select/i.test(tag)) return;
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const k = KEYS[String(ev.key).toLowerCase()];
      if (k != null && gRef.current.status === 'playing' && eRef.current) { ev.preventDefault(); tap(k); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap, showHelp]);

  // ---- share ---------------------------------------------------------------
  function shareUrl() {
    return withRef(`mindloftdaily.com/simon${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const a = bestToday != null ? Math.max(bestToday, g.score) : g.score;
    return `Simon #${PUZZLE.num} · ${steps(a)}\n${shareUrl()}`;
  }
  function copyShare() {
    const txt = over ? shareText() : `Simon #${PUZZLE.num}, the daily memory sequence game from Mind Loft. Same pads for everybody.\n${shareUrl()}`;
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
      lead="Watch the pads light up, then tap them back in the same order. Every round adds one more pad to the end."
      banner="Everyone gets the same sequence today."
      sub="One wrong tap ends the run. Your score is the longest sequence you repeated in full."
      steps={[
        <>Press <b>Start</b> and watch. The pads light one at a time; when they stop, it is <b>your turn</b>.</>,
        <>Tap the pads back in order, or use the <b>keys 1 to 9</b> (or Q W E, A S D, Z X C) on a keyboard. Each pad has its own <b>shape</b> as well as its colour.</>,
        <>Get it right and the whole sequence plays again with <b>one pad added</b>. A wrong tap shows the pad you wanted, and the run is over.</>,
      ]}
      knack="It never speeds up. Every pad lights for the same beat in round one and round twenty, so the only thing that gets harder is the length. Say the shapes to yourself in groups of three as they light."
      footer={`Scored on STEPS, and you can play the day as many times as you like, because Simon keeps your BEST run: your score is the longest sequence you repeated in full, with no ceiling, and ${nf(PAR)} is par for the day. Ties break on the FASTER total tapping time; the time spent watching does not count. Simon pays at most 1 IQ point a day however many runs you play. Every day plays the same, Sundays included.`}
    />
  );

  const say = phase === 'watch' ? 'Watch'
    : phase === 'input' ? 'Your turn'
      : phase === 'next' ? 'Got it'
        : phase === 'miss' ? 'Missed' : '';
  const sayTone = phase === 'miss' ? 'bad' : (phase === 'input' || phase === 'next') ? 'go' : '';
  const roundNow = playing ? fig.round : g.score + 1;
  const statusLine = over
    ? (g.score === 0
      ? `No steps this run.${g.gaveUp ? ' You gave up.' : ''}`
      : `${steps(g.score)} repeated, ${fmtTime(g.inputMs)} of tapping.${g.gaveUp ? ' You gave up.' : ''}${bestToday != null && bestToday > g.score ? ` Your best today is ${nf(bestToday)}.` : ''}`)
    : phase === 'watch' ? `Round ${nf(fig.round)}: watch ${steps(fig.round)}.`
      : phase === 'input' ? `Tap them back: ${nf(fig.pos)} of ${nf(fig.round)}.`
        : phase === 'next' ? `${steps(fig.score)} repeated. One more is coming.`
          : phase === 'miss' ? 'Wrong pad. The ringed pad was the one.' : '';

  const btn = { fontFamily: SANS, fontWeight: 800, fontSize: 14, border: `2px solid var(--stg-line, ${COLORS.accent})`, background: STAGE ? SURF : '#fff', color: ACC_INK, borderRadius: 8, padding: '9px 16px', cursor: 'pointer' };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
        <DailyChrome slug="simon" name="Simon" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="simon" quizId={PUZZLE.quizId}
          name="Simon"
          cat="Arcade"
          outcome={playing ? null : verdictTone}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={null}
          figures={[
            { v: shownScore, k: 'steps' },
            { v: bestToday != null ? bestToday : '–', k: 'best' },
          ]}
        />
      )}

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 18px 40px', position: 'relative', zIndex: 2 }}>
        <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

        {!LOFT && (
          <DailyMasthead
            slug="simon"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            helpTop={13}
            marginBottom={16}
            onHelp={() => setShowHelp(true)}
          />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
            <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
              <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>
                <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

                  {preStart && (
                    <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '22px', display: 'flex', flexDirection: 'column', maxWidth: 560, margin: '0 auto', width: '100%' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : null}</div>
                      {gateRules ? rulesBody : (
                        <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                          <p style={{ margin: '0 0 6px' }}>Watch the pads light up, then tap them back in the same order. Every round adds one more. One wrong tap ends the run, the pace never speeds up, and your best run of the day is the one that counts.</p>
                        </div>
                      )}
                      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <button onClick={startGame} style={{ ...btn, background: STAGE ? STAGE_C : T.cta, borderColor: STAGE ? STAGE_C_INK : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                        <div>
                          <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                            {gateRules ? 'Back' : 'How to play'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!preStart && (
                    <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, position: 'relative', maxWidth: BOARD_MAX + 60, margin: '0 auto' }}>
                      {/* the round, the word for what to do now, and the taps of this round */}
                      <div className="sm-head">
                        <span className="sm-round">Round <b>{nf(roundNow)}</b></span>
                        <span className={`sm-say${sayTone ? ' ' + sayTone : ''}`} data-sm-status="">{say}</span>
                      </div>
                      <div className="sm-track" aria-hidden="true">
                        <i style={{ width: `${playing && phase !== 'watch' && fig.round ? Math.min(100, (fig.pos / fig.round) * 100) : 0}%` }} />
                      </div>

                      <div className={`sm-board${phase === 'input' ? ' live' : ''}`} role="group" aria-label="Simon pads">
                        {Array.from({ length: PADS }, (_, i) => {
                          const on = lit === i || tapped === i;
                          const cls = ['sm-pad', on ? 'on' : '', miss && miss.pad === i ? 'miss' : '', miss && miss.want === i ? 'want' : ''].filter(Boolean).join(' ');
                          return (
                            <button key={i} type="button" className={cls}
                              style={regionStyle(i)}
                              aria-label={`${SHAPE_NAMES[i]} pad, key ${i + 1}`}
                              disabled={!playing}
                              onPointerDown={(ev) => { ev.preventDefault(); tap(i); }}
                              onContextMenu={(ev) => ev.preventDefault()}>
                              <svg viewBox="0 0 100 100" aria-hidden="true">{SHAPES[i]}</svg>
                            </button>
                          );
                        })}
                      </div>

                      <p className="sm-line" aria-live="polite">{statusLine}</p>

                      {playing && armed && (
                        <div className="sm-foot-row">
                          <span className="sm-keys">{touchOnly ? 'Tap the pads in the order they lit.' : 'Keys 1 to 9, or Q W E, A S D, Z X C.'}</span>
                          <button type="button" className={`sm-giveup${armGiveUp ? ' armed' : ''}`} onClick={giveUp} aria-label={armGiveUp ? 'Tap again to give up' : 'Give up'}>
                            {armGiveUp ? 'Tap again to give up' : 'Give up'}
                          </button>
                        </div>
                      )}

                      {over && (
                        <button
                          onClick={armBoard}
                          style={{
                            marginTop: 14, width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: SANS, fontWeight: 800, fontSize: 15, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white,
                            background: STAGE ? STAGE_C : T.cta, border: `2px solid ${STAGE ? STAGE_C_INK : T.cta}`, borderRadius: 12, padding: '13px 18px', cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={16} /> Play again
                        </button>
                      )}
                      <p className="sm-foot">Same sequence for everyone today. Play as often as you like; your best run counts.</p>
                    </div>
                  )}

                </div>
                {LOFT && !playing && !endHold.held && revealed && (
                  <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
                )}
              </div>
              {LOFT && !playing && !endHold.held && (
                <LoftFinish
                  name="Simon"
                  catRank={catRank}
                  outcome={verdictTone}
                  challengeMetric={Number.isFinite(g.score) ? g.score : null}
                  title={verdictWord}
                  detail={steps(g.score)}
                  iq={iq}
                  board={dailyBoard}
                  gameRank={allTime && allTime.ready
                    ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '–',
                        label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Simon all time` : 'all-time rank' }
                    : null}
                  day={dayStats}
                  streak={isTodays ? myStats.cur : null}
                  missLabel={null}
                  archive={puzzles
                    .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                    .sort((x, y) => y.num - x.num)
                    .map((p) => ({
                      num: p.num,
                      dateLabel: p.dateLabel,
                      sunday: false,
                      href: `/simon?p=${p.num}`,
                      done: !!(myStats.rec && myStats.rec[p.num]),
                      score: (myStats.rec && myStats.rec[p.num]) ? myStats.rec[p.num].s : null,
                    }))}
                  options={[
                    { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                    { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                    prevPuzzle && { tone: 'another', label: 'Play another Simon', sub: `No. ${prevPuzzle.num}, yesterday’s sequence`, href: `/simon?p=${prevPuzzle.num}` },
                    nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                    { tone: 'replay', label: 'Play again', sub: 'Another run, your best one counts', onClick: armBoard },
                    { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="simon" name="Simon" onShow={() => setShowChrome(true)} />}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ marginTop: 20 }}>
            <JoinLeaderboardForm hideIcon heading="Put your name on today&rsquo;s board" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}

        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="simon" name="Simon" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!focusMode && <AddToHome name="Simon" />}
          <div id="stf-stats-slot" />
          {!LOFT && (
            <DailyGamesGrid
              self="simon"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="simon" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
          )}
        </div>

        <StageFold />
        <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '26px auto 0', fontSize: 13.5, lineHeight: 1.6, color: FADED }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Simon</h2>
          <p style={{ margin: '0 0 9px' }}>
            Simon is a free daily memory game from Mind Loft. Nine pads light up one at a time; tap them back in the same
            order, and every round the sequence grows by one. Everyone plays the same sequence on the same day, so the
            leaderboard compares memory rather than luck.
          </p>
          <p style={{ margin: '0 0 9px' }}>
            The pace never changes: every pad lights for the same beat from the first round to the last, and there is no
            sound. Each pad carries its own shape as well as its colour. One wrong tap ends the run. Play as many runs as you
            like; your best one takes the board, and ties go to the faster tapping.
          </p>
          <p style={{ margin: 0 }}>
            More arcade games: <a href="/snake" style={{ color: ACC_INK }}>Snake</a>,{' '}
            <a href="/blocks" style={{ color: ACC_INK }}>Blocks</a> and{' '}
            <a href="/squash" style={{ color: ACC_INK }}>Squash</a>.
          </p>
        </section>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="simon"
          won={won}
          quizId={PUZZLE.quizId}
          completed
          score={<>{steps(g.score)}</>}
          subline={<>{fmtTime(g.inputMs)} of tapping</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={armBoard}
          onClose={() => setEndClosed(true)}
        />
      )}

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="simon" name="Simon">
          {rulesBody}
        </HelpSheet>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .sm-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; max-width: ${BOARD_MAX}px; margin: 0 auto 10px; }
        .sm-round { font-size: 12px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--stg-mute, #5f6774); }
        .sm-round b { font-size: 20px; letter-spacing: 0; color: var(--stg-ink, #0b0d12); font-weight: 800; margin-left: 4px; font-variant-numeric: tabular-nums; }
        .sm-say { font-size: 15px; font-weight: 800; color: var(--stg-mute, #5f6774); }
        .sm-say.go { color: var(--stg-acc-ink, #8a5a00); }
        .sm-say.bad { color: var(--stg-bad, #be123c); }
        .sm-track { height: 6px; border-radius: 3px; background: var(--stg-line2, #c3cad6); overflow: hidden; max-width: ${BOARD_MAX}px; margin: 0 auto 14px; }
        .sm-track > i { display: block; height: 100%; background: var(--stg-acc, #fbbf24); transition: width .12s; }
        .sm-board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; max-width: ${BOARD_MAX}px; margin: 0 auto; aspect-ratio: 1 / 1; }
        .sm-pad { position: relative; border: 1px solid var(--stg-ink, #0b0d12); border-radius: 18px; padding: 0; margin: 0; cursor: default;
          background: ${regionMix(1)}; display: flex; align-items: center; justify-content: center;
          transition: background-color .08s linear, transform .08s ease-out; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; font: inherit; }
        [data-stage-theme="dark"] .sm-pad:not(.on):not(.want) { background: ${regionMix(2)}; }
        .sm-board.live .sm-pad { cursor: pointer; }
        .sm-pad:disabled { cursor: default; }
        .sm-pad svg { width: 42%; height: 42%; opacity: .5; transition: opacity .08s linear; }
        .sm-pad svg * { fill: none; stroke: ${REGION_INK}; stroke-width: 7; stroke-linejoin: round; }
        .sm-pad.on { background: color-mix(in srgb, var(--hue) 78%, var(--stg-cell, #ffffff)); box-shadow: inset 0 0 0 3px var(--stg-ink, #0b0d12); transform: scale(.965); }
        .sm-pad.on svg { opacity: 1; }
        .sm-pad.miss { animation: smShake .34s ease-out 1; }
        .sm-pad.want { box-shadow: 0 0 0 3px var(--stg-ground, #f4f6f9), 0 0 0 5px var(--stg-ink, #0b0d12); background: color-mix(in srgb, var(--hue) 78%, var(--stg-cell, #ffffff)); }
        .sm-pad.want svg { opacity: 1; }
        .sm-line { max-width: ${BOARD_MAX}px; margin: 14px auto 0; min-height: 1.35em; font-size: 14.5px; font-weight: 700; line-height: 1.35; color: var(--stg-ink, #0b0d12); text-align: center; }
        .sm-foot-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; max-width: ${BOARD_MAX}px; margin: 12px auto 0; }
        .sm-keys { font-size: 12px; font-weight: 600; line-height: 1.35; color: var(--stg-mute, #5f6774); }
        .sm-giveup { flex: none; font-family: ${SANS}; font-size: 13px; font-weight: 700; min-height: 36px; padding: 0 14px; border-radius: 10px; background: transparent; border: 1px solid var(--stg-line3, #78839a); color: var(--stg-ink2, #3f4757); cursor: pointer; }
        .sm-giveup.armed { border-color: var(--stg-bad, #be123c); color: var(--stg-bad, #be123c); }
        .sm-foot { margin: 14px auto 0; max-width: ${BOARD_MAX}px; font-size: 12px; font-weight: 600; line-height: 1.4; color: var(--stg-mute, #5f6774); text-align: center; }
        @media (max-width: 560px) {
          .sm-board { gap: 8px; }
          .sm-pad { border-radius: 14px; }
          .sm-line { font-size: 13.5px; }
        }
        @keyframes smShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        @media (prefers-reduced-motion: reduce) { .sm-pad.miss { animation: none; } .sm-pad, .sm-pad svg, .sm-track > i { transition: none; } }
      ` }} />

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
