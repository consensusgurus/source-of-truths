#!/usr/bin/env node
// Generator for the Daily Alibi bank (app/alibi/puzzles.js).
//
// APPEND ONLY. Reads the bank, takes its last num and live date, and writes
// new cases for the days after it through --until (inclusive). Frozen cases
// are never regenerated or rewritten: the new rows are spliced in front of
// the closing `];`.
//
//   node scripts/gen-alibi.mjs --until 2026-11-30            # dry run, prints a summary
//   node scripts/gen-alibi.mjs --until 2026-11-30 --write    # appends to the bank
//
// Method (the same one the bank header describes, plus the verifier's
// no-guessing rule): pick a random solution, build the pool of every TRUE clue,
// draw clues (weighted to the live bank's clue-type mix) until pure
// propagation solves the grid, then prune any clue whose removal keeps it
// propagation-solvable. Propagation is sound, so a propagation solve is also
// a uniqueness proof; scripts/verify-alibi.mjs re-checks uniqueness by brute
// force independently. A pruned set outside the clue band is thrown away and
// the case re-drawn (Sunday Edition: five suspects, 10-14 clues; weekdays:
// four suspects, 8-11).
//
// Deterministic: the PRNG is seeded off the case NUMBER, so the new segment
// never replays a frozen case. Venue/stolen copy is hand-written below and
// must not repeat anything already in the bank (checked on every run).
import fs from 'node:fs';
import { PUZZLES } from '../app/alibi/puzzles.js';
import { scanUS } from './us-spellings.mjs';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const UNTIL = arg('--until', '2026-11-30');
const WRITE = args.includes('--write');
const BANK = new URL('../app/alibi/puzzles.js', import.meta.url);

// Venues continue the bank's alphabetical run (it reached L, Lindenmere, on
// 2026-10-31), skipping X as the bank does.
const CASES = [
  ['the Marbury clock works', "the clockmaker's regulator key"],
  ['the Netherby wool store', 'a bale of merino fleece'],
  ['the Ottery Lane forge', "the smith's tempering tongs"],
  ['the Pellham spice warehouse', 'a chest of saffron threads'],
  ['the Quarley lens works', "the lensmaker's ground loupe"],
  ['the Rowsley hat works', "the milliner's silk top hat"],
  ['the Sedgwick jam kitchen', 'a crate of damson preserves'],
  ['the Tolland cannery', 'a case of spiced peaches'],
  ['the Upton Lane tinsmiths', "the tinsmith's pattern shears"],
  ['the Vantner organ works', "the organ builder's reed pipe"],
  ['the Wrenfield toy works', 'a box of painted tin soldiers'],
  ['the Yeadon mustard mill', 'a crock of stone-ground mustard'],
  ['the Zetland Road dairy', "the dairyman's butter stamp"],
  ['the Ashcombe violin workshop', 'a bow of pernambuco wood'],
  ['the Brampton seed store', 'a packet of heirloom tulip bulbs'],
  ['the Carrow Lane harness works', "the harness maker's awl set"],
  ['the Dunmore quarry office', "the quarryman's survey chain"],
  ['the Eskdale honey house', 'a comb of heather honey'],
  ['the Fairlight lamp works', "the lampmaker's brass burner"],
  ['the Greystoke button factory', 'a tin of mother-of-pearl buttons'],
  ['the Holloway saddlery', "the saddler's silver stirrups"],
  ['the Ivybridge mapmakers', "the cartographer's copper plate"],
  ['the Juniper Lane perfumery', 'a flask of rose attar'],
  ['the Kingsmead pewter works', "the pewterer's tankard mold"],
  ['the Loxley silk mill', 'a bolt of damask silk'],
  ['the Merriton compass works', "the compass maker's lodestone"],
  ['the Norwood engraving shop', "the engraver's steel burin"],
  ['the Oakhurst piano works', "the piano maker's tuning fork"],
  ['the Penhallow tea blenders', 'a tin of first-flush Darjeeling'],
  ['the Quainton carriage works', "the coachbuilder's gilt crest"],
];

// Name/room/object pools: the bank's own, minus British forms and the
// duplicate spelling "Boat House".
const pool = (k) => [...new Set(PUZZLES.flatMap((p) => p[k]))];
const SUSPECTS = pool('suspects');
const ROOMS = pool('rooms').filter((r) => !scanUS(r).length && r !== 'Boat House');
const OBJECTS = pool('objects').filter((o) => !scanUS(o).length);
const HOURS = ['5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm', '11 pm', 'midnight'];

// Clue-count distributions of the live bank, per day type.
const WEEK_COUNTS = PUZZLES.filter((p) => !p.sunday).map((p) => p.clues.length);
const SUN_COUNTS = PUZZLES.filter((p) => p.sunday).map((p) => p.clues.length);

// Clue-type weights: the live bank's mix.
const MIX = {};
for (const p of PUZZLES) for (const c of p.clues) MIX[c.type] = (MIX[c.type] || 0) + 1;

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const shuffle = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const perm = (n, R) => shuffle([...Array(n).keys()], R);

function allTrueClues(sol, n) {
  const { room, time, obj } = sol;
  const at = (r) => room.indexOf(r);
  const out = [];
  for (let s = 0; s < n; s++) {
    for (let v = 0; v < n; v++) {
      if (room[s] !== v) out.push({ type: 'notRoom', s, r: v });
      if (obj[s] !== v) out.push({ type: 'notObj', s, o: v });
    }
    out.push({ type: 'hasObj', s, o: obj[s] });
    for (let s2 = 0; s2 < n; s2++) if (s2 !== s && time[s] < time[s2]) out.push({ type: 'before', s1: s, s2 });
    for (let r = 0; r < n; r++) { const o2 = at(r); if (o2 !== s && time[s] < time[o2]) out.push({ type: 'beforeRoom', s, r }); }
  }
  for (let r = 0; r < n; r++) {
    out.push({ type: 'roomObj', r, o: obj[at(r)] });
    out.push({ type: 'roomTime', r, t: time[at(r)] });
  }
  return out;
}

// Propagation: the same human-standard move set the verifier accepts.
function propagate(clues, n) {
  const FULL = [...Array(n).keys()];
  const d = { room: FULL.map(() => new Set(FULL)), time: FULL.map(() => new Set(FULL)), obj: FULL.map(() => new Set(FULL)) };
  let changed = true;
  while (changed) {
    changed = false;
    const rm = (cat, s, v) => { if (d[cat][s].has(v)) { d[cat][s].delete(v); changed = true; } };
    const fix = (cat, s, v) => { for (const x of [...d[cat][s]]) if (x !== v) rm(cat, s, x); };
    for (const cat of ['room', 'time', 'obj']) {
      for (let s = 0; s < n; s++) if (d[cat][s].size === 1) { const v = [...d[cat][s]][0]; for (let s2 = 0; s2 < n; s2++) if (s2 !== s) rm(cat, s2, v); }
      for (const v of FULL) { const c = FULL.filter((s) => d[cat][s].has(v)); if (c.length === 1 && d[cat][c[0]].size > 1) fix(cat, c[0], v); }
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
        if (d[cat][a].size === 2 && d[cat][b].size === 2 && [...d[cat][a]].sort().join('') === [...d[cat][b]].sort().join('')) {
          for (let s2 = 0; s2 < n; s2++) if (s2 !== a && s2 !== b) for (const v of [...d[cat][a]]) rm(cat, s2, v);
        }
      }
    }
    if (['room', 'time', 'obj'].some((k) => d[k].some((s) => s.size === 0))) return null;
    for (const c of clues) {
      switch (c.type) {
        case 'notRoom': rm('room', c.s, c.r); break;
        case 'notObj': rm('obj', c.s, c.o); break;
        case 'hasObj': fix('obj', c.s, c.o); break;
        case 'roomObj':
        case 'roomTime': {
          const cat = c.type === 'roomObj' ? 'obj' : 'time', v = c.type === 'roomObj' ? c.o : c.t;
          for (let s = 0; s < n; s++) {
            if (!d.room[s].has(c.r)) continue;
            if (d.room[s].size === 1) fix(cat, s, v); else if (!d[cat][s].has(v)) rm('room', s, c.r);
          }
          for (let s = 0; s < n; s++) if (d[cat][s].size === 1 && d[cat][s].has(v)) fix('room', s, c.r);
          break;
        }
        case 'before': {
          if (!d.time[c.s1].size || !d.time[c.s2].size) return null;
          const max2 = Math.max(...d.time[c.s2]); for (const v of [...d.time[c.s1]]) if (v >= max2) rm('time', c.s1, v);
          if (!d.time[c.s1].size) return null;
          const min1 = Math.min(...d.time[c.s1]); for (const v of [...d.time[c.s2]]) if (v <= min1) rm('time', c.s2, v);
          break;
        }
        case 'beforeRoom': {
          rm('room', c.s, c.r);
          const cands = FULL.filter((s2) => s2 !== c.s && d.room[s2].has(c.r));
          if (cands.some((s2) => !d.time[s2].size) || !d.time[c.s].size) return null;
          if (cands.length === 1) {
            const s2 = cands[0];
            const max2 = Math.max(...d.time[s2]); for (const v of [...d.time[c.s]]) if (v >= max2) rm('time', c.s, v);
            if (!d.time[c.s].size) return null;
            const min1 = Math.min(...d.time[c.s]); for (const v of [...d.time[s2]]) if (v <= min1) rm('time', s2, v);
          } else if (cands.length > 1) {
            const maxAny = Math.max(...cands.map((s2) => Math.max(...d.time[s2]))); for (const v of [...d.time[c.s]]) if (v >= maxAny) rm('time', c.s, v);
          }
          if (!d.time[c.s].size) return null;
          for (const s2 of cands) if (Math.max(...d.time[s2]) <= Math.min(...d.time[c.s])) rm('room', s2, c.r);
          break;
        }
      }
    }
    if (['room', 'time', 'obj'].some((k) => d[k].some((s) => s.size === 0))) return null;
  }
  return d;
}
const solves = (clues, n) => { const d = propagate(clues, n); return !!d && ['room', 'time', 'obj'].every((k) => d[k].every((s) => s.size === 1)); };

function drawWeighted(poolByType, R) {
  const types = Object.keys(poolByType).filter((t) => poolByType[t].length);
  const tot = types.reduce((a, t) => a + MIX[t], 0);
  let x = R() * tot;
  for (const t of types) { x -= MIX[t]; if (x <= 0) return t; }
  return types[types.length - 1];
}

function makeCase(n, R, band) {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const sol = { room: perm(n, R), time: perm(n, R), obj: perm(n, R) };
    const byType = {};
    for (const c of shuffle(allTrueClues(sol, n), R)) (byType[c.type] ||= []).push(c);
    const clues = [];
    while (!solves(clues, n)) {
      const t = drawWeighted(byType, R);
      if (!t) break;
      clues.push(byType[t].pop());
      if (clues.length > 40) break;
    }
    if (!solves(clues, n)) continue;
    // prune redundant clues in random order
    const keep = clues.map(() => true);
    for (const i of shuffle([...clues.keys()], R)) {
      keep[i] = false;
      if (!solves(clues.filter((_, j) => keep[j]), n)) keep[i] = true;
    }
    const kept = clues.filter((_, j) => keep[j]);
    clues.length = 0; clues.push(...kept);
    if (clues.length < band[0] || clues.length > band[1]) continue;
    // A floor is not a target: pad a minimal set with further TRUE clues up to
    // a count drawn from the live bank's own distribution for this day type.
    const target = band[2][Math.floor(R() * band[2].length)];
    const rest = Object.values(byType).flat().filter((c) => !clues.includes(c));
    shuffle(rest, R);
    while (clues.length < target && rest.length) clues.push(rest.pop());
    return { sol, clues: shuffle(clues, R) };
  }
  throw new Error('no case found');
}

const last = PUZZLES[PUZZLES.length - 1];
const dates = [];
for (let d = new Date(`${last.live}T12:00:00Z`); ;) {
  d.setUTCDate(d.getUTCDate() + 1);
  const iso = d.toISOString().slice(0, 10);
  if (iso > UNTIL) break;
  dates.push(iso);
}
if (dates.length > CASES.length) throw new Error(`need ${dates.length} venues, have ${CASES.length}`);

const usedVenues = new Set(PUZZLES.map((p) => p.venue.toLowerCase()));
const usedStolen = new Set(PUZZLES.map((p) => p.stolen.toLowerCase()));
for (const [v, s] of CASES) {
  if (usedVenues.has(v.toLowerCase()) || usedStolen.has(s.toLowerCase())) throw new Error(`repeat: ${v} / ${s}`);
  usedVenues.add(v.toLowerCase()); usedStolen.add(s.toLowerCase());
  for (const h of [...scanUS(v), ...scanUS(s)]) throw new Error(`British form ${h.found} in ${v} / ${s}`);
  if (/[—–]/.test(v + s)) throw new Error('em dash');
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const rows = [];
dates.forEach((iso, i) => {
  const num = last.num + 1 + i;
  const R = mulberry32(0xa11b1 + num * 7919);
  const [y, m, dd] = iso.split('-').map(Number);
  const sunday = new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
  const n = sunday ? 5 : 4;
  const band = sunday ? [10, 14, SUN_COUNTS] : [8, 11, WEEK_COUNTS];
  const { sol, clues } = makeCase(n, R, band);
  const start = Math.floor(R() * (HOURS.length - n + 1));
  const [venue, stolen] = CASES[i];
  const q = (a) => JSON.stringify(a);
  rows.push(`  {
    num: ${num}, quizId: "alibi-${m}-${dd}-${String(y).slice(2)}", live: "${iso}", dateLabel: "${MONTHS[m - 1]} ${dd}, ${y}", sunday: ${sunday},
    suspects: ${q(shuffle(SUSPECTS.slice(), R).slice(0, n))},
    rooms: ${q(shuffle(ROOMS.slice(), R).slice(0, n))},
    objects: ${q(shuffle(OBJECTS.slice(), R).slice(0, n))},
    times: ${q(HOURS.slice(start, start + n))},
    stolen: ${q(stolen)},
    venue: ${q(venue)},
    clues: [
${clues.map((c) => `      ${JSON.stringify(c)},`).join('\n')}
    ],
    solution: ${JSON.stringify(sol)},
  },`);
  console.error(`#${num} ${iso}${sunday ? ' SUN' : ''} ${clues.length} clues  ${venue}`);
});

if (WRITE) {
  const bank = fs.readFileSync(BANK, 'utf8');
  const close = bank.lastIndexOf('];');
  fs.writeFileSync(BANK, bank.slice(0, close) + rows.join('\n') + '\n' + bank.slice(close));
  console.error(`appended ${rows.length} cases`);
} else {
  console.error(`dry run: ${rows.length} cases (pass --write to append)`);
}
