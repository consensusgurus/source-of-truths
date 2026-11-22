// lib/glimpse-engine.js: the one engine behind Glimpse, the daily flash-recall
// game (owner, 2026-11-22: "a daily that gives you a glimpse of something and
// forces recall", then "combine multiple elements of these into one daily",
// approved from the mockup and ordered built the same day).
//
// THE GAME. A square panel in four quadrants: a cloud of DOTS, a 4x4 GRID with
// some squares lit, a CLOCK, and a STRING of letters and digits. Each flash
// shows the panel for a second or two, then blanks it and asks about ONE
// quadrant; the player does not know which until it is gone. Five flashes a
// day, six on the Sunday Edition. Every flash scores 0 to 100 on closeness, so
// a day is out of 500 (600 on Sunday), ranked on points, then the clock.
//
// Imported by the client (app/glimpse/GlimpseClient.jsx), the generator
// (scripts/gen-glimpse.mjs) and the checker (scripts/verify-glimpse.mjs), so
// the dots a player sees, the count the bank stores and the score the page
// posts all come from the same code. Never change how an existing board is
// drawn or scored: a live board is frozen (docs/claude/daily-authoring.md).

export const QUADS = ['dots', 'grid', 'dial', 'string'];
export const QUAD_NAME = { dots: 'Dots', grid: 'Grid', dial: 'Clock', string: 'String' };
// No I, O, 0 or 1: nothing in the string can be read two ways.
export const CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';
// How long each flash shows, in order. A Sunday adds the sixth.
export const FLASH_MS = [2500, 2500, 2000, 2000, 1500, 1250];
// The 3-2-1 before every flash, one beat each.
export const BEAT_MS = 550;
export const COUNT_MS = BEAT_MS * 3;

// The weekly ramp: the clock never changes, the panel gets fuller.
//   dots  [min, max] for each flash; flashes 1 and 2 are black only, red joins from flash 3
//   lit   squares lit on the grid, per flash
//   len   characters in the string, per flash
export const BANDS = {
  gentle: { label: 'Gentle', dots: [[25, 45], [25, 45], [45, 70], [55, 85], [65, 95]], lit: [3, 3, 4, 4, 5], len: [4, 4, 5, 5, 6] },
  moderate: { label: 'Moderate', dots: [[30, 55], [30, 55], [60, 95], [75, 115], [90, 130]], lit: [4, 4, 5, 5, 6], len: [5, 5, 6, 6, 7] },
  tough: { label: 'Tough', dots: [[40, 65], [40, 65], [75, 115], [95, 135], [110, 155]], lit: [4, 5, 5, 6, 6], len: [5, 6, 6, 7, 8] },
  sunday: { label: 'Sunday Edition', dots: [[40, 65], [40, 65], [75, 115], [95, 135], [110, 155], [130, 170]], lit: [4, 5, 5, 6, 6, 7], len: [5, 6, 6, 7, 8, 8] },
};
// Mon, Tue Gentle · Wed, Thu Moderate · Fri, Sat Tough · Sun the Sunday Edition.
export function bandOf(live) {
  const dow = new Date(`${live}T12:00:00Z`).getUTCDay();
  return dow === 0 ? 'sunday' : dow <= 2 ? 'gentle' : dow <= 4 ? 'moderate' : 'tough';
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// The dot cloud for one flash, laid out from its own seed. Dots never touch, so
// every one can be counted in principle; the radius shrinks as the count grows.
// Returns null if the count does not fit (the generator re-seeds; the checker fails).
export function dotRadius(n) { return n <= 50 ? 3 : n <= 90 ? 2.5 : n <= 130 ? 2.1 : 1.85; }
export function placeDots(seed, n, red) {
  const r = rng(seed), rad = dotRadius(n), min = rad * 2 + 1, pts = [];
  let tries = 0;
  while (pts.length < n && tries < 40000) {
    tries++;
    const x = 6 + r() * 88, y = 6 + r() * 88;
    let ok = true;
    for (const p of pts) { const dx = p.x - x, dy = p.y - y; if (dx * dx + dy * dy < min * min) { ok = false; break; } }
    if (ok) pts.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  if (pts.length < n) return null;
  // The red ones are a seeded pick, not the first laid, so they spread over the cloud.
  const order = pts.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (const i of order.slice(0, red)) pts[i].red = true;
  return { pts, rad };
}

// ── scoring: every answer 0 to 100 on how close it was ─────────────────────
// dots    100 less 2.5 for every 1% off (40% off scores nothing)
// grid    the share of lit squares picked (you pick exactly as many as were lit)
// dial    100 less 2 for every minute off, round a 12-hour face
// string  the share of characters typed in the right place
export function truthOf(f, a) {
  if (a.kind === 'dots') return a.red ? f.red : f.dots;
  if (a.kind === 'grid') return f.lit;
  if (a.kind === 'dial') return [f.h, f.m];
  return f.str;
}
export function askPoints(f, a, y) {
  if (y == null) return 0;
  if (a.kind === 'dots') {
    const t = truthOf(f, a), n = Number(y);
    if (!Number.isFinite(n) || t <= 0) return 0;
    return Math.max(0, Math.round(100 - 2.5 * (Math.abs(n - t) / t) * 100));
  }
  if (a.kind === 'grid') {
    if (!Array.isArray(y)) return 0;
    const pick = [...new Set(y)].slice(0, f.lit.length);
    return Math.round((pick.filter((i) => f.lit.includes(i)).length / f.lit.length) * 100);
  }
  if (a.kind === 'dial') {
    if (!Array.isArray(y)) return 0;
    return Math.max(0, 100 - 2 * dialOff(y, [f.h, f.m]));
  }
  const s = String(y).toUpperCase();
  let ok = 0;
  for (let i = 0; i < f.str.length; i++) if (s[i] === f.str[i]) ok++;
  return Math.round((ok / f.str.length) * 100);
}
export function dialOff(a, b) {
  const x = ((a[0] % 12) * 60 + a[1]), y = ((b[0] % 12) * 60 + b[1]);
  const d = Math.abs(x - y);
  return Math.min(d, 720 - d);
}
// A flash with two questions scores their average, so every flash is worth 100.
export function flashPoints(f, ans) {
  if (!Array.isArray(ans) || !ans.length) return 0;
  const pts = f.asks.map((a, k) => askPoints(f, a, ans[k]));
  return Math.round(pts.reduce((x, y) => x + y, 0) / f.asks.length);
}
export function maxPoints(P) { return P.flashes.length * 100; }
export function dayPoints(P, allAns) {
  return P.flashes.reduce((t, f, i) => t + (Array.isArray(allAns && allAns[i]) && allAns[i].length >= f.asks.length ? flashPoints(f, allAns[i]) : 0), 0);
}
export const fmtClock = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

// ── drawing: every quadrant is a 100 x 100 SVG drawn on white ───────────────
// The panel is white in both registers (as Witness's scene is), so the colours
// are fixed here rather than read from the page.
export const INK = '#0b0f1a';
export const RED = '#e5484d';
// A lit square wears the stage accent (the Visual pastel, lib/category-ramp.js)
// with an ink edge, so it reads at a glance; an unlit one is plain light grey.
export const LIT = 'var(--pst-acc, #f1aff6)';
export const UNLIT = '#eceef2';
const svg = (body, label) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" style="display:block;width:100%;height:100%">${body}</svg>`;
export function dotsSvg(f) {
  const d = placeDots(f.seed, f.dots, f.red || 0);
  if (!d) return svg('', 'Dots');
  return svg(d.pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${d.rad}" fill="${p.red ? RED : INK}"/>`).join(''), 'A cloud of dots');
}
export function gridCellXY(i) { return [11 + (i % 4) * 20, 11 + Math.floor(i / 4) * 20]; }
export function gridSvg(lit, marks) {
  let s = '';
  for (let i = 0; i < 16; i++) {
    const [x, y] = gridCellXY(i), on = lit.includes(i);
    s += on
      ? `<rect x="${x + 0.8}" y="${y + 0.8}" width="16.4" height="16.4" rx="3" style="fill:${LIT}" stroke="${INK}" stroke-width="1.6"/>`
      : `<rect x="${x}" y="${y}" width="18" height="18" rx="3" fill="${UNLIT}"/>`;
    if (marks && marks.includes(i)) s += `<rect x="${x + 1.5}" y="${y + 1.5}" width="15" height="15" rx="2" fill="none" stroke="${on ? INK : RED}" stroke-width="2.4"/>`;
  }
  return svg(s, 'A grid with some squares lit');
}
export function dialSvg(h, m) {
  let s = `<circle cx="50" cy="50" r="38" fill="#ffffff" stroke="${INK}" stroke-width="1.8"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6, l = i % 3 ? 3.5 : 7;
    const p = (r) => `${(50 + Math.sin(a) * r).toFixed(2)}`;
    const q = (r) => `${(50 - Math.cos(a) * r).toFixed(2)}`;
    s += `<line x1="${p(38 - l)}" y1="${q(38 - l)}" x2="${p(37)}" y2="${q(37)}" stroke="${INK}" stroke-width="${i % 3 ? 1.2 : 2}"/>`;
  }
  const ha = (((h % 12) + m / 60) * Math.PI) / 6, ma = (m * Math.PI) / 30;
  s += `<line x1="50" y1="50" x2="${(50 + Math.sin(ha) * 20).toFixed(2)}" y2="${(50 - Math.cos(ha) * 20).toFixed(2)}" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/>`;
  s += `<line x1="50" y1="50" x2="${(50 + Math.sin(ma) * 30).toFixed(2)}" y2="${(50 - Math.cos(ma) * 30).toFixed(2)}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
  s += `<circle cx="50" cy="50" r="2.8" fill="${INK}"/>`;
  return svg(s, 'A clock face');
}
export function stringSvg(t) {
  const fs = Math.min(20, 84 / (t.length * 0.74));
  return svg(`<text x="50" y="${(50 + fs * 0.36).toFixed(2)}" text-anchor="middle" font-family="Manrope, system-ui, sans-serif" font-weight="800" font-size="${fs.toFixed(2)}" letter-spacing="${(fs * 0.08).toFixed(2)}" fill="${INK}">${t}</text>`, 'A string of characters');
}
export function quadSvg(f, kind) {
  if (kind === 'dots') return dotsSvg(f);
  if (kind === 'grid') return gridSvg(f.lit);
  if (kind === 'dial') return dialSvg(f.h, f.m);
  return stringSvg(f.str);
}

// ── building a board (the generator's job; here so the checker can rebuild) ──
// One flash per FLASH_MS entry the band has. Flash 1 fills Dots and Grid, flash
// 2 Clock and String, the rest all four. Flashes 1 to 4 ask about each quadrant
// exactly once between them; flash 5 (and Sunday's 6) asks two different ones.
export function buildBoard(seed, band) {
  const B = BANDS[band], r = rng(seed), n = B.dots.length;
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (a) => a[Math.floor(r() * a.length)];
  const flashes = [];
  for (let i = 0; i < n; i++) {
    const quads = i === 0 ? ['dots', 'grid'] : i === 1 ? ['dial', 'string'] : QUADS.slice();
    const dots = ri(B.dots[i][0], B.dots[i][1]);
    const red = i >= 2 ? Math.round(dots * (0.25 + r() * 0.2)) : 0;
    const cells = Array.from({ length: 16 }, (_, k) => k);
    for (let k = 15; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [cells[k], cells[j]] = [cells[j], cells[k]]; }
    const lit = cells.slice(0, B.lit[i]).sort((a, b) => a - b);
    const h = ri(1, 12), m = ri(0, 11) * 5;
    let str = '';
    while (str.length < B.len[i]) { const c = pick(CHARS.split('')); if (!str.includes(c)) str += c; }
    flashes.push({ ms: FLASH_MS[i], quads, dots, red, seed: Math.floor(r() * 2 ** 31), lit, h, m, str, asks: [] });
  }
  const a1 = pick(['dots', 'grid']), a2 = pick(['dial', 'string']);
  const rest = QUADS.filter((k) => k !== a1 && k !== a2);
  if (r() < 0.5) rest.reverse();
  const plan = [[a1], [a2], [rest[0]], [rest[1]]];
  for (let i = 4; i < n; i++) { const x = pick(QUADS); plan.push([x, pick(QUADS.filter((k) => k !== x))]); }
  plan.forEach((ks, i) => { flashes[i].asks = ks.map((kind) => (kind === 'dots' && i >= 2 && r() < 0.5 ? { kind, red: true } : { kind })); });
  return flashes;
}
