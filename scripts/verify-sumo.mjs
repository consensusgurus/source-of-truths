#!/usr/bin/env node
// Bank checker for Sumo, the daily greater-than sudoku.
//
// It RECOMPUTES everything and trusts no stored field, and it shares NO code
// with the generator (scripts/sumo-core.mjs): Set-based candidates, its own
// reading of the signs, a solution counter that branches on the house/digit
// with the fewest places, and a logical solver POLICED against the known
// solution, so an unsound rule is reported rather than trusted.
//
// Per board: 1 the solution is a legal sudoku; 2 every stored sign agrees with
// the solution (h/v shape too); 3 the clues are a subset of it; 4 the printed
// count matches the weekday ramp (Mon 8, Tue 6, Wed 4, Thu 2, Fri 0, Sat 2,
// Sun 0); 5 exactly one solution under the signs; 6 it falls to logic with no
// guessing at level <= 2, and the level it needs equals the stored one and the
// weekday pin (Mon-Fri 1, Sat and Sun 2).
// Across the bank: contiguous nums, consecutive dates, labels, quizIds and the
// Sunday flag derived from the date, no repeated solution.
//
// Usage: node scripts/verify-sumo.mjs   (VERIFY_SUMO_BANK=<path> overrides)
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BANK = process.env.VERIFY_SUMO_BANK || path.join(process.cwd(), 'app/sumo/puzzles.js');
const { PUZZLES } = await import(pathToFileURL(BANK).href);
const PRINTED = { 0: 0, 1: 8, 2: 6, 3: 4, 4: 2, 5: 0, 6: 2 };
const LEVEL = { 0: 2, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2 };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fails = [];
const fail = (m) => fails.push(m);

const at = (r, c) => r * 9 + c;
const HOUSES = [];
for (let r = 0; r < 9; r++) HOUSES.push([0,1,2,3,4,5,6,7,8].map((c) => at(r, c)));
for (let c = 0; c < 9; c++) HOUSES.push([0,1,2,3,4,5,6,7,8].map((r) => at(r, c)));
for (let b = 0; b < 9; b++) { const r0 = 3 * Math.floor(b / 3), c0 = 3 * (b % 3); const h = []; for (let k = 0; k < 9; k++) h.push(at(r0 + Math.floor(k / 3), c0 + (k % 3))); HOUSES.push(h); }
const PEERS = Array.from({ length: 81 }, () => new Set());
for (const h of HOUSES) for (const a of h) for (const b of h) if (a !== b) PEERS[a].add(b);

// Read the signs into "less" relations, walking the strings rather than an
// edge table, so this cannot be a copy of the generator's pairsOf.
function relations(p) {
  const rel = [];
  if (!Array.isArray(p.h) || p.h.length !== 9 || p.h.some((s) => typeof s !== 'string' || !/^[<>]{6}$/.test(s))) return null;
  if (!Array.isArray(p.v) || p.v.length !== 6 || p.v.some((s) => typeof s !== 'string' || !/^[\^v]{9}$/.test(s))) return null;
  for (let r = 0; r < 9; r++) {
    let k = 0;
    for (let c = 0; c < 8; c++) { if (c % 3 === 2) continue; const ch = p.h[r][k++]; rel.push(ch === '<' ? [at(r, c), at(r, c + 1)] : [at(r, c + 1), at(r, c)]); }
  }
  let k = 0;
  for (let r = 0; r < 8; r++) { if (r % 3 === 2) continue; for (let c = 0; c < 9; c++) { const ch = p.v[k][c]; rel.push(ch === '^' ? [at(r, c), at(r + 1, c)] : [at(r + 1, c), at(r, c)]); } k++; }
  return rel;   // [lo, hi]
}

// Exhaustive count: propagate (peers, the box chains, the signs) then branch
// on the square with the fewest options. Independent of the policed solver
// below except for reading the same rulebook.
function count(given, rel, cap) {
  const below = Array.from({ length: 81 }, () => []), above = Array.from({ length: 81 }, () => []);
  for (const [a, b] of rel) { below[b].push(a); above[a].push(b); }
  const span = (i, adj) => { const s = new Set(); const q = [...adj[i]]; while (q.length) { const x = q.pop(); if (!s.has(x)) { s.add(x); q.push(...adj[x]); } } return s.size; };
  const start = Array.from({ length: 81 }, (_, i) => {
    if (given[i]) return [given[i]];
    const lo = span(i, below), hi = span(i, above);
    return [1,2,3,4,5,6,7,8,9].filter((d) => d > lo && d <= 9 - hi);
  });
  const settle = (c) => {
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < 81; i++) {
        if (c[i].length === 0) return false;
        if (c[i].length === 1) { const d = c[i][0]; for (const j of PEERS[i]) if (c[j].includes(d)) { c[j] = c[j].filter((x) => x !== d); moved = true; if (!c[j].length) return false; } }
      }
      for (const [a, b] of rel) {
        const mb = Math.max(...c[b]), ma = Math.min(...c[a]);
        const na = c[a].filter((d) => d < mb), nb = c[b].filter((d) => d > ma);
        if (na.length !== c[a].length || nb.length !== c[b].length) { c[a] = na; c[b] = nb; moved = true; if (!na.length || !nb.length) return false; }
      }
    }
    for (let i = 0; i < 81; i++) if (c[i].length === 1) for (const j of PEERS[i]) if (c[j].length === 1 && c[j][0] === c[i][0]) return false;
    return true;
  };
  let n = 0;
  (function go(c) {
    if (n >= cap || !settle(c)) return;
    let best = -1;
    for (let i = 0; i < 81; i++) if (c[i].length > 1 && (best < 0 || c[i].length < c[best].length)) best = i;
    if (best < 0) { n++; return; }
    for (const d of c[best]) { const nc = c.map((x) => x.slice()); nc[best] = [d]; go(nc); if (n >= cap) return; }
  })(start.map((x) => x.slice()));
  return n;
}

function logic(given, sol, rel, maxLevel) {
  const cand = Array.from({ length: 81 }, (_, i) => new Set(given[i] ? [given[i]] : [1,2,3,4,5,6,7,8,9]));
  const unsound = [];
  const drop = (i, d) => { if (!cand[i].has(d)) return false; if (d === sol[i]) unsound.push(`removed true ${d} at ${i}`); cand[i].delete(d); return true; };
  // box chains: count the squares reachable below / above inside the box
  const below = Array.from({ length: 81 }, () => []), above = Array.from({ length: 81 }, () => []);
  for (const [a, b] of rel) { below[b].push(a); above[a].push(b); }
  const reach = (i, adj) => { const s = new Set(); const q = [...adj[i]]; while (q.length) { const x = q.shift(); if (!s.has(x)) { s.add(x); q.push(...adj[x]); } } return s.size; };
  for (let i = 0; i < 81; i++) { const b = reach(i, below), a = reach(i, above); for (const d of [...cand[i]]) if (d <= b || d > 9 - a) drop(i, d); }
  let changed = true;
  const fixed = (i) => cand[i].size === 1;
  while (changed) {
    changed = false;
    // peers of a fixed square
    for (let i = 0; i < 81; i++) if (fixed(i)) { const d = [...cand[i]][0]; for (const j of PEERS[i]) if (drop(j, d)) changed = true; }
    // signs
    for (const [a, b] of rel) {
      if (!cand[a].size || !cand[b].size) return { ok: false, unsound };
      const maxB = Math.max(...cand[b]), minA = Math.min(...cand[a]);
      for (const d of [...cand[a]]) if (d >= maxB && drop(a, d)) changed = true;
      for (const d of [...cand[b]]) if (d <= minA && drop(b, d)) changed = true;
    }
    if (changed) continue;
    // hidden singles
    for (const h of HOUSES) for (let d = 1; d <= 9; d++) {
      const spots = h.filter((i) => cand[i].has(d));
      if (spots.length === 1 && cand[spots[0]].size > 1) { for (const x of [...cand[spots[0]]]) if (x !== d) drop(spots[0], x); changed = true; }
    }
    if (changed || maxLevel < 2) continue;
    // pointing / claiming
    for (const h of HOUSES) for (let d = 1; d <= 9; d++) {
      const spots = h.filter((i) => cand[i].has(d) && !fixed(i));
      if (spots.length < 2 || h.some((i) => fixed(i) && cand[i].has(d))) continue;
      for (const h2 of HOUSES) {
        if (h2 === h || !spots.every((i) => h2.includes(i))) continue;
        for (const j of h2) if (!spots.includes(j) && drop(j, d)) changed = true;
      }
    }
    if (changed) continue;
    // naked pairs / triples, hidden pairs
    for (const h of HOUSES) {
      const open = h.filter((i) => !fixed(i));
      const combos = [];
      for (let a = 0; a < open.length; a++) for (let b = a + 1; b < open.length; b++) { combos.push([open[a], open[b]]); for (let c = b + 1; c < open.length; c++) combos.push([open[a], open[b], open[c]]); }
      for (const grp of combos) {
        const u = new Set(); grp.forEach((i) => cand[i].forEach((d) => u.add(d)));
        if (u.size !== grp.length) continue;
        for (const j of open) if (!grp.includes(j)) for (const d of u) if (drop(j, d)) changed = true;
      }
      for (let d1 = 1; d1 <= 9; d1++) for (let d2 = d1 + 1; d2 <= 9; d2++) {
        // a digit already placed in this house is not a hidden-pair digit,
        // even while a stale candidate for it has not been rubbed out yet
        if (h.some((i) => fixed(i) && (cand[i].has(d1) || cand[i].has(d2)))) continue;
        const s1 = open.filter((i) => cand[i].has(d1)), s2 = open.filter((i) => cand[i].has(d2));
        if (s1.length === 2 && s2.length === 2 && s1[0] === s2[0] && s1[1] === s2[1]) for (const i of s1) for (const x of [...cand[i]]) if (x !== d1 && x !== d2 && drop(i, x)) changed = true;
      }
    }
  }
  return { ok: cand.every((s) => s.size === 1), unsound };
}

const asDate = (iso) => new Date(iso + 'T00:00:00Z');
let prev = null; const seen = new Set();
PUZZLES.forEach((p, k) => {
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== k + 1) fail(`${tag}: num out of sequence`);
  if (prev && Math.round((asDate(p.live) - asDate(prev)) / 86400000) !== 1) fail(`${tag}: date not consecutive`);
  prev = p.live;
  const d = asDate(p.live), dow = d.getUTCDay();
  if (p.dateLabel !== `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`) fail(`${tag}: dateLabel`);
  if (p.quizId !== `sumo-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`) fail(`${tag}: quizId`);
  if (p.sunday !== (dow === 0)) fail(`${tag}: sunday flag`);
  const sol = p.sol.flat(), given = p.given.flat();
  if (sol.length !== 81 || given.length !== 81) { fail(`${tag}: shape`); return; }
  for (const h of HOUSES) if (new Set(h.map((i) => sol[i])).size !== 9 || h.some((i) => !(sol[i] >= 1 && sol[i] <= 9))) { fail(`${tag}: solution not a legal sudoku`); break; }
  const rel = relations(p);
  if (!rel) { fail(`${tag}: signs malformed`); return; }
  if (rel.length !== 108) fail(`${tag}: ${rel.length} signs, expected 108`);
  for (const [a, b] of rel) if (!(sol[a] < sol[b])) { fail(`${tag}: a sign disagrees with the solution at ${a}/${b}`); break; }
  if (given.some((v, i) => v && v !== sol[i])) fail(`${tag}: a clue is not in the solution`);
  const printed = given.filter(Boolean).length;
  if (printed !== p.printed || printed !== PRINTED[dow]) fail(`${tag}: printed ${printed}, stored ${p.printed}, ramp ${PRINTED[dow]}`);
  if (count(given, rel, 2) !== 1) fail(`${tag}: not exactly one solution`);
  const l1 = logic(given, sol, rel, 1), l2 = logic(given, sol, rel, 2);
  if (l1.unsound.length || l2.unsound.length) fail(`${tag}: UNSOUND verifier rule: ${[...l1.unsound, ...l2.unsound][0]}`);
  const need = l1.ok ? 1 : l2.ok ? 2 : 3;
  if (need === 3) fail(`${tag}: needs more than level 2`);
  else if (need !== p.level || need !== LEVEL[dow]) fail(`${tag}: needs level ${need}, stored ${p.level}, pinned ${LEVEL[dow]}`);
  const key = sol.join('');
  if (seen.has(key)) fail(`${tag}: repeated solution`);
  seen.add(key);
});

if (fails.length) { console.error(`verify-sumo: ${fails.length} failures\n` + fails.slice(0, 30).map((f) => `  FAIL ${f}`).join('\n')); process.exit(1); }
console.log(`verify-sumo: ${PUZZLES.length} boards OK (${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live})`);
