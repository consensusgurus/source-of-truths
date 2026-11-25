'use client';

// Hired, the daily job interview (owner, 2026-11-25).
//
// ONE JOB A DAY, the same for everyone ("one job a day"; "they can be very
// niche, like Excel tutor. Or a Chef."). Twenty multiple-choice questions in
// that job's field, five interview rounds of four: Phone Screen, Technical,
// Case Study, Panel, Final Round, each a tier harder than the last. Twenty
// seconds a question. A wrong answer, or the clock at zero, ENDS THAT ROUND,
// not the interview: the rest of the round is skipped and the next round starts.
// The score is the total right, ties broken by time on the clock (only time
// spent on questions counts; the hand-off between rounds is paused).
//
// It plays on the gauntlet stage (owner: "same style of MC play as the existing
// gauntlets"), with the Spotlight on a miss and a hand-off card between rounds,
// each round on its own pastel. The ending is an OFFER LETTER for the day's job
// (app/hired/HiredOffer.jsx, rules in app/hired/offer.js), then the usual finish.
//
// Every fact in the bank is settled. No rates, limits or figures that move from
// year to year; US practice where it matters. No Sunday Edition.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import GauntletStage from '../GauntletStage';
import { rampFor } from '@/lib/circuits';
import { useHoverStale } from '@/lib/hover-armed';
import { useSearchParams } from 'next/navigation';
import { Smartphone, Trophy } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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
import HelpSheet from '../HelpSheet';
import HiredOffer from './HiredOffer';
import { GauntletBetween } from '../GauntletScreens';
import { JOBS, ROUND_NAMES, ROUNDS, PER_ROUND, TOTAL_Q, offerFor, fmtMoney } from './offer';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  faded: T.muted, accent: '#1e5f74', accentSoft: '#e4f0f3', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HELP_KEY = 'sot_hired_help_seen';
const STATS_KEY = 'sot_hired_stats';
const Q_SECONDS = 20;
// Each round on its own step of the gauntlet ladder: sky, lime, orange, violet, gold.
const ROUND_RAMP = [0, 2, 4, 7, 3];
export const roundGround = (r) => rampFor(ROUND_RAMP[r] ?? r);
// The rounds as a run's sections, for the run's own Up next screen.
const SECTIONS = ROUND_NAMES.map((name, r) => ({ key: `r${r + 1}`, name, slot: ROUND_RAMP[r] }));
// The miss hand-off counts down like a run's (RunClient VERDICT_MS), shorter here.
const VERDICT_MS = 12000;

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
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
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

// i: the question being faced (0..19). res[k]: 1 right, 0 missed, -1 skipped
// (a miss ends its round). card: the hand-off before round floor(i/4) is up.
// ms: time spent on questions only.
const freshState = () => ({ v: 1, i: 0, res: [], status: 'playing', t0: null, tEnd: null, ms: 0, card: false });
const rightOf = (res) => (res || []).filter((x) => x === 1).length;

// The record under the board: one row per round, four pips.
export function RoundPips({ res, ink = 'currentColor', size = 13, gap = 6, labels = true, active = -1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {ROUND_NAMES.map((nm, r) => (
        <div key={nm} style={{ display: 'flex', alignItems: 'center', gap, opacity: active >= 0 && r > active ? 0.45 : 1 }}>
          {labels && <span style={{ width: 98, fontSize: 12, fontWeight: 700 }}>{nm}</span>}
          {[0, 1, 2, 3].map((k) => {
            const v = (res || [])[r * PER_ROUND + k];
            return <span key={k} aria-hidden="true" style={{ width: size, height: size, borderRadius: 3, boxSizing: 'border-box', border: `1px solid ${ink}`, background: v === 1 ? ink : v === 0 ? `color-mix(in srgb, ${ink} 30%, transparent)` : 'transparent' }} />;
          })}
        </div>
      ))}
    </div>
  );
}

export default function HiredClient({ puzzles = [], questionsByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const QUESTIONS = questionsByNum[PUZZLE.num] || [];
  const STORE_KEY = `sot_hired_${PUZZLE.num}`;
  const JOB = JOBS[PUZZLE.job] || JOBS.accountant;

  const [g, setG] = useState(() => freshState());
  const hovStale = useHoverStale(g.i);
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [qStart, setQStart] = useState(null);
  const [lock, setLock] = useState(false);
  const [lastRight, setLastRight] = useState(null);
  // THE MISS HOLD: the missed question stays up on the stage (the Spotlight,
  // then the run's hand-off into the next round). The game state has already
  // moved on (saved and posted), so a reload cannot replay the question.
  const [hold, setHold] = useState(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [player, setPlayer] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const viewedRef = useRef(false);
  const qStartRef = useRef(null);
  const lockRef = useRef(false);

  const playing = g.status === 'playing' || !!hold;
  const preStart = g.status === 'playing' && !g.t0;
  const started = !!g.t0;
  const onCard = g.status === 'playing' && started && g.card && !hold;
  const asking = g.status === 'playing' && started && !g.card && !hold;
  const focusMode = playing && !showChrome;
  const right = rightOf(g.res);
  const won = g.status === 'won';
  const round = Math.min(ROUNDS - 1, Math.floor(g.i / PER_ROUND));
  const LOFT = isLoft('hired');
  const STAGE = isStage('hired', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_ACC = { '--stg-acc-dk': gameColor('hired'), '--stg-acc-lt': gameColorLight('hired'), '--stg-onramp-lt': gameOnrampLight('hired'), '--stg-acc-ink-lt': gameAccentInkLight('hired') };
  const Cap = STAGE ? StageChrome : LoftCap;
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const STAGE_C = STAGE ? 'var(--stg-acc)' : COLORS.accent;
  const question = asking && g.i < TOTAL_Q ? QUESTIONS[g.i] : null;
  const offer = useMemo(() => offerFor(PUZZLE.job, g.res, g.ms), [PUZZLE.job, g.res, g.ms]);

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
        if (saved && saved.v === 1 && typeof saved.i === 'number' && Array.isArray(saved.res)) {
          const next = { ...freshState(), ...saved };
          gRef.current = next;
          setG(next);
          if (next.status === 'playing' && next.t0 && !next.card) setQStart(Date.now());
        }
      }
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
        if (done || g.t0) localStorage.setItem('sot_hired_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_hired_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
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
      .then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The question clock. Deadline math off Date.now, so backgrounding the tab
  // never pauses it.
  useEffect(() => {
    if (!asking) return undefined;
    const iv = setInterval(() => {
      setNow(Date.now());
      const qs = qStartRef.current;
      if (qs && !lockRef.current && Date.now() - qs >= Q_SECONDS * 1000) miss(null);
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asking, g.i]);

  const liveMs = g.ms + (asking && qStart ? Math.min(Q_SECONDS * 1000, now - qStart) : 0);
  const elapsed = fmtTime(g.status === 'playing' ? liveMs : g.ms);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'hired', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'hired', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'hired', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'hired', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'hired', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const remainMs = qStart ? Math.max(0, Q_SECONDS * 1000 - (now - qStart)) : Q_SECONDS * 1000;
  const remainFrac = remainMs / (Q_SECONDS * 1000);

  const REC_KEY = `sot_hired_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const r = rightOf(cur.res);
    const el = Math.min(36000, Math.max(1, Math.round((cur.ms || 1000) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: r, total: TOTAL_Q, correct: r, guessesUsed: cur.res.filter((x) => x === 1 || x === 0).length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const score = rightOf(g2.res);
    const el = Math.max(1, Math.round((g2.ms || 1000) / 1000));
    try { setStats(recordStat(PUZZLE.num, { s: score, t: TOTAL_Q, won: score === TOTAL_Q })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: TOTAL_Q, correct: score, guessesUsed: g2.res.filter((x) => x === 1 || x === 0).length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  // Replay: wipe the saved board and play today's twenty again as practice. The
  // first completed attempt is what the board and the stats keep.
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setHold(null); setG(freshState()); gRef.current = freshState();
    setQStart(null); setLock(false); lockRef.current = false; setEndClosed(false); setOfferOpen(false); setRevealed(false);
  }

  function commit(next) { gRef.current = next; setG(next); }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now(), card: false });
    setQStart(Date.now()); setNow(Date.now());
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }
  function startRound() {
    const cur = gRef.current;
    if (!cur.card || cur.status !== 'playing') return;
    commit({ ...cur, card: false });
    setQStart(Date.now()); setNow(Date.now());
  }
  function finish(next) {
    const done = { ...next, status: rightOf(next.res) === TOTAL_Q ? 'won' : 'lost', tEnd: Date.now(), card: false };
    postResult(done);
    commit(done);
    setOfferOpen(true);
    return done;
  }
  const spent = () => Math.min(Q_SECONDS * 1000, Math.max(0, Date.now() - (qStartRef.current || Date.now())));

  function answer(k) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.card || lockRef.current || hold) return;
    const qq = QUESTIONS[cur.i];
    if (!qq) return;
    if (k !== qq.correct) { miss(k); return; }
    vibrate(HAPT.ok);
    const res = cur.res.slice(); res[cur.i] = 1;
    const next = { ...cur, res, ms: cur.ms + spent() };
    const endOfRound = (cur.i + 1) % PER_ROUND === 0;
    setLock(true); lockRef.current = true; setLastRight(qq.correct);
    commit(next);
    setTimeout(() => {
      setLock(false); lockRef.current = false; setLastRight(null);
      const c2 = gRef.current;
      if (c2.status !== 'playing') return;
      if (c2.i + 1 >= TOTAL_Q) { vibrate(HAPT.win); finish(c2); return; }
      commit({ ...c2, i: c2.i + 1, card: endOfRound });
      if (!endOfRound) { setQStart(Date.now()); setNow(Date.now()); }
    }, 450);
  }

  // A wrong pick (k) or the clock at zero (k null): the round is over. The rest
  // of it is skipped and the state jumps to the next round's hand-off at once;
  // the Spotlight holds the missed question on screen meanwhile.
  function miss(k) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.card || hold) return;
    const qq = QUESTIONS[cur.i];
    vibrate(HAPT.wrong);
    const r = Math.floor(cur.i / PER_ROUND);
    const res = cur.res.slice(); res[cur.i] = 0;
    for (let j = cur.i + 1; j < (r + 1) * PER_ROUND; j++) res[j] = -1;
    const nextI = (r + 1) * PER_ROUND;
    const base = { ...cur, res, ms: cur.ms + spent() };
    setHold({ q: qq, i: cur.i, r, pick: k });
    if (nextI >= TOTAL_Q) {
      const done = { ...base, status: rightOf(res) === TOTAL_Q ? 'won' : 'lost', tEnd: Date.now(), card: false };
      postResult(done);
      commit(done);
    } else {
      commit({ ...base, i: nextI, card: true });
    }
    // The Spotlight, then the run's own hand-off: the lit answer grows into
    // the next round's start button (GauntletStage `recap`), or on the last
    // round into the answer itself, and moves on by itself or on a tap.
  }
  // The hand-off from a miss is done: into the next round, or to the offer.
  function endHold() {
    setHold(null);
    if (gRef.current.status !== 'playing') { setOfferOpen(true); return; }
    startRound();
  }

  function shareUrl() { return withRef(`mindloftdaily.com/hired${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const rows = ROUND_NAMES.map((_, r) => [0, 1, 2, 3].map((k) => { const v = g.res[r * PER_ROUND + k]; return v === 1 ? '\u{1F7E9}' : v === 0 ? '\u{1F7E7}' : '⬜'; }).join('')).join('\n');
    const head = offer.rejected
      ? `Hired #${PUZZLE.num} · ${JOB.name} · no offer this time · ${elapsed}`
      : `Hired #${PUZZLE.num} · offered ${offer.title}, ${fmtMoney(offer.salary)} · ${right}/${TOTAL_Q} · ${elapsed}`;
    return `${head}\n${rows}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Hired #${PUZZLE.num}: today's job interview on Mind Loft is for ${JOB.name}. Five rounds, twenty questions. Can you get the offer?\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={`Today's interview is for ${JOB.name}. Five rounds, twenty questions.`}
      steps={[
        <>Every day is an interview for <b>one job</b>, the same for everyone. All twenty questions are about that job.</>,
        <>Five rounds of four, <b>getting harder</b>: Phone Screen, Technical, Case Study, Panel, and the Final Round.</>,
        <>A wrong answer, or a clock at zero, <b>ends that round</b>, not the interview. The rest of the round is skipped and the next round begins.</>,
        <>You get <b>{Q_SECONDS} seconds a question</b>. The clock pauses between rounds.</>,
      ]}
      knack="Every right answer is a point, so the Final Round still counts even after a rough Technical. The offer letter's level comes from your total; its salary from your total and your speed."
      footer="Ties on the daily board break by time. Twenty for twenty, quickly, gets the corner office."
    />
  );

  const choiceBtn = (qq, k) => {
    const flash = lock && lastRight === k;
    return (
      <button key={k} className="hr-choice" disabled={lock} onClick={() => answer(k)}
        style={{ background: flash ? '#e7f3ec' : T.white, borderColor: flash ? COLORS.green : 'rgba(28,30,36,0.4)', color: flash ? COLORS.green : COLORS.ink }}>
        <span style={{ fontSize: 11, opacity: 0.65, marginRight: 9 }}>{String.fromCharCode(65 + k)}</span>{qq.choices[k]}
      </button>
    );
  };

  const stageHold = hold && hold.q;
  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* THE GAUNTLET STAGE: the question and its answers full screen, on this round's pastel. */}
      {(question || stageHold) ? (
        <GauntletStage
          bg={roundGround(stageHold ? hold.r : round)}
          qKey={stageHold ? `h${hold.i}` : g.i}
          label={`Round ${(stageHold ? hold.r : round) + 1} · ${ROUND_NAMES[stageHold ? hold.r : round]} · ${JOB.name}`}
          question={<h2>{(stageHold ? hold.q : question).q}</h2>}
          choices={(stageHold ? hold.q : question).choices}
          onPick={answer}
          lockIdx={lock && lastRight != null ? lastRight : null}
          missRight={stageHold ? hold.q.correct : null}
          missPick={stageHold ? hold.pick : null}
          disabled={lock || !!stageHold}
          recap={stageHold ? (hold.r + 1 >= ROUNDS
            ? { final: true, eyebrow: 'The answer', autoMs: 5000, onGo: endHold }
            : { eyebrow: `Up next · Round ${hold.r + 2} of ${ROUNDS}`, goName: ROUND_NAMES[hold.r + 1], goLabel: `Start round ${hold.r + 2}`,
                sub: `${JOB.name} · four questions`, nextBg: roundGround(hold.r + 1), autoMs: VERDICT_MS, onGo: endHold }) : null}
          frac={stageHold ? 0 : remainFrac}
          hot={!stageHold && remainFrac < 0.25}
          footer={stageHold
            ? <>Round over &middot; {(g.res || []).slice(hold.r * PER_ROUND, hold.r * PER_ROUND + PER_ROUND).filter((x) => x === 1).length} of {PER_ROUND} right</>
            : <>{Math.ceil(remainMs / 1000)}s &middot; Question {(g.i % PER_ROUND) + 1} of {PER_ROUND} &middot; Round {round + 1} of {ROUNDS}</>}
        />
      ) : null}
      {/* THE HAND-OFF between rounds: the next round, the job, the record so far. */}
      {STAGE && onCard && (
        <GauntletBetween circuitName={`Hired · ${JOB.name}`} sections={SECTIONS}
          results={SECTIONS.slice(0, round).map((x) => ({ key: x.key }))} doneCount={round}
          lastSec={SECTIONS[round - 1]} last={{ score: g.res.slice((round - 1) * PER_ROUND, round * PER_ROUND).filter((x) => x === 1).length }}
          lastMiss={{ cleared: true }} upNext={SECTIONS[round]} upIdx={round} stepWord="Round"
          nextLine={`${JOB.name} · four questions`} goLabel={`Start round ${round + 1}`}
          auto={false} onGo={startRound} />
      )}
      {/* THE OFFER LETTER, once, at the end of the interview (and on demand from the finish). */}
      {!playing && offerOpen && (
        <HiredOffer offer={offer} job={JOB} res={g.res} ms={g.ms} dateLabel={PUZZLE.dateLabel}
          name={(player && player.name) || (identity && identity.username) || null}
          onClose={() => setOfferOpen(false)} onShare={copyShare} copied={copied} />
      )}
      {!STAGE && (<DailyChrome slug="hired" name="Hired" collapsed={started} loft={LOFT} />)}
      {LOFT && (
        <Cap gameKey="hired" quizId={PUZZLE.quizId}
          name="Hired" cat="Trivia"
          outcome={playing ? null : (won ? 'won' : (right > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${right}/${TOTAL_Q}`, k: 'right' },
            { v: elapsed, k: 'time' },
            { v: `${round + 1}/${ROUNDS}`, k: `round · ${ROUND_NAMES[round]}` },
          ] : [
            { v: `${right}/${TOTAL_Q}`, k: 'right' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="hr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.hr-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .hr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:1px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .hr-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
          @media(max-width:560px){.hr-grid{grid-template-columns:1fr;}}
          .hr-choice{font-family:${SANS};font-weight:700;font-size:14.5px;text-align:left;border:1px solid;border-radius:9px;padding:12px 13px;line-height:1.35;cursor:pointer;}
        ` }} />
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          {!LOFT && (
            <DailyMasthead slug="hired" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
              blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
              blocks={'HIRED'.split('').map((ch, i) => (
                <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 20, background: i === 0 ? COLORS.accent : COLORS.ink, color: T.white }}>{ch}</div>
              ))}
            />
          )}

          <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
            {preStart && (
              <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
                {gateRules ? (<><div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>How to play</div>{rulesBody}</>) : (
                  <div style={{ color: INK }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Today&rsquo;s opening</div>
                    <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, margin: '4px 0 14px' }}>{JOB.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {ROUND_NAMES.map((nm, r) => (
                        <div key={nm} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: r < ROUNDS - 1 ? `1px solid ${SURF_B}` : 'none', paddingBottom: 7, fontSize: 14.5 }}>
                          <span style={{ fontWeight: 800 }}>{r + 1}&nbsp; {nm}</span>
                          <span style={{ fontWeight: 600, color: FADED }}>{r < 2 ? 'Gentle' : r === 2 ? 'Moderate' : 'Tough'}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, fontWeight: 600 }}>Four questions a round, {Q_SECONDS} seconds each. A wrong answer ends that round, not the interview. Your offer letter waits at the end.</p>
                  </div>
                )}
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <button className="hr-btn" onClick={startGame} style={{ borderColor: STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start interview</button>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>{gateRules ? 'Back' : 'How to play'}</button>
                </div>
              </div>
            )}

            {!preStart && (
              <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 16px 16px', marginBottom: 12, color: INK }}>
                {!LOFT && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: `1px solid ${SURF_B}`, paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Trophy size={13} /> <b style={{ color: INK }}>{right}</b> right</span>
                    <span>time <b style={{ color: INK }}>{elapsed}</b></span>
                    <span style={{ marginLeft: 'auto' }}>{JOB.name}</span>
                  </div>
                )}
                {!STAGE && question && (
                  <div>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, marginBottom: 6 }}>Round {round + 1} · {ROUND_NAMES[round]} · {Math.ceil(remainMs / 1000)}s</div>
                    <div style={{ fontSize: 18.5, fontWeight: 800, lineHeight: 1.4, marginBottom: 13 }}>{question.q}</div>
                    <div className={`hr-grid${hovStale ? ' nohov' : ''}`}>{[0, 1, 2, 3].map((k) => choiceBtn(question, k))}</div>
                  </div>
                )}
                {!STAGE && onCard && (
                  <button className="hr-btn" onClick={startRound}>Start round {round + 1}: {ROUND_NAMES[round]}</button>
                )}
                {(!playing || STAGE) && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                    <RoundPips res={g.res} ink={STAGE ? 'var(--stg-ink, #08222e)' : COLORS.ink} active={playing ? round : -1} />
                  </div>
                )}
                {!playing && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{offer.rejected ? 'No offer this time.' : <>Offered: {offer.title}, {fmtMoney(offer.salary)}</>}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: FADED, marginTop: 4 }}>{right} of {TOTAL_Q} right &middot; {elapsed}</div>
                    <button className="hr-btn" style={{ marginTop: 12 }} onClick={() => setOfferOpen(true)}>Read your offer letter</button>
                  </div>
                )}
              </div>
            )}

            {LOFT && !playing && !offerOpen && (
              <LoftFinish
                name="Hired"
                catRank={catRank}
                outcome={won ? 'won' : (right > 0 ? 'part' : 'lost')}
                title={offer.rejected ? 'No offer!' : `${offer.title}!`}
                detail={`${right}/${TOTAL_Q} right · ${elapsed}`}
                iq={iq}
                board={dailyBoard}
                gameRank={allTime && allTime.ready
                  ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                      label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Hired all time` : 'all-time rank' }
                  : null}
                day={dayStats}
                streak={isTodays ? myStats.cur : null}
                missLabel="Asked"
                archive={puzzles
                  .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                  .sort((x, y) => y.num - x.num)
                  .map((p) => ({ num: p.num, dateLabel: p.dateLabel, sunday: false, href: `/hired?p=${p.num}`, done: !!(stats && stats.rec && stats.rec[p.num]), score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null }))}
                options={[
                  { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your offer, no spoilers', kind: 'gold', onClick: copyShare },
                  { tone: 'board', label: 'Your offer letter', sub: `${offer.title}, ${JOB.name} interview`, onClick: () => setOfferOpen(true) },
                  prevPuzzle && { tone: 'another', label: 'Play another Hired', sub: `No. ${prevPuzzle.num}, ${(JOBS[prevPuzzle.job] || JOB).name}`, href: `/hired?p=${prevPuzzle.num}` },
                  nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                  { tone: 'replay', label: 'Replay', sub: 'This interview again, unscored', onClick: resetGame },
                  { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
                ]}
              />
            )}
          </div>
        </div>

        {!STAGE && <GamePanel self="hired" name="Hired" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 660 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="hired" name="Hired" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
            <DailyGamesGrid replay={!playing ? resetGame : null} self="hired" maxWidth={620}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
              boardSlot={<DailyBoardPanel self="hired" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Hired to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>, and the tile opens each day&apos;s interview.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens each day&apos;s interview.</p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 660 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
      </div>

      {!playing && !endClosed && !LOFT && !offerOpen && (
        <DailyEndCard modal self="hired" won={won}
          headline={offer.rejected ? <>No offer this time.</> : <>Offered: {offer.title}.</>}
          subline={<>{right}/{TOTAL_Q} right &middot; {fmtMoney(offer.salary)} &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)} />
      )}

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="hired" name="Hired">
          {rulesBody}
        </HelpSheet>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Hired</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Hired is a free daily job interview quiz from Mind Loft. Every day is an interview for one job, the same for everyone: an accountant one day, a chef, an Excel tutor, a pilot or a software developer the next. Twenty multiple-choice questions on that job come in five rounds of four, from an easy Phone Screen to a tough Final Round.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A wrong answer ends that round, not the interview, so every round is a fresh chance. Twenty seconds a question keeps it honest. Your score is the number you got right, ties broken by time, and the interview ends with an offer letter: the job title rises with your score, and the salary with your score and your speed. Every answer is a settled fact about the work, never a figure that changes next year.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new interview opens every day at midnight Eastern. No app, no signup. Every past question waits in the <a href="/career-questions" style={{ color: INK, fontWeight: 800 }}>Careers Database</a>, by job. More dailies: <a href="/biz" style={{ color: INK, fontWeight: 800 }}>Biz</a>, a business trivia gauntlet, <a href="/tape" style={{ color: INK, fontWeight: 800 }}>Tape</a>, name the company from its stock chart, and <a href="/resume" style={{ color: INK, fontWeight: 800 }}>Resume</a>, guess who from the profile.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
