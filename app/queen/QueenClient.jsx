'use client';

// Queen — the daily king-and-pawn promotion endgame.
//
// Each day: White king and pawn against a bare Black king, White to move, with
// a tablebase-proven SAFE promotion in exactly `winIn` White moves. Exactly one
// first move keeps the win inside that budget; every other move either throws
// the win away outright or wastes a tempo the budget does not have. You then
// walk the whole thing in: Black defends perfectly (a real tablebase, computed
// in this browser, not a heuristic), and every one of your moves has to be
// exact. Winning means promoting SAFELY: a queen the Black king can take
// straight back, or a push that delivers stalemate, is the draw it always was.
//
// Nothing announces a mistake while you can still move (the End Game rule):
// every legal move is played, nothing is taken back, and the round ends only
// when the pawn queens, the pawn falls, a side has no move, or the budget is
// spent. The rules of the position live in ./kpk.js, shared by this client and
// the bank generator; the verifier re-proves every board with its own solver.
//
// Same daily plumbing as Mate/Suds/Etch: banked boards gated by Eastern date on
// the server (app/queen/page.js), per-puzzle localStorage saves, /queen?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, Smartphone, RotateCcw } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold, { HOLD_SHORT, HOLD_LONG } from '../useEndHold';
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
import {
  parseFen, whiteMoves, applyWhite, bestBlackReply, tablebase,
  moveValue, promoValue, pawnAttacks, squareName, squareFromName, uci as kpkUci,
  rowOf, fileOf, sanOf, DRAW,
} from './kpk';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#a16207',       // Queen identity — coronation gold
  accentSoft: '#faf3e3',
  green: T.successDeep,
};
// The board itself: the same warm walnut as Mate, because it IS chess and the
// two should read as siblings.
// The squares come off the stage's own pair now, so the board follows the light
// switch. Beech and walnut were two mid-tone woods: the brightest surface on a
// near-black page, and a palette belonging to nothing else on the site.
const LIGHT_SQ = 'var(--stg-sq-l, #efd9b5)';
const DARK_SQ = 'var(--stg-sq-d, #b58863)';
const SEL_SQ = 'rgba(161,98,7,0.5)';
const LAST_SQ = 'rgba(224,174,74,0.55)';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_queen_help_seen';
const STATS_KEY = 'sot_queen_stats';

// Inline SVG pieces (the Unicode chess glyphs are missing from many fonts and
// render as tofu; see MateClient, which established the rule and these paths).
const PIECE_PATH = {
  K: 'M22.5 3.2 h4.6 v4.4 h4.4 v4.6 h-4.4 v3.1 a7.4 7.4 0 0 1 4.9 6.9 c0 2.6 -1.4 4.4 -3.1 6.6 l-1.9 2.4 h6.9 a3 3 0 0 1 3 3 v3.6 h-27 v-3.6 a3 3 0 0 1 3 -3 h6.9 l-1.9 -2.4 c-1.7 -2.2 -3.1 -4 -3.1 -6.6 a7.4 7.4 0 0 1 4.9 -6.9 v-3.1 h-4.4 v-4.6 h4.4 v-4.4 z',
  Q: 'M8.4 12.6 a2.7 2.7 0 1 1 2.7 2.7 l2.3 8.2 l3.4 -9.9 a2.7 2.7 0 1 1 3.1 -0.1 l3.6 10.4 l3.6 -10.4 a2.7 2.7 0 1 1 3.1 0.1 l3.4 9.9 l2.3 -8.2 a2.7 2.7 0 1 1 2.7 -2.7 a2.7 2.7 0 0 1 -1.6 2.5 l-3.4 12.4 h-19.6 l-3.4 -12.4 a2.7 2.7 0 0 1 -1.6 -2.5 z M12.8 30.5 h19.4 l0.9 3.2 h-21.2 z M10.5 35.6 h24 a2.6 2.6 0 0 1 2.6 2.6 v3.2 h-29.2 v-3.2 a2.6 2.6 0 0 1 2.6 -2.6 z',
  P: 'M22.5 8.4 a5.6 5.6 0 0 1 3.6 9.9 c2.4 1.5 4.1 4 4.1 7.1 c0 2.3 -0.9 4 -1.9 5.6 h-11.6 c-1 -1.6 -1.9 -3.3 -1.9 -5.6 c0 -3.1 1.7 -5.6 4.1 -7.1 a5.6 5.6 0 0 1 3.6 -9.9 z M11.6 35.7 h21.8 a2.6 2.6 0 0 1 2.6 2.6 v3.1 h-27 v-3.1 a2.6 2.6 0 0 1 2.6 -2.6 z',
};
function Piece({ code }) {
  const white = code === code.toUpperCase();
  return (
    <svg className="qn-pc" viewBox="0 0 45 45" aria-hidden="true" focusable="false">
      <path
        d={PIECE_PATH[code.toUpperCase()]}
        fill={white ? T.white : '#16181d'}
        stroke={white ? '#16181d' : T.white}
        strokeWidth={white ? 2 : 1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

// ─── Personal stats + streak (localStorage), Suds/Etch pattern ─────────────
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

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// Black's move rendered for the move list: "Kd7", "Kxe5" on the capture.
const blackSan = (mv) => `K${mv.capture ? 'x' : ''}${squareName(mv.to)}`;

// Rebuild the live position from the move list. White's moves are found in the
// legal set (so a save can never desync the board) and Black's are king steps
// read straight off the UCI string. `promoted` marks the pawn standing on the
// eighth rank as the queen it became.
function replay(startFen, moves) {
  let s = parseFen(startFen);
  let promoted = false, pawnGone = false;
  const sans = [];
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (i % 2 === 0) {
      const mv = whiteMoves(s).find((x) => x.uci === m);
      if (!mv) break;
      sans.push(sanOf(s, mv));
      if (mv.promo) { s = { wk: s.wk, bk: s.bk, p: mv.to, stm: 'b' }; promoted = true; }
      else s = applyWhite(s, mv);
    } else {
      const to = squareFromName(m.slice(2, 4));
      const capture = to === s.p;
      sans.push(blackSan({ to, capture }));
      if (capture) pawnGone = true;
      s = { wk: s.wk, bk: to, p: capture ? null : s.p, stm: 'w' };
    }
  }
  return { s, promoted, pawnGone, sans };
}

function freshState() {
  return { v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null };
}

export default function QueenClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_queen_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [hintPiece, setHintPiece] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const endHold = useEndHold(1200);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('queen', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('queen'); }, [g.hintUsed]);
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
  const replyTimer = useRef(null);

  const moves = g.moves;
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = isLoft('queen');
  const STAGE = isStage('queen', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('queen');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('queen'), '--stg-acc-lt': gameColorLight('queen'), '--stg-onramp-lt': gameOnrampLight('queen'), '--stg-acc-ink-lt': gameAccentInkLight('queen') };
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
  const won = g.status === 'won';
  const errors = g.errors;
  const finalScore = won ? 10 : 0;
  const endScore = finalScore;
  const awaitingReply = playing && moves.length % 2 === 1;

  const view = useMemo(() => replay(PUZZLE.fen, moves), [PUZZLE, moves]);
  const pos = view.s;
  const lastMove = moves.length
    ? { from: squareFromName(moves[moves.length - 1].slice(0, 2)), to: squareFromName(moves[moves.length - 1].slice(2, 4)) }
    : null;
  const myTurn = playing && started && !awaitingReply;
  // White's budget, not an evaluation: moves made against the puzzle's own
  // winIn. It counts honestly whether or not the walk is still on track.
  const movesLeft = Math.max(0, PUZZLE.winIn - Math.ceil(moves.length / 2));
  const sanList = view.sans;

  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!armRestart) return undefined;
    const t = setTimeout(() => setArmRestart(false), 3500);
    return () => clearTimeout(t);
  }, [armRestart]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.moves)) {
          const next = { ...freshState(), ...saved };
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
        if (done || g.t0) localStorage.setItem('sot_queen_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_queen_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live game clock (ticked state, never Date.now() during render).
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
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'queen', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'queen', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'queen', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'queen', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'queen', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_queen_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.errors > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // HOW FAR THIS RUN GOT (migration 51): the White moves played while the walk
  // was still on budget. A move is on budget when the tablebase says the win
  // still fits in the moves remaining; once one does not, the depth freezes
  // there. Ranking term only, never score.
  function progressOf(g2) {
    let s = parseFen(PUZZLE.fen);
    let onTrack = 0, off = false;
    const mvs = g2.moves || [];
    for (let i = 0; i < mvs.length; i++) {
      if (i % 2 === 0) {
        const mv = whiteMoves(s).find((x) => x.uci === mvs[i]);
        if (!mv) break;
        const remaining = PUZZLE.winIn - i / 2;
        if (!off && moveValue(s, mv) <= remaining) onTrack++;
        else off = true;
        if (mv.promo) break;
        s = applyWhite(s, mv);
      } else {
        const to = squareFromName(mvs[i].slice(2, 4));
        if (to === s.p) break;
        s = { wk: s.wk, bk: to, p: s.p, stm: 'w' };
      }
    }
    return onTrack;
  }

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.errors, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.errors, progress: progressOf(g2), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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
    // Warm the tablebase off the tap path, so the first move costs nothing.
    setTimeout(() => { try { tablebase(fileOf(parseFen(PUZZLE.fen).p)); } catch (e) {} }, 60);
  }

  function concludeLost(cur) {
    const done = { ...cur, status: 'lost', tEnd: Date.now() };
    vibrate(HAPT.wrong);
    postResult(done, 0);
    endHold.hold(HOLD_LONG);
    commit(done);
  }

  // Black's perfect reply, a beat after White's move.
  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) return;
      const v = replay(PUZZLE.fen, cur.moves);
      // Unsafe promotion: the one scripted reply is the capture, and the round
      // ends on it. The tablebase never sees a queen; it does not need to.
      if (v.promoted) {
        const done = { ...cur, moves: [...cur.moves, kpkUci(v.s.bk, v.s.p)], status: 'lost', tEnd: Date.now() };
        vibrate(HAPT.wrong);
        postResult(done, 0);
        endHold.hold(HOLD_LONG);
        commit(done);
        return;
      }
      const mv = bestBlackReply(v.s);
      if (!mv) {
        // Black has no legal move. In check from the pawn it is checkmate, a
        // win a move early; otherwise it is stalemate and the win is gone.
        if (v.s.p != null && pawnAttacks(v.s.p, v.s.bk)) {
          const done = { ...cur, status: 'won', tEnd: Date.now() };
          vibrate(HAPT.win);
          postResult(done, 10);
          endHold.hold(HOLD_SHORT);
          commit(done);
        } else concludeLost(cur);
        return;
      }
      const next = { ...cur, moves: [...cur.moves, mv.uci] };
      if (mv.capture) {
        // The pawn falls: king against king, the deadest of draws.
        const done = { ...next, status: 'lost', tEnd: Date.now() };
        vibrate(HAPT.wrong);
        postResult(done, 0);
        endHold.hold(HOLD_LONG);
        commit(done);
        return;
      }
      commit(next);
      vibrate(HAPT.ok);
    }, 620);
  }
  useEffect(() => {
    if (!hydrated || !playing) return undefined;
    if (moves.length % 2 === 1) scheduleReply(moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, moves.length]);

  // White with no legal move is stalemate too: the round is over. Rare, but a
  // cornered king can be walled in by its own pawn and the enemy king.
  useEffect(() => {
    if (!hydrated || !playing || !started || awaitingReply) return;
    if (whiteMoves(pos).length === 0) concludeLost(gRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, started, awaitingReply, pos]);

  function tryMove(from, to) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    const v = replay(PUZZLE.fen, cur.moves);
    const mv = whiteMoves(v.s).find((x) => x.from === from && x.to === to);
    if (!mv) return;
    const nextMoves = [...cur.moves, mv.uci];
    const g2 = { ...cur, moves: nextMoves };
    if (!g2.t0) g2.t0 = Date.now();
    setSel(null);
    setHintPiece(null);
    // The miss is counted on the move that leaves the budget, and only there:
    // once the walk is off it, every later move is just play.
    const remaining = PUZZLE.winIn - (Math.ceil(nextMoves.length / 2) - 1);
    const wasOn = progressOf(cur) === Math.ceil(cur.moves.length / 2);
    if (wasOn && moveValue(v.s, mv) > remaining) g2.errors = cur.errors + 1;
    if (mv.promo) {
      const verdict = promoValue(v.s.wk, v.s.bk, mv.to);
      if (verdict === 'win') {
        g2.status = 'won';
        g2.tEnd = Date.now();
        vibrate(HAPT.win);
        postResult(g2, 10);
        endHold.hold(HOLD_SHORT);
        commit(g2);
        return;
      }
      if (verdict === 'stalemate') {
        g2.status = 'lost';
        g2.tEnd = Date.now();
        vibrate(HAPT.wrong);
        postResult(g2, 0);
        endHold.hold(HOLD_LONG);
        commit(g2);
        return;
      }
      // verdict === 'capture': the queen stands for one beat, then falls.
      vibrate(HAPT.ok);
      commit(g2);
      scheduleReply(nextMoves);
      return;
    }
    // Budget spent with no queen on the board: that is the conclusion.
    if (Math.ceil(nextMoves.length / 2) >= PUZZLE.winIn) {
      g2.status = 'lost';
      g2.tEnd = Date.now();
      vibrate(HAPT.wrong);
      postResult(g2, 0);
      endHold.hold(HOLD_LONG);
      commit(g2);
      return;
    }
    vibrate(HAPT.ok);
    commit(g2);
    scheduleReply(nextMoves);
  }

  function onSquare(sq) {
    if (!playing) return;
    if (!gRef.current.t0) startGame();
    if (!myTurn) return;
    const piece = sq === pos.wk ? 'K' : sq === pos.p ? 'P' : null;
    if (sel === sq) { setSel(null); return; }
    if (piece) { setSel(sq); return; }
    if (sel != null) {
      const ts = whiteMoves(pos).filter((m) => m.from === sel).map((m) => m.to);
      if (ts.includes(sq)) { tryMove(sel, sq); return; }
      setSel(null);
    }
  }

  const targets = useMemo(() => (sel != null && myTurn ? whiteMoves(pos).filter((m) => m.from === sel).map((m) => m.to) : []), [sel, pos, myTurn]);

  // One free hint: names the piece that moves, never the square.
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const v = replay(PUZZLE.fen, cur.moves);
    if (v.s.stm !== 'w') return;
    let best = null;
    for (const mv of whiteMoves(v.s)) {
      const val = moveValue(v.s, mv);
      if (!best || val < best.val) best = { mv, val };
    }
    if (!best || best.val === DRAW) return;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    setHintPiece(best.mv.from);
    say(`It is the ${best.mv.piece === 'K' ? 'king' : 'pawn'} that moves.`);
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    endHold.hold(HOLD_SHORT);
    commit(g2);
    setSel(null);
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setArmReveal(false);
    setArmRestart(false);
    commit({ ...freshState(), t0: Date.now() });
    setSel(null); setHintPiece(null); setEndClosed(false);
  }

  function restartGame() {
    const cur = gRef.current;
    if (cur.status === 'playing' && cur.t0) {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      postResult({ ...cur, status: 'revealed', tEnd: Date.now() }, 0);
    }
    resetGame();
  }

  function shareUrl() {
    return withRef(`mindloftdaily.com/queen${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Queen #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · promoted in ${PUZZLE.winIn} · ${errors === 0 ? 'clean walk' : `${errors} miss${errors === 1 ? '' : 'es'}`} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'lost'
        ? `Queen #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · the pawn never queened · ${elapsed}`
        : `Queen #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Queen #${PUZZLE.num} — the daily pawn endgame from Mind Loft.\n${shareUrl()}`
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
      lead="Walk the pawn in."
      banner={<>You are <b>White</b>: a king and one pawn against a bare king. There is a forced <b>promotion in {PUZZLE.winIn}</b> moves on the board, and exactly one first move keeps it.</>}
      steps={[
        <><b>Tap your king or pawn</b> and the squares it can reach light up. <b>Tap one</b> to play the move. Black&rsquo;s king defends perfectly.</>,
        <>Every move must pull its weight: the win fits the budget with <b>nothing to spare</b>, so a wasted tempo loses it as surely as a blunder.</>,
        <>Promote <b>safely</b>. A queen the Black king can take straight back, and a push that leaves Black stalemated with no move at all, are both draws, and a draw scores nothing here.</>,
      ]}
      knack={<>The king leads and the pawn follows. Taking the opposition, kings facing with one square between, is usually worth more than a push.</>}
      note={<>You may play <b>any legal move</b> and there is <b>no take-back</b>. Nothing is refused and nothing stops early: Black keeps defending, and the round ends when the pawn queens safely, the pawn falls, either side runs out of moves, or the budget runs out.</>}
      footer="A safe promotion scores 10, and anything else scores nothing, the same as giving up. Ties break on fastest time. The budget ramps through the week, and the Sunday Edition is the longest walk, twelve moves."
    />
  );

  const fileLabels = 'abcdefgh'.split('');

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="queen" name="Queen" collapsed={started} loft={LOFT} />
      )}
      {/* END GAME: the cap shows exactly what the strip showed at that moment,
          no more. The tally is posted throughout but only APPEARS once the
          round is over. */}
      {LOFT && (
        <Cap gameKey="queen" quizId={PUZZLE.quizId}
          name="Queen"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: Math.max(1, movesLeft), k: 'promote in' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: 'misses' },
            { v: PUZZLE.winIn, k: 'promote in' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="qn-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.qn-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .qn-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .qn-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .qn-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .qn-sq{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;}
          .qn-pc{display:block;width:86%;height:86%;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.25));}
          .qn-dot{position:absolute;width:28%;height:28%;border-radius:50%;background:rgba(28,30,36,0.32);pointer-events:none;}
          .qn-coord{position:absolute;font-family:${MONO};font-size:min(2vw,10px);font-weight:500;opacity:.62;pointer-events:none;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="queen"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Win in 12</span>}
          blocks={'QUEEN'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 0 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: i === 0 ? `var(--stg-onramp, ${T.white})` : T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Queen is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>King and pawn against king: promote in {PUZZLE.winIn} against a perfect defence. Tap a piece, tap where it goes. Only one first move keeps the win, and there is no take-back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="qn-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {!playing && <span style={{ whiteSpace: 'nowrap' }}>misses <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {playing ? <>promote in <b style={{ color: ACC_INK, fontWeight: 500 }}>{Math.max(1, movesLeft)}</b></> : <>promote in <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.winIn}</b></>}
            </span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            <div
              className="qn-board"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gridTemplateRows: 'repeat(8, minmax(0, 1fr))', aspectRatio: '1 / 1', border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 4, overflow: 'hidden', touchAction: 'manipulation' }}
            >
              {Array.from({ length: 64 }).map((_, sq) => {
                const r = rowOf(sq), f = fileOf(sq);
                const dark = (r + f) % 2 === 1;
                const piece = sq === pos.wk ? 'K' : sq === pos.bk ? 'k' : sq === pos.p ? (view.promoted ? 'Q' : 'P') : null;
                const white = piece && piece !== 'k';
                const isSel = sel === sq;
                const isTarget = targets.includes(sq);
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const isHint = hintPiece === sq;
                let bg = dark ? DARK_SQ : LIGHT_SQ;
                if (isLast) bg = `linear-gradient(${LAST_SQ},${LAST_SQ}), ${bg}`;
                if (isSel) bg = `linear-gradient(${SEL_SQ},${SEL_SQ}), ${dark ? DARK_SQ : LIGHT_SQ}`;
                return (
                  <div
                    key={sq}
                    className="qn-sq"
                    onClick={() => onSquare(sq)}
                    role="button"
                    tabIndex={-1}
                    aria-label={squareName(sq) + (piece ? ` ${white ? 'white' : 'black'} ${piece === 'k' ? 'K' : piece}` : ' empty')}
                    style={{ background: bg, boxShadow: isHint ? `inset 0 0 0 3px ${T.successDeep}` : undefined }}
                  >
                    {f === 0 && (
                      <span className="qn-coord" style={{ left: 2, top: 1, color: dark ? LIGHT_SQ : DARK_SQ }}>{8 - r}</span>
                    )}
                    {r === 7 && (
                      <span className="qn-coord" style={{ right: 3, bottom: 1, color: dark ? LIGHT_SQ : DARK_SQ }}>{fileLabels[f]}</span>
                    )}
                    {piece && <Piece code={piece} />}
                    {isTarget && !piece && <span className="qn-dot" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : (endHold.held ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`) }}>
              {!playing
                ? (won ? 'The queen stands. Promoted.' : g.status === 'lost' ? 'No queen. The win is still there.' : 'You ended it there. The win is still there.')
                : awaitingReply
                  ? 'Black is thinking...'
                  : movesLeft <= 1
                    ? 'Queen the pawn.'
                    : `Your move. Promote in ${movesLeft}.`}
            </span>
            {sanList.length > 0 && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, color: FADED, fontWeight: 500 }}>
                {sanList.map((s, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${s}` : s)).join(' ')}
              </span>
            )}
          </div>

          {playing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {hintOk && !g.hintUsed && (
                <button className="qn-tool" onClick={useHint} title="Name the piece that moves (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(161,98,7,0.5)', color: '#7c4d05' }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
            </div>
          )}

        {started && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                Tap your king or pawn, then tap where it goes. There is no take-back.
              </span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmRestart(false); setArmReveal(Date.now()); } }}
                  title={armReveal ? 'Ends the puzzle and scores nothing' : 'End the puzzle now, scoring nothing'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <Eye size={13} style={{ flexShrink: 0 }} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartGame(); } else { setArmReveal(false); setArmRestart(Date.now()); } }}
                  title={armRestart ? 'Records a 0 and resets the board' : 'Record a 0 and reset the board'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <RotateCcw size={13} style={{ flexShrink: 0 }} /> {armRestart ? 'Press again' : 'Restart'}
                </button>
              </span>
            </div>
            {(armReveal || armRestart) && (
              <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: `var(--stg-ink, ${COLORS.rust})`, marginTop: 6, textAlign: 'right', lineHeight: 1.4 }}>
                {armReveal ? 'Ends the puzzle and scores nothing.' : 'Records a 0 and resets the board.'}
              </div>
            )}
          </div>
        )}
        </div>
      )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && !endHold.held && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              {/* keepsAnswer: the key move is shown to nobody, solver included.
                  The position is replayable and the walk is the prize. */}
              {won ? (
                <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                  Walked in, in {PUZZLE.winIn}.{errors === 0 ? ' Not a tempo wasted.' : ''}
                </div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  We are not printing the move. The winning walk is still there in the position, so take another run at it.
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition: the long walk, a win in twelve.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Queen in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new position drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/queen?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Queen &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/queen" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Queen &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </div>
          )}
          </div>
          {LOFT && !playing && !endHold.held && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !endHold.held && (
            <LoftFinish
              name="Queen"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} · ${errors} misses · ${PUZZLE.winIn} promote in · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Queen all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Tries"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/queen?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Queen', sub: `No. ${prevPuzzle.num}, yesterday’s puzzle`, href: `/queen?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
      </div>


        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap answers what this opens, without being pressed. */}
        {!STAGE && <GamePanel self="queen" name="Queen" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="queen" name="Queen" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="queen"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="queen" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Queen to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s position, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s position, every day.
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

      {!playing && !endClosed && !endHold.held && !LOFT && (
        <DailyEndCard
          modal
          self="queen"
          won={won}
          headline={won ? <>Promoted!</> : g.status === 'lost' ? <>The pawn never queened.</> : <>You scored 0%</>}
          subline={won
            ? <>10/10 &middot; walked in, in {PUZZLE.winIn} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : g.status === 'lost' ? <>0/10 &middot; the win slipped away</>
            : <>0/10 &middot; the win is still in the position</>}
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
            <button className="qn-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Queen</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Queen is a free daily chess endgame from Mind Loft. Every position is a king and one pawn against a bare king, with a proven win: walk the pawn to the eighth rank and promote it, safely, against a defence that never makes a mistake. Tap a piece and its legal squares light up, so no chess notation is needed.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The win fits the stated number of moves exactly, verified by two independent solvers, and exactly one first move keeps it. This is the endgame every chess player is told to learn first, the opposition, spare tempi, the square of the pawn, and the game plays it out honestly: a promotion the defending king can capture straight back, or one that delivers stalemate, is a draw, exactly as it is over the board.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new position drops every day at midnight Eastern, the budget deepens through the week, and the Sunday Edition is the longest walk of all, a win in twelve. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More chess dailies: <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, White to play and mate, and <a href="/defend" style={{ color: INK, fontWeight: 800 }}>Defend</a>, the same argument from the other side.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
