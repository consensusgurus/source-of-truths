import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/app/Footer';
import { T } from '@/lib/theme';

export const metadata = {
  title: 'Sporcle Alternative: Free Trivia Quizzes, No Ads | Mind Loft',
  description:
    'Looking for Sporcle without the ads? Mind Loft is a fast, ad-free trivia quiz site with 1,100+ timed name-them-all, map, and matching quizzes, leaderboards, and a modern interface.',
  alternates: { canonical: '/sporcle-alternative' },
  openGraph: {
    title: 'A Sporcle Alternative With No Ads',
    description: 'Fast, ad-free trivia quizzes. Name-them-all, maps, and matching, with leaderboards and a modern interface.',
    url: '/sporcle-alternative',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: { card: 'summary_large_image', title: 'A Sporcle Alternative With No Ads', description: 'Fast, ad-free trivia quizzes with leaderboards and a modern interface.' },
};

const C = { bg: T.white, card: T.white, ink: T.ink, blue: T.accent, gold: '#2563eb', muted: T.muted, border: '#e5e7eb', green: T.success };
const F = "'Manrope', system-ui, -apple-system, sans-serif";

function Prop({ title, body }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 22px' }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 19, color: C.ink, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: F, fontSize: 15, lineHeight: 1.6, color: C.muted }}>{body}</div>
    </div>
  );
}

function Row({ label, us, them }) {
  return (
    <tr style={{ borderTop: `1px solid ${C.border}` }}>
      <td style={{ padding: '14px 12px', fontFamily: F, fontSize: 15, color: C.ink }}>{label}</td>
      <td style={{ padding: '14px 12px', textAlign: 'center', fontFamily: F, fontSize: 14, color: C.green, fontWeight: 700 }}>{us}</td>
      <td style={{ padding: '14px 12px', textAlign: 'center', fontFamily: F, fontSize: 14, color: C.muted }}>{them}</td>
    </tr>
  );
}

export default function SporcleAlternativePage() {
  const headQuizzes = [
    ['countries-of-the-world', 'Name Every Country in the World'],
    ['world-capitals', 'Name the Capital of Every Country'],
    ['flags-of-the-world', 'Name Every Country From Its Flag'],
    ['most-common-english-words', 'The 100 Most Common English Words'],
  ];
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 6, background: 'linear-gradient(90deg,#0b0d12,#233a63 55%,#2563eb)' }} />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 820, margin: '0 auto', padding: '28px 20px 64px' }}>
        <Link href="/" style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: C.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to Mind Loft
        </Link>

        <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 24, marginTop: 16, marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.blue, fontWeight: 700, marginBottom: 14 }}>The Quizzes</div>
          <h1 style={{ fontFamily: F, fontWeight: 800, fontSize: 'clamp(38px, 8vw, 74px)', lineHeight: 1.0, letterSpacing: '-0.02em', margin: 0, color: C.ink }}>
            Trivia without<br /><span style={{ color: C.blue }}>the ad circus.</span>
          </h1>
          <p style={{ fontFamily: F, fontSize: 18, lineHeight: 1.6, color: C.muted, maxWidth: 640, marginTop: 22 }}>
            If you came looking for Sporcle without the ads, you found it. Mind Loft has everything you liked about the classic quiz sites, name-them-all, beat-the-clock, climb-the-leaderboard, on a fast, clean page with zero ads in your way.
          </p>
          <Link href="/#sty-quizzes" style={{ display: 'inline-flex', marginTop: 24, fontFamily: F, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '14px 28px', borderRadius: 10, background: C.blue, color: T.white, textDecoration: 'none' }}>
            Browse the quizzes
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 44 }}>
          <Prop title="No ads. None." body="No slide-ins, no video roadblocks, no pop-up eating your last ten seconds on a timed quiz. Just the quiz." />
          <Prop title="Built this decade." body="A fast, modern interface that works on your phone and doesn't freeze your browser with a few tabs open." />
          <Prop title="1,100+ quizzes and counting." body="Geography, sports, movies, music, history, and the deep cuts, with new ones added constantly." />
        </div>

        <h2 style={{ fontFamily: F, fontWeight: 800, fontSize: 28, color: C.ink, margin: '0 0 8px', letterSpacing: '-0.01em' }}>How it compares</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 44 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}></th>
              <th style={{ textAlign: 'center', padding: '12px', fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.blue, fontWeight: 800 }}>Mind Loft</th>
              <th style={{ textAlign: 'center', padding: '12px', fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>The old quiz sites</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Ads between you and the quiz" us="None" them="Slide-ins, video, banners" />
            <Row label="Timed quizzes interrupted by ads" us="Never" them="A common complaint" />
            <Row label="Page speed" us="Fast" them="Often sluggish" />
            <Row label="Interface" us="Modern, mobile-first" them="Dated" />
            <Row label="Leaderboards and stats" us="Yes" them="Yes" />
            <Row label="Price" us="Free" them="Free (with ads)" />
          </tbody>
        </table>

        <h2 style={{ fontFamily: F, fontWeight: 800, fontSize: 28, color: C.ink, margin: '0 0 16px', letterSpacing: '-0.01em' }}>Start with a classic</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 16 }}>
          {headQuizzes.map(([id, title]) => (
            <Link key={id} href={`/quiz/${id}`} style={{ textDecoration: 'none', color: C.ink, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 16px', display: 'block' }}>
              <div style={{ fontFamily: F, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.blue, fontWeight: 800, marginBottom: 6 }}>Quiz</div>
              <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
            </Link>
          ))}
        </div>

        <p style={{ fontFamily: F, fontSize: 16, lineHeight: 1.7, color: C.muted, marginTop: 28 }}>
          Pick a quiz, start the clock, and play start to finish with nothing in the way. <Link href="/#sty-quizzes" style={{ color: C.blue, fontWeight: 700 }}>See all the quizzes</Link>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
