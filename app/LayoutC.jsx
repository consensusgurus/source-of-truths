'use client';

// THE GATE for Layout C, the desktop game page (on by default from 1280px). Mounted from StageTail on every
// daily page, so it must cost nothing without the flag: no hooks that fetch,
// and the frame itself (app/LayoutCInner.jsx) is a separate chunk loaded only
// when the flag is present on a desktop-width window.
import { useEffect, useLayoutEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Read before paint, so a client switch between games never paints a frame
// with the panels gone.
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Below this the centre column gets too narrow for the widest boards.
const DEFAULT_MIN_W = 1280;

const Inner = dynamic(() => import('./LayoutCInner'), { ssr: false, loading: () => null });

export default function LayoutC({ gameKey }) {
  const [on, setOn] = useState(false);
  useIso(() => {
    try {
      // DEFAULT ON at desktop width (owner, 2026-10-09: "push it to the main
      // domains"). ?layout=c forces it down to 1100px, ?layout=off turns it off.
      const q = new URLSearchParams(window.location.search).get('layout');
      const w = window.innerWidth;
      setOn(q !== 'off' && (w >= DEFAULT_MIN_W || (q === 'c' && w >= 1100)));
    } catch (e) {}
  }, []);
  return on ? <Inner gameKey={gameKey} /> : null;
}
