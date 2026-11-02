// The drawing kit Topple and Roll share: one look for the two rolling dailies
// (owner, 2026-11-02: "can we greatly improve the visuals of roll and topple?").
//
// THE LOOK. Mind Loft's own language, carried onto a canvas: pale tiles and a
// pastel piece, every shape edged in the stage ink, the way the site's buttons
// and cards are. The piece (Topple's block, Roll's die) wears the category
// pastel, the floor stays white or grey (owner, 2026-10-26: no colour behind
// the play itself), and the category colour returns on the squares that matter
// (cracked tiles, the spring pad, lit squares).
//
// WHY THE PIECE IS NOT JUST --stg-acc. On the light register the stage sets
// --stg-acc to the INK and --stg-onramp to the category pastel; on the dark one
// it is the other way round. Painting the piece with --stg-acc made the block
// and the die navy on the light register, with no category colour on the board
// at all. So both are read and the LIGHTER one is the body, the darker one the
// outline and the pips. That holds on both registers and in the black-and-white
// colour mode (white piece, black line).
//
// Nothing here is dashed or dotted (owner, 2026-10-25).

const PROBE = {
  ground: 'var(--stg-ground, #0b0f1a)',
  ink: 'var(--stg-ink, #e9edf4)',
  acc: 'var(--stg-acc, #fb7185)',
  on: 'var(--stg-onramp, #08222e)',
  mute: 'var(--stg-mute, #8b95a8)',
};

const parse = (s) => {
  const m = String(s).match(/[\d.]+/g);
  if (!m || m.length < 3) return [0, 0, 0];
  return m.slice(0, 3).map(Number);
};
const lum = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const css = (c, al = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${al})`;
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// Resolve the stage tokens through a hidden probe (a custom property alone
// hands back unresolved color-mix text a canvas cannot paint) and derive the
// whole palette from five colours.
export function readPalette(el) {
  const raw = {};
  for (const [k, v] of Object.entries(PROBE)) { el.style.color = v; raw[k] = parse(getComputedStyle(el).color); }
  const dark = lum(raw.ground) < 0.45;
  let body = lum(raw.acc) >= lum(raw.on) ? raw.acc : raw.on;
  let line = body === raw.acc ? raw.on : raw.acc;
  if (Math.abs(lum(body) - lum(line)) < 0.25) { body = dark ? raw.ink : WHITE; line = dark ? raw.ground : raw.ink; }
  const ink = raw.ink;
  const P = { dark, ink, line, body, mute: raw.mute, ground: raw.ground };
  if (dark) {
    P.tileTop = mix(raw.ground, ink, 0.2);
    P.tileFront = mix(raw.ground, ink, 0.1);
    P.tileSide = mix(raw.ground, ink, 0.07);
    P.tileLine = BLACK; P.tileLineA = 0.62;
    P.tileHi = 0.1;
    P.frag = mix(raw.ground, body, 0.5);
    P.next = mix(P.tileTop, body, 0.32);
    P.shadowA = 0.55;
    P.dust = mix(ink, raw.ground, 0.25);
  } else {
    P.tileTop = WHITE;
    P.tileFront = mix(WHITE, ink, 0.13);
    P.tileSide = mix(WHITE, ink, 0.2);
    P.tileLine = ink; P.tileLineA = 0.5;
    P.tileHi = 0.9;
    P.frag = mix(WHITE, body, 0.62);
    P.next = mix(WHITE, body, 0.3);
    P.shadowA = 0.2;
    P.dust = mix(ink, WHITE, 0.55);
  }
  P.bodyTop = mix(body, WHITE, dark ? 0.12 : 0.28);
  P.bodySide = mix(body, line, 0.16);
  P.bodyFront = mix(body, line, 0.06);
  return P;
}

export function quad(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// A rounded quad: each corner cut by an arc, for faces that are parallelograms
// on screen (a lean makes the sides slant), so roundRect will not do.
export function roundQuad(ctx, pts, r) {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const d1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const a = [p1[0] + (p0[0] - p1[0]) * rr / (d1 || 1), p1[1] + (p0[1] - p1[1]) * rr / (d1 || 1)];
    const b = [p1[0] + (p2[0] - p1[0]) * rr / (d2 || 1), p1[1] + (p2[1] - p1[1]) * rr / (d2 || 1)];
    if (i === 0) ctx.moveTo(a[0], a[1]); else ctx.lineTo(a[0], a[1]);
    ctx.quadraticCurveTo(p1[0], p1[1], b[0], b[1]);
  }
  ctx.closePath();
}

// Shrink a screen quad toward its centre: the inner panel of a bevelled face.
export function inset(pts, k) {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
}

// One floor slab: the right side (only when the view leans), the front, then
// the top with a soft bevel. x0..x1, y0..y1 in board units, z the top.
export function slab(ctx, pr, C, x0, y0, x1, y1, z, th, top, opts = {}) {
  const lw = opts.lw || 1.4;
  const edge = css(C.tileLine, C.tileLineA);
  const front = opts.front || C.tileFront, side = opts.side || C.tileSide;
  const lean = pr(0, 0, 1)[0] !== pr(0, 0, 0)[0];
  if (lean) {
    const s = [pr(x1, y0, z), pr(x1, y1, z), pr(x1, y1, z - th), pr(x1, y0, z - th)];
    quad(ctx, s); ctx.fillStyle = css(side); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke();
  }
  const f = [pr(x0, y1, z), pr(x1, y1, z), pr(x1, y1, z - th), pr(x0, y1, z - th)];
  quad(ctx, f); ctx.fillStyle = css(front); ctx.fill();
  const gr = ctx.createLinearGradient(0, f[0][1], 0, f[2][1]);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${C.dark ? 0.25 : 0.1})`);
  ctx.fillStyle = gr; ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke();
  const t = [pr(x0, y0, z), pr(x1, y0, z), pr(x1, y1, z), pr(x0, y1, z)];
  roundQuad(ctx, t, opts.r == null ? 3 : opts.r);
  ctx.fillStyle = css(top); ctx.fill();
  if (opts.glow) { ctx.fillStyle = opts.glow; ctx.fill(); }
  // a sheen from the back edge, and a lit lip along it
  const g2 = ctx.createLinearGradient(0, t[0][1], 0, t[3][1]);
  g2.addColorStop(0, C.dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.5)');
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g2; ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke();
  if (C.dark) {
    ctx.strokeStyle = `rgba(255,255,255,${C.tileHi})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(t[0][0] + 3, t[0][1] + 1.2); ctx.lineTo(t[1][0] - 3, t[1][1] + 1.2); ctx.stroke();
  }
  return t;
}

// Cracks drawn on a top face, the same pattern every time so a cracked square
// is known by its marks and never by its colour alone.
export function cracks(ctx, pr, x, y, z, color, lw = 1.6) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const m = (a, b) => ctx.moveTo(...pr(x + a, y + b, z));
  const l = (a, b) => ctx.lineTo(...pr(x + a, y + b, z));
  m(0.14, 0.22); l(0.36, 0.4); l(0.33, 0.58); l(0.47, 0.86);
  m(0.36, 0.4); l(0.6, 0.34); l(0.86, 0.47);
  m(0.6, 0.34); l(0.66, 0.14);
  m(0.33, 0.58); l(0.18, 0.7);
  m(0.6, 0.34); l(0.64, 0.6); l(0.8, 0.78);
  ctx.stroke();
}

// A soft contact shadow under a piece: a blurred footprint on the floor that
// thins as the piece rises. No ctx.filter (Safari ignores it on canvas).
export function contact(ctx, pr, C, x0, y0, x1, y1, lift) {
  const a = Math.max(0, (C.dark ? 0.55 : 0.3) * (1 - lift * 0.9));
  if (a <= 0.01) return;
  const grow = 0.04 + lift * 0.18;
  for (const [g, al] of [[grow + 0.1, 0.25], [grow + 0.04, 0.45], [grow - 0.02, 0.7]]) {
    const q = [pr(x0 - g, y0 - g * 0.4, 0), pr(x1 + g, y0 - g * 0.4, 0), pr(x1 + g, y1 + g, 0), pr(x0 - g, y1 + g, 0)];
    roundQuad(ctx, q, 8);
    ctx.fillStyle = `rgba(0,0,0,${(a * al).toFixed(3)})`; ctx.fill();
  }
}

// A face of the piece: fill, a lighter inner panel for the bevel, the ink edge.
export function face(ctx, pts, fill, panel, line, lw = 2) {
  roundQuad(ctx, pts, 3.5);
  ctx.fillStyle = css(fill); ctx.fill();
  if (panel) {
    roundQuad(ctx, inset(pts, 0.8), 5);
    ctx.fillStyle = panel; ctx.fill();
  }
  roundQuad(ctx, pts, 3.5);
  ctx.strokeStyle = css(line); ctx.lineWidth = lw; ctx.stroke();
}

// PARTICLES: dust when a piece lands, shards when a square gives way, a ring
// when a square lights, confetti on a win. Screen space, in canvas units.
export class Fx {
  constructor() { this.list = []; }
  clear() { this.list = []; }
  busy(now) { this.list = this.list.filter((p) => now - p.t0 < p.life); return this.list.length > 0; }
  dust(now, pts, color, n = 3) {
    for (const [x, y] of pts) for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI;
      const s = 0.02 + Math.random() * 0.03;
      this.list.push({ kind: 'dust', t0: now, life: 420 + Math.random() * 160, x, y, vx: Math.cos(a) * s * 1.6, vy: Math.sin(a) * s * 0.55, r0: 1.4 + Math.random() * 1.6, color });
    }
  }
  ring(now, pts, color, life = 620) { this.list.push({ kind: 'ring', t0: now, life, pts, color }); }
  shard(now, pts, fill, line, vx, vy, vr, delay = 0) {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    this.list.push({ kind: 'shard', t0: now + delay, life: 760 + delay, pts: pts.map((p) => [p[0] - cx, p[1] - cy]), cx, cy, vx, vy, vr, fill, line });
  }
  confetti(now, x, y, colors, n = 34, spread = 1) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95 * spread;
      const s = 0.22 + Math.random() * 0.32;
      this.list.push({ kind: 'bit', t0: now, life: 1300 + Math.random() * 500, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.02, w: 5 + Math.random() * 4, h: 3 + Math.random() * 3, color: colors[i % colors.length] });
    }
  }
  draw(ctx, now, line) {
    for (const p of this.list) {
      const t = now - p.t0;
      if (t < 0) continue;
      const k = t / p.life;
      if (p.kind === 'dust') {
        const e = 1 - Math.pow(1 - Math.min(1, t / 360), 2);
        ctx.globalAlpha = Math.max(0, 0.38 * (1 - k));
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x + p.vx * 360 * e, p.y + p.vy * 360 * e, p.r0 + 2.5 * e, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === 'ring') {
        const e = 1 - Math.pow(1 - k, 3);
        ctx.globalAlpha = Math.max(0, 0.85 * (1 - k));
        roundQuad(ctx, inset(p.pts, 1 + e * 0.55), 6);
        ctx.strokeStyle = p.color; ctx.lineWidth = 6 * (1 - k) + 1; ctx.stroke();
      } else if (p.kind === 'shard') {
        const tt = t;
        const x = p.cx + p.vx * tt, y = p.cy + p.vy * tt + 0.0011 * tt * tt;
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(k, 2));
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.vr * tt);
        quad(ctx, p.pts); ctx.fillStyle = p.fill; ctx.fill();
        ctx.strokeStyle = p.line; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.restore();
      } else if (p.kind === 'bit') {
        const x = p.x + p.vx * t, y = p.y + p.vy * t + 0.00042 * t * t;
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(k, 3));
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + p.vr * t);
        ctx.scale(1, Math.cos(t * 0.012 + p.rot));
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        if (line) { ctx.strokeStyle = line; ctx.lineWidth = 0.8; ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
}

export const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
