'use client';

// Standardized-test hub — landing page for the six "Where Will You Get In?"
// practice quizzes. Hidden / unlinked; the per-exam back button returns here.

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import Grain from '../Grain';
import Footer from '../Footer';
import { EXAMS, EXAM_ORDER } from './examData';
import { T } from '@/lib/theme';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  faded: T.muted,
};
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";

// The LSAT's classic analytical-reasoning puzzles (a.k.a. logic games). These
// live in lib/quizzes.js as format: 'logic-game' quizzes and play at /quiz/<id>.
const LOGIC_GAMES = [
  { id: 'lsat-logic-game-gallery-wall', name: 'The Gallery Wall' },
  { id: 'lsat-logic-game-service-bay', name: 'The Service Bay' },
  { id: 'lsat-logic-game-recital-order', name: 'The Recital Order' },
  { id: 'lsat-logic-game-debate-lineup', name: 'The Debate Lineup' },
  { id: 'lsat-logic-game-tasting-flight', name: 'The Tasting Flight' },
  { id: 'lsat-logic-game-closing-shift', name: 'The Closing Shift' },
  { id: 'lsat-logic-game-festival-headliners', name: 'The Festival Headliners' },
  { id: 'lsat-logic-game-garden-bed', name: 'The Garden Bed' },
  { id: 'lsat-logic-game-expert-panel', name: 'The Expert Panel' },
  { id: 'lsat-logic-game-festival-lineup', name: 'A Festival Lineup' },
];

export default function ExamHubClient() {
  const [views, setViews] = useState({});
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((r) => r.json())
      .then((d) => {
        const v = (d && d.views) || {};
        const next = {};
        EXAM_ORDER.forEach((k) => { const n = v[`quiz::exam-${k}`]; if (typeof n === 'number') next[k] = n; });
        setViews(next);
      })
      .catch(() => {});
  }, []);
  return (
    <div style={{ minHeight: '100vh', background: COLORS.cream, color: COLORS.ink, position: 'relative', overflow: 'clip', fontFamily: FONT }}>
      <Grain />
      <style dangerouslySetInnerHTML={{ __html: "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');" }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 760, margin: '0 auto', padding: '22px 22px 80px' }}>
        <a href="/quizzes" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: COLORS.ember, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, marginBottom: 18 }}>
          <ArrowLeft size={13} strokeWidth={2.5} /> Quizzes
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <GraduationCap size={30} strokeWidth={2} style={{ color: COLORS.ember, flex: 'none' }} />
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.04, letterSpacing: '-0.025em', margin: 0 }}>
            Where Will You Get In?
          </h1>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.55, margin: '12px 0 0', color: COLORS.faded, maxWidth: 620 }}>
          Pick a test. Answer ten hard, real-style questions. We’ll match your score to a shortlist of schools, from the admissions test that gets you there.
        </p>

        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {EXAM_ORDER.map((key) => {
            const e = EXAMS[key];
            return (
              <a
                key={key}
                href={`/${key}`}
                style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: COLORS.ink, background: T.white, border: `1.5px solid ${COLORS.faded}33`, borderLeft: `5px solid ${COLORS.ember}`, borderRadius: 10, padding: '18px 20px' }}
              >
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>{e.label}</span>
                  <span style={{ display: 'block', fontSize: 13.5, color: COLORS.faded, marginTop: 3, fontWeight: 500 }}>{e.tagline}</span>
                  <span style={{ display: 'block', fontSize: 12, color: COLORS.faded, marginTop: 6, letterSpacing: '0.04em' }}>
                    10 questions · ranked {e.payoffNoun} payoff{typeof views[key] === 'number' ? ` · ${views[key].toLocaleString()} ${views[key] === 1 ? 'view' : 'views'}` : ''}
                  </span>
                </span>
                <ArrowRight size={20} strokeWidth={2.5} style={{ color: COLORS.ember, flex: 'none' }} />
              </a>
            );
          })}
        </div>

        {/* ── LSAT Logic Games (analytical reasoning) — School Tests ── */}
        <div style={{ marginTop: 44 }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', minHeight: 156, backgroundImage: "url('/qhero-logic.svg')", backgroundSize: 'cover', backgroundPosition: 'right center', backgroundColor: '#14294d' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(12,26,55,0.88) 0%, rgba(12,26,55,0.55) 44%, rgba(12,26,55,0.05) 100%)' }} />
            <div style={{ position: 'relative', padding: '22px 24px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bcd2ff' }}>School Tests</span>
              <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '7px 0 0', color: T.white }}>LSAT Logic Games</h2>
              <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.5, margin: '9px 0 0', color: '#dbe6fb', maxWidth: 440 }}>The LSAT's classic analytical reasoning puzzles: read the setup and rules, then answer. Ten original games, from sequencing to grouping.</p>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {LOGIC_GAMES.map((g) => (
              <a
                key={g.id}
                href={`/quiz/${g.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: COLORS.ink, background: T.white, border: `1.5px solid ${COLORS.faded}33`, borderLeft: `5px solid ${COLORS.ember}`, borderRadius: 10, padding: '15px 20px' }}
              >
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>{g.name}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: COLORS.faded, marginTop: 3, fontWeight: 500 }}>LSAT analytical reasoning</span>
                </span>
                <ArrowRight size={20} strokeWidth={2.5} style={{ color: COLORS.ember, flex: 'none' }} />
              </a>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: COLORS.faded, margin: '24px 0 0', lineHeight: 1.5 }}>
          Questions are original, written in each test’s style. School rankings draw on U.S. News & World Report (2025–26 / 2026). For fun only, not admissions advice.
        </p>
      </div>

      <Footer />
    </div>
  );
}
