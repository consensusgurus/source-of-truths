// verify-premiere-queue: the one-a-day new-game pop-up queue (lib/premiere-queue.js), discovered by
// scripts/verify-all.mjs. Plays a returning browser forward day by day against the real PREMIERES list
// and checks the owner's rule of 2026-11-14: one card a day, oldest launch first, nothing lost.
import { premiereQueue, premiereOpen, QUEUE_FROM, QUEUE_DAYS } from '../lib/premiere-queue.js';
import { PREMIERES, NO_PREMIERE, DAILY_GAME_MAP } from '../lib/daily-games.js';
let fails = 0;
const bad = (m) => { fails++; console.log('✗ ' + m); };
const ok = (k) => !!DAILY_GAME_MAP[k] && !NO_PREMIERE.has(k);
const add = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
for (const p of PREMIERES) {
  if (!DAILY_GAME_MAP[p.key]) bad(`${p.key} is in PREMIERES and not a live daily`);
  if (!(p.from <= p.until)) bad(`${p.key}: from ${p.from} is after until ${p.until}`);
}
// a browser that sees one card a day from `start` and never plays any of them
function walk(start, played = new Set()) {
  const seen = [], stamped = new Set();
  for (let n = 0; n < 60; n++) {
    const day = add(start, n), q = premiereQueue(PREMIERES, day, ok).filter((k) => !stamped.has(k) && !played.has(k));
    if (q.length) { stamped.add(q[0]); seen.push([day, q[0]]); }
  }
  return seen;
}
const day = '2026-11-15';
const seen = walk(day);
const want = ['mop', 'chef', 'pack', 'seated', 'bag', 'errands'].filter((k) => PREMIERES.some((p) => p.key === k));
const got = seen.map((x) => x[1]).filter((k) => want.includes(k));
if (got.join() !== want.join()) bad(`from ${day} the cards run ${got.join(', ')}, expected ${want.join(', ')}`);
if (new Set(seen.map((x) => x[0])).size !== seen.length) bad('two cards on one day');
for (let i = 1; i < seen.length; i++) {
  const a = PREMIERES.find((p) => p.key === seen[i - 1][1]).from, b = PREMIERES.find((p) => p.key === seen[i][1]).from;
  if (a > b && b > seen[i - 1][0]) continue; // a launch that had not happened yet
  if (a > b && seen[i - 1][0] >= b) bad(`${seen[i][1]} (${b}) was shown after the newer ${seen[i - 1][1]} (${a})`);
}
// every launch still in its queue life on `day` gets a card in the end
for (const p of PREMIERES) if (ok(p.key) && p.from >= QUEUE_FROM && p.from <= day && !seen.some((x) => x[1] === p.key)) bad(`${p.key} never got a card`);
// a played game is skipped without costing a day
const skip = walk(day, new Set(['mop']));
if (skip[0] && (skip[0][0] !== day || skip[0][1] === 'mop')) bad('a played game held up the queue');
// the queue life ends
const late = PREMIERES.filter((p) => p.from >= QUEUE_FROM)[0];
if (late && premiereOpen(late, add(late.from, QUEUE_DAYS + Math.max(1, 6)))) { if (add(late.from, QUEUE_DAYS + 6) > late.until) bad(`${late.key} is still open ${QUEUE_DAYS + 6} days on`); }
if (late && !premiereOpen(late, add(late.from, QUEUE_DAYS))) bad(`${late.key} closed before day ${QUEUE_DAYS}`);
console.log(fails ? `${fails} failure(s)` : `verify-premiere-queue: ok (${seen.slice(0, 6).map((x) => `${x[0].slice(5)} ${x[1]}`).join(', ')})`);
process.exit(fails ? 1 : 0);
