'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Grain from '@/app/Grain';
import { T } from '@/lib/theme';

// Local theme palette (live-site look), shadowing the magazine COLORS so the
// public site is untouched.
const COLORS = {
  cream: T.surface, paper: T.white, ink: T.ink, faded: T.muted,
  ember: T.accent, forest: T.success, rust: '#b45309', line: 'rgba(20,22,28,0.30)',
};

export default function LoginClient() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else if (res.status === 401) {
        setError('That password is not correct');
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="adt"
      style={{
        minHeight: '100vh',
        background: COLORS.cream,
        color: COLORS.ink,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .adt [style*="border:"]{border-radius:10px;}
        .adt ::placeholder{color:${COLORS.faded};}
      ` }} />
      <Grain />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 480,
          margin: '0 auto',
          padding: '80px 20px',
        }}
      >
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: COLORS.ember,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Editorial Access
        </div>
        <h1
          style={{
            fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(40px, 9vw, 64px)',
            lineHeight: 0.92,
            letterSpacing: '-0.03em',
            margin: 0,
            color: COLORS.ink,
            fontVariationSettings: '"SOFT" 100',
            textAlign: 'center',
          }}
        >
          Editor's
          <br />
          <span style={{ fontStyle: 'italic', color: COLORS.ember }}>desk</span>
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 48,
            background: COLORS.paper,
            border: `1px solid ${COLORS.line}`,
            padding: 24,
          }}
        >
          <label
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: COLORS.faded,
              marginBottom: 6,
              display: 'block',
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${COLORS.line}`,
              padding: '10px 0',
              fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
              fontSize: 20,
              color: COLORS.ink,
              outline: 'none',
              fontVariationSettings: '"SOFT" 100',
            }}
          />

          {error && (
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 14,
                color: COLORS.ember,
                marginTop: 14,
                marginBottom: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              marginTop: 24,
              width: '100%',
              background: COLORS.ink,
              color: COLORS.cream,
              border: `1px solid ${COLORS.line}`,
              padding: '14px',
              fontFamily: 'DM Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              boxShadow: `3px 3px 0 ${COLORS.ember}`,
              opacity: loading || !password ? 0.5 : 1,
            }}
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
