// scripts/bot-search.mjs: the exhaustive search behind Bot's par. Shared by
// scripts/gen-bot.mjs (which sets par) and scripts/verify-bot.mjs (which
// re-proves it), and runs lib/bot-engine.js's own rules.
//
// shortest(B, maxTotal) tries EVERY program the board allows, fewest commands
// first, up to maxTotal commands across all rows, and returns the first that
// lights every lamp (or null). Only programs that provably have a shorter
// twin with the same behaviour are skipped:
//   - LR, RL, LLL, RRR, OO anywhere in a row (each can be cut or shortened);
//   - a call to an empty row (cut the call), a non-empty row nothing calls
//     (empty it), and P3 in use while P2 is empty (rename P3 to P2).
// So "no program of N commands or fewer wins" is a real proof, not a sample.
import { modelOf, wins, ACTIONS, ROWS, rowsOf } from '../lib/bot-engine.js';

const BAD = /LR|RL|LLL|RRR|OO/;
const cache = new Map();
function seqs(len, alpha) {
  const key = len + '|' + alpha;
  if (cache.has(key)) return cache.get(key);
  let out = [''];
  for (let i = 0; i < len; i++) {
    const nx = [];
    for (const s of out) for (const a of alpha) { const t = s + a; if (!BAD.test(t.slice(-3))) nx.push(t); }
    out = nx;
  }
  cache.set(key, out);
  return out;
}

// every split of `total` commands over the board's rows
function* splits(B, total) {
  const rows = rowsOf(B);
  const lens = new Array(rows.length).fill(0);
  function* rec(k, left) {
    if (k === rows.length) { if (left === 0) yield lens.slice(); return; }
    const max = Math.min(B.slots[rows[k]], left);
    for (let n = k === 0 ? 1 : 0; n <= max; n++) { lens[k] = n; yield* rec(k + 1, left - n); }
  }
  yield* rec(0, total);
}

export function shortest(B, maxTotal, opts = {}) {
  const M = modelOf(B);
  const rows = rowsOf(B);
  let tried = 0;
  for (let total = 1; total <= maxTotal; total++) {
    for (const lens of splits(B, total)) {
      const used = rows.filter((r, k) => lens[k] > 0);
      if (rows.includes('p3') && lens[rows.indexOf('p3')] > 0 && !(lens[rows.indexOf('p2')] > 0)) continue;
      const digits = used.filter((r) => r !== 'main').map((r) => r.slice(1));
      if (used.length > 1 && !digits.length) continue;
      const alpha = ACTIONS.join('') + digits.join('');
      const lists = rows.map((r, k) => (lens[k] ? seqs(lens[k], alpha) : ['']));
      const prog = { main: '', p1: '', p2: '', p3: '' };
      const idx = new Array(rows.length).fill(0);
      // odometer over the rows' lists
      outer: for (;;) {
        for (let k = 0; k < rows.length; k++) prog[rows[k]] = lists[k][idx[k]];
        // every used sub-row must be called from some row
        let ok = true;
        for (const r of used) {
          if (r === 'main') continue;
          const dgt = r.slice(1);
          if (!used.some((o) => o !== r && prog[o].includes(dgt))) { ok = false; break; }
        }
        if (ok) {
          for (const r of ROWS) if (!rows.includes(r)) prog[r] = '';
          // a call into an empty row
          for (const c of prog.main + prog.p1 + prog.p2 + prog.p3) if (c >= '1' && c <= '3' && !prog['p' + c]) { ok = false; break; }
        }
        if (ok) {
          tried++;
          if (wins(M, prog)) return { prog: { ...prog }, total, tried };
        }
        let k = rows.length - 1;
        while (k >= 0) { idx[k]++; if (idx[k] < lists[k].length) break; idx[k] = 0; k--; }
        if (k < 0) break outer;
      }
    }
    if (opts.onLevel) opts.onLevel(total, tried);
  }
  return null;
}
