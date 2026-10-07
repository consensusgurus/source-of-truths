'use client';
import { useEffect } from 'react';
// A person is sent straight on to the board. A link-preview crawler runs no
// script, stays on the landing page, and reads its metadata, which is the only
// reason this page exists.
export default function ChallengeGo({ href }) {
  useEffect(() => { if (href) window.location.replace(href); }, [href]);
  return null;
}
