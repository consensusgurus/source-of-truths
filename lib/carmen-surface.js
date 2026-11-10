// THE TRUE-COLOUR EARTH IN SPACE (owner, 2026-11-10: "true color in space -
// that looks amazing", look B of the true-colour mockup). A canvas under
// Carmen's SVG globe paints the Earth itself from NASA's Blue Marble (public
// domain, 4096x2048), lit from the top left with relief from an elevation map,
// a sun glint only on water (from a water mask), real cloud cover, a blue rim
// haze, and a fixed starfield behind. Every pixel of the disc is inverse-
// projected onto the images and sampled bilinearly. The SVG above keeps the
// borders, pins, trail and rings, so taps and pins are unchanged.
//
// While the globe moves it paints at lower resolution with nearest sampling
// and no relief, then repaints crisp a moment after it settles. Until the
// images arrive it paints a plain lit blue sphere, so the globe never blinks
// out. Images: public/carmen/earth-day.jpg, earth-relief.png,
// earth-water.png, earth-clouds.jpg (the last three via the MIT three-globe
// examples, derived from NASA imagery).
//
// MORE DETAIL AS YOU ZOOM (owner, 2026-11-10: "can we make the globe more
// detailed?"). Past what the 4096 image holds, the surface pulls NASA GIBS
// Blue Marble tiles (BlueMarble_ShadedRelief_Bathymetry, EPSG:4326, 512 px
// tiles, levels 3 to 7, about 500 m a pixel at the deepest; public domain,
// CORS open) for just the patch on screen, caches them, and samples them over
// the base image. Until a tile arrives the base image shows there. Clouds fade
// out as you zoom in. Resolution is budgeted on the part of the disc actually
// on screen, so a zoomed globe draws at full sharpness.

const SRC = { col: '/carmen/earth-day.jpg', topo: '/carmen/earth-relief.png', water: '/carmen/earth-water.png', clouds: '/carmen/earth-clouds.jpg' };

function loadImg(url) {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = url; });
}
function pixels(img) {
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  return { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data };
}
// One set of images per page, shared by every globe on it.
let texPromise = null;
function loadTextures() {
  if (!texPromise) {
    texPromise = Promise.all([loadImg(SRC.col), loadImg(SRC.topo), loadImg(SRC.water), loadImg(SRC.clouds)])
      .then(([c, t, w, cl]) => ({ col: pixels(c), topo: pixels(t), water: pixels(w), clouds: pixels(cl) }))
      .catch((e) => { texPromise = null; throw e; });
  }
  return texPromise;
}

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-08/500m/';
const TILE = 512, ZMIN = 3, ZMAX = 7;
const spanOf = (z) => 288 / (1 << z); // degrees per tile
const tiles = new Map(); // 'z/r/c' -> { d } once loaded, null while loading, false on failure
let tileListeners = new Set();
function wantTile(z, r, c) {
  const key = z + '/' + r + '/' + c;
  if (tiles.has(key)) return tiles.get(key);
  tiles.set(key, null);
  const img = new Image();
  img.crossOrigin = 'anonymous'; img.decoding = 'async';
  img.onload = () => {
    try {
      const cv = document.createElement('canvas'); cv.width = TILE; cv.height = TILE;
      const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, TILE, TILE);
      tiles.set(key, { d: x.getImageData(0, 0, TILE, TILE).data });
    } catch (e) { tiles.set(key, false); }
    for (const f of tileListeners) f();
  };
  img.onerror = () => { tiles.set(key, false); };
  img.src = GIBS + z + '/' + r + '/' + c + '.jpeg';
  return null;
}

function hs(i, s) { let h = Math.imul(i, 374761393) + Math.imul(s, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

export default class CarmenSurface {
  constructor(svg) {
    const cv = document.createElement('canvas');
    cv.className = 'cmn-surf';
    cv.setAttribute('aria-hidden', 'true');
    svg.parentNode.insertBefore(cv, svg);
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.T = null; this.last = null; this.crispT = 0; this.lastDraw = 0;
    loadTextures().then((T) => { this.T = T; if (this.last) this.paintNow(false); }).catch(() => {});
    // a tile arriving repaints crisp (coalesced)
    this.onTile = () => { if (this.tileT) return; this.tileT = setTimeout(() => { this.tileT = 0; if (performance.now() - this.lastDraw > 120) this.paintNow(false); }, 60); };
    tileListeners.add(this.onTile);
  }

  // rot: d3 rotation [lambda, phi]; frame in CSS px.
  draw(vw, vh, rot, cx, cy, r, k = 1) {
    this.last = [vw, vh, rot.slice(), cx, cy, r, k];
    const now = performance.now(), moving = now - this.lastDraw < 90;
    this.lastDraw = now;
    this.paintNow(moving);
    clearTimeout(this.crispT);
    if (moving) this.crispT = setTimeout(() => this.paintNow(false), 150);
  }

  paintNow(low) {
    if (!this.last || !this.cv.isConnected) return;
    const [vw, vh, rot, ccx, ccy, cr, zk] = this.last;
    const dprFull = Math.min(2.25, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    // Detail follows the part of the disc on screen, so a zoomed globe stays sharp.
    const budget = low ? 160000 : 1400000;
    const vx0 = Math.max(0, ccx - cr), vx1 = Math.min(vw, ccx + cr), vy0 = Math.max(0, ccy - cr), vy1 = Math.min(vh, ccy + cr);
    const area = Math.min(Math.PI * cr * cr, Math.max(1, (vx1 - vx0) * (vy1 - vy0)));
    const q = Math.max(0.35, Math.min(dprFull, Math.sqrt(budget / Math.max(1, area))));
    const W = Math.max(1, Math.round(vw * q)), H = Math.max(1, Math.round(vh * q));
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; this.img = null; }
    const ctx = this.ctx;
    const R = cr * q, cx = ccx * q, cy = ccy * q;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    // stars, fixed to the screen
    const n = Math.round(Math.min(420, (W * H) / (q * q) / 2600));
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `rgba(255,255,255,${(0.18 + hs(i, 3) * 0.7).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(hs(i, 7) * W, hs(i, 13) * H, (hs(i, 41) < 0.07 ? 1.3 : 0.7) * q, 0, 6.2832); ctx.fill();
    }
    // the blue haze just outside the rim
    const gl = ctx.createRadialGradient(cx, cy, R * 0.98, cx, cy, R * 1.09 + 4 * q);
    gl.addColorStop(0, 'rgba(120,180,255,.55)'); gl.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, R * 1.09 + 4 * q, 0, 6.2832); ctx.fill();
    const T = this.T;
    if (!T) { // a plain lit sphere until the images arrive
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
      g.addColorStop(0, '#2f6fb0'); g.addColorStop(0.7, '#0e2c55'); g.addColorStop(1, '#06142a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
      return;
    }
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H, Math.ceil(cy + R));
    const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
    if (!this.img || this.img.width !== bw || this.img.height !== bh) this.img = ctx.createImageData(bw, bh);
    const data = this.img.data; data.fill(0);
    const lam = rot[0] * Math.PI / 180, phi = -rot[1] * Math.PI / 180;
    const cl = Math.cos(phi), sl = Math.sin(phi);
    // LIGHTER (owner, 2026-11-10: "a bit lighter? Seems super dark"): the sun sits
    // more in front, the shadow side keeps more fill light, and an exposure lift.
    let lx = -0.42, ly = 0.48, lz = 0.77; const ln = Math.hypot(lx, ly, lz); lx /= ln; ly /= ln; lz /= ln;
    const hn = Math.hypot(lx, ly, lz + 1), hx = lx / hn, hy = ly / hn, hz = (lz + 1) / hn;
    const C = T.col, TP = T.topo, WA = T.water, CL = T.clouds;
    const TWO_PI = Math.PI * 2;
    const out = [0, 0, 0];
    // bilinear sample of channel 0..ch-1, wrapping in u
    const bil = (I, u, v, ch) => {
      const fx = u * I.w - 0.5, fy = Math.max(0, Math.min(I.h - 1.001, v * I.h - 0.5));
      const ixf = Math.floor(fx), iy = fy | 0, ax = fx - ixf, ay = fy - iy;
      const ix0 = ((ixf % I.w) + I.w) % I.w, ix1 = ix0 + 1 === I.w ? 0 : ix0 + 1, iy1 = iy + 1 < I.h ? iy + 1 : iy;
      const a = (iy * I.w + ix0) * 4, b = (iy * I.w + ix1) * 4, c = (iy1 * I.w + ix0) * 4, e = (iy1 * I.w + ix1) * 4, d = I.d;
      for (let k = 0; k < ch; k++) out[k] = (d[a + k] * (1 - ax) + d[b + k] * ax) * (1 - ay) + (d[c + k] * (1 - ax) + d[e + k] * ax) * ay;
      return out[0];
    };
    const near = (I, u, v) => ((Math.min(I.h - 1, (v * I.h) | 0) * I.w + Math.min(I.w - 1, (u * I.w) | 0)) * 4);
    const du = 1.5 / TP.w, dv = 1.5 / TP.h;
    // Which tile level matches the screen: device pixels per degree at the centre.
    const ppd = R * Math.PI / 180;
    let z = -1;
    if (ppd > C.w / 360 * 1.1) { z = ZMIN; while (z < ZMAX && (TILE << z) / 288 < ppd * 0.9) z++; }
    const span = z >= 0 ? spanOf(z) : 0;
    let ok = !!(typeof window !== 'undefined');
    if (z >= 0 && ok) {
      // ask for the tiles under a coarse grid of on-screen disc points
      const seen = new Set();
      for (let gy = 0; gy <= 12; gy++) for (let gx = 0; gx <= 12; gx++) {
        const sx = x0 + (x1 - x0) * gx / 12, sy = y0 + (y1 - y0) * gy / 12;
        const nx = (sx - cx) / R, ny = (sy - cy) / R, rr = nx * nx + ny * ny; if (rr > 1) continue;
        const nz = Math.sqrt(1 - rr), vy = -ny, y2 = vy * cl + nz * sl, z2 = -vy * sl + nz * cl;
        const latd = Math.asin(Math.max(-1, Math.min(1, y2))) * 180 / Math.PI;
        let lond = (Math.atan2(nx, z2) - lam) * 180 / Math.PI; lond = ((lond + 180) % 360 + 360) % 360 - 180;
        const r0 = Math.floor((90 - latd) / span), c0 = Math.floor((lond + 180) / span);
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const rr2 = r0 + dr, cc2 = c0 + dc; if (rr2 < 0 || cc2 < 0 || rr2 * span >= 180 || cc2 * span >= 360) continue;
          const key = rr2 * 4096 + cc2; if (seen.has(key)) continue; seen.add(key); wantTile(z, rr2, cc2);
        }
      }
    }
    const tileFor = (lond, latd) => {
      const r0 = Math.floor((90 - latd) / span), c0 = Math.floor((lond + 180) / span);
      const t = tiles.get(z + '/' + r0 + '/' + c0);
      if (!t) return null;
      lastT = t; lastR = r0; lastC = c0; return t;
    };
    let lastT = null, lastR = -1, lastC = -1;
    const cloudFade = Math.max(0, Math.min(1, 1 - ((zk || 1) - 1.6) / 1.4));
    for (let py = y0; py < y1; py++) {
      const ny = (py + 0.5 - cy) / R;
      for (let px = x0; px < x1; px++) {
        const nx = (px + 0.5 - cx) / R, rr = nx * nx + ny * ny;
        if (rr > 1) continue;
        const nz = Math.sqrt(1 - rr), vy = -ny;
        const y2 = vy * cl + nz * sl, z2 = -vy * sl + nz * cl;
        const lat = Math.asin(y2 > 1 ? 1 : y2 < -1 ? -1 : y2);
        let u = (Math.atan2(nx, z2) - lam) / TWO_PI + 0.5; u -= Math.floor(u);
        const v = 0.5 - lat / Math.PI;
        let r, g, b, water, cloud;
        let dif = nx * lx + vy * ly + nz * lz;
        let tileHit = false;
        if (z >= 0) {
          const lond = u * 360 - 180, latd = 90 - v * 180;
          const r0 = Math.floor((90 - latd) / span), c0 = Math.floor((lond + 180) / span);
          const t = (r0 === lastR && c0 === lastC) ? lastT : tileFor(lond, latd);
          if (t) {
            const fx = ((lond + 180) / span - c0) * TILE, fy = ((90 - latd) / span - r0) * TILE;
            if (low) {
              const o = ((Math.min(TILE - 1, fy | 0)) * TILE + Math.min(TILE - 1, fx | 0)) * 4; r = t.d[o]; g = t.d[o + 1]; b = t.d[o + 2];
            } else {
              const ix = Math.min(TILE - 2, Math.max(0, Math.floor(fx - 0.5))), iy = Math.min(TILE - 2, Math.max(0, Math.floor(fy - 0.5)));
              const ax = Math.max(0, Math.min(1, fx - 0.5 - ix)), ay = Math.max(0, Math.min(1, fy - 0.5 - iy));
              const a = (iy * TILE + ix) * 4, bq = a + 4, c2 = a + TILE * 4, e = c2 + 4, d = t.d;
              r = (d[a] * (1 - ax) + d[bq] * ax) * (1 - ay) + (d[c2] * (1 - ax) + d[e] * ax) * ay;
              g = (d[a + 1] * (1 - ax) + d[bq + 1] * ax) * (1 - ay) + (d[c2 + 1] * (1 - ax) + d[e + 1] * ax) * ay;
              b = (d[a + 2] * (1 - ax) + d[bq + 2] * ax) * (1 - ay) + (d[c2 + 2] * (1 - ax) + d[e + 2] * ax) * ay;
            }
            tileHit = true;
          }
        }
        if (tileHit) { // the tiles carry their own shaded relief
          // water read from the sharp tile itself (blue over red), so the glint keeps the coast's edge
          water = Math.max(0, Math.min(1, (b - r - 18) / 40)) * (b > g ? 1 : 0.4);
          cloud = CL.d[near(CL, u, v)] / 255;
        } else if (low) {
          const o = near(C, u, v); r = C.d[o]; g = C.d[o + 1]; b = C.d[o + 2];
          water = WA.d[near(WA, u, v)] / 255; cloud = CL.d[near(CL, u, v)] / 255;
        } else {
          bil(C, u, v, 3); r = out[0]; g = out[1]; b = out[2];
          water = bil(WA, u, v, 1) / 255; cloud = bil(CL, u, v, 1) / 255;
          const h0 = bil(TP, u, v, 1), hxp = bil(TP, u + du, v, 1), hyp = bil(TP, u, v + dv, 1);
          dif += (-(hxp - h0) * lx + (hyp - h0) * ly) / 255 * 3.2 * (1 - water);
        }
        if (dif < 0) dif = 0;
        const lit = 0.42 + 0.58 * Math.pow(dif, 0.7);
        const ex = lit * 1.22;
        r *= ex; g *= ex; b *= ex;
        const cc = cloud * 0.9 * cloudFade, cv = 255 * (0.25 + 0.75 * lit);
        r += (cv - r) * cc; g += (cv - g) * cc; b += (cv - b) * cc;
        const sp = Math.pow(Math.max(0, nx * hx + vy * hy + nz * hz), 70) * 120 * water * (1 - cc);
        r += sp; g += sp; b += sp * 0.95;
        const limb = Math.pow(1 - nz, 2.4) * 0.75;
        r += (110 - r) * limb * 0.55; g += (170 - g) * limb * 0.55; b += (255 - b) * limb * 0.7;
        const o = ((py - y0) * bw + (px - x0)) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
      }
    }
    // Composite the disc over the stars and haze (putImageData would replace them).
    const tmp = this.tmp || (this.tmp = document.createElement('canvas'));
    if (tmp.width !== bw || tmp.height !== bh) { tmp.width = bw; tmp.height = bh; }
    tmp.getContext('2d').putImageData(this.img, 0, 0);
    ctx.drawImage(tmp, x0, y0);
  }

  destroy() { clearTimeout(this.crispT); clearTimeout(this.tileT); tileListeners.delete(this.onTile); this.last = null; if (this.cv.parentNode) this.cv.parentNode.removeChild(this.cv); }
}
