// Bank generator for Chain, the daily dots-and-boxes endgame.
//
// Positions are produced by SELF-PLAY from an empty board, never by sprinkling
// edges at random, so every board it emits is reachable by a real game and the
// chains and loops form the way they do in play. The walk plays safe edges (any
// edge that does not hand the opponent a box) while safe edges exist, taking
// captures along the way, which is exactly how a real game arrives at the
// chain endgame this puzzle is picked up in.
//
// A candidate is accepted only when all of these hold, all recomputed here from
// app/chain/boxes.js, the same engine the browser runs:
//
//   1. it is YOUR move, and you are winning: (mine - theirs) + value > 0;
//   2. EXACTLY ONE edge keeps the win. Every other edge on the board hands the
//      game to the engine, and there is no take-back;
//   3. BOTH temptations are live at the root: at least one box you could take
//      right now, and at least one quiet edge you could decline with. A board
//      that offers only one kind of move answers itself;
//   4. the board has an ODD number of boxes, so a tie is impossible;
//   5. the shipping solver answers the root inside the time budget, measured,
//      because the browser runs this same search once per turn.
//
// The bank ALTERNATES the shape of the answer, and that is deliberate. On even
// days the key is a quiet edge, so every capture on the board loses; on odd
// days the key is a capture, so the double-cross reflex is the mistake. Sundays
// are always a decline day. A bank where the answer is always "leave it alone"
// teaches players to win without reading the position, which is the pool-variety
// failure the authoring standard is about.
//
// Usage:
//   node scripts/gen-chain.mjs --start 2026-08-06 --days 28 --out app/chain/puzzles.js
//   node scripts/gen-chain.mjs --probe            distribution only, writes nothing
//
// EXTENDING an existing bank rather than building one from scratch:
//
//   node scripts/gen-chain.mjs --start 2026-09-08 --days 73 --startnum 36 \
//        --avoid app/chain/puzzles.js --out /tmp/chain-new.js
//
//   --startnum N   number the first new board N instead of 1. The alternation
//                  (decline on Sundays and on odd `num`, capture otherwise) is
//                  keyed off `num`, exactly as verify-chain.mjs checks it, so a
//                  spliced range MUST carry the numbers it will ship with or
//                  every other board comes out on the wrong side of the rule.
//   --avoid PATH   read an existing bank and pre-seed the dedupe state from it,
//                  so no position it already ships is emitted again and the
//                  MOTIF_CEILING is counted across the WHOLE bank rather than
//                  just the new range. Both of those checks in
//                  verify-chain.mjs run over the whole file, so an extension
//                  built without this will fail them.
//
// The generator always writes a COMPLETE file starting from the boards it
// generated, so an extension is written to a scratch path and its entries are
// spliced onto the end of the live bank by hand. The live boards are frozen.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { geometry, makeSolver, boxScore } from '../app/chain/boxes.js';
import { MOTIFS, motifFamily } from './chain-motifs.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);

const WEEKDAY = { rows: 3, cols: 5 };   // 15 boxes, 38 edges
const SUNDAY  = { rows: 5, cols: 5 };   // 25 boxes, 60 edges
const WEEKDAY_LEFT = [12, 18];          // remaining edges at the root, inclusive
const SUNDAY_LEFT  = [16, 22];
const WEEKDAY_MARGIN = 7;               // win by at most this, so the board stays tense
const SUNDAY_MARGIN = 11;
const SOLVE_BUDGET_MS = 220;            // the browser does this once per turn

let seed = Number(arg('--seed', 20260806)) >>> 0;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ── a live board we can actually play on ───────────────────────────────────
function freshBoard(rows, cols) {
  const g = geometry(rows, cols);
  return { g, drawn: new Uint8Array(g.E), owner: new Uint8Array(rows * cols), turn: 1, history: [] };
}
const sidesDrawn = (b, box) => b.g.boxEdges[box].reduce((n, e) => n + b.drawn[e], 0);

// Draw an edge for the side to move. Returns how many boxes it completed; the
// mover keeps the turn when that is nonzero.
function draw(b, e) {
  b.drawn[e] = 1;
  b.history.push(e);
  let k = 0;
  for (const box of b.g.edgeBoxes[e]) {
    if (sidesDrawn(b, box) === 4 && !b.owner[box]) { b.owner[box] = b.turn; k++; }
  }
  if (!k) b.turn = b.turn === 1 ? 2 : 1;
  return k;
}
const legal = (b) => { const o = []; for (let e = 0; e < b.g.E; e++) if (!b.drawn[e]) o.push(e); return o; };
// An edge is safe when it leaves no box on three sides for the opponent.
function isSafe(b, e) {
  for (const box of b.g.edgeBoxes[e]) if (sidesDrawn(b, box) === 2) return false;
  return true;
}
function capturesAt(b, e) {
  let k = 0;
  for (const box of b.g.edgeBoxes[e]) if (sidesDrawn(b, box) === 3) k++;
  return k;
}

// Play a plausible game until `stopLeft` edges remain, or until the board runs
// out. Captures are taken; otherwise a safe edge is preferred, and when none is
// left a chain gets opened, which is what creates the endgame.
function walkTo(rows, cols, stopLeft) {
  const b = freshBoard(rows, cols);
  for (;;) {
    const moves = legal(b);
    if (moves.length <= stopLeft) return b;
    if (!moves.length) return null;
    const caps = moves.filter((e) => capturesAt(b, e) > 0);
    if (caps.length) {
      // Take boxes, but occasionally decline the last two of a chain, which is
      // how a real game leaves a live double-cross on the board.
      if (caps.length === 1 && rnd() < 0.15) {
        const safe = moves.filter((e) => isSafe(b, e));
        if (safe.length) { draw(b, pick(safe)); continue; }
      }
      caps.sort((x, y) => capturesAt(b, y) - capturesAt(b, x));
      draw(b, caps[0]);
      continue;
    }
    const safe = moves.filter((e) => isSafe(b, e));
    draw(b, safe.length ? pick(safe) : pick(moves));
  }
}

// ── candidate test ─────────────────────────────────────────────────────────
function evaluate(b) {
  const solver = makeSolver(b.g, b.drawn);
  if (!solver.n) return null;
  // Score the position from the side to move; owner 1 is always the player, so
  // flip the ledger when the walk stopped on the engine's turn.
  const { mine, theirs } = boxScore(b.owner);
  const lead = b.turn === 1 ? mine - theirs : theirs - mine;
  const t0 = process.hrtime.bigint();
  const moves = solver.scoreMoves(solver.full);
  const solveMs = Number(process.hrtime.bigint() - t0) / 1e6;
  const winners = moves.filter((m) => lead + m.score > 0);
  const bestGain = Math.max(...moves.map((m) => m.gain));
  return { solver, moves, lead, winners, bestGain, solveMs, mine, theirs };
}

function candidate(rows, cols, leftRange, maxMargin) {
  const want = leftRange[0] + Math.floor(rnd() * (leftRange[1] - leftRange[0] + 1));
  const b = walkTo(rows, cols, want);
  if (!b) return null;
  const left = legal(b).length;
  if (left < leftRange[0] || left > leftRange[1]) return null;
  const ev = evaluate(b);
  if (!ev) return null;
  if (ev.solveMs > SOLVE_BUDGET_MS) return null;
  if (ev.winners.length !== 1) return null;          // exactly one move keeps the win
  // Both temptations must be live: a box you could take right now, and a quiet
  // edge you could decline with. A board offering only one kind answers itself.
  if (ev.bestGain === 0) return null;
  if (!ev.moves.some((m) => m.gain === 0)) return null;
  const key = ev.winners[0];
  if (ev.lead + key.score > maxMargin) return null;  // keep the board tense
  // The walk may have stopped on the engine's turn; the player is always the
  // side to move, so relabel the ledger to match.
  const owner = Array.from(b.owner, (o) => (b.turn === 1 ? o : o === 1 ? 2 : o === 2 ? 1 : 0));
  return {
    rows, cols,
    drawn: Array.from(b.drawn).join(''),
    owner: owner.join(''),
    // The exact order the opening was played in. It is history, never a hint at
    // what comes next, and it is what lets verify-chain.mjs PROVE the position
    // is reachable by a legal game rather than assume it.
    history: b.history.slice(),
    opener: b.turn === 1 ? 1 : 2,
    key: key.edge,
    margin: ev.lead + key.score,
    boxesLeft: b.owner.length - owner.filter((o) => o !== 0).length,
    left,
    solveMs: Math.round(ev.solveMs),
    greedyGain: ev.bestGain,
    keyGain: key.gain,
    greedyLoses: key.gain !== ev.bestGain,
    losers: ev.moves.length - 1,
  };
}

// ── motif: the lines and the family rule live in scripts/chain-motifs.mjs ──

// ── dates ──────────────────────────────────────────────────────────────────
const iso = (d) => d.toISOString().slice(0, 10);
const label = (s) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isSunday = (s) => new Date(`${s}T12:00:00Z`).getUTCDay() === 0;
const quizId = (s) => { const [y, m, d] = s.split('-'); return `chain-${Number(m)}-${Number(d)}-${y.slice(2)}`; };

// ── probe mode: what does the walk actually produce? ───────────────────────
if (has('--probe')) {
  for (const [name, size, range, maxM] of [['weekday', WEEKDAY, WEEKDAY_LEFT, WEEKDAY_MARGIN], ['sunday', SUNDAY, SUNDAY_LEFT, SUNDAY_MARGIN]]) {
    let tries = 0, hits = 0, worst = 0; const lefts = [], margins = [], keyGains = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 12000) {
      tries++;
      const c = candidate(size.rows, size.cols, range, maxM);
      if (c) { hits++; lefts.push(c.left); margins.push(c.margin); keyGains.push(c.keyGain); if (c.solveMs > worst) worst = c.solveMs; }
    }
    const avg = (a) => (a.reduce((x, y) => x + y, 0) / (a.length || 1)).toFixed(1);
    const hist = (a) => [...new Set(a)].sort((x, y) => x - y).map((v) => `${v}:${a.filter((z) => z === v).length}`).join(' ');
    console.log(`${name} ${size.rows}x${size.cols}: ${hits}/${tries} accepted, edges left avg ${avg(lefts)} (${Math.min(...lefts)}-${Math.max(...lefts)}), worst solve ${worst}ms`);
    console.log(`  margin  ${hist(margins)}`);
    console.log(`  keyGain ${hist(keyGains)}`);
  }
  process.exit(0);
}

// ── build the bank ─────────────────────────────────────────────────────────
const start = arg('--start');
const days = Number(arg('--days', 28));
const startNum = Number(arg('--startnum', 1));
if (!start) { console.error('need --start YYYY-MM-DD'); process.exit(1); }
if (!Number.isInteger(startNum) || startNum < 1) { console.error('--startnum must be a positive integer'); process.exit(1); }

const out = [];
const seenDrawn = new Set();
const seenMotif = new Map();
const MOTIF_CEILING = 4; // an exact motif string may repeat at most this often across the bank

// Extending a live bank: pre-seed the dedupe state from the boards that already
// ship, because verify-chain.mjs checks duplicate positions and the motif
// ceiling across the WHOLE file, not just the range being generated.
const avoid = arg('--avoid');
if (avoid) {
  const { PUZZLES: prior } = await import(pathToFileURL(resolve(avoid)).href);
  for (const p of prior) {
    seenDrawn.add(p.drawn);
    if (p.motif) seenMotif.set(p.motif, (seenMotif.get(p.motif) || 0) + 1);
  }
  const spent = [...seenMotif.values()].filter((n) => n >= MOTIF_CEILING).length;
  console.error(`avoiding ${prior.length} boards from ${avoid}: ${seenMotif.size} motifs already in use, ${spent} of them already at the ceiling`);
}

for (let d = 0; d < days; d++) {
  const date = new Date(`${start}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + d);
  const live = iso(date);
  const sun = isSunday(live);
  const size = sun ? SUNDAY : WEEKDAY;
  const range = sun ? SUNDAY_LEFT : WEEKDAY_LEFT;

  // Alternate the shape of the answer so the bank never teaches "always
  // decline" or "always take". Sundays are always a decline day, the harder and
  // more counterintuitive of the two. Keyed off the board NUMBER it will ship
  // with, which is what verify-chain.mjs checks, so a spliced extension lands
  // on the right side of the alternation.
  const num = startNum + d;
  const wantDecline = sun || (num - 1) % 2 === 0;

  let c = null;
  const deadline = Date.now() + 9000;
  while (Date.now() < deadline) {
    const t = candidate(size.rows, size.cols, range, sun ? SUNDAY_MARGIN : WEEKDAY_MARGIN);
    if (!t) continue;
    if (wantDecline !== (t.keyGain === 0)) continue;
    if (seenDrawn.has(t.drawn)) continue;
    // The LEAST-used line in the family that is still under the ceiling (list
    // order breaks ties), so a family spreads across its lines instead of
    // spending one line four days running (2026-11-12; the frozen boards were
    // dealt first-under-ceiling and are not re-dealt).
    const fam = MOTIFS[motifFamily(t)];
    const open = fam.filter((s) => (seenMotif.get(s) || 0) < MOTIF_CEILING);
    const m = open.reduce((a, s) => (a === undefined || (seenMotif.get(s) || 0) < (seenMotif.get(a) || 0) ? s : a), undefined);
    if (!m) continue;
    c = t; c.motif = m; break;
  }
  if (!c) { console.error(`no candidate for ${live} inside the time budget`); process.exit(1); }
  seenDrawn.add(c.drawn);
  seenMotif.set(c.motif, (seenMotif.get(c.motif) || 0) + 1);

  out.push({
    num, quizId: quizId(live), live, dateLabel: label(live), sunday: sun,
    rows: c.rows, cols: c.cols, drawn: c.drawn, owner: c.owner,
    history: c.history, opener: c.opener,
    key: c.key, margin: c.margin, boxesLeft: c.boxesLeft, motif: c.motif,
  });
  console.error(`${live}${sun ? ' (Sunday)' : ''}  ${c.rows}x${c.cols}  ${c.left} edges left, ${c.boxesLeft} boxes on the table, wins by ${c.margin}, key takes ${c.keyGain} of the ${c.greedyGain} on offer, solve ${c.solveMs}ms`);
}

const header = `// Puzzle data for Chain, the daily dots-and-boxes endgame. Imported ONLY by the
// server page (app/chain/page.js), which filters live<=today before handing the
// bank to the client, so tomorrow's board and the edge that wins it never ship
// to a browser.
//
// Every board is a real, reachable position with YOU to move and the game
// already won, on a board with an ODD number of boxes so a tie is impossible.
// Weekdays are 3x5 (15 boxes), Sundays 5x5 (25 boxes).
//
//   rows, cols  boxes down and across. Edges are numbered horizontals first,
//               then verticals; see app/chain/boxes.js for the exact layout.
//   drawn       one char per edge, '1' if that edge is already drawn.
//   owner       one char per box: '0' unclaimed, '1' yours, '2' the engine's.
//               Every completed box has an owner and no incomplete box does.
//   opener      who drew the first edge of the opening, 1 you or 2 the engine.
//   history     the exact order the opening was played in. It is the PAST, and
//               it gives away nothing about what to play next; it is there so
//               scripts/verify-chain.mjs can PROVE the position is reachable by
//               a legal game, by replaying it, instead of assuming so.
//   key         the ONLY edge that still wins. Every other edge hands the game
//               over, and there is no take-back: the engine is perfect, so once
//               the win is gone it never comes back.
//   margin      the box margin you end up winning by, with best play from both
//               sides after the key.
//   boxesLeft   boxes still unclaimed at the root.
//   motif       the idea, revealed only after the game ends.
//
// On EVERY board both temptations are live: at least one box you could take
// right now, and at least one quiet edge you could decline with. Which of the
// two wins ALTERNATES through the bank, so the game never teaches a reflex.
// Sundays are always a decline day.
//
// Generated by scripts/gen-chain.mjs and checked by scripts/verify-chain.mjs,
// which recomputes the key, the margin and the greedy trap from the position
// with the shipping engine rather than trusting any stored field.
`;

const body = out.map((p) => `  {
    num: ${p.num},
    quizId: '${p.quizId}',
    live: '${p.live}',
    dateLabel: '${p.dateLabel}',
    sunday: ${p.sunday},
    rows: ${p.rows},
    cols: ${p.cols},
    drawn: '${p.drawn}',
    owner: '${p.owner}',
    opener: ${p.opener},
    history: [${p.history.join(', ')}],
    key: ${p.key},
    margin: ${p.margin},
    boxesLeft: ${p.boxesLeft},
    motif: '${p.motif.replace(/'/g, "\\'")}',
  },`).join('\n');

const file = `${header}export const PUZZLES = [\n${body}\n];\n`;
const dest = arg('--out', 'app/chain/puzzles.js');
writeFileSync(dest, file);
console.error(`\nwrote ${out.length} boards to ${dest}`);
