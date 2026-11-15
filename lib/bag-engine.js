// lib/bag-engine.js: the model for Bag, the daily grocery-bagging puzzle. Shared
// by the client (app/bag/BagClient.jsx), the generator (scripts/gen-bag.mjs) and
// the checker (scripts/verify-bag.mjs).
//
// A board is a belt of items (in belt order) and a row of bags. Only the first
// `reach` items on the belt can be picked up. An item goes on TOP of a bag.
//   item  { n, w: pounds, c: how many pounds it takes on top (99 = anything),
//           cold?, hot?, chem? (a cleaning product), solo? (rides alone), k: its picture, hue }
//   bag   { slots, limit: pounds }
// The rules, in the order a refusal is reported:
//   full     the bag has no slot left
//   heavy    the bag would go over its limit
//   crush    something under it would carry more than it can take
//   cold     every cold thing shares one bag
//   hot      hot food never shares a bag with cold food (owner, 2026-11-14)
//   chem     cleaning products never share a bag with food
//   solo     a `solo` item has a bag to itself
// A state is { belt: [item index], bags: [[item index, bottom first]] }.

export const wt = (P, st) => st.reduce((a, i) => a + P.items[i].w, 0);

// Why item i cannot go on top of bag b: null, or { code, hit: the item at fault, text }.
export function why(P, bags, b, i) {
  const it = P.items[i], st = bags[b], cap = P.bags[b];
  if (st.length >= cap.slots) return { code: 'full', text: 'Full' };
  if (wt(P, st) + it.w > cap.limit) return { code: 'heavy', text: `Tears: ${wt(P, st) + it.w} lb` };
  let above = it.w;
  for (let k = st.length - 1; k >= 0; k--) { const u = P.items[st[k]]; if (above > u.c) return { code: 'crush', hit: st[k], text: `Crushes the ${u.n}` }; above += u.w; }
  if (it.cold) for (let j = 0; j < bags.length; j++) if (j !== b && bags[j].some((x) => P.items[x].cold)) return { code: 'cold', text: `Cold is in Bag ${j + 1}` };
  if (it.hot || it.cold) { const clash = st.find((x) => (it.hot ? P.items[x].cold : P.items[x].hot)); if (clash != null) return { code: 'hot', hit: clash, text: it.hot ? 'Not with cold food' : 'Not with hot food' }; }
  if (st.length && !!it.chem !== !!P.items[st[0]].chem) return { code: 'chem', hit: it.chem ? null : st[0], text: it.chem ? 'Not with food' : 'Cleaning bag' };
  if (st.length && (it.solo || P.items[st[0]].solo)) return { code: 'solo', hit: it.solo ? null : st[0], text: it.solo ? 'Needs its own bag' : `The ${P.items[st[0]].n} rides alone` };
  return null;
}

// How many more pounds a bag takes on top before something in it is crushed.
export function holds(P, st) {
  let m = 99, above = 0;
  for (let k = st.length - 1; k >= 0; k--) { const u = P.items[st[k]]; m = Math.min(m, u.c - above); above += u.w; }
  return m;
}

export const fresh = (P) => ({ belt: P.items.map((_, i) => i), bags: P.bags.map(() => []) });
// Is anything in reach able to go anywhere?
export const anyMove = (P, s) => s.belt.slice(0, P.reach).some((i) => s.bags.some((_, b) => !why(P, s.bags, b, i)));

// One way to bag everything with nothing coming back out: [[item, bag], ...] or null.
// `budget.n` counts states so a hopeless deal can be dropped.
export function solve(P, belt, bags, seen = new Set(), budget = { n: 60000 }) {
  if (!belt.length) return [];
  if (budget.n-- <= 0) return null;
  const key = belt.join() + '|' + bags.map((s, b) => `${P.bags[b].slots}.${P.bags[b].limit}:${s.join()}`).sort().join('/');
  if (seen.has(key)) return null;
  seen.add(key);
  for (let k = 0; k < Math.min(P.reach, belt.length); k++) {
    const i = belt[k]; let triedEmpty = false;
    for (let b = 0; b < bags.length; b++) {
      // two empty bags of the same size are the same move
      if (!bags[b].length) { const sig = `${P.bags[b].slots}.${P.bags[b].limit}`; if (triedEmpty === sig) continue; triedEmpty = sig; }
      if (why(P, bags, b, i)) continue;
      const nb = bags.map((s, j) => (j === b ? s.concat(i) : s));
      const r = solve(P, belt.slice(0, k).concat(belt.slice(k + 1)), nb, seen, budget);
      if (r) return [[i, b]].concat(r);
    }
  }
  return null;
}

// Play a stored answer through the rules. Returns the final bags, or null if any step is not allowed.
export function replay(P, sol) {
  const s = fresh(P);
  for (const [i, b] of sol) {
    const at = s.belt.indexOf(i);
    if (at < 0 || at >= P.reach || !s.bags[b] || why(P, s.bags, b, i)) return null;
    s.belt.splice(at, 1); s.bags[b].push(i);
  }
  return s.belt.length ? null : s.bags;
}

// ---- the Bagging Ladder ----
// Ranked on re-bags: every item taken back out of a bag. Cut on the number of
// items, the same shape as Pack's and Seated's ladders.
export const RUNGS = ['Bagger of the Year', 'Head Bagger', 'Courtesy Clerk', 'Steady Hands', 'Weekend Shift', 'Trainee', 'Bread on the Bottom', 'Crushed the Eggs'];
export function bounds(n) {
  const b = [0, 1];
  for (const f of [0.25, 0.5, 0.75, 1, 1.5]) b.push(Math.max(b[b.length - 1] + 1, Math.ceil(n * f)));
  return b;
}
export function rankOf(P, rb) {
  const b = bounds(P.items.length);
  let at = b.findIndex((x) => rb <= x); if (at < 0) at = RUNGS.length - 1;
  const rows = RUNGS.map((name, i) => {
    const lo = i === 0 ? 0 : b[i - 1] + 1, hi = i < b.length ? b[i] : null;
    return { name, label: hi == null ? `${lo} or more` : lo === hi ? (lo === 0 ? 'No re-bags' : `${lo}`) : `${lo} to ${hi}` };
  });
  return { rows, at };
}
