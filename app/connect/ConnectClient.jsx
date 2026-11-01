'use client';

// Connect: the daily dot-joining puzzle (numberlink). Drag from a dot to lay a
// line to its twin; lines never cross, and the board is done when every pair is
// joined AND every square is used. Every board has exactly one solution
// (scripts/verify-connect.mjs), but the check here is the rules, not an answer
// key: any board that joins every pair and fills every square is solved.

import React, { useRef } from 'react';
import SimpleDaily from '../SimpleDaily';

// Sixteen colours, far apart, readable on white and on the near-black look.
const COL = ['#e11d48', '#2563eb', '#f59e0b', '#16a34a', '#9333ea', '#0891b2', '#ea580c', '#db2777', '#65a30d', '#4f46e5', '#b45309', '#0d9488', '#a21caf', '#64748b', '#dc2626', '#0284c7'];

function ends(P) { const m = {}; P.dots.forEach(([r0, c0, r1, c1], i) => { m[r0 * P.size + c0] = i; m[r1 * P.size + c1] = i; }); return m; }
const adj = (n, a, b) => Math.abs(Math.floor(a / n) - Math.floor(b / n)) + Math.abs((a % n) - (b % n)) === 1;
function complete(P, path, i) {
  const n = P.size, [r0, c0, r1, c1] = P.dots[i];
  const a = r0 * n + c0, b = r1 * n + c1;
  return path.length > 1 && ((path[0] === a && path[path.length - 1] === b) || (path[0] === b && path[path.length - 1] === a));
}
function stats(P, s) {
  const links = s.paths.filter((p, i) => complete(P, p, i)).length;
  const filled = new Set(s.paths.flat()).size;
  return { links, filled };
}

function Board({ P, s, setS, active, done }) {
  const n = P.size, S = 100, E = useRef(null);
  if (!E.current) E.current = ends(P);
  const endAt = E.current;
  const svgRef = useRef(null);
  const act = useRef(null);
  const owner = (paths, i) => paths.findIndex((p) => p.includes(i));
  const cellAt = (ev) => {
    const svg = svgRef.current; if (!svg) return -1;
    const b = svg.getBoundingClientRect();
    const c = Math.floor(((ev.clientX - b.left) / b.width) * n), r = Math.floor(((ev.clientY - b.top) / b.height) * n);
    return r < 0 || c < 0 || r >= n || c >= n ? -1 : r * n + c;
  };
  const down = (ev) => {
    if (!active || done) return;
    const i = cellAt(ev); if (i < 0) return;
    try { svgRef.current.setPointerCapture(ev.pointerId); } catch (e) {}
    const e = endAt[i];
    if (e != null) { act.current = e; setS((st) => { const p = st.paths.slice(); p[e] = [i]; return { ...st, paths: p, strokes: st.strokes + 1 }; }); return; }
    const o = owner(s.paths, i);
    if (o >= 0) { act.current = o; setS((st) => { const p = st.paths.slice(); p[o] = p[o].slice(0, p[o].indexOf(i) + 1); return { ...st, paths: p, strokes: st.strokes + 1 }; }); }
    else act.current = null;
  };
  const move = (ev) => {
    const k = act.current; if (k == null || !active || done) return;
    const i = cellAt(ev); if (i < 0) return;
    setS((st) => {
      const p = st.paths[k]; if (!p.length) return st;
      const last = p[p.length - 1];
      if (i === last || !adj(n, i, last)) return st;
      const paths = st.paths.slice();
      const at = p.indexOf(i);
      if (at >= 0) { paths[k] = p.slice(0, at + 1); return { ...st, paths }; }
      if (complete(P, p, k)) return st;
      const e = endAt[i];
      if (e != null && e !== k) return st;
      const o = paths.findIndex((q, j) => j !== k && q.includes(i));
      if (o >= 0) paths[o] = paths[o].slice(0, paths[o].indexOf(i));
      paths[k] = [...p, i];
      return { ...st, paths };
    });
  };
  const up = () => { act.current = null; };
  const { links, filled } = stats(P, s);
  const solved = links === P.dots.length && filled === n * n;
  const xy = (i) => [(i % n) * S + S / 2, Math.floor(i / n) * S + S / 2];
  return (
    <div className="wir">
      <style dangerouslySetInnerHTML={{ __html: `
.wir{align-self:center;width:100%;max-width:min(560px, calc(100dvh - 300px));}
@media (min-width:900px){.wir{max-width:min(640px, calc(100dvh - 270px));}}
.wir svg{display:block;width:100%;height:auto;touch-action:none;border-radius:12px;box-shadow:0 0 0 2px var(--pst-ink);background:var(--pst-bg,#fff);user-select:none;-webkit-user-select:none;}
` }} />
      <svg ref={svgRef} viewBox={`0 0 ${n * S} ${n * S}`} role="img" aria-label={`Connect board, ${n} by ${n}, ${P.dots.length} pairs`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ cursor: active && !done ? 'pointer' : 'default' }}>
        {s.paths.map((p, k) => p.map((i) => { const [x, y] = xy(i); return <rect key={`f${k}-${i}`} x={x - S / 2} y={y - S / 2} width={S} height={S} fill={COL[k % COL.length]} fillOpacity={solved ? 0.32 : 0.16} />; }))}
        {Array.from({ length: n - 1 }, (_, i) => (
          <g key={`g${i}`} stroke="var(--pst-cell-line,#c9d2dc)" strokeWidth={2}>
            <line x1={(i + 1) * S} y1={0} x2={(i + 1) * S} y2={n * S} />
            <line x1={0} y1={(i + 1) * S} x2={n * S} y2={(i + 1) * S} />
          </g>
        ))}
        {s.paths.map((p, k) => (p.length > 1 ? (
          <polyline key={`p${k}`} points={p.map((i) => xy(i).join(',')).join(' ')} fill="none" stroke={COL[k % COL.length]} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
        ) : null))}
        {Object.keys(endAt).map((i) => { const [x, y] = xy(Number(i)); const k = endAt[i]; return (
          <g key={`d${i}`}>
            <circle cx={x} cy={y} r={33} fill={COL[k % COL.length]} stroke={complete(P, s.paths[k], k) ? 'var(--pst-ink)' : 'none'} strokeWidth={5} />
          </g>
        ); })}
      </svg>
    </div>
  );
}

const GAME = {
  key: 'connect', name: 'Connect', cat: 'Logic', miss: null,
  fresh: (P) => ({ paths: P.dots.map(() => []), strokes: 0 }),
  validSave: (P, s) => Array.isArray(s.paths) && s.paths.length === P.dots.length,
  touched: (s) => s.strokes > 0,
  solved: (P, s) => { const { links, filled } = stats(P, s); return links === P.dots.length && filled === P.size * P.size; },
  count: () => 0,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: 0 }),
  Board,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${P.size} by ${P.size}`} · ${P.dots.length} pairs · No. ${P.num}`,
  foot: (P, s) => { const { links, filled } = stats(P, s); return `${links} of ${P.dots.length} joined · ${filled} of ${P.size * P.size} squares`; },
  frac: (P, s) => stats(P, s).filled / (P.size * P.size),
  sundayLabel: (P) => `Sunday Edition · ${P.size}×${P.size}`,
  gateTitle: (P) => `Today: ${P.size} by ${P.size}, ${P.dots.length} pairs`,
  gateLine: (P) => `Join each pair of matching dots with one line. Lines can't cross, and every square on the board has to be used. Every board has exactly one solution.`,
  rules: (P) => ({
    lead: 'Join every pair of dots, and use every square.',
    steps: [
      <><b>Drag</b> from a dot to lay a line, one square at a time, up, down, left or right. It joins when it reaches the dot of the <b>same colour</b>.</>,
      <>Lines <b>never cross</b>. Drawing over another line cuts it back, and dragging back along your own line takes it up.</>,
      <>The board is done when every pair is joined <b>and every square is used</b>. There is exactly <b>one way</b> to do it.</>,
    ],
    knack: 'Corners and edges first: a dot near a wall usually has only one way out, and a square in a corner has only two neighbours to be filled from.',
    footer: 'A finished board ranks on the clock.',
  }),
  pitch: (P) => `${P.dots.length} pairs on a ${P.size}x${P.size} board. Join them all and fill every square.`,
  shareLine: (P, s, won, el) => `Connect #${P.num} · ${P.size}x${P.size} · ${won ? el : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.size}x${P.size} · ${P.dots.length} pairs · ${el}`,
  aboutTitle: 'About Connect',
  about: [
    'Connect is a free daily dot-joining puzzle from Mind Loft, the logic puzzle also known as numberlink. Join every pair of matching dots with a line, never crossing another, until every square on the board is used.',
    'The boards grow through the week, nine by nine on Monday up to eleven by eleven on Saturday, and the Sunday Edition is twelve by twelve. Every board is generated fresh and proved by a solver to have exactly one solution, and the clock decides the daily leaderboard.',
    <>More grid logic: <a href="/lamps" style={{ color: 'inherit', fontWeight: 800 }}>Lamps</a>, <a href="/duet" style={{ color: 'inherit', fontWeight: 800 }}>Duet</a> and <a href="/paths" style={{ color: 'inherit', fontWeight: 800 }}>Paths</a>.</>,
  ],
};

export default function ConnectClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
