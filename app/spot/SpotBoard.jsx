'use client';

// THE SPOT PAIR: two copies of one photograph, drawn side by side on a wide
// screen and stacked on a phone, with the marks for what has been found. Shared
// by the daily (app/spot/SpotClient.jsx) and the kids copy (app/kids/KidsSpot.jsx),
// so both read a tap the same way. It keeps only what is not the game's state:
// the zoom, the pan, the miss cross and the hint ring. The host decides what a
// tap means and tells the pair what to draw.
//
// A diff is { x, y, rx, ry }: the centre as a fraction of width and height, and
// the two radii of its hit ellipse, BOTH as a fraction of the width.

import React, { useEffect, useRef, useState } from 'react';

// Which difference a tap at (nx, ny) lands on, or -1. `minR` is the smallest
// radius a finger gets, as a fraction of the width. When regions overlap (a
// plate on a car that changed color), the SMALLEST one under the tap wins, and
// one not yet found beats one that is.
export function spotHit(P, nx, ny, minR = 0, found = []) {
  const k = P.h / P.w;
  let best = -1, bestKey = Infinity;
  for (let i = 0; i < P.diffs.length; i++) {
    const d = P.diffs[i];
    const rx = Math.max(d.rx * 1.1, minR), ry = Math.max(d.ry * 1.1, minR);
    const dx = (nx - d.x) / rx, dy = ((ny - d.y) * k) / ry;
    if (dx * dx + dy * dy > 1) continue;
    const key = (found.includes(i) ? 1e6 : 0) + rx * ry;
    if (key < bestKey) { bestKey = key; best = i; }
  }
  return best;
}

export const SPOT_CSS = `
.spt{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;}
.spt-pair{display:grid;grid-template-columns:1fr;gap:8px;width:100%;min-width:220px;max-width:calc((100dvh - 320px) * var(--spt-ar) / 2);}
@media (min-width:900px){.spt-pair{grid-template-columns:1fr 1fr;gap:12px;max-width:calc((100dvh - 300px) * var(--spt-ar) * 2 + 12px);}}
.spt-vp{position:relative;overflow:hidden;width:100%;border:1px solid var(--spt-ink,#0b0f1a);border-radius:10px;background:var(--spt-cell,#eef1f6);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:crosshair;line-height:0;}
.spt-vp.zoom{touch-action:none;cursor:grab;}
.spt-vp.zoom.drag{cursor:grabbing;}
.spt-vp.off{cursor:default;}
.spt-layer{position:absolute;inset:0;transform-origin:0 0;--z:1;}
.spt-layer img{width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none;}
.spt-layer img.hid{visibility:hidden;}
.spt-mk{position:absolute;border-radius:50%;transform:translate(-50%,-50%);border:calc(3px / var(--z)) solid var(--spt-ring,#fda4af);box-shadow:0 0 0 calc(1px / var(--z)) #0b0f1a, inset 0 0 0 calc(1px / var(--z)) #0b0f1a;pointer-events:none;animation:sptPop .26s ease-out;}
.spt-mk.lost{border-color:#ffffff;}
.spt-hint{position:absolute;border-radius:50%;transform:translate(-50%,-50%);background:rgba(253,164,175,.3);border:calc(2px / var(--z)) solid #ffffff;box-shadow:0 0 0 calc(1px / var(--z)) #0b0f1a;pointer-events:none;animation:sptHint 2.6s ease-in-out forwards;}
.spt-x{position:absolute;width:calc(26px / var(--z));height:calc(26px / var(--z));transform:translate(-50%,-50%);pointer-events:none;animation:sptFade .8s ease-out forwards;}
.spt-x svg{width:100%;height:100%;display:block;}
@keyframes sptPop{from{transform:translate(-50%,-50%) scale(1.6);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes sptFade{0%{opacity:1}60%{opacity:1}100%{opacity:0}}
@keyframes sptHint{0%{opacity:0}15%{opacity:1}80%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.spt-mk{animation:none;}}
.spt-bar{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;width:100%;}
.spt-seg{display:inline-flex;border:1px solid var(--spt-ink,#0b0f1a);border-radius:999px;overflow:hidden;}
.spt-seg button{border:0;background:transparent;color:inherit;padding:8px 14px;min-width:46px;font:inherit;font-size:13px;font-weight:800;line-height:1.3;cursor:pointer;}
.spt-seg button + button{border-left:1px solid var(--spt-ink,#0b0f1a);}
.spt-seg button[aria-pressed="true"]{background:var(--spt-on,#fda4af);color:#0b0f1a;}
.spt-say{min-height:21px;margin:0;text-align:center;font-size:14px;font-weight:700;line-height:1.5;}
.spt-credit{margin:0;max-width:760px;text-align:center;font-size:11.5px;font-weight:600;line-height:1.5;opacity:.72;}
`;

const CROSS = '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" stroke="#0b0f1a" stroke-width="6.5" stroke-linecap="round"/><path d="M5 5l14 14M19 5L5 19" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/></svg>';

export function SpotCredit({ P }) {
  return <p className="spt-credit">{P.name}. Photo by {P.by}, {P.lic}, via Wikimedia Commons. The second copy has been altered for this puzzle.</p>;
}

// found / lost: indexes ringed in the accent / in white. onTap(nx, ny) returns
// 'miss' to draw a cross at the tap; anything else draws nothing. `hint` is
// { x, y, r, n } (n changes to replay it). `show` false keeps the photos hidden
// (they still load, so the clock never pays for the download).
export default function SpotPair({ P, found = [], lost = [], onTap, show = true, live = true, hint = null, tools = null, zoomable = true }) {
  const [view, setView] = useState({ z: 1, ox: 0, oy: 0 });
  const [crosses, setCrosses] = useState([]);
  const [dragging, setDragging] = useState(false);
  const down = useRef(null);
  const seq = useRef(0);
  const clamp = (v) => { const m = 1 - 1 / v.z; return { z: v.z, ox: Math.min(Math.max(v.ox, 0), m), oy: Math.min(Math.max(v.oy, 0), m) }; };
  const setZoom = (z) => setView((v) => clamp({ z, ox: v.ox + 0.5 / v.z - 0.5 / z, oy: v.oy + 0.5 / v.z - 0.5 / z }));
  // A hint always shows on the whole photo.
  useEffect(() => { if (hint) setView({ z: 1, ox: 0, oy: 0 }); }, [hint && hint.n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!live) setView({ z: 1, ox: 0, oy: 0 }); }, [live]);

  const onDown = (e) => {
    if (e.button != null && e.button > 0) return;
    down.current = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
    if (view.z > 1) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ } }
  };
  const onMove = (e) => {
    const d = down.current;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 7) d.moved = true;
    if (d.moved && view.z > 1) {
      const r = e.currentTarget.getBoundingClientRect();
      const dx = (e.clientX - d.lx) / (r.width * view.z), dy = (e.clientY - d.ly) / (r.height * view.z);
      d.lx = e.clientX; d.ly = e.clientY;
      setDragging(true);
      setView((v) => clamp({ z: v.z, ox: v.ox - dx, oy: v.oy - dy }));
    }
  };
  const onUp = (side) => (e) => {
    const d = down.current;
    if (!d || e.pointerId !== d.id) return;
    down.current = null;
    setDragging(false);
    if (d.moved || e.type === 'pointercancel' || !live || !show || !onTap) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = view.ox + (e.clientX - r.left) / r.width / view.z;
    const ny = view.oy + (e.clientY - r.top) / r.height / view.z;
    const coarse = e.pointerType === 'touch' || e.pointerType === 'pen';
    const minR = (coarse ? 24 : 12) / (r.width * view.z);
    if (onTap(nx, ny, minR) === 'miss') {
      const id = ++seq.current;
      setCrosses((c) => [...c, { id, side, x: nx, y: ny }]);
      setTimeout(() => setCrosses((c) => c.filter((q) => q.id !== id)), 850);
    }
  };

  const k = P.w / P.h;
  const layer = { transform: `scale(${view.z}) translate(${-view.ox * 100}%, ${-view.oy * 100}%)`, '--z': view.z };
  const mark = (i, cls) => {
    const d = P.diffs[i];
    if (!d) return null;
    return <div key={`${cls}${i}`} className={'spt-mk' + (cls === 'l' ? ' lost' : '')} style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${d.rx * 2.25 * 100}%`, height: `${d.ry * 2.25 * k * 100}%` }} />;
  };
  const copy = (side, alt) => (
    <div className={'spt-vp' + (view.z > 1 ? ' zoom' : '') + (dragging ? ' drag' : '') + (live && show ? '' : ' off')} style={{ aspectRatio: `${P.w} / ${P.h}` }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp(side)} onPointerCancel={onUp(side)}>
      <div className="spt-layer" style={layer}>
        <img className={show ? undefined : 'hid'} src={`/spot/${P.img}-${side}.jpg`} alt={show ? alt : ''} width={P.w} height={P.h} draggable={false} decoding="async" />
        {show ? found.map((i) => mark(i, 'f')) : null}
        {show ? lost.map((i) => mark(i, 'l')) : null}
        {show && hint ? <div key={`h${hint.n}`} className="spt-hint" style={{ left: `${hint.x * 100}%`, top: `${hint.y * 100}%`, width: `${hint.r * 2 * 100}%`, height: `${hint.r * 2 * k * 100}%` }} /> : null}
        {crosses.filter((c) => c.side === side).map((c) => <div key={c.id} className="spt-x" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }} dangerouslySetInnerHTML={{ __html: CROSS }} />)}
      </div>
    </div>
  );
  return (
    <>
      <div className="spt-pair" style={{ '--spt-ar': (P.w / P.h).toFixed(4) }}>
        {copy('a', `${P.name}, the original photograph`)}
        {copy('b', `${P.name}, the altered copy`)}
      </div>
      {(zoomable && show) || tools ? (
        <div className="spt-bar">
          {zoomable && show ? (
            <div className="spt-seg" role="group" aria-label="Zoom">
              {[1, 2, 3].map((z) => <button key={z} type="button" aria-pressed={view.z === z} onClick={() => setZoom(z)}>{z}x</button>)}
            </div>
          ) : null}
          {tools}
        </div>
      ) : null}
    </>
  );
}
