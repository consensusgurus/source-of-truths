'use client';

// Connections quiz board (format: 'connections').
//
// Sixteen tiles, four hidden groups of four. The player selects four tiles and
// submits; a correct group locks to the top with its difficulty color, a wrong
// guess costs one of four mistakes (with a "one away" nudge when three of the
// four share a group). The game ends when all four groups are found, the four
// mistakes are spent, or the player gives up. Score = groups solved (0-4),
// time is the tiebreak, so the fastest full solve tops the leaderboard. Reuses
// the same /api/quiz/* endpoints, leaderboard, share, and visual language as the
// other boards.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Flag, Trophy, Shuffle, RotateCcw, Check, Swords } from 'lucide-react';
import JoinLeaderboardForm from './JoinLeaderboardForm';
import QuizStandings from './QuizStandings';
import LeaderboardSnippet from './LeaderboardSnippet';
import LeaderboardStrip from './LeaderboardStrip';
import QuizResultModal from './QuizResultModal';
import QuizLeaderboard from './QuizLeaderboard';
import { similarQuizId } from '@/lib/quiz-similar';
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
import QuizPlayOverlay from './QuizPlayOverlay';
import QuizIdleActions from './QuizIdleActions';
import { isMobileDevice } from '@/lib/is-mobile';
import { LB_POPS, LB_FILTERS, pickLb, lbEmptyNote } from '@/lib/quiz-lb';
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

// Difficulty colors (easiest -> hardest), keyed by group order in the data.
const GROUP_COLORS = [
  { bg: '#e6b93f', tc: '#5c4a06' },
  { bg: '#5aa96a', tc: '#173f1f' },
  { bg: '#5a97dd', tc: '#0c3a66' },
  { bg: '#9b82d8', tc: '#2e1f60' },
];
function gColor(i) { return GROUP_COLORS[i] || GROUP_COLORS[GROUP_COLORS.length - 1]; }

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
function recordResult(id, points) {
  const s = loadStats(id);
  const next = { attempts: s.attempts + 1, best: Math.max(s.best, points), totalCorrect: s.totalCorrect + points };
  try { localStorage.setItem(statsKey(id), JSON.stringify(next)); } catch {}
  return next;
}
function percentile(points, max) {
  const frac = max ? points / max : 0;
  return Math.round(Math.min(99, Math.max(2, Math.pow(frac, 1.35) * 100)));
}
function shuffleArr(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

export default function ConnectionsBoard({ quizId, mobile = false }) {
  const searchParams = useSearchParams();
  // THE STAGE. Same three-way switch every daily uses, keyed by this file
  // rather than by a registry key, because a quiz has no registry row and
  // the unit of rollout is the CLIENT: see lib/quiz-stage.js.
  const QSTAGE = isQuizStage('ConnectionsBoard', searchParams);
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

  const groups = quiz.groups || [];
  const groupsCount = groups.length || 4;
  const maxMistakes = quiz.maxMistakes || 4;
  const allTiles = useMemo(() => groups.reduce((acc, g) => acc.concat(g.members), []), [groups]);
  const tileGroup = useMemo(() => {
    const m = {};
    groups.forEach((g, gi) => g.members.forEach((t) => { m[t] = gi; }));
    return m;
  }, [groups]);

  const [tab, setTab] = useState('play');

  // Game state
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [dismissed, setDismissed] = useState(false);
  const [tiles, setTiles] = useState([]);       // remaining tiles in display order
  const [selected, setSelected] = useState([]); // currently selected tiles
  const [solvedIdx, setSolvedIdx] = useState([]); // group indices solved by the player (in solve order)
  const [revealedIdx, setRevealedIdx] = useState([]); // groups revealed on loss (not scored)
  const [mistakes, setMistakes] = useState(maxMistakes);
  const [note, setNote] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [lastElapsed, setLastElapsed] = useState(null);

  const [stats, setStats] = useState({ attempts: 0, best: 0, totalCorrect: 0 });
  const [board, setBoard] = useState({ plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} });
  const [lbPop, setLbPop] = useState('registered');
  const [lbFilter, setLbFilter] = useState('all');
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

  const startRef = useRef(null);
  const endedRef = useRef(false);
  const timerRef = useRef(null);
  const viewedRef = useRef(false);

  const points = solvedIdx.length;
  const maxPoints = groupsCount;
  const isTopScore = phase === 'done' && board.best != null && lastElapsed != null
    && points === board.best && board.topTime != null && lastElapsed <= board.topTime;

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
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {} }); })
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
      fetch('/api/quiz/view', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      }).catch(() => {});
    }
    return () => { clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const abandon = useAbandonFlush(() => {
    if (endedRef.current || !startRef.current) return null;
    if (phase !== 'playing') return null;
    if (loadStats(quizId).attempts !== 0) return null;
    const el = Math.round((Date.now() - startRef.current) / 1000);
    if (!el) return null;
    return { quizId, score: solvedIdx.length, total: groupsCount, correct: solvedIdx.length, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId() };
  });

  function startElapsed() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (startRef.current) setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 250);
  }

  function startGame(force) {
    setDismissed(false);
    if (!force && phase !== 'idle') return;
    endedRef.current = false;
    setSolvedIdx([]);
    setRevealedIdx([]);
    setSelected([]);
    setMistakes(maxMistakes);
    setNote('');
    setTiles(shuffleArr(allTiles));
    setElapsed(0);
    startRef.current = Date.now();
    setPhase('playing');
    startElapsed();
  }

  function toggleTile(t) {
    if (phase !== 'playing') return;
    setNote('');
    setSelected((prev) => {
      if (prev.includes(t)) return prev.filter((x) => x !== t);
      if (prev.length >= 4) return prev;
      return [...prev, t];
    });
  }

  function submitGuess() {
    if (phase !== 'playing' || selected.length !== 4) return;
    const counts = {};
    selected.forEach((t) => { const gi = tileGroup[t]; counts[gi] = (counts[gi] || 0) + 1; });
    let maxSame = 0, bestGi = -1;
    Object.keys(counts).forEach((k) => { if (counts[k] > maxSame) { maxSame = counts[k]; bestGi = Number(k); } });
    if (maxSame === 4) {
      const nextSolved = [...solvedIdx, bestGi];
      const chosen = selected.slice();
      setSolvedIdx(nextSolved);
      setTiles((prev) => prev.filter((t) => !chosen.includes(t)));
      setSelected([]);
      if (nextSolved.length === groupsCount) {
        setNote('');
        finishGame(nextSolved);
      } else {
        setNote('Nice.');
      }
    } else {
      const left = mistakes - 1;
      setMistakes(left);
      setSelected([]);
      setNote(maxSame === 3 ? 'One away…' : 'Not a group.');
      if (left <= 0) loseReveal(solvedIdx);
    }
  }

  function loseReveal(currentSolved) {
    const remaining = groups.map((_, i) => i).filter((i) => !currentSolved.includes(i));
    setRevealedIdx(remaining);
    setTiles([]);
    finishGame(currentSolved);
  }

  function finishGame(finalSolved) {
    if (endedRef.current) return;
    abandon.markFlushed();
    endedRef.current = true;
    clearInterval(timerRef.current);
    const el = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : elapsed;
    setLastElapsed(el);
    const sc = finalSolved.length;
    chRun.recordStep(sc, groupsCount, el);
    setStats(recordResult(quizId, sc));
    setPhase('done');
    fetch('/api/quiz/result', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId, score: sc, total: groupsCount, correct: sc, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
    })
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {} }); })
      .then(() => fetchQuizMe(setEloAfter))
      .catch(() => { fetchQuizMe(setEloAfter); });
  }

  function giveUp() {
    if (phase !== 'playing') return;
    loseReveal(solvedIdx);
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
  const resultMsg = phase === 'done' ? `I solved ${points}/${maxPoints} groups on "${quiz.title}". Can you beat me?` : `Can you untangle "${quiz.title}"?`;
  const promoImgUrl = `${SITE_URL}/quiz/${quiz.id}/share-image`;
  const resultImgUrl = `${SITE_URL}/quiz/${quiz.id}/result-image?s=${points}&t=${maxPoints}&p=0`;
  function openShare(kind) { const u = encodeURIComponent(shareUrl); const t = encodeURIComponent(resultMsg); const url = kind === 'x' ? `https://twitter.com/intent/tweet?text=${t}&url=${u}` : kind === 'reddit' ? `https://www.reddit.com/submit?url=${u}&title=${t}` : kind === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${u}` : kind === 'whatsapp' ? `https://api.whatsapp.com/send?text=${t}%20${u}` : shareUrl; try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {} }
  function copyResult() { if (notifyShareCredit(`${resultMsg}\n${shareUrl}`)) return; try { navigator.clipboard?.writeText(`${resultMsg}\n${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {} }
  async function downloadPromoImage() { try { const r = await fetch(promoImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  async function downloadResultImage() { try { const r = await fetch(resultImgUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `source-of-truths-${quiz.id}-score.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u); } catch (e) {} }
  function share() {
    const text = 'Can you beat my score?';
    if (navigator.share) {
      navigator.share({ title: quiz.title, text, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    }
  }

  const bestLabel = board.best != null ? board.best : '—';
  const lbRows = pickLb(board, lbPop, lbFilter);

  const eloDept = deptOf(quiz);
  const eloDeptLabel = DEPT_LABEL[eloDept] || 'Category';
  const eloPanel = <QuizStandings eloAfter={eloAfter} eloBefore={eloBefore} eloDept={eloDept} eloDeptLabel={eloDeptLabel} fill />;

  const mPlayOverlay = mobile === true && phase === 'playing';
  const clockDisplay = phase === 'done' ? fmtTime(lastElapsed || 0) : fmtTime(elapsed);

  function GroupRow({ gi }) {
    const g = groups[gi];
    const c = gColor(gi);
    return (
      <div style={{ background: c.bg, borderRadius: 12, padding: '11px 12px', textAlign: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.tc }}>{g.label}</div>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: c.tc, marginTop: 3 }}>{g.members.join(', ')}</div>
      </div>
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
          dateLabel={`${maxPoints} ${maxPoints === 1 ? 'group' : 'groups'}`}
          outcome={phase === 'done' ? (points === maxPoints ? 'won' : points > 0 ? 'part' : 'lost') : null}
          figures={phase === 'done' ? [] : [{ v: `${points}/${maxPoints}`, k: 'Score' }]}
          progress={maxPoints ? points / maxPoints : 0}
          quizId={quiz.id}
          scoreWord="correct"
          stripOn={phase !== 'playing'}
          panelBody={<QuizLeaderboard board={board} identity={identity} total={maxPoints} />}
        />
      )}
      <div className="qzf-w" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '4px 38px 80px' }}><style dangerouslySetInnerHTML={{ __html: `@media(max-width:560px){.qzf-w{padding-left:14px !important;padding-right:14px !important;}}@media(max-width:480px){.qz-resrow{flex-direction:column !important;}}` }} /><div className="qzf-line" aria-hidden="true" />

        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');` }} />

        {/* Header */}
        <div style={{ paddingBottom: 0, marginTop: 8, ...(phase === 'done' ? { maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
          {!QSTAGE && <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0, color: INK }}>{quiz.title}</h1>}
          {!QSTAGE && tab !== 'stats' && phase !== 'playing' && <LeaderboardStrip board={board} identity={identity} onOpen={() => setTab('stats')} />}
        </div>

        <div style={{ marginTop: 24 }} />

        {/* ── PLAY ── */}
        {tab === 'play' && (
          <QuizPlayOverlay open={mPlayOverlay} stage={QSTAGE}>
            <div style={{ position: 'sticky', top: 0, zIndex: 24, background: `var(--stg-surf,${COLORS.cream})`, paddingBottom: 4, display: phase === 'done' ? 'none' : undefined }}>
              {/* Scoreboard */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(6px, 2vw, 16px)', background: `var(--stg-surf2,${COLORS.paper})`, border: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRadius: 12, padding: '14px clamp(12px, 3.5vw, 20px)', marginBottom: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(22px, 6.4vw, 34px)', lineHeight: 1 }}>{points}<span style={{ fontSize: 'clamp(14px, 4vw, 20px)', color: FADED }}>/{maxPoints}</span></div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Groups</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRight: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '0 clamp(8px, 2.5vw, 22px)' }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(22px, 6.4vw, 34px)', lineHeight: 1, color: `var(--stg-acc-ink,${COLORS.ember})` }}>{bestLabel}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 'clamp(18px, 5vw, 24px)', color: phase === 'idle' ? `var(--stg-mute,${COLORS.faded})` : `var(--stg-ink,${COLORS.ink})` }}>{clockDisplay}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Time</div>
                </div>
              </div>
              {/* Mistakes row */}
              {phase === 'playing' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: FADED }}>Mistakes left</span>
                  <span style={{ display: 'flex', gap: 7 }}>
                    {Array.from({ length: maxMistakes }).map((_, i) => (
                      <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i < mistakes ? COLORS.ink : COLORS.faded + '44' }} />
                    ))}
                  </span>
                  {note && <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: note === 'Nice.' ? COLORS.forest : (note === 'One away…' ? COLORS.rust : `var(--stg-mute,${COLORS.faded})`), marginLeft: 6 }}>{note}</span>}
                </div>
              )}
            </div>

            {/* IDLE */}
            {phase === 'idle' && (
              <div style={{ textAlign: 'center', padding: '26px 24px 30px', borderRadius: 12, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})` }}>
                <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '2px 0 6px' }}>Find the four groups.</h2>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: 'var(--stg-ink2,#4a4339)', maxWidth: 470, margin: '0 auto 6px' }}>
                  Sixteen tiles hide four groups of four. Pick four you think connect, then submit. Every tile fits exactly one group, but some look like they belong in more than one. You get {maxMistakes} mistakes. Solve all four as fast as you can, time is the tiebreak.
                </p>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: FADED, maxWidth: 460, margin: '0 auto 16px' }}>{quiz.blurb}</p>
                <QuizIdleActions onStart={startGame} quizId={quizId} onLeaderboard={() => setTab('stats')} />
              </div>
            )}

            {/* PLAYING */}
            {phase === 'playing' && (
              <div>
                {solvedIdx.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    {solvedIdx.map((gi) => <GroupRow key={gi} gi={gi} />)}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {tiles.map((t) => {
                    const sel = selected.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => toggleTile(t)}
                        style={{ fontFamily: SANS, minHeight: 64, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 'clamp(12px, 2.6vw, 15px)', fontWeight: 700, padding: 4, lineHeight: 1.15, background: sel ? `var(--stg-acc,${COLORS.ink})` : `var(--stg-surf2,${COLORS.paper})`, color: sel ? `var(--stg-onramp,${T.white})` : `var(--stg-ink,${COLORS.ink})`, transition: 'background .12s' }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
                  <button onClick={() => setTiles((p) => shuffleArr(p))} style={ctrlBtn(false)}><Shuffle size={13} strokeWidth={2.5} /> Shuffle</button>
                  <button onClick={() => setSelected([])} style={ctrlBtn(selected.length === 0)} disabled={selected.length === 0}><RotateCcw size={13} strokeWidth={2.5} /> Deselect</button>
                  <button onClick={submitGuess} disabled={selected.length !== 4} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '11px 26px', borderRadius: 10, border: `1.5px solid var(--stg-acc,${COLORS.ember})`, background: selected.length === 4 ? COLORS.ember : `var(--stg-surf,${COLORS.cream})`, color: selected.length === 4 ? T.white : `var(--stg-mute,${COLORS.faded})`, cursor: selected.length === 4 ? 'pointer' : 'default', opacity: selected.length === 4 ? 1 : 0.55, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} strokeWidth={3} /> Submit</button>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={giveUp} style={ghostBtn(false)}><Flag size={12} strokeWidth={2.5} /> Give up</button>
                </div>
              </div>
            )}

            {/* DONE */}
            {phase === 'done' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {groups.map((_, gi) => <GroupRow key={gi} gi={gi} />)}
                </div>
                <QuizResultModal quiz={quiz} board={board} identity={identity} lastElapsed={lastElapsed} onRegister={() => setTab('join')}
                  open={!QSTAGE && (!dismissed)}
                  onClose={() => setDismissed(true)}
                  eyebrow={points === maxPoints ? 'Solved' : 'Final result'}
                  score={points}
                  total={maxPoints}
                  headline={`${points} of ${maxPoints} groups · ${isTopScore ? 'you are the top score' : `you beat ${percentile(points, maxPoints)}% of players`}`}
                  subline={board.best != null ? (points >= board.best ? `That is the score to beat.` : `The score to beat is ${board.best}.`) : 'Be the first to set the pace.'}
                  leaderboard={<QuizLeaderboard board={board} identity={identity} total={maxPoints} />}
                  placement={(() => { const rows = board.leaderboardAll || []; if (identity) { const i = rows.findIndex((r) => r.username === identity.username); if (i >= 0) return i + 1; } if (lastElapsed == null || !rows.length) return null; let b = 0; for (const r of rows) { if (r.score > points || (r.score === points && r.timeElapsed < lastElapsed)) b++; } return b + 1; })()}
                  standings={eloPanel}
                  onPlayAgain={() => startGame(true)}
                  onPlaySimilar={() => { const sid = similarQuizId(quiz); if (sid) router.push(`/quiz/${sid}`); }}
                  onLeaderboard={() => setTab('stats')}
                  onShare={() => setTab('share')}
                  onReport={() => { setQSent(false); setQOpen(true); }}
                />
              </>
            )}
          </QuizPlayOverlay>
        )}

        {QSTAGE && phase === 'done' && (
          <QuizLoftFinish
            stage={QSTAGE}
            quiz={quiz}
            score={points}
            total={maxPoints}
            elapsed={lastElapsed}
            board={board}
            identity={identity}
            topScore={isTopScore}
            onReplay={() => startGame(true)}
            onJoin={() => setTab('join')}
          />
        )}
        {/* ── STATS ── */}
        {tab === 'stats' && (
          <div>
            <button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 14 }}>Your record</div>
            {stats.attempts === 0 ? (
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: FADED }}>Play a round and your record shows up here. Join the leaderboard to keep it, no email needed.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatBox label="Best groups" value={`${stats.best}`} accent />
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
                    <span>#</span><span>Username</span><span style={{ textAlign: 'right' }}>Groups</span><span style={{ textAlign: 'right' }}>Time</span>
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
            <div style={{ textAlign: 'left' }}><button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button></div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: INK, maxWidth: 480, margin: '0 auto 20px' }}>{phase === 'done' ? `You solved ${points} of ${maxPoints} groups. Challenge someone to beat it.` : 'Send this puzzle to someone who thinks they can spot the connections.'}</p>
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
          <div><button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
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

function ctrlBtn(disabled) {
  return { fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '11px 20px', background: `var(--stg-surf,${COLORS.cream})`, color: `var(--stg-ink,${COLORS.ink})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 };
}
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
