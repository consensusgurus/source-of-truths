// COURT COLOURS FOR JESTERS AND JUDGES (owner, 2026-10-26, from the pastel
// courts canvas). Three rules the plain `regionStyle(id)` could not keep:
//
//  1. Courts that touch never share a colour. The colour is picked per board
//     by a greedy colouring over the court adjacency graph, not by court
//     number, so two neighbours can never land on the same or a twin hue.
//  2. No lime. Lime is the Logic category's own colour, so on the Color look
//     a lime court sat on a lime page and all but vanished. No periwinkle
//     either (see SLOTS).
//  3. The White and Black looks draw the courts in GREYS, eight light greys on
//     White and eight dark slate greys on Black. Each colour slot has its own
//     grey, so touching courts still differ when the colour is gone. The
//     greys ride on two custom properties the page's look rules pick up
//     (see the COURT GREYS block in app/globals.css).
//
// Deterministic: the same board always gets the same colours, on every device.

import { regionStyle, REGION_RAMP } from './category-ramp';

// REGION_RAMP indices allowed on a court. Lime is left out (above), and so is
// periwinkle: the pastel looks repaint any periwinkle region as gold
// (app/globals.css, the '#a5b4fc var(--stg-dk' rule), so a periwinkle court
// could turn up gold beside a real gold one.
const SLOTS = REGION_RAMP.map((_, i) => i).filter((i) => !['lime', 'periwinkle'].includes(REGION_RAMP[i].name));

// Near-twin hues count as one colour when checking neighbours: gold, orange
// and amber sit within 25 degrees of each other.
const FAMILY = { gold: 'warm', orange: 'warm', amber: 'warm' };
const famOf = (p) => FAMILY[REGION_RAMP[SLOTS[p]].name] || REGION_RAMP[SLOTS[p]].name;

// One grey per allowed slot, in SLOTS order. Neighbouring slots in the list
// are far apart in value, so the greedy pick also spreads the greys.
const GREY_LIGHT = ['#d6d6d6', '#a8a8a8', '#ececec', '#bdbdbd', '#9a9a9a', '#e0e0e0', '#cbcbcb', '#f5f5f5'];
const GREY_DARK = ['#2a3140', '#4a5466', '#1c212b', '#3a4352', '#56617a', '#242a36', '#313a4a', '#151922'];

// regions: an N x N array of court ids. Returns { [id]: slotPosition }.
export function courtColors(regions) {
  const n = regions.length;
  const nb = new Map();
  const add = (a, b) => {
    if (a === b) return;
    if (!nb.has(a)) nb.set(a, new Set());
    if (!nb.has(b)) nb.set(b, new Set());
    nb.get(a).add(b); nb.get(b).add(a);
  };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const id = regions[r][c];
      if (!nb.has(id)) nb.set(id, new Set());
      // Corner contact counts too: a diagonal meeting reads as touching.
      if (c + 1 < n) add(id, regions[r][c + 1]);
      if (r + 1 < n) add(id, regions[r + 1][c]);
      if (r + 1 < n && c + 1 < n) add(id, regions[r + 1][c + 1]);
      if (r + 1 < n && c > 0) add(id, regions[r + 1][c - 1]);
    }
  }
  const ids = [...nb.keys()].sort((a, b) => (nb.get(b).size - nb.get(a).size) || (a - b));
  const out = {};
  const used = new Array(SLOTS.length).fill(0);
  for (const id of ids) {
    const taken = new Set([...nb.get(id)].filter((x) => x in out).map((x) => famOf(out[x])));
    let best = -1;
    for (let k = 0; k < SLOTS.length; k++) {
      // start from the court's own number so boards do not all open on sky
      const p = (k + id) % SLOTS.length;
      if (taken.has(famOf(p))) continue;
      if (best < 0 || used[p] < used[best]) best = p;
    }
    if (best < 0) best = id % SLOTS.length; // unreachable for a real board (eight slots)
    out[id] = best;
    used[best]++;
  }
  return out;
}

// The inline style for anything that wears court `id`: the hue (as
// regionStyle publishes it) plus the two greys for the White and Black looks.
export function courtStyle(map, id) {
  const p = map[id] ?? 0;
  return {
    ...regionStyle(SLOTS[p]),
    '--court-gl': GREY_LIGHT[p],
    '--court-gd': GREY_DARK[p],
  };
}
