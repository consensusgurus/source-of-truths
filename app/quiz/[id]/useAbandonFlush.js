import { useEffect, useRef } from 'react';

// Best-effort recording of a quiz left in progress.
//
// The normal result POST only fires when a game finishes (all answers found,
// timer expired, gave up / struck out). If the player navigates away mid-quiz
// (back button, tab/window close, in-app link), the finish handler never runs
// and the attempt is otherwise lost. This hook posts the in-progress result on
// page exit so the abandoned attempt still registers as a normal play.
//
// getPayload() is called at exit time and must return the POST body to send, or
// a falsy value when there is nothing to flush (quiz not started, already
// finished, already flushed, or not the first attempt). It runs on the LATEST
// render's closure, so it always reads current score/elapsed.
//
// Delivery uses navigator.sendBeacon (which survives the page being torn down),
// falling back to a keepalive fetch. `pagehide` is the trigger rather than
// `visibilitychange` so a brief tab-switch-and-return does not record a false
// abandon for someone who comes back and finishes.
//
// Returns { markFlushed } so the normal finish path can mark the game as
// already-recorded and suppress the exit post (preventing a double count).
export default function useAbandonFlush(getPayload) {
  const getRef = useRef(getPayload);
  getRef.current = getPayload;
  const doneRef = useRef(false);

  useEffect(() => {
    const flush = () => {
      if (doneRef.current) return;
      let payload = null;
      try { payload = getRef.current && getRef.current(); } catch (e) { payload = null; }
      if (!payload) return;
      doneRef.current = true;
      const body = JSON.stringify(payload);
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          if (navigator.sendBeacon('/api/quiz/result', blob)) return;
        }
      } catch (e) { /* fall through to fetch */ }
      try {
        fetch('/api/quiz/result', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body,
        }).catch(() => {});
      } catch (e) { /* nothing more to do on exit */ }
    };
    window.addEventListener('pagehide', flush);
    // Tells app/VersionGuard.jsx a game is in progress, so it never reloads
    // the page under a player (that would file this attempt as abandoned).
    const probe = () => {
      if (doneRef.current) return false;
      try { return !!(getRef.current && getRef.current()); } catch (e) { return false; }
    };
    const set = (window.__sotInPlay = window.__sotInPlay || new Set());
    set.add(probe);
    return () => { window.removeEventListener('pagehide', flush); set.delete(probe); };
  }, []);

  return { markFlushed: () => { doneRef.current = true; } };
}
