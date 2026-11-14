// lib/chef-engine.js: the board model for Chef, the daily kitchen puzzle (owner,
// 2026-11-13). Shared by the client (app/chef/ChefClient.jsx), the generator
// (scripts/gen-chef.mjs) and the checker (scripts/verify-chef.mjs), so the
// rules are written once.
//
// A service is a list of tickets, each printing at a set minute with two to
// four dishes. A dish cooks on ONE station for a set number of minutes and
// stations have limited room. The clock only moves when the player moves it.
//
//   todo  on the check, not fired yet        cook  on its station
//   pass  finished, waiting under the lamps  tray  on its ticket's tray
//   out   gone with the whole order
//
// THE TRAY (owner): a ticket is a paper check until every dish on it has been
// fired; then it is a tray, and a finished dish is put on it by hand. The order
// goes out the moment its tray holds every dish. A finished dish keeps HOLD
// minutes (on the pass or the tray), then goes cold and returns to the check.
//
// THE SCORE (owner: "food should sit for as least amount of time as possible",
// and a minute of food sitting costs more than a minute of table wait): every
// minute a table waits is 1, every minute a finished dish sits is SIT_WEIGHT.
// Lower is better.

export const STATIONS = [['stove', 'Stove'], ['oven', 'Oven'], ['grill', 'Grill'], ['fryer', 'Fryer'], ['cold', 'Cold']];
export const STATION_NAME = Object.fromEntries(STATIONS);
// dish: [name, station, minutes]
export const MENU = {
  pasta: ['Pasta', 'stove', 3], soup: ['Soup', 'stove', 2], risotto: ['Risotto', 'stove', 5],
  pizza: ['Pizza', 'oven', 4], roast: ['Roast', 'oven', 6],
  steak: ['Steak', 'grill', 4], burger: ['Burger', 'grill', 3],
  fries: ['Fries', 'fryer', 2], wings: ['Wings', 'fryer', 3],
  salad: ['Salad', 'cold', 1],
};
export const HOLD = 2;
export const SIT_WEIGHT = 2;

const LISTS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
// The dishes of a service in ticket order: [{ t: ticket index, k: menu key }]
export function dishList(P) {
  let L = LISTS && LISTS.get(P);
  if (!L) {
    L = [];
    P.tickets.forEach((t, ti) => t.dishes.forEach((k) => L.push({ t: ti, k })));
    if (LISTS) LISTS.set(P, L);
  }
  return L;
}
export function newState(P) {
  return { m: 0, wait: 0, sit: 0, re: 0,
    d: dishList(P).map(() => ({ st: 'todo', rem: 0, age: 0, at: -1, cold: 0 })),
    t: P.tickets.map(() => ({ out: -1, sat: 0 })) };
}
export const cloneState = (s) => ({ ...s, d: s.d.map((x) => ({ ...x })), t: s.t.map((x) => ({ ...x })) });
export const isOpen = (P, s, ti) => P.tickets[ti].at <= s.m && s.t[ti].out < 0;
export function used(P, s, station) {
  const L = dishList(P); let n = 0;
  for (let i = 0; i < L.length; i++) if (s.d[i].st === 'cook' && MENU[L[i].k][1] === station) n++;
  return n;
}
export function canStart(P, s, i) {
  const L = dishList(P), st = MENU[L[i].k][1];
  return s.d[i].st === 'todo' && isOpen(P, s, L[i].t) && used(P, s, st) < P.caps[st];
}
export function start(P, s, i) {
  if (!canStart(P, s, i)) return false;
  const d = s.d[i]; d.st = 'cook'; d.rem = MENU[dishList(P)[i].k][2]; d.at = s.m;
  return true;
}
// A dish fired this minute can come back off; once the clock moves it is committed.
export function unstart(P, s, i) {
  const d = s.d[i];
  if (d.st !== 'cook' || d.at !== s.m) return false;
  d.st = 'todo'; d.rem = 0; d.at = -1;
  return true;
}
export function hasTray(P, s, ti) {
  if (!isOpen(P, s, ti)) return false;
  const L = dishList(P);
  for (let i = 0; i < L.length; i++) if (L[i].t === ti && s.d[i].st === 'todo') return false;
  return true;
}
// Put a waiting dish on its tray. Returns false (no tray yet), true, or 'out'
// when that filled the tray and the order left.
export function plate(P, s, i) {
  const L = dishList(P), ti = L[i].t;
  if (s.d[i].st !== 'pass' || !hasTray(P, s, ti)) return false;
  s.d[i].st = 'tray';
  const mine = [];
  for (let j = 0; j < L.length; j++) if (L[j].t === ti) mine.push(j);
  if (!mine.every((j) => s.d[j].st === 'tray')) return true;
  const T = s.t[ti];
  T.out = s.m; s.wait += s.m - P.tickets[ti].at;
  for (const j of mine) { s.d[j].st = 'out'; s.sit += s.d[j].age; T.sat += s.d[j].age; }
  return 'out';
}
export function autoPlate(P, s) { for (let i = 0; i < s.d.length; i++) if (s.d[i].st === 'pass') plate(P, s, i); }
// One minute. Returns what happened: dishes ready, dishes gone cold, tickets printed.
export function tick(P, s) {
  const ev = { ready: [], cold: [], printed: [] };
  for (let i = 0; i < s.d.length; i++) {
    const d = s.d[i];
    if (d.st === 'cook') { d.rem--; if (d.rem === 0) { d.st = 'pass'; d.age = 0; d.cold = 0; ev.ready.push(i); } }
    else if (d.st === 'pass' || d.st === 'tray') d.age++;
  }
  s.m++;
  P.tickets.forEach((t, ti) => { if (t.at === s.m) ev.printed.push(ti); });
  const L = dishList(P);
  for (let i = 0; i < s.d.length; i++) {
    const d = s.d[i];
    if ((d.st === 'pass' || d.st === 'tray') && d.age > HOLD) {
      d.st = 'todo'; d.cold = 1; s.re++; s.sit += d.age; s.t[L[i].t].sat += d.age; ev.cold.push(i);
    }
  }
  return ev;
}
export const isDone = (s) => s.t.every((t) => t.out >= 0);
export const penalty = (s) => s.wait + SIT_WEIGHT * s.sit;
// Minutes sitting right now, counting plates still waiting.
export const sitNow = (s) => s.sit + s.d.reduce((n, d) => n + (d.st === 'pass' || d.st === 'tray' ? d.age : 0), 0);
export const waitNow = (P, s) => s.wait + P.tickets.reduce((n, t, ti) => n + (t.at <= s.m && s.t[ti].out < 0 ? s.m - t.at : 0), 0);

// CAN ONE TICKET GO OUT HOT AT ALL? Two dishes that share a single-slot
// station finish at least the second one's cook time apart, and the first only
// keeps HOLD minutes: a steak and a burger on one grill can never leave
// together. The generator and the checker both refuse a ticket that cannot be
// served, alone in an empty kitchen, without a dish going cold.
export function ticketFeasible(caps, dishes) {
  const P = { caps, tickets: [{ at: 0, dishes }] };
  const seen = new Set();
  let front = [newState(P)];
  for (let step = 0; step < 24 && front.length; step++) {
    const next = [];
    for (const g of front) {
      const todo = []; g.d.forEach((d, i) => { if (d.st === 'todo') todo.push(i); });
      for (let mask = 0; mask < (1 << todo.length); mask++) {
        const n = cloneState(g); let ok = true;
        todo.forEach((i, b) => { if (mask & (1 << b)) ok = start(P, n, i) && ok; });
        if (!ok) continue;
        tick(P, n); autoPlate(P, n);
        if (n.re) continue;
        if (isDone(n)) return true;
        const key = n.d.map((d) => d.st.slice(0, 2) + d.rem + d.age).join('');
        if (!seen.has(key)) { seen.add(key); next.push(n); }
      }
    }
    front = next;
  }
  return false;
}

// Replay a stored route (one list of dish indexes fired per minute, every
// ready plate trayed at once) and return the final state.
export function replay(P, route) {
  const s = newState(P);
  for (const step of route) {
    for (const i of step) if (!start(P, s, i)) return null;
    tick(P, s); autoPlate(P, s);
  }
  return s;
}

// THE KITCHEN LADDER (owner: "a scored scale at the end, famous chefs at the
// top"). Rungs are set against the board's stored best, top first. The names at
// the top are late legends of the kitchen.
export const LADDER = [['Auguste Escoffier', 1], ['Julia Child', 1.05], ['Paul Bocuse', 1.12], ['Executive Chef', 1.2], ['Sous Chef', 1.35], ['Line Cook', 1.5], ['Prep Cook', 1.75], ['Dishwasher', Infinity]];
// The rungs for one board: [{ name, hi, label }], a rung dropped when its range is empty.
export function rungs(P) {
  const rows = []; let prev = 0;
  LADDER.forEach(([name, f], i) => {
    const hi = f === Infinity ? Infinity : Math.floor(P.best * f);
    if (i > 0 && hi !== Infinity && hi <= prev) return;
    const label = i === 0 ? `${hi} or under` : hi === Infinity ? `${prev + 1} and over` : prev + 1 === hi ? String(hi) : `${prev + 1} to ${hi}`;
    rows.push({ name, hi, label });
    if (hi !== Infinity) prev = hi;
  });
  return rows;
}
export function rankOf(P, pts) { const R = rungs(P); const i = R.findIndex((r) => pts <= r.hi); return { rows: R, at: i < 0 ? R.length - 1 : i }; }
