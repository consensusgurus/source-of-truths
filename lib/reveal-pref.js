'use client';

// HIDDEN UNTIL ASKED FOR, AND REMEMBERED (owner, 2026-10-13). Players said the
// running clock and the live standings made them nervous, so on the DAILY
// puzzles each of these starts hidden and is one tap away:
//
//   clock        the elapsed time in the figures row          (StageChrome)
//   leader       who is winning today, on the status strip    (StageChrome)
//   leaderboard  the full standings: the right panel's Board
//                tab on desktop, the rankings panel on a phone (LayoutCInner,
//                StageChrome)
//
// A choice STAYS until the player flips it back: it is kept in localStorage
// for the whole site (every game, every day), and every mounted control is
// told when it changes, so the phone strip and the desktop panel can never
// disagree. Hidden is the first paint on the server and the client alike; the
// stored choice arrives in an effect, so there is no hydration mismatch.
//
// Display only. Nothing here touches what is recorded, scored or ranked.

import { useCallback, useEffect, useState } from 'react';

export const REVEAL = {
  clock: 'sot_clock_shown',
  leader: 'sot_leader_shown',
  leaderboard: 'sot_board_shown',
};

const EVT = 'sot-reveal';

function readPref(key) {
  try { return window.localStorage.getItem(key) === '1'; } catch (e) { return false; }
}

export function useRevealPref(key) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const read = () => setShown(readPref(key));
    read();
    const onStorage = (e) => { if (!e || !e.key || e.key === key) read(); };
    window.addEventListener(EVT, read);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVT, read);
      window.removeEventListener('storage', onStorage);
    };
  }, [key]);
  const set = useCallback((next) => {
    setShown(!!next);
    try {
      if (next) window.localStorage.setItem(key, '1');
      else window.localStorage.removeItem(key);
      window.dispatchEvent(new Event(EVT));
    } catch (e) {}
  }, [key]);
  const toggle = useCallback(() => set(!readPref(key)), [key, set]);
  return [shown, toggle, set];
}
