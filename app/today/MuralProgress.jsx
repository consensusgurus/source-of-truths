'use client';
// THE MURAL TILE FILLS IN (owner, 2026-11-20, mockup A, "ONLY if it doesn't slow
// down load speeds noticeably. the % can be on a short lag"). The Mural card's
// picture square becomes a small grid of the real board, coloured where the
// site has built it, with the percentage under it.
//
// IT NEVER HOLDS THE PAGE. The home calls loadMuralProgress() once its own
// board has landed, the answer (/api/mural/progress, a few hundred bytes, held
// at the edge for ten minutes) fills a module store, and the card swaps its
// drawing for the grid when it arrives. No answer, an error or a closed mural
// leaves the drawing exactly as it was. Same box either way, so nothing moves.
import React, { useEffect, useState } from 'react';

const store = {};
const asked = {};
const subs = new Set();

export function loadMuralProgress(kind) {
  if (asked[kind] || typeof fetch === 'undefined') return;
  asked[kind] = true;
  fetch('/api/mural/progress?kind=' + encodeURIComponent(kind))
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d || !d.total || typeof d.cells !== 'string' || d.cells.length !== d.gc * d.gr) return;
      store[kind] = d;
      subs.forEach((f) => f());
    })
    .catch(() => { /* the tile keeps its drawing */ });
}

function useMuralProgress(kind) {
  const [, bump] = useState(0);
  useEffect(() => {
    const f = () => bump((x) => x + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return store[kind] || null;
}

// The square's own content: the grid on top, the figure under it. Drawn in a
// 90-unit box so it fills the band at either size (108px desktop, 92px phone).
export function MuralBand({ k, children }) {
  const d = useMuralProgress(k);
  if (!d) return children;
  const { gc, gr, cells } = d;
  const cw = 88 / gc;
  const ch = 56 / gr;
  const out = [];
  for (let r = 0; r < gr; r += 1) {
    for (let c = 0; c < gc; c += 1) {
      const v = cells.charCodeAt(r * gc + c) - 48;
      out.push(<rect key={r * gc + c} x={1 + c * cw} y={1 + r * ch} width={cw} height={ch} className={v > 0 ? 'on' : ''} style={v > 0 ? { fillOpacity: v / 4 } : undefined} />);
    }
  }
  return (
    <svg className="mrp" viewBox="0 0 90 90" role="img" aria-label={`${d.pct} percent of the mural is built`}>
      <g className="mrp-g">{out}</g>
      <rect className="mrp-f" x="1" y="1" width="88" height="56" />
      <text x="45" y="80" textAnchor="middle"><tspan className="mrp-n">{d.pct}%</tspan><tspan className="mrp-l" dx="4">BUILT</tspan></text>
    </svg>
  );
}

export const MURAL_PROGRESS_CSS = `
.sty-gband .mrp{display:block;width:100%;height:100%;}
.sty-gband.art .mrp{box-sizing:border-box;padding:9px;}
.mrp-g rect{fill:none;stroke:color-mix(in srgb, var(--cfull) 28%, transparent);stroke-width:.6;}
.mrp-g rect.on{fill:var(--cfull);stroke:color-mix(in srgb, var(--cfull) 70%, #0b1b2b);}
.mrp-f{fill:none;stroke:color-mix(in srgb, var(--cfull) 70%, #0b1b2b);stroke-width:1.2;}
.mrp text{fill:var(--gpd, currentColor);font-family:inherit;}
.mrp-n{font-size:17px;font-weight:800;}
.mrp-l{font-size:8.5px;font-weight:800;letter-spacing:.08em;}
`;
