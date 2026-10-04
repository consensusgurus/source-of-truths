'use client';

// Thread — nine films, each described in one sentence by someone who missed
// the point, and one hidden thread that ties all nine together.
//
// Type a title whenever you recognise one: any order, no penalty for a miss,
// the box matches on every keystroke and clears on a hit. Every film is a
// point. The tenth answer is the THREAD, what all nine share, and you can
// call it at any moment: six points with three or fewer tiles still open,
// four with up to six, two after that. Three wrong calls lock the thread at
// zero; the films still score. Part of the board is planted to read as a
// different thread, and a wrong call that names a planted one says how many
// tiles it really covers, which is information, so it is worth a strike.
//
// Sunday Edition: sixteen tiles and TWO threads of eight, interleaved. A
// call names either one; its eight light up when it lands. Bonus tiers scale
// with the board (six or fewer open, up to eleven, the rest).
//
// Score /15 on a weekday (9 films + 6), /28 on a Sunday (16 + 12). The board
// ranks on score, then `progress` (the tiles open when the thread was
// called, higher = earlier = better; summed over both calls on a Sunday),
// then the clock, through the existing comparator. First attempt stands.
//
// The server page ships only the picked day's tiles and threads (page.js),
// so tomorrow's answers never reach a browser.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone } from 'lucide-react';
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
import { norm, tileFor, threadFor, decoyFor } from './match';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#8b2c6b',        // Thread identity — a spool of plum
  accentSoft: '#f7e9f2', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_thread_help_seen';
const STATS_KEY = 'sot_thread_stats';

const MAX_CALLS = 3;        // wrong calls before the thread locks
const BONUS_TOP = 6;        // the thread bonus at the earliest tier

// The thread bonus for a call made with `open` tiles still unsolved on a
// board of `n` tiles: 6 / 4 / 2 by thirds of the board (0-3, 4-6, 7-9 on a
// weekday; 0-6, 7-11, 12-16 on a Sunday, the same thirds of sixteen).
function bonusFor(open, n) {
  const third = n / 3;
  if (open <= Math.floor(third)) return BONUS_TOP;
  if (open <= Math.floor(2 * third)) return 4;
  return 2;
}
const tierLabel = (n) => [`0–${Math.floor(n / 3)} open`, `${Math.floor(n / 3) + 1}–${Math.floor(2 * n / 3)} open`, `${Math.floor(2 * n / 3) + 1}–${n} open`];

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
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, perfect, cur, max };
}
// The total varies by day (15 weekday, 28 Sunday), so the cross-device
// merge reads it off the puzzle row rather than a constant.
function totalFor(p) { return (p.sunday ? 16 : 9) + BONUS_TOP * (p.sunday ? 2 : 1); }
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const tot = totalFor(p);
    const sc = Math.max(0, Math.min(tot, Math.round(((m.scorePct || 0) / 100) * tot)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: tot, won: sc >= tot - (p.sunday ? 16 : 9) + 1 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { wrong: [0, 26, 34, 26], hit: [12], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// solved: tile indices in solve order. calls: every thread call, { q, ok, open, th }. called: thread
// indices landed. locked: three wrong calls spent. gave: the player ended it.
const freshState = () => ({ v: 1, solved: [], calls: [], called: [], locked: false, gave: false, status: 'playing', t0: null, tEnd: null });

export default function ThreadClient({ puzzles = [], dayByNum = {}, forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const DAY = dayByNum[PUZZLE.num] || { tiles: [], threads: [], decoys: [] };
  const TILES = DAY.tiles || [];
  const THREADS = DAY.threads || [];
  const DECOYS = DAY.decoys || [];
  const N = TILES.length || (PUZZLE.sunday ? 16 : 9);
  const NTH = THREADS.length || (PUZZLE.sunday ? 2 : 1);
  const TOTAL = N + BONUS_TOP * NTH;
  const STORE_KEY = `sot_thread_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const [tq, setTq] = useState('');
  const [notice, setNotice] = useState(null);
  const [thrNote, setThrNote] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
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
  // DailyChrome; the fetch below stays for the cross-device stats merge.
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
  const noticeRef = useRef(null);
  const inputRef = useRef(null);
  const thrRef = useRef(null);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('thread');
  // A lost board keeps the films not named, the threads and the plants hidden
  // until the end card's Reveal tile; the finish beat would otherwise show them.
  const hideSol = LOFT && g.status === 'lost' && !revealed;
  const STAGE = isStage('thread', searchParams);
  const [stageTheme] = useStageTheme();
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('thread');
  const STAGE_ACC = { '--stg-acc-dk': gameColor('thread'), '--stg-acc-lt': gameColorLight('thread'), '--stg-onramp-lt': gameOnrampLight('thread'), '--stg-acc-ink-lt': gameAccentInkLight('thread') };
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

  const solvedSet = useMemo(() => new Set(g.solved), [g.solved]);
  const calledSet = useMemo(() => new Set(g.called), [g.called]);
  const openCount = N - g.solved.length;
  const wrongCalls = g.calls.filter((c) => !c.ok).length;
  const okCalls = g.calls.filter((c) => c.ok);
  const threadBonus = okCalls.reduce((s, c) => s + bonusFor(c.open, N), 0);
  const progressTerm = okCalls.reduce((s, c) => s + c.open, 0);
  const score = g.solved.length + threadBonus;
  const threadsDone = g.called.length === NTH || g.locked;
  const allCalled = g.called.length === NTH;
  const tier = bonusFor(openCount, N);
  const tierIdx = tier === BONUS_TOP ? 0 : tier === 4 ? 1 : 2;
  const tileOwner = useMemo(() => { const m = {}; THREADS.forEach((th, ti) => th.tiles.forEach((x) => { m[x] = ti; })); return m; }, [THREADS]);
  const planted = useMemo(() => { const s = new Set(); DECOYS.forEach((d) => d.cover.forEach((x) => s.add(x))); return s; }, [DECOYS]);

  useEffect(() => { gRef.current = g; }, [g]);

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
        if (saved && saved.v === 1 && Array.isArray(saved.solved)) {
          const next = { ...freshState(), ...saved };
          gRef.current = next;
          setG(next);
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
        if (done || g.t0) localStorage.setItem('sot_thread_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_thread_day');
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

  // The elapsed clock. It has to visibly tick while the board is live.
  useEffect(() => {
    if (!started || !playing) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [started, playing]);

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'thread', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'thread', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'thread', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'thread', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'thread', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // A started-and-left run files a row ONLY once the player has acted (a
  // tile solved or a call made): opening the page and leaving is not a start.
  const REC_KEY = `sot_thread_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    if (!cur.solved.length && !cur.calls.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const oks = cur.calls.filter((c) => c.ok);
    const sc = cur.solved.length + oks.reduce((s, c) => s + bonusFor(c.open, N), 0);
    return { quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: cur.solved.length, guessesUsed: cur.calls.filter((c) => !c.ok).length, progress: oks.reduce((s, c) => s + c.open, 0), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const oks = g2.calls.filter((c) => c.ok);
    const sc = g2.solved.length + oks.reduce((s, c) => s + bonusFor(c.open, N), 0);
    const prog = oks.reduce((s, c) => s + c.open, 0);
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: g2.status === 'won', at: prog })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: g2.solved.length, guessesUsed: g2.calls.filter((c) => !c.ok).length, progress: prog, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // "Replay": wipe the saved board and run today's board again as practice.
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState());
    setQ(''); setTq('');
    setNotice(null); setThrNote(null);
    setEndClosed(false);
    setRevealed(false);
  }

  function commit(next) { gRef.current = next; setG(next); }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    setNow(Date.now());
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 50);
  }

  function say(msg, kind) {
    setNotice({ msg, kind: kind || 'note' });
    if (noticeRef.current) clearTimeout(noticeRef.current);
    noticeRef.current = setTimeout(() => setNotice(null), 2600);
  }

  // The round ends on its own once every tile is named and every thread is
  // either called or locked. Won means every thread landed.
  function maybeFinish(next) {
    const done = next.solved.length === N && (next.called.length === NTH || next.locked);
    if (!done) return next;
    const fin = { ...next, status: next.called.length === NTH ? 'won' : 'lost', tEnd: Date.now() };
    vibrate(fin.status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(fin);
    return fin;
  }

  function onType(raw) {
    setQ(raw);
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const gn = norm(raw);
    if (!gn) return;
    const hit = tileFor(gn, TILES, new Set(cur.solved));
    if (hit < 0) return;
    const next = maybeFinish({ ...cur, solved: [...cur.solved, hit] });
    vibrate(HAPT.hit);
    setQ('');
    const left = N - next.solved.length;
    say(`${TILES[hit].t}. ${left === 0 ? 'Every film named.' : `${left} open.`}`, 'hit');
    commit(next);
  }

  function call() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.locked || cur.called.length === NTH) return;
    const gn = norm(tq);
    if (!gn) return;
    setTq('');
    const open = N - cur.solved.length;
    const hit = threadFor(gn, THREADS, new Set(cur.called));
    if (hit >= 0) {
      const b = bonusFor(open, N);
      const next = maybeFinish({ ...cur, calls: [...cur.calls, { q: tq.trim(), ok: true, open, th: hit }], called: [...cur.called, hit] });
      vibrate(HAPT.win);
      setThrNote({ kind: 'good', msg: `${THREADS[hit].t}. Called with ${open} open, +${b}.` });
      commit(next);
      setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 40);
      return;
    }
    const calls = [...cur.calls, { q: tq.trim(), ok: false, open }];
    const wrong = calls.filter((c) => !c.ok).length;
    const d = decoyFor(gn, DECOYS);
    let msg = d
      ? `“${d.n}” covers ${d.cover.length} of the ${N}. Not the thread.`
      : `“${tq.trim()}” is not the thread.`;
    let locked = cur.locked;
    if (wrong >= MAX_CALLS) { locked = true; msg += ` Three calls spent. The thread is locked at 0.`; }
    else msg += ` ${MAX_CALLS - wrong} call${MAX_CALLS - wrong === 1 ? '' : 's'} left.`;
    vibrate(HAPT.wrong);
    setThrNote({ kind: 'bad', msg });
    commit(maybeFinish({ ...cur, calls, locked }));
  }

  // Give up (thread still open: it locks at 0) or reveal the rest (every
  // thread already landed: the films you have not named are shown, the
  // score you have keeps). Both end the day.
  function giveUp() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const wonIt = cur.called.length === NTH;
    const fin = { ...cur, gave: true, locked: !wonIt, status: wonIt ? 'won' : 'lost', tEnd: Date.now() };
    postResult(fin);
    commit(fin);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/thread${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function threadBit() {
    if (!okCalls.length) return g.locked ? 'thread locked' : 'no thread';
    return NTH === 1 ? `thread at ${okCalls[0].open}` : `threads at ${okCalls.map((c) => c.open).join(' and ')}`;
  }
  function shareText() {
    // One logline travels, never a title and never the thread: the sentence is
    // the dare. The last film named is the one that took longest.
    const last = g.solved.length ? TILES[g.solved[g.solved.length - 1]] : TILES[0];
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Thread #${PUZZLE.num} · ${g.solved.length}/${N} · ${threadBit()} · ${score}/${TOTAL} · ${elapsed}${streakBit}`;
    return `${head}\n“${last ? last.s : ''}”\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Thread #${PUZZLE.num}: ${N} films described badly, one hidden thread. From Mind Loft.\n${shareUrl()}`
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
      lead={`${PUZZLE.sunday ? 'Sixteen' : 'Nine'} films, each described by someone who missed the point. ${PUZZLE.sunday ? 'Two hidden threads tie them together, eight each.' : 'One thing ties all nine together.'}`}
      banner={PUZZLE.sunday ? 'Sunday Edition · sixteen films, two threads' : null}
      steps={[
        <>Each tile is a <b>logline</b>: a true, useless description of a film. <b>Type a title</b> whenever you recognise one. Any order, no penalty for a wrong guess, and the box takes it the moment it matches. Every film named is a point.</>,
        <>The last answer is the <b>thread</b>: what all the films share. A director, an actor, a year, a city, a way of ending. Call it whenever you like. The earlier you call it right, the more it pays: <b>{BONUS_TOP} points</b> with {Math.floor(N / 3)} or fewer tiles still open, 4 with up to {Math.floor(2 * N / 3)}, 2 after that.</>,
        <>Three wrong calls and the thread <b>locks at zero</b>. The films still count. A wrong call that names something planted on the board tells you how many tiles it really covers.</>,
        <>Part of the board is planted to read as a <b>different</b> thread. That is the game. There are no hints: the sentence is all you get.</>,
      ]}
      knack="Do not solve the board and then look for the thread. Name two or three, ask what they share, and check the idea against the tiles you have not named. If the sentence for a film you do not know still fits your thread, you have it."
      footer="Ranks by score, then by how many tiles were still open when the thread was called (more open is the harder call), then the clock. First attempt stands."
    />
  );

  const cols = PUZZLE.sunday ? 4 : 3;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="thread" name="Thread" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="thread" quizId={PUZZLE.quizId}
          name="Thread"
          cat="Trivia"
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          progress={score / TOTAL}
          onHelp={() => setShowHelp(true)}
          figures={playing ? [
            { v: `${g.solved.length}/${N}`, k: 'films' },
            { v: okCalls.length ? (NTH === 1 ? `at ${okCalls[0].open}` : `${okCalls.length}/${NTH}`) : (g.locked ? 'locked' : '–'), k: 'thread' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: okCalls.length ? (NTH === 1 ? `at ${okCalls[0].open}` : `${okCalls.length}/${NTH}`) : (g.locked ? 'locked' : '–'), k: 'thread' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="th-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        {/* dangerouslySetInnerHTML, not a text child: Next escapes a quote in a
            text child to &#x27; and the CSS parser drops that declaration. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.th-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .th-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .th-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .th-btn:disabled{opacity:.45;cursor:default;}
          .th-inbar{position:sticky;top:0;z-index:6;background:${STAGE ? 'var(--stg-ground)' : T.surface};padding:6px 0 10px;display:flex;gap:8px;align-items:center;}
          .th-input{font-family:${SANS};font-weight:700;font-size:16px;width:100%;border:2px solid var(--stg-cell-line, rgba(28,30,36,0.4));border-radius:9px;padding:12px 13px;color:${INK};background:var(--stg-cell, ${T.white});outline:none;}
          .th-input:focus{border-color:var(--stg-acc, ${COLORS.accent});}
          .th-input.pop{animation:thpop .28s ease;}
          @keyframes thpop{0%{transform:scale(1)}40%{transform:scale(1.02)}100%{transform:scale(1)}}
          .th-grid{display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:9px;}
          @media(max-width:700px){.th-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
          .th-tile{position:relative;text-align:left;font-family:${SANS};background:var(--stg-cell, ${T.white});border:1px solid var(--stg-cell-line, rgba(28,30,36,0.35));border-radius:7px;padding:12px 13px 12px;min-height:${PUZZLE.sunday ? 96 : 110}px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;color:${INK};}
          .th-tile.on{background:var(--stg-acc-tint, ${COLORS.accentSoft});border-color:var(--stg-acc, ${COLORS.accent});}
          .th-tile.thr{box-shadow:inset 0 0 0 2px var(--stg-cool, #7dd3fc);}
          .th-tile.thr2{box-shadow:inset 0 0 0 2px var(--stg-warn, #b45309);}
          .th-tile.miss{border-color:var(--stg-bad, ${COLORS.rust});}
          .th-tile .n{font-family:${MONO};font-size:9px;letter-spacing:.14em;color:${FADED};display:flex;justify-content:space-between;}
          .th-tile p{margin:0;font-size:${PUZZLE.sunday ? 13.5 : 15}px;line-height:1.35;font-weight:600;text-wrap:balance;}
          .th-tile.on p{font-size:12.5px;font-weight:600;color:${STAGE ? 'var(--stg-ink2,#aab5c7)' : COLORS.faded};}
          .th-tile .a{display:none;font-size:${PUZZLE.sunday ? 15 : 17}px;font-weight:800;letter-spacing:-.01em;color:${INK};line-height:1.15;}
          .th-tile.on .a{display:block;}
          .th-tile.miss .a{display:block;color:var(--stg-bad, ${COLORS.rust});}
          .th-card{background:${SURF};border:1px solid ${SURF_B};border-radius:9px;padding:14px;}
          .th-card h3{margin:0 0 6px;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};font-weight:500;}
          .th-big{font-size:19px;font-weight:800;letter-spacing:-.01em;line-height:1.15;color:${INK};}
          .th-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;}
          .th-tiers div{border:1px solid ${SURF_B};border-radius:6px;padding:7px 6px;text-align:center;}
          .th-tiers div.on{border-color:var(--stg-acc, ${COLORS.accent});background:var(--stg-acc-tint, ${COLORS.accentSoft});}
          .th-tiers b{display:block;font-family:${MONO};font-size:15px;font-weight:500;color:${INK};}
          .th-tiers i{font-style:normal;font-size:9.5px;color:${FADED};letter-spacing:.05em;}
          .th-call{display:flex;gap:8px;margin-top:10px;}
          .th-call .th-input{font-size:15px;padding:10px 12px;min-width:0;}
          .th-calls{display:flex;gap:6px;margin-top:10px;align-items:center;}
          .th-calls span{width:10px;height:10px;border-radius:50%;border:1px solid var(--stg-line2, rgba(28,30,36,0.35));display:inline-block;}
          .th-calls span.x{background:var(--stg-bad, ${COLORS.rust});border-color:var(--stg-bad, ${COLORS.rust});}
          .th-calls span.ok{background:var(--stg-good, ${COLORS.green});border-color:var(--stg-good, ${COLORS.green});}
          .th-note{font-size:12.5px;font-weight:700;color:${STAGE ? 'var(--stg-ink2,#aab5c7)' : COLORS.faded};margin-top:8px;min-height:18px;}
          .th-note.bad{color:var(--stg-bad, ${COLORS.rust});}
          .th-note.good{color:var(--stg-good, ${COLORS.green});}
          .th-cta{font-family:${SANS};background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, ${T.white});border:0;border-radius:7px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;}
          .th-cta:disabled{opacity:.45;cursor:default;}
          .th-side{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;}
          @media(max-width:700px){.th-side{grid-template-columns:1fr;}}
        ` }} />

        <div style={{ maxWidth: PUZZLE.sunday ? 1040 : 880, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="thread" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          blocks={'THREAD'.split('').map((ch, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ maxWidth: 640, margin: '0 auto', background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Thread is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{PUZZLE.sunday ? 'Sixteen films described badly, two hidden threads.' : 'Nine films described badly, one hidden thread.'} Name the films, call the thread, and call it early if you dare. The clock starts when you do.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="th-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px', borderColor: 'transparent' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 'none' : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>films <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{g.solved.length}/{N}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>score <b style={{ color: INK, fontWeight: 500 }}>{score}/{TOTAL}</b></span>
          </div>
          )}

          {playing && (
            <div className="th-inbar">
              <input
                ref={inputRef}
                className={`th-input${notice && notice.kind === 'hit' ? ' pop' : ''}`}
                value={q}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setQ(''); }}
                placeholder={g.solved.length === N ? 'Every film named. Call the thread.' : 'Type a film title…'}
                autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false}
                aria-label="Type a film title"
                disabled={g.solved.length === N}
              />
              <span style={{ fontFamily: MONO, fontSize: 11, color: notice && notice.kind === 'hit' ? `var(--stg-acc-ink, ${COLORS.accent})` : FADED, whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>
                {notice ? notice.msg : `${openCount} open`}
              </span>
            </div>
          )}

          <div className="th-grid" role="list">
            {TILES.map((t, i) => {
              const on = solvedSet.has(i);
              const owner = tileOwner[i];
              const thrClass = NTH > 1 && calledSet.has(owner) ? (owner === 0 ? ' thr' : ' thr2') : '';
              const missed = !playing && !on;
              return (
                <div key={i} role="listitem" className={`th-tile${on ? ' on' : ''}${missed ? ' miss' : ''}${thrClass}`}
                  aria-label={on ? `${t.t}, named` : `Tile ${i + 1}. ${t.s}`}>
                  <div className="n"><span>{String(i + 1).padStart(2, '0')}</span>{!playing && !hideSol && planted.has(i) && <span style={{ color: 'var(--stg-warn, #b45309)' }}>PLANTED</span>}{!playing && !hideSol && NTH > 1 && <span>{THREADS[owner] ? THREADS[owner].t : ''}</span>}</div>
                  <p>{t.s}</p>
                  {(on || !hideSol) && <div className="a">{t.t}</div>}
                </div>
              );
            })}
          </div>

          <div className="th-side">
            <div className="th-card">
              <h3>{NTH === 1 ? 'The thread' : `The threads · ${g.called.length} of ${NTH} called`}</h3>
              <div className="th-big" style={{ color: okCalls.length && NTH === 1 ? ACC : INK }}>
                {NTH === 1
                  ? (okCalls.length ? THREADS[okCalls[0].th].t : g.locked ? (playing || hideSol ? 'Locked at 0' : THREADS[0].t) : `What do all ${N} share?`)
                  : (THREADS.map((th, ti) => calledSet.has(ti) ? th.t : (playing || hideSol ? '?' : th.t)).join(' · '))}
              </div>
              {playing && !threadsDone && (
                <>
                  <div className="th-tiers">
                    {[BONUS_TOP, 4, 2].map((b, i) => (
                      <div key={b} className={i === tierIdx ? 'on' : ''}><b>+{b}</b><i>{tierLabel(N)[i]}</i></div>
                    ))}
                  </div>
                  <div className="th-call">
                    <input ref={thrRef} className="th-input" value={tq} onChange={(e) => setTq(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); call(); } }}
                      placeholder={NTH === 1 ? 'Call the thread…' : 'Call a thread…'} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Call the thread" />
                    <button type="button" className="th-cta" onClick={call} disabled={!norm(tq)}>Call</button>
                  </div>
                </>
              )}
              <div className="th-calls" aria-label={`${wrongCalls} wrong calls of ${MAX_CALLS}`}>
                {Array.from({ length: MAX_CALLS }, (_, i) => <span key={i} className={i < wrongCalls ? 'x' : ''} />)}
                {okCalls.map((c, i) => <span key={`ok${i}`} className="ok" />)}
                <span style={{ width: 'auto', height: 'auto', border: 0, borderRadius: 0, fontFamily: MONO, fontSize: 10.5, color: FADED, marginLeft: 4 }}>{playing ? `${MAX_CALLS - wrongCalls} wrong call${MAX_CALLS - wrongCalls === 1 ? '' : 's'} left` : ''}</span>
              </div>
              <div className={`th-note${thrNote ? ' ' + thrNote.kind : ''}`}>
                {thrNote ? thrNote.msg : (playing ? 'Calling early is the flex. Three wrong calls lock it.' : '')}
              </div>
            </div>
            <div className="th-card">
              <h3>Score</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                <div><div style={{ fontFamily: MONO, fontSize: 22, color: INK }}>{g.solved.length}</div><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: FADED }}>films</div></div>
                <div><div style={{ fontFamily: MONO, fontSize: 22, color: INK }}>+{threadBonus}</div><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: FADED }}>thread</div></div>
                <div><div style={{ fontFamily: MONO, fontSize: 22, color: ACC_INK }}>{score}<span style={{ fontSize: 13, color: FADED }}>/{TOTAL}</span></div><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: FADED }}>total</div></div>
              </div>
              {playing && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="th-btn" onClick={giveUp} style={{ fontSize: 12.5, padding: '7px 12px' }}>{allCalled ? 'Reveal the rest' : 'Give up'}</button>
                </div>
              )}
              {!playing && (
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: won ? `var(--stg-good, ${COLORS.green})` : `var(--stg-ink, ${COLORS.rust})` }}>
                  {won ? `${threadBit().replace(/^t/, 'T')}. ${score} of ${TOTAL} in ${elapsed}.` : (g.locked && !okCalls.length && !hideSol ? `The thread was ${THREADS.map((t) => t.t).join(' and ')}. ${score} of ${TOTAL}.` : `${score} of ${TOTAL}.`)}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                {won ? <>The thread was <span style={{ color: ACC_INK }}>{THREADS.map((t) => t.t).join(' and ')}</span>.</> : hideSol ? <>The thread got away.</> : <>The thread was {THREADS.map((t) => t.t).join(' and ')}.</>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {DECOYS.length && !hideSol ? `Planted to read as ${DECOYS.map((d) => `${d.n.toLowerCase()} (${d.cover.length})`).join(', ')}.` : ''}
                {' '}{won
                  ? (okCalls.every((c) => c.open >= Math.floor(N / 3) + 1) ? 'Called it from the sentences, not the titles. That is the whole game.' : 'Landed. Tomorrow, try calling it with more tiles open.')
                  : 'The thread got away. Tomorrow starts from nine new sentences.'}
              </div>
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Thread in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/thread?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>try yesterday&rsquo;s board &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/thread" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Thread &rarr;</a>
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
              name="Thread"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${g.solved.length}/${N} films · ${threadBit()} · ${score}/${TOTAL} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Thread all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Wrong calls"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/thread?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'One logline, never the thread', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal the answers',
                  sub: won ? 'Every title and the planted tiles' : 'The films and the thread', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Thread', sub: `No. ${prevPuzzle.num}, yesterday’s board`, href: `/thread?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This board again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self="thread" name="Thread" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="thread" name="Thread" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="thread" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="thread" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Thread to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.</p>
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
        <DailyEndCard modal self="thread" won={won}
          headline={won ? <>Thread found.</> : <>The thread got away.</>}
          subline={<>{g.solved.length}/{N} films &middot; {threadBit()} &middot; {score}/{TOTAL} &middot; {elapsed}</>}
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
            <button className="th-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Thread</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Thread is a free daily movie puzzle from Mind Loft. Nine films are each described in one sentence by someone who technically watched them and missed the point entirely, and all nine share one hidden thread: a director, an actor, a year, a city, a way of ending. Name the films, in any order and at no cost for a wrong guess, then call the thread. The earlier you call it right, the more it pays, and three wrong calls lock it at zero.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Part of every board is planted to read as a different thread, so the expert plays it as a deduction game on two or three tiles and a hunch, and the casual player plays it as nine riddles with a reveal at the end. Both finish with a number out of fifteen. Sundays run sixteen films and two threads. Everyone gets the same board, so the daily leaderboard ranks by score, then by how early the thread was called, then time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More trivia dailies: <a href="/script" style={{ color: INK, fontWeight: 800 }}>Script</a>, our film and television gauntlet, <a href="/focus" style={{ color: INK, fontWeight: 800 }}>Focus</a>, our zoomed-photo daily, and <a href="/niche" style={{ color: INK, fontWeight: 800 }}>Niche</a>, our daily trivia grid.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
