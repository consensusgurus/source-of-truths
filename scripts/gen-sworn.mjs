#!/usr/bin/env node
// Generator for the Sworn bank (app/sworn/puzzles.js).
//
// APPEND ONLY. Reads the bank, takes its last num and live date, and writes
// new cases for each day after it through --until (inclusive). Frozen cases are
// never regenerated; new rows are spliced in front of the closing `];`.
//
//   node scripts/gen-sworn.mjs --until 2026-11-30            # dry run
//   node scripts/gen-sworn.mjs --until 2026-11-30 --write    # append
//
// Method (the bank header's): seed a world (thief + a liar set of size k),
// give every suspect ONE statement whose truth matches their honesty (liars
// say something false, the honest say something true), drawn to the live
// bank's statement-type mix, then keep the case only if (a) exactly one
// (thief, liar-set) world is consistent, by brute force, and (b) the §7a
// no-guessing bar holds: for every candidate thief, parity propagation over
// the honesty variables plus the liar count settles the branch with a case
// fan-out of at most 4 (wrong thieves die, the true one resolves to one
// assignment). scripts/verify-sworn.mjs re-checks both independently.
//
// Weekdays seat 5 (k 2 or 3), Sundays 6 for the Grand Inquest (k 2 to 4),
// k drawn from the live bank's own distribution per day type. Deterministic,
// seeded off the case NUMBER so no frozen case is replayed.
import fs from 'node:fs';
import { PUZZLES } from '../app/sworn/puzzles.js';
import { scanUS } from './us-spellings.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const UNTIL = arg('--until', '2026-11-30');
const WRITE = args.includes('--write');
const BANK = new URL('../app/sworn/puzzles.js', import.meta.url);

// Venues continue the bank's alphabetical run (the November segment ended on
// Y, Yarcombe, 2026-11-30), skipping X as the bank does. December segment
// authored 2026-11-12: Z, then A to Y, then Z and A to E again.
const CASES = [
  ['the Zennor tin streams', "the streamer's tin ingot"],
  ['the Alfriston bakehouse', 'a tray of saffron buns'],
  ['the Bampton weaving shed', 'a bolt of herringbone tweed'],
  ['the Corfe marble yard', "the mason's bronze chisel"],
  ['the Dedham sail loft', 'a roll of tanned canvas'],
  ['the Eyam lead works', "the assayer's balance weights"],
  ['the Finchingfield bell foundry', 'a tray of brass sleigh bells'],
  ['the Goathland jet workshop', 'a brooch of polished jet'],
  ['the Haworth bookbindery', "the binder's book of gold leaf"],
  ['the Ilmington cheese loft', 'a truckle of sage cheddar'],
  ['the Jevington tea rooms', 'a dish of banoffee pie'],
  ['the Kersey cloth hall', 'a bolt of blue kersey cloth'],
  ['the Lacock photography studio', "the photographer's glass plates"],
  ['the Mousehole net loft', 'a crate of glass fishing floats'],
  ['the Nayland tannery', "the currier's shaving knife"],
  ['the Ottery tar barrel store', 'a barrel of pine tar'],
  ["the Polperro smugglers' cellar", 'a cask of French brandy'],
  ['the Quarndon spa house', "the keeper's copper dipper"],
  ['the Rye ship chandlery', "a crate of ship's biscuits"],
  ['the Stamford brewhouse', 'a cask of winter ale'],
  ['the Thaxted cutlery forge', 'a set of horn-handled knives'],
  ['the Upton gingerbread shop', 'a tin of gingerbread men'],
  ['the Veryan holly farm', 'a cart of berried holly'],
  ['the Wiveton toffee kitchen', 'a tray of treacle toffee'],
  ['the Youlgreave pudding kitchen', 'a basin of Christmas pudding'], // was figgy: Foodie asks it the same day (review 2026-11-12)
  ['the Zeals cider house', "the wassailer's carved bowl"],
  ['the Appleby horse fair stalls', "the dealer's leather purse"],
  ['the Bibury trout farm', 'a creel of rainbow trout'],
  ['the Clovelly donkey stables', 'a pair of donkey panniers'],
  ['the Dent knitting loft', 'a basket of wool stockings'],
  ['the Edale fell hut', "the guide's brass compass"],
];

const NAMES = [...new Set(PUZZLES.flatMap((p) => p.suspects))];
const MIX = {};
for (const p of PUZZLES) for (const s of p.statements) MIX[s.type] = (MIX[s.type] || 0) + 1;
const TYPES = Object.keys(MIX);
const KS = { false: PUZZLES.filter((p) => !p.sunday).map((p) => p.k), true: PUZZLES.filter((p) => p.sunday).map((p) => p.k) };

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickW = (R) => { const tot = TYPES.reduce((s, t) => s + MIX[t], 0); let x = R() * tot; for (const t of TYPES) { x -= MIX[t]; if (x <= 0) return t; } return TYPES[TYPES.length - 1]; };

function truth(st, speaker, thief, mask) {
  const liar = (i) => !!((mask >> i) & 1);
  switch (st.type) {
    case 'accuse': return thief === st.x;
    case 'innocent': return thief !== st.x;
    case 'selfInnocent': return thief !== speaker;
    case 'liar': return liar(st.x);
    case 'honest': return !liar(st.x);
    case 'thiefLiar': return liar(thief);
    case 'thiefHonest': return !liar(thief);
  }
  return null;
}

function worlds(n, k, sts) {
  const out = [];
  for (let thief = 0; thief < n; thief++) for (let mask = 0; mask < (1 << n); mask++) {
    let b = 0; for (let i = 0; i < n; i++) b += (mask >> i) & 1;
    if (b !== k) continue;
    let ok = true;
    for (let s = 0; s < n && ok; s++) if (truth(sts[s], s, thief, mask) === !!((mask >> s) & 1)) ok = false;
    if (ok) out.push({ thief, mask });
  }
  return out;
}

// Parity propagation for one candidate thief: number of completions, or -1 if
// the case fan-out exceeds 4 (too branchy for a human).
function branch(n, k, sts, thief) {
  const parent = [...Array(n).keys()], par = Array(n).fill(0);
  const find = (x) => { if (parent[x] === x) return [x, 0]; const [r, p] = find(parent[x]); parent[x] = r; par[x] ^= p; return [r, par[x]]; };
  const union = (a, b, rel) => { const [ra, pa] = find(a), [rb, pb] = find(b); if (ra === rb) return (pa ^ pb) === rel; parent[ra] = rb; par[ra] = pa ^ pb ^ rel; return true; };
  const fixed = Array(n).fill(null);
  const setF = (i, v) => { const [r, p] = find(i); const rv = p ? !v : v; if (fixed[r] === null) { fixed[r] = rv; return true; } return fixed[r] === rv; };
  for (let s = 0; s < n; s++) {
    const st = sts[s];
    if (st.type === 'accuse' || st.type === 'innocent' || st.type === 'selfInnocent') { if (!setF(s, truth(st, s, thief, 0))) return 0; }
    else if (st.type === 'liar') { if (!union(s, st.x, 1)) return 0; }
    else if (st.type === 'honest') { if (!union(s, st.x, 0)) return 0; }
    else if (st.type === 'thiefLiar') { if (!union(s, thief, 1)) return 0; }
    else if (st.type === 'thiefHonest') { if (!union(s, thief, 0)) return 0; }
  }
  const comps = new Map();
  for (let i = 0; i < n; i++) { const [r] = find(i); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(i); }
  let base = 0; const free = [];
  for (const [root, ms] of comps) {
    let ih = 0, il = 0;
    for (const m of ms) { const [, p] = find(m); if (p) ih++; else il++; }
    if (fixed[root] !== null) base += fixed[root] ? ih : il; else free.push([ih, il]);
  }
  if ((1 << free.length) > 4) return -1;
  let c = 0;
  for (let m = 0; m < (1 << free.length); m++) { let l = base; free.forEach(([ih, il], i) => { l += (m >> i) & 1 ? il : ih; }); if (l === k) c++; }
  return c;
}

function makeCase(n, k, R) {
  for (let attempt = 0; attempt < 200000; attempt++) {
    const thief = Math.floor(R() * n);
    const liars = shuffle([...Array(n).keys()], R).slice(0, k);
    const mask = liars.reduce((m, x) => m | (1 << x), 0);
    const sts = [];
    for (let s = 0; s < n; s++) {
      const want = !((mask >> s) & 1);
      let st = null;
      for (let t = 0; t < 40 && !st; t++) {
        const type = pickW(R);
        const cand = { type };
        if (!['selfInnocent', 'thiefLiar', 'thiefHonest'].includes(type)) {
          cand.x = Math.floor(R() * n);
          if (cand.x === s) continue;
        }
        if (truth(cand, s, thief, mask) === want) st = cand;
      }
      if (!st) break;
      sts.push(st);
    }
    if (sts.length !== n) continue;
    const w = worlds(n, k, sts);
    if (w.length !== 1 || w[0].thief !== thief || w[0].mask !== mask) continue;
    let ok = true;
    for (let t = 0; t < n && ok; t++) { const c = branch(n, k, sts, t); ok = t === thief ? c === 1 : c === 0; }
    if (!ok) continue;
    return { sts, thief, liars: liars.sort((a, b) => a - b) };
  }
  throw new Error('no case');
}

const last = PUZZLES[PUZZLES.length - 1];
const dates = [];
for (let d = new Date(`${last.live}T12:00:00Z`); ;) { d.setUTCDate(d.getUTCDate() + 1); const iso = d.toISOString().slice(0, 10); if (iso > UNTIL) break; dates.push(iso); }
if (dates.length > CASES.length) throw new Error(`need ${dates.length} venues, have ${CASES.length}`);

const usedV = new Set(PUZZLES.map((p) => p.venue.toLowerCase())), usedS = new Set(PUZZLES.map((p) => p.stolen.toLowerCase()));
for (const [v, s] of CASES) {
  if (usedV.has(v.toLowerCase()) || usedS.has(s.toLowerCase())) throw new Error(`repeat: ${v} / ${s}`);
  usedV.add(v.toLowerCase()); usedS.add(s.toLowerCase());
  for (const h of [...scanUS(v), ...scanUS(s)]) throw new Error(`British form ${h.found} in ${v} / ${s}`);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const rows = [];
dates.forEach((iso, i) => {
  const num = last.num + 1 + i;
  const R = mulberry32(0x5a0e7 + num * 104729);
  const [y, m, d] = iso.split('-').map(Number);
  const sunday = new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
  const n = sunday ? 6 : 5;
  const ks = KS[sunday];
  const k = ks[Math.floor(R() * ks.length)];
  const { sts, thief, liars } = makeCase(n, k, R);
  const [venue, stolen] = CASES[i];
  rows.push(`  {
    num: ${num}, quizId: "sworn-${m}-${d}-${String(y).slice(2)}", live: "${iso}", dateLabel: "${MONTHS[m - 1]} ${d}, ${y}", sunday: ${sunday},
    k: ${k},
    suspects: ${JSON.stringify(shuffle(NAMES.slice(), R).slice(0, n))},
    venue: ${JSON.stringify(venue)},
    stolen: ${JSON.stringify(stolen)},
    statements: [
${sts.map((s) => `      ${JSON.stringify(s)},`).join('\n')}
    ],
    solution: ${JSON.stringify({ thief, liars })},
  },`);
  console.error(`#${num} ${iso}${sunday ? ' SUN' : ''} k${k} ${sts.map((s) => s.type).join(' ')}`);
});

if (WRITE) {
  const bank = fs.readFileSync(BANK, 'utf8');
  const close = bank.lastIndexOf('];');
  fs.writeFileSync(BANK, bank.slice(0, close) + rows.join('\n') + '\n' + bank.slice(close));
  console.error(`appended ${rows.length} cases`);
} else console.error(`dry run: ${rows.length} cases (pass --write to append)`);
