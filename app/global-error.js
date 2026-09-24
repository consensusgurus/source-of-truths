'use client';

// LAST-RESORT BOUNDARY (2026-09-23). This only renders when the ROOT LAYOUT
// itself throws; every other error is caught by app/error.js with the layout
// intact. Next's default here is an empty <html id="__next_error__">, which
// is precisely the shell Google was indexing. This one at least names the
// site and declares a canonical for the path, so a crawler that lands on it
// files the URL under its own address rather than under a stranger's.

import { isChunkError, reloadOnce } from './ChunkReload';

export default function GlobalError({ error, reset }) {
  const href =
    typeof window !== 'undefined'
      ? `https://mindloftdaily.com${window.location.pathname}`
      : 'https://mindloftdaily.com/';
  if (typeof window !== 'undefined' && isChunkError(error)) reloadOnce();

  return (
    <html lang="en">
      <head>
        <title>Mind Loft | Sharpen Your Mind</title>
        <link rel="canonical" href={href} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Manrope, "DM Sans", system-ui, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 16px',
          }}
        >
          <div style={{ maxWidth: 440, textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Mind Loft</h1>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: '0 0 20px', opacity: 0.8 }}>
              Something went wrong loading this page. A refresh usually clears it.
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
      </body>
    </html>
  );
}
