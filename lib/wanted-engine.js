// lib/wanted-engine.js: the scene engine behind Wanted, the enormous hidden
// figure hunt (owner, 2026-11-26: "as interesting as a where's waldo page, but
// humongous. It should play like search", then "Lots of different districts").
//
// A board is NOT stored as a picture. It is a seed and a list of districts,
// and this file builds the whole scene from them: every figure, landmark,
// lookalike and thing to find. The browser runs the same build and draws the
// scene itself at whatever zoom the player is at, so it is sharp at any size
// and a board costs a few hundred bytes to ship.
//
// THREE RULES THAT KEEP A LIVE BOARD FROM MOVING:
//   1. The build may only use the seeded generator (`R`) and exact arithmetic:
//      + - * /, Math.floor, Math.sqrt, Math.abs, Math.min, Math.max. NEVER
//      Math.sin, cos, log, pow, random or Date in anything that decides where
//      something goes. Those differ between browsers in the last bit, and one
//      flipped comparison moves every figure placed after it. Drawing code may
//      use anything (it decides nothing).
//   2. A district builder that has appeared on a board is FROZEN. Do not edit
//      it, reorder its calls, or change a shared helper it uses in a way that
//      changes what it consumes from `R`. New ideas go in NEW districts, new
//      scenes, new lost things and new one-of-a-kind people appended to the END
//      of their lists (a board takes them by seeded shuffle of the list as it
//      was at WANTED_ENGINE version `v`, see `poolFor`).
//   3. scripts/verify-wanted.mjs rebuilds every board and compares its
//      checksum to the one stored when it was generated. A red checksum means
//      a frozen builder moved: put it back.
//
// Pure: no imports, safe on the client and in node.

export const WANTED_DW = 1600; // a district, in scene units
export const WANTED_DH = 1200;
const DW = WANTED_DW, DH = WANTED_DH;
const OUT = '#26221e';

// ---- the seeded generator --------------------------------------------------
export function wantedRng(seed) {
  let a = seed | 0;
  return function R() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mix(seed, k) {
  let h = (seed ^ Math.imul(k + 1, 0x9E3779B1)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B); h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return (h ^ (h >>> 16)) | 0;
}

// ---- palettes ---------------------------------------------------------------
const SKIN = ['#f6d2b0', '#eebf96', '#d9a273', '#b97c4e', '#8a5a36', '#6b4226'];
const HAIR = ['#2b2118', '#4a3220', '#7a4b22', '#c9973f', '#e6cf7a', '#9a9a9a', '#b5452c', '#1a1a1a'];
const TOPS = ['#e2564b', '#3f7fd1', '#f2c230', '#58b06b', '#e88a3a', '#8f6ad0', '#e77fb0', '#49b8c4', '#f1ede2', '#5b6470', '#c44a7a', '#2f9c8f', '#d9d2b8', '#7fa650'];
const BOTS = ['#3a4a6b', '#5a4a3a', '#2f2f35', '#8a7a5a', '#4f6f4a', '#7a3b3b', '#566a8a', '#c9c2a8'];
const CAPS = ['#e2564b', '#3f7fd1', '#f2c230', '#ffffff', '#2f2f35', '#3f9b4b', '#e88a3a'];
const SCARVES = ['#3f7fd1', '#e2564b', '#f2c230', '#8f6ad0', '#ffffff'];
const GREEN = '#3f9b4b', ORANGE = '#f08a24';

// ---- drawing primitives ------------------------------------------------------
function rr(g, x, y, w, h, r) {
  r = r || 1.4;
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); g.stroke();
}
function box(g, c, x, y, w, h, r) { g.fillStyle = c; rr(g, x, y, w, h, r || 2); }
function poly(g, c, pts) { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); g.stroke(); }
function circ(g, c, x, y, r) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); }
function oval(g, c, x, y, rx, ry, rot) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 7); g.fill(); g.stroke(); }
function line(g, pts, w, c) { g.save(); if (w) g.lineWidth = w; if (c) g.strokeStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); g.restore(); }
function shadow(g, x, y, rx, ry) { g.fillStyle = 'rgba(0,0,0,.13)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }
function pen(g) { g.lineWidth = 0.8; g.strokeStyle = OUT; g.lineCap = 'round'; g.lineJoin = 'round'; }
function label(g, t, x, y, px, c) { g.fillStyle = c || OUT; g.font = `800 ${px || 9}px Manrope, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(t, x, y); }

// ---- a figure -----------------------------------------------------------------
// (x, y) is where the feet stand. `o` is the outfit. `lod` 0 draws the far-away
// version (a body, a head, a hat colour); 1 draws everything.
export function wantedPerson(g, x, y, o, lod) {
  const s = o.s || 1;
  if (!lod) {
    const h = 30 * s, w = 9 * s, yy = y - (o.lift || 0);
    g.fillStyle = o.suit ? (o.suitC || '#fff') : o.top; g.fillRect(x - w / 2, yy - h * 0.72, w, h * 0.72);
    if (!o.dress && !o.suit) { g.fillStyle = o.bottom; g.fillRect(x - w / 2, yy - h * 0.3, w, h * 0.3); }
    g.fillStyle = o.hat && o.hatC ? o.hatC : (o.hairStyle === 'bald' ? o.skin : o.hair);
    g.fillRect(x - w * 0.45, yy - h, w * 0.9, h * 0.14);
    g.fillStyle = o.skin; g.fillRect(x - w * 0.42, yy - h * 0.88, w * 0.84, h * 0.2);
    return;
  }
  g.save(); g.translate(x, y - (o.lift || 0)); g.scale(o.flip ? -s : s, s); pen(g);
  if (!o.noShadow) shadow(g, 0, (o.lift || 0) / s, 7, 2.4);
  const sit = o.pose === 'sit', by = sit ? -4 : -10;
  if (o.pose === 'lean') g.rotate(-0.28);
  if (o.pose === 'bow') { g.translate(0, -2); g.rotate(0.9); }
  if (o.stilts) { line(g, [-2.4, 0, -2.4, o.stilts, 2.4, 0, 2.4, o.stilts], 1.4, '#8a6240'); }
  const hy = by - 17;
  if (o.cape) { g.fillStyle = o.cape; g.beginPath(); g.moveTo(-5, by - 12); g.lineTo(5, by - 12); g.lineTo(8.5, -3); g.lineTo(-8.5, -3); g.closePath(); g.fill(); g.stroke(); }
  if (o.suit === 'ghost') {
    g.fillStyle = '#fbfaf5'; g.beginPath(); g.moveTo(-7, -1); g.lineTo(-6, hy); g.quadraticCurveTo(0, hy - 9, 6, hy); g.lineTo(7, -1); g.lineTo(4, -3.5); g.lineTo(1.5, -1); g.lineTo(-1.5, -3.5); g.lineTo(-4, -1); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = OUT; g.beginPath(); g.ellipse(-2, hy + 1, 1, 1.6, 0, 0, 7); g.ellipse(2.2, hy + 1, 1, 1.6, 0, 0, 7); g.fill(); g.restore(); return;
  }
  if (o.suit === 'blob') {
    g.fillStyle = OUT; g.fillRect(-4.4, -1.7, 4.2, 1.9); g.fillRect(0.4, -1.7, 4.2, 1.9); g.fillStyle = o.bottom || '#2f2f35'; rr(g, -3.6, -8, 3, 7); rr(g, 0.8, -8, 3, 7);
    oval(g, o.suitC, 0, by - 9, 6.4, 15, o.suitTilt || 0);
    if (o.suitStripe) line(g, [-2, by - 20, 2, by - 15, -2, by - 10, 2, by - 5, -1, by], 1.6, o.suitStripe);
    circ(g, o.skin, 0, by - 11, 3.2); g.fillStyle = OUT; g.beginPath(); g.arc(-1.1, by - 11.4, 0.5, 0, 7); g.arc(1.3, by - 11.4, 0.5, 0, 7); g.fill();
    g.restore(); return;
  }
  if (o.dress) {
    poly(g, o.top, [-4, by - 4, 4, by - 4, 7, -2, -7, -2]);
    g.fillStyle = o.skin; g.fillRect(-3, -2, 2, 2); g.fillRect(1, -2, 2, 2);
  } else {
    g.fillStyle = o.bottom;
    if (sit) rr(g, -4.5, -5, 11, 4.4);
    else { rr(g, -4.2, by, 3.6, 9); rr(g, 0.6, by, 3.6, 9); g.fillStyle = o.shoe || OUT; g.fillRect(-4.6, -1.7, 4.4, 1.9); g.fillRect(0.2, -1.7, 4.4, 1.9); }
  }
  g.fillStyle = o.top; rr(g, -4.7, by - 12, 9.4, 12.6, 2);
  if (o.stripes) { g.fillStyle = o.stripes; for (let k = 0; k < 3; k++) g.fillRect(-4.3, by - 10.4 + k * 3.6, 8.6, 1.5); }
  if (o.dots) { g.fillStyle = o.dots; [[-2, by - 8], [2, by - 5], [-1, by - 2], [2.5, by - 10]].forEach((d) => { g.beginPath(); g.arc(d[0], d[1], 1, 0, 7); g.fill(); }); }
  if (o.vest) { g.fillStyle = o.vest; g.fillRect(-4.3, by - 11.4, 2.6, 11.4); g.fillRect(1.7, by - 11.4, 2.6, 11.4); }
  if (o.bones) { line(g, [0, by - 11, 0, by - 1, -3, by - 9, 3, by - 9, -3, by - 6, 3, by - 6, -3, by - 3, 3, by - 3], 1, '#fff'); }
  if (o.wrap) { line(g, [-4.5, by - 9, 4.5, by - 7, -4.5, by - 5, 4.5, by - 3], 0.6, '#8a8372'); }
  if (!o.dress && !o.stripes && !o.dots && !o.bones && !o.wrap && !sit) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-4.3, by - 1, 8.6, 1.1); }
  g.strokeStyle = OUT; g.lineWidth = 3.6;
  const arms = () => {
    g.beginPath();
    if (o.pose === 'up') { g.moveTo(-4.4, by - 10); g.lineTo(-8, by - 19); g.moveTo(4.4, by - 10); g.lineTo(8, by - 19); }
    else if (o.pose === 'fwd' || o.pose === 'lean' || o.pose === 'bow') { g.moveTo(3, by - 9); g.lineTo(10.5, by - 9.5); }
    else if (o.item) { g.moveTo(-4.8, by - 10); g.lineTo(-6, by - 3); g.moveTo(4.4, by - 10); g.lineTo(8, by - 14); }
    else { g.moveTo(-4.9, by - 10); g.lineTo(-6.2, by - 2.6); g.moveTo(4.9, by - 10); g.lineTo(6.2, by - 2.6); }
    g.stroke();
  };
  arms(); g.strokeStyle = o.sleeve || o.top; g.lineWidth = 2.4; arms(); g.strokeStyle = OUT; g.lineWidth = 0.8;
  if (o.scarf) { g.fillStyle = o.scarf; rr(g, -4.6, by - 13, 9.2, 3, 1); rr(g, 1.4, by - 11, 2.6, 6.5, 1); }
  if (o.hat === 'veil') { g.fillStyle = '#fff'; rr(g, -5.6, hy - 4, 11.2, 15, 3); }
  if (o.hairStyle === 'long') { g.fillStyle = o.hair; rr(g, -5, hy - 3.4, 10, 10.5, 3); }
  if (o.visor) { circ(g, '#f4f4f0', 0, hy, 6.2); }
  circ(g, o.skin, 0, hy, 4.4);
  g.fillStyle = o.hair;
  if (o.hairStyle === 'rainbow') { ['#e2564b', '#f2c230', '#58b06b', '#3f7fd1', '#8f6ad0'].forEach((c, i) => circ(g, c, -5 + i * 2.5, hy - 3.2 + Math.abs(i - 2) * 1.2, 2.6)); }
  else if (o.hairStyle === 'mohawk') rr(g, -1.3, hy - 9.5, 2.6, 7, 1);
  else if (o.hairStyle !== 'bald' && o.hat !== 'helmet' && !o.visor && !o.hood) {
    g.beginPath(); g.arc(0, hy - 0.4, 4.5, Math.PI * 1.02, -0.06); g.closePath(); g.fill(); g.stroke();
    if (o.hairStyle === 'bun') circ(g, o.hair, 0, hy - 5.4, 2.1);
  }
  if (o.hood) { g.fillStyle = o.hood; g.beginPath(); g.arc(0, hy, 4.9, 0, 7); g.fill(); g.stroke(); g.fillStyle = o.skin; g.fillRect(-3.4, hy - 1.2, 6.8, 2.6); }
  g.fillStyle = OUT; g.beginPath(); g.arc(-1.5, hy + 0.5, 0.62, 0, 7); g.arc(1.7, hy + 0.5, 0.62, 0, 7); g.fill();
  if (!o.stache && !o.beard && !o.nose && !o.mask && !o.hood) { g.beginPath(); g.arc(0.1, hy + 1.7, 1.5, 0.25, Math.PI - 0.25); g.lineWidth = 0.55; g.stroke(); g.lineWidth = 0.8; }
  if (o.nose) circ(g, o.nose, 0.2, hy + 1.8, 1.3);
  if (o.beard) { g.fillStyle = o.beard; g.beginPath(); g.moveTo(-4, hy + 1); g.quadraticCurveTo(0, hy + (o.beardLong ? 14 : 8), 4, hy + 1); g.closePath(); g.fill(); g.stroke(); }
  if (o.stache) { g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(0.1, hy + 2.5, 3.1, 1.1, 0, 0, 7); g.fill(); }
  if (o.mask) { g.fillStyle = o.mask === true ? '#7fd0e6' : o.mask; rr(g, -3.9, hy - 1.3, 7.8, 3, 1); if (o.mask === true) line(g, [4, hy + 1, 5.5, hy - 7], 1.3, '#e2564b'); else { g.fillStyle = '#fff'; g.fillRect(-2.4, hy - 0.4, 1.6, 1.1); g.fillRect(1, hy - 0.4, 1.6, 1.1); } }
  if (o.antennae) { line(g, [-2, hy - 4, -4, hy - 10, 2, hy - 4, 4, hy - 10], 0.8); circ(g, '#f2c230', -4, hy - 10.6, 1.2); circ(g, '#f2c230', 4, hy - 10.6, 1.2); }
  const hc = o.hatC || '#888'; g.fillStyle = hc;
  switch (o.hat) {
    case 'cap': g.beginPath(); g.arc(0, hy - 1.2, 4.7, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); rr(g, 0.5, hy - 2.2, 6.6, 1.6, 0.7); break;
    case 'sun': oval(g, hc, 0, hy - 2.6, 8, 2.3); g.beginPath(); g.arc(0, hy - 2.8, 4, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); break;
    case 'top': rr(g, -3.5, hy - 11.5, 7, 8.5, 1); rr(g, -5.6, hy - 3.8, 11.2, 1.8, 0.8); break;
    case 'beret': oval(g, hc, 0.9, hy - 3.6, 5.4, 2.6, -0.15); break;
    case 'helmet': circ(g, '#b9bec6', 0, hy, 4.9); g.fillStyle = OUT; g.fillRect(-3, hy - 0.4, 6, 1.3); g.fillStyle = '#e2564b'; rr(g, -1, hy - 9.5, 2, 5, 1); break;
    case 'tricorn': poly(g, '#2f2f35', [-7, hy - 2.2, 0, hy - 8, 7, hy - 2.2]); break;
    case 'chef': g.fillStyle = '#fff'; rr(g, -3.6, hy - 10, 7.2, 7, 2.5); break;
    case 'wizard': poly(g, hc, [-6.5, hy - 2.4, 0, hy - 17, 6.5, hy - 2.4]); circ(g, '#f2c230', -0.5, hy - 8, 1); break;
    case 'witch': poly(g, hc, [-4.6, hy - 3, 0.6, hy - 16, 4.6, hy - 3]); rr(g, -7.5, hy - 3.8, 15, 1.8, 0.8); break;
    case 'cowboy': oval(g, hc, 0, hy - 3, 8.6, 2.2); rr(g, -3.6, hy - 8.6, 7.2, 5.6, 2.2); break;
    case 'jester': poly(g, hc, [-4.4, hy - 2.6, -8, hy - 10, -1, hy - 5.4, 0, hy - 5.4, 8, hy - 10, 4.4, hy - 2.6]); circ(g, '#f2c230', -8, hy - 10.4, 1.3); circ(g, '#f2c230', 8, hy - 10.4, 1.3); break;
    case 'santa': poly(g, '#d8402f', [-4.6, hy - 2.6, 5.5, hy - 11, 4.6, hy - 2.6]); g.fillStyle = '#fff'; rr(g, -5, hy - 4, 10, 2.2, 1); circ(g, '#fff', 5.8, hy - 11.2, 1.6); break;
    case 'mortar': poly(g, '#2f2f35', [-7, hy - 5.5, 0, hy - 8.5, 7, hy - 5.5, 0, hy - 2.8]); line(g, [5, hy - 5.4, 6, hy - 0.5], 0.8, '#f2c230'); break;
    case 'hard': g.beginPath(); g.arc(0, hy - 1.4, 5, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); rr(g, -5.8, hy - 2.2, 11.6, 1.6, 0.7); break;
    case 'elf': poly(g, hc, [-4.6, hy - 2.6, 3, hy - 13, 4.6, hy - 2.6]); circ(g, '#f2c230', 3.2, hy - 13.4, 1.2); break;
    case 'fedora': oval(g, hc, 0, hy - 3.2, 7.4, 1.9); rr(g, -3.8, hy - 8, 7.6, 5, 1.6); g.fillStyle = OUT; g.fillRect(-3.6, hy - 4.6, 7.2, 1.1); break;
    case 'sailor': g.fillStyle = '#fff'; rr(g, -4.4, hy - 6.6, 8.8, 3.4, 1.2); break;
    case 'crown': poly(g, '#f2c230', [-4.2, hy - 3, -4.2, hy - 9, -2, hy - 6.2, 0, hy - 9.6, 2, hy - 6.2, 4.2, hy - 9, 4.2, hy - 3]); break;
    case 'horns': g.beginPath(); g.fillStyle = '#b9bec6'; g.arc(0, hy - 1.2, 4.8, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); poly(g, '#f1ede2', [-4.4, hy - 3.4, -8, hy - 9, -3, hy - 5.2]); poly(g, '#f1ede2', [4.4, hy - 3.4, 8, hy - 9, 3, hy - 5.2]); break;
    case 'tall': rr(g, -3.4, hy - 13, 6.8, 9.6, 1.4); g.fillStyle = '#f2c230'; g.fillRect(-3.2, hy - 5.6, 6.4, 1.3); rr(g, -0.8, hy - 17, 1.6, 4.4, 0.8); break;
    default: break;
  }
  if (o.visor) { g.fillStyle = 'rgba(120,200,235,.55)'; g.beginPath(); g.arc(0, hy, 4.6, 0, 7); g.fill(); g.stroke(); }
  const hx = 8, hyy = by - 14;
  switch (o.item) {
    case 'balloon': case 'balloons': {
      const n = o.item === 'balloons' ? 7 : 1;
      for (let i = 0; i < n; i++) {
        const bx = hx + (n > 1 ? (i - 3) * 3.4 : 1), byy = hyy - (n > 1 ? 26 + ((i * 7) % 5) * 3 : 20);
        line(g, [hx, hyy, bx, byy + 4.5]); oval(g, n > 1 ? TOPS[i % TOPS.length] : o.itemC, bx, byy, 4, 4.8);
      }
      break;
    }
    case 'cone': poly(g, '#d9a25a', [hx - 1.6, hyy - 1, hx + 1.6, hyy - 1, hx, hyy + 3.5]); circ(g, o.itemC, hx, hyy - 2.4, 2.2); break;
    case 'umbrella': line(g, [hx, hyy, hx - 2, hyy - 17]); g.fillStyle = o.itemC; g.beginPath(); g.arc(hx - 2, hyy - 17, 10, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); break;
    case 'bouquet': circ(g, '#e77fb0', hx, hyy - 3, 1.8); circ(g, '#f2c230', hx + 2, hyy - 1.5, 1.8); circ(g, '#e2564b', hx - 2, hyy - 1.5, 1.8); break;
    case 'glass': circ(g, 'rgba(160,215,240,.6)', hx + 1, hyy - 2, 3); line(g, [hx - 1, hyy, hx - 3.4, hyy + 3.4], 1.4); break;
    case 'palette': oval(g, '#c9a36a', hx + 1, hyy, 4, 2.8); circ(g, '#e2564b', hx, hyy - 0.6, 0.9); circ(g, '#3f7fd1', hx + 2.2, hyy + 0.4, 0.9); break;
    case 'drum': box(g, '#e2564b', -4.5, by - 6, 9, 6, 1.5); g.fillStyle = '#fff'; g.fillRect(-4.2, by - 6, 8.4, 1.4); break;
    case 'flag': line(g, [hx, hyy + 2, hx, hyy - 16], 1); poly(g, o.itemC, [hx, hyy - 16, hx + 9, hyy - 13, hx, hyy - 10]); break;
    case 'bag': box(g, o.itemC, 5, by - 5, 5.5, 6, 1.2); break;
    case 'skis': line(g, [-6, 0.6, 9, 0.6], 1.6, o.itemC); line(g, [-9, by - 4, -9, 1], 0.9); line(g, [9.5, by - 4, 9.5, 1], 0.9); break;
    case 'board': oval(g, o.itemC, hx + 1, by - 8, 2.6, 13, 0.12); break;
    case 'case': box(g, o.itemC, 5.5, -6.5, 6.5, 6, 1.2); break;
    case 'rod': line(g, [hx, hyy, hx + 12, hyy - 16], 0.9, '#5a4a3a'); line(g, [hx + 12, hyy - 16, hx + 13, hyy + 8], 0.5); break;
    default: break;
  }
  if (o.parrot) { oval(g, '#58b06b', -5.5, by - 15, 2.2, 3.4); circ(g, '#e2564b', -5.5, by - 18.6, 1.9); g.fillStyle = '#f2c230'; g.fillRect(-8.2, by - 19, 2, 1.2); }
  if (o.child) wantedPerson(g, 0, hy - 4.5, Object.assign({}, o.child, { noShadow: 1, pose: 'sit', s: 0.7 }), 1);
  g.restore();
}

// ---- animals and small props ---------------------------------------------------
function dog(g, x, y, c, o) {
  o = o || {}; g.save(); g.translate(x, y); g.scale((o.flip ? -1 : 1) * (o.s || 1), o.s || 1); pen(g); shadow(g, 0, 0, 8, 2);
  g.fillStyle = c; rr(g, -6, -3.6, 2, 3.8, 0.6); rr(g, 3.2, -3.6, 2, 3.8, 0.6); oval(g, c, 0, -6, 7, 3.6); line(g, [-6.5, -7, -10, -11]);
  circ(g, c, 7.4, -9.4, 3.4); oval(g, o.ear || c, 5.8, -11.6, 1.5, 2.6, 0.4);
  if (o.collar) { g.fillStyle = o.collar; g.fillRect(3.6, -8, 1.6, 4); }
  g.fillStyle = OUT; g.beginPath(); g.arc(8.4, -9.8, 0.6, 0, 7); g.arc(10.6, -8.8, 0.8, 0, 7); g.fill(); g.restore();
}
function animal(g, kind, x, y, flip, s) {
  g.save(); g.translate(x, y); g.scale((flip ? -1 : 1) * (s || 1), s || 1); pen(g);
  if (kind === 'duck') { oval(g, '#f2c230', 0, -3, 4.4, 3); circ(g, '#f2c230', 3.6, -6.4, 2.4); g.fillStyle = '#e88a3a'; g.fillRect(5.6, -6.8, 2.4, 1.3); g.restore(); return; }
  if (kind === 'pigeon') { oval(g, '#9aa0a8', 0, -2.4, 3.6, 2.4); circ(g, '#9aa0a8', 3, -4.8, 1.6); g.restore(); return; }
  if (kind === 'lobster') { oval(g, '#d8402f', 0, -3, 6, 3); circ(g, '#d8402f', 8, -7, 2.4); circ(g, '#d8402f', 8, 0, 2.4); g.restore(); return; }
  if (kind === 'penguin') { shadow(g, 0, 0, 5, 1.6); oval(g, '#2f2f35', 0, -8, 4.6, 8); oval(g, '#fff', 0.6, -6.6, 2.8, 5.6); g.fillStyle = '#e88a3a'; g.fillRect(2.6, -12, 2.8, 1.4); g.fillRect(-2.4, -1, 2.4, 1.4); g.fillRect(0.6, -1, 2.4, 1.4); g.restore(); return; }
  const spec = { cow: ['#f4f1ea', 15, 8, 9], sheep: ['#f4f1ea', 11, 7, 6], pig: ['#f2b8c0', 11, 6.4, 5], horse: ['#8a5a36', 15, 7.5, 12], elephant: ['#9aa0a8', 24, 14, 13], lion: ['#d9a25a', 14, 7, 7], giraffe: ['#e9c46a', 13, 7, 16], goat: ['#d9d2b8', 10, 6, 7], bear: ['#6b4a32', 16, 10, 8], camel: ['#c9a36a', 16, 8, 12] }[kind] || ['#b98a5a', 12, 7, 7];
  const [c, bw, bh, leg] = spec; shadow(g, 0, 0, bw, 3);
  g.fillStyle = c; rr(g, -bw * 0.7, -leg, 3, leg, 1); rr(g, -bw * 0.25, -leg, 3, leg, 1); rr(g, bw * 0.25, -leg, 3, leg, 1); rr(g, bw * 0.6, -leg, 3, leg, 1);
  oval(g, c, 0, -leg - bh * 0.6, bw, bh);
  if (kind === 'sheep') { for (let i = -2; i <= 2; i++) circ(g, c, i * 4.4, -leg - bh * 1.2, 3.4); }
  if (kind === 'cow') { g.fillStyle = '#2f2f35'; g.beginPath(); g.ellipse(-4, -leg - bh * 0.7, 4, 3, 0.4, 0, 7); g.ellipse(6, -leg - bh * 0.4, 3, 2.4, 0, 0, 7); g.fill(); }
  if (kind === 'giraffe') { g.fillStyle = c; rr(g, bw * 0.55, -leg - bh - 24, 5, 28, 2); g.fillStyle = '#b97c4e'; [[-5, -leg - 6], [3, -leg - 9], [bw * 0.7, -leg - 20], [bw * 0.75, -leg - 30]].forEach((d) => { g.beginPath(); g.arc(d[0], d[1], 1.8, 0, 7); g.fill(); }); circ(g, c, bw * 0.75 + 3, -leg - bh - 27, 4); }
  else if (kind === 'elephant') { circ(g, c, bw * 0.95, -leg - bh * 0.9, 9); oval(g, '#868c94', bw * 0.55, -leg - bh * 0.95, 5, 8, -0.2); g.fillStyle = c; rr(g, bw * 1.2, -leg - bh * 0.8, 4, 17, 2); }
  else if (kind === 'camel') { circ(g, c, -2, -leg - bh * 1.5, 5); g.fillStyle = c; rr(g, bw * 0.7, -leg - bh - 12, 4, 14, 2); circ(g, c, bw * 0.9, -leg - bh - 13, 3.6); }
  else { const hx = bw * 0.95, hy = -leg - bh * (kind === 'horse' ? 1.5 : 0.9); if (kind === 'horse') { g.fillStyle = c; rr(g, bw * 0.55, -leg - bh * 1.6, 5, 10, 2); } if (kind === 'lion') circ(g, '#b97c4e', hx, hy, 6.6); circ(g, c, hx + (kind === 'horse' ? 3 : 0), hy, kind === 'pig' ? 4 : 4.6); if (kind === 'pig') circ(g, '#e89aa6', hx + 3.6, hy + 0.6, 1.7); g.fillStyle = OUT; g.beginPath(); g.arc(hx + (kind === 'horse' ? 4 : 1.4), hy - 0.8, 0.7, 0, 7); g.fill(); }
  line(g, [-bw, -leg - bh * 0.7, -bw - 4, -leg - bh * 0.2]);
  g.restore();
}
const TREE_C = { round: ['#5fa052', '#6fb35f', '#7cc06a'], autumn: ['#d98a3a', '#e5a04a', '#c96a2a'], blossom: ['#f2a7c0', '#f6c3d4', '#e88aa8'], dark: ['#3f7a4a', '#4b8a55', '#57985f'] };
function tree(g, x, y, kind) {
  pen(g);
  if (kind === 'pine' || kind === 'snowpine') {
    shadow(g, x, y, 18, 5); box(g, '#7a5236', x - 3, y - 16, 6, 16, 1);
    const c = kind === 'snowpine' ? '#4b8a65' : '#3f8a52';
    for (let k = 0; k < 3; k++) { poly(g, c, [x - 20 + k * 4, y - 12 - k * 16, x, y - 44 - k * 16, x + 20 - k * 4, y - 12 - k * 16]); if (kind === 'snowpine') poly(g, '#fff', [x - 8 + k * 2, y - 30 - k * 16, x, y - 44 - k * 16, x + 8 - k * 2, y - 30 - k * 16]); }
    return;
  }
  if (kind === 'palm') {
    shadow(g, x, y, 14, 4); g.fillStyle = '#a07a4a'; g.beginPath(); g.moveTo(x - 3, y); g.quadraticCurveTo(x + 6, y - 30, x + 2, y - 58); g.lineTo(x + 7, y - 58); g.quadraticCurveTo(x + 12, y - 30, x + 4, y); g.closePath(); g.fill(); g.stroke();
    [[-26, -8], [-18, -24], [0, -28], [20, -22], [28, -6]].forEach((d) => { g.fillStyle = '#4fa35a'; g.beginPath(); g.moveTo(x + 4, y - 58); g.quadraticCurveTo(x + 4 + d[0] * 0.5, y - 62 + d[1], x + 4 + d[0], y - 56 + d[1] * 0.2 + 8); g.quadraticCurveTo(x + 4 + d[0] * 0.5, y - 54 + d[1] * 0.6, x + 4, y - 58); g.fill(); g.stroke(); });
    return;
  }
  const cs = TREE_C[kind] || TREE_C.round;
  shadow(g, x, y, 26, 6); box(g, '#8a6240', x - 4, y - 30, 8, 30, 2);
  circ(g, cs[0], x - 16, y - 44, 20); circ(g, cs[1], x + 15, y - 46, 20); circ(g, cs[2], x, y - 62, 23); circ(g, cs[1], x - 2, y - 40, 18);
}
function bush(g, x, y, c) { pen(g); circ(g, c || '#6fb35f', x - 7, y - 6, 8); circ(g, c || '#6fb35f', x + 7, y - 6, 8); circ(g, c || '#7cc06a', x, y - 10, 9); }
function stall(g, x, y, c, name, cook) {
  pen(g); shadow(g, x, y, 50, 5); box(g, '#f3ead2', x - 42, y - 44, 84, 44); box(g, '#6b4a32', x - 34, y - 34, 68, 16); box(g, '#c9a36a', x - 46, y - 18, 92, 6);
  for (let i = 0; i < 8; i++) poly(g, i % 2 ? c : '#fff', [x - 48 + i * 12, y - 44, x - 36 + i * 12, y - 44, x - 37 + i * 12, y - 58, x - 45 + i * 12, y - 58]);
  if (name) label(g, name, x, y - 5, 8);
  if (cook) wantedPerson(g, x - 10, y - 17, cook, 1);
}
function building(g, x, y, w, h, c, roof, o) {
  o = o || {}; pen(g); shadow(g, x + w / 2, y, w * 0.55, 6); box(g, c, x, y - h, w, h, 2);
  if (roof === 'flat') box(g, o.roofC || '#8a8f98', x - 4, y - h - 8, w + 8, 10, 2);
  else if (roof === 'gable') poly(g, o.roofC || '#b5533c', [x - 8, y - h, x + w / 2, y - h - (o.roofH || 34), x + w + 8, y - h]);
  else if (roof === 'cone') poly(g, o.roofC || '#b5533c', [x - 6, y - h, x + w / 2, y - h - (o.roofH || 50), x + w + 6, y - h]);
  const cols = Math.max(1, Math.floor((w - 16) / 26)), rows = Math.max(1, Math.floor((h - 34) / 30));
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) box(g, o.win || '#bfe0ee', x + 12 + k * ((w - 24) / cols) + ((w - 24) / cols - 14) / 2, y - h + 12 + r * 30, 14, 16, 1.5);
  if (!o.noDoor) { g.fillStyle = o.door || '#5a4030'; g.beginPath(); g.moveTo(x + w / 2 - 9, y); g.lineTo(x + w / 2 - 9, y - 22); g.quadraticCurveTo(x + w / 2, y - 30, x + w / 2 + 9, y - 22); g.lineTo(x + w / 2 + 9, y); g.closePath(); g.fill(); g.stroke(); }
  if (o.sign) { box(g, o.signC || '#f3ead2', x + w / 2 - o.sign.length * 3.4 - 6, y - (o.signY || 46), o.sign.length * 6.8 + 12, 13, 2); label(g, o.sign, x + w / 2, y - (o.signY || 46) + 10, 9); }
}
function tentA(g, x, y, c, c2) { pen(g); shadow(g, x, y, 30, 5); poly(g, c, [x - 28, y, x, y - 34, x + 28, y]); poly(g, c2 || '#2f2f35', [x - 8, y, x, y - 22, x + 8, y]); line(g, [x, y - 34, x, y - 40]); }
function bench(g, x, y) { pen(g); box(g, '#8a6240', x - 22, y - 14, 44, 5); box(g, '#8a6240', x - 18, y - 9, 4, 9); box(g, '#8a6240', x + 14, y - 9, 4, 9); }
function lamp(g, x, y) { pen(g); box(g, '#3a3f48', x - 1.5, y - 44, 3, 44, 1); circ(g, '#ffe9a3', x, y - 47, 5); }
function fence(g, x0, y, x1, c) { pen(g); g.fillStyle = c || '#c9a36a'; for (let x = x0; x <= x1; x += 14) rr(g, x - 1.5, y - 14, 3, 14, 1); g.fillRect(x0, y - 11, x1 - x0, 2.2); g.fillRect(x0, y - 5.5, x1 - x0, 2.2); g.strokeRect(x0, y - 11, x1 - x0, 2.2); g.strokeRect(x0, y - 5.5, x1 - x0, 2.2); }
function signpost(g, x, y, text, c) { pen(g); box(g, '#7a5236', x - 2.5, y - 46, 5, 46, 1); const w = text.length * 8.4 + 22; box(g, c || '#fff7dc', x - w / 2, y - 74, w, 30, 5); label(g, text, x, y - 53, 14); }
function fountain(g, x, y) { pen(g); oval(g, '#c9c4b8', x, y + 4, 70, 38); oval(g, '#8fd0ea', x, y + 2, 60, 30); box(g, '#c9c4b8', x - 8, y - 40, 16, 40); oval(g, '#c9c4b8', x, y - 38, 22, 7); g.save(); g.strokeStyle = '#fff'; g.lineWidth = 2; [-1, 1].forEach((d) => { g.beginPath(); g.moveTo(x, y - 42); g.quadraticCurveTo(x + d * 20, y - 64, x + d * 30, y - 24); g.stroke(); }); g.restore(); }
function boat(g, x, y, c, kind) {
  pen(g); poly(g, c, [x - 34, y - 12, x + 34, y - 12, x + 24, y + 4, x - 24, y + 4]);
  if (kind === 'sail') { line(g, [x, y - 12, x, y - 70], 1.6, '#5a4030'); poly(g, '#fff', [x + 2, y - 68, x + 34, y - 18, x + 2, y - 18]); poly(g, '#f6c9d6', [x - 2, y - 60, x - 26, y - 18, x - 2, y - 18]); }
  if (kind === 'fish') { box(g, '#f3ead2', x - 10, y - 30, 20, 18, 2); box(g, '#bfe0ee', x - 6, y - 26, 12, 8, 1); line(g, [x + 20, y - 12, x + 30, y - 44], 1.2, '#5a4030'); }
}
function car(g, x, y, c, kind) {
  pen(g); shadow(g, x, y, 26, 4);
  if (kind === 'bus') { box(g, c, x - 44, y - 34, 88, 30, 5); for (let i = 0; i < 5; i++) box(g, '#bfe0ee', x - 38 + i * 16, y - 29, 12, 11, 2); }
  else if (kind === 'truck') { box(g, '#f1ede2', x - 34, y - 36, 46, 32, 3); box(g, c, x + 12, y - 26, 22, 22, 3); box(g, '#bfe0ee', x + 18, y - 22, 12, 9, 2); }
  else { box(g, c, x - 24, y - 16, 48, 13, 4); poly(g, c, [x - 14, y - 16, x - 8, y - 27, x + 10, y - 27, x + 16, y - 16]); box(g, '#bfe0ee', x - 7, y - 25, 8, 8, 1.5); box(g, '#bfe0ee', x + 2, y - 25, 8, 8, 1.5); }
  const wx = kind === 'bus' ? 30 : (kind === 'truck' ? 22 : 15); circ(g, '#2f2f35', x - wx, y - 3, 5); circ(g, '#2f2f35', x + wx, y - 3, 5); circ(g, '#b9bec6', x - wx, y - 3, 2); circ(g, '#b9bec6', x + wx, y - 3, 2);
}
function crate(g, x, y, s) { pen(g); s = s || 18; box(g, '#c9a36a', x - s / 2, y - s, s, s, 1.5); line(g, [x - s / 2, y - s, x + s / 2, y, x + s / 2, y - s, x - s / 2, y]); }
function barrel(g, x, y) { pen(g); box(g, '#a07a4a', x - 7, y - 18, 14, 18, 4); line(g, [x - 7, y - 13, x + 7, y - 13, x - 7, y - 5, x + 7, y - 5]); }
function table(g, x, y, c) { pen(g); oval(g, '#fff', x, y - 12, 14, 6); line(g, [x, y - 10, x, y], 1.6, '#5a4030'); line(g, [x, y - 12, x, y - 40], 1.2, '#5a4030'); g.fillStyle = c; g.beginPath(); g.arc(x, y - 40, 18, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); }
function towel(g, x, y, c, um) { pen(g); g.save(); g.translate(x, y); g.transform(1, 0, -0.3, 1, 0, 0); box(g, c, -18, -8, 36, 16, 2); g.fillStyle = '#fff'; g.fillRect(-17, -3, 34, 2.4); g.restore(); if (um) { line(g, [x + 14, y - 2, x + 14, y - 44], 1.4, '#5a4030'); g.fillStyle = um; g.beginPath(); g.arc(x + 14, y - 44, 22, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); for (let i = -1; i <= 1; i++) line(g, [x + 14, y - 66, x + 14 + i * 14, y - 44], 0.6); } }
function blanket(g, x, y, c) { pen(g); g.save(); g.translate(x, y); g.transform(1, 0, -0.3, 1, 0, 0); box(g, '#fff', -34, -16, 68, 32, 2); g.fillStyle = c; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) g.fillRect(-33 + i * 11, -15 + j * 10, 11, 10); g.restore(); }
function snowman(g, x, y) { pen(g); shadow(g, x, y, 10, 3); circ(g, '#fff', x, y - 8, 9); circ(g, '#fff', x, y - 21, 6.6); circ(g, '#fff', x, y - 31, 4.6); g.fillStyle = '#e88a3a'; g.fillRect(x, y - 31.6, 5, 1.6); box(g, '#2f2f35', x - 3.4, y - 41, 6.8, 6, 1); }
function fire(g, x, y) { pen(g); line(g, [x - 9, y, x + 9, y - 4, x - 9, y - 4, x + 9, y], 2.2, '#7a5236'); poly(g, '#e88a3a', [x - 6, y - 4, x - 2, y - 16, x, y - 9, x + 3, y - 20, x + 6, y - 4]); poly(g, '#f2c230', [x - 3, y - 4, x, y - 12, x + 3, y - 4]); }
function hay(g, x, y) { pen(g); box(g, '#e6c65a', x - 16, y - 20, 32, 20, 5); line(g, [x - 16, y - 13, x + 16, y - 13, x - 16, y - 6, x + 16, y - 6], 0.6, '#b9952e'); }
function flag(g, x, y, h, c) { pen(g); line(g, [x, y, x, y - h], 1.4, '#5a4030'); poly(g, c, [x, y - h, x + 18, y - h + 6, x, y - h + 12]); }
function statue(g, x, y, o) { pen(g); box(g, '#b9b4a8', x - 16, y - 38, 32, 38); wantedPerson(g, x, y - 38, Object.assign({ skin: '#b9b4a8', hair: '#a39e92', top: '#b9b4a8', bottom: '#a39e92', noShadow: 1, s: 1.25, pose: 'up' }, o || {}), 1); }
function tower(g, x, y, w, h, c, roofC) { pen(g); box(g, c, x - w / 2, y - h, w, h, 2); for (let i = 0; i < 4; i++) box(g, c, x - w / 2 - 3 + i * ((w + 6) / 4) + 1, y - h - 9, (w + 6) / 4 - 2, 10, 1); if (roofC) poly(g, roofC, [x - w / 2 - 4, y - h - 9, x, y - h - 46, x + w / 2 + 4, y - h - 9]); box(g, '#3a3f48', x - 4, y - h + 14, 8, 14, 3); }
function plane(g, x, y, c) { pen(g); shadow(g, x, y + 2, 44, 5); oval(g, '#f4f4f0', x, y - 12, 44, 8); poly(g, c, [x - 8, y - 12, x + 6, y - 12, x - 2, y - 44, x - 14, y - 44]); poly(g, c, [x - 8, y - 10, x + 6, y - 10, x - 6, y + 16, x - 18, y + 16]); poly(g, c, [x - 40, y - 14, x - 30, y - 14, x - 38, y - 30, x - 46, y - 30]); box(g, '#bfe0ee', x + 28, y - 16, 10, 6, 2); for (let i = 0; i < 5; i++) circ(g, '#bfe0ee', x - 14 + i * 8, y - 13, 1.8); }
function train(g, x, y, c, engine) { pen(g); box(g, c, x - 60, y - 34, 120, 28, 5); for (let i = 0; i < 6; i++) box(g, '#bfe0ee', x - 52 + i * 18, y - 29, 13, 11, 2); if (engine) { poly(g, c, [x + 60, y - 34, x + 84, y - 22, x + 84, y - 6, x + 60, y - 6]); box(g, '#bfe0ee', x + 62, y - 29, 12, 10, 2); } for (let i = -1; i <= 1; i += 2) { circ(g, '#2f2f35', x + i * 38, y - 4, 5); circ(g, '#2f2f35', x + i * 24, y - 4, 5); } }

// ---- lost things: (0,0) is where the thing sits; about 14 units across ---------
const THINGS = [
  ['key', 'The gold key', 'Small, gold, easy to step over', (g) => { g.rotate(-0.5); circ(g, '#f2c230', -4, -3, 3.2); box(g, '#f2c230', -1, -4, 9, 2, 0.5); g.fillRect(5, -2, 1.6, 3); g.fillRect(2.4, -2, 1.6, 2.4); circ(g, '#fff7dc', -4, -3, 1.1); }],
  ['duck', 'The rubber duck', 'Yellow, and a long way from the bath', (g) => animal(g, 'duck', 0, 0, false, 1.25)],
  ['teddy', 'The teddy bear', 'Brown, sitting where somebody left it', (g) => { circ(g, '#b98a5a', 0, -6, 5.5); circ(g, '#b98a5a', -4, -14, 2.4); circ(g, '#b98a5a', 4, -14, 2.4); circ(g, '#b98a5a', 0, -12, 4.4); g.fillStyle = OUT; g.beginPath(); g.arc(-1.4, -12.6, 0.6, 0, 7); g.arc(1.4, -12.6, 0.6, 0, 7); g.fill(); }],
  ['trophy', 'The trophy', 'A gold cup with two handles', (g) => { poly(g, '#f2c230', [-5, -14, 5, -14, 3, -6, -3, -6]); g.beginPath(); g.arc(-6, -11, 2.5, 1.2, 5); g.stroke(); g.beginPath(); g.arc(6, -11, 2.5, -1.9, 1.9); g.stroke(); box(g, '#f2c230', -1, -6, 2, 4, 0.4); box(g, '#f2c230', -4, -2.4, 8, 2.4, 0.6); }],
  ['cactus', 'The cactus', 'Green, in a clay pot', (g) => { box(g, '#58b06b', -2.4, -18, 4.8, 13, 2.4); box(g, '#58b06b', -7, -14, 3, 7, 1.5); box(g, '#58b06b', 4, -16, 3, 7, 1.5); g.fillStyle = '#58b06b'; g.fillRect(-5, -9.5, 3, 2); g.fillRect(2, -11, 3, 2); poly(g, '#c46a3a', [-4.5, -6, 4.5, -6, 3.2, 0, -3.2, 0]); }],
  ['boot', 'The red boot', 'One rubber boot, no sign of the other', (g) => { poly(g, '#d8402f', [-3, -14, 3, -14, 3, -4, 8, -4, 8, 0, -3, 0]); g.fillStyle = '#fff'; g.fillRect(-3, -14, 6, 2); }],
  ['guitar', 'The guitar', 'Wooden, six strings, nobody playing it', (g) => { g.rotate(0.6); circ(g, '#c9853a', 0, -5, 5); circ(g, '#c9853a', 0, -11, 3.8); box(g, '#5a4030', -1, -24, 2, 12, 0.6); circ(g, '#3a2a1c', 0, -6, 1.6); }],
  ['crown', 'The crown', 'Gold, five points, no head under it', (g) => { poly(g, '#f2c230', [-7, 0, -7, -9, -3.5, -5, 0, -10, 3.5, -5, 7, -9, 7, 0]); circ(g, '#e2564b', 0, -3, 1.3); }],
  ['anchor', 'The anchor', 'Iron, and nowhere near a ship', (g) => { g.lineWidth = 2.2; g.strokeStyle = '#3a3f48'; g.beginPath(); g.moveTo(0, -15); g.lineTo(0, -1); g.moveTo(-6, -6); g.quadraticCurveTo(0, 3, 6, -6); g.moveTo(-3.5, -11); g.lineTo(3.5, -11); g.stroke(); g.lineWidth = 0.8; g.strokeStyle = OUT; circ(g, '#fff7dc', 0, -16.4, 1.8); }],
  ['cheese', 'The cheese', 'A yellow wedge with holes', (g) => { poly(g, '#f2c230', [-8, 0, 8, 0, 8, -8, -8, -2]); circ(g, '#d9a51e', 2, -3, 1.4); circ(g, '#d9a51e', 5.5, -5.4, 1); circ(g, '#d9a51e', -3, -1.6, 0.9); }],
  ['clock', 'The alarm clock', 'Red, two bells on top', (g) => { circ(g, '#d8402f', -4, -12, 2.2); circ(g, '#d8402f', 4, -12, 2.2); circ(g, '#d8402f', 0, -6, 6.4); circ(g, '#fff', 0, -6, 4.6); line(g, [0, -6, 0, -9.4, 0, -6, 2.4, -5], 0.8); }],
  ['lantern', 'The lantern', 'Black frame, yellow glow', (g) => { box(g, '#2f2f35', -3.6, -13, 7.2, 2, 0.5); box(g, '#ffe07a', -3, -11, 6, 8, 0.8); box(g, '#2f2f35', -4, -3, 8, 3, 0.6); g.beginPath(); g.arc(0, -14, 3, Math.PI, 0); g.stroke(); }],
  ['chest', 'The treasure chest', 'Wooden, with gold trim', (g) => { box(g, '#8a5a36', -8, -8, 16, 8, 1); g.fillStyle = '#8a5a36'; g.beginPath(); g.arc(0, -8, 8, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f2c230'; g.fillRect(-1.4, -10, 2.8, 5); g.fillRect(-8, -8.6, 16, 1.2); }],
  ['ball', 'The soccer ball', 'Black and white, rolled off somewhere', (g) => { circ(g, '#fff', 0, -5, 5.2); g.fillStyle = OUT; g.beginPath(); g.arc(0, -5, 1.8, 0, 7); g.arc(-3.6, -7.4, 1.1, 0, 7); g.arc(3.6, -7.4, 1.1, 0, 7); g.arc(0, -1.2, 1.1, 0, 7); g.fill(); }],
  ['cone', 'The traffic cone', 'Orange with a white band', (g) => { poly(g, '#f08a24', [-4.4, -1, 0, -15, 4.4, -1]); g.fillStyle = '#fff'; g.fillRect(-2.6, -8, 5.2, 2.2); box(g, '#f08a24', -6, -1.6, 12, 2.2, 0.6); }],
  ['bone', 'The bone', 'White, and some dog is missing it', (g) => { g.rotate(-0.4); box(g, '#fbfaf5', -6, -5, 12, 3, 1); circ(g, '#fbfaf5', -6.4, -5.4, 2); circ(g, '#fbfaf5', -6.4, -1.8, 2); circ(g, '#fbfaf5', 6.4, -5.4, 2); circ(g, '#fbfaf5', 6.4, -1.8, 2); }],
  ['fish', 'The fish', 'Blue, flat on the ground, out of place', (g) => { oval(g, '#49b8c4', 0, -4, 7, 3.6); poly(g, '#49b8c4', [-6, -4, -11, -8, -11, 0]); g.fillStyle = OUT; g.beginPath(); g.arc(4, -4.8, 0.7, 0, 7); g.fill(); }],
  ['can', 'The watering can', 'Green, with a long spout', (g) => { box(g, '#58b06b', -5, -10, 10, 10, 1.5); line(g, [5, -6, 11, -11], 2, '#3f8a4f'); g.beginPath(); g.arc(-5, -5.4, 3.4, 1.6, 4.7); g.stroke(); }],
  ['gift', 'The gift box', 'Purple wrap, yellow ribbon', (g) => { box(g, '#8f6ad0', -6.5, -11, 13, 11, 1); g.fillStyle = '#f2c230'; g.fillRect(-1.2, -11, 2.4, 11); g.fillRect(-6.5, -6.6, 13, 2.2); circ(g, '#f2c230', -2.4, -12.4, 2); circ(g, '#f2c230', 2.4, -12.4, 2); }],
  ['plane', 'The paper plane', 'White, folded, landed', (g) => { poly(g, '#fbfaf5', [-9, -3, 9, -8, 0, 0]); poly(g, '#e4e1d6', [-9, -3, 0, 0, -1, -4]); }],
  ['peel', 'The banana peel', 'Yellow, waiting for somebody', (g) => { poly(g, '#f2c230', [0, -8, -8, 0, -4, -1, 0, -4, 4, -1, 8, 0]); circ(g, '#7a5236', 0, -8.4, 1); }],
  ['sock', 'The striped sock', 'One blue and white sock', (g) => { poly(g, '#3f7fd1', [-3, -14, 3, -14, 3, -4, 8, -3, 8, 0, -3, 0]); g.fillStyle = '#fff'; g.fillRect(-3, -11.4, 6, 1.8); g.fillRect(-3, -7.6, 6, 1.8); }],
  ['pizza', 'The pizza slice', 'One slice, pepperoni, dropped', (g) => { poly(g, '#f0c04a', [-7, -10, 7, -10, 0, 2]); g.fillStyle = '#c46a3a'; g.fillRect(-7.4, -11.4, 14.8, 2.4); circ(g, '#d8402f', -2, -6, 1.6); circ(g, '#d8402f', 2.4, -5, 1.4); circ(g, '#d8402f', 0, -1.6, 1.1); }],
  ['robot', 'The toy robot', 'Grey, square head, red buttons', (g) => { box(g, '#b9bec6', -4.5, -9, 9, 9, 1); box(g, '#b9bec6', -3.5, -15, 7, 6, 1); g.fillStyle = '#d8402f'; g.fillRect(-2, -6, 1.6, 1.6); g.fillRect(0.6, -6, 1.6, 1.6); g.fillStyle = OUT; g.fillRect(-2, -13, 1.4, 1.4); g.fillRect(0.8, -13, 1.4, 1.4); line(g, [0, -15, 0, -18], 0.8); }],
];
export function wantedThing(g, id) { const t = THINGS.find((x) => x[0] === id); if (!t) return; pen(g); g.save(); t[3](g); g.restore(); }

// ---- one-of-a-kind people -----------------------------------------------------
const K = (name, hint, o) => ({ name, hint, o: Object.assign({ skin: SKIN[1], hair: HAIR[1], hairStyle: 'short', top: '#5b6470', bottom: '#2f2f35' }, o) });
const UNIQUES = [
  K('The knight', 'In full armor, visor down', { top: '#b9bec6', bottom: '#9aa0a8', hat: 'helmet' }),
  K('The purple top hat', 'A tall purple hat, the only one', { skin: SKIN[3], hair: HAIR[0], top: '#2f2f35', hat: 'top', hatC: '#8f3fd0' }),
  K('The pink mohawk', 'Bright pink hair, straight up', { skin: SKIN[0], hair: '#ff4fa8', hairStyle: 'mohawk', top: '#2f2f35', bottom: '#3a4a6b', pose: 'up' }),
  K('The bride', 'White dress, veil, bouquet', { skin: SKIN[2], hairStyle: 'long', top: '#ffffff', dress: true, hat: 'veil', item: 'bouquet' }),
  K('The clown', 'Rainbow hair and a red nose', { skin: '#ffffff', hair: '#ffffff', hairStyle: 'rainbow', top: '#f2c230', bottom: '#3f7fd1', dots: '#e2564b', nose: '#e2564b' }),
  K('The pirate', 'Black hat, red coat, parrot on the shoulder', { skin: SKIN[2], hair: HAIR[0], hairStyle: 'long', top: '#e2564b', hat: 'tricorn', parrot: 1 }),
  K('The astronaut', 'White suit, glass helmet', { top: '#f4f4f0', bottom: '#f4f4f0', sleeve: '#f4f4f0', shoe: '#9aa0a8', visor: 1 }),
  K('The wizard', 'Blue robe, pointed hat, long white beard', { skin: SKIN[0], top: '#3f5fb0', dress: true, hat: 'wizard', hatC: '#3f5fb0', beard: '#f4f4f0', beardLong: 1 }),
  K('The viking', 'Horned helmet and a red beard', { skin: SKIN[0], top: '#7a5236', bottom: '#5a4a3a', hat: 'horns', beard: '#b5452c' }),
  K('The cowboy', 'Wide brown hat, leather vest', { skin: SKIN[2], top: '#d9d2b8', bottom: '#3a4a6b', vest: '#7a5236', hat: 'cowboy', hatC: '#a07a4a' }),
  K('The ghost', 'A bedsheet with two eye holes', { suit: 'ghost' }),
  K('The banana', 'Somebody in a banana suit', { suit: 'blob', suitC: '#f2c230', suitTilt: 0.12 }),
  K('The robot', 'Grey box suit, lit buttons', { skin: '#b9bec6', hair: '#b9bec6', hairStyle: 'bald', top: '#9aa0a8', bottom: '#868c94', dots: '#e2564b', antennae: 1 }),
  K('The mummy', 'Wrapped head to toe in bandages', { skin: '#e9e4d4', hair: '#e9e4d4', hairStyle: 'bald', top: '#e9e4d4', bottom: '#e9e4d4', shoe: '#e9e4d4', wrap: 1 }),
  K('The ninja', 'All in black, only the eyes showing', { top: '#1f1f24', bottom: '#1f1f24', hood: '#1f1f24' }),
  K('The king', 'Gold crown, red cape', { skin: SKIN[1], top: '#f4f1ea', bottom: '#3a4a6b', hat: 'crown', cape: '#c0392b', beard: '#7a4b22' }),
  K('The queen', 'Gold crown, long purple gown', { skin: SKIN[3], hair: HAIR[0], hairStyle: 'long', top: '#8f3fd0', dress: true, hat: 'crown' }),
  K('The beekeeper', 'White suit, wide hat, face behind a net', { top: '#f4f4f0', bottom: '#f4f4f0', sleeve: '#f4f4f0', hat: 'sun', hatC: '#f1e3b0', mask: '#c9c2a8' }),
  K('The caped hero', 'Blue suit, yellow cape, eye mask', { skin: SKIN[2], top: '#3f7fd1', bottom: '#3f7fd1', cape: '#f2c230', mask: '#2f2f35', shoe: '#e2564b' }),
  K('The skeleton', 'Black suit with white bones', { skin: '#fbfaf5', hair: '#fbfaf5', hairStyle: 'bald', top: '#1f1f24', bottom: '#1f1f24', bones: 1 }),
  K('The jester', 'Two-pointed hat with bells', { skin: SKIN[0], top: '#8f6ad0', bottom: '#f2c230', hat: 'jester', hatC: '#e2564b', dots: '#f2c230' }),
  K('The out-of-season Santa', 'Red suit, white beard, wrong month', { skin: SKIN[0], top: '#d8402f', bottom: '#d8402f', hat: 'santa', beard: '#ffffff' }),
  K('The alien', 'Green skin, antennae, silver suit', { skin: '#7fd08a', hair: '#7fd08a', hairStyle: 'bald', top: '#c9ced6', bottom: '#c9ced6', antennae: 1 }),
  K('The graduate', 'Black gown and a square cap', { skin: SKIN[4], hair: HAIR[0], top: '#2f2f35', dress: true, hat: 'mortar' }),
  K('The firefighter', 'Yellow helmet, dark coat, yellow stripes', { skin: SKIN[1], top: '#3a3f48', bottom: '#3a3f48', stripes: '#f2c230', hat: 'hard', hatC: '#f2c230' }),
  K('The ballerina', 'Pink tutu, hair in a bun, arms up', { skin: SKIN[1], hair: HAIR[2], hairStyle: 'bun', top: '#f6a7c4', dress: true, pose: 'up' }),
  K('The builder', 'Orange hard hat, bright vest', { skin: SKIN[3], top: '#3f7fd1', bottom: '#5a4a3a', vest: '#f2c230', hat: 'hard', hatC: '#f08a24' }),
  K('The sailor', 'White uniform, white cap, blue scarf', { skin: SKIN[2], top: '#ffffff', bottom: '#ffffff', hat: 'sailor', scarf: '#3f7fd1' }),
  K('The vampire', 'Black cape, pale face, slick hair', { skin: '#eef0ea', hair: '#1a1a1a', top: '#2f2f35', bottom: '#2f2f35', cape: '#7a1f2a' }),
  K('The witch', 'Green face, black dress, pointed hat', { skin: '#8fcf7f', hair: '#1a1a1a', hairStyle: 'long', top: '#2f2f35', dress: true, hat: 'witch', hatC: '#2f2f35' }),
  K('The mime', 'White face, black beret, black and white stripes', { skin: '#ffffff', hair: '#1a1a1a', top: '#ffffff', bottom: '#2f2f35', stripes: '#2f2f35', hat: 'beret', hatC: '#2f2f35', pose: 'fwd' }),
  K('The living statue', 'Gold from hat to shoes, standing very still', { skin: '#d9a51e', hair: '#c9951a', top: '#e2b93b', bottom: '#c9951a', shoe: '#c9951a', hat: 'top', hatC: '#e2b93b' }),
  K('The elf', 'Green suit, green pointed hat, red scarf', { skin: SKIN[0], top: '#3f9b4b', bottom: '#3f9b4b', hat: 'elf', hatC: '#3f9b4b', scarf: '#e2564b', s: 0.8 }),
  K('The gorilla', 'Somebody in a gorilla suit', { skin: '#6b5a4e', hair: '#2b2118', top: '#2b2118', bottom: '#2b2118', shoe: '#2b2118', sleeve: '#2b2118' }),
  K('The hot dog', 'Somebody in a hot dog suit', { suit: 'blob', suitC: '#c9703a', suitStripe: '#f2c230' }),
  K('The detective', 'Tan coat, brown hat, magnifying glass', { skin: SKIN[1], top: '#c9a36a', dress: true, hat: 'fedora', hatC: '#7a5236', item: 'glass' }),
  K('The painter', 'Blue beret, spattered smock, palette', { skin: SKIN[2], top: '#f4f1ea', bottom: '#5b6470', dots: '#3f7fd1', hat: 'beret', hatC: '#3f7fd1', item: 'palette' }),
  K('The drum major', 'Red jacket, tall hat with a plume, a drum', { skin: SKIN[3], top: '#c0392b', bottom: '#ffffff', hat: 'tall', hatC: '#2f2f35', item: 'drum' }),
];

// ---- the star, friends and lookalikes -------------------------------------------
export const WANTED_CAST = {
  otis: { name: 'Otis', hint: 'Green cap, orange scarf, mustache', o: { skin: SKIN[1], hair: '#4a3220', hairStyle: 'short', top: '#7a5cc0', bottom: '#3a4a6b', hat: 'cap', hatC: GREEN, scarf: ORANGE, stache: true } },
  mabel: { name: 'Mabel', hint: 'Red beret, yellow coat, pink ice cream', o: { skin: SKIN[0], hair: '#b5452c', hairStyle: 'long', top: '#f2c230', dress: true, hat: 'beret', hatC: '#e2564b', item: 'cone', itemC: '#f6c9d6' } },
  biscuit: { name: 'Biscuit', hint: "Otis's dog: white, one brown ear, blue collar" },
};
const DECOYS = [
  [{ stache: false }, 'no mustache'], [{ scarf: '#3f7fd1' }, 'wrong scarf'], [{ hatC: '#e2564b' }, 'wrong cap'], [{ stache: false, top: '#e2564b' }, 'no mustache'],
  [{ scarf: '#f2c230' }, 'wrong scarf'], [{ hatC: '#3f7fd1' }, 'wrong cap'], [{ scarf: null }, 'no scarf'], [{ hat: 'beret' }, 'that is a beret'],
  [{ hatC: '#f2c230', top: '#58b06b' }, 'wrong cap'], [{ stache: false, top: '#3f7fd1' }, 'no mustache'], [{ scarf: '#e2564b' }, 'wrong scarf'], [{ hat: 'sun', hatC: GREEN }, 'that is a sun hat'],
];

// ---- the builder handed to every district ---------------------------------------
function makeBuilder(R, ox, oy, di, board) {
  const b = {
    R, di,
    pick: (a) => a[Math.floor(R() * a.length)],
    rnd: (lo, hi) => lo + R() * (hi - lo),
    int: (lo, hi) => lo + Math.floor(R() * (hi - lo + 1)),
    avoid: [], grounds: [], spots: [], scenes: [], density: 1,
    rect(x0, y0, x1, y1) { b.avoid.push([0, x0, y0, x1, y1]); },
    ell(x, y, rx, ry) { b.avoid.push([1, x, y, rx, ry]); },
    blocked(x, y) {
      for (const a of b.avoid) {
        if (a[0]) { const dx = (x - a[1]) / a[3], dy = (y - a[2]) / a[4]; if (dx * dx + dy * dy < 1) return true; }
        else if (x > a[1] && x < a[3] && y > a[2] && y < a[4]) return true;
      }
      return false;
    },
    areaFree(x0, y0, x1, y1) {
      if (x0 < 30 || y0 < 110 || x1 > DW - 30 || y1 > DH - 20) return false;
      for (const a of b.avoid) {
        const ax0 = a[0] ? a[1] - a[3] : a[1], ay0 = a[0] ? a[2] - a[4] : a[2], ax1 = a[0] ? a[1] + a[3] : a[3], ay1 = a[0] ? a[2] + a[4] : a[4];
        if (x0 < ax1 && x1 > ax0 && y0 < ay1 && y1 > ay0) return false;
      }
      return true;
    },
    ground(fn) { b.grounds.push(fn); },
    // A drawn thing: `y` is where it stands (the draw order), `bb` its bounds.
    item(y, bb, fn) { board.items.push({ y: oy + y, x0: ox + bb[0], y0: oy + bb[1], x1: ox + bb[2], y1: oy + bb[3], f: fn, ox, oy }); },
    person(x, y, o, meta) { const p = { x: ox + x, y: oy + y, o, m: meta || 0, d: di }; board.people.push(p); return p; },
    // A place a lost thing can sit that is not plain ground (a roof, a deck).
    spot(x, y, z) { b.spots.push([x, y, z == null ? y : z]); },
    // A scene only this district has: `box` in district units.
    scene(name, hint, bx) { b.scenes.push({ name, hint, box: bx }); },
    outfit(extra) {
      const hs = R(), dress = R() < 0.22;
      const o = { skin: b.pick(SKIN), hair: b.pick(HAIR), hairStyle: hs < 0.5 ? 'short' : hs < 0.78 ? 'long' : hs < 0.88 ? 'bun' : hs < 0.95 ? 'bald' : 'short', top: b.pick(TOPS), bottom: b.pick(BOTS), dress, flip: R() < 0.5, s: R() < 0.14 ? 0.72 : b.rnd(0.94, 1.06) };
      const h = R();
      if (h < 0.13) { o.hat = 'cap'; o.hatC = b.pick(CAPS); } else if (h < 0.2) { o.hat = 'sun'; o.hatC = b.pick(['#f1e3b0', '#f6c9d6', '#ffffff']); } else if (h < 0.235) { o.hat = 'beret'; o.hatC = b.pick(['#3f7fd1', '#2f2f35', '#8f6ad0']); }
      if (R() < 0.07) o.scarf = b.pick(SCARVES);
      if (R() < 0.035) o.stache = true;
      const it = R();
      if (it < 0.07) { o.item = 'balloon'; o.itemC = b.pick(TOPS); } else if (it < 0.13) { o.item = 'cone'; o.itemC = b.pick(['#f6c9d6', '#f1ede2', '#b98a5a', '#bfe3b0']); } else if (it < 0.15) { o.item = 'umbrella'; o.itemC = b.pick(TOPS); }
      if (o.hat === 'cap' && o.hatC === GREEN && o.stache) o.stache = false;
      if (extra) Object.assign(o, extra);
      return o;
    },
    // n people scattered over a box, keeping off whatever is in the way.
    crowd(n, x0, y0, x1, y1, extra) {
      let made = 0, tries = 0;
      while (made < n && tries++ < n * 8) {
        const x = b.rnd(x0, x1), y = b.rnd(y0, y1);
        if (b.blocked(x, y)) continue;
        b.person(x, y, b.outfit(typeof extra === 'function' ? extra() : extra)); made++;
      }
    },
    // A thick knot of people around a point (the sum of three rolls, no log or cos).
    knot(n, cx, cy, sx, sy, extra) {
      for (let i = 0; i < n; i++) {
        const x = cx + (R() + R() + R() - 1.5) * sx, y = cy + (R() + R() + R() - 1.5) * sy;
        if (x < 24 || x > DW - 24 || y < 110 || y > DH - 14 || b.blocked(x, y)) continue;
        b.person(x, y, b.outfit(typeof extra === 'function' ? extra() : extra));
      }
    },
    queue(x, y, dx, dy, n, extra) { for (let i = 0; i < n; i++) b.person(x + dx * i + b.rnd(-3, 3), y + dy * i, b.outfit(extra)); },
  };
  return b;
}

// ---- shared scenes (the gags): each takes a free patch about 190 by 70 ----------
// fn(b, x, y) places its figures around (x, y), the patch's bottom centre, and
// returns [name, hint, box] with the box in district units.
const SCENES = [
  (b, x, y) => { for (let i = 0; i < 8; i++) b.person(x - 56 + i * 15, y, b.outfit({ pose: 'fwd', flip: false, dress: false, s: 1, item: null }), 2); return ['The conga line', 'Eight people, hands on shoulders', [x - 68, y - 40, x + 62, y + 4]]; },
  (b, x, y) => { const c = b.pick(['#b98a5a', '#2f2f35', '#d9d2b8']); b.item(y, [x - 20, y - 20, x + 40, y + 2], (g) => { dog(g, x + 22, y, c, { ear: '#6b4226' }); pen(g); for (let i = 0; i < 5; i++) oval(g, '#c4573f', x + 10 - i * 6.5, y - 8 + (i % 2) * 2.4, 3.4, 2); }); b.person(x - 34, y + 2, { skin: SKIN[1], hair: HAIR[0], top: '#ffffff', bottom: '#3a4a6b', hat: 'chef', pose: 'up', s: 1 }, 2); return ['The sausage thief', 'A dog making off with a string of sausages', [x - 46, y - 42, x + 40, y + 6]]; },
  (b, x, y) => { b.person(x - 14, y, b.outfit({ pose: 'fwd', flip: false, dress: false, hat: 'sun', hatC: '#f1e3b0', s: 1, item: null }), 2); b.item(y + 1, [x - 6, y - 22, x + 26, y + 6], (g) => { pen(g); line(g, [x - 3, y - 19, x + 10, y - 5]); animal(g, 'lobster', x + 14, y, false, 1); }); return ['The lobster walker', 'Out for a walk with a lobster on a lead', [x - 28, y - 40, x + 28, y + 6]]; },
  (b, x, y) => { b.person(x, y, { skin: b.pick(SKIN), hair: b.pick(HAIR), hairStyle: 'short', top: '#e77fb0', bottom: '#3a4a6b', s: 0.72, lift: 26, item: 'balloons' }, 2); return ['The flying kid', 'Too many balloons, feet off the ground', [x - 16, y - 92, x + 26, y + 4]]; },
  (b, x, y) => { for (let i = 0; i < 3; i++) b.person(x - 70 + i * 16, y, b.outfit({ pose: 'lean', flip: true, dress: false, s: 1, item: null }), 2); for (let i = 0; i < 3; i++) b.person(x + 40 + i * 16, y, b.outfit({ pose: 'lean', flip: false, dress: false, s: 1, item: null }), 2); b.item(y - 22, [x - 82, y - 24, x + 86, y - 14], (g) => { line(g, [x - 78, y - 19, x + 80, y - 19], 1.6, '#8a6240'); g.fillStyle = '#e2564b'; g.fillRect(x - 3, y - 22, 6, 6); }); return ['The tug of war', 'Three against three and a rope', [x - 90, y - 42, x + 94, y + 4]]; },
  (b, x, y) => { const sk = b.pick(SKIN); b.item(y, [x - 28, y - 36, x + 28, y + 2], (g) => { bench(g, x, y); pen(g); box(g, '#3f7fd1', x - 16, y - 22, 26, 8); box(g, '#3a4a6b', x + 8, y - 21, 16, 6); circ(g, sk, x - 20, y - 20, 4.6); animal(g, 'pigeon', x - 6, y - 22, false, 1); animal(g, 'pigeon', x + 6, y - 23, true, 1); animal(g, 'pigeon', x + 18, y - 21, false, 1); label(g, 'z', x - 28, y - 30, 8); label(g, 'z', x - 33, y - 36, 6); }); return ['The napper', 'Fast asleep on a bench, and the pigeons have noticed', [x - 36, y - 40, x + 30, y + 4]]; },
  (b, x, y) => { b.person(x - 18, y, b.outfit({ pose: 'fwd', flip: false, dress: false, hairStyle: 'bald', hat: null, s: 1, item: null }), 2); b.item(y + 1, [x - 6, y - 44, x + 30, y - 28], (g) => { pen(g); box(g, '#5a4a3a', x + 12, y - 42, 8, 6, 1); box(g, '#5a4a3a', x + 9, y - 37, 14, 1.8, 0.8); line(g, [x, y - 40, x + 7, y - 40, x + 1, y - 36, x + 6, y - 36]); }); return ['The runaway hat', 'A bald man chasing what the wind took', [x - 30, y - 46, x + 30, y + 4]]; },
  (b, x, y) => { b.person(x, y, b.outfit({ pose: 'up', dress: false, s: 1, item: null, flip: false }), 2); const cs = [b.pick(TOPS), b.pick(TOPS), b.pick(TOPS)]; b.item(y + 1, [x - 20, y - 70, x + 20, y - 36], (g) => { pen(g); [[-14, -44], [-8, -58], [0, -64], [8, -58], [14, -44]].forEach((d, i) => circ(g, cs[i % 3], x + d[0], y + d[1], 2.6)); }); return ['The juggler', 'Five balls in the air at once', [x - 20, y - 70, x + 20, y + 4]]; },
  (b, x, y) => { for (let i = 0; i < 3; i++) b.person(x - 16 + i * 16, y, b.outfit({ dress: false, s: 1, item: null, pose: 'stand' }), 2); for (let i = 0; i < 2; i++) b.person(x - 8 + i * 16, y + 0.2, b.outfit({ dress: false, s: 1, item: null, lift: 28, noShadow: 1, pose: 'stand' }), 2); b.person(x, y + 0.4, b.outfit({ dress: false, s: 0.8, item: null, lift: 56, noShadow: 1, pose: 'up' }), 2); return ['The human pyramid', 'Three, then two, then one on top', [x - 28, y - 92, x + 28, y + 4]]; },
  (b, x, y) => { const kid = b.outfit({ dress: false, item: null }); b.person(x, y, b.outfit({ dress: false, s: 1.05, item: null, hat: null, child: kid }), 2); return ['The piggyback', 'A kid riding high on somebody\'s shoulders', [x - 12, y - 62, x + 12, y + 4]]; },
  (b, x, y) => { b.person(x - 40, y, b.outfit({ dress: false, s: 1, item: null, flip: false, pose: 'stand' }), 2); b.item(y + 1, [x - 28, y - 12, x + 52, y + 4], (g) => { for (let i = 0; i < 7; i++) animal(g, 'duck', x - 22 + i * 11, y + (i % 2), true, i ? 0.7 : 1); }); return ['The duck parade', 'One person, one duck, six ducklings, single file', [x - 52, y - 40, x + 54, y + 6]]; },
  (b, x, y) => { b.person(x, y, b.outfit({ dress: false, s: 1, item: 'flag', itemC: b.pick(TOPS), lift: 30, stilts: 30, noShadow: 1 }), 2); return ['The stilt walker', 'Head and shoulders above everybody', [x - 12, y - 86, x + 22, y + 4]]; },
  (b, x, y) => { b.person(x - 22, y, b.outfit({ dress: false, s: 1, hat: 'beret', hatC: '#2f2f35', item: 'palette', flip: false }), 2); b.person(x + 34, y, b.outfit({ pose: 'sit', dress: false, item: null, flip: true }), 2); b.item(y + 1, [x - 6, y - 44, x + 18, y + 2], (g) => { pen(g); line(g, [x - 2, y, x + 6, y - 40, x + 14, y, x + 6, y - 40, x + 6, y - 6], 1.2, '#7a5236'); box(g, '#fff', x - 3, y - 38, 18, 22, 1); circ(g, '#f6d2b0', x + 6, y - 28, 4); }); return ['The portrait', 'A painter, an easel and a very patient sitter', [x - 36, y - 46, x + 46, y + 4]]; },
  (b, x, y) => { const c = b.pick(TOPS); for (let i = 0; i < 5; i++) b.person(x - 44 + i * 22, y, b.outfit({ dress: false, s: 1, item: 'umbrella', itemC: c, flip: false, pose: 'stand' }), 2); return ['The umbrella five', 'Five in a row, five matching umbrellas, no rain', [x - 56, y - 64, x + 66, y + 4]]; },
  (b, x, y) => { b.person(x - 40, y, b.outfit({ pose: 'lean', flip: true, dress: false, s: 1, item: null }), 2); const cs = []; for (let i = 0; i < 9; i++) cs.push(b.pick(['#b98a5a', '#2f2f35', '#d9d2b8', '#ffffff', '#8a5a36'])); b.item(y + 1, [x - 30, y - 22, x + 70, y + 6], (g) => { pen(g); for (let i = 0; i < 9; i++) { const dx = x - 12 + (i % 5) * 16 + (i > 4 ? 8 : 0), dy = y + (i > 4 ? 4 : -4); line(g, [x - 30, y - 18, dx + 4, dy - 8], 0.5); dog(g, dx, dy, cs[i], { s: 0.8 }); } }); return ['The dog walker', 'One walker, nine dogs, nine opinions', [x - 54, y - 40, x + 72, y + 8]]; },
  (b, x, y) => { b.person(x - 8, y, b.outfit({ pose: 'bow', flip: false, dress: false, s: 1, item: null, hat: null }), 2); b.person(x + 2, y + 0.3, b.outfit({ pose: 'up', dress: false, s: 0.9, item: null, lift: 24, noShadow: 1 }), 2); return ['The leapfrog', 'One bent over, one sailing across', [x - 24, y - 62, x + 22, y + 4]]; },
];

// ---- district helpers ---------------------------------------------------------
const C8 = [[1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]];
const C12 = [[1, 0], [0.866, 0.5], [0.5, 0.866], [0, 1], [-0.5, 0.866], [-0.866, 0.5], [-1, 0], [-0.866, -0.5], [-0.5, -0.866], [0, -1], [0.5, -0.866], [0.866, -0.5]];
function turf(b, base, c1, c2, n) {
  const d = []; for (let i = 0; i < (n || 240); i++) d.push([b.R() * DW, b.R() * DH, b.rnd(14, 46), b.rnd(5, 13), i % 2]);
  b.ground((g) => { g.fillStyle = base; g.fillRect(0, 0, DW, DH); for (const e of d) { g.fillStyle = e[4] ? c1 : c2; g.beginPath(); g.ellipse(e[0], e[1], e[2], e[3], 0, 0, 7); g.fill(); } });
}
function paths(b, c, w, lines) {
  b.ground((g) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; for (const l of lines) { g.beginPath(); g.moveTo(l[0], l[1]); for (let i = 2; i < l.length; i += 2) g.lineTo(l[i], l[i + 1]); g.stroke(); } });
}
function water(b, x, y, rx, ry, c) { b.ell(x, y, rx + 10, ry + 8); b.ground((g) => { pen(g); g.lineWidth = 1; oval(g, c || '#7fc4e0', x, y, rx, ry); g.strokeStyle = '#b5e0f0'; g.lineWidth = 2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * rx * 0.4 - 20, y + i * ry * 0.4); g.lineTo(x + i * rx * 0.4 + 24, y + i * ry * 0.4); g.stroke(); } }); }
function put(b, y, bb, fn, block) { b.item(y, bb, fn); if (block) b.rect(block[0], block[1], block[2], block[3]); }
function trees(b, list, kind) { for (const t of list) { b.ell(t[0], t[1] - 2, 14, 8); const k = t[2] || kind || 'round'; b.item(t[1], [t[0] - 40, t[1] - 96, t[0] + 40, t[1] + 8], (g) => tree(g, t[0], t[1], k)); b.spot(t[0] + 10, t[1] - 62, t[1] + 0.5); } }
function stalls(b, list, qn) {
  for (const s of list) {
    const cook = { skin: b.pick(SKIN), hair: b.pick(HAIR), top: '#ffffff', bottom: '#333333', noShadow: 1, hat: 'chef' };
    put(b, s[1], [s[0] - 52, s[1] - 62, s[0] + 52, s[1] + 6], (g) => stall(g, s[0], s[1], s[2], s[3], cook), [s[0] - 50, s[1] - 66, s[0] + 50, s[1] + 3]);
    b.spot(s[0] + 26, s[1] - 58, s[1] + 0.5);
    if (qn) b.queue(s[0], s[1] + 16, 0, 13.5, qn);
  }
}
function swimmer(g, x, y, skin, hair, ring) { pen(g); if (ring) { g.lineWidth = 3.4; g.strokeStyle = ring; g.beginPath(); g.ellipse(x, y + 2, 9, 4.6, 0, 0, 7); g.stroke(); pen(g); } circ(g, skin, x, y - 3, 4.2); g.fillStyle = hair; g.beginPath(); g.arc(x, y - 3.4, 4.3, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = OUT; g.beginPath(); g.arc(x - 1.4, y - 2.4, 0.6, 0, 7); g.arc(x + 1.6, y - 2.4, 0.6, 0, 7); g.fill(); line(g, [x - 9, y + 3, x - 4, y + 1, x + 4, y + 1, x + 9, y + 3], 1, '#ffffff'); }
function swimmers(b, n, x0, y0, x1, y1, rings) { const L = []; for (let i = 0; i < n; i++) L.push([b.rnd(x0, x1), b.rnd(y0, y1), b.pick(SKIN), b.pick(HAIR), rings && b.R() < rings ? b.pick(TOPS) : null]); for (const s of L) b.item(s[1], [s[0] - 12, s[1] - 10, s[0] + 12, s[1] + 8], (g) => swimmer(g, s[0], s[1], s[2], s[3], s[4])); }
function beasts(b, kind, n, x0, y0, x1, y1, s) { for (let i = 0; i < n; i++) { const x = b.rnd(x0, x1), y = b.rnd(y0, y1), f = b.R() < 0.5; b.item(y, [x - 40, y - 60, x + 40, y + 6], (g) => animal(g, kind, x, y, f, s || 1)); } }
function pen4(b, x0, y0, x1, y1, c) { b.rect(x0 - 6, y0 - 16, x1 + 6, y1 + 4); b.ground((g) => { pen(g); box(g, c, x0, y0, x1 - x0, y1 - y0, 6); }); b.item(y0, [x0, y0 - 16, x1, y0 + 2], (g) => fence(g, x0, y0, x1)); b.item(y1 + 1, [x0, y1 - 16, x1, y1 + 3], (g) => fence(g, x0, y1, x1)); }

// ---- THE DISTRICTS -----------------------------------------------------------------
// Every district is 1600 by 1200 and keeps its top 100 clear for its signpost.
// build(b) lays the ground, the landmarks and the crowds that belong to them;
// the engine then adds Otis, his friends, the lookalikes, the lost things, the
// shared scenes and the rest of the crowd. FROZEN once on a board (rule 2).
const DISTRICTS = {
  fairground: { name: 'Fairground', people: 1300, build(b) {
    turf(b, '#a9d18e', '#9fc984', '#b3d899');
    paths(b, '#e8d7a9', 46, [[-20, 610, 1620, 610], [800, 200, 800, 1220], [300, 340, 520, 520, 800, 610, 1150, 540, 1260, 480], [800, 610, 520, 800, 400, 900], [800, 610, 1100, 760, 1420, 720]]);
    const band = [0, 1, 2, 3].map((i) => ({ skin: SKIN[i + 1], hair: HAIR[i], hairStyle: i % 2 ? 'long' : 'short', top: TOPS[i], bottom: '#2f2f35', pose: i % 2 ? 'up' : 'stand', noShadow: 1, s: 1.15 }));
    put(b, 200, [630, 36, 970, 200], (g) => { pen(g); box(g, '#7a4b8f', 650, 60, 300, 100); for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#8f5aa6' : '#6a3f7c'; g.fillRect(652 + i * 29.6, 62, 29.6, 96); } box(g, '#8a6240', 636, 150, 328, 44); box(g, '#f2c230', 630, 40, 340, 24); box(g, '#2f2f35', 648, 116, 26, 40); box(g, '#2f2f35', 926, 116, 26, 40); label(g, 'THE MIGHTY PICKLES', 800, 57, 12); band.forEach((o, i) => wantedPerson(g, 730 + i * 50, 168, o, 1)); }, [630, 100, 970, 202]);
    b.knot(250, 800, 310, 150, 70, () => (b.R() < 0.3 ? { pose: 'up', item: null } : null));
    put(b, 335, [140, 90, 460, 340], (g) => { pen(g); box(g, '#f3ead2', 170, 250, 260, 82); for (let i = 0; i < 10; i++) poly(g, i % 2 ? '#3f7fd1' : '#f3ead2', [300, 120, 150 + i * 30, 250, 180 + i * 30, 250]); g.fillStyle = '#2f2f35'; g.beginPath(); g.moveTo(278, 332); g.lineTo(278, 290); g.quadraticCurveTo(300, 268, 322, 290); g.lineTo(322, 332); g.closePath(); g.fill(); g.stroke(); flag(g, 300, 120, 26, '#e2564b'); label(g, 'BIG TOP', 300, 266, 11); }, [150, 180, 450, 336]);
    stalls(b, [[170, 522, '#e2564b', 'HOT DOGS'], [300, 522, '#3f7fd1', 'ICE CREAM'], [430, 522, '#58b06b', 'LEMONADE'], [560, 522, '#e88a3a', 'PRETZELS']], 7);
    b.ell(800, 622, 78, 46);
    b.item(660, [724, 560, 876, 664], (g) => { fountain(g, 800, 620); wantedPerson(g, 812, 632, { skin: SKIN[1], hair: HAIR[0], top: '#2f2f35', bottom: '#2f2f35', mask: true, noShadow: 1, s: 0.95 }, 1); pen(g); oval(g, '#8fd0ea', 812, 634, 13, 8); });
    b.scene('The scuba diver', 'Dressed for much deeper water than a fountain', [798, 596, 828, 640]);
    put(b, 486, [1100, 140, 1420, 490], (g) => { g.save(); g.strokeStyle = '#5b6470'; g.lineCap = 'round'; g.lineWidth = 5; g.beginPath(); g.moveTo(1260, 300); g.lineTo(1190, 482); g.moveTo(1260, 300); g.lineTo(1330, 482); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(1260, 300, 150, 0, 7); g.stroke(); g.lineWidth = 1.4; for (const c of C12) { g.beginPath(); g.moveTo(1260, 300); g.lineTo(1260 + c[0] * 150, 300 + c[1] * 150); g.stroke(); } g.restore(); pen(g); C12.forEach((c, i) => { const cx = 1260 + c[0] * 150, cy = 300 + c[1] * 150; box(g, TOPS[i % 8], cx - 11, cy, 22, 16, 4); g.fillStyle = '#fff'; g.fillRect(cx - 8, cy + 3, 16, 5); line(g, [cx, cy, cx, cy - 6]); }); circ(g, '#f2c230', 1260, 300, 12); box(g, '#e2564b', 1182, 470, 156, 14); }, [1170, 430, 1350, 488]);
    const kids = [0, 1, 2].map((i) => ({ skin: SKIN[i], hair: HAIR[i + 2], top: TOPS[i + 3], bottom: BOTS[i], pose: 'up', noShadow: 1, s: 0.7 }));
    put(b, 704, [1375, 570, 1545, 706], (g) => { pen(g); box(g, '#f2c230', 1385, 640, 150, 62); [1385, 1445, 1505].forEach((x, i) => { box(g, i % 2 ? '#3f7fd1' : '#e2564b', x, 598, 30, 48); poly(g, '#e77fb0', [x - 3, 598, x + 15, 576, x + 33, 598]); }); g.fillStyle = '#c98a1a'; g.beginPath(); g.moveTo(1440, 702); g.lineTo(1440, 672); g.quadraticCurveTo(1460, 652, 1480, 672); g.lineTo(1480, 702); g.closePath(); g.fill(); g.stroke(); kids.forEach((o, i) => wantedPerson(g, [1410, 1470, 1512][i], [636, 628, 638][i], o, 1)); }, [1375, 600, 1545, 706]);
    b.spot(1400, 598, 705);
    water(b, 1180, 900, 200, 105);
    b.item(912, [1190, 860, 1256, 914], (g) => { wantedPerson(g, 1222, 900, { skin: SKIN[3], hair: HAIR[5], hairStyle: 'bald', top: '#58b06b', bottom: '#2f2f35', hat: 'sun', hatC: '#f1e3b0', item: 'rod', noShadow: 1 }, 1); pen(g); poly(g, '#8a6240', [1192, 896, 1254, 896, 1246, 910, 1200, 910]); });
    b.spot(1090, 936, 1006);
    put(b, 905, [280, 720, 520, 906], (g) => { pen(g); shadow(g, 400, 884, 116, 22); oval(g, '#e2564b', 400, 876, 108, 24); [[320, '#fff'], [365, '#b98a5a'], [410, '#2f2f35'], [455, '#f2c230'], [490, '#fff']].forEach((h, i) => { line(g, [h[0], 790, h[0], 878], 2, '#c9a36a'); const yy = 850 + (i % 2) * 10; oval(g, h[1], h[0], yy, 12, 6); oval(g, h[1], h[0] + 11, yy - 8, 5, 4, -0.5); box(g, h[1], h[0] - 8, yy + 4, 2.4, 9, 1); box(g, h[1], h[0] + 6, yy + 4, 2.4, 9, 1); }); for (let i = 0; i < 8; i++) poly(g, i % 2 ? '#f2c230' : '#3f7fd1', [400, 730, 290 + i * 27.5, 796, 317.5 + i * 27.5, 796]); box(g, '#f3ead2', 290, 794, 220, 10); circ(g, '#e2564b', 400, 728, 6); }, null);
    b.ell(400, 872, 122, 50);
    put(b, 1016, [626, 920, 674, 1018], (g) => statue(g, 650, 1016), [628, 960, 672, 1016]);
    trees(b, [[60, 180], [110, 420], [70, 700], [40, 980], [560, 150], [1040, 150], [1500, 300], [1560, 520], [1540, 820], [1500, 1150], [900, 1170], [700, 1150], [220, 1180], [1030, 700], [1420, 160], [1100, 400], [580, 330], [960, 480], [240, 640], [1340, 1080]]);
    [[150, 1050, '#e2564b'], [300, 1100, '#3f7fd1'], [440, 1040, '#f2c230'], [540, 1120, '#58b06b'], [110, 1140, '#e77fb0']].forEach((p) => { b.ground((g) => blanket(g, p[0], p[1], p[2])); b.crowd(4, p[0] - 26, p[1] - 10, p[0] + 26, p[1] + 12, { pose: 'sit', dress: false, item: null }); });
  } },

  beach: { name: 'Beach', people: 1050, build(b) {
    turf(b, '#f1dfa8', '#ecd698', '#f6e7b8', 200);
    b.rect(-10, 100, 1088, 430); b.rect(1162, 100, 1610, 430);
    b.ground((g) => { g.fillStyle = '#6fc0dc'; g.fillRect(0, 0, DW, 400); g.fillStyle = '#8fd3e6'; g.fillRect(0, 330, DW, 70); g.fillStyle = '#e3cf96'; g.fillRect(0, 400, DW, 34); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.lineCap = 'round'; for (let r = 0; r < 4; r++) for (let x = 40 + r * 60; x < DW; x += 240) { g.beginPath(); g.moveTo(x, 150 + r * 62); g.quadraticCurveTo(x + 30, 138 + r * 62, x + 60, 150 + r * 62); g.stroke(); } g.beginPath(); for (let x = 0; x < DW; x += 80) { g.moveTo(x, 402); g.quadraticCurveTo(x + 40, 392, x + 80, 402); } g.stroke(); });
    swimmers(b, 34, 40, 150, 1560, 390, 0.3);
    b.item(260, [520, 222, 560, 262], (g) => { pen(g); poly(g, '#7d8791', [528, 258, 544, 226, 556, 258]); line(g, [520, 260, 562, 260], 1.4, '#ffffff'); });
    b.scene('The fin', 'Grey, triangular, and nobody in the water has noticed', [518, 220, 564, 264]);
    b.ground((g) => { pen(g); box(g, '#a07a4a', 1090, 110, 70, 330, 3); for (let y = 122; y < 436; y += 14) line(g, [1092, y, 1158, y], 0.6, '#7a5236'); });
    b.crowd(26, 1100, 130, 1150, 420, null);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { const x = 90 + k * 172 + (r % 2) * 60 + b.rnd(-18, 18), y = 520 + r * 150 + b.rnd(-20, 20); if (x > 1040 && x < 1210 && r === 0) continue; const c = b.pick(TOPS), um = b.R() < 0.72 ? b.pick(TOPS) : null; b.ground((g) => towel(g, x, y, c)); if (um) b.item(y + 1, [x - 10, y - 70, x + 40, y + 4], (g) => { pen(g); line(g, [x + 14, y - 2, x + 14, y - 44], 1.4, '#5a4030'); g.fillStyle = um; g.beginPath(); g.arc(x + 14, y - 44, 22, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); }); b.crowd(b.int(1, 3), x - 16, y - 4, x + 16, y + 6, { pose: 'sit', dress: false, item: null, hat: b.R() < 0.4 ? 'sun' : null, hatC: '#f1e3b0' }); }
    const lg = { skin: SKIN[2], hair: HAIR[3], top: '#e2564b', bottom: '#e2564b', pose: 'sit', noShadow: 1, hat: 'cap', hatC: '#ffffff' };
    put(b, 500, [720, 400, 800, 504], (g) => { pen(g); line(g, [732, 500, 742, 440, 788, 500, 778, 440], 3, '#f1ede2'); box(g, '#f1ede2', 734, 432, 52, 10); box(g, '#e2564b', 738, 404, 44, 8); line(g, [742, 432, 742, 410, 778, 432, 778, 410], 2, '#f1ede2'); wantedPerson(g, 760, 432, lg, 1); label(g, 'z', 774, 408, 8); }, [724, 440, 796, 504]);
    b.scene('The lifeguard', 'Up in the tower, on duty, fast asleep', [736, 396, 790, 440]);
    put(b, 800, [540, 730, 760, 806], (g) => { pen(g); line(g, [560, 800, 560, 740, 740, 800, 740, 740], 2.4, '#5a4030'); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(560, 744, 180, 22); g.strokeRect(560, 744, 180, 22); for (let x = 572; x < 740; x += 12) line(g, [x, 744, x, 766], 0.4); circ(g, '#fff7dc', 660, 726, 5); }, [552, 780, 748, 802]);
    b.crowd(4, 570, 770, 730, 780, { pose: 'up', item: null, dress: false }); b.crowd(4, 570, 806, 730, 826, { pose: 'up', item: null, dress: false });
    stalls(b, [[1380, 560, '#e77fb0', 'ICE CREAM'], [260, 480, '#49b8c4', 'SNORKELS']], 6);
    [[430, 1100], [980, 960], [1480, 1040], [120, 900]].forEach((p) => { b.rect(p[0] - 24, p[1] - 26, p[0] + 24, p[1] + 4); b.item(p[1], [p[0] - 26, p[1] - 44, p[0] + 26, p[1] + 4], (g) => { pen(g); box(g, '#e3c98a', p[0] - 22, p[1] - 14, 44, 14, 2); box(g, '#e3c98a', p[0] - 20, p[1] - 26, 10, 14, 1); box(g, '#e3c98a', p[0] + 10, p[1] - 26, 10, 14, 1); box(g, '#e3c98a', p[0] - 6, p[1] - 34, 12, 22, 1); flag(g, p[0], p[1] - 34, 12, '#e2564b'); }); b.spot(p[0] + 15, p[1] - 26, p[1] + 0.5); });
    trees(b, [[60, 520, 'palm'], [1560, 480, 'palm'], [900, 1160, 'palm'], [40, 1120, 'palm'], [1540, 1160, 'palm'], [640, 480, 'palm']]);
    put(b, 1010, [1200, 950, 1300, 1020], (g) => boat(g, 1250, 1004, '#e2564b', 'row'), [1210, 980, 1290, 1012]);
    b.crowd(60, 30, 436, 1570, 480, { item: null });
  } },

  market: { name: 'Market Square', people: 1350, build(b) {
    turf(b, '#dcd3c2', '#d3c9b6', '#e4dccd', 160);
    b.ground((g) => { g.strokeStyle = '#c9bfab'; g.lineWidth = 1; for (let y = 130; y < DH; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(DW, y); g.stroke(); } });
    const fronts = [['#e9b7a0', 'BAKERY'], ['#b9d3c0', 'TEA ROOM'], ['#e6d39a', 'TAILOR'], ['#c3c9e6', 'BOOKS'], ['#e3b6c6', 'FLORIST'], ['#cfe0a8', 'GROCER'], ['#e9c9a0', 'INN']];
    fronts.forEach((f, i) => { const x = 20 + i * 226, w = 200, h = 130 + (i % 3) * 22; put(b, 300, [x - 10, 300 - h - 44, x + w + 10, 306], (g) => building(g, x, 300, w, h, f[0], i % 2 ? 'gable' : 'flat', { sign: f[1], roofC: i % 2 ? '#b5533c' : '#8a8f98' }), [x - 4, 150, x + w + 4, 304]); b.spot(x + 40, 300 - h - 6, 301); });
    put(b, 560, [740, 300, 860, 566], (g) => { tower(g, 800, 560, 70, 190, '#e3d8c2', '#5b6470'); pen(g); circ(g, '#fff', 800, 420, 20); line(g, [800, 420, 800, 406, 800, 420, 811, 424], 1.6); }, [760, 470, 840, 564]);
    const goods = [['#e2564b', 'FRUIT'], ['#e88a3a', 'BREAD'], ['#f2c230', 'CHEESE'], ['#49b8c4', 'FISH'], ['#e77fb0', 'FLOWERS'], ['#8f6ad0', 'SPICES'], ['#58b06b', 'OLIVES'], ['#3f7fd1', 'HONEY'], ['#c44a7a', 'JAM'], ['#2f9c8f', 'TEA'], ['#7fa650', 'HERBS'], ['#e2564b', 'EGGS'], ['#e88a3a', 'NUTS'], ['#3f7fd1', 'SOAP'], ['#8f6ad0', 'HATS']];
    const L = []; goods.forEach((s, i) => { const r = Math.floor(i / 5), k = i % 5; const x = 150 + k * 300 + (r % 2) * 60, y = 480 + r * 220; if (x > 700 && x < 900 && r === 0) L.push([x + 160, y, s[0], s[1]]); else L.push([x, y, s[0], s[1]]); });
    stalls(b, L, 5);
    b.ell(800, 1085, 78, 46); b.item(1124, [724, 1024, 876, 1128], (g) => fountain(g, 800, 1084));
    for (let i = 0; i < 7; i++) { const x = 1180 + (i % 4) * 100, y = 1050 + Math.floor(i / 4) * 90, c = b.pick(TOPS); b.rect(x - 14, y - 16, x + 14, y + 2); b.item(y, [x - 20, y - 60, x + 20, y + 4], (g) => table(g, x, y, c)); b.person(x - 24, y + 2, b.outfit({ pose: 'sit', dress: false, item: null, flip: false })); b.person(x + 24, y + 2, b.outfit({ pose: 'sit', dress: false, item: null, flip: true })); }
    const cab = []; for (let i = 0; i < 9; i++) cab.push([b.rnd(0, 150), b.rnd(-10, 14)]);
    b.rect(120, 1050, 330, 1120); b.item(1100, [120, 1050, 340, 1124], (g) => { pen(g); g.save(); g.translate(170, 1100); g.rotate(-0.5); box(g, '#a07a4a', -30, -22, 60, 22, 2); circ(g, '#5a4030', -18, 2, 9); circ(g, '#5a4030', 18, 2, 9); g.restore(); for (const c of cab) circ(g, '#8fcf7f', 200 + c[0] * 0.9, 1100 + c[1], 6); });
    b.person(110, 1104, b.outfit({ pose: 'up', item: null, dress: false, flip: false }), 2);
    b.scene('The runaway cabbages', 'A tipped cart and its cabbages rolling off', [96, 1050, 340, 1124]);
    trees(b, [[60, 1150], [1540, 900], [1560, 380], [40, 640], [640, 1160], [1000, 1150]]);
    [[400, 380], [1200, 380], [400, 820], [1200, 820]].forEach((p) => { b.rect(p[0] - 4, p[1] - 6, p[0] + 4, p[1] + 2); b.item(p[1], [p[0] - 8, p[1] - 54, p[0] + 8, p[1] + 2], (g) => lamp(g, p[0], p[1])); });
  } },

  harbor: { name: 'Harbor', people: 1050, build(b) {
    turf(b, '#cfc9bd', '#c6bfb1', '#d8d2c6', 150);
    const piers = [260, 760, 1240];
    b.ground((g) => { g.fillStyle = '#5fb3d3'; g.fillRect(0, 760, DW, 440); g.strokeStyle = '#8fd0e6'; g.lineWidth = 2.4; g.lineCap = 'round'; for (let r = 0; r < 6; r++) for (let x = 30 + r * 50; x < DW; x += 210) { g.beginPath(); g.moveTo(x, 800 + r * 66); g.quadraticCurveTo(x + 26, 790 + r * 66, x + 52, 800 + r * 66); g.stroke(); } pen(g); box(g, '#8a8f98', -4, 742, DW + 8, 22, 2); for (const px of piers) { box(g, '#a07a4a', px - 45, 760, 90, 330, 3); for (let y = 774; y < 1086; y += 14) line(g, [px - 43, y, px + 43, y], 0.6, '#7a5236'); } });
    let x0 = -10; for (const px of piers) { b.rect(x0, 762, px - 44, 1210); x0 = px + 44; } b.rect(x0, 762, 1610, 1210); for (const px of piers) b.rect(px - 46, 1088, px + 46, 1210);
    for (const px of piers) b.crowd(34, px - 34, 780, px + 34, 1076, null);
    [[110, 900, '#e2564b', 'sail'], [510, 860, '#f2c230', 'fish'], [520, 1040, '#58b06b', 'row'], [1000, 900, '#3f7fd1', 'sail'], [1010, 1080, '#e88a3a', 'row'], [1440, 940, '#f1ede2', 'fish'], [1420, 1100, '#c44a7a', 'row']].forEach((s) => { b.item(s[1], [s[0] - 40, s[1] - 76, s[0] + 40, s[1] + 8], (g) => boat(g, s[0], s[1], s[2], s[3])); b.spot(s[0] - 10, s[1] - 12, s[1] + 0.5); });
    const fisher = { skin: SKIN[2], hair: HAIR[5], top: '#f2c230', bottom: '#3a4a6b', hat: 'sun', hatC: '#f1e3b0', item: 'rod' };
    b.rect(730, 1040, 800, 1086); b.person(752, 1078, fisher, 2);
    b.item(1140, [760, 1090, 800, 1150], (g) => { pen(g); g.save(); g.translate(778, 1136); poly(g, '#7a5236', [-3, -14, 3, -14, 3, -4, 8, -4, 8, 0, -3, 0]); g.restore(); line(g, [773, 1050, 777, 1122], 0.5); });
    b.scene('The big catch', 'A long wait on the pier for one old boot', [736, 1034, 800, 1150]);
    [['#b5533c', 'WAREHOUSE 1'], ['#7d8791', 'CUSTOMS'], ['#c9a36a', 'WAREHOUSE 2'], ['#5f8fa8', 'CHANDLER'], ['#b5533c', 'NETS AND ROPE']].forEach((f, i) => { const x = 40 + i * 318, w = 270, h = 140; put(b, 330, [x - 10, 140, x + w + 10, 336], (g) => building(g, x, 330, w, h, f[0], 'gable', { sign: f[1], roofH: 40, roofC: '#5b6470' }), [x - 4, 180, x + w + 4, 334]); b.spot(x + 50, 180, 331); });
    put(b, 720, [1440, 380, 1570, 726], (g) => { pen(g); oval(g, '#8a8f98', 1505, 716, 62, 16); poly(g, '#f4f1ea', [1482, 716, 1492, 470, 1518, 470, 1528, 716]); g.fillStyle = '#e2564b'; g.fillRect(1486, 620, 38, 26); g.fillRect(1490, 520, 30, 24); box(g, '#ffe07a', 1490, 440, 30, 30, 2); poly(g, '#e2564b', [1484, 440, 1505, 410, 1526, 440]); }, [1450, 690, 1560, 724]);
    const stacks = []; for (let i = 0; i < 16; i++) stacks.push([b.rnd(60, 1380), b.rnd(420, 700), b.R() < 0.4]);
    for (const s of stacks) { if (b.blocked(s[0], s[1])) continue; b.rect(s[0] - 14, s[1] - 14, s[0] + 14, s[1] + 2); b.item(s[1], [s[0] - 16, s[1] - 40, s[0] + 30, s[1] + 2], (g) => { if (s[2]) { barrel(g, s[0], s[1]); barrel(g, s[0] + 15, s[1] - 2); } else { crate(g, s[0], s[1], 20); crate(g, s[0] + 14, s[1] - 2, 16); crate(g, s[0] + 4, s[1] - 19, 16); } }); b.spot(s[0] + 4, s[1] - 36, s[1] + 0.5); }
    stalls(b, [[420, 520, '#49b8c4', 'FRESH FISH'], [900, 520, '#e2564b', 'CHOWDER']], 6);
    put(b, 700, [1080, 420, 1260, 706], (g) => { pen(g); box(g, '#f2c230', 1150, 640, 60, 60, 3); box(g, '#bfe0ee', 1160, 648, 22, 18, 2); g.save(); g.strokeStyle = '#d9a51e'; g.lineWidth = 7; g.beginPath(); g.moveTo(1180, 640); g.lineTo(1180, 450); g.lineTo(1090, 480); g.stroke(); g.restore(); line(g, [1096, 480, 1096, 560], 1); crate(g, 1096, 580, 22); }, [1140, 650, 1220, 704]);
  } },

  slopes: { name: 'Ski Slopes', people: 1100, build(b) {
    turf(b, '#f3f7fb', '#e6eef6', '#ffffff', 200);
    b.ground((g) => { g.strokeStyle = '#d5e2ee'; g.lineWidth = 2; g.lineCap = 'round'; for (let i = 0; i < 14; i++) { const x = 120 + i * 106; g.beginPath(); g.moveTo(x, 140); g.quadraticCurveTo(x - 60, 500, x + 40, 800); g.quadraticCurveTo(x + 90, 1000, x - 10, 1190); g.stroke(); } });
    put(b, 330, [40, 130, 420, 336], (g) => { building(g, 60, 330, 340, 130, '#a07a4a', 'gable', { sign: 'THE LODGE', roofC: '#f4f7fb', roofH: 60 }); pen(g); box(g, '#b5533c', 330, 150, 22, 44, 2); circ(g, '#e6e6e6', 345, 138, 9); circ(g, '#eeeeee', 356, 122, 7); }, [56, 190, 404, 334]);
    b.spot(140, 196, 331);
    const pyl = [[520, 260], [760, 440], [1000, 620], [1240, 800], [1480, 980]];
    b.ground((g) => { g.strokeStyle = '#5b6470'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(400, 100); g.lineTo(1600, 1000); g.stroke(); });
    for (const p of pyl) { b.rect(p[0] - 8, p[1] - 6, p[0] + 8, p[1] + 4); b.item(p[1], [p[0] - 22, p[1] - 80, p[0] + 22, p[1] + 4], (g) => { pen(g); box(g, '#7d8791', p[0] - 3, p[1] - 70, 6, 70, 1); box(g, '#7d8791', p[0] - 20, p[1] - 76, 40, 6, 2); }); }
    for (let i = 0; i < 9; i++) { const x = 470 + i * 122, y = 100 + (x - 400) * 0.75 - 48 + 50; const o = b.outfit({ pose: 'sit', dress: false, item: null, noShadow: 1 }); b.item(y + 30, [x - 16, y - 40, x + 16, y + 20], (g) => { pen(g); line(g, [x, y - 44, x, y - 6], 1.2, '#5b6470'); box(g, '#e2564b', x - 12, y - 6, 24, 5, 2); wantedPerson(g, x, y - 4, o, 1); }); }
    b.ell(1180, 380, 190, 100); b.ground((g) => { pen(g); oval(g, '#cfeaf5', 1180, 380, 180, 92); line(g, [1080, 350, 1140, 372, 1200, 420, 1270, 400], 0.6, '#ffffff'); });
    b.avoid.pop();
    b.crowd(46, 1020, 300, 1340, 450, () => ({ pose: b.R() < 0.4 ? 'up' : 'stand', item: null, scarf: b.pick(SCARVES) }));
    [[240, 560], [620, 900], [980, 1080], [1420, 520], [320, 1080], [860, 240]].forEach((p) => { b.rect(p[0] - 12, p[1] - 10, p[0] + 12, p[1] + 3); b.item(p[1], [p[0] - 14, p[1] - 46, p[0] + 14, p[1] + 4], (g) => snowman(g, p[0], p[1])); b.spot(p[0] + 12, p[1], p[1] + 0.5); });
    const tr = []; for (let i = 0; i < 26; i++) tr.push([b.rnd(40, 1560), b.rnd(160, 1180)]);
    trees(b, tr.filter((t) => !b.blocked(t[0], t[1]) && !(t[0] > 400 && Math.abs(t[1] - (100 + (t[0] - 400) * 0.75)) < 70)), 'snowpine');
    stalls(b, [[620, 640, '#e2564b', 'HOT COCOA'], [1300, 1100, '#3f7fd1', 'SKI HIRE']], 6);
    b.knot(30, 300, 780, 60, 30, { item: null, pose: 'up' }); b.knot(30, 520, 800, 60, 30, { item: null, pose: 'up' });
    const balls = []; for (let i = 0; i < 12; i++) balls.push([b.rnd(350, 480), b.rnd(720, 790)]);
    b.item(800, [340, 716, 490, 794], (g) => { pen(g); for (const s of balls) circ(g, '#ffffff', s[0], s[1], 3); });
    b.scene('The snowball fight', 'Two sides, a lot of snowballs in the air between them', [220, 720, 600, 830]);
    b.fill = () => ({ item: b.R() < 0.34 ? 'skis' : null, itemC: b.pick(TOPS), scarf: b.R() < 0.5 ? b.pick(SCARVES) : null, hat: b.R() < 0.5 ? 'beret' : null, hatC: b.pick(TOPS), dress: false });
  } },

  zoo: { name: 'Zoo', people: 1250, build(b) {
    turf(b, '#b4d79a', '#a9cf8e', '#bfdea6');
    paths(b, '#ead9ae', 54, [[800, 110, 800, 1210], [-20, 660, 1620, 660], [800, 660, 300, 400], [800, 660, 1300, 400], [800, 660, 300, 950], [800, 660, 1300, 950]]);
    put(b, 210, [690, 110, 910, 216], (g) => { pen(g); box(g, '#b5533c', 700, 130, 28, 80, 2); box(g, '#b5533c', 872, 130, 28, 80, 2); g.fillStyle = '#f2c230'; g.beginPath(); g.moveTo(696, 150); g.quadraticCurveTo(800, 80, 904, 150); g.lineTo(904, 172); g.quadraticCurveTo(800, 108, 696, 172); g.closePath(); g.fill(); g.stroke(); label(g, 'ZOO', 800, 140, 20); }, null);
    b.rect(696, 130, 730, 212); b.rect(870, 130, 904, 212);
    pen4(b, 60, 200, 620, 480, '#d9c79a'); beasts(b, 'elephant', 3, 150, 300, 540, 460, 1.2);
    pen4(b, 980, 200, 1540, 480, '#cfe0a0'); beasts(b, 'giraffe', 4, 1060, 310, 1480, 460, 1.3);
    pen4(b, 60, 800, 560, 1140, '#e9d7a0'); beasts(b, 'lion', 3, 140, 900, 480, 1120, 1.2); beasts(b, 'camel', 2, 140, 880, 480, 1100, 1.1);
    pen4(b, 1040, 800, 1540, 1140, '#dfe8ee'); b.ground((g) => { pen(g); oval(g, '#8fd0ea', 1290, 990, 170, 90); }); beasts(b, 'penguin', 14, 1080, 860, 1500, 1130, 1);
    pen4(b, 980, 520, 1300, 620, '#c9b98a'); beasts(b, 'bear', 2, 1040, 580, 1260, 610, 1.1);
    pen4(b, 300, 540, 620, 620, '#cfe0a0'); beasts(b, 'goat', 5, 330, 580, 590, 612, 1);
    stalls(b, [[640, 880, '#e77fb0', 'ICE CREAM'], [960, 880, '#f2c230', 'GIFT SHOP']], 7);
    b.rect(632, 990, 666, 1016); b.item(1012, [630, 984, 668, 1016], (g) => animal(g, 'penguin', 648, 1012, false, 1.1));
    b.scene('The escaped penguin', 'Out of its pool and waiting in line for ice cream', [634, 984, 664, 1016]);
    trees(b, [[40, 150], [1560, 150], [660, 300], [940, 300], [700, 500, 'palm'], [900, 500, 'palm'], [40, 700], [1560, 700], [660, 1160], [940, 1160], [1380, 660], [220, 660]]);
    const bal = { skin: SKIN[2], hair: HAIR[1], top: '#e2564b', bottom: '#3a4a6b', item: 'balloons' };
    b.rect(730, 420, 760, 440); b.person(744, 436, bal, 2);
  } },

  camp: { name: 'Campground', people: 1100, build(b) {
    turf(b, '#9cc78a', '#91be7f', '#a8d096');
    paths(b, '#d9c7a0', 34, [[-20, 300, 500, 380, 900, 320, 1620, 420], [500, 380, 420, 800, 620, 1210], [900, 320, 1100, 700, 1000, 1210]]);
    water(b, 1220, 960, 300, 150, '#6fb6d6');
    [[1100, 940, '#e2564b'], [1320, 1010, '#f2c230'], [1260, 900, '#58b06b']].forEach((c) => { const o1 = b.outfit({ pose: 'sit', dress: false, item: null, noShadow: 1 }), o2 = b.outfit({ pose: 'sit', dress: false, item: null, noShadow: 1 }); b.item(c[1] + 4, [c[0] - 40, c[1] - 40, c[0] + 40, c[1] + 8], (g) => { wantedPerson(g, c[0] - 10, c[1] - 6, o1, 1); wantedPerson(g, c[0] + 12, c[1] - 6, o2, 1); pen(g); poly(g, c[2], [c[0] - 36, c[1] - 10, c[0] + 36, c[1] - 10, c[0] + 26, c[1] + 4, c[0] - 26, c[1] + 4]); }); b.spot(c[0] - 26, c[1] - 10, c[1] + 4.5); });
    const tents = []; for (let i = 0; i < 26; i++) tents.push([b.rnd(70, 1530), b.rnd(180, 1160), b.pick(TOPS)]);
    for (const t of tents) { if (!b.areaFree(t[0] - 34, t[1] - 40, t[0] + 34, t[1] + 6)) continue; b.rect(t[0] - 30, t[1] - 30, t[0] + 30, t[1] + 4); b.item(t[1], [t[0] - 32, t[1] - 44, t[0] + 32, t[1] + 6], (g) => tentA(g, t[0], t[1], t[2])); b.spot(t[0] + 12, t[1] - 16, t[1] + 0.5); }
    [[320, 620], [760, 560], [660, 980], [1380, 560], [220, 1040]].forEach((f) => { if (!b.areaFree(f[0] - 16, f[1] - 22, f[0] + 16, f[1] + 4)) return; b.rect(f[0] - 14, f[1] - 14, f[0] + 14, f[1] + 4); b.item(f[1], [f[0] - 14, f[1] - 24, f[0] + 14, f[1] + 4], (g) => fire(g, f[0], f[1])); for (const c of C8) b.person(f[0] + c[0] * 46, f[1] + c[1] * 24 + 4, b.outfit({ pose: 'sit', dress: false, item: null, flip: c[0] > 0 })); });
    [[160, 260, '#f1ede2'], [1400, 300, '#bfe0ee']].forEach((v) => put(b, v[1], [v[0] - 50, v[1] - 42, v[0] + 50, v[1] + 6], (g) => car(g, v[0], v[1], v[2], 'bus'), [v[0] - 48, v[1] - 30, v[0] + 48, v[1] + 4]));
    b.rect(840, 800, 960, 880); b.item(866, [846, 806, 954, 870], (g) => { pen(g); box(g, '#a07a4a', 852, 838, 96, 8, 2); box(g, '#a07a4a', 860, 846, 6, 20, 1); box(g, '#a07a4a', 934, 846, 6, 20, 1); box(g, '#a07a4a', 852, 858, 96, 5, 2); animal(g, 'bear', 900, 838, false, 0.9); circ(g, '#e2564b', 876, 834, 4); box(g, '#f4f1ea', 918, 830, 12, 6, 1); });
    b.crowd(5, 990, 800, 1060, 860, { pose: 'up', item: null, dress: false, flip: false });
    b.scene('The uninvited guest', 'A bear has taken over the picnic table', [846, 806, 954, 870]);
    const tr = []; for (let i = 0; i < 40; i++) tr.push([b.rnd(30, 1570), b.rnd(160, 1190)]);
    trees(b, tr.filter((t) => b.areaFree(t[0] - 14, t[1] - 10, t[0] + 14, t[1] + 4)), 'pine');
  } },

  sportsday: { name: 'Sports Day', people: 1300, build(b) {
    turf(b, '#a5d08a', '#9bc880', '#b0d896');
    b.ground((g) => { pen(g); g.lineWidth = 1.4; g.fillStyle = '#d9785a'; rr(g, 150, 420, 1300, 560, 280); g.fillStyle = '#8fc47a'; rr(g, 260, 530, 1080, 340, 170); g.strokeStyle = '#ffffff'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); const d = k * 27; g.moveTo(150 + 280, 420 + d); g.lineTo(1450 - 280, 420 + d); g.arcTo(1450 - d, 420 + d, 1450 - d, 700, 280 - d); g.arcTo(1450 - d, 980 - d, 1170, 980 - d, 280 - d); g.lineTo(430, 980 - d); g.arcTo(150 + d, 980 - d, 150 + d, 700, 280 - d); g.arcTo(150 + d, 420 + d, 430, 420 + d, 280 - d); g.stroke(); } g.strokeRect(520, 580, 560, 240); g.beginPath(); g.moveTo(800, 580); g.lineTo(800, 820); g.stroke(); g.beginPath(); g.arc(800, 700, 44, 0, 7); g.stroke(); });
    put(b, 150, [280, 130, 1320, 346], (g) => { pen(g); for (let r = 0; r < 6; r++) box(g, r % 2 ? '#c9ced6' : '#b9bec6', 300 + r * 6, 150 + r * 30, 1000 - r * 12, 32, 2); }, [296, 150, 1304, 344]);
    b.avoid.pop();
    for (let r = 0; r < 6; r++) for (let x = 320 + r * 6; x < 1290 - r * 6; x += 15) if (b.R() < 0.82) b.person(x + b.rnd(-2, 2), 176 + r * 30, b.outfit({ pose: b.R() < 0.25 ? 'up' : 'sit', dress: false, item: b.R() < 0.1 ? 'flag' : null, itemC: b.pick(TOPS) }));
    b.rect(296, 150, 1304, 344);
    const run = []; for (let i = 0; i < 7; i++) run.push(b.outfit({ pose: 'fwd', dress: false, item: null, flip: false, hat: null, top: b.pick(TOPS), bottom: '#2f2f35', s: 1 }));
    run.forEach((o, i) => b.person(560 + i * 62 + b.rnd(-12, 12), 440 + (i % 4) * 26, o, 2));
    b.person(1040, 506, b.outfit({ pose: 'fwd', dress: false, item: null, flip: true, hat: null, top: '#f2c230', bottom: '#2f2f35', s: 1 }), 2);
    b.scene('The wrong-way runner', 'Everybody else on the track is going the other direction', [1026, 468, 1056, 510]);
    put(b, 520, [1090, 400, 1110, 524], (g) => { pen(g); line(g, [1100, 420, 1100, 520], 2.4, '#5a4030'); }, null);
    b.item(421, [1094, 396, 1210, 424], (g) => { pen(g); box(g, '#ffffff', 1100, 400, 104, 20, 2); label(g, 'FINISH', 1152, 415, 12); });
    for (let i = 0; i < 14; i++) b.person(560 + (i % 7) * 70 + b.rnd(-14, 14), 640 + Math.floor(i / 7) * 110 + b.rnd(-20, 20), b.outfit({ pose: b.R() < 0.4 ? 'fwd' : 'stand', dress: false, item: null, hat: null, top: i < 7 ? '#e2564b' : '#3f7fd1', bottom: '#ffffff' }));
    b.item(700, [796, 692, 806, 704], (g) => { pen(g); circ(g, '#ffffff', 800, 698, 5); });
    [[500, 700], [1100, 700]].forEach((p, i) => b.item(p[1] + 40, [p[0] - 30, p[1] - 44, p[0] + 30, p[1] + 44], (g) => { pen(g); g.fillStyle = 'rgba(255,255,255,.5)'; const x = p[0] + (i ? 0 : -24); g.fillRect(x, p[1] - 40, 24, 80); g.strokeRect(x, p[1] - 40, 24, 80); }));
    put(b, 1150, [660, 1040, 940, 1156], (g) => { pen(g); box(g, '#2f2f35', 680, 1050, 240, 80, 4); box(g, '#5a4030', 700, 1130, 8, 22); box(g, '#5a4030', 892, 1130, 8, 22); label(g, 'REDS 3   BLUES 3', 800, 1098, 20, '#f2c230'); }, [676, 1100, 924, 1154]);
    stalls(b, [[150, 1100, '#f2c230', 'LEMONADE'], [1450, 1100, '#e2564b', 'MEDALS']], 6);
    trees(b, [[60, 200], [1540, 200], [60, 1000], [1540, 1000], [150, 380], [1450, 380]]);
    b.knot(60, 800, 1010, 300, 16, { item: null });
  } },

  station: { name: 'Train Station', people: 1300, build(b) {
    turf(b, '#d2cdc3', '#c9c3b8', '#dad5cc', 140);
    const rails = [470, 760, 1050];
    b.ground((g) => { for (const y of rails) { g.fillStyle = '#9a9488'; g.fillRect(0, y - 26, DW, 52); g.fillStyle = '#7a5236'; for (let x = 6; x < DW; x += 22) g.fillRect(x, y - 20, 8, 40); g.strokeStyle = '#5b6470'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y - 12); g.lineTo(DW, y - 12); g.moveTo(0, y + 12); g.lineTo(DW, y + 12); g.stroke(); g.strokeStyle = '#f2c230'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y - 34); g.lineTo(DW, y - 34); g.moveTo(0, y + 34); g.lineTo(DW, y + 34); g.stroke(); } });
    for (const y of rails) b.rect(-10, y - 30, 1610, y + 30);
    put(b, 330, [300, 110, 1300, 336], (g) => { building(g, 340, 330, 920, 150, '#e3d2b0', 'flat', { sign: 'CENTRAL STATION', signY: 120, roofC: '#b5533c' }); tower(g, 800, 180, 90, 60, '#e3d2b0', '#b5533c'); pen(g); circ(g, '#ffffff', 800, 150, 20); line(g, [800, 150, 800, 136, 800, 150, 812, 150], 1.6); }, [336, 170, 1264, 334]);
    b.spot(420, 176, 331);
    [[420, 478, '#e2564b', true], [1100, 478, '#e2564b', false], [900, 768, '#3f7fd1', true], [300, 1058, '#58b06b', true], [540, 1058, '#58b06b', false]].forEach((t) => b.item(t[1], [t[0] - 64, t[1] - 40, t[0] + 90, t[1] + 6], (g) => train(g, t[0], t[1], t[2], t[3])));
    b.fill = () => (b.R() < 0.3 ? { item: 'case', itemC: b.pick(['#7a5236', '#3a4a6b', '#c0392b', '#2f2f35']) } : null);
    for (let i = 0; i < 10; i++) { const x = 110 + i * 150, y = [600, 890][i % 2] + (i % 3) * 14; b.rect(x - 22, y - 10, x + 22, y + 2); b.item(y, [x - 24, y - 16, x + 24, y + 2], (g) => bench(g, x, y)); b.person(x - 8, y - 2, b.outfit({ pose: 'sit', dress: false, item: null })); b.person(x + 9, y - 2, b.outfit({ pose: 'sit', dress: false, item: null })); }
    [[240, 560], [720, 560], [1200, 560], [240, 870], [720, 870], [1200, 870], [480, 1150], [1100, 1150]].forEach((p) => { b.rect(p[0] - 4, p[1] - 6, p[0] + 4, p[1] + 2); b.item(p[1], [p[0] - 8, p[1] - 54, p[0] + 8, p[1] + 2], (g) => lamp(g, p[0], p[1])); });
    stalls(b, [[1400, 640, '#f2c230', 'COFFEE'], [140, 380, '#3f7fd1', 'TICKETS']], 7);
    const cs = []; for (let i = 0; i < 8; i++) cs.push(b.pick(['#7a5236', '#3a4a6b', '#c0392b', '#2f2f35', '#58b06b']));
    b.rect(980, 610, 1040, 680); b.person(1000, 676, { skin: SKIN[3], hair: HAIR[0], top: '#3a4a6b', bottom: '#3a4a6b', hat: 'cap', hatC: '#c0392b', pose: 'fwd', flip: false }, 2);
    b.item(677, [1008, 596, 1036, 680], (g) => { pen(g); cs.forEach((c, i) => box(g, c, 1012 + (i % 2) * 2, 666 - i * 10, 20, 10, 2)); });
    b.scene('The porter', 'Eight suitcases in one stack, and he is still walking', [988, 596, 1038, 680]);
    b.knot(70, 800, 380, 260, 20, { item: 'case', itemC: '#7a5236' });
  } },

  castle: { name: 'Castle Fair', people: 1250, build(b) {
    turf(b, '#a9d18e', '#9fc984', '#b3d899');
    paths(b, '#e0cfa0', 44, [[800, 400, 800, 1210], [-20, 800, 1620, 800]]);
    b.ground((g) => { pen(g); g.lineWidth = 1; g.fillStyle = '#7fc4e0'; rr(g, 380, 380, 840, 40, 18); box(g, '#a07a4a', 760, 372, 80, 56, 2); });
    b.rect(376, 376, 758, 424); b.rect(842, 376, 1224, 424);
    put(b, 372, [400, 110, 1200, 378], (g) => { pen(g); box(g, '#cfc9bd', 440, 230, 720, 140, 2); for (let x = 440; x < 1150; x += 36) box(g, '#cfc9bd', x, 218, 22, 14, 1); tower(g, 440, 372, 80, 200, '#d8d2c6', '#b5533c'); tower(g, 1160, 372, 80, 200, '#d8d2c6', '#b5533c'); tower(g, 800, 372, 120, 240, '#d8d2c6', '#3f5fb0'); g.fillStyle = '#3a2a1c'; g.beginPath(); g.moveTo(770, 372); g.lineTo(770, 320); g.quadraticCurveTo(800, 290, 830, 320); g.lineTo(830, 372); g.closePath(); g.fill(); g.stroke(); flag(g, 800, 86, 20, '#f2c230'); flag(g, 440, 126, 16, '#e2564b'); flag(g, 1160, 126, 16, '#e2564b'); pen(g); g.save(); g.translate(1010, 218); oval(g, '#58b06b', 0, -8, 12, 9); poly(g, '#58b06b', [8, -12, 22, -16, 22, -8]); poly(g, '#3f8a4f', [-6, -15, -1, -24, 3, -15]); g.fillStyle = OUT; g.beginPath(); g.arc(4, -10, 1.2, 0, 7); g.fill(); poly(g, '#e88a3a', [22, -13, 34, -16, 30, -11, 36, -9, 22, -9]); g.restore(); }, [400, 150, 1200, 374]);
    b.scene('The dragon', 'Small, green, and peeking over the castle wall', [992, 186, 1050, 222]);
    [[200, 560, '#e2564b', '#f2c230'], [330, 620, '#3f7fd1', '#ffffff'], [1280, 560, '#8f6ad0', '#f2c230'], [1420, 640, '#58b06b', '#ffffff'], [150, 980, '#e88a3a', '#ffffff'], [1450, 1000, '#c44a7a', '#f2c230']].forEach((t) => put(b, t[1], [t[0] - 34, t[1] - 46, t[0] + 34, t[1] + 6], (g) => tentA(g, t[0], t[1], t[2], t[3]), [t[0] - 30, t[1] - 30, t[0] + 30, t[1] + 4]));
    b.rect(380, 880, 1220, 960); b.ground((g) => { pen(g); box(g, '#e6d7ae', 380, 900, 840, 44, 4); });
    b.item(923, [380, 906, 1220, 926], (g) => fence(g, 400, 922, 1200, '#f4f1ea'));
    const kn = [{ skin: SKIN[1], hair: HAIR[0], top: '#e2564b', bottom: '#b9bec6', hat: 'helmet', pose: 'fwd', noShadow: 1, flip: false }, { skin: SKIN[1], hair: HAIR[0], top: '#3f7fd1', bottom: '#b9bec6', hat: 'helmet', pose: 'fwd', noShadow: 1, flip: true }];
    b.item(916, [520, 850, 640, 920], (g) => { animal(g, 'horse', 580, 916, false, 1.2); wantedPerson(g, 578, 890, kn[0], 1); line(g, [590, 876, 640, 870], 1.6, '#7a5236'); });
    b.item(944, [960, 878, 1080, 948], (g) => { animal(g, 'horse', 1020, 944, true, 1.2); wantedPerson(g, 1022, 918, kn[1], 1); line(g, [1010, 904, 960, 898], 1.6, '#7a5236'); });
    b.crowd(60, 400, 846, 1200, 876, { item: null }); b.crowd(60, 400, 966, 1200, 1000, { item: null });
    const rib = TOPS.slice(0, 8);
    b.rect(1290, 860, 1310, 876); b.item(872, [1210, 730, 1390, 880], (g) => { pen(g); line(g, [1300, 872, 1300, 740], 3, '#f4f1ea'); C8.forEach((c, i) => line(g, [1300, 742, 1300 + c[0] * 80, 872 + c[1] * 34 - 22], 1.2, rib[i])); circ(g, '#f2c230', 1300, 738, 5); });
    C8.forEach((c, i) => b.person(1300 + c[0] * 80, 872 + c[1] * 34, b.outfit({ pose: 'up', item: null, dress: i % 2 === 0, flip: c[0] > 0 })));
    [[240, 760], [300, 760], [360, 760]].forEach((p) => b.item(p[1], [p[0] - 14, p[1] - 40, p[0] + 14, p[1] + 2], (g) => { pen(g); line(g, [p[0] - 8, p[1], p[0], p[1] - 22, p[0] + 8, p[1]], 1.6, '#7a5236'); circ(g, '#ffffff', p[0], p[1] - 24, 12); circ(g, '#e2564b', p[0], p[1] - 24, 7.5); circ(g, '#f2c230', p[0], p[1] - 24, 3); }));
    b.rect(220, 720, 380, 764);
    stalls(b, [[640, 620, '#8f6ad0', 'MEAD'], [960, 620, '#e88a3a', 'PIES'], [1100, 1100, '#58b06b', 'POTIONS'], [520, 1100, '#e2564b', 'SHIELDS']], 5);
    trees(b, [[60, 200], [220, 300], [1380, 300], [1540, 200], [60, 1150], [1540, 1150], [800, 1180, 'autumn'], [300, 1160], [1300, 1160]]);
  } },

  farm: { name: 'Farm', people: 1100, build(b) {
    turf(b, '#b7d892', '#acd087', '#c2df9e');
    b.ground((g) => { pen(g); g.lineWidth = 1; box(g, '#c9a877', 60, 760, 520, 380, 6); g.strokeStyle = '#a8875a'; g.lineWidth = 2; for (let y = 780; y < 1130; y += 22) { g.beginPath(); g.moveTo(70, y); g.lineTo(570, y); g.stroke(); } pen(g); g.lineWidth = 1; box(g, '#ecd27a', 1020, 760, 520, 380, 6); g.strokeStyle = '#d9b84e'; g.lineWidth = 2; for (let x = 1040; x < 1530; x += 18) { g.beginPath(); g.moveTo(x, 770); g.lineTo(x, 1130); g.stroke(); } });
    paths(b, '#dccb9c', 40, [[800, 110, 800, 1210], [-20, 700, 1620, 700]]);
    put(b, 380, [160, 150, 480, 386], (g) => { building(g, 180, 380, 280, 150, '#c0392b', 'gable', { roofC: '#7a1f2a', roofH: 70, win: '#fff7dc', door: '#fff7dc', sign: 'BARN', signY: 122 }); }, [176, 220, 464, 384]);
    b.spot(250, 226, 381);
    put(b, 380, [500, 170, 580, 386], (g) => { pen(g); box(g, '#c9ced6', 510, 220, 60, 160, 6); g.fillStyle = '#9aa0a8'; g.beginPath(); g.arc(540, 220, 30, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); }, [506, 300, 574, 384]);
    put(b, 340, [1040, 170, 1300, 346], (g) => building(g, 1060, 340, 220, 110, '#f3ead2', 'gable', { roofC: '#5b6470', sign: 'FARMHOUSE' }), [1056, 220, 1284, 344]);
    put(b, 420, [1360, 150, 1540, 426], (g) => { tower(g, 1450, 420, 60, 150, '#e9e2d0', '#7a5236'); pen(g); g.save(); g.translate(1450, 250); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); poly(g, '#f4f1ea', [0, 0, 8, -70, -8, -70]); } g.restore(); circ(g, '#5a4030', 1450, 250, 6); }, [1416, 330, 1484, 424]);
    pen4(b, 620, 200, 960, 420, '#a9cf8e'); beasts(b, 'cow', 6, 660, 260, 920, 410, 1.1);
    pen4(b, 620, 480, 960, 640, '#b7d892'); beasts(b, 'sheep', 9, 650, 530, 930, 630, 1);
    pen4(b, 1040, 480, 1300, 640, '#c9a877'); beasts(b, 'pig', 7, 1070, 530, 1270, 630, 1);
    b.rect(280, 560, 380, 640); b.item(636, [270, 570, 390, 642], (g) => { car(g, 330, 636, '#3f9b4b', 'truck'); animal(g, 'pig', 322, 600, false, 1); });
    b.scene('The pig at the wheel', 'One pig has left the pen and climbed onto the tractor', [296, 578, 372, 606]);
    const hs = []; for (let i = 0; i < 14; i++) hs.push([b.rnd(1050, 1500), b.rnd(800, 1110)]);
    for (const h of hs) { b.item(h[1], [h[0] - 18, h[1] - 22, h[0] + 18, h[1] + 2], (g) => hay(g, h[0], h[1])); b.spot(h[0], h[1] - 20, h[1] + 0.5); }
    b.rect(310, 940, 330, 960); b.item(958, [290, 890, 350, 962], (g) => { pen(g); line(g, [320, 958, 320, 906, 300, 922, 340, 922], 2, '#7a5236'); wantedPerson(g, 320, 944, { skin: '#e6cf7a', hair: '#e6cf7a', top: '#e88a3a', bottom: '#3a4a6b', hat: 'sun', hatC: '#c9a36a', pose: 'up', noShadow: 1 }, 1); });
    water(b, 800, 950, 110, 60); b.item(960, [740, 920, 860, 976], (g) => { animal(g, 'duck', 770, 950, false, 1); animal(g, 'duck', 820, 966, true, 1); animal(g, 'duck', 840, 940, false, 0.8); });
    for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const x = 100 + k * 84, y = 480 + r * 90; if (x > 260 && x < 400 && r === 1) continue; b.ell(x, y - 2, 12, 7); b.item(y, [x - 40, y - 96, x + 40, y + 8], (g) => tree(g, x, y, (r + k) % 3 === 0 ? 'blossom' : 'round')); }
    stalls(b, [[900, 1100, '#e2564b', 'FARM SHOP'], [700, 1100, '#f2c230', 'FRESH EGGS']], 6);
  } },

  downtown: { name: 'Downtown', people: 1350, build(b) {
    turf(b, '#d5d8dc', '#cdd0d5', '#dcdfe3', 120);
    b.ground((g) => { g.fillStyle = '#8a8f98'; g.fillRect(0, 430, DW, 120); g.fillRect(0, 850, DW, 120); g.fillRect(740, 110, 120, 1100); g.strokeStyle = '#f2c230'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 490); g.lineTo(730, 490); g.moveTo(870, 490); g.lineTo(DW, 490); g.moveTo(0, 910); g.lineTo(730, 910); g.moveTo(870, 910); g.lineTo(DW, 910); g.moveTo(800, 110); g.lineTo(800, 420); g.moveTo(800, 560); g.lineTo(800, 840); g.moveTo(800, 980); g.lineTo(800, DH); g.stroke(); g.fillStyle = '#f4f4f0'; for (const cy of [430, 850]) for (const cx of [640, 880]) for (let k = 0; k < 7; k++) g.fillRect(cx, cy + 6 + k * 16, 80, 9); });
    for (const y of [430, 850]) { b.rect(-10, y, 636, y + 120); b.rect(724, y, 876, y + 120); b.rect(964, y, 1610, y + 120); }
    b.rect(740, 100, 860, 432); b.rect(740, 548, 860, 852); b.rect(740, 968, 860, 1210);
    const tops = [['#e9b7a0', 'CAFE', 190], ['#b9c7e0', 'BANK', 250], ['#e6d39a', 'HOTEL', 290], ['#d9c3e6', 'CINEMA', 220], ['#bfe0c8', 'BOOKS', 180], ['#e3b6b6', 'DELI', 240]];
    tops.forEach((f, i) => { const w = 200, x = 20 + i * 250 + (i > 2 ? 120 : -10), h = f[2]; put(b, 410, [x - 8, 410 - h - 14, x + w + 8, 416], (g) => building(g, x, 410, w, h, f[0], 'flat', { sign: f[1] }), [x - 4, 150, x + w + 4, 414]); b.spot(x + 60, 410 - h - 10, 411); });
    [['#c9d6a8', 'GYM', 150], ['#e6c9a8', 'PIZZA', 130], ['#b9d6d9', 'TOYS', 160]].forEach((f, i) => { const w = 190, x = 900 + i * 232, h = f[2]; put(b, 830, [x - 8, 830 - h - 14, x + w + 8, 836], (g) => building(g, x, 830, w, h, f[0], 'flat', { sign: f[1] }), [x - 4, 830 - h - 10, x + w + 4, 834]); });
    const ww = { skin: SKIN[2], hair: HAIR[0], top: '#f08a24', bottom: '#3a4a6b', hat: 'hard', hatC: '#f2c230', pose: 'up', noShadow: 1 };
    b.item(411.5, [560, 170, 640, 230], (g) => { pen(g); line(g, [572, 130, 572, 214, 628, 130, 628, 214], 0.8); box(g, '#c9a36a', 566, 214, 68, 6, 1); wantedPerson(g, 600, 214, ww, 1); });
    b.scene('The window washer', 'Hanging off the side of the hotel on a plank', [566, 176, 634, 222]);
    [[200, 478, '#e2564b', 'car'], [420, 520, '#3f7fd1', 'bus'], [1100, 478, '#f2c230', 'car'], [1380, 520, '#58b06b', 'truck'], [300, 898, '#8f6ad0', 'car'], [560, 940, '#f1ede2', 'car'], [1150, 898, '#e88a3a', 'bus'], [1450, 940, '#49b8c4', 'car']].forEach((v) => b.item(v[1], [v[0] - 50, v[1] - 44, v[0] + 50, v[1] + 6], (g) => car(g, v[0], v[1], v[2], v[3])));
    b.ell(360, 700, 78, 46); b.item(740, [284, 640, 436, 744], (g) => fountain(g, 360, 700));
    stalls(b, [[160, 1100, '#e2564b', 'TACOS'], [420, 1100, '#49b8c4', 'NOODLES'], [620, 760, '#f2c230', 'NEWS']], 7);
    [[120, 600], [600, 600], [1000, 600], [1500, 600], [120, 1020], [620, 1020], [1000, 1020], [1500, 1020], [700, 400], [900, 400]].forEach((p) => { b.rect(p[0] - 4, p[1] - 6, p[0] + 4, p[1] + 2); b.item(p[1], [p[0] - 8, p[1] - 54, p[0] + 8, p[1] + 2], (g) => lamp(g, p[0], p[1])); });
    trees(b, [[240, 620], [520, 800], [960, 1100], [1300, 1100], [1540, 1150], [60, 800]]);
    b.crowd(40, 644, 436, 720, 544, { item: null }); b.crowd(40, 884, 436, 960, 544, { item: null }); b.crowd(30, 644, 856, 720, 964, { item: null }); b.crowd(30, 884, 856, 960, 964, { item: null });
  } },

  airfield: { name: 'Airfield', people: 1150, build(b) {
    turf(b, '#afd693', '#a4cd88', '#badd9f');
    b.ground((g) => { g.fillStyle = '#8a8f98'; g.fillRect(0, 500, DW, 150); g.fillStyle = '#f4f4f0'; g.fillRect(0, 571, DW, 6); for (let i = 0; i < 6; i++) { g.fillRect(30 + i * 9, 512, 5, 50); g.fillRect(1520 + i * 9, 590, 5, 50); } g.fillStyle = '#b9bec6'; g.fillRect(120, 220, 900, 250); });
    b.rect(-10, 494, 1610, 656);
    put(b, 300, [40, 130, 420, 306], (g) => { pen(g); box(g, '#9aa0a8', 60, 180, 340, 120, 4); g.fillStyle = '#7d8791'; g.beginPath(); g.moveTo(52, 190); g.quadraticCurveTo(230, 110, 408, 190); g.closePath(); g.fill(); g.stroke(); box(g, '#3a3f48', 110, 220, 240, 80, 3); label(g, 'HANGAR 7', 230, 176, 13); }, [56, 170, 404, 304]);
    put(b, 440, [1340, 150, 1460, 446], (g) => { pen(g); box(g, '#e9e2d0', 1380, 250, 40, 190, 3); poly(g, '#bfe0ee', [1356, 250, 1366, 200, 1434, 200, 1444, 250]); box(g, '#5b6470', 1360, 190, 80, 12, 3); line(g, [1400, 190, 1400, 160], 1.4); circ(g, '#e2564b', 1400, 158, 4); }, [1376, 380, 1424, 444]);
    [[520, 330, '#e2564b'], [800, 420, '#3f7fd1'], [620, 600, '#f2c230']].forEach((p, i) => { if (i < 2) b.rect(p[0] - 50, p[1] - 40, p[0] + 50, p[1] + 16); b.item(p[1] + 16, [p[0] - 50, p[1] - 48, p[0] + 50, p[1] + 20], (g) => plane(g, p[0], p[1], p[2])); b.spot(p[0] + 20, p[1] - 20, p[1] + 16.5); });
    b.item(701, [0, 684, DW, 704], (g) => fence(g, 20, 700, 1580, '#f4f1ea')); b.rect(-10, 660, 1610, 704);
    b.crowd(150, 30, 708, 1570, 760, () => (b.R() < 0.3 ? { pose: 'up', item: null } : { item: b.R() < 0.2 ? 'flag' : null, itemC: b.pick(TOPS) }));
    [[260, 960, '#e2564b', '#f2c230'], [800, 1060, '#3f7fd1', '#ffffff'], [1320, 940, '#8f6ad0', '#f2c230']].forEach((h) => { const o1 = b.outfit({ noShadow: 1, s: 0.8, item: null }), o2 = b.outfit({ noShadow: 1, s: 0.8, item: null, pose: 'up' }); b.rect(h[0] - 30, h[1] - 20, h[0] + 30, h[1] + 4); b.item(h[1], [h[0] - 74, h[1] - 250, h[0] + 74, h[1] + 6], (g) => { pen(g); shadow(g, h[0], h[1], 30, 5); g.fillStyle = h[2]; g.beginPath(); g.ellipse(h[0], h[1] - 170, 70, 78, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = h[3]; g.beginPath(); g.ellipse(h[0], h[1] - 170, 26, 78, 0, 0, 7); g.fill(); g.stroke(); line(g, [h[0] - 40, h[1] - 104, h[0] - 14, h[1] - 60, h[0] + 40, h[1] - 104, h[0] + 14, h[1] - 60], 0.8); wantedPerson(g, h[0] - 6, h[1] - 46, o1, 1); wantedPerson(g, h[0] + 7, h[1] - 46, o2, 1); box(g, '#a07a4a', h[0] - 16, h[1] - 60, 32, 22, 3); }); });
    const sd = { skin: SKIN[2], hair: HAIR[0], top: '#f08a24', bottom: '#2f2f35', pose: 'up', noShadow: 1, hat: 'hard', hatC: '#f4f4f0' };
    b.item(900, [1040, 760, 1140, 902], (g) => { pen(g); shadow(g, 1090, 900, 14, 3); g.fillStyle = '#e77fb0'; g.beginPath(); g.arc(1090, 800, 46, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); line(g, [1044, 800, 1084, 846, 1136, 800, 1096, 846, 1090, 800, 1090, 846], 0.7); wantedPerson(g, 1090, 880, sd, 1); });
    b.scene('The skydiver', 'Still coming down under a pink canopy', [1042, 752, 1138, 884]);
    put(b, 300, [1080, 200, 1120, 306], (g) => { pen(g); line(g, [1100, 300, 1100, 220], 1.6, '#5a4030'); poly(g, '#f08a24', [1100, 220, 1140, 226, 1140, 236, 1100, 240]); }, null);
    stalls(b, [[1200, 860, '#3f7fd1', 'PILOT CAPS'], [500, 880, '#e2564b', 'POPCORN']], 6);
    trees(b, [[60, 900], [1540, 1150], [640, 1150], [1040, 1150], [60, 1150], [1540, 800]]);
  } },

  museum: { name: 'Museum Gardens', people: 1250, build(b) {
    turf(b, '#b1d696', '#a6ce8b', '#bcdda2');
    paths(b, '#ece3cf', 50, [[800, 380, 800, 1210], [-20, 760, 1620, 760], [800, 760, 300, 1100], [800, 760, 1300, 1100]]);
    put(b, 380, [380, 110, 1220, 388], (g) => { pen(g); box(g, '#ece6d8', 420, 200, 760, 170, 2); poly(g, '#e2dccb', [400, 200, 800, 120, 1200, 200]); for (let i = 0; i < 9; i++) box(g, '#f6f2e8', 450 + i * 84, 210, 22, 150, 3); box(g, '#d8d2c2', 400, 364, 800, 10, 2); box(g, '#cfc9b9', 380, 374, 840, 10, 2); g.fillStyle = '#5a4030'; g.fillRect(780, 300, 40, 64); label(g, 'MUSEUM', 800, 180, 22, '#7a7466'); }, [400, 190, 1200, 386]);
    b.spot(640, 196, 381);
    b.rect(140, 500, 420, 640); b.item(640, [140, 470, 430, 646], (g) => { pen(g); box(g, '#cfc9bd', 150, 620, 260, 18, 3); g.save(); g.strokeStyle = '#f4f1ea'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(170, 560); g.quadraticCurveTo(260, 500, 350, 540); g.quadraticCurveTo(390, 560, 400, 520); g.stroke(); g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(220 + i * 20, 532 + (i > 2 ? (i - 2) * 3 : 0)); g.lineTo(216 + i * 20, 580); g.stroke(); } g.beginPath(); g.moveTo(230, 580); g.lineTo(226, 620); g.moveTo(320, 578); g.lineTo(326, 620); g.stroke(); g.restore(); pen(g); oval(g, '#f4f1ea', 404, 512, 16, 10, -0.3); });
    [[1160, 560, 0], [1340, 600, 1], [1240, 660, 2], [1460, 520, 3]].forEach((s) => { b.rect(s[0] - 22, s[1] - 18, s[0] + 22, s[1] + 4); b.item(s[1], [s[0] - 30, s[1] - 86, s[0] + 30, s[1] + 4], (g) => { pen(g); box(g, '#cfc9bd', s[0] - 20, s[1] - 14, 40, 14, 2); if (s[2] === 0) { g.lineWidth = 9; g.strokeStyle = '#e2564b'; g.beginPath(); g.arc(s[0], s[1] - 44, 22, 0, 7); g.stroke(); } else if (s[2] === 1) { box(g, '#3f7fd1', s[0] - 14, s[1] - 40, 28, 26, 2); box(g, '#f2c230', s[0] - 6, s[1] - 62, 24, 22, 2); box(g, '#58b06b', s[0] - 12, s[1] - 80, 18, 18, 2); } else if (s[2] === 2) { poly(g, '#8f6ad0', [s[0] - 18, s[1] - 14, s[0], s[1] - 74, s[0] + 18, s[1] - 14]); } else { circ(g, '#f2c230', s[0], s[1] - 34, 20); circ(g, '#b1d696', s[0] + 6, s[1] - 38, 8); } }); b.spot(s[0] + 14, s[1] - 14, s[1] + 0.5); });
    b.rect(120, 840, 520, 1140);
    b.ground((g) => { pen(g); g.lineWidth = 1; box(g, '#ece3cf', 120, 840, 400, 300, 4); });
    const hedges = [[120, 840, 400, 16], [120, 1124, 400, 16], [120, 840, 16, 300], [504, 840, 16, 120], [504, 1010, 16, 130], [180, 900, 260, 14], [180, 900, 14, 160], [250, 960, 200, 14], [436, 960, 14, 110], [250, 1030, 14, 60], [250, 1076, 140, 14], [330, 1010, 60, 14]];
    for (const h of hedges) b.item(h[1] + h[3], [h[0], h[1] - 8, h[0] + h[2], h[1] + h[3] + 2], (g) => { pen(g); box(g, '#4f9a5a', h[0], h[1] - 8, h[2], h[3] + 8, 4); });
    b.avoid.pop();
    const lead = b.outfit({ item: 'flag', itemC: '#e2564b', dress: false, flip: false, hat: 'cap', hatC: '#e2564b' });
    b.person(416, 952, lead, 2); for (let i = 1; i < 6; i++) b.person(416 - i * 16, 952, b.outfit({ item: null, flip: false, hat: 'cap', hatC: '#e2564b' }), 2);
    b.rect(120, 840, 520, 1140);
    b.scene('The lost tour group', 'Six matching red caps, deep in the hedge maze', [322, 912, 440, 956]);
    b.ell(800, 1000, 78, 46); b.item(1040, [724, 940, 876, 1044], (g) => fountain(g, 800, 1000));
    const fl = []; for (let i = 0; i < 60; i++) fl.push([b.rnd(1000, 1500), b.rnd(880, 1120), b.pick(['#e2564b', '#f2c230', '#e77fb0', '#8f6ad0', '#ffffff'])]);
    b.ground((g) => { pen(g); g.lineWidth = 1; box(g, '#8a6a4a', 990, 870, 520, 260, 10); for (const f of fl) { g.fillStyle = '#58b06b'; g.fillRect(f[0] - 0.6, f[1], 1.2, 7); g.fillStyle = f[2]; g.beginPath(); g.arc(f[0], f[1], 3.4, 0, 7); g.fill(); } }); b.rect(984, 864, 1516, 1136);
    trees(b, [[60, 200, 'blossom'], [240, 300, 'blossom'], [1360, 300, 'blossom'], [1540, 200, 'blossom'], [60, 760], [1540, 760], [640, 600], [960, 600], [640, 1160], [960, 1160]]);
    [[620, 480], [980, 480], [620, 880], [980, 880]].forEach((p) => { b.rect(p[0] - 22, p[1] - 10, p[0] + 22, p[1] + 2); b.item(p[1], [p[0] - 24, p[1] - 16, p[0] + 24, p[1] + 2], (g) => bench(g, p[0], p[1])); b.person(p[0] - 8, p[1] - 2, b.outfit({ pose: 'sit', dress: false, item: null })); });
    b.knot(80, 800, 430, 220, 24, { item: null });
  } },

  waterpark: { name: 'Water Park', people: 1150, build(b) {
    turf(b, '#e6edf1', '#dde6eb', '#eef3f6', 120);
    b.ground((g) => { g.strokeStyle = '#d3dde3'; g.lineWidth = 1; for (let y = 130; y < DH; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(DW, y); g.stroke(); } for (let x = 20; x < DW; x += 40) { g.beginPath(); g.moveTo(x, 110); g.lineTo(x, DH); g.stroke(); } pen(g); g.lineWidth = 1.2; g.fillStyle = '#6fc7e6'; rr(g, 120, 520, 660, 300, 60); g.fillStyle = '#8fd7ee'; rr(g, 980, 180, 480, 240, 110); g.lineWidth = 46; g.strokeStyle = '#6fc7e6'; g.beginPath(); g.ellipse(1180, 900, 300, 150, 0, 0, 7); g.stroke(); g.lineWidth = 1.2; g.strokeStyle = OUT; g.beginPath(); g.ellipse(1180, 900, 323, 173, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(1180, 900, 277, 127, 0, 0, 7); g.stroke(); });
    b.rect(114, 514, 786, 826); b.rect(974, 174, 1466, 426);
    swimmers(b, 40, 160, 560, 740, 800, 0.45); swimmers(b, 22, 1030, 220, 1410, 400, 0.3);
    C12.forEach((c, i) => { const x = 1180 + c[0] * 300, y = 900 + c[1] * 150, col = TOPS[i % TOPS.length], sk = SKIN[i % 6], hr = HAIR[i % 8]; b.rect(x - 22, y - 16, x + 22, y + 12); b.item(y, [x - 14, y - 12, x + 14, y + 10], (g) => swimmer(g, x, y, sk, hr, col)); });
    b.ell(1180, 900, 326, 176);
    put(b, 480, [300, 130, 700, 524], (g) => { pen(g); box(g, '#c9ced6', 470, 160, 60, 320, 3); box(g, '#f2c230', 450, 150, 100, 14, 3); for (let y = 190; y < 470; y += 30) line(g, [474, y, 526, y], 0.7); g.save(); g.lineCap = 'round'; g.lineWidth = 24; g.strokeStyle = '#e2564b'; g.beginPath(); g.moveTo(470, 180); g.bezierCurveTo(330, 200, 420, 340, 320, 380); g.bezierCurveTo(260, 410, 330, 500, 380, 530); g.stroke(); g.strokeStyle = '#3f7fd1'; g.beginPath(); g.moveTo(530, 180); g.bezierCurveTo(690, 220, 560, 330, 660, 400); g.bezierCurveTo(710, 440, 640, 500, 600, 530); g.stroke(); g.lineWidth = 10; g.strokeStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(470, 180); g.bezierCurveTo(330, 200, 420, 340, 320, 380); g.bezierCurveTo(260, 410, 330, 500, 380, 530); g.stroke(); g.beginPath(); g.moveTo(530, 180); g.bezierCurveTo(690, 220, 560, 330, 660, 400); g.bezierCurveTo(710, 440, 640, 500, 600, 530); g.stroke(); g.restore(); }, [290, 150, 710, 514]);
    const cb = { skin: SKIN[1], hair: HAIR[2], top: '#f2c230', bottom: '#f2c230', pose: 'sit', noShadow: 1 };
    b.item(700, [420, 600, 500, 704], (g) => { wantedPerson(g, 460, 650, cb, 1); pen(g); line(g, [440, 690, 432, 676, 460, 692, 460, 674, 480, 690, 488, 676], 1.4, '#ffffff'); });
    b.scene('The cannonball', 'Knees tucked, one second from the splash', [440, 612, 482, 696]);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 11; k++) { const x = 130 + k * 60, y = 920 + r * 110, c = b.pick(TOPS); b.rect(x - 10, y - 14, x + 10, y + 2); b.item(y, [x - 12, y - 16, x + 12, y + 2], (g) => { pen(g); box(g, '#f4f4f0', x - 10, y - 8, 20, 30, 3); box(g, c, x - 10, y - 8, 20, 9, 3); }); if (b.R() < 0.7) b.person(x, y + 16, b.outfit({ pose: 'sit', dress: false, item: null, hat: b.R() < 0.4 ? 'sun' : null, hatC: '#f1e3b0' })); }
    stalls(b, [[900, 560, '#49b8c4', 'TOWELS'], [860, 300, '#e77fb0', 'SLUSHIES']], 6);
    trees(b, [[60, 200, 'palm'], [840, 180, 'palm'], [1540, 480, 'palm'], [60, 860, 'palm'], [820, 1160, 'palm'], [1560, 1150, 'palm'], [1180, 900, 'palm']]);
    [[250, 500], [650, 500]].forEach((p) => { const o = { skin: SKIN[3], hair: HAIR[0], top: '#e2564b', bottom: '#e2564b', pose: 'sit', noShadow: 1, hat: 'cap', hatC: '#ffffff' }; b.rect(p[0] - 14, p[1] - 10, p[0] + 14, p[1] + 4); b.item(p[1], [p[0] - 16, p[1] - 70, p[0] + 16, p[1] + 4], (g) => { pen(g); line(g, [p[0] - 10, p[1], p[0] - 6, p[1] - 36, p[0] + 10, p[1], p[0] + 6, p[1] - 36], 2.4, '#f4f4f0'); box(g, '#f4f4f0', p[0] - 12, p[1] - 40, 24, 6, 1); wantedPerson(g, p[0], p[1] - 40, o, 1); }); });
  } },

  parade: { name: 'Parade Street', people: 1500, build(b) {
    turf(b, '#d9d4c8', '#d0cabd', '#e1dcd1', 120);
    const conf = []; for (let i = 0; i < 420; i++) conf.push([b.R() * DW, 440 + b.R() * 330, b.pick(TOPS)]);
    b.ground((g) => { g.fillStyle = '#8a8f98'; g.fillRect(0, 440, DW, 330); g.fillStyle = '#f4f4f0'; g.fillRect(0, 446, DW, 5); g.fillRect(0, 759, DW, 5); for (const c of conf) { g.fillStyle = c[2]; g.fillRect(c[0], c[1], 3.4, 2.2); } });
    b.rect(-10, 436, 1610, 774);
    [['#e9b7a0', 'TOY SHOP', 210], ['#b9d3c0', 'CAFE', 170], ['#e6d39a', 'TOWN HALL', 260], ['#c3c9e6', 'PHARMACY', 180], ['#e3b6c6', 'BAKERY', 200], ['#cfe0a8', 'BARBER', 160]].forEach((f, i) => { const x = 20 + i * 264, w = 236; put(b, 340, [x - 10, 340 - f[2] - 44, x + w + 10, 346], (g) => building(g, x, 340, w, f[2] - 60, f[0], i % 2 ? 'flat' : 'gable', { sign: f[1] }), [x - 4, 170, x + w + 4, 344]); b.spot(x + 60, 340 - f[2] + 56, 341); });
    const lp = [80, 400, 720, 1040, 1360];
    for (const x of lp) for (const y of [432, 800]) b.item(y, [x - 8, y - 54, x + 8, y + 2], (g) => lamp(g, x, y));
    b.item(433, [80, 376, 1360, 400], (g) => { pen(g); for (let k = 0; k < 4; k++) { const x0 = lp[k], x1 = lp[k + 1]; g.beginPath(); g.moveTo(x0, 384); g.quadraticCurveTo((x0 + x1) / 2, 406, x1, 384); g.stroke(); for (let i = 1; i < 10; i++) { const t = i / 10, x = x0 + (x1 - x0) * t, y = 384 + 44 * t * (1 - t); poly(g, TOPS[(i + k) % TOPS.length], [x - 5, y, x + 5, y, x, y + 10]); } } });
    b.crowd(210, 20, 350, 1580, 430, () => (b.R() < 0.3 ? { pose: 'up', item: null } : { item: b.R() < 0.25 ? 'flag' : (b.R() < 0.3 ? 'balloon' : null), itemC: b.pick(TOPS) }));
    b.crowd(210, 20, 780, 1580, 860, () => (b.R() < 0.3 ? { pose: 'up', item: null } : { item: b.R() < 0.25 ? 'flag' : null, itemC: b.pick(TOPS) }));
    const riders = []; for (let i = 0; i < 8; i++) riders.push(b.outfit({ pose: 'up', item: null, noShadow: 1, s: 0.9 }));
    [[230, 640, 0], [640, 600, 1], [1050, 660, 2], [1420, 610, 3]].forEach((f, k) => b.item(f[1], [f[0] - 90, f[1] - 150, f[0] + 90, f[1] + 8], (g) => { pen(g); shadow(g, f[0], f[1], 86, 7); box(g, TOPS[k * 3 % TOPS.length], f[0] - 84, f[1] - 30, 168, 26, 6); g.fillStyle = '#f4f4f0'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(f[0] - 72 + i * 18, f[1] - 4, 9, 0, Math.PI); g.fill(); g.stroke(); } if (f[2] === 0) { oval(g, '#f2c230', f[0], f[1] - 70, 50, 38); circ(g, '#f2c230', f[0] + 44, f[1] - 112, 24); poly(g, '#e88a3a', [f[0] + 64, f[1] - 116, f[0] + 90, f[1] - 108, f[0] + 64, f[1] - 100]); circ(g, OUT, f[0] + 50, f[1] - 118, 3); } else if (f[2] === 1) { box(g, '#f6c9d6', f[0] - 50, f[1] - 70, 100, 40, 4); box(g, '#fff7dc', f[0] - 36, f[1] - 104, 72, 34, 4); box(g, '#f6c9d6', f[0] - 22, f[1] - 130, 44, 26, 4); for (let i = -1; i <= 1; i++) { box(g, '#e2564b', f[0] + i * 12 - 1.5, f[1] - 144, 3, 14, 1); circ(g, '#f2c230', f[0] + i * 12, f[1] - 147, 3); } } else if (f[2] === 2) { poly(g, '#f4f4f0', [f[0] - 22, f[1] - 30, f[0] - 22, f[1] - 110, f[0], f[1] - 150, f[0] + 22, f[1] - 110, f[0] + 22, f[1] - 30]); poly(g, '#e2564b', [f[0] - 22, f[1] - 30, f[0] - 44, f[1] - 30, f[0] - 22, f[1] - 66]); poly(g, '#e2564b', [f[0] + 22, f[1] - 30, f[0] + 44, f[1] - 30, f[0] + 22, f[1] - 66]); circ(g, '#bfe0ee', f[0], f[1] - 96, 10); } else { line(g, [f[0], f[1] - 30, f[0], f[1] - 90], 5, '#58b06b'); for (const c of C8) circ(g, '#e77fb0', f[0] + c[0] * 26, f[1] - 104 + c[1] * 26, 15); circ(g, '#f2c230', f[0], f[1] - 104, 16); } wantedPerson(g, f[0] - 66, f[1] - 30, riders[k * 2], 1); wantedPerson(g, f[0] + 68, f[1] - 30, riders[k * 2 + 1], 1); }));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) b.person(790 + k * 22, 690 + r * 24, { skin: b.pick(SKIN), hair: b.pick(HAIR), hairStyle: 'short', top: '#c0392b', bottom: '#ffffff', hat: 'tall', hatC: '#2f2f35', item: k % 2 ? 'drum' : 'flag', itemC: '#f2c230', flip: false });
    b.person(1530, 730, { skin: SKIN[3], hair: HAIR[5], top: '#f08a24', bottom: '#3a4a6b', hat: 'cap', hatC: '#f08a24', pose: 'fwd', flip: true }, 2);
    b.item(731, [1480, 700, 1530, 736], (g) => { pen(g); line(g, [1520, 716, 1494, 730], 1.4, '#7a5236'); poly(g, '#e6c65a', [1486, 724, 1500, 728, 1494, 738, 1482, 734]); });
    b.scene('The sweeper', 'Last in the parade, with a broom, cleaning up the confetti', [1478, 690, 1546, 738]);
    stalls(b, [[300, 1040, '#e2564b', 'FLAGS'], [700, 1080, '#f2c230', 'POPCORN'], [1100, 1040, '#3f7fd1', 'WHISTLES']], 6);
    trees(b, [[60, 1000], [1540, 1000], [500, 1160], [900, 1180], [1340, 1160]]);
  } },

  buildsite: { name: 'Building Site', people: 1150, build(b) {
    turf(b, '#dccaa6', '#d3c09a', '#e4d4b3', 200);
    b.item(1001, [40, 984, 1560, 1004], (g) => fence(g, 60, 1000, 1540, '#f08a24')); b.rect(40, 960, 1560, 1004);
    put(b, 620, [520, 150, 1080, 628], (g) => { pen(g); g.save(); g.strokeStyle = '#7d8791'; g.lineWidth = 6; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(560 + k * 96, 620); g.lineTo(560 + k * 96, 200); g.stroke(); } for (let r = 0; r < 5; r++) { g.beginPath(); g.moveTo(556, 200 + r * 96); g.lineTo(1044, 200 + r * 96); g.stroke(); } g.restore(); pen(g); for (let r = 2; r < 4; r++) for (let k = 0; k < 5; k++) if ((r + k) % 2) box(g, '#c9ced6', 566 + k * 96, 206 + r * 96, 84, 84, 2); }, [540, 560, 1060, 624]);
    const crew = []; for (let i = 0; i < 12; i++) crew.push(b.outfit({ dress: false, hat: 'hard', hatC: b.pick(['#f2c230', '#f08a24', '#ffffff']), vest: '#f2c230', item: null, noShadow: 1, pose: b.pick(['stand', 'up', 'fwd']) }));
    crew.forEach((o, i) => { const r = i % 3, x = 600 + ((i * 97) % 400), y = 296 + r * 96; b.item(620.5 + i * 0.01, [x - 12, y - 40, x + 12, y + 2], (g) => wantedPerson(g, x, y, o, 1)); });
    const sit = []; for (let i = 0; i < 4; i++) sit.push(b.outfit({ dress: false, hat: 'hard', hatC: '#f2c230', pose: 'sit', item: null, noShadow: 1 }));
    b.item(621, [690, 150, 790, 204], (g) => { sit.forEach((o, i) => wantedPerson(g, 704 + i * 22, 200, o, 1)); pen(g); box(g, '#b5533c', 780, 190, 10, 8, 1); });
    b.scene('The lunch break', 'Four hard hats in a row on the very top beam', [692, 160, 792, 206]);
    put(b, 700, [1180, 110, 1500, 706], (g) => { pen(g); g.save(); g.strokeStyle = '#f2c230'; g.lineWidth = 8; g.beginPath(); g.moveTo(1300, 700); g.lineTo(1300, 150); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(1200, 160); g.lineTo(1490, 160); g.stroke(); g.lineWidth = 1.4; g.strokeStyle = '#b9952e'; for (let y = 180; y < 700; y += 26) { g.beginPath(); g.moveTo(1296, y); g.lineTo(1304, y + 26); g.stroke(); } g.restore(); pen(g); box(g, '#f2c230', 1280, 170, 40, 30, 3); box(g, '#bfe0ee', 1286, 176, 16, 12, 2); box(g, '#7d8791', 1200, 166, 40, 26, 2); line(g, [1440, 160, 1440, 400], 1); box(g, '#b9bec6', 1414, 400, 52, 14, 2); box(g, '#f2c230', 1270, 680, 60, 20, 3); }, [1264, 660, 1336, 704]);
    b.spot(1440, 400, 701);
    [[260, 520, '#f2c230'], [1180, 880, '#f2c230']].forEach((d) => put(b, d[1], [d[0] - 70, d[1] - 80, d[0] + 90, d[1] + 8], (g) => { pen(g); shadow(g, d[0], d[1], 60, 6); box(g, '#3a3f48', d[0] - 50, d[1] - 14, 100, 14, 7); box(g, d[2], d[0] - 40, d[1] - 44, 70, 30, 4); box(g, '#bfe0ee', d[0] - 4, d[1] - 62, 30, 22, 3); g.save(); g.strokeStyle = d[2]; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(d[0] + 26, d[1] - 40); g.lineTo(d[0] + 60, d[1] - 74); g.lineTo(d[0] + 84, d[1] - 34); g.stroke(); g.restore(); poly(g, '#7d8791', [d[0] + 74, d[1] - 34, d[0] + 94, d[1] - 34, d[0] + 88, d[1] - 16, d[0] + 74, d[1] - 20]); }, [d[0] - 56, d[1] - 40, d[0] + 60, d[1] + 4]));
    put(b, 860, [240, 800, 360, 866], (g) => car(g, 300, 860, '#f08a24', 'truck'), [262, 830, 340, 864]);
    [[160, 760], [460, 700], [1100, 740], [760, 800], [1420, 860]].forEach((p) => { b.rect(p[0] - 44, p[1] - 30, p[0] + 44, p[1] + 4); b.item(p[1], [p[0] - 50, p[1] - 50, p[0] + 50, p[1] + 4], (g) => { pen(g); poly(g, '#e6c98a', [p[0] - 46, p[1], p[0], p[1] - 44, p[0] + 46, p[1]]); }); b.spot(p[0], p[1] - 44, p[1] + 0.5); });
    [[120, 300], [320, 300], [140, 400]].forEach((c) => put(b, c[1], [c[0] - 70, c[1] - 62, c[0] + 70, c[1] + 4], (g) => { pen(g); box(g, '#9fb8c8', c[0] - 64, c[1] - 56, 128, 56, 3); box(g, '#bfe0ee', c[0] - 50, c[1] - 44, 30, 20, 2); box(g, '#5a4030', c[0] + 20, c[1] - 40, 22, 40, 2); }, [c[0] - 66, c[1] - 40, c[0] + 66, c[1] + 2]));
    const cones = []; for (let i = 0; i < 26; i++) cones.push([b.rnd(60, 1540), b.rnd(660, 950)]);
    for (const c of cones) b.item(c[1], [c[0] - 7, c[1] - 16, c[0] + 7, c[1] + 2], (g) => { g.save(); g.translate(c[0], c[1]); wantedThing(g, 'cone'); g.restore(); });
    b.fill = (y) => (y < 960 ? { hat: 'hard', hatC: b.pick(['#f2c230', '#f08a24', '#ffffff']), vest: b.R() < 0.6 ? '#f2c230' : null, dress: false, item: null } : null);
    stalls(b, [[400, 1120, '#f08a24', 'COFFEE'], [1200, 1120, '#3f7fd1', 'SANDWICHES']], 6);
    b.crowd(120, 40, 1010, 1560, 1060, { item: null });
  } },

  filmset: { name: 'Film Set', people: 1200, build(b) {
    turf(b, '#d6d1c7', '#cdc7bc', '#dedad1', 140);
    [[120, '#c9a36a', 'SALOON'], [380, '#b98a5a', 'BANK'], [640, '#d9c39a', 'HOTEL'], [900, '#a9825a', 'SHERIFF']].forEach((f, i) => { const x = f[0], h = 190 + (i % 2) * 30; put(b, 400, [x - 30, 400 - h - 10, x + 250, 440], (g) => { pen(g); line(g, [x + 40, 400 - h + 30, x - 20, 436, x + 180, 400 - h + 30, x + 240, 436], 3, '#7a5236'); box(g, f[1], x, 400 - h, 220, h, 2); box(g, '#5a4030', x + 90, 344, 40, 56, 2); box(g, '#bfe0ee', x + 24, 400 - h + 70, 34, 40, 2); box(g, '#bfe0ee', x + 162, 400 - h + 70, 34, 40, 2); box(g, '#f3ead2', x + 40, 400 - h + 20, 140, 28, 3); label(g, f[2], x + 110, 400 - h + 40, 14); }, [x - 4, 400 - h + 80, x + 224, 404]); b.spot(x + 60, 400 - h, 401); });
    put(b, 420, [1200, 150, 1540, 426], (g) => { pen(g); box(g, '#3fbf5f', 1220, 170, 300, 240, 3); line(g, [1220, 410, 1200, 426, 1520, 410, 1540, 426], 3, '#5b6470'); }, [1216, 380, 1524, 424]);
    b.knot(26, 1370, 470, 100, 16, () => ({ item: null, hat: b.pick(['cowboy', 'top', 'beret']), hatC: b.pick(['#7a5236', '#2f2f35', '#a07a4a']) }));
    const cams = [[520, 620], [1360, 620], [820, 900]];
    for (const c of cams) { const op = b.outfit({ dress: false, hat: 'cap', hatC: '#2f2f35', item: null, flip: true }); b.rect(c[0] - 30, c[1] - 26, c[0] + 34, c[1] + 4); b.item(c[1], [c[0] - 34, c[1] - 70, c[0] + 40, c[1] + 4], (g) => { pen(g); line(g, [c[0] - 14, c[1], c[0], c[1] - 34, c[0] + 14, c[1], c[0], c[1] - 34, c[0], c[1]], 1.6, '#3a3f48'); box(g, '#2f2f35', c[0] - 14, c[1] - 52, 30, 18, 3); box(g, '#5b6470', c[0] - 26, c[1] - 48, 12, 10, 2); circ(g, '#2f2f35', c[0] - 4, c[1] - 58, 6); circ(g, '#2f2f35', c[0] + 10, c[1] - 58, 6); wantedPerson(g, c[0] + 26, c[1], op, 1); }); }
    [[300, 560], [700, 540], [1120, 560], [1500, 600], [240, 900], [1300, 900]].forEach((p) => { b.rect(p[0] - 8, p[1] - 8, p[0] + 8, p[1] + 3); b.item(p[1], [p[0] - 20, p[1] - 80, p[0] + 20, p[1] + 4], (g) => { pen(g); line(g, [p[0] - 10, p[1], p[0], p[1] - 20, p[0] + 10, p[1], p[0], p[1] - 20, p[0], p[1] - 62], 1.4, '#3a3f48'); poly(g, '#ffe07a', [p[0] - 16, p[1] - 62, p[0] + 16, p[1] - 62, p[0] + 10, p[1] - 80, p[0] - 10, p[1] - 80]); }); });
    const dir = { skin: SKIN[2], hair: HAIR[5], top: '#2f2f35', bottom: '#5b6470', hat: 'beret', hatC: '#c0392b', pose: 'sit', item: 'flag', itemC: '#f4f4f0', noShadow: 1 };
    b.rect(640, 660, 720, 720); b.item(716, [640, 640, 720, 720], (g) => { pen(g); line(g, [660, 716, 690, 680, 690, 716, 660, 680], 1.6, '#5a4030'); box(g, '#2f2f35', 656, 676, 38, 5, 1); wantedPerson(g, 675, 680, dir, 1); label(g, 'CUT!', 700, 650, 10); });
    [[200, 1080, '#f1ede2'], [520, 1100, '#bfe0ee'], [1380, 1090, '#f1ede2']].forEach((v) => put(b, v[1], [v[0] - 50, v[1] - 42, v[0] + 50, v[1] + 6], (g) => car(g, v[0], v[1], v[2], 'bus'), [v[0] - 48, v[1] - 30, v[0] + 48, v[1] + 4]));
    const st = { skin: SKIN[1], hair: HAIR[0], top: '#2f2f35', bottom: '#2f2f35', pose: 'up', noShadow: 1 };
    b.rect(1000, 720, 1100, 800); b.item(796, [1000, 660, 1100, 800], (g) => { pen(g); shadow(g, 1050, 796, 40, 5); line(g, [1016, 796, 1022, 780, 1084, 796, 1078, 780], 2, '#5b6470'); oval(g, '#3f7fd1', 1050, 780, 38, 8); g.save(); g.translate(1050, 700); g.rotate(0.6); wantedPerson(g, 0, 16, st, 1); g.restore(); });
    b.scene('The stunt double', 'Upside down in mid-air above a trampoline', [1026, 664, 1076, 730]);
    stalls(b, [[900, 1100, '#e2564b', 'CATERING'], [1100, 1100, '#58b06b', 'MAKEUP']], 6);
    b.fill = () => (b.R() < 0.25 ? { hat: b.pick(['cowboy', 'top', 'beret', 'fedora']), hatC: b.pick(['#7a5236', '#2f2f35', '#a07a4a', '#c0392b']) } : null);
    trees(b, [[60, 700, 'palm'], [1540, 760, 'palm'], [60, 1150, 'palm'], [1540, 1150, 'palm'], [760, 1160, 'palm']]);
  } },
};
export const WANTED_DISTRICTS = Object.keys(DISTRICTS);
export function wantedDistrictName(id) { return DISTRICTS[id] ? DISTRICTS[id].name : id; }

// ---- building a board ---------------------------------------------------------------
function shuffled(n, R) { const a = []; for (let i = 0; i < n; i++) a.push(i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const BISCUIT = { ear: '#8a5a36', collar: '#3f7fd1' };
function pbox(x, y, o, pad) { const s = o.s || 1; pad = pad || 0; return [x - 9 * s - pad, y - (o.lift || 0) - 38 * s - pad, x + 11 * s + pad, y + 3 + pad]; }

// The pools a board draws on, as they stood when it was generated. New scenes,
// things and people are APPENDED to their lists, and a board only ever looks at
// the first `pool` of each, so adding to a list never moves an older board.
export function wantedPools() { return { u: UNIQUES.length, t: THINGS.length, s: SCENES.length }; }

// spec: { seed, cols, districts: [id...], pool: { u, t, s } }
export function wantedBuild(spec) {
  const cols = spec.cols, n = spec.districts.length, rows = Math.ceil(n / cols);
  const board = { W: cols * DW, H: rows * DH, cols, rows, items: [], people: [], targets: [], decoys: [], districts: [] };
  const pool = spec.pool || wantedPools();
  const RB = wantedRng(mix(spec.seed, 9001));
  const uOrder = shuffled(pool.u, RB), tOrder = shuffled(pool.t, RB), sOrder = shuffled(pool.s, RB);
  let ui = 0, ti = 0, si = 0;
  for (let i = 0; i < n; i++) {
    const id = spec.districts[i], D = DISTRICTS[id];
    if (!D) throw new Error('wanted: no district ' + id);
    const ox = (i % cols) * DW, oy = Math.floor(i / cols) * DH;
    const R = wantedRng(mix(spec.seed, i));
    const b = makeBuilder(R, ox, oy, i, board);
    b.rect(764, 40, 836, 110);
    D.build(b);
    const sign = D.name.toUpperCase();
    b.item(106, [640, 24, 960, 110], (g) => signpost(g, 800, 106, sign));
    const tgt = (kind, name, hint, bx, icon) => { board.targets.push({ d: i, kind, name, hint, box: [ox + bx[0], oy + bx[1], ox + bx[2], oy + bx[3]], icon: icon || null }); };
    for (const sc of b.scenes) tgt('scene', sc.name, sc.hint, sc.box);
    const free = (hw, hh) => { for (let t = 0; t < 500; t++) { const x = b.rnd(50 + hw, DW - 50 - hw), y = b.rnd(150 + hh, DH - 26); if (b.areaFree(x - hw, y - hh, x + hw, y + 8)) return [x, y]; } return null; };
    // shared scenes
    for (let k = 0; k < 5; k++) {
      const p = free(100, 64); if (!p) continue;
      const fn = SCENES[sOrder[si++ % sOrder.length]];
      const r = fn(b, p[0], p[1]);
      b.rect(r[2][0] - 6, r[2][1] + 20, r[2][2] + 6, r[2][3] + 10);
      tgt('scene', r[0], r[1], r[2]);
    }
    // Otis, Mabel, Biscuit
    for (const who of ['otis', 'mabel']) {
      const p = free(13, 10); if (!p) continue;
      const o = Object.assign({}, WANTED_CAST[who].o, { flip: R() < 0.5 });
      b.person(p[0], p[1], o, 1); b.rect(p[0] - 13, p[1] - 8, p[0] + 13, p[1] + 10);
      tgt('cast', WANTED_CAST[who].name, WANTED_CAST[who].hint, pbox(p[0], p[1], o, 3), { o });
    }
    { const p = free(16, 8); if (p) { const fl = R() < 0.5; b.item(p[1], [p[0] - 14, p[1] - 18, p[0] + 14, p[1] + 3], (g) => dog(g, p[0], p[1], '#ffffff', Object.assign({ flip: fl }, BISCUIT))); b.rect(p[0] - 16, p[1] - 8, p[0] + 16, p[1] + 10); tgt('cast', WANTED_CAST.biscuit.name, WANTED_CAST.biscuit.hint, [p[0] - 14, p[1] - 18, p[0] + 14, p[1] + 3], { dog: 1 }); } }
    // one of a kind
    for (let k = 0; k < 2; k++) {
      const p = free(13, 10); if (!p) continue;
      const u = UNIQUES[uOrder[ui++ % uOrder.length]];
      const o = Object.assign({}, u.o, { flip: u.o.pose === 'fwd' ? false : R() < 0.5 });
      b.person(p[0], p[1], o, 1); b.rect(p[0] - 13, p[1] - 8, p[0] + 13, p[1] + 10);
      tgt('one', u.name, u.hint, pbox(p[0], p[1], o, 3), { o });
    }
    // lookalikes
    for (let k = 0; k < 10; k++) {
      const p = free(12, 8); if (!p) continue;
      const dc = DECOYS[(i * 5 + k) % DECOYS.length];
      const o = Object.assign({}, WANTED_CAST.otis.o, { top: b.pick(['#7a5cc0', '#5b6470', '#3f7fd1', '#7a5cc0']), flip: R() < 0.5 }, dc[0]);
      b.person(p[0], p[1], o, 3); b.rect(p[0] - 11, p[1] - 6, p[0] + 11, p[1] + 9);
      const bx = pbox(p[0], p[1], o, 2);
      board.decoys.push({ box: [ox + bx[0], oy + bx[1], ox + bx[2], oy + bx[3]], why: dc[1] });
    }
    // lost things
    for (let k = 0; k < 5; k++) {
      const th = THINGS[tOrder[ti++ % tOrder.length]];
      let x, y, z;
      if (b.spots.length && R() < 0.45) { const j = Math.floor(R() * b.spots.length); const sp = b.spots.splice(j, 1)[0]; x = sp[0]; y = sp[1]; z = sp[2]; }
      else { const p = free(12, 10); if (!p) continue; x = p[0]; y = p[1]; z = y; b.rect(x - 14, y - 10, x + 14, y + 12); }
      const tid = th[0];
      b.item(z, [x - 16, y - 28, x + 16, y + 6], (g) => { g.save(); g.translate(x, y); wantedThing(g, tid); g.restore(); });
      tgt('lost', th[1], th[2], [x - 11, y - 22, x + 11, y + 4], { t: tid });
    }
    // the rest of the crowd
    let have = 0; for (const p of board.people) if (p.d === i) have++;
    let tries = 0;
    while (have < D.people && tries++ < 14000) {
      const x = b.rnd(20, DW - 20), y = b.rnd(118, DH - 12);
      if (b.blocked(x, y)) continue;
      b.person(x, y, b.outfit(b.fill ? b.fill(y) : null)); have++;
    }
    board.districts.push({ id, name: D.name, ox, oy, grounds: b.grounds });
  }
  // Nobody ordinary stands right in front of something on the list.
  const cell = 64, hide = new Map();
  for (const t of board.targets) { const bx = t.box; for (let cx = Math.floor((bx[0] - 8) / cell); cx <= Math.floor((bx[2] + 8) / cell); cx++) for (let cy = Math.floor(bx[3] / cell); cy <= Math.floor((bx[3] + 26) / cell); cy++) { const k = cx * 100000 + cy; if (!hide.has(k)) hide.set(k, []); hide.get(k).push(bx); } }
  for (const d of board.decoys) { const bx = d.box; const k = Math.floor(((bx[0] + bx[2]) / 2) / cell) * 100000 + Math.floor((bx[3] + 8) / cell); if (!hide.has(k)) hide.set(k, []); hide.get(k).push(bx); }
  board.people = board.people.filter((p) => {
    if (p.m) return true;
    const L = hide.get(Math.floor(p.x / cell) * 100000 + Math.floor(p.y / cell));
    if (!L) return true;
    for (const bx of L) if (p.x > bx[0] - 8 && p.x < bx[2] + 8 && p.y > bx[3] - 3 && p.y < bx[3] + 22) return false;
    return true;
  });
  for (const p of board.people) { const s = p.o.s || 1, l = p.o.lift || 0; board.items.push({ y: p.y, x0: p.x - 18 * s, y0: p.y - l - 86 * s, x1: p.x + 26 * s, y1: p.y + 5, p }); }
  board.items.sort((a, c) => a.y - c.y);
  // a coarse grid so a tile only looks at what is near it
  const G = 400, gw = Math.ceil(board.W / G), gh = Math.ceil(board.H / G), cells = [];
  for (let k = 0; k < gw * gh; k++) cells.push([]);
  board.items.forEach((it, idx) => { const cx0 = Math.max(0, Math.floor(it.x0 / G)), cx1 = Math.min(gw - 1, Math.floor(it.x1 / G)), cy0 = Math.max(0, Math.floor(it.y0 / G)), cy1 = Math.min(gh - 1, Math.floor(it.y1 / G)); for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) cells[cy * gw + cx].push(idx); });
  board.grid = { G, gw, gh, cells };
  board.stamp = new Int32Array(board.items.length); board.stampN = 0;
  board.targets.forEach((t, k) => { t.id = k; });
  return board;
}

// A number that changes if anything on the board moves (see rule 3 at the top).
export function wantedChecksum(board) {
  let h = 0x811c9dc5;
  const add = (v) => { h ^= (v | 0); h = Math.imul(h, 0x01000193); };
  for (const p of board.people) { add(Math.round(p.x * 8)); add(Math.round(p.y * 8)); add(p.o.top ? p.o.top.charCodeAt(1) * 7 + p.o.top.charCodeAt(3) : 1); add(p.m); }
  for (const t of board.targets) { for (const v of t.box) add(Math.round(v * 8)); add(t.name.length); }
  for (const d of board.decoys) for (const v of d.box) add(Math.round(v * 8));
  add(board.items.length);
  return (h >>> 0).toString(36);
}

// ---- drawing a region -------------------------------------------------------------
// Draws everything that touches the box (scene units) onto `g`, which the
// caller has already scaled and moved so scene units land where they should.
// lod 0 is the far-away version of the figures.
export function wantedDraw(board, g, x0, y0, x1, y1, lod) {
  for (const d of board.districts) {
    if (d.ox >= x1 || d.oy >= y1 || d.ox + DW <= x0 || d.oy + DH <= y0) continue;
    g.save(); g.beginPath(); g.rect(d.ox, d.oy, DW, DH); g.clip(); g.translate(d.ox, d.oy);
    for (const fn of d.grounds) fn(g);
    g.restore();
  }
  g.save(); g.strokeStyle = '#efe3bf'; g.lineWidth = 30; g.lineCap = 'butt';
  for (let c = 1; c < board.cols; c++) { g.beginPath(); g.moveTo(c * DW, Math.max(0, y0 - 20)); g.lineTo(c * DW, Math.min(board.H, y1 + 20)); g.stroke(); }
  for (let r = 1; r < board.rows; r++) { g.beginPath(); g.moveTo(Math.max(0, x0 - 20), r * DH); g.lineTo(Math.min(board.W, x1 + 20), r * DH); g.stroke(); }
  g.restore();
  const { G, gw, gh, cells } = board.grid;
  const stamp = board.stamp, n = ++board.stampN, pick = [];
  const cx0 = Math.max(0, Math.floor(x0 / G)), cx1 = Math.min(gw - 1, Math.floor(x1 / G)), cy0 = Math.max(0, Math.floor(y0 / G)), cy1 = Math.min(gh - 1, Math.floor(y1 / G));
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) for (const idx of cells[cy * gw + cx]) { if (stamp[idx] === n) continue; stamp[idx] = n; const it = board.items[idx]; if (it.x1 < x0 || it.x0 > x1 || it.y1 < y0 || it.y0 > y1) continue; pick.push(idx); }
  pick.sort((a, c) => a - c);
  for (const idx of pick) {
    const it = board.items[idx];
    if (it.p) wantedPerson(g, it.p.x, it.p.y, it.p.o, lod);
    else { g.save(); g.translate(it.ox, it.oy); it.f(g, lod); g.restore(); }
  }
}

// What a tap at (x, y) lands on: { t: target } or { why: 'wrong scarf' } or null.
export function wantedHit(board, x, y, pad) {
  let best = null;
  for (const t of board.targets) { const b = t.box; if (x > b[0] - pad && x < b[2] + pad && y > b[1] - pad && y < b[3] + pad) { if (!best || (b[2] - b[0]) < (best.box[2] - best.box[0])) best = t; } }
  if (best) return { t: best };
  for (const d of board.decoys) { const b = d.box; if (x > b[0] - pad && x < b[2] + pad && y > b[1] - pad && y < b[3] + pad) return { why: d.why }; }
  return null;
}

// A list portrait: (0, 0) is the feet, about 40 units tall.
export function wantedIcon(g, t) {
  const ic = t.icon; if (!ic) return false;
  if (ic.o) wantedPerson(g, 0, 0, Object.assign({}, ic.o, { noShadow: 1, flip: false, lift: 0, stilts: 0 }), 1);
  else if (ic.dog) dog(g, -1, -2, '#ffffff', BISCUIT);
  else if (ic.t) { g.save(); g.translate(0, -6); g.scale(1.6, 1.6); wantedThing(g, ic.t); g.restore(); }
  return true;
}
