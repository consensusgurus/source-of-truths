'use client';

// lib/machine-ui.js: the playing surface of Machine (app/machine/MachineClient.jsx
// mounts it). Built imperatively on one DOM node so the physics playback can run
// at 60fps without React in the loop. The client hands in the level, the saved
// parts, and three callbacks:
//   onParts(parts)  the player placed, moved, flipped or removed a part
//   onRun()         Run was pressed (one run is counted)
//   onEnd(won)      the run finished playing out
// The shell (app/SimpleDaily.jsx) owns the clock, the save, Give up and the
// ending; this file never knows about any of them.
//
// PLACEMENT IS FREE (owner, 2026-11-17: "placement should be more dynamic, too?
// rather than just big tiled grid?"): drag a part from the tray anywhere on the
// board, it snaps to 10px; drag it again to move it; tap it for Flip and Remove;
// drag it off the board to put it back. The ghost turns red where it would
// overlap something. A tap never costs anything.
//
// TAP TO PLACE, TOO (owner, 2026-11-17: "The drag and drop also needs ability
// to click and then click again on spot you want"). Tap a tray part and it is
// picked up (the chip lights); tap the board and it lands there, centred on the
// tap. Tap a placed part to select it, then tap an empty spot to move it there.
// Tapping the lit chip again puts it down.

import { makeState, pieceSegs, C } from './machine-engine';
import { el, NS, drawBall, drawPiece, makeBoard } from './machine-art';

const SNAP = 10;
const NAMES = { spring: 'Spring', ramp: 'Ramp', belt: 'Belt', bumper: 'Bumper', fan: 'Fan', glue: 'Glue pad', gate: 'Gate', pipe: 'Pipe', magnet: 'Magnet' };
export const partName = (t) => NAMES[t.t] || t.t;

export const MACHINE_CSS = `
.mach{--tk-board:#fbfaf7;--tk-grid:#ecebe6;--tk-wood:#dcc29a;--tk-wood-hi:#e8d4b2;--tk-wood-lo:#b89466;--tk-grain:#c9aa7c;--tk-floor:#d6d1c6;--tk-floor-lo:#bdb6a8;--tk-pit:#3a3f48;--tk-steel:#9aa3ae;--tk-steel-lo:#6f7884;--tk-belt:#3c424c;--tk-belt-hi:#5b636f;--tk-chev:#f2c94c;--tk-spring:#7f8a97;--tk-btn:#e05a5a;--tk-btn-lo:#a83b3b;--tk-rim:#e8743b;--tk-net:#9aa3ae;--tk-bowl:#5b3f8f;--tk-bowl-hi:#7a5cb0;--tk-bb:#e8833a;--tk-bb-seam:#6b3416;--tk-trail-a:#7a5cb0;--tk-trail-b:#e8833a;--tk-hover:#d9e8d0;--tk-bad:#fbd5dc;--tk-steelball:#c3cad3;--tk-tennis:#d7e86a;--tk-tennis-seam:#fbfdf2;--tk-glue:#bfe3c8;--tk-glue-lo:#7fbf90;--tk-gold:#e9c46a;--tk-gold-lo:#b38a2c;--tk-balloon:#ef6f7f;--tk-balloon-lo:#b94757;--tk-magnet:#e05a5a;--tk-air:#a9c6e0;--tk-pipe:#8fb3cf;--tk-pipe-lo:#5f87a6;--tk-bumper:#f2a65a;--tk-bumper-lo:#c27027;--tk-domino:#2f343c;--tk-domino-dot:#f6f4ee;
  --mc-ink:var(--stg-ink,#15171c);--mc-mute:var(--stg-mute,#6b7280);--mc-card:var(--stg-surf,#ffffff);--mc-soft:var(--stg-line,#e9e7e1);--mc-bad:var(--pst-bad,#be123c);
  align-self:center;width:100%;display:flex;flex-direction:column;gap:8px;font-family:'Manrope',system-ui,sans-serif}
.stage-page[data-stage-theme='dark'] .mach{--tk-board:#1b2029;--tk-grid:#232934;--tk-wood:#8a6c48;--tk-wood-hi:#a2835c;--tk-wood-lo:#6a5136;--tk-grain:#7a5f3e;--tk-floor:#353c48;--tk-floor-lo:#2a303a;--tk-pit:#07090c;--tk-steel:#7d8794;--tk-steel-lo:#59626e;--tk-belt:#0d1015;--tk-belt-hi:#2a313c;--tk-chev:#d4ad3a;--tk-spring:#97a2b0;--tk-btn:#e26a6a;--tk-btn-lo:#9c3a3a;--tk-rim:#ef8650;--tk-net:#8a94a1;--tk-bowl:#7a5cb0;--tk-bowl-hi:#9a80cc;--tk-bb:#ec8f4a;--tk-bb-seam:#5a2b10;--tk-trail-a:#9a80cc;--tk-trail-b:#ec8f4a;--tk-hover:#2c3f27;--tk-bad:#4a1f2a;--tk-steelball:#aab3bf;--tk-tennis:#c6d85a;--tk-tennis-seam:#eef3d8;--tk-glue:#3d6b4a;--tk-glue-lo:#5f9a70;--tk-gold:#d4ad3a;--tk-gold-lo:#8f6d1c;--tk-balloon:#e2667a;--tk-balloon-lo:#a23a4c;--tk-magnet:#d65656;--tk-air:#46627d;--tk-pipe:#5b7f9c;--tk-pipe-lo:#3e5e78;--tk-bumper:#df8f45;--tk-bumper-lo:#a35a1c;--tk-domino:#d9dde3;--tk-domino-dot:#1b2029}
.mach .mc-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}
.mach .mc-runs{font:800 13px/1.3 'Manrope',sans-serif;color:var(--mc-mute)}
.mach .mc-runs b{color:var(--mc-ink);font-size:19px;font-variant-numeric:tabular-nums;margin-right:4px}
.mach .mc-goal{display:flex;align-items:center;gap:8px;border:1px solid var(--mc-ink);border-radius:999px;background:var(--mc-card);color:var(--mc-ink);padding:5px 14px 5px 6px;font:800 13.5px/1.3 'Manrope',sans-serif;text-align:left}
.mach .mc-goal svg{flex:none;width:26px;height:26px}
.mach .mc-act{display:flex;justify-content:flex-end}
.mach .mc-run{border:1px solid var(--mc-ink);background:var(--mc-ink);color:var(--mc-card);font:800 14px/1 'Manrope',sans-serif;border-radius:999px;padding:11px 20px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
.mach .mc-run:disabled{opacity:.4;cursor:default}
.mach .mc-board{position:relative;border:1px solid var(--mc-ink);border-radius:14px;overflow:hidden;background:var(--tk-board);touch-action:none;user-select:none;-webkit-user-select:none}
.mach .mc-board svg{display:block;width:100%;height:auto}
.mach .mc-msg{min-height:22px;text-align:center;font:800 13px/1.55 'Manrope',sans-serif;color:var(--mc-mute)}
.mach .mc-msg.bad{color:var(--mc-bad)}
.mach .mc-tray{display:grid;grid-template-columns:repeat(var(--mc-n,4),1fr);gap:8px}
.mach .mc-chip{position:relative;border:1px solid var(--mc-ink);background:var(--mc-card);color:var(--mc-ink);border-radius:12px;padding:8px 4px;cursor:grab;display:flex;flex-direction:column;align-items:center;gap:4px;font:800 12.5px/1.25 'Manrope',sans-serif;touch-action:none}
.mach .mc-chip svg{width:46px;height:46px}
.mach .mc-chip.used{opacity:.35;cursor:default}
.mach .mc-chip.on{background:var(--tk-hover);box-shadow:inset 0 0 0 2px var(--mc-ink)}
.mach .mc-chip .ct{position:absolute;top:6px;right:8px;font:800 11px/1 'Manrope',sans-serif;color:var(--mc-mute)}
.mach .mc-hint{font:600 12.5px/1.5 'Manrope',sans-serif;color:var(--mc-mute);text-align:center}
.mach .mc-tools{position:absolute;z-index:6;display:none;transform:translateX(-50%);gap:4px;background:var(--mc-card);border:1px solid var(--mc-ink);border-radius:999px;padding:3px;box-shadow:0 8px 24px rgba(15,23,42,.16)}
.mach .mc-tools.show{display:flex}
.mach .mc-tools button{border:0;background:transparent;color:var(--mc-ink);font:800 13px/1 'Manrope',sans-serif;padding:8px 12px;border-radius:999px;cursor:pointer}
.mach .handle{cursor:grab}
.mach .trail{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;opacity:.45}
.mach .ghost{opacity:.4;pointer-events:none}
.mach{position:relative}
.mach .mc-float{position:absolute;left:0;top:0;pointer-events:none;z-index:40;filter:drop-shadow(0 8px 10px rgba(0,0,0,.28));will-change:transform}
.mach .mc-float svg{display:block;overflow:visible}
.mach .mc-chip{touch-action:none}
.mach .mc-chip.lift{opacity:.35}
.mach .pop{animation:mc-pop .3s ease-out}
@keyframes mc-pop{from{transform:scale(.6);opacity:.3}}
.mach .belt-chev{animation:none}
.mach.running .belt-chev{animation:mc-chev .5s linear infinite}
@keyframes mc-chev{to{transform:translateX(var(--chev-dx))}}
.mach .fanblades{transform-box:fill-box;transform-origin:center}
.mach .spinning .fanblades{animation:mc-spin .25s linear infinite}
@keyframes mc-spin{to{transform:rotate(360deg)}}
.mach .air{opacity:0;transition:opacity .3s}
.mach .fanOn .air{opacity:1}
.mach .air line{animation:mc-air .7s linear infinite}
@keyframes mc-air{0%{transform:translate(0,0);opacity:0}25%{opacity:.9}100%{transform:translate(var(--ax),var(--ay));opacity:0}}
@media (prefers-reduced-motion:reduce){.mach.running .belt-chev,.mach .spinning .fanblades,.mach .air line{animation:none}}
@media (max-width:640px){.mach .mc-top{grid-template-columns:auto 1fr;grid-template-areas:"goal goal" "runs act"}.mach .mc-goal{grid-area:goal;justify-self:center}.mach .mc-runs{grid-area:runs}.mach .mc-act{grid-area:act}.mach .mc-chip svg{width:38px;height:38px}}
`;

function segBox(segs) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of segs) { x0 = Math.min(x0, s.ax - s.th, s.bx - s.th); y0 = Math.min(y0, s.ay - s.th, s.by - s.th); x1 = Math.max(x1, s.ax + s.th, s.bx + s.th); y1 = Math.max(y1, s.ay + s.th, s.by + s.th); }
  return [x0, y0, x1, y1];
}
// The overlap rule, shared with scripts/verify-machine.mjs through the same
// function: a part may not overlap a fixed piece, a ball's start, another part,
// or the board's edges.
export function placementRules(L) {
  const fixed = L.pieces.filter((p) => p.t !== 'hoop').map((p) => segBox(pieceSegs({ ...p, tilt: p.tilt || -1, fall: -1 })));
  for (const p of L.pieces) if (p.t === 'hoop') fixed.push([p.x * C, p.y * C, p.x * C + C, p.y * C + C]);
  for (const b of makeState(L, []).balls) if (b.live) fixed.push([b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r]);
  const box = (part) => { const b = segBox(pieceSegs(part)); return [b[0] + 1, b[1] + 1, b[2] - 1, b[3] - 1]; };
  const hits = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const fits = (part, others) => {
    const bx = box(part);
    if (bx[0] < 0 || bx[1] < 0 || bx[2] > L.w * C || part.py + C > L.h * C + 2) return false;
    if (fixed.some((f) => hits(f, bx))) return false;
    return !others.some((q) => hits(box(q), bx));
  };
  return { box, fits };
}
export const partOf = (L, p) => ({ ...L.tray[p.ti], dir: p.dir || L.tray[p.ti].dir, px: p.px, py: p.py });

export function mountMachine(root, { level: L, parts: initial = [], onParts, onRun, onEnd, goalText }) {
  const R = placementRules(L);
  const BW = L.w * C, BH = L.h * C;
  let placed = (initial || []).map((p) => ({ ...p }));
  let selected = null, mode = 'idle', trails = null, player = null, runs = 0, destroyed = false;
  let armed = null; // a tray index picked up by a tap, waiting for a tap on the board
  let lastTap = 0;  // a tap that just landed on a part, so the board's own click ignores it
  let picked = false; // the selected part was tapped on purpose, so a tap on open board moves it
  // idle (before Start), build, running, after (a missed run, frozen), done

  root.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'mach';
  wrap.innerHTML = `<div class="mc-top"><div class="mc-runs"><b>0</b><span>runs</span></div><div class="mc-goal"><svg viewBox="0 0 60 60"></svg><span></span></div><div class="mc-act"><button type="button" class="mc-run"><svg width="13" height="13" viewBox="0 0 14 14"></svg><span>Run</span></button></div></div>
  <div class="mc-board"><svg></svg><div class="mc-tools"><button type="button" data-a="flip">Flip</button><button type="button" data-a="remove">Remove</button></div></div>
  <div class="mc-msg" aria-live="polite"></div><div class="mc-tray"></div><div class="mc-hint">Drag or tap to place. Not every part is needed. Drag a part off the board to put it back.</div>`;
  root.appendChild(wrap);
  const $ = (q) => wrap.querySelector(q);
  const svg = $('.mc-board > svg'), boardEl = $('.mc-board'), msgEl = $('.mc-msg'), trayEl = $('.mc-tray'), runBtn = $('.mc-run'), toolsEl = $('.mc-tools');
  trayEl.style.setProperty('--mc-n', String(Math.min(L.tray.length, 6)));
  $('.mc-goal span').textContent = goalText || 'Finish the machine';
  const gk = (L.balls.find((b) => L.goal && b.id === L.goal.ball) || L.balls.find((b) => b.role !== 'kick') || L.balls[0]);
  if (L.goal && (L.goal.type === 'hoop' || L.goal.type === 'bucket')) drawBall(el('g', { transform: 'translate(30,30) scale(1.2)' }, $('.mc-goal svg')), gk.kind);
  else drawPiece({ mid: $('.mc-goal svg'), front: $('.mc-goal svg') }, { t: L.goal ? L.goal.type : 'bell', x: 0, y: 0, k: 0 }, {});

  const B = makeBoard(svg, L);
  const parts = () => placed.filter((p) => !p.hidden).map((p) => partOf(L, p));
  const say = (t, bad) => { msgEl.textContent = t || ''; msgEl.className = 'mc-msg' + (bad ? ' bad' : ''); };
  const setRun = (label, disabled) => {
    runBtn.querySelector('span').textContent = label;
    runBtn.disabled = !!disabled;
    runBtn.querySelector('svg').innerHTML = label === 'Stop' ? '<rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor"/>' : label === 'Reset' ? '<path d="M7 2a5 5 0 1 1-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M1 3l2.2 4 3.3-3z" fill="currentColor"/>' : '<path d="M2 1l11 6-11 6z" fill="currentColor"/>';
  };
  const setRuns = (n) => { runs = n; $('.mc-runs b').textContent = String(n); $('.mc-runs span').textContent = n === 1 ? 'run' : 'runs'; };
  const emit = () => onParts && onParts(placed.map(({ ti, px, py, dir }) => ({ ti, px, py, dir })));

  function svgPoint(e) {
    const r = svg.getBoundingClientRect();
    return [(e.clientX - r.left) * BW / r.width, (e.clientY - r.top) * BH / r.height, e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom];
  }
  const snap = (v) => Math.round(v / SNAP) * SNAP;

  function redraw(popIdx) {
    B.draw(parts(), { popK: popIdx === undefined ? undefined : L.pieces.length + popIdx });
    B.drawTrails(trails);
    if (mode === 'build') placed.forEach((p, i) => {
      const bx = R.box(partOf(L, p));
      const h = el('rect', { x: bx[0] - 4, y: bx[1] - 4, width: bx[2] - bx[0] + 8, height: bx[3] - bx[1] + 8, rx: 10, fill: 'transparent', class: 'handle' }, B.hit);
      if (selected === i) el('rect', { x: bx[0] - 4, y: bx[1] - 4, width: bx[2] - bx[0] + 8, height: bx[3] - bx[1] + 8, rx: 10, fill: 'none', stroke: 'var(--mc-ink)', 'stroke-width': 2 }, B.hover);
      h.addEventListener('pointerdown', (e) => startDrag(e, { idx: i }));
    });
    showTools();
  }
  function iconSvg(part) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 60 60');
    const g = el('g', {}, s);
    drawPiece({ mid: g, front: g }, { ...part, x: 0, y: 0, k: 0, icon: true }, {});
    return s;
  }
  function renderTray() {
    trayEl.innerHTML = '';
    L.tray.forEach((t, i) => {
      const used = placed.some((p) => p.ti === i);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc-chip' + (used ? ' used' : '') + (armed === i ? ' on' : '');
      b.appendChild(iconSvg(t));
      const n = document.createElement('span'); n.textContent = partName(t); b.appendChild(n);
      const ct = document.createElement('span'); ct.className = 'ct'; ct.textContent = used ? '0' : '1'; b.appendChild(ct);
      if (!used) b.addEventListener('pointerdown', (e) => startDrag(e, { ti: i }));
      trayEl.appendChild(b);
    });
  }

  /* drag and drop */
  let drag = null;
  function startDrag(e, src) {
    if (mode === 'after') { toBuild(); if (src.idx !== undefined) return; }
    if (mode !== 'build') { if (mode === 'idle') say('Press Start to begin.'); return; }
    e.preventDefault();
    const ti = src.idx !== undefined ? placed[src.idx].ti : src.ti;
    const dir = src.idx !== undefined ? placed[src.idx].dir : L.tray[ti].dir;
    const [sx, sy] = svgPoint(e);
    drag = { ...src, ti, dir, moved: false, cx: e.clientX, cy: e.clientY, chip: src.ti !== undefined ? e.currentTarget : null };
    if (src.idx !== undefined) { drag.offX = sx - placed[src.idx].px; drag.offY = sy - placed[src.idx].py; }
    else {
      // From the tray the part rides with its centre on the pointer; on a touch
      // screen it sits just above the finger so the finger does not hide it.
      const b0 = R.box({ ...L.tray[ti], dir, px: 0, py: 0 });
      const k = svg.getBoundingClientRect().width / BW || 1;
      drag.offX = (b0[0] + b0[2]) / 2;
      drag.offY = (e.pointerType === 'touch' ? b0[3] + 34 / k : (b0[1] + b0[3]) / 2);
    }
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', cancelDrag, { once: true });
  }
  function moveDrag(e) {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.cx) + Math.abs(e.clientY - drag.cy) > 6) drag.moved = true;
    if (!drag.moved) return;
    if (drag.idx !== undefined && !drag.lifted) { drag.lifted = true; placed[drag.idx].hidden = true; selected = null; toolsEl.classList.remove('show'); B.draw(parts(), {}); B.drawTrails(trails); }
    const [x, y, inside] = svgPoint(e);
    const part = { ...L.tray[drag.ti], dir: drag.dir, px: snap(x - drag.offX), py: snap(y - drag.offY) };
    drag.part = part; drag.inside = inside;
    moveFloat(e);
    B.hover.innerHTML = '';
    if (!inside) return;
    const others = placed.filter((q, i) => i !== drag.idx).map((q) => partOf(L, q));
    const ok = R.fits(part, others);
    drag.ok = ok;
    const bx = R.box(part);
    el('rect', { x: bx[0] - 3, y: bx[1] - 3, width: bx[2] - bx[0] + 6, height: bx[3] - bx[1] + 6, rx: 8, fill: ok ? 'var(--tk-hover)' : 'var(--tk-bad)' }, B.hover);
    drawPiece({ mid: el('g', { opacity: ok ? 0.3 : 0.2 }, B.hover), front: el('g', { opacity: ok ? 0.3 : 0.2 }, B.hover) }, { ...part, k: -1 }, {});
  }
  /* the floating copy that follows the pointer while a part is dragged */
  let float = null;
  function moveFloat(e) {
    const k = svg.getBoundingClientRect().width / BW || 1;
    if (!float) {
      const p0 = { ...L.tray[drag.ti], dir: drag.dir, px: 0, py: 0 };
      const b = R.box(p0), pad = 12;
      float = document.createElement('div'); float.className = 'mc-float';
      const fs = document.createElementNS(NS, 'svg');
      fs.setAttribute('viewBox', `${b[0] - pad} ${b[1] - pad} ${b[2] - b[0] + 2 * pad} ${b[3] - b[1] + 2 * pad}`);
      fs.setAttribute('width', String((b[2] - b[0] + 2 * pad) * k * 1.06));
      fs.setAttribute('height', String((b[3] - b[1] + 2 * pad) * k * 1.06));
      const g = el('g', {}, fs);
      drawPiece({ mid: g, front: g }, { ...p0, k: -1 }, {});
      float.appendChild(fs); wrap.appendChild(float);
      float._b = b; float._pad = pad;
      if (drag.chip) drag.chip.classList.add('lift');
    }
    const wr = wrap.getBoundingClientRect(), b = float._b, pad = float._pad, s = k * 1.06;
    // keep the grab point under the pointer, growing 6% around it
    const lx = e.clientX - wr.left - (drag.offX - b[0] + pad) * s;
    const ty = e.clientY - wr.top - (drag.offY - b[1] + pad) * s;
    float.style.transform = `translate(${lx}px,${ty}px)`;
  }
  function dropFloat(d) {
    if (float) { float.remove(); float = null; }
    if (d && d.chip) d.chip.classList.remove('lift');
  }
  function endDrag() {
    window.removeEventListener('pointermove', moveDrag);
    const d = drag; drag = null; dropFloat(d);
    if (!d || destroyed) return;
    if (d.idx !== undefined) delete placed[d.idx].hidden;
    if (!d.moved) {
      if (d.idx !== undefined) {
        lastTap = Date.now();
        armed = null; renderTray();
        if (selected === d.idx && picked) { selected = null; picked = false; } else { selected = d.idx; picked = true; } redraw();
        say(selected === null ? 'Drag a part to move it, or tap it to select it.' : 'Tap an open spot to move it there, drag it, or use Flip and Remove.');
      } else {
        armed = armed === d.ti ? null : d.ti;
        selected = null; redraw(); renderTray();
        say(armed === null ? 'Drag a part onto the board, or tap it and then tap the board.' : `Now tap the board where the ${partName(L.tray[d.ti]).toLowerCase()} should go.`);
      }
      return;
    }
    armed = null;
    if (d.inside && d.ok) {
      if (d.idx !== undefined) { placed[d.idx].px = d.part.px; placed[d.idx].py = d.part.py; selected = d.idx; picked = false; }
      else { placed.push({ ti: d.ti, px: d.part.px, py: d.part.py, dir: d.dir }); selected = placed.length - 1; picked = false; }
      redraw(selected); renderTray(); emit();
      const left = L.tray.some((t, i) => !placed.some((p) => p.ti === i));
      say(left ? 'Placed. Add more parts, or press Run.' : 'Every part is on the board. Press Run.');
    } else if (!d.inside && d.idx !== undefined) {
      placed.splice(d.idx, 1); selected = null; redraw(); renderTray(); emit();
      say('Back in the tray.');
    } else {
      redraw(); renderTray();
      say(d.inside ? 'It does not fit there. Try an open spot.' : 'Drag the part onto the board.', d.inside);
    }
  }
  function cancelDrag() { window.removeEventListener('pointermove', moveDrag); dropFloat(drag); if (drag && drag.idx !== undefined) delete placed[drag.idx].hidden; drag = null; redraw(); }

  function showTools() {
    if (selected === null || mode !== 'build' || !placed[selected]) { toolsEl.classList.remove('show'); return; }
    const p = partOf(L, placed[selected]);
    const bx = R.box(p), r = svg.getBoundingClientRect(), k = r.width / BW || 1;
    toolsEl.classList.add('show');
    toolsEl.querySelector('[data-a=flip]').style.display = p.dir ? '' : 'none';
    const top = (bx[1] - 8) * k - 40, left = ((bx[0] + bx[2]) / 2) * k;
    toolsEl.style.left = Math.max(70, Math.min(r.width - 70, left)) + 'px';
    toolsEl.style.top = (top < 0 ? (bx[3] + 8) * k : top) + 'px';
  }
  toolsEl.addEventListener('click', (e) => {
    const a = e.target.closest('button'); if (!a || selected === null) return;
    if (a.dataset.a === 'flip') {
      const p = placed[selected], old = p.dir;
      p.dir = (p.dir || L.tray[p.ti].dir) === 'l' ? 'r' : 'l';
      const others = placed.filter((q, i) => i !== selected).map((q) => partOf(L, q));
      if (!R.fits(partOf(L, p), others)) { p.dir = old; say('No room to flip it here.', true); return; }
      redraw(); emit(); say('Flipped.');
    } else { placed.splice(selected, 1); selected = null; redraw(); renderTray(); emit(); say('Back in the tray.'); }
  });
  // a tap on the board: drop the picked-up part there, or move the selected one
  const at = (e, ti, dir) => { const [x, y] = svgPoint(e); return { ...L.tray[ti], dir, px: snap(x - 30), py: snap(y - 30) }; };
  const onSvgClick = (e) => {
    if (mode !== 'build' || drag) return;
    if (Date.now() - lastTap < 150) return;
    if (e.target.classList && e.target.classList.contains('handle')) return;
    if (armed !== null) {
      const ti = armed, part = at(e, ti, L.tray[ti].dir);
      if (!R.fits(part, placed.map((q) => partOf(L, q)))) { flashBad(part); say('It does not fit there. Tap an open spot.', true); return; }
      placed.push({ ti, px: part.px, py: part.py, dir: part.dir }); armed = null; selected = placed.length - 1; picked = false;
      redraw(selected); renderTray(); emit();
      const left = L.tray.some((t, i) => !placed.some((p) => p.ti === i));
      say(left ? 'Placed. Add more parts, or press Run.' : 'Every part is on the board. Press Run.');
      return;
    }
    if (selected !== null && placed[selected] && !picked) { selected = null; redraw(); say('Drag a part, or tap it and then tap a new spot.'); return; }
    if (selected !== null && placed[selected]) {
      const q = placed[selected], part = at(e, q.ti, q.dir || L.tray[q.ti].dir);
      const others = placed.filter((_, i) => i !== selected).map((o) => partOf(L, o));
      if (!R.fits(part, others)) { flashBad(part); say('It does not fit there. Tap an open spot, or tap the part to let it go.', true); return; }
      q.px = part.px; q.py = part.py; picked = false; redraw(selected); emit(); say('Moved.');
    }
  };
  function flashBad(part) {
    const bx = R.box(part);
    const r = el('rect', { x: bx[0] - 3, y: bx[1] - 3, width: bx[2] - bx[0] + 6, height: bx[3] - bx[1] + 6, rx: 8, fill: 'var(--tk-bad)' }, B.fx);
    setTimeout(() => r.remove(), 450);
  }
  // with a part picked up, a pointer over the board shows where it would land
  const onSvgMove = (e) => {
    if (mode !== 'build' || drag || armed === null || e.pointerType === 'touch') return;
    const part = at(e, armed, L.tray[armed].dir), ok = R.fits(part, placed.map((q) => partOf(L, q)));
    B.hover.innerHTML = '';
    const bx = R.box(part);
    el('rect', { x: bx[0] - 3, y: bx[1] - 3, width: bx[2] - bx[0] + 6, height: bx[3] - bx[1] + 6, rx: 8, fill: ok ? 'var(--tk-hover)' : 'var(--tk-bad)' }, B.hover);
    drawPiece({ mid: el('g', { opacity: ok ? 0.85 : 0.5 }, B.hover), front: B.hover }, { ...part, k: -1 }, {});
  };
  const onSvgLeave = () => { if (armed !== null && !drag) B.hover.innerHTML = ''; };
  svg.addEventListener('click', onSvgClick);
  svg.addEventListener('pointermove', onSvgMove);
  svg.addEventListener('pointerleave', onSvgLeave);
  const onResize = () => showTools();
  window.addEventListener('resize', onResize);

  function toBuild() {
    if (player) player.stop();
    mode = 'build'; selected = null;
    wrap.classList.remove('running');
    redraw();
    setRun('Run');
  }
  function reason(s) {
    const lost = (id) => s.events.some((e) => e.type === 'lost' && e.id === id);
    const kick = L.balls.find((b) => b.role === 'kick');
    const goalBall = L.goal && L.goal.ball ? L.balls.find((b) => b.id === L.goal.ball) : null;
    const wired = L.pieces.some((p) => p.wires);
    const pressed = s.events.some((e) => e.type === 'press');
    const nm = { bowling: 'bowling ball', basket: 'basketball', tennis: 'tennis ball', steel: 'steel ball' };
    if (wired && !pressed) return kick && lost(kick.id) ? `The ${nm[kick.kind]} fell in the pit before it reached the button.` : 'The button was never pressed.';
    if (goalBall && lost(goalBall.id)) return `${wired ? 'The button worked, but the' : 'The'} ${nm[goalBall.kind]} fell in the pit.`;
    if (L.goal && L.goal.type === 'bell') return 'Nothing rang the bell.';
    if (L.goal && L.goal.type === 'balloon') return 'The balloon is still there.';
    if (goalBall) return `${wired ? 'The button worked, but the' : 'The'} ${nm[goalBall.kind]} came to rest short of the goal.`;
    return 'Close. Move some parts and run it again.';
  }
  function startRun() {
    if (mode === 'running') {
      player.stop(); mode = 'after'; wrap.classList.remove('running'); setRun('Reset');
      say('Stopped. Press Reset to change the machine.');
      onEnd && onEnd(false);
      return;
    }
    if (mode === 'after') { toBuild(); say('Move parts and run it again.'); return; }
    if (mode !== 'build') return;
    setRuns(runs + 1);
    onRun && onRun();
    if (armed !== null) { armed = null; renderTray(); }
    selected = null; toolsEl.classList.remove('show');
    trails = null;
    mode = 'running';
    redraw();
    wrap.classList.add('running');
    setRun('Stop');
    say('Running…');
    const rec = B.record(parts(), 1800);
    const pl = Object.values(B.refs).find((r) => r.plunger);
    if (pl) { pl.plunger.style.transform = 'translateX(8px)'; setTimeout(() => { pl.plunger.style.transform = ''; }, 160); }
    player = B.play(rec, {
      onEnd: (tr) => {
        if (destroyed) return;
        wrap.classList.remove('running');
        trails = tr;
        if (rec.s.won) { mode = 'done'; setRun('Run', true); say('It works.'); onEnd && onEnd(true); return; }
        mode = 'after'; setRun('Reset'); B.drawTrails(trails);
        say(reason(rec.s), true);
        onEnd && onEnd(false);
      },
    });
  }
  runBtn.addEventListener('click', startRun);

  B.draw(parts(), {});
  renderTray();
  setRun('Run', true);
  return {
    setRuns,
    // active: the clock is running. done: the shell has ended the day.
    setState({ active, done }) {
      if (done) {
        if (mode === 'running' || mode === 'done') return;
        mode = 'done'; selected = null; setRun('Run', true); redraw(); trayEl.style.display = 'none'; $('.mc-hint').style.display = 'none';
        return;
      }
      if (active && mode === 'idle') { mode = 'build'; setRun('Run'); redraw(); say('Drag a part onto the board, or tap it and then tap where it goes. Tap a placed part to move, flip or remove it.'); }
    },
    // Show the answer (owner, 2026-11-18): once the day is over, lay out the
    // stored machine and run it. Never counts a run or calls onRun / onEnd.
    playAnswer(sol, done) {
      if (player) player.stop();
      placed = (sol || []).map((p) => ({ ...p }));
      trails = null; selected = null; armed = null; toolsEl.classList.remove('show');
      mode = 'running'; redraw();
      wrap.classList.add('running'); setRun('Run', true); say('The answer, running…');
      const rec = B.record(parts(), 1800);
      player = B.play(rec, {
        onEnd: (tr) => {
          if (destroyed) return;
          wrap.classList.remove('running'); trails = tr; mode = 'done';
          if (!rec.s.won) B.drawTrails(trails);
          say(rec.s.won ? 'The answer: this machine works.' : 'The answer.');
          if (done) done(rec.s.won);
        },
      });
    },
    // back to the player's own machine, as it was when the day ended
    showParts(list) {
      if (player) player.stop();
      placed = (list || []).map((p) => ({ ...p }));
      trails = null; selected = null; mode = 'done'; wrap.classList.remove('running'); redraw(); say('');
    },
    destroy() { destroyed = true; if (player) player.stop(); window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', moveDrag); dropFloat(null); root.innerHTML = ''; },
  };
}
