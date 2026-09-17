'use client';

// Yose — the daily Go endgame.
//
// The territories are settled. What is left is a handful of open points, a few
// loose stones that can still be taken, and exactly one move (sometimes two on
// the easy days) that keeps the win. lib/yose-core.js solves every position
// the board can reach, so White answers perfectly and a point given away never
// comes back.
//
// Three things to hold on to while reading this file:
//
//   1. a pass is a MOVE. The move list stores points, -1 for a pass, and the
//      sides strictly alternate. Two passes in a row end the game, and the
//      position is counted by area (stones plus surrounded empty points);
//   2. the ko ban is part of the position. replay() re-derives it from the move
//      list, so a reload can never lift a ban the player is still under;
//   3. nothing on the board says the round is lost while you can still play.
//      `errors` counts every Black move that lowers the value of the position,
//      it is posted, and it only APPEARS once the stones are counted.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, RotateCcw, Smartphone, Hand } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold, { HOLD_SHORT, HOLD_LONG } from '../useEndHold';
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
import { makeYose, replay, BLACK, WHITE, EMPTY, BTERR, WTERR, pointName, COLS } from '@/lib/yose-core';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#44403c',
  accentSoft: '#efedeb',
  green: T.successDeep,
};

// The board is the stage surface, the grid is its line. Your stones take the
// category colour, filled; White takes the ground, lifted. Both are tokens, so
// the picture holds on either register. SVG presentation attributes cannot read
// a custom property, so every paint below goes through a style prop.
const BOARD = 'var(--stg-surf, #d9b36c)';
const GRID = 'var(--stg-line2, #5b4118)';
const STONE_YOU = 'var(--stg-acc, #16181c)';
// White's stones are a literal pair, not a token: the stage surface tokens are
// translucent on one register, and a see-through stone shows the grid through
// it. A pale stone with a dark rim reads on the white board and the dark one.
const STONE_FOE = '#e7e5e4';
const STONE_FOE_EDGE = '#78716c';
const DOT = 'var(--stg-cell-dot, rgba(0,0,0,0.28))';
const DOT_HOT = 'var(--stg-cell-dot2, rgba(0,0,0,0.6))';
const MARK = 'var(--stg-ink, #b45309)';

const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_yose_help_seen';
const STATS_KEY = 'sot_yose_stats';

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
// A small deterministic order, so everyone who spends the hint sees the same rings.
function idOrder(seed, n) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
// What Black has to finish with. komi is (perfect margin - 0.5), so the
// smallest winning margin is komi + 0.5, a whole number.
function needText(komi) {
  const need = Math.round(komi + 0.5);
  if (need > 0) return `finish at least ${need} ahead`;
  if (need === 0) return 'finish level or ahead';
  return `finish no more than ${-need} behind`;
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
  const byId = new Map(puzzles.map((p) => [p.quizId, p.num]));
  let touched = false;
  for (const m of recent) {
    if (!m || m.attempt !== 1) continue;
    const num = byId.get(m.quizId);
    if (!num || s.rec[num]) continue;
    const score = typeof m.scorePct === 'number' ? Math.round((m.scorePct / 100) * 10) : 0;
    s.rec[num] = { s: score, t: 10, g: m.guessesUsed || 0, won: score >= 10 };
    touched = true;
  }
  if (touched) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {} }
  return s;
}

const HAPT = { ok: [7], take: [6, 18, 6], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

function freshState() {
  return { v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

export default function YoseClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_yose_${PUZZLE.num}`;
  const eng = useMemo(() => makeYose(PUZZLE), [PUZZLE]);
  const N = PUZZLE.size;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [hoverPt, setHoverPt] = useState(null);
  const [shake, setShake] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [armPass, setArmPass] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('yose', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('yose'); }, [g.hintUsed]);
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
  const replyTimer = useRef(null);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('yose');
  const STAGE = isStage('yose', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('yose');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('yose'), '--stg-acc-lt': gameColorLight('yose'), '--stg-onramp-lt': gameOnrampLight('yose'), '--stg-acc-ink-lt': gameAccentInkLight('yose') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const won = g.status === 'won';
  const errors = g.errors;
  const endScore = won ? 10 : 0;

  // ── the position, replayed from the move list ───────────────────────────
  const view = useMemo(() => {
    const r = replay(eng, g.moves);
    const area = eng.area(r.board);
    const myTurnNow = !r.over && r.toMove === BLACK;
    const legal = myTurnNow ? eng.legal(r.board, BLACK, r.ban) : [];
    return {
      ...r,
      cells: Array.from(r.board),
      area,
      legalSet: new Set(legal.map((m) => m.p)),
      lastCap: new Set(r.lastCap || []),
    };
  }, [eng, g.moves]);

  const myTurn = playing && started && view.toMove === BLACK && !view.over;

  // Warm the value table while the player reads the board. The first search is
  // the expensive one (a Sunday board is a hundred thousand positions); every
  // later question is a lookup.
  useEffect(() => {
    const t = setTimeout(() => { try { eng.rootValue(); } catch (e) {} }, 60);
    return () => clearTimeout(t);
  }, [eng]);

  // A hint rings three open points, one of which wins. Deterministic from the
  // puzzle id so every player who spends it sees the same three.
  const hintSet = useMemo(() => {
    const out = PUZZLE.key.slice(0, 3);
    const legal = eng.legal(eng.start, BLACK, -1).map((m) => m.p);
    const order = idOrder(`${PUZZLE.quizId}-hint`, legal.length);
    for (const i of order) { if (out.length >= 3) break; if (!out.includes(legal[i])) out.push(legal[i]); }
    return new Set(out);
  }, [PUZZLE, eng]);

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
        if (saved && saved.v === 1 && Array.isArray(saved.moves)) {
          // A save that no longer replays (a board edited under it) starts clean.
          try { replay(eng, saved.moves); const next = { ...freshState(), ...saved }; gRef.current = next; setG(next); }
          catch (e) {}
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
        if (done || g.t0) localStorage.setItem('sot_yose_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_yose_day');
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

  const myStats = useMemo(() => deriveStats(stats, PUZZLE.num), [stats, PUZZLE.num]);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'yose', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'yose', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'yose', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'yose', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'yose', active: LOFT && !playing });

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }
  function commit(next) { gRef.current = next; setG(next); }

  // HOW FAR THIS RUN GOT (migration 51): Black moves that kept the value.
  function progressOf(g2) {
    const black = Math.ceil((g2.moves || []).length / 2);
    return Math.max(0, black - (g2.errors || 0));
  }

  const REC_KEY = `sot_yose_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.errors, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.errors, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.errors, progress: progressOf(g2), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  const SCORE = { won: 10, lost: 0, gaveup: 0 };
  function finish(g2, status) {
    const done = { ...g2, status, tEnd: Date.now() };
    if (!done.t0) done.t0 = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(done, SCORE[status] ?? 0);
    endHold.hold(status === 'lost' ? HOLD_LONG : HOLD_SHORT);
    commit(done);
  }

  function startGame() {
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    commit({ ...gRef.current, t0: Date.now() });
  }

  // The value of the position after `p` (a point, or -1 to pass) is played by
  // the side to move. Used only to count errors; never shown.
  function valueAfter(r, p, color) {
    const other = color === BLACK ? WHITE : BLACK;
    if (p < 0) return r.passed ? eng.margin(r.board) : eng.value(r.board, other, true, -1, false);
    const m = eng.play(r.board, p, color, r.ban);
    if (!m) return null;
    return eng.value(m.board, other, false, m.ko, false);
  }

  function applyMove(p, isPlayer) {
    const cur = gRef.current;
    const r = replay(eng, cur.moves);
    if (r.over) return;
    const color = r.toMove;
    let nextErrors = cur.errors;
    if (isPlayer) {
      const before = eng.value(r.board, BLACK, r.passed, r.ban, false);
      const after = valueAfter(r, p, BLACK);
      if (after === null) return;
      // Counted, never announced. The verdict waits for the count.
      if (after < before) nextErrors += 1;
      vibrate(HAPT.ok);
    } else if (p >= 0 && !eng.play(r.board, p, color, r.ban)) {
      return;
    }
    const moves = cur.moves.concat([p]);
    const next = { ...cur, moves, errors: nextErrors };
    if (!next.t0) next.t0 = Date.now();
    const after = replay(eng, moves);
    if (after.over) {
      finish(next, eng.margin(after.board) - PUZZLE.komi > 0 ? 'won' : 'lost');
      return;
    }
    commit(next);
  }

  function onPoint(p) {
    if (!playing || !started) return;
    if (view.toMove !== BLACK || thinking) { setShake((s) => s + 1); return; }
    if (view.cells[p] !== EMPTY || eng.slot[p] < 0) return;
    if (!view.legalSet.has(p)) {
      if (p === view.ban) say('Ko: you cannot take back at once. Play somewhere else first.');
      else say('No liberties there. That stone would be captured on the spot.');
      setShake((s) => s + 1);
      return;
    }
    setArmPass(false);
    applyMove(p, true);
  }

  function passTurn() {
    if (!myTurn || thinking) return;
    if (!armPass) {
      setArmReveal(false);
      setArmRestart(false);
      setArmPass(Date.now());
      setTimeout(() => setArmPass(false), 3500);
      return;
    }
    if (Date.now() - armPass < ARM_MIN_MS) return;
    setArmPass(false);
    applyMove(-1, true);
  }

  // White answers on a timer so Black's stone paints first.
  useEffect(() => {
    if (!hydrated || !playing || !g.t0) return undefined;
    const r = replay(eng, g.moves);
    if (r.over || r.toMove !== WHITE) { setThinking(false); return undefined; }
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing') { setThinking(false); return; }
      const now = replay(eng, cur.moves);
      if (now.over || now.toMove !== WHITE) { setThinking(false); return; }
      const mv = eng.engineMove(now.board, now.passed, now.ban);
      setThinking(false);
      if (mv) applyMove(mv.p, false);
    }, 430);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, g.t0, g.moves.length]);

  // Say White's pass out loud: the one thing a silent board cannot show.
  const passSaid = useRef(-1);
  useEffect(() => {
    if (!started || !view.last || view.last.p >= 0 || view.last.by !== WHITE) return;
    if (passSaid.current === g.moves.length) return;
    passSaid.current = g.moves.length;
    say('White passes. Pass back to end the game and count, or play on.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, g.moves.length]);

  function useHint() {
    if (!hintOk || g.hintUsed) return;
    commit({ ...gRef.current, hintUsed: true, t0: gRef.current.t0 || Date.now() });
    say('One of the ringed points keeps the win.');
  }

  function revealEnd() {
    if (!armReveal) {
      setArmRestart(false);
      setArmPass(false);
      setArmReveal(Date.now());
      setTimeout(() => setArmReveal(false), 3500);
      return;
    }
    if (Date.now() - armReveal < ARM_MIN_MS) return;
    setArmReveal(false);
    finish(gRef.current, 'gaveup');
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    passSaid.current = -1;
    commit({ ...freshState(), t0: Date.now() });
    setEndClosed(false);
    setHoverPt(null);
    setArmReveal(false);
    setArmRestart(false);
    setArmPass(false);
  }

  function restartGame() {
    if (!armRestart) {
      setArmReveal(false);
      setArmPass(false);
      setArmRestart(Date.now());
      setTimeout(() => setArmRestart(false), 3500);
      return;
    }
    if (Date.now() - armRestart < ARM_MIN_MS) return;
    setArmRestart(false);
    const cur = gRef.current;
    if (cur.status === 'playing' && cur.t0) {
      postResult({ ...cur, status: 'gaveup', tEnd: Date.now() }, SCORE.gaveup);
    }
    resetGame();
  }

  async function a2hsClick() {
    if (installEvt) {
      try { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); return; } catch (e) {}
    }
    setShowA2hsHelp(true);
  }

  const finalMargin = view.area.black - view.area.white;
  const net = finalMargin - PUZZLE.komi;
  function shareUrl() {
    return withRef(`mindloftdaily.com/yose${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const good = won ? Math.max(1, 5 - Math.min(4, errors)) : 0;
    const squares = won ? '\u{1F7E9}'.repeat(good) + '⬜'.repeat(5 - good) : g.status === 'lost' ? '\u{1F7E5}' + '⬜'.repeat(4) : '⬜'.repeat(5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const verdict = won ? `won by ${net}` : g.status === 'lost' ? `lost by ${-net}` : 'gave up';
    const missBit = g.status === 'gaveup' ? '' : ` · ${errors === 0 ? 'clean' : `${errors} error${errors === 1 ? '' : 's'}`}`;
    return `Yose #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${verdict}${missBit} · ${elapsed}${hintBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Yose #${PUZZLE.num}, the daily Go endgame from Mind Loft.\n${shareUrl()}`
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
      lead="Go, picked up at the very end. The walls are built and the territories are settled; a handful of open points decide who wins. You play the coloured stones."
      banner={<>{PUZZLE.pts.length} open points. To win you must <b>{needText(PUZZLE.komi)}</b>, and perfect play wins by exactly half a point.</>}
      steps={[
        <><b>Tap an open point</b> to place a stone. Only the open points are in play: the marked squares are settled territory and nobody may play there.</>,
        <>A stone or group with no empty neighbour is <b>captured</b> and comes off. You may not play a stone that would have no liberty itself.</>,
        <><b>Ko:</b> after a single stone takes a single stone, the other side may not take straight back. Play somewhere else first.</>,
        <><b>Pass</b> when nothing is worth playing. Two passes in a row end the game, and it is counted by <b>area</b>: your stones plus the empty points only you surround.</>,
        <>White answers perfectly and nothing is taken back. One free <b>hint</b>, on your first ever play, rings three points, one of which wins.</>,
      ]}
      knack="The biggest point is not always the right one. A move that threatens something White must answer keeps the turn, and sente is worth more than a slightly bigger gote move. Count what each move gains and what the reply costs, then play the one that still leaves you on move."
      footer="Winning scores 10, anything else 0. The board ranks on how many tries it took, then the clock. Sundays step up to a 9x9 board."
    />
  );

  const statusLine = () => {
    if (!playing) {
      const b = view.area.black, w = view.area.white;
      if (won) return `Counted: you ${b}, White ${w}, komi ${PUZZLE.komi}. You win by ${net}.`;
      if (g.status === 'lost') return `Counted: you ${b}, White ${w}, komi ${PUZZLE.komi}. White wins by ${-net}.`;
      return 'You ended it there. The winning point is still on the board.';
    }
    if (thinking || view.toMove === WHITE) return 'White is answering...';
    if (!started) return 'Ready when you are.';
    if (view.last && view.last.p < 0 && view.last.by === WHITE) return 'White passed. Your move, or pass to end it.';
    return g.moves.length === 0 ? 'Your move. One point keeps this.' : 'Your move.';
  };

  // ── board drawing ────────────────────────────────────────────────────────
  const revealKey = won;
  const U = 40;                       // one grid step in SVG units
  const PAD = 34;
  const SIZE = PAD * 2 + U * (N - 1);
  const at = (i) => ({ x: PAD + (i % N) * U, y: PAD + ((i / N) | 0) * U });
  const lines = [];
  for (let k = 0; k < N; k++) {
    lines.push(<line key={`h${k}`} x1={PAD} y1={PAD + k * U} x2={PAD + (N - 1) * U} y2={PAD + k * U} style={{ stroke: GRID, strokeWidth: 1.4 }} />);
    lines.push(<line key={`v${k}`} x1={PAD + k * U} y1={PAD} x2={PAD + k * U} y2={PAD + (N - 1) * U} style={{ stroke: GRID, strokeWidth: 1.4 }} />);
  }
  const pieces = [];
  for (let i = 0; i < N * N; i++) {
    const { x, y } = at(i);
    const v = view.cells[i];
    const open = myTurn && view.legalSet.has(i);
    const isOpenPt = eng.slot[i] >= 0;
    const hot = open && hoverPt === i;
    const hinted = playing && g.hintUsed && g.moves.length === 0 && hintSet.has(i);
    const isKey = revealKey && PUZZLE.key.includes(i);
    const fresh = view.last && view.last.p === i;
    if (v === BLACK || v === WHITE) {
      pieces.push(
        <circle key={`s${i}`} className={fresh ? 'yo-fresh' : undefined} cx={x} cy={y} r={U * 0.46}
          style={{ fill: v === BLACK ? STONE_YOU : STONE_FOE, stroke: v === BLACK ? 'rgba(0,0,0,0.35)' : STONE_FOE_EDGE, strokeWidth: 1.2 }} />,
      );
      if (fresh) pieces.push(<circle key={`l${i}`} cx={x} cy={y} r={U * 0.13} style={{ fill: v === BLACK ? STONE_FOE : STONE_YOU }} />);
    } else if (v === BTERR || v === WTERR) {
      const s = U * 0.26;
      pieces.push(<rect key={`t${i}`} x={x - s / 2} y={y - s / 2} width={s} height={s} rx={2}
        style={{ fill: v === BTERR ? STONE_YOU : STONE_FOE, stroke: v === BTERR ? 'none' : STONE_FOE_EDGE, strokeWidth: 1, opacity: 0.9 }} />);
    } else if (isOpenPt && open) {
      pieces.push(<circle key={`d${i}`} cx={x} cy={y} r={U * (hot ? 0.16 : 0.11)} style={{ fill: hot ? DOT_HOT : DOT }} />);
    }
    if (view.lastCap.has(i) && v === EMPTY) {
      pieces.push(<circle key={`c${i}`} cx={x} cy={y} r={U * 0.3} style={{ fill: 'none', stroke: GRID, strokeWidth: 1.2, strokeDasharray: '3 3' }} />);
    }
    if (hinted) pieces.push(<circle key={`h${i}`} cx={x} cy={y} r={U * 0.44} style={{ fill: 'none', stroke: MARK, strokeWidth: 2.6 }} />);
    if (isKey) pieces.push(<circle key={`k${i}`} className="yo-key" cx={x} cy={y} r={U * 0.5} style={{ fill: 'none', stroke: MARK, strokeWidth: 3 }} />);
    if (isOpenPt) {
      pieces.push(
        <rect key={`z${i}`} x={x - U / 2} y={y - U / 2} width={U} height={U}
          style={{ fill: 'transparent', cursor: open ? 'pointer' : 'default' }}
          onMouseEnter={() => open && setHoverPt(i)}
          onMouseLeave={() => setHoverPt(null)}
          onClick={() => onPoint(i)} />,
      );
    }
  }
  const coords = [];
  for (let k = 0; k < N; k++) {
    coords.push(<text key={`cx${k}`} x={PAD + k * U} y={SIZE - 6} textAnchor="middle" style={{ fill: FADED, fontFamily: MONO, fontSize: 10 }}>{COLS[k]}</text>);
    coords.push(<text key={`cy${k}`} x={10} y={PAD + k * U + 3.5} textAnchor="middle" style={{ fill: FADED, fontFamily: MONO, fontSize: 10 }}>{N - k}</text>);
  }

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="yose" name="Yose" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="yose" quizId={PUZZLE.quizId}
          name="Yose"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 9×9' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: `${view.area.black}–${view.area.white}`, k: 'area' },
            { v: PUZZLE.komi, k: 'komi' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'errors' },
            { v: `${view.area.black}–${view.area.white}`, k: 'area' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="yo-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.yo-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .yo-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accent};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accent};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .yo-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .yo-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:104px;box-sizing:border-box;}
          .yo-svg{display:block;width:100%;height:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;}
          .yo-fresh{animation:yopop .26s ease;transform-box:fill-box;transform-origin:center;}
          @keyframes yopop{0%{transform:scale(0.3);}70%{transform:scale(1.06);}100%{transform:scale(1);}}
          .yo-key{animation:yokey 1.15s ease-in-out infinite;}
          @keyframes yokey{0%,100%{opacity:1;}50%{opacity:0.35;}}
          .yo-board.shake{animation:yoshake .34s ease;}
          @keyframes yoshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
          @media (prefers-reduced-motion: reduce){.yo-fresh,.yo-key,.yo-board.shake{animation:none;}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Yose is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>{PUZZLE.pts.length} open points on a {N}×{N} board. To win you must {needText(PUZZLE.komi)}, and perfect play gets there by half a point. White answers perfectly.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="yo-btn" onClick={startGame} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, borderColor: STAGE ? STAGE_C : T.cta, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
              {!LOFT && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {!playing && <span>errors <b style={{ color: INK, fontWeight: 500 }}>{errors}</b></span>}
                <span>time <b style={{ color: INK, fontWeight: 500 }}>{elapsed}</b></span>
                <span style={{ marginLeft: 'auto' }}>komi <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.komi}</b></span>
              </div>
              )}

              <div style={{ fontSize: 12.5, fontWeight: 700, color: FADED, textAlign: 'center', marginBottom: 8 }}>
                To win: {needText(PUZZLE.komi)} on area.
              </div>

              <div style={{ maxWidth: 470, margin: '0 auto' }}>
                <div key={shake} className={`yo-board${shake ? ' shake' : ''}`} style={{ background: BOARD, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, overflow: 'hidden' }}>
                  <svg className="yo-svg" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Go board, ${N} by ${N}`}>
                    {lines}
                    {pieces}
                    {coords}
                  </svg>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: endHold.held ? 15 : 13.5, fontWeight: endHold.held ? 800 : 700, color: INK }}>{statusLine()}</div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: STONE_YOU, display: 'inline-block' }} /> you
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: STONE_FOE, border: '1px solid rgba(28,30,36,0.3)', display: 'inline-block', marginLeft: 4 }} /> white
                </div>
              </div>

              {playing && hintOk && !g.hintUsed && g.moves.length === 0 && started && (
                <div style={{ marginTop: 10 }}>
                  <button className="yo-tool" onClick={useHint} title="Ring three points, one of which wins (one hint, first play only)">
                    <Lightbulb size={14} /> Hint
                  </button>
                </div>
              )}

          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 11, borderTop: `1px solid ${SURF_B}`, flexWrap: 'wrap' }}>
              <button className="yo-tool" onClick={passTurn} disabled={!myTurn} style={{ opacity: myTurn ? 1 : 0.5, borderColor: armPass ? 'var(--stg-warn, #b45309)' : undefined }}>
                <Hand size={14} /> {armPass ? 'Press to pass' : 'Pass'}
              </button>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className="yo-tool" onClick={revealEnd} style={{ borderColor: armReveal ? COLORS.rust : undefined, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : undefined }}>
                  <Eye size={14} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button className="yo-tool" onClick={restartGame} title="Record this as a loss and deal the same board again" style={{ borderColor: armRestart ? COLORS.rust : undefined, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : undefined }}>
                  <RotateCcw size={14} /> {armRestart ? 'Press again' : 'Restart'}
                </button>
              </span>
            </div>
          )}
            </div>
          )}

          <div className={STAGE ? undefined : 'loft-sol'}>
            {!playing && !endHold.held && (
              <div style={{ maxWidth: 472, margin: '0 auto 6px' }}>
                {won ? (
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: INK, marginBottom: 6 }}>
                    {PUZZLE.key.length > 1 ? 'The winning first moves' : 'The winning first move'}: <span style={{ color: ACC_INK }}>{PUZZLE.key.map((p) => pointName(p, N)).join(' or ')}</span>, ringed on the board.
                  </div>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, lineHeight: 1.55 }}>
                    We are not naming the point. The win is still in this position, so take another run at it.
                  </div>
                )}
                {PUZZLE.sunday && (
                  <div style={{ fontSize: 12.5, fontStyle: 'italic', color: FADED, marginTop: 8 }}>The Sunday Edition, on the full 9×9.</div>
                )}
                {isTodays && myStats.cur >= 2 && (
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--stg-warn, #b45309)', marginTop: 8 }}>{myStats.cur}-day streak</div>
                )}
                <p style={{ fontSize: 12.5, fontWeight: 600, color: FADED, marginTop: 12, lineHeight: 1.6 }}>
                  {isTodays ? (
                    <>Next Yose in <b style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>. {PUZZLE.num > 1 && (<a href={`/yose?p=${PUZZLE.num - 1}`} style={{ color: ACC_INK, fontWeight: 800 }}>Play yesterday&rsquo;s Yose &rarr;</a>)}</>
                  ) : (
                    <>You&rsquo;re playing the {PUZZLE.dateLabel} archive. <a href="/yose" style={{ color: ACC_INK, fontWeight: 800 }}>Back to today&rsquo;s Yose &rarr;</a></>
                  )}
                  {' '}<a href="/daily" style={{ color: ACC_INK, fontWeight: 800 }}>All daily puzzles</a>
                </p>
              </div>
            )}
          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Yose"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} · ${errors} errors · ${view.area.black}–${view.area.white} area · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Yose all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Tries"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/yose?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Yose', sub: `No. ${prevPuzzle.num}, yesterday’s puzzle`, href: `/yose?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
          </div>

          {!STAGE && <GamePanel self="yose" name="Yose" onShow={() => setShowChrome(true)} />}

          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="yose" name="Yose" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid
              replay={!playing ? resetGame : null}
              self="yose"
              maxWidth={620}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              boardSlot={<DailyBoardPanel self="yose" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
              divider
            />
            )}
            {!focusMode && mobileUi && !standalone && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button className="yo-tool" onClick={a2hsClick}><Smartphone size={14} /> Add to Home Screen</button>
              </div>
            )}
          </div>

          {showA2hsHelp && (
            <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: 20, maxWidth: 380, fontFamily: SANS }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Yose to your home screen</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: INK, lineHeight: 1.55, margin: '0 0 14px' }}>
                  {isIosDevice()
                    ? 'Tap the Share button in Safari, scroll down, and choose Add to Home Screen.'
                    : 'Open your browser menu and choose Install app, or Add to Home screen.'}
                </p>
                <button className="yo-btn" onClick={() => setShowA2hsHelp(false)}>Got it</button>
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
          self="yose"
          won={won}
          defeat
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
              <button className="yo-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
            </div>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: INK, margin: '0 0 8px' }}>About Yose</h2>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          Yose is the Japanese word for the endgame of Go, the part of the game after the big fights, when the walls are up and the last few points are shared out. Professionals count it exactly, and a game between strong players is often decided there by a single point.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: '0 0 9px' }}>
          The skill is order. Every open point is worth something, but a move that forces an answer keeps the turn, and the side that keeps the turn takes the next point too. That is why the biggest point on the board is so often the wrong one.
        </p>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: FADED, lineHeight: 1.6, margin: 0 }}>
          Every board is solved to the last stone, ko included, and checked so that exactly one first move keeps the win on most days. More endgames: <a href="/turn" style={{ color: ACC_INK, fontWeight: 800 }}>Turn</a>, <a href="/four" style={{ color: ACC_INK, fontWeight: 800 }}>Four</a>, <a href="/mate" style={{ color: ACC_INK, fontWeight: 800 }}>Mate</a>, <a href="/chain" style={{ color: ACC_INK, fontWeight: 800 }}>Chain</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
