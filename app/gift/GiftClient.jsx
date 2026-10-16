'use client';

// Gift, the daily Quarto endgame.
//
// Each day: a 4x4 board with a few pieces on it and a piece in your hand that
// your opponent just gave you. A turn is two halves: place the gift on any
// empty well, then hand your opponent one of the pieces still off the board.
// Four in a line that share ANY one trait (tall or short, dark or light, square
// or round, hollow or solid) win for whoever placed the fourth. You can force a
// win, and exactly one first move does it; every other first move loses or
// draws against best play.
//
// HOW A MOVE IS JUDGED. Live, with the solver in lib/gift-core.js: a move that
// leaves the forced win in place keeps it, a move that does not throws it away.
// That is counted, once, and shown only after the game ends (owner rule,
// 2026-08-11, "NOTHING TELLS YOU THE ROUND IS LOST WHILE YOU CAN STILL PLAY").
// The opponent answers with reply() from the same file, the defence the
// generator proved every board against, so it never throws a game away.
// A win on the board is a solve whatever the key says.

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
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import {
  makeSolver, reply, winsAt, winningLines, decodeBoard, parsePiece, pieceShort, pieceName, poolOf,
} from '@/lib/gift-core';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: '#7c3aed',       // Gift identity, a violet: the ribbon on a box
  accentSoft: '#f1eafe',
  green: T.successDeep,
};
const GOLD = '#e8b43a';

const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_gift_help_seen';
const STATS_KEY = 'sot_gift_stats';

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p && p.board) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today && p.board);
  return open.length ? open[open.length - 1] : puzzles.find((p) => p.board) || puzzles[0];
}
function todayNumOf(puzzles) {
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1].num : puzzles[0].num;
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

// ─── Personal stats + streak (localStorage), the shared daily pattern ──────
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

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

// A move is 'sq:CODE' (CODE the piece handed over, '-' when the placement ends
// the game). Moves alternate: yours at even indices, your opponent's at odd.
const enc = (sq, give) => `${sq}:${give < 0 ? '-' : pieceShort(give)}`;
function dec(m) {
  const [a, b] = String(m).split(':');
  return { sq: Number(a), give: b === '-' ? -1 : parsePiece(b) };
}

// Walk the move list from the start. Keeping only the moves in state means a
// save is a handful of short strings and can never drift from the board.
function walk(START, HAND, moves, S) {
  const b = START.slice();
  let hand = HAND;
  let kept = 0, threw = 0, mine = 0, winning = true, over = null, last = null;
  for (let i = 0; i < moves.length; i++) {
    const { sq, give } = dec(moves[i]);
    const me = i % 2 === 0;
    if (me) {
      mine++;
      if (winning) {
        if (S.moveWins(b, hand, sq, give)) kept++;
        else { threw++; winning = false; }
      }
    }
    b[sq] = hand;
    last = { sq, me };
    if (winsAt(b, sq)) { over = me ? 'won' : 'lost'; break; }
    if (!b.includes(-1)) { over = 'draw'; break; }
    hand = give;
  }
  return { board: b, hand, kept, threw, mine, over, last };
}

function freshState() {
  return { v: 1, moves: [], hintUsed: false, status: 'playing', end: null, t0: null, tEnd: null };
}

const END_LINE = {
  won: 'Four in a line. You win.',
  lost: 'Your opponent made a line of four. The win is still in the position.',
  draw: 'The board is full and nobody made a line. A draw, and the win is still in there.',
  revealed: 'You ended it there. The win is still in the position.',
};

// ─── a piece: tall or short (size), dark or light (fill), square or round
// (corners), hollow or solid (a hole in the top). Sizes are percentages of the
// well, so it scales with the board.
function Piece({ p, small, ghost }) {
  if (p == null || p < 0) return null;
  const tall = p & 1, dark = p & 2, square = p & 4, hollow = p & 8;
  const w = tall ? (small ? '72%' : '78%') : (small ? '48%' : '52%');
  return (
    <span aria-hidden="true" className={`gf-pc ${dark ? 'dk' : 'lt'}`}
      style={{ width: w, height: w, borderRadius: square ? '16%' : '50%', opacity: ghost ? 0.5 : 1 }}>
      {hollow ? <span className="gf-hole" /> : null}
    </span>
  );
}

const GF_CSS = `
.gf-root{--gf-piece-lt:#f6eedc;--gf-piece-dk:#1f2433;--gf-well:#cdd4e0;--gf-lt-edge:0 0 0 2px #2a2f3d;--gf-board:#ffffff;--gf-frame:0 0 0 1px rgba(11,15,26,.10),0 14px 34px rgba(11,15,26,.14);--gf-gold-ink:#8a6206;}
.stage-page:not([data-stage-theme='light']) .gf-root,
html[data-stage-boot='dark'] .stage-page .gf-root{--gf-lt-edge:0 0 0 1.5px rgba(26,29,36,.55);--gf-dk-edge:0 0 0 2px #a3adc2;--gf-well:#343b4d;--gf-board:#121622;--gf-frame:0 0 0 1px rgba(255,255,255,.10),0 14px 34px rgba(0,0,0,.5);--gf-gold-ink:#e8b43a;}
.gf-play{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;}
@media(min-width:900px){.gf-play{grid-template-columns:minmax(0,11fr) minmax(0,10fr);gap:28px;}}
.gf-bd{width:100%;max-width:460px;margin:0 auto;aspect-ratio:1/1;border-radius:50%;background:var(--gf-board);box-shadow:var(--gf-frame);display:flex;align-items:center;justify-content:center;box-sizing:border-box;}
.gf-grid{width:77%;aspect-ratio:1/1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:3.2%;touch-action:manipulation;}
.gf-well{position:relative;border-radius:50%;background:var(--gf-well);display:flex;align-items:center;justify-content:center;padding:0;border:none;cursor:default;-webkit-tap-highlight-color:transparent;min-width:0;min-height:0;}
.gf-well.open{cursor:pointer;}
.gf-well.sel{box-shadow:0 0 0 3px ${GOLD};}
.gf-well.last{box-shadow:0 0 0 2px var(--stg-mute,#8b95a8);}
.gf-well.line{box-shadow:0 0 0 3px ${GOLD};}
.gf-pc{display:flex;align-items:center;justify-content:center;box-sizing:border-box;flex:none;}
.gf-pc.dk{background:var(--gf-piece-dk);box-shadow:inset 0 -4px 0 rgba(0,0,0,.30),var(--gf-dk-edge,0 0 0 1px rgba(255,255,255,.14));}
.gf-pc.lt{background:var(--gf-piece-lt);box-shadow:inset 0 -4px 0 rgba(0,0,0,.14),var(--gf-lt-edge,0 0 0 1.5px rgba(26,29,36,.55));}
.gf-hole{width:38%;height:38%;border-radius:50%;background:var(--gf-well);}
.gf-pool{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
@media(min-width:480px){.gf-pool{grid-template-columns:repeat(8,minmax(0,1fr));}}
@media(min-width:900px){.gf-pool{grid-template-columns:repeat(4,minmax(0,1fr));}}
.gf-chip{aspect-ratio:1/1;border-radius:10px;background:var(--gf-well);border:none;padding:0 0 6%;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;min-width:0;-webkit-tap-highlight-color:transparent;}
.gf-chip:disabled{cursor:default;opacity:.55;}
.gf-chip.sel{box-shadow:0 0 0 3px ${GOLD};}
.gf-gift{display:flex;gap:14px;align-items:center;}
.gf-giftwell{width:min(22vw,92px);aspect-ratio:1/1;flex:none;border-radius:50%;background:var(--gf-well);box-shadow:0 0 0 3px ${GOLD};display:flex;align-items:center;justify-content:center;}
.gf-eyebrow{font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;}
.gf-go{font-family:${SANS};font-size:15px;font-weight:800;padding:12px 22px;border-radius:10px;border:none;background:${GOLD};color:#1b1405;cursor:pointer;}
.gf-go:disabled{opacity:.45;cursor:default;}
`;

export default function GiftClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_gift_${PUZZLE.num}`;
  const START = useMemo(() => decodeBoard(PUZZLE.board), [PUZZLE]);
  const HAND = useMemo(() => parsePiece(PUZZLE.hand), [PUZZLE]);
  const WIN_IN = PUZZLE.winIn;
  // One solver per board: its memo makes every later question on the same
  // game cheap, and the first one is warmed on mount while the player reads.
  const solver = useMemo(() => makeSolver(), [PUZZLE]);

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [selSq, setSelSq] = useState(null);
  const [selGive, setSelGive] = useState(null);
  const [hintSq, setHintSq] = useState(null);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('gift', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('gift'); }, [g.hintUsed]);
  const [, setPlayer] = useState(null);
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
  const LOFT = isLoft('gift');
  const STAGE = isStage('gift', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('gift');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('gift'), '--stg-acc-lt': gameColorLight('gift'), '--stg-onramp-lt': gameOnrampLight('gift'), '--stg-acc-ink-lt': gameAccentInkLight('gift') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const won = g.status === 'won';

  // Your opponent's reply is appended a beat after yours, so an odd move count
  // means it is still in flight and the board is not yours to touch.
  const awaitingReply = moves.length % 2 === 1;
  const W = useMemo(() => walk(START, HAND, moves, solver), [START, HAND, moves, solver]);
  const pos = W.board;
  const hand = W.hand;
  // THE TALLY. Kept from the first move and posted, shown only once the game is
  // over: a counter ticking up is itself a notice that the move was wrong.
  const errors = W.threw;
  const myTurn = playing && started && !awaitingReply;
  const pool = useMemo(() => poolOf(pos, hand), [pos, hand]);
  const lineCells = useMemo(() => {
    if (playing) return new Set();
    return new Set(winningLines(pos).flat());
  }, [pos, playing]);

  useEffect(() => { gRef.current = g; }, [g]);
  // Warm the solver's memo on the opening position while the player reads.
  useEffect(() => {
    const t = setTimeout(() => { try { solver.win(START.slice(), HAND, WIN_IN); } catch (e) {} }, 300);
    return () => clearTimeout(t);
  }, [solver, START, HAND, WIN_IN]);
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
      if (PUZZLE.num === todayNumOf(puzzles)) {
        const done = g.status !== 'playing';
        if (done || g.t0) localStorage.setItem('sot_gift_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_gift_day');
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
  const isTodays = PUZZLE.num === todayNumOf(puzzles);
  const iq = useIqStanding({ game: 'gift', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'gift', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'gift', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'gift', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'gift', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, todayNumOf(puzzles));

  const REC_KEY = `sot_gift_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const w = walk(START, HAND, cur.moves, solver);
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: w.threw, progress: w.kept, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // HOW FAR THIS RUN GOT (migration 51): your turns played while the forced win
  // was still there. A loss scores 0, and this is what orders the losers,
  // deepest first. It is NOT score.
  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const w = walk(START, HAND, g2.moves, solver);
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: w.threw, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: w.threw, progress: w.kept, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function finish(g2, status, end) {
    g2.status = status;
    g2.end = end;
    g2.tEnd = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(g2, status === 'won' ? 10 : 0);
    // A loss lands on your opponent's placement, so you have not seen it yet:
    // the board holds for HOLD_LONG with the line lit and the verdict readable.
    endHold.hold(status === 'won' ? HOLD_SHORT : HOLD_LONG);
    commit(g2);
  }

  // After every placement: has the game ended?
  function settle(g2) {
    const w = walk(START, HAND, g2.moves, solver);
    if (w.over === 'won') { finish(g2, 'won', 'won'); return true; }
    if (w.over === 'lost') { finish(g2, 'lost', 'lost'); return true; }
    if (w.over === 'draw') { finish(g2, 'lost', 'draw'); return true; }
    return false;
  }

  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) return;
      const w = walk(START, HAND, cur.moves, solver);
      const r = reply(solver, w.board, w.hand);
      if (!r) return;
      const g2 = { ...cur, moves: [...cur.moves, enc(r.sq, r.give)] };
      if (!settle(g2)) { commit(g2); vibrate(HAPT.ok); }
    }, 650);
  }
  // A save written inside that window would restore a half-finished pair, so
  // the reply is re-scheduled whenever the board is left waiting.
  useEffect(() => {
    if (!hydrated || !playing) return undefined;
    if (moves.length % 2 === 1) scheduleReply(moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, moves.length]);

  function handOver() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    if (selSq == null || pos[selSq] >= 0) return;
    // A placement that fills the board needs no piece handed over.
    const fills = pos.filter((p) => p < 0).length === 1;
    if (!fills && selGive == null) { say('Now pick the piece your opponent gets.'); return; }
    const g2 = { ...cur, moves: [...cur.moves, enc(selSq, fills ? -1 : selGive)] };
    if (!g2.t0) g2.t0 = Date.now();
    setSelSq(null); setSelGive(null); setHintSq(null);
    // Every move gets the same neutral tick: a buzz on the move that threw the
    // win away would be a notice you can feel.
    if (settle(g2)) return;
    vibrate(HAPT.ok);
    commit(g2);
    scheduleReply(g2.moves);
  }

  function onWell(sq) {
    if (!playing) return;
    if (!gRef.current.t0) startGame();
    if (!myTurn || pos[sq] >= 0) return;
    setSelSq((v) => (v === sq ? null : sq));
  }
  function onChip(p) {
    if (!myTurn) return;
    setSelGive((v) => (v === p ? null : p));
  }

  // One free hint, first play only: rings the well the gift goes on, never the
  // piece to hand back.
  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed || cur.moves.length) return;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    setHintSq(PUZZLE.keySq);
    say('The gift goes on the ringed well. The piece to hand back is yours to find.');
  }

  // Give up: the game ends, scores nothing, and the board is left as it stands.
  // The winning move is NOT played out: the position is replayable.
  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'revealed', end: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    endHold.hold(HOLD_SHORT);
    commit(g2);
    setSelSq(null); setSelGive(null);
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setArmReveal(false);
    setArmRestart(false);
    commit({ ...freshState(), t0: Date.now() });
    setSelSq(null); setSelGive(null); setHintSq(null); setEndClosed(false);
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
    return withRef(`mindloftdaily.com/gift${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  // No answers in the share: one square per turn of yours, green while the win
  // was kept, red on the turn that let it go, grey after that.
  function shareText() {
    let sq = '';
    for (let i = 0; i < W.mine; i++) sq += i < W.kept ? '\u{1F7E9}' : i === W.kept && W.threw ? '\u{1F7E5}' : '⬜';
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const sun = PUZZLE.sunday ? ' · Sunday' : '';
    const head = won
      ? `Gift #${PUZZLE.num}${sun} · won · ${errors === 0 ? 'clean' : `${errors} slip`} · ${elapsed}${hintBit}${streakBit}`
      : g.status === 'lost'
        ? `Gift #${PUZZLE.num}${sun} · ${g.end === 'draw' ? 'drawn' : 'lost'} · ${elapsed}`
        : `Gift #${PUZZLE.num} · gave up`;
    return `${head}\n${sq}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Gift #${PUZZLE.num}, a daily Quarto endgame from Mind Loft. Win in ${WIN_IN}.\n${shareUrl()}`
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
      lead={`Place your gift, then choose what they get. Win in ${WIN_IN}.`}
      banner={<>Sixteen pieces, each <b>tall or short</b>, <b>dark or light</b>, <b>square or round</b> and <b>hollow or solid</b>. Four in a row, a column or a long diagonal that share <b>any one</b> of those traits win, for whoever placed the fourth.</>}
      steps={[
        <>Your opponent has <b>handed you a piece</b>, the gift. <b>Tap an empty well</b> to put it there: the gold ring marks the square.</>,
        <>Then <b>tap a piece</b> from the ones still off the board. That is what your opponent has to place next. Press <b>Hand it over</b>.</>,
        <>Your opponent places it and hands you one back. You can force a win by your <b>{WIN_IN === 2 ? 'second' : WIN_IN === 3 ? 'third' : WIN_IN === 4 ? 'fourth' : 'fifth'} placement</b>, the gift counting as the first, and exactly <b>one</b> first move does it.</>,
        <>One free <b>hint</b>, on your first ever play, rings the well the gift goes on, never the piece to hand back.</>,
      ]}
      knack={<>Every piece you hand over is one your opponent gets to place. Give one that cannot finish a line anywhere, and leave a board where every piece they could give you back finishes one.</>}
      note={<>There is <b>no take-back</b>. If your placement finishes a line you win on the spot and the piece you picked stays put. Nothing on the board says how you are doing: let the win slip and your opponent will play for one of its own.</>}
      footer="A win scores 10. Losing, a full board with no line, or giving up scores nothing. Ties break on fewest tries, then fastest time. The Sunday Edition is the longest win of the week, decided by the last piece on the board."
    />
  );

  const verdict = !playing ? (END_LINE[g.end] || END_LINE.revealed) : null;
  const turnNo = W.mine + (awaitingReply ? 0 : 1);
  const fills = pos.filter((p) => p < 0).length === 1;
  const ready = myTurn && selSq != null && (selGive != null || fills);
  const lastSq = W.last && !W.last.me && playing ? W.last.sq : null;
  const opening = moves.length === 0;

  const status = !playing
    ? verdict
    : awaitingReply
      ? 'Your opponent is placing your piece...'
      : opening
        ? 'Place the gift, then choose what they get.'
        : 'Your opponent placed it (ringed) and handed you a new piece.';

  const boardEl = (
    <div className="gf-bd">
      <div className="gf-grid" role="grid" aria-label="The board">
        {pos.map((p, sq) => {
          const empty = p < 0;
          const isSel = selSq === sq || hintSq === sq;
          const cls = ['gf-well', empty && myTurn ? 'open' : '', isSel ? 'sel' : '', lineCells.has(sq) ? 'line' : '', lastSq === sq && !isSel ? 'last' : ''].filter(Boolean).join(' ');
          return (
            <button key={sq} type="button" className={cls} onClick={() => onWell(sq)} disabled={!empty || !myTurn}
              aria-label={`Row ${(sq >> 2) + 1}, column ${(sq & 3) + 1}: ${empty ? 'empty' : pieceName(p)}`}>
              {!empty ? <Piece p={p} /> : (selSq === sq && myTurn ? <Piece p={hand} ghost /> : null)}
            </button>
          );
        })}
      </div>
    </div>
  );

  const sideEl = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div style={{ background: STAGE ? 'var(--stg-surf2, rgba(255,255,255,.06))' : T.white, borderRadius: 14, padding: 14, boxShadow: `0 0 0 1px ${STAGE ? 'var(--stg-line, rgba(255,255,255,.1))' : 'rgba(11,15,26,.1)'}` }}>
        <div className="gf-gift">
          <div className="gf-giftwell">{playing && !awaitingReply ? <Piece p={hand} /> : null}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <div className="gf-eyebrow" style={{ color: 'var(--gf-gold-ink)' }}>{opening ? 'Step 1 · place your gift' : 'Place your gift'}</div>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, color: INK }}>
              {playing && !awaitingReply ? <>You have the {pieceName(hand)} piece.</> : playing ? <>Your opponent is choosing.</> : <>Game over.</>}
            </div>
            <div style={{ fontSize: 13, color: FADED, fontWeight: 600 }}>Tap an empty well to place it.</div>
          </div>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div className="gf-eyebrow" style={{ color: FADED }}>{opening ? 'Step 2 · choose what they get' : 'Choose what they get'}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: FADED }}>{pool.length} left</div>
        </div>
        <div className="gf-pool" role="group" aria-label="Pieces still off the board">
          {pool.map((p) => (
            <button key={p} type="button" className={`gf-chip${selGive === p ? ' sel' : ''}`} onClick={() => onChip(p)} disabled={!myTurn || fills}
              aria-label={`Hand over the ${pieceName(p)} piece`} aria-pressed={selGive === p}>
              <Piece p={p} small />
            </button>
          ))}
        </div>
      </div>
      {playing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {hintOk && !g.hintUsed && opening ? (
            <button className="gf-tool" onClick={useHint} title="Ring the well the gift goes on (one hint, first play only)">
              <Lightbulb size={14} /> Hint
            </button>
          ) : <span />}
          <button type="button" className="gf-go" onClick={handOver} disabled={!ready}>{fills ? 'Place it' : 'Hand it over'}</button>
        </div>
      )}
    </div>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="gift" name="Gift" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="gift" quizId={PUZZLE.quizId}
          name="Gift"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: turnNo, k: 'turn' },
            { v: WIN_IN, k: 'win in' },
          ] : [
            { v: errors, k: 'slips' },
            { v: W.mine, k: 'turns' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="gf-wrap gf-root" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.gf-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .gf-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .gf-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .gf-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          ${GF_CSS}
        ` }} />

        <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="gift"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
          blocks={'GIFT'.split('').map((ch, i) => (
              <div key={i} style={{ width: 36, height: 42, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 22, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column', maxWidth: 660, margin: '0 auto' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Gift is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>A Quarto endgame. Place the piece you were handed, then choose the piece your opponent gets. Win in {WIN_IN}: exactly one first move does it, and there is no take-back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="gf-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {!playing && <span style={{ whiteSpace: 'nowrap' }}>slips <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>win in <b style={{ color: ACC_INK, fontWeight: 500 }}>{WIN_IN}</b></span>
          </div>
          )}

          <div className="gf-play">
            <div>
              {boardEl}
              <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 600, color: FADED, textAlign: 'center', lineHeight: 1.45 }}>
                Four in a line that share any one trait wins: tall, short, dark, light, square, round, hollow or solid.
              </div>
            </div>
            {sideEl}
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span role="status" style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? ACC_INK : (endHold.held ? INK : FADED) }}>
              {status}
            </span>
          </div>

        {started && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.10)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                Pick a well and a piece, then hand it over. There is no take-back.
              </span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmRestart(false); setArmReveal(Date.now()); } }}
                  title={armReveal ? 'Ends the puzzle and scores nothing' : 'End the puzzle now, scoring nothing'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <Eye size={13} style={{ flexShrink: 0 }} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartGame(); } else { setArmReveal(false); setArmRestart(Date.now()); } }}
                  title={armRestart ? 'Records a 0 and resets the board' : 'Record a 0 and reset the board'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
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
              {/* The winning first move is shown ONLY to a player who won. The
                  position is replayable, so naming it to someone who missed it
                  spends the puzzle for good. */}
              {won && W.kept > 0 ? (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  {PUZZLE.total - 1} other first moves were on the board, and not one of them forces a win.
                  {errors > 0 ? ' You let the win slip once on the way and got it back anyway.' : ''}
                </div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  We are not printing the move. The win is still there in the position, so take another run at it.
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, where the last piece on the board decides it.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Gift in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new position drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/gift?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Gift &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}
                    <a href="/gift" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Gift &rarr;</a>
                    {' · '}
                    <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
              name="Gift"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${errors} ${errors === 1 ? 'slip' : 'slips'} · ${W.mine} ${W.mine === 1 ? 'turn' : 'turns'} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Gift all time` : 'all-time rank' }
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
                  href: `/gift?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Gift', sub: `No. ${prevPuzzle.num}, yesterday’s puzzle`, href: `/gift?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
      </div>

        {!STAGE && <GamePanel self="gift" name="Gift" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="gift" name="Gift" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="gift"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="gift" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Gift to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s position, every day.</li>
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
          self="gift"
          won={won}
          headline={won ? <>You won it.</> : g.status === 'lost' ? <>{g.end === 'draw' ? 'A draw.' : 'Beaten to it.'}</> : <>You scored 0%</>}
          subline={won
            ? <>Solved &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>Not solved &middot; the win is still in the position</>}
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
            <button className="gf-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Gift</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Gift is a free daily Quarto puzzle from Mind Loft. Quarto is played with sixteen pieces, each tall or short, dark or light, square or round, and hollow or solid, on a four by four board. The twist is that you never choose the piece you play: your opponent hands it to you, and once you have placed it you choose the piece they must play next. Four pieces in a row, a column or a long diagonal that share any one trait win for whoever placed the fourth.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every day you start in the endgame, holding a piece on a part-filled board, and you can force a win. Exactly one first move does it, a square for your piece plus the piece you hand back, and every other first move lets your opponent win or hold a draw, checked by two independent solvers. Then play it out: the computer defends as well as Quarto can be played, and nothing on the board tells you how you are doing until the game is over.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new position drops every day at midnight Eastern. The week runs from a win in two on a nearly full board on Monday to longer wins with more pieces still in play by Saturday, and the Sunday Edition is a win in five where the last piece on the board decides it. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More endgames: <a href="/four" style={{ color: INK, fontWeight: 800 }}>Four</a>, a won Connect Four position, and <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, a forced checkmate in two.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
