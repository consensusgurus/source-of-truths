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

// THE NEXT MOST LOGICAL SQUARE (owner, 2026-10-26: "cursor should always move
// to the next most logical input"; a player then reported "there is no
// pattern", because re-picking the emptiest unit after every digit flipped
// between row, column and box). So the cursor COMMITS to one line or box and
// walks it to the end before choosing again:
// 1. If the square just filled sits in the line or box the cursor was already
//    walking and that unit still has empties, keep walking it.
// 2. Otherwise pick, of the square's row, box and column (in that order on a
//    tie), the one with the fewest empties left, and walk it.
// 3. If all three are full, the next empty square in reading order.
// Walking a unit means its next empty square after this one: right along a
// row, down a column, reading order in a box. It only counts empty squares,
// which the player can see, so it never points at an answer.
// `open(i)` says whether square i still takes a digit; `regionOf(i)` names its
// box or region (null for rows and columns only, like Towers).
let walking = null; // { key, cells } of the unit being walked, one grid at a time
export function logicalNext(cs, open, from, side, regionOf = null) {
  const total = side * side;
  const r0 = Math.floor(from / side), c0 = from % side;
  const row = []; for (let c = 0; c < side; c++) row.push(r0 * side + c);
  const col = []; for (let r = 0; r < side; r++) col.push(r * side + c0);
  const units = [{ key: `${side}r${r0}`, cells: row }];
  if (regionOf) {
    const k = regionOf(from);
    if (k != null && k >= 0) { const box = []; for (let i = 0; i < total; i++) if (regionOf(i) === k) box.push(i); units.push({ key: `${side}b${k}`, cells: box }); }
  }
  units.push({ key: `${side}c${c0}`, cells: col });
  const left = (u) => u.cells.reduce((n, i) => n + (open(i) ? 1 : 0), 0);
  const after = (u) => { const at = u.cells.indexOf(from); for (let k = 1; k <= u.cells.length; k++) { const i = u.cells[(at + k) % u.cells.length]; if (open(i)) return i; } return -1; };
  if (walking) { const u = units.find((x) => x.key === walking.key); if (u && left(u) > 0) return after(u); }
  let best = null;
  for (const u of units) { const n = left(u); if (n > 0 && (!best || n < best.n)) best = { u, n }; }
  if (best) { walking = { key: best.u.key }; return after(best.u); }
  walking = null;
  for (let k = 1; k <= total; k++) { const i = (from + k) % total; if (open(i)) return i; }
  return -1;
}
