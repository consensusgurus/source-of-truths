#!/usr/bin/env node
// Dump the boards a content reviewer needs to read, one JSON file per date.
// Trivia question ids are expanded to { q, answer, choices } and crowd seed
// votes are stripped, so the file holds only what a player sees plus the key.
//
//   node scripts/content-review-dump.mjs 2026-10-13 2026-10-15        # every ledger game
//   node scripts/content-review-dump.mjs 2026-10-13 2026-10-13 deep atlas
//
// Writes /tmp/content-review/<date>.json. Hand each file to a reviewer with the
// checklist in scripts/CONTENT-REVIEW.md, then apply fixes and move the ledger.
import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [from, to, ...only] = process.argv.slice(2);
if (!from || !to) { console.error('usage: content-review-dump.mjs FROM TO [game...]'); process.exit(2); }
const ledger = JSON.parse(fs.readFileSync(join(root, 'scripts/content-reviewed.json'), 'utf8'));
const games = only.length ? only : Object.keys(ledger).filter((k) => !k.startsWith('_'));
const days = []; for (let d = new Date(from + 'T12:00:00Z'); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) days.push(d.toISOString().slice(0, 10));
fs.mkdirSync('/tmp/content-review', { recursive: true });
const banks = {};
for (const g of games) {
  const dir = join(root, 'app', g);
  try {
    const m = await import(pathToFileURL(join(dir, 'puzzles.js')).href);
    const P = m.PUZZLES || Object.values(m).find(Array.isArray);
    let QM = null;
    if (fs.existsSync(join(dir, 'questions.js'))) { const q = await import(pathToFileURL(join(dir, 'questions.js')).href); QM = q.QUESTION_MAP || Object.fromEntries((q.QUESTIONS || []).map((x) => [x.id, x])); }
    banks[g] = { P, QM };
  } catch (e) { banks[g] = { err: e.message }; }
}
for (const day of days) {
  const out = {};
  for (const g of games) {
    const b = banks[g]; if (b.err) { out[g] = 'ERR ' + b.err.slice(0, 120); continue; }
    const d = b.P.filter((p) => p.live === day);
    out[g] = d.length ? JSON.parse(JSON.stringify(d, (k, v) => {
      if (k !== 'qid' && b.QM && typeof v === 'string' && b.QM[v]) { const q = b.QM[v]; return { qid: v, q: q.q, answer: q.choices ? q.choices[q.correct] : q.a, choices: q.choices }; }
      if (k === 'house' || k === 'order') return undefined; return v;
    })) : 'no board';
  }
  fs.writeFileSync(`/tmp/content-review/${day}.json`, JSON.stringify(out, null, 1));
  console.log(`/tmp/content-review/${day}.json`);
}
