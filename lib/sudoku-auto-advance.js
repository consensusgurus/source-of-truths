// Auto-advance for the sudoku-family grids (owner, 2026-10-02).
//
// After a digit is entered into the SELECTED square (number pad or keyboard),
// the selection moves on to the next empty square. It is ON by default, and a
// player who prefers to work out of order turns it off with the "Auto-move"
// tool under the pad. History: it shipped on, came off for everyone on
// 2026-09-26 after one solver complained the jump fought them, and came back
// as a default-on preference so both kinds of solver are served.
//
// ONE preference for every grid, not one per game: someone who turns it off
// on Suds does not want to find it on again in Cages. Stored in localStorage
// under sot_sudoku_autoadvance ('0' = off; absent or anything else = on), and
// every mounted hook follows a change made in another tab or another grid.
//
// Digit-first placement (a number armed, then squares tapped) never moves the
// selection either way: there the player is already choosing every square.
import { useCallback, useEffect, useState } from 'react';

const KEY = 'sot_sudoku_autoadvance';
const EVT = 'sot-sudoku-autoadvance';

export function readAutoAdvance() {
  try { return window.localStorage.getItem(KEY) !== '0'; } catch { return true; }
}

export function useAutoAdvance() {
  // Starts true on the server and the first client paint (the default), then
  // reads the stored choice in an effect so hydration never disagrees.
  const [on, setOn] = useState(true);
  useEffect(() => {
    const sync = () => setOn(readAutoAdvance());
    sync();
    const onStorage = (e) => { if (!e || e.key === null || e.key === KEY) sync(); };
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', onStorage); };
  }, []);
  const toggle = useCallback(() => {
    const next = !readAutoAdvance();
    try { window.localStorage.setItem(KEY, next ? '1' : '0'); } catch {}
    setOn(next);
    try { window.dispatchEvent(new Event(EVT)); } catch {}
  }, []);
  return [on, toggle];
}
