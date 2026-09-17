'use client';

// Redact — the daily uncover-the-article game.
//
// One capsule article a day about one famous subject, every content word
// hidden behind a block. Guess words; every hit reveals all its occurrences.
// Win by uncovering every content word of the TITLE (the subject's name).
// A category chip (Person / Place / Thing / Event / Work) shows from the
// start, so the opening minutes have direction.
//
// Scoring: total = 100 points. A solve posts 100 whatever the guess count;
// giving up posts the percentage of content words uncovered (the completion
// axis lib/quiz-xp.js curves for partial IQ credit). guessesUsed = guesses
// submitted, which is the daily board's tiebreak before time. There is no
// "par": efficiency is compared on the board and in the share bands.
//
// The subject and text arrive base64-packed from app/redact/page.js. That is
// an obfuscation against casual view-source, not a security boundary — the
// same client-side stance Extra takes with resolveHidden.
//
// A HIDDEN WORD IS NEVER IN THE DOM. Body slabs AND title slabs render a bare
// non-breaking space sized to the word, never the word itself. The title slab
// used to hold the real text under color:transparent, so selecting the headline
// and copying it handed over the answer outright (fixed Aug 2026). Never hide a
// word with color, opacity, clip or a zero font size: put no text there at all.
// The space must be U+00A0, not " " -- a plain space collapses inside the title
// slab and the block loses its height entirely.
//
// Same daily plumbing as Suffice/Sworn/Suds: banked days gated by Eastern date
// on the server, per-day localStorage saves, /redact?p=N archive pinning,
// streaks and stats, and the shared /api/quiz/* board flow.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Flag } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import DailyGamesGrid from '../DailyGamesGrid';
import DailyEndCard from '../DailyEndCard';
import DailyChrome from '../DailyChrome';
import DailyBoardPanel from '../quiz/[id]/DailyBoardPanel';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import DailyMasthead from '../DailyMasthead';
import { isLoft } from '@/lib/loft';
import ReportIssue from '../ReportIssue';
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
import { isMobileDevice } from '@/lib/is-mobile';
import { T } from '@/lib/theme';
import { FREEBIES, norm, tokenize, titleTargets, guessMatches } from './words';

const COLORS = {
  ink: T.ink,
  faded: T.muted,
  accent: '#27272a',        // Redact identity — the black of the marker itself
  accentSoft: '#e4e4e7',
  accentDeep: '#18181b',
  hit: '#b45309',           // amber flash on the words your last guess uncovered
  hitSoft: '#fef3c7',
  green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const HELP_KEY = 'sot_redact_help_seen';

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
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('sot_quiz_anon', a); }
    return a;
  } catch (e) { return ''; }
}
function unpack(enc) {
  try {
    const bytes = Uint8Array.from(atob(enc), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return null; }
}

const freshState = () => ({ v: 1, guesses: [], status: 'playing', t0: null, tEnd: null });
const EMPTY_BOARD = { plays: 0, best: null, leaderboard: [] };

// ── stats (same shape every daily uses) ──────────────────────────────────────
const STATS_KEY = 'sot_redact_stats';
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); return s && s.byNum ? s : { byNum: {} }; }
  catch (e) { return { byNum: {} }; }
}
function recordStat(num, rec) {
  const s = getStats();
  const s2 = { ...s, byNum: { ...s.byNum, [num]: rec } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(stats, todayNum) {
  if (!stats) return { played: 0, wins: 0, cur: 0, max: 0 };
  const byNum = stats.byNum || {};
  const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);
  const played = nums.length;
  const wins = nums.filter((n) => byNum[n].won).length;
  let cur = 0;
  for (let n = todayNum; n >= 1; n--) {
    const r = byNum[n];
    if (!r) { if (n === todayNum) continue; break; }
    if (!r.won) break;
    cur++;
  }
  let max = 0, run = 0, prev = null;
  for (const n of nums) {
    if (!byNum[n].won) { run = 0; prev = n; continue; }
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    if (run > max) max = run;
    prev = n;
  }
  return { played, wins, cur, max: Math.max(max, cur) };
}

// Share bands: five squares from guess efficiency on a solve, empty on a pass.
// Bands are fixed and public (30/60/100/150), so the bar never leaks the
// subject or the board — the house score-bar rule.
function shareSquares(won, guesses) {
  if (!won) return '⬜⬜⬜⬜⬜';
  const g5 = guesses <= 30 ? 5 : guesses <= 60 ? 4 : guesses <= 100 ? 3 : guesses <= 150 ? 2 : 1;
  return '🟩'.repeat(g5) + '⬜'.repeat(5 - g5);
}

const DIFF_LABEL = { 1: 'Gentle', 2: 'Fair', 3: 'Tricky', 4: 'Hard', 5: 'Brutal' };

export default function RedactClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const STORE_KEY = `sot_redact_${PUZZLE.num}`;

  const DAY = useMemo(() => unpack(PUZZLE.enc) || { answer: '', text: '', aka: {} }, [PUZZLE.enc]);
  const AKA = DAY.aka || {};
  const TOKENS = useMemo(() => tokenize(DAY.text), [DAY.text]);
  const TITLE_TOKENS = useMemo(() => tokenize(DAY.answer), [DAY.answer]);
  const TARGETS = useMemo(() => titleTargets(DAY.answer), [DAY.answer]);
  // Unique content norms with occurrence counts, for hit math and the reveal %.
  const CONTENT = useMemo(() => {
    const m = new Map();
    for (const tk of TOKENS) if (tk.w && !FREEBIES.has(tk.n)) m.set(tk.n, (m.get(tk.n) || 0) + 1);
    for (const tk of TITLE_TOKENS) if (tk.w && !FREEBIES.has(tk.n)) m.set(tk.n, (m.get(tk.n) || 0) + 1);
    return m;
  }, [TOKENS, TITLE_TOKENS]);
  const CONTENT_OCC = useMemo(() => { let s = 0; for (const v of CONTENT.values()) s += v; return s; }, [CONTENT]);

  const [g, setG] = useState(freshState);
  const [input, setInput] = useState('');
  const [flash, setFlash] = useState(null);        // { w, hits } for the last guess readout
  const [lastNorms, setLastNorms] = useState([]);  // token norms the last guess uncovered (amber flash)
  const [peek, setPeek] = useState(-1);            // index of a hidden token showing its length
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
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
  const [copied, setCopied] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);
  const inputRef = useRef(null);

  const playing = g.status === 'playing';
  const LOFT = isLoft('redact');
  const STAGE = isStage('redact', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('redact');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('redact'), '--stg-acc-lt': gameColorLight('redact'), '--stg-onramp-lt': gameOnrampLight('redact'), '--stg-acc-ink-lt': gameAccentInkLight('redact') };
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
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  // Focus mode: while the puzzle is live the leaderboard / share / other-games
  // block is folded away behind one button, the same arrangement every other
  // daily uses (owner rule, 2026-08-08). setShowChrome unfolds it for good.
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0;
  const solved = g.status === 'won';
  const over = !playing;

  useEffect(() => { try { setMobileUi(isMobileDevice()); } catch (e) {} }, []);

  // Norms revealed by the guesses so far (freebies are always revealed).
  const revealedNorms = useMemo(() => {
    const out = new Set();
    const effective = [];
    for (const gu of g.guesses) {
      effective.push(gu.n);
      if (AKA[gu.n]) effective.push(AKA[gu.n]);
    }
    for (const n of CONTENT.keys()) {
      for (const e of effective) if (guessMatches(e, n)) { out.add(n); break; }
    }
    return out;
  }, [g.guesses, CONTENT, AKA]);

  const isRevealed = (tk) => over || FREEBIES.has(tk.n) || revealedNorms.has(tk.n);
  const won = TARGETS.length > 0 && TARGETS.every((t) => revealedNorms.has(t));

  const revealedOcc = useMemo(() => {
    let s = 0;
    for (const [n, c] of CONTENT) if (revealedNorms.has(n)) s += c;
    return s;
  }, [CONTENT, revealedNorms]);
  const pct = CONTENT_OCC ? Math.round((revealedOcc / CONTENT_OCC) * 100) : 0;
  const hits = g.guesses.filter((x) => x.hits > 0).length;
  const acc = g.guesses.length ? Math.round((hits / g.guesses.length) * 100) : 0;

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.guesses)) setG({ ...freshState(), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_redact_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_redact_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  // Live clock, ticked from state (the daily-clock rule).
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!playing || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [playing, g.t0, g.tEnd]);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  // ---- metrics + leaderboard ----
  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
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

  // Leaving mid-game posts a normal partial result (site-wide abandon rule).
  const REC_KEY = `sot_redact_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!playing || !g.guesses.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    return { quizId: PUZZLE.quizId, score: Math.min(99, pct), total: 100, correct: 0, guessesUsed: g.guesses.length, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, didWin, finalPct) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const sc = didWin ? 100 : Math.min(99, finalPct);
    try { setStats(recordStat(PUZZLE.num, { s: sc, g: g2.guesses.length, won: didWin })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        // guessesUsed = guesses submitted, so the board's ties break by the
        // more efficient solver before the faster one.
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: 100, correct: didWin ? 1 : 0, guessesUsed: g2.guesses.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); })
        .catch(() => {});
    } catch (e) {}
  }

  function start() {
    setG((cur) => (cur.t0 ? cur : { ...cur, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setGateRules(false);
    setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch (e) {} }, 50);
  }

  function submitGuess() {
    if (!playing || !g.t0) return;
    const words = input.split(/\s+/).map(norm).filter(Boolean).slice(0, 4);
    setInput('');
    if (!words.length) return;
    setG((cur) => {
      if (cur.status !== 'playing') return cur;
      let guesses = cur.guesses;
      let flashed = null;
      const newNorms = [];
      for (const n of words) {
        if (FREEBIES.has(n)) { flashed = { w: n, hits: -1 }; continue; }        // already free
        if (guesses.some((x) => x.n === n)) { flashed = { w: n, hits: -2 }; continue; } // duplicate, not spent
        const effective = [n]; if (AKA[n]) effective.push(AKA[n]);
        let hitCount = 0;
        for (const [tn, c] of CONTENT) {
          if (guesses.some((x) => guessMatches(x.n, tn) || (AKA[x.n] && guessMatches(AKA[x.n], tn)))) continue;
          for (const e of effective) if (guessMatches(e, tn)) { hitCount += c; newNorms.push(tn); break; }
        }
        guesses = [...guesses, { w: n, n, hits: hitCount }];
        flashed = { w: n, hits: hitCount };
      }
      if (guesses === cur.guesses) { setFlash(flashed); return cur; }
      setFlash(flashed);
      setLastNorms(newNorms);
      // win check against the NEW guess list
      const effAll = [];
      for (const gu of guesses) { effAll.push(gu.n); if (AKA[gu.n]) effAll.push(AKA[gu.n]); }
      const winNow = TARGETS.length > 0 && TARGETS.every((t) => effAll.some((e) => guessMatches(e, t)));
      if (winNow) {
        const g2 = { ...cur, guesses, status: 'won', tEnd: Date.now() };
        postResult(g2, true, 100);
        return g2;
      }
      return { ...cur, guesses };
    });
  }

  function giveUp() {
    setConfirmGiveUp(false);
    setG((cur) => {
      if (cur.status !== 'playing') return cur;
      const g2 = { ...cur, status: 'lost', tEnd: Date.now() };
      postResult(g2, false, pct);
      return g2;
    });
  }

  function resetGame() {
    setG(freshState());
    setInput('');
    setFlash(null);
    setLastNorms([]);
    setEndClosed(false);
  }

  function copyShare() {
    const line = solved
      ? `Solved in ${g.guesses.length} guesses · ${acc}% hit rate · ${elapsed}`
      : `Passed with ${pct}% uncovered · ${g.guesses.length} guesses`;
    const txt = `Redact #${PUZZLE.num}\n${line}\n${shareSquares(solved, g.guesses.length)}\nmindloftdaily.com/redact`;
    try {
      navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }

  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);
  const paragraphs = useMemo(() => {
    const out = [[]];
    for (const tk of TOKENS) {
      if (!tk.w && tk.t.includes('\n')) { out.push([]); continue; }
      out[out.length - 1].push(tk);
    }
    return out.filter((p) => p.length);
  }, [TOKENS]);

  // One rendered token. Hidden words are ink slabs sized to the word; a tap
  // shows the letter count. Words the last guess uncovered flash amber.
  let tokenIdx = -1;
  function renderToken(tk, key) {
    if (!tk.w) return <span key={key}>{tk.t}</span>;
    tokenIdx++;
    const idx = tokenIdx;
    if (isRevealed(tk)) {
      const fresh = lastNorms.includes(tk.n);
      return (
        <span key={key} style={fresh ? { background: `var(--stg-surf, ${COLORS.hitSoft})`, color: '#7c2d12', borderRadius: 3, padding: '0 1px' } : undefined}>{tk.t}</span>
      );
    }
    const showLen = peek === idx;
    return (
      <span
        key={key}
        onClick={() => setPeek(showLen ? -1 : idx)}
        className="rd-slab"
        style={{ minWidth: `${Math.max(1.2, tk.t.length * 0.62)}ch` }}
      >{showLen ? tk.t.length : ' '}</span>
    );
  }

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'redact', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'redact', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'redact', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'redact', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'redact', active: LOFT && !playing });

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? stageTheme : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && (
      <DailyChrome slug="redact" name="Redact" collapsed={!!g.t0} loft={LOFT} />
      )}
      {LOFT && (
        <Cap gameKey="redact" quizId={PUZZLE.quizId}
          name="Redact"
          cat="Trivia"
          outcome={playing ? null : (won ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={playing ? [
            { v: elapsed, k: 'time' },
          ] : [
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="rd-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.rd-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .rd-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accentDeep};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .rd-btn:hover{background:var(--stg-surf2, ${COLORS.accentSoft});}
          .rd-btn.primary{background:var(--stg-acc, ${COLORS.accentDeep});border-color:var(--stg-acc, ${COLORS.accentDeep});color:var(--stg-onramp, var(--white));}
          .rd-btn.primary:hover{background:color-mix(in srgb, var(--stg-acc, #000) 86%, var(--stg-ink, var(--white)));}
          .rd-slab{display:inline-block;background:var(--stg-acc, ${COLORS.accentDeep});border-radius:3px;color:#e4e4e7;font-family:${MONO};font-size:11px;line-height:1.5;text-align:center;cursor:pointer;vertical-align:baseline;user-select:none;}
          .rd-slab:hover{background:#3f3f46;}
          .rd-article{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border: 1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:12px;padding:20px 22px;font-size:15.5px;line-height:2.05;color:${INK};}
          .rd-article p{margin:0 0 14px;}
          .rd-article p:last-child{margin-bottom:0;}
          .rd-title-slab{display:inline-block;background:var(--stg-acc, ${COLORS.accentDeep});border-radius:4px;color:transparent;user-select:none;-webkit-user-select:none;}
          .rd-chip{display:inline-flex;align-items:center;gap:5px;font-family:${MONO};font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;border-radius:5px;padding:3px 8px;}
          .rd-guess{display:inline-flex;align-items:center;gap:5px;font-family:${MONO};font-size:12px;border-radius:6px;padding:2px 8px;border: 1px solid var(--stg-line, rgba(28,30,36,0.14));background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};}
          .rd-guess.hit{border-color:${COLORS.hit};background:${COLORS.hitSoft};color:#7c2d12;font-weight:700;}
          .rd-guess.zero{color:${FADED};}
          .rd-sticky{position:sticky;top:0;z-index:30;background:${STAGE ? 'var(--stg-ground)' : T.surface};padding:8px 0 10px;border-bottom: 1px solid var(--stg-line, rgba(28,30,36,0.1));}
          .rd-input{flex:1;min-width:0;font-family:${SANS};font-weight:700;font-size:16px;border:2px solid var(--stg-acc, ${COLORS.accentDeep});border-radius:9px;padding:10px 13px;background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};color:${INK};outline:none;}
          .rd-input::placeholder{color:${FADED};font-weight:600;}
          .rd-stat{display:flex;flex-direction:column;align-items:center;min-width:56px;}
          .rd-stat b{font-family:${MONO};font-size:15px;color:${INK};}
          .rd-stat span{font-family:${MONO};font-size:9px;letter-spacing:0.08em;text-transform:uppercase;color:${FADED};}
        ` }} />

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {!LOFT && (
          <DailyMasthead
            slug="redact"
            num={PUZZLE.num}
            dateLabel={PUZZLE.dateLabel}
            accent={COLORS.accentDeep}
            blockGap={4}
            helpTop={8}
            onHelp={() => setShowHelp(true)}
            sunday={PUZZLE.sunday && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, color: `var(--stg-onramp, ${T.white})`, background: `var(--stg-acc, ${COLORS.accentDeep})`, borderRadius: 4, padding: '2px 6px' }}>Sunday Edition &middot; A Harder Subject</span>}
            blocks={'REDACT'.split('').map((ch, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 19, background: i === 0 ? COLORS.hit : COLORS.ink, color: T.white, boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.65)' }}>{ch}</div>
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

          {/* start tile */}
          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '20px 22px', margin: '4px 0 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 8px' }}>
                An entire article, blacked out. Name its subject.
              </h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: FADED, fontWeight: 600, margin: '0 0 10px' }}>
                Today&apos;s subject is a <b style={{ color: ACC_DEEP_INK }}>{DAY ? PUZZLE.cat : ''}</b>, rated{' '}
                <b style={{ color: ACC_DEEP_INK }}>{DIFF_LABEL[PUZZLE.diff] || 'Fair'}</b>. Guess one word at a time;
                every hit uncovers that word everywhere it appears. Uncover the title to win.
              </p>
              {gateRules && (
                <div style={{ marginBottom: 14 }}>
                  <DailyRules
                    accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
                    steps={[
                      <>Common words like <b>the</b>, <b>of</b>, <b>and</b> and <b>was</b> are already uncovered for free.</>,
                      <>Plurals count: guessing <b>year</b> also uncovers <b>years</b>.</>,
                      <>Tap any block to see <b>how many letters</b> it hides.</>,
                    ]}
                    knack="Start broad, with words like city, war, century and first, then follow whatever appears."
                    footer="There is no guess limit and no clock pressure, only the board."
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="rd-btn primary" onClick={start}>Start uncovering</button>
                {!gateRules && (
                  <button className="rd-btn" onClick={() => setGateRules(true)}>Show instructions</button>
                )}
              </div>
            </div>
          )}

          {!preStart && (
            <>
              {/* sticky score block + input (typed dailies pin these to the top) */}
              <div className="rd-sticky">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: playing ? 8 : 0, flexWrap: 'wrap' }}>
                  <span className="rd-chip" style={{ background: `var(--stg-acc, ${COLORS.accentDeep})`, color: `var(--stg-onramp, ${T.white})` }}>{PUZZLE.cat}</span>
                  <span className="rd-chip" style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, color: ACC_DEEP_INK }}>{DIFF_LABEL[PUZZLE.diff] || 'Fair'}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
                    <div className="rd-stat"><b>{g.guesses.length}</b><span>Guesses</span></div>
                    <div className="rd-stat"><b>{acc}%</b><span>Hit rate</span></div>
                    <div className="rd-stat"><b>{pct}%</b><span>Uncovered</span></div>
                    <div className="rd-stat"><b>{elapsed}</b><span>Time</span></div>
                  </div>
                </div>
                {playing && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      ref={inputRef}
                      className="rd-input"
                      value={input}
                      maxLength={40}
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Guess a word..."
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitGuess(); }}
                    />
                    <button className="rd-btn primary" onClick={submitGuess}>Guess</button>
                    <button className="rd-btn" title="Reveal the article and end the day" onClick={() => setConfirmGiveUp(true)}><Flag size={15} /></button>
                  </div>
                )}
                {flash && playing && (
                  <div style={{ fontFamily: MONO, fontSize: 12, color: flash.hits > 0 ? '#7c2d12' : `var(--stg-mute, ${COLORS.faded})`, marginTop: 6 }}>
                    {flash.hits === -1 ? `"${flash.w}" is already free` : flash.hits === -2 ? `already guessed "${flash.w}"` : flash.hits === 0 ? `"${flash.w}" appears nowhere` : `"${flash.w}" uncovered ${flash.hits} ${flash.hits === 1 ? 'word' : 'words'}`}
                  </div>
                )}
              </div>

              {/* the redacted headline */}
              <div style={{ margin: '16px 0 10px', fontSize: 24, fontWeight: 900, color: INK, lineHeight: 1.35 }}>
                {TITLE_TOKENS.map((tk, i) => {
                  if (!tk.w) return <span key={i}>{tk.t}</span>;
                  if (over || FREEBIES.has(tk.n) || tk.n.length < 3 || revealedNorms.has(tk.n)) {
                    return <span key={i} style={over && solved ? { color: `var(--stg-ink, ${COLORS.hit})` } : undefined}>{tk.t}</span>;
                  }
                  // Width only, never the letters: 0.85ch per character tracks the
                  // real word's width in this face without putting it in the DOM.
                  return <span key={i} className="rd-title-slab" style={{ width: `${Math.max(1.2, tk.t.length * 0.85)}ch` }}>{'\u00a0'}</span>;
                })}
                {over && (
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, color: FADED, marginLeft: 10 }}>
                    {solved ? 'named it' : 'revealed'}
                  </span>
                )}
              </div>

              {/* the article */}
              <div className="rd-article">
                {paragraphs.map((para, pi) => (
                  <p key={pi}>{para.map((tk, ti) => renderToken(tk, `${pi}-${ti}`))}</p>
                ))}
              </div>

              {/* guess history */}
              {g.guesses.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {[...g.guesses].reverse().map((gu, i) => (
                    <span key={i} className={`rd-guess${gu.hits > 0 ? ' hit' : ' zero'}`}>{gu.w}{gu.hits > 0 ? ` ×${gu.hits}` : ''}</span>
                  ))}
                </div>
              )}

              {over && (
                <div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : '1px solid rgba(28,30,36,0.14)', borderRadius: 12, padding: '16px 20px', margin: '16px 0 0' }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: INK, marginBottom: 4 }}>
                    {solved ? `Named in ${g.guesses.length} guesses.` : `The subject was ${DAY.answer}.`}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, color: FADED }}>
                    {acc}% hit rate &middot; {pct}% of the article uncovered &middot; {elapsed}
                  </div>
                </div>
              )}
            </>
          )}


          </div>
          {LOFT && !playing && revealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && (
            <LoftFinish
              name="Redact"
              catRank={catRank}
              outcome={won ? 'won' : 'lost'}
              title={won ? 'Solved' : 'Not solved'}
              detail={`${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '\u2014',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Redact all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Guesses"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num,
                  dateLabel: p.dateLabel,
                  sunday: !!p.sunday,
                  href: `/redact?p=${p.num}`,
                  done: !!(stats && stats.rec && stats.rec[p.num]),
                  score: (stats && stats.rec && stats.rec[p.num]) ? stats.rec[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: won ? 'board' : 'reveal', label: won ? 'Return to board' : 'Reveal answer',
                  sub: won ? 'Your finished board' : 'Show what you missed', onClick: () => setRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Redact', sub: `No. ${prevPuzzle.num}, yesterday\u2019s puzzle`, href: `/redact?p=${prevPuzzle.num}` },
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
        {!STAGE && <GamePanel self="redact" name="Redact" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (focusMode && !STAGE) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="redact" name="Redact" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!LOFT && (
            <DailyGamesGrid
              self="redact"
              maxWidth={640}
              replay={!playing ? resetGame : null}
              challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
              share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }}
              light
              divider
              boardSlot={<DailyBoardPanel self="redact" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
            />
            )}
          </div>
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard
          modal
          self="redact"
          won={solved}
          completed
          headline={solved ? <>Uncovered.</> : <>It was {DAY.answer}</>}
          subline={<>Redact #{PUZZLE.num} &middot; {solved ? `${g.guesses.length} guesses` : `${pct}% uncovered`} &middot; {acc}% hits &middot; {elapsed}</>}
          onShare={copyShare}
          shareLabel={copied ? 'Copied' : 'Share Result'}
          onReplay={resetGame}
          onClose={() => setEndClosed(true)}
        />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {confirmGiveUp && (
        <div onClick={() => setConfirmGiveUp(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 400, fontFamily: SANS }}>
            <b style={{ fontSize: 16, color: INK }}>Reveal the article?</b>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: FADED, margin: '8px 0 14px' }}>
              This ends the day. Your result posts as {pct}% uncovered, and the streak resets.
            </p>
            <button className="rd-btn primary" onClick={giveUp}>Reveal it</button>
            <button className="rd-btn" style={{ marginLeft: 8 }} onClick={() => setConfirmGiveUp(false)}>Keep guessing</button>
          </div>
        </div>
      )}

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 460, fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <HelpCircle size={19} color={COLORS.accentDeep} />
              <b style={{ fontSize: 17, color: INK }}>How Redact works</b>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 10px' }}>
              One article a day about one famous subject, every meaningful word hidden. Guess words to
              uncover them; uncover the title to win.
            </p>
            <ul style={{ fontSize: 13.5, lineHeight: 1.7, color: INK, margin: '0 0 12px', paddingLeft: 20 }}>
              <li>A guess uncovers every occurrence of that word, plurals included.</li>
              <li>The category chip and difficulty are shown from the start.</li>
              <li>Tap a block to see its letter count.</li>
              <li>Fewer guesses beats faster time on the daily board.</li>
              <li>Give up and the article is revealed, scored by what you uncovered.</li>
            </ul>
            <button className="rd-btn primary" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
          </div>
        </div>
      )}

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
