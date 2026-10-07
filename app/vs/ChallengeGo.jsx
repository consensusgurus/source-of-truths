'use client';
import { useEffect } from 'react';
import { captureRef } from '@/lib/referrals';
// A person is sent straight on to the board. A link-preview crawler runs no
// script, stays on the landing page, and reads its metadata, which is the only
// reason this page exists.
export default function ChallengeGo({ href }) {
  // The sender's ?ref= is stored before the page is left: this effect runs before
  // the layout's VisitorBeacon, so leaving it to the beacon could lose the credit.
  useEffect(() => { try { captureRef(); } catch (e) { /* no credit, still play */ } if (href) window.location.replace(href); }, [href]);
  return null;
}
