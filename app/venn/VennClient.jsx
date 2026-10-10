'use client';

// Venn — the daily three-circle sorting puzzle.
//
// Three labelled circles, twelve words, and every one of the seven regions is
// used. What stops it being a quiz is the counts: each region prints how many
// words belong in it, so a misfiled word always shows up as an arithmetic
// problem before it shows up as a wrong answer, and the board refuses to be
// submitted until your arrangement matches every printed count.
//
// The client never receives the answer. Rule specs ship as data and the browser
// recomputes each word's true region, the same way the generator proved the
// board sound (scripts/verify-venn.mjs).
//
// Scoring: 12 points, 3 off for each rejected sheet, floor of 1. Sundays run
// fifteen words and withhold two of the seven counts, so part of the check has
// to be reconstructed before it can be used.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Circle, Eraser } from 'lucide-react';
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
import { ruleFn, ruleLabel, usesFacts } from '@/lib/venn-rules';
import { domainNote } from '@/lib/venn-facts';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted,
  accent: '#b45309', accentSoft: '#fef3c7', accentDeep: '#92400e', green: T.successDeep, greenSoft: '#dcfce7',
  // THE THREE SETS. These identify circle A, B and C, so they are meaning
  // colours and cannot simply be neutralised — but the 700-weight versions are
  // 3.2 to 3.7:1 on the stage's near-black ground. Each takes a lighter twin
  // there and keeps its own hue, so the sets still read as the same three.
  cA: `var(--stg-cA, ${T.blue})`, cB: 'var(--stg-cB, #be185d)', cC: 'var(--stg-cC, #0f766e)',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_venn_help_seen';
const STATS_KEY = 'sot_venn_stats';
const TOTAL = 12;

// The rule engine lives in lib/venn-rules.js so this file and
// scripts/verify-venn.mjs share one definition instead of two hand-synced
// copies. `ruleFn`/`ruleLabel` take the board's `domain` as a second argument;
// only the knowledge rule (`fact`) reads it.

// region bits: 1 = in the first circle, 2 = the second, 4 = the third
const REGIONS = [1, 2, 4, 3, 5, 6, 7];
// THE LARGE DIAGRAM (desktop), in a 664x610 box. `a` is the anchor: a region
// grows away from its neighbours as its slot stack lengthens, so A + B grows
// up out of the lens and C only grows down, and a four-word region never sits
// on all three.
const DZONE = {
  1: { x: 149, y: 140, a: 'c' },
  2: { x: 515, y: 140, a: 'c' },
  4: { x: 332, y: 414, a: 't' },
  3: { x: 332, y: 176, a: 'b' },
  5: { x: 214, y: 327, a: 'c' },
  6: { x: 450, y: 327, a: 'c' },
  7: { x: 332, y: 240, a: 'c' },
};
// THE PHONE DIAGRAM, in a 358x330 box: one count button per region.
const PZONE = {
  1: { x: 71, y: 86 }, 2: { x: 287, y: 86 }, 4: { x: 179, y: 271 },
  3: { x: 179, y: 71 }, 5: { x: 104, y: 193 }, 6: { x: 254, y: 193 }, 7: { x: 179, y: 143 },
};
// where each region's tray sits on the diagram, and what to call it
const ZONE = {
  1: { x: 60,  y: 96,  label: 'A only' },
  2: { x: 260, y: 96,  label: 'B only' },
  4: { x: 160, y: 252, label: 'C only' },
  3: { x: 160, y: 62,  label: 'A + B' },
  5: { x: 86,  y: 190, label: 'A + C' },
  6: { x: 234, y: 190, label: 'B + C' },
  7: { x: 160, y: 150, label: 'all three' },
};

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
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {}; for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0)/100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState(n) {
  return { v: 1, place: Array(n).fill(0), rejected: 0, status: 'playing', t0: null, tEnd: null };
}

export default function VennClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_venn_${PUZZLE.num}`;
  const N = PUZZLE.items.length;

  // the truth, recomputed rather than shipped
  const TRUTH = useMemo(() => {
    const fns = PUZZLE.rules.map((r) => ruleFn(r, PUZZLE.domain));
    return PUZZLE.items.map((w) => (fns[0](w) ? 1 : 0) | (fns[1](w) ? 2 : 0) | (fns[2](w) ? 4 : 0));
  }, [PUZZLE]);
  const COUNTS = useMemo(() => {
    const c = {}; REGIONS.forEach((r) => { c[r] = 0; });
    TRUTH.forEach((r) => { c[r]++; });
    return c;
  }, [TRUTH]);
  const hiddenSet = useMemo(() => new Set(PUZZLE.hiddenCounts || []), [PUZZLE]);

  const [g, setG] = useState(() => freshState(N));
  const [held, setHeld] = useState(null);
  const [verdict, setVerdict] = useState(null);
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
  const LOFT = isLoft('venn');
  const STAGE = isStage('venn', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('venn');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('venn'), '--stg-acc-lt': gameColorLight('venn'), '--stg-onramp-lt': gameOnrampLight('venn'), '--stg-acc-ink-lt': gameAccentInkLight('venn') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const placedCount = g.place.filter(Boolean).length;
  const liveScore = Math.max(1, TOTAL - 3 * g.rejected);
  const score = g.status === 'done' ? liveScore : 0;
  const won = g.status === 'done' && g.rejected === 0;
  // A reveal keeps the player's own filing on the board until the end card's
  // Reveal tile is pressed; the finish beat would otherwise show the answer.
  const hideSol = LOFT && g.status === 'lost' && !revealed;
  const placeShown = hideSol ? (g.pre || Array(N).fill(0)) : g.place;

  const mine = useMemo(() => { const c = {}; REGIONS.forEach((r) => { c[r] = 0; }); g.place.forEach((r) => { if (r) c[r]++; }); return c; }, [g.place]);
  const countsMatch = REGIONS.every((r) => hiddenSet.has(r) || mine[r] === COUNTS[r]);
  const canSubmit = placedCount === N && countsMatch;

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
      if (raw) { const saved = JSON.parse(raw); if (saved && saved.v === 1 && Array.isArray(saved.place) && saved.place.length === N) setG({ ...freshState(N), ...saved }); }
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
        (function () { var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_venn_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_venn_day'); })();
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
          if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
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
  const iq = useIqStanding({ game: 'venn', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'venn', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'venn', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'venn', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'venn', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_venn_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = placedCount > 0 || g.rejected > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now()))/1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: g.rejected, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0)/1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.rejected, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: g2.rejected, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  function startRun() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }

  function dropInto(region) {
    if (!playing || held == null) return;
    setG((cur) => { const place = cur.place.slice(); place[held] = region; return { ...cur, place, t0: cur.t0 || Date.now() }; });
    setHeld(null); setVerdict(null);
  }
  function liftFrom(i) {
    if (!playing) return;
    if (held === i) { setHeld(null); return; }
    if (g.place[i]) { setG((cur) => { const place = cur.place.slice(); place[i] = 0; return { ...cur, place }; }); setHeld(i); }
    else setHeld(i);
    setVerdict(null);
  }
  // Send a single filed word back to the tray. liftFrom() also empties the
  // slot, but it picks the word up as `held`, so a reader who only wanted that
  // one word out again had to tap a second time to put it down. This is the
  // plain remove, wired to the little x on each filed chip.
  function unfile(i) {
    if (!playing) return;
    setG((cur) => { const place = cur.place.slice(); place[i] = 0; return { ...cur, place }; });
    setHeld((h) => (h === i ? null : h));
    setVerdict(null);
  }
  function clearAll() { if (!playing) return; setG((cur) => ({ ...cur, place: Array(N).fill(0) })); setHeld(null); }

  function submit() {
    if (!playing || !canSubmit) return;
    const wrong = g.place.map((r, i) => (r === TRUTH[i] ? null : i)).filter((x) => x != null);
    if (!wrong.length) {
      const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
      setG(g2); setVerdict(null); setEndClosed(false);
      postResult(g2, Math.max(1, TOTAL - 3 * g2.rejected));
    } else {
      setG((cur) => { const place = cur.place.slice(); wrong.forEach((i) => { place[i] = 0; }); return { ...cur, place, rejected: cur.rejected + 1 }; });
      setVerdict({ msg: `${wrong.length} word${wrong.length === 1 ? ' is' : 's are'} in the wrong region. They are back in the tray. (−3)` });
    }
  }
  function reveal() {
    if (!playing) return;
    setG((cur) => { const g2 = { ...cur, place: TRUTH.slice(), pre: cur.place, status: 'lost', tEnd: Date.now(), t0: cur.t0 || Date.now() }; postResult(g2, 0); return g2; });
    setHeld(null); setVerdict(null); setEndClosed(false);
  }
  function resetGame() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} setG(freshState(N)); setHeld(null); setVerdict(null); setEndClosed(false); }

  const circleColor = [COLORS.cA, COLORS.cB, COLORS.cC];
  const VOWEL_RULES = ['vowels', 'onevowel', 'startvowel', 'endvowel', 'altvc', 'twinvowel'];
  const showVowelNote = PUZZLE.rules.some((r) => VOWEL_RULES.includes(r.k));
  const showHidesNote = PUZZLE.rules.some((r) => r.k === 'hides');
  // A knowledge board announces its subject up front. Without it a player can
  // spend the first minute working out that the twelve items are all
  // countries, which is not the puzzle.
  const factNote = usesFacts(PUZZLE.rules) ? domainNote(PUZZLE.domain) : '';
  const noun = PUZZLE.domain ? 'item' : 'word';
  const tightItems = PUZZLE.items.some((w) => w.length > 8);
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead={`File every ${noun} where it belongs.`}
      chips={PUZZLE.rules.map((r, i) => ({
        label: `${String.fromCharCode(65 + i)}: ${ruleLabel(r, PUZZLE.domain)}`,
        style: { padding: '6px 10px', background: STAGE ? SURF : T.white, border: `2px solid ${circleColor[i]}`, color: circleColor[i] },
      }))}
      steps={[
        <>Tap a word, then tap the region it belongs in. Tap a filed word to pick it back up, or tap its <b>&times;</b> to send it straight to the tray.</>,
        <>Words can satisfy two circles, or all three. Every region here holds at least one.</>,
        <>Each region prints <b>how many</b> words belong in it.</>,
        <>When your counts match, <b>File the sheet</b>.</>,
      ]}
      knack="the counts are the proof. If a region wants two words and you can only find one for it, something you have already filed elsewhere belongs there, so go back and find it rather than guessing."
      sub={(showVowelNote || showHidesNote || factNote) ? (
        <>
          {factNote && <div><b>{factNote}</b></div>}
          {showVowelNote && <div>The vowels are A, E, I, O and U. Y never counts as one.</div>}
          {showHidesNote && <div>A word hides something only when the smaller word sits inside a longer one. SHIP hides a hip, but LUNG does not hide a lung.</div>}
        </>
      ) : null}
      footer={`12 points, 3 off for each sheet that comes back wrong. Vowels are A, E, I, O, U, never Y.${PUZZLE.sunday ? ' Sunday withholds two of the counts.' : ''}`}
    />
  );

  const trayItems = PUZZLE.items.map((w, i) => ({ w, i })).filter(({ i }) => !g.place[i]);

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="venn" name="Venn" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="venn" quizId={PUZZLE.quizId}
          name="Venn"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: liveScore, k: 'score' },
            { v: g.rejected, k: 'rejected' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: g.rejected, k: 'rejected' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="vn-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.vn-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .vn-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .vn-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          /* ROUND THREE BOARD (2026-10-10). Desktop: three rule cards, a large
             diagram whose regions hold one 44px slot per counted word, then the
             tray. Phone (640px and under): the rules stack, the diagram shrinks
             to count badges and pips, and every word lives in one roster that
             says where it is filed. Slots, pips and roster cards are drop
             zones, so they take --stg-cell / --stg-cell-line (CLAUDE.md, A DROP
             ZONE IS A CELL); full and over-full signal with the border. */
          .vn-cap{font-family:${SANS};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:${FADED};}
          .vn-cap b{color:${INK};font-weight:800;letter-spacing:0;}
          .vn-rules{display:flex;gap:8px;margin:0 0 10px;}
          .vn-rule{flex:1;min-width:0;display:flex;align-items:center;gap:9px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border-radius:12px;padding:8px 12px;font-family:${SANS};font-size:14px;font-weight:800;color:${INK};line-height:1.25;}
          .vn-rule .k{width:24px;height:24px;border-radius:12px;box-sizing:border-box;border:2.5px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;}
          .vn-meta{display:flex;justify-content:space-between;align-items:baseline;gap:6px 14px;flex-wrap:wrap;margin:0 0 6px;}
          .vn-note{font-family:${SANS};font-size:13px;font-weight:700;color:var(--stg-ink2, ${COLORS.faded});}
          .vn-dia{position:relative;width:100%;max-width:664px;aspect-ratio:664/610;margin:6px auto 0;}
          .vn-dia svg{position:absolute;inset:0;width:100%;height:100%;}
          .vn-z{position:absolute;width:108px;display:flex;flex-direction:column;gap:4px;z-index:1;}
          .vn-z:hover,.vn-z:focus-within{z-index:6;}
          .vn-z .bdg{position:absolute;top:-11px;right:-12px;z-index:2;min-width:30px;height:22px;box-sizing:border-box;border-radius:11px;padding:0 7px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:var(--stg-cell, #fff);color:${INK};display:flex;align-items:center;justify-content:center;font-family:${SANS};font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;}
          .vn-z.ready .bdg{border-color:var(--stg-good, ${COLORS.green});background:var(--stg-good, ${COLORS.green});color:var(--stg-ground, #fff);}
          .vn-z.over .bdg{border-color:var(--stg-bad, ${COLORS.rust});color:var(--stg-bad, ${COLORS.rust});}
          .vn-slot{display:flex;height:44px;box-sizing:border-box;border-radius:10px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:var(--stg-cell, #fff);overflow:hidden;}
          .vn-z.ready .vn-slot{border-color:var(--stg-good, ${COLORS.green});}
          .vn-z.over .vn-slot{border-color:var(--stg-bad, ${COLORS.rust});}
          .vn-slot .t{flex:1;min-width:0;border:0;background:transparent;color:inherit;font-family:${SANS};font-size:12.5px;font-weight:800;letter-spacing:.01em;text-align:left;padding:0 0 0 9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;}
          .vn-slot .x{width:28px;flex:none;border:0;background:transparent;color:${FADED};font-family:${SANS};font-size:17px;font-weight:700;padding:0;cursor:pointer;}
          .vn-slot .x:hover{color:var(--stg-bad, ${COLORS.rust});}
          .vn-slot:hover{border-color:var(--stg-acc-ink, ${COLORS.accent});}
          .vn-open{height:44px;box-sizing:border-box;border-radius:10px;border:2px dashed var(--stg-cell-line, rgba(28,30,36,0.4));background:var(--stg-cell, #fff);color:${FADED};font-family:${SANS};font-size:12px;font-weight:800;padding:0;cursor:default;}
          .vn-armed .vn-open{border-color:var(--stg-acc-ink, ${COLORS.accent});color:var(--stg-acc-ink, ${COLORS.accent});cursor:pointer;}
          /* Knowledge boards run nine-letter names (ARGENTINA, TENNESSEE), so a
             board whose longest item passes 8 characters drops a step in size
             rather than ellipsising a name the player then cannot read back. */
          .vn-tight .vn-slot .t{font-size:11px;letter-spacing:0;}
          .vn-tray{display:flex;flex-wrap:wrap;gap:8px;min-height:44px;}
          .vn-chip{min-height:44px;box-sizing:border-box;border-radius:10px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};font-family:${SANS};font-size:14px;font-weight:800;letter-spacing:.02em;padding:0 14px;cursor:pointer;}
          .vn-chip:hover{border-color:var(--stg-acc-ink, ${COLORS.accent});}
          .vn-chip.held{border:2px solid var(--stg-acc-ink, ${COLORS.accent});background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);}
          .vn-pdia,.vn-roster,.vn-ph-only{display:none;}
          .vn-pdia{position:relative;width:100%;max-width:358px;aspect-ratio:358/330;margin:8px auto 0;}
          .vn-pdia svg{position:absolute;inset:0;width:100%;height:100%;}
          .vn-pz{position:absolute;transform:translate(-50%,-50%);min-width:56px;min-height:48px;box-sizing:border-box;border-radius:12px;border:1.5px dashed var(--stg-cell-line, rgba(28,30,36,0.4));background:color-mix(in srgb, var(--stg-cell, #fff) 55%, transparent);padding:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-family:${SANS};cursor:pointer;z-index:1;}
          .vn-armed .vn-pz{border-color:var(--stg-acc-ink, ${COLORS.accent});}
          .vn-pz.ready{border-style:solid;border-color:var(--stg-good, ${COLORS.green});}
          .vn-pz.over{border-style:solid;border-color:var(--stg-bad, ${COLORS.rust});}
          .vn-pz .bdg{font-size:11px;font-weight:800;border-radius:7px;padding:0 5px;line-height:14px;color:${INK};font-variant-numeric:tabular-nums;}
          .vn-pz.ready .bdg{background:var(--stg-good, ${COLORS.green});color:var(--stg-ground, #fff);}
          .vn-pz.over .bdg{color:var(--stg-bad, ${COLORS.rust});}
          .vn-pips{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-width:44px;}
          .vn-pip{width:20px;height:20px;box-sizing:border-box;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:800;letter-spacing:0;color:var(--stg-ground, #fff);background:${INK};}
          .vn-pip.open{background:transparent;border:1.5px dashed var(--stg-cell-line, rgba(28,30,36,0.4));}
          .vn-roster{grid-template-columns:repeat(auto-fill, minmax(104px, 1fr));gap:6px;}
          .vn-rc{height:44px;box-sizing:border-box;border-radius:10px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};display:flex;overflow:hidden;min-width:0;}
          .vn-rc.filed{border-style:dashed;background:transparent;}
          .vn-rc.held{border:2px solid var(--stg-acc-ink, ${COLORS.accent});background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);}
          .vn-rc .t{flex:1;min-width:0;border:0;background:transparent;padding:0 0 0 9px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;font-family:${SANS};cursor:pointer;text-align:left;}
          .vn-rc .t:disabled{cursor:default;}
          .vn-rc .w{font-size:13px;font-weight:800;letter-spacing:.01em;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .vn-tight .vn-rc .w{font-size:12px;letter-spacing:0;}
          .vn-rc .g{font-size:10px;font-weight:700;color:${FADED};white-space:nowrap;}
          .vn-rc.held .g{color:var(--stg-acc-ink, ${COLORS.accent});}
          .vn-rc .x{width:30px;flex:none;border:0;background:transparent;color:${FADED};font-family:${SANS};font-size:17px;font-weight:700;padding:0;cursor:pointer;}
          .vn-foot{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0 6px;}
          .vn-ob{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2, ${COLORS.ink});border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));border-radius:12px;padding:0 16px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .vn-ob:disabled{color:${FADED};cursor:default;}
          .vn-fnote{flex:1;min-width:150px;text-align:right;font-family:${SANS};font-size:12px;font-weight:600;color:${FADED};line-height:1.4;}
          .vn-file{font-family:${SANS};font-weight:800;font-size:15px;border-radius:12px;padding:0 18px;min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);border:1.5px solid var(--stg-acc, ${COLORS.accent});}
          .vn-file:disabled{background:transparent;color:${FADED};border:1.5px dashed var(--stg-cell-line, rgba(28,30,36,0.4));cursor:not-allowed;}
          @media(max-width:640px){
            .vn-rules{flex-direction:column;gap:5px;margin-bottom:6px;}
            .vn-rule{background:transparent;padding:0;gap:8px;}
            .vn-rule .k{width:20px;height:20px;border-radius:10px;font-size:10px;}
            .vn-cap{font-size:10px;}
            .vn-note{font-size:12px;color:${FADED};}
            .vn-dia,.vn-tray,.vn-fnote,.vn-meta .vn-cap{display:none;}
            .vn-pdia{display:block;}
            .vn-ph-only{display:inline;}
            .vn-dt-only{display:none;}
            .vn-roster{display:grid;}
            .vn-foot{flex-wrap:nowrap;gap:8px;}
            .vn-file{flex:1;font-size:14px;min-height:48px;padding:0 10px;}
            .vn-ob{min-height:48px;padding:0 14px;}
            ${LOFT ? '.vn-foot .vn-help{display:none;}' : ''}
          }
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="venn"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Two Counts Missing</span>}
          blocks={'VENN'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px 22px', minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The sheet is face down'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N} words, three overlapping circles, and every one of the seven regions is used. The counts tell you the shape of the answer.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="vn-btn" onClick={startRun} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Turn the sheet over</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>{gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}</button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (() => {
          // One record per region, shared by the large diagram and the phone one.
          const regionInfo = (r) => {
            const words = PUZZLE.items.map((w, i) => ({ w, i })).filter(({ i }) => placeShown[i] === r);
            const hid = hiddenSet.has(r);
            const need = hid && (playing || hideSol) ? '?' : COUNTS[r];
            const ready = !hid && words.length === COUNTS[r];
            const over = !hid && words.length > COUNTS[r];
            // Open slots while playing: one per word still owed. A withheld
            // count always offers exactly one, so the slots never print it.
            const open = !playing ? 0 : (hid ? 1 : Math.max(0, COUNTS[r] - words.length));
            return { words, need, ready, over, open };
          };
          const wordInk = (i) => (!playing ? (TRUTH[i] === placeShown[i] ? `var(--stg-good, ${COLORS.green})` : `var(--stg-bad, ${COLORS.rust})`) : INK);
          const tag = (r) => (r === 7 ? 'All three' : ZONE[r].label);
          const heldName = held != null ? PUZZLE.items[held] : null;
          const circles = (cA, cB, cC, rr, sw) => (
            <>
              <circle cx={cA[0]} cy={cA[1]} r={rr} fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth={sw} style={{ color: COLORS.cA }} />
              <circle cx={cB[0]} cy={cB[1]} r={rr} fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth={sw} style={{ color: COLORS.cB }} />
              <circle cx={cC[0]} cy={cC[1]} r={rr} fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth={sw} style={{ color: COLORS.cC }} />
            </>
          );
          return (
          <>
            <div className="vn-rules">
              {PUZZLE.rules.map((r, i) => (
                <span key={i} className="vn-rule">
                  <span className="k" style={{ color: circleColor[i] }}>{String.fromCharCode(65 + i)}</span>
                  <span>{ruleLabel(r, PUZZLE.domain)}</span>
                </span>
              ))}
            </div>

            <div className="vn-meta">
              <span className="vn-note">{factNote}</span>
              <span className="vn-cap">
                Filed <b>{placedCount}</b> of {N} &middot; counts <b style={countsMatch ? { color: `var(--stg-good, ${COLORS.green})` } : undefined}>{countsMatch ? 'match' : 'off'}</b>
                {!LOFT && <> &middot; on the board <b style={{ color: g.rejected ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-good, ${COLORS.green})` }}>{liveScore}</b>/{TOTAL}</>}
              </span>
            </div>

            {/* THE LARGE DIAGRAM (over 640px) */}
            <div className={`vn-dia${held != null ? ' vn-armed' : ''}${tightItems ? ' vn-tight' : ''}`}>
              <svg viewBox="0 0 664 610" aria-hidden="true">
                {circles([229, 194], [435, 194], [332, 372], 192, 2.5)}
                <text x="22" y="34" fill="currentColor" style={{ color: COLORS.cA }} fontSize="24" fontWeight="800" fontFamily="Manrope, sans-serif">A</text>
                <text x="626" y="34" fill="currentColor" style={{ color: COLORS.cB }} fontSize="24" fontWeight="800" fontFamily="Manrope, sans-serif">B</text>
                <text x="96" y="548" fill="currentColor" style={{ color: COLORS.cC }} fontSize="24" fontWeight="800" fontFamily="Manrope, sans-serif">C</text>
              </svg>
              {REGIONS.map((r) => {
                const { words, need, ready, over, open } = regionInfo(r);
                const z = DZONE[r];
                const tf = z.a === 't' ? 'translate(-50%,0)' : (z.a === 'b' ? 'translate(-50%,-100%)' : 'translate(-50%,-50%)');
                return (
                  <div key={r} className={`vn-z${ready ? ' ready' : ''}${over ? ' over' : ''}`} style={{ left: `${(z.x / 664) * 100}%`, top: `${(z.y / 610) * 100}%`, transform: tf, cursor: held != null ? 'pointer' : undefined }} onClick={() => dropInto(r)} title={ZONE[r].label}>
                    <span className="bdg" aria-label={`${ZONE[r].label}: ${words.length} of ${need} filed`}>{words.length}/{need}</span>
                    {words.map(({ w, i }) => (
                      <div key={w} className="vn-slot" style={{ color: wordInk(i) }}>
                        <button type="button" className="t" title={playing ? 'Tap to pick this word back up' : undefined} onClick={(e) => { e.stopPropagation(); if (held != null) { dropInto(r); return; } liftFrom(i); }}>{w}</button>
                        {playing && (
                          <button type="button" className="x" aria-label={`Send ${w} back to the tray`} title="Back to the tray" onClick={(e) => { e.stopPropagation(); unfile(i); }}>&times;</button>
                        )}
                      </div>
                    ))}
                    {Array.from({ length: open }).map((_, k) => (
                      <button key={`o${k}`} type="button" className="vn-open" aria-label={held != null ? `File ${heldName} in ${ZONE[r].label}` : `Open slot in ${ZONE[r].label}`} onClick={(e) => { e.stopPropagation(); dropInto(r); }}>{held != null ? 'file here' : ''}</button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* THE PHONE DIAGRAM (640px and under): count buttons with pips */}
            <div className={`vn-pdia${held != null ? ' vn-armed' : ''}`}>
              <svg viewBox="0 0 358 330" aria-hidden="true">
                {circles([123, 116], [235, 116], [179, 213], 114, 2.5)}
                <text x="4" y="20" fill="currentColor" style={{ color: COLORS.cA }} fontSize="18" fontWeight="800" fontFamily="Manrope, sans-serif">A</text>
                <text x="341" y="20" fill="currentColor" style={{ color: COLORS.cB }} fontSize="18" fontWeight="800" fontFamily="Manrope, sans-serif">B</text>
                <text x="44" y="318" fill="currentColor" style={{ color: COLORS.cC }} fontSize="18" fontWeight="800" fontFamily="Manrope, sans-serif">C</text>
              </svg>
              {REGIONS.map((r) => {
                const { words, need, ready, over, open } = regionInfo(r);
                const z = PZONE[r];
                return (
                  <button key={r} type="button" className={`vn-pz${ready ? ' ready' : ''}${over ? ' over' : ''}`} style={{ left: `${(z.x / 358) * 100}%`, top: `${(z.y / 330) * 100}%` }} onClick={() => dropInto(r)}
                    aria-label={`${ZONE[r].label}, ${words.length} of ${need} filed${words.length ? `: ${words.map((x) => x.w).join(', ')}` : ''}.${held != null ? ` Tap to file ${heldName} here.` : ''}`}>
                    <span className="bdg">{words.length}/{need}</span>
                    <span className="vn-pips">
                      {words.map(({ w, i }) => (
                        <span key={w} className="vn-pip" style={!playing ? { background: wordInk(i) } : undefined}>{w.slice(0, 2)}</span>
                      ))}
                      {Array.from({ length: open }).map((_, k) => <span key={`o${k}`} className="vn-pip open" />)}
                    </span>
                  </button>
                );
              })}
            </div>

            {playing && (
              <div className="vn-cap" style={{ margin: '10px 0 7px' }}>
                <span className="vn-dt-only">The tray</span>
                <span className="vn-ph-only">Filed <b>{placedCount}</b> of {N} &middot; counts <b style={countsMatch ? { color: `var(--stg-good, ${COLORS.green})` } : undefined}>{countsMatch ? 'match' : 'off'}</b></span>
                {held != null && <> &middot; <span style={{ color: `var(--stg-acc-ink, ${COLORS.accent})` }}>Holding {heldName}, now tap a region</span></>}
              </div>
            )}
            {playing && (
              <div className="vn-tray">
                {trayItems.map(({ w, i }) => (
                  <button key={w} type="button" className={`vn-chip${held === i ? ' held' : ''}`} onClick={() => liftFrom(i)}>{w}</button>
                ))}
                {!trayItems.length && <span style={{ fontSize: 12.5, fontWeight: 700, color: FADED, alignSelf: 'center' }}>Tray empty. Check your counts, then file the sheet.</span>}
              </div>
            )}
            {/* THE PHONE ROSTER: every word, saying where it is. */}
            <div className={`vn-roster${tightItems ? ' vn-tight' : ''}`} style={!playing ? { marginTop: 12 } : undefined}>
              {PUZZLE.items.map((w, i) => {
                const at = placeShown[i];
                const isHeld = playing && held === i;
                return (
                  <div key={w} className={`vn-rc${isHeld ? ' held' : (at ? ' filed' : '')}`}>
                    <button type="button" className="t" disabled={!playing} title={playing ? (at ? 'Tap to pick this word back up' : 'Tap to pick up') : undefined} onClick={() => liftFrom(i)}>
                      <span className="w" style={{ color: !playing ? wordInk(i) : (at ? `var(--stg-ink2, ${COLORS.ink})` : INK) }}>{w}</span>
                      <span className="g">{isHeld ? 'Holding' : (at ? tag(at) : 'In the tray')}</span>
                    </button>
                    {playing && at ? (
                      <button type="button" className="x" aria-label={`Send ${w} back to the tray`} title="Back to the tray" onClick={() => unfile(i)}>&times;</button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
          );
        })()}

        {verdict && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: `var(--stg-bad, ${COLORS.rust})`, margin: '10px 0 0', lineHeight: 1.45 }}>{verdict.msg}</div>}

        {started && (
          <div className="vn-foot">
            <button type="button" className="vn-ob vn-help" onClick={() => setShowHelp(true)}><HelpCircle size={15} /> How to play</button>
            <button type="button" className="vn-ob" onClick={clearAll} disabled={placedCount === 0}><Eraser size={14} /> Clear all</button>
            <span className="vn-fnote">12 points, 3 off for each<br />sheet that comes back wrong.</span>
            {g.rejected >= 2 && <button type="button" className="vn-ob" onClick={reveal}>Reveal (ends the day)</button>}
            <button type="button" className="vn-file" onClick={submit} disabled={!canSubmit}>
              <Circle size={14} /> File the sheet{!canSubmit && <> &middot; {placedCount < N ? 'tray first' : 'counts first'}</>}
            </button>
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '10px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : g.status === 'done' ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {g.status === 'done' ? (won ? <>Filed clean on the first sheet.</> : <>Filed after {g.rejected} rejected sheet{g.rejected === 1 ? '' : 's'}.</>) : <>The sheet beat you. The correct filing is shown above.</>}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>{countdown ? <>A new sheet lands in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new sheet lands at midnight Eastern.'}
                    {prevPuzzle && <>{' '}Meanwhile: <a href={`/venn?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>yesterday&rsquo;s sheet &rarr;</a></>}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026','')} archive. <a href="/venn" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s sheet &rarr;</a>{' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a></>
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
              name="Venn"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              challengeMetric={g.status === 'done' ? g.rejected : null}
              title={won ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${g.rejected} rejected \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Venn all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Rejects"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/venn?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Venn', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/venn?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="venn" name="Venn" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="venn" name="Venn" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="venn" maxWidth={640} challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`} share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light boardSlot={<DailyBoardPanel self="venn" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />} divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Venn to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b> &mdash; the tile opens today&apos;s sheet, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s sheet, every day.</p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
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
        <DailyEndCard modal self="venn" won={won} completed={g.status === 'done'}
          headline={g.status === 'done' ? <>Every word filed</> : <>The sheet came back</>}
          subline={<>Venn #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {g.rejected} rejected sheet{g.rejected === 1 ? '' : 's'} &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'} onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
      )}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="vn-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Venn</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Venn is a free daily logic puzzle from Mind Loft. Three overlapping circles, each one a plain property of a word, and a tray of words that between them fill every region of the diagram, including the sliver in the middle where all three are true at once.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The counts are what turn sorting into deduction. Each region tells you how many words belong in it, so a word in the wrong place is never just a wrong answer, it is a number that refuses to add up. Work the shortfalls and the board corrects itself.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new sheet lands every day at midnight Eastern, and Sundays withhold two of the counts. More dailies: <a href="/axiom" style={{ color: INK, fontWeight: 800 }}>Axiom</a>, our hidden-rule puzzle, <a href="/bracket" style={{ color: INK, fontWeight: 800 }}>Bracket</a>, our results-table reconstruction, and <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, our four hidden threads.
        </p>
      </section>
      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const solvedBit = g.status === 'done'
      ? (won ? `\u{25CE} Filed clean in ${elapsed}` : `\u{25CE} Filed in ${elapsed} · ${g.rejected} rejected sheet${g.rejected === 1 ? '' : 's'}`)
      : g.status === 'lost' ? '\u{25CE} The sheet won' : '\u{25CE} Still filing…';
    const text = playing
      ? `Venn #${PUZZLE.num} — the daily three-circle sorting puzzle from Mind Loft.\n${withRef(`mindloftdaily.com/venn${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Venn — Sheet #${PUZZLE.num}\n${solvedBit}${streakBit}\n${withRef(`mindloftdaily.com/venn${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }
}
