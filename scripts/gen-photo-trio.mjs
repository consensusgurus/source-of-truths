// scripts/gen-photo-trio.mjs: deals the banks for Swap, Slide and Spin, the
// three photo dailies built on Jig's photographs (launched 2026-11-01).
//
//   node scripts/gen-photo-trio.mjs                     # 2026-11-01 .. --until
//   node scripts/gen-photo-trio.mjs --until 2027-01-31  # EXTEND: rows already in
//                                                       # a bank are kept byte for byte
//
// NOTHING IS AUTHORED. Each game borrows a Jig photograph that has ALREADY been
// live, so a photo is never shown here before Jig shows it, and the photo comes
// through /api/jig/img?n=<jig num>, which refuses a day not yet live:
//
//   Swap   Jig's photo from 7 days earlier
//   Slide  Jig's photo from 14 days earlier
//   Spin   Jig's photo from 21 days earlier
//
// so no two of the three show the same photo on the same day, and each game
// walks the Jig bank one photo a day. The bank can only run as far as Jig's own
// bank allows (Jig num of the date minus the offset must exist).
//
// THE SIZES (owner, 2026-11-01: "bigger / harder even on easy days"):
//   Swap   6x6 every day, 7x7 on the Sunday Edition
//   Slide  5x5 every day, 6x6 on the Sunday Edition
//   Spin   6x6 every day, 8x8 on the Sunday Edition
//
// Fields (scripts/verify-swap.mjs, verify-slide.mjs and verify-spin.mjs re-derive
// every rule from the rows and import nothing from here):
//   jig    the Jig board whose photo this is (its `live` is before this row's)
//   size   the board is size x size squares, cut from the photo's centre square
//   Swap   perm[pos] = the tile that starts at pos. No tile starts home, so
//          par (size*size minus the permutation's cycle count) is size*size/2 or more
//   Slide  tiles[pos] = the tile at pos, size*size-1 is the gap, which starts
//          anywhere. Always solvable (the parity rule), and at most size-1
//          tiles start home
//   Spin   rot[pos] = quarter turns clockwise the tile starts at, 0..3. At most
//          one tile in eight starts straight.
//   sunday the Sunday Edition (bigger board)
//
// Deterministic: same seed, same banks.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const START = '2026-11-01';
const UNTIL = opt('--until', '2026-12-31');

const { PUZZLES: JIG } = await import(path.join(ROOT, 'app/jig/puzzles.js'));
// Jig runs one board a day from its first, so its number on any date is arithmetic
// (its bank may not reach that far yet; only the borrowed photo has to exist).
const jigNumOn = (iso) => 1 + Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(JIG[0].live + 'T12:00:00Z')) / 86400000);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function days(from, to) {
  const out = [];
  for (let t = Date.parse(from + 'T12:00:00Z'); t <= Date.parse(to + 'T12:00:00Z'); t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
const label = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const qid = (key, iso) => { const [y, m, d] = iso.split('-').map(Number); return `${key}-${m}-${d}-${String(y).slice(2)}`; };
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function cycles(p) { const seen = new Array(p.length).fill(false); let c = 0; for (let i = 0; i < p.length; i++) { if (seen[i]) continue; c++; let j = i; while (!seen[j]) { seen[j] = true; j = p[j]; } } return c; }
function inversions(arr, gap) { const a = arr.filter((x) => x !== gap); let n = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) n++; return n; }
export function slideSolvable(tiles, n) {
  const gap = n * n - 1;
  const inv = inversions(tiles, gap);
  if (n % 2 === 1) return inv % 2 === 0;
  const rowFromBottom = n - Math.floor(tiles.indexOf(gap) / n);
  return (inv + rowFromBottom) % 2 === 1;
}

const GAMES = {
  swap: { offset: 7, size: (d) => (dow(d) === 0 ? 7 : 6), deal(n, r) {
    for (;;) { const p = shuffle([...Array(n * n).keys()], r); if (p.every((t, i) => t !== i)) return { perm: p }; }
  } },
  slide: { offset: 14, size: (d) => (dow(d) === 0 ? 6 : 5), deal(n, r) {
    for (;;) {
      const t = shuffle([...Array(n * n).keys()], r);
      if (!slideSolvable(t, n)) continue;
      if (t.filter((x, i) => x === i).length > n - 1) continue;
      return { tiles: t };
    }
  } },
  spin: { offset: 21, size: (d) => (dow(d) === 0 ? 8 : 6), deal(n, r) {
    for (;;) {
      const rot = Array.from({ length: n * n }, () => (r() < 0.06 ? 0 : 1 + Math.floor(r() * 3)));
      if (rot.filter((x) => x === 0).length <= Math.floor((n * n) / 8)) return { rot };
    }
  } },
};

for (const [key, G] of Object.entries(GAMES)) {
  const file = path.join(ROOT, 'app', key, 'puzzles.js');
  let kept = [];
  if (fs.existsSync(file)) {
    const src = fs.readFileSync(file, 'utf8');
    kept = src.split('\n').filter((l) => l.startsWith('  {"num"')).map((l) => JSON.parse(l.trim().replace(/,$/, '')));
  }
  const have = new Set(kept.map((p) => p.live));
  const rows = [...kept];
  for (const d of days(START, UNTIL)) {
    if (have.has(d)) continue;
    const j = jigNumOn(d);
    if (!JIG.find((p) => p.num === j - G.offset)) throw new Error(`${key}: no Jig photo ${G.offset} days before ${d}`);
    const n = G.size(d);
    const num = rows.length + 1;
    const r = rng(20261101 + num * 7919 + key.length * 104729);
    const row = { num, quizId: qid(key, d), live: d, dateLabel: label(d), ...(dow(d) === 0 ? { sunday: true } : {}), jig: j - G.offset, size: n, ...G.deal(n, r) };
    rows.push(row);
  }
  const NAME = key[0].toUpperCase() + key.slice(1);
  const head = `// Puzzle data for ${NAME}, one of the three photo dailies on Jig's photographs.
// GENERATED by scripts/gen-photo-trio.mjs; do not edit by hand. Extend with
// \`node scripts/gen-photo-trio.mjs --until <date>\`, which keeps every row here
// byte for byte. Checked by scripts/verify-${key}.mjs. Imported only by the server
// page, which strips days not yet live. The field rules are in the generator's header.
export const PUZZLES = [
`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, head + rows.map((p) => '  ' + JSON.stringify(p) + ',').join('\n') + '\n];\n');
  console.log(`${key}: ${rows.length} rows (${rows.length - kept.length} new), ${rows[0].live} .. ${rows[rows.length - 1].live}`);
}
