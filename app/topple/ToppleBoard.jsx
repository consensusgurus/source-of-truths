'use client';

// Topple's board: the floor and the block, drawn on a canvas in a three-quarter
// view where UP ON THE SCREEN IS UP ON THE BOARD. An isometric view (the
// original game's) makes the arrow keys point along diagonals, and the owner's
// first report on the mockup was that the block "does not move as it should";
// here Up rolls it up the screen, Left rolls it left, and a swipe goes the way
// it looks.
//
// Every colour is a stage token, read off the page at draw time, so the board
// follows the light switch and wears its category: the block is the Logic
// accent, the floor is the stage ink mixed into the ground, and the fragile
// tiles are the same category colour held well below the block's strength, with
// cracks drawn on them so they never rely on colour alone (owner, 2026-10-20:
// the cracked squares and the rolls bar match the category colour).
//
// The roll is a real quarter turn about the block's leading bottom edge
// (drawBlock), so a standing block tips flat and a flat one stands up, the way
// a domino does. A fall drops it and fades it. A win lands it on the SPRING
// (owner, 2026-10-19, in place of the original's hole): the pad squashes under
// it and fires it off the top of the board. A one-tile spring takes the block
// standing; a two-tile spring takes it lying flat across both tiles.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Lightbulb, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { onSpring } from '@/lib/topple-engine';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const TW = 44;            // one square, left to right
const TH = 30;            // one square, top to bottom (depth is foreshortened)
const KX = 0;             // no sideways lean: a slanted view made a standing block look
                          // like it stood off its own tile (looked at, 2026-10-19)
const TZ = 26;            // how far one unit of height rises
const SLAB = 0.34;        // tile thickness, in block units
const GAP = 0.045;        // the seam between two tiles, so the floor reads as tiles
const PAD_UP = 0.62;      // a spring pad at rest stands this far proud of the floor, coil showing
const PAD_DOWN = 0.1;     // and sinks to here under the block
const PAD = 14;
const ROLL_MS = 190;
const DROP_MS = 520;
const LAUNCH_MS = 900;

const VIEW = (() => { const v = [KX / TW, TZ / TH, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const LIGHT = (() => { const v = [-0.35, -0.55, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];

const TOKENS = {
  ground: 'var(--stg-ground, #0b0f1a)',
  tile: 'color-mix(in srgb, var(--stg-ink, #e9edf4) 24%, var(--stg-ground, #0b0f1a))',
  tileEdge: 'color-mix(in srgb, var(--stg-ink, #e9edf4) 40%, var(--stg-ground, #0b0f1a))',
  // the category colour, held well below the block's full strength so the two never read as one
  frag: 'color-mix(in srgb, var(--stg-acc, #bef264) 42%, var(--stg-ground, #0b0f1a))',
  block: 'var(--stg-acc, #bef264)',
  pad: 'color-mix(in srgb, var(--stg-acc, #bef264) 40%, var(--stg-ground, #0b0f1a))',
  mark: 'var(--stg-acc-ink, var(--stg-acc, #bef264))',
  metal: 'color-mix(in srgb, var(--stg-ink, #e9edf4) 72%, var(--stg-ground, #0b0f1a))',
  socket: 'color-mix(in srgb, var(--stg-ink, #e9edf4) 10%, var(--stg-ground, #0b0f1a))',
};

const CSS = `
.tp{font-family:${SANS};}
.tp-meter{max-width:620px;margin:0 auto 14px;}
.tp-mhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.tp-mhead b{font-weight:800;color:var(--stg-ink,#e9edf4);}
.tp-mhead .tp-mv{font-size:16px;color:var(--stg-acc-ink,var(--stg-acc));}
.tp-mtrack{position:relative;height:10px;border-radius:3px;background:var(--stg-line2,rgba(255,255,255,.17));margin-top:8px;}
.tp-mfill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width .18s ease-out;}
.tp-mtick{position:absolute;top:-4px;width:2px;height:18px;}
.tp-mlabs{position:relative;height:14px;margin-top:3px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
.tp-mlabs span{position:absolute;white-space:nowrap;}
.tp-panel{max-width:620px;margin:0 auto;background:var(--stg-surf,rgba(255,255,255,.045));border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:20px;padding:18px 16px 14px;}
.tp-canvas{display:block;width:100%;height:auto;margin:0 auto;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.tp-canvas.shake{animation:tpshake .34s ease;}
@keyframes tpshake{0%,100%{transform:translateX(0);}22%{transform:translateX(-6px);}55%{transform:translateX(6px);}80%{transform:translateX(-3px);}}
.tp-probe{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;}
.tp-row{display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:12px;border-top:1px solid var(--stg-line,rgba(255,255,255,.11));flex-wrap:wrap;}
.tp-say{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:3px;}
.tp-say1{font-size:15px;font-weight:700;line-height:1.4;color:var(--stg-ink,#e9edf4);}
.tp-say2{font-size:12px;font-weight:600;line-height:1.45;color:var(--stg-mute,#8b95a8);}
.tp-pad{display:grid;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(3,44px);gap:5px;flex:0 0 auto;}
.tp-key{font-family:${SANS};border:1.5px solid var(--stg-mute2,#78859d);background:transparent;color:var(--stg-ink,#e9edf4);border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
.tp-key:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.tp-key:active:not(:disabled){background:var(--stg-acc);color:var(--stg-onramp,#08222e);border-color:var(--stg-acc);}
.tp-key.hint{border:3px double var(--stg-acc-ink,var(--stg-acc));box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-acc,#bef264) 40%, transparent);}
.tp-key:disabled{opacity:.4;cursor:default;}
.tp-acts{display:flex;gap:8px;flex-wrap:wrap;}
.tp-btn{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2,#aab5c7);border:1.5px solid var(--stg-mute2,#78859d);border-radius:12px;padding:0 16px;min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;}
.tp-btn:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.tp-btn:disabled{opacity:.45;cursor:default;}
.tp-btn.hint{border-color:var(--stg-acc-ink,var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.tp-foot{max-width:620px;margin:10px auto 0;display:flex;justify-content:space-between;align-items:center;gap:12px;}
.tp-rule{font-size:12px;font-weight:600;color:var(--stg-mute,#8b95a8);line-height:1.45;}
.tp-giveup{min-height:44px;background:none;border:none;cursor:pointer;font-family:${SANS};font-weight:700;font-size:12.5px;text-decoration:underline;text-underline-offset:3px;display:inline-flex;align-items:center;gap:5px;padding:0 4px;flex:0 0 auto;}
.tp-key:focus-visible,.tp-btn:focus-visible,.tp-giveup:focus-visible{outline:2px solid var(--stg-acc-ink,var(--stg-acc));outline-offset:2px;}
@media(max-width:560px){
  .tp-panel{background:transparent;border:0;border-radius:0;padding:2px 0 0;}
  .tp-row{border-top:0;justify-content:center;}
  .tp-say{flex-basis:100%;text-align:center;}
  .tp-pad{grid-template-columns:repeat(3,58px);grid-template-rows:repeat(3,50px);}
  .tp-acts{flex-direction:column;}
  .tp-rule{display:none;}
  .tp-foot{justify-content:flex-end;margin-top:4px;}
}
`;

function boxOf(b) {
  if (b.o === 'S') return [b.x, b.y, b.x + 1, b.y + 1, 2];
  if (b.o === 'H') return [b.x, b.y, b.x + 2, b.y + 1, 1];
  return [b.x, b.y, b.x + 1, b.y + 2, 1];
}
// Rolls so far against perfect and par, the Parker meter in Topple's words.
function RollMeter({ used, par, perfect }) {
  const max = Math.max(par + (par - perfect), used, par + 1);
  const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100));
  const over = used > par;
  return (
    <div className="tp-meter" role="meter" aria-label="Rolls" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used}>
      <div className="tp-mhead">
        <span>Rolls <b className="tp-mv">{used}</b></span>
        <span>Perfect <b>{perfect}</b> &middot; Par <b>{par}</b></span>
      </div>
      <div className="tp-mtrack">
        <div className="tp-mfill" style={{ width: `${pct(used)}%`, background: 'var(--stg-acc-ink, var(--stg-acc))', opacity: over ? 0.7 : 1 }} />
        <span className="tp-mtick" style={{ left: `calc(${pct(perfect)}% - 1px)`, background: 'var(--stg-ink, #e9edf4)' }} />
        <span className="tp-mtick" style={{ left: `calc(${pct(par)}% - 1px)`, background: 'var(--stg-mute, #8b95a8)' }} />
      </div>
      <div className="tp-mlabs">
        <span style={{ right: `calc(${100 - pct(perfect)}% + 5px)`, color: 'var(--stg-ink, #e9edf4)' }}>Perfect</span>
        <span style={{ left: `calc(${pct(par)}% + 5px)`, color: 'var(--stg-mute, #8b95a8)' }}>Par</span>
      </div>
    </div>
  );
}

function cellsOfBlock(b) {
  if (b.o === 'S') return [[b.x, b.y]];
  if (b.o === 'H') return [[b.x, b.y], [b.x + 1, b.y]];
  return [[b.x, b.y], [b.x, b.y + 1]];
}
// Is a resolved rgb() colour dark? Decides the shadow strength per register.
function isDark(rgb) {
  const m = String(rgb).match(/[\d.]+/g);
  if (!m || m.length < 3) return true;
  const [r, g, b] = m.slice(0, 3).map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function ToppleBoard({
  P, block, anim, onAnimEnd, playing, used, par, perfect, falls,
  onMove, onRestart, hintAvail, onHint, hintDir, armed, onGiveUp, doneLine, shake, themeKey, launched,
}) {
  const cvRef = useRef(null);
  const probeRef = useRef(null);
  const colors = useRef(null);
  const frame = useRef(null);
  const [, force] = useState(0);

  const W = P.w * TW + KX * 2 + PAD * 2 + 6;
  const H = P.h * TH + TZ * 2.6 + SLAB * TZ + PAD * 2 + 16;
  const OX = PAD + KX * 2 + 2;
  const OY = PAD + TZ * 2.6;
  const pr = useCallback((x, y, z) => [OX + x * TW - z * KX, OY + y * TH - z * TZ], [OX, OY]);

  // Resolve every token to a real colour by letting the browser compute it on
  // a hidden probe (a custom property alone would hand back the unresolved
  // color-mix text, which a canvas cannot paint).
  const readColors = useCallback(() => {
    const el = probeRef.current;
    if (!el) return;
    const out = {};
    for (const [k, v] of Object.entries(TOKENS)) { el.style.color = v; out[k] = getComputedStyle(el).color; }
    colors.current = out;
  }, []);

  const draw = useCallback((now) => {
    const cv = cvRef.current;
    if (!cv || !colors.current) return;
    const C = colors.current;
    const dark = isDark(C.ground);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = (pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
    const poly = (pts, fill, shade, stroke, sw) => {
      path(pts);
      ctx.fillStyle = fill; ctx.fill();
      if (shade > 0) { ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fill(); }
      if (shade < 0) { ctx.fillStyle = `rgba(255,255,255,${-shade})`; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1; ctx.stroke(); }
    };
    // a soft vertical sheen over a shape already on the path
    const sheen = (y0, y1, top, bottom) => {
      const gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, top); gr.addColorStop(1, bottom);
      ctx.fillStyle = gr; ctx.fill();
    };

    // the animation's phase
    let a = null;
    if (anim) {
      const t = (now - anim.t0);
      if (t < ROLL_MS) a = { phase: 'roll', k: ease(t / ROLL_MS) };
      else if (anim.result === 'fall' || anim.result === 'crack') a = { phase: 'drop', k: Math.min(1, (t - ROLL_MS) / DROP_MS) };
      else if (anim.result === 'win') a = { phase: 'launch', k: Math.min(1, (t - ROLL_MS) / LAUNCH_MS) };
      else a = { phase: 'done' };
    }

    // How high each spring pad stands: up at rest, down under the block,
    // easing between the two as the block rolls on or off, and on a win
    // squashing flat and then snapping up as it fires.
    const footKeys = (b) => (b ? cellsOfBlock(b).map(([x, y]) => `${x},${y}`) : []);
    const fromFoot = anim ? footKeys(anim.from) : [];
    const toFoot = anim ? footKeys(anim.to) : footKeys(block);
    const restFoot = footKeys(block);
    const padLift = (key) => {
      if (a && a.phase === 'launch' && toFoot.includes(key)) {
        const k = a.k;
        return k < 0.22 ? PAD_DOWN - (k / 0.22) * PAD_DOWN : Math.min(1.1, ((k - 0.22) / 0.1) * 1.1);
      }
      if (!anim && launched) return PAD_UP;
      if (a && a.phase === 'roll') {
        const f = fromFoot.includes(key) ? PAD_DOWN : PAD_UP, t2 = toFoot.includes(key) ? PAD_DOWN : PAD_UP;
        return f + (t2 - f) * a.k;
      }
      if (a && a.phase === 'drop') return PAD_UP;
      return restFoot.includes(key) && !launched ? PAD_DOWN : PAD_UP;
    };
    const onSpringCells = (keys) => keys.some((k) => { const [x, y] = k.split(',').map(Number); return P.grid[y] && P.grid[y][x] === 'G'; });

    // 1. one soft shadow under the whole floor, so the board sits on the page
    ctx.save();
    ctx.shadowColor = dark ? 'rgba(0,0,0,.55)' : 'rgba(20,30,50,.22)';
    ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.ground;
    ctx.beginPath();
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (P.grid[y][x] === '.') continue;
      const p0 = pr(x + GAP, y + GAP, 0), p1 = pr(x + 1 - GAP, y + 1 - GAP, -SLAB);
      ctx.rect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]);
    }
    ctx.fill();
    ctx.restore();

    // 2. the tiles, back row first
    const cracked = a && anim.result === 'crack' && a.phase === 'drop' ? `${anim.to.x},${anim.to.y}` : null;
    const tile = (x, y, top, z = 0, opts = {}) => {
      const g = GAP;
      // front face, darker toward the bottom
      const f = [pr(x + g, y + 1 - g, z), pr(x + 1 - g, y + 1 - g, z), pr(x + 1 - g, y + 1 - g, z - SLAB), pr(x + g, y + 1 - g, z - SLAB)];
      poly(f, top, 0.34);
      sheen(f[0][1], f[2][1], 'rgba(0,0,0,0)', 'rgba(0,0,0,.22)');
      // top face with a light sheen from the back edge and a bevel highlight
      const t = [pr(x + g, y + g, z), pr(x + 1 - g, y + g, z), pr(x + 1 - g, y + 1 - g, z), pr(x + g, y + 1 - g, z)];
      poly(t, top, 0);
      sheen(t[0][1], t[3][1], dark ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.35)', 'rgba(255,255,255,0)');
      ctx.strokeStyle = dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t[0][0] + 1, t[0][1] + 0.5); ctx.lineTo(t[1][0] - 1, t[1][1] + 0.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.moveTo(t[3][0], t[3][1]); ctx.lineTo(t[2][0], t[2][1]); ctx.stroke();
      if (opts.cracks) {
        ctx.strokeStyle = dark ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.42)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(...pr(x + 0.18, y + 0.28, z)); ctx.lineTo(...pr(x + 0.42, y + 0.46, z)); ctx.lineTo(...pr(x + 0.38, y + 0.62, z)); ctx.lineTo(...pr(x + 0.5, y + 0.84, z));
        ctx.moveTo(...pr(x + 0.42, y + 0.46, z)); ctx.lineTo(...pr(x + 0.66, y + 0.38, z)); ctx.lineTo(...pr(x + 0.84, y + 0.5, z));
        ctx.moveTo(...pr(x + 0.66, y + 0.38, z)); ctx.lineTo(...pr(x + 0.7, y + 0.18, z));
        ctx.stroke();
      }
    };

    // THE SPRING: a sunken socket, a metal coil, and a pad on top marked with an
    // X. The coil is a real helix, its back half drawn behind and dimmer, so it
    // reads as a spring from straight on.
    const spring = (x, y, lift) => {
      tile(x, y, C.socket);
      const cx = x + 0.5, cy = y + 0.5, rx = 0.3, ry = 0.24;
      const turns = 4, steps = turns * 28;
      const zTop = Math.max(0.02, lift - 0.06);
      const pt = (i) => { const t = (i / steps) * turns * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t), 0.02 + (zTop - 0.02) * (i / steps), Math.sin(t)]; };
      const coil = (front) => {
        ctx.strokeStyle = C.metal; ctx.lineWidth = front ? 2.4 : 2;
        ctx.globalAlpha = front ? 1 : 0.45;
        for (let i = 0; i < steps; i++) {
          const p = pt(i), q = pt(i + 1);
          if ((p[3] >= 0) !== front) continue;
          ctx.beginPath(); ctx.moveTo(...pr(p[0], p[1], p[2])); ctx.lineTo(...pr(q[0], q[1], q[2])); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      coil(false);
      // the pad: a plate a little inside the tile, edged, with an X on it
      const m = 0.13, th = 0.09, z1 = lift, z0 = lift - th;
      const front = [pr(x + m, y + 1 - m, z1), pr(x + 1 - m, y + 1 - m, z1), pr(x + 1 - m, y + 1 - m, z0), pr(x + m, y + 1 - m, z0)];
      coil(true);
      poly(front, C.pad, 0.35);
      const top = [pr(x + m, y + m, z1), pr(x + 1 - m, y + m, z1), pr(x + 1 - m, y + 1 - m, z1), pr(x + m, y + 1 - m, z1)];
      poly(top, C.pad, 0, C.mark, 1.6);
      sheen(top[0][1], top[3][1], 'rgba(255,255,255,.18)', 'rgba(255,255,255,0)');
      const i = 0.27;
      ctx.strokeStyle = C.mark; ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(...pr(x + i, y + i, z1)); ctx.lineTo(...pr(x + 1 - i, y + 1 - i, z1));
      ctx.moveTo(...pr(x + 1 - i, y + i, z1)); ctx.lineTo(...pr(x + i, y + 1 - i, z1));
      ctx.stroke();
    };

    const drawRow = (y) => {
      for (let x = 0; x < P.w; x++) {
        const c = P.grid[y][x];
        if (c === '.') continue;
        if (c === 'G') { spring(x, y, padLift(`${x},${y}`)); continue; }
        if (cracked === `${x},${y}` && a.k > 0.15) continue;   // it gives way under the block
        if (c === 'F') tile(x, y, C.frag, 0, { cracks: true });
        else tile(x, y, C.tile);
      }
    };

    // 3. the block
    const drawBlock = (b, dir, th, dz, alpha) => {
      const [x0, y0, x1, y1, h] = boxOf(b);
      const c = Math.cos(th), s = Math.sin(th);
      const rot = (p) => {
        let [x, y, z] = p;
        if (dir === 'R') { const u = x - x1; x = x1 + u * c + z * s; z = -u * s + z * c; }
        else if (dir === 'L') { const u = x - x0; x = x0 + u * c - z * s; z = u * s + z * c; }
        else if (dir === 'D') { const u = y - y1; y = y1 + u * c + z * s; z = -u * s + z * c; }
        else if (dir === 'U') { const u = y - y0; y = y0 + u * c - z * s; z = u * s + z * c; }
        return [x, y, z + dz];
      };
      const V = [];
      for (const z of [0, h]) for (const y of [y0, y1]) for (const x of [x0, x1]) V.push(rot([x, y, z]));
      const ctr = V.reduce((q, p) => [q[0] + p[0] / 8, q[1] + p[1] / 8, q[2] + p[2] / 8], [0, 0, 0]);
      // contact shadow on the floor, fading as the block rises
      if (alpha > 0.5 && dz < 1) {
        const xs = V.map((p) => p[0]), ys = V.map((p) => p[1]);
        const sx0 = Math.min(...xs), sx1 = Math.max(...xs), sy0 = Math.min(...ys), sy1 = Math.max(...ys);
        const q0 = pr(sx0 - 0.04, sy0 + 0.05, 0), q1 = pr(sx1 + 0.04, sy1 + 0.12, 0);
        ctx.save();
        ctx.globalAlpha = (dark ? 0.5 : 0.28) * Math.max(0, 1 - dz);
        ctx.fillStyle = '#000';
        ctx.filter = 'blur(3px)';
        ctx.fillRect(q0[0], q0[1], q1[0] - q0[0], q1[1] - q0[1]);
        ctx.restore();
      }
      ctx.globalAlpha = alpha;
      const faces = [];
      for (const f of FACES) {
        const pts = f.map((i) => V[i]);
        const fc = pts.reduce((q, p) => [q[0] + p[0] / 4, q[1] + p[1] / 4, q[2] + p[2] / 4], [0, 0, 0]);
        let n = [fc[0] - ctr[0], fc[1] - ctr[1], fc[2] - ctr[2]];
        const m = Math.hypot(...n); n = n.map((v) => v / m);
        if (n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2] <= 0.001) continue;
        faces.push({ pts, n });
      }
      for (const { pts, n } of faces) {
        const lit = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
        const sp = pts.map((p) => pr(p[0], p[1], p[2]));
        poly(sp, C.block, lit > 0.7 ? 0 : 0.14 + (0.7 - Math.max(0, lit)) * 0.42);
        const ys2 = sp.map((p) => p[1]);
        // the top catches the light; the sides darken toward the floor
        if (n[2] > 0.7) sheen(Math.min(...ys2), Math.max(...ys2), 'rgba(255,255,255,.34)', 'rgba(255,255,255,.08)');
        else sheen(Math.min(...ys2), Math.max(...ys2), 'rgba(255,255,255,.06)', 'rgba(0,0,0,.18)');
        ctx.strokeStyle = 'rgba(0,0,0,.42)'; ctx.lineWidth = 1.1;
        path(sp); ctx.stroke();
      }
      // a bright rim along the top face's back and left edges
      const topFace = faces.find((f) => f.n[2] > 0.7);
      if (topFace) {
        const sp = topFace.pts.map((p) => pr(p[0], p[1], p[2]));
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(...sp[3]); ctx.lineTo(...sp[0]); ctx.lineTo(...sp[1]); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    const restDz = (b) => (onSpringCells(footKeys(b)) ? PAD_DOWN : 0);
    const lastRow = (b) => (b ? Math.max(...cellsOfBlock(b).map(([, y]) => y)) : -1);

    // 4. PAINT BACK TO FRONT, ROW BY ROW, and put the block in right after the
    // last row it stands on. Drawn on top of everything, a block standing behind
    // a raised spring pad was painted over it (owner, 2026-10-20: "the visual of
    // the block behind the spring doesn't make sense"). Anything in the air
    // (falling, or fired off the spring) goes over the whole board.
    let job = null, jobRow = P.h;
    if (a && a.phase === 'roll') {
      const d0 = onSpringCells(fromFoot) ? PAD_DOWN : 0, d1 = onSpringCells(toFoot) ? PAD_DOWN : 0;
      job = () => drawBlock(anim.from, anim.dir, a.k * Math.PI / 2, d0 + (d1 - d0) * a.k, 1);
      jobRow = Math.max(lastRow(anim.from), lastRow(anim.to));
    } else if (a && a.phase === 'drop') {
      job = () => drawBlock(anim.to, null, 0, -a.k * a.k * 5, Math.max(0, 1 - a.k * 1.3));
    } else if (a && a.phase === 'launch') {
      // squash with the pad, then fire straight up and out of the top of the board
      const k = a.k;
      const lift = k < 0.22 ? PAD_DOWN - (k / 0.22) * PAD_DOWN : Math.min(1.1, ((k - 0.22) / 0.1) * 1.1);
      const fly = k < 0.32 ? 0 : Math.pow((k - 0.32) / 0.68, 1.7) * 18;
      job = () => drawBlock(anim.to, null, 0, lift + fly, 1);
      jobRow = k < 0.32 ? lastRow(anim.to) : P.h;
    } else if (!(launched || onSpring(P, block))) {
      job = () => drawBlock(block, null, 0, restDz(block), 1);
      jobRow = lastRow(block);
    }
    for (let y = 0; y < P.h; y++) {
      drawRow(y);
      if (job && y === jobRow) { job(); job = null; }
    }
    if (job) job();
  }, [P, anim, block, pr, W, H, playing, launched]);

  // colours follow the light switch
  useEffect(() => { readColors(); force((n) => n + 1); }, [readColors, themeKey]);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const on = () => { readColors(); draw(performance.now()); };
    mq && mq.addEventListener && mq.addEventListener('change', on);
    return () => { mq && mq.removeEventListener && mq.removeEventListener('change', on); };
  }, [readColors, draw]);

  // the animation loop
  useEffect(() => {
    if (!anim) { draw(performance.now()); return undefined; }
    const total = ROLL_MS + (anim.result === 'fall' || anim.result === 'crack' ? DROP_MS : anim.result === 'win' ? LAUNCH_MS : 0);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { draw(anim.t0 + total); const id = setTimeout(() => onAnimEnd(anim.id), 60); return () => clearTimeout(id); }
    const tick = (now) => {
      draw(now);
      if (now - anim.t0 < total) frame.current = requestAnimationFrame(tick);
      else onAnimEnd(anim.id);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [anim, draw, onAnimEnd]);
  useEffect(() => { draw(performance.now()); });

  // swipe on the board
  const sw = useRef(null);
  const onDown = (e) => { sw.current = [e.clientX, e.clientY]; };
  const onUp = (e) => {
    if (!sw.current) return;
    const dx = e.clientX - sw.current[0], dy = e.clientY - sw.current[1];
    sw.current = null;
    if (Math.hypot(dx, dy) < 22) return;
    onMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
  };

  const say1 = !playing ? doneLine
    : springLine(P);
  const say2 = playing
    ? `Arrow keys, a swipe or the pad. Fall off or stand on a cracked tile and you start over; every roll still counts.${falls ? ` Falls so far: ${falls}.` : ''}`
    : null;
  const key = (d, Icon, area, label) => (
    <button type="button" className={`tp-key${hintDir === d ? ' hint' : ''}`} style={{ gridArea: area }} disabled={!playing} onClick={() => onMove(d)} aria-label={hintDir === d ? `${label}, the hinted roll` : label}>
      <Icon size={22} strokeWidth={2.6} />
    </button>
  );

  return (
    <div className="tp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <RollMeter used={used} par={par} perfect={perfect} />
      <div className="stg-board tp-board">
        <div className="tp-panel" style={{ position: 'relative' }}>
          <span ref={probeRef} className="tp-probe" aria-hidden="true" />
          <canvas key={shake} ref={cvRef} className={`tp-canvas${shake ? ' shake' : ''}`}
            style={{ maxWidth: W * 1.5, aspectRatio: `${W} / ${H}` }}
            role="img" aria-label={`Topple board, ${P.w} by ${P.h}. The block is ${block.o === 'S' ? 'standing' : 'lying flat'}.`}
            onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { sw.current = null; }} />
          <div className="tp-row">
            <div className="tp-say">
              <span className="tp-say1" aria-live="polite">{say1}</span>
              {say2 && <span className="tp-say2">{say2}</span>}
            </div>
            {playing && (
              <>
                <div className="tp-pad" style={{ gridTemplateAreas: '". u ." "l . r" ". d ."' }}>
                  {key('U', ArrowUp, 'u', 'Roll up')}
                  {key('L', ArrowLeft, 'l', 'Roll left')}
                  {key('R', ArrowRight, 'r', 'Roll right')}
                  {key('D', ArrowDown, 'd', 'Roll down')}
                </div>
                <div className="tp-acts">
                  <button type="button" className="tp-btn" onClick={onRestart} disabled={!used} title="Put the block back on the start. Your rolls still count.">
                    <RotateCcw size={16} strokeWidth={2.2} /> Restart
                  </button>
                  {hintAvail && (
                    <button type="button" className="tp-btn hint" onClick={onHint} title="Light the next roll on the best line (one hint, first play only)">
                      <Lightbulb size={16} strokeWidth={2.2} /> Hint
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {playing && (
        <div className="tp-foot">
          <span className="tp-rule">{springLine(P)} Cracked tiles give way under a standing block.</span>
          <button type="button" className="tp-giveup" onClick={onGiveUp}
            style={{ color: armed ? 'var(--stg-bad, #fb7185)' : 'var(--stg-ink2, #aab5c7)' }}>
            <Eye size={13} /> {armed ? 'Tap again to give up and score nothing' : 'Give up'}
          </button>
        </div>
      )}
    </div>
  );
}

// What the spring asks for today, in one line.
export function springLine(P) {
  return P.goal.length === 2
    ? 'Land the block lying flat across both spring tiles.'
    : 'Land the block standing up on the spring.';
}
