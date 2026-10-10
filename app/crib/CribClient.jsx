'use client';

// Crib — the daily cribbage throw.
//
// Five six-card hands (seven on Sundays). For each, the player throws two cards
// to the crib and keeps four. The crib alternates, yours first. Every throw is
// valued exactly in the bank (lib/crib-core.js, checked by
// scripts/verify-crib.mjs): the four kept cards averaged over all 46 cut cards,
// plus the crib's average when the crib is yours, minus it when it is theirs.
//
// Two points for the best throw, one for a throw within 0.75 of it, none
// otherwise. Nothing counts against you and the clock breaks ties, so the
// registry row carries miss: null. A finished hand shows its numbers, so this
// is a first-attempt daily like any other: the bank's values ARE the answer.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Smartphone, ArrowRight } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold, { HOLD_SHORT } from '../useEndHold';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
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
import DailyRules from '../DailyRules';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { THROWS, NEAR, RANKS, SUITS, SUIT_NAMES, rankOf, suitOf, cardName, cutFor, scoreHand, scoreParts } from '@/lib/crib-core';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#a16207',
  accentSoft: '#fbf3dd',
  green: T.successDeep,
};
// A card face is paper in both registers, so its ink is a literal pair.
const FACE = '#ffffff';
const FACE_INK = '#16181d';
const FACE_RED = '#b91c1c';
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_crib_help_seen';
const STATS_KEY = 'sot_crib_stats';
const PART_NAMES = { fifteens: 'fifteens', pairs: 'pairs', runs: 'runs', flush: 'flush', nobs: 'nobs' };

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
    return next.getTime() - et.getTime();
  } catch (e) {
    const n = new Date();
    const nx = new Date(n);
    nx.setHours(24, 0, 0, 0);
    return nx.getTime() - n.getTime();
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
const fmtV = (v) => (v >= 0 ? v.toFixed(2) : `−${(-v).toFixed(2)}`);
const fmtSigned = (v) => (v >= 0 ? `+${v.toFixed(2)}` : `−${(-v).toFixed(2)}`);
// Points a throw earns, off the bank's own values.
function pointsFor(hand, t) {
  const d = hand.value[hand.best] - hand.value[t];
  if (d < 1e-9) return 2;
  if (d <= NEAR + 1e-9) return 1;
  return 0;
}
// THROWS is keyed by index pair; find the throw for a selection.
function throwOf(sel) {
  if (sel.length !== 2) return -1;
  const [a, b] = sel[0] < sel[1] ? sel : [sel[1], sel[0]];
  return THROWS.findIndex(([i, j]) => i === a && j === b);
}

const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { v: 1, rec: {} };
    const s = JSON.parse(raw);
    return s && s.v === 1 && s.rec ? s : { v: 1, rec: {} };
  } catch (e) { return { v: 1, rec: {} }; }
}
function recordStat(num, entry) {
  const s = getStats();
  if (s.rec[num]) return s;
  s.rec[num] = entry;
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function deriveStats(s, todayNum) {
  const rec = (s && s.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) { if (rec[n]) cur++; else break; }
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev !== null && n === prev + 1 ? run + 1 : 1; prev = n; if (run > max) max = run; }
  return { played: nums.length, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!Array.isArray(recent) || !recent.length) return s;
  const byId = new Map(puzzles.map((p) => [p.quizId, p]));
  let touched = false;
  for (const m of recent) {
    if (!m || m.attempt !== 1) continue;
    const p = byId.get(m.quizId);
    if (!p || s.rec[p.num]) continue;
    const total = 2 * p.hands.length;
    const score = typeof m.scorePct === 'number' ? Math.round((m.scorePct / 100) * total) : 0;
    s.rec[p.num] = { s: score, t: total, won: score >= total };
    touched = true;
  }
  if (touched) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {} }
  return s;
}

const HAPT = { ok: [7], best: [6, 18, 6], miss: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

function freshState() {
  // picks: the throw id chosen on each answered hand, in order.
  // shown: the answered hand whose reveal is on screen, or null.
  return { v: 1, picks: [], sel: [], shown: null, hintHand: null, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

function Card({ c, size = 'md', selected = false, dim = false, ring = false, onClick }) {
  const red = suitOf(c) === 1 || suitOf(c) === 2;
  const w = size === 'sm' ? 30 : 58;
  const h = size === 'sm' ? 42 : 84;
  return (
    <button
      type="button"
      className={`cb-card${selected ? ' sel' : ''}${onClick ? ' live' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${RANKS[rankOf(c)] === '10' ? '10' : RANKS[rankOf(c)]} of ${SUIT_NAMES[suitOf(c)]}${selected ? ', selected to throw' : ''}`}
      style={{
        width: w, height: h, borderRadius: size === 'sm' ? 5 : 8, background: FACE, color: red ? FACE_RED : FACE_INK,
        border: `2px solid ${selected ? 'var(--stg-acc, #a16207)' : 'rgba(22,24,29,0.28)'}`,
        boxShadow: ring ? '0 0 0 3px var(--stg-ink, #b45309)' : (selected ? '0 6px 14px rgba(0,0,0,0.28)' : '0 1px 2px rgba(0,0,0,0.25)'),
        opacity: dim ? 0.45 : 1, padding: 0, position: 'relative', fontFamily: SANS, cursor: onClick ? 'pointer' : 'default',
        transform: selected ? 'translateY(-10px)' : 'none', transition: 'transform .14s ease, box-shadow .14s ease', flex: '0 0 auto',
      }}
    >
      <span style={{ position: 'absolute', top: size === 'sm' ? 2 : 5, left: size === 'sm' ? 3 : 6, fontWeight: 800, fontSize: size === 'sm' ? 11 : 16, lineHeight: 1 }}>{RANKS[rankOf(c)]}</span>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size === 'sm' ? 15 : 28, lineHeight: 1, paddingTop: size === 'sm' ? 8 : 10 }}>{SUITS[suitOf(c)]}</span>
    </button>
  );
}

export default function CribClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_crib_${PUZZLE.num}`;
  const HANDS = PUZZLE.hands;
  const NH = HANDS.length;
  const TOTAL = 2 * NH;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const endHold = useEndHold(1100);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('crib', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('crib'); }, [g.hintUsed]);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const lastTap = useRef(0);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('crib');
  const STAGE = isStage('crib', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('crib');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('crib'), '--stg-acc-lt': gameColorLight('crib'), '--stg-onramp-lt': gameOnrampLight('crib'), '--stg-acc-ink-lt': gameAccentInkLight('crib') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF2 = STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : COLORS.accentSoft;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const GOOD = 'var(--stg-good, #15803d)';
  const WARN = 'var(--stg-warn, #b45309)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;

  const earned = g.picks.map((t, i) => pointsFor(HANDS[i], t));
  const score = earned.reduce((a, b) => a + b, 0);
  const bests = earned.filter((x) => x === 2).length;
  const won = !playing && g.status === 'done' && score === TOTAL;
  const finished = g.status === 'done';
  const current = g.shown !== null ? g.shown : g.picks.length;   // the hand on screen
  const answering = g.shown === null && g.picks.length < NH;

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  useEffect(() => {
    if (g.status === 'playing') return undefined;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length <= NH) {
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
        if (done || g.t0) localStorage.setItem('sot_crib_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_crib_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sot_quiz_identity');
      const id = raw ? JSON.parse(raw) : null;
      if (id && (id.email || id.username)) setIdentity(id);
      const qs = new URLSearchParams();
      const anon = getAnonId();
      if (anon) qs.set('anonId', anon);
      if (id && id.email) qs.set('email', id.email);
      qs.set('history', '1');
      meRequest(`/api/quiz/me?${qs.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          if (d && Array.isArray(d.recent)) {
            try { setStats(mergeServerStats(getStats(), d.recent, puzzles)); } catch (e) {}
          }
        })
        .catch(() => {});
    } catch (e) {}
    try {
      fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`)
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
    if (!viewedRef.current) {
      viewedRef.current = true;
      try {
        fetch('/api/quiz/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId: PUZZLE.quizId }),
        }).catch(() => {});
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setInstallEvt(e); };
    try { window.addEventListener('beforeinstallprompt', onPrompt); } catch (e) {}
    try {
      const sa = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
      setStandalone(!!sa);
      setMobileUi(isMobileDevice());
    } catch (e) {}
    return () => { try { window.removeEventListener('beforeinstallprompt', onPrompt); } catch (e) {} };
  }, []);

  // Phone layout (<=640px) for the peg board and the felt, decided by width
  // rather than device so a narrow desktop window gets the phone stack too.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const fit = () => { try { setNarrow(window.innerWidth <= 640); } catch (e) {} };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const myStats = useMemo(() => deriveStats(stats, PUZZLE.num), [stats, PUZZLE.num]);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'crib', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'crib', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'crib', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'crib', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'crib', active: LOFT && !playing });

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }
  function commit(next) { gRef.current = next; setG(next); }
  const scoreOf = (picks) => picks.reduce((a, t, i) => a + pointsFor(HANDS[i], t), 0);

  const REC_KEY = `sot_crib_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.picks.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const sc = scoreOf(cur.picks);
    return { quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: cur.picks.filter((t, i) => pointsFor(HANDS[i], t) === 2).length, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const sc = scoreOf(g2.picks);
    const correct = g2.picks.filter((t, i) => pointsFor(HANDS[i], t) === 2).length;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: sc >= TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    commit({ ...gRef.current, t0: Date.now() });
  }

  function tapCard(k) {
    const cur = gRef.current;
    if (!started || cur.shown !== null || cur.picks.length >= NH) return;
    let sel = cur.sel.slice();
    if (sel.includes(k)) sel = sel.filter((x) => x !== k);
    else { sel.push(k); if (sel.length > 2) sel = sel.slice(-2); }
    vibrate(HAPT.ok);
    commit({ ...cur, sel });
  }

  function throwIt() {
    const cur = gRef.current;
    const now = Date.now();
    if (now - lastTap.current < ARM_MIN_MS) return;
    lastTap.current = now;
    if (cur.shown !== null || cur.picks.length >= NH) return;
    const t = throwOf(cur.sel);
    if (t < 0) { say('Pick two cards to throw.'); return; }
    const hi = cur.picks.length;
    const pts = pointsFor(HANDS[hi], t);
    vibrate(pts === 2 ? HAPT.best : pts === 1 ? HAPT.ok : HAPT.miss);
    commit({ ...cur, picks: cur.picks.concat([t]), sel: [], shown: hi });
  }

  function nextHand() {
    const cur = gRef.current;
    const now = Date.now();
    if (now - lastTap.current < ARM_MIN_MS) return;
    lastTap.current = now;
    if (cur.shown === null) return;
    if (cur.picks.length >= NH) {
      const done = { ...cur, shown: null, status: 'done', tEnd: Date.now() };
      vibrate(scoreOf(done.picks) === TOTAL ? HAPT.win : HAPT.ok);
      postResult(done);
      endHold.hold(HOLD_SHORT);
      commit(done);
      return;
    }
    commit({ ...cur, shown: null, sel: [] });
  }

  function useHint() {
    const cur = gRef.current;
    if (!hintOk || cur.hintUsed || cur.shown !== null) return;
    commit({ ...cur, hintUsed: true, hintHand: cur.picks.length });
    say('The ringed card belongs in the best throw.');
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit({ ...freshState(), t0: Date.now() });
    setEndClosed(false);
    setRevealed(false);
  }

  async function a2hsClick() {
    if (installEvt) {
      try { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); return; } catch (e) {}
    }
    setShowA2hsHelp(true);
  }

  function shareUrl() {
    return withRef(`mindloftdaily.com/crib${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const row = earned.map((x) => (x === 2 ? '\u{1F7E9}' : x === 1 ? '\u{1F7E8}' : '⬜')).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    return `Crib #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${score}/${TOTAL} · ${elapsed}${g.hintUsed ? ' · \u{1F4A1}' : ''}${streakBit}\n${row}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Crib #${PUZZLE.num}, the daily cribbage throw from Mind Loft.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Cribbage, one decision at a time. You are dealt six cards, keep four, and throw two to the crib, which is a second hand scored by whoever owns it."
      banner={<>{NH} hands today. The crib alternates, <b>yours</b> first, then <b>your opponent&rsquo;s</b>.</>}
      steps={[
        <><b>Tap two cards</b> to throw them, then press Throw. The other four are your hand.</>,
        <>A throw is worth what your four cards <b>average</b> over all 46 possible cut cards, <b>plus</b> the crib&rsquo;s average when the crib is yours, <b>minus</b> it when the crib is theirs.</>,
        <>The crib&rsquo;s average runs over every cut card and every pair of cards your opponent might throw, so the best throw is a worked-out fact.</>,
        <><b>2 points</b> for the best throw, <b>1</b> for one within 0.75 of it, none otherwise. After each hand you see every throw&rsquo;s value.</>,
        <>Hands score fifteens (2 each), pairs (2), runs (1 a card), a flush (4, or 5 with the cut; the crib needs all 5), and his nobs (the jack of the cut suit, 1).</>,
        <>One free <b>hint</b>, on your first ever play, rings one card of the best throw.</>,
      ]}
      knack="Throw fives and pairs into your own crib and keep them out of your opponent's. The best four cards to keep are often not the best throw: a card that helps the crib is worth something only when the crib is yours."
      footer={`Score out of ${TOTAL}. Nothing counts against you, and ties break on the clock. Sundays deal seven hands.`}
    />
  );

  // ── the hand on screen ───────────────────────────────────────────────────
  const hand = HANDS[Math.min(current, NH - 1)];
  const pickT = g.shown !== null ? g.picks[g.shown] : -1;
  const hintCard = g.hintUsed && g.hintHand === current && g.shown === null ? THROWS[hand.best][0] : -1;
  const reveal = g.shown !== null ? (() => {
    const order = hand.value.map((_, i) => i).sort((a, b) => hand.value[b] - hand.value[a]);
    const rows = order.slice(0, 5);
    if (!rows.includes(pickT)) rows.push(pickT);
    const bestT = hand.best;
    const keepBest = hand.cards.filter((_, k) => !THROWS[bestT].includes(k));
    const cut = cutFor(hand.cards, PUZZLE.quizId);
    const keepMine = hand.cards.filter((_, k) => !THROWS[pickT].includes(k));
    return { rows, bestT, keepBest, cut, keepMine, pts: pointsFor(hand, pickT), gap: hand.value[bestT] - hand.value[pickT] };
  })() : null;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="crib" name="Crib" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="crib" quizId={PUZZLE.quizId}
          name="Crib"
          cat="Cards"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 7 hands' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: `${Math.min(g.picks.length + (answering ? 1 : 0), NH)}/${NH}`, k: 'hand' },
            { v: `${score}/${TOTAL}`, k: 'points' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: `${bests}/${NH}`, k: 'best throws' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="cb-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.cb-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .cb-btn{font-family:${SANS};font-weight:800;font-size:14px;border:${STAGE ? '1.5px solid var(--stg-cell-line)' : `2px solid ${COLORS.accent}`};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accent};border-radius:${STAGE ? 12 : 8}px;padding:9px 16px;min-height:48px;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;}
          .cb-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .cb-btn:disabled{opacity:.45;cursor:default;}
          .cb-tool{font-family:${SANS};font-weight:700;font-size:14px;border:1.5px solid ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${INK};border-radius:12px;padding:0 16px;min-height:48px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;}
          .cb-card{-webkit-tap-highlight-color:transparent;}
          .cb-card.live:hover{transform:translateY(-4px);}
          .cb-card.live.sel:hover{transform:translateY(-10px);}
          .cb-tab{width:100%;border-collapse:collapse;font-size:12.5px;}
          .cb-tab td,.cb-tab th{padding:5px 6px;text-align:right;border-bottom:1px solid ${SURF_B};white-space:nowrap;}
          .cb-tab td:first-child,.cb-tab th:first-child{text-align:left;}
          .cb-tab th{font-family:${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:500;color:${FADED};}
          .cb-fade{animation:cbfade .25s ease;}
          @keyframes cbfade{0%{opacity:0;transform:translateY(6px);}100%{opacity:1;transform:none;}}
          @media (prefers-reduced-motion: reduce){.cb-fade{animation:none;}.cb-card{transition:none !important;}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Crib is dealt'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>{NH} hands of six. For each, throw two cards to the crib and keep four. The crib alternates, yours first. Two points for the best throw, one for a close one.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="cb-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, borderColor: STAGE ? STAGE_C : T.cta, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!preStart && (() => {
            // ---- the peg board and the felt (round three, 2026-10-10) ----
            // Every readout is state the old board already printed: the points
            // per answered hand (the pips), whose crib each hand is (the rules
            // say it alternates, yours first), the running score and the
            // selection. The pegs are only the score drawn as cribbage draws it.
            const A_FILL = STAGE ? 'var(--stg-acc)' : COLORS.accent;
            const ON_A = STAGE ? 'var(--stg-onramp)' : '#ffffff';
            const CELL = STAGE ? 'var(--stg-cell)' : '#ffffff';
            const CELL_LINE = STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.35)';
            const GROUND = STAGE ? 'var(--stg-ground)' : T.surface;
            const BAD = 'var(--stg-bad, #b91c1c)';
            const FELT = STAGE ? 'color-mix(in srgb, var(--stg-acc) 9%, var(--stg-cell))' : COLORS.accentSoft;
            const BACK = STAGE ? 'color-mix(in srgb, var(--stg-acc) 30%, var(--stg-cell))' : '#e9d9a8';
            const K = { fontFamily: SANS, fontSize: narrow ? 10 : 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: FADED };
            const short = (c) => `${RANKS[rankOf(c)]}${SUITS[suitOf(c)]}`;

            // The board: a start hole, then two holes a hand. The front peg
            // stands on your total, the back peg where it stood a hand ago.
            const front = score;
            const back = g.picks.length ? scoreOf(g.picks.slice(0, -1)) : 0;
            const hs = narrow ? 11 : 14;
            const hole = (n) => {
              if (n === front && front > 0) return <span key={n} style={{ width: narrow ? 17 : 22, height: narrow ? 17 : 22, borderRadius: '50%', boxSizing: 'border-box', background: A_FILL, border: `3px solid ${CELL}`, boxShadow: `0 0 0 2px ${A_FILL}` }} />;
              if (n === back && back > 0) return <span key={n} style={{ width: narrow ? 16 : 20, height: narrow ? 16 : 20, borderRadius: '50%', boxSizing: 'border-box', background: CELL, border: `${narrow ? 3 : 4}px solid ${A_FILL}` }} />;
              const passed = n < front;
              return <span key={n} style={{ width: hs, height: hs, borderRadius: '50%', boxSizing: 'border-box', background: passed ? BACK : GROUND, border: `2px solid ${CELL_LINE}` }} />;
            };
            const segRes = (i) => {
              if (i < g.picks.length) {
                const p = earned[i];
                return p === 2 ? { t: narrow && NH > 5 ? '+2' : 'Best +2', c: GOOD } : p === 1 ? { t: narrow && NH > 5 ? '+1' : 'Close +1', c: WARN } : { t: narrow && NH > 5 ? '+0' : 'Miss +0', c: BAD };
              }
              if (playing && i === current) return { t: 'Now', c: ACC_INK };
              return { t: narrow ? `Hand ${i + 1}` : 'To come', c: FADED };
            };
            const pegBoard = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? 7 : 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={K}>{narrow ? 'Peg board · one hole a point' : 'The peg board · 2 points for the best throw, 1 for a close one'}</span>
                  {narrow
                    ? <span style={K}>{playing ? <>Hand <b style={{ color: ACC_INK }}>{Math.min(current + 1, NH)}</b> of {NH}</> : <>{NH} hands</>}</span>
                    : <span style={K}>Front peg <b style={{ color: ACC_INK }}>{front}</b> · Back peg <b style={{ color: INK }}>{back}</b></span>}
                </div>
                <div role="img" aria-label={`Peg board: ${score} of ${TOTAL} points after ${g.picks.length} of ${NH} hands`}
                  style={{ background: STAGE ? 'var(--stg-surf)' : T.white, border: STAGE ? undefined : '1px solid rgba(28,30,36,0.14)', borderRadius: narrow ? 14 : 18, padding: narrow ? '10px 8px 8px' : '16px 16px 14px', display: 'flex', alignItems: 'flex-start', gap: narrow ? 5 : 8 }}>
                  <div style={{ width: narrow ? 18 : 44, flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: narrow ? 28 : 34, display: 'flex', alignItems: 'center' }}>{hole(0)}</div>
                    {!narrow && <span style={{ ...K, fontSize: 10 }}>Start</span>}
                  </div>
                  {HANDS.map((h, i) => {
                    const r = segRes(i);
                    const on = playing && i === current;
                    return (
                      <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: narrow ? 5 : 8 }}>
                        <div style={{ width: '100%', height: narrow ? 28 : 34, boxSizing: 'border-box', borderRadius: 17, background: GROUND, border: `1.5px solid ${on ? A_FILL : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                          {hole(2 * i + 1)}{hole(2 * i + 2)}
                        </div>
                        {narrow ? (
                          <>
                            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: r.c, whiteSpace: 'nowrap' }}>{r.t}</span>
                            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, color: FADED }}>{h.yours ? 'yours' : 'theirs'}</span>
                          </>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 800, color: on ? ACC_INK : (i < g.picks.length ? INK : FADED) }}>Hand {i + 1}</span>
                            <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: FADED }}>{h.yours ? 'your crib' : 'their crib'}</span>
                            <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: r.c, whiteSpace: 'nowrap' }}>{r.t}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!narrow && (
                  <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED }}>One hole a point. The front peg marks your total; the back peg, where it stood before your last hand.</span>
                )}
              </div>
            );

            // The six cards, fanned. The cards are paper in both registers.
            const FW = narrow ? 72 : 96;
            const FH = narrow ? 106 : 138;
            const SPREAD = narrow ? 49 : 74;
            const LIFT = narrow ? 26 : 34;
            const nC = hand.cards.length;
            const thrownKs = g.shown !== null ? THROWS[pickT] : g.sel;
            const fan = (
              <div className="cb-fan" key={`h${current}`} style={{ position: 'relative', height: narrow ? 214 : 230, marginTop: narrow ? 14 : 6 }}>
                {hand.cards.map((c, k) => {
                  const d = k - (nC - 1) / 2;
                  const thrownNow = g.shown !== null && THROWS[pickT].includes(k);
                  const isSel = g.shown === null ? g.sel.includes(k) : thrownNow;
                  const dim = g.shown !== null && !thrownNow;
                  const ring = k === hintCard;
                  const red = suitOf(c) === 1 || suitOf(c) === 2;
                  const live = g.shown === null && started;
                  const shadow = [
                    isSel ? `0 0 0 3px ${FELT}, 0 0 0 5px ${A_FILL}` : null,
                    ring ? `0 0 0 ${isSel ? 8 : 3}px var(--stg-ink, #b45309)` : null,
                    isSel ? '0 14px 22px rgba(0,0,0,.35)' : '0 4px 10px rgba(0,0,0,.28)',
                  ].filter(Boolean).join(', ');
                  return (
                    <button key={c} type="button" className={`cb-card${isSel ? ' sel' : ''}${live ? ' live' : ''}`}
                      onClick={live ? () => tapCard(k) : undefined}
                      disabled={!live}
                      aria-label={`${RANKS[rankOf(c)]} of ${SUIT_NAMES[suitOf(c)]}${isSel ? (g.shown === null ? ', selected to throw' : ', thrown') : ''}${ring ? ', hinted' : ''}`}
                      aria-pressed={g.shown === null ? isSel : undefined}
                      style={{
                        position: 'absolute', left: `calc(50% - ${FW / 2}px + ${d * SPREAD}px)`,
                        top: (narrow ? 60 : 50) + d * d * (narrow ? 3 : 4) - (isSel ? LIFT : 0),
                        width: FW, height: FH, boxSizing: 'border-box', borderRadius: narrow ? 8 : 10, background: FACE,
                        border: isSel ? `3px solid ${A_FILL}` : `1.5px solid ${CELL_LINE}`, boxShadow: shadow,
                        transform: `rotate(${d * (narrow ? 6 : 5)}deg)`, transformOrigin: '50% 100%',
                        padding: 0, color: red ? FACE_RED : FACE_INK, fontFamily: SANS, cursor: live ? 'pointer' : 'default',
                        opacity: dim ? 0.45 : 1, transition: 'top .14s ease, box-shadow .14s ease',
                      }}>
                      <span style={{ position: 'absolute', top: narrow ? 6 : 8, left: narrow ? 7 : 10, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                        <b style={{ fontSize: narrow ? 17 : 21, fontWeight: 800 }}>{RANKS[rankOf(c)]}</b>
                        <span style={{ fontSize: narrow ? 13 : 17 }}>{SUITS[suitOf(c)]}</span>
                      </span>
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: narrow ? 34 : 44, paddingTop: 12, lineHeight: 1 }}>{SUITS[suitOf(c)]}</span>
                      {!narrow && <span style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 21, fontWeight: 800, lineHeight: 1, transform: 'rotate(180deg)' }}>{RANKS[rankOf(c)]}</span>}
                    </button>
                  );
                })}
              </div>
            );

            // The crib: their two face down (never seen), your two as you lift them.
            const SW = narrow ? 34 : 46;
            const SH = narrow ? 48 : 66;
            const backCard = (i) => <span key={`b${i}`} aria-hidden="true" style={{ width: SW, height: SH, boxSizing: 'border-box', borderRadius: narrow ? 5 : 6, border: `2px solid ${A_FILL}`, background: `repeating-linear-gradient(45deg, ${BACK} 0 ${narrow ? 4 : 5}px, ${A_FILL} ${narrow ? 4 : 5}px ${narrow ? 6 : 7}px)` }} />;
            const slot = (i) => {
              const k = thrownKs[i];
              return (
                <span key={`s${i}`} style={{ width: SW, height: SH, boxSizing: 'border-box', borderRadius: narrow ? 5 : 6, border: `2px dashed ${k != null ? A_FILL : CELL_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: narrow ? 12 : 15, fontWeight: 800, color: ACC_INK }}>
                  {k != null ? short(hand.cards[k]) : ''}
                </span>
              );
            };
            const tag = (
              <span style={{ fontFamily: SANS, fontSize: narrow ? 10 : 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', borderRadius: narrow ? 5 : 6, padding: narrow ? '3px 7px' : '4px 9px', alignSelf: narrow ? 'flex-start' : undefined, background: hand.yours ? A_FILL : 'transparent', color: hand.yours ? ON_A : INK, border: hand.yours ? '1.5px solid transparent' : `1.5px solid ${CELL_LINE}` }}>
                {hand.yours ? 'Your crib' : 'Their crib'}{narrow ? '' : (hand.yours ? ' · its points add' : ' · its points count against you')}
              </span>
            );
            const cribBox = (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: narrow ? 5 : 8 }}>
                {!narrow && tag}
                <div style={{ display: 'flex', gap: narrow ? 4 : 6, alignItems: 'flex-end' }} aria-label={`The crib: two unseen cards${thrownKs.length ? `, and ${thrownKs.map((k) => cardName(hand.cards[k])).join(' and ')}` : ''}`}>
                  {backCard(0)}{backCard(1)}{slot(0)}{slot(1)}
                </div>
                <span style={{ fontFamily: SANS, fontSize: narrow ? 10 : 11, fontWeight: 600, color: FADED, textAlign: 'right', lineHeight: 1.4 }}>
                  {narrow ? 'their two: every pair, averaged' : <>Their two are unseen: the value<br />averages every pair they could throw.</>}
                </span>
              </div>
            );

            const prompt = g.sel.length === 2
              ? `Throw ${g.sel.map((k) => cardName(hand.cards[k])).join(' and ')} to ${hand.yours ? 'your' : 'their'} crib.`
              : `Choose two cards for ${hand.yours ? 'your' : 'their'} crib.`;
            const ready = g.sel.length === 2;
            const hintBtn = hintOk && !g.hintUsed && (
              <button className="cb-tool" onClick={useHint} title="Ring one card of the best throw (one hint, first play only)" style={narrow ? { flex: 1 } : undefined}><Lightbulb size={16} /> Hint</button>
            );
            const throwBtn = (
              <button className="cb-btn" onClick={throwIt} disabled={!ready}
                style={{ background: ready ? STAGE_C : undefined, color: ready ? 'var(--stg-onramp, #ffffff)' : undefined, borderColor: ready ? STAGE_C : undefined, ...(narrow ? { flex: 2, fontSize: 16 } : { fontSize: 15, padding: '0 26px' }) }}>Throw</button>
            );
            const keptLine = g.shown === null && (
              <div style={{ display: 'flex', justifyContent: narrow ? 'space-between' : 'center', gap: narrow ? 8 : 28, marginTop: narrow ? 4 : 6, flexWrap: 'wrap' }}>
                {g.sel.length > 0
                  ? <span style={{ ...K, color: ACC_INK }}>{narrow ? 'Lifted · to the crib' : 'Lifted · going to the crib'}</span>
                  : <span style={K}>Tap two cards to lift them</span>}
                {ready && <span style={K}>Kept · {hand.cards.filter((_, k) => !g.sel.includes(k)).map(short).join(' ')}</span>}
              </div>
            );

            const revealPanel = playing && reveal && (
              <div className="cb-fade" style={{ marginTop: 12, borderTop: `1px solid ${SURF_B}`, paddingTop: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: reveal.pts === 2 ? GOOD : reveal.pts === 1 ? WARN : INK, marginBottom: 6 }}>
                  {reveal.pts === 2 ? 'The best throw. 2 points.'
                    : reveal.pts === 1 ? `Close: ${reveal.gap.toFixed(2)} behind the best. 1 point.`
                      : `${reveal.gap.toFixed(2)} behind the best. No points.`}
                </div>
                <table className="cb-tab" style={{ color: INK }}>
                  <thead>
                    <tr><th>Throw</th><th>Hand</th><th>{hand.yours ? 'Crib +' : 'Crib −'}</th><th>Value</th></tr>
                  </thead>
                  <tbody>
                    {reveal.rows.map((t) => {
                      const mine = t === pickT;
                      const top = t === reveal.bestT;
                      return (
                        <tr key={t} style={{ background: mine ? SURF2 : 'transparent', fontWeight: top || mine ? 800 : 600 }}>
                          <td>
                            <span style={{ display: 'inline-flex', gap: 3, verticalAlign: 'middle' }}>
                              {THROWS[t].map((k) => <Card key={k} c={hand.cards[k]} size="sm" />)}
                            </span>
                            <span style={{ marginLeft: 8, fontSize: 11, color: FADED }}>{[top && 'best', mine && 'yours'].filter(Boolean).join(' · ')}</span>
                          </td>
                          <td>{fmtV(hand.hand[t])}</td>
                          <td>{fmtV(hand.crib[t])}</td>
                          <td style={{ color: top ? GOOD : INK }}>{fmtSigned(hand.value[t])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, marginTop: 10, lineHeight: 1.55 }}>
                  The cut, for the look of it: <b style={{ color: INK }}>{cardName(reveal.cut)}</b>. Your four scored {scoreHand(reveal.keepMine, reveal.cut, false)} with it
                  {(() => {
                    const parts = scoreParts(reveal.keepMine, reveal.cut, false);
                    return parts.length ? ` (${parts.map((p) => `${PART_NAMES[p.k]} ${p.v}`).join(', ')})` : '';
                  })()}. The value above is the average over every cut, which is what counts.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="cb-btn" onClick={nextHand} style={{ background: STAGE_C, color: 'var(--stg-onramp, #ffffff)', borderColor: STAGE_C, ...(narrow ? { width: '100%' } : null) }}>
                    {g.picks.length >= NH ? 'See your score' : 'Next hand'} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );

            const summary = !playing && (
              <div>
                <div style={K}>The deal</div>
                <div style={{ fontSize: narrow ? 18 : 22, fontWeight: 800, color: INK, margin: '4px 0 6px' }}>All {NH} hands</div>
                <table className="cb-tab" style={{ color: INK }}>
                  <thead><tr><th>Hand</th><th>Crib</th><th>You threw</th><th>Best</th><th>Pts</th></tr></thead>
                  <tbody>
                    {HANDS.map((h, i) => {
                      const t = g.picks[i];
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{h.yours ? 'yours' : 'theirs'}</td>
                          <td>{t != null ? THROWS[t].map((k) => cardName(h.cards[k])).join(' ') : 'none'}</td>
                          <td>{THROWS[h.best].map((k) => cardName(h.cards[k])).join(' ')}</td>
                          <td style={{ fontWeight: 800 }}>{t != null ? pointsFor(h, t) : 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: INK, marginTop: 12 }}>
                  {`${score} of ${TOTAL}. ${bests} best throw${bests === 1 ? '' : 's'} out of ${NH}.`}
                </div>
              </div>
            );

            const feltHead = narrow ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tag}
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: INK, lineHeight: 1.4, maxWidth: 150 }}>
                    {hand.yours ? 'Its points add to your throw’s value.' : 'Its points come off your throw’s value.'}
                  </span>
                </div>
                {cribBox}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={K}>The deal</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: INK }}>Hand {Math.min(current + 1, NH)} of {NH}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: INK, maxWidth: 250, lineHeight: 1.45 }}>Six cards. Keep four, throw two to the crib, a second hand that scores for whoever owns it.</span>
                </div>
                {cribBox}
              </div>
            );

            return (
              <div className={STAGE ? undefined : (LOFT ? 'loft-card' : undefined)}
                style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 0 : `2px solid ${COLORS.ink}`, borderRadius: STAGE ? 0 : 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
                {pegBoard}
                <div style={{ marginTop: narrow ? 12 : 20, background: FELT, borderRadius: narrow ? 18 : 22, padding: narrow ? '14px 12px' : '18px 20px', display: 'flex', flexDirection: 'column' }}>
                  {playing ? (
                    <>
                      {feltHead}
                      {fan}
                      {keptLine}
                      {g.shown === null && (
                        narrow ? (
                          <span style={{ fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.4, paddingTop: 12 }}>{prompt}</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${SURF_B}`, paddingTop: 16, marginTop: 14 }}>
                            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.4 }}>{prompt}</span>
                            {hintBtn}
                            {throwBtn}
                          </div>
                        )
                      )}
                      {revealPanel}
                    </>
                  ) : summary}
                </div>
                {playing && g.shown === null && narrow && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>{hintBtn}{throwBtn}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: FADED, textAlign: 'center' }}>2 points for the best throw, 1 for one within 0.75 of it. The front peg is your total.</span>
                  </div>
                )}
                {playing && !narrow && (
                  <div style={{ padding: '12px 0 0', fontSize: 12, fontWeight: 600, color: FADED }}>
                    A throw is worth your four cards&rsquo; average over all 46 cut cards, {hand.yours ? 'plus your crib’s average' : 'minus their crib’s average'}.
                  </div>
                )}
              </div>
            );
          })()}

          <div className={STAGE ? undefined : 'loft-sol'}>
            {finished && !endHold.held && (
              <div style={{ maxWidth: 472, margin: '0 auto 6px' }}>
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontStyle: 'italic', color: FADED, marginTop: 8 }}>The Sunday Edition, seven hands.</div>
                )}
                {isTodays && myStats.cur >= 2 && (
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: WARN, marginTop: 8 }}>{myStats.cur}-day streak</div>
                )}
                <p style={{ fontSize: 12.5, fontWeight: 600, color: FADED, marginTop: 12, lineHeight: 1.6 }}>
                  {isTodays ? (
                    <>Next Crib in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>. {PUZZLE.num > 1 && (<a href={`/crib?p=${PUZZLE.num - 1}`} style={{ color: ACC_INK, fontWeight: 800 }}>Play yesterday&rsquo;s Crib &rarr;</a>)}</>
                  ) : (
                    <>You&rsquo;re playing the {PUZZLE.dateLabel} archive. <a href="/crib" style={{ color: ACC_INK, fontWeight: 800 }}>Back to today&rsquo;s Crib &rarr;</a></>
                  )}
                  {' '}<a href="/archive" style={{ color: ACC_INK, fontWeight: 800 }}>Puzzle archive</a>
                </p>
              </div>
            )}
          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide your hands</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Crib"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${score}/${TOTAL} · ${bests} best throws · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Crib all time` : 'all-time rank' }
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
                  href: `/crib?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'See your hands', sub: 'Every throw against the best', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Crib', sub: `No. ${prevPuzzle.num}, yesterday’s deal`, href: `/crib?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This deal again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
          </div>

          {!STAGE && <GamePanel self="crib" name="Crib" onShow={() => setShowChrome(true)} />}

          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="crib" name="Crib" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid
              replay={!playing ? resetGame : null}
              self="crib"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              boardSlot={<DailyBoardPanel self="crib" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider
            />
            )}
            {!focusMode && mobileUi && !standalone && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="cb-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
              </div>
            )}
            {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
            <div id="stf-stats-slot" />
          </div>

          {showA2hsHelp && (
            <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: 20, maxWidth: 380, fontFamily: SANS }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Crib to your home screen</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                  {isIosDevice()
                    ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.'
                    : 'Open your browser menu and choose Install app, or Add to Home screen.'}
                </p>
                <button className="cb-btn" onClick={() => setShowA2hsHelp(false)}>Got it</button>
              </div>
            </div>
          )}

          {!focusMode && !identity && (
            <div id="daily-join" style={{ margin: '18px auto 0' }}>
              <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" />
            </div>
          )}
        </div>
      </div>

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard
          modal
          self="crib"
          won={won}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
          quizId={PUZZLE.quizId}
        />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 26, zIndex: 60, background: COLORS.ink, color: T.white, fontFamily: SANS, fontSize: 13.5, fontWeight: 700, padding: '10px 16px', borderRadius: 9, boxShadow: '0 6px 18px rgba(0,0,0,0.28)', maxWidth: '88vw', textAlign: 'center' }}>{toast}</div>
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: 20, maxWidth: 460, maxHeight: '86vh', overflowY: 'auto', fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>How to play</div>
              <button type="button" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: INK, display: 'flex' }} aria-label="Close"><X size={20} /></button>
            </div>
            {rulesBody}
            <div style={{ marginTop: 16 }}>
              <button className="cb-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
            </div>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Crib</h2>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          The throw is the decision in cribbage that can be worked out exactly. Every hand begins with it: six cards, and two of them go to the crib, a second hand that belongs to the dealer. Keep the wrong four and you pay for it every deal.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          Most players keep the four that look best and throw whatever is left. That is right about two times in three. The other third are hands where the crib decides it: a five or a pair that is worth more in your own crib than in your hand, or a card you must not hand to your opponent even though your four would score more with it gone.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: 0 }}>
          Every throw is valued over all 46 cut cards and every pair of cards the opponent could throw, and the numbers are checked by a second, separate scorer before a deal ships. More card dailies: <a href="/hands" style={{ color: ACC_INK, fontWeight: 800 }}>Hands</a>, <a href="/shoe" style={{ color: ACC_INK, fontWeight: 800 }}>Shoe</a>, <a href="/finesse" style={{ color: ACC_INK, fontWeight: 800 }}>Finesse</a>, <a href="/taire" style={{ color: ACC_INK, fontWeight: 800 }}>Taire</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
