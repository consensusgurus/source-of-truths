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
// the segment within 10 days, blurb 15-130 characters with no em or en dash.
// Sundays are the out-of-the-way cities: order PICKS so they land there.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITIES } from '../lib/ping-cities.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'app/ping/puzzles.js');
const WRITE = process.argv.includes('--write');

// Segment authored 2026-09-23: 2026-11-01 (Sunday) through 2026-11-30.
const PICKS = [
  ['Yerevan', 'Armenia', 'Mount Ararat, across the border in Turkey, fills the skyline on clear days. The city is older than Rome.'],
  ['Karachi', 'Pakistan', "Pakistan's largest city and main seaport, and the country's capital until 1959."],
  ['Geneva', 'Switzerland', 'Home to the United Nations in Europe and to the Red Cross, which was founded here in 1863.'],
  ['Lagos', 'Nigeria', "Nigeria's largest city, spread across islands and lagoons, was the capital until Abuja took over in 1991."],
  ['Brasilia', 'Brazil', 'Built from scratch in about four years and opened in 1960. From above, its plan looks like an airplane.'],
  ['Kyiv', 'Ukraine', "St. Sophia's Cathedral dates to the 11th century, and Arsenalna is among the deepest metro stations anywhere."],
  ['Chengdu', 'China', 'The giant panda breeding base on its northern edge draws visitors from all over the world.'],
  ['Male', 'Maldives', 'One of the most densely packed capitals on Earth, squeezed onto a coral island about a mile long.'],
  ['Guadalajara', 'Mexico', 'Capital of Jalisco, the state that gave the world mariachi music and tequila.'],
  ['Addis Ababa', 'Ethiopia', 'Headquarters of the African Union, and at about 7,700 feet one of the highest capitals in the world.'],
  ['Saint Petersburg', 'Russia', "Founded by Peter the Great in 1703, it was Russia's capital for about two centuries."],
  ['Ho Chi Minh City', 'Vietnam', 'Renamed in 1976, it is still widely called Saigon, above all in its old central district.'],
  ['Johannesburg', 'South Africa', 'It grew from an 1886 gold rush on the Witwatersrand, the richest gold field ever found.'],
  ['Tehran', 'Iran', 'The Alborz Mountains rise over its north side, with ski slopes less than an hour from the city.'],
  ['Kigali', 'Rwanda', 'Famously clean: Rwanda banned plastic bags in 2008 and holds a community cleanup day every month.'],
  ['Frankfurt', 'Germany', 'Home to the European Central Bank, and its skyline earned it the nickname Mainhattan.'],
  ['Dhaka', 'Bangladesh', 'Often called the rickshaw capital of the world, with hundreds of thousands pedaling its streets.'],
  ['Wellington', 'New Zealand', 'Often called the windiest city in the world, it faces the gusty Cook Strait.'],
  ['Panama City', 'Panama', "The Panama Canal's Pacific entrance lies just outside the city, where ships wait at anchor to cross."],
  ['Colombo', 'Sri Lanka', "Sri Lanka's biggest city and main port, with the long Galle Face Green along its seafront."],
  ['Belgrade', 'Serbia', 'Built where the Sava River flows into the Danube, beneath the walls of the Kalemegdan fortress.'],
  ['Manama', 'Bahrain', 'Capital of an island kingdom tied to Saudi Arabia by a causeway about 15 miles long.'],
  ['Guangzhou', 'China', 'Long known in the West as Canton, the trading port that gave Cantonese its name.'],
  ['Accra', 'Ghana', 'Capital of Ghana, which in 1957 became one of the first African colonies to win independence.'],
  ['Almaty', 'Kazakhstan', "Kazakhstan's biggest city and former capital, set beneath the snowy peaks of the Tian Shan."],
  ['Kolkata', 'India', 'The capital of British India until 1911, and home of the Howrah Bridge over the Hooghly River.'],
  ['Caracas', 'Venezuela', 'It sits in a mountain valley, walled off from the Caribbean coast by the peaks of El Avila.'],
  ['Tunis', 'Tunisia', 'The ruins of ancient Carthage lie in its suburbs along the Gulf of Tunis.'],
  ['Anchorage', 'United States', "Alaska's largest city, where moose regularly wander through neighborhoods and parks."],
  ['Busan', 'South Korea', "South Korea's second city and biggest port, known for its beaches and a major film festival."],
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
  const near = out.slice(-10).find((p) => p.country === country);
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
