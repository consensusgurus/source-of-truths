// THE TRUE-COLOUR EARTH IN SPACE (owner, 2026-11-10: "true color in space -
// that looks amazing", look B of the true-colour mockup), drawn on the GPU.
//
// WHY WEBGL (owner, 2026-11-14: "Carmen is super laggy"; he asked for a sharp
// globe on a black space background). The first version inverse-projected
// every pixel of the disc in JavaScript on the main thread, up to 1.4 million
// pixels per crisp frame, so every drag, zoom and flight froze the page. Now a
// fragment shader does the same math per pixel on the graphics chip: the Earth
// is NASA's Blue Marble (public domain, 4096x2048), lit from the top left, with
// relief from an elevation map, a sun glint only on water (from a water mask),
// real cloud cover, a blue rim haze and faint fixed stars. It renders at full
// screen sharpness (device pixel ratio capped at 2) on every frame, moving or
// not, with mipmapped sampling so it stays crisp when zoomed out too.
//
// The SVG above keeps the borders, pins, trail and rings, so taps and pins are
// unchanged. Until the images arrive it paints a plain lit blue sphere. If the
// browser has no WebGL2 the constructor throws and the globe falls back to the
// flat Noir look (lib/carmen-globe.js unreal()).
//
// MORE DETAIL AS YOU ZOOM (owner, 2026-11-10: "can we make the globe more
// detailed?"). Past what the 4096 image holds, the surface pulls NASA GIBS
// Blue Marble tiles (BlueMarble_ShadedRelief_Bathymetry, EPSG:4326, 512 px
// tiles, levels 3 to 7, about 500 m a pixel at the deepest; public domain,
// CORS open) for just the patch on screen, lays them into one mosaic texture,
// and samples it over the base image. Until a tile arrives the base image
// shows there. Clouds fade out as you zoom in. Images: public/carmen/
// earth-day.jpg, earth-relief.png, earth-water.png, earth-clouds.jpg (the
// last three via the MIT three-globe examples, derived from NASA imagery).

const SRC = { col: '/carmen/earth-day.jpg', topo: '/carmen/earth-relief.png', water: '/carmen/earth-water.png', clouds: '/carmen/earth-clouds.jpg' };

function loadImg(url, cors) {
  return new Promise((res, rej) => {
    const i = new Image();
    if (cors) i.crossOrigin = 'anonymous';
    i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = url;
  });
}
// One set of images per page, shared by every globe on it.
let imgPromise = null;
function loadImages() {
  if (!imgPromise) {
    imgPromise = Promise.all([loadImg(SRC.col), loadImg(SRC.topo), loadImg(SRC.water), loadImg(SRC.clouds)])
      .then(([col, topo, water, clouds]) => ({ col, topo, water, clouds }))
      .catch((e) => { imgPromise = null; throw e; });
  }
  return imgPromise;
}

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-08/500m/';
const TILE = 512, ZMIN = 3, ZMAX = 7;
const spanOf = (z) => 288 / (1 << z); // degrees per tile
const tiles = new Map(); // 'z/r/c' -> Image once loaded, null while loading, false on failure
const tileListeners = new Set();
function wantTile(z, r, c) {
  const key = z + '/' + r + '/' + c;
  if (tiles.has(key)) return tiles.get(key);
  tiles.set(key, null);
  loadImg(GIBS + z + '/' + r + '/' + c + '.jpeg', true)
    .then((img) => { tiles.set(key, img); for (const f of tileListeners) f(); })
    .catch(() => { tiles.set(key, false); });
  return null;
}

const VS = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uCol, uTopo, uWater, uClouds, uDet;
uniform vec2 uSize;      // canvas in device px
uniform float uQ;        // device px per CSS px
uniform vec3 uDisc;      // cx, cy, R in CSS px (y down)
uniform vec2 uRot;       // lambda, phi in radians
uniform float uReady;    // the images are in
uniform float uCloud;    // cloud fade with zoom
uniform float uDetOn;
uniform vec4 uDetBox;    // lon0, lat0 (top), width, height in degrees
out vec4 outColor;

const float PI = 3.14159265;
const vec3 L = normalize(vec3(-0.42, 0.48, 0.77));
const vec3 HV = normalize(L + vec3(0.0, 0.0, 1.0));

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

// Sample with gradients that ignore the wrap seam in u, so no line appears
// where longitude jumps from 180 to -180.
vec4 samp(sampler2D t, vec2 uv, vec2 dx, vec2 dy){ return textureGrad(t, uv, dx, dy); }

void main(){
  vec2 s = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y) / uQ; // CSS px, y down
  float R = uDisc.z;
  vec2 n = (s - uDisc.xy) / R;
  float rr = dot(n, n);

  // Faint stars fixed to the screen, one chance per 56 px cell.
  vec3 bg = vec3(0.0); float ba = 0.0;
  vec2 cell = floor(s / 56.0);
  float h = hash(cell);
  vec2 sp = (cell + vec2(hash(cell + 7.1), hash(cell + 13.7))) * 56.0;
  float big = hash(cell + 41.0) < 0.07 ? 1.3 : 0.7;
  float d = length(s - sp);
  float star = (h < 0.82 ? 1.0 : 0.0) * (1.0 - smoothstep(big - 0.6 / uQ, big + 0.6 / uQ, d)) * (0.18 + hash(cell + 3.0) * 0.7);
  bg = vec3(1.0) * star; ba = star;

  // The blue haze just outside the rim.
  float hr = R * 1.09 + 4.0;
  float dist = length(s - uDisc.xy);
  if (dist > R * 0.98 && dist < hr) {
    float a = 0.55 * (1.0 - (dist - R * 0.98) / (hr - R * 0.98));
    vec3 hc = vec3(120.0, 180.0, 255.0) / 255.0;
    bg = hc * a + bg * (1.0 - a); ba = a + ba * (1.0 - a);
  }

  // Anti-aliased edge of the disc.
  float aa = 1.2 / (R * uQ);
  float edge = 1.0 - smoothstep(1.0 - aa, 1.0, sqrt(rr));
  if (rr > 1.0) { outColor = vec4(bg, ba); return; }

  float nz = sqrt(max(0.0, 1.0 - rr));
  float vy = -n.y;
  vec3 col;
  if (uReady < 0.5) {
    // A plain lit sphere until the images arrive.
    float t = clamp(length(n - vec2(-0.35, -0.4)) / 1.2, 0.0, 1.0);
    col = mix(vec3(0.184, 0.435, 0.69), vec3(0.055, 0.173, 0.333), smoothstep(0.0, 0.7, t));
    col = mix(col, vec3(0.024, 0.078, 0.165), smoothstep(0.7, 1.0, t));
  } else {
    float cl = cos(uRot.y), sl = sin(uRot.y);
    float y2 = vy * cl + nz * sl, z2 = -vy * sl + nz * cl;
    float lat = asin(clamp(y2, -1.0, 1.0));
    float u = (atan(n.x, z2) - uRot.x) / (2.0 * PI) + 0.5; u -= floor(u);
    float v = 0.5 - lat / PI;
    vec2 uv = vec2(u, v);
    vec2 dx = dFdx(uv), dy = dFdy(uv);
    dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5);

    vec3 c = samp(uCol, uv, dx, dy).rgb;
    float water = samp(uWater, uv, dx, dy).r;
    float cloud = samp(uClouds, uv, dx, dy).r;
    float dif = n.x * L.x + vy * L.y + nz * L.z;
    bool hit = false;
    if (uDetOn > 0.5) {
      float lond = u * 360.0 - 180.0, latd = 90.0 - v * 180.0;
      float dl = mod(lond - uDetBox.x, 360.0);
      vec2 tc = vec2(dl / uDetBox.z, (uDetBox.y - latd) / uDetBox.w);
      if (tc.x >= 0.0 && tc.x <= 1.0 && tc.y >= 0.0 && tc.y <= 1.0) {
        vec2 tdx = vec2(dx.x * 360.0 / uDetBox.z, dx.y * 180.0 / uDetBox.w);
        vec2 tdy = vec2(dy.x * 360.0 / uDetBox.z, dy.y * 180.0 / uDetBox.w);
        vec4 dt = textureGrad(uDet, tc, tdx, tdy);
        if (dt.a > 0.99) {
          // The tiles carry their own shaded relief; water read from the tile
          // itself (blue over red), so the glint keeps the coast's edge.
          c = dt.rgb; hit = true;
          water = clamp((c.b - c.r - 18.0 / 255.0) / (40.0 / 255.0), 0.0, 1.0) * (c.b > c.g ? 1.0 : 0.4);
        }
      }
    }
    if (!hit) {
      vec2 tsz = vec2(textureSize(uTopo, 0));
      vec2 o = 1.5 / tsz;
      float h0 = samp(uTopo, uv, dx, dy).r;
      float hx = samp(uTopo, uv + vec2(o.x, 0.0), dx, dy).r;
      float hy = samp(uTopo, uv + vec2(0.0, o.y), dx, dy).r;
      dif += (-(hx - h0) * L.x + (hy - h0) * L.y) * 3.2 * (1.0 - water);
    }
    dif = max(dif, 0.0);
    float lit = 0.42 + 0.58 * pow(dif, 0.7);
    col = c * lit * 1.22;
    float cc = cloud * 0.9 * uCloud;
    col = mix(col, vec3(0.25 + 0.75 * lit), cc);
    float spec = pow(max(0.0, n.x * HV.x + vy * HV.y + nz * HV.z), 70.0) * (120.0 / 255.0) * water * (1.0 - cc);
    col += vec3(spec, spec, spec * 0.95);
  }
  float limb = pow(1.0 - nz, 2.4) * 0.75;
  col += (vec3(110.0, 170.0, 255.0) / 255.0 - col) * limb * vec3(0.55, 0.55, 0.7);
  col = clamp(col, 0.0, 1.0);
  // Disc over stars and haze, premultiplied.
  vec3 o = col * edge + bg * (1.0 - edge);
  float oa = edge + ba * (1.0 - edge);
  outColor = vec4(o, oa);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(e); }
  return s;
}

export default class CarmenSurface {
  constructor(svg) {
    const cv = document.createElement('canvas');
    cv.className = 'cmn-surf';
    cv.setAttribute('aria-hidden', 'true');
    const gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('no webgl2');
    const pr = gl.createProgram();
    gl.attachShader(pr, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const k of ['uCol', 'uTopo', 'uWater', 'uClouds', 'uDet', 'uSize', 'uQ', 'uDisc', 'uRot', 'uReady', 'uCloud', 'uDetOn', 'uDetBox']) this.u[k] = gl.getUniformLocation(pr, k);
    ['uCol', 'uTopo', 'uWater', 'uClouds', 'uDet'].forEach((k, i) => gl.uniform1i(this.u[k], i));
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    // empty textures until the images land
    this.tex = [0, 1, 2, 3, 4].map((i) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      return t;
    });
    this.gl = gl; this.cv = cv; this.ready = false; this.last = null; this.det = null; this.detKey = ''; this.detDirty = false; this.detT = 0; this.raf = 0;
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
    svg.parentNode.insertBefore(cv, svg);
    loadImages().then((I) => {
      if (this.dead || this.lost) return;
      this.upload(0, I.col, true); this.upload(1, I.topo, true); this.upload(2, I.water, true); this.upload(3, I.clouds, true);
      this.ready = true; this.paint();
    }).catch(() => {});
    this.onTile = () => { this.detDirty = true; this.schedule(); };
    tileListeners.add(this.onTile);
  }

  upload(i, img, repeat) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[i]);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat === false ? gl.CLAMP_TO_EDGE : gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  }

  // rot: d3 rotation [lambda, phi]; frame in CSS px.
  draw(vw, vh, rot, cx, cy, r, k = 1) {
    this.last = [vw, vh, rot.slice(), cx, cy, r, k];
    this.lastDraw = performance.now();
    this.paint();
  }

  schedule() {
    if (this.raf || this.dead) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.paint(); });
  }

  // Which detail tiles cover the disc on screen, and the mosaic that holds them.
  detail(vw, vh, rot, cx, cy, R, k, q) {
    const ppd = R * q * Math.PI / 180;
    if (!(ppd > 4096 / 360 * 1.1)) return null;
    let z = ZMIN; while (z < ZMAX && (TILE << z) / 288 < ppd * 0.9) z++;
    const span = spanOf(z), nCols = Math.round(360 / span), nRows = Math.round(180 / span);
    const lam = rot[0] * Math.PI / 180, phi = -rot[1] * Math.PI / 180, cl = Math.cos(phi), sl = Math.sin(phi);
    const x0 = Math.max(0, cx - R), x1 = Math.min(vw, cx + R), y0 = Math.max(0, cy - R), y1 = Math.min(vh, cy + R);
    // the column under the centre of the view anchors the unwrapping
    let ref = null; const pts = [];
    for (let gy = 0; gy <= 12; gy++) for (let gx = 0; gx <= 12; gx++) {
      const sx = x0 + (x1 - x0) * gx / 12, sy = y0 + (y1 - y0) * gy / 12;
      const nx = (sx - cx) / R, ny = (sy - cy) / R, rr = nx * nx + ny * ny; if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr), vy = -ny, y2 = vy * cl + nz * sl, z2 = -vy * sl + nz * cl;
      const latd = Math.asin(Math.max(-1, Math.min(1, y2))) * 180 / Math.PI;
      let lond = (Math.atan2(nx, z2) - lam) * 180 / Math.PI; lond = ((lond + 180) % 360 + 360) % 360 - 180;
      const rw = Math.floor((90 - latd) / span), c = Math.floor((lond + 180) / span);
      pts.push([rw, c]);
      if (gx === 6 && gy === 6) ref = c;
    }
    if (!pts.length) return null;
    if (ref == null) ref = pts[0][1];
    let r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9;
    for (const [rw, c] of pts) {
      let cu = c - ref; cu = ((cu + nCols / 2) % nCols + nCols) % nCols - nCols / 2; cu += ref;
      r0 = Math.min(r0, rw - 1); r1 = Math.max(r1, rw + 1); c0 = Math.min(c0, cu - 1); c1 = Math.max(c1, cu + 1);
    }
    r0 = Math.max(0, r0); r1 = Math.min(nRows - 1, r1);
    const cols = c1 - c0 + 1, rows = r1 - r0 + 1;
    const lim = Math.floor(Math.min(this.maxTex, 8192) / TILE);
    if (cols > lim || rows > lim || cols > nCols) return null;
    for (let rw = r0; rw <= r1; rw++) for (let c = c0; c <= c1; c++) wantTile(z, rw, ((c % nCols) + nCols) % nCols);
    return { z, span, nCols, r0, r1, c0, c1, cols, rows, key: z + ':' + r0 + ':' + r1 + ':' + c0 + ':' + c1 };
  }

  buildMosaic(D) {
    const mc = this.mc || (this.mc = document.createElement('canvas'));
    const W = D.cols * TILE, H = D.rows * TILE;
    if (mc.width !== W || mc.height !== H) { mc.width = W; mc.height = H; }
    const x = mc.getContext('2d');
    x.clearRect(0, 0, W, H);
    let any = false;
    for (let rw = D.r0; rw <= D.r1; rw++) for (let c = D.c0; c <= D.c1; c++) {
      const img = tiles.get(D.z + '/' + rw + '/' + (((c % D.nCols) + D.nCols) % D.nCols));
      if (img) { x.drawImage(img, (c - D.c0) * TILE, (rw - D.r0) * TILE, TILE, TILE); any = true; }
    }
    if (!any) { this.det = null; return; }
    try { this.upload(4, mc, false); } catch (e) { this.det = null; return; }
    this.det = { lon0: D.c0 * D.span - 180, lat0: 90 - D.r0 * D.span, w: D.cols * D.span, h: D.rows * D.span };
  }

  paint() {
    if (!this.last || this.dead || this.lost || !this.cv.isConnected) return;
    const gl = this.gl;
    const [vw, vh, rot, cx, cy, r, k] = this.last;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    // Sharp: the screen's own density, capped at 2 and at about 8 million pixels.
    const q = Math.max(0.5, Math.min(2, dpr, Math.sqrt(8e6 / Math.max(1, vw * vh))));
    const W = Math.max(1, Math.round(vw * q)), H = Math.max(1, Math.round(vh * q));
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
    gl.viewport(0, 0, W, H);

    // Detail tiles: rebuild the mosaic when the patch changes or a tile lands,
    // at most every 250 ms, so a drag never waits on a texture upload.
    let detOn = 0;
    if (this.ready) {
      const D = this.detail(vw, vh, rot, cx, cy, r, k, q);
      if (!D) { this.det = null; this.detKey = ''; }
      else {
        const now = performance.now();
        if ((D.key !== this.detKey || this.detDirty) && now - this.detT > 250) {
          this.detT = now; this.detKey = D.key; this.detDirty = false; this.buildMosaic(D);
        } else if (D.key !== this.detKey || this.detDirty) {
          clearTimeout(this.detTimer); this.detTimer = setTimeout(() => this.schedule(), 260);
        }
        if (this.det) detOn = 1;
      }
    }
    const u = this.u;
    gl.uniform2f(u.uSize, W, H);
    gl.uniform1f(u.uQ, q);
    gl.uniform3f(u.uDisc, cx, cy, r);
    gl.uniform2f(u.uRot, rot[0] * Math.PI / 180, -rot[1] * Math.PI / 180);
    gl.uniform1f(u.uReady, this.ready ? 1 : 0);
    gl.uniform1f(u.uCloud, Math.max(0, Math.min(1, 1 - ((k || 1) - 1.6) / 1.4)));
    gl.uniform1f(u.uDetOn, detOn);
    if (this.det) gl.uniform4f(u.uDetBox, this.det.lon0, this.det.lat0, this.det.w, this.det.h);
    for (let i = 0; i < 5; i++) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[i]); }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.dead = true;
    clearTimeout(this.detTimer);
    if (this.raf) cancelAnimationFrame(this.raf);
    tileListeners.delete(this.onTile);
    this.last = null;
    try { const ext = this.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) {}
    if (this.cv.parentNode) this.cv.parentNode.removeChild(this.cv);
  }
}
