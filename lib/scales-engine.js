// lib/scales-engine.js: the one engine behind Scales, the daily balance-scale
// weights puzzle (owner, 2026-11-26: picked "the weights one" from a list of
// new ideas, approved the mockup and the weekly ramp, "build and implement").
//
// THE GAME. A few scales, each with shapes and numbered weights on its two
// arms. Every shape weighs a whole number from 1 to the day's ceiling, and
// each shape weighs the same on every scale. Most scales balance; on the
// harder days one or two are drawn tilted, which only says which arm is
// heavier. The player gives every shape a weight and presses Check: each scale
// then swings to where THOSE weights put it, and the board says how many scales
// match the picture. It never says which shape is wrong. Ranked on checks, then
// the clock (owner, 2026-11-26: "Checks then time").
//
// Imported by the client (app/scales/ScalesClient.jsx), the generator
// (scripts/gen-scales.mjs) and the checker (scripts/verify-scales.mjs), so the
// board a player sees, the board the bank stores and the proof that it has one
// answer all come from the same code. Never change how an existing board is
// built: a live board is frozen (docs/claude/daily-authoring.md), and the
// checker rebuilds every board from its stored seed.
//
// A SIDE is a list of tokens: a shape letter ('a' to 'f') or a number (a
// numbered weight). A SCALE is { L, R, t } with t '=' (balanced), '>' (the
// left arm is heavier and hangs low) or '<' (the right arm is).

export const SHAPES = ['a', 'b', 'c', 'd', 'e', 'f'];
export const SHAPE_NAME = { a: 'Circle', b: 'Triangle', c: 'Square', d: 'Diamond', e: 'Hexagon', f: 'Star' };
// The site's soft pastels, one a shape. The shapes also differ in outline, so
// colour is never the only thing telling two apart.
export const SHAPE_FILL = { a: '#bbd7f0', b: '#f6d889', c: '#bfe0c4', d: '#f4c7a1', e: '#d4c5f2', f: '#f5bdd0' };

// The weekly ramp (owner, 2026-11-26, approved as proposed):
//   n       shapes, and the same number of scales
//   max     every shape weighs 1 to max
//   tilted  [min, max] scales drawn tilted
//   nums    [min, max] numbered weights on the whole board
//   both    a shape may sit on both arms of one scale (you cancel before you solve)
//   side    most tokens on one arm
export const BANDS = {
  gentle: { label: 'Gentle', n: 3, max: 9, tilted: [0, 0], nums: [2, 3], both: false, side: 3 },
  moderate: { label: 'Moderate', n: 4, max: 12, tilted: [0, 0], nums: [1, 2], both: true, side: 4 },
  tough: { label: 'Tough', n: 5, max: 20, tilted: [1, 2], nums: [1, 1], both: true, side: 4 },
  sunday: { label: 'Sunday Edition', n: 6, max: 20, tilted: [2, 2], nums: [1, 2], both: true, side: 4 },
};
// Mon, Tue Gentle · Wed, Thu, Fri Moderate · Sat Tough · Sun the Sunday Edition.
export function bandOf(live) {
  const d = new Date(`${live}T12:00:00Z`).getUTCDay();
  return d === 0 ? 'sunday' : d === 6 ? 'tough' : d <= 2 ? 'gentle' : 'moderate';
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── weighing ────────────────────────────────────────────────────────────────
const isNum = (tok) => typeof tok === 'number';
const idx = (tok) => SHAPES.indexOf(tok);
// The weight on one arm. `vals` is one number per shape, in SHAPES order; a
// shape with no weight yet counts as 0.
export function sideSum(side, vals) {
  let s = 0;
  for (const tok of side) s += isNum(tok) ? tok : (Number(vals[idx(tok)]) || 0);
  return s;
}
// Where a scale sits under a set of weights: '=', '>' (left heavier) or '<'.
export function tiltOf(scale, vals) {
  const d = sideSum(scale.L, vals) - sideSum(scale.R, vals);
  return d === 0 ? '=' : d > 0 ? '>' : '<';
}
// One entry a scale: true when the weights put it where the picture has it.
export function matches(P, vals) { return P.scales.map((sc) => tiltOf(sc, vals) === sc.t); }
export function isSolved(P, vals) {
  return vals.length >= P.n && vals.slice(0, P.n).every((v) => Number.isInteger(v) && v >= 1 && v <= P.max) && matches(P, vals).every(Boolean);
}

// ── the proof: how many answers does a board have ───────────────────────────
// A scale as a linear row: sum(coef[i] * x[i]) compared with k.
function rowOf(scale, n) {
  const coef = new Array(n).fill(0);
  let k = 0;
  for (const tok of scale.L) { if (isNum(tok)) k -= tok; else coef[idx(tok)] += 1; }
  for (const tok of scale.R) { if (isNum(tok)) k += tok; else coef[idx(tok)] -= 1; }
  return { coef, k, t: scale.t };
}
// Counts whole-number answers in 1..max, stopping at `limit`. A balanced scale
// with one shape left unknown fixes that shape outright; otherwise the next
// shape is tried at every weight. Exact: no rounding, no shortcuts.
// `chain: true` refuses to try anything, so it answers "does one-unknown-at-a-
// time reading alone solve this board" (the Gentle test).
export function countAnswers(n, max, scales, { limit = 2, chain = false } = {}) {
  const rows = scales.map((sc) => rowOf(sc, n));
  const x = new Array(n).fill(0);
  let count = 0, first = null, stuck = false;
  const holds = (r, lhs) => (r.t === '=' ? lhs === r.k : r.t === '>' ? lhs > r.k : lhs < r.k);
  function go() {
    if (count >= limit) return;
    let forced = -1, forcedV = 0;
    for (const r of rows) {
      let lhs = 0, open = 0, at = -1;
      for (let i = 0; i < n; i++) {
        if (!r.coef[i]) continue;
        if (x[i]) lhs += r.coef[i] * x[i]; else { open++; at = i; }
      }
      if (open === 0) { if (!holds(r, lhs)) return; continue; }
      if (open === 1 && r.t === '=' && forced < 0) {
        const num = r.k - lhs;
        if (num % r.coef[at] !== 0) return;
        const v = num / r.coef[at];
        if (v < 1 || v > max) return;
        forced = at; forcedV = v;
      }
    }
    if (forced >= 0) { x[forced] = forcedV; go(); x[forced] = 0; return; }
    const free = x.indexOf(0);
    if (free < 0) { count++; if (!first) first = x.slice(); return; }
    if (chain) { stuck = true; return; }
    for (let v = 1; v <= max && count < limit; v++) { x[free] = v; go(); }
    x[free] = 0;
  }
  go();
  return { count, first, stuck };
}

// ── building a board ────────────────────────────────────────────────────────
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const key = (side) => side.slice().sort().join('');
// A random arm of 1 to `most` shapes from the first n, leaning small.
function randSide(r, n, most) {
  const len = 1 + Math.floor(r() * r() * most + r() * 1.2);
  const out = [];
  for (let i = 0; i < Math.min(most, Math.max(1, len)); i++) out.push(SHAPES[Math.floor(r() * n)]);
  return out.sort();
}
const shares = (L, R) => L.some((t) => R.includes(t));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// One candidate scale, or null when the dice gave something unusable.
function randScale(r, B, sol, kind) {
  const L = randSide(r, B.n, B.side), R0 = kind === 'num' && r() < 0.3 ? [] : randSide(r, B.n, B.side);
  if (!B.both && shares(L, R0)) return null;
  // at most one kind of shape on both arms: one thing to cancel, not a pile of noise
  if (new Set(L.filter((t) => R0.includes(t))).size > 1) return null;
  if (key(L) === key(R0)) return null;
  // A shape on both arms must leave something on each arm once cancelled.
  const row = rowOf({ L, R: R0, t: '=' }, B.n);
  if (row.coef.every((c) => c === 0)) return null;
  const d = sideSum(L, sol) - sideSum(R0, sol);
  if (kind === 'tilt') {
    if (d === 0 || !row.coef.some((c) => c > 0) || !row.coef.some((c) => c < 0)) return null;
    return { L, R: R0, t: d > 0 ? '>' : '<' };
  }
  if (kind === 'num') {
    if (d === 0) return null;
    const w = Math.abs(d);
    if (w > 60) return null;
    const light = d > 0 ? R0 : L;
    if (light.length + 1 > B.side) return null;
    return d > 0 ? { L, R: [...R0, w], t: '=' } : { L: [...L, w], R: R0, t: '=' };
  }
  // 'plain': balances with no numbered weight
  if (d !== 0 || !R0.length) return null;
  // 2 circles = 2 squares is 1 circle = 1 square drawn twice
  const g = row.coef.reduce((a, c) => gcd(a, c), 0);
  if (g > 1) return null;
  return { L, R: R0, t: '=' };
}

// buildBoard(seed, band): the board for one seed, or null when that seed does
// not give one inside its try budget (the generator then moves to the next).
// Deterministic: same seed and band, same board, on any machine.
export function buildBoard(seed, band) {
  const B = BANDS[band];
  const r = rng(seed);
  for (let attempt = 0; attempt < 6000; attempt++) {
    // distinct weights, so no two shapes are secretly the same thing
    const pool = [];
    for (let v = 1; v <= B.max; v++) pool.push(v);
    const sol = [];
    for (let i = 0; i < B.n; i++) sol.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    const tilts = B.tilted[0] + Math.floor(r() * (B.tilted[1] - B.tilted[0] + 1));
    const nums = B.nums[0] + Math.floor(r() * (B.nums[1] - B.nums[0] + 1));
    const kinds = [];
    for (let i = 0; i < B.n; i++) kinds.push(i < nums ? 'num' : i < nums + tilts ? 'tilt' : 'plain');
    const scales = [];
    let ok = true;
    for (const kind of kinds) {
      let sc = null;
      for (let t = 0; t < 400 && !sc; t++) {
        const c = randScale(r, B, sol, kind);
        if (!c) continue;
        // no scale twice, in either direction
        const a = key(c.L) + '|' + key(c.R), b = key(c.R) + '|' + key(c.L);
        if (scales.some((s) => { const k2 = key(s.L) + '|' + key(s.R); return k2 === a || k2 === b; })) continue;
        sc = c;
      }
      if (!sc) { ok = false; break; }
      scales.push(sc);
    }
    if (!ok) continue;
    if (!SHAPES.slice(0, B.n).every((s) => scales.some((sc) => sc.L.includes(s) || sc.R.includes(s)))) continue;
    if (B.both && band === 'moderate' && !scales.some((sc) => shares(sc.L, sc.R))) continue;
    if (scales.filter((sc) => shares(sc.L, sc.R)).length > 2) continue;
    if (countAnswers(B.n, B.max, scales).count !== 1) continue;
    if (band === 'gentle' && countAnswers(B.n, B.max, scales, { chain: true }).stuck) continue;
    if (band === 'moderate' && !countAnswers(B.n, B.max, scales, { chain: true }).stuck && r() < 0.6) continue;
    // every tilted scale has to earn its place: without it, more than one answer
    if (tilts && !scales.every((sc, i) => sc.t === '=' || countAnswers(B.n, B.max, scales.filter((_, j) => j !== i)).count > 1)) continue;
    // shuffle the order so the numbered scales are not always on top
    const order = scales.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { n: B.n, max: B.max, sol, scales: order.map((i) => scales[i]) };
  }
  return null;
}

// ── drawing ─────────────────────────────────────────────────────────────────
// One token as SVG, centred on (cx, cy) in a box `s` wide. `label` is the
// number printed on it: the player's weight on a shape, the weight's own
// number on a numbered weight.
export function tokenSvg(tok, cx, cy, s, label) {
  const h = s / 2, ink = '#0b0f1a';
  const txt = (y, fill, size) => (label === '' || label == null ? '' : `<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Manrope,system-ui,sans-serif" font-weight="800" font-size="${size}" fill="${fill}">${label}</text>`);
  if (isNum(tok)) {
    return `<rect x="${cx - s * 0.13}" y="${cy - h}" width="${s * 0.26}" height="${s * 0.22}" rx="${s * 0.11}" fill="none" stroke="${ink}" stroke-width="2"/>`
      + `<path d="M${cx - s * 0.3} ${cy - h + s * 0.2}h${s * 0.6}l${s * 0.2} ${s * 0.8}h-${s}z" fill="${ink}"/>${txt(cy + s * 0.13, '#ffffff', s * 0.42)}`;
  }
  const f = SHAPE_FILL[tok], st = `fill="${f}" stroke="${ink}" stroke-width="1"`;
  const fs = s * 0.44;
  if (tok === 'a') return `<circle cx="${cx}" cy="${cy}" r="${h - 0.5}" ${st}/>${txt(cy, ink, fs)}`;
  if (tok === 'b') return `<polygon points="${cx},${cy - h + 0.5} ${cx + h - 0.5},${cy + h - 0.5} ${cx - h + 0.5},${cy + h - 0.5}" ${st}/>${txt(cy + s * 0.17, ink, fs * 0.9)}`;
  if (tok === 'c') return `<rect x="${cx - h + 1}" y="${cy - h + 1}" width="${s - 2}" height="${s - 2}" rx="3" ${st}/>${txt(cy, ink, fs)}`;
  if (tok === 'd') return `<polygon points="${cx},${cy - h + 0.5} ${cx + h - 0.5},${cy} ${cx},${cy + h - 0.5} ${cx - h + 0.5},${cy}" ${st}/>${txt(cy, ink, fs * 0.82)}`;
  if (tok === 'e') {
    const q = h - 0.5, w = q * 0.5;
    return `<polygon points="${cx - w},${cy - q} ${cx + w},${cy - q} ${cx + q},${cy} ${cx + w},${cy + q} ${cx - w},${cy + q} ${cx - q},${cy}" ${st}/>${txt(cy, ink, fs)}`;
  }
  // 'f': a five-point star with a wide body so a number still fits
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? (h - 0.5) * 0.56 : h - 0.5, a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" ${st}/>${txt(cy + s * 0.04, ink, fs * 0.78)}`;
}
// A shape on its own (the weight chips, the tile, the rules).
export function shapeSvg(tok, size = 28, label = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${tokenSvg(tok, size / 2, size / 2, size, label)}</svg>`;
}

// One scale as an SVG string, 340 wide. `vals` prints the player's weights on
// the shapes; `tilt` is where the beam sits ('=', '>' or '<').
export const SCALE_W = 340, SCALE_H = 84, BEAM_Y = 56;
const TOK = 30, TGAP = 5, PAD = 10, INK = '#0b0f1a';
// Everything that swings: the tokens on both arms and the beam under them.
export function beamSvg(scale, vals) {
  const place = (side, left) => side.map((tok, i) => {
    const x0 = left ? PAD + 6 : SCALE_W - PAD - 6 - (side.length * TOK + (side.length - 1) * TGAP);
    const cx = x0 + i * (TOK + TGAP) + TOK / 2;
    const label = isNum(tok) ? tok : (vals && vals[idx(tok)] ? vals[idx(tok)] : '');
    return tokenSvg(tok, cx, BEAM_Y - TOK / 2 - 1, TOK, label);
  }).join('');
  return `${place(scale.L, true)}${place(scale.R, false)}<rect x="${PAD}" y="${BEAM_Y}" width="${SCALE_W - PAD * 2}" height="4" rx="2" fill="${INK}"/>`;
}
// The stand it swings on.
export const FULCRUM = `${SCALE_W / 2},${BEAM_Y + 4} ${SCALE_W / 2 + 14},${SCALE_H} ${SCALE_W / 2 - 14},${SCALE_H}`;
export const tiltDeg = (tilt) => (tilt === '>' ? -5 : tilt === '<' ? 5 : 0);
export function scaleSvg(scale, vals, tilt) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCALE_W} ${SCALE_H}" width="100%" role="img" aria-label="${scaleLabel(scale)}">`
    + `<g transform="rotate(${tiltDeg(tilt)} ${SCALE_W / 2} ${BEAM_Y + 4})">${beamSvg(scale, vals)}</g>`
    + `<polygon points="${FULCRUM}" fill="${INK}"/></svg>`;
}
const sideWords = (side) => {
  if (!side.length) return 'nothing';
  const n = {};
  for (const tok of side) { const w = isNum(tok) ? `${/^(8|11|18)$|^8\d$/.test(String(tok)) ? 'an' : 'a'} ${tok} weight` : SHAPE_NAME[tok].toLowerCase(); n[w] = (n[w] || 0) + 1; }
  return Object.entries(n).map(([w, c]) => (/ weight$/.test(w) ? w : c > 1 ? `${c} ${w}s` : `a ${w}`)).join(' and ');
};
export function scaleLabel(scale) {
  const verb = scale.t === '=' ? 'balances' : scale.t === '>' ? 'is heavier than' : 'is lighter than';
  return `${sideWords(scale.L)} ${verb} ${sideWords(scale.R)}`.replace(/^./, (c) => c.toUpperCase());
}
