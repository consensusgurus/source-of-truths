'use client';

// Pack: the daily packing puzzle (owner, 2026-11-14: "a 3D packing puzzle. Trunk
// of a car, by Sunday it's a moving van"). Everything on the curb has to go in.
// Pick an item, tap where it goes, and it drops straight down and rests on
// whatever is under it. Turn spins it on the floor, Tip stands it on another
// side, View walks round the vehicle. Nothing may sit above the roof line.
// Most items are plain boxes; a sofa is a seat and a back, a table is a top on
// legs with real room underneath, so what goes under a table is loaded first.
//
// The model is lib/pack-engine.js (shared with the generator and the checker)
// and the drawing is lib/pack-art.js. Runs on app/SimpleDaily.jsx. Getting
// everything in is the solve; re-packs (items taken back out) are the miss
// column, lower first, then the clock. The Packing Ladder names the rung the
// re-packs earned.
//
// THE BOARD NEVER MOVES AT THE FINISH (owner rule): the ending beat lights the
// load item by item on the canvas already there, shuts the doors, and only then
// opens the full-screen fill with the ladder climb, the same shape as Chef's.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import { useStageTheme } from '@/lib/stage-theme';
import { useRunEmbed } from '../RunEmbed';
import { orient, occOf, dropAt, clearAbove, heightAt, turn, tip, rankOf } from '@/lib/pack-engine';
import { shapeOf, drawPieces, cellV, unV } from '@/lib/pack-art';

const BAND = { intro: 'Intro', gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const STEP = 140, RUNG_H = 8;
const lightStep = (n) => Math.min(120, 1100 / n);
const openAt = (n) => 150 + n * lightStep(n) + 500;      // the fill opens once the load has lit and the doors have shut
const climbAt = (n) => openAt(n) + 650;
const html = (s) => ({ __html: s });
const VEH = {
  Hatchback: '<path d="M6 36V28q2-6 14-8l14-10q4-2 12-2h28q10 0 16 8l8 8q12 2 14 6v6z"/><path d="M90 16v20"/>',
  Sedan: '<path d="M4 36V27q3-5 18-7l12-10q3-2 10-2h22q8 0 13 5l9 8q20 1 26 6v9z"/><path d="M80 8v28"/>',
  'Station Wagon': '<path d="M4 36V26q2-5 14-7l14-10h60q8 0 12 7l6 8q4 2 4 6v6z"/><path d="M84 9v27"/>',
  Minivan: '<path d="M4 36V24q4-10 16-16h72q12 0 16 8l6 10v10z"/><path d="M40 8v28M76 8v28"/>',
  Pickup: '<path d="M4 36V24l10-2 10-12h28l4 12h58v14z"/><path d="M56 22v14"/>',
  'Cargo Van': '<path d="M4 38V24l12-14h94q6 0 6 6v22z"/><path d="M34 10v28"/>',
  'Moving Van': '<path d="M4 38V26l8-10h16v22z"/><rect x="30" y="4" width="86" height="34"/>',
};
const vehSvg = (name, hub) => {
  const tall = name === 'Moving Van' || name === 'Cargo Van', wy = tall ? 40 : 36;
  return `<svg class="pk-veh" viewBox="0 0 120 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">${VEH[name] || VEH.Hatchback}<circle cx="${name === 'Moving Van' ? 18 : 30}" cy="${wy}" r="6.5" fill="${hub}"/><circle cx="92" cy="${wy}" r="6.5" fill="${hub}"/></svg>`;
};

const CSS = `
.pack{align-self:center;width:100%;max-width:560px;display:flex;flex-direction:column;gap:10px;font-family:'Manrope',system-ui,sans-serif;font-weight:600;color:var(--pk-ink);line-height:1.4;
--pk-bg:#ffffff;--pk-ink:#141414;--pk-mute:#6b6b6b;--pk-grey:#f1f1ef;--pk-grey2:#e3e3df;--pk-grid:#dcdad4;--pk-wa:#f1f1ef;--pk-wb:#e7e7e3;--pk-bad:#f0a8a8;--pk-acc:var(--pst-acc,#f3c4f5);--pk-on:var(--pst-on-acc,#141414);--pk-dk:0;}
.stage-page[data-stage-theme='dark'] .pack,.pst.dk .pack{--pk-dk:1;--pk-bg:#161616;--pk-ink:#f2f2ee;--pk-mute:#a3a39d;--pk-grey:#232323;--pk-grey2:#333333;--pk-grid:#3a3936;--pk-wa:#222220;--pk-wb:#1b1b19;--pk-bad:#b56a6a;}
.pack button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;}
.pk-stat{display:flex;border:1px solid var(--pk-ink);border-radius:10px;overflow:hidden;background:var(--pk-bg);}
.pk-stat div{flex:1;padding:6px 4px;text-align:center;border-left:1px solid var(--pk-ink);}
.pk-stat div:first-child{border-left:0;}
.pk-stat b{display:block;font-size:17px;font-weight:800;line-height:1.3;}.pk-stat span{font-size:11px;color:var(--pk-mute);}
/* the vehicle line, the headings and the message sit straight on the stage, so they take the stage's ink */
.pk-ride{display:flex;align-items:center;gap:12px;color:var(--pst-ink,var(--pk-ink));}
.pk-veh{width:84px;height:34px;flex:none;display:block;}
.pk-ride b{display:block;font-size:15px;font-weight:800;line-height:1.3;}.pk-ride span{font-size:12px;color:var(--pst-mute,var(--pk-mute));}
.pk-board{border:1px solid var(--pk-ink);border-radius:10px;background:var(--pk-bg);padding:6px;}
.pk-board canvas{display:block;width:100%;touch-action:manipulation;}
.pk-h{font-size:12px;letter-spacing:.04em;color:var(--pst-mute,var(--pk-mute));margin:2px 0 -4px;font-weight:700;text-transform:uppercase;}
.pk-bar{position:sticky;bottom:0;z-index:3;background:var(--pst-bg,var(--pk-bg));padding:6px 0 10px;margin-top:-4px;display:flex;flex-direction:column;gap:6px;}
.pk-msg{min-height:20px;font-size:13px;font-weight:700;text-align:center;color:var(--pst-ink,var(--pk-ink));}
.pk-ctl{display:grid;grid-template-columns:1fr 1fr 1fr 1.4fr;gap:6px;}
.pack button.pk-btn{border:1px solid var(--pk-ink);border-radius:10px;padding:12px 4px;font-weight:800;font-size:15px;background:var(--pk-bg);text-align:center;line-height:1.3;}
.pack button.pk-btn.go{background:var(--pk-acc);color:var(--pk-on);}
.pack button.pk-btn:disabled{opacity:.45;cursor:default;}
.pk-tray{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
@media (min-width:520px){.pk-tray{grid-template-columns:repeat(3,1fr);}}
.pack button.pk-item{display:flex;align-items:center;gap:8px;border:1px solid var(--pk-ink);border-radius:10px;background:var(--pk-bg);padding:5px 8px;text-align:left;min-height:64px;}
.pk-item canvas{width:60px;height:52px;flex:none;display:block;}
.pk-item b{display:block;font-size:13px;font-weight:800;line-height:1.35;}.pk-item span{font-size:11px;color:var(--pk-mute);line-height:1.4;display:block;}
.pack button.pk-item.sel{background:var(--pk-acc);color:var(--pk-on);}.pk-item.sel span{color:var(--pk-on);}
.pack button.pk-item.in{background:var(--pk-grey);}.pk-item.in canvas{opacity:.55;}
.pk-two{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.pack .pk-two button.pk-btn{padding:9px 4px;font-size:14px;}
.pk-card{border:1px solid var(--pk-ink);border-radius:10px;background:var(--pk-bg);overflow:hidden;}
.pk-cardh{font-size:12px;color:var(--pk-mute);font-weight:700;letter-spacing:.04em;padding:10px 12px 6px;text-transform:uppercase;}
.pk-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;font-size:14px;border-top:1px solid var(--pk-grey2);}
.pk-row b{font-weight:800;}.pk-row span{color:var(--pk-mute);font-size:12px;text-align:right;}
.pk-row.me{background:var(--pk-acc);color:var(--pk-on);}.pk-row.me span{color:var(--pk-on);font-weight:800;}
.pk-fin{position:fixed;inset:0;z-index:60;background:var(--pk-acc);color:#141414;display:flex;align-items:center;justify-content:center;animation:pk-open .5s ease-out backwards;}
@keyframes pk-open{from{clip-path:circle(0 at 50% 36%)}to{clip-path:circle(150% at 50% 36%)}}
.pk-fin-in{text-align:center;width:270px;}
.pk-fin .pk-veh{width:120px;height:48px;margin:0 auto 6px;}
.pk-rung{height:36px;line-height:34px;border:1px solid #141414;border-radius:10px;margin:6px 0;font-weight:800;font-size:15px;background:#ffffff;animation:pk-lit .12s backwards;}
.pk-rung.over{opacity:.3;background:transparent;animation:none;}
.pk-rung.me{background:#141414;color:#ffffff;transform:scale(1.07);animation:pk-earn .15s backwards;}
@keyframes pk-lit{from{opacity:.3;background:transparent}}
@keyframes pk-earn{from{opacity:.3;background:transparent;color:#141414;transform:none}}
.pk-fin-t{font-size:28px;font-weight:800;height:44px;line-height:44px;margin-top:10px;white-space:nowrap;animation:pk-rise .25s backwards;}
.pk-fin-s{font-size:15px;height:22px;animation:pk-rise .25s backwards;}
@keyframes pk-rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.pk-fin,.pk-fin *{animation:none !important;}}
`;

const rp = (n) => `${n} ${n === 1 ? 're-pack' : 're-packs'}`;
const rankName = (P, s) => { const r = rankOf(P, s.rp); return r.rows[r.at].name; };
const cssVar = (el, n) => (el ? getComputedStyle(el).getPropertyValue(n).trim() : '');

// One item drawn on its own, as it currently stands.
function Thumb({ shape, r, dark }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d'), dpr = window.devicePixelRatio || 1, w = 60, h = 52;
    c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
    const e = orient(shape, r).ext, a = Math.min((w - 4) / (e[0] + e[1]), (h - 4) / ((e[0] + e[1]) / 2 + e[2]));
    const ox = w / 2 + ((e[1] - e[0]) * a) / 2, oy = (h - ((e[0] + e[1]) * a / 2 + e[2] * a)) / 2 + e[2] * a;
    drawPieces(x, [{ shape, r, pos: [0, 0, 0] }], { r: 0, W: e[0], D: e[1] }, (u, v, z) => [ox + (u - v) * a, oy + ((u + v) * a) / 2 - z * a], a, { dark });
  }, [shape, r, dark]);
  return <canvas ref={ref} aria-hidden="true" />;
}

function Board({ P, s, setS, active, done, held, release }) {
  const shapes = useMemo(() => P.items.map(shapeOf), [P]);
  const N = P.items.length;
  const [theme] = useStageTheme();
  // Inside a run (Space Cadet) the board wears the run's look and the run plays its own ending,
  // so only the beat on the board itself runs: the load lights up and the doors shut.
  const EMBED = useRunEmbed();
  // Dark is read off the board's own colours (the --pk-dk flag the dark rules set), so the canvas
  // can never disagree with the cards round it.
  const [dark, setDark] = useState(false);
  const firstOut = (placed) => { for (let i = 0; i < N; i++) if (!placed.some((q) => q.i === i)) return i; return null; };
  const [sel, setSel] = useState(() => firstOut(s.placed));
  const [ori, setOri] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const [view, setView] = useState(0);
  const [note, setNote] = useState('');
  const [wide, setWide] = useState(0);
  const [lit, setLit] = useState(null);       // the ending beat: which items have lit
  const [shut, setShut] = useState(false);
  const hist = useRef([]);
  const wrap = useRef(null), cv = useRef(null), geo = useRef(null);
  const live = active && !done;
  const won = done && s.placed.length === N;
  const finale = won && held;
  const isIn = (i) => s.placed.some((q) => q.i === i);
  const V = { r: view, W: P.W, D: P.D };
  const vd = view % 2 ? [P.D, P.W] : [P.W, P.D];

  // a selection that has gone stale (the item was loaded, or a save was restored)
  useEffect(() => { if (live && (sel == null || isIn(sel))) { setSel(firstOut(s.placed)); setOri(0); setAnchor(null); } }); // eslint-disable-line react-hooks/exhaustive-deps

  const ghost = () => {
    if (!live || sel == null || !anchor || isIn(sel)) return null;
    const o = orient(shapes[sel], ori), fu = view % 2 ? o.ext[1] : o.ext[0], fv = view % 2 ? o.ext[0] : o.ext[1];
    if (fu > vd[0] || fv > vd[1]) return { bad: 'long' };
    const u0 = Math.max(0, Math.min(vd[0] - fu, anchor.u - ((fu - 1) >> 1))), v0 = Math.max(0, Math.min(vd[1] - fv, anchor.v - ((fv - 1) >> 1)));
    const a = unV(V, u0, v0), b = unV(V, u0 + fu - 1, v0 + fv - 1), x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]);
    const d = dropAt(P, occOf(P, s.placed, shapes), o, x, y);
    return { i: sel, r: ori, p: [x, y, d.z], bad: d.ok ? null : 'tall' };
  };
  const g = ghost();

  useEffect(() => {
    // the canvas's own width, not the card's: the card has padding, and a canvas drawn wider than it
    // is shown would be squeezed and every tap would land a few pixels off
    const el = cv.current; if (!el) return undefined;
    const fit = () => setWide(el.clientWidth);
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, []);

  // THE DRAWING. The canvas is sized for the tallest view so walking round the
  // vehicle never changes the height of the board.
  useEffect(() => {
    const c = cv.current; if (!c || !wide) return;
    const pad = 8, top = P.H + 1, span = P.W + P.D, dpr = window.devicePixelRatio || 1;
    const a = Math.min((wide - 2 * pad) / span, 330 / (span / 2 + top), 46);
    const hCss = Math.ceil((span * a) / 2 + top * a + 2 * pad);
    if (c.width !== Math.round(wide * dpr) || c.height !== Math.round(hCss * dpr)) { c.style.height = `${hCss}px`; c.width = Math.round(wide * dpr); c.height = Math.round(hCss * dpr); }
    const ox = (wide - span * a) / 2 + vd[1] * a, oy = pad + top * a;
    const Pf = (u, v, z) => [ox + (u - v) * a, oy + ((u + v) * a) / 2 - z * a];
    geo.current = { Pf };
    const x = c.getContext('2d'), root = wrap.current.closest('.pack'), col = (n) => cssVar(root, n);
    const dk = col('--pk-dk') === '1'; if (dk !== dark) setDark(dk);
    const ink = col('--pk-ink'), grid = col('--pk-grid'), Wv = vd[0], Dv = vd[1], H = P.H;
    const seg = (p, q, st) => { x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.strokeStyle = st; x.lineWidth = 1; x.stroke(); };
    const quad = (pts, fill) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = fill; x.fill(); };
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, wide, hCss); x.lineJoin = 'round'; x.lineCap = 'round';
    quad([Pf(0, 0, 0), Pf(Wv, 0, 0), Pf(Wv, Dv, 0), Pf(0, Dv, 0)], col('--pk-bg'));
    quad([Pf(0, 0, 0), Pf(0, Dv, 0), Pf(0, Dv, H), Pf(0, 0, H)], col('--pk-wa'));
    quad([Pf(0, 0, 0), Pf(Wv, 0, 0), Pf(Wv, 0, H), Pf(0, 0, H)], col('--pk-wb'));
    for (let i = 0; i <= Wv; i++) { seg(Pf(i, 0, 0), Pf(i, Dv, 0), grid); seg(Pf(i, 0, 0), Pf(i, 0, H), grid); }
    for (let i = 0; i <= Dv; i++) { seg(Pf(0, i, 0), Pf(Wv, i, 0), grid); seg(Pf(0, i, 0), Pf(0, i, H), grid); }
    for (let i = 0; i <= H; i++) { seg(Pf(0, 0, i), Pf(0, Dv, i), grid); seg(Pf(0, 0, i), Pf(Wv, 0, i), grid); }
    [[Pf(0, 0, 0), Pf(Wv, 0, 0)], [Pf(Wv, 0, 0), Pf(Wv, Dv, 0)], [Pf(Wv, Dv, 0), Pf(0, Dv, 0)], [Pf(0, Dv, 0), Pf(0, 0, 0)], [Pf(0, 0, 0), Pf(0, 0, H)], [Pf(0, Dv, 0), Pf(0, Dv, H)], [Pf(Wv, 0, 0), Pf(Wv, 0, H)], [Pf(0, 0, H), Pf(0, Dv, H)], [Pf(0, 0, H), Pf(Wv, 0, H)]].forEach((e) => seg(e[0], e[1], ink));
    const list = s.placed.map((q) => ({ shape: shapes[q.i], r: q.r, pos: q.p, lit: !!(lit && lit[q.i]) }));
    if (g && g.i != null) list.push({ shape: shapes[g.i], r: g.r, pos: g.p, ghost: true, bad: g.bad });
    drawPieces(x, list, V, Pf, a, { dark: dk, bad: col('--pk-bad') });
    // the roof line and the open side: faint while loading, solid once the doors shut
    x.globalAlpha = shut || (won && !held) ? 1 : 0.35;
    [[Pf(Wv, 0, H), Pf(Wv, Dv, H)], [Pf(Wv, Dv, H), Pf(0, Dv, H)], [Pf(Wv, Dv, 0), Pf(Wv, Dv, H)]].forEach((e) => seg(e[0], e[1], ink));
    x.globalAlpha = 1;
  }); // repaints every render: the board is a handful of boxes

  // THE ENDING BEAT on the board: the load lights item by item in the order it went in, then the doors shut.
  useEffect(() => {
    if (!finale) { setLit(null); setShut(false); return undefined; }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShut(true); return undefined; }
    const step = lightStep(N), ts = [];
    s.placed.forEach((q, k) => ts.push(setTimeout(() => setLit((m) => ({ ...(m || {}), [q.i]: 1 })), 150 + k * step)));
    ts.push(setTimeout(() => setShut(true), 150 + N * step + 150));
    return () => ts.forEach(clearTimeout);
  }, [finale]); // eslint-disable-line react-hooks/exhaustive-deps

  const hit = (mx, my) => {
    if (!geo.current) return null;
    const { Pf } = geo.current, occ = occOf(P, s.placed, shapes); let best = null;
    const inside = (pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > my) !== (b[1] > my) && mx < ((b[0] - a[0]) * (my - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    for (let u = 0; u < vd[0]; u++) for (let v = 0; v < vd[1]; v++) {
      const w = unV(V, u, v), z = heightAt(P, occ, w[0], w[1]);
      if (inside([Pf(u, v, z), Pf(u + 1, v, z), Pf(u + 1, v + 1, z), Pf(u, v + 1, z)]) || (z && (inside([Pf(u + 1, v, 0), Pf(u + 1, v + 1, 0), Pf(u + 1, v + 1, z), Pf(u + 1, v, z)]) || inside([Pf(u, v + 1, 0), Pf(u + 1, v + 1, 0), Pf(u + 1, v + 1, z), Pf(u, v + 1, z)])))) if (!best || u + v > best.u + best.v) best = { u, v };
    }
    return best;
  };
  const at = (e) => { const r = cv.current.getBoundingClientRect(); return hit(e.clientX - r.left, e.clientY - r.top); };

  const place = () => {
    if (!live || !g || g.i == null) return;
    if (g.bad) { setNote('It will not clear the roof there.'); return; }
    hist.current.push(s.placed);
    const placed = s.placed.concat([{ i: g.i, r: g.r, p: g.p }]), nx = firstOut(placed);
    setSel(nx); setOri(0); setAnchor(null);
    setNote(nx == null ? '' : `Next: ${P.items[nx].n}.`);
    setS({ ...s, placed, mv: s.mv + 1 });
  };
  const onMove = (e) => { if (e.pointerType !== 'mouse' || !live || sel == null) return; const c = at(e); if (c && (!anchor || c.u !== anchor.u || c.v !== anchor.v)) setAnchor(c); };
  const onTap = (e) => {
    if (finale) { release(); return; }
    if (!live || sel == null) return;
    const c = at(e); if (!c) return;
    if (anchor && c.u === anchor.u && c.v === anchor.v && g) {
      if (g.i != null && !g.bad) place();
      else setNote(g.bad === 'long' ? 'Too long that way. Turn it.' : 'It will not clear the roof there.');
      return;
    }
    setAnchor(c); setNote('Tap again or press Place.');
  };
  useEffect(() => { if (!g) return; if (g.bad === 'long') setNote('Too long that way. Turn it.'); else if (g.bad === 'tall') setNote('It will not clear the roof there.'); }, [g && g.bad, ori, anchor && anchor.u, anchor && anchor.v]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (i) => {
    if (!live) return;
    if (isIn(i)) {
      const q = s.placed.find((x) => x.i === i);
      if (!clearAbove(P, occOf(P, s.placed, shapes), orient(shapes[i], q.r), q)) { setNote(`Something is in the way above the ${P.items[i].n}.`); return; }
      hist.current.push(s.placed);
      setSel(i); setOri(0); setAnchor(null); setNote(`${P.items[i].n} is back out. That is a re-pack.`);
      setS({ ...s, placed: s.placed.filter((x) => x.i !== i), rp: s.rp + 1 });
    } else { setSel(i); setOri(0); setAnchor(null); setNote(`Tap where the ${P.items[i].n} goes.`); }
  };
  const undo = () => {
    if (!live || !hist.current.length) return;
    const prev = hist.current.pop();
    setSel(firstOut(prev)); setOri(0); setAnchor(null); setNote('');
    setS({ ...s, placed: prev, rp: Math.max(0, s.rp + (prev.length < s.placed.length ? 1 : -1)) });
  };
  const unload = () => {
    if (!live || !s.placed.length) return;
    hist.current = []; setSel(0); setOri(0); setAnchor(null); setNote('Everything is back on the curb.');
    setS({ ...s, placed: [], rp: s.rp + s.placed.length });
  };
  const walk = () => {
    const w = anchor ? unV(V, anchor.u, anchor.v) : null, nv = (view + 1) % 4;
    if (w) { const q = cellV({ r: nv, W: P.W, D: P.D }, w[0], w[1]); setAnchor({ u: q[0], v: q[1] }); }
    setView(nv);
  };

  const cells = s.placed.reduce((n, q) => n + shapes[q.i].cells.length, 0);
  const rank = won ? rankOf(P, s.rp) : null;
  const hub = 'var(--pst-bg,var(--pk-bg))';

  return (
    <div className="pack">
      <style dangerouslySetInnerHTML={html(CSS)} />
      <div className="pk-stat" aria-label="The load so far">
        <div><b>{s.placed.length}/{N}</b><span>Loaded</span></div>
        <div><b>{s.rp}</b><span>Re-packs</span></div>
        <div><b>{Math.round((100 * cells) / (P.W * P.D * P.H))}%</b><span>Full</span></div>
      </div>
      <div className="pk-ride">
        <span dangerouslySetInnerHTML={html(vehSvg(P.vehicle, hub))} />
        <div><b>{P.vehicle}</b><span>{P.W} wide, {P.D} deep, {P.H} high</span></div>
      </div>
      <div className="pk-board" ref={wrap}>
        <canvas ref={cv} onPointerMove={onMove} onClick={onTap} role="img" aria-label={`The ${P.vehicle}, ${s.placed.length} of ${N} items loaded`} />
      </div>

      {done ? null : (
        <div className="pk-bar">
          <div className="pk-msg" aria-live="polite">{live ? note : ''}</div>
          <div className="pk-ctl">
            <button type="button" className="pk-btn" onClick={walk} disabled={!live}>View</button>
            <button type="button" className="pk-btn" onClick={() => { setOri(turn(ori)); setNote(''); }} disabled={!live || sel == null}>Turn</button>
            <button type="button" className="pk-btn" onClick={() => { setOri(tip(ori)); setNote(''); }} disabled={!live || sel == null}>Tip</button>
            <button type="button" className="pk-btn go" onClick={place} disabled={!live || !g || g.i == null || !!g.bad}>Place</button>
          </div>
        </div>
      )}

      {won && !held ? (
        <>
          <div className="pk-card">
            <div className="pk-cardh">Packing Ladder</div>
            {rank.rows.map((r, i) => <div key={r.name} className={`pk-row${i === rank.at ? ' me' : ''}`}><b>{r.name}</b><span>{i === rank.at ? 'You · ' : ''}{r.label}</span></div>)}
          </div>
          <div className="pk-card">
            <div className="pk-cardh">The Load</div>
            <div className="pk-row"><b>Re-packs</b><span>{s.rp}</span></div>
            <div className="pk-row"><b>Loads</b><span>{s.mv} for {N} items</span></div>
          </div>
        </>
      ) : won ? null : (
        <>
          <div className="pk-h">{done ? 'Left on the Curb' : 'To Load'}</div>
          <div className="pk-tray">
            {P.items.map((it, i) => {
              const inn = isIn(i);
              if (done && inn) return null;
              return (
                <button key={i} type="button" data-i={i} className={`pk-item${live && i === sel ? ' sel' : ''}${inn ? ' in' : ''}`} onClick={() => pick(i)} aria-pressed={live && i === sel}>
                  <Thumb shape={shapes[i]} r={live && i === sel ? ori : 0} dark={dark} />
                  <span><b>{it.n}</b><span>{inn ? 'Loaded. Tap to take out' : `${it.d.join(' x ')}${it.note ? ` · ${it.note}` : ''}`}</span></span>
                </button>);
            })}
          </div>
          {done ? null : (
            <div className="pk-two">
              <button type="button" className="pk-btn" onClick={undo} disabled={!live || !hist.current.length}>Undo</button>
              <button type="button" className="pk-btn" onClick={unload} disabled={!live || !s.placed.length}>Unload All</button>
            </div>
          )}
        </>
      )}

      {finale && !EMBED ? (
        <div className="pk-fin" style={{ animationDelay: `${openAt(N)}ms` }} onClick={release} role="status" aria-label={`${rank.rows[rank.at].name}. ${rp(s.rp)}.`}>
          <div className="pk-fin-in">
            <span dangerouslySetInnerHTML={html(vehSvg(P.vehicle, 'var(--pk-acc)'))} />
            {rank.rows.map((r, i) => (
              <div key={r.name} className={`pk-rung${i < rank.at ? ' over' : i === rank.at ? ' me' : ''}`}
                style={i >= rank.at ? { animationDelay: `${climbAt(N) + (RUNG_H - 1 - i) * STEP}ms` } : undefined}>{r.name}</div>
            ))}
            <div className="pk-fin-t" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rank.rows[rank.at].name}</div>
            <div className="pk-fin-s" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rp(s.rp)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const shapedNames = (P) => P.items.filter((it) => it.note).map((it) => it.n);
const fitLine = (P) => (P.band === 'tough' ? 'It is an exact fit: every cell gets used.' : 'There is a little room to spare.');

const GAME = {
  key: 'pack', name: 'Pack', cat: 'Visual', miss: 're-packs', missOne: 're-pack', runDoor: 'spacecadet',
  fresh: () => ({ placed: [], rp: 0, mv: 0 }),
  validSave: (P, s) => !!s && Array.isArray(s.placed) && Number.isInteger(s.rp) && Number.isInteger(s.mv)
    && s.placed.every((q) => q && Number.isInteger(q.i) && q.i >= 0 && q.i < P.items.length && Number.isInteger(q.r) && q.r >= 0 && q.r < 24 && Array.isArray(q.p) && q.p.length === 3)
    && new Set(s.placed.map((q) => q.i)).size === s.placed.length,
  touched: (s) => s.mv > 0,
  solved: (P, s) => s.placed.length === P.items.length,
  count: (s) => s.rp,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.rp }),
  metric: (P, s, won) => (won ? s.rp : null),
  Board,
  wide: false,
  holdMs: (P, s, won) => { if (!won) return 1200; const r = rankOf(P, s.rp), n = P.items.length; return climbAt(n) + (RUNG_H - 1 - r.at) * STEP + 250 + 1500; },
  title: (P, s, won) => (won ? rankName(P, s) : endSolved(false)),
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.vehicle}`} · No. ${P.num}`,
  foot: (P, s) => `${s.placed.length} of ${P.items.length} loaded · ${rp(s.rp)}`,
  frac: (P, s) => s.placed.length / P.items.length,
  sundayLabel: () => 'Sunday Edition · Moving Day',
  gateTitle: (P) => `Today: the ${P.vehicle}, ${P.items.length} things to load`,
  gateLine: (P) => `Everything on the curb has to go in the ${P.vehicle}. Pick an item, tap where it goes, and it drops straight down. Nothing may sit above the roof line.`,
  rules: (P) => {
    const sh = shapedNames(P);
    return {
      lead: 'Get everything in, and take as little back out as you can.',
      steps: [
        <><b>Pick an item</b> from the list, then <b>tap where it goes</b>. It drops straight down and rests on whatever is under it. A see-through copy shows where it will land; tap the same spot again, or press Place.</>,
        <><b>Turn</b> spins the item on the floor. <b>Tip</b> stands it on another side. <b>View</b> walks you round the vehicle a quarter turn at a time.</>,
        <>Nothing may sit above the <b>roof line</b>. A spot where the item would stick out is tinted and refused.</>,
        <>Tap a loaded item in the list to <b>take it back out</b>, as long as nothing is above it. That is a <b>re-pack</b>, and so is each step of Undo and each item Unload All removes.</>,
        sh.length
          ? <>Not everything is a plain box. Today that means the {sh.join(', the ')}. A sofa or chair has a seat and a back, so something can ride on the seat. A table or desk has room underneath, and because items only drop straight down, what goes under it is loaded first.</>
          : <>Later in the week some things are not plain boxes: a sofa has a seat and a back, and a table has room underneath.</>,
        <>Today is the {P.vehicle}: {P.W} wide, {P.D} deep and {P.H} high. {fitLine(P)}</>,
      ],
      knack: 'Load the big, awkward things first and low. Keep the long thin ones for the gaps that are left, and look from every side before you place.',
      footer: 'Getting everything in counts. The fewest re-packs ranks first, then the clock, and the Packing Ladder names your rung.',
    };
  },
  pitch: (P) => `${P.items.length} things, one ${P.vehicle}. Get it all in.`,
  shareLine: (P, s, won, el) => `Pack #${P.num} · ${won ? `${rankName(P, s)} · ${rp(s.rp)} · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => (won ? `${rp(s.rp)} · ${el}` : `${s.placed.length} of ${P.items.length} loaded · ${el}`),
  aboutTitle: 'About Pack',
  about: [
    'Pack is a free daily packing puzzle from Mind Loft. A pile of luggage or furniture sits on the curb, and all of it has to fit in the day\'s vehicle. Pick an item, tap where it goes, and it drops straight down and rests on whatever is under it. You can turn it on the floor, tip it onto another side, and walk round the vehicle to look from all four corners.',
    'The space is three-dimensional and nothing may sit above the roof line. Most items are plain boxes drawn as what they are: suitcases, coolers, a rolled rug, a fridge, a bookcase. Some have a real shape. A sofa is a seat and a back, so a small thing can ride on the seat. A table is a top on legs with room underneath, and since everything drops straight down, what goes under the table has to be loaded before it.',
    'The vehicle grows through the week: a hatchback on Monday, then a sedan, a station wagon, a minivan, a pickup and a cargo van, and on Sunday a moving van with a whole house to load. Early in the week there is room to spare. By Friday the fit is exact.',
    'Taking an item back out is a re-pack. At the end the Packing Ladder names your rung by how few you needed, from Left It on the Curb up through Weekend Mover and Roadie to a clean load with none at all.',
    <>More spatial puzzles: <a href="/tangled" style={{ color: 'inherit', fontWeight: 800 }}>Tangled</a>, <a href="/topple" style={{ color: 'inherit', fontWeight: 800 }}>Topple</a> and <a href="/parker" style={{ color: 'inherit', fontWeight: 800 }}>Parker</a>.</>,
  ],
};

export default function PackClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
