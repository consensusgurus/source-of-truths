'use client';

// Lode — the daily letter-mining word puzzle.
//
// Seven letters, one CORE letter every word must use, four letters minimum,
// letters reusable. A word using all seven is a PANGRAM. The Sunday Edition
// deals an eighth letter.
//
// WHAT MAKES IT NOT A SPELLING BEE CLONE: points come from RARITY, not length.
// Every word on the board carries a tier computed from real-world usage
// frequency (see scripts/gen-lode.mjs), so a player who knows one uncommon word
// leapfrogs one who grinds ten obvious ones:
//
//     points = (length - 2) x tier(1 common / 2 uncommon / 3 rare) + 10 pangram
//
// The day closes at the VEIN — a fixed share of the board's maximum — so Lode
// finishes in a few minutes alongside the rest of the slate, with MOTHER LODE
// (every word) left for the obsessives.
//
// The board's whole scored word list ships in the day's puzzle object, exactly
// like Crux's answers: app/lode/page.js filters live<=today on the SERVER, so a
// future board never reaches a browser. No dictionary fetch is needed at all.
//
// ONE SHOT COUNTS: your first posted score is the one that ranks. Cashing in
// closes the day; leaving mid-dig posts what you had (useAbandonFlush), so a
// started puzzle always lands in the stats.
//
// NOTE on typing: the house rule that typed quizzes auto-accept on keystroke is
// deliberately NOT applied here. Words are BUILT here, so accepting at the
// first valid prefix would bank SEAM while the player was still typing SEAMED.
// Enter (or the Mine button) submits.
//
// Same daily plumbing as Tuck/Crux: banked boards gated by Eastern date on the
// server, per-puzzle localStorage saves, /lode?p=N archive pinning, streaks, and
// the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Shuffle, Delete, CheckCircle2, Gem } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
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
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: T.goldInk,        // Lode identity — brass ore
  accentDeep: '#7a4a05',
  accentSoft: '#fef7e0',
  green: T.successDeep,
  stone: '#2b2f38',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_lode_help_seen';
const STATS_KEY = 'sot_lode_stats';
const MIN_LEN = 4;

// Rarity tiers, as scored by the generator. Reader-facing wording lives here so
// the toast, the found list and the share card can never drift apart.
const TIERS = {
  1: { label: 'Common', block: '⬜', color: `var(--stg-mute, ${COLORS.faded})` },
  2: { label: 'Uncommon', block: '\u{1f7e8}', color: `var(--stg-ink, ${COLORS.accent})` },
  3: { label: 'Rare', block: '\u{1f7e7}', color: `var(--stg-ink, ${COLORS.rust})` },
};
const PANGRAM_BLOCK = '\u{1f48e}';

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

// ─── Personal stats + streak (localStorage), Tuck/Circa pattern ─────────────
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
  const struck = nums.filter((n) => rec[n].won).length;
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played, struck, cur, max };
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
    const sc = Math.max(0, Math.round(((m.scorePct || 0) / 100) * (p.vein || 1)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: p.vein, n: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState() {
  return {
    v: 1,
    found: [],                  // words, in the order they were mined
    spare: [],                  // real words off the board: accepted, unscored
    status: 'playing',          // playing | done (done = score posted)
    t0: null,
    tEnd: null,
  };
}

export default function LodeClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_lode_${PUZZLE.num}`;
  const CORE = PUZZLE.core;
  const VEIN = PUZZLE.vein;
  const MAXSCORE = PUZZLE.max;
  // Letter count is DATA, never a literal: weekdays deal 7, the Sunday Edition 8.
  const ALL_LETTERS = useMemo(() => [CORE, ...PUZZLE.outer], [CORE, PUZZLE.outer]);
  const LETTER_SET = useMemo(() => new Set(ALL_LETTERS), [ALL_LETTERS]);
  const WORDS = useMemo(() => {
    const m = new Map();
    for (const x of PUZZLE.words) m.set(x.w, x);
    return m;
  }, [PUZZLE.words]);
  // Real dictionary words this board does not score. Telling a player that a
  // word in the dictionary "is not a word" is the complaint Lode gets, so these
  // are accepted and acknowledged instead — for nothing. They do NOT touch the
  // score, the found count, the rank, the maximum, or the fewest-words
  // tiebreak, which is what makes them safe to add to boards that have already
  // been played and ranked. Absent on pre-2026-08-17 boards and on every board
  // the page did not send it for, so an empty set means the old behaviour.
  const SPARE = useMemo(() => new Set(PUZZLE.extra || []), [PUZZLE.extra]);

  const [g, setG] = useState(freshState);
  const [entry, setEntry] = useState('');
  const [order, setOrder] = useState(() => PUZZLE.outer.slice());
  const [flash, setFlash] = useState(null);        // last mined word, for the tile flash
  const [confirming, setConfirming] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules vs compact card
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
  // Touch UI is tracked separately from mobileUi (which gates the Add to Home
  // Screen button): it governs the on-screen KEYBOARD, and a touch laptop or an
  // iPad reporting a desktop UA still wants the touch behaviour.
  const [touchUi, setTouchUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const flashTimer = useRef(null);
  const viewedRef = useRef(false);
  const inputRef = useRef(null);
  // The shake is replayed on this node's classList rather than by re-keying it:
  // a key change remounts the input inside it, and a remounted input has lost
  // focus, so every wrong or repeated word dropped the cursor out of the box.
  const shakeRef = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('lode');
  const STAGE = isStage('lode', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('lode');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('lode'), '--stg-acc-lt': gameColorLight('lode'), '--stg-onramp-lt': gameOnrampLight('lode'), '--stg-acc-ink-lt': gameAccentInkLight('lode') };
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
  const preStart = playing && !g.t0;   // not begun: the seam stays sealed
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;

  // ─── derived scoring ─────────────────────────────────────────────────────
  const score = useMemo(() => g.found.reduce((s, w) => s + (WORDS.get(w)?.p || 0), 0), [g.found, WORDS]);
  const pangramsFound = useMemo(() => g.found.filter((w) => WORDS.get(w)?.g).length, [g.found, WORDS]);
  const struck = score >= VEIN;
  const rank = useMemo(() => {
    let cur = { n: 'Unbroken', at: 0 };
    for (const r of PUZZLE.ranks) if (score >= r.at) cur = r;
    return cur;
  }, [score, PUZZLE.ranks]);
  const nextRank = useMemo(() => PUZZLE.ranks.find((r) => score < r.at) || null, [score, PUZZLE.ranks]);

  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
      setTouchUi(isMobileDevice() || window.matchMedia('(pointer: coarse)').matches);
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
        if (saved && saved.v === 1 && Array.isArray(saved.found)) setG({ ...freshState(), ...saved });
      }
      // The seam stays sealed until Start, which begins the clock. First-timers
      // get the full rules on the tile; returning players the compact card.
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
        if (done || g.t0) localStorage.setItem('sot_lode_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_lode_day');
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

  // ---- metrics + leaderboard (same /api/quiz/* flow as every other board) ----
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

  function say(msg, bad) {
    setToast({ msg, bad: !!bad });
    if (bad) {
      const el = shakeRef.current;
      if (el) { el.classList.remove('ld-shake'); void el.offsetWidth; el.classList.add('ld-shake'); }
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'lode', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'lode', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'lode', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'lode', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'lode', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // Leaving mid-dig still counts: post what the player had. Merely opening the
  // page and dismissing the start tile does not — `acted` requires a real find.
  const REC_KEY = `sot_lode_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = g.found.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score, total: VEIN, correct: score >= VEIN ? 1 : 0, guessesUsed: g.found.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // On a touch device the on-screen keyboard must only ever come up when the
  // player taps the input itself (owner rule): a keyboard that springs open on
  // Start, or on every letter tap, covers half the board. So autofocus is
  // desktop-only, and the tiles/controls below suppress focus changes entirely.
  function focusEntry() {
    if (touchUi) return;
    try { inputRef.current?.focus(); } catch (e) {}
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(focusEntry, 30);
  }

  // ─── mining a word ───────────────────────────────────────────────────────
  function submitEntry() {
    if (!playing || !started) return;
    const w = entry.trim().toUpperCase();
    setEntry('');
    if (!w) return;
    if (w.length < MIN_LEN) return say(`Too short — ${MIN_LEN} letters minimum.`, true);
    for (const ch of w) {
      if (!LETTER_SET.has(ch)) return say(`No ${ch} on this board.`, true);
    }
    if (!w.includes(CORE)) return say(`Every word needs the core ${CORE}.`, true);
    if (g.found.includes(w)) return say('Already mined.', true);
    const hit = WORDS.get(w);
    if (!hit) {
      // A real word that this board does not score. Bank it as spare so the
      // player is told they were right, not told they were wrong, and so a
      // second attempt at the same word does not read as a fresh discovery.
      if (SPARE.has(w)) {
        if ((g.spare || []).includes(w)) return say('Already set aside.', true);
        setG((cur) => ({ ...cur, spare: [...(cur.spare || []), w] }));
        return say(`${w} is a word, but it is not in today’s lode. No points.`);
      }
      return say('Not in today’s lode.', true);
    }

    const before = score;
    setG((cur) => ({ ...cur, found: [...cur.found, w], t0: cur.t0 || Date.now() }));
    setFlash(w);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 900);
    const tier = TIERS[hit.t];
    say(hit.g ? `PANGRAM! ${w} +${hit.p}` : `${tier.label} · ${w} +${hit.p}`);
    // Struck the vein on this word: surface the end card without ending play.
    if (before < VEIN && before + hit.p >= VEIN) setEndClosed(false);
  }

  function tapLetter(ch) {
    if (!started) return;
    setEntry((e) => (e + ch).slice(0, 20));
    focusEntry();
  }

  // Suppressing mousedown's default stops a tap from moving focus at all. That
  // is what keeps the keyboard closed when the player is tapping tiles, AND
  // keeps it OPEN when they have deliberately opened it and reach for Delete or
  // Shuffle mid-word. Click still fires, and keyboard navigation is unaffected.
  const keepFocus = (e) => e.preventDefault();
  function shuffleLetters() { setOrder((o) => { const a = o.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }); }

  function postResult(g2, sc, n) {
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: VEIN, n, won: sc >= VEIN })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // total = the day's VEIN (uniform for everyone, so the combined board's
        // completion normalization is stable, and a Mother Lode run legitimately
        // scores past it — the same benchmark model Tuck uses). guessesUsed = words
        // mined, so ties break toward the leaner haul.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: VEIN, correct: sc >= VEIN ? 1 : 0, guessesUsed: n, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function cashIn() {
    if (!playing || !g.found.length) return;
    if (!confirming) { setConfirming(true); return; }
    abandon.markFlushed();
    const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
    setG(g2);
    setEntry('');            // otherwise the closed board keeps the last word typed
    setConfirming(false);
    setEndClosed(false);
    postResult(g2, score, g.found.length);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setEntry(''); setConfirming(false); setEndClosed(false);
  }

  // ─── share ───────────────────────────────────────────────────────────────
  // The assay bar is the interesting part: it shows the CHARACTER of the haul,
  // not just the number. A row of commons reads differently from three gems.
  function assayBar() {
    const blocks = g.found
      .map((w) => WORDS.get(w))
      .filter(Boolean)
      .sort((a, b) => a.p - b.p)
      .map((x) => (x.g ? PANGRAM_BLOCK : TIERS[x.t].block));
    return blocks.length > 40 ? blocks.slice(0, 39).join('') + '…' : blocks.join('');
  }
  function copyShare() {
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const url = withRef(`mindloftdaily.com/lode${isTodays ? '' : `?p=${PUZZLE.num}`}`);
    const text = playing && !g.found.length
      ? `Lode No. ${PUZZLE.num} — seven letters, one core, dig for the rare ones.\n${url}`
      : `Lode No. ${PUZZLE.num} — ${rank.n}\n${score} pts · ${g.found.length} words${pangramsFound ? ` · ${pangramsFound} pangram${pangramsFound > 1 ? 's' : ''}` : ''}${streakBit}\n${assayBar()}\n${url}`;
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

  // ─── layout of the letter cluster: outer letters split above and below ────
  const topRow = order.slice(0, Math.ceil(order.length / 2));
  const botRow = order.slice(Math.ceil(order.length / 2));

  const foundSorted = useMemo(() => g.found.slice().sort(), [g.found]);
  const spareSorted = useMemo(() => (g.spare || []).slice().sort(), [g.spare]);
  const pct = Math.min(100, Math.round((score / Math.max(1, MAXSCORE)) * 100));

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead={<>Make as many words as you can from the {ALL_LETTERS.length} letters.</>}
      banner={<>Every word must use the <b>core letter {CORE}</b> and run at least <b>four letters</b>. Letters may be reused as often as you like.</>}
      chips={[
        { label: 'Common 1×', tone: 'grey' },
        { label: 'Uncommon 2×' },
        { label: 'Rare 3×', tone: 'good' },
        { label: 'Pangram +10', tone: 'warn' },
      ]}
      steps={[
        <><b>Type</b> a word and press Enter, or <b>tap the letters</b>.</>,
        <>Points come from <b>rarity, not length</b>: the multiplier above scales the word&rsquo;s length bonus. A <b>pangram</b> uses every letter on the board and pays a further 10.</>,
        <>Reach <b>{VEIN} points</b> and you have struck the Lode, so the day counts as solved. Keep digging for the <b>Mother Lode</b>, every last word.</>,
        <>A board scores a curated set of words. Type a real word that is not on it and it goes to your <b>tailings</b>: acknowledged, worth nothing, and it costs you nothing.</>,
      ]}
      knack="One good word is worth a fistful of easy ones, so work the awkward letters before you clear the obvious four-letter fills."
      footer="One shot counts: your first posted score is the one that ranks, and leaving mid-dig posts what you had. Ties break by fewest words, then fastest clock."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="lode" name="Lode" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="lode" quizId={PUZZLE.quizId}
          name="Lode"
          cat="Word"
          outcome={playing ? null : (score > 0 ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: score, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: score, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="ld-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ld-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .ld-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ld-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .ld-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .ld-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 86%, var(--stg-ink, var(--white)));}
          .ld-btn:disabled{opacity:0.45;cursor:default;}
          .ld-row{display:flex;gap:10px;justify-content:center;}
          .ld-tile{width:58px;height:58px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-weight:900;font-size:25px;color:${INK};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 2px solid var(--stg-line, rgba(28,30,36,0.16));cursor:pointer;user-select:none;box-shadow:0 2px 0 rgba(28,30,36,0.14);transition:transform .08s;}
          .ld-tile:active{transform:translateY(2px);box-shadow:none;}
          .ld-tile.core{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accentDeep});color:var(--stg-onramp, var(--white));box-shadow:0 2px 0 var(--stg-acc, ${COLORS.accentDeep});}
          @media(max-width:420px){.ld-tile{width:46px;height:46px;font-size:21px;}.ld-row{gap:7px;}}
          .ld-entry{font-family:${SANS};font-weight:800;font-size:22px;letter-spacing:0.13em;text-transform:uppercase;text-align:center;width:100%;border:none;border-bottom: 2.5px solid var(--stg-line2, rgba(28,30,36,0.22));background:transparent;color:${INK};padding:8px 4px;outline:none;caret-color:var(--stg-acc, ${COLORS.accent});}
          .ld-entry::placeholder{letter-spacing:0.02em;font-size:14px;font-weight:700;color:#b6bcc6;text-transform:none;}
          .ld-shake{animation:ldshake .3s;}
          @keyframes ldshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
          .ld-track{position:relative;height:10px;border-radius:999px;background:${STAGE ? 'var(--stg-surf2)' : '#e4e7ec'};overflow:hidden;}
          .ld-fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,var(--stg-acc, ${COLORS.accent}),#d99a1a);border-radius:999px;transition:width .35s;}
          .ld-pip{position:absolute;top:-4px;width:2px;height:18px;background:rgba(28,30,36,0.28);}
          .ld-wtag{display:inline-flex;align-items:center;font-family:${MONO};font-size:11.5px;font-weight:500;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.16));border-radius:6px;padding:2px 7px;margin:0 5px 5px 0;color:${INK};}
          .ld-wtag.t3{border-color:rgba(192,57,43,0.45);color:${COLORS.rust};}
          .ld-wtag.t2{border-color:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 50%, transparent);color:var(--stg-acc-ink, ${COLORS.accent});}
          .ld-wtag.pan{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 16%, transparent);border-color:var(--stg-acc, ${COLORS.accent});font-weight:700;}
          .ld-wtag.new{outline:2px solid var(--stg-acc, ${COLORS.accent});outline-offset:1px;}
          /* Tailings: real, unscored. Deliberately the quietest tag on the
             board — dashed and faded, so it reads as acknowledged rather than
             earned and can never be mistaken for a scoring word. */
          .ld-wtag.spare{background:transparent;border-style:dashed;border-color:rgba(28,30,36,0.28);color:${FADED};font-weight:500;}
          .ld-found{max-height:280px;overflow-y:auto;overflow-x:hidden;padding:4px;}
        ` }} />

        <div style={{ maxWidth: 700, margin: '0 auto' }}>


        {/* masthead */}
        {!LOFT && (
        <DailyMasthead
          slug="lode"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={10}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {ALL_LETTERS.length} letters</span>}
          blocks={'LODE'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.stone, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.6)' }}>{ch}</div>
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

        {/* start tile — the seam stays sealed until the player begins */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', maxWidth: 440, margin: '0 auto 4px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Lode is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{ALL_LETTERS.length} letters, one core letter every word must use, and points that reward the words nobody else finds. Your seam stays sealed until you begin.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ld-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <>
            {/* score bar */}
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
              <span style={{ fontSize: 12 }}>score <b style={{ color: struck ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500, fontSize: 20 }}>{score}</b></span>
              <span>vein <b style={{ color: ACC_INK, fontWeight: 500 }}>{VEIN}</b></span>
              <span>words <b style={{ color: INK, fontWeight: 500 }}>{g.found.length}</b></span>
              {pangramsFound > 0 && <span style={{ color: ACC_INK }}>pangram &times;{pangramsFound}</span>}
              {!playing && <span style={{ marginLeft: 'auto', color: `var(--stg-ink, ${COLORS.green})` }}>score posted &mdash; sandbox mode</span>}
            </div>

            {/* rank ladder */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 17, color: struck ? COLORS.green : `var(--stg-acc-ink, ${COLORS.accent})` }}>{rank.n}</span>
                {nextRank && <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>{nextRank.at - score} to {nextRank.n}</span>}
                {!nextRank && <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: `var(--stg-ink, ${COLORS.green})` }}>every word on the board</span>}
              </div>
              <div className="ld-track">
                <div className="ld-fill" style={{ width: `${pct}%` }} />
                {PUZZLE.ranks.slice(0, -1).map((r) => (
                  <div key={r.n} className="ld-pip" style={{ left: `${Math.min(99.6, (r.at / Math.max(1, MAXSCORE)) * 100)}%` }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 320px', minWidth: 290, maxWidth: 440 }}>
                {/* entry */}
                <div ref={shakeRef} style={{ marginBottom: 16 }}>
                  <input
                    ref={inputRef}
                    className="ld-entry"
                    value={entry}
                    disabled={!playing}
                    onChange={(e) => setEntry(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 20))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitEntry(); } }}
                    placeholder={!playing ? 'Day closed' : touchUi ? 'Tap the letters, or tap here to type' : 'Type a word, then Enter'}
                    aria-label="Your word"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>

                {/* letter cluster: outer letters above and below the core */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <div className="ld-row">
                    {topRow.map((ch, i) => <div key={`t${i}`} className="ld-tile" onMouseDown={keepFocus} onClick={() => tapLetter(ch)} role="button" aria-label={`Letter ${ch}`}>{ch}</div>)}
                  </div>
                  <div className="ld-row">
                    <div className="ld-tile core" onMouseDown={keepFocus} onClick={() => tapLetter(CORE)} role="button" aria-label={`Core letter ${CORE}, required in every word`}>{CORE}</div>
                  </div>
                  <div className="ld-row">
                    {botRow.map((ch, i) => <div key={`b${i}`} className="ld-tile" onMouseDown={keepFocus} onClick={() => tapLetter(ch)} role="button" aria-label={`Letter ${ch}`}>{ch}</div>)}
                  </div>
                </div>

                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: FADED, textAlign: 'center', marginTop: 11 }}>
                  Letters can be reused.
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                  <button type="button" className="ld-btn" onMouseDown={keepFocus} onClick={() => setEntry((e) => e.slice(0, -1))} disabled={!entry}><Delete size={14} /> Delete</button>
                  <button type="button" className="ld-btn" onMouseDown={keepFocus} onClick={shuffleLetters}><Shuffle size={14} /> Shuffle</button>
                  <button type="button" className="ld-btn primary" onMouseDown={keepFocus} onClick={submitEntry} disabled={!playing || !entry}>Mine</button>
                </div>

                {playing && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                    <button type="button" className="ld-btn" onClick={cashIn} disabled={!g.found.length}>
                      <CheckCircle2 size={15} strokeWidth={2.4} /> {confirming ? `Post ${score} pts — sure?` : 'Cash in'}
                    </button>
                    {confirming && <button type="button" className="ld-btn" onClick={() => setConfirming(false)}>Keep digging</button>}
                  </div>
                )}
                {playing && (
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
                    {struck
                      ? 'You have struck the Lode. Cash in, or keep digging for the Mother Lode.'
                      : 'One shot counts: your first posted score is the one that ranks.'}
                  </div>
                )}
              </div>

              {/* the haul */}
              <div style={{ flex: '1 1 200px', minWidth: 190 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, marginBottom: 8 }}>
                  Your haul {g.found.length > 0 && <span style={{ color: INK }}>({g.found.length})</span>}
                </div>
                <div className="ld-found">
                  {foundSorted.length ? foundSorted.map((w) => {
                    const x = WORDS.get(w);
                    return (
                      <span key={w} className={`ld-wtag t${x?.t || 1}${x?.g ? ' pan' : ''}${flash === w ? ' new' : ''}`} title={x?.g ? 'Pangram' : TIERS[x?.t || 1].label}>
                        {/* Ternary, not &&: `g` is 0 or 1, and `0 && <Gem/>` renders a literal 0. */}
                        {x?.g ? <Gem size={10} strokeWidth={2.6} style={{ marginRight: 4 }} /> : null}
                        {w.toLowerCase()}
                        <span style={{ marginLeft: 5, fontWeight: 800, fontSize: 10 }}>{x?.p}</span>
                      </span>
                    );
                  }) : <span style={{ fontSize: 12, fontWeight: 600, color: FADED }}>Nothing mined yet.</span>}
                </div>
                {spareSorted.length > 0 && (
                  <>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, margin: '14px 0 8px' }}>
                      Tailings <span style={{ color: INK }}>({spareSorted.length})</span>
                    </div>
                    <div className="ld-found">
                      {spareSorted.map((w) => (
                        <span key={w} className="ld-wtag spare" title="A real word, but not one this board scores">{w.toLowerCase()}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, lineHeight: 1.55, marginTop: 8 }}>
                      Real words, off the seam. They score nothing and cost nothing.
                    </div>
                  </>
                )}
                <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, lineHeight: 1.55, marginTop: 10 }}>
                  {TIERS[1].block} common &middot; {TIERS[2].block} uncommon &middot; {TIERS[3].block} rare &middot; {PANGRAM_BLOCK} pangram. Rarity is what pays here.
                </div>
                {/* Every dictionary word scores, so the board carries a long tail
                    the rarity data cannot rank. Saying so is better than letting a
                    player conclude the tiers are wrong when an obscure word pays
                    the base rate. */}
                <div style={{ fontSize: 11.5, fontWeight: 600, color: FADED, lineHeight: 1.55, marginTop: 8 }}>
                  Rarity is measured from how often a word appears in real writing. Every word in the dictionary counts here, and the most obscure ones have no usage on record at all, so those score at the common rate rather than the rare one.
                </div>
              </div>
            </div>
          </>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '18px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: struck ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {struck ? `${rank.n} — you struck the vein at ${VEIN}.` : `${rank.n}, against a vein of ${VEIN}.`}
                    {' '}{g.found.length} word{g.found.length === 1 ? '' : 's'}{pangramsFound ? `, ${pangramsFound} pangram${pangramsFound > 1 ? 's' : ''}` : ''}.
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>A fresh seam in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A fresh seam lands at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/lode?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          dig yesterday&rsquo;s board &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/lode" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Lode &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
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
              name="Lode"
              catRank={catRank}
              outcome={score > 0 ? 'won' : 'lost'}
              title={score > 0 ? 'Complete' : 'Not complete'}
              detail={`${score} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Lode all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Words"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/lode?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score > 0) ? 'board' : 'reveal', label: (score > 0) ? 'Return to board' : 'Reveal answer',
                  sub: (score > 0) ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Lode', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/lode?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="lode" name="Lode" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="lode" name="Lode" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="lode"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="lode" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Lode to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.
                </p>
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

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="lode"
          won={struck}
          completed
          score={<>{score} pts &middot; {rank.n}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: toast.bad ? COLORS.rust : COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}

      {/* help modal */}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="ld-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Lode — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Lode</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Lode is a free daily word puzzle from Mind Loft, and a fresh answer to the make-words-from-letters puzzle. Every player gets the same seven letters, with one core letter that every word must contain, and eight letters in the Sunday Edition. Words must be four letters or longer, and you can reuse a letter as often as you like. A word that uses every letter on the board is a pangram.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The twist is the scoring. Points come from how rare a word is, not simply how long it is, so an uncommon word is worth two or three ordinary ones and a single good find can outrank a long grind. Reach the day&rsquo;s vein and you have struck the Lode, which counts the day as solved. Keep going and the Mother Lode waits at the far end, where you have found every word on the board.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A fresh board lands every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/tuck" style={{ color: INK, fontWeight: 800 }}>Tuck</a>, our tile-tucking puzzle, and <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our unscrambling puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
