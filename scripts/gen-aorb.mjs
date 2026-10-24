// scripts/gen-aorb.mjs: deals app/aorb/puzzles.js from scripts/aorb-pool.mjs.
//
// Aorb is ten A-or-B pairs a day (owner, 2026-10-23). A board is dealt so that:
//   - exactly ONE pair is "Who is more attractive?" (lane people), never first,
//   - exactly TWO pairs are brands ("only a couple brand comparisons each day"),
//   - movies, TV and books take three slots on odd-numbered days and two on
//     even ones, never all three from one lane,
//   - the rest come from food, travel, life, sports, music and misc, no lane
//     more than two in a day,
//   - no option appears twice on one day, and no pair is ever dealt twice,
//   - the first pair is from the everyday lanes (food, travel, life, misc).
// The house crowd is the pool entry's estimated split laid out as 50 votes,
// stored as counts [A, B].
//
// Append-only: boards already in the bank are kept byte for byte and new days
// are dealt after the last one from pairs not yet used.
//   node scripts/gen-aorb.mjs --until 2026-11-27 [--from 2026-10-23] [--write]
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { POOL } from './aorb-pool.mjs';

const OUT = path.join(process.cwd(), 'app/aorb/puzzles.js');
const HOUSE = 50;
const MEDIA = ['movie', 'tv', 'book'];
const EVERY = ['food', 'travel', 'life', 'sports', 'music', 'misc'];
const OPENERS = ['food', 'travel', 'life', 'misc'];

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FROM = arg('--from', '2026-10-23');
const UNTIL = arg('--until', '2026-11-27');
const WRITE = args.includes('--write');

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seedOf = (iso) => Number(iso.replace(/-/g, '')) * 2654435761;
function shuffle(a, r) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
const idOf = (x) => x.o.map((o) => o.toLowerCase()).sort().join('|');

// Day one is the owner's own list, approved in chat 2026-10-23, dealt as written.
const FIXED = {
  '2026-10-23': [
    { c: 'movie', q: 'Better movie?', o: ['The Godfather', 'The Shawshank Redemption'], h: [46, 54] },
    { c: 'brand', q: 'Better value?', o: ['Costco', "Sam's Club"], h: [68, 32] },
    { c: 'people', q: 'Who is more attractive?', o: ['George Clooney', 'Brad Pitt'], h: [44, 56] },
    { c: 'travel', q: 'Better trip?', o: ['Two weeks in Italy', 'Two weeks in Japan'], h: [53, 47] },
    { c: 'book', q: 'Better book?', o: ['To Kill a Mockingbird', 'The Great Gatsby'], h: [58, 42] },
    { c: 'brand', q: 'Better burger?', o: ['In-N-Out', 'Shake Shack'], h: [61, 39] },
    { c: 'misc', q: 'Better holiday?', o: ['Thanksgiving', 'Christmas'], h: [47, 53] },
    { c: 'movie', q: 'Better movie?', o: ['Titanic', 'Forrest Gump'], h: [38, 62] },
    { c: 'misc', q: 'Better dog?', o: ['Golden Retriever', 'French Bulldog'], h: [72, 28] },
    { c: 'life', q: 'Better life?', o: ['Retire at 50', 'Love your job until 70'], h: [57, 43] },
  ],
};
const FIXED_IDS = new Set(Object.values(FIXED).flat().map(idOf));

export function houseCounts(h) {
  const a = Math.round((h[0] * HOUSE) / 100);
  let c = [a, HOUSE - a];
  const lead = h[0] > h[1] ? 0 : 1;
  if (c[lead] <= c[1 - lead]) c = lead === 0 ? [HOUSE / 2 + 1, HOUSE / 2 - 1] : [HOUSE / 2 - 1, HOUSE / 2 + 1];
  return c;
}

function dealDay(iso, num, avail) {
  if (FIXED[iso]) return FIXED[iso];
  const mediaN = num % 2 === 1 ? 3 : 2;
  const wants = [['people', 1], ['brand', 2], ['media', mediaN], ['every', 10 - 3 - mediaN]];
  for (let attempt = 0; attempt < 5000; attempt++) {
    const r = rng(seedOf(iso) + attempt);
    const pick = [];
    const opts = new Set();
    const fits = (x) => x.o.every((o) => !opts.has(o.toLowerCase()));
    const take = (x) => { pick.push(x); x.o.forEach((o) => opts.add(o.toLowerCase())); };
    let ok = true;
    for (const [lane, n] of wants) {
      const pool = shuffle(avail.filter((x) => (lane === 'media' ? MEDIA.includes(x.c) : lane === 'every' ? EVERY.includes(x.c) : x.c === lane)), r);
      let got = 0;
      for (const x of pool) {
        if (got >= n) break;
        if (!fits(x)) continue;
        if (lane === 'media' && pick.filter((y) => y.c === x.c).length >= 2) continue;
        if (lane === 'every' && pick.filter((y) => y.c === x.c).length >= 2) continue;
        take(x); got++;
      }
      if (got < n) { ok = false; break; }
    }
    if (!ok) continue;
    const openers = pick.filter((x) => OPENERS.includes(x.c));
    if (!openers.length) continue;
    const first = openers[Math.floor(r() * openers.length)];
    let rest = shuffle(pick.filter((x) => x !== first), r);
    // The people pair never opens and never closes the day, and lanes do not stack.
    const pi = rest.findIndex((x) => x.c === 'people');
    if (pi === rest.length - 1) { const [p] = rest.splice(pi, 1); rest.splice(Math.floor(r() * (rest.length - 1)) + 1, 0, p); }
    const day = [first, ...rest];
    if (day.some((x, k) => k > 0 && x.c === day[k - 1].c)) continue;
    return day;
  }
  throw new Error(`could not deal ${iso}`);
}

function isoAdd(iso, n) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function quizIdOf(iso) { const [y, m, d] = iso.split('-').map(Number); return `aorb-${m}-${d}-${String(y).slice(2)}`; }
function labelOf(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }

async function main() {
  let bank = [];
  if (fs.existsSync(OUT)) bank = (await import(pathToFileURL(OUT).href + `?t=${Date.now()}`)).PUZZLES || [];
  const used = new Set(bank.flatMap((p) => p.prompts.map((pr) => idOf({ o: pr.options }))));
  let avail = POOL.filter((x) => !used.has(idOf(x)) && !FIXED_IDS.has(idOf(x)));
  let day = bank.length ? isoAdd(bank[bank.length - 1].live, 1) : FROM;
  let num = bank.length ? bank[bank.length - 1].num + 1 : 1;
  const fresh = [];
  while (day <= UNTIL) {
    const qs = dealDay(day, num, avail);
    const ids = new Set(qs.map(idOf));
    avail = avail.filter((x) => !ids.has(idOf(x)));
    fresh.push({ num, quizId: quizIdOf(day), live: day, dateLabel: labelOf(day),
      prompts: qs.map((x) => ({ q: x.q, options: x.o, lane: x.c, house: houseCounts(x.h) })) });
    day = isoAdd(day, 1); num++;
  }
  const head = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('export const PUZZLES = [')[0] : HEADER;
  const all = [...bank, ...fresh];
  const body = all.map((p) => `  ${JSON.stringify({ num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel })
    .replace(/}$/, ',')}\n    "prompts": [\n${p.prompts.map((pr) => `      ${JSON.stringify(pr)},`).join('\n')}\n    ],\n  },`).join('\n');
  const text = `${head}export const PUZZLES = [\n${body}\n];\n`;
  const left = {};
  for (const x of avail) left[x.c] = (left[x.c] || 0) + 1;
  console.log(`aorb: ${bank.length} kept, ${fresh.length} dealt, pool left ${JSON.stringify(left)}`);
  if (WRITE) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, text); }
}

const HEADER = `// Puzzle data for Aorb, the daily A-or-B crowd game. SERVER-ONLY: imported
// by app/aorb/page.js (which strips the house crowd and lanes before anything
// reaches the browser) and by app/api/aorb/route.js (which scores against house
// + real ballots, see lib/aorb-score.js).
//
// Ten A-or-B pairs a day (owner, 2026-10-23). On each pair the player makes
// their own pick AND calls which side most players picked; the call is scored on
// the real split, and an own pick more popular than the room predicted earns a
// surprise bonus.
//
// Fields: q the question as shown (it names the axis), options [A, B], lane the
// pool lane it was dealt from (people, brand, movie, tv, book, food, travel,
// life, sports, music, misc), house the house crowd as VOTE COUNTS [A, B], 50 in
// all, the author's estimate. The house seeds the pool only while at most ten
// real players are in. No Sunday Edition.
//
// A good day: exactly one "Who is more attractive?" pair (famous adults), two
// brand pairs, two or three movie, TV or book pairs, the rest everyday dilemmas,
// and nothing an instant reflex (no split past 70/30 in the estimate).
//
// Dealt by scripts/gen-aorb.mjs from scripts/aorb-pool.mjs (append-only; never
// re-deal a board that has gone live). Checked by scripts/verify-aorb.mjs.

`;

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
