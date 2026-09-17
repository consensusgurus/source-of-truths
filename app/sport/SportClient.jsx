'use client';

// Sport — the daily sports gauntlet.
//
// Twenty-five sports questions stand between you and a perfect run. They climb
// from gimme to expert in five tiers of five, every tier cycling the same five
// lanes (the NFL, the NBA, MLB, soccer, and everything else), and everyone
// faces the same twenty-five in the same order. You have twenty seconds a
// question and one life: answer wrong, or let the clock hit zero, and the run
// is over. Every question you clear is a point, so there is never a reason to
// stop playing and never a way back in.
//
// EVERY FACT IN THE BANK IS FROZEN: a completed season, a numbered final, a
// retired player's settled total, a franchise date, a rule that has stood for
// years. Never a live career leaderboard or a current champion, because those
// answers change under the bank while nobody is looking.
//
// Streak asks whether you know a little about everything and Deep asks how far
// down one subject you can go. Sport asks whether you were watching. Ties on the
// daily board break by time, so a quick death at 12 beats a slow one.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHoverStale } from '@/lib/hover-armed';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, Trophy } from 'lucide-react';
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
  accent: '#7c2d12',        // Sport identity — leather brown
  accentSoft: '#fbeee6', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_sport_help_seen';
const STATS_KEY = 'sot_sport_stats';

const Q_SECONDS = 20;
const TOTAL_Q = 25;
const PER_TIER = 5;
const TIER_NAMES = ['Warm-up', 'First half', 'Second half', 'Crunch time', 'Overtime'];

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
// answered correctly, so i IS the run. status 'lost' keeps pick (the wrong
// choice index, or null on a timeout) for the reveal.
const freshState = () => ({ v: 1, i: 0, status: 'playing', t0: null, tEnd: null, pick: null, timedOut: false });

export default function SportClient({ puzzles = [], questionsByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const QUESTIONS = questionsByNum[PUZZLE.num] || [];
  const STORE_KEY = `sot_sport_${PUZZLE.num}`;

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
  const LOFT = isLoft('sport');
  const STAGE = isStage('sport', searchParams);
  // The register comes from the shared store the switch in the cap writes.
  // Resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('sport');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('sport'), '--stg-acc-lt': gameColorLight('sport'), '--stg-onramp-lt': gameOnrampLight('sport'), '--stg-acc-ink-lt': gameAccentInkLight('sport') };
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
        if (done || g.t0) localStorage.setItem('sot_sport_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_sport_day');
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
  const iq = useIqStanding({ game: 'sport', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'sport', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'sport', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'sport', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'sport', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const remainMs = qStart ? Math.max(0, Q_SECONDS * 1000 - (now - qStart)) : Q_SECONDS * 1000;
  const remainFrac = remainMs / (Q_SECONDS * 1000);

  const REC_KEY = `sot_sport_rec_${PUZZLE.num}`;
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
  // wipe the saved board and run today's questions again as practice. The first
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

  function shareUrl() { return withRef(`mindloftdaily.com/sport${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const blocks = Math.floor(depth / PER_TIER);
    const part = depth % PER_TIER >= 3 ? 1 : 0;
    const bar = '\u{1F7EB}'.repeat(blocks) + (blocks < 5 && part ? '\u{1F7E7}' : '') + '⬜'.repeat(Math.max(0, 5 - blocks - part));
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Sport #${PUZZLE.num} · ran the table, 25/25 · ${elapsed}${streakBit}`
      : `Sport #${PUZZLE.num} · ${depth} straight · ${elapsed}${streakBit}`;
    return `${head}\n${bar}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Sport #${PUZZLE.num} — the daily sports gauntlet from Mind Loft. Twenty-five questions, one life.\n${shareUrl()}`
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
      lead="Twenty-five questions on sport, one life."
      steps={[
        <>Answer multiple-choice sports questions until you get one wrong. <b>Every question you clear is a point.</b></>,
        <>A wrong answer, or a clock at zero, <b>ends the run on the spot</b>.</>,
        <>You get <b>{Q_SECONDS} seconds a question</b>, and the clock does not pause, so looking things up costs the run.</>,
        <>The twenty-five climb in <b>five rounds of five</b>, from gimmes to genuinely obscure, each round cycling the same five lanes: the NFL, the NBA, MLB, soccer, and everything else.</>,
      ]}
      knack="Every round asks the same five lanes in the same order, so you always know what is coming next. The sport you do not follow is the one that ends most of your runs."
      footer="Everyone plays the same twenty-five in the same order. Ties on the daily board break by time, so sure-footed beats slow. Clear all twenty-five and you have run the table."
    />
  );

  const scoreRow = (label, value, accent) => (
    <span style={{ whiteSpace: 'nowrap' }}>{label} <b style={{ color: accent || INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</b></span>
  );

  const choiceBtn = (qq, k, dead) => {
    const isRight = k === qq.correct;
    const isPick = dead ? g.pick === k : false;
    const flash = !dead && lock && g.lastRight != null && isRight;
    let bg = T.white, border = 'rgba(28,30,36,0.4)', color = COLORS.ink;
    if (flash) { bg = '#e7f3ec'; border = COLORS.green; color = COLORS.green; }
    if (dead && isRight) { bg = '#e7f3ec'; border = COLORS.green; color = '#0f5c2e'; }
    if (dead && isPick && !isRight) { bg = '#fdecef'; border = COLORS.accent; color = COLORS.accent; }
    return (
      <button
        key={k}
        className="sp-choice"
        disabled={dead || lock}
        onClick={() => answer(k)}
        style={{ background: bg, borderColor: border, color, cursor: dead || lock ? 'default' : 'pointer' }}
      >
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: 'inherit', opacity: 0.65, marginRight: 9 }}>{String.fromCharCode(65 + k)}</span>
        {qq.choices[k]}
      </button>
    );
  };

  const qCard = (qq, dead) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: ACC_INK }}>{qq.cat}</span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: FADED, opacity: 0.75 }}>{TIER_NAMES[qq.tier - 1]}</span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 18.5, fontWeight: 800, color: INK, lineHeight: 1.4, marginBottom: 13 }}>{qq.q}</div>
      <div className={`sp-grid${hovStale ? ' nohov' : ''}`}>
        {[0, 1, 2, 3].map((k) => choiceBtn(qq, k, dead))}
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
      <DailyChrome slug="sport" name="Sport" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. An arcade run ends the moment you are wrong, so how far you got IS the score.
          A run that banked anything is a partial and the cap goes amber. */}
      {LOFT && (
        <Cap gameKey="sport" quizId={PUZZLE.quizId}
          name="Sport"
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
      <div className="sp-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.sp-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .sp-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sp-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
          @media(max-width:560px){.sp-grid{grid-template-columns:1fr;}}
          .sp-choice{font-family:${SANS};font-weight:700;font-size:14.5px;text-align:left;border:2px solid;border-radius:9px;padding:12px 13px;line-height:1.35;transition:background .12s ease,border-color .12s ease;}
          .sp-grid:not(.nohov) .sp-choice:not(:disabled):hover{background:var(--stg-surf2, ${COLORS.paper});}
          .sp-timebar{height:7px;border-radius:4px;background:var(--stg-surf, ${COLORS.paper});overflow:hidden;}
          .sp-timefill{height:100%;border-radius:4px;transition:width .1s linear;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="sport" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'SPORT'.split('').map((ch, i) => (
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
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Sport is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Twenty-five questions about sport, easy to expert, {Q_SECONDS} seconds each, and one life. Answer until you miss; every question you clear is a point. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sp-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
              <Trophy size={13} style={{ color: ACC_INK }} />
              <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{depth}</b>
              <span>straight</span>
            </span>
            {scoreRow('time', elapsed)}
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>round <b style={{ color: ACC_INK, fontWeight: 500 }}>{tierNum + 1}/5</b> · {TIER_NAMES[tierNum]}</span>
          </div>
          )}

          {playing && question && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                <div className="sp-timebar" style={{ flex: 1 }}>
                  <div className="sp-timefill" style={{ width: `${Math.round(remainFrac * 100)}%`, background: remainFrac > 0.4 ? COLORS.green : remainFrac > 0.18 ? '#b45309' : `var(--stg-acc, ${COLORS.accent})` }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: remainFrac > 0.18 ? `var(--stg-mute, ${COLORS.faded})` : `var(--stg-acc-ink, ${COLORS.accent})`, fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>{Math.ceil(remainMs / 1000)}s</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, opacity: 0.75, marginBottom: 6 }}>Question {g.i + 1} of {TOTAL_Q}</div>
              {qCard(question, false)}
            </div>
          )}

          {g.status === 'lost' && deadQuestion && (
            <div>
              <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 800, color: ACC_INK, marginBottom: 10 }}>
                {g.timedOut ? 'Time ran out.' : 'Wrong answer.'} The run ends at {depth}.
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, opacity: 0.75, marginBottom: 6 }}>Question {g.i + 1} of {TOTAL_Q} — the one that got you</div>
              {qCard(deadQuestion, true)}
            </div>
          )}

          {won && (
            <div style={{ textAlign: 'center', padding: '18px 6px 10px' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: COLORS.green, marginBottom: 6 }}>25 for 25.</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: FADED }}>You ran the table in {elapsed}. Every lane, all the way down.</div>
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>One wrong answer ends it. Everything you clear is banked.</span>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>A perfect run: <span style={{ color: ACC_INK }}>25 straight</span>.</> : <>You cleared <span style={{ color: ACC_INK }}>{depth} of {TOTAL_Q}</span>.</>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {won
                  ? 'Nobody can beat that score. They can only tie it faster.'
                  : depth >= 20 ? 'Into overtime. That is a serious run.'
                  : depth >= 15 ? 'You reached crunch time and kept going.'
                  : depth >= 10 ? 'Through the easy rounds and into the real stuff.'
                  : depth >= 5 ? 'The warm-up is behind you. It gets unfamiliar fast.'
                  : 'The first round claims its share. Tomorrow is a new run.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Sport in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new twenty-five drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/sport?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>run yesterday&rsquo;s questions &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/sport" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Sport &rarr;</a>
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
              name="Sport"
              catRank={catRank}
              outcome={won ? 'won' : (depth > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${`${depth}/${TOTAL_Q}`} straight \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Sport all time` : 'all-time rank' }
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
                  href: `/sport?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Sport', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/sport?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="sport" name="Sport" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="sport" name="Sport" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="sport" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="sport" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Sport to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s twenty-five, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s twenty-five, every day.</p>
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
        <DailyEndCard modal self="sport" won={won}
          headline={won ? <>You ran the table.</> : depth >= 15 ? <>A serious run.</> : <>The board got you.</>}
          subline={won
            ? <>25/25 &middot; a perfect run &middot; {elapsed}</>
            : <>{depth}/{TOTAL_Q} &middot; {g.timedOut ? 'the clock got you' : 'one wrong answer'} &middot; {elapsed}</>}
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
            <button className="sp-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Sport</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Sport is a free daily sports quiz from Mind Loft. Twenty-five multiple-choice questions climb from ones anyone can answer to ones almost nobody can, and a single wrong answer ends the run. Your score is simply how many you cleared in a row, which makes every question a small act of nerve: the further you get, the more you have to lose.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Everyone plays the same twenty-five questions in the same order each day, so the daily leaderboard is a straight fight: longest run wins, and ties break by time. Twenty seconds a question keeps it honest. Every round cycles the same five lanes, the NFL, the NBA, MLB, soccer, and everything else from the Olympics to golf, so a run rewards a fan of sport rather than a fan of one team. Every answer is a settled fact, never a record somebody could break next week.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new twenty-five drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/streak" style={{ color: INK, fontWeight: 800 }}>Streak</a>, our forty-question trivia gauntlet, <a href="/atlas" style={{ color: INK, fontWeight: 800 }}>Atlas</a>, the same run on geography, and <a href="/deep" style={{ color: INK, fontWeight: 800 }}>Deep</a>, one subject fifteen questions down.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
