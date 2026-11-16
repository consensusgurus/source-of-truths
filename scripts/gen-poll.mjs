// scripts/gen-poll.mjs: deals app/poll/puzzles.js from scripts/poll-pool.mjs.
//
// Poll is five A-or-B questions a day (owner, 2026-11-16). A board is dealt so
// that:
//   - the day opens on a brand or food pair (the easy way in),
//   - at most two brand-versus-brand pairs a day,
//   - five questions from at least four topics: one a topic, except that two
//     brand pairs may share a day,
//   - no two questions on one day share a key word, none shares one with any
//     question from the five days before, and a work question comes at most
//     once every three days (plenty of players have no office),
//   - at least one lopsided question (est 30 or under, or 70 or over) and at
//     least one close one (41 to 59), so the day needs both kinds of read,
//   - a seasonal question is dealt only inside its window, and is preferred
//     while the window is open,
//   - none overlaps a question Herd asks that same day,
//   - no question is ever dealt twice in the bank.
// The house crowd is the pool entry's estimated split laid out as 48 votes
// (stored as COUNTS [A, B], not a vote list).
//
// Append-only: boards already in the bank are kept byte for byte and new days
// are dealt after the last one from questions not yet used.
//   node scripts/gen-poll.mjs --until 2026-12-31 [--from 2026-11-16] [--write]
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { POOL } from './poll-pool.mjs';

const OUT = path.join(process.cwd(), 'app/poll/puzzles.js');
const HERD = path.join(process.cwd(), 'app/herd/puzzles.js');
const HOUSE = 48;
const PER_DAY = 5;

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FROM = arg('--from', '2026-11-16');
const UNTIL = arg('--until', '2026-12-31');
const WRITE = args.includes('--write');

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seedOf = (iso) => Number(iso.replace(/-/g, '')) * 40503 + 77;
function shuffle(a, r) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

// The launch day opens on the owner's own example.
const PIN = { '2026-11-16': 'Cheez-Its or Goldfish?' };

const ENTRIES = POOL.map(([t, q, a, b, e, f]) => ({ t, q, o: [a, b], e, b: !!(f && f.b), w: (f && f.w) || null }));

const STOP = new Set('a an the or of to in on your you do is are what which how best most favorite at for with be when it should would rather and more yes no them one every always never still have ever'.split(' '));
export function keyWords(x) {
  return new Set((x.q + ' ' + x.o.join(' ')).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .map((w) => w.replace(/s$/, '')).filter((w) => w.length > 2 && !STOP.has(w)));
}
export function overlaps(a, b) {
  const A = keyWords(a), B = keyWords(b);
  for (const w of A) if (B.has(w)) return true;
  return false;
}
// Looser test for Herd's ten questions that day: only a real subject match.
export function similar(a, b) {
  const A = keyWords(a), B = keyWords(b);
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n > 0 && n / Math.min(A.size, B.size) >= 0.5;
}
export function houseCounts(e) {
  const a = Math.max(1, Math.min(HOUSE - 1, Math.round((e * HOUSE) / 100)));
  return [a, HOUSE - a];
}
const lopsided = (x) => x.e <= 30 || x.e >= 70;
const close = (x) => x.e >= 41 && x.e <= 59;
const inWindow = (x, iso) => { if (!x.w) return true; const md = iso.slice(5); return md >= x.w[0] && md <= x.w[1]; };

function isoAdd(iso, n) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function quizIdOf(iso) { const [y, m, d] = iso.split('-').map(Number); return `poll-${m}-${d}-${String(y).slice(2)}`; }
function labelOf(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }

async function load(file) {
  if (!fs.existsSync(file)) return [];
  const m = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  return m.PUZZLES || [];
}

function okDay(set) {
  if (set.length !== PER_DAY) return false;
  if (set.filter((x) => x.b).length > 2) return false;
  const byT = {};
  for (const x of set) { byT[x.t] = (byT[x.t] || 0) + 1; if (byT[x.t] > (x.t === 'brand' ? 2 : 1)) return false; }
  if (Object.keys(byT).length < 4) return false;
  if (!set.some(lopsided) || !set.some(close)) return false;
  for (let i = 0; i < set.length; i++) for (let j = i + 1; j < set.length; j++) if (overlaps(set[i], set[j])) return false;
  return true;
}

function deal(iso, free, herdDay, recent, workRecently) {
  const r = rng(seedOf(iso));
  const clash = (x) => herdDay.some((h) => similar(x, { q: h.q, o: h.options }));
  const open = free.filter((x) => inWindow(x, iso) && !clash(x) && !(workRecently && x.t === 'work') && (x.w || !recent.some((y) => overlaps(x, y))));
  for (let attempt = 0; attempt < 4000; attempt++) {
    const pool = shuffle(open, r);
    // Seasonal questions whose window is open go to the front, one a day at most.
    const seasonal = pool.filter((x) => x.w).sort((x, y) => (x.w[1] < y.w[1] ? -1 : x.w[1] > y.w[1] ? 1 : 0));
    const rest = pool.filter((x) => !x.w);
    const sea = seasonal[0] || null;
    const first = (PIN[iso] && rest.find((x) => x.q === PIN[iso])) || rest.find((x) => (x.t === 'brand' || x.t === 'food') && (!sea || (x.t !== sea.t && !overlaps(x, sea))));
    if (!first) return null;
    const set = [first];
    const queue = (sea ? [sea] : []).concat(rest.filter((x) => x !== first));
    for (const x of queue) {
      if (set.length === PER_DAY) break;
      const trial = set.concat([x]);
      if (trial.filter((y) => y.b).length > 2) continue;
      if (trial.filter((y) => y.t === x.t).length > (x.t === 'brand' ? 2 : 1)) continue;
      if (set.some((y) => overlaps(x, y))) continue;
      set.push(x);
    }
    if (okDay(set)) return set;
  }
  return null;
}

const HEADER = `// Puzzle data for Poll, the daily crowd-percentage game. SERVER-ONLY: imported
// by app/poll/page.js (which strips the house crowd before anything reaches
// the browser) and by app/api/poll/route.js (which scores against house + real
// picks, see lib/poll-score.js).
//
// Five questions a day, every one A or B (owner, 2026-11-16: "things like
// Cheez-Its or Goldfish, wide range of topics"). The player gives their own
// pick, then guesses the percentage of today's players who picked the first
// option, and scores up to 20 a question for how close the guess lands.
//
// \`house\` is the house crowd as VOTE COUNTS [A, B] (48 votes in all). It is
// the author's estimate, not observed play, and it seeds the pool only while
// at most ten real players are in; from the eleventh on, everyone is scored
// against real picks alone. \`topic\` and \`brand\` never reach the browser;
// they are what scripts/verify-poll.mjs checks the day's mix against.
//
// No Sunday Edition: five questions every day.
//
// Dealt by scripts/gen-poll.mjs from scripts/poll-pool.mjs (append-only; never
// edit a board that has gone live). Checked by scripts/verify-poll.mjs.
`;

function fmt(p) {
  const rows = p.prompts.map((pr) => `      ${JSON.stringify(pr)},`).join('\n');
  return `  {"num":${p.num},"quizId":"${p.quizId}","live":"${p.live}","dateLabel":"${p.dateLabel}",\n    "prompts": [\n${rows}\n    ],\n  },`;
}

const existing = await load(OUT);
const herd = await load(HERD);
const herdByDay = new Map(herd.map((p) => [p.live, p.prompts]));
const used = new Set();
for (const p of existing) for (const pr of p.prompts) used.add(pr.q);
const herdQs = new Set(); for (const p of herd) for (const pr of p.prompts) herdQs.add(pr.q.toLowerCase());
let free = ENTRIES.filter((x) => !used.has(x.q) && !herdQs.has(x.q.toLowerCase()));
const boards = existing.slice();
let iso = existing.length ? isoAdd(existing[existing.length - 1].live, 1) : FROM;
while (iso <= UNTIL) {
  const back = boards.slice(-5).flatMap((b) => b.prompts.map((pr) => ({ q: pr.q, o: pr.options })));
  const workRecently = boards.slice(-2).some((b) => b.prompts.some((pr) => pr.topic === 'work'));
  const set = deal(iso, free, herdByDay.get(iso) || [], back, workRecently);
  if (!set) { console.error(`gen-poll: could not deal ${iso} from ${free.length} free questions`); process.exit(1); }
  free = free.filter((x) => !set.includes(x));
  boards.push({
    num: boards.length + 1, quizId: quizIdOf(iso), live: iso, dateLabel: labelOf(iso),
    prompts: set.map((x) => ({ q: x.q, options: x.o, house: houseCounts(x.e), topic: x.t, ...(x.b ? { brand: true } : {}) })),
  });
  iso = isoAdd(iso, 1);
}
const text = `${HEADER}\nexport const PUZZLES = [\n${boards.map(fmt).join('\n')}\n];\n`;
console.log(`gen-poll: ${boards.length} boards (${existing.length} kept), ${boards[0].live} to ${boards[boards.length - 1].live}, ${free.length} pool questions left`);
if (WRITE) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, text); console.log('wrote', OUT); }
