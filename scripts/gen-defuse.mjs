// scripts/gen-defuse.mjs: writes app/defuse/puzzles.js, deterministically off
// each date. Re-running reproduces the bank byte for byte, so it may only be
// used to APPEND days (raise END); live boards are frozen.
//
//   node scripts/gen-defuse.mjs
//
// For each day it draws a device and a manual at random until the board is
// PROVED: exactly one safe order, every live rule needed, decoys false, and on
// Gentle and Moderate days every wrong cut breaking a rule on the spot. The
// ramp is in scripts/defuse-header.txt, which becomes the bank's header.
import fs from 'fs';
import { WIRE_NAMES, condTrue, cutSet, solutions, breach, pickWire, ruleText } from '../lib/defuse-engine.js';

const START = '2026-11-12', END = '2026-12-31';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LIGHTS = ['FRK', 'CAR', 'SIG', 'MSA', 'BOB', 'TRN', 'CLR', 'IND'];
const LETTERS = 'ABCDEFGHJKLMNPRSTVWXZ';
const TIERS = { gentle: { label: 'Gentle', wires: 4, live: [3, 3], decoys: [0, 0], greedy: true },
  moderate: { label: 'Moderate', wires: 5, live: [4, 4], decoys: [1, 1], greedy: true },
  tough: { label: 'Tough', wires: 6, live: [5, 5], decoys: [1, 2], greedy: false },
  sunday: { label: 'Tough', wires: 7, live: [5, 6], decoys: [2, 2], greedy: false } };
const tierOf = (live) => { const d = new Date(`${live}T12:00:00Z`).getUTCDay(); return d === 0 ? 'sunday' : d <= 2 ? 'gentle' : d <= 4 ? 'moderate' : 'tough'; };

function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mk = (R) => ({ int: (a, b) => a + Math.floor(R() * (b - a + 1)), pick: (arr) => arr[Math.floor(R() * arr.length)], chance: (p) => R() < p,
  shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } });

function device(T, r) {
  const palette = r.shuffle(WIRE_NAMES).slice(0, Math.min(WIRE_NAMES.length, T.wires - (T.wires >= 5 ? r.int(1, 2) : r.int(0, 1))));
  let wires;
  do { wires = Array.from({ length: T.wires }, (_, i) => (i < palette.length ? palette[i] : r.pick(palette))); wires = r.shuffle(wires); }
  while (wires.some((w, i) => i > 1 && w === wires[i - 1] && w === wires[i - 2]));
  return { wires, serial: `${r.pick([...LETTERS])}${r.pick([...LETTERS])}-${r.int(1000, 9999)}`, batteries: r.int(1, 3), light: { label: r.pick(LIGHTS), on: r.chance(0.5) } };
}
// A condition that is `want` (true or false) on this device.
function cond(P, r, want) {
  const all = [{ c: 'serialOdd' }, { c: 'serialEven' }, { c: 'batt', n: 1 }, { c: 'batt', n: 2 }, { c: 'batt', n: 3 }, { c: 'battMore' }, { c: 'light', on: true }, { c: 'light', on: false },
    ...WIRE_NAMES.map((color) => ({ c: 'many', color })), ...WIRE_NAMES.map((color) => ({ c: 'none', color }))];
  // Skip conditions a glance settles ("more than one green wire" with no green at all is no decoy worth printing).
  const ok = all.filter((c) => condTrue(P, c) === want && !(c.c === 'many' && !want && !P.wires.includes(c.color)));
  return r.pick(ok);
}
function orderRule(P, r, type) {
  const need = cutSet(P), cols = [...new Set(need.map((i) => P.wires[i]))], count = (c) => need.filter((i) => P.wires[i] === c).length;
  const solo = cols.filter((c) => count(c) === 1 && P.wires.filter((w) => w === c).length === 1), multi = cols.filter((c) => P.wires.filter((w) => w === c).length > 1);
  switch (type) {
    case 'first': {
      if (r.chance(0.25)) return { type, idx: r.pick(need) };
      const c = r.pick(cols), tot = P.wires.filter((w) => w === c).length;
      const rule = { type, color: c, which: tot === 1 ? 'only' : r.pick(['first', 'last']) };
      return need.includes(pickWire(P, rule)) ? rule : null;
    }
    case 'last': return solo.length ? { type, color: r.pick(solo) } : null;
    case 'before': { if (cols.length < 2) return null; const [a, b] = r.shuffle(cols); return { type, a, b }; }
    case 'noAdj': return { type };
    case 'noSame': { const m = multi.filter((c) => count(c) > 1); if (!m.length) return null; return r.chance(0.5) ? { type } : { type, color: r.pick(m) }; }
    case 'nth': { if (need.length < 3) return null; return { type, k: r.int(2, Math.min(need.length - 1, 5)), color: r.pick(cols) }; }
    case 'dir': return { type, color: r.pick(cols), side: r.pick(['left', 'right']) };
    default: return null;
  }
}
const ORDER_TYPES = ['first', 'last', 'before', 'before', 'noAdj', 'noSame', 'nth', 'dir', 'dir'];

function build(tier, r) {
  const T = TIERS[tier];
  const P = { ...device(T, r), rules: [] };
  const nLive = r.int(T.live[0], T.live[1]), nDecoy = r.int(T.decoys[0], T.decoys[1]);
  // at most one keep rule, and never one that leaves fewer than three cuts
  if (r.chance(tier === 'gentle' ? 0.35 : 0.7)) {
    const k = r.chance(0.7) ? { type: 'keep', color: r.pick([...new Set(P.wires)]) } : { type: 'keep', pos: r.pick(['first', 'last']) };
    if (r.chance(0.6)) k.cond = cond(P, r, true);
    P.rules.push(k);
    if (cutSet(P).length < Math.max(3, T.wires - 2)) return null;
  }
  const seen = new Set(P.rules.map((x) => x.type));
  for (let guard = 0; P.rules.length < nLive && guard < 60; guard++) {
    const type = r.pick(ORDER_TYPES);
    if (seen.has(type) && type !== 'before' && type !== 'dir') continue;
    const rule = orderRule(P, r, type); if (!rule) continue;
    if (P.rules.some((x) => JSON.stringify({ ...x, cond: 0 }) === JSON.stringify({ ...rule, cond: 0 }))) continue;
    if (P.rules.filter((x) => x.type === type).length >= 2) continue;
    if (r.chance(0.4)) rule.cond = cond(P, r, true);
    seen.add(type); P.rules.push(rule);
  }
  if (P.rules.length !== nLive) return null;
  const sols = solutions(P, 2); if (sols.length !== 1) return null;
  const sol = sols[0];
  for (let i = 0; i < P.rules.length; i++) if (P.rules[i].type !== 'keep' && solutions(P, 2, i).length < 2) return null;
  const asc = sol.every((w, k) => k === 0 || w > sol[k - 1]), desc = sol.every((w, k) => k === 0 || w < sol[k - 1]);
  if (asc || desc) return null;
  // decoys: rules whose condition is false here, shaped like the live ones
  for (let guard = 0, made = 0; made < nDecoy; guard++) {
    if (guard > 40) return null;
    const type = r.pick(['keep', 'first', 'last', 'before', 'nth', 'dir', 'noSame']);
    let rule;
    if (type === 'keep') rule = { type, color: r.pick([...new Set(P.wires)]) };
    else if (type === 'last') { const solo = [...new Set(P.wires)].filter((c) => P.wires.filter((w) => w === c).length === 1); if (!solo.length) continue; rule = { type, color: r.pick(solo) }; }
    else rule = orderRule(P, r, type);
    if (!rule) continue;
    rule.cond = cond(P, r, false);
    if (P.rules.some((x) => JSON.stringify({ ...x, cond: 0 }) === JSON.stringify({ ...rule, cond: 0 }))) continue;
    P.rules.push(rule); made++;
  }
  P.rules = r.shuffle(P.rules);
  if (solutions(P, 2).length !== 1) return null;
  // does every wrong cut break a rule on the spot?
  let lookAhead = false;
  for (let k = 0; k < sol.length && !lookAhead; k++) for (let w = 0; w < P.wires.length; w++) {
    if (sol.slice(0, k).includes(w) || w === sol[k]) continue;
    if (breach(P, [...sol.slice(0, k), w]) < 0) { lookAhead = true; break; }
  }
  if (T.greedy && lookAhead) return null;
  if (!T.greedy && !lookAhead) return null;
  if (breach(P, sol.slice(0, 1)) >= 0) return null;
  for (let k = 1; k <= sol.length; k++) if (breach(P, sol.slice(0, k)) >= 0) return null;   // the safe order never trips the on-the-spot test
  const texts = P.rules.map((x) => ruleText(P, x));
  if (new Set(texts).size !== texts.length) return null;
  return { ...P, solution: sol, active: P.rules.filter((x) => condTrue(P, x.cond)).length, lookAhead };
}

const out = [], firstPos = {}, typeDays = {};
let prevFirst = -1, prevSig = '';
for (let d = new Date(`${START}T12:00:00Z`), num = 1; d <= new Date(`${END}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1), num++) {
  const live = d.toISOString().slice(0, 10), tier = tierOf(live), [y, m, dd] = live.split('-').map(Number);
  let P = null;
  for (let attempt = 0; attempt < 200000 && !P; attempt++) {
    const r = mk(rng(hash(`defuse:${live}:${attempt}`)));
    const b = build(tier, r); if (!b) continue;
    const f = b.solution[0], sig = b.rules.filter((x) => condTrue(b, x.cond)).map((x) => x.type).sort().join();
    if (f === prevFirst || sig === prevSig) continue;                       // never the same opening wire or the same mix of rules two days running
    if ((firstPos[f] || 0) >= Math.max(3, Math.ceil(out.length * 0.3))) continue;   // no wire position opens too often
    const types = new Set(b.rules.filter((x) => condTrue(b, x.cond)).map((x) => x.type));
    if ([...types].some((t) => (typeDays[t] || 0) >= Math.max(4, Math.ceil((out.length + 1) * 0.62)))) continue;   // no rule type on nearly every board
    P = b; prevFirst = f; prevSig = sig; firstPos[f] = (firstPos[f] || 0) + 1; types.forEach((t) => { typeDays[t] = (typeDays[t] || 0) + 1; });
  }
  if (!P) throw new Error(`no board for ${live}`);
  out.push({ num, quizId: `defuse-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, tier: TIERS[tier].label, ...P });
}
const header = fs.readFileSync(new URL('./defuse-header.txt', import.meta.url), 'utf8');
fs.writeFileSync(new URL('../app/defuse/puzzles.js', import.meta.url), `${header}export const PUZZLES = [\n${out.map((p) => '  ' + JSON.stringify(p)).join(',\n')},\n];\n`);
console.log(`gen-defuse: ${out.length} boards, ${out[0].live} to ${out[out.length - 1].live}`, typeDays, firstPos);
