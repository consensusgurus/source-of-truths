'use client';

// Niche — the daily trivia grid.
//
// Each day: a 3x3 grid (4x4 on the Sunday Edition) whose rows and columns are
// category headers from ONE universe — a different universe every day of the
// week (Sunday Countries, Monday US States, Tuesday Animals, Wednesday Movies,
// Thursday TV Shows, Friday Pro Sports Teams, Saturday Musicians). Fill every
// cell with an answer satisfying BOTH its row and its column. An answer can be
// used once per board, every attempt spends a guess (12 on a weekday, 20 on
// Sunday), and the flex is RARITY: after each correct pick you see what share
// of today's players picked the same answer for that cell, and the rarer your
// board the better the brag. Rarity is display and share flair ONLY — the
// score is cells filled, so the leaderboard never depends on when in the day
// you played.
//
// Facts and validity live in app/niche/facts.js, the single source of truth
// the bank generator and verifier also read. Rarity tallies come from
// /api/niche (niche_picks, migration 54) and degrade to nothing if the table
// is missing. Same daily plumbing as every other board: banked puzzles gated
// by Eastern date on the server (app/niche/page.js), per-puzzle localStorage
// saves, /niche?p=N archive pinning, streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Eye, Smartphone, CornerDownLeft } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { UNIVERSE_MAP, attrById, cellMembers, searchMembers, normAnswer } from './facts';

// Niche identity is DEEP TEAL, distinct from every live Trivia sibling
// (Dating violet, Extra red, Bracket orange, Listed magenta, Streak crimson,
// Redact charcoal, Deep dark blue, Fib dark violet).
const ACCENT = '#115e59';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#ecfdf8',
  accentTint: '#cdf0e8',
  accentDeep: '#0b3f3b',
  gold: '#b45309',
  goldSoft: '#fff7e6',
  green: T.successDeep,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_niche_help_seen';
const STATS_KEY = 'sot_niche_stats';
const RARE_PCT = 10;   // a filled cell at or under this share is a "rare find"

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

// ─── personal stats + streak (localStorage), the shared daily pattern ───────
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
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const cellsOf = p.rows.length * p.cols.length;
    const sc = Math.max(0, Math.min(cellsOf, Math.round(((m.scorePct || 0) / 100) * cellsOf)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: cellsOf, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { ok: [8], miss: [30], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function NicheClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const U = UNIVERSE_MAP[PUZZLE.universe];
  const SIZE = PUZZLE.rows.length;
  const CELLS = SIZE * SIZE;
  const GUESSES = CELLS + (PUZZLE.sunday ? 4 : 3);
  const STORE_KEY = `sot_niche_${PUZZLE.num}`;
  const rowAttrs = useMemo(() => PUZZLE.rows.map((id) => attrById(U, id)), [PUZZLE, U]);
  const colAttrs = useMemo(() => PUZZLE.cols.map((id) => attrById(U, id)), [PUZZLE, U]);

  function freshState() {
    return {
      v: 1,
      picks: Array(CELLS).fill(null),  // canonical member name per cell
      rar: {},                         // cell index -> % of today's players with the same pick
      misses: 0,
      status: 'playing',               // playing | won | done
      t0: null,                        // stays null until the first real action: opening
      tEnd: null,                      // a game is not starting one (see CLAUDE.md)
    };
  }

  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(-1);
  const [query, setQuery] = useState('');
  const [hot, setHot] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armEnd, setArmEnd] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [fieldSize, setFieldSize] = useState(null);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const inputRef = useRef(null);

  const picks = g.picks;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const filled = useMemo(() => picks.filter(Boolean).length, [picks]);
  const guessesUsed = filled + g.misses;
  const guessesLeft = Math.max(0, GUESSES - guessesUsed);
  const LOFT = isLoft('niche');
  const STAGE = isStage('niche', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('niche');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('niche'), '--stg-acc-lt': gameColorLight('niche'), '--stg-onramp-lt': gameOnrampLight('niche'), '--stg-acc-ink-lt': gameAccentInkLight('niche') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'niche', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'niche', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'niche', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'niche', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'niche', active: LOFT && !playing });

  useEffect(() => {
    if (!armEnd) return undefined;
    const t = setTimeout(() => setArmEnd(false), 3500);
    return () => clearTimeout(t);
  }, [armEnd]);
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

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length === CELLS) {
          setG({ ...freshState(), ...saved, rar: saved.rar && typeof saved.rar === 'object' ? saved.rar : {} });
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
    // same-device day breadcrumb — TODAY'S puzzle only, and only once the
    // clock is actually running (t0): a save says 'playing' from the first
    // render whether or not anyone has moved.
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_niche_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_niche_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock (display only; the recorded time is a real delta).
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
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  // ---- metrics + leaderboard (the shared /api/quiz/* flow) ----
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
            if (d && Array.isArray(d.recent)) {
              setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles));
            }
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

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const usedNames = useMemo(() => new Set(picks.filter(Boolean)), [picks]);
  const suggestions = useMemo(() => {
    if (!playing || sel < 0 || !query.trim()) return [];
    return searchMembers(U, query, 7);
  }, [playing, sel, query, U]);

  const REC_KEY = `sot_niche_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts. Opening the puzzle and
    // dismissing the start gate does not log a 0-score attempt.
    const acted = g.picks.some(Boolean) || g.misses > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: g.picks.filter(Boolean).length, total: CELLS, correct: 0, guessesUsed: g.misses, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const score = g2.picks.filter(Boolean).length;
    const isWon = g2.status === 'won';
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: CELLS, g: g2.misses, won: isWon })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: CELLS, correct: isWon ? 1 : 0, guessesUsed: g2.misses, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Rarity: post the ballot after every correct pick (and on finish) and fold
  // the returned per-cell shares in. Fire-and-forget: if the route or table is
  // missing the game plays exactly the same, just without the percentages.
  function postPicks(nextPicks) {
    try {
      fetch('/api/niche', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, picks: nextPicks, anonId: getAnonId(), email: identity?.email || undefined }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!d || d.error || !d.pct) return;
          setFieldSize(Number.isFinite(d.field) ? d.field : null);
          setG((cur) => ({ ...cur, rar: { ...cur.rar, ...d.pct } }));
        })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock and marks the rules seen. A no-op once
  // started, so re-reading the rules never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setSel(0);
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 50);
  }

  const nextEmpty = (ps, from) => {
    for (let k = 1; k <= CELLS; k++) { const i = (from + k) % CELLS; if (!ps[i]) return i; }
    return -1;
  };

  function finish(g2) {
    const done = { ...g2, status: g2.picks.every(Boolean) ? 'won' : 'done', tEnd: Date.now() };
    if (!done.t0) done.t0 = Date.now();
    if (done.status === 'won') { vibrate(HAPT.win); setJustWon(true); }
    postResult(done);
    postPicks(done.picks);
    setSel(-1);
    setQuery('');
    setG(done);
  }

  function submitPick(member) {
    if (!playing || sel < 0 || picks[sel] || !member) return;
    if (usedNames.has(member.t)) { say(`${member.t} is already on the board. One use per answer.`); return; }
    const r = Math.floor(sel / SIZE), c = sel % SIZE;
    const ra = rowAttrs[r], ca = colAttrs[c];
    const okRow = ra.test(member);
    const okCol = ca.test(member);
    const g2 = { ...g, picks: picks.slice() };
    if (!g2.t0) g2.t0 = Date.now();
    setQuery('');
    setHot(0);
    if (okRow && okCol) {
      g2.picks[sel] = member.t;
      vibrate(HAPT.ok);
      if (g2.picks.every(Boolean)) { finish(g2); return; }
      if (filled + 1 + g2.misses >= GUESSES) { finish(g2); return; }
      postPicks(g2.picks);
      setG(g2);
      const nx = nextEmpty(g2.picks, sel);
      if (nx >= 0) setSel(nx);
      return;
    }
    g2.misses += 1;
    vibrate(HAPT.miss);
    const bad = [!okRow && ra.label, !okCol && ca.label].filter(Boolean).join('" or "');
    say(`${member.t} doesn't fit "${bad}". That guess is spent.`);
    if (filled + g2.misses >= GUESSES) { finish(g2); return; }
    setG(g2);
  }

  function endNow() {
    if (!playing) return;
    finish({ ...g });
  }

  const onKey = useCallback((e) => {
    if (!playing || sel < 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHot((h) => Math.min(h + 1, Math.max(0, suggestions.length - 1))); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHot((h) => Math.max(0, h - 1)); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (suggestions[hot]) submitPick(suggestions[hot]); return; }
    if (e.key === 'Escape') { setQuery(''); setHot(0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, suggestions, hot, g]);

  function shareText() {
    // One emoji per cell, row by row. Green = filled, gold = a rare find
    // (10% of the field or less), white = never filled. No answers leak.
    const lines = [];
    for (let r = 0; r < SIZE; r++) {
      let line = '';
      for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        if (!picks[i]) line += '⬜';
        else if (g.rar[i] != null && g.rar[i] <= RARE_PCT) line += '\u{1F7E8}';
        else line += '\u{1F7E9}';
      }
      lines.push(line);
    }
    const rarBits = Object.entries(g.rar).filter(([i]) => picks[Number(i)]);
    const raritySum = rarBits.length === filled && filled > 0 && (fieldSize == null || fieldSize >= 5)
      ? ` · rarity ${Math.round(rarBits.reduce((s, [, v]) => s + v, 0))}`
      : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Niche #${PUZZLE.num} · ${U.name}${PUZZLE.sunday ? ' · Sunday' : ''} · ${filled}/${CELLS}${won ? ` in ${elapsed}` : ''}${raritySum}${streakBit}`;
    return `${head}\n${lines.join('\n')}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/niche${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Niche #${PUZZLE.num} — the daily trivia grid from Mind Loft. Today's universe: ${U.name}.\n${shareUrl()}`
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

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setSel(-1); setQuery(''); setHot(0); setJustWon(false); setEndClosed(false); setArmEnd(false);
  }

  // Example answers for the cells that never got filled, shown on the finished
  // board. Computed from the same facts the game judges by; prefers answers
  // not already used elsewhere on the board.
  const examples = useMemo(() => {
    if (playing) return {};
    const out = {};
    for (let i = 0; i < CELLS; i++) {
      if (picks[i]) continue;
      const r = Math.floor(i / SIZE), c = i % SIZE;
      const all = cellMembers(U, PUZZLE.rows[r], PUZZLE.cols[c]).map((m) => m.t);
      const fresh = all.filter((t) => !usedNames.has(t));
      out[i] = (fresh.length ? fresh : all).slice(0, 2);
    }
    return out;
  }, [playing, picks, U, PUZZLE, usedNames, CELLS, SIZE]);

  const selRow = sel >= 0 ? Math.floor(sel / SIZE) : -1;
  const selCol = sel >= 0 ? sel % SIZE : -1;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={`Fill every cell with a ${U.noun} that fits BOTH its row and its column. A different universe every day of the week, and today's is ${U.name}.`}
      steps={[
        <><b>Tap a cell, then type.</b> The suggestions only offer real answers from today&apos;s universe, so pick one to lock it in.</>,
        <>Every attempt spends a guess, right or wrong, and you have <b>{GUESSES} for the {CELLS} cells</b>. An answer can only be used <b>once per board</b>.</>,
        <>After a correct pick you see what share of today&apos;s players chose the same answer. <b>Rarer picks are the flex</b>, but they change nothing about the score.</>,
      ]}
      knack="Scan the whole board before you spend anything: the obvious answer for one cell is often the ONLY answer for another. Spend your first guesses where the categories pinch tightest."
      footer={`Your score is cells filled, ${CELLS} for a clean board, and misses then time break ties. Only your first attempt counts on the leaderboard. Sundays are a 4x4 Edition on the Countries universe.`}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="niche" name="Niche" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="niche" quizId={PUZZLE.quizId}
          name="Niche"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : (filled > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 4x4' : null}
          figures={playing
            ? [
              { v: `${filled}/${CELLS}`, k: 'filled' },
              { v: String(guessesLeft), k: 'guesses left' },
              { v: elapsed, k: 'time' },
            ]
            : [
              { v: `${filled}/${CELLS}`, k: 'score' },
              { v: String(g.misses), k: 'misses' },
              { v: elapsed, k: 'time' },
            ]}
        />
      )}
      <div className="nc-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.nc-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .nc-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accentDeep};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .nc-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .nc-head{display:flex;align-items:center;justify-content:center;text-align:center;font-family:${SANS};font-weight:800;color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent);border:1.5px solid var(--stg-surf2, ${COLORS.accentTint});border-radius:8px;padding:6px 4px;line-height:1.22;min-height:44px;}
          .nc-cell{position:relative;border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.22));border-radius:8px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 5px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;min-height:58px;overflow:hidden;}
          .nc-cell.filled{border-color:var(--stg-surf2, ${COLORS.accentTint});background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent);cursor:default;}
          .nc-cell.rare{border-color:var(--stg-warn, ${COLORS.gold});background:${STAGE ? 'color-mix(in srgb, var(--stg-warn) 20%, transparent)' : COLORS.goldSoft};box-shadow:0 0 0 2px rgba(180,83,9,0.18);}
          .nc-cell.sel{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 2.5px color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 25%, transparent);}
          .nc-cell.miss{background:${STAGE ? 'var(--stg-surf2)' : '#fafbfc'};}
          .nc-ans{font-weight:800;font-size:12.5px;line-height:1.15;text-align:center;color:${INK};overflow-wrap:anywhere;}
          .nc-rar{font-family:${MONO};font-size:9.5px;color:${FADED};}
          .nc-rar.gold{color:#8a6415;font-weight:500;}
          .nc-plus{font-size:19px;font-weight:600;color:var(--stg-mute2, #c3c8d1);}
          .nc-ex{font-size:10.5px;line-height:1.25;color:#9aa0ab;font-style:italic;text-align:center;}
          .nc-input{width:100%;border:none;outline:none;font-family:${SANS};font-size:15px;font-weight:700;color:${INK};background:transparent;}
          .nc-dd{position:absolute;top:calc(100% + 5px);left:0;right:0;background:${STAGE ? 'var(--stg-raise)' : 'var(--white)'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.2));border-radius:10px;box-shadow:0 10px 26px rgba(0,0,0,0.16);z-index:20;overflow:hidden;}
          .nc-dd button{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:none;border-radius:0;padding:9px 12px;font-family:${SANS};font-size:13.5px;font-weight:700;color:${INK};cursor:pointer;}
          .nc-dd button.hot{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent);color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};}
          .nc-dd button .nc-sub{margin-left:auto;font-family:${MONO};font-size:10px;color:${FADED};font-weight:400;}
          .nc-dd button.used{opacity:0.45;cursor:default;}
          .nc-pips{display:flex;gap:4px;align-items:center;}
          .nc-pip{width:9px;height:9px;border-radius:50%;background:var(--stg-acc, ${COLORS.accent});}
          .nc-pip.spent{background:#d6dae1;}
        ` }} />

        <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="niche"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 4x4</span>}
          blocks={'NICHE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Niche is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Today&apos;s universe: <b>{U.name}</b>. Fill every cell with a {U.noun} that fits both its row and its column, in {GUESSES} guesses. The rarer your answers, the bigger the brag.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="nc-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>filled <b style={{ color: filled === CELLS ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{filled}</b>/{CELLS}</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>guesses left <b style={{ color: INK, fontWeight: 500 }}>{guessesLeft}</b></span>
          </div>
          )}

          {/* universe chip + guess pips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 6, padding: '4px 10px' }}>
              Universe &middot; {U.name}
            </span>
            {playing && (
              <span className="nc-pips" style={{ marginLeft: 'auto' }} aria-label={`${guessesLeft} guesses left`}>
                {Array.from({ length: GUESSES }).map((_, i) => (
                  <span key={i} className={`nc-pip${i < guessesUsed ? ' spent' : ''}`} />
                ))}
              </span>
            )}
          </div>

          {/* the grid: column headers across the top, row headers down the side */}
          <div style={{ display: 'grid', gridTemplateColumns: `minmax(72px, 0.8fr) repeat(${SIZE}, 1fr)`, gap: 6 }}>
            <div />
            {colAttrs.map((a) => (
              <div key={a.id} className="nc-head" style={{ fontSize: SIZE === 4 ? 11 : 12 }}>{a.label}</div>
            ))}
            {rowAttrs.map((ra, r) => (
              <React.Fragment key={ra.id}>
                <div className="nc-head" style={{ fontSize: SIZE === 4 ? 11 : 12 }}>{ra.label}</div>
                {colAttrs.map((ca, c) => {
                  const i = r * SIZE + c;
                  const name = picks[i];
                  const pct = g.rar[i];
                  const rare = name && pct != null && pct <= RARE_PCT;
                  const cls = `nc-cell${name ? ' filled' : ''}${rare ? ' rare' : ''}${i === sel ? ' sel' : ''}${!playing && !name ? ' miss' : ''}`;
                  return (
                    <div key={ca.id} className={cls}
                      onClick={() => {
                        if (!playing || name) return;
                        setSel(i); setQuery(''); setHot(0);
                        setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 30);
                      }}>
                      {name ? (
                        <>
                          <span className="nc-ans" style={{ fontSize: SIZE === 4 ? 11 : 12.5 }}>{name}</span>
                          {pct != null && (
                            <span className={`nc-rar${rare ? ' gold' : ''}`}>{rare ? `${pct}% · rare find` : `${pct}% picked`}</span>
                          )}
                        </>
                      ) : playing ? (
                        <span className="nc-plus">+</span>
                      ) : (
                        <span className="nc-ex">{(examples[i] || []).length ? <>e.g. {(examples[i] || []).join(', ')}</> : ''}</span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* the answer bar */}
          {playing && (
            <div style={{ position: 'relative', marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, border: `2px solid ${sel >= 0 ? `var(--stg-acc, ${COLORS.accent})` : 'rgba(28,30,36,0.25)'}`, borderRadius: 10, padding: '9px 12px', background: STAGE ? SURF : T.white }}>
                <input
                  ref={inputRef}
                  className="nc-input"
                  value={query}
                  placeholder={sel >= 0
                    ? `A ${U.noun}: ${rowAttrs[selRow].label} + ${colAttrs[selCol].label}`
                    : 'Tap an empty cell first'}
                  disabled={sel < 0}
                  onChange={(e) => { setQuery(e.target.value); setHot(0); }}
                  onKeyDown={onKey}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  aria-label="Type an answer"
                />
                {suggestions.length > 0 && <CornerDownLeft size={15} color={COLORS.faded} />}
              </div>
              {suggestions.length > 0 && (
                <div className="nc-dd">
                  {suggestions.map((m, i) => {
                    const used = usedNames.has(m.t);
                    return (
                      <button key={m.t} className={`${i === hot ? 'hot' : ''}${used ? ' used' : ''}`}
                        onMouseEnter={() => setHot(i)}
                        onClick={() => { if (!used) submitPick(m); }}>
                        <span>{m.t}</span>
                        {used ? <span className="nc-sub">used</span> : (U.id === 'movies' || U.id === 'tv') && m.y ? <span className="nc-sub">{m.y}</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Controls sit INSIDE the card: on the navy stage a bare row of
              faded text has nothing to sit on. */}
          {started && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                {sel >= 0 ? 'Suggestions only offer answers from the universe. Wrong fits still cost a guess.' : 'Tap an empty cell to answer it.'}
              </span>
              {filled + g.misses > 0 && (
                <button onClick={() => { if (armEnd) { if (Date.now() - armEnd < ARM_MIN_MS) return; setArmEnd(false); endNow(); } else { setArmEnd(Date.now()); } }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armEnd ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armEnd ? 'Tap again — ends the board and scores it' : 'End & score'}
                </button>
              )}
            </div>
          )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition &mdash; sixteen cells on the Countries universe.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Niche in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new grid drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/niche?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Niche &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/niche" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Niche &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
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
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Niche"
            catRank={catRank}
            outcome={won ? 'won' : (filled > 0 ? 'part' : 'lost')}
            title={won ? 'Solved' : (filled > 0 ? 'Partly solved' : 'Not solved')}
            detail={`${filled}/${CELLS} · ${g.misses} ${g.misses === 1 ? 'miss' : 'misses'} · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Niche all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            missLabel="Misses"
            archive={puzzles
              .filter((p) => p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/niche?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished grid, rarity and all', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'See the board', sub: 'Example answers for what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Niche', sub: `No. ${prevPuzzle.num}, a different universe`, href: `/niche?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your grid and rarity, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This board again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        {/* end of the play stage; everything below is the light tail */}
        </div>

        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="niche" name="Niche" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="niche" name="Niche" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="niche"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="niche" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Niche to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens the day&apos;s grid, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens the day&apos;s grid, every day.
                </p>
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
        <DailyEndCard
          modal
          self="niche"
          won={won}
          headline={won ? <>Grid solved!</> : <>Board scored</>}
          subline={won
            ? <>all {CELLS} in {elapsed}</>
            : <>{filled}/{CELLS} filled</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="nc-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Niche — crawlable prose, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Niche</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Niche is a free daily trivia grid from Mind Loft. Each day gives you a 3x3 grid whose rows and columns are broad categories from one universe, and every cell wants an answer that fits both at once: a country that is landlocked AND borders France, an animal that lays eggs AND lives in the water. Twelve guesses cover the nine cells, every attempt spends one, and an answer can only be used once per board.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The universe changes with the day of the week: Countries on Sunday, US States on Monday, Animals on Tuesday, Movies on Wednesday, TV Shows on Thursday, Pro Sports Teams on Friday, and Musicians on Saturday. The score is cells filled, but the real flex is rarity: after every correct pick you see what share of today&apos;s players chose the same answer, and a pick almost nobody found is the one worth sharing.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new grid drops every day at midnight Eastern, and Sundays step up to a 4x4 Edition on the Countries universe. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. For more trivia, try <a href="/deep" style={{ color: INK, fontWeight: 800 }}>Deep</a>, one subject and fifteen questions, <a href="/listed" style={{ color: INK, fontWeight: 800 }}>Listed</a>, rank eight real things, or <a href="/redact" style={{ color: INK, fontWeight: 800 }}>Redact</a>, uncover the story.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
