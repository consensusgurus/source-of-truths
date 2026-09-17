'use client';

// Blitzed — Blitz with a third element on every line.
//
// Twenty problems, five rounds of four, and every one of them is three numbers
// and two operations: 5 + 10 × 2, not 47 × 6. The ladder climbs from 20 + 8 + 6
// to 21 × 24 − 16 and 9³ + 7 × 8. Twenty seconds a problem (Blitz gives
// fifteen, and a second operation earns five more) and one life: answer wrong,
// or let the clock hit zero, and the run stops at whatever round you reached.
//
// This file is BlitzClient.jsx with the key, the copy and the clock changed,
// and it shares that file's engine with Streak and Deep. The one mechanic a
// third element adds is in the bank, not here: the first distractor on most
// lines is the answer you get by doing the first operation and stopping, and
// scripts/verify-blitzed.mjs proves every line has exactly three operands and
// that the answer cannot be picked out by its last digit, by its size, or by
// where it sits once the options are sorted.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHoverStale } from '@/lib/hover-armed';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, Zap } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
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
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#3f6d1f',        // Blitzed identity: Blitz's lime, one step deeper (the stage paints the category step instead)
  accentSoft: '#eaf5e2', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_blitzed_help_seen';
const STATS_KEY = 'sot_blitzed_stats';

const Q_SECONDS = 20;
const TOTAL_Q = 20;
const PER_TIER = 4;
const TIER_NAMES = ['Warm-up', 'Steady', 'Quick', 'Sharp', 'Flat out'];

const fmtNum = (n) => Number(n).toLocaleString('en-US');

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
  const best = nums.reduce((m, n) => Math.max(m, rec[n].s || 0), 0);
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, perfect, cur, max, best };
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
    const sc = Math.max(0, Math.min(TOTAL_Q, Math.round(((m.scorePct || 0) / 100) * TOTAL_Q)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL_Q, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// i = index of the problem currently on screen; everything below i was answered
// correctly, so i IS the score. status 'lost' keeps pick (the wrong choice
// index, or null on a timeout) for the reveal.
const freshState = () => ({ v: 1, i: 0, status: 'playing', t0: null, tEnd: null, pick: null, timedOut: false });

export default function BlitzedClient({ puzzles = [], problemsByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const PROBLEMS = problemsByNum[PUZZLE.num] || [];
  const STORE_KEY = `sot_blitzed_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  // Hover off until the pointer moves again, so the box just clicked is not
  // outlined by a resting mouse when the next question paints. See
  // lib/hover-armed.js.
  const hovStale = useHoverStale(g.i);
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [qStart, setQStart] = useState(null);   // Date.now() when the current problem appeared
  const [lock, setLock] = useState(false);      // brief green flash between problems
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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
  // eslint-disable-next-line no-unused-vars -- the player chip lives in
  // DailyChrome (QuizNavHeader fetches its own identity); this fetch stays for
  // the cross-device stats merge.
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);
  const qStartRef = useRef(null);
  const lockRef = useRef(false);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('blitzed');
  const STAGE = isStage('blitzed', searchParams);
  // The register comes from the shared store the switch in the cap writes.
  // Resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('blitzed');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('blitzed'), '--stg-acc-lt': gameColorLight('blitzed'), '--stg-onramp-lt': gameOnrampLight('blitzed'), '--stg-acc-ink-lt': gameAccentInkLight('blitzed') };
  const Cap = STAGE ? StageChrome : LoftCap;
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
  const score = won ? TOTAL_Q : g.i;
  const problem = playing && started && g.i < TOTAL_Q ? PROBLEMS[g.i] : null;
  const deadProblem = g.status === 'lost' && g.i < TOTAL_Q ? PROBLEMS[g.i] : null;
  const tierNum = Math.min(4, Math.floor((playing ? g.i : Math.min(g.i, TOTAL_Q - 1)) / PER_TIER));

  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => { qStartRef.current = qStart; }, [qStart]);
  useEffect(() => { lockRef.current = lock; }, [lock]);

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
        if (saved && saved.v === 1 && typeof saved.i === 'number') {
          const next = { ...freshState(), ...saved };
          gRef.current = next;
          setG(next);
          if (next.status === 'playing' && next.t0) setQStart(Date.now());
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
        if (done || g.t0) localStorage.setItem('sot_blitzed_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_blitzed_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

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

  // The problem clock. Deadline math off Date.now so backgrounding the tab
  // never pauses it — on a mental-math game the clock is the only thing
  // standing between the player and a calculator.
  useEffect(() => {
    if (!started || !playing) return undefined;
    const iv = setInterval(() => {
      setNow(Date.now());
      const qs = qStartRef.current;
      if (qs && !lockRef.current && Date.now() - qs >= Q_SECONDS * 1000) {
        timeOut();
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, playing, g.i]);

  // Keys 1-4 and A-D answer. On a game scored by the clock, reaching for the
  // mouse is a real cost, so the keyboard is a first-class input here rather
  // than a convenience.
  useEffect(() => {
    if (!started || !playing) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      let idx = -1;
      if (k >= '1' && k <= '4') idx = Number(k) - 1;
      else if (k >= 'a' && k <= 'd') idx = k.charCodeAt(0) - 97;
      if (idx < 0) return;
      e.preventDefault();
      answer(idx);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, playing, g.i, lock]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'blitzed', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'blitzed', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'blitzed', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'blitzed', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'blitzed', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const remainMs = qStart ? Math.max(0, Q_SECONDS * 1000 - (now - qStart)) : Q_SECONDS * 1000;
  const remainFrac = remainMs / (Q_SECONDS * 1000);

  const REC_KEY = `sot_blitzed_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: cur.i, total: TOTAL_Q, correct: cur.i, guessesUsed: cur.i, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const answered = sc + (g2.status === 'lost' ? 1 : 0);
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL_Q, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL_Q, correct: sc, guessesUsed: answered, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // "Play again": wipe the saved board and run today's twenty again as
  // practice. The first completed attempt is what the daily leaderboard and the
  // local streak keep (recordStat is write-once per puzzle number), so a replay
  // never overwrites the recorded run.
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState());
    setQStart(null);
    setLock(false);
    setEndClosed(false);
  }

  function commit(next) { gRef.current = next; setG(next); }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    setQStart(Date.now());
    setNow(Date.now());
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function answer(k) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || lockRef.current) return;
    const pp = PROBLEMS[cur.i];
    if (!pp) return;
    if (k === pp.correct) {
      vibrate(HAPT.ok);
      if (cur.i + 1 >= TOTAL_Q) {
        const done = { ...cur, i: TOTAL_Q, status: 'won', tEnd: Date.now() };
        vibrate(HAPT.win);
        postResult(done, TOTAL_Q);
        commit(done);
        return;
      }
      setLock(true);
      lockRef.current = true;
      commit({ ...cur, lastRight: cur.i });
      setTimeout(() => {
        const c2 = gRef.current;
        if (c2.status !== 'playing') { setLock(false); lockRef.current = false; return; }
        commit({ ...c2, i: c2.i + 1, lastRight: null });
        setQStart(Date.now());
        setNow(Date.now());
        setLock(false);
        lockRef.current = false;
      }, 380);
    } else {
      const done = { ...cur, status: 'lost', tEnd: Date.now(), pick: k, timedOut: false };
      vibrate(HAPT.wrong);
      postResult(done, done.i);
      commit(done);
    }
  }

  function timeOut() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const done = { ...cur, status: 'lost', tEnd: Date.now(), pick: null, timedOut: true };
    vibrate(HAPT.wrong);
    postResult(done, done.i);
    commit(done);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/blitzed${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const blocks = Math.floor(score / PER_TIER);
    const part = score % PER_TIER >= 2 ? 1 : 0;
    const bar = '\u{1F7E9}'.repeat(blocks) + (blocks < 5 && part ? '\u{1F7E8}' : '') + '⬜'.repeat(Math.max(0, 5 - blocks - part));
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Blitzed #${PUZZLE.num} · all 20 · ${elapsed}${streakBit}`
      : `Blitzed #${PUZZLE.num} · ${score}/${TOTAL_Q} · ${elapsed}${streakBit}`;
    return `${head}\n${bar}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Blitzed #${PUZZLE.num} — twenty three-number mental math problems, ${Q_SECONDS} seconds each, one life.\n${shareUrl()}`
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
      lead="Twenty problems. Three numbers in every one. Twenty seconds each. One life."
      steps={[
        <>Every line is <b>three numbers and two operations</b>, like 5 + 10 × 2. Do it in your head and pick the right answer from four.</>,
        <>They get harder as you go: <b>five rounds of four</b>, from 20 + 8 + 6 up to two-digit multiplication, brackets, percentages and cubes.</>,
        <>Precedence counts: <b>× and ÷ before + and −</b>, brackets first. 5 + 10 × 2 is 25, not 30.</>,
        <>A wrong answer, or a clock at zero, <b>ends the run on the spot</b>. Every problem you clear is a point.</>,
        <>You have <b>{Q_SECONDS} seconds a problem</b> and the clock does not pause, so reaching for a calculator costs you the problem.</>,
      ]}
      knack="Keys 1 to 4 answer, so you never have to reach for the mouse. Finish the line: the commonest miss is doing the first operation and stopping, and that answer is always on the board waiting for you."
      footer="Everyone plays the same twenty in the same order. Ties on the daily board break by time. Clear all twenty for a clean run."
    />
  );

  const scoreRow = (label, value, accent) => (
    <span style={{ whiteSpace: 'nowrap' }}>{label} <b style={{ color: accent || INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</b></span>
  );

  const choiceBtn = (pp, k, dead) => {
    const isRight = k === pp.correct;
    const isPick = dead ? g.pick === k : false;
    const flash = !dead && lock && g.lastRight != null && isRight;
    let bg = T.white, border = 'rgba(28,30,36,0.4)', color = COLORS.ink;
    if (flash) { bg = '#e7f3ec'; border = COLORS.green; color = COLORS.green; }
    if (dead && isRight) { bg = '#e7f3ec'; border = COLORS.green; color = '#0f5c2e'; }
    if (dead && isPick && !isRight) { bg = '#fdecef'; border = COLORS.rust; color = COLORS.rust; }
    return (
      <button
        key={k}
        className="bd-choice"
        disabled={dead || lock}
        onClick={() => answer(k)}
        style={{ background: bg, borderColor: border, color, cursor: dead || lock ? 'default' : 'pointer' }}
      >
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: 'inherit', opacity: 0.6 }}>{k + 1}</span>
        <span style={{ fontFamily: MONO, fontSize: 21, fontWeight: 500, letterSpacing: '-0.01em' }}>{fmtNum(pp.choices[k])}</span>
      </button>
    );
  };

  const qCard = (pp, dead) => (
    <div>
      <div className="bd-prob">{pp.q}</div>
      <div className={`bd-grid${hovStale ? ' nohov' : ''}`}>
        {[0, 1, 2, 3].map((k) => choiceBtn(pp, k, dead))}
      </div>
    </div>
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
      <DailyChrome slug="blitzed" name="Blitzed" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. An arcade run ends the moment you are wrong, so how far you got IS the score.
          A run that banked anything is a partial and the cap goes amber. */}
      {LOFT && (
        <Cap gameKey="blitzed" quizId={PUZZLE.quizId}
          name="Blitzed"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${score}/${TOTAL_Q}`, k: 'score' },
            { v: elapsed, k: 'time' },
            { v: `${tierNum + 1}/5`, k: `round · ${TIER_NAMES[tierNum]}` },
          ] : [
            { v: `${score}/${TOTAL_Q}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="bd-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.bd-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .bd-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .bd-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .bd-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
          .bd-choice{font-family:${SANS};display:flex;align-items:center;justify-content:center;gap:10px;border:2px solid;border-radius:9px;padding:15px 12px;transition:background .12s ease,border-color .12s ease;}
          .bd-grid:not(.nohov) .bd-choice:not(:disabled):hover{background:var(--stg-surf2, ${COLORS.paper});}
          .bd-prob{font-family:${MONO};font-weight:500;font-size:44px;line-height:1.15;letter-spacing:-0.02em;color:${INK};text-align:center;padding:14px 4px 20px;font-variant-numeric:tabular-nums;}
          @media(max-width:560px){.bd-prob{font-size:36px;padding:10px 2px 16px;}}
          .bd-timebar{height:7px;border-radius:4px;background:var(--stg-surf, ${COLORS.paper});overflow:hidden;}
          .bd-timefill{height:100%;border-radius:4px;transition:width .1s linear;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="blitzed" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'BLITZED'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: FADED, marginBottom: 5 }}>Today&rsquo;s twenty</div>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 22, color: ACC_INK, lineHeight: 1.2, marginBottom: 14 }}>Three numbers a line, against the clock</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Twenty problems in five rounds, easy to hard, and every one is three numbers and two operations, like 5 + 10 × 2. {Q_SECONDS} seconds each, one life. Do it in your head and pick from four; every problem you clear is a point. Keys 1 to 4 answer. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="bd-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} style={{ color: ACC_INK }} />
              <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{score}</b>
              <span>of {TOTAL_Q}</span>
            </span>
            {scoreRow('time', elapsed)}
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>round <b style={{ color: ACC_INK, fontWeight: 500 }}>{tierNum + 1}/5</b> · {TIER_NAMES[tierNum]}</span>
          </div>
          )}

          {playing && problem && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 2px' }}>
                <div className="bd-timebar" style={{ flex: 1 }}>
                  <div className="bd-timefill" style={{ width: `${Math.round(remainFrac * 100)}%`, background: remainFrac > 0.4 ? COLORS.green : remainFrac > 0.18 ? '#b45309' : COLORS.rust }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: remainFrac > 0.18 ? `var(--stg-mute, ${COLORS.faded})` : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>{Math.ceil(remainMs / 1000)}s</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, opacity: 0.75 }}>Problem {g.i + 1} of {TOTAL_Q}</div>
              {qCard(problem, false)}
            </div>
          )}

          {g.status === 'lost' && deadProblem && (
            <div style={{ paddingTop: 10 }}>
              <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 800, color: `var(--stg-ink, ${COLORS.rust})`, marginBottom: 4 }}>
                {g.timedOut ? 'Time ran out.' : 'Wrong answer.'} The run ends at {score}.
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, opacity: 0.75 }}>Problem {g.i + 1} of {TOTAL_Q} — the one that stopped you</div>
              {qCard(deadProblem, true)}
            </div>
          )}

          {won && (
            <div style={{ textAlign: 'center', padding: '18px 6px 10px' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.green, marginBottom: 6 }}>20 for 20.</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: FADED }}>Forty operations without a slip, in {elapsed}. Nobody beats that today, they can only tie it faster.</div>
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && playing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>One wrong answer ends the run. Everything you clear is banked. Multiply and divide first. Keys 1 to 4 answer.</span>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>A clean run: <span style={{ color: ACC_INK }}>all 20</span>.</> : <>You cleared <span style={{ color: ACC_INK }}>{score} of {TOTAL_Q}</span>, out in the {TIER_NAMES[tierNum].toLowerCase()} round.</>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {won
                  ? 'Twenty lines, forty operations, no slips, no calculator. That is the whole game.'
                  : score >= 17 ? 'Into the last round. Cubes and two-digit products with a tail, under twenty seconds, is a real skill.'
                  : score >= 13 ? 'You cleared the sharp round. Most people do not.'
                  : score >= 9 ? 'Through the middle, where the brackets and percentages start biting.'
                  : score >= 5 ? 'Past the warm-up, where precedence arrives. It steepens quickly from there.'
                  : 'A short one today. The first round is meant to be free, so finish the line before you answer.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Twenty new problems in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'Twenty new problems at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/blitzed?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>run yesterday&rsquo;s twenty &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/blitzed" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Blitzed &rarr;</a>
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
              name="Blitzed"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${`${score}/${TOTAL_Q}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Blitzed all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Asked"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/blitzed?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Blitzed', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/blitzed?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="blitzed" name="Blitzed" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="blitzed" name="Blitzed" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="blitzed" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="blitzed" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Blitzed to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s twenty, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s twenty, every day.</p>
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
        <DailyEndCard modal self="blitzed" won={won}
          headline={won ? <>A clean run.</> : score >= 13 ? <>Deep into it.</> : <>The numbers stopped you.</>}
          subline={won
            ? <>20/20 &middot; {elapsed}</>
            : <>{score}/{TOTAL_Q} &middot; {g.timedOut ? 'the clock got you' : 'one wrong answer'} &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="bd-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Blitzed</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Blitzed is a free daily mental math game from Mind Loft, and the harder sibling of <a href="/blitz" style={{ color: INK, fontWeight: 800 }}>Blitz</a>. Every one of its twenty problems has three numbers and two operations, like 5 + 10 × 2, so there is always a second step to hold in your head. The lines climb through five rounds, from small chains and the times tables up to brackets, percentages of a number with a tail, two-digit products and cubes. You get twenty seconds each and one life, so your score is simply how far up the ladder you got before a wrong answer or an empty clock stopped you.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The four options are not padding. Every wrong answer on the board is a mistake somebody actually makes, and the one a third number invites most is doing the first operation and stopping, so that answer is usually sitting there. The rest are a dropped carry, an ignored bracket, the left-to-right reading of a line that needs precedence, the cube next door. You cannot pick the right one out by its last digit or by its size, which means there is no way through but the arithmetic.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Everyone plays the same twenty problems in the same order each day, so the daily leaderboard is a straight fight: furthest wins, and ties break by time. Twenty new problems drop every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. If two numbers a line is enough, <a href="/blitz" style={{ color: INK, fontWeight: 800 }}>Blitz</a> runs the same ladder with a fifteen-second clock. More numbers: <a href="/crunch" style={{ color: INK, fontWeight: 800 }}>Crunch</a> and <a href="/cipher" style={{ color: INK, fontWeight: 800 }}>Cipher</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
