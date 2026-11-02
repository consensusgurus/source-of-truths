'use client';

// Connect: the daily dot-joining puzzle (numberlink). Drag from a dot to lay a
// line to its twin; lines never cross, and the board is done when every pair is
// joined AND every square is used. Every board has exactly one solution
// (scripts/verify-connect.mjs), but the check here is the rules, not an answer
// key: any board that joins every pair and fills every square is solved.

import React, { useRef } from 'react';
import SimpleDaily from '../SimpleDaily';
import { CATEGORY_RAMP, RAMP_INK } from '@/lib/category-ramp';

// THE SITE PASTELS (owner, 2026-11-01): each pair wears one of the ten category
// pastels, every line and dot edged in the ramp's dark ink so the pastels stay
// apart on white. Ramp order, except amber goes last: it sits too close to gold,
// and from No. 2 a board has at most nine pairs, so amber never meets gold there.
// Only No. 1 (dealt before that rule, 12 pairs) reaches amber and the extras.
const COL = [...CATEGORY_RAMP.filter((c) => c !== '#fbbf24'), '#fbbf24', '#5eead4', '#f9a8d4', '#d6b88a', '#cbd5e1'];
const INK = RAMP_INK;

const wallsOf = (P) => new Set((P.walls || []).map(([r, c]) => r * P.size + c));
const openCount = (P) => P.size * P.size - (P.walls || []).length;
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
  if (!E.current) E.current = { ends: ends(P), walls: wallsOf(P) };
  const endAt = E.current.ends, wall = E.current.walls;
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
      if (wall.has(i)) return st;
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
  const solved = links === P.dots.length && filled === openCount(P);
  const xy = (i) => [(i % n) * S + S / 2, Math.floor(i / n) * S + S / 2];
  return (
    <div className="wir">
      <style dangerouslySetInnerHTML={{ __html: `
.wir{align-self:center;width:100%;max-width:min(560px, calc(100dvh - 300px));}
@media (min-width:900px){.wir{max-width:min(640px, calc(100dvh - 270px));}}
.wir svg{display:block;width:100%;height:auto;touch-action:none;border-radius:12px;box-shadow:0 0 0 2px var(--pst-ink);background:var(--pst-bg,#fff);user-select:none;-webkit-user-select:none;}
` }} />
      <svg ref={svgRef} viewBox={`0 0 ${n * S} ${n * S}`} role="img" aria-label={`Connect board, ${n} by ${n}, ${P.dots.length} pairs${wall.size ? `, ${wall.size} blocked squares` : ''}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ cursor: active && !done ? 'pointer' : 'default' }}>
        {s.paths.map((p, k) => p.map((i) => { const [x, y] = xy(i); return <rect key={`f${k}-${i}`} x={x - S / 2} y={y - S / 2} width={S} height={S} fill={COL[k % COL.length]} fillOpacity={solved ? 0.75 : 0.42} />; }))}
        {Array.from({ length: n - 1 }, (_, i) => (
          <g key={`g${i}`} stroke="var(--pst-cell-line,#c9d2dc)" strokeWidth={2}>
            <line x1={(i + 1) * S} y1={0} x2={(i + 1) * S} y2={n * S} />
            <line x1={0} y1={(i + 1) * S} x2={n * S} y2={(i + 1) * S} />
          </g>
        ))}
        {[...wall].map((i) => { const [x, y] = xy(i); return (
          <g key={`w${i}`}>
            <rect x={x - S / 2} y={y - S / 2} width={S} height={S} fill="var(--pst-ink)" />
            <path d={`M${x - 22} ${y - 22}L${x + 22} ${y + 22}M${x + 22} ${y - 22}L${x - 22} ${y + 22}`} stroke="var(--pst-bg,#fff)" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
          </g>
        ); })}
        {s.paths.map((p, k) => (p.length > 1 ? (
          <g key={`p${k}`}>
            <polyline points={p.map((i) => xy(i).join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={38} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={p.map((i) => xy(i).join(',')).join(' ')} fill="none" stroke={COL[k % COL.length]} strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null))}
        {Object.keys(endAt).map((i) => { const [x, y] = xy(Number(i)); const k = endAt[i]; return (
          <g key={`d${i}`}>
            <circle cx={x} cy={y} r={34} fill={COL[k % COL.length]} stroke={INK} strokeWidth={5} />
            {complete(P, s.paths[k], k) ? <circle cx={x} cy={y} r={10} fill={INK} /> : null}
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
  solved: (P, s) => { const { links, filled } = stats(P, s); return links === P.dots.length && filled === openCount(P); },
  count: () => 0,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: 0 }),
  Board,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${P.size} by ${P.size}`} · ${P.dots.length} pairs · No. ${P.num}`,
  foot: (P, s) => { const { links, filled } = stats(P, s); return `${links} of ${P.dots.length} joined · ${filled} of ${openCount(P)} squares`; },
  frac: (P, s) => stats(P, s).filled / openCount(P),
  sundayLabel: (P) => `Sunday Edition · ${P.size}×${P.size}`,
  gateTitle: (P) => `Today: ${P.size} by ${P.size}, ${P.dots.length} pairs`,
  gateLine: (P) => `Join each pair of matching dots with one line. Lines can't cross${(P.walls || []).length ? ' or pass through the blocked squares' : ''}, and every open square has to be used. Every board has exactly one solution.`,
  rules: (P) => ({
    lead: 'Join every pair of dots, and use every square.',
    steps: [
      <><b>Drag</b> from a dot to lay a line, one square at a time, up, down, left or right. It joins when it reaches the dot of the <b>same colour</b>.</>,
      <>Lines <b>never cross</b>. Drawing over another line cuts it back, and dragging back along your own line takes it up.</>,
      ...((P.walls || []).length ? [<>Dark squares are <b>blocked</b>: no line goes through them.</>] : []),
      <>The board is done when every pair is joined <b>and every open square is used</b>. There is exactly <b>one way</b> to do it.</>,
    ],
    knack: 'Corners, edges and the squares beside a blocked one first: a square with only two open neighbours has to be passed straight through, and that often settles which line it belongs to.',
    footer: 'A finished board ranks on the clock.',
  }),
  pitch: (P) => `${P.dots.length} pairs on a ${P.size}x${P.size} board. Join them all and fill every open square.`,
  shareLine: (P, s, won, el) => `Connect #${P.num} · ${P.size}x${P.size} · ${won ? el : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.size}x${P.size} · ${P.dots.length} pairs · ${el}`,
  aboutTitle: 'About Connect',
  about: [
    'Connect is a free daily dot-joining puzzle from Mind Loft, the logic puzzle also known as numberlink. Join every pair of matching dots with a line, never crossing another and never through a blocked square, until every open square on the board is used.',
    'The boards grow through the week, nine by nine on Monday up to eleven by eleven on Saturday, and the Sunday Edition is twelve by twelve. The lines are few and long, the blocked squares bend them, and every board is generated fresh and proved by a solver to have exactly one solution. The clock decides the daily leaderboard.',
    <>More grid logic: <a href="/lamps" style={{ color: 'inherit', fontWeight: 800 }}>Lamps</a>, <a href="/duet" style={{ color: 'inherit', fontWeight: 800 }}>Duet</a> and <a href="/paths" style={{ color: 'inherit', fontWeight: 800 }}>Paths</a>.</>,
  ],
};

export default function ConnectClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
