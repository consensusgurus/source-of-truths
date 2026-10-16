'use client';

// Ergo — the daily conditional-logic sort.
//
// A small cast, a handful of if-then rules about who does the day's one thing,
// ONE fact for today, and nine statements (twelve on the Sunday Edition) to file
// as must be true, could be true or cannot be true. The rules stay pinned and
// each one can be FLIPPED to show its contrapositive, which is the skill the
// game teaches; the converse is the trap it sets.
//
// One ruling a day: statements can be moved between bins freely, and nothing is
// marked until the player presses Rule on it. Score = statements in the right
// bin, out of nine (twelve); the daily board breaks ties on fewest wrong
// (guessesUsed), then the clock. First attempt stands.
//
// No answer key ships: app/ergo/engine.js enumerates every lineup the rules and
// the fact allow and derives each verdict in the browser. After the ruling every
// statement shows the chain of rules that settles it (the bank's 'why').
//
// Plumbing is Docket's: banked days gated by Eastern date on the server,
// per-day saves, /ergo?p=N archive pinning, streaks, the shared /api/quiz/*
// flow, the stage cap and LoftFinish, and RunEmbed for the Judged run.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { HelpCircle, X, Check, RotateCcw } from 'lucide-react';
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
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import GamePanel from '../GamePanel';
import RunDoorPop from '../circuits/RunDoorPop';
import { useRunEmbed } from '../RunEmbed';
import useIqStanding from '../useIqStanding';
import useNextUnplayed, { useUnplayedSimilar } from '../useNextUnplayed';
import useDailyBoard from '../useDailyBoard';
import useGameAllTime from '../useGameAllTime';
import useDayStats from '../useDayStats';
import useCategoryRank from '../useCategoryRank';
import LoftFinish from '../LoftFinish';
import AddToHome from '../AddToHome';
import { CONTEST, contestIsLive } from '@/lib/contest';
import DailyRules from '../DailyRules';
import { isMobileDevice } from '@/lib/is-mobile';
import { T } from '@/lib/theme';
import { solveDay, BINS, BIN_LABEL, litText, whyLine } from './engine';

const COLORS = { ink: T.ink, faded: T.muted, accent: '#5b3a9e', accentSoft: '#efe9fa', accentDeep: '#3b2470', green: T.successDeep };
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const HELP_KEY = 'sot_ergo_help_seen';
const STATS_KEY = 'sot_ergo_stats';

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

const freshState = (n) => ({ v: 1, picks: Array(n).fill(null), flips: 0, t0: null, tEnd: null, status: 'playing' });
const EMPTY_BOARD = { plays: 0, best: null, leaderboard: [] };

function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); return s && s.byNum ? s : { byNum: {} }; }
  catch (e) { return { byNum: {} }; }
}
function recordStat(num, rec) {
  const s = getStats();
  if (s.byNum[num]) return s;
  const s2 = { ...s, byNum: { ...s.byNum, [num]: rec } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(stats, todayNum) {
  if (!stats) return { played: 0, wins: 0, cur: 0, max: 0 };
  const byNum = stats.byNum || {};
  const nums = Object.keys(byNum).map(Number).sort((a, b) => a - b);
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
  return { played: nums.length, wins: nums.filter((n) => byNum[n].won).length, cur, max: Math.max(max, cur) };
}

export default function ErgoClient({ puzzles = [], forceNum = null }) {
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, forceNum), [puzzles, forceNum]);
  const ST = PUZZLE.statements;
  const TOTAL = ST.length;
  // rev: a board corrected after it went live keeps a fresh save, so picks
  // filed against the old statements never land on the new ones.
  const STORE_KEY = `sot_ergo_${PUZZLE.num}${PUZZLE.rev ? `_r${PUZZLE.rev}` : ''}`;
  const SOLVED = useMemo(() => solveDay(PUZZLE), [PUZZLE]);
  const KEY = SOLVED.keys;

  const [g, setG] = useState(() => freshState(TOTAL));
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [loftRevealed, setLoftRevealed] = useState(false);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);

  const playing = g.status === 'playing';
  const LOFT = isLoft('ergo');
  const STAGE = isStage('ergo', searchParams);
  const STAGE_C = STAGE ? 'var(--stg-acc)' : gameColor('ergo');
  const Cap = STAGE ? StageChrome : LoftCap;
  const STAGE_ACC = { '--stg-acc-dk': gameColor('ergo'), '--stg-acc-lt': gameColorLight('ergo'), '--stg-onramp-lt': gameOnrampLight('ergo'), '--stg-acc-ink-lt': gameAccentInkLight('ergo') };
  const [stageTheme] = useStageTheme();
  const EMBED = useRunEmbed();
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.14)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const [showChrome, setShowChrome] = useState(false);
  const focusMode = playing && !showChrome;
  const preStart = playing && !g.t0;
  const filed = g.picks.filter((x) => x !== null).length;
  const cur = g.picks.findIndex((x) => x === null);
  const correct = g.picks.filter((p, i) => p !== null && p === KEY[i]).length;
  const wrong = TOTAL - correct;
  const score = playing ? 0 : correct;
  const won = score === TOTAL;
  const showAnswers = !playing && (!LOFT || score > 0 || loftRevealed);

  // ---- persistence ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.picks) && saved.picks.length === TOTAL) setG({ ...freshState(TOTAL), ...saved });
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
        if (done || g.t0) localStorage.setItem('sot_ergo_day', JSON.stringify({ d: etToday(), done }));
        else localStorage.removeItem('sot_ergo_day');
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!playing || !g.t0 || g.tEnd) return undefined;
    setNowTick(Date.now());
    const iv = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(iv);
  }, [playing, g.t0, g.tEnd]);
  const elapsed = g.t0 ? fmtTime((g.tEnd || nowTick) - g.t0) : '0:00';

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(PUZZLE.quizId)}`).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filing one statement is the started signal; opening the page is not.
  const REC_KEY = `sot_ergo_rec_${PUZZLE.num}`;
  const abandon = useAbandonFlush(() => {
    if (!playing || !g.picks.some((p) => p !== null)) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (g.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const c = g.picks.filter((p, i) => p !== null && p === KEY[i]).length;
    return { quizId: PUZZLE.quizId, score: c, total: TOTAL, correct: c, guessesUsed: TOTAL - c, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2, sc) {
    abandon.markFlushed();
    if (EMBED) EMBED.onResult({ key: 'ergo', score: sc, total: TOTAL, t0: g2 && g2.t0, tEnd: (g2 && g2.tEnd) || Date.now() });
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    try { setStats(recordStat(PUZZLE.num, { s: sc, t: TOTAL, g: TOTAL - sc, won: sc === TOTAL })); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: sc, total: TOTAL, correct: sc, guessesUsed: TOTAL - sc, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).then((r) => r.json()).then((d) => { if (d && !d.error) setBoard({ ...EMPTY_BOARD, ...d }); }).catch(() => {});
    } catch (e) {}
  }

  function start() {
    setG((c) => (c.t0 ? c : { ...c, t0: Date.now() }));
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setGateRules(false);
  }
  function file(bin) {
    if (!playing || preStart || cur < 0) return;
    setG((c) => { const picks = c.picks.slice(); const i = picks.findIndex((x) => x === null); if (i < 0) return c; picks[i] = bin; return { ...c, picks }; });
  }
  function unfile(i) {
    if (!playing) return;
    setG((c) => { const picks = c.picks.slice(); picks[i] = null; return { ...c, picks }; });
  }
  function toggleFlip(i) {
    setG((c) => ({ ...c, flips: (c.flips || 0) ^ (1 << i) }));
  }
  function ruleOnIt() {
    if (!playing || cur >= 0) return;
    const g2 = { ...g, status: 'done', tEnd: Date.now() };
    setG(g2);
    postResult(g2, g2.picks.filter((p, i) => p === KEY[i]).length);
  }
  function resetGame() {
    setG(freshState(TOTAL));
    setEndClosed(false);
    setLoftRevealed(false);
  }

  // 1 / 2 / 3 file the statement in hand.
  useEffect(() => {
    function onKey(e) {
      if (e.target && /input|textarea/i.test(e.target.tagName || '')) return;
      if (e.key === '1') file('must'); else if (e.key === '2') file('could'); else if (e.key === '3') file('cannot');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function copyShare() {
    // Squares only: how you did, never which bin was right.
    const marks = g.picks.map((p, i) => (p === KEY[i] ? '🟪' : '⬜')).join('');
    const txt = `Ergo #${PUZZLE.num}\n${correct}/${TOTAL} · ${elapsed}\n${marks}\nmindloftdaily.com/ergo`;
    try { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
  }

  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  const iq = useIqStanding({ game: 'ergo', quizId: PUZZLE.quizId, active: LOFT && !playing });
  const nextUp = useNextUnplayed({ self: 'ergo', active: LOFT && !playing });
  const upNext = useUnplayedSimilar({ self: 'ergo', active: LOFT && !playing });
  const dailyBoard = useDailyBoard({ quizId: PUZZLE.quizId, active: LOFT && !playing });
  const allTime = useGameAllTime({ game: 'ergo', active: LOFT && !playing });
  const dayStats = useDayStats();
  const catRank = useCategoryRank({ self: 'ergo', active: LOFT && !playing });
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const chips = (steps) => (
    <span className="eg-chain">
      {steps.map((st, si) => (
        <span key={si} className="eg-step">
          {si > 0 && <span className="eg-by">{st.by} &rarr;</span>}
          <span className={`eg-lit${st.l[1] ? '' : ' neg'}`}>{litText(PUZZLE, st.l)}</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className={STAGE ? 'stage-page' : (LOFT ? 'loft-page' : undefined)}
      data-stage-theme={STAGE ? (EMBED ? (EMBED.theme || 'dark') : stageTheme) : undefined}
      data-stage-pin={STAGE && EMBED ? '' : undefined}
      style={{ ...(STAGE ? STAGE_ACC : null), minHeight: '100vh', position: 'relative', background: STAGE ? 'var(--stg-ground)' : T.surface, color: STAGE ? 'var(--stg-ink,#e9edf4)' : undefined, overflowX: (STAGE || LOFT) ? 'hidden' : undefined }}>
      {!STAGE && <Grain />}
      {!STAGE && <DailyChrome slug="ergo" name="Ergo" collapsed={!!g.t0} loft={LOFT} />}
      {LOFT && !EMBED && (
        <Cap gameKey="ergo" quizId={PUZZLE.quizId}
          name="Ergo"
          cat="Logic"
          outcome={playing ? null : (score > 0 ? 'won' : 'lost')}
          num={PUZZLE.num}
          tiles={playing ? null : upNext}
          dateLabel={PUZZLE.dateLabel}
          onHelp={() => setShowHelp(true)}
          sunday={PUZZLE.sunday ? 'Sunday Edition' : null}
          figures={[
            { v: playing ? `${filed}/${TOTAL}` : `${score}/${TOTAL}`, k: playing ? 'filed' : 'score' },
            { v: elapsed, k: 'time' },
          ]}
        />
      )}
      <div className="eg-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '18px 38px 80px', fontFamily: SANS }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media(max-width:560px){.eg-wrap{padding-left:12px !important;padding-right:12px !important;}}
          .eg-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : COLORS.accentDeep};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : COLORS.accentDeep};border-radius:8px;padding:9px 16px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
          .eg-btn.primary{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));color:var(--stg-onramp, var(--white));}
          .eg-panel{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:12px;padding:14px 16px;margin-bottom:12px;}
          .eg-lab{font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:${FADED};}
          .eg-rule{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:9px;background:var(--stg-surf2, #f5f7fb);margin-top:7px;}
          .eg-rule.open{outline:1.5px solid var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));}
          .eg-rn{flex:0 0 auto;width:24px;height:24px;border-radius:12px;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #fff);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;}
          .eg-rt{flex:1;min-width:0;font-size:15px;font-weight:700;line-height:1.4;color:${INK};}
          .eg-flipt{font-size:13.5px;font-weight:700;color:var(--stg-acc-ink, ${COLORS.accent});margin-top:3px;}
          .eg-flip{flex:0 0 auto;border:1.5px solid var(--stg-line2, rgba(28,30,36,0.2));background:transparent;color:${INK};border-radius:8px;padding:5px 10px;min-height:32px;font-family:${SANS};font-size:12.5px;font-weight:800;cursor:pointer;}
          .eg-fact{display:flex;gap:10px;align-items:center;margin-top:10px;padding:10px 12px;border-radius:9px;border:1.5px dashed var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent}));font-size:15px;font-weight:800;color:${INK};}
          .eg-card{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:12px;padding:18px 18px 16px;margin-bottom:12px;}
          .eg-st{font-size:22px;font-weight:800;line-height:1.3;color:${INK};margin:6px 0 14px;}
          .eg-bins3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
          @media(max-width:560px){.eg-bins3.go{grid-template-columns:1fr;}.eg-st{font-size:19px;}}
          .b-must{background:var(--stg-acc, ${COLORS.accent});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) !important;color:var(--stg-onramp, #fff) !important;}
          .b-could{background:var(--stg-acc-tint, ${COLORS.accentSoft});border-color:var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) !important;color:${INK} !important;}
          .b-cannot{background:transparent;border-color:var(--stg-line3, rgba(28,30,36,0.45)) !important;color:${INK} !important;}
          .eg-go{border:2px solid transparent;border-radius:10px;padding:14px 8px;min-height:48px;font-family:${SANS};font-size:15.5px;font-weight:800;cursor:pointer;}
          .eg-go .k{opacity:1;font-size:11px;font-weight:700;margin-left:6px;}
          @media(hover:none){.eg-go .k{display:none;}}
          .eg-bin{background:${STAGE ? 'var(--stg-surf)' : 'var(--white)'};border:1px solid var(--stg-line, rgba(28,30,36,0.14));border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-width:0;}
          .eg-bh{border:0 solid transparent;border-bottom-width:2px;padding:8px 11px;display:flex;align-items:center;font-size:11.5px;letter-spacing:.12em;font-weight:800;text-transform:uppercase;}
          .eg-bh b{margin-left:auto;font-size:14px;letter-spacing:0;}
          .eg-items{padding:8px;display:flex;flex-direction:column;gap:6px;min-height:52px;}
          .eg-item{text-align:left;border:1.5px solid var(--stg-line, rgba(28,30,36,0.16));background:var(--stg-surf2, #f5f7fb);color:${INK};border-radius:8px;padding:8px 9px;min-height:40px;font-family:${SANS};font-size:13px;font-weight:700;line-height:1.35;cursor:pointer;}
          .eg-item:disabled{cursor:default;}
          .eg-empty{font-size:12.5px;color:${FADED};font-weight:600;padding:4px 2px;}
          @media(max-width:560px){.eg-bins3.lists{grid-template-columns:1fr;}}
          .eg-pr{border-top:1px solid var(--stg-line, rgba(28,30,36,0.1));padding:12px 0;}
          .eg-pr:first-child{border-top:none;}
          .eg-ph{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
          .eg-v{font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;border:1.5px solid transparent;border-radius:5px;padding:3px 7px;}
          .eg-you{font-size:12.5px;font-weight:800;}
          .eg-you.ok{color:var(--stg-good, ${COLORS.green});}
          .eg-you.no{color:var(--stg-bad, #b91c1c);}
          .eg-pt{font-size:15.5px;font-weight:800;color:${INK};margin:6px 0;line-height:1.35;}
          .eg-pn{font-size:13px;color:${FADED};font-weight:600;line-height:1.5;margin-top:6px;}
          .eg-chain{display:flex;flex-wrap:wrap;align-items:center;gap:6px;}
          .eg-step{display:inline-flex;align-items:center;gap:6px;}
          .eg-by{font-size:11px;font-weight:800;color:${FADED};}
          .eg-lit{background:color-mix(in srgb, var(--stg-acc-ink, var(--stg-acc, ${COLORS.accent})) 18%, transparent);color:${INK};border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700;}
          .eg-lit.neg{background:var(--stg-surf2, #f1f2f5);}
        ` }} />

        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {!LOFT && (
            <DailyMasthead slug="ergo" num={PUZZLE.num} dateLabel={PUZZLE.dateLabel} accent={COLORS.accent} blockGap={4} helpTop={8} onHelp={() => setShowHelp(true)} />
          )}

        <div className={LOFT && !STAGE ? 'loft-stage' : undefined}>
          <div className={LOFT && !STAGE && !playing ? (loftRevealed ? 'loft-flip' : 'loft-flip on') : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-flip-in' : undefined}>
          <div className={LOFT && !STAGE && !playing ? 'loft-face' : undefined}>
          <div className={LOFT && !STAGE ? 'loft-sheet' : undefined}>

          {preStart && (
            <div className={STAGE ? 'stg-gate' : undefined} style={{ background: SURF, border: `1px solid ${SURF_B}`, borderRadius: 12, padding: '20px 22px', margin: '4px 0 14px' }}>
              <h2 style={{ fontSize: 19, fontWeight: 900, color: INK, margin: '0 0 8px' }}>A few rules, one fact, {TOTAL} statements.</h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: FADED, fontWeight: 600, margin: '0 0 12px' }}>
                Today it is <b style={{ color: ACC_INK }}>{PUZZLE.title}</b>. Each person either does the day&rsquo;s one thing or does not, the
                rules always hold, and one fact is given. File each statement as <b style={{ color: ACC_INK }}>must be true</b>,{' '}
                <b style={{ color: ACC_INK }}>could be true</b> or <b style={{ color: ACC_INK }}>cannot be true</b>, then rule on it once.
              </p>
              {gateRules && (
                <div style={{ marginBottom: 14 }}>
                  <DailyRules
                    accent={COLORS.accent} accentSoft={COLORS.accentSoft} accentDeep={COLORS.accentDeep}
                    steps={[
                      <>A rule reads one way only. &ldquo;If A, then B&rdquo; says nothing about what happens when B is true.</>,
                      <><b>Flip</b> a rule to see its contrapositive, &ldquo;if not B, then not A&rdquo;, which is always just as true.</>,
                      <>Chain rules: if A leads to B and B leads to C, then A leads to C.</>,
                      <>&ldquo;Must be true&rdquo; means true in every lineup the rules and the fact allow. &ldquo;Could&rdquo; means in at least one. &ldquo;Cannot&rdquo; means in none. For an &ldquo;if&rdquo; statement, look only at the lineups where its first half happens.</>,
                    ]}
                    knack="The commonest trap is a rule run backwards. If A leads to B, knowing B tells you nothing about A."
                    footer={`One point per statement in the right bin, ${TOTAL} today. Move anything you like before you rule; you get one ruling.`}
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <button className="eg-btn primary" onClick={start}>Start</button>
                {!gateRules && <button className="eg-btn" onClick={() => setGateRules(true)}>Show instructions</button>}
              </div>
            </div>
          )}

          {/* the brief: setup, rules (flippable) and today's fact. Nothing of
              the board shows before Start (owner, 2026-10-11). */}
          {!preStart && (
          <div className="eg-panel">
            <div className="eg-lab">{PUZZLE.title}</div>
            <div style={{ fontSize: 14.5, lineHeight: 1.55, color: FADED, fontWeight: 600, margin: '6px 0 2px' }}>{PUZZLE.setup}</div>
            {PUZZLE.rules.map((r, i) => {
              const open = !!((g.flips || 0) & (1 << i));
              return (
                <div key={i} className={`eg-rule${open ? ' open' : ''}`}>
                  <span className="eg-rn">{i + 1}</span>
                  <div className="eg-rt">
                    {r.text}
                    {open && <div className="eg-flipt">Flipped: {r.flip}</div>}
                  </div>
                  <button type="button" className="eg-flip" aria-pressed={open} aria-label={`${open ? 'Hide' : 'Show'} the flip of rule ${i + 1}`} onClick={() => toggleFlip(i)}>{open ? 'Hide' : 'Flip'}</button>
                </div>
              );
            })}
            <div className="eg-fact"><span className="eg-lab" style={{ color: ACC_INK }}>Today</span>{PUZZLE.givenText}</div>
          </div>
          )}

          {!preStart && playing && (
            <>
              {cur >= 0 ? (
                <div className="eg-card">
                  <div className="eg-lab">Statement {cur + 1} of {TOTAL}</div>
                  <div className="eg-st">{ST[cur].text}</div>
                  <div className="eg-bins3 go">
                    {BINS.map((b, bi) => (
                      <button key={b.key} type="button" className={`eg-go b-${b.key}`} onClick={() => file(b.key)}>
                        {b.label}<span className="k">{bi + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="eg-card" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 240px' }}>
                    <div style={{ fontSize: 19, fontWeight: 900, color: INK }}>All {TOTAL} filed.</div>
                    <div style={{ fontSize: 14, color: FADED, fontWeight: 600, marginTop: 3 }}>Tap anything to take it back. You get one ruling.</div>
                  </div>
                  <button className="eg-btn primary" onClick={ruleOnIt}>Rule on it</button>
                </div>
              )}
              <div className="eg-bins3 lists">
                {BINS.map((b) => {
                  const items = ST.map((s, i) => ({ s, i })).filter(({ i }) => g.picks[i] === b.key);
                  return (
                    <div key={b.key} className="eg-bin">
                      <div className={`eg-bh b-${b.key}`}>{b.short}<b>{items.length}</b></div>
                      <div className="eg-items">
                        {items.length ? items.map(({ s, i }) => (
                          <button key={i} type="button" className="eg-item" title="Take it back" onClick={() => unfile(i)}>{s.text}</button>
                        )) : <div className="eg-empty">Nothing yet.</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12.5, color: FADED, fontWeight: 600, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={13} /> Tap a filed statement to take it back. Keys 1, 2 and 3 file the one in hand.
              </div>
            </>
          )}

          {!playing && (
            <div className="eg-panel">
              <div style={{ fontSize: 20, fontWeight: 900, color: INK }}>{correct}/{TOTAL} &middot; {elapsed}</div>
              <div style={{ fontSize: 12.5, color: FADED, fontWeight: 600, margin: '2px 0 8px' }}>
                {SOLVED.worlds} lineup{SOLVED.worlds === 1 ? '' : 's'} fit every rule and today&rsquo;s fact.
              </div>
              {ST.map((s, i) => {
                const v = KEY[i];
                const mine = g.picks[i];
                const ok = mine === v;
                const b = BINS.find((x) => x.key === (showAnswers ? v : mine)) || BINS[1];
                const w = s.why || {};
                return (
                  <div key={i} className="eg-pr">
                    <div className="eg-ph">
                      {showAnswers && <span className={`eg-v b-${b.key}`}>{BIN_LABEL[v]}</span>}
                      <span className={`eg-you ${ok ? 'ok' : 'no'}`}>{ok ? <><Check size={13} style={{ verticalAlign: '-2px' }} /> You: right</> : <><X size={13} style={{ verticalAlign: '-2px' }} /> You said {mine ? BIN_LABEL[mine].toLowerCase() : 'nothing'}</>}</span>
                    </div>
                    <div className="eg-pt">{s.text}</div>
                    {showAnswers && (
                      <>
                        {(w.t === 'chain' || w.t === 'trap') && chips(w.steps)}
                        {w.t === 'pair' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{chips(w.a)}{chips(w.b)}</div>}
                        <div className="eg-pn">{whyLine(PUZZLE, s, v)}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          </div>
          {LOFT && !playing && loftRevealed && (
            <button className={STAGE ? 'stf-hideboard' : 'loft-showopts'} onClick={() => setLoftRevealed(false)}>&#8630; Hide game board</button>
          )}
          </div>
          {LOFT && !playing && !EMBED && (
            <LoftFinish
              name="Ergo"
              catRank={catRank}
              outcome={score > 0 ? 'won' : 'lost'}
              title={won ? 'Perfect ruling' : score > 0 ? 'Ruled' : 'Not complete'}
              detail={`${score}/${TOTAL} · ${elapsed}`}
              iq={iq}
              board={dailyBoard}
              gameRank={allTime && allTime.ready
                ? { value: allTime.rank != null ? `#${Number(allTime.rank).toLocaleString()}` : '—',
                    label: allTime.field != null ? `of ${Number(allTime.field).toLocaleString()} Ergo all time` : 'all-time rank' }
                : null}
              day={dayStats}
              streak={isTodays ? myStats.cur : null}
              missLabel="Wrong"
              archive={puzzles
                .filter((p) => p.live <= etToday() && p.num !== PUZZLE.num)
                .sort((x, y) => y.num - x.num)
                .map((p) => ({
                  num: p.num, dateLabel: p.dateLabel, sunday: !!p.sunday, href: `/ergo?p=${p.num}`,
                  done: !!(stats && stats.byNum && stats.byNum[p.num]),
                  score: (stats && stats.byNum && stats.byNum[p.num]) ? stats.byNum[p.num].s : null,
                }))}
              options={[
                { label: copied ? 'Copied' : (shareCta || 'Share'), sub: 'Your result, no spoilers', kind: 'gold', onClick: copyShare },
                { tone: (score > 0) ? 'board' : 'reveal', label: (score > 0) ? 'Return to board' : 'Reveal answer',
                  sub: (score > 0) ? 'Every statement, with its proof' : 'Show what you missed', onClick: () => setLoftRevealed(true) },
                prevPuzzle && { tone: 'another', label: 'Play another Ergo', sub: `No. ${prevPuzzle.num}, yesterday’s puzzle`, href: `/ergo?p=${prevPuzzle.num}` },
                nextUp && { tone: 'similar', label: 'Play similar', sub: `${nextUp.name} · ${nextUp.tag}`, href: nextUp.href },
                { tone: 'replay', label: 'Replay', sub: 'This puzzle again, unscored', onClick: resetGame },
                { label: 'Back to main', sub: 'The day’s full board', tone: 'main', href: '/' },
              ]}
            />
          )}
          </div>
          </div>
        </div>
          {!STAGE && <GamePanel self="ergo" name="Ergo" onShow={() => setShowChrome(true)} />}
          <div style={{ display: (EMBED || (focusMode && !STAGE)) ? 'none' : 'block', margin: '30px auto 0', maxWidth: 640 }}>
            {LOFT && (
              <div className={STAGE ? undefined : 'loft-report'}>
                <ReportIssue self="ergo" name="Ergo" accent="#ffffff" align="center" onHelp={() => setShowHelp(true)} />
              </div>
            )}
            {!focusMode && <AddToHome name="Ergo" />}
            <div id="stf-stats-slot" />
            {!LOFT && (
              <DailyGamesGrid self="ergo" maxWidth={640} replay={!playing ? resetGame : null}
                challengeHref={`/duel/new?quiz=${encodeURIComponent(PUZZLE.quizId)}`}
                share={{ label: copied ? 'Copied' : 'Share', onClick: copyShare }} light divider
                boardSlot={<DailyBoardPanel self="ergo" quizId={PUZZLE.quizId} maxWidth={640} streak={{ current: myStats.cur, best: myStats.max }} />}
              />
            )}
          </div>
        </div>
      </div>

      {!playing && !endClosed && !LOFT && (
        <DailyEndCard modal self="ergo" won={won} completed
          headline={won ? <>All {TOTAL}</> : <>{score} of {TOTAL}</>}
          subline={<>Ergo #{PUZZLE.num} &middot; {score}/{TOTAL} &middot; {wrong} wrong &middot; {elapsed}</>}
          onShare={copyShare} shareLabel={copied ? 'Copied' : 'Share Result'} onReplay={resetGame} onClose={() => setEndClosed(true)} />
      )}

      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />
      <RunDoorPop id="judged" game="ergo" ready={hydrated && preStart && isTodays && !EMBED} self="Ergo" />

      {showHelp && (
        <div onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.55)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: STAGE ? 'var(--stg-raise,#0e131f)' : T.white, borderRadius: 13, padding: '20px 22px', maxWidth: 460, fontFamily: SANS }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <HelpCircle size={19} color={COLORS.accent} />
              <b style={{ fontSize: 17, color: INK }}>How Ergo works</b>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 10px' }}>
              Each person in the cast either does the day&rsquo;s one thing or does not. The numbered rules always hold, and one fact is given
              for today. Sort every statement into must be true, could be true or cannot be true.
            </p>
            <ul style={{ fontSize: 13.5, lineHeight: 1.7, color: INK, margin: '0 0 12px', paddingLeft: 20 }}>
              <li>&ldquo;If A, B&rdquo; never tells you anything when B is true. That backwards reading is the trap.</li>
              <li>Flip a rule to see its contrapositive: if not B, then not A. It is always just as true.</li>
              <li>Judge an &ldquo;if A, B&rdquo; statement only on the lineups where A happens: does B always, sometimes or never follow?</li>
              <li>&ldquo;A only if B&rdquo; means if A, then B. &ldquo;Unless A, B&rdquo; means if not A, then B.</li>
              <li>Move statements freely until you rule. One ruling, one point per statement in the right bin.</li>
              <li>After the ruling, every statement shows the chain of rules that settles it.</li>
            </ul>
            <button className="eg-btn primary" onClick={() => { setShowHelp(false); try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {} }}>Play</button>
          </div>
        </div>
      )}

      {!STAGE && <div style={{ display: focusMode ? 'none' : 'block' }}><Footer /></div>}
    </div>
  );
}
