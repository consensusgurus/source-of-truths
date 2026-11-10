// THE REAL NOIR SURFACE (owner, 2026-11-09: "Do the noir one", from the
// realistic-globe mockup, look C). A canvas under Carmen's SVG globe paints the
// sphere itself: black water with a lighter continental shelf, lime land with
// terrain texture, sand-lime deserts, pale ice, lit from the top left with the
// night side toward the bottom right, a glint on the water and a lime haze on
// the rim. No image textures: the surface is painted once into an
// equirectangular texture from the same world-110m land the game uses, then
// each frame inverse-projects every pixel of the disc onto it. The SVG above
// keeps the coastline, borders, pins, trail and rings, so taps and pins are
// unchanged. While the globe moves it paints at a lower resolution, then
// repaints crisp once it settles.
import { geoEquirectangular, geoOrthographic, geoPath } from 'd3-geo';

const TW = 1536, TH = 768;

function hash(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s / 0.9375; }
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Desert boxes [lonMin, lonMax, latMin, latMax], softened at the edges.
const DESERTS = [[-17, 34, 15, 31], [34, 60, 14, 32], [44, 63, 24, 38], [60, 72, 25, 32], [68, 76, 24, 30], [76, 112, 36, 46],
  [-118, -104, 27, 37], [-115, -110, 22, 31], [-72, -68, -28, -16], [12, 26, -29, -18], [116, 145, -32, -18], [-70, -64, -48, -38]];
function desertness(lon, lat) {
  let d = 0;
  for (const [a, b, c, e] of DESERTS) d = Math.max(d, ss(a - 5, a + 5, lon) * (1 - ss(b - 5, b + 5, lon)) * ss(c - 3, c + 3, lat) * (1 - ss(e - 3, e + 3, lat)));
  return d;
}

const NOIR = {
  deep: hex('#14181e'), shelf: hex('#2a3340'), ice: hex('#dfeec2'), forest: hex('#9fc26a'), rain: hex('#93b85f'),
  grass: hex('#b9d97c'), desert: hex('#cde39c'), desertHi: hex('#d9ebb0'), tundra: hex('#c4dc92'), mount: hex('#a8c472'),
  atmo: [196, 224, 138], ambient: 0.2, spec: 0.35, night: [8, 10, 13],
};

// One texture per page, shared by every globe on it.
let painted = null;
function paint(landGeo) {
  if (painted) return painted;
  const L = NOIR;
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const path = geoPath(geoEquirectangular().scale(TW / (2 * Math.PI)).translate([TW / 2, TH / 2]), cx);
  cx.fillStyle = '#000'; cx.fillRect(0, 0, TW, TH);
  cx.fillStyle = '#fff'; cx.beginPath(); path(landGeo); cx.fill();
  const mask = cx.getImageData(0, 0, TW, TH).data;
  const cb = document.createElement('canvas'); cb.width = TW; cb.height = TH;
  const bx = cb.getContext('2d', { willReadFrequently: true });
  try { bx.filter = 'blur(6px)'; } catch (e) {}
  bx.drawImage(cv, 0, 0);
  const blur = bx.getImageData(0, 0, TW, TH).data;
  const tex = new Uint8ClampedArray(TW * TH * 3), land = new Uint8Array(TW * TH);
  const sc = TW / 1024; // noise scales were tuned on a 1024-wide texture
  for (let y = 0; y < TH; y++) {
    const lat = 90 - (y + 0.5) * 180 / TH, al = Math.abs(lat);
    for (let x = 0; x < TW; x++) {
      const lon = (x + 0.5) * 360 / TW - 180, i = y * TW + x;
      const isLand = mask[i * 4] > 127 || lat < -66;
      land[i] = mask[i * 4] > 127 ? 1 : 0;
      const n = 0.5 + (fbm(x / (40 * sc), y / (40 * sc)) - 0.5) * (1 - ss(70, 84, al));
      let c;
      if (isLand) {
        const n2 = fbm(x / (9 * sc) + 30, y / (9 * sc), 3);
        const ice = Math.max(ss(68, 76, al + (n * 10 - 5) * (1 - ss(74, 82, al))), lat < -60 ? 1 : 0, (lon > -60 && lon < -15 && lat > 60) ? ss(59, 66, lat + n * 6) : 0);
        const des = desertness(lon, lat) * ss(0.25, 0.55, n + 0.15);
        const trop = 1 - ss(8, 16, al + (n - 0.5) * 8);
        const boreal = ss(48, 58, al + (n - 0.5) * 6);
        let base = mix(L.grass, L.forest, ss(0.35, 0.7, n));
        base = mix(base, L.rain, trop * 0.9);
        base = mix(base, mix(L.forest, L.tundra, ss(60, 68, al)), boreal);
        base = mix(base, mix(L.desert, L.desertHi, n2), des);
        const mtn = ss(0.62, 0.78, fbm(x / (22 * sc) + 7, y / (22 * sc) + 3, 3));
        base = mix(base, L.mount, mtn * 0.45 * (1 - ice));
        c = mix(base, L.ice, Math.min(1, ice));
        const t = 0.86 + n2 * 0.28; c = [c[0] * t, c[1] * t, c[2] * t];
      } else {
        c = mix(L.deep, L.shelf, ss(0.05, 0.6, blur[i * 4] / 255) * 0.6);
        const t = 0.9 + n * 0.2; c = [c[0] * t, c[1] * t, c[2] * t];
      }
      tex[i * 3] = c[0]; tex[i * 3 + 1] = c[1]; tex[i * 3 + 2] = c[2];
    }
  }
  painted = { tex, land };
  return painted;
}

export default class CarmenSurface {
  constructor(svg, landGeo) {
    this.L = NOIR;
    const cv = document.createElement('canvas');
    cv.className = 'cmn-surf';
    cv.setAttribute('aria-hidden', 'true');
    svg.parentNode.insertBefore(cv, svg);
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.landGeo = landGeo;
    this.T = null;
    this.last = null; this.crispT = 0; this.lastDraw = 0;
    // Paint the texture after the first frame, so the page shows at once.
    this.ready = new Promise((res) => setTimeout(() => { try { this.T = paint(landGeo); } catch (e) {} res(); }, 0));
  }

  // rot: d3 rotation [lambda, phi]; frame in CSS px.
  draw(vw, vh, rot, cx, cy, r) {
    this.last = [vw, vh, rot.slice(), cx, cy, r];
    if (!this.T) { this.ready.then(() => this.last && this.paintNow(false)); return; }
    const now = performance.now(), moving = now - this.lastDraw < 90;
    this.lastDraw = now;
    this.paintNow(moving);
    clearTimeout(this.crispT);
    if (moving) this.crispT = setTimeout(() => this.paintNow(false), 140);
  }

  paintNow(low) {
    if (!this.T || !this.last || !this.cv.isConnected) return;
    const [vw, vh, rot, ccx, ccy, cr] = this.last;
    const dprFull = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    // Detail follows the disc's size, so a big zoomed globe stays affordable.
    const budget = low ? 140000 : 520000;
    const area = Math.PI * cr * cr;
    const q = Math.max(0.35, Math.min(dprFull, Math.sqrt(budget / Math.max(1, area))));
    const W = Math.max(1, Math.round(vw * q)), H = Math.max(1, Math.round(vh * q));
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; this.img = null; }
    if (!this.img) this.img = this.ctx.createImageData(W, H);
    const L = this.L, { tex, land } = this.T;
    const data = this.img.data; data.fill(0);
    // A crisp, antialiased land mask for THIS frame, from the vector land, so
    // coasts stay sharp however far the globe zooms; the texture gives colour.
    if (!this.mcv) { this.mcv = document.createElement('canvas'); this.mctx = this.mcv.getContext('2d', { willReadFrequently: true }); }
    if (this.mcv.width !== W || this.mcv.height !== H) { this.mcv.width = W; this.mcv.height = H; }
    const mx = this.mctx;
    mx.clearRect(0, 0, W, H); mx.fillStyle = '#fff'; mx.beginPath();
    geoPath(geoOrthographic().translate([ccx * q, ccy * q]).scale(cr * q).rotate([rot[0], rot[1], 0]).clipAngle(90), mx)(this.landGeo);
    mx.fill();
    const mk = mx.getImageData(0, 0, W, H).data;
    const FL = [L.grass[0] * 0.95, L.grass[1] * 0.95, L.grass[2] * 0.95], FO = mix(L.deep, L.shelf, 0.45);
    const R = cr * q, cx = ccx * q, cy = ccy * q;
    const lam = rot[0] * Math.PI / 180, phi = -rot[1] * Math.PI / 180;
    const cl = Math.cos(phi), sl = Math.sin(phi);
    let lx = -0.55, ly = 0.6, lz = 0.58; const ln = Math.hypot(lx, ly, lz); lx /= ln; ly /= ln; lz /= ln;
    const hn = Math.hypot(lx, ly, lz + 1), hx = lx / hn, hy = ly / hn, hz = (lz + 1) / hn;
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H, Math.ceil(cy + R));
    const TWO_PI = Math.PI * 2;
    for (let py = y0; py < y1; py++) {
      const ny = (py + 0.5 - cy) / R;
      for (let px = x0; px < x1; px++) {
        const nx = (px + 0.5 - cx) / R, rr = nx * nx + ny * ny;
        if (rr > 1) continue;
        const nz = Math.sqrt(1 - rr), vy = -ny;
        const y2 = vy * cl + nz * sl, z2 = -vy * sl + nz * cl;
        const lat = Math.asin(y2 > 1 ? 1 : y2 < -1 ? -1 : y2);
        const lon = Math.atan2(nx, z2) - lam;
        let u = lon / TWO_PI + 0.5; u -= Math.floor(u);
        const tx = Math.min(TW - 1, (u * TW) | 0), ty = Math.min(TH - 1, ((0.5 - lat / Math.PI) * TH) | 0), ti = ty * TW + tx;
        const o = (py * W + px) * 4;
        const polar = lat < -1.15; // Antarctica's interior is land in the texture
        const m = polar ? 1 : mk[o + 3] / 255, onLand = land[ti] || polar;
        const tr = tex[ti * 3], tg = tex[ti * 3 + 1], tb = tex[ti * 3 + 2];
        const lr = onLand ? tr : FL[0], lg = onLand ? tg : FL[1], lb = onLand ? tb : FL[2];
        const orr = onLand ? FO[0] : tr, og = onLand ? FO[1] : tg, ob = onLand ? FO[2] : tb;
        let rC = orr + (lr - orr) * m, gC = og + (lg - og) * m, bC = ob + (lb - ob) * m;
        const dif = Math.max(0, nx * lx + vy * ly + nz * lz);
        const lit = L.ambient + (1 - L.ambient) * Math.pow(dif, 0.9), dk = (1 - lit) * 0.5;
        rC = rC * lit + L.night[0] * dk; gC = gC * lit + L.night[1] * dk; bC = bC * lit + L.night[2] * dk;
        if (m < 1) { const sp = Math.pow(Math.max(0, nx * hx + vy * hy + nz * hz), 60) * L.spec * 255 * (1 - m); rC += sp; gC += sp; bC += sp; }
        const limb = Math.pow(1 - nz, 2.2) * 0.5;
        rC += (L.atmo[0] - rC) * limb; gC += (L.atmo[1] - gC) * limb; bC += (L.atmo[2] - bC) * limb;
        data[o] = rC; data[o + 1] = gC; data[o + 2] = bC; data[o + 3] = 255;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
    // The lime haze just outside the rim (drawn over the cleared margin only).
    const g = this.ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.07 + 6 * q);
    g.addColorStop(0, `rgba(${L.atmo.join(',')},.45)`); g.addColorStop(1, `rgba(${L.atmo.join(',')},0)`);
    this.ctx.save(); this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.fillStyle = g; this.ctx.beginPath(); this.ctx.arc(cx, cy, R * 1.07 + 6 * q, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.restore();
  }

  destroy() { clearTimeout(this.crispT); this.last = null; if (this.cv.parentNode) this.cv.parentNode.removeChild(this.cv); }
}
