'use client';

// Curb: the daily parking puzzle (owner, 2026-11-28: "build a parking simulator
// for parallel parking and on sundays something like [a tractor-trailer backing
// into a loading dock]... scored on accuracy and speed"; approved the mockup and
// the gameplay variety, ruled out retention extras: "I only care about actual
// gameplay").
//
// Weekdays parallel park a car between two parked cars; the vehicle, the room,
// the curb side, a hydrant and traffic change by the day and the gap tightens
// through the week. The Sunday Edition backs a tractor-trailer into a dock bay.
// Real steering (lib/curb-engine.js, the same code the checker parks every day
// with). Ranked on ONE time: the driving clock plus seconds for distance from
// the curb or dock, crookedness and being off center, plus five seconds a bump.
// The shell adds those seconds through GAME.extraSec (app/SimpleDaily.jsx).
//
// The board card is light in both looks, like Scales and Glimpse: asphalt grey,
// white paint, the site pastels and ink outlines. The controls follow the stage.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import {
  PI, BANDS, CARS, TRAILERS, BAYS, DOCK_Y, buildDay, bodies, hits, advance, measure, penalties, penaltySec,
  trafficPoly, TRAFFIC_SPEED, wrap, dayLine, BUMP_SEC, overlap,
} from '@/lib/curb-engine';

const COL = {
  ground: '#dfe0e3', groundSnow: '#e6e9ee', paint: '#ffffff', walk: '#eeeeeb', walkSnow: '#fbfcfd', curb: '#bfc1c6', ink: '#0b0f1a',
  rose: '#f4c6cf', lime: '#d9eab0', sky: '#c7def3', butter: '#f5e6a6', lav: '#dbd2f1', mint: '#c6e8d8', peach: '#f7d5bd',
  red: '#ec9aa5', dock: '#c6e8d8', box: '#eceef1', glass: 'rgba(255,255,255,.78)',
};
const STEP = 1 / 120;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const fmtV = (r) => (r.unit === 'deg' ? `${r.v.toFixed(1)}°` : `${Math.round(r.v)} in`);
const LEVELS = new Map();
function levelOf(P) { let L = LEVELS.get(P.quizId); if (!L) { L = buildDay(P.set); LEVELS.set(P.quizId, L); } return L; }

const CSS = `
.crb{display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px;margin:0 auto;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);}
.crb-board{position:relative;border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;overflow:hidden;background:${COL.ground};line-height:0;align-self:center;}
.crb-board canvas{display:block;touch-action:none;}
.crb-toast{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:#fff;color:#0b0f1a;border:1px solid #0b0f1a;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:800;line-height:1.3;white-space:nowrap;opacity:0;transition:opacity .25s;pointer-events:none;}
.crb-toast.on{opacity:1;}
.crb-pill{position:absolute;right:8px;bottom:8px;background:#fff;color:#0b0f1a;border:1px solid #0b0f1a;border-radius:999px;padding:3px 10px;font-size:13px;font-weight:800;line-height:1.3;}
.crb-ctl{display:flex;flex-direction:column;gap:10px;}
.crb-steer{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;}
.crb-steer b{font-size:13px;font-weight:800;opacity:.75;}
.crb-steer input{width:100%;height:44px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;}
.crb-steer input::-webkit-slider-runnable-track{height:8px;border-radius:99px;background:var(--pst-cell,#f1f4f8);border:1px solid var(--pst-ink,#0b0f1a);}
.crb-steer input::-moz-range-track{height:8px;border-radius:99px;background:var(--pst-cell,#f1f4f8);border:1px solid var(--pst-ink,#0b0f1a);}
.crb-steer input::-webkit-slider-thumb{-webkit-appearance:none;width:46px;height:32px;border-radius:10px;background:var(--pst-acc,#c7def3);border:1px solid var(--pst-ink,#0b0f1a);margin-top:-13px;}
.crb-steer input::-moz-range-thumb{width:46px;height:32px;border-radius:10px;background:var(--pst-acc,#c7def3);border:1px solid var(--pst-ink,#0b0f1a);}
.crb-mid{text-align:center;}
.crb-mid button{background:none;border:0;padding:0 6px;min-height:32px;font:700 13px 'Manrope',system-ui,sans-serif;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;opacity:.8;}
.crb-ped{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.crb-ped button{min-height:58px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;background:var(--pst-cell,#f1f4f8);color:inherit;font:800 16px 'Manrope',system-ui,sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none;}
.crb-ped button.hold{background:var(--pst-acc,#c7def3);color:var(--pst-on-acc,#0b0f1a);}
.crb-ped button.park{background:var(--pst-acc,#c7def3);color:var(--pst-on-acc,#0b0f1a);}
.crb-ped button:disabled{opacity:.45;cursor:default;}
.crb-ped button:focus-visible,.crb-mid button:focus-visible,.crb-steer input:focus-visible{outline:3px solid var(--pst-ink,#0b0f1a);outline-offset:2px;}
.crb-hint{margin:0;text-align:center;font-size:13.5px;font-weight:600;line-height:1.5;opacity:.8;}
.crb-rows{border-top:1px solid var(--pst-ink,#0b0f1a);}
.crb-rows div{display:flex;justify-content:space-between;gap:12px;padding:8px 2px;border-bottom:1px solid var(--pst-ink,#0b0f1a);font-size:15px;font-weight:700;line-height:1.4;}
.crb-rows b{white-space:nowrap;}
.crb-rows em{font-style:normal;font-weight:700;opacity:.7;margin-left:6px;white-space:nowrap;}
@media (min-width:900px){
  .crb.wd{max-width:960px;flex-direction:row;align-items:flex-start;gap:22px;}
  .crb.wd .crb-board{flex:0 0 auto;}
  .crb.wd .crb-side{flex:1 1 0;display:flex;flex-direction:column;gap:12px;min-width:280px;max-width:380px;padding-top:4px;}
}
.crb-side{display:flex;flex-direction:column;gap:10px;}
@media (prefers-reduced-motion:reduce){.crb-toast{transition:none;}}
`;

// ── drawing ────────────────────────────────────────────────────────────────
function rr(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function vehicle(ctx, px, x, y, h, back, front, hw, fill, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(h); ctx.lineWidth = px;
  const wheel = (ax, ang) => { for (const s of [-1, 1]) { ctx.save(); ctx.translate(ax, s * (hw - 0.05)); ctx.rotate(ang); ctx.fillStyle = COL.ink; ctx.fillRect(-0.38, -0.13, 0.76, 0.26); ctx.restore(); } };
  (o.axles || []).forEach((a) => wheel(a, 0));
  if (o.wb !== undefined) { wheel(0, 0); wheel(o.wb, o.steer || 0); }
  rr(ctx, -back, -hw, back + front, hw * 2, Math.min(0.5, hw * 0.45), fill, COL.ink);
  if (o.kind === 'cab') {
    rr(ctx, front - 1.9, -hw + 0.15, 1.6, hw * 2 - 0.3, 0.3, 'rgba(0,0,0,.07)');
    rr(ctx, front - 1.6, -hw + 0.25, 0.5, hw * 2 - 0.5, 0.15, COL.glass, COL.ink);
    if (o.sleeper) rr(ctx, -back + 0.3, -hw + 0.2, front - 2.3 + back - 0.3, hw * 2 - 0.4, 0.25, 'rgba(0,0,0,.05)', COL.ink);
  } else if (o.kind === 'trailer') {
    rr(ctx, front - 0.9, -hw + 0.25, 0.7, hw * 2 - 0.5, 0.15, '#ffffff', COL.ink);
  } else if (o.kind === 'box') {
    rr(ctx, front - 1.6, -hw + 0.1, 1.5, hw * 2 - 0.2, 0.3, COL.mint, COL.ink);
    rr(ctx, front - 1.15, -hw + 0.3, 0.45, hw * 2 - 0.6, 0.12, COL.glass, COL.ink);
  } else {
    rr(ctx, front - 1.55, -hw + 0.2, 0.75, hw * 2 - 0.4, 0.25, COL.glass, COL.ink);
    if (o.bed) rr(ctx, -back + 0.25, -hw + 0.2, front + back - 2.9, hw * 2 - 0.4, 0.2, 'rgba(0,0,0,.07)', COL.ink);
    else rr(ctx, -back + 0.35, -hw + 0.25, 0.5, hw * 2 - 0.5, 0.2, 'rgba(255,255,255,.6)', COL.ink);
    if (o.rack) for (const s of [-1, 1]) { ctx.fillStyle = COL.ink; ctx.fillRect(-back + 0.5, s * (hw - 0.3) - 0.05, front + back - 2.4, 0.1); }
  }
  ctx.restore();
}
function neighbour(ctx, px, p) {
  const back = 1.0, front = p.len - 1.0;
  if (p.len >= 6.5) vehicle(ctx, px, p.x, p.y1 - back, -PI / 2, back, front, 1.0, COL.box, { kind: 'box' });
  else vehicle(ctx, px, p.x, p.y1 - back, -PI / 2, back, front, 0.9, COL[p.col] || COL.lav, { bed: p.len >= 5.4 });
}

export function drawScene(ctx, L, st, opt = {}) {
  const px = opt.px || 0.05, snow = L.set.scene === 'snow';
  ctx.fillStyle = snow ? COL.groundSnow : COL.ground; ctx.fillRect(0, 0, L.W, L.H);
  if (L.kind === 'car') {
    const m = L.m, fr = (x0, y, x1, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.min(m(x0), m(x1)), y, Math.abs(m(x1) - m(x0)), h); };
    fr(12.15, 0, 15, L.H, snow ? COL.walkSnow : COL.walk); fr(-1, 0, 0.45, L.H, snow ? COL.walkSnow : COL.walk);
    fr(12, 0, 12.18, L.H, COL.curb); fr(0.4, 0, 0.52, L.H, COL.curb);
    fr(5.45, 0, 5.55, L.H, COL.butter); fr(5.65, 0, 5.75, L.H, COL.butter);
    fr(9.6, 0, 9.68, L.H, COL.paint); fr(2.7, 0, 2.78, L.H, COL.paint);
    if (snow) {
      // banks pushed up along both curbs, broken where the spot and driveways are
      ctx.lineWidth = px; ctx.strokeStyle = COL.ink;
      for (let y = 0.4; y < L.H; y += 3.1) {
        if (y + 2.4 > L.spot.gapY0 && y < L.spot.gapY1) continue;
        rr(ctx, Math.min(m(12.25), m(12.95)), y, 0.7, 2.4, 0.35, '#ffffff', COL.ink);
      }
    }
    for (let y = 1.5; y < L.H; y += 3.6) fr(12.6, y, 13.4, 0.8, COL.curb);
    if (L.hydrant) {
      fr(12, L.hydrant.y0, 12.2, L.hydrant.y1 - L.hydrant.y0, COL.red);
      ctx.fillStyle = COL.red; ctx.beginPath(); ctx.arc(m(12.75), (L.hydrant.y0 + L.hydrant.y1) / 2, 0.34, 0, 7); ctx.fill();
      ctx.lineWidth = px; ctx.strokeStyle = COL.ink; ctx.stroke();
    }
    for (const p of L.parked) neighbour(ctx, px, p);
    for (const p of L.far) neighbour(ctx, px, p);
    if (opt.traffic != null) vehicle(ctx, px, L.laneX, opt.traffic, -PI / 2, 1.0, 3.5, 0.9, '#ffffff');
    const v = L.v;
    vehicle(ctx, px, st.x, st.y, st.h, L.back, L.front, L.hw, COL.sky, { wb: L.wb, steer: (opt.steer || 0) * L.steer, bed: v.bed, rack: v.rack });
    return;
  }
  // the dock
  ctx.fillStyle = COL.dock; ctx.fillRect(0, 0, L.W, DOCK_Y); ctx.fillStyle = COL.ink; ctx.fillRect(0, DOCK_Y - 0.06, L.W, 0.06);
  ctx.lineWidth = px;
  BAYS.forEach((x, i) => {
    ctx.fillStyle = i === L.target ? COL.butter : '#ffffff'; ctx.fillRect(x - 1.5, 0.15, 3, 0.85); ctx.strokeStyle = COL.ink; ctx.strokeRect(x - 1.5, 0.15, 3, 0.85);
    ctx.fillStyle = COL.ink; ctx.fillRect(x - 1.45, DOCK_Y, 0.3, 0.2); ctx.fillRect(x + 1.15, DOCK_Y, 0.3, 0.2);
    ctx.fillStyle = COL.paint; ctx.fillRect(x - 1.95, DOCK_Y, 0.1, 15); ctx.fillRect(x + 1.85, DOCK_Y, 0.1, 15);
  });
  ctx.font = `800 0.62px Manrope, system-ui, sans-serif`; ctx.fillStyle = COL.ink; ctx.textAlign = 'center';
  ctx.fillText(String(L.target + 1), BAYS[L.target], 0.82);
  if (snow) for (let x = 0.6; x < L.W; x += 4.4) rr(ctx, x, L.H - 1.2, 2.6, 0.8, 0.35, '#ffffff', COL.ink);
  BAYS.forEach((x, i) => { if (i !== L.target) vehicle(ctx, px, x, DOCK_Y + 0.05 + 2.5, PI / 2, 2.5, 13.5, 1.3, '#ffffff', { kind: 'trailer', axles: [0, -1.25] }); });
  const ax = st.x - Math.cos(st.p) * L.lt, ay = st.y - Math.sin(st.p) * L.lt;
  vehicle(ctx, px, ax, ay, st.p, L.tb, L.lt + L.tf, 1.3, '#ffffff', { kind: 'trailer', axles: L.lt > 9 ? [0, -1.25] : [0] });
  vehicle(ctx, px, st.x, st.y, st.h, L.back, L.front, L.hw, COL.sky, { kind: 'cab', sleeper: L.set.cab === 'sleeper', wb: L.wb, steer: (opt.steer || 0) * L.steer, axles: [-1.3] });
}

// ── the board ──────────────────────────────────────────────────────────────
function Board({ P, s, setS, active, done }) {
  const L = levelOf(P);
  const cvRef = useRef(null), wrapRef = useRef(null), stRef = useRef(null);
  const sim = useRef(null);
  if (!sim.current) sim.current = { st: { ...L.start }, v: 0, thr: 0, steer: 0, cool: 0, tY: L.H + 6, tWait: 1.2, honk: false, keys: {} };
  // a handle for the local headless check only; never set in a production build
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') window.__curbSim = sim.current;
  const [steerUi, setSteerUi] = useState(0);
  const [stopped, setStopped] = useState(true);
  const [toast, setToast] = useState(null);
  const [hold, setHold] = useState(0);
  const [touch, setTouch] = useState(false);
  const [wide, setWide] = useState(false);
  const toastT = useRef(null);
  const live = active && !done;
  const sRef = useRef(s); sRef.current = s;

  useEffect(() => {
    try {
      setTouch(!!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
      const mq = window.matchMedia('(min-width: 900px)'); const on = () => setWide(mq.matches); on();
      mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
      return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
    } catch (e) { return undefined; }
  }, []);

  const say = useCallback((t) => { setToast(t); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), 1500); }, []);

  // size the canvas to the room it has
  const size = useCallback(() => {
    const cv = cvRef.current, box = wrapRef.current; if (!cv || !box) return;
    const room = box.parentElement ? box.parentElement.clientWidth : 360;
    const maxW = wide ? Math.min(560, room - 300) : room;
    const maxH = Math.max(300, (typeof window !== 'undefined' ? window.innerHeight : 800) * (wide ? 0.78 : 0.5));
    let w = maxW, h = (w * L.H) / L.W;
    if (h > maxH) { h = maxH; w = (h * L.W) / L.H; }
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    cv.style.width = `${Math.round(w)}px`; cv.style.height = `${Math.round(h)}px`;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }, [L, wide]);
  useEffect(() => {
    size();
    let ro = null;
    try { ro = new ResizeObserver(() => size()); if (wrapRef.current && wrapRef.current.parentElement) ro.observe(wrapRef.current.parentElement); } catch (e) {}
    const onR = () => size(); window.addEventListener('resize', onR);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', onR); };
  }, [size]);

  const draw = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); const k = cv.width / L.W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const S = sim.current;
    const pose = done && sRef.current.fin ? sRef.current.fin : S.st;
    drawScene(ctx, L, pose, { px: 1 / k * ((typeof window !== 'undefined' && window.devicePixelRatio) || 1), steer: done ? 0 : S.steer, traffic: L.set.traffic && !done && S.tY < L.H + 5 ? S.tY : null });
  }, [L, done]);

  // the fixed-step simulation
  useEffect(() => {
    if (!live) { draw(); return undefined; }
    let raf = 0, last = performance.now(), acc = 0;
    const tick = (t) => {
      acc += Math.min(0.1, (t - last) / 1000); last = t;
      const S = sim.current;
      while (acc >= STEP) {
        acc -= STEP;
        if (S.keys.l) S.steer = Math.max(-1, S.steer - 1.7 * STEP);
        if (S.keys.r) S.steer = Math.min(1, S.steer + 1.7 * STEP);
        S.cool = Math.max(0, S.cool - STEP);
        const tgt = S.thr > 0 ? L.max : S.thr < 0 ? -L.max * 0.6 : 0;
        const a = S.thr ? 2.2 : 4.5;
        S.v += Math.sign(tgt - S.v) * Math.min(Math.abs(tgt - S.v), a * STEP);
        // traffic: up the lane on a loop, waiting behind you when you are in its way
        let tPoly = null;
        if (L.set.traffic && S.moved) {
          if (S.tWait > 0) S.tWait -= STEP;
          else {
            const ny = S.tY - TRAFFIC_SPEED * STEP, np = trafficPoly(L, ny);
            if (bodies(L, S.st).some((b) => overlap(b, np))) {
              if (!S.honk) { S.honk = true; say('Beep! A car is waiting behind you'); }
            } else { S.honk = false; S.tY = ny; if (S.tY < -6) { S.tY = L.H + 6; S.tWait = 7; } }
          }
          if (S.tY < L.H + 5) tPoly = trafficPoly(L, S.tY);
        }
        if (Math.abs(S.v) > 1e-5) {
          const ds = S.v * STEP;
          const n = advance(L, S.st, ds, S.steer);
          if (hits(L, n, tPoly ? [tPoly] : null)) {
            S.v = 0;
            if (!S.cool) {
              S.cool = 0.8;
              const jk = L.kind === 'truck' && Math.abs(wrap(n.h - n.p)) > 1.45;
              say(jk ? `Jackknife! +${BUMP_SEC}s` : `Bump! +${BUMP_SEC}s`);
              setS((st) => ({ ...st, bumps: (st.bumps || 0) + 1 }));
            }
          } else {
            S.st = n;
            if (!S.moved) { S.moved = true; setS((st) => (st.moved ? st : { ...st, moved: true })); }
          }
        }
      }
      setSteerUi(S.steer);
      setStopped(Math.abs(S.v) < 0.05);
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, L, draw, setS, say]);
  useEffect(() => { draw(); }, [draw, s.fin]);

  const park = useCallback(() => {
    const S = sim.current;
    if (!live || Math.abs(S.v) > 0.05) return;
    const m = measure(L, S.st);
    if (!m) {
      if (L.kind === 'car' && L.hydrant) {
        const ys = bodies(L, S.st)[0].map((p) => p[1]);
        if (Math.max(...ys) > L.hydrant.y0 && Math.min(...ys) < L.hydrant.y1 && Math.min(...ys) > L.spot.gapY0 - 0.3) { say('Keep clear of the red curb'); return; }
      }
      say(L.kind === 'car' ? 'Not in the spot yet' : 'The trailer is not in the bay yet');
      return;
    }
    S.thr = 0;
    setS((st) => {
      const pen = penaltySec(L, m, st.bumps || 0);
      return { ...st, parked: true, m, pen, fin: { ...S.st } };
    });
  }, [L, live, setS, say]);

  // the keyboard: arrows or WASD drive and steer, Space or Enter parks
  useEffect(() => {
    if (!live) return undefined;
    const S = sim.current;
    const down = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && e.target.type !== 'range')) return;
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { S.thr = 1; setHold(1); e.preventDefault(); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { S.thr = -1; setHold(-1); e.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { S.keys.l = true; e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { S.keys.r = true; e.preventDefault(); }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); park(); }
    };
    const up = (e) => {
      const k = e.key;
      if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(k)) { S.thr = 0; setHold(0); }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') S.keys.l = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') S.keys.r = false;
    };
    const blur = () => { S.thr = 0; S.keys = {}; setHold(0); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [live, park]);

  const pedal = (dir) => ({
    onPointerDown: (e) => { if (!live) return; e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} sim.current.thr = dir; setHold(dir); },
    onPointerUp: () => { if (sim.current.thr === dir) sim.current.thr = 0; setHold(0); },
    onPointerCancel: () => { sim.current.thr = 0; setHold(0); },
    onLostPointerCapture: () => { if (sim.current.thr === dir) sim.current.thr = 0; setHold((h) => (h === dir ? 0 : h)); },
    onContextMenu: (e) => e.preventDefault(),
  });

  const rows = s.parked && s.m ? penalties(L, s.m) : null;
  const bumps = s.bumps || 0;
  return (
    <div className={'crb' + (wide ? ' wd' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="crb-board" ref={wrapRef}>
        <canvas ref={cvRef} role="img" aria-label={dayLine(P.set)} />
        <div className={'crb-toast' + (toast ? ' on' : '')} aria-live="polite">{toast || ''}</div>
        <div className="crb-pill">{plural(bumps, 'bump')}</div>
      </div>
      <div className="crb-side">
        {live ? (
          <div className="crb-ctl">
            <div className="crb-steer">
              <b>Left</b>
              <input type="range" min={-100} max={100} step={1} aria-label="Steering wheel" value={Math.round(steerUi * 100)}
                onChange={(e) => { sim.current.steer = Number(e.target.value) / 100; setSteerUi(sim.current.steer); }} />
              <b>Right</b>
            </div>
            <div className="crb-mid"><button type="button" onClick={() => { sim.current.steer = 0; setSteerUi(0); }}>Straighten the wheel</button></div>
            <div className="crb-ped">
              <button type="button" className={hold === -1 ? 'hold' : ''} {...pedal(-1)}>Reverse</button>
              <button type="button" className="park" disabled={!stopped || !s.moved} onClick={park}>Park</button>
              <button type="button" className={hold === 1 ? 'hold' : ''} {...pedal(1)}>Drive</button>
            </div>
            <p className="crb-hint">{touch ? 'Hold Drive or Reverse to roll. Stop, then Park.' : 'Arrow keys or WASD drive and steer. Space or Enter parks.'}</p>
          </div>
        ) : null}
        {done && rows ? (
          <div className="crb-rows">
            {rows.map((r) => <div key={r.k}><span>{r.label}</span><b>{fmtV(r)}<em>{r.sec > 0.05 ? `+${r.sec.toFixed(1)}s` : 'clean'}</em></b></div>)}
            <div><span>Bumps</span><b>{bumps}<em>{bumps ? `+${bumps * BUMP_SEC}s` : 'clean'}</em></b></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
function vehicleName(P) {
  if (P.set.kind === 'truck') return `${TRAILERS[P.set.trailer].name}${P.set.cab === 'sleeper' ? ', sleeper cab' : ''}`;
  return CARS[P.set.car].name;
}
function bandLabel(P) { return P.sunday ? 'Sunday Edition' : BANDS[P.band].label; }

const GAME = {
  key: 'curb', name: 'Curb', cat: 'Visual', miss: null, wide: true,
  fresh: () => ({ bumps: 0, moved: false, parked: false, m: null, pen: 0, fin: null }),
  validSave: (P, s) => {
    if (!s || !Number.isInteger(s.bumps || 0) || (s.bumps || 0) < 0) return false;
    if (!s.parked) return true;
    // a stored park is measured again from its pose before it is believed
    if (!s.fin || !['x', 'y', 'h'].every((k) => Number.isFinite(s.fin[k]))) return false;
    const L = levelOf(P), m = measure(L, s.fin);
    if (!m || hits(L, s.fin)) return false;
    return Math.abs(penaltySec(L, m, s.bumps || 0) - s.pen) < 0.01;
  },
  touched: (s) => !!s.moved || (s.bumps || 0) > 0,
  solved: (P, s) => !!s.parked,
  count: (s) => s.bumps || 0,
  // Park or not: 10 for a park, 0 for a give-up. The ranked time is the clock
  // plus the accuracy and bump seconds (extraSec); plain board order ranks it.
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0 }),
  extraSec: (P, s, won) => (won ? Math.round(s.pen || 0) : 0),
  metric: () => null,
  title: (P, s, won) => (won ? (P.set.kind === 'truck' ? 'Docked' : 'Parked') : endSolved(false)),
  Board,
  sundayLabel: () => 'Sunday Edition',
  eyebrow: (P) => `No. ${P.num} · ${bandLabel(P)} · ${vehicleName(P)}`,
  foot: (P, s) => `${plural(s.bumps || 0, 'bump')} · ranked on time plus accuracy`,
  gateTitle: (P) => (P.sunday ? 'Today’s Curb: the Sunday Edition' : `Today’s Curb: ${BANDS[P.band].label}`),
  gateLine: (P) => `${dayLine(P.set)} Your time counts, and so does every inch from the ${P.set.kind === 'truck' ? 'dock' : 'curb'} and every degree off straight.`,
  rules: (P) => ({
    lead: P.set.kind === 'truck' ? 'Back the trailer into the yellow bay.' : 'Parallel park in the gap.',
    banner: 'Everyone gets the same spot today.',
    steps: [
      <>Set the wheel with the <b>steering slider</b>, then hold <b>Drive</b> or <b>Reverse</b> to roll. On a keyboard, arrow keys or WASD drive and steer.</>,
      P.set.kind === 'truck'
        ? <>Back the trailer straight into the <b>yellow bay</b> and up to the dock. In reverse the trailer swings the <b>opposite</b> way you steer, and a short trailer swings faster. Fold it too far and it jackknifes.</>
        : <>Park between the two cars on the {P.set.side === 'R' ? 'right' : 'left'}, close to the curb.{P.set.hydrant ? <> Keep clear of the <b>red curb</b> by the hydrant.</> : null}{P.set.traffic ? <> A car comes up the lane behind you: it waits if you are in its way, but touching it is a bump.</> : null}</>,
      <>Stop and press <b>Park</b> (Space or Enter) when you are in.</>,
      <>Your ranked time is the clock plus seconds for every inch from the {P.set.kind === 'truck' ? 'dock' : 'curb'}, every degree off straight and being off center, plus <b>{BUMP_SEC} seconds a bump</b>. Lowest wins.</>,
    ],
    knack: P.set.kind === 'truck'
      ? 'Swing wide first so the trailer starts in line with the bay, then back slowly with small corrections. Pull forward to straighten out rather than fighting a fold.'
      : 'Pull up alongside the car in front, back until your rear wheels pass its bumper, turn hard toward the curb, then straighten and turn away as you slide in.',
    footer: 'The gap tightens through the week, from Gentle on Monday to Tough on Saturday. The vehicle, the curb side, hydrants and traffic change by the day. The Sunday Edition is a tractor-trailer at a loading dock.',
  }),
  pitch: (P) => (P.set.kind === 'truck' ? 'Back a tractor-trailer into the dock.' : 'Parallel park, closer and faster than everyone else.'),
  shareLine: (P, s, won, el) => (won && s.m
    ? `Curb #${P.num} · ${P.set.kind === 'truck' ? 'Docked' : 'Parked'} in ${el} · ${Math.round(s.m.gap)} in from the ${P.set.kind === 'truck' ? 'dock' : 'curb'}, ${s.m.ang.toFixed(1)}° off · ${plural(s.bumps || 0, 'bump')}`
    : `Curb #${P.num} · not parked`),
  detail: (P, s, won, el) => (won && s.m
    ? `${el} ranked · ${Math.round(s.m.gap)} in from the ${P.set.kind === 'truck' ? 'dock' : 'curb'} · ${s.m.ang.toFixed(1)}° off · ${plural(s.bumps || 0, 'bump')}`
    : `Not parked · ${vehicleName(P)}`),
  aboutTitle: 'About Curb',
  about: [
    'Curb is a free daily parking game from Mind Loft. On weekdays you parallel park between two parked cars; on Sundays you back a tractor-trailer into a loading dock. The car steers like a real one: the front wheels turn and the car swings around its rear axle, so you have to swing wide, back in and straighten up the way you would on a real street.',
    'Every day brings a different spot. The vehicle changes, from a compact to a pickup or a van with a ladder rack, the curb is sometimes on the left, a hydrant can take part of the gap, and traffic can come up the lane behind you. The room in the gap shrinks through the week, from plenty on Monday to barely enough on Saturday. Every spot is proved parkable by computer, with the same steering, before it is published.',
    'You are ranked on one time: how long you took, plus seconds for every inch you finish from the curb, every degree you are off straight and how far off center you sit, plus five seconds for every bump. The Sunday Edition is a real test of backing a trailer, which swings the opposite way you steer.',
  ],
};

export default function CurbClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
