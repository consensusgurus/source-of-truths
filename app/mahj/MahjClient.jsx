'use client';

// Mahj: the daily 144-tile mahjong solitaire.
//
// The full set every day on that weekday's layout (lib/mahj-core.js): clear the
// board by matching pairs of FREE tiles, a tile being free when nothing sits on
// top of it and its left or right side is open. Every deal is clearable by
// construction and proven by scripts/verify-mahj.mjs, which replays a clearing
// order with its own geometry.
//
// TIMED (owner, 2026-10-25). A clear scores 10 and the board ranks clears on
// the clock. Undo is free; a Shuffle redeals the tiles left into a clearable
// layout and adds 30 seconds to the posted time. A run that stops short scores
// 0 to 8 by the share of the board cleared and ranks on pairs cleared
// (`progress`), then the clock. First attempt stands, like any daily.
//
// OPEN INFORMATION. Look Under hides the upper layers so the tiles beneath can
// be read before committing, so the deal holds no secrets: covered tiles are a
// planning problem, not a coin flip.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Smartphone, Flag, Undo2, Shuffle, Lightbulb, ZoomIn, ZoomOut } from 'lucide-react';
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
  LAYOUTS, relationsOf, isFree, decodeDeal, encodeDeal, faceInfo, matchKey,
  openPairs, redeal, hintPair, scoreFor, SHUFFLE_PENALTY_S,
} from '@/lib/mahj-core';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import PlayStage, { usePhoneStage } from '../PlayStage';
import HelpSheet from '../HelpSheet';

const KEY = 'mahj';
const NAME = 'Mahj';
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HELP_KEY = 'sot_mahj_help_seen';
const STATS_KEY = 'sot_mahj_stats';
const ARM_MIN_MS = 400;
const TH = 1.32;     // a tile's height in tile widths
const OFF = 0.11;    // how far each layer steps up and left, in tile widths

// The tiles are white in every register; only the PRINT carries a suit colour,
// in the site's own category pastels, each mark outlined in the one dark ink
// so a pastel reads on white (owner, 2026-10-25, from the Mahj mockup).
const INK = '#08222e';
const PRINT = {
  dots: '#7dd3fc', bam: '#6ee7b7', char: '#fb7185', wind: '#a5b4fc',
  red: '#fb7185', green: '#6ee7b7', white: '#a5b4fc', flower: '#e879f9', season: '#fb923c',
};
const FACE = '#ffffff';
const FACE_SEL = '#fff4d6';
const FACE_BLOCKED = '#dde2ea';
const EDGE = '#b9c1cd';
const EDGE_BLOCKED = '#a3acba';
const PIPS = {
  1: [[50, 50]], 2: [[50, 28], [50, 72]], 3: [[27, 24], [50, 50], [73, 76]],
  4: [[30, 28], [70, 28], [30, 72], [70, 72]], 5: [[30, 26], [70, 26], [50, 50], [30, 74], [70, 74]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
  7: [[25, 16], [50, 28], [75, 40], [32, 62], [68, 62], [32, 84], [68, 84]],
  8: [[32, 16], [68, 16], [32, 38], [68, 38], [32, 62], [68, 62], [32, 84], [68, 84]],
  9: [[25, 20], [50, 20], [75, 20], [25, 50], [50, 50], [75, 50], [25, 80], [50, 80], [75, 80]],
};
const DOTSZ = { 1: 46, 2: 30, 3: 26, 4: 27, 5: 24, 6: 22, 7: 19, 8: 18, 9: 19 };

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
function fmtSecs(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function msToMidnightET() {
  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - et.getTime();
  } catch (e) { return 0; }
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
    const score = typeof m.scorePct === 'number' ? Math.round(m.scorePct / 10) : 0;
    s.rec[p.num] = { s: score, t: 10, won: score >= 10 };
    touched = true;
  }
  if (touched) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {} }
  return s;
}

const HAPT = { ok: [7], pair: [6, 18, 6], no: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// gone: every tile cleared, in order. hist: the pairs since the last shuffle,
// which is what Undo walks back. faces: the current deal (a shuffle rewrites
// the tiles still on the board).
function freshState(deal) {
  return { v: 1, deal, faces: deal, gone: [], hist: [], shuffles: 0, undos: 0, hintUsed: false, hintPair: null, status: 'playing', gaveUp: false, t0: null, tEnd: null };
}

export default function MahjClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_mahj_${PUZZLE.num}`;
  const LAYOUT = LAYOUTS[PUZZLE.layout];
  const REL = useMemo(() => relationsOf(PUZZLE.layout), [PUZZLE.layout]);
  const N = REL.pos.length;
  const PAIRS = N / 2;
  const TOTAL = 10;

  const [g, setG] = useState(() => freshState(PUZZLE.deal));
  const gRef = useRef(g);
  const [sel, setSel] = useState(-1);
  const [peek, setPeek] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const endHold = useEndHold(1100);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed(KEY, stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint(KEY); }, [g.hintUsed]);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const [armGive, setArmGive] = useState(false);
  const [narrow, setNarrow] = useState(false);
  // The phone stage (owner, 2026-10-25: the first phone view needed a lot of
  // work): Big tiles by default inside a scrolling port, with a map of the
  // whole board that shows where the port is and jumps on a tap.
  const phoneStage = usePhoneStage();
  const [bigTiles, setBigTiles] = useState(true);
  const [scr, setScr] = useState(null);
  const portRef = useRef(null);
  const readScroll = useCallback((el) => {
    if (!el) return;
    setScr({ sl: el.scrollLeft, st: el.scrollTop, sw: el.scrollWidth, sh: el.scrollHeight, cw: el.clientWidth, ch: el.clientHeight });
  }, []);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const lastTap = useRef(0);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft(KEY);
  const STAGE = isStage(KEY, searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor(KEY);
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor(KEY);
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor(KEY), '--stg-acc-lt': gameColorLight(KEY), '--stg-onramp-lt': gameOnrampLight(KEY), '--stg-acc-ink-lt': gameAccentInkLight(KEY) };
  const [stageTheme] = useStageTheme();
  const S_INK = STAGE ? 'var(--stg-ink,#e9edf4)' : T.ink;
  const S_MUTE = STAGE ? 'var(--stg-mute,#8b95a8)' : T.muted;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : gameColor(KEY);
  const WARN = 'var(--stg-warn, #b45309)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;

  // ── the board as it stands ───────────────────────────────────────────────
  const faces = useMemo(() => decodeDeal(g.faces), [g.faces]);
  const on = useMemo(() => {
    const a = new Array(N).fill(true);
    for (const i of g.gone) a[i] = false;
    return a;
  }, [g.gone, N]);
  const left = N - g.gone.length;
  const pairsDone = g.gone.length / 2;
  const free = useMemo(() => on.map((v, i) => v && isFree(REL, i, on)), [on, REL]);
  const open = useMemo(() => openPairs(REL, faces, on), [REL, faces, on]);
  const stuck = playing && left > 0 && open.length === 0;
  const cleared = left === 0;
  const score = scoreFor(g.gone.length, N);
  const won = !playing && cleared;

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);
  const rawSecs = g.t0 ? Math.max(0, Math.round(((g.tEnd || nowTick) - g.t0) / 1000)) : 0;
  const postedSecs = rawSecs + SHUFFLE_PENALTY_S * g.shuffles;
  const elapsed = fmtSecs(postedSecs);

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
        if (saved && saved.v === 1 && saved.deal === PUZZLE.deal && Array.isArray(saved.gone) && typeof saved.faces === 'string' && saved.faces.length === N) {
          const next = { ...freshState(PUZZLE.deal), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(false);
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
        if (done || g.t0) localStorage.setItem('sot_mahj_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_mahj_day');
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
        .then((d) => { if (d && Array.isArray(d.recent)) { try { setStats(mergeServerStats(getStats(), d.recent, puzzles)); } catch (e) {} } })
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
        fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
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

  useEffect(() => {
    const fit = () => { try { setNarrow(window.innerWidth <= 640); } catch (e) {} };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const myStats = useMemo(() => deriveStats(stats, PUZZLE.num), [stats, PUZZLE.num]);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: KEY, quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: KEY, active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: KEY, active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: KEY, active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: KEY, active: LOFT && !playing });

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }
  function commit(next) { gRef.current = next; setG(next); }

  const REC_KEY = `sot_mahj_rec_${PUZZLE.num}`;
  const payloadFor = (cur, extra) => {
    const raw = cur.t0 ? Math.max(1, Math.round(((cur.tEnd || Date.now()) - cur.t0) / 1000)) : 1;
    const secs = Math.min(36000, raw + SHUFFLE_PENALTY_S * cur.shuffles);
    const sc = scoreFor(cur.gone.length, N);
    return { quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, progress: cur.gone.length / 2, timeElapsed: secs, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''), ...extra };
  };
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !cur.gone.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return payloadFor(cur, { abandoned: true });
  });

  function postResult(g2) {
    abandon.markFlushed();
    const sc = scoreFor(g2.gone.length, N);
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: sc >= TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(g2)),
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

  const tapTile = useCallback((i) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || peek != null) return;
    const fs = decodeDeal(cur.faces);
    const here = new Array(N).fill(true);
    for (const k of cur.gone) here[k] = false;
    if (!here[i]) return;
    if (!isFree(REL, i, here)) {
      vibrate(HAPT.no);
      say('That tile is covered, or boxed in on both sides.');
      setSel(-1);
      return;
    }
    if (sel === -1) { vibrate(HAPT.ok); setSel(i); return; }
    if (sel === i) { setSel(-1); return; }
    if (matchKey(fs[i]) === matchKey(fs[sel])) {
      const gone = cur.gone.concat([sel, i]);
      const next = { ...cur, gone, hist: cur.hist.concat([[sel, i]]), hintPair: null };
      setSel(-1);
      if (gone.length >= N) {
        const done = { ...next, status: 'done', tEnd: Date.now() };
        vibrate(HAPT.win);
        postResult(done);
        endHold.hold(HOLD_SHORT);
        commit(done);
        return;
      }
      vibrate(HAPT.pair);
      commit(next);
      return;
    }
    vibrate(HAPT.ok);
    setSel(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, peek, N, REL]);

  function undo() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.hist.length) return;
    const [a, b] = cur.hist[cur.hist.length - 1];
    commit({ ...cur, gone: cur.gone.filter((k) => k !== a && k !== b), hist: cur.hist.slice(0, -1), undos: cur.undos + 1, hintPair: null });
    setSel(-1);
  }

  function shuffle() {
    const now = Date.now();
    if (now - lastTap.current < ARM_MIN_MS) return;
    lastTap.current = now;
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const here = new Array(N).fill(true);
    for (const k of cur.gone) here[k] = false;
    const nf = redeal(PUZZLE.layout, PUZZLE.quizId, decodeDeal(cur.faces), here, cur.shuffles + 1);
    if (!nf) { say('No clearable redeal from here. Undo a few pairs and try again.'); return; }
    commit({ ...cur, faces: encodeDeal(nf), hist: [], shuffles: cur.shuffles + 1, hintPair: null });
    setSel(-1);
    say(`Redealt into a layout you can clear. ${SHUFFLE_PENALTY_S} seconds added.`);
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.hintUsed || cur.status !== 'playing' || !cur.t0) return;
    const here = new Array(N).fill(true);
    for (const k of cur.gone) here[k] = false;
    const h = hintPair(REL, decodeDeal(cur.faces), here);
    if (!h) { say('No open pair right now. Undo, or shuffle.'); return; }
    commit({ ...cur, hintUsed: true, hintPair: h.pair });
    setSel(-1);
    say(h.proven ? 'The ringed pair keeps the board clearable.' : 'The ringed tiles are an open pair.');
  }

  function giveUp() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0) return;
    const done = { ...cur, status: 'done', gaveUp: true, tEnd: Date.now() };
    setArmGive(false);
    setSel(-1);
    vibrate(HAPT.ok);
    postResult(done);
    endHold.hold(HOLD_SHORT);
    commit(done);
  }
  function tapGiveUp() {
    if (armGive) { if (Date.now() - armGive < ARM_MIN_MS) return; giveUp(); return; }
    const at = Date.now();
    setArmGive(at);
    setTimeout(() => setArmGive((v) => (v === at ? false : v)), 3500);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tg = e.target;
      if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
      if (e.key === 'Escape') { setSel(-1); setPeek(null); }
      else if (e.key === 'u' || e.key === 'U') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit({ ...freshState(PUZZLE.deal), hintUsed: true, t0: Date.now() });
    setSel(-1);
    setPeek(null);
    setEndClosed(false);
    setRevealed(false);
  }

  async function a2hsClick() {
    if (installEvt) { try { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); return; } catch (e) {} }
    setShowA2hsHelp(true);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/mahj${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const bar = Math.round((pairsDone / PAIRS) * 10);
    const row = '\u{1F7E9}'.repeat(bar) + '⬜'.repeat(10 - bar);
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const how = cleared ? `cleared in ${elapsed}` : `${pairsDone}/${PAIRS} pairs`;
    return `Mahj #${PUZZLE.num} · ${LAYOUT.name}${PUZZLE.sunday ? ' · Sunday' : ''} · ${how}${g.shuffles ? ` · ${g.shuffles} shuffle${g.shuffles === 1 ? '' : 's'}` : ''}${g.hintUsed ? ' · \u{1F4A1}' : ''}${streakBit}\n${row}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing ? `Mahj #${PUZZLE.num}, the daily 144-tile mahjong solitaire from Mind Loft.\n${shareUrl()}` : shareText();
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={gameColor(KEY)} accentSoft="#fbe8fd"
      lead="Clear all 144 tiles in pairs. Only FREE tiles can be picked: a tile is free when nothing sits on top of it and its left or right side is open."
      banner={<>Today&rsquo;s layout is the {LAYOUT.name}{PUZZLE.sunday ? ', the Sunday Edition and the hardest deal of the week' : ''}. Every deal is proven clearable before it ships.</>}
      steps={[
        <><b>Tap two free tiles</b> with the same face to clear them. Free tiles show bright white; covered or boxed-in tiles are gray.</>,
        <>Any <b>flower</b> matches any flower, and any <b>season</b> matches any season.</>,
        <><b>Look Under</b> hides the upper layers so you can read the tiles beneath before you commit. Nothing on the board is hidden.</>,
        <><b>Undo</b> is free. <b>Shuffle</b> redeals the tiles left into a layout you can clear, and adds {SHUFFLE_PENALTY_S} seconds to your time.</>,
        <>One free <b>hint</b>, on your first ever play, rings a pair that keeps the board clearable. <b>Give up</b> ends the run where it stands.</>,
      ]}
      knack="Clear the tops and the long rows first. A tile that pins several others is worth freeing early, and when three of a face are free, take the pair that leaves the fourth somewhere useful."
      footer="Timed. A full clear scores 10 and ranks on your time, shuffles included. A run that stops short scores by the share of the board cleared. Your first attempt counts."
    />
  );

  // ── the board ────────────────────────────────────────────────────────────
  const wU = (REL.maxX - REL.minX + 1) + REL.maxZ * OFF + 0.2 + 0.32;
  const hU = (REL.maxY - REL.minY + 1) * TH + REL.maxZ * OFF + 0.2 + 0.34;
  const padL = REL.maxZ * OFF + 0.2, padT = REL.maxZ * OFF + 0.2;
  const tw = 100 / wU, thPct = (TH / hU) * 100;
  const hintSet = g.hintPair && playing ? g.hintPair : [];
  const tiles = [];
  for (let i = 0; i < N; i++) {
    if (!on[i]) continue;
    const p = REL.pos[i];
    const ghost = peek != null && p.z >= peek;
    const isFreeT = free[i];
    const isSel = sel === i;
    const isHint = hintSet.indexOf(i) >= 0;
    const info = faceInfo(faces[i]);
    const pc = PRINT[info.hue];
    const full = isFreeT || peek != null || !playing;
    const face = isSel ? FACE_SEL : full ? FACE : FACE_BLOCKED;
    const zi = p.z * 10000 + Math.round((p.y + 3) * 2) * 100 + Math.round((p.x + 3) * 2) + (isSel || isHint ? 5000 : 0);
    const st = {
      position: 'absolute', margin: 0, padding: 0, fontFamily: SANS, color: INK,
      left: `${((p.x - REL.minX + padL - p.z * OFF) / wU) * 100}%`,
      top: `${(((p.y - REL.minY) * TH + padT - p.z * OFF) / hU) * 100}%`,
      width: `${tw}%`, height: `${thPct}%`, zIndex: zi,
      borderRadius: `${tw * 0.14}cqw`,
      cursor: ghost || !playing ? 'default' : isFreeT ? 'pointer' : 'not-allowed',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: isSel ? 'translate(-2px,-4px)' : 'none', transition: 'transform .12s ease',
      pointerEvents: ghost ? 'none' : 'auto',
      WebkitTapHighlightColor: 'transparent',
    };
    if (ghost) {
      st.background = 'transparent'; st.border = '1.5px solid var(--stg-line3, rgba(8,34,46,0.45))'; st.boxShadow = 'none';
    } else {
      st.background = face;
      st.border = `${tw * 0.018}cqw solid ${isSel ? INK : 'rgba(8,34,46,0.42)'}`;
      st.boxShadow = (isSel ? `0 0 0 ${tw * 0.045}cqw var(--stg-ink, ${INK}), ` : '') +
        `${tw * 0.045}cqw ${tw * 0.075}cqw 0 ${full ? EDGE : EDGE_BLOCKED}, ` +
        `${tw * 0.09}cqw ${tw * 0.15}cqw ${tw * 0.1}cqw rgba(8,34,46,0.28)`;
      if (isHint) { st.outline = `${tw * 0.04}cqw solid var(--stg-ink, ${INK})`; st.outlineOffset = `${tw * 0.03}cqw`; }
    }
    let body = null;
    if (!ghost) {
      const corner = <span aria-hidden="true" style={{ position: 'absolute', left: '9%', top: '4%', fontSize: `${tw * 0.17}cqw`, fontWeight: 800, color: INK, lineHeight: 1 }}>{info.corner}</span>;
      if (info.kind === 'dots' || info.kind === 'bam') {
        const pl = PIPS[info.n];
        body = (
          <>
            {corner}
            {pl.map(([x0, y0], q) => {
              const px = 10 + x0 * 0.84, py = 13 + y0 * 0.8;
              if (info.kind === 'dots') {
                return <span key={q} aria-hidden="true" style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, width: `${DOTSZ[info.n]}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)', borderRadius: '50%', boxSizing: 'border-box', border: `${tw * 0.014}cqw solid ${INK}`, background: `radial-gradient(circle, ${INK} 0 18%, ${pc} 19% 100%)` }} />;
              }
              const h = info.n === 1 ? 50 : info.n <= 3 ? 30 : info.n <= 6 ? 21 : 17;
              const w = info.n === 1 ? 15 : info.n <= 4 ? 11 : 9;
              return <span key={q} aria-hidden="true" style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, width: `${w}%`, height: `${h}%`, transform: 'translate(-50%,-50%)', borderRadius: `${tw * 0.03}cqw`, boxSizing: 'border-box', border: `${tw * 0.014}cqw solid ${INK}`, background: `linear-gradient(to bottom, ${pc} 0 45%, ${INK} 45% 53%, ${pc} 53% 100%)` }} />;
            })}
          </>
        );
      } else if (info.kind === 'white') {
        body = (
          <>
            {corner}
            <span aria-hidden="true" style={{ width: '54%', height: '56%', boxSizing: 'border-box', border: `${tw * 0.05}cqw solid ${pc}`, borderRadius: `${tw * 0.06}cqw`, boxShadow: `0 0 0 ${tw * 0.014}cqw ${INK}, inset 0 0 0 ${tw * 0.014}cqw ${INK}` }} />
          </>
        );
      } else {
        body = (
          <>
            {corner}
            <span aria-hidden="true" style={{ fontSize: `${tw * (info.sub ? 0.44 : 0.56)}cqw`, fontWeight: 800, color: info.numInk ? INK : pc, WebkitTextStroke: info.numInk ? '0' : `${tw * 0.03}cqw ${INK}`, paintOrder: 'stroke fill', lineHeight: 1.05, marginTop: `${tw * 0.06}cqw` }}>{info.glyph}</span>
            {info.sub ? <span aria-hidden="true" style={{ fontSize: `${tw * 0.3}cqw`, fontWeight: 800, color: pc, WebkitTextStroke: `${tw * 0.026}cqw ${INK}`, paintOrder: 'stroke fill', lineHeight: 1.1 }}>{info.sub}</span> : null}
          </>
        );
      }
    }
    tiles.push(
      <button key={i} type="button" style={st}
        onClick={ghost ? undefined : () => tapTile(i)}
        tabIndex={ghost || !playing ? -1 : 0}
        aria-pressed={isSel || undefined}
        aria-label={ghost ? 'Upper layer, hidden while looking under' : `${isFreeT ? 'Free' : 'Blocked'} tile: ${info.label}${isHint ? ', hinted' : ''}`}>
        {body}
      </button>
    );
  }

  const peekPills = [{ v: null, label: 'All' }];
  for (let z = REL.maxZ; z >= 1; z--) peekPills.push({ v: z, label: `Layer ${z}` });

  let status = '';
  if (peek != null) status = `Looking under: layer ${peek} and below. Tap All to keep playing.`;
  else if (stuck) status = 'No open pairs left. Undo is free, or shuffle for 30 seconds.';
  else if (sel >= 0) status = 'Now tap its match.';
  else status = `${open.length} open pair${open.length === 1 ? '' : 's'} on the board.`;

  // ── the phone stage ──────────────────────────────────────────────────────
  // Opens on Big tiles scrolled to the middle of the board; the map draws
  // every tile (free white, blocked gray, picked gold) with a box for the port.
  useEffect(() => {
    if (!(phoneStage && started)) return undefined;
    const t = setTimeout(() => {
      const el = portRef.current;
      if (el) { el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; readScroll(el); }
    }, 60);
    return () => clearTimeout(t);
  }, [phoneStage, started, bigTiles, readScroll]);
  const lookOrder = [null];
  for (let z = REL.maxZ; z >= 1; z--) lookOrder.push(z);
  const PHONE_TILE_PX = 46;
  let mahjStage = null;
  if (phoneStage && !!g.t0 && (playing || !revealed)) {
    const vr = (scr && bigTiles && scr.sw > 0 && scr.sh > 0)
      ? { l: (scr.sl / scr.sw) * 100, t: (scr.st / scr.sh) * 100, w: Math.min(100, (scr.cw / scr.sw) * 100), h: Math.min(100, (scr.ch / scr.sh) * 100) }
      : null;
    const minis = [];
    for (let i = 0; i < N; i++) {
      if (!on[i]) continue;
      const p = REL.pos[i];
      minis.push(<span key={i} style={{ position: 'absolute', left: `${((p.x - REL.minX + padL - p.z * OFF) / wU) * 100}%`, top: `${(((p.y - REL.minY) * TH + padT - p.z * OFF) / hU) * 100}%`, width: `${tw * 0.92}%`, height: `${thPct * 0.92}%`, background: sel === i ? '#fbbf24' : free[i] ? '#ffffff' : '#c3cad6', outline: '0.5px solid rgba(8,34,46,0.45)', borderRadius: 1, zIndex: p.z }} />);
    }
    const selInfo = sel >= 0 ? faceInfo(faces[sel]) : null;
    const msg = toast || (peek != null ? `Showing layer ${peek} and below. Tap Look again to go on.`
      : stuck ? 'No open pairs. Undo is free, or shuffle for 30 seconds.'
      : selInfo ? `${selInfo.label} picked. Tap its match.`
      : `${open.length} open pair${open.length === 1 ? '' : 's'}. Drag to move around the board.`);
    const jump = (e) => {
      const el = portRef.current;
      if (!el) return;
      const r = e.currentTarget.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      if (!bigTiles) setBigTiles(true);
      setTimeout(() => { try { el.scrollTo({ left: fx * el.scrollWidth - el.clientWidth / 2, top: fy * el.scrollHeight - el.clientHeight / 2, behavior: 'smooth' }); } catch (err) {} }, 40);
    };
    const lookNext = () => { const k = lookOrder.indexOf(peek); setPeek(lookOrder[(k + 1) % lookOrder.length]); setSel(-1); };
    mahjStage = (
      <PlayStage bg={gameColor(KEY)} label="Mahj" eyebrow={`${LAYOUT.name}${PUZZLE.sunday ? ' · Sunday Edition' : ''} · No. ${PUZZLE.num}`}
        top={(
          <>
            <style dangerouslySetInnerHTML={{ __html: `
.mjp-stats{display:flex;align-items:center;justify-content:center;gap:16px;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.mjp-stats b{font-size:16px;letter-spacing:0;margin-left:3px;font-variant-numeric:tabular-nums}
.mjp-row{display:flex;align-items:center;gap:10px}
.mjp-map{position:relative;height:58px;flex:none;border-radius:10px;border:2px solid var(--pst-ink);background:var(--pst-tint);padding:0;overflow:hidden}
.mjp-box{position:absolute;border:2px solid var(--pst-ink);border-radius:3px;z-index:20;pointer-events:none}
.mjp-note{font-size:12px;font-weight:700;line-height:1.3;opacity:.85}
.mjp-port::-webkit-scrollbar{display:none;width:0;height:0}
.mjp-port{height:calc(100dvh - 380px);min-height:260px;overflow:auto;scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;border-radius:18px;border:2px solid var(--pst-ink);background:color-mix(in srgb, #ffffff 55%, transparent);padding:10px;touch-action:pan-x pan-y}
.mjp-tray{display:flex;gap:8px}
.mjp-tray button{flex:1 1 0;min-width:0;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:16px;border:2px solid var(--pst-ink);background:transparent;font-size:12px;font-weight:800;padding:6px 2px}
.mjp-tray button.on{background:var(--pst-ink);color:var(--pst-bg)}
.mjp-tray button:disabled{opacity:.4;cursor:default}
` }} />
            <div className="mjp-stats" aria-live="off">
              <span>Time <b>{elapsed}</b></span>
              <span>Pairs <b>{pairsDone}/{PAIRS}</b></span>
              <span>Open <b>{open.length}</b></span>
            </div>
            <div className="mjp-row">
              <button type="button" className="mjp-map" style={{ aspectRatio: `${wU} / ${hU}` }} onClick={jump} aria-label="Map of the whole board. Tap to jump there.">
                {minis}
                {vr ? <span className="mjp-box" style={{ left: `${vr.l}%`, top: `${vr.t}%`, width: `${vr.w}%`, height: `${vr.h}%` }} /> : null}
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
                <div className="mjp-note">{bigTiles ? 'The box is where you are. Tap the map to jump.' : 'The whole board at once.'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className={'pst-tb' + (!bigTiles ? ' on' : '')} aria-pressed={!bigTiles} style={{ minHeight: 36, padding: '0 11px', fontSize: 12.5 }} onClick={() => setBigTiles(false)}>Whole board</button>
                  <button type="button" className={'pst-tb' + (bigTiles ? ' on' : '')} aria-pressed={bigTiles} style={{ minHeight: 36, padding: '0 11px', fontSize: 12.5 }} onClick={() => setBigTiles(true)}>Big tiles</button>
                </div>
              </div>
            </div>
            <div className="mjp-port" ref={portRef} onScroll={(e) => readScroll(e.currentTarget)}>
              <div className="mj-board" style={{ aspectRatio: `${wU} / ${hU}`, width: bigTiles ? `${PHONE_TILE_PX * wU}px` : '100%' }} role="group" aria-label={`The ${LAYOUT.name} layout, ${left} tiles left`}>
                {tiles}
              </div>
            </div>
          </>
        )}
        bottom={(
          <>
            <div className="pst-note" role="status">{msg}</div>
            <div className="mjp-tray">
              <button type="button" onClick={undo} disabled={!g.hist.length || peek != null}>
                <Undo2 size={22} aria-hidden="true" /><span>Undo</span>
              </button>
              {hintOk && !g.hintUsed ? (
                <button type="button" onClick={useHint} disabled={peek != null}><Lightbulb size={22} aria-hidden="true" /><span>Hint</span></button>
              ) : null}
              <button type="button" className={stuck ? 'on' : ''} onClick={shuffle} disabled={left <= 2 || peek != null}>
                <Shuffle size={22} aria-hidden="true" /><span>Shuffle +{SHUFFLE_PENALTY_S}s</span>
              </button>
              <button type="button" className={peek != null ? 'on' : ''} onClick={lookNext} aria-label="Look under the upper layers">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>
                <span>{peek != null ? `Layer ${peek}` : 'Look under'}</span>
              </button>
            </div>
          </>
        )}
        frac={pairsDone / PAIRS}
        giveUp={{ onPress: tapGiveUp, armed: !!armGive, armedLabel: 'Tap again to end the run' }}
      />
    );
  }

  const toolBtn = (props, label, icon, primary) => (
    <button type="button" className={'mj-tool' + (primary ? ' pri' : '')} {...props}>{icon}{label}</button>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {mahjStage}
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug={KEY} name={NAME} collapsed={started} loft={LOFT} />}
      {LOFT && (
        <Cap gameKey={KEY} quizId={PUZZLE.quizId}
          name={NAME}
          cat="Cards"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${LAYOUT.name}` : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: `${pairsDone}/${PAIRS}`, k: 'pairs' },
            { v: String(open.length), k: 'open pairs' },
          ] : [
            { v: score, k: score === 1 ? 'point' : 'points' },
            { v: `${pairsDone}/${PAIRS}`, k: 'pairs' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="mj-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 24px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.mj-wrap{padding-left:8px !important;padding-right:8px !important;}}
          .mj-btn{font-family:${SANS};font-weight:800;font-size:14px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,.35));background:transparent;color:${S_INK};border-radius:12px;padding:9px 16px;min-height:48px;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;}
          .mj-tool{font-family:${SANS};font-weight:800;font-size:13.5px;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,.35));background:transparent;color:${S_INK};border-radius:999px;padding:0 15px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;}
          .mj-tool:hover:not(:disabled){background:var(--stg-surf2, #f1f3f7);}
          .mj-tool:disabled{color:${S_MUTE};cursor:default;border-style:solid;}
          .mj-tool.pri:not(:disabled){background:${STAGE_C};border-color:${STAGE_C_INK};color:var(--stg-onramp, #ffffff);}
          .mj-tool.on{background:var(--stg-ink, ${INK});border-color:var(--stg-ink, ${INK});color:var(--stg-ground, #ffffff);}
          .mj-board{position:relative;width:100%;container-type:inline-size;touch-action:manipulation;}
          .mj-lab{font-family:${SANS};font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:${S_MUTE};}
          @media (prefers-reduced-motion: reduce){.mj-board button{transition:none !important;}}
        ` }} />

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
        <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ maxWidth: 680, margin: '0 auto', background: SURF, border: `1px solid ${SURF_B}`, borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: S_INK, marginBottom: 10 }}>{gateRules ? 'How to play' : `Today: the ${LAYOUT.name}`}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: S_INK, fontWeight: 600 }}>
                <p style={{ margin: 0 }}>All 144 tiles on the {LAYOUT.name}{PUZZLE.sunday ? ', the Sunday Edition' : ''}. Match pairs of free tiles until the board is empty. Timed, and every deal is proven clearable.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="mj-btn" onClick={startGame} style={{ background: STAGE_C, color: 'var(--stg-onramp, #ffffff)', borderColor: STAGE_C_INK, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: S_MUTE, textDecoration: 'underline' }}>
                  {gateRules ? 'Back' : 'How to play'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ marginBottom: 12 }}>
            {playing && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {hintOk && !g.hintUsed ? toolBtn({ onClick: useHint, disabled: peek != null, title: 'One free hint, on your first ever play' }, 'Hint', <Lightbulb size={15} />) : null}
                  {toolBtn({ onClick: undo, disabled: !g.hist.length || peek != null, title: 'Take back the last pair (free)' }, 'Undo', <Undo2 size={15} />)}
                  {toolBtn({ onClick: shuffle, disabled: left <= 2 || peek != null, title: `Redeal the tiles left into a clearable layout (+${SHUFFLE_PENALTY_S}s)` }, `Shuffle +${SHUFFLE_PENALTY_S}s`, <Shuffle size={15} />, stuck)}
                  {narrow ? toolBtn({ onClick: () => setZoom((z) => !z), 'aria-pressed': zoom }, zoom ? 'Fit' : 'Zoom', zoom ? <ZoomOut size={15} /> : <ZoomIn size={15} />) : null}
                </div>
                <div role="group" aria-label="Look under the upper layers" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <span className="mj-lab">Look Under</span>
                  {peekPills.map((pp) => (
                    <button key={String(pp.v)} type="button" className={'mj-tool' + (peek === pp.v ? ' on' : '')} aria-pressed={peek === pp.v}
                      onClick={() => { setPeek(pp.v); setSel(-1); }}>{pp.label}</button>
                  ))}
                </div>
              </div>
            )}
            {playing && (
              <div aria-live="polite" style={{ fontSize: 13.5, fontWeight: 700, color: stuck ? WARN : S_MUTE, minHeight: 20, marginBottom: 8 }}>{status}</div>
            )}
            {(
              <div style={{ background: 'var(--stg-surf, #f4f6f9)', border: `1px solid ${SURF_B}`, borderRadius: 20, padding: narrow ? 8 : 16, overflowX: zoom && narrow ? 'auto' : 'visible' }}>
                <div className="mj-board" style={{ aspectRatio: `${wU} / ${hU}`, width: zoom && narrow ? '190%' : '100%', maxWidth: zoom && narrow ? 'none' : 1120, margin: '0 auto' }} role="group" aria-label={`The ${LAYOUT.name} layout, ${left} tiles left`}>
                  {tiles}
                  {cleared && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                      <div className="mj-lab">Board cleared</div>
                      <div style={{ fontSize: 44, fontWeight: 800, color: S_INK, letterSpacing: '-0.03em' }}>{elapsed}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: S_MUTE }}>{g.shuffles ? `${g.shuffles} shuffle${g.shuffles === 1 ? '' : 's'} included · ` : ''}{g.undos} undo{g.undos === 1 ? '' : 's'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {started && (
              <div style={{ display: 'flex', justifyContent: narrow ? 'center' : 'flex-end', paddingTop: 12 }}>
                <button type="button" className="mj-tool" onClick={tapGiveUp}
                  title={armGive ? 'Ends the run now' : 'End the run now. Pairs already cleared count toward a partial score.'}
                  style={armGive ? { borderColor: WARN, color: WARN } : undefined}>
                  <Flag size={15} /> {armGive ? 'Tap again to give up' : 'Give up'}
                </button>
              </div>
            )}
            {!playing && (
              <div style={{ textAlign: 'center', padding: '12px 4px 0', fontSize: 14, fontWeight: 800, color: S_INK }}>
                {cleared ? `Cleared in ${elapsed}.` : `Stopped with ${pairsDone} of ${PAIRS} pairs cleared. ${score} point${score === 1 ? '' : 's'}.`}
              </div>
            )}
          </div>
        )}

        <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && !endHold.held && (
            <div style={{ maxWidth: 520, margin: '0 auto 6px', textAlign: 'center' }}>
              {!STAGE && isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 12.5, fontWeight: 800, color: WARN, marginTop: 8 }}>{myStats.cur}-day streak</div>
              )}
              {!STAGE && (<p style={{ fontSize: 12.5, fontWeight: 600, color: S_MUTE, marginTop: 12, lineHeight: 1.6 }}>
                {isTodays ? (
                  <>Next Mahj in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>. {PUZZLE.num > 1 && (<a href={`/mahj?p=${PUZZLE.num - 1}`} style={{ color: ACC_INK, fontWeight: 800 }}>Play yesterday&rsquo;s Mahj &rarr;</a>)}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel} archive. <a href="/mahj" style={{ color: ACC_INK, fontWeight: 800 }}>Back to today&rsquo;s Mahj &rarr;</a></>
                )}
                {' '}<a href="/archive" style={{ color: ACC_INK, fontWeight: 800 }}>Puzzle archive</a>
              </p>)}
            </div>
          )}
        </div>
        {LOFT && !playing && !endHold.held && revealed && (
          <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide the board</button>
        )}
        </div>
        {LOFT && !playing && !endHold.held && (
          <LoftFinish
            name="Mahj"
            catRank={catRank}
            outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
            title={won ? `Cleared in ${elapsed}` : `${pairsDone} of ${PAIRS} pairs`}
            detail={`${score} point${score === 1 ? '' : 's'} · ${pairsDone}/${PAIRS} pairs · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Mahj all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            archive={puzzles
              .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
              .sort((x, y) => y.num - x.num)
              .map((p) => ({
                num: p.num, dateLabel: p.dateLabel, sunday: !!p.sunday, href: `/mahj?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your time, no spoilers', kind: 'gold', onClick: copyShare },
              { tone: 'board', label: 'See the board', sub: cleared ? 'Every tile cleared' : 'Where your run stopped', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Mahj', sub: `No. ${prevPuzzle.num}, yesterday’s deal`, href: `/mahj?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { tone: 'replay', label: 'Replay', sub: 'This deal again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        </div>

        {!STAGE && <GamePanel self={KEY} name={NAME} onShow={() => setShowChrome(true)} />}

        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 680 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self={KEY} name={NAME} accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
            <DailyGamesGrid
              replay={!playing ? resetGame : null}
              self={KEY}
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              boardSlot={<DailyBoardPanel self={KEY} quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider
            />
          )}
          {!focusMode && mobileUi && !standalone && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="mj-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
            </div>
          )}
          <div id="stf-stats-slot" />
        </div>

        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.surface, border: '1px solid var(--stg-line)', borderRadius: 12, padding: 20, maxWidth: 380, fontFamily: SANS }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: S_INK, marginBottom: 8 }}>Add Mahj to your home screen</div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: S_INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                {isIosDevice() ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.' : 'Open your browser menu and choose Install app, or Add to Home screen.'}
              </p>
              <button className="mj-btn" onClick={() => setShowA2hsHelp(false)}>Got it</button>
            </div>
          </div>
        )}

        {!focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 680 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" />
          </div>
        )}
      </div>

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard modal self={KEY} won={won} onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'} onReplay={resetGame} onClose={() => setEndClosed(true)} quizId={PUZZLE.quizId} />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 26, zIndex: 60, background: INK, color: T.white, fontFamily: SANS, fontSize: 13.5, fontWeight: 700, padding: '10px 16px', borderRadius: 9, boxShadow: '0 6px 18px rgba(0,0,0,0.28)', maxWidth: '88vw', textAlign: 'center' }}>{toast}</div>
      )}

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self="KEY" name="NAME">
            {rulesBody}
          </HelpSheet>
      )}

      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: S_INK, margin: '0 0 8px' }}>About Mahj</h2>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: S_MUTE, lineHeight: 1.6, margin: '0 0 9px' }}>
          Mahj is mahjong solitaire as a daily puzzle: the full set of 144 tiles stacked in layers, cleared two of a kind at a time. A tile can only be picked when it is free, meaning nothing sits on top of it and its left or right side is open, so the order you clear in is the whole game.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: S_MUTE, lineHeight: 1.6, margin: '0 0 9px' }}>
          The layout changes with the day of the week: the Bridge on Monday, then the Fortress, the Cross, the Towers, the Wide and the Arena, and the classic Pyramid on Sunday, the Sunday Edition and the hardest deal of the week. Every deal is built so it can be cleared and checked by a separate program before it ships, and Look Under lets you read the tiles beneath before you commit, so a stuck board is a planning lesson rather than bad luck.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: S_MUTE, lineHeight: 1.6, margin: 0 }}>
          It is timed: a full clear ranks on the clock, and each shuffle adds thirty seconds. More card and tile dailies: <a href="/taire" style={{ color: ACC_INK, fontWeight: 800 }}>Taire</a>, <a href="/cell" style={{ color: ACC_INK, fontWeight: 800 }}>Cell</a>, <a href="/hands" style={{ color: ACC_INK, fontWeight: 800 }}>Hands</a>, <a href="/hold" style={{ color: ACC_INK, fontWeight: 800 }}>Hold</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
