// scripts/lines-bank.mjs: the bank runner shared by gen-five.mjs and
// gen-racecar.mjs. It APPENDS to the game's puzzles.js and never rewrites a
// board already in the file (the existing text is spliced in front of the new
// blocks byte for byte), seeds each board as seed + num * 7919, and caches
// finished boards in a JSONL file so a long run can resume after a timeout.
//
// Every board it emits has been proved, with the engine in lines-core.mjs, to
//   * fall to LOGIC WITH NO GUESSING at exactly the level its weekday pins
//     (which also proves it has one solution, since every step is sound), and
//     an exhaustive count agrees: exactly one solution with the lines,
//   * need the lines: with them switched off the same clues fit more than one
//     grid,
// and the bank's own verifier (verify-five.mjs / verify-racecar.mjs) re-proves
// all of it with solvers that share no code with this file.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as L from './lines-core.mjs';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const asDate = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, n) => { const d = asDate(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dowOf = (iso) => asDate(iso).getUTCDay();
const labelOf = (iso) => { const d = asDate(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };

const MAX_SOL_AGREEMENT = 30;
const MAX_CLUE_OVERLAP = 14;

export async function runBank(cfg) {
  const { kind, key, header, PRINTED_BY_DOW, LEVEL_BY_DOW, LINES_BY_DOW } = cfg;
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const has = (k) => process.argv.includes(k);
  const BANK = process.env[`${key.toUpperCase()}_BANK`] || path.join(process.cwd(), `app/${key}/puzzles.js`);
  const UNTIL = arg('--until', cfg.until);
  const SEED = Number(arg('--seed', cfg.seed));
  const FROM = arg('--from', null);
  const CACHE_DIR = process.env.LINES_CACHE_DIR || '/tmp/build';
  const CACHE = path.join(CACHE_DIR, `${key}-bank.jsonl`);
  const BUDGET = Number(arg('--seconds', 0)) * 1000;

  let text = '', PUZZLES = [];
  if (fs.existsSync(BANK)) {
    text = fs.readFileSync(BANK, 'utf8');
    if (!text.endsWith('];\n')) { console.error(`gen-${key}: the bank does not end in "];\\n"; refusing to splice.`); process.exit(1); }
    ({ PUZZLES } = await import(pathToFileURL(BANK).href + `?t=${Date.now()}`));
  } else if (!FROM) {
    console.error(`gen-${key}: ${BANK} is missing and no --from was given.`);
    process.exit(1);
  }
  const firstNew = PUZZLES.length ? addDays(PUZZLES[PUZZLES.length - 1].live, 1) : FROM;
  const days = Math.round((asDate(UNTIL) - asDate(firstNew)) / 86400000) + 1;
  if (days <= 0) { console.error(`gen-${key}: the bank already reaches ${UNTIL}. Nothing to do.`); process.exit(0); }
  const startNum = PUZZLES.length + 1;

  const seen = { mask: new Set(), sol: new Set(), lines: new Set() };
  const sols = [], masks = [];
  const lineKey = (lines) => lines.map((l) => l.join('.')).sort().join('|');
  const remember = (given, sol, lines) => {
    seen.mask.add(given.map((v) => (v ? 1 : 0)).join(''));
    seen.sol.add(sol.join(''));
    seen.lines.add(lineKey(lines));
    sols.push(sol); masks.push(given.map((v) => (v ? 1 : 0)));
  };
  const flatLines = (p) => p.lines.map((l) => l.map(([r, c]) => r * 9 + c));
  for (const p of PUZZLES) remember(p.given.flat(), p.sol.flat(), flatLines(p));

  const cacheKey = JSON.stringify({ start: firstNew, days, seed: SEED, startNum });
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  let cached = [];
  if (has('--fresh')) { try { fs.unlinkSync(CACHE); } catch (e) { /* nothing */ } }
  if (fs.existsSync(CACHE)) {
    const lines = fs.readFileSync(CACHE, 'utf8').split('\n').filter((l) => l.trim());
    if (lines.length && lines[0] === cacheKey) cached = lines.slice(1).map((l) => JSON.parse(l));
    else fs.unlinkSync(CACHE);
  }
  if (!fs.existsSync(CACHE)) fs.writeFileSync(CACHE, cacheKey + '\n');

  const t0 = Date.now();
  const boards = [];
  for (let k = 0; k < days; k++) {
    const num = startNum + k;
    const live = addDays(firstNew, k);
    const dow = dowOf(live);
    const printed = PRINTED_BY_DOW[dow], level = LEVEL_BY_DOW[dow], shape = LINES_BY_DOW[dow];
    const hit = cached.find((c) => c.num === num);
    if (hit) { boards.push(hit); remember(hit.given.flat(), hit.sol.flat(), hit.lines.map((l) => l.map(([r, c]) => r * 9 + c))); continue; }
    if (BUDGET && Date.now() - t0 > BUDGET) { console.error(`gen-${key}: time budget spent at #${num}; run again to resume.`); process.exit(3); }

    const rnd = L.rng(SEED + num * 7919);
    const why = new Map();
    const note = (r) => why.set(r, (why.get(r) || 0) + 1);
    let rec = null;
    for (let att = 1; att <= 20000 && !rec; att++) {
      const sol = L.fullGrid(rnd);
      const lines = L.buildLines(kind, sol, rnd, shape);
      if (lines.length < shape.count) { note('lines did not fit'); continue; }
      const { given, printed: got } = L.dig(kind, lines, sol, rnd, printed, level);
      if (got !== printed) { note(`dig stalled above ${printed}`); continue; }
      if (level === 2 && L.logicSolve(kind, lines, given, 1).solved) { note('fell to level 1'); continue; }
      if (L.countSolutions(kind, lines, given, 2) !== 1) { note('not unique'); continue; }
      if (L.countSolutions(kind, [], given, 2) < 2) { note('lines were decoration'); continue; }
      const mask = given.map((v) => (v ? 1 : 0));
      if (seen.mask.has(mask.join(''))) { note('mask repeat'); continue; }
      if (seen.sol.has(sol.join(''))) { note('solution repeat'); continue; }
      if (seen.lines.has(lineKey(lines))) { note('line layout repeat'); continue; }
      if (sols.some((s) => { let o = 0; for (let i = 0; i < 81; i++) if (s[i] === sol[i]) o++; return o > MAX_SOL_AGREEMENT; })) { note('solution agreement'); continue; }
      if (masks.some((m) => { let o = 0; for (let i = 0; i < 81; i++) if (m[i] && mask[i]) o++; return o > MAX_CLUE_OVERLAP; })) { note('clue overlap'); continue; }
      const chunk9 = (a) => Array.from({ length: 9 }, (_, r) => a.slice(r * 9, r * 9 + 9));
      rec = {
        num, quizId: `${key}-${asDate(live).getUTCMonth() + 1}-${asDate(live).getUTCDate()}-${String(asDate(live).getUTCFullYear()).slice(2)}`,
        live, dateLabel: labelOf(live), sunday: dow === 0, printed, level,
        lines: lines.map((l) => l.map((i) => [Math.floor(i / 9), i % 9])),
        given: chunk9(given), sol: chunk9(sol),
      };
      process.stderr.write(`#${num} ${live} ${printed} clues level ${level}, ${lines.length} lines (attempt ${att})\n`);
    }
    if (!rec) {
      const ranked = [...why.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `${r} x${n}`).join(', ');
      console.error(`gen-${key}: no board for #${num} ${live}. The search kept hitting: ${ranked}`);
      process.exit(1);
    }
    remember(rec.given.flat(), rec.sol.flat(), rec.lines.map((l) => l.map(([r, c]) => r * 9 + c)));
    boards.push(rec);
    fs.appendFileSync(CACHE, JSON.stringify(rec) + '\n');
  }

  const body = boards.map((b) => `  {
    num: ${b.num},
    quizId: '${b.quizId}',
    live: '${b.live}',
    dateLabel: '${b.dateLabel}',
    sunday: ${b.sunday},
    printed: ${b.printed},
    level: ${b.level},
    lines: ${JSON.stringify(b.lines)},
    given: ${JSON.stringify(b.given)},
    sol: ${JSON.stringify(b.sol)},
  },`).join('\n');
  fs.mkdirSync(path.dirname(BANK), { recursive: true });
  fs.writeFileSync(BANK, (text ? text.slice(0, text.length - 3) : header + '\nexport const PUZZLES = [\n') + body + '\n];\n');
  console.error(`wrote ${BANK}: ${PUZZLES.length} frozen + ${boards.length} new, last live ${boards[boards.length - 1].live}, in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
