'use client';

// Warmer — the daily semantic hot-and-cold word hunt.
//
// Each day there is one secret word. You guess any word; the puzzle tells you how
// SEMANTICALLY close you are — "ocean" is scorching for the answer "sea",
// "pencil" is freezing — on a cold→hot color spectrum, plus its exact rank
// (how many of the ~32,000 words are closer). Keep guessing, unlimited, until
// you land the exact word, or Give Up to reveal it.
//
// Leaderboard: SOLVERS rank above everyone (fewest guesses, ties by time). A
// player who gives up is still ranked — by the CLOSEST word they reached, ties
// by fewest guesses. That ordering is encoded in `score` (see scoreFor* below)
// so the shared daily board (score desc → guesses → time) sorts it correctly.
//
// Proximity is precomputed on GloVe-6B-100d native vectors per day, so the
// browser needs no model. The server sends it PACKED, as `active.o` — three
// base64 characters per vocab index — and this file decodes it once with the
// shared codec. The answer is never sent as a string (it's VOCAB[order[0]] of
// the live day only). Do not import ./puzzles here: that module is the whole
// 13MB bank, and only the server page may touch it.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, X, Lightbulb, Smartphone, CornerDownLeft, Flag } from 'lucide-react';
import { VOCAB, VOCAB_INDEX } from './vocab';
import { decodeOrder } from './order-codec';
import Grain from '../Grain';
import Footer from '../Footer';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  ink: T.ink,
  ember: T.accent,
  faded: T.muted,
  accent: '#dc2626',        // Warmer identity — hot red
  accentSoft: '#fef2f2',
  green: T.successDeep,
  rust: T.danger,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_warmer_help_seen';
const STATS_KEY = 'sot_warmer_stats';
const N_WORDS = VOCAB.length;

// Cold → hot temperature bands, keyed by proximity rank (1 = the answer).
const BANDS = [
  { name: 'Found it',  min: 1,    max: 1,    color: T.successDeep, emoji: '✅' },
  { name: 'Scorching', min: 2,    max: 15,   color: '#dc2626', emoji: '🟥' },
  { name: 'Hot',       min: 16,   max: 80,   color: '#ea580c', emoji: '🟧' },
  { name: 'Warm',      min: 81,   max: 400,  color: '#f59e0b', emoji: '🟨' },
  { name: 'Tepid',     min: 401,  max: 1500, color: '#84cc16', emoji: '🟩' },
  { name: 'Cool',      min: 1501, max: 6000, color: '#0ea5e9', emoji: '🟦' },
  { name: 'Cold',      min: 6001, max: 1e9,  color: '#3b5bdb', emoji: '⬜' },
];
function bandFor(rank) { for (const b of BANDS) if (rank >= b.min && rank <= b.max) return b; return BANDS[BANDS.length - 1]; }
function heatFrac(rank) { const f = 1 - Math.log(rank) / Math.log(N_WORDS); return Math.max(0.02, Math.min(1, f)); }

// Scoring, submitted with total=100 so the daily board (score desc → guesses →
// time) yields the required order. SOLVERS occupy 51..100 (fewer guesses = more),
// so any solve beats any give-up. GIVE-UPS occupy 1..50 by how close they got
// (closer = more), ties broken by fewest guesses via guessesUsed.
function solverScore(g) { return Math.max(51, Math.min(100, Math.round(50 + 50 * Math.pow(0.985, Math.max(0, g - 1))))); }
function giveUpScore(bestRank) {
  if (!bestRank || bestRank < 2) return 1;
  const heat = 1 - Math.log(bestRank) / Math.log(N_WORDS);
  return Math.max(1, Math.min(50, Math.round(50 * heat)));
}

function etToday() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return new Date().toISOString().slice(0, 10); } }
function fmtTime(ms) { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
function msToMidnightET() {
  try { const now = new Date(); const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })); const next = new Date(et); next.setHours(24, 0, 0, 0); return next - et; }
  catch (e) { const now = new Date(); const next = new Date(now); next.setHours(24, 0, 0, 0); return next - now; }
}
function fmtCountdown(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try { let a = localStorage.getItem('sot_quiz_anon'); if (!a) { a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('sot_quiz_anon', a); } return a; } catch (e) { return null; }
}
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

// ── personal stats + streak (localStorage) ──────────────────────────────────
function getStats() { try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {} return { v: 1, rec: {} }; }
function recordStat(num, entry) { const s = getStats(); if (s.rec[num]) return s; const s2 = { ...s, rec: { ...s.rec, [num]: entry } }; try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {} return s2; }
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const solvedNums = nums.filter((n) => rec[n].won);
  const solved = solvedNums.length;
  const solvedG = solvedNums.map((n) => rec[n].g).filter((x) => Number.isFinite(x));
  const best = solvedG.length ? Math.min(...solvedG) : null;
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, solved, best, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {}; for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId]; if (!p || m.attempt !== 1 || rec[p.num]) continue;
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { g: null, t: null, won: m.perfect !== false };
  }
  if (!changed) return s;
  const s2 = { ...s, rec }; try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {} return s2;
}

function freshState() { return { v: 1, guesses: [], status: 'playing', hintUsed: false, t0: null, tEnd: null }; }

export default function WarmerClient({ active, puzzles = [], forceNum = null }) {
  const PUZZLE = active;
  // One decode per day shown; `active.o` is the packed ranking for that day.
  const ORDER = useMemo(() => decodeOrder(active.o), [active.o]);
  const STORE_KEY = `sot_warmer_${PUZZLE.num}`;
  const rankByVocab = useMemo(() => {
    const arr = new Int32Array(N_WORDS).fill(-1);
    for (let pos = 0; pos < ORDER.length; pos++) arr[ORDER[pos]] = pos;
    return arr;
  }, [ORDER]);
  const answerWord = VOCAB[ORDER[0]];

  const [g, setG] = useState(freshState);
  const [text, setText] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [showChrome, setShowChrome] = useState(false);
  const [armGiveUp, setArmGiveUp] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('warmer', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('warmer'); }, [g.hintUsed]);
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
  const inputRef = useRef(null);

  const guesses = g.guesses;
  const playing = g.status === 'playing';
  const LOFT = isLoft('warmer');
  const STAGE = isStage('warmer', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('warmer');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('warmer'), '--stg-acc-lt': gameColorLight('warmer'), '--stg-onramp-lt': gameOnrampLight('warmer'), '--stg-acc-ink-lt': gameAccentInkLight('warmer') };
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
  const won = g.status === 'won';
  const gaveUp = g.status === 'gaveup';
  const focusMode = playing && !showChrome;

  const todayNum = useMemo(() => { const t = etToday(); const open = puzzles.filter((p) => p.live <= t); return open.length ? open[open.length - 1].num : (puzzles[0] ? puzzles[0].num : PUZZLE.num); }, [puzzles, PUZZLE.num]);
  const isTodays = PUZZLE.num === todayNum;
  const iq = useIqStanding({ game: 'warmer', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'warmer', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'warmer', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'warmer', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'warmer', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const saved = JSON.parse(raw); if (saved && saved.v === 1 && Array.isArray(saved.guesses)) setG({ ...freshState(), ...saved }); }
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try { if (isTodays) (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_warmer_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_warmer_day'); })(); } catch (e) {}
  }, [g, hydrated, STORE_KEY, isTodays]);

  useEffect(() => {
    try { setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true); setMobileUi(isMobileDevice()); } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  useEffect(() => { if (!armGiveUp) return undefined; const t = setTimeout(() => setArmGiveUp(false), 3500); return () => clearTimeout(t); }, [armGiveUp]);

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

  // ---- identity + leaderboard ----
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

  function say(msg) { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2200); }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const myStats = deriveStats(stats, todayNum);

  const rankOf = useCallback((word) => { const vi = VOCAB_INDEX[word]; if (vi == null) return null; const pos = rankByVocab[vi]; return pos < 0 ? null : pos + 1; }, [rankByVocab]);
  // The vocab stores lemmas only (July 2026 rebuild); map a typed plural to its
  // singular so "smoothies" scores as "smoothie" (and dedups against it).
  const resolveGuess = useCallback((word) => {
    if (VOCAB_INDEX[word] != null) return word;
    if (word.length >= 4 && word.endsWith('s') && !word.endsWith('ss')) {
      if (word.endsWith('ies') && VOCAB_INDEX[word.slice(0, -3) + 'y'] != null) return word.slice(0, -3) + 'y';
      if (word.endsWith('es') && VOCAB_INDEX[word.slice(0, -2)] != null) return word.slice(0, -2);
      if (VOCAB_INDEX[word.slice(0, -1)] != null) return word.slice(0, -1);
    }
    return null;
  }, []);
  const sortedGuesses = useMemo(() => [...guesses].sort((a, b) => a.rank - b.rank), [guesses]);
  const bestRank = sortedGuesses.length ? sortedGuesses[0].rank : null;

  const REC_KEY = `sot_warmer_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually guesses (or takes a hint).
    // Opening the puzzle and dismissing the start gate does not log a 0-score.
    const acted = g.guesses.length > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 100, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const gc = g2.guesses.length;
    const solved = g2.status === 'won';
    let br = null; for (const x of g2.guesses) if (br == null || x.rank < br) br = x.rank;
    const score = solved ? solverScore(gc) : giveUpScore(br);
    try { setStats(recordStat(PUZZLE.num, { g: gc, t: el, won: solved, best: br })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // total=100; solvers score 51-100 (fewer guesses = higher), give-ups
        // score 1-50 by closest rank. guessesUsed = total guesses (secondary
        // tiebreak). So the board ranks solvers first, then give-ups by closeness.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 100, correct: solved ? 1 : 0, guessesUsed: gc, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  // Closing the start gate begins the clock (sets t0) and marks the rules as
  // seen. A no-op once started, so re-reading the rules never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function commitGuess(wordRaw) {
    if (!playing) return;
    const typed = String(wordRaw || '').trim().toLowerCase();
    if (!typed) return;
    if (!/^[a-z]+$/.test(typed)) { say('Letters only — one word at a time.'); return; }
    const word = resolveGuess(typed);
    const rank = word == null ? null : rankOf(word);
    if (rank == null) { say(`"${typed}" isn't in the word list.`); return; }
    const existing = guesses.find((x) => x.w === word);
    if (existing) { say(`Already guessed — ${word} is #${existing.rank}.`); return; }
    const entry = { w: word, rank };
    const g2 = { ...g, guesses: [...guesses, entry] };
    if (!g2.t0) g2.t0 = Date.now();
    setText('');
    if (rank === 1) { g2.status = 'won'; g2.tEnd = Date.now(); postResult(g2); setG(g2); setJustWon(true); return; }
    setG(g2);
  }

  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const tried = new Set(guesses.map((x) => x.w));
    let pick = null;
    for (const targetPos of [24, 20, 30, 15, 40, 12, 50]) { const w = VOCAB[ORDER[targetPos]]; if (w && !tried.has(w)) { pick = { w, rank: targetPos + 1 }; break; } }
    if (!pick) { for (let pos = 8; pos < 120; pos++) { const w = VOCAB[ORDER[pos]]; if (w && !tried.has(w)) { pick = { w, rank: pos + 1 }; break; } } }
    if (!pick) return;
    const g2 = { ...g, guesses: [...guesses, pick], hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say(`Hint: "${pick.w}" is warm (#${pick.rank}).`);
  }

  function giveUp() {
    if (!playing) return;
    if (!armGiveUp) { setArmGiveUp(Date.now()); return; }
    if (Date.now() - armGiveUp < ARM_MIN_MS) return;
    setArmGiveUp(false);
    const g2 = { ...g, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setText(''); setJustWon(false); setEndClosed(false); setArmGiveUp(false);
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 30);
  }

  function shareText() {
    const gc = guesses.length;
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const hintBit = g.hintUsed ? ' · 💡' : '';
    const path = guesses.slice();
    const step = Math.max(1, Math.ceil(path.length / 9));
    const trail = path.filter((_, i) => i % step === 0 || i === path.length - 1).map((x) => bandFor(x.rank).emoji).join('');
    const head = won
      ? `Warmer #${PUZZLE.num} — solved in ${gc} guess${gc === 1 ? '' : 'es'} · ${elapsed}${hintBit}${streakBit}`
      : `Warmer #${PUZZLE.num} — gave up · closest #${bestRank || '—'} in ${gc} guess${gc === 1 ? '' : 'es'}`;
    return `${head}\n${trail}\n${shareUrl()}`;
  }
  function shareUrl() { return withRef(`mindloftdaily.com/warmer${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function copyShare() {
    const text = playing ? `Warmer #${PUZZLE.num} — the daily hot-and-cold word hunt from Mind Loft.\n${shareUrl()}` : shareText();
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const lastEntry = guesses.length ? guesses[guesses.length - 1] : null;

  function GuessRow({ entry, pinned }) {
    const b = bandFor(entry.rank);
    const frac = heatFrac(entry.rank);
    return (
      <div className={`wm-row${pinned ? ' pinned' : ''}`} style={pinned ? { borderColor: b.color } : undefined}>
        <span className="wm-word">{entry.w}</span>
        <span className="wm-track"><span className="wm-fill" style={{ width: `${Math.round(frac * 100)}%`, background: b.color }} /></span>
        <span className="wm-band" style={{ color: b.color }}>{b.name}</span>
        <span className="wm-rank">{entry.rank === 1 ? '★' : `#${entry.rank}`}</span>
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="There is one secret word each day."
      steps={[
        <>Guess any word and Warmer tells you how <b>close in meaning</b> it is, not the spelling, the <i>meaning</i>. Guess <b>ocean</b> when the word is <b>sea</b> and you are scorching; guess <b>pencil</b> and you are freezing.</>,
        <>Every guess is placed on the <b>cold-to-hot bar</b> and given a <b>rank</b>. #1 is the answer, and a lower number means closer.</>,
        <>Guesses are <b>unlimited</b>. Use each one to steer toward the hot end.</>,
        <>One free <b>hint</b>, on your first ever play, reveals a warm word.</>,
      ]}
      knack="Meaning is the whole game, so chase the sense of your warmest guess rather than words that merely look like it."
      footer="The leaderboard ranks solvers by fewest guesses, ties by fastest time. Give up and you are still ranked by the closest word you reached. A new word drops every day at midnight Eastern."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="warmer" name="Warmer" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="warmer" quizId={PUZZLE.quizId}
          name="Warmer"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
          ] : [
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="wm-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.wm-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .wm-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .wm-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @media(max-width:560px){.wm-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.wm-ttl h1{font-size:21px;}.wm-ttl-dot{display:none;}}
          .wm-spectrum{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
          .wm-grad{height:14px;border-radius:99px;background:linear-gradient(90deg,#3b5bdb,#0ea5e9 24%,#84cc16 47%,#f59e0b 68%,#ea580c 84%,var(--stg-acc, #dc2626));}
          .wm-scale{display:flex;justify-content:space-between;font-family:${MONO};font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:${FADED};}
          .wm-inputrow{display:flex;gap:8px;align-items:stretch;margin-bottom:6px;}
          .wm-input{flex:1 1 auto;font-family:${SANS};font-size:16px;font-weight:600;color:${INK};border:2px solid ${COLORS.ink};border-radius:10px;padding:12px 14px;outline:none;min-width:0;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .wm-input:focus{border-color:var(--stg-acc, ${COLORS.accent});}
          .wm-go{flex:0 0 auto;font-family:${SANS};font-weight:800;font-size:14.5px;border:2px solid var(--stg-acc, ${COLORS.accent});background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:10px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .wm-go:disabled{opacity:.5;cursor:default;}
          .wm-meta{display:flex;align-items:center;gap:14px;font-family:${MONO};font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:${FADED};margin:2px 0 4px;flex-wrap:wrap;}
          .wm-meta b{font-weight:500;color:${INK};font-variant-numeric:tabular-nums;}
          .wm-chip{font-family:${SANS};font-weight:800;font-size:12px;border-radius:8px;padding:6px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .wm-actions{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;}
          .wm-list{display:flex;flex-direction:column;gap:6px;}
          .wm-row{display:grid;grid-template-columns:118px 1fr 74px 52px;gap:10px;align-items:center;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.12));border-radius:9px;padding:8px 12px;}
          .wm-row.pinned{border-width:2px;box-shadow:0 2px 0 rgba(28,30,36,0.06);}
          .wm-word{font-family:${SANS};font-weight:800;font-size:15px;color:${INK};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .wm-track{height:9px;border-radius:99px;background:${STAGE ? 'var(--stg-surf2)' : '#eef0f3'};overflow:hidden;}
          .wm-fill{display:block;height:100%;border-radius:99px;transition:width .35s ease;}
          .wm-band{font-family:${SANS};font-weight:800;font-size:11.5px;text-align:right;letter-spacing:.01em;}
          .wm-rank{font-family:${MONO};font-weight:500;font-size:13px;color:${INK};text-align:right;font-variant-numeric:tabular-nums;}
          @media(max-width:520px){.wm-row{grid-template-columns:92px 1fr 44px;}.wm-band{display:none;}.wm-word{font-size:14px;}}
          .wm-pinwrap{margin-bottom:12px;}
          .wm-pinlabel{font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${FADED};margin-bottom:5px;}
        `}</style>

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

          {/* masthead */}
          {!LOFT && (
          <DailyMasthead
            slug="warmer"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={5}
            helpTop={13}
            marginBottom={16}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Rarer word</span>}
            blocks={'WARMER'.split('').map((ch, i) => (
                <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 5 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

          {/* start gate — the puzzle card stays sealed until Start begins the clock */}
          {preStart && (
            <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', minHeight: 200, display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Warmer is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>One secret word. Guess any word and see how close in meaning it is, cold to hot.</p>
                </div>
              )}
              <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="wm-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* the puzzle card */}
          {!preStart && (
          <div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 16px 16px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 14 }}>
            <div className="wm-spectrum">
              <div className="wm-grad" aria-hidden="true" />
              <div className="wm-scale"><span>Cold &middot; far</span><span>Cool</span><span>Warm</span><span>Hot &middot; close</span></div>
            </div>

            {started ? (
              <>
                <form className="wm-inputrow" onSubmit={(e) => { e.preventDefault(); commitGuess(text); }}>
                  <input ref={inputRef} className="wm-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a word and press Enter" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label="Your guess" enterKeyHint="go" />
                  <button type="submit" className="wm-go" disabled={!text.trim()} aria-label="Submit guess"><CornerDownLeft size={16} strokeWidth={2.5} /> Guess</button>
                </form>
                <div className="wm-meta">
                  <span>guesses <b>{guesses.length}</b></span>
                  <span>closest <b>{bestRank != null ? `#${bestRank}` : '—'}</b></span>
                  <span>time <b>{elapsed}</b></span>
                </div>
                <div className="wm-actions">
                  {hintOk && !g.hintUsed && (
                    <button onClick={useHint} className="wm-chip" title="Reveal one warm word (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: '1.5px solid rgba(220,38,38,0.45)', color: '#9a1c1c' }}>
                      <Lightbulb size={13} /> Hint
                    </button>
                  )}
                  <button onClick={giveUp} className="wm-chip" title="Reveal the answer and end the puzzle" style={{ marginLeft: 'auto', background: armGiveUp ? `var(--stg-surf2, #fbeaea)` : `var(--stg-surf, ${T.white})`, border: `1.5px solid ${armGiveUp ? `var(--stg-bad, ${COLORS.rust})` : 'var(--stg-line2, rgba(28,30,36,0.3))'}`, color: armGiveUp ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})` }}>
                    <Flag size={13} /> {armGiveUp ? 'Tap again to reveal' : 'Give up'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED }}>The word was</div>
                <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: '-0.5px', color: `var(--stg-ink, ${COLORS.green})`, margin: '2px 0 4px' }}>{answerWord}</div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: FADED }}>
                  {won ? <>Solved in {guesses.length} guess{guesses.length === 1 ? '' : 'es'} &middot; {elapsed}{g.hintUsed ? ' · 1 hint' : ''}</>
                       : <>Gave up &middot; closest was #{bestRank || '—'} in {guesses.length} guess{guesses.length === 1 ? '' : 'es'}</>}
                </div>
              </div>
            )}
          </div>
          )}

          {/* latest guess, pinned */}
          {playing && lastEntry && (
            <div className="wm-pinwrap">
              <div className="wm-pinlabel">Latest guess</div>
              <GuessRow entry={lastEntry} pinned />
            </div>
          )}

          {/* running list, hottest first */}
          {sortedGuesses.length > 0 && (
            <>
              <div className="wm-pinlabel" style={{ marginBottom: 6 }}>{sortedGuesses.length} guess{sortedGuesses.length === 1 ? '' : 'es'} &middot; closest first</div>
              <div className="wm-list">
                {sortedGuesses.map((entry) => <GuessRow key={entry.w} entry={entry} pinned={!playing && entry.rank === 1} />)}
              </div>
            </>
          )}

          {started && sortedGuesses.length === 0 && (
            <p style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: FADED, textAlign: 'center', margin: '18px 0 6px', lineHeight: 1.5 }}>
              Guess any word. You&rsquo;ll see how close it is in meaning to today&rsquo;s secret word, on the cold-to-hot scale above. Keep going until you land it.
            </p>
          )}

          {/* result footer */}

          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
            {!playing && (
              <div style={{ maxWidth: 472, margin: '14px auto 0' }}>
                <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: 0 }}>
                  {isTodays ? (
                    <>
                      {countdown ? <>Next Warmer in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new word drops at midnight Eastern.'}
                      {prevPuzzle && (<> {' '}Meanwhile:{' '}<a href={`/warmer?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Warmer &rarr;</a></>)}
                    </>
                  ) : (
                    <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}<a href="/warmer" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Warmer &rarr;</a>{' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a></>
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
              name="Warmer"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Warmer all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/warmer?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Warmer', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/warmer?p=${prevPuzzle.num}` },
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
          {!STAGE && <GamePanel self="warmer" name="Warmer" onShow={() => setShowChrome(true)} />}

          {/* keep playing + share + grid */}
          <div style={{ margin: '30px auto 0', display: (focusMode && !STAGE) ? 'none' : 'block' }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="warmer" name="Warmer" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid replay={!playing ? resetGame : null} self="warmer" maxWidth={620} challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`} share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light boardSlot={<DailyBoardPanel self="warmer" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />} divider />
            )}
            {!focusMode && mobileUi && !standalone && (
              <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
              </button>
            )}
          </div>

          {!focusMode && !identity && (
            <div id="daily-join" style={{ margin: '18px auto 0' }}>
              <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
            </div>
          )}

          {/* Personal stats wiring (myStats) is retained for the share string and
              streak logic; the on-page "Your stats" tile row is no longer shown.
              The daily leaderboard now renders in DailyGamesGrid's boardSlot,
              directly under the Challenge / Share actions (owner, 2026-07-23). */}

        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="warmer"
          won={won}
          headline={won ? <>Solved!</> : <>The word was {answerWord}</>}
          answer={won ? null : answerWord}
          subline={won
            ? <>Warmer #{PUZZLE.num} &middot; {guesses.length} guess{guesses.length === 1 ? '' : 'es'} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>Warmer #{PUZZLE.num} &middot; gave up &middot; closest #{bestRank || '—'}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
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
            <button className="wm-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 30); }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {showA2hsHelp && (
        <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Warmer to your Home Screen</div>
            <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s word, every day.</p>
            <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Warmer — crawlable prose for search */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Warmer</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Warmer is a free daily word puzzle from Mind Loft. There is one secret word each day, and your only clue is how close your guesses are to it in meaning. Every guess lands on a cold-to-hot color spectrum with an exact proximity rank, so you can feel your way from freezing to scorching and, finally, to the word itself.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Closeness is semantic, not alphabetical: for the answer &ldquo;sea,&rdquo; words like ocean, waves, and coast run hot, while unrelated words stay cold. Guesses are unlimited, so you can always reach the answer, the challenge is getting there in as few guesses as you can. Solvers are ranked by fewest guesses, and even if you give up you&rsquo;re ranked by the closest word you found.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new word drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily board. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a>, the crowd-ranking puzzle, and <a href="/links" style={{ color: INK, fontWeight: 800 }}>Links</a>, four hidden threads.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
