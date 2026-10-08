import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Grain from '@/app/Grain';
import Footer from '@/app/Footer';
import { T } from '@/lib/theme';

export default function LegalLayout({ kicker, title, italic, children, updated }) {
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
          padding: '24px 20px 60px',
        }}
      >
        <Link
          href="/"
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'Manrope, monospace',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: T.ink,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 0',
          }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back to Mind Loft
        </Link>

        <div style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 20, marginTop: 16, marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'Manrope, monospace',
              fontSize: 11,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: T.accent,
              marginBottom: 12,
            }}
          >
            {kicker}
          </div>
          <h1
            style={{
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(40px, 9vw, 84px)',
              lineHeight: 0.9,
              letterSpacing: '-0.015em',
              margin: 0,
              color: T.ink,
              fontVariationSettings: '"SOFT" 100',
            }}
          >
            {title}
            {italic && (
              <>
                <br />
                <span style={{ fontStyle: 'italic', color: T.accent }}>{italic}</span>
              </>
            )}
          </h1>
          {updated && (
            <div
              style={{
                marginTop: 16,
                fontFamily: 'Manrope, monospace',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: T.slate,
              }}
            >
              Last updated · {updated}
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 16,
            lineHeight: 1.7,
            color: T.ink,
          }}
        >
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Styled subheading for inside the body
export function H2({ children }) {
  return (
    <h2
      style={{
        fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
        fontWeight: 700,
        fontStyle: 'italic',
        fontSize: 26,
        margin: '36px 0 12px',
        color: T.ink,
        fontVariationSettings: '"SOFT" 100',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  );
}
