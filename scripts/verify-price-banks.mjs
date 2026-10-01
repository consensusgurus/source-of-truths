// scripts/verify-price-banks.mjs — the Dealer, Realtor, Agent and Curator banks
// (the Price Check family, lib/price-games.js). Pricer has its own verifier.
//
//   node scripts/verify-price-banks.mjs [dealer|realtor|agent|curator]
//   (scripts/verify-<game>.mjs are one-line wrappers, so verify-all sees a
//   checker for each bank)
//
// Recomputes what it can from the rows: dates walk day by day, quizId and
// dateLabel come from the date, prices are positive integer cents, every
// image is a stable https JPEG/PNG, nothing repeats, a price is never older
// than 60 days by its live date, two neighbouring days are never within 10%
// of each other (or the second guess is free), and each game's own fields are
// present. Exits 1 on any failure.
import path from 'path';
import { pathToFileURL } from 'url';
import { shipFor } from '../lib/price-ship.js';
import { scoreOf, errOf } from '../lib/price-games.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const BANNED = /googleusercontent\.com|ggpht\.com|fbcdn\.net|cdninstagram\.com|fbsbx\.com/i;
const dayMs = 86400000;
const fails = [], warns = [];
const FIELDS = {
  dealer: ['name', 'cat', 'maker', 'href', 'img', 'credit', 'creditUrl'],
  realtor: ['city', 'state', 'zip', 'address', 'beds', 'baths', 'sqft', 'broker', 'href', 'imgs'],
  agent: ['kind', 'href', 'img', 'date', 'credit'],
  curator: ['kind', 'name', 'href', 'img', 'credit'],
};

const ONLY = process.env.VERIFY_PRICE_ONLY || process.argv[2] || null;
for (const key of Object.keys(FIELDS).filter((k) => !ONLY || k === ONLY)) {
  const file = process.env[`VERIFY_${key.toUpperCase()}_BANK`] || path.resolve(here, `../app/${key}/puzzles.js`);
  const { PUZZLES } = await import(pathToFileURL(file).href);
  if (!Array.isArray(PUZZLES) || !PUZZLES.length) { fails.push(`${key}: empty bank`); continue; }
  let prev = null;
  const seen = new Map();
  PUZZLES.forEach((p, i) => {
    const id = `${key} #${p.num} ${p.live}`;
    const bad = (m) => fails.push(`${id}: ${m}`);
    if (p.num !== i + 1) bad(`num should be ${i + 1}`);
    const d = new Date(`${p.live}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) { bad('live is not a date'); return; }
    if (prev && d - new Date(`${prev.live}T00:00:00Z`) !== dayMs) bad(`not the day after ${prev.live}`);
    const [y, m, dd] = p.live.split('-').map(Number);
    if (p.quizId !== `${key}-${m}-${dd}-${String(y).slice(2)}`) bad(`quizId ${p.quizId}`);
    if (p.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) bad(`dateLabel ${p.dateLabel}`);
    if (p.sunday) bad('the price family has no Sunday Edition');
    if (!Number.isInteger(p.price) || p.price <= 0) bad('price must be positive integer cents');
    for (const f of FIELDS[key]) if (p[f] == null || p[f] === '') bad(`missing ${f}`);
    const imgs = key === 'realtor' ? (p.imgs || []) : [p.img];
    if (key === 'realtor' && imgs.length !== 3) bad('a home needs exactly three photos: curb, kitchen, one more room');
    for (const u of imgs) {
      if (!/^https:\/\//.test(u || '')) bad(`img not https: ${u}`);
      if (BANNED.test(u || '')) bad(`img on a banned host: ${u}`);
      if (/\.(webp|avif)(\?|$)/i.test(u || '')) bad('img must be JPEG or PNG');
    }
    if (!/^https:\/\//.test(p.href || '')) bad('href must be https');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.gathered || '')) bad('gathered must be YYYY-MM-DD');
    else {
      const age = (d - new Date(`${p.gathered}T00:00:00Z`)) / dayMs;
      if (age < 0) bad('gathered after the day it goes live');
      else if (age > 60) bad(`price is ${age} days old by its live date; re-read it`);
      else if (age > 45) warns.push(`${id}: price will be ${age} days old`);
    }
    if (key === 'agent') {
      if (!['flight', 'hotel'].includes(p.kind)) bad(`kind ${p.kind}`);
      if (p.kind === 'flight') for (const f of ['airline', 'from', 'to', 'fromCity', 'toCity', 'dep', 'cabin']) if (!p[f]) bad(`a flight names its ${f}`);
      if (p.kind === 'hotel') for (const f of ['hotel', 'city', 'room', 'nights']) if (!p[f]) bad(`a hotel stay names its ${f}`);
      // The trip has to still be ahead of the player on the day it is played.
      if (p.date <= p.live) bad(`the trip (${p.date}) is not after the day it is played`);
    }
    if (key === 'curator') {
      if (!['auction', 'retail'].includes(p.kind)) bad(`kind ${p.kind}`);
      if (p.kind === 'auction') { for (const f of ['maker', 'year', 'house', 'place', 'sale']) if (!p[f]) bad(`an auction names its ${f}`); if (p.sale > p.gathered) bad('sale after gathered'); }
      if (p.kind === 'retail') for (const f of ['brand', 'site']) if (!p[f]) bad(`a list price names its ${f}`);
    }
    const name = key === 'realtor' ? p.address : key === 'agent' ? (p.kind === 'hotel' ? p.hotel : `${p.airline} ${p.from}-${p.to}`) : p.name;
    if (seen.has(name)) bad(`${name} repeats #${seen.get(name)}`); else seen.set(name, p.num);
    // The item card must build, and must not say the price.
    const ship = shipFor(key, p);
    if (!ship || !ship.name || !ship.asOf || !ship.buy || !ship.imgs || !ship.imgs.length) bad('the item card does not build');
    else {
      const txt = [ship.name, ship.cat, ship.line, ...(ship.facts || [])].join(' ');
      const dollars = Math.floor(p.price / 100).toLocaleString('en-US');
      if (txt.includes(dollars) && Math.floor(p.price / 100) >= 100) bad(`the card text shows the price (${dollars})`);
    }
    // Neighbours within 10% would make yesterday's answer today's bullseye-ish.
    if (prev && scoreOf(errOf(prev.price, p.price)) >= 7) bad(`within 10% of the day before (${prev.price / 100} vs ${p.price / 100})`);
    prev = p;
  });
  console.log(`  ${key}: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${PUZZLES.at(-1).live}`);
}
for (const w of warns) console.warn(`  warn ${w}`);
if (fails.length) {
  for (const f of fails) console.error(`  FAIL ${f}`);
  console.error(`verify-price-banks: ${fails.length} failure(s)`);
  process.exit(1);
}
console.log('verify-price-banks: OK');
