#!/usr/bin/env node
// verify-housing: the gate for Housing Watch (mindloftdaily.com/housing).
// Runs the pipeline unit tests in scripts/housing against synthetic inputs:
// every parser (FRED, Zillow, Redfin, SEC, Census BPS), the SEC quarter
// derivation, health-check inputs, national market share, and the rule that a
// failed source keeps its previous values. Also parses the team's builder KPI
// table so a malformed row is caught before it ships.
//
//   node scripts/verify-housing.mjs
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const tests = readdirSync(join(here, 'housing')).filter((f) => f.endsWith('.test.mjs')).map((f) => join(here, 'housing', f));

const r = spawnSync(process.execPath, ['--test', ...tests], { cwd: root, encoding: 'utf8' });
const out = `${r.stdout || ''}${r.stderr || ''}`;
const pass = out.match(/^# pass (\d+)/m)?.[1] ?? '0';
const fail = out.match(/^# fail (\d+)/m)?.[1] ?? '?';
if (r.status !== 0) {
  console.log(out);
  console.log(`✗ verify-housing: FAIL (${fail} failing, ${pass} passing)`);
  process.exit(1);
}

const { BUILDER_KPIS_CSV } = await import('../lib/housing/builder-kpis.mjs');
const { readTeamKpis } = await import('../lib/housing/sources/team.mjs');
const { SEGMENTS } = await import('../lib/housing/config.mjs');
let rows;
try {
  rows = readTeamKpis(BUILDER_KPIS_CSV);
} catch (e) {
  console.log(`✗ verify-housing: FAIL builder-kpis.mjs: ${e.message}`);
  process.exit(1);
}
const known = new Set(Object.values(SEGMENTS).flatMap((s) => s.companies.map(([t]) => t)));
const bad = rows.filter((r) => !known.has(r.ticker)).map((r) => r.ticker);
if (bad.length) {
  console.log(`✗ verify-housing: FAIL builder-kpis.mjs has tickers not in lib/housing/config.mjs: ${[...new Set(bad)].join(', ')}`);
  process.exit(1);
}
const seen = new Set();
for (const r of rows) {
  const k = `${r.ticker}|${r.periodEnd}`;
  if (seen.has(k)) { console.log(`✗ verify-housing: FAIL duplicate builder KPI row ${k}`); process.exit(1); }
  seen.add(k);
}
console.log(`verify-housing: OK (${pass} tests, ${rows.length} builder KPI rows)`);
