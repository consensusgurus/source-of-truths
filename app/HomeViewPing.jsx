'use client';

import { useEffect } from 'react';

// Counts a visit to the homepage in the per-quiz view analytics, under the
// pseudo quiz id 'home'. Deduped to once per browser session. This effect
// lived in QuizHomeClient; the homepage now renders the stage directly
// (app/page.js), so it moved here to keep the count running.
export default function HomeViewPing() {
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('sot-quizhome-viewed') === '1';
      if (!seen) sessionStorage.setItem('sot-quizhome-viewed', '1');
    } catch (e) { /* sessionStorage unavailable: count this load */ }
    if (!seen) {
      fetch('/api/quiz/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: 'home' }),
      }).catch(() => {});
    }
  }, []);
  return null;
}
