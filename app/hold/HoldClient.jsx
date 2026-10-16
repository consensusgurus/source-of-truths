'use client';

// Hold — the daily video poker hold.
//
// Ten five-card hands of Jacks or Better (fifteen on Sundays). For each, the
// player taps the cards to HOLD and presses Draw. Every one of the 32 possible
// holds is valued exactly in the bank (lib/hold-core.js, checked by
// scripts/verify-hold.mjs with a separate engine): its expected return over
// every draw of the replacement cards from the 47 not dealt, on the 9/6
// full-pay table.
//
// One point for a hold whose expected return is the best (ties all score),
// none otherwise. After each Draw the reveal shows the player's hold, the best
// hold and the runner-ups with their values, then a FLAVOR draw off the day's
// fixed replacement order: the final hand and what it pays, which is luck and
// scores nothing. Nothing counts against you and the clock breaks ties, so the
// registry row carries miss: null. A finished hand shows its numbers, so this
// is a first-attempt daily like any other.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import {
  RANKS, SUITS, rankOf, suitOf, isRed, cardName, cardWords, PAYTABLE, HAND_LABEL,
  classify, payOf, popcount, heldCards, holdLabel, drawFor,
} from '@/lib/hold-core';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#b91c1c',
  accentSoft: '#fbeaea',
  green: T.successDeep,
};
// The felt is the category accent mixed thin into the cell token, the same
// table Hands, Shoe and Crib play on, so it follows both registers. Card
// FACES are paper in both registers (playing cards are physical objects):
// white, near-black and red ink, exactly as Hands draws them.
const FELT = 'color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, #b91c1c)) 9%, var(--stg-cell, #fbeaea))';
const FACE = '#ffffff';
const FACE_INK = '#16181d';
const FACE_RED = '#b91c1c';
const FACE_EDGE = 'rgba(20,22,28,0.30)';
const A_FILL = 'var(--stg-acc, #b91c1c)';
const A_FILL_INK = 'var(--stg-acc-ink, var(--stg-acc, #b91c1c))';
const ON_A = 'var(--stg-onramp, #ffffff)';
const A_INK = 'var(--stg-acc-ink, #b91c1c)';
const CELL = 'var(--stg-cell, #ffffff)';
const CELL_LINE = 'var(--stg-cell-line, rgba(28,30,36,0.35))';
const S_INK = 'var(--stg-ink, #16181d)';
const S_INK2 = 'var(--stg-ink2, #2c3446)';
const S_MUTE = 'var(--stg-mute, #525c70)';
const GOOD = 'var(--stg-good, #15803d)';
const BAD = 'var(--stg-bad, #b91c1c)';
const WARN = 'var(--stg-warn, #b45309)';
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = SANS;
const HELP_KEY = 'sot_hold_help_seen';
const STATS_KEY = 'sot_hold_stats';

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
// Expected return, printed to three places with the bank's five behind it in
// the title so two close holds can always be told apart.
const fmtEV = (v) => v.toFixed(3);
const topEV = (h) => Math.max(...h.ev);
// Points a hold earns, off the bank's own values: every hold tied with the
// best scores.
const pointsFor = (h, mask) => (mask != null && mask >= 0 && h.ev[mask] >= topEV(h) - 1e-9 ? 1 : 0);
// Holds in value order, ties to the fewest cards then the lowest mask.
function ranked(h) {
  return h.ev.map((_, m) => m).sort((a, b) => (h.ev[b] - h.ev[a]) || (popcount(a) - popcount(b)) || (a - b));
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
    const total = p.hands.length;
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
  // picks: the hold mask chosen on each answered hand, in order.
  // sel: the mask held on the hand in play.
  // shown: the answered hand whose reveal is on screen, or null.
  return { v: 1, picks: [], sel: 0, shown: null, hintHand: null, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

// A playing card face, Hands' face exactly: rank and suit in the corner, the
// big pip in the middle, white in both registers.
const FACE_SIZES = {
  big: { r: 22, s: 17, c: 40, top: 7, left: 9, pad: 14, rad: 10 },
  mid: { r: 17, s: 13, c: 28, top: 5, left: 7, pad: 12, rad: 8 },
  sm: { r: 14, s: 11, c: 22, top: 4, left: 5, pad: 10, rad: 7 },
};
function CardFace({ card, sz = 'big' }) {
  const f = FACE_SIZES[sz] || FACE_SIZES.big;
  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, color: isRed(card) ? FACE_RED : FACE_INK, fontFamily: SANS, userSelect: 'none' }}>
      <span style={{ position: 'absolute', top: f.top, left: f.left, display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <b style={{ fontSize: f.r, fontWeight: 800, letterSpacing: '-0.03em' }}>{RANKS[rankOf(card)]}</b>
        <span style={{ fontSize: f.s }}>{SUITS[suitOf(card)]}</span>
      </span>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: f.c, paddingTop: f.pad, lineHeight: 1 }}>{SUITS[suitOf(card)]}</span>
    </span>
  );
}
// A small face for the reveal rows: rank and suit centred, Hands' MiniCard.
function MiniCard({ card, w = 28, h = 38 }) {
  return (
    <span style={{ width: w, height: h, flex: 'none', boxSizing: 'border-box', borderRadius: 5, background: FACE, border: `1.5px solid ${FACE_EDGE}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 11, fontWeight: 800, color: isRed(card) ? FACE_RED : FACE_INK, lineHeight: 1 }}>
      {RANKS[rankOf(card)]}{SUITS[suitOf(card)]}
    </span>
  );
}

export default function HoldClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_hold_${PUZZLE.num}`;
  const HANDS = PUZZLE.hands;
  const NH = HANDS.length;
  const TOTAL = NH;

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
  useEffect(() => { if (stats) setHintOk(hintAllowed('hold', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('hold'); }, [g.hintUsed]);
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
  const LOFT = isLoft('hold');
  const STAGE = isStage('hold', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('hold');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('hold');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('hold'), '--stg-acc-lt': gameColorLight('hold'), '--stg-onramp-lt': gameOnrampLight('hold'), '--stg-acc-ink-lt': gameAccentInkLight('hold') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF2 = STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : COLORS.accentSoft;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;

  const earned = g.picks.map((m, i) => pointsFor(HANDS[i], m));
  const score = earned.reduce((a, b) => a + b, 0);
  const won = !playing && g.status === 'done' && score === TOTAL;
  const finished = g.status === 'done';
  const current = g.shown !== null ? g.shown : g.picks.length;   // the hand on screen
  const answering = g.shown === null && g.picks.length < NH;

  // The flavor draws so far: each answered hand's final hand off the day's
  // fixed replacement order. Luck, scored nothing; the pay table ticks them.
  const draws = g.picks.map((m, i) => {
    const fin = drawFor(HANDS[i].cards, m, HANDS[i].draw);
    const k = classify(fin);
    return { fin, k, pay: payOf(fin) };
  });
  const madeCount = {};
  for (const d of draws) if (d.k !== 'nothing') madeCount[d.k] = (madeCount[d.k] || 0) + 1;
  const drawCredits = draws.reduce((s, d) => s + d.pay, 0);

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
        if (done || g.t0) localStorage.setItem('sot_hold_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_hold_day');
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

  // Phone layout (<=640px), decided by width rather than device so a narrow
  // desktop window gets the phone stack too.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const fit = () => { try { setNarrow(window.innerWidth <= 640); } catch (e) {} };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // The card row is sized to the width it actually has, never a fixed
  // pixel count: on desktop the pay table shares the felt with the cards,
  // and a 360px phone is narrower than five fixed cards plus their gaps.
  const [rowW, setRowW] = useState(0);
  const rowObs = useRef(null);
  const rowRef = useCallback((el) => {
    try { if (rowObs.current) { rowObs.current.disconnect(); rowObs.current = null; } } catch (e) {}
    if (!el) return;
    const read = () => { try { setRowW(el.clientWidth || 0); } catch (e) {} };
    read();
    try { if (typeof ResizeObserver !== 'undefined') { rowObs.current = new ResizeObserver(read); rowObs.current.observe(el); } } catch (e) {}
  }, []);

  const myStats = useMemo(() => deriveStats(stats, PUZZLE.num), [stats, PUZZLE.num]);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'hold', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'hold', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'hold', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'hold', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'hold', active: LOFT && !playing });

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }
  function commit(next) { gRef.current = next; setG(next); }
  const scoreOf = (picks) => picks.reduce((a, m, i) => a + pointsFor(HANDS[i], m), 0);

  const REC_KEY = `sot_hold_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.picks.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const sc = scoreOf(cur.picks);
    return { quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const sc = scoreOf(g2.picks);
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: sc >= TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  // A tap toggles a hold. Free: nothing counts until Draw.
  function tapCard(k) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || cur.shown !== null || cur.picks.length >= NH) return;
    vibrate(HAPT.ok);
    commit({ ...cur, sel: cur.sel ^ (1 << k) });
  }

  function drawIt() {
    const cur = gRef.current;
    const now = Date.now();
    if (now - lastTap.current < ARM_MIN_MS) return;
    lastTap.current = now;
    if (cur.status !== 'playing' || !cur.t0 || cur.shown !== null || cur.picks.length >= NH) return;
    const hi = cur.picks.length;
    const pts = pointsFor(HANDS[hi], cur.sel);
    vibrate(pts ? HAPT.best : HAPT.miss);
    commit({ ...cur, picks: cur.picks.concat([cur.sel]), sel: 0, shown: hi });
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
    commit({ ...cur, shown: null, sel: 0 });
  }

  // Keyboard: 1 to 5 toggle a hold, Enter draws or deals the next hand.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target;
      if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
      const cur = gRef.current;
      if (cur.status !== 'playing' || !cur.t0) return;
      if (/^[1-5]$/.test(e.key) && cur.shown === null) { e.preventDefault(); tapCard(Number(e.key) - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (cur.shown === null) drawIt(); else nextHand(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.hintUsed || cur.shown !== null || cur.status !== 'playing' || !cur.t0) return;
    const h = HANDS[cur.picks.length];
    commit({ ...cur, hintUsed: true, hintHand: cur.picks.length });
    say(h.best === 0 ? 'The best play here holds nothing: draw five.' : 'The ringed card belongs in the best hold.');
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
    return withRef(`mindloftdaily.com/hold${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const row = earned.map((x) => (x ? '\u{1F7E9}' : '⬜')).join('');
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    return `Hold #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${score}/${TOTAL} · ${elapsed}${g.hintUsed ? ' · \u{1F4A1}' : ''}${streakBit}\n${row}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Hold #${PUZZLE.num}, the daily video poker hold from Mind Loft.\n${shareUrl()}`
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
      lead="Video poker, one decision at a time. You are dealt five cards and choose which to HOLD (keep); the DRAW then replaces the rest from the 47 cards left in the deck, and a hold's EXPECTED RETURN is what it pays on average over every possible draw."
      banner={<>{NH} hands today, Jacks or Better, the full-pay table. Scoring rewards the mathematically best hold, not the luck of the draw.</>}
      steps={[
        <><b>Tap the cards</b> you want to keep (any of them, all of them, or none), then press <b>Draw</b>. Keys 1 to 5 and Enter work too.</>,
        <>Each hold is worth its <b>expected return</b>: the pay table value of the final hand, averaged over every set of replacement cards the deck could give you. It is counted exactly, not simulated.</>,
        <><b>1 point</b> when your hold&rsquo;s expected return is the best there is (a tie scores too), none otherwise. After each Draw you see your hold, the best hold and the runners-up with their values.</>,
        <>Then the cards come off a fixed shuffle and you see what your hold actually drew. That draw is <b>luck</b> and scores nothing.</>,
        <>Pays on a one-coin bet: royal flush 800, straight flush 50, four of a kind 25, full house 9, flush 6, straight 4, three of a kind 3, two pair 2, a pair of jacks or better 1.</>,
        <>One free <b>hint</b>, on your first ever play, rings one card of the best hold.</>,
      ]}
      knack="The rule of thumb (keep anything that pays or any pair, else four to a flush, else four to an open straight, else your high cards) is right most of the time. The traps are where it is not: four to a royal beats a made flush, a low pair can lose to four to a flush, and two suited high cards often beat three unsuited ones."
      footer={`Score out of ${TOTAL}. Nothing counts against you, and ties break on the clock. Sundays deal fifteen hands.`}
    />
  );

  // ── the hand on screen ───────────────────────────────────────────────────
  const hand = HANDS[Math.min(current, NH - 1)];
  const pickM = g.shown !== null ? g.picks[g.shown] : -1;
  const holdM = g.shown !== null ? pickM : g.sel;
  const hintCard = g.hintUsed && g.hintHand === current && g.shown === null && hand.best ? hand.cards.findIndex((_, i) => (hand.best >> i) & 1) : -1;
  const dealtKind = classify(hand.cards);
  const reveal = g.shown !== null ? (() => {
    const order = ranked(hand);
    const top = topEV(hand);
    const rows = order.slice(0, 4);
    if (!rows.includes(pickM)) rows.push(pickM);
    const fin = drawFor(hand.cards, pickM, hand.draw);
    const k = classify(fin);
    return { rows, top, pts: pointsFor(hand, pickM), gap: top - hand.ev[pickM], fin, k, pay: payOf(fin) };
  })() : null;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="hold" name="Hold" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="hold" quizId={PUZZLE.quizId}
          name="Hold"
          cat="Cards"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${NH} hands` : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: `${Math.min(g.picks.length + (answering ? 1 : 0), NH)}/${NH}`, k: 'hand' },
            { v: `${score}/${TOTAL}`, k: 'points' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: `${score}/${NH}`, k: 'best holds' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="hl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.hl-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .hl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:${STAGE ? '1.5px solid var(--stg-cell-line)' : `2px solid ${COLORS.accent}`};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accent};border-radius:${STAGE ? 12 : 8}px;padding:9px 16px;min-height:48px;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;}
          .hl-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .hl-btn:disabled{opacity:.45;cursor:default;}
          .hl-tool{font-family:${SANS};font-weight:700;font-size:14px;border:1.5px solid ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${INK};border-radius:12px;padding:0 16px;min-height:48px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;}
          .hl-felt{background:${FELT};touch-action:manipulation;box-sizing:border-box;}
          .hl-card{-webkit-tap-highlight-color:transparent;position:relative;box-sizing:border-box;background:${FACE};padding:0;font-family:${SANS};transition:transform .14s ease, box-shadow .14s ease;}
          .hl-card.live{cursor:pointer;}
          .hl-card.live:hover{transform:translateY(-3px);}
          .hl-card.live.on:hover{transform:translateY(-12px);}
          .hl-card.live:focus-visible{outline:2px solid var(--stg-ink, #16181d);outline-offset:3px;}
          .hl-tag{display:inline-flex;align-items:center;justify-content:center;font-family:${SANS};font-weight:800;letter-spacing:.12em;text-transform:uppercase;border-radius:6px;white-space:nowrap;}
          .hl-chip{display:inline-flex;align-items:center;gap:6px;font-family:${SANS};font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:16px;white-space:nowrap;font-variant-numeric:tabular-nums;}
          .hl-tab{width:100%;border-collapse:collapse;font-size:12.5px;}
          .hl-tab td,.hl-tab th{padding:6px 6px;text-align:right;border-bottom:1px solid ${SURF_B};white-space:nowrap;vertical-align:middle;}
          .hl-tab td:first-child,.hl-tab th:first-child{text-align:left;}
          .hl-tab th{font-family:${MONO};font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:${FADED};}
          .hl-fade{animation:hlfade .25s ease;}
          @keyframes hlfade{0%{opacity:0;transform:translateY(6px);}100%{opacity:1;transform:none;}}
          @media (prefers-reduced-motion: reduce){.hl-fade{animation:none;}.hl-card{transition:none !important;}}
        ` }} />

        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Hold is dealt'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>{NH} hands of Jacks or Better. For each, tap the cards to hold and press Draw. One point when your hold has the best expected return, worked out exactly over every draw. The draw itself is luck and scores nothing.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="hl-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, borderColor: STAGE ? STAGE_C_INK : T.cta, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!preStart && (() => {
            // ---- the results strip, the felt and the pay table ----
            // Every readout is state the board already holds: each answered
            // hand's point, the hand in play, the cards held, and the flavor
            // draws' made hands (the pay table's ticks). Nothing here leaks a
            // value before the Draw: the expected returns appear only in the
            // reveal of a hand already answered.
            const K = { fontFamily: SANS, fontSize: narrow ? 10 : 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: S_MUTE };
            const big = NH > 10 && narrow;

            // The results strip: one cell per hand of the day, Shoe's strip.
            const cells = HANDS.map((h, i) => {
              const base = { flex: '1 1 0', minWidth: 0, height: narrow ? 34 : 40, boxSizing: 'border-box', borderRadius: narrow ? 6 : 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, fontFamily: SANS, fontVariantNumeric: 'tabular-nums' };
              if (i < g.picks.length) {
                const p = earned[i];
                return (
                  <div key={i} role="listitem" title={`Hand ${i + 1}: ${p ? 'the best hold' : 'not the best hold'}`} style={{ ...base, background: CELL, border: `1.5px solid ${p ? GOOD : 'var(--stg-line2, rgba(28,30,36,.24))'}` }}>
                    {!narrow && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: S_INK2 }}>H{i + 1}</span>}
                    <b style={{ fontSize: big ? 10 : narrow ? 11 : 13, fontWeight: 800, color: p ? GOOD : BAD }}>{p ? '+1' : '+0'}</b>
                  </div>
                );
              }
              if (playing && i === current) {
                return (
                  <div key={i} role="listitem" aria-current="step" title={`Hand ${i + 1}, in play`} style={{ ...base, background: 'color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, #b91c1c)) 12%, var(--stg-cell, #ffffff))', border: `2px solid ${A_FILL_INK}` }}>
                    {narrow
                      ? <b style={{ fontSize: big ? 9 : 11, fontWeight: 800, letterSpacing: '.04em', color: A_INK }}>NOW</b>
                      : <><span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: A_INK }}>NOW</span><b style={{ fontSize: 13, fontWeight: 800, color: A_INK }}>H{i + 1}</b></>}
                  </div>
                );
              }
              return (
                <div key={i} role="listitem" title={`Hand ${i + 1}, to come`} style={{ ...base, background: 'transparent', border: `1.5px dashed ${CELL_LINE}` }}>
                  {!narrow && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: S_MUTE }}>H{i + 1}</span>}
                </div>
              );
            });
            const strip = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? 5 : 9 }}>
                {!narrow && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={K}>{NH} hands &middot; 1 point for the best hold</span>
                    <span style={K}>Score <b style={{ color: S_INK }}>{score}</b> of {TOTAL}</span>
                  </div>
                )}
                <div role="list" aria-label={`Results: ${g.picks.length} of ${NH} hands answered, ${score} best holds`} style={{ display: 'flex', gap: narrow ? 3 : 5 }}>
                  {cells}
                </div>
                {narrow && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={K}>{playing ? <>Hand {Math.min(current + 1, NH)} of {NH}</> : <>{NH} hands</>}</span>
                    <span style={K}>Score <b style={{ color: S_INK }}>{score}</b> of {TOTAL}</span>
                  </div>
                )}
              </div>
            );

            // The pay table on the felt: best hand first, ticking the hands
            // the day's flavor draws have made (Hands' table).
            const lit = reveal ? reveal.k : null;
            const payTable = (
              <div aria-label="Pay table" style={{ display: 'flex', flexDirection: 'column', gap: narrow ? 2 : 3 }}>
                <span style={{ ...K, fontSize: 10, fontWeight: 800, marginBottom: 3 }}>Pay table &middot; one coin</span>
                <div style={narrow ? { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 14, rowGap: 2 } : { display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {PAYTABLE.map((row) => {
                    const hit = madeCount[row.key] || 0;
                    const now = lit === row.key;
                    return (
                      <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: narrow ? 11.5 : 12, fontWeight: hit || now ? 800 : 600, color: now ? ON_A : hit ? A_INK : S_INK2, background: now ? A_FILL : 'transparent', borderRadius: 5, padding: now ? '1px 5px' : '1px 0', margin: now ? '0 -5px' : 0 }}>
                        <span>{hit ? '✓ ' : ''}{row.name}{hit > 1 ? ` ×${hit}` : ''}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.pay}</span>
                      </div>
                    );
                  })}
                </div>
                {g.picks.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: S_MUTE, marginTop: 4, lineHeight: 1.35 }}>Your draws so far paid {drawCredits}. Luck, not scored.</span>
                )}
              </div>
            );

            // The five cards. A held card lifts and wears the accent with a
            // HELD tag above it; in the reveal a drawn card says so.
            const GAP = narrow ? 6 : 12;
            const CW_MAX = narrow ? 64 : 92;
            const CW = rowW > 0 ? Math.max(40, Math.min(CW_MAX, Math.floor((rowW - 4 * GAP) / 5))) : (narrow ? 56 : 80);
            const CH = Math.round(CW * 1.41);
            const FACE_SZ = CW >= 84 ? 'big' : CW >= 56 ? 'mid' : 'sm';
            const showFin = reveal ? reveal.fin : null;
            const row = (
              <div ref={rowRef} style={{ display: 'flex', justifyContent: 'center', gap: GAP, paddingTop: narrow ? 22 : 26, minHeight: CH + (narrow ? 22 : 26), width: '100%', minWidth: 0 }} key={`h${current}`}>
                {hand.cards.map((c0, k) => {
                  const held = !!((holdM >> k) & 1);
                  // The reveal keeps the DEALT hand on the felt, so the table
                  // below can be read against it; the draw shows in the panel.
                  const c = c0;
                  const drawn = showFin && !held;
                  const live = started && g.shown === null && playing;
                  const ring = k === hintCard;
                  const lift = held && !showFin ? (narrow ? 10 : 14) : 0;
                  const shadow = [
                    held && !showFin ? `0 0 0 3px ${FELT}, 0 0 0 5px ${A_FILL}` : null,
                    ring ? `0 0 0 ${held ? 8 : 3}px var(--stg-ink, #b45309)` : null,
                    held && !showFin ? '0 14px 22px rgba(0,0,0,.32)' : '0 4px 10px rgba(0,0,0,.26)',
                  ].filter(Boolean).join(', ');
                  const label = `${cardWords(c)}${showFin ? (held ? ', held' : ', thrown') : (held ? ', held' : '')}${ring ? ', hinted' : ''}`;
                  return (
                    <div key={k} style={{ position: 'relative', width: CW, flex: 'none' }}>
                      <span className="hl-tag" aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: narrow ? -20 : -24, height: narrow ? 16 : 18, fontSize: narrow ? 9 : 10, color: held ? ON_A : (drawn ? A_INK : S_MUTE), background: held ? A_FILL : 'transparent', border: held ? 'none' : (drawn ? `1.5px solid ${A_FILL_INK}` : 'none'), transform: `translateY(-${lift}px)` }}>
                        {held ? 'Held' : drawn ? 'Thrown' : (live ? `${k + 1}` : '')}
                      </span>
                      <button type="button" className={`hl-card${live ? ' live' : ''}${held ? ' on' : ''}`}
                        onClick={live ? () => tapCard(k) : undefined}
                        disabled={!live}
                        aria-pressed={live ? held : undefined}
                        aria-label={label}
                        style={{
                          width: CW, height: CH, borderRadius: narrow ? 8 : 11, display: 'block',
                          border: held && !showFin ? `3px solid ${A_FILL_INK}` : drawn ? `2px dashed ${A_FILL}` : `1.5px solid ${FACE_EDGE}`,
                          boxShadow: shadow, transform: `translateY(-${lift}px)`, cursor: live ? 'pointer' : 'default',
                        }}>
                        <CardFace card={c} sz={FACE_SZ} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );

            const nHeld = popcount(g.sel);
            const prompt = nHeld === 0 ? 'Tap the cards to hold, or Draw five new ones.'
              : nHeld === 5 ? 'Keeping all five. Draw stands pat.'
              : `${holdLabel(hand.cards, g.sel)}. Draw replaces the other ${5 - nHeld}.`;
            const hintBtn = hintOk && !g.hintUsed && (
              <button className="hl-tool" onClick={useHint} title="Ring one card of the best hold (one hint, first play only)" style={narrow ? { flex: 1 } : undefined}><Lightbulb size={16} /> Hint</button>
            );
            const drawBtn = (
              <button className="hl-btn" onClick={drawIt}
                style={{ background: STAGE_C, color: 'var(--stg-onramp, #ffffff)', borderColor: STAGE_C_INK, ...(narrow ? { flex: 2, fontSize: 16 } : { fontSize: 15, padding: '0 30px' }) }}>Draw</button>
            );
            const dealtChip = (
              <span className="hl-chip" style={{ fontSize: narrow ? 11 : 12, padding: narrow ? '4px 10px' : '5px 11px', border: `1.5px solid ${CELL_LINE}`, color: S_INK }}>
                Dealt &middot; {dealtKind === 'nothing' ? 'no pay' : `${HAND_LABEL[dealtKind]} ${PAYTABLE.find((r) => r.key === dealtKind).pay}`}
              </span>
            );

            const revealPanel = playing && reveal && (
              <div className="hl-fade" style={{ marginTop: 14, borderTop: `1px solid ${SURF_B}`, paddingTop: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: reveal.pts ? GOOD : INK, marginBottom: 6 }}>
                  {reveal.pts ? 'The best hold. 1 point.' : `${fmtEV(reveal.gap)} behind the best. No point.`}
                </div>
                <table className="hl-tab" style={{ color: INK }}>
                  <thead>
                    <tr><th>Hold</th><th>Expected return</th></tr>
                  </thead>
                  <tbody>
                    {reveal.rows.map((m) => {
                      const mine = m === pickM;
                      const top = hand.ev[m] >= reveal.top - 1e-9;
                      const cs = heldCards(hand.cards, m);
                      return (
                        <tr key={m} style={{ background: mine ? SURF2 : 'transparent', fontWeight: top || mine ? 800 : 600 }}>
                          <td>
                            <span style={{ display: 'inline-flex', gap: 3, verticalAlign: 'middle', flexWrap: 'wrap' }}>
                              {cs.length ? cs.map((c) => <MiniCard key={c} card={c} w={narrow ? 26 : 28} h={narrow ? 34 : 38} />)
                                : <span style={{ fontSize: 12, fontWeight: 800, color: INK, padding: '0 2px' }}>Draw five</span>}
                            </span>
                            <span style={{ marginLeft: 8, fontSize: 11, color: FADED }}>{[top && 'best', mine && 'yours'].filter(Boolean).join(' · ')}</span>
                          </td>
                          <td title={hand.ev[m].toFixed(5)} style={{ color: top ? GOOD : INK, fontVariantNumeric: 'tabular-nums' }}>{fmtEV(hand.ev[m])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, flexWrap: 'wrap' }} aria-label={`Your draw: ${reveal.fin.map(cardWords).join(', ')}`}>
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: S_MUTE, marginRight: 6 }}>Your draw</span>
                  {reveal.fin.map((c, k) => (
                    <span key={k} style={{ display: 'inline-flex', borderRadius: 7, padding: 1, border: (pickM >> k) & 1 ? '2px solid transparent' : `2px dashed ${A_FILL_INK}` }}>
                      <MiniCard card={c} w={narrow ? 30 : 34} h={narrow ? 40 : 46} />
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, marginTop: 8, lineHeight: 1.55 }}>
                  For the look of it, off the day&rsquo;s fixed shuffle (new cards dashed): {reveal.k === 'nothing' ? 'no pay' : <><b style={{ color: INK }}>{HAND_LABEL[reveal.k].toLowerCase()}</b>, paying {reveal.pay}</>}. That is luck: the expected return above is the average over every draw, which is what counts.
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="hl-btn" onClick={nextHand} style={{ background: STAGE_C, color: 'var(--stg-onramp, #ffffff)', borderColor: STAGE_C_INK, ...(narrow ? { width: '100%' } : null) }}>
                    {g.picks.length >= NH ? 'See your score' : 'Next hand'} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );

            const summary = !playing && (
              <div>
                <div style={K}>The deal</div>
                <div style={{ fontSize: narrow ? 18 : 22, fontWeight: 800, color: INK, margin: '4px 0 6px' }}>All {NH} hands</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="hl-tab" style={{ color: INK }}>
                    <thead><tr><th>#</th><th>Dealt</th><th>You held</th><th>Best</th><th>Pt</th></tr></thead>
                    <tbody>
                      {HANDS.map((h, i) => {
                        const m = g.picks[i];
                        const short = (mask) => (mask === 0 ? 'nothing' : heldCards(h.cards, mask).map(cardName).join(' '));
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{h.cards.map(cardName).join(' ')}</td>
                            <td>{m != null ? short(m) : 'none'}</td>
                            <td>{short(h.best)}</td>
                            <td style={{ fontWeight: 800, color: m != null && pointsFor(h, m) ? GOOD : INK }}>{m != null ? pointsFor(h, m) : 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: INK, marginTop: 12 }}>
                  {`${score} of ${TOTAL}. ${score} best hold${score === 1 ? '' : 's'} out of ${NH}.`}
                </div>
              </div>
            );

            const headLine = (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={K}>{g.shown !== null ? `Hand ${current + 1} · the draw` : `Hand ${Math.min(current + 1, NH)} of ${NH} · tap to hold`}</span>
                {dealtChip}
              </div>
            );

            return (
              <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)}
                style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 0 : `2px solid ${COLORS.ink}`, borderRadius: STAGE ? 0 : 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
                <div style={{ padding: narrow ? '0 4px' : 0 }}>{strip}</div>
                {playing ? (
                  narrow ? (
                    <>
                      <div className="hl-felt" style={{ marginTop: 12, borderRadius: 18, padding: '14px 12px', display: 'flex', flexDirection: 'column' }}>
                        {headLine}
                        {row}
                        {g.shown === null && (
                          <span style={{ fontSize: 14, fontWeight: 700, color: S_INK, lineHeight: 1.4, paddingTop: 12 }}>{prompt}</span>
                        )}
                        {revealPanel}
                        <div style={{ marginTop: 14, borderTop: `1px solid ${CELL_LINE}`, paddingTop: 10 }}>{payTable}</div>
                      </div>
                      {g.shown === null && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
                          <div style={{ display: 'flex', gap: 8 }}>{hintBtn}{drawBtn}</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: S_MUTE, textAlign: 'center' }}>1 point for the best hold. The draw itself is luck and scores nothing.</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="hl-felt" style={{ marginTop: 18, borderRadius: 22, padding: '18px 20px 16px', display: 'flex', gap: 20 }}>
                      <div style={{ width: 168, flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>{payTable}</div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        {headLine}
                        {row}
                        {g.shown === null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${CELL_LINE}`, paddingTop: 14, marginTop: 16 }}>
                            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: S_INK, lineHeight: 1.4 }}>{prompt}</span>
                            {hintBtn}
                            {drawBtn}
                          </div>
                        )}
                        {revealPanel}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="hl-felt" style={{ marginTop: narrow ? 12 : 18, borderRadius: narrow ? 18 : 22, padding: narrow ? '14px 12px' : '18px 20px' }}>{summary}</div>
                )}
                {playing && (
                  <div style={{ padding: '10px 2px 0', fontSize: narrow ? 11 : 12, fontWeight: 600, color: S_MUTE }}>
                    Same deal for everybody. A hold is worth its average payout over every draw from the 47 cards left.
                  </div>
                )}
              </div>
            );
          })()}

          <div className={STAGE ? undefined : 'loft-sol'}>
            {finished && !endHold.held && (
              <div style={{ maxWidth: 472, margin: '0 auto 6px' }}>
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontStyle: 'italic', color: FADED, marginTop: 8 }}>The Sunday Edition, fifteen hands.</div>
                )}
                {isTodays && myStats.cur >= 2 && (
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: WARN, marginTop: 8 }}>{myStats.cur}-day streak</div>
                )}
                <p style={{ fontSize: 12.5, fontWeight: 600, color: FADED, marginTop: 12, lineHeight: 1.6 }}>
                  {isTodays ? (
                    <>Next Hold in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>. {PUZZLE.num > 1 && (<a href={`/hold?p=${PUZZLE.num - 1}`} style={{ color: ACC_INK, fontWeight: 800 }}>Play yesterday&rsquo;s Hold &rarr;</a>)}</>
                  ) : (
                    <>You&rsquo;re playing the {PUZZLE.dateLabel} archive. <a href="/hold" style={{ color: ACC_INK, fontWeight: 800 }}>Back to today&rsquo;s Hold &rarr;</a></>
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
              name="Hold"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${score}/${TOTAL} · ${score} best holds · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Hold all time` : 'all-time rank' }
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
                  href: `/hold?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'See your hands', sub: 'Every hold against the best', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Hold', sub: `No. ${prevPuzzle.num}, yesterday’s deal`, href: `/hold?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This deal again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
          </div>

          {!STAGE && <GamePanel self="hold" name="Hold" onShow={() => setShowChrome(true)} />}

          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="hold" name="Hold" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid
              replay={!playing ? resetGame : null}
              self="hold"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              boardSlot={<DailyBoardPanel self="hold" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider
            />
            )}
            {!focusMode && mobileUi && !standalone && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="hl-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
              </div>
            )}
            {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
            <div id="stf-stats-slot" />
          </div>

          {showA2hsHelp && (
            <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: 20, maxWidth: 380, fontFamily: SANS }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Hold to your home screen</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                  {isIosDevice()
                    ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.'
                    : 'Open your browser menu and choose Install app, or Add to Home screen.'}
                </p>
                <button className="hl-btn" onClick={() => setShowA2hsHelp(false)}>Got it</button>
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
          self="hold"
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
              <button className="hl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
            </div>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Hold</h2>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          Video poker deals you five cards and asks one question: which ones do you keep? The cards you hold stay, the rest are replaced from the 47 cards left in the deck, and the final hand pays off the table. Hold plays that question ten times a day, fifteen on Sundays, on Jacks or Better with the full-pay table.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          There are 32 ways to hold any hand, from keeping nothing to keeping all five, and each one has an expected return: the average payout over every possible draw. That number is a count, not a guess, so the best hold is a fact. Most hands follow the rule of thumb, keep what pays, then a pair, then four to a flush or an open straight, then your high cards. The interesting ones are the traps, where the rule is wrong: four to a royal flush is worth more than a made flush, and a low pair can lose to four cards of one suit.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: 0 }}>
          Scoring rewards the mathematically best hold, not the luck of the draw: you earn a point for the right decision whether the cards come or not. Every value is counted over all the draws and checked by a second, separate engine before a deal ships. More card dailies: <a href="/hands" style={{ color: ACC_INK, fontWeight: 800 }}>Hands</a>, <a href="/shoe" style={{ color: ACC_INK, fontWeight: 800 }}>Shoe</a>, <a href="/crib" style={{ color: ACC_INK, fontWeight: 800 }}>Crib</a>, <a href="/finesse" style={{ color: ACC_INK, fontWeight: 800 }}>Finesse</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
