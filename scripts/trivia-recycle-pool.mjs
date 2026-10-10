// scripts/trivia-recycle-pool.mjs - lists the trivia questions nobody has ever
// answered, ready to paste into a bank's authored source as recycled entries.
// The rules are in the header of scripts/trivia-recycle.mjs; read them first.
//
//   node scripts/trivia-recycle-pool.mjs                    # summary, every game
//   node scripts/trivia-recycle-pool.mjs atlas              # atlas's pool, source shape
//   node scripts/trivia-recycle-pool.mjs atlas --tier 5 --lane Capitals
//   node scripts/trivia-recycle-pool.mjs streak --deep      # Deep questions for Streak tier 5
//   node scripts/trivia-recycle-pool.mjs atlas --json
//
// Reads the NEWEST snapshot in scripts/trivia-recycle/. Pull a fresh one before
// a restock (CLAUDE.md, "Recycling unanswered trivia questions"): a snapshot
// more than a week old is refused unless --stale is passed, because a pool
// read off an old snapshot misses every day played since.
//
// Already-claimed originals are left out: any `from: '<game>:<id>'` written in
// the shipped bank OR anywhere in scripts/ (the lane and source files a
// generator reads) is taken, so two lanes or two agents cannot claim the same
// question.
//
// Each entry prints in the authored source shape, true answer first:
//   { c: '<lane>', t: <tier>, q: '...', a: '<answer>', d: [three wrong], from: '<game>:<id>' }
// which is the shape of streak-source.mjs, quotes-source.mjs, script-source.mjs
// and every file in atlas-lanes/, sport-lanes/ and biz-lanes/. The generators
// carry `from` through to the shipped questions.js, where the verifiers check it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES, loadSnapshots, loadBank, unansweredOn, placements, DEEP_TO_STREAK_TIER } from './trivia-recycle.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const game = args.find((a) => GAMES.includes(a)) || null;

const snaps = loadSnapshots();
if (!snaps.length) { console.error('no snapshot in scripts/trivia-recycle/'); process.exit(1); }
const snap = snaps[snaps.length - 1];
const ageDays = Math.floor((Date.now() - Date.parse(`${snap.date}T12:00:00Z`)) / 86400000);
if (ageDays > 7 && !flag('--stale')) {
  console.error(`newest snapshot is ${snap.date} (${ageDays} days old). Pull a fresh one, or pass --stale to read it anyway.`);
  process.exit(1);
}

// Every from: claimed anywhere.
const claimed = new Set();
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
    if (!/\.(mjs|js)$/.test(e.name) || p === fileURLToPath(import.meta.url)) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/from:\s*['"](\w+:d\d{2,3}q\d\d)['"]/g)) claimed.add(m[1]);
  }
};
walk(HERE);
for (const g of GAMES) {
  const { QUESTIONS } = await loadBank(g);
  for (const q of QUESTIONS) if (q.from) claimed.add(q.from);
}

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
async function pool(g) {
  const { QUESTIONS, PUZZLES } = await loadBank(g);
  const ids = unansweredOn(snap, PUZZLES);
  const at = placements(PUZZLES);
  const out = [];
  for (const q of QUESTIONS) {
    if (!ids.has(q.id) || claimed.has(`${g}:${q.id}`)) continue;
    const a = q.choices[q.correct];
    out.push({ g, id: q.id, c: q.cat || null, t: q.tier, q: q.q, a, d: q.choices.filter((_, i) => i !== q.correct), ...at.get(q.id) });
  }
  return out;
}
const line = (e, withLane = true) =>
  `  { ${withLane && e.c ? `c: '${esc(e.c)}', ` : ''}t: ${e.t}, q: '${esc(e.q)}', a: '${esc(e.a)}', d: [${e.d.map((x) => `'${esc(x)}'`).join(', ')}], from: '${e.g}:${e.id}' },`;

if (!game) {
  console.log(`snapshot ${snap.date}; never-answered questions not yet recycled, by tier:`);
  for (const g of GAMES) {
    const p = await pool(g);
    const by = {};
    for (const e of p) by[e.t] = (by[e.t] || 0) + 1;
    console.log(`  ${g.padEnd(7)} ${String(p.length).padStart(4)}   ${[1, 2, 3, 4, 5].map((t) => `t${t} ${by[t] || 0}`).join('  ')}${g === 'deep' ? '   (Streak tier 5 only)' : ''}`);
  }
} else {
  await listGame();
}

// NEVER process.exit() after printing here: on a pipe it cuts stdout at 64KB,
// which is exactly how a pool piped into a file or another script arrives.
async function listGame() {

let entries = flag('--deep') && game === 'streak' ? await pool('deep') : await pool(game);
if (flag('--deep') && game !== 'streak') { console.error('--deep is for streak only'); process.exitCode = 1; return; }
const tier = opt('--tier'); const lane = opt('--lane');
if (tier) entries = entries.filter((e) => e.t === Number(tier));
if (lane) entries = entries.filter((e) => e.c === lane);

if (flag('--json')) { console.log(JSON.stringify(entries, null, 1)); return; }
if (flag('--deep')) {
  console.log(`// ${entries.length} unanswered Deep questions for STREAK TIER ${DEEP_TO_STREAK_TIER} ONLY (snapshot ${snap.date}).`);
  console.log('// Pick a Streak lane for each (c), and rewrite any stem that leans on the day\'s topic. Keep the answer.');
  let topic = null;
  for (const e of entries) {
    if (e.topic !== topic) { topic = e.topic; console.log(`\n// Deep ${e.live}: ${topic}`); }
    console.log(line({ ...e, c: '?', t: DEEP_TO_STREAK_TIER }));
  }
} else {
  console.log(`// ${entries.length} unanswered ${game} questions (snapshot ${snap.date}). Same lane, same tier, same stem and answer.`);
  let key = null;
  for (const e of entries.sort((x, y) => x.t - y.t || String(x.c).localeCompare(String(y.c)) || x.live.localeCompare(y.live))) {
    const k = `${e.t}|${e.c}`;
    if (k !== key) { key = k; console.log(`\n// tier ${e.t}${e.c ? `, ${e.c}` : ''}`); }
    console.log(line(e));
  }
}
}
