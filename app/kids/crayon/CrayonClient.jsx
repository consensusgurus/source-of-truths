'use client';

import { useState, useEffect, useRef, useCallback, createElement } from 'react';
import Link from 'next/link';
import Footer from '../../Footer';
import { KidsHeader, KIDS_CSS, Confetti } from '../KidsShell';
import { PICTURES, PICTURE_MAP, partCount } from './pictures';
import { saveMyPicture } from '../my-pictures';

// Crayon (/kids/crayon; owner, 2026-11-22). A kid picks a simple outline
// picture and colors it BY HAND (owner, 2026-11-22: no tap-to-fill): 12
// color families, each opening 8 shades (96 colors in the space of 20
// buttons), and two tools that both draw with a finger.
//   Crayon  the stroke is clipped to the part it began in, so it never goes
//           over the lines. Thin, Medium, Big or Huge.
//   Eraser  the same, in white, so it rubs color back out of that part.
// Old saves may carry whole-part `fills` (the first build had a Fill tool);
// they still draw.
// Undo, Redo and Start over. When the kid is done, the drawing is rendered to
// a 960 x 720 picture and saved to My Pictures (app/kids/my-pictures.js),
// which the kids Puzzle Shelf serves as a jigsaw. Not scored, nothing leaves
// the browser. Built for touch first: iPad landscape puts the palette beside
// the picture, phones and iPad portrait stack it below.

const INK = '#1b1f3b';
const FAMS = [
  { name: 'red', h: 0, s: 78 }, { name: 'orange', h: 26, s: 88 }, { name: 'yellow', h: 50, s: 92 }, { name: 'lime', h: 85, s: 62 },
  { name: 'green', h: 135, s: 52 }, { name: 'teal', h: 172, s: 58 }, { name: 'sky', h: 198, s: 76 }, { name: 'blue', h: 222, s: 76 },
  { name: 'purple', h: 265, s: 58 }, { name: 'pink', h: 322, s: 72 }, { name: 'brown', h: 26, s: 42 }, { name: 'gray', grey: true },
];
const LIGHT = [90, 80, 70, 60, 50, 40, 30, 20];
const GREY = [100, 88, 76, 62, 48, 34, 20, 6];
const shade = (f, i) => (f.grey ? `hsl(220, 6%, ${GREY[i]}%)` : `hsl(${f.h}, ${f.s}%, ${LIGHT[i]}%)`);
const famMid = (f) => (f.grey ? 'hsl(220, 6%, 48%)' : `hsl(${f.h}, ${f.s}%, 52%)`);
const SHADE_WORDS = ['palest', 'very light', 'light', 'soft', 'bright', 'deep', 'dark', 'darkest'];
const WIDTHS = [8, 18, 34, 60];
const SIZE_NAMES = ['Thin', 'Medium', 'Big', 'Huge'];
const DOTS = [8, 14, 22, 32];
const ERASE = '#ffffff';
const WORK_KEY = 'sot_kids_crayon_work';

function readWork() {
  try { const o = JSON.parse(localStorage.getItem(WORK_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
}
function writeWork(picId, fills, strokes) {
  try {
    const o = readWork();
    if (!Object.keys(fills).length && !strokes.length) delete o[picId];
    else o[picId] = { fills, strokes };
    localStorage.setItem(WORK_KEY, JSON.stringify(o));
  } catch (e) { /* a full store just means the work is not kept */ }
}

// The drawing. Each part paints its fill, then its crayon strokes clipped to
// it, then its own outline, in order, so a part in front covers the lines of
// the parts behind it. `idp` keeps the clip ids unique on the page.
function Drawing({ pic, fills = {}, strokes = [], idp, svgRef, live, handlers, label }) {
  return (
    <svg ref={svgRef} viewBox="0 0 400 360" className={live ? 'cr-svg live' : 'cr-svg'} role="img" aria-label={label || pic.name}
      {...(handlers || {})}>
      <defs>
        {pic.parts.map(([id, tag, a]) => <clipPath key={id} id={`${idp}-${id}`}>{createElement(tag, a)}</clipPath>)}
      </defs>
      {pic.parts.map(([id, tag, a]) => (
        <g key={id}>
          {createElement(tag, { ...a, 'data-r': id, fill: fills[id] || '#ffffff', stroke: 'none' })}
          {live || strokes.some((s) => s.r === id) ? (
            <g clipPath={`url(#${idp}-${id})`} style={{ pointerEvents: 'none' }}>
              {strokes.filter((s) => s.r === id).map((s, i) => (
                <path key={i} d={s.d} stroke={s.c} strokeWidth={s.w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>
          ) : null}
          {createElement(tag, { ...a, fill: 'none', stroke: INK, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round', style: { pointerEvents: 'none' } })}
        </g>
      ))}
      {pic.decor.map(([tag, a], i) => createElement(tag, a.fill === 'none'
        ? { key: `d${i}`, ...a, stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round', style: { pointerEvents: 'none' } }
        : { key: `d${i}`, ...a, fill: INK, style: { pointerEvents: 'none' } }))}
    </svg>
  );
}

// The finished drawing as a 960 x 720 JPEG: white, the drawing centred at
// 711 x 640, so the 3 x 2 jigsaw cut (which crops a 4:3 picture top and
// bottom) still holds the whole frame.
async function renderPicture(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '711');
  clone.setAttribute('height', '640');
  clone.removeAttribute('class');
  const str = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`; });
  const cv = document.createElement('canvas');
  cv.width = 960; cv.height = 720;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 960, 720);
  ctx.drawImage(img, (960 - 711) / 2, 40, 711, 640);
  return cv.toDataURL('image/jpeg', 0.9);
}

function Picker({ work, started = {}, onPick }) {
  return (
    <>
      <p className="cr-lede">Pick a picture to color. When you finish, it becomes your very own jigsaw on the <Link href="/kids/jigsaw">Puzzle Shelf</Link>.</p>
      <div className="cr-pics">
        <button type="button" className="cr-pic" onClick={() => onPick('draw')}>
          <span className="cr-thumb cr-drawthumb">
            <svg viewBox="0 0 400 360" className="cr-svg" role="img" aria-label="Draw your own picture">
              <rect x="2" y="2" width="396" height="356" rx="10" fill="#ffffff" stroke={INK} strokeWidth="4" />
              <path d="M70 250 Q110 150 170 200 T290 170" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
              <circle cx="300" cy="100" r="40" fill="hsl(50, 92%, 60%)" stroke={INK} strokeWidth="6" />
              <g transform="translate(230 225) rotate(-40)">
                <rect x="-14" y="-90" width="28" height="120" rx="4" fill="hsl(26, 88%, 60%)" stroke={INK} strokeWidth="5" />
                <path d="M-14 30 L0 62 L14 30 Z" fill="#f6d7a7" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
                <path d="M-4 52 L0 62 L4 52 Z" fill={INK} />
              </g>
            </svg>
            {started.draw ? <span className="cr-flag">Keep going</span> : null}
          </span>
          <span className="cr-pname"><b>Draw Your Own</b><span>Blank page</span></span>
        </button>
        {PICTURES.map((p) => {
          const w = work[p.id];
          const started = !!(w && (Object.keys(w.fills || {}).length || (w.strokes || []).length));
          return (
            <button key={p.id} type="button" className="cr-pic" onClick={() => onPick(p.id)}>
              <span className="cr-thumb" style={{ background: p.band }}>
                <Drawing pic={p} fills={w ? w.fills : {}} strokes={w ? w.strokes : []} idp={`th-${p.id}`} label={`${p.name} picture`} />
                {started ? <span className="cr-flag">Keep going</span> : null}
              </span>
              <span className="cr-pname"><b>{p.name}</b><span>{partCount(p)} parts</span></span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Colorer({ pic, onBack, onFinish }) {
  const saved = useRef(null);
  if (saved.current === null) {
    const w = typeof window === 'undefined' ? null : readWork()[pic.id];
    saved.current = { fills: (w && w.fills) || {}, strokes: (w && Array.isArray(w.strokes) ? w.strokes : []) };
  }
  const [fills, setFills] = useState(saved.current.fills);
  const [strokes, setStrokes] = useState(saved.current.strokes);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [fam, setFam] = useState(7);
  const [sel, setSel] = useState(shade(FAMS[7], 4));
  const [tool, setTool] = useState('brush');
  const [size, setSize] = useState(2);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef(null);
  const drawRef = useRef(null);
  const stateRef = useRef({ fills, strokes });
  stateRef.current = { fills, strokes };

  // Keep the work so a reload or a trip to another page does not lose it.
  useEffect(() => {
    const t = setTimeout(() => writeWork(pic.id, fills, strokes), 350);
    return () => clearTimeout(t);
  }, [fills, strokes, pic.id]);

  // iPad Safari can still start a scroll from inside the picture; while a
  // crayon stroke is live, claim every touchmove.
  useEffect(() => {
    const tm = (e) => { if (drawRef.current && e.cancelable) e.preventDefault(); };
    window.addEventListener('touchmove', tm, { passive: false });
    return () => window.removeEventListener('touchmove', tm);
  }, []);

  const commit = (nf, ns) => {
    setPast((p) => [...p, stateRef.current].slice(-80));
    setFuture([]);
    setFills(nf);
    setStrokes(ns);
  };

  const toPoint = (e) => {
    const svg = svgRef.current;
    const m = svg && svg.getScreenCTM();
    if (!m) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(m.inverse());
    return [Math.round(q.x * 10) / 10, Math.round(q.y * 10) / 10];
  };

  const onDown = (e) => {
    const r = e.target && e.target.getAttribute ? e.target.getAttribute('data-r') : null;
    if (!r) return;
    e.preventDefault();
    const { fills: f, strokes: s } = stateRef.current;
    const p = toPoint(e);
    if (!p) return;
    try { svgRef.current.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const d = `M${p[0]} ${p[1]} L${p[0] + 0.1} ${p[1] + 0.1}`;
    drawRef.current = { id: e.pointerId, d, last: p };
    commit(f, [...s, { r, c: tool === 'erase' ? ERASE : sel, w: WIDTHS[size], d }]);
  };
  const onMove = (e) => {
    const D = drawRef.current;
    if (!D || D.id !== e.pointerId) return;
    const p = toPoint(e);
    if (!p || Math.hypot(p[0] - D.last[0], p[1] - D.last[1]) < 2) return;
    D.last = p;
    D.d += ` L${p[0]} ${p[1]}`;
    const d = D.d;
    setStrokes((s) => { if (!s.length) return s; const n = s.slice(); n[n.length - 1] = { ...n[n.length - 1], d }; return n; });
  };
  const onUp = (e) => {
    if (drawRef.current && drawRef.current.id === e.pointerId) drawRef.current = null;
  };

  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [...f, stateRef.current]);
    const last = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFills(last.fills); setStrokes(last.strokes);
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, stateRef.current]);
    const next = future[future.length - 1];
    setFuture(future.slice(0, -1));
    setFills(next.fills); setStrokes(next.strokes);
  };
  const clear = () => { if (Object.keys(fills).length || strokes.length) commit({}, []); };

  const pickFam = (i) => { setFam(i); setSel(shade(FAMS[i], 4)); setTool('brush'); };
  const pickShade = (c) => { setSel(c); setTool('brush'); };

  const colored = pic.parts.filter(([id]) => (fills[id] && fills[id] !== ERASE) || strokes.some((s) => s.r === id && s.c !== ERASE)).length;
  const total = partCount(pic);
  const hint = tool === 'brush' ? 'Color with your finger. It stays inside the lines.' : 'Rub with your finger to erase';

  const finish = async () => {
    if (!colored || busy || !svgRef.current) return;
    setBusy(true);
    try {
      const src = await renderPicture(svgRef.current);
      const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
      const ok = saveMyPicture({ id, pic: pic.id, name: pic.name, at: Date.now(), src });
      writeWork(pic.id, {}, []);
      onFinish({ id, src, ok });
    } catch (e) {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="cr-bar">
        <button type="button" className="kd-btn" onClick={onBack}>Back to the pictures</button>
        <span className="cr-left">{colored} of {total} parts colored</span>
      </div>
      <div className="cr-play">
        <div className="kd-card cr-board">
          <p className="cr-hint">{hint}</p>
          <Drawing pic={pic} fills={fills} strokes={strokes} idp={`cr-${pic.id}`} svgRef={svgRef} live label={`${pic.name}: tap or draw to color`}
            handlers={{ onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp }} />
        </div>

        <ColorPanel tools={[['brush', 'Crayon'], ['erase', 'Eraser']]} tool={tool} setTool={setTool} size={size} setSize={setSize}
          fam={fam} sel={sel} pickFam={pickFam} pickShade={pickShade}
          undo={undo} redo={redo} clear={clear} canUndo={past.length > 0} canRedo={future.length > 0} canClear={colored > 0}
          finish={finish} canFinish={colored > 0} busy={busy} />
      </div>
    </>
  );
}

// The tools, sizes, palette and actions beside the picture; shared by the
// outline pictures and Draw your own.
function ColorPanel({ tools, tool, setTool, size, setSize, fam, sel, pickFam, pickShade, undo, redo, clear, canUndo, canRedo, canClear, finish, canFinish, busy }) {
  const f = FAMS[fam];
  return (
    <div className="cr-panel">
      <div className="cr-tools">
        <div className="cr-seg" role="radiogroup" aria-label="Tool" style={{ gridTemplateColumns: `repeat(${tools.length}, minmax(0, 1fr))` }}>
          {tools.map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={tool === k} className={tool === k ? 'on' : ''} onClick={() => setTool(k)}>{label}</button>
          ))}
        </div>
        <div className="cr-sizes" role="radiogroup" aria-label="Size">
          {WIDTHS.map((w, i) => (
            <button key={w} type="button" role="radio" aria-checked={size === i} aria-label={`${SIZE_NAMES[i]} ${tool === 'erase' ? 'eraser' : tool === 'pen' ? 'pencil' : 'crayon'}`} className={size === i ? 'on' : ''} onClick={() => setSize(i)}>
              <span style={{ width: DOTS[i], height: DOTS[i], background: tool === 'erase' ? '#ffffff' : tool === 'pen' ? INK : sel }} />
            </button>
          ))}
        </div>
      </div>

      <div className="cr-box">
        <span className="cr-lbl">1. Pick a color</span>
        <div className="cr-fams">
          {FAMS.map((fm, i) => (
            <button key={fm.name} type="button" aria-label={fm.name} aria-pressed={fam === i} className={fam === i ? 'on' : ''} style={{ background: famMid(fm) }} onClick={() => pickFam(i)} />
          ))}
        </div>
      </div>

      <div className="cr-box" style={{ background: f.grey ? '#f3f4f6' : `hsl(${f.h}, ${Math.min(f.s, 70)}%, 96%)` }}>
        <span className="cr-lbl">2. Pick a shade of {f.name}</span>
        <div className="cr-shades">
          {LIGHT.map((l, i) => {
            const c = shade(f, i);
            return <button key={i} type="button" aria-label={`${SHADE_WORDS[i]} ${f.name}`} aria-pressed={sel === c} className={sel === c ? 'on' : ''} style={{ background: c }} onClick={() => pickShade(c)} />;
          })}
        </div>
      </div>

      <div className="cr-acts">
        <button type="button" className="kd-btn" onClick={undo} disabled={!canUndo}>Undo</button>
        <button type="button" className="kd-btn" onClick={redo} disabled={!canRedo}>Redo</button>
        <button type="button" className="kd-btn" onClick={clear} disabled={!canClear}>Start over</button>
      </div>
      <button type="button" className="kd-btn pri cr-done" onClick={finish} disabled={!canFinish || busy}>{busy ? 'Making your puzzle...' : 'I’m done! Make my puzzle'}</button>
    </div>
  );
}

// Draw your own (owner, 2026-11-22: "have a spot where kids can draw their
// own image, color, and make a puzzle"). Two canvases at 800 x 720 (the
// pictures' 400 x 360 box at 2x): the LINE layer on top, the COLOR layer
// under it. The Pencil draws ink lines. The Crayon colors only the space the
// kid's own lines enclose: on touch-down it flood-fills the line layer from
// that point into a mask, and the stroke is drawn through the mask, the same
// stay-inside-the-lines rule as the outline pictures. With no closed shape
// the whole page is the space. The Eraser rubs out lines and color alike.
const DW = 800, DH = 720;
const PEN_WIDTHS = [5, 8, 13, 20];
const DRAW_KEY = 'sot_kids_crayon_draw';
const DRAW_PIC = { id: 'draw', name: 'My Drawing' };

// The pixels reachable from (x, y) without crossing a line pixel (alpha 128
// or more), grown 3px into the lines so color tucks under their soft edges.
function regionMask(lineData, x, y) {
  const a = lineData.data;
  const N = DW * DH;
  const wall = new Uint8Array(N);
  for (let i = 0; i < N; i++) wall[i] = a[i * 4 + 3] >= 128 ? 1 : 0;
  let sx = x, sy = y;
  if (wall[sy * DW + sx]) {
    // Started on a line: use the nearest open pixel.
    let found = false;
    for (let r = 1; r < 16 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r && !found; dx++) {
        const nx = sx + dx, ny = sy + dy;
        if (nx >= 0 && ny >= 0 && nx < DW && ny < DH && !wall[ny * DW + nx]) { sx = nx; sy = ny; found = true; }
      }
    }
    if (!found) return null;
  }
  const m = new Uint8Array(N);
  const stack = [sy * DW + sx];
  m[sy * DW + sx] = 1;
  while (stack.length) {
    const i = stack.pop();
    const px = i % DW;
    if (px > 0 && !m[i - 1] && !wall[i - 1]) { m[i - 1] = 1; stack.push(i - 1); }
    if (px < DW - 1 && !m[i + 1] && !wall[i + 1]) { m[i + 1] = 1; stack.push(i + 1); }
    if (i >= DW && !m[i - DW] && !wall[i - DW]) { m[i - DW] = 1; stack.push(i - DW); }
    if (i < N - DW && !m[i + DW] && !wall[i + DW]) { m[i + DW] = 1; stack.push(i + DW); }
  }
  for (let pass = 0; pass < 3; pass++) {
    const g = m.slice();
    for (let i = 0; i < N; i++) {
      if (m[i]) continue;
      const px = i % DW;
      if ((px > 0 && m[i - 1]) || (px < DW - 1 && m[i + 1]) || (i >= DW && m[i - DW]) || (i < N - DW && m[i + DW])) g[i] = 1;
    }
    m.set(g);
  }
  return m;
}

function DrawPad({ onBack, onFinish }) {
  const colorRef = useRef(null);
  const lineRef = useRef(null);
  const work = useRef(null); // offscreen canvases: stroke, mask, base, out
  const drawRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [size, setSize] = useState(1);
  const [fam, setFam] = useState(7);
  const [sel, setSel] = useState(shade(FAMS[7], 4));
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [inked, setInked] = useState(false);
  const [busy, setBusy] = useState(false);

  const mk = () => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; return c; };
  useEffect(() => {
    work.current = { stroke: mk(), mask: mk(), base: mk(), out: mk() };
    // Bring back the drawing in progress.
    try {
      const sv = JSON.parse(localStorage.getItem(DRAW_KEY) || 'null');
      if (sv && sv.c && sv.l) {
        let left = 2;
        const done = () => { if (--left === 0) setInked(true); };
        [[sv.c, colorRef], [sv.l, lineRef]].forEach(([url, ref]) => {
          const im = new Image();
          im.onload = () => { const cv = ref.current; if (cv) cv.getContext('2d').drawImage(im, 0, 0); done(); };
          im.src = url;
        });
      }
    } catch (e) { /* ignore */ }
    const tm = (e) => { if (drawRef.current && e.cancelable) e.preventDefault(); };
    window.addEventListener('touchmove', tm, { passive: false });
    return () => window.removeEventListener('touchmove', tm);
  }, []);

  const saveWork = () => {
    try {
      localStorage.setItem(DRAW_KEY, JSON.stringify({ c: colorRef.current.toDataURL('image/png'), l: lineRef.current.toDataURL('image/png') }));
    } catch (e) { /* a full store just means the drawing is not kept */ }
  };
  const snap = () => ({
    c: colorRef.current.getContext('2d').getImageData(0, 0, DW, DH),
    l: lineRef.current.getContext('2d').getImageData(0, 0, DW, DH),
  });
  const restore = (st) => {
    colorRef.current.getContext('2d').putImageData(st.c, 0, 0);
    lineRef.current.getContext('2d').putImageData(st.l, 0, 0);
  };
  const toPoint = (e) => {
    const r = colorRef.current.getBoundingClientRect();
    return [Math.max(0, Math.min(DW - 1, Math.round((e.clientX - r.left) * DW / r.width))), Math.max(0, Math.min(DH - 1, Math.round((e.clientY - r.top) * DH / r.height)))];
  };
  const line = (ctx, a, b, w, col) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w; ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1] + 0.01); ctx.stroke();
  };
  const composite = () => {
    const W = work.current, cctx = colorRef.current.getContext('2d');
    const o = W.out.getContext('2d');
    o.globalCompositeOperation = 'source-over';
    o.clearRect(0, 0, DW, DH);
    o.drawImage(W.stroke, 0, 0);
    o.globalCompositeOperation = 'destination-in';
    o.drawImage(W.mask, 0, 0);
    o.globalCompositeOperation = 'source-over';
    cctx.clearRect(0, 0, DW, DH);
    cctx.drawImage(W.base, 0, 0);
    cctx.drawImage(W.out, 0, 0);
  };

  const onDown = (e) => {
    if (!work.current) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    setPast((p) => [...p, snap()].slice(-25));
    setFuture([]);
    const p = toPoint(e);
    const D = { id: e.pointerId, last: p, tool };
    drawRef.current = D;
    if (tool === 'pen') {
      line(lineRef.current.getContext('2d'), p, p, PEN_WIDTHS[size], INK);
      setInked(true);
    } else if (tool === 'erase') {
      [colorRef, lineRef].forEach((r) => { const c = r.current.getContext('2d'); c.globalCompositeOperation = 'destination-out'; line(c, p, p, WIDTHS[size] * 2, '#000'); c.globalCompositeOperation = 'source-over'; });
    } else {
      const W = work.current;
      const mask = regionMask(lineRef.current.getContext('2d').getImageData(0, 0, DW, DH), p[0], p[1]);
      const mctx = W.mask.getContext('2d');
      if (mask) {
        const img = mctx.createImageData(DW, DH);
        for (let i = 0; i < mask.length; i++) if (mask[i]) img.data[i * 4 + 3] = 255;
        mctx.putImageData(img, 0, 0);
      } else { mctx.clearRect(0, 0, DW, DH); mctx.fillRect(0, 0, DW, DH); }
      const b = W.base.getContext('2d'); b.clearRect(0, 0, DW, DH); b.drawImage(colorRef.current, 0, 0);
      const s = W.stroke.getContext('2d'); s.clearRect(0, 0, DW, DH);
      line(s, p, p, WIDTHS[size] * 2, sel);
      composite();
      setInked(true);
    }
  };
  const onMove = (e) => {
    const D = drawRef.current;
    if (!D || D.id !== e.pointerId) return;
    const p = toPoint(e);
    if (Math.hypot(p[0] - D.last[0], p[1] - D.last[1]) < 2) return;
    if (D.tool === 'pen') line(lineRef.current.getContext('2d'), D.last, p, PEN_WIDTHS[size], INK);
    else if (D.tool === 'erase') {
      [colorRef, lineRef].forEach((r) => { const c = r.current.getContext('2d'); c.globalCompositeOperation = 'destination-out'; line(c, D.last, p, WIDTHS[size] * 2, '#000'); c.globalCompositeOperation = 'source-over'; });
    } else {
      line(work.current.stroke.getContext('2d'), D.last, p, WIDTHS[size] * 2, sel);
      composite();
    }
    D.last = p;
  };
  const onUp = (e) => {
    if (drawRef.current && drawRef.current.id === e.pointerId) { drawRef.current = null; saveWork(); }
  };

  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [...f, snap()]);
    restore(past[past.length - 1]);
    setPast(past.slice(0, -1));
    saveWork();
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, snap()]);
    restore(future[future.length - 1]);
    setFuture(future.slice(0, -1));
    saveWork();
  };
  const clear = () => {
    setPast((p) => [...p, snap()].slice(-25));
    setFuture([]);
    colorRef.current.getContext('2d').clearRect(0, 0, DW, DH);
    lineRef.current.getContext('2d').clearRect(0, 0, DW, DH);
    setInked(false);
    try { localStorage.removeItem(DRAW_KEY); } catch (e) { /* ignore */ }
  };
  const pickFam = (i) => { setFam(i); setSel(shade(FAMS[i], 4)); setTool('brush'); };
  const pickShade = (c) => { setSel(c); setTool('brush'); };

  const finish = async () => {
    if (!inked || busy) return;
    setBusy(true);
    try {
      const cv = document.createElement('canvas');
      cv.width = 960; cv.height = 720;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 960, 720);
      const x = (960 - 711) / 2, y = 40;
      ctx.drawImage(colorRef.current, x, y, 711, 640);
      ctx.drawImage(lineRef.current, x, y, 711, 640);
      ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.strokeRect(x, y, 711, 640);
      const src = cv.toDataURL('image/jpeg', 0.9);
      const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
      const ok = saveMyPicture({ id, pic: 'draw', name: DRAW_PIC.name, at: Date.now(), src });
      try { localStorage.removeItem(DRAW_KEY); } catch (e) { /* ignore */ }
      onFinish({ id, src, ok });
    } catch (e) { setBusy(false); }
  };

  const hint = tool === 'pen' ? 'Draw your picture with the pencil' : tool === 'brush' ? 'Color it in. The crayon stays inside your lines.' : 'Rub out lines or color';

  return (
    <>
      <div className="cr-bar">
        <button type="button" className="kd-btn" onClick={onBack}>Back to the pictures</button>
        <span className="cr-left">{inked ? 'Looking good!' : 'Start with the pencil'}</span>
      </div>
      <div className="cr-play">
        <div className="kd-card cr-board">
          <p className="cr-hint">{hint}</p>
          <div className="cr-pad" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            role="img" aria-label="Drawing page: draw with the pencil, then color with the crayon">
            <canvas ref={colorRef} width={DW} height={DH} />
            <canvas ref={lineRef} width={DW} height={DH} />
          </div>
        </div>
        <ColorPanel tools={[['pen', 'Pencil'], ['brush', 'Crayon'], ['erase', 'Eraser']]} tool={tool} setTool={setTool} size={size} setSize={setSize}
          fam={fam} sel={sel} pickFam={pickFam} pickShade={pickShade}
          undo={undo} redo={redo} clear={clear} canUndo={past.length > 0} canRedo={future.length > 0} canClear={inked}
          finish={finish} canFinish={inked} busy={busy} />
      </div>
    </>
  );
}

function Finished({ result, pic, onAgain }) {
  return (
    <div className="kd-card cr-fin">
      <img src={result.src} alt={`Your colored ${pic.name}`} className="cr-finimg" />
      <div className="cr-fintext">
        <h2>Your picture is now a puzzle!</h2>
        {result.ok ? (
          <p>{pic.name} is on your Puzzle Shelf under My Pictures. How many pieces?</p>
        ) : (
          <p>This device is out of room to keep pictures, so this one is not saved. It can still be played right now.</p>
        )}
        <div className="cr-counts">
          {[6, 12, 20, 30].map((n) => (
            <Link key={n} className="cr-count" href={`/kids/jigsaw?pic=my-${result.id}&n=${n}`}><b>{n}</b><span>{n === 6 ? 'Easy' : n === 12 ? 'Medium' : n === 20 ? 'Hard' : 'Super'}</span></Link>
          ))}
        </div>
        <div className="cr-acts">
          <button type="button" className="kd-btn" onClick={onAgain}>Color another picture</button>
          <Link className="kd-btn" href="/kids/jigsaw">Open the Puzzle Shelf</Link>
        </div>
      </div>
    </div>
  );
}

const CR_CSS = `
.cr-lede{font-size:17px;color:var(--kink2);margin:0 0 16px;max-width:60ch}
.cr-lede a{color:var(--kblue);font-weight:700}
.cr-pics{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.cr-pic{display:flex;flex-direction:column;padding:0;border:2px solid var(--kline);border-radius:22px;background:var(--kpaper);overflow:hidden;box-shadow:var(--kshadow);cursor:pointer;text-align:left;transition:transform .15s,border-color .15s;font:inherit;color:inherit}
.cr-pic:hover,.cr-pic:focus-visible{transform:translateY(-3px);border-color:var(--kink)}
.cr-thumb{position:relative;display:flex;align-items:center;justify-content:center;padding:14px}
.cr-thumb .cr-svg{width:100%;height:auto;max-width:220px}
.cr-flag{position:absolute;top:10px;left:10px;font-family:var(--kdisp);font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:var(--kink);color:#fff}
.cr-pname{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:12px 15px 14px}
.cr-pname b{font-family:var(--kdisp);font-size:19px;font-weight:700}
.cr-pname span{font-size:13px;font-weight:700;color:var(--kink2)}
.cr-svg{display:block}
.cr-svg.live{width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:crosshair}
.cr-drawthumb{background:#fdeaea}
.cr-pad{position:relative;width:100%;aspect-ratio:10/9;border:4px solid var(--kink);border-radius:12px;overflow:hidden;background:#fff;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:crosshair}
.cr-pad canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.cr-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 14px}
.cr-left{font-family:var(--kdisp);font-weight:600;color:var(--kink2);margin-left:auto}
.cr-play{display:flex;flex-direction:column;gap:16px;margin-bottom:28px}
.cr-board{padding:14px}
.cr-hint{margin:0 0 8px;font-family:var(--kdisp);font-weight:600;font-size:15px;color:var(--kink2)}
.cr-panel{display:flex;flex-direction:column;gap:12px;min-width:0}
.cr-tools{display:flex;gap:8px;align-items:stretch}
.cr-seg{flex:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:2px solid var(--kink);border-radius:16px;overflow:hidden;min-height:54px}
.cr-seg button{border:0;border-radius:0;background:var(--kpaper);color:var(--kink);font-family:var(--kdisp);font-weight:700;font-size:16px;cursor:pointer;padding:0 6px}
.cr-seg button+button{border-left:2px solid var(--kink)}
.cr-seg button.on{background:var(--kink);color:#fff}
.cr-sizes{display:flex;gap:6px}
.cr-sizes button{width:54px;border:2px solid var(--kline);border-radius:16px;background:var(--kpaper);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.cr-sizes button.on{border-color:var(--kink);border-width:3px}
.cr-sizes span{display:block;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(27,31,59,.3)}
.cr-box{background:var(--kpaper);border:2px solid var(--kline);border-radius:20px;padding:12px;display:flex;flex-direction:column;gap:9px}
.cr-lbl{font-family:var(--kdisp);font-weight:700;font-size:15px}
.cr-fams,.cr-shades{display:grid;gap:7px}
.cr-fams{grid-template-columns:repeat(6,minmax(0,1fr))}
.cr-shades{grid-template-columns:repeat(8,minmax(0,1fr))}
.cr-fams button,.cr-shades button{height:52px;border-radius:14px;border:1px solid rgba(27,31,59,.22);cursor:pointer;padding:0;transition:transform .08s}
.cr-fams button:active,.cr-shades button:active{transform:scale(.94)}
.cr-fams button.on,.cr-shades button.on{border:3px solid var(--kink);box-shadow:inset 0 0 0 3px #fff}
.cr-acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.cr-acts .kd-btn{min-height:48px;padding:8px 10px;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center}
.cr-done{min-height:56px;font-size:17px;margin-bottom:6px}
.cr-fin{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:center}
.cr-finimg{width:100%;height:auto;border-radius:16px;border:2px solid var(--kline);display:block}
.cr-fintext h2{font-size:clamp(26px,4vw,34px);font-weight:700;margin:0 0 8px}
.cr-fintext p{color:var(--kink2);font-size:16px;margin:0 0 14px}
.cr-counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 14px}
.cr-count{display:flex;flex-direction:column;align-items:center;padding:10px 6px;border:2.5px solid var(--kline);border-radius:16px;background:#fff;color:var(--kink);text-decoration:none;box-shadow:0 4px 0 #e9d9ad;line-height:1.15;transition:transform .12s,border-color .12s}
.cr-count:hover,.cr-count:focus-visible{border-color:var(--kink);transform:translateY(-2px)}
.cr-count:active{transform:translateY(2px);box-shadow:0 1px 0 #e9d9ad}
.cr-count b{font-family:var(--kdisp);font-size:26px;font-weight:700}
.cr-count span{font-size:12px;font-weight:700;color:var(--kink2)}
.cr-fin .cr-acts{grid-template-columns:repeat(2,minmax(0,1fr))}
.cr-howh{font-size:17px;font-weight:700;margin:12px 0 0;padding-top:16px;border-top:2px solid var(--kline);color:var(--kink2)}
.cr-how{max-width:62ch}
.cr-emma{text-align:center;font-family:var(--kdisp);font-weight:600;font-size:15px;color:var(--kink2);margin:18px 0 0}
/* iPad landscape and desktop: the palette sits beside the picture. */
@media (min-width:900px){
  .cr-play{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start}
  .cr-fams{grid-template-columns:repeat(4,minmax(0,1fr))}
  .cr-shades{grid-template-columns:repeat(4,minmax(0,1fr))}
  .cr-fams button,.cr-shades button{height:54px}
  .cr-fin{grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)}
}
@media (max-width:520px){
  .cr-fams button{height:46px}
  .cr-shades button{height:46px;border-radius:10px}
  .cr-shades{gap:5px}
  .cr-seg{min-height:48px}
  .cr-sizes button{width:48px}
}
`;

export default function CrayonClient() {
  const [view, setView] = useState('pick');
  const [picId, setPicId] = useState(null);
  const [work, setWork] = useState({});
  const [result, setResult] = useState(null);
  const [cheer, setCheer] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasDraw, setHasDraw] = useState(false);

  useEffect(() => {
    setWork(readWork());
    try { setHasDraw(!!localStorage.getItem(DRAW_KEY)); } catch (e) { /* ignore */ }
    try {
      const q = new URLSearchParams(window.location.search).get('pic');
      if (q && (PICTURE_MAP[q] || q === 'draw')) { setPicId(q); setView('color'); }
    } catch (e) { /* ignore */ }
    setReady(true);
    fetch('/api/quiz/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: 'kids-crayon' }) }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      const u = new URL(window.location.href);
      if (view === 'color' && picId) u.searchParams.set('pic', picId); else u.searchParams.delete('pic');
      window.history.replaceState(null, '', u.pathname + u.search);
    } catch (e) { /* ignore */ }
  }, [view, picId, ready]);

  const top = () => { try { window.scrollTo({ top: 0 }); } catch (e) { /* ignore */ } };
  const pick = (id) => { setPicId(id); setResult(null); setView('color'); top(); };
  const back = useCallback(() => {
    setWork(readWork());
    try { setHasDraw(!!localStorage.getItem(DRAW_KEY)); } catch (e) { /* ignore */ }
    setView('pick'); top();
  }, []);
  const onFinish = useCallback((r) => { setResult(r); setView('done'); setCheer((c) => c + 1); top(); }, []);
  const pic = picId === 'draw' ? DRAW_PIC : picId ? PICTURE_MAP[picId] : null;

  const sub = view === 'pick' ? `${PICTURES.length} pictures or your own · 96 colors` : view === 'done' ? 'All done!' : pic ? pic.name : '';

  return (
    <div className="kd">
      <style dangerouslySetInnerHTML={{ __html: KIDS_CSS + CR_CSS }} />
      <div className="kd-wrap">
        <KidsHeader active="today" />
        <div className="kd-title">
          <h1>Crayon</h1>
          <span className="kd-sub">{sub}</span>
        </div>
        {view === 'color' && pic && pic.id === 'draw' ? (
          <DrawPad onBack={back} onFinish={onFinish} />
        ) : view === 'color' && pic ? (
          <Colorer key={pic.id} pic={pic} onBack={back} onFinish={onFinish} />
        ) : view === 'done' && pic && result ? (
          <Finished result={result} pic={pic} onAgain={back} />
        ) : (
          <Picker work={work} started={{ draw: hasDraw }} onPick={pick} />
        )}

        <h2 className="cr-howh">How to play</h2>
        <p className="kd-how cr-how">Pick a picture, or Draw Your Own to start with a blank page and the pencil. Then pick a color and a shade. Color with your finger: the crayon stays inside the lines of the part you start in, so color right up to the edge. Pick a bigger crayon for big spaces like the sky. The Eraser rubs color back out. Made a mistake? Tap Undo. When you are done, your picture becomes your own jigsaw puzzle on the Puzzle Shelf.</p>

        <div className="kd-foot">
          <span>Mind Loft Kids · free, no sign-up, no ads. Your pictures stay on this device.</span>
          <span><Link href="/kids/jigsaw">Puzzle Shelf</Link></span>
        </div>
        <p className="cr-emma">Built by Emma</p>
      </div>
      <Footer />
      <Confetti go={cheer} word="WOW!" />
    </div>
  );
}
