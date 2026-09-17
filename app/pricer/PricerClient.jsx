'use client';

// Pricer — the daily price bracket.
//
// Sixteen real things from ONE category, one money question for the whole day,
// and every pick propagates. There is NO feedback while you play: you fill the
// whole bracket blind, exactly like a pool sheet, and one wrong call in the
// first round poisons every line it touches. All fifteen truths land at once.
//
// Forked from app/bracket/BracketClient.jsx, deliberately as a fork and not a
// refactor: the bracket engine, the flight animation, the scoring and the
// result posting are byte-identical to Bracket's, which is well tested. What
// Pricer adds is the 'usd' formatter, the category eyebrow, and the Amazon
// shop links on the reveal.
//
// The client never receives the answers. Every item ships with its real price,
// and the browser recomputes each matchup, the same way
// scripts/verify-pricer.mjs proves the bank.
//
// Scoring is a pool: 1 a pick in the first round, 2 in the quarters, 4 in the
// semis, 8 for the final, so every round is worth the same 8 and the maximum is
// 32. A later pick only scores if the thing you advanced is the true winner of
// that slot. Sundays run 32 items over five rounds for 80.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Smartphone, Trophy, Eraser } from 'lucide-react';
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
import PricerRolodex from './PricerRolodex';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted,
  accent: '#15803d', accentSoft: '#dcfce7', accentDeep: '#14532d', green: T.successDeep, greenSoft: '#dcfce7',
  redSoft: '#fee2e2', redInk: '#b91c1c', gold: '#b45309',
  // The bracket's own rule colour. T.border (#e5e7eb) is a hairline meant to sit
  // under text; drawn as a brace or a connector on the #f7f8fa ground it vanishes,
  // so every structural line in this game uses this instead.
  line: '#b9c3d1',
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_pricer_help_seen';
const STATS_KEY = 'sot_pricer_stats';

const ROUND_NAME = (r, rounds) => {
  const left = rounds - r;
  if (left === 1) return 'Final';
  if (left === 2) return 'Semis';
  if (left === 3) return 'Quarters';
  if (left === 4) return 'Round of 16';
  return 'Round of 32';
};
// Pricer only ever ships 'usd', but the whole unit table is kept from Bracket so
// the two clients stay diffable and a future non-money Pricer variant is one
// data change rather than a code change.
function fmtValue(v, unit) {
  // 'usdc' is an integer number of CENTS. Cheap single-source boards (menus,
  // transit fares, subscription tiers) sit in a band where whole dollars collide
  // constantly, and a tie makes a matchup unanswerable. Cents are shown only when
  // the figure actually has them, so $40.00 renders as $40.
  if (unit === 'usdc') return '$' + (v / 100).toLocaleString('en-US', { minimumFractionDigits: v % 100 ? 2 : 0, maximumFractionDigits: 2 });
  if (unit === 'usd') return '$' + Math.round(v).toLocaleString('en-US');
  if (unit === 'km2') return v.toLocaleString('en-US') + ' km²';
  if (unit === 'm') return v.toLocaleString('en-US') + ' m';
  if (unit === 'usdm') return v >= 1000 ? '$' + (v / 1000).toFixed(2) + 'B' : '$' + v + 'M';
  if (unit === 'lat') return Math.abs(v).toFixed(1) + '° ' + (v >= 0 ? 'N' : 'S');
  if (unit === 'km') return v.toLocaleString('en-US') + ' km';
  if (unit === 'people') return v.toLocaleString('en-US');
  if (unit === 'seats') return v.toLocaleString('en-US') + ' seats';
  if (unit === 'hr') return v.toLocaleString('en-US') + ' HR';
  if (unit === 'k') return v.toLocaleString('en-US') + ' K';
  if (unit === 'yards') return v.toLocaleString('en-US') + ' yds';
  if (unit === 'golds') return v.toLocaleString('en-US') + ' golds';
  return String(v);
}


// What the day's prices actually are. ONE basis per board, never mixed: a board
// that mixed list price with street price had its whole ordering inverted.
const BASIS_LABEL = { msrp: 'manufacturer list price', street: 'current retail price', rate: 'published rate', delivery: 'delivery menu price' };
const isIosDevice = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
function etToday() { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return new Date().toISOString().slice(0,10); } }
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length-1] : puzzles[0];
}
function fmtTime(ms) { const s = Math.max(0, Math.round(ms/1000)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
// The tiebreaker guess, parsed into CENTS to match the board's own unit. The player
// types DOLLARS, so "400" is 40000 and "12.50" is 1250.
//
// This is not a rounding nit. The returned value is diffed straight against
// CHAMPION_VALUE and rendered through fmtValue, both of which are in cents, so
// returning dollars reported a $400 guess on a $400 champion as off by $396 and
// printed it as "$4.00". Cents also have to be typeable: half the bank is menus and
// fares where the answer is $2.39, and a whole-dollar guess cannot break a tie there.
//
// Digits are taken from whatever was typed so a pasted "$1,200.99" reads cleanly, and
// only the FIRST decimal point survives so "12.3.4" cannot produce NaN. Returns null
// for anything unusable, which is the same value a deliberate Skip stores.
function parsePriceGuess(raw) {
  if (raw == null) return null;
  let s = String(raw).replace(/[^0-9.]/g, '');
  if (!s) return null;
  const dot = s.indexOf('.');
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
  const dollars = Number(s);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  const cents = Math.round(dollars * 100);
  return Number.isFinite(cents) ? cents : null;
}
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
function mergeServerStats(s, recent, puzzles, total) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {}; for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.round(((m.scorePct || 0)/100) * total));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: total, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function freshState(m) { return { v: 1, picks: Array(m).fill(-1), status: 'playing', t0: null, tEnd: null }; }

export default function PricerClient({ puzzles = [], forceNum = null, preview = false }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.items.length;
  const ROUNDS = Math.log2(N);
  const MATCHES = N - 1;
  const TOTAL = (N / 2) * ROUNDS;                    // 32 on a weekday, 80 on Sunday
  const STORE_KEY = `sot_pricer_${PUZZLE.num}`;

  // matchup ids are laid out round by round: round 0 first, then round 1, ...
  const OFFSET = useMemo(() => { const o = []; let acc = 0, w = N / 2; for (let r = 0; r < ROUNDS; r++) { o.push(acc); acc += w; w /= 2; } return o; }, [N, ROUNDS]);
  const idOf = (r, m) => OFFSET[r] + m;
  const roundOf = (id) => { let r = 0; while (r + 1 < ROUNDS && id >= OFFSET[r + 1]) r++; return r; };
  const matchOf = (id) => id - OFFSET[roundOf(id)];

  const [g, setG] = useState(() => freshState(MATCHES));
  // The board is a bracket zoomed all the way in: one matchup holds the middle,
  // the slot it feeds sits to the right, and the winner travels into it. `cursor`
  // is the matchup on screen; `reviewing` swaps the arena for the whole sheet.
  const [cursor, setCursor] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const arenaRef = useRef(null);
  const busyRef = useRef(false);   // a ref, not state: the flight must not re-render
  // The pick is committed by a timer at the end of the flight. If that timer never
  // fires the board would lock forever, which is a real risk: a backgrounded or
  // suspended tab throttles timers hard, and iOS suspends them outright. So the
  // commit is held here and can be flushed early by the next click or by coming
  // back to the tab. A pick is NEVER allowed to depend on an animation completing.
  const pendingRef = useRef(null);
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
  // Score ties are broken by how close the player guessed the champion's real
  // figure, so a finished sheet is handed in THROUGH the guess panel rather than
  // straight off the review sheet. This is only the field's controlled text; the
  // committed number lives on `g.pg` so it survives a reload of a finished board.
  const [priceGuessInput, setPriceGuessInput] = useState('');
  const [priceGuessSubmitted, setPriceGuessSubmitted] = useState(false);
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
  const [showChrome, setShowChrome] = useState(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('pricer');
  const STAGE = isStage('pricer', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('pricer');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('pricer'), '--stg-acc-lt': gameColorLight('pricer'), '--stg-onramp-lt': gameOnrampLight('pricer'), '--stg-acc-ink-lt': gameAccentInkLight('pricer') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;

  // the truth, recomputed rather than shipped
  const TRUE = useMemo(() => {
    const better = (a, b) => (PUZZLE.dir === 'max' ? PUZZLE.items[a].value > PUZZLE.items[b].value : PUZZLE.items[a].value < PUZZLE.items[b].value) ? a : b;
    const out = Array(MATCHES).fill(-1);
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      for (let m = 0; m < w; m++) {
        const kids = r === 0 ? [2 * m, 2 * m + 1] : [out[idOf(r - 1, 2 * m)], out[idOf(r - 1, 2 * m + 1)]];
        out[idOf(r, m)] = better(kids[0], kids[1]);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PUZZLE, N, ROUNDS, MATCHES]);

  // The champion's real figure, which the tiebreaker measures the guess against.
  // Read straight off the field rather than from `champion` below: single
  // elimination on a total order just picks the global extreme, so the two can
  // never disagree, and this one is available everywhere in the component.
  const CHAMPION_VALUE = useMemo(() => {
    const vals = PUZZLE.items.map((i) => i.value);
    return PUZZLE.dir === 'min' ? Math.min(...vals) : Math.max(...vals);
  }, [PUZZLE]);
  // A `min` board's winner is the CHEAPEST item, so the prompt has to follow the
  // direction of the day's question or it asks for the wrong end of the field.
  const GUESS_Q = PUZZLE.dir === 'min'
    ? 'What does the cheapest one cost?'
    : 'What does the most expensive one cost?';

  // what the player's sheet says is in each slot
  const kidsOf = (r, m) => (r === 0 ? [2 * m, 2 * m + 1] : [g.picks[idOf(r - 1, 2 * m)], g.picks[idOf(r - 1, 2 * m + 1)]]);
  const filled = g.picks.filter((p) => p >= 0).length;
  const complete = filled === MATCHES;

  // A matchup can only be played once both of its feeders are decided.
  const feedersOf = (id, arr) => { const r = roundOf(id), m = matchOf(id); return r === 0 ? [2 * m, 2 * m + 1] : [arr[idOf(r - 1, 2 * m)], arr[idOf(r - 1, 2 * m + 1)]]; };
  const playableAt = (id, arr) => { const k = feedersOf(id, arr || g.picks); return k[0] >= 0 && k[1] >= 0; };
  // The next matchup that is empty AND playable, scanning forward from `from` and
  // wrapping, so a jump back to fix an early call resumes wherever the gap is.
  function nextOpen(from, arr) {
    for (let i = 0; i < MATCHES; i++) {
      const j = (from + 1 + i + MATCHES) % MATCHES;
      if (arr[j] < 0 && playableAt(j, arr)) return j;
    }
    return -1;
  }
  // Everything this contender has already beaten ON YOUR SHEET, oldest first. This
  // is what makes propagation visible while you play instead of only at the reveal.
  function pathOf(item, r, m) {
    const out = [];
    if (r <= 0 || item == null || item < 0) return out;
    let cur = item, cr = r - 1, cm = -1;
    for (const fm of [2 * m, 2 * m + 1]) if (g.picks[idOf(cr, fm)] === cur) cm = fm;
    while (cr >= 0 && cm >= 0) {
      const k = kidsOf(cr, cm);
      const other = k[0] === cur ? k[1] : k[0];
      // carry the matchup id too, so the chip can send you back to that game
      if (other >= 0) out.unshift({ name: PUZZLE.items[other].name, id: idOf(cr, cm) });
      if (cr === 0) break;
      let nm = -1;
      for (const fm of [2 * cm, 2 * cm + 1]) if (g.picks[idOf(cr - 1, fm)] === cur) nm = fm;
      cr--; cm = nm;
    }
    return out;
  }
  const score = useMemo(() => {
    let s = 0;
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      for (let m = 0; m < w; m++) if (g.picks[idOf(r, m)] >= 0 && g.picks[idOf(r, m)] === TRUE[idOf(r, m)]) s += Math.pow(2, r);
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.picks, TRUE, N, ROUNDS]);
  const perRound = useMemo(() => {
    const out = [];
    for (let r = 0; r < ROUNDS; r++) {
      const w = N / Math.pow(2, r + 1);
      let hit = 0;
      for (let m = 0; m < w; m++) if (g.picks[idOf(r, m)] === TRUE[idOf(r, m)]) hit++;
      out.push([hit, w]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.picks, TRUE, N, ROUNDS]);
  const won = g.status === 'done' && score === TOTAL;

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
      if (raw) { const saved = JSON.parse(raw); if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length === MATCHES) setG({ ...freshState(MATCHES), ...saved }); }
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Resuming a half-filled sheet drops you back on the first gap, not on match one.
  useEffect(() => {
    if (!hydrated) return;
    const first = nextOpen(-1, g.picks);
    if (first < 0) { if (g.status === 'playing' && g.picks.every((p) => p >= 0)) setReviewing(true); }
    else setCursor(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function () { var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_pricer_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_pricer_day'); })();
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
          if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles, TOTAL));
          if (d && d.found && d.name) setPlayer({ name: d.name, rank: (d.ranks && d.ranks.xp) || d.rank || null, key: d.userKey || null });
        }).catch(() => {});
      }
    } catch (e) {}
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    if (!viewedRef.current) { viewedRef.current = true; fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coming back to a tab that was throttled mid-flight lands the pick at once, so a
  // player never returns to a board that looks stuck. Also runs on unmount.
  useEffect(() => {
    const onVis = () => { if (!document.hidden) flushPending(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pageshow', onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function say(msg) { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'pricer', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'pricer', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'pricer', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'pricer', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'pricer', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_pricer_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (filled === 0 || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now()))/1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: TOTAL, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc, priceTiebreak) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0)/1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: null, won: sc === TOTAL })); } catch (e) {}
    if (preview) return; // preview mode — don't record results
    try {
      fetch('/api/quiz/result', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc === TOTAL ? 1 : 0, guessesUsed: 0, timeElapsed: el, priceTiebreak: priceTiebreak ?? null, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  function startRun() { setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() })); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }

  // picking a winner clears everything that used to flow out of this slot
  function applyPick(id, item, from) {
    const picks = from.slice();
    picks[id] = item;
    let rr = roundOf(id) + 1, mm = Math.floor(matchOf(id) / 2);
    while (rr < ROUNDS) {
      const nid = idOf(rr, mm);
      const kidsNow = [picks[idOf(rr - 1, 2 * mm)], picks[idOf(rr - 1, 2 * mm + 1)]];
      if (picks[nid] >= 0 && !kidsNow.includes(picks[nid])) picks[nid] = -1;
      rr++; mm = Math.floor(mm / 2);
    }
    return picks;
  }

  // Tap a contender and it physically advances: the loser dims, the winner lifts out
  // of the stack and travels across the brace into the slot it just won, then the
  // field shifts to the next matchup. The flight is imperative DOM on purpose, so no
  // React state changes mid-animation and nothing re-renders the arena underneath it.
  function commitPick(id, item, picks) {
    // Undo the imperative marks before React sees new state. The arena is keyed on
    // `cursor` so it remounts anyway, but a pick that lands on the SAME cursor (the
    // last one, or a jump back) would otherwise keep a hidden card or a green
    // landing row from the previous flight. That is exactly what froze the board.
    const arena = arenaRef.current;
    if (arena) {
      arena.querySelectorAll('.pr-flyer').forEach((f) => f.remove());
      arena.querySelectorAll('[data-pr-card]').forEach((c) => { c.classList.remove('won', 'out'); c.style.visibility = ''; });
      arena.querySelectorAll('.pr-nrow.landing').forEach((n) => n.classList.remove('landing'));
    }
    pendingRef.current = null;
    setG((cur) => ({ ...cur, picks, t0: cur.t0 || Date.now() }));
    const nx = nextOpen(id, picks);
    if (nx < 0) setReviewing(true); else setCursor(nx);
    busyRef.current = false;
  }
  function flushPending() {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    if (p.timer) window.clearTimeout(p.timer);
    commitPick(p.id, p.item, p.picks);
  }
  function pick(id, item, cardEl) {
    if (!playing || item == null || item < 0) return;
    // A tap during a flight lands the flight at once and is then swallowed: the card
    // that was tapped belonged to the matchup being left, so applying it would write
    // the pick to the wrong slot. The board advances, which is what the tap wanted.
    if (busyRef.current) { flushPending(); return; }
    busyRef.current = true;
    const picks = applyPick(id, item, g.picks);

    const arena = arenaRef.current;
    const dest = arena && arena.querySelector('[data-pr-target]');
    let reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!arena || !dest || !cardEl || reduced) { commitPick(id, item, picks); return; }
    pendingRef.current = { id, item, picks, timer: null };

    arena.querySelectorAll('[data-pr-card]').forEach((c) => c.classList.add(c === cardEl ? 'won' : 'out'));
    const ab = arena.getBoundingClientRect(), sb = cardEl.getBoundingClientRect(), db = dest.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'pr-flyer';
    fly.textContent = PUZZLE.items[item].name;
    fly.style.left = (sb.left - ab.left) + 'px'; fly.style.top = (sb.top - ab.top) + 'px';
    fly.style.width = sb.width + 'px'; fly.style.height = sb.height + 'px';
    fly.style.fontSize = (mobileUi ? 15 : 18) + 'px';
    arena.appendChild(fly);
    fly.getBoundingClientRect();                       // force the start frame
    window.setTimeout(() => {
      cardEl.style.visibility = 'hidden';
      fly.style.left = (db.left - ab.left) + 'px'; fly.style.top = (db.top - ab.top) + 'px';
      fly.style.width = db.width + 'px'; fly.style.height = db.height + 'px';
      fly.style.fontSize = (mobileUi ? 10 : 11.5) + 'px';
      dest.classList.add('landing');
    }, 170);
    pendingRef.current.timer = window.setTimeout(() => flushPending(), 760);
  }
  function jumpTo(id) {
    if (!playing) return;
    if (busyRef.current) flushPending();
    if (busyRef.current || !playableAt(id)) return;
    setReviewing(false); setCursor(id);
  }
  function clearAll() { if (!playing) return; setG((cur) => ({ ...cur, picks: Array(MATCHES).fill(-1) })); setReviewing(false); setCursor(0); }
  // `guess` is the committed price guess, or null for a skip. Typed-checked
  // rather than trusted: submit used to be wired straight to onClick, and a
  // stray `onClick={submit}` would otherwise hand a click Event to the math.
  function submit(guess) {
    if (!playing || !complete) return;
    const pg = typeof guess === 'number' && Number.isFinite(guess) ? guess : null;
    // Kept on the game state so a reload of a finished board still reports the
    // guess. Older saves simply lack `pg` and report nothing, as before.
    const g2 = { ...g, status: 'done', tEnd: Date.now(), t0: g.t0 || Date.now(), pg };
    setG(g2); setEndClosed(false); setReviewing(false);
    let s = 0;
    for (let r = 0; r < ROUNDS; r++) { const w = N / Math.pow(2, r + 1); for (let m = 0; m < w; m++) if (g2.picks[idOf(r, m)] === TRUE[idOf(r, m)]) s += Math.pow(2, r); }
    // How far the guess landed from the champion's real figure. null when the
    // player skipped, which sorts behind every real guess on the leaderboard.
    postResult(g2, s, pg != null ? Math.abs(pg - CHAMPION_VALUE) : null);
  }
  // The hand-in path. Both buttons on the tiebreaker panel come through here, so
  // every completed run carries either a guess or an explicit skip.
  function handPriceGuess(skip) {
    if (!playing || !complete || priceGuessSubmitted) return;
    const n = skip ? null : parsePriceGuess(priceGuessInput);
    if (skip) setPriceGuessInput('');
    setPriceGuessSubmitted(true);
    submit(n);
  }
  function resetGame() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} setG(freshState(MATCHES)); setEndClosed(false); setReviewing(false); setCursor(0); setPriceGuessInput(''); setPriceGuessSubmitted(false); busyRef.current = false; }

  function prevPlayable(from) { for (let j = from - 1; j >= 0; j--) if (playableAt(j)) return j; return -1; }

  // ---- the whole sheet, drawn as a real bracket. `showTruth` grades it. ----
  function sheetRows(r, m, showTruth) {
    const id = idOf(r, m);
    const kids = showTruth
      ? (r === 0 ? [2 * m, 2 * m + 1] : [TRUE[idOf(r - 1, 2 * m)], TRUE[idOf(r - 1, 2 * m + 1)]])
      : kidsOf(r, m);
    return kids.map((it, k) => {
      if (it == null || it < 0) return <div key={k} className="pr-trow lose"><span className="mk" /><span className="n">&mdash;</span></div>;
      let cls = 'pr-trow', mk = '';
      if (showTruth) {
        const isTrue = it === TRUE[id], isMine = g.picks[id] === it;
        if (isTrue) { cls += ' win'; mk = isMine ? '✓' : ''; }
        else if (isMine) { cls += ' bust'; mk = '✗'; }
        else cls += ' lose';
      } else cls += g.picks[id] === it ? ' mine' : ' lose';
      return (
        <div key={k} className={cls}>
          <span className="mk">{mk}</span>
          <span className="n">{PUZZLE.items[it].name}</span>
          {showTruth && <span className="v">{fmtValue(PUZZLE.items[it].value, PUZZLE.unit)}</span>}
        </div>
      );
    });
  }
  // On the review sheet every matchup is a way back into that game. On the reveal
  // it is not: the sheet is handed in and nothing can move.
  function boxProps(r, m, showTruth) {
    const id = idOf(r, m);
    if (showTruth || !playing || !playableAt(id)) return { className: 'pr-tbox' };
    return {
      className: 'pr-tbox jump', role: 'button', tabIndex: 0,
      title: `Back to ${ROUND_NAME(r, ROUNDS)} match ${m + 1}`,
      onClick: () => jumpTo(id),
      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpTo(id); } },
    };
  }
  function renderTree(showTruth) {
    const ci = showTruth ? TRUE[MATCHES - 1] : g.picks[MATCHES - 1];
    return (
      <div className="pr-tree">
        {Array.from({ length: ROUNDS }).map((_, r) => (
          <div key={r} className={'pr-tround' + (r === 0 ? ' first' : '')}>
            <div className="pr-trh">{ROUND_NAME(r, ROUNDS)}</div>
            <div className="pr-tbody">
              {Array.from({ length: N / Math.pow(2, r + 1) }).map((__, m) => (
                <div key={m} className="pr-tmatch"><div {...boxProps(r, m, showTruth)}>{sheetRows(r, m, showTruth)}</div></div>
              ))}
            </div>
          </div>
        ))}
        <div className="pr-tchamp">
          <div className="pr-trh">{showTruth ? 'Champion' : 'Your winner'}</div>
          <div className="pr-champ">
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.gold }}>{showTruth ? 'Takes the field' : 'You picked'}</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginTop: 4, lineHeight: 1.15, color: INK }}>{ci >= 0 ? PUZZLE.items[ci].name : '—'}</div>
            {showTruth && ci >= 0 && <div style={{ fontFamily: MONO, fontSize: 12, color: FADED, marginTop: 5 }}>{fmtValue(PUZZLE.items[ci].value, PUZZLE.unit)}</div>}
          </div>
        </div>
      </div>
    );
  }
  function renderStack(showTruth) {
    return (
      <div className="pr-stack">
        {Array.from({ length: ROUNDS }).map((_, r) => (
          <div key={r}>
            <div className="pr-srh">{ROUND_NAME(r, ROUNDS)}{showTruth ? ` · ${perRound[r][0]}/${perRound[r][1]}` : ''}</div>
            {Array.from({ length: N / Math.pow(2, r + 1) }).map((__, m) => (
              <div key={m} {...boxProps(r, m, showTruth)}>{sheetRows(r, m, showTruth)}</div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  function renderMap(showTruth) {
    return (
      <div className="pr-map" style={{ ['--pr-cell']: (N <= 16 ? 26 : 15) + 'px' }}>
        {Array.from({ length: ROUNDS }).map((_, r) => (
          <div key={r} className="pr-mapcol">
            {Array.from({ length: N / Math.pow(2, r + 1) }).map((__, m) => {
              const id = idOf(r, m);
              let cls = 'pr-dot';
              if (showTruth) cls += g.picks[id] === TRUE[id] ? ' hit' : ' miss';
              else {
                if (g.picks[id] >= 0) cls += ' done';
                if (id === cursor && !reviewing) cls += ' cur';
              }
              return (
                <div key={m} className="pr-mapcell">
                  <button type="button" className={cls} disabled={showTruth || !playableAt(id)}
                    onClick={() => jumpTo(id)} aria-label={`${ROUND_NAME(r, ROUNDS)} match ${m + 1}`} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  const champion = PUZZLE.items[TRUE[MATCHES - 1]];
  // The committed guess for this board (null when skipped or never asked), and
  // how far off it landed. Read from the game state so it survives a reload.
  const priceGuessNum = typeof g.pg === 'number' && Number.isFinite(g.pg) ? g.pg : null;
  const priceOff = priceGuessNum != null ? Math.abs(priceGuessNum - CHAMPION_VALUE) : null;
  // The top three by price, for the shop strip on the reveal. Only the items
  // that actually carry an ASIN show up, so the strip disappears entirely on a
  // board with none (which is every board at launch).
  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
      lead={`Fill the bracket. One money question, ${N} price tags.`}
      banner={`${PUZZLE.category} · ${PUZZLE.metric}`}
      sub={PUZZLE.gathered ? (
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: FADED, fontWeight: 500 }}>
          Prices checked {PUZZLE.gathered} · {BASIS_LABEL[PUZZLE.basis] || PUZZLE.basis}
        </span>
      ) : null}
      steps={[
        <>Every matchup asks the same question. Tap the one you think wins.</>,
        <>Your winners <b>carry forward</b>, so later rounds are made of your own picks.</>,
        <>You get <b>no feedback</b> until the end. Fill all {MATCHES} and hand it in.</>,
        <>Everything reveals at once, with the real price under every name.</>,
      ]}
      knack="the field is sorted by price before it is drawn, so the first round is deliberately lopsided and the true final is the two closest price tags on the board. Getting round one right is not the puzzle. The puzzle is that a single bad call in round one takes every later pick down with it, exactly like a busted Final Four."
      footer={`Pool scoring: 1 a pick in the first round, 2 in the quarters, 4 in the semis, 8 for the final. Every round is worth ${N / 2}, so ${TOTAL} is perfect. A later pick only counts if the thing you advanced really did win that slot.`}
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
      <DailyChrome slug="pricer" name="Pricer" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="pricer" quizId={PUZZLE.quizId}
          name="Pricer"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${TOTAL}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      {preview && (
        <div style={{ background: STAGE ? 'var(--stg-surf2)' : '#fef9c3', borderBottom: '2px solid #ca8a04', padding: '10px 24px', textAlign: 'center', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: '#92400e', letterSpacing: '.02em' }}>
          🔍 PREVIEW MODE — this play is not recorded and won't appear on the leaderboard
        </div>
      )}
      <div className="pr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 24px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.pr-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .pr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pr-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          /* ---- the arena: a bracket zoomed all the way in ---- */
          .pr-arena{position:relative;display:grid;grid-template-columns:150px minmax(0,1fr) 172px;gap:0 20px;align-items:stretch;
                    background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid ${COLORS.line};border-radius:12px;padding:13px 15px;overflow:hidden;}
          .pr-lane{position:relative;display:flex;flex-direction:column;justify-content:center;min-width:0;padding-top:12px;}
          .pr-lanehd{position:absolute;top:-2px;left:0;right:0;font-family:${MONO};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:#9aa5b4;}
          .pr-hist{gap:10px;}
          .pr-hist .pr-hgroup{flex:1;min-height:54px;display:flex;flex-direction:column;justify-content:center;gap:4px;}
          .pr-hchip{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;width:100%;text-align:left;font-family:${SANS};background:none;border:1px dashed ${COLORS.line};
                    border-radius:5px;padding:3px 6px;font-size:10px;font-weight:700;color:#a3adbb;cursor:pointer;
                    text-decoration:line-through;line-height:1.25;overflow:hidden;transition:.12s;}
          .pr-hchip:hover{border-style:solid;border-color:var(--stg-acc, ${COLORS.accent});color:${COLORS.accentDeep};background:${COLORS.accentSoft};text-decoration:none;}
          .pr-hempty{font-family:${MONO};font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#a9b3c1;line-height:1.6;}
          .pr-bout{gap:10px;padding-right:14px;}
          .pr-bout::after{content:'';position:absolute;right:0;top:25%;height:50%;width:14px;border-right:2px solid ${COLORS.line};
                          border-top:2px solid ${COLORS.line};border-bottom:2px solid ${COLORS.line};border-radius:0 8px 8px 0;}
          .pr-card{position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};
                   border:2px solid ${COLORS.line};border-radius:9px;padding:9px 13px;cursor:pointer;min-height:54px;text-align:left;width:100%;
                   font-family:${SANS};transition:border-color .12s,background .12s,transform .12s,box-shadow .12s,opacity .25s;}
          .pr-card:hover:not(:disabled){border-color:var(--stg-acc, ${COLORS.accent});background:${STAGE ? 'var(--stg-surf2)' : '#f5fdf7'};transform:translateX(4px);box-shadow:0 6px 16px rgba(21,128,61,.13);}
          .pr-card .nm{font-size:18px;font-weight:900;line-height:1.15;letter-spacing:-.015em;color:${INK};}
          .pr-card .sub{margin-top:3px;font-family:${MONO};font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;}
          .pr-card.won{border-color:var(--stg-acc, ${COLORS.accent});background:${COLORS.accentSoft};box-shadow:inset 0 0 0 2px ${COLORS.accent};transform:translateX(8px);}
          .pr-card.out{opacity:.28;transform:translateX(-6px);}
          .pr-card.wait{cursor:default;border-style:dashed;background:${COLORS.cream};}
          .pr-card.wait .nm{font-size:12.5px;color:#a3adbb;font-weight:700;}
          .pr-vs{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;background:${COLORS.cream};
                 border:1px solid ${COLORS.line};border-radius:999px;font-family:${MONO};font-size:9.5px;letter-spacing:.1em;
                 color:#7c8798;padding:2px 9px;pointer-events:none;}
          .pr-nextbox{border:1.5px solid ${COLORS.accent};border-radius:8px;background:${COLORS.cream};overflow:hidden;}
          .pr-nrow{display:flex;align-items:center;min-height:27px;padding:4px 8px;font-size:11.5px;font-weight:800;line-height:1.2;
                   border-bottom:1px solid ${COLORS.line};color:#a9b3c1;transition:background .3s,color .3s;}
          .pr-nrow:last-child{border-bottom:none;}
          .pr-nrow.filled{color:${INK};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .pr-nrow.target{box-shadow:inset 3px 0 0 ${COLORS.accent};}
          .pr-nrow.landing{background:${COLORS.accentSoft};color:${COLORS.accentDeep};}
          .pr-trophy{border:1.5px solid ${COLORS.gold};background:${STAGE ? 'var(--stg-surf2)' : '#fffbeb'};border-radius:8px;padding:8px 8px;text-align:center;}
          .pr-trophy .lbl{font-family:${MONO};font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.gold};}
          .pr-flyer{position:absolute;z-index:9;background:${COLORS.accentSoft};border:2px solid ${COLORS.accent};border-radius:9px;
                    display:flex;align-items:center;padding:0 10px;font-weight:900;color:${COLORS.accentDeep};overflow:hidden;white-space:nowrap;
                    transition:all .46s cubic-bezier(.5,0,.2,1);pointer-events:none;}
          .pr-roundtag{text-align:center;font-family:${MONO};font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:${FADED};margin:0 0 7px;}
          .pr-roundtag b{color:${COLORS.accentDeep};font-weight:500;}
          /* ---- the draw strip: the whole field, and the way back to any pick ---- */
          .pr-map{display:flex;gap:10px;align-items:stretch;}
          .pr-mapcol{display:flex;flex-direction:column;justify-content:space-around;flex:1;}
          .pr-mapcell{position:relative;flex:1;display:flex;align-items:stretch;min-height:var(--pr-cell,26px);}
          .pr-dot{flex:1;position:relative;background:none;border:none;padding:0;cursor:pointer;border-radius:4px;}
          .pr-dot::before{content:'';position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);height:10px;border-radius:3px;
                          border:1.5px solid ${COLORS.line};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};transition:.12s;}
          .pr-dot:hover:not(:disabled)::before{border-color:var(--stg-acc, ${COLORS.accent});height:13px;}
          .pr-dot:focus-visible{outline:2px solid ${COLORS.accent};outline-offset:1px;}
          .pr-dot.done::before{background:${COLORS.accent};border-color:var(--stg-acc, ${COLORS.accent});}
          .pr-dot.cur::before{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 3px rgba(21,128,61,.22);background:${COLORS.accentSoft};height:13px;}
          .pr-dot:disabled{cursor:default;}
          .pr-dot:disabled::before{opacity:.32;}
          .pr-dot.hit::before{background:${COLORS.green};border-color:${COLORS.green};}
          .pr-dot.miss::before{background:${COLORS.redInk};border-color:${COLORS.redInk};}
          /* ---- the whole sheet: review before handing in, and the reveal ---- */
          .pr-tree{display:flex;gap:22px;align-items:stretch;min-height:330px;}
          .pr-tround{display:flex;flex-direction:column;flex:1;min-width:0;}
          .pr-trh{font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};margin-bottom:8px;height:14px;}
          .pr-tbody{display:flex;flex-direction:column;justify-content:space-around;flex:1;}
          .pr-tmatch{position:relative;flex:1;display:flex;align-items:center;}
          .pr-tmatch::before{content:'';position:absolute;left:-13px;top:25%;height:50%;width:13px;
                             border-left:1px solid ${COLORS.line};border-top:1px solid ${COLORS.line};border-bottom:1px solid ${COLORS.line};}
          .pr-tround.first .pr-tmatch::before{display:none;}
          .pr-tmatch::after{content:'';position:absolute;right:-13px;top:50%;width:13px;border-top:1px solid ${COLORS.line};}
          .pr-tbox{width:100%;border:1px solid ${COLORS.line};border-radius:7px;overflow:hidden;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .pr-tbox.jump{cursor:pointer;transition:box-shadow .12s,border-color .12s;}
          .pr-tbox.jump:hover,.pr-tbox.jump:focus-visible{border-color:var(--stg-acc, ${COLORS.accent});box-shadow:0 0 0 2px ${COLORS.accentSoft};outline:none;}
          .pr-trow{display:flex;align-items:center;gap:5px;padding:4px 7px;font-size:11.5px;font-weight:700;border-bottom:1px solid ${COLORS.line};line-height:1.25;}
          .pr-trow:last-child{border-bottom:none;}
          .pr-trow .v{margin-left:auto;font-family:${MONO};font-size:9.5px;font-weight:500;color:${FADED};white-space:nowrap;padding-left:6px;}
          .pr-trow .mk{font-family:${MONO};font-size:10px;font-weight:500;width:11px;flex:0 0 11px;text-align:center;}
          /* Affiliate chip, reveal only. It sits after the price and never on a
             row that is still in play, so nothing about it can hint at an answer. */
          .pr-shop{margin-left:6px;flex:0 0 auto;font-family:${MONO};font-size:9px;letter-spacing:.06em;text-transform:uppercase;
                   font-weight:500;color:${COLORS.accentDeep};background:${COLORS.accentSoft};border:1px solid ${COLORS.accent};
                   border-radius:4px;padding:1px 5px;text-decoration:none;white-space:nowrap;}
          .pr-shop:hover{background:${COLORS.accent};color:${T.white};}
          .pr-shopbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:1px solid ${COLORS.line};border-radius:10px;
                      background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};padding:10px 13px;margin:12px 0 0;max-width:560px;}
          .pr-shopbar .lbl{font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};}
          .pr-shopbar a{font-family:${SANS};font-size:12px;font-weight:800;color:${COLORS.accentDeep};background:${COLORS.accentSoft};
                        border:1px solid ${COLORS.accent};border-radius:7px;padding:5px 10px;text-decoration:none;}
          .pr-shopbar a:hover{background:${COLORS.accent};color:${T.white};}
          .pr-trow.win{background:${COLORS.greenSoft};color:#14532d;box-shadow:inset 3px 0 0 ${COLORS.green};}
          .pr-trow.lose{color:#9aa5b4;}
          .pr-trow.lose .n{text-decoration:line-through;}
          .pr-trow.mine{box-shadow:inset 3px 0 0 ${COLORS.accent};background:${COLORS.accentSoft};color:${COLORS.accentDeep};font-weight:800;}
          .pr-trow.bust{background:${COLORS.redSoft};color:#7f1d1d;box-shadow:inset 3px 0 0 ${COLORS.redInk};}
          .pr-trow.bust .n{text-decoration:line-through;}
          .pr-tchamp{display:flex;flex-direction:column;justify-content:center;flex:0 0 140px;}
          .pr-champ{border:1.5px solid ${COLORS.gold};background:${STAGE ? 'var(--stg-surf2)' : '#fffbeb'};border-radius:9px;padding:10px 10px;text-align:center;}
          .pr-stack{display:none;}
          .pr-srh{font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${FADED};margin:15px 0 7px;padding-bottom:5px;border-bottom:1px solid var(--border);}
          .pr-stack .pr-tbox{margin-bottom:7px;}
          @media(max-width:760px){
            .pr-arena{grid-template-columns:minmax(0,1fr) 96px;gap:0 12px;padding:11px 10px;}
            .pr-hist{display:none;}
            .pr-vs{display:none;}
            .pr-card{min-height:48px;padding:8px 10px;}
            .pr-card .nm{font-size:15px;}
            .pr-nrow{font-size:10px;min-height:25px;padding:4px 6px;}
            .pr-tree{display:none;}
            .pr-stack{display:block;}
          }
          /* ---- the tiebreaker panel, between the review sheet and the reveal ---- */
          .pr-guess-panel{background:${COLORS.accentSoft};border:1.5px solid ${COLORS.accent};border-radius:10px;padding:18px 20px;margin:6px 0 14px;max-width:560px;}
          .pr-guess-label{font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${COLORS.accentDeep};margin:0 0 6px;}
          .pr-guess-sub{font-family:${SANS};font-size:14px;font-weight:700;line-height:1.45;color:${INK};margin:0 0 14px;}
          .pr-guess-row{display:flex;align-items:center;gap:6px;margin-bottom:14px;}
          .pr-guess-dollar{font-family:${MONO};font-size:18px;font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});}
          .pr-guess-input{font-family:${MONO};font-size:18px;font-weight:500;border:1.5px solid ${COLORS.accent};border-radius:6px;
                          padding:8px 10px;width:170px;max-width:100%;outline:none;color:${INK};background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .pr-guess-input:focus{border-color:${COLORS.accentDeep};box-shadow:0 0 0 3px rgba(21,128,61,.2);}
          .pr-guess-btns{display:flex;gap:10px;flex-wrap:wrap;}
          .pr-guess-skip{font-family:${SANS};font-size:14px;font-weight:700;background:transparent;border:1.5px solid ${COLORS.line};
                         border-radius:6px;padding:9px 18px;color:${FADED};cursor:pointer;}
          .pr-guess-skip:hover{border-color:var(--stg-ink, ${COLORS.ink});color:${INK};}
          .pr-guess-submit{font-family:${SANS};font-size:14px;font-weight:800;background:${COLORS.accent};border:1.5px solid ${COLORS.accent};
                           border-radius:6px;padding:9px 18px;color:${T.white};cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .pr-guess-submit:hover{background:${COLORS.accentDeep};border-color:${COLORS.accentDeep};}
          .pr-guess-result{font-family:${MONO};font-size:12.5px;font-weight:500;line-height:1.45;color:${FADED};margin:8px 0 0;text-align:center;}
        ` }} />

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="pricer"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={4}
          helpTop={8}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Field of 32</span>}
          blocks={'PRICER'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 20, background: i === 0 ? COLORS.accent : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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
          <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px 22px', minHeight: 320, display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACC_DEEP_INK, fontWeight: 500, marginBottom: 5 }}>
              Today&rsquo;s field &middot; {PUZZLE.category}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'The field is sealed'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{N} price tags, one question, {MATCHES} picks, and no feedback until you hand the sheet in.</p>
                <p style={{ margin: 0 }}>{PUZZLE.metric} Prices checked {PUZZLE.gathered}.</p>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="pr-btn" onClick={startRun} style={{ background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Open the bracket</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>{gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}</button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
          <>
            {/* The category is the whole frame for the day's question: "which
                costs more" is meaningless until you know it is sixteen sneakers
                rather than sixteen sports cars. It leads, above the metric. */}
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACC_DEEP_INK, fontWeight: 500, marginBottom: 6 }}>
              {PUZZLE.category} &middot; {N} priced
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: ACC_DEEP_INK, background: COLORS.accentSoft, border: `1.5px solid var(--stg-line, ${COLORS.accent})`, borderRadius: 8, padding: '7px 12px' }}>{PUZZLE.metric}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: FADED }}>
                picked <b style={{ color: INK, fontWeight: 500 }}>{filled}</b> of {MATCHES}
                {!playing && <> &nbsp;&middot;&nbsp; scored <b style={{ color: INK, fontWeight: 500 }}>{score}</b>/{TOTAL}</>}
              </span>
              {PUZZLE.gathered && (
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: FADED }}>prices checked {PUZZLE.gathered}</span>
              )}
            </div>

            {/* THE ARENA. The bracket never leaves the screen, it is just zoomed all
                the way in: the two contenders stacked inside a real brace, the slot
                they are playing for on the right, and the winner travels into it. */}
            {playing && !reviewing && (() => {
              const r = roundOf(cursor), m = matchOf(cursor), w = N / Math.pow(2, r + 1);
              const kids = kidsOf(r, m);
              const back = prevPlayable(cursor);
              const card = (it, i) => {
                if (it == null || it < 0) return <div key={i} className="pr-card wait"><span className="nm">Waiting on an earlier pick</span></div>;
                const road = pathOf(it, r, m);
                return (
                  <button key={i} type="button" data-pr-card className="pr-card" onClick={(e) => pick(cursor, it, e.currentTarget)}>
                    <span className="nm">{PUZZLE.items[it].name}</span>
                    {road.length > 0 && <span className="sub">beat {road[road.length - 1].name}</span>}
                  </button>
                );
              };
              const hist = (it, i) => {
                const road = (it == null || it < 0) ? [] : pathOf(it, r, m);
                return (
                  <div key={i} className="pr-hgroup">
                    {road.length === 0
                      ? <div className="pr-hempty">{r === 0 ? 'First round' : 'Not yet'}</div>
                      : road.map((n, j) => (
                          <button key={j} type="button" className="pr-hchip" onClick={() => jumpTo(n.id)}
                            title={`Back to this game against ${n.name}`}>{n.name}</button>
                        ))}
                  </div>
                );
              };
              let nextLane;
              if (r === ROUNDS - 1) {
                nextLane = (
                  <div className="pr-lane">
                    <div className="pr-lanehd">Plays for</div>
                    <div className="pr-trophy">
                      <div className="lbl">Champion</div>
                      <div data-pr-target style={{ fontSize: 13, fontWeight: 900, marginTop: 3, lineHeight: 1.15, color: INK }}>&mdash;</div>
                    </div>
                  </div>
                );
              } else {
                const nk = kidsOf(r + 1, Math.floor(m / 2));
                const slot = m % 2;
                nextLane = (
                  <div className="pr-lane">
                    <div className="pr-lanehd">Advances to {ROUND_NAME(r + 1, ROUNDS)}</div>
                    <div className="pr-nextbox">
                      {[0, 1].map((s) => {
                        const it = nk[s], isTarget = s === slot;
                        const attrs = isTarget ? { 'data-pr-target': true } : {};
                        return (
                          <div key={s} className={'pr-nrow' + (it >= 0 ? ' filled' : '') + (isTarget ? ' target' : '')} {...attrs}>
                            {it >= 0 ? PUZZLE.items[it].name : (isTarget ? 'this winner' : 'winner of the other tie')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <>
                  <div className="pr-roundtag"><b>{ROUND_NAME(r, ROUNDS)}</b> &middot; match {m + 1} of {w}</div>
                  {/* keyed on the cursor so every matchup mounts fresh: the flight
                      writes classes and styles straight onto these nodes, and React
                      would otherwise reuse them and carry the marks forward. */}
                  <div className="pr-arena" key={cursor} ref={arenaRef}>
                    <div className="pr-lane pr-hist">
                      <div className="pr-lanehd">Beaten so far</div>
                      {r === 0
                        ? <div className="pr-hempty" style={{ textAlign: 'center' }}>No games yet</div>
                        : <>{hist(kids[0], 0)}{hist(kids[1], 1)}</>}
                    </div>
                    <div className="pr-lane pr-bout">{card(kids[0], 0)}<span className="pr-vs">VS</span>{card(kids[1], 1)}</div>
                    {nextLane}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 6px' }}>
                    <button type="button" className="pr-btn" onClick={() => jumpTo(back)} disabled={back < 0}>&larr; Back</button>
                    {complete && <button type="button" className="pr-btn" onClick={() => setReviewing(true)} style={{ marginLeft: 'auto' }}>Review the sheet</button>}
                  </div>
                </>
              );
            })()}

            {/* REVIEW. The whole sheet, ungraded, before you hand it in. */}
            {playing && reviewing && (
              <>
                <p style={{ fontSize: 12.5, color: FADED, fontWeight: 600, margin: '0 0 13px' }}>Nothing is graded yet. Tap any matchup to go back and change it, then hand it in.</p>
                {renderTree(false)}
                {renderStack(false)}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 6px' }}>
                  <button type="button" className="pr-btn" onClick={() => setReviewing(false)}>&larr; Keep editing</button>
                  {filled > 0 && <button type="button" className="pr-btn" onClick={clearAll}><Eraser size={14} /> Clear</button>}
                  {!complete && (
                    <button type="button" className="pr-btn" disabled
                      style={{ marginLeft: 'auto', opacity: 0.45, cursor: 'not-allowed' }}>
                      <Trophy size={14} /> Hand in the bracket
                    </button>
                  )}
                </div>
                {/* THE TIEBREAKER. A finished sheet is handed in through this panel
                    rather than by a bare button, so a score tie always has the
                    price guess to break it. Skip commits an explicit null, which
                    sorts behind every real guess. Either button reveals at once. */}
                {complete && !priceGuessSubmitted && (
                  <div className="pr-guess-panel">
                    <p className="pr-guess-label">Bonus: Price Guess</p>
                    <p className="pr-guess-sub">{GUESS_Q} Closest guess wins ties.</p>
                    <div className="pr-guess-row">
                      {(PUZZLE.unit === 'usd' || PUZZLE.unit === 'usdc') && <span className="pr-guess-dollar">$</span>}
                      <input
                        className="pr-guess-input"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={priceGuessInput}
                        onChange={(e) => setPriceGuessInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handPriceGuess(false); } }}
                      />
                    </div>
                    <div className="pr-guess-btns">
                      <button type="button" className="pr-guess-skip" onClick={() => handPriceGuess(true)}>Skip</button>
                      <button type="button" className="pr-guess-submit" onClick={() => handPriceGuess(false)}>
                        <Trophy size={14} /> Guess &amp; Reveal
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* THE REVEAL. Same tree, graded, with every real figure on it. */}
            {!playing && (<>{renderTree(true)}{renderStack(true)}</>)}

            {playing && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: FADED, marginBottom: 8 }}>
                  The whole draw &middot; <b style={{ color: INK, fontWeight: 500 }}>{filled}</b> of {MATCHES} filled &middot; tap any slot to go back
                </div>
                {renderMap(false)}
              </div>
            )}
          </>
        )}


          </div>
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <>
              <div style={{ maxWidth: 560, margin: '14px 0 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1.5px solid rgba(28,30,36,0.18)', borderRadius: 10, padding: '12px 14px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, color: won ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', flex: '0 0 auto' }}>{score}/{TOTAL}</span>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.45 }}>
                    {won ? <>A perfect bracket. Nothing busted.</> : <>{champion.name} took it at {fmtValue(champion.value, PUZZLE.unit)}.</>}
                    {' '}<span style={{ color: FADED, fontWeight: 600 }}>
                      {perRound.map(([hit, of], r) => `${ROUND_NAME(r, ROUNDS).replace('Round of ', 'R')} ${hit}/${of}`).join(' · ')} · {elapsed}
                    </span>
                  </span>
                </div>
                {/* The tiebreaker, graded. Absent entirely when the guess was
                    skipped, so a skip is never reported as a wildly bad guess. */}
                {priceGuessNum != null && (
                  <p className="pr-guess-result">
                    Your guess: {fmtValue(priceGuessNum, PUZZLE.unit)} &middot; Actual: {fmtValue(CHAMPION_VALUE, PUZZLE.unit)} &middot; Off by {fmtValue(priceOff, PUZZLE.unit)}
                  </p>
                )}
              </div>
              {/* Shop strip, reveal only. The shared DailyEndCard modal takes no
                  children, and adding a slot to it would touch every daily, so the
                  affiliate row lives on Pricer's own end-of-game panel. It renders
                  only for an `amazon` board whose top-priced items carry an ASIN,
                  so it is absent until ASINs are gathered. */}
              <PricerRolodex puzzle={PUZZLE} picks={g.picks} TRUE={TRUE} fmt={fmtValue}
                             colors={COLORS} mono={MONO} sans={SANS} />
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>{countdown ? <>A new field is seeded in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new field is seeded at midnight Eastern.'}
                    {prevPuzzle && <>{' '}Meanwhile: <a href={`/pricer?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>yesterday&rsquo;s bracket &rarr;</a></>}</>
                ) : (
                  <>You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026','')} archive. <a href="/pricer" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s bracket &rarr;</a>{' · '}<a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a></>
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
              name="Pricer"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (score > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${`${score}/${TOTAL}`} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Pricer all time` : 'all-time rank' }
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
                  href: `/pricer?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Pricer', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/pricer?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="pricer" name="Pricer" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="pricer" name="Pricer" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="pricer" maxWidth={640} challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`} share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light boardSlot={<DailyBoardPanel self="pricer" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />} divider />
          )}
          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: `var(--stg-acc, ${COLORS.accent})`, color: `var(--stg-onramp, ${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Pricer to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}><li>Tap <b>Share</b> in Safari.</li><li>Tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser menu and choose <b>Add to Home Screen</b>.</p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
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
        <DailyEndCard modal self="pricer" won={won} completed
          headline={won ? <>A perfect bracket</> : <>The field is settled</>}
          subline={<>Pricer #{PUZZLE.num} &middot; {PUZZLE.category} &middot; {score}/{TOTAL} &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'} onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60 }}>{toast}</div>
      )}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="pr-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ display: (focusMode || STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, color: INK }}>About Pricer</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Pricer is a free daily price puzzle from Mind Loft. Sixteen real things from one category, from sneakers to sports cars to hotel suites, are seeded into a single-elimination draw, every matchup asks the same money question, and you fill the whole sheet before you learn anything.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          What makes it bite is propagation. Your winners carry forward, so a first-round call you got wrong quietly ruins every later line it touches, and you will not find out until the reveal. The field is sorted by price before it is drawn, so the opening round is lopsided and the true final is the two closest price tags on the board, which is why the last pick is worth eight times the first.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every price is a real market figure, dated on the board and shown on the reveal, so the end screen teaches rather than just grades. A new field is priced daily at midnight Eastern, with 32 contenders on Sundays. More dailies: <a href="/bracket" style={{ color: INK, fontWeight: 800 }}>Bracket</a>, <a href="/listed" style={{ color: INK, fontWeight: 800 }}>Listed</a>, and <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>.
        </p>
      </section>
      <div style={{ display: (focusMode || STAGE) ? 'none' : 'block', position: 'relative', zIndex: 2 }}><Footer /></div>
    </div>
  );

  function copyShare() {
    const rows = perRound.map(([hit, of], r) => `${ROUND_NAME(r, ROUNDS).replace('Round of ', 'R')} ${hit}/${of}`).join(' · ');
    const streakBit = isTodays && myStats.cur >= 2 && g.status !== 'playing' ? ` · streak ${myStats.cur}` : '';
    const text = playing
      ? `Pricer #${PUZZLE.num} — ${PUZZLE.category}. The daily price bracket from Mind Loft.\n${withRef(`mindloftdaily.com/pricer${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`
      : `Pricer #${PUZZLE.num} — ${PUZZLE.category} — ${score}/${TOTAL}\n${rows}${streakBit}\n${withRef(`mindloftdaily.com/pricer${isTodays ? '' : `?p=${PUZZLE.num}`}`)}`;
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }
}
