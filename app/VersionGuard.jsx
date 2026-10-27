'use client';

// NO TAB STAYS ON AN OLD DEPLOYMENT (owner, 2026-10-27: "initial load of page
// shows an old version ... all over the place").
//
// The HTML is never the problem: every page is served no-store or
// max-age=0,must-revalidate, so a real page load always gets the live build.
// What goes stale is a tab that is ALREADY OPEN when a deploy lands:
//   - a tab left open, or a phone tab Safari restores from memory,
//   - the installed home-screen app, which resumes for days without reloading,
//   - a page restored from the back/forward cache,
// and from there every in-app link is a client-side navigation. Vercel Skew
// Protection is ON (the dpl= on every asset), so those navigations are served
// by the OLD deployment on purpose, chunks and server render both. The tab
// therefore keeps showing the old site, page after page, until someone hard
// refreshes. That is the "old version" people see.
//
// This compares the build the running JavaScript was compiled from
// (NEXT_PUBLIC_SOT_BUILD, the commit sha, inlined by next.config.js) with the
// live one (/api/version). On a mismatch:
//   1. On RESUME (tab comes back to the foreground, or a bfcache restore) the
//      page reloads straight away, unless a game is in progress.
//   2. Otherwise the NEXT in-app link becomes a full page load, so the next
//      page arrives from the live build. A programmatic navigation
//      (router.push) is caught after the fact and reloaded in place.
// It never reloads under a game in progress: useAbandonFlush registers every
// board in window.__sotInPlay, and a reload there would file an abandoned
// attempt. One reload per target build per two minutes, so a CDN still
// propagating can never loop it.

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const BUILD = process.env.NEXT_PUBLIC_SOT_BUILD || '';
const KEY = 'sot_vg_reload';
const LOOP_MS = 2 * 60 * 1000;
const POLL_MS = 5 * 60 * 1000;
const MIN_GAP_MS = 20 * 1000;

let stale = '';        // the live build, once we know we are not it
let lastCheck = 0;

export function inPlay() {
  try {
    const probes = window.__sotInPlay;
    if (!probes) return false;
    for (const p of probes) { try { if (p()) return true; } catch {} }
  } catch {}
  return false;
}

function mayReload(target) {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const last = raw ? JSON.parse(raw) : null;
    if (last && last.to === target && Date.now() - last.at < LOOP_MS) return false;
    window.sessionStorage.setItem(KEY, JSON.stringify({ to: target, at: Date.now() }));
  } catch {}
  return true;
}

function hardGo(href) {
  if (!stale || !mayReload(stale)) return false;
  if (href) window.location.assign(href); else window.location.reload();
  return true;
}

async function check(force) {
  if (!BUILD) return '';
  const now = Date.now();
  if (!force && now - lastCheck < MIN_GAP_MS) return stale;
  lastCheck = now;
  try {
    const r = await fetch('/api/version', { cache: 'no-store' });
    const j = await r.json();
    if (j && j.v && j.v !== BUILD) stale = j.v;
  } catch {}
  return stale;
}

export default function VersionGuard() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!BUILD) return undefined;
    let hiddenAt = 0;
    const resume = async () => {
      if (await check(true)) { if (!inPlay()) hardGo(); }
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
      if (hiddenAt) resume();
    };
    const onShow = (e) => { if (e.persisted) resume(); };
    const onClick = (e) => {
      if (!stale || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (inPlay()) return; // let the soft navigation run; the path effect reloads after it
      if (mayReload(stale)) { e.preventDefault(); window.location.assign(url.href); }
    };
    check(true);
    const t = setInterval(() => { if (document.visibilityState === 'visible') check(false); }, POLL_MS);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onShow);
    document.addEventListener('click', onClick, true);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onShow);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  // A navigation that slipped past the click handler (router.push, or a click
  // made while a game was in progress) rendered on the old build: reload the
  // page it landed on. The previous page has unmounted, so no game is lost.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (stale && !inPlay()) hardGo();
    else check(false);
  }, [path]);

  return null;
}
