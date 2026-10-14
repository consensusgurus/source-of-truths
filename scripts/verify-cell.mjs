// Verify the Cell (daily FreeCell) bank, app/cell/puzzles.js.
//
// This file imports NOTHING from lib/cell-core.js or scripts/gen-cell.mjs. It
// carries its own rules engine and its own exact solver, so a bug in the game's
// engine or in the generator's search cannot vouch for itself.
//
// What the bank promises, per board (header of app/cell/puzzles.js):
//   - `deal` is a complete deck, ace to `ranks` in four suits, each card once,
//     dealt round robin into the day's number of columns (bottom to top);
//   - `perfect` is the EXACT minimum number of player moves under the rules
//     (sequence moves count one, safe autoplay counts nothing). This verifier
//     re-solves every board with A* under an admissible bound: the first goal it
//     pops is a minimum, so a line of `perfect` moves exists AND none shorter
//     does. A board whose search runs out of budget is a FAILURE, not a pass;
//   - no solution, line or move list ships in the bank;
//   - the week ramps: cells fall Monday (4) to Saturday (2) on the 32-card deck
//     in six columns, each weekday sits in its own perfect band, and the bands
//     meet end to end so perfect never falls from Monday to Saturday. That is
//     re-checked inside every calendar week too. The Sunday Edition is the
//     40-card deck (ace to ten) in seven columns on two cells, perfect 24-30;
//   - num / quizId / live / dateLabel agree, dates run day by day from the first
//     board with no gap, `sunday` is true exactly on real Sundays;
//   - no deal repeats, and no opening signature (the sorted top card of every
//     column, what a player sees first) appears more than twice in the bank.
//
// Run:   node scripts/verify-cell.mjs           every board re-solved
//        node scripts/verify-cell.mjs --quick   structure for all; minimum re-proved
//                                               for the first fourteen boards and every
//                                               sixth board after (a full run is long)
// Mutation-tested by scripts/cell-mutation-test.mjs (VERIFY_CELL_BANK points this
// file at a mutated copy).
const BANK = process.env.VERIFY_CELL_BANK
  ? `file://${process.env.VERIFY_CELL_BANK}`
  : new URL('../app/cell/puzzles.js', import.meta.url).href;
const { PUZZLES } = await import(BANK);
const QUICK = process.argv.includes('--quick');
// --prove N: re-prove the minimum on the first N boards only (the mutation test
// uses it so each of its runs stays short).
const PROVE_N = process.argv.includes('--prove') ? Number(process.argv[process.argv.indexOf('--prove') + 1]) : null;

const fails = [];
const fail = (id, msg) => { fails.push(`${id}: ${msg}`); console.error(`FAIL ${id}: ${msg}`); };

const SPEC = {
  1: { ranks: 8, cols: 6, cells: 4, lo: 13, hi: 15 },
  2: { ranks: 8, cols: 6, cells: 4, lo: 15, hi: 16 },
  3: { ranks: 8, cols: 6, cells: 3, lo: 16, hi: 17 },
  4: { ranks: 8, cols: 6, cells: 3, lo: 17, hi: 18 },
  5: { ranks: 8, cols: 6, cells: 2, lo: 18, hi: 20 },
  6: { ranks: 8, cols: 6, cells: 2, lo: 20, hi: 22 },
  0: { ranks: 10, cols: 7, cells: 2, lo: 24, hi: 30 },
};
const FIRST = '2026-10-14';
const ALLOWED = new Set(['num', 'quizId', 'live', 'dateLabel', 'sunday', 'ranks', 'cells', 'perfect', 'deal']);
const BUDGET = 3_000_000;

// ---- independent rules: a card is { r: 1..10, s: 'S'|'H'|'C'|'D' } stored as
// the number s*16+r on disk; here it is unpacked once into rank and suit.
const R = (c) => c % 16;
const S = (c) => Math.floor(c / 16);
const isRed = (c) => S(c) === 1 || S(c) === 3;
const sits = (under, over) => R(over) + 1 === R(under) && isRed(over) !== isRed(under);
const RL = ' A23456789T';
const SL = 'SHCD';
const tag = (c) => RL[R(c)] + SL[S(c)];

function autoplay(st) {
  // aces and twos go home whenever they fit; anything higher once both
  // foundations of the other colour are at least one rank below it
  let moved = true;
  const ok = (c) => {
    if (st.home[S(c)] + 1 !== R(c)) return false;
    if (R(c) <= 2) return true;
    const other = isRed(c) ? [0, 2] : [1, 3];
    return other.every((x) => st.home[x] >= R(c) - 1);
  };
  while (moved) {
    moved = false;
    for (const col of st.tab) {
      while (col.length && ok(col[col.length - 1])) { const c = col.pop(); st.home[S(c)] = R(c); moved = true; }
    }
    st.cells = st.cells.filter((c) => { if (ok(c)) { st.home[S(c)] = R(c); moved = true; return false; } return true; });
  }
}
const sig = (st) => st.tab.map((c) => c.map(tag).join('')).sort().join('/') + '#' + st.cells.map(tag).sort().join('') + '#' + st.home.join('.');

// The bound: a tableau card that cannot leave its column except by a player
// move (a lower card of its suit is under it, or it is above rank two and a card
// of the other colour at most one rank lower is under it, which autoplay must
// wait for), counted only where the card on it does not sit legally (or it is
// on top). No move can take two such cards out of one column, and a move empties
// at most one column of cards, so this never exceeds the moves left.
function bound(tab) {
  let n = 0;
  for (const col of tab) {
    for (let i = 0; i < col.length; i++) {
      const c = col[i];
      let blocked = false;
      for (let j = 0; j < i && !blocked; j++) {
        const u = col[j];
        if (S(u) === S(c) && R(u) < R(c)) blocked = true;
        else if (R(c) > 2 && isRed(u) !== isRed(c) && R(u) <= R(c) - 1) blocked = true;
      }
      if (blocked && (i === col.length - 1 || !sits(c, col[i + 1]))) n++;
    }
  }
  return n;
}

function successors(st, nCells) {
  const out = [];
  const yield_ = (t) => { autoplay(t); out.push(t); };
  const emptyCols = st.tab.filter((c) => !c.length).length;
  const freeCells = nCells - st.cells.length;
  const clone = () => ({ tab: st.tab.map((c) => c.slice()), cells: st.cells.slice(), home: st.home.slice() });
  // from a free cell
  st.cells.forEach((c, k) => {
    if (st.home[S(c)] + 1 === R(c)) { const t = clone(); t.cells.splice(k, 1); t.home[S(c)] = R(c); yield_(t); }
    st.tab.forEach((col, j) => {
      if (!col.length || sits(col[col.length - 1], c)) { const t = clone(); t.cells.splice(k, 1); t.tab[j].push(c); yield_(t); }
    });
  });
  // from a column
  st.tab.forEach((col, i) => {
    if (!col.length) return;
    const top = col[col.length - 1];
    if (st.home[S(top)] + 1 === R(top)) { const t = clone(); t.tab[i].pop(); t.home[S(top)] = R(top); yield_(t); }
    if (freeCells > 0) { const t = clone(); t.tab[i].pop(); t.cells.push(top); yield_(t); }
    let depth = 1;
    while (depth < col.length && sits(col[col.length - depth - 1], col[col.length - depth])) depth++;
    st.tab.forEach((dst, j) => {
      if (j === i) return;
      const limit = (freeCells + 1) * 2 ** (dst.length ? emptyCols : emptyCols - 1);
      for (let n = 1; n <= depth && n <= limit; n++) {
        const head = col[col.length - n];
        if (dst.length ? !sits(dst[dst.length - 1], head) : n === col.length) continue;
        const t = clone(); const run = t.tab[i].splice(col.length - n); t.tab[j].push(...run); yield_(t);
      }
    });
  });
  return out;
}

// A* with re-opening. Returns the minimum, or -1 with { exhausted } or { over }.
function minimum(deal, nCells, ranks) {
  const start = { tab: deal.map((c) => c.slice()), cells: [], home: [0, 0, 0, 0] };
  autoplay(start);
  const best = new Map();
  const open = [];
  const add = (st, g) => {
    const k = sig(st);
    const b = best.get(k);
    if (b !== undefined && b <= g) return;
    best.set(k, g);
    const f = g + bound(st.tab);
    (open[f] || (open[f] = [])).push([st, g, k]);
  };
  add(start, 0);
  let expanded = 0;
  for (let f = 0; f < open.length; f++) {
    const q = open[f];
    while (q && q.length) {
      const [st, g, k] = q.pop();
      if (best.get(k) !== g) continue;
      if (st.home.every((h) => h === ranks)) return { moves: g, expanded };
      if (++expanded > BUDGET) return { moves: -1, over: true, expanded };
      for (const t of successors(st, nCells)) add(t, g + 1);
    }
  }
  return { moves: -1, exhausted: true, expanded };
}

// ---- per-board checks
const isoAdd = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const BRITISH_RE = /\b(colour|centre|favourite|organis|realis|travell|programme|defence|licence)/i;
const seenDeal = new Map();
const opening = new Map();
const weeks = new Map(); // monday iso -> [{dow, perfect, id}]
let proved = 0, provedMs = 0;

PUZZLES.forEach((p, i) => {
  const id = p.quizId || `#${i + 1}`;
  for (const k of Object.keys(p)) if (!ALLOWED.has(k)) fail(id, `unexpected field "${k}" (the bank must not ship a solution or anything beyond the documented fields)`);
  if (p.num !== i + 1) fail(id, `num ${p.num}, want ${i + 1}`);
  const want = isoAdd(FIRST, i);
  if (p.live !== want) fail(id, `live ${p.live}, want ${want} (dates run day by day from ${FIRST})`);
  const [y, m, d] = String(p.live).split('-').map(Number);
  if (p.quizId !== `cell-${m}-${d}-${String(y).slice(2)}`) fail(id, `quizId does not match live ${p.live}`);
  const label = new Date(`${p.live}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  if (p.dateLabel !== label) fail(id, `dateLabel "${p.dateLabel}", want "${label}"`);
  if (BRITISH_RE.test(p.dateLabel || '')) fail(id, 'British spelling in dateLabel');
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  if (!!p.sunday !== (dow === 0)) fail(id, `sunday is ${p.sunday} on a ${dow === 0 ? 'Sunday' : 'weekday'}`);
  const sp = SPEC[dow];
  if (p.ranks !== sp.ranks) fail(id, `ranks ${p.ranks}, want ${sp.ranks}`);
  if (p.cells !== sp.cells) fail(id, `cells ${p.cells}, want ${sp.cells}`);
  if (!Array.isArray(p.deal) || p.deal.length !== sp.cols) { fail(id, `deal has ${p.deal && p.deal.length} columns, want ${sp.cols}`); return; }
  const total = 4 * sp.ranks;
  const cards = p.deal.flat();
  if (cards.length !== total) fail(id, `deal holds ${cards.length} cards, want ${total}`);
  const set = new Set(cards);
  if (set.size !== cards.length) fail(id, 'a card is dealt twice');
  for (let s = 0; s < 4; s++) for (let r = 1; r <= sp.ranks; r++) if (!set.has(s * 16 + r)) fail(id, `missing card ${tag(s * 16 + r)}`);
  for (const c of cards) if (!Number.isInteger(c) || R(c) < 1 || R(c) > sp.ranks || S(c) > 3) fail(id, `card ${c} is outside the deck`);
  const sizes = p.deal.map((c) => c.length);
  sizes.forEach((n, k) => { const wantN = Math.floor(total / sp.cols) + (k < total % sp.cols ? 1 : 0); if (n !== wantN) fail(id, `column ${k + 1} holds ${n}, a round-robin deal gives ${wantN}`); });
  if (!Number.isInteger(p.perfect) || p.perfect < sp.lo || p.perfect > sp.hi) fail(id, `perfect ${p.perfect} outside the ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow]} band [${sp.lo}, ${sp.hi}]`);
  const key = JSON.stringify(p.deal);
  if (seenDeal.has(key)) fail(id, `same deal as ${seenDeal.get(key)}`); else seenDeal.set(key, id);
  const op = p.deal.map((c) => tag(c[c.length - 1])).sort().join(' ');
  opening.set(op, (opening.get(op) || []).concat(id));
  if (dow !== 0) {
    const mon = isoAdd(p.live, 1 - dow);
    weeks.set(mon, (weeks.get(mon) || []).concat({ dow, perfect: p.perfect, id }));
  }

  // the exact minimum
  const prove = PROVE_N != null ? i < PROVE_N : (!QUICK || i < 14 || i % 6 === 0);
  if (prove && cards.length === total && set.size === total) {
    const t = Date.now();
    const r = minimum(p.deal, p.cells, p.ranks);
    provedMs += Date.now() - t;
    proved++;
    if (r.over) fail(id, `search budget ran out after ${r.expanded} expansions; the minimum is unproved`);
    else if (r.exhausted) fail(id, 'no win exists from this deal');
    else if (r.moves !== p.perfect) fail(id, `exact minimum is ${r.moves}, bank says perfect ${p.perfect}`);
    else console.log(`ok ${id}  ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]} ${p.cells} cells  perfect ${p.perfect} proved minimum (${r.expanded} expansions, ${Date.now() - t}ms)`);
  }
});

for (const [mon, list] of weeks) {
  list.sort((a, b) => a.dow - b.dow);
  for (let k = 1; k < list.length; k++) {
    if (list[k].perfect < list[k - 1].perfect) fail(list[k].id, `perfect ${list[k].perfect} is below ${list[k - 1].id}'s ${list[k - 1].perfect} in the week of ${mon}`);
  }
}
for (const [op, ids] of opening) if (ids.length > 2) fail('cell pool', `opening signature ${op} on ${ids.length} boards: ${ids.join(', ')}`);
const sundays = PUZZLES.filter((p) => p.sunday);
const weekMax = Math.max(...PUZZLES.filter((p) => !p.sunday).map((p) => p.ranks * 4));
for (const p of sundays) if (p.ranks * 4 <= weekMax) fail(p.quizId, 'Sunday Edition is not a bigger deck than every weekday');

console.log(`\n${PUZZLES.length} boards, ${PUZZLES[0] && PUZZLES[0].live} to ${PUZZLES.length && PUZZLES[PUZZLES.length - 1].live}; minimum re-proved on ${proved} (${(provedMs / 1000).toFixed(1)}s)${QUICK ? ', --quick' : ''}`);
console.log(fails.length ? `${fails.length} FAILURE(S)` : 'All Cell boards verified.');
process.exit(fails.length ? 1 : 0);
