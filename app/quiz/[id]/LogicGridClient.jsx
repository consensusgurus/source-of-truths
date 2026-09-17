'use client';

// Country logic-grid quiz board (format: 'logic-grid').
//
// A faithful recreation of Sporcle's "Country Trivia Logic Puzzle": a 6-column
// by 5-row grid of 30 cells. Each row is one continent (hidden until the end)
// and most cells carry a trivia/logic clue. Read the clues, deduce which
// country belongs in each box, click a box and type the country. Solving every
// box is the perfect score. Reuses the same /api/quiz/* endpoints, leaderboard,
// and visual language as the other quiz boards.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Check, Flag, Trophy, HelpCircle, Globe, Swords } from 'lucide-react';
import JoinLeaderboardForm from './JoinLeaderboardForm';
import LeaderboardSnippet from './LeaderboardSnippet';
import LeaderboardStrip from './LeaderboardStrip';
import QuizResultModal from './QuizResultModal';
import QuizLeaderboard from './QuizLeaderboard';
import { similarQuizId } from '@/lib/quiz-similar';
import { getQuiz } from '@/lib/quizzes';
import { useChallengeRun, ChallengeRunOverlay } from './useChallengeRun';
import useAbandonFlush from './useAbandonFlush';
import Grain from '../../Grain';
import Footer from '../../Footer';
import QuizNavHeader from '../../quizzes/QuizNavHeader';
import StageChrome from '../../StageChrome';
import QuizLoftFinish from './QuizLoftFinish';
import { isQuizStage, QUIZ_ACC_VARS } from '@/lib/quiz-stage';
import { useStageTheme } from '@/lib/stage-theme';
import QuizPlayOverlay from './QuizPlayOverlay';
import QuizIdleActions from './QuizIdleActions';
import { isMobileDevice } from '@/lib/is-mobile';
import { LB_POPS, LB_FILTERS, pickLb, lbEmptyNote } from '@/lib/quiz-lb';
import Count from '../../Count';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '@/app/ShareCreditPop';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  forest: T.success,
  faded: T.muted,
};
const MONO = "'Manrope', system-ui, -apple-system, sans-serif";
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
// Same order-independent key match used across the quiz boards.
function deArticle(s) {
  return s.replace(/^(?:the|a|an) (?=.{2})/, '');
}
function keyHit(g, key) {
  const k = deArticle(norm(key));
  if (!k) return false;
  if (g.includes(k)) return true;
  const kt = k.split(' ');
  if (kt.length < 2) return false;
  const gt = g.split(' ');
  return kt.every((w) => gt.includes(w));
}
function anyKey(g, keys) {
  return (keys || []).some((k) => keyHit(g, k));
}

function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function ordinal(n) {
  const v = Number(n) || 0;
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1: return `${v}st`;
    case 2: return `${v}nd`;
    case 3: return `${v}rd`;
    default: return `${v}th`;
  }
}

// ── Personal stats (client-side, same key scheme as QuizClient) ──
function statsKey(id) { return `sot_quiz_${id}`; }
function loadStats(id) {
  if (typeof window === 'undefined') return { attempts: 0, best: 0, totalCorrect: 0 };
  try {
    return JSON.parse(localStorage.getItem(statsKey(id))) || { attempts: 0, best: 0, totalCorrect: 0 };
  } catch { return { attempts: 0, best: 0, totalCorrect: 0 }; }
}
function recordResult(id, score) {
  const s = loadStats(id);
  const next = { attempts: s.attempts + 1, best: Math.max(s.best, score), totalCorrect: s.totalCorrect + score };
  try { localStorage.setItem(statsKey(id), JSON.stringify(next)); } catch {}
  return next;
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
  } catch { return null; }
}
function percentile(score, total) {
  const frac = total ? score / total : 0;
  return Math.round(Math.min(99, Math.max(2, Math.pow(frac, 1.35) * 100)));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LogicGridClient({ quizId, mobile = false }) {
  const searchParams = useSearchParams();
  // THE STAGE. Same three-way switch every daily uses, keyed by this file
  // rather than by a registry key, because a quiz has no registry row and
  // the unit of rollout is the CLIENT: see lib/quiz-stage.js.
  const QSTAGE = isQuizStage('LogicGridClient', searchParams);
  const [stageTheme] = useStageTheme();
  // TEXT and FILL are separate names on purpose. Near-black TEXT is
  // invisible on this ground and has to move; a near-black FILL is a
  // perfectly good object on it and stays. One restyled COLORS would
  // conflate the two and turn every dark chip on the board pale.
  const INK = QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = QSTAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = QSTAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = QSTAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.line;
  // THE ONE QUIZ ACCENT, read as the variable the root publishes rather
  // than as a literal, so it follows the light switch. See lib/quiz-stage.js.
  const QACC = QSTAGE ? 'var(--stg-acc)' : COLORS.ember;
  const ON_ACC = QSTAGE ? 'var(--stg-onramp,#08222e)' : T.white;
  const router = useRouter();
  const quiz = useMemo(() => getQuiz(quizId), [quizId]);
  const chRun = useChallengeRun(quizId);

  if (!quiz) {
    return (
      <div className={QSTAGE ? 'stage-page' : (undefined)}
        data-stage-theme={QSTAGE ? stageTheme : undefined}
        style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
        {!QSTAGE && <Grain />}
        <div style={{ position: 'relative', zIndex: 2, padding: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: FADED }}>That quiz seems to have wandered off.</p>
          <button onClick={() => router.push('/')} style={{ marginTop: 16, background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, border: 'none', padding: '10px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>Back home</button>
        </div>
        {!QSTAGE && <Footer />}
      </div>
    );
  }

  const cells = quiz.cells || [];
  const total = cells.length;
  const cols = quiz.cols || 6;
  const rowLabels = quiz.rowLabels || [];
  const intro = quiz.intro || [];

  const [tab, setTab] = useState('play');
  const ribbonRef = useRef(null);
  const [ribScroll, setRibScroll] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ribbonRef.current;
    if (!el) return undefined;
    const update = () => { const more = el.scrollWidth - el.clientWidth; setRibScroll({ left: el.scrollLeft > 2, right: more > 2 && el.scrollLeft < more - 2 }); };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  // ── Game state ──
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [reviewing, setReviewing] = useState(false); // done: popup vs reviewing the grid
  // Mobile: dock the scoreboard + answer input to the bottom thumb zone during
  // play, lifting above the on-screen keyboard via visualViewport.
  const [kbInset, setKbInset] = useState(0);
  useEffect(() => {
    if (!(mobile && phase === 'playing')) { setKbInset(0); return undefined; }
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onVV = () => setKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    onVV();
    vv.addEventListener('resize', onVV);
    vv.addEventListener('scroll', onVV);
    return () => { vv.removeEventListener('resize', onVV); vv.removeEventListener('scroll', onVV); };
  }, [mobile, phase]);
  const dock = mobile && phase === 'playing';
  const playBarStyle = dock
    ? { position: 'fixed', left: 0, right: 0, bottom: kbInset, zIndex: 40, background: `var(--stg-surf,${COLORS.cream})`, padding: '8px 12px', paddingBottom: kbInset > 0 ? 6 : 'calc(8px + env(safe-area-inset-bottom))', borderTop: `1px solid var(--stg-line,${COLORS.faded}22)`, boxShadow: '0 -7px 18px rgba(20,22,28,0.12)' }
    : { position: 'sticky', top: 0, zIndex: 24, background: `var(--stg-surf,${COLORS.cream})`, paddingBottom: 4 };
  const [solved, setSolved] = useState(() => new Array(total).fill(false));
  const [active, setActive] = useState(null);  // index of the selected cell
  const [guess, setGuess] = useState('');
  const [time, setTime] = useState(quiz.timeLimit);
  const [hint, setHint] = useState('Press Start to read the clues and begin.');
  const [hintBad, setHintBad] = useState(false);
  const [lastElapsed, setLastElapsed] = useState(null);
  const [revealed, setRevealed] = useState(false); // after end: misses filled in

  const [stats, setStats] = useState({ attempts: 0, best: 0, totalCorrect: 0 });
  const [board, setBoard] = useState({ plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} });
  const [lbPop, setLbPop] = useState('registered');
  const [lbFilter, setLbFilter] = useState('all');
  const [identity, setIdentity] = useState(null);

  // Join form
  const [jName, setJName] = useState('');
  const [jEmail, setJEmail] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinErr, setJoinErr] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);

  const [copied, setCopied] = useState(false);

  // Critique modal
  const [qOpen, setQOpen] = useState(false);
  const [qMsg, setQMsg] = useState('');
  const [qName, setQName] = useState('');
  const [qEmail, setQEmail] = useState('');
  // A signed-in player's name + email prefill the reply fields, so a report
  // always comes back with somewhere to answer it. Still editable, still
  // optional: a guest sees empty fields exactly as before.
  useEffect(() => {
    const who = savedIdentity();
    if (who.username) setQName((v) => v || who.username);
    if (who.email) setQEmail((v) => v || who.email);
  }, []);
  const [qSent, setQSent] = useState(false);
  const [qBusy, setQBusy] = useState(false);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const endedRef = useRef(false);
  const inputRef = useRef(null);
  const viewedRef = useRef(false);

  const score = solved.filter(Boolean).length;
  const isTopScore = phase === 'done' && board.best != null && lastElapsed != null
    && score === board.best && board.topTime != null && lastElapsed <= board.topTime;

  function refreshBoard() {
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {} }); })
      .catch(() => {});
  }

  useEffect(() => {
    setStats(loadStats(quizId));
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) { setIdentity(id); setJName(id.username || ''); setJEmail(id.email || ''); }
    } catch {}
    refreshBoard();
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      }).catch(() => {});
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Record an in-progress game if the player leaves before finishing.
  const abandon = useAbandonFlush(() => {
    if (endedRef.current || !startRef.current) return null;
    if (phase === 'idle' || phase === 'done') return null;
    const elapsed = Math.min(quiz.timeLimit, Math.round((Date.now() - startRef.current) / 1000));
    if (!elapsed) return null;
    return { quizId, score: solved.filter(Boolean).length, total, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId() };
  });

  function endGame(win, solvedOverride) {
    if (endedRef.current) return;
    abandon.markFlushed();
    endedRef.current = true;
    setPhase('done');
    clearInterval(timerRef.current);
    setActive(null);
    const finalSolved = solvedOverride || solved;
    const finalScore = finalSolved.filter(Boolean).length;
    const elapsed = startRef.current ? Math.min(quiz.timeLimit, Math.round((Date.now() - startRef.current) / 1000)) : quiz.timeLimit;
    setLastElapsed(elapsed);
    chRun.recordStep(finalScore, total, elapsed);
    setStats(recordResult(quizId, finalScore));
    setRevealed(true);
    setHint(win ? `Solved — all ${total} boxes in ${fmtTime(elapsed)}!` : `Time's up. You placed ${finalScore}/${total}.`);
    setHintBad(!win);
    fetch('/api/quiz/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, score: finalScore, total, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
    })
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {} }); })
      .catch(() => {});
  }

  function startGame(force) {
    setReviewing(false);
    if (!force && phase !== 'idle') return;
    endedRef.current = false;
    setPhase('playing');
    startRef.current = Date.now();
    setHint('Read the clues, then click a box and type the country.');
    setHintBad(false);
    // Select the first cell that carries a clue, so the input bar has context.
    const firstClued = cells.findIndex((c) => c.clue);
    setActive(firstClued >= 0 ? firstClued : 0);
    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) { clearInterval(timerRef.current); endGame(false); return 0; }
        return t - 1;
      });
    }, 1000);
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 30);
  }

  function selectCell(i) {
    if (phase !== 'playing' || solved[i]) return;
    setActive(i);
    if (inputRef.current) inputRef.current.focus();
  }

  function submitGuess(raw) {
    if (phase !== 'playing' || active == null) return;
    const g = norm(raw);
    if (!g) return;
    const cell = cells[active];
    if (anyKey(g, cell.keys) && !anyKey(g, cell.anti)) {
      const next = solved.slice();
      next[active] = true;
      setSolved(next);
      setGuess('');
      setHint(`Correct — ${cell.id} is ${cell.t}.`);
      setHintBad(false);
      if (next.every(Boolean)) { endGame(true, next); return; }
      // Advance to the next unsolved cell (prefer one with a clue).
      const order = [...cells.keys()].filter((j) => !next[j]);
      const nextClued = order.find((j) => cells[j].clue);
      setActive(nextClued != null ? nextClued : order[0]);
    } else {
      setHint(`Not the country for ${cell.id}. Try another box or guess.`);
      setHintBad(true);
    }
  }
  function onKey(e) {
    if (e.key !== 'Enter') return;
    submitGuess(e.target.value);
  }


  async function submitQuestion() {
    if (qBusy) return;
    setQBusy(true);
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: quiz.id, listTitle: `[Quiz] ${quiz.title}`, message: qMsg.trim(), name: qName.trim(), email: qEmail.trim() }),
      });
    } catch (e) { /* swallow */ }
    setQSent(true);
    setQBusy(false);
  }

  const clock = fmtTime(time);
  const shareUrl = withRef(typeof window !== 'undefined' ? window.location.href : `https://mindloftdaily.com/quiz/${quiz.id}`);
  const resultMsg = phase === 'done' ? `I scored ${score}/${total} on "${quiz.title}". Can you beat me?` : `Can you beat my score on "${quiz.title}"?`;
  const promoImgUrl = `https://mindloftdaily.com/quiz/${quiz.id}/share-image`;
  const resultImgUrl = `https://mindloftdaily.com/quiz/${quiz.id}/result-image?s=${score}&t=${total}&p=0`;
  function openShare(kind) { const u = encodeURIComponent(shareUrl); const t = encodeURIComponent(resultMsg); const url = kind === 'x' ? `https://twitter.com/intent/tweet?text=${t}&url=${u}` : kind === 'reddit' ? `https://www.reddit.com/submit?url=${u}&title=${t}` : kind === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${u}` : kind === 'whatsapp' ? `https://api.whatsapp.com/send?text=${t}%20${u}` : shareUrl; try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {} }
  function copyResult() { if (notifyShareCredit(`${resultMsg}\n${shareUrl}`)) return; try { navigator.clipboard?.writeText(`${resultMsg}\n${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {} }
  async function downloadPromoImage() { try { const r = await fetch(promoImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  async function downloadResultImage() { try { const r = await fetch(resultImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}-score.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  function share() {
    const pct = total ? Math.round((score / total) * 100) : 0;
    const text = 'Can you beat my score?';
    if (navigator.share) {
      navigator.share({ title: quiz.title, text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    }
  }

  function chip(key, label, icon) {
    const isActive = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        style={{ flex: '1 0 auto', justifyContent: 'center', background: isActive ? `var(--stg-surf2,${T.white})` : 'transparent', color: isActive ? `var(--stg-ink,${COLORS.ink})` : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderRadius: 7, padding: '9px 14px', whiteSpace: 'nowrap', fontFamily: SANS, fontSize: 13, fontWeight: isActive ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: isActive ? '0 1px 2px rgba(20,22,28,0.06)' : 'none' }}
      >
        {icon}
        {label}
      </button>
    );
  }

  const bestLabel = board.best != null ? board.best : '—';
  const lbRows = pickLb(board, lbPop, lbFilter);
  const activeCell = active != null ? cells[active] : null;
  // Group cells into rows for the grid (cells are stored in row-major order).
  const rows = [];
  for (let r = 0; r < total / cols; r++) rows.push(cells.slice(r * cols, r * cols + cols));

  // Mobile fullscreen play popup: open while the game is actively running.
  // On 'done' it closes and the QuizResultModal popup takes over; pre-game
  // ('idle') the board renders inline as before.
  const mPlayOverlay = mobile === true && phase === 'playing';

  return (
    <div className={QSTAGE ? 'stage-page' : (undefined)}
      data-stage-theme={QSTAGE ? stageTheme : undefined}
      style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', overflow: 'clip', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
      {!QSTAGE && <Grain />}
      <ChallengeRunOverlay run={chRun} />
      {!QSTAGE && <div style={{ position: 'relative', zIndex: 3 }}><QuizNavHeader /></div>}
      {/* THE CAP. Comments live above the element because a JSX comment
          between attributes parses in esbuild and not in SWC, which is the
          compiler that matters. See scripts/patch-quiz-stage-cap.mjs for
          why the score and the maximum are read off this client's own end
          card rather than inferred from the names of its variables. */}
      {QSTAGE && (
        <StageChrome
          name={quiz.title}
          cat={quiz.category || 'Quiz'}
          dateLabel={`${total} ${total === 1 ? 'cell' : 'cells'}`}
          outcome={phase === 'done' ? (score === total ? 'won' : score > 0 ? 'part' : 'lost') : null}
          figures={phase === 'done' ? [] : [{ v: `${score}/${total}`, k: 'Score' }]}
          progress={total ? score / total : 0}
          quizId={quiz.id}
          scoreWord="correct"
          stripOn={phase !== 'playing'}
          panelBody={<QuizLeaderboard board={board} identity={identity} total={total} />}
        />
      )}
      <div className="qzf-w" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '4px 38px 80px' }}><style dangerouslySetInnerHTML={{ __html: `@media(max-width:560px){.qzf-w{padding-left:14px !important;padding-right:14px !important;}}` }} /><div className="qzf-line" aria-hidden="true" />

        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');` }} />

        {/* Header */}
        <div style={{ paddingBottom: 0, marginTop: 8, ...(phase === 'done' ? { maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(16px, 4vw, 28px)' }}>
            {!QSTAGE && <h1 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(30px, 5vw, 50px)', lineHeight: 1.02, letterSpacing: '-0.02em', margin: 0, color: INK, fontVariationSettings: '"SOFT" 100' }}>{quiz.title}</h1>}
            <div style={{ flex: 1, minWidth: 120, marginBottom: 6 }}>
              <div style={{ borderBottom: `1px solid var(--stg-line,${COLORS.ink})`, marginBottom: 4 }} />
              <div style={{ borderBottom: `2px solid var(--stg-acc,${COLORS.ember})` }} />
            </div>
          </div>
          {!QSTAGE && tab !== 'stats' && phase !== 'playing' && <LeaderboardStrip board={board} identity={identity} onOpen={() => setTab('stats')} />}
        </div>

        {/* Ribbon */}
        <div style={{ marginTop: 18 }}>
          <div style={{ position: 'relative' }}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes qzCueR{0%,100%{transform:translate(0,-50%);}50%{transform:translate(3px,-50%);}}@keyframes qzCueL{0%,100%{transform:translate(0,-50%);}50%{transform:translate(-3px,-50%);}}.qz-cue{position:absolute;top:50%;z-index:3;display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${COLORS.ember};color:var(--white);box-shadow:0 1px 4px rgba(26,22,17,0.45);pointer-events:none;font-size:15px;line-height:1;}.qz-cue-r{right:10px;animation:qzCueR 1.4s ease-in-out infinite;}.qz-cue-l{left:10px;animation:qzCueL 1.4s ease-in-out infinite;}@media(min-width:760px){.qz-cue{display:none;}}.qz-ribbon{scrollbar-width:none;-ms-overflow-style:none;}.qz-ribbon::-webkit-scrollbar{display:none;}` }} />
            <div ref={ribbonRef} className="qz-ribbon" style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'nowrap', overflowX: 'auto', background: `var(--stg-surf2,${T.paper})`, borderRadius: 10, padding: 4, gap: 6 }}>
            {chip('play', 'Play')}
            {phase !== 'playing' && chip('stats', 'Leaderboard')}
            {chip('join', 'Sign-up', <Trophy size={12} strokeWidth={2.5} />)}
            {phase !== 'playing' && (<a href={`/duel/new?quiz=${encodeURIComponent(quizId)}`} style={{ flex: '1 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${T.white})`, borderRadius: 10, padding: '9px 14px', whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, textDecoration: 'none' }}><Swords size={12} strokeWidth={2.5} /> Challenge Someone</a>)}
            <button
              onClick={() => { setQSent(false); setQOpen(true); }}
              style={{ flex: '1 0 auto', justifyContent: 'center', background: 'transparent', color: FADED, border: 'none', borderRadius: 7, padding: '9px 14px', whiteSpace: 'nowrap', fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <HelpCircle size={12} strokeWidth={2.5} />
              Error(s)?
            </button>
            </div>
            {ribScroll.left && <span aria-hidden="true" className="qz-cue qz-cue-l">&#8249;</span>}
            {ribScroll.right && <span aria-hidden="true" className="qz-cue qz-cue-r">&#8250;</span>}
          </div>
        </div>

        <div style={{ marginTop: 24 }} />

        {/* ── PLAY ── */}
        {tab === 'play' && (
          <QuizPlayOverlay open={mPlayOverlay} stage={QSTAGE}>
            {/* Freeze the score/time bar AND the answer input together at the top
                (44 = ribbon height), mirroring the name-them-all board, so the answer
                box is always reachable while the clue grid scrolls underneath. */}
            <div style={phase === 'done' ? { display: 'none' } : playBarStyle}>
            {/* Scoreboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', alignItems: 'center', background: `var(--stg-surf2,${COLORS.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '16px 8px', marginBottom: 0 }}>
              <div style={{ textAlign: 'center', padding: '0 8px' }}>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, lineHeight: 1 }}>{score}<span style={{ fontSize: 20, color: FADED }}>/{total}</span></div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Boxes placed</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 8px', borderLeft: `1px solid var(--stg-line,${COLORS.faded}33)` }}>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, lineHeight: 1, color: `var(--stg-acc-ink,${COLORS.ember})` }}>{bestLabel}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 8px', borderLeft: `1px solid var(--stg-line,${COLORS.faded}33)` }}>
                <div style={{ fontFamily: MONO, fontSize: 24, color: time <= 30 && phase === 'playing' ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-ink,${COLORS.ink})` }}>{clock}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Time left</div>
              </div>
            </div>
            {/* Input bar + hint, frozen with the scoreboard so the answer box is always reachable while the grid scrolls. */}
            {phase !== 'idle' && (
              <>
                {/* Input bar — types into the selected cell */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'stretch' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, minHeight: 14 }}>
                      {activeCell ? `Box ${activeCell.id}` : phase === 'done' ? 'Game over' : 'Pick a box'}
                    </div>
                    <input
                      ref={inputRef}
                      value={guess}
                      disabled={phase !== 'playing'}
                      onChange={(e) => setGuess(e.target.value)}
                      onKeyDown={onKey}
                      placeholder={phase === 'playing' ? (activeCell ? `Type the country for ${activeCell.id}, then Enter…` : 'Click a box to select it…') : 'Game over'}
                      autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                      style={{ fontFamily: SANS, fontSize: 17, padding: '14px 16px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: phase !== 'playing' ? `var(--stg-surf2,${COLORS.paper})` : `var(--stg-surf2,${T.paper})`, color: INK, opacity: phase !== 'playing' ? 0.5 : 1 }}
                    />
                  </div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 12, minHeight: 18, marginBottom: 16, color: hintBad ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-mute,${COLORS.faded})` }}>{hint}</div>
              </>
            )}
            </div>

            {/* IDLE — start screen with the rules */}
            {phase === 'idle' && (
              <div style={{ textAlign: 'center', padding: '26px 24px 30px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})` }}>
                <Globe size={26} strokeWidth={2.2} style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }} />
                <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '8px 0 6px' }}>Trivia meets logic.</h2>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: 'var(--stg-ink2,#4a4339)', maxWidth: 500, margin: '0 auto 14px' }}>
                  Thirty boxes, one country in each. Most boxes carry a clue; the rest you deduce. Click a box, read its clue, and type the country. Every box is solvable from the clues alone, no guessing required.
                </p>
                {intro.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: '0 auto 18px', padding: 0, maxWidth: 520, textAlign: 'left' }}>
                    {intro.map((line, i) => (
                      <li key={i} style={{ fontFamily: MONO, fontSize: 12, lineHeight: 1.5, color: FADED, paddingLeft: 16, position: 'relative', marginBottom: 6 }}>
                        <span style={{ position: 'absolute', left: 0, color: `var(--stg-acc-ink,${COLORS.ember})` }}>›</span>{line}
                      </li>
                    ))}
                  </ul>
                )}
                <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: FADED, margin: '0 0 20px' }}>
                  {fmtTime(quiz.timeLimit)} on the clock.
                </p>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: FADED, maxWidth: 460, margin: '0 auto 16px' }}>{quiz.blurb}</p>
                <QuizIdleActions onStart={startGame} quizId={quizId} onLeaderboard={() => setTab('stats')} />
              </div>
            )}

            {/* PLAYING / DONE — the clue grid (the input bar is frozen above with the scoreboard) */}
            {phase !== 'idle' && (
              <>
                {/* The grid */}
                <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                  <div style={{ minWidth: 620 }}>
                    {rows.map((rowCells, r) => (
                      <div key={r} style={{ display: 'grid', gridTemplateColumns: `40px repeat(${cols}, 1fr)`, gap: 6, marginBottom: 6 }}>
                        {/* Row label gutter — continent revealed at the end */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, padding: '4px 2px' }}>
                          <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{r + 1}</span>
                          {revealed && rowLabels[r] && (
                            <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.02em', textTransform: 'uppercase', color: COLORS.cream, opacity: 0.8, marginTop: 3, textAlign: 'center', lineHeight: 1.1 }}>{rowLabels[r]}</span>
                          )}
                        </div>
                        {rowCells.map((cell) => {
                          const i = cells.indexOf(cell);
                          const isSolved = solved[i];
                          const isActive = i === active && phase === 'playing';
                          const isMiss = phase === 'done' && !isSolved;
                          const bg = isSolved ? '#eef3e6' : isMiss ? '#f6ead9' : isActive ? T.white : COLORS.paper;
                          const bdr = isSolved ? COLORS.forest : isMiss ? COLORS.rust : isActive ? COLORS.ember : COLORS.faded + '33';
                          return (
                            <button
                              key={cell.id}
                              onClick={() => selectCell(i)}
                              disabled={phase !== 'playing' || isSolved}
                              style={{ position: 'relative', textAlign: 'left', minHeight: 96, padding: '7px 8px 8px', background: bg, borderRadius: 10, border: `1.5px solid ${bdr}`, boxShadow: isActive ? `inset 3px 0 0 ${COLORS.ember}` : 'none', cursor: phase === 'playing' && !isSolved ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: `var(--stg-acc-ink,${COLORS.ember})` }}>{cell.id}</span>
                                {isSolved && <Check size={13} strokeWidth={3} style={{ color: COLORS.forest }} />}
                              </div>
                              {(isSolved || isMiss) && (
                                <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 14, lineHeight: 1.1, color: isMiss ? COLORS.rust : `var(--stg-ink,${COLORS.ink})` }}>{cell.t}</span>
                              )}
                              {cell.clue ? (
                                <span style={{ fontFamily: SANS, fontSize: 11, lineHeight: 1.25, color: isSolved || isMiss ? `var(--stg-mute,${COLORS.faded})` : `var(--stg-mute,${T.muted})` }}>{cell.clue}</span>
                              ) : (
                                !isSolved && !isMiss && <span style={{ fontFamily: MONO, fontSize: 10, fontStyle: 'italic', color: FADED, opacity: 0.7 }}>no clue — deduce it</span>
                              )}
                              {isMiss && <span style={{ position: 'absolute', bottom: 6, right: 8, fontFamily: MONO, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.rust, fontWeight: 700 }}>Missed</span>}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DONE — results popup (the solved grid stays behind it) */}
                {phase === 'done' && (
                  <>
                  <QuizResultModal quiz={quiz} board={board} identity={identity} lastElapsed={lastElapsed} onRegister={() => setTab('join')}
                open={!QSTAGE && (!reviewing)}
                onClose={() => setReviewing(true)}
                eyebrow={score === total ? 'Grid solved' : time <= 0 ? "Time's up" : 'Gave up'}
                score={score}
                total={total}
                headline={isTopScore ? 'You are the top score' : `You beat ${percentile(score, total)}% of players`}
                subline={board.best != null ? (score >= board.best ? `That matches the high score of ${board.best}.` : `The high score to beat is ${board.best}.`) : 'Be the first to set the pace.'}
                leaderboard={<QuizLeaderboard board={board} identity={identity} total={total} />}
                placement={(() => { const rows = board.leaderboardAll || []; if (identity) { const i = rows.findIndex((r) => r.username === identity.username); if (i >= 0) return i + 1; } if (lastElapsed == null || !rows.length) return null; let b = 0; for (const r of rows) { if (r.score > score || (r.score === score && r.timeElapsed < lastElapsed)) b++; } return b + 1; })()}
                standings={null}
                onPlayAgain={() => { setSolved(new Array(total).fill(false)); setActive(null); setGuess(''); setTime(quiz.timeLimit); setRevealed(false); endedRef.current = false; setHintBad(false); startGame(true); }}
                onPlaySimilar={() => { const sid = similarQuizId(quiz); if (sid) router.push(`/quiz/${sid}`); }}
                onLeaderboard={() => setTab('stats')}
                onShare={() => setTab('share')}
                onReport={() => { setQSent(false); setQOpen(true); }}
              />
                  </>
                )}

                {/* Give up */}
                {phase === 'playing' && (
                  <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={() => endGame(false)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 26px', border: 'none', background: COLORS.ember, color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Flag size={14} strokeWidth={2.5} color={T.white} /> Give up
                    </button>
                    <button onClick={() => setTab('stats')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, padding: '12px 26px', border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Trophy size={14} strokeWidth={2.5} /> Leaderboard
                    </button>
                  </div>
                )}
              </>
            )}
          {dock && <div aria-hidden="true" style={{ height: 'calc(170px + env(safe-area-inset-bottom))' }} />}
          </QuizPlayOverlay>
        )}

        {QSTAGE && phase === 'done' && (
          <QuizLoftFinish
            stage={QSTAGE}
            quiz={quiz}
            score={score}
            total={total}
            elapsed={lastElapsed}
            board={board}
            identity={identity}
            topScore={isTopScore}
            onReplay={() => { setSolved(new Array(total).fill(false)); setActive(null); setGuess(''); setTime(quiz.timeLimit); setRevealed(false); endedRef.current = false; setHintBad(false); startGame(true); }}
            onJoin={() => setTab('join')}
          />
        )}
        {/* ── STATS & LEADERBOARD ── */}
        {tab === 'stats' && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 14 }}>Your record</div>
            {stats.attempts === 0 ? (
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: FADED }}>Play a round and your record shows up here. Join the leaderboard to keep it, no email needed.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatBox label="Best score" value={`${stats.best}/${total}`} accent />
                <StatBox label="Your average" value={`${Math.round(stats.totalCorrect / stats.attempts)}`} />
                <StatBox label="Attempts" value={stats.attempts} />
              </div>
            )}

            <div style={{ borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, marginTop: 26, paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED }}>Leaderboard</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: FADED }}>{bestLabel} best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
              </div>

              {board.plays > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, width: 'fit-content' }}>
                  <div style={{ display: 'flex', borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, width: 'fit-content' }}>
                    {LB_POPS.map(([k, label], idx) => {
                      const on = lbPop === k;
                      return (
                        <button key={k} onClick={() => setLbPop(k)} style={{ padding: '6px 14px', background: on ? COLORS.ink : 'transparent', color: on ? T.white : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderLeft: idx === 0 ? 'none' : `1px solid var(--stg-line,${COLORS.faded}55)`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, width: 'fit-content' }}>
                    {LB_FILTERS.map(([k, label], idx) => {
                      const on = lbFilter === k;
                      return (
                        <button key={k} onClick={() => setLbFilter(k)} style={{ padding: '6px 14px', background: on ? COLORS.ink : 'transparent', color: on ? T.white : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderLeft: idx === 0 ? 'none' : `1px solid var(--stg-line,${COLORS.faded}55)`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {lbRows.length === 0 ? (
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: FADED }}>
                  {lbEmptyNote(lbFilter) || <>No one has posted a score yet. <button onClick={() => setTab('join')} style={{ background: 'none', border: 'none', padding: 0, color: `var(--stg-acc-ink,${COLORS.ember})`, font: 'inherit', fontStyle: 'italic', textDecoration: 'underline', cursor: 'pointer' }}>Join the leaderboard</button> and be first.</>}
                </p>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 76px 64px', gap: 8, padding: '0 14px 8px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>
                    <span>#</span><span>Username</span><span style={{ textAlign: 'right' }}>Score</span><span style={{ textAlign: 'right' }}>Time</span>
                  </div>
                  {lbRows.map((row, i) => {
                    const mine = identity && row.username === identity.username;
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 76px 64px', gap: 8, alignItems: 'center', padding: '11px 14px', marginBottom: 6, background: mine ? `var(--stg-acc-tint,${T.white})` : `var(--stg-surf,${COLORS.paper})`, borderRadius: 10, border: `1px solid ${mine ? `var(--stg-acc,${COLORS.ember})` : `var(--stg-line,${COLORS.faded + '22'})`}` }}>
                        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 18, color: i < 3 ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-mute,${COLORS.faded})` }}>{i + 1}</span>
                        <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.username}{mine ? ' (you)' : ''}{row.tryNum ? <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: FADED, marginLeft: 6 }}>{row.tryNum > 1 ? '(retried)' : '(1st Try)'}</span> : ''}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, textAlign: 'right' }}>{row.score}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, textAlign: 'right', color: FADED }}>{fmtTime(row.timeElapsed)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SHARE ── */}
        {tab === 'share' && (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: INK, maxWidth: 480, margin: '0 auto 20px' }}>{phase === 'done' ? `You placed ${score} of ${total}. Challenge someone to solve the grid.` : 'Send this puzzle to someone who thinks they know their countries.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[['x', 'X'], ['reddit', 'Reddit'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp']].map(([k, label]) => (
                <button key={k} onClick={() => openShare(k)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              <button onClick={copyResult} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Copy result</button>
              <button onClick={downloadPromoImage} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Save quiz image</button>
              {phase === 'done' && (
                <button onClick={downloadResultImage} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Download image</button>
              )}
            </div>
            <a href={`/duel/new?quiz=${encodeURIComponent(quizId)}`} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 28px', lineHeight: '46px', border: 'none', borderRadius: 10, background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Swords size={14} strokeWidth={2.5} /> Challenge Someone
            </a>
            <div style={{ fontFamily: MONO, fontSize: 12, color: FADED, marginTop: 16, wordBreak: 'break-all' }}>{shareUrl}</div>
          </div>
        )}

        {/* ── JOIN ── */}
        {tab === 'join' && (
          <JoinLeaderboardForm identity={identity} onJoined={(id) => { setIdentity(id); refreshBoard(); }} onViewLeaderboard={() => setTab('stats')} />
        )}

        {quiz.source && (
          <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: FADED }}>
            Source:{' '}
            {typeof quiz.source === 'string'
              ? quiz.source
              : quiz.source.url
                ? <a href={quiz.source.url} target="_blank" rel="noopener noreferrer" style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }}>{quiz.source.label}</a>
                : quiz.source.label}
          </div>
        )}

      </div>

      {qOpen && (
        <div
          onClick={() => setQOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(26,22,17,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6vh 16px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: `var(--stg-surf,${COLORS.cream})`, borderRadius: 10, border: `2px solid var(--stg-line2,${COLORS.ink})`, padding: 24 }}>
            {qSent ? (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>Thanks, noted.</h3>
                <p style={{ fontFamily: SANS, fontSize: 15, color: FADED, margin: '0 0 20px' }}>
                  Your question went to the editors' desk. We read every one.
                </p>
                <button
                  onClick={() => { setQOpen(false); setQSent(false); setQMsg(''); setQName(''); setQEmail(''); }}
                  style={{ cursor: 'pointer', background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, padding: '12px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>Comments? Critique?</h3>
                <p style={{ fontFamily: SANS, fontSize: 14, color: FADED, margin: '0 0 14px' }}>
                  Spot an answer that should count, or something off about this quiz? Tell the editors.
                </p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input type="text" value={qName} onChange={(e) => setQName(e.target.value)} maxLength={120} placeholder="Name (optional)" style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none' }} />
                  <input type="email" value={qEmail} onChange={(e) => setQEmail(e.target.value)} maxLength={200} placeholder="Email (optional)" style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none' }} />
                </div>
                <textarea value={qMsg} onChange={(e) => setQMsg(e.target.value)} maxLength={1000} rows={4} placeholder="What's your question or comment? (optional)" style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none', resize: 'vertical', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setQOpen(false)} style={{ cursor: 'pointer', background: 'transparent', color: INK, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, padding: '10px 18px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Cancel</button>
                  <button onClick={submitQuestion} disabled={qBusy} style={{ cursor: 'pointer', background: COLORS.ember, color: T.white, borderRadius: 10, border: `1.5px solid var(--stg-acc,${COLORS.ember})`, padding: '10px 18px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: qBusy ? 0.6 : 1 }}>{qBusy ? 'Sending…' : 'Send to editors'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!QSTAGE && <Footer />}
    </div>
  );
}

const labelStyle = { display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginBottom: 6 };
const fieldStyle = { width: '100%', fontFamily: SANS, fontSize: 16, padding: '12px 14px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${T.white})`, color: `var(--stg-ink,${COLORS.ink})` };

function StatBox({ label, value, accent }) {
  return (
    <div style={{ background: accent ? `var(--stg-surf2,${COLORS.paper})` : `var(--stg-surf2,${T.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, lineHeight: 1, color: accent ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-ink,${COLORS.ink})` }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginTop: 8 }}>{label}</div>
    </div>
  );
}
