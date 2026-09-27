'use client';

import { useLayoutEffect } from 'react';
import { SNAP_JS, SNAP_ATTR } from '@/lib/home-snapshot';
import { onrampMap } from '@/lib/home-snapshot-onramp';

// THE LAST KNOWN PAGE'S BOX (see lib/home-snapshot.js). On a full load the
// inline scripts in app/page.js have already filled it before React runs; the
// empty dangerouslySetInnerHTML is what stops hydration from touching those
// children. On a client-side navigation to "/" no inline script runs, so the
// layout effect does the same two steps before the first paint.
export default function HomeSnapBox() {
  useLayoutEffect(() => {
    const H = document.documentElement;
    const box = document.getElementById('sot-snap');
    if (box && !box.firstChild && !H.hasAttribute(SNAP_ATTR)) {
      try {
        if (!window.__sotSnap) new Function(SNAP_JS)();
        window.__sotSnap('pre');
        window.__sotSnap('fill', onrampMap());
      } catch (e) {
        H.removeAttribute(SNAP_ATTR);
      }
    }
    return () => { try { H.removeAttribute(SNAP_ATTR); } catch (e) {} };
  }, []);
  return <div id="sot-snap" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: '' }} />;
}
