#!/usr/bin/env node
// Builds the Passport bank (owner, 2026-10-03) from scripts/passport-facts.mjs,
// the Factbook table in scripts/passport-factbook.mjs and Flank's border
// dataset. Writes app/passport/puzzles.js (the light index every daily
// consumer reads) and app/passport/days.js (each day's full content: photo,
// flag spec, answers, the five size comparisons and the map, which is
// projected here so the page never needs a map library).
//
// The map step needs three packages that are NOT site dependencies, so install
// them for the run only:
//
//   npm i --no-save d3-geo topojson-client world-atlas@2
//   node scripts/gen-passport.mjs
//   node scripts/verify-passport.mjs
//
// Deterministic: the same inputs always produce byte-identical files.

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { BORDERS } from '../app/flank/borders.js';
import { FACTBOOK } from './passport-factbook.mjs';
import { SCHEDULE, ACROSS, CAPITALS, CAPITAL_NAME, LANDMARKS, FLAGS } from './passport-facts.mjs';

const require = createRequire(import.meta.url);
const { feature } = require('topojson-client');
const { geoMercator, geoPath, geoBounds, geoArea } = require('d3-geo');
const atlasDir = path.dirname(require.resolve('world-atlas/package.json'));
const T50 = JSON.parse(fs.readFileSync(path.join(atlasDir, 'countries-50m.json')));
const T110 = JSON.parse(fs.readFileSync(path.join(atlasDir, 'countries-110m.json')));

// world-atlas ids are ISO numeric; map them to Flank's two-letter codes.
const NUM = {
  4: 'AF', 8: 'AL', 12: 'DZ', 20: 'AD', 24: 'AO', 28: 'AG', 32: 'AR', 51: 'AM', 36: 'AU', 40: 'AT',
  31: 'AZ', 48: 'BH', 50: 'BD', 52: 'BB', 112: 'BY', 56: 'BE', 84: 'BZ', 204: 'BJ', 64: 'BT', 68: 'BO',
  70: 'BA', 72: 'BW', 76: 'BR', 96: 'BN', 100: 'BG', 854: 'BF', 108: 'BI', 116: 'KH', 120: 'CM', 124: 'CA',
  132: 'CV', 140: 'CF', 148: 'TD', 152: 'CL', 156: 'CN', 170: 'CO', 174: 'KM', 188: 'CR', 191: 'HR', 192: 'CU',
  196: 'CY', 203: 'CZ', 208: 'DK', 262: 'DJ', 212: 'DM', 214: 'DO', 180: 'CD', 626: 'TL', 218: 'EC', 818: 'EG',
  222: 'SV', 226: 'GQ', 232: 'ER', 233: 'EE', 748: 'SZ', 231: 'ET', 242: 'FJ', 246: 'FI', 250: 'FR', 266: 'GA',
  268: 'GE', 276: 'DE', 288: 'GH', 300: 'GR', 308: 'GD', 320: 'GT', 324: 'GN', 624: 'GW', 328: 'GY', 332: 'HT',
  340: 'HN', 348: 'HU', 352: 'IS', 356: 'IN', 360: 'ID', 364: 'IR', 368: 'IQ', 372: 'IE', 376: 'IL', 380: 'IT',
  384: 'CI', 388: 'JM', 392: 'JP', 400: 'JO', 398: 'KZ', 404: 'KE', 296: 'KI', 414: 'KW', 417: 'KG', 418: 'LA',
  428: 'LV', 422: 'LB', 426: 'LS', 430: 'LR', 434: 'LY', 438: 'LI', 440: 'LT', 442: 'LU', 450: 'MG', 454: 'MW',
  458: 'MY', 462: 'MV', 466: 'ML', 470: 'MT', 584: 'MH', 478: 'MR', 480: 'MU', 484: 'MX', 583: 'FM', 498: 'MD',
  492: 'MC', 496: 'MN', 499: 'ME', 504: 'MA', 508: 'MZ', 104: 'MM', 516: 'NA', 520: 'NR', 524: 'NP', 528: 'NL',
  554: 'NZ', 558: 'NI', 562: 'NE', 566: 'NG', 408: 'KP', 807: 'MK', 578: 'NO', 512: 'OM', 586: 'PK', 585: 'PW',
  275: 'PS', 591: 'PA', 598: 'PG', 600: 'PY', 604: 'PE', 608: 'PH', 616: 'PL', 620: 'PT', 634: 'QA', 178: 'CG',
  642: 'RO', 643: 'RU', 646: 'RW', 659: 'KN', 662: 'LC', 670: 'VC', 882: 'WS', 674: 'SM', 678: 'ST', 682: 'SA',
  686: 'SN', 688: 'RS', 690: 'SC', 694: 'SL', 702: 'SG', 703: 'SK', 705: 'SI', 90: 'SB', 706: 'SO', 710: 'ZA',
  410: 'KR', 728: 'SS', 724: 'ES', 144: 'LK', 729: 'SD', 740: 'SR', 752: 'SE', 756: 'CH', 760: 'SY', 158: 'TW',
  762: 'TJ', 834: 'TZ', 764: 'TH', 44: 'BS', 270: 'GM', 768: 'TG', 776: 'TO', 780: 'TT', 788: 'TN', 792: 'TR',
  795: 'TM', 798: 'TV', 800: 'UG', 804: 'UA', 784: 'AE', 826: 'GB', 840: 'US', 858: 'UY', 860: 'UZ', 548: 'VU',
  336: 'VA', 862: 'VE', 704: 'VN', 732: 'EH', 887: 'YE', 894: 'ZM', 716: 'ZW',
};
const codeOf = (f) => (f.properties && f.properties.name === 'Kosovo' ? 'XK' : NUM[Number(f.id)] || null);

const dateLabel = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
const quizId = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `passport-${m}-${d}-${String(y).slice(2)}`; };
const isSunday = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay() === 0;
const r1 = (s) => s.replace(/(\d+\.\d)\d+/g, '$1');

// ── geometry ────────────────────────────────────────────────────────────────
const F50 = feature(T50, T50.objects.countries).features;
const F110 = feature(T110, T110.objects.countries).features;
const byCode50 = new Map();
for (const f of F50) { const c = codeOf(f); if (c && !byCode50.has(c)) byCode50.set(c, f); }

// The parts of a country big enough to frame: every polygon at least 15% of
// its largest, so Zealand comes with Jutland but Alaska does not frame Kansas
// (Alaska is 18% of the lower 48, so the US is clipped by hand below).
function mainParts(f) {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const scored = polys.map((p) => ({ p, a: geoArea({ type: 'Polygon', coordinates: p }) }));
  const max = Math.max(...scored.map((x) => x.a));
  return scored.filter((x) => x.a >= max * 0.15).map((x) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: x.p } }));
}
const FRAME_OVERRIDE = {
  US: [-126, 23, -65, 50],
  CN: [72, 17, 136, 54],
  CA: [-142, 41, -52, 72],
  NO: [3, 57, 32, 72],
  LK: [70, -1.5, 86, 12.5],
};
function lonLatBox(feats) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of feats) {
    const [[a, b], [c, d]] = geoBounds(f);
    x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c < a ? c + 360 : c); y1 = Math.max(y1, d);
  }
  return [x0, y0, x1, y1];
}

const W = 600;
function buildMap(cc, extraCodes, labelCodes, capitals) {
  let box = FRAME_OVERRIDE[cc];
  if (!box) {
    const feats = [cc, ...extraCodes].flatMap((c) => (byCode50.get(c) ? mainParts(byCode50.get(c)) : []));
    const [x0, y0, x1, y1] = lonLatBox(feats);
    const px = Math.max(2.5, (x1 - x0) * 0.35), py = Math.max(2, (y1 - y0) * 0.35);
    box = [x0 - px, Math.max(-75, y0 - py), x1 + px, Math.min(80, y1 + py)];
  }
  const lon0 = (box[0] + box[2]) / 2;
  const span = box[2] - box[0];
  // The frame follows the country's shape: a tall country (Chile) gets a tall
  // map, clamped so a phone never scrolls past it.
  const probe = geoMercator().rotate([-lon0, 0]);
  const [ax, ay] = probe([box[0], box[3]]), [bx, by] = probe([box[2], box[1]]);
  const H = Math.round(Math.min(640, Math.max(380, W * Math.abs(by - ay) / Math.abs(bx - ax))));
  const corners = { type: 'MultiPoint', coordinates: [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]], [lon0, box[1]], [lon0, box[3]]] };
  const proj = geoMercator().rotate([-lon0, 0]).fitExtent([[8, 8], [W - 8, H - 8]], corners);
  proj.clipExtent([[-4, -4], [W + 4, H + 4]]);
  const gp = geoPath(proj);
  const src = span > 45 ? F110 : F50;
  const paths = [];
  const lab = {};
  for (const f of src) {
    const c = codeOf(f) || `x${f.id}`;
    const d = gp(f);
    if (!d) continue;
    const [[bx0, by0], [bx1, by1]] = gp.bounds(f);
    if (bx1 < 0 || by1 < 0 || bx0 > W || by0 > H) continue;
    paths.push([c, r1(d)]);
    if (labelCodes.includes(c)) {
      const [lx, ly] = gp.centroid(f);
      if (Number.isFinite(lx)) lab[c] = [+Math.min(W - 30, Math.max(30, lx)).toFixed(1), +Math.min(H - 12, Math.max(14, ly)).toFixed(1)];
    }
  }
  // A neighbour too small for the atlas (Vatican City, San Marino, Andorra)
  // still gets a label, at its capital.
  for (const c of labelCodes) {
    if (lab[c]) continue;
    const at = FACTBOOK[c] && FACTBOOK[c].cap;
    if (at) { const [x, y] = proj(at); lab[c] = [+x.toFixed(1), +y.toFixed(1)]; }
  }
  paths.sort((a, b) => (a[0] === cc ? 1 : 0) - (b[0] === cc ? 1 : 0));
  const pins = capitals.map((cp) => proj(cp.at).map((v) => +v.toFixed(1)));
  return { w: W, h: H, k: +proj.scale().toFixed(4), t: proj.translate().map((v) => +v.toFixed(4)), lon0: +lon0.toFixed(4), paths, lab, pins };
}

// ── comparisons ─────────────────────────────────────────────────────────────
// Five countries to call bigger or smaller by area, all within a factor of
// about two, at least two each way where the field allows it, the closest last.
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Entities whose area is itself a political argument never appear as a size
// comparison, though they still count as neighbours under Flank's convention.
const DISPUTED = new Set(['PS', 'XK', 'EH', 'TW']);
// Comparisons draw on countries a general player can picture; a size call
// against a country you cannot place is a coin toss, not a question.
const KNOWN = new Set(('AF AL DZ AO AR AM AU AT AZ BD BY BE BO BA BW BR BG KH CM CA CL CN CO CR HR CU CY CZ CD DK DO EC EG ' +
  'SV EE ET FI FR GE DE GH GR GT HT HN HU IS IN ID IR IQ IE IL IT CI JM JP JO KZ KE KP KR KW KG LA LV LB LY LT LU MG MY ML ' +
  'MX MD MN ME MA MZ MM NA NP NL NZ NI NE NG MK NO OM PK PA PG PY PE PH PL PT QA RO RU RW SA SN RS SG SK SI SO ZA SS ES LK SD SE ' +
  'CH SY TJ TZ TH TN TR TM UG UA AE GB US UY UZ VE VN YE ZM ZW BS FJ').split(' '));
// The US and China swap places depending on how coastal and territorial
// water is counted, so that pair is never asked.
const CONTESTED_PAIR = new Set(['CNUS']);
function comparisons(cc, salt) {
  const a0 = FACTBOOK[cc].a;
  const pool = Object.entries(FACTBOOK)
    .filter(([c, v]) => c !== cc && v.a && v.a >= 2000 && BORDERS[c] && !DISPUTED.has(c) && KNOWN.has(c) && !CONTESTED_PAIR.has([cc, c].sort().join('')))
    .map(([c, v]) => ({ c, a: v.a, d: Math.abs(Math.log(v.a / a0)) }))
    .filter((x) => x.d > 0.004 && x.d < 1.4)
    .sort((x, y) => x.d - y.d || (hash(salt + x.c) - hash(salt + y.c)));
  // Two each way where the world allows it: the band is the near ones, and a
  // side short of two inside it borrows its nearest from beyond (India's
  // bigger neighbours in size are all far bigger; Canada has only Russia).
  const side = (up) => {
    const all = pool.filter((x) => (x.a > a0) === up);
    const near = all.filter((x) => x.d < 0.75);
    return near.length >= 2 ? near : all.slice(0, Math.max(2, near.length));
  };
  const big = side(true), small = side(false);
  pool.splice(0, pool.length, ...pool.filter((x, i) => x.d < 0.75 || i < 5));
  const pick = [];
  const take = (arr, n) => { for (const x of arr) { if (pick.length >= 5 || n <= 0) break; if (!pick.includes(x)) { pick.push(x); n--; } } };
  // the closest one of all, then spread the rest across the band
  const closest = pool[0];
  take([closest], 1);
  const spread = (arr) => arr.filter((x) => x !== closest).sort((x, y) => (hash(salt + x.c) % 997) - (hash(salt + y.c) % 997));
  take(spread(big), 2);
  take(spread(small), 2);
  take(spread(pool), 5 - pick.length);
  const rest = pick.filter((x) => x !== closest).sort((x, y) => (hash(salt + 'o' + x.c) % 991) - (hash(salt + 'o' + y.c) % 991));
  return [...rest, closest].map((x) => [x.c, x.a]);
}

// ── assemble ────────────────────────────────────────────────────────────────
const light = [];
const days = [];
SCHEDULE.forEach(([iso, cc], i) => {
  const num = i + 1;
  const b = BORDERS[cc];
  if (!b) throw new Error(`${cc}: not in the Flank dataset`);
  const across = ACROSS[cc] || null;
  const borders = across ? null : b.n.slice().sort();
  const caps = CAPITALS[cc] || [{ name: CAPITAL_NAME[cc], at: FACTBOOK[cc].cap }];
  const ring = across || borders;
  const lm = LANDMARKS[cc];
  light.push({ num, quizId: quizId(iso), live: iso, dateLabel: dateLabel(iso), sunday: isSunday(iso) });
  days.push({
    num, c: cc, name: b.name,
    land: { name: lm[0], t: lm[1], lic: lm[2], by: lm[3], fx: lm[4], fy: lm[5] },
    flag: FLAGS[cc],
    borders, across,
    cap: { names: caps.map((x) => x.name), at: caps.map((x) => x.at) },
    area: FACTBOOK[cc].a,
    cmp: comparisons(cc, iso),
    map: buildMap(cc, across || [], [cc, ...ring], caps),
  });
});

const head = (what) => `// GENERATED by scripts/gen-passport.mjs from scripts/passport-facts.mjs. Do not\n// edit by hand: change the facts and re-run the generator, then\n// scripts/verify-passport.mjs. ${what}\n`;
fs.writeFileSync('app/passport/puzzles.js',
  head('The light index every daily consumer reads.') +
  'export const PUZZLES = [\n' + light.map((p) => '  ' + JSON.stringify(p) + ',').join('\n') + '\n];\n');
fs.writeFileSync('app/passport/days.js',
  head('Each day\'s full content. SERVER ONLY: app/passport/page.js ships\n// the picked day alone, so tomorrow\'s country never reaches a browser.') +
  'export const DAYS = {\n' + days.map((d) => `  ${d.num}: ${JSON.stringify(d)},`).join('\n') + '\n};\n');
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
console.log(`passport: ${light.length} days, ${light[0].live} to ${light[light.length - 1].live}; days.js ${kb('app/passport/days.js')} KB`);
