// lib/plow-art.js: how a Plow town is drawn, as SVG strings. Shared by the board
// (app/plow/PlowClient.jsx) and the hand-built share card (scripts/bake-plow-og.mjs).
// The board stacks two svgs with one viewBox: the TOWN (everything that never
// changes: snow, river, houses, trees, the depot and the barn, the snowed-in
// streets) painted once, and above it a light layer the board redraws as the
// truck moves (plowed asphalt, the truck, lamp glow). Houses never stand on a
// road, so the plowed layer can sit over them.
//
// Houses, cars and trees are placed at draw time by a seeded walk along every
// street (T.seed), so the bank stores only the streets and the hand-placed
// `deco` (parks, the school, the church ...), never thousands of trees.
import { COURT_STEM, COURT_R, add, sub, mul, len, norm, perp, pointAt, polyDist, pathD, riverY, courtCentre } from './plow-engine.js';

export const PLOW_LIGHT = '--pl-ground:#e9eff5;--pl-casing:#c8d3df;--pl-snow:#fbfdff;--pl-rut:#e4eaf1;--pl-asph:#5b626d;--pl-line:#e7bd4f;--pl-label:#7d8a9b;--pl-bank:#d7e1ec;--pl-ice:#d3e6f4;--pl-water:#86afd0;--pl-floe:#f4f9fd;--pl-island:#e6edf4;--pl-rail:#8d97a5;--pl-hood:#9aa7b8;--pl-flash:#f4a3b4;--pl-ink:#15171c;--pl-glow:0;--pl-dim:1;--pl-flake:#ffffff;';
export const PLOW_DARK = '--pl-ground:#3a465a;--pl-casing:#2c3647;--pl-snow:#56657d;--pl-rut:#4d5b72;--pl-asph:#1d222b;--pl-line:#c99a2e;--pl-label:#9fb0c7;--pl-bank:#33405a;--pl-ice:#4a5f7c;--pl-water:#1d3049;--pl-floe:#6a7f9c;--pl-island:#45526a;--pl-rail:#7b879b;--pl-hood:#7d8ba1;--pl-flash:#be3455;--pl-ink:#eef1f6;--pl-glow:1;--pl-dim:.62;--pl-flake:#dfe8f5;';

export const PLOW_ART_CSS = `
.plow .g-ground{fill:var(--pl-ground)}
.plow .g-casing{stroke:var(--pl-casing);fill:none;stroke-linecap:round;stroke-linejoin:round}
.plow .g-snow{stroke:var(--pl-snow);fill:none;stroke-linecap:round;stroke-linejoin:round}
.plow .g-snowf{fill:var(--pl-snow)}
.plow .g-casingf{fill:var(--pl-casing)}
.plow .g-rut{stroke:var(--pl-rut);fill:none;stroke-linecap:round;stroke-linejoin:round}
.plow .g-asph{stroke:var(--pl-asph);fill:none;stroke-linecap:round;stroke-linejoin:round}
.plow .g-asphf{fill:var(--pl-asph)}
.plow .g-cl{stroke:var(--pl-line);fill:none;stroke-linecap:butt;stroke-linejoin:round}
.plow .g-island{fill:var(--pl-island)}
.plow .g-rail{stroke:var(--pl-rail);fill:none;stroke-linecap:round}
.plow .g-railf{fill:var(--pl-rail)}
.plow .g-bank{stroke:var(--pl-bank);fill:none;stroke-linejoin:round}
.plow .g-ice{stroke:var(--pl-ice);fill:none;stroke-linejoin:round}
.plow .g-water{stroke:var(--pl-water);fill:none;stroke-linejoin:round;stroke-linecap:round}
.plow .g-waterf{fill:var(--pl-water)}
.plow .g-floe{fill:var(--pl-floe)}
.plow .g-lab{fill:var(--pl-label);font-size:15px;font-weight:800;letter-spacing:.16em}
.plow .g-hood{fill:var(--pl-hood);font-size:21px;font-weight:800;letter-spacing:.32em;opacity:.75}
.plow .g-wlab{fill:#ffffff;font-size:17px;font-weight:800;letter-spacing:.32em;opacity:.9}
.plow .g-flash{stroke:var(--pl-flash);fill:none;stroke-linecap:round;stroke-linejoin:round;animation:pl-fl .65s steps(2,end)}
@keyframes pl-fl{0%,50%{opacity:1}25%,75%{opacity:.35}}
.plow .dim{filter:brightness(var(--pl-dim)) saturate(calc(.75 + .25 * var(--pl-dim)))}
.plow .night{opacity:var(--pl-glow)}
.plow .np{opacity:0;transition:opacity .15s}
.plow .np.on{opacity:1}
.plow .beacon{animation:pl-bc .9s infinite steps(1,end)}
.plow .beacon.b2{animation-delay:.45s}
@keyframes pl-bc{0%{opacity:1}50%{opacity:.15}}
.plow .spray{opacity:0;transition:opacity .15s}
.plow .moving .spray{opacity:1}
.plow .spray circle{animation:pl-puff .5s infinite ease-out}
.plow .spray circle:nth-child(2){animation-delay:.17s}.plow .spray circle:nth-child(3){animation-delay:.33s}
@keyframes pl-puff{0%{transform:translate(0,0) scale(.6);opacity:.95}100%{transform:translate(16px,10px) scale(1.5);opacity:0}}
@media (prefers-reduced-motion:reduce){.plow .beacon,.plow .spray circle{animation:none}}
`;

export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f1 = (v) => (+v).toFixed(1);

const ROOFS = ['#b4533f', '#4f6d8a', '#3f6f5a', '#7a5a43', '#5d5a7a', '#8a6a3c', '#2f4f6b', '#9b4a4a'];
const CARS = ['#c0392b', '#2e86c1', '#f2f2f2', '#2c3e50', '#16a085', '#d4ac0d', '#7f8c8d'];
export function pine(x, y, s, r) {
  const k = s / 20, pts = [], pts2 = [];
  for (let i = 0; i < 16; i++) { const a = (Math.PI * 2 * i) / 16 + r, rad = (i % 2 ? 11 : 20) * k; pts.push(`${f1(x + rad * Math.cos(a))},${f1(y + rad * Math.sin(a))}`); }
  for (let i = 0; i < 12; i++) { const a = (Math.PI * 2 * i) / 12 + r + 0.3, rad = (i % 2 ? 6 : 13) * k; pts2.push(`${f1(x + rad * Math.cos(a) - 1.5 * k)},${f1(y + rad * Math.sin(a) - 1.5 * k)}`); }
  return `<circle cx="${f1(x + 3 * k)}" cy="${f1(y + 4 * k)}" r="${f1(17 * k)}" fill="#0b1a2a" opacity=".12"/><polygon points="${pts.join(' ')}" fill="#2f5d4a"/><polygon points="${pts2.join(' ')}" fill="#f4f8fb" opacity=".92"/><circle cx="${f1(x - 1.5 * k)}" cy="${f1(y - 1.5 * k)}" r="${f1(3 * k)}" fill="#24493a"/>`;
}
export function bare(x, y, s, r) {
  const k = s / 20; let o = `<circle cx="${f1(x + 3 * k)}" cy="${f1(y + 4 * k)}" r="${f1(15 * k)}" fill="#0b1a2a" opacity=".1"/>`;
  for (let i = 0; i < 7; i++) {
    const a = (Math.PI * 2 * i) / 7 + r, l = (12 + (i % 3) * 3) * k, ex = x + l * Math.cos(a), ey = y + l * Math.sin(a);
    o += `<path d="M${f1(x)} ${f1(y)}L${f1(ex)} ${f1(ey)}" stroke="#6b5442" stroke-width="${f1(2.2 * k)}" stroke-linecap="round"/>`;
    o += `<path d="M${f1(x + l * 0.6 * Math.cos(a))} ${f1(y + l * 0.6 * Math.sin(a))}l${f1(5 * k * Math.cos(a + 0.7))} ${f1(5 * k * Math.sin(a + 0.7))}" stroke="#6b5442" stroke-width="${f1(1.3 * k)}" stroke-linecap="round"/>`;
    o += `<circle cx="${f1(ex)}" cy="${f1(ey)}" r="${f1(1.8 * k)}" fill="#f4f8fb"/>`;
  }
  return o + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 * k)}" fill="#5a4535"/>`;
}
function house(h) {
  const { x, y, ang, w, d, roof, chim } = h;
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})">`;
  o += `<rect x="${f1(-w / 2 + 3)}" y="${f1(-d / 2 + 4)}" width="${f1(w)}" height="${f1(d)}" rx="2" fill="#0b1a2a" opacity=".16"/>`;
  o += `<rect x="${f1(-w / 2)}" y="${f1(-d / 2)}" width="${f1(w)}" height="${f1(d)}" rx="2" fill="${roof}"/>`;
  o += `<rect x="${f1(-w / 2 + 2.6)}" y="${f1(-d / 2 + 2.6)}" width="${f1(w - 5.2)}" height="${f1(d / 2 - 2.6)}" fill="#f7fafc"/>`;
  o += `<rect x="${f1(-w / 2 + 2.6)}" y="0" width="${f1(w - 5.2)}" height="${f1(d / 2 - 2.6)}" fill="#dce5ef"/>`;
  o += `<path d="M${f1(-w / 2 + 2.6)} 0H${f1(w / 2 - 2.6)}" stroke="${roof}" stroke-width="1.6"/>`;
  if (chim) o += `<rect x="${f1(w / 4 - 3)}" y="${f1(-d / 4 - 3)}" width="6" height="6" fill="#6b4c3b"/><rect x="${f1(w / 4 - 2)}" y="${f1(-d / 4 - 2)}" width="4" height="2" fill="#f7fafc"/>`;
  return o + '</g>';
}
function shop(h) {
  const { x, y, ang, w, d, roof, awn } = h;
  let o = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})">`;
  o += `<rect x="${f1(-w / 2 + 3)}" y="${f1(-d / 2 + 4)}" width="${w}" height="${d}" fill="#0b1a2a" opacity=".16"/>`;
  o += `<rect x="${-w / 2}" y="${-d / 2}" width="${w}" height="${d}" fill="${roof}"/>`;
  o += `<rect x="${-w / 2 + 3}" y="${-d / 2 + 3}" width="${w - 6}" height="${d - 9}" fill="#eef3f8"/>`;
  o += `<rect x="${-w / 2 + 6}" y="${-d / 2 + 7}" width="7" height="5" fill="#b8c2cf"/>`;
  o += `<rect x="${-w / 2 + 1}" y="${d / 2 - 5}" width="${w - 2}" height="6" fill="${awn}"/>`;
  return o + '</g>';
}
const car = (x, y, ang, col) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})"><rect x="-6" y="-10" width="12" height="20" rx="3.5" fill="${col}"/><rect x="-4.6" y="-5" width="9.2" height="9" rx="1.5" fill="#f7fafc"/><rect x="-4.6" y="-8.4" width="9.2" height="2.6" rx="1" fill="#2a3442"/></g>`;
export function label(t, x, y, ang, cls = 'g-lab', size) {
  if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
  return `<text class="${cls}" x="${f1(x)}" y="${f1(y)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${f1(ang)} ${f1(x)} ${f1(y)})"${size ? ` style="font-size:${size}px"` : ''}>${t}</text>`;
}
const snowman = (x, y) => `<g><circle cx="${x + 3}" cy="${y + 4}" r="11" fill="#0b1a2a" opacity=".12"/><circle cx="${x}" cy="${y}" r="10" fill="#ffffff" stroke="#cdd7e2"/><circle cx="${x - 2}" cy="${y - 2}" r="6.6" fill="#ffffff" stroke="#cdd7e2"/><circle cx="${x - 3.6}" cy="${y - 3.6}" r="4" fill="#ffffff" stroke="#cdd7e2"/><path d="M${x - 3.6} ${y - 3.6}l-5 -2" stroke="#e67e22" stroke-width="2.2" stroke-linecap="round"/><path d="M${x + 6} ${y - 6}l9 -7M${x - 9} ${y + 2}l-9 4" stroke="#6b5442" stroke-width="1.6" stroke-linecap="round"/><path d="M${x - 8} ${y - 1}l8 3" stroke="#c0392b" stroke-width="2.4" stroke-linecap="round"/></g>`;
const rink = (cx, cy, rx, ry) => `<ellipse cx="${cx + 3}" cy="${cy + 4}" rx="${rx + 4}" ry="${ry + 4}" fill="#0b1a2a" opacity=".1"/><ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="${ry + 4}" fill="#f7fafc" stroke="#a8bccf" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#cfe6f6"/><path d="M${f1(cx - rx * 0.6)} ${f1(cy - ry * 0.2)}q${f1(rx * 0.4)} ${f1(-ry * 0.5)} ${f1(rx * 0.8)} 0M${f1(cx - rx * 0.3)} ${f1(cy + ry * 0.35)}q${f1(rx * 0.5)} ${f1(ry * 0.3)} ${f1(rx * 0.9)} ${f1(-ry * 0.2)}M${f1(cx - rx * 0.75)} ${f1(cy + ry * 0.1)}q${f1(rx * 0.2)} ${f1(ry * 0.4)} ${f1(rx * 0.5)} ${f1(ry * 0.3)}" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".9"/><circle cx="${f1(cx - rx * 0.3)}" cy="${f1(cy - ry * 0.15)}" r="3" fill="#c0392b"/><circle cx="${f1(cx + rx * 0.35)}" cy="${f1(cy + ry * 0.2)}" r="3" fill="#2e86c1"/><circle cx="${f1(cx + rx * 0.1)}" cy="${f1(cy - ry * 0.45)}" r="3" fill="#16a085"/>`;
const bldg = (x, y, w, h, roof, lab, size = 12) => `<rect x="${x + 4}" y="${y + 5}" width="${w}" height="${h}" rx="3" fill="#0b1a2a" opacity=".16"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${roof}"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="2" fill="#eef3f8"/>${lab ? label(lab, x + w / 2, y + h / 2, 0, 'g-lab', size) : ''}`;
function church(x, y) {
  return `<g transform="translate(${x} ${y})"><rect x="-22" y="-52" width="44" height="104" rx="2" fill="#0b1a2a" opacity=".16" transform="translate(4 5)"/><rect x="-22" y="-52" width="44" height="104" rx="2" fill="#8a4b3c"/><rect x="-50" y="-16" width="100" height="34" rx="2" fill="#8a4b3c"/><rect x="-19" y="-49" width="17" height="98" fill="#f7fafc"/><rect x="2" y="-49" width="17" height="98" fill="#dce5ef"/><rect x="-47" y="-13" width="45" height="13" fill="#f7fafc"/><rect x="-47" y="0" width="45" height="15" fill="#dce5ef"/><rect x="2" y="-13" width="45" height="13" fill="#f7fafc"/><rect x="2" y="0" width="45" height="15" fill="#dce5ef"/><rect x="-10" y="38" width="20" height="20" fill="#5a3a30"/><path d="M-10 38L10 58M10 38L-10 58" stroke="#3f2a22" stroke-width="1.5"/></g>`;
}

// The hand-placed pieces of a town: parks, the school, the church. Each is
// [kind, ...numbers]; kinds the art does not know are skipped.
function deco(d) {
  const [k, a, b, c, e, g, h] = d;
  switch (k) {
    case 'hill': return `<ellipse cx="${a}" cy="${b}" rx="${c}" ry="${e}" fill="url(#pl-hill)" opacity=".8"/>`;
    case 'track': return `<path d="${a}" stroke="#c9d6e3" stroke-width="2.3" fill="none"/>`;
    case 'sled': return `<rect x="${a - 3.5}" y="${b - 6}" width="7" height="12" rx="2" fill="${c}" transform="rotate(${e || 0} ${a} ${b})"/>`;
    case 'rink': return rink(a, b, c, e);
    case 'snowman': return snowman(a, b);
    case 'bench': return `<rect x="${a}" y="${b}" width="${c}" height="${e}" rx="2" fill="#7a5a43"/>`;
    case 'pine': return pine(a, b, c, e || 0);
    case 'bare': return bare(a, b, c, e || 0);
    case 'bldg': return bldg(a, b, c, e, g, h);
    case 'field': return `<rect x="${a}" y="${b}" width="${c}" height="${e}" rx="8" fill="#f7fafc" stroke="#c8d3df" stroke-width="3"/><path d="M${a} ${b + e / 2}H${a + c}" stroke="#c8d3df" stroke-width="2"/><circle cx="${a + c / 2}" cy="${b + e / 2}" r="${Math.min(c, e) * 0.14}" fill="none" stroke="#c8d3df" stroke-width="2"/>`;
    case 'plaza': return `<rect x="${a}" y="${b}" width="${c}" height="${e}" rx="6" fill="#f7fafc" stroke="#c8d3df" stroke-width="2"/>`;
    case 'cupola': return `<circle cx="${a}" cy="${b}" r="12" fill="#c9a86a"/><circle cx="${a}" cy="${b}" r="7" fill="#f7fafc"/>`;
    case 'church': return church(a, b);
    case 'wheel': return `<circle cx="${a}" cy="${b}" r="16" fill="#6b5442"/><circle cx="${a}" cy="${b}" r="11" class="g-waterf"/><path d="M${a - 11} ${b}H${a + 11}M${a} ${b - 11}V${b + 11}M${a - 8} ${b - 8}L${a + 8} ${b + 8}M${a + 8} ${b - 8}L${a - 8} ${b + 8}" stroke="#6b5442" stroke-width="2.4"/>`;
    case 'label': return label(b, a[0], a[1], 0, 'g-lab', c || 11);
    default: return '';
  }
}

// The truck, from above, facing up (north); the blade leads.
export const TRUCK = `<g class="night"><path d="M-10 -38L-46 -170L46 -170L10 -38Z" fill="url(#pl-beam)"/></g>
<rect x="-13" y="-22" width="30" height="52" rx="5" fill="#0b1a2a" opacity=".22" transform="translate(2 3)"/>
<path d="M-14 -40L-6 -30M14 -40L6 -30" stroke="#3b3f46" stroke-width="3"/>
<path d="M-27 -45L27 -37L27 -32L-27 -40Z" fill="#f2c94c" stroke="#2b2b2b" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M-27 -40L27 -32" stroke="#2b2b2b" stroke-width="2"/>
<rect x="-13" y="-6" width="26" height="33" rx="3" fill="#6f7987"/>
<rect x="-10" y="-3" width="20" height="25" rx="2" fill="#e6e1d6"/>
<circle cx="-4" cy="5" r="1.4" fill="#b9b2a3"/><circle cx="4" cy="12" r="1.4" fill="#b9b2a3"/><circle cx="-2" cy="17" r="1.4" fill="#b9b2a3"/><circle cx="5" cy="2" r="1.2" fill="#b9b2a3"/>
<circle cx="0" cy="30" r="4.2" fill="#3b3f46"/>
<rect x="-14" y="-27" width="28" height="22" rx="4.5" fill="#ee7d22"/>
<rect x="-11" y="-25" width="22" height="6" rx="2" fill="#26313f"/>
<rect x="-17" y="-20" width="3" height="5" rx="1" fill="#26313f"/><rect x="14" y="-20" width="3" height="5" rx="1" fill="#26313f"/>
<rect x="-11" y="-15.5" width="22" height="4" rx="2" fill="#2b2b2b"/>
<circle class="beacon" cx="-7" cy="-13.5" r="2.4" fill="#ffb020"/><circle class="beacon b2" cx="7" cy="-13.5" r="2.4" fill="#ffb020"/>
<g class="spray"><circle cx="28" cy="-34" r="5" fill="#ffffff"/><circle cx="28" cy="-34" r="4" fill="#ffffff"/><circle cx="28" cy="-34" r="3.5" fill="#ffffff"/></g>`;

export const PLOW_DEFS = `<defs>
<pattern id="pl-tex" width="140" height="140" patternUnits="userSpaceOnUse"><ellipse cx="22" cy="30" rx="26" ry="9" fill="#7d93ad" opacity=".06"/><ellipse cx="96" cy="18" rx="18" ry="6" fill="#7d93ad" opacity=".05"/><ellipse cx="70" cy="86" rx="30" ry="10" fill="#7d93ad" opacity=".05"/><ellipse cx="120" cy="118" rx="16" ry="6" fill="#7d93ad" opacity=".06"/><ellipse cx="30" cy="112" rx="14" ry="5" fill="#ffffff" opacity=".35"/><ellipse cx="110" cy="66" rx="12" ry="4" fill="#ffffff" opacity=".35"/></pattern>
<radialGradient id="pl-lamp"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset=".45" stop-color="#ffc35a" stop-opacity=".18"/><stop offset="1" stop-color="#ffc35a" stop-opacity="0"/></radialGradient>
<radialGradient id="pl-win"><stop offset="0" stop-color="#ffcf7d" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf7d" stop-opacity="0"/></radialGradient>
<linearGradient id="pl-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff3c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient>
<radialGradient id="pl-dome" cx=".42" cy=".38"><stop offset="0" stop-color="#e9e2d2"/><stop offset=".7" stop-color="#b9ad95"/><stop offset="1" stop-color="#8f8470"/></radialGradient>
<radialGradient id="pl-hill" cx=".5" cy=".45"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbe5ef"/></radialGradient>
</defs>`;

// Where the depot and the barn stand, for the art and the generator alike.
export const depotAt = (T) => add(T.nodes[T.start], mul(T.startDir, 118));
export const barnAt = (T) => add(T.nodes[T.end], mul(T.endDir, 122));

// The town: { town } is the static svg body (draw it once), { lamps } the night
// glow for the light layer.
export function drawTown(T, M) {
  const R = T.river, rand = rng(T.seed || 1);
  const [vx, vy, vw, vh] = M.vb;
  const allPolys = M.E.map((e) => e.P).concat([M.apronS, M.apronE]);
  const roadDist = (q) => { let b = Infinity; for (const P of allPolys) b = Math.min(b, polyDist(q, P)); return b; };
  const inZone = (q, m = 0) => (T.zones || []).some((z) => q[0] > z[0] - m && q[0] < z[0] + z[2] + m && q[1] > z[1] - m && q[1] < z[1] + z[3] + m);
  const inShops = (q) => (T.shops || []).some((z) => q[0] > z[0] && q[0] < z[0] + z[2] && q[1] > z[1] && q[1] < z[1] + z[3]);
  const riverClear = (q, m) => !R || Math.abs(q[1] - riverY(q[0], R)) > R.hw + m;
  const inView = (q, m) => q[0] > vx + m && q[0] < vx + vw - m && q[1] > vy + m && q[1] < vy + vh - m;
  const depotC = depotAt(T), barnC = barnAt(T);
  const barnLab = add(barnC, [T.endDir[1] ? 76 : 0, T.endDir[0] ? 64 : 0]);
  const busy = [[depotC, 92], [barnC, 70], [barnLab, 40], [add(barnLab, [34, 0]), 26], [add(barnLab, [-34, 0]), 26]];
  const labelPts = [];
  const labels = (T.labels || []).map((L) => {
    const e = M.E[L.e]; if (!e) return null;
    const { p, dir } = pointAt(e.P, e.C, e.L * (L.at || 0.5)), n = perp(dir), c = add(p, mul(n, L.side * 30));
    for (let k = -2; k <= 2; k++) labelPts.push(add(c, mul(dir, k * L.t.length * 3.2)));
    return { t: L.t, c, ang: Math.atan2(dir[1], dir[0]) * 180 / Math.PI };
  }).filter(Boolean);
  (T.hoods || []).forEach((h) => { if (h.water) return; for (let k = -3; k <= 3; k++) labelPts.push([h.x + k * h.t.length * 4.2, h.y]); });
  const nearBusy = (q, m) => busy.some(([c, r]) => len(sub(q, c)) < r + m) || labelPts.some((c) => len(sub(q, c)) < 22 + m);

  const houses = [], trees = [], cars = [], drives = [], glows = [];
  const placed = [];
  const free = (q, r) => placed.every(([c, rr]) => len(sub(q, c)) > r + rr);
  M.E.forEach((e) => {
    if (e.court) {
      const C = courtCentre(T, e), back = Math.atan2(-e.court[1], -e.court[0]);
      for (let k = 0; k < 5; k++) {
        const a = back + Math.PI / 3 + (k * Math.PI * 2) / 7.5;
        const u = [Math.cos(a), Math.sin(a)], q = add(C, mul(u, COURT_R + 46));
        if (roadDist(q) < 34 || inZone(q) || !riverClear(q, 30) || !inView(q, 24) || nearBusy(q, 10) || !free(q, 22)) continue;
        houses.push({ x: q[0], y: q[1], ang: Math.atan2(u[1], u[0]) * 180 / Math.PI + 270, w: 34, d: 28, roof: ROOFS[(rand() * ROOFS.length) | 0], chim: rand() < 0.5 });
        placed.push([q, 21]);
        drives.push([add(C, mul(u, COURT_R + 14)), add(C, mul(u, COURT_R + 32))]);
        if (rand() < 0.45) glows.push(q);
      }
      return;
    }
    for (let s = 44; s < e.L - 40; s += 50) {
      for (const side of [-1, 1]) {
        const { p, dir } = pointAt(e.P, e.C, s + (rand() - 0.5) * 8), n = mul(perp(dir), side);
        const shopy = inShops(p);
        const q = add(p, mul(n, shopy ? 42 : 50 + rand() * 6));
        if (!inView(q, 18) || roadDist(q) < (shopy ? 30 : 35) || inZone(q) || !riverClear(q, 26) || nearBusy(q, 8) || !free(q, shopy ? 19 : 22)) continue;
        if (!shopy && rand() < 0.12) continue;
        const ang = Math.atan2(dir[1], dir[0]) * 180 / Math.PI + (side > 0 ? 180 : 0);
        if (shopy) {
          houses.push({ shop: 1, x: q[0], y: q[1], ang, w: 44, d: 34, roof: ['#7a8796', '#8b7a6b', '#6d7f73'][(rand() * 3) | 0], awn: ['#c0392b', '#2e86c1', '#16a085', '#d4ac0d', '#8e44ad'][(rand() * 5) | 0] });
          placed.push([q, 20]);
          if (rand() < 0.55) glows.push(q);
        } else {
          houses.push({ x: q[0], y: q[1], ang, w: 32 + rand() * 7, d: 26 + rand() * 5, roof: ROOFS[(rand() * ROOFS.length) | 0], chim: rand() < 0.55 });
          placed.push([q, 22]);
          if (rand() < 0.5) glows.push(q);
          if (rand() < 0.55) {
            const a = add(q, mul(n, -16)), dv = add(p, mul(n, 17)), lat = mul(dir, (rand() < 0.5 ? -1 : 1) * 10);
            drives.push([add(a, lat), add(dv, lat)]);
            if (rand() < 0.5) { const cp = add(add(a, mul(sub(dv, a), 0.5)), lat); cars.push(car(cp[0], cp[1], Math.atan2(n[1], n[0]) * 180 / Math.PI + 90, CARS[(rand() * CARS.length) | 0])); }
          }
        }
      }
    }
  });
  for (let gx = vx + 16; gx < vx + vw - 10; gx += 30) {
    for (let gy = vy + 16; gy < vy + vh - 10; gy += 30) {
      const q = [gx + (rand() - 0.5) * 20, gy + (rand() - 0.5) * 20];
      if (roadDist(q) < 30 || inZone(q, -4) || !riverClear(q, 18) || nearBusy(q, 0) || !free(q, 14)) continue;
      const outside = q[0] < M.X0 - 40 || q[1] < M.Y0 - 40 || q[0] > M.W + 40 || q[1] > M.H + 40;
      if (rand() > (outside ? 0.5 : 0.2)) continue;
      const s = 15 + rand() * 9;
      trees.push(rand() < 0.72 ? pine(q[0], q[1], s, rand() * 6) : bare(q[0], q[1], s, rand() * 6));
      placed.push([q, s * 0.55]);
    }
  }

  let o = PLOW_DEFS;
  o += `<rect class="g-ground" x="${vx}" y="${vy}" width="${vw}" height="${vh}"/><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="url(#pl-tex)"/>`;
  if (R) {
    const pts = []; for (let x = vx - 20; x <= vx + vw + 20; x += 16) pts.push([x, riverY(x, R)]);
    const d = pathD(pts);
    o += `<path class="g-bank" d="${d}" stroke-width="${R.hw * 2 + 18}"/><path class="g-ice" d="${d}" stroke-width="${R.hw * 2}"/>`;
    const p2 = []; for (let x = vx - 20; x <= vx + vw + 20; x += 16) p2.push([x, riverY(x, R) + 6 * Math.sin(x / 90)]);
    o += `<path class="g-water" d="${pathD(p2)}" stroke-width="${R.hw * 0.95}"/>`;
    for (let x = vx + 30; x < vx + vw; x += 46 + rand() * 50) {
      const cy = riverY(x, R) + (rand() - 0.5) * R.hw * 0.7, r = 5 + rand() * 9, fp = [];
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + rand() * 0.5, rr = r * (0.7 + rand() * 0.5); fp.push(`${f1(x + rr * Math.cos(a))},${f1(cy + rr * 0.6 * Math.sin(a))}`); }
      o += `<polygon class="g-floe" points="${fp.join(' ')}"/>`;
    }
  }
  o += `<g class="dim">${(T.deco || []).map(deco).join('')}</g>`;
  o += `<g>${drives.map(([a, b]) => `<path d="${pathD([a, b])}" stroke="var(--pl-casing)" stroke-width="11" stroke-linecap="square"/>`).join('')}</g>`;
  const ds = M.E.map((e) => pathD(e.P)), aprons = [pathD(M.apronS), pathD(M.apronE)];
  const courts = M.E.filter((e) => e.court).map((e) => courtCentre(T, e));
  o += `<g>${ds.concat(aprons).map((d) => `<path class="g-casing" d="${d}" stroke-width="40"/>`).join('')}${courts.map((C) => `<circle class="g-casingf" cx="${f1(C[0])}" cy="${f1(C[1])}" r="${COURT_R + 20}"/>`).join('')}</g>`;
  M.E.filter((e) => e.bridge && R).forEach((e) => {
    const A = e.P[0], B = e.P[e.P.length - 1], n = perp(norm(sub(B, A)));
    const y0 = R.y - R.hw - 18, y1 = R.y + R.hw + 18;
    const p0 = add(A, mul(sub(B, A), (y0 - A[1]) / (B[1] - A[1]))), p1 = add(A, mul(sub(B, A), (y1 - A[1]) / (B[1] - A[1])));
    o += `<path d="${pathD([add(p0, mul(n, 4)), add(p1, mul(n, 4))])}" stroke="#0b1a2a" opacity=".22" stroke-width="54"/>`;
    o += `<path class="g-rail" d="${pathD([p0, p1])}" stroke-width="50" style="stroke-linecap:butt"/><path class="g-casing" d="${pathD([p0, p1])}" stroke-width="44" style="stroke-linecap:butt"/>`;
    for (const sd of [-1, 1]) o += `<path class="g-rail" d="${pathD([add(p0, mul(n, sd * 23)), add(p1, mul(n, sd * 23))])}" stroke-width="3.5"/>`;
    for (const sd of [-1, 1]) for (const p of [p0, p1]) { const c = add(p, mul(n, sd * 23)); o += `<rect class="g-railf" x="${f1(c[0] - 4)}" y="${f1(c[1] - 4)}" width="8" height="8"/>`; }
  });
  o += `<g>${ds.concat(aprons).map((d) => `<path class="g-snow" d="${d}" stroke-width="33"/>`).join('')}${courts.map((C) => `<circle class="g-snowf" cx="${f1(C[0])}" cy="${f1(C[1])}" r="${COURT_R + 16.5}"/>`).join('')}`;
  Object.keys(M.inc).forEach((n) => { const p = T.nodes[n]; o += `<circle class="g-snowf" cx="${p[0]}" cy="${p[1]}" r="16.5"/>`; });
  o += `</g><g>${ds.map((d) => `<path class="g-rut" d="${d}" stroke-width="15"/><path class="g-snow" d="${d}" stroke-width="11.5"/>`).join('')}</g>`;
  o += `<g>${aprons.map((d) => `<path class="g-asph" d="${d}" stroke-width="23"/>`).join('')}</g>`;
  o += `<g class="night">${glows.map((q) => `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="42" fill="url(#pl-win)"/>`).join('')}</g>`;
  o += `<g class="dim">${houses.map((h) => (h.shop ? shop(h) : house(h))).join('')}${cars.join('')}${trees.join('')}${depotArt(T)}${barnArt(T)}</g>`;
  labels.forEach((L) => { o += label(L.t, L.c[0], L.c[1], L.ang); });
  M.E.filter((e) => e.court && e.name).forEach((e) => {
    const c = add(add(T.nodes[e.a], mul(e.court, COURT_STEM / 2)), mul(perp(e.court), 32));
    o += label(e.name, c[0], c[1], Math.atan2(e.court[1], e.court[0]) * 180 / Math.PI, 'g-lab', 12);
  });
  (T.hoods || []).forEach((h) => { o += `<text class="${h.water ? 'g-wlab' : 'g-hood'}" x="${h.x}" y="${h.y}" text-anchor="middle" dominant-baseline="middle"${h.s && !h.water ? ` style="font-size:${21 * h.s}px"` : ''}>${h.t}</text>`; });
  o += label('SALT BARN', barnLab[0], barnLab[1], 0, 'g-lab', 12);
  o += pill(add(M.apronS[0], mul(T.startDir, 44)), 'In') + pill(add(M.apronE[0], mul(T.endDir, 44)), 'Out');
  const lamps = Object.keys(M.inc).map((n) => { const p = T.nodes[n]; return `<circle cx="${p[0] + 20}" cy="${p[1] - 20}" r="64" fill="url(#pl-lamp)"/><circle cx="${p[0] + 20}" cy="${p[1] - 20}" r="3" fill="#ffe7a8"/>`; }).join('');
  const islands = courts.map((C) => `<circle class="g-island" cx="${f1(C[0])}" cy="${f1(C[1])}" r="${COURT_R - 11.5}"/>${pine(C[0], C[1], 11, 1)}`).join('');
  return { town: o, lamps, islands };
}
function pill(c, t) {
  const w = t === 'In' ? 44 : 54;
  return `<g transform="translate(${f1(c[0])} ${f1(c[1])})"><rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="11" fill="#15171c"/><text x="0" y="1" text-anchor="middle" dominant-baseline="middle" fill="#fff" style="font-size:12.5px;font-weight:800">${t}</text></g>`;
}
function depotArt(T) {
  const c = depotAt(T), ang = Math.atan2(T.startDir[1], T.startDir[0]) * 180 / Math.PI + 90;
  let o = `<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(ang)})">`;
  o += `<rect x="-76" y="-36" width="152" height="72" rx="3" fill="#0b1a2a" opacity=".18" transform="translate(4 5)"/>`;
  o += `<rect x="-76" y="-36" width="152" height="72" rx="3" fill="#4b5d73"/><rect x="-72" y="-32" width="144" height="31" fill="#f7fafc"/><rect x="-72" y="-1" width="144" height="33" fill="#dce5ef"/><path d="M-72 -1H72" stroke="#4b5d73" stroke-width="2"/>`;
  [-48, -16, 16, 48].forEach((x) => { o += `<rect x="${x - 12}" y="30" width="24" height="8" rx="1.5" fill="#e8892b"/>`; });
  o += `<g transform="translate(-95 6)"><rect x="-10" y="-17" width="20" height="34" rx="3" fill="#e8892b"/><rect x="-8" y="-15" width="16" height="9" rx="1.5" fill="#26313f"/><rect x="-14" y="-24" width="28" height="5" rx="1.5" fill="#f2c94c"/></g>`;
  o += `<text x="0" y="-12" text-anchor="middle" dominant-baseline="middle" style="font-size:12px;font-weight:800;letter-spacing:.14em" fill="#5d6d80">PUBLIC WORKS</text>`;
  return o + '</g>';
}
function barnArt(T) {
  const c = barnAt(T), ang = Math.atan2(T.endDir[1], T.endDir[0]) * 180 / Math.PI + 90;
  let o = `<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${f1(ang)})"><circle cx="4" cy="5" r="44" fill="#0b1a2a" opacity=".18"/><circle r="44" fill="url(#pl-dome)"/>`;
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; o += `<path d="M${f1(12 * Math.cos(a))} ${f1(12 * Math.sin(a))}L${f1(43 * Math.cos(a))} ${f1(43 * Math.sin(a))}" stroke="#8f8470" stroke-width="1.2" opacity=".55"/>`; }
  o += `<path d="M-30 -14A34 34 0 0 1 30 -14" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity=".85"/><rect x="-14" y="34" width="28" height="16" rx="2" fill="#6b5d48"/><circle r="12" fill="#cfc5b0"/>`;
  return o + '</g>';
}
