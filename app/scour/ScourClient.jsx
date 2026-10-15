'use client';

// Scour — the daily themed word search.
//
// One theme a day and a big grid: 15x15 every day (owner, 2026-10-15), an
// 18x18 Sunday Edition. Drag across a word in any of the eight directions, or
// tap its first letter and then its last. The line snaps to the nearest of the
// eight directions and is only checked when the finger LIFTS, so a stroke that
// wanders costs nothing; drag off the board, or press Escape, to throw it
// away. The race is the clock: score is words found, time breaks ties.
//
// Every list word is in the grid exactly once counting all eight directions
// (scripts/verify-scour.mjs proves it), so a find is checked from the letters
// alone and no answer key ships. Built off ScramClient's frame (chrome, start
// gate, saves, result posting, end card).

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Eye, Smartphone } from 'lucide-react';
import Grain from '../Grain';
import DailyChrome from '../DailyChrome';
import DailyRules from '../DailyRules';
import Footer from '../Footer';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import DailyMasthead from '../DailyMasthead';
import { useSearchParams } from 'next/navigation';
import { isLoft } from '@/lib/loft';
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
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';

const COLORS = { cream: T.surface, paper: T.paper, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted, good: T.successDeep || '#047857' };
const ARM_MIN_MS = 400;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

const isIosDevice = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const HELP_KEY = 'sot_scour_help_seen';
const STATS_KEY = 'sot_scour_stats';

// The eight directions, as the snap reads them: octant k of the drag angle.
const OCT = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const DIR_WORDS = { E: 'across', S: 'down', SE: 'diagonally down', NE: 'diagonally up', W: 'backward across', N: 'up', NW: 'diagonally backward', SW: 'diagonally backward' };
// Found-word highlights. Translucent so the letter always reads through, and
// several hues so two crossing words stay tellable apart.
const HUES = [200, 145, 32, 280, 350, 95, 175, 255, 15, 60];

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
  for (const n of nums) { run = prev != null && n === prev + 1 ? run + 1 : 1; if (run > max) max = run; prev = n; }
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: nums.length, cur, max };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const pz = m && byQuiz[m.quizId];
    if (!pz || m.attempt !== 1 || rec[pz.num]) continue;
    const t = pz.words.length;
    const sc = Math.max(0, Math.min(t, Math.round(((m.scorePct || 0) / 100) * t)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[pz.num] = { s: sc, t, won: !!m.perfect };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

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
const strip = (w) => w.replace(/ /g, '');
const backward = (s) => s.split('').reverse().join('');
const EMPTY_BOARD = { plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} };

function freshState() {
  return { v: 1, found: {}, status: 'playing', t0: null, tEnd: null };
}

// The squares from (r0,c0) to (r1,c1), which must lie on one of the eight lines.
function lineCells(r0, c0, r1, c1) {
  const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
  const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  const out = [];
  for (let k = 0; k <= len; k++) out.push([r0 + dr * k, c0 + dc * k]);
  return out;
}
function onLine(r0, c0, r1, c1) {
  const a = Math.abs(r1 - r0), b = Math.abs(c1 - c0);
  return a === 0 || b === 0 || a === b;
}
// Where every list word sits, found by searching the grid (each is there once).
function locate(grid, word) {
  const n = grid.length, w = strip(word);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] !== w[0]) continue;
    for (const [dr, dc] of OCT) {
      const er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1);
      if (er < 0 || ec < 0 || er >= n || ec >= n) continue;
      let ok = true;
      for (let k = 1; k < w.length; k++) if (grid[r + dr * k][c + dc * k] !== w[k]) { ok = false; break; }
      if (ok) return [r, c, er, ec];
    }
  }
  return null;
}

export default function ScourClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_scour_${PUZZLE.num}`;
  const N = PUZZLE.words.length;
  const SIZE = PUZZLE.size || PUZZLE.grid.length;
  const [g, setG] = useState(freshState);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [armReveal, setArmReveal] = useState(false);
  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
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

  // The live stroke: { r0, c0, r1, c1, off } while a finger or mouse is down.
  const [drag, setDrag] = useState(null);
  // A tapped first letter waiting for the tap on the last one.
  const [anchor, setAnchor] = useState(null);
  // The last stroke that spelled nothing on the list, shown for a beat.
  const [miss, setMiss] = useState(null);
  const [justFound, setJustFound] = useState(null);
  const [endClosed, setEndClosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const toastTimer = useRef(null);
  const viewedRef = useRef(false);
  const boardRef = useRef(null);
  const ptr = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1) setG({ ...freshState(), ...saved });
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
        const dn = g.status !== 'playing';
        if (dn || g.t0) localStorage.setItem('sot_scour_day', JSON.stringify({ d: etToday(), done: dn }));
        else localStorage.removeItem('sot_scour_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
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
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  const [showChrome, setShowChrome] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (g.status !== 'playing' || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [g.status, g.t0, g.tEnd]);

  const playing = g.status === 'playing';
  const searchParams = useSearchParams();
  const LOFT = isLoft('scour');
  const STAGE = isStage('scour', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('scour');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('scour'), '--stg-acc-lt': gameColorLight('scour'), '--stg-onramp-lt': gameOnrampLight('scour'), '--stg-acc-ink-lt': gameAccentInkLight('scour') };
  const [stageTheme] = useStageTheme();
  const lightReg = !STAGE || stageTheme === 'light';
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const CELL = STAGE ? 'var(--stg-cell)' : T.white;
  const CELL_LINE = STAGE ? 'var(--stg-cell-line)' : 'rgba(20,22,28,0.30)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.ember;
  const BAD = STAGE ? 'var(--stg-bad)' : COLORS.rust;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const foundCount = Object.keys(g.found).length;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  const REC_KEY = `sot_scour_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    // A play counts once the player has found a word.
    const n = Object.keys(g.found).length;
    if (!n || g.status !== 'playing') return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: n, total: N, correct: n, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const n = Object.keys(g2.found).length;
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try {
      fetch('/api/quiz/result', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        // Race the clock: the score is words found, and the board breaks a tie
        // on time alone, so nothing is posted as a miss (registry miss: null).
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: n, total: N, correct: n, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function finish(g1) {
    const n = Object.keys(g1.found).length;
    const g2 = { ...g1, status: n === N ? 'won' : 'done', tEnd: Date.now() };
    try { setStats(recordStat(PUZZLE.num, { s: n, t: N, won: n === N })); } catch (e) {}
    postResult(g2);
    setG(g2);
    setDrag(null); setAnchor(null);
  }

  // ---- checking a stroke ----------------------------------------------------
  function tryLine(r0, c0, r1, c1) {
    if (!playing || !g.t0) return;
    const cells = lineCells(r0, c0, r1, c1);
    if (cells.length < 2) return;
    const s = cells.map(([r, c]) => PUZZLE.grid[r][c]).join('');
    const rs = backward(s);
    let hit = -1, dup = false;
    PUZZLE.words.forEach((w, i) => {
      const L = strip(w);
      if (L !== s && L !== rs) return;
      if (g.found[i]) dup = true; else if (hit < 0) hit = i;
    });
    if (hit >= 0) {
      const g2 = { ...g, found: { ...g.found, [hit]: [r0, c0, r1, c1] } };
      setJustFound({ i: hit, at: Date.now() });
      if (Object.keys(g2.found).length === N) { finish(g2); return; }
      setG(g2);
      return;
    }
    if (dup) { say('Already found'); return; }
    if (cells.length >= 3) setMiss({ r0, c0, r1, c1, at: Date.now() });
  }
  useEffect(() => {
    if (!miss) return undefined;
    const t = setTimeout(() => setMiss(null), 520);
    return () => clearTimeout(t);
  }, [miss]);

  // ---- pointer -> squares -----------------------------------------------------
  function cellAt(x, y) {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cw = rect.width / SIZE;
    const fx = (x - rect.left) / cw, fy = (y - rect.top) / cw;
    return { fx, fy, cw, out: fx < -0.6 || fy < -0.6 || fx > SIZE + 0.6 || fy > SIZE + 0.6 };
  }
  // Snap the stroke from (r0,c0) toward the pointer onto the nearest of the
  // eight lines, as far as the pointer has travelled along it, kept on the board.
  function snapEnd(r0, c0, fx, fy) {
    const dx = fx - (c0 + 0.5), dy = fy - (r0 + 0.5);
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) return [r0, c0];
    const oct = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    const [dr, dc] = OCT[oct];
    // Steps along the line: project the pointer onto the direction (a diagonal
    // step covers one column and one row, so its squared length is 2).
    let k = Math.round((dx * dc + dy * dr) / (dr && dc ? 2 : 1));
    k = Math.max(0, k);
    while (k > 0) {
      const r1 = r0 + dr * k, c1 = c0 + dc * k;
      if (r1 >= 0 && c1 >= 0 && r1 < SIZE && c1 < SIZE) break;
      k--;
    }
    return [r0 + dr * k, c0 + dc * k];
  }
  function onDown(e) {
    if (!started) return;
    if (e.button != null && e.button !== 0 && e.pointerType === 'mouse') return;
    const at = cellAt(e.clientX, e.clientY);
    if (!at) return;
    const r = Math.floor(at.fy), c = Math.floor(at.fx);
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    ptr.current = { id: e.pointerId, r, c, x: e.clientX, y: e.clientY, moved: false };
    setDrag({ r0: r, c0: c, r1: r, c1: c, off: false });
  }
  function onMove(e) {
    const p = ptr.current;
    if (!p || p.id !== e.pointerId) return;
    const at = cellAt(e.clientX, e.clientY);
    if (!at) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > at.cw * 0.35) p.moved = true;
    const [r1, c1] = snapEnd(p.r, p.c, at.fx, at.fy);
    setDrag((d) => (d && d.r1 === r1 && d.c1 === c1 && d.off === at.out ? d : { r0: p.r, c0: p.c, r1, c1, off: at.out }));
  }
  function onUp(e) {
    const p = ptr.current;
    if (!p || p.id !== e.pointerId) return;
    ptr.current = null;
    const at = cellAt(e.clientX, e.clientY);
    const d = drag;
    setDrag(null);
    if (!d || (at && at.out)) return; // released off the board: the stroke is thrown away
    const [r1, c1] = at ? snapEnd(p.r, p.c, at.fx, at.fy) : [d.r1, d.c1];
    if (!p.moved || (r1 === p.r && c1 === p.c)) {
      // A tap. First tap marks the first letter; a second tap on the same line
      // checks the run between them; the same square again lets go.
      if (anchor && anchor.r === p.r && anchor.c === p.c) { setAnchor(null); return; }
      if (anchor && onLine(anchor.r, anchor.c, p.r, p.c)) { const a = anchor; setAnchor(null); tryLine(a.r, a.c, p.r, p.c); return; }
      setAnchor({ r: p.r, c: p.c });
      return;
    }
    setAnchor(null);
    tryLine(p.r, p.c, r1, c1);
  }
  function onCancel() { ptr.current = null; setDrag(null); }
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { ptr.current = null; setDrag(null); setAnchor(null); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function startGame() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
  }
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    setG(freshState()); setEndClosed(false); setRevealed(false); setDrag(null); setAnchor(null);
  }

  function shareText() {
    return `Scour #${PUZZLE.num} · ${PUZZLE.theme} · ${foundCount}/${N} words · ${elapsed}\n${withRef('mindloftdaily.com/scour')}`;
  }
  function copyShare() {
    const text = playing
      ? `Scour #${PUZZLE.num}: a ${SIZE}x${SIZE} word search, ${N} words from one theme, against the clock.\n${withRef('mindloftdaily.com/scour')}`
      : shareText();
    if (notifyShareCredit(text)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; }
    } catch (e) {}
    try {
      navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch (e) {}
  }

  const ended = !playing;
  const won = g.status === 'won';
  // On a finish short of every word, the missed ones stay hidden on the loft
  // until the end card's Reveal answers tile is pressed.
  const ansOpen = ended && (won || !LOFT || revealed);
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'scour', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'scour', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'scour', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'scour', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'scour', active: LOFT && !playing });
  const score = foundCount;

  // ---- the board ------------------------------------------------------------
  const missedSpots = useMemo(() => {
    if (!ansOpen) return [];
    return PUZZLE.words.map((w, i) => (g.found[i] ? null : { i, at: locate(PUZZLE.grid, w) })).filter((x) => x && x.at);
  }, [ansOpen, g.found, PUZZLE]);
  const hueOf = (i) => HUES[i % HUES.length];
  const hl = (i, a) => `hsla(${hueOf(i)}, ${lightReg ? '78%' : '70%'}, ${lightReg ? '58%' : '52%'}, ${a})`;
  const pill = (key, r0, c0, r1, c1, stroke, extra = {}) => (
    <line key={key} x1={c0 + 0.5} y1={r0 + 0.5} x2={c1 + 0.5} y2={r1 + 0.5}
      stroke={stroke} strokeWidth={0.78} strokeLinecap="round" {...extra} />
  );
  const liveLine = drag && !(drag.r0 === drag.r1 && drag.c0 === drag.c1) ? drag : null;
  const liveLetters = liveLine
    ? lineCells(liveLine.r0, liveLine.c0, liveLine.r1, liveLine.c1).map(([r, c]) => PUZZLE.grid[r][c]).join('')
    : (drag ? PUZZLE.grid[drag.r0][drag.c0] : '');
  const anchorLine = anchor ? `${PUZZLE.grid[anchor.r][anchor.c]}...` : '';
  const dirs = PUZZLE.dirs || [];
  const runsLine = dirs.length >= 8
    ? 'in all eight directions, backward too'
    : dirs.map((d) => DIR_WORDS[d]).filter((v, i, a) => a.indexOf(v) === i).join(', ').replace(/, ([^,]*)$/, ' and $1');

  const cellsOn = new Set();
  if (liveLine && !liveLine.off) for (const [r, c] of lineCells(liveLine.r0, liveLine.c0, liveLine.r1, liveLine.c1)) cellsOn.add(r * SIZE + c);
  if (anchor) cellsOn.add(anchor.r * SIZE + anchor.c);

  const grid = (
    <div className="so-boardwrap">
      <div className="so-read" aria-live="polite">
        {drag || anchor
          ? <span className="so-readpill" style={{ opacity: drag && drag.off ? 0.4 : 1 }}>{drag ? (drag.off ? 'Let go to cancel' : liveLetters) : anchorLine}</span>
          : <span style={{ color: FADED, fontWeight: 700, fontSize: 12.5 }}>{started ? `Words run ${runsLine}.` : ''}</span>}
      </div>
      <div ref={boardRef} className="so-board"
        role="grid" aria-label={`${SIZE} by ${SIZE} word search`}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, touchAction: started ? 'none' : 'auto' }}>
        <svg className="so-ink" viewBox={`0 0 ${SIZE} ${SIZE}`} preserveAspectRatio="none" aria-hidden>
          {Object.entries(g.found).map(([i, at]) => pill('f' + i, at[0], at[1], at[2], at[3], hl(Number(i), justFound && justFound.i === Number(i) && Date.now() - justFound.at < 700 ? 0.6 : 0.38),
            { className: justFound && justFound.i === Number(i) ? 'so-pop' : undefined }))}
          {missedSpots.map(({ i, at }) => pill('m' + i, at[0], at[1], at[2], at[3], STAGE ? 'color-mix(in srgb, var(--stg-bad) 26%, transparent)' : 'rgba(185,28,28,0.18)'))}
          {miss && pill('x', miss.r0, miss.c0, miss.r1, miss.c1, STAGE ? 'color-mix(in srgb, var(--stg-bad) 34%, transparent)' : 'rgba(185,28,28,0.22)', { className: 'so-miss' })}
          {liveLine && pill('live', liveLine.r0, liveLine.c0, liveLine.r1, liveLine.c1, STAGE ? 'color-mix(in srgb, var(--stg-acc) 42%, transparent)' : 'rgba(37,99,235,0.28)', { style: { opacity: liveLine.off ? 0.35 : 1 } })}
          {anchor && !drag && <circle cx={anchor.c + 0.5} cy={anchor.r + 0.5} r={0.39} fill={STAGE ? 'color-mix(in srgb, var(--stg-acc) 42%, transparent)' : 'rgba(37,99,235,0.28)'} />}
        </svg>
        {PUZZLE.grid.map((row, r) => row.split('').map((ch, c) => (
          <div key={r * SIZE + c} className={'so-cell' + (cellsOn.has(r * SIZE + c) ? ' on' : '')} role="gridcell" aria-label={ch}>{ch}</div>
        )))}
      </div>
    </div>
  );

  const wordList = (
    <div className="so-list">
      <div className="so-listhd">
        <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 800, color: FADED }}>Today&rsquo;s theme</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: ACC_INK, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{PUZZLE.theme}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: FADED }}>{foundCount} of {N} found</span>
      </div>
      <ul className="so-words">
        {PUZZLE.words.map((w, i) => {
          const got = !!g.found[i];
          const missed = !got && ended && ansOpen;
          return (
            <li key={w} className={got ? 'got' : (missed ? 'missed' : undefined)}>
              <span className="so-dot" style={{ background: got ? hl(i, 0.9) : 'transparent', borderColor: got ? 'transparent' : (missed ? BAD : CELL_LINE) }} />
              <span>{w}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const rulesBody = (
    <DailyRules
      lead={`A ${SIZE} by ${SIZE} word search on one theme. Find every word against the clock.`}
      steps={[
        <>One <b>theme</b> a day and a list of words from it, printed beside the grid once you start. Every word is hidden in the grid <b>exactly once</b>.</>,
        <><b>Drag</b> across a word, or <b>tap</b> its first letter and then its last. The line snaps to the nearest of the eight directions, and it is only checked when you let go.</>,
        <>A word on the list lights up and is crossed off. Anything else just fades. A wrong line <b>costs nothing</b>, and dragging off the board throws a line away.</>,
        <>The line above the grid says which way today&rsquo;s words run: across and down on Monday, all eight directions by Saturday.</>,
      ]}
      knack="Hunt for the rare letters first. A word with a K, a Z or a double letter shows itself faster than one made of vowels."
      footer="Score is words found. Time breaks ties, so the fastest full grid tops the board."
    />
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : COLORS.cream, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="scour" name="Scour" collapsed={started} loft={LOFT} />}
      {LOFT && (
        <Cap gameKey="scour" quizId={PUZZLE.quizId}
          name="Scour"
          cat="Word"
          outcome={playing ? null : (won ? 'won' : (score > 0 ? 'part' : 'lost'))}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? `Sunday Edition · ${SIZE}×${SIZE}` : null}
          figures={playing ? [
            { v: `${foundCount}/${N}`, k: 'found' },
            { v: elapsed, k: 'time' },
          ] : [
            { v: `${score}/${N}`, k: 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="so-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .so-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
            .so-play{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,644px) minmax(0,1fr);gap:26px;align-items:start;--so-w:min(1156px,calc(100vw - 76px));width:var(--so-w);margin-left:calc((100% - var(--so-w)) / 2);}
            .so-mid{grid-column:2;min-width:0;}
            .so-side{grid-column:3;min-width:0;max-width:230px;}
            .so-giveup{display:flex;justify-content:center;margin-top:12px;}
            @media (max-width:1060px){.so-play{grid-template-columns:minmax(0,1fr) 210px;width:auto;margin-left:0;}.so-mid{grid-column:1;}.so-side{grid-column:2;}}
            .so-boardwrap{min-width:0;}
            .so-read{height:30px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;}
            .so-readpill{display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:4px 12px;border-radius:999px;font-weight:800;font-size:15px;letter-spacing:.14em;background:${STAGE ? 'var(--stg-surf2,rgba(255,255,255,0.08))' : COLORS.paper};color:${INK};border:1.5px solid ${STAGE ? 'var(--stg-line2)' : 'rgba(20,22,28,0.15)'};}
            .so-board{position:relative;display:grid;width:100%;aspect-ratio:1/1;container-type:inline-size;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;background:${CELL};border:1.5px solid ${CELL_LINE};border-radius:10px;overflow:hidden;cursor:crosshair;}
            .so-ink{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;}
            .so-cell{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:calc(100cqw / ${SIZE} * 0.56);color:${INK};line-height:1;}
            .so-cell.on{color:${ACC_INK};}
            @keyframes sopop{0%{stroke-width:.78;}40%{stroke-width:.98;}100%{stroke-width:.78;}}
            .so-pop{animation:sopop .45s cubic-bezier(.2,.7,.3,1);}
            @keyframes somiss{0%{opacity:1;}100%{opacity:0;}}
            .so-miss{animation:somiss .5s ease-out forwards;}
            .so-list{min-width:0;}
            .so-listhd{display:flex;flex-direction:column;gap:3px;margin-bottom:12px;}
            .so-words{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:5px 14px;}
            .so-words li{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13.5px;letter-spacing:.04em;color:${INK};}
            .so-words li.got{color:${FADED};text-decoration:line-through;text-decoration-thickness:2px;}
            .so-words li.missed{color:${BAD};}
            .so-dot{width:10px;height:10px;border-radius:999px;border:1.5px solid;flex:none;}
            @media (max-width:820px){
              .so-play{grid-template-columns:1fr;gap:14px;}
              .so-play{width:auto;margin-left:0;}
              .so-mid,.so-side{grid-column:1;max-width:none;}
              .so-words{grid-template-columns:repeat(3,minmax(0,1fr));}
              .so-words li{font-size:12px;letter-spacing:.02em;}
              .so-listhd{flex-direction:row;align-items:baseline;flex-wrap:wrap;gap:4px 10px;}
            }
            @media (max-width:420px){.so-words{grid-template-columns:repeat(2,minmax(0,1fr));}}
            @media (prefers-reduced-motion:reduce){.so-pop,.so-miss{animation:none !important;}}
            @media(max-width:560px){.so-wrap{padding-left:10px !important;padding-right:10px !important;}}
          ` }} />

          {!LOFT && (
            <DailyMasthead
              slug="scour"
              num={PUZZLE.num}
              dateLabel={PUZZLE.dateLabel}
              accent={COLORS.ember}
              blockGap={5}
              helpTop={13}
              marginBottom={16}
              onHelp={() => setShowHelp(true)}
              sunday={PUZZLE.sunday && <span style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: T.white, background: COLORS.ember, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition</span>}
              blocks={'SCOUR'.split('').map((ch, i) => (
                <div key={i} style={{ width: 44, height: 44, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 25, background: COLORS.ink, color: T.white }}>{ch}</div>
              ))}
            />
          )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (revealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : (LOFT ? 'loft-card' : undefined)} style={{ background: STAGE ? SURF : COLORS.cream, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 12, padding: '22px', display: 'flex', flexDirection: 'column', marginBottom: 16, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 10 }}>{gateRules ? 'How to play' : 'Scour is ready'}</div>
              {gateRules ? rulesBody : (
                <div style={{ fontSize: 14, lineHeight: 1.55, color: INK, fontWeight: 600 }}>
                  <p style={{ margin: '0 0 6px' }}>A {SIZE} by {SIZE} word search, {N} words from one theme, against the clock. The theme and the grid stay hidden until you start.</p>
                </div>
              )}
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="so-btn" onClick={startGame} style={{ borderColor: STAGE ? STAGE_C : undefined, background: STAGE ? STAGE_C : T.cta, color: STAGE ? 'var(--stg-onramp, #08222e)' : T.white, fontSize: 15, padding: '11px 22px' }}>Start</button>
                <div>
                  <button type="button" onClick={() => setGateRules((v) => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 700, color: FADED, textDecoration: 'underline' }}>
                    {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!preStart && (
            <div className="so-play">
              <div className="so-mid">
                {grid}
                {started && foundCount > 0 && (
                  <div className="so-giveup">
                  <button onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); finish(g); } else { setArmReveal(Date.now()); } }}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: SANS, fontWeight: 700, fontSize: 12, color: armReveal ? BAD : FADED, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={13} /> {armReveal ? 'Tap again to stop the clock and show the rest' : 'Give up and reveal'}
                  </button>
                  </div>
                )}
              </div>
              <div className="so-side">
                {wordList}
                {ended && !isTodays && (
                  <p style={{ fontSize: 12, color: FADED, fontWeight: 600, margin: '14px 0 0' }}>
                    You&rsquo;re playing the {PUZZLE.dateLabel} archive.{' '}
                    <a href="/scour" style={{ color: INK, fontWeight: 800, textDecoration: 'underline' }}>Back to today&rsquo;s Scour &rarr;</a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Scour"
              catRank={catRank}
              outcome={won ? 'won' : (score > 0 ? 'part' : 'lost')}
              title={won ? `All ${N} words found` : (score > 0 ? `${score} of ${N} words found` : 'Not solved')}
              detail={`${score}/${N} · ${PUZZLE.theme} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Scour all time` : 'all-time rank' }
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
                  href: `/scour?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answers',
                  sub: won ? 'Your finished grid' : 'See where the rest were hiding', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Scour', sub: `No. ${prevPuzzle.num}, ${prevPuzzle.theme}`, href: `/scour?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>
        {!STAGE && <GamePanel self="scour" name="Scour" onShow={() => setShowChrome(true)} />}
        {LOFT && (
          <div className={STAGE ? undefined : 'loft-report'}>
            <ReportIssue self="scour" name="Scour" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
          </div>
        )}
        {!focusMode && !LOFT && (<DailyGamesGrid replay={ended ? resetGame : null}
          self="scour"
          maxWidth={640}
          challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
          share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
          light
          boardSlot={<DailyBoardPanel self="scour" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
          divider
        />)}
        {ended && !focusMode && mobileUi && !standalone && (
          <div style={{ maxWidth: 640, margin: '16px auto 0' }}>
            <button onClick={a2hsClick} style={{ width: '100%', fontFamily: SANS, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 800, height: 54, borderRadius: 10, border: 'none', background: '#21b45e', color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}>
              <Smartphone size={15} strokeWidth={2.5} /> Add to Home Screen
            </button>
          </div>
        )}
        <div id="stf-stats-slot" />
        {showA2hsHelp && (
          <div onClick={() => setShowA2hsHelp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 14, maxWidth: 430, width: '100%', padding: '22px 22px 16px', fontFamily: SANS, border: STAGE ? '1px solid var(--stg-line)' : '1.5px solid rgba(20,22,28,0.12)' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>Add Scour to your Home Screen</div>
              {isIosDevice() ? (
                <ol style={{ margin: '0 0 4px', paddingLeft: 20, color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  <li>Tap the <b>Share</b> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
                  <li>Tap <b>Add</b>. The Scour tile opens today&apos;s puzzle, every day.</li>
                </ol>
              ) : (
                <p style={{ margin: '0 0 4px', color: INK, fontSize: 14, lineHeight: 1.7 }}>
                  Open your browser&apos;s menu and choose <b>Add to Home Screen</b> (or <b>Install app</b>). The Scour tile opens today&apos;s puzzle, every day.
                </p>
              )}
              <button onClick={() => setShowA2hsHelp(false)} style={{ marginTop: 10, fontFamily: SANS, fontSize: 12.5, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700, height: 44, width: '100%', borderRadius: 10, border: 'none', background: COLORS.ink, color: T.white, cursor: 'pointer' }}>Got it</button>
            </div>
          </div>
        )}
        {!focusMode && !identity && (
          <div id="daily-join" style={{ maxWidth: 640, margin: '18px auto 0' }}>
            <JoinLeaderboardForm hideIcon heading="See your stats and join the leaderboard" identity={identity} onJoined={(id) => { setIdentity(id); }} />
          </div>
        )}
      </div>

      {ended && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="scour"
          won={won}
          headline={<>{score} of {N} words found</>}
          subline={<>{PUZZLE.theme} &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

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
            <button className="so-btn" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }} style={{ marginTop: 14, background: COLORS.ink, color: T.white }}>Play</button>
          </div>
        </div>
      )}

      <StageFold />
      <section style={{ position: 'relative', display: (focusMode && !STAGE) ? 'none' : 'block', zIndex: 2, maxWidth: 640, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Scour</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Scour is a free daily word search from Mind Loft. Every day brings one theme, such as cities, countries, food, animals, jobs or first names, and a big fifteen by fifteen grid with fourteen to eighteen words from it hidden inside.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Drag across a word, or tap its first letter and then its last. Every word is hidden exactly once, a wrong line costs nothing, and the clock decides the daily leaderboard. The words run across and down on Monday and pick up diagonals, backward words and decoys through the week.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          The Sunday Edition is the big one: an eighteen by eighteen grid with twenty-six words running in all eight directions. No app, no signup, play free in your browser. Want the same theme scrambled instead? Try <a href="/scram" style={{ color: INK, fontWeight: 800 }}>Scram</a>.
        </p>
      </section>

      {!STAGE && <div style={{ position: 'relative', zIndex: 2, display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
