'use client';

// Sudoclue: the daily murder-mystery logic grid (owner, 2026-10-30). A real
// place drawn as a floor plan, north up, and a cast of people known by first
// name only. Place every person, ONE IN EVERY ROW AND ONE IN EVERY COLUMN, on a
// square they can stand on, and work out each one's hidden ROLE: the victim,
// the killer (the only other person in the victim's room), the accomplice, and
// the day's guests, staff and family. Clues mix names, roles and places.
//
// Scored like Alibi: a solve is ten, each wrong Check costs two (floor one), a
// give-up is nothing. guessesUsed is the wrong checks, so the daily board breaks
// ties on them. The timer is hidden by default (owner standing rule).
//
// NO ANSWER SHIPS. The client derives the unique answer from the clues with
// lib/sudoclue-engine.js, the same solver scripts/verify-sudoclue.mjs runs.
//
// Everything else is Roll's daily plumbing: banked boards gated by Eastern date
// on the server, per-puzzle localStorage saves, /sudoclue?p=N archive pinning,
// streaks and stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Smartphone } from 'lucide-react';
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
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
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
import { CONTEST, contestIsLive } from '@/lib/contest';
import { isLoft } from '@/lib/loft';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { endEfficiency, FAIL } from '@/lib/end-verdict';
import { scoreText } from '@/lib/daily-games';
import HelpSheet from '../HelpSheet';
import { PLACES } from '@/lib/sudoclue-places';
import { solve, sameAnswer, ROLESETS, ROLE_ORDER } from '@/lib/sudoclue-engine';
import { renderBoard, boardIndex, cellTitle, portraitSVG, COLORS as CAST_COLORS } from '@/lib/sudoclue-art';

const KEY = 'sudoclue';
const NAME = 'Sudoclue';
const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#be123c',        // Sudoclue identity, the Logic rose (legacy Loft surfaces only)
  accentSoft: '#ffe4e6', green: T.successDeep,
};
const TOTAL = 10;
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HELP_KEY = 'sot_sudoclue_help_seen';
const STATS_KEY = 'sot_sudoclue_stats';
const ROLE_ABBR = { Victim: 'Victim', Killer: 'Killer', Accomplice: 'Accomp.', Guest: 'Guest', Staff: 'Staff', Family: 'Family' };
const ROLE_SHORT = { Victim: 'Victim', Killer: 'Killer', Accomplice: 'Accomplice', Guest: 'Guest', Staff: 'Staff', Family: 'Family' };

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
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    run = prev != null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max };
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

const HAPT = { ok: [6], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const freshState = () => ({ v: 1, place: {}, roles: {}, cross: {}, struck: {}, wrong: 0, checks: 0, status: 'playing', t0: null, tEnd: null });

// The role counts a board deals: one victim, one killer, then the roleset.
function roleCounts(n) {
  const c = { Victim: 1, Killer: 1 };
  for (const r of ROLESETS[n] || []) c[r] = (c[r] || 0) + 1;
  return c;
}
const PLURAL = { Guest: 'guests', Staff: 'staff', Family: 'family' };

function Portrait({ id, size = 34, ring, dim }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-block', flex: 'none', width: size, height: size, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 ${size > 30 ? 3 : 2}px ${ring || 'currentColor'}`, opacity: dim ? 0.55 : 1 }}
      dangerouslySetInnerHTML={{ __html: portraitSVG(id) }} />
  );
}
function RoleTag({ size = 26 }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', flex: 'none', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', background: 'var(--stg-surf2, #eef1f6)', color: 'var(--stg-acc-ink, #be123c)' }}>
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><circle cx="8" cy="8" r="1.8" fill="currentColor" /></svg>
    </span>
  );
}

export default function SudoclueClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_sudoclue_${PUZZLE.num}`;
  const LAYOUT = PLACES[PUZZLE.place];
  const N = LAYOUT.rooms.length;
  const CAST = PUZZLE.cast;
  const COUNTS = useMemo(() => roleCounts(N), [N]);
  const IDX = useMemo(() => boardIndex(LAYOUT), [LAYOUT]);
  // The answer, derived from the clues on first need and kept.
  const solRef = useRef(null);
  const solution = () => {
    if (!solRef.current) solRef.current = solve(LAYOUT, CAST, PUZZLE.clues, 1)[0] || null;
    return solRef.current;
  };

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(CAST[0]);
  const [mode, setMode] = useState('place');
  const [clueView, setClueView] = useState('person');
  // THE PHONE DOCK (owner, 2026-10-30): the cast strip by default; pick a person and their face slides left
  // with their clues rotating beside it and the role buttons beneath; tap the face again, or place them on a
  // square, and it goes back to the full list.
  const [focus, setFocus] = useState(null);
  const [clueIdx, setClueIdx] = useState(0);
  const [narrow, setNarrow] = useState(false);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(max-width: 899px)');
      const on = () => setNarrow(mq.matches);
      on(); mq.addEventListener('change', on);
      return () => mq.removeEventListener('change', on);
    } catch (e) { return undefined; }
  }, []);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
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

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft(KEY);
  const STAGE = isStage(KEY, searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor(KEY);
  const STAGE_C_INK = STAGE ? 'var(--stg-acc-ink, var(--stg-acc))' : gameColor(KEY);
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor(KEY), '--stg-acc-lt': gameColorLight(KEY), '--stg-onramp-lt': gameOnrampLight(KEY), '--stg-acc-ink-lt': gameAccentInkLight(KEY) };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const BAD = STAGE ? 'var(--stg-bad, #fb923c)' : '#c2410c';
  const finalScore = won ? Math.max(1, TOTAL - 2 * g.wrong) : 0;

  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!armClear) return undefined;
    const t = setTimeout(() => setArmClear(false), 3500);
    return () => clearTimeout(t);
  }, [armClear]);
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
        if (saved && saved.v === 1 && saved.place) { const next = { ...freshState(), ...saved }; gRef.current = next; setG(next); }
      }
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
        if (done || g.t0) localStorage.setItem('sot_sudoclue_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_sudoclue_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  useEffect(() => {
    if (g.status === 'playing') return undefined;
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
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: KEY, quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: KEY, active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: KEY, active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: KEY, active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: KEY, active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const placedN = CAST.filter((p) => g.place[p]).length;
  const rolesN = CAST.filter((p) => g.roles[p]).length;

  const REC_KEY = `sot_sudoclue_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.t0 || !Object.keys(cur.place).length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: cur.wrong, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: TOTAL, g: g2.wrong, won: g2.status === 'won' && g2.wrong === 0 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // guessesUsed = wrong checks, so the daily board's ties break on them.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: TOTAL, correct: score === TOTAL ? 1 : 0, guessesUsed: g2.wrong, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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
  }

  const occupantAt = (k) => CAST.find((p) => g.place[p] && `${g.place[p][0]},${g.place[p][1]}` === k);
  const bad = useMemo(() => {
    const b = new Set();
    for (const a of CAST) for (const c of CAST) {
      if (a >= c || !g.place[a] || !g.place[c]) continue;
      if (g.place[a][0] === g.place[c][0] || g.place[a][1] === g.place[c][1]) { b.add(a); b.add(c); }
    }
    return b;
  }, [g.place, CAST]);

  function tapCell(k) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (!cur.t0) { startGame(); }
    const occ = CAST.find((p) => cur.place[p] && `${cur.place[p][0]},${cur.place[p][1]}` === k);
    if (mode === 'mark') {
      if (occ) { setSel(occ); setFocus(occ); setClueIdx(0); return; }
      commit({ ...gRef.current, cross: { ...cur.cross, [k]: !cur.cross[k] } });
      return;
    }
    if (occ) {
      if (occ === sel) {
        const place = { ...cur.place }; delete place[occ];
        commit({ ...gRef.current, place });
        setFocus(null);
      } else { setSel(occ); setFocus(occ); setClueIdx(0); }
      return;
    }
    if (!IDX.isOpen(k)) { vibrate(HAPT.wrong); say(`Nobody can stand there: ${cellTitle(LAYOUT, k)}.`); return; }
    if (!sel) return;
    const [r, c] = k.split(',').map(Number);
    const cross = { ...cur.cross }; delete cross[k];
    commit({ ...gRef.current, place: { ...cur.place, [sel]: [r, c] }, cross });
    vibrate(HAPT.ok);
    setFocus(null);
  }

  function setRole(p, r) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (!cur.t0) startGame();
    const roles = { ...gRef.current.roles };
    if (roles[p] === r) delete roles[p];
    else {
      const taken = CAST.filter((q) => q !== p && roles[q] === r).length;
      if (taken >= COUNTS[r]) {
        // A single-holder role moves to the new person; a full shared role refuses.
        if (COUNTS[r] === 1) { for (const q of CAST) if (roles[q] === r) delete roles[q]; }
        else { say(`All ${COUNTS[r]} ${PLURAL[r] || r.toLowerCase()} are taken. Clear one first.`); return; }
      }
      roles[p] = r;
    }
    commit({ ...gRef.current, roles });
  }

  function toggleStruck(i) {
    const cur = gRef.current;
    commit({ ...cur, struck: { ...cur.struck, [i]: !cur.struck[i] } });
  }

  function check() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (CAST.some((p) => !cur.place[p]) || CAST.some((p) => !cur.roles[p])) {
      say('Place everyone and give each person a role, then check.');
      return;
    }
    if (bad.size) { say('Two people share a row or a column. One per row, one per column.'); return; }
    const sol = solution();
    if (sol && sameAnswer(sol, cur.place, cur.roles)) {
      const done = { ...cur, status: 'won', tEnd: Date.now(), checks: cur.checks + 1 };
      vibrate(HAPT.win);
      postResult(done, Math.max(1, TOTAL - 2 * done.wrong));
      commit(done);
      return;
    }
    vibrate(HAPT.wrong);
    commit({ ...cur, wrong: cur.wrong + 1, checks: cur.checks + 1 });
    say('Not right yet. Something on the board, or a role, is wrong.');
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    commit(g2);
  }
  function giveUpTap() {
    if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); }
    else setArmReveal(Date.now());
  }
  function clearTap() {
    if (armClear) {
      if (Date.now() - armClear < ARM_MIN_MS) return;
      setArmClear(false);
      const cur = gRef.current;
      commit({ ...cur, place: {}, roles: {}, cross: {}, struck: {} });
    } else setArmClear(Date.now());
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setEndClosed(false);
    setSel(CAST[0]);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/sudoclue${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E5}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Sudoclue #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · case closed · ${g.wrong ? `${g.wrong} wrong` : 'no wrong checks'} · ${elapsed}${streakBit}`
      : `Sudoclue #${PUZZLE.num} · the case went cold`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Sudoclue #${PUZZLE.num}: the daily murder-mystery logic grid from Mind Loft. One person per row and column, and every role to deduce.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  // What the board shows: the player's work while playing, the answer after.
  const sol = !playing ? solution() : null;
  const shownPlace = sol ? sol.place : g.place;
  const shownRoles = sol ? sol.roles : g.roles;
  const victim = sol ? CAST.find((p) => sol.roles[p] === 'Victim') : null;
  const killer = sol ? CAST.find((p) => sol.roles[p] === 'Killer') : null;
  const accomplice = sol ? CAST.find((p) => sol.roles[p] === 'Accomplice') : null;
  const roomName = (p) => { const x = shownPlace[p]; return x ? LAYOUT.rinfo[LAYOUT.rooms[x[0]][x[1]]].at : ''; };

  const svg = useMemo(() => renderBoard(LAYOUT, {
    place: shownPlace, cross: playing ? g.cross : {}, bad: playing ? bad : new Set(), sel: playing ? sel : null,
    hl: sol ? CAST.filter((p) => ['Victim', 'Killer'].includes(sol.roles[p])).map((p) => sol.place[p]) : null,
  }), [LAYOUT, shownPlace, g.cross, bad, sel, playing, sol, CAST]);

  const clueList = PUZZLE.clues.map((c, i) => ({ ...c, i, who: c.p || null }));
  const mine = clueList.filter((c) => c.p === sel || c.q === sel);
  const roleClues = clueList.filter((c) => !c.p);
  const shownClues = clueView === 'all' ? clueList : clueView === 'roles' ? roleClues : (mine.length ? mine : roleClues);

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={<>Place all <b>{N} people</b> on the floor plan of <b>{LAYOUT.title}</b>, <b>one in every row and one in every column</b>, and work out who played which <b>role</b>.</>}
      banner={<><b>The killer was alone with the victim.</b> The victim&rsquo;s room holds exactly two people: the victim and the killer.</>}
      steps={[
        <>People stand on <b>open floor</b> or on a <b>seat</b>: a chair, a bench, a rug, a bed, a boat. Water, trees, tables, statues and the like are not places to stand.</>,
        <>Every person has one hidden role: the <b>victim</b>, the <b>killer</b>, the <b>accomplice</b>, or one of the day&rsquo;s <b>guests</b>, <b>staff</b> or <b>family</b>. The role chips count how many of each there are.</>,
        <><b>Beside</b> means on a square that shares an edge with the thing, not on it. <b>On</b> means on the thing itself. Every clue is true.</>,
        <>Tap a person, then tap a square to place them. Tap them again to pick them up. <b>Mark</b> mode crosses out squares you have ruled out.</>,
      ]}
      knack={<>Start with clues that name a room or an object that only one square holds. Rows and columns do the rest: once a person is fixed, cross out their whole row and column.</>}
      note={<><b>Check</b> when everyone is placed and has a role. A solve scores ten, and each wrong check costs two.</>}
      footer={<>The launch weekend is three 7 by 7 intro boards. After that: 7 by 7 Monday to Wednesday, 8 by 8 on Thursday and Friday, 9 by 9 on Saturday, and the Sunday Edition is 10 by 10. Names are first names only and the portraits are original drawings, not likenesses.</>}
    />
  );

  const chipBase = { fontFamily: SANS, fontWeight: 800, fontSize: 12.5, borderRadius: 999, padding: '6px 11px', cursor: 'pointer', border: `1.5px solid ${SURF_B}`, background: 'transparent', color: INK, display: 'inline-flex', alignItems: 'center', gap: 6 };

  // THE BOARD AND THE DOSSIER SIT TOGETHER (owner, 2026-10-30: "i can't really see the name and the clue
  // on one screen ... integrate that and job / role"). The board is capped to the screen height so the
  // dossier card (the cast strip, the selected person's name, their role picker and their clues) shows
  // beneath it on a phone and beside it on a desktop, with no scrolling between them.
  const boardEl = (
    <div className="sc-board" style={{ position: 'relative', width: '100%', margin: '0 auto', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 22px rgba(0,0,0,0.28)' }}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      {/* The place, written into the board (owner, 2026-10-30), top centre, in the game's own colour. */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none', whiteSpace: 'nowrap', background: STAGE ? 'var(--stg-acc)' : COLORS.accent, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontFamily: SANS, fontWeight: 800, fontSize: 'clamp(10px, 2.6vw, 13px)', letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 999, padding: '4px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        {LAYOUT.title} · {LAYOUT.place.split(',')[0]}
      </div>
      {playing && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, gridTemplateRows: `repeat(${N}, 1fr)` }}>
          {Array.from({ length: N * N }, (_, i) => {
            const r = Math.floor(i / N), c = i % N, k = `${r},${c}`;
            const occ = occupantAt(k);
            return (
              <button key={k} type="button" onClick={() => tapCell(k)}
                aria-label={`${cellTitle(LAYOUT, k)}, row ${r + 1}, column ${c + 1}${occ ? `, ${occ}` : ''}`}
                className="sc-hit" style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, cursor: IDX.isOpen(k) || occ ? 'pointer' : 'default' }} />
            );
          })}
        </div>
      )}
    </div>
  );

  // THE FOOT, below everything, as on every stage daily: the rule in one line and Give Up. The clock lives
  // in the cap (hidden by default, the reveal preference), not here.
  const foot = playing && !preStart && (
    <div className="sc-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14, padding: '10px 2px 0', borderTop: `1px solid ${SURF_B}`, fontFamily: SANS }}>
      <span style={{ fontSize: 12.5, fontWeight: 650, color: FADED, lineHeight: 1.4 }}>One per row and column. The killer was alone with the victim.</span>
      <button type="button" onClick={giveUpTap} style={{ minHeight: 44, flex: 'none', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: armReveal ? BAD : FADED, textDecoration: 'underline', textUnderlineOffset: 3 }}>
        {armReveal ? 'Tap again to give up' : 'Give Up'}
      </button>
    </div>
  );

  const selPlace = g.place[sel] ? LAYOUT.rinfo[LAYOUT.rooms[g.place[sel][0]][g.place[sel][1]]].name : null;
  const focusClues = focus ? clueList.filter((c) => c.p === focus || c.q === focus) : [];
  useEffect(() => {
    if (!focus || focusClues.length < 2) return undefined;
    const t = setInterval(() => setClueIdx((i) => i + 1), 3800);
    return () => clearInterval(t);
  }, [focus, focusClues.length]);
  function pickFace(p) {
    if (focus === p) { setFocus(null); return; }
    setSel(p); setFocus(p); setClueIdx(0);
  }
  const FACE = 38, GAP = 6;
  const dock = playing && !preStart && (
    <div className="sc-dock" style={{ fontFamily: SANS }}>
      <div style={{ borderRadius: 12, background: SURF, border: `1px solid ${SURF_B}`, overflow: 'hidden' }}>
        <div style={{ height: 74, position: 'relative', overflow: 'hidden' }}>
          {!focus ? (
            <div role="listbox" aria-label="People" className="sc-strip" style={{ display: 'flex', gap: GAP, padding: '8px 10px', overflowX: 'auto', height: '100%', alignItems: 'flex-start' }}>
              {CAST.map((p) => (
                <button key={p} type="button" role="option" aria-selected={p === sel} onClick={() => pickFace(p)}
                  style={{ flex: 'none', width: FACE + 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <span style={{ borderRadius: '50%', boxShadow: p === sel ? `0 0 0 2px ${ACC}` : 'none', padding: 1 }}><Portrait id={p} size={FACE - 4} ring={CAST_COLORS[p]} dim={!g.place[p]} /></span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: p === sel ? INK : FADED, lineHeight: 1.1, maxWidth: FACE + 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: ACC_INK, lineHeight: 1.1, minHeight: 10 }}>{g.roles[p] ? ROLE_ABBR[g.roles[p]] : ''}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', height: '100%' }}>
              <button type="button" onClick={() => pickFace(focus)} aria-label={`${focus}, tap to show everyone`} className="sc-slide"
                style={{ '--from': `${CAST.indexOf(focus) * (FACE + 6 + GAP)}px`, flex: 'none', width: FACE + 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <span style={{ borderRadius: '50%', boxShadow: `0 0 0 2px ${ACC}`, padding: 1 }}><Portrait id={focus} size={FACE} ring={CAST_COLORS[focus]} /></span>
                <span style={{ fontSize: 11, fontWeight: 800, color: INK, lineHeight: 1.1 }}>{focus}</span>
              </button>
              {focusClues.length ? (() => {
                const c = focusClues[clueIdx % focusClues.length];
                return (
                  <button type="button" onClick={() => setClueIdx((i) => i + 1)} className="sc-cluebtn"
                    style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS }}>
                    <span key={`${focus}-${clueIdx}`} className="sc-fade" style={{ display: 'block', fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: g.struck[c.i] ? FADED : INK }}>{c.text}</span>
                    <span style={{ display: 'flex', gap: 4, marginTop: 5, alignItems: 'center' }}>
                      {focusClues.length > 1 && focusClues.map((x, k) => (
                        <span key={k} style={{ width: 6, height: 6, borderRadius: '50%', background: k === clueIdx % focusClues.length ? ACC : SURF_B }} />
                      ))}
                      {focusClues.length > 1 && <span style={{ fontSize: 10.5, fontWeight: 700, color: FADED, marginLeft: 4 }}>{(clueIdx % focusClues.length) + 1} of {focusClues.length}</span>}
                    </span>
                  </button>
                );
              })() : (
                <span className="sc-fade" style={{ flex: 1, fontSize: 13.5, fontWeight: 650, color: FADED, lineHeight: 1.35 }}>No clue names {focus}. Rows, columns and the role clues will place them.</span>
              )}
            </div>
          )}
        </div>
        {focus && (
          <div role="group" aria-label={`${focus}'s role`} className="sc-roles sc-fade" style={{ display: 'flex', gap: 5, padding: '0 10px 9px' }}>
            {ROLE_ORDER.filter((r) => COUNTS[r]).map((r) => {
              const left = COUNTS[r] - CAST.filter((q) => g.roles[q] === r).length;
              const on = g.roles[focus] === r;
              return (
                <button key={r} type="button" onClick={() => setRole(focus, r)} aria-pressed={on}
                  style={{ ...chipBase, flex: 'none', fontSize: 12, padding: '5px 9px', borderColor: on ? ACC : SURF_B, background: on ? ACC : 'transparent', color: on ? ON_ACC : (left > 0 ? INK : FADED) }}>
                  {r}<span style={{ fontWeight: 700, opacity: 0.7 }}>{left}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="sc-tools" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
        <button type="button" className="pk-btn" onClick={() => setShowAll(true)}>Clues</button>
        <button type="button" className="pk-btn" onClick={() => setMode(mode === 'place' ? 'mark' : 'place')} aria-pressed={mode === 'mark'}
          style={mode === 'mark' ? { borderColor: ACC, color: ACC_INK } : undefined}>{mode === 'mark' ? 'Marking' : 'Mark'}</button>
        <button type="button" className="pk-btn" onClick={check}
          style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white }}>
          Check{placedN === N && rolesN === N ? '' : ` ${CAST.filter((q) => g.place[q] && g.roles[q]).length}/${N}`}
        </button>
        <button type="button" className="pk-btn" onClick={clearTap} style={armClear ? { color: BAD, borderColor: BAD } : undefined}>{armClear ? 'Sure?' : 'Clear'}</button>
      </div>
      {showAll && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setShowAll(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(8,10,16,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="sc-sheet" style={{ width: '100%', maxHeight: '72svh', overflowY: 'auto', background: STAGE ? 'var(--stg-raise, #0e131f)' : T.white, borderRadius: '16px 16px 0 0', padding: '14px 14px 20px', borderTop: `1px solid ${SURF_B}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: INK }}>All clues</span>
              <button type="button" onClick={() => setShowAll(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 800, color: FADED, textDecoration: 'underline' }}>Done</button>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {clueList.map((c) => (
                <li key={c.i}>
                  <button type="button" onClick={() => toggleStruck(c.i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: `1px solid ${SURF_B}`, padding: '9px 0', cursor: 'pointer', fontFamily: SANS }}>
                    {c.p ? <Portrait id={c.p} size={24} ring={CAST_COLORS[c.p]} /> : <RoleTag size={24} />}
                    <span style={{ fontSize: 14.5, fontWeight: 650, lineHeight: 1.35, color: g.struck[c.i] ? FADED : INK, textDecoration: g.struck[c.i] ? 'line-through' : 'none' }}>{c.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>, document.body
      )}
    </div>
  );

  const dossier = playing && !preStart && (
    <div className="sc-side" style={{ fontFamily: SANS }}>
      <div style={{ borderRadius: 12, background: SURF, border: `1px solid ${SURF_B}`, overflow: 'hidden' }}>
        {/* The cast strip: one tap picks a person. A dimmed face is not placed yet; the word under a name is the role given. */}
        <div role="listbox" aria-label="People" className="sc-strip" style={{ display: 'flex', gap: 6, padding: '9px 10px 7px', overflowX: 'auto', borderBottom: `1px solid ${SURF_B}` }}>
          {CAST.map((p) => {
            const on = p === sel;
            return (
              <button key={p} type="button" role="option" aria-selected={on} aria-label={`${p}${g.roles[p] ? `, ${g.roles[p]}` : ''}`} onClick={() => setSel(p)}
                style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: '2px 3px', cursor: 'pointer', borderRadius: 8, outline: on ? `2px solid ${ACC}` : 'none', outlineOffset: 0 }}>
                <Portrait id={p} size={32} ring={CAST_COLORS[p]} dim={!g.place[p]} />
                <span style={{ fontSize: 10.5, fontWeight: 800, color: on ? INK : FADED, lineHeight: 1.1 }}>{p}</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: ACC_INK, lineHeight: 1.1, minHeight: 10 }}>{g.roles[p] ? ROLE_ABBR[g.roles[p]] : ''}</span>
              </button>
            );
          })}
        </div>
        {/* The selected person: name, where they stand, their role, and the clues that name them. */}
        <div style={{ padding: '9px 12px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: INK, letterSpacing: '-0.01em' }}>{sel}</span>
            <span style={{ fontSize: 12.5, fontWeight: 650, color: bad.has(sel) ? BAD : FADED }}>
              {selPlace ? selPlace : 'not placed: tap a square'}{bad.has(sel) ? ' · shares a row or column' : ''}
            </span>
          </div>
          <div role="group" aria-label={`${sel}'s role`} className="sc-roles" style={{ display: 'flex', gap: 5, marginTop: 7 }}>
            {ROLE_ORDER.filter((r) => COUNTS[r]).map((r) => {
              const left = COUNTS[r] - CAST.filter((q) => g.roles[q] === r).length;
              const on = g.roles[sel] === r;
              return (
                <button key={r} type="button" onClick={() => setRole(sel, r)} aria-pressed={on}
                  style={{ ...chipBase, flex: 'none', fontSize: 12, padding: '5px 9px', borderColor: on ? ACC : SURF_B, background: on ? ACC : 'transparent', color: on ? ON_ACC : (left > 0 ? INK : FADED) }}>
                  {r}<span style={{ fontWeight: 700, opacity: 0.7 }}>{left}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '6px 12px 4px' }}>
          {clueView === 'person' && !mine.length && (
            <div style={{ fontSize: 13, fontWeight: 600, color: FADED, padding: '6px 0 4px' }}>No clue names {sel}. The role clues may still reach them:</div>
          )}
          <ol className="sc-clues" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {shownClues.map((c) => (
              <li key={c.i}>
                <button type="button" onClick={() => toggleStruck(c.i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: `1px solid ${SURF_B}`, padding: '8px 0', cursor: 'pointer', fontFamily: SANS }}>
                  {c.p ? <Portrait id={c.p} size={22} ring={CAST_COLORS[c.p]} /> : <RoleTag size={22} />}
                  <span style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.35, color: g.struck[c.i] ? FADED : INK, textDecoration: g.struck[c.i] ? 'line-through' : 'none' }}>{c.text}</span>
                </button>
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', gap: 12, padding: '6px 0 8px', borderTop: `1px solid ${SURF_B}` }}>
            {[['person', `${sel}'s clues`], ['roles', `Role clues (${roleClues.length})`], ['all', `All clues (${clueList.length})`]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setClueView(v)} aria-pressed={clueView === v}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 800, color: clueView === v ? ACC_INK : FADED, textDecoration: clueView === v ? 'none' : 'underline' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="sc-tools" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" className="pk-btn" onClick={() => setMode(mode === 'place' ? 'mark' : 'place')} aria-pressed={mode === 'mark'}
          style={mode === 'mark' ? { borderColor: ACC, color: ACC_INK } : undefined}>{mode === 'mark' ? 'Marking' : 'Mark'}</button>
        <button type="button" className="pk-btn" onClick={check}
          style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white }}>
          Check{placedN === N && rolesN === N ? '' : ` · ${CAST.filter((q) => g.place[q] && g.roles[q]).length} of ${N} done`}
        </button>
        <button type="button" className="pk-btn" onClick={clearTap} style={armClear ? { color: BAD, borderColor: BAD } : undefined}>{armClear ? 'Tap again to clear' : 'Clear'}</button>
      </div>
    </div>
  );

  const casePanel = !playing && sol && (
    <div style={{ maxWidth: 560, margin: '14px auto 0', fontFamily: SANS }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>
        {victim} was the victim, {roomName(victim)}. <span style={{ color: ACC_INK }}>{killer} did it</span>, the only other person in the room, and {accomplice} was the accomplice.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {CAST.map((p) => (
          <span key={p} style={{ ...chipBase, cursor: 'default', padding: '4px 10px 4px 4px' }}>
            <Portrait id={p} size={24} ring={CAST_COLORS[p]} />{p}<span style={{ fontWeight: 700, fontSize: 11, color: FADED }}>{shownRoles[p]}</span>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (<DailyChrome slug={KEY} name={NAME} collapsed={started} loft={LOFT} />)}
      {LOFT && (
        <Cap gameKey={KEY} quizId={PUZZLE.quizId}
          name={NAME}
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${placedN}/${N}`, k: 'placed' },
            { v: `${rolesN}/${N}`, k: 'roles' },
            { v: g.wrong, k: 'wrong' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: won ? 'Solved' : 'Unsolved', k: 'result' },
            { v: g.wrong, k: 'wrong' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="pk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: started ? '8px 38px 80px' : '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pk-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .pk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .sc-board{max-width:min(560px, calc(100svh - 270px));min-width:min(100%, 250px);}
          @keyframes scSlide{from{transform:translateX(var(--from));}to{transform:none;}}
          @keyframes scFade{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:none;}}
          @keyframes scUp{from{transform:translateY(100%);}to{transform:none;}}
          .sc-slide{animation:scSlide .32s cubic-bezier(.2,.8,.2,1);}
          .sc-fade{animation:scFade .3s ease-out;}
          .sc-sheet{animation:scUp .25s ease-out;}
          @media (prefers-reduced-motion: reduce){.sc-slide,.sc-fade,.sc-sheet{animation:none;}}
          .sc-dock{position:sticky;bottom:0;z-index:5;padding-bottom:6px;background:var(--stg-ground, #f7f8fa);}
          .sc-dock .pk-btn{padding:8px 12px;font-size:13.5px;}
          .sc-roles{overflow-x:auto;scrollbar-width:none;} .sc-roles::-webkit-scrollbar{display:none;}
          .sc-clues{max-height:26svh;overflow-y:auto;}
          @media(max-width:899px){
            .sc-play{gap:8px !important;}
            .sc-tools .pk-btn{padding:8px 13px;font-size:13.5px;}
          }
          .sc-strip{scrollbar-width:none;} .sc-strip::-webkit-scrollbar{display:none;}
          .sc-play{display:flex;flex-direction:column;gap:12px;}
          @media(min-width:900px){
            .sc-play{display:grid;grid-template-columns:minmax(0, min(600px, calc(100vh - 170px))) minmax(320px, 400px);justify-content:center;align-items:start;gap:22px;}
            .sc-board{max-width:none;}
            .sc-side{position:sticky;top:12px;}
            .sc-roles{flex-wrap:wrap;overflow:visible;}
            .sc-clues{max-height:calc(100vh - 380px);}
          }
          .sc-hit:focus-visible{outline:3px solid var(--stg-acc, #be123c);outline-offset:-3px;border-radius:6px;}
        ` }} />

        <div style={{ maxWidth: started ? 1040 : 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug={KEY} num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
          blocks={'CLUE'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to Play' : `Murder ${LAYOUT.deathAt}`}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N} people, {LAYOUT.title}, {LAYOUT.place}. Put one person in every row and every column, then name the victim, the killer, the accomplice and everyone else&rsquo;s role. The killer was the only person alone with the victim.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pk-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C_INK : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Back' : 'How to Play'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <>
            <div className={playing ? 'sc-play' : undefined}>
              <div>{boardEl}</div>
              {narrow ? dock : dossier}
            </div>
            {foot}
            {casePanel}
          </>
        )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 560, margin: '12px auto 0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, lineHeight: 1.5 }}>
                {won ? (g.wrong ? `Solved with ${g.wrong} wrong check${g.wrong === 1 ? '' : 's'}.` : 'Solved on the first check.') : 'The answer above is the only one the clues allow.'}
              </div>
              {!STAGE && isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0' }}><span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span></div>
              )}
              {!STAGE && (<p className="loft-tailnote" style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Sudoclue in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new case opens at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/sudoclue?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Sudoclue &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/sudoclue" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Sudoclue &rarr;</a>
                    {' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
                  </>
                )}
              </p>)}
            </div>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Sudoclue"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={null}
              title={endEfficiency(won, finalScore)}
              detail={`${g.wrong} wrong · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '-',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Sudoclue all time` : 'all-time rank' }
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
                  href: `/sudoclue?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? scoreText(KEY, stats.rec[p.num].s, stats.rec[p.num].t) : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'The solved case', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Sudoclue', sub: `No. ${prevPuzzle.num}, yesterday’s case`, href: `/sudoclue?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This case again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>

        {!STAGE && <GamePanel self={KEY} name={NAME} onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self={KEY} name={NAME} accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self={KEY} maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self={KEY} quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Sudoclue to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s case, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s case, every day.</p>
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
        <DailyEndCard modal self={KEY} won={won}
          headline={won ? (g.wrong === 0 ? <>Case closed, first try.</> : <>Case closed.</>) : <>{FAIL}</>}
          subline={won ? <>{g.wrong} wrong &middot; {elapsed}</> : <>{killer} did it.</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
      )}

      {showHelp && (
        <HelpSheet onClose={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} self={KEY} name={NAME}>
          {rulesBody}
        </HelpSheet>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Sudoclue</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Sudoclue is a free daily murder-mystery logic puzzle from Mind Loft. Each case is set in a real place drawn as a floor plan, north up, with its real landmarks on the squares: the Bow Bridge and the Bethesda fountain in Central Park, the Swan Boats in the Boston Public Garden, the Foucault pendulum at Griffith Observatory. Place every person so there is exactly one in each row and each column, as in a sudoku, then deduce each person&rsquo;s hidden role. The killer is the one person who was alone in a room with the victim.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every case is machine generated and then proved by an independent solver to have exactly one answer, so pure deduction always cracks it. The board grows through the week: 7 by 7 Monday to Wednesday, 8 by 8 on Thursday and Friday, 9 by 9 on Saturday, and the Sunday Edition is 10 by 10.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new case opens every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More whodunits: <a href="/alibi" style={{ color: INK, fontWeight: 800 }}>Alibi</a>, our nightly deduction grid, and <a href="/sworn" style={{ color: INK, fontWeight: 800 }}>Sworn</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
