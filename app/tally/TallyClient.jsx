'use client';

// Tally — the daily number ledger.
//
// Each day: an N×N grid with some cells inked out and a few printed givens.
// A rack of number tiles sits below. Fill every open square from the rack —
// each tile used exactly once — so that every row and column adds up to the
// target at its end. The rack is the twist: when the sums leave two ways to
// finish a line, the supply of tiles leaves you one. Score is 10 minus every
// placement over the minimum (the fewest possible = the rack size), floor 1 —
// so a clean, no-error solve is a perfect 10. Errors then time break ties.
//
// Same daily plumbing as Span: banked puzzles gated by Eastern date on the
// server (app/tally/page.js), per-puzzle localStorage saves, /tally?p=N
// archive pinning, streaks + stats, and the shared /api/quiz/* board flow.
// Weekdays are a 5×5 board; Sundays step up to 6×6.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, Share2, RotateCcw, X, Lightbulb, Eye, Smartphone, Undo2, Eraser } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import DailyGamesPromo from '../DailyGamesPromo';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
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
import DailyRules from '../DailyRules';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  green: T.successDeep,
  greenSoft: '#eefaf1',
  amber: '#b45309',
};
// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const PAPER = '#fbf9f4';
const HELP_KEY = 'sot_tally_help_seen';
const STATS_KEY = 'sot_tally_stats';

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

// ─── Personal stats + streak (localStorage), Span/Crux pattern ─────────────
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

// ── certainty marks ────────────────────────────────────────────────────────
// Certainty in Tally comes in two halves, because that is how the deduction
// actually arrives: the rack supply often proves a digit belongs in a given ROW
// long before you can say which square of it, and the same for columns. So a
// mark is a 2-bit value per cell — row half, column half — and holding both is
// what "certain" means. A tap walks a placed tile through them in order — right
// row, right column, both — and the tap after that lifts it back to the rack, so
// a single gesture covers placing, noting and removing with no tool to switch
// between. Only a row- or column-only tile slides, since a certain one is
// already in its square.
const M_ROW = 1;   // this digit belongs somewhere in this row
const M_COL = 2;   // ...somewhere in this column
const M_BOTH = 3;  // both halves proven — the exact square, and the last note
const MARK_CLASS = { 1: 'mk-row', 2: 'mk-col', 3: 'mk-both' };
const MARK_TITLE = {
  0: 'Drag it to any open square. Tap to note the right row. Hold or right-click to lift it back to the rack.',
  1: 'Right row — drag it along the row to move it, note and all. Tap to note the column instead.',
  2: 'Right column — drag it up or down the column to move it, note and all. Tap to mark it certain.',
  3: 'Certain — right row and column. One more tap lifts it back to the rack.',
};
// grid gap between cells, in px — the slide maths needs the pitch
const GAP = 6;
// a drag must travel this far along its axis before it counts as a slide
// rather than a tap or a hold
const SLIDE_MIN = 6;
// ...and travelling this far in any direction disarms the hold, since a hold
// lifts the tile and a finger that is moving is not asking for that
const HOLD_SLOP = 4;

// A saved game from before the marks shipped has no `mark` array (and an
// archive replay can switch board size), so normalise on every read.
function normMark(arr, size) {
  const out = Array(size * size).fill(0);
  if (Array.isArray(arr)) for (let i = 0; i < out.length && i < arr.length; i++) out[i] = (arr[i] | 0) & M_BOTH;
  return out;
}

function freshState(size) {
  return {
    v: 1,
    cells: Array(size * size).fill(0), // placed digit per grid cell (0 = empty/blocked/given)
    mark: Array(size * size).fill(0),  // certainty bitmask per cell — a free note,
                                       // never scored, never touches moves
    moves: 0,                          // total placements (lifting is free; extra placements = errors)
    hintUsed: false,
    status: 'playing',                 // playing | won | revealed
    t0: null,
    tEnd: null,
  };
}

export default function TallyClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const N = PUZZLE.size;
  const BLOCK = PUZZLE.blocked;
  const GIVEN = PUZZLE.given;
  const ROWT = PUZZLE.rowT;
  const COLT = PUZZLE.colT;
  const BANK = PUZZLE.bank;
  const FEWEST = PUZZLE.fewest;
  const STORE_KEY = `sot_tally_${PUZZLE.num}`;
  // every open cell the player fills (row-major), excluding blocked + givens
  const FREE = useMemo(() => {
    const out = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!BLOCK[r][c] && !GIVEN[r][c]) out.push([r, c]);
    return out;
  }, [N, BLOCK, GIVEN]);

  const [g, setG] = useState(() => freshState(N));
  // Undo history: board arrangements only (the digits and their notes), newest
  // last. Deliberately NOT part of the saved game, since it is a convenience
  // within a sitting rather than part of the result. Note what it does not
  // hold: `moves`. Undo walks the grid back, never the score, exactly as
  // lifting a tile has never refunded the placement that put it there. So the
  // player can take back an arrangement freely and still cannot buy a clean
  // solve by placing, checking the line, and undoing.
  const [hist, setHist] = useState([]);
  const [sel, setSel] = useState(-1);        // selected rack tile index (into BANK), -1 = none
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false); // start tile: full rules (first-timer) vs compact card
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shakeCell, setShakeCell] = useState(-1);
  const [armReveal, setArmReveal] = useState(false);
  const [justWon, setJustWon] = useState(false);
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
  // One free hint, first play only (see lib/hint-gate.js). Eligibility is
  // re-read whenever stats change, so the server-history merge can revoke it
  // for a returning player on a new device.
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('tally', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('tally'); }, [g.hintUsed]);
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
  // long-press bookkeeping: `fired` swallows the click that follows the press
  const longRef = useRef({ t: null, fired: false, x: 0, y: 0 });
  // live slide session (geometry is frozen at pointerdown); dragView is the
  // render-side mirror that offsets the tiles as the finger moves
  const dragRef = useRef(null);
  const [dragView, setDragView] = useState(null);
  const slideToldRef = useRef(false);

  const cells = g.cells;
  const mark = useMemo(() => normMark(g.mark, N), [g.mark, N]);
  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;   // not begun: show the start tile in place of the board
  const started = playing && !!g.t0;   // clock running: show the board
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('tally');
  const STAGE = isStage('tally', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('tally');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('tally'), '--stg-acc-lt': gameColorLight('tally'), '--stg-onramp-lt': gameOnrampLight('tally'), '--stg-acc-ink-lt': gameAccentInkLight('tally') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';

  // TALLY'S TWO MARKS, BOTH IN THE CATEGORY COLOUR ON THE STAGE (owner,
  // 2026-08-31). This SUPERSEDES the old rule that the certainty marks were
  // navy precisely so they would not be the green of a balanced line: neither
  // literal survived the move to a near-black page.
  //
  //   * NAVY DID NOT WORK AT ALL. COLORS.ember is #233a63, and on --stg-surf2
  //     over the #0b0f1a ground it measures 1.34:1. That is not a dim mark, it
  //     is an invisible one, and it took the whole notes system with it: the
  //     rails on a marked tile, the check on a certain one, and every swatch in
  //     the legend under the board.
  //   * THE DARK GREEN WAS THE WRONG GREEN. COLORS.green is #15803d, Tally's
  //     registry hue, picked once against a light card. The stage's colour for
  //     this game is its CATEGORY step (Numbers: mint #6ee7b7 dark, #047857
  //     light), and a solid #15803d chip on near-black read as neither.
  //
  // So both are var(--stg-acc), and they stay apart by SHAPE rather than hue: a
  // note is rails and an outline, a line the board agrees with is a solid fill.
  // Reading the token also gets the LIGHT register right for free, which no
  // literal can do.
  const NOTE = STAGE ? 'var(--stg-acc)' : COLORS.ember;
  const AGREE = STAGE ? 'var(--stg-acc)' : COLORS.green;
  // The ink that sits ON a filled accent chip. --stg-onramp is #08222e dark and
  // #ffffff light, which is exactly this job: white would fail on mint and dark
  // would fail on #047857.
  const AGREE_INK = STAGE ? 'var(--stg-onramp,#08222e)' : T.white;
  // A ring keyed to navy is the same invisible mark as the rails were, so on the
  // stage it is the accent at low alpha, mixed from the token rather than
  // hardcoded as an rgba of a colour this game no longer uses.
  const RING = STAGE ? 'color-mix(in srgb, var(--stg-acc) 34%, transparent)' : 'rgba(21,128,61,0.2)';
  const ACC = STAGE ? STAGE_C : COLORS.accent;
  const ACC_DEEP = STAGE ? STAGE_C : COLORS.accentDeep;
  const ACC_SOFT = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.accentSoft;
  const ON_ACC = STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)';

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
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === N * N) setG({ ...freshState(N), ...saved, mark: normMark(saved.mark, N) });
      }
      // The start tile shows in place of the board until the player begins (t0
      // set on Start). First-timers see the full rules on the tile; a returning
      // player gets the compact start card with a "Show instructions" toggle.
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    // same-device day breadcrumb for cross-puzzle recommendations — TODAY'S puzzle
    // only (archive replays must not mark today as played)
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        (function(){ var _dn = g.status !== 'playing'; if (_dn || g.t0) localStorage.setItem('sot_tally_day', JSON.stringify({ d: etToday(), done: _dn })); else localStorage.removeItem('sot_tally_day'); })();
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles, N]);
  // a long-press timer must never outlive the board
  useEffect(() => () => { if (longRef.current.t) clearTimeout(longRef.current.t); }, []);

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

  // Ctrl/Cmd+Z walks the board back one step, the shortcut every player's
  // hands already know. Re-bound whenever the history changes so it always
  // pops the newest entry.
  useEffect(() => {
    if (!started) return undefined;
    const onKey = (e) => {
      if (e.key !== 'z' && e.key !== 'Z') return;
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, playing, hist]);

  useEffect(() => {
    if (g.status === 'playing') return;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  // ---- metrics + leaderboard (same /api/quiz/* flow as every other board) ----
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
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const iq = useIqStanding({ game: 'tally', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'tally', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'tally', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'tally', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'tally', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const errors = g.moves > FEWEST ? g.moves - FEWEST : 0;
  const anyPlaced = FREE.some(([r, c]) => !!cells[r * N + c]);
  const finalScore = won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0;

  // per-rack-tile "used" flags: first usedCount[d] tiles of each value read used
  const used = useMemo(() => {
    const usedCount = {};
    for (const v of cells) { if (v) usedCount[v] = (usedCount[v] || 0) + 1; }
    const seen = {};
    return BANK.map((d) => { seen[d] = (seen[d] || 0) + 1; return seen[d] <= (usedCount[d] || 0); });
  }, [cells, BANK]);

  function lineState(i, isRow) {
    let sum = 0, empty = 0;
    for (let j = 0; j < N; j++) {
      const r = isRow ? i : j, c = isRow ? j : i;
      if (BLOCK[r][c]) continue;
      const v = GIVEN[r][c] || cells[r * N + c];
      if (v) sum += v; else empty += 1;
    }
    const tgt = isRow ? ROWT[i] : COLT[i];
    // OVER IS DECIDED THE MOMENT THE SUM PASSES THE TARGET, whether or not the
    // line is full (owner report, 2026-08-17: a row reading 21 against a target
    // of 19 with a square still open showed a neutral "now 21"). Every tile is
    // a digit of 1 or more, so a line already past its target can never come
    // back: the squares still open can only push it further over. Reporting
    // that as a running total hides a settled mistake, and hides it longest on
    // exactly the lines the player is still working. `bad` is the state the
    // chip colours amber: this line cannot come right as it stands.
    const over = sum > tgt;
    const full = empty === 0;
    return { sum, empty, tgt, full, over, ok: full && sum === tgt, bad: over || (full && sum !== tgt) };
  }

  const linesOk = (() => { let n = 0; for (let i = 0; i < N; i++) { if (lineState(i, true).ok) n++; if (lineState(i, false).ok) n++; } return n; })();

  function isSolved(cs) {
    for (const [r, c] of FREE) { if (cs[r * N + c] === 0) return false; }
    for (let i = 0; i < N; i++) {
      let rs = 0, cs2 = 0;
      for (let j = 0; j < N; j++) {
        if (!BLOCK[i][j]) rs += GIVEN[i][j] || cs[i * N + j];
        if (!BLOCK[j][i]) cs2 += GIVEN[j][i] || cs[j * N + i];
      }
      if (rs !== ROWT[i] || cs2 !== COLT[i]) return false;
    }
    return true;
  }

  const REC_KEY = `sot_tally_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts only once the player actually acts (placed a tile or took
    // the hint). Lifting is free, so it never sets moves; opening the puzzle and
    // dismissing the start gate does not log a 0-score attempt.
    const acted = g.moves > 0 || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const errs = g2.moves > FEWEST ? g2.moves - FEWEST : 0;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: errs, won: g2.status === 'won' && errs === 0 })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // guessesUsed = errors, so the daily leaderboard (score, then guesses,
        // then time) resolves ties by fewest errors and then fastest finish.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: errs, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  // Pressing Start begins the clock (sets t0) and marks the rules as seen. A
  // no-op once started, so re-reading the rules later never resets the timer.
  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // Snapshot the board BEFORE a change, so undo has somewhere to step back to.
  // Capped so a long session cannot grow without bound.
  function pushHist(cs, mk) {
    setHist((h) => {
      const next = h.length >= 60 ? h.slice(h.length - 59) : h.slice();
      next.push({ cells: cs.slice(), mark: mk.slice() });
      return next;
    });
  }

  function undo() {
    if (!playing || !hist.length) return;
    const prev = hist[hist.length - 1];
    setHist((h) => h.slice(0, -1));
    // cells and notes only: moves stand, and the clock keeps running
    setG((cur) => ({ ...cur, cells: prev.cells.slice(), mark: prev.mark.slice() }));
    setSel(-1);
    try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch (e) {}
  }

  // Lift every placed tile back to the rack at once. Lifting one tile is free,
  // so lifting them all is too, and a single undo puts the whole board back.
  function clearBoard() {
    if (!playing) return;
    if (!anyPlaced) { say('Nothing on the board to clear'); return; }
    pushHist(cells, mark);
    const nc = cells.slice(), nm = mark.slice();
    for (const [r, c] of FREE) { const i = r * N + c; nc[i] = 0; nm[i] = 0; }
    setG((cur) => ({ ...cur, cells: nc, mark: nm }));
    setSel(-1);
    say('Board cleared. Your moves stand, and Undo puts it back.');
  }

  function commit(nextCells, extraMove, nextMark) {
    pushHist(g.cells, mark);
    const g2 = { ...g, cells: nextCells };
    if (nextMark) g2.mark = nextMark;
    if (extraMove) { g2.moves = g.moves + 1; if (!g2.t0) g2.t0 = Date.now(); }
    if (isSolved(nextCells)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      const errs = g2.moves > FEWEST ? g2.moves - FEWEST : 0;
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(errs / 2))));
      setG(g2);
      setJustWon(true);
      return;
    }
    setG(g2);
  }

  // ── certainty marks ──────────────────────────────────────────────────────
  // A note, not a move: marking costs nothing and is never scored.
  function writeMark(next) {
    pushHist(cells, mark);
    setG((cur) => ({ ...cur, mark: next }));
    try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch (e) {}
  }

  // Advance a placed tile one step through the halves — right row, then right
  // column, then both. The step after both is the lift, which cellClick takes.
  function cycleMark(i) {
    if (!playing || !cells[i] || mark[i] === M_BOTH) return;
    const next = mark.slice();
    next[i] = next[i] + 1;
    writeMark(next);
  }

  // Lift a placed tile back to the rack. Free — no move is charged — and its
  // notes go with it, so an empty square never carries a stale one. This is the
  // last step of the tap cycle, and hold or right-click jumps straight to it.
  function liftTile(i) {
    if (!playing || !cells[i]) return;
    const next = cells.slice(); next[i] = 0;
    const nm = mark.slice(); nm[i] = 0;
    commit(next, false, nm);
  }

  // Tapping a row/column target sets that HALF on every placed tile in the
  // line: the row target proves the row, the column target proves the column.
  // A tile that collects both ends up certain and locked, which is the whole
  // point — the two lines meet at exactly one square.
  function toggleLineMark(idx, isRow) {
    if (!playing) return;
    const bit = isRow ? M_ROW : M_COL;
    const hit = [];
    for (let j = 0; j < N; j++) {
      const r = isRow ? idx : j, c = isRow ? j : idx;
      if (BLOCK[r][c] || GIVEN[r][c]) continue;
      const i = r * N + c;
      if (cells[i]) hit.push(i);
    }
    if (!hit.length) { say('Nothing placed in that line yet'); return; }
    const allSet = hit.every((i) => mark[i] & bit);
    const next = mark.slice();
    hit.forEach((i) => { next[i] = allSet ? next[i] & ~bit : next[i] | bit; });
    writeMark(next);
    const word = isRow ? 'row' : 'column';
    say(allSet
      ? `Right-${word} mark cleared`
      : `${hit.length} tile${hit.length === 1 ? '' : 's'} marked as in the right ${word}`);
  }

  // ── sliding a half-marked tile along the line it has proven ──────────────
  // A right-row tile is known to belong somewhere in its row, just not yet in
  // which square, so it has to be free to travel along that row. Lifting it
  // would throw away the note it took work to earn, so instead you drag it: the
  // note rides along, and any tiles in the way shuffle one square toward the
  // square it left, exactly like reordering a hand of cards. A slide does the
  // same job as lift-and-replace, so it costs the same single move. A certain
  // tile (both halves) never slides — its square is settled.

  // which line, if any, this tile is free to travel. An UNMARKED tile has
  // proven nothing, so it is not pinned to anything: it drags freely to any
  // open square (owner, 2026-09-14: lift-then-tap was too much ceremony for
  // a tile that is simply in the wrong place). A half-marked tile keeps to
  // its proven line, and a certain one does not move at all.
  function slideAxis(i) {
    if (!playing || !cells[i]) return null;
    if (mark[i] === 0) return 'free';
    if (mark[i] === M_ROW) return 'row';
    if (mark[i] === M_COL) return 'col';
    return null;
  }

  // ── free drag of an unmarked tile ─────────────────────────────────────────
  // The tile follows the finger anywhere on the board. It lands on the square
  // under the pointer if that square is open, or trades places with another
  // UNMARKED tile sitting there (neither carries a note, so nothing is lost).
  // A noted, certain, given or blocked square refuses it and the tile snaps
  // home. A landed move costs one move, the same as lift-and-replace.
  function freeSession(i, rect) {
    return { i, r: Math.floor(i / N), c: i % N, axis: 'free', pw: rect.width + GAP, ph: rect.height + GAP,
      live: false, x0: 0, y0: 0, dx: 0, dy: 0, to: -1, ok: false };
  }
  // the square under the finger, and whether the tile may land there
  function freeTarget(d, dx, dy) {
    const c = d.c + Math.round(dx / d.pw), r = d.r + Math.round(dy / d.ph);
    if (r < 0 || r >= N || c < 0 || c >= N) return { to: -1, ok: false };
    const t = r * N + c;
    if (t === d.i) return { to: t, ok: false };
    if (BLOCK[r][c] || GIVEN[r][c]) return { to: t, ok: false };
    if (cells[t] && mark[t]) return { to: t, ok: false };   // noted: holds its square
    return { to: t, ok: true };
  }
  function freeOffsets(d, to, ok) {
    const out = {};
    if (!ok || to < 0 || !cells[to]) return out;
    // the swap partner slides toward the square being vacated
    out[to] = { x: (d.c - (to % N)) * d.pw, y: (d.r - Math.floor(to / N)) * d.ph };
    return out;
  }
  function applyFree(d) {
    if (!d.ok || d.to < 0 || d.to === d.i) {
      if (d.to >= 0 && d.to !== d.i && cells[d.to] && mark[d.to]) say('That tile carries a note, so it holds its square');
      return;
    }
    const nc = cells.slice(), nm = mark.slice();
    const swapped = cells[d.to];
    nc[d.to] = cells[d.i]; nc[d.i] = swapped;
    nm[d.to] = 0; nm[d.i] = 0;
    commit(nc, true, nm);
    try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    if (!slideToldRef.current) {
      slideToldRef.current = true;
      say(swapped ? 'Swapped. Costs one move, same as replacing it.' : 'Moved. Costs one move, same as replacing it.');
    }
  }

  // The squares of the line a slide may rearrange. A tile pinned to the
  // PERPENDICULAR line (it has proven that column, or is certain and locked)
  // keeps its square, because a slide must never shove a tile out of a line it
  // has proven — but it is NOT a wall. It sits the slide out and the dragged
  // tile passes straight over it to the free squares beyond, so one locked
  // tile in the middle of a row no longer strands everything on either side of
  // it. Blocked squares and printed givens sit out the same way. Every offset
  // below is measured from real grid coordinates, so the gaps left by the
  // squares sitting out take care of themselves.
  function slideSession(i, axis, rect) {
    const r = Math.floor(i / N), c = i % N;
    const wall = axis === 'row' ? M_COL : M_ROW;
    const slots = [];
    for (let j = 0; j < N; j++) {
      const rr = axis === 'row' ? r : j;
      const cc = axis === 'row' ? j : c;
      const s = rr * N + cc;
      if (BLOCK[rr][cc] || GIVEN[rr][cc]) continue;
      if (s !== i && cells[s] && (mark[s] & wall)) continue;  // proven its crossing line: stays put
      slots.push(s);
    }
    const from = slots.indexOf(i);
    if (from < 0 || slots.length < 2) return null; // nothing left to trade places with
    const pitch = (axis === 'row' ? rect.width : rect.height) + GAP;
    return { i, r, c, axis, slots, from, lo: 0, hi: slots.length - 1, pitch, to: from, live: false, x0: 0, y0: 0 };
  }

  const slotCoord = (d, s) => (d.axis === 'row' ? s % N : Math.floor(s / N));

  // the arrangement if the drag were released now, as a pixel offset per tile
  function slideOffsets(d, to) {
    const out = {};
    if (to === d.from) return out;
    const order = d.slots.slice();
    const [moved] = order.splice(d.from, 1);
    order.splice(to, 0, moved);
    order.forEach((s, k) => {
      if (s === d.i) return;                       // the dragged tile follows the finger
      const px = (slotCoord(d, d.slots[k]) - slotCoord(d, s)) * d.pitch;
      if (px) out[s] = px;
    });
    return out;
  }

  // land the slide: the same splice, applied to the digits AND their notes, so
  // every displaced tile keeps the certainty it had
  function applySlide(d, to) {
    if (to === d.from) return;
    const vals = d.slots.map((s) => [cells[s], mark[s]]);
    const [moved] = vals.splice(d.from, 1);
    vals.splice(to, 0, moved);
    const nc = cells.slice(), nm = mark.slice();
    d.slots.forEach((s, k) => { nc[s] = vals[k][0]; nm[s] = vals[k][1]; });
    commit(nc, true, nm);
    try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch (e) {}
    if (!slideToldRef.current) {
      slideToldRef.current = true;
      say('Slid along the line — your note came with it. Costs one move, same as replacing it.');
    }
  }

  // Long-press (and right-click) lifts the tile straight back to the rack: the
  // way out of the tap cycle when a tile is simply in the wrong square and you
  // do not want to walk it through three notes to get rid of it.
  function pressStart(e, r, c) {
    // right-click has its own handler — don't also arm the hold timer, or the
    // two would fire and cancel each other out
    if (e && e.button === 2) return;
    if (!playing || BLOCK[r][c] || GIVEN[r][c] || !cells[r * N + c]) return;
    const i = r * N + c;
    longRef.current.fired = false;
    longRef.current.x = e ? e.clientX : 0;
    longRef.current.y = e ? e.clientY : 0;
    if (longRef.current.t) clearTimeout(longRef.current.t);
    longRef.current.t = setTimeout(() => {
      longRef.current.t = null;
      longRef.current.fired = true;
      dragRef.current = null;      // a hold is not a slide
      liftTile(i);
    }, 420);
    // arm a possible slide alongside the hold; whichever the gesture turns out
    // to be cancels the other
    dragRef.current = null;
    const axis = slideAxis(i);
    if (!axis || !e || !e.currentTarget) return;
    const d = axis === 'free'
      ? freeSession(i, e.currentTarget.getBoundingClientRect())
      : slideSession(i, axis, e.currentTarget.getBoundingClientRect());
    if (!d) return;
    d.x0 = e.clientX; d.y0 = e.clientY;
    dragRef.current = d;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function pressMove(e) {
    // A hold LIFTS the tile now, so any real travel has to disarm it, whether
    // or not this tile can slide: a drag that starts slowly, or a swipe across
    // a tile that has no note to slide on, must never cost the player a tile
    // they meant to keep. Below the threshold the gesture is still a tap, and
    // the click that follows walks the cycle on as usual.
    if (longRef.current.t) {
      const mx = e.clientX - longRef.current.x, my = e.clientY - longRef.current.y;
      if (Math.abs(mx) > HOLD_SLOP || Math.abs(my) > HOLD_SLOP) {
        clearTimeout(longRef.current.t); longRef.current.t = null;
      }
    }
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (d.axis === 'free') {
      if (!d.live) {
        if (Math.abs(dx) < SLIDE_MIN && Math.abs(dy) < SLIDE_MIN) return;
        d.live = true;
        if (longRef.current.t) { clearTimeout(longRef.current.t); longRef.current.t = null; }
        longRef.current.fired = true;   // swallow the click that ends the drag
      }
      const { to, ok } = freeTarget(d, dx, dy);
      d.dx = dx; d.dy = dy; d.to = to; d.ok = ok;
      setDragView({ i: d.i, axis: 'free', dx, dy, to, ok, offsets: freeOffsets(d, to, ok) });
      return;
    }
    const along = d.axis === 'row' ? dx : dy;
    const across = d.axis === 'row' ? dy : dx;
    if (!d.live) {
      // travel has to be real and mostly along the proven axis, so a jittery
      // tap still reads as a tap and a page scroll still reads as a scroll
      if (Math.abs(along) < SLIDE_MIN || Math.abs(along) < Math.abs(across)) return;
      d.live = true;
      if (longRef.current.t) { clearTimeout(longRef.current.t); longRef.current.t = null; }
      longRef.current.fired = true;   // swallow the click that ends the drag
    }
    // nearest reachable slot to the finger, measured in real pixels so blocked
    // squares in the middle of a line don't throw the maths off
    const own = d.axis === 'row' ? d.c : d.r;
    let best = d.from, bestD = Infinity;
    for (let k = d.lo; k <= d.hi; k++) {
      const dist = Math.abs(along - (slotCoord(d, d.slots[k]) - own) * d.pitch);
      if (dist < bestD) { bestD = dist; best = k; }
    }
    d.to = best;
    const loPx = (slotCoord(d, d.slots[d.lo]) - own) * d.pitch;
    const hiPx = (slotCoord(d, d.slots[d.hi]) - own) * d.pitch;
    setDragView({ i: d.i, axis: d.axis, px: Math.max(loPx, Math.min(hiPx, along)), offsets: slideOffsets(d, best) });
  }

  function pressEnd() {
    if (longRef.current.t) { clearTimeout(longRef.current.t); longRef.current.t = null; }
    const d = dragRef.current;
    dragRef.current = null;
    if (dragView) setDragView(null);
    if (d && d.live) { if (d.axis === 'free') applyFree(d); else applySlide(d, d.to); }
  }
  // pointer capture keeps a live slide alive when the finger leaves the tile,
  // so only an idle press is cancelled here
  function pressLeave() {
    if (dragRef.current && dragRef.current.live) return;
    if (longRef.current.t) { clearTimeout(longRef.current.t); longRef.current.t = null; }
    dragRef.current = null;
  }
  function pressCancel() {
    if (longRef.current.t) { clearTimeout(longRef.current.t); longRef.current.t = null; }
    dragRef.current = null;
    if (dragView) setDragView(null);
  }

  function cellClick(r, c) {
    // swallow the click that follows a long-press
    if (longRef.current.fired) { longRef.current.fired = false; return; }
    if (!playing || BLOCK[r][c] || GIVEN[r][c]) return;
    const i = r * N + c;
    // One gesture covers a square's whole life. An empty square takes the tile
    // in hand; every tap after that walks the same tile on a step — right row,
    // right column, certain — and the tap after those lifts it back to the
    // rack. Only the placement is ever scored: the notes and the lift are free.
    if (cells[i]) {
      if (mark[i] === M_BOTH) { liftTile(i); return; }
      cycleMark(i);
      return;
    }
    if (sel < 0 || used[sel]) { say('Pick a tile first, then tap a square'); return; }
    const val = BANK[sel];
    const next = cells.slice(); next[i] = val;
    // advance selection to the next unused tile of the same value, for fast runs
    const usedCount = {};
    for (const v of next) { if (v) usedCount[v] = (usedCount[v] || 0) + 1; }
    let nextSel = -1, seenV = 0;
    for (let j = 0; j < BANK.length; j++) {
      if (BANK[j] !== val) continue;
      seenV += 1;
      if (seenV > (usedCount[val] || 0)) { nextSel = j; break; }
    }
    setSel(nextSel);
    commit(next, true);
  }

  function selectTile(j) {
    if (!playing || used[j]) return;
    const next = sel === j ? -1 : j;
    setSel(next);
  }

  // one free hint: place a correct tile in an empty cell whose value is still
  // free on the rack (safe even if the player has misplaced others)
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const freeAvail = {};
    BANK.forEach((d, j) => { if (!used[j]) freeAvail[d] = (freeAvail[d] || 0) + 1; });
    for (const [r, c] of FREE) {
      const i = r * N + c;
      if (cells[i]) continue;
      const d = PUZZLE.sol[r][c];
      if (freeAvail[d] > 0) {
        const next = cells.slice(); next[i] = d;
        // a hint is correct by construction, so it lands fully certain
        const nm = mark.slice(); nm[i] = M_BOTH;
        const g2 = { ...g, cells: next, mark: nm, moves: g.moves + 1, hintUsed: true };
        if (!g2.t0) g2.t0 = Date.now();
        pushHist(cells, mark);
        if (isSolved(next)) {
          g2.status = 'won'; g2.tEnd = Date.now();
          const errs = g2.moves > FEWEST ? g2.moves - FEWEST : 0;
          postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(errs / 2))));
          setG(g2); setJustWon(true); return;
        }
        setSel(-1);
        setG(g2);
        say('Hint placed — one square filled in.');
        return;
      }
    }
    say('No safe hint right now — lift a misplaced tile first.');
  }

  function revealEnd() {
    const next = Array(N * N).fill(0);
    for (const [r, c] of FREE) next[r * N + c] = PUZZLE.sol[r][c];
    const g2 = { ...g, cells: next, mark: Array(N * N).fill(0), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setSel(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(N)); setSel(-1); setJustWon(false); setEndClosed(false); setHist([]);
  }

  function shareText() {
    const g5 = won ? Math.max(1, Math.round(finalScore / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Tally #${PUZZLE.num} · ${PUZZLE.sunday ? '6×6 · ' : ''}${g.moves} moves${errors ? ` (${errors} error${errors === 1 ? '' : 's'})` : ' · clean'} · ${elapsed}${hintBit}${streakBit}`
      : `Tally #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/tally${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Tally #${PUZZLE.num} — balance every row and column from the rack. Fewest moves is ${FEWEST}.\n${shareUrl()}`
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

  // ── board geometry: cells scale with the column, so it fits phone → desktop ──
  const BOARD_MAX = N === 6 ? 432 : 384;
  const TARGETW = 46;
  const gridTemplate = `repeat(${N}, minmax(0, 1fr)) ${TARGETW}px`;

  // does every placed tile in this line already carry this line's half?
  function lineMarked(idx, isRow) {
    const bit = isRow ? M_ROW : M_COL;
    let any = false;
    for (let j = 0; j < N; j++) {
      const r = isRow ? idx : j, c = isRow ? j : idx;
      if (BLOCK[r][c] || GIVEN[r][c]) continue;
      const i = r * N + c;
      if (!cells[i]) continue;
      any = true;
      if (!(mark[i] & bit)) return false;
    }
    return any;
  }

  function targetChip(i, isRow, key) {
    const st = lineState(i, isRow);
    const locked = lineMarked(i, isRow);
    const bg = st.ok ? AGREE : locked ? (STAGE ? 'var(--stg-surf2)' : '#eef1f8') : SURF;
    const bd = st.ok ? AGREE : locked ? NOTE : st.bad ? `var(--stg-bad, rgba(180,83,9,0.75))` : SURF_B;
    const tc = st.ok ? AGREE_INK : st.bad ? `var(--stg-bad, ${COLORS.amber})` : INK;
    const label = isRow ? 'row' : 'column';
    return (
      <div key={key} className={`tl-tgt${playing ? ' live' : ''}`} role={playing ? 'button' : undefined} tabIndex={playing ? 0 : undefined}
        onClick={playing ? () => toggleLineMark(i, isRow) : undefined}
        onKeyDown={playing ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLineMark(i, isRow); } } : undefined}
        title={playing ? `${locked ? 'Clear' : 'Mark'} every tile here as in the right ${label}` : undefined}
        aria-label={playing ? `${isRow ? 'Row' : 'Column'} ${i + 1} target ${isRow ? ROWT[i] : COLT[i]} — ${locked ? 'clear' : 'mark'} the right-${label} note on its tiles` : undefined}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 13, border: `${locked && !st.ok ? 2 : 1.5}px solid ${bd}`, background: bg, fontFamily: MONO, lineHeight: 1.02, padding: '2px 0', minHeight: 34, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: st.ok ? AGREE_INK : locked ? NOTE : tc }}>{isRow ? ROWT[i] : COLT[i]}</span>
        {!st.ok && <span style={{ fontSize: 8.5, color: st.bad ? `var(--stg-bad, ${COLORS.amber})` : locked ? NOTE : FADED }}>{st.bad ? `${st.over ? 'over' : 'under'} ${Math.abs(st.sum - st.tgt)}` : `now ${st.sum}`}</span>}
      </div>
    );
  }

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      lead="Fill every open square so each row and column adds up to the target at its end."
      chips={[
        { label: 'Right row = rails top and bottom' },
        { label: 'Right column = rails at the sides' },
        { label: 'Both = certain' },
      ]}
      steps={[
        <>Tap a tile on your rack, then a square. <b>Drag a placed tile</b> to any open square to move it, or onto another unnoted tile to swap the two. You must use <b>every rack tile</b> and nothing else: digits repeat, and the rack tells you how many of each you have. Dotted squares are yours, a corner dot is a printed given, dark squares are out of play.</>,
        <>Tapping a placed tile again <b>cycles it</b>: right row, right column, certain, then back to the rack. Lifting is free. <b>Undo</b> steps back one change, <b>Clear board</b> lifts every tile at once. Both are free, and neither refunds a move: they restore the grid, not the score.</>,
        <>Certainty arrives in halves, so the notes do too: often the rack proves a digit belongs somewhere in a <b>row</b> before you can say which square, and a half-marked tile is still free to slide. Two proven lines meet at one square, so a tile carrying <b>both</b> halves is certain.</>,
        <><b>Hold</b> a tile (or right-click) to lift it straight back to the rack instead of walking the rest of the cycle. Tapping a <b>row or column target</b> notes that half on every tile in the line. Notes are free: they never cost a move and never count against your score. The full key sits under the board.</>,
        <>A tile with no note drags anywhere. <b>Drag a half-marked tile</b> along its proven line to move it without lifting, so the note survives. Tiles in the way shuffle one square toward the one it left, however many there are, and any tile that has proven the crossing line holds its square while you slide over it. It costs one move, the same as lifting and re-placing.</>,
      ]}
      knack="The rack supply is the lever. When the sums leave two ways to fill a line, the tiles you have left leave one."
      note="A tile that has proven the crossing line will not be pushed out of it, so it sits the slide out and you pass straight over it."
      footer="The fewest possible placements is a perfect 10, every extra placement costs a point. Ties break on fewest errors, then fastest time. One free hint, on your first ever play, fills a correct square."
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
      <DailyChrome slug="tally" name="Tally" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat strip.
          Tally grades a win from 10 down, so any solve is a win and a reveal is
          not: there is no partial state, and the finished figures lead with the
          score the game actually posted. */}
      {LOFT && (
        <Cap gameKey="tally" quizId={PUZZLE.quizId}
          name="Tally"
          cat="Numbers"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition \u00b7 6\u00d76' : null}
          figures={playing ? [
            { v: g.moves, k: `moves \u00b7 fewest ${FEWEST}` },
            { v: `${linesOk}/${2 * N}`, k: 'lines' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0, k: 'score' },
            { v: g.moves, k: `moves \u00b7 fewest ${FEWEST}` },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="tl-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.tl-wrap{padding-left:14px !important;padding-right:14px !important;}}
          .tl-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .tl-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          @keyframes tlshake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-4px);}40%,80%{transform:translateX(4px);}}
          .tl-shake{animation:tlshake .4s ease;}
          @keyframes tlfade{from{opacity:0;}}
          @keyframes tlstamp{from{opacity:0;transform:scale(.94);}}
          @media(max-width:520px){.tl-htp-f{display:none;}.tl-htp-s{display:inline;}}
          @media(max-width:560px){.tl-ttl{flex-direction:column;align-items:flex-start;gap:1px;}.tl-ttl h1{font-size:21px;letter-spacing:0.02em;}.tl-ttl .tl-ttl-dt{font-size:15px;}.tl-ttl-dot{display:none;}}
          .tl-cell{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:${MONO};font-size:21px;font-weight:500;color:${INK};box-sizing:border-box;touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
          .tl-blocked{background:${COLORS.ink};}
          .tl-given{background:${STAGE ? 'var(--stg-surf2)' : '#eef0f3'};border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.25));position:relative;}
          .tl-given::after{content:'';position:absolute;top:5px;right:5px;width:5px;height:5px;border-radius:50%;background:${STAGE ? 'var(--stg-mute)' : 'rgba(28,30,36,0.3)'};}
          .tl-empty{background:${STAGE ? 'var(--stg-cell)' : 'var(--white)'};border:1.5px dashed ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.4)'};cursor:pointer;}
          .tl-empty.hot{border:2px solid ${AGREE};box-shadow:0 0 0 3px ${RING};}
          .tl-placed{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.55));cursor:pointer;box-shadow:0 2.5px 0 rgba(28,30,36,0.5), inset 0 -3px 0 rgba(28,30,36,0.07);position:relative;}
          .tl-placed:active{transform:translateY(1px);}
          /* The certainty marks. Rails show which half is proven: rails top and
             bottom pin the tile into its horizontal band (right row), rails left
             and right pin it into the vertical one (right column), both = the
             exact square. On the stage they are the CATEGORY colour, and they
             stay apart from a balanced line by SHAPE, rails against a fill,
             rather than by hue. See NOTE / AGREE at the top of the component for
             why the old navy-versus-green split did not survive the stage. */
          .tl-placed.mk-row{background:${STAGE ? 'var(--stg-surf2)' : '#f5f7fc'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.14));border-top:4px solid ${NOTE};border-bottom:4px solid ${NOTE};}
          .tl-placed.mk-col{background:${STAGE ? 'var(--stg-surf2)' : '#f5f7fc'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.14));border-left:4px solid ${NOTE};border-right:4px solid ${NOTE};}
          .tl-placed.mk-both{background:${STAGE ? 'var(--stg-surf2)' : '#eef1f8'};border:2px solid ${NOTE};box-shadow:${STAGE ? `0 0 0 2px ${RING}` : '0 2.5px 0 rgba(14,29,64,0.6), inset 0 -3px 0 rgba(14,29,64,0.09)'};}
          .tl-placed.mk-both::after{content:'\\2713';position:absolute;top:1px;right:4px;font-family:${SANS};font-size:10px;font-weight:800;line-height:1;color:${NOTE};}
          /* a half-marked tile is draggable along the line it has proven. The
             axis-specific touch-action lets the page still scroll the OTHER
             way, so a row tile never eats a vertical swipe. */
          .tl-placed.tl-slide-row{cursor:ew-resize;touch-action:pan-y;}
          .tl-placed.tl-slide-col{cursor:ns-resize;touch-action:pan-x;}
          /* an unmarked tile goes anywhere, so the board owns the whole
             gesture on it: touch-action none, or the page scrolls instead */
          .tl-placed.tl-slide-free{cursor:grab;touch-action:none;}
          .tl-placed.tl-slide-free.tl-drag{cursor:grabbing;}
          /* the square a free drag would land on */
          .tl-cell.tl-drop{border:2px solid ${AGREE};box-shadow:0 0 0 3px ${RING};}
          .tl-cell.tl-drop-no{box-shadow:0 0 0 3px var(--stg-bad, ${COLORS.rust});}
          /* A DARK DROP SHADOW ON A NEAR-BLACK PAGE IS NOT A SHADOW. The stage
             says "lifted" with a ring of the accent instead, which is the same
             language the hot square and the selected rack tile use. */
          .tl-placed.tl-drag{box-shadow:${STAGE ? `0 0 0 3px ${RING}, 0 7px 15px rgba(0,0,0,0.55)` : '0 7px 15px rgba(14,29,64,0.3)'};}
          .tl-placed.tl-drag:active{transform:none;}
          /* legend swatches under the board reuse the same language at 22px */
          .tl-key{width:22px;height:22px;border-radius:5px;border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.55));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};flex:none;box-sizing:border-box;position:relative;}
          .tl-key.mk-row{background:${STAGE ? 'var(--stg-surf2)' : '#f5f7fc'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.14));border-top:3px solid ${NOTE};border-bottom:3px solid ${NOTE};}
          .tl-key.mk-col{background:${STAGE ? 'var(--stg-surf2)' : '#f5f7fc'};border: 1.5px solid var(--stg-line, rgba(28,30,36,0.14));border-left:3px solid ${NOTE};border-right:3px solid ${NOTE};}
          .tl-key.mk-both{background:${STAGE ? 'var(--stg-surf2)' : '#eef1f8'};border:2px solid ${NOTE};}
          .tl-key.mk-both::after{content:'\\2713';position:absolute;top:0;right:2px;font-family:${SANS};font-size:9px;font-weight:800;line-height:1.1;color:${NOTE};}
          .tl-legend{border-top: 1px solid var(--stg-line, rgba(28,30,36,0.14));margin-top:14px;padding-top:11px;}
          .tl-legend li{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
          @media(max-width:560px){.tl-legend li{align-items:flex-start;}}
          .tl-act{font-family:${SANS};font-weight:800;font-size:12.5px;border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.35));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};border-radius:7px;padding:6px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
          .tl-act:hover:not(:disabled){border-color:${NOTE};color:${NOTE};}
          .tl-act:disabled{opacity:0.38;cursor:default;}
          .tl-tgt{cursor:default;}
          .tl-tgt.live{cursor:pointer;}
          .tl-tgt.live:hover{box-shadow:0 0 0 2px ${STAGE ? RING : 'rgba(14,29,64,0.18)'};}
          .tl-rtile{width:42px;height:42px;border-radius:8px;border: 1.5px solid var(--stg-line2, rgba(28,30,36,0.55));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};font-family:${MONO};font-size:20px;font-weight:500;color:${INK};cursor:pointer;box-shadow:0 2.5px 0 rgba(28,30,36,0.5), inset 0 -3px 0 rgba(28,30,36,0.07);}
          .tl-rtile:active{transform:translateY(1px);box-shadow:0 1px 0 rgba(28,30,36,0.5);}
          .tl-rtile.sel{border:2px solid ${AGREE};box-shadow:0 0 0 3px ${RING}, 0 2.5px 0 rgba(28,30,36,0.5);}
          .tl-rtile.used{visibility:hidden;}
        ` }} />

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* puzzle-native top strip (Crux/Span pattern): quiet nav + player chip */}

        {/* masthead: pressed TALLY tiles with No./date inline, one rule beneath */}
        {!LOFT && (
        <DailyMasthead
          slug="tally"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.green}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: T.white, background: COLORS.green, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 6&times;6</span>}
          blocks={'TALLY'.split('').map((ch, i) => (
              <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26, background: i === 4 ? COLORS.green : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which
            runs full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {/* start tile — sits where the board goes until the player presses Start,
            which begins the clock. The ledger stays sealed until then. */}
        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Tally is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Fill the grid from the rack so every row and column adds up to its target.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="tl-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        {/* the ledger */}
        {!preStart && (
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* These figures move UP into the cap on a loft page; printing them
              twice is the one thing to avoid. */}
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>moves <b style={{ color: errors > 0 ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{g.moves}</b> &middot; fewest <b style={{ color: INK, fontWeight: 500 }}>{FEWEST}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>lines <b style={{ color: linesOk === 2 * N ? AGREE : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{linesOk}</b>/{2 * N}</span>
          </div>
          )}

          {/* board: N cells + a row-target column, then a col-target row beneath */}
          <div style={{ maxWidth: BOARD_MAX, margin: '0 auto' }}>
            <div className={shakeCell >= 0 ? 'tl-shake' : undefined} style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: 6 }}>
              {Array.from({ length: N }).map((_, r) => (
                <React.Fragment key={`row${r}`}>
                  {Array.from({ length: N }).map((__, c) => {
                    const i = r * N + c;
                    if (BLOCK[r][c]) return <div key={i} className="tl-cell tl-blocked" />;
                    if (GIVEN[r][c]) return <div key={i} className="tl-cell tl-given">{GIVEN[r][c]}</div>;
                    if (cells[i]) {
                      // a half-marked tile can travel along the line it proved;
                      // during a slide every affected tile is offset in place so
                      // the reshuffle is visible before the finger lifts
                      const ax = slideAxis(i);
                      const dv = dragView;
                      const isDrag = !!dv && dv.i === i;
                      let tf = null;
                      if (dv && dv.axis === 'free') {
                        const o = isDrag ? { x: dv.dx, y: dv.dy } : dv.offsets[i];
                        if (o) tf = `translate(${o.x}px, ${o.y}px)`;
                      } else if (dv) {
                        const off = isDrag ? dv.px : (dv.offsets[i] || 0);
                        if (off) tf = dv.axis === 'row' ? `translateX(${off}px)` : `translateY(${off}px)`;
                      }
                      const dropCls = dv && dv.axis === 'free' && dv.to === i && !isDrag ? (dv.ok ? ' tl-drop' : ' tl-drop-no') : '';
                      return (
                        <div key={i} className={`tl-cell tl-placed${playing && mark[i] ? ` ${MARK_CLASS[mark[i]]}` : ''}${ax ? ` tl-slide-${ax}` : ''}${isDrag ? ' tl-drag' : ''}${dropCls}`}
                          style={tf ? { transform: tf, transition: isDrag ? 'none' : 'transform .12s ease', zIndex: isDrag ? 3 : 2 } : (dv ? { transition: 'transform .12s ease' } : undefined)}
                          onClick={() => cellClick(r, c)}
                          onPointerDown={(e) => pressStart(e, r, c)}
                          onPointerMove={pressMove}
                          onPointerUp={pressEnd}
                          onPointerLeave={pressLeave}
                          onPointerCancel={pressCancel}
                          onContextMenu={(e) => { e.preventDefault(); pressCancel(); liftTile(i); }}
                          title={playing ? MARK_TITLE[mark[i]] : undefined}
                        >{cells[i]}</div>
                      );
                    }
                    const dropHere = dragView && dragView.axis === 'free' && dragView.to === i && dragView.ok;
                    return <div key={i} className={`tl-cell tl-empty${sel >= 0 && !used[sel] ? ' hot' : ''}${dropHere ? ' tl-drop' : ''}`} onClick={() => cellClick(r, c)} />;
                  })}
                  {targetChip(r, true, `rt${r}`)}
                </React.Fragment>
              ))}
              {Array.from({ length: N }).map((_, c) => targetChip(c, false, `ct${c}`))}
              <div />
            </div>
          </div>

          {/* rack */}
          {playing && (
            <>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, margin: '16px 2px 8px' }}>Your tiles &middot; use every one</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {BANK.map((d, j) => (
                  <button key={j} className={`tl-rtile${used[j] ? ' used' : (j === sel ? ' sel' : '')}`} onClick={() => selectTile(j)} aria-label={`tile ${d}`}>{d}</button>
                ))}
              </div>

              {/* what the next tap does, directly under the tiles it governs.
                  There is no tool to pick any more: the tap itself cycles. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 15 }}>
                <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: FADED, flex: '1 1 210px' }}>
                  {sel >= 0 && !used[sel]
                    ? `Placing ${BANK[sel]} — tap a square`
                    : 'Tap a tile, then a square. Tap a placed tile to cycle it: right row, right column, certain, back to the rack. Hold it to lift it at once.'}
                </span>
              </div>

              {/* CONTROLS, WITH THE TILES THEY ACT ON (owner, 2026-08-31).
                  They used to sit at the very foot of the card, under the whole
                  notes legend, which is ten lines of body copy. That put Undo
                  further from the rack than any other control on the page, and
                  on a phone it sat off the bottom of the screen for the whole
                  game. Undo and Clear board both put tiles BACK ON THE RACK, so
                  the rack is where a player looks for them.

                  The hairline reads --stg-line first: it was a flat
                  rgba(28,30,36,0.10), which is a dark rule on a near-black page
                  and drew nothing at all. */}
              {started && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--stg-line, rgba(28,30,36,0.10))', flexWrap: 'wrap' }}>
              <button className="tl-act" onClick={undo} disabled={!hist.length}
                title="Step the board back one change (Ctrl+Z). Your move count stands: undo restores the grid, not the score.">
                <Undo2 size={14} /> Undo
              </button>
              <button className="tl-act" onClick={clearBoard} disabled={!anyPlaced}
                title="Lift every tile back to the rack. Free, exactly like lifting them one at a time, and Undo puts the board back.">
                <Eraser size={14} /> Clear board
              </button>
              {hintOk && !g.hintUsed && (
                <button className="tl-btn" onClick={useHint} title="Fill one correct square (one hint, first play only)"
                  style={{ background: STAGE ? 'var(--stg-surf2)' : '#fdf6e3', border: '1.5px solid rgba(230,185,63,0.7)', color: '#8a6d1a', padding: '6px 12px', fontSize: 12.5 }}>
                  <Lightbulb size={14} /> Hint
                </button>
              )}
              {identity && g.moves > 0 && (
                <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Eye size={13} /> {armReveal ? 'Tap again — ends the puzzle and fills the solution' : 'Reveal & end'}
                </button>
              )}
              </div>
              )}
            </>
          )}

          {/* notes legend — the rack often proves a digit's ROW long before its
              square, so the marks come in halves. Spelled out under the board
              because a rail on a tile is not self-explanatory. */}
          {playing && (
            <div className="tl-legend">
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED, marginBottom: 9 }}>Your notes &middot; free, never scored</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontFamily: SANS, fontSize: 12.5, lineHeight: 1.45, color: INK, fontWeight: 600 }}>
                <li><span className="tl-key mk-row" aria-hidden="true" /><span><b>Right row.</b> This digit belongs somewhere in this row, though not yet a known square. <b>Drag it along the row</b> to move it without lifting it: the note travels with the tile and anything in the way shuffles over. One move, same as re-placing it.</span></li>
                <li><span className="tl-key mk-col" aria-hidden="true" /><span><b>Right column.</b> The same for a column, dragged up and down.</span></li>
                <li><span className="tl-key mk-both" aria-hidden="true" /><span><b>Certain.</b> Right row and right column, so this is the square. One more tap lifts it back to the rack.</span></li>
                <li style={{ marginBottom: 0, alignItems: 'flex-start' }}><span className="tl-key" aria-hidden="true" style={{ border: 'none', background: 'none', boxShadow: 'none' }} /><span style={{ color: FADED, fontWeight: 600 }}><b style={{ color: INK }}>How:</b> drag a tile with no note to any open square, or onto another unnoted tile to swap them. Tap a placed tile to walk it through the notes, right row then right column then certain, and the tap after those lifts it back to the rack. Hold a tile (or right-click) to lift it at once. Tapping a <b style={{ color: INK }}>row target</b> marks every tile in that row as in the right row, and a column target does the same down its column, so a tile you prove from both sides ends up certain on its own.</span></li>
              </ul>
            </div>
          )}

          <div className={STAGE ? undefined : 'loft-sol'}>
          {/* result */}
          {!playing && (
            <>
              {!isTodays && (
                <p style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                  You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                  <a href="/tally" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Tally &rarr;</a>
                  {' · '}
                  <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                </p>
              )}
            </>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
        </div>
        )}
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Tally"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0}/10 \u00b7 ${g.moves} moves \u00b7 ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Tally all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            missLabel="Errors"
            archive={puzzles
              .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
              .sort((x, y) => y.num - x.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/tally?p=${p.num}`,
                done: !!(stats && stats.rec && stats.rec[p.num]),
                score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
              }))}
            options={[
              { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Tally', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/tally?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} \u00b7 ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
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
        {!STAGE && <GamePanel self="tally" name="Tally" onShow={() => setShowChrome(true)} />}
        {/* standard quiz-page bottom: challenge + stats + join + leaderboard */}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="tally" name="Tally" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="tally"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="tally" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Tally to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s ledger, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s ledger, every day.
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

        {/* Personal stats wiring (myStats) is retained for the share string and
            streak logic; the on-page "Your stats" tile row is no longer shown.
            The daily leaderboard now renders in DailyGamesGrid's boardSlot,
            directly under the Challenge / Share actions (owner, 2026-07-23). */}
      </div>

      {/* the end-of-puzzle popup: the shared DailyEndCard as a dismissible modal (win or loss) */}
      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="tally"
          won={won}
          headline={won ? <>Grid balanced!</> : <>You scored {Math.round(((won ? finalScore : 0) / 10) * 100)}%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {g.moves} move{g.moves === 1 ? '' : 's'} &middot; {errors === 0 ? 'clean, no errors' : `${errors} error${errors === 1 ? '' : 's'}`} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; the balanced grid is shown above</>}
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
            <button className="tl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      {/* About Tally — crawlable prose for search, server-rendered into the HTML */}
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Tally</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Tally is a free daily number puzzle from Mind Loft, a logic puzzle in the sudoku family with a ledger twist. Each day gives you a grid and a rack of number tiles. Place every tile so that each row and each column adds up to the target printed at its end.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          What sets it apart from kakuro or a magic square is the supply. You have exactly the tiles you need, no more, no fewer, so when the arithmetic alone leaves two ways to finish a line, counting what is left on the rack settles it. Every board has a single solution, and solving it with no wasted moves scores a perfect ten.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new ledger drops every day at midnight Eastern, and Sundays step up to a bigger 6&times;6 board. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our geography puzzle, and <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>, our history puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
