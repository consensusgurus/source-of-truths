#!/usr/bin/env node
// Ping bank extender. The city and its one-line story are editorial, so they
// are authored below in PICKS; everything else (num, quizId, live, dateLabel,
// sunday, coordinates) is derived, so it cannot drift from the atlas or the
// calendar. Coordinates are copied from lib/ping-cities.js, never retyped.
//
//   node scripts/gen-ping.mjs            (prints the new boards)
//   node scripts/gen-ping.mjs --write    (appends them to app/ping/puzzles.js)
//
// PICKS continue the bank one day at a time from the day after its last board.
// Rules the script enforces before writing (the verifier enforces them again):
// every city is in the atlas and not already banked, no country twice inside
// 10 days (across the segment seam too), blurb 15-130 characters with no em or en dash.
// Sundays are the out-of-the-way cities: order PICKS so they land there.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES } from '../lib/ping-cities.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'app/ping/puzzles.js');
const WRITE = process.argv.includes('--write');

// Segment authored 2026-11-12: 2026-12-01 (Tuesday) through 2026-12-31.
// (The 2026-11 segment is banked; its picks are in app/ping/puzzles.js.)
// Sundays (12-06, 12-13, 12-20, 12-27) are Ushuaia, Thimphu, Nuuk and Apia.
// Content review 2026-11-12 (dec-c2): rows swapped to clear same-day spoilers
// (Sofia/Chennai, Harare/Rotterdam, Hyderabad/Abu Dhabi) and eight blurbs
// rewritten so none names its own city or country.
// None is a Passport trip city (scripts/gen-passport-trips.mjs SCHEDULE).
const PICKS = [
  ['Ottawa', 'Canada', 'Each winter the Rideau Canal freezes into one of the largest naturally frozen skating rinks in the world.'],
  ['Riyadh', 'Saudi Arabia', 'This desert capital grew from a walled oasis town, and its mud-brick Masmak Fort, built around 1865, still stands.'],
  ['Cologne', 'Germany', 'Its twin-spired Gothic cathedral took more than 600 years to finish, from 1248 to 1880.'],
  ['Phnom Penh', 'Cambodia', 'It sits where the Mekong meets the Tonle Sap, a river that reverses its flow every year.'],
  ['Kinshasa', 'DR Congo', "It looks across the Congo River at Brazzaville, the capital of a different country."],
  ['Ushuaia', 'Argentina', 'Billed as the southernmost city in the world, it is the main port for ships sailing to Antarctica.'],
  ['Doha', 'Qatar', 'The Museum of Islamic Art, designed by I. M. Pei, stands on its own island off the Corniche.'],
  ['Sofia', 'Bulgaria', 'The gold-domed Alexander Nevsky Cathedral is one of the largest Orthodox cathedrals in the world.'],
  ['Chennai', 'India', 'Marina Beach, along the Bay of Bengal, is one of the longest urban beaches in the world.'],
  ['Brisbane', 'Australia', 'Capital of Queensland, built along a winding river of the same name, and host of the 2032 Summer Olympics.'],
  ['Guatemala City', 'Guatemala', 'On clear days the volcanoes Agua, Fuego and Acatenango are visible from the city.'],
  ['Ankara', 'Turkey', 'Chosen as the capital of a new republic in 1923, it holds the tomb of Ataturk.'],
  ['Thimphu', 'Bhutan', 'One of the few capitals in the world with no traffic lights; police direct the cars by hand.'],
  ['Harare', 'Zimbabwe', 'Known as Salisbury until 1982, two years after the country won its independence.'],
  ['Tashkent', 'Uzbekistan', 'Its metro, opened in 1977, is famed for stations decorated like palaces.'],
  ['Santo Domingo', 'Dominican Republic', 'Founded in the 1490s, it is the oldest continuously inhabited European settlement in the Americas.'],
  ['Nagoya', 'Japan', 'Its castle roof is topped by two golden shachihoko, tiger-headed fish said to ward off fire.'],
  ['Rotterdam', 'Netherlands', 'The busiest port in Europe, rebuilt after 1940 with a skyline of bold modern architecture.'],
  ['Valparaiso', 'Chile', 'Its steep hillsides are linked to the port by funicular elevators, some more than a century old.'],
  ['Nuuk', 'Greenland', "Home to about a third of the island's people, set on a fjord facing the Labrador Sea."],
  ['Baku', 'Azerbaijan', 'At about 90 feet below sea level on the Caspian, it is the lowest-lying national capital.'],
  ['Hyderabad', 'India', 'The Charminar, a four-arched monument built in 1591, stands at the heart of its old city.'],
  ['Abu Dhabi', 'United Arab Emirates', 'A Gulf capital, home to the Sheikh Zayed Grand Mosque and its huge hand-knotted carpet.'],
  ['Winnipeg', 'Canada', 'The black bear that inspired Winnie-the-Pooh was named after this city.'],
  ['Rovaniemi', 'Finland', 'Sitting on the Arctic Circle, it bills itself as the official hometown of Santa Claus.'],
  ['Kampala', 'Uganda', 'Built on a cluster of hills near the northern shore of Lake Victoria.'],
  ['Apia', 'Samoa', 'Its country jumped across the International Date Line in 2011, skipping December 30 entirely.'],
  ['Bratislava', 'Slovakia', 'The only national capital that borders two other countries, Austria and Hungary.'],
  ['Arequipa', 'Peru', 'Called the White City for the pale volcanic stone of its buildings, with El Misti looming above.'],
  ['Kuwait City', 'Kuwait', 'Three slender towers studded with blue and green steel discs, opened in 1979, rise from its seafront.'],
  ['Kingston', 'Jamaica', 'Bob Marley lived and recorded here, and his home on Hope Road is now a museum.'],
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const { PUZZLES } = await import(FILE);
const byKey = new Map(CITIES.map((c) => [`${c.name}|${c.country}`, c]));
const banked = new Set(PUZZLES.map((p) => `${p.city}|${p.country}`));
const last = PUZZLES[PUZZLES.length - 1];
let day = new Date(last.live + 'T12:00:00Z');
const out = [];
const errs = [];
PICKS.forEach(([city, country, blurb], i) => {
  day = new Date(day.getTime() + 86400000);
  const live = day.toISOString().slice(0, 10);
  const [y, m, d] = live.split('-').map(Number);
  const key = `${city}|${country}`;
  const c = byKey.get(key);
  if (!c) errs.push(`${key} not in atlas`);
  if (banked.has(key)) errs.push(`${key} already banked`);
  banked.add(key);
  if (blurb.length < 15 || blurb.length > 130) errs.push(`${key} blurb length ${blurb.length}`);
  if (/[—–]/.test(blurb)) errs.push(`${key} dash in blurb`);
  const near = [...PUZZLES, ...out].slice(-10).find((p) => p.country === country); // across the seam too
  if (near) errs.push(`${country} twice within 10 days (${near.city}, ${city})`);
  out.push({ num: last.num + 1 + i, quizId: `ping-${m}-${d}-${String(y).slice(2)}`, live,
    dateLabel: `${MONTHS[m - 1]} ${d}, ${y}`, sunday: day.getUTCDay() === 0, city, country,
    lat: c?.lat, lng: c?.lng, blurb });
});
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const q = (s) => (s.includes("'") ? JSON.stringify(s) : `'${s}'`);
const text = out.map((p) => [
  '  {',
  `    num: ${p.num},`,
  `    quizId: ${q(p.quizId)},`,
  `    live: ${q(p.live)},`,
  `    dateLabel: ${q(p.dateLabel)},`,
  `    sunday: ${p.sunday},`,
  `    city: ${q(p.city)},`,
  `    country: ${q(p.country)},`,
  `    lat: ${p.lat},`,
  `    lng: ${p.lng},`,
  `    blurb: ${q(p.blurb)},`,
  '  },',
].join('\n')).join('\n') + '\n';

if (!WRITE) { process.stdout.write(text); process.exit(0); }
const src = fs.readFileSync(FILE, 'utf8');
const cut = src.lastIndexOf('];');
fs.writeFileSync(FILE, src.slice(0, cut) + text + src.slice(cut));
console.error(`appended ${out.length} cities (${out[0].num}-${out[out.length - 1].num}, ${out[0].live} to ${out[out.length - 1].live})`);
