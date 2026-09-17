'use client';

// "Which Is Closer?" board (format: 'closer').
//
// A clue location is shown, plus two option locations. The player picks which
// of the two options sits geographically CLOSER to the clue (great-circle
// distance). Every round reveals the real mileage for both options. Unlike the
// higher-lower survival board, this is a fixed run of N rounds (default 15) —
// one wrong call costs a point but never ends the game. Score = correct calls
// out of N. Round order and which option shows on the left are randomized every
// play. Reuses the same /api/quiz/* endpoints, leaderboard, challenge-run
// support, and visual language as the other boards.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Check, X, Flag, Trophy, MapPin, Navigation, Swords, Heart } from 'lucide-react';
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
import { SITE_URL } from '@/lib/site';

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
function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Great-circle distance in miles between two {lat, lon} points.
function haversineMi(p, q) {
  const R = 3958.7613;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(q.lat - p.lat);
  const dLon = toRad(q.lon - p.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(q.lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
function fmtMi(mi) {
  return `${Math.round(mi).toLocaleString('en-US')} mi`;
}

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
function recordResult(id, score) {
  const s = loadStats(id);
  const next = { attempts: s.attempts + 1, best: Math.max(s.best, score), totalCorrect: s.totalCorrect + score };
  try { localStorage.setItem(statsKey(id), JSON.stringify(next)); } catch {}
  return next;
}
function percentile(score, max) {
  const frac = max ? score / max : 0;
  return Math.round(Math.min(99, Math.max(2, Math.pow(frac, 1.15) * 100)));
}

export default function CloserBoard({ quizId, mobile = false }) {
  const searchParams = useSearchParams();
  // THE STAGE. Same three-way switch every daily uses, keyed by this file
  // rather than by a registry key, because a quiz has no registry row and
  // the unit of rollout is the CLIENT: see lib/quiz-stage.js.
  const QSTAGE = isQuizStage('CloserBoard', searchParams);
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

  const rounds = quiz.rounds || [];
  const total = rounds.length;       // fixed run of N rounds
  const maxScore = total;            // one point per round

  const [tab, setTab] = useState('play');

  // ── Game state ──
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [plan, setPlan] = useState([]);       // [{roundIdx, swap}] in shuffled order
  const [pos, setPos] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [reveal, setReveal] = useState(null);  // { pick:'left'|'right', ok, dLeft, dRight }
  const [elapsed, setElapsed] = useState(0);
  const [lastElapsed, setLastElapsed] = useState(null);
  const [score, setScore] = useState(0);

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
  const revealTimer = useRef(null);
  const startRef = useRef(null);
  const endedRef = useRef(false);
  const viewedRef = useRef(false);

  // Current round, resolved through the per-play side flip.
  const cur = phase === 'playing' && plan.length && pos < total ? plan[pos] : null;
  const round = cur ? rounds[cur.roundIdx] : null;
  const clue = round ? round.clue : null;
  const left = round ? (cur.swap ? round.b : round.a) : null;
  const right = round ? (cur.swap ? round.a : round.b) : null;

  const isTopScore = phase === 'done' && board.best != null && lastElapsed != null
    && score === board.best && board.topTime != null && lastElapsed <= board.topTime;

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
    return () => { clearInterval(timerRef.current); clearTimeout(revealTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const abandon = useAbandonFlush(() => {
    if (endedRef.current || !startRef.current) return null;
    if (phase === 'idle' || phase === 'done') return null;
    if (loadStats(quizId).attempts !== 0) return null;
    const el = Math.round((Date.now() - startRef.current) / 1000);
    if (!el) return null;
    return { quizId, score, total: maxScore, correct: score, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId() };
  });

  function buildPlan() {
    return shuffle(total).map((roundIdx) => ({ roundIdx, swap: Math.random() < 0.5 }));
  }

  function startGame() {
    if (phase === 'playing') return;
    endedRef.current = false;
    setPlan(buildPlan());
    setPos(0);
    setScore(0);
    setRevealing(false);
    setReveal(null);
    setElapsed(0);
    setPhase('playing');
    startRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0);
    }, 1000);
  }

  function finishGame(finalScore) {
    if (endedRef.current) return;
    abandon.markFlushed();
    endedRef.current = true;
    clearInterval(timerRef.current);
    const el = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;
    setLastElapsed(el);
    setScore(finalScore);
    setPhase('done');
    const firstAttempt = loadStats(quizId).attempts === 0;
    setStats(recordResult(quizId, finalScore));
    chRun.recordStep(finalScore, maxScore, el);
    if (firstAttempt) {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, score: finalScore, total: maxScore, correct: finalScore, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId() }),
      })
        .then((r) => r.json())
        .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [] }); })
        .then(() => fetchQuizMe(setEloAfter))
        .catch(() => { fetchQuizMe(setEloAfter); });
    } else {
      fetchQuizMe(setEloAfter);
    }
  }

  function guess(pick) {
    if (phase !== 'playing' || revealing || !round) return;
    const dLeft = haversineMi(clue, left);
    const dRight = haversineMi(clue, right);
    // Tie (identical distance) counts in the player's favor.
    const correctSide = dLeft === dRight ? pick : (dLeft < dRight ? 'left' : 'right');
    const ok = pick === correctSide;
    setReveal({ pick, ok, dLeft, dRight });
    setRevealing(true);
    if (ok) setScore((s) => s + 1);
    clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      if (pos + 1 >= total) {
        finishGame(ok ? score + 1 : score);
      } else {
        setPos(pos + 1);
        setRevealing(false);
        setReveal(null);
      }
    }, 1150);
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

  const shareUrl = withRef(typeof window !== 'undefined' ? window.location.href : `${SITE_URL}/quiz/${quiz.id}`);
  const resultMsg = phase === 'done' ? `I scored ${score}/${maxScore} on "${quiz.title}". Can you beat me?` : `Can you call it on "${quiz.title}"?`;
  const promoImgUrl = `${SITE_URL}/quiz/${quiz.id}/share-image`;
  const resultImgUrl = `${SITE_URL}/quiz/${quiz.id}/result-image?s=${score}&t=${maxScore}&p=0`;
  function openShare(kind) { const u = encodeURIComponent(shareUrl); const t = encodeURIComponent(resultMsg); const url = kind === 'x' ? `https://twitter.com/intent/tweet?text=${t}&url=${u}` : kind === 'reddit' ? `https://www.reddit.com/submit?url=${u}&title=${t}` : kind === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${u}` : kind === 'whatsapp' ? `https://api.whatsapp.com/send?text=${t}%20${u}` : shareUrl; try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {} }
  function copyResult() { if (notifyShareCredit(`${resultMsg}\n${shareUrl}`)) return; try { navigator.clipboard?.writeText(`${resultMsg}\n${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {} }
  async function downloadPromoImage() { try { const r = await fetch(promoImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  async function downloadResultImage() { try { const r = await fetch(resultImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}-score.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  function share() {
    const text = resultMsg;
    if (navigator.share) { navigator.share({ title: quiz.title, text, url: shareUrl }).catch(() => {}); }
    else { navigator.clipboard?.writeText(`${text} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }
  }

  const bestLabel = board.best != null ? board.best : '—';
  const lbRows = lbView === 'all' ? (board.leaderboardAll || []) : board.leaderboard;
  const perfect = phase === 'done' && score === maxScore;

  const eloDept = deptOf(quiz);
  const eloDeptLabel = DEPT_LABEL[eloDept] || 'Category';
  const eloPanel = <QuizStandings eloAfter={eloAfter} eloBefore={eloBefore} eloDept={eloDept} eloDeptLabel={eloDeptLabel} fill />;

  function OptionCard({ opt, side }) {
    const isPick = reveal && reveal.pick === side;
    const dist = reveal ? (side === 'left' ? reveal.dLeft : reveal.dRight) : null;
    const otherDist = reveal ? (side === 'left' ? reveal.dRight : reveal.dLeft) : null;
    const isCloser = reveal ? (dist <= otherDist) : false;
    let border = `var(--stg-line2,${COLORS.ink})`, bg = `var(--stg-surf,${T.white})`, badge = null;
    if (reveal) {
      if (isCloser) { border = COLORS.forest; bg = '#f0fbf6'; }
      else { border = `var(--stg-line,${COLORS.faded + '55'})`; bg = `var(--stg-surf2,${COLORS.paper})`; }
    }
    return (
      <button
        onClick={() => guess(side)}
        disabled={revealing}
        style={{
          flex: '1 1 0', minWidth: 0, textAlign: 'center', padding: '24px 16px', borderRadius: 12,
          border: `2px solid ${border}`, background: bg, cursor: revealing ? 'default' : 'pointer',
          transition: 'all .15s', position: 'relative',
        }}
      >
        {reveal && (
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            {isCloser ? <Check size={18} strokeWidth={3} style={{ color: COLORS.forest }} /> : <X size={18} strokeWidth={3} style={{ color: COLORS.rust }} />}
          </div>
        )}
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(19px, 3vw, 27px)', lineHeight: 1.15, color: INK }}>{opt.name}</div>
        <div style={{ minHeight: 26, marginTop: 14 }}>
          {reveal ? (
            <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: isCloser ? COLORS.forest : `var(--stg-mute,${COLORS.faded})` }}>{fmtMi(dist)}</div>
          ) : (
            <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: FADED }}>Tap if closer</div>
          )}
        </div>
      </button>
    );
  }

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
          dateLabel={`${total} ${total === 1 ? 'round' : 'rounds'}`}
          outcome={phase === 'done' ? (score === maxScore ? 'won' : score > 0 ? 'part' : 'lost') : null}
          figures={phase === 'done' ? [] : [{ v: `${score}/${maxScore}`, k: 'Score' }]}
          progress={maxScore ? score / maxScore : 0}
          quizId={quiz.id}
          scoreWord="correct"
          stripOn={phase !== 'playing'}
          panelBody={<QuizLeaderboard board={board} identity={identity} total={maxScore} />}
        />
      )}
      <div className="qzf-w" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '4px 38px 80px' }}><div className="qzf-line" aria-hidden="true" />

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
            {/* Scoreboard */}
            {phase !== 'done' && (
            <div style={{ position: 'sticky', top: 0, zIndex: 24, background: `var(--stg-surf,${COLORS.cream})`, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: `var(--stg-surf2,${COLORS.paper})`, border: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRadius: 12, padding: '16px 20px' }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, lineHeight: 1 }}>{score}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Correct</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRight: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '0 22px' }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 34, lineHeight: 1, color: `var(--stg-acc-ink,${COLORS.ember})` }}>{phase === 'playing' ? `${Math.min(pos + 1, total)}/${total}` : `${maxScore}`}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>{phase === 'playing' ? 'Round' : <>Rounds · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</>}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 24, color: phase === 'playing' ? `var(--stg-ink,${COLORS.ink})` : `var(--stg-mute,${COLORS.faded})` }}>
                    <span>{fmtTime(phase === 'idle' ? 0 : elapsed)}</span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Best {bestLabel} · time</div>
                </div>
              </div>
            </div>
            )}

            {/* IDLE — start screen */}
            {phase === 'idle' && (
              <div style={{ textAlign: 'center', padding: '26px 24px 30px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, marginTop: 8 }}>
                <Navigation size={26} strokeWidth={2.6} style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }} />
                <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '8px 0 6px' }}>Which is closer?</h2>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: 'var(--stg-ink2,#4a4339)', maxWidth: 520, margin: '0 auto 6px' }}>
                  You get a landmark and two options. Tap whichever one sits closer to it, as the crow flies. Each round reveals the real mileage. {total} rounds — every call counts, no penalty for a miss.
                </p>
                <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: FADED, margin: '0 0 20px' }}>
                  How many of {total} can you call correctly?
                </p>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: FADED, maxWidth: 460, margin: '0 auto 16px' }}>{quiz.blurb}</p>
                <QuizIdleActions onStart={startGame} quizId={quizId} onLeaderboard={() => setTab('stats')} />
              </div>
            )}

            {/* PLAYING — clue + two options */}
            {phase === 'playing' && round && (
              <div style={{ marginTop: 8 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED, marginBottom: 8 }}>Which is closer to</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(24px, 4.4vw, 38px)', lineHeight: 1.12, color: INK }}>
                    <MapPin size={26} strokeWidth={2.4} style={{ color: COLORS.rust, flex: '0 0 auto' }} />
                    <span>{clue.name}?</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, flexWrap: 'wrap' }}>
                  <OptionCard opt={left} side="left" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontFamily: MONO, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED }}>or</div>
                  <OptionCard opt={right} side="right" />
                </div>

                {/* Verdict line during reveal */}
                <div style={{ minHeight: 26, textAlign: 'center', marginTop: 14, fontFamily: MONO, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, color: reveal ? (reveal.ok ? COLORS.forest : COLORS.rust) : `var(--stg-mute,${COLORS.faded})` }}>
                  {reveal ? (() => {
                    const closerName = reveal.dLeft <= reveal.dRight ? left.name : right.name;
                    const gap = Math.abs(reveal.dLeft - reveal.dRight);
                    return `${reveal.ok ? 'Correct' : 'Nope'} — ${closerName} is closer by ${fmtMi(gap)}`;
                  })() : `${clue.name} vs. ${left.name} and ${right.name}`}
                </div>

                <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => finishGame(score)} style={ghostBtn(false)}><Flag size={12} strokeWidth={2.5} /> End run</button>
                </div>
              </div>
            )}

            {/* DONE — results card */}
            {phase === 'done' && (
              <QuizResultModal quiz={quiz} board={board} identity={identity} lastElapsed={lastElapsed} onRegister={() => setTab('join')}
                open={!QSTAGE}
                eyebrow={perfect ? 'Perfect map sense' : (isTopScore ? 'New record' : 'Run complete')}
                score={score}
                total={maxScore}
                headline={perfect ? `Flawless — ${maxScore}/${maxScore} in ${fmtTime(lastElapsed)}` : (isTopScore ? 'you are the top score' : `you beat ${percentile(score, maxScore)}% of players`)}
                subline={board.best != null ? (score >= board.best ? `That is the high score to beat.` : `The high score to beat is ${board.best}.`) : 'Be the first to set the pace.'}
                placement={(() => { const rows = board.leaderboardAll || []; if (identity) { const i = rows.findIndex((r) => r.username === identity.username); if (i >= 0) return i + 1; } if (lastElapsed == null || !rows.length) return null; let b = 0; for (const r of rows) { if (r.score > score || (r.score === score && r.timeElapsed < lastElapsed)) b++; } return b + 1; })()}
                leaderboard={<QuizLeaderboard board={board} identity={identity} total={maxScore} />}
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
            score={score}
            total={maxScore}
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
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: FADED }}>Play a round and your record shows up here. Join the leaderboard to keep it, no email needed.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatBox label="Best score" value={`${stats.best}/${maxScore}`} accent />
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
                <div style={{ display: 'flex', marginBottom: 14, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, width: 'fit-content' }}>
                  {[['registered', 'Registered'], ['all', 'All players']].map(([k, label], idx) => {
                    const on = lbView === k;
                    return <button key={k} onClick={() => setLbView(k)} style={{ padding: '6px 14px', background: on ? COLORS.ink : 'transparent', color: on ? T.white : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderLeft: idx === 0 ? 'none' : `1px solid var(--stg-line,${COLORS.faded}55)`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>;
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
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: INK, maxWidth: 480, margin: '0 auto 20px' }}>{phase === 'done' ? `You scored ${score}/${maxScore}. Challenge someone to beat it.` : 'Send this to someone who thinks they can call it.'}</p>
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
          <div><button onClick={() => setTab('play')} style={backLink}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
          <JoinLeaderboardForm identity={identity} onJoined={(id) => { setIdentity(id); setTab('play'); }} onViewLeaderboard={() => setTab('stats')} /></div>
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

const backLink = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 };

function ghostBtn(disabled) {
  return { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '10px 18px', background: 'transparent', color: `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 };
}
function StatBox({ label, value, accent }) {
  return (
    <div style={{ background: accent ? `var(--stg-surf2,${COLORS.paper})` : `var(--stg-surf2,${T.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, lineHeight: 1, color: accent ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-ink,${COLORS.ink})` }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginTop: 8 }}>{label}</div>
    </div>
  );
}
