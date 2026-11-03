// THE 3D BOARD (owner, 2026-11-02): Sudoclue's floor plan built as a small realistic diorama. "it looks very
// flat ... the rooms should take on more depth", then "still looks very cartoony", then "realistic portraits too".
// Floors are painted materials (concrete, tile, planks, marble, grass...) with darkened wall edges; every object
// the clues name is a real model (cots, desks with drawers, shelves of books, stools, stoves); walls are low
// plaster slabs; one sun casts real shadows; the model sits on a walnut table. The cast are painted miniature
// figures built from each character's cues (hair, glasses, suit and tie): figurines, never a likeness.
// All text (room names, name tags, role tags) is flat HTML laid over the canvas (owner: "that should still be
// flat"), placed by layout() in app/sudoclue/Board3D.jsx from the anchors this module returns.
// three.js (already in the tree for the globe) is imported by Board3D only when the board mounts.
import { OBJ, renderBoard } from './sudoclue-art';

const U = 100;
export function createKit(THREE, RBG) {
  const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const svgImg = (svg) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  // ================= REALISTIC LOOK =================
  // Procedural materials (no image downloads): every floor, wood, fabric and stone surface is painted once into a
  // canvas at load, with a matching bump map, so surfaces read as material rather than flat colour.
  const RNG = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const shade = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
  function noiseTile(size, seed, scale, oct) { // value noise, tiled, 0..1
    const r = RNG(seed), g = []; const G = 64; for (let i = 0; i < G * G; i++) g.push(r());
    const at = (x, y) => g[((y % G + G) % G) * G + ((x % G + G) % G)];
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let v = 0, a = .5, f = scale;
      for (let o = 0; o < oct; o++) { const fx = x / size * f, fy = y / size * f, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const n = at(ix, iy) * (1 - sx) * (1 - sy) + at(ix + 1, iy) * sx * (1 - sy) + at(ix, iy + 1) * (1 - sx) * sy + at(ix + 1, iy + 1) * sx * sy;
        v += n * a; a *= .5; f *= 2; } out[y * size + x] = v; }
    return out; }
  const NZ = {}; const nz = (k, seed, scale, oct) => NZ[k] || (NZ[k] = noiseTile(256, seed, scale, oct));
  function grain(ctx, x, y, s, base, amt, k, seed, scale) { // paint a noise-modulated fill into a cell
    const n = nz(k, seed, scale, 4); const im = ctx.createImageData(s, s); const c = new THREE.Color(base);
    for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const v = (n[((j * 256 / s) | 0) * 256 + ((i * 256 / s) | 0)] - .5) * amt; const p = (j * s + i) * 4;
      im.data[p] = Math.max(0, Math.min(255, (c.r + v) * 255)); im.data[p + 1] = Math.max(0, Math.min(255, (c.g + v) * 255)); im.data[p + 2] = Math.max(0, Math.min(255, (c.b + v) * 255)); im.data[p + 3] = 255; }
    ctx.putImageData(im, x, y); }
  const FLOORPAINT = {
    concrete(ctx, x, y, s, r) { grain(ctx, x, y, s, '#8d9295', .16, 'conc', 7, 6); ctx.fillStyle = 'rgba(40,44,48,.18)'; for (let i = 0; i < 40; i++) ctx.fillRect(x + r() * s, y + r() * s, 1.5, 1.5);
      if (r() < .25) { ctx.strokeStyle = 'rgba(40,44,48,.25)'; ctx.lineWidth = 1; ctx.beginPath(); let px = x + r() * s, py = y; ctx.moveTo(px, py); for (let i = 0; i < 6; i++) { px += (r() - .5) * s * .25; py += s / 6; ctx.lineTo(px, py); } ctx.stroke(); } },
    tile(ctx, x, y, s, r) { const t = s / 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { grain(ctx, x + i * t, y + j * t, t, shade('#b8b2a4', (r() - .5) * .05), .06, 'tile', 3, 10);
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + i * t + 3, y + j * t + 3, t - 6, 2); }
      ctx.strokeStyle = '#8c877c'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3); ctx.beginPath(); ctx.moveTo(x + t, y); ctx.lineTo(x + t, y + s); ctx.moveTo(x, y + t); ctx.lineTo(x + s, y + t); ctx.stroke(); },
    wood(ctx, x, y, s, r, tone) { const n = 4, ph = s / n; for (let k = 0; k < n; k++) { const base = shade(tone || '#665040', (r() - .5) * .06); ctx.fillStyle = base; ctx.fillRect(x, y + k * ph, s, ph);
        for (let g = 0; g < 9; g++) { ctx.strokeStyle = `rgba(40,22,10,${.08 + r() * .12})`; ctx.lineWidth = .6 + r(); ctx.beginPath(); const yy = y + k * ph + r() * ph; ctx.moveTo(x, yy);
          for (let q = 1; q <= 8; q++) ctx.lineTo(x + q * s / 8, yy + Math.sin(q * 1.3 + g) * 1.6); ctx.stroke(); }
        ctx.fillStyle = 'rgba(30,16,8,.45)'; ctx.fillRect(x, y + k * ph, s, 1.5); const j = x + r() * s; ctx.fillRect(j, y + k * ph, 1.5, ph); } },
    deck(ctx, x, y, s, r) { FLOORPAINT.wood(ctx, x, y, s, r, '#8b7a66'); },
    dock(ctx, x, y, s, r) { FLOORPAINT.wood(ctx, x, y, s, r, '#76695a'); },
    parquet(ctx, x, y, s, r) { const q = s / 4; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const tone = shade('#8a5a36', (r() - .5) * .08); ctx.fillStyle = tone; ctx.fillRect(x + i * q, y + j * q, q, q);
        ctx.strokeStyle = 'rgba(40,22,10,.35)'; ctx.lineWidth = 1; for (let k = 1; k < 3; k++) { ctx.beginPath(); if ((i + j) % 2) { ctx.moveTo(x + i * q + k * q / 3, y + j * q); ctx.lineTo(x + i * q + k * q / 3, y + j * q + q); } else { ctx.moveTo(x + i * q, y + j * q + k * q / 3); ctx.lineTo(x + i * q + q, y + j * q + k * q / 3); } ctx.stroke(); }
        ctx.strokeRect(x + i * q, y + j * q, q, q); } },
    marble(ctx, x, y, s, r) { grain(ctx, x, y, s, '#e4e1da', .07, 'marb', 11, 4); ctx.strokeStyle = 'rgba(120,118,112,.35)'; for (let v = 0; v < 3; v++) { ctx.lineWidth = .6 + r() * 1.4; ctx.beginPath(); let px = x, py = y + r() * s; ctx.moveTo(px, py);
        for (let i = 0; i < 8; i++) { px += s / 8; py += (r() - .5) * s * .2; ctx.lineTo(px, py); } ctx.stroke(); } ctx.strokeStyle = 'rgba(110,105,96,.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + .75, y + .75, s - 1.5, s - 1.5); },
    checker(ctx, x, y, s) { const t = s / 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) grain(ctx, x + i * t, y + j * t, t, (i + j) % 2 ? '#2b2b2d' : '#e7e3da', .06, 'tile', 3, 10); },
    carpet(ctx, x, y, s) { grain(ctx, x, y, s, '#596675', .12, 'carp', 5, 40); },
    burgundy(ctx, x, y, s) { grain(ctx, x, y, s, '#6a2a30', .12, 'carp', 5, 40); },
    grass(ctx, x, y, s, r) { grain(ctx, x, y, s, '#5d7a40', .2, 'grass', 9, 12); for (let i = 0; i < 260; i++) { ctx.strokeStyle = `rgba(${40 + r() * 60},${80 + r() * 60},${30 + r() * 30},.6)`; ctx.lineWidth = 1; const gx = x + r() * s, gy = y + r() * s; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (r() - .5) * 3, gy - 3 - r() * 3); ctx.stroke(); } },
    stone(ctx, x, y, s, r) { grain(ctx, x, y, s, '#6f6c66', .1, 'conc', 7, 6); const rows = 3; for (let j = 0; j < rows; j++) { let cx = x; const rh = s / rows; while (cx < x + s) { const w = s * (.25 + r() * .3);
        grain(ctx, cx + 2, y + j * rh + 2, Math.max(4, Math.min(w, x + s - cx) - 4) | 0, shade('#a49e92', (r() - .5) * .08), .1, 'stone', 13, 8); cx += w; } } },
    brick(ctx, x, y, s, r) { ctx.fillStyle = '#8f8678'; ctx.fillRect(x, y, s, s); const rh = s / 4, bw = s / 2; for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) { const bx = x + i * bw + (j % 2 ? bw / 2 : 0); const x0 = Math.max(x, bx + 2), x1 = Math.min(x + s, bx + bw - 2); if (x1 <= x0) continue;
        ctx.fillStyle = shade('#94503c', (r() - .5) * .08); ctx.fillRect(x0, y + j * rh + 2, x1 - x0, rh - 4); } },
    terracotta(ctx, x, y, s, r) { const t = s / 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) grain(ctx, x + i * t + 2, y + j * t + 2, t - 4, shade('#b0643e', (r() - .5) * .06), .1, 'terra', 17, 8); },
    clay(ctx, x, y, s) { grain(ctx, x, y, s, '#a8643f', .14, 'sand', 19, 16); },
    gravel(ctx, x, y, s, r) { grain(ctx, x, y, s, '#9a9284', .12, 'sand', 19, 16); for (let i = 0; i < 160; i++) { ctx.fillStyle = shade('#a39b8c', (r() - .5) * .25); ctx.beginPath(); ctx.ellipse(x + r() * s, y + r() * s, 1.5 + r() * 2.5, 1 + r() * 2, r() * 3, 0, 7); ctx.fill(); } },
    sand(ctx, x, y, s) { grain(ctx, x, y, s, '#d2bd93', .1, 'sand', 19, 16); },
    water(ctx, x, y, s, r) { grain(ctx, x, y, s, '#3f7891', .12, 'water', 23, 5); ctx.strokeStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); const wy = y + r() * s; ctx.moveTo(x, wy); for (let q = 1; q <= 6; q++) ctx.lineTo(x + q * s / 6, wy + Math.sin(q + i) * 2); ctx.stroke(); } },
  };
  function realFloor(P) {
    const N = P.N, S = N <= 8 ? 256 : 204, cv = cvs(N * S), ctx = cv.getContext('2d'), r = RNG(42);
    for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) (FLOORPAINT[P.ftypes[rr][cc]] || FLOORPAINT.concrete)(ctx, cc * S, rr * S, S, r);
    return { cv, ctx, S }; }
  async function finishFloor(F, P) {
    const { cv, ctx, S } = F, N = P.N, R = P.rooms;
    // rugs and other flat pieces keep their drawing, a little muted, so they still read as the clue's object
    const ims = await Promise.all(P.flats.map((f) => svgImg(f.svg)));
    P.flats.forEach((f, i) => { if (!ims[i]) return; ctx.save(); ctx.filter = 'saturate(.7) brightness(.95)'; ctx.drawImage(ims[i], f.c * S, f.r * S, f.w * S, f.h * S); ctx.restore(); });
    // baked ambient occlusion: floors darken where they meet a wall, the way real corners collect shadow
    const out = (a, b) => P.rinfo[R[a][b]].out;
    for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) { if (out(rr, cc)) continue; const x = cc * S, y = rr * S, d = S * .16;
      const edge = (cond, g) => { if (!cond) return; ctx.fillStyle = g; ctx.fillRect(x, y, S, S); };
      const lg = (x0, y0, x1, y1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(10,14,18,.38)'); g.addColorStop(1, 'rgba(10,14,18,0)'); return g; };
      edge(rr === 0 || R[rr - 1][cc] !== R[rr][cc], lg(x, y, x, y + d)); edge(rr === N - 1 || R[rr + 1][cc] !== R[rr][cc], lg(x, y + S, x, y + S - d));
      edge(cc === 0 || R[rr][cc - 1] !== R[rr][cc], lg(x, y, x + d, y)); edge(cc === N - 1 || R[rr][cc + 1] !== R[rr][cc], lg(x + S, y, x + S - d, y)); }
    // the squares stay countable: a fine seam on every cell edge
    ctx.strokeStyle = 'rgba(15,20,25,.22)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 1; i < N; i++) { ctx.moveTo(i * S, 0); ctx.lineTo(i * S, N * S); ctx.moveTo(0, i * S); ctx.lineTo(N * S, i * S); } ctx.stroke();
    const bump = cvs(cv.width); const b = bump.getContext('2d'); b.filter = 'grayscale(1) contrast(1.4)'; b.drawImage(cv, 0, 0);
    return { map: tex(cv), bump: new THREE.CanvasTexture(bump) }; }

  // shared materials
  const M = {};
  function mats() { if (M.ok) return M; M.ok = 1;
    const woodCv = cvs(256); FLOORPAINT.wood(woodCv.getContext('2d'), 0, 0, 256, RNG(5), '#6e4528'); const wt = tex(woodCv); wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
    const darkCv = cvs(256); FLOORPAINT.wood(darkCv.getContext('2d'), 0, 0, 256, RNG(9), '#3f2a1c'); const dt = tex(darkCv);
    const fab = (hex, k) => { const c = cvs(128); grain(c.getContext('2d'), 0, 0, 128, hex, .1, 'carp', 5, 40); const t = tex(c); return new THREE.MeshStandardMaterial({ map: t, roughness: .95 }); };
    const marbCv = cvs(256); FLOORPAINT.marble(marbCv.getContext('2d'), 0, 0, 256, RNG(3));
    const plCv = cvs(256); grain(plCv.getContext('2d'), 0, 0, 256, '#c9c3b6', .08, 'conc', 7, 6);
    Object.assign(M, {
      wood: new THREE.MeshStandardMaterial({ map: wt, roughness: .62 }), dark: new THREE.MeshStandardMaterial({ map: dt, roughness: .55 }),
      steel: new THREE.MeshStandardMaterial({ color: 0x6a7177, metalness: .7, roughness: .45 }), iron: new THREE.MeshStandardMaterial({ color: 0x2c3136, metalness: .6, roughness: .5 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xd5d8db, metalness: .95, roughness: .15 }), brass: new THREE.MeshStandardMaterial({ color: 0xa8864f, metalness: .85, roughness: .32 }),
      red: new THREE.MeshStandardMaterial({ color: 0x8a2a22, metalness: .35, roughness: .45 }), black: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: .5 }),
      sheet: fab('#c9c4b9'), wool: fab('#5c6672'), burg: fab('#6a2a30'), green: fab('#2f5a3c'), cream: fab('#bfb4a0'),
      felt: new THREE.MeshStandardMaterial({ color: 0x1f5a3a, roughness: 1 }), marble: new THREE.MeshStandardMaterial({ map: tex(marbCv), roughness: .25 }),
      plaster: new THREE.MeshStandardMaterial({ map: tex(plCv), roughness: .9 }), ceramic: new THREE.MeshStandardMaterial({ color: 0xeeebe4, roughness: .2 }),
      leaf: new THREE.MeshStandardMaterial({ color: 0x3f6b35, roughness: .9 }), leaf2: new THREE.MeshStandardMaterial({ color: 0x55803f, roughness: .9 }), bark: new THREE.MeshStandardMaterial({ color: 0x5a4130, roughness: 1 }),
      glow: new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd38a, emissiveIntensity: 1.2 }), water: new THREE.MeshStandardMaterial({ color: 0x3d7189, roughness: .08, metalness: .1 }),
      straw: new THREE.MeshStandardMaterial({ color: 0xc8a75a, roughness: 1 }), stoneM: new THREE.MeshStandardMaterial({ color: 0xb1aa9c, roughness: .85 }) });
    return M; }
  const RB = (w, h, d, r) => (RBG ? new RBG(w, h, d, 2, Math.min(r || .015, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d));
  function part(g, geo, m, x, y, z) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
  const legs = (g, w, d, h, m, inset, r) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, new THREE.CylinderGeometry(r || .018, r || .018, h, 8), m, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset)); };
  // each model is built in a box w (x) by d (z), long side found from the drawing's own footprint; front faces the camera
  const MODELS = {
    bed(g, w, d) { const L = Math.max(w, d), S = Math.min(w, d), along = d >= w; const m = mats();
      const k = (a, b) => along ? [b, a] : [a, b];
      legs(g, ...k(L, S).map((v) => v), .14, m.steel, .03, .015);
      part(g, RB(...(along ? [S, .03, L] : [L, .03, S])), m.steel, 0, .14, 0);
      part(g, RB(...(along ? [S - .04, .07, L - .04] : [L - .04, .07, S - .04]), .03), m.sheet, 0, .19, 0);
      const pw = S * .7, pl = L * .18; const [px, pz] = along ? [0, -L / 2 + pl / 2 + .05] : [-L / 2 + pl / 2 + .05, 0];
      part(g, RB(...(along ? [pw, .05, pl] : [pl, .05, pw]), .025), m.sheet, px, .245, pz);
      const bl = L * .55; const [bx, bz] = along ? [0, L / 2 - bl / 2 - .02] : [L / 2 - bl / 2 - .02, 0];
      part(g, RB(...(along ? [S - .02, .03, bl] : [bl, .03, S - .02]), .015), m.wool, bx, .235, bz); return .22; },
    bench(g, w, d) { const m = mats(), L = Math.max(w, d), along = d > w; for (let i = -1; i <= 1; i++) { const off = i * .08; part(g, RB(...(along ? [.06, .025, L] : [L, .025, .06])), m.wood, along ? off : 0, .17, along ? 0 : off); }
      for (const e of [-1, 1]) part(g, new THREE.BoxGeometry(...(along ? [.24, .16, .03] : [.03, .16, .24])), m.iron, along ? 0 : e * (L / 2 - .06), .08, along ? e * (L / 2 - .06) : 0); return .18; },
    stool(g, w, d) { const m = mats(), r = Math.min(w, d) * .42; part(g, new THREE.CylinderGeometry(r, r * .95, .035, 24), m.wood, 0, .2, 0); for (let i = 0; i < 3; i++) { const a = i * 2.094; const l = part(g, new THREE.CylinderGeometry(.012, .012, .2, 6), m.steel, Math.cos(a) * r * .6, .1, Math.sin(a) * r * .6); l.rotation.z = Math.cos(a) * .12; l.rotation.x = -Math.sin(a) * .12; } return .22; },
    chair(g, w, d) { const m = mats(), s = Math.min(w, d) * .9; legs(g, s, s, .2, m.dark, .03, .014); part(g, RB(s, .03, s), m.wood, 0, .2, 0); part(g, RB(s, .26, .03), m.wood, 0, .34, -s / 2 + .015); return .21; },
    armchair(g, w, d) { const m = mats(), s = Math.min(w, d) * .92; part(g, RB(s, .16, s, .04), m.burg, 0, .1, 0); part(g, RB(s, .2, .1, .04), m.burg, 0, .26, -s / 2 + .05); for (const e of [-1, 1]) part(g, RB(.09, .12, s, .03), m.burg, e * (s / 2 - .045), .22, 0); return .2; },
    sofa(g, w, d) { const m = mats(), along = d > w, L = Math.max(w, d), S = Math.min(w, d); const A = (a, b) => along ? [b, a] : [a, b];
      part(g, RB(...(along ? [S, .16, L] : [L, .16, S]), .04), m.wool, 0, .1, 0); const [bx, bz] = along ? [-S / 2 + .05, 0] : [0, -S / 2 + .05]; part(g, RB(...(along ? [.1, .2, L] : [L, .2, .1]), .04), m.wool, bx, .26, bz); return .2; },
    diningtable(g, w, d) { const m = mats(); legs(g, w, d, .34, m.steel, .07, .02); part(g, RB(w, .04, d, .01), m.wood, 0, .36, 0); return .38; },
    patiotable(g, w, d) { const m = mats(), r = Math.min(w, d) * .4; part(g, new THREE.CylinderGeometry(r, r, .03, 28), m.iron, 0, .33, 0); part(g, new THREE.CylinderGeometry(.02, .05, .33, 8), m.iron, 0, .165, 0); return .35; },
    coffeetable(g, w, d) { const m = mats(); legs(g, w, d, .18, m.dark, .05, .018); part(g, RB(w, .03, d), m.dark, 0, .2, 0); return .22; },
    desk(g, w, d) { const m = mats(); part(g, RB(w, .04, d, .01), m.wood, 0, .36, 0); const pw = w * .38; part(g, RB(pw, .34, d * .92), m.dark, w / 2 - pw / 2 - .01, .17, 0);
      for (let i = 0; i < 3; i++) part(g, new THREE.BoxGeometry(pw * .7, .006, .01), m.brass, w / 2 - pw / 2, .07 + i * .1, d * .46 + .002);
      legs(g, w, d, .34, m.dark, .03, .016); part(g, new THREE.BoxGeometry(w * .22, .004, d * .3), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: .9 }), -w * .12, .382, .02);
      part(g, new THREE.CylinderGeometry(.03, .04, .02, 12), m.brass, w * .22, .39, -d * .25); part(g, new THREE.SphereGeometry(.035, 12, 8), m.glow, w * .22, .44, -d * .25); return .38; },
    bookshelf(g, w, d, it) { const m = mats(), H = .62; const faceX = d > w; const L = Math.max(w, d), D = Math.min(w, d) * .8;
      const box = (a, b, c, x, y, z) => part(g, new THREE.BoxGeometry(...(faceX ? [c, b, a] : [a, b, c])), m.dark, ...(faceX ? [z, y, x] : [x, y, z]));
      box(L, H, .02, 0, H / 2, -D / 2); box(.03, H, D, -L / 2, H / 2, 0); box(.03, H, D, L / 2, H / 2, 0);
      const BK = [0x7b2d26, 0x2f4858, 0x6b705c, 0xa5a58d, 0x8a6a3c, 0x3d405b, 0x5e3b2e, 0x998e74]; const r = RNG(it.r * 31 + it.c * 7 + 1); const sgn = faceX ? (it.c < it.N / 2 ? 1 : -1) : 1;
      for (let s = 0; s < 3; s++) { const y0 = .03 + s * .2; box(L, .02, D, 0, y0, 0); let x = -L / 2 + .03; while (x < L / 2 - .05) { const bw = .025 + r() * .03, bh = .13 + r() * .06; if (x + bw > L / 2 - .03) break;
          const bm = new THREE.MeshStandardMaterial({ color: BK[(r() * BK.length) | 0], roughness: .7 }); const o = part(g, new THREE.BoxGeometry(...(faceX ? [D * .85, bh, bw] : [bw, bh, D * .85])), bm, ...(faceX ? [0, y0 + .01 + bh / 2, x + bw / 2] : [x + bw / 2, y0 + .01 + bh / 2, 0])); x += bw + .003; } }
      if (faceX) g.rotation.y = sgn > 0 ? 0 : Math.PI; return H; },
    toolchest(g, w, d) { const m = mats(), s = Math.min(w, d) * .85; part(g, RB(s, .45, s * .7, .012), m.red, 0, .225, 0); for (let i = 0; i < 5; i++) { part(g, new THREE.BoxGeometry(s * .94, .004, .006), m.black, 0, .06 + i * .08, s * .35 + .001); part(g, new THREE.BoxGeometry(s * .3, .012, .012), m.chrome, 0, .09 + i * .08, s * .35 + .008); } return .45; },
    stove(g, w, d) { const m = mats(), s = Math.min(w, d) * .9; part(g, RB(s, .4, s, .01), m.steel, 0, .2, 0); part(g, new THREE.BoxGeometry(s * .96, .006, s * .96), m.black, 0, .403, 0);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const t = part(g, new THREE.TorusGeometry(s * .13, .008, 6, 24), m.iron, a * s * .22, .41, b * s * .22); t.rotation.x = Math.PI / 2; }
      for (let i = 0; i < 4; i++) part(g, new THREE.CylinderGeometry(.015, .015, .02, 10), m.black, -s * .3 + i * s * .2, .34, s / 2 + .01).rotation.x = Math.PI / 2; return .41; },
    island(g, w, d) { const m = mats(); part(g, RB(w * .86, .38, d * .7, .01), m.cream, 0, .19, 0); part(g, RB(w * .94, .03, d * .8, .006), m.marble, 0, .395, 0); return .41; },
    clock(g, w, d) { const m = mats(); part(g, new THREE.CylinderGeometry(.03, .05, .44, 10), m.iron, 0, .22, 0);
      const c = cvs(256), x = c.getContext('2d'); x.fillStyle = '#f3efe4'; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.strokeStyle = '#1d1d1d'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.lineWidth = i % 3 ? 3 : 7; x.beginPath(); x.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); x.lineTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); x.stroke(); }
      x.lineWidth = 8; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + 50, 128 - 30); x.stroke(); x.lineWidth = 5; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 - 20, 128 - 90); x.stroke();
      const r = Math.min(w, d) * .36; part(g, new THREE.CylinderGeometry(r * 1.08, r * 1.08, .05, 32), m.brass, 0, .47, 0); part(g, new THREE.CylinderGeometry(r, r, .052, 32), [m.brass, new THREE.MeshStandardMaterial({ map: tex(c), roughness: .3 }), m.brass], 0, .472, 0); return .5; },
    lamp(g) { const m = mats(); part(g, new THREE.CylinderGeometry(.08, .09, .015, 20), m.brass, 0, .008, 0); part(g, new THREE.CylinderGeometry(.008, .008, .5, 8), m.brass, 0, .25, 0);
      part(g, new THREE.CylinderGeometry(.06, .11, .1, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xefe5cf, emissive: 0xffd9a0, emissiveIntensity: .45, side: THREE.DoubleSide, roughness: .9 }), 0, .52, 0);
      const pl = new THREE.PointLight(0xffc988, .5, 1.8, 2); pl.position.y = .48; g.add(pl); return .55; },
    lamppost(g) { const m = mats(); part(g, new THREE.CylinderGeometry(.025, .045, .85, 10), m.iron, 0, .425, 0); part(g, new THREE.BoxGeometry(.09, .12, .09), m.glow, 0, .9, 0); part(g, new THREE.ConeGeometry(.08, .06, 4), m.iron, 0, .99, 0).rotation.y = .785;
      const pl = new THREE.PointLight(0xffd29a, .6, 2.6, 2); pl.position.y = .9; g.add(pl); return .99; },
    billiards(g, w, d) { const m = mats(); legs(g, w, d, .3, m.dark, .08, .035); part(g, RB(w, .06, d, .02), m.dark, 0, .32, 0); part(g, new THREE.BoxGeometry(w - .1, .01, d - .1), m.felt, 0, .355, 0);
      [[.1, .1, 0xf2efe6], [-.15, .05, 0xb22a2a], [.0, -.1, 0xe0b52a], [.2, -.05, 0x1d1d1d]].forEach(([a, b, c]) => part(g, new THREE.SphereGeometry(.022, 12, 8), new THREE.MeshStandardMaterial({ color: c, roughness: .15 }), a * w, .38, b * d)); return .36; },
    barrel(g, w, d) { const m = mats(), r = Math.min(w, d) * .36; const bar = new THREE.LatheGeometry([[r * .85, 0], [r, .12], [r * .85, .26]].map(([a, b]) => new THREE.Vector2(a, b)), 24); part(g, bar, m.wood, 0, 0, 0);
      for (const y of [.04, .22]) part(g, new THREE.TorusGeometry(r * .9, .008, 6, 24), m.iron, 0, y, 0).rotation.x = Math.PI / 2; part(g, new THREE.CircleGeometry(r * .85, 24), m.dark, 0, .262, 0).rotation.x = -Math.PI / 2; return .26; },
    urn(g, w, d) { const m = mats(), r = Math.min(w, d) * .3; part(g, new THREE.LatheGeometry([[r * .6, 0], [r * .7, .05], [r * .35, .12], [r * .9, .25], [r * .95, .34], [r * .7, .38]].map(([a, b]) => new THREE.Vector2(a, b)), 24), m.stoneM, 0, 0, 0); return .38; },
    planter(g, w, d) { const m = mats(), s = Math.min(w, d) * .7; part(g, RB(s, .22, s, .01), m.stoneM, 0, .11, 0); for (let i = 0; i < 5; i++) part(g, new THREE.IcosahedronGeometry(s * .26, 1), i % 2 ? m.leaf : m.leaf2, (i % 3 - 1) * s * .2, .28 + (i % 2) * .05, ((i * 7) % 3 - 1) * s * .18); return .3; },
    fountain(g, w, d) { const m = mats(), r = Math.min(w, d) * .46; part(g, new THREE.LatheGeometry([[r, 0], [r, .08], [r * .9, .1], [r * .9, .03]].map(([a, b]) => new THREE.Vector2(a, b)), 32), m.stoneM, 0, 0, 0);
      part(g, new THREE.CircleGeometry(r * .9, 32), m.water, 0, .07, 0).rotation.x = -Math.PI / 2; part(g, new THREE.CylinderGeometry(.05, .07, .22, 12), m.stoneM, 0, .11, 0); part(g, new THREE.CylinderGeometry(r * .35, r * .2, .04, 20), m.stoneM, 0, .23, 0); return .16; },
    tree(g, w, d, it) { const m = mats(), r = Math.min(w, d) * .5, rr = RNG(it.r * 13 + it.c); part(g, new THREE.CylinderGeometry(.035, .06, .55, 8), m.bark, 0, .27, 0);
      for (let i = 0; i < 9; i++) { const a = rr() * 6.28, k = rr() * r * .55; part(g, new THREE.IcosahedronGeometry(r * (.38 + rr() * .2), 1), rr() > .5 ? m.leaf : m.leaf2, Math.cos(a) * k, .72 + rr() * .22, Math.sin(a) * k); } return 1.0; },
    palm(g, w, d, it) { const m = mats(); const rr = RNG(it.r * 5 + it.c); for (let i = 0; i < 6; i++) part(g, new THREE.CylinderGeometry(.03, .036, .12, 8), m.bark, Math.sin(i * .4) * .02, .06 + i * .12, 0);
      for (let i = 0; i < 8; i++) { const f = part(g, new THREE.ConeGeometry(.05, .42, 4), m.leaf2, 0, .78, 0); f.rotation.z = 1.9; f.rotation.y = i * .785; f.geometry.translate(0, .21, 0); f.scale.set(1, 1, .25); } return .8; },
    hedge(g, w, d) { const m = mats(); part(g, RB(w * .95, .32, d * .9, .06), m.leaf, 0, .16, 0); return .32; },
    dresser(g, w, d) { const m = mats(); part(g, RB(w * .9, .42, d * .6, .01), m.dark, 0, .21, 0); for (let i = 0; i < 3; i++) part(g, new THREE.BoxGeometry(.06, .012, .012), m.brass, 0, .1 + i * .12, d * .3 + .008); return .42; },
    globe(g, w, d) { const m = mats(); part(g, new THREE.CylinderGeometry(.02, .07, .25, 10), m.dark, 0, .125, 0); part(g, new THREE.SphereGeometry(.14, 24, 16), new THREE.MeshStandardMaterial({ color: 0x6f8f8a, roughness: .5 }), 0, .38, 0); part(g, new THREE.TorusGeometry(.16, .006, 6, 32), m.brass, 0, .38, 0).rotation.y = 1.2; return .52; },
    fireplace(g, w, d) { const m = mats(); part(g, RB(w * .95, .52, d * .55, .01), m.stoneM, 0, .26, 0); part(g, new THREE.BoxGeometry(w * .5, .28, .02), m.black, 0, .16, d * .28); part(g, new THREE.BoxGeometry(w * .36, .1, .02), m.glow, 0, .08, d * .28 + .006);
      const pl = new THREE.PointLight(0xff9a50, .7, 2, 2); pl.position.set(0, .15, d * .4); g.add(pl); return .52; },
    haybale(g, w, d) { const m = mats(); part(g, RB(w * .8, .28, d * .55, .05), m.straw, 0, .14, 0); return .28; },
    staircase(g, w, d) { const m = mats(), n = 6; for (let i = 0; i < n; i++) part(g, new THREE.BoxGeometry(w * .9, (i + 1) * .07, d / n), m.marble, 0, (i + 1) * .035, d / 2 - (i + .5) * d / n); return .42; },
    bicycle(g0, w, d) { // always side-on to the camera and leaning toward it on a kickstand, so the wheels read as wheels from above
      const m = mats(), along = false, L = .92, R = .2, hub = L / 2 - R; const g = new THREE.Group(); g.rotation.x = .6; g0.add(g); g0.position.z -= .08;
      const P = (a, y) => (along ? new THREE.Vector3(0, y, a) : new THREE.Vector3(a, y, 0));
      const frameM = new THREE.MeshStandardMaterial({ color: 0x0e7490, metalness: .55, roughness: .35 });
      const tube = (a, b, r, mm) => { const v = new THREE.Vector3().subVectors(b, a), len = v.length(); const o = part(g, new THREE.CylinderGeometry(r, r, len, 8), mm, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); return o; };
      for (const e of [-1, 1]) { const c = P(e * hub, R);
        const tyre = part(g, new THREE.TorusGeometry(R, .016, 8, 36), m.black, c.x, c.y, c.z); if (along) tyre.rotation.y = Math.PI / 2;
        const rim = part(g, new THREE.TorusGeometry(R - .02, .006, 6, 36), m.chrome, c.x, c.y, c.z); if (along) rim.rotation.y = Math.PI / 2;
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; tube(c, P(e * hub + Math.cos(a) * (R - .02), R + Math.sin(a) * (R - .02)), .0025, m.chrome); }
        part(g, new THREE.SphereGeometry(.014, 8, 6), m.steel, c.x, c.y, c.z); }
      const rear = P(-hub, R), front = P(hub, R), bb = P(-hub * .15, R * .9), seat = P(-hub * .45, R * 2.15), head = P(hub * .7, R * 2.1), fork = P(hub * .78, R * 1.85);
      tube(rear, bb, .011, frameM); tube(rear, seat, .01, frameM); tube(bb, seat, .013, frameM); tube(seat, head, .013, frameM); tube(bb, fork, .014, frameM);
      tube(front, fork, .011, frameM); tube(fork, head, .012, frameM);
      const bar = P(hub * .62, R * 2.35); tube(head, bar, .01, m.steel);
      const half = .13; const b1 = bar.clone(), b2 = bar.clone(); if (along) { b1.x -= half; b2.x += half; } else { b1.z -= half; b2.z += half; } tube(b1, b2, .01, m.black);
      const s2 = P(-hub * .52, R * 2.3); tube(seat, s2, .008, m.steel); const sad = part(g, RB(along ? .06 : .12, .025, along ? .12 : .06, .012), m.black, s2.x, s2.y + .012, s2.z);
      const cr = part(g, new THREE.TorusGeometry(.045, .008, 6, 20), m.steel, bb.x, bb.y, bb.z); if (along) cr.rotation.y = Math.PI / 2;
      part(g, new THREE.CylinderGeometry(.006, .006, R * 1.05, 6), m.steel, -hub * .2, R * .45, -.06).rotation.x = -.6;
      return .3; },
    telescope(g0) { // coin-operated viewer: post, yoke, binocular head tipped toward the water, coin box
      const g = new THREE.Group(); g.scale.setScalar(1.4); g0.add(g); const m = mats(), teal = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: .5, roughness: .4 });
      part(g, new THREE.CylinderGeometry(.09, .11, .03, 20), m.iron, 0, .015, 0); part(g, new THREE.CylinderGeometry(.025, .035, .36, 10), m.iron, 0, .2, 0);
      part(g, new THREE.BoxGeometry(.14, .03, .05), m.iron, 0, .39, 0);
      const head = new THREE.Group(); head.position.set(0, .45, 0); head.rotation.x = -.45; g.add(head);
      part(head, RB(.2, .11, .16, .04), teal, 0, 0, 0);
      for (const e of [-1, 1]) { part(head, new THREE.CylinderGeometry(.03, .034, .1, 14), teal, e * .05, 0, -.11).rotation.x = Math.PI / 2; part(head, new THREE.CylinderGeometry(.022, .022, .05, 12), m.black, e * .045, .0, .1).rotation.x = Math.PI / 2; }
      part(g, RB(.07, .08, .05, .01), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: .7, roughness: .3 }), 0, .3, .05); return .75; },
    shopshelf(g, w, d, it) { // a stepped wooden market display, goods on every tier so it reads from above
      const m = mats(), along = d > w, L = Math.max(w, d) * .9, S = Math.min(w, d) * .82; const r = RNG(it.r * 17 + it.c * 3 + 5);
      const GC = [0xf9a8b8, 0x9ed8f0, 0xcfe89a, 0xf7d27a, 0xcdb4f0, 0x9fe3c4, 0xf8b98a];
      const at = (a, y, b) => (along ? [b, y, a] : [a, y, b]); const sz = (a, y, b) => (along ? [b, y, a] : [a, y, b]);
      for (let t = 0; t < 3; t++) { const depth = S / 3, zc = -S / 2 + depth * (t + .5), y = .38 - t * .12;
        part(g, new THREE.BoxGeometry(...sz(L, y, depth)), m.wood, ...at(0, y / 2, zc));
        let x = -L / 2 + .04; while (x < L / 2 - .06) { const gw = .045 + r() * .04, gh = .04 + r() * .05; if (x + gw > L / 2 - .03) break;
          const mat = new THREE.MeshStandardMaterial({ color: GC[(r() * GC.length) | 0], roughness: .6 });
          const o = r() > .5 ? part(g, new THREE.CylinderGeometry(gw / 2, gw / 2, gh, 12), mat, ...at(x + gw / 2, y + gh / 2, zc)) : part(g, RB(...sz(gw, gh, depth * .6), .008), mat, ...at(x + gw / 2, y + gh / 2, zc));
          x += gw + .015; } }
      return .45; },
    fishstall(g, w, d, it) { // steel counter, a bed of crushed ice, the day's catch laid out on it
      const m = mats(), along = d > w, L = Math.max(w, d) * .94, S = Math.min(w, d) * .8; const sz = (a, y, b) => (along ? [b, y, a] : [a, y, b]); const at = (a, y, b) => (along ? [b, y, a] : [a, y, b]);
      part(g, RB(...sz(L, .34, S), .015), m.steel, 0, .17, 0);
      part(g, new THREE.BoxGeometry(...sz(L * .97, .02, S * .97)), m.iron, 0, .345, 0);
      const ice = new THREE.MeshStandardMaterial({ color: 0xe8f4fb, roughness: .25, metalness: .05 }); part(g, RB(...sz(L * .92, .04, S * .86), .02), ice, 0, .37, 0);
      const r = RNG(it.r * 11 + it.c * 29 + 3); const FC = [0xe58a63, 0xb9c3cb, 0xd9a24f, 0x9aa6b0, 0xe07a5a];
      const n = Math.max(4, Math.round(L / .14)); for (let i = 0; i < n; i++) { const a = -L * .42 + (i + .5) * (L * .84 / n);
        for (const row of [-1, 1]) { const f = part(g, new THREE.SphereGeometry(.05, 14, 10), new THREE.MeshStandardMaterial({ color: FC[(r() * FC.length) | 0], metalness: .35, roughness: .35 }), ...at(a, .4, row * S * .2));
          f.scale.set(...(along ? [.55, .45, 1.7] : [1.7, .45, .55])); f.rotation.y = (r() - .5) * .5;
          const tail = part(g, new THREE.ConeGeometry(.03, .05, 4), f.material, ...at(a + .085, .4, row * S * .2)); tail.rotation.z = along ? 0 : Math.PI / 2; if (along) tail.rotation.x = -Math.PI / 2; tail.scale.set(1, 1, .3); } }
      for (const e of [-1, 1]) part(g, new THREE.TorusGeometry(.025, .006, 6, 16), m.chrome, ...at(e * L * .3, .12, S / 2 + .006));
      return .42; },
    flowerstall(g, w, d, it) { // a wooden stand of zinc buckets, each crowded with blooms
      const m = mats(), along = d > w, L = Math.max(w, d) * .9, S = Math.min(w, d) * .82; const sz = (a, y, b) => (along ? [b, y, a] : [a, y, b]); const at = (a, y, b) => (along ? [b, y, a] : [a, y, b]);
      part(g, RB(...sz(L, .26, S), .012), m.wood, 0, .13, 0); for (let k = 0; k < 4; k++) part(g, new THREE.BoxGeometry(...sz(L * .98, .008, .012)), m.dark, ...at(0, .05 + k * .06, S / 2 + .003));
      const r = RNG(it.r * 23 + it.c * 13 + 7); const BC = [0xf472b6, 0xfacc15, 0xfb7185, 0xc084fc, 0xf97316, 0xfde2e4, 0xffffff];
      const n = Math.max(2, Math.round(L / .2)); for (let i = 0; i < n; i++) for (const row of [-1, 1]) { const a = -L / 2 + (i + .5) * L / n, b = row * S * .22;
        part(g, new THREE.CylinderGeometry(.065, .05, .12, 14), m.steel, ...at(a, .32, b)); const col = BC[(r() * BC.length) | 0];
        const bm = new THREE.MeshStandardMaterial({ color: col, roughness: .75 });
        for (let k = 0; k < 7; k++) { const t = r() * 6.28, q = r() * .05; part(g, new THREE.IcosahedronGeometry(.024 + r() * .01, 0), k < 2 ? m.leaf2 : bm, ...at(a + Math.cos(t) * q, .4 + r() * .05, b + Math.sin(t) * q)); } }
      return .45; },
    gumwall(g, w, d, it) { // a thick brick wall section plastered in chewed gum, on its face and its top
      const m = mats(), along = d > w, L = Math.max(w, d) * .94, T = Math.min(w, d) * .5, H = .7; const sz = (a, y, b) => (along ? [b, y, a] : [a, y, b]); const at = (a, y, b) => (along ? [b, y, a] : [a, y, b]);
      const brick = new THREE.MeshStandardMaterial({ color: 0x6f2a14, roughness: .95 }); part(g, RB(...sz(L, H, T), .02), brick, 0, H / 2, 0);
      const r = RNG(it.r * 41 + it.c * 19 + 11); const GC = [0xf472b6, 0x60a5fa, 0xfacc15, 0x4ade80, 0xfb7185, 0xc084fc, 0xf9a8d4];
      const mats2 = GC.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: .55 })); const n = Math.round(L * 320);
      for (let i = 0; i < n; i++) { const a = (r() - .5) * L * .94, rad = .014 + r() * .02, mm = mats2[(r() * mats2.length) | 0]; const face = r();
        let pos; if (face < .4) pos = at(a, .03 + r() * (H - .06), T / 2); else if (face < .75) pos = at(a, H, (r() - .5) * T * .9); else if (face < .88) pos = at(a, .03 + r() * (H - .06), -T / 2); else pos = at(r() < .5 ? -L / 2 : L / 2, .03 + r() * (H - .06), (r() - .5) * T * .9);
        const b = part(g, new THREE.SphereGeometry(rad, 8, 6), mm, ...pos); b.scale.set(1, .7 + r() * .5, 1); b.castShadow = false; }
      return H; },
    pigstatue(g) { // the bronze piggy bank, side-on to the camera, snout to the right
      const m = mats(), br = new THREE.MeshStandardMaterial({ color: 0x9a6a2e, metalness: .85, roughness: .3 }), dk = new THREE.MeshStandardMaterial({ color: 0x5b3a12, metalness: .7, roughness: .45 });
      part(g, RB(.5, .05, .3, .02), m.stoneM, 0, .025, 0);
      const body = part(g, new THREE.SphereGeometry(.15, 24, 16), br, -.01, .23, 0); body.scale.set(1.35, 1, 1);
      for (const [x, z] of [[-.1, -.07], [-.1, .07], [.09, -.07], [.09, .07]]) part(g, new THREE.CylinderGeometry(.03, .028, .12, 10), br, x, .1, z);
      part(g, new THREE.SphereGeometry(.09, 18, 12), br, .19, .27, 0);
      const sn = part(g, new THREE.CylinderGeometry(.04, .045, .05, 14), br, .27, .25, 0); sn.rotation.z = Math.PI / 2;
      for (const e of [-1, 1]) { part(g, new THREE.SphereGeometry(.008, 6, 6), dk, .296, .255, e * .014); const ear = part(g, new THREE.ConeGeometry(.032, .06, 4), br, .18, .36, e * .05); ear.rotation.x = e * .35; part(g, new THREE.SphereGeometry(.01, 8, 6), dk, .24, .3, e * .045); }
      part(g, new THREE.BoxGeometry(.06, .006, .014), dk, -.02, .379, 0);
      const tail = part(g, new THREE.TorusGeometry(.025, .007, 6, 14, 4.5), br, -.22, .27, 0); tail.rotation.y = Math.PI / 2;
      return .38; },
    lilypool(g, w, d) { const m = mats(); part(g, RB(w * .95, .05, d * .9, .02), m.stoneM, 0, .025, 0); part(g, new THREE.BoxGeometry(w * .85, .006, d * .78), m.water, 0, .05, 0); return .05; },
  };
  MODELS.pool = MODELS.lilypool;
  // ---- painted miniature figures: a sculpted bust on a lacquered base, built from each character's cues
  // (skin tone, hair colour and style, glasses, tie, hat). Deliberately a figurine, never a face likeness.
  function figure(look, color) {
    const L = look || {}, g = new THREE.Group();
    const sm = (hex, r, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex || '#888'), roughness: r == null ? .6 : r }, extra || {}));
    const add = (geo, m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (sx) o.scale.set(sx, sy, sz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const lac = new THREE.Color(color); const hs = {}; lac.getHSL(hs); lac.setHSL(hs.h, Math.min(.75, hs.s * 1.1 + .15), Math.min(hs.l, .38));
    const baseM = THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({ color: lac, roughness: .35, clearcoat: .6, clearcoatRoughness: .2 }) : sm(lac, .35);
    add(new THREE.LatheGeometry([[0, 0], [.16, 0], [.165, .012], [.15, .03], [.12, .04], [0, .04]].map(([a, b]) => new THREE.Vector2(a, b)), 32), baseM, 0, 0, 0);
    const skin = sm(L.skin || '#e8c0a0', .55), cloth = sm(L.acc === 'suit' ? L.clothes : (L.clothes || '#334155'), .8), hair = sm(L.hair || '#2a2a2a', .75);
    // torso and shoulders
    add(new THREE.LatheGeometry([[0, 0], [.1, 0], [.115, .05], [.11, .12], [.07, .155], [.035, .165], [0, .165]].map(([a, b]) => new THREE.Vector2(a, b)), 32), cloth, 0, .04, 0, 1, 1, .72);
    if (L.acc === 'suit' || L.acc === 'pantsuit') { add(new THREE.ConeGeometry(.032, .06, 3), sm('#f4f2ec', .7), 0, .175, .072, 1, 1, .4).rotation.x = Math.PI;
      if (L.tie) add(new THREE.BoxGeometry(.016, .09, .006), sm(L.tie, .5), 0, .13, .079); }
    if (L.acc === 'tunic') add(new THREE.BoxGeometry(.06, .02, .02), cloth, 0, .2, .02);
    if (L.acc === 'spacesuit') add(new THREE.TorusGeometry(.06, .016, 8, 24), sm('#c9ccd1', .4, { metalness: .5 }), 0, .2, 0).rotation.x = Math.PI / 2;
    if (L.acc === 'shawl') add(new THREE.TorusGeometry(.085, .025, 8, 24, Math.PI * 1.3), sm('#efe8d8', .9), 0, .18, 0).rotation.x = Math.PI / 2;
    if (L.acc === 'pearls') for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + i * .0875); add(new THREE.SphereGeometry(.007, 8, 6), sm('#f8f4ea', .2), Math.cos(a) * .05, .19 - Math.sin(a) * .015, Math.sin(a) * .045); }
    // neck and head
    add(new THREE.CylinderGeometry(.03, .034, .05, 16), skin, 0, .215, 0);
    const HY = .3, HR = .075;
    add(new THREE.SphereGeometry(HR, 32, 24), skin, 0, HY, 0, .92, 1.12, .98);
    add(new THREE.SphereGeometry(.014, 12, 8), skin, 0, HY - .005, HR * .95, 1, 1.1, 1.1); // nose
    for (const e of [-1, 1]) { add(new THREE.SphereGeometry(.0085, 10, 8), sm('#1d1d1f', .3), e * .026, HY + .012, HR * .86); add(new THREE.SphereGeometry(.013, 10, 8), skin, e * .068, HY, 0, .5, 1, .8); } // eyes, ears
    if (L.brows || L.style !== 'bald') for (const e of [-1, 1]) add(new THREE.BoxGeometry(.024, .005, .006), sm(L.brows || L.hair, .8), e * .026, HY + .03, HR * .86).rotation.z = -e * .12;
    add(new THREE.BoxGeometry(.03, .004, .004), sm(L.grin ? '#7a2f2f' : '#9a5a50', .6), 0, HY - .035, HR * .88, L.grin ? 1.3 : 1, 1, 1);
    // hair by style
    const cap = (sx, sy, sz, y, z, tilt) => { const o = add(new THREE.SphereGeometry(HR * 1.06, 28, 18, 0, Math.PI * 2, 0, Math.PI * .55), hair, 0, HY + (y || 0), z || 0, sx, sy, sz); if (tilt) o.rotation.x = tilt; return o; };
    const st = L.style;
    if (st === 'bald') { add(new THREE.TorusGeometry(HR * .95, .012, 8, 24, Math.PI), hair, 0, HY - .005, -.005).rotation.set(Math.PI / 2, 0, Math.PI); }
    else if (st === 'sides') { for (const e of [-1, 1]) add(new THREE.SphereGeometry(.03, 14, 10), hair, e * .062, HY + .015, -.01, .7, 1.1, 1.3); add(new THREE.SphereGeometry(.03, 14, 10), hair, 0, HY + .02, -.06, 1.6, 1, .6); }
    else if (st === 'swoop') { cap(.98, .8, 1, .012, -.005); add(new THREE.SphereGeometry(.05, 18, 12), hair, .01, HY + .062, .03, 1.5, .5, 1.1).rotation.z = -.2; }
    else if (st === 'pompadour') { cap(.98, .8, 1, .01, -.005); add(new THREE.SphereGeometry(.045, 18, 12), hair, 0, HY + .07, .035, 1.2, .8, 1.2); }
    else if (st === 'curly' || st === 'afro' || st === 'puff') { const R = st === 'afro' ? 1.35 : st === 'puff' ? 1.15 : 1.08; for (let i = 0; i < (st === 'curly' ? 14 : 18); i++) { const a = i * 2.4, k = (i % 5) / 5; add(new THREE.IcosahedronGeometry(.03 * R, 0), hair, Math.cos(a) * HR * .75 * R * (1 - k * .4), HY + .04 + k * .035 * R, Math.sin(a) * HR * .7 * R * (1 - k * .4) - .01); } }
    else if (st === 'bob' || st === 'long' || st === 'bangs' || st === 'shag') { cap(1.02, 1, 1.04, .008, -.004); const len = st === 'long' ? .13 : st === 'bob' ? .075 : .1; add(new THREE.CylinderGeometry(HR * 1.02, HR * 1.12, len, 24, 1, true, Math.PI * .7, Math.PI * 1.6), hair, 0, HY - len / 2 + .01, -.008); }
    else { cap(1, st === 'slick' ? .7 : .82, 1.02, .01, -.006); }
    // accessories
    if (L.glasses || L.rglasses) { const fm = sm('#2a2a2c', .3, { metalness: .6 }); for (const e of [-1, 1]) add(new THREE.TorusGeometry(.017, .0025, 6, 20), fm, e * .026, HY + .012, HR * .93); add(new THREE.BoxGeometry(.016, .0025, .0025), fm, 0, HY + .014, HR * .95); }
    if (L.shades || L.aviators) { const lm = sm('#141518', .15, { metalness: .4 }); for (const e of [-1, 1]) add(new THREE.SphereGeometry(.019, 14, 10), lm, e * .026, HY + .01, HR * .9, 1, .8, .35); add(new THREE.BoxGeometry(.05, .003, .003), lm, 0, HY + .02, HR * .93); }
    if (L.mus) add(new THREE.SphereGeometry(.02, 12, 8), sm(L.hair, .8), 0, HY - .022, HR * .9, 1.6, .5, .6);
    if (L.beard) add(new THREE.SphereGeometry(HR * .9, 20, 14, 0, Math.PI * 2, Math.PI * .55, Math.PI * .45), sm(L.beardColor || L.hair, .9), 0, HY - .005, .008, .95, 1.05, 1);
    if (L.hat === 'helmet') { add(new THREE.SphereGeometry(HR * 1.45, 28, 20), sm('#eef0f2', .25, { transparent: true, opacity: .28, metalness: .2 }), 0, HY + .005, 0); }
    if (L.acc === 'beanie') add(new THREE.SphereGeometry(HR * 1.08, 24, 16, 0, Math.PI * 2, 0, Math.PI * .45), sm(L.hair, .95), 0, HY + .012, -.004);
    if (L.acc === 'headband') add(new THREE.TorusGeometry(HR * .98, .008, 8, 28), sm(L.band || '#e11d48', .7), 0, HY + .035, 0).rotation.x = Math.PI / 2 - .2;
    if (L.cigar) add(new THREE.CylinderGeometry(.006, .006, .05, 8), sm('#6b4423', .8), .02, HY - .035, HR * .95).rotation.z = 1.3;
    return g; }
  // the same figures, photographed once each for the cast cards
  async function figureThumbs(people) {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(160, 160); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .9;
    const sc = new THREE.Scene(); const k = new THREE.DirectionalLight(0xfff0dc, 2.2); k.position.set(-1, 1.6, 2); const f = new THREE.DirectionalLight(0xdfe8ff, .8); f.position.set(1.5, .5, 1); sc.add(k, f, new THREE.HemisphereLight(0xffffff, 0x666666, .5));
    const cm = new THREE.PerspectiveCamera(22, 1, .1, 10); cm.position.set(.06, .3, .52); cm.lookAt(0, .255, 0); const out = {};
    for (const p of people) { const fg = figure(p.look, p.color); sc.add(fg); r.render(sc, cm); out[p.id] = r.domElement.toDataURL('image/png'); sc.remove(fg); }
    r.dispose(); return out; }


  return { tex, svgImg, RNG, cvs, FLOORPAINT, realFloor, finishFloor, mats, M, MODELS, figure, figureThumbs, part };
}

// The place as the kit needs it: floor types per square, flat pieces (rugs) and standing pieces with their art.
export function placeData(L) {
  const N = L.rooms.length;
  const rooms = L.rooms.map((r) => (Array.isArray(r) ? r.join('') : r));
  const defs = (renderBoard(L, { labels: false }).match(/<defs>[\s\S]*?<\/defs>/) || [''])[0];
  const art = (i, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${i.w * U} ${i.h * U}" width="${i.w * px}" height="${i.h * px}">${defs}${OBJ[i.t].draw(0, 0, i.w * U, i.h * U).replace(/ filter="url\(#sh2?\)"/g, '')}</svg>`;
  const ftypes = []; for (let r = 0; r < N; r++) { const row = []; for (let c = 0; c < N; c++) row.push((L.cells && L.cells[r + ',' + c]) || L.rinfo[rooms[r][c]].floor); ftypes.push(row); }
  const items = (L.items || []).filter((i) => OBJ[i.t]);
  return { N, rooms, rinfo: L.rinfo, ftypes,
    flats: items.filter((i) => OBJ[i.t].flat).map((i) => ({ ...i, svg: art(i, 256) })),
    items: items.filter((i) => !OBJ[i.t].flat).map((i) => ({ ...i, svg: art(i, 200) })) };
}

// The static room: floor, plinth, table, walls, hedges, furniture. Returns the pick list (for taps), the top of
// every seat (people stand on it) and the anchors for the flat room names.
const HT = { bookshelf: .62, wardrobe: .9, fridge: .9, winerack: .85, shopshelf: .8, organ: .85, displaycase: .55, scoreboard: .95, gumwall: .9, tvs: .7, temple: .9, door: .95,
  car: .3, boat: .1, swanboat: .18, bowbridge: .14, hottub: .14, birdcage: .06, gazebo: .06, carriage: .26, carousel: .1, redseat: .16, lifeguard: .32, piano: .42, workbench: .4, pottingtable: .38, seancetable: .34,
  fishstall: .42, flowerstall: .4, hotdog: .5, firepit: .12, telescope: .5, projector: .5, teslacoil: .8, pendulum: .08, monument: .7, washington: .8, duckstatue: .25, pigstatue: .3, lion: .5, angelfountain: .5,
  net: .3, weights: .35, hoop: .9, ramp: .08, bandshell: .7, umbrella: .75, bicycle: .28, sailboat: .08, tub: .25, vanity: .4, lounger: .12, wardrobe2: .9 };
export async function buildRoom(kit, THREE, P, isOpen) {
  const { tex, svgImg, cvs, FLOORPAINT, RNG, MODELS, mats } = kit; const M = mats();
  const N = P.N, R = P.rooms; const root = new THREE.Group(); const pick = []; const cellTop = {};
  const X = (c) => c - N / 2 + 0.5, Z = (r) => r - N / 2 + 0.5;
  const F = kit.realFloor(P); const t = await kit.finishFloor(F, P);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(N, N), new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: .012, roughness: .82 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor); pick.push(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(N + .5, .35, N + .5), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: .35, metalness: .1 }));
  plinth.position.y = -.18; plinth.receiveShadow = true; root.add(plinth);
  const tcv = cvs(512); FLOORPAINT.wood(tcv.getContext('2d'), 0, 0, 512, RNG(77), '#4a2f1d'); const tt = tex(tcv); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(6, 6);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(N * 6, N * 6), new THREE.MeshStandardMaterial({ map: tt, roughness: .45 })); table.rotation.x = -Math.PI / 2; table.position.y = -.355; table.receiveShadow = true; root.add(table);
  const wallM = new THREE.MeshStandardMaterial({ map: M.plaster.map, color: 0xb9b3a6, roughness: .9 }), capM = new THREE.MeshStandardMaterial({ map: M.plaster.map, color: 0xd6d0c4, roughness: .9 });
  const out = (r, c) => !!P.rinfo[R[r][c]].out;
  const wall = (x, z, w, d, h, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; root.add(b);
    if (m === wallM) { const cp = new THREE.Mesh(new THREE.BoxGeometry(w + .005, .02, d + .005), capM); cp.position.set(x, h + .01, z); root.add(cp); } };
  const WH = .3, T = .09, FT = .14;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (c < N - 1 && R[r][c] !== R[r][c + 1]) { const o = out(r, c) && out(r, c + 1); wall(X(c) + .5, Z(r), o ? .1 : T, 1 + (o ? -.1 : T), o ? .2 : WH, o ? M.leaf : wallM); }
    if (r < N - 1 && R[r][c] !== R[r + 1][c]) { const o = out(r, c) && out(r + 1, c); wall(X(c), Z(r) + .5, 1 + (o ? -.1 : T), o ? .1 : T, o ? .2 : WH, o ? M.leaf : wallM); }
    if (!out(r, c)) {
      if (r === 0) wall(X(c), -N / 2 + FT / 2, 1 + FT, FT, WH + .04, wallM); if (r === N - 1) wall(X(c), N / 2 - FT / 2, 1 + FT, FT, WH + .04, wallM);
      if (c === 0) wall(-N / 2 + FT / 2, Z(r), FT, 1 + FT, WH + .04, wallM); if (c === N - 1) wall(N / 2 - FT / 2, Z(r), FT, 1 + FT, WH + .04, wallM); } }
  const imgs = await Promise.all(P.items.map((it) => svgImg(it.svg)));
  P.items.forEach((it, ii) => {
    const im = imgs[ii]; if (!im) return;
    // the drawing's own outline gives each model its footprint inside its squares
    const W = it.w * 200, Hh = it.h * 200; const cv = cvs(W, Hh); const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, W, Hh);
    const px = cx.getImageData(0, 0, W, Hh).data; let x0 = W, y0 = Hh, x1 = 0, y1 = 0, rs = 0, gs = 0, bs = 0, n = 0;
    for (let y = 0; y < Hh; y += 2) for (let x = 0; x < W; x += 2) { const k = (y * W + x) * 4; if (px[k + 3] > 60) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; rs += px[k]; gs += px[k + 1]; bs += px[k + 2]; n++; } }
    if (!n) return;
    const bw = (x1 - x0 + 2) / 200, bd = (y1 - y0 + 2) / 200; const g = new THREE.Group(); g.position.set(X(it.c) - .5 + (x0 + x1) / 400, 0, Z(it.r) - .5 + (y0 + y1) / 400); root.add(g);
    let top;
    if (MODELS[it.t]) top = MODELS[it.t](g, bw, bd, { ...it, N });
    else { // no model yet: the drawing, muted, on a block of its own colour
      const side = new THREE.Color(rs / n / 255, gs / n / 255, bs / n / 255).multiplyScalar(.72); side.offsetHSL(0, -.25, 0);
      const crop = cvs(x1 - x0 + 2, y1 - y0 + 2); const c2 = crop.getContext('2d'); c2.filter = 'saturate(.55) brightness(.92)'; c2.drawImage(cv, x0 - 1, y0 - 1, crop.width, crop.height, 0, 0, crop.width, crop.height);
      const sideM = new THREE.MeshStandardMaterial({ color: side, roughness: .8 }), topM = new THREE.MeshStandardMaterial({ map: tex(crop), transparent: true, alphaTest: .4, roughness: .75 });
      const corner = (x, y) => px[(y * W + x) * 4 + 3] > 60; const round = !corner(x0 + 3, y0 + 3) && !corner(x1 - 3, y0 + 3) && !corner(x0 + 3, y1 - 3) && !corner(x1 - 3, y1 - 3);
      top = HT[it.t] || .3; const body = round ? new THREE.Mesh(new THREE.CylinderGeometry(Math.min(bw, bd) / 2, Math.min(bw, bd) / 2, top, 28), [sideM, topM, sideM]) : new THREE.Mesh(new THREE.BoxGeometry(bw, top, bd), [sideM, sideM, topM, sideM, sideM, sideM]);
      body.position.y = top / 2; body.castShadow = body.receiveShadow = true; g.add(body); }
    g.traverse((o) => { if (o.isMesh) pick.push(o); });
    if (isOpen(it.r, it.c)) for (let dr = 0; dr < it.h; dr++) for (let dc = 0; dc < it.w; dc++) cellTop[(it.r + dr) * N + it.c + dc] = top;
  });
  const labels = []; const seen = {};
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const k = R[r][c]; if (seen[k]) continue; seen[k] = 1;
    let span = 1; while (c + span < N && R[r][c + span] === k) span++;
    labels.push({ k, name: P.rinfo[k].name, out: !!P.rinfo[k].out, a: [X(c) - .5 + .07, .34, Z(r) - .5 + .05], b: [X(c + span - 1) + .5 - .07, .34, Z(r) - .5 + .05] }); }
  return { root, pick, cellTop, labels };
}
