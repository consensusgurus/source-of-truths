// Proves the category ramp rather than trusting its comments.
//
// Run: node scripts/verify-category-ramp.mjs
//
// Five checks, and the reason each exists:
//
//   1. EVERY REGISTRY CATEGORY MAPS. A category nobody remembered to add would
//      silently fall back to sky, which is Word's colour, so an unmapped
//      category does not look broken, it looks like Word. That is the failure
//      mode this exists to catch, and it is exactly what happened to the ramp
//      once already: the roster grew to nine categories against eight steps.
//   2. INK CONTRAST. Every step carries RAMP_INK at 4.5:1 or better. The whole
//      premise of a pastel ramp is that one dark ink works on all of it.
//   3. GROUND CONTRAST. Every step carries against the near-black stage, so a
//      lit rung and an unlit one are tellable at 3:1 or better.
//   4. NO DUPLICATE STEPS. Two categories sharing a hex is the collision the
//      ramp was created to end.
//   5. HUE SPACING, as a WARNING and deliberately not a failure. Only one
//      category is on screen at a time on a stage, so neighbours may sit close
//      there and two of them do. It is NOT a pending task: the owner ruled on
//      2026-08-30 that the home's bands (CAT_BLUE, lib/home-blues.js) and this
//      ramp are independent systems, so the home is not adopting these values
//      and its own >=30 degree rule does not reach them. The check stays only
//      because it would matter if that ever changed.

// The app's modules use the '@/' alias and extensionless relative imports,
// neither of which plain node resolves. Register the shared hook first, then
// import dynamically, because the hook has to be installed before the import
// is resolved. Same pattern as scripts/verify-endgame-board.mjs.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';
register('./alias-loader.mjs', import.meta.url);

const {
  RAMP_ORDER, CATEGORY_RAMP, RAMP_INK, STAGE_GROUND,
  CATEGORY_RAMP_LIGHT, RAMP_INK_LIGHT, STAGE_GROUND_LIGHT,
  CATEGORY_RAMP_INK_LIGHT,
  rampIndexFor, gameColor, gameColorLight, gameAccentInkLight,
} = await import('../lib/category-ramp.js');
const { DAILY_GAMES } = await import('../lib/daily-games.js');

const INK_MIN = 4.5;
const GROUND_MIN = 3;
const HUE_MIN = 30;

let fails = 0;
let warns = 0;
const fail = (m) => { console.error('✗ ' + m); fails += 1; };
const warn = (m) => { console.warn('… ' + m); warns += 1; };
const ok = (m) => console.log('ok    ' + m);

function rgb(hex) {
  const h = String(hex).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function lum(hex) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function hue(hex) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const apart = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

// ── 1. lengths and coverage ────────────────────────────────────────────────
if (RAMP_ORDER.length !== CATEGORY_RAMP.length) {
  fail(`RAMP_ORDER has ${RAMP_ORDER.length} categories and CATEGORY_RAMP has ${CATEGORY_RAMP.length} steps`);
} else {
  ok(`${RAMP_ORDER.length} categories, ${CATEGORY_RAMP.length} steps`);
}

const registryCats = [...new Set(DAILY_GAMES.map((g) => g.cat).filter(Boolean))];
for (const cat of registryCats) {
  if (rampIndexFor(cat) < 0) fail(`registry category "${cat}" maps to no ramp step, so it renders as Word`);
}
if (registryCats.every((c) => rampIndexFor(c) >= 0)) {
  ok(`all ${registryCats.length} registry categories map: ${registryCats.join(', ')}`);
}
for (const cat of RAMP_ORDER) {
  if (!registryCats.some((c) => c.toLowerCase() === cat.toLowerCase())) {
    warn(`ramp lists "${cat}" but no game carries it, so that step is unused`);
  }
}

// Every game resolves to a real step.
const bad = DAILY_GAMES.filter((g) => !CATEGORY_RAMP.includes(gameColor(g.key)));
if (bad.length) fail(`${bad.length} games resolve outside the ramp: ${bad.slice(0, 5).map((g) => g.key).join(', ')}`);
else ok(`all ${DAILY_GAMES.length} games resolve to a ramp step`);

// ── 2, 3, 4. contrast and collisions ───────────────────────────────────────
const seen = new Map();
CATEGORY_RAMP.forEach((hex, i) => {
  const cat = RAMP_ORDER[i] || `step ${i}`;
  const ink = contrast(hex, RAMP_INK);
  const gnd = contrast(hex, STAGE_GROUND);
  if (ink < INK_MIN) fail(`${cat} ${hex}: ink ${RAMP_INK} is ${ink.toFixed(2)}:1, under ${INK_MIN}`);
  if (gnd < GROUND_MIN) fail(`${cat} ${hex}: ground ${STAGE_GROUND} is ${gnd.toFixed(2)}:1, under ${GROUND_MIN}`);
  if (seen.has(hex)) fail(`${cat} repeats ${hex}, already used by ${seen.get(hex)}`);
  seen.set(hex, cat);
  if (ink >= INK_MIN && gnd >= GROUND_MIN) {
    ok(`${cat.padEnd(17)} ${hex}  ink ${ink.toFixed(2)}:1  ground ${gnd.toFixed(2)}:1  hue ${Math.round(hue(hex))}`);
  }
});

// ── 5. hue spacing between neighbours ──────────────────────────────────────
for (let i = 1; i < CATEGORY_RAMP.length; i += 1) {
  const d = apart(hue(CATEGORY_RAMP[i - 1]), hue(CATEGORY_RAMP[i]));
  if (d < HUE_MIN) {
    warn(`${RAMP_ORDER[i - 1]} and ${RAMP_ORDER[i]} are ${Math.round(d)} degrees apart, under ${HUE_MIN}. `
      + 'Accepted: only one category is on screen at a time on a stage, and the home '
      + 'bands are a separate table by owner ruling. Not a task.');
  }
}

// ── 6. THE LIGHT REGISTER, held to the same standard ──────────────────────
// A light ramp that fails its ink is worse than no light ramp: it ships a
// toggle that makes half the roster unreadable.
if (CATEGORY_RAMP_LIGHT.length !== CATEGORY_RAMP.length) {
  fail(`light ramp has ${CATEGORY_RAMP_LIGHT.length} steps against ${CATEGORY_RAMP.length} dark`);
}
if (RAMP_INK_LIGHT.length !== CATEGORY_RAMP_LIGHT.length) {
  fail(`light ink table has ${RAMP_INK_LIGHT.length} entries against ${CATEGORY_RAMP_LIGHT.length} steps`);
}
const seenL = new Map();
CATEGORY_RAMP_LIGHT.forEach((hex, i) => {
  const cat = RAMP_ORDER[i] || `step ${i}`;
  // ONE INK PER STEP. Six steps carry white; the three warm ones stay pastel
  // and carry the near-black, because gold dark enough for white text is brown
  // (owner, 2026-08-31). So the ink checked here is the step's own.
  const inkHex = RAMP_INK_LIGHT[i];
  const dark = inkHex !== '#ffffff';
  const ink = contrast(hex, inkHex);
  const gnd = contrast(hex, STAGE_GROUND_LIGHT);
  if (ink < INK_MIN) fail(`light ${cat} ${hex}: ink ${inkHex} is ${ink.toFixed(2)}:1, under ${INK_MIN}`);
  // GROUND CONTRAST IS A FAILURE ONLY FOR THE WHITE-INK STEPS. A pastel fill on
  // a pale ground is ~1.7:1 against it by construction, which is the accepted
  // cost of keeping the warm hues true: the edge of a warm accent chip is soft
  // in light mode, while the text on it runs 8:1 and up. Stated rather than
  // silently exempted.
  if (gnd < GROUND_MIN && !dark) fail(`light ${cat} ${hex}: pale ground is ${gnd.toFixed(2)}:1, under ${GROUND_MIN}`);
  if (gnd < GROUND_MIN && dark) warn(`light ${cat} ${hex}: pale ground is ${gnd.toFixed(2)}:1, under ${GROUND_MIN}. Accepted: this step keeps its pastel and carries dark ink, so its fill has a soft edge on white and its text does not. Not a task.`);
  if (seenL.has(hex)) fail(`light ${cat} repeats ${hex}, already used by ${seenL.get(hex)}`);
  seenL.set(hex, cat);
  // The two registers must be the SAME CATEGORY, which means the same hue. A
  // light ramp that drifts in hue is a second colour system wearing the first
  // one's names, and a reader who flips the toggle loses every association
  // they had built.
  //
  // ONE EXEMPTION, and it is a decision rather than an oversight: LOGIC.
  // Lime dark enough to carry white text is olive, which is inherent to a dark
  // yellow-green, and the owner chose two clean colours over one muddy one
  // (2026-08-31). Lime on the dark register, green on the light. Any OTHER
  // category drifting in hue is still a failure.
  const HUE_EXEMPT = new Set(['Logic']);
  const d = apart(hue(hex), hue(CATEGORY_RAMP[i]));
  if (d > 25 && !HUE_EXEMPT.has(cat)) fail(`light ${cat} is ${Math.round(d)} degrees from its dark step, so it is a different colour`);
  if (d > 25 && HUE_EXEMPT.has(cat)) warn(`light ${cat} is ${Math.round(d)} degrees from its dark step, by owner decision: dark lime goes olive, so this register is green instead.`);
  if (ink >= INK_MIN && (gnd >= GROUND_MIN || dark) && (d <= 25 || HUE_EXEMPT.has(cat))) {
    ok(`light ${cat.padEnd(17)} ${hex}  ${dark ? 'dark ' : 'white'} ink ${ink.toFixed(2)}:1  ground ${gnd.toFixed(2)}:1  ${Math.round(d)} deg from dark`);
  }
});
const badL = DAILY_GAMES.filter((g) => !CATEGORY_RAMP_LIGHT.includes(gameColorLight(g.key)));
if (badL.length) fail(`${badL.length} games resolve outside the light ramp`);
else ok(`all ${DAILY_GAMES.length} games resolve to a light step`);

// ── 5b. THE ACCENT AS TEXT MUST BE READABLE ON PAPER ────────────────────────
//
// CATEGORY_RAMP_LIGHT is measured above as a GROUND carrying RAMP_INK_LIGHT,
// which is a different question from whether it can be ink on the light
// register's own surfaces. Three of its steps are pastels and could not: gold
// measured 1.68:1 on the ground, orange 2.00 and amber 1.47, and that is what
// the reader hit as "does not work on Light mode". CATEGORY_RAMP_INK_LIGHT is
// the answer, and this holds it to the same 4.5:1 the ink table is held to, on
// all three light surfaces a page actually paints: the ground, a card, and the
// recessed --stg-surf2. It also holds each step within 25 degrees of the FILL
// it deepens, for the same reason the light ramp is held to its dark twin: an
// ink that drifts in hue is a second colour system wearing the first one's name.
{
  const LIGHT_SURFACES = [['ground', STAGE_GROUND_LIGHT], ['card', '#ffffff'], ['surf2', '#e4e9f1']];
  if (CATEGORY_RAMP_INK_LIGHT.length !== RAMP_ORDER.length) fail('the text ramp has a different length from RAMP_ORDER');
  RAMP_ORDER.forEach((cat, i) => {
    const hex = CATEGORY_RAMP_INK_LIGHT[i];
    const fill = CATEGORY_RAMP_LIGHT[i];
    const worst = Math.min(...LIGHT_SURFACES.map(([, s]) => contrast(hex, s)));
    let d = Math.abs(hue(hex) - hue(fill));
    if (d > 180) d = 360 - d;
    if (worst < INK_MIN) fail(`light TEXT ${cat} ${hex} is ${worst.toFixed(2)}:1 on a light surface`);
    else if (d > 25) fail(`light TEXT ${cat} is ${Math.round(d)} degrees from the fill it deepens`);
    else ok(`light TEXT ${cat.padEnd(17)} ${hex}  worst surface ${worst.toFixed(2)}:1  ${Math.round(d)} deg from its fill`);
  });
  const badT = DAILY_GAMES.filter((g) => !CATEGORY_RAMP_INK_LIGHT.includes(gameAccentInkLight(g.key)));
  if (badT.length) fail(`${badT.length} games resolve outside the light text ramp`);
  else ok(`all ${DAILY_GAMES.length} games resolve to a light text step`);
}

// ── 6. NO STAGE CLIENT MAY DISAGREE WITH THE REGISTRY ABOUT ITS OWN CATEGORY ─
//
// Every daily client passes a hand-written cat="..." to StageChrome. That prop
// used to OUTRANK gameCategory(gameKey), which made it eighty hand-kept copies
// of a fact the roster already holds, and copies drift. Two had, and only one
// of them was noticed: when Sudoku split out of Numbers on 2026-09-01 all nine
// grids kept announcing "Numbers" in their own eyebrow while the stage around
// them was already painted with the Sudoku step, because every other consumer
// read the registry. Carve had been announcing "Logic" against a registry that
// files it under Numbers, live and unnoticed, for far longer.
//
// StageChrome now takes the registry first and the prop only as a fallback, so
// a stale prop can no longer reach a reader. This check exists anyway, because
// a prop that disagrees is still a lie sitting in the file, and the next person
// to read it will believe it.
{
  // fileURLToPath, not .pathname: on Windows the pathname of a file URL is
  // '/C:/...', and readdirSync of that resolved to 'C:\C:\...' and threw, which
  // failed every autodeploy job that named this verifier (2026-09-11).
  const APP = fileURLToPath(new URL('../app/', import.meta.url));
  const byKey = new Map(DAILY_GAMES.map((g) => [g.key, g.cat]));
  let checked = 0, drifted = 0;
  for (const dir of readdirSync(APP)) {
    const reg = byKey.get(dir);
    if (!reg) continue;
    const full = APP + dir;
    if (!existsSync(full) || !statSync(full).isDirectory()) continue;
    for (const f of readdirSync(full)) {
      if (!/Client\.jsx$/.test(f)) continue;
      const m = readFileSync(full + '/' + f, 'utf8').match(/cat="([^"]+)"/);
      if (!m) continue;
      checked += 1;
      if (m[1] !== reg) {
        drifted += 1;
        fail(`app/${dir}/${f} passes cat="${m[1]}" but the registry says "${reg}"`);
      }
    }
  }
  if (!drifted) ok(`all ${checked} stage clients agree with the registry about their category`);
}

console.log(fails ? `\n${fails} failed, ${warns} warned` : `\nramp clean, ${warns} warned`);
process.exit(fails ? 1 : 0);
