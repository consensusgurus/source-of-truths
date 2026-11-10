// The Carmen globe (owner, 2026-11-08: the Noir look, black water and lime
// land). A small imperative class, not React state: the globe redraws every
// animation frame while it spins or flies, and pushing that through React would
// re-render the whole stage sixty times a second. app/carmen/CarmenBoard.jsx
// owns one instance and calls its methods.
//
// Orthographic projection from d3-geo; borders from public/carmen/world-50m.json
// (Natural Earth via world-atlas, public domain). Interaction is plain pointer
// events: one finger spins, two fingers pinch, a still tap drops the pin, the
// wheel zooms. No dashed or dotted lines anywhere (site rule).
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo';
import CarmenSurface from './carmen-surface';

const NS = 'http://www.w3.org/2000/svg';
export const W = 600;
const R_DEFAULT = 268;
export const NOIR = {
  ocean: '#1e232b', land: '#b9d97c', border: 'rgba(22,24,29,.45)', grat: 'rgba(255,255,255,.05)',
  glow: 'rgba(196,224,138,.35)', shade: 0.62, hi: 0.3, trail: '#ffffff', casing: '#16181d',
  miss: '#d9edae', truth: '#c4e08a', ring: '#ffffff', ringLime: '#c4e08a',
};

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function sample(a, b, t = 1, n = 40) {
  const ip = geoInterpolate(a, b), p = [];
  for (let i = 0; i <= n; i++) p.push(ip((t * i) / n));
  return p;
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export default class CarmenGlobe {
  constructor(svg, world, opts = {}) {
    this.svg = svg;
    this.C = { ...NOIR, ...(opts.colors || {}) };
    this.onTap = opts.onTap || null;
    this.interactive = false;
    this.rot = [-20, -25, 0];
    this.k = 1;
    // The frame: the drawing's own width and height, the globe's centre and
    // radius in it. setFrame() moves the globe (Carmen sits it low in its box,
    // under the clue card, owner 2026-11-08).
    this.vw = W; this.vh = W; this.cx = W / 2; this.cy = W / 2; this.R0 = R_DEFAULT;
    this.proj = geoOrthographic().translate([this.cx, this.cy]).clipAngle(90).precision(0.35);
    this.path = geoPath(this.proj);
    this.cities = [];
    this.trail = [];
    this.flying = null;
    this.miss = null;
    this.guess = null; this.guessAt = 0;
    this.truth = null;
    this.fx = [];
    this.raf = 0; this.idle = false; this.dead = false;
    this.real = opts.real !== false && typeof document !== 'undefined';
    this.build(world);
    if (this.real) { try { this.surf = new CarmenSurface(svg); } catch (e) { this.surf = null; } }
    if (this.real && !this.surf) this.unreal();
    this.bind();
    this.render();
  }

  build(world) {
    const C = this.C, svg = this.svg;
    svg.setAttribute('viewBox', `0 0 ${W} ${W}`);
    const defs = el('defs', {}, svg);
    // THE SPHERE'S LIGHT (owner, 2026-11-09: "if it felt like a globe too,
    // shadings at top corner opposite bottom corner"). Lit from the top left:
    // a soft highlight there, the night side deepening to the bottom right.
    // The focal point sits up and left, so the dark rim is widest opposite it.
    const sg = el('radialGradient', { id: 'cmn-shade', cx: '50%', cy: '50%', r: '50%', fx: '30%', fy: '26%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': C.hi }, sg);
    el('stop', { offset: '30%', 'stop-color': '#fff', 'stop-opacity': C.hi * 0.25 }, sg);
    el('stop', { offset: '55%', 'stop-color': '#000', 'stop-opacity': 0 }, sg);
    el('stop', { offset: '80%', 'stop-color': '#000', 'stop-opacity': C.shade * 0.55 }, sg);
    el('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': C.shade }, sg);
    // A thin lit edge on the top-left limb, so the ball reads round on a dark page too.
    const rg = el('linearGradient', { id: 'cmn-rim', x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 0.55 }, rg);
    el('stop', { offset: '45%', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
    el('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
    const gg = el('radialGradient', { id: 'cmn-glow', cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '86%', 'stop-color': C.glow }, gg);
    el('stop', { offset: '100%', 'stop-color': C.glow, 'stop-opacity': 0 }, gg);
    this.gGlow = el('circle', { cx: W / 2, cy: W / 2, fill: 'url(#cmn-glow)' }, svg);
    this.gSphere = el('path', { fill: C.ocean }, svg);
    this.gGrat = el('path', { fill: 'none', stroke: C.grat, 'stroke-width': 0.8 }, svg);
    this.gLand = el('path', { fill: C.land }, svg);
    this.gBord = el('path', { fill: 'none', stroke: C.border, 'stroke-width': 0.6 }, svg);
    this.gShade = el('circle', { cx: W / 2, cy: W / 2, fill: 'url(#cmn-shade)', 'pointer-events': 'none' }, svg);
    this.gRim = el('circle', { cx: W / 2, cy: W / 2, fill: 'none', stroke: 'url(#cmn-rim)', 'stroke-width': 2, 'pointer-events': 'none' }, svg);
    this.gCase = el('path', { fill: 'none', stroke: C.casing, 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    this.gTrail = el('path', { fill: 'none', stroke: C.trail, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, svg);
    this.gMiss = el('path', { fill: 'none', stroke: C.miss, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, svg);
    this.gOutline = el('path', { fill: 'none', stroke: '#16181d', 'stroke-width': 1 }, svg);
    this.gFx = el('g', {}, svg);
    this.gPins = el('g', {}, svg);
    if (this.real) {
      // The canvas below paints the Earth (true colour, owner 2026-11-10); the
      // SVG keeps the borders, in white over the imagery, and the pins.
      this.gSphere.setAttribute('fill', 'none');
      this.gLand.setAttribute('display', 'none');
      this.gGrat.setAttribute('display', 'none');
      this.gOutline.setAttribute('display', 'none');
      this.gBord.setAttribute('stroke', 'rgba(255,255,255,.45)');
      this.gBord.setAttribute('stroke-width', 0.7);
      this.gShade.setAttribute('display', 'none');
      this.gRim.setAttribute('display', 'none');
      this.gGlow.setAttribute('display', 'none'); // the canvas draws the haze
    }
    this.grat = geoGraticule10();
    this.landGeo = world.land;
    this.bordGeo = world.borders;
  }

  // ---- drawing ------------------------------------------------------------
  visible(ll) { return geoDistance(ll, [-this.rot[0], -this.rot[1]]) < Math.PI / 2 - 0.02; }

  render() {
    if (this.dead) return;
    const now = performance.now();
    const p = this.proj.rotate(this.rot).translate([this.cx, this.cy]).scale(this.R0 * this.k);
    const path = this.path;
    const r = this.R0 * this.k;
    this.gGlow.setAttribute('r', r + 18);
    this.gShade.setAttribute('r', r);
    this.gRim.setAttribute('r', Math.max(1, r - 1.5));
    for (const c of [this.gGlow, this.gShade, this.gRim]) { c.setAttribute('cx', this.cx); c.setAttribute('cy', this.cy); }
    if (this.surf) this.surf.draw(this.vw, this.vh, this.rot, this.cx, this.cy, r, this.k);
    const sphere = path({ type: 'Sphere' });
    this.gSphere.setAttribute('d', sphere);
    this.gOutline.setAttribute('d', sphere);
    if (!this.real) {
      this.gGrat.setAttribute('d', path(this.grat) || '');
      this.gLand.setAttribute('d', path(this.landGeo) || '');
    }
    this.gBord.setAttribute('d', path(this.bordGeo) || '');
    const lines = this.trail.slice();
    if (this.flying) lines.push(sample(this.flying.from, this.flying.to, this.flying.t));
    const td = lines.length ? path({ type: 'MultiLineString', coordinates: lines }) || '' : '';
    this.gTrail.setAttribute('d', td);
    this.gCase.setAttribute('d', td);
    if (this.miss) {
      const t = Math.min(1, (now - this.miss.at) / 600);
      this.gMiss.setAttribute('d', path({ type: 'LineString', coordinates: sample(this.miss.a, this.miss.b, easeOut(t)) }) || '');
    } else this.gMiss.setAttribute('d', '');

    // rings
    this.fx = this.fx.filter((f) => now - f.at < f.dur);
    while (this.gFx.firstChild) this.gFx.removeChild(this.gFx.firstChild);
    for (const f of this.fx) {
      if (now < f.at || !this.visible(f.ll)) continue;
      const [x, y] = p(f.ll), t = (now - f.at) / f.dur;
      el('circle', { cx: x, cy: y, r: f.r0 + (f.r1 - f.r0) * easeOut(t), fill: 'none', stroke: f.color, 'stroke-width': f.w * (1 - t) + 0.5, opacity: 1 - t }, this.gFx);
    }

    // pins
    while (this.gPins.firstChild) this.gPins.removeChild(this.gPins.firstChild);
    const pin = (ll, kind) => {
      if (!this.visible(ll)) return;
      const [x, y] = p(ll);
      let s = 1, dy = 0;
      if (kind === 'guess') {
        const t = Math.min(1, (now - this.guessAt) / 380);
        s = 0.4 + 0.6 * easeOut(t); dy = -26 * (1 - easeOut(t));
      }
      const g = el('g', { transform: `translate(${x},${y + dy}) scale(${s})` }, this.gPins);
      if (kind === 'city') el('circle', { r: 5, fill: '#fff', stroke: '#16181d', 'stroke-width': 2 }, g);
      if (kind === 'guess') { el('circle', { r: 14, fill: 'rgba(255,255,255,.18)' }, g); el('circle', { r: 7, fill: '#fff', stroke: '#16181d', 'stroke-width': 2.5 }, g); }
      if (kind === 'truth') {
        const pu = 1 + 0.18 * Math.sin(now / 220);
        el('circle', { r: 17 * pu, fill: 'rgba(196,224,138,.5)' }, g);
        el('circle', { r: 8, fill: this.C.truth, stroke: '#16181d', 'stroke-width': 2 }, g);
      }
    };
    for (const c of this.cities) pin(c, 'city');
    if (this.guess) pin(this.guess, 'guess');
    if (this.truth && !this.flying) pin(this.truth, 'truth');
    if (this.flying) {
      const f = this.flying, ip = geoInterpolate(f.from, f.to), at = ip(f.t);
      if (this.visible(at)) {
        const [x, y] = p(at), [ax, ay] = p(ip(Math.max(0, f.t - 0.01)));
        const g = el('g', { transform: `translate(${x},${y})` }, this.gPins);
        el('circle', { r: 15, fill: '#fff', stroke: '#16181d', 'stroke-width': 1.2 }, g);
        el('path', { d: 'M10 0 L-6 -7 L-3 0 L-6 7 Z', fill: '#16181d', transform: `rotate(${Math.atan2(y - ay, x - ax) * 180 / Math.PI})` }, g);
      }
    }
  }

  // One loop serves the idle spin, rings, the pin drop, the miss line and the
  // truth pulse; it stops itself when nothing moves.
  tick() {
    if (this.raf || this.dead) return;
    const step = () => {
      this.raf = 0;
      if (this.dead) return;
      const now = performance.now();
      if (this.idle) this.rot[0] += 0.12;
      this.render();
      const busy = this.idle || this.fx.length || this.truth || (this.guess && now - this.guessAt < 500) || (this.miss && now - this.miss.at < 700) || this.anim;
      if (busy) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  // ---- state setters --------------------------------------------------------
  setIdle(on) { this.idle = !!on; this.tick(); }
  setInteractive(on) { this.interactive = !!on; }
  setCities(list) { this.cities = list || []; this.render(); }
  setTrail(pairs) { this.trail = (pairs || []).map(([a, b]) => sample(a, b)); this.render(); }
  setGuess(ll, animate) { this.guess = ll || null; this.guessAt = animate ? performance.now() : 0; if (ll && animate) this.ring(ll, this.C.ring, 34, 500, 2, 260); this.tick(); this.render(); }
  setTruth(ll) { this.truth = ll || null; this.tick(); this.render(); }
  setMiss(a, b, animate) { this.miss = a && b ? { a, b, at: animate ? performance.now() : 0 } : null; this.tick(); this.render(); }
  ring(ll, color, r1 = 70, dur = 900, w = 3, delay = 0) {
    this.fx.push({ ll, color: color || this.C.ring, r0: 4, r1, dur, w, at: performance.now() + delay });
    this.tick();
  }
  // The drawing's size in CSS pixels and where the globe sits in it.
  setFrame(w, h, cx, cy, r) {
    if (!(w > 0 && h > 0 && r > 0)) return;
    this.vw = w; this.vh = h; this.cx = cx; this.cy = cy; this.R0 = r;
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.render();
  }
  view(ll, k) { this.rot = [-ll[0], -ll[1], 0]; this.k = k || this.k; this.render(); }

  // ---- camera ---------------------------------------------------------------
  lookAt(ll, nk = 1, dur = 900) {
    return new Promise((res) => {
      const r0 = this.rot.slice(), k0 = this.k;
      let dl = -ll[0] - r0[0]; dl = ((dl + 540) % 360) - 180;
      const r1 = [r0[0] + dl, -ll[1], 0];
      const t0 = performance.now();
      this.anim = true;
      const step = () => {
        if (this.dead) return res();
        const t = Math.min(1, (performance.now() - t0) / dur), e = ease(t);
        this.rot = [r0[0] + (r1[0] - r0[0]) * e, r0[1] + (r1[1] - r0[1]) * e, 0];
        this.k = k0 + (nk - k0) * e;
        this.render();
        if (t < 1) requestAnimationFrame(step); else { this.anim = false; this.tick(); res(); }
      };
      requestAnimationFrame(step);
    });
  }

  fly(from, to) {
    return new Promise((res) => {
      const ip = geoInterpolate(from, to), dist = geoDistance(from, to);
      const dur = 1500 + dist * 900, kf = Math.max(1, Math.min(2.2, 1.9 / (dist + 0.6)));
      this.flying = { from, to, t: 0 };
      const s0 = this.rot.slice(), k0 = this.k, t0 = performance.now();
      this.anim = true;
      const step = () => {
        if (this.dead) return res();
        const t = Math.min(1, (performance.now() - t0) / dur), e = ease(t);
        this.flying.t = e;
        const c = ip(e), b = Math.min(1, t / 0.15);
        let dl = -c[0] - s0[0]; dl = ((dl + 540) % 360) - 180;
        this.rot = [s0[0] + dl * b, s0[1] + (-c[1] - s0[1]) * b, 0];
        this.k = k0 + (kf - k0) * Math.min(1, t * 2);
        this.render();
        if (t < 1) requestAnimationFrame(step);
        else { this.trail.push(sample(from, to)); this.flying = null; this.anim = false; this.render(); this.tick(); res(); }
      };
      requestAnimationFrame(step);
    });
  }

  zoomBy(f) {
    const nk = Math.max(1, Math.min(7, this.k * f));
    const k0 = this.k, t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / 260);
      this.k = k0 + (nk - k0) * easeOut(t); this.render();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---- input ----------------------------------------------------------------
  bind() {
    const svg = this.svg;
    const pts = new Map();
    let down = null, pinch = null;
    const toView = (e) => {
      const b = svg.getBoundingClientRect(), s = this.vw / Math.max(1, b.width);
      return [(e.clientX - b.left) * s, (e.clientY - b.top) * s, s];
    };
    this.onDown = (e) => {
      if (!this.interactive) return;
      svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) down = { x: e.clientX, y: e.clientY, t: Date.now(), moved: 0 };
      else { down = null; const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: this.k }; }
    };
    this.onMove = (e) => {
      if (!this.interactive || !pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId);
      const cur = { x: e.clientX, y: e.clientY };
      pts.set(e.pointerId, cur);
      if (pts.size >= 2 && pinch) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.k = Math.max(1, Math.min(7, pinch.k * (d / Math.max(1, pinch.d))));
        this.render();
        return;
      }
      if (pts.size === 1) {
        const [, , s] = toView(e);
        const deg = (180 / (Math.PI * this.R0 * this.k)) * s;
        const dx = cur.x - prev.x, dy = cur.y - prev.y;
        if (down) down.moved += Math.abs(dx) + Math.abs(dy);
        this.rot[0] += dx * deg;
        this.rot[1] = Math.max(-85, Math.min(85, this.rot[1] - dy * deg));
        this.render();
      }
    };
    this.onUp = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (!this.interactive || !down || pts.size) { if (!pts.size) down = null; return; }
      const still = down.moved < 8 && Date.now() - down.t < 500;
      down = null;
      if (!still || !this.onTap) return;
      const [x, y] = toView(e);
      if (Math.hypot(x - this.cx, y - this.cy) > this.R0 * this.k) return;
      const ll = this.proj.invert([x, y]);
      if (ll && Number.isFinite(ll[0]) && Number.isFinite(ll[1])) this.onTap(ll);
    };
    this.onCancel = (e) => { pts.delete(e.pointerId); down = null; pinch = null; };
    this.onWheel = (e) => {
      if (!this.interactive) return;
      e.preventDefault();
      this.k = Math.max(1, Math.min(7, this.k * Math.exp(-e.deltaY * 0.0015)));
      this.render();
    };
    svg.addEventListener('pointerdown', this.onDown);
    svg.addEventListener('pointermove', this.onMove);
    svg.addEventListener('pointerup', this.onUp);
    svg.addEventListener('pointercancel', this.onCancel);
    svg.addEventListener('wheel', this.onWheel, { passive: false });
  }

  // The flat look, if the canvas cannot be made.
  unreal() {
    this.real = false;
    this.gSphere.setAttribute('fill', this.C.ocean);
    this.gLand.removeAttribute('display'); this.gGrat.removeAttribute('display'); this.gOutline.removeAttribute('display');
    this.gBord.setAttribute('stroke', this.C.border); this.gBord.setAttribute('stroke-width', 0.6);
    this.gShade.removeAttribute('display'); this.gRim.removeAttribute('display'); this.gGlow.removeAttribute('display');
  }

  destroy() {
    this.dead = true;
    if (this.surf) { this.surf.destroy(); this.surf = null; }
    if (this.raf) cancelAnimationFrame(this.raf);
    const svg = this.svg;
    svg.removeEventListener('pointerdown', this.onDown);
    svg.removeEventListener('pointermove', this.onMove);
    svg.removeEventListener('pointerup', this.onUp);
    svg.removeEventListener('pointercancel', this.onCancel);
    svg.removeEventListener('wheel', this.onWheel);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }
}

// The land and borders, fetched once per page and shared.
let worldPromise = null;
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = Promise.all([fetch('/carmen/world-50m.json').then((r) => r.json()), import('topojson-client')])
      .then(([topo, tj]) => ({
        land: tj.feature(topo, topo.objects.countries),
        borders: tj.mesh(topo, topo.objects.countries, (a, b) => a !== b),
      }))
      .catch((e) => { worldPromise = null; throw e; });
  }
  return worldPromise;
}
