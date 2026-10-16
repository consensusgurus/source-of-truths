'use client';

// Cell: the daily FreeCell.
//
// A small deck dealt face up into columns: thirty-two cards, ace through eight,
// in six columns Monday to Saturday, and the Sunday Edition's forty, ace through
// ten, in seven. A few free cells, four home piles, and the classic rules:
// columns build down in alternating colors, a run moves as ONE move when the
// free space can carry it, and safe cards go home on their own for nothing.
// Everything is visible from the first second, so nothing here is luck: the
// deal you get is the deal everybody gets, and it is always winnable.
//
// Two numbers, as in Taire (lib/par.js): PERFECT is the exact minimum number of
// player moves, found by an exact search (scripts/gen-cell.mjs) and proved again
// by a second solver written separately (scripts/verify-cell.mjs). Nobody beats
// it, and it scores ten. PAR sits a cushion above it and scores eight. Floor of
// one, so finishing always beats walking away. The winning line is never banked
// and never shown.
//
// There is no undo, only a full restart (Taire's rule, and the reason perfect
// means something): a restart redeals the same board and zeroes the move count,
// but the clock keeps running. A cancelled selection never costs a move.
//
// The rules engine is lib/cell-core.js, shared with the generator, so the game
// a player plays and the game the bank was solved against are the same program.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Lightbulb, Eye, Smartphone, RotateCcw } from 'lucide-react';
import Grain from '../Grain';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import useEndHold from '../useEndHold';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import { parFor, stepFor, scoreFor } from '@/lib/par';
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
import { FREE, FND, suitOf, rankOf, redOf, RANK_LABEL, SUIT_PIP, SUIT_NAME, startState, replay, isWon, destinations, applyMove, legalMoves, locate, canPick, capacity, homeCount } from '@/lib/cell-core';
import { hintAllowed, spendHint } from '@/lib/hint-gate';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = {
  cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent,
  rust: T.danger, faded: T.muted,
  accent: '#0e7490',        // Cell's legacy accent, a deep teal (the stage paints the Cards step)
  accentSoft: '#e0f2f6', accentDeep: '#0e7490', green: T.successDeep,
};
// The felt carried no information and was the largest object in the game, so it is
// a surface now, and the table's EDGE carries the category instead. A card face
// is light in either register, so it takes the same token a chessboard's light
// square does. Loft (?stage=0) still renders the original felt via the fallback.
// Round four (2026-10-13): the felt is the category accent mixed into the cell
// ground, as Crib's is, so it reads as a table in both registers. Card FACES are
// paper in both registers (playing cards are physical objects): white, with
// near-black and red ink.
const FELT = 'color-mix(in srgb, var(--stg-acc, #0e7490) 9%, var(--stg-cell, #e6f2ec))';
const CARD_FACE = '#ffffff';
const CARD_EDGE = 'var(--stg-cell-line, rgba(20,22,28,0.30))';
const RED_PIP = '#b91c1c';
const BLACK_PIP = '#16181d';
const NUM_WORD = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

// The arm-then-confirm controls do not move when armed, so the second tap of
// an accidental double-tap used to land on the armed state long before the
// label change could be read. A confirm this fast was never a decision.
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_cell_help_seen';
const STATS_KEY = 'sot_cell_stats';

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

const freshState = () => ({ v: 1, moves: [], restarts: 0, hintUsed: false, status: 'playing', t0: null, tEnd: null });

// One playing card. `pile` cards (free cells, home) carry rank over suit in the
// corner; tableau cards carry rank and suit on one line plus a suit at the top
// right, because the top strip is all a buried card shows. Only an uncovered card
// shows the big centre pip. Lifted (in hand) cards rise with an accent ring;
// `drop` marks a card that is a legal place for the card in hand.
function CardFace({ card, w, h, pile = false, covered = false, lifted = false, hinted = false, drop = false, onClick, label, style }) {
  const red = redOf(card) === 1;
  const pip = SUIT_PIP[suitOf(card)];
  const rs = Math.round(w * (pile ? 0.23 : 0.22));
  const ss = Math.round(w * 0.18);
  const big = Math.round(w * (pile ? 0.45 : 0.46));
  const ring = lifted
    ? `0 0 0 3px ${FELT}, 0 0 0 5px var(--stg-acc, #0e7490), 0 14px 22px rgba(0,0,0,.38)`
    : hinted ? `0 0 0 3px ${FELT}, 0 0 0 5px var(--stg-warn, #b45309), 0 3px 8px rgba(0,0,0,.25)`
      : covered ? '0 2px 6px rgba(0,0,0,.22)' : '0 3px 8px rgba(0,0,0,.25)';
  return (
    <button type="button" onClick={onClick} disabled={!onClick} aria-label={label}
      className={`cel-card${lifted ? ' lifted' : ''}`}
      style={{
        width: w, height: h, boxSizing: 'border-box', borderRadius: Math.round(w * 0.1), background: CARD_FACE,
        border: lifted ? '3px solid var(--stg-acc, #0e7490)' : `1.5px solid ${CARD_EDGE}`,
        boxShadow: ring, color: red ? RED_PIP : BLACK_PIP, fontFamily: SANS, padding: 0,
        position: 'relative', lineHeight: 1, cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
        outline: drop ? '2.5px dashed var(--stg-acc, #0e7490)' : 'none', outlineOffset: drop ? 3 : 0,
        flexShrink: 0, ...style,
      }}>
      {pile ? (
        <span style={{ position: 'absolute', top: Math.round(w * 0.08), left: Math.round(w * 0.1), display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
          <b style={{ fontSize: rs, fontWeight: 800 }}>{RANK_LABEL[rankOf(card)]}</b>
          <span style={{ fontSize: Math.round(rs * 0.8) }}>{pip}</span>
        </span>
      ) : (
        <>
          <span style={{ position: 'absolute', top: Math.round(w * 0.07), left: Math.round(w * 0.1), display: 'flex', alignItems: 'baseline', gap: 2, lineHeight: 1 }}>
            <b style={{ fontSize: rs, fontWeight: 800, letterSpacing: '-0.03em' }}>{RANK_LABEL[rankOf(card)]}</b>
            <span style={{ fontSize: ss }}>{pip}</span>
          </span>
          <span aria-hidden="true" style={{ position: 'absolute', top: Math.round(w * 0.07), right: Math.round(w * 0.1), fontSize: ss, lineHeight: 1 }}>{pip}</span>
        </>
      )}
      {!covered && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: big, paddingTop: Math.round(h * 0.12), lineHeight: 1 }}>{pip}</span>}
    </button>
  );
}

export default function CellClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_cell_${PUZZLE.num}`;
  const CELLS = PUZZLE.cells;
  const START = useMemo(() => startState(PUZZLE.deal, PUZZLE.cells), [PUZZLE]);
  // Weekdays run ace through eight in six columns; the Sunday Edition runs ace
  // through ten in seven. Everything below reads off the puzzle, because the
  // archive replays both.
  const RANKS = PUZZLE.ranks || 8;
  const DECK = RANKS * 4;
  const COLS = PUZZLE.deal.length;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(0);
  const [hintCards, setHintCards] = useState(null);
  // How many cards the last move's safe autoplay sent home (free), for the status line.
  const [autoNote, setAutoNote] = useState(0);
  const lastTap = useRef({ card: null, t: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
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
  useEffect(() => { if (stats) setHintOk(hintAllowed('cell', stats)); }, [stats]);
  useEffect(() => { if (g.hintUsed) spendHint('cell'); }, [g.hintUsed]);
  const [player, setPlayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  // Phone layout (<=560px, the page's own breakpoint) and the measured felt
  // width the card size is cut from. Display only.
  const [narrow, setNarrow] = useState(false);
  const [feltW, setFeltW] = useState(0);
  const [feltEl, setFeltEl] = useState(null);
  useEffect(() => {
    const fit = () => { try { setNarrow(window.innerWidth <= 560); } catch (e) {} };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    if (!feltEl) return undefined;
    const read = () => { try { setFeltW(feltEl.clientWidth); } catch (e) {} };
    read();
    let ro = null;
    try { ro = new ResizeObserver(read); ro.observe(feltEl); } catch (e) {}
    return () => { try { ro && ro.disconnect(); } catch (e) {} };
  }, [feltEl]);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const won = g.status === 'won';
  const LOFT = isLoft('cell');
  const STAGE = isStage('cell', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('cell');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('cell'), '--stg-acc-lt': gameColorLight('cell'), '--stg-onramp-lt': gameOnrampLight('cell'), '--stg-acc-ink-lt': gameAccentInkLight('cell') };
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
  const used = g.moves.length;
  // PUZZLE.perfect is the banked exact minimum number of player moves.
  const perfect = PUZZLE.perfect;
  const par = parFor(perfect);
  const step = stepFor(perfect);
  const finalScore = won ? scoreFor(used, perfect) : 0;

  const state = useMemo(() => replay(PUZZLE.deal, CELLS, g.moves) || START, [PUZZLE, START, g.moves, CELLS]);
  const dests = useMemo(() => (sel != null && playing ? destinations(state, sel) : []), [sel, state, playing]);
  // Auto-split into an empty column. A run too long for an empty column still
  // drops there: the most cards from the END of the run that the column can
  // take go in, the same move a player makes by tapping a card partway down.
  // It is an ordinary legal move, so move counts and perfect are untouched.
  function splitFor(card, j) {
    if (card == null || !state.cols[j] || state.cols[j].length) return null;
    const loc = locate(state, card);
    if (!loc || loc.where !== 'col' || loc.n < 2) return null;
    const col = state.cols[loc.i];
    for (let m = Math.min(loc.n - 1, capacity(state, true)); m >= 1; m--) {
      const c2 = col[col.length - m];
      if (destinations(state, c2).includes(j)) return { card: c2, m };
    }
    return null;
  }
  const splits = useMemo(
    () => (sel != null && playing ? state.cols.map((_, j) => (dests.includes(j) ? null : splitFor(sel, j))) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sel, state, playing, dests]
  );
  const intoEmpty = state.cols.some((c) => !c.length) ? capacity(state, true) : null;
  const movable = useMemo(() => (playing ? legalMoves(state) : []), [state, playing]);

  useEffect(() => { gRef.current = g; }, [g]);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  useEffect(() => {
    if (!hintCards) return undefined;
    const t = setTimeout(() => setHintCards(null), 4000);
    return () => clearTimeout(t);
  }, [hintCards]);
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
        if (saved && saved.v === 1 && Array.isArray(saved.moves) && replay(PUZZLE.deal, CELLS, saved.moves)) {
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
        if (done || g.t0) localStorage.setItem('sot_cell_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_cell_day');
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
  const iq = useIqStanding({ game: 'cell', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'cell', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'cell', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'cell', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'cell', active: LOFT && !playing });
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const REC_KEY = `sot_cell_rec_${PUZZLE.num}`;
  // Cards home: how far a run got, which is what ranks a give-up against
  // another (the progress term, CLAUDE.md). Read off the replayed moves, not a memo.
  const progressOf = (moves) => homeCount(replay(PUZZLE.deal, CELLS, moves) || START);
  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!(cur.moves.length || cur.hintUsed) || cur.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.moves.length, progress: progressOf(cur.moves), timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, score) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: score, t: 10, g: g2.moves.length, won: g2.status === 'won' && g2.moves.length === perfect })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score, total: 10, correct: g2.status === 'won' ? 1 : 0, guessesUsed: g2.moves.length, progress: progressOf(g2.moves), timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
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

  function doMove(card, dest) {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const loc = locate(state, card);
    const mv = [card, loc ? loc.n : 1, dest];
    const r = applyMove(state, mv);
    if (!r) { setShake((k) => k + 1); vibrate(HAPT.wrong); return; }
    const moves = [...cur.moves, mv];
    setSel(null); setHintCards(null);
    setAutoNote(r.auto.length);
    const g2 = { ...cur };
    if (!g2.t0) g2.t0 = Date.now();
    // Safe autoplay already ran inside applyMove and counted nothing; the move
    // the player made is the one that counts.
    if (isWon(r.state, RANKS)) {
      const done = { ...g2, moves, status: 'won', tEnd: Date.now() };
      vibrate(HAPT.win);
      postResult(done, scoreFor(done.moves.length, perfect));
      endHold.hold();
      commit(done);
      return;
    }
    vibrate(HAPT.ok);
    commit({ ...g2, moves });
  }

  // A tap on a tableau card: a destination for the run in hand when its column
  // takes it, otherwise a pick-up of the card (and everything on it).
  function onTableau(j, k) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); return; }
    if (sel != null) {
      const loc = locate(state, sel);
      const sameCol = loc && loc.where === 'col' && loc.i === j;
      if (!sameCol && dests.includes(j)) { doMove(sel, j); return; }
    }
    onCard(state.cols[j][k]);
  }
  function onCard(card) {
    if (!playing) return;
    if (!gRef.current.t0) { startGame(); return; }
    const now = Date.now();
    const dbl = lastTap.current.card === card && now - lastTap.current.t < 380;
    lastTap.current = { card, t: now };
    // Double-tap sends a card home when home takes it; otherwise the second tap
    // is an ordinary put-back, which costs nothing.
    if (dbl && destinations(state, card).includes(FND)) { doMove(card, FND); return; }
    if (sel === card) { setSel(null); return; }
    if (!canPick(state, card)) {
      setSel(null); setShake((k) => k + 1);
      say('Only the run at the top of a column moves together: each card one lower, colors alternating.');
      return;
    }
    if (!destinations(state, card).length && !state.cols.some((_, j) => splitFor(card, j))) {
      setSel(null); setShake((k) => k + 1);
      const n = locate(state, card).n;
      say(n > 1 ? runTooLong(n) : 'That card has nowhere to go yet.');
      return;
    }
    setAutoNote(0);
    setSel(card);
  }
  function onDest(dest) {
    if (!playing || sel == null) return;
    if (!dests.includes(dest) && splits[dest]) { doMove(splits[dest].card, dest); return; }
    if (!dests.includes(dest)) {
      setShake((k) => k + 1);
      // An empty column the run in hand cannot reach: say why, rather than
      // leave a player who knows FreeCell thinking runs never go there.
      if (dest !== FND && dest !== FREE && state.cols[dest] && !state.cols[dest].length) {
        const loc = locate(state, sel);
        if (loc && loc.where === 'col' && loc.k === 0) say('That is already a whole column. Moving it to an empty one changes nothing.');
        else if (loc && loc.n > 1) say(runTooLong(loc.n));
      }
      return;
    }
    doMove(sel, dest);
  }
  // Why a run will not move. Into an empty column the doubling for that column
  // is lost, so it carries fewer than onto a card; say both numbers, and say how
  // to move part of the run, which is the standard FreeCell answer.
  function runTooLong(n) {
    const onto = capacity(state, false);
    const intoEmpty = state.cols.some((c) => !c.length) ? capacity(state, true) : null;
    const cap = intoEmpty != null
      ? `Right now one move carries up to ${onto} card${onto === 1 ? '' : 's'} onto another column, but only ${intoEmpty} into an empty one.`
      : `Right now one move carries up to ${onto} card${onto === 1 ? '' : 's'}.`;
    return `That run is ${n} cards. ${cap} Tap a card partway down the run to move just that part, or open a free cell first.`;
  }

  function restart() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.moves.length) return;
    commit({ ...cur, moves: [], restarts: cur.restarts + 1 });
    setSel(null); setHintCards(null); setAutoNote(0);
    say('Redealt the same board. Your move count is reset, the clock is not.');
  }

  function useHint() {
    if (!hintOk) return;
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.hintUsed) return;
    const g2 = { ...cur, hintUsed: true };
    if (!g2.t0) g2.t0 = Date.now();
    commit(g2);
    const m = [...new Set(legalMoves(state).map((mv) => mv[0]))];
    setHintCards(m);
    say(m.length ? `${m.length} card${m.length === 1 ? '' : 's'} can move. Which one is still on you.` : 'Nothing can move. Restart the deal.');
  }

  function revealEnd() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const g2 = { ...cur, status: 'gaveup', tEnd: Date.now() };
    if (!g2.t0) g2.t0 = Date.now();
    postResult(g2, 0);
    endHold.hold();
    commit(g2);
    setSel(null);
  }

  function resetGame() {
    endHold.release();
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    commit(freshState());
    setSel(null); setHintCards(null); setAutoNote(0); setEndClosed(false);
  }

  function shareUrl() { return withRef(`mindloftdaily.com/cell${isTodays ? '' : `?p=${PUZZLE.num}`}`); }
  function shareText() {
    const vs = used === perfect ? 'perfect'
      : used < par ? `${par - used} under par`
      : used === par ? 'level par'
      : `${used - par} over par`;
    const g5 = won ? Math.max(1, Math.round(scoreFor(used, perfect) / 2)) : 0;
    const squares = '\u{1F7E9}'.repeat(g5) + '⬜'.repeat(5 - g5);
    const hintBit = g.hintUsed ? ' · \u{1F4A1}' : '';
    const streakBit = isTodays && myStats.cur >= 2 ? ` · streak ${myStats.cur}` : '';
    const head = won
      ? `Cell #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${used} moves, ${vs} · ${elapsed}${hintBit}${streakBit}`
      : `Cell #${PUZZLE.num} · gave up`;
    return `${head}\n${squares}\n${shareUrl()}`;
  }
  function copyShare() {
    const text = playing
      ? `Cell #${PUZZLE.num}, the daily FreeCell from Mind Loft. Par ${par}.\n${shareUrl()}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead={<>Send all {DECK === 40 ? 'forty' : 'thirty-two'} cards home to the <b>foundations</b>, one pile per suit built up from the ace, using the <b>free cells</b>, spots that each park one card, and <b>sequence moves</b>, which carry a run of cards stepping down in alternating colors as a single move.</>}
      chips={[
        { label: `Perfect ${perfect} moves = 10`, tone: 'good' },
        { label: `Par ${par} moves = 8` },
      ]}
      steps={[
        <><b>Tap a card</b> to pick it up along with every card on it, then tap where it goes. <b>Double-tap</b> a card to send it home.</>,
        <>Columns build <b>down in alternating colors</b>, so a red 6 goes on a black 7. Any card or run can go into an <b>empty column</b>, and any single card into an open free cell. You have <b>{CELLS === 1 ? 'one free cell' : `${NUM_WORD[CELLS].toLowerCase()} free cells`}</b> today.</>,
        <>A run moves in one move when the free space can carry it: up to one more than your open free cells, doubled for every empty column you are not moving into. So two open cells carry three cards onto another column, six with an empty column spare, but only three <b>into</b> that empty column. Drop a run that is too long on an empty column and as many cards from the end of it as fit go in, one move. To split it somewhere else, tap a card partway down the run.</>,
        <>Every move you make counts <b>one</b>, a whole run included. Cards that are safe go home <b>on their own, for free</b>: aces and twos always, any other card once both piles of the other color are one rank below it. There is <b>no undo</b>, only a <b>restart</b> that redeals the same board and zeroes your moves while the clock keeps running.</>,
      ]}
      knack={<><b>Perfect</b> is the proven minimum, so nothing beats it, while <b>par</b> is the number a clean line comes home in. Every deal is winnable, and finishing always beats walking away.</>}
      footer={<>Every {step} moves over perfect costs a point, down to a floor of one. One free hint, on your first ever play, shows which cards can move at all. The week takes free cells away, four on Monday down to two by Friday, and the Sunday Edition deals the bigger deck: ace to ten, forty cards, seven columns.</>}
    />
  );

  const fnd = state.fnd;

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, position: 'relative', overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {/* Shared daily chrome (app/DailyChrome.jsx): home masthead + stat bar +
          today's slate rail, collapsing to one line once the clock runs. Outside
          the page wrapper so the bands run full bleed; nothing here is pinned. */}
      {!STAGE && (
      <DailyChrome slug="cell" name="Cell" collapsed={started} loft={LOFT} />
      )}
      {/* LOFT: the cap replaces the title block AND the board's own stat
          strip. Cell grades a win from 10 down, so any solve is a win and
          a give-up is not: there is no partial state for the amber cap. */}
      {LOFT && (
        <Cap gameKey="cell" quizId={PUZZLE.quizId}
          name="Cell"
          cat="Cards"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${DECK} Cards` : null}
          figures={playing ? [
            { v: used, k: 'moves' },
            { v: elapsed, k: 'time' },
            { v: `${par} · ${perfect}`, k: 'par · perfect' },
          ] : [
            { v: finalScore, k: 'score' },
            { v: used, k: 'moves' },
            { v: `${par} · ${perfect}`, k: 'par · perfect' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="cel-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.cel-wrap{padding-left:10px !important;padding-right:10px !important;}}
          .cel-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .cel-btn:hover{background:var(--stg-surf2, var(--accent-soft));}
          .cel-tool{font-family:${SANS};font-weight:800;font-size:12.5px;border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(28,30,36,0.35)'};background:${STAGE ? 'var(--stg-surf2)' : 'var(--white)'};color:${INK};border-radius:8px;padding:7px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
          .cel-felt{background:${FELT};border-radius:22px;padding:18px 20px 16px;touch-action:manipulation;display:flex;flex-direction:column;}
          @media(max-width:560px){.cel-felt{border-radius:18px;padding:12px;}}
          .cel-card{-webkit-tap-highlight-color:transparent;transition:transform .12s ease, box-shadow .12s ease;}
          .cel-card:disabled{cursor:default;}
          .cel-felt.shake{animation:celshake .34s ease;}
          @keyframes celshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
          .cel-k{font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${FADED};}
          @media(max-width:560px){.cel-k{font-size:10px;}}
          .cel-drop{box-sizing:border-box;background:color-mix(in srgb, var(--stg-acc, #0e7490) 22%, var(--stg-cell, #ffffff));border:2.5px dashed var(--stg-acc, #0e7490);color:var(--stg-acc-ink, #0e7490);font-family:${SANS};font-weight:800;letter-spacing:.06em;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;}
          .cel-hole{box-sizing:border-box;background:var(--stg-cell, rgba(0,0,0,0.06));border:2px dashed var(--stg-cell-line, rgba(28,30,36,0.3));padding:0;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;}
          .cel-ctl{font-family:${SANS};font-weight:700;font-size:14px;border:1.5px solid ${STAGE ? 'var(--stg-cell-line)' : 'rgba(28,30,36,0.35)'};background:transparent;color:${INK};border-radius:12px;padding:0 16px;min-height:48px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;box-sizing:border-box;}
          .cel-ctl:hover:not(:disabled){background:var(--stg-surf2, rgba(28,30,36,0.05));}
          .cel-ctl:disabled{cursor:default;color:${FADED};}
          @media (prefers-reduced-motion: reduce){.cel-card{transition:none !important;}.cel-felt.shake{animation:none;}}
        ` }} />

        <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {!LOFT && (
        <DailyMasthead
          slug="cell" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent}
          blockGap={5} helpTop={13} marginBottom={16} onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accent})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; {DECK} Cards</span>}
          blocks={'CELL'.split('').map((ch, i) => (
            <div key={i} style={{ width: 40, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, background: i === 3 ? `var(--stg-acc, ${COLORS.accent})` : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
          ))}
        />
        )}

        {/* LOFT: the start tile and the board sit on the navy stage, which
            runs full bleed and fills the first screen. */}
        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>

        {preStart && (
          <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Cell is ready'}</div>
            {gateRules ? rulesBody : (
              <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                <p style={{ margin: '0 0 6px' }}>{DECK === 40 ? 'Forty' : 'Thirty-two'} cards face up in {COLS} columns, {CELLS} free cells, and FreeCell rules: a run moves as one move, and safe cards go home for free. Par is {par} moves and perfect is {perfect}, the proven minimum. No undo, only a restart.</p>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <button className="cel-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
              <div>
                <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                  {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!preStart && (() => {
          // ---- the felt (forked from Taire's round-four felt, 2026-10-13) ----
          // Every readout is state the board already holds: the move count
          // against perfect and par, the free cells, the home piles, and the
          // legal destinations of the run in hand (core.destinations).
          const FW = feltW || (narrow ? 358 : 620);
          const gapMin = narrow ? 6 : 12;
          const CW = Math.max(38, Math.min(narrow ? 70 : 84, Math.floor((FW - gapMin * (COLS - 1)) / COLS)));
          const CH = Math.round(CW * 1.4);
          const REV = Math.round(CH * (narrow ? 0.3 : 0.28));
          const LIFT = Math.round(CH * 0.11);
          // A column that grows long folds its reveal so the felt never runs
          // off the screen: the top card always shows whole.
          const MAX_TAB = narrow ? 470 : 600;
          const revOf = (len) => (len <= 1 ? REV : Math.max(Math.round(CH * 0.21), Math.min(REV, Math.floor((MAX_TAB - CH - LIFT) / (len - 1)))));
          const tabH = CH + LIFT + Math.max(REV * 5, ...state.cols.map((c) => revOf(c.length) * Math.max(0, c.length - 1)));
          const pitch = COLS > 1 ? (FW - CW) / (COLS - 1) : 0;
          const NP = CELLS + 4;
          const pileGap = narrow ? 5 : 10;
          const sepGap = narrow ? 12 : 26;
          const PW = Math.max(32, Math.min(narrow ? 60 : 76, Math.floor((FW - pileGap * (NP - 2) - sepGap) / NP)));
          const PH = Math.round(PW * 1.4);
          const openCells = state.free.filter((x) => x == null).length;
          const carry = capacity(state, false);
          const short = (c) => `${RANK_LABEL[rankOf(c)]}${SUIT_PIP[suitOf(c)]}`;
          const named = (c) => `${RANK_LABEL[rankOf(c)]} of ${SUIT_NAME[suitOf(c)]}`;
          const inHand = sel != null && playing;
          const selLoc = inHand ? locate(state, sel) : null;
          const selN = selLoc ? selLoc.n : 0;
          const ACC_FILL = 'var(--stg-acc, #0e7490)';
          const LINE = 'var(--stg-line, rgba(28,30,36,0.18))';
          // is this tableau card part of the run in hand?
          const ridesInHand = (j, k) => !!(selLoc && selLoc.where === 'col' && selLoc.i === j && k >= selLoc.k);

          // The status line, derived from core.destinations for the run in hand.
          const placeWords = () => {
            const out = [];
            if (dests.includes(FND)) out.push('home');
            const empties = dests.filter((d) => d !== FND && d !== FREE && !state.cols[d].length).length;
            dests.forEach((d) => {
              if (d === FND || d === FREE || !state.cols[d].length) return;
              out.push(`onto the ${short(state.cols[d][state.cols[d].length - 1])}`);
            });
            if (empties === 1) out.push('the empty column');
            else if (empties > 1) out.push(`any of ${empties} empty columns`);
            const sp = splits.filter(Boolean);
            if (sp.length) {
              const part = `the last ${sp[0].m}`;
              out.push(sp.length === 1 ? `${part} into the empty column` : `${part} into any of ${sp.length} empty columns`);
            }
            if (dests.includes(FREE)) out.push(openCells === 1 ? 'the open free cell' : 'a free cell');
            return out;
          };
          let status, sub = null;
          if (!playing) {
            status = won ? (used === perfect ? `All home in ${used}. That is perfect.` : `All home in ${used}. Par was ${par}.`) : 'You left it on the table.';
          } else if (inHand) {
            const w = placeWords();
            const n = w.length;
            const list = n <= 1 ? (w[0] || '') : n === 2 ? `${w[0]} or ${w[1]}` : `${w.slice(0, -1).join(', ')}, or ${w[n - 1]}`;
            const what = selN > 1 ? `${short(sel)} and the ${selN - 1} on it ${selN - 1 === 1 ? 'is' : 'are'}` : `${short(sel)} is`;
            status = n ? `${what} in hand. ${NUM_WORD[n] || n} place${n === 1 ? '' : 's'} ${selN > 1 ? 'they' : 'it'} can go: ${list}.` : `${what} in hand.`;
            sub = 'Tap it again to put it back. Nothing has moved yet.';
          } else {
            status = movable.length ? 'Tap a card to pick it up. Double-tap sends it home.' : 'Nothing can move. Restart the deal.';
            sub = autoNote
              ? `${NUM_WORD[autoNote] || autoNote} card${autoNote === 1 ? '' : 's'} went home on ${autoNote === 1 ? 'its' : 'their'} own. That costs nothing.`
              : 'Every move you make counts one, a whole run included. Cards that go home on their own are free.';
          }

          // The par track: one segment per move of the proven-minimum line,
          // the cushion to par drawn thinner after it, filled for moves used.
          const segN = Math.max(par, used);
          const track = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: narrow ? 5 : 9 }}>
              {!narrow && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="cel-k">The line · {perfect} moves is the proven minimum</span>
                  <span className="cel-k" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    <b style={{ color: used > par ? 'var(--stg-bad, #b91c1c)' : ACC_INK }}>{used}</b> used · {used <= par ? `${par - used} to par` : `${used - par} over par`}
                  </span>
                </div>
              )}
              <div role="img" aria-label={`${used} moves used. Perfect is ${perfect}, par is ${par}.`} style={{ display: 'flex', gap: narrow ? 2 : 3, alignItems: 'center' }}>
                {Array.from({ length: segN }).map((_, i) => {
                  const cushion = i >= perfect && i < par;
                  const over = i >= par;
                  const filled = i < used;
                  return (
                    <span key={i} style={{
                      flex: 1, minWidth: 0, borderRadius: narrow ? 2 : 3,
                      height: cushion ? (narrow ? 4 : 6) : (narrow ? 7 : 10),
                      marginLeft: i === perfect && i > 0 ? (narrow ? 3 : 5) : 0,
                      background: filled ? (over ? 'var(--stg-bad, #b91c1c)' : ACC_FILL) : LINE,
                    }} />
                  );
                })}
                <span className="cel-k" style={{ marginLeft: narrow ? 4 : 6, fontWeight: 800 }}>Par</span>
              </div>
              {narrow && (
                <span className="cel-k" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  Perfect {perfect} is the proven minimum · <b style={{ color: used > par ? 'var(--stg-bad, #b91c1c)' : ACC_INK }}>{used}</b> used · {used <= par ? `${par - used} to par` : `${used - par} over`}
                </span>
              )}
            </div>
          );

          const freeRow = (
            <div style={{ display: 'flex', gap: pileGap }}>
              {state.free.map((card, i) => {
                if (card != null) {
                  const lifted = inHand && sel === card;
                  return (
                    <CardFace key={`f${i}`} card={card} w={PW} h={PH} pile
                      lifted={lifted} hinted={!!(hintCards && hintCards.includes(card))}
                      onClick={playing ? () => onCard(card) : undefined}
                      label={`${named(card)} in a free cell${lifted ? ', in hand' : ''}`}
                      style={{ transform: lifted ? `translateY(-${LIFT}px)` : 'none' }} />
                  );
                }
                // Only the first open cell is offered as the drop: the rules
                // treat free cells as one pool, so one target says it plainly.
                const live = inHand && dests.includes(FREE) && i === state.free.indexOf(null);
                return live ? (
                  <button key={`f${i}`} type="button" className="cel-drop" onClick={() => onDest(FREE)}
                    aria-label={`Free cell, open: drop the ${named(sel)} here`}
                    style={{ width: PW, height: PH, borderRadius: narrow ? 7 : 9, fontSize: narrow ? 9.5 : 11 }}>
                    <span>Drop{PW < 52 ? <br /> : ' '}here</span>
                  </button>
                ) : (
                  <button key={`f${i}`} type="button" className="cel-hole" onClick={() => onDest(FREE)} disabled={!inHand}
                    aria-label={`Free cell ${i + 1}, open`}
                    style={{ width: PW, height: PH, borderRadius: narrow ? 7 : 9, cursor: inHand ? 'pointer' : 'default' }} />
                );
              })}
            </div>
          );

          const homeRow = (
            <div style={{ display: 'flex', gap: pileGap }}>
              {[0, 1, 2, 3].map((s) => {
                const top = fnd[s];
                const live = inHand && dests.includes(FND) && suitOf(sel) === s;
                const pipCh = SUIT_PIP[s];
                const nm = SUIT_NAME[s];
                const pile = top > 0 ? (
                  <CardFace card={s * 16 + top} w={PW} h={PH} pile drop={live}
                    onClick={live ? () => onDest(FND) : undefined}
                    label={live ? `${nm} home, ${RANK_LABEL[top]} on top: send the ${named(sel)} home` : `${nm} home, ${RANK_LABEL[top]} on top`}
                    style={live ? null : { boxShadow: `0 0 0 3px ${FELT}, 0 0 0 4.5px var(--stg-cell-line, rgba(28,30,36,0.35)), 0 4px 10px rgba(0,0,0,.22)` }} />
                ) : live ? (
                  <button type="button" className="cel-drop" onClick={() => onDest(FND)}
                    aria-label={`${nm} home, empty: send the ${named(sel)} home`}
                    style={{ width: PW, height: PH, borderRadius: narrow ? 7 : 9, fontSize: narrow ? 9.5 : 11 }}>
                    <span style={{ fontSize: narrow ? 20 : 26, lineHeight: 1 }} aria-hidden="true">{pipCh}</span>
                    <span>Home</span>
                  </button>
                ) : (
                  <button type="button" className="cel-hole" onClick={() => onDest(FND)} disabled={!inHand}
                    aria-label={`${nm} home, empty`}
                    style={{ width: PW, height: PH, borderRadius: narrow ? 7 : 9, color: FADED, fontSize: narrow ? 20 : 28, fontFamily: SANS, cursor: inHand ? 'pointer' : 'default' }}>
                    <span aria-hidden="true">{pipCh}</span>
                  </button>
                );
                return (
                  <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: narrow ? 5 : 7 }}>
                    {pile}
                    <span style={{ fontFamily: SANS, fontSize: narrow ? 9 : 10, fontWeight: 800, letterSpacing: '0.04em', color: top > 0 ? ACC_INK : FADED, fontVariantNumeric: 'tabular-nums' }} aria-label={`${nm} home: ${top} of ${RANKS}`}>{top}/{RANKS}</span>
                  </div>
                );
              })}
            </div>
          );

          const tableau = (
            <div ref={setFeltEl} style={{ position: 'relative', height: tabH, marginTop: narrow ? 14 : 18 }}>
              {state.cols.map((col, j) => {
                const x = Math.round(j * pitch);
                const sp = inHand && !dests.includes(j) ? splits[j] : null;
                const live = inHand && (dests.includes(j) || !!sp);
                const rev = revOf(col.length);
                return (
                  <React.Fragment key={j}>
                    {col.length ? (
                      <span aria-hidden="true" className="cel-hole" style={{ position: 'absolute', left: x, top: LIFT, width: CW, height: CH, borderRadius: Math.round(CW * 0.1) }} />
                    ) : live ? (
                      <button type="button" className="cel-drop" onClick={() => onDest(j)}
                        aria-label={sp ? `Empty column ${j + 1}: the run is too long for it, so drop the last ${sp.m} cards of it here` : `Empty column ${j + 1}: drop the ${named(sel)}${selN > 1 ? ` and the ${selN - 1} on it` : ''} here`}
                        style={{ position: 'absolute', left: x, top: LIFT, width: CW, height: CH, borderRadius: Math.round(CW * 0.1), fontSize: narrow ? 9.5 : 11 }}>
                        <span>{sp ? <>Drop {sp.m}{CW < 56 ? <br /> : ' '}here</> : <>Drop{CW < 56 ? <br /> : ' '}here</>}</span>
                      </button>
                    ) : (
                      <button type="button" className="cel-hole" onClick={() => onDest(j)} disabled={!inHand}
                        aria-label={`Column ${j + 1}, empty`}
                        style={{ position: 'absolute', left: x, top: LIFT, width: CW, height: CH, borderRadius: Math.round(CW * 0.1), cursor: inHand ? 'pointer' : 'default' }} />
                    )}
                    {col.map((card, k) => {
                      const isTop = k === col.length - 1;
                      const lifted = ridesInHand(j, k);
                      return (
                        <CardFace key={card} card={card} w={CW} h={CH} covered={!isTop}
                          lifted={lifted} hinted={!!(hintCards && hintCards.includes(card))}
                          drop={live && isTop}
                          onClick={playing ? () => onTableau(j, k) : undefined}
                          label={`${named(card)}${lifted ? ', in hand' : live && isTop ? `: put the ${named(sel)} on it` : isTop ? '' : ', buried'}`}
                          style={{ position: 'absolute', left: x, top: LIFT + k * rev - (lifted ? LIFT : 0), zIndex: k + 1 }} />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          );

          const giveUp = started && (
            <button type="button" onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); revealEnd(); } else { setArmReveal(Date.now()); } }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: narrow ? 13 : 12, color: armReveal ? 'var(--stg-bad, #b91c1c)' : INK, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 44, padding: narrow ? '0 6px' : 0, textAlign: 'left' }}>
              <Eye size={13} /> {armReveal ? 'Tap again: ends the deal and scores nothing' : 'Give up'}
            </button>
          );
          const homeBtn = inHand && dests.includes(FND) && (
            <button type="button" className="cel-ctl" onClick={() => onDest(FND)} title="Send the card in hand home"
              style={narrow ? { flex: 1, minHeight: 50 } : null}>
              <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>{SUIT_PIP[suitOf(sel)]}</span> Send home
            </button>
          );
          const restartBtn = playing && !homeBtn && (
            <button type="button" className="cel-ctl" onClick={restart} disabled={!used} title="Redeal the same board and zero the move count"
              style={narrow ? { flex: 1, minHeight: 50 } : null}>
              <RotateCcw size={16} /> Restart deal
            </button>
          );
          const hintBtn = playing && hintOk && !g.hintUsed && (
            <button type="button" className="cel-ctl" onClick={useHint} title="Light up every card that can move (one hint, first play only)">
              <Lightbulb size={16} /> Hint
            </button>
          );
          const restartChip = g.restarts > 0 && playing && (
            <span style={{ fontFamily: SANS, fontSize: 11, color: FADED, fontWeight: 700, whiteSpace: 'nowrap' }}>{g.restarts} restart{g.restarts === 1 ? '' : 's'}</span>
          );

          return (
            <div className={STAGE ? 'stg-board' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? 'transparent' : T.white, border: STAGE ? 0 : `2px solid ${COLORS.ink}`, borderRadius: STAGE ? 0 : 10, padding: STAGE ? 0 : '13px 15px 15px', boxShadow: STAGE ? 'none' : '5px 5px 0 rgba(28,30,36,0.16)', marginBottom: 12 }}>
              {/* These figures move UP into the cap on a loft page; printing
                  them twice is the one thing to avoid. */}
              {!LOFT && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED, borderBottom: '1px solid rgba(28,30,36,0.18)', paddingBottom: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>moves <b style={{ color: used > par ? `var(--stg-bad, ${COLORS.rust})` : `var(--stg-ink, ${COLORS.ink})` }}>{used}</b></span>
                  <span style={{ whiteSpace: 'nowrap' }}>time <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{elapsed}</b></span>
                  <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>par <b style={{ color: ACC_INK }}>{par}</b> &middot; perfect <b style={{ color: INK }}>{perfect}</b></span>
                </div>
              )}

              {track}

              <div key={shake} className={`cel-felt${shake ? ' shake' : ''}`} style={{ marginTop: narrow ? 12 : 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                  <span className="cel-k">Free cells · {openCells} open{narrow ? '' : ` · a move carries up to ${carry}${intoEmpty != null ? `, ${intoEmpty} into an empty column` : ''}`}</span>
                  <span className="cel-k">Home{narrow ? '' : ` · ace up to ${RANK_LABEL[RANKS]}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: narrow ? 6 : 8, gap: sepGap }}>
                  {freeRow}
                  {homeRow}
                </div>
                {narrow && <div className="cel-k" style={{ marginTop: 6 }}>A move carries up to {carry} card{carry === 1 ? '' : 's'}{intoEmpty != null ? `, ${intoEmpty} into an empty column` : ''}</div>}

                <div style={{ height: 1, background: LINE, marginTop: narrow ? 12 : 16 }} />

                {tableau}

                <div style={{ marginTop: narrow ? 10 : 14, display: 'flex', alignItems: 'center', gap: 10, borderTop: narrow ? 0 : `1px solid ${LINE}`, paddingTop: narrow ? 0 : 14 }}>
                  <div aria-live="polite" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontFamily: SANS, fontSize: narrow ? 14 : 15, fontWeight: 700, lineHeight: 1.4, color: !playing ? (won ? 'var(--stg-good, #15803d)' : FADED) : INK }}>{status}</span>
                    {sub && !narrow && <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED }}>{sub}</span>}
                  </div>
                  {!narrow && restartChip}
                  {!narrow && hintBtn}
                  {!narrow && homeBtn}
                  {!narrow && restartBtn}
                </div>
              </div>

              {narrow ? (
                (playing || started) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {homeBtn}
                      {restartBtn}
                      {hintBtn}
                      {giveUp}
                    </div>
                    {restartChip && <div style={{ textAlign: 'center' }}>{restartChip}</div>}
                  </div>
                )
              ) : (
                started && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: FADED }}>Down by one, other color. A run moves as one move. No undo.</span>
                    {giveUp}
                  </div>
                )
              )}
            </div>
          );
        })()}


          <div className={STAGE ? undefined : 'loft-sol'}>
          {!playing && (
            <div style={{ maxWidth: 472, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '8px 0 0' }}>
                Par was <span style={{ color: ACC_INK }}>{par} moves</span>, perfect was <span style={{ color: INK }}>{perfect}</span>.
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: FADED, margin: '6px 0 0', lineHeight: 1.5 }}>
                {won
                  ? used === perfect ? 'You matched the proven minimum, which is as good as this deal gets.'
                    : used < par ? `You got home in ${used}, ${par - used} under par and ${used - perfect} off perfect.`
                      : used === par ? `You got home in ${used}, level par, ${used - perfect} off perfect.`
                        : `You got home in ${used}, ${used - par} over par.`
                  : 'The minimum was found by an exact search and proved again by a second solver, so it is real, not an estimate. This deal was always winnable.'}
              </div>
              {PUZZLE.sunday && (
                <div style={{ fontSize: 12.5, fontWeight: 600, color: FADED, fontStyle: 'italic', margin: '8px 0 0' }}>The Sunday Edition: forty cards, ace to ten, in seven columns.</div>
              )}
              {isTodays && myStats.cur >= 2 && (
                <div style={{ fontSize: 13, fontWeight: 800, margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--stg-warn, #b45309)' }}>{myStats.cur}-day streak</span>
                </div>
              )}
              <p className={STAGE ? undefined : 'loft-tailnote'} style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '12px 0 0' }}>
                {isTodays ? (
                  <>
                    {countdown ? <>Next Cell in <b style={{ color: INK, fontVariantNumeric: 'tabular-nums' }}>{countdown}</b>.</> : 'A new deal drops at midnight Eastern.'}
                    {prevPuzzle && (<>{' '}Meanwhile: <a href={`/cell?p=${prevPuzzle.num}`} style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>play yesterday&rsquo;s Cell &rarr;</a></>)}
                  </>
                ) : (
                  <>
                    You&rsquo;re playing the {PUZZLE.dateLabel.replace(', 2026', '')} archive.{' '}
                    <a href="/cell" style={{ color: COLORS.ember, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Cell &rarr;</a>
                    {' · '}<a href="/archive" style={{ color: FADED, fontWeight: 700, textDecoration: 'underline' }}>Puzzle archive</a>
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
          {LOFT && !playing && (
            <LoftFinish
              name="Cell"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              challengeMetric={won ? used : null}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${finalScore}/10 \u00b7 ${used} moves \u00b7 par ${par}, perfect ${perfect} \u00b7 ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Cell all time` : 'all-time rank' }
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
                  href: `/cell?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: 'board', label: 'Return to board', sub: 'Your finished board', onClick: () => setRevealed(true) },
              prevPuzzle && { tone: 'another', label: 'Play another Cell', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/cell?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="cell" name="Cell" onShow={() => setShowChrome(true)} />}
        <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0' }}>
          {LOFT && (
            <div className={STAGE ? undefined : 'loft-report'}>
              <ReportIssue self="cell" name="Cell" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
            </div>
          )}
          {!LOFT && (
          <DailyGamesGrid replay={!playing ? resetGame : null} self="cell" maxWidth={620}
            challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
            share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light
            boardSlot={<DailyBoardPanel self="cell" quizId={PUZZLE.quizId} maxWidth={620} streak={{ current: myStats.cur, best: myStats.max }} />}
            divider />
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
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Cell to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The tile opens today&apos;s deal, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The tile opens today&apos;s deal, every day.</p>
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
        <DailyEndCard modal self="cell" won={won}
          headline={won ? (used === perfect ? <>Perfect. Nothing wasted.</> : used < par ? <>Under par.</> : <>All home.</>) : <>You scored 0%</>}
          subline={won
            ? <>{finalScore}/10 &middot; {used} moves &middot; par {par}, perfect {perfect} &middot; {elapsed}{g.hintUsed ? <> &middot; 1 hint</> : null}</>
            : <>0/10 &middot; par here was {par}, perfect was {perfect}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', background: COLORS.ink, color: T.white, fontFamily: SANS, fontWeight: 800, fontSize: 13.5, padding: '10px 18px', borderRadius: 9, zIndex: 60, boxShadow: '0 6px 18px rgba(20,22,28,0.25)', maxWidth: '86vw', textAlign: 'center' }}>{toast}</div>
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
            <button className="cel-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      {/* The desktop fold: the About prose below starts one screen down (app/StageFold.jsx). */}
      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Cell</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Cell is a free daily FreeCell from Mind Loft, on a smaller deck: thirty-two cards, ace through eight in four suits, dealt face up into six columns, with a few free cells to park cards and four foundations to build up by suit from the ace. Columns build down in alternating colors, a run of cards moves as one move when your open cells and empty columns can carry it, and safe cards go home on their own for nothing. Nothing is hidden, so there is no luck in it: the deal you get is the deal everybody else gets today, and it is always winnable.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Every deal is solved exactly, so perfect really is the fewest moves that exist rather than somebody&rsquo;s guess, and it was proved again by a second solver written separately. Nobody beats perfect, and the game is how close you get. Par sits a cushion above it and is beatable. The week takes free cells away: four on Monday and Tuesday, three midweek, two from Friday, and the Sunday Edition deals the bigger deck, ace through ten, forty cards in seven columns.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          A new deal drops every day at midnight Eastern. No app, no signup, play free in your browser, keep a streak, and race the daily leaderboard. More card dailies: <a href="/taire" style={{ color: INK, fontWeight: 800 }}>Taire</a>, our two-suit solitaire, <a href="/hands" style={{ color: INK, fontWeight: 800 }}>Hands</a>, our poker solitaire, and <a href="/shoe" style={{ color: INK, fontWeight: 800 }}>Shoe</a>, our daily blackjack count.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
