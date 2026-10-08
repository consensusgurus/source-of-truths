'use client';

// Streak — the daily trivia gauntlet.
//
// Forty questions stand between you and a perfect run. They climb from gimme
// to brutal in five tiers of eight, every tier cycling the same eight
// categories, and everyone in the world faces the same forty in the same
// order. You have twenty seconds a question and one life: answer wrong, or
// let the clock hit zero, and the run is over. Every question you clear is a
// point, so there is never a reason to stop playing and never a way back in.
//
// The whole game is the streak. Ties on the daily board break by time, so a
// quick death at 12 beats a slow death at 12.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHoverStale } from '@/lib/hover-armed';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, Flame } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import RunDoorPop from '../circuits/RunDoorPop';
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
  accent: '#e11d48',        // Streak identity — buzzer red
  accentSoft: '#fdecef', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_streak_help_seen';
const STATS_KEY = 'sot_streak_stats';

const Q_SECONDS = 20;
const TOTAL_Q = 40;
const TIER_NAMES = ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'];

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

// i = index of the question currently being faced; every question below i was
// answered correctly, so i IS the streak. status 'lost' keeps pick (the wrong
// choice index, or null on a timeout) for the reveal.
const freshState = () => ({ v: 1, i: 0, status: 'playing', t0: null, tEnd: null, pick: null, timedOut: false });

export default function StreakClient({ puzzles = [], questionsByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const QUESTIONS = questionsByNum[PUZZLE.num] || [];
  const STORE_KEY = `sot_streak_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  // Hover off until the pointer moves again, so the box just clicked is not
  // outlined by a resting mouse when the next question paints. See
  // lib/hover-armed.js.
  const hovStale = useHoverStale(g.i);
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [qStart, setQStart] = useState(null);   // Date.now() when current question appeared
  const [lock, setLock] = useState(false);      // brief green flash between questions
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
  // eslint-disable-next-line no-unused-vars -- the player chip moved into
  // DailyChrome (QuizNavHeader fetches its own identity); the fetch below
  // stays for the cross-device stats merge.
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
  const LOFT = isLoft('streak');
  const STAGE = isStage('streak', searchParams);
  // The register comes from the shared store the switch in the cap writes.
  // Resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('streak');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('streak'), '--stg-acc-lt': gameColorLight('streak'), '--stg-onramp-lt': gameOnrampLight('streak'), '--stg-acc-ink-lt': gameAccentInkLight('streak') };
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
  const depth = won ? TOTAL_Q : g.i;
  const question = playing && started && g.i < TOTAL_Q ? QUESTIONS[g.i] : null;
  const deadQuestion = g.status === 'lost' && g.i < TOTAL_Q ? QUESTIONS[g.i] : null;
  const tierNum = Math.min(4, Math.floor((playing ? g.i : Math.min(g.i, TOTAL_Q - 1)) / 8));

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
        if (done || g.t0) localStorage.setItem('sot_streak_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_streak_day');
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

  // The question clock. Deadline math off Date.now so backgrounding the tab
  // never pauses it — the clock is the anti-lookup mechanic.
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

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'streak', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'streak', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'streak', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'streak', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'streak', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const remainMs = qStart ? Math.max(0, Q_SECONDS * 1000 - (now - qStart)) : Q_SECONDS * 1000;
  const remainFrac = remainMs / (Q_SECONDS * 1000);

  const REC_KEY = `sot_streak_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: cur.i, total: TOTAL_Q, correct: cur.i, guessesUsed: cur.i, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const answered = score + (g2.status === 'lost' ? 1 : 0);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: TOTAL_Q, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: TOTAL_Q, correct: score, guessesUsed: answered, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // "Play again" (the button under the board, and the end card's Try again):
  // wipe the saved board and run today's gauntlet again as practice. The first
  // completed attempt is what the daily leaderboard and the local streak keep
  // (recordStat is write-once per puzzle number), so a replay never overwrites
  // the recorded run.
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
    const qq = QUESTIONS[cur.i];
    if (!qq) return;
    if (k === qq.correct) {
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
      }, 450);
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

  function shareUrl() { return withRef(`mindloftdaily.com/streak${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const blocks = Math.floor(depth / 8);
    const part = depth % 8 >= 4 ? 1 : 0;
    const bar = '\u{1F7E5}'.repeat(blocks) + (blocks < 5 && part ? '\u{1F7E7}' : '') + '⬜'.repeat(Math.max(0, 5 - blocks - part));
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Streak #${PUZZLE.num} · ran the table, 40/40 · ${elapsed}${streakBit}`
      : `Streak #${PUZZLE.num} · ${depth} straight · ${elapsed}${streakBit}`;
    return `${head}\n${bar}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Streak #${PUZZLE.num}, the daily trivia gauntlet from Mind Loft. Forty questions, one life.\n${shareUrl()}`
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
      lead="Forty questions, one life."
      steps={[
        <>Answer multiple-choice trivia until you get one wrong. <b>Every question you clear is a point.</b></>,
        <>A wrong answer, or a clock at zero, <b>ends the run on the spot</b>.</>,
        <>You get <b>{Q_SECONDS} seconds a question</b>, and the clock does not pause, so looking things up costs the run.</>,
        <>The forty climb in <b>five rounds of eight</b>, from gimmes to genuinely brutal, each round cycling the same eight categories: geography, science, history, sports, movies, music, books, and a grab bag.</>,
      ]}
      knack="There is no reason to stop early. Answering can only add points, and a miss keeps everything you banked."
      footer="Everyone plays the same forty in the same order. Ties on the daily board break by time, so sure-footed beats slow. Clear all forty and you have run the table."
    />
  );

  const scoreRow = (label, value, accent) => (
    <span style={{ whiteSpace: 'nowrap' }}>{label} <b style={{ color: accent || INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</b></span>
  );

  // ---- the board pieces (2026-10-07 rebuild) ----
  // An answer button: a lettered badge and the choice, in stage tokens. The
  // right answer on a dead question is lit only once the end card's Reveal is
  // pressed on a loft page, exactly as before.
  const choiceBtn = (qq, k, dead) => {
    const isRight = k === qq.correct;
    const isPick = dead ? g.pick === k : false;
    const flash = !dead && lock && g.lastRight != null && isRight;
    const good = flash || (dead && isRight && (!LOFT || revealed));
    const bad = dead && isPick && !isRight;
    let tone = '';
    if (good) tone = ' good';
    if (bad) tone = ' bad';
    return (
      <button
        key={k}
        type="button"
        className={`sk-choice${tone}`}
        disabled={dead || lock}
        onClick={() => answer(k)}
        style={{ cursor: dead || lock ? 'default' : 'pointer' }}
      >
        <span className="sk-key" aria-hidden="true">{String.fromCharCode(65 + k)}</span>
        <span className="sk-ct">{qq.choices[k]}</span>
      </button>
    );
  };

  // The question card (category and round chips over the question), then the
  // four answers: two across on a computer, one column on a phone.
  const qCard = (qq, dead) => (
    <div>
      <div className="sk-qcard">
        <div className="sk-chips">
          <span className="sk-chip acc">{qq.cat}</span>
          <span className="sk-chip">Round {qq.tier} &middot; {TIER_NAMES[qq.tier - 1]}</span>
        </div>
        <div className="sk-q">{qq.q}</div>
      </div>
      <div className={`sk-grid${hovStale ? ' nohov' : ''}`}>
        {[0, 1, 2, 3].map((k) => choiceBtn(qq, k, dead))}
      </div>
    </div>
  );

  // THE CLIMB: five rounds of eight, each question a segment. Cleared segments
  // fill with the accent, the one you are on is outlined, the rest are empty
  // slots. A sidebar that fills from the bottom on a computer, a strip across
  // the top on a phone (the same markup, re-laid by CSS).
  const climb = (
    <div className="sk-climb" aria-label={`The climb: ${depth} of ${TOTAL_Q} cleared`} role="img">
      <span className="sk-climbh">The climb</span>
      <div className="sk-tiers">
        {TIER_NAMES.map((name, t) => {
          const reached = depth > t * 8 || (playing && started && tierNum === t);
          return (
            <div key={name} className="sk-tier" style={{ order: 4 - t }}>
              <span className={`sk-tname${reached ? ' on' : ''}`}>{name}</span>
              <div className="sk-steps">
                {Array.from({ length: 8 }, (_, j) => {
                  const q = t * 8 + j;
                  const cls = q < depth ? ' done' : (playing && started && q === g.i ? ' cur' : '');
                  return <span key={j} className={`sk-step${cls}`} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // The per-question clock as a ring. Driven by the same remainFrac the old
  // bar read; nothing about the timer itself changed.
  const RING_C = 2 * Math.PI * 33;
  // Display clamps only: for the first tick after a question paints, `now`
  // can trail qStart, which read as 21s on a 20 second clock.
  const ringFrac = Math.min(1, Math.max(0, remainFrac));
  const ringSecs = Math.min(Q_SECONDS, Math.ceil(remainMs / 1000));
  const ringTone = remainFrac > 0.4 ? `var(--stg-acc-ink, ${COLORS.green})` : remainFrac > 0.18 ? 'var(--stg-warn, #b45309)' : `var(--stg-bad, ${COLORS.accent})`;
  const ring = (
    <svg className="sk-ring" viewBox="0 0 78 78" role="timer" aria-label={`${ringSecs} seconds left`}>
      <circle cx="39" cy="39" r="33" fill="none" stroke="currentColor" strokeWidth="7" style={{ color: 'var(--stg-line2, rgba(28,30,36,0.16))' }} />
      <circle cx="39" cy="39" r="33" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - ringFrac)} transform="rotate(-90 39 39)"
        style={{ color: ringTone, transition: 'stroke-dashoffset .1s linear' }} />
      <text x="39" y="45" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="20" fill="currentColor" style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{ringSecs}s</text>
    </svg>
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
      <DailyChrome slug="streak" name="Streak" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. An arcade run ends the moment you are wrong, so how far you got IS the score.
          A run that banked anything is a partial and the cap goes amber. */}
      {LOFT && (
        <Cap gameKey="streak" quizId={PUZZLE.quizId}
          name="Streak"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : (depth > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${depth}/${TOTAL_Q}`, k: 'straight' },
            { v: elapsed, k: 'time' },
            { v: `${tierNum + 1}/5`, k: `round · ${TIER_NAMES[tierNum]}` },
          ] : [
            { v: `${depth}/${TOTAL_Q}`, k: 'straight' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sk-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .sk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sk-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
          .sk-choice{display:flex;align-items:center;gap:14px;font-family:${SANS};font-weight:800;font-size:18px;text-align:left;border:1.5px solid var(--stg-line2, rgba(28,30,36,0.4));border-radius:14px;padding:14px 16px;min-height:76px;box-sizing:border-box;line-height:1.3;background:var(--stg-surf, ${T.white});color:${INK};transition:background .12s ease,border-color .12s ease;}
          .sk-choice.good{background:color-mix(in srgb, var(--stg-good, ${COLORS.green}) 18%, var(--stg-surf, ${T.white}));border-color:var(--stg-good, ${COLORS.green});}
          .sk-choice.bad{background:color-mix(in srgb, var(--stg-bad, ${COLORS.accent}) 16%, var(--stg-surf, ${T.white}));border-color:var(--stg-bad, ${COLORS.accent});}
          .sk-grid:not(.nohov) .sk-choice:not(:disabled):hover{background:var(--stg-surf2, ${COLORS.paper});border-color:var(--stg-acc, ${COLORS.accent});}
          .sk-key{width:34px;height:34px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:14px;font-weight:500;background:var(--stg-surf2, ${COLORS.paper});color:var(--stg-acc-ink, ${COLORS.accent});}
          .sk-choice.good .sk-key{background:var(--stg-good, ${COLORS.green});color:var(--stg-ground, #ffffff);}
          .sk-choice.bad .sk-key{background:var(--stg-bad, ${COLORS.accent});color:var(--stg-ground, #ffffff);}
          .sk-ct{min-width:0;overflow-wrap:anywhere;}
          .sk-play{display:flex;gap:28px;align-items:flex-start;}
          .sk-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:20px;}
          .sk-climb{width:96px;flex:none;display:flex;flex-direction:column;gap:10px;padding-top:4px;}
          .sk-climbh{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:${FADED};}
          .sk-tiers{display:flex;flex-direction:column;gap:10px;}
          .sk-tier{display:flex;flex-direction:column;gap:4px;}
          .sk-tname{font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${FADED};white-space:nowrap;}
          .sk-tname.on{color:var(--stg-acc-ink, ${COLORS.accent});}
          .sk-steps{display:flex;flex-direction:column-reverse;gap:3px;}
          .sk-step{height:10px;border-radius:3px;box-sizing:border-box;border:1px solid var(--stg-cell-line, rgba(28,30,36,0.32));background:transparent;}
          .sk-step.done{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});}
          .sk-step.cur{border:2px solid var(--stg-acc-ink, ${COLORS.accent});background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 30%, transparent);}
          .sk-head{display:flex;align-items:center;justify-content:space-between;gap:14px;}
          .sk-count{display:flex;align-items:baseline;gap:10px;min-width:0;}
          .sk-num{font-family:${MONO};font-size:64px;line-height:1;font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});font-variant-numeric:tabular-nums;}
          .sk-cside{display:flex;flex-direction:column;gap:3px;}
          .sk-inrow{font-size:15px;font-weight:800;color:${INK};}
          .sk-sub{font-family:${MONO};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${FADED};}
          .sk-ring{width:78px;height:78px;flex:none;}
          .sk-qcard{background:var(--stg-surf, ${COLORS.paper});border:1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:18px;padding:24px 24px 26px;display:flex;flex-direction:column;gap:12px;margin-bottom:14px;}
          .sk-chips{display:flex;gap:8px;flex-wrap:wrap;}
          .sk-chip{font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;border-radius:6px;padding:4px 8px;background:var(--stg-surf2, rgba(28,30,36,0.08));color:var(--stg-ink2, ${COLORS.ink});}
          .sk-chip.acc{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #ffffff);}
          .sk-q{font-family:${SANS};font-size:26px;font-weight:800;line-height:1.25;letter-spacing:-0.01em;color:${INK};}
          .sk-note{font-size:13px;font-weight:600;color:${FADED};}
          @media(max-width:640px){
            .sk-play{flex-direction:column;gap:16px;}
            .sk-main{width:100%;gap:16px;}
            .sk-climb{width:100%;padding-top:0;gap:0;}
            .sk-climbh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);}
            .sk-tiers{flex-direction:row;gap:4px;}
            .sk-tier{flex:1;min-width:0;flex-direction:column-reverse;gap:5px;order:0 !important;}
            .sk-tname{font-size:8.5px;letter-spacing:0.08em;overflow:hidden;text-overflow:ellipsis;}
            .sk-steps{flex-direction:row;gap:2px;}
            .sk-step{flex:1;height:8px;border-radius:2px;}
            .sk-num{font-size:52px;}
            .sk-inrow{font-size:14px;}
            .sk-ring{width:62px;height:62px;}
            .sk-qcard{padding:18px;border-radius:16px;gap:10px;}
            .sk-chip{font-size:10px;padding:3px 7px;}
            .sk-q{font-size:21px;}
            .sk-grid{grid-template-columns:1fr;gap:10px;}
            .sk-choice{font-size:17px;min-height:62px;padding:10px 14px;}
            .sk-key{width:32px;height:32px;font-size:13px;}
            .sk-note{font-size:12px;}
          }
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="streak" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'STREAK'.split('').map((ch, i) => (
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Streak is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Forty questions, easy to brutal, {Q_SECONDS} seconds each, and one life. Answer until you miss; every question you clear is a point. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sk-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Flame size={13} style={{ color: ACC_INK }} />
              <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{depth}</b>
              <span>straight</span>
            </span>
            {scoreRow('time', elapsed)}
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>round <b style={{ color: ACC_INK, fontWeight: 500 }}>{tierNum + 1}/5</b> · {TIER_NAMES[tierNum]}</span>
          </div>
          )}

          <div className="sk-play">
            {climb}
            <div className="sk-main">
              {/* the streak itself, large, beside the clock */}
              <div className="sk-head">
                <div className="sk-count">
                  <span className="sk-num">{depth}</span>
                  <div className="sk-cside">
                    <span className="sk-inrow">in a row</span>
                    <span className="sk-sub">
                      {playing && question ? <>Question {g.i + 1} of {TOTAL_Q}</> : <>{depth} of {TOTAL_Q} cleared</>}
                      {board && board.plays > 0 && board.best != null && <> &middot; top run {board.best}</>}
                    </span>
                  </div>
                </div>
                {playing && question && ring}
              </div>

              {playing && question && qCard(question, false)}

              {g.status === 'lost' && deadQuestion && (
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 800, color: ACC_INK, marginBottom: 10 }}>
                    {g.timedOut ? 'Time ran out.' : 'Wrong answer.'} The run ends at {depth}.
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, marginBottom: 8 }}>Question {g.i + 1} of {TOTAL_Q}, the one that got you</div>
                  {qCard(deadQuestion, true)}
                </div>
              )}

              {won && (
                <div className="sk-qcard" style={{ textAlign: 'center', padding: '22px 14px' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: `var(--stg-good, ${COLORS.green})`, marginBottom: 6 }}>40 for 40.</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: FADED }}>You ran the table in {elapsed}. That is the whole gauntlet.</div>
                </div>
              )}

              {started && (
                <div className="sk-note">One wrong answer, or a clock at zero, ends the run. Everything you clear is banked.</div>
              )}
            </div>
          </div>
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>A perfect run: <span style={{ color: ACC_INK }}>40 straight</span>.</> : <>You cleared <span style={{ color: ACC_INK }}>{depth} of {TOTAL_Q}</span>.</>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {won
                  ? 'Nobody can beat that score. They can only tie it faster.'
                  : depth >= 32 ? 'Deep into the brutal round. That is a serious run.'
                  : depth >= 24 ? 'You made it through the medium round and into the hard stuff.'
                  : depth >= 16 ? 'Through the easy rounds and into real trivia.'
                  : depth >= 8 ? 'The first round is behind you. The gauntlet gets mean fast.'
                  : 'The gauntlet claims its share early. Tomorrow is a new run.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Streak in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new gauntlet drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/streak?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>run yesterday&rsquo;s gauntlet &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/streak" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Streak &rarr;</a>
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
              name="Streak"
              catRank={catRank}
              outcome={won ? 'won' : (depth > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${`${depth}/${TOTAL_Q}`} straight \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Streak all time` : 'all-time rank' }
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
                  href: `/streak?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Streak', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/streak?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="streak" name="Streak" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="streak" name="Streak" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="streak" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="streak" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Streak to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s gauntlet, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s gauntlet, every day.</p>
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
        <DailyEndCard modal self="streak" won={won}
          headline={won ? <>You ran the table.</> : depth >= 24 ? <>A serious run.</> : <>The gauntlet got you.</>}
          subline={won
            ? <>40/40 &middot; a perfect run &middot; {elapsed}</>
            : <>{depth}/{TOTAL_Q} &middot; {g.timedOut ? 'the clock got you' : 'one wrong answer'} &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {/* THE GAUNTLET DOOR (owner, 2026-10-01): a player who opens one of the
          seven quizzes on its own page is offered the whole Trivia Gauntlet
          first, on the gate. See app/circuits/RunDoorPop.jsx. */}
      <RunDoorPop id="gauntlet" ready={hydrated && preStart && isTodays} self="Streak" />

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="sk-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Streak</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Streak is a free daily trivia survival game from Mind Loft. Forty multiple-choice questions climb from questions anyone can answer to questions almost nobody can, and a single wrong answer ends the run. Your score is simply how many you cleared in a row, which makes every question a small act of nerve: the deeper you go, the more you have to lose.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Everyone plays the same forty questions in the same order each day, so the daily leaderboard is a straight fight: deepest run wins, and ties break by time. Twenty seconds a question keeps it honest. The questions rotate through eight categories every round, so a run rewards range rather than one deep specialty.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new gauntlet drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/rung" style={{ color: INK, fontWeight: 800 }}>Rung</a>, our daily word ladder, <a href="/crunch" style={{ color: INK, fontWeight: 800 }}>Crunch</a>, our daily numbers round, and <a href="/taire" style={{ color: INK, fontWeight: 800 }}>Taire</a>, our daily solitaire.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
