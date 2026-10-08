import Link from 'next/link';
import Grain from '@/app/Grain';
import Footer from '@/app/Footer';
import { T } from '@/lib/theme';

export const metadata = {
  title: 'Thanks for submitting | Mind Loft',
  robots: { index: false, follow: true },
};

export default function ThanksPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.surface,
        color: T.ink,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Grain />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 720,
          margin: '0 auto',
          padding: '80px 20px 60px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Manrope, monospace',
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: T.accent,
            marginBottom: 14,
          }}
        >
          Received
        </div>
        <h1
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(42px, 10vw, 84px)',
            lineHeight: 0.9,
            letterSpacing: '-0.015em',
            margin: 0,
            color: T.ink,
            fontVariationSettings: '"SOFT" 100',
          }}
        >
          Thanks for your
          <br />
          <span style={{ fontStyle: 'italic', color: T.accent }}>submission</span>
        </h1>
        <p
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontStyle: 'italic',
            fontSize: 19,
            lineHeight: 1.5,
            margin: '24px auto 0',
            color: T.slate,
            maxWidth: 520,
          }}
        >
          Your list is in the queue for review. An editor will take a look and publish it shortly. Once it goes live, it shows up on the Lists page like any other list.
        </p>
        <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/lists"
            style={{
              background: T.ink,
              color: T.surface,
              border: `1.5px solid ${T.ink}`,
              padding: '12px 22px',
              fontFamily: 'Manrope, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: `3px 3px 0 ${T.accent}`,
            }}
          >
            Back to all lists
          </Link>
          <Link
            href="/submit"
            style={{
              background: 'transparent',
              color: T.ink,
              border: `1.5px solid ${T.ink}`,
              padding: '12px 22px',
              fontFamily: 'Manrope, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Submit another
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
