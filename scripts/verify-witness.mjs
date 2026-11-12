// scripts/verify-witness.mjs: re-proves app/witness/puzzles.js.
//
//   node scripts/verify-witness.mjs
//
// What it enforces (docs/claude/daily-authoring.md, the authoring standard):
//   - num, quizId and dateLabel from the live date; dates run day after day
//     from the launch, 2026-11-12. No Sunday Edition flag on any board.
//   - EVERY ANSWER IS RE-DERIVED FROM THE SCENE (rule 3). The stored `a` is
//     never trusted: each question's kind and ref are read against the scene
//     data with this file's own lookups, and the derived answer must be the
//     option `a` points at. A question whose subject is not unique in the
//     scene ("the van" with two vans, "the umbrella" with two) fails.
//   - four distinct options, exactly one of them right (rule 4). For "which
//     was NOT on the sidewalk" that means exactly one option is absent.
//   - the scene is drawable: slots in range and never shared, known kinds and
//     colors, 2 to 4 distinct shops.
//   - THE WEEKLY RAMP (rule 5): the tier matches the weekday, the object count
//     sits in its tier's band (Gentle 9..13, Moderate 15..22, Tough 23..30,
//     Sunday 27 or more), Sunday carries 8 questions and 30 seconds, every
//     other day 6 and 20, and each week's Sunday shows more than its Monday.
//   - variety across the bank (rules 7 and 7b): no answer slot holds under 18%
//     or over 32% of the answers; no day repeats the previous day's slot
//     pattern; no day puts more than half its answers in one slot; no kind of
//     question other than a count appears on more than 75% of days; no day
//     asks two questions of the same kind except counts (two at most); no day
//     shows the same set of shops as the day before.
//   - US spellings and no em dash in any question or option. From 2026-11-13
//     (WORDING_FROM; the first board is frozen) a question naming Books, Toys,
//     Bikes, Pets, Pizza or Music says "the Books shop", not "the Books".
import { PUZZLES } from '../app/witness/puzzles.js';
import { COLOR_NAMES, WALK_NAMES, FLYER_NAMES, objectCount, WALK_SLOTS, ROAD_SLOTS, SKY_SLOTS } from '../lib/witness-scene.js';

const START = '2026-11-12';
const WORDING_FROM = '2026-11-13';
const NEEDS_SHOP = new Set(['BOOKS', 'TOYS', 'BIKES', 'PETS', 'PIZZA', 'MUSIC']);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const BANDS = { Gentle: [9, 13], Moderate: [15, 22], Tough: [23, 30], Sunday: [27, 40] };
let fails = 0;
const fail = (m) => { fails++; console.error('FAIL ' + m); };
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();
const title = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const one = (arr, what) => { if (arr.length !== 1) throw new Error(`expected exactly one ${what}, found ${arr.length}`); return arr[0]; };

function derive(scene, q) {
  const shopBy = (name) => one(scene.shops.filter((s) => s.name === name), `shop ${name}`);
  const people = scene.walk.filter((w) => w.kind === 'person');
  switch (q.k) {
    case 'vcolor': return title(one(scene.road.filter((v) => v.kind === q.ref.kind), q.ref.kind).color);
    case 'vrack': { const same = scene.road.filter((v) => v.kind === q.ref.kind); if (same.length < 2) throw new Error('no twin vehicle'); return title(one(same.filter((v) => v.rack), 'roof rack').color); }
    case 'flyer': return scene.sky.flyer ? FLYER_NAMES[scene.sky.flyer.kind] : 'Nothing';
    case 'flyercolor': if (!scene.sky.flyer || scene.sky.flyer.kind === 'plane') throw new Error('no colored flyer'); return title(scene.sky.flyer.color);
    case 'count': {
      const w = q.ref.what;
      const n = w === 'people' ? people.length : w === 'birds' ? (scene.sky.birds ? scene.sky.birds.n : 0) : w === 'clouds' ? scene.sky.clouds.length : w === 'vehicles' ? scene.road.length : scene.walk.filter((x) => x.kind === w).length;
      if (n < 1) throw new Error(`a count of ${w} with none in the scene`);
      return String(n);
    }
    case 'umbrella': return title(one(people.filter((p) => p.umbrella), 'umbrella').umbrella);
    case 'hatshirt': return title(one(people.filter((p) => p.hat), 'hat').color);
    case 'bike': return title(one(scene.walk.filter((w) => w.kind === 'bike'), 'bicycle').color);
    case 'route': return String(one(scene.walk.filter((w) => w.kind === 'stop'), 'bus stop').route);
    case 'absent': { const here = new Set(scene.walk.map((w) => WALK_NAMES[w.kind])); return one(q.o.filter((x) => !here.has(x)), 'absent option'); }
    case 'neighbor': {
      const row = [...scene.walk].sort((a, b) => a.slot - b.slot);
      const i = row.indexOf(one(row.filter((w) => w.kind === q.ref.of), q.ref.of));
      const nb = row[q.ref.side === 'left' ? i - 1 : i + 1];
      if (!nb) throw new Error('nothing stands on that side');
      if (Math.abs(nb.slot - row[i].slot) > 2) throw new Error('the neighbor is too far off to call "just beside"');
      return WALK_NAMES[nb.kind];
    }
    case 'striped': return title(one(scene.shops.filter((s) => s.awning && s.awning.striped), 'striped awning').name);
    case 'awningcolor': { const s = shopBy(q.ref.shop); if (!s.awning || s.awning.striped) throw new Error('no plain awning there'); return title(s.awning.color); }
    case 'door': return title(shopBy(q.ref.shop).door);
    case 'windows': return String(shopBy(q.ref.shop).windows);
    case 'number': { const s = shopBy(q.ref.shop); if (!s.number) throw new Error('no number on that shop'); return String(s.number); }
    case 'far': return title(scene.shops[q.ref.end === 'left' ? 0 : scene.shops.length - 1].name);
    case 'nextto': { const i = scene.shops.indexOf(shopBy(q.ref.shop)); if (i !== 0 && i !== scene.shops.length - 1) throw new Error('a middle shop has two neighbors'); return title(scene.shops[i === 0 ? 1 : scene.shops.length - 2].name); }
    case 'clock': { const c = one(scene.shops.filter((s) => s.clock), 'clock').clock; return `${c.h}:${String(c.m).padStart(2, '0')}`; }
    default: throw new Error(`unknown question kind ${q.k}`);
  }
}

const slots = [0, 0, 0, 0], kindDays = {};
let prev = null, prevPattern = '', prevShops = '', total = 0;
const weeks = new Map();
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (i === 0 && p.live !== START) fail(`${tag}: the bank should open on ${START}`);
  if (prev && day(p.live) - day(prev) !== 86400000) fail(`${tag}: dates are not contiguous`);
  prev = p.live;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `witness-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  if ('sunday' in p) fail(`${tag}: Witness carries no sunday flag`);
  const dow = new Date(`${p.live}T12:00:00Z`).getUTCDay();
  const want = dow === 0 ? 'Tough' : dow <= 2 ? 'Gentle' : dow <= 4 ? 'Moderate' : 'Tough';
  if (p.tier !== want) fail(`${tag}: tier ${p.tier} on a ${want} day`);
  const sc = p.scene;

  // the scene is drawable
  if (!Array.isArray(sc.shops) || sc.shops.length < 2 || sc.shops.length > 4) fail(`${tag}: 2 to 4 shops`);
  if (new Set(sc.shops.map((s) => s.name)).size !== sc.shops.length) fail(`${tag}: a shop name repeats`);
  for (const s of sc.shops) {
    if (!COLOR_NAMES.includes(s.door)) fail(`${tag}: door color ${s.door}`);
    if (s.awning && (!COLOR_NAMES.includes(s.awning.color) || s.awning.color === 'white')) fail(`${tag}: awning color ${s.awning.color}`);
    if (!(s.windows >= 1 && s.windows <= 3)) fail(`${tag}: ${s.name} has ${s.windows} windows`);
    if (s.clock && (s.clock.h < 1 || s.clock.h > 12 || s.clock.m % 5 || s.clock.m < 0 || s.clock.m > 55 || s.clock.m / 5 === s.clock.h % 12)) fail(`${tag}: unreadable clock`);
    if (s.name.length > 8) fail(`${tag}: shop name ${s.name} will not fit its sign`);
  }
  const uniq = (arr, n, what) => { if (new Set(arr).size !== arr.length || arr.some((x) => !(x >= 0 && x < n))) fail(`${tag}: ${what} slots collide or run off the scene`); };
  uniq(sc.walk.map((w) => w.slot), WALK_SLOTS, 'sidewalk');
  uniq(sc.road.map((v) => v.slot), ROAD_SLOTS, 'road');
  uniq([sc.sky.sun, ...(sc.sky.clouds || []), ...(sc.sky.birds ? [sc.sky.birds.slot] : []), ...(sc.sky.flyer ? [sc.sky.flyer.slot] : [])], SKY_SLOTS, 'sky');
  for (const w of sc.walk) if (!WALK_NAMES[w.kind]) fail(`${tag}: unknown sidewalk kind ${w.kind}`);
  for (const v of sc.road) if (!['car', 'van', 'bus', 'truck'].includes(v.kind) || !COLOR_NAMES.includes(v.color)) fail(`${tag}: bad vehicle`);
  if (sc.sky.birds && !(sc.sky.birds.n >= 1 && sc.sky.birds.n <= 6)) fail(`${tag}: ${sc.sky.birds.n} birds`);

  // the ramp
  const n = objectCount(sc);
  if (p.objects !== n) fail(`${tag}: objects says ${p.objects}, the scene shows ${n}`);
  const band = BANDS[dow === 0 ? 'Sunday' : p.tier];
  if (n < band[0] || n > band[1]) fail(`${tag}: ${n} objects is outside the ${dow === 0 ? 'Sunday' : p.tier} band ${band[0]}..${band[1]}`);
  if (p.qs.length !== (dow === 0 ? 8 : 6)) fail(`${tag}: ${p.qs.length} questions`);
  if (p.study !== (dow === 0 ? 30 : 20)) fail(`${tag}: study time ${p.study}`);
  const wk = Math.floor((day(p.live) - day('2026-11-09')) / (7 * 86400000));
  if (!weeks.has(wk)) weeks.set(wk, {});
  weeks.get(wk)[dow] = n;

  // the questions
  const kinds = {};
  p.qs.forEach((q, j) => {
    const qt = `${tag} Q${j + 1} (${q.k})`;
    total++;
    kinds[q.k] = (kinds[q.k] || 0) + 1;
    if (!Array.isArray(q.o) || q.o.length !== 4 || new Set(q.o).size !== 4) fail(`${qt}: needs four distinct options`);
    if (!(q.a >= 0 && q.a < 4)) { fail(`${qt}: answer index`); return; }
    slots[q.a]++;
    let ans;
    try { ans = derive(sc, q); } catch (e) { fail(`${qt}: ${e.message}`); return; }
    if (q.o[q.a] !== ans) fail(`${qt}: stored answer "${q.o[q.a]}", the scene says "${ans}"`);
    if (q.o.filter((x) => x === ans).length !== 1) fail(`${qt}: the right answer must appear exactly once`);
    if (q.ref && q.ref.shop && !q.t.includes(title(q.ref.shop))) fail(`${qt}: the question does not name ${q.ref.shop}`);
    if (p.live >= WORDING_FROM && q.ref && q.ref.shop && NEEDS_SHOP.has(q.ref.shop) && !q.t.includes(`${title(q.ref.shop)} shop`)) fail(`${qt}: should read "the ${title(q.ref.shop)} shop"`);
    for (const t of [q.t, ...q.o]) { if (/—/.test(t)) fail(`${qt}: em dash`); if (/colour|grey\b|neighbour/i.test(t)) fail(`${qt}: British spelling in "${t}"`); }
    if (q.at && !(q.at[0] >= 0 && q.at[0] <= 360 && q.at[1] >= 0 && q.at[1] <= 400)) fail(`${qt}: pin off the scene`);
  });
  for (const [k, c] of Object.entries(kinds)) { if (c > (k === 'count' ? 2 : 1)) fail(`${tag}: ${c} questions of kind ${k}`); kindDays[k] = (kindDays[k] || 0) + 1; }
  const pattern = p.qs.map((q) => q.a).join('');
  if (pattern === prevPattern) fail(`${tag}: repeats the previous day's answer slots`);
  prevPattern = pattern;
  for (let s = 0; s < 4; s++) if (p.qs.filter((q) => q.a === s).length > p.qs.length / 2) fail(`${tag}: more than half the answers sit in slot ${s + 1}`);
  const shops = sc.shops.map((s) => s.name).sort().join();
  if (shops === prevShops) fail(`${tag}: the same shops as the day before`);
  prevShops = shops;
});
for (const [wk, w] of weeks) if (w[0] != null && w[1] != null && !(w[0] > w[1])) fail(`week ${wk}: Sunday (${w[0]}) does not show more than Monday (${w[1]})`);
slots.forEach((c, s) => { const share = c / total; if (share < 0.18 || share > 0.32) fail(`answer slot ${s + 1} holds ${(share * 100).toFixed(1)}% of the answers (18..32 allowed)`); });
for (const [k, c] of Object.entries(kindDays)) if (k !== 'count' && c / PUZZLES.length > 0.75) fail(`question kind ${k} appears on ${c} of ${PUZZLES.length} days`);

console.log(fails ? `verify-witness: ${fails} failure(s)` : `verify-witness: ${PUZZLES.length} boards OK, ${total} answers re-derived, through ${PUZZLES[PUZZLES.length - 1].live}`);
process.exit(fails ? 1 : 0);
