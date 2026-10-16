'use client';

// GATE LANDING. Pressing Start on a daily's start gate brings the board into
// view (owner, 2026-10-15).
//
// The gate sits where the board goes. With "Show detailed instructions" open
// the gate runs long, so the Start button is well down the page, and the
// player has scrolled down to reach it. Start swaps the gate for the board in
// the same spot, but the page stays where it was, so the player lands below
// the board's head (or past the whole board on a phone).
//
// Mounted once from StageChrome (stage pages) and DailyChrome (the older
// frame), so one edit covers every daily: a single document-level click
// listener, no change to the 120-odd game clients. It keys off the shared
// .stg-gate class every gate carries.
//
// How it tells Start from the other buttons in the gate (the instructions
// toggle): it does not read labels. It waits two frames and asks whether the
// gate is still in the document. Start removes it; the toggle does not.
//
// Landing: centred under the header when the board fits on screen, top-aligned
// under the header when it is taller than the screen. Left alone when the board
// is already fully in view, so a short gate pressed at the top of the page does
// not twitch. Run twice (two frames, then a beat later) because the header
// collapses once the clock starts and scroll anchoring can shift the page on
// the swap. Instant, not smooth: html carries scroll-behavior:smooth and a
// glide through a board that just appeared reads worse than arriving.

import { useEffect } from 'react';

const GAP = 12;

function headerOffset() {
  // Only a header that actually stays on screen covers the board. Stage pages
  // have none today, so this is normally 0.
  try {
    const head = document.querySelector('.qchm');
    if (head) {
      const pos = getComputedStyle(head).position;
      if (pos === 'sticky' || pos === 'fixed') return Math.max(0, head.getBoundingClientRect().bottom);
    }
  } catch (x) { /* fall through */ }
  return 0;
}

function findBoard(scope) {
  if (!scope || !scope.isConnected) return null;
  return scope.querySelector('.stg-board, .loft-card') || scope.firstElementChild || null;
}

function land(board) {
  try {
    if (!board || !board.isConnected) return;
    const vh = window.innerHeight;
    const off = headerOffset();
    const r = board.getBoundingClientRect();
    if (r.top >= off && r.bottom <= vh) return; // already fully in view
    const avail = vh - off - GAP * 2;
    const lead = r.height < avail ? (avail - r.height) / 2 : 0;
    const max = Math.max(0, document.documentElement.scrollHeight - vh);
    const y = Math.min(max, Math.max(0, Math.round(window.scrollY + r.top - off - GAP - lead)));
    if (Math.abs(y - window.scrollY) < 2) return;
    try { window.scrollTo({ top: y, behavior: 'instant' }); }
    catch (x) { window.scrollTo(0, y); }
  } catch (x) { /* older Safari: leaving the scroll alone beats throwing */ }
}

export default function GateLanding() {
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target && e.target.closest ? e.target.closest('button') : null;
      const gate = btn ? btn.closest('.stg-gate') : null;
      if (!gate) return;
      const scope = gate.parentElement;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (gate.isConnected) return; // the instructions toggle, not Start
        land(findBoard(scope));
        setTimeout(() => land(findBoard(scope)), 180);
      }));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
