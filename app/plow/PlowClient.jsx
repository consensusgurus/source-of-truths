'use client';

// Plow: the daily plow-every-street snow puzzle, the winter sibling of Mop and
// Mow (owner, 2026-11-17: "mock up plow that is similar to mop / mow format but
// is plowing snowfilled streets", then "Push to live now with good share link
// image"). A town seen from above under fresh snow, one plow truck, one rule:
// plow every street exactly once, corner to corner, and finish at the salt barn.
// Streets run straight, bend, cut across blocks on diagonals, cross the river on
// bridges and run out to cul-de-sacs (one move: in, round and back out), so the
// board is a street map, not a grid.
//
// QUICK REPLAY, as Mop and Mow. There is no Undo. Driving down a street already
// plowed flashes it and the truck is back at the depot 650ms later with the clock
// still running: one replay, kept in the save as `replays` and posted as
// guesses_used. Replay does the same by hand. Ranked on the clock, then replays
// (CLOCK_FIRST in lib/daily-games.js); results always show the replays.
//
// The model is lib/plow-engine.js, the drawing lib/plow-art.js. The board is two
// svgs with one viewBox: the town, painted once, and a light layer above it for
// the asphalt the truck uncovers, the truck and the night lamps, so a move never
// repaints a thousand houses. Runs on app/SimpleDaily.jsx.

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { plowModel, oriented, other, cumLen, pointAt, polyDist, pathD, add, sub, mul, len, walk, courtCentre } from '@/lib/plow-engine';
import { drawTown, TRUCK, PLOW_LIGHT, PLOW_DARK, PLOW_ART_CSS } from '@/lib/plow-art';

const FLASH_MS = 650;
const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const MODELS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
function modelOf(P) {
  let m = MODELS && MODELS.get(P);
  if (!m) { m = plowModel(P); if (MODELS) MODELS.set(P, m); }
  return m;
}
const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const deg = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI + 90;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const CSS = `
.plow{align-self:center;width:100%;display:flex;flex-direction:column;gap:8px;${PLOW_LIGHT}}
.stage-page[data-stage-theme='dark'] .plow{${PLOW_DARK}}
.plow .pl-town{position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--pl-ink);background:var(--pl-ground);touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer}
.plow .pl-town svg{display:block;width:100%;height:auto;font-family:'Manrope',system-ui,sans-serif}
.plow .pl-town svg.pl-live{position:absolute;inset:0;height:100%;pointer-events:none}
.plow .pl-town.shake svg{animation:pl-shake .26s}
@keyframes pl-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.plow .pl-wrap{transition:opacity .35s}
.plow .pl-snow{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.plow .pl-snow::before,.plow .pl-snow::after{content:'';position:absolute;left:0;right:0;top:-480px;bottom:0;opacity:.85;will-change:transform}
.plow .pl-snow::before{background-image:radial-gradient(circle,var(--pl-flake) 0 1.6px,rgba(110,130,160,.35) 2.1px,transparent 2.7px),radial-gradient(circle,var(--pl-flake) 0 1.2px,transparent 2px);background-size:96px 120px,130px 120px;background-position:0 0,52px 64px;animation:pl-fall 15s linear infinite}
.plow .pl-snow::after{background-image:radial-gradient(circle,var(--pl-flake) 0 2.2px,rgba(110,130,160,.3) 2.8px,transparent 3.4px);background-size:170px 160px;background-position:30px 20px;animation:pl-fall2 11s linear infinite;opacity:.7}
@keyframes pl-fall{to{transform:translate(18px,480px)}}
@keyframes pl-fall2{to{transform:translate(-14px,480px)}}
@media (prefers-reduced-motion:reduce){.plow .pl-snow{display:none}}
${PLOW_ART_CSS}
.plow-msg{min-height:22px;text-align:center;font:800 13px/1.6 'Manrope',system-ui,sans-serif;color:var(--pst-bad,#be123c);}
.plow-msg.ok{color:var(--pl-ink);}
`;

// On a phone the outskirts are trimmed so the streets draw bigger.
function cropFor(P, M) {
  const pts = Object.values(P.nodes).slice();
  M.E.filter((e) => e.court).forEach((e) => pts.push(add(courtCentre(P, e), mul(e.court, 50))));
  const dc = add(P.nodes[P.start], mul(P.startDir, 118)), bc = add(P.nodes[P.end], mul(P.endDir, 122));
  [[dc, 84], [bc, 56]].forEach(([c, r]) => pts.push([c[0] - r, c[1] - r], [c[0] + r, c[1] + r]));
  const [vx, vy, vw, vh] = M.vb, m = 34;
  const x0 = Math.max(vx, Math.min(...pts.map((p) => p[0])) - m), x1 = Math.min(vx + vw, Math.max(...pts.map((p) => p[0])) + m);
  const y0 = Math.max(vy, Math.min(...pts.map((p) => p[1])) - m), y1 = Math.min(vy + vh, Math.max(...pts.map((p) => p[1])) + m);
  return [x0, y0, x1 - x0, y1 - y0];
}

export function Board({ P, s, setS, active, done }) {
  const M = modelOf(P);
  const art = useMemo(() => drawTown(P, M), [P, M]);
  const [vb, setVb] = useState(M.vb);
  const [note, setNote] = useState(null);
  const [flash, setFlash] = useState(null);
  const baseRef = useRef(null), truckRef = useRef(null), wrapRef = useRef(null), townRef = useRef(null);
  const segRefs = useRef({}), nodeRefs = useRef({});
  const R = useRef({ anim: null, queue: [], next: null, path: s.path.slice(), ang: deg(mul(P.startDir, -1)), drag: false, timer: null, exit: null });
  const live = active && !done && flash == null;
  const [wonAtMount] = useState(() => !!done && s.path.length === M.n);
  const liveRef = useRef(live); liveRef.current = live;

  useEffect(() => {
    const fit = () => setVb(typeof window !== 'undefined' && window.innerWidth < 640 ? cropFor(P, M) : M.vb);
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [P, M]);
  useEffect(() => () => { const r = R.current; clearTimeout(r.timer); if (r.anim) cancelAnimationFrame(r.anim.raf); if (r.exit) cancelAnimationFrame(r.exit); }, []);

  const place = (p, a) => { if (truckRef.current) truckRef.current.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${a.toFixed(1)}) scale(.95)`); };
  const setReveal = (i, v) => { const g = segRefs.current[i]; if (g) g.querySelectorAll('path').forEach((el) => el.setAttribute('stroke-dashoffset', String(v))); };
  const cancelAnim = () => {
    const r = R.current;
    if (r.anim) { cancelAnimationFrame(r.anim.raf); setReveal(r.anim.e.i, r.path.includes(r.anim.e.i) ? 0 : 1); r.anim = null; }
    r.queue = []; r.next = null;
    if (townRef.current) townRef.current.classList.remove('moving');
  };

  // keep the local route in step with the save (the Replay button, a restore)
  useIso(() => {
    const r = R.current, same = r.path.length === s.path.length && r.path.every((v, i) => v === s.path[i]);
    if (same) return;
    if (r.anim && s.path.length >= r.path.length) return;
    cancelAnim();
    r.path = s.path.slice();
    if (!s.path.length) r.ang = deg(mul(P.startDir, -1));
    const w = walk(P, r.path);
    place(P.nodes[w.err ? P.start : w.cur], r.ang);
    M.E.forEach((e) => setReveal(e.i, r.path.includes(e.i) ? 0 : 1));
  }, [s.path]);
  // first paint and every settled move: the truck stands on its corner
  useIso(() => {
    const r = R.current;
    if (r.anim) return;
    const w = walk(P, r.path);
    place(P.nodes[w.err ? P.start : w.cur], r.ang);
  });
  // the end: the truck drives into the barn and is gone
  useEffect(() => {
    const r = R.current, w = walk(P, s.path);
    const won = s.path.length === M.n && w.cur === P.end;
    if (!done || !won || !wrapRef.current || wonAtMount) return undefined;
    const pts = M.apronE.concat([add(M.apronE[1], mul(P.endDir, 34))]), C = cumLen(pts), L = C[C.length - 1];
    const t0 = performance.now();
    const f = (now) => {
      const t = Math.min(1, (now - t0) / 750), { p, dir } = pointAt(pts, C, ease(t) * L);
      r.ang += ((((deg(dir) - r.ang + 540) % 360) - 180) * 0.3);
      place(p, r.ang);
      if (wrapRef.current) wrapRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, t - 0.55) / 0.45));
      if (t < 1) r.exit = requestAnimationFrame(f);
    };
    r.exit = requestAnimationFrame(f);
    return () => cancelAnimationFrame(r.exit);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const curNode = () => { const w = walk(P, R.current.path); return w.err ? P.start : w.cur; };
  const shakeIt = () => { const el = townRef.current; if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  const nudge = (t) => { setNote({ t, bad: true }); shakeIt(); };
  const replay = (ei, why) => {
    const r = R.current;
    cancelAnim();
    setFlash(ei); setNote({ t: why, bad: true }); shakeIt();
    r.timer = setTimeout(() => {
      setFlash(null);
      r.path = []; r.ang = deg(mul(P.startDir, -1));
      M.E.forEach((e) => setReveal(e.i, 1));
      if (wrapRef.current) { wrapRef.current.style.opacity = '0'; requestAnimationFrame(() => { if (wrapRef.current) wrapRef.current.style.opacity = '1'; }); }
      place(P.nodes[P.start], r.ang);
      setS((st) => ({ ...st, path: [], replays: (st.replays || 0) + 1 }));
      setNote({ t: 'Back at the depot. The clock is still running.' });
    }, FLASH_MS);
  };
  const afterMove = (cur) => {
    const r = R.current;
    if (r.path.length === M.n) { setNote(cur === P.end ? { t: 'Every street clear. Into the barn.' } : null); return; }
    const left = (M.inc[cur] || []).filter((i) => !r.path.includes(i));
    if (!left.length) setNote({ t: 'Nowhere snowy left from this corner. Tap Replay.', bad: true });
    else if (cur === P.end) setNote({ t: 'Passing the salt barn. Streets still to go.' });
    else setNote(null);
  };
  const drive = (e) => {
    const r = R.current, from = curNode(), to = other(e, from);
    const pts = oriented(e, from), C = cumLen(pts), L = C[C.length - 1];
    const rev = e.a !== from && !e.court;
    if (!r.queue.length) r.next = to;
    const dur = Math.max(190, L * 1.05), t0 = performance.now();
    const n0 = nodeRefs.current[from]; if (n0) n0.classList.add('on');
    if (townRef.current) townRef.current.classList.add('moving');
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur), te = ease(t), { p, dir } = pointAt(pts, C, te * L);
      r.ang += ((((deg(dir) - r.ang + 540) % 360) - 180) * Math.min(1, e.court ? 0.65 : 0.35));
      place(p, r.ang);
      setReveal(e.i, rev ? -(1 - te) : 1 - te);
      if (t < 1) { r.anim.raf = requestAnimationFrame(step); return; }
      r.anim = null;
      if (townRef.current) townRef.current.classList.remove('moving');
      r.path = [...r.path, e.i];
      const n1 = nodeRefs.current[to]; if (n1) n1.classList.add('on');
      const path = r.path.slice();
      setS((st) => ({ ...st, path }));
      afterMove(to);
      if (r.queue.length) { const [q, quiet] = r.queue.shift(); tryEdge(q, quiet); } else r.next = null;
    };
    r.anim = { e, raf: requestAnimationFrame(step) };
  };
  const tryEdge = (ei, quiet) => {
    const r = R.current;
    if (!liveRef.current) return;
    const e = M.E[ei];
    if (r.anim) {
      if (r.queue.length < 8 && (e.a === r.next || e.b === r.next)) { r.queue.push([ei, quiet]); r.next = other(e, r.next); }
      return;
    }
    const cur = curNode();
    if (e.a !== cur && e.b !== cur) return;
    if (r.path.includes(ei)) {
      // a drag that wobbles back down the street it just plowed is a slip, not a choice
      if (quiet && r.path[r.path.length - 1] === ei) return;
      replay(ei, 'Already plowed. Replay.');
      return;
    }
    drive(e);
  };
  const tryRef = useRef(tryEdge); tryRef.current = tryEdge;

  const svgPt = (ev) => {
    const svg = baseRef.current; if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y];
  };
  const fromNode = () => { const r = R.current; return r.anim && r.next ? r.next : curNode(); };
  const pick = (q) => {
    const cur = fromNode(); let best = null, bd = Infinity;
    for (const i of M.inc[cur] || []) {
      const e = M.E[i]; let d;
      if (e.court) d = Math.min(len(sub(q, courtCentre(P, e))) - 8, polyDist(q, e.P, 26));
      else { const pts = oriented(e, cur); d = Math.min(polyDist(q, pts, 26), len(sub(q, pts[pts.length - 1])) * 0.8); }
      if (d < bd) { bd = d; best = i; }
    }
    return bd < 46 ? best : null;
  };
  const down = (ev) => {
    if (!liveRef.current) return;
    R.current.drag = true;
    const q = svgPt(ev); if (!q) return;
    const i = pick(q);
    if (i != null) tryRef.current(i);
    else if (!R.current.anim) {
      const near = Object.keys(M.inc).some((n) => len(sub(q, P.nodes[n])) < 40) || M.E.some((e) => polyDist(q, e.P) < 22);
      if (near) nudge('One block at a time: tap a street that leads from the truck.');
    }
  };
  const move = (ev) => {
    const r = R.current;
    if (!r.drag || !liveRef.current || r.anim) return;
    const q = svgPt(ev); if (!q) return;
    const cur = curNode();
    for (const i of M.inc[cur] || []) {
      const e = M.E[i], far = e.court ? courtCentre(P, e) : P.nodes[other(e, cur)];
      if (len(sub(q, far)) < 30) { tryRef.current(i, true); return; }
    }
  };
  const up = () => { R.current.drag = false; };

  useEffect(() => {
    if (!active || done) return undefined;
    const KEYS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const onKey = (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const K = KEYS[ev.key]; if (!K) return;
      ev.preventDefault();
      const cur = fromNode(); let best = null, bd = 181;
      for (const i of M.inc[cur] || []) {
        const pts = oriented(M.E[i], cur), u = pointAt(pts, cumLen(pts), 30).dir;
        let dd = (Math.abs(Math.atan2(u[0] * K[1] - u[1] * K[0], u[0] * K[0] + u[1] * K[1])) * 180) / Math.PI;
        if (R.current.path.includes(i)) dd += 25;
        if (dd < bd) { bd = dd; best = i; }
      }
      if (best != null && bd < 70) tryRef.current(best);
      else setNote({ t: 'No street that way.', bad: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const on = new Set(s.path);
  const nodeOn = new Set(); s.path.forEach((i) => { nodeOn.add(M.E[i].a); nodeOn.add(M.E[i].b); });
  const left = M.n - s.path.length;
  const [vx, vy, vw, vh] = vb, aspect = vh / vw;
  const vbs = `${vx} ${vy} ${vw} ${vh}`;
  return (
    <div className="plow" style={{ maxWidth: `min(780px, calc((100dvh - 290px) / ${aspect.toFixed(3)}))` }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div ref={townRef} className="pl-town"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}>
        <svg ref={baseRef} viewBox={vbs} role="img" aria-label={`A town under snow, ${left} ${left === 1 ? 'street' : 'streets'} left to plow`}
          dangerouslySetInnerHTML={{ __html: art.town }} />
        <svg className="pl-live" viewBox={vbs} aria-hidden="true">
          {M.E.map((e) => {
            const d = pathD(e.P), off = on.has(e.i) ? 0 : 1;
            return (
              <g key={e.i} ref={(el) => { segRefs.current[e.i] = el; }}>
                <path className="g-asph" d={d} strokeWidth={23} pathLength={1} strokeDasharray="1 1" strokeDashoffset={off} />
                <path className="g-cl" d={d} strokeWidth={1.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={off} />
              </g>
            );
          })}
          {Object.keys(M.inc).map((n) => (
            <circle key={n} ref={(el) => { nodeRefs.current[n] = el; }} className={`g-asphf np${nodeOn.has(n) ? ' on' : ''}`} cx={P.nodes[n][0]} cy={P.nodes[n][1]} r={11.5} />
          ))}
          <g dangerouslySetInnerHTML={{ __html: art.islands }} />
          <g className="night" dangerouslySetInnerHTML={{ __html: art.lamps }} />
          {flash != null && M.E[flash] && <path className="g-flash" d={pathD(M.E[flash].P)} strokeWidth={27} />}
          <g ref={wrapRef} className="pl-wrap" style={{ opacity: wonAtMount ? 0 : 1 }}>
            <g ref={truckRef} dangerouslySetInnerHTML={{ __html: TRUCK }} />
          </g>
        </svg>
        <div className="pl-snow" />
      </div>
      <div className={`plow-msg${note && !note.bad ? ' ok' : ''}`} aria-live="polite">{active && !done && note ? note.t : ''}</div>
    </div>
  );
}

function Tools({ P, s, setS, active, done }) {
  if (done) return null;
  const can = active && s.path.length > 0;
  const replay = () => setS((st) => (st.path.length < 1 ? st : { ...st, path: [], replays: (st.replays || 0) + 1 }));
  const n = s.replays || 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <button type="button" className="sd-tool" onClick={replay} disabled={!can} style={{ opacity: can ? 1 : 0.4 }}>Replay</button>
      <span style={{ font: "800 13px/1 'Manrope',system-ui,sans-serif", color: 'var(--stg-mute,#8b95a8)' }}>{n} {n === 1 ? 'replay' : 'replays'}</span>
    </div>
  );
}

const plural = (n) => `${n} ${n === 1 ? 'replay' : 'replays'}`;
const courtLine = (P) => (P.edges.some((e) => e.court) ? ' A cul-de-sac is one move: tap its circle and the truck plows in, round and back out.' : '');
const riverLine = (P) => (P.river ? ` The river has ${P.edges.filter((e) => e.bridge).length} bridges, and each is a street like any other.` : '');

export const GAME = {
  key: 'plow', name: 'Plow', cat: 'Logic', miss: 'Replays', missOne: 'replay',
  fresh: () => ({ path: [], replays: 0 }),
  validSave: (P, s) => Array.isArray(s.path) && s.path.every((v) => Number.isInteger(v) && v >= 0 && v < P.edges.length) && new Set(s.path).size === s.path.length && !walk(P, s.path).err,
  touched: (s) => s.path.length > 0 || (s.replays || 0) > 0,
  solved: (P, s) => s.path.length === P.edges.length && walk(P, s.path).cur === P.end,
  count: (s) => s.replays || 0,
  metric: (P, s, won) => (won ? s.replays || 0 : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.replays || 0 }),
  Board,
  tools: (props) => <Tools {...props} />,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || BAND[P.band]} · ${P.town} · No. ${P.num}`,
  foot: (P, s) => `Plowed ${s.path.length} of ${P.edges.length}`,
  frac: (P, s) => s.path.length / P.edges.length,
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: ${P.town}, ${P.edges.length} streets of snow`,
  gateLine: (P) => `Plow every street exactly once. Drive down one you have already plowed and you replay from the depot, with the clock still running. Leave by In and finish at the salt barn marked Out.${courtLine(P)}`,
  rules: (P) => ({
    lead: 'Plow every street once, then park at the salt barn.',
    steps: [
      <><b>Tap</b> or <b>drag</b> to the next corner along a snowy street (arrow keys pick the street pointing nearest that way). Every block you drive is plowed.</>,
      <>Diagonal and curved streets count like any other.{courtLine(P)}{riverLine(P)}</>,
      <>Drive down a street you have <b>already plowed</b> and it is a <b>replay</b>: the truck is back at the depot and the clock keeps running. <b>Replay</b> does the same any time you are stuck.</>,
      <>Leave the depot by <b>In</b>. The last street you plow ends at <b>Out</b>, the salt barn. You may pass Out on the way.</>,
    ],
    knack: 'Never take the last snowy street out of a part of town you have not finished. On a river day, count your bridges before you cross.',
    footer: 'A finished town ranks on fewest replays, then the clock. Giving up scores nothing.',
  }),
  pitch: (P) => `${P.edges.length} snowed-in streets in ${P.town}. Plow every one exactly once and park at the salt barn.`,
  shareLine: (P, s, won, el) => `Plow #${P.num} · ${P.town} · ${won ? `${el} · ${plural(s.replays || 0)}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${P.town} · ${P.edges.length} streets · ${plural(s.replays || 0)} · ${el}`,
  aboutTitle: 'About Plow',
  about: [
    'Plow is a free daily route puzzle from Mind Loft, the winter sibling of Mop and Mow. A town is drawn from above under fresh snow, with houses, parks, a school, a frozen pond and sometimes a river, and you drive a plow truck along its streets one block at a time. Every street has to be plowed exactly once, and the last one you plow ends at the salt barn.',
    'Drive down a street you have already plowed and the truck goes straight back to the depot for a replay, with the clock still running. The fastest clean town tops the daily board, and fewer replays break a tie.',
    'Monday is the easy day, a small town of about seventeen streets, and the town grows every day after it: curved roads from Wednesday, cul-de-sacs from Thursday, and from Friday a river that only the bridges cross, up to the Sunday Edition of more than fifty streets. Every town is built so that the depot and the salt barn are the only corners with an odd number of streets, which means a clean route always exists.',
    <>More route puzzles: <a href="/mow" style={{ color: 'inherit', fontWeight: 800 }}>Mow</a>, <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a> and <a href="/errands" style={{ color: 'inherit', fontWeight: 800 }}>Errands</a>.</>,
  ],
};

export default function PlowClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
