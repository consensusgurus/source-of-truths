// THE BIGGEST SIZE EACH JIGSAW PHOTO CAN DO (owner, 2026-11-21: "If it doesn't
// work on larger sizes, make it unavailable", greyed on the portal). Server
// only: it decodes JPEGs. Read by /api/jigsaw/fit.
//
// Two tests per size above ALWAYS_OK (lib/jigsaw-sizes.js), both on the cut that
// size makes of the photo:
//   RESOLUTION  the Commons original gives every piece MIN_PIECE_PX source pixels
//   DETAIL      the share of plain pieces stays under PLAIN_LIMIT[size], and no
//               one flat patch covers more than FLAT_BLOCK_LIMIT[size] of the board
// Detail is measured on the 500 px thumbnail the portal already shows, the same
// way the Mural grades its pieces (lib/mural.js gradePixels). A downscaled photo
// reads a little plainer than the original, so the test errs toward greying.
// A photo that cannot be measured keeps the sizes its resolution allows, up to
// 1,000, and is measured again on the next request (fitAll's `partial`).

import jpeg from 'jpeg-js';
import { JIGSAW_SIZES, ALWAYS_OK, MIN_PIECE_PX, PLAIN_LIMIT, FLAT_BLOCK_LIMIT, cutFor } from './jigsaw-sizes.js';

const UA = 'MindLoft/1.0 (https://mindloftdaily.com; jigsaw sizes) node-fetch';
const KEEP = { next: { revalidate: 2592000 } }; // a photo never changes: 30 days in the data cache
const FLAT = 5, PLAIN = 10;
const memo = new Map(); // `${title}|${c}x${r}` -> max size, per server instance

async function commonsSizes(titles) {
  const out = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=size&titles='
      + encodeURIComponent(batch.map((t) => `File:${t}`).join('|'));
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, ...KEEP, signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      const j = await r.json();
      const norm = new Map(((j.query && j.query.normalized) || []).map((x) => [x.to, x.from]));
      for (const pg of Object.values((j.query && j.query.pages) || {})) {
        const ii = pg.imageinfo && pg.imageinfo[0];
        if (!ii) continue;
        const asked = (norm.get(pg.title) || pg.title).replace(/^File:/, '');
        out.set(asked, { w: ii.width, h: ii.height });
        out.set(pg.title.replace(/^File:/, ''), { w: ii.width, h: ii.height });
      }
    } catch (e) { /* a missing batch only means those photos fall back */ }
  }
  return out;
}

async function thumbPixels(title) {
  try {
    const r = await fetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=500`,
      { headers: { 'User-Agent': UA }, redirect: 'follow', ...KEEP, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // not a JPEG
    return jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 64 });
  } catch (e) { return null; }
}

// Plain share and biggest flat patch of the photo cut COLS x ROWS (centred crop
// to the cut's shape, as the board makes it).
export function detailOf(img, COLS, ROWS) {
  const { data, width, height } = img;
  const want = COLS / ROWS;
  let cw = width, ch = Math.round(width / want);
  if (ch > height) { ch = height; cw = Math.round(height * want); }
  const ox = Math.floor((width - cw) / 2), oy = Math.floor((height - ch) / 2);
  const pw = cw / COLS, ph = ch / ROWS, TOTAL = COLS * ROWS;
  const detail = new Float32Array(TOTAL);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x0 = ox + Math.floor(c * pw), x1 = ox + Math.max(Math.floor(c * pw) + 1, Math.floor((c + 1) * pw));
      const y0 = oy + Math.floor(r * ph), y1 = oy + Math.max(Math.floor(r * ph) + 1, Math.floor((r + 1) * ph));
      let n = 0, s = 0, s2 = 0;
      for (let y = y0; y < y1; y++) {
        let o = (y * width + x0) * 4;
        for (let x = x0; x < x1; x++, o += 4) { const l = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]; s += l; s2 += l * l; n++; }
      }
      const m = n ? s / n : 0;
      detail[r * COLS + c] = n ? Math.sqrt(Math.max(0, s2 / n - m * m)) : 0;
    }
  }
  let plain = 0, big = 0;
  const seen = new Uint8Array(TOTAL);
  for (let i = 0; i < TOTAL; i++) {
    if (detail[i] < PLAIN) plain++;
    if (detail[i] >= FLAT || seen[i]) continue;
    let size = 0;
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      size++;
      const c = j % COLS, r = (j / COLS) | 0;
      for (const k of [c > 0 ? j - 1 : -1, c < COLS - 1 ? j + 1 : -1, r > 0 ? j - COLS : -1, r < ROWS - 1 ? j + COLS : -1]) {
        if (k >= 0 && !seen[k] && detail[k] < FLAT) { seen[k] = 1; q.push(k); }
      }
    }
    if (size > big) big = size;
  }
  return { plainShare: plain / TOTAL, flatBlock: big / TOTAL };
}

// The biggest size in JIGSAW_SIZES that one photo can do.
export function maxSizeFor({ c, r }, dims, img) {
  let max = ALWAYS_OK;
  for (const s of JIGSAW_SIZES) {
    if (s <= ALWAYS_OK) continue;
    const cut = cutFor(s, c, r);
    if (dims) {
      const want = cut.cols / cut.rows;
      const cw = Math.min(dims.w, dims.h * want), chh = Math.min(dims.h, dims.w / want);
      if (cw / cut.cols < MIN_PIECE_PX || chh / cut.rows < MIN_PIECE_PX) break;
    }
    if (img) {
      const d = detailOf(img, cut.cols, cut.rows);
      if (d.plainShare > PLAIN_LIMIT[s] || d.flatBlock > FLAT_BLOCK_LIMIT[s]) break;
    } else if (s > 1000) break;
    max = s;
  }
  return max;
}

// { 'jig-12': 2000, ... } for every board given ({ g, n, c, r, t }).
export async function fitAll(boards) {
  const out = {};
  const todo = boards.filter((b) => {
    const k = `${b.t}|${b.c}x${b.r}`;
    if (memo.has(k)) { out[`${b.g}-${b.n}`] = memo.get(k); return false; }
    return true;
  });
  if (!todo.length) return out;
  const dims = await commonsSizes([...new Set(todo.map((b) => b.t))]);
  let at = 0, partial = 0;
  const work = async () => {
    while (at < todo.length) {
      const b = todo[at++];
      const img = await thumbPixels(b.t);
      const dm = dims.get(b.t) || null;
      const m = maxSizeFor(b, dm, img);
      // Only a full measurement is kept; a failed fetch is tried again next time.
      if (img && dm) memo.set(`${b.t}|${b.c}x${b.r}`, m); else partial++;
      out[`${b.g}-${b.n}`] = m;
    }
  };
  await Promise.all(Array.from({ length: 6 }, work));
  Object.defineProperty(out, 'partial', { value: partial, enumerable: false });
  return out;
}
