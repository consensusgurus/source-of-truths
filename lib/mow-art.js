// lib/mow-art.js: how a Mow yard is drawn, as SVG strings. Shared by the board
// (app/mow/MowClient.jsx), the hand-built share card (scripts/bake-mow-og.mjs)
// and nothing else, so the card always shows the game's real trees, fences and
// mower. A yard is one floor of the Mop model (lib/mop-engine.js): rooms are the
// fenced sections, doors the gates, pieces what the mower goes round.
export const U = 100;
export const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ROT = { N: -90, S: 90, W: 180, E: 0 };

// The palette, as CSS custom properties, in the light and the dark register.
export const MOW_LIGHT = `--mw-ink:#0b0d12;--mw-mute:#24452a;--mw-tall:#6fae4c;--mw-tuft:#4e8f33;--mw-cut:#b2e08a;--mw-cut2:#c9eda6;
--mw-line:rgba(20,60,20,.18);--mw-ground:#ffffff;--mw-fence:#9a6a3a;--mw-post:#6e4622;--mw-walk:#e9e4d6;--mw-walkl:rgba(11,15,26,.16);--mw-road:#5b6170;--mw-gravel:#d8cfbd;--mw-gravel2:rgba(90,70,40,.25);
--mw-leaf:#3f8f3a;--mw-leaf2:#5fb04f;--mw-leaf3:#2f6e2c;--mw-soil:#8a5f3c;--mw-soil2:#a8774e;--mw-stone:#c7c9cc;--mw-stone2:#9fa3a9;--mw-water:#7cc5ec;--mw-water2:#b8e3f8;
--mw-roof:#8d4b3a;--mw-roof2:#6f3a2c;--mw-shed:#c99b62;--mw-shed2:#a97a45;--mw-tramp:#20242c;--mw-ramp:#3b82f6;--mw-bad:#e11d48;`;
export const MOW_DARK = `--mw-ink:#e9edf4;--mw-mute:#d6f5d0;--mw-tall:#2c6430;--mw-tuft:#1f4d24;--mw-cut:#4a9650;--mw-cut2:#5aa961;
--mw-line:rgba(0,0,0,.28);--mw-ground:#0b0f1a;--mw-fence:#b08050;--mw-post:#d1a774;--mw-walk:#4d4b45;--mw-walkl:rgba(255,255,255,.16);--mw-road:#2b2f38;--mw-gravel:#4f4637;--mw-gravel2:rgba(255,230,190,.14);
--mw-leaf:#2f7a33;--mw-leaf2:#46964a;--mw-leaf3:#1f5524;--mw-soil:#6a4a30;--mw-soil2:#87603f;--mw-stone:#8e939b;--mw-stone2:#6c7179;--mw-water:#3f86b3;--mw-water2:#5aa3cf;
--mw-roof:#7a4335;--mw-roof2:#5c3126;--mw-shed:#a8834f;--mw-shed2:#86653a;--mw-tramp:#0d0f14;--mw-ramp:#60a5fa;--mw-bad:#fb7185;`;
// The rules for everything inside the board's svg (scoped to .mow).
export const MOW_ART_CSS = `
.mow .g{stroke:var(--mw-line);stroke-width:1.2;}
.mow .g.u{fill:url(#mw-tall);}
.mow .g.h{fill:url(#mw-h);}
.mow .g.v{fill:url(#mw-v);}
.mow .g.x{fill:var(--mw-bad);}
.mow .g.f{fill:var(--mw-tall);}
.mow .fence{stroke:var(--mw-fence);stroke-width:7;stroke-linecap:butt;fill:none;}
.mow .post{fill:var(--mw-post);}
.mow .po{stroke:var(--mw-ink);stroke-width:2;stroke-linejoin:round;}
.mow .pl{stroke:var(--mw-ink);stroke-width:1.5;fill:none;stroke-linecap:round;opacity:.5;}
.mow .rm{pointer-events:none;font-size:17px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;fill:var(--mw-mute);paint-order:stroke;stroke:var(--mw-cut2);stroke-width:5px;}
.mow .walk{fill:var(--mw-walk);}
.mow .road{fill:var(--mw-road);}
.mow .grav{fill:var(--mw-gravel);}
.mow .wl{stroke:var(--mw-walkl);stroke-width:2;fill:none;}
.mow .shadow{fill:rgba(0,0,0,.16);}
.mow .arrow{fill:none;stroke:var(--mw-ink);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;}
.mow .gl{font-size:22px;font-weight:800;fill:var(--mw-ink);paint-order:stroke;stroke:var(--mw-walk);stroke-width:6px;}
.mow .gl.o{stroke:var(--mw-gravel);}
.mow .bot{pointer-events:none;transition:transform .12s ease-out;}
.mow .bot.out{transition:transform .5s ease-in;}
.mow .bot>g{transition:transform .12s ease-out;}
`;

// The patterns the tiles fill with: tall grass, and grass mown across (h) or
// up and down (v), so the stripes a real mower leaves follow the route.
export const MOW_DEFS = `<defs>
<pattern id="mw-tall" patternUnits="userSpaceOnUse" width="50" height="50"><rect width="50" height="50" fill="var(--mw-tall)"/><path d="M8 20l3-9 3 9M30 44l3-9 3 9M36 18l2-7 2 7M14 42l2-7 2 7" stroke="var(--mw-tuft)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></pattern>
<pattern id="mw-h" patternUnits="userSpaceOnUse" width="100" height="100"><rect width="100" height="100" fill="var(--mw-cut)"/><rect y="25" width="100" height="50" fill="var(--mw-cut2)"/></pattern>
<pattern id="mw-v" patternUnits="userSpaceOnUse" width="100" height="100"><rect width="100" height="100" fill="var(--mw-cut)"/><rect x="25" width="50" height="100" fill="var(--mw-cut2)"/></pattern>
</defs>`;

// ── what stands in the yard, drawn from above in a landscape box L x S ───────
const R = (x, y, w, h, r, f, cls = 'po') => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="var(--mw-${f})"/>`;
const C = (x, y, r, f, cls = 'po') => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" fill="var(--mw-${f})"/>`;
const Cn = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const Ln = (d) => `<path class="pl" d="${d}"/>`;
const shade = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,.18)"/>`;
const BLOOM = ['#f43f5e', '#facc15', '#a855f7', '#ffffff', '#fb923c'];
const KINDS = {
  tree: () => shade(58, 60, 44, 40) + C(50, 50, 44, 'leaf') + Cn(36, 36, 17, 'var(--mw-leaf2)') + Cn(62, 34, 13, 'var(--mw-leaf2)') + Cn(40, 64, 12, 'var(--mw-leaf3)') + Cn(66, 60, 14, 'var(--mw-leaf3)') + Cn(50, 50, 5, 'var(--mw-soil)'),
  bush: () => shade(56, 58, 34, 30) + C(36, 56, 22, 'leaf') + C(62, 58, 22, 'leaf') + C(50, 36, 22, 'leaf') + Cn(46, 32, 8, 'var(--mw-leaf2)') + Cn(32, 52, 7, 'var(--mw-leaf2)') + Cn(60, 54, 7, 'var(--mw-leaf2)'),
  hedge: (L) => shade(L / 2 + 6, 58, L / 2 - 6, 30) + R(8, 22, L - 16, 56, 26, 'leaf') + Array.from({ length: Math.round(L / 34) }, (_, i) => Cn(24 + i * 34, 40, 9, 'var(--mw-leaf2)') + Cn(36 + i * 34, 60, 8, 'var(--mw-leaf3)')).join(''),
  flowers: (L) => R(10, 14, L - 20, 72, 12, 'soil') + Array.from({ length: Math.max(1, Math.floor((L - 40) / 24)) * 2 }, (_, i) => {
    const x = 26 + (i >> 1) * 24 + ((i & 1) ? 10 : 0), y = (i & 1) ? 62 : 36;
    return Cn(x, y, 9, 'var(--mw-leaf)') + Cn(x, y, 6, BLOOM[i % BLOOM.length]) + Cn(x, y, 2, '#78350f');
  }).join(''),
  veg: (L) => R(10, 14, L - 20, 72, 6, 'soil') + [32, 50, 68].map((y) => Ln(`M18 ${y}H${L - 18}`) + Array.from({ length: Math.floor((L - 36) / 18) + 1 }, (_, i) => Cn(26 + i * 18, y, 6, i % 3 === 1 ? '#f97316' : 'var(--mw-leaf2)')).join('')).join(''),
  rock: () => shade(56, 60, 32, 24) + `<path class="po" d="M22 62L30 32L54 22L76 36L80 62L58 76L34 74Z" fill="var(--mw-stone)"/>` + `<path d="M34 40L52 30L66 38" stroke="#fff" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round"/>` + `<path class="po" d="M70 74L80 66L88 74L80 82Z" fill="var(--mw-stone2)"/>`,
  birdbath: () => shade(56, 58, 36, 34) + C(50, 50, 36, 'stone') + C(50, 50, 26, 'water') + Cn(42, 42, 6, 'var(--mw-water2)'),
  fountain: () => shade(56, 58, 42, 40) + C(50, 50, 42, 'stone') + C(50, 50, 33, 'water') + C(50, 50, 14, 'stone') + Cn(50, 50, 6, 'var(--mw-water2)') + Cn(36, 40, 4, 'var(--mw-water2)') + Cn(64, 62, 4, 'var(--mw-water2)'),
  kennel: () => shade(56, 58, 38, 34) + R(14, 16, 72, 68, 4, 'shed') + Ln('M50 16V84') + R(38, 74, 24, 14, 4, 'roof2') + C(74, 84, 7, 'water'),
  pond: (L, S) => {
    const rim = Array.from({ length: Math.round((L + S) / 18) }, (_, i) => { const a = (i / Math.round((L + S) / 18)) * Math.PI * 2; return Cn(L / 2 + Math.cos(a) * (L / 2 - 10), S / 2 + Math.sin(a) * (S / 2 - 10), 9, 'var(--mw-stone)'); }).join('');
    return rim + `<ellipse class="po" cx="${L / 2}" cy="${S / 2}" rx="${L / 2 - 14}" ry="${S / 2 - 14}" fill="var(--mw-water)"/>`
      + `<path d="M${L * 0.3} ${S * 0.36}q${L * 0.08} -6 ${L * 0.16} 0" stroke="var(--mw-water2)" stroke-width="4" fill="none" stroke-linecap="round"/>`
      + `<path d="M${L * 0.66} ${S * 0.62} m-11 0a11 11 0 1 0 11 -11l0 11z" fill="var(--mw-leaf2)"/>` + `<path d="M${L * 0.34} ${S * 0.68} m-8 0a8 8 0 1 0 8 -8l0 8z" fill="var(--mw-leaf)"/>`
      + (S > 100 ? `<ellipse cx="${L * 0.55}" cy="${S * 0.42}" rx="9" ry="4" fill="#fb923c" transform="rotate(-20 ${L * 0.55} ${S * 0.42})"/>` : '');
  },
  shed: (L, S) => shade(L / 2 + 8, S / 2 + 10, L / 2 - 6, S / 2 - 8) + R(8, 8, L - 16, S - 16, 4, 'shed') + R(8, 8, L - 16, (S - 16) / 2, 4, 'shed2') + Ln(`M8 ${S / 2}H${L - 8}`)
    + Array.from({ length: Math.floor((L - 16) / 22) }, (_, i) => Ln(`M${26 + i * 22} 12V${S - 12}`)).join('') + R(L / 2 - 16, S - 22, 32, 14, 3, 'roof2'),
  trampoline: (L, S) => shade(L / 2 + 8, S / 2 + 10, L / 2 - 10, S / 2 - 10) + C(L / 2, S / 2, Math.min(L, S) / 2 - 10, 'ramp') + C(L / 2, S / 2, Math.min(L, S) / 2 - 22, 'tramp')
    + Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r1 = Math.min(L, S) / 2 - 22, r2 = Math.min(L, S) / 2 - 12; return `<path d="M${L / 2 + Math.cos(a) * r1} ${S / 2 + Math.sin(a) * r1}L${L / 2 + Math.cos(a) * r2} ${S / 2 + Math.sin(a) * r2}" stroke="#d1d5db" stroke-width="2"/>`; }).join(''),
  house: (L, S) => {
    const i = 10, r = Math.min(L, S) / 2 - i;
    return shade(L / 2 + 12, S / 2 + 14, L / 2 - 4, S / 2 - 4) + R(i, i, L - 2 * i, S - 2 * i, 3, 'roof')
      + `<path class="pl" style="opacity:.7" d="M${i} ${i}L${i + r} ${S / 2}L${L - i - r} ${S / 2}L${L - i} ${i}M${i} ${S - i}L${i + r} ${S / 2}M${L - i - r} ${S / 2}L${L - i} ${S - i}"/>`
      + `<path d="M${i + r} ${S / 2}L${L - i - r} ${S / 2}" stroke="var(--mw-roof2)" stroke-width="6" stroke-linecap="round"/>`
      + Array.from({ length: Math.floor((S - 2 * i) / 16) }, (_, k) => `<path d="M${i + 4} ${i + 8 + k * 16}H${L - i - 4}" stroke="var(--mw-roof2)" stroke-opacity=".35" stroke-width="2"/>`).join('')
      + R(L * 0.68, S * 0.2, 22, 22, 2, 'stone');
  },
};

// The mower, from above, facing east (the way it last moved); the handle and
// its bar trail behind it.
export const MOWER = '<g><path d="M-26 -20L-60 -16M-26 20L-60 16" stroke="#0b0d12" stroke-width="5" stroke-linecap="round"/><path d="M-60 -22V22" stroke="#0b0d12" stroke-width="8" stroke-linecap="round"/>'
  + '<rect x="-30" y="-34" width="14" height="12" rx="3" fill="#0b0d12"/><rect x="-30" y="22" width="14" height="12" rx="3" fill="#0b0d12"/><rect x="16" y="-34" width="14" height="12" rx="3" fill="#0b0d12"/><rect x="16" y="22" width="14" height="12" rx="3" fill="#0b0d12"/>'
  + '<rect x="-28" y="-27" width="58" height="54" rx="14" fill="#dc2626" stroke="#0b0d12" stroke-width="3"/><circle cx="2" cy="0" r="17" fill="#374151" stroke="#0b0d12" stroke-width="2"/><circle cx="2" cy="0" r="7" fill="#9ca3af"/><rect x="20" y="-14" width="7" height="28" rx="3" fill="#fecaca"/></g>';
export const mowerTurn = (dir) => ROT[dir] ?? -90;

// Everything in the yard that never changes during play: the street and the
// back lane, the shadow, what stands in the yard, the section names, the fences
// and their posts, and the gate marks.
export function drawYard(P, M, { padX = 34, padY = 80 } = {}) {
  const F = P.floors[0], W = F.w, H = F.h, N = W * H, FL = M.floors[0], room = FL.room;
  const gaps = [[P.start[1], P.sides[0], 'In'], [P.end[1], P.sides[1], 'Out']];
  let under = '', over = '';
  const bx0 = -padX - 400, bw = W * U + 2 * padX + 800;
  // the street side: a pavement, then the road; the back: a gravel lane
  under += `<rect class="walk" x="${bx0}" y="${H * U}" width="${bw}" height="${padY - 22}"/><rect class="road" x="${bx0}" y="${H * U + padY - 22}" width="${bw}" height="400"/>`;
  for (let x = -padX - 60; x < W * U + padX + 60; x += 70) under += `<path class="wl" d="M${x} ${H * U}V${H * U + padY - 22}"/>`;
  under += `<rect class="grav" x="${bx0}" y="${-padY - 400}" width="${bw}" height="${padY + 400}"/>`;
  for (let i = 0; i < 46; i++) under += `<circle cx="${((i * 97) % (W * U + 2 * padX)) - padX}" cy="${-8 - ((i * 53) % (padY - 12))}" r="${3 + (i % 3)}" fill="var(--mw-gravel2)"/>`;
  under += `<rect class="shadow" x="10" y="12" width="${W * U}" height="${H * U}" rx="4"/>`;
  const cornerCells = new Set();
  F.pieces.forEach(([x, y, w, h, type]) => {
    if (type !== 'corner') return;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) cornerCells.add((y + j) * W + x + i);
    // the corner of a house that stands off the yard: its roof runs on out of
    // the picture, and its walls are the fence along that corner
    const left = x === 0, X0 = left ? -700 : x * U, X1 = left ? (x + w) * U : W * U + 700, Y0 = -700, Y1 = (y + h) * U;
    const cx = left ? X1 : X0;
    over += `<rect x="${X0 + (left ? 0 : 14)}" y="${Y0}" width="${X1 - X0 - 14}" height="${Y1 - Y0 + 16}" fill="rgba(0,0,0,.2)"/>`;
    over += `<rect class="po" x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" fill="var(--mw-roof)"/>`;
    for (let k = 1; k * 18 < Y1 - Y0; k++) over += `<path d="M${X0} ${Y1 - k * 18}H${X1}" stroke="var(--mw-roof2)" stroke-opacity=".35" stroke-width="2"/>`;
    over += `<path d="M${cx} ${Y1}L${cx + (left ? -700 : 700)} ${Y1 - 700}" stroke="var(--mw-roof2)" stroke-width="7" stroke-linecap="round"/>`;
    over += `<rect class="po" x="${left ? X1 - 70 : X0 + 40}" y="${Y1 - 82}" width="30" height="30" rx="2" fill="var(--mw-stone)"/>`;
    over += `<rect class="po" x="${left ? X1 - 110 : X0 + 40}" y="${Y1 - 6}" width="70" height="18" rx="4" fill="var(--mw-stone)"/>`;
  });
  F.pieces.forEach(([x, y, w, h, type]) => {
    if (type === 'corner') return;
    const draw = KINDS[type] || KINDS.bush, L = Math.max(w, h) * U, S = Math.min(w, h) * U;
    over += `<g transform="translate(${h > w ? (x + w) * U : x * U} ${y * U})${h > w ? ' rotate(90)' : ''}">${draw(L, S)}</g>`;
  });
  const seen = {};
  for (let c = 0; c < N; c++) {
    if (FL.furn.has(c) || seen[room[c]]) continue;
    seen[room[c]] = 1;
    // the name fits the section's own width from where it starts, never more
    let run = 0; for (let x = c % W; x < W && room[Math.floor(c / W) * W + x] === room[c]; x++) run++;
    const name = F.names[room[c]], room4 = run * U - 18, want = name.length * 11.2;
    over += `<text class="rm" x="${(c % W) * U + 9}" y="${Math.floor(c / W) * U + 25}"${want > room4 ? ` textLength="${room4}" lengthAdjust="spacingAndGlyphs"` : ''}>${name}</text>`;
  }
  // fences: every closed edge between two sections, and the yard's own edge
  // except the two gates, each run with a post at both ends
  const segs = [];
  for (let c = 0; c < N; c++) {
    const x = c % W, y = Math.floor(c / W);
    if (x < W - 1 && !FL.open(c, c + 1) && !cornerCells.has(c) && !cornerCells.has(c + 1)) segs.push([(x + 1) * U, y * U, (x + 1) * U, (y + 1) * U]);
    if (c + W < N && !FL.open(c, c + W) && !cornerCells.has(c) && !cornerCells.has(c + W)) segs.push([x * U, (y + 1) * U, (x + 1) * U, (y + 1) * U]);
  }
  const gateAt = { N: new Set(), S: new Set() };
  gaps.forEach((g) => gateAt[g[1]].add(g[0] % W));
  for (let x = 0; x < W; x++) {
    if (!gateAt.N.has(x) && !cornerCells.has(x)) segs.push([x * U, 0, (x + 1) * U, 0]);
    if (!gateAt.S.has(x)) segs.push([x * U, H * U, (x + 1) * U, H * U]);
  }
  for (let y = 0; y < H; y++) {
    if (!cornerCells.has(y * W)) segs.push([0, y * U, 0, (y + 1) * U]);
    if (!cornerCells.has(y * W + W - 1)) segs.push([W * U, y * U, W * U, (y + 1) * U]);
  }
  over += `<path class="fence" d="${segs.map(([a, b, c, d]) => `M${a} ${b}L${c} ${d}`).join('')}"/>`;
  // every gate between two sections stands open: a short leaf swung off its post
  F.doors.forEach(([a, b]) => {
    if (cornerCells.has(a) || cornerCells.has(b)) return;
    const ax = a % W, ay = Math.floor(a / W);
    // swung back into the bottom-right of the first square, clear of any name
    if (b === a + 1) over += `<path class="fence" style="stroke-width:5" d="M${(ax + 1) * U} ${(ay + 1) * U - 8}l-26 -30"/>`;
    else over += `<path class="fence" style="stroke-width:5" d="M${(ax + 1) * U - 8} ${(ay + 1) * U}l-30 -26"/>`;
  });
  const posts = new Set();
  segs.forEach(([a, b, c, d]) => { posts.add(`${a},${b}`); posts.add(`${c},${d}`); });
  posts.forEach((p) => { const [x, y] = p.split(',').map(Number); over += `<rect class="post" x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3"/>`; });
  // the gate marks: an arrow and In / Out, off the yard on the gate's side
  gaps.forEach((g) => {
    const dr = DIRS[g[1]], into = g[2] === 'In', cx = (g[0] % W) * U + 50, cy = Math.floor(g[0] / W) * U + 50, y = cy + dr[1] * 80;
    const side = into ? (g[1] === 'N' ? 'S' : 'N') : g[1];
    over += `<g transform="translate(${cx - 22} ${y - 2}) rotate(${ROT[side]})"><path class="arrow" d="M-10 0H10M2 -8 10 0 2 8"/></g><text class="gl${g[1] === 'N' ? ' o' : ''}" x="${cx + 14}" y="${y + 6}" text-anchor="middle">${g[2]}</text>`;
  });
  return { under, over };
}
