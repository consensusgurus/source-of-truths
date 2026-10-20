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
// tiles take the site's warning amber (a meaning, not a decoration, like
// Parker's red car).
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
const TW = 40;            // one square, left to right
const TH = 26;            // one square, top to bottom (depth is foreshortened)
const KX = 0;             // no sideways lean: a slanted view made a standing block look
                          // like it stood off its own tile (looked at, 2026-10-19)
const TZ = 22;            // how far one unit of height rises
const SLAB = 0.32;        // tile thickness, in block units
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
  frag: 'color-mix(in srgb, var(--stg-warn, #fbbf24) 78%, var(--stg-ground, #0b0f1a))',
  block: 'var(--stg-acc, #bef264)',
  pad: 'color-mix(in srgb, var(--stg-acc, #bef264) 34%, var(--stg-ground, #0b0f1a))',
  coil: 'var(--stg-acc-ink, var(--stg-acc, #bef264))',
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
.tp-key.hint{border-color:var(--stg-warn,#fbbf24);box-shadow:0 0 0 3px color-mix(in srgb, var(--stg-warn,#fbbf24) 40%, transparent);}
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
        <span>Rolls <b className="tp-mv" style={over ? { color: 'var(--stg-warn, #fbbf24)' } : undefined}>{used}</b></span>
        <span>Perfect <b>{perfect}</b> &middot; Par <b>{par}</b></span>
      </div>
      <div className="tp-mtrack">
        <div className="tp-mfill" style={{ width: `${pct(used)}%`, background: over ? 'var(--stg-warn, #fbbf24)' : 'var(--stg-acc-ink, var(--stg-acc))' }} />
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
  const H = P.h * TH + TZ * 2.6 + SLAB * TZ + PAD * 2 + 4;
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
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const poly = (pts, fill, shade, stroke) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      if (shade > 0) { ctx.fillStyle = `rgba(0,0,0,${shade})`; ctx.fill(); }
      if (shade < 0) { ctx.fillStyle = `rgba(255,255,255,${-shade})`; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    };
    const slab = (x, y, top, edge) => {
      const z0 = -SLAB;
      poly([pr(x, y + 1, 0), pr(x + 1, y + 1, 0), pr(x + 1, y + 1, z0), pr(x, y + 1, z0)], top, 0.34);
      poly([pr(x + 1, y, 0), pr(x + 1, y + 1, 0), pr(x + 1, y + 1, z0), pr(x + 1, y, z0)], top, 0.5);
      poly([pr(x, y, 0), pr(x + 1, y, 0), pr(x + 1, y + 1, 0), pr(x, y + 1, 0)], top, 0, edge);
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

    // the floor, back to front and left to right
    const cracked = a && anim.result === 'crack' && a.phase === 'drop' ? `${anim.to.x},${anim.to.y}` : null;
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      const c = P.grid[y][x];
      if (c === '.') continue;
      if (c === 'G') {
        // THE SPRING: a pad on a coil. The pad sits a little proud of the floor
        // and squashes as the block lands, then snaps up as it fires.
        // The pad rests almost flush (0.06) so a block passing over it does not
        // sink into it; it squashes as the block lands and snaps up as it fires.
        let lift = 0.06;
        if (a && a.phase === 'launch') lift = a.k < 0.22 ? 0.06 - (a.k / 0.22) * 0.12 : -0.06 + Math.min(1, (a.k - 0.22) / 0.12) * 0.5;
        else if (!playing && !anim && launched) lift = 0.46;
        slab(x, y, C.tile, C.tileEdge);
        // the coil, drawn as a zigzag up the front from the floor to the pad
        ctx.strokeStyle = C.coil; ctx.lineWidth = 2;
        ctx.beginPath();
        const turns = 4;
        for (let i = 0; i <= turns * 2; i++) {
          const zz = (lift * i) / (turns * 2);
          const xx = i % 2 ? x + 0.78 : x + 0.22;
          const p = pr(xx, y + 0.62, zz);
          i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
        }
        ctx.stroke();
        const z1 = lift, z0 = lift - 0.1;
        const m = 0.08;
        poly([pr(x + m, y + 1 - m, z1), pr(x + 1 - m, y + 1 - m, z1), pr(x + 1 - m, y + 1 - m, z0), pr(x + m, y + 1 - m, z0)], C.pad, 0.3);
        poly([pr(x + 1 - m, y + m, z1), pr(x + 1 - m, y + 1 - m, z1), pr(x + 1 - m, y + 1 - m, z0), pr(x + 1 - m, y + m, z0)], C.pad, 0.45);
        poly([pr(x + m, y + m, z1), pr(x + 1 - m, y + m, z1), pr(x + 1 - m, y + 1 - m, z1), pr(x + m, y + 1 - m, z1)], C.pad, 0, C.coil);
        // an up-chevron on the pad, so it reads as "this fires you" without colour
        ctx.strokeStyle = C.coil; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(...pr(x + 0.3, y + 0.62, z1)); ctx.lineTo(...pr(x + 0.5, y + 0.36, z1)); ctx.lineTo(...pr(x + 0.7, y + 0.62, z1));
        ctx.stroke();
        continue;
      }
      if (cracked === `${x},${y}`) {
        if (a.k > 0.15) continue;   // it gives way under the block
      }
      if (c === 'F') {
        slab(x, y, C.frag, 'rgba(0,0,0,.28)');
        // two hairline cracks, so fragile reads without colour alone
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(...pr(x + 0.22, y + 0.3, 0)); ctx.lineTo(...pr(x + 0.48, y + 0.52, 0)); ctx.lineTo(...pr(x + 0.42, y + 0.8, 0));
        ctx.moveTo(...pr(x + 0.48, y + 0.52, 0)); ctx.lineTo(...pr(x + 0.8, y + 0.42, 0));
        ctx.stroke();
      } else {
        slab(x, y, C.tile, C.tileEdge);
      }
    }

    // the block
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
      ctx.globalAlpha = alpha;
      ctx.lineJoin = 'round';
      for (const f of FACES) {
        const pts = f.map((i) => V[i]);
        const fc = pts.reduce((q, p) => [q[0] + p[0] / 4, q[1] + p[1] / 4, q[2] + p[2] / 4], [0, 0, 0]);
        let n = [fc[0] - ctr[0], fc[1] - ctr[1], fc[2] - ctr[2]];
        const m = Math.hypot(...n); n = n.map((v) => v / m);
        if (n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2] <= 0.001) continue;
        const lit = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
        poly(pts.map((p) => pr(p[0], p[1], p[2])), C.block, lit > 0.7 ? 0 : 0.18 + (0.7 - Math.max(0, lit)) * 0.45, 'rgba(0,0,0,.35)');
      }
      ctx.globalAlpha = 1;
    };
    if (a && a.phase === 'roll') drawBlock(anim.from, anim.dir, a.k * Math.PI / 2, 0, 1);
    else if (a && a.phase === 'drop') drawBlock(anim.to, null, 0, -a.k * a.k * 5, Math.max(0, 1 - a.k * 1.3));
    else if (a && a.phase === 'launch') {
      // squash with the pad, then fire straight up and out of the top of the board
      const k = a.k;
      const dz = k < 0.22 ? -(k / 0.22) * 0.12 : -0.12 + Math.pow((k - 0.22) / 0.78, 1.6) * 16;
      drawBlock(anim.to, null, 0, dz + 0.06, 1);
    }
    else if (!(launched || onSpring(P, block))) drawBlock(block, null, 0, 0.0, 1);
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
    ? `Arrow keys, a swipe or the pad. Fall off or stand on an orange tile and you start over; every roll still counts.${falls ? ` Falls so far: ${falls}.` : ''}`
    : null;
  const key = (d, Icon, area, label) => (
    <button type="button" className={`tp-key${hintDir === d ? ' hint' : ''}`} style={{ gridArea: area }} disabled={!playing} onClick={() => onMove(d)} aria-label={label}>
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
          <span className="tp-rule">{springLine(P)} Orange tiles crack under a standing block.</span>
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
