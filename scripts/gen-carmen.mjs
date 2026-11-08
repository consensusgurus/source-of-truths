// scripts/gen-carmen.mjs: builds app/carmen/puzzles.js, the Carmen bank, from
// the reviewed city pool in scripts/carmen-pool.json.
//
//   node scripts/gen-carmen.mjs [--to YYYY-MM-DD]
//
// Deterministic (seeded off the date) and APPEND-ONLY: a board whose live date
// is today or earlier (Eastern) is copied from the existing bank untouched, so
// a rerun never rewrites a case a player has seen.
//
// The rules a case is built to (verify-carmen.mjs checks every one):
//   - legs and tiers per weekday from lib/carmen-engine.js (Sunday: six legs,
//     the harder tiers, `sunday: true`);
//   - every city in a case is distinct; each hop (start to leg 1, leg to leg)
//     is at least MIN_HOP_KM and crosses a border (different country);
//   - no city returns, as a start or a leg, within GAP_DAYS of its last use;
//   - no leg is the same day's Ping city (same-day spoiler rule);
//   - the suspect and the stolen object rotate so no two days in a row match.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LEGS_BY_DOW, TIERS_BY_DOW, kmBetween } from '../lib/carmen-engine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/carmen-pool.json'), 'utf8'));
const OUT = path.join(ROOT, 'app/carmen/puzzles.js');
export const FIRST = '2026-11-08';
const TO = (process.argv.includes('--to') ? process.argv[process.argv.indexOf('--to') + 1] : null) || '2026-12-13';
export const MIN_HOP_KM = 800;
export const GAP_DAYS = 14;

// Original cast and loot (owner: original case, characters and art; nothing
// from any existing franchise).
export const SUSPECTS = ['The Magpie', 'The Silver Fox', 'Lady Lark', 'The Velvet Glove', 'Madame Moth', 'The Jackdaw', 'The Night Heron'];
export const LOOT = [
  'a gilded astrolabe', 'a jeweled music box', 'a silver sextant', 'a first-edition atlas', 'an emerald brooch',
  'a golden pocket watch', 'a sapphire tiara', 'a bronze telescope', 'an antique brass globe', 'a ruby-studded compass',
  'a jade chess set', 'a pearl necklace', 'a rare stamp album', 'a crystal decanter', 'an ivory-handled fan',
  'a diamond hatpin', 'a medieval map scroll', 'a gold-leaf manuscript', 'a carved amber box', 'a porcelain nightingale',
  'a silver tea service', 'an opal ring', 'a ship captain’s log', 'a lacquered snuffbox', 'a gold coronation coin',
];

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dow = (s) => new Date(s + 'T12:00:00Z').getUTCDay();
const quizId = (s) => { const [y, m, d] = s.split('-').map(Number); return `carmen-${m}-${d}-${String(y).slice(2)}`; };
const label = (s) => { const [y, m, d] = s.split('-').map(Number); return `${MON[m - 1]} ${d}, ${y}`; };
const titleCase = (s) => s.replace(/^(a|an) /, '').replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const seedOf = (s) => s.split('').reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const ll = (c) => [c.lon, c.lat];

function pingCities() {
  const src = fs.readFileSync(path.join(ROOT, 'app/ping/puzzles.js'), 'utf8');
  const out = {};
  const re = /live:\s*'(\d{4}-\d{2}-\d{2})'[\s\S]*?city:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) out[m[1]] = m[2].toLowerCase();
  return out;
}

async function existing() {
  if (!fs.existsSync(OUT)) return [];
  const mod = await import('file://' + OUT + '?t=' + Date.now());
  return mod.PUZZLES || [];
}

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); } catch (e) { return iso(new Date()); }
}

export function buildDay(day, lastUsed, prev, ping) {
  const d = dow(day);
  const legsN = LEGS_BY_DOW[d], tiers = TIERS_BY_DOW[d];
  for (let attempt = 0; attempt < 400; attempt++) {
    const r = rng(seedOf(day) + attempt * 7919);
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const free = (c) => !lastUsed[c.id] || (Date.parse(day) - Date.parse(lastUsed[c.id])) / 864e5 >= GAP_DAYS;
    const usedToday = new Set();
    const startPool = POOL.filter((c) => free(c));
    if (!startPool.length) continue;
    const start = pick(startPool);
    usedToday.add(start.id);
    const legs = [];
    let at = start, ok = true;
    for (let i = 0; i < legsN; i++) {
      const want = tiers[i];
      const cand = POOL.filter((c) => !usedToday.has(c.id) && free(c) && c.country !== at.country
        && kmBetween(ll(at), ll(c)) >= MIN_HOP_KM && (!ping || c.name.toLowerCase() !== ping));
      let pool = cand.filter((c) => c.tier === want);
      if (!pool.length) pool = cand.filter((c) => Math.abs(c.tier - want) === 1);
      if (!pool.length) { ok = false; break; }
      const c = pick(pool);
      legs.push(c); usedToday.add(c.id); at = c;
    }
    if (!ok) continue;
    let suspect = pick(SUSPECTS), loot = pick(LOOT);
    if (prev && suspect === prev.suspect) suspect = SUSPECTS[(SUSPECTS.indexOf(suspect) + 1) % SUSPECTS.length];
    if (prev && loot === prev.stolenRaw) loot = LOOT[(LOOT.indexOf(loot) + 1) % LOOT.length];
    return { start, legs, suspect, loot };
  }
  throw new Error(`gen-carmen: no case fits ${day}; widen the pool`);
}

function row(num, day, c) {
  const city = (x) => ({ name: `${x.name}, ${x.country}`, ll: [x.lon, x.lat] });
  return {
    num, quizId: quizId(day), live: day, dateLabel: label(day), sunday: dow(day) === 0,
    title: `The Stolen ${titleCase(c.loot)}`, suspect: c.suspect,
    stolen: c.loot[0].toUpperCase() + c.loot.slice(1),
    start: city(c.start),
    legs: c.legs.map((x) => ({ ...city(x), id: x.id, tier: x.tier, tips: x.tips })),
  };
}

async function main() {
  const today = etToday();
  const old = await existing();
  const frozen = old.filter((p) => p.live <= today);
  const ping = pingCities();
  const lastUsed = {};
  const byName = new Map(POOL.map((c) => [`${c.name}, ${c.country}`, c.id]));
  const out = [];
  let prev = null;
  for (const p of frozen) {
    out.push(p);
    for (const x of [p.start, ...p.legs]) { const id = byName.get(x.name); if (id) lastUsed[id] = p.live; }
    prev = { suspect: p.suspect, stolenRaw: p.stolen.toLowerCase() };
  }
  let day = out.length ? addDays(out[out.length - 1].live, 1) : FIRST;
  while (day <= TO) {
    const c = buildDay(day, lastUsed, prev, ping[day]);
    const p = row(out.length + 1, day, c);
    out.push(p);
    for (const x of [c.start, ...c.legs]) lastUsed[x.id] = day;
    prev = { suspect: c.suspect, stolenRaw: c.loot };
    day = addDays(day, 1);
  }
  const head = `// Carmen, the daily globe chase (launched 2026-11-08). Imported ONLY by the
// server page (app/carmen/page.js), which filters live <= today before handing
// the bank to the client. GENERATED by scripts/gen-carmen.mjs from the reviewed
// pool in scripts/carmen-pool.json; edit those, not this. The past is frozen:
// the generator copies every board already live.
//
// A row is one case:
//   title, suspect, stolen   the case file (original cast and loot)
//   start                    the crime scene, { name: 'City, Country', ll: [lon, lat] }
//   legs                     five cities (six on a Sunday), each { name, ll, id, tier, tips }
//   tips                     [Evidence, Witness, Informant], easiest last; every tip
//                            points to the CITY, not just its country (owner, 2026-11-08)
//   sunday                   true on Sundays: the Sunday Edition, a sixth leg from the
//                            harder tiers (lib/carmen-engine.js TIERS_BY_DOW)
// Scoring and the catch radius live in lib/carmen-engine.js.
`;
  fs.writeFileSync(OUT, head + 'export const PUZZLES = ' + JSON.stringify(out, null, 1) + ';\n');
  console.log(`gen-carmen: ${out.length} cases (${frozen.length} frozen), ${out[0].live} to ${out[out.length - 1].live}`);
}

if (import.meta.url === 'file://' + process.argv[1]) main();
