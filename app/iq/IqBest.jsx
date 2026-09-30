'use client';

// A reader's own best on one /iq test, read from this device. Renders nothing
// on the server and nothing for a test not yet taken, so the server HTML and
// the first client paint agree.
import { useEffect, useState } from 'react';

export default function IqBest({ slug }) {
  const [best, setBest] = useState(null);
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem('sot_iq_results') || '{}') || {};
      const r = all[slug] && all[slug].best;
      if (r && Number.isFinite(r.iq)) setBest(r);
    } catch (e) {}
  }, [slug]);
  if (!best) return null;
  return <span className="iqh-best">Your best · IQ {best.iq}</span>;
}
