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

const W = 480;
const PAD = 18;

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

const cache = new Map();

export async function buildMemeGif({ src, top, line1, line2, hue }) {
  const ck = [src, top, line1, line2, hue].join('|');
  if (cache.has(ck)) return cache.get(ck);
  const job = (async () => {
    const fam = fontFamily();
    try { await document.fonts.load(`800 26px ${fam}`); await document.fonts.load(`700 15px ${fam}`); } catch (e) { /* draw with what is there */ }
    const buf = await fetch(src).then((r) => { if (!r.ok) throw new Error('gif'); return r.arrayBuffer(); });
    const gif = parseGIF(buf);
    const frames = decompressFrames(gif, true);
    const GW = gif.lsd.width;
    const GH = gif.lsd.height;
    const gifH = Math.round(GH * (W / GW));

    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const capFont = `800 26px ${fam}`;
    ctx.font = capFont;
    const capLines = wrap(ctx, String(top).toUpperCase(), W - PAD * 2);
    const capLH = 31;
    const capH = PAD * 2 + capLines.length * capLH - 6;
    const stripH = 62;
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
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, capH);
      ctx.fillStyle = '#fff';
      ctx.font = capFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      capLines.forEach((l, i) => ctx.fillText(l, W / 2, PAD + i * capLH));
      ctx.fillStyle = hue || '#2563eb';
      ctx.fillRect(0, capH + gifH, W, stripH);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.font = `800 17px ${fam}`;
      ctx.fillText(line1, PAD, capH + gifH + 11);
      ctx.font = `700 14px ${fam}`;
      ctx.fillText(line2, PAD, capH + gifH + 35);
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
