// scripts/verify-picks.mjs: the Picks bank (app/picks/puzzles.js), the middle
// of Price Check. Recomputes every rule in the bank's header from the rows the
// refs point at, using lib/picks.js's own chain: never trusts a stored field.
//   node scripts/verify-picks.mjs
import path from 'path';
import { pathToFileURL } from 'url';
import { chainOf, gradePicks, PICK_KINDS, PICKS_MAX, crowdCode, readCrowdCode } from '../lib/picks.js';
import { shipFor } from '../lib/price-ship.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fails = [];
const banks = {};
for (const k of ['dealer', 'agent', 'curator']) banks[k] = (await import(pathToFileURL(path.join(root, `app/${k}/puzzles.js`)).href)).PUZZLES;
const { PUZZLES } = await import(pathToFileURL(process.env.VERIFY_PICKS_BANK || path.join(root, 'app/picks/puzzles.js')).href);
const rowOf = (ref) => { const k = String(ref).split('-')[0]; const b = banks[k]; const p = b && b.find((x) => x.quizId === ref); return p ? { k, p } : null; };
const ratio = (a, b) => Math.max(a, b) / Math.min(a, b);
const ROUND = new Set();
for (let e = 0; e <= 8; e++) for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8]) ROUND.add(Math.round(m * 10 ** e * 100));

if (!Array.isArray(PUZZLES) || !PUZZLES.length) fails.push('empty bank');
const seen = new Map();
let prev = null;
for (const d of PUZZLES || []) {
  const id = `picks #${d.num} ${d.live}`;
  const bad = (m) => fails.push(`${id}: ${m}`);
  const [y, m, dd] = String(d.live).split('-').map(Number);
  if (d.quizId !== `picks-${m}-${dd}-${String(y).slice(2)}`) bad(`quizId ${d.quizId} does not match live`);
  if (d.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) bad('dateLabel does not match live');
  if (prev) {
    if (d.num !== prev.num + 1) bad('num does not follow');
    if (Date.parse(d.live) - Date.parse(prev.live) !== 86400000) bad('live does not follow the day before');
  }
  prev = d;
  if ('sunday' in d) bad('Picks has no Sunday Edition; drop the field');
  const refs = [d.start, ...(d.chain || []), d.ou && d.ou.ref, ...(d.tags || [])];
  if (!Array.isArray(d.chain) || d.chain.length !== 4) bad('chain must hold four challengers');
  if (!Array.isArray(d.tags) || d.tags.length !== 3) bad('tags must hold three items');
  const items = {};
  for (const r of refs) {
    const hit = rowOf(r);
    if (!hit) { bad(`ref ${r} is not a Dealer, Agent or Curator row`); continue; }
    const ship = shipFor(hit.k, hit.p);
    if (!ship || !ship.name || !(ship.imgs && ship.imgs[0] && ship.imgs[0].src)) bad(`ref ${r} ships no name or photo`);
    if (!Number.isInteger(hit.p.price) || hit.p.price <= 0) bad(`ref ${r} has no integer-cent price`);
    items[r] = { ...ship, price: hit.p.price, key: hit.k, lot: hit.p.kind === 'auction' };
    if (seen.has(r)) bad(`ref ${r} already used on ${seen.get(r)}`); else seen.set(r, d.live);
  }
  if (fails.length && !items[d.start]) continue;
  const day = { start: items[d.start], chain: d.chain.map((r) => items[r]), ou: { item: items[d.ou.ref], line: d.ou.line }, tags: d.tags.map((r) => items[r]) };
  if ([day.start, ...day.chain, day.ou.item, ...day.tags].some((x) => !x)) continue;
  if (day.start.price > 6000000) bad('opens on something over $60,000');
  const ab = chainOf(day).filter((c) => c.kind === 'ab');
  ab.forEach((c, n) => {
    const r = ratio(c.top.price, c.bot.price);
    const last = n === ab.length - 1;
    if (r < 1.18) bad(`pick ${c.i + 1}: ${c.top.name} vs ${c.bot.name} are within 18%`);
    if (!last && r > 8) bad(`pick ${c.i + 1}: more than 8x apart`);
    if (last && r > 1.8) bad(`pick ${c.i + 1}: the last pair is more than 80% apart`);
  });
  if (!ab.some((c) => c.win === 'top')) bad('the item on top never keeps it');
  if (!(ab[ab.length - 1].winner.price > day.start.price)) bad('the day does not end higher than it started');
  const five = [day.start, ...day.chain];
  if (new Set(five.map((x) => x.key)).size < 2) bad('opener and challengers all from one bank');
  if (five.filter((x) => x.lot).length > 2) bad('more than two auction lots in the chain');
  if (!ROUND.has(d.ou.line)) bad(`over/under line ${d.ou.line} is not a round number`);
  const lr = ratio(d.ou.line, day.ou.item.price);
  if (lr < 1.2 || lr > 1.6) bad(`over/under line is ${Math.round((lr - 1) * 100)}% off the price (20 to 60)`);
  for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
    const r = ratio(day.tags[a].price, day.tags[b].price);
    if (r < 1.5) bad(`tags ${a + 1} and ${b + 1} within 1.5x`);
    if (r > 30) bad(`tags ${a + 1} and ${b + 1} more than 30x apart`);
  }
  if (new Set(day.tags.map((x) => x.key)).size < 2) bad('tags all from one bank');
  const o = d.tagOrder;
  if (!Array.isArray(o) || o.length !== 3 || [...o].sort().join() !== '0,1,2') bad('tagOrder is not a permutation of 0..2');
  else if (o.every((v, k) => v === k)) bad('tagOrder deals the tags in the items\' own order');
  // The arithmetic: a perfect day is PICKS_MAX, and the crowd code round-trips.
  const perfect = PICK_KINDS.map((k, i) => (k === 'ab' ? chainOf(day)[i].win : k === 'ou' ? (day.ou.item.price > day.ou.line ? 'over' : 'under') : [0, 1, 2]));
  const g = gradePicks(day, perfect);
  if (g.score !== PICKS_MAX) bad(`a perfect day scores ${g.score}, not ${PICKS_MAX}`);
  const cc = readCrowdCode(crowdCode(day, perfect));
  if (!cc || cc.tags !== 3 || cc.calls.some((x) => !x)) bad('crowd code does not round-trip');
}
if (fails.length) { console.log(fails.map((f) => `FAIL ${f}`).join('\n')); console.log(`verify-picks: ${fails.length} failure(s)`); process.exit(1); }
console.log(`verify-picks: ${PUZZLES.length} boards ok (${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live})`);
