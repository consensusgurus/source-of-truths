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
      const yes = q !== 'off' && (w >= DEFAULT_MIN_W || (q === 'c' && w >= 1100));
      setOn(yes);
      // THE SPACE IS RESERVED BEFORE THE FRAME ARRIVES (owner, 2026-10-10:
      // "moving from the home page to a game page jitters"). The frame is
      // client-only and its chunk loads after first paint, so without this the
      // board painted full width and then jumped ~560px narrower when
      // LayoutCInner attached. lc-pre on <html> makes globals.css pad the game
      // root exactly as lc-on does. A full page load gets the class from the
      // inline script in app/layout.js before the body parses; this covers a
      // client navigation into a game, where that script never re-runs.
      document.documentElement.classList.toggle('lc-pre', yes);
    } catch (e) {}
    return () => { try { document.documentElement.classList.remove('lc-pre'); } catch (e) {} };
  }, []);
  return on ? <Inner gameKey={gameKey} /> : null;
}
