'use client';

// Roll's board: the floor and the die, drawn on a canvas in a three-quarter
// view that LEANS so three faces of the die show at once: the top, the front
// (south) and the right (east) side (owner, 2026-10-20: "maybe we get a
// diagonal view so can see 3 sides at once"). The lean only shifts height to
// the left; the board's rows and columns stay square to the screen, so Up still
// rolls up the screen and a swipe goes the way it looks (Topple's rule).
//
// Every colour is a stage token, read off the page through a hidden probe at
// draw time, so the board follows the light switch and wears the Logic
// category, Topple's look: the die is the category accent with pips in its
// on-ramp ink, the floor is the ink mixed into the ground, cracked squares are
// the accent held well below the die's strength with cracks drawn on, and the
// numbered squares say their state three ways (number, outline, lock or tick)
// so nothing rests on colour alone.
//
// The roll is a real quarter turn about the die's leading bottom edge. A
// refused roll (off the floor, or a numbered square that is not ready) tips the
// die a few degrees and settles back. A cracked square crumbles as the die
// leaves it. A win hops the die on the last square.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Undo2, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { step } from '@/lib/roll-engine';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const TW = 52;            // one square, left to right
const TH = 36;            // one square, top to bottom (depth is foreshortened)
const KX = 20;            // the lean: one unit of height shifts this far LEFT
const TZ = 34;            // how far one unit of height rises
const SLAB = 0.32;        // tile thickness, in die units
const GAP = 0.05;         // the seam between two tiles
const PAD = 14;
const ROLL_MS = 200;
const BUMP_MS = 220;
const CRUMBLE_MS = 560;
const WIN_MS = 1100;

const VIEW = (() => { const v = [KX / TW, TZ / TH, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const LIGHT = (() => { const v = [0.35, -0.55, 1]; const m = Math.hypot(...v); return v.map((c) => c / m); })();

const TOKENS = {
  ground: 'var(--stg-ground, #0b0f1a)',
  tile: 'color-mix(in srgb, var(--stg-ink, #e9edf4) 24%, var(--stg-ground, #0b0f1a))',
  frag: 'color-mix(in srgb, var(--stg-acc, #bef264) 42%, var(--stg-ground, #0b0f1a))',
  next: 'color-mix(in srgb, var(--stg-acc, #bef264) 22%, color-mix(in srgb, var(--stg-ink, #e9edf4) 24%, var(--stg-ground, #0b0f1a)))',
  lit: 'color-mix(in srgb, var(--stg-acc, #bef264) 62%, var(--stg-ground, #0b0f1a))',
  die: 'var(--stg-acc, #bef264)',
  pip: 'var(--stg-onramp, #08222e)',
  mark: 'var(--stg-acc-ink, var(--stg-acc, #bef264))',
  mute: 'var(--stg-mute, #8b95a8)',
  ink: 'var(--stg-ink, #e9edf4)',
};

const CSS = `
.rl{font-family:${SANS};}
.rl-meter{max-width:620px;margin:0 auto 14px;}
.rl-mhead{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.rl-mhead b{font-weight:800;color:var(--stg-ink,#e9edf4);}
.rl-mhead .rl-mv{font-size:16px;color:var(--stg-acc-ink,var(--stg-acc));}
.rl-mtrack{position:relative;height:10px;border-radius:3px;background:var(--stg-line2,rgba(255,255,255,.17));margin-top:8px;}
.rl-mfill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;transition:width .18s ease-out;}
.rl-mtick{position:absolute;top:-4px;width:2px;height:18px;}
.rl-mlabs{position:relative;height:14px;margin-top:3px;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
.rl-mlabs span{position:absolute;white-space:nowrap;}
.rl-panel{max-width:620px;margin:0 auto;background:var(--stg-surf,rgba(255,255,255,.045));border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:20px;padding:18px 16px 14px;}
.rl-seq{display:flex;justify-content:center;gap:8px;margin:0 0 10px;flex-wrap:wrap;}
.rl-sq{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;border:1.5px solid var(--stg-line2,rgba(255,255,255,.17));color:var(--stg-mute,#8b95a8);}
.rl-sq.next{border:2px dashed var(--stg-acc-ink,var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.rl-sq.lit{background:var(--stg-acc);border-color:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.rl-canvas{display:block;width:100%;height:auto;margin:0 auto;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.rl-probe{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;}
.rl-row{display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:12px;border-top:1px solid var(--stg-line,rgba(255,255,255,.11));flex-wrap:wrap;}
.rl-say{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:3px;}
.rl-say1{font-size:15px;font-weight:700;line-height:1.4;color:var(--stg-ink,#e9edf4);}
.rl-say2{font-size:12px;font-weight:600;line-height:1.45;color:var(--stg-mute,#8b95a8);}
.rl-pad{display:grid;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(3,44px);gap:5px;flex:0 0 auto;}
.rl-key{position:relative;font-family:${SANS};border:1.5px solid var(--stg-mute2,#78859d);background:transparent;color:var(--stg-ink,#e9edf4);border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
.rl-key:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.rl-key:active:not(:disabled){background:var(--stg-acc);color:var(--stg-onramp,#08222e);border-color:var(--stg-acc);}
.rl-key.lights{border:2px solid var(--stg-acc-ink,var(--stg-acc));color:var(--stg-acc-ink,var(--stg-acc));}
.rl-key.lock{opacity:.55;border-style:dashed;}
.rl-key:disabled{opacity:.3;cursor:default;}
.rl-key i{position:absolute;right:4px;bottom:2px;font-style:normal;font-size:10px;font-weight:800;}
.rl-acts{display:flex;gap:8px;flex-wrap:wrap;}
.rl-btn{font-family:${SANS};font-weight:700;font-size:14px;background:transparent;color:var(--stg-ink2,#aab5c7);border:1.5px solid var(--stg-mute2,#78859d);border-radius:12px;padding:0 16px;min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;}
.rl-btn:hover:not(:disabled){background:var(--stg-surf2,rgba(255,255,255,.08));}
.rl-btn:disabled{opacity:.45;cursor:default;}
.rl-foot{max-width:620px;margin:10px auto 0;display:flex;justify-content:space-between;align-items:center;gap:12px;}
.rl-rule{font-size:12px;font-weight:600;color:var(--stg-mute,#8b95a8);line-height:1.45;}
.rl-giveup{min-height:44px;background:none;border:none;cursor:pointer;font-family:${SANS};font-weight:700;font-size:12.5px;text-decoration:underline;text-underline-offset:3px;display:inline-flex;align-items:center;gap:5px;padding:0 4px;flex:0 0 auto;}
.rl-key:focus-visible,.rl-btn:focus-visible,.rl-giveup:focus-visible{outline:2px solid var(--stg-acc-ink,var(--stg-acc));outline-offset:2px;}
@media(max-width:560px){
  .rl-panel{background:transparent;border:0;border-radius:0;padding:2px 0 0;}
  .rl-row{border-top:0;justify-content:center;}
  .rl-say{flex-basis:100%;text-align:center;}
  .rl-pad{grid-template-columns:repeat(3,58px);grid-template-rows:repeat(3,50px);}
  .rl-acts{flex-direction:column;}
  .rl-rule{display:none;}
  .rl-foot{justify-content:flex-end;margin-top:4px;}
}
`;

const PIPS = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]],
};

// Rolls so far against perfect and par, the Topple meter.
function RollMeter({ used, par, perfect }) {
  const max = Math.max(par + (par - perfect), used, par + 1);
  const pct = (v) => Math.max(0, Math.min(100, (v / max) * 100));
  const over = used > par;
  return (
    <div className="rl-meter" role="meter" aria-label="Rolls" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used}>
      <div className="rl-mhead">
        <span>Rolls <b className="rl-mv">{used}</b></span>
        <span>Perfect <b>{perfect}</b> &middot; Par <b>{par}</b></span>
      </div>
      <div className="rl-mtrack">
        <div className="rl-mfill" style={{ width: `${pct(used)}%`, background: 'var(--stg-acc-ink, var(--stg-acc))', opacity: over ? 0.7 : 1 }} />
        <span className="rl-mtick" style={{ left: `calc(${pct(perfect)}% - 1px)`, background: 'var(--stg-ink, #e9edf4)' }} />
        <span className="rl-mtick" style={{ left: `calc(${pct(par)}% - 1px)`, background: 'var(--stg-mute, #8b95a8)' }} />
      </div>
      <div className="rl-mlabs">
        <span style={{ right: `calc(${100 - pct(perfect)}% + 5px)`, color: 'var(--stg-ink, #e9edf4)' }}>Perfect</span>
        <span style={{ left: `calc(${pct(par)}% + 5px)`, color: 'var(--stg-mute, #8b95a8)' }}>Par</span>
      </div>
    </div>
  );
}

function isDark(rgb) {
  const m = String(rgb).match(/[\d.]+/g);
  if (!m || m.length < 3) return true;
  const [r, g, b] = m.slice(0, 3).map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Rotate a point about the die's leading bottom edge for a roll in `dir`.
function rotAbout(p, dir, a, x0, x1, y0, y1) {
  const c = Math.cos(a), s = Math.sin(a);
  let [x, y, z] = p;
  if (dir === 'R') { const u = x - x1; x = x1 + u * c + z * s; z = -u * s + z * c; }
  else if (dir === 'L') { const u = x - x0; x = x0 + u * c - z * s; z = u * s + z * c; }
  else if (dir === 'D') { const u = y - y1; y = y1 + u * c + z * s; z = -u * s + z * c; }
  else if (dir === 'U') { const u = y - y0; y = y0 + u * c - z * s; z = u * s + z * c; }
  return [x, y, z];
}

export default function RollBoard({
  P, state, anim, onAnimEnd, playing, used, par, perfect,
  onMove, onUndo, onRestart, canUndo, armed, onGiveUp, doneLine, themeKey, won,
}) {
  const cvRef = useRef(null);
  const probeRef = useRef(null);
  const colors = useRef(null);
  const frame = useRef(null);
  const crumbs = useRef([]);
  const winT = useRef(null);
  const [, force] = useState(0);

  const W = P.w * TW + KX * 1.1 + PAD * 2 + SLAB * KX + 6;
  const H = P.h * TH + TZ * 1.15 + SLAB * TZ + PAD * 2 + 10;
  const OX = PAD + KX * 1.1 + 2;
  const OY = PAD + TZ * 1.15;
  const pr = useCallback((x, y, z) => [OX + x * TW - z * KX, OY + y * TH - z * TZ], [OX, OY]);

  const readColors = useCallback(() => {
    const el = probeRef.current;
    if (!el) return;
    const out = {};
    for (const [k, v] of Object.entries(TOKENS)) { el.style.color = v; out[k] = getComputedStyle(el).color; }
    colors.current = out;
  }, []);

  // a crumble starts the moment the roll that leaves the square starts
  useEffect(() => {
    if (anim && anim.crumble) crumbs.current = [...crumbs.current.filter((c) => c.id !== anim.id), { id: anim.id, x: anim.crumble[0], y: anim.crumble[1], t0: anim.t0 }];
  }, [anim]);
  useEffect(() => { if (won && winT.current == null) winT.current = performance.now(); if (!won) winT.current = null; }, [won]);
  // a restart or an undo can mend a crumbled square; drop any crumble for a square still whole
  useEffect(() => {
    crumbs.current = crumbs.current.filter((c) => (state.broken >> P.crackBit[c.y * P.w + c.x]) & 1);
  }, [state, P]);

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
    const sheen = (y0, y1, top, bottom) => {
      const gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, top); gr.addColorStop(1, bottom);
      ctx.fillStyle = gr; ctx.fill();
    };

    let a = null;
    if (anim) {
      const t = now - anim.t0;
      if (anim.result === 'bump') a = { phase: 'bump', k: Math.min(1, t / BUMP_MS) };
      else a = { phase: 'roll', k: ease(Math.min(1, t / ROLL_MS)) };
    }
    // what the board shows: during a roll, the state it is rolling FROM, so a
    // square does not light before the die has landed on it
    const S = anim && anim.from ? anim.from : state;
    const broken = (x, y) => P.crackBit[y * P.w + x] != null && (S.broken >> P.crackBit[y * P.w + x]) & 1;

    // 1. one soft shadow under the whole floor
    ctx.save();
    ctx.shadowColor = dark ? 'rgba(0,0,0,.55)' : 'rgba(20,30,50,.22)';
    ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.ground;
    ctx.beginPath();
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (P.grid[y][x] === '.' || broken(x, y)) continue;
      const q = [pr(x + GAP, y + GAP, 0), pr(x + 1 - GAP, y + GAP, 0), pr(x + 1 - GAP, y + 1 - GAP, -SLAB), pr(x + GAP, y + 1 - GAP, -SLAB)];
      ctx.moveTo(...q[0]); ctx.lineTo(...q[1]); ctx.lineTo(...q[2]); ctx.lineTo(...q[3]); ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // 2. a tile: right side, front, top
    const tile = (x, y, top, z = 0, opts = {}) => {
      const g = GAP, x0 = x + g, x1 = x + 1 - g, y0 = y + g, y1 = y + 1 - g;
      const side = [pr(x1, y0, z), pr(x1, y1, z), pr(x1, y1, z - SLAB), pr(x1, y0, z - SLAB)];
      poly(side, top, 0.46);
      const f = [pr(x0, y1, z), pr(x1, y1, z), pr(x1, y1, z - SLAB), pr(x0, y1, z - SLAB)];
      poly(f, top, 0.32);
      sheen(f[0][1], f[2][1], 'rgba(0,0,0,0)', 'rgba(0,0,0,.22)');
      const t = [pr(x0, y0, z), pr(x1, y0, z), pr(x1, y1, z), pr(x0, y1, z)];
      poly(t, top, 0);
      sheen(t[0][1], t[3][1], dark ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.35)', 'rgba(255,255,255,0)');
      ctx.strokeStyle = dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t[0][0] + 1, t[0][1] + 0.5); ctx.lineTo(t[1][0] - 1, t[1][1] + 0.5); ctx.stroke();
      if (opts.cracks) {
        ctx.strokeStyle = dark ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.42)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(...pr(x + 0.18, y + 0.28, z)); ctx.lineTo(...pr(x + 0.42, y + 0.46, z)); ctx.lineTo(...pr(x + 0.38, y + 0.62, z)); ctx.lineTo(...pr(x + 0.5, y + 0.84, z));
        ctx.moveTo(...pr(x + 0.42, y + 0.46, z)); ctx.lineTo(...pr(x + 0.66, y + 0.38, z)); ctx.lineTo(...pr(x + 0.84, y + 0.5, z));
        ctx.moveTo(...pr(x + 0.66, y + 0.38, z)); ctx.lineTo(...pr(x + 0.7, y + 0.18, z));
        ctx.stroke();
      }
      const [cx, cy] = pr(x + 0.5, y + 0.5, z);
      if (opts.num) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (opts.kind === 'lit') {
          ctx.strokeStyle = C.pip; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx - 9, cy + 1); ctx.lineTo(cx - 2, cy + 7); ctx.lineTo(cx + 10, cy - 6); ctx.stroke();
        } else {
          ctx.font = `800 ${opts.kind === 'next' ? 22 : 18}px Manrope, system-ui, sans-serif`;
          ctx.fillStyle = opts.kind === 'next' ? C.mark : C.mute;
          ctx.fillText(opts.num, cx, cy + 1);
          if (opts.kind === 'next') {
            ctx.strokeStyle = C.mark; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
            path([pr(x0 + 0.07, y0 + 0.07, z), pr(x1 - 0.07, y0 + 0.07, z), pr(x1 - 0.07, y1 - 0.07, z), pr(x0 + 0.07, y1 - 0.07, z)]);
            ctx.stroke(); ctx.setLineDash([]);
          } else {
            // a small lock beside a number that is not ready yet
            ctx.fillStyle = C.mute; ctx.fillRect(cx + 9, cy + 4, 7, 5);
            ctx.strokeStyle = C.mute; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.arc(cx + 12.5, cy + 4, 2.4, Math.PI, 0); ctx.stroke();
          }
        }
      }
    };

    const drawRow = (y) => {
      for (let x = 0; x < P.w; x++) {
        const c = P.grid[y][x];
        if (c === '.') continue;
        if (c === 'C') {
          if (broken(x, y)) {
            const cr = crumbs.current.find((q) => q.x === x && q.y === y);
            if (cr) {
              const t = Math.max(0, Math.min(1, (now - cr.t0 - ROLL_MS * 0.4) / CRUMBLE_MS));
              if (t < 1) { ctx.globalAlpha = 1 - t; tile(x, y, C.frag, -t * t * 2.2, { cracks: true }); ctx.globalAlpha = 1; }
            }
            continue;
          }
          // the square the die is rolling off crumbles as it goes
          if (a && a.phase === 'roll' && anim.crumble && anim.crumble[0] === x && anim.crumble[1] === y) {
            const t = Math.max(0, (now - anim.t0 - ROLL_MS * 0.4) / CRUMBLE_MS);
            ctx.globalAlpha = Math.max(0, 1 - t); tile(x, y, C.frag, -t * t * 2.2, { cracks: true }); ctx.globalAlpha = 1;
            continue;
          }
          tile(x, y, C.frag, 0, { cracks: true });
          continue;
        }
        if (c >= '1' && c <= '6') {
          const v = +c;
          const kind = v < S.k ? 'lit' : v === S.k ? 'next' : 'lock';
          tile(x, y, kind === 'lit' ? C.lit : kind === 'next' ? C.next : C.tile, 0, { num: c, kind });
          continue;
        }
        tile(x, y, C.tile);
      }
    };

    // 3. the die
    const drawDie = (s, dir, th, dz) => {
      const e = 0.05, x0 = s.x + e, x1 = s.x + 1 - e, y0 = s.y + e, y1 = s.y + 1 - e, h = 1 - 2 * e;
      const F = [
        { p: [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], n: [0, 0, 1], v: s.t },
        { p: [[x0, y1, h], [x1, y1, h], [x1, y1, 0], [x0, y1, 0]], n: [0, 1, 0], v: 7 - s.n },
        { p: [[x1, y0, h], [x0, y0, h], [x0, y0, 0], [x1, y0, 0]], n: [0, -1, 0], v: s.n },
        { p: [[x1, y1, h], [x1, y0, h], [x1, y0, 0], [x1, y1, 0]], n: [1, 0, 0], v: s.e },
        { p: [[x0, y0, h], [x0, y1, h], [x0, y1, 0], [x0, y0, 0]], n: [-1, 0, 0], v: 7 - s.e },
        { p: [[x0, y1, 0], [x1, y1, 0], [x1, y0, 0], [x0, y0, 0]], n: [0, 0, -1], v: 7 - s.t },
      ];
      const px0 = s.x, px1 = s.x + 1, py0 = s.y, py1 = s.y + 1;
      const tr = (q) => { const r = dir && th ? rotAbout(q, dir, th, px0, px1, py0, py1) : q; return [r[0], r[1], r[2] + dz]; };
      const trn = (n) => (dir && th ? rotAbout(n, dir, th, 0, 0, 0, 0) : n);
      // contact shadow, fading as the die rises
      const sh = [pr(x0 - 0.02, y0 + 0.05, 0), pr(x1 + 0.04, y0 + 0.05, 0), pr(x1 + 0.04, y1 + 0.1, 0), pr(x0 - 0.02, y1 + 0.1, 0)];
      const off = dir === 'R' ? th / Math.PI : dir === 'L' ? -th / Math.PI : 0;
      const offy = dir === 'D' ? th / Math.PI : dir === 'U' ? -th / Math.PI : 0;
      ctx.save();
      ctx.globalAlpha = Math.max(0.08, (dark ? 0.5 : 0.28) - dz * 0.3);
      ctx.fillStyle = '#000'; ctx.filter = 'blur(3px)';
      ctx.translate(off * TW, offy * TH);
      path(sh); ctx.fill();
      ctx.restore();
      const faces = F.map((f) => ({ p: f.p.map(tr), n: trn(f.n), v: f.v }))
        .filter((f) => f.n[0] * VIEW[0] + f.n[1] * VIEW[1] + f.n[2] * VIEW[2] > 1e-4);
      for (const f of faces) {
        const lit = f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2];
        const sp = f.p.map((q) => pr(q[0], q[1], q[2]));
        poly(sp, C.die, lit > 0.8 ? -0.04 : Math.max(0, (0.72 - lit) * 0.4), dark ? 'rgba(0,0,0,.42)' : 'rgba(0,0,0,.32)', 1.1);
        const ys2 = sp.map((q) => q[1]);
        if (f.n[2] > 0.7) { path(sp); sheen(Math.min(...ys2), Math.max(...ys2), 'rgba(255,255,255,.30)', 'rgba(255,255,255,.06)'); }
        const bl = (u, v) => {
          const [a0, a1, a2, a3] = f.p;
          return pr(...[0, 1, 2].map((i) => (1 - u) * (1 - v) * a0[i] + u * (1 - v) * a1[i] + u * v * a2[i] + (1 - u) * v * a3[i]));
        };
        ctx.fillStyle = C.pip;
        for (const [u, v] of PIPS[f.v]) {
          ctx.beginPath();
          for (let i = 0; i < 14; i++) { const t = (i / 14) * Math.PI * 2; const q = bl(u + 0.092 * Math.cos(t), v + 0.092 * Math.sin(t)); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
          ctx.closePath(); ctx.fill();
        }
      }
    };

    // 4. back to front, row by row, the die right after the last row it stands on
    let job = null, jobRow = P.h - 1;
    if (a && a.phase === 'roll') {
      const k = a.k;
      job = () => drawDie(anim.from, anim.dir, k * Math.PI / 2, Math.sin(k * Math.PI) * 0.06);
      jobRow = Math.max(anim.from.y, anim.to.y);
    } else if (a && a.phase === 'bump') {
      const k = Math.sin(a.k * Math.PI) * 0.22;
      job = () => drawDie(state, anim.dir, k, 0);
      jobRow = state.y;
    } else {
      let dz = 0;
      if (won && winT.current != null) {
        const t = (now - winT.current) / 1000;
        dz = t < WIN_MS / 1000 ? Math.abs(Math.sin(t * Math.PI * 2.7)) * Math.max(0, 0.6 - t * 0.45) : 0;
      }
      job = () => drawDie(state, null, 0, dz);
      jobRow = state.y;
    }
    for (let y = 0; y < P.h; y++) {
      drawRow(y);
      if (job && y === jobRow) { job(); job = null; }
    }
    if (job) job();
  }, [P, anim, state, pr, W, H, won]);

  useEffect(() => { readColors(); force((n) => n + 1); }, [readColors, themeKey]);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const on = () => { readColors(); draw(performance.now()); };
    mq && mq.addEventListener && mq.addEventListener('change', on);
    return () => { mq && mq.removeEventListener && mq.removeEventListener('change', on); };
  }, [readColors, draw]);

  // the animation loop: runs while a roll plays, a square crumbles, or the die hops
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const total = anim ? (anim.result === 'bump' ? BUMP_MS : ROLL_MS) : 0;
    if (reduce) {
      crumbs.current = [];
      if (won) winT.current = -1e9;
      draw(performance.now() + 1e6);
      if (anim) { const id = setTimeout(() => onAnimEnd(anim.id), 40); return () => clearTimeout(id); }
      return undefined;
    }
    let ended = false;
    const tick = (now) => {
      draw(now);
      if (anim && !ended && now - anim.t0 >= total) { ended = true; onAnimEnd(anim.id); return; }
      const busy = (anim && !ended) || crumbs.current.some((c) => now - c.t0 < CRUMBLE_MS + ROLL_MS) || (won && winT.current != null && now - winT.current < WIN_MS);
      if (busy) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [anim, draw, onAnimEnd, won]);
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

  const nextNum = state.k;
  const say1 = !playing ? doneLine
    : nextNum <= P.N ? `Light square ${nextNum} next: roll onto it with a ${nextNum} on top.` : 'Every square is lit.';
  const say2 = playing
    ? 'A numbered square stays shut until it is next and your roll would land the right number on top. Orange squares crumble once you leave them.'
    : null;
  // What each pad key would do from here, so a refused roll can be seen coming.
  const keyState = (d) => {
    if (!playing) return 'off';
    const r = step(P, state, d);
    if (r.result === 'edge') return 'edge';
    if (r.result === 'order' || r.result === 'face') return 'lock';
    if (r.lit || r.result === 'win') return 'lights';
    return 'ok';
  };
  const key = (d, Icon, area, label) => {
    const ks = keyState(d);
    return (
      <button type="button" className={`rl-key${ks === 'lights' ? ' lights' : ''}${ks === 'lock' ? ' lock' : ''}`} style={{ gridArea: area }}
        disabled={!playing || ks === 'edge'} onClick={() => onMove(d)}
        aria-label={`${label}${ks === 'lights' ? `, lights square ${nextNum}` : ks === 'lock' ? ', blocked' : ks === 'edge' ? ', off the floor' : ''}`}>
        <Icon size={22} strokeWidth={2.6} />
        {ks === 'lights' && <i>{nextNum}</i>}
      </button>
    );
  };

  return (
    <div className="rl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <RollMeter used={used} par={par} perfect={perfect} />
      <div className="stg-board rl-board">
        <div className="rl-panel" style={{ position: 'relative' }}>
          <span ref={probeRef} className="rl-probe" aria-hidden="true" />
          <div className="rl-seq" aria-label="Squares to light, in order">
            {Array.from({ length: P.N }, (_, i) => i + 1).map((v) => (
              <span key={v} className={`rl-sq${v < state.k ? ' lit' : v === state.k ? ' next' : ''}`}>{v < state.k ? '✓' : v}</span>
            ))}
          </div>
          <canvas ref={cvRef} className="rl-canvas"
            style={{ maxWidth: W * 1.4, aspectRatio: `${W} / ${H}` }}
            role="img" aria-label={`Roll board, ${P.w} by ${P.h}. The die shows ${state.t} on top. Square ${Math.min(nextNum, P.N)} is next.`}
            onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { sw.current = null; }} />
          <div className="rl-row">
            <div className="rl-say">
              <span className="rl-say1" aria-live="polite">{say1}</span>
              {say2 && <span className="rl-say2">{say2}</span>}
            </div>
            {playing && (
              <>
                <div className="rl-pad" style={{ gridTemplateAreas: '". u ." "l . r" ". d ."' }}>
                  {key('U', ArrowUp, 'u', 'Roll up')}
                  {key('L', ArrowLeft, 'l', 'Roll left')}
                  {key('R', ArrowRight, 'r', 'Roll right')}
                  {key('D', ArrowDown, 'd', 'Roll down')}
                </div>
                <div className="rl-acts">
                  <button type="button" className="rl-btn" onClick={onUndo} disabled={!canUndo} title="Take back the last roll. It still counts.">
                    <Undo2 size={16} strokeWidth={2.2} /> Undo
                  </button>
                  <button type="button" className="rl-btn" onClick={onRestart} disabled={!used} title="Put the die back on the start. Your rolls still count.">
                    <RotateCcw size={16} strokeWidth={2.2} /> Restart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {playing && (
        <div className="rl-foot">
          <span className="rl-rule">Light 1 to {P.N} in order, each with its own number on top.</span>
          <button type="button" className="rl-giveup" onClick={onGiveUp}
            style={{ color: armed ? 'var(--stg-bad, #fb7185)' : 'var(--stg-ink2, #aab5c7)' }}>
            <Eye size={13} /> {armed ? 'Tap again to give up and score nothing' : 'Give up'}
          </button>
        </div>
      )}
    </div>
  );
}
