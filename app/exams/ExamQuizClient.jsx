'use client';

// ──────────────────────────────────────────────────────────────────────────
// Shared "Where Will You Get In?" exam engine. Renders any exam defined in
// examData.js (LSAT, GMAT, SAT, ACT, GRE, MCAT). Hidden / unlinked preview
// pages; makes NO calls to the /api/quiz/* scoring or leaderboard endpoints.
//
// Scoring is purely the number of correct answers out of 10 — speed is NOT
// rewarded. Each question carries a 75-second limit; letting it expire simply
// marks the question unanswered. The number correct maps to a shortlist of
// schools via REACH_START, with a deliberately harsh curve (0-2 correct clears
// no ranked program).
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Flag, Share2, RotateCcw, GraduationCap, ChevronRight, Clock } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import { EXAMS, REACH_START } from './examData';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '@/app/ShareCreditPop';
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
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

const PER_SEC = 75;
const PER_MS = PER_SEC * 1000;
const TICK_MS = 100;

function verdictFor(correct) {
  if (correct <= 2) return 'Not yet competitive for a ranked program on this set. The honest read: keep drilling the fundamentals. These questions are hard, and a few more right answers changes the picture fast.';
  if (correct <= 4) return 'A foothold. You’re reaching the bottom of the ranked field, with real room to climb.';
  if (correct <= 6) return 'Solid work. Mid-tier ranked programs are realistic targets.';
  if (correct <= 8) return 'Strong performance. Aim high on this list.';
  return 'Elite performance. The very top of the rankings is genuinely in play.';
}

export default function ExamQuizClient({ examKey }) {
  const router = useRouter();
  const exam = EXAMS[examKey];

  const [phase, setPhase] = useState('idle'); // idle | playing | reveal | done
  const [qIndex, setQIndex] = useState(0);
  const [remaining, setRemaining] = useState(PER_MS);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]); // [{ correct, choice }]
  const [copied, setCopied] = useState(false);
  const [views, setViews] = useState(null);

  const timerRef = useRef(null);
  const deadlineRef = useRef(0);
  const viewedRef = useRef(false);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Record one page view (view-only — no scoring/leaderboard) and show the
  // running total at the bottom of the page.
  useEffect(() => {
    if (!EXAMS[examKey] || viewedRef.current) return;
    viewedRef.current = true;
    fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: `exam-${examKey}` }) })
      .then((r) => r.json())
      .then((d) => { if (d && typeof d.count === 'number') setViews(d.count); })
      .catch(() => {});
  }, [examKey]);

  if (!exam) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.cream, color: COLORS.ink, fontFamily: FONT, position: 'relative' }}>
        <Grain />
        <div style={{ position: 'relative', zIndex: 2, padding: 48, textAlign: 'center' }}>
          <p style={{ color: COLORS.faded }}>That exam could not be found.</p>
          <button onClick={() => router.push('/exams')} style={{ marginTop: 16, background: COLORS.ink, color: COLORS.cream, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontFamily: FONT, fontWeight: 700 }}>All exams</button>
        </div>
        <Footer />
      </div>
    );
  }

  const QUESTIONS = exam.questions;
  const total = QUESTIONS.length;
  const SCHOOLS = exam.schools;
  const q = QUESTIONS[qIndex];
  const correctCount = results.filter((r) => r.correct).length;

  function stopTimer() { clearInterval(timerRef.current); timerRef.current = null; }

  function beginQuestion(i) {
    setQIndex(i);
    setPicked(null);
    setPhase('playing');
    setRemaining(PER_MS);
    deadlineRef.current = Date.now() + PER_MS;
    stopTimer();
    timerRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) { stopTimer(); setRemaining(0); settle(null); }
      else setRemaining(left);
    }, TICK_MS);
  }

  function startGame() { setResults([]); beginQuestion(0); }

  function settle(choiceIndex) {
    stopTimer();
    const cur = QUESTIONS[qIndex];
    const correct = choiceIndex != null && choiceIndex === cur.correct;
    setPicked(choiceIndex);
    setPhase('reveal');
    setResults((prev) => [...prev, { correct, choice: choiceIndex }]);
  }

  function pick(i) { if (phase === 'playing') settle(i); }

  function next() {
    if (qIndex + 1 < total) beginQuestion(qIndex + 1);
    else {
      stopTimer();
      setPhase('done');
      // Mark this practice test finished (once) so it counts toward the
      // Standardized Tests mastery bar on /quizzes. Read by QuizHomeClient.
      try {
        const done = JSON.parse(localStorage.getItem('sot_exam_done') || '{}');
        if (!done[examKey]) { done[examKey] = true; localStorage.setItem('sot_exam_done', JSON.stringify(done)); }
      } catch {}
    }
  }

  function giveUp() { stopTimer(); setPhase('done'); }

  function restart() {
    stopTimer();
    setResults([]);
    setPicked(null);
    setQIndex(0);
    setRemaining(PER_MS);
    setPhase('idle');
  }

  function share() {
    const url = withRef(typeof window !== 'undefined' ? window.location.href : `https://mindloftdaily.com/${examKey}`);
    const text = phase === 'done'
      ? `I got ${correctCount}/${total} on the ${exam.label} practice quiz. Where will you get in?`
      : `${exam.label} practice: 10 hard questions. Where will you get in?`;
    if (notifyShareCredit(`${text} ${url}`)) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: `${exam.label} Practice`, text, url }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
    }
  }

  const frac = Math.max(0, Math.min(1, remaining / PER_MS));
  const secsLeft = Math.ceil(remaining / 1000);
  const lowClock = phase === 'playing' && remaining <= 10000;
  const lastResult = results[results.length - 1];

  const reachStart = REACH_START[correctCount];
  const belowThreshold = reachStart < 0;
  const reachWindow = belowThreshold ? [] : SCHOOLS.slice(reachStart, reachStart + 5);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, color: COLORS.ink, position: 'relative', overflow: 'clip', fontFamily: FONT }}>
      <Grain />
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');" }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 760, margin: '0 auto', padding: '22px 22px 80px' }}>
        {/* Header */}
        <a href="/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: COLORS.ember, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, marginBottom: 18 }}>
          <ArrowLeft size={13} strokeWidth={2.5} /> All practice tests
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <GraduationCap size={28} strokeWidth={2} style={{ color: COLORS.ember, flex: 'none' }} />
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 'clamp(26px, 4.2vw, 40px)', lineHeight: 1.04, letterSpacing: '-0.025em', margin: 0, color: COLORS.ink }}>
            {exam.label}: Where Will You Get In?
          </h1>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 15.5, lineHeight: 1.55, margin: '12px 0 0', color: COLORS.faded, maxWidth: 640 }}>{exam.blurb}</p>

        <div style={{ marginTop: 22 }} />

        {/* Scoreboard during play (no points — correct count + timer only) */}
        {phase !== 'idle' && phase !== 'done' && (
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: COLORS.cream, paddingBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: COLORS.paper, borderRadius: 12, border: `1px solid ${COLORS.faded}33`, padding: '14px 20px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 30, lineHeight: 1, color: COLORS.forest }}>{correctCount}<span style={{ fontSize: 18, color: COLORS.faded }}>/{total}</span></div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, fontWeight: 600 }}>Correct</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.ink }}>Q {Math.min(qIndex + 1, total)}/{total}</div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, fontWeight: 600 }}>Question</div>
              </div>
            </div>
            {/* Countdown bar (time limit only — does NOT affect score) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div style={{ flex: 1, height: 10, background: COLORS.paper, borderRadius: 10, border: `1px solid ${COLORS.faded}44`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${frac * 100}%`, background: lowClock ? COLORS.rust : COLORS.ember, transition: phase === 'playing' ? `width ${TICK_MS}ms linear` : 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 64, justifyContent: 'flex-end' }}>
                <Clock size={14} strokeWidth={2.5} style={{ color: phase === 'reveal' ? COLORS.faded : (lowClock ? COLORS.rust : COLORS.faded) }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: phase === 'reveal' ? COLORS.faded : (lowClock ? COLORS.rust : COLORS.ink) }}>
                  {phase === 'reveal' ? '—' : `${secsLeft}s`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* IDLE */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center', padding: '30px 24px 34px', borderRadius: 12, border: `1.5px solid ${COLORS.ink}`, background: COLORS.paper }}>
            <GraduationCap size={28} strokeWidth={2} style={{ color: COLORS.ember }} />
            <h2 style={{ fontWeight: 800, fontSize: 26, margin: '8px 0 8px' }}>Ten questions. No partial credit for speed.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: '#41454d', maxWidth: 500, margin: '0 auto 8px' }}>
              You have up to {PER_SEC} seconds per question, but the clock is only a limit, not a scorer. Your result depends solely on how many of the {total} you answer correctly.
            </p>
            <p style={{ fontSize: 12, letterSpacing: '0.06em', color: COLORS.faded, margin: '0 0 22px', fontWeight: 600 }}>
              Your number correct decides which {exam.payoffNoun} land in reach.
            </p>
            <button onClick={startGame} style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, padding: '0 44px', lineHeight: '52px', border: 'none', borderRadius: 10, background: COLORS.ember, color: T.white, cursor: 'pointer' }}>
              Begin
            </button>
          </div>
        )}

        {/* PLAYING / REVEAL */}
        {(phase === 'playing' || phase === 'reveal') && q && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.ember, fontWeight: 700, margin: '2px 0 8px' }}>{q.type}</div>
            {q.prompt ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 'clamp(16px, 2.4vw, 19px)', lineHeight: 1.5, margin: '0 0 8px', color: '#2b2f37' }}>{q.q}</div>
                <div style={{ fontWeight: 700, fontSize: 'clamp(17px, 2.6vw, 21px)', lineHeight: 1.3, margin: '0 0 16px' }}>{q.prompt}</div>
              </>
            ) : (
              <div style={{ fontWeight: 700, fontSize: 'clamp(17px, 2.6vw, 21px)', lineHeight: 1.35, margin: '0 0 16px' }}>{q.q}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 9 }}>
              {q.choices.map((c, ci) => {
                const revealing = phase === 'reveal';
                const isCorrect = ci === q.correct;
                const isPicked = ci === picked;
                let bg = T.white, border = COLORS.ink, fg = COLORS.ink, mark = null;
                if (revealing) {
                  if (isCorrect) { bg = '#e7f3ec'; border = COLORS.forest; mark = <Check size={18} strokeWidth={3} style={{ color: COLORS.forest }} />; }
                  else if (isPicked) { bg = '#f7e7e3'; border = COLORS.rust; fg = COLORS.rust; mark = <X size={18} strokeWidth={3} style={{ color: COLORS.rust }} />; }
                  else { bg = COLORS.paper; border = COLORS.faded + '33'; fg = COLORS.faded; }
                }
                return (
                  <button
                    key={ci}
                    onClick={() => pick(ci)}
                    disabled={revealing}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 13, textAlign: 'left', padding: '13px 16px', borderRadius: 10, background: bg, border: `1.5px solid ${border}`, color: fg, cursor: revealing ? 'default' : 'pointer', fontFamily: FONT, fontSize: 15.5, lineHeight: 1.4, transition: 'background .15s, border-color .15s' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: revealing && !isCorrect && !isPicked ? COLORS.faded : COLORS.ember, width: 16, flex: 'none', marginTop: 1 }}>{String.fromCharCode(65 + ci)}</span>
                    <span style={{ flex: 1 }}>{c}</span>
                    <span style={{ width: 20, flex: 'none' }}>{mark}</span>
                  </button>
                );
              })}
            </div>

            {phase === 'reveal' && (
              <div style={{ marginTop: 14, padding: '13px 16px', borderRadius: 8, background: COLORS.paper, borderLeft: `3px solid ${lastResult?.correct ? COLORS.forest : COLORS.rust}` }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: lastResult?.correct ? COLORS.forest : COLORS.rust, marginBottom: 6 }}>
                  {lastResult?.correct ? 'Correct' : (picked == null ? 'Out of time' : 'Not quite')}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.55, color: '#41454d' }}>{q.note}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 22 }}>
              {QUESTIONS.map((_, i) => {
                const done = i < results.length;
                const cur = i === qIndex;
                const good = done && results[i]?.correct;
                return <span key={i} style={{ width: cur ? 22 : 9, height: 9, borderRadius: 5, background: done ? (good ? COLORS.forest : COLORS.rust) : (cur ? COLORS.ember : COLORS.faded + '44'), transition: 'all .2s' }} />;
              })}
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {phase === 'reveal' && (
                <button onClick={next} style={{ fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 32px', lineHeight: '48px', border: 'none', borderRadius: 10, background: COLORS.ink, color: COLORS.cream, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {qIndex + 1 < total ? 'Next question' : 'See my shortlist'} <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              )}
              <button onClick={giveUp} style={ghostBtn}>
                <Flag size={12} strokeWidth={2.5} /> End now
              </button>
            </div>
          </div>
        )}

        {/* DONE — payoff */}
        {phase === 'done' && (
          <div>
            <div style={{ padding: '24px', borderRadius: 12, border: `1.5px solid ${COLORS.ink}`, background: COLORS.paper, textAlign: 'center' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.ember, marginBottom: 8, fontWeight: 700 }}>Your result</div>
              <div style={{ fontWeight: 800, fontSize: 44, lineHeight: 1, marginBottom: 6 }}>{correctCount}<span style={{ fontSize: 24, color: COLORS.faded }}>/{total}</span></div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{correctCount} of {total} correct</div>
              <p style={{ fontSize: 15, lineHeight: 1.5, color: '#41454d', maxWidth: 500, margin: '0 auto' }}>{verdictFor(correctCount)}</p>
            </div>

            {belowThreshold ? (
              <div style={{ marginTop: 22, padding: '20px 18px', borderRadius: 12, background: COLORS.paper, border: `1px solid ${COLORS.faded}33`, textAlign: 'center' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.faded, fontWeight: 700, marginBottom: 8 }}>Schools in reach</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.55, color: '#2b2f37', margin: 0 }}>
                  No ranked {exam.payoffNoun.replace(/s$/, '')} program is in reach on this run. The good news: this is a practice set, and a few more correct answers moves you onto the board quickly.
                </p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.ember, fontWeight: 700, margin: '26px 0 12px' }}>Schools in reach</div>
                <div>
                  {reachWindow.map((s, i) => {
                    const rank = reachStart + i + 1;
                    const isReach = i === 0;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', marginBottom: 8, borderRadius: 10, background: isReach ? '#e7f3ec' : T.white, border: `1.5px solid ${isReach ? COLORS.forest : COLORS.faded + '33'}` }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.faded, minWidth: 30 }}>#{rank}</span>
                        <span style={{ fontSize: 17, fontWeight: 600, flex: 1 }}>{s}</span>
                        {isReach && <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: COLORS.forest }}>Target reach</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <p style={{ fontSize: 12, color: COLORS.faded, margin: '10px 0 0', lineHeight: 1.45 }}>
              {exam.rankingNote} For fun only, not admissions advice.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
              <button onClick={restart} style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 28px', lineHeight: '48px', border: 'none', borderRadius: 10, background: COLORS.ember, color: T.white, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw size={14} strokeWidth={2.5} /> Take it again
              </button>
              <button onClick={() => router.push('/exams')} style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 28px', lineHeight: '48px', border: `1.5px solid ${COLORS.ink}`, borderRadius: 10, background: COLORS.cream, color: COLORS.ink, cursor: 'pointer' }}>
                Other tests
              </button>
              <button onClick={share} style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 28px', lineHeight: '48px', border: `1.5px solid ${COLORS.ink}`, borderRadius: 10, background: COLORS.cream, color: COLORS.ink, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={14} strokeWidth={2.5} /> {copied ? 'Copied!' : 'Share'}
              </button>
            </div>

            {/* Answer recap */}
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.faded, fontWeight: 700, margin: '32px 0 12px' }}>The reasoning behind each answer</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {QUESTIONS.map((qq, i) => {
                const r = results[i];
                const good = r && r.correct;
                return (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '13px 16px', borderRadius: 10, border: `1px solid ${good ? COLORS.forest : COLORS.faded + '33'}`, marginBottom: 8, background: good ? T.white : COLORS.paper }}>
                    <span style={{ width: 20, flex: 'none', color: good ? COLORS.forest : COLORS.rust, marginTop: 2 }}>{good ? <Check size={17} strokeWidth={3} /> : <X size={17} strokeWidth={3} />}</span>
                    <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45 }}>
                      <span style={{ color: '#2b2f37', fontWeight: 600 }}>{qq.prompt || qq.q}</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: COLORS.faded, marginTop: 4, fontWeight: 600 }}>
                        Answer: <span style={{ color: COLORS.ink }}>{String.fromCharCode(65 + qq.correct)}. {qq.choices[qq.correct]}</span>
                      </span>
                      <span style={{ display: 'block', fontSize: 13.5, color: '#41454d', marginTop: 6, lineHeight: 1.5 }}>{qq.note}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid ${COLORS.faded}33`, fontSize: 11, letterSpacing: '0.04em', color: COLORS.faded, lineHeight: 1.6 }}>
          Questions are original, written in {exam.label} style. {exam.rankingNote}
        </div>
        {views != null && (
          <div style={{ marginTop: 14, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.faded, fontWeight: 700 }}>
            {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

const ghostBtn = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '0 20px', lineHeight: '48px', background: 'transparent', color: COLORS.faded, borderRadius: 10, border: `1px solid ${COLORS.faded}55`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT };
