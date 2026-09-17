'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { getChallenge, challengeColumns } from '@/lib/challenges';
import { getQuiz } from '@/lib/quizzes';
import Grain from '../../Grain';
import Footer from '../../Footer';
import QuizNavHeader from '../../quizzes/QuizNavHeader';
import { T } from '@/lib/theme';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  soft: T.muted,
  line: 'rgba(20,22,28,0.30)',
  accSoft: T.accentSoft,
  accBorder: T.accentBorder,
  forest: T.success,
  faded: T.muted,
};
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

// Drop a leading "Name the ..." / "Name every ..." / generic verb prefix so a
// quiz title reads cleanly as a topic label in the run summary.
function displayTitle(t) {
  if (!t) return '';
  return t
    .replace(/^Name\s+(the|every|all)\s+/i, '')
    .replace(/^Name\s+/i, '')
    .replace(/^(Guess|Match|Click|Identify|Pick)\s+(the|every|all)?\s*/i, '')
    .trim() || t;
}

function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function ChallengeClient({ id }) {
  const ch = useMemo(() => getChallenge(id), [id]);
  const [run, setRun] = useState(null);

  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(`sot_chrun_${id}`);
      setRun(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setRun(null);
    }
  }, [id]);

  if (!ch) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.cream, color: COLORS.ink, position: 'relative' }}>
        <Grain />
        <QuizNavHeader />
        <div style={{ position: 'relative', zIndex: 2, padding: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: FONT, fontStyle: 'italic', color: COLORS.faded, margin: 0 }}>That challenge could not be found.</p>
          <Link href="/quizzes" style={{ display: 'inline-block', marginTop: 16, fontFamily: FONT, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: T.white, background: COLORS.ink, padding: '10px 20px', borderRadius: 10, textDecoration: 'none' }}>Back to all quizzes</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const cols = challengeColumns(ch); // [{quizId, label, icon, group}]
  const scores = (run && run.scores) || {};
  const rows = cols.map((c, i) => {
    const q = getQuiz(c.quizId);
    const result = scores[c.quizId] || null;
    return {
      index: i,
      quizId: c.quizId,
      title: q ? displayTitle(q.title) : c.quizId,
      done: !!result,
      result,
    };
  });

  const allDone = rows.length > 0 && rows.every((r) => r.done);
  const totalCorrect = rows.reduce((a, r) => a + (r.result ? (r.result.score || 0) : 0), 0);
  const totalPossible = rows.reduce((a, r) => a + (r.result ? (r.result.total || 0) : 0), 0);
  const totalTime = rows.reduce((a, r) => a + (r.result ? (r.result.timeElapsed || 0) : 0), 0);

  const firstUndone = rows.find((r) => !r.done);
  const entryUrl = (i) => `/quiz/${rows[i].quizId}?ch=${encodeURIComponent(id)}&i=${i}`;
  const continueIdx = firstUndone ? firstUndone.index : 0;
  const anyStarted = rows.some((r) => r.done);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, color: COLORS.ink, position: 'relative', overflowX: 'clip' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');` }} />
      <Grain />
      <QuizNavHeader />

      <div className="qzf-w" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '8px 38px 80px' }}>
        <div className="qzf-line" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
        <Link href="/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: COLORS.faded, textDecoration: 'none', marginTop: 6 }}>
          <ArrowLeft size={14} strokeWidth={2.5} /> All quizzes
        </Link>

        {/* Header */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, color: COLORS.ember, marginBottom: 6 }}>{ch.kicker || 'Daily Challenge'}</div>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 'clamp(26px, 5vw, 38px)', lineHeight: 1.04, letterSpacing: '-0.02em', margin: 0, color: COLORS.ink }}>{ch.title}</h1>
          {ch.blurb && <p style={{ fontFamily: FONT, fontSize: 15, lineHeight: 1.55, margin: '10px 0 0', color: COLORS.faded }}>{ch.blurb}</p>}
        </div>

        {/* Quiz rows */}
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((r) => (
            <div key={r.quizId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${r.done ? COLORS.accBorder : COLORS.line}`, background: r.done ? COLORS.accSoft : T.white }}>
              <div style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.done ? COLORS.forest : COLORS.paper, color: r.done ? T.white : COLORS.soft, fontFamily: FONT, fontWeight: 800, fontSize: 14 }}>
                {r.done ? <Check size={16} strokeWidth={3} /> : r.index + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: COLORS.ink, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.faded, marginTop: 2 }}>Quiz {r.index + 1} of {rows.length}</div>
              </div>
              {r.done ? (
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: COLORS.ink }}>{r.result.score}<span style={{ fontSize: 13, color: COLORS.faded }}> / {r.result.total}</span></div>
                  {r.result.timeElapsed != null && <div style={{ fontFamily: FONT, fontSize: 12, color: COLORS.faded }}>{fmtTime(r.result.timeElapsed)}</div>}
                </div>
              ) : (
                <Link href={entryUrl(r.index)} style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, color: T.white, background: COLORS.ember, padding: '9px 16px', borderRadius: 9, textDecoration: 'none' }}>
                  Play <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        {allDone && (
          <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 12, border: `2px solid ${COLORS.ink}`, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, color: COLORS.faded }}>Challenge total</span>
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: COLORS.ink }}>
              {totalCorrect}<span style={{ fontSize: 15, color: COLORS.faded }}> / {totalPossible}</span>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: COLORS.faded, marginLeft: 12 }}>{fmtTime(totalTime)}</span>
            </span>
          </div>
        )}

        {/* CTAs */}
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          {!allDone ? (
            <Link href={entryUrl(continueIdx)} style={{ boxSizing: 'border-box', fontFamily: FONT, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, padding: '15px 18px', borderRadius: 10, background: COLORS.ember, color: T.white, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 18px rgba(14,29,64,0.32)' }}>
              {anyStarted ? 'Continue' : 'Start'} <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          ) : (
            <Link href={`/quizzes/hub?tab=challenges&ch=${encodeURIComponent(id)}`} style={{ boxSizing: 'border-box', fontFamily: FONT, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, padding: '15px 18px', borderRadius: 10, background: COLORS.ember, color: T.white, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 18px rgba(14,29,64,0.32)' }}>
              <Trophy size={15} strokeWidth={2.5} /> View standings
            </Link>
          )}
          <Link href="/quizzes" style={{ boxSizing: 'border-box', fontFamily: FONT, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '13px 18px', borderRadius: 10, border: `1.5px solid ${COLORS.ink}`, background: T.white, color: COLORS.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Back to all quizzes
          </Link>
        </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
