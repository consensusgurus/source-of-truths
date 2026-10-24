'use client';

// Arcos, the daily set of acrostics (launched 2026-10-18).
//
// Three clued acrostics and a finale. FRONT: the first letters of the answers
// spell a hidden word. BACK: the last letters spell one. DIAGONAL: letter N of
// row N spells one. FINALE: one word goes with all three hidden words
// (FLASH, SPOT, MOON give LIGHT), typed on an open line with no length shown
// and checked on Enter. Every word that genuinely fits counts, not only the
// setter's: the board carries them as `also` (owner, 2026-10-18; see
// scripts/arcos-accept.mjs). A full answer checks itself; a wrong one
// shakes and clears and costs nothing. Revealing a row costs that round a
// point. Each round is worth 3, the finale 1 (three tries), out of 10; the
// clock breaks ties (registry miss: null).
//
// Built off ScramClient's frame (chrome, gate, saves, result posting, end card).

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Eye, Smartphone, Delete, Lightbulb } from 'lucide-react';
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
import { useRunEmbed, useRunHelp } from '../RunEmbed';
import RunDoorPop from '../circuits/RunDoorPop';
import useRailClearance from '../useRailClearance';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import WordStage, { usePhoneStage } from '../WordStage';

const COLORS = { cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted, good: T.successDeep || '#047857' };
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const TOTAL = 10;
const ROUND_PTS = 3;
const TRIES = 3;
const FIN_MAX = 12;
const KIND_NAME = { front: 'Front', back: 'Back', diag: 'Diagonal' };
const KIND_TITLE = { front: 'Front spine', back: 'Back spine', diag: 'Diagonal' };
const KIND_SUB = {
  front: 'The first letters spell a hidden word.',
  back: 'Now the LAST letters spell one. Words line up on the right.',
  diag: 'Letter 1 of row 1, letter 2 of row 2, and so on, spell one.',
};

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const HELP_KEY = 'sot_arcos_help_seen';
const STATS_KEY = 'sot_arcos_stats';

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
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[pz.num] = { s: sc, t: TOTAL, won: !!m.perfect };
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
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

function freshState() {
  return { v: 1, typed: {}, solved: {}, shown: {}, tries: [], finale: false, round: 0, hint: null, hintUsed: false, misses: 0, status: 'playing', t0: null, tEnd: null };
}
const keyOf = (r, i) => `${r}-${i}`;
// where row i of a round keeps its spine letter
function spineAt(kind, ans, i) { return kind === 'front' ? 0 : kind === 'back' ? ans.length - 1 : i; }

export function roundState(P, g, r) {
  const rows = P.rounds[r].rows;
  let done = 0, shown = 0;
  rows.forEach((_, i) => { if (g.solved[keyOf(r, i)]) done++; if (g.shown[keyOf(r, i)]) shown++; });
  const complete = done === rows.length;
  return { done, shown, complete, pts: complete ? Math.max(0, ROUND_PTS - shown) : 0 };
}
export function scoreOf(P, g) {
  let s = 0;
  for (let r = 0; r < 3; r++) s += roundState(P, g, r).pts;
  return s + (g.finale ? 1 : 0);
}

export default function ArcosClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_arcos_${PUZZLE.num}`;
  const [g, setG] = useState(freshState);
  const [sel, setSel] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armRow, setArmRow] = useState(false);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!armRow) return undefined;
    const t = setTimeout(() => setArmRow(false), 3500);
    return () => clearTimeout(t);
  }, [armRow]);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const phoneStage = usePhoneStage();
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
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('arcos', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('arcos'); }, [g.hintUsed]);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const firstOpen = (gg, r) => {
    const rows = PUZZLE.rounds[r].rows;
    for (let i = 0; i < rows.length; i++) if (!gg.solved[keyOf(r, i)]) return i;
    return 0;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1) {
          const merged = { ...freshState(), ...saved };
          setG(merged);
          if (merged.round < 3) setSel(firstOpen(merged, merged.round));
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
        if (dn || g.t0) localStorage.setItem('sot_arcos_day', JSON.stringify({ d: etToday(), done: dn }));
        else localStorage.removeItem('sot_arcos_day');
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
  const LOFT = isLoft('arcos');
  const STAGE = isStage('arcos', searchParams);
  const EMBED = useRunEmbed();
  useRunHelp(EMBED, () => setShowHelp(true));
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('arcos');
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor('arcos');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('arcos'), '--stg-acc-lt': gameColorLight('arcos'), '--stg-onramp-lt': gameOnrampLight('arcos'), '--stg-acc-ink-lt': gameAccentInkLight('arcos') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const CELL = STAGE ? 'var(--stg-cell)' : T.white;
  const CELL_LINE = STAGE ? 'var(--stg-cell-line)' : 'rgba(20,22,28,0.44)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.ember;
  const ONRAMP = STAGE ? 'var(--stg-onramp, #08222e)' : T.white;
  const CUR_BG = STAGE ? 'color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc)) 14%, var(--stg-cell))' : '#eef4ff';
  const DONE_BG = STAGE ? 'var(--stg-ink)' : COLORS.ink;
  const DONE_FG = STAGE ? 'var(--stg-ground)' : T.white;
  const GOOD = STAGE ? 'var(--stg-good)' : COLORS.good;
  const BAD = STAGE ? 'var(--stg-bad)' : COLORS.rust;
  const KEY_BG = STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : T.white;
  const KEY_LINE = STAGE ? '1.5px solid var(--stg-line2,rgba(255,255,255,0.17))' : '1.5px solid rgba(20,22,28,0.15)';
  const LINE2 = STAGE ? 'var(--stg-line2,rgba(255,255,255,0.17))' : 'rgba(20,22,28,0.2)';
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const rail = useRailClearance(started && mobileUi, 200);
  const focusMode = playing && !showChrome;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const rs = [0, 1, 2].map((r) => roundState(PUZZLE, g, r));
  const roundsDone = rs.filter((x) => x.complete).length;
  const finaleOpen = roundsDone === 3;
  const atFinale = g.round === 3;
  const R = atFinale ? null : PUZZLE.rounds[g.round];
  const curKey = R ? keyOf(g.round, sel) : null;
  const curAns = R ? R.rows[sel].a : PUZZLE.finale;
  const curDone = atFinale ? g.finale : !!g.solved[curKey];
  const typedCur = atFinale ? (g.typed.fin || '') : (curDone ? curAns : (g.typed[curKey] || ''));
  const triesLeft = TRIES - g.tries.length;
  const score = scoreOf(PUZZLE, g);
  // the finale counts any word that genuinely fits, not only the setter's
  const accepted = new Set([PUZZLE.finale, ...(PUZZLE.also || [])]);
  const finWord = g.finale ? (g.finWord || PUZZLE.finale) : null;

  const REC_KEY = `sot_arcos_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = Object.keys(g.solved).length > 0 || g.misses > 0 || g.tries.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    const sc = scoreOf(PUZZLE, g);
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const sc = scoreOf(PUZZLE, g2);
    if (EMBED) EMBED.onResult({ key: 'arcos', score: sc, total: 10, t0: g2 && g2.t0, tEnd: (g2 && g2.tEnd) || Date.now() });
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Score out of 10; the board breaks ties on time alone (registry miss: null).
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function finish(g1) {
    const sc = scoreOf(PUZZLE, g1);
    const g2 = { ...g1, status: sc === TOTAL ? 'won' : 'done', tEnd: Date.now() };
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, won: sc === TOTAL })); } catch (e) {}
    postResult(g2);
    setG(g2);
  }

  function nextOpenRow(gg, r, from) {
    const n = PUZZLE.rounds[r].rows.length;
    for (let k = 1; k <= n; k++) { const i = (from + k) % n; if (!gg.solved[keyOf(r, i)]) return i; }
    return -1;
  }
  function goRound(r) {
    if (busy) return;
    if (r === 3 && !finaleOpen && playing) { say('Finish all three acrostics to open the finale.'); return; }
    setG((cur) => ({ ...cur, round: r }));
    setArmRow(false);
    if (r < 3) setSel(firstOpen(g, r));
  }
  function pickRow(i) {
    if (busy || atFinale) return;
    setSel(i);
    setArmRow(false);
  }

  function afterSolve(g2, r, i) {
    const nx = nextOpenRow(g2, r, i);
    if (nx >= 0) { setG(g2); setBusy(true); setTimeout(() => { setBusy(false); setSel(nx); }, 420); return; }
    // round complete
    const w = PUZZLE.rounds[r].word;
    const done3 = [0, 1, 2].every((rr) => roundState(PUZZLE, g2, rr).complete);
    say(`${KIND_NAME[PUZZLE.rounds[r].kind]} solved: ${w}`);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setG((cur) => {
        let nr = cur.round;
        if (done3) nr = 3;
        else { for (let k = 1; k <= 3; k++) { const c = (r + k) % 3; if (!roundState(PUZZLE, cur, c).complete) { nr = c; break; } } }
        if (nr < 3) setSel(firstOpen(cur, nr));
        return { ...cur, round: nr };
      });
    }, 900);
    setG(g2);
  }

  function typeLetter(ch) {
    if (!playing || busy) return;
    if (atFinale) {
      if (g.finale || triesLeft <= 0) return;
      const cur = g.typed.fin || '';
      if (cur.length >= FIN_MAX) return;
      setG({ ...g, typed: { ...g.typed, fin: cur + ch } });
      return;
    }
    if (g.solved[curKey]) return;
    typeRow(ch);
  }
  // the finale is an open line: no length shown, checked on Enter
  function submitFinale() {
    if (!playing || busy || !atFinale || g.finale || triesLeft <= 0) return;
    const t = g.typed.fin || '';
    if (t.length < 2) { say('Type a word, then press Enter.'); return; }
    if (g.tries.includes(t)) { say(`You tried ${t} already.`); return; }
    const g2 = { ...g, typed: { ...g.typed, fin: t } };
    if (accepted.has(t)) {
      g2.finale = true;
      g2.finWord = t;
      setFx((f) => ({ ...f, good: 'fin', goodAt: Date.now() }));
      setG(g2);
      setBusy(true);
      setTimeout(() => { setBusy(false); finish(g2); }, 900);
      return;
    }
    g2.tries = [...g.tries, t];
    setG(g2);
    setFx((f) => ({ ...f, bad: 'fin', badAt: Date.now(), n: f.n + 1 }));
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setG((c2) => {
        const c3 = { ...c2, typed: { ...c2.typed, fin: '' } };
        if (c3.tries.length >= TRIES) { setTimeout(() => finish(c3), 0); }
        return c3;
      });
    }, 520);
  }
  function typeRow(ch) {
    const cur = g.typed[curKey] || '';
    if (cur.length >= curAns.length) return;
    const t = cur + ch;
    const g2 = { ...g, typed: { ...g.typed, [curKey]: t } };
    if (!g2.t0) g2.t0 = Date.now();
    if (t.length < curAns.length) { setG(g2); return; }
    if (t === curAns) {
      g2.solved = { ...g.solved, [curKey]: true };
      const tn = { ...g2.typed }; delete tn[curKey]; g2.typed = tn;
      setFx((f) => ({ ...f, good: curKey, goodAt: Date.now() }));
      afterSolve(g2, g.round, sel);
    } else {
      g2.misses = g.misses + 1;
      setG(g2);
      setFx((f) => ({ ...f, bad: curKey, badAt: Date.now(), n: f.n + 1 }));
      setBusy(true);
      const at = curKey;
      setTimeout(() => { setBusy(false); setG((c2) => ({ ...c2, typed: { ...c2.typed, [at]: '' } })); }, 480);
    }
  }
  function backspace() {
    if (!playing || busy) return;
    if (atFinale) {
      const cur = g.typed.fin || '';
      if (cur) setG({ ...g, typed: { ...g.typed, fin: cur.slice(0, -1) } });
      return;
    }
    if (g.solved[curKey]) return;
    const cur = g.typed[curKey] || '';
    if (cur) setG({ ...g, typed: { ...g.typed, [curKey]: cur.slice(0, -1) } });
  }
  function showRow() {
    if (!playing || busy || atFinale || g.solved[curKey]) return;
    if (!armRow) { setArmRow(Date.now()); return; }
    if (Date.now() - armRow < ARM_MIN_MS) return;
    setArmRow(false);
    const g2 = { ...g, solved: { ...g.solved, [curKey]: true }, shown: { ...g.shown, [curKey]: true } };
    if (!g2.t0) g2.t0 = Date.now();
    const tn = { ...g2.typed }; delete tn[curKey]; g2.typed = tn;
    afterSolve(g2, g.round, sel);
  }
  function useHint() {
    if (!hintOk || g.hintUsed || !playing || atFinale || g.solved[curKey]) return;
    setG({ ...g, hint: curKey, hintUsed: true });
  }

  const onKey = useCallback((k) => {
    if (k === 'BACK') backspace();
    else if (k === 'ENTER') submitFinale();
    else if (/^[A-Z]$/.test(k)) typeLetter(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sel, g, busy, curAns, curKey, atFinale]);

  useEffect(() => {
    function onDown(e) {
      if (showHelp || !started) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Backspace') { e.preventDefault(); onKey('BACK'); }
      else if (e.key === 'Enter' && atFinale) { e.preventDefault(); onKey('ENTER'); }
      // Tab walks to the next clue still open in this acrostic (Shift+Tab the previous),
      // wrapping, the way a crossword's Tab does (owner, 2026-10-20). Solved rows are
      // skipped because there is nothing left to type in them.
      else if (e.key === 'Tab' && !atFinale && R) {
        e.preventDefault();
        const n = R.rows.length, step = e.shiftKey ? -1 : 1;
        for (let k = 1; k <= n; k++) { const i = ((sel + step * k) % n + n) % n; if (!g.solved[keyOf(g.round, i)]) { pickRow(i); break; } }
      }
      else if (e.key === 'ArrowUp' && !atFinale) { e.preventDefault(); pickRow(Math.max(0, sel - 1)); }
      else if (e.key === 'ArrowDown' && !atFinale && R) { e.preventDefault(); pickRow(Math.min(R.rows.length - 1, sel + 1)); }
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    }
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onKey, showHelp, started, sel, atFinale, g, R]);

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
    const sq = rs.map((x) => (x.complete ? (x.shown ? '\u{1F7E8}' : '\u{1F7E9}') : '⬛')).join('');
    const fin = g.finale ? '✨' : '⬛';
    return `Arcos #${PUZZLE.num} · ${score}/${TOTAL} · ${elapsed}\n${sq} ${fin}\n${withRef('mindloftdaily.com/arcos')}`;
  }
  function copyShare() {
    const text = playing
      ? `Arcos #${PUZZLE.num}: three acrostics and one word that ties them together. Can you find it?\n${withRef('mindloftdaily.com/arcos')}`
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
  const ansOpen = ended && (won || !LOFT || revealed);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'arcos', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'arcos', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'arcos', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'arcos', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'arcos', active: LOFT && !playing });

  // ---- the board ----------------------------------------------------------
  const flashing = (k) => fx.good === k && Date.now() - fx.goodAt < 900;
  const shakingK = (k) => fx.bad === k && Date.now() - fx.badAt < 600;
  const maxLen = R ? Math.max(...R.rows.map((x) => x.a.length)) : 5;
  const cellW = `min(46px, calc((100vw - 64px) / ${Math.max(5, maxLen)} - 5px))`;
  const roundShown = (r) => ended && ansOpen;

  function cell(letter, opts) {
    const { spine, done, cur, ghost, miss, flash } = opts;
    let bg = CELL, fg = INK, border = `1.5px solid ${CELL_LINE}`;
    if (done) {
      if (spine) { bg = STAGE_C; fg = ONRAMP; border = `1.5px solid ${STAGE_C}`; }
      else { bg = flash ? GOOD : CELL; fg = flash ? DONE_FG : INK; border = `1.5px solid ${flash ? GOOD : LINE2}`; }
    } else if (miss) {
      fg = BAD; border = `1.5px dashed ${BAD}`;
    } else if (cur) {
      bg = CUR_BG; border = `2px solid ${ACC_INK}`;
    } else if (spine) {
      border = `1.5px dashed ${STAGE_C_INK}`;
    }
    return { bg, fg, border, letter: letter || (ghost || ''), ghost: !letter && !!ghost };
  }

  function rowView(r, i) {
    const round = PUZZLE.rounds[r];
    const row = round.rows[i];
    const k = keyOf(r, i);
    const done = !!g.solved[k];
    const isSel = playing && !atFinale && g.round === r && sel === i;
    const showAll = done || roundShown(r);
    const typed = done ? row.a : (g.typed[k] || '');
    const sp = spineAt(round.kind, row.a, i);
    const ghost = g.hint === k ? row.a[sp] : null;
    const right = round.kind === 'back';
    const cells = row.a.split('').map((ch, j) => {
      const letter = showAll ? row.a[j] : (typed[j] || '');
      const c = cell(letter, {
        spine: j === sp,
        done: done,
        cur: isSel && j === typed.length,
        ghost: j === sp && !letter ? ghost : null,
        miss: !done && showAll,
        flash: flashing(k),
      });
      return (
        <span key={j} className={'ar-cell' + (flashing(k) ? ' ar-flip' : '')}
          style={{ '--j': j, width: cellW, aspectRatio: '1 / 1', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: c.bg, color: c.fg, border: c.border, fontFamily: SANS, fontWeight: 800, fontSize: `min(22px, calc(${cellW} * 0.52))`, opacity: c.ghost ? 0.45 : 1, userSelect: 'none' }}>{c.letter}</span>
      );
    });
    return (
      <div key={k} className="ar-row" onClick={() => playing && pickRow(i)}
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: round.kind === 'diag' ? 'center' : (right ? 'flex-end' : 'flex-start'), gap: 5, padding: '6px 0 6px 12px', cursor: playing && !done ? 'pointer' : 'default' }}>
        {isSel && <span aria-hidden style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, background: ACC_INK }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {round.kind === 'diag' && <span style={{ width: 14, fontSize: 11, fontWeight: 800, color: FADED, textAlign: 'right' }}>{i + 1}</span>}
          <div key={shakingK(k) ? 'm' + fx.n : 'a'} className={shakingK(k) ? 'ar-rej' : undefined} style={{ display: 'flex', gap: 5 }}>{cells}</div>
          {round.kind === 'diag' && <span style={{ width: 14 }} />}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: isSel ? 800 : 600, color: isSel ? INK : FADED, lineHeight: 1.35, textAlign: round.kind === 'diag' ? 'center' : (right ? 'right' : 'left') }}>
          {row.c} <span style={{ fontWeight: 600, color: FADED }}>({row.a.length})</span>
          {done && g.shown[k] && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, color: BAD }}>shown</span>}
          {done && !g.shown[k] && <span style={{ marginLeft: 6, color: GOOD }}>&#10003;</span>}
        </div>
      </div>
    );
  }

  function hiddenStrip(r, label) {
    const round = PUZZLE.rounds[r];
    const showAll = roundShown(r);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', borderTop: `1px solid ${SURF_B}`, borderBottom: `1px solid ${SURF_B}` }}>
        <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 800, color: FADED }}>{label}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {round.word.split('').map((ch, i) => {
            const on = !!g.solved[keyOf(r, i)] || showAll;
            return <span key={i} style={{ width: 30, height: 30, boxSizing: 'border-box', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, background: on ? STAGE_C : 'transparent', color: on ? ONRAMP : FADED, border: on ? `1.5px solid ${STAGE_C}` : `1.5px dashed ${STAGE_C_INK}` }}>{on ? ch : ''}</span>;
          })}
        </div>
      </div>
    );
  }

  const tab = (r) => {
    const name = r === 3 ? 'Finale' : KIND_NAME[PUZZLE.rounds[r].kind];
    const done = r === 3 ? (g.finale || (ended)) : rs[r].complete;
    const cur = g.round === r;
    const locked = r === 3 && !finaleOpen && playing;
    return (
      <button key={r} onClick={() => goRound(r)} aria-current={cur ? 'true' : undefined}
        style={{ flex: '1 1 0', minWidth: 0, height: 34, borderRadius: 999, fontFamily: SANS, fontWeight: 800, fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', cursor: locked ? 'default' : 'pointer',
          background: done && !cur ? STAGE_C : 'transparent', color: done && !cur ? ONRAMP : (cur ? ACC_INK : FADED),
          border: cur ? `1.5px solid ${ACC_INK}` : `1px solid ${done ? STAGE_C : LINE2}`, opacity: locked ? 0.5 : 1 }}>{name}</button>
    );
  };

  // keyboard: every letter live
  const keyboardRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, ri) => (
    <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: 5, justifyContent: 'center' }}>
      {ri === 2 && atFinale && (
        <button className="ar-key" onClick={() => onKey('ENTER')} aria-label="Enter" style={{ flex: '1.6 0 0', height: 46, background: STAGE_C, color: ONRAMP, border: `1.5px solid ${STAGE_C}`, fontSize: 12, fontWeight: 800, letterSpacing: '.04em' }}>ENTER</button>
      )}
      {row.split('').map((ch) => (
        <button key={ch} className="ar-key" onClick={() => onKey(ch)} aria-label={ch}
          style={{ flex: '1 0 0', height: 46, background: KEY_BG, color: INK, fontSize: 15, border: KEY_LINE }}>{ch}</button>
      ))}
      {ri === 2 && (
        <button className="ar-key" onClick={() => onKey('BACK')} aria-label="Delete" style={{ flex: '1.6 0 0', height: 46, background: STAGE ? 'var(--stg-b3,rgba(255,255,255,0.145))' : COLORS.paper, color: INK, border: KEY_LINE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Delete size={18} />
        </button>
      )}
    </div>
  ));

  const finaleView = () => {
    const F = PUZZLE.finale;
    const showF = g.finale || ended;
    const shownF = finWord || F;
    const typedF = g.typed.fin || '';
    const shaking = shakingK('fin');
    const others = (PUZZLE.also || []).filter((w) => w !== shownF);
    let note;
    if (g.finale) note = finWord === F ? `${F}. All three tie together.` : `${finWord} works. The setter had ${F}.`;
    else if (ended) note = `The word was ${F}.`;
    else note = `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left. Type a word that goes with all three, then press Enter.`;
    const lineText = g.finale ? finWord : (ended ? F : typedF);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PUZZLE.rounds.map((round, r) => {
            const wordCells = (
              <div style={{ display: 'flex', gap: 4 }}>
                {round.word.split('').map((ch, i) => <span key={i} style={{ width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, background: STAGE_C, color: ONRAMP }}>{ch}</span>)}
              </div>
            );
            const slot = (
              <span style={{ minWidth: 86, height: 30, boxSizing: 'border-box', borderRadius: 6, border: `1.5px dashed ${showF ? STAGE_C : LINE2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, letterSpacing: '.06em', color: showF ? ACC_INK : FADED, padding: '0 8px' }}>{showF ? shownF : '?'}</span>
            );
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ width: 72, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 800, color: FADED }}>{KIND_NAME[round.kind]}</span>
                {PUZZLE.side === 'post' ? <>{wordCells}<span style={{ color: FADED, fontWeight: 800 }}>+</span>{slot}</> : <>{slot}<span style={{ color: FADED, fontWeight: 800 }}>+</span>{wordCells}</>}
              </div>
            );
          })}
        </div>
        <div key={shaking ? 'm' + fx.n : 'a'} className={shaking ? 'ar-rej' : (flashing('fin') ? 'ar-flip' : undefined)}
          style={{ alignSelf: 'center', width: 'min(340px, 100%)', minHeight: 58, boxSizing: 'border-box', marginTop: 6, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', fontWeight: 800, fontSize: 26, letterSpacing: '.12em', overflow: 'hidden', whiteSpace: 'nowrap',
            background: g.finale ? STAGE_C : CELL, color: g.finale ? ONRAMP : (ended ? BAD : INK),
            border: g.finale ? `1.5px solid ${STAGE_C}` : (ended ? `1.5px dashed ${BAD}` : `2px solid ${ACC_INK}`) }}>
          {lineText}
          {playing && !g.finale && <span aria-hidden className="ar-caret" style={{ display: 'inline-block', width: 2, height: 28, marginLeft: 3, background: ACC_INK }} />}
        </div>
        {playing && !g.finale && (
          <button onClick={() => onKey('ENTER')} disabled={typedF.length < 2 || busy}
            style={{ alignSelf: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 14, border: 'none', borderRadius: 8, padding: '10px 22px', cursor: typedF.length < 2 ? 'default' : 'pointer', background: STAGE_C, color: ONRAMP, opacity: typedF.length < 2 ? 0.45 : 1 }}>
            Check {typedF || 'it'}
          </button>
        )}
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: FADED }}>{note}</div>
        {showF && others.length > 0 && (
          <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: FADED }}>
            Also accepted: {others.join(', ')}
          </div>
        )}
        {g.tries.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {g.tries.map((t, i) => <span key={i} style={{ fontSize: 12.5, fontWeight: 800, color: BAD, textDecoration: 'line-through', letterSpacing: '.06em' }}>{t}</span>)}
          </div>
        )}
      </div>
    );
  };

  const rulesBody = (
    <DailyRules
      lead="Three acrostics and a finale. Each set of clued answers hides a word, and one more word goes with all three."
      steps={[
        <><b>Front</b>: solve each clue. The FIRST letters of the answers spell a hidden word.</>,
        <><b>Back</b>: the LAST letters spell one. <b>Diagonal</b>: letter 1 of row 1, letter 2 of row 2 and so on spell one.</>,
        <>Type an answer and it <b>checks itself</b>. A wrong one shakes and clears, and costs nothing. Tap any row to move to it.</>,
        <>Stuck on a row? <b>Show it</b>, for a point off that round.</>,
        <>The <b>finale</b>: one word that goes with all three hidden words, like FLASH, SPOT and MOON with LIGHT. No length is shown: type it and press Enter. Any word that truly fits counts, before or after. You get three tries.</>,
      ]}
      knack="Solve the easy clues first. A few spine letters often give the hidden word away, and the hidden word fills in the rest."
      footer="Each acrostic is worth 3, minus a point for every row you show. The finale is worth 1. Ten in all, and time breaks ties."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? (EMBED ? (EMBED.theme || 'dark') : stageTheme) : undefined}
      data-stage-pin={STAGE && EMBED ? '' : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {phoneStage && started && !EMBED && (() => {
        // The phone stage (owner, 2026-10-24): one clue at a time. Back and Next
        // walk every clue of the three acrostics in order, then the finale once
        // it is open; the dots jump straight to an acrostic.
        const stops = [];
        PUZZLE.rounds.forEach((rd, r) => rd.rows.forEach((_, i) => stops.push([r, i])));
        if (finaleOpen) stops.push([3, 0]);
        const at = Math.max(0, stops.findIndex(([r, i]) => r === g.round && (r === 3 || i === sel)));
        const goStop = (k) => {
          if (busy) return;
          const [r, i] = stops[((k % stops.length) + stops.length) % stops.length];
          setG((cur) => ({ ...cur, round: r }));
          if (r < 3) setSel(i);
          setArmRow(false);
        };
        const SUBS = { front: 'first letters spell a word', back: 'last letters spell a word', diag: 'letter N of row N spells a word' };
        const pips = [0, 1, 2, 3].map((r) => ({
          done: r === 3 ? g.finale : rs[r].complete, cur: g.round === r,
          onClick: () => goRound(r), label: r === 3 ? 'The finale' : `Acrostic ${r + 1}`,
        }));
        const foot = `${roundsDone} of 3 acrostics · ${score} of ${TOTAL} points`;
        const giveUp = { armed: !!armReveal, onPress: () => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); finish(g); } else { setArmReveal(Date.now()); } } };
        const nav = { onBack: () => goStop(at - 1), onNext: () => goStop(at + 1), pips };
        if (atFinale) {
          const typedF = g.typed.fin || '';
          const shaking = shakingK('fin');
          const combo = (
            <div className="wst-combo" aria-label="The three hidden words">
              {PUZZLE.rounds.map((rd, r) => <div key={r}>{PUZZLE.side === 'post' ? <>{rd.word} <i>+ ?</i></> : <><i>? +</i> {rd.word}</>}</div>)}
            </div>
          );
          const action = (
            <>
              <div key={shaking ? 'm' + fx.n : 'a'} className={'wst-line1' + (g.finale ? ' ok' : '') + (shaking ? ' wst-slots bad' : '')}>{g.finale ? finWord : typedF}</div>
              {g.tries.length > 0 && <div className="wst-tries">{g.tries.map((t, i) => <s key={i}>{t}</s>)}</div>}
            </>
          );
          return (
            <WordStage label="Arcos" eyebrow="The finale · one word goes with all three"
              spine={combo} slots={[]} action={action}
              note={toast || `${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left. Type a word, then Enter.`}
              rowKey="fin" nav={nav} onKey={onKey} enter foot={foot} frac={roundsDone / 3} giveUp={giveUp} />
          );
        }
        const round = PUZZLE.rounds[g.round];
        const row = round.rows[sel];
        const done = !!g.solved[curKey];
        const sp = spineAt(round.kind, row.a, sel);
        const typedR = done ? row.a : (g.typed[curKey] || '');
        const stSlots = [row.a.split('').map((ch, j) => {
          const letter = typedR[j] || '';
          const ghost = !letter && j === sp && g.hint === curKey;
          return { ch: letter || (ghost ? row.a[sp] : ''), spine: j === sp, ghost, cur: !done && j === typedR.length };
        })];
        const spineEl = (
          <div className="wst-spine" aria-label="The hidden word so far">
            {round.word.split('').map((ch, i) => {
              const on = !!g.solved[keyOf(g.round, i)];
              return <span key={i} className={(on ? 'f' : '') + (i === sel ? ' now' : '')}>{on ? ch : ''}</span>;
            })}
          </div>
        );
        const action = !done ? (
          <div className="wst-acts">
            {hintOk && !g.hintUsed && <button type="button" className="wst-act" onClick={useHint}>Free hint</button>}
            <button type="button" className={'wst-act' + (armRow ? ' on' : '')} onClick={showRow}>{armRow ? 'Tap again to show it' : 'Show this answer · costs a point'}</button>
          </div>
        ) : null;
        return (
          <WordStage label="Arcos" eyebrow={`Acrostic ${g.round + 1} of 3 · ${SUBS[round.kind]}`}
            spine={spineEl} clue={row.c} slots={stSlots}
            rowState={done ? (g.shown[curKey] ? 'ok shown' : 'ok') : (shakingK(curKey) ? 'bad' : null)}
            rowKey={curKey} slotsKey={shakingK(curKey) ? 'm' + fx.n : 'a'}
            note={toast || null} action={action} nav={nav} onKey={onKey}
            foot={foot} frac={roundsDone / 3} giveUp={giveUp} />
        );
      })()}
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="arcos" name="Arcos" collapsed={started} loft={LOFT} />}
      {LOFT && !EMBED && (
        <Cap gameKey="arcos" quizId={PUZZLE.quizId}
          name="Arcos"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${roundsDone} of 3`, k: 'rounds' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="ar-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .ar-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
            .ar-key{font-family:${SANS};font-weight:800;border-radius:6px;padding:0;touch-action:manipulation;cursor:pointer;}
            .ar-key:active{transform:scale(0.94);}
            @keyframes arflip{0%{transform:rotateX(0);}50%{transform:rotateX(90deg);}100%{transform:rotateX(0);}}
            .ar-flip{animation:arflip .3s cubic-bezier(.2,.7,.3,1) both;animation-delay:calc(var(--j,0) * 40ms);backface-visibility:hidden;}
            @keyframes arrej{0%,100%{transform:none;}20%{transform:translateX(-8px);}50%{transform:translateX(7px);}80%{transform:translateX(-3px);}}
            .ar-rej{animation:arrej .4s cubic-bezier(.2,.7,.3,1);}
            @keyframes arcaret{0%,49%{opacity:1;}50%,100%{opacity:0;}}
            .ar-caret{animation:arcaret 1s steps(1) infinite;}
            @media (prefers-reduced-motion:reduce){.ar-flip,.ar-rej,.ar-caret{animation:none !important;}}
            @media(max-width:560px){.ar-wrap{padding-left:14px !important;padding-right:14px !important;}}
          ` }} />

          {!LOFT && (
            <DailyMasthead
              slug="arcos"
              num={PUZZLE.num}
              dateLabel={PUZZLE.dateLabel}
              accent={COLORS.ember}
              blockGap={5}
              helpTop={13}
              marginBottom={16}
              onHelp={() => setShowHelp(true)}
              sunday={PUZZLE.sunday && <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: T.white, background: COLORS.ember, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
              blocks={'ARCOS'.split('').map((ch, i) => (
                <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 25, background: i === 0 ? COLORS.ember : COLORS.ink, color: T.white }}>{ch}</div>
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
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Arcos is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>Three acrostics, each hiding a word, and one more word that goes with all three.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="ar-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!preStart && (
            <div className="ar-board stg-board" data-arc={PUZZLE.rounds.map((r) => r.word).join(',') + '|' + (finWord || PUZZLE.finale)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 6 }}>{[0, 1, 2, 3].map(tab)}</div>

              {!atFinale && R && (
                <>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>{KIND_TITLE[R.kind]}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: FADED }}>{KIND_SUB[R.kind]}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {R.rows.map((_, i) => rowView(g.round, i))}
                  </div>
                  {hiddenStrip(g.round, 'Hidden word')}
                  {playing && !curDone && (
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={showRow} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: armRow ? BAD : FADED, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                        {armRow ? 'Tap again: show it for a point off this round' : 'Show this answer'}
                      </button>
                      {hintOk && !g.hintUsed && (
                        <button onClick={useHint} title="Free hint (one hint, first play only)" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: ACC_INK, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Lightbulb size={13} /> Free hint: this row&rsquo;s spine letter
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {atFinale && (
                <>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>Finale</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: FADED }}>One word goes with all three hidden words. Any word that truly fits counts.</div>
                  </div>
                  {finaleView()}
                </>
              )}

              {started && !mobileUi && (
                <div style={{ maxWidth: 500, margin: '4px auto 0', width: '100%' }}>
                  {keyboardRows}
                  <p style={{ fontSize: 11.5, color: FADED, fontWeight: 600, margin: '6px 0 0', textAlign: 'center' }}>
                    Type on your keyboard too. The up and down arrows move between rows.
                  </p>
                </div>
              )}

              {started && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); finish(g); } else { setArmReveal(Date.now()); } }}
                  style={{ alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? BAD : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again to stop the clock and reveal the answers' : 'Give up and reveal'}
                </button>
              )}

              {ended && !isTodays && (
                <p style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: 0 }}>
                  You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}
                  <a href="/arcos" style={{ color: INK, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Arcos &rarr;</a>
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
          {LOFT && !playing && !EMBED && (
            <LoftFinish
              name="Arcos"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'A clean sweep' : (g.finale ? `${finWord} found` : (score > 0 ? `${score} of ${TOTAL}` : 'Not solved'))}
              detail={`${score}/${TOTAL} · ${roundsDone} of 3 acrostics · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Arcos all time` : 'all-time rank' }
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
                  href: `/arcos?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answers',
                  sub: won ? 'Your finished board' : 'See the words you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Arcos', sub: `No. ${prevPuzzle.num}, ${prevPuzzle.dateLabel}`, href: `/arcos?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>
        {!STAGE && <GamePanel self="arcos" name="Arcos" onShow={() => setShowChrome(true)} />}
        {LOFT && !EMBED && (
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="arcos" name="Arcos" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
        )}
        {!focusMode && !LOFT && (<DailyGamesGrid replay={ended ? resetGame : null}
          self="arcos"
          maxWidth={640}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          boardSlot={<DailyBoardPanel self="arcos" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Arcos to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The Arcos tile opens today&apos;s puzzle, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The Arcos tile opens today&apos;s puzzle, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!EMBED && !focusMode && !identity && (
          <div id="daily-join" style={{ maxWidth: 640, margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); }} />
          </div>
        )}
        {rail.height > 0 && <div aria-hidden style={{ height: rail.height }} />}
      </div>

      {started && mobileUi && (
        <div ref={rail.ref} style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderTop: STAGE ? '1.5px solid var(--stg-line2,rgba(255,255,255,0.17))' : '1.5px solid rgba(20,22,28,0.12)', boxShadow: '0 -4px 16px rgba(20,22,28,0.10)', padding: '8px 6px calc(8px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>{keyboardRows}</div>
        </div>
      )}

      {ended && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="arcos"
          won={won}
          headline={<>{score} of {TOTAL}</>}
          subline={<>{PUZZLE.finale} &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: mobileUi && started ? 230 : 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
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
            <button className="ar-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {!EMBED && <StageFold />}
      <RunDoorPop id="crossed" game="arcos" ready={hydrated && preStart && isTodays && !EMBED} self="Arcos" />
      <section style={{ position: 'relative', display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Arcos</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Arcos is a free daily set of acrostics from Mind Loft. An acrostic is a list of words whose letters, read down a line, spell another word. Every day brings three of them, each with its own clues: in the first the opening letters spell a hidden word, in the second the closing letters do, and in the third the word runs down the diagonal, letter 1 of row 1, letter 2 of row 2 and so on.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Solve the three and the finale opens: one word that goes with all three hidden words, the way FLASH, SPOT and MOON all go with LIGHT. No length is shown, and any word that truly fits all three counts, so CHECK, STAND and BREAK take POINT, and UP and OUT as well. Every clue is written for a crossword, a wrong answer costs nothing, and each acrostic is worth three points, minus one for every row you choose to show.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Hidden words run four letters early in the week and five later, and the Sunday Edition hides five- and six-letter words behind longer answers. No app, no signup, play free in your browser. For a chain of linked words, try <a href="/hinge" style={{ color: INK, fontWeight: 800 }}>Hinge</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
