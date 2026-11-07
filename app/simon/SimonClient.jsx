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
import { Smartphone } from 'lucide-react';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyRules from '../DailyRules';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import StageChrome from '../StageChrome';
import PlayStage from '../PlayStage';
import usePlayStageFit from '@/lib/play-stage-fit';
import { useStageTheme } from '@/lib/stage-theme';
import { useStageLook, isDarkLook } from '@/lib/stage-look';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight, sitePastel } from '@/lib/category-ramp';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useEndHold, { HOLD_LONG } from '../useEndHold';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { arcadeRanksForKey } from '@/lib/daily-games';
import { meRequest } from '@/app/quizMeClient';
import { ARCADE_RUN } from '@/lib/end-verdict';
import { PADS, LIT_MS, GAP_MS, LEAD_MS, TAP_MS, dayPlan, newGame, press as pressPad, roundPads } from '@/lib/simon-engine';
import HelpSheet from '../HelpSheet';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const COLORS = { accent: '#8a5a00', accentSoft: '#fdf3d7' };
// The pads wear the SITE pastels (owner, 2026-11-06/07: full pastels, never
// washed tints), in the order Carve's blocks use, one per pad.
const PAD_PASTELS = ['#7dd3fc', '#e8b43a', '#6ee7b7', '#fb7185', '#c084fc', '#bef264', '#e879f9', '#a5b4fc', '#fb923c'];
const ARM_MIN_MS = 400;
const isIosDevice = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const HELP_KEY = 'sot_simon_help_seen';
const STATS_KEY = 'sot_simon_stats';
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
  const [revealed, setRevealed] = useState(false);
  const [armGiveUp, setArmGiveUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [touchOnly, setTouchOnly] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    try { setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true); } catch (e) {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };
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
  const STAGE_ACC = { '--stg-acc-dk': gameColor('simon'), '--stg-acc-lt': gameColorLight('simon'), '--stg-onramp-lt': gameOnrampLight('simon'), '--stg-acc-ink-lt': gameAccentInkLight('simon') };
  const [stageTheme] = useStageTheme();
  const [stageLook] = useStageLook();
  const padHue = (i) => sitePastel(PAD_PASTELS[i], isDarkLook(stageLook));
  const INK = 'var(--stg-ink,#e9edf4)';
  const MUTE = 'var(--stg-mute,#8b95a8)';
  const iq = useIqStanding({ game: 'simon', quizId: PUZZLE.quizId, active: !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const nextUp = useNextUnplayed({ self: 'simon', active: !playing });
  const upNext = useUnplayedSimilar({ self: 'simon', active: !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: !playing });
  const allTime = useGameAllTime({ game: 'simon', active: !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'simon', active: !playing });

  const preStart = playing && !armed;
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
    if (Date.now() - armGiveUp < ARM_MIN_MS) return;
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
  const statusLine = phase === 'watch' ? `Watch ${steps(fig.round)}.`
    : phase === 'input' ? `Tap them back: ${nf(fig.pos)} of ${nf(fig.round)}.`
      : phase === 'next' ? `${steps(fig.score)} repeated. One more is coming.`
        : phase === 'miss' ? 'Wrong pad. The ringed pad was the one.' : '';

  // The tapping clock for the foot: it runs only on your turn.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (phase !== 'input') return undefined;
    const iv = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(iv);
  }, [phase]);
  const clockShown = fmtTime(playing ? tapMs() : (g.inputMs || 0));

  // THE BOARD. Nine pads in the site pastels with a 1px ink rule; a lit pad
  // turns ink and its shape takes the pad's pastel; the wanted pad after a
  // miss is lit and ringed; the wrong pad shakes in the bad mark.
  const padRef = useRef(null);
  const onStage = !!g.t0 && (playing || !revealed);
  const fit = usePlayStageFit(padRef, '.sm-bd', onStage);
  const board = (live) => (
    <div ref={live ? padRef : undefined} className="sm-wrap">
      <div className={`sm-bd${live && phase === 'input' ? ' live' : ''}`} role="group" aria-label="Simon pads"
        style={live && fit ? { width: `min(100%, ${fit}px)` } : undefined}>
        {Array.from({ length: PADS }, (_, i) => {
          const on = live && (lit === i || tapped === i);
          const cls = ['sm-pad', on ? 'on' : '', live && miss && miss.pad === i ? 'miss' : '', live && miss && miss.want === i ? 'want' : ''].filter(Boolean).join(' ');
          return (
            <button key={i} type="button" className={cls}
              style={{ '--hue': padHue(i) }}
              aria-label={`${SHAPE_NAMES[i]} pad, key ${i + 1}`}
              disabled={!live || !playing}
              onPointerDown={live ? (ev) => { ev.preventDefault(); tap(i); } : undefined}
              onContextMenu={(ev) => ev.preventDefault()}>
              <svg viewBox="0 0 100 100" aria-hidden="true">{SHAPES[i]}</svg>
            </button>
          );
        })}
      </div>
      {live && !touchOnly ? <div className="sm-keys">Keys 1 to 9, or Q W E, A S D, Z X C</div> : null}
    </div>
  );

  // THE STAGE, at every width, from Start through the finish (the ending hides
  // it when it arrives, app/StageHost.jsx), as every white-stage daily does.
  const stage = onStage ? (
    <PlayStage bg={gameColor('simon')} label="Simon"
      eyebrow={playing ? `Round ${nf(fig.round)} · ${say}` : steps(g.score)}
      top={board(true)}
      foot={playing ? statusLine : null}
      frac={playing && phase !== 'watch' && fig.round ? fig.pos / fig.round : null}
      clock={clockShown}
      done={!playing}
      giveUp={playing ? { armed: !!armGiveUp, onPress: giveUp, armedLabel: 'Tap again to give up' } : null} />
  ) : null;

  return (
    <div className="stage-page" data-stage-theme={stageTheme}
      style={{ ...STAGE_ACC, minHeight: '100vh', position: 'relative', background: 'var(--stg-ground)', color: INK, overflowX: 'hidden' }}>
      {stage}
      <StageChrome gameKey="simon" quizId={PUZZLE.quizId}
        name="Simon"
        cat="Arcade"
        outcome={playing ? null : verdictTone}
        num={PUZZLE.num}
        tiles={playing ? null : upNext}
        dateLabel={PUZZLE.dateLabel}
        onHelp={() => setShowHelp(true)}
        sunday={null}
        figures={[
          { v: String(shownScore), k: 'steps' },
          { v: bestToday != null ? String(bestToday) : '–', k: 'best' },
        ]}
      />
      <div className="sm-page" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 24px 80px', fontFamily: SANS }}>
        <div>
          {preStart && (
            <div className="stg-gate" style={{ maxWidth: 640, margin: '0 auto 16px', background: 'var(--stg-surf,#fff)', border: '1px solid var(--stg-line,rgba(11,15,26,.14))', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : `Simon No. ${PUZZLE.num}`}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: 0 }}>Watch the pads light up, then tap them back in the same order. Every round adds one more. One wrong tap ends the run, the pace never speeds up, and your best run of the day counts.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="sm-btn" onClick={startGame}>Start</button>
                <button type="button" className="sm-link" onClick={() => setGateRules((v) => !v)}>{gateRules ? 'Back' : 'How to play'}</button>
              </div>
            </div>
          )}
          {over && !endHold.held && revealed && (
            <div className="stg-board" style={{ maxWidth: 640, margin: '0 auto 12px' }}>
              {board(false)}
              <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: INK, margin: '12px 0 0' }}>
                {g.score === 0 ? 'No steps this run.' : `${steps(g.score)} repeated, ${fmtTime(g.inputMs)} of tapping.`}{bestToday != null && bestToday > g.score ? ` Your best today is ${nf(bestToday)}.` : ''}
              </p>
            </div>
          )}
          {over && !endHold.held && revealed && (
            <button className="stf-hideboard" onClick={() => setRevealed(false)}>&#8630; Hide the board</button>
          )}
          {over && !endHold.held && (
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
                { tone: 'board', label: 'See the board', sub: 'Where the run stopped', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Simon', sub: `No. ${prevPuzzle.num}, ${prevPuzzle.dateLabel}`, href: `/simon?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Play again', sub: 'Another run, your best one counts', onClick: armBoard },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
        </div>

        <div style={{ margin: '30px auto 0', maxWidth: 680 }}>
          <ReportIssue self="simon" name="Simon" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          {over && touchOnly && !standalone && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="sm-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
            </div>
          )}
          <div id="stf-stats-slot" />
        </div>

        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--stg-raise,#fff)', border: '1px solid var(--stg-ink,#08222e)', borderRadius: 16, padding: 20, maxWidth: 380, fontFamily: SANS }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Simon to your home screen</div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                {isIosDevice() ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.' : 'Open your browser menu and choose Install app, or Add to Home screen.'}
              </p>
              <button className="sm-tool" onClick={() => setShowA2hsHelp(false)}>Got it</button>
            </div>
          </div>
        )}
        {over && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 680 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(u) => setIdentity(u)} />
          </div>
        )}
      </div>
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="simon" name="Simon">
          {rulesBody}
        </HelpSheet>
      )}

      <StageFold />
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Simon</h2>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: '0 0 9px' }}>
          Simon is a free daily memory game from Mind Loft. Nine pads light up one at a time; tap them back in the same
          order, and every round the sequence grows by one. Everyone plays the same sequence on the same day, so the
          leaderboard compares memory rather than luck.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: '0 0 9px' }}>
          The pace never changes: every pad lights for the same beat from the first round to the last, and there is no
          sound. Each pad carries its own shape as well as its colour. One wrong tap ends the run. Play as many runs as you
          like; your best one takes the board, and ties go to the faster tapping.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: MUTE, lineHeight: 1.6, margin: 0 }}>
          More arcade games: <a href="/snake" style={{ color: INK }}>Snake</a>,{' '}
          <a href="/blocks" style={{ color: INK }}>Blocks</a> and{' '}
          <a href="/squash" style={{ color: INK }}>Squash</a>.
        </p>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @media(max-width:560px){.sm-page{padding-left:10px !important;padding-right:10px !important;}}
        .sm-btn{font-family:${SANS};font-weight:800;font-size:15px;border:2px solid var(--stg-acc-ink, var(--stg-acc));background:var(--stg-acc);color:var(--stg-onramp, #08222e);border-radius:999px;padding:11px 24px;cursor:pointer;}
        .sm-link{background:none;border:none;padding:0;cursor:pointer;font-family:${SANS};font-size:13px;font-weight:700;color:${MUTE};text-decoration:underline;}
        .sm-tool{font-family:${SANS};font-weight:800;font-size:13.5px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,.35));background:transparent;color:${INK};border-radius:999px;padding:0 15px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
        .sm-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;--sm-ink:var(--pst-ink, var(--stg-ink, #0b0f1a));--sm-bg:var(--pst-bg, var(--stg-ground, #ffffff));}
        .sm-bd{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%;max-width:480px;aspect-ratio:1/1;margin:0 auto;}
        .sm-pad{position:relative;border:1px solid var(--sm-ink);border-radius:16px;padding:0;margin:0;cursor:default;background:var(--hue);display:flex;align-items:center;justify-content:center;transition:background-color .07s linear,transform .07s ease-out;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;font:inherit;}
        .sm-bd.live .sm-pad{cursor:pointer;}
        .sm-pad svg{width:44%;height:44%;}
        .sm-pad svg *{fill:none;stroke:var(--sm-ink);stroke-width:7;stroke-linejoin:round;transition:stroke .07s linear;}
        .sm-pad.on{background:var(--sm-ink);transform:scale(.96);}
        .sm-pad.on svg *{stroke:var(--hue);}
        .sm-pad.want{background:var(--sm-ink);box-shadow:0 0 0 3px var(--sm-bg),0 0 0 5px var(--sm-ink);}
        .sm-pad.want svg *{stroke:var(--hue);}
        .sm-pad.miss{background:var(--pst-bad-bg,#fee2e2);border-color:var(--pst-bad,#b91c1c);animation:smShake .34s ease-out 1;}
        .sm-pad.miss svg *{stroke:var(--pst-bad,#b91c1c);}
        .sm-keys{font-size:12px;font-weight:700;opacity:.7;text-align:center;}
        @media (max-width:560px){.sm-bd{gap:8px;}.sm-pad{border-radius:14px;}}
        @media (hover:none),(pointer:coarse){.sm-keys{display:none;}}
        @keyframes smShake{0%,100%{transform:translateX(0);}20%{transform:translateX(-5px);}40%{transform:translateX(5px);}60%{transform:translateX(-3px);}80%{transform:translateX(3px);}}
        @media (prefers-reduced-motion:reduce){.sm-pad.miss{animation:none;}.sm-pad,.sm-pad svg *{transition:none;}}
      ` }} />
    </div>
  );
}
