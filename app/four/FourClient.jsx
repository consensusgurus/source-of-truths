'use client';

// Four — the daily Connect Four position.
//
// Each day: a real position with YOU to move and a forced win. Weekdays take
// four of your moves, Sundays five. Exactly ONE column still wins, and here is
// the part that makes it bite: a wrong drop is NOT refused. The game plays on
// against a perfect engine, so the win never comes back and you spend the rest
// of the board trying to hold a draw.
//
// The engine is app/four/c4.js, an exact solver (negamax, alpha-beta,
// transposition table). It answers every position, on or off the puzzle line,
// which is why a losing drop can be allowed to play out at all. Its replies are
// deterministic: among equally stubborn defences it breaks ties with an order
// derived from the puzzle id, so every player faces the same game and the
// leaderboard compares like with like.
//
// Score is the outcome: 10 for the win, 4 for a draw, and nothing at all for a
// loss or for giving up. Ties break on fewest wrong drops, then fastest time.
//
// Same daily plumbing as Mate/Etch/Hedge: banked boards gated by Eastern date on
// the server (app/four/page.js), per-puzzle localStorage saves, /four?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, RotateCcw, Smartphone } from 'lucide-react';
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
  deserialize, play, legalMoves, winsAt, winningCells, scoreMoves, engineMove,
  idOrder, COLS, ROWS,
} from './c4';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: T.blueDark,       // Four identity — the board blue
  accentSoft: '#e8eefc',
  green: T.successDeep,
};
// The board itself, in the colours everyone already knows: a blue grid, red
// discs for you, yellow for the engine.
// BOTH STOPS ON ONE TOKEN. The cabinet's vertical gradient collapses to a flat
// surface on the stage and keeps its blue on the Loft, where neither token
// exists and each stop falls back to its own literal.
const BOARD_BLUE = `var(--stg-surf, ${T.blueDark})`;
const BOARD_BLUE_DARK = 'var(--stg-surf, #152a63)';
// An empty hole is the PAGE showing through the cabinet, which is the clearest
// way to draw a hole. It needs the stronger rule around it, not the hairline:
// at --stg-line the ring all but vanished on the light register's white board.
const HOLE = 'var(--stg-ground, #f1f3f7)';
// You are the category accent; the engine is SLATE, the register's second ink
// (owner, 2026-09-01: the engine's disc was a board LIFT, --stg-b4, which on
// the light register is a 20% grey over a white board and simply vanished, and
// End Game's gold sat on that same white at under 2:1). A disc is a piece, not
// a surface, so it takes ink rather than a lift: #aab5c7 on the dark board,
// #3f4757 on the white one, tellable from the gold and from the holes in both.
const RED = 'var(--stg-acc, #d62828)';
const RED_DARK = 'var(--stg-acc, #a11d1d)';
const YELLOW = 'var(--stg-ink2, #f4c02c)';
const YELLOW_DARK = 'var(--stg-mute2, #c08f0e)';
// Rims as inset shadows, transparent off-stage so the Loft disc is untouched.
// Both discs take the register's INK as their rim: near-white on the dark
// board, near-black on the white one, so a gold disc on a white board has an
// edge the board cannot swallow. The rim is what carries the piece on the
// light register; the fill alone did not.
const DISC_RIM_YOU = 'var(--stg-ink, transparent)';
const DISC_RIM_FOE = 'var(--stg-ink, transparent)';

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_four_help_seen';
const STATS_KEY = 'sot_four_stats';

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

// ─── position helpers ──────────────────────────────────────────────────────
// The live board is rebuilt from the banked start plus the column list, so a
// save is a handful of digits and can never drift out of step with the game.
function boardFrom(cells, moves) {
  const b = deserialize(cells);
  for (const c of moves) play(b, c);
  return b;
}
const outcomeOf = (score) => (score > 0 ? 1 : score < 0 ? -1 : 0);

// The two columns the hint puts out of play: losing drops, chosen by the
// puzzle's own order so the hint is the same for everyone and survives a reload.
function hintColumns(puzzle) {
  const b = deserialize(puzzle.cells);
  const open = legalMoves(b).filter((c) => c !== puzzle.key);
  const order = idOrder(puzzle.quizId).filter((c) => open.includes(c));
  return order.slice(0, 2).sort((a, b2) => a - b2);
}

const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

function freshState() {
  return { v: 1, moves: [], errors: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null, val: null, pending: null };
}

export default function FourClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_four_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [hoverCol, setHoverCol] = useState(null);
  const [shake, setShake] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armRestart, setArmRestart] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  // The finished board starts turned OVER, showing what to do next.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  // Hold the end card back so the move that ended the game is visible first.
  const endHold = useEndHold(1100);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('four', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('four'); }, [g.hintUsed]);
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
  const LOFT = isLoft('four');
  const STAGE = isStage('four', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('four');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('four'), '--stg-acc-lt': gameColorLight('four'), '--stg-onramp-lt': gameOnrampLight('four'), '--stg-acc-ink-lt': gameAccentInkLight('four') };
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
  const drawn = g.status === 'drawn';
  const errors = g.errors;
  // What the round posted. Read ONLY by the cap, and only once the round is
  // over: End Game never shows a running verdict.
  const finalScore = won ? 10 : drawn ? 4 : 0;
  const endScore = finalScore;
  // An odd move count means the engine's reply is still in flight.
  const awaitingReply = moves.length % 2 === 1;

  const pos = useMemo(() => boardFrom(PUZZLE.cells, moves), [PUZZLE, moves]);
  const lastCol = moves.length ? moves[moves.length - 1] : null;
  const lastRow = useMemo(() => (lastCol == null ? null : pos.heights[lastCol] - 1), [pos, lastCol]);
  const myTurn = playing && started && !awaitingReply && !thinking;
  // The value of the position for you, carried in state so the header can say
  // how many moves the win still needs without re-solving on every render.
  // The position's value is still CARRIED in state (scheduleReply reads it to
  // decide whether a drop cost anything) but it is no longer READ OUT. A header
  // that counted the win down and then said "gone" was the loudest loss notice
  // on the board, and the point of the 2026-08-11 rule is that nothing tells you
  // the round is decided while you still have drops to make.
  const hintCols = useMemo(() => (g.hintUsed ? hintColumns(PUZZLE) : []), [g.hintUsed, PUZZLE]);

  // The four cells to light up once somebody connects.
  const winLine = useMemo(() => {
    if (playing || lastCol == null || lastRow == null || lastRow < 0) return null;
    const who = pos.cells[lastCol * ROWS + lastRow];
    if (!who || !winsAt(pos, lastCol, lastRow, who)) return null;
    return winningCells(pos, lastCol, lastRow, who);
  }, [playing, pos, lastCol, lastRow]);

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
        if (done || g.t0) localStorage.setItem('sot_four_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_four_day');
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
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'four', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'four', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'four', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'four', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'four', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_four_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    const acted = cur.moves.length > 0 || cur.hintUsed;
    if (!acted || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.errors, progress: progressOf(cur), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // HOW FAR THIS RUN GOT (migration 51). A loss here scores 0, which used to
  // leave every losing player tied and let the board rank them by who lost
  // FASTEST. This is the ranking term that separates them: drops that kept the
  // forced win alive. Play alternates and you move first, so half the list
  // rounded up is your own drops; every one that threw value away was already
  // counted as an error, so the difference is the run of correct play.
  // It is NOT score, so a loss still earns nothing; it only orders the losers,
  // deepest first, with the clock settling the rest.
  function progressOf(g2) {
    const myDrops = Math.ceil((g2.moves || []).length / 2);
    return Math.max(0, myDrops - (g2.errors || 0));
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
  }

  function finish(g2, status) {
    const done = { ...g2, status, tEnd: Date.now() };
    if (!done.t0) done.t0 = Date.now();
    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    postResult(done, status === 'won' ? 10 : status === 'drawn' ? 4 : 0);
    // A loss lands on the OPPONENT's move, so the player has not seen it yet:
    // the board holds for HOLD_LONG with the deciding move still lit and the
    // verdict line readable. A win is your own move, so it keeps the old beat.
    // A draw is the win thrown away and reads like a loss, so it holds too.
    endHold.hold(status === 'won' ? HOLD_SHORT : HOLD_LONG);
    commit(done);
  }

  // The engine answers a beat after your disc lands. The solve runs INSIDE the
  // timeout, never in the click handler, so the browser paints your drop before
  // the search blocks the thread. The same single solve does three jobs: it
  // picks the reply, it re-values the position for you, and by comparing that
  // value with the one before your drop it decides whether the drop was a
  // mistake.
  function scheduleReply(afterMoves) {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      const cur = gRef.current;
      if (cur.status !== 'playing' || cur.moves.length !== afterMoves.length) { setThinking(false); return; }
      const b = boardFrom(PUZZLE.cells, cur.moves);
      if (!legalMoves(b).length) { setThinking(false); finish(cur, 'drawn'); return; }
      const em = engineMove(b, PUZZLE.quizId);
      if (!em) { setThinking(false); return; }
      const before = cur.pending == null ? outcomeOf(cur.val == null ? PUZZLE.rootScore : cur.val) : cur.pending;
      const after = outcomeOf(-em.score);
      let next = { ...cur, moves: [...cur.moves, em.col], val: -em.score, pending: null };
      // A drop that gives value away is COUNTED but never ANNOUNCED. The board
      // used to say the win was gone the moment it went, which decided the round
      // out loud while there were still drops to make; the verdict now waits for
      // the game to actually end. The tally still feeds the errors tie-break,
      // the progress term and the end card, so nothing downstream changes.
      if (after < before) {
        next = { ...next, errors: next.errors + 1 };
      }
      const r = b.heights[em.col];
      const engineWins = winsAt(b, em.col, r, 2);
      setThinking(false);
      if (engineWins) { finish(next, 'lost'); return; }
      const b2 = boardFrom(PUZZLE.cells, next.moves);
      if (!legalMoves(b2).length) { finish(next, 'drawn'); return; }
      commit(next);
      vibrate(HAPT.ok);   // the same tick either way, so touch never grades the drop
    }, 430);
  }
  // A save made inside that window would restore a half-finished turn, so the
  // reply is re-scheduled whenever the board is left waiting for one.
  useEffect(() => {
    if (!hydrated || !playing || !g.t0) return undefined;
    if (moves.length % 2 === 1) scheduleReply(moves);
    return () => { if (replyTimer.current) clearTimeout(replyTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, playing, g.t0, moves.length]);

  function drop(col) {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.moves.length % 2 === 1) return;
    const b = boardFrom(PUZZLE.cells, cur.moves);
    if (b.heights[col] >= ROWS) { setShake((k) => k + 1); return; }
    const r = b.heights[col];
    const iWin = winsAt(b, col, r, 1);
    const nextMoves = [...cur.moves, col];
    // `pending` carries what the position was worth to you BEFORE this drop, so
    // the reply timeout can tell whether the drop cost anything without having
    // to solve twice.
    const g2 = { ...cur, moves: nextMoves, pending: outcomeOf(cur.val == null ? PUZZLE.rootScore : cur.val) };
    if (!g2.t0) g2.t0 = Date.now();
    if (iWin) { finish(g2, 'won'); return; }
    vibrate(HAPT.ok);
    commit(g2);
    scheduleReply(nextMoves);
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    say('Two columns that do not win are now greyed out. The rest is on you.');
  }

  // Give up: the round ends and scores nothing, and the board is left exactly as
  // it stands. This used to play the win out so the answer sat on the board, but
  // these positions are worth replaying and printing the answer spends the
  // puzzle for good, so the key is now shown only to a player who found it.
  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    // You ended it yourself, so there is nothing to catch up on.
    endHold.hold(HOLD_SHORT);
    commit(g2);
  }

  // A replay deals the same board again with the clock already running. The start
  // tile exists to keep the FIRST attempt's timer honest; a replay never becomes
  // the recorded result, so re-reading the directions is pure friction.
  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    setArmReveal(false);
    setArmRestart(false);
    commit({ ...freshState(), t0: Date.now() });
    setEndClosed(false);
  }

  // Restart deals the same board again mid-game. The abandoned run is recorded
  // exactly as giving up records it, because this control only appears once the
  // player has pressed Start and walking away from a losing board cannot be
  // free. Unlike giving up it does NOT play the answer out: the player is about
  // to replay this very board.
  function restartGame() {
    const cur = gRef.current;
    if (cur.status === 'playing' && cur.t0) {
      if (replyTimer.current) clearTimeout(replyTimer.current);
      postResult({ ...cur, status: 'gaveup', tEnd: Date.now() }, 0);
    }
    resetGame();
  }

  function shareUrl() {
    return withRef(`mindloftdaily.com/four${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function shareText() {
    const g5 = won ? 5 : drawn ? 2 : g.status === 'lost' ? 1 : 0;
    const squares = (won ? '\u{1F534}' : drawn ? '\u{1F7E1}' : '⬜').repeat(Math.max(1, g5)) + '⬜'.repeat(5 - Math.max(1, g5));
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const verdict = won ? `won in ${PUZZLE.winIn}` : drawn ? 'held a draw' : g.status === 'lost' ? 'lost it' : 'gave up';
    const missBit = g.status === 'gaveup' ? '' : ` · ${errors === 0 ? 'no wrong drops' : `${errors} wrong drop${errors === 1 ? '' : 's'}`}`;
    return `Four #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${verdict}${missBit} · ${elapsed}${hintBit}${streakBit}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Four #${PUZZLE.num} — the daily Connect Four position from Mind Loft.\n${shareUrl()}`
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
      lead={<>You are <b>red</b>, you drop first, and the position is already won for you: a forced <b>win in {PUZZLE.winIn}</b> of your moves.</>}
      chips={[
        { label: 'Win = 10', tone: 'good' },
        { label: 'Draw = 4', tone: 'warn' },
        { label: 'Win thrown away, or gave up = 0', tone: 'bad' },
      ]}
      steps={[
        <><b>Tap a column</b> to drop a disc. Exactly <b>one</b> column wins, every other drop throws it away.</>,
        <>A wrong drop is <b>not taken back</b>. The engine plays on and it is perfect, so once the win is gone it never comes back and you are playing for a draw.</>,
        <>One free <b>hint</b>, on your first ever play, greys out two columns that do not win.</>,
      ]}
      knack="The engine always answers with its most stubborn defence, and the same one for everybody, so the game you play is the game everyone else plays."
      footer="Ties break on fewest wrong drops, then fastest time. Weekdays are a win in four, Sundays step up to a win in five."
    />
  );

  const statusLine = () => {
    if (!playing) {
      if (won) return 'Four in a row. That is the win.';
      if (drawn) return 'Board full. Drawn.';
      if (g.status === 'lost') return 'The engine got there first.';
      return 'You ended it there. The win is still in the position.';
    }
    if (thinking || awaitingReply) return 'The engine is thinking...';
    // No live evaluation. A line that counted the win down would announce the
    // loss by falling silent, which is the same leak as the old toast.
    return moves.length === 0 ? 'Your move. One column keeps this.' : 'Your move.';
  };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="four" name="Four" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. END GAME: the cap shows exactly what the strip showed at that moment and
          no more. The tally is kept and posted throughout but only APPEARS once
          the round is over, because a counter ticking up is itself a notice that
          the move was wrong. What is left while you play is the clock and the
          puzzle's own brief, both of which announce nothing. */}
      {LOFT && (
        <Cap gameKey="four" quizId={PUZZLE.quizId}
          name="Four"
          cat="End Game"
          outcome={playing ? null : (won ? 'won' : (drawn ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
            { v: PUZZLE.winIn, k: 'moves to win' },
          ] : [
            { v: endScore, k: 'score' },
            { v: errors, k: errors === 1 ? 'wrong drop' : 'wrong drops' },
            { v: PUZZLE.winIn, k: 'moves to win' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="fr-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.fr-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .fr-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .fr-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .fr-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .fr-col{display:flex;flex-direction:column;gap:0;cursor:pointer;-webkit-tap-highlight-color:transparent;min-width:0;}
          .fr-col.dead{cursor:default;}
          .fr-cell{position:relative;aspect-ratio:1 / 1;display:flex;align-items:center;justify-content:center;min-width:0;}
          .fr-hole{width:82%;height:82%;border-radius:50%;background:${HOLE};box-shadow:inset 0 3px 5px rgba(0,0,0,0.28), inset 0 0 0 1px var(--stg-cell-line, transparent);}
          .fr-disc{width:82%;height:82%;border-radius:50%;box-shadow:inset 0 -3px 6px rgba(0,0,0,0.32), inset 0 3px 4px rgba(255,255,255,0.35), inset 0 0 0 1.5px var(--fr-rim, transparent);}
          .fr-disc.fresh{animation:frdrop .34s cubic-bezier(.35,.05,.55,1);}
          @keyframes frdrop{0%{transform:translateY(-420%);}70%{transform:translateY(0);}82%{transform:translateY(-9%);}100%{transform:translateY(0);}}
          /* THE WINNING FOUR (owner, 2026-09-01). The ring was var(--white): on the
             light register that is a white ring on a white board, so the line
             that decided the game was lit and nobody could see it. It is INK
             now, which is the one colour guaranteed to read on the board in
             either register, and the rest of the discs step back while the
             four pulse, so the line is the only thing left on the board. */
          .fr-disc.lit{animation:frlit 1.15s ease-in-out infinite;position:relative;z-index:1;}
          .fr-board.won .fr-disc:not(.lit){opacity:.38;}
          .fr-board.won .fr-hole{opacity:.55;}
          @keyframes frlit{0%,100%{transform:scale(1);box-shadow:inset 0 -3px 6px rgba(0,0,0,0.32), 0 0 0 3px var(--stg-ink, var(--white)), 0 0 0 6px color-mix(in srgb, var(--stg-ink, #fff) 55%, transparent);}50%{transform:scale(1.08);box-shadow:inset 0 -3px 6px rgba(0,0,0,0.32), 0 0 0 3px var(--stg-ink, var(--white)), 0 0 0 11px color-mix(in srgb, var(--stg-ink, #fff) 18%, transparent);}}
          .fr-ghost{position:absolute;width:82%;height:82%;border-radius:50%;border:2px dashed rgba(255,255,255,0.72);}
          .fr-board.shake{animation:frshake .34s ease;}
          @keyframes frshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
          .fr-caps{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-bottom:6px;padding:0 8px;}
          .fr-cap{height:7px;border-radius:4px;background:transparent;}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>


        {!LOFT && (
        <DailyMasthead
          slug="four"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; Win in 5</span>}
          blocks={'FOUR'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the play area sits on the navy stage, which runs full bleed
            and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing && !endHold.held ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Four is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>You are red, and the position is won: there is a forced win in {PUZZLE.winIn}. Only one column keeps it. Drop the wrong one and the engine, which is perfect, will not give it back.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="fr-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
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
          {/* These figures move UP into the cap on a loft page; printing them
              twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {/* The tally is kept and posted throughout, but only SHOWN once the
                game is over: a counter ticking up is itself a notice that the
                drop was wrong. */}
            {!playing && <span style={{ whiteSpace: 'nowrap' }}>wrong drops <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{errors}</b></span>}
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {/* The puzzle's brief, not a live readout. */}
              <>win in <b style={{ color: INK, fontWeight: 500 }}>{PUZZLE.winIn}</b></>
            </span>
          </div>
          )}

          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            {/* the lip above the board, so a hovered column reads before you commit */}
            <div className="fr-caps" aria-hidden="true">
              {Array.from({ length: COLS }).map((_, c) => (
                <div key={c} className="fr-cap" style={{ background: myTurn && hoverCol === c && pos.heights[c] < ROWS ? RED : 'transparent' }} />
              ))}
            </div>
            <div
              key={shake}
              className={`fr-board${shake ? ' shake' : ''}${winLine ? ' won' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, background: `linear-gradient(180deg, ${BOARD_BLUE}, ${BOARD_BLUE_DARK})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: 6, touchAction: 'manipulation' }}
            >
              {Array.from({ length: COLS }).map((_, c) => {
                const full = pos.heights[c] >= ROWS;
                const greyed = hintCols.includes(c) && playing;
                const landing = pos.heights[c];
                return (
                  <div
                    key={c}
                    className={`fr-col${full || !myTurn ? ' dead' : ''}`}
                    onMouseEnter={() => setHoverCol(c)}
                    onMouseLeave={() => setHoverCol((v) => (v === c ? null : v))}
                    onClick={() => { if (!gRef.current.t0) { startGame(); return; } if (myTurn && !full) drop(c); }}
                    role="button"
                    tabIndex={-1}
                    aria-label={`Column ${c + 1}${full ? ', full' : ''}`}
                    style={{ opacity: greyed ? 0.4 : 1 }}
                  >
                    {Array.from({ length: ROWS }).map((__, i) => {
                      const r = ROWS - 1 - i;                    // top row first
                      const idx = c * ROWS + r;
                      const v = pos.cells[idx];
                      const isLast = lastCol === c && lastRow === r;
                      const lit = winLine && winLine.includes(idx);
                      const ghost = myTurn && hoverCol === c && !full && r === landing;
                      return (
                        <div key={r} className="fr-cell">
                          {v === 0 && <div className="fr-hole" />}
                          {v !== 0 && (
                            <div
                              className={`fr-disc${isLast && playing ? ' fresh' : ''}${lit ? ' lit' : ''}`}
                              style={{
                                background: v === 1
                                  ? `radial-gradient(circle at 34% 30%, ${RED}, ${RED_DARK})`
                                  : `radial-gradient(circle at 34% 30%, ${YELLOW}, ${YELLOW_DARK})`,
                                '--fr-rim': v === 1 ? DISC_RIM_YOU : DISC_RIM_FOE,
                              }}
                            />
                          )}
                          {ghost && <span className="fr-ghost" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, minHeight: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: endHold.held ? 15 : 13, fontWeight: 800, color: playing ? `var(--stg-acc-ink, ${COLORS.accent})` : (endHold.held ? `var(--stg-ink, ${COLORS.ink})` : `var(--stg-mute, ${COLORS.faded})`) }}>
              {statusLine()}
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: FADED, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: RED, display: 'inline-block' }} /> you
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: YELLOW, display: 'inline-block', marginLeft: 6 }} /> engine
            </span>
          </div>

          {playing && hintOk && !g.hintUsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <button className="fr-tool" onClick={useHint} title="Grey out two losing columns (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(35,58,99,0.45)', color: '#1b3268' }}>
                <Lightbulb size={14} /> Hint
              </button>
            </div>
          )}

        {/* Controls. These sit INSIDE the board card: on the navy stage a bare
            row has nothing to sit on, and the card is meant to hold the game. */}
        {started && (
          /* Both controls arm on the first tap and fire on the second. The armed
             label is deliberately SHORT and each button reserves a fixed width,
             because the old armed copy ("Tap again — records a loss and deals a
             fresh board") was far wider than "Restart": the row reflowed on the
             first tap and the button slid out from under the reader's finger, so
             the confirming tap landed on nothing. The consequence now prints on
             its own line BELOW the row, where it cannot move either button. */
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED }}>
                Tap a column to drop. There is no take-back.
              </span>
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmRestart(false); setArmReveal(Date.now()); } }}
                  title={armReveal ? 'Ends the game and scores nothing' : 'End the game now, scoring nothing'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <Eye size={13} style={{ flexShrink: 0 }} /> {armReveal ? 'Press again' : 'Give up'}
                </button>
                <button onClick={() => { if (armRestart) { if (Date.now() - armRestart < ARM_MIN_MS) return; setArmRestart(false); restartGame(); } else { setArmReveal(false); setArmRestart(Date.now()); } }}
                  title={armRestart ? 'Records a loss and deals a fresh board' : 'Record a loss and deal a fresh board'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armRestart ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 5, minWidth: 104, padding: 0 }}>
                  <RotateCcw size={13} style={{ flexShrink: 0 }} /> {armRestart ? 'Press again' : 'Restart'}
                </button>
              </span>
            </div>
            {(armReveal || armRestart) && (
              <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 700, color: `var(--stg-ink, ${COLORS.rust})`, marginTop: 6, textAlign: 'right', lineHeight: 1.4 }}>
                {armReveal ? 'Ends the game and scores nothing.' : 'Records a loss and deals a fresh board.'}
              </div>
            )}
          </div>
        )}
        </div>
      )}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && !endHold.held && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              {/* The key and the idea behind it are shown ONLY to a player who
                  found it. Four is a replayable position, so naming the column to
                  someone who lost or gave up spends the puzzle for good. */}
              {won ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                    The key: <span style={{ color: ACC_INK }}>column {PUZZLE.key + 1}</span>.
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>{PUZZLE.motif}</div>
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '8px 0 0', lineHeight: 1.5 }}>
                  We are not printing the column. The win is still sitting in this position, so take another run at it.
                </div>
              )}
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition, a win in five.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Four in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new position drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/four?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Four &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/four" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Four &rarr;</a>
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
              name="Four"
              catRank={catRank}
              outcome={won ? 'won' : (drawn ? 'part' : 'lost')}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${endScore} of 10 \u00b7 ${errors} wrong drop${errors === 1 ? '' : 's'} \u00b7 win in ${PUZZLE.winIn} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Four all time` : 'all-time rank' }
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
                  href: `/four?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Four', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/four?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="four" name="Four" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="four" name="Four" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="four"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="four" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Four to your Home Screen</div>
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
          self="four"
          won={won}
          headline={won ? <>You found it.</> : drawn ? <>Drawn.</> : g.status === 'lost' ? <>You lost the win.</> : <>You scored 0%</>}
          subline={won
            ? <>10/10 &middot; {errors === 0 ? 'no wrong drops' : `${errors} wrong drop${errors === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : drawn
              ? <>4/10 &middot; the win went, you held the draw</>
              : g.status === 'lost'
                ? <>0/10 &middot; that was not the column</>
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
            <button className="fr-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Four</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Four is a free daily Connect Four puzzle from Mind Loft. Every position is a real, reachable board with you to move and a forced win already there, and your job is to find the one column that keeps it. Tap a column and the disc drops, so there is nothing to learn before you play.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Each board has exactly one winning column, checked by two independent solvers, and the win takes exactly the stated number of moves against the stiffest defence, never fewer. What makes it bite is that a wrong drop is not refused. The engine is perfect and it plays the game out, so a careless move costs the win for good and leaves you fighting for a draw.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new position drops every day at midnight Eastern, and Sundays step up to a win in five. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/mate" style={{ color: INK, fontWeight: 800 }}>Mate</a>, our daily chess endgame, <a href="/etch" style={{ color: INK, fontWeight: 800 }}>Etch</a>, our daily nonogram, and <a href="/suds" style={{ color: INK, fontWeight: 800 }}>Suds</a>, our daily sudoku.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
