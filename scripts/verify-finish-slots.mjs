// verify-finish-slots — every daily client carries Add to Home Screen and the
// finish card's stat slot, in that order (owner, 2026-10-03).
//
// app/StageFinish.jsx portals the board, the rival and the archive into
// <div id="stf-stats-slot" />, which each daily client places right after its
// Add to Home Screen button. A client WITHOUT the slot does not error: the
// finish card quietly falls back to a closed drawer, so the stats never show
// on that one game. That is how Chomp and nine others shipped (2026-10-03).
// This checker is the gate: every daily client that renders LoftFinish must
// carry an Add to Home Screen button (its own inline copy or app/AddToHome.jsx)
// AND the slot, with the button first.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'app');
const files = [];
for (const d of readdirSync(app)) {
  if (d === 'quiz' || d === 'circuits') continue;   // quizzes keep the drawer; runs have their own ending
  const dir = join(app, d);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) {
    if (!/\.jsx$/.test(f)) continue;
    const p = join(dir, f);
    const s = readFileSync(p, 'utf8');
    if (/import LoftFinish from '\.\.\/LoftFinish'/.test(s)) files.push([`app/${d}/${f}`, s]);
  }
}

let fail = 0;
for (const [p, s] of files) {
  const slot = s.indexOf('id="stf-stats-slot"');
  const a2hs = Math.max(s.lastIndexOf('<AddToHome'), s.lastIndexOf('Add to Home Screen\n'), s.search(/onClick=\{a2hsClick\}/));
  if (slot < 0) { console.log(`FAIL ${p}: no #stf-stats-slot, so the finish card's stats never show`); fail++; continue; }
  if (a2hs < 0) { console.log(`FAIL ${p}: no Add to Home Screen button`); fail++; continue; }
  if (a2hs > slot) { console.log(`FAIL ${p}: the stat slot sits above Add to Home Screen`); fail++; }
}
if (!files.length) { console.log('FAIL: found no daily clients, the scan is broken'); process.exit(1); }
console.log(`${files.length} daily clients checked, ${fail} failure(s)`);
process.exit(fail ? 1 : 0);
