'use client';

// THE GATE for Layout C (hidden, ?layout=c). Mounted from StageTail on every
// daily page, so it must cost nothing without the flag: no hooks that fetch,
// and the frame itself (app/LayoutCInner.jsx) is a separate chunk loaded only
// when the flag is present on a desktop-width window.
import { useEffect, useLayoutEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Read before paint, so a client switch between games never paints a frame
// with the panels gone.
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const Inner = dynamic(() => import('./LayoutCInner'), { ssr: false, loading: () => null });

export default function LayoutC({ gameKey }) {
  const [on, setOn] = useState(false);
  useIso(() => {
    try {
      setOn(new URLSearchParams(window.location.search).get('layout') === 'c' && window.innerWidth >= 1100);
    } catch (e) {}
  }, []);
  return on ? <Inner gameKey={gameKey} /> : null;
}
