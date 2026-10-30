// scripts/verify-ladder-ramp.mjs - the run ladder ramp stays OFF the category
// colours (owner, 2026-10-30). Every LADDER_RAMP step's stage pastel (softGround)
// must sit at least MIN_DE delta-E (CIELAB 1976) from every category pastel and
// from every other step, and must carry RAMP_INK at 6:1 or better, raw and soft.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { LADDER_RAMP } = await import('../lib/circuits.js');
const { CATEGORY_RAMP, RAMP_INK, softGround } = await import('../lib/category-ramp.js');
const MIN_DE = 7;
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function lab(c) {
  const [r, g, b] = c.map((v) => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; });
  const F = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = F((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = F(r * 0.2126 + g * 0.7152 + b * 0.0722), z = F((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dE = (a, b) => { const A = lab(rgb(a)), B = lab(rgb(b)); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const lum = (h) => { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const fails = [];
const catSoft = CATEGORY_RAMP.map((c) => softGround(c));
LADDER_RAMP.forEach((c, i) => {
  const s = softGround(c);
  if (CATEGORY_RAMP.map((x) => x.toLowerCase()).includes(c.toLowerCase())) fails.push(`step ${i} ${c} IS a category colour`);
  catSoft.forEach((k, j) => { const d = dE(s, k); if (d < MIN_DE) fails.push(`step ${i} ${c} stage ${s} is ${d.toFixed(1)} dE from category ${CATEGORY_RAMP[j]} (min ${MIN_DE})`); });
  LADDER_RAMP.forEach((o, j) => { if (j > i) { const d = dE(s, softGround(o)); if (d < MIN_DE) fails.push(`steps ${i} and ${j} are ${d.toFixed(1)} dE apart`); } });
  for (const [label, bg] of [['raw', c], ['stage', s]]) { const r = cr(bg, RAMP_INK); if (r < 6) fails.push(`step ${i} ${label} ${bg} carries ink at ${r.toFixed(2)}:1`); }
});
for (const f of fails) console.log('FAIL ' + f);
console.log(`ladder ramp: ${LADDER_RAMP.length} steps, ${fails.length} fail`);
process.exit(fails.length ? 1 : 0);
