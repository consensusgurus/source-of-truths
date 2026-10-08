'use client';

// Dossier — the daily attribute guess.
//
// One hidden subject a day from that day's universe (US presidents, chemical
// elements, US states). Every guess prints five attribute cells: a FILLED
// cell matches the hidden subject, an arrow says the hidden subject's number
// is higher or lower, "no" says a category does not match. Eight guesses (six
// on the Sunday Edition). Solved on guess g scores 11 - g out of 10; out of
// guesses or a give-up scores 0. First attempt stands.
//
// Plumbing forked from app/dossier/DossierClient.jsx: banked days gated by Eastern
// date on the server (app/dossier/page.js), per-day localStorage saves,
// /dossier?p=N archive pinning, streaks, the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone, Trash2 } from 'lucide-react';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
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
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { UNIVERSES } from './universes';

// A new game gets no colour of its own: on the stage it wears the Trivia step
// of the category ramp. ACCENT is only the legacy (pre-stage) fallback.
const ACCENT = '#5b3a8c';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#efe9f7',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_dossier_help_seen';
const STATS_KEY = 'sot_dossier_stats';
const GRID_MAX = 468;

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


function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
// The type-ahead matches on WORDS: the name starts with what was typed, else
// contains it, else every word typed is the prefix of some word in the name,
// in any order (the Focus rule). Names already guessed are left out.
function matchNames(list, query, skip) {
  const qf = fold(query);
  if (!qf) return [];
  const qw = qf.split(' ');
  const a = [], b = [], c = [];
  for (const it of list) {
    if (skip.has(it.name)) continue;
    let tier = 9;
    for (const nm of it.forms) {
      if (nm.startsWith(qf)) tier = Math.min(tier, 0);
      else if (nm.includes(qf)) tier = Math.min(tier, 1);
      else { const w = nm.split(' '); if (qw.every((x) => w.some((y) => y.startsWith(x)))) tier = Math.min(tier, 2); }
    }
    if (tier === 0) a.push(it.name); else if (tier === 1) b.push(it.name); else if (tier === 2) c.push(it.name);
  }
  return [...a, ...b, ...c].slice(0, 7);
}

function freshState() {
  return { v: 1, guesses: [], hintAttrs: [], hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function DossierClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const MAX = PUZZLE.guesses || 8;
  const U = UNIVERSES[PUZZLE.universe] || UNIVERSES.presidents;
  const LIST = useMemo(() => U.rows.map((r) => ({ name: r.name, forms: [r.name, ...(r.alt || [])].map(fold) })), [U]);
  const BY_NAME = useMemo(() => new Map(U.rows.map((r) => [r.name, r])), [U]);
  const ANSWER = BY_NAME.get(PUZZLE.answer) || U.rows[0];
  const STORE_KEY = `sot_dossier_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState(PUZZLE));
  const [q, setQ] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('dossier', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('dossier'); }, [g.hintUsed]);
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
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('dossier');
  const STAGE = isStage('dossier', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('dossier');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('dossier'), '--stg-acc-lt': gameColorLight('dossier'), '--stg-onramp-lt': gameOnrampLight('dossier'), '--stg-acc-ink-lt': gameAccentInkLight('dossier') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'dossier', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'dossier', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'dossier', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'dossier', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'dossier', active: LOFT && !playing });

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
        if (saved && saved.v === 1 && Array.isArray(saved.guesses)) {
          setG({ ...freshState(PUZZLE), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_dossier_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_dossier_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

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

  // ---- metrics (the shared /api/quiz/* flow) ----
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

  const guesses = g.guesses;
  const left = MAX - guesses.length;
  const guessedSet = useMemo(() => new Set(guesses), [guesses]);
  const opts = useMemo(() => (playing ? matchNames(LIST, q, guessedSet) : []), [q, guessedSet, playing, LIST]);
  // hit = matches the hidden subject; up / down = the hidden number is higher / lower.
  function cmp(row, a) {
    if (row[a.key] === ANSWER[a.key]) return 'hit';
    if (a.type === 'num') return ANSWER[a.key] > row[a.key] ? 'up' : 'down';
    return 'no';
  }
  // What the clues add up to, per attribute.
  const known = useMemo(() => U.attrs.map((a) => {
    let exact = (g.hintAttrs || []).includes(a.key) ? ANSWER[a.key] : null;
    let lo = null, hi = null;
    for (const nm of guesses) {
      const r = BY_NAME.get(nm);
      if (!r) continue;
      const v = r[a.key];
      if (v === ANSWER[a.key]) exact = v;
      else if (a.type === 'num') { if (ANSWER[a.key] > v) { if (lo == null || v > lo) lo = v; } else if (hi == null || v < hi) hi = v; }
    }
    return { a, exact, lo, hi };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [guesses, g.hintAttrs, U, ANSWER, BY_NAME]);
  const knownChips = known.map((k) => {
    if (k.exact != null) return { key: k.a.key, label: k.a.label, text: String(k.exact), pinned: true };
    if (k.lo != null && k.hi != null) return { key: k.a.key, label: k.a.label, text: `${k.lo} to ${k.hi}, not either end` };
    if (k.lo != null) return { key: k.a.key, label: k.a.label, text: `above ${k.lo}` };
    if (k.hi != null) return { key: k.a.key, label: k.a.label, text: `below ${k.hi}` };
    return null;
  }).filter(Boolean);
  const matchedOf = (nm) => { const r = BY_NAME.get(nm); return r ? U.attrs.map((a) => r[a.key] === ANSWER[a.key]) : []; };

  const REC_KEY = `sot_dossier_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = g.guesses.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: g.guesses.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.guesses.length, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.guesses.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // One free hint, first play only: one attribute the guesses have not pinned.
  function useHint() {
    if (!hintOk || !playing || g.hintUsed) return;
    const open = known.find((k) => k.exact == null);
    if (!open) { say('Every attribute is already pinned. Only the name is left.'); return; }
    const g2 = { ...g, hintAttrs: [...(g.hintAttrs || []), open.a.key], hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    setG(g2);
    say(`Hint: ${open.a.long} is ${ANSWER[open.a.key]}.`);
  }

  function finish(g2, score) {
    g2.tEnd = Date.now();
    if (g2.status === 'won') vibrate(HAPT.win);
    postResult(g2, score);
    setG(g2);
    if (g2.status === 'won') setJustWon(true);
  }
  function pick(name) {
    if (!playing || !name || !BY_NAME.has(name)) return;
    if (guessedSet.has(name)) { say('Already guessed. It has cost you nothing.'); return; }
    const g2 = { ...g, guesses: [...guesses, name] };
    if (!g2.t0) g2.t0 = Date.now();
    setQ('');
    if (name === PUZZLE.answer) { g2.status = 'won'; finish(g2, Math.max(1, 11 - g2.guesses.length)); return; }
    if (g2.guesses.length >= MAX) { g2.status = 'lost'; finish(g2, 0); return; }
    vibrate(HAPT.ok);
    setG(g2);
  }
  function onInputKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); if (opts.length) pick(opts[0]); }
  }
  function revealEnd() {
    const g2 = { ...g, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setG(g2);
  }
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(PUZZLE)); setQ(''); setJustWon(false); setEndClosed(false);
  }

  function shareText() {
    // Five squares per guess, filled for a match. Never the subject.
    const rows = guesses.map((nm) => matchedOf(nm).map((m) => (m ? '\u{1F7EA}' : '\u2B1C')).join('')).join('\n');
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Dossier #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${U.name} · solved in ${guesses.length}/${MAX}${hintBit}${streakBit}`
      : `Dossier #${PUZZLE.num} · ${U.name} · not solved`;
    return `${head2}\n${rows}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/dossier${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Dossier #${PUZZLE.num}, the daily five-clue guessing game from Mind Loft.\n${shareUrl()}`
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
      lead="One subject from the day's list is hidden: a president, an element or a state. Guess any name on the list and its five facts are printed in five cells. A filled cell matches the hidden subject. An arrow on a number means the hidden subject's number is higher or lower than your guess's. The word no means that fact does not match."
      steps={[
        <><b>Type a name</b> and choose it from the list. A name that is not on the list, or one you already tried, costs nothing.</>,
        <>Read the row: <b>filled</b> is a match, <b>higher &uarr;</b> and <b>lower &darr;</b> point from your guess toward the hidden number, <b>no</b> rules a category out.</>,
        <>The <b>Known so far</b> line adds your clues up. You have <b>eight guesses</b>, six on the Sunday Edition.</>,
      ]}
      knack="Guess from the middle. A number near the center of its range cuts the list in half whichever way the arrow points, and two arrows on the same fact trap the answer between them."
      footer="Solving on your first guess scores 10, and each further guess takes a point off. Running out, or revealing the answer, scores 0. One free hint, on your first ever play, pins one fact the guesses have not. The list changes through the week: presidents Monday and Thursday, elements Tuesday and Friday, states Wednesday and Saturday, and the Sunday Edition gives you six guesses instead of eight."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="dossier" name="Dossier" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="dossier" quizId={PUZZLE.quizId}
          name="Dossier"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 6 guesses' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${guesses.length}/${MAX}`, k: 'guesses' },
          ]}
        />
      )}
      <div className="ds-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.ds-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .ds-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .ds-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .ds-lab{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:${FADED};margin:0 0 6px;}
          .ds-lab b{color:${INK};}
          .ds-none{font-size:13px;font-weight:600;color:${FADED};}
          .ds-inwrap{margin-top:14px;}
          .ds-in{flex:1 1 auto;min-width:0;height:46px;box-sizing:border-box;border:2px solid var(--stg-ink2, ${COLORS.ink});border-radius:8px;padding:0 12px;font-family:${SANS};font-size:16px;font-weight:700;color:${INK};background:var(--stg-cell, #ffffff);}
          .ds-in:focus{outline:3px solid var(--stg-acc, ${COLORS.accent});outline-offset:1px;}
          .ds-go{height:46px;padding:0 18px;border:none;border-radius:8px;background:${STAGE ? STAGE_C : T.cta};color:${STAGE ? 'var(--stg-onramp, #08222e)' : T.white};font-family:${SANS};font-weight:800;font-size:15px;cursor:pointer;}
          .ds-opts{display:flex;flex-direction:column;margin-top:6px;border:1px solid var(--stg-cell-line, rgba(11,15,26,0.3));border-radius:8px;overflow:hidden;}
          .ds-opt{border-radius:0 !important;border:none;border-bottom:1px solid var(--stg-line, rgba(28,30,36,0.14));background:var(--stg-cell, #ffffff);color:${INK};text-align:left;padding:11px 12px;font-family:${SANS};font-size:14.5px;font-weight:700;cursor:pointer;}
          .ds-opt:last-child{border-bottom:none;}
          .ds-opt.top{box-shadow:inset 4px 0 0 var(--stg-acc, ${COLORS.accent});}
          .ds-hint{margin-top:7px;font-size:12px;font-weight:700;color:${FADED};}
          .ds-uni{font-size:15px;font-weight:800;color:${INK};margin:0 0 10px;}
          .ds-g{margin-top:9px;}
          .ds-gn{font-size:14.5px;font-weight:800;color:${INK};margin:0 0 3px;}
          .ds-cells{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;}
          .ds-c{box-sizing:border-box;min-height:62px;padding:6px 5px;display:flex;flex-direction:column;gap:1px;background:var(--stg-cell, #ffffff);border:1px solid var(--stg-cell-line, rgba(11,15,26,0.3));border-radius:6px;color:${INK};min-width:0;}
          .ds-c.hit{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #ffffff);}
          .ds-cl{font-size:9.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;}
          .ds-cv{font-size:11px;letter-spacing:-.03em;font-weight:800;line-height:1.15;overflow-wrap:anywhere;}
          .ds-cn{font-size:10.5px;font-weight:700;margin-top:auto;}
          .ds-known{margin-top:12px;display:flex;flex-wrap:wrap;gap:5px;align-items:center;}
          .ds-k{font-size:12px;font-weight:700;color:${INK};padding:4px 8px;border:1px solid var(--stg-cell-line, rgba(11,15,26,0.3));border-radius:6px;background:var(--stg-cell, #ffffff);}
          .ds-k.pin{border:2px solid var(--stg-acc, ${COLORS.accent});}
          .ds-k b{font-weight:800;text-transform:uppercase;font-size:10px;letter-spacing:.07em;margin-right:5px;}
          .ds-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="dossier"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 6 guesses</span>}
          blocks={'DOSSIER'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Dossier is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>One subject from the day&rsquo;s list is hidden. Guess a name and its five facts print in five cells: a filled cell matches, an arrow says the hidden number is higher or lower, and no rules a category out.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="ds-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>guesses <b style={{ color: INK, fontWeight: 500 }}>{guesses.length}</b>/{MAX}</span>
          </div>
          )}

          <div style={{ maxWidth: GRID_MAX, margin: '0 auto' }}>
            <div className="ds-lab">Today&rsquo;s list</div>
            <div className="ds-uni">{U.name} <span style={{ fontWeight: 700, color: FADED, fontSize: 12.5 }}>&middot; {U.rows.length} names &middot; guesses {guesses.length}/{MAX}</span></div>
            {guesses.length === 0 && <div className="ds-none">No guesses yet. Any {U.noun} is a fair first guess.</div>}
            {[...guesses, ...(!playing && !won && (!LOFT || revealed) ? [PUZZLE.answer] : [])].map((nm, gi) => {
              const r = BY_NAME.get(nm);
              if (!r) return null;
              return (
                <div key={nm + ':' + gi} className="ds-g">
                  <div className="ds-gn">{nm}{gi >= guesses.length ? ' (the answer)' : ''}</div>
                  <div className="ds-cells">
                    {U.attrs.map((a) => {
                      const c = cmp(r, a);
                      return (
                        <div key={a.key} className={'ds-c' + (c === 'hit' ? ' hit' : '')}>
                          <span className="ds-cl">{a.label}</span>
                          <span className="ds-cv">{String(r[a.key])}</span>
                          <span className="ds-cn">{c === 'hit' ? 'match' : c === 'up' ? 'higher \u2191' : c === 'down' ? 'lower \u2193' : 'no'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {playing && knownChips.length > 0 && (
              <div className="ds-known" aria-label="Known so far">
                <span className="ds-lab" style={{ margin: 0 }}>Known so far</span>
                {knownChips.map((k) => (
                  <span key={k.key} className={'ds-k' + (k.pinned ? ' pin' : '')}><b>{k.label}</b>{k.text}</span>
                ))}
              </div>
            )}
            {playing && (
              <div className="ds-inwrap">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="ds-in" type="text" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey}
                    placeholder="Type a name" aria-label="Guess a name" autoComplete="off" autoCorrect="off" spellCheck={false} />
                  <button type="button" className="ds-go" onClick={() => { if (opts.length) pick(opts[0]); }} disabled={!opts.length}>Guess</button>
                </div>
                {opts.length > 0 && (
                  <div className="ds-opts" role="listbox" aria-label="Matching names">
                    {opts.map((o, i) => (
                      <button key={o} type="button" role="option" aria-selected={i === 0} className={'ds-opt' + (i === 0 ? ' top' : '')} onClick={() => pick(o)}>{o}</button>
                    ))}
                  </div>
                )}
                <div className="ds-hint" aria-live="polite">
                  {fold(q).length >= 2 && !opts.length
                    ? 'No name on the list matches that. It has cost you nothing.'
                    : `${left} ${left === 1 ? 'guess' : 'guesses'} left. Type, then choose a name. Enter takes the top one.`}
                </div>
              </div>
            )}
          </div>

          {playing && hintOk && !g.hintUsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <button className="ds-tool" onClick={useHint} title="Pin one fact the guesses have not (one hint, first play only)" style={{ color: ACC_DEEP_INK }}>
                <Lightbulb size={14} /> Hint
              </button>
            </div>
          )}

        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--stg-line, rgba(28,30,36,0.10))', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: `var(--stg-mute, ${COLORS.faded})` }}>
              {left === MAX ? 'A filled cell matches. An arrow points toward the hidden number.' : 'Arrows point from your guess toward the hidden number.'}
            </span>
            {identity && guesses.length > 0 && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again to end and show the answer' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: GRID_MAX + 76, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: six guesses instead of eight.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Dossier in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new Dossier drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/dossier?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Dossier &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(/, 20\d\d$/, '')} archive.{' '}
                    <a href="/dossier" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Dossier &rarr;</a>
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
            name="Dossier"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            challengeMetric={won ? guesses.length : null}
            title={won ? 'Solved' : 'Not solved'}
            missLabel="Guesses"
            detail={`${U.name} · ${guesses.length}/${MAX} guesses · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Dossier all time` : 'all-time rank' }
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
                href: `/dossier?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your guesses', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the answer', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Dossier', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/dossier?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        </div>

        {!STAGE && <GamePanel self="dossier" name="Dossier" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="dossier" name="Dossier" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="dossier"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="dossier" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Dossier to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s Dossier, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s Dossier, every day.
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
          self="dossier"
          won={won}
          headline={won ? <>Solved!</> : <>Answer revealed</>}
          subline={won
            ? <>solved in {guesses.length} of {MAX}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>the answer is shown above</>}
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
            <button className="ds-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Dossier</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Dossier is a free daily guessing game from Mind Loft. One subject from the day&rsquo;s list is hidden, and every guess prints five facts about the name you tried. A filled cell means that fact matches the hidden subject. An arrow on a number says the hidden number is higher or lower. The word no rules a category out.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The list changes through the week. Presidents are compared on their number, party, state of birth, the year they took office and their age that day. Elements are compared on atomic number, period, block, state at room temperature and family. States are compared on the year they joined the Union, region, how many states they border, area rank and coast. Every fact is a fixed one, so an old puzzle never goes stale.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new subject drops every day at midnight Eastern, with eight guesses on a weekday and six on the Sunday Edition. No app, no signup, play free in your browser. More daily guessing: try <a href="/clade" style={{ color: INK, fontWeight: 800 }}>Clade</a>, <a href="/niche" style={{ color: INK, fontWeight: 800 }}>Niche</a> and <a href="/ping" style={{ color: INK, fontWeight: 800 }}>Ping</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
