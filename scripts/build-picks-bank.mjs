// scripts/build-picks-bank.mjs: deals the Picks bank (app/picks/puzzles.js)
// out of the retired Dealer, Agent and Curator banks.
//
//   node scripts/build-picks-bank.mjs <from YYYY-MM-DD> <to YYYY-MM-DD>
//
// Re-running REWRITES the file from <from>, keeping every day before it as it
// is (a live board is never re-dealt). Each item is used once across the whole
// bank. The rules it deals to are the ones scripts/verify-picks.mjs checks:
//   ab pairs     the two prices at least 18% apart and no more than 8x
//   last pair    the day's closest call: 18% to 80% apart
//   chain        the item on top keeps it at least once a day, and the day
//                ends on top higher than it started
//   over/under   a round line 20% to 60% away from the price, either side
//   tags         three prices each at least 1.5x apart, all within 30x
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const FROM = process.argv[2], TO = process.argv[3];
if (!/^\d{4}-\d{2}-\d{2}$/.test(FROM || '') || !/^\d{4}-\d{2}-\d{2}$/.test(TO || '')) { console.error('usage: build-picks-bank.mjs FROM TO'); process.exit(1); }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const pool = [];
for (const key of ['dealer', 'agent', 'curator']) {
  const { PUZZLES } = await import(pathToFileURL(path.join(root, `app/${key}/puzzles.js`)).href);
  for (const p of PUZZLES) pool.push({ ref: p.quizId, key, price: Number(p.price), live: p.live, lot: p.kind === 'auction' });
}
const bankFile = path.join(root, 'app/picks/puzzles.js');
let kept = [];
if (fs.existsSync(bankFile)) {
  const { PUZZLES } = await import(pathToFileURL(bankFile).href + '?t=' + Date.now());
  kept = PUZZLES.filter((p) => p.live < FROM);
}
const used = new Set();
for (const p of kept) for (const r of [p.start, ...p.chain, p.ou.ref, ...p.tags]) used.add(r);

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const START_MAX = 6000000;   // the day opens on something under $60,000
const ratio = (a, b) => Math.max(a, b) / Math.min(a, b);
const LINES = [];
for (let e = 0; e <= 8; e++) for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8]) LINES.push(Math.round(m * 10 ** e * 100));

function dealDay(seed, avail) {
  const R = rng(seed);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  for (let t = 0; t < 200000; t++) {
    const free = avail.filter((x) => !x.taken);
    const take = new Set();
    const grab = (cands) => { const c = cands.filter((x) => !take.has(x.ref)); if (!c.length) return null; const x = pick(c); take.add(x.ref); return x; };
    const start = grab(free.filter((x) => x.price <= START_MAX)); if (!start) return null;
    const chain = [];
    let holder = start, holds = 0, ok = true;
    for (let c = 0; c < 4; c++) {
      const last = c === 3;
      const cand = free.filter((x) => { const r = ratio(x.price, holder.price); return last ? (r >= 1.18 && r <= 1.8) : (r >= 1.18 && r <= 8); });
      const ch = grab(cand); if (!ch) { ok = false; break; }
      chain.push(ch);
      if (holder.price >= ch.price) holds++; else holder = ch;
    }
    if (!ok || holds < 1 || holder.price <= start.price) continue;
    const five = [start, ...chain];
    if (new Set(five.map((x) => x.key)).size < 2 || five.filter((x) => x.lot).length > 2) continue;
    const ouItem = grab(free); if (!ouItem) continue;
    const lines = LINES.filter((L) => { const r = ratio(L, ouItem.price); return r >= 1.2 && r <= 1.6; });
    if (!lines.length) continue;
    const line = pick(lines);
    const tags = [];
    for (let k = 0; k < 3; k++) {
      const cand = free.filter((x) => tags.every((y) => ratio(x.price, y.price) >= 1.5 && ratio(x.price, y.price) <= 30));
      const it = grab(cand); if (!it) { ok = false; break; }
      tags.push(it);
    }
    if (!ok) continue;
    if (new Set(tags.map((x) => x.key)).size < 2) continue;
    // Tag chips in a shuffled order that is never the items' own order.
    let order = [0, 1, 2];
    for (let s = 0; s < 10 && order.every((v, k) => v === k); s++) order = [0, 1, 2].sort(() => R() - 0.5);
    if (order.every((v, k) => v === k)) order = [2, 0, 1];
    for (const x of [start, ...chain, ouItem, ...tags]) x.taken = true;
    return { start: start.ref, chain: chain.map((x) => x.ref), ou: { ref: ouItem.ref, line }, tags: tags.map((x) => x.ref), tagOrder: order };
  }
  return null;
}

// Fresh items first: the never-played days of the retired banks, then the rest.
const avail = pool.filter((x) => !used.has(x.ref));
const days = [];
for (let d = new Date(`${FROM}T12:00:00Z`); d <= new Date(`${TO}T12:00:00Z`); d = new Date(d.getTime() + 86400000)) days.push(d.toISOString().slice(0, 10));
const out = kept.slice();
let num = kept.length ? Math.max(...kept.map((p) => p.num)) : 0;
for (const iso of days) {
  const fresh = avail.filter((x) => !x.taken && x.live >= iso);
  const seed = Number(iso.replace(/-/g, ''));
  let deal = fresh.length >= 30 ? dealDay(seed, fresh) : null;
  if (!deal) deal = dealDay(seed + 7, avail);
  if (!deal) { console.error(`could not deal ${iso}`); process.exit(1); }
  num += 1;
  const [y, m, d] = iso.split('-').map(Number);
  out.push({ num, quizId: `picks-${m}-${d}-${String(y).slice(2)}`, live: iso, dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, ...deal });
}

const head = fs.readFileSync(path.join(here, 'picks-bank-header.txt'), 'utf8');
const body = out.map((p) => `  ${JSON.stringify(p)},`).join('\n');
fs.writeFileSync(bankFile, `${head}\nexport const PUZZLES = [\n${body}\n];\n`);
console.log(`picks bank: ${out.length} days, ${out.length - kept.length} dealt, ${pool.length - avail.length + out.slice(kept.length).length * 10} items used of ${pool.length}`);
