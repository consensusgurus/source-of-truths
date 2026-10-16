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
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
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
  // Phone board: which round's tab is open (display only, never saved).
  const [bkRound, setBkRound] = useState(0);

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
  // SEALED WHILE PLAYING (reader report 2026-10-08). Both figures are graded
  // against the true winners, so while the sheet is still open they are not
  // even computed: nothing on the page can then echo whether a pick is right.
  // submit() grades the handed-in sheet itself, so scoring is unchanged.
  const score = useMemo(() => {
    if (g.status === 'playing') return 0;
    let s = 0;
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      for (let m = 0; m < w; m++) if (g.picks[idOf(r, m)] >= 0 && g.picks[idOf(r, m)] === TRUE[idOf(r, m)]) s += Math.pow(2, r);
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.picks, g.status, TRUE, N, ROUNDS]);
  const perRound = useMemo(() => {
    if (g.status === 'playing') return [];
    const out = [];
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      let hit = 0;
      for (let m = 0; m < w; m++) if (g.picks[idOf(r, m)] === TRUE[idOf(r, m)]) hit++;
      out.push([hit, w]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.picks, g.status, TRUE, N, ROUNDS]);
  const won = g.status === 'done' && score === TOTAL;
  // A busted bracket keeps the true winners and the values hidden through the
  // finish beat; they show only once the end card's Reveal answer is pressed.
  const solShown = won || !LOFT || revealed;

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

  // ── the board: a real drawn bracket (desktop) and round tabs (phone) ──────
  // Every state on it reads the player's own picks and nothing else while the
  // sheet is open; the truth is consulted only once it has been handed in.
  const ACC_LINE = `var(--stg-acc-ink, ${COLORS.accent})`;
  const NEUTRAL_LINE = 'var(--stg-cell-line, rgba(28,30,36,0.3))';
  const roundW = (r) => N / Math.pow(2, r + 1);
  const madeIn = (r) => { let k = 0; for (let m = 0; m < roundW(r); m++) if (g.picks[idOf(r, m)] >= 0) k++; return k; };
  const ptsLabel = (r) => { const p = Math.pow(2, r); return `${p} ${p === 1 ? 'pt' : 'pts'} a pick`; };
  const tabName = (r) => (ROUNDS > 4 ? ROUND_NAME(r, ROUNDS).replace('Round of ', 'R') : ROUND_NAME(r, ROUNDS));

  function slotButton(r, m, it, k, style) {
    const empty = it == null || it < 0;
    const mine = g.picks[idOf(r, m)];
    const chosen = !empty && mine === it;
    let cls = 'bk-s';
    if (empty) cls += ' wait';
    else if (!playing) {
      const truth = TRUE[idOf(r, m)];
      if (chosen && it === truth) cls += ' right';
      else if (chosen) cls += ' wrong';
      else if (solShown && it === truth) cls += ' on';
      else cls += ' off';
    } else if (chosen) cls += ' on';
    else if (mine >= 0) cls += ' off';
    const name = empty ? '' : PUZZLE.items[it].name;
    return (
      <button key={`${r}-${m}-${k}`} type="button" className={cls} disabled={empty || !playing} style={style}
        onClick={() => pick(r, m, it)}
        title={empty ? 'Waiting on an earlier pick' : name}
        aria-label={empty ? 'Waiting on an earlier pick' : (playing && chosen ? `${name}, your pick` : name)}>
        <span className="bk-n">{empty ? 'waiting' : name}</span>
        {!playing && solShown && !empty && <span className="bk-v">{fmtValue(PUZZLE.items[it].value, PUZZLE.unit)}</span>}
      </button>
    );
  }

  const championName = (playing || !solShown) ? (g.picks[MATCHES - 1] >= 0 ? PUZZLE.items[g.picks[MATCHES - 1]].name : 'your call') : champion.name;
  const finalPicked = g.picks[MATCHES - 1] >= 0;
  const winBox = (style) => (
    <div className="bk-win" style={{ border: `2px solid ${finalPicked ? ACC_LINE : NEUTRAL_LINE}`, color: (playing && !finalPicked) ? `var(--stg-mute, ${COLORS.faded})` : `var(--stg-ink, ${COLORS.ink})`, ...style }}>
      <Trophy size={16} style={{ flex: '0 0 auto', color: ACC_LINE }} />
      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{championName}</span>
    </div>
  );

  function renderDesktop() {
    const SH = (r) => (r === 0 ? 32 : 40);
    const colW = (r) => (r === 0 ? 184 : r === 1 ? 156 : 142);
    const GAP = 24, Y0 = 46, WIN_W = 150;
    const colX = []; let x = 0;
    for (let r = 0; r < ROUNDS; r++) { colX.push(x); x += colW(r) + GAP; }
    const winX = x, totalW = winX + WIN_W;
    const H = (N / 2) * 80;
    // A standard tree. Round one's entrants sit as tight pairs; every later
    // entrant sits at the vertical midpoint of the pair that feeds it, and each
    // pair's connector joins THOSE two and runs out at their midpoint into the
    // one slot (or the winner box) it feeds.
    const yE = [];                                     // yE[r][m][k]: entrant centers
    for (let r = 0; r < ROUNDS; r++) {
      yE.push([]);
      for (let m = 0; m < roundW(r); m++) {
        if (r === 0) { const c = Y0 + (m + 0.5) * 80; yE[0].push([c - (SH(0) + 2) / 2, c + (SH(0) + 2) / 2]); }
        else yE[r].push([0, 1].map((k) => { const f = yE[r - 1][2 * m + k]; return (f[0] + f[1]) / 2; }));
      }
    }
    const heads = [], lines = [], slots = [];
    for (let r = 0; r < ROUNDS; r++) {
      const w = roundW(r), done = madeIn(r);
      heads.push(
        <div key={`h${r}`} className="bk-hd" style={{ left: colX[r], width: colW(r), color: done === w ? ACC_LINE : `var(--stg-ink2, ${COLORS.faded})` }}>
          <span>{ROUND_NAME(r, ROUNDS)}</span>
          <i>{ptsLabel(r)} &middot; {done}/{w}</i>
        </div>
      );
      for (let m = 0; m < w; m++) {
        const sh = SH(r), kids = kidsOf(r, m), [ya, yb] = yE[r][m], c = (ya + yb) / 2;
        slots.push(slotButton(r, m, kids[0], 0, { left: colX[r], top: ya - sh / 2, width: colW(r), height: sh, fontSize: r === 0 ? 12 : 12.5 }));
        slots.push(slotButton(r, m, kids[1], 1, { left: colX[r], top: yb - sh / 2, width: colW(r), height: sh, fontSize: r === 0 ? 12 : 12.5 }));
        const right = colX[r] + colW(r), nextX = r < ROUNDS - 1 ? colX[r + 1] : winX, gm = Math.round((right + nextX) / 2);
        const on = g.picks[idOf(r, m)] >= 0;
        lines.push({ l: right, t: ya - 1, w: gm - right + 1, h: 2, on });
        lines.push({ l: right, t: yb - 1, w: gm - right + 1, h: 2, on });
        lines.push({ l: gm - 1, t: ya - 1, w: 2, h: yb - ya + 2, on });
        lines.push({ l: gm, t: c - 1, w: nextX - gm, h: 2, on });
      }
    }
    const cf = (yE[ROUNDS - 1][0][0] + yE[ROUNDS - 1][0][1]) / 2;
    return (
      <div className="bk-desk bk-scroll">
        <div className="bk-board" style={{ width: totalW, height: Y0 + H + 4 }}>
          {heads}
          <div className="bk-hd" style={{ left: winX, width: WIN_W, color: ACC_LINE }}><span>Winner</span><i>{ptsLabel(ROUNDS - 1).replace('a pick', 'the final')}</i></div>
          {lines.map((ln, i) => <span key={`l${i}`} className="bk-ln" aria-hidden="true" style={{ left: ln.l, top: ln.t, width: ln.w, height: ln.h, background: ln.on ? ACC_LINE : NEUTRAL_LINE }} />)}
          {slots}
          {winBox({ left: winX, top: cf - 30, width: WIN_W, height: 60 })}
        </div>
      </div>
    );
  }

  function renderPhone() {
    const ar = Math.min(bkRound, ROUNDS - 1);
    const w = roundW(ar);
    const SP = 105, PH = 44, PY0 = 26;
    const CUR_W = 60, NXT_L = 66;
    // Each pair of this round is joined and feeds ONE slot of the next round,
    // sitting beside it at the pair's midpoint (the winner box after the final).
    const cy = (m) => PY0 + (m + 0.5) * SP;
    const slots = [], lines = [], nxt = [];
    const midL = (CUR_W + NXT_L) / 2;
    for (let m = 0; m < w; m++) {
      const c = cy(m), ya = c - (PH + 2) / 2, yb = c + (PH + 2) / 2, kids = kidsOf(ar, m);
      slots.push(slotButton(ar, m, kids[0], 0, { left: 0, top: ya - PH / 2, width: `${CUR_W}%`, height: PH, fontSize: 13.5, borderRadius: 9, padding: '0 8px 0 12px' }));
      slots.push(slotButton(ar, m, kids[1], 1, { left: 0, top: yb - PH / 2, width: `${CUR_W}%`, height: PH, fontSize: 13.5, borderRadius: 9, padding: '0 8px 0 12px' }));
      const on = g.picks[idOf(ar, m)] >= 0;
      lines.push({ l: `${CUR_W}%`, w: `${midL - CUR_W}%`, t: ya - 1, h: 2, on });
      lines.push({ l: `${CUR_W}%`, w: `${midL - CUR_W}%`, t: yb - 1, h: 2, on });
      lines.push({ l: `calc(${midL}% - 1px)`, w: 2, t: ya - 1, h: yb - ya + 2, on });
      lines.push({ l: `${midL}%`, w: `${NXT_L - midL}%`, t: c - 1, h: 2, on });
      if (ar < ROUNDS - 1) {
        const nm = Math.floor(m / 2), nk = m % 2, it = kidsOf(ar + 1, nm)[nk];
        nxt.push(slotButton(ar + 1, nm, it, nk, { left: `${NXT_L}%`, top: c - PH / 2, width: `${100 - NXT_L}%`, height: PH, fontSize: 12.5, borderRadius: 9 }));
      }
    }
    // The mini map: the whole bracket as pips, one per matchup, filled once picked.
    const MH = Math.max(56, (N / 2) * 7), STEP = 26;
    const my = (r, m) => (m + 0.5) * MH / roundW(r);
    const pips = [], mlines = [];
    for (let r = 0; r < ROUNDS; r++) {
      for (let m = 0; m < roundW(r); m++) {
        const on = g.picks[idOf(r, m)] >= 0;
        pips.push({ x: r * STEP, y: my(r, m) - 4, on });
        if (r > 0) {
          const a = my(r - 1, 2 * m), b = my(r - 1, 2 * m + 1), x0 = (r - 1) * STEP + 8, gm = r * STEP - 7;
          mlines.push({ l: x0, t: a, w: gm - x0, h: 1 }, { l: x0, t: b, w: gm - x0, h: 1 }, { l: gm, t: a, w: 1, h: b - a }, { l: gm, t: my(r, m), w: r * STEP - gm, h: 1 });
        }
      }
    }
    const lastX = (ROUNDS - 1) * STEP;
    mlines.push({ l: lastX + 8, t: MH / 2, w: 8, h: 1 });
    const mapW = lastX + 34;
    return (
      <div className="bk-phone">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0 0' }}>
          <div aria-hidden="true" style={{ position: 'relative', width: mapW, height: MH, flex: '0 0 auto' }}>
            {mlines.map((ln, i) => <span key={`ml${i}`} style={{ position: 'absolute', left: ln.l, top: ln.t, width: ln.w, height: ln.h, background: NEUTRAL_LINE }} />)}
            {pips.map((p, i) => <span key={`p${i}`} style={{ position: 'absolute', left: p.x, top: p.y, width: 8, height: 8, boxSizing: 'border-box', borderRadius: 4, background: p.on ? ACC_LINE : `var(--stg-ground, ${T.surface})`, border: p.on ? 0 : `1.5px solid var(--stg-mute, ${COLORS.faded})` }} />)}
            <Trophy size={16} style={{ position: 'absolute', left: lastX + 17, top: MH / 2 - 8, color: ACC_LINE }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}><b style={{ color: INK, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{filled}</b> of {MATCHES} picked</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: FADED, lineHeight: 1.35 }}>{playing ? 'No feedback until you hand it in.' : 'Handed in. Every result is below.'}</span>
          </div>
        </div>
        <div role="tablist" aria-label="Rounds" style={{ display: 'flex', gap: 6, margin: '12px 0 0' }}>
          {Array.from({ length: ROUNDS }).map((_, r) => {
            const active = r === ar, wr = roundW(r), made = madeIn(r);
            const sub = playing ? `${made}/${wr}` : (perRound[r] ? `${perRound[r][0]}/${wr} right` : `${made}/${wr}`);
            return (
              <button key={r} type="button" role="tab" aria-selected={active} className="bk-tab" onClick={() => setBkRound(r)}
                style={active
                  ? { border: 0, background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})` }
                  : { border: `1.5px solid ${NEUTRAL_LINE}`, background: 'transparent', color: (playing && made === wr) ? ACC_LINE : `var(--stg-ink2, ${COLORS.ink})` }}>
                <b>{tabName(r)}</b><i>{sub}</i>
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', height: PY0 + w * SP, margin: '14px 0 0' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, fontFamily: MONO, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACC_LINE }}>{ROUND_NAME(ar, ROUNDS)} &middot; {ptsLabel(ar)}</span>
          <span style={{ position: 'absolute', left: `${NXT_L}%`, top: 0, fontFamily: MONO, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED }}>{ar < ROUNDS - 1 ? `Feeds ${tabName(ar + 1)}` : 'Winner'}</span>
          {lines.map((ln, i) => <span key={`pl${i}`} className="bk-ln" aria-hidden="true" style={{ left: ln.l, top: ln.t, width: ln.w, height: ln.h, background: ln.on ? ACC_LINE : NEUTRAL_LINE }} />)}
          {slots}
          {nxt}
          {ar === ROUNDS - 1 && winBox({ left: `${NXT_L}%`, top: cy(0) - 30, width: `${100 - NXT_L}%`, height: 60 })}
        </div>
        {ar < ROUNDS - 1 && madeIn(ar) === w && (
          <button type="button" className="bk-btn" onClick={() => setBkRound(ar + 1)} style={{ marginTop: 10, minHeight: 44 }}>Next: {ROUND_NAME(ar + 1, ROUNDS)} &rarr;</button>
        )}
      </div>
    );
  }

  function renderBoard() {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: 12, background: `var(--stg-acc-tint, ${COLORS.accentSoft})`, borderLeft: `4px solid ${ACC_LINE}`, borderRadius: 10, padding: '10px 14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: '0 0 auto', color: ACC_LINE }}><path d="M3 4h5v6h5" /><path d="M3 16h5v-6" /><path d="M13 10h4" /><path d="M17 7v6" /><path d="M17 10h4" /></svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACC_LINE }}>Every matchup asks</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.25 }}>{PUZZLE.metric}</span>
              {PUZZLE.asOf && <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: FADED }}>Figures as of {PUZZLE.asOf}</span>}
            </div>
          </div>
          <span className="bk-desk" style={{ width: 150, fontSize: 12, fontWeight: 700, color: FADED, lineHeight: 1.4 }}>
            {playing ? 'No feedback until you hand it in.' : `Handed in. ${filled} of ${MATCHES} picked.`}
          </span>
        </div>
        {renderDesktop()}
        {renderPhone()}
        {started && (
          <div className="bk-ctl">
            <button type="button" className="bk-help" onClick={() => setShowHelp(true)} style={{ border: `1.5px solid ${NEUTRAL_LINE}`, background: 'transparent', color: INK, fontWeight: 700 }}>How to play</button>
            {filled > 0 && <button type="button" className="bk-clear" onClick={clearAll} style={{ border: `1.5px solid ${NEUTRAL_LINE}`, background: 'transparent', color: INK, fontWeight: 700 }}><Eraser size={14} /> Clear</button>}
            <span className="bk-note">Changing a pick clears everything it fed.</span>
            <button type="button" className="bk-hand" onClick={submit} disabled={!complete}
              style={complete
                ? { border: 0, background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, fontWeight: 800, fontSize: 15 }
                : { border: `1.5px dashed ${NEUTRAL_LINE}`, background: 'transparent', color: FADED, fontWeight: 800, fontSize: 15, cursor: 'not-allowed' }}>
              <Trophy size={15} /> Hand in the bracket{complete ? '' : ` · ${MATCHES - filled} ${MATCHES - filled === 1 ? 'pick' : 'picks'} left`}
            </button>
          </div>
        )}
      </>
    );
  }

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
            // Picks made, never the score: the score is graded against the real
            // results, so showing it mid-play told the player which picks were
            // right before they handed the sheet in (reader report 2026-10-08).
            { v: `${filled}/${MATCHES}`, k: 'picks' },
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
          .bk-scroll{overflow-x:auto;padding-bottom:6px;scrollbar-width:thin;}
          .bk-board{position:relative;}
          .bk-hd{position:absolute;top:0;display:flex;flex-direction:column;gap:2px;font-family:${MONO};font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;}
          .bk-hd i{font-style:normal;font-weight:700;letter-spacing:.06em;color:var(--stg-mute, ${COLORS.faded});font-variant-numeric:tabular-nums;}
          .bk-ln{position:absolute;border-radius:1px;}
          .bk-s{position:absolute;box-sizing:border-box;margin:0;display:flex;align-items:center;gap:6px;text-align:left;font-family:${SANS};font-size:12.5px;font-weight:700;line-height:1.15;color:var(--stg-ink, ${COLORS.ink});background:var(--stg-cell, var(--white));border:1px solid var(--stg-cell-line, rgba(28,30,36,0.3));border-radius:7px;padding:0 8px 0 11px;cursor:pointer;}
          .bk-s .bk-n{flex:1 1 auto;min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
          .bk-s:hover:not(:disabled){background:color-mix(in srgb, var(--stg-ink, ${COLORS.ink}) 9%, var(--stg-cell, var(--white)));}
          .bk-s:disabled{cursor:default;}
          .bk-s.wait{background:transparent;border:1.5px dashed var(--stg-cell-line, rgba(28,30,36,0.3));color:var(--stg-mute, ${COLORS.faded});font-family:${MONO};font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
          .bk-s.on{background:color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 18%, var(--stg-cell, var(--white)));border-color:transparent;box-shadow:inset 4px 0 0 var(--stg-acc-ink, ${COLORS.accent});font-weight:800;}
          .bk-s.off{background:transparent;color:var(--stg-mute, ${COLORS.faded});font-weight:600;}
          .bk-s.right{background:color-mix(in srgb, var(--stg-good, ${COLORS.green}) 22%, var(--stg-cell, var(--white)));border-color:transparent;box-shadow:inset 4px 0 0 var(--stg-good, ${COLORS.green});font-weight:800;}
          .bk-s.wrong{background:color-mix(in srgb, var(--stg-bad, ${COLORS.redInk}) 18%, var(--stg-cell, var(--white)));border-color:transparent;box-shadow:inset 4px 0 0 var(--stg-bad, ${COLORS.redInk});}
          .bk-s.wrong .bk-n{text-decoration:line-through;}
          .bk-v{flex:0 0 auto;font-family:${MONO};font-size:10.5px;font-weight:700;color:var(--stg-ink2, ${COLORS.faded});font-variant-numeric:tabular-nums;}
          .bk-win{position:absolute;box-sizing:border-box;border-radius:10px;background:var(--stg-cell, var(--white));display:flex;align-items:center;justify-content:center;gap:7px;padding:0 10px;font-family:${SANS};font-size:13px;font-weight:800;text-align:center;line-height:1.2;}
          .bk-tab{flex:1 1 0;min-width:0;min-height:50px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0 2px;cursor:pointer;font-family:${SANS};}
          .bk-tab b{font-size:12px;font-weight:800;white-space:nowrap;}
          .bk-tab i{font-style:normal;font-family:${MONO};font-size:10.5px;font-weight:700;font-variant-numeric:tabular-nums;}
          .bk-phone{display:none;}
          .bk-ctl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0 6px;}
          .bk-ctl .bk-note{flex:1 1 160px;font-size:12px;font-weight:700;color:var(--stg-mute, ${COLORS.faded});text-align:right;line-height:1.4;}
          .bk-ctl button{min-height:48px;border-radius:12px;font-family:${SANS};font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 16px;}
          @media (max-width:640px), (pointer:coarse){
            .bk-desk{display:none;}
            .bk-phone{display:block;}
            .bk-ctl .bk-help{display:none;}
            .bk-ctl .bk-note{flex:1 1 100%;order:-1;text-align:left;}
            .bk-ctl .bk-clear{flex:1 1 0;}
            .bk-ctl .bk-hand{flex:2.6 1 0;}
          }
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

        {!preStart && renderBoard()}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <>
              <div style={{ maxWidth: 560, margin: '14px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {won ? <>A perfect bracket. Nothing busted.</> : solShown ? <>{champion.name} took it at {fmtValue(champion.value, PUZZLE.unit)}.</> : <>Your bracket busted.</>}
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
                  <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026','')} archive. <a href="/bracket" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s bracket &rarr;</a>{' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a></>
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
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
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
      ? `Bracket #${PUZZLE.num}: the daily bracket of facts from Mind Loft.\n${withRef(`mindloftdaily.com/bracket${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Bracket #${PUZZLE.num} · ${score}/${TOTAL}\n${rows}${streakBit}\n${withRef(`mindloftdaily.com/bracket${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }
}
