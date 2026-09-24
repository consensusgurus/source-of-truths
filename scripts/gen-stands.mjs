#!/usr/bin/env node
// Generator for the Stands bank (app/stands/puzzles.js).
//
// APPEND ONLY. Reads the bank, takes its last num and live date, and writes
// new boards for each day after it through --until (inclusive). Frozen boards
// are never regenerated; new rows are spliced in front of the closing `];`.
//
//   node scripts/gen-stands.mjs --until 2026-11-30            # dry run
//   node scripts/gen-stands.mjs --until 2026-11-30 --write    # append
//
// Method: deal a random round robin (five teams on weekdays, six on Sundays),
// list every TRUE clue about it, draw clues weighted to the live bank's type
// mix until exactly one table satisfies them, then prune to a MINIMAL set
// (drop clues in random order while the table stays unique, so every line that
// survives is needed). A board ships only with at least three kinds of clue and
// a clue count inside the range the live bank uses for that day type; the
// target count is drawn from the bank's own distribution so the week varies.
// The solver is the verifier's (kept byte-identical in StandsClient.jsx);
// scripts/verify-stands.mjs re-proves uniqueness and minimality.
//
// Team names are the bank's own place names, one per letter slot (A..E, F on
// Sundays) as the bank does, and no board repeats a team set already banked.
// Deterministic, seeded off the board NUMBER.
import fs from 'node:fs';
import { PUZZLES } from '../app/stands/puzzles.js';

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const UNTIL = arg('--until', '2026-11-30');
const WRITE = args.includes('--write');
const BANK = new URL('../app/stands/puzzles.js', import.meta.url);

const pairsOf = (n) => { const p = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) p.push([i, j]); return p; };

// The verifier's solver.
function countSolutions(n, pairs, clues, cap) {
  const m = pairs.length;
  const fixed = Array(m).fill(-1);
  const idx = (x, y) => pairs.findIndex(([a, b]) => (a === x && b === y) || (a === y && b === x));
  for (const c of clues) {
    if (c.type === 'beat') { const k = idx(c.x, c.y); const v = pairs[k][0] === c.x ? 0 : 2; if (fixed[k] >= 0 && fixed[k] !== v) return 0; fixed[k] = v; }
    if (c.type === 'drew') { const k = idx(c.x, c.y); if (fixed[k] >= 0 && fixed[k] !== 1) return 0; fixed[k] = 1; }
  }
  const want = { pts: Array(n).fill(-1), wins: Array(n).fill(-1), draws: Array(n).fill(-1) };
  const unbeaten = [], winless = [], rest = [];
  let totalDraws = -1;
  for (const c of clues) {
    if (c.type === 'points') want.pts[c.x] = c.p;
    else if (c.type === 'wins') want.wins[c.x] = c.n;
    else if (c.type === 'draws') want.draws[c.x] = c.n;
    else if (c.type === 'unbeaten') unbeaten.push(c.x);
    else if (c.type === 'winless') winless.push(c.x);
    else if (c.type === 'totalDraws') totalDraws = c.n;
    else if (c.type === 'above') rest.push(c);
  }
  const left = Array(n).fill(0);
  pairs.forEach(([i, j], k) => { if (fixed[k] < 0) { left[i]++; left[j]++; } });
  const pts = Array(n).fill(0), wins = Array(n).fill(0), draws = Array(n).fill(0), losses = Array(n).fill(0);
  const bump = (i, j, r, s) => {
    if (r === 0) { pts[i] += 3 * s; wins[i] += s; losses[j] += s; }
    else if (r === 2) { pts[j] += 3 * s; wins[j] += s; losses[i] += s; }
    else { pts[i] += s; pts[j] += s; draws[i] += s; draws[j] += s; }
  };
  pairs.forEach(([i, j], k) => { if (fixed[k] >= 0) bump(i, j, fixed[k], 1); });
  const free = []; pairs.forEach((p, k) => { if (fixed[k] < 0) free.push(k); });
  let found = 0, drawsUsed = fixed.filter((f) => f === 1).length;
  const alive = (i) => {
    if (want.pts[i] >= 0 && (pts[i] > want.pts[i] || pts[i] + 3 * left[i] < want.pts[i])) return false;
    if (want.wins[i] >= 0 && (wins[i] > want.wins[i] || wins[i] + left[i] < want.wins[i])) return false;
    if (want.draws[i] >= 0 && (draws[i] > want.draws[i] || draws[i] + left[i] < want.draws[i])) return false;
    if (unbeaten.includes(i) && losses[i] > 0) return false;
    if (winless.includes(i) && wins[i] > 0) return false;
    return true;
  };
  (function rec(t) {
    if (found >= cap) return;
    if (t === free.length) {
      if (totalDraws >= 0 && drawsUsed !== totalDraws) return;
      for (const c of rest) if (!(pts[c.x] > pts[c.y])) return;
      found++; return;
    }
    const k = free[t], [i, j] = pairs[k];
    for (let r = 0; r < 3; r++) {
      bump(i, j, r, 1); left[i]--; left[j]--; if (r === 1) drawsUsed++;
      if (alive(i) && alive(j) && (totalDraws < 0 || drawsUsed <= totalDraws)) rec(t + 1);
      if (r === 1) drawsUsed--; left[i]++; left[j]++; bump(i, j, r, -1);
      if (found >= cap) return;
    }
  })(0);
  return found;
}

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const MIX = {};
for (const p of PUZZLES) for (const c of p.clues) MIX[c.type] = (MIX[c.type] || 0) + 1;
const COUNTS = { false: PUZZLES.filter((p) => !p.sunday).map((p) => p.clues.length), true: PUZZLES.filter((p) => p.sunday).map((p) => p.clues.length) };
const RANGE = { false: [Math.min(...COUNTS.false), Math.max(...COUNTS.false)], true: [Math.min(...COUNTS.true), Math.max(...COUNTS.true)] };

function trueClues(n, pairs, res) {
  const pts = Array(n).fill(0), wins = Array(n).fill(0), draws = Array(n).fill(0), losses = Array(n).fill(0);
  const out = [];
  let td = 0;
  pairs.forEach(([i, j], k) => {
    const r = res[k];
    if (r === 0) { pts[i] += 3; wins[i]++; losses[j]++; out.push({ type: 'beat', x: i, y: j }); }
    else if (r === 2) { pts[j] += 3; wins[j]++; losses[i]++; out.push({ type: 'beat', x: j, y: i }); }
    else { pts[i]++; pts[j]++; draws[i]++; draws[j]++; td++; out.push({ type: 'drew', x: i, y: j }); }
  });
  for (let i = 0; i < n; i++) {
    out.push({ type: 'points', x: i, p: pts[i] }, { type: 'wins', x: i, n: wins[i] }, { type: 'draws', x: i, n: draws[i] });
    if (losses[i] === 0) out.push({ type: 'unbeaten', x: i });
    if (wins[i] === 0) out.push({ type: 'winless', x: i });
    for (let j = 0; j < n; j++) if (pts[i] > pts[j]) out.push({ type: 'above', x: i, y: j });
  }
  out.push({ type: 'totalDraws', n: td });
  return out;
}

function makeBoard(n, sunday, R) {
  const pairs = pairsOf(n);
  const target = COUNTS[sunday][Math.floor(R() * COUNTS[sunday].length)];
  const [lo, hi] = RANGE[sunday];
  for (let attempt = 0; attempt < 20000; attempt++) {
    const res = pairs.map(() => { const x = R(); return x < 0.27 ? 1 : x < 0.635 ? 0 : 2; });
    const byType = {};
    for (const c of shuffle(trueClues(n, pairs, res), R)) (byType[c.type] ||= []).push(c);
    const clues = [];
    let sols = 2;
    while (sols > 1) {
      const types = Object.keys(byType).filter((t) => byType[t].length);
      if (!types.length) break;
      const tot = types.reduce((s, t) => s + MIX[t], 0);
      let x = R() * tot, t = types[types.length - 1];
      for (const tt of types) { x -= MIX[tt]; if (x <= 0) { t = tt; break; } }
      clues.push(byType[t].pop());
      sols = countSolutions(n, pairs, clues, 2);
    }
    if (sols !== 1) continue;
    const keep = clues.map(() => true);
    for (const i of shuffle([...clues.keys()], R)) {
      keep[i] = false;
      if (countSolutions(n, pairs, clues.filter((_, j) => keep[j]), 2) !== 1) keep[i] = true;
    }
    const final = shuffle(clues.filter((_, j) => keep[j]), R);
    if (final.length < lo || final.length > hi) continue;
    if (Math.abs(final.length - target) > (attempt < 4000 ? 0 : 1)) continue;
    if (new Set(final.map((c) => c.type)).size < 3) continue;
    return final;
  }
  throw new Error('no board');
}

const BY_LETTER = {};
for (const p of PUZZLES) p.teams.forEach((t, i) => { (BY_LETTER[i] ||= new Set()).add(t); });
const usedSets = new Set(PUZZLES.map((p) => p.teams.join('|')));

const last = PUZZLES[PUZZLES.length - 1];
const dates = [];
for (let d = new Date(`${last.live}T12:00:00Z`); ;) { d.setUTCDate(d.getUTCDate() + 1); const iso = d.toISOString().slice(0, 10); if (iso > UNTIL) break; dates.push(iso); }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const rows = [];
dates.forEach((iso, i) => {
  const num = last.num + 1 + i;
  const R = mulberry32(0x57a4d + num * 15485863);
  const [y, m, d] = iso.split('-').map(Number);
  const sunday = new Date(`${iso}T12:00:00Z`).getUTCDay() === 0;
  const n = sunday ? 6 : 5;
  let teams;
  do teams = [...Array(n).keys()].map((k) => { const pool = [...BY_LETTER[k]]; return pool[Math.floor(R() * pool.length)]; });
  while (usedSets.has(teams.join('|')));
  usedSets.add(teams.join('|'));
  const clues = makeBoard(n, sunday, R);
  rows.push(`  {
    num: ${num}, quizId: 'stands-${m}-${d}-${String(y).slice(2)}', live: '${iso}', dateLabel: '${MONTHS[m - 1]} ${d}, ${y}', sunday: ${sunday},
    teams: [${teams.map((t) => `'${t}'`).join(', ')}],
    clues: [
${clues.map((c) => `      { ${Object.entries(c).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`).join(', ')} },`).join('\n')}
    ],
  },`);
  console.error(`#${num} ${iso}${sunday ? ' SUN' : ''} ${clues.length} clues: ${clues.map((c) => c.type).join(' ')}`);
});

if (WRITE) {
  const bank = fs.readFileSync(BANK, 'utf8');
  const close = bank.lastIndexOf('];');
  fs.writeFileSync(BANK, bank.slice(0, close) + rows.join('\n') + '\n' + bank.slice(close));
  console.error(`appended ${rows.length} boards`);
} else console.error(`dry run: ${rows.length} boards (pass --write to append)`);
