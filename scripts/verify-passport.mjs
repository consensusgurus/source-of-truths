// scripts/verify-passport.mjs: checks the Passport bank (app/passport/puzzles.js
// and days.js) against the rules every surface relies on. Imports nothing from
// the generator.
//
//   node scripts/verify-passport.mjs
import fs from 'fs';
import { PUZZLES } from '../app/passport/puzzles.js';
import { DAYS } from '../app/passport/days.js';
import { BORDERS } from '../app/flank/borders.js';
import { PUZZLES as FLANK } from '../app/flank/puzzles.js';
import { TIERS, TOTAL, ROUNDS, unproject, haversineKm, capStep } from '../lib/passport.js';
import { flagSteps, FLAG_LAYOUTS, SUBTLE_FROM } from '../app/passport/flagkit.js';

const fails = [], warns = [];
const fail = (m) => fails.push(m);

// ── the light index ─────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let prev = null;
PUZZLES.forEach((p, i) => {
  if (p.num !== i + 1) fail(`#${i + 1}: num is ${p.num}`);
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `passport-${m}-${d}-${String(y).slice(2)}`) fail(`#${p.num}: quizId ${p.quizId} does not match ${p.live}`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`#${p.num}: dateLabel ${p.dateLabel}`);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (p.sunday !== (dow === 0)) fail(`#${p.num}: sunday flag ${p.sunday} on a day ${dow}`);
  if (prev) {
    const gap = (Date.UTC(y, m - 1, d) - Date.parse(prev + 'T00:00:00Z')) / 864e5;
    if (gap !== 1) fail(`#${p.num}: ${gap} days after the previous puzzle`);
  }
  prev = p.live;
  const keys = Object.keys(p).sort().join(',');
  if (keys !== 'dateLabel,live,num,quizId,sunday') fail(`#${p.num}: the light index carries ${keys}`);
});
if (PUZZLES[0].live !== '2026-10-03') fail(`the bank starts ${PUZZLES[0].live}, launch is 2026-10-03`);

// ── each day ────────────────────────────────────────────────────────────────
const seen = new Map();
const flankByDate = new Map(FLANK.map((f) => [f.live, f.c]));
const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
for (const p of PUZZLES) {
  const d = DAYS[p.num];
  const at = `#${p.num} ${p.live}`;
  if (!d) { fail(`${at}: no day`); continue; }
  if (d.num !== p.num) fail(`${at}: day num ${d.num}`);
  const B = BORDERS[d.c];
  if (!B) { fail(`${at}: ${d.c} is not a Flank entity`); continue; }
  if (B.noSubject) fail(`${at}: ${d.c} is noSubject in borders.js`);
  if (d.name !== B.name) fail(`${at}: name ${d.name} against borders.js ${B.name}`);
  if (seen.has(d.c)) fail(`${at}: ${d.c} repeats #${seen.get(d.c)}`);
  seen.set(d.c, p.num);
  // Flank's country never sits within three days of Passport's.
  for (let k = -3; k <= 3; k++) if (flankByDate.get(addDays(p.live, k)) === d.c) fail(`${at}: Flank plays ${d.c} ${k} day(s) away`);

  // Borders: exactly Flank's set, or an island's across list.
  const want = [...B.n].sort().join(',');
  if (B.n.length) {
    if (!d.borders || [...d.borders].sort().join(',') !== want) fail(`${at}: borders ${d.borders} against ${want}`);
    if (d.across) fail(`${at}: has both borders and across`);
  } else {
    if (d.borders) fail(`${at}: an island with borders`);
    if (!d.across || d.across.length < 2 || d.across.some((c) => !BORDERS[c])) fail(`${at}: an island needs 2+ known across countries`);
  }
  if (p.sunday && (!B.n.length || B.n.length < 8)) fail(`${at}: a Sunday needs 8+ neighbors, has ${B.n.length}`);
  if (!p.sunday && B.n.length >= 8) warns.push(`${at}: a weekday with ${B.n.length} neighbors`);

  // Landmark.
  const L = d.land || {};
  for (const k of ['name', 't', 'lic', 'by']) if (!L[k] || typeof L[k] !== 'string') fail(`${at}: landmark ${k} missing`);
  for (const k of ['fx', 'fy']) if (!(L[k] >= 0 && L[k] <= 1)) fail(`${at}: landmark ${k} ${L[k]}`);
  if (L.name && d.name && L.name.toLowerCase().includes(d.name.toLowerCase())) warns.push(`${at}: the landmark name says the country`);

  // Flag.
  const F = d.flag || {};
  if (!FLAG_LAYOUTS[F.lay]) fail(`${at}: flag layout ${F.lay}`);
  if (!Array.isArray(F.pal) || F.pal.length < 2 || F.pal.some((h) => !/^#[0-9a-f]{6}$/i.test(h))) fail(`${at}: flag palette ${F.pal}`);
  if (!Array.isArray(F.also) || F.also.length !== 3 || F.also.includes(d.c) || new Set(F.also).size !== 3) fail(`${at}: flag decoys ${F.also}`);
  for (const c of [d.c, ...(F.also || [])]) if (!fs.existsSync(`public/passport/flags/${c.toLowerCase()}.svg`)) fail(`${at}: no flag file for ${c}`);
  try {
    const steps = flagSteps(F, d.c, d.num);
    steps.forEach((s, i) => {
      if (s.opts.length !== 4 || s.opts.filter((o) => o.ok).length !== 1) fail(`${at}: flag step ${i + 1} needs 4 options, one right`);
      const labels = s.opts.map((o) => o.label || o.key || o.code);
      // The near-miss rule (2026-10-09 on): the layout step must carry at least
      // one option that is the RIGHT layout with its colors reordered.
      if (i === 1 && d.num >= SUBTLE_FROM) {
        if (!s.opts.some((o) => o.kind === 'order')) fail(`${at}: flag layout step has no colors-out-of-order decoy`);
        if (new Set(s.opts.map((o) => o.svg)).size !== 4) fail(`${at}: flag layout step draws two options identically`);
      }
      if (new Set(labels).size !== 4) fail(`${at}: flag step ${i + 1} repeats an option (${labels.join(' / ')})`);
    });
  } catch (e) { fail(`${at}: flagSteps threw ${e.message}`); }

  // Capital: names and points pair up, the pins land on the map, and the pins
  // invert back to the points the round scores against.
  const C = d.cap || {};
  if (!C.names || !C.at || C.names.length !== C.at.length || !C.names.length) fail(`${at}: capital names and points do not pair`);
  const M = d.map || {};
  if (!M.w || !M.h || !M.k || !M.t || !Array.isArray(M.paths) || !M.paths.length) fail(`${at}: map incomplete`);
  else {
    if (!M.paths.some(([c]) => c === d.c)) fail(`${at}: the map does not draw ${d.c}`);
    if (!M.lab || !M.lab[d.c]) fail(`${at}: no label point for ${d.c}`);
    (M.pins || []).forEach(([x, y], i) => {
      if (!(x > 8 && x < M.w - 8 && y > 8 && y < M.h - 8)) fail(`${at}: capital pin ${i} off the map (${x},${y})`);
      const ll = unproject(M, x, y);
      const km = C.at && C.at[i] ? haversineKm(ll, C.at[i]) : Infinity;
      if (km > 2) fail(`${at}: pin ${i} inverts ${km.toFixed(1)} km from ${C.names && C.names[i]}`);
    });
    if (!M.pins || M.pins.length !== (C.at || []).length) fail(`${at}: ${M.pins && M.pins.length} pins for ${(C.at || []).length} seats`);
    // A step must be smaller than the map, or every pin scores full marks.
    const span = haversineKm(unproject(M, 0, M.h / 2), unproject(M, M.w, M.h / 2));
    if (capStep(d.area) * 3 > span) fail(`${at}: capital step ${capStep(d.area)} km against a ${span.toFixed(0)} km wide map`);
  }

  // Numbers: five distinct comparison countries, none the subject, at least
  // two bigger and two smaller, area a positive number.
  if (!(d.area > 0)) fail(`${at}: area ${d.area}`);
  const cmp = d.cmp || [];
  if (cmp.length !== 5) fail(`${at}: ${cmp.length} comparisons`);
  if (new Set(cmp.map(([c]) => c)).size !== cmp.length || cmp.some(([c]) => c === d.c)) fail(`${at}: comparisons repeat or include the subject`);
  if (cmp.some(([c, a]) => !BORDERS[c] || !(a > 0) || a === d.area)) fail(`${at}: a comparison is unknown, sizeless or a tie`);
  const big = cmp.filter(([, a]) => a > d.area).length;
  // Two each way where the world allows it (Canada has one country bigger).
  if (big < 1 || big > 4) fail(`${at}: ${big} of 5 comparisons are bigger`);
  else if (big < 2 || big > 3) warns.push(`${at}: ${big} of 5 comparisons are bigger`);
}

// ── the rules ───────────────────────────────────────────────────────────────
if (ROUNDS.length * 10 !== TOTAL) fail(`${ROUNDS.length} rounds of 10 is not ${TOTAL}`);
TIERS.forEach((t, i) => {
  if (i === 0 && t.min !== 0) fail('the bottom passport must start at 0');
  if (i > 0 && !(t.min > TIERS[i - 1].min && t.vf >= TIERS[i - 1].vf)) fail(`tier ${t.short} is out of order`);
});
if (TIERS[TIERS.length - 1].min !== TOTAL) fail('the top passport must be a perfect run');

const last = PUZZLES[PUZZLES.length - 1].live;
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const left = Math.round((Date.parse(last) - Date.parse(today)) / 864e5);
if (left < 7) warns.push(`the bank runs out ${last}, ${left} day(s) from today: restock`);

for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(`passport: ${PUZZLES.length} days, ${PUZZLES[0].live} to ${last}`);
console.log(fails.length ? `\n${fails.length} failure(s).` : `\nOK, ${warns.length} warning(s).`);
process.exit(fails.length ? 1 : 0);
