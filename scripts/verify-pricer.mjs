// scripts/verify-pricer.mjs — the Pricer bank (one Amazon product a day; no Sunday Edition since 2026-10-01).
//
//   node scripts/verify-pricer.mjs
//   VERIFY_PRICER_BANK=/path/to/puzzles.js node scripts/verify-pricer.mjs   (mutation runs)
//
// Recomputes everything it can from the bank itself rather than trusting a
// field: dates walk day by day from the first board, the quizId and dateLabel
// are derived from the date, the Sunday flag from the calendar, the affiliate
// link from the ASIN. Exits 1 on any failure.
import path from 'path';
import { pathToFileURL } from 'url';

const bankPath = process.env.VERIFY_PRICER_BANK || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../app/pricer/puzzles.js');
const { PUZZLES } = await import(pathToFileURL(bankPath).href);

const fails = [], warns = [];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const BANNED_HOSTS = /googleusercontent\.com|ggpht\.com|fbcdn\.net|cdninstagram\.com|fbsbx\.com/i;
const MAX_AGE_DAYS = 60, WARN_AGE_DAYS = 45;
const AMAZON_MAX = 300000;    // $3,000: above this it belongs in Dealer, Realtor or Curator
const dayMs = 86400000;
const decade = (c) => Math.floor(Math.log10(c / 100));

if (!Array.isArray(PUZZLES) || !PUZZLES.length) { console.error('verify-pricer: empty bank'); process.exit(1); }

const seenAsin = new Map(), seenName = new Map(), seenQuiz = new Set();
let prev = null;
PUZZLES.forEach((p, i) => {
  const id = `#${p.num} ${p.live}`;
  const bad = (m) => fails.push(`${id}: ${m}`);
  if (p.num !== i + 1) bad(`num should be ${i + 1}`);
  const d = new Date(`${p.live}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) { bad('live is not a date'); return; }
  if (prev) {
    const pd = new Date(`${prev.live}T00:00:00Z`);
    if (d - pd !== dayMs) bad(`not the day after ${prev.live}`);
  }
  const [y, m, dd] = p.live.split('-').map(Number);
  const qid = `pricer-${m}-${dd}-${String(y).slice(2)}`;
  if (p.quizId !== qid) bad(`quizId ${p.quizId} should be ${qid}`);
  if (seenQuiz.has(p.quizId)) bad('duplicate quizId'); seenQuiz.add(p.quizId);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) bad(`dateLabel ${p.dateLabel}`);
  if (p.sunday) bad('Pricer has no Sunday Edition (owner, 2026-10-01): sunday must be false');

  if (!Number.isInteger(p.price) || p.price <= 0) bad('price must be positive integer cents');
  if (typeof p.name !== 'string' || p.name.length < 3) bad('missing name');
  if (typeof p.cat !== 'string' || !p.cat) bad('missing cat');
  if (!/^https:\/\//.test(p.img || '')) bad('img must be https');
  if (BANNED_HOSTS.test(p.img || '')) bad(`img on a banned host: ${p.img}`);
  if (/\.(webp|avif)(\?|$)/i.test(p.img || '')) bad('img must be JPEG or PNG');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.gathered || '')) bad('gathered must be YYYY-MM-DD');
  else {
    const age = (d - new Date(`${p.gathered}T00:00:00Z`)) / dayMs;
    if (age < 0) bad('gathered after the day it goes live');
    else if (age > MAX_AGE_DAYS) bad(`price is ${age} days old by its live date; re-read it`);
    else if (age > WARN_AGE_DAYS) warns.push(`${id}: price will be ${age} days old`);
  }

  if (p.shop !== 'amazon') bad('every day is an Amazon product (shop: amazon)');
  if (!/^[A-Z0-9]{10}$/.test(p.asin || '')) bad(`bad asin ${p.asin}`);
  if (p.href !== `https://www.amazon.com/dp/${p.asin}?tag=cgurus-20`) bad('href must be /dp/<asin>?tag=cgurus-20');
  if (p.price > AMAZON_MAX) bad(`price ${p.price / 100} is over the Amazon ceiling`);
  if (!/^https:\/\/m\.media-amazon\.com\/images\/I\//.test(p.img || '')) bad('img should be the Amazon product image');
  if (seenAsin.has(p.asin)) bad(`asin repeats #${seenAsin.get(p.asin)}`); else seenAsin.set(p.asin, p.num);
  const key = p.name.toLowerCase();
  if (seenName.has(key)) bad(`product repeats #${seenName.get(key)}`); else seenName.set(key, p.num);
  if (prev && decade(prev.price) === decade(p.price)) bad(`same price decade as the day before (${prev.name})`);
  prev = p;
});

// The week has to range: at least one board under $20 and one over $300 in
// every seven, or the bank has drifted into one aisle.
for (let i = 0; i + 7 <= PUZZLES.length; i += 7) {
  const wk = PUZZLES.slice(i, i + 7);
  if (!wk.some((p) => p.price < 2000)) warns.push(`week of ${PUZZLES[i].live}: nothing under $20`);
  if (!wk.some((p) => p.price > 30000)) warns.push(`week of ${PUZZLES[i].live}: nothing over $300`);
}

const last = PUZZLES[PUZZLES.length - 1];
for (const w of warns) console.warn(`  warn ${w}`);
if (fails.length) {
  for (const f of fails) console.error(`  FAIL ${f}`);
  console.error(`verify-pricer: ${fails.length} failure(s) across ${PUZZLES.length} boards`);
  process.exit(1);
}
console.log(`verify-pricer: ${PUZZLES.length} boards OK (${PUZZLES[0].live} to ${last.live}, all Amazon)`);
