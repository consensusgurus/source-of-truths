// scripts/verify-carmen.mjs: checks app/carmen/puzzles.js, the Carmen bank,
// recomputing every rule from the rows rather than trusting the generator.
//
//   node scripts/verify-carmen.mjs
//
// Per case:
//   - num runs 1..N, live runs one day at a time, quizId and dateLabel match live;
//   - `sunday` is true exactly on Sundays, and the leg count is LEGS_BY_DOW
//     (six on a Sunday: the Sunday Edition proves its own scaling);
//   - leg tiers match TIERS_BY_DOW within one step (the generator's fallback);
//   - every city in the case is distinct, every hop is >= MIN_HOP_KM and
//     crosses a border;
//   - coordinates in range; three tips per leg, 110 to 240 characters;
//   - no tip names its city; tips 1 and 2 never name the country;
//   - no em or en dash, no British spelling in reader-facing text;
//   - no leg is the same day's Ping city.
//   - from TRIP_BLOCK_FROM no city (start or leg) is the day's Passport trip city
//     or in a country that trip can stamp (scripts/carmen-trip-block.mjs).
// Across the bank (variety ceiling):
//   - no city returns within GAP_DAYS days, as a start or a leg;
//   - no city appears more than MAX_USES times in the whole bank;
//   - the suspect and the stolen object never repeat on consecutive days.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LEGS_BY_DOW, TIERS_BY_DOW, kmBetween } from '../lib/carmen-engine.js';
import { blockedOn } from './carmen-trip-block.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { PUZZLES } = await import('file://' + path.join(ROOT, 'app/carmen/puzzles.js'));
const MIN_HOP_KM = 800, GAP_DAYS = 14, MAX_USES = 4;
const BRIT = /\b(colour|harbour|centre|metre|kilometre|theatre|favourite|travell|practis|neighbour|flavour|labour|honour|grey|jewellery|organis|realis|recognis)/i;
const PROPER_OK = /(Bolshoi Theatre|Giraffe Centre|Lekki Conservation Centre|[A-Z][a-z]+ Centre\b|[A-Z][a-z]+ Theatre\b|\S+ Harbour\b)/g;
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dow = (s) => new Date(s + 'T12:00:00Z').getUTCDay();
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const ping = {};
{
  const src = fs.readFileSync(path.join(ROOT, 'app/ping/puzzles.js'), 'utf8');
  const re = /live:\s*'(\d{4}-\d{2}-\d{2})'[\s\S]*?city:\s*'([^']+)'/g;
  let m; while ((m = re.exec(src))) ping[m[1]] = fold(m[2]);
}

let bad = 0;
const fail = (p, msg) => { bad++; console.log(`✗ carmen #${p.num} ${p.live}: ${msg}`); };
const lastUse = {}, uses = {};
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) fail(p, `num ${p.num}, expected ${i + 1}`);
  if (i && p.live !== addDays(PUZZLES[i - 1].live, 1)) fail(p, 'live is not the day after the previous case');
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `carmen-${m}-${d}-${String(y).slice(2)}`) fail(p, `quizId ${p.quizId}`);
  if (p.dateLabel !== `${MON[m - 1]} ${d}, ${y}`) fail(p, `dateLabel ${p.dateLabel}`);
  const wd = dow(p.live);
  if (p.sunday !== (wd === 0)) fail(p, 'sunday flag does not match the weekday');
  if (p.legs.length !== LEGS_BY_DOW[wd]) fail(p, `${p.legs.length} legs, want ${LEGS_BY_DOW[wd]}`);
  if (p.sunday && p.legs.length <= LEGS_BY_DOW[1]) fail(p, 'Sunday Edition is not longer than a weekday');
  if (!p.title || !p.suspect || !p.stolen) fail(p, 'case file incomplete');
  for (const s of [p.title, p.suspect, p.stolen]) if (/[–—]/.test(s)) fail(p, 'dash in case file');
  const all = [p.start, ...p.legs];
  const names = new Set();
  all.forEach((c, k) => {
    const [lon, lat] = c.ll;
    if (!(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90)) fail(p, `${c.name} coordinates out of range`);
    if (names.has(c.name)) fail(p, `${c.name} twice in one case`);
    if (blockedOn(p.live, c.name)) fail(p, `${c.name} is on the day's Passport trip (city or a stampable country)`);
    names.add(c.name);
    if (k) {
      const prev = all[k - 1];
      const km = kmBetween(prev.ll, c.ll);
      if (km < MIN_HOP_KM) fail(p, `${prev.name} to ${c.name} is ${Math.round(km)} km`);
      if (prev.name.split(', ').pop() === c.name.split(', ').pop()) fail(p, `${prev.name} to ${c.name} stays in one country`);
    }
    const key = c.name;
    if (lastUse[key] && (Date.parse(p.live) - Date.parse(lastUse[key])) / 864e5 < GAP_DAYS) fail(p, `${key} returns ${lastUse[key]} -> ${p.live}, inside ${GAP_DAYS} days`);
    lastUse[key] = p.live;
    uses[key] = (uses[key] || 0) + 1;
  });
  p.legs.forEach((L, k) => {
    const want = TIERS_BY_DOW[wd][k];
    if (want != null && Math.abs(L.tier - want) > 1) fail(p, `${L.name} tier ${L.tier}, want ${want}`);
    if (ping[p.live] && fold(L.name.split(',')[0]) === ping[p.live]) fail(p, `${L.name} is the same day's Ping city`);
    if (!Array.isArray(L.tips) || L.tips.length !== 3) { fail(p, `${L.name} needs three tips`); return; }
    const [city, country] = L.name.split(', ');
    L.tips.forEach((t, j) => {
      if (t.length < 110 || t.length > 240) fail(p, `${city} tip ${j + 1} is ${t.length} chars`);
      if (/[–—]/.test(t)) fail(p, `${city} tip ${j + 1} has a dash`);
      if (fold(t).includes(fold(city))) fail(p, `${city} tip ${j + 1} names the city`);
      if (j < 2 && fold(t).includes(fold(country))) fail(p, `${city} tip ${j + 1} names the country`);
      if (BRIT.test(t.replace(PROPER_OK, ''))) fail(p, `${city} tip ${j + 1} British spelling`);
    });
  });
  if (i) {
    if (p.suspect === PUZZLES[i - 1].suspect) fail(p, 'same suspect two days running');
    if (p.stolen === PUZZLES[i - 1].stolen) fail(p, 'same loot two days running');
  }
});
// VARIETY (owner, 2026-11-08: "they almost all seem to have the same structure
// with currency first"). From 2026-11-09: no Evidence tip leads with money,
// money shows up in at most ~55% of Evidence tips, and no opening (first two
// words) starts more than 8% of the cities' tips in the same slot.
const VARIETY_FROM = '2026-11-09';
const MONEY = /\b(currency|coins?|notes?|banknotes?|bills?|cash|change|dollars?|euros?|pesos?|rupees?|rupiah|yen|yuan|won|baht|dong|ringgit|francs?|pounds?|lira|dinars?|dirhams?|riyals?|rials?|shillings?|naira|rand|kwacha|birr|leva|lev|lei|krona|kronor|krone|kroner|zloty|forint|koruna|soles?|reais|real|colones|quetzales|bolivianos|tenge|tugrik|ngultrum|kina|kip|taka|kyat|riel|rubles?|hryvnia|lari|dram|manat)\b/i;
const seenCity = {};
PUZZLES.filter((p) => p.live >= VARIETY_FROM).forEach((p) => p.legs.forEach((L) => { seenCity[L.id] = L; }));
const cities = Object.values(seenCity);
if (cities.length) {
  let money = 0;
  const opens = [{}, {}, {}];
  cities.forEach((L) => {
    const ev = L.tips[0];
    const m = ev.match(MONEY);
    if (m) { money++; if (m.index < 40) { bad++; console.log(`✗ carmen: ${L.name} Evidence tip leads with money ("${m[0]}")`); } }
    L.tips.forEach((t, j) => { const o = t.toLowerCase().split(/\s+/).slice(0, 2).join(' '); opens[j][o] = (opens[j][o] || 0) + 1; });
  });
  if (money / cities.length > 0.55) { bad++; console.log(`✗ carmen: money in ${money} of ${cities.length} Evidence tips (ceiling 55%)`); }
  const cap = Math.max(4, Math.ceil(cities.length * 0.08));
  opens.forEach((o, j) => Object.entries(o).forEach(([w, n]) => { if (n > cap) { bad++; console.log(`✗ carmen: tip ${j + 1} opens "${w}" in ${n} of ${cities.length} cities (ceiling ${cap})`); } }));
}
// CURRENCY MIX (owner, 2026-11-13: "more of the clues should reference a
// currency. doesn't have to, but mix more in"). Across the pool, 55% to 80% of
// cities name the local money somewhere in their three tips, and it is not
// all in the Evidence slot: at least a third of those cities carry it in the
// Witness or Informant tip. The lead rule above still holds.
{
  const POOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/carmen-pool.json'), 'utf8'));
  const CUR = /\b(euros?|euro coins?|dollars?|pounds?|pesos?|rupees?|rupiah|yen|yuan|won|baht|dong|ringgit|francs?|lira|dinars?|dirhams?|riyals?|rials?|shillings?|naira|rand|kwacha|birr|lei|kronor|krone|kroner|kr\u00f3nur|zloty|korunas?|soles|reais|quetzal|balboa|bolivianos|tenge|t\u00f6gr\u00f6g|ngultrum|kip|rubles?|cedis|som|ariary|meticais|baisa|toonie)\b/i;
  let any = 0, late = 0;
  POOL.forEach((c) => { const hit = c.tips.map((t) => CUR.test(t)); if (hit.some(Boolean)) { any++; if (hit[1] || hit[2]) late++; } });
  const share = any / POOL.length;
  if (share < 0.55 || share > 0.8) { bad++; console.log(`✗ carmen: currency in ${any} of ${POOL.length} pool cities (want 55% to 80%)`); }
  if (late / any < 1 / 3) { bad++; console.log(`✗ carmen: only ${late} of ${any} currency cities carry it in the Witness or Informant tip (want a third)`); }
  console.log(`carmen: currency in ${any} of ${POOL.length} pool cities, ${late} in a later tip`);
}
for (const [k, n] of Object.entries(uses)) if (n > MAX_USES) { bad++; console.log(`✗ carmen: ${k} used ${n} times (ceiling ${MAX_USES})`); }

if (bad) { console.log(`\ncarmen: ${bad} problem(s) in ${PUZZLES.length} cases`); process.exit(1); }
console.log(`carmen: ${PUZZLES.length} cases OK (${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ${PUZZLES.filter((p) => p.sunday).length} Sunday Editions)`);
