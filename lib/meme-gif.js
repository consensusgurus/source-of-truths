// Builds the shareable meme GIF in the browser (owner, 2026-10-23): the brag
// line in a black bar, the reaction clip at its full frame, then the game strip
// in the category colour. Nothing is rendered on the server, so a share costs
// no build minutes and no function time.
//
// Decoding is gifuct-js, encoding is gifenc. One palette for the whole GIF,
// sampled from a spread of frames, keeps the text bars from shimmering frame to
// frame and keeps the encode fast enough to finish before the player taps.

import { parseGIF, decompressFrames } from 'gifuct-js';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { markSvg } from './share-palette.js';

const W = 480;
// THE SAFE ZONE (owner, 2026-10-23). iMessage, WhatsApp and the rest round the
// corners of an image bubble (about 7% of its width) and some crop a sliver off
// the bottom, so the first cut lost the end of its link line. Every word now
// sits inside a 34px side inset and a 30px bottom inset, and a line too wide
// for that box shrinks to fit, then wraps, rather than running to the edge.
const SIDE = 34;
const TOP = 24;
const BOTTOM = 30;
const SAFE_W = W - SIDE * 2;

function fontFamily() {
  try { return getComputedStyle(document.body).fontFamily || 'Manrope, system-ui, sans-serif'; } catch (e) { return 'Manrope, system-ui, sans-serif'; }
}

function wrap(ctx, text, max) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= max || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// The largest size from max down to min at which text fits the safe width.
function fitSize(ctx, text, weight, fam, max, min) {
  for (let sz = max; sz > min; sz -= 1) {
    ctx.font = `${weight} ${sz}px ${fam}`;
    if (ctx.measureText(text).width <= SAFE_W) return sz;
  }
  return min;
}

const cache = new Map();

function loadMark(pal) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markSvg('#ffffff', '#ffffff'));
  });
}

// pal: lib/share-palette sharePalette(cat, dark). The caption bar takes the
// register's ground and ink, the strip the category fill and its ink, so the
// GIF matches the page and the link card it travels with.
export async function buildMemeGif({ src, top, url, pal }) {
  const ck = [src, top, url, pal.dark].join('|');
  if (cache.has(ck)) return cache.get(ck);
  const job = (async () => {
    const fam = fontFamily();
    try { await document.fonts.load(`800 26px ${fam}`); await document.fonts.load(`700 15px ${fam}`); } catch (e) { /* draw with what is there */ }
    const mark = await loadMark(pal);
    const buf = await fetch(src).then((r) => { if (!r.ok) throw new Error('gif'); return r.arrayBuffer(); });
    const gif = parseGIF(buf);
    const frames = decompressFrames(gif, true);
    const GW = gif.lsd.width;
    const GH = gif.lsd.height;
    const gifH = Math.round(GH * (W / GW));

    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const capFont = `800 25px ${fam}`;
    ctx.font = capFont;
    const capLines = wrap(ctx, String(top).toUpperCase(), SAFE_W);
    const capLH = 30;
    const capH = TOP + capLines.length * capLH + 14;

    // The strip is a plain black bar under the clip (owner, 2026-10-23): the
    // Mind Loft mark, name and address in white, nothing else. The puzzle's
    // name and description live on the link card beside the GIF.
    const stripH = 14 + 22 + BOTTOM;
    const H = capH + gifH + stripH;
    cv.width = W; cv.height = H;

    // The clip composites on its own canvas at native size, honouring each
    // frame's disposal, then scales into the middle band.
    const clip = document.createElement('canvas');
    clip.width = GW; clip.height = GH;
    const cctx = clip.getContext('2d', { willReadFrequently: true });
    const patch = document.createElement('canvas');
    const pctx = patch.getContext('2d');

    const drawChrome = () => {
      ctx.fillStyle = pal.ground;
      ctx.fillRect(0, 0, W, capH);
      ctx.fillStyle = pal.ink;
      ctx.font = capFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      capLines.forEach((l, i) => ctx.fillText(l, W / 2, TOP + i * capLH));
      ctx.fillStyle = '#000';
      ctx.fillRect(0, capH + gifH, W, stripH);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      const y = capH + gifH + 14;
      if (mark) ctx.drawImage(mark, SIDE, y - 2, 20, 20);
      ctx.font = `800 14px ${fam}`;
      ctx.fillText('Mind Loft', SIDE + (mark ? 26 : 0), y + 1);
      ctx.textAlign = 'right';
      ctx.font = `700 13px ${fam}`;
      ctx.fillText(url, W - SIDE, y + 2);
    };

    const rendered = [];
    let prev = null;
    for (const f of frames) {
      if (prev && prev.disposalType === 2) cctx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height);
      const { width: pw, height: ph, left, top: pt } = f.dims;
      patch.width = pw; patch.height = ph;
      pctx.putImageData(new ImageData(new Uint8ClampedArray(f.patch), pw, ph), 0, 0);
      cctx.drawImage(patch, left, pt);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, capH, W, gifH);
      ctx.drawImage(clip, 0, capH, W, gifH);
      drawChrome();
      rendered.push({ data: ctx.getImageData(0, 0, W, H).data, delay: Math.max(20, f.delay || 100) });
      prev = f;
    }

    // One palette from up to five frames spread across the clip.
    const pick = [0, 0.25, 0.5, 0.75, 1].map((p) => rendered[Math.min(rendered.length - 1, Math.round(p * (rendered.length - 1)))]);
    const sample = new Uint8Array(pick.reduce((n, r) => n + r.data.length, 0));
    let o = 0;
    for (const r of pick) { sample.set(r.data, o); o += r.data.length; }
    const palette = quantize(sample, 256);

    const enc = GIFEncoder();
    rendered.forEach((r, i) => {
      const index = applyPalette(r.data, palette);
      enc.writeFrame(index, W, H, i === 0 ? { palette, delay: r.delay, repeat: 0 } : { delay: r.delay });
    });
    enc.finish();
    return new Blob([enc.bytes()], { type: 'image/gif' });
  })();
  cache.set(ck, job);
  job.catch(() => cache.delete(ck));
  return job;
}
