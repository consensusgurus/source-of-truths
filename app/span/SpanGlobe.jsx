'use client';

// SPAN ON THE GLOBE (owner, 2026-11-12: "span needs to use our new map"). The
// map under Span's road is Carmen's true-colour globe (lib/carmen-globe.js on
// lib/carmen-surface.js): the road's countries shaded in the Geography pastel,
// the destination in gold, a shortest road in sky once the round ends, white
// pins on each stop and the road drawn between them. Drag to spin, pinch or
// scroll to zoom; a tap does nothing. The camera swings to keep the road and
// the destination in view as the road grows.
import React, { useEffect, useRef, useState } from 'react';
import { geoCentroid, geoArea, geoDistance } from 'd3-geo';
import CarmenGlobe, { loadWorld } from '@/lib/carmen-globe';

// Span's names where Natural Earth (world-50m) spells them differently.
const NE_NAME = {
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'Central African Republic': 'Central African Rep.',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Dominican Republic': 'Dominican Rep.',
  'Equatorial Guinea': 'Eq. Guinea',
  Eswatini: 'eSwatini',
  'Ivory Coast': "Côte d'Ivoire",
  'North Macedonia': 'Macedonia',
  'Republic of the Congo': 'Congo',
  'South Sudan': 'S. Sudan',
  'The Gambia': 'Gambia',
  'United States': 'United States of America',
  'Vatican City': 'Vatican',
};

// The point a country's road pin sits on: the centre of its largest piece, so
// France is in Europe and the United States is not in Alaska.
function mainCentroid(f) {
  const g = f && f.geometry;
  if (!g) return null;
  if (g.type !== 'MultiPolygon') return geoCentroid(f);
  let best = null, ba = -1;
  for (const poly of g.coordinates) {
    const piece = { type: 'Polygon', coordinates: poly };
    const a = geoArea(piece);
    if (a > ba) { ba = a; best = piece; }
  }
  return geoCentroid(best);
}

const ROAD = { light: '#d8f7a2', dark: '#bef264' };   // Geography lime: pastel / raw
const GOAL = '#f1d289';
const BEST = '#b1e5fd';

export default function SpanGlobe({ chain = [], goal = null, best = null, dark = false, height = 'min(52vh, 92vw)' }) {
  const boxRef = useRef(null);
  const svgRef = useRef(null);
  const G = useRef(null);
  const [world, setWorld] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadWorld().then((w) => {
      if (!alive || !svgRef.current) return;
      const byName = new Map();
      for (const f of w.land.features || []) if (f.properties && f.properties.name) byName.set(f.properties.name, f);
      G.current = new CarmenGlobe(svgRef.current, w, {});
      G.current.setInteractive(true);
      setWorld({ byName });
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (G.current) G.current.destroy(); G.current = null; };
  }, []);

  // The drawing follows the box.
  useEffect(() => {
    const B = boxRef.current;
    if (!B || !world) return undefined;
    const fit = () => {
      const g = G.current; if (!g) return;
      const r = B.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) return;
      g.setFrame(r.width, r.height, r.width / 2, r.height / 2, Math.min(r.width, r.height) / 2 - 8);
    };
    fit();
    let ro = null;
    try { ro = new ResizeObserver(fit); ro.observe(B); } catch (e) {}
    return () => { if (ro) ro.disconnect(); };
  }, [world]);

  const key = `${chain.join('|')}#${goal || ''}#${(best || []).join('|')}#${dark ? 1 : 0}`;
  useEffect(() => {
    const g = G.current;
    if (!g || !world) return;
    const feat = (n) => world.byName.get(NE_NAME[n] || n) || null;
    const road = chain.map(feat);
    const fills = [];
    const bestSet = new Set(best || []);
    for (const n of best || []) {
      if (chain.includes(n)) continue;
      const f = feat(n); if (f) fills.push({ geo: f, fill: BEST, op: 0.8, stroke: '#08222e', sw: 0.8 });
    }
    if (goal && !chain.includes(goal)) {
      const f = feat(goal); if (f) fills.push({ geo: f, fill: GOAL, op: 0.95, stroke: '#ffffff', sw: 2.2 });
    }
    road.forEach((f, i) => {
      if (!f) return;
      const end = i === 0 || i === road.length - 1;
      fills.push({ geo: f, fill: dark ? ROAD.dark : ROAD.light, op: end ? 0.95 : 0.8, stroke: '#08222e', sw: end ? 1.4 : 1 });
    });
    g.setFills(fills);
    const pts = road.map(mainCentroid).filter(Boolean);
    g.setCities(pts);
    const pairs = [];
    for (let i = 1; i < pts.length; i++) pairs.push([pts[i - 1], pts[i]]);
    g.setTrail(pairs);
    // Frame the road, the destination and any shortest road.
    const all = pts.slice();
    if (goal) { const f = feat(goal); const c = f && mainCentroid(f); if (c) all.push(c); }
    for (const n of bestSet) { const f = feat(n); const c = f && mainCentroid(f); if (c) all.push(c); }
    if (!all.length) return;
    const centre = geoCentroid({ type: 'MultiPoint', coordinates: all });
    let far = 0;
    for (const p of all) far = Math.max(far, geoDistance(centre, p));
    const k = Math.max(1, Math.min(6, 0.62 / Math.sin(Math.max(0.06, Math.min(Math.PI / 2, far + 0.08)))));
    g.lookAt(centre, k, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, key]);

  return (
    <div ref={boxRef} className="spg" style={{ position: 'relative', width: '100%', height, borderRadius: 18, overflow: 'hidden', background: '#04060c' }}>
      <style dangerouslySetInnerHTML={{ __html: '.spg .cmn-surf{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;}' }} />
      <svg ref={svgRef} role="img" aria-label="Globe showing your road. Drag to spin, pinch to zoom." style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none', userSelect: 'none', cursor: 'grab' }} />
      {failed ? <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e9edf4', fontSize: 13, fontWeight: 700, padding: 20, textAlign: 'center' }}>The globe did not load. Check your connection and reload.</div> : null}
    </div>
  );
}
