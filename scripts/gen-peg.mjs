// scripts/gen-peg.mjs: deals Peg's bank (app/peg/puzzles.js) by date.
//   node scripts/gen-peg.mjs --until 2027-02-28 [--dry]
// Keeps every existing row byte for byte and appends one board per missing
// date. A board is built BACKWARDS from the finish: one peg in the centre,
// then "un-jumps" (a peg steps back two holes and puts back the peg it took)
// until the day's peg count is reached, so every board is solvable by
// construction and the reversed un-jumps are a stored answer. (Mirrored
// shapes cannot be built this way: a peg on the mirror line has no mirrored
// partner to un-jump with, so the walk stalls after one step.) A start must be
// compact: every peg touches another peg, side or corner, so it reads as a shape.
//
// Bands by weekday (pegs):
//   Mon/Tue gentle 9-12 · Wed/Thu moderate 13-17 · Fri/Sat tough 18-22 · Sun sunday 24-30
// `odds` is the share of 400 seeded random playouts that finish solved, in
// tenths of a percent; a board must sit at or under its band's ceiling so a
// random tapper cannot luck into it (verify-peg recomputes it).
import fs from 'fs';
import { HOLES, IDX, N, CENTER, JUMPS, parseBoard, pegsIn, apply, code, holeAt, replay, isSolved, legalJumps } from '../lib/peg-engine.js';

const FILE = new URL('../app/peg/puzzles.js', import.meta.url).pathname;
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const until = arg('--until');
const dry = process.argv.includes('--dry');

export const BANDS = {
  gentle: { pegs: [9, 12], odds: 250 },
  moderate: { pegs: [13, 17], odds: 120 },
  tough: { pegs: [18, 22], odds: 60 },
  sunday: { pegs: [24, 30], odds: 30 },
};
export const bandOf = (iso) => ['sunday', 'gentle', 'gentle', 'moderate', 'moderate', 'tough', 'tough'][new Date(iso + 'T12:00:00Z').getUTCDay()];

export function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

export const rowsOf = (s) => { const out = []; for (let r = 0; r < N; r++) { let t = ''; for (let c = 0; c < N; c++) { const i = holeAt(r, c); t += i < 0 ? '-' : s[i] ? 'o' : '.'; } out.push(t); } return out; };
const mirror = { lr: ([r, c]) => [r, N - 1 - c], ud: ([r, c]) => [N - 1 - r, c], none: null };
const MIR_DIR = { lr: { U: 'U', D: 'D', L: 'R', R: 'L' }, ud: { U: 'D', D: 'U', L: 'L', R: 'R' } };

// share of seeded random playouts that end solved, in tenths of a percent
export function oddsOf(P, n = 400) {
  const rnd = mulberry(hash(P.pegs.join('')));
  let wins = 0;
  for (let k = 0; k < n; k++) {
    let s = parseBoard(P.pegs);
    for (;;) { const js = legalJumps(s); if (!js.length) break; s = apply(s, js[Math.floor(rnd() * js.length)]); }
    if (isSolved(P, s)) wins++;
  }
  return Math.round((wins / n) * 1000);
}

// every peg has a neighbouring peg (side or corner)
export function compact(s) {
  return HOLES.every(([r, c], i) => {
    if (!s[i]) return true;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const k = holeAt(r + dr, c + dc); if (k >= 0 && s[k]) return true; }
    return false;
  });
}

// un-jump: peg at t steps back to a over b (both empty), putting b back
function unjumps(s) { return JUMPS.filter(([a, b, t]) => s[t] && !s[a] && !s[b]); }

export function makeBoard(iso, seen) {
  const band = bandOf(iso), B = BANDS[band];
  for (let attempt = 0; attempt < 5000; attempt++) {
    const seed = hash(iso + ':' + attempt), rnd = mulberry(seed);
    const want = B.pegs[0] + Math.floor(rnd() * (B.pegs[1] - B.pegs[0] + 1));
    const sym = 'none';
    let s = new Uint8Array(HOLES.length); s[CENTER] = 1;
    const back = []; // forward jumps, last first
    let stuck = 0;
    while (pegsIn(s) < want && stuck < 200) {
      let opts = unjumps(s);
      if (sym !== 'none') {
        // a mirrored pair needs the mirror's peg to be a DIFFERENT peg, unless the
        // un-jump is its own mirror (it runs along the axis)
        const m = mirror[sym], mi = (i) => { const [r, c] = m(HOLES[i]); return IDX[r * N + c]; };
        opts = opts.filter(([a, b, t]) => (mi(a) === a && mi(b) === b && mi(t) === t) || mi(t) !== t);
      }
      if (!opts.length) break;
      const j = opts[Math.floor(rnd() * opts.length)];
      let n = s.slice(); n[j[2]] = 0; n[j[0]] = 1; n[j[1]] = 1;
      const add = [j];
      if (sym !== 'none') {
        const m = mirror[sym];
        const [a, b, t] = [j[0], j[1], j[2]].map((i) => { const [r, c] = m(HOLES[i]); return IDX[r * N + c]; });
        if (!(a === j[0] && b === j[1] && t === j[2])) {
          if (!(n[t] && !n[a] && !n[b])) { stuck++; continue; }
          n[t] = 0; n[a] = 1; n[b] = 1;
          add.push([a, b, t, MIR_DIR[sym][j[3]]]);
        }
      }
      if (pegsIn(n) > B.pegs[1]) { stuck++; continue; }
      s = n; back.push(...add);
    }
    const pegs = pegsIn(s);
    if (pegs < B.pegs[0] || pegs > B.pegs[1]) continue;
    if (!compact(s)) continue;
    const rows = rowsOf(s);
    const keyA = rows.join('/');
    const variants = [keyA, [...rows].reverse().join('/'), rows.map((r) => [...r].reverse().join('')).join('/'), [...rows].reverse().map((r) => [...r].reverse().join('')).join('/')];
    if (variants.some((v) => seen.has(v))) continue;
    // the forward answer is the un-jumps reversed
    const sol = back.slice().reverse().map(code).join('');
    const P = { pegs: rows };
    const end = replay(P, sol);
    if (!isSolved(P, end)) throw new Error('gen-peg: reversed line does not solve ' + iso);
    const odds = oddsOf(P);
    if (odds > B.odds) continue;
    return { band, pegs: rows, count: pegs, odds, sol, seed: `${iso}:${attempt}` };
  }
  throw new Error('no board for ' + iso);
}

function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const label = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
const quizId = (iso) => { const [y, m, d] = iso.split('-'); return `peg-${+m}-${+d}-${y.slice(2)}`; };

if (until) {
  const src = fs.readFileSync(FILE, 'utf8');
  const { PUZZLES } = await import(FILE + '?' + Date.now());
  const last = PUZZLES[PUZZLES.length - 1];
  const seen = new Set(PUZZLES.map((p) => p.pegs.join('/')));
  const out = [];
  for (let iso = addDays(last.live, 1), num = last.num + 1; iso <= until; iso = addDays(iso, 1), num++) {
    const b = makeBoard(iso, seen);
    seen.add(b.pegs.join('/'));
    out.push(JSON.stringify({ num, quizId: quizId(iso), live: iso, dateLabel: label(iso), ...(b.band === 'sunday' ? { sunday: true } : {}), ...b }));
    console.log(`${iso} ${b.band.padEnd(8)} ${b.count} pegs odds ${(b.odds / 10).toFixed(1)}%`);
  }
  if (!dry && out.length) {
    const end = src.lastIndexOf('];');
    fs.writeFileSync(FILE, src.slice(0, end) + out.map((r) => '  ' + r + ',\n').join('') + src.slice(end));
    console.log(`gen-peg: appended ${out.length} boards through ${until}`);
  }
}
