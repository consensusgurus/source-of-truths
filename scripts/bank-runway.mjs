// bank-runway: how long every daily's puzzle bank lasts. Owner, 2026-11-18:
// "What other puzzles have inventory issues coming up?" then "make this error
// proof and repeatable".
//
//   node scripts/bank-runway.mjs            every game, soonest to run out first
//   node scripts/bank-runway.mjs --days 21  only games ending within 21 days
//   node scripts/bank-runway.mjs --fail 7   exit 1 if any game ends within 7 days
//
// For each game in lib/daily-games.js it finds the bank under app/<key>/ (or the
// game's own route) and reads the last dated board: "live" / "date" /
// "liveDate" / "day" as an ISO date, quoted key or not. Retired games and the
// Price Check tags that are frozen (dealer, agent, curator: no new days, see
// app/picks/puzzles.js) are skipped. A game with no dated bank (it builds a
// board each day, e.g. the Arcade) is listed as "no bank" and never runs out.
// Restock commands live in docs/claude/daily-authoring.md; Machine has its own:
// node scripts/gen-machine-bank.mjs --through <date>.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { DAILY_GAMES, RETIRED_DAILY } = await import(path.join(ROOT, 'lib/daily-games.js'));
const FROZEN = new Set(['dealer', 'agent', 'curator']);
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : null; };
const within = opt('--days'), failAt = opt('--fail');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const days = (iso) => Math.round((Date.parse(iso) - Date.parse(today)) / 864e5);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const RE = /["']?\b(live|date|day|liveDate)["']?\s*:\s*['"](\d{4}-\d{2}-\d{2})['"]/g;

const rows = [];
for (const g of DAILY_GAMES) {
  if (RETIRED_DAILY[g.key] || FROZEN.has(g.key)) continue;
  const dirs = [path.join(ROOT, 'app', g.key), path.join(ROOT, 'app', (g.href || '').replace(/^\//, ''))].filter((d) => fs.existsSync(d));
  let last = null;
  for (const d of [...new Set(dirs)]) for (const f of walk(d)) {
    if (!/\.(js|jsx|json)$/.test(f) || /(page\.js|Client\.jsx|opengraph|twitter)/.test(f)) continue;
    const s = fs.readFileSync(f, 'utf8'); let m; RE.lastIndex = 0;
    while ((m = RE.exec(s))) if (!last || m[2] > last) last = m[2];
  }
  rows.push({ key: g.key, name: g.name, last, left: last ? days(last) : Infinity });
}
rows.sort((a, b) => a.left - b.left || a.key.localeCompare(b.key));
let short = 0;
for (const r of rows) {
  if (within !== null && r.left > within) continue;
  if (failAt !== null && r.left <= failAt) short++;
  const flag = r.left <= 7 ? '!!' : r.left <= 14 ? '! ' : '  ';
  console.log(`${flag} ${r.name.padEnd(12)} ${r.last ? `${r.last}  ${String(r.left).padStart(4)} day(s) left` : 'no bank (builds each day)'}`);
}
if (failAt !== null && short) { console.log(`bank-runway: ${short} game(s) end within ${failAt} day(s)`); process.exit(1); }
