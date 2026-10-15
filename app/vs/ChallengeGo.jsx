'use client';
import { useEffect } from 'react';
import { captureRef } from '@/lib/referrals';
import { recordOpen } from '@/lib/challenge-client';
// A person is sent straight on to the board. A link-preview crawler runs no
// script, stays on the landing page, and reads its metadata, which is the only
// reason this page exists.
export default function ChallengeGo({ href, gameKey = null, cid = null }) {
  // The sender's ?ref= is stored before the page is left: this effect runs before
  // the layout's VisitorBeacon, so leaving it to the beacon could lose the credit.
  // The open is recorded here, not on the server render, because a link-preview
  // crawler loads the page too and would count as somebody taking it.
  useEffect(() => {
    try { captureRef(); } catch (e) { /* no credit, still play */ }
    try { if (gameKey && cid) recordOpen(gameKey, cid); } catch (e) { /* the sender just won't see it */ }
    if (href) window.location.replace(href);
  }, [href, gameKey, cid]);
  return null;
}
