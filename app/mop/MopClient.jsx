'use client';

// Mop: the daily mop-every-tile puzzle (owner, 2026-11-13). A house seen from
// above, one mop, and one rule: every tile gets mopped exactly once, a mopped
// tile is never stepped on again, and you finish on the tile inside the way
// out. Walls, doorways and furniture shape the route. The Sunday Edition is
// three floors (Upstairs, Ground Floor, Basement), each its own screen, joined
// by staircases that are one tile shared by two floors.
//
// The board model is lib/mop-engine.js (shared with the generator and the
// checker). The check here is the rule, not an answer key: any route that
// covers the house and ends at the door is a solve. Runs on app/SimpleDaily.jsx.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { mopModel } from '@/lib/mop-engine';

const U = 100, PAD = 34, PADY = 80;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, ROT = { N: -90, S: 90, W: 180, E: 0 };
const MODELS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
function modelOf(P) {
  let m = MODELS && MODELS.get(P);
  if (!m) { m = mopModel(P); if (MODELS) MODELS.set(P, m); }
  return m;
}
const cellOn = (M, node, k) => { const p = M.at[node].find((a) => a[0] === k); return p ? p[1] : -1; };
const same = (P) => P.sides[0] === P.sides[1];
const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };

// ── furniture, drawn from above in a landscape box L x 100 ──────────────────
const R = (x, y, w, h, r, f) => `<rect class="fo" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="var(--mop-${f})"/>`;
const C = (x, y, r, f) => `<circle class="fo" cx="${x}" cy="${y}" r="${r}" fill="var(--mop-${f})"/>`;
const E = (x, y, rx, ry, f, rot) => `<ellipse class="fo" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="var(--mop-${f})"${rot !== undefined ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
const Ln = (d) => `<path class="fl" d="${d}"/>`;
const FURN = {
  bed: (L, S) => R(8, 8, L - 16, S - 16, 8, 'wood2') + R(14, 13, L - 28, S - 26, 6, 'por') + R(L * 0.4, 13, L - 14 - L * 0.4, S - 26, 6, 'fab') + Ln(`M${L * 0.4 + 12} 13V${S - 13}`) + (L > 100 ? R(22, 20, 34, 26, 9, 'por') + R(22, 54, 34, 26, 9, 'por') : R(18, 24, 16, 52, 7, 'por')),
  crib: (L, S) => R(10, 10, L - 20, S - 20, 10, 'por') + R(18, 18, L - 36, S - 36, 6, 'fab2') + R(24, 34, 14, 32, 6, 'por'),
  sofa: (L, S) => R(8, 10, L - 16, S - 20, 14, 'fab') + R(8, 10, L - 16, 26, 10, 'fab2') + R(8, 10, 22, S - 20, 10, 'fab2') + R(L - 30, 10, 22, S - 20, 10, 'fab2') + (L > 100 ? Ln(`M${L / 2} 38V${S - 12}`) : ''),
  bench: (L, S) => R(10, 24, L - 20, S - 48, 8, 'wood') + R(18, 31, L - 36, S - 62, 6, 'fab2'),
  table: (L, S) => (L > 100 ? [50, L - 80].map((x) => R(x, 5, 30, 18, 6, 'fab') + R(x, S - 23, 30, 18, 6, 'fab')).join('') : R(35, 5, 30, 18, 6, 'fab') + R(35, S - 23, 30, 18, 6, 'fab')) + R(18, 20, L - 36, S - 40, 10, 'wood') + (L > 100 ? C(65, 50, 10, 'por') + C(L - 65, 50, 10, 'por') : C(50, 50, 10, 'por')),
  coffee: (L, S) => R(16, 22, L - 32, S - 44, 14, 'wood') + C(L / 2 - 12, 50, 8, 'por') + R(L / 2 + 4, 40, 18, 22, 3, 'fab2'),
  island: (L, S) => R(8, 16, L - 16, S - 32, 8, 'card') + C(L * 0.3, 50, 12, 'steel') + C(L * 0.3, 50, 5, 'por') + R(L * 0.55, 34, L * 0.3, 32, 4, 'wood'),
  tub: (L, S) => R(8, 10, L - 16, S - 20, 20, 'por') + R(20, 22, L - 40, S - 44, 14, 'water') + C(L - 32, S / 2, 5, 'steel'),
  toilet: () => R(28, 8, 44, 22, 5, 'por') + E(50, 58, 23, 29, 'por') + E(50, 60, 13, 18, 'water'),
  sink: () => R(14, 10, 72, 36, 6, 'wood') + E(50, 54, 26, 24, 'por') + E(50, 56, 15, 14, 'water') + C(50, 24, 5, 'steel'),
  stove: () => R(10, 10, 80, 80, 7, 'steel') + [[33, 33], [67, 33], [33, 67], [67, 67]].map((p) => C(p[0], p[1], 11, 'por') + C(p[0], p[1], 4, 'steel')).join(''),
  fridge: () => R(12, 10, 76, 80, 7, 'por') + Ln('M12 40H88M24 22v10M24 50v22'),
  counter: (L, S) => R(8, 14, L - 16, S - 28, 6, 'card') + R(L / 2 - 32, 26, 64, S - 52, 9, 'steel') + R(L / 2 - 24, 33, 48, S - 66, 6, 'water') + C(L / 2, 22, 4, 'steel'),
  plant: () => [0, 60, 120, 180, 240, 300].map((a) => E(50 + 26 * Math.cos((a * Math.PI) / 180), 50 + 26 * Math.sin((a * Math.PI) / 180), 20, 11, 'leaf', a)).join('') + C(50, 50, 15, 'wood2'),
  desk: (L) => C(L / 2, 76, 15, 'fab') + R(10, 10, L - 20, 52, 5, 'wood') + R(L / 2 - 24, 18, 48, 30, 4, 'steel') + Ln(`M${L / 2 - 16} 40h32`),
  shelf: (L, S) => R(10, 16, L - 20, S - 32, 4, 'wood2') + Array.from({ length: Math.floor((L - 36) / 13) }, (_, i) => R(18 + i * 13, 24, 10, S - 48, 2, ['fab', 'por', 'fab2', 'leaf', 'card'][i % 5])).join(''),
  washer: () => R(12, 12, 76, 76, 9, 'por') + C(50, 56, 23, 'steel') + C(50, 56, 14, 'water') + Ln('M22 24h14M64 24h12'),
  dresser: () => R(12, 20, 76, 60, 6, 'wood') + Ln('M12 50H88') + C(50, 35, 4, 'wood2') + C(50, 65, 4, 'wood2'),
  armchair: () => R(14, 14, 72, 72, 16, 'fab') + R(14, 14, 72, 24, 10, 'fab2') + R(14, 14, 20, 72, 10, 'fab2') + R(66, 14, 20, 72, 10, 'fab2'),
  boxes: () => R(12, 34, 48, 48, 3, 'card') + Ln('M36 34v48') + R(44, 14, 42, 42, 3, 'card') + Ln('M44 35h42'),
  boiler: () => C(50, 52, 34, 'steel') + C(50, 52, 20, 'por') + R(44, 6, 12, 16, 3, 'steel') + Ln('M50 52l10-10'),
  pool: (L, S) => R(8, 10, L - 16, S - 20, 12, 'wood2') + R(20, 22, L - 40, S - 44, 4, 'felt') + [[22, 24], [L / 2, 22], [L - 22, 24], [22, S - 24], [L / 2, S - 22], [L - 22, S - 24]].map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="var(--mop-ink)"/>`).join('') + C(L * 0.3, 50, 5, 'por') + C(L * 0.62, 44, 5, 'fab2') + C(L * 0.68, 58, 5, 'wood'),
  workbench: (L, S) => R(8, 14, L - 16, S - 28, 4, 'wood') + R(20, 26, 40, 20, 3, 'steel') + Ln(`M${L - 70} 30l40 30M${L - 70} 60l40-30`) + C(L - 90, 64, 7, 'steel'),
};
// By room: [two-tile piece, the one-tile pieces in turn]. An ISLAND (a piece
// that stands clear of the walls) takes the third and fourth entries instead.
const ROOM = {
  Living: ['sofa', ['armchair', 'plant'], 'sofa', 'coffee'], Kitchen: ['counter', ['stove', 'fridge'], 'island', 'table'],
  Dining: ['table', ['plant', 'dresser'], 'table', 'table'], Bedroom: ['bed', ['dresser', 'plant'], 'bed', 'armchair'],
  'Guest Room': ['bed', ['dresser', 'plant'], 'bed', 'armchair'], Nursery: ['crib', ['crib', 'dresser'], 'crib', 'crib'],
  Bath: ['tub', ['toilet', 'sink'], 'tub', 'plant'], Hall: ['bench', ['plant', 'dresser'], 'bench', 'plant'],
  Study: ['desk', ['shelf', 'plant'], 'desk', 'armchair'], Office: ['desk', ['shelf', 'plant'], 'desk', 'armchair'],
  Pantry: ['shelf', ['boxes', 'fridge'], 'shelf', 'boxes'], Laundry: ['counter', ['washer', 'washer'], 'bench', 'washer'],
  'Rec Room': ['pool', ['armchair', 'plant'], 'pool', 'coffee'], Storage: ['shelf', ['boxes', 'boxes'], 'shelf', 'boxes'],
  Workshop: ['workbench', ['boxes', 'boiler'], 'workbench', 'boiler'],
};
const MOP = '<g transform="rotate(8)"><path class="mk" d="M6 -10 46 -62"/><path class="mw" d="M6 -10 46 -62"/><path class="mh" d="M-30 -6Q-38 20 -28 27Q-21 32 -16 25Q-10 34 -3 26Q4 34 10 26Q18 32 23 23Q31 12 22 -8Z"/><path class="ms" d="M-18 4Q-22 14 -19 22M-8 4Q-10 16 -6 23M2 4Q2 16 6 23M12 2Q15 12 18 20"/><rect class="mc" x="-24" y="-14" width="46" height="13" rx="5" transform="rotate(-6)"/></g>';

// Everything on a floor that never changes during play: walkways, stairs,
// furniture, room names, walls and the door marks.
function drawFloor(P, M, k) {
  const F = P.floors[k], W = F.w, H = F.h, N = W * H, FL = M.floors[k], room = FL.room;
  const gaps = [];
  if (P.start[0] === k) gaps.push([P.start[1], P.sides[0], 'In']);
  if (P.end[0] === k) gaps.push([P.end[1], P.sides[1], 'Out']);
  let under = '', over = '';
  const bySide = {};
  gaps.forEach((g) => { (bySide[g[1]] = bySide[g[1]] || []).push(g); });
  for (const side of Object.keys(bySide)) {
    const idx = bySide[side].map((a) => a[0] % W), a = Math.min(...idx) * U + 6, b = (Math.max(...idx) + 1) * U - 6, far = 2400;
    under += `<rect class="walk" x="${a}" y="${side === 'S' ? H * U : -far}" width="${b - a}" height="${far}"/>`;
    for (let i = 1; i < 40; i++) under += `<path class="wl" d="M${a} ${side === 'S' ? H * U + i * 60 : -i * 60}H${b}"/>`;
  }
  under += `<rect class="shadow" x="10" y="12" width="${W * U}" height="${H * U}" rx="4"/>`;
  F.stairs.forEach((c, si) => {
    const x = (c % W) * U, y = Math.floor(c / W) * U;
    over += `<rect x="${x + 14}" y="${y + 34}" width="72" height="54" rx="4" fill="var(--mop-wood)" class="fo"/>` + [47, 61, 74].map((v) => `<path class="fl" d="M${x + 14} ${y + v}H${x + 86}"/>`).join('') + `<text class="sl" x="${x + 50}" y="${y + 67}" text-anchor="middle">${F.labels[si]}</text>`;
  });
  const used = {};
  F.pieces.forEach(([x, y, w, h, island]) => {
    const nm = F.names[room[y * W + x]], big = w * h > 1, spec = ROOM[nm] || ['shelf', ['plant', 'boxes'], 'bench', 'plant'];
    let type;
    if (island) type = big ? spec[2] : spec[3];
    else if (big) type = spec[0];
    else { const i = used[nm] || 0; used[nm] = i + 1; type = spec[1][i % 2]; }
    over += `<g transform="translate(${h > w ? (x + 1) * U : x * U} ${y * U})${h > w ? ' rotate(90)' : ''}">${FURN[type](big ? 200 : 100, 100)}</g>`;
  });
  const seen = {};
  for (let c = 0; c < N; c++) {
    if (FL.furn.has(c) || seen[room[c]] || F.stairs.includes(c)) continue;
    seen[room[c]] = 1;
    over += `<text class="rm" x="${(c % W) * U + 10}" y="${Math.floor(c / W) * U + 26}">${F.names[room[c]]}</text>`;
  }
  for (let c = 0; c < N; c++) {
    const x = c % W, y = Math.floor(c / W);
    if (x < W - 1 && !FL.open(c, c + 1)) over += `<path class="wall" d="M${(x + 1) * U} ${y * U}V${(y + 1) * U}"/>`;
    if (c + W < N && !FL.open(c, c + W)) over += `<path class="wall" d="M${x * U} ${(y + 1) * U}H${(x + 1) * U}"/>`;
  }
  const G = 12, cuts = { N: [], S: [] };
  gaps.forEach((g) => cuts[g[1]].push(g[0] % W));
  let d = `M0 0V${H * U}M${W * U} 0V${H * U}`;
  for (const side of ['N', 'S']) {
    const fix = side === 'N' ? 0 : H * U; let p = 0;
    cuts[side].sort((a, b) => a - b).forEach((i) => { d += `M${p} ${fix}H${i * U + G}`; p = (i + 1) * U - G; });
    d += `M${p} ${fix}H${W * U}`;
  }
  over += `<path class="owall" d="${d}"/>`;
  gaps.forEach((g) => {
    const dr = DIRS[g[1]], into = g[2] === 'In', cx = (g[0] % W) * U + 50, cy = Math.floor(g[0] / W) * U + 50, y = cy + dr[1] * 76;
    const side = into ? (g[1] === 'N' ? 'S' : 'N') : g[1];
    if (into) over += `<rect class="mat" x="${cx - 42}" y="${y - 20}" width="84" height="40" rx="6"/>`;
    over += `<g transform="translate(${cx - 20} ${y}) rotate(${ROT[side]})"><path class="arrow" d="M-10 0H10M2 -8 10 0 2 8"/></g><text class="${into ? 'inl' : 'outl'}" x="${cx + 14}" y="${y + 8}" text-anchor="middle">${g[2]}</text>`;
  });
  return { under, over };
}

const CSS = `
.mop{align-self:center;width:100%;max-width:min(540px, calc((100dvh - 310px) / 1.14));display:flex;flex-direction:column;gap:10px;
--mop-ink:#0b0d12;--mop-mute:#5f6774;--mop-clean:#ffffff;--mop-dirt:#c9cfd9;--mop-line:rgba(11,15,26,.16);--mop-ground:#ffffff;
--mop-grass:#bfe2a6;--mop-grass2:rgba(52,120,58,.30);--mop-earth:#d9c3a3;--mop-earth2:rgba(110,78,40,.28);--mop-walk:#ece6d8;--mop-walkl:rgba(11,15,26,.22);
--mop-wood:#e3c08a;--mop-wood2:#c99b62;--mop-fab:#a9c9f0;--mop-fab2:#c7b8ee;--mop-por:#ffffff;--mop-steel:#cfd6df;--mop-water:#cfe9fb;--mop-leaf:#8fd198;--mop-felt:#9fd9b8;--mop-card:#e2c9a0;--mop-head:#fffdf5;}
.stage-page[data-stage-theme='dark'] .mop{--mop-ink:#e9edf4;--mop-mute:#aab5c7;--mop-clean:#141925;--mop-dirt:#47506a;--mop-line:rgba(255,255,255,.13);--mop-ground:#0b0f1a;
--mop-grass:#173d27;--mop-grass2:rgba(140,210,140,.20);--mop-earth:#3a2c1f;--mop-earth2:rgba(230,190,140,.16);--mop-walk:#55534c;--mop-walkl:rgba(255,255,255,.20);
--mop-wood:#b89462;--mop-wood2:#8f6c41;--mop-fab:#6f9bd1;--mop-fab2:#8f7fc4;--mop-por:#dfe4ec;--mop-steel:#8a94a3;--mop-water:#7fb5d9;--mop-leaf:#5fa86a;--mop-felt:#4e9c78;--mop-card:#b39a6e;--mop-head:#f3efe2;}
@media (min-width:900px){.mop{max-width:min(600px, calc((100dvh - 300px) / 1.14));}}
.mop-yard{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--mop-ink);touch-action:none;user-select:none;-webkit-user-select:none;
background-color:var(--mop-grass);background-image:radial-gradient(ellipse 2px 5px at 7px 9px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 5px at 11px 11px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 5px at 27px 30px,var(--mop-grass2) 98%,transparent),radial-gradient(ellipse 2px 4px at 31px 31px,var(--mop-grass2) 98%,transparent);background-size:44px 44px;}
.mop-yard.earth{background-color:var(--mop-earth);background-image:radial-gradient(circle 2px at 8px 10px,var(--mop-earth2) 98%,transparent),radial-gradient(circle 3px at 30px 28px,var(--mop-earth2) 98%,transparent),radial-gradient(circle 1.5px at 20px 38px,var(--mop-earth2) 98%,transparent);background-size:44px 44px;}
.mop-yard svg{display:block;width:100%;height:auto;overflow:visible;font-family:'Manrope',system-ui,sans-serif;}
.mop-yard.shake svg{animation:mop-shake .25s;}
@keyframes mop-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.mop .t{fill:var(--mop-dirt);stroke:var(--mop-line);stroke-width:1.5;transition:fill .18s;}
.mop .t.c{fill:var(--mop-clean);}
.mop .t.f{fill:var(--mop-clean);}
.mop .wall{stroke:var(--mop-ink);stroke-width:5;stroke-linecap:square;fill:none;}
.mop .owall{stroke:var(--mop-ink);stroke-width:9;stroke-linecap:square;fill:none;}
.mop .fo{stroke:var(--mop-ink);stroke-width:2;stroke-linejoin:round;}
.mop .fl{stroke:var(--mop-ink);stroke-width:1.5;fill:none;stroke-linecap:round;opacity:.6;}
.mop .rm{pointer-events:none;font-size:17px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;fill:var(--mop-mute);}
.mop .walk{fill:var(--mop-walk);stroke:var(--mop-walkl);stroke-width:2;}
.mop .wl{stroke:var(--mop-walkl);stroke-width:2;fill:none;}
.mop .mat{fill:var(--mop-card);stroke:var(--mop-ink);stroke-width:2;}
.mop .sl{pointer-events:none;font-size:20px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;fill:var(--mop-ink);paint-order:stroke;stroke:var(--mop-wood);stroke-width:7px;}
.mop .inl{font-size:22px;font-weight:800;fill:var(--mop-ink);}
.mop .shadow{fill:rgba(0,0,0,.16);}
.mop .arrow{fill:none;stroke:var(--mop-ink);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;}
.mop .outl{font-size:22px;font-weight:800;fill:var(--mop-ink);paint-order:stroke;stroke:var(--mop-walk);stroke-width:6px;}
.mop .bot{pointer-events:none;transition:transform .12s ease-out;}
.mop .bot.out{transition:transform .5s ease-in;}
.mop .mh{fill:var(--mop-head);stroke:#0b0d12;stroke-width:2;stroke-linejoin:round;}
.mop .ms{fill:none;stroke:#0b0d12;stroke-width:1.5;stroke-linecap:round;opacity:.55;}
.mop .mc{fill:#e11d48;stroke:#0b0d12;stroke-width:2;}
.mop .mk{stroke:#0b0d12;stroke-width:11;stroke-linecap:round;}
.mop .mw{stroke:var(--mop-wood);stroke-width:7;stroke-linecap:round;}
.mop-tabs{display:flex;align-self:center;border:1px solid var(--mop-ink);border-radius:10px;overflow:hidden;background:var(--mop-ground);}
.mop-tabs button{all:unset;cursor:pointer;padding:8px 13px;font:800 13px/1.4 'Manrope',system-ui,sans-serif;color:var(--mop-ink);border-left:1px solid var(--mop-ink);border-radius:0;}
.mop-tabs button:first-child{border-left:0;}
.mop-tabs button[aria-current=true]{background:#fda4af;color:#08222e;}
.mop-tabs button.here::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor;margin-right:6px;vertical-align:1px;}
.mop-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--pst-bad,#be123c);}
.mop-msg.ok{color:var(--mop-ink);}
`;

function Board({ P, s, setS, active, done }) {
  const M = modelOf(P), multi = P.floors.length > 1;
  const [peek, setPeek] = useState(null);
  const [note, setNote] = useState(null);
  const [shake, setShake] = useState(0);
  const svgRef = useRef(null), drag = useRef(false);
  const view = done && peek != null ? peek : Math.min(s.view || 0, P.floors.length - 1);
  const F = P.floors[view], W = F.w, H = F.h;
  const here = s.path[s.path.length - 1];
  const on = useMemo(() => new Set(s.path), [s.path]);
  const art = useMemo(() => drawFloor(P, M, view), [P, M, view]);
  const solved = s.path.length === M.n && here === M.end;
  const live = active && !done;

  const nudge = (t) => { setNote({ t, bad: true }); setShake((n) => n + 1); };
  const step = (dx, dy, quiet) => {
    if (!live) return;
    const pc = cellOn(M, here, view);
    if (pc < 0) { if (!quiet) setNote({ t: `The mop is on the ${P.floors[M.at[here][0][0]].name}. Switch to that floor to move.`, bad: true }); return; }
    const x = (pc % W) + dx, y = Math.floor(pc / W) + dy;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const c = y * W + x, nd = M.floors[view].node[c];
    if (nd < 0) { if (!quiet) nudge('Furniture in the way.'); return; }
    if (!M.floors[view].open(pc, c)) { if (!quiet) nudge('There is a wall there.'); return; }
    if (on.has(nd)) { if (!quiet) nudge('Already mopped. Keep off it.'); return; }
    const pl = M.at[nd], nv = pl.length > 1 ? pl.find((a) => a[0] !== view)[0] : pl[0][0];
    const len = s.path.length + 1;
    if (len === M.n && nd === M.end) setNote({ t: 'Spotless. Out you go.' });
    else if (nd === M.end) setNote({ t: 'That is the way out, but the floors are not done. Undo.', bad: true });
    else if (!M.adj[nd].some((q) => q !== here && !on.has(q))) setNote({ t: 'Boxed in. Undo or Restart.', bad: true });
    else setNote(null);
    setS((st) => (st.path[st.path.length - 1] !== here ? st : { ...st, path: [...st.path, nd], view: nv }));
  };
  const stepRef = useRef(step); stepRef.current = step;
  useEffect(() => {
    if (!live) return undefined;
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const onKey = (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const d = KEYS[ev.key]; if (!d) return;
      ev.preventDefault(); stepRef.current(d[0], d[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live]);
  useEffect(() => { if (s.path.length < 2) setNote(null); }, [s.path.length]);

  const delta = (ev) => {
    const svg = svgRef.current; if (!svg) return null;
    const pc = cellOn(M, here, view); if (pc < 0) return 'off';
    const r = svg.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * (W * U + PAD * 2) - PAD, y = ((ev.clientY - r.top) / r.height) * (H * U + PADY * 2) - PADY;
    return [Math.floor(x / U) - (pc % W), Math.floor(y / U) - Math.floor(pc / W)];
  };
  const down = (ev) => {
    if (!live) return;
    drag.current = true;
    const d = delta(ev);
    if (d === 'off') { step(1, 0); return; }
    if (d && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1]);
  };
  const move = (ev) => {
    if (!drag.current || !live) return;
    const d = delta(ev);
    if (d && d !== 'off' && Math.abs(d[0]) + Math.abs(d[1]) === 1) step(d[0], d[1], true);
  };
  const up = () => { drag.current = false; };

  const pc = cellOn(M, here, view);
  let bx = 0, by = 0;
  if (pc >= 0) { bx = (pc % W) * U + 50; by = Math.floor(pc / W) * U + 50; }
  const gone = solved && pc >= 0 && view === P.end[0];
  if (gone) by += DIRS[P.sides[1]][1] * 130;
  const tiles = [];
  for (let c = 0; c < W * H; c++) {
    const id = M.floors[view].node[c];
    tiles.push(<rect key={c} className={`t${id < 0 ? ' f' : on.has(id) ? ' c' : ''}`} x={(c % W) * U} y={Math.floor(c / W) * U} width={U} height={U} />);
  }
  const left = M.n - s.path.length;
  return (
    <div className="mop">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {multi ? (
        <div className="mop-tabs" role="tablist" aria-label="Floors">
          {P.floors.map((f, k) => (
            <button key={f.name} type="button" role="tab" aria-current={k === view} className={cellOn(M, here, k) >= 0 ? 'here' : ''}
              onClick={() => { if (done) setPeek(k); else setS((st) => ({ ...st, view: k })); }}>{f.name}</button>
          ))}
        </div>
      ) : null}
      <div key={shake} className={`mop-yard${F.name === 'Basement' ? ' earth' : ''}${shake ? ' shake' : ''}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}>
        <svg ref={svgRef} viewBox={`${-PAD} ${-PADY} ${W * U + PAD * 2} ${H * U + PADY * 2}`} role="img"
          aria-label={`${multi ? `${F.name}, ` : ''}a house floor plan ${W} by ${H}, ${left} ${left === 1 ? 'tile' : 'tiles'} left to mop`}>
          <g dangerouslySetInnerHTML={{ __html: art.under }} />
          {tiles}
          <g dangerouslySetInnerHTML={{ __html: art.over }} />
          {pc >= 0 ? <g className={`bot${gone ? ' out' : ''}`} style={{ transform: `translate(${bx}px,${by}px)` }} dangerouslySetInnerHTML={{ __html: MOP }} /> : null}
        </svg>
      </div>
      <div className={`mop-msg${note && !note.bad ? ' ok' : ''}`} aria-live="polite">{live && note ? note.t : ''}</div>
    </div>
  );
}

function Tools({ P, s, setS, active, done }) {
  if (done) return null;
  const M = modelOf(P), can = active && s.path.length > 1;
  const undo = () => setS((st) => {
    if (st.path.length < 2) return st;
    const path = st.path.slice(0, -1), nd = path[path.length - 1], prev = path[path.length - 2], pl = M.at[nd];
    let view = st.view;
    if (cellOn(M, nd, view) < 0) view = pl[0][0];
    else if (pl.length > 1 && prev !== undefined) { const other = pl.find((a) => a[0] !== view)[0]; if (cellOn(M, prev, view) >= 0 && cellOn(M, prev, other) < 0) view = other; }
    return { ...st, path, view, undos: (st.undos || 0) + 1 };
  });
  const restart = () => setS((st) => (st.path.length < 2 ? st : { ...st, path: [M.start], view: P.start[0], undos: (st.undos || 0) + 1 }));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
      <button type="button" className="sd-tool" onClick={undo} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Undo</button>
      <button type="button" className="sd-tool" onClick={restart} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Restart</button>
    </div>
  );
}

const doorLine = (P) => (P.floors.length > 1
  ? 'Three floors today: come in the front door, mop the ground floor, the upstairs and the basement, and leave by the back door.'
  : same(P) ? 'Come in by the front door and leave by the same door: it is two tiles wide, in on one side and out on the other.'
    : 'Come in the front door and leave by the back door.');

const GAME = {
  key: 'mop', name: 'Mop', cat: 'Logic', miss: null,
  fresh: (P) => ({ path: [modelOf(P).start], view: P.start[0], undos: 0 }),
  validSave: (P, s) => { const M = modelOf(P); return Array.isArray(s.path) && s.path.length >= 1 && s.path[0] === M.start && s.path.every((v) => Number.isInteger(v) && v >= 0 && v < M.n); },
  touched: (s) => s.path.length > 1,
  solved: (P, s) => { const M = modelOf(P); return s.path.length === M.n && s.path[s.path.length - 1] === M.end; },
  count: () => 0,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: 0 }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.house}`} · No. ${P.num}`,
  foot: (P, s) => `Mopped ${s.path.length} of ${modelOf(P).n}`,
  frac: (P, s) => s.path.length / modelOf(P).n,
  sundayLabel: () => 'Sunday Edition · Three Floors',
  gateTitle: (P) => (P.floors.length > 1 ? `Today: three floors, ${modelOf(P).n} tiles` : `Today: the ${P.house}, ${modelOf(P).n} tiles`),
  gateLine: (P) => `Mop every tile exactly once, and never step on a tile you have already mopped. ${doorLine(P)}`,
  rules: (P) => ({
    lead: 'Mop every tile once, then get out.',
    steps: [
      <><b>Tap</b> or <b>drag</b> to the next tile, up, down, left or right (arrow keys work too). Every tile you step on is mopped.</>,
      <>A mopped tile is wet: you can <b>never step on it again</b>. Walls and furniture block you, and rooms join only at their doorways.</>,
      <>{doorLine(P)} The last tile you mop has to be the one inside the way <b>Out</b>.</>,
      ...(P.floors.length > 1 ? [<>A <b>staircase</b> is one tile shared by two floors. Step on it and you change floor, so go up one staircase and come down the other. The tabs show any floor, and a dot marks the one the mop is on.</>] : []),
      <><b>Undo</b> takes back a step and <b>Restart</b> clears the house. Both are free.</>,
    ],
    knack: 'Look for the dead ends first. A tile with only two ways in and out has to be passed straight through, and a room with one doorway has to be the first or the last thing you mop.',
    footer: 'A spotless house ranks on the clock. Giving up scores nothing.',
  }),
  pitch: (P) => (P.floors.length > 1 ? `Three floors and ${modelOf(P).n} tiles. Mop every one exactly once and get out.` : `${modelOf(P).n} tiles in the ${P.house}. Mop every one exactly once and get out.`),
  shareLine: (P, s, won, el) => `Mop #${P.num} · ${P.floors.length > 1 ? 'three floors' : P.house} · ${won ? el : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.floors.length > 1 ? 'Three floors' : P.house} · ${modelOf(P).n} tiles · ${el}`,
  aboutTitle: 'About Mop',
  about: [
    'Mop is a free daily route puzzle from Mind Loft. A house is drawn from above, with rooms, doorways and furniture, and you push a mop through it one tile at a time. Every tile has to be mopped exactly once, a wet tile can never be stepped on again, and the last tile you mop is the one inside the door you leave by.',
    'The houses grow through the week: a six by six cottage on Monday and Tuesday, a seven by seven townhouse midweek, an eight by eight manor on Friday and Saturday. Some days you leave by the back door and some days by the same front door you came in. The Sunday Edition is a whole house on three floors, upstairs, ground floor and basement, joined by staircases you can each use once.',
    'Every house is generated fresh and solved before it is dealt, so there is always a way through. The clock decides the daily leaderboard.',
    <>More route puzzles: <a href="/connect" style={{ color: 'inherit', fontWeight: 800 }}>Connect</a>, <a href="/chomp" style={{ color: 'inherit', fontWeight: 800 }}>Chomp</a> and <a href="/hedge" style={{ color: 'inherit', fontWeight: 800 }}>Hedge</a>.</>,
  ],
};

export default function MopClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
