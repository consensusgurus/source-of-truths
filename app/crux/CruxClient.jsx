'use client';

// Crux — a clue-less mini crossword with letter-feedback guessing and
// hidden category pairs.
//
// Eight hidden words interlock in a mini crossword grid. There are no clues:
// the only hints are four categories, each owning exactly two of the eight
// words (which slots? that's the puzzle). Every slot is solved by guessing —
// type any letters, get locked/close feedback per letter — and locked
// letters stay in the grid, bleeding into crossing slots. The whole
// board shares one guess budget. Solved words are then filed under their
// category to finish. Filing is penalty-free — the categories' job is to be
// the clues (and the traps) during the guessing phase.
//
// Soft launch: this page is intentionally NOT linked from the homepage, the
// /quizzes hub, or the sitemap. Reachable only at /crux.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, RotateCcw, X, ChevronLeft, ChevronRight, Swords, Smartphone, Lightbulb } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import DailyEndCard from '../DailyEndCard';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { isLoft } from '@/lib/loft';
import LoftCap from '../LoftCap';
import GamePanel from '../GamePanel';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { useStageRoom } from '@/lib/stage-fit';
import { gameColorLight, gameColor, CATEGORY_RAMP, RAMP_INK, STAGE_GROUND, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.blue,
  rust: T.danger,
  faded: T.muted,
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
// Static furniture only: everything here is one colour whatever the game is
// doing. Anything that varies by state is set at its source above, and the
// cl-kx class exists to keep this rule off the four letter-key states.
//
// !important is load-bearing rather than lazy: these elements carry INLINE
// styles from the Loft build, and a plain rule loses to an inline one.
// The vertical room the STAGE reserves above the board. The Loft page kept
// 430px for a masthead, a stat bar and a cap; the stage shows one line. The
// grid's cell clamp reads it, so the board sizes itself against the real
// chrome rather than against a number that happened to agree once.
const STAGE_VROOM = 330;
const STAGE_BOARD_CSS = `
/* THE BOARD IS THE ONLY THING IN THIS ROW. It stood beside an 88px ladder
   gutter until 2026-09-01; with the gutter gone .cx-a is a centring wrapper
   and nothing else, and the board has its full column back. */
.stage-page .cx-a{display:flex;justify-content:center;}
.stage-page .cx-a > *{flex:0 1 660px;min-width:0;}
@media(max-width:640px){.stage-page .cx-a{align-items:stretch;}}
.stage-page .cl-key:not(.cl-kx){background:var(--stg-surf2,rgba(255,255,255,0.08))!important;
  color:var(--stg-ink,#e9edf4)!important;border:1px solid var(--stg-line,rgba(255,255,255,0.11))!important;}
.stage-page .cl-btn{background:transparent!important;color:var(--stg-ink,#e9edf4)!important;
  border:1.5px solid var(--stg-line2,rgba(255,255,255,0.17))!important;}
.stage-page .cl-cat{border:1px solid var(--stg-line,rgba(255,255,255,0.11));border-radius:8px;}
.stage-page .cx-tries{color:var(--stg-mute,#8b95a8);}
/* The category strip is the second biggest block on the page after the board,
   and it is a row of labels, not a panel. Trimmed to read closer to the
   ladder's weight, which is what buys the board its rows back. */
.stage-page .cl-cats{gap:6px;}
.stage-page .cl-cat{padding:6px 9px !important;gap:3px;}
.stage-page .cl-cat-nm{font-size:11px !important;}
.stage-page .cl-cat-ws{gap:4px !important;}
.stage-page .cl-cat-ws > *{padding:1px 9px !important;font-size:11.5px !important;}
.stage-page hr{border-color:var(--stg-line,rgba(255,255,255,0.11));}
`;

// Editorial ink-and-paper identity (owner-approved mockup, 2026-07-11).
// Fraunces + DM Mono are already loaded site-wide by app/layout.js.
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const TILE = T.white;
const TILE_BORDER = 'rgba(28,30,36,0.42)';

// iOS/iPadOS never fires beforeinstallprompt — A2HS lives in Safari's share
// sheet, so the button opens instructions there instead.
const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));


// Category palette, easiest -> trickiest: yellow, green, blue, RED — the
// fourth is red (owner call 2026-07-07) so the set isn't the familiar
// grouping-puzzle quartet.
const CAT_COLORS = [
  { bg: '#e6b93f', tc: '#5c4a06', sq: '\u{1F7E8}' },
  { bg: '#5aa96a', tc: '#173f1f', sq: '\u{1F7E9}' },
  { bg: '#5a97dd', tc: '#0c3a66', sq: '\u{1F7E6}' },
  { bg: '#d96363', tc: '#571212', sq: '\u{1F7E5}' },
];

// ─── Puzzles ────────────────────────────────────────────────────────────────
// One entry per drop. `live` gates by Eastern date: /crux plays the newest
// puzzle whose live date has arrived, so future puzzles can be banked here
// and ship themselves at ET midnight. Each puzzle keys its own localStorage
// save (sot_crux_<num>), catalog id, and leaderboard. /crux?p=N pins an
// archived puzzle (the hub's dated tiles link that way).
const HELP_KEY = 'sot_crux_help_seen';
const STATS_KEY = 'sot_crux_stats';

// Every puzzle answer is always a legal guess, even the proper nouns that a
// Scrabble-style list omits (JUNO, MINERVA, URANUS...).
// A length is only judgeable if the guess dictionary carries a real vocabulary
// at it. Below this, the list is padding rather than coverage and the gate
// stands down. See the dictionary loader in the component.
const DICT_COVER_MIN = 500;

function buildAnswerWords(puzzles) {
  return new Set(puzzles.flatMap((pz) => pz.categories.flatMap((c) => c.words.map((w) => w.toLowerCase()))));
}

function etToday() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) {
    const p = puzzles.find((x) => x.num === forceNum);
    if (p) return p;
  }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : puzzles[0];
}

function slotCells(s) {
  return s.word.split('').map((ch, i) => ({
    r: s.dir === 'A' ? s.row : s.row + i,
    c: s.dir === 'A' ? s.col + i : s.col,
    ch,
  }));
}

// key "r,c" -> { ch, slots: [slotIds] }
function buildCells(puzzle) {
  const m = new Map();
  for (const s of puzzle.slots) {
    for (const cl of slotCells(s)) {
      const k = `${cl.r},${cl.c}`;
      if (!m.has(k)) m.set(k, { ch: cl.ch, slots: [] });
      m.get(k).slots.push(s.id);
    }
  }
  return m;
}
function slotLabel(id) {
  return `${parseInt(id, 10)}-${id.endsWith('A') ? 'Across' : 'Down'}`;
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ms until the next midnight Eastern — the next puzzle drop.
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

// ─── Personal stats + streak (localStorage) ────────────────────────────────
// One record per puzzle number, first completion only (replays don't rewrite
// history). Streak = consecutive puzzle numbers finished, ending at today's
// number (still alive if today isn't done yet). First run backfills from the
// per-puzzle saves that already exist in this browser.
function puzzleStoreKey(p) {
  return `sot_crux_${p.num}${p.rev ? `_r${p.rev}` : ''}`;
}
// -- Score and guess accounting ---------------------------------------------
// Score = a point per solved word + a point per correct placement, MINUS one
// point when the player bought the paid hint (owner rule, 2026-08-12: the paid
// reveal costs 1 guess AND 1 point). Floored at 0.
//
// The WIN test reads the RAW solve and never this penalized number. A player
// who cracks the whole grid having bought a hint has still cracked it, and
// scores total - 1; testing `score === total` for the win would call that a
// loss and hand them a defeat screen on a solved board.
function hintCost(sv) {
  return sv && sv.hintPaid ? 1 : 0;
}
function rawScore(sv, total) {
  return sv && sv.status === 'won' ? total : ((sv.order || []).length + (sv.filedRight || 0));
}
function scoreOf(sv, total) {
  return Math.max(0, rawScore(sv, total) - hintCost(sv));
}
// Guesses spent, derived from the REMAINING budget rather than by summing
// slotGuesses: the paid hint spends a guess that belongs to no slot, so the
// budget is the only place that sees every spend. Equal to the old sum on any
// save written before the paid hint existed.
function guessesOf(sv, puzzle) {
  const left = sv && typeof sv.left === 'number' ? sv.left : puzzle.guesses;
  return Math.max(0, puzzle.guesses - left);
}

function backfillStats(puzzles) {
  const rec = {};
  for (const p of puzzles) {
    try {
      const raw = localStorage.getItem(puzzleStoreKey(p));
      if (!raw) continue;
      const sv = JSON.parse(raw);
      if (!sv || sv.status === 'playing') continue;
      const total = p.slots.length * 2;
      rec[p.num] = { s: scoreOf(sv, total), t: total, g: guessesOf(sv, p), won: sv.status === 'won' };
    } catch (e) {}
  }
  return { v: 1, rec };
}
function getStats(puzzles) {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    if (s && s.v === 1 && s.rec) return s;
  } catch (e) {}
  const s = backfillStats(puzzles);
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}
function recordStat(puzzles, num, entry) {
  const s = getStats(puzzles);
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
  // average guesses only over records that carry a guess count (server-merged
  // history from other devices doesn't)
  const withG = nums.filter((n) => typeof rec[n].g === 'number');
  const totG = withG.reduce((a, n) => a + rec[n].g, 0);
  return { played, perfect, cur, max, avgG: withG.length ? totG / withG.length : 0, avgN: withG.length };
}

// Local saves only know about puzzles finished IN THIS BROWSER. The server has
// every completed play (quiz_results), so prior days and other devices come
// from /api/quiz/me `recent` history. First attempts only, and a local record
// wins over the server one (it carries the guess count).
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1) continue;
    if (rec[p.num]) continue;
    const t = p.slots.length * 2;
    const sc = Math.max(0, Math.min(t, Math.round(((m.scorePct || 0) / 100) * t)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t, g: null, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

// Same anon identity the other quiz boards use, so plays attribute correctly
// and a later leaderboard join claims this browser's past results.
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

// Per-letter feedback marking with duplicate handling.
export function computeMarks(guess, answer) {
  const n = answer.length;
  const marks = Array(n).fill('x');
  const rem = {};
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) marks[i] = 'g';
    else rem[answer[i]] = (rem[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < n; i++) {
    if (marks[i] !== 'g' && rem[guess[i]] > 0) {
      marks[i] = 'y';
      rem[guess[i]] -= 1;
    }
  }
  return marks;
}

function freshState(puzzle) {
  return {
    v: 1,
    greens: {},          // "r,c" -> true (letter is locked correct)
    solved: {},          // slotId -> true
    slotGuesses: {},     // slotId -> guesses spent on that slot
    present: {},         // slotId -> "ABC" letters known in word
    presentN: {},        // slotId -> { L: known minimum count of L in the word }
    absent: {},          // slotId -> "XYZ" letters known absent
    lastGuess: {},       // slotId -> { word, marks[] } (latest entry of guessLog)
    guessLog: {},        // slotId -> [{ word, marks[] }], every try on that word, oldest first
    assigned: {},        // WORD -> category index (correct filings only)
    order: [],           // slotIds in solve order
    filedRight: null,    // set by the single Lock-it-in: words correctly categorized
    hintUsed: false,     // the free first-play letter reveal (lib/hint-gate.js)
    hintPaid: false,     // the paid letter reveal: 1 guess + 1 point, open to all
    left: puzzle.guesses,
    status: 'playing',   // playing | won | lost
    t0: null,
    tEnd: null,
  };
}

export default function CruxClient({ puzzles = [], forceNum = null, loft = false }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const ANSWER_WORDS = useMemo(() => buildAnswerWords(puzzles), [puzzles]);
  const ROWS = PUZZLE.rows;
  const COLS = PUZZLE.cols;
  const STORE_KEY = `sot_crux_${PUZZLE.num}${PUZZLE.rev ? `_r${PUZZLE.rev}` : ''}`;
  const SLOT = useMemo(() => Object.fromEntries(PUZZLE.slots.map((s) => [s.id, s])), [PUZZLE]);
  const CELLS = useMemo(() => buildCells(PUZZLE), [PUZZLE]);
  const [g, setG] = useState(() => freshState(PUZZLE));
  const [sel, setSel] = useState(PUZZLE.slots[0].id);
  const [typed, setTyped] = useState('');
  const [pick, setPick] = useState(null); // solved word chosen for filing
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false); // effect-set so SSR/hydration match
  const [kbdOpen, setKbdOpen] = useState(false); // desktop: on-screen keyboard collapsed by default
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

  const [armLock, setArmLock] = useState(false);
  // The finished board starts turned OVER, showing what to do next. Revealing
  // turns it back to the board, which on a miss is the thing worth studying.
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // Two letter reveals exist and they are separate things. The FREE one is the
  // site-wide first-play hint (lib/hint-gate.js): one per player, on their very
  // first ever Crux, no cost. Eligibility is re-read whenever stats change, so
  // the server-history merge can revoke it for a returning player on a new
  // device. The PAID one (g.hintPaid) is open to everyone, once per puzzle, and
  // costs 1 guess plus 1 point. A first-timer can use both on that one board.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('crux', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('crux'); }, [g.hintUsed]);
  // eslint-disable-next-line no-unused-vars -- the chip moved into DailyChrome
  // (QuizNavHeader fetches its own identity); the fetch below is kept so the
  // cross-device stats merge it triggers still runs.
  const [player, setPlayer] = useState(null);
  const [anim, setAnim] = useState(null);        // { id, flip: {key->i}, pulse: {key->true} } for the last guess
  const [endAnim, setEndAnim] = useState(false); // category cascade, only on the live end transition
  const [countdown, setCountdown] = useState('');
  const animSeq = useRef(0);
  const animTimer = useRef(null);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const wordSetRef = useRef(null);
  const coveredLenRef = useRef(null);
  const triesRef = useRef(null);
  const viewedRef = useRef(false);

  // The tries list is height-capped so the board and keyboard still fit on one
  // screen, so pin it to the newest try whenever one lands or the slot changes.
  const triesCount = ((g.guessLog || {})[sel] || []).length;
  useEffect(() => {
    const el = triesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [triesCount, sel]);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1) {
          const st = { ...freshState(PUZZLE), ...saved };
          // saves written before the guess history existed carry only lastGuess
          if (!st.guessLog || !Object.keys(st.guessLog).length) {
            st.guessLog = Object.fromEntries(
              Object.entries(st.lastGuess || {}).filter(([, v]) => v && v.word).map(([k, v]) => [k, [v]])
            );
          }
          setG(st);
          // The save carries no selection, so a resumed board opened on the
          // first slot even when that slot was already solved, and typing into
          // a solved slot is (rightly) ignored. Every key then went nowhere
          // until the player happened to click another word. Land on the
          // first UNSOLVED slot instead.
          if (st.status === 'playing' && st.solved[PUZZLE.slots[0].id]) setSel(nextUnsolved(st, PUZZLE.slots[0].id));
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats(puzzles)); } catch (e) {}
    setHydrated(true);
  }, []);

  // live countdown to the next drop, shown once the puzzle is over
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
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    // same-device day breadcrumb for cross-puzzle recommendations — only for
    // TODAY'S puzzle (archive replays must not mark today as played)
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_crux_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_crux_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, PUZZLE]);

  // ---- metrics + leaderboard (same /api/quiz/* flow as every other board) ----
  // Guess dictionary (lazy, cached, ~255k words, 3 to 13 letters). It fails
  // open TWICE over, because a gate that cannot judge must never be the thing
  // that says no:
  //
  //   1. Until it loads, any letters are accepted. Never block play on a fetch.
  //   2. A guess whose LENGTH the list barely covers is accepted too, and the
  //      covered lengths are derived from the file itself rather than assumed.
  //
  // Rule 2 exists because rule 1 did not save us. The list shipped 3 to 8
  // letters only (it was the 2-to-8 Scrabble list the rack games use), so on
  // crux-8-9-26 the 9-letter TRIBUTARY slot had a guess space of five words:
  // every real word a player typed came back "Not in the word list", and a
  // regular abandoned the board. The list now runs to 13 letters, the longest
  // a 13-wide grid can hold, and if it is ever truncated again the affected
  // lengths degrade to "accepts anything" instead of "accepts nothing".
  useEffect(() => {
    fetch('/crux-words.txt')
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => {
        if (!t) return;
        const words = t.split('\n').filter((w) => /^[a-z]{2,}$/.test(w));
        if (words.length <= 10000) return;
        const byLen = new Map();
        for (const w of words) byLen.set(w.length, (byLen.get(w.length) || 0) + 1);
        coveredLenRef.current = new Set([...byLen].filter(([, n]) => n >= DICT_COVER_MIN).map(([L]) => L));
        wordSetRef.current = new Set(words);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    // cross-device stats: merge this player's server-side play history
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
              setStats((cur) => mergeServerStats(cur || getStats(puzzles), d.recent, puzzles));
            }
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
  }, []);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }

  const slot = SLOT[sel];
  const cells = useMemo(() => (slot ? slotCells(slot) : []), [slot]);
  const editable = cells.filter((cl) => !g.greens[`${cl.r},${cl.c}`]);
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;   // not begun: show the start tile in place of the board
  const started = playing && !!g.t0;   // clock running: show the board
  const focusMode = playing && !showChrome;
  const LOFT = loft || isLoft('crux');
  // THE STAGE. When it is on, this page owns its ground and its chrome
  // outright: no Grain, no DailyChrome, no LoftCap, no footer and no tail.
  // See app/StageChrome.jsx for why a daily is a sitting rather than a page.
  // The register comes from the shared store, not from a private effect, so
  // the switch in the cap repaints this root without a prop between them.
  // Still resolved in an effect: the server cannot know what is stored.
  const [stageTheme] = useStageTheme();
  const STAGE = isStage('crux', searchParams);
  // THE ACCENT AS A VARIABLE. It is only ever used as a CSS colour, so
  // every call site below themes itself and none of them had to be found.
  // The literals are published on the root element instead.
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('crux');
  // THE BOARD'S OWN COLORS.ink, and the reason it is not STAGE_C. Crux is a Word game,
  // Word is step 0 of the ramp, and the puzzle's first category is drawn from
  // step 0 too, so the accent IS the first category's colour. A solved word
  // painted in it claims a category it may not belong to. On this board colour
  // means category; every other state is neutral, and neutral reads as LOCKED
  // in both registers (near-white on the dark ground, near-black on the pale).
  const BOARD_C = STAGE ? 'var(--stg-ink)' : COLORS.ink;
  const BOARD_ON = STAGE ? 'var(--stg-ground)' : T.white;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('crux'), '--stg-acc-lt': gameColorLight('crux'), '--stg-onramp-lt': gameOnrampLight('crux'), '--stg-acc-ink-lt': gameAccentInkLight('crux') };
  // One source for a category's colour, so the chips, the end-of-game grid
  // reveal and the ladder can never disagree about which is which.
  const catTone = (ci) => (STAGE
    // INK ON A FIXED RAMP STEP IS ALWAYS DARK, and that is not the same rule as
    // ink on the accent. --stg-onramp flips with the register because the ACCENT
    // flips: pale step on dark, dark twin on light. These chips do not flip —
    // they are always the pale CATEGORY_RAMP step — so the sweep that moved
    // every RAMP_INK to --stg-onramp made them white-on-pastel in light mode.
    ? { bg: CATEGORY_RAMP[ci % CATEGORY_RAMP.length], tc: RAMP_INK }
    : CAT_COLORS[ci]);
  // TEXT and FILL are different problems here, which is why there are two
  // names rather than one restyled COLORS. Near-black TEXT is invisible on
  // this ground and has to move; a near-black FILL is a perfectly good
  // object on it and stays. Conflating the two is what would turn every
  // dark chip on the board into a pale one.
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  // Every value here is a ROLE, never a fixed alpha. An empty cell is a
  // SQUARE (its edge has to be seen before anything is in it, so it takes the
  // board-cell pair rather than a card's lift), a spent one is inert, and the
  // selection is a wash of whatever the accent currently is, so all three
  // follow the register instead of assuming the ground is dark.
  const SPAL = STAGE ? {
    tile: 'var(--stg-cell)',
    tileB: 'var(--stg-cell-line)',
    sel: 'color-mix(in srgb, var(--stg-ink) 10%, transparent)',
    selCur: 'color-mix(in srgb, var(--stg-ink) 18%, transparent)',
    selB: 'color-mix(in srgb, var(--stg-ink) 38%, transparent)',
    key: 'var(--stg-surf2)',
    keyB: '1.5px solid var(--stg-line)',
    spent: 'var(--stg-panel)',
    spentInk: 'var(--stg-dim,#5a657d)',
  } : null;

  // ---- input ----
  const onKey = useCallback((k) => {
    if (g.status !== 'playing') return;
    if (g.left <= 0) return;
    if (!slot || g.solved[sel]) return;
    if (k === 'ENTER') submit();
    else if (k === 'BACK') setTyped((t) => t.slice(0, -1));
    else if (/^[A-Z]$/.test(k)) setTyped((t) => (t.length < editable.length ? t + k : t));
  }, [g, sel, slot, typed, editable.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDown(e) {
      if (showHelp) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter') { e.preventDefault(); onKey('ENTER'); }
      else if (e.key === 'Backspace') { e.preventDefault(); onKey('BACK'); }
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    }
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [onKey, showHelp]);

  function sweepAutoSolve(g2) {
    for (const s of PUZZLE.slots) {
      if (g2.solved[s.id]) continue;
      const full = slotCells(s).every((cl) => g2.greens[`${cl.r},${cl.c}`]);
      if (full) {
        g2.solved = { ...g2.solved, [s.id]: true };
        g2.order = [...g2.order, s.id];
      }
    }
  }

  function nextUnsolved(g2, fromId) {
    const ids = PUZZLE.slots.map((s) => s.id);
    const start = Math.max(0, ids.indexOf(fromId));
    for (let i = 1; i <= ids.length; i++) {
      const id = ids[(start + i) % ids.length];
      if (!g2.solved[id]) return id;
    }
    return fromId;
  }

  function submit() {
    if (!playing || !slot || g.solved[sel]) return;
    if (typed.length < editable.length) { say('Not enough letters'); return; }
    let ti = 0;
    const letters = cells.map((cl) => (g.greens[`${cl.r},${cl.c}`] ? cl.ch : typed[ti++]));
    const guess = letters.join('');
    if (guess !== slot.word && !ANSWER_WORDS.has(guess.toLowerCase())) {
      const ws = wordSetRef.current;
      const covered = coveredLenRef.current;
      // Only judge a guess at a length the list actually covers. See the
      // dictionary loader above for why this guard is not paranoia.
      if (ws && covered && covered.has(guess.length) && !ws.has(guess.toLowerCase())) {
        say('Not in the word list');
        return;
      }
    }
    const marks = computeMarks(guess, slot.word);

    const g2 = { ...g };
    if (!g2.t0) g2.t0 = Date.now();
    g2.left = g.left - 1;
    g2.slotGuesses = { ...g.slotGuesses, [sel]: (g.slotGuesses[sel] || 0) + 1 };
    const greens2 = { ...g.greens };
    cells.forEach((cl, i) => { if (marks[i] === 'g') greens2[`${cl.r},${cl.c}`] = true; });
    g2.greens = greens2;

    const pres = new Set((g.present[sel] || '').split('').filter(Boolean));
    const abs = new Set((g.absent[sel] || '').split('').filter(Boolean));
    marks.forEach((m, i) => {
      const L = guess[i];
      if (m === 'y') pres.add(L);
      else if (m === 'x') {
        const elsewhere = marks.some((mm, j) => j !== i && guess[j] === L && mm !== 'x');
        if (!elsewhere) abs.add(L);
      }
    });
    // how many of each letter this guess proved are in the word (green + yellow).
    // Kept as a per-letter COUNT so a letter stops being advertised once every
    // known copy of it is locked in place (see presentUnplaced below).
    const need = {};
    marks.forEach((m, i) => { if (m !== 'x') need[guess[i]] = (need[guess[i]] || 0) + 1; });
    const pn = { ...((g.presentN || {})[sel] || {}) };
    Object.keys(need).forEach((L) => { if (need[L] > (pn[L] || 0)) pn[L] = need[L]; });

    g2.present = { ...g.present, [sel]: [...pres].join('') };
    g2.presentN = { ...(g.presentN || {}), [sel]: pn };
    g2.absent = { ...g.absent, [sel]: [...abs].join('') };
    // Every try on a word stays on screen. A yellow proves the letter is in the
    // word but NOT in that square, and that positional read is destroyed the
    // moment an older guess is overwritten by a newer one, so the log keeps them
    // all rather than showing only the most recent try.
    const tryRec = { word: guess, marks };
    g2.lastGuess = { ...g.lastGuess, [sel]: tryRec };
    g2.guessLog = { ...(g.guessLog || {}), [sel]: [...((g.guessLog || {})[sel] || []), tryRec] };

    // reveal animation: every cell of the guessed slot flips in sequence, and
    // newly locked letters that also sit in an unsolved crossing slot pulse —
    // the bleed is the signature mechanic, make it visible.
    const flip = {};
    const pulse = {};
    cells.forEach((cl, i) => {
      const k = `${cl.r},${cl.c}`;
      flip[k] = i;
      if (marks[i] === 'g' && !g.greens[k]) {
        const inf = CELLS.get(k);
        if (inf && inf.slots.some((id) => id !== sel && !g.solved[id])) pulse[k] = true;
      }
    });
    animSeq.current += 1;
    setAnim({ id: animSeq.current, flip, pulse });
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnim(null), cells.length * 60 + 1400);

    if (guess === slot.word) {
      g2.solved = { ...g2.solved, [sel]: true };
      g2.order = [...g2.order, sel];
      say(`${slot.word} — solved. File it under a category.`);
    }
    sweepAutoSolve(g2);

    const allSolved = PUZZLE.slots.every((s) => g2.solved[s.id]);
    if (!allSolved && g2.left <= 0) {
      setTyped('');
      setPick(null);
      setG(concludeOutOfGuesses(g2));
      return;
    }
    setTyped('');
    if (g2.solved[sel] && g2.status === 'playing') {
      setSel(nextUnsolved(g2, sel));
      setPick(slot.word); // solved word arms for filing — one tap on a category files it
    }
    setG(g2);
  }

  // One completed puzzle = one play (win or loss). Score = words solved of 8,
  // time is the tiebreak — same shape the connections-format boards report.
  // Only puzzle-end transitions post, so resumed/saved puzzles never double-count;
  // replays post again on their own completion, matching the site-wide metric.
  const REC_KEY = `sot_crux_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts: a guess spent, a hint
    // used, or a word solved. Opening the puzzle and dismissing the start tile
    // does not log a 0-score attempt.
    const acted = Object.values(g.slotGuesses).some((n) => n > 0) || g.hintUsed || g.hintPaid || g.order.length > 0;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: PUZZLE.slots.length * 2, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, scoreOverride) {
    abandon.markFlushed();
    const sc = scoreOverride != null ? scoreOverride : g2.order.length;
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const gu = guessesOf(g2, PUZZLE);
    const total = PUZZLE.slots.length * 2;
    // personal stats: first completion of this puzzle number only. `won` reads
    // the board's own verdict rather than the score, since a hinted full solve
    // is a crack that happens to score total - 1.
    try { setStats(recordStat(puzzles, PUZZLE.num, { s: sc, t: total, g: gu, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total, correct: sc, guessesUsed: gu, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Placements are PROVISIONAL and silent: no correctness feedback until the
  // player locks in the full board (owner decision 2026-07-07). The only
  // verdict is a count of misfiled words — never which ones.
  function fileWord(word, ci) {
    if (!playing) return;
    const occupants = Object.keys(g.assigned).filter((w) => g.assigned[w] === ci && w !== word);
    if (occupants.length >= PUZZLE.categories[ci].words.length) {
      say(`${PUZZLE.categories[ci].name} is already full — tap a word there to take it back`);
      return;
    }
    setG({ ...g, assigned: { ...g.assigned, [word]: ci } });
    setPick(null);
  }
  function unfile(word) {
    if (!playing) return;
    const assigned2 = { ...g.assigned };
    delete assigned2[word];
    setG({ ...g, assigned: assigned2 });
    setPick(null);
  }
  // Out of guesses ends the puzzle, full stop (owner call, 2026-08-01). The old
  // behaviour left the player in limbo at zero: the keyboard is hidden at zero
  // guesses and the submit button only appears once every solved word happens
  // to be filed, so a player holding an unfiled word saw a dead screen with no
  // input and no button and reported it as a freeze. Now the board reveals
  // itself and the end card pops immediately, scoring whatever was solved plus
  // whatever was already filed.
  function concludeOutOfGuesses(gIn) {
    const solvedSlots = PUZZLE.slots.filter((s) => gIn.solved[s.id]);
    const right = solvedSlots.filter((s) => gIn.assigned[s.word] !== undefined
      && PUZZLE.categories[gIn.assigned[s.word]].words.includes(s.word)).length;
    const g2 = { ...gIn, filedRight: right, status: 'lost', tEnd: Date.now() };
    setEndAnim(true);
    postResult(g2, scoreOf(g2, PUZZLE.slots.length * 2));
    return g2;
  }

  // ONE lock-in, and it concludes the puzzle. Score is out of 16: a point per
  // word solved plus a point per word correctly categorized. Reached by solving
  // every word; running the budget out ends the puzzle on its own instead.
  // No lock-in, no score — abandoned puzzles never post.
  function lockIn() {
    if (!playing) return;
    const solvedSlots = PUZZLE.slots.filter((s) => g.solved[s.id]);
    const allSolved = solvedSlots.length === PUZZLE.slots.length;
    const placedAll = solvedSlots.every((s) => g.assigned[s.word] !== undefined);
    if (!placedAll || solvedSlots.length === 0) return;
    if (!allSolved && g.left > 0) return;
    const right = solvedSlots.filter((s) => PUZZLE.categories[g.assigned[s.word]].words.includes(s.word)).length;
    const total = PUZZLE.slots.length * 2;
    // The verdict is the RAW solve; the paid hint comes off the score only.
    const raw = solvedSlots.length + right;
    const g2 = { ...g, filedRight: right, status: raw === total ? 'won' : 'lost', tEnd: Date.now() };
    setEndAnim(true);
    postResult(g2, scoreOf(g2, total));
    setG(g2);
    if (raw === total) setJustWon(true);
  }

  // Safety net: any state that arrives at zero guesses still 'playing' ends on
  // sight. Covers saves written under the old post-budget filing rule, which
  // would otherwise resume straight back into the dead screen.
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.left > 0) return;
    if (PUZZLE.slots.every((s) => g.solved[s.id])) return;
    setPick(null);
    setG(concludeOutOfGuesses(g));
  }, [g.status, g.left, g.t0]); // eslint-disable-line react-hooks/exhaustive-deps

  // A hint reveals the next empty letter of the selected slot. Two of them
  // exist and they cost different things:
  //   free: the site-wide first-play hint, once per player ever, no cost.
  //   paid: once per puzzle, open to everyone, costs 1 guess AND 1 point off
  //          the final score (owner rule, 2026-08-12).
  // The paid one needs TWO guesses in the budget, not one: spending the last
  // guess would trip the out-of-guesses rule and end the puzzle on the spot,
  // which is not what a player buying a letter is asking for.
  const freeHintOk = playing && hintOk && !g.hintUsed;
  const paidHintOk = playing && !g.hintPaid;
  const canAffordPaid = g.left >= 2;
  function revealHint(paid) {
    if (!playing || !slot || g.solved[sel]) return;
    if (paid ? !(paidHintOk && canAffordPaid) : !freeHintOk) return;
    const target = cells.find((cl) => !g.greens[`${cl.r},${cl.c}`]);
    if (!target) return;
    const k = `${target.r},${target.c}`;
    const g2 = { ...g, greens: { ...g.greens, [k]: true } };
    if (paid) { g2.hintPaid = true; g2.left = g.left - 1; }
    else g2.hintUsed = true;
    if (!g2.t0) g2.t0 = Date.now();
    sweepAutoSolve(g2);
    animSeq.current += 1;
    setAnim({ id: animSeq.current, flip: { [k]: 0 }, pulse: {} });
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => setAnim(null), 1400);
    setTyped('');
    if (g2.solved[sel]) {
      // The cost rides along in the message: a reveal that finishes the word
      // skips the plain hint toast, and the player still needs to hear it.
      say(paid
        ? `${slot.word} — solved, for 1 guess and 1 point. File it under a category.`
        : `${slot.word} — solved. File it under a category.`);
      setSel(nextUnsolved(g2, sel));
      setPick(slot.word);
    } else {
      say(paid ? 'Letter revealed — 1 guess and 1 point.' : 'Free hint used — that was the one.');
    }
    setG(g2);
  }

  function cellClick(r, c) {
    const info = CELLS.get(`${r},${c}`);
    if (!info || !playing) return;
    const unsolvedIds = info.slots.filter((id) => !g.solved[id]);
    // If any word through this cell is still unsolved, tapping selects it for
    // guessing (the original behaviour).
    if (unsolvedIds.length) {
      const pool = unsolvedIds;
      if (pool.length > 1 && pool.includes(sel)) setSel(pool.find((id) => id !== sel));
      else setSel(pool[0]);
      setTyped('');
      return;
    }
    // Otherwise every word here is solved — pick one up off the board to file
    // it (the word bank now lives on the grid itself). Prefer an unfiled word;
    // if two solved words cross here, repeated taps cycle between them. Tapping
    // a word that's already filed lifts it back out to move it.
    const words = info.slots.map((id) => SLOT[id].word);
    const unfiled = words.filter((w) => g.assigned[w] === undefined);
    let target;
    if (unfiled.length) {
      target = (pick && unfiled.includes(pick) && unfiled.length > 1) ? unfiled.find((w) => w !== pick) : unfiled[0];
    } else {
      target = (pick && words.includes(pick)) ? (words.find((w) => w !== pick) || words[0]) : words[0];
    }
    if (g.assigned[target] !== undefined) {
      const assigned2 = { ...g.assigned };
      delete assigned2[target];
      setG({ ...g, assigned: assigned2 });
      setPick(target);
    } else {
      setPick(pick === target ? null : target);
    }
    setTyped('');
  }

  function cycleSlot(dirn) {
    const ids = PUZZLE.slots.map((s) => s.id).filter((id) => !g.solved[id]);
    if (!ids.length) return;
    const i = Math.max(0, ids.indexOf(sel));
    setSel(ids[(i + (dirn === 1 ? 1 : ids.length - 1)) % ids.length]);
    setTyped('');
  }

  // Dismissing the start tile begins the clock (sets t0) and marks rules seen.
  // No-op once started, so re-reading rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(PUZZLE)); setSel(PUZZLE.slots[0].id); setTyped(''); setPick(null); setEndClosed(false);
  }

  const guessesUsed = guessesOf(g, PUZZLE);
  const hintsUsed = (g.hintUsed ? 1 : 0) + (g.hintPaid ? 1 : 0);
  // Named on the end card so a full solve that reads total - 1 explains itself.
  const hintNote = hintsUsed ? (
    <> &middot; {hintsUsed} hint{hintsUsed === 1 ? '' : 's'}{g.hintPaid ? ' (−1 pt)' : ''}</>
  ) : null;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // Share of players this run beat, from the exact score distribution the
  // board API returns. Own attempt excluded; hidden under a small sample.
  const beatPct = (() => {
    if (g.status === 'playing') return null;
    const dist = board.scoreDist;
    if (!dist) return null;
    const my = scoreOf(g, PUZZLE.slots.length * 2);
    let below = 0, all = 0;
    for (const [k, v] of Object.entries(dist)) {
      const n = Number(v) || 0;
      all += n;
      if (Number(k) < my) below += n;
    }
    const others = all - 1;
    if (others < 10) return null;
    return Math.max(0, Math.min(100, Math.round((below / others) * 100)));
  })();

  // Copyable grid, one row GROUPED BY CATEGORY (yellow pair, green pair,
  // blue pair, red pair): color = that word solved AND filed right, black =
  // missed (unsolved or misfiled). No letters or words leak.
  function shareText() {
    const rows = PUZZLE.categories.map((cat, ci) =>
      cat.words.map((w) => (g.assigned[w] === ci ? CAT_COLORS[ci].sq : '⬛')).join(''));
    const score = scoreOf(g, PUZZLE.slots.length * 2);
    // Hint use is flagged, one bulb each, streak rides along.
    const guessBit = `${guessesUsed} guess${guessesUsed === 1 ? '' : 'es'}`;
    const hintBit = hintsUsed ? ` · ${'💡'.repeat(hintsUsed)}` : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = `Crux #${PUZZLE.num} · ${score}/${PUZZLE.slots.length * 2} · ${guessBit} · ${elapsed}${hintBit}${streakBit}`;
    return `${head}\n${rows.join('\n')}\n${shareUrl()}`;
  }
  // Archive results must link the puzzle they describe — a bare /crux would
  // hand the recipient a different board than the score they just saw.
  function shareUrl() {
    return withRef(`mindloftdaily.com/crux${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Crux #${PUZZLE.num} \u2014 a clueless crossword. Can you crack it?\n${shareUrl()}`
      : shareText();
    // Mobile: native share sheet (like the big daily puzzles) — the receiving
    // app gets the text directly, line breaks intact, no clipboard quirks.
    // Desktop: clipboard with the Copied flip.
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

  // next editable cell (cursor) in the selected slot
  const cursorKey = (() => {
    if (!playing || !slot || g.solved[sel]) return null;
    const cl = editable[typed.length];
    return cl ? `${cl.r},${cl.c}` : null;
  })();

  // typed letters mapped onto cells
  const typedAt = {};
  if (slot && !g.solved[sel]) editable.forEach((cl, i) => { if (typed[i]) typedAt[`${cl.r},${cl.c}`] = typed[i]; });

  const selCellKeys = new Set(cells.map((cl) => `${cl.r},${cl.c}`));

  // Letters known to be in this word that are NOT yet locked in place. A letter
  // drops off once every known copy of it sits on a green cell, so a placed
  // letter never reads as "there is another one of these somewhere". Counts
  // matter: a word with two Ns and one N placed still advertises the second.
  const presentUnplaced = (() => {
    if (!slot) return '';
    const known = {};
    for (const ch of (g.present[sel] || '')) known[ch] = Math.max(known[ch] || 0, 1);
    const pn = (g.presentN || {})[sel] || {};
    for (const L of Object.keys(pn)) known[L] = Math.max(known[L] || 0, pn[L]);
    const placed = {};
    cells.forEach((cl) => { if (g.greens[`${cl.r},${cl.c}`]) placed[cl.ch] = (placed[cl.ch] || 0) + 1; });
    let out = '';
    for (const L of Object.keys(known)) out += L.repeat(Math.max(0, known[L] - (placed[L] || 0)));
    return out;
  })();

  // keyboard letter states for the selected slot
  const keyState = {};
  if (slot) {
    const presStr = g.present[sel] || '';
    const absStr = g.absent[sel] || '';
    for (const ch of absStr) keyState[ch] = 'x';
    for (const ch of presStr) keyState[ch] = 'y';
    cells.forEach((cl) => { if (g.greens[`${cl.r},${cl.c}`]) keyState[cl.ch] = 'g'; });
  }

  const solvedUnfiled = PUZZLE.slots
    .filter((s) => g.solved[s.id] && g.assigned[s.word] === undefined)
    .map((s) => s.word);
  const readyToLock = playing
    && g.order.length > 0
    && PUZZLE.slots.filter((s) => g.solved[s.id]).every((s) => g.assigned[s.word] !== undefined)
    && (g.order.length === PUZZLE.slots.length || g.left <= 0);

  const lost = g.status === 'lost';
  // A finish that was not a win does NOT give the answers away on its own: the
  // board stays as the player left it until they press Reveal on the back of
  // the card. `shown` is that gate, and it is only a gate on a loft page, so
  // every other surface keeps the old behaviour of revealing immediately.
  const shown = lost && (!LOFT || revealed);
  const won = g.status === 'won';
  // The finished score, and the IQ the run earned. The hook only fetches once
  // the game is over, so a live game costs nothing.
  const endScore = scoreOf(g, PUZZLE.slots.length * 2);
  const iq = useIqStanding({ game: 'crux', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'crux', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'crux', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'crux', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'crux', active: LOFT && !playing });

  // Play space matches the daily-games grid width (640): the header + puzzle
  // card fill the same column as the navy grid below. The board keeps its own
  // cell size (CS_FILL) and stays centered inside that wider card, so its
  // height is unchanged and it still fits on one screen.
  const allWordsSolved = PUZZLE.slots.every((s) => g.solved[s.id]);
  // The vertical room the board actually has. The Loft reserved 430px for a
  // masthead, a stat bar and a cap; the stage shows one line, so it reserves
  // 330. The floor drops with it: 42px was chosen when a tall board could
  // scroll under all that chrome, and on the stage it just overflows.
  const VROOM = STAGE ? STAGE_VROOM : 430;
  // Everything the rows themselves do not occupy: the gaps between them, plus
  // a little slack so the board rests on the fold rather than against it.
  const GAPS = (ROWS - 1) * 3 + 8;
  // Measured, not guessed. See lib/stage-fit.js for why this cannot loop.
  const gridRef = useRef(null);
  const stageRoom = useStageRoom(gridRef, STAGE);
  const CS_MIN = STAGE ? 30 : 42;
  const CS_FILL = Math.max(48, Math.min(58, Math.round((540 - (COLS - 1) * 3) / COLS))); // fill toward ~540px, leaving room for the keyboard
  // The board's own column, matching DailyGamesGrid, so it stays centred at
  // its own size. One width at both registers now that no gutter is added to
  // it on the stage.
  const COLW = 640;

  // Board-driven filing overlays: the word you've picked up glows (cx-armed),
  // solved-but-unfiled words are underlined (cx-unfiled), and each filed word
  // marks its start square with a category-colour pip (your own provisional
  // grouping — the full colour reveal still waits for the end).
  const fileArmSlot = playing && pick ? PUZZLE.slots.find((s) => s.word === pick) : null;
  const fileArmKeys = new Set(fileArmSlot ? slotCells(fileArmSlot).map((cl) => `${cl.r},${cl.c}`) : []);
  const fileFiledPip = {};
  const fileUnfiledKeys = new Set();
  if (playing) {
    for (const s of PUZZLE.slots) {
      if (!g.solved[s.id]) continue;
      if (g.assigned[s.word] !== undefined) fileFiledPip[`${s.row},${s.col}`] = g.assigned[s.word];
      else if (s.word !== pick) for (const cl of slotCells(s)) fileUnfiledKeys.add(`${cl.r},${cl.c}`);
    }
  }

  function cellStyle(r, c, info) {
    const k = `${r},${c}`;
    const green = g.greens[k];
    // a cell owned by any solved+filed word takes that category's tint
    // Category tint only appears at puzzle end (placements are secret while
    // playing), and always by TRUE category — the reveal moment.
    let cat = null;
    let catIdx = 0;
    if (!playing) {
      for (const id of info.slots) {
        if (g.solved[id]) {
          catIdx = PUZZLE.categories.findIndex((c) => c.words.includes(SLOT[id].word));
          cat = catTone(catIdx);
          break;
        }
      }
    }
    const inSel = playing && selCellKeys.has(k) && !g.solved[sel];
    const base = {
      width: 'var(--cs)', height: 'var(--cs)', borderRadius: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SANS, fontWeight: 800, fontSize: 'calc(var(--cs) * 0.48)',
      cursor: playing ? 'pointer' : 'default', userSelect: 'none',
      gridRow: r + 1, gridColumn: c + 1, position: 'relative',
      transition: 'background .12s,border-color .12s',
    };
    // the reveal cascades category by category, only on the live transition
    // won: diagonal color sweep across the grid; lost: category-by-category reveal
    if (cat) return { ...base, background: cat.bg, color: cat.tc, border: `1.5px solid ${cat.bg}`, ...(endAnim ? { animation: won ? `cxcat .5s ease ${(r + c) * 55}ms backwards` : `cxcat .55s ease ${catIdx * 380}ms backwards` } : {}) };
    // A LOCKED LETTER IS THE WIN STATE, so on the stage it takes the game's
    // own category step. Left as near-black it would be a near-black cell on
    // a near-black ground: the one place the fill genuinely stops working.
    if (green) return { ...base, background: SPAL ? BOARD_C : COLORS.ink, color: SPAL ? BOARD_ON : T.white, border: `1.5px solid ${SPAL ? BOARD_C : COLORS.ink}`, boxShadow: SPAL ? 'none' : 'inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.5)' };
    if (lost) return { ...base, background: SPAL ? 'transparent' : TILE, color: `var(--stg-ink, ${COLORS.rust})`, border: '1.5px dashed rgba(192,57,43,0.55)' };
    if (inSel) {
      const isCursor = cursorKey === k;
      return {
        ...base,
        background: SPAL ? (isCursor ? SPAL.selCur : SPAL.sel) : (isCursor ? '#dce9ff' : '#edf3ff'),
        color: SPAL ? INK : COLORS.ember,
        border: `2px solid ${SPAL ? (isCursor ? BOARD_C : SPAL.selB) : (isCursor ? COLORS.ember : 'rgba(37,99,235,0.5)')}`,
      };
    }
    return { ...base, background: SPAL ? SPAL.tile : TILE, color: SPAL ? INK : `var(--stg-ink, ${COLORS.ink})`, border: `1.5px solid ${SPAL ? SPAL.tileB : TILE_BORDER}`, boxShadow: SPAL ? 'none' : 'inset 0 1px 2px rgba(28,30,36,0.07)' };
  }

  function cellLetter(r, c, info) {
    const k = `${r},${c}`;
    if (g.greens[k]) return info.ch;
    if (shown) return info.ch;
    if (typedAt[k]) return typedAt[k];
    return '';
  }

  const startNum = {};
  PUZZLE.slots.forEach((s) => {
    const k = `${s.row},${s.col}`;
    if (!startNum[k]) startNum[k] = parseInt(s.id, 10);
  });

  const KB = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  // The HIT key follows the locked cell onto the category step, for the same
  // reason. The near miss keeps its amber and the spent key keeps being the
  // quietest thing on the board: both of those are meanings, not styling.
  const kbColors = STAGE
    ? { g: { bg: BOARD_C, fg: BOARD_ON }, y: { bg: 'color-mix(in srgb, var(--stg-ink) 34%, transparent)', fg: INK }, x: { bg: SPAL.spent, fg: SPAL.spentInk } }
    : { g: { bg: COLORS.ink, fg: T.white }, y: { bg: '#e6b93f', fg: '#5c4a06' }, x: { bg: '#c9cdd4', fg: T.muted } };

  const lastG = g.lastGuess[sel];
  const tries = (g.guessLog || {})[sel] || (lastG ? [lastG] : []);
  const markColor = STAGE
    ? { g: { bg: BOARD_C, fg: BOARD_ON }, y: { bg: 'color-mix(in srgb, var(--stg-ink) 34%, transparent)', fg: INK }, x: { bg: SPAL.spent, fg: SPAL.spentInk } }
    : { g: { bg: COLORS.ink, fg: T.white }, y: { bg: '#e6b93f', fg: '#5c4a06' }, x: { bg: '#c9cdd4', fg: '#40434b' } };

  // Shared rules body — rendered in both the how-to-play modal and the start tile.
  const rulesBody = (
    <DailyRules
      lead={<><b>{PUZZLE.slots.length === 12 ? 'Twelve' : 'Eight'} words</b> interlock in the grid, with no clues.</>}
      banner={<>The <b>four categories</b> are the only hints, and each hides exactly {PUZZLE.categories[0].words.length === 3 ? 'three' : 'two'} of the words.</>}
      chips={STAGE ? [
        // The swatches are the BOARD's own values, not a description of them,
        // so the legend cannot drift from the grid again.
        { label: 'Filled = right letter, right square', style: { background: BOARD_C, color: BOARD_ON, border: `1.5px solid ${BOARD_C}` } },
        { label: 'Shaded = in the word, different square', style: { background: 'color-mix(in srgb, var(--stg-ink) 34%, transparent)', color: INK, border: '1.5px solid var(--stg-line2)' } },
      ] : [
        { label: 'Dark = right letter, right square', style: { background: COLORS.ink, color: T.white, border: `1.5px solid var(--stg-line, ${COLORS.ink})` } },
        { label: 'Yellow = in the word, different square', style: { background: '#e6b93f', color: '#5c4a06', border: '1.5px solid #5c4a06' } },
      ]}
      steps={[
        <><b>Guess to reveal</b>: tap a slot, type a real word, hit enter. The whole board shares <b>{PUZZLE.guesses} guesses</b>.</>,
        <>A {STAGE ? 'filled' : 'dark'} letter <b>locks in</b>, and its crossings lock with it.</>,
        <><b>File your solves</b>: tap a word, then a category. Placements stay secret and movable.</>,
        <>One <b>submit</b> ends the puzzle.</>,
      ]}
      knack="Crossings are free letters. Solve the words that touch the most slots first and the rest of the grid opens up on its own."
      note={<>No lock-in, no score: nothing counts until you <b>submit</b>.</>}
      footer={<>Score is out of {PUZZLE.slots.length * 2}: a point per solved word, a point per correct placement. A <b>hint</b> reveals a letter and costs 1 guess plus 1 point, one per puzzle. Your first ever Crux gets one free on top.</>}
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), ...(stageRoom ? { '--cx-room': stageRoom + 'px' } : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome: home's #233a63 masthead + #16307a stat bar +
          the #eef3ff slate rail, collapsing to one line once the clock runs
          (owner mockup, 2026-08-04). Outside cx-wrap so the bands run full
          bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="crux" name="Crux" collapsed={started} loft={LOFT}
        stats={[{ k: 'Guesses', v: g.left },
                { k: 'Words', v: `${PUZZLE.slots.filter((s) => g.solved[s.id]).length}/${PUZZLE.slots.length}` }]} />
      )}
      {LOFT && !STAGE && (
        <LoftCap
          name="Crux"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (endScore > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: `${g.order.length}/${PUZZLE.slots.length}`, k: 'words' },
            { v: g.left, k: 'guesses left' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${endScore}/${PUZZLE.slots.length * 2}`, k: 'score' },
            { v: `${g.order.length}/${PUZZLE.slots.length}`, k: 'words' },
            { v: guessesUsed, k: 'guesses' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      {/* THE STRIP COMES DOWN WHILE THE CLOCK RUNS. A live figure about other
          people does not belong over a board being worked, which is the run's
          own rule about what may sit over a clock. */}
      {STAGE && (
        <StageChrome
          gameKey="crux"
          name="Crux"
          dateLabel={PUZZLE.dateLabel}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          quizId={PUZZLE.quizId}
          scoreWord={`of ${PUZZLE.slots.length * 2}`}
          progress={PUZZLE.slots.length ? g.order.length / PUZZLE.slots.length : 0}
          stripOn={!started || !playing}
          figures={playing ? [
            { v: `${g.order.length}/${PUZZLE.slots.length}`, k: 'words' },
            { v: g.left, k: 'guesses left' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${endScore}/${PUZZLE.slots.length * 2}`, k: 'score' },
            { v: `${g.order.length}/${PUZZLE.slots.length}`, k: 'words' },
            { v: guessesUsed, k: 'guesses' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      {STAGE && <style dangerouslySetInnerHTML={{ __html: STAGE_BOARD_CSS }} />}
      <div className="cx-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: STAGE ? '10px 38px 40px' : '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .cx-a{margin:0 auto;}
          /* FOUR ACROSS, not two by two. The card is 640 wide and the board
             only ever needs about 510 of it, so the categories had spare width
             and were spending height instead: two rows of chips cost 98px above
             a board that was already running past the fold. One row of four,
             each chip stacking its name over its two slots, costs 64. That is
             34px of the fix bought without shrinking a single cell. */
          .cl-cats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
          .cl-cat{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:5px;min-height:0;padding:9px 10px;}
          .cl-cat-nm{margin-bottom:0 !important;}
          @media (max-width:700px){.cl-cats{grid-template-columns:1fr 1fr;}}
          /* CELL SIZE IS CLAMPED ON BOTH AXES. It used to be width only, via
             CS_FILL, which is derived from the COLUMN count alone: the bank runs
             from 6 to 13 rows, so a 12-row puzzle rendered 645px of grid and ran
             250px past the bottom of an 813px window. The height term divides
             what is left after the chrome, the cap, the categories and the row
             under the board, so a tall board shrinks and a short one is
             untouched. The floor stops a very tall board on a short window from
             shrinking to something unreadable; past that point the page scrolls,
             which is the better trade. At 1080 tall nothing changes at all. */
          .cl-grid{--cs:min(${CS_FILL}px, calc((596px - ${(COLS - 1) * 3}px)/${COLS}), max(${CS_MIN}px, calc((100vh - var(--cx-room, ${VROOM}px) - ${GAPS}px)/${ROWS})));}
          @media (max-width:900px){.cl-grid{--cs:min(${CS_FILL}px, calc((100vw - ${88 + (COLS - 1) * 3}px)/${COLS}), max(${CS_MIN}px, calc((100vh - var(--cx-room, ${VROOM}px) - ${GAPS}px)/${ROWS})));}}
          @media (max-width:560px){.cx-wrap{padding-left:14px !important;padding-right:14px !important;}.cl-grid{--cs:min(46px, calc((100vw - ${52 + (COLS - 1) * 3}px)/${COLS}));}.cl-panel{padding:11px 11px 13px !important;}.cl-cat{flex-direction:column;align-items:flex-start;gap:5px;padding:9px 11px !important;}}
          @media (max-width:430px){.cl-cats{grid-template-columns:1fr;}}
          .cx-htp-s{display:none;}
          @media(max-width:520px){.cx-htp-f{display:none;}.cx-htp-s{display:inline;}}
          @media(max-width:560px){.cx-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.cx-ttl h1{font-size:21px;letter-spacing:0.02em;}.cx-ttl .cx-ttl-dt{font-size:15px;}.cx-ttl-dot{display:none;}}
          .cx-pip{position:absolute;top:3px;right:3px;width:9px;height:9px;border-radius:3px;border:1px solid rgba(0,0,0,0.4);box-shadow:0 1px 0 rgba(255,255,255,0.35);}
          .cx-armed{box-shadow:inset 0 0 0 2px #dce9ff, 0 0 0 3px rgba(37,99,235,0.6) !important;z-index:2;}
          .cx-unfiled::after{content:'';position:absolute;left:20%;right:20%;bottom:5px;height:2px;border-radius:2px;background:rgba(150,185,255,0.9);}
          .cl-key{border:none;font-family:${SANS};font-weight:800;cursor:pointer;border-radius:6px;padding:0;touch-action:manipulation;}
          .cl-grid > div{touch-action:manipulation;}
          .cl-key:active{transform:scale(0.94);}
          .cx-tries{display:flex;flex-direction:column;gap:4px;max-height:126px;overflow-y:auto;scrollbar-width:thin;}
          @media(max-width:560px){.cx-tries{max-height:96px;}}
          .cl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid var(--blue-deep);background:${STAGE ? 'transparent' : 'var(--white)'};color:var(--blue-deep);border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .cl-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .cx-cur{position:relative;}
          .cx-cur::after{content:'';position:absolute;bottom:14%;left:22%;right:22%;height:2.5px;background:var(--blue);animation:cxcaret 1.1s step-end infinite;}
          @keyframes cxcaret{50%{opacity:0;}}
          @keyframes cxfade{from{opacity:0;}}
          @keyframes cxstamp{from{opacity:0;transform:scale(.94);}}
          @keyframes cxflipA{from{transform:rotateX(90deg);background:${STAGE ? 'transparent' : 'var(--white)'};color:transparent;}}
          @keyframes cxflipB{from{transform:rotateX(90deg);background:${STAGE ? 'transparent' : 'var(--white)'};color:transparent;}}
          @keyframes cxpulseA{0%{box-shadow:0 0 0 0 rgba(37,99,235,0);}45%{transform:scale(1.18);box-shadow:0 0 0 5px rgba(37,99,235,0.4);}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(37,99,235,0);}}
          @keyframes cxpulseB{0%{box-shadow:0 0 0 0 rgba(37,99,235,0);}45%{transform:scale(1.18);box-shadow:0 0 0 5px rgba(37,99,235,0.4);}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(37,99,235,0);}}
          @keyframes cxcat{from{background:${STAGE ? 'transparent' : 'var(--white)'};color:transparent;transform:scale(.82);}}
        ` }} />

        {/* puzzle content centered: the page column is 1180, the puzzle column
            sizes to the board (Option A single-column layout) */}
        <div style={{ maxWidth: COLW, margin: '0 auto' }}>


        {/* masthead: pressed CRUX tiles with the issue no. + date on the same
            line, a single rule beneath (they stack on mobile) */}
        {!LOFT && (
        <DailyMasthead
          slug="crux"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.ember}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && (
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.white, background: COLORS.ink, borderRadius: 3, padding: '2px 7px' }}>Sunday Edition</span>
            )}
          blocks={'CRUX'.split('').map((ch, i) => (
              <div key={i} style={{ width: 46, height: 46, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 28, background: i === 2 ? COLORS.ember : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className="cx-a">
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          {/* start tile — sits where the board goes; the puzzle stays sealed
              (not rendered) until the player presses Start, which begins the clock. */}
          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : COLORS.cream, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '22px', display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Crux is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>Interlocking words, no clues: just four categories to guide you. Guess real words to reveal the letters.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="cl-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* the puzzle, one card: guesses + category clues + the grid */}
          {!preStart && (
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={STAGE ? 'cl-panel stg-board' : (LOFT ? 'cl-panel loft-card' : 'cl-panel')} style={STAGE
            // NO CARD. The board sits on the ground, which is the whole point
            // of the stage: a white panel here reads as a cut-out, and a dark
            // panel reads as a second ground nobody asked for.
            ? { background: 'transparent', border: 'none', borderRadius: 0, padding: 0, boxShadow: 'none', marginBottom: 12 }
            : { background: `var(--stg-surf, ${T.white})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '14px 16px 16px', boxShadow: '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
            {!LOFT && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12 }}>
              <span style={{ whiteSpace: 'nowrap' }}><b style={{ color: g.left <= 3 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{g.left}</b> guesses</span>
              <span style={{ flex: 1, height: 5, background: 'rgba(28,30,36,0.1)', borderRadius: 3, overflow: 'hidden', minWidth: 36 }}>
                <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, (g.left / PUZZLE.guesses) * 100))}%`, background: g.left <= 3 ? COLORS.rust : COLORS.ember, transition: 'width .2s' }} />
              </span>
              <span style={{ whiteSpace: 'nowrap' }}><b style={{ color: INK, fontWeight: 500 }}>{g.order.length}</b>/{PUZZLE.slots.length} words</span>
            </div>
            )}

            {/* category clues — the headline turns into a filing prompt once
                there are solved words waiting to be placed */}
            <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: FADED, marginBottom: 8 }}>
              {playing && solvedUnfiled.length > 0
                ? <>The categories: tap to file completed words</>
                : <>The categories: each hides {PUZZLE.categories[0].words.length === 3 ? 'three' : 'two'} of the {PUZZLE.slots.length === 12 ? 'twelve' : 'eight'} words</>}
            </div>
            {/* No inline grid-template-columns: it beat the .cl-cats rules,
                which is why the 430px one never fired. Columns live in CSS. */}
            <div className="cl-cats" style={{ marginBottom: 16 }}>
              {PUZZLE.categories.map((cat, ci) => {
                const cc = catTone(ci);
                const filed = Object.keys(g.assigned).filter((w) => g.assigned[w] === ci);
                const clickable = playing && pick;
                return (
                  <div key={ci} className="cl-cat" onClick={clickable ? () => fileWord(pick, ci) : undefined}
                    style={{ background: cc.bg, borderRadius: 8, padding: '10px 12px', border: STAGE ? 'none' : '1.5px solid rgba(28,30,36,0.35)', boxShadow: STAGE ? 'none' : '2px 2px 0 rgba(28,30,36,0.10)', cursor: clickable ? 'pointer' : 'default', outline: clickable ? `2.5px dashed ${cc.tc}` : 'none', outlineOffset: 2 }}>
                    <div className="cl-cat-nm" style={{ color: cc.tc, fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.03em', lineHeight: 1.25, textShadow: STAGE ? 'none' : '0 1px 0 rgba(255,255,255,0.35)' }}>{cat.name}</div>
                    <div className="cl-cat-ws" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {cat.words.map((_, i) => {
                        const w = shown ? cat.words[i] : filed[i];
                        if (!w) return <span key={i} style={{ background: 'rgba(255,255,255,0.28)', color: cc.tc, borderRadius: 6, padding: '3px 14px', fontWeight: 800, fontSize: 12.5 }}>?</span>;
                        if (shown) return <span key={i} style={{ background: 'rgba(255,255,255,0.28)', color: cc.tc, borderRadius: 6, padding: '3px 8px', fontWeight: 700, fontSize: 12.5, opacity: 0.85 }}>{w}</span>;
                        return (
                          <button key={i} onClick={playing ? (e) => { e.stopPropagation(); unfile(w); } : undefined} title={playing ? 'Tap to take back' : undefined}
                            style={{ background: 'rgba(255,255,255,0.6)', color: cc.tc, border: 'none', borderRadius: 6, padding: '3px 8px', fontWeight: 800, fontSize: 12.5, fontFamily: SANS, cursor: playing ? 'pointer' : 'default' }}>
                            {w}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="cl-grid" ref={gridRef} style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, var(--cs))`, gridTemplateRows: `repeat(${ROWS}, var(--cs))`, gap: 3 }}>
              {[...CELLS.entries()].map(([k, info]) => {
                const [r, c] = k.split(',').map(Number);
                let st = cellStyle(r, c, info);
                if (anim) {
                  // alternate keyframe names so back-to-back guesses restart
                  const suf = anim.id % 2 ? 'B' : 'A';
                  const parts = [];
                  if (anim.flip[k] != null) parts.push(`cxflip${suf} .38s ease ${anim.flip[k] * 60}ms backwards`);
                  if (anim.pulse[k]) parts.push(`cxpulse${suf} .55s ease ${(anim.flip[k] || 0) * 60 + 380}ms`);
                  if (parts.length) st = { ...st, animation: parts.join(', ') };
                }
                const armed = fileArmKeys.has(k);
                const cls = [cursorKey === k ? 'cx-cur' : '', armed ? 'cx-armed' : '', (!armed && fileUnfiledKeys.has(k)) ? 'cx-unfiled' : ''].filter(Boolean).join(' ') || undefined;
                return (
                  <div key={k} className={cls} onClick={() => cellClick(r, c)} style={st}>
                    {startNum[k] ? <span style={{ position: 'absolute', top: 0, left: 3, fontSize: 'calc(var(--cs) * 0.24)', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, opacity: 0.55 }}>{startNum[k]}</span> : null}
                    {fileFiledPip[k] !== undefined ? <span className="cx-pip" style={{ background: CAT_COLORS[fileFiledPip[k]].bg }} /> : null}
                    {cellLetter(r, c, info)}
                  </div>
                );
              })}
              </div>
            </div>

          {/* selected slot bar — only while there are still words to guess */}
          {started && slot && !allWordsSolved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 10, flexWrap: 'wrap' }}>
              <button className="cl-key" onClick={() => cycleSlot(-1)} aria-label="Previous word" style={{ background: `var(--stg-surf2, ${COLORS.paper})`, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={17} /></button>
              <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>
                {slotLabel(sel)} <span style={{ color: FADED, fontWeight: 700 }}>&middot; {slot.word.length} letters &middot; {(g.slotGuesses[sel] || 0)} guess{(g.slotGuesses[sel] || 0) === 1 ? '' : 'es'} spent</span>
              </div>
              <button className="cl-key" onClick={() => cycleSlot(1)} aria-label="Next word" style={{ background: `var(--stg-surf2, ${COLORS.paper})`, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={17} /></button>
              {freeHintOk && (
                <button className="cl-key" onClick={() => revealHint(false)} title="Reveal one letter in this word. Free, and only on your first ever Crux."
                  style={{ marginLeft: 'auto', background: STAGE ? 'var(--stg-surf2)' : '#fdf6e3', border: '1.5px solid rgba(230,185,63,0.7)', height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: STAGE ? INK : '#8a6d1a' }}>
                  <Lightbulb size={14} /> Free hint
                </button>
              )}
              {paidHintOk && (
                <button className="cl-key" onClick={() => revealHint(true)} disabled={!canAffordPaid}
                  title={canAffordPaid ? 'Reveal one letter in this word. Costs 1 guess and 1 point off your score.' : 'Not enough guesses left to buy a hint.'}
                  style={{ marginLeft: freeHintOk ? 0 : 'auto', background: canAffordPaid ? (STAGE ? 'var(--stg-surf2)' : '#fdf6e3') : (STAGE ? 'var(--stg-surf)' : 'rgba(28,30,36,0.05)'), border: `1.5px solid ${canAffordPaid ? 'rgba(230,185,63,0.7)' : (STAGE ? 'var(--stg-line)' : 'rgba(28,30,36,0.16)')}`, height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: canAffordPaid ? (STAGE ? INK : '#8a6d1a') : FADED, cursor: canAffordPaid ? 'pointer' : 'not-allowed' }}>
                  <Lightbulb size={14} /> Hint
                  <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.85 }}>&minus;1 guess &minus;1 pt</span>
                </button>
              )}
            </div>
          )}

          {/* every try on this slot, oldest first — see the guessLog note in submit() */}
          {started && tries.length > 0 && !g.solved[sel] && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: FADED }}>
                  {tries.length === 1 ? 'Your try' : `Your ${tries.length} tries`}
                </span>
                {presentUnplaced ? (
                  <span style={{ fontSize: 11.5, color: FADED, fontWeight: 700 }}>
                    in word: <b style={{ color: '#8a6d1a' }}>{presentUnplaced.split('').join(' ')}</b>
                  </span>
                ) : null}
              </div>
              <div className="cx-tries" ref={triesRef}>
                {tries.map((t, ti) => (
                  <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', opacity: ti === tries.length - 1 ? 1 : 0.66 }}>
                    {t.word.split('').map((ch, i) => {
                      const mc = markColor[t.marks[i]] || markColor.x;
                      return <span key={i} style={{ width: 26, height: 26, borderRadius: 5, background: mc.bg, color: mc.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{ch}</span>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* desktop-only keyboard toggle — physical typing always works, so the
              on-screen keys are collapsed by default and expand on demand */}
          {started && g.left > 0 && !allWordsSolved && !mobileUi && (
            <div style={{ textAlign: 'center', marginBottom: kbdOpen ? 8 : 0 }}>
              <button onClick={() => setKbdOpen((o) => !o)} style={{ background: 'none', border: '1.5px solid rgba(28,30,36,0.22)', borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: FADED }}>
                {kbdOpen ? 'Hide keyboard' : 'Show keyboard'}
              </button>
            </div>
          )}
          {/* keyboard (hidden once solved/out of guesses; on desktop also waits for the toggle) */}
          {started && g.left > 0 && !allWordsSolved && (mobileUi || kbdOpen) && (
            <div style={{ maxWidth: 470, margin: '0 auto' }}>
              {KB.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 4, marginBottom: 5, justifyContent: 'center' }}>
                  {ri === 2 && (
                    <button className="cl-key cl-kx" onClick={() => onKey('ENTER')} style={{ flex: '1.6 0 0', height: 44, background: STAGE ? STAGE_C : COLORS.ember, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 11.5 }}>ENTER</button>
                  )}
                  {row.split('').map((ch) => {
                    const st = keyState[ch];
                    const kc = st ? kbColors[st] : (SPAL ? { bg: SPAL.key, fg: INK } : { bg: T.white, fg: COLORS.ink });
                    return (
                      <button key={ch} className="cl-key cl-kx" onClick={() => onKey(ch)} style={{ flex: '1 0 0', height: 44, background: kc.bg, color: kc.fg, fontSize: 15, border: st ? 'none' : (SPAL ? SPAL.keyB : '1.5px solid rgba(20,22,28,0.15)') }}>{ch}</button>
                    );
                  })}
                  {ri === 2 && (
                    <button className="cl-key" onClick={() => onKey('BACK')} aria-label="Delete" style={{ flex: '1.6 0 0', height: 44, background: `var(--stg-surf2, ${COLORS.paper})`, color: INK, fontSize: 16 }}>&#9003;</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* filing helper — the board is the word bank now, so this is just a
              nudge; the "Placing X" state mirrors the armed word on the grid */}
          {started && solvedUnfiled.length > 0 && (
            <div style={{ margin: '2px 0 12px', fontSize: 13, fontWeight: 700, color: FADED, textAlign: 'center' }}>
              {pick
                ? <>Placing <span style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800 }}>{pick}</span>: tap a category above</>
                : <>Tap a completed word on the board, then a category. <span style={{ opacity: .85 }}>Underlined words aren&rsquo;t filed yet.</span></>}
            </div>
          )}

          {/* lock it in: single shot, concludes the puzzle — armed two-tap */}
          {readyToLock && (
            <button onClick={() => { if (armLock) { if (Date.now() - armLock < ARM_MIN_MS) return; lockIn(); } else { setArmLock(Date.now()); setTimeout(() => setArmLock(false), 3500); } }}
              style={{ width: '100%', fontFamily: SANS, fontWeight: 800, fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '15px 10px', borderRadius: 10, border: 'none', background: armLock ? (STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.ink) : (STAGE ? STAGE_C : COLORS.ember), color: STAGE ? (armLock ? INK : 'var(--stg-onramp, #08222e)') : T.white, cursor: 'pointer', marginTop: 18, marginBottom: 14 }}>
              {armLock ? 'Tap again — this ends the puzzle' : 'Submit answers'}
            </button>
          )}
          <div className={STAGE ? undefined : 'loft-sol'}>
            {/* result */}
            {!playing && (
              <>
                {isTodays && myStats.cur >= 2 && (
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                  </div>
                )}
                <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                  {isTodays ? (
                    <>
                      {countdown ? <>Next Crux in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new puzzle drops at midnight Eastern.'}
                      {prevPuzzle && (
                        <>
                          {' '}Meanwhile:{' '}
                          <a href={`/crux?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                            play yesterday&rsquo;s Crux &rarr;
                          </a>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                      <a href="/crux" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Crux &rarr;</a>
                      {' · '}
                      <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          </div>
          {LOFT && !playing && (
            <LoftFinish
            name="Crux"
            catRank={catRank}
            outcome={won ? 'won' : (endScore > 0 ? 'part' : 'lost')}
              title={won ? 'Solved' : (endScore > 0 ? 'Partly solved' : 'Not solved')}
              detail={`${endScore}/${PUZZLE.slots.length * 2} · ${guessesUsed} guesses · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Crux all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((a, b) => b.num - a.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/crux?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                // Crux hides its words, so it HAS a reveal. A game that never
                // hid its board simply omits this one.
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Crux', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/crux?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day\u2019s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
          )}
          {/* The IQ figure and Replay moved ONTO the end card, which is where
              a player looks for them. See LoftFinish. */}
        </div>

        </div>
        </div>

        <div>
        {/* The game's own record, archive and leaderboards, at the foot of the
            page (owner, 2026-08-24). This is the panel that used to open from a
            home-page puzzle tile. GamePanel renders its own button and also
            flips the page out of focus mode on first open, which is all the
            "Show overview and more" control it replaces ever did. */}
        {/* The strip in the cap already answers what this button opens, and it
            answers it without being pressed, so on the stage the button is a
            second door to one room. It also carries loft-showchrome, whose
            only job is flipping a LoftCap page out of focus mode, and the
            stage has no LoftCap to flip. */}
        {!STAGE && <GamePanel self="crux" name="Crux" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + join + leaderboard (always) */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', maxWidth: 640, margin: '36px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="crux" name="Crux" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}

          {/* THE TAIL IS GONE ON A LOFT PAGE (owner, 2026-08-14). The end card
              now carries the board, the day, what to play next and the archive,
              so the games grid and leaderboard panel below were saying all of
              it a second time. Only Report an issue survives, promoted below. */}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
          self="crux"
          maxWidth={640}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          boardSlot={<DailyBoardPanel self="crux" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
          divider
        />
          )}

          {!focusMode && mobileUi && !standalone && (
            <button onClick={a2hsClick} style={{ marginTop: 10, width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: '#21b45e', color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          )}
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Crux to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> — the colored-crossword tile opens today&apos;s puzzle, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The colored-crossword tile opens today&apos;s puzzle, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ maxWidth: 640, margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); if (id && id.username) setPlayer((p) => p || { name: id.username, rank: null }); }} />
          </div>
        )}
        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}

        {!focusMode && (<p style={{ textAlign: 'center', fontSize: 12, fontStyle: 'italic', fontWeight: 600, color: FADED, margin: '34px 0 0' }}>For WMM, in memoriam.</p>)}
        </div>
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="crux"
          won={won}
          headline={won ? <>Crux cracked!</> : <>You scored {Math.round((endScore / (PUZZLE.slots.length * 2)) * 100)}%</>}
          subline={<>{won
            ? <>{endScore}/{PUZZLE.slots.length * 2} &middot; {guessesUsed} guesses &middot; {elapsed}{hintNote}</>
            : g.filedRight != null
              ? <>{g.order.length}/{PUZZLE.slots.length} words &middot; {g.filedRight}/{PUZZLE.slots.length} placements{hintNote} &middot; the reveal is on the board</>
              : <>{g.order.length} of {PUZZLE.slots.length} words{hintNote} &middot; the reveal is on the board</>}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      {/* help modal */}
      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: STAGE ? 'var(--stg-raise,#0e131f)' : COLORS.cream, borderRadius: 12, border: STAGE ? '1px solid var(--stg-line)' : `2px solid ${COLORS.ink}`, padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="cl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* About Crux — crawlable prose for search, server-rendered into the initial HTML */}
      <div>
      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Crux</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Crux is a free daily word puzzle from Mind Loft, a clueless crossword. Eight hidden words (twelve in the Sunday Edition) interlock in a compact grid, and the only hints are four visible categories; working out which words belong to them is the puzzle.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Guess real words to reveal letters: dark tiles lock a letter into its square and every crossing, yellow tiles mean the letter belongs elsewhere in the word. The whole board shares one guess budget, and a single submit files each solved word under its category: a point per solve, a point per correct placement.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new Crux puzzle arrives every day, with a bigger Sunday Edition each week. No app, no signup. Play free in your browser and compare score, guesses, and time on the daily leaderboard. Prefer scrambles? Try <a href="/garble" style={{ color: INK, fontWeight: 800 }}>Garble</a>, our daily word scramble.
        </p>
      </section>
      </div>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
