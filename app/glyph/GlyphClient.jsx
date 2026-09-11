'use client';

// Glyph — the daily codeword.
//
// Each day: a filled crossword grid with every letter replaced by a number 1-26,
// consistent across the whole board. No clues. Two or three letters are given,
// and the rest is deduction: letter frequency, word shapes, the crossings, and
// the fact that all 26 letters appear exactly once in the key.
//
// Assigning a letter to a number fills EVERY cell carrying that number at once,
// which is what makes the puzzle propagate. There is no per-move error nag: you
// work in ink, and three Checks are available if you want the board audited.
// Score is 10 minus 3 per Check used, floor 1, so a solve with no checks is a
// perfect 10 and ties break on fewest checks then fastest time.
//
// Same daily plumbing as Etch/Suds/Tally: banked boards gated by Eastern date on
// the server (app/glyph/page.js), per-puzzle localStorage saves, /glyph?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.
// Weekdays are 15x15; Sundays step up to a 17x17 Edition.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HelpCircle, RotateCcw, X, Eraser, Smartphone, SearchCheck } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { useSearchParams } from 'next/navigation';
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
  accent: '#334155',        // Glyph identity — slate
  accentSoft: T.surfaceAlt,
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_glyph_help_seen';
const STATS_KEY = 'sot_glyph_stats';
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_CHECKS = 3;

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

// ─── Personal stats + streak (localStorage), Etch/Suds pattern ──────────────
function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s && s.v === 1 && s.rec) return s;
  } catch (e) {}
  return { v: 1, rec: {} };
}
function recordStat(num, entry) {
  const s = getStats();
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function mergeServerStats(cur, recent, puzzles) {
  const byId = new Map(puzzles.map((p) => [p.quizId, p.num]));
  const s2 = { ...cur, rec: { ...cur.rec } };
  for (const r of recent || []) {
    const num = byId.get(r.quizId);
    if (!num || s2.rec[num]) continue;
    s2.rec[num] = { s: r.score, t: r.total || 10, g: r.guessesUsed || 0, won: (r.score || 0) > 0 };
  }
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(stats, latestNum) {
  const rec = (stats && stats.rec) || {};
  const nums = Object.keys(rec).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const wins = nums.filter((n) => rec[n] && rec[n].won).length;
  let cur = 0;
  for (let n = latestNum; n >= 1; n--) {
    if (rec[n] && rec[n].won) cur++;
    else if (n !== latestNum) break;
    else if (!rec[n]) continue;
    else break;
  }
  let max = 0, run = 0;
  for (let n = 1; n <= latestNum; n++) {
    if (rec[n] && rec[n].won) { run++; max = Math.max(max, run); } else run = 0;
  }
  return { played, wins, cur, max };
}

function freshState(given) {
  const assign = {};
  for (const k of Object.keys(given)) assign[k] = given[k];
  return { v: 1, assign, checks: 0, wrong: [], t0: null, tEnd: null, status: 'playing' };
}

export default function GlyphClient({ puzzles, forceNum }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const W = PUZZLE.w, H = PUZZLE.h;
  const KEY = PUZZLE.key;

  // number at each cell, 0 = block
  const CELLS = useMemo(() => {
    const out = [];
    for (let r = 0; r < H; r++) {
      const row = PUZZLE.rows[r];
      for (let c = 0; c < W; c++) {
        const ch = row[c];
        out.push(ch === '.' ? 0 : ch.charCodeAt(0) - 96);
      }
    }
    return out;
  }, [PUZZLE, W, H]);

  const GIVEN = useMemo(() => {
    const g = {};
    for (const n of PUZZLE.given) g[n] = KEY[n - 1];
    return g;
  }, [PUZZLE, KEY]);

  // numbers actually present on the board (all 26, but be defensive)
  const PRESENT = useMemo(() => {
    const s = new Set(CELLS.filter((v) => v > 0));
    return ALPHA.map((_, i) => i + 1).filter((n) => s.has(n));
  }, [CELLS]);

  const countOf = useMemo(() => {
    const m = {};
    for (const v of CELLS) if (v) m[v] = (m[v] || 0) + 1;
    return m;
  }, [CELLS]);

  const STORE_KEY = `sot_glyph_${PUZZLE.num}`;
  const [g, setG] = useState(() => freshState(GIVEN));
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(true);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState({ v: 1, rec: {} });
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [loftRevealed, setLoftRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [justWon, setJustWon] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const { token: duelToken, info: duelInfo, submitted: duelSubmitted } = useDuelContext(PUZZLE.quizId);

  const assign = g.assign;
  const checks = g.checks;
  const playing = g.status === 'playing';
  const searchParams = useSearchParams();
  const LOFT = isLoft('glyph');
  const STAGE = isStage('glyph', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('glyph');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('glyph'), '--stg-acc-lt': gameColorLight('glyph'), '--stg-onramp-lt': gameOnrampLight('glyph'), '--stg-acc-ink-lt': gameAccentInkLight('glyph') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const iq = useIqStanding({ game: 'glyph', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'glyph', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'glyph', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'glyph', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'glyph', active: LOFT && !playing });
  const won = g.status === 'won';
  const preStart = playing && !g.t0;
  // Focus mode: while the puzzle is live the leaderboard / share / other-games
  // block is folded away behind one button, the same arrangement every other
  // daily uses (owner rule, 2026-08-08). setShowChrome unfolds it for good.
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;

  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch (e) {}
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
        if (saved && saved.v === 1 && saved.assign) {
          const next = { ...freshState(GIVEN), ...saved, assign: { ...GIVEN, ...saved.assign } };
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
        if (done || g.t0) localStorage.setItem('sot_glyph_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_glyph_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock (display only; the recorded elapsed uses a real Date.now
  // delta at the moment the game ends).
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

  // ---- metrics + leaderboard (shared /api/quiz/* flow) ----
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
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const placed = PRESENT.filter((n) => assign[n]).length;
  const usedLetters = useMemo(() => {
    const m = {};
    for (const n of Object.keys(assign)) if (assign[n]) m[assign[n]] = Number(n);
    return m;
  }, [assign]);
  const finalScore = Math.max(1, 10 - 3 * checks);

  const REC_KEY = `sot_glyph_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = Object.keys(cur.assign).length > PUZZLE.given.length || cur.checks > 0;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.checks, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.checks, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.checks, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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
    const first = PRESENT.find((n) => !cur.assign[n]);
    if (first) setSel(first);
  }

  const wrongSet = useMemo(() => new Set(g.wrong || []), [g.wrong]);

  function nextOpen(from) {
    const idx = PRESENT.indexOf(from);
    for (let k = 1; k <= PRESENT.length; k++) {
      const n = PRESENT[(idx + k) % PRESENT.length];
      if (!gRef.current.assign[n]) return n;
    }
    return null;
  }

  const setLetter = useCallback((L) => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !sel) return;
    if (GIVEN[sel]) { say('That one was given to you.'); return; }
    const owner = Object.keys(cur.assign).find((n) => cur.assign[n] === L && Number(n) !== sel);
    if (owner) { say(`${L} is already on number ${owner}.`); return; }
    const nextAssign = { ...cur.assign, [sel]: L };
    const g2 = { ...cur, assign: nextAssign, wrong: (cur.wrong || []).filter((n) => n !== sel) };
    if (!g2.t0) g2.t0 = Date.now();
    // A full board is checked for free — it is the natural submit, and leaving a
    // finished-but-wrong grid with no feedback would just strand the player.
    if (PRESENT.every((n) => nextAssign[n])) {
      const bad = PRESENT.filter((n) => nextAssign[n] !== KEY[n - 1]);
      if (!bad.length) {
        g2.status = 'won';
        g2.tEnd = Date.now();
        postResult(g2, Math.max(1, 10 - 3 * g2.checks));
        commit(g2);
        setSel(null);
        setJustWon(true);
        return;
      }
      g2.wrong = bad;
      say(`${bad.length} letter${bad.length === 1 ? ' is' : 's are'} wrong.`);
      commit(g2);
      setSel(bad[0]);
      return;
    }
    commit(g2);
    const nx = nextOpen(sel);
    if (nx) setSel(nx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, GIVEN, PRESENT, KEY]);

  const clearLetter = useCallback(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !sel || GIVEN[sel]) return;
    if (!cur.assign[sel]) return;
    const nextAssign = { ...cur.assign };
    delete nextAssign[sel];
    commit({ ...cur, assign: nextAssign, wrong: (cur.wrong || []).filter((n) => n !== sel) });
  }, [sel, GIVEN]);

  function runCheck() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.checks >= MAX_CHECKS) return;
    const bad = PRESENT.filter((n) => cur.assign[n] && cur.assign[n] !== KEY[n - 1]);
    const g2 = { ...cur, checks: cur.checks + 1, wrong: bad };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    say(bad.length ? `${bad.length} wrong so far.` : 'Everything placed is right.');
  }

  function resetGame() {
    const fresh = freshState(GIVEN);
    commit(fresh);
    setSel(null);
    setEndClosed(false);
    setJustWon(false);
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  }

  // physical keyboard
  useEffect(() => {
    function onKey(e) {
      if (!playing || !g.t0) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); setLetter(k.toUpperCase()); return; }
      if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); clearLetter(); return; }
      if (k === 'Tab' || k === 'ArrowRight') { e.preventDefault(); const nx = nextOpen(sel || PRESENT[0]); if (nx) setSel(nx); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, g.t0, sel, setLetter, clearLetter]);

  function shareUrl() { return 'https://mindloftdaily.com/glyph'; }
  function shareText() {
    const bits = won
      ? `${finalScore}/10 · ${checks === 0 ? 'no checks' : `${checks} check${checks === 1 ? '' : 's'}`} · ${elapsed}`
      : 'unsolved';
    return `Glyph #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday Edition' : ''} — ${bits}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Glyph #${PUZZLE.num} — the daily codeword from Mind Loft.\n${shareUrl()}`
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

  const boardMax = W > 15 ? 620 : 560;
  const revealed = !playing;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Crack the code: every letter has been swapped for a number, and the same number always means the same letter across the whole board."
      steps={[
        <><b>Tap a square</b> to select its number, then type or tap a letter. Every square with that number fills at once.</>,
        <>There are no clues. Work from the <b>{PUZZLE.given.length} letters you are given</b>, the shapes of the words, and the crossings.</>,
        <>All 26 letters appear, each exactly once in the key, so the ones you have ruled out narrow the rest.</>,
        <>Press <b>Check</b> if you want the board audited. You have <b>{MAX_CHECKS}</b>.</>,
      ]}
      knack="The key is one letter to one number with nothing left over, so a letter you have already spent is as much information as a square you have filled."
      footer={<>Each Check costs 3 points, so a clean solve is 10 out of 10.</>}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', fontFamily: SANS, background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="glyph" name="Glyph" collapsed={playing && !!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="glyph" quizId={PUZZLE.quizId}
          name="Glyph"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: checks, k: 'checks' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: checks, k: 'checks' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, padding: '14px 16px 8px' }}>
        <style>{`
          .gl-btn{font-family:${SANS};font-weight:800;font-size:13.5px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:9px;padding:9px 15px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .gl-btn:disabled{opacity:0.4;cursor:default;}
          .gl-cell{box-sizing:border-box;display:flex;align-items:center;justify-content:center;position:relative;min-width:0;min-height:0;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;border: 1px solid var(--stg-line, rgba(28,30,36,0.16));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .gl-cell.blk{background:${COLORS.ink};border-color:var(--stg-ink, ${COLORS.ink});cursor:default;}
          .gl-cell.sel{background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 22%, var(--stg-raise))' : '#dbeafe'};box-shadow:inset 0 0 0 2px var(--stg-acc, ${COLORS.accent});}
          .gl-cell.kin{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent);}
          .gl-cell.bad{background:${STAGE ? 'var(--stg-surf2)' : '#fdecea'};box-shadow:inset 0 0 0 2px ${COLORS.rust};}
          .gl-num{position:absolute;top:1.5px;left:2.5px;font-family:${MONO};font-size:9px;line-height:1;color:${STAGE ? 'var(--stg-mute)' : '#2f3644'};font-weight:700;}
          .gl-ltr{position:absolute;left:0;right:0;bottom:0;top:38%;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-weight:800;color:${INK};line-height:1;}
          /* The givens, and ONLY the givens. This rule used to be dead: the
             class was put on every letter and the colour was then overridden
             inline on every letter, so the given teal was a literal in the
             markup with no dark-register value. See --stg-cell-given. */
          .gl-ltr.given{color:var(--stg-cell-given, #0f766e);}
          .gl-key{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:3px;}
          .gl-keycap{border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.28));border-radius:6px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};padding:3px 0 2px;text-align:center;cursor:pointer;font-family:${SANS};font-weight:800;font-size:14px;color:${INK};}
          .gl-keycap.used{background:var(--stg-surf, ${COLORS.paper});color:var(--stg-mute2, #a4abb8);text-decoration:line-through;}
          .gl-keycap:disabled{cursor:default;}
          .gl-chip{border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.22));border-radius:6px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};padding:2px 0;text-align:center;font-family:${MONO};font-size:9.5px;color:${FADED};cursor:pointer;}
          .gl-chip.on{border-color:var(--stg-acc, ${COLORS.accent});background:${STAGE ? 'color-mix(in srgb, var(--stg-acc) 22%, var(--stg-raise))' : '#dbeafe'};}
          .gl-chip b{display:block;font-family:${SANS};font-size:13px;color:${INK};}
          .gl-card{padding:13px 15px 15px;}
          .gl-chips{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:3px;}
          @media(max-width:560px){
            .gl-key{grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}
            .gl-chips{grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}
            .gl-card{padding:11px 7px 13px;}
            .gl-num{font-size:7px;top:1px;left:1.5px;}
            .gl-keycap{font-size:15px;padding:6px 0 5px;}
            .gl-chip{font-size:9px;padding:3px 0;}
            .gl-chip b{font-size:14px;}
          }
          @media(max-width:400px){.gl-num{font-size:6.5px;top:0.5px;left:1px;}}
        `}</style>

        <div style={{ maxWidth: 660, margin: '0 auto' }}>


          {!LOFT && (
          <DailyMasthead
            slug="glyph"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accent}
            blockGap={5}
            helpTop={13}
            marginBottom={16}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 17&times;17</span>}
            blocks={'GLYPH'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 4 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
          />
          )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen, so the board is the one lit object. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (loftRevealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Glyph is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>Crack the code: every number stands for a letter, the same one everywhere. {W}&times;{H} today, {PUZZLE.words} words.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="gl-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!preStart && (
            <div className={STAGE ? 'gl-card stg-board' : 'gl-card'} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
              <div style={{ display: LOFT ? 'none' : 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ whiteSpace: 'nowrap' }}>checks <b style={{ color: checks > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{checks}</b>/{MAX_CHECKS}</span>
                <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
                <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>cracked <b style={{ color: placed === PRESENT.length ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{placed}</b>/{PRESENT.length}</span>
              </div>

              <div style={{ maxWidth: boardMax, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${W}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${H}, minmax(0, 1fr))`, aspectRatio: `${W} / ${H}` }}>
                  {CELLS.map((n, i) => {
                    if (!n) return <div key={i} className="gl-cell blk" />;
                    const L = revealed ? KEY[n - 1] : assign[n];
                    const isSel = sel === n;
                    const bad = wrongSet.has(n);
                    const cls = `gl-cell${bad ? ' bad' : isSel ? ' sel' : (sel && CELLS[i] === sel ? ' kin' : '')}`;
                    return (
                      <div key={i} className={cls} onClick={() => { if (!playing) return; if (!g.t0) startGame(); setSel(n); }}>
                        <span className="gl-num">{n}</span>
                        {L ? <span className={`gl-ltr${GIVEN[n] ? ' given' : ''}`} style={{ fontSize: `min(${(52 / W).toFixed(1)}vw, ${W > 15 ? 21 : 23}px)` }}>{L}</span> : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {playing && (
                <>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', color: FADED }}>
                      {sel ? `Number ${sel} · ${countOf[sel] || 0} square${(countOf[sel] || 0) === 1 ? '' : 's'}` : 'Tap a square'}
                    </span>
                    <button className="gl-btn" onClick={clearLetter} disabled={!sel || !assign[sel] || !!GIVEN[sel]} style={{ marginLeft: 'auto', padding: '7px 12px', fontSize: 12.5 }}><Eraser size={14} /> Clear</button>
                    <button className="gl-btn" onClick={runCheck} disabled={checks >= MAX_CHECKS} style={{ padding: '7px 12px', fontSize: 12.5 }}><SearchCheck size={14} /> Check ({MAX_CHECKS - checks})</button>
                  </div>

                  <div className="gl-key" style={{ marginTop: 10 }}>
                    {ALPHA.map((L) => {
                      const owner = usedLetters[L];
                      const used = !!owner;
                      return (
                        <button key={L} className={`gl-keycap${used ? ' used' : ''}`} onClick={() => setLetter(L)} disabled={!sel}>{L}</button>
                      );
                    })}
                  </div>

                  <div className="gl-chips" style={{ marginTop: 10 }}>
                    {ALPHA.map((_, k) => {
                      const n = k + 1;
                      const on = sel === n;
                      return (
                        <button key={n} className={`gl-chip${on ? ' on' : ''}`} onClick={() => setSel(n)} title={`Number ${n}`}>
                          {n}<b>{assign[n] || '·'}</b>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {!playing && (
                <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: FADED, textAlign: 'center' }}>
                  Next Glyph in {countdown}
                </div>
              )}
            </div>
          )}


          </div>
          {LOFT && !playing && loftRevealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setLoftRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Glyph"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore} \u00b7 ${checks} checks \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Glyph all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={myStats.cur}
              missLabel="Checks"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/glyph?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setLoftRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Glyph', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/glyph?p=${prevPuzzle.num}` },
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
          {!STAGE && <GamePanel self="glyph" name="Glyph" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="glyph" name="Glyph" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="glyph"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="glyph" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider
          />
          )}
          </div>
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}

          {showA2hsHelp && (
            <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Glyph to your Home Screen</div>
                {isIosDevice() ? (
                  <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                    <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                    <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                    <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s grid, every day.</li>
                  </ol>
                ) : (
                  <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                    Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s grid, every day.
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
          self="glyph"
          won={won}
          headline={won ? <>Code cracked!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {checks === 0 ? 'no checks' : `${checks} check${checks === 1 ? '' : 's'}`} &middot; {elapsed}</>
            : <>0/10 &middot; the key is shown above</>}
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
            <button className="gl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Glyph</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Glyph is a free daily codeword from Mind Loft, the crossword with no clues at all. Every letter in the grid has been replaced by a number from 1 to 26, the same number standing for the same letter everywhere, and your job is to work out the whole alphabet from two or three given letters.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          You solve it the way you would crack a cipher, except the constraint is the grid itself. A one-letter gap between two blocks, a number that keeps landing at the end of words, a three-letter shape with a repeated outer number: each one narrows the field, and every letter you commit propagates across the entire board. All 26 letters appear in every key, so the ones you have ruled out tell you as much as the ones you have found.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every board is machine-verified to use only common dictionary words and to have exactly one consistent solution, so it is always crackable by deduction and never by guesswork. A new grid drops every day at midnight Eastern, and Sundays step up to a 17&times;17 Edition. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/cipher" style={{ color: INK, fontWeight: 800 }}>Cipher</a>, our letter-math puzzle, and <a href="/emcee" style={{ color: INK, fontWeight: 800 }}>Emcee</a>, the daily mini crossword.
        </p>
      </section>

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
