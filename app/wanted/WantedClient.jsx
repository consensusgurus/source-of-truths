'use client';

// Wanted: the daily hidden picture hunt. One crowd scene a day (a fairground, a
// beach, a harbor...) with about 1,200 little figures, and a list of things to
// find in it: Otis, his friend Mabel, his dog Biscuit, lost things, odd scenes
// and one-of-a-kind people.
//
// HISTORY, one evening (owner, 2026-11-26). It launched as one sixteen district
// board the whole site hunted together, scored like Search. An hour later:
// "I think we should pull wanted and make each day a different scene. Quicker
// resolve", then "Not community. Scored by time to completion". So it is an
// ordinary daily now: your own scene, find everything, and the clock ranks it.
// No crowd, no split pots, no /api/wanted.
//
// SCORING. Solve or not, and SOLVE_ONLY in lib/daily-games.js: a finished hunt
// posts 10 of 10 and ranks on the clock; a give-up posts 0. A wrong tap costs
// nothing (the clock is the cost), and tapping an Otis lookalike says what is
// wrong with him.
//
// THE SCENE IS DRAWN HERE, NOT DOWNLOADED. lib/wanted-engine.js builds it from
// the day's seed and this board paints it as vectors, in square tiles, at the
// device's own density for whatever zoom the player is at (owner: "make the
// drawings a bit sharper"). Runs on the shared stage shell (app/SimpleDaily.jsx).

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import SimpleDaily from '../SimpleDaily';
import { wantedBuild, wantedDraw, wantedHit, wantedIcon, wantedDistrictName } from '@/lib/wanted-engine';

const TILE = 512;
const ORDER = { cast: 0, one: 1, lost: 2, scene: 3 };
const placeOf = (P) => wantedDistrictName(P.districts[0]);

const CSS = `
.wnt{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);}
.wnt-vp{position:relative;width:100%;max-width:1180px;height:min(62dvh,720px);min-height:300px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:12px;overflow:hidden;background:#e9e4d6;line-height:0;}
@media (min-width:900px){.wnt-vp{height:max(380px,calc(100dvh - 400px));}}
.wnt-vp canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;}
.wnt-wait{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:20px;text-align:center;line-height:1.4;background:var(--pst-cell,#eef1f6);color:#0b0f1a;}
.wnt-wait b{font-size:22px;font-weight:800;}
.wnt-wait span{font-size:14px;font-weight:700;opacity:.7;}
.wnt .wnt-zoom{position:absolute;left:10px;bottom:10px;display:flex;border:1px solid #0b0f1a;border-radius:999px;background:#ffffff;overflow:hidden;line-height:1;}
.wnt .wnt-zoom button{-webkit-appearance:none;appearance:none;margin:0;border:0;border-radius:0 !important;background:transparent;color:#0b0f1a;font:inherit;font-size:15px;font-weight:800;line-height:1;height:40px;min-width:44px;padding:0 12px;cursor:pointer;}
.wnt .wnt-zoom button + button{border-left:1px solid #0b0f1a;}
.wnt-say{margin:0;min-height:20px;font-size:14px;font-weight:700;line-height:1.4;text-align:center;}
.wnt-look{display:flex;align-items:center;gap:10px;width:100%;max-width:560px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:12px;padding:7px 10px;text-align:left;}
.wnt-look .tx{flex:1;min-width:0;}
.wnt-look .k{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.65;line-height:1.3;}
.wnt-look .n{font-size:15px;font-weight:800;line-height:1.25;}
.wnt-look .d{font-size:12.5px;font-weight:600;line-height:1.35;opacity:.8;}
.wnt-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;width:100%;max-width:1180px;}
.wnt .wnt-it{display:flex;align-items:center;gap:8px;margin:0;border:1px solid var(--pst-ink,#0b0f1a);border-radius:10px !important;background:transparent;color:inherit;padding:5px 8px 5px 5px;font:inherit;font-size:13px;font-weight:800;line-height:1.25;text-align:left;cursor:pointer;min-width:0;}
.wnt .wnt-it.on{background:var(--pst-acc,#fca5a5);color:#0b0f1a;}
.wnt .wnt-it.got{opacity:.55;}
.wnt .wnt-it.got span{text-decoration:line-through;}
.wnt .wnt-it em{margin-left:auto;font-style:normal;font-size:11.5px;font-weight:800;white-space:nowrap;padding-left:4px;}
.wnt-it span{min-width:0;overflow:hidden;text-overflow:ellipsis;}
.wnt-pic{flex:none;border-radius:7px;background:#cfe6bd;display:block;}
@media (max-width:899px){.pst:has(.wnt) .pst-col{padding-left:6px;padding-right:6px;gap:10px;}.wnt-list{grid-template-columns:1fr 1fr;}.wnt{gap:8px;}}
`;

// A list portrait, drawn by the same code that draws the scene.
function Portrait({ t, size = 34, board }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !t) return;
    const d = Math.min(3, window.devicePixelRatio || 1), w = size, h = size;
    c.width = w * d; c.height = h * d;
    const g = c.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h - 2); g.scale(size / 38, size / 38);
    const drew = wantedIcon(g, t);
    g.restore();
    if (!drew && board) {
      // An odd scene has no portrait of its own: show the scene itself, cut out of the page.
      const b = t.box, bw = b[2] - b[0] + 8, bh = b[3] - b[1] + 8, k = Math.min(w / bw, h / bh);
      g.save(); g.translate(w / 2, h / 2); g.scale(k, k); g.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2);
      wantedDraw(board, g, b[0] - 4 - w / k, b[1] - 4 - h / k, b[2] + 4 + w / k, b[3] + 4 + h / k, 1);
      g.restore();
    }
  }, [t, size, board]);
  return <canvas ref={ref} className="wnt-pic" style={{ width: size, height: size }} aria-hidden="true" />;
}

function Board({ P, s, setS, active, done }) {
  const found = s.found || [];
  const show = active || done;
  const board = useMemo(() => { try { return wantedBuild(P); } catch (e) { return null; } }, [P]);
  const T = board ? board.targets : [];
  const list = useMemo(() => T.slice().sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.id - b.id), [T]);
  const [want, setWant] = useState(null);
  const [say, setSay] = useState('');
  const vpRef = useRef(null), cvRef = useRef(null);
  const view = useRef({ z: 0, ox: 0, oy: 0 });
  const tiles = useRef(new Map());
  const frame = useRef(0), raf = useRef(0);
  const ptrs = useRef(new Map()), gesture = useRef(null);
  const pulse = useRef(null), ripple = useRef(null);
  const live = useRef({});
  live.current = { found, show, done, active, board };

  const wantT = want != null && !found.includes(want) ? T[want] : (list.find((t) => !found.includes(t.id)) || null);

  function renderTile(k, ix, iy) {
    const L = Math.pow(2, k), tw = TILE / L;
    const c = document.createElement('canvas'); c.width = TILE; c.height = TILE;
    const g = c.getContext('2d');
    g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, TILE, TILE);
    g.scale(L, L); g.translate(-ix * tw, -iy * tw);
    g.beginPath(); g.rect(0, 0, board.W, board.H); g.clip();
    wantedDraw(board, g, ix * tw, iy * tw, (ix + 1) * tw, (iy + 1) * tw, L >= 0.5 ? 1 : 0);
    return c;
  }
  const zMin = () => { const st = vpRef.current; return st && board ? Math.min(st.clientWidth / board.W, st.clientHeight / board.H) : 0.2; };
  function clamp() {
    const st = vpRef.current; if (!st || !board) return;
    const v = view.current, W = st.clientWidth, H = st.clientHeight;
    v.z = Math.max(zMin(), Math.min(3.2, v.z));
    const bw = board.W * v.z, bh = board.H * v.z;
    v.ox = bw <= W ? (W - bw) / 2 : Math.min(0, Math.max(W - bw, v.ox));
    v.oy = bh <= H ? (H - bh) / 2 : Math.min(0, Math.max(H - bh, v.oy));
  }
  const draw = useCallback(() => {
    raf.current = 0;
    const cv = cvRef.current, st = vpRef.current, L = live.current;
    if (!cv || !st || !L.board || !L.show) return;
    const b = L.board, dpr = Math.min(3, window.devicePixelRatio || 1), W = st.clientWidth, H = st.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#e9e4d6'; ctx.fillRect(0, 0, W, H);
    const v = view.current;
    const k = Math.max(-3, Math.min(3, Math.ceil(Math.log2(v.z * dpr) - 0.02)));
    const tw = TILE / Math.pow(2, k);
    const wx0 = -v.ox / v.z, wy0 = -v.oy / v.z, wx1 = wx0 + W / v.z, wy1 = wy0 + H / v.z;
    const ix0 = Math.max(0, Math.floor(wx0 / tw)), ix1 = Math.min(Math.ceil(b.W / tw) - 1, Math.floor(wx1 / tw));
    const iy0 = Math.max(0, Math.floor(wy0 / tw)), iy1 = Math.min(Math.ceil(b.H / tw) - 1, Math.floor(wy1 / tw));
    const f = ++frame.current, need = [], cxm = (wx0 + wx1) / 2, cym = (wy0 + wy1) / 2;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) {
      const sx = Math.floor(ix * tw * v.z + v.ox), sy = Math.floor(iy * tw * v.z + v.oy), ss = Math.ceil(tw * v.z) + 1;
      const t = tiles.current.get(`${k}:${ix}:${iy}`);
      if (t) { t.used = f; ctx.drawImage(t.c, sx, sy, ss, ss); continue; }
      for (let kk = k - 1; kk >= Math.max(-3, k - 5); kk--) {
        const q = Math.pow(2, k - kk), pt = tiles.current.get(`${kk}:${Math.floor(ix / q)}:${Math.floor(iy / q)}`);
        if (pt) { pt.used = f; const sub = TILE / q; ctx.drawImage(pt.c, (ix % q) * sub, (iy % q) * sub, sub, sub, sx, sy, ss, ss); break; }
      }
      const dx = (ix + 0.5) * tw - cxm, dy = (iy + 0.5) * tw - cym;
      need.push([dx * dx + dy * dy, ix, iy]);
    }
    // found: a red ring, like a pen on the page. On a finished board, what was missed gets a white one.
    const now = performance.now();
    const ring = (t, col, grow) => {
      const bx = t.box, cx = (bx[0] + bx[2]) / 2 * v.z + v.ox, cy = (bx[1] + bx[3]) / 2 * v.z + v.oy;
      const rx = Math.max(13, (bx[2] - bx[0]) / 2 * v.z + 6) * grow, ry = Math.max(13, (bx[3] - bx[1]) / 2 * v.z + 6) * grow;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -0.08, 0, 7);
      ctx.strokeStyle = col === '#ffffff' ? '#0b0f1a' : '#ffffff'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
    };
    for (const t of b.targets) {
      if (L.found.includes(t.id)) { let grow = 1; if (pulse.current && pulse.current.i === t.id) { const a = (now - pulse.current.t) / 520; grow = a < 1 ? 1.5 - 0.5 * a : 1; } ring(t, '#d22b2b', grow); }
      else if (L.done) ring(t, '#ffffff', 1);
    }
    let again = !!(pulse.current && now - pulse.current.t < 520);
    if (ripple.current) {
      const a = (now - ripple.current.t) / 420;
      if (a < 1) { ctx.beginPath(); ctx.arc(ripple.current.x, ripple.current.y, 6 + a * 16, 0, 7); ctx.strokeStyle = `rgba(31,29,26,${1 - a})`; ctx.lineWidth = 2; ctx.stroke(); again = true; } else ripple.current = null;
    }
    if (need.length) {
      need.sort((a, c) => a[0] - c[0]);
      const t0 = performance.now(); let made = 0;
      for (const n of need) {
        if (made && performance.now() - t0 > 12) break;
        tiles.current.set(`${k}:${n[1]}:${n[2]}`, { c: renderTile(k, n[1], n[2]), used: f });
        made++;
      }
      again = true;
      const cap = window.innerWidth < 720 ? 40 : 80;
      if (tiles.current.size > cap) {
        const old = [...tiles.current.entries()].filter(([, t]) => t.used < f - 1).sort((a, c) => a[1].used - c[1].used);
        for (let i = 0; i < old.length && tiles.current.size > cap * 0.8; i++) tiles.current.delete(old[i][0]);
      }
    }
    if (again) raf.current = requestAnimationFrame(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);
  const redraw = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(draw); }, [draw]);

  function fit() { view.current.z = zMin(); clamp(); redraw(); }
  function zoomAt(fz, x, y) {
    const v = view.current, wx = (x - v.ox) / v.z, wy = (y - v.oy) / v.z;
    v.z *= fz; clamp();
    v.ox = x - wx * v.z; v.oy = y - wy * v.z; clamp(); redraw();
  }
  function zoomBtn(fz) { const st = vpRef.current; if (st) zoomAt(fz, st.clientWidth / 2, st.clientHeight / 2); }
  function showTarget(t) {
    const st = vpRef.current; if (!st) return;
    const v = view.current, bx = t.box;
    v.z = Math.max(v.z, 1.3); clamp();
    v.ox = st.clientWidth / 2 - ((bx[0] + bx[2]) / 2) * v.z; v.oy = st.clientHeight / 2 - ((bx[1] + bx[3]) / 2) * v.z;
    clamp(); redraw();
  }

  useEffect(() => {
    if (!show || !board) return undefined;
    const st = vpRef.current; if (!st) return undefined;
    tiles.current = new Map();
    // Open filling the window, close enough to read the figures (drag to see
    // the rest); Fit shows the whole scene.
    const v = view.current;
    if (!v.z) { v.z = Math.max(st.clientWidth / board.W, st.clientHeight / board.H, 0.7); v.ox = (st.clientWidth - board.W * v.z) / 2; v.oy = 0; }
    clamp(); redraw();
    const ro = new ResizeObserver(() => { clamp(); redraw(); });
    ro.observe(st);
    const cv = cvRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = cv.getBoundingClientRect(), unit = e.deltaMode === 1 ? 16 : 1;
      zoomAt(Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX - rect.left, e.clientY - rect.top);
    };
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => { ro.disconnect(); cv.removeEventListener('wheel', onWheel); if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, board]);
  useEffect(() => { redraw(); }, [found.length, done, redraw]);

  function tapAt(x, y) {
    const L = live.current; if (!L.active || !board) return;
    const v = view.current;
    const hit = wantedHit(board, (x - v.ox) / v.z, (y - v.oy) / v.z, Math.max(2, 10 / v.z));
    ripple.current = { x, y, t: performance.now() };
    if (!hit) { redraw(); return; }
    if (hit.why) { setSay(`Close. Not Otis: ${hit.why}.`); redraw(); return; }
    const t = hit.t;
    if (L.found.includes(t.id)) { setSay(`${t.name}: already found.`); redraw(); return; }
    ripple.current = null;
    pulse.current = { i: t.id, t: performance.now() };
    const left = T.length - L.found.length - 1;
    setSay(left ? `${t.name}. ${left} to go.` : `${t.name}. That is everything.`);
    setS((st) => ((st.found || []).includes(t.id) ? st : { ...st, found: [...(st.found || []), t.id] }));
  }
  const local = (e) => { const r = cvRef.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function onDown(e) {
    const [x, y] = local(e);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    ptrs.current.set(e.pointerId, { x, y });
    if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; gesture.current = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }; return; }
    if (ptrs.current.size > 2) return;
    gesture.current = { kind: 'maybe', x, y };
  }
  function onMove(e) {
    const p = ptrs.current.get(e.pointerId), g = gesture.current; if (!p || !g) return;
    const [x, y] = local(e);
    if (g.kind === 'pinch') {
      p.x = x; p.y = y;
      const [a, b] = [...ptrs.current.values()]; if (!b) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      view.current.ox += cx - g.cx; view.current.oy += cy - g.cy;
      if (g.d > 0) zoomAt(d / g.d, cx, cy);
      g.d = d; g.cx = cx; g.cy = cy; clamp(); redraw();
      return;
    }
    if (g.kind === 'maybe' && Math.hypot(x - g.x, y - g.y) > 8) g.kind = 'pan';
    if (g.kind === 'pan') { view.current.ox += x - p.x; view.current.oy += y - p.y; clamp(); redraw(); }
    p.x = x; p.y = y;
  }
  function onUp(e) {
    const p = ptrs.current.get(e.pointerId), g = gesture.current;
    ptrs.current.delete(e.pointerId);
    if (!p || !g) return;
    if (g.kind === 'pinch') { gesture.current = ptrs.current.size ? { kind: 'pan' } : null; return; }
    gesture.current = null;
    if (g.kind === 'maybe') tapAt(g.x, g.y);
  }
  function onCancel(e) { ptrs.current.delete(e.pointerId); gesture.current = null; }

  return (
    <div className="wnt">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wnt-vp" ref={vpRef}>
        {show && board ? (
          <>
            <canvas ref={cvRef} aria-label={`A crowd scene at the ${placeOf(P).toLowerCase()} with ${T.length} things to find`}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel} onContextMenu={(e) => e.preventDefault()} />
            <div className="wnt-zoom" role="group" aria-label="Zoom">
              <button type="button" onClick={() => zoomBtn(1 / 1.5)} aria-label="Zoom out">&minus;</button>
              <button type="button" onClick={fit} aria-label="Show the whole scene">Fit</button>
              <button type="button" onClick={() => zoomBtn(1.5)} aria-label="Zoom in">+</button>
            </div>
          </>
        ) : (
          <div className="wnt-wait"><b>{board ? `Today: the ${placeOf(P).toLowerCase()}` : 'Loading Wanted'}</b><span>{board ? 'The scene appears the moment you press Start.' : 'Drawing the crowd...'}</span></div>
        )}
      </div>
      {active ? <p className="wnt-say" aria-live="polite">{say || 'Drag to move, pinch or scroll to zoom, and tap what you find.'}</p> : null}
      {active && wantT ? (
        <div className="wnt-look">
          <Portrait t={wantT} size={44} board={board} />
          <div className="tx"><div className="k">Looking for</div><div className="n">{wantT.name}</div><div className="d">{wantT.hint}</div></div>
        </div>
      ) : null}
      {show ? (
        <div className="wnt-list" aria-label="The wanted list">
          {list.map((t) => {
            const got = found.includes(t.id);
            return (
              <button type="button" key={t.id} className={'wnt-it' + (got ? ' got' : '') + (active && wantT && wantT.id === t.id ? ' on' : '')}
                onClick={() => { if (got || done) showTarget(t); else setWant(t.id); }}>
                <Portrait t={t} size={34} board={board} />
                <span>{t.name}</span>
                {done ? <em>{got ? 'Found' : 'Missed'}</em> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const nOf = (P) => P.n;
const GAME = {
  key: 'wanted', name: 'Wanted', cat: 'Visual', miss: null, wide: true, big: true,
  fresh: () => ({ found: [] }),
  validSave: (P, s) => !!s && Array.isArray(s.found) && s.found.length <= P.n && s.found.every((i) => Number.isInteger(i) && i >= 0 && i < P.n),
  touched: (s) => (s.found || []).length > 0,
  solved: (P, s) => (s.found || []).length >= P.n,
  count: () => 0,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: 0 }),
  Board,
  eyebrow: (P) => `The ${placeOf(P).toLowerCase()} · No. ${P.num}`,
  foot: (P, s) => `${(s.found || []).length} of ${nOf(P)} found`,
  frac: (P, s) => Math.min(1, (s.found || []).length / nOf(P)),
  giveUpLabel: 'Tap again to give up',
  gateTitle: (P) => `Today: the ${placeOf(P).toLowerCase()}`,
  gateLine: (P) => `One crowded scene and ${nOf(P)} things to find in it: Otis in his green cap and orange scarf, his friend Mabel, his dog Biscuit, and the rest of the list. Find them all. The clock is your score, and it starts the moment you press Start.`,
  rules: (P) => ({
    lead: 'Find everything on the list, as fast as you can.',
    banner: 'Everyone gets the same scene today.',
    steps: [
      <>Somewhere in the crowd are <b>Otis</b> (green cap, orange scarf, mustache), his friend <b>Mabel</b>, his dog <b>Biscuit</b>, a few <b>lost things</b>, some <b>odd scenes</b>, and a couple of <b>one-of-a-kind people</b>: {nOf(P)} in all. <b>Tap</b> each one you find and a red ring marks it.</>,
      <><b>Drag</b> to move around, and <b>pinch, scroll, or use the buttons</b> to zoom. The drawings stay sharp however close you get.</>,
      <>The <b>list</b> under the scene shows what is left. Tap one for its hint. Plenty of people look almost like Otis: tap one and you are told what is wrong with him.</>,
      <>A wrong tap costs nothing but time.</>,
    ],
    knack: 'Do the big odd scenes first while the scene is zoomed out, then zoom in and sweep it in strips for the people and the small lost things.',
    footer: 'A finished hunt ranks on the clock. Give up and the scene shows you what you missed.',
  }),
  pitch: (P) => `one crowd at the ${placeOf(P).toLowerCase()}, ${nOf(P)} things to find. How fast can you find them all?`,
  shareLine: (P, s, won, el) => `Wanted #${P.num} · The ${placeOf(P).toLowerCase()} · ${won ? `all ${nOf(P)} found in ${el}` : `${(s.found || []).length} of ${nOf(P)} found`}`,
  detail: (P, s, won, el) => `The ${placeOf(P).toLowerCase()} · ${(s.found || []).length} of ${nOf(P)} found · ${el}`,
  aboutTitle: 'About Wanted',
  about: [
    'Wanted is a free daily hidden picture puzzle from Mind Loft, a seek-and-find in the spirit of Where’s Waldo. Every day brings one new crowd scene, a fairground, a beach, a harbor, a ski slope, a castle, with more than a thousand little figures going about their day, and a list of things to find in it.',
    'On every list are Otis, in his green cap and orange scarf, his friend Mabel, and his dog Biscuit, along with a handful of lost things, a few odd scenes, and a couple of one-of-a-kind people. Plenty of the crowd look almost like Otis, and tapping one tells you what is wrong with him. Drag to move around and pinch or scroll to zoom; the scene is drawn fresh at every size, so it stays sharp however close you get.',
    <>Find everything and the clock decides the daily leaderboard. A wrong tap costs nothing but time. More puzzles for a sharp eye: <a href="/spot" style={{ color: 'inherit', fontWeight: 800 }}>Spot</a>, <a href="/witness" style={{ color: 'inherit', fontWeight: 800 }}>Witness</a>, <a href="/glimpse" style={{ color: 'inherit', fontWeight: 800 }}>Glimpse</a>, and <a href="/focus" style={{ color: 'inherit', fontWeight: 800 }}>Focus</a>.</>,
  ],
};

export default function WantedClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
