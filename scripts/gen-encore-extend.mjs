#!/usr/bin/env node
// gen-encore-extend — append new boards to a LIVE Encore bank.
//
// scripts/build-encore-bank.mjs builds a bank from nothing: its answer-use cap,
// its shared-answer ceiling and its "not this week's shape" filter only ever see
// the boards IT made. Run to extend a live bank, it would happily reuse an
// answer already banked three times or print a grid sharing five answers with a
// board that went out last month, and verify-encore would go red on the merge.
// This wrapper reuses the builder's filler unchanged (imported, not copied) and
// seeds every variety rule from the WHOLE existing bank first:
//
//   * answer-use cap 3 across the whole bank (existing + new)
//   * two boards share at most 3 answers (4 between two Sundays), checked
//     against every existing board and every new one, never loosened
//   * no grid shape reused inside a week (the last six live shapes count)
//   * an answer whose word or clue fails the shared US-spelling screen, or
//     whose clue carries an em dash, is never placed (the banks hold a few
//     British clues such as "Storeys"; the banks are shared and are not edited)
//
// It never rewrites the prefix. It prints ONLY the new boards, in the
// builder's exact format, and with --out it splices them in front of the
// closing `];` of app/encore/puzzles.js, so every existing byte stays put.
//
// Deterministic per board: the filler's RNG is re-seeded from the board NUMBER
// (offset from the builder's own seed, so the new segment cannot replay the
// frozen one) and the wall-clock cap is off, so a run's output depends only on
// the bank it starts from. Resumable: each finished board is appended to a
// progress file and a re-run picks up there.
//
//   node scripts/gen-encore-extend.mjs --to 2026-11-30 [--progress FILE] [--out]
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fill, setSeed, shuffle } from './build-encore-bank.mjs';
import { scanUS } from './us-spellings.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const TO = arg('--to');
if (!TO) { console.error('usage: gen-encore-extend.mjs --to YYYY-MM-DD [--progress FILE] [--out]'); process.exit(1); }
const PROG = arg('--progress', join(tmpdir(), 'encore-extend-progress.jsonl'));
const OUT = process.argv.includes('--out');
const BANK = join(here, '..', 'app', 'encore', 'puzzles.js');

const { PUZZLES } = await import(BANK);
const CAP = 3;
const SEED_BASE = 9_110_2026;   // not the builder's 8272026

// ── the clue bank, read exactly as the builder and verifier read it ────────
const CLUE = new Map();
for (const f of ['emcee-wordbank.txt', 'encore-wordbank.txt']) {
  for (const line of readFileSync(join(here, f), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('|');
    if (i < 1) continue;
    const w = t.slice(0, i).trim(), c = t.slice(i + 1).trim();
    if (!/^[A-Z]+$/.test(w) || !c) continue;
    if (!CLUE.has(w)) CLUE.set(w, c);
  }
}
const copyBad = new Set();
for (const [w, c] of CLUE) {
  if (scanUS(w.toLowerCase()).length || scanUS(c).length || /—/.test(c)) copyBad.add(w);
}

// ── seed the variety state from the live bank ─────────────────────────────
const wordAt = (g, w, dir) => { let s = ''; for (let i = 0; i < w.len; i++) s += dir === 'A' ? g[w.r][w.c + i] : g[w.r + i][w.c]; return s; };
const shapeOf = (g) => g.map((r) => r.replace(/[A-Z]/g, '.'));
const uses = new Map(), score = new Map();
const boards = [];   // { sunday, words:Set }
let recent = [];
const record = (words, sunday, shape) => {
  for (const w of words) {
    uses.set(w, (uses.get(w) || 0) + 1);
    score.set(w, (score.get(w) || 0) + 10);
  }
  boards.push({ sunday, words: new Set(words) });
  recent.push(JSON.stringify(shape)); if (recent.length > 6) recent.shift();
};
for (const p of PUZZLES) {
  const words = [...p.across.map((w) => wordAt(p.grid, w, 'A')), ...p.down.map((w) => wordAt(p.grid, w, 'D'))];
  record(words, !!p.sunday, shapeOf(p.grid));
}
const last = PUZZLES[PUZZLES.length - 1];
console.error(`live bank: ${PUZZLES.length} boards to ${last.live}, ${uses.size} distinct answers`);

// ── calendar ───────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const targets = [];
for (let t = Date.parse(`${last.live}T00:00:00Z`) + 86400000, num = last.num + 1; t <= Date.parse(`${TO}T00:00:00Z`); t += 86400000, num++) {
  const dt = new Date(t), yy = dt.getUTCFullYear(), mm = dt.getUTCMonth(), dd = dt.getUTCDate();
  targets.push({
    num,
    quizId: `encore-${mm + 1}-${dd}-${String(yy).slice(2)}`,
    live: `${yy}-${String(mm + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    dateLabel: `${MONTHS[mm]} ${dd}, ${yy}`,
    sunday: dt.getUTCDay() === 0,
  });
}

const SH = JSON.parse(readFileSync(join(here, 'encore-shapes.json'), 'utf8')).shapes;
const results = [];
if (existsSync(PROG)) {
  for (const line of readFileSync(PROG, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const p = targets.find((t) => t.quizId === r.quizId);
    if (!p || results.some((x) => x.p.quizId === p.quizId)) continue;
    results.push({ p, made: r.made, N: r.N });
    record(r.made.words, p.sunday, r.shape);
  }
  console.error(`resumed ${results.length} boards from ${PROG}`);
}

for (const p of targets) {
  if (results.some((r) => r.p.quizId === p.quizId)) continue;
  const N = p.sunday ? 11 : 9;
  const banned = new Set(copyBad);
  for (const [w, n] of uses) if (n >= CAP) banned.add(w);
  const okOverlap = (words) => {
    const s = new Set(words);
    for (const b of boards) {
      let n = 0; for (const x of b.words) if (s.has(x)) n++;
      if (n > (p.sunday && b.sunday ? 4 : 3)) return false;
    }
    return true;
  };
  setSeed(SEED_BASE + p.num * 7919);
  let made = null, shape = null;
  // Pass 0 keeps the weekly shape rule; pass 1 lets a shape repeat (cosmetic,
  // and only a warning in the verifier). The ANSWER rules are never loosened.
  outer:
  for (let pass = 0; pass < 2 && !made; pass++) {
    const pool = shuffle(SH[N]).filter((x) => pass === 1 || !recent.includes(JSON.stringify(x)));
    for (const pat of pool) {
      for (let k = 0; k < 3; k++) {
        const cand = fill(pat, { banned, score, restarts: 5, cap: 30000, BRANCH: 14, msCap: 0 });
        if (!cand) break;
        if (okOverlap(cand.words)) { made = cand; shape = pat; break outer; }
      }
    }
  }
  if (!made) {
    const capped = [...uses.values()].filter((n) => n >= CAP).length;
    console.error(`FAILED to fill ${p.quizId}: ${capped} answers at cap, ${boards.length} boards to clear. Stopping; the banks are shared, do not widen them to force this.`);
    process.exit(2);
  }
  record(made.words, p.sunday, shape);
  results.push({ p, made, N });
  appendFileSync(PROG, JSON.stringify({ quizId: p.quizId, N, shape, made }) + '\n');
  console.error(`  ${results.length}/${targets.length} ${p.quizId} (${made.words.length} answers)`);
}

// ── emit, in the builder's exact board format ─────────────────────────────
const esc = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const text = results.sort((a, b) => a.p.num - b.p.num).map(({ p, made, N }) => {
  const L = (w) => `      { n: ${w.n}, r: ${w.r}, c: ${w.c}, len: ${w.len}, clue: ${esc(w.clue)} },`;
  return `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    size: ${N},
    grid: [${made.grid.map((g) => `'${g}'`).join(', ')}],
    across: [
${made.across.map(L).join('\n')}
    ],
    down: [
${made.down.map(L).join('\n')}
    ],
  },`;
}).join('\n') + '\n';

if (OUT) {
  const src = readFileSync(BANK, 'utf8');
  const cut = src.lastIndexOf('];');
  if (cut < 0 || !/\},\s*$/.test(src.slice(0, cut))) { console.error('cannot find the closing ]; of the bank'); process.exit(1); }
  writeFileSync(BANK, src.slice(0, cut) + text + src.slice(cut));
  console.error(`spliced ${results.length} boards into app/encore/puzzles.js`);
} else {
  process.stdout.write(text);
}
