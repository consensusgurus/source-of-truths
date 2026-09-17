'use client';

// Rung — the daily word ladder.
//
// Change one letter at a time, and every rung has to be a word. Get from the
// start word to the target in as few rungs as you can.
//
// Two numbers, and they are not the same number (the 2026-07-31 rework: "par"
// used to BE the shortest ladder, which reads backwards, since par is what an
// ordinary round lands on, not the best line that exists). PERFECT is the exact
// shortest ladder, found by breadth-first search over the shipped word list and
// confirmed by an independent bidirectional search before the board ever
// shipped, and it scores 10. PAR sits a cushion above it and scores 8; see
// lib/par.js. Floor of 1, so finishing always beats walking away. Weekday
// perfect lines are 10 to 12 rungs and Sundays 15 or more.
//
// THE WORD LIST IS THE RULES. A rung must be one of the 1,294 common five-letter
// words in VOCAB, and perfect was computed over exactly that list. Validating
// against anything wider would let a player find a shorter ladder than perfect
// through vocabulary the solver never saw, and it would stop meaning anything.
//
// No undo, only a restart. You can always walk backwards by retyping an earlier
// word, which costs a rung, and that is the honest price.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, Smartphone, RotateCcw } from 'lucide-react';
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
import { parFor, stepFor, scoreFor } from '@/lib/par';
import DailyMasthead from '../DailyMasthead';
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
import { isLoft } from '@/lib/loft';
import { VOCAB } from './puzzles';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#155e75',        // Rung identity — deep teal
  accentSoft: '#e4f2f6', green: T.successDeep,
};
const TILE = '#f3f1ea';
const TILE_EDGE = '#d5d0c4';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_rung_help_seen';
const STATS_KEY = 'sot_rung_stats';

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

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const freshState = () => ({ v: 1, rungs: [], restarts: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null });
const differsByOne = (a, b) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { d++; if (d > 1) return false; }
  return d === 1;
};

export default function RungClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_rung_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [draft, setDraft] = useState('');
  const [shake, setShake] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
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
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('rung', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('rung'); }, [g.hintUsed]);
  // eslint-disable-next-line no-unused-vars -- see the note in CruxClient: the
  // player chip now lives in DailyChrome, the fetch stays for the stats merge.
  const [player, setPlayer] = useState(null);
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
  const inputRef = useRef(null);
  const shakeRef = useRef(null);
  const ladderRef = useRef(null);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('rung');
  const STAGE = isStage('rung', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('rung');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('rung'), '--stg-acc-lt': gameColorLight('rung'), '--stg-onramp-lt': gameOnrampLight('rung'), '--stg-acc-ink-lt': gameAccentInkLight('rung') };
  const [stageTheme] = useStageTheme();
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
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const used = g.rungs.length;
  // PUZZLE.par is the banked exact shortest ladder, i.e. PERFECT. The banked
  // field keeps its old name so no archived board has to be rewritten.
  const perfect = PUZZLE.par;
  const par = parFor(perfect);
  const step = stepFor(perfect);
  const finalScore = won ? scoreFor(used, perfect) : 0;

  const ladder = useMemo(() => [PUZZLE.start, ...g.rungs], [PUZZLE, g.rungs]);
  const current = ladder[ladder.length - 1];
  const WORDS = useMemo(() => new Set(VOCAB), []);
  // The neighbour map, built once. 1,294 connected words is a few milliseconds,
  // and it exists only to power the hint.
  const ADJ = useMemo(() => {
    const buckets = new Map();
    for (const w of VOCAB) {
      for (let i = 0; i < 5; i++) {
        const k = `${w.slice(0, i)}_${w.slice(i + 1)}`;
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(w);
      }
    }
    const adj = new Map(VOCAB.map((w) => [w, []]));
    for (const list of buckets.values()) {
      for (let a = 0; a < list.length; a++) {
        for (let b = a + 1; b < list.length; b++) {
          adj.get(list[a]).push(list[b]);
          adj.get(list[b]).push(list[a]);
        }
      }
    }
    return adj;
  }, []);

  useEffect(() => { gRef.current = g; }, [g]);
  // Replay the shake animation WITHOUT remounting the subtree (a key change here used to
  // rebuild the input element, so a rejected climb silently dropped keyboard focus and the
  // player had to re-click the box before they could backspace). Also pull focus back to the
  // input when the attempt came from the Climb button.
  useEffect(() => {
    if (!shake) return;
    const el = shakeRef.current;
    if (el) {
      el.classList.remove('rg-shake');
      void el.offsetWidth;
      el.classList.add('rg-shake');
    }
    try { inputRef.current?.focus(); } catch (e) {}
  }, [shake]);
  // The ladder is a capped scroll box, so once the climb runs past the visible area a new
  // rung lands below the fold and the player had to scroll by hand to follow their own
  // guesses. Pin the box to the newest word whenever the ladder grows (twice, so the
  // second pass catches the row after layout settles).
  useEffect(() => {
    const el = ladderRef.current;
    if (!el) return undefined;
    const go = () => {
      try { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }
      catch (e) { el.scrollTop = el.scrollHeight; }
    };
    go();
    const id = setTimeout(go, 70);
    return () => clearTimeout(id);
  }, [ladder.length]);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.rungs)) {
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
        if (done || g.t0) localStorage.setItem('sot_rung_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_rung_day');
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

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'rung', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'rung', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'rung', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'rung', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'rung', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_rung_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!(cur.rungs.length || cur.hintUsed) || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.rungs.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.rungs.length, won: g2.status === 'won' && g2.rungs.length === perfect })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.rungs.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function commit(next) { gRef.current = next; setG(next); }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(() => { try { inputRef.current?.focus(); } catch (e) {} }, 40);
  }

  function submit() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const w = draft.trim().toLowerCase();
    const bad = (msg) => { setShake((k) => k + 1); vibrate(HAPT.wrong); say(msg); };
    if (w.length !== 5 || !/^[a-z]{5}$/.test(w)) { bad('Five letters, nothing else.'); return; }
    if (w === current) { bad('That is the word you are already on.'); return; }
    if (!differsByOne(current, w)) { bad(`Change exactly one letter of ${current.toUpperCase()}.`); return; }
    if (!WORDS.has(w)) { bad(`${w.toUpperCase()} is not in the word list.`); return; }
    const nextRungs = [...cur.rungs, w];
    const g2 = { ...cur, rungs: nextRungs };
    if (!g2.t0) g2.t0 = Date.now();
    setDraft('');
    if (w === PUZZLE.target) {
      const done = { ...g2, status: 'won', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(done, scoreFor(done.rungs.length, perfect));
      commit(done);
      return;
    }
    vibrate(HAPT.ok);
    commit(g2);
  }

  function restart() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.rungs.length) return;
    commit({ ...cur, rungs: [], restarts: cur.restarts + 1 });
    setDraft('');
    say('Back to the start word. Your rung count is reset, the clock is not.');
  }

  // One free hint: the next word of a shortest ladder from where you actually
  // are, not from the start, so it stays useful however far you have wandered.
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const from = [PUZZLE.start, ...cur.rungs].slice(-1)[0];
    const prev = new Map([[from, null]]);
    const queue = [from];
    let found = false;
    while (queue.length && !found) {
      const u = queue.shift();
      for (const v of ADJ.get(u) || []) {
        if (prev.has(v)) continue;
        prev.set(v, u);
        if (v === PUZZLE.target) { found = true; break; }
        queue.push(v);
      }
    }
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    if (!found) { say('There is no ladder to the target from here. Restart to get back on track.'); return; }
    let step = PUZZLE.target;
    while (prev.get(step) !== from) step = prev.get(step);
    say(`Try ${step.toUpperCase()}.`);
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setDraft(''); setEndClosed(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/rung${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const vs = used === perfect ? 'perfect'
      : used < par ? `${par - used} under par`
      : used === par ? 'level par'
      : `${used - par} over par`;
    const g5 = won ? Math.max(1, Math.round(scoreFor(used, perfect) / 2)) : 0;
    const squares = '\u{1F7E6}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Rung #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${PUZZLE.start} to ${PUZZLE.target} in ${used}, ${vs} · ${elapsed}${hintBit}${streakBit}`
      : `Rung #${PUZZLE.num} · gave up`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Rung #${PUZZLE.num} — the daily word ladder from Mind Loft. ${PUZZLE.start.toUpperCase()} to ${PUZZLE.target.toUpperCase()}, par ${par}.\n${shareUrl()}`
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
      lead={<>Climb from <b>{PUZZLE.start.toUpperCase()}</b> to <b>{PUZZLE.target.toUpperCase()}</b>, changing one letter at a time.</>}
      chips={[
        { label: `Perfect ${perfect} rungs = 10`, tone: 'good' },
        { label: `Par ${par} rungs = 8` },
      ]}
      steps={[
        <>Every rung must be a real word, and the letters stay where they are: <b>no anagrams</b>, no adding or dropping letters.</>,
        <>A rung has to be one of the <b>1,294 common five-letter words</b> in the game&rsquo;s list. Par and perfect were worked out over exactly that list, so a word not in it is not a rung here.</>,
        <><b>Perfect</b> is the shortest route that exists, found by search rather than by hand, so nobody gets under it. <b>Par</b> is the length a clean climb comes in at.</>,
        <>No <b>undo</b>: <b>restart</b> puts you back at the start word and zeroes your rungs while the clock keeps running. Climbing backwards by retyping an earlier word costs a rung too.</>,
      ]}
      knack="Change only the letters the target needs. A detour that undoes a letter you already had right costs you two rungs."
      footer={<>Every {step} rungs over perfect costs a point, down to a floor of one. One free hint, on your first ever play, gives the next word of a shortest ladder from wherever you are. Sundays are a much longer climb.</>}
    />
  );

  const Word = ({ w, prevWord, dim, outline }) => (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
      {w.split('').map((ch, i) => {
        const changed = prevWord && prevWord[i] !== ch;
        return (
          <div key={i} style={{
            width: 40, height: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: SANS, fontWeight: 800, fontSize: 21, textTransform: 'uppercase',
            background: outline ? 'transparent' : changed ? COLORS.accent : (STAGE ? 'var(--stg-surf2)' : TILE),
            color: outline ? `var(--stg-mute, ${COLORS.faded})` : changed ? T.white : `var(--stg-ink, ${COLORS.ink})`,
            border: outline ? `2px dashed ${TILE_EDGE}` : `1.5px solid ${changed ? `var(--stg-acc, ${COLORS.accent})` : TILE_EDGE}`,
            opacity: dim ? 0.55 : 1,
          }}>{ch}</div>
        );
      })}
    </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome — see app/DailyChrome.jsx. Second test game for
          the 2026-08-04 header rollout (Crux is the other). */}
      {!STAGE && (
      <DailyChrome slug="rung" name="Rung" collapsed={started}
        stats={[{ k: 'Rungs', v: used }]} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Rung grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="rung" quizId={PUZZLE.quizId}
          name="Rung"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · Par ${par}` : null}
          figures={playing ? [
            { v: used, k: 'rungs' },
            { v: elapsed, k: 'time' },
            { v: `${par} · ${perfect}`, k: 'par · perfect' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: used, k: 'rungs' },
            { v: `${par} · ${perfect}`, k: 'par · perfect' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="rg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.rg-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .rg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .rg-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .rg-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .rg-in{font-family:${SANS};font-weight:800;font-size:20px;letter-spacing:0.28em;text-transform:uppercase;text-align:center;width:100%;max-width:230px;padding:10px 8px;border-radius:8px;border:2px solid var(--blue-deep);background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:var(--blue-deep);}
          .rg-in:focus{outline:none;border-color:var(--stg-acc, ${COLORS.accent});}
          .rg-ladder{max-height:46vh;overflow-y:auto;display:flex;flex-direction:column;gap:5px;padding:2px 0;}
          .rg-shake{animation:rgshake .34s ease;}
          @keyframes rgshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="rung" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Par {par}</span>}
          blocks={'RUNG'.split('').map((ch, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which
            runs full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Rung is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Climb from <b>{PUZZLE.start.toUpperCase()}</b> to <b>{PUZZLE.target.toUpperCase()}</b>, one letter at a time, every rung a word. Par is {par} and perfect is {perfect}, the shortest route there is. No undo, only a restart.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="rg-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>rungs <b style={{ color: used > par ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{used}</b></span>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>par <b style={{ color: ACC_INK, fontWeight: 500 }}>{par}</b> &middot; perfect <b style={{ color: INK, fontWeight: 500 }}>{perfect}</b></span>
          </div>
          )}

          <div ref={shakeRef} style={{ maxWidth: 300, margin: '0 auto' }}>
            <div className="rg-ladder" ref={ladderRef}>
              {ladder.map((w, i) => (
                <Word key={`${w}-${i}`} w={w} prevWord={i > 0 ? ladder[i - 1] : null} dim={i < ladder.length - 1 && ladder.length > 6} />
              ))}
            </div>
            {playing && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <input
                  ref={inputRef} className="rg-in" value={draft} inputMode="text" autoComplete="off"
                  autoCapitalize="off" autoCorrect="off" spellCheck={false} maxLength={5}
                  placeholder="_____"
                  onChange={(e) => setDraft(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 5))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                  aria-label="Type the next rung"
                />
                <button className="rg-btn" onClick={submit} disabled={draft.length !== 5}
                  style={{ background: draft.length === 5 ? COLORS.ink : `var(--stg-surf, ${T.white})`, color: draft.length === 5 ? T.white : COLORS.faded, opacity: draft.length === 5 ? 1 : 0.55, cursor: draft.length === 5 ? 'pointer' : 'default' }}>
                  Climb
                </button>
              </div>
            )}
            <div style={{ marginTop: 12, opacity: 0.85 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, textAlign: 'center', marginBottom: 5 }}>target</div>
              <Word w={PUZZLE.target} outline />
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {!playing
                ? (won ? (used === perfect ? `${used} rungs. That is perfect.` : `${used} rungs. Par was ${par}.`) : 'You stepped off the ladder.')
                : `On ${current.toUpperCase()}. Change one letter.`}
            </span>
            {g.restarts > 0 && playing && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: FADED, fontWeight: 500 }}>{g.restarts} restart{g.restarts === 1 ? '' : 's'}</span>
            )}
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button className="rg-tool" onClick={restart} disabled={!used} title="Back to the start word, and zero the rung count" style={{ opacity: used ? 1 : 0.4, cursor: used ? 'pointer' : 'default' }}>
                <RotateCcw size={14} /> Restart
              </button>
              {hintOk && !g.hintUsed && (
                <button className="rg-tool" onClick={useHint} title="The next word of a shortest ladder from here (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(21,94,117,0.5)', color: '#124b5e' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a
            bare row of faded text has nothing to sit on, and the card is
            meant to hold the whole game. */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>One letter at a time. No undo.</span>
            <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Eye size={13} /> {armReveal ? 'Tap again — ends the ladder and scores nothing' : 'Give up'}
            </button>
          </div>
        )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                Par was <span style={{ color: ACC_INK }}>{par} rungs</span>, perfect was <span style={{ color: INK }}>{perfect}</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 4px', lineHeight: 1.5 }}>
                {won && used === perfect
                  ? 'You matched the shortest ladder there is, which on this board is not easy.'
                  : won && used < par ? `You got there in ${used}, ${par - used} under par and ${used - perfect} off perfect.`
                  : won && used === par ? `You got there in ${used}, level par, ${used - perfect} off perfect.`
                  : won ? `You got there in ${used}, ${used - par} over par.`
                  : 'One shortest ladder:'}
                {PUZZLE.routes === 1 && ' There is exactly one shortest ladder between these two words.'}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 12.5, color: INK, fontWeight: 500, lineHeight: 1.7, wordBreak: 'break-word' }}>
                {PUZZLE.example.join(' → ')}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, a much longer climb.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Rung in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new ladder drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/rung?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>climb yesterday&rsquo;s Rung &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/rung" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Rung &rarr;</a>
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
              name="Rung"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore}/10 \u00b7 ${used} rungs \u00b7 par ${par}, perfect ${perfect} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Rung all time` : 'all-time rank' }
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
                  href: `/rung?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Rung', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/rung?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="rung" name="Rung" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="rung" name="Rung" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="rung" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="rung" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Rung to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s ladder, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s ladder, every day.</p>
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
        <DailyEndCard modal self="rung" won={won}
          headline={won ? (used === perfect ? <>Perfect. The shortest there is.</> : used < par ? <>Under par.</> : <>You made it across.</>) : <>You scored 0%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {used} rungs &middot; par {par}, perfect {perfect} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; par here was {par}, perfect was {perfect}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
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
            <button className="rg-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Rung</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Rung is a free daily word ladder from Mind Loft. Two five-letter words, and a climb from one to the other changing a single letter at a time, with every rung a word in its own right. The puzzle is as old as Lewis Carroll and still one of the best things you can do with a dictionary.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every ladder is machine generated and then solved exactly, so perfect really is the shortest route rather than somebody&rsquo;s guess, and it was confirmed by a second search written independently of the first. Par sits a cushion above perfect: it is what a clean climb comes in at, and it is beatable. On most boards there is only one shortest ladder, which is what makes matching perfect worth something. Weekday climbs run 10 to 12 rungs and Sundays a good deal further.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new ladder drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crunch" style={{ color: INK, fontWeight: 800 }}>Crunch</a>, our daily numbers round, <a href="/parker" style={{ color: INK, fontWeight: 800 }}>Parker</a>, our daily sliding-block jam, and <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
