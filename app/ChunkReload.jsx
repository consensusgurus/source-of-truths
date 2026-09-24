'use client';

// ONE RELOAD WHEN A CHUNK GOES MISSING (2026-09-23).
//
// Every deploy changes the hashed chunk names, and skew protection routes an
// old page's chunks to the deployment that built them for a bounded window
// only. Anyone holding HTML fetched before that window closed (a tab left
// open, and above all Googlebot, which fetches HTML and renders it hours or
// days later) then fails on the first dynamic import with a ChunkLoadError.
// In Google's renderer that crash unmounted the whole document, head
// included, so it indexed an empty shell with no title, no canonical and no
// links, and filed 193 pages as duplicates of other sites' empty shells
// (URL Inspection, 23 Sep 2026: /list/best-gins canonicalised to a casino).
//
// The honest recovery is a fresh load: new HTML carries the current chunk
// names. Guarded to one reload per path per minute in sessionStorage so a
// genuinely broken build cannot loop, and only for chunk and CSS-chunk
// failures, never for ordinary errors.

import { useEffect } from 'react';

const KEY = 'sot_chunk_reload';
const WINDOW_MS = 60 * 1000;

export function isChunkError(err) {
  if (!err) return false;
  const name = err.name || '';
  const msg = String(err.message || err.reason?.message || err || '');
  return (
    name === 'ChunkLoadError' ||
    /Loading (CSS )?chunk [\w-]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg)
  );
}

export function reloadOnce() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  let last = null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) last = JSON.parse(raw);
  } catch {}
  const now = Date.now();
  if (last && last.path === path && now - last.at < WINDOW_MS) return false;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ path, at: now }));
  } catch {}
  window.location.reload();
  return true;
}

export default function ChunkReload() {
  useEffect(() => {
    const onError = (e) => {
      if (isChunkError(e.error || e)) reloadOnce();
    };
    const onRejection = (e) => {
      if (isChunkError(e.reason)) reloadOnce();
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
