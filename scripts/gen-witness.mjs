// scripts/gen-witness.mjs: writes app/witness/puzzles.js, deterministically
// off each date. Re-running it reproduces the bank byte for byte, so it may
// only ever be used to APPEND days (raise END); boards that have gone live are
// frozen (docs/claude/daily-authoring.md, rule 10).
//
//   node scripts/gen-witness.mjs            writes the bank START..END
//
// THE WEEKLY DETAIL RAMP (owner, 2026-11-12: "can the images get more detailed
// throughout the week"). The clock never shortens; the street fills up:
//   Mon, Tue  Gentle    2 shops, 1 vehicle, 4 to 5 things on the sidewalk
//   Wed, Thu  Moderate  3 shops, a clock, a bus stop, 2 vehicles, birds
//   Fri, Sat  Tough     4 numbered shops, 3 vehicles (two alike, one with a
//                       roof rack), 10 things on the sidewalk
//   Sunday    Tough     the fullest street, 8 questions and 30 seconds
// The questions climb with it: plain recall, then counts and small text, then
// relations ("what stood left of the mailbox") and traps ("which was NOT").
import fs from 'fs';
import { BASE, WALK, ROAD, walkX, roadX, skyX, shopBox, COLOR_NAMES, WALK_NAMES, FLYER_NAMES, cap, objectCount } from '../lib/witness-scene.js';

const START = '2026-11-12', END = '2027-02-24';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHOPS = ['BAKERY', 'BOOKS', 'CAFE', 'FLORIST', 'BANK', 'PHARMACY', 'TOYS', 'BARBER', 'HOTEL', 'CINEMA', 'GROCER', 'PIZZA', 'MUSIC', 'TAILOR', 'BIKES', 'PETS'];
const EXTRAS = ['dog', 'cat', 'bike', 'bench', 'lamp', 'hydrant', 'mailbox', 'tree', 'bin'];
const TALL = new Set(['lamp', 'stop', 'tree']);

function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mk = (R) => ({
  int: (a, b) => a + Math.floor(R() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(R() * arr.length)],
  shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  chance: (p) => R() < p,
});

const TIERS = { gentle: { label: 'Gentle', shops: 2, walk: [4, 5], people: 2, road: 1, qs: 6, study: 20 },
  moderate: { label: 'Moderate', shops: 3, walk: [7, 7], people: 3, road: 2, qs: 6, study: 20 },
  tough: { label: 'Tough', shops: 4, walk: [10, 10], people: 4, road: 3, qs: 6, study: 20 },
  sunday: { label: 'Tough', shops: 4, walk: [12, 12], people: 5, road: 3, qs: 8, study: 30 } };
const tierOf = (live) => { const d = new Date(`${live}T12:00:00Z`).getUTCDay(); return d === 0 ? 'sunday' : d <= 2 ? 'gentle' : d <= 4 ? 'moderate' : 'tough'; };

function buildScene(tier, r) {
  const T = TIERS[tier], hard = tier === 'tough' || tier === 'sunday';
  const names = r.shuffle(SHOPS).slice(0, T.shops);
  const doors = r.shuffle(COLOR_NAMES), awn = r.shuffle(COLOR_NAMES.filter((c) => c !== 'white'));
  const striped = tier === 'gentle' ? -1 : r.int(0, T.shops - 1);
  const clockAt = tier === 'gentle' ? -1 : r.int(0, T.shops - 1);
  const bare = hard ? r.pick([...Array(T.shops).keys()].filter((i) => i !== striped)) : -1;
  const nums = r.shuffle([...Array(88).keys()].map((n) => n + 11)).slice(0, T.shops);
  let lastTall = -1, lastWall = -1;
  const shops = names.map((name, i) => {
    let tall = r.int(0, 2); if (tall === lastTall) tall = (tall + 1) % 3; lastTall = tall;
    let wall = r.int(0, 5); if (wall === lastWall) wall = (wall + 1) % 6; lastWall = wall;
    const s = { name, wall, tall, windows: r.int(1, 3), door: doors[i] };
    if (i !== bare) s.awning = { color: awn[i], striped: i === striped };
    if (i === clockAt) { let h, m; do { h = r.int(1, 12); m = r.int(0, 11) * 5; } while (m / 5 === h % 12 || (m === 0 && h === 12)); s.clock = { h, m }; }
    if (hard) s.number = nums[i];
    return s;
  });
  const scene = { shops, sky: {}, walk: [], road: [] };

  // sky
  const slots = r.shuffle([1, 2, 3, 4]);
  scene.sky.sun = r.pick([0, 5]);
  const freeEnd = scene.sky.sun === 0 ? 5 : 0;
  const skySlots = r.shuffle([...slots, freeEnd]);
  const nClouds = hard ? r.int(2, 3) : r.int(1, 2);
  scene.sky.clouds = skySlots.splice(0, nClouds).sort((a, b) => a - b);
  if (tier !== 'gentle') scene.sky.birds = { slot: skySlots.shift(), n: tier === 'moderate' ? r.int(2, 4) : tier === 'tough' ? r.int(3, 6) : r.int(4, 6) };
  if (tier === 'gentle' || r.chance(tier === 'moderate' ? 0.6 : 0.7)) {
    const kind = r.pick(['plane', 'balloon', 'kite']);
    scene.sky.flyer = { slot: skySlots.shift(), kind };
    if (kind !== 'plane') scene.sky.flyer.color = r.pick(COLOR_NAMES.filter((c) => c !== 'white' && c !== 'black'));
  }

  // sidewalk: a tall thing never stands in front of a shop's number plate
  const plate = (slot) => hard && scene.shops.some((_, i) => { const b = shopBox(scene, i), px = b.x + b.w / 2 + 27; return Math.abs(walkX(slot) - px) < 26; });
  const nWalk = r.int(T.walk[0], T.walk[1]);
  const free = r.shuffle([...Array(12).keys()]);
  const take = (tall) => { const i = free.findIndex((s) => !(tall && plate(s))); if (i < 0) return null; return free.splice(i, 1)[0]; };
  const shirts = r.shuffle(COLOR_NAMES);
  const umb = r.int(0, T.people - 1), hat = hard ? (umb + 1 + r.int(0, T.people - 2)) % T.people : (tier === 'moderate' && r.chance(0.5) ? (umb + 1) % T.people : -1);
  for (let p = 0; p < T.people; p++) {
    const it = { kind: 'person', color: shirts[p] };
    if (p === umb) it.umbrella = r.pick(COLOR_NAMES.filter((c) => c !== 'white' && c !== shirts[p]));
    if (p === hat) it.hat = true;
    const slot = take(!!it.umbrella); if (slot == null) return null;
    scene.walk.push({ slot, ...it });
  }
  if (tier !== 'gentle') { const slot = take(true); if (slot == null) return null; scene.walk.push({ slot, kind: 'stop', route: r.int(11, 98) }); }
  let pool = tier === 'gentle' ? ['bike', ...r.shuffle(['tree', 'bench', 'dog', 'lamp'])] : r.shuffle(EXTRAS);
  if (hard) pool = [...pool, ...r.shuffle(['tree', 'lamp', 'bin'])];   // a second tree, lamp or can for the counting questions
  for (const kind of pool) {
    if (scene.walk.length >= nWalk) break;
    if (kind === 'bike' && scene.walk.some((w) => w.kind === 'bike')) continue;
    const slot = take(TALL.has(kind)); if (slot == null) continue;
    const it = { slot, kind };
    if (kind === 'bike') it.color = r.pick(COLOR_NAMES.filter((c) => c !== 'white' && c !== 'black'));
    scene.walk.push(it);
  }
  if (scene.walk.length < nWalk) return null;
  scene.walk.sort((a, b) => a.slot - b.slot);

  // road
  const rs = r.shuffle([0, 1, 2]), vcol = r.shuffle(COLOR_NAMES);
  if (hard) {
    const twin = r.pick(['car', 'van']), other = r.pick(['bus', 'truck', twin === 'car' ? 'van' : 'car']);
    const rack = r.int(0, 1);
    scene.road.push({ slot: rs[0], kind: twin, color: vcol[0], ...(rack === 0 ? { rack: true } : {}) });
    scene.road.push({ slot: rs[1], kind: twin, color: vcol[1], ...(rack === 1 ? { rack: true } : {}) });
    scene.road.push({ slot: rs[2], kind: other, color: vcol[2] });
  } else {
    const kinds = r.shuffle(['car', 'van', 'bus', 'truck']);
    for (let i = 0; i < T.road; i++) scene.road.push({ slot: rs[i], kind: kinds[i], color: vcol[i] });
  }
  scene.road.sort((a, b) => a.slot - b.slot);

  // a kite's tail never hangs over the clock tower
  if (scene.sky.flyer && scene.sky.flyer.kind === 'kite' && clockAt >= 0) {
    const b = shopBox(scene, clockAt), x = skyX(scene.sky.flyer.slot);
    if (Math.abs(x - (b.x + b.w / 2)) < 36) return null;
  }
  return scene;
}

const others = (r, arr, not, n) => r.shuffle(arr.filter((x) => x !== not)).slice(0, n);
const hhmm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

// WORDING (2026-11-13 on): a shop whose sign is a plural or a thing rather than
// a place reads "the Books shop", not "the Books". The first board (11-12) had
// gone live with the bare name and is frozen as it was.
const WORDING_FROM = '2026-11-13';
const NEEDS_SHOP = new Set(['BOOKS', 'TOYS', 'BIKES', 'PETS', 'PIZZA', 'MUSIC']);

function candidates(scene, tier, r, live) {
  const C = [], gentle = tier === 'gentle';
  const nmOf = (s) => cap(s.name) + (live >= WORDING_FROM && NEEDS_SHOP.has(s.name) ? ' shop' : '');
  const col = (name) => cap(name), colorPool = COLOR_NAMES.map(cap);
  const shopC = (i) => { const b = shopBox(scene, i); return b.x + b.w / 2; };
  const shopNames = (correct) => { const present = scene.shops.map((s) => cap(s.name)).filter((n) => n !== correct); const absent = r.shuffle(SHOPS.map(cap).filter((n) => !scene.shops.some((s) => cap(s.name) === n))); return [...r.shuffle(present), ...absent].slice(0, 3); };
  // vehicles
  const byKind = {}; for (const v of scene.road) (byKind[v.kind] = byKind[v.kind] || []).push(v);
  for (const [kind, list] of Object.entries(byKind)) {
    if (list.length === 1) C.push({ k: 'vcolor', g: 'veh' + list[0].slot, lvl: 1, t: kind === 'truck' ? "What color was the truck's cab?" : `What color was the ${kind}?`, c: col(list[0].color), d: others(r, colorPool, col(list[0].color), 3), ref: { kind }, at: [roadX(list[0].slot), ROAD - 30] });
    else if (list.filter((v) => v.rack).length === 1) { const v = list.find((x) => x.rack); C.push({ k: 'vrack', g: 'veh' + v.slot, lvl: 3, t: `What color was the ${kind} with the roof rack?`, c: col(v.color), d: [col(list.find((x) => !x.rack).color), ...others(r, colorPool.filter((x) => x !== col(list.find((y) => !y.rack).color)), col(v.color), 2)], ref: { kind }, at: [roadX(v.slot), ROAD - 30] }); }
  }
  if (scene.road.length >= 2) C.push({ k: 'count', g: 'count:vehicles', lvl: 2, t: 'How many vehicles were on the road?', n: scene.road.length, min: 1, ref: { what: 'vehicles' }, at: [roadX(scene.road[0].slot), ROAD - 30] });
  // sky
  const fl = scene.sky.flyer;
  if (fl) {
    C.push({ k: 'flyer', g: 'flyer', lvl: 1, t: 'What was flying above the street?', c: FLYER_NAMES[fl.kind], d: [...Object.values(FLYER_NAMES).filter((x) => x !== FLYER_NAMES[fl.kind]), 'Nothing'], ref: {}, at: [skyX(fl.slot), 28] });
    if (fl.kind !== 'plane') C.push({ k: 'flyercolor', g: 'flyer', lvl: 1, t: `What color was the ${FLYER_NAMES[fl.kind].replace(/^A /, '').toLowerCase()}?`, c: col(fl.color), d: others(r, colorPool, col(fl.color), 3), ref: {}, at: [skyX(fl.slot), 28] });
  } else C.push({ k: 'flyer', g: 'flyer', lvl: 2, t: 'What was flying above the street?', c: 'Nothing', d: Object.values(FLYER_NAMES), ref: {}, at: [skyX(2), 24] });
  if (scene.sky.birds) C.push({ k: 'count', g: 'count:birds', lvl: 2, t: 'How many birds were in the sky?', n: scene.sky.birds.n, min: 1, ref: { what: 'birds' }, at: [skyX(scene.sky.birds.slot), 30] });
  if (!gentle) C.push({ k: 'count', g: 'count:clouds', lvl: 2, t: 'How many clouds were in the sky?', n: scene.sky.clouds.length, min: 1, ref: { what: 'clouds' }, at: [skyX(scene.sky.clouds[0]), 32] });
  // sidewalk
  const people = scene.walk.filter((w) => w.kind === 'person');
  C.push({ k: 'count', g: 'count:people', lvl: gentle ? 1 : 2, t: 'How many people were on the sidewalk?', n: people.length, min: 1, ref: { what: 'people' }, at: [walkX(people[0].slot), WALK - 24] });
  for (const what of ['tree', 'lamp', 'bin']) { const n = scene.walk.filter((w) => w.kind === what).length; if (n >= 2) C.push({ k: 'count', g: 'count:' + what, lvl: 3, t: `How many ${what === 'tree' ? 'trees' : what === 'lamp' ? 'street lamps' : 'trash cans'} were on the sidewalk?`, n, min: 1, ref: { what }, at: [walkX(scene.walk.find((w) => w.kind === what).slot), WALK - 24] }); }
  const um = people.filter((p) => p.umbrella); if (um.length === 1) C.push({ k: 'umbrella', g: 'umbrella', lvl: 1, t: 'What color was the umbrella?', c: col(um[0].umbrella), d: others(r, colorPool, col(um[0].umbrella), 3), ref: {}, at: [walkX(um[0].slot) + 9, WALK - 66] });
  const hats = people.filter((p) => p.hat); if (hats.length === 1) C.push({ k: 'hatshirt', g: 'hat', lvl: 3, t: 'What color shirt did the person in the hat wear?', c: col(hats[0].color), d: [...r.shuffle(people.filter((p) => !p.hat).map((p) => col(p.color))).slice(0, 2), ...others(r, colorPool.filter((x) => !people.some((p) => col(p.color) === x)), '', 1)], ref: {}, at: [walkX(hats[0].slot), WALK - 28] });
  const bikes = scene.walk.filter((w) => w.kind === 'bike'); if (bikes.length === 1) C.push({ k: 'bike', g: 'bike', lvl: 1, t: 'What color was the bicycle?', c: col(bikes[0].color), d: others(r, colorPool, col(bikes[0].color), 3), ref: {}, at: [walkX(bikes[0].slot), WALK - 12] });
  const stops = scene.walk.filter((w) => w.kind === 'stop');
  if (stops.length === 1) { const n = stops[0].route, sw = Number(String(n).split('').reverse().join('')); const alts = [...new Set([sw, n + 1, n - 1, n + 10, n - 10].filter((x) => x >= 10 && x <= 99 && x !== n))]; C.push({ k: 'route', g: 'route', lvl: 2, t: 'What number was on the bus stop sign?', c: String(n), d: r.shuffle(alts).slice(0, 3).map(String), ref: {}, at: [walkX(stops[0].slot), WALK - 60] }); }
  const kindsHere = [...new Set(scene.walk.map((w) => w.kind))].filter((k) => k !== 'person');
  const kindsGone = Object.keys(WALK_NAMES).filter((k) => k !== 'person' && !kindsHere.includes(k));
  if (kindsHere.length >= 3 && kindsGone.length >= 1) { const gone = r.pick(kindsGone); C.push({ k: 'absent', g: 'absent', lvl: 3, t: 'Which of these was NOT on the sidewalk?', c: WALK_NAMES[gone], d: r.shuffle(kindsHere).slice(0, 3).map((k) => WALK_NAMES[k]), ref: {}, at: null }); }
  for (const side of ['left', 'right']) {
    const uniq = r.shuffle(kindsHere.filter((k) => scene.walk.filter((w) => w.kind === k).length === 1));
    for (const k of uniq) {
      const i = scene.walk.findIndex((w) => w.kind === k), nb = scene.walk[side === 'left' ? i - 1 : i + 1];
      if (!nb || Math.abs(nb.slot - scene.walk[i].slot) > 2) continue;
      const ans = WALK_NAMES[nb.kind];
      C.push({ k: 'neighbor', g: 'neighbor', lvl: 3, t: `On the sidewalk, what stood just to the ${side} of the ${WALK_NAMES[k].replace(/^An? /, '').toLowerCase()}?`, c: ans, d: others(r, [...new Set([...scene.walk.map((w) => WALK_NAMES[w.kind]), ...Object.values(WALK_NAMES)])].filter((x) => x !== WALK_NAMES[k]), ans, 3), ref: { of: k, side }, at: [walkX(nb.slot), WALK - 24] });
      break;
    }
  }
  // shops
  const n = scene.shops.length;
  const st = scene.shops.filter((s) => s.awning && s.awning.striped);
  if (st.length === 1 && scene.shops.filter((s) => s.awning).length >= 2) { const i = scene.shops.indexOf(st[0]); C.push({ k: 'striped', g: 'awning', lvl: 2, t: 'Which shop had the striped awning?', c: cap(st[0].name), d: shopNames(cap(st[0].name)), ref: {}, at: [shopC(i), BASE - 58] }); }
  r.shuffle([...scene.shops.keys()]).forEach((i) => {
    const s = scene.shops[i], nm = nmOf(s);
    if (s.awning && !s.awning.striped) C.push({ k: 'awningcolor', g: 'awning', lvl: gentle ? 1 : 2, t: `What color was the awning over the ${nm}?`, c: col(s.awning.color), d: others(r, colorPool.filter((x) => x !== 'White'), col(s.awning.color), 3), ref: { shop: s.name }, at: [shopC(i), BASE - 58] });
    C.push({ k: 'door', g: 'door', lvl: gentle ? 1 : 2, t: `What color was the door of the ${nm}?`, c: col(s.door), d: others(r, colorPool, col(s.door), 3), ref: { shop: s.name }, at: [shopC(i), BASE - 26] });
    if (!gentle) C.push({ k: 'windows', g: 'windows', lvl: 3, t: `How many upstairs windows did the ${nm} have?`, n: s.windows, fixed: [1, 2, 3, 4], ref: { shop: s.name }, at: [shopC(i), shopBox(scene, i).y + 18] });
    if (s.number) { const v = s.number, sw = Number(String(v).split('').reverse().join('')); const alts = [...new Set([sw, v + 1, v - 1, v + 10, v - 10, ...scene.shops.filter((x) => x !== s).map((x) => x.number)].filter((x) => x >= 10 && x <= 99 && x !== v))]; C.push({ k: 'number', g: 'number', lvl: 3, t: `What number was on the wall of the ${nm}?`, c: String(v), d: r.shuffle(alts).slice(0, 3).map(String), ref: { shop: s.name }, at: [shopC(i) + 27, BASE - 36] }); }
  });
  const end = r.pick(['left', 'right']), ei = end === 'left' ? 0 : n - 1;
  C.push({ k: 'far', g: 'side', lvl: 1, t: `Which shop stood at the far ${end} of the street?`, c: cap(scene.shops[ei].name), d: shopNames(cap(scene.shops[ei].name)), ref: { end }, at: [shopC(ei), BASE - 76] });
  if (n >= 3) { const ni = ei === 0 ? 1 : n - 2; C.push({ k: 'nextto', g: 'side', lvl: 3, t: `Which shop stood right beside the ${nmOf(scene.shops[ei])}?`, c: cap(scene.shops[ni].name), d: shopNames(cap(scene.shops[ni].name)).filter((x) => x !== cap(scene.shops[ei].name)), ref: { shop: scene.shops[ei].name }, at: [shopC(ni), BASE - 76] }); }
  const clk = scene.shops.findIndex((s) => s.clock);
  if (clk >= 0) { const { h, m } = scene.shops[clk].clock, a = hhmm(h, m); const sh = m / 5 === 0 ? 12 : m / 5, sm = (h % 12) * 5; const alts = [...new Set([hhmm(sh, sm), hhmm(h === 12 ? 1 : h + 1, m), hhmm(h === 1 ? 12 : h - 1, m), hhmm(h, (m + 15) % 60), hhmm(h, (m + 30) % 60)].filter((x) => x !== a))]; C.push({ k: 'clock', g: 'clock', lvl: 2, t: 'What time did the clock show?', c: a, d: [alts[0], ...r.shuffle(alts.slice(1)).slice(0, 2)], ref: {}, at: [shopC(clk), shopBox(scene, clk).y - 15] }); }
  return C.filter((q) => q.n != null || (q.d.length === 3 && new Set([q.c, ...q.d]).size === 4));
}

function choose(C, tier, r) {
  const T = TIERS[tier], hard = tier === 'tough' || tier === 'sunday';
  const out = [], used = new Set(); let counts = 0;
  const add = (q) => { if (used.has(q.g) || out.length >= T.qs) return false; if (q.k === 'count') { if (counts >= 2) return false; counts++; } used.add(q.g); out.push(q); return true; };
  const pool = r.shuffle(C);
  if (tier === 'gentle') { pool.filter((q) => q.lvl === 1).forEach(add); pool.filter((q) => q.lvl === 2).forEach(add); }
  else if (tier === 'moderate') { let n2 = 0; for (const q of pool) if (q.lvl === 2 && n2 < 4 && add(q)) n2++; let n1 = 0; for (const q of pool) if (q.lvl === 1 && n1 < 2 && add(q)) n1++; pool.filter((q) => q.lvl <= 2).forEach(add); }
  else { const want3 = tier === 'sunday' ? 5 : 4; let n3 = 0; for (const q of pool) if (q.lvl === 3 && n3 < want3 && add(q)) n3++; if (n3 < want3 - 1) return null; pool.filter((q) => q.lvl === 2).forEach(add); pool.forEach(add); }
  return out.length === T.qs ? r.shuffle(out) : null;
}

const slotCount = [0, 0, 0, 0];
let prevPattern = '';
function layOut(qs, r) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const trial = slotCount.slice(), res = [];
    for (const q of qs) {
      let slot, o;
      if (q.fixed) { o = q.fixed.map(String); slot = q.fixed.indexOf(q.n); }
      else {
        const order = r.shuffle([0, 1, 2, 3]).sort((a, b) => trial[a] - trial[b] + (r.chance(0.35) ? r.int(-1, 1) : 0));
        slot = order[0];
        if (q.n != null) { while (q.n - slot < q.min) slot--; o = [0, 1, 2, 3].map((i) => String(q.n - slot + i)); }
        else { const d = r.shuffle(q.d); o = d.slice(); o.splice(slot, 0, q.c); }
      }
      trial[slot]++; res.push({ t: q.t, o, a: slot, k: q.k, ref: q.ref, at: q.at });
    }
    const pattern = res.map((x) => x.a).join('');
    const per = [0, 1, 2, 3].map((s) => res.filter((x) => x.a === s).length);
    if (pattern === prevPattern || Math.max(...per) > Math.ceil(qs.length / 2)) continue;
    prevPattern = pattern; for (let i = 0; i < 4; i++) slotCount[i] = trial[i];
    return res;
  }
  throw new Error('could not lay out the answer slots');
}

const out = [];
let prevNames = '';
for (let d = new Date(`${START}T12:00:00Z`), num = 1; d <= new Date(`${END}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1), num++) {
  const live = d.toISOString().slice(0, 10), tier = tierOf(live), [y, m, dd] = live.split('-').map(Number);
  let done = null;
  for (let attempt = 0; attempt < 400 && !done; attempt++) {
    const r = mk(rng(hash(`witness:${live}:${attempt}`)));
    const scene = buildScene(tier, r); if (!scene) continue;
    const names = scene.shops.map((s) => s.name).sort().join();
    if (names === prevNames) continue;
    const qs = choose(candidates(scene, tier, r, live), tier, r); if (!qs) continue;
    done = { scene, qs: layOut(qs, r), names };
  }
  if (!done) throw new Error(`no scene for ${live}`);
  prevNames = done.names;
  out.push({ num, quizId: `witness-${m}-${dd}-${String(y).slice(2)}`, live, dateLabel: `${MONTHS[m - 1]} ${dd}, ${y}`, tier: TIERS[tier].label, study: TIERS[tier].study, objects: objectCount(done.scene), scene: done.scene, qs: done.qs });
}

const header = fs.readFileSync(new URL('./witness-header.txt', import.meta.url), 'utf8');
fs.writeFileSync(new URL('../app/witness/puzzles.js', import.meta.url), `${header}export const PUZZLES = [\n${out.map((p) => '  ' + JSON.stringify(p)).join(',\n')},\n];\n`);
console.log(`gen-witness: ${out.length} boards, ${out[0].live} to ${out[out.length - 1].live}; answer slots ${slotCount.join('/')}`);
