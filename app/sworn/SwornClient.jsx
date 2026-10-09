'use client';

// Sworn — the daily liars puzzle (a Knights-and-Knaves whodunit).
//
// One inquest a day: a handful of locals are sworn in, each gives exactly one
// statement, and you are told exactly how many of them are lying. Liars'
// statements are false, truth-tellers' are true, and exactly one suspect is
// the thief. Every banked case is machine-verified to a unique
// (thief, liar-set) world AND to fall to pure propagation — no guessing
// (see scripts/verify-sworn.mjs). Mark your scratch verdicts, then accuse.
//
// The client never receives the solution over the wire: the server page
// strips it, and this component re-derives the unique world by brute force
// over every thief x liar-subset (tiny at 5-6 suspects).
//
// Scoring: name the thief for max(1, 12 - 2×wrong accusations) out of 12 — a
// first-try accusation is a perfect 12. Ties on the daily board break by
// fewest wrong accusations, then fastest time. Revealing ends the day at 0.
// One free hint (verifies one witness) — first play only.
//
// Same daily plumbing as Alibi/Circa/Suds: banked cases gated by Eastern date
// on the server (app/sworn/page.js), per-puzzle localStorage saves, /sworn?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Lightbulb, Scale, Eraser } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
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
import RunDoorPop from '../circuits/RunDoorPop';
import { useRunEmbed } from '../RunEmbed';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
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
  accent: '#be185d',        // Sworn identity — courtroom berry
  accentSoft: '#fce7f3',
  accentDeep: '#9d174d',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const SERIF = "'Newsreader', Georgia, 'Times New Roman', serif";
const HELP_KEY = 'sot_sworn_help_seen';
const STATS_KEY = 'sot_sworn_stats';
const TOTAL = 12;

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

// ─── Solver: re-derive THE unique world from the testimony (no answer wire) ─
function stmtTruth(st, speaker, thief, liarMask) {
  const isLiar = (i) => (liarMask >> i) & 1;
  switch (st.type) {
    case 'accuse': return thief === st.x;
    case 'innocent': return thief !== st.x;
    case 'selfInnocent': return thief !== speaker;
    case 'liar': return !!isLiar(st.x);
    case 'honest': return !isLiar(st.x);
    case 'thiefLiar': return !!isLiar(thief);
    case 'thiefHonest': return !isLiar(thief);
  }
  return false;
}
function solveCase(n, k, statements) {
  for (let thief = 0; thief < n; thief++) {
    for (let mask = 0; mask < (1 << n); mask++) {
      let bits = 0;
      for (let i = 0; i < n; i++) bits += (mask >> i) & 1;
      if (bits !== k) continue;
      let ok = true;
      for (let s = 0; s < n && ok; s++) {
        if (stmtTruth(statements[s], s, thief, mask) === !!((mask >> s) & 1)) ok = false;
      }
      if (ok) return { thief, mask }; // banked cases are verified unique
    }
  }
  return null;
}

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
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState(n) {
  return {
    v: 1,
    marks: Array(n).fill(0),    // scratch verdicts: 0 unknown | 1 truthful | 2 lying
    accusedWrong: [],           // suspect indexes already accused wrongly
    verified: null,             // hint: { x, honest } — one witness verified
    hintUsed: false,
    status: 'playing',          // playing | done | lost
    wrong: 0,                   // wrong accusations
    t0: null,
    tEnd: null,
  };
}

export default function SwornClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.suspects.length;
  const STORE_KEY = `sot_sworn_${PUZZLE.num}`;
  const SOLUTION = useMemo(() => solveCase(N, PUZZLE.k, PUZZLE.statements), [N, PUZZLE]);

  const [g, setG] = useState(() => freshState(N));
  const [verdict, setVerdict] = useState(null);
  // The phone stand shows one witness large at a time; this is which.
  const [pick, setPick] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact start card
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
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('sworn', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('sworn'); }, [g.hintUsed]);
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

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const LOFT = isLoft('sworn');
  const STAGE = isStage('sworn', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('sworn');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('sworn'), '--stg-acc-lt': gameColorLight('sworn'), '--stg-onramp-lt': gameOnrampLight('sworn'), '--stg-acc-ink-lt': gameAccentInkLight('sworn') };
  const [stageTheme] = useStageTheme();
  // Inside the Judged run (app/RunEmbed.jsx) the page furniture drops away
  // and the board sits on the run's dark ground; the game itself is unchanged.
  const EMBED = useRunEmbed();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;   // not begun: show the start tile where the board goes
  const started = playing && !!g.t0;    // clock running: show the board
  const focusMode = playing && !showChrome;
  const won = g.status === 'done' && g.wrong === 0;
  // A reveal keeps the player's own marks (and the thief) hidden until the
  // end card's Reveal tile is pressed; the finish beat would otherwise show them.
  const hideSol = LOFT && g.status === 'lost' && !revealed;
  const score = g.status === 'done' ? Math.max(1, TOTAL - 2 * g.wrong) : 0;
  const liarsMarked = g.marks.filter((m) => m === 2).length;

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
      let restored = null;
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && saved.marks && saved.marks.length === N) { restored = saved; setG({ ...freshState(N), ...saved }); }
      }
      // The start tile shows in place of the board until the player begins (t0 set
      // on Start). First-timers see the full rules on the tile; a returning player
      // gets the compact start card with a "Show instructions" toggle.
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
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_sworn_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_sworn_day'); })();
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
  const iq = useIqStanding({ game: 'sworn', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'sworn', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'sworn', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'sworn', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'sworn', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // Record an in-progress inquest if the player interacts then leaves before
  // accusing (Tuck's abandoned-puzzle pattern). Loading the page does NOT count;
  // the first mark/accusation sets g.t0, which is the "started" signal. On
  // exit we post a 0-score result so every started puzzle lands in the stats
  // even when abandoned. The localStorage marker stops a resume-then-leave-
  // again cycle from double-posting; markFlushed() in postResult suppresses
  // the exit post once the puzzle concludes normally (accusation or reveal).
  const REC_KEY = `sot_sworn_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (a mark, wrong accusation,
    // hint, or clear). Merely opening the puzzle and dismissing the start gate does
    // not log a 0-score attempt.
    const acted = g.marks.some((m) => m > 0) || g.wrong > 0 || g.hintUsed || g.accusedWrong.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: g.wrong, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    if (EMBED) EMBED.onResult({ key: 'sworn', score: sc, total: TOTAL, t0: g2 && g2.t0, tEnd: (g2 && g2.tEnd) || Date.now() });
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.wrong, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = wrong accusations, so the daily board's ties break by
        // the surer juror.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: g2.wrong, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Closing the start gate begins the clock (sets t0) and marks the rules as seen.
  // A no-op once started, so re-reading the rules later never resets the timer.
  function startInquest() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function tapMark(i) {
    if (!playing) return;
    setG((cur) => {
      const marks = cur.marks.slice();
      marks[i] = (marks[i] + 1) % 3;
      return { ...cur, marks, t0: cur.t0 || Date.now() };
    });
    setVerdict(null);
  }
  // The TRUE / LYING segmented toggle: sets the scratch verdict directly, and
  // pressing the lit side again clears it. Same 0/1/2 marks as tapMark, so the
  // save shape is unchanged, and marks never touch the score.
  function setMark(i, v) {
    if (!playing) return;
    setG((cur) => {
      const marks = cur.marks.slice();
      marks[i] = marks[i] === v ? 0 : v;
      return { ...cur, marks, t0: cur.t0 || Date.now() };
    });
    setVerdict(null);
  }
  function clearMarks() {
    if (!playing) return;
    setG((cur) => ({ ...cur, marks: Array(N).fill(0) }));
    setVerdict(null);
  }

  function accuse(i) {
    if (!playing || !SOLUTION) return;
    if (g.accusedWrong.includes(i)) { say(`${PUZZLE.suspects[i]} already beat that charge.`); return; }
    if (i === SOLUTION.thief) {
      const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
      setG(g2);
      setVerdict(null);
      setEndClosed(false);
      postResult(g2, Math.max(1, TOTAL - 2 * g2.wrong));
    } else {
      setG((cur) => ({ ...cur, wrong: cur.wrong + 1, accusedWrong: [...cur.accusedWrong, i], t0: cur.t0 || Date.now() }));
      setVerdict({ msg: `${PUZZLE.suspects[i]} has an ironclad defense, so the charge fails (minus 2 points).` });
    }
  }

  // one free hint: verify one witness (first play only). Picks a
  // non-thief so the accusation itself is never handed over.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed || !SOLUTION) return;
    setG((cur) => {
      let x = -1;
      for (let i = 0; i < N; i++) {
        if (i !== SOLUTION.thief && !cur.accusedWrong.includes(i)) { x = i; break; }
      }
      if (x === -1) return { ...cur, hintUsed: true };
      const honest = !((SOLUTION.mask >> x) & 1);
      const marks = cur.marks.slice();
      marks[x] = honest ? 1 : 2;
      return { ...cur, marks, verified: { x, honest }, hintUsed: true, t0: cur.t0 || Date.now() };
    });
  }

  function reveal() {
    if (!playing || !SOLUTION) return;
    setG((cur) => {
      const marks = cur.marks.slice();
      for (let i = 0; i < N; i++) marks[i] = (SOLUTION.mask >> i) & 1 ? 2 : 1;
      const g2 = { ...cur, marks, pre: cur.marks, status: 'lost', tEnd: Date.now(), t0: cur.t0 || Date.now() };
      postResult(g2, 0);
      return g2;
    });
    setVerdict(null);
    setEndClosed(false);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(N)); setVerdict(null); setEndClosed(false);
  }

  function stmtText(st, s) {
    const S = PUZZLE.suspects;
    switch (st.type) {
      case 'accuse': return <>&ldquo;<b>{S[st.x]}</b> is the thief.&rdquo;</>;
      case 'innocent': return <>&ldquo;<b>{S[st.x]}</b> is innocent.&rdquo;</>;
      case 'selfInnocent': return <>&ldquo;I am not the thief.&rdquo;</>;
      case 'liar': return <>&ldquo;<b>{S[st.x]}</b> is lying.&rdquo;</>;
      case 'honest': return <>&ldquo;<b>{S[st.x]}</b> is telling the truth.&rdquo;</>;
      case 'thiefLiar': return <>&ldquo;The thief is lying.&rdquo;</>;
      case 'thiefHonest': return <>&ldquo;The thief is telling the truth.&rdquo;</>;
    }
    return null;
  }

  const thiefName = SOLUTION ? PUZZLE.suspects[SOLUTION.thief] : '';

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead="One of the sworn is the thief. Find them from the statements alone."
      chips={[
        { label: 'Truthful ✓', tone: 'good' },
        { label: 'Lying ✗', tone: 'bad' },
      ]}
      steps={[
        <>Each of the sworn gives <b>one statement</b>, and you&rsquo;re told <b>exactly how many are lying</b>. Liars&rsquo; statements are false, truth-tellers&rsquo; are true.</>,
        <>Test each theory: assume a suspect is the thief and see whether the lie count works out.</>,
        <>Mark each witness <b>True</b> or <b>Lying</b> to keep scratch verdicts as you go. Marks are notes for you and never change your score.</>,
        <>When you&rsquo;re sure, hit <b>Accuse</b>.</>,
      ]}
      knack="Every case has exactly one consistent story, reachable by pure logic, so a theory that leaves the lie count off by even one is dead."
      footer={<>A first-try accusation is a perfect 12, and each wrong accusation costs 2. Ties on the daily board break by fewest wrong accusations, then fastest time. Six are sworn for Sunday&rsquo;s Grand Inquest.</>}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? (EMBED ? 'dark' : stageTheme) : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="sworn" name="Sworn" collapsed={started} loft={LOFT} />
      )}
      {LOFT && !EMBED && (
        <Cap gameKey="sworn" quizId={PUZZLE.quizId}
          name="Sworn"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: g.wrong, k: 'wrong' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: g.wrong, k: 'wrong' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sw-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap');
          @media(max-width:560px){.sw-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .sw-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sw-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sw-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, var(--white));}
          .sw-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accentDeep}) 86%, var(--stg-ink, var(--white)));}
          /* THE WITNESS STAND (see the board below). Stage tokens, with light
             fallbacks so the Loft branch still renders. */
          .sw-story{margin:0 0 14px;font-family:${SERIF};font-style:italic;font-size:18px;line-height:1.5;color:var(--stg-ink2, ${COLORS.ink});}
          .sw-story b{font-style:normal;color:var(--stg-ink, ${COLORS.ink});}
          .sw-meter{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 22px;}
          .sw-meterk{font-family:${MONO};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute, ${COLORS.faded});}
          .sw-mright{margin-left:auto;}
          .sw-slots{display:inline-flex;gap:6px;}
          .sw-slot{width:22px;height:22px;border-radius:6px;box-sizing:border-box;border:2px dashed var(--stg-cell-line, rgba(28,30,36,0.44));}
          .sw-slot.on{border:2px solid var(--stg-acc-ink, ${COLORS.accent});background:var(--stg-acc, ${COLORS.accent});}
          .sw-over{font-family:${SANS};font-size:12px;font-weight:700;color:var(--stg-bad, #b91c1c);}
          .sw-stand{display:grid;gap:12px;align-items:start;}
          .sw-wit{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0;}
          .sw-bub{position:relative;width:100%;box-sizing:border-box;background:var(--stg-cell, #ffffff);border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.44));border-radius:14px;padding:13px 11px;min-height:118px;display:flex;align-items:center;margin-bottom:8px;}
          .sw-q{font-family:${SERIF};font-size:16px;line-height:1.35;color:var(--stg-ink, ${COLORS.ink});overflow-wrap:anywhere;}
          .sw-q b{font-weight:600;}
          .sw-wit.m2 .sw-q{color:var(--stg-mute, ${COLORS.faded});}
          .sw-tail{position:absolute;left:50%;bottom:-9px;width:16px;height:16px;background:var(--stg-cell, #ffffff);border-right:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.44));border-bottom:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.44));transform:translateX(-50%) rotate(45deg);}
          .sw-av{width:72px;height:72px;flex:0 0 auto;border-radius:50%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-size:28px;font-weight:800;background:var(--stg-cell, #ffffff);border:3px solid var(--stg-cell-line, rgba(28,30,36,0.44));color:var(--stg-ink2, ${COLORS.ink});}
          .sw-av.m1{background:var(--stg-ink, ${COLORS.ink});border-color:var(--stg-ink, ${COLORS.ink});color:var(--stg-ground, #ffffff);}
          .sw-av.m2{border-color:var(--stg-acc-ink, ${COLORS.accent});color:var(--stg-acc-ink, ${COLORS.accent});}
          .sw-av.sm{width:52px;height:52px;font-size:21px;}
          .sw-av.xs{width:26px;height:26px;font-size:11px;border-width:2px;}
          .sw-name{font-size:15px;font-weight:800;color:var(--stg-ink, ${COLORS.ink});text-align:center;overflow-wrap:anywhere;}
          .sw-ver{font-family:${MONO};font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;border:1px solid;border-radius:4px;padding:2px 6px;}
          .sw-seg{display:flex;width:100%;border:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.44));border-radius:10px;overflow:hidden;}
          .sw-segb{flex:1 1 0;min-width:0;min-height:44px;border:0;margin:0;border-radius:0;background:transparent;color:var(--stg-mute, ${COLORS.faded});font-family:${MONO};font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;padding:0 2px;}
          .sw-segb + .sw-segb{border-left:1.5px solid var(--stg-cell-line, rgba(28,30,36,0.44));}
          .sw-segb:hover:not(:disabled){background:var(--stg-surf2, ${COLORS.accentSoft});}
          .sw-segb:disabled{cursor:default;}
          .sw-segb.t.on{background:var(--stg-ink, ${COLORS.ink});color:var(--stg-ground, #ffffff);}
          .sw-segb.l.on{background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #ffffff);}
          .sw-seg.big{flex:2 1 0;}
          .sw-seg.big .sw-segb{min-height:48px;font-size:12px;}
          .sw-accuse{width:100%;min-height:44px;font-family:${SANS};font-weight:800;font-size:13px;border:1.5px solid var(--stg-acc-ink, ${COLORS.accent});background:transparent;color:var(--stg-acc-ink, ${COLORS.accentDeep});border-radius:10px;padding:0 10px;cursor:pointer;}
          .sw-accuse:hover:not(:disabled){background:var(--stg-acc-tint, ${COLORS.accentSoft});}
          .sw-accuse:disabled{opacity:0.45;cursor:not-allowed;text-decoration:line-through;}
          .sw-accuse.big{flex:1 1 0;width:auto;min-height:48px;font-size:14px;}
          .sw-ph{display:none;}
          .sw-avrow{display:flex;justify-content:space-between;gap:4px;}
          .sw-avb{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;background:transparent;border:0;border-radius:12px;padding:6px 0;cursor:pointer;color:var(--stg-ink, ${COLORS.ink});font-family:${SANS};}
          .sw-avb.sel{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .sw-avn{font-size:12px;font-weight:800;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .sw-avt{font-family:${MONO};font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;}
          .sw-focus{margin-top:14px;background:var(--stg-cell, #ffffff);border:1.5px solid var(--stg-ink, ${COLORS.ink});border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:14px;}
          .sw-fq{font-family:${SERIF};font-size:23px;line-height:1.3;color:var(--stg-ink, ${COLORS.ink});}
          .sw-fq b{font-weight:600;}
          .sw-fq.m2{color:var(--stg-mute, ${COLORS.faded});}
          .sw-trow{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:8px 6px;background:transparent;border:0;border-bottom:1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:0;text-align:left;cursor:pointer;}
          .sw-trow.sel{background:var(--stg-surf, rgba(28,30,36,0.04));}
          .sw-tq{flex:1 1 auto;min-width:0;font-family:${SERIF};font-size:15px;line-height:1.35;}
          .sw-tq b{font-weight:600;}
          .sw-tn{font-family:${SANS};font-size:12.5px;font-weight:800;margin-right:2px;}
          .sw-foot{margin:22px 0 6px;padding:14px 16px;border-radius:12px;background:var(--stg-surf, rgba(28,30,36,0.04));border:1px solid var(--stg-line, rgba(28,30,36,0.14));display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
          .sw-foott{flex:1 1 260px;font-size:13px;font-weight:600;line-height:1.5;color:var(--stg-mute, ${COLORS.faded});}
          .sw-foot .sw-btn{min-height:44px;}
          @media(max-width:860px){
            .sw-stand{gap:8px;}
            .sw-av{width:56px;height:56px;font-size:22px;}
            .sw-segb{font-size:10px;letter-spacing:0;}
            .sw-q{font-size:15px;}
          }
          @media(max-width:640px){
            .sw-stand{display:none;}
            .sw-ph{display:block;}
            .sw-story{font-size:16px;}
            .sw-meter{margin-bottom:16px;}
            .sw-mright{margin-left:0;flex-basis:100%;}
          }
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>


        {/* masthead */}
        {!LOFT && (
        <DailyMasthead
          slug="sworn"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Grand Inquest</span>}
          blocks={'SWORN'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

        {/* the story, hidden behind the start tile until the player begins */}
        {!preStart && (
        <p className="sw-story">
          Last night at {PUZZLE.venue}, {PUZZLE.stolen} vanished. {N === 6 ? 'Six' : 'Five'} locals were sworn in, and one of them is the thief. Each gave exactly one statement, but <b>exactly {PUZZLE.k} of the {N} are lying</b>. Liars&rsquo; statements are false; everyone else&rsquo;s are true. Find the thief.
        </p>
        )}

        {/* the liars meter: one slot per liar in the case; a slot fills as you
            mark a witness LYING. Scratch only, it never touches the score. */}
        {!preStart && (
        <div className="sw-meter">
          <span className="sw-meterk">Liars marked</span>
          <span className="sw-slots" aria-label={`${liarsMarked} of ${PUZZLE.k} liars marked`}>
            {Array.from({ length: PUZZLE.k }, (_, s) => (
              <span key={s} className={`sw-slot${s < liarsMarked ? ' on' : ''}`} />
            ))}
          </span>
          {liarsMarked > PUZZLE.k && <span className="sw-over">{liarsMarked} marked, only {PUZZLE.k} lie</span>}
          <span className="sw-meterk sw-mright">Wrong accusations <b style={{ color: g.wrong ? 'var(--stg-bad, #b91c1c)' : INK }}>{g.wrong}</b>{g.hintUsed ? <> &middot; hint used</> : null}</span>
        </div>
        )}

        {/* start tile — sits where the board goes; the testimony stays sealed
            (not rendered) until the player presses Start, which begins the clock. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px 22px', minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The court is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N === 6 ? 'Six' : 'Five'} locals are under oath, and one of them is the thief. Their testimony stays sealed until you begin.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sw-btn" onClick={startInquest} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start the inquest</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* THE WITNESS STAND (board rebuild, 2026-10). Desktop: every witness
            side by side, statement in a speech bubble over a letter avatar,
            then a TRUE / LYING toggle and Accuse. Phone (<=640px): a row of
            avatar buttons, the chosen witness large, all testimony below. Both
            render; CSS shows one. The marks are the existing scratch verdicts. */}
        {!preStart && (() => {
          const markOf = (i) => (hideSol ? (g.pre || [])[i] || 0 : g.marks[i]);
          const tagOf = (i) => {
            if (g.accusedWrong.includes(i)) return { t: 'Cleared', c: FADED };
            const m = markOf(i);
            return m === 1 ? { t: 'True', c: INK } : m === 2 ? { t: 'Lying', c: ACC_DEEP_INK } : { t: 'Unmarked', c: FADED };
          };
          const verifiedTag = (i) => (g.verified && g.verified.x === i ? (
            <span className="sw-ver" style={{ color: g.verified.honest ? 'var(--stg-good, #15803d)' : 'var(--stg-bad, #b91c1c)', borderColor: 'currentColor' }}>
              verified {g.verified.honest ? 'truthful' : 'lying'}
            </span>
          ) : null);
          const toggle = (i, name, big) => {
            const m = markOf(i);
            return (
              <div className={`sw-seg${big ? ' big' : ''}`} role="group" aria-label={`Your scratch verdict on ${name}`}>
                <button type="button" className={`sw-segb t${m === 1 ? ' on' : ''}`} aria-pressed={m === 1} disabled={!playing} onClick={() => setMark(i, 1)}>True</button>
                <button type="button" className={`sw-segb l${m === 2 ? ' on' : ''}`} aria-pressed={m === 2} disabled={!playing} onClick={() => setMark(i, 2)}>Lying</button>
              </div>
            );
          };
          const accuseBtn = (i, big) => (playing ? (
            <button type="button" className={`sw-accuse${big ? ' big' : ''}`} onClick={() => accuse(i)} disabled={g.accusedWrong.includes(i)}>Accuse</button>
          ) : null);
          const P = Math.min(pick, N - 1);
          const pName = PUZZLE.suspects[P];
          return (
            <>
              <div className="sw-stand" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
                {PUZZLE.suspects.map((name, i) => {
                  const m = markOf(i);
                  return (
                    <div key={name} className={`sw-wit m${m}`}>
                      <div className="sw-bub"><span className="sw-q">{stmtText(PUZZLE.statements[i], i)}</span><span className="sw-tail" aria-hidden="true" /></div>
                      <span className={`sw-av m${m}`} aria-hidden="true">{name.charAt(0)}</span>
                      <span className="sw-name">{name}</span>
                      {verifiedTag(i)}
                      {g.accusedWrong.includes(i) && <span className="sw-ver" style={{ color: FADED, borderColor: 'var(--stg-line2, rgba(28,30,36,0.25))' }}>cleared</span>}
                      {toggle(i, name, false)}
                      {accuseBtn(i, false)}
                    </div>
                  );
                })}
              </div>

              <div className="sw-ph">
                <div className="sw-avrow">
                  {PUZZLE.suspects.map((name, i) => {
                    const m = markOf(i);
                    const tg = tagOf(i);
                    return (
                      <button key={name} type="button" className={`sw-avb${i === P ? ' sel' : ''}`} onClick={() => setPick(i)} aria-pressed={i === P} aria-label={`${name}, ${tg.t}`}>
                        <span className={`sw-av sm m${m}`}>{name.charAt(0)}</span>
                        <span className="sw-avn">{name}</span>
                        <span className="sw-avt" style={{ color: tg.c }}>{tg.t}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="sw-focus">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: INK }}>{pName}</span>
                    <span className="sw-meterk">Swore</span>
                    {verifiedTag(P)}
                  </div>
                  <span className={`sw-fq m${markOf(P)}`}>{stmtText(PUZZLE.statements[P], P)}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {toggle(P, pName, true)}
                    {accuseBtn(P, true)}
                  </div>
                </div>
                <div className="sw-meterk" style={{ margin: '18px 0 4px' }}>All testimony</div>
                {PUZZLE.suspects.map((name, i) => (
                  <button key={name} type="button" className={`sw-trow${i === P ? ' sel' : ''}`} onClick={() => setPick(i)}>
                    <span className={`sw-av xs m${markOf(i)}`} aria-hidden="true">{name.charAt(0)}</span>
                    <span className="sw-tq" style={{ color: markOf(i) === 2 ? FADED : INK }}><b className="sw-tn">{name}:</b> {stmtText(PUZZLE.statements[i], i)}</span>
                  </button>
                ))}
              </div>
            </>
          );
        })()}

        {verdict && (
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: `var(--stg-ink, ${COLORS.rust})`, margin: '12px 0 10px', lineHeight: 1.45 }}>
            {verdict.msg}
          </div>
        )}
        {started && (
          <div className="sw-foot">
            <span className="sw-foott">Mark who is TRUE and who is LYING as you test each theory, then accuse the thief. Marks are scratch notes; a wrong accusation costs 2 points.</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="sw-btn" onClick={clearMarks}><Eraser size={14} /> Clear marks</button>
              {hintOk && !g.hintUsed && (
                <button type="button" className="sw-btn" onClick={useHint} title="Verify one witness (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(190,24,93,0.5)', color: ACC_DEEP_INK }}>
                  <Lightbulb size={14} /> Hint: verify a witness
                </button>
              )}
              {g.wrong >= 3 && (
                <button type="button" className="sw-btn" style={{ borderColor: 'var(--stg-line2, #c3c8cf)', color: FADED }} onClick={reveal}>Reveal (ends the day)</button>
              )}
            </div>
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '8px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : g.status === 'done' ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {g.status === 'done'
                      ? (won ? <>It was <b>{thiefName}</b>, nailed on the first accusation.</> : <>It was <b>{thiefName}</b>, found after {g.wrong} wrong accusation{g.wrong === 1 ? '' : 's'}.</>)
                      : hideSol ? <>The inquest collapsed.</> : <>The inquest collapsed. It was <b>{thiefName}</b> all along.</>}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}{g.hintUsed ? ' · 1 hint' : ''}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>A new inquest is sworn in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new inquest is sworn at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/sworn?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          reopen yesterday&rsquo;s inquest &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/sworn" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s inquest &rarr;</a>
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
          {LOFT && !playing && !EMBED && (
            <LoftFinish
              name="Sworn"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${g.wrong} wrong \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Sworn all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Wrong"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/sworn?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Sworn', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/sworn?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="sworn" name="Sworn" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="sworn" name="Sworn" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="sworn"
            maxWidth={640}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="sworn" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Sworn to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s inquest, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s inquest, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!EMBED && !focusMode && !identity && (
          <div id="daily-join" style={{ margin: '18px auto 0', maxWidth: 640 }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
        </div>
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="sworn"
          won={won}
          completed={g.status === 'done'}
          headline={g.status === 'done' ? <>The thief is named</> : <>The inquest collapsed</>}
          subline={<>Sworn #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {g.wrong} wrong accusation{g.wrong === 1 ? '' : 's'} &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {/* THE JUDGED DOOR (owner, 2026-10-09): the first time a player ever
          opens Sworn on its own page, the whole Judged run is offered, once per
          case. Never inside the run itself. See app/circuits/RunDoorPop.jsx. */}
      <RunDoorPop id="judged" game="sworn" ready={hydrated && preStart && isTodays && !EMBED} self="Sworn" />

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
            <button className="sw-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      {!EMBED && <StageFold />}
      {/* About Sworn — crawlable prose for search, server-rendered */}
      <section style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Sworn</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Sworn is a free daily logic puzzle from Mind Loft, a classic liars puzzle in the Knights-and-Knaves tradition, dressed as a village inquest. Something has been stolen, a handful of locals are put under oath, and every one of them gives a single statement. The catch: an exact number of them are lying, liars&rsquo; statements are always false, and one of the sworn is the thief.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The reasoning is pure case-work: suppose a suspect is the thief, follow what each statement would make of its speaker, and check the lie count. Wrong theories collapse under their own contradictions; the truth is the one story that holds together. Every case is generated with a constraint solver and machine-verified to have exactly one consistent world, and to be crackable by clean deduction, never guesswork.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new inquest is sworn every day at midnight Eastern, with six suspects at Sunday&rsquo;s Grand Inquest. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/alibi" style={{ color: INK, fontWeight: 800 }}>Alibi</a>, our nightly whodunit, <a href="/jesters" style={{ color: INK, fontWeight: 800 }}>Jesters</a>, our court-placement puzzle, and <a href="/cipher" style={{ color: INK, fontWeight: 800 }}>Cipher</a>, our daily cryptarithm.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const solvedBit = g.status === 'done'
      ? `⚖️ Named the thief in ${elapsed} · ${g.wrong} wrong accusation${g.wrong === 1 ? '' : 's'}${hintBit}`
      : g.status === 'lost' ? '⚖️ The inquest collapsed' : '⚖️ Still weighing the testimony…';
    const text = playing
      ? `Sworn #${PUZZLE.num} — the daily liars puzzle from Mind Loft.\n${withRef(`mindloftdaily.com/sworn${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Sworn — Inquest #${PUZZLE.num}\n${solvedBit}${streakBit}\n${withRef(`mindloftdaily.com/sworn${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
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
}
