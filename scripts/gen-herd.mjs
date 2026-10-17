// scripts/gen-herd.mjs: deals app/herd/puzzles.js from scripts/herd-pool.mjs.
//
// Herd is ten crowd questions a day, every one A or B (owner, 2026-10-16). A
// board is dealt so that:
//   - every day has at least two easy calls and at least two close calls,
//   - no topic (home, social, world) takes more than five of the ten,
//   - no two questions on one day share their key words,
//   - the first question is an easy call,
//   - no question is ever dealt twice in the bank.
// The house crowd is the pool entry's estimated split laid out as 48 votes
// (stored as COUNTS per option, not a vote list).
//
// Append-only: boards already in the bank are kept byte for byte and new days
// are dealt after the last one from questions not yet used.
//   node scripts/gen-herd.mjs --until 2026-11-30 [--from 2026-10-17] [--write]
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { POOL } from './herd-pool.mjs';

const OUT = path.join(process.cwd(), 'app/herd/puzzles.js');
const HOUSE = 48;
// EVERY QUESTION IS A OR B (owner, 2026-10-16), so every day is ten two-way calls.
const MIX = [[10, 0, 0]];

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FROM = arg('--from', '2026-10-17');
const UNTIL = arg('--until', '2026-11-30');
const WRITE = args.includes('--write');

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seedOf = (iso) => Number(iso.replace(/-/g, '')) * 2654435761;
function shuffle(a, r) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export function classOf(h) {
  const s = h.slice().sort((a, b) => b - a);
  const gap = s[0] - s[1];
  if (h.length === 2 ? s[0] <= 57 : gap <= 8) return 'hard';
  if (h.length === 2 ? s[0] >= 70 : gap >= 25) return 'easy';
  return 'mid';
}
const STOP = new Set('a an the or of to in on your you do is are what which how best most favorite at for with be when it should would rather and more yes no'.split(' '));
export function keyWords(x) {
  return new Set((x.q + ' ' + x.o.join(' ')).toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/)
    .map((w) => w.replace(/s$/, '')).filter((w) => w.length > 2 && !STOP.has(w)));
}
export function overlaps(a, b) {
  const A = keyWords(a), B = keyWords(b);
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / (A.size + B.size - n) >= 0.3;
}
export function houseCounts(h) {
  const raw = h.map((p) => (p * HOUSE) / 100);
  const c = raw.map((v) => Math.max(1, Math.floor(v)));
  let left = HOUSE - c.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, f: v - Math.floor(v) })).sort((a, b) => b.f - a.f || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) c[order[k % order.length].i]++;
  while (left < 0) { const i = c.indexOf(Math.max(...c)); c[i]--; left++; }
  const lead = h.indexOf(Math.max(...h));
  for (let i = 0; i < c.length; i++) if (i !== lead && c[i] >= c[lead]) { c[i] = c[lead] - 1; c[lead]++; }
  return c;
}

function isoAdd(iso, n) { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function quizIdOf(iso) { const [y, m, d] = iso.split('-').map(Number); return `herd-${m}-${d}-${String(y).slice(2)}`; }
function labelOf(iso) { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }

function dealDay(iso, mix, avail) {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const r = rng(seedOf(iso) + attempt);
    const pick = [];
    let ok = true;
    for (const [n, want] of [[2, mix[0]], [3, mix[1]], [4, mix[2]]]) {
      const cands = shuffle(avail.filter((x) => x.o.length === n), r);
      let got = 0;
      for (const x of cands) {
        if (got >= want) break;
        if (pick.some((y) => overlaps(x, y))) continue;
        if (pick.filter((y) => y.t === x.t).length >= 5) continue;
        pick.push(x); got++;
      }
      if (got < want) { ok = false; break; }
    }
    if (!ok) continue;
    const cls = pick.map((x) => classOf(x.h));
    if (cls.filter((c) => c === 'easy').length < 2 || cls.filter((c) => c === 'hard').length < 2) continue;
    const firstIdx = pick.findIndex((x) => x.o.length === 2 && classOf(x.h) === 'easy');
    if (firstIdx < 0) continue;
    const first = pick[firstIdx];
    const rest = shuffle(pick.filter((_, i) => i !== firstIdx), r);
    return [first, ...rest];
  }
  throw new Error(`could not deal ${iso}`);
}

async function main() {
  let bank = [];
  if (fs.existsSync(OUT)) bank = (await import(pathToFileURL(OUT).href + `?t=${Date.now()}`)).PUZZLES || [];
  const used = new Set(bank.flatMap((p) => p.prompts.map((pr) => pr.q)));
  let avail = POOL.filter((x) => !used.has(x.q));
  let day = bank.length ? isoAdd(bank[bank.length - 1].live, 1) : FROM;
  let num = bank.length ? bank[bank.length - 1].num + 1 : 1;
  const fresh = [];
  while (day <= UNTIL) {
    const mix = MIX[(num - 1) % MIX.length];
    const qs = dealDay(day, mix, avail);
    const ids = new Set(qs.map((x) => x.q));
    avail = avail.filter((x) => !ids.has(x.q));
    fresh.push({ num, quizId: quizIdOf(day), live: day, dateLabel: labelOf(day),
      prompts: qs.map((x) => ({ q: x.q, options: x.o, house: houseCounts(x.h) })) });
    day = isoAdd(day, 1); num++;
  }
  const head = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('export const PUZZLES = [')[0] : HEADER;
  const all = [...bank, ...fresh];
  const body = all.map((p) => `  ${JSON.stringify({ num: p.num, quizId: p.quizId, live: p.live, dateLabel: p.dateLabel })
    .replace(/}$/, ',')}\n    "prompts": [\n${p.prompts.map((pr) => `      ${JSON.stringify(pr)},`).join('\n')}\n    ],\n  },`).join('\n');
  const text = `${head}export const PUZZLES = [\n${body}\n];\n`;
  console.log(`herd: ${bank.length} kept, ${fresh.length} dealt, ${avail.length} pool questions left`);
  if (WRITE) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, text); }
}

const HEADER = `// Puzzle data for Herd, the daily crowd-selection game. SERVER-ONLY: imported
// by app/herd/page.js (which strips the house crowd before anything reaches
// the browser) and by app/api/herd/route.js (which scores against house + real
// picks, see lib/herd-score.js).
//
// Ten questions a day, every one A or B (owner, 2026-10-16). The player
// picks what they think MOST of today's players picked and scores a
// point for every call that lands with the herd.
//
// \`house\` is the house crowd as VOTE COUNTS per option (48 votes in all). It
// is the author's estimate, not observed play, and it seeds the pool only while
// at most ten real players are in; from the eleventh on, everyone is scored
// against real picks alone.
//
// Dealt by scripts/gen-herd.mjs from scripts/herd-pool.mjs (append-only; never
// edit a board that has gone live). Checked by scripts/verify-herd.mjs.

`;

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
