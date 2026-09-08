'use client';

// Stands — the daily results-table reconstruction.
//
// Everyone played everyone once. Win 3, draw 1, loss 0. The results sheet is
// gone, a handful of facts survive, and exactly one set of results fits them.
// Fill the grid; the table underneath keeps score as you go.
//
// The client never receives the results. The board ships teams and clues, and
// this component re-derives the unique table with the same bounded search the
// generator used to prove it (scripts/verify-stands.mjs), which also confirms
// the clue set is minimal: drop any one clue and the table stops being unique.
//
// Scoring: 12 points, 3 off for each sheet handed in wrong, 2 for a nudge that
// fills one match. Sundays add a sixth team, which is five more matches.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Table2, Lightbulb, Eraser } from 'lucide-react';
import Grain from '../Grain';
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
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import DailyRules from '../DailyRules';
import { T as THEME } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: THEME.surface, paper: THEME.paper, ink: THEME.ink, ember: THEME.accent, rust: THEME.danger, faded: THEME.muted,
  accent: THEME.blueDeep, accentSoft: '#dbeafe', accentDeep: THEME.blueDark, green: THEME.successDeep, greenSoft: '#dcfce7', amber: '#b45309',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_stands_help_seen';
const STATS_KEY = 'sot_stands_stats';
const TOTAL = 12;

const pairsOf = (n) => { const p = []; for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) p.push([i,j]); return p; };

// ─── the solver: derive the one table the clues allow ───────────────────────
function search(n, pairs, clues, cap, collect) {
  const m = pairs.length;
  const fixed = Array(m).fill(-1);
  const idx = (x, y) => pairs.findIndex(([a,b]) => (a === x && b === y) || (a === y && b === x));
  for (const c of clues) {
    if (c.type === 'beat') { const k = idx(c.x,c.y); const v = pairs[k][0] === c.x ? 0 : 2; if (fixed[k] >= 0 && fixed[k] !== v) return { count: 0, first: null }; fixed[k] = v; }
    if (c.type === 'drew') { const k = idx(c.x,c.y); if (fixed[k] >= 0 && fixed[k] !== 1) return { count: 0, first: null }; fixed[k] = 1; }
  }
  const want = { pts: Array(n).fill(-1), wins: Array(n).fill(-1), draws: Array(n).fill(-1) };
  const unbeaten = [], winless = [], rest = [];
  let totalDraws = -1;
  for (const c of clues) {
    if (c.type === 'points') want.pts[c.x] = c.p;
    else if (c.type === 'wins') want.wins[c.x] = c.n;
    else if (c.type === 'draws') want.draws[c.x] = c.n;
    else if (c.type === 'unbeaten') unbeaten.push(c.x);
    else if (c.type === 'winless') winless.push(c.x);
    else if (c.type === 'totalDraws') totalDraws = c.n;
    else if (c.type === 'above') rest.push(c);
  }
  const left = Array(n).fill(0);
  pairs.forEach(([i,j],k) => { if (fixed[k] < 0) { left[i]++; left[j]++; } });
  const pts = Array(n).fill(0), wins = Array(n).fill(0), draws = Array(n).fill(0), losses = Array(n).fill(0);
  const bump = (i,j,r,s) => {
    if (r === 0) { pts[i] += 3*s; wins[i] += s; losses[j] += s; }
    else if (r === 2) { pts[j] += 3*s; wins[j] += s; losses[i] += s; }
    else { pts[i] += s; pts[j] += s; draws[i] += s; draws[j] += s; }
  };
  const cur = fixed.slice();
  pairs.forEach(([i,j],k) => { if (fixed[k] >= 0) bump(i,j,fixed[k],1); });
  const free = []; pairs.forEach((p,k) => { if (fixed[k] < 0) free.push(k); });
  let count = 0, first = null, drawsUsed = fixed.filter((f) => f === 1).length;
  const alive = (i) => {
    if (want.pts[i] >= 0 && (pts[i] > want.pts[i] || pts[i] + 3*left[i] < want.pts[i])) return false;
    if (want.wins[i] >= 0 && (wins[i] > want.wins[i] || wins[i] + left[i] < want.wins[i])) return false;
    if (want.draws[i] >= 0 && (draws[i] > want.draws[i] || draws[i] + left[i] < want.draws[i])) return false;
    if (unbeaten.indexOf(i) >= 0 && losses[i] > 0) return false;
    if (winless.indexOf(i) >= 0 && wins[i] > 0) return false;
    return true;
  };
  (function rec(t) {
    if (count >= cap) return;
    if (t === free.length) {
      if (totalDraws >= 0 && drawsUsed !== totalDraws) return;
      for (const c of rest) if (!(pts[c.x] > pts[c.y])) return;
      count++; if (!first && collect) first = cur.slice();
      return;
    }
    const k = free[t], [i,j] = pairs[k];
    for (let r = 0; r < 3; r++) {
      cur[k] = r; bump(i,j,r,1); left[i]--; left[j]--; if (r === 1) drawsUsed++;
      if (alive(i) && alive(j) && (totalDraws < 0 || drawsUsed <= totalDraws)) rec(t+1);
      if (r === 1) drawsUsed--; left[i]++; left[j]++; bump(i,j,r,-1); cur[k] = -1;
      if (count >= cap) return;
    }
  })(0);
  return { count, first };
}

const isIosDevice = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platstands === 'MacIntel' && navigator.maxTouchPoints > 1));
function etToday() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return new Date().toISOString().slice(0,10); } }
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length-1] : puzzles[0];
}
function fmtTime(ms) { const s = Math.max(0, Math.round(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
function msToMidnightET() {
  try { const now = new Date(); const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })); const next = new Date(et); next.setHours(24,0,0,0); return next - et; }
  catch (e) { const now = new Date(); const next = new Date(now); next.setHours(24,0,0,0); return next - now; }
}
function fmtCountdown(ms) { const s = Math.max(0, Math.floor(ms/1000)); return `${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try { let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('sot_quiz_anon', a); }
    return a; } catch (e) { return null; }
}
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

function getStats() { try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {} return { v: 1, rec: {} }; }
function recordStat(num, entry) { const s = getStats(); if (s.rec[num]) return s; const s2 = { ...s, rec: { ...s.rec, [num]: entry } }; try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {} return s2; }
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  const nums = Object.keys(rec).map(Number).sort((a,b) => a-b);
  let max = 0, run = 0, prev = null;
  for (const n of nums) { run = prev != null && n === prev+1 ? run+1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum-1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, perfect: nums.filter((n) => rec[n].won).length, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {}; for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0)/100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

function freshState(m) { return { v: 1, cells: Array(m).fill(-1), rejected: 0, hints: 0, status: 'playing', t0: null, tEnd: null }; }

export default function StandsClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.teams.length;
  const PAIRS = useMemo(() => pairsOf(N), [N]);
  const STORE_KEY = `sot_stands_${PUZZLE.num}`;
  const SOLUTION = useMemo(() => search(N, PAIRS, PUZZLE.clues, 2, true).first, [N, PAIRS, PUZZLE]);

  const [g, setG] = useState(() => freshState(PAIRS.length));
  const [verdict, setVerdict] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const pressTimer = useRef(null);
  const longFired = useRef(false);
  const [showChrome, setShowChrome] = useState(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('stands');
  const STAGE = isStage('stands', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('stands');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('stands'), '--stg-acc-lt': gameColorLight('stands'), '--stg-onramp-lt': gameOnrampLight('stands'), '--stg-acc-ink-lt': gameAccentInkLight('stands') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : THEME.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const filled = g.cells.filter((c) => c >= 0).length;
  const liveScore = Math.max(1, TOTAL - 3 * g.rejected - 2 * g.hints);
  const score = g.status === 'done' ? liveScore : 0;
  const won = g.status === 'done' && g.rejected === 0 && g.hints === 0;

  // the table as it stands, from whatever is filled in
  const standing = useMemo(() => {
    const t = PUZZLE.teams.map((name, i) => ({ i, name, p: 0, w: 0, d: 0, l: 0, pts: 0 }));
    PAIRS.forEach(([i,j],k) => {
      const r = g.cells[k];
      if (r < 0) return;
      t[i].p++; t[j].p++;
      if (r === 0) { t[i].w++; t[i].pts += 3; t[j].l++; }
      else if (r === 2) { t[j].w++; t[j].pts += 3; t[i].l++; }
      else { t[i].d++; t[j].d++; t[i].pts++; t[j].pts++; }
    });
    return t.slice().sort((a,b) => b.pts - a.pts || b.w - a.w || a.name.localeCompare(b.name));
  }, [g.cells, PAIRS, PUZZLE]);

  useEffect(() => {
    try { setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true); setMobileUi(isMobileDevice()); } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip); window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) { const saved = JSON.parse(raw); if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === PAIRS.length) setG({ ...freshState(PAIRS.length), ...saved }); }
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
        (function () { var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_stands_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_stands_day'); })();
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
    tick(); const iv = setInterval(tick, 1000); return () => clearInterval(iv);
  }, [g.status]);

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

  function say(msg) { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'stands', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'stands', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'stands', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'stands', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'stands', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_stands_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = filled > 0 || g.rejected > 0 || g.hints > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now()))/1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: g.rejected, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0)/1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: g2.rejected, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: g2.rejected, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  function startRun() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }

  function cycle(k) {
    if (!playing) return;
    setG((cur) => { const cells = cur.cells.slice(); cells[k] = cells[k] >= 2 ? -1 : cells[k] + 1; return { ...cur, cells, t0: cur.t0 || Date.now() }; });
    setVerdict(null);
  }
  // Cycle the (row i vs col j) cell from row i's own perspective: blank -> W -> D -> L.
  // Either triangle is editable; the opposite cell mirrors automatically.
  function cycleCell(i, j, dir) {
    if (!playing) return;
    const k = cellIndex(i, j);
    const home = PAIRS[k][0] === i;
    setG((cur) => {
      const cells = cur.cells.slice();
      const r = cells[k];
      const lab = r < 0 ? 'X' : r === 1 ? 'D' : (home === (r === 0)) ? 'W' : 'L';
      const fwd = { X: 'W', W: 'D', D: 'L', L: 'X' };
      const bwd = { X: 'L', L: 'D', D: 'W', W: 'X' };
      const nx = (dir < 0 ? bwd : fwd)[lab];
      const nr = nx === 'X' ? -1 : nx === 'D' ? 1 : nx === 'W' ? (home ? 0 : 2) : (home ? 2 : 0);
      cells[k] = nr;
      return { ...cur, cells, t0: cur.t0 || Date.now() };
    });
    setVerdict(null);
  }
  function cellPressDown(i, j) { longFired.current = false; clearTimeout(pressTimer.current); pressTimer.current = setTimeout(() => { longFired.current = true; cycleCell(i, j, -1); }, 450); }
  function cellPressUp() { clearTimeout(pressTimer.current); }
  function cellClick(i, j) { if (longFired.current) { longFired.current = false; return; } cycleCell(i, j, 1); }
  function clearAll() { if (!playing) return; setG((cur) => ({ ...cur, cells: Array(PAIRS.length).fill(-1) })); setVerdict(null); }

  function hint() {
    if (!playing || !SOLUTION) return;
    const wrong = PAIRS.map((_, k) => k).filter((k) => g.cells[k] !== SOLUTION[k]);
    if (!wrong.length) { say('Everything already matches.'); return; }
    const k = wrong[0];
    setG((cur) => { const cells = cur.cells.slice(); cells[k] = SOLUTION[k]; return { ...cur, cells, hints: cur.hints + 1, t0: cur.t0 || Date.now() }; });
    setVerdict({ msg: `${PUZZLE.teams[PAIRS[k][0]]} against ${PUZZLE.teams[PAIRS[k][1]]} filled in. (−2)` });
  }

  // Which clues does a full sheet break? A rejected sheet names the first one,
  // so a player who misread a clue learns which line to re-read instead of
  // being told a count of cells that "cannot have gone that way". This reads
  // only the player's own cells, never the solution.
  function brokenClues(cells) {
    const pts = Array(N).fill(0), wins = Array(N).fill(0), draws = Array(N).fill(0), losses = Array(N).fill(0);
    let totalDraws = 0;
    PAIRS.forEach(([i,j],k) => {
      const r = cells[k];
      if (r === 0) { pts[i] += 3; wins[i]++; losses[j]++; }
      else if (r === 2) { pts[j] += 3; wins[j]++; losses[i]++; }
      else if (r === 1) { pts[i]++; pts[j]++; draws[i]++; draws[j]++; totalDraws++; }
    });
    const idx = (x, y) => PAIRS.findIndex(([a,b]) => (a === x && b === y) || (a === y && b === x));
    return PUZZLE.clues.filter((c) => {
      switch (c.type) {
        case 'beat': { const k = idx(c.x, c.y); return cells[k] !== (PAIRS[k][0] === c.x ? 0 : 2); }
        case 'drew': return cells[idx(c.x, c.y)] !== 1;
        case 'points': return pts[c.x] !== c.p;
        case 'wins': return wins[c.x] !== c.n;
        case 'draws': return draws[c.x] !== c.n;
        case 'unbeaten': return losses[c.x] > 0;
        case 'winless': return wins[c.x] > 0;
        case 'above': return !(pts[c.x] > pts[c.y]);
        case 'totalDraws': return totalDraws !== c.n;
      }
      return false;
    });
  }

  function submit() {
    if (!playing || filled !== PAIRS.length || !SOLUTION) return;
    const wrong = PAIRS.map((_, k) => k).filter((k) => g.cells[k] !== SOLUTION[k]);
    if (!wrong.length) {
      const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now() };
      setG(g2); setVerdict(null); setEndClosed(false);
      postResult(g2, Math.max(1, TOTAL - 3 * g2.rejected - 2 * g2.hints));
    } else {
      setG((cur) => ({ ...cur, rejected: cur.rejected + 1 }));
      const broken = brokenClues(g.cells);
      const first = broken[0];
      const n = first ? PUZZLE.clues.indexOf(first) + 1 : 0;
      setVerdict({ msg: first
        ? <>That table breaks the record: fact {n}{broken.length > 1 ? ` and ${broken.length - 1} more` : ''} cannot hold. Fact {n}: {clueText(first)} (−3)</>
        : `That table breaks the record: ${wrong.length} match${wrong.length === 1 ? '' : 'es'} cannot have gone that way. (−3)` });
    }
  }
  function reveal() {
    if (!playing || !SOLUTION) return;
    setG((cur) => { const g2 = { ...cur, cells: SOLUTION.slice(), status: 'lost', tEnd: Date.now(), t0: cur.t0 || Date.now() }; postResult(g2, 0); return g2; });
    setVerdict(null); setEndClosed(false);
  }
  function resetGame() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} setG(freshState(PAIRS.length)); setVerdict(null); setEndClosed(false); }

  const T = PUZZLE.teams;
  function clueText(c) {
    switch (c.type) {
      case 'beat': return <><b>{T[c.x]}</b> beat <b>{T[c.y]}</b>.</>;
      case 'drew': return <><b>{T[c.x]}</b> and <b>{T[c.y]}</b> drew.</>;
      case 'points': return <><b>{T[c.x]}</b> finished on <b>{c.p}</b> point{c.p === 1 ? '' : 's'}.</>;
      case 'wins': return <><b>{T[c.x]}</b> won exactly <b>{c.n}</b> match{c.n === 1 ? '' : 'es'}.</>;
      case 'draws': return <><b>{T[c.x]}</b> drew exactly <b>{c.n}</b> match{c.n === 1 ? '' : 'es'}.</>;
      case 'unbeaten': return <><b>{T[c.x]}</b> went unbeaten.</>;
      case 'winless': return <><b>{T[c.x]}</b> never won.</>;
      // "Finished above" read as a table position, and a table position can be
      // a tiebreak. Two players in a row handed in sheets with the pair level on
      // points (2026-09-07 and 09-08, both rejected). The solver has always
      // meant strictly more points, so the clue now says so.
      case 'above': return <><b>{T[c.x]}</b> finished on <b>more points</b> than <b>{T[c.y]}</b>.</>;
      case 'totalDraws': return <>Exactly <b>{c.n}</b> of the {PAIRS.length} matches were drawn.</>;
    }
    return null;
  }
  const cellLabel = (k, row) => {
    const r = g.cells[k];
    if (r < 0) return '';
    const [i] = PAIRS[k];
    const homeWon = r === 0;
    if (r === 1) return 'D';
    return (row === i) === homeWon ? 'W' : 'L';
  };
  const cellIndex = (i, j) => PAIRS.findIndex(([a,b]) => (a === i && b === j) || (a === j && b === i));

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead="Rebuild the results sheet."
      chips={[
        { label: 'W = 3 points', tone: 'good', style: { padding: '6px 10px' } },
        { label: 'D = 1 point', tone: 'warn', style: { padding: '6px 10px' } },
        { label: 'L = 0', tone: 'bad', style: { padding: '6px 10px' } },
      ]}
      steps={[
        <>Every team played every other team once, so there are <b>{PAIRS.length} matches</b> to place.</>,
        <>Tap any cell in either half to cycle it: win, draw, loss, blank (long-press or right-click to step back). The opposite cell mirrors it.</>,
        <>The table under the grid recalculates as you go. Use it against the clues.</>,
        <>Fill every cell, then <b>hand in the sheet</b>.</>,
      ]}
      knack="points are the lever. A team on 7 from four matches can only be two wins and a draw, so one line of the table often fixes three results at once. Start with whichever team the clues pin hardest."
      footer="12 points, 3 off for each sheet handed in wrong, 2 for a nudge. Exactly one set of results fits the clues."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : THEME.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="stands" name="Stands" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="stands" quizId={PUZZLE.quizId}
          name="Stands"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: liveScore, k: 'score' },
            { v: g.rejected, k: 'rejected' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: g.rejected, k: 'rejected' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="bk-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.bk-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .bk-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .bk-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .bk-grid{border-collapse:separate;border-spacing:3px;font-family:${SANS};}
          .bk-grid th{font-size:10.5px;font-weight:800;color:${FADED};padding:2px 4px;text-align:left;white-space:nowrap;}
          .bk-grid th.col{writing-mode:vertical-rl;transform:rotate(180deg);height:64px;text-align:right;}
          .bk-cell{width:38px;height:34px;border-radius:7px;border: 1.5px solid var(--stg-line, rgba(28,30,36,0.18));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-family:${SANS};font-weight:800;font-size:13px;cursor:pointer;color:${INK};}
          .bk-cell.W{background:${COLORS.greenSoft};border-color:${COLORS.green};color:#14532d;}
          .bk-cell.D{background:${STAGE ? 'var(--stg-surf2)' : '#fef3c7'};border-color:#b45309;color:#78350f;}
          .bk-cell.L{background:${STAGE ? 'var(--stg-surf2)' : '#fee2e2'};border-color:#b91c1c;color:#7f1d1d;}
          .bk-cell.self{background:var(--stg-surf, ${COLORS.paper});border-color:transparent;cursor:default;}
          .bk-cell.mirror{cursor:default;opacity:0.72;}
          .bk-tbl{width:100%;border-collapse:collapse;font-family:${SANS};font-size:12.5px;}
          .bk-tbl th{font-family:${MONO};font-size:9.5px;letter-spacing:0.08em;text-transform:uppercase;color:${FADED};font-weight:500;text-align:right;padding:4px 6px;}
          .bk-tbl th:first-child{text-align:left;}
          .bk-tbl td{padding:5px 6px;text-align:right;font-weight:700;color:${INK};border-top:1px solid var(--stg-line, rgba(28,30,36,0.09));}
          .bk-tbl td:first-child{text-align:left;font-weight:800;}
          .bk-clue{display:flex;gap:9px;align-items:flex-start;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-left:3px solid var(--stg-acc, ${COLORS.accent});border-radius:8px;padding:8px 11px;margin-bottom:6px;font-size:13.5px;font-weight:600;color:${INK};}
        `}</style>

        <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="stands"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${THEME.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Six Clubs</span>}
          blocks={'STANDS'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 20, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: THEME.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

        {preStart && (
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px 22px', minHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The record is sealed'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N} clubs, {PAIRS.length} matches, and {PUZZLE.clues.length} surviving facts. Exactly one set of results fits them all.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="bk-btn" onClick={startRun} style={{ background: STAGE ? STAGE_C : THEME.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : THEME.white, fontSize: 15, padding: '11px 22px' }}>Open the record</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>{gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}</button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
              <span>filled <b style={{ color: INK, fontWeight: 500 }}>{filled}</b> of {PAIRS.length}</span>
              <span>on the board <b style={{ color: (g.rejected || g.hints) ? `var(--stg-bad, ${COLORS.rust})` : COLORS.green, fontWeight: 500 }}>{liveScore}</b>/{TOTAL}</span>
              {g.rejected > 0 && <span>rejected <b style={{ color: COLORS.rust, fontWeight: 500 }}>{g.rejected}</b></span>}
            </div>

            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, marginBottom: 7 }}>What survived</div>
            {PUZZLE.clues.map((c, i) => (
              <div key={i} className="bk-clue"><span style={{ fontFamily: MONO, fontSize: 11, color: FADED, flex: '0 0 auto' }}>{i+1}</span><span>{clueText(c)}</span></div>
            ))}

            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start', margin: '14px 0 6px' }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, marginBottom: 7 }}>The grid</div>
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED, marginBottom: 8, maxWidth: 330, lineHeight: 1.4 }}>Tap any cell to set that result: <b style={{ color: COLORS.green }}>W</b> {'\u2192'} <b style={{ color: COLORS.amber }}>D</b> {'\u2192'} <b style={{ color: COLORS.rust }}>L</b> {'\u2192'} blank. The opposite cell mirrors it. Long-press or right-click to step back.</div>
                <table className="bk-grid"><tbody>
                  <tr><th></th>{T.map((t, j) => <th key={j} className="col">{t}</th>)}</tr>
                  {T.map((t, i) => (
                    <tr key={i}>
                      <th>{t}</th>
                      {T.map((_, j) => {
                        if (i === j) return <td key={j}><div className="bk-cell self" /></td>;
                        const k = cellIndex(i, j);
                        const lab = cellLabel(k, i);
                        return (
                          <td key={j}>
                            <button type="button" className={`bk-cell${lab ? ' ' + lab : ''}`}
                              onClick={() => cellClick(i, j)}
                              onPointerDown={() => playing && cellPressDown(i, j)}
                              onPointerUp={cellPressUp} onPointerLeave={cellPressUp}
                              onContextMenu={(e) => { if (playing) { e.preventDefault(); cycleCell(i, j, -1); } }}
                              disabled={!playing} title={`${T[i]} v ${T[j]}: tap to cycle, long-press to step back`}>{lab}</button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody></table>
              </div>
              <div style={{ flex: '1 1 240px', minWidth: 230 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: FADED, marginBottom: 7 }}>The table as it stands</div>
                <table className="bk-tbl"><thead><tr><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead>
                  <tbody>{standing.map((r) => (
                    <tr key={r.i}><td>{r.name}</td><td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td style={{ fontWeight: 800 }}>{r.pts}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {verdict && <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: COLORS.rust, margin: '4px 0 8px', lineHeight: 1.45 }}>{verdict.msg}</div>}

        {started && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
            <button type="button" className="bk-btn" onClick={submit} disabled={filled !== PAIRS.length} style={filled === PAIRS.length ? { background: `var(--stg-acc, ${COLORS.accent})`, borderColor: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${THEME.white})` } : { opacity: 0.45, cursor: 'not-allowed' }}>
              <Table2 size={14} /> Hand in the sheet
            </button>
            <button type="button" className="bk-btn" onClick={hint} style={{ background: `color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 16%, transparent)`, borderColor: 'color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 45%, transparent)', color: ACC_DEEP_INK }}><Lightbulb size={14} /> Nudge (−2)</button>
            {filled > 0 && <button type="button" className="bk-btn" onClick={clearAll}><Eraser size={14} /> Clear</button>}
            {g.rejected >= 2 && <button type="button" className="bk-btn" style={{ borderColor: '#c3c8cf', color: FADED }} onClick={reveal}>Reveal (ends the day)</button>}
          </div>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <>
              <div style={{ maxWidth: 472, margin: '10px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: `var(--stg-surf, ${THEME.white})`, border: '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : g.status === 'done' ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-bad, ${COLORS.rust})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {g.status === 'done' ? (won ? <>Rebuilt clean, first sheet, no nudges.</> : <>Rebuilt after {g.rejected} rejected sheet{g.rejected === 1 ? '' : 's'}{g.hints ? ` and ${g.hints} nudge${g.hints === 1 ? '' : 's'}` : ''}.</>) : <>The record beat you. The true results are shown above.</>}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>{elapsed}</span>
                  </span>
                </div>
              </div>
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>{countdown ? <>A new season opens in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new season opens at midnight Eastern.'}
                    {prevPuzzle && <>{' '}Meanwhile: <a href={`/stands?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>yesterday&rsquo;s season &rarr;</a></>}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026','')} archive. <a href="/stands" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s season &rarr;</a>{' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a></>
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
              name="Stands"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${g.rejected} rejected \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Stands all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Rejects"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/stands?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Stands', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/stands?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="stands" name="Stands" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="stands" name="Stands" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="stands" maxWidth={640} challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`} share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light boardSlot={<DailyBoardPanel self="stands" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />} divider />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${THEME.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : THEME.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Stands to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b> &mdash; the tile opens today&apos;s season, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s season, every day.</p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: THEME.white, cursor: 'pointer' }}>Got it</button>
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

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard modal self="stands" won={g.status === 'done'}
          headline={g.status === 'done' ? <>The season is reconstructed</> : <>The record kept its secret</>}
          subline={<>Stands #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {g.rejected} rejected &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'} onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: THEME.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
      )}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="bk-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: THEME.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ display: (focusMode && !STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Stands</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Stands is a free daily logic puzzle from Mind Loft. A small league played a full round robin, the results sheet was lost, and a handful of facts survive: a points total here, an unbeaten run there, one remembered result. Rebuild every match.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          No sport knowledge is needed and the clubs are invented. The reasoning is arithmetic under constraint: three points a win and one a draw means a points total is a tight little equation, and one solved row usually forces the next. Every board is generated with a constraint solver and machine-verified to admit exactly one table, from a clue set trimmed until nothing in it is redundant.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new season opens every day at midnight Eastern, with a sixth club on Sundays. More dailies: <a href="/venn" style={{ color: INK, fontWeight: 800 }}>Venn</a>, our three-circle sorting puzzle, <a href="/alibi" style={{ color: INK, fontWeight: 800 }}>Alibi</a>, our nightly whodunit, and <a href="/tally" style={{ color: INK, fontWeight: 800 }}>Tally</a>, our number ledger.
        </p>
      </section>
      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>}
    </div>
  );

  function copyShare() {
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const solvedBit = g.status === 'done'
      ? (won ? `\u{1F3C6} Rebuilt clean in ${elapsed}` : `\u{1F3C6} Rebuilt in ${elapsed} · ${g.rejected} rejected${g.hints ? ` · ${g.hints} nudge${g.hints === 1 ? '' : 's'}` : ''}`)
      : g.status === 'lost' ? '\u{1F3C6} The record won' : '\u{1F3C6} Still reconstructing…';
    const text = playing
      ? `Stands #${PUZZLE.num} — the daily results-table reconstruction from Mind Loft.\n${withRef(`mindloftdaily.com/stands${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Stands — Season #${PUZZLE.num}\n${solvedBit}${streakBit}\n${withRef(`mindloftdaily.com/stands${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }
}
