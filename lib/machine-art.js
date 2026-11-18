// lib/machine-art.js: the drawing of Machine (see lib/machine-engine.js). Plain
// SVG built with createElementNS, so a board, a tray chip and a catalog demo all
// draw from the same code. Colours are CSS custom properties (--tk-*) set by the
// client for the light and dark looks. Trig is used freely here: nothing in this
// file feeds back into the simulation.
import { makeState, step, PX, PY } from './machine-engine';

export const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const DEG = 180 / Math.PI;
let uid = 0;

/* ---------- balls ---------- */
export function drawBall(g, kind) {
  const o = el('g', {}, g);
  const spin = el('g', {}, o);
  if (kind === 'bowling') {
    el('circle', { r: 24, fill: 'var(--tk-bowl)' }, spin);
    el('circle', { cx: 6, cy: -8, r: 3.6, fill: '#1d1430' }, spin);
    el('circle', { cx: 13, cy: -2, r: 3.6, fill: '#1d1430' }, spin);
    el('circle', { cx: 6, cy: 6, r: 4.2, fill: '#1d1430' }, spin);
    el('circle', { cx: -8, cy: -9, r: 8, fill: 'var(--tk-bowl-hi)', opacity: .5 }, o);
  } else if (kind === 'basket') {
    el('circle', { r: 22, fill: 'var(--tk-bb)' }, spin);
    const sm = { fill: 'none', stroke: 'var(--tk-bb-seam)', 'stroke-width': 2 };
    el('line', { x1: -22, y1: 0, x2: 22, y2: 0, ...sm }, spin);
    el('line', { x1: 0, y1: -22, x2: 0, y2: 22, ...sm }, spin);
    el('path', { d: 'M-15 -16 Q-5 0 -15 16', ...sm }, spin);
    el('path', { d: 'M15 -16 Q5 0 15 16', ...sm }, spin);
  } else if (kind === 'steel') {
    el('circle', { r: 15, fill: 'var(--tk-steelball)', stroke: 'var(--tk-steel-lo)', 'stroke-width': 1.5 }, spin);
    el('circle', { cx: -5, cy: -5, r: 5, fill: '#ffffff', opacity: .7 }, o);
  } else {
    el('circle', { r: 15, fill: 'var(--tk-tennis)' }, spin);
    el('path', { d: 'M-11 -10 Q0 0 -11 10', fill: 'none', stroke: 'var(--tk-tennis-seam)', 'stroke-width': 2.2 }, spin);
    el('path', { d: 'M11 -10 Q0 0 11 10', fill: 'none', stroke: 'var(--tk-tennis-seam)', 'stroke-width': 2.2 }, spin);
  }
  return { o, spin };
}

/* ---------- pieces ---------- */
const wood = { fill: 'var(--tk-wood)', stroke: 'var(--tk-wood-lo)', 'stroke-width': 2 };
const steel = { fill: 'var(--tk-steel)', stroke: 'var(--tk-steel-lo)', 'stroke-width': 1.5 };
export function drawPiece(L, p, refs) {
  const C = 60, a = PX(p), b = PY(p);
  const g = el('g', {}, L.mid);
  const r = refs[p.k] = { g };
  switch (p.t) {
    case 'shelf': {
      const w = p.w * C;
      el('rect', { x: a + 1, y: b, width: w - 2, height: 20, rx: 5, ...wood }, g);
      el('line', { x1: a + 8, y1: b + 6, x2: a + w - 8, y2: b + 6, stroke: 'var(--tk-wood-hi)', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      for (let i = 0; i < p.w; i += 2) el('line', { x1: a + i * C + 14, y1: b + 13, x2: a + i * C + 44, y2: b + 13, stroke: 'var(--tk-grain)', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g);
      const br = [a + 14, a + w - 14]; if (p.w >= 5) br.push(a + Math.floor(p.w / 2) * C + C / 2);
      for (const bx of br) el('path', { d: `M${bx - 6} ${b + 20} L${bx - 6} ${b + 44} L${bx + 4} ${b + 20}z`, ...steel, 'stroke-linejoin': 'round' }, g);
      break;
    }
    case 'crate':
      el('rect', { x: a + 3, y: b + 3, width: C - 6, height: C - 3, rx: 4, ...wood }, g);
      el('rect', { x: a + 9, y: b + 9, width: C - 18, height: C - 15, fill: 'none', stroke: 'var(--tk-wood-lo)', 'stroke-width': 2 }, g);
      el('line', { x1: a + 9, y1: b + C - 6, x2: a + C - 9, y2: b + 9, stroke: 'var(--tk-wood-lo)', 'stroke-width': 3 }, g);
      break;
    case 'wall':
      el('rect', { x: a, y: b, width: C, height: (p.h || 1) * C, fill: 'var(--tk-floor)', stroke: 'var(--tk-floor-lo)', 'stroke-width': 2 }, g);
      break;
    case 'post': {
      const px = p.side === 'r' ? a + C - 16 : a + 2;
      el('rect', { x: px, y: b + 4, width: 14, height: (p.h || 2) * C - 4, rx: 5, ...steel }, g);
      el('circle', { cx: px + 7, cy: b + 12, r: 2.5, fill: 'var(--tk-steel-lo)' }, g);
      el('circle', { cx: px + 7, cy: b + (p.h || 2) * C - 10, r: 2.5, fill: 'var(--tk-steel-lo)' }, g);
      break;
    }
    case 'floor': {
      el('rect', { x: a, y: b, width: p.w * C, height: C, fill: 'var(--tk-floor)' }, g);
      el('line', { x1: a, y1: b + 1, x2: a + p.w * C, y2: b + 1, stroke: 'var(--tk-floor-lo)', 'stroke-width': 2 }, g);
      for (let i = 0; i < p.w; i += 2) el('line', { x1: a + i * C + 10, y1: b + 30, x2: a + i * C + 50, y2: b + 30, stroke: 'var(--tk-floor-lo)', 'stroke-width': 1.5, opacity: .7 }, g);
      break;
    }
    case 'door': {
      const f = el('g', { style: `transform-origin:${a + 4}px ${b + 9}px;transition:transform .35s cubic-bezier(.3,1.4,.5,1)` }, g);
      el('rect', { x: a + 1, y: b, width: C - 2, height: 18, rx: 4, ...wood }, f);
      el('line', { x1: a + 8, y1: b + 6, x2: a + C - 8, y2: b + 6, stroke: 'var(--tk-wood-hi)', 'stroke-width': 3, 'stroke-linecap': 'round' }, f);
      el('circle', { cx: a + 4, cy: b + 9, r: 5, ...steel }, g);
      r.flap = f;
      break;
    }
    case 'button': {
      const f = p.face || 'l';
      if (f === 'u') {
        el('rect', { x: a + 8, y: b + C - 18, width: C - 16, height: 18, rx: 4, ...steel }, g);
        r.cap = el('rect', { x: a + 16, y: b + C - 28, width: C - 32, height: 12, rx: 5, fill: 'var(--tk-btn)', stroke: 'var(--tk-btn-lo)', 'stroke-width': 2, style: 'transition:transform .12s' }, g);
        r.push = 'translate(0,6px)';
      } else {
        const bx = f === 'l' ? a + 18 : a + 4;
        el('rect', { x: bx, y: b + 8, width: C - 22, height: C - 8, rx: 6, ...steel, 'stroke-width': 2 }, g);
        el('rect', { x: bx + 8, y: b + 18, width: C - 38, height: 6, rx: 3, fill: 'var(--tk-steel-lo)' }, g);
        r.cap = el('rect', { x: f === 'l' ? a + 6 : a + C - 20, y: b + 20, width: 14, height: 26, rx: 6, fill: 'var(--tk-btn)', stroke: 'var(--tk-btn-lo)', 'stroke-width': 2, style: 'transition:transform .12s' }, g);
        r.push = f === 'l' ? 'translate(8px,0)' : 'translate(-8px,0)';
      }
      break;
    }
    case 'plunger': {
      const pg = el('g', { style: 'transition:transform .15s' }, g);
      el('rect', { x: a + 2, y: b + 14, width: 34, height: 32, rx: 6, ...steel }, g);
      el('rect', { x: a + 34, y: b + 26, width: 20, height: 8, rx: 3, fill: 'var(--tk-steel-lo)' }, pg);
      el('rect', { x: a + 52, y: b + 12, width: 8, height: 36, rx: 3, fill: 'var(--tk-btn)', stroke: 'var(--tk-btn-lo)', 'stroke-width': 1.5 }, pg);
      r.plunger = pg;
      break;
    }
    case 'hoop': {
      const f = el('g', {}, L.front);
      el('rect', { x: a - 2, y: b - 3, width: C + 4, height: 7, rx: 3.5, fill: 'var(--tk-rim)' }, f);
      const net = el('g', { style: `transform-origin:${a + C / 2}px ${b}px;transition:transform .3s` }, f);
      const ns = { fill: 'none', stroke: 'var(--tk-net)', 'stroke-width': 2, 'stroke-linecap': 'round' };
      for (let k = 0; k <= 4; k++) el('path', { d: `M${a + 2 + k * 14} ${b + 4} L${a + 12 + k * 9} ${b + 44}`, ...ns }, net);
      for (let k = 0; k <= 4; k++) el('path', { d: `M${a + C - 2 - k * 14} ${b + 4} L${a + C - 12 - k * 9} ${b + 44}`, ...ns }, net);
      el('path', { d: `M${a + 6} ${b + 20} H${a + C - 6} M${a + 10} ${b + 34} H${a + C - 10}`, ...ns }, net);
      r.net = net;
      break;
    }
    case 'bucket': {
      const f = el('g', { style: `transform-origin:${a + C / 2}px ${b + C}px;transition:transform .2s` }, L.front);
      el('path', { d: `M${a + 6} ${b + 10} L${a + 10} ${b + C - 2} L${a + C - 10} ${b + C - 2} L${a + C - 6} ${b + 10}`, fill: 'none', stroke: 'var(--tk-steel-lo)', 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f);
      el('path', { d: `M${a + 8} ${b + 22} L${a + C - 8} ${b + 22}`, stroke: 'var(--tk-steel)', 'stroke-width': 3 }, f);
      el('path', { d: `M${a + 6} ${b + 10} Q${a + C / 2} ${b - 18} ${a + C - 6} ${b + 10}`, fill: 'none', stroke: 'var(--tk-steel)', 'stroke-width': 2 }, f);
      r.bucket = f;
      break;
    }
    case 'ramp': {
      const pts = p.dir === 'r' ? [[a, b + 4], [a, b + C], [a + C, b + C]] : [[a + C, b + 4], [a + C, b + C], [a, b + C]];
      el('polygon', { points: pts.map(q => q.join(',')).join(' '), ...wood, 'stroke-linejoin': 'round' }, g);
      const t = p.dir === 'r' ? [a + 2, b + 6, a + C - 4, b + C - 2] : [a + C - 2, b + 6, a + 4, b + C - 2];
      el('line', { x1: t[0], y1: t[1], x2: t[2], y2: t[3], stroke: 'var(--tk-wood-hi)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      for (let k = 1; k < 3; k++) {
        const f = k / 3;
        if (p.dir === 'r') el('line', { x1: a + 6, y1: b + C * f + 10, x2: a + C * f + 2, y2: b + C - 6, stroke: 'var(--tk-grain)', 'stroke-width': 1.5 }, g);
        else el('line', { x1: a + C - 6, y1: b + C * f + 10, x2: a + C - C * f - 2, y2: b + C - 6, stroke: 'var(--tk-grain)', 'stroke-width': 1.5 }, g);
      }
      break;
    }
    case 'spring': {
      el('rect', { x: a + 6, y: b + C - 10, width: C - 12, height: 8, rx: 3, fill: 'var(--tk-steel-lo)' }, g);
      const coil = el('g', { style: `transform-origin:${a + C / 2}px ${b + C - 10}px;transition:transform .12s` }, g);
      let d = `M${a + 16} ${b + C - 12}`;
      for (let i = 0; i < 5; i++) d += ` L${i % 2 ? a + 16 : a + C - 16} ${b + C - 12 - (i + 1) * ((C - 26) / 5)}`;
      el('path', { d, fill: 'none', stroke: 'var(--tk-spring)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, coil);
      const plate = el('rect', { x: a + 4, y: b + 6, width: C - 8, height: 9, rx: 4, fill: 'var(--tk-btn)', stroke: 'var(--tk-btn-lo)', 'stroke-width': 1.5, style: 'transition:transform .12s' }, g);
      r.coil = coil; r.plate = plate;
      break;
    }
    case 'belt': {
      const top = b + 2;
      el('rect', { x: a + 2, y: top, width: C - 4, height: 30, rx: 15, fill: 'var(--tk-belt)' }, g);
      el('circle', { cx: a + 17, cy: top + 15, r: 9, fill: 'var(--tk-belt-hi)' }, g);
      el('circle', { cx: a + C - 17, cy: top + 15, r: 9, fill: 'var(--tk-belt-hi)' }, g);
      const id = 'cl' + (uid++);
      const cp = el('clipPath', { id }, g);
      el('rect', { x: a + 4, y: top, width: C - 8, height: 30, rx: 15 }, cp);
      const cg = el('g', { 'clip-path': `url(#${id})` }, g);
      const ch = el('g', { class: 'belt-chev', style: `--chev-dx:${p.dir === 'l' ? -20 : 20}px` }, cg);
      for (let k = -1; k < 5; k++) {
        const cx = a + k * 20 + 6;
        const d = p.dir === 'l' ? `M${cx + 7} ${top + 9} L${cx} ${top + 15} L${cx + 7} ${top + 21}` : `M${cx} ${top + 9} L${cx + 7} ${top + 15} L${cx} ${top + 21}`;
        el('path', { d, fill: 'none', stroke: 'var(--tk-chev)', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ch);
      }
      if (!p.icon) {
        el('line', { x1: a + 12, y1: top + 30, x2: a + 8, y2: b + C - 2, stroke: 'var(--tk-steel)', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
        el('line', { x1: a + C - 12, y1: top + 30, x2: a + C - 8, y2: b + C - 2, stroke: 'var(--tk-steel)', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
      }
      break;
    }
    case 'bumper': {
      const f = el('g', { style: `transform-origin:${a + C / 2}px ${b + C / 2}px;transition:transform .1s` }, g);
      el('circle', { cx: a + C / 2, cy: b + C / 2, r: 18, fill: 'var(--tk-bumper)', stroke: 'var(--tk-bumper-lo)', 'stroke-width': 3 }, f);
      el('circle', { cx: a + C / 2, cy: b + C / 2, r: 9, fill: 'var(--tk-board)', stroke: 'var(--tk-bumper-lo)', 'stroke-width': 2 }, f);
      r.bump = f;
      break;
    }
    case 'fan': {
      const on = el('g', { class: p.on === false ? '' : 'fanOn spinning' }, g);
      r.fan = on;
      const air = el('g', { class: 'air', style: p.dir === 'u' ? '--ax:0px;--ay:-70px' : `--ax:${p.dir === 'l' ? -70 : 70}px;--ay:0px` }, on);
      const reach = (p.reach || 4) * C;
      for (let i = 0; i < 6; i++) {
        if (p.dir === 'u') { const x = a + 14 + (i % 3) * 16, y = b + C - 30 - (i * 37) % (reach - 40); el('line', { x1: x, y1: y, x2: x, y2: y - 14, stroke: 'var(--tk-air)', 'stroke-width': 2.5, 'stroke-linecap': 'round', style: `animation-delay:${-i * .13}s` }, air); }
        else { const d = p.dir === 'l' ? -1 : 1, x = a + C / 2 + d * (24 + (i * 37) % (reach - 50)), y = b + 18 + (i % 3) * 13; el('line', { x1: x, y1: y, x2: x + d * 14, y2: y, stroke: 'var(--tk-air)', 'stroke-width': 2.5, 'stroke-linecap': 'round', style: `animation-delay:${-i * .13}s` }, air); }
      }
      if (p.dir === 'u') {
        el('rect', { x: a + 8, y: b + C - 24, width: C - 16, height: 24, rx: 5, ...steel }, g);
        const bl = el('g', { class: 'fanblades' }, on);
        el('ellipse', { cx: a + C / 2 - 9, cy: b + C - 28, rx: 10, ry: 3.5, fill: 'var(--tk-steel-lo)' }, bl);
        el('ellipse', { cx: a + C / 2 + 9, cy: b + C - 28, rx: 10, ry: 3.5, fill: 'var(--tk-steel-lo)' }, bl);
        el('circle', { cx: a + C / 2, cy: b + C - 28, r: 3.5, fill: 'var(--tk-btn)' }, g);
      } else {
        const fx = p.dir === 'r' ? a + 4 : a + C - 28;
        el('rect', { x: fx, y: b + 10, width: 24, height: C - 10, rx: 5, ...steel }, g);
        const cx = p.dir === 'r' ? a + 30 : a + C - 30, cy = b + 30;
        el('circle', { cx, cy, r: 17, fill: 'none', stroke: 'var(--tk-steel-lo)', 'stroke-width': 2.5 }, g);
        const bl = el('g', { class: 'fanblades' }, on);
        for (let k = 0; k < 3; k++) { const an = k * 2.094; el('ellipse', { cx: cx + Math.cos(an) * 8, cy: cy + Math.sin(an) * 8, rx: 7, ry: 3.2, transform: `rotate(${an * DEG} ${cx + Math.cos(an) * 8} ${cy + Math.sin(an) * 8})`, fill: 'var(--tk-steel-lo)' }, bl); }
        el('circle', { cx, cy, r: 3.5, fill: 'var(--tk-btn)' }, g);
      }
      break;
    }
    case 'seesaw': {
      const piv = [a + C, b + C - 28];
      el('polygon', { points: `${a + C - 12},${b + C} ${a + C},${b + C - 26} ${a + C + 12},${b + C}`, ...steel }, g);
      const plank = el('g', { style: `transform-origin:${piv[0]}px ${piv[1]}px;transition:transform .16s cubic-bezier(.3,1.3,.5,1)` }, g);
      el('rect', { x: a + 2, y: piv[1] - 5, width: 2 * C - 4, height: 10, rx: 4, ...wood }, plank);
      el('rect', { x: a + 2, y: piv[1] - 21, width: 7, height: 16, rx: 3, ...wood }, plank);
      el('rect', { x: a + 2 * C - 9, y: piv[1] - 21, width: 7, height: 16, rx: 3, ...wood }, plank);
      el('circle', { cx: piv[0], cy: piv[1], r: 4, fill: 'var(--tk-steel-lo)' }, g);
      r.plank = plank;
      r.setTilt = t => { const an = Math.atan2(36, 2 * C - 8) * DEG; plank.style.transform = `rotate(${t < 0 ? -an : an}deg)`; };
      r.setTilt(p.tilt || -1);
      break;
    }
    case 'pipe': {
      const R = p.dir === 'r';
      const d = R ? `M${a + 16} ${b} L${a + 16} ${b + 22} Q${a + 16} ${b + 44} ${a + 38} ${b + 44} L${a + C} ${b + 44}` : `M${a + C - 16} ${b} L${a + C - 16} ${b + 22} Q${a + C - 16} ${b + 44} ${a + C - 38} ${b + 44} L${a} ${b + 44}`;
      el('path', { d, fill: 'none', stroke: 'var(--tk-pipe-lo)', 'stroke-width': 30, 'stroke-linecap': 'butt' }, g);
      el('path', { d, fill: 'none', stroke: 'var(--tk-pipe)', 'stroke-width': 24, 'stroke-linecap': 'butt' }, g);
      el('rect', { x: R ? a + 2 : a + C - 30, y: b, width: 28, height: 6, rx: 2, fill: 'var(--tk-pipe-lo)' }, g);
      r.pipe = el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0, 'stroke-linecap': 'round', style: 'transition:opacity .2s' }, g);
      break;
    }
    case 'magnet': {
      const cx = a + C / 2;
      el('path', { d: `M${a + 12} ${b + 46} L${a + 12} ${b + 26} A18 18 0 0 1 ${a + C - 12} ${b + 26} L${a + C - 12} ${b + 46}`, fill: 'none', stroke: 'var(--tk-magnet)', 'stroke-width': 13, 'stroke-linecap': 'butt' }, g);
      el('rect', { x: a + 5.5, y: b + 40, width: 13, height: 10, fill: 'var(--tk-steel)' }, g);
      el('rect', { x: a + C - 18.5, y: b + 40, width: 13, height: 10, fill: 'var(--tk-steel)' }, g);
      break;
    }
    case 'dominoes': {
      r.dom = [];
      for (let i = 0; i < p.n; i++) {
        const dx = p.dir === 'l' ? a + C - 14 - 10 - i * 26 : a + 14 + i * 26;
        const piv = p.dir === 'l' ? dx : dx + 10;
        const dg = el('g', { style: `transform-origin:${piv}px ${b + C}px;transition:transform .14s ease-in` }, g);
        el('rect', { x: dx, y: b + C - 46, width: 10, height: 46, rx: 2, fill: 'var(--tk-domino)' }, dg);
        el('circle', { cx: dx + 5, cy: b + C - 36, r: 1.8, fill: 'var(--tk-domino-dot)' }, dg);
        el('circle', { cx: dx + 5, cy: b + C - 12, r: 1.8, fill: 'var(--tk-domino-dot)' }, dg);
        el('line', { x1: dx + 2, y1: b + C - 23, x2: dx + 8, y2: b + C - 23, stroke: 'var(--tk-domino-dot)', 'stroke-width': 1.2 }, dg);
        r.dom.push(dg);
      }
      r.fallDeg = p.dir === 'l' ? -78 : 78;
      break;
    }
    case 'cannon': {
      const dir = p.dir === 'l' ? -1 : 1, cx = a + C / 2, cy = b + 40;
      const barrel = el('g', { style: `transform-origin:${cx}px ${cy}px;transition:transform .1s` }, g);
      el('rect', { x: cx - 8, y: cy - 11, width: 40, height: 22, rx: 8, fill: 'var(--tk-belt)', transform: `rotate(${dir > 0 ? -36 : -144} ${cx} ${cy})` }, barrel);
      el('circle', { cx, cy: cy + 6, r: 14, fill: 'var(--tk-wood)', stroke: 'var(--tk-wood-lo)', 'stroke-width': 2.5 }, g);
      el('circle', { cx, cy: cy + 6, r: 3.5, fill: 'var(--tk-wood-lo)' }, g);
      r.barrel = barrel; r.dir = dir;
      break;
    }
    case 'bell': {
      const cx = a + C / 2;
      el('rect', { x: cx - 2, y: b, width: 4, height: 12, fill: 'var(--tk-steel-lo)' }, g);
      const bl = el('g', { style: `transform-origin:${cx}px ${b + 10}px` }, g);
      el('path', { d: `M${cx - 18} ${b + 46} Q${cx - 18} ${b + 12} ${cx} ${b + 12} Q${cx + 18} ${b + 12} ${cx + 18} ${b + 46} Z`, fill: 'var(--tk-gold)', stroke: 'var(--tk-gold-lo)', 'stroke-width': 2 }, bl);
      el('circle', { cx, cy: b + 48, r: 4, fill: 'var(--tk-gold-lo)' }, bl);
      r.bell = bl;
      break;
    }
    case 'balloon': {
      const cx = a + C / 2, cy = b + 24;
      const bg = el('g', {}, g);
      el('path', { d: `M${cx} ${cy + 22} Q${cx - 6} ${cy + 34} ${cx + 2} ${cy + 46} Q${cx + 8} ${cy + 54} ${cx} ${b + C}`, fill: 'none', stroke: 'var(--tk-steel-lo)', 'stroke-width': 1.5 }, bg);
      el('ellipse', { cx, cy, rx: 19, ry: 22, fill: 'var(--tk-balloon)', stroke: 'var(--tk-balloon-lo)', 'stroke-width': 2 }, bg);
      el('path', { d: `M${cx - 4} ${cy + 22} L${cx + 4} ${cy + 22} L${cx} ${cy + 18}z`, fill: 'var(--tk-balloon-lo)' }, bg);
      el('ellipse', { cx: cx - 7, cy: cy - 8, rx: 5, ry: 7, fill: '#ffffff', opacity: .45 }, bg);
      bg.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 2200, iterations: Infinity });
      r.balloon = bg; r.cx = cx; r.cy = cy;
      break;
    }
    case 'glue':
      el('path', { d: `M${a + 2} ${b + C} L${a + 2} ${b + C - 8} Q${a + 10} ${b + C - 12} ${a + 18} ${b + C - 9} Q${a + 28} ${b + C - 13} ${a + 38} ${b + C - 9} Q${a + 48} ${b + C - 12} ${a + C - 2} ${b + C - 8} L${a + C - 2} ${b + C} Z`, fill: 'var(--tk-glue)', stroke: 'var(--tk-glue-lo)', 'stroke-width': 2 }, g);
      el('ellipse', { cx: a + 16, cy: b + C - 5, rx: 4, ry: 2, fill: '#ffffff', opacity: .5 }, g);
      break;
    case 'gate': {
      const cx = a + C / 2, dir = p.dir === 'l' ? -1 : 1;
      el('rect', { x: cx - 3, y: b - 2, width: 6, height: 8, rx: 2, ...steel }, g);
      const fl = el('g', { style: `transform-origin:${cx}px ${b + 2}px;transition:transform .2s` }, g);
      el('rect', { x: cx - 3, y: b + 2, width: 6, height: C - 4, rx: 3, fill: 'var(--tk-btn)', stroke: 'var(--tk-btn-lo)', 'stroke-width': 1.5 }, fl);
      el('path', { d: `M${cx + dir * 8} ${b + 24} l${dir * 8} 6 l${-dir * 8} 6`, fill: 'none', stroke: 'var(--tk-btn-lo)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      r.gate = fl; r.dir = dir;
      break;
    }
  }
  return r;
}

/* ---------- a board: static layers, parts, balls, playback ---------- */
export function makeBoard(svg, level) {
  const C = 60, W = level.w, H = level.h;
  const B = { svg, level, W, H, refs: {}, ballEls: {} };
  svg.setAttribute('viewBox', `0 0 ${W * C} ${H * C}`);
  B.draw = function (placed, opts = {}) {
    svg.innerHTML = '';
    B.refs = {};
    const defs = el('defs', {}, svg);
    const pid = 'pit' + (uid++);
    const pg = el('linearGradient', { id: pid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': 'var(--tk-pit)', 'stop-opacity': .55 }, pg);
    el('stop', { offset: 1, 'stop-color': 'var(--tk-pit)' }, pg);
    el('rect', { x: 0, y: 0, width: W * C, height: H * C, fill: 'var(--tk-board)' }, svg);
    B.grid = el('g', {}, svg);
    if (opts.grid) {
      for (let x = 1; x < W; x++) el('line', { x1: x * C, y1: 0, x2: x * C, y2: (H - 1) * C, stroke: 'var(--tk-grid)', 'stroke-width': 1 }, B.grid);
      for (let y = 1; y < H; y++) el('line', { x1: 0, y1: y * C, x2: W * C, y2: y * C, stroke: 'var(--tk-grid)', 'stroke-width': 1 }, B.grid);
    }
    if (level.pieces.some(p => p.t === 'floor')) {
      const fy = Math.max(...level.pieces.filter(p => p.t === 'floor').map(p => p.y));
      el('rect', { x: 0, y: fy * C, width: W * C, height: C, fill: `url(#${pid})` }, svg);
      // hazard edge on each pit
      for (let x = 0; x < W; x++) {
        const covered = level.pieces.some(p => (p.t === 'floor' && p.y === fy && x >= p.x && x < p.x + p.w) || ((p.t === 'hoop' || p.t === 'bucket') && p.x === x && p.y === fy));
        if (!covered) for (let k = 0; k < 4; k++) el('path', { d: `M${x * C + k * 16 - 4} ${fy * C + 2} l8 0 l-8 8 l-8 0z`, fill: 'var(--tk-chev)' }, svg);
      }
    }
    B.wires = el('g', {}, svg);
    B.trails = el('g', {}, svg);
    B.hover = el('g', {}, svg);
    B.mid = el('g', {}, svg);
    B.parts = el('g', {}, svg);
    B.balls = el('g', {}, svg);
    B.front = el('g', {}, svg);
    B.fx = el('g', {}, svg);
    B.hit = el('g', {}, svg);
    const L = { mid: B.mid, front: B.front };
    const all = level.pieces.map((p, i) => ({ ...p, k: i })).concat((placed || []).map((p, i) => ({ ...p, k: level.pieces.length + i, placed: true })));
    B.all = all;
    for (const p of all) {
      const Lp = p.placed ? { mid: B.parts, front: B.front } : L;
      const r = drawPiece(Lp, p, B.refs);
      if (p.placed && opts.popK === p.k) r.g.classList.add('pop'), r.g.style.transformOrigin = `${PX(p) + 30}px ${PY(p) + 30}px`;
    }
    // wires from buttons to what they work
    for (const p of all) {
      if (!p.wires) continue;
      for (const id of p.wires) {
        const q = all.find(z => z.id === id);
        if (!q) continue;
        const x1 = PX(p) + (p.face === 'l' ? C - 4 : p.face === 'r' ? 4 : C / 2), y1 = PY(p) + (p.face === 'u' ? C - 6 : 34);
        const x2 = q.x * C + C / 2, y2 = q.y * C + (q.t === 'door' ? 9 : C - 6);
        const midX = level.wireX !== undefined ? level.wireX : Math.max(x1, x2) + 24;
        const d = q.t === 'door' && level.wireX !== undefined ? `M${x1} ${y1} H${midX} V${y2} H${q.x * C + C}` : `M${x1} ${y1} V${Math.max(y1, y2) + 0} H${x2} V${y2}`;
        el('path', { d, fill: 'none', stroke: 'var(--tk-btn-lo)', 'stroke-width': 2.5, 'stroke-linejoin': 'round', opacity: .5 }, B.wires);
      }
    }
    B.ballEls = {};
    for (const b of level.balls) {
      const e = drawBall(el('g', {}, B.balls), b.kind);
      B.ballEls[b.id] = e;
    }
    const s0 = makeState(level, placed || []);
    B.setBalls(s0.balls.map(b => [b.x, b.y, 0, b.live]));
  };
  B.setBalls = function (arr) {
    level.balls.forEach((b, i) => {
      const e = B.ballEls[b.id], v = arr[i];
      if (!e) return;
      if (!v[3]) { e.o.setAttribute('opacity', 0); return; }
      e.o.setAttribute('opacity', 1);
      e.o.setAttribute('transform', `translate(${v[0].toFixed(2)},${v[1].toFixed(2)})`);
      e.spin.setAttribute('transform', `rotate(${(v[2] * DEG).toFixed(1)})`);
    });
  };
  B.record = function (placed, maxT) {
    const s = makeState(level, placed || []);
    if (maxT) s.maxT = maxT;
    const frames = [s.balls.map(b => [b.x, b.y, b.ang, b.live])];
    while (!s.done) { step(s); frames.push(s.balls.map(b => [b.x, b.y, b.ang, b.live])); }
    return { s, frames };
  };
  B.event = function (ev, s) {
    const r = B.refs[ev.k];
    if (ev.type === 'press' && r && r.cap) r.cap.style.transform = r.push;
    if (ev.type === 'open' && r && r.flap) r.flap.style.transform = 'rotate(80deg)';
    if (ev.type === 'boing' && r && r.coil) { r.coil.style.transform = 'scaleY(.45)'; r.plate.style.transform = 'translateY(18px)'; setTimeout(() => { r.coil.style.transform = 'scaleY(1.12)'; r.plate.style.transform = 'translateY(-4px)'; }, 120); setTimeout(() => { r.coil.style.transform = ''; r.plate.style.transform = ''; }, 260); }
    if (ev.type === 'bump' && r && r.bump) { r.bump.style.transform = 'scale(1.18)'; setTimeout(() => r.bump.style.transform = '', 110); }
    if (ev.type === 'seesaw' && r && r.setTilt) { const p = B.all[ev.k]; p._tilt = -(p._tilt || p.tilt || -1); r.setTilt(p._tilt); }
    if (ev.type === 'topple' && r && r.dom) r.toppleAt = ev.t;
    if (ev.type === 'fire' && r && r.barrel) { r.barrel.style.transform = `translateX(${-r.dir * 6}px)`; setTimeout(() => r.barrel.style.transform = '', 160); puff(B, B.all[ev.k]); }
    if (ev.type === 'ring' && r && r.bell) r.bell.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], { duration: 650 });
    if (ev.type === 'pop' && r && r.balloon) { r.balloon.style.opacity = 0; burst(B, r.cx, r.cy); }
    if (ev.type === 'pipe' && r && r.pipe) { r.pipe.setAttribute('opacity', .55); setTimeout(() => r.pipe.setAttribute('opacity', 0), 220); }
    if (ev.type === 'hoop' && r && r.net) { r.net.style.transform = 'scaleY(1.25)'; setTimeout(() => r.net.style.transform = '', 320); }
    if (ev.type === 'bucket' && r && r.bucket) r.bucket.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 420 });
    if (ev.type === 'fanon' && r && r.fan) r.fan.setAttribute('class', 'fanOn spinning');
  };
  B.tickPieces = function (t) {
    for (const k in B.refs) {
      const r = B.refs[k];
      if (r.dom && r.toppleAt !== undefined) r.dom.forEach((d, i) => { if (t - r.toppleAt >= i * 7) d.style.transform = `rotate(${r.fallDeg}deg)`; });
    }
  };
  // play a recording; onEnd(trails) when done
  B.play = function (rec, o = {}) {
    const stepsPerFrame = o.speed || 1;
    let i = 0, fired = 0, stopped = false;
    const evs = rec.s.events.slice().sort((x, y) => x.t - y.t);
    const tr = level.balls.map(() => []);
    function frame() {
      if (stopped) return;
      i = Math.min(i + stepsPerFrame, rec.frames.length - 1);
      while (fired < evs.length && evs[fired].t <= i) B.event(evs[fired++], rec.s);
      B.tickPieces(i);
      const f = rec.frames[i];
      B.setBalls(f);
      f.forEach((v, k) => { if (!v[3]) return; const last = tr[k][tr[k].length - 1]; if (!last || Math.abs(last[0] - v[0]) + Math.abs(last[1] - v[1]) > 5) tr[k].push([v[0], v[1]]); });
      if (i >= rec.frames.length - 1) { o.onEnd && o.onEnd(tr); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return { stop() { stopped = true; }, trails: tr };
  };
  B.drawTrails = function (tr) {
    B.trails.innerHTML = '';
    if (!tr) return;
    const cols = ['var(--tk-trail-a)', 'var(--tk-trail-b)', 'var(--tk-air)', 'var(--tk-glue-lo)'];
    tr.forEach((t, i) => { if (t.length < 2) return; el('path', { d: t.map((q, k) => (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' '), class: 'trail', stroke: cols[i % 4] }, B.trails); });
  };
  return B;
}
function puff(B, p) {
  const dir = p.dir === 'l' ? -1 : 1, x = PX(p) + 30 + dir * 30, y = PY(p) + 18;
  for (let k = 0; k < 3; k++) {
    const c = el('circle', { cx: x, cy: y, r: 6, fill: 'var(--tk-steel)', opacity: .7 }, B.fx);
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: .7 }, { transform: `translate(${dir * (8 + k * 8)}px,${-6 - k * 4}px) scale(2.2)`, opacity: 0 }], { duration: 500 + k * 80 }).onfinish = () => c.remove();
  }
}
function burst(B, x, y) {
  for (let k = 0; k < 8; k++) {
    const an = k * Math.PI / 4;
    const l = el('line', { x1: x + Math.cos(an) * 10, y1: y + Math.sin(an) * 10, x2: x + Math.cos(an) * 18, y2: y + Math.sin(an) * 18, stroke: 'var(--tk-balloon)', 'stroke-width': 3, 'stroke-linecap': 'round' }, B.fx);
    l.animate([{ opacity: 1, transform: 'translate(0,0)' }, { opacity: 0, transform: `translate(${Math.cos(an) * 12}px,${Math.sin(an) * 12}px)` }], { duration: 380 }).onfinish = () => l.remove();
  }
}
