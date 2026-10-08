'use client';
// Player Map tab of the admin Analytics panel: two zoomable world bubble maps
// built from the full located-play history (see lib/geo-locate.js) —
//   1. Users by location   (distinct players, pinned at their latest located play)
//   2. Games played by location (every located completed game)
//
// Readability model (v3, owner feedback "too dense"):
// - Nearby locations MERGE into one cluster bubble at low zoom ("London +9 · 89")
//   and split apart as you zoom in, so dense metros read as one clean number
//   instead of a pile of overlapping circles.
// - Labels are white pills with the total; only what fits legibly is labeled,
//   more appear as you zoom. Leader lines connect pill to bubble.
// - Single-count locations render as faint dots — geography context, not noise.
// - A ranked, filterable location list sits beside each map (this is where
//   exact numbers are easiest to read); hovering a row highlights its bubble,
//   clicking zooms to it. The CSV button exports the full list.
// Zoom: Ctrl/Cmd+scroll, double-click, +/- buttons, or region presets (plain
// scroll keeps scrolling the page). Zoom is capped at 20x.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WORLD } from '@/lib/admin-world-map';
import { projectPoint } from '@/lib/geo-project';
import { downloadCsvFile } from './csv-export';
import { T } from '@/lib/theme';

const C = {
  paper: T.white,
  ink: T.ink,
  faded: T.muted,
  line: 'rgba(20,22,28,0.30)',
  lineStrong: 'rgba(20,22,28,0.18)',
  land: '#e9edf3',
  landLine: T.white,
  leader: '#9aa1ad',
  users: T.accent,
  plays: '#b45309',
};
const MONO = 'Manrope, monospace';
const SANS = 'Manrope, system-ui, -apple-system, sans-serif';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const plural = (n, one, many) => `${fmt(n)} ${Number(n) === 1 ? one : many}`;

function fmtDay(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

// Map-location CSV (full ranked list, same rows as the side panel). Lat/lon
// columns are included only when the data actually carries coordinates.
function downloadLocationsCsv(points, unitPlural) {
  const unitCol = unitPlural.charAt(0).toUpperCase() + unitPlural.slice(1);
  const hasCoords = (points || []).some((p) => p.lat || p.lon);
  const head = ['Rank', 'Location', 'City', 'Region', 'Country code', 'Country', 'Pin', 'Approximate', unitCol];
  if (hasCoords) head.push('Latitude', 'Longitude');
  const rows = (points || []).map((p, i) => {
    const r = [i + 1, p.short, p.city || '', p.region || '', p.country, p.countryName, p.precision, p.approx ? 'yes' : '', p.count];
    if (hasCoords) r.push(p.lat, p.lon);
    return r;
  });
  downloadCsvFile(`sot-${unitPlural}-by-location`, head, rows);
}

// Fit a lon/lat box into the SVG frame -> {k, x, y} view transform. Samples
// edge midpoints too, since Natural Earth curves the parallels.
function fitBBox([lon0, lat0, lon1, lat1], pad = 24) {
  const lons = [lon0, (lon0 + lon1) / 2, lon1];
  const lats = [lat0, (lat0 + lat1) / 2, lat1];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const lon of lons) {
    for (const lat of lats) {
      const [px, py] = projectPoint(WORLD, lon, lat);
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;
    }
  }
  const { width: W, height: H } = WORLD;
  const k = Math.max(1, Math.min((W - pad * 2) / Math.max(1, x1 - x0), (H - pad * 2) / Math.max(1, y1 - y0)));
  return { k, x: W / 2 - (k * (x0 + x1)) / 2, y: H / 2 - (k * (y0 + y1)) / 2 };
}

const PRESETS = [
  { id: 'world', label: 'World', view: { k: 1, x: 0, y: 0 } },
  { id: 'na', label: 'N. America', bbox: [-126, 24, -64, 51] },
  { id: 'eu', label: 'Europe', bbox: [-11, 35, 33, 60] },
  { id: 'as', label: 'Asia-Pacific', bbox: [60, -45, 180, 50] },
];

// Merge points whose bubbles would overlap at this zoom into clusters. Points
// arrive count-desc, so the biggest location anchors (and names) its cluster.
const CLUSTER_R = 26;
function clusterPoints(pts, k) {
  const out = [];
  for (const p of pts) {
    const zx = p.x * k;
    const zy = p.y * k;
    let host = null;
    for (const c of out) {
      const dx = c.zx - zx;
      const dy = c.zy - zy;
      if (dx * dx + dy * dy < CLUSTER_R * CLUSTER_R) { host = c; break; }
    }
    if (host) {
      host.count += p.count;
      host.members.push(p);
    } else {
      out.push({ key: p.key, anchor: p, zx, zy, count: p.count, members: [p] });
    }
  }
  return out;
}

// Greedy pill-label placement in zoom space (positions scale with k, pan is a
// pure translate on top, so the layout only recomputes on zoom or clustering).
const ANGLES = [0, -Math.PI / 4, Math.PI / 4, Math.PI, (-3 * Math.PI) / 4, (3 * Math.PI) / 4, -Math.PI / 2, Math.PI / 2];
function layoutLabels(clusters, k) {
  const budget = k < 2 ? 34 : k < 4 ? 80 : 130;
  const placed = [];
  const labels = [];
  const obstacles = clusters.slice(0, 40).map((c) => ({
    x0: c.zx - c.r, y0: c.zy - c.r, x1: c.zx + c.r, y1: c.zy + c.r,
  }));
  const overlapArea = (a, b) => {
    const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return w > 0 && h > 0 ? w * h : 0;
  };
  let n = 0;
  for (const c of clusters) {
    if (c.count < 2) continue;
    if (n >= budget) break;
    const name = c.members.length > 1 ? `${c.anchor.short} +${c.members.length - 1}` : c.anchor.short;
    const countText = fmt(c.count);
    const w = (name.length + countText.length + 1) * 6.35 + 14;
    const h = 17;
    let best = null;
    let bestScore = Infinity;
    let bestBase = 0;
    for (let ring = 0; ring < 3; ring++) {
      const dist = c.r + 9 + ring * 18;
      for (let ai = 0; ai < ANGLES.length; ai++) {
        const ang = ANGLES[ai];
        const ax = c.zx + Math.cos(ang) * dist;
        const ay = c.zy + Math.sin(ang) * dist;
        const cos = Math.cos(ang);
        const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
        const x0 = anchor === 'start' ? ax : anchor === 'end' ? ax - w : ax - w / 2;
        const vshift = anchor === 'middle' ? (Math.sin(ang) > 0 ? h / 2 + 2 : -h / 2 - 2) : 0;
        const rect = { x0, y0: ay - h / 2 + vshift, x1: x0 + w, y1: ay + h / 2 + vshift };
        let score = ring * 3 + ai * 0.35;
        for (const r of placed) score += overlapArea(rect, r) * 2;
        for (const o of obstacles) score += overlapArea(rect, o) * 0.6;
        if (score < bestScore) {
          bestScore = score;
          bestBase = ring * 3 + ai * 0.35;
          best = { rect, ax, ay: ay + vshift, anchor, ang };
        }
      }
      if (best && bestScore <= ring * 3 + ANGLES.length * 0.35) break;
    }
    if (!best || bestScore - bestBase > 60) continue; // no legible spot at this zoom
    n += 1;
    placed.push(best.rect);
    labels.push({
      key: c.key,
      name,
      countText,
      rect: best.rect,
      anchor: best.anchor,
      lx0: c.zx + Math.cos(best.ang) * (c.r + 1),
      ly0: c.zy + Math.sin(best.ang) * (c.r + 1),
      lx1: (best.rect.x0 + best.rect.x1) / 2 > c.zx ? best.rect.x0 : best.rect.x1,
      ly1: (best.rect.y0 + best.rect.y1) / 2,
    });
  }
  return labels;
}

function ZoomButton({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26, height: 26, background: C.paper, border: `1px solid ${C.lineStrong}`,
        color: C.ink, fontFamily: MONO, fontSize: 13, lineHeight: 1, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function BubbleMap({ title, subtitle, accent, points, unitSingular, unitPlural, footnote }) {
  const { width: W, height: H } = WORLD;
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState(null); // cluster key
  const [listHover, setListHover] = useState(null); // point key from the side list
  const [query, setQuery] = useState('');
  const [preset, setPreset] = useState('world');
  const svgRef = useRef(null);
  const drag = useRef(null);

  const clusters = useMemo(() => {
    const cs = clusterPoints(points, view.k);
    const maxC = cs.length ? Math.max(...cs.map((c) => c.count)) : 1;
    const rMin = 3.5;
    const rMax = 24;
    const kk = (rMax - rMin) / Math.sqrt(Math.max(maxC - 1, 1));
    for (const c of cs) c.r = rMin + kk * Math.sqrt(Math.max(c.count - 1, 0));
    return cs;
  }, [points, view.k]);

  const labels = useMemo(() => layoutLabels(clusters, view.k), [clusters, view.k]);

  // Ctrl/Cmd + wheel zooms about the cursor (embed convention); a plain wheel
  // keeps scrolling the page. Native listener because React's onWheel is
  // passive (can't preventDefault).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * W;
      const my = ((e.clientY - rect.top) / rect.height) * H;
      setPreset('');
      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const k = Math.max(1, Math.min(20, v.k * factor));
        const scale = k / v.k;
        return { k, x: mx - (mx - v.x) * scale, y: my - (my - v.y) * scale };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [W, H]);

  const toLocal = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H];
  };
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const [mx, my] = toLocal(e);
    drag.current = { mx, my, x: view.x, y: view.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const [mx, my] = toLocal(e);
    setView((v) => ({ ...v, x: drag.current.x + (mx - drag.current.mx), y: drag.current.y + (my - drag.current.my) }));
  };
  const onPointerUp = () => { drag.current = null; };
  const zoomBy = (factor, cx = W / 2, cy = H / 2) => {
    setPreset('');
    setView((v) => {
      const k = Math.max(1, Math.min(20, v.k * factor));
      const scale = k / v.k;
      return { k, x: cx - (cx - v.x) * scale, y: cy - (cy - v.y) * scale };
    });
  };
  const applyPreset = (p) => {
    setPreset(p.id);
    setView(p.view || fitBBox(p.bbox));
  };
  const zoomToPoint = (p) => {
    const k = Math.max(view.k, 7);
    setPreset('');
    setView({ k, x: W / 2 - p.x * k, y: H / 2 - p.y * k });
  };

  const visible = (zx, zy, pad) => {
    const sx = zx + view.x;
    const sy = zy + view.y;
    return sx > -pad && sx < W + pad && sy > -pad && sy < H + pad;
  };

  const hoverCluster = hover ? clusters.find((c) => c.key === hover) : null;
  const listHoverCluster = listHover ? clusters.find((c) => c.members.some((m) => m.key === listHover)) : null;
  const unit = (n) => (n === 1 ? unitSingular : unitPlural);
  const maxCount = points.length ? points[0].count : 1;

  const listPoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return points;
    return points.filter((p) => `${p.short} ${p.countryName}`.toLowerCase().includes(q));
  }, [points, query]);

  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ minWidth: 260, flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: accent, display: 'inline-block' }} />
            <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: C.ink }}>{title}</span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.faded, marginTop: 4 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESETS.map((p) => {
            const on = preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                style={{
                  padding: '5px 10px', background: on ? `${accent}14` : 'transparent',
                  border: `1px solid ${on ? accent : C.line}`, color: on ? accent : C.faded,
                  fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 560px', minWidth: 320 }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'grab', touchAction: 'none', background: C.paper, border: `1px solid ${C.line}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={() => { onPointerUp(); setHover(null); }}
            onDoubleClick={(e) => { const [mx, my] = toLocal(e); zoomBy(1.8, mx, my); }}
            role="img"
            aria-label={`${title} world map`}
          >
            <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
              {WORLD.countries.map((c, i) => (
                <path key={i} d={c.d} fill={C.land} stroke={C.landLine} strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            <g transform={`translate(${view.x},${view.y})`}>
              {labels.map((l) =>
                visible((l.rect.x0 + l.rect.x1) / 2, (l.rect.y0 + l.rect.y1) / 2, 200) ? (
                  <line key={`ll-${l.key}`} x1={l.lx0} y1={l.ly0} x2={l.lx1} y2={l.ly1} stroke={C.leader} strokeWidth={1} />
                ) : null
              )}
              {clusters.map((c) => {
                const isHover = hover === c.key || (listHoverCluster && listHoverCluster.key === c.key);
                const single = c.count === 1;
                return visible(c.zx, c.zy, 60) ? (
                  <g key={c.key} transform={`translate(${c.zx},${c.zy})`}>
                    {!single ? <circle r={c.r + 1.25} fill="none" stroke={C.paper} strokeWidth={2.5} /> : null}
                    <circle
                      r={single ? 3.2 : c.r}
                      fill={accent}
                      fillOpacity={single ? 0.16 : isHover ? 0.5 : 0.3}
                      stroke={accent}
                      strokeOpacity={single ? 0.45 : 1}
                      strokeWidth={isHover ? 2.2 : 1.4}
                      strokeDasharray={c.anchor.approx && c.members.length === 1 ? '3 2' : 'none'}
                    />
                    <circle
                      r={Math.max(single ? 3.2 : c.r, 9)}
                      fill="transparent"
                      onMouseEnter={() => setHover(c.key)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => (c.members.length > 1 || view.k < 7 ? zoomToPoint(c.anchor) : null)}
                      style={{ cursor: c.members.length > 1 ? 'zoom-in' : 'pointer' }}
                    />
                  </g>
                ) : null;
              })}
              {labels.map((l) =>
                visible((l.rect.x0 + l.rect.x1) / 2, (l.rect.y0 + l.rect.y1) / 2, 200) ? (
                  <g key={`lp-${l.key}`} pointerEvents="none">
                    <rect
                      x={l.rect.x0} y={l.rect.y0}
                      width={l.rect.x1 - l.rect.x0} height={l.rect.y1 - l.rect.y0}
                      rx={3} fill={C.paper} fillOpacity={0.94} stroke={C.lineStrong} strokeWidth={0.8}
                    />
                    <text
                      x={l.rect.x0 + 7}
                      y={(l.rect.y0 + l.rect.y1) / 2}
                      dominantBaseline="central"
                      style={{ fontFamily: MONO, fontSize: 10.5, fill: C.ink }}
                    >
                      {l.name} <tspan style={{ fontWeight: 700 }}>{l.countText}</tspan>
                    </text>
                  </g>
                ) : null
              )}
            </g>
          </svg>
          <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ZoomButton title="Zoom in" onClick={() => zoomBy(1.6)}>+</ZoomButton>
            <ZoomButton title="Zoom out" onClick={() => zoomBy(1 / 1.6)}>−</ZoomButton>
            <ZoomButton title="Reset view" onClick={() => applyPreset(PRESETS[0])}>⟲</ZoomButton>
          </div>
          {hoverCluster ? (
            <div
              style={{
                position: 'absolute',
                left: `${((hoverCluster.zx + view.x) / W) * 100}%`,
                top: `${((hoverCluster.zy + view.y) / H) * 100}%`,
                transform: 'translate(-50%, -118%)',
                marginTop: -hoverCluster.r,
                background: C.ink, color: T.surface, padding: '8px 11px',
                fontSize: 11.5, lineHeight: 1.5, pointerEvents: 'none',
                whiteSpace: 'nowrap', zIndex: 5, boxShadow: '0 4px 14px rgba(20,22,28,0.25)',
              }}
            >
              {hoverCluster.members.length > 1 ? (
                <>
                  <div style={{ fontWeight: 700 }}>
                    {fmt(hoverCluster.members.length)} locations · {fmt(hoverCluster.count)} {unit(hoverCluster.count)}
                  </div>
                  {hoverCluster.members.slice(0, 6).map((m) => (
                    <div key={m.key} style={{ fontFamily: MONO, fontSize: 11 }}>
                      {m.short} · {fmt(m.count)}{m.approx ? ' ≈' : ''}
                    </div>
                  ))}
                  {hoverCluster.members.length > 6 ? (
                    <div style={{ color: '#c7cbd4' }}>+{fmt(hoverCluster.members.length - 6)} more — click to zoom in</div>
                  ) : (
                    <div style={{ color: '#c7cbd4' }}>click to zoom in</div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700 }}>
                    {hoverCluster.anchor.short}
                    {hoverCluster.anchor.precision !== 'country' ? ` · ${hoverCluster.anchor.countryName}` : ''}
                  </div>
                  <div style={{ fontFamily: MONO }}>{fmt(hoverCluster.count)} {unit(hoverCluster.count)}</div>
                  {hoverCluster.anchor.approx ? <div style={{ color: '#c7cbd4' }}>≈ approximate ({hoverCluster.anchor.precision}-level pin)</div> : null}
                </>
              )}
            </div>
          ) : null}
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 235, maxWidth: 360, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderBottom: `1px solid ${C.line}`, background: T.surface }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: C.ink, flex: 1 }}>
              {fmt(points.length)} locations
            </span>
            <button
              onClick={() => downloadLocationsCsv(points, unitPlural)}
              title={`Download all ${fmt(points.length)} locations as CSV (opens in Excel/Sheets)`}
              style={{
                padding: '4px 9px', background: C.ink, border: `1px solid ${C.ink}`, color: T.surface,
                fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              ↓ CSV
            </button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter locations…"
            style={{ border: 'none', borderBottom: `1px solid ${C.line}`, padding: '7px 10px', fontFamily: MONO, fontSize: 10.5, outline: 'none', color: C.ink }}
          />
          <div style={{ overflowY: 'auto', maxHeight: 430, flex: 1 }}>
            {listPoints.map((p) => {
              const rank = points.indexOf(p) + 1;
              const on = listHover === p.key;
              return (
                <div
                  key={p.key}
                  onMouseEnter={() => setListHover(p.key)}
                  onMouseLeave={() => setListHover(null)}
                  onClick={() => zoomToPoint(p)}
                  title="Click to zoom the map to this location"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px',
                    cursor: 'zoom-in', background: on ? `${accent}0d` : 'transparent',
                    borderBottom: `1px solid ${C.line}`, position: 'relative',
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faded, flex: '0 0 26px', textAlign: 'right' }}>{rank}</span>
                  <span style={{ fontFamily: SANS, fontSize: 12, color: C.ink, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.short}
                    {p.approx ? <span style={{ color: C.faded }}> ≈</span> : null}
                    {p.precision === 'country' ? <span style={{ color: C.faded, fontSize: 10 }}> (country)</span> : null}
                  </span>
                  <span style={{ flex: '0 0 52px', height: 5, background: `${accent}1f`, borderRadius: 2, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(4, Math.round((p.count / maxCount) * 100))}%`, background: accent, opacity: 0.85 }} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, flex: '0 0 42px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(p.count)}</span>
                </div>
              );
            })}
            {!listPoints.length ? (
              <div style={{ padding: 14, fontFamily: SANS, fontSize: 12, color: C.faded, fontStyle: 'italic' }}>No matches.</div>
            ) : null}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: C.faded, marginTop: 8, lineHeight: 1.5 }}>{footnote}</div>
    </div>
  );
}

function Chip({ label, value, muted }) {
  return (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: '10px 14px', minWidth: 108 }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.faded }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: muted ? C.faded : C.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function GeoMapPanel({ data }) {
  const d = data || { users: [], plays: [], totals: {}, since: null };
  const t = d.totals || {};
  const since = fmtDay(d.since);
  const baseNote = since ? `Full history since location tracking began (first located game ${since}).` : 'No located games yet — location capture fills in as games are played on the live site.';
  const zoomNote = 'Bubbles merge into "+N" clusters when they would overlap — zoom in (Ctrl/⌘+scroll, double-click, +/− or the presets) and they split apart. Click a bubble or a list row to zoom straight to it; plain scrolling always scrolls the page.';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Chip label="Located users" value={fmt(t.locatedPlayers || 0)} />
        <Chip label="Located games" value={fmt(t.locatedPlays || 0)} />
        <Chip label="Cities" value={fmt(t.cities || 0)} />
        <Chip label="Countries" value={fmt(t.countries || 0)} />
        <Chip label="No location" value={`${plural(t.unlocatedPlayers || 0, 'user', 'users')} · ${plural(t.unlocatedPlays || 0, 'game', 'games')}`} muted />
      </div>
      <BubbleMap
        title="Users by location"
        subtitle={`${baseNote} Each distinct player (registered or anonymous) counts once, at their most recent located game.`}
        accent={C.users}
        points={d.users || []}
        unitSingular="user"
        unitPlural="users"
        footnote={`${zoomNote} Faint dots = single-user locations; dashed = approximate pin (pinned to region/country). Players with no located game: ${fmt(t.unlocatedPlayers || 0)}.`}
      />
      <BubbleMap
        title="Games played by location"
        subtitle={`${baseNote} Every completed game with a location, all formats, replays included.`}
        accent={C.plays}
        points={d.plays || []}
        unitSingular="game"
        unitPlural="games"
        footnote={`${zoomNote} Faint dots = single-game locations; dashed = approximate pin. Games with no location: ${fmt(t.unlocatedPlays || 0)} of ${fmt(t.plays || 0)} all-time.`}
      />
    </div>
  );
}
