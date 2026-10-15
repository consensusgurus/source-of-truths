'use client';

// Scram — the daily themed word scramble.
//
// One broad theme a day (Cities, Food, Men's Names...) and ten scrambled
// answers from it. Type each one back on the LIT KEYBOARD: only the letters in
// the current scramble are live, and a small count shows a letter you still
// need more than once. A full answer checks itself the moment the last letter
// lands. Move between the ten freely with Back / Next or the numbered pips;
// Skip jumps to the next one still open. The race is the clock: score is
// answers solved out of ten, and time breaks ties (owner, 2026-10-14).
//
// Built off GarbleClient's frame (chrome, start gate, saves, result posting,
// end card), with the board from the "Scram Input Options" canvas, option B.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Eye, Smartphone, ChevronLeft, ChevronRight, Delete } from 'lucide-react';
import Grain from '../Grain';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import useRailClearance from '../useRailClearance';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = { cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted, good: T.successDeep || '#047857' };
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const N = 10;

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const HELP_KEY = 'sot_scram_help_seen';
const STATS_KEY = 'sot_scram_stats';

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
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const pz = m && byQuiz[m.quizId];
    if (!pz || m.attempt !== 1 || rec[pz.num]) continue;
    const sc = Math.max(0, Math.min(N, Math.round(((m.scorePct || 0) / 100) * N)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[pz.num] = { s: sc, t: N, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

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
const lettersOf = (a) => a.replace(/ /g, '');
function countOf(str, ch) { let n = 0; for (let i = 0; i < str.length; i++) if (str[i] === ch) n++; return n; }
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

function freshState() {
  return { v: 1, typed: {}, solved: {}, misses: 0, status: 'playing', t0: null, tEnd: null };
}
// The next open answer AFTER `from`, wrapping round; -1 when all are solved.
function nextOpen(solved, from) {
  for (let k = 1; k <= N; k++) { const i = (((from + k) % N) + N) % N; if (!solved[i]) return i; }
  return -1;
}

export default function ScramClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_scram_${PUZZLE.num}`;
  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
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

  // fx: the answer that just landed (flips green) and the one that just missed
  // (shakes, re-keyed on the miss count so a second miss shakes again).
  const [fx, setFx] = useState({ good: null, goodAt: 0, bad: null, badAt: 0, n: 0 });
  const [busy, setBusy] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1) {
          const merged = { ...freshState(), ...saved };
          setG(merged);
          const open = nextOpen(merged.solved || {}, -1);
          setSel(open < 0 ? 0 : open);
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
        const dn = g.status !== 'playing';
        if (dn || g.t0) localStorage.setItem('sot_scram_day', JSON.stringify({ d: etToday(), done: dn }));
        else localStorage.removeItem('sot_scram_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
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
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  const [showChrome, setShowChrome] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  const playing = g.status === 'playing';
  const searchParams = useSearchParams();
  const LOFT = isLoft('scram');
  const STAGE = isStage('scram', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('scram');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('scram'), '--stg-acc-lt': gameColorLight('scram'), '--stg-onramp-lt': gameOnrampLight('scram'), '--stg-acc-ink-lt': gameAccentInkLight('scram') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const CELL = STAGE ? 'var(--stg-cell)' : T.white;
  const CELL_LINE = STAGE ? 'var(--stg-cell-line)' : 'rgba(20,22,28,0.44)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.ember;
  const CUR_BG = STAGE ? 'color-mix(in srgb, var(--stg-acc) 14%, var(--stg-cell))' : '#eef4ff';
  const DONE_BG = STAGE ? 'var(--stg-ink)' : COLORS.ink;
  const DONE_FG = STAGE ? 'var(--stg-ground)' : T.white;
  const GOOD = STAGE ? 'var(--stg-good)' : COLORS.good;
  const BAD = STAGE ? 'var(--stg-bad)' : COLORS.rust;
  const KEY_BG = STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : T.white;
  const KEY_LINE = STAGE ? '1.5px solid var(--stg-line2,rgba(255,255,255,0.17))' : '1.5px solid rgba(20,22,28,0.15)';
  const MINI_BG = STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : COLORS.paper;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const rail = useRailClearance(started && mobileUi, 200);
  const focusMode = playing && !showChrome;
  const solvedCount = Object.keys(g.solved).length;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  const word = PUZZLE.words[sel] || PUZZLE.words[0];
  const answer = lettersOf(word.a);
  const curSolved = !!g.solved[sel];
  const typed = curSolved ? answer : (g.typed[sel] || '');

  const REC_KEY = `sot_scram_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts once the player acts: an answer solved or a miss.
    const acted = Object.keys(g.solved).length > 0 || g.misses > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    const n = Object.keys(g.solved).length;
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: n, total: N, correct: n, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const n = Object.keys(g2.solved).length;
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Race the clock: the score is answers solved, and the board breaks a
        // tie on time alone, so nothing is posted as a miss (registry miss: null).
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: n, total: N, correct: n, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function finish(g1) {
    const n = Object.keys(g1.solved).length;
    const g2 = { ...g1, status: n === N ? 'won' : 'done', tEnd: Date.now() };
    try { setStats(recordStat(PUZZLE.num, { s: n, t: N, won: n === N })); } catch (e) {}
    postResult(g2);
    setG(g2);
  }

  function go(i) {
    if (!playing) { setSel(((i % N) + N) % N); return; }
    if (busy) return;
    setSel(((i % N) + N) % N);
  }
  function skip() {
    const nx = nextOpen(g.solved, sel);
    if (nx >= 0 && nx !== sel) go(nx);
  }

  function typeLetter(ch) {
    if (!playing || busy || g.solved[sel]) return;
    const cur = g.typed[sel] || '';
    if (cur.length >= answer.length) return;
    if (countOf(answer, ch) - countOf(cur, ch) <= 0) return; // only the scramble's letters are live
    const t = cur + ch;
    const g2 = { ...g, typed: { ...g.typed, [sel]: t } };
    if (!g2.t0) g2.t0 = Date.now();
    if (t.length < answer.length) { setG(g2); return; }
    if (t === answer) {
      g2.solved = { ...g.solved, [sel]: true };
      const typedNext = { ...g2.typed }; delete typedNext[sel];
      g2.typed = typedNext;
      setFx((f) => ({ ...f, good: sel, goodAt: Date.now() }));
      const n = Object.keys(g2.solved).length;
      if (n === N) { finish(g2); return; }
      setG(g2);
      setBusy(true);
      const from = sel;
      setTimeout(() => { setBusy(false); const nx = nextOpen(g2.solved, from); if (nx >= 0) setSel(nx); }, 520);
    } else {
      // Every letter was legal, so a full wrong answer is a wrong ORDER: shake,
      // count it for the player's own stats, and clear the row to try again.
      g2.misses = g.misses + 1;
      setG(g2);
      setFx((f) => ({ ...f, bad: sel, badAt: Date.now(), n: f.n + 1 }));
      setBusy(true);
      const at = sel;
      setTimeout(() => {
        setBusy(false);
        setG((cur2) => ({ ...cur2, typed: { ...cur2.typed, [at]: '' } }));
      }, 480);
    }
  }
  function backspace() {
    if (!playing || busy || g.solved[sel]) return;
    const cur = g.typed[sel] || '';
    if (!cur) return;
    setG({ ...g, typed: { ...g.typed, [sel]: cur.slice(0, -1) } });
  }

  const onKey = useCallback((k) => {
    if (k === 'BACK') backspace();
    else if (k === 'LEFT') go(sel - 1);
    else if (k === 'RIGHT') go(sel + 1);
    else if (/^[A-Z]$/.test(k)) typeLetter(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, g, busy, answer]);

  useEffect(() => {
    function onDown(e) {
      if (showHelp || !started) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Backspace') { e.preventDefault(); onKey('BACK'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onKey('LEFT'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onKey('RIGHT'); }
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    }
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [onKey, showHelp, started]);

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setSel(0); setEndClosed(false); setRevealed(false);
    setFx({ good: null, goodAt: 0, bad: null, badAt: 0, n: 0 }); setBusy(false);
  }

  function shareText() {
    const row = PUZZLE.words.map((_, i) => (g.solved[i] ? '\u{1F7E9}' : '⬛')).join('');
    return `Scram #${PUZZLE.num} · ${PUZZLE.theme} · ${solvedCount}/${N} · ${elapsed}\n${row}\n${withRef('mindloftdaily.com/scram')}`;
  }
  function copyShare() {
    const text = playing
      ? `Scram #${PUZZLE.num}: ten scrambled answers from one theme, against the clock. How fast can you unscramble them?\n${withRef('mindloftdaily.com/scram')}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch (e) {}
  }

  const ended = !playing;
  const won = g.status === 'won';
  // On a finish short of ten, the unsolved answers stay hidden on the loft
  // until the end card's Reveal answers tile is pressed.
  const ansOpen = ended && (won || !LOFT || revealed);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'scram', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'scram', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'scram', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'scram', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'scram', active: LOFT && !playing });
  const score = solvedCount;

  // ---- the board ----------------------------------------------------------
  const L = answer.length;
  const groups = word.a.split(' ');
  // Cells shrink on a narrow screen so a twelve-letter Sunday answer fits a phone.
  const cellW = `min(52px, calc((100vw - 72px) / ${L + groups.length - 1}))`;
  const miniW = `min(34px, calc((100vw - 72px) / ${L + 1}))`;
  const showAns = curSolved || (ended && ansOpen);
  const flipping = fx.good === sel && Date.now() - fx.goodAt < 900;
  const shaking = fx.bad === sel && Date.now() - fx.badAt < 600;
  const usedIdx = useMemo(() => {
    // which scramble tiles the typed letters have used up, first match first
    const used = new Set();
    for (const ch of typed) { for (let i = 0; i < word.s.length; i++) if (!used.has(i) && word.s[i] === ch) { used.add(i); break; } }
    return used;
  }, [typed, word.s]);

  let k = 0;
  const slotGroups = groups.map((grp, gi) => (
    <div key={gi} style={{ display: 'flex', gap: 5 }}>
      {grp.split('').map(() => {
        const idx = k++;
        let letter = typed[idx] || '';
        let bg = CELL, fg = INK, border = `1.5px solid ${CELL_LINE}`;
        if (showAns) {
          letter = answer[idx];
          if (curSolved) { bg = flipping ? GOOD : DONE_BG; fg = DONE_FG; border = `1.5px solid ${flipping ? GOOD : DONE_BG}`; }
          else { fg = BAD; border = `1.5px dashed ${BAD}`; }
        } else if (playing && idx === typed.length) { bg = CUR_BG; border = `2px solid ${ACC_INK}`; }
        return (
          <span key={idx} className={'sc-slot' + (flipping ? ' sc-flipc' : '')}
            style={{ '--j': idx, width: cellW, aspectRatio: '1 / 1.15', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: bg, color: fg, border, fontFamily: SANS, fontWeight: 800, fontSize: `min(24px, calc(${cellW} * 0.55))`, userSelect: 'none' }}>{letter}</span>
        );
      })}
    </div>
  ));

  const left = {};
  if (playing && !curSolved) for (const ch of answer) left[ch] = (left[ch] || 0) + 1;
  for (const ch of (playing && !curSolved ? typed : '')) left[ch] -= 1;
  const keyboardRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, ri) => (
    <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: 5, justifyContent: 'center' }}>
      {row.split('').map((ch) => {
        const n = left[ch] || 0;
        const live = n > 0;
        return (
          <button key={ch} className="sc-key" onClick={() => onKey(ch)} disabled={!live} aria-label={live ? `${ch}${n > 1 ? `, ${n} left` : ''}` : `${ch}, not in this word`}
            style={{ position: 'relative', flex: '1 0 0', height: 46, background: live ? KEY_BG : 'transparent', color: live ? INK : FADED, opacity: live ? 1 : 0.16, fontSize: 15, border: live ? KEY_LINE : '1.5px solid transparent', cursor: live ? 'pointer' : 'default' }}>
            {ch}
            {n > 1 && <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 9.5, fontWeight: 800, color: ACC_INK }}>{n}</span>}
          </button>
        );
      })}
      {ri === 2 && (
        <button className="sc-key" onClick={() => onKey('BACK')} aria-label="Delete" style={{ flex: '1.6 0 0', height: 46, background: STAGE ? 'var(--stg-b3,rgba(255,255,255,0.145))' : COLORS.paper, color: INK, border: KEY_LINE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Delete size={18} />
        </button>
      )}
    </div>
  ));

  const pip = (i) => {
    const done = !!g.solved[i];
    const cur = i === sel;
    return (
      <button key={i} onClick={() => go(i)} aria-label={`Answer ${i + 1}${done ? ', solved' : ''}`} aria-current={cur ? 'true' : undefined}
        style={{ width: 'min(34px, 8.6vw)', height: 'min(34px, 8.6vw)', borderRadius: 8, padding: 0, cursor: 'pointer', fontFamily: SANS, fontWeight: 800, fontSize: 12.5,
          background: done ? DONE_BG : CELL, color: done ? DONE_FG : (cur ? ACC_INK : FADED),
          border: cur ? `2px solid ${ACC_INK}` : `1.5px solid ${done ? DONE_BG : (STAGE ? 'var(--stg-line2)' : 'rgba(20,22,28,0.24)')}`,
          boxShadow: cur && done ? `0 0 0 2px ${STAGE ? 'var(--stg-ground)' : COLORS.cream}, 0 0 0 4px ${ACC_INK}` : 'none' }}>{i + 1}</button>
    );
  };
  const navBtn = (dir) => (
    <button className="sc-nav" onClick={() => go(sel + dir)} aria-label={dir < 0 ? 'Previous answer' : 'Next answer'}
      style={{ height: 42, minWidth: 44, padding: mobileUi ? 0 : '0 14px', borderRadius: 8, border: KEY_LINE, background: KEY_BG, color: INK, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: SANS, fontWeight: 800, fontSize: 13 }}>
      {dir < 0 && <ChevronLeft size={18} />}
      {!mobileUi && (dir < 0 ? 'Back' : 'Next')}
      {dir > 0 && <ChevronRight size={18} />}
    </button>
  );

  const rulesBody = (
    <DailyRules
      lead="Ten scrambled answers from one theme. Unscramble all ten against the clock."
      steps={[
        <>One broad <b>theme</b> a day, printed above the board once you start. All ten answers belong to it.</>,
        <>Type the answer with the keyboard. Only the <b>scramble&rsquo;s letters</b> light up, and a small number shows a letter you need more than once.</>,
        <>A full answer <b>checks itself</b>. Right turns it dark; wrong shakes and clears so you can try another order.</>,
        <>Stuck? <b>Back</b> and <b>Next</b> (or the numbered squares) move between the ten, and <b>Skip</b> jumps to the next one still open.</>,
      ]}
      knack="Start with the shortest scrambles. The long ones often fall once you spot a familiar ending."
      footer="Score is answers solved out of ten. Time breaks ties, so the fastest perfect run tops the board."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="scram" name="Scram" collapsed={started} loft={LOFT} />}
      {LOFT && (
        <Cap gameKey="scram" quizId={PUZZLE.quizId}
          name="Scram"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: solvedCount, k: 'solved' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${N}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="sc-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .sc-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
            .sc-key{font-family:${SANS};font-weight:800;border-radius:6px;padding:0;touch-action:manipulation;}
            .sc-key:not(:disabled):active,.sc-nav:active{transform:scale(0.94);}
            @keyframes scflip{0%{transform:rotateX(0);}50%{transform:rotateX(90deg);}100%{transform:rotateX(0);}}
            .sc-flipc{animation:scflip .3s cubic-bezier(.2,.7,.3,1) both;animation-delay:calc(var(--j,0) * 45ms);backface-visibility:hidden;}
            @keyframes screj{0%,100%{transform:none;}20%{transform:translateX(-8px);}50%{transform:translateX(7px);}80%{transform:translateX(-3px);}}
            .sc-rej{animation:screj .4s cubic-bezier(.2,.7,.3,1);}
            @keyframes scin{from{opacity:0;transform:translateY(6px);}}
            .sc-word{animation:scin .22s cubic-bezier(.2,.7,.3,1);}
            @media (prefers-reduced-motion:reduce){.sc-flipc,.sc-rej,.sc-word{animation:none !important;}}
            @media(max-width:560px){.sc-wrap{padding-left:14px !important;padding-right:14px !important;}}
          ` }} />

          {!LOFT && (
            <DailyMasthead
              slug="scram"
              num={PUZZLE.num}
              dateLabel={PUZZLE.dateLabel}
              accent={COLORS.ember}
              blockGap={5}
              helpTop={13}
              marginBottom={16}
              onHelp={() => setShowHelp(true)}
              sunday={PUZZLE.sunday && <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: T.white, background: COLORS.ember, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
              blocks={'SCRAM'.split('').map((ch, i) => (
                <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 25, background: COLORS.ink, color: T.white, transform: `rotate(${[-4, 3, -2, 4, -3][i]}deg)` }}>{ch}</div>
              ))}
            />
          )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Scram is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>Ten scrambled answers from one theme, against the clock. The theme stays hidden until you start.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="sc-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!preStart && (
            <div className="sc-board" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 800, color: FADED }}>Today&rsquo;s theme</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: ACC_INK, letterSpacing: '-0.01em' }}>{PUZZLE.theme}</span>
              </div>

              <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                {PUZZLE.words.map((_, i) => pip(i))}
              </div>

              <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                {navBtn(-1)}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>Answer {sel + 1} of {N}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED }}>
                    {curSolved ? 'Solved' : `${L} letters${groups.length > 1 ? `, ${groups.length} words` : ''}`}
                  </div>
                </div>
                {navBtn(1)}
              </div>

              {/* The input panel: scramble, answer squares and Skip in one framed
                  card, so the thing you are typing into reads as the subject of the
                  page and the pips, nav and keyboard around it read as furniture. */}
              <div key={'w' + sel} className="sc-word sc-panel" style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '22px 16px 16px', borderRadius: 14, background: SURF, border: STAGE ? '1.5px solid var(--stg-line2,rgba(255,255,255,0.17))' : '1.5px solid rgba(20,22,28,0.14)', borderTop: `3px solid ${STAGE_C}`, boxShadow: STAGE ? 'none' : '0 6px 18px rgba(20,22,28,0.06)' }}>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }} aria-label={`Scrambled: ${word.s}`}>
                  {word.s.split('').map((ch, i) => (
                    <span key={i} style={{ width: miniW, height: miniW, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: MINI_BG, color: FADED, fontWeight: 800, fontSize: `min(17px, calc(${miniW} * 0.52))`, opacity: usedIdx.has(i) && !showAns ? 0.28 : 1, transition: 'opacity .15s', userSelect: 'none' }}>{ch}</span>
                  ))}
                </div>
                <div key={shaking ? 'm' + fx.n : 'a'} className={shaking ? 'sc-rej' : undefined} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {slotGroups}
                </div>
                {playing && (
                  <button onClick={skip} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: FADED, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    Skip to the next open answer
                  </button>
                )}
              </div>

              {started && !mobileUi && (
                <div style={{ alignSelf: 'stretch', maxWidth: 500, margin: '0 auto', width: '100%' }}>
                  {keyboardRows}
                  <p style={{ fontSize: 11.5, color: FADED, fontWeight: 600, margin: '6px 0 0', textAlign: 'center' }}>
                    Type on your keyboard too. The arrow keys move between answers.
                  </p>
                </div>
              )}

              {started && identity && (solvedCount > 0 || g.misses > 0) && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); finish(g); } else { setArmReveal(Date.now()); } }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? BAD : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again to stop the clock and reveal the answers' : 'Give up and reveal'}
                </button>
              )}

              {ended && !isTodays && (
                <p style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: 0 }}>
                  You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}
                  <a href="/scram" style={{ color: INK, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Scram &rarr;</a>
                </p>
              )}
            </div>
          )}
        </div>

          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Scram"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'All ten unscrambled' : (score > 0 ? `${score} of ${N} unscrambled` : 'Not solved')}
              detail={`${score}/${N} · ${PUZZLE.theme} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Scram all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/scram?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answers',
                  sub: won ? 'Your finished board' : 'Step through what you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Scram', sub: `No. ${prevPuzzle.num}, ${prevPuzzle.theme}`, href: `/scram?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>
        {!STAGE && <GamePanel self="scram" name="Scram" onShow={() => setShowChrome(true)} />}
        {LOFT && (
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="scram" name="Scram" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
        )}
        {!focusMode && !LOFT && (<DailyGamesGrid replay={ended ? resetGame : null}
          self="scram"
          maxWidth={640}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          boardSlot={<DailyBoardPanel self="scram" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
          divider
        />)}
        {ended && !focusMode && mobileUi && !standalone && (
          <div style={{ maxWidth: 640, margin: '16px auto 0' }}>
            <button onClick={a2hsClick} style={{ width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: '#21b45e', color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          </div>
        )}
        <div id="stf-stats-slot" />
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Scram to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The Scram tile opens today&apos;s puzzle, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The Scram tile opens today&apos;s puzzle, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ maxWidth: 640, margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); }} />
          </div>
        )}
        {rail.height > 0 && <div aria-hidden style={{ height: rail.height }} />}
      </div>

      {/* Mobile: the lit keyboard pinned to the bottom of the viewport, on an
          OPAQUE ground (--stg-raise), as Garble's is, so it never reads as glass
          over the board scrolling beneath it. */}
      {started && mobileUi && (
        <div ref={rail.ref} style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderTop: STAGE ? '1.5px solid var(--stg-line2,rgba(255,255,255,0.17))' : '1.5px solid rgba(20,22,28,0.12)', boxShadow: '0 -4px 16px rgba(20,22,28,0.10)', padding: '8px 6px calc(8px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>{keyboardRows}</div>
        </div>
      )}

      {ended && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="scram"
          won={won}
          headline={<>{score} of {N} unscrambled</>}
          subline={<>{PUZZLE.theme} &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

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
            <button className="sc-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Scram</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Scram is a free daily themed word scramble from Mind Loft. Every day brings one broad theme, such as cities, countries, food, animals, jobs or first names, and ten scrambled answers from it to unscramble as fast as you can.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Type each answer on the lit keyboard, where only the scramble&rsquo;s own letters are live. A full answer checks itself, and you can move between the ten in any order. Score is answers solved out of ten, and time breaks ties on the daily leaderboard.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Answers run longer through the week, and the Sunday Edition deals the longest of all, up to twelve letters and often two words. No app, no signup, play free in your browser. Want a scramble with a twist? Try <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, where five scrambles feed a clued finale.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
