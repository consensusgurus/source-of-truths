'use client';

// THE PAGE WAITS FOR ITS OWN STATE (owner, 2026-10-24: "the old load screen
// for a second", then "same issue site wide", e.g. Chomp's long instructions
// flashing). Every daily is server-rendered with default state: the start gate,
// a fresh board, the full how-to. The real state (a returning player's short
// gate, an in-progress board, a finished game) only arrives once the client
// has read localStorage in an effect, so the first paint showed the wrong
// screen for as long as the JavaScript took to load.
//
// This stamps <html data-sot-hyd> a few frames AFTER the page has hydrated and
// its effects have re-rendered, and app/globals.css keeps the gate and the
// board (and any [data-sot-wait] run page) invisible until then. On a
// client-side navigation the stamp comes off before the new page paints and
// goes back on the same way. A CSS fallback shows everything after 3s if this
// never runs, and a <noscript> rule in the layout shows it with no JS at all.
import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function HydrationMark() {
  const path = usePathname();
  const first = useRef(true);
  useIso(() => {
    const el = document.documentElement;
    if (!first.current) el.removeAttribute('data-sot-hyd');
    first.current = false;
    let a = 0, b = 0, c = 0;
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => {
        c = requestAnimationFrame(() => el.setAttribute('data-sot-hyd', ''));
      });
    });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); cancelAnimationFrame(c); };
  }, [path]);
  return null;
}
