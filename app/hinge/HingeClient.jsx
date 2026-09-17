'use client';

// Hinge — the daily compound-word chain.
//
// Each day: a chain of six words (eight on the Sunday Edition) where every
// neighbouring pair makes a compound word or a common two-word phrase, read
// downward: FIRE > PLACE > MAT > BOARD > GAME > PLAN is fireplace, placemat,
// mat board, board game, game plan. The player gets the first and last word and
// the letter count of every word between, and fills the chain top to bottom.
// ANY chain the vocabulary (lib/hinge-pairs.js) accepts counts, not only the
// setter's, and the end card shows the two side by side.
//
// A typed word that does not hinge is a DETOUR: it stays on the board, struck
// through on the link, and it is the tiebreak. The clock is the score. A word
// that is not a word at all, the wrong length, or already in the chain costs
// nothing, and tapping a word already placed clears it and everything below
// it for free, so a dead end is never a trap.
//
// Forked from app/sums/SumsClient.jsx (itself from Sixes) for the daily
// plumbing: banked puzzles gated by Eastern date on the server
// (app/hinge/page.js), per-puzzle localStorage saves, /hinge?p=N archive
// pinning, streaks, the one first-play hint, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone } from 'lucide-react';
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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { hinges, inVocab, HINGE_PAIRS } from '@/lib/hinge-pairs';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';


// Hinge identity is INDIGO, between the Word row's ambers and the crossword
// blues. The stage paints the Word category step; this pair only feeds the
// pre-stage surfaces.
const ACCENT = '#4f46e5';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#e0e7ff',
  accentTint: '#c7d2fe',
  accentDeep: '#3730a3',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_hinge_help_seen';
const STATS_KEY = 'sot_hinge_stats';
// A guess space thinner than this at some word length means the dictionary
// was truncated; that length then accepts any word rather than no word.
const DICT_COVER_MIN = 500;

// the vocabulary as a graph, once per page: word -> the words it hinges to
const NEXT = new Map();
for (const p of HINGE_PAIRS) { const [a, b] = p.split(' '); if (!NEXT.has(a)) NEXT.set(a, []); NEXT.get(a).push(b); }

// Is there ANY chain from the words placed so far to the end word, matching
// the letter counts (and any printed word) the rest of the way? Returns the
// next word of the first completion found, or null. This is what the hint
// fills and what the dead-end line reads.
function completion(fill, counts, given) {
  const L = counts.length;
  let i = 0;
  while (i < L && fill[i]) i++;
  if (i >= L) return null;
  const end = fill[L - 1];
  const used = new Set(fill.filter(Boolean));
  const walk = (w, k, first) => {
    if (k === L - 1) return w === end ? first : null;
    for (const nx of NEXT.get(w) || []) {
      if (nx.length !== counts[k + 1]) continue;
      if (k + 1 === L - 1) { if (nx === end) return first || nx; continue; }
      if (given[k + 1] && nx !== given[k + 1]) continue;
      if (used.has(nx)) continue;
      used.add(nx);
      const r = walk(nx, k + 1, first || nx);
      used.delete(nx);
      if (r) return r;
    }
    return null;
  };
  return walk(fill[i - 1], i - 1, null);
}

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
    const sc = Math.max(0, Math.min(10, Math.round(((m.scorePct || 0) / 100) * 10)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: 10, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

// `fill` is the chain as the player has it: the two ends and any printed word
// are in from the start, every other slot is null until hinged. `detours[i]`
// lists the real words rejected at slot i, in the order they were tried.
function freshState(p) {
  const L = p.words.length;
  const fill = Array(L).fill(null);
  fill[0] = p.words[0]; fill[L - 1] = p.words[L - 1];
  if (p.reveal != null) fill[p.reveal] = p.words[p.reveal];
  return {
    v: 1,
    fill,
    detours: Array.from({ length: L }, () => []),
    hintUsed: false,
    status: 'playing',             // playing | won | revealed
    t0: null,                      // stays null until the player presses Start
    tEnd: null,
  };
}

// Light haptics on supported devices (no-op on desktop / unsupported browsers).
const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }


export default function HingeClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const WORDS = PUZZLE.words;
  const L = WORDS.length;
  const COUNTS = useMemo(() => WORDS.map((w) => w.length), [WORDS]);
  // the words printed for the player: the ends, plus the Sunday reveal
  const GIVEN = useMemo(() => { const g = Array(L).fill(null); g[0] = WORDS[0]; g[L - 1] = WORDS[L - 1]; if (PUZZLE.reveal != null) g[PUZZLE.reveal] = WORDS[PUZZLE.reveal]; return g; }, [WORDS, L, PUZZLE.reveal]);
  const TO_FILL = useMemo(() => GIVEN.filter((w) => !w).length, [GIVEN]);
  const STORE_KEY = `sot_hinge_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState(PUZZLE));
  const [draft, setDraft] = useState('');
  const [shake, setShake] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('hinge', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('hinge'); }, [g.hintUsed]);
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
  const inputRef = useRef(null);
  const wordSetRef = useRef(null);
  const coveredLenRef = useRef(null);

  const fill = g.fill;
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('hinge');
  const STAGE = isStage('hinge', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('hinge');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('hinge'), '--stg-acc-lt': gameColorLight('hinge'), '--stg-onramp-lt': gameOnrampLight('hinge'), '--stg-acc-ink-lt': gameAccentInkLight('hinge') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'hinge', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'hinge', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'hinge', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'hinge', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'hinge', active: LOFT && !playing });

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
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

  // The dictionary that decides "a real word": the same list Crux validates
  // against, unioned with the vocabulary. A word in the list that does not
  // hinge is a detour; a string in neither costs nothing. Per Crux's rule, a
  // length the list barely covers accepts anything rather than nothing.
  useEffect(() => {
    fetch('/crux-words.txt')
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => {
        if (!t) return;
        const words = t.split('\n').filter((w) => /^[a-z]{2,}$/.test(w));
        if (words.length <= 10000) return;
        const byLen = new Map();
        for (const w of words) byLen.set(w.length, (byLen.get(w.length) || 0) + 1);
        coveredLenRef.current = new Set([...byLen].filter(([, n]) => n >= DICT_COVER_MIN).map(([len]) => len));
        wordSetRef.current = new Set(words);
      })
      .catch(() => {});
  }, []);
  const isRealWord = (w) => {
    if (inVocab(w)) return true;
    const set = wordSetRef.current;
    if (!set) return true;                       // list not loaded: be generous
    if (coveredLenRef.current && !coveredLenRef.current.has(w.length)) return true;
    return set.has(w.toLowerCase());
  };

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.fill) && saved.fill.length === L) {
          setG({ ...freshState(PUZZLE), ...saved, detours: Array.isArray(saved.detours) && saved.detours.length === L ? saved.detours : Array.from({ length: L }, () => []) });
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
    // same-device day breadcrumb for cross-puzzle recs — TODAY'S puzzle only,
    // and only once the clock is actually running (t0), because a save file
    // says 'playing' from the first render whether or not anyone has moved.
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_hinge_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_hinge_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock. Ticked from state while the game runs so the readout moves
  // on its own; the elapsed time RECORDED on the result is still a real
  // Date.now() delta taken at the moment the game ends.
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
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }


  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // the slot the player is on: the first empty one, reading down
  const cur = useMemo(() => fill.findIndex((w) => !w), [fill]);
  const hinged = useMemo(() => fill.filter((w, i) => w && !GIVEN[i]).length, [fill, GIVEN]);
  const detourCount = useMemo(() => g.detours.reduce((n, d) => n + d.length, 0), [g.detours]);
  // can the chain still be finished from here? read after every placement, so
  // a dead end is named the moment it happens rather than four words later
  const deadEnd = useMemo(() => playing && cur > 0 && !completion(fill, COUNTS, GIVEN), [playing, cur, fill, COUNTS, GIVEN]);

  useEffect(() => { if (started && cur >= 0 && inputRef.current) { try { inputRef.current.focus({ preventScroll: true }); } catch (e) {} } }, [started, cur]);

  const REC_KEY = `sot_hinge_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = hinged > 0 || detourCount > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: detourCount, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const det = g2.detours.reduce((n, d) => n + d.length, 0);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: det, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // A solve is the full 10. Detours are the tiebreak (guessesUsed), then
        // the clock, which is the daily board's own order: score, guesses, time.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: det, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((c) => (c.t0 ? c : { ...c, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // does W sit legally at slot i: hinges from above, and to whatever is
  // already printed or placed directly below (the end word, a Sunday reveal)
  function fits(i, w) {
    if (!hinges(fill[i - 1], w)) return false;
    if (fill[i + 1] && !hinges(w, fill[i + 1])) return false;
    return true;
  }

  function submit() {
    if (!playing || cur < 0) return;
    const w = draft.toUpperCase().replace(/[^A-Z]/g, '');
    if (!w) return;
    const bad = (msg) => { setShake((k) => k + 1); vibrate(HAPT.wrong); say(msg); };
    if (w.length !== COUNTS[cur]) { bad(`This word has ${COUNTS[cur]} letters.`); return; }
    if (fill.includes(w)) { bad(`${w} is already in the chain.`); return; }
    if (g.detours[cur].includes(w)) { bad(`${w} already cost a detour here.`); return; }
    if (!isRealWord(w)) { bad(`${w} is not in the word list. No cost.`); return; }
    const g2 = { ...g, fill: fill.slice(), detours: g.detours.map((d) => d.slice()) };
    if (!g2.t0) g2.t0 = Date.now();
    if (!fits(cur, w)) {
      g2.detours[cur] = [...g2.detours[cur], w];
      setG(g2);
      setDraft('');
      setShake((k) => k + 1); vibrate(HAPT.wrong);
      say(fill[cur + 1] ? `${fill[cur - 1]} ${w} or ${w} ${fill[cur + 1]}: one of those is not a hinge. That is a detour.` : `${fill[cur - 1]} ${w} is not a hinge. That is a detour.`);
      return;
    }
    g2.fill[cur] = w;
    setDraft('');
    if (g2.fill.every(Boolean)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2);
      setJustWon(true);
      return;
    }
    vibrate(HAPT.ok);
    setG(g2);
  }

  // Tapping a placed word clears it and everything below it, for free. That is
  // the way out of a dead end, and it never counts as a detour.
  function backTo(i) {
    if (!playing || GIVEN[i] || !fill[i]) return;
    const g2 = { ...g, fill: fill.map((w, k) => (k >= i && !GIVEN[k] ? null : w)) };
    setG(g2);
    setDraft('');
    say(`Back to ${fill[i - 1]}.`);
  }

  // One free hint: the next word of a chain that reaches the end from here.
  // On a dead end it names the problem instead of spending the hint.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed || cur < 0) return;
    const nx = completion(fill, COUNTS, GIVEN);
    if (!nx) { say(`No chain reaches ${fill[L - 1]} from here. Tap a word to back up; the hint is still yours.`); return; }
    const g2 = { ...g, fill: fill.slice(), hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    g2.fill[cur] = nx;
    setDraft('');
    if (g2.fill.every(Boolean)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2); setJustWon(true); return;
    }
    vibrate(HAPT.ok);
    setG(g2);
    say(`Hint placed: ${fill[cur - 1]} ${nx}.`);
  }

  function revealEnd() {
    const g2 = { ...g, fill: WORDS.slice(), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(PUZZLE)); setDraft(''); setJustWon(false); setEndClosed(false);
  }

  // the hinge that joins words i and i+1, as a reader would print it
  const hingeLabel = (a, b) => `${a}${b}`.toLowerCase();

  function shareText() {
    const det = detourCount;
    const chain = won ? fill.map((w, i) => (GIVEN[i] ? w : '▪'.repeat(w.length))).join(' › ') : `${WORDS[0]} › … › ${WORDS[L - 1]}`;
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Hinge #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${elapsed} · ${det} detour${det === 1 ? '' : 's'}${g.hintUsed ? ' · \u{1F4A1}' : ''}${streakBit}`
      : `Hinge #${PUZZLE.num} · gave up`;
    return `${head2}\n${chain}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/hinge${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Hinge #${PUZZLE.num} — the daily compound-word chain from Mind Loft.\n${shareUrl()}`
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
      lead="A chain of words. You have the first and the last. Fill the words between so every pair of neighbours makes a compound word or a phrase everyone knows, read downward: FIRE then PLACE is fireplace, PLACE then MAT is placemat."
      steps={[
        <><b>Type the next word and press Hinge.</b> The letter count under each slot is fixed; the words are not. If your chain holds, it counts, whether or not it is the one the setter had in mind.</>,
        <><b>A real word that does not hinge is a detour.</b> It stays on the board, struck through, and detours break ties. A word that is not in the list, has the wrong number of letters, or is already in the chain costs nothing.</>,
        <><b>Tap a word you placed to back up.</b> It clears that word and everything below it, for free. If the board says no chain reaches the last word from where you are, that is the way out.</>,
      ]}
      knack="Read the chain from both ends. The last word is a hinge too, so the word above it has to make a compound with it, which usually narrows that slot to one or two candidates before you get there."
      footer="Every day has at least one chain and never more than a handful. Finish and you score a perfect 10; the daily leaderboard ranks on the clock, with detours breaking ties. One free hint, on your first ever play, places the next word of a chain that reaches the end. Weekdays are six words; the Sunday Edition is eight, with one middle word printed."
    />
  );

  const slotCls = (i) => {
    if (GIVEN[i]) return 'hg-word given';
    if (fill[i]) return 'hg-word solved';
    if (i === cur) return 'hg-word active';
    return 'hg-word empty';
  };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="hinge" name="Hinge" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="hinge" quizId={PUZZLE.quizId}
          name="Hinge"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Eight words' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: String(detourCount), k: 'detours' },
            { v: `${hinged}/${TO_FILL}`, k: 'hinged' },
          ]}
        />
      )}
      <div className="hg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.hg-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .hg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .hg-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .hg-chain{display:flex;flex-direction:column;align-items:stretch;}
          .hg-word{display:flex;align-items:center;justify-content:center;gap:5px;min-height:44px;}
          .hg-cell{width:clamp(26px, 7.2vw, 36px);height:clamp(32px, 8.4vw, 42px);border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-weight:800;font-size:clamp(15px, 4.4vw, 20px);letter-spacing:0.02em;box-sizing:border-box;}
          .hg-word.given .hg-cell{background:${STAGE ? 'var(--stg-surf2)' : '#e9edf3'};color:${INK};}
          .hg-word.solved .hg-cell{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 22%, var(--stg-cell))' : COLORS.accentSoft};color:var(--stg-acc-ink, ${COLORS.accentDeep});cursor:pointer;}
          .hg-word.solved:hover .hg-cell{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 34%, var(--stg-cell))' : COLORS.accentTint};}
          .hg-word.active .hg-cell{border:1.5px solid var(--stg-acc, ${COLORS.accent});background:${STAGE ? 'var(--stg-cell)' : T.white};color:${INK};}
          .hg-word.active .hg-cell.cursor{box-shadow:inset 0 -3px 0 var(--stg-acc, ${COLORS.accent});}
          .hg-word.empty .hg-cell{border:1.5px dashed var(--stg-line2, rgba(28,30,36,0.3));background:transparent;color:${FADED};font-weight:600;}
          .hg-link{display:flex;align-items:center;justify-content:center;gap:8px;min-height:26px;font-size:11.5px;color:${FADED};flex-wrap:wrap;padding:0 8px;}
          .hg-link::before{content:'';width:1.5px;height:12px;background:var(--stg-line2, rgba(28,30,36,0.3));}
          .hg-h{font-family:${MONO};letter-spacing:0.06em;font-size:11px;color:var(--stg-acc-ink, ${COLORS.accent});}
          .hg-h.dim{font-family:${SANS};letter-spacing:0;font-weight:600;color:${FADED};}
          .hg-h.bad{color:var(--stg-bad, ${COLORS.rust});text-decoration:line-through;}
          .hg-in{width:100%;max-width:280px;font-family:${SANS};font-weight:800;font-size:22px;letter-spacing:0.18em;text-transform:uppercase;text-align:center;padding:10px 12px;border-radius:10px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-cell)' : T.white};color:${INK};outline:none;}
          .hg-in:focus{border-color:var(--stg-acc, ${COLORS.accent});}
          .hg-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          @keyframes hg-shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}
          .hg-shake{animation:hg-shake .42s cubic-bezier(.36,.07,.19,.97) both;}
          @media (prefers-reduced-motion: reduce){.hg-shake{animation:none;}}
          .hg-paths{display:grid;gap:8px;margin-top:12px;}
          .hg-path{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:12px;}
          .hg-who{flex:0 0 100%;font-family:${MONO};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${FADED};}
          .hg-pw{font-weight:800;padding:1px 6px;border-radius:5px;background:${STAGE ? 'var(--stg-surf2)' : '#e9edf3'};color:${INK};}
          .hg-pw.diff{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 22%, var(--stg-cell))' : COLORS.accentSoft};color:var(--stg-acc-ink, ${COLORS.accentDeep});}
          .hg-arr{color:${FADED};}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="hinge"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Eight words</span>}
          blocks={'HINGE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Hinge is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{L} words in a chain, from <b>{WORDS[0]}</b> to <b>{WORDS[L - 1]}</b>. Fill the {TO_FILL} between so every pair of neighbours makes a compound word or a phrase everyone knows. Any chain that holds counts.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="hg-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ whiteSpace: 'nowrap' }}>detours <b style={{ color: detourCount ? `var(--stg-bad, ${COLORS.rust})` : INK, fontWeight: 500 }}>{detourCount}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>hinged <b style={{ color: INK, fontWeight: 500 }}>{hinged}</b>/{TO_FILL}</span>
          </div>
          )}

          {/* the chain: every word a row of cells, every join a link that names
              its hinge once both sides are in */}
          <div key={shake} className={`hg-chain${shake ? ' hg-shake' : ''}`} style={{ maxWidth: 420, margin: '0 auto' }}>
            {fill.map((w, i) => (
              <React.Fragment key={i}>
                <div className={slotCls(i)} onClick={() => backTo(i)} role={fill[i] && !GIVEN[i] && playing ? 'button' : undefined} title={fill[i] && !GIVEN[i] && playing ? 'Tap to clear this word and everything below it' : undefined}>
                  {Array.from({ length: COUNTS[i] }).map((_, k) => {
                    const ch = w ? w[k] : (i === cur ? (draft.toUpperCase()[k] || '') : '');
                    const isCursor = !w && i === cur && k === Math.min(draft.length, COUNTS[i] - 1);
                    return <span key={k} className={`hg-cell${isCursor ? ' cursor' : ''}`}>{ch || (i === cur || w ? '' : '·')}</span>;
                  })}
                </div>
                {i + 1 < L && (
                  <div className="hg-link">
                    {fill[i] && fill[i + 1]
                      ? <span className="hg-h">{hingeLabel(fill[i], fill[i + 1])}</span>
                      : (g.detours[i + 1] && g.detours[i + 1].length
                        ? g.detours[i + 1].map((d) => <span key={d} className="hg-h bad">{hingeLabel(fill[i] || '', d)}</span>)
                        : <span className="hg-h dim">{fill[i] ? `${COUNTS[i + 1]} letters` : `${COUNTS[i + 1]} letters`}</span>)}
                    {fill[i] && !fill[i + 1] && g.detours[i + 1] && g.detours[i + 1].length > 0 && <span className="hg-h dim">{COUNTS[i + 1]} letters</span>}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {playing && cur >= 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <input
                ref={inputRef} className="hg-in" value={draft} inputMode="text" autoComplete="off"
                autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={COUNTS[cur]}
                placeholder={'_'.repeat(COUNTS[cur])}
                onChange={(e) => setDraft(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, COUNTS[cur]))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                aria-label={`Type the ${COUNTS[cur]}-letter word that hinges from ${fill[cur - 1]}`}
              />
              <button className="hg-btn" onClick={submit} disabled={draft.length !== COUNTS[cur]}
                style={{ background: draft.length === COUNTS[cur] ? `var(--stg-acc, ${COLORS.ink})` : `var(--stg-surf, ${T.white})`, color: draft.length === COUNTS[cur] ? `var(--stg-onramp, ${T.white})` : COLORS.faded, borderColor: draft.length === COUNTS[cur] ? `var(--stg-acc, ${COLORS.ink})` : undefined, opacity: draft.length === COUNTS[cur] ? 1 : 0.55, cursor: draft.length === COUNTS[cur] ? 'pointer' : 'default' }}>
                Hinge
              </button>
            </div>
          )}

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, color: deadEnd ? `var(--stg-bad, ${COLORS.rust})` : (playing ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})`) }}>
              {!playing
                ? (won ? `Chained in ${elapsed}${detourCount ? `, ${detourCount} detour${detourCount === 1 ? '' : 's'}` : ', no detours'}.` : 'The chain is shown above.')
                : (deadEnd
                  ? `No chain reaches ${fill[L - 1]} from ${fill[cur - 1]}. Tap a word to back up; that costs nothing.`
                  : `${fill[cur - 1]} then ${COUNTS[cur]} letters${cur === L - 2 ? `, which must also hinge to ${fill[L - 1]}` : ''}.`)}
            </span>
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {hinged > 0 && (
                <button className="hg-tool" onClick={() => backTo(fill.findIndex((w, i) => w && !GIVEN[i]))} title="Clear every word you placed, for free">
                  <RotateCcw size={14} /> Start over
                </button>
              )}
              {hintOk && !g.hintUsed && (
                <button className="hg-tool" onClick={useHint} title="Place the next word of a chain that reaches the end (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(79,70,229,0.5)', color: ACC_DEEP_INK }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})` }}>Any chain that holds counts. Tap a placed word to back up.</span>
            {identity && (hinged > 0 || detourCount > 0) && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and shows a chain' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              {/* Yours against the setter's, so a different valid chain reads as
                  a different route rather than a mistake */}
              <div className="hg-paths">
                {won && (
                  <div className="hg-path"><span className="hg-who">Yours</span>
                    {fill.map((w, i) => <React.Fragment key={i}>{i > 0 && <span className="hg-arr">›</span>}<span className={`hg-pw${w !== WORDS[i] ? ' diff' : ''}`}>{w}</span></React.Fragment>)}
                  </div>
                )}
                <div className="hg-path"><span className="hg-who">{won ? 'Setter' : 'One chain'}</span>
                  {WORDS.map((w, i) => <React.Fragment key={i}>{i > 0 && <span className="hg-arr">›</span>}<span className="hg-pw">{w}</span></React.Fragment>)}
                </div>
                <div style={{ fontSize: 12, color: FADED, fontWeight: 600 }}>
                  {WORDS.slice(0, -1).map((w, i) => hingeLabel(w, WORDS[i + 1])).join(', ')}.
                  {PUZZLE.paths > 1 ? ` The letter counts fit ${PUZZLE.paths} chains today.` : ' Only one chain fits the letter counts today.'}
                </div>
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: eight words, six to fill, one printed.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Hinge in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new chain drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/hinge?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Hinge &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/hinge" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Hinge &rarr;</a>
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
            name="Hinge"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Chained' : 'Not chained'}
            detail={`${hinged}/${TO_FILL} hinged · ${detourCount} detour${detourCount === 1 ? '' : 's'} · ${elapsed}`}
            missLabel="Detours"
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Hinge all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            archive={puzzles
              .filter((p) => p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/hinge?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the chain', sub: 'Yours beside the setter’s', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show a chain that works', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Hinge', sub: `No. ${prevPuzzle.num}, yesterday's chain`, href: `/hinge?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This chain again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        </div>

        {!STAGE && <GamePanel self="hinge" name="Hinge" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="hinge" name="Hinge" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="hinge"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="hinge" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Hinge to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s chain, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s chain, every day.
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
          self="hinge"
          won={won}
          headline={won ? <>Chained!</> : <>Chain revealed</>}
          subline={won
            ? <>chained in {elapsed} &middot; {detourCount} detour{detourCount === 1 ? '' : 's'}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>a working chain is shown above</>}
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
            <button className="hg-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Hinge</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Hinge is a free daily word chain from Mind Loft. Each day gives you the first and last word of a chain and the letter count of every word between, and every pair of neighbours has to make a compound word or a phrase everyone knows: FIRE then PLACE is a fireplace, PLACE then MAT is a placemat, and so on down to the last word. It is the before-and-after game, played as a ladder.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The words are not fixed, only the letter counts are. Any chain the game&rsquo;s vocabulary accepts counts, and when you finish you see your chain beside the setter&rsquo;s. A real word that does not hinge is a detour: it stays on the board, struck through, and detours break ties on the daily leaderboard, where the clock is the score. Tapping a word you placed clears it and everything below it for free, so a dead end is never a trap, and the board tells you the moment no chain can reach the end from where you are.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new chain drops every day at midnight Eastern. Weekdays are six words with four to fill; the Sunday Edition is eight words with six to fill and one of them printed. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. Like the shape? <a href="/rung" style={{ color: INK, fontWeight: 800 }}>Rung</a> is the ladder that changes one letter at a time, and <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a> sorts sixteen words into four groups.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
