// Reading a typed company guess (owner, 2026-11-10, Tape and Filing): no
// suggestion list at all, "do not show pre-populated results, and allow
// company name + ticker to be input, and give close matching vs exact
// matching". The player types a name or a ticker and presses Guess; this
// reads it as ONE company without ever listing candidates, so the field
// cannot be fished by typing a few letters.
//
// Read in this order, largest company first within a step (the guess list is
// stored largest first):
//   0 a ticker typed in capitals ("NET" is Cloudflare)
//   1 the full name, or one of the answer's alt names
//   2 a ticker in any case
//   3 the name's leading words ("marriott", "home depot" for The Home Depot)
//   4 every typed word is a word of the name, in any order
//   5 close spelling: the name, or its leading words, a typo or two away,
//     spaces ignored ("air bnb", "netflx")
// Nothing below two letters, and no close match below four.

export function fold(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}
const SUFFIX = /\s+(inc|incorporated|corp|corporation|co|company|ltd|plc|holdings?|group|the)$/;
const strip = (f) => { let x = f.replace(/^the\s+/, ''); let y; while ((y = x.replace(SUFFIX, '')) !== x) x = y; return x; };
const tight = (f) => f.replace(/\s+/g, '');

function lev(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let lo = i;
    for (let j = 1; j <= b.length; j += 1) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v); if (v < lo) lo = v;
    }
    if (lo > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length];
}

// universe: [[ticker, name], ...] largest first. extra: Map ticker -> [alt names].
export function makeList(universe) {
  return universe.map(([t, n]) => { const fn = fold(n); return { t, n, ft: t.toLowerCase(), fn, fs: strip(fn) }; });
}

// Returns { it, how: 'exact' | 'close' } or null. `skip` is a Set of tickers
// the player has already missed with; they are passed over.
export function readGuess(query, list, extra, skip) {
  const raw = String(query || '').trim();
  const qf = fold(raw);
  if (qf.length < 2) return null;
  const qs = strip(qf);
  const qt = raw.toLowerCase().replace(/\s+/g, '');
  const caps = /^[A-Z.]{1,6}$/.test(raw);
  const qw = qs.split(' ');
  const best = [null, null, null, null, null, null];
  const bestD = { d: 99 };
  for (const it of list) {
    if (skip && skip.has(it.t)) continue;
    const alts = (extra && extra.get(it.t)) || [];
    const forms = [it.fs, ...alts.map((a) => strip(fold(a)))];
    if (!best[0] && caps && it.ft === qt) best[0] = it;
    if (!best[1] && (it.fn === qf || forms.includes(qs))) best[1] = it;
    if (!best[2] && it.ft === qt) best[2] = it;
    if (!best[3] && forms.some((f) => f === qs || f.startsWith(qs + ' '))) best[3] = it;
    if (!best[4] && qs.length >= 3 && forms.some((f) => { const w = f.split(' '); return qw.every((x) => w.includes(x)); })) best[4] = it;
    if (qs.length >= 4) {
      const cap = qs.length >= 8 ? 2 : 1;
      for (const f of forms) {
        const fw = f.split(' ');
        const lead = fw.slice(0, Math.max(1, qw.length)).join(' ');
        const d = Math.min(lev(tight(qs), tight(f), cap), lev(tight(qs), tight(lead), cap));
        if (d <= cap && d < bestD.d) { bestD.d = d; bestD.it = it; }
      }
    }
  }
  for (let k = 0; k < 5; k += 1) if (best[k]) return { it: best[k], how: k <= 2 ? 'exact' : 'close' };
  if (bestD.it) return { it: bestD.it, how: 'close' };
  return null;
}
