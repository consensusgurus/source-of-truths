// scripts/sport-global-mix.mjs: re-plans every Sport day from --from onward to
// the global mix in scripts/sport-mix.mjs (owner, 2026-10-30: less US centric,
// still some US, push the US surplus out to future inventory, delete nothing).
//
//   node scripts/sport-global-mix.mjs [--from 2026-10-31] [--extra lane.mjs ...]
//
// WHAT IT DOES. Days before --from are frozen and kept byte for byte. Every
// question on a day at or after --from, plus everything waiting in
// scripts/sport-lanes/sport-inventory.mjs, plus any --extra lane files (newly
// authored questions in the lane shape { c, t, q, a, d }), goes into one pool.
// Days are then laid out again in the World, US, World, US, World pattern,
// earliest-authored first, until the WORLD questions run out (they are the
// scarce half). Every question no day uses goes back to the inventory file,
// so nothing is lost. Run it again with --extra to restock: new world
// questions pull the waiting US ones back onto the calendar.
//
// Each day keeps the bank's other rules: the 1..5 tier ramp, ids d<day>q<slot>
// carrying the day's number, one rules-type question at most, no answer twice
// in a day, and a balanced no-3-run spread of correct columns (the choices of a
// re-planned question are rotated so its answer lands in the planned column;
// the distractors keep their order). Then run scripts/verify-sport.mjs.
import fs from 'fs';
import path from 'path';
import url from 'url';
import { rulesHit, MIX_PATTERN, isUSQuestion, usKind } from './sport-mix.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const Q_FILE = path.join(ROOT, 'app/sport/questions.js');
const P_FILE = path.join(ROOT, 'app/sport/puzzles.js');
const INV_FILE = path.join(HERE, 'sport-lanes/sport-inventory.mjs');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const FROM = arg('--from', '2026-10-31');
const EXTRA = argv.flatMap((a, i) => (argv[i - 1] === '--extra' ? [a] : []));
const die = (m) => { console.error(`sport-global-mix: ${m}`); process.exit(1); };

const { QUESTIONS } = await import(url.pathToFileURL(Q_FILE).href);
const { PUZZLES } = await import(url.pathToFileURL(P_FILE).href);
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const firstIdx = PUZZLES.findIndex((p) => p.live >= FROM);
if (firstIdx < 0) die(`no day on or after ${FROM}`);
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
if (FROM <= today) die(`--from ${FROM} is not in the future (today is ${today}); a live board is frozen`);
const keep = PUZZLES.slice(0, firstIdx);
const startNum = PUZZLES[firstIdx].num;

// ---- the pool --------------------------------------------------------------
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const pool = [];
let order = 0;
const push = (e) => { e.order = order++; e.ans = e.choices[e.correct]; e.us = isUSQuestion(e); e.kind = e.us ? usKind(e) : (e.cat === 'Soccer' ? 'Soccer' : 'World other'); pool.push(e); };
for (const p of PUZZLES.slice(firstIdx)) for (const id of p.qids) { const q = byId.get(id); if (!q) die(`missing ${id}`); push({ cat: q.cat, tier: q.tier, q: q.q, choices: q.choices.slice(), correct: q.correct, was: id }); }
const fromLane = (e, src) => ({ cat: e.c, tier: e.t, q: e.q, choices: [e.a, ...e.d], correct: 0, was: e.was || src });
if (fs.existsSync(INV_FILE)) { const { INVENTORY } = await import(url.pathToFileURL(INV_FILE).href + '?t=' + Date.now()); for (const e of INVENTORY) push(fromLane(e, 'inventory')); }
for (const f of EXTRA) { const { LANE_DAYS, INVENTORY } = await import(url.pathToFileURL(path.resolve(f)).href); for (const e of (INVENTORY || (LANE_DAYS || []).flat())) push(fromLane(e, path.basename(f))); }
const seenText = new Set();
for (const e of pool) { const k = norm(e.q); if (seenText.has(k)) die(`the pool holds the same question twice: "${e.q}"`); seenText.add(k); }

// ---- deterministic column plan (gen-sport's, reseeded for this plan) -------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function seedOf(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function columnPlan(dayNum) {
  const rnd = rng(seedOf(`sport:globalcols:${FROM}:${dayNum}`));
  const long = (dayNum - 1) % 4;
  const bag = []; for (let c = 0; c < 4; c++) for (let i = 0; i < (c === long ? 7 : 6); i++) bag.push(c);
  for (let n = 0; n < 5000; n++) {
    const p = bag.slice(); for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    let ok = true; for (let i = 2; i < p.length; i++) if (p[i] === p[i - 1] && p[i] === p[i - 2]) { ok = false; break; }
    if (ok) return p;
  }
  throw new Error(`no column plan for day ${dayNum}`);
}

// ---- lay out days -----------------------------------------------------------
const used = new Set();
function planDay(attempt) {
  const rnd = rng(seedOf(`sport:globalpick:${attempt}`));
  const picks = []; const answers = new Set(); let rules = 0;
  const kindCount = {};
  for (let t = 1; t <= 5; t++) {
    const tierKinds = new Set(); let soccer = 0;
    for (let s = 0; s < MIX_PATTERN.length; s++) {
      const want = MIX_PATTERN[s];
      const worldLeft = MIX_PATTERN.slice(s + 1).filter((w) => w === 'world').length;
      let cand = pool.filter((e) => !used.has(e) && !picks.includes(e) && e.tier === t && e.us === (want === 'us')
        && !answers.has(norm(e.ans)) && !(rulesHit(e.q) && rules >= 1));
      if (want === 'us') cand = cand.filter((e) => !tierKinds.has(e.kind));
      else {
        // Each tier's world slots need at least one Soccer question; a
        // non-Soccer world question is preferred for the others (sort below)
        // but not required, because Everything Else runs out first.
        if (!soccer && !worldLeft) cand = cand.filter((e) => e.kind === 'Soccer');
      }
      if (!cand.length) return null;
      // Earliest authored first, nudged toward the US kind used least today,
      // with a little jitter on retries.
      const bias = (e) => (want === 'us' ? (kindCount[e.kind] || 0) * 40 : (tierKinds.has(e.kind) ? 300 : 0));
      cand.sort((a, b) => (bias(a) - bias(b)) + (a.order - b.order) + (attempt ? (rnd() - 0.5) * 60 * attempt : 0));
      const e = cand[0];
      picks.push(e); answers.add(norm(e.ans)); if (rulesHit(e.q)) rules++;
      tierKinds.add(e.kind); kindCount[e.kind] = (kindCount[e.kind] || 0) + 1;
      if (e.kind === 'Soccer') soccer++;
    }
  }
  for (const k of ['NFL', 'NBA', 'MLB']) if ((kindCount[k] || 0) < 2) return null;
  return picks;
}
const days = [];
for (let num = startNum; ; num++) {
  let picks = null;
  for (let attempt = 0; attempt < 40 && !picks; attempt++) picks = planDay(attempt);
  if (!picks) break;
  picks.forEach((e) => used.add(e));
  days.push({ num, picks });
}
if (!days.length) die('not one day could be laid out');

// ---- write ------------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, '0');
const qidFor = (day, slot) => `d${day < 100 ? pad2(day) : String(day)}q${pad2(slot)}`;
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const firstLive = PUZZLES[firstIdx].live;

const qLines = []; const pBlocks = [];
days.forEach((d, i) => {
  const live = addDays(firstLive, i);
  const [y, m, dd] = live.split('-');
  const cols = columnPlan(d.num);
  const qids = [];
  d.picks.forEach((e, k) => {
    const id = qidFor(d.num, k + 1);
    qids.push(id);
    const wrong = e.choices.filter((_, j) => j !== e.correct);
    const choices = wrong.slice(); choices.splice(cols[k], 0, e.ans);
    qLines.push(`  { id: '${id}', cat: '${esc(e.cat)}', tier: ${e.tier}, q: '${esc(e.q)}', choices: [${choices.map((c) => `'${esc(c)}'`).join(', ')}], correct: ${cols[k]} },`);
  });
  pBlocks.push(`  {\n    num: ${d.num},\n    quizId: 'sport-${Number(m)}-${Number(dd)}-${y.slice(2)}',\n    live: '${live}',\n    dateLabel: '${MONTHS[Number(m) - 1]} ${Number(dd)}, ${y}',\n    qids: [${qids.map((x) => `'${x}'`).join(', ')}],\n  },`);
});

// questions.js: keep every line before the first re-planned id, then the new ones.
const qText = fs.readFileSync(Q_FILE, 'utf8');
const qCut = qText.indexOf(`  { id: '${PUZZLES[firstIdx].qids[0]}',`);
const qEnd = qText.indexOf('\n];', qCut);
if (qCut < 0 || qEnd < 0) die('could not find the splice points in questions.js');
fs.writeFileSync(Q_FILE, qText.slice(0, qCut) + qLines.join('\n') + qText.slice(qEnd));
const pText = fs.readFileSync(P_FILE, 'utf8');
const pCut = pText.indexOf(`  {\n    num: ${startNum},\n`);
const pEnd = pText.lastIndexOf('\n];');
if (pCut < 0 || pEnd < 0) die('could not find the splice points in puzzles.js');
fs.writeFileSync(P_FILE, pText.slice(0, pCut) + pBlocks.join('\n') + pText.slice(pEnd));

// inventory: every pooled question no day took, in the lane shape.
const left = pool.filter((e) => !used.has(e));
const inv = left.map((e) => `  { c: '${esc(e.cat)}', t: ${e.tier}, q: '${esc(e.q)}', a: '${esc(e.ans)}', d: [${e.choices.filter((_, j) => j !== e.correct).map((c) => `'${esc(c)}'`).join(', ')}], us: ${e.us}, was: '${esc(e.was)}' },`);
fs.writeFileSync(INV_FILE, `// scripts/sport-lanes/sport-inventory.mjs: Sport questions waiting for a day.
// WRITTEN by scripts/sport-global-mix.mjs; do not hand-edit order, re-run it.
//
// The owner's global-mix ruling (2026-10-30, see scripts/sport-mix.mjs) put
// three world questions and two US ones in every tier block. The bank had been
// authored about two thirds US, so the US surplus waits here instead of being
// deleted. Each entry is in the lane shape { c, t, q, a, d } plus 'us' (does it
// count as a US question) and 'was' (the id it carried on the calendar before
// the re-plan, or where it came from). Restock by authoring WORLD questions in
// the lane shape and running:
//   node scripts/sport-global-mix.mjs --from <tomorrow> --extra <lane file>
// which lays out new days and pulls these back onto the calendar.
export const INVENTORY = [
${inv.join('\n')}
];
`);
const usLeft = left.filter((e) => e.us).length;
console.log(`sport-global-mix: re-planned ${days.length} days from ${firstLive} (day ${startNum}) to ${addDays(firstLive, days.length - 1)}; pool ${pool.length} (${pool.filter((e) => e.us).length} US, ${pool.filter((e) => !e.us).length} world); inventory ${left.length} (${usLeft} US, ${left.length - usLeft} world)`);
