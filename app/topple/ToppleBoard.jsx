'use client';

// Topple's board: the floor and the block, drawn on a canvas in a three-quarter
// view where UP ON THE SCREEN IS UP ON THE BOARD. An isometric view (the
// original game's) makes the arrow keys point along diagonals, and the owner's
// first report on the mockup was that the block "does not move as it should";
// here Up rolls it up the screen, Left rolls it left, and a swipe goes the way
// it looks.
//
// THE LOOK (rebuilt 2026-11-02, owner: "can we greatly improve the visuals of
// roll and topple?"), shared with Roll through lib/roll-toy-kit.js: white or
// slate tiles edged in the stage ink, a pastel block in the category colour with
// bevelled faces, and the category colour again on the cracked tiles and the
// spring pad. The view does not lean (a lean tilts a
// two-high block off its tile), so depth comes from thick tile fronts, the
// bevels and the shadows; rows and columns stay square to the screen, so the
// arrows read straight. The old board painted the block with --stg-acc,
// which is the INK on the light register, so the block was navy and the
// category colour never reached the board; the kit reads the pastel instead.
//
// The roll is a real quarter turn about the block's leading bottom edge
// (drawBlock), so a standing block tips flat and a flat one stands up, the way
// a domino does, and it squashes a touch and puffs dust as it lands. A fall
// tips it off the edge; a cracked tile breaks into shards under it. A win lands
// it on the SPRING (owner, 2026-10-19, in place of the original's hole): the pad
// squashes under it and fires it off the top of the board with a burst of
// confetti. A one-tile spring takes the block standing (marked with an X); a
// two-tile spring takes it lying flat across both (marked with the outline of
// a lying block). Idle, the pad bobs gently so the goal is easy to find.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Lightbulb, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { onSpring } from '@/lib/topple-engine';
import { readPalette, slab, cracks, contact, face, roundQuad, quad, inset, css, mix, Fx, prefersReduced } from '@/lib/roll-toy-kit';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const TW = 48;            // one square, left to right
const TH = 38;            // one square, top to bottom (depth is foreshortened)
const KX = 0;             // no sideways lean: on a block two units tall any lean reads as the block
                          // tilting off its tile (looked at 2026-10-19, and again 2026-11-02)
const TZ = 28;            // how far one unit of height rises
const SLAB = 0.42;        // tile thickness, in block units
const GAP = 0.05;         // the seam between two tiles, so the floor reads as tiles
const PAD_UP = 0.56;      // a spring pad at rest stands this far proud of the floor, coil showing
const PAD_DOWN = 0.1;     // and sinks to here under the block
const PAD = 16;
const ROLL_MS = 190;
const DROP_MS = 560;
const LAUNCH_MS = 900;
const SQUASH_MS = 150;

const VIEW = (() => { const v = [KX / TW, TZ / TH, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const LIGHT = (() => { const v = [0.3, -0.5, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];

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
/* NO ON-SCREEN CONTROLS ON A DESKTOP WITH A MOUSE (owner, 2026-10-30): the keyboard already does all of this. */
@media (min-width:900px) and (hover:hover) and (pointer:fine){.tp-pad{display:none !important;}}
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

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function ToppleBoard({
  P, block, anim, onAnimEnd, playing, used, par, perfect, falls,
  onMove, onRestart, hintAvail, onHint, hintDir, armed, onGiveUp, doneLine, shake, themeKey, launched,
}) {
  const cvRef = useRef(null);
  const probeRef = useRef(null);
  const colors = useRef(null);
  const fx = useRef(new Fx());
  const seen = useRef({ land: null, crack: null, fire: null });
  const squash = useRef(null);
  const shown = useRef(0);
  const dirty = useRef(true);
  const [, force] = useState(0);

  const W = Math.round(P.w * TW + KX * 2.4 + SLAB * KX + PAD * 2 + 4);
  const H = Math.round(P.h * TH + TZ * 2.4 + SLAB * TZ + PAD * 2 + 6);
  const OX = PAD + KX * 2.4 + 2;
  const OY = PAD + TZ * 2.4;
  const pr = useCallback((x, y, z) => [OX + x * TW - z * KX, OY + y * TH - z * TZ], [OX, OY]);

  const readColors = useCallback(() => {
    if (probeRef.current) colors.current = readPalette(probeRef.current);
    dirty.current = true;
  }, []);

  const draw = useCallback((now) => {
    const cv = cvRef.current;
    if (!cv || !colors.current) return;
    const C = colors.current;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const cw = shown.current || cv.clientWidth || W;
    const bw = Math.max(1, Math.round(cw * dpr)), bh = Math.max(1, Math.round((cw * H / W) * dpr));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const reduce = prefersReduced();

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
    const bob = reduce ? 0 : Math.sin(now / 280) * 0.035;
    const padLift = (key) => {
      if (a && a.phase === 'launch' && toFoot.includes(key)) {
        const k = a.k;
        return k < 0.22 ? PAD_DOWN - (k / 0.22) * PAD_DOWN : Math.min(1.1, ((k - 0.22) / 0.1) * 1.1);
      }
      if (!anim && launched) return PAD_UP + bob;
      if (a && a.phase === 'roll') {
        const f = fromFoot.includes(key) ? PAD_DOWN : PAD_UP, t2 = toFoot.includes(key) ? PAD_DOWN : PAD_UP;
        return f + (t2 - f) * a.k;
      }
      if (a && a.phase === 'drop') return PAD_UP + bob;
      return restFoot.includes(key) && !launched ? PAD_DOWN : PAD_UP + bob;
    };
    const onSpringCells = (keys) => keys.some((k) => { const [x, y] = k.split(',').map(Number); return P.grid[y] && P.grid[y][x] === 'G'; });

    // effects keyed to the animation's moments, each fired once
    if (anim && !reduce) {
      const t = now - anim.t0;
      if (t >= ROLL_MS && seen.current.land !== anim.id && (anim.result === 'ok' || anim.result === 'win' || anim.result === 'crack')) {
        seen.current.land = anim.id;
        const [x0, y0, x1, y1] = boxOf(anim.to);
        const dz = anim.result === 'win' ? PAD_DOWN : 0;
        fx.current.dust(now, [pr(x0 + 0.05, y1, dz), pr(x1 - 0.05, y1, dz), pr(x0, (y0 + y1) / 2, dz), pr(x1, (y0 + y1) / 2, dz)], css(C.dust), 2);
        if (anim.result === 'ok') squash.current = { t: now, id: anim.id };
      }
      if (anim.result === 'crack' && t >= ROLL_MS + 70 && seen.current.crack !== anim.id) {
        seen.current.crack = anim.id;
        const { x, y } = anim.to;
        const top = css(C.frag), edge = css(C.tileLine, C.tileLineA + 0.2);
        const parts = [[0, 0, 0.5, 0.46], [0.5, 0, 1, 0.56], [0, 0.46, 0.55, 1], [0.55, 0.56, 1, 1]];
        parts.forEach(([u0, v0, u1, v1], i) => {
          const q = [pr(x + u0 + 0.04, y + v0 + 0.04, 0), pr(x + u1 - 0.04, y + v0 + 0.04, 0), pr(x + u1 - 0.04, y + v1 - 0.04, 0), pr(x + u0 + 0.04, y + v1 - 0.04, 0)];
          fx.current.shard(now, q, top, edge, (u0 - 0.4) * 0.05, -0.03 - Math.random() * 0.03, (Math.random() - 0.5) * 0.008, i * 25);
        });
      }
      if (anim.result === 'win' && t >= ROLL_MS + LAUNCH_MS * 0.3 && seen.current.fire !== anim.id) {
        seen.current.fire = anim.id;
        const [x0, y0, x1, y1] = boxOf(anim.to);
        const c = pr((x0 + x1) / 2, (y0 + y1) / 2, 0.8);
        fx.current.confetti(now, c[0], c[1], [css(C.body), css(C.line), css(C.bodyTop), css(mix(C.body, [255, 255, 255], 0.55))], 46);
      }
    }

    // 1. one soft shadow under the whole floor, so the board sits on the page
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${C.shadowA})`;
    ctx.shadowBlur = 22; ctx.shadowOffsetY = 12;
    ctx.fillStyle = css(C.tileFront);
    ctx.beginPath();
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (P.grid[y][x] === '.') continue;
      const q = [pr(x + GAP, y + GAP, 0), pr(x + 1 - GAP, y + GAP, 0), pr(x + 1 - GAP, y + 1 - GAP, -SLAB), pr(x + GAP, y + 1 - GAP, -SLAB)];
      ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.lineTo(...q[2]); ctx.lineTo(...q[3]); ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // 2. the tiles, back row first
    const cracked = a && anim.result === 'crack' && a.phase === 'drop' ? `${anim.to.x},${anim.to.y}` : null;
    const tile = (x, y, top, opts = {}) => slab(ctx, pr, C, x + GAP, y + GAP, x + 1 - GAP, y + 1 - GAP, 0, SLAB, top, opts);

    // THE SPRING: a sunken socket, a metal coil, and a pastel pad on top. The
    // coil is a real helix, its back half drawn behind and dimmer, so it reads
    // as a spring from straight on. A one-tile spring's pad carries an X; a
    // two-tile spring's pads carry the outline of a block lying across both.
    const pair = P.goal.length === 2;
    const metal = C.dark ? mix(C.ink, C.ground, 0.18) : C.line;
    const spring = (x, y, lift) => {
      const tp = tile(x, y, C.tileTop);
      roundQuad(ctx, inset(tp, 0.78), 6);
      ctx.fillStyle = C.dark ? 'rgba(0,0,0,.5)' : css(mix(C.ink, [255, 255, 255], 0.62)); ctx.fill();
      const cx = x + 0.5, cy = y + 0.5, rx = 0.27, ry = 0.22;
      const turns = 4, steps = turns * 28;
      const zTop = Math.max(0.02, lift - 0.08);
      const pt = (i) => { const t = (i / steps) * turns * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t), 0.02 + (zTop - 0.02) * (i / steps), Math.sin(t)]; };
      const coil = (front) => {
        ctx.strokeStyle = front ? css(metal) : css(metal, 0.4); ctx.lineWidth = front ? 2.8 : 2.2;
        ctx.beginPath();
        for (let i = 0; i < steps; i++) {
          const p = pt(i), q2 = pt(i + 1);
          if ((p[3] >= 0) !== front) continue;
          ctx.moveTo(...pr(p[0], p[1], p[2])); ctx.lineTo(...pr(q2[0], q2[1], q2[2]));
        }
        ctx.stroke();
      };
      coil(false);
      coil(true);
      // the pad: a pastel plate a little inside the tile, edged in ink
      const m = 0.15, th = 0.12;
      slab(ctx, pr, { ...C, tileLine: C.line, tileLineA: 1, dark: C.dark }, x + m, y + m, x + 1 - m, y + 1 - m, lift, th, C.bodyTop,
        { front: C.bodyFront, side: C.bodySide, lw: 1.8, r: 4 });
      ctx.strokeStyle = css(C.line); ctx.lineCap = 'round';
      if (!pair) {
        const i = 0.29;
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(...pr(x + i, y + i, lift)); ctx.lineTo(...pr(x + 1 - i, y + 1 - i, lift));
        ctx.moveTo(...pr(x + 1 - i, y + i, lift)); ctx.lineTo(...pr(x + i, y + 1 - i, lift));
        ctx.stroke();
      } else {
        // half of a lying block's outline, open toward the partner tile
        const [gx0, gy0] = P.goal[0], [gx1, gy1] = P.goal[1];
        const ox = gx1 !== gx0, first = ox ? x === Math.min(gx0, gx1) : y === Math.min(gy0, gy1);
        const i = 0.24;
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (ox) {
          const xa = first ? x + 1 : x, xb = first ? x + i : x + 1 - i;
          ctx.moveTo(...pr(xa - (first ? 0.1 : -0.1), y + i, lift)); ctx.lineTo(...pr(xb, y + i, lift)); ctx.lineTo(...pr(xb, y + 1 - i, lift)); ctx.lineTo(...pr(xa - (first ? 0.1 : -0.1), y + 1 - i, lift));
        } else {
          const ya = first ? y + 1 : y, yb = first ? y + i : y + 1 - i;
          ctx.moveTo(...pr(x + i, ya - (first ? 0.1 : -0.1), lift)); ctx.lineTo(...pr(x + i, yb, lift)); ctx.lineTo(...pr(x + 1 - i, yb, lift)); ctx.lineTo(...pr(x + 1 - i, ya - (first ? 0.1 : -0.1), lift));
        }
        ctx.stroke();
      }
    };

    const drawRow = (y) => {
      for (let x = 0; x < P.w; x++) {
        const c = P.grid[y][x];
        if (c === '.') continue;
        if (c === 'G') { spring(x, y, padLift(`${x},${y}`)); continue; }
        if (cracked === `${x},${y}` && (reduce || now - anim.t0 >= ROLL_MS + 70)) continue;   // it gives way under the block
        if (c === 'F') {
          tile(x, y, C.frag, { front: mix(C.frag, C.line, 0.18), side: mix(C.frag, C.line, 0.26) });
          cracks(ctx, pr, x, y, 0, css(C.line, C.dark ? 0.9 : 0.75), 1.7);
        } else tile(x, y, (x + y) % 2 ? C.tileTop : mix(C.tileTop, C.ink, C.dark ? 0.03 : 0.025));
      }
    };

    // 3. the block
    const drawBlock = (b, dir, th, dz, alpha, sq = 1) => {
      const [x0, y0, x1, y1, h] = boxOf(b);
      const c = Math.cos(th), s = Math.sin(th);
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, spread = 1 + (1 - sq) * 0.6;
      const rot = (p) => {
        let [x, y, z] = p;
        if (sq !== 1) { x = mx + (x - mx) * spread; y = my + (y - my) * spread; z *= sq; }
        if (dir === 'R') { const u = x - x1; x = x1 + u * c + z * s; z = -u * s + z * c; }
        else if (dir === 'L') { const u = x - x0; x = x0 + u * c - z * s; z = u * s + z * c; }
        else if (dir === 'D') { const u = y - y1; y = y1 + u * c + z * s; z = -u * s + z * c; }
        else if (dir === 'U') { const u = y - y0; y = y0 + u * c - z * s; z = u * s + z * c; }
        return [x, y, z + dz];
      };
      const V = [];
      for (const z of [0, h]) for (const y of [y0, y1]) for (const x of [x0, x1]) V.push(rot([x, y, z]));
      const ctr = V.reduce((q, p) => [q[0] + p[0] / 8, q[1] + p[1] / 8, q[2] + p[2] / 8], [0, 0, 0]);
      // contact shadow on the floor, thinning as the block rises
      if (alpha > 0.5 && dz > -0.2 && dz < 1.6) {
        const xs = V.map((p) => p[0]), ys = V.map((p) => p[1]);
        contact(ctx, pr, C, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), Math.max(0, dz));
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
        const k = Math.max(0, Math.min(1, (lit + 0.15) / 1.0));
        const fill = mix(C.bodySide, C.bodyTop, k);
        const sp = pts.map((p) => pr(p[0], p[1], p[2]));
        face(ctx, sp, fill, `rgba(255,255,255,${(0.08 + Math.max(0, n[2]) * 0.2).toFixed(3)})`, C.line, 2);
        // the middle seam across a long face, so a lying block reads as two squares long
        const L = (i, j) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
        const mid = (i, j) => [(sp[i][0] + sp[j][0]) / 2, (sp[i][1] + sp[j][1]) / 2];
        let seg = null;
        if (L(0, 1) > 1.5) seg = [mid(0, 1), mid(3, 2)];
        else if (L(1, 2) > 1.5) seg = [mid(1, 2), mid(0, 3)];
        if (seg) {
          ctx.strokeStyle = css(C.line, 0.28); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(...seg[0]); ctx.lineTo(...seg[1]); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };
    const restDz = (b) => (onSpringCells(footKeys(b)) ? PAD_DOWN : 0);
    const lastRow = (b) => (b ? Math.max(...cellsOfBlock(b).map(([, y]) => y)) : -1);
    let sq = 1;
    if (!anim && squash.current && !reduce) {
      const t = now - squash.current.t;
      if (t < SQUASH_MS) sq = 1 - 0.075 * Math.sin(Math.PI * t / SQUASH_MS);
    }

    // 4. PAINT BACK TO FRONT, ROW BY ROW, and put the block in right after the
    // last row it stands on. Drawn on top of everything, a block standing behind
    // a raised spring pad was painted over it (owner, 2026-10-20: "the visual of
    // the block behind the spring doesn't make sense"). Anything in the air
    // (falling, or fired off the spring) goes over the whole board.
    let job = null, jobRow = P.h;
    if (a && a.phase === 'roll') {
      const d0 = onSpringCells(fromFoot) ? PAD_DOWN : 0, d1 = onSpringCells(toFoot) ? PAD_DOWN : 0;
      // a little hop at the top of the turn, so the roll has weight
      const hop = Math.sin(a.k * Math.PI) * 0.06;
      job = () => drawBlock(anim.from, anim.dir, a.k * Math.PI / 2, d0 + (d1 - d0) * a.k + hop, 1);
      jobRow = Math.max(lastRow(anim.from), lastRow(anim.to));
    } else if (a && a.phase === 'drop') {
      // tip on over the edge and fall away, fading
      const k = a.k;
      job = () => drawBlock(anim.to, anim.result === 'fall' ? anim.dir : null, anim.result === 'fall' ? k * 1.1 : 0, -k * k * 6, Math.max(0, 1 - k * 1.25));
      jobRow = lastRow(anim.to);
    } else if (a && a.phase === 'launch') {
      // squash with the pad, then fire straight up and out of the top of the board
      const k = a.k;
      const lift = k < 0.22 ? PAD_DOWN - (k / 0.22) * PAD_DOWN : Math.min(1.1, ((k - 0.22) / 0.1) * 1.1);
      const fly = k < 0.32 ? 0 : Math.pow((k - 0.32) / 0.68, 1.7) * 18;
      const sqz = k < 0.22 ? 1 - 0.12 * (k / 0.22) : k < 0.32 ? 0.88 + 0.2 * ((k - 0.22) / 0.1) : 1.08 - Math.min(0.08, (k - 0.32) * 0.3);
      job = () => {
        if (fly > 0.4) {
          // a short motion trail under the block as it leaves
          drawBlock(anim.to, null, 0, lift + fly * 0.55, 0.12, sqz);
          drawBlock(anim.to, null, 0, lift + fly * 0.78, 0.22, sqz);
        }
        drawBlock(anim.to, null, 0, lift + fly, 1, sqz);
      };
      jobRow = k < 0.32 ? lastRow(anim.to) : P.h;
    } else if (!(launched || onSpring(P, block))) {
      job = () => drawBlock(block, null, 0, restDz(block), 1, sq);
      jobRow = lastRow(block);
    }
    for (let y = 0; y < P.h; y++) {
      drawRow(y);
      if (job && y === jobRow) { job(); job = null; }
    }
    if (job) job();
    fx.current.draw(ctx, now, C.dark ? null : css(C.line, 0.5));
  }, [P, anim, block, pr, W, H, playing, launched]);

  // colours follow the light switch
  useEffect(() => { readColors(); force((n) => n + 1); }, [readColors, themeKey]);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const on = () => { readColors(); };
    mq && mq.addEventListener && mq.addEventListener('change', on);
    return () => { mq && mq.removeEventListener && mq.removeEventListener('change', on); };
  }, [readColors]);
  // draw at the size the canvas is SHOWN, so it stays sharp at any width
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((es) => {
      const w = es[0] && es[0].contentRect ? es[0].contentRect.width : cv.clientWidth;
      if (w && Math.abs(w - shown.current) > 0.25) { shown.current = w; dirty.current = true; }
    });
    ro.observe(cv);
    return () => ro.disconnect();
  }, [shake]);

  // ONE LOOP for the board: it plays the roll and its aftermath, keeps the
  // particles moving, bobs the spring at about 30 frames a second while the
  // board is idle, and tells the client when a roll has finished. With reduced
  // motion there is no bob, no particles, and a roll ends at once.
  const live = useRef(null);
  live.current = { anim, draw, onAnimEnd };
  useEffect(() => { dirty.current = true; });
  useEffect(() => {
    let raf = 0, idleAt = 0, ended = null;
    const loop = (now) => {
      const { anim: an, draw: dr, onAnimEnd: done } = live.current;
      const reduce = prefersReduced();
      const total = an ? ROLL_MS + (an.result === 'fall' || an.result === 'crack' ? DROP_MS : an.result === 'win' ? LAUNCH_MS : 0) : 0;
      if (an && ended !== an.id && (reduce || now - an.t0 >= total)) {
        ended = an.id;
        dr(reduce ? an.t0 + total : now);
        dirty.current = false;
        done(an.id);
      } else if ((an && ended !== an.id) || fx.current.busy(now) || (squash.current && now - squash.current.t < SQUASH_MS + 20)) {
        dr(now); dirty.current = false;
      } else if (dirty.current || (!reduce && now - idleAt > 33)) {
        dr(now); dirty.current = false; idleAt = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  // a restart or a new board clears the air
  useEffect(() => { fx.current.clear(); squash.current = null; }, [P]);

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
