'use client';

// Bracket — the daily bracket of facts.
//
// Sixteen real things, one comparison question for the whole day, and every
// pick propagates. There is NO feedback while you play: you fill the whole
// bracket blind, exactly like a pool sheet, and one wrong call in the first
// round poisons every line it touches. All fifteen truths land at once.
//
// The client never receives the answers. Every item ships with its real value,
// and the browser recomputes each matchup, the same way
// scripts/verify-bracket.mjs proves the bank.
//
// Scoring is a pool: 1 a pick in the first round, 2 in the quarters, 4 in the
// semis, 8 for the final, so every round is worth the same 8 and the maximum is
// 32. A later pick only scores if the thing you advanced is the true winner of
// that slot. Sundays run 32 items over five rounds for 80.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Trophy, Eraser } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
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
import DailyRules from '../DailyRules';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted,
  accent: '#c2410c', accentSoft: '#ffedd5', accentDeep: '#9a3412', green: T.successDeep, greenSoft: '#dcfce7',
  redSoft: '#fee2e2', redInk: '#b91c1c', gold: '#b45309',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_bracket_help_seen';
const STATS_KEY = 'sot_bracket_stats';

const ROUND_NAME = (r, rounds) => {
  const left = rounds - r;
  if (left === 1) return 'Final';
  if (left === 2) return 'Semis';
  if (left === 3) return 'Quarters';
  if (left === 4) return 'Round of 16';
  return 'Round of 32';
};
function fmtValue(v, unit) {
  if (unit === 'km2') return v.toLocaleString('en-US') + ' km²';
  if (unit === 'm') return v.toLocaleString('en-US') + ' m';
  if (unit === 'usdm') return v >= 1000 ? '$' + (v / 1000).toFixed(2) + 'B' : '$' + v + 'M';
  if (unit === 'lat') return Math.abs(v).toFixed(1) + '° ' + (v >= 0 ? 'N' : 'S');
  if (unit === 'km') return v.toLocaleString('en-US') + ' km';
  if (unit === 'people') return v.toLocaleString('en-US');
  if (unit === 'seats') return v.toLocaleString('en-US') + ' seats';
  if (unit === 'hr') return v.toLocaleString('en-US') + ' HR';
  if (unit === 'k') return v.toLocaleString('en-US') + ' K';
  if (unit === 'yards') return v.toLocaleString('en-US') + ' yds';
  if (unit === 'golds') return v.toLocaleString('en-US') + ' golds';
  return String(v);
}

const isIosDevice = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
function etToday() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return new Date().toISOString().slice(0,10); } }
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length-1] : puzzles[0];
}
function fmtTime(ms) { const s = Math.max(0, Math.round(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
function msToMidnightET() {
  try { const now = new Date(); const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })); const next = new Date(et); next.setHours(24,0,0,0); return next - et; }
  catch (e) { const now = new Date(); const next = new Date(now); next.setHours(24,0,0,0); return next - now; }
}
function fmtCountdown(ms) { const s = Math.max(0, Math.floor(ms/1000)); return `${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try { let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('sot_quiz_anon', a); }
    return a; } catch (e) { return null; }
}
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };
function getStats() { try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {} return { v: 1, rec: {} }; }
function recordStat(num, entry) { const s = getStats(); if (s.rec[num]) return s; const s2 = { ...s, rec: { ...s.rec, [num]: entry } }; try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {} return s2; }
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a,b) => a-b);
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev+1 ? run+1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum-1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max };
}
function mergeServerStats(s, recent, puzzles, total) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {}; for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.round(((m.scorePct || 0)/100) * total));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: total, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function freshState(m) { return { v: 1, picks: Array(m).fill(-1), status: 'playing', t0: null, tEnd: null }; }

export default function BracketClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.items.length;
  const ROUNDS = Math.log2(N);
  const MATCHES = N - 1;
  const TOTAL = (N / 2) * ROUNDS;                    // 32 on a weekday, 80 on Sunday
  const STORE_KEY = `sot_bracket_${PUZZLE.num}`;

  // matchup ids are laid out round by round: round 0 first, then round 1, ...
  const OFFSET = useMemo(() => { const o = []; let acc = 0, w = N / 2; for (let r = 0; r < ROUNDS; r++) { o.push(acc); acc += w; w /= 2; } return o; }, [N, ROUNDS]);
  const idOf = (r, m) => OFFSET[r] + m;

  const [g, setG] = useState(() => freshState(MATCHES));
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
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
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const [showChrome, setShowChrome] = useState(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('bracket');
  const STAGE = isStage('bracket', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('bracket');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('bracket'), '--stg-acc-lt': gameColorLight('bracket'), '--stg-onramp-lt': gameOnrampLight('bracket'), '--stg-acc-ink-lt': gameAccentInkLight('bracket') };
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
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;

  // the truth, recomputed rather than shipped
  const TRUE = useMemo(() => {
    const better = (a, b) => (PUZZLE.dir === 'max' ? PUZZLE.items[a].value > PUZZLE.items[b].value : PUZZLE.items[a].value < PUZZLE.items[b].value) ? a : b;
    const out = Array(MATCHES).fill(-1);
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      for (let m = 0; m < w; m++) {
        const kids = r === 0 ? [2 * m, 2 * m + 1] : [out[idOf(r - 1, 2 * m)], out[idOf(r - 1, 2 * m + 1)]];
        out[idOf(r, m)] = better(kids[0], kids[1]);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PUZZLE, N, ROUNDS, MATCHES]);

  // what the player's sheet says is in each slot
  const kidsOf = (r, m) => (r === 0 ? [2 * m, 2 * m + 1] : [g.picks[idOf(r - 1, 2 * m)], g.picks[idOf(r - 1, 2 * m + 1)]]);
  const filled = g.picks.filter((p) => p >= 0).length;
  const complete = filled === MATCHES;
  const score = useMemo(() => {
    let s = 0;
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      for (let m = 0; m < w; m++) if (g.picks[idOf(r, m)] >= 0 && g.picks[idOf(r, m)] === TRUE[idOf(r, m)]) s += Math.pow(2, r);
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.picks, TRUE, N, ROUNDS]);
  const perRound = useMemo(() => {
    const out = [];
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      let hit = 0;
      for (let m = 0; m < w; m++) if (g.picks[idOf(r, m)] === TRUE[idOf(r, m)]) hit++;
      out.push([hit, w]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.picks, TRUE, N, ROUNDS]);
  const won = g.status === 'done' && score === TOTAL;

  useEffect(() => {
    try { setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true); setMobileUi(isMobileDevice()); } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip); window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const saved = JSON.parse(raw); if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length === MATCHES) setG({ ...freshState(MATCHES), ...saved }); }
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
        (function () { var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_bracket_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_bracket_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. `elapsed` below is derived from the current time, and it
  // used to read Date.now() during render, so the displayed clock only advanced
  // when something else happened to re-render the board. This ticks a state
  // value while the game is actually running, so the readout moves on its own.
  // Display only: the elapsed time recorded on the result is still computed
  // from a real Date.now() delta at the moment the game ends.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  useEffect(() => {
    if (g.status === 'playing') return;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [g.status]);

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    try {
      const anon = getAnonId(); let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`).then((r) => r.json()).then((d) => {
          if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles, TOTAL));
          if (d && d.found && d.name) setPlayer({ name: d.name, rank: (d.ranks && d.ranks.xp) || d.rank || null, key: d.userKey || null });
        }).catch(() => {});
      }
    } catch (e) {}
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    if (!viewedRef.current) { viewedRef.current = true; fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function say(msg) { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'bracket', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'bracket', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'bracket', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'bracket', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'bracket', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_bracket_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (filled === 0 || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now()))/1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0)/1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: null, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  function startRun() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }

  // picking a winner clears everything that used to flow out of this slot
  function pick(r, m, item) {
    if (!playing || item < 0) return;
    setG((cur) => {
      const picks = cur.picks.slice();
      picks[idOf(r, m)] = item;
      let rr = r + 1, mm = Math.floor(m / 2);
      while (rr < ROUNDS) {
        const id = idOf(rr, mm);
        const kidsNow = [picks[idOf(rr - 1, 2 * mm)], picks[idOf(rr - 1, 2 * mm + 1)]];
        if (picks[id] >= 0 && !kidsNow.includes(picks[id])) picks[id] = -1;
        rr++; mm = Math.floor(mm / 2);
      }
      return { ...cur, picks, t0: cur.t0 || Date.now() };
    });
  }
  function clearAll() { if (!playing) return; setG((cur) => ({ ...cur, picks: Array(MATCHES).fill(-1) })); }
  function submit() {
    if (!playing || !complete) return;
    const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
    setG(g2); setEndClosed(false);
    let s = 0;
    for (let r = 0; r < ROUNDS; r++) { const w = N / Math.pow(2, r + 1); for (let m = 0; m < w; m++) if (g2.picks[idOf(r, m)] === TRUE[idOf(r, m)]) s += Math.pow(2, r); }
    postResult(g2, s);
  }
  function resetGame() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} setG(freshState(MATCHES)); setEndClosed(false); }

  const champion = PUZZLE.items[TRUE[MATCHES - 1]];
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead={`Fill the bracket. One question, ${N} contenders.`}
      banner={PUZZLE.metric}
      sub={PUZZLE.asOf ? (
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: FADED, fontWeight: 500 }}>
          Figures as of {PUZZLE.asOf}
        </span>
      ) : null}
      steps={[
        <>Every matchup asks the same question. Tap the one you think wins.</>,
        <>Your winners <b>carry forward</b>, so later rounds are made of your own picks.</>,
        <>You get <b>no feedback</b> until the end. Fill all {MATCHES} and hand it in.</>,
        <>Everything reveals at once, with the real numbers under every name.</>,
      ]}
      knack="the first round is deliberately lopsided and the final is close on purpose. Getting round one right is not the puzzle. The puzzle is that a single bad call in round one takes every later pick down with it, exactly like a busted Final Four."
      footer={`Pool scoring: 1 a pick in the first round, 2 in the quarters, 4 in the semis, 8 for the final. Every round is worth ${N / 2}, so ${TOTAL} is perfect. A later pick only counts if the thing you advanced really did win that slot.`}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="bracket" name="Bracket" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="bracket" quizId={PUZZLE.quizId}
          name="Bracket"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
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
      <div className="bk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 24px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.bk-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .bk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .bk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .bk-rounds{display:flex;gap:10px;align-items:flex-start;overflow-x:auto;padding-bottom:6px;scrollbar-width:thin;}
          .bk-col{flex:0 0 auto;width:168px;display:flex;flex-direction:column;justify-content:space-around;gap:8px;min-height:100%;}
          .bk-rh{font-family:${MONO};font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:${FADED};margin-bottom:2px;}
          .bk-m{border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:9px;overflow:hidden;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .bk-s{display:block;width:100%;text-align:left;font-family:${SANS};font-size:12.5px;font-weight:700;color:${INK};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:none;border-bottom:1px solid var(--stg-line, rgba(28,30,36,0.08));padding:8px 9px;cursor:pointer;}
          .bk-s:last-child{border-bottom:none;}
          .bk-s:hover:not(:disabled){background:var(--stg-surf2, ${COLORS.accentSoft});}
          .bk-s:disabled{cursor:default;color:var(--muted);}
          .bk-s.on{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};font-weight:800;box-shadow:inset 3px 0 0 var(--stg-acc, ${COLORS.accent});}
          .bk-s.right{background:${COLORS.greenSoft};color:#14532d;box-shadow:inset 3px 0 0 ${COLORS.green};}
          .bk-s.wrong{background:${COLORS.redSoft};color:#7f1d1d;text-decoration:line-through;box-shadow:inset 3px 0 0 ${COLORS.redInk};}
          .bk-v{font-family:${MONO};font-size:10px;font-weight:500;color:${FADED};margin-left:6px;}
        ` }} />

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="bracket"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Field of 32</span>}
          blocks={'BRACKET'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 20, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px 22px', minHeight: 320, display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The field is sealed'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N} contenders, one question, {MATCHES} picks, and no feedback until you hand the sheet in.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="bk-btn" onClick={startRun} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Open the bracket</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>{gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}</button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: ACC_DEEP_INK, background: `color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent)`, border: `1.5px solid var(--stg-line, ${COLORS.accent})`, borderRadius: 8, padding: '7px 12px' }}>{PUZZLE.metric}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
                picked <b style={{ color: INK, fontWeight: 500 }}>{filled}</b> of {MATCHES}
                {!playing && <> &nbsp;&middot;&nbsp; scored <b style={{ color: INK, fontWeight: 500 }}>{score}</b>/{TOTAL}</>}
              </span>
              {PUZZLE.asOf && (
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: FADED }}>figures as of {PUZZLE.asOf}</span>
              )}
            </div>

            <div className="bk-rounds">
              {Array.from({ length: ROUNDS }).map((_, r) => {
                const w = N / Math.pow(2, r + 1);
                return (
                  <div key={r} className="bk-col">
                    <div className="bk-rh">{ROUND_NAME(r, ROUNDS)}</div>
                    {Array.from({ length: w }).map((__, m) => {
                      const kids = kidsOf(r, m);
                      const mine = g.picks[idOf(r, m)];
                      const truth = TRUE[idOf(r, m)];
                      return (
                        <div key={m} className="bk-m">
                          {kids.map((it, k) => {
                            const empty = it == null || it < 0;
                            const chosen = !empty && mine === it;
                            let cls = 'bk-s';
                            if (!playing) {
                              if (chosen && it === truth) cls += ' right';
                              else if (chosen) cls += ' wrong';
                              else if (it === truth) cls += ' on';
                            } else if (chosen) cls += ' on';
                            return (
                              <button key={k} type="button" className={cls} disabled={empty || !playing}
                                onClick={() => pick(r, m, it)}
                                title={empty ? 'Waiting on an earlier pick' : PUZZLE.items[it].name}>
                                {empty ? '—' : PUZZLE.items[it].name}
                                {!playing && !empty && <span className="bk-v">{fmtValue(PUZZLE.items[it].value, PUZZLE.unit)}</span>}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="bk-col" style={{ width: 132 }}>
                <div className="bk-rh">Winner</div>
                <div className="bk-m" style={{ borderColor: COLORS.gold, background: STAGE ? 'var(--stg-surf2)' : '#fffbeb' }}>
                  <div style={{ padding: '10px 9px', fontSize: 13, fontWeight: 800, color: playing ? `var(--stg-mute, ${COLORS.faded})` : COLORS.gold, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trophy size={13} />
                    {playing ? (g.picks[MATCHES - 1] >= 0 ? PUZZLE.items[g.picks[MATCHES - 1]].name : 'your call') : champion.name}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {started && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 6px' }}>
            <button type="button" className="bk-btn" onClick={submit} disabled={!complete} style={complete ? { background: `var(--stg-acc, ${COLORS.accent})`, borderColor: COLORS.accent, color: `var(--stg-onramp, ${T.white})` } : { opacity: 0.45, cursor: 'not-allowed' }}>
              <Trophy size={14} /> Hand in the bracket
            </button>
            {filled > 0 && <button type="button" className="bk-btn" onClick={clearAll}><Eraser size={14} /> Clear</button>}
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <>
              <div style={{ maxWidth: 560, margin: '14px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {won ? <>A perfect bracket. Nothing busted.</> : <>{champion.name} took it at {fmtValue(champion.value, PUZZLE.unit)}.</>}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>
                      {perRound.map(([hit, of], r) => `${ROUND_NAME(r, ROUNDS).replace('Round of ', 'R')} ${hit}/${of}`).join(' · ')} · {elapsed}
                    </span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>{countdown ? <>A new field is seeded in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new field is seeded at midnight Eastern.'}
                    {prevPuzzle && <>{' '}Meanwhile: <a href={`/bracket?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>yesterday&rsquo;s bracket &rarr;</a></>}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026','')} archive. <a href="/bracket" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s bracket &rarr;</a>{' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a></>
                )}
              </p>
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Bracket"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Bracket all time` : 'all-time rank' }
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
                  href: `/bracket?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Bracket', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/bracket?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="bracket" name="Bracket" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="bracket" name="Bracket" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="bracket" maxWidth={640} challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`} share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light boardSlot={<DailyBoardPanel self="bracket" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />} divider />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Bracket to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}><li>Tap <b>Share</b> in Safari.</li><li>Tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser menu and choose <b>Add to Home Screen</b>.</p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 640 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard modal self="bracket" won={won} completed
          headline={won ? <>A perfect bracket</> : <>The field is settled</>}
          subline={<>Bracket #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'} onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60 }}>{toast}</div>
      )}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="bk-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: INK }}>About Bracket</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Bracket is a free daily puzzle from Mind Loft that borrows the most-shared format in America and fills it with facts. Sixteen real things are seeded into a single-elimination draw, every matchup asks the same question, and you fill the whole sheet before you learn anything.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          What makes it bite is propagation. Your winners carry forward, so a first-round call you got wrong quietly ruins every later line it touches, and you will not find out until the reveal. The draw is built so the opening round is lopsided and the true final is a coin flip, which is why the last pick is worth eight times the first.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every value is verified against public records and shown on the reveal, so the end screen teaches rather than just grades. A new field is seeded daily at midnight Eastern, with 32 contenders on Sundays. More dailies: <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>, <a href="/extra" style={{ color: INK, fontWeight: 800 }}>Extra</a>, and <a href="/form" style={{ color: INK, fontWeight: 800 }}>Form</a>.
        </p>
      </section>
      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const rows = perRound.map(([hit, of], r) => `${ROUND_NAME(r, ROUNDS).replace('Round of ', 'R')} ${hit}/${of}`).join(' · ');
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const text = playing
      ? `Bracket #${PUZZLE.num} — the daily bracket of facts from Mind Loft.\n${withRef(`mindloftdaily.com/bracket${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Bracket #${PUZZLE.num} — ${score}/${TOTAL}\n${rows}${streakBit}\n${withRef(`mindloftdaily.com/bracket${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }
}
