// lib/seated-engine.js: the model for Seated, the daily seating-chart puzzle.
// Shared by the client (app/seated/SeatedClient.jsx), the generator
// (scripts/gen-seated.mjs) and the checker (scripts/verify-seated.mjs), so the
// three can never disagree about what a request means.
//
// A board is round tables of `seats` chairs and guests numbered by their place
// in `guests`. A seating is one array per table, a guest index or null per chair.
// Chairs i and i+1 are side by side and the last is beside the first.
//
// A request is { t, a, b?, table?, why }:
//   next     a and b side by side (so the same table)
//   notnext  a and b not side by side (different tables is fine)
//   across   a and b directly opposite at the same table (even tables only)
//   same     a and b at the same table
//   apart    a and b at different tables
//   table    a at table `table`
//   nottable a anywhere but table `table`

export const TAG = {
  next: 'Side by side.', notnext: 'Not side by side.', across: 'Directly across.',
  same: 'Same table.', apart: 'Different tables.',
};
export const tagOf = (P, r) => (r.t === 'table' ? `${P.tables[r.table].name}.` : r.t === 'nottable' ? `Not ${P.tables[r.table].name}.` : TAG[r.t]);

export function seatOf(seat, g) {
  for (let t = 0; t < seat.length; t++) { const i = seat[t].indexOf(g); if (i >= 0) return [t, i]; }
  return null;
}

// 'open' while a guest it names is still standing, then 'ok' or 'bad'.
export function ruleState(seat, r) {
  const a = seatOf(seat, r.a), b = r.b == null ? null : seatOf(seat, r.b);
  if (!a || (r.b != null && !b)) return 'open';
  if (r.t === 'table') return a[0] === r.table ? 'ok' : 'bad';
  if (r.t === 'nottable') return a[0] !== r.table ? 'ok' : 'bad';
  const same = a[0] === b[0], n = seat[a[0]].length, d = same ? Math.abs(a[1] - b[1]) : -1;
  if (r.t === 'apart') return same ? 'bad' : 'ok';
  if (r.t === 'same') return same ? 'ok' : 'bad';
  if (r.t === 'across') return same && n % 2 === 0 && d === n / 2 ? 'ok' : 'bad';
  const adj = same && (d === 1 || d === n - 1);
  if (r.t === 'next') return adj ? 'ok' : 'bad';
  return adj ? 'bad' : 'ok'; // notnext
}

export const seatedCount = (seat) => seat.reduce((n, t) => n + t.filter((x) => x != null).length, 0);
export const solved = (P, seat) => seat.length === P.tables.length
  && seat.every((t, i) => t.length === P.tables[i].seats && t.every((x) => x != null))
  && P.rules.every((r) => ruleState(seat, r) === 'ok');

// One name for an order round a table, whichever chair it starts from and whichever way it runs.
export function ringKey(s) {
  const at = s.indexOf(Math.min(...s)), r = s.slice(at).concat(s.slice(0, at));
  return [r.join(), [r[0]].concat(r.slice(1).reverse()).join()].sort()[0];
}
export const partKey = (seat) => seat.map((t) => t.slice().sort((a, b) => a - b).join()).join('|');

// ---- the solver (generator and checker only) ----
// Can these guests sit round one table of n chairs with every next / notnext /
// across among them met? Returns one order or null. The first guest is pinned to
// chair 0, since a round table has no first chair.
function arrange(P, members, n, rules, all) {
  const rs = rules.filter((r) => r.b != null && (r.t === 'next' || r.t === 'notnext' || r.t === 'across') && members.includes(r.a) && members.includes(r.b));
  const out = [], seat = new Array(n).fill(null), used = new Set();
  const okSoFar = () => rs.every((r) => {
    const i = seat.indexOf(r.a), j = seat.indexOf(r.b);
    if (i < 0 || j < 0) return true;
    const d = Math.abs(i - j), adj = d === 1 || d === n - 1;
    return r.t === 'next' ? adj : r.t === 'notnext' ? !adj : n % 2 === 0 && d === n / 2;
  });
  const go = (k) => {
    if (k === n) { out.push(seat.slice()); return !all; }
    for (const g of members) {
      if (used.has(g)) continue;
      seat[k] = g; used.add(g);
      if (okSoFar() && go(k + 1)) return true;
      seat[k] = null; used.delete(g);
    }
    return false;
  };
  seat[0] = members[0]; used.add(members[0]);
  go(1);
  return all ? out : out[0] || null;
}

// Every way to split the guests between the tables that can be seated, up to
// `cap` of them. Two splits that only swap the guests of two same-size tables
// count as different, because a table request tells them apart.
// A one-table board counts its arrangements instead (mirror images as one).
export function solutions(P, cap = 2) {
  const G = P.guests.length, T = P.tables.length, rules = P.rules;
  if (T === 1) {
    const all = arrange(P, P.guests.map((_, i) => i), P.tables[0].seats, rules, true), seen = new Set(), out = [];
    for (const s of all) {
      const key = ringKey(s);
      if (!seen.has(key)) { seen.add(key); out.push([s]); if (out.length >= cap) break; }
    }
    return out;
  }
  const at = new Array(G).fill(-1), room = P.tables.map((t) => t.seats), out = [];
  const pair = rules.filter((r) => r.b != null);
  // the guests named most go first
  const weight = new Array(G).fill(0); rules.forEach((r) => { weight[r.a] += 2; if (r.b != null) weight[r.b] += 2; });
  const order = P.guests.map((_, i) => i).sort((x, y) => weight[y] - weight[x]);
  const fits = (g, t) => {
    for (const r of rules) {
      if (r.b == null) { if (r.a === g && ((r.t === 'table' && r.table !== t) || (r.t === 'nottable' && r.table === t))) return false; continue; }
    }
    for (const r of pair) {
      const o = r.a === g ? r.b : r.b === g ? r.a : -1;
      if (o < 0 || at[o] < 0) continue;
      const same = at[o] === t;
      if ((r.t === 'next' || r.t === 'across' || r.t === 'same') && !same) return false;
      if (r.t === 'apart' && same) return false;
    }
    return true;
  };
  const go = (k) => {
    if (out.length >= cap) return;
    if (k === G) {
      const seat = [];
      for (let t = 0; t < T; t++) {
        const m = []; for (let g = 0; g < G; g++) if (at[g] === t) m.push(g);
        const s = arrange(P, m, P.tables[t].seats, rules, false);
        if (!s) return;
        seat.push(s);
      }
      out.push(seat); return;
    }
    const g = order[k];
    for (let t = 0; t < T; t++) {
      if (!room[t] || !fits(g, t)) continue;
      at[g] = t; room[t]--;
      // a table that has just filled must be seatable, or everything below is wasted
      let ok = true;
      if (!room[t]) { const m = []; for (let q = 0; q < G; q++) if (at[q] === t) m.push(q); ok = !!arrange(P, m, P.tables[t].seats, rules, false); }
      if (ok) go(k + 1);
      at[g] = -1; room[t]++;
      if (out.length >= cap) return;
    }
  };
  go(0);
  return out;
}

// ---- the Seating Ladder ----
// Ranked on re-seats: every time a guest who already had a chair is moved,
// swapped or stood back up. The same shape as Pack's ladder, cut on the number
// of guests.
// THE SEATING LADDER, reworked 2026-11-15 (owner: "rework the title ranks for
// Seated"). Top to bottom it now reads as one climb, etiquette authority down to
// the room that went wrong: the two famous names, then the people who do this
// for a living, then the host, then the two jokes. Martha Stewart left the top
// because the guests now come from Sudoclue's famous names and could meet her
// at a table; Best Man With a Clipboard was too long for the ending's rungs.
export const RUNGS = ['Emily Post', 'Miss Manners', 'Head of Protocol', 'Wedding Planner', "Maître d'", 'Gracious Host', 'Musical Chairs', 'Seated the Exes Together'];
export function bounds(n) {
  const b = [0, 1];
  for (const f of [0.25, 0.5, 0.75, 1, 1.5]) b.push(Math.max(b[b.length - 1] + 1, Math.ceil(n * f)));
  return b; // rung i covers b[i-1]+1 .. b[i]; the last rung is everything above b[6]
}
export function rankOf(P, rs) {
  const b = bounds(P.guests.length);
  let at = b.findIndex((x) => rs <= x); if (at < 0) at = RUNGS.length - 1;
  const rows = RUNGS.map((name, i) => {
    const lo = i === 0 ? 0 : b[i - 1] + 1, hi = i < b.length ? b[i] : null;
    return { name, label: hi == null ? `${lo} or more` : lo === hi ? (lo === 0 ? 'No re-seats' : `${lo}`) : `${lo} to ${hi}` };
  });
  return { rows, at };
}
