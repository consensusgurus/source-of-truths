// Verify the Chain (daily dots-and-boxes endgame) bank.
//
// Chain's own header comment (app/chain/puzzles.js) and its client's rules copy
// (ChainClient.jsx) promise, per board:
//
//   - a REAL, REACHABLE position with YOU to move and the game already won;
//   - EXACTLY ONE edge still wins it, and every other edge hands the game over;
//   - both temptations are live: a box you could take now, and a quiet edge you
//     could decline with;
//   - the board has an ODD number of boxes, so a tie is impossible;
//   - weekdays 3x5, Sundays 5x5;
//   - `margin` is the box margin you end up winning by with best play.
//
// Nothing here is read off a stored field and printed back. Every number is
// recomputed from the position with app/chain/boxes.js, the exact engine the
// browser runs, and the reachability claim is PROVED by replaying the stored
// opening rather than assumed.
//
//   1. Structural: `drawn` is E chars of 0/1 for the board's own geometry,
//      `owner` is rows*cols chars of 0/1/2, every COMPLETED box has an owner
//      and no incomplete box has one, box count is odd, and the size matches
//      the weekday/Sunday rule.
//   2. Reachability, proved: `history` is replayed from an empty board with
//      `opener` moving first and the real capture-keeps-the-turn rule. It must
//      use each drawn edge exactly once, touch no undrawn edge, reproduce
//      `drawn` and `owner` byte for byte, and leave YOU to move. This is the
//      analogue of verify-four.mjs's disc-count and gravity checks, except it
//      proves the whole history instead of a parity invariant.
//   3. Independent solve of every legal edge: EXACTLY ONE reaches a final
//      margin above zero, that edge is `key`, its margin equals `margin`, and
//      no edge reaches exactly zero (which would be a tie the odd box count is
//      supposed to rule out).
//   4. Full playout from the key with both sides playing the shipping engine:
//      the game really ends at `margin`. This catches a sign or turn-order
//      error that a root-only check would sail past.
//   5. Both temptations live at the root, and the ALTERNATION rule the bank
//      documents actually holds: the key is a quiet edge on Sundays and on even
//      board numbers, and a capture otherwise. A bank whose answer is always
//      "leave it alone" trains a reflex instead of a read, which is the
//      pool-variety failure the authoring standard is about.
//   6. Solve budget: the root solve is timed, because the browser runs this
//      same search once per turn, and a board over SOLVE_CAP_MS would freeze a
//      phone.
//   7. num/quizId/live/dateLabel mutually consistent and sequential, `sunday`
//      matching the real day of the week, no duplicate boards.
//   8. Pool variety on `motif` (the reader-facing line revealed after the
//      game), with the usual dated grandfather floor, plus a US-spelling scan.
//   9. From MOTIF_FAMILY_FROM, the motif is a line of the family the board's
//      OWN solve implies (scripts/chain-motifs.mjs: the key declines with one
//      or with two boxes on offer, takes a pair, takes one of more, or takes
//      all there is), so a line can never describe a different board. Added
//      2026-11-12 with the motif pool growth.
//
// Run: node scripts/verify-chain.mjs
import { PUZZLES } from '../app/chain/puzzles.js';
import { geometry, parsePosition, makeSolver, makeGame, engineMove, boxScore, completedBoxes } from '../app/chain/boxes.js';
import { MOTIFS } from './chain-motifs.mjs';

let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);

// Boards before this date are frozen history: already published and played.
const CHAIN_FLOOR_FROM = '2026-08-04';
const MOTIF_CEILING = 4;      // an exact motif string may repeat at most this often
const MOTIF_FAMILY_FROM = '2026-08-04'; // every board from launch carries a line of its own family
const SOLVE_CAP_MS = 400;     // the browser solves once per turn
const WEEKDAY = { rows: 3, cols: 5 };
const SUNDAY = { rows: 5, cols: 5 };

const BRITISH_RE = /\b(colour|flavour|favourite|centre|theatre|organis(e|ing|ation)|recognis(e|ed|ing)|realis(e|ed|ing)|travell(ed|ing|er)|programme|metre|litre|kerb|tyre|analys(e|ed|ing)|catalogue|dialogue|jewellery|labour|neighbour|honour|armour|cheque|defence|licence|practise|whilst|amongst|learnt|aluminium|aeroplane)\b/i;
function scanBritish(id, label, s) {
  if (typeof s !== 'string') return;
  const m = s.match(BRITISH_RE);
  if (m) fail(id, `British spelling "${m[0]}" in ${label}: "${s}"`);
}

// ── replay the stored opening, and prove it produces exactly this board ─────
function replay(p, g) {
  const drawn = new Uint8Array(g.E);
  const owner = new Uint8Array(g.rows * g.cols);
  let turn = p.opener;
  const seen = new Set();
  for (const e of p.history) {
    if (!Number.isInteger(e) || e < 0 || e >= g.E) return `history contains edge ${e}, outside 0..${g.E - 1}`;
    if (seen.has(e)) return `history draws edge ${e} twice`;
    seen.add(e);
    drawn[e] = 1;
    let k = 0;
    for (const b of g.edgeBoxes[e]) {
      if (g.boxEdges[b].every((x) => drawn[x]) && !owner[b]) { owner[b] = turn; k++; }
    }
    if (!k) turn = turn === 1 ? 2 : 1;
  }
  if (turn !== 1) return 'the replayed opening does not leave YOU to move';
  const gotDrawn = Array.from(drawn).join('');
  if (gotDrawn !== p.drawn) return `the replayed opening produces a different board\n      replay ${gotDrawn}\n      stored ${p.drawn}`;
  const gotOwner = Array.from(owner).join('');
  if (gotOwner !== p.owner) return `the replayed opening produces a different ledger\n      replay ${gotOwner}\n      stored ${p.owner}`;
  return null;
}

// ── play the game out from the key, both sides perfect ─────────────────────
function playOut(p) {
  const st = makeGame(p);
  const keyIdx = st.solver.slot.get(p.key);
  if (keyIdx === undefined) return { err: `key edge ${p.key} is already drawn` };
  st.play(keyIdx);
  let guard = 0;
  while (!st.over) {
    if (++guard > 200) return { err: 'playout did not terminate' };
    const mv = engineMove(st.solver, st.mask, p.quizId);
    if (!mv) return { err: 'engineMove returned nothing on a live board' };
    st.play(mv.i);
  }
  const s = boxScore(st.owner);
  return { margin: s.mine - s.theirs, mine: s.mine, theirs: s.theirs };
}

const seenBoards = new Map();
const motifPool = new Map();
let worstSolve = 0;

PUZZLES.forEach((p, i) => {
  const errs = [];

  // -- 7. identity --
  if (p.num !== i + 1) errs.push(`num ${p.num} != ${i + 1}`);
  const m = String(p.quizId).match(/^chain-(\d+)-(\d+)-(\d+)$/);
  if (!m) errs.push('bad quizId');
  else {
    const iso = `20${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    if (iso !== p.live) errs.push(`live ${p.live} != quizId date ${iso}`);
  }
  const wantLabel = p.live ? new Date(`${p.live}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : null;
  if (wantLabel && p.dateLabel !== wantLabel) errs.push(`dateLabel "${p.dateLabel}" != "${wantLabel}"`);
  const isSun = p.live ? new Date(`${p.live}T12:00:00Z`).getUTCDay() === 0 : null;
  if (isSun !== null && !!p.sunday !== isSun) errs.push(`sunday must be ${isSun} for ${p.live}`);

  // -- 1. structural --
  const want = p.sunday ? SUNDAY : WEEKDAY;
  if (p.rows !== want.rows || p.cols !== want.cols) errs.push(`size ${p.rows}x${p.cols} != ${want.rows}x${want.cols} for a ${p.sunday ? 'Sunday' : 'weekday'}`);
  let g = null, parsed = null;
  if (!Number.isInteger(p.rows) || !Number.isInteger(p.cols)) errs.push('rows/cols must be integers');
  else {
    g = geometry(p.rows, p.cols);
    if ((p.rows * p.cols) % 2 === 0) errs.push(`${p.rows * p.cols} boxes is even, so a tie is possible`);
    if (typeof p.drawn !== 'string' || p.drawn.length !== g.E || !/^[01]+$/.test(p.drawn)) errs.push(`drawn must be ${g.E} chars of 0/1`);
    else if (typeof p.owner !== 'string' || p.owner.length !== p.rows * p.cols || !/^[012]+$/.test(p.owner)) errs.push(`owner must be ${p.rows * p.cols} chars of 0/1/2`);
    else {
      parsed = parsePosition(p);
      const done = new Set(completedBoxes(g, parsed.drawn));
      for (let b = 0; b < p.rows * p.cols; b++) {
        const owned = parsed.owner[b] !== 0;
        if (done.has(b) && !owned) errs.push(`box ${b} is complete but unowned`);
        if (!done.has(b) && owned) errs.push(`box ${b} is owned but not complete`);
      }
      if (parsed.drawn[p.key]) errs.push(`key edge ${p.key} is already drawn`);
    }
  }

  // -- 2. reachability, proved by replay --
  if (!errs.length) {
    if (!Array.isArray(p.history)) errs.push('missing history');
    else if (p.opener !== 1 && p.opener !== 2) errs.push(`opener must be 1 or 2, got ${p.opener}`);
    else {
      const drawnCount = p.drawn.split('').filter((c) => c === '1').length;
      if (p.history.length !== drawnCount) errs.push(`history has ${p.history.length} moves but ${drawnCount} edges are drawn`);
      else { const bad = replay(p, g); if (bad) errs.push(bad); }
    }
  }

  // -- 3/5/6. independent solve of the root --
  let solveNote = '';
  let keyGain = null;
  if (!errs.length) {
    const solver = makeSolver(g, parsed.drawn);
    const { mine, theirs } = boxScore(parsed.owner);
    const lead = mine - theirs;
    const t0 = process.hrtime.bigint();
    const moves = solver.scoreMoves(solver.full);
    const solveMs = Number(process.hrtime.bigint() - t0) / 1e6;
    if (solveMs > worstSolve) worstSolve = solveMs;
    if (solveMs > SOLVE_CAP_MS) errs.push(`root solve took ${solveMs.toFixed(0)}ms, over the ${SOLVE_CAP_MS}ms cap`);

    const finals = moves.map((mv) => ({ ...mv, final: lead + mv.score }));
    const winners = finals.filter((mv) => mv.final > 0);
    const ties = finals.filter((mv) => mv.final === 0);
    if (ties.length) errs.push(`${ties.length} edge(s) end level, which an odd box count should make impossible`);
    if (winners.length !== 1) {
      errs.push(`NOT UNIQUE: ${winners.length} edges still win (${winners.map((w) => w.edge).join(', ')})`);
    } else {
      const key = winners[0];
      keyGain = key.gain;
      if (key.edge !== p.key) errs.push(`the only winning edge is ${key.edge}, but key is ${p.key}`);
      if (key.final !== p.margin) errs.push(`recomputed margin ${key.final} != stored margin ${p.margin}`);
      const unclaimed = (p.rows * p.cols) - (mine + theirs);
      if (unclaimed !== p.boxesLeft) errs.push(`recomputed boxesLeft ${unclaimed} != stored ${p.boxesLeft}`);

      const bestGain = Math.max(...moves.map((mv) => mv.gain));
      if (bestGain === 0) errs.push('no capture is on offer, so there is nothing to decline');
      if (!moves.some((mv) => mv.gain === 0)) errs.push('no quiet edge is available, so the board answers itself');

      // -- 9. the motif describes THIS board's key --
      if (p.live >= MOTIF_FAMILY_FROM && p.motif) {
        const fam = key.gain === 0 ? (bestGain >= 2 ? 'declineDouble' : 'declineSingle')
          : key.gain === 2 ? 'takePair' : (bestGain > key.gain ? 'takeOne' : 'takePlain');
        if (!MOTIFS[fam].includes(p.motif)) errs.push(`motif is not a ${fam} line (key takes ${key.gain} of ${bestGain} on offer): "${p.motif}"`);
      }

      // -- the documented alternation --
      const wantDecline = !!p.sunday || (p.num - 1) % 2 === 0;
      if (wantDecline && key.gain !== 0) errs.push(`board ${p.num}${p.sunday ? ' (Sunday)' : ''} should be a decline day but the key takes ${key.gain}`);
      if (!wantDecline && key.gain === 0) errs.push(`board ${p.num} should be a capture day but the key takes nothing`);

      // -- 4. full playout --
      const out = playOut(p);
      if (out.err) errs.push(out.err);
      else if (out.margin !== p.margin) errs.push(`playing it out ends ${out.mine}-${out.theirs} (margin ${out.margin}), not the stated ${p.margin}`);
      else solveNote = `, one winning edge confirmed by independent solve, plays out to ${out.mine}-${out.theirs} (${solveMs.toFixed(0)}ms)`;
    }
  }

  if (!p.motif) errs.push('missing motif'); else scanBritish(p.quizId, 'motif', p.motif);
  if (p.drawn) seenBoards.set(`${p.rows}x${p.cols}:${p.drawn}`, (seenBoards.get(`${p.rows}x${p.cols}:${p.drawn}`) || []).concat(p.quizId));
  if (p.motif) motifPool.set(p.motif, (motifPool.get(p.motif) || []).concat({ id: p.quizId, live: p.live }));

  errs.length
    ? fail(p.quizId, errs.join('; '))
    : ok(p.quizId, `${p.rows}x${p.cols}, ${p.boxesLeft} boxes on the table, wins by ${p.margin}, key ${keyGain === 0 ? 'declines' : `takes ${keyGain}`}${p.sunday ? ' (Sunday)' : ''}${solveNote}`);
});

for (const [, ids] of seenBoards) {
  if (ids.length > 1) fail('chain pool', `identical board shipped on ${ids.length} days: ${ids.join(', ')}`);
}

// -- 8. motif pool variety --
let staleFound = false;
for (const [motif, entries] of motifPool) {
  if (entries.length > MOTIF_CEILING) {
    const fresh = entries.filter((e) => e.live >= CHAIN_FLOOR_FROM).length;
    const msg = `motif reused on ${entries.length} boards (ceiling ${MOTIF_CEILING}): ${entries.map((e) => e.id).join(', ')} -- "${motif}"`;
    if (fresh > 0) { fail('chain pool', msg); staleFound = true; }
    else note('chain pool', `grandfathered: ${msg}`);
  }
}

// -- the alternation has to produce a genuine mix, not just satisfy a formula --
const declineDays = PUZZLES.filter((p) => !!p.sunday || (p.num - 1) % 2 === 0).length;
const share = declineDays / PUZZLES.length;
if (share < 0.35 || share > 0.72) fail('chain pool', `decline days are ${(share * 100).toFixed(0)}% of the bank, outside the 35-72% band that keeps the answer unpredictable`);

if (!staleFound && BAD === 0) {
  ok('chain pool', `${PUZZLES.length} boards, ${motifPool.size} distinct motifs, ${declineDays} decline days and ${PUZZLES.length - declineDays} capture days, worst root solve ${worstSolve.toFixed(0)}ms`);
}

console.log(BAD ? `\n${BAD} FAILURE(S)` : '\nAll Chain boards verified.');
process.exit(BAD ? 1 : 0);
