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
// to the next most logical input"). After a digit lands, finish what you are
// on: of the row, column and box (or region) the square belongs to, take the
// one with the fewest empty squares left and move to its next empty square.
// Once all three are full, go to the empty square whose row, column and box
// are fullest. It only counts empty squares, which the player can see, so it
// never points at an answer the way a candidate count would.
// `open(i)` says whether square i still takes a digit; `regionOf(i)` names its
// box or region (null for a grid with rows and columns only, like Towers).
export function logicalNext(cs, open, from, side, regionOf = null) {
  const total = side * side;
  const units = [];
  for (let r = 0; r < side; r++) { const u = []; for (let c = 0; c < side; c++) u.push(r * side + c); units.push(u); }
  for (let c = 0; c < side; c++) { const u = []; for (let r = 0; r < side; r++) u.push(r * side + c); units.push(u); }
  if (regionOf) {
    const m = new Map();
    for (let i = 0; i < total; i++) { const k = regionOf(i); if (k == null || k < 0) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(i); }
    for (const u of m.values()) units.push(u);
  }
  const left = units.map((u) => u.reduce((n, i) => n + (open(i) ? 1 : 0), 0));
  const dist = (i) => (i - from + total) % total;
  let best = -1;
  units.forEach((u, k) => { if (left[k] > 0 && u.includes(from) && (best < 0 || left[k] < left[best])) best = k; });
  if (best >= 0) {
    let pick = -1;
    for (const i of units[best]) if (open(i) && (pick < 0 || dist(i) < dist(pick))) pick = i;
    return pick;
  }
  const mine = Array.from({ length: total }, () => []);
  units.forEach((u, k) => u.forEach((i) => mine[i].push(k)));
  let pick = -1, score = Infinity;
  for (let i = 0; i < total; i++) {
    if (!open(i)) continue;
    const sc = mine[i].reduce((a, k) => a + left[k], 0);
    if (sc < score || (sc === score && dist(i) < dist(pick))) { pick = i; score = sc; }
  }
  return pick;
}
