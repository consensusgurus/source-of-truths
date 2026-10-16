'use client';

import React, { useState, useEffect, useRef } from 'react';
import { T } from '@/lib/theme';

// Lazy, per-region geometry — each import() is a static specifier so webpack
// code-splits one chunk per region; only the played region's geometry loads.
const LOADERS = {
  'europe': () => import('@/lib/europe-geo.js').then((m) => m.EUROPE_GEO),
  'north-america': () => import('@/lib/na-geo.js').then((m) => m.GEO),
  'south-america': () => import('@/lib/sa-geo.js').then((m) => m.GEO),
  'africa': () => import('@/lib/africa-geo.js').then((m) => m.GEO),
  'asia': () => import('@/lib/asia-geo.js').then((m) => m.GEO),
  'us-states': () => import('@/lib/us-geo.js').then((m) => m.GEO),
  'mexico': () => import('@/lib/mexico-geo.js').then((m) => m.GEO),
  'canada': () => import('@/lib/canada-geo.js').then((m) => m.GEO),
  'central-america': () => import('@/lib/central-america-geo.js').then((m) => m.GEO),
  'southeast-asia': () => import('@/lib/southeast-asia-geo.js').then((m) => m.GEO),
  'middle-east': () => import('@/lib/middle-east-geo.js').then((m) => m.GEO),
  'caribbean': () => import('@/lib/caribbean-geo.js').then((m) => m.GEO),
  'oceania': () => import('@/lib/oceania-geo.js').then((m) => m.GEO),
  'world': () => import('@/lib/world-geo.js').then((m) => m.GEO),
};

const LAND = '#eef1f4';
const LINE = '#94a0b0';
const SEA = '#bcd4ec';
const GREEN = T.success;
const RED = T.danger;
const HOVER = '#e8effb';
const CTRL_INK = T.ink;
const CTRL_ACCENT = T.accent;

// In-window size control. The map was capped at 680px wide and centered, which
// renders small on a wide-but-short region (e.g. the no-outline lower-48). These
// presets let the player enlarge it past the play column with the full-bleed
// technique (centered on the viewport; the page scrolls vertically - never a
// separate window). 'fit' is the default so maps open at the play-column width;
// the player can still bump to Large/Full, and the choice is remembered.
const SIZES = {
  fit: { label: 'Fit', width: '680px', bleed: false },
  lg: { label: 'Large', width: 'min(1100px, 94vw)', bleed: true },
  xl: { label: 'Full', width: '96vw', bleed: true },
};
const SIZE_ORDER = ['fit', 'lg', 'xl'];
const SIZE_KEY = 'sot_map_size';

const MAX_ZOOM = 6;
// The world map packs ~4x the countries of a continental map into one frame,
// so its slivers (The Gambia, Lebanon) need a deeper pinch to become tappable.
const MAX_ZOOM_WORLD = 10;

export default function MapQuizBoard({ region, started, ended, revealed, foundNames, flash, onPick, noBorders: noBordersProp, erase = false, mobile = false }) {
  const [geo, setGeo] = useState(null);
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState('fit');
  const isMobile = mobile;

  // Pinch-to-zoom + drag-to-pan, mobile only. The whole concern of a phone map
  // quiz is that small countries / island markers are nearly impossible to tap
  // accurately at full-region scale; zooming makes them thumb-sized. `view` is a
  // scale + translate applied to a wrapping <g> in viewBox units. Desktop never
  // touches it (handlers gated on isMobile), so it stays identity there and the
  // render is byte-for-byte the prior behavior.
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const svgRef = useRef(null);
  const ptrs = useRef(new Map());
  const gesture = useRef({ dist: 0, panned: false, lastX: 0, lastY: 0 });

  // Restore the saved size preference (ssr:false, so localStorage is safe;
  // read in an effect to avoid a hydration mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIZE_KEY);
      if (saved && SIZES[saved]) setSize(saved);
    } catch {}
  }, []);

  function chooseSize(s) {
    setSize(s);
    try { localStorage.setItem(SIZE_KEY, s); } catch {}
  }

  useEffect(() => {
    let live = true;
    const load = LOADERS[region] || LOADERS.europe;
    load().then((g) => { if (live) setGeo(g); }).catch(() => {});
    return () => { live = false; };
  }, [region]);

  // Reset the zoom whenever a new round starts/ends so a fresh game always
  // opens at the full-region view.
  useEffect(() => {
    const id = { s: 1, tx: 0, ty: 0 };
    viewRef.current = id;
    setView(id);
  }, [started, ended]);

  const live = started && !ended;
  // A "no borders" map (e.g. the lower-48 states quiz) renders as a single blank
  // silhouette: no internal boundary lines AND no hover shape-preview, so the
  // player can't trace a state's outline before clicking. Found/flash colors
  // still show as feedback.
  const noBorders = !!(geo && geo.noBorders) || !!noBordersProp;

  function fillFor(name, base) {
    // Erase mode: a found region is wiped off the map — painted as open sea
    // (fill AND stroke) so it reads as a hole in the silhouette, not a win mark.
    if (foundNames && foundNames.has(name)) return erase ? SEA : GREEN;
    if (revealed) return RED;
    if (flash && flash.name === name) return flash.ok ? GREEN : RED;
    if (hover === name && live && !noBorders) return HOVER;
    return base;
  }

  if (!geo) {
    return (
      <div style={{ border: '1px solid rgba(138,130,118,0.25)', borderRadius: 2, background: SEA, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f7585', fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Loading map…
      </div>
    );
  }

  const sz = SIZES[size] || SIZES.lg;
  // Full-bleed for the larger presets: center on the viewport and break out of
  // the play column; the page scrolls vertically if the map is tall. 'Fit'
  // keeps the original centered cap.
  const wrapStyle = isMobile
    ? { width: '100%' }
    : sz.bleed
    ? { width: sz.width, maxWidth: '96vw', position: 'relative', left: '50%', transform: 'translateX(-50%)' }
    : { maxWidth: 680, margin: '0 auto' };

  // Parse the region viewBox ("minX minY width height") so the gesture math can
  // convert screen coordinates into the SVG's own coordinate system.
  const vb = String(geo.viewBox || '0 0 100 100').trim().split(/\s+/).map(Number);
  const vbX = vb[0] || 0, vbY = vb[1] || 0, vbW = vb[2] || 100, vbH = vb[3] || 100;
  const zoomed = view.s > 1.001;

  function clampView(v) {
    const s = Math.max(1, Math.min(region === 'world' ? MAX_ZOOM_WORLD : MAX_ZOOM, v.s));
    // Keep the transformed content covering the visible viewBox window so the
    // player can never pan the map off-screen into empty sea.
    const txMin = (vbX + vbW) * (1 - s), txMax = vbX * (1 - s);
    const tyMin = (vbY + vbH) * (1 - s), tyMax = vbY * (1 - s);
    return {
      s,
      tx: Math.min(txMax, Math.max(txMin, v.tx)),
      ty: Math.min(tyMax, Math.max(tyMin, v.ty)),
    };
  }

  function applyView(v) { const nv = clampView(v); viewRef.current = nv; setView(nv); }

  function toVB(clientX, clientY) {
    const r = svgRef.current.getBoundingClientRect();
    return {
      fx: vbX + ((clientX - r.left) / r.width) * vbW,
      fy: vbY + ((clientY - r.top) / r.height) * vbH,
    };
  }
  function pinchDist() { const [a, b] = [...ptrs.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y); }
  function pinchMid() { const [a, b] = [...ptrs.current.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

  function onPointerDown(e) {
    if (!isMobile) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.panned = false;
    if (ptrs.current.size === 1) { gesture.current.lastX = e.clientX; gesture.current.lastY = e.clientY; }
    if (ptrs.current.size === 2) { gesture.current.dist = pinchDist(); }
  }
  function onPointerMove(e) {
    if (!isMobile || !ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size >= 2) {
      const d = pinchDist();
      if (gesture.current.dist > 0) {
        const mid = pinchMid();
        const { fx, fy } = toVB(mid.x, mid.y);
        const v0 = viewRef.current;
        const s1 = Math.max(1, Math.min(region === 'world' ? MAX_ZOOM_WORLD : MAX_ZOOM, v0.s * (d / gesture.current.dist)));
        const k = s1 / v0.s;
        applyView({ s: s1, tx: fx - k * (fx - v0.tx), ty: fy - k * (fy - v0.ty) });
        gesture.current.panned = true;
      }
      gesture.current.dist = d;
    } else if (ptrs.current.size === 1 && viewRef.current.s > 1) {
      const dxPx = e.clientX - gesture.current.lastX;
      const dyPx = e.clientY - gesture.current.lastY;
      gesture.current.lastX = e.clientX; gesture.current.lastY = e.clientY;
      if (Math.abs(dxPx) + Math.abs(dyPx) > 1.5) gesture.current.panned = true;
      const r = svgRef.current.getBoundingClientRect();
      const v0 = viewRef.current;
      applyView({ s: v0.s, tx: v0.tx + dxPx * (vbW / r.width), ty: v0.ty + dyPx * (vbH / r.height) });
    }
  }
  function onPointerUp(e) {
    if (!isMobile) return;
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) gesture.current.dist = 0;
    if (ptrs.current.size === 1) { const [p] = [...ptrs.current.values()]; gesture.current.lastX = p.x; gesture.current.lastY = p.y; }
  }
  // A pan/pinch ends on touchup over some country path; swallow the click it
  // would otherwise synthesize so panning never accidentally guesses a country.
  function onClickCaptureMap(e) {
    if (gesture.current.panned) { e.stopPropagation(); e.preventDefault(); gesture.current.panned = false; }
  }
  function resetZoom() { applyView({ s: 1, tx: 0, ty: 0 }); }

  // When zoomed we own all touch (pan); at rest a one-finger vertical drag still
  // scrolls the page, while pan-y still lets our handler intercept the 2-finger
  // pinch.
  const touchAct = isMobile ? (zoomed ? 'none' : 'pan-y') : 'manipulation';

  return (
    <div>
      {!isMobile && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${T.muted})`, marginRight: 2 }}>Map size</span>
        {SIZE_ORDER.map((s) => {
          const on = s === size;
          return (
            <button
              key={s}
              onClick={() => chooseSize(s)}
              style={{
                fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                padding: '4px 11px', cursor: 'pointer', borderRadius: 6,
                border: `1px solid ${on ? `var(--stg-acc-ink, var(--stg-acc,${CTRL_INK}))` : `var(--stg-line,rgba(20,22,28,0.18))`}`,
                background: on ? `var(--stg-acc,${CTRL_INK})` : `var(--stg-surf2,${T.white})`,
                color: on ? `var(--stg-onramp,${T.white})` : `var(--stg-mute,${T.muted})`,
              }}
            >
              {SIZES[s].label}
            </button>
          );
        })}
      </div>
      )}
      <div style={{ ...wrapStyle, position: 'relative', border: '1px solid rgba(138,130,118,0.25)', borderRadius: 2, overflow: 'hidden', background: SEA }}>
      {isMobile && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#5f7585', background: 'rgba(255,255,255,0.82)', borderRadius: 6, padding: '4px 8px', pointerEvents: 'none' }}>
          {zoomed ? 'Drag to pan · pinch to zoom' : 'Pinch to zoom in'}
        </div>
      )}
      {isMobile && zoomed && (
        <button
          onClick={resetZoom}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 6, fontFamily: "'Manrope', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '6px 12px', cursor: 'pointer', borderRadius: 6, border: `1px solid ${CTRL_ACCENT}`, background: `var(--stg-surf,${T.white})`, color: CTRL_ACCENT }}
        >
          Reset
        </button>
      )}
      <svg
        ref={svgRef}
        viewBox={geo.viewBox}
        style={{ display: 'block', width: '100%', height: 'auto', touchAction: touchAct }}
        role="img"
        aria-label="Map. Click the country named in the prompt above."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCaptureMap}
      >
        <rect x="0" y="0" width={geo.width} height={geo.height} fill={SEA} />
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.s})`}>
        {geo.paths.map((p) => {
          const f = fillFor(p.name, LAND);
          // Borderless map: stroke each path with its OWN fill color so the
          // internal seams between adjacent same-color states disappear (the
          // map reads as one clean cream silhouette) without drawing any
          // boundary line that would give away where a state is.
          return (
            <path
              key={p.name}
              d={p.d}
              fill={f}
              stroke={noBorders ? f : LINE}
              strokeWidth={noBorders ? 1 : 0.6}
              strokeLinejoin="round"
              style={{ cursor: live ? 'pointer' : 'default', transition: 'fill .12s' }}
              onMouseEnter={() => setHover(p.name)}
              onMouseLeave={() => setHover((h) => (h === p.name ? null : h))}
              onClick={() => live && onPick(p.name)}
            />
          );
        })}
        {geo.markers.map((m) => {
          // Erase mode: an erased island marker vanishes entirely (box, leader
          // line and anchor dot), same as an erased mainland region.
          if (erase && foundNames && foundNames.has(m.name)) return null;
          const s = isMobile ? 13 : 9;
          // A marker with lx/ly is a callout: the clickable box is pulled out
          // into open water at (lx,ly) and a leader line ties it back to the
          // island's true location (x,y), where a small anchor dot sits. This
          // keeps tightly-clustered island states (the Lesser Antilles) from
          // overlapping into one unclickable blob.
          const hasCallout = m.lx != null && m.ly != null;
          const bx = hasCallout ? m.lx : m.x;
          const by = hasCallout ? m.ly : m.y;
          const tint = fillFor(m.name, T.white);
          const active = (foundNames && foundNames.has(m.name)) || (flash && flash.name === m.name) || (hover === m.name && live);
          const lineColor = active ? tint : LINE;
          const enter = () => setHover(m.name);
          const leave = () => setHover((h) => (h === m.name ? null : h));
          const pick = () => live && onPick(m.name);
          const cursor = live ? 'pointer' : 'default';
          return (
            <g key={m.name}>
              {hasCallout && (
                <>
                  <line
                    x1={m.x}
                    y1={m.y}
                    x2={bx}
                    y2={by}
                    stroke={lineColor}
                    strokeWidth={0.8}
                    strokeLinecap="round"
                    style={{ transition: 'stroke .12s' }}
                  />
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={2}
                    fill={lineColor}
                    stroke={LINE}
                    strokeWidth={0.5}
                    style={{ transition: 'fill .12s' }}
                  />
                </>
              )}
              <rect
                x={bx - s / 2}
                y={by - s / 2}
                width={s}
                height={s}
                rx={1.5}
                fill={tint}
                stroke={LINE}
                strokeWidth={1}
                style={{ cursor, transition: 'fill .12s' }}
                onMouseEnter={enter}
                onMouseLeave={leave}
                onClick={pick}
              />
            </g>
          );
        })}
        </g>
      </svg>
      </div>
    </div>
  );
}
