// lib/chef-art.js: the drawings for Chef (owner, 2026-11-13: "make it look
// like a kitchen", and "what if the elements were our different pastels").
// Plain SVG strings, shared by the board (app/chef/ChefClient.jsx) and the
// share card (scripts/bake-chef-og.mjs).
//
// EACH STATION WEARS ITS OWN SITE PASTEL, and the colour follows the dish: the
// chip on the ticket line, the hot part of the appliance, the food on the
// plate, the line on the tray. The steps are CATEGORY_RAMP's (lib/category-ramp.js)
// and go through the site-pastel rule: mixed 60/40 with white on the light
// page, the raw step on the dark page, dark ink on both.
const RAMP = { stove: '#fb923c', oven: '#e8b43a', grill: '#c084fc', fryer: '#bef264', cold: '#7dd3fc', lamp: '#fbbf24', acc: '#fb7185' };
const soft = (hex) => `color-mix(in srgb, ${hex} 60%, #ffffff)`;
const vars = (f) => Object.entries(RAMP).map(([k, v]) => `--ck-${k}:${f(v)};`).join('');
export const CHEF_LIGHT = `--ck-bg:#ffffff;--ck-ink:#141414;--ck-mute:#6b6b6b;--ck-grey:#f1f1ef;--ck-grey2:#e3e3df;--ck-tile:#ffffff;--ck-tile2:#f1f1ef;${vars(soft)}`;
export const CHEF_DARK = `--ck-bg:#161616;--ck-ink:#f2f2ee;--ck-mute:#a3a39d;--ck-grey:#232323;--ck-grey2:#333333;--ck-tile:#f2f2ee;--ck-tile2:#d9d9d4;${vars((v) => v)}`;
// Plain hexes of the light pastels, for the share card (no color-mix needed there).
export const CHEF_HEX = Object.fromEntries(Object.entries(RAMP).map(([k, v]) => [k, '#' + [1, 3, 5].map((i) => Math.round(parseInt(v.slice(i, i + 2), 16) * 0.6 + 255 * 0.4).toString(16).padStart(2, '0')).join('')]));

// l line, b paper, g grey, a the station's pastel, i ink
export const CHEF_ART_CSS = `
.ck-l{fill:none;stroke:var(--ck-ln,var(--ck-ink));stroke-width:1;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round;}
.ck-b{fill:var(--ck-pb,var(--ck-bg));}.ck-g{fill:var(--ck-pg,var(--ck-grey));}.ck-a{fill:var(--ck-st,var(--ck-acc));}.ck-i{fill:var(--ck-ln,var(--ck-ink));}
`;
const sv = (b) => `<svg class="ck-art" viewBox="0 0 100 62" aria-hidden="true">${b}</svg>`;
// One slot of each station, idle or cooking.
export const ART = {
  stove: (on) => sv(`<rect class="ck-l ck-g" x="6" y="4" width="88" height="54" rx="6"/>${on ? '<circle class="ck-a" cx="46" cy="31" r="25"/>' : ''}<circle class="ck-l" cx="46" cy="31" r="22"/><circle class="ck-l" cx="46" cy="31" r="13"/><path class="ck-l" d="M46 5v8M46 49v8M20 31h8M64 31h8"/>${on ? '<circle class="ck-l ck-b" cx="46" cy="31" r="18"/><circle class="ck-l" cx="46" cy="31" r="13"/><rect class="ck-l ck-i" x="63" y="28" width="30" height="6" rx="3"/>' : ''}<circle class="ck-l ck-b" cx="86" cy="52" r="3"/>`),
  oven: (on) => sv(`<rect class="ck-l ck-b" x="10" y="3" width="80" height="56" rx="5"/><path class="ck-l" d="M10 15h80"/><circle class="ck-l ${on ? 'ck-i' : 'ck-b'}" cx="22" cy="9" r="2.5"/><circle class="ck-l ck-b" cx="32" cy="9" r="2.5"/><circle class="ck-l ck-b" cx="42" cy="9" r="2.5"/><path class="ck-l" d="M24 21h52" style="stroke-width:3"/><rect class="ck-l ${on ? 'ck-a' : 'ck-g'}" x="20" y="27" width="60" height="26" rx="3"/>${on ? '<path class="ck-l" d="M24 46h52"/><path class="ck-l ck-b" d="M34 46c0-9 32-9 32 0z"/>' : '<path class="ck-l" d="M24 40h52"/>'}`),
  grill: (on) => sv(`<rect class="ck-l ${on ? 'ck-a' : 'ck-g'}" x="8" y="8" width="84" height="46" rx="5"/>${[18, 28, 38, 48, 58, 68, 78].map((x) => `<path class="ck-l" d="M${x} 8v46"/>`).join('')}${on ? '<ellipse class="ck-l ck-b" cx="50" cy="31" rx="26" ry="15"/><path class="ck-l" d="M36 37l12-12M46 39l12-12M56 37l8-8"/>' : ''}<path class="ck-l" d="M2 31h6M92 31h6"/>`),
  fryer: (on) => sv(`<rect class="ck-l ck-g" x="12" y="6" width="76" height="52" rx="5"/><rect class="ck-l ${on ? 'ck-a' : 'ck-b'}" x="20" y="14" width="60" height="36" rx="3"/>${on ? '<rect class="ck-l ck-b" x="28" y="20" width="38" height="24" rx="2"/><path class="ck-l" d="M37 20v24M47 20v24M57 20v24M28 28h38M28 36h38M66 32h30"/><circle class="ck-l" cx="73" cy="20" r="2"/><circle class="ck-l" cx="24" cy="44" r="1.5"/><circle class="ck-l" cx="74" cy="43" r="2.5"/>' : '<path class="ck-l" d="M24 32c5-4 9 4 14 0s9 4 14 0 9 4 14 0 6 2 10 0"/>'}`),
  cold: (on) => sv(`<rect class="ck-l ck-b" x="10" y="10" width="80" height="44" rx="7"/><circle class="ck-l" cx="19" cy="19" r="2.5"/>${on ? '<circle class="ck-l ck-g" cx="50" cy="32" r="18"/><circle class="ck-l ck-a" cx="50" cy="32" r="12"/><path class="ck-l" d="M44 30l5 4M52 27l4 6M46 37l8-2"/>' : '<path class="ck-l" d="M30 44l34-22M64 22l8-3-3 8"/>'}`),
};
const ic = (b) => `<svg class="ck-ico" viewBox="0 0 14 14" aria-hidden="true">${b}</svg>`;
export const ICO = {
  stove: ic('<circle class="ck-l" cx="7" cy="7" r="6"/><circle class="ck-l" cx="7" cy="7" r="2.5"/>'),
  oven: ic('<rect class="ck-l" x="1" y="1" width="12" height="12" rx="2"/><rect class="ck-l" x="3.5" y="5.5" width="7" height="5"/>'),
  grill: ic('<rect class="ck-l" x="1" y="2" width="12" height="10" rx="2"/><path class="ck-l" d="M4.5 2v10M7 2v10M9.5 2v10"/>'),
  fryer: ic('<path class="ck-l" d="M2 4h8v7H2zM10 6h3M5 4v7M7.5 4v7"/>'),
  cold: ic('<path class="ck-l" d="M7 1v12M1.8 4l10.4 6M12.2 4L1.8 10"/>'),
};
export const LAMP = (on) => `<svg viewBox="0 0 44 30" aria-hidden="true"><path class="ck-l" d="M22 0v10"/><path class="ck-l ${on ? 'ck-a' : 'ck-b'}" d="M14 10h16l6 12H8z"/>${on ? '<path class="ck-l" d="M14 26l-2 3M22 26v3M30 26l2 3"/>' : ''}</svg>`;
export const PLATE = '<svg viewBox="0 0 40 26" aria-hidden="true"><ellipse class="ck-l ck-b" cx="20" cy="15" rx="19" ry="9"/><ellipse class="ck-l ck-a" cx="20" cy="13" rx="11" ry="5"/></svg>';
export const HAT = '<svg class="ck-hat" viewBox="0 0 64 56" aria-hidden="true"><path class="ck-l ck-b" d="M16 34C6 34 4 20 14 17 14 7 28 4 32 11 36 4 50 7 50 17 60 20 58 34 48 34V46H16z"/><path class="ck-l" d="M16 40h32M26 34v-8M38 34v-8"/><rect class="ck-l ck-b" x="14" y="46" width="36" height="7" rx="2"/></svg>';
