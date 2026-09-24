'use client';

// ROUTE ERROR BOUNDARY (2026-09-23). Until this file existed the site had no
// error boundary at all, so any client-side throw fell through to Next's
// built-in GlobalError, which REPLACES THE WHOLE DOCUMENT with
// <html id="__next_error__"> and an "Application error" line: no <title>,
// no canonical, no JSON-LD, no nav. Google indexes the rendered DOM, so a
// crash in its renderer turned a full page into an empty duplicate.
//
// A segment boundary keeps the root layout, and with it the head, the
// metadata and everything the crawler needs to file the page correctly.
// The panel below is what a reader sees instead; the layout around it is
// intact. A missing chunk (the crash Google actually hits) reloads once
// through the same guard ChunkReload uses.

import { useEffect } from 'react';
import { isChunkError, reloadOnce } from './ChunkReload';

export default function RouteError({ error, reset }) {
  useEffect(() => {
    if (isChunkError(error)) reloadOnce();
  }, [error]);

  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        fontFamily: 'Manrope, "DM Sans", system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>
          Something went wrong loading this page
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, margin: '0 0 20px', opacity: 0.8 }}>
          This usually clears with a refresh. Your saved progress is not affected.
        </p>
        <button
          type="button"
          onClick={() => (typeof window !== 'undefined' ? window.location.reload() : reset())}
          style={{
            font: 'inherit',
            fontWeight: 700,
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: '#2f6fe4',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Reload the page
        </button>
        <p style={{ marginTop: 18, fontSize: 13 }}>
          <a href="/" style={{ color: 'inherit' }}>Back to today&apos;s puzzles</a>
        </p>
      </div>
    </main>
  );
}
