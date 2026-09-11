// Math Dash: Blitz for kids. Ten sums a day, generated from the day's number
// so every kid who opens it sees the same ten in the same order. No bank to
// run out. Ramp inside the run: four additions up to 10, three subtractions
// within 10 (never below zero), three mixed sums up to 20. Weekends add one
// doubling question in place of the last mixed sum. Nothing here is a timed
// elimination: three hearts, a miss costs one, the run ends on the tenth sum
// or the third miss, and the score is how many were right.
import { seeded } from './kids-daily.js';

export function mathDashFor(dayNum, weekend = false) {
  const rand = seeded(`kids-mathdash-${dayNum}`);
  const ri = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
  const qs = [];
  const seen = new Set();
  const push = (a, op, b) => {
    const key = `${a}${op}${b}`;
    if (seen.has(key)) return false;
    seen.add(key);
    qs.push({ a, op, b, ans: op === '+' ? a + b : op === '-' ? a - b : a * b });
    return true;
  };
  while (qs.length < 4) { const a = ri(1, 9); const b = ri(1, 10 - a); push(a, '+', b); }
  while (qs.length < 7) { const a = ri(2, 10); const b = ri(1, a - 1); push(a, '-', b); }
  while (qs.length < 10) {
    if (weekend && qs.length === 9) { const a = ri(2, 10); push(a, '×', 2); continue; }
    if (rand() < 0.5) { const a = ri(5, 15); const b = ri(1, 20 - a); push(a, '+', b); }
    else { const a = ri(10, 20); const b = ri(1, a - 1); push(a, '-', b); }
  }
  return qs;
}
