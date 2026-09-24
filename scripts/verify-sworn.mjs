// Verify the Sworn bank (app/sworn/puzzles.js) from scratch:
//   - structural: nums sequential, quizId/live/dateLabel agree, sunday flag
//     matches the real weekday, Sundays seat 6 suspects and weekdays 5,
//     names distinct within a day, venues/stolen distinct across the bank
//   - EXACTLY ONE consistent (thief, liar-set) world by brute force over
//     every thief x every liar subset of size k, matching the stored solution
//   - the §7a no-guessing bar: for EVERY candidate thief, parity propagation
//     over the honesty variables + the liar-count bound must settle the
//     branch with a human-small case fan-out (<= 4) and no search — wrong
//     thiefs die, the true thief resolves to exactly one full assignment
// Run: node scripts/verify-sworn.mjs
import { PUZZLES } from '../app/sworn/puzzles.js';
import { scanUS } from './us-spellings.mjs';

// US spellings in venue / stolen copy from the 2026-11-01 extension on.
// Earlier cases are frozen (two ship "harbour" and "colourman").
const COPY_FROM = '2026-11-01';

let fails = 0;
const fail = (msg) => { console.error('FAIL:', msg); fails++; };

const TYPES = new Set(['accuse', 'innocent', 'selfInnocent', 'liar', 'honest', 'thiefLiar', 'thiefHonest']);

function stmtTruth(st, speaker, thief, liarMask) {
  const isLiar = (i) => (liarMask >> i) & 1;
  switch (st.type) {
    case 'accuse': return thief === st.x;
    case 'innocent': return thief !== st.x;
    case 'selfInnocent': return thief !== speaker;
    case 'liar': return !!isLiar(st.x);
    case 'honest': return !isLiar(st.x);
    case 'thiefLiar': return !!isLiar(thief);
    case 'thiefHonest': return !isLiar(thief);
  }
  return null;
}

function consistentWorlds(n, k, statements) {
  const out = [];
  for (let thief = 0; thief < n; thief++) {
    for (let mask = 0; mask < (1 << n); mask++) {
      let bits = 0;
      for (let i = 0; i < n; i++) bits += (mask >> i) & 1;
      if (bits !== k) continue;
      let ok = true;
      for (let s = 0; s < n && ok; s++) {
        if (stmtTruth(statements[s], s, thief, mask) === !!((mask >> s) & 1)) ok = false;
      }
      if (ok) out.push({ thief, mask });
    }
  }
  return out;
}

function branchCompletions(n, k, statements, thief, maxFanout = 4) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const parity = Array(n).fill(0);
  const find = (x) => {
    if (parent[x] === x) return [x, 0];
    const [root, p] = find(parent[x]);
    parent[x] = root; parity[x] ^= p;
    return [root, parity[x]];
  };
  const union = (a, b, rel) => {
    const [ra, pa] = find(a); const [rb, pb] = find(b);
    if (ra === rb) return (pa ^ pb) === rel;
    parent[ra] = rb; parity[ra] = pa ^ pb ^ rel;
    return true;
  };
  const fixed = Array(n).fill(null);
  const setFixed = (i, val) => {
    const [r, p] = find(i);
    const rootVal = p ? !val : val;
    if (fixed[r] === null) { fixed[r] = rootVal; return true; }
    return fixed[r] === rootVal;
  };
  for (let s = 0; s < n; s++) {
    const st = statements[s];
    if (st.type === 'accuse' || st.type === 'innocent' || st.type === 'selfInnocent') {
      if (!setFixed(s, stmtTruth(st, s, thief, 0))) return 0;
    } else if (st.type === 'liar') { if (!union(s, st.x, 1)) return 0; }
    else if (st.type === 'honest') { if (!union(s, st.x, 0)) return 0; }
    else if (st.type === 'thiefLiar') { if (!union(s, thief, 1)) return 0; }
    else if (st.type === 'thiefHonest') { if (!union(s, thief, 0)) return 0; }
  }
  const comps = new Map();
  for (let i = 0; i < n; i++) {
    const [r] = find(i);
    if (!comps.has(r)) comps.set(r, []);
    comps.get(r).push(i);
  }
  let baseLiars = 0;
  const free = [];
  for (const [root, members] of comps) {
    let liarsIfHonest = 0, liarsIfLiar = 0;
    for (const m of members) {
      const [, p] = find(m);
      if (p) liarsIfHonest++; else liarsIfLiar++;
    }
    if (fixed[root] !== null) baseLiars += fixed[root] ? liarsIfHonest : liarsIfLiar;
    else free.push({ ifHonest: liarsIfHonest, ifLiar: liarsIfLiar });
  }
  if ((1 << free.length) > maxFanout) return -1;
  let completions = 0;
  for (let m = 0; m < (1 << free.length); m++) {
    let liars = baseLiars;
    for (let i = 0; i < free.length; i++) liars += (m >> i) & 1 ? free[i].ifLiar : free[i].ifHonest;
    if (liars === k) completions++;
  }
  return completions;
}

if (PUZZLES.length !== 136) fail(`expected 136 puzzles, got ${PUZZLES.length}`);
const seenVenues = new Set(), seenStolen = new Set();
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} (${p.quizId})`;
  const n = p.suspects.length;
  if (p.num !== i + 1) fail(`${tag}: num out of sequence`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `sworn-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match live`);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const label = `${dt.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${d}, ${y}`;
  if (p.dateLabel !== label) fail(`${tag}: dateLabel "${p.dateLabel}" != "${label}"`);
  const realSunday = dt.getUTCDay() === 0;
  if (p.sunday !== realSunday) fail(`${tag}: sunday flag ${p.sunday} but weekday says ${realSunday}`);
  if (n !== (p.sunday ? 6 : 5)) fail(`${tag}: ${n} suspects unexpected for sunday=${p.sunday}`);
  if (new Set(p.suspects).size !== n) fail(`${tag}: duplicate suspect names`);
  if (!Number.isInteger(p.k) || p.k < 2 || p.k >= n) fail(`${tag}: bad k=${p.k}`);
  if (seenVenues.has(p.venue)) fail(`${tag}: venue reused`);
  if (seenStolen.has(p.stolen)) fail(`${tag}: stolen item reused`);
  seenVenues.add(p.venue); seenStolen.add(p.stolen);
  if (p.live >= COPY_FROM) {
    for (const t of [p.venue, p.stolen, ...p.suspects]) {
      for (const h of scanUS(t)) fail(`${tag}: British form "${h.found}" (US: ${h.us})`);
      if (/[\u2013\u2014]/.test(t)) fail(`${tag}: dash in "${t}"`);
    }
  }
  if (p.statements.length !== n) fail(`${tag}: ${p.statements.length} statements for ${n} suspects`);
  p.statements.forEach((st, s) => {
    if (!TYPES.has(st.type)) fail(`${tag}: bad statement type ${st.type}`);
    if (st.x !== undefined && (!Number.isInteger(st.x) || st.x < 0 || st.x >= n)) fail(`${tag}: bad target in statement ${s}`);
    if ((st.type === 'innocent' || st.type === 'liar' || st.type === 'honest') && st.x === s) fail(`${tag}: statement ${s} self-targets`);
    if (st.type === 'accuse' && st.x === s) fail(`${tag}: statement ${s} self-accuses`);
  });
  // uniqueness + stored-solution match
  const worlds = consistentWorlds(n, p.k, p.statements);
  if (worlds.length !== 1) { fail(`${tag}: ${worlds.length} consistent worlds (need exactly 1)`); return; }
  const mask = p.solution.liars.reduce((mm, x) => mm | (1 << x), 0);
  if (worlds[0].thief !== p.solution.thief) fail(`${tag}: stored thief ${p.solution.thief} != derived ${worlds[0].thief}`);
  if (worlds[0].mask !== mask) fail(`${tag}: stored liar set != derived`);
  if (p.solution.liars.length !== p.k) fail(`${tag}: stored liar count != k`);
  // deducibility (§7a): every thief branch settles without search
  for (let t = 0; t < n; t++) {
    const comp = branchCompletions(n, p.k, p.statements, t);
    if (comp === -1) fail(`${tag}: thief branch ${t} too branchy for a human`);
    else if (t === p.solution.thief && comp !== 1) fail(`${tag}: true branch has ${comp} completions (need 1)`);
    else if (t !== p.solution.thief && comp !== 0) fail(`${tag}: wrong-thief branch ${t} survives propagation`);
  }
});

if (fails) { console.error(`\nverify-sworn: ${fails} FAILURE(S)`); process.exit(1); }
console.log(`verify-sworn: all ${PUZZLES.length} cases pass (unique world + pure-deduction solvable, structure OK)`);
