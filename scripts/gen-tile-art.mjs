// Draw the 76x76 daily tile art for Chain, Hold and Turn, in both the
// full-colour and the brand-blue palette, and write them straight to
// public/games.
//
// All three are geometric (a dots-and-boxes fragment, a chessboard corner, an
// Othello board fragment), so
// the drawing is done procedurally at 4x and box-filtered down rather than
// exported from a design tool. That keeps the two palettes pixel-identical in
// shape, which is exactly what rule 12 of the daily puzzle authoring standard
// asks for: same drawing, remapped palette, never a redraw.
//
//   node scripts/gen-tile-art.mjs
//
// Writes: public/games/btn-<key>.png and public/games/blue/btn-<key>.png
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const S = 76;      // final tile size
const SS = 4;      // supersample factor
const W = S * SS;

// ── a tiny RGBA canvas ─────────────────────────────────────────────────────
function canvas() {
  return { px: new Uint8ClampedArray(W * W * 4) };
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function put(c, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= W || y >= W) return;
  const o = (y * W + x) * 4;
  const src = a / 255;
  const dstA = c.px[o + 3] / 255;
  const outA = src + dstA * (1 - src);
  if (outA <= 0) return;
  for (let k = 0; k < 3; k++) c.px[o + k] = (rgb[k] * src + c.px[o + k] * dstA * (1 - src)) / outA;
  c.px[o + 3] = outA * 255;
}
// Rounded rectangle, in FINAL-size units.
function roundRect(c, x, y, w, h, r, rgb, a = 255) {
  const X = x * SS, Y = y * SS, Wd = w * SS, Hd = h * SS, R = r * SS;
  for (let py = Math.floor(Y); py < Math.ceil(Y + Hd); py++) {
    for (let px = Math.floor(X); px < Math.ceil(X + Wd); px++) {
      const dx = Math.min(px - X, X + Wd - 1 - px);
      const dy = Math.min(py - Y, Y + Hd - 1 - py);
      if (dx < R && dy < R) {
        const cx = dx < R ? X + R : px, cy = dy < R ? Y + R : py;
        const ox = px < X + R ? X + R : X + Wd - R, oy = py < Y + R ? Y + R : Y + Hd - R;
        void cx; void cy;
        if ((px - ox) ** 2 + (py - oy) ** 2 > R * R) continue;
      }
      put(c, px, py, rgb, a);
    }
  }
}
function disc(c, cx, cy, r, rgb, a = 255) {
  const X = cx * SS, Y = cy * SS, R = r * SS;
  for (let py = Math.floor(Y - R); py <= Math.ceil(Y + R); py++) {
    for (let px = Math.floor(X - R); px <= Math.ceil(X + R); px++) {
      if ((px - X) ** 2 + (py - Y) ** 2 <= R * R) put(c, px, py, rgb, a);
    }
  }
}
// A capsule between two points, in FINAL-size units.
function bar(c, x1, y1, x2, y2, t, rgb, a = 255) {
  const half = t / 2;
  if (y1 === y2) roundRect(c, Math.min(x1, x2) - half, y1 - half, Math.abs(x2 - x1) + t, t, half, rgb, a);
  else roundRect(c, x1 - half, Math.min(y1, y2) - half, t, Math.abs(y2 - y1) + t, half, rgb, a);
}

function downsample(c) {
  const out = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const o = ((y * SS + sy) * W + (x * SS + sx)) * 4;
          const al = c.px[o + 3] / 255;
          r += c.px[o] * al; g += c.px[o + 1] * al; b += c.px[o + 2] * al; a += al;
        }
      }
      const n = SS * SS;
      const o = (y * S + x) * 4;
      out[o] = a > 0 ? Math.round(r / a) : 0;
      out[o + 1] = a > 0 ? Math.round(g / a) : 0;
      out[o + 2] = a > 0 ? Math.round(b / a) : 0;
      out[o + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

// ── PNG encoding (RGBA, 8-bit, colour type 6) ──────────────────────────────
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(rgba) {
  const raw = Buffer.alloc((S * 4 + 1) * S);
  for (let y = 0; y < S; y++) {
    raw[y * (S * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── the two drawings ───────────────────────────────────────────────────────
//
// Palettes carry the SAME roles in both versions, so the shape never changes:
//   ground   the tile background
//   line     dots and drawn edges
//   claim    the one captured box / the piece, the second accent
//   ghost    the undrawn edge, a faint hint of the rest of the board

// CHAIN: a 3x3 dot grid, the top-left box closed and claimed, two more edges
// drawn and the rest ghosted, which is the shape of a real endgame fragment.
function drawChain(p) {
  const c = canvas();
  roundRect(c, 0, 0, S, S, 16, hex(p.ground));
  const X = [19, 38, 57], Y = [19, 38, 57];
  // the claimed box, drawn under the lines
  roundRect(c, X[0] + 3, Y[0] + 3, X[1] - X[0] - 6, Y[1] - Y[0] - 6, 3, hex(p.claim));
  const T = 4.6;
  // ghosted (undrawn) edges first
  bar(c, X[1], Y[1], X[2], Y[1], T, hex(p.ghost), 90);
  bar(c, X[2], Y[0], X[2], Y[1], T, hex(p.ghost), 90);
  bar(c, X[0], Y[2], X[1], Y[2], T, hex(p.ghost), 90);
  // the closed box
  bar(c, X[0], Y[0], X[1], Y[0], T, hex(p.line));
  bar(c, X[0], Y[1], X[1], Y[1], T, hex(p.line));
  bar(c, X[0], Y[0], X[0], Y[1], T, hex(p.line));
  bar(c, X[1], Y[0], X[1], Y[1], T, hex(p.line));
  // two more drawn edges, so the fragment reads as mid-game
  bar(c, X[1], Y[0], X[2], Y[0], T, hex(p.line));
  bar(c, X[0], Y[1], X[0], Y[2], T, hex(p.line));
  for (const x of X) for (const y of Y) disc(c, x, y, 3.6, hex(p.line));
  return c;
}

// HOLD: a chessboard corner with one piece left standing, the shape of a
// position you are trying to survive rather than win.
function drawHold(p) {
  const c = canvas();
  roundRect(c, 0, 0, S, S, 16, hex(p.ground));
  const o = 16, cell = 11;
  for (let r = 0; r < 4; r++) {
    for (let f = 0; f < 4; f++) {
      if ((r + f) % 2 === 0) continue;
      roundRect(c, o + f * cell, o + r * cell, cell, cell, 1, hex(p.line), 62);
    }
  }
  roundRect(c, o - 1.5, o - 1.5, cell * 4 + 3, cell * 4 + 3, 3, hex(p.line), 0); // spacing guard
  // the lone king. The cross is what makes it read as a king rather than a
  // pawn at 76px, so it sits clear of the crown with its own gap.
  const cx = o + cell * 2.5, top = o + cell * 0.55;
  bar(c, cx, top, cx, top + 5.2, 3.0, hex(p.claim));               // cross, upright
  bar(c, cx - 3.6, top + 1.9, cx + 3.6, top + 1.9, 3.0, hex(p.claim)); // cross, arms
  disc(c, cx, top + 10.6, 5.2, hex(p.claim));                      // crown
  roundRect(c, cx - 6.4, top + 14.6, 12.8, 3.0, 1.5, hex(p.claim));// collar
  roundRect(c, cx - 7.8, top + 18.2, 15.6, 4.4, 2, hex(p.claim));  // base
  return c;
}

// TURN: a 4x4 corner of an Othello board, discs on most of it, one empty square
// carrying the small marker that means "you can play here". The two disc
// colours are the whole game, so they map to two different steps in both
// palettes rather than collapsing into one.
function drawTurn(p) {
  const c = canvas();
  roundRect(c, 0, 0, S, S, 16, hex(p.ground));
  const o = 13, cell = 12.5, gap = 1.4;
  // 1 = your disc, 2 = the engine's, 0 = empty, 9 = empty with a marker.
  const GRID = [
    [2, 1, 1, 1],
    [1, 1, 2, 1],
    [1, 2, 2, 9],
    [0, 1, 2, 2],
  ];
  for (let r = 0; r < 4; r++) {
    for (let f = 0; f < 4; f++) {
      const x = o + f * cell, y = o + r * cell;
      roundRect(c, x, y, cell - gap, cell - gap, 1.5, hex(p.felt));
      const cx = x + (cell - gap) / 2, cy = y + (cell - gap) / 2;
      const v = GRID[r][f];
      if (v === 1) disc(c, cx, cy, (cell - gap) * 0.36, hex(p.dark));
      else if (v === 2) disc(c, cx, cy, (cell - gap) * 0.36, hex(p.light));
      else if (v === 9) disc(c, cx, cy, (cell - gap) * 0.15, hex(p.light), 150);
    }
  }
  return c;
}

// DEFEND: the same chessboard corner as Hold, read from the other side of the
// game. The king is what you are trying to keep alive, so the square he stands
// on carries the danger tint and the king himself is drawn in the lightest
// step. That is what makes the tile say "this one is in trouble" rather than
// "this one is winning", which is the whole difference between Defend and Mate.
function drawDefend(p) {
  const c = canvas();
  roundRect(c, 0, 0, S, S, 16, hex(p.ground));
  const o = 16, cell = 11;
  for (let r = 0; r < 4; r++) {
    for (let f = 0; f < 4; f++) {
      if ((r + f) % 2 === 0) continue;
      roundRect(c, o + f * cell, o + r * cell, cell, cell, 1, hex(p.line), 62);
    }
  }
  // the file under fire, drawn under the piece. It runs two squares rather than
  // one because a single tinted cell disappears behind the king's base at 76px,
  // and a line reads as an attack where a square just reads as a highlight.
  roundRect(c, o + cell * 2, o + cell * 1, cell, cell * 2, 1.5, hex(p.danger), 250);
  // the king standing on it. The cross is what makes it read as a king rather
  // than a pawn at 76px, so it sits clear of the crown with its own gap.
  const cx = o + cell * 2.5, top = o + cell * 1.35;
  bar(c, cx, top, cx, top + 5.2, 3.0, hex(p.claim));
  bar(c, cx - 3.6, top + 1.9, cx + 3.6, top + 1.9, 3.0, hex(p.claim));
  disc(c, cx, top + 10.6, 5.2, hex(p.claim));
  roundRect(c, cx - 6.4, top + 14.6, 12.8, 3.0, 1.5, hex(p.claim));
  roundRect(c, cx - 7.8, top + 18.2, 15.6, 4.4, 2, hex(p.claim));
  return c;
}

// MAHJ: three mahjong tiles, two side by side and one stacked across them,
// each a white face over a darker edge. The top tile carries a ringed dot, the
// two below a pair of bamboo sticks, so it reads as tiles rather than cards.
function drawMahj(p) {
  const c = canvas();
  roundRect(c, 0, 0, S, S, 16, hex(p.ground));
  const tile = (x, y) => {
    roundRect(c, x + 2.2, y + 2.8, 21, 28, 4, hex(p.edge));
    roundRect(c, x, y, 21, 28, 4, hex(p.face));
  };
  tile(14, 36); tile(41, 36);
  for (const x of [14, 41]) {
    bar(c, x + 7.5, 40.5, x + 7.5, 59.5, 3.4, hex(p.mark));
    bar(c, x + 13.5, 40.5, x + 13.5, 59.5, 3.4, hex(p.mark));
    bar(c, x + 6, 50, x + 9, 50, 1.6, hex(p.face));
    bar(c, x + 12, 50, x + 15, 50, 1.6, hex(p.face));
  }
  tile(27.5, 12);
  disc(c, 38, 26, 7.4, hex(p.mark));
  disc(c, 38, 26, 4.6, hex(p.dot));
  disc(c, 38, 26, 1.8, hex(p.mark));
  return c;
}

const PALETTES = {
  // Defend's roles are the board, the king and the square he is standing on.
  // The blue copy takes a MID ground because the other End Game tiles are
  // already at the two ends of the ramp: Chain and Four are deep navy, Check,
  // Babel and Turn are pale, and a sixth tile at either end would be a fourth
  // identical square in one category.
  defend: {
    colour: { ground: '#2f4f4f', line: '#e8f2ff', claim: '#f2efe4', danger: '#b34434' },
    blue: { ground: '#214bb2', line: '#e8f2ff', claim: '#e8f2ff', danger: '#0f1f4d' },
  },
  chain: {
    colour: { ground: '#4a044e', line: '#f6eef8', claim: '#c084fc', ghost: '#f6eef8' },
    blue: { ground: '#16306e', line: '#dbe9ff', claim: '#245edf', ghost: '#dbe9ff' },
  },
  hold: {
    colour: { ground: '#0c4a6e', line: '#e8f2ff', claim: '#7dd3fc', ghost: '#e8f2ff' },
    blue: { ground: '#214bb2', line: '#e8f2ff', claim: '#0f1f4d', ghost: '#e8f2ff' },
  },
  // Turn's roles are the board and its two disc colours. The blue copy takes a
  // PALE ground on purpose: Chain sits beside it in the End Game category and
  // wears the deep navy, so the two tiles have to be tellable apart at 76px.
  turn: {
    colour: { ground: '#226218', felt: '#4c8a41', dark: '#12140f', light: '#f2efe4' },
    blue: { ground: '#c2ddfe', felt: '#245edf', dark: '#0f1f4d', light: '#e8f2ff' },
  },
  // Mahj (Cards) wears the Cards magenta; the blue copy takes a mid ground
  // because Hold, beside it in Cards, already wears the deep one.
  mahj: {
    colour: { ground: '#86198f', face: '#ffffff', edge: '#d8b4e2', mark: '#08222e', dot: '#e879f9' },
    blue: { ground: '#245edf', face: '#e8f2ff', edge: '#9cc1f5', mark: '#0f1f4d', dot: '#4a8cf0' },
  },
};
const DRAW = { chain: drawChain, hold: drawHold, turn: drawTurn, defend: drawDefend, mahj: drawMahj };

mkdirSync('public/games/blue', { recursive: true });
// Pass keys to draw only those (node scripts/gen-tile-art.mjs mahj).
const ONLY = process.argv.slice(2);
for (const key of Object.keys(DRAW).filter((k) => !ONLY.length || ONLY.includes(k))) {
  for (const [variant, dir] of [['colour', 'public/games'], ['blue', 'public/games/blue']]) {
    const png = encodePng(downsample(DRAW[key](PALETTES[key][variant])));
    const path = `${dir}/btn-${key}.png`;
    writeFileSync(path, png);
    console.log(`${path}  ${png.length} bytes  ${S}x${S} RGBA`);
  }
}
