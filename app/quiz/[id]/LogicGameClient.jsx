'use client';

// Analytical-reasoning "logic game" quiz board (format: 'logic-game').
//
// Modeled on the retired LSAT Analytical Reasoning section: a single SETUP
// paragraph plus a list of RULES (the "stimulus") stays pinned on screen while
// the player answers a handful of multiple-choice questions about it. ONE clock
// runs for the whole game (no per-question timer). Scoring is pure ACCURACY:
// score = number of questions answered correctly, and the leaderboard breaks
// ties by elapsed time (faster wins). Reuses the same /api/quiz/* endpoints,
// leaderboard, share, join, and critique UI as the other boards.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Check, X, Flag, Trophy, HelpCircle, BrainCircuit, ScrollText, Clock, Swords } from 'lucide-react';
import JoinLeaderboardForm from './JoinLeaderboardForm';
import QuizStandings from './QuizStandings';
import LeaderboardSnippet from './LeaderboardSnippet';
import QuizResultModal from './QuizResultModal';
import QuizLeaderboard from './QuizLeaderboard';
import LeaderboardStrip from './LeaderboardStrip';
import { getQuiz, QUIZZES } from '@/lib/quizzes';
import { useChallengeRun, ChallengeRunOverlay } from './useChallengeRun';
import useAbandonFlush from './useAbandonFlush';
import { quizDept as deptOf, DEPT_LABEL } from '@/lib/quiz-departments';
import Grain from '../../Grain';
import Footer from '../../Footer';
import QuizNavHeader from '../../quizzes/QuizNavHeader';
import StageChrome from '../../StageChrome';
import QuizLoftFinish from './QuizLoftFinish';
import { isQuizStage, QUIZ_ACC_VARS } from '@/lib/quiz-stage';
import { useStageTheme } from '@/lib/stage-theme';
import QuizIdleActions from './QuizIdleActions';
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

function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ── Personal stats (client-side, same key scheme as the other boards) ──
function statsKey(id) { return `sot_quiz_${id}`; }
function loadStats(id) {
  if (typeof window === 'undefined') return { attempts: 0, best: 0, totalCorrect: 0 };
  try {
    return JSON.parse(localStorage.getItem(statsKey(id))) || { attempts: 0, best: 0, totalCorrect: 0 };
  } catch { return { attempts: 0, best: 0, totalCorrect: 0 }; }
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
function recordResult(id, correct) {
  const s = loadStats(id);
  const next = { attempts: s.attempts + 1, best: Math.max(s.best, correct), totalCorrect: s.totalCorrect + correct };
  try { localStorage.setItem(statsKey(id), JSON.stringify(next)); } catch {}
  return next;
}
function percentile(correct, total) {
  const frac = total ? correct / total : 0;
  return Math.round(Math.min(99, Math.max(2, Math.pow(frac, 1.35) * 100)));
}

const TICK_MS = 250;

export default function LogicGameClient({ quizId, mobile = false }) {
  const searchParams = useSearchParams();
  // THE STAGE. Same three-way switch every daily uses, keyed by this file
  // rather than by a registry key, because a quiz has no registry row and
  // the unit of rollout is the CLIENT: see lib/quiz-stage.js.
  const QSTAGE = isQuizStage('LogicGameClient', searchParams);
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

  const questions = quiz.questions || [];
  const total = questions.length;
  const setup = quiz.setup || '';
  const rules = quiz.rules || [];
  const limitSec = quiz.timeLimit || 480;
  const limitMs = limitSec * 1000;

  const [tab, setTab] = useState('play');
  const [revealed, setRevealed] = useState(false); // answer key + explanations hidden until revealed

  // ── Game state ──
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [picks, setPicks] = useState([]);      // chosen option index per question (or null)
  const [remaining, setRemaining] = useState(limitMs);
  const [lastElapsed, setLastElapsed] = useState(null);

  const [stats, setStats] = useState({ attempts: 0, best: 0, totalCorrect: 0 });
  const [board, setBoard] = useState({ plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [] });
  const [lbView, setLbView] = useState('registered');
  const [identity, setIdentity] = useState(null);
  const [eloBefore, setEloBefore] = useState(null);
  const [eloAfter, setEloAfter] = useState(null);

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
  const deadlineRef = useRef(0);
  const startRef = useRef(null);
  const endedRef = useRef(false);
  const viewedRef = useRef(false);

  const correctCount = useMemo(
    () => picks.reduce((s, p, i) => s + (p != null && p === questions[i]?.correct ? 1 : 0), 0),
    [picks, questions]
  );
  const answeredCount = picks.filter((p) => p != null).length;
  const isTopScore = phase === 'done' && board.best != null && lastElapsed != null
    && correctCount === board.best && board.topTime != null && lastElapsed <= board.topTime;

  function fetchQuizMe(setter) {
    try {
      const qs = new URLSearchParams();
      const anon = getAnonId();
      if (anon) qs.set('anonId', anon);
      let em = identity && identity.email ? identity.email : null;
      if (!em) { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (j && j.email) em = j.email; } catch (e) {} }
      if (em) qs.set('email', em);
      fetch(`/api/quiz/me?${qs.toString()}`).then((r) => r.json()).then((d) => { if (d && d.found) setter(d); }).catch(() => {});
    } catch (e) {}
  }
  function refreshBoard() {
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [] }); })
      .catch(() => {});
  }

  useEffect(() => {
    setStats(loadStats(quizId));
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) { setIdentity(id); }
    } catch {}
    refreshBoard();
    fetchQuizMe(setEloBefore);
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }) }).catch(() => {});
    }
    return () => { clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Record an in-progress game if the player leaves before finishing.
  const abandon = useAbandonFlush(() => {
    if (endedRef.current || !startRef.current) return null;
    if (phase === 'idle' || phase === 'done') return null;
    if (loadStats(quizId).attempts !== 0) return null;
    const elapsed = Math.min(limitSec, Math.round((Date.now() - startRef.current) / 1000));
    if (!elapsed) return null;
    const correct = picks.reduce((s, p, i) => s + (p != null && p === questions[i]?.correct ? 1 : 0), 0);
    let referrer = '';
    try { referrer = document.referrer ? new URL(document.referrer).host : ''; } catch (e) {}
    return { quizId, score: correct, total, correct, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: !!mobile, referrer };
  });

  function stopTimer() { clearInterval(timerRef.current); timerRef.current = null; }

  function startGame() {
    if (phase !== 'idle') return;
    endedRef.current = false;
    setPicks(new Array(total).fill(null));
    setRevealed(false);
    setRemaining(limitMs);
    startRef.current = Date.now();
    deadlineRef.current = Date.now() + limitMs;
    setPhase('playing');
    stopTimer();
    timerRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) { setRemaining(0); finishGame(true); }
      else setRemaining(left);
    }, TICK_MS);
  }

  function choose(qi, ci) {
    if (phase !== 'playing') return;
    setPicks((prev) => { const n = prev.slice(); n[qi] = ci; return n; });
  }

  function finishGame(byTimeout = false) {
    if (endedRef.current) return;
    abandon.markFlushed();
    endedRef.current = true;
    stopTimer();
    setPhase('done');
    const elapsed = startRef.current
      ? Math.min(limitSec, Math.round((Date.now() - startRef.current) / 1000))
      : limitSec;
    setLastElapsed(elapsed);
    setPicks((prev) => {
      const correct = prev.reduce((s, p, i) => s + (p != null && p === questions[i]?.correct ? 1 : 0), 0);
      const firstAttempt = loadStats(quizId).attempts === 0; // only the first play is leaderboard-eligible
      setStats(recordResult(quizId, correct));
      chRun.recordStep(correct, total, elapsed);
      if (firstAttempt) {
        let referrer = '';
        try { referrer = document.referrer ? new URL(document.referrer).host : ''; } catch (e) {}
        fetch('/api/quiz/result', {
          method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId, score: correct, total, correct, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: !!mobile, referrer }),
        })
          .then((r) => r.json())
          .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [] }); })
          .then(() => fetchQuizMe(setEloAfter))
          .catch(() => { fetchQuizMe(setEloAfter); });
      } else {
        fetchQuizMe(setEloAfter);
      }
      return prev;
    });
  }

  async function submitQuestion() {
    if (qBusy) return;
    setQBusy(true);
    try {
      await fetch('/api/complaints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: quiz.id, listTitle: `[Quiz] ${quiz.title}`, message: qMsg.trim(), name: qName.trim(), email: qEmail.trim() }),
      });
    } catch (e) {}
    setQSent(true);
    setQBusy(false);
  }

  const shareUrl = withRef(typeof window !== 'undefined' ? window.location.href : `https://mindloftdaily.com/quiz/${quiz.id}`);
  const resultMsg = phase === 'done' ? `I got ${correctCount}/${total} on "${quiz.title}". Can you beat me?` : `Can you crack this logic game? "${quiz.title}"`;
  function openShare(kind) { const u = encodeURIComponent(shareUrl); const t = encodeURIComponent(resultMsg); const url = kind === 'x' ? `https://twitter.com/intent/tweet?text=${t}&url=${u}` : kind === 'reddit' ? `https://www.reddit.com/submit?url=${u}&title=${t}` : kind === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${u}` : kind === 'whatsapp' ? `https://api.whatsapp.com/send?text=${t}%20${u}` : shareUrl; try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {} }
  function copyResult() { if (notifyShareCredit(`${resultMsg}\n${shareUrl}`)) return; try { navigator.clipboard?.writeText(`${resultMsg}\n${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {} }
  function share() {
    const text = phase === 'done' ? resultMsg : 'Can you crack this logic game?';
    if (navigator.share) navigator.share({ title: quiz.title, text, url: shareUrl }).catch(() => {});
    else navigator.clipboard?.writeText(`${text} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  }

  const bestLabel = board.best != null ? board.best : '—';
  const lbRows = lbView === 'all' ? (board.leaderboardAll || []) : board.leaderboard;
  const frac = Math.max(0, Math.min(1, remaining / limitMs));
  const lowClock = phase === 'playing' && remaining <= 60000;

  const eloDept = deptOf(quiz);
  const eloDeptLabel = DEPT_LABEL[eloDept] || 'Category';
  const eloPanel = <QuizStandings eloAfter={eloAfter} eloBefore={eloBefore} eloDept={eloDept} eloDeptLabel={eloDeptLabel} fill />;

  // ── The stimulus panel (setup + rules), pinned while playing ──
  const stimulus = (
    <div style={{ background: `var(--stg-surf2,${COLORS.paper})`, borderRadius: 12, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '18px 20px' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 10 }}>The setup</div>
      <p style={{ fontFamily: SERIF, fontSize: 15.5, lineHeight: 1.6, margin: 0, color: INK }}>{setup}</p>
      {rules.length > 0 && (
        <>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, margin: '16px 0 8px' }}>The rules</div>
          <ol style={{ margin: 0, paddingLeft: 22 }}>
            {rules.map((r, i) => (
              <li key={i} style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: INK, marginBottom: 6 }}>{r}</li>
            ))}
          </ol>
        </>
      )}
    </div>
  );

  return (
    <div className={QSTAGE ? 'stage-page' : (undefined)}
      data-stage-theme={QSTAGE ? stageTheme : undefined}
      style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', overflow: 'clip', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
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
          cat={DEPT_LABEL[deptOf(quiz)] || quiz.category || 'Quiz'}
          dateLabel={`${total} ${total === 1 ? 'question' : 'questions'}`}
          outcome={phase === 'done' ? (correctCount === total ? 'won' : correctCount > 0 ? 'part' : 'lost') : null}
          figures={phase === 'done' ? [] : [{ v: `${correctCount}/${total}`, k: 'Score' }]}
          progress={total ? correctCount / total : 0}
          quizId={quiz.id}
          scoreWord="correct"
          stripOn={phase !== 'playing'}
          panelBody={<QuizLeaderboard board={board} identity={identity} total={total} />}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '4px 38px 80px' }}>
        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');` }} />

        {/* Header */}
        <div style={{ paddingBottom: 0, marginTop: 8, ...(phase === 'done' ? { maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
          {!QSTAGE && <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0, color: INK }}>{quiz.title}</h1>}
          {!QSTAGE && tab !== 'stats' && phase !== 'playing' && <LeaderboardStrip board={board} identity={identity} onOpen={() => setTab('stats')} />}
        </div>

        <div style={{ marginTop: 24 }} />

        {/* ── PLAY ── */}
        {tab === 'play' && (
          <>
            {/* Sticky scoreboard / clock */}
            {phase !== 'idle' && phase !== 'done' && (
              <div style={{ position: 'sticky', top: 0, zIndex: 24, background: `var(--stg-surf,${COLORS.cream})`, paddingBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: `var(--stg-surf2,${COLORS.paper})`, border: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRadius: 12, padding: '14px 20px' }}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{phase === 'done' ? correctCount : answeredCount}<span style={{ fontSize: 18, color: FADED }}>/{total}</span></div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>{phase === 'done' ? 'Correct' : 'Answered'}</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRight: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '0 22px' }}>
                    <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, lineHeight: 1, color: `var(--stg-acc-ink,${COLORS.ember})` }}>{bestLabel}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} strokeWidth={2.4} style={{ color: phase === 'done' ? `var(--stg-mute,${COLORS.faded})` : (lowClock ? COLORS.rust : `var(--stg-ink,${COLORS.ink})`) }} />
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 26, lineHeight: 1, color: phase === 'done' ? `var(--stg-mute,${COLORS.faded})` : (lowClock ? COLORS.rust : `var(--stg-ink,${COLORS.ink})`) }}>{fmtTime((phase === 'done' ? (limitMs - (lastElapsed * 1000)) : remaining) / 1000)}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Left</div>
                    </div>
                  </div>
                </div>
                {phase === 'playing' && (
                  <div style={{ height: 8, background: `var(--stg-surf2,${COLORS.paper})`, borderRadius: 8, border: `1px solid var(--stg-line,${COLORS.faded}33)`, overflow: 'hidden', marginTop: 6 }}>
                    <div style={{ height: '100%', width: `${frac * 100}%`, background: lowClock ? `var(--stg-bad,${COLORS.rust})` : `var(--stg-good,${COLORS.forest})`, transition: `width ${TICK_MS}ms linear` }} />
                  </div>
                )}
              </div>
            )}

            {/* IDLE — start screen with full stimulus preview */}
            {phase === 'idle' && (
              <div>
                <div style={{ textAlign: 'center', padding: '24px 24px 26px', borderRadius: 12, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, marginBottom: 18 }}>
                  <BrainCircuit size={26} strokeWidth={2.2} style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }} />
                  <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '8px 0 6px' }}>One game. {total} questions.</h2>
                  <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: 'var(--stg-ink2,#4a4339)', maxWidth: 520, margin: '0 auto 6px' }}>
                    Read the setup and the rules, then answer {total} multiple-choice questions about the same scenario. The setup and rules stay on screen the whole time. You have {Math.floor(limitSec / 60)}:{String(limitSec % 60).padStart(2, '0')} on the clock.
                  </p>
                  <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: FADED, margin: '0 0 18px' }}>
                    Scored on accuracy. Ties on the leaderboard go to whoever finished faster.
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: FADED, maxWidth: 460, margin: '0 auto 16px' }}>{quiz.blurb}</p>
                  <QuizIdleActions onStart={startGame} quizId={quizId} onLeaderboard={() => setTab('stats')} />
                </div>
              </div>
            )}

            {/* PLAYING / DONE — stimulus + questions */}
            {phase !== 'idle' && (
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'minmax(280px, 360px) 1fr', gap: 22, alignItems: 'start', marginTop: 8 }}>
                {/* Stimulus column (sticky on desktop) */}
                <div style={{ position: mobile ? 'static' : 'sticky', top: 96 }}>
                  {stimulus}
                </div>

                {/* Questions column */}
                <div>
                  {questions.map((qq, qi) => {
                    const pick = picks[qi];
                    const correctIdx = qq.correct;
                    const reveal = phase === 'done' && revealed;
                    return (
                      <div key={qi} style={{ marginBottom: 26, paddingBottom: 22, borderBottom: qi < total - 1 ? `1px solid var(--stg-line,${COLORS.faded}22)` : 'none' }}>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 17, color: `var(--stg-acc-ink,${COLORS.ember})`, flex: 'none' }}>{qi + 1}.</span>
                          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(16px, 2.2vw, 19px)', lineHeight: 1.3 }}>{qq.q}</span>
                        </div>
                        <div style={{ display: 'grid', gap: 8, paddingLeft: 26 }}>
                          {qq.choices.map((c, ci) => {
                            const isPicked = ci === pick;
                            const isCorrect = ci === correctIdx;
                            let bg = `var(--stg-surf,${T.white})`, border = `var(--stg-line,${COLORS.faded + '55'})`, fg = `var(--stg-ink,${COLORS.ink})`, mark = null;
                            if (reveal) {
                              if (isCorrect) { bg = '#e7f3ee'; border = COLORS.forest; mark = <Check size={17} strokeWidth={3} style={{ color: COLORS.forest }} />; }
                              else if (isPicked) { bg = '#fbe9e7'; border = COLORS.rust; fg = COLORS.rust; mark = <X size={17} strokeWidth={3} style={{ color: COLORS.rust }} />; }
                              else { bg = `var(--stg-surf2,${COLORS.paper})`; border = `var(--stg-line,${COLORS.faded + '22'})`; fg = `var(--stg-mute,${COLORS.faded})`; }
                            } else if (isPicked) { bg = '#eaf0ff'; border = COLORS.ember; }
                            return (
                              <button key={ci} onClick={() => choose(qi, ci)} disabled={phase === 'done'}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 14px', borderRadius: 9, background: bg, border: `1.5px solid ${border}`, color: fg, cursor: phase === 'done' ? 'default' : 'pointer', fontFamily: SANS, fontSize: 15.5, lineHeight: 1.3, transition: 'background .12s, border-color .12s' }}>
                                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: isPicked && !reveal ? `var(--stg-acc-ink,${COLORS.ember})` : (reveal && isCorrect ? COLORS.forest : `var(--stg-mute,${COLORS.faded})`), width: 16, flex: 'none' }}>{String.fromCharCode(65 + ci)}</span>
                                <span style={{ flex: 1 }}>{c}</span>
                                <span style={{ width: 18, flex: 'none' }}>{mark}</span>
                              </button>
                            );
                          })}
                        </div>
                        {reveal && qq.note && (
                          <div style={{ marginTop: 10, marginLeft: 26, padding: '10px 14px', background: `var(--stg-surf2,${COLORS.paper})`, borderLeft: `3px solid ${pick === correctIdx ? COLORS.forest : COLORS.rust}` }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: pick === correctIdx ? COLORS.forest : COLORS.rust, marginRight: 8 }}>{pick == null ? 'Skipped' : (pick === correctIdx ? 'Correct' : 'Why')}</span>
                            <span style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: 'var(--stg-ink2,#4a4339)' }}>{qq.note}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submit / done actions */}
                  {phase === 'playing' && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                      <button onClick={() => finishGame(false)} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '0 36px', lineHeight: '50px', border: 'none', background: COLORS.ember, color: T.white, cursor: 'pointer' }}>
                        Submit answers
                      </button>
                      <span style={{ fontFamily: SANS, fontSize: 13, color: FADED, alignSelf: 'center' }}>{answeredCount} of {total} answered</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DONE — results card */}
            {phase === 'done' && (
              <QuizResultModal quiz={quiz} board={board} identity={identity} lastElapsed={lastElapsed} onRegister={() => setTab('join')}
                open={!QSTAGE}
                eyebrow={correctCount === total ? 'Perfect game' : 'Final score'}
                score={correctCount}
                total={total}
                headline={isTopScore ? 'you are the top score' : `you beat ${percentile(correctCount, total)}% of players`}
                subline={board.best != null ? (correctCount >= board.best ? 'That is the score to beat. Ties go to the fastest finisher.' : `The high score to beat is ${board.best}/${total}.`) : 'Be the first to set the pace.'}
                placement={(() => { const rows = board.leaderboardAll || []; if (identity) { const i = rows.findIndex((r) => r.username === identity.username); if (i >= 0) return i + 1; } if (lastElapsed == null || !rows.length) return null; let b = 0; for (const r of rows) { if (r.score > correctCount || (r.score === correctCount && r.timeElapsed < lastElapsed)) b++; } return b + 1; })()}
                leaderboard={<QuizLeaderboard board={board} identity={identity} total={total} />}
                standings={eloPanel}
                onPlayAgain={startGame}
                onReport={() => { setQSent(false); setQOpen(true); }}
              />
            )}
          </>
        )}

        {QSTAGE && phase === 'done' && (
          <QuizLoftFinish
            stage={QSTAGE}
            quiz={quiz}
            score={correctCount}
            total={total}
            elapsed={lastElapsed}
            board={board}
            identity={identity}
            topScore={isTopScore}
            onReplay={startGame}
            onJoin={() => setTab('join')}
          />
        )}
        {/* ── STATS ── */}
        {tab === 'stats' && (
          <div>
            <button onClick={() => setTab('play')} style={backLink}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 14 }}>Your record</div>
            {stats.attempts === 0 ? (
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: FADED }}>Play a round and your record shows up here. It stays on this device.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatBox label="Best score" value={`${stats.best}/${total}`} accent />
                <StatBox label="Your average" value={`${Math.round(stats.totalCorrect / stats.attempts)}/${total}`} />
                <StatBox label="Attempts" value={stats.attempts} />
              </div>
            )}

            <div style={{ borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, marginTop: 26, paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED }}>Leaderboard</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: FADED }}>{bestLabel} best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
              </div>
              {board.plays > 0 && (
                <div style={{ display: 'flex', marginBottom: 14, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, width: 'fit-content' }}>
                  {[['registered', 'Registered'], ['all', 'All players']].map(([k, label], idx) => {
                    const on = lbView === k;
                    return (<button key={k} onClick={() => setLbView(k)} style={{ padding: '6px 14px', background: on ? COLORS.ink : 'transparent', color: on ? T.white : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderLeft: idx === 0 ? 'none' : `1px solid var(--stg-line,${COLORS.faded}55)`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>);
                  })}
                </div>
              )}
              {lbRows.length === 0 ? (
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: FADED }}>
                  No one has posted a score yet. <button onClick={() => setTab('join')} style={{ background: 'none', border: 'none', padding: 0, color: `var(--stg-acc-ink,${COLORS.ember})`, font: 'inherit', fontStyle: 'italic', textDecoration: 'underline', cursor: 'pointer' }}>Join the leaderboard</button> and be first.
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
                        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.userKey ? <a href={`/quizzes/hub?player=${encodeURIComponent(row.userKey)}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px dotted var(--stg-line,${COLORS.faded}88)`, cursor: 'pointer' }}>{row.username}</a> : row.username}{mine ? ' (you)' : ''}{row.tryNum ? <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: FADED, marginLeft: 6 }}>{row.tryNum > 1 ? '(retried)' : '(1st Try)'}</span> : ''}</span>
                          {row.playedAt ? <span style={{ fontFamily: MONO, fontSize: 10.5, color: FADED }}>{fmtWhen(row.playedAt)}</span> : null}
                        </span>
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
            <div style={{ textAlign: 'left' }}><button onClick={() => setTab('play')} style={backLink}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button></div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: INK, maxWidth: 480, margin: '0 auto 20px' }}>{phase === 'done' ? `You got ${correctCount} of ${total}. Challenge someone to beat it.` : 'Send this logic game to someone who thinks they could have aced the LSAT.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[['x', 'X'], ['reddit', 'Reddit'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp']].map(([k, label]) => (
                <button key={k} onClick={() => openShare(k)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
            <button onClick={copyResult} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer', marginBottom: 12 }}>{copied ? 'Copied!' : 'Copy result'}</button>
            <div style={{ fontFamily: MONO, fontSize: 12, color: FADED, marginTop: 8, wordBreak: 'break-all' }}>{shareUrl}</div>
          </div>
        )}

        {/* ── JOIN ── */}
        {tab === 'join' && (
          <div><button onClick={() => setTab('play')} style={backLink}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
          <JoinLeaderboardForm identity={identity} onJoined={(id) => { setIdentity(id); setRevealed(true); setTab('play'); }} onViewLeaderboard={() => setTab('stats')} /></div>
        )}

        {quiz.source && (
          <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: FADED }}>
            Source:{' '}
            {typeof quiz.source === 'string' ? quiz.source : quiz.source.url ? <a href={quiz.source.url} target="_blank" rel="noopener noreferrer" style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }}>{quiz.source.label}</a> : quiz.source.label}
          </div>
        )}

      </div>

      {qOpen && (
        <div onClick={() => setQOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(26,22,17,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6vh 16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: `var(--stg-surf,${COLORS.cream})`, borderRadius: 10, border: `2px solid var(--stg-line2,${COLORS.ink})`, padding: 24 }}>
            {qSent ? (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>Thanks, noted.</h3>
                <p style={{ fontFamily: SANS, fontSize: 15, color: FADED, margin: '0 0 20px' }}>Your question went to the editors' desk. We read every one.</p>
                <button onClick={() => { setQOpen(false); setQSent(false); setQMsg(''); setQName(''); setQEmail(''); }} style={{ cursor: 'pointer', background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, padding: '12px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>Close</button>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>Comments? Critique?</h3>
                <p style={{ fontFamily: SANS, fontSize: 14, color: FADED, margin: '0 0 14px' }}>Spot an answer that should count, or something off about this quiz? Tell the editors.</p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input type="text" value={qName} onChange={(e) => setQName(e.target.value)} maxLength={120} placeholder="Name (optional)" style={modalField} />
                  <input type="email" value={qEmail} onChange={(e) => setQEmail(e.target.value)} maxLength={200} placeholder="Email (optional)" style={modalField} />
                </div>
                <textarea value={qMsg} onChange={(e) => setQMsg(e.target.value)} maxLength={1000} rows={4} placeholder="What's your question or comment? (optional)" style={{ ...modalField, width: '100%', resize: 'vertical', marginBottom: 16 }} />
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

const backLink = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 };
const modalField = { flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: `var(--stg-ink,${COLORS.ink})`, outline: 'none' };

function StatBox({ label, value, accent }) {
  return (
    <div style={{ background: accent ? `var(--stg-surf2,${COLORS.paper})` : `var(--stg-surf2,${T.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, lineHeight: 1, color: accent ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-ink,${COLORS.ink})` }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginTop: 8 }}>{label}</div>
    </div>
  );
}
