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
// THE 2026-10-13 REBUILD (owner: "most days it is too hard to deduce", and the
// locking and sliding was more machinery than the game needed). The certainty
// notes, the tap cycle, the hold-to-lift and the slide along a proven line are
// gone. What is left is the whole game: arm a digit or pick a square, place,
// drag a tile anywhere to move or swap it, tap a placed tile twice (or drag it
// off the board, or press Backspace) to send it back to the rack, free. Each
// target says how much its line still needs, so the arithmetic is on the board
// instead of in the player's head. Scoring did not change: moves against the
// fewest possible, then time. From 2026-10-14 every board opens with exactly
// one row or column a single square short and is solvable by deduction alone
// (lib/tally-logic.js, proved independently in verify-daily-banks.mjs).
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
import { solve as logicSolve, starterLines } from '@/lib/tally-logic';
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
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
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

// grid gap between cells, in px: the drag maths needs the pitch
const GAP = 6;
// a drag must travel this far before it counts as a drag rather than a tap
const DRAG_MIN = 6;

function freshState(size) {
  return {
    v: 1,
    cells: Array(size * size).fill(0), // placed digit per grid cell (0 = empty/blocked/given)
    moves: 0,                          // placements and moves (lifting is free; extra moves = errors)
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
  // every board from 2026-10-14 opens with exactly one line a square short;
  // archive boards may not, so the copy that points at it reads this
  const HAS_STARTER = useMemo(() => starterLines(PUZZLE).length > 0, [PUZZLE]);
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
  // What a tap does next. `arm` is a digit picked from the rack (0 = none):
  // tapping empty squares places it while its supply lasts. `cur` is a square
  // picked on the board (-1 = none): a rack digit then goes there, an empty
  // square takes the tile sitting in it, a second tap sends it home.
  const [arm, setArm] = useState(0);
  const [cur, setCur] = useState(-1);
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
  // `fired` swallows the click that follows a drag
  const longRef = useRef({ fired: false });
  // live drag session (geometry is frozen at pointerdown); dragView is the
  // render-side mirror that offsets the tiles as the finger moves
  const dragRef = useRef(null);
  const [dragView, setDragView] = useState(null);
  const dragToldRef = useRef(false);

  // A give-up keeps the player's own tiles on the board until the end card's
  // Reveal tile is pressed; the finish beat would otherwise show the answer.
  // Nothing reads cells for play once the status has left 'playing'.
  const hideSol = isLoft('tally') && g.status === 'revealed' && !revealed;
  const cells = hideSol ? (g.pre || Array(N * N).fill(0)) : g.cells;
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

  // ONE ACCENT ON THE STAGE: the category step, read from the token so both
  // registers come right (owner, 2026-08-31: navy measured 1.34:1 on the
  // near-black ground and the registry green was the wrong green). A picked
  // square, an armed digit and a balanced line all use it, apart by SHAPE: a
  // ring for what you picked, a fill for a line the board agrees with.
  const NOTE = STAGE ? 'var(--stg-acc)' : COLORS.ember;
  const AGREE = STAGE ? 'var(--stg-acc)' : COLORS.green;
  // The ink that sits ON a filled accent chip. --stg-onramp is #08222e dark and
  // #ffffff light, which is exactly this job: white would fail on mint and dark
  // would fail on #047857.
  const AGREE_INK = STAGE ? 'var(--stg-onramp,#08222e)' : T.white;
  // the picked ring: the accent at low alpha, mixed from the token
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
        // a save from before the rebuild may carry the old notes; they are dropped
        if (saved && saved.v === 1 && Array.isArray(saved.cells) && saved.cells.length === N * N) { delete saved.mark; setG({ ...freshState(N), ...saved }); }
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

  // The rack, by digit: how many of each the day holds, and how many are
  // still off the board. The rack shows one key per digit with its count, so
  // the supply, which is the lever in this game, is read rather than counted.
  const DIGITS = useMemo(() => [...new Set(BANK)].sort((x, y) => x - y), [BANK]);
  const left = useMemo(() => {
    const out = Array(10).fill(0);
    for (const d of BANK) out[d]++;
    for (const v of cells) if (v) out[v]--;
    return out;
  }, [cells, BANK]);
  const rackLeft = DIGITS.reduce((a, d) => a + Math.max(0, left[d]), 0);
  const isFree = (i) => { const r = Math.floor(i / N), c = i % N; return !BLOCK[r][c] && !GIVEN[r][c]; };

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
  function pushHist(cs) {
    setHist((h) => {
      const next = h.length >= 60 ? h.slice(h.length - 59) : h.slice();
      next.push(cs.slice());
      return next;
    });
  }

  function buzz() { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(8); } catch (e) {} }

  function undo() {
    if (!playing || !hist.length) return;
    const prev = hist[hist.length - 1];
    setHist((h) => h.slice(0, -1));
    // the grid only: moves stand, and the clock keeps running
    setG((cur2) => ({ ...cur2, cells: prev.slice() }));
    setCur(-1);
    buzz();
  }

  // Lift every placed tile back to the rack at once. Lifting one tile is free,
  // so lifting them all is too, and a single undo puts the whole board back.
  function clearBoard() {
    if (!playing) return;
    if (!anyPlaced) { say('Nothing on the board to clear'); return; }
    pushHist(cells);
    const nc = cells.slice();
    for (const [r, c] of FREE) nc[r * N + c] = 0;
    setG((cur2) => ({ ...cur2, cells: nc }));
    setCur(-1);
    say('Board cleared. Your moves stand, and Undo puts it back.');
  }

  function commit(nextCells, extraMove) {
    pushHist(g.cells);
    const g2 = { ...g, cells: nextCells };
    if (extraMove) { g2.moves = g.moves + 1; if (!g2.t0) g2.t0 = Date.now(); }
    if (isSolved(nextCells)) {
      g2.status = 'won';
      g2.tEnd = Date.now();
      const errs = g2.moves > FEWEST ? g2.moves - FEWEST : 0;
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(errs / 2))));
      setG(g2);
      setJustWon(true);
      setArm(0); setCur(-1);
      return;
    }
    setG(g2);
  }

  // ── the moves ──────────────────────────────────────────────────────────────
  // Placing a tile from the rack costs one move. Moving a tile from one square
  // to another (or swapping two) costs one move, the same as lifting it and
  // placing it again would. Sending a tile home to the rack is free.
  function placeAt(i, v) {
    if (!playing || !isFree(i) || !v || left[v] <= 0) return false;
    const next = cells.slice();
    next[i] = v;
    commit(next, true);
    buzz();
    return true;
  }
  function liftTile(i) {
    if (!playing || !cells[i]) return;
    const next = cells.slice(); next[i] = 0;
    commit(next, false);
  }
  function moveTile(from, to) {
    if (!playing || from === to || !cells[from] || !isFree(to)) return false;
    const next = cells.slice();
    const swapped = cells[to];
    next[to] = cells[from]; next[from] = swapped;
    commit(next, true);
    buzz();
    if (!dragToldRef.current) {
      dragToldRef.current = true;
      say(swapped ? 'Swapped. Costs one move, same as replacing it.' : 'Moved. Costs one move, same as replacing it.');
    }
    return true;
  }
  // put a digit into a square that already holds a different tile: the old one
  // goes home, the new one goes in, one move
  function replaceAt(i, v) {
    if (!playing || !cells[i] || cells[i] === v || left[v] <= 0) return false;
    const next = cells.slice(); next[i] = v;
    commit(next, true);
    buzz();
    return true;
  }

  // ── free drag of a placed tile ─────────────────────────────────────────────
  // The tile follows the finger anywhere. It lands on the square under the
  // pointer if that square is open, trades places with a tile sitting there,
  // and dropped OFF the board it goes home to the rack (free). A printed or
  // blocked square refuses it and it snaps back.
  function freeSession(i, rect, gap = GAP) {
    return { i, r: Math.floor(i / N), c: i % N, pw: rect.width + gap, ph: rect.height + gap,
      live: false, x0: 0, y0: 0, dx: 0, dy: 0, to: -1, ok: false, off: false };
  }
  function freeTarget(d, dx, dy) {
    const c = d.c + Math.round(dx / d.pw), r = d.r + Math.round(dy / d.ph);
    // well clear of the grid (a target chip is one column wide) reads as home
    if (r < -1 || r > N || c < -1 || c > N) return { to: -1, ok: false, off: true };
    if (r < 0 || r >= N || c < 0 || c >= N) return { to: -1, ok: false, off: false };
    const t = r * N + c;
    if (t === d.i) return { to: t, ok: false, off: false };
    if (BLOCK[r][c] || GIVEN[r][c]) return { to: t, ok: false, off: false };
    return { to: t, ok: true, off: false };
  }
  function freeOffsets(d, to, ok) {
    const out = {};
    if (!ok || to < 0 || !cells[to]) return out;
    // the swap partner slides toward the square being vacated
    out[to] = { x: (d.c - (to % N)) * d.pw, y: (d.r - Math.floor(to / N)) * d.ph };
    return out;
  }

  function pressStart(e, r, c) {
    if (e && e.button === 2) return;
    const i = r * N + c;
    if (!playing || !isFree(i) || !cells[i] || !e || !e.currentTarget) return;
    longRef.current.fired = false;
    // the pitch is the square plus the grid's REAL gap, which the stylesheet
    // widens on desktop
    let gap = GAP;
    try { const gs = getComputedStyle(e.currentTarget.parentElement); gap = parseFloat(gs.columnGap) || GAP; } catch (err) {}
    const d = freeSession(i, e.currentTarget.getBoundingClientRect(), gap);
    d.x0 = e.clientX; d.y0 = e.clientY;
    dragRef.current = d;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function pressMove(e) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.live) {
      if (Math.abs(dx) < DRAG_MIN && Math.abs(dy) < DRAG_MIN) return;
      d.live = true;
      longRef.current.fired = true;   // swallow the click that ends the drag
    }
    const { to, ok, off } = freeTarget(d, dx, dy);
    d.dx = dx; d.dy = dy; d.to = to; d.ok = ok; d.off = off;
    setDragView({ i: d.i, dx, dy, to, ok, off, offsets: freeOffsets(d, to, ok) });
  }
  function pressEnd() {
    const d = dragRef.current;
    dragRef.current = null;
    if (dragView) setDragView(null);
    if (!d || !d.live) return;
    setCur(-1);
    if (d.off) { liftTile(d.i); return; }
    if (d.ok) moveTile(d.i, d.to);
  }
  function pressCancel() {
    dragRef.current = null;
    if (dragView) setDragView(null);
  }

  // ── taps ───────────────────────────────────────────────────────────────────
  // One rule a player can hold in their head: pick something, then put it
  // somewhere. A digit armed from the rack drops into every empty square you
  // tap while its supply lasts. A square picked on the board takes the next
  // digit you tap on the rack. A tile picked on the board moves to the next
  // empty square you tap, and a second tap on it sends it home. Tapping a tile
  // only ever picks it up, so a stray tap on the board never costs a move.
  function cellClick(r, c) {
    if (longRef.current.fired) { longRef.current.fired = false; return; }
    const i = r * N + c;
    if (!playing || !isFree(i)) return;
    if (!g.t0) startGame();
    // a tile on the board is picked: this tap is where it goes
    if (cur >= 0 && cells[cur]) {
      if (i === cur) { liftTile(i); setCur(-1); return; }
      // another tile: pick that one instead (free); an empty square: move there
      if (cells[i]) { setCur(i); return; }
      moveTile(cur, i);
      setCur(-1);
      return;
    }
    if (arm) {
      // a tile already on the board is picked up, never overwritten by a stray tap
      if (cells[i]) { setArm(0); setCur(i); return; }
      if (left[arm] > 0) placeAt(i, arm);
      else { say(`No ${arm}s left on the rack`); setArm(0); setCur(i); return; }
      if (left[arm] <= 1) setArm(0);
      return;
    }
    setCur(i);
  }

  function pickDigit(v) {
    if (!playing || !v) return;
    if (!g.t0) startGame();
    if (left[v] <= 0) { say(`No ${v}s left on the rack`); return; }
    if (cur >= 0) {
      if (!cells[cur]) { placeAt(cur, v); setCur(nextOpen(cur)); return; }
      if (cells[cur] !== v) { replaceAt(cur, v); return; }
    }
    setCur(-1);
    setArm(arm === v ? 0 : v);
  }

  // after a placement into a picked square, the pick walks on to the next
  // empty square in the same row (then onward in reading order), so typing a
  // row in reads naturally
  function nextOpen(from) {
    for (let k = 1; k < N * N; k++) {
      const j = (from + k) % (N * N);
      if (isFree(j) && !cells[j] && j !== from) return j;
    }
    return -1;
  }

  // Keyboard: arrows move the pick, 1-9 place, Backspace or Delete sends the
  // picked tile home, Escape lets go of everything.
  useEffect(() => {
    if (!started) return undefined;
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'Escape') { setArm(0); setCur(-1); return; }
      if (k.startsWith('Arrow')) {
        e.preventDefault();
        const dr = k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0;
        const dc = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0;
        let at = cur >= 0 ? cur : FREE.length ? FREE[0][0] * N + FREE[0][1] : -1;
        if (cur >= 0) {
          let r = Math.floor(at / N), c = at % N;
          for (let step = 0; step < N; step++) {
            r = (r + dr + N) % N; c = (c + dc + N) % N;
            if (isFree(r * N + c)) { at = r * N + c; break; }
          }
        }
        setArm(0); setCur(at);
        return;
      }
      if (/^[1-9]$/.test(k)) { e.preventDefault(); if (cur >= 0) pickDigit(Number(k)); else setArm(left[Number(k)] > 0 ? Number(k) : 0); return; }
      if ((k === 'Backspace' || k === 'Delete' || k === '0') && cur >= 0 && cells[cur]) { e.preventDefault(); liftTile(cur); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, playing, cur, arm, cells, left]);

  // One free hint, first play only: fills the square that deduction settles
  // next, given every tile you already have right. Safe even if some tiles are
  // wrong, since it reads only the right ones and only fills an empty square.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    const right = new Map();
    for (const [r, c] of FREE) { const i = r * N + c; if (cells[i] && cells[i] === PUZZLE.sol[r][c]) right.set(i, cells[i]); }
    let pick = null;
    try {
      const res = logicSolve(PUZZLE, right);
      pick = (res.order || []).find((s2) => !cells[s2.i] && left[s2.v] > 0) || null;
    } catch (e) {}
    if (!pick) {
      for (const [r, c] of FREE) {
        const i = r * N + c, d = PUZZLE.sol[r][c];
        if (!cells[i] && left[d] > 0) { pick = { i, v: d }; break; }
      }
    }
    if (!pick) { say('No safe hint right now. Send a misplaced tile home first.'); return; }
    const next = cells.slice(); next[pick.i] = pick.v;
    const g2 = { ...g, cells: next, moves: g.moves + 1, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    pushHist(cells);
    if (isSolved(next)) {
      g2.status = 'won'; g2.tEnd = Date.now();
      const errs = g2.moves > FEWEST ? g2.moves - FEWEST : 0;
      postResult(g2, Math.max(1, Math.min(10, 10 - Math.ceil(errs / 2))));
      setG(g2); setJustWon(true); return;
    }
    setArm(0); setCur(pick.i);
    setG(g2);
    say(`Hint: a ${pick.v} goes here.`);
  }

  function revealEnd() {
    const next = Array(N * N).fill(0);
    for (const [r, c] of FREE) next[r * N + c] = PUZZLE.sol[r][c];
    const g2 = { ...g, cells: next, pre: g.cells, status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setArm(0); setCur(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState(N)); setArm(0); setCur(-1); setJustWon(false); setEndClosed(false); setHist([]);
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
      ? `Tally #${PUZZLE.num}: balance every row and column from the rack. Fewest moves is ${FEWEST}.\n${shareUrl()}`
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

  // ── board geometry: cells scale with the column, so it fits phone to desktop ──
  const BOARD_MAX = N === 6 ? 432 : 384;
  const gridTemplate = `repeat(${N}, minmax(0, 1fr)) minmax(0, 1.1fr)`;
  // the rack always shows 1 to 9, so a digit the day does not hold reads as none
  const RACK = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const placedCount = BANK.length - rackLeft;

  // A target says what its line still needs, so the sum is on the board and
  // not in your head: the figure under the target is what the open squares
  // must add up to, and how many squares that is. A full line that hits its
  // target turns solid; one that cannot come right says by how much.
  function targetChip(i, isRow, key) {
    const st = lineState(i, isRow);
    const lit = cur >= 0 && (isRow ? Math.floor(cur / N) === i : cur % N === i);
    const need = st.tgt - st.sum;
    const label = isRow ? 'Row' : 'Column';
    const sub = st.ok ? 'Balanced' : st.bad ? `${st.over ? 'over' : 'short'} ${Math.abs(need)}` : `${need} in ${st.empty}`;
    return (
      <div key={key} className={`tl-tgt${lit ? ' lit' : ''}${st.ok ? ' ok' : ''}${st.bad && !st.ok ? ' bad' : ''}`}
        aria-label={`${label} ${i + 1}: target ${st.tgt}, ${st.ok ? 'balanced' : st.bad ? `${st.over ? 'over' : 'short'} by ${Math.abs(need)}` : `${need} still needed across ${st.empty} square${st.empty === 1 ? '' : 's'}`}`}>
        <span className="v">{st.tgt}</span>
        <span className="s">{sub}</span>
      </div>
    );
  }
  // the picked square's row and column, for the need line under the board
  const curLines = cur >= 0 ? [
    { k: `Row ${Math.floor(cur / N) + 1}`.toUpperCase(), st: lineState(Math.floor(cur / N), true) },
    { k: `Column ${(cur % N) + 1}`.toUpperCase(), st: lineState(cur % N, false) },
  ] : null;
  const needText = (st) => (st.ok ? 'Balanced'
    : st.bad ? `${st.over ? 'Over' : 'Short'} by ${Math.abs(st.tgt - st.sum)}`
    : `${st.tgt - st.sum} still needed in ${st.empty} square${st.empty === 1 ? '' : 's'}`);

  // Shared rules body — rendered in both the how-to-play modal and the start gate.
  const rulesBody = (
    <DailyRules
      accent={STAGE ? 'var(--stg-acc)' : undefined}
      lead="Fill every open square so each row and column adds up to the target at its end."
      chips={[
        { label: 'Use every tile once' },
        { label: 'One line opens a square short' },
        { label: 'Fewest moves wins' },
      ]}
      steps={[
        <>Tap a digit on the rack, then tap empty squares to place it, as many as you have. Or tap a square first and then a digit. You must use <b>every tile on the rack</b> and nothing else: digits repeat, and the rack shows how many of each you have left.</>,
        <>Under each target is what that line <b>still needs</b>: <b>7 in 2</b> means its two open squares must add up to 7. A line that balances turns solid. Shaded squares are printed givens, dark squares are out of play.</>,
        <><b>Start with the line that is one square short.</b> Every board from October 14, 2026 opens with exactly one, and what it needs is the tile that goes there. From then on, compare what a line needs with the tiles you have left: when only one pair on the rack makes the sum, that settles it.</>,
        <>Drag a placed tile to any open square to move it, or onto another tile to swap them. Or tap a placed tile, then an empty square. Tap it twice, drag it off the board, or press <b>Backspace</b> to send it home to the rack, which is free. <b>Undo</b> and <b>Clear board</b> are free too.</>,
      ]}
      knack="The rack supply is the lever. When the sums leave two ways to fill a line, the tiles you have left leave one."
      footer="Placing a tile costs a move, and so does moving one; sending a tile home does not. Using exactly as many moves as there are tiles is a perfect 10, and every two extra moves cost a point. Ties break on fewest extra moves, then fastest time. One free hint, on your first ever play, fills the next square you can work out."
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
          .tl-lab{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute);}
          .tl-lab b{color:var(--stg-acc-ink);font-weight:800;}
          .tl-prog{display:flex;flex-direction:column;gap:8px;margin:0 0 14px;}
          .tl-prog-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}
          .tl-segs{display:flex;gap:3px;}
          .tl-segs span{flex:1;height:8px;border-radius:2px;background:var(--stg-line2);}
          .tl-segs span.on{background:var(--stg-acc);}
          .tl-panel{--tl-block:#05070d;background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:20px;padding:20px 20px 16px;display:flex;flex-direction:column;align-items:center;}
          html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light'] .tl-panel{--tl-block:#1e2433;}
          .tl-grid{display:grid;gap:8px;width:min(480px,100%);}
          .tl-cell{aspect-ratio:1;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:${SANS};font-size:30px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--stg-ink);box-sizing:border-box;touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:background .12s ease, box-shadow .12s ease;padding:0;margin:0;min-width:0;}
          .tl-grid.n6 .tl-cell{font-size:26px;border-radius:10px;}
          .tl-cell:focus-visible{outline:3px solid var(--stg-acc);outline-offset:2px;}
          /* out of play: a dark slab, so it reads as no square at all */
          .tl-blocked{background:var(--tl-block);border:1.5px solid var(--tl-block);}
          .tl-given{background:color-mix(in srgb, var(--stg-ink) 14%, var(--stg-cell));border:1.5px solid transparent;color:var(--stg-ink);}
          .tl-empty{background:var(--stg-cell);border:1.5px dashed var(--stg-cell-line);cursor:pointer;}
          /* the row and column of the picked square, so a line reads as one */
          .tl-cell.peer.tl-empty,.tl-cell.peer.tl-placed{background:color-mix(in srgb, var(--stg-acc) 12%, var(--stg-cell));}
          .tl-cell.peer.tl-given{background:color-mix(in srgb, var(--stg-acc) 12%, color-mix(in srgb, var(--stg-ink) 14%, var(--stg-cell)));}
          /* an armed digit has somewhere to go: every open square says so */
          .tl-empty.hot{border:2px dashed var(--stg-acc);}
          @media(hover:hover){.tl-empty.hot:hover{box-shadow:0 0 0 3px ${RING};}}
          .tl-placed{background:var(--stg-cell);border:2.5px solid var(--stg-acc);color:var(--stg-acc-ink);cursor:grab;box-shadow:0 3px 0 color-mix(in srgb, var(--stg-acc) 28%, transparent);position:relative;touch-action:none;}
          .tl-placed.same{background:color-mix(in srgb, var(--stg-acc) 18%, var(--stg-cell));}
          .tl-cell.cur{border:3px solid var(--stg-acc);background:color-mix(in srgb, var(--stg-acc) 28%, var(--stg-cell));box-shadow:none;}
          .tl-placed.cur{box-shadow:0 0 0 3px ${RING};}
          .tl-placed.tl-drag{cursor:grabbing;box-shadow:0 0 0 3px ${RING}, 0 7px 15px rgba(0,0,0,0.35);}
          .tl-placed.tl-drag.home{border-style:dashed;background:var(--stg-surf2);}
          /* the square a drag would land on */
          .tl-cell.tl-drop{border:3px solid var(--stg-acc);box-shadow:0 0 0 3px ${RING};}
          .tl-cell.tl-drop-no{box-shadow:0 0 0 3px var(--stg-bad);}
          .tl-tgt{cursor:default;transition:border-color .12s ease;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:14px;line-height:1.05;box-sizing:border-box;background:var(--stg-ground);border:1.5px solid var(--stg-cell-line);font-family:${SANS};min-height:64px;padding:2px 0;min-width:0;}
          .tl-tgt .v{font-size:22px;font-weight:800;color:var(--stg-ink);font-variant-numeric:tabular-nums;}
          .tl-tgt .s{font-size:11px;font-weight:800;color:var(--stg-mute);white-space:nowrap;}
          .tl-tgt.lit{border:2.5px solid var(--stg-acc);}
          .tl-tgt.lit .s{color:var(--stg-acc-ink);}
          .tl-tgt.ok{background:var(--stg-acc);border:2px solid var(--stg-acc);}
          .tl-tgt.ok .v,.tl-tgt.ok .s{color:var(--stg-onramp);}
          .tl-tgt.bad{border:2px solid var(--stg-bad);}
          .tl-tgt.bad .v,.tl-tgt.bad .s{color:var(--stg-bad);}
          .tl-need{width:100%;max-width:560px;margin-top:16px;box-sizing:border-box;border-radius:14px;background:var(--stg-ground);border:1px solid var(--stg-line);padding:10px 14px;display:flex;flex-direction:column;gap:8px;min-height:44px;justify-content:center;}
          .tl-need-row{display:flex;align-items:center;gap:10px;}
          .tl-need-l{min-width:132px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-acc-ink);}
          .tl-need-t{font-size:13px;font-weight:700;color:var(--stg-ink);}
          .tl-need-t.bad{color:var(--stg-bad);}
          .tl-need-h{font-size:13px;font-weight:600;color:var(--stg-mute);}
          .tl-say{width:100%;max-width:560px;margin-top:14px;display:flex;flex-direction:column;gap:2px;}
          .tl-say-a{font-size:15px;font-weight:700;color:var(--stg-ink);line-height:1.35;}
          .tl-say-b{font-size:12px;font-weight:600;color:var(--stg-mute);}
          .tl-tiles{width:100%;max-width:560px;margin-top:14px;display:flex;flex-direction:column;gap:6px;}
          .tl-tiles-top{display:flex;justify-content:space-between;gap:12px;}
          /* the rack: one key per digit, with what is left of it */
          .tl-rack{display:grid;grid-template-columns:repeat(9, minmax(0,1fr));gap:6px;}
          .tl-rtile{position:relative;height:60px;box-sizing:border-box;border-radius:12px;border:1.5px solid var(--stg-cell-line);background:var(--stg-cell);font-family:${SANS};cursor:pointer;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1;min-width:0;}
          .tl-rtile .d{font-size:23px;font-weight:800;color:var(--stg-ink);}
          .tl-rtile .n{font-size:11px;font-weight:800;color:var(--stg-mute);}
          .tl-rtile:hover:not(:disabled){background:var(--stg-surf2);}
          .tl-rtile.sel{border:2px solid var(--stg-acc);background:var(--stg-acc);box-shadow:0 0 0 3px ${RING};}
          .tl-rtile.sel .d,.tl-rtile.sel .n{color:var(--stg-onramp);}
          .tl-rtile.out{background:transparent;border:1.5px dashed var(--stg-line2);cursor:default;}
          .tl-rtile.out .d{color:var(--stg-mute);text-decoration:line-through;}
          .tl-foot{width:100%;margin-top:18px;display:flex;align-items:center;justify-content:flex-end;gap:10px;border-top:1px solid var(--stg-line);padding-top:14px;}
          .tl-foot-n{flex:1;font-size:12px;font-weight:600;color:var(--stg-mute);}
          .tl-act{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2);border:1.5px solid var(--stg-cell-line);border-radius:12px;padding:0 16px;min-height:48px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
          .tl-act:hover:not(:disabled){background:var(--stg-surf2);}
          .tl-act:disabled{color:var(--stg-mute);border-color:var(--stg-line2);cursor:default;}
          .tl-act.hint{color:var(--stg-acc-ink);border-color:var(--stg-acc);}
          .tl-under{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0 12px;padding:12px 2px 0;}
          .tl-under-n{flex:1 1 180px;min-width:0;font-size:12px;font-weight:600;color:var(--stg-mute);}
          .tl-reveal{margin-left:auto;background:none;border:none;cursor:pointer;font-family:${SANS};font-weight:700;font-size:12px;color:var(--stg-ink2);text-decoration:underline;text-underline-offset:3px;min-height:44px;padding:0;display:inline-flex;align-items:center;gap:5px;flex:none;}
          .tl-reveal.armed{color:var(--stg-bad);}
          .tl-m{display:none;}
          @media(max-width:560px){
            .tl-lab{font-size:10px;}
            .tl-prog{gap:6px;padding:0 10px;}
            .tl-segs{gap:2px;}
            .tl-segs span{height:6px;}
            .tl-panel{background:transparent;border:none;border-radius:0;padding:0 10px;}
            .tl-grid{gap:6px;width:min(348px,100%);}
            .tl-cell{font-size:24px;border-radius:10px;}
            .tl-grid.n6 .tl-cell{font-size:20px;border-radius:9px;}
            .tl-tgt{min-height:50px;border-radius:12px;gap:2px;}
            .tl-tgt .v{font-size:18px;}
            .tl-tgt .s{font-size:10px;}
            .tl-grid.n6 .tl-tgt .v{font-size:16px;}
            .tl-grid.n6 .tl-tgt .s{font-size:9px;}
            .tl-need{display:none;}
            .tl-say-a{font-size:14px;}
            .tl-rack{grid-template-columns:repeat(5, minmax(0,1fr));}
            .tl-rtile{height:52px;border-radius:11px;}
            .tl-rtile .d{font-size:21px;}
            .tl-rtile .n{font-size:10px;}
            .tl-foot{border-top:none;padding-top:0;margin-top:10px;gap:8px;}
            .tl-foot-n{display:none;}
            .tl-act{flex:1;padding:0 8px;}
            .tl-under{padding:4px 10px 0;}
            .tl-under-n{font-size:11px;}
            .tl-d{display:none;}
            .tl-m{display:inline;}
          }
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
                <p style={{ margin: 0, color: FADED }}>Each target shows what its line still needs.{HAS_STARTER ? ' Start where a line is one square short.' : ''}</p>
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
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {/* tiles placed so far, one segment per tile on the rack */}
          <div className="tl-prog">
            <div className="tl-prog-top">
              <span className="tl-lab">Tiles · <b>{placedCount}</b> of {BANK.length} placed</span>
              <span className="tl-lab"><span className="tl-d">{linesOk} of {2 * N} lines balanced</span><span className="tl-m">{linesOk}/{2 * N} lines</span></span>
            </div>
            <div className="tl-segs" aria-hidden="true">
              {BANK.map((_, k) => <span key={k} className={k < placedCount ? 'on' : undefined} />)}
            </div>
          </div>

          <div className="tl-panel">
          {/* board: N cells + a row-target column, then a col-target row beneath */}
            <div className={`tl-grid${N === 6 ? ' n6' : ''}${shakeCell >= 0 ? ' tl-shake' : ''}`} style={{ gridTemplateColumns: gridTemplate }}>
              {Array.from({ length: N }).map((_, r) => (
                <React.Fragment key={`row${r}`}>
                  {Array.from({ length: N }).map((__, c) => {
                    const i = r * N + c;
                    const peer = playing && cur >= 0 && i !== cur && (Math.floor(cur / N) === r || cur % N === c) ? ' peer' : '';
                    if (BLOCK[r][c]) return <div key={i} className="tl-cell tl-blocked" aria-label="out of play" />;
                    if (GIVEN[r][c]) return <div key={i} className={`tl-cell tl-given${peer}`} aria-label={`printed ${GIVEN[r][c]}`}>{GIVEN[r][c]}</div>;
                    if (cells[i]) {
                      // a placed tile follows the finger while dragged; the
                      // tile it would trade places with eases toward the gap
                      const dv = dragView;
                      const isDrag = !!dv && dv.i === i;
                      let tf = null;
                      if (dv) {
                        const o = isDrag ? { x: dv.dx, y: dv.dy } : dv.offsets[i];
                        if (o) tf = `translate(${o.x}px, ${o.y}px)`;
                      }
                      const dropCls = dv && dv.to === i && !isDrag ? (dv.ok ? ' tl-drop' : ' tl-drop-no') : '';
                      const same = playing && arm && cells[i] === arm ? ' same' : '';
                      return (
                        <button type="button" key={i} className={`tl-cell tl-placed${i === cur && playing ? ' cur' : ''}${peer}${same}${isDrag ? ' tl-drag' : ''}${isDrag && dv.off ? ' home' : ''}${dropCls}`}
                          style={tf ? { transform: tf, transition: isDrag ? 'none' : 'transform .12s ease', zIndex: isDrag ? 3 : 2 } : (dv ? { transition: 'transform .12s ease' } : undefined)}
                          onClick={() => cellClick(r, c)}
                          onPointerDown={(e) => pressStart(e, r, c)}
                          onPointerMove={pressMove}
                          onPointerUp={pressEnd}
                          onPointerCancel={pressCancel}
                          onContextMenu={(e) => { e.preventDefault(); pressCancel(); liftTile(i); setCur(-1); }}
                          aria-label={playing ? `${cells[i]}, row ${r + 1} column ${c + 1}. Tap to pick it up, tap twice to send it home.` : `${cells[i]}`}
                          title={playing ? (i === cur ? 'Tap a square to move it there, or tap it again to send it home' : 'Drag to move or swap. Tap twice to send it home.') : undefined}
                        >{cells[i]}</button>
                      );
                    }
                    const dropHere = dragView && dragView.to === i && dragView.ok;
                    const hot = playing && arm && left[arm] > 0 ? ' hot' : '';
                    const pickedTile = playing && cur >= 0 && cells[cur] ? ' hot' : '';
                    return <button type="button" key={i} aria-label={`empty, row ${r + 1} column ${c + 1}${i === cur && playing ? ', picked' : ''}`}
                      className={`tl-cell tl-empty${hot || pickedTile}${i === cur && playing ? ' cur' : ''}${peer}${dropHere ? ' tl-drop' : ''}`} onClick={() => cellClick(r, c)} />;
                  })}
                  {targetChip(r, true, `rt${r}`)}
                </React.Fragment>
              ))}
              {Array.from({ length: N }).map((_, c) => targetChip(c, false, `ct${c}`))}
              <div />
            </div>

          {/* rack */}
          {playing && (
            <>
              {/* what the picked square's two lines still need */}
              <div className="tl-need">
                {curLines ? curLines.map((ln) => (
                  <div key={ln.k} className="tl-need-row">
                    <span className="tl-need-l">{ln.k} · {ln.st.tgt}</span>
                    <span className={`tl-need-t${ln.st.bad ? ' bad' : ''}`}>{needText(ln.st)}</span>
                  </div>
                )) : <span className="tl-need-h">Pick a square to see what its row and column still need.</span>}
              </div>

              {/* what the next tap does, right above the tiles it governs */}
              <div className="tl-say" aria-live="polite">
                <span className="tl-say-a">
                  {cur >= 0 && cells[cur]
                    ? `Moving ${cells[cur]}. Tap a square to put it there, or tap it again to send it home.`
                    : cur >= 0
                      ? <><span className="tl-d">Row {Math.floor(cur / N) + 1}, column {(cur % N) + 1} is picked. Tap a tile to place it there.</span><span className="tl-m">{curLines ? curLines.map((ln) => `${ln.k[0] + ln.k.slice(1).toLowerCase()} ${ln.st.ok ? 'is balanced' : ln.st.bad ? `is ${ln.st.over ? 'over' : 'short'} by ${Math.abs(ln.st.tgt - ln.st.sum)}` : `needs ${ln.st.tgt - ln.st.sum} in ${ln.st.empty}`}.`).join(' ') : ''} Tap a tile to place it.</span></>
                      : arm
                        ? `Placing ${arm}s. Tap empty squares (${Math.max(0, left[arm])} left).`
                        : 'Tap a tile, then tap squares. Or tap a square, then a tile.'}
                </span>
                <span className="tl-say-b">
                  <span className="tl-d">{cur >= 0 && !cells[cur] ? 'Or pick a tile first and tap squares. ' : ''}Drag a placed tile to move or swap it.</span>
                  <span className="tl-m">Drag a placed tile to move or swap it.</span>
                </span>
              </div>

              <div className="tl-tiles">
                <div className="tl-tiles-top">
                  <span className="tl-lab">Your tiles · use every one</span>
                  <span className="tl-lab">{rackLeft} left</span>
                </div>
                <div className="tl-rack">
                  {RACK.map((d) => {
                    const n = Math.max(0, left[d]);
                    return (
                      <button key={d} type="button" className={`tl-rtile${n <= 0 ? ' out' : (arm === d ? ' sel' : '')}`} onClick={() => pickDigit(d)}
                        disabled={n <= 0}
                        aria-pressed={arm === d}
                        aria-label={`${d}, ${n} left`}>
                        <span className="d">{d}</span><span className="n">{n > 0 ? `×${n}` : 'none'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* controls, with the tiles they act on (owner, 2026-08-31) */}
              {started && (
              <div className="tl-foot">
                <span className="tl-foot-n">Sending a tile home, Undo and Clear board are free. Placing or moving costs a move.</span>
                {hintOk && !g.hintUsed && (
                  <button type="button" className="tl-act hint" onClick={useHint} title="Fill the next square you can work out (one hint, first play only)">
                    <Lightbulb size={15} aria-hidden="true" /> Hint
                  </button>
                )}
                <button type="button" className="tl-act" onClick={undo} disabled={!hist.length}
                  title="Step the board back one change (Ctrl+Z). Your move count stands: undo restores the grid, not the score.">
                  Undo
                </button>
                <button type="button" className="tl-act" onClick={clearBoard} disabled={!anyPlaced}
                  title="Send every tile home to the rack. Free, and Undo puts the board back.">
                  Clear board
                </button>
              </div>
              )}
            </>
          )}
          </div>

          {started && (
            <div className="tl-under">
              <span className="tl-under-n">
                <span className="tl-d">Shaded squares are printed. Dark squares are out of play.</span>
                <span className="tl-m">Sending a tile home is free.</span>
              </span>
              {identity && g.moves > 0 && (
                <button type="button" className={`tl-reveal${armReveal ? ' armed' : ''}`} onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}>
                  <Eye size={13} aria-hidden="true" /> {armReveal ? 'Tap again: ends the puzzle and fills the solution' : 'Reveal and end'}
                </button>
              )}
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
                  <a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
            challengeMetric={won ? g.moves : null}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${won ? Math.max(1, Math.min(10, 10 - Math.ceil(errors / 2))) : 0}/10 \u00b7 ${g.moves} moves \u00b7 ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2013',
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
          {/* The finish card's stat cards land here, below Add to Home Screen (app/StageFinish.jsx). */}
          <div id="stf-stats-slot" />
        </div>
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Tally to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s ledger, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s ledger, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: STAGE ? 'var(--stg-acc)' : COLORS.ink, color: STAGE ? 'var(--stg-onramp)' : T.white, cursor: 'pointer' }}>Got it</button>
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
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: STAGE ? 'var(--stg-ink)' : COLORS.ink, color: STAGE ? 'var(--stg-ground)' : T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>
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
            <button className="tl-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: STAGE ? 'var(--stg-acc)' : COLORS.ink, color: STAGE ? 'var(--stg-onramp)' : T.white, borderColor: STAGE ? 'var(--stg-acc)' : undefined }}>Play</button>
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
          What sets it apart from kakuro or a magic square is the supply. You have exactly the tiles you need, no more, no fewer, so when the arithmetic alone leaves two ways to finish a line, counting what is left on the rack settles it. Every board opens with one row or column a single square short, has a single solution you can reach by working it out, and solving it with no wasted moves scores a perfect ten.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new ledger drops every day at midnight Eastern, and Sundays step up to a bigger 6&times;6 board. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More dailies: <a href="/crux" style={{ color: INK, fontWeight: 800 }}>Crux</a>, our clueless crossword, <a href="/span" style={{ color: INK, fontWeight: 800 }}>Span</a>, our geography puzzle, and <a href="/dating" style={{ color: INK, fontWeight: 800 }}>Dating</a>, our history puzzle.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
