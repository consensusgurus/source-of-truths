// The flag round's drawing kit. A flag is built in three picks, and the first
// two are drawn here as SCHEMATICS: its palette, then its layout painted in
// that palette. Every layout takes any palette (colors repeat by index), so a
// wrong layout can be shown in the right colors. The third pick is the real
// flag, from public/passport/flags (flag-icons, MIT).
//
// Each layout returns SVG markup for a 30x20 viewBox.

const at = (p, i) => p[i % p.length];

export const FLAG_LAYOUTS = {
  h2: (p) => `<rect width="30" height="10" fill="${at(p, 0)}"/><rect y="10" width="30" height="10" fill="${at(p, 1)}"/>`,
  h3: (p) => `<rect width="30" height="6.67" fill="${at(p, 0)}"/><rect y="6.67" width="30" height="6.67" fill="${at(p, 1)}"/><rect y="13.33" width="30" height="6.67" fill="${at(p, 2)}"/>`,
  // Thailand's shape: thin, thin, a double middle, thin, thin.
  h5: (p) => { const u = 20 / 6; return `<rect width="30" height="20" fill="${at(p, 0)}"/><rect y="${u}" width="30" height="${4 * u}" fill="${at(p, 1)}"/><rect y="${2 * u}" width="30" height="${2 * u}" fill="${at(p, 2)}"/>`; },
  v3: (p) => `<rect width="10" height="20" fill="${at(p, 0)}"/><rect x="10" width="10" height="20" fill="${at(p, 1)}"/><rect x="20" width="10" height="20" fill="${at(p, 2)}"/>`,
  nordic: (p) => `<rect width="30" height="20" fill="${at(p, 0)}"/><path d="M11 0v20M0 10h30" stroke="${at(p, 1)}" stroke-width="5"/>${p.length > 2 ? `<path d="M11 0v20M0 10h30" stroke="${at(p, 2)}" stroke-width="2.4"/>` : ''}`,
  canton: (p) => `<rect width="30" height="20" fill="${at(p, 1)}"/>${[0, 2, 4, 6, 8].map((i) => `<rect y="${i * 2.22}" width="30" height="2.22" fill="${at(p, 0)}"/>`).join('')}<rect width="13" height="11.1" fill="${at(p, 2)}"/>`,
  canton2: (p) => `<rect width="30" height="10" fill="${at(p, 0)}"/><rect y="10" width="30" height="10" fill="${at(p, 1)}"/><rect width="10" height="10" fill="${at(p, 2)}"/><path d="M5 2.4l1.3 3.9h4.1l-3.3 2.4 1.3 3.9L5 10.2 1.6 12.6l1.3-3.9L-.4 6.3h4.1z" transform="translate(0 -1.2) scale(.95)" fill="${at(p, 0)}"/>`,
  field: (p) => `<rect width="30" height="20" fill="${at(p, 0)}"/><circle cx="12" cy="10" r="4.6" fill="${at(p, 1)}"/><circle cx="13.6" cy="10" r="3.7" fill="${at(p, 0)}"/><path d="M19 10l-3.1 1 1.9-2.6v3.2l-1.9-2.6z" fill="${at(p, 1)}"/>`,
  triangle: (p) => p.length > 3
    ? `<rect width="30" height="6.67" fill="${at(p, 0)}"/><rect y="6.67" width="30" height="6.67" fill="${at(p, 1)}"/><rect y="13.33" width="30" height="6.67" fill="${at(p, 2)}"/><path d="M0 0l14 10L0 20z" fill="${at(p, 3)}"/>`
    : `<rect width="30" height="10" fill="${at(p, 0)}"/><rect y="10" width="30" height="10" fill="${at(p, 1)}"/><path d="M0 0l14 10L0 20z" fill="${at(p, 2)}"/>`,
  hoist: (p) => `<rect width="30" height="6.67" fill="${at(p, 1)}"/><rect y="6.67" width="30" height="6.67" fill="${at(p, 2)}"/><rect y="13.33" width="30" height="6.67" fill="${at(p, 3)}"/><rect width="8" height="20" fill="${at(p, 0)}"/>`,
  union: (p) => `<rect width="30" height="20" fill="${at(p, 0)}"/><path d="M0 0l30 20M30 0L0 20" stroke="${at(p, 1)}" stroke-width="4"/><path d="M0 0l30 20M30 0L0 20" stroke="${at(p, 2)}" stroke-width="1.4"/><path d="M15 0v20M0 10h30" stroke="${at(p, 1)}" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="${at(p, 2)}" stroke-width="3.4"/>`,
  saltire: (p) => `<rect width="30" height="20" fill="${at(p, 2)}"/><path d="M0 0l15 10L0 20z M30 0L15 10l15 10z" fill="${at(p, 0)}"/><path d="M0 0l30 20M30 0L0 20" stroke="${at(p, 1)}" stroke-width="3.4"/>`,
  diagonal: (p) => `<path d="M0 0h30L0 20z" fill="${at(p, 0)}"/><path d="M30 0v20H0z" fill="${at(p, 3)}"/><path d="M0 20L30 0" stroke="${at(p, 1)}" stroke-width="7"/><path d="M0 20L30 0" stroke="${at(p, 2)}" stroke-width="4"/>`,
  banner: (p) => `<rect width="30" height="20" fill="${at(p, 0)}"/><rect x="1.4" y="1.4" width="3.2" height="17.2" fill="${at(p, 1)}"/><rect x="4.6" y="1.4" width="3.2" height="17.2" fill="${at(p, 2)}"/><rect x="9.2" y="1.4" width="19.4" height="17.2" fill="${at(p, 3)}"/>`,
};

export const LAYOUT_NAMES = {
  h2: 'Two bands', h3: 'Three bands', h5: 'Five stripes', v3: 'Three upright bands', nordic: 'Nordic cross',
  canton: 'Stripes and a corner', canton2: 'Two bands and a corner', field: 'One field and an emblem',
  triangle: 'Bands and a hoist triangle', hoist: 'Bands and a hoist bar', union: 'Crosses on crosses',
  saltire: 'Diagonal cross', diagonal: 'Diagonal band', banner: 'Bordered panels',
};

// The layouts a wrong pick may show, by how often flags use them.
const DECOY_LAYOUTS = ['h3', 'v3', 'nordic', 'canton', 'h2', 'triangle', 'field', 'saltire', 'diagonal', 'hoist'];

export function flagSvg(lay, pal, cls = '') {
  const draw = FLAG_LAYOUTS[lay] || FLAG_LAYOUTS.h3;
  return `<svg viewBox="0 0 30 20" class="${cls}" preserveAspectRatio="none" aria-hidden="true">${draw(pal)}<rect width="30" height="20" fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".4"/></svg>`;
}

// Named colors, so a palette can be read out ("Red · White · Blue").
const NAMED = [
  ['Black', [0, 0, 0]], ['White', [255, 255, 255]], ['Red', [210, 20, 30]], ['Maroon', [130, 25, 55]],
  ['Orange', [240, 125, 20]], ['Yellow', [252, 210, 10]], ['Green', [10, 125, 60]], ['Teal', [0, 85, 80]],
  ['Sky blue', [116, 172, 223]], ['Blue', [15, 80, 170]], ['Navy', [20, 30, 100]],
];
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function colorName(hex) {
  const [r, g, b] = rgb(hex);
  let best = NAMED[0], d = Infinity;
  for (const n of NAMED) { const e = (r - n[1][0]) ** 2 + (g - n[1][1]) ** 2 + (b - n[1][2]) ** 2; if (e < d) { d = e; best = n; } }
  return FAMILY[best[0]] || best[0];
}
// Shades a player would call by one name collapse to it, so a palette never
// sits beside a decoy that differs only by shade.
const FAMILY = { Navy: 'Blue', Teal: 'Green', Maroon: 'Red' };
const ORDER = ['Red', 'Orange', 'Yellow', 'Green', 'Sky blue', 'Blue', 'Black', 'White'];
const byOrder = (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b);
const HEX = Object.fromEntries(NAMED.map(([n, c]) => [n, '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')]));

// Deterministic shuffle so every player sees the same options in the same
// places, and a reload never reshuffles them.
function seeded(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
export function shuffle(arr, seed) {
  const out = arr.slice(); const r = seeded(seed);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

const PALETTES = [
  ['Red', 'White'], ['Red', 'White', 'Blue'], ['Green', 'White', 'Red'], ['Black', 'Red', 'Yellow'], ['Blue', 'Yellow'],
  ['Green', 'Yellow', 'Red'], ['Red', 'Yellow'], ['Blue', 'White'], ['Sky blue', 'White'], ['Green', 'White'],
  ['Black', 'White', 'Green', 'Red'], ['Orange', 'White', 'Green'], ['Blue', 'Red'], ['Green', 'Yellow', 'Blue'],
  ['Black', 'Yellow', 'Green'], ['Red', 'Black', 'White'], ['Blue', 'Yellow', 'Red'], ['Green', 'Red'],
];

// The three steps of a day's flag round: each a list of four options, one
// right, in a fixed order for that day.
export function flagSteps(flag, code, num) {
  const names = [...new Set(flag.pal.map(colorName))].sort(byOrder);
  const key = names.slice().sort().join('|');
  const cand = PALETTES.filter((p) => p.slice().sort().join('|') !== key);
  const share = cand.filter((p) => p.some((n) => names.includes(n)));
  const pick = shuffle(share.length >= 3 ? share : cand, num * 7 + 3).slice(0, 3).map((p) => p.slice().sort(byOrder));
  const pals = shuffle([{ ok: true, names }, ...pick.map((p) => ({ ok: false, names: p }))], num * 11 + 1)
    .map((o) => ({ ...o, label: o.names.join(' · '), svg: `<svg viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true">${o.names.map((n, i, a) => `<rect x="${(30 / a.length) * i}" width="${30 / a.length + 0.05}" height="20" fill="${o.ok ? flag.pal[flag.pal.map(colorName).indexOf(n)] : HEX[n]}"/>`).join('')}<rect width="30" height="20" fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".4"/></svg>` }));
  const lays = shuffle([flag.lay, ...shuffle(DECOY_LAYOUTS.filter((l) => l !== flag.lay), num * 13 + 5).slice(0, 3)], num * 17 + 2)
    .map((l) => ({ ok: l === flag.lay, label: LAYOUT_NAMES[l], svg: flagSvg(l, flag.pal) }));
  const real = shuffle([code, ...flag.also], num * 19 + 7)
    .map((c) => ({ ok: c === code, code: c, src: `/passport/flags/${c.toLowerCase()}.svg` }));
  return [
    { q: 'Pick its colors', opts: pals },
    { q: 'Pick its layout', opts: lays },
    { q: 'Now pick the real flag', opts: real },
  ];
}
