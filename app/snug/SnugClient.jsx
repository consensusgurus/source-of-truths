'use client';

// Snug, the daily fit-the-shapes puzzle.
//
// Each day: a board of squares (a 6x6 with a few squares missing, a 7x7 on
// Sundays) and a handful of pieces whose squares add up to the board exactly.
// Place every piece, turning and flipping it as needed, so the board is
// covered with no overlaps. There is exactly one way to do it, so a full board
// is always the right board and the game ends the moment the last piece lands.
//
// THE LANE IS SIXES': nothing is counted against you, a solve is a flat 10,
// and the daily leaderboard is a straight race on the clock. `miss` is null on
// the registry row for that reason. The pad shows every piece SCRAMBLED (a
// fixed rotation and flip per slot), so the shape of the hole is the only clue
// to how a piece goes in.
//
// Interaction, the same tap model the kids board (app/kids/fitit) uses:
//   - tap a piece on the pad to pick it up (it lights), tap it again to put it
//     down; Rotate / Flip (R / F) turn the piece in hand
//   - tap a board square where ONE of the piece's squares should sit: if the
//     piece fits there in exactly one position it drops; if it could sit in
//     several, the piece's marked corner square is used; if it fits nowhere
//     the square flashes and nothing moves (a tap never costs anything)
//   - tap a placed piece to lift it back into your hand, so a wrong guess is
//     one tap to undo; Undo takes back the last drop or lift as well
//
// Forked from app/sixes/SixesClient.jsx for its chrome: banked puzzles gated
// by Eastern date on the server (app/snug/page.js), per-puzzle localStorage
// saves, /snug?p=N archive pinning, streaks, and the shared /api/quiz/* flow.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, RotateCcw, Lightbulb, Eye, Smartphone, RotateCw, FlipHorizontal2, Trash2 } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import ReportIssue from '../ReportIssue';
import StageFold from '../StageFold';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import LoftCap from '../LoftCap';
import StageChrome from '../StageChrome';
import { isStage } from '@/lib/stage';
import { useStageTheme } from '@/lib/stage-theme';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import LoftFinish from '../LoftFinish';
import { CONTEST, contestIsLive } from '@/lib/contest';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import { isLoft } from '@/lib/loft';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

// Snug's legacy identity is a slate blue, the pre-stage hue only the old
// tables read. Every colour the board paints on the stage is a token, and on
// the Loft page it derives from COLORS.accent rather than a second literal.
const ACCENT = '#3b5bdb';
const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  faded: T.muted,
  accent: ACCENT,
  accentSoft: '#edf1fd',
  accentTint: '#dbe3fb',
  accentDeep: '#26409e',
  green: T.successDeep,
};
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_snug_help_seen';
const STATS_KEY = 'sot_snug_stats';

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

// ─── personal stats + streak (localStorage), the shared daily pattern ───────
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

// ─── piece geometry ─────────────────────────────────────────────────────────
const K = (r, c) => r * 16 + c;
function norm(cells) {
  const mr = Math.min(...cells.map((p) => p[0])), mc = Math.min(...cells.map((p) => p[1]));
  return cells.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const rot = (cells) => norm(cells.map(([r, c]) => [c, -r]));
const flip = (cells) => norm(cells.map(([r, c]) => [r, -c]));
// The pad's starting orientation for slot i: a fixed turn and a flip on the
// odd slots, so the solution orientation never shows on the pad. Symmetric
// pieces come out where they started, which gives nothing away.
function scrambled(piece, i) {
  let o = norm(piece);
  const t = (i * 3 + 1) % 4;
  for (let k = 0; k < t; k++) o = rot(o);
  if (i % 2) o = flip(o);
  return o;
}

function freshState(PUZZLE) {
  return {
    v: 1,
    ori: PUZZLE.pieces.map((p, i) => scrambled(p, i)),  // orientation in hand / on the board, per piece
    placed: PUZZLE.pieces.map(() => null),               // null, or { dr, dc } for a piece on the board
    moves: 0,
    hintUsed: false,
    status: 'playing',             // playing | won | revealed
    t0: null,                      // stays null until the player presses Start: opening
    tEnd: null,                    // a game is not starting one (see CLAUDE.md)
  };
}

const HAPT = { ok: [8], win: [10, 40, 20, 40, 20, 60], bad: [20] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

export default function SnugClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const W = PUZZLE.w, H = PUZZLE.h;
  const PIECES = PUZZLE.pieces;
  const NP = PIECES.length;
  const STORE_KEY = `sot_snug_${PUZZLE.num}`;
  const REGION = useMemo(() => {
    const s = new Set();
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (PUZZLE.mask[r][c] === '1') s.add(K(r, c));
    return s;
  }, [PUZZLE, W, H]);

  const [g, setG] = useState(() => freshState(PUZZLE));
  const [armed, setArmed] = useState(-1);      // piece in hand, -1 = none
  const [hover, setHover] = useState(null);    // [r, c] under the pointer while a piece is in hand
  const [flash, setFlash] = useState(null);    // K(r,c) of a square that refused a drop
  const [canUndo, setCanUndo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  const [armClear, setArmClear] = useState(false);
  const [justWon, setJustWon] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  // One free hint, first play only (lib/hint-gate.js).
  const [hintOk, setHintOk] = useState(false);
  useEffect(() => { if (stats) setHintOk(hintAllowed('snug', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('snug'); }, [g.hintUsed]);
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
  const undoRef = useRef([]);
  const flashTimer = useRef(null);

  const [showChrome, setShowChrome] = useState(false);
  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('snug');
  const STAGE = isStage('snug', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('snug');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('snug'), '--stg-acc-lt': gameColorLight('snug'), '--stg-onramp-lt': gameOnrampLight('snug'), '--stg-acc-ink-lt': gameAccentInkLight('snug') };
  const [stageTheme] = useStageTheme();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_DEEP_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accentDeep;
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => {
    if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`);
  }, []);
  const iq = useIqStanding({ game: 'snug', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'snug', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'snug', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'snug', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'snug', active: LOFT && !playing });

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!armClear) return undefined;
    const t = setTimeout(() => setArmClear(false), 4000);
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

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.ori) && saved.ori.length === NP && Array.isArray(saved.placed) && saved.placed.length === NP) {
          setG({ ...freshState(PUZZLE), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_snug_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_snug_day');
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

  // ---- metrics + leaderboard (the shared /api/quiz/* flow) ----
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
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  // Which piece owns which square, from the placements.
  const owner = useMemo(() => {
    const m = new Map();
    g.placed.forEach((p, i) => { if (!p) return; for (const [r, c] of g.ori[i]) m.set(K(r + p.dr, c + p.dc), i); });
    return m;
  }, [g.placed, g.ori]);
  const placedCount = useMemo(() => g.placed.filter(Boolean).length, [g.placed]);
  const hasEntries = placedCount > 0;

  function fits(o, dr, dc, skip, own = owner) {
    for (const [r, c] of o) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= H || cc >= W) return false;
      const k = K(rr, cc);
      if (!REGION.has(k)) return false;
      const w = own.get(k);
      if (w != null && w !== skip) return false;
    }
    return true;
  }
  // Every position that puts one of piece i's squares on (r, c), the piece's
  // corner square (its row-major first cell) first when it is among them.
  function candidates(i, r, c) {
    const o = g.ori[i];
    const out = [];
    for (const [ar, ac] of o) { const dr = r - ar, dc = c - ac; if (fits(o, dr, dc, i)) out.push({ dr, dc }); }
    const h = { dr: r - o[0][0], dc: c - o[0][1] };
    const hi = out.findIndex((x) => x.dr === h.dr && x.dc === h.dc);
    if (hi > 0) out.unshift(out.splice(hi, 1)[0]);
    return out;
  }

  const REC_KEY = `sot_snug_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    const acted = g.placed.some(Boolean) || g.hintUsed;
    if (!acted || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: 0, won: g2.status === 'won' })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Nothing is counted against you, so the board resolves every solver
        // tie on the clock alone (score, then guesses at 0, then time).
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }

  // ---- undo (placements and orientations; a spent hint stays spent) ----
  function pushUndo() {
    undoRef.current = [...undoRef.current.slice(-49), { ori: g.ori.map((o) => o.slice()), placed: g.placed.slice() }];
    if (!canUndo) setCanUndo(true);
  }
  function undo() {
    const st = undoRef.current;
    if (!st.length || !playing) return;
    const prev = st[st.length - 1];
    undoRef.current = st.slice(0, -1);
    setCanUndo(undoRef.current.length > 0);
    setArmed(-1);
    setG((cur) => ({ ...cur, ori: prev.ori, placed: prev.placed }));
  }

  function flashCell(r, c) {
    setFlash(K(r, c));
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 320);
    vibrate(HAPT.bad);
  }

  function commit(g2) {
    if (!g2.t0) g2.t0 = Date.now();
    if (g2.placed.every(Boolean)) {
      // Every piece down is a full board, and a full board is the tiling.
      g2.status = 'won';
      g2.tEnd = Date.now();
      vibrate(HAPT.win);
      postResult(g2, 10);
      setG(g2);
      setArmed(-1);
      setJustWon(true);
      return;
    }
    vibrate(HAPT.ok);
    setG(g2);
  }

  function dropPiece(i, dr, dc) {
    if (!playing) return;
    pushUndo();
    const placed = g.placed.slice();
    placed[i] = { dr, dc };
    commit({ ...g, placed, moves: g.moves + 1 });
    setArmed(-1);
    setHover(null);
  }
  function liftPiece(i) {
    if (!playing || !g.placed[i]) return;
    pushUndo();
    const placed = g.placed.slice();
    placed[i] = null;
    setG({ ...g, placed, moves: g.moves + 1 });
    setArmed(i);
  }

  function cellClick(r, c) {
    if (!playing) return;
    const k = K(r, c);
    if (!REGION.has(k)) return;
    const own = owner.get(k);
    if (own != null) { liftPiece(own); return; }
    if (armed < 0) return;
    const cand = candidates(armed, r, c);
    if (!cand.length) { flashCell(r, c); return; }
    dropPiece(armed, cand[0].dr, cand[0].dc);
  }
  function padTap(i) {
    if (!playing || g.placed[i]) return;
    setArmed((a) => (a === i ? -1 : i));
  }
  function turn(how) {
    if (!playing || armed < 0) return;
    const ori = g.ori.map((o, i) => (i === armed ? (how === 'flip' ? flip(o) : rot(o)) : o));
    setG({ ...g, ori });
  }

  function clearBoard() {
    if (!playing || !hasEntries) return;
    if (!armClear) { setArmClear(Date.now()); return; }
    if (Date.now() - armClear < ARM_MIN_MS) return;
    setArmClear(false);
    pushUndo();
    setArmed(-1);
    setG((cur) => ({ ...cur, placed: cur.placed.map(() => null), moves: cur.moves + 1 }));
    say('Board cleared, every piece back on the pad. Undo brings it back.');
  }

  // One free hint: the first piece not sitting in its solved place goes there,
  // lifting anything it overlaps.
  function useHint() {
    if (!hintOk) return;
    if (!playing || g.hintUsed) return;
    let idx = -1;
    for (let i = 0; i < NP; i++) {
      const p = g.placed[i];
      const solved = p && p.dr === PUZZLE.sol[i][0] && p.dc === PUZZLE.sol[i][1] && JSON.stringify(g.ori[i]) === JSON.stringify(norm(PIECES[i]));
      if (!solved) { idx = i; break; }
    }
    if (idx < 0) return;
    pushUndo();
    const ori = g.ori.map((o, i) => (i === idx ? norm(PIECES[idx]) : o));
    const [dr, dc] = PUZZLE.sol[idx];
    const keys = new Set(ori[idx].map(([r, c]) => K(r + dr, c + dc)));
    const placed = g.placed.map((p, i) => {
      if (i === idx) return { dr, dc };
      if (!p) return null;
      return g.ori[i].some(([r, c]) => keys.has(K(r + p.dr, c + p.dc))) ? null : p;
    });
    setArmed(-1);
    commit({ ...g, ori, placed, hintUsed: true, moves: g.moves + 1 });
    say('Hint placed, one piece is in.');
  }

  function revealEnd() {
    const g2 = { ...g, ori: PIECES.map((p) => norm(p)), placed: PUZZLE.sol.map(([dr, dc]) => ({ dr, dc })), status: 'revealed', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    setArmed(-1);
    setG(g2);
  }

  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    undoRef.current = []; setCanUndo(false);
    setG(freshState(PUZZLE)); setArmed(-1); setHover(null); setJustWon(false); setEndClosed(false);
  }

  // desktop keyboard: R rotates, F flips, 1-9 picks a piece, Escape puts it down
  const onKey = useCallback((e) => {
    if (!playing) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const k = e.key;
    if ((k === 'z' || k === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); return; }
    if (k === 'Escape') { setArmed(-1); return; }
    if (k === 'r' || k === 'R') { turn('rot'); return; }
    if (k === 'f' || k === 'F') { turn('flip'); return; }
    if (/^[1-9]$/.test(k)) { const i = Number(k) - 1; if (i < NP) padTap(i); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, armed, g]);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  function shareText() {
    const squares = won ? '\u{1F7E6}'.repeat(NP) : '⬜'.repeat(NP);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head2 = won
      ? `Snug #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${NP} pieces in ${elapsed}${hintBit}${streakBit}`
      : `Snug #${PUZZLE.num} · gave up`;
    return `${head2}\n${squares}\n${shareUrl()}`;
  }
  function shareUrl() {
    return withRef(`mindloftdaily.com/snug${isTodays ? '' : `?p=${PUZZLE.num}`}`);
  }
  function copyShare() {
    const text = playing
      ? `Snug #${PUZZLE.num}, the daily fit-the-shapes puzzle from Mind Loft.\n${shareUrl()}`
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

  // ── the ghost: where the piece in hand would land from the hovered square ──
  const ghost = useMemo(() => {
    if (armed < 0 || !hover || !playing) return null;
    const cand = candidates(armed, hover[0], hover[1]);
    if (!cand.length) return { bad: K(hover[0], hover[1]) };
    const s = new Set(g.ori[armed].map(([r, c]) => K(r + cand[0].dr, c + cand[0].dc)));
    return { cells: s };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, hover, g.ori, owner, playing]);

  // A placed piece paints in the category step, and the SEAMS between two
  // pieces are the ground showing through, so the board reads as one tiled
  // object rather than a bag of coloured shapes.
  const GROUND = STAGE ? 'var(--stg-ground)' : T.white;
  function cellStyle(r, c) {
    const k = K(r, c);
    const own = owner.get(k);
    const st = { position: 'relative', boxSizing: 'border-box', cursor: playing ? 'pointer' : 'default' };
    if (own != null) {
      const hot = armed === own;
      st.background = hot ? `var(--stg-acc-ink, ${COLORS.accentDeep})` : `var(--stg-acc, ${COLORS.accent})`;
      const nb = [[-1, 0, 'borderTop'], [1, 0, 'borderBottom'], [0, -1, 'borderLeft'], [0, 1, 'borderRight']];
      for (const [dr, dc, side] of nb) {
        const o2 = owner.get(K(r + dr, c + dc));
        if (o2 !== own) st[side] = `2px solid ${GROUND}`;
      }
      if (!playing && won) st.background = `var(--stg-acc, ${COLORS.accent})`;
      return st;
    }
    st.background = STAGE ? 'var(--stg-cell)' : '#f3f5f8';
    st.boxShadow = 'inset 0 0 0 1px var(--stg-cell-line, rgba(28,30,36,0.18))';
    if (ghost && ghost.cells && ghost.cells.has(k)) st.background = STAGE ? 'color-mix(in srgb, var(--stg-acc) 40%, var(--stg-cell))' : COLORS.accentTint;
    if ((ghost && ghost.bad === k) || flash === k) st.background = STAGE ? 'color-mix(in srgb, var(--stg-bad, #e05a5a) 40%, var(--stg-cell))' : '#fde2e2';
    return st;
  }

  const CELL = `clamp(${W > 6 ? 34 : 38}px, ${W > 6 ? 11 : 12.5}vw, ${W > 6 ? 54 : 60}px)`;

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="Fit every piece into the board so it is covered exactly, with nothing left over and nothing overlapping. The board is the grid of squares; the pieces are the shapes on the pad under it, and their squares add up to the board's. Pieces turn and flip, and there is exactly one way they all go in."
      steps={[
        <><b>Tap a piece to pick it up</b>, then tap the board where one of its squares should sit. It drops if it fits there. Tap the piece again to put it down.</>,
        <><b>Rotate</b> and <b>Flip</b> turn the piece in your hand (R and F on a keyboard). The pad shows every piece turned some way; the shape of the hole is the only clue to how it goes in.</>,
        <><b>Tap a piece on the board to lift it back</b> into your hand. A tap that fits nowhere just flashes the square and costs nothing. <b>Undo</b> (or Ctrl+Z) takes back the last drop or lift.</>,
      ]}
      knack="Start from the tightest corner of the board, or the piece with the oddest shape: a piece that only fits one way pins its neighbours, and the board falls from there. Count squares before you commit a big piece to a pocket."
      footer="Every board has exactly one tiling, so the puzzle ends itself the moment the last piece lands. Solve it and you score a perfect 10, and because nothing is counted against you, the daily leaderboard is a straight race on the clock. One free hint, on your first ever play, drops one piece where it belongs. Sundays are a 7x7 Edition with more pieces."
    />
  );

  // A pad piece is ONE solid shape, not a grid of dots: the squares are drawn
  // edge to edge, the silhouette gets a single outline, faint seams inside it
  // show how many squares it holds, and a small ring marks the handle (the
  // piece's first square, which is the one a board tap prefers to land).
  const pieceTile = (i) => {
    const o = g.ori[i];
    const w = Math.max(...o.map((x) => x[1])) + 1, h = Math.max(...o.map((x) => x[0])) + 1;
    const set = new Set(o.map(([r, c]) => K(r, c)));
    const U = 20;
    const edge = [], seam = [];
    for (const [r, c] of o) {
      const x = c * U, y = r * U;
      if (!set.has(K(r - 1, c))) edge.push(`M${x} ${y}h${U}`);
      if (!set.has(K(r + 1, c))) edge.push(`M${x} ${y + U}h${U}`);
      if (!set.has(K(r, c - 1))) edge.push(`M${x} ${y}v${U}`);
      if (!set.has(K(r, c + 1))) edge.push(`M${x + U} ${y}v${U}`);
      if (set.has(K(r + 1, c))) seam.push(`M${x} ${y + U}h${U}`);
      if (set.has(K(r, c + 1))) seam.push(`M${x + U} ${y}v${U}`);
    }
    return (
      <svg className="sg-mini" viewBox={`-2 -2 ${w * U + 4} ${h * U + 4}`} style={{ width: `calc(${w} * var(--sg-u))`, height: `calc(${h} * var(--sg-u))` }} aria-hidden="true" focusable="false">
        {o.map(([r, c]) => <rect key={`${r}-${c}`} className="sg-fill" x={c * U} y={r * U} width={U} height={U} />)}
        <path className="sg-seam" d={seam.join('')} />
        <path className="sg-edge" d={edge.join('')} />
        <circle className="sg-hand" cx={(o[0][1] + 0.5) * U} cy={(o[0][0] + 0.5) * U} r={U * 0.17} />
      </svg>
    );
  };

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="snug" name="Snug" collapsed={started} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="snug" quizId={PUZZLE.quizId}
          name="Snug"
          cat="Logic"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition · 7×7' : null}
          figures={[
            { v: elapsed, k: 'time' },
            { v: `${placedCount}/${NP}`, k: 'pieces' },
          ]}
        />
      )}
      <div className="sg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style>{`
          @media(max-width:560px){.sg-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .sg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .sg-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .sg-board{display:grid;gap:0;margin:0 auto;width:max-content;max-width:100%;touch-action:manipulation;user-select:none;-webkit-tap-highlight-color:transparent;}
          .sg-cell{width:${CELL};height:${CELL};border-radius:2px;transition:background .12s;}
          .sg-cell.void{visibility:hidden;pointer-events:none;}
          .sg-pad{--sg-u:22px;display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:center;margin:18px auto 0;padding:12px 10px;border-radius:12px;background:${STAGE ? 'var(--stg-surf2)' : '#f3f5f8'};}
          @media(max-width:560px){.sg-pad{--sg-u:18px;gap:8px 10px;}}
          .sg-piece{display:inline-flex;align-items:center;justify-content:center;min-width:calc(2 * var(--sg-u) + 16px);min-height:calc(2 * var(--sg-u) + 16px);padding:8px;border-radius:10px;border:2px solid transparent;background:transparent;cursor:pointer;transition:transform .12s,opacity .2s;}
          .sg-piece:hover{transform:translateY(-2px);}
          .sg-piece.armed{border-color:var(--stg-acc-ink, ${COLORS.accentDeep});background:${STAGE ? 'var(--stg-surf)' : T.white};}
          .sg-piece.used{opacity:.22;pointer-events:none;}
          .sg-piece:focus-visible{outline:2px solid var(--stg-acc, ${COLORS.accent});outline-offset:2px;}
          .sg-mini{display:block;overflow:visible;}
          .sg-fill{fill:var(--stg-acc, ${COLORS.accent});}
          .sg-piece.armed .sg-fill{fill:var(--stg-acc-ink, ${COLORS.accentDeep});}
          .sg-seam{fill:none;stroke:${STAGE ? 'var(--stg-ground)' : T.white};stroke-width:1;opacity:.45;}
          .sg-edge{fill:none;stroke:${STAGE ? 'var(--stg-ground)' : T.white};stroke-width:2.5;stroke-linecap:square;}
          .sg-piece.armed .sg-edge{stroke:var(--stg-acc, ${COLORS.accent});}
          .sg-hand{fill:${STAGE ? 'var(--stg-ground)' : T.white};opacity:.9;}
          .sg-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .sg-tool.on{background:${STAGE ? STAGE_C : COLORS.ink};color:${STAGE ? 'var(--stg-onramp, #08222e)' : 'var(--white)'};border-color:${STAGE ? STAGE_C : COLORS.ink};}
          .sg-tool[disabled]{opacity:.4;cursor:default;}
        `}</style>

        <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="snug"
          num={PUZZLE.num}
          dateLabel={PUZZLE.dateLabel}
          accent={COLORS.accent}
          blockGap={5}
          helpTop={13}
          marginBottom={16}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; 7×7</span>}
          blocks={'SNUG'.split('').map((ch, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 23, background: i === 1 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
            ))}
        />
        )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Snug is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>Fit every piece into the board so it is covered exactly. {NP} pieces, {REGION.size} squares, {PUZZLE.sunday ? 'a 7×7 Sunday board' : 'a 6×6 board'}, and only one way they all go in. Pieces turn and flip.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="sg-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (
        <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
        <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
        <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
          {!LOFT && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
            <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>pieces <b style={{ color: placedCount === NP ? COLORS.green : `var(--stg-ink, ${COLORS.ink})`, fontWeight: 500 }}>{placedCount}</b>/{NP}</span>
          </div>
          )}

          {/* the board: hidden squares are the holes, painted squares the pieces */}
          <div className="sg-board" style={{ gridTemplateColumns: `repeat(${W}, ${CELL})` }} onPointerLeave={() => setHover(null)} aria-label="Snug board">
            {Array.from({ length: W * H }).map((_, idx) => {
              const r = Math.floor(idx / W), c = idx % W;
              const k = K(r, c);
              if (!REGION.has(k)) return <div key={idx} className="sg-cell void" />;
              const own = owner.get(k);
              return (
                <div key={idx} className="sg-cell" style={cellStyle(r, c)}
                  role="button" aria-label={own != null ? `piece ${own + 1}, row ${r + 1} column ${c + 1}` : `empty square, row ${r + 1} column ${c + 1}`}
                  onClick={() => cellClick(r, c)}
                  onPointerEnter={(e) => { if (armed >= 0 && e.pointerType === 'mouse') setHover([r, c]); }} />
              );
            })}
          </div>

          {/* the pad + tools */}
          {playing && (
            <>
              <div className="sg-pad" role="toolbar" aria-label="Pieces">
                {PIECES.map((_, i) => (
                  <button key={i} type="button" className={`sg-piece${armed === i ? ' armed' : ''}${g.placed[i] ? ' used' : ''}`} onClick={() => padTap(i)} aria-pressed={armed === i} aria-label={`Piece ${i + 1}, ${PIECES[i].length} squares${g.placed[i] ? ', on the board' : ''}`}>
                    {pieceTile(i, false)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <button className="sg-tool" onClick={() => turn('rot')} disabled={armed < 0} title="Rotate the piece in hand (R)">
                  <RotateCw size={14} /> Rotate
                </button>
                <button className="sg-tool" onClick={() => turn('flip')} disabled={armed < 0} title="Flip the piece in hand (F)">
                  <FlipHorizontal2 size={14} /> Flip
                </button>
                <button className="sg-tool" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                  <RotateCcw size={14} /> Undo
                </button>
                <button className="sg-tool" onClick={clearBoard} disabled={!hasEntries}
                  title="Take every piece off the board on the same clock"
                  style={hasEntries && armClear ? { background: STAGE ? 'var(--stg-surf2)' : '#fdeeee', borderColor: 'rgba(192,57,43,0.5)', color: `var(--stg-ink, ${COLORS.rust})` } : undefined}>
                  <Trash2 size={14} /> {armClear ? 'Tap again to clear' : 'Clear'}
                </button>
                {hintOk && !g.hintUsed && (
                  <button className="sg-tool" onClick={useHint} title="Drop one piece where it belongs (one hint, first play only)" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, borderColor: 'rgba(59,91,219,0.5)', color: ACC_DEEP_INK }}>
                    <Lightbulb size={14} /> Hint
                  </button>
                )}
              </div>
            </>
          )}

        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(28,30,36,0.10)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: armed >= 0 ? `var(--stg-acc-ink, ${COLORS.accent})` : `var(--stg-mute, ${COLORS.faded})` }}>
              {armed >= 0
                ? `Piece ${armed + 1} in hand: tap the board where one of its squares goes. Rotate or Flip to turn it.`
                : placedCount
                  ? 'Tap a piece to pick it up, or tap one on the board to lift it back.'
                  : 'Tap a piece on the pad to pick it up.'}
            </span>
            {identity && placedCount > 0 && (
              <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-mute, ${COLORS.faded})`, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> {armReveal ? 'Tap again: ends the puzzle and fills the board' : 'Reveal & end'}
              </button>
            )}
          </div>
        )}
          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 460, margin: '0 auto' }}>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '10px 0 0' }}>The Sunday Edition: a 7×7 board and {NP} pieces.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Snug in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new board drops at midnight Eastern.'}
                    {prevPuzzle && (
                      <>
                        {' '}Meanwhile:{' '}
                        <a href={`/snug?p=${prevPuzzle.num}`} style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>
                          play yesterday&rsquo;s Snug &rarr;
                        </a>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/snug" style={{ color: `var(--stg-ink, ${COLORS.ember})`, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Snug &rarr;</a>
                    {' · '}
                    <a href="/daily" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>All daily puzzles</a>
                  </>
                )}
              </p>
            </div>
          )}
          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
        </div>
        </div>
        {LOFT && !playing && (
          <LoftFinish
            name="Snug"
            catRank={catRank}
            outcome={won ? 'won' : 'lost'}
            title={won ? 'Solved' : 'Not solved'}
            detail={`${placedCount}/${NP} pieces · ${elapsed}`}
            iq={iq}
            board={dailyBoard}
            gameRank={allTime && allTime.ready
              ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                  label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Snug all time` : 'all-time rank' }
              : null}
            day={dayStats}
            streak={isTodays ? myStats.cur : null}
            archive={puzzles
              .filter((p) => p.num !== PUZZLE.num)
              .sort((a, b) => b.num - a.num)
              .map((p) => ({
                num: p.num,
                dateLabel: p.dateLabel,
                sunday: !!p.sunday,
                href: `/snug?p=${p.num}`,
                done: !!(myStats.rec && myStats.rec[p.num]),
                score: myStats.rec && myStats.rec[p.num] ? myStats.rec[p.num].s : null,
              }))}
            options={[
              won
                ? { tone: 'board', label: 'See the board', sub: 'Your finished tiling', onClick: () => setRevealed(true) }
                : { tone: 'reveal', label: 'Reveal', sub: 'Show the tiling', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Snug', sub: `No. ${prevPuzzle.num}, yesterday's puzzle`, href: `/snug?p=${prevPuzzle.num}` },
              nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
              { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers',
                kind: 'gold', onClick: copyShare },
              { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
              { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
            ]}
          />
        )}
        </div>
        </div>
        )}

        </div>

        {!STAGE && <GamePanel self="snug" name="Snug" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="snug" name="Snug" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null}
            self="snug"
            maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
            light
            boardSlot={<DailyBoardPanel self="snug" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Snug to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b> &mdash; the tile opens today&apos;s board, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s board, every day.
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

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="snug"
          won={won}
          headline={won ? <>Board solved!</> : <>Board revealed</>}
          subline={won
            ? <>{NP} pieces in {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>the tiling is shown above</>}
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
            <button className="sg-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Snug</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Snug is a free daily fit-the-shapes puzzle from Mind Loft. Each day gives you a board of squares, a 6×6 with a few squares missing, and a handful of pieces whose squares add up to the board exactly. Fit every piece in so the board is covered with nothing left over and nothing overlapping. Pieces turn and flip, and every board has exactly one tiling, so the puzzle ends itself the moment the last piece lands.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Tap a piece to pick it up, tap the board where one of its squares should sit, and tap a placed piece to lift it back. A tap that fits nowhere costs nothing. Nothing is counted against you, so a solve scores a perfect 10 and the daily leaderboard is a straight race on the clock. The pieces on the pad are shown turned some way, so the shape of the hole is the only clue.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new board drops every day at midnight Eastern, and Sundays step up to a 7×7 Edition with more pieces. No app, no signup, play free in your browser, keep a streak, and race the leaderboard. Kids get their own gentle version, <a href="/kids/fitit" style={{ color: INK, fontWeight: 800 }}>Fit It</a>, with the pieces already turned the right way. Like fitting things together? Try <a href="/plot" style={{ color: INK, fontWeight: 800 }}>Plot</a>, which cuts the board into rectangles, and <a href="/sixes" style={{ color: INK, fontWeight: 800 }}>Sixes</a>, the two-minute sudoku.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
