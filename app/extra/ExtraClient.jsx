'use client';

// Extra — the daily front page.
//
// One historic front page a day, with the giveaway words blacked out. Type
// what story it is: name it straight off the redacted page for a perfect
// "cold read" 10. A wrong guess, or a press of the TEAR button, rips the
// censor strip off one more word — six tears and the page is bare. Score is
// 10 minus tears used; a wrong guess with nothing left to tear ends the puzzle.
// One free hint reveals the dateline (the paper's date and place). Ties on
// the daily board break by fewest tears, then fastest time.
//
// Same daily plumbing as Circa/Suds/Tally: banked pages gated by Eastern date
// on the server (app/extra/page.js), per-puzzle localStorage saves, /extra?p=N
// archive pinning, streaks + stats, the shared /api/quiz/* board flow, and
// focus mode (page chrome hidden while playing). Sundays run a trickier story.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, RotateCcw, X, Lightbulb, Eye, Smartphone, Scissors, Newspaper } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { resolveHidden } from './resolve-hidden';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#b91c1c',       // Extra identity — pressroom red
  accentSoft: '#fdeeee',
  green: T.successDeep,
  greenSoft: '#eefaf1',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const SERIF = "Georgia, 'Times New Roman', 'Droid Serif', serif";
const PAPER = '#fbf9f4';
const NEWSPRINT = '#faf7ef';
const HELP_KEY = 'sot_extra_help_seen';
const STATS_KEY = 'sot_extra_stats';

const MAX_TEARS = 6;

const normGuess = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

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

// ─── Personal stats + streak (localStorage), Circa/Suds pattern ─────────────
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

function freshState() {
  return {
    v: 1,
    tears: 0,                   // words revealed (wrong guesses + tear presses)
    wrong: [],                  // wrong guesses, for the little chip row
    hintUsed: false,
    status: 'playing',          // playing | won | revealed
    t0: null,
    tEnd: null,
  };
}

export default function ExtraClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_extra_${PUZZLE.num}`;
  const WORDS = useMemo(() => PUZZLE.head.split(/\s+/), [PUZZLE]);
  const HIDDEN = useMemo(() => resolveHidden(PUZZLE), [PUZZLE]); // word indices in reveal order

  const [g, setG] = useState(freshState);
  const [val, setVal] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('extra', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('extra'); }, [g.hintUsed]);
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

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('extra');
  const STAGE = isStage('extra', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('extra');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('extra'), '--stg-acc-lt': gameColorLight('extra'), '--stg-onramp-lt': gameOnrampLight('extra'), '--stg-acc-ink-lt': gameAccentInkLight('extra') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const won = g.status === 'won';
  const tears = g.tears;

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

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && typeof saved.tears === 'number') {
          setG({ ...freshState(), ...saved, wrong: Array.isArray(saved.wrong) ? saved.wrong : [] });
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_extra_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_extra_day'); })();
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
  const iq = useIqStanding({ game: 'extra', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'extra', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'extra', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'extra', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'extra', active: LOFT && !playing });
  // Retired (owner ruling 2026-08-07): Extra's bank ends at No. 77 on
  // 2026-09-29 and nothing is banked past it, so once the final front page is in
  // the past there is no next drop. Say so BEFORE play, not only after.
  const gameRetired = pickPuzzle(puzzles, null).live < etToday();
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const finalScore = won ? Math.max(1, 10 - tears) : 0;

  const REC_KEY = `sot_extra_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = g.tears > 0 || (g.wrong && g.wrong.length > 0) || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.tears, won: score === 10 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = tears, so the daily leaderboard (score, then guesses,
        // then time) resolves ties by fewest tears and then fastest finish.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.tears, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function isRight(guess) {
    const ng = normGuess(guess);
    if (!ng) return false;
    return PUZZLE.keys.some((k) => ng.includes(k));
  }

  function submitGuess() {
    if (!playing) return;
    const raw = val.trim();
    if (raw.replace(/[^a-zA-Z0-9]/g, '').length < 3) { say('Give the story a real name.'); return; }
    setVal('');
    if (isRight(raw)) {
      const g2 = { ...g, status: 'won', tEnd: Date.now() };
      if (!g2.t0) g2.t0 = Date.now();
      postResult(g2, Math.max(1, 10 - g2.tears));
      setG(g2);
      setJustWon(true);
      return;
    }
    // wrong: costs a tear; with nothing left to tear, the presses stop
    if (tears >= MAX_TEARS) {
      const g2 = { ...g, wrong: [...g.wrong, raw].slice(-8), status: 'revealed', tEnd: Date.now() };
      if (!g2.t0) g2.t0 = Date.now();
      postResult(g2, 0);
      setG(g2);
      return;
    }
    const g2 = { ...g, tears: tears + 1, wrong: [...g.wrong, raw].slice(-8) };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say(`Not it — another word torn free. ${MAX_TEARS - g2.tears} tear${MAX_TEARS - g2.tears === 1 ? '' : 's'} left.`);
    if (!mobileUi) { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }
  }

  function tearOne() {
    if (!playing || tears >= MAX_TEARS) return;
    const g2 = { ...g, tears: tears + 1 };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
  }

  // one free hint: reveal the dateline
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const g2 = { ...g, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say('Hint: the dateline is now showing.');
  }

  function revealEnd() {
    const g2 = { ...g, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setG(g2);
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setVal(''); setJustWon(false); setEndClosed(false);
  }

  function shareText() {
    const squares = Array.from({ length: MAX_TEARS }, (_, i) => (i < tears ? '\u{1F7E5}' : '⬛')).join('');
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Extra #${PUZZLE.num} · ${tears === 0 ? 'cold read!' : `named it, ${tears} tear${tears === 1 ? '' : 's'}`}${hintBit}${streakBit}`
      : `Extra #${PUZZLE.num} · stumped${hintBit}`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/extra${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Extra #${PUZZLE.num} — the daily front page from Mind Loft.\n${shareUrl()}`
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

  // ── the redacted headline ──
  // A word is visible if it's not hidden, its reveal slot has been torn, or
  // the puzzle is over (the whole page unredacts at the end).
  const revealedSet = useMemo(() => {
    const s = new Set();
    for (let k = 0; k < Math.min(tears, HIDDEN.length); k++) s.add(HIDDEN[k]);
    return s;
  }, [tears, HIDDEN]);
  const lastTornIdx = tears > 0 && tears <= HIDDEN.length ? HIDDEN[tears - 1] : -1;

  function renderHead() {
    return WORDS.map((w, i) => {
      const m = /^(.*?)([;:,.!?]*)$/.exec(w);
      const core = m[1], punct = m[2];
      const hiddenSlot = HIDDEN.indexOf(i);
      const show = hiddenSlot === -1 || revealedSet.has(i) || !playing;
      if (show) {
        const fresh = playing && i === lastTornIdx;
        return (
          <React.Fragment key={i}>
            <span style={{ whiteSpace: 'nowrap' }}>
              <span style={fresh ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeb8', borderRadius: 3, padding: '0 2px', animation: 'exflash 1.2s ease' } : undefined}>{core}</span>{punct}
            </span>{' '}
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={i}>
          <span style={{ whiteSpace: 'nowrap' }}>
            <span aria-label="redacted" style={{ display: 'inline-block', width: `${Math.max(2.2, core.length * 0.62)}ch`, height: '0.82em', background: COLORS.ink, borderRadius: 2, verticalAlign: 'baseline', transform: 'translateY(0.08em)' }} />{punct}
          </span>{' '}
        </React.Fragment>
      );
    });
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="A historic front page, with the giveaway words blacked out. Name the story."
      steps={[
        <>Read the page and <b>type the story</b>: the event, in your own words (&ldquo;the moon landing&rdquo;, &ldquo;Nixon resigns&rdquo;).</>,
        <>A wrong guess, or a press of <b>Tear a word free</b>, rips the censor strip off one more word. You get <b>six tears</b>.</>,
        <>A wrong guess with nothing left to tear <b>ends the puzzle</b>.</>,
        <>One free <b>hint</b>, on your first ever play, reveals the dateline: the paper&rsquo;s date and place.</>,
      ]}
      knack="A wrong guess and a deliberate tear cost exactly the same, so when you are unsure, tear on purpose rather than guess and hope."
      footer="Naming it with zero tears is a cold read, a perfect 10, and every tear costs a point. Ties break on fewest tears, then fastest time. Sundays run a trickier story."
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
      <DailyChrome slug="extra" name="Extra" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. "Name the story" is a QUESTION, not a figure, so it stays in the card above
          the board; only the tear counter comes up here. */}
      {LOFT && (
        <Cap gameKey="extra" quizId={PUZZLE.quizId}
          name="Extra"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · Tricky' : null}
          figures={playing ? [
            { v: `${tears}/${MAX_TEARS}`, k: 'tears' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: `${tears}/${MAX_TEARS}`, k: 'tears' },
          ]}
        />
      )}
      <div className="ex-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ex-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ex-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ex-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes exfade{from{opacity:0;}}
          @keyframes exstamp{from{opacity:0;transform:scale(.94);}}
          @keyframes exflash{from{background:${STAGE ? 'var(--stg-surf2)' : '#f9d34c'};}}
          @media(max-width:560px){.ex-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.ex-ttl h1{font-size:21px;letter-spacing:0.02em;}.ex-ttl .ex-ttl-dt{font-size:15px;}.ex-ttl-dot{display:none;}}
          .ex-inp{font-family:${SANS};font-weight:700;font-size:16px;flex:1 1 auto;min-width:0;border:2px solid ${COLORS.ink};border-radius:9px;padding:12px 14px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .ex-inp:focus{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 14%, transparent);}
          .ex-go{font-family:${SANS};font-weight:800;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;border:2px solid var(--stg-acc, ${COLORS.accent});background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));border-radius:9px;padding:0 20px;cursor:pointer;height:50px;flex:0 0 auto;}
          .ex-go:active{transform:translateY(1px);}
          .ex-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .ex-tool:disabled{opacity:.45;cursor:default;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip: quiet nav + player chip (hidden in focus mode while playing) */}

        {/* masthead: pressed EXTRA tiles with No./date inline */}
        {!LOFT && (
        <DailyMasthead
          slug="extra"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Tricky</span>}
          blocks={'EXTRA'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {gameRetired && (
          <div style={{ background: STAGE ? 'var(--stg-surf2)' : '#fff7ed', border: '1.5px solid rgba(180,83,9,0.4)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.5 }}>
            Extra has retired &mdash; this archive stays playable, but no new front pages drop.{' '}
            Meet its successor: <a href="/redact" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Redact, the daily uncover-the-story puzzle &rarr;</a>
          </div>
        )}

        {/* start tile — sits where the front page goes; the redacted headline
            stays sealed until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Extra is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>A historic front page with the giveaway words blacked out. Name the story.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ex-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* the front page */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 17px 17px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing
              them twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>name the story</span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>tears <b style={{ color: tears > 0 ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{tears}</b>/{MAX_TEARS}</span>
          </div>
          )}
          {/* The PROMPT stays here. It is a question (and for Ping a
              control), not a figure, so it belongs with the board rather
              than in the cap. Restyled off the retired mono texture. */}
          {LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, borderBottom: '1px solid rgba(28,30,36,0.12)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span>Name the story</span>
          </div>
          )}

          {/* the paper itself */}
          <div style={{ background: STAGE ? 'var(--stg-surf)' : NEWSPRINT, border: `1px solid ${STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.22)'}`, borderRadius: 4, padding: '14px 16px 16px', boxShadow: 'inset 0 0 24px rgba(28,30,36,0.05)' }}>
            <div style={{ borderBottom: `2.5px solid ${COLORS.ink}`, paddingBottom: 6, marginBottom: 7, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 19, letterSpacing: '0.04em', color: INK }}>The Daily Truth</span>
              <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 3, padding: '2px 7px', transform: 'rotate(-2deg)' }}>EXTRA</span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em', color: FADED }}>ONE CENT</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.09em', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.3)', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase' }}>
              {(g.hintUsed || !playing) ? PUZZLE.dateline : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: '16ch', height: '0.8em', background: 'rgba(28,30,36,0.75)', borderRadius: 2 }} />
                  <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>dateline withheld</span>
                </span>
              )}
            </div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 27, lineHeight: 1.32, color: INK, letterSpacing: '0.01em' }}>
              {renderHead()}
            </div>
          </div>

          {/* interaction */}
          {started && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <input
                  ref={inputRef}
                  className="ex-inp"
                  type="text"
                  placeholder="What's the story? (e.g. the moon landing)"
                  value={val}
                  autoFocus={!mobileUi}
                  onChange={(e) => setVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitGuess(); }}
                  aria-label="Name the story"
                />
                <button className="ex-go" onClick={submitGuess}>Guess</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button className="ex-tool" onClick={tearOne} disabled={tears >= MAX_TEARS} title="Reveal one more word (costs a tear)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(185,28,28,0.5)', color: 'var(--stg-bad, #8f1d1d)' }}>
                  <Scissors size={14} /> Tear a word free
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="ex-tool" onClick={useHint} title="Reveal the dateline (one hint, first play only)">
                    <Lightbulb size={14} /> Hint: the dateline
                  </button>
                )}
                {identity && (tears > 0 || g.wrong.length > 0) && (
                  <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and names the story' : 'Reveal & end'}
                  </button>
                )}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, marginTop: 9 }}>
                A wrong guess also tears a word free. Name it with <b style={{ color: INK }}>no tears</b> for a perfect cold read.
              </div>
              {g.wrong.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 9 }}>
                  {g.wrong.map((w, i) => (
                    <span key={i} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, background: STAGE ? 'var(--stg-surf2)' : '#f1f2f5', border: '1px solid rgba(28,30,36,0.14)', borderRadius: 6, padding: '3px 9px', textDecoration: 'line-through' }}>{w}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              {/* the answer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? 'var(--stg-raise)' : PAPER, border: `1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.18)'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                <Newspaper size={26} style={{ color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, flex: '0 0 auto' }} />
                <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                  {PUZZLE.answer} ({PUZZLE.year}). <span style={{ color: FADED, fontWeight: 600 }}>{PUZZLE.d}</span>
                </span>
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '2px 0 8px' }}>The Sunday Edition — a trickier story to name.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {gameRetired ? (
                      <>
                        Extra has retired &mdash; this was its final front page. Every past edition stays playable in{' '}
                        <a href="/daily" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>the archive</a>.
                        {' '}Meet its successor:{' '}
                        <a href="/redact" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Redact, the daily uncover-the-story puzzle &rarr;</a>
                      </>
                    ) : countdown ? <>Next Extra in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new front page drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/extra?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Extra &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/extra" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Extra &rarr;</a>
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
              name="Extra"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${`${tears}/${MAX_TEARS}`} tears`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Extra all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Tears"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/extra?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Extra', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/extra?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="extra" name="Extra" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="extra" name="Extra" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="extra"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="extra" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Extra to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s front page, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s front page, every day.
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

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="extra"
          won={won}
          headline={won ? <>Nailed the read!</> : <>You scored {Math.round((finalScore / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {tears === 0 ? 'a perfect cold read' : `named it with ${tears} tear${tears === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the story got away</>}
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
            <button className="ex-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Extra — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Extra</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Extra is a free daily history puzzle from Mind Loft, the daily front page. Each day resurrects one of history&rsquo;s great headlines with the giveaway words blacked out, newsroom-censor style. Your job: name the story.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Guess wrong, or press the tear button, and one more word rips free, six tears and the page is bare. Name the story straight off the fully redacted page and that&rsquo;s a cold read, the perfect score. A free hint reveals the dateline if you need a foothold in time.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          {gameRetired ? (
            <>Extra has retired: every past front page stays free to play, but no new ones drop. Its successor is{' '}
            <a href="/redact" style={{ color: INK, fontWeight: 800 }}>Redact</a>, where a whole article is blacked out and you uncover it word by word.</>
          ) : (
            <>A new front page drops every day at midnight Eastern, with a trickier story on Sundays.</>
          )}{' '}
          No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/outrank" style={{ color: INK, fontWeight: 800 }}>Outrank</a>, our crowd-ranking puzzle, <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>, our history-ordering puzzle, and <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );
}
