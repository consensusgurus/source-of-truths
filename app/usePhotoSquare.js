'use client';

// The photo for Swap, Slide and Spin: a Jig photograph that has already been
// live, fetched through /api/jig/img (same origin, so its pixels can be read)
// and cut to its centre square on a canvas. Returns { url, canvas } once ready,
// or { error } when the photo could not be loaded.

import { useEffect, useState } from 'react';

const cache = new Map();

export default function usePhotoSquare(jigNum, size = 720) {
  const key = `${jigNum}:${size}`;
  const [st, setSt] = useState(() => cache.get(key) || null);
  useEffect(() => {
    if (cache.get(key)) { setSt(cache.get(key)); return undefined; }
    let alive = true;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2, sy = (img.naturalHeight - side) / 2;
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const v = { url: c.toDataURL('image/jpeg', 0.9), canvas: c };
        cache.set(key, v);
        if (alive) setSt(v);
      } catch (e) { if (alive) setSt({ error: true }); }
    };
    img.onerror = () => { if (alive) setSt({ error: true }); };
    img.src = `/api/jig/img?n=${jigNum}&w=960`;
    return () => { alive = false; };
  }, [key, jigNum, size]);
  return st || {};
}

// The background style that shows tile `t` of an n x n cut of the photo.
export function tileStyle(url, t, n) {
  const r = Math.floor(t / n), c = t % n;
  return {
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundSize: `${n * 100}% ${n * 100}%`,
    backgroundPosition: `${n > 1 ? (c / (n - 1)) * 100 : 0}% ${n > 1 ? (r / (n - 1)) * 100 : 0}%`,
  };
}

// The square board's CSS, shared by the three photo games: as wide as the
// column allows and short enough to leave the tools and the foot on screen.
// ONE SOLID PICTURE (owner, 2026-11-01): the squares sit edge to edge with
// square corners (the site's global button radius is reset here), so the photo
// reads as one image; only the board's own four outer corners are rounded.
export const PHOTO_CSS = `
.ph-wrap{align-self:center;width:100%;max-width:min(560px, calc(100dvh - 300px));}
@media (min-width:900px){.ph-wrap{max-width:min(640px, calc(100dvh - 280px));}}
.ph-board{position:relative;display:grid;width:100%;aspect-ratio:1/1;gap:0;border-radius:12px;overflow:hidden;box-shadow:0 0 0 2px var(--pst-ink, #0b0f1a);background:var(--pst-cell, #f1f4f8);user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation;}
.ph-t{position:relative;border:0;border-radius:0;padding:0;margin:0;background-color:var(--pst-cell, #f1f4f8);background-repeat:no-repeat;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.ph-board.solved .ph-t{cursor:default;}
.ph-t:focus-visible{outline:3px solid var(--pst-acc, #7dd3fc);outline-offset:-3px;z-index:2;}
.ph-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;opacity:.75;background:var(--pst-cell, #f1f4f8);z-index:5;}
@media (prefers-reduced-motion: reduce){.ph-board,.ph-t{transition:none !important;}}
`;
