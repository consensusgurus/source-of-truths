'use client';

// THE PROGRESS MAP (owner, 2026-11-23: "an amazing full screen visualization
// for players in the various databases that show progress to completion").
//
// Every question a database can serve is one square, grouped by topic (and, in
// a topic's close-up, by subtopic) in a treemap sized by how many questions each
// holds. A square lights in the topic's colour once answered right, faintly
// once missed, and stays grey until played. Squares fill in the order sets are
// dealt (oldest first), so a topic fills from its top-left as the player goes.
// On opening, the answered squares sweep in, then the ones answered since the
// last look pop. The record is this browser's (lib/qdb-done.js); the layout is
// one cached request (/api/trivia/map), keys only.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStageChrome } from './GauntletScreens';
import { softGround } from '@/lib/category-ramp';
import { laneLabel } from '@/lib/qdb';
import { readDone, clearFresh } from '@/lib/qdb-done';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const etDay = () => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()); } catch (e) { return ''; } };
const pctOf = (a, n) => (n ? (a / n) * 100 : 0);
const pctTxt = (p) => (p <= 0 ? '0' : p >= 100 ? '100' : p < 10 ? p.toFixed(1).replace(/\.0$/, '') : String(Math.floor(p)));
const MILESTONES = [1, 10, 25, 50, 75, 100];
const RANKS = [[0, 'Newcomer'], [1, 'Explorer'], [5, 'Regular'], [10, 'Scholar'], [25, 'Expert'], [50, 'Sage'], [75, 'Oracle'], [100, 'Completist']];
const rankFor = (p) => RANKS.filter(([m]) => p >= m).pop()[1];
const REVEAL_MS = 1300;
const POP_MS = 900;

function hexRgb(h) { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '')); if (!m) return [128, 128, 128]; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { const x = hexRgb(a); const y = hexRgb(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; }

// Squarified treemap: values (any order) into rect x,y,w,h; returns rects in the values' order.
function squarify(vals, x, y, w, h) {
  const idx = vals.map((v, i) => [Math.max(v, 1e-6), i]).sort((a, b) => b[0] - a[0]);
  const total = idx.reduce((s, [v]) => s + v, 0);
  const sc = (w * h) / total;
  const out = new Array(vals.length);
  let row = [];
  const worst = (r, side) => { if (!r.length) return Infinity; const s = r.reduce((a, [v]) => a + v, 0); const mx = r[0][0]; const mn = r[r.length - 1][0]; return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
  const lay = (r) => {
    const s = r.reduce((a, [v]) => a + v, 0);
    if (w >= h) { const rw = s / h; let yy = y; for (const [v, i] of r) { const rh = v / rw; out[i] = { x, y: yy, w: rw, h: rh }; yy += rh; } x += rw; w -= rw; }
    else { const rh = s / w; let xx = x; for (const [v, i] of r) { const rw = v / rh; out[i] = { x: xx, y, w: rw, h: rh }; xx += rw; } y += rh; h -= rh; }
  };
  const areas = idx.map(([v, i]) => [v * sc, i]);
  let k = 0;
  while (k < areas.length) {
    const side = Math.min(w, h);
    if (!row.length || worst([...row, areas[k]], side) <= worst(row, side)) { row.push(areas[k]); k++; }
    else { lay(row); row = []; }
  }
  if (row.length) lay(row);
  return out;
}

// Rects for a view, each with room for a label when it is big enough, and one cell size that fits them all.
function layout(items, W, H) {
  const GAP = W < 600 ? 6 : 10;
  const rects = squarify(items.map((it) => it.n), 0, 0, W + GAP, H + GAP).map((r) => ({ x: r.x, y: r.y, w: Math.max(0, r.w - GAP), h: Math.max(0, r.h - GAP) }));
  const PAD = 5;
  const boxes = rects.map((r) => {
    const label = r.w >= 96 && r.h >= 58;
    const top = label ? 26 : PAD;
    return { ...r, label, ix: r.x + PAD, iy: r.y + top, iw: Math.max(0, r.w - PAD * 2), ih: Math.max(0, r.h - top - PAD) };
  });
  // Each box takes the biggest square that fits its own questions, so every box is
  // filled edge to edge; the treemap already sizes the boxes by count.
  // The pitch may be fractional, so a box fills to the pixel: try every column count.
  const fit = (b, n) => { let best = 0; const N2 = Math.max(1, n); for (let c = 1; c <= Math.max(1, Math.floor(b.iw)); c++) { const v = Math.min(b.iw / c, b.ih / Math.ceil(N2 / c)); if (v > best) best = v; if (b.iw / c < best) break; } return Math.max(1, best); };
  boxes.forEach((b, i) => {
    let c = fit(b, items[i].n);
    // A sliver too tight for its label gives the label's room back.
    if (b.label && c < 1.6) { b.label = false; b.iy = b.y + PAD; b.ih = Math.max(0, b.h - PAD * 2); c = fit(b, items[i].n); }
    // Whole-pixel pitch once squares are big enough to show their gaps, so the gaps stay even.
    b.s = Math.min(c >= 4 ? Math.floor(c) : c, 26);
    b.cols = Math.max(1, Math.floor(b.iw / b.s + 1e-6));
    // Centre the squares in the box.
    const rows = Math.ceil(items[i].n / b.cols);
    b.ix += Math.max(0, (b.iw - b.cols * b.s) / 2);
    b.iy += Math.max(0, (b.ih - rows * b.s) / 2);
  });
  const s = Math.max(...boxes.map((b) => b.s), 1);
  return { boxes, s };
}

export default function QdbMap({ db, dbKey, topics, ink, dark, focus: focus0 = null, onClose, onPlay }) {
  const bg = dark ? '#0b0f1a' : '#ffffff';
  useStageChrome(bg);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [focus, setFocus] = useState(focus0);
  const [sel, setSel] = useState(null);
  const [hover, setHover] = useState(null);
  const [size, setSize] = useState({ W: 0, H: 0 });
  const [tick, setTick] = useState(0);
  const rec = useRef(null);
  if (!rec.current) { const r = readDone(dbKey); rec.current = { d: { ...r.d }, fresh: new Set(r.f) }; }
  const wrap = useRef(null);
  const cvs = useRef(null);
  const anim = useRef({ t0: 0, raf: 0, done: false });

  // Back closes the map first, the way it closes a game.
  const pushed = useRef(false);
  const pending = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onClose = () => closeRef.current();
    try { window.history.pushState({ qdbMap: 1 }, '', window.location.href); pushed.current = true; } catch (e) {}
    const onPop = () => { pushed.current = false; onClose(); const f = pending.current; pending.current = null; if (f) f(); };
    window.addEventListener('popstate', onPop);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('popstate', onPop); document.body.style.overflow = o; };
  }, []);
  const close = useCallback(() => { if (pushed.current) { try { window.history.back(); return; } catch (e) {} } onClose(); }, [onClose]);
  // Play from the map: its history step goes first, then the game opens (and pushes its own).
  const play = (...a) => { pending.current = () => onPlay(...a); if (pushed.current) { try { window.history.back(); return; } catch (e) {} } pending.current = null; onClose(); onPlay(...a); };
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') { if (focus && !focus0) setFocus(null); else close(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [close, focus, focus0]);

  useEffect(() => {
    let live = true;
    fetch(`/api/trivia/map?db=${dbKey}&d=${etDay()}`).then((r) => r.json()).then((d) => { if (live) { if (d && Array.isArray(d.topics)) setData(d); else setErr(true); } }).catch(() => live && setErr(true));
    return () => { live = false; };
  }, [dbKey]);
  // Looked at: the fresh squares pop this once.
  useEffect(() => { if (data) clearFresh(); }, [data]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setSize({ W: Math.floor(el.clientWidth), H: Math.floor(el.clientHeight) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  // Each topic and lane with its keys' states: 0 not yet, 1 right, 2 missed; +4 fresh.
  const model = useMemo(() => {
    if (!data) return null;
    const d = rec.current.d; const fresh = rec.current.fresh;
    let total = 0; let ans = 0; let right = 0; let nFresh = 0;
    const ts = data.topics.map((t) => {
      const card = topics.find((x) => x.slug === t.slug) || {};
      let ta = 0; let tr = 0;
      const lanes = t.lanes.map(([lane, ks]) => {
        const keys = ks ? ks.split(' ') : [];
        const st = new Uint8Array(keys.length);
        let a = 0; let r = 0;
        keys.forEach((k, i) => { const v = d[k]; if (v) { a++; if (v === 1) r++; st[i] = v | (fresh.has(k) ? 4 : 0); if (fresh.has(k)) nFresh++; } });
        ta += a; tr += r;
        return { lane, keys, st, n: keys.length, a, r };
      });
      total += t.n; ans += ta; right += tr;
      return { slug: t.slug, label: card.label || t.slug, color: card.color || '#94a3b8', n: t.n, a: ta, r: tr, lanes };
    });
    return { total, ans, right, nFresh, topics: ts };
  }, [data, topics]);

  const ft = model && focus ? model.topics.find((t) => t.slug === focus) : null;
  // The items on screen: the topics, or one topic's lanes.
  const items = useMemo(() => {
    if (!model) return [];
    if (ft) return ft.lanes.filter((l) => l.n).map((l) => ({ id: l.lane, label: laneLabel(l.lane), color: ft.color, n: l.n, a: l.a, r: l.r, lanes: [l], topic: ft }));
    return model.topics.filter((t) => t.n).map((t) => ({ id: t.slug, label: t.label, color: t.color, n: t.n, a: t.a, r: t.r, lanes: t.lanes, topic: t }));
  }, [model, ft]);
  const lay = useMemo(() => (size.W > 40 && size.H > 40 && items.length ? layout(items, size.W, size.H) : null), [items, size]);

  // A fresh sweep on every new view.
  useEffect(() => { anim.current.t0 = 0; anim.current.done = false; setTick((x) => x + 1); }, [lay]);

  const pal = useMemo(() => {
    const none = mix(ink, bg, dark ? 0.88 : 0.92);
    const memo = {};
    const c = (hex) => {
      if (!memo[hex]) memo[hex] = dark ? { r: hex, m: mix(hex, bg, 0.62) } : { r: softGround(hex, 0.12), m: softGround(hex, 0.68) };
      return memo[hex];
    };
    return { none, c, frame: ink };
  }, [ink, bg, dark]);

  const draw = useCallback((now) => {
    const cv = cvs.current;
    if (!cv || !lay) return true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const { W, H } = size;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = reduce ? REVEAL_MS + POP_MS : now - anim.current.t0;
    const p = Math.min(1, el / REVEAL_MS);
    const pp = el > REVEAL_MS ? Math.min(1, (el - REVEAL_MS) / POP_MS) : 0;
    const span = W + H;
    let busy = p < 1 || (pp < 1 && model.nFresh > 0);
    lay.boxes.forEach((b, bi) => {
      const it = items[bi];
      const col = pal.c(it.color);
      // the frame: 1px ink, the site's outline
      g.lineWidth = 1;
      g.strokeStyle = pal.frame;
      g.globalAlpha = 1;
      const rr = Math.min(10, b.w / 6, b.h / 6);
      g.beginPath();
      if (g.roundRect) g.roundRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, rr); else g.rect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      g.stroke();
      const s = b.s;
      const cs = Math.max(1, Math.round(s) - (s >= 3.5 ? 1 : 0));
      const hl = hover && hover.bi === bi && !ft ? hover.li : -1;
      let i = 0;
      for (let li = 0; li < it.lanes.length; li++) {
        const L = it.lanes[li];
        const dim = hl >= 0 && hl !== li;
        for (let j = 0; j < L.n; j++, i++) {
          const cx = Math.round(b.ix + (i % b.cols) * s);
          const cy = Math.round(b.iy + Math.floor(i / b.cols) * s);
          let v = L.st[j];
          const fresh = v & 4; v &= 3;
          let show = v && (cx + cy) / span <= p * 1.05;
          if (fresh && pp === 0 && p >= 1) show = false;
          g.globalAlpha = dim ? 0.35 : 1;
          if (!show || (fresh && el <= REVEAL_MS)) { g.fillStyle = pal.none; g.fillRect(cx, cy, cs, cs); }
          else if (fresh && pp < 1) {
            const k = Math.sin(pp * Math.PI);
            const z = cs * (1 + 0.9 * k);
            g.fillStyle = v === 1 ? col.r : col.m;
            g.fillRect(cx + cs / 2 - z / 2, cy + cs / 2 - z / 2, z, z);
          } else { g.fillStyle = v === 1 ? col.r : col.m; g.fillRect(cx, cy, cs, cs); }
        }
      }
    });
    g.globalAlpha = 1;
    return !busy;
  }, [lay, size, items, pal, hover, ft, model]);

  useEffect(() => {
    if (!lay) return undefined;
    const a = anim.current;
    cancelAnimationFrame(a.raf);
    if (a.done) { draw(performance.now() + 1e7); return undefined; }
    const step = (now) => {
      if (!a.t0) a.t0 = now;
      const fin = draw(now);
      if (fin) { a.done = true; return; }
      a.raf = requestAnimationFrame(step);
    };
    a.raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(a.raf);
  }, [lay, draw, tick]);

  const hit = (e) => {
    if (!lay || !cvs.current) return null;
    const r = cvs.current.getBoundingClientRect();
    const x = e.clientX - r.left; const y = e.clientY - r.top;
    const bi = lay.boxes.findIndex((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (bi < 0) return null;
    const b = lay.boxes[bi]; const it = items[bi];
    let li = 0;
    const c = Math.floor((x - b.ix) / b.s); const rw = Math.floor((y - b.iy) / b.s);
    if (c >= 0 && c < b.cols && rw >= 0) {
      let i = rw * b.cols + c;
      for (li = 0; li < it.lanes.length; li++) { if (i < it.lanes[li].n) break; i -= it.lanes[li].n; }
      if (li >= it.lanes.length) li = -1;
    } else li = -1;
    return { bi, li, x, y };
  };
  const onMove = (e) => {
    const h = hit(e);
    if (!h) { if (hover) setHover(null); return; }
    if (!hover || hover.bi !== h.bi || hover.li !== h.li || Math.abs(hover.x - h.x) > 6 || Math.abs(hover.y - h.y) > 6) setHover(h);
  };
  const onTap = (e) => {
    const h = hit(e);
    if (!h) return;
    const it = items[h.bi];
    if (!ft) { setFocus(it.id); setSel(null); setHover(null); }
    else setSel(it.id);
  };

  const P = model ? pctOf(model.ans, model.total) : 0;
  const scope = ft || model;
  const SP = scope ? pctOf(scope.a != null ? scope.a : scope.ans, scope.n || scope.total) : 0;
  const next = MILESTONES.find((m) => m > P) || null;
  const toNext = model && next ? Math.ceil((next / 100) * model.total) - model.ans : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!model) return undefined;
    let raf = 0; let t0 = 0;
    const target = SP;
    const step = (now) => { if (!t0) t0 = now; const k = Math.min(1, (now - t0) / REVEAL_MS); setShown(target * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [model, SP, focus]);

  const tip = hover && hover.li >= 0 ? (() => {
    const it = items[hover.bi]; const L = it.lanes[hover.li];
    return { title: ft ? laneLabel(L.lane) : `${it.label}: ${laneLabel(L.lane)}`, line: `${fmt(L.a)} of ${fmt(L.n)} answered${L.a ? ` · ${Math.round((L.r / L.a) * 100)}% right` : ''}`, x: hover.x, y: hover.y };
  })() : hover ? (() => { const it = items[hover.bi]; return { title: it.label, line: `${fmt(it.a)} of ${fmt(it.n)} answered`, x: hover.x, y: hover.y }; })() : null;

  const selL = ft && sel ? ft.lanes.find((l) => l.lane === sel) : null;
  const rows = ft ? ft.lanes.filter((l) => l.n) : model ? model.topics.filter((t) => t.n) : [];

  return (
    <div className={`qm${dark ? ' dk' : ''}`} role="dialog" aria-modal="true" aria-label={`${db.name}: your progress map`} style={{ '--qm-bg': bg, '--qm-ink': ink }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="qm-head">
        <div className="qm-hl">
          <span className="qm-eye">{ft ? <button type="button" className="qm-back" onClick={() => { setFocus(null); setSel(null); }}>← {db.name}</button> : db.name} · Your Map</span>
          <div className="qm-big">
            <span className="qm-pct">{pctTxt(shown)}<small>%</small></span>
            <span className="qm-of">
              <b>{ft ? ft.label : 'complete'}</b>
              {model ? <>{fmt(scope.a != null ? scope.a : scope.ans)} of {fmt(scope.n || scope.total)} {db.many} answered{(scope.a != null ? scope.a : scope.ans) ? ` · ${Math.round(((scope.r != null ? scope.r : scope.right) / (scope.a != null ? scope.a : scope.ans)) * 100)}% right` : ''}</> : 'Loading your map'}
            </span>
          </div>
        </div>
        <div className="qm-hr">
          {model ? <span className="qm-rank">{rankFor(P)}</span> : null}
          <button type="button" className="qm-x" onClick={close} aria-label="Close the map">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

      {model ? (
        <div className="qm-track" aria-hidden="true">
          <div className="qm-bar">
            {model.topics.filter((t) => t.n).map((t) => (
              <span key={t.slug} className="qm-seg" style={{ flexGrow: t.n, '--c': dark ? t.color : softGround(t.color, 0.12), opacity: ft && ft.slug !== t.slug ? 0.35 : 1 }}>
                <i style={{ width: `${pctOf(t.a, t.n)}%` }} />
              </span>
            ))}
          </div>
          <div className="qm-ticks">
            {MILESTONES.map((m) => <span key={m} className={P >= m ? 'on' : ''} style={{ left: `${m}%` }}>{m}%</span>)}
          </div>
          <p className="qm-next">{next ? <>Next stop: <b>{next}%</b>, {fmt(toNext)} more {toNext === 1 ? db.one : db.many} to go.</> : <b>Every {db.one} answered. New ones join each day after they run.</b>}</p>
        </div>
      ) : null}

      <div className="qm-body">
        <div className="qm-stage">
          {!data && !err ? <div className="qm-wait">Laying out {db.many}</div> : null}
          {err ? <div className="qm-wait">The map could not load. Try again in a moment.</div> : null}
          {data ? (
            <div className="qm-wrap" ref={wrap}>
              <canvas ref={cvs} className="qm-cv" style={{ width: size.W, height: size.H }} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onClick={onTap} />
              {lay ? lay.boxes.map((b, i) => (b.label ? (
                <button key={items[i].id} type="button" className="qm-lab" style={{ left: b.x + 8, top: b.y + 5, width: b.w - 16 }}
                  onClick={() => (ft ? setSel(items[i].id) : (setFocus(items[i].id), setSel(null)))}>
                  <span className="qm-ln">{items[i].label}</span>
                  <span className="qm-lp">{pctTxt(pctOf(items[i].a, items[i].n))}%{items[i].a >= items[i].n ? ' ✓' : ''}</span>
                </button>
              ) : null)) : null}
              {tip ? (
                <div className="qm-tip" style={{ left: Math.min(tip.x + 14, size.W - 230), top: tip.y + 18 > size.H - 60 ? tip.y - 62 : tip.y + 18 }}>
                  <b>{tip.title}</b><span>{tip.line}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="qm-legend" aria-hidden="true">
            <span><i className="r" /> Right</span><span><i className="m" /> Missed</span><span><i /> Not yet</span>
            <em>{ft ? 'Tap a subtopic' : 'Tap a topic to look closer'}</em>
          </div>
        </div>

        <aside className="qm-side">
          {model && !model.ans ? <p className="qm-empty">Every {db.one} you answer lights a square. There are {fmt(model.total)} to light.</p> : null}
          {selL ? (
            <div className="qm-card">
              <span className="qm-ct">{laneLabel(selL.lane)}</span>
              <span className="qm-cp">{pctTxt(pctOf(selL.a, selL.n))}% · {fmt(selL.n - selL.a)} left</span>
              <button type="button" className="qm-go" disabled={selL.a >= selL.n} onClick={() => play(ft.slug, [selL.lane], `${ft.label}: ${laneLabel(selL.lane)}`)}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>{selL.a >= selL.n ? 'All answered' : 'Play what is left'}
              </button>
            </div>
          ) : null}
          <ol className="qm-list">
            {rows.map((r) => {
              const id = ft ? r.lane : r.slug;
              const color = ft ? ft.color : r.color;
              const c = dark ? { r: color, m: mix(color, bg, 0.62) } : { r: softGround(color, 0.12), m: softGround(color, 0.68) };
              const on = ft ? sel === id : false;
              return (
                <li key={id}>
                  <button type="button" className={`qm-row${on ? ' on' : ''}`} onClick={() => (ft ? setSel(id) : (setFocus(id), setSel(null)))}>
                    <span className="qm-rn">{ft ? laneLabel(r.lane) : r.label}</span>
                    <span className="qm-rp">{pctTxt(pctOf(r.a, r.n))}%</span>
                    <span className="qm-rb"><i style={{ width: `${pctOf(r.r, r.n)}%`, background: c.r }} /><i style={{ width: `${pctOf(r.a - r.r, r.n)}%`, background: c.m }} /></span>
                    <span className="qm-rs">{fmt(r.a)} of {fmt(r.n)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {model ? (
            <button type="button" className="qm-go wide" onClick={() => (ft ? play(ft.slug, [], ft.label) : play('mix', [], null))}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
              {ft ? `Play the rest of ${ft.label}` : `Play a ${db.mix}`}
            </button>
          ) : null}
          <p className="qm-note">Your map lives in this browser. Sets deal the {db.many} you have not answered first.</p>
        </aside>
      </div>
    </div>
  );
}

// Plain CSS; no backticks inside.
const CSS = `
.qm{position:fixed;inset:0;z-index:92;background:var(--qm-bg);color:var(--qm-ink);font-family:'Manrope',system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden;animation:qm-in .28s ease-out;}
@keyframes qm-in{from{opacity:0;transform:scale(.985);}to{opacity:1;transform:none;}}
.qm button{font:inherit;color:inherit;}
.qm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:max(16px, env(safe-area-inset-top)) 26px 0;}
.qm-hl{min-width:0;}
.qm-eye{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;}
.qm-back{background:none;border:0;padding:0;cursor:pointer;font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:12px;text-decoration:underline;text-underline-offset:3px;}
.qm-big{display:flex;align-items:flex-end;gap:16px;margin-top:4px;}
.qm-pct{font-size:clamp(56px, 9vw, 112px);font-weight:800;letter-spacing:-0.05em;line-height:1;padding-bottom:.06em;font-variant-numeric:tabular-nums;}
.qm-pct small{font-size:.42em;letter-spacing:-0.02em;margin-left:2px;}
.qm-of{display:flex;flex-direction:column;gap:3px;padding-bottom:.9em;font-size:14px;font-weight:700;line-height:1.35;opacity:.92;}
.qm-of b{font-size:20px;font-weight:800;letter-spacing:-0.01em;}
.qm-hr{display:flex;align-items:center;gap:10px;flex:none;}
.qm-rank{padding:7px 14px;border:1px solid var(--qm-ink);border-radius:999px;font-size:12.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;}
.qm-x{width:44px;height:44px;border-radius:50%;border:1px solid var(--qm-ink);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;}
@media(hover:hover){.qm-x:hover{background:color-mix(in srgb, var(--qm-ink) 8%, transparent);}}
.qm-track{padding:8px 26px 0;}
.qm-bar{display:flex;gap:3px;height:14px;}
.qm-seg{position:relative;min-width:3px;border-radius:4px;overflow:hidden;background:color-mix(in srgb, var(--qm-ink) 9%, transparent);transition:opacity .2s;}
.qm-seg i{position:absolute;left:0;top:0;bottom:0;background:var(--c);transition:width 1.2s cubic-bezier(.2,.7,.2,1);}
.qm-ticks{position:relative;height:18px;margin-top:4px;}
.qm-ticks span{position:absolute;transform:translateX(-50%);font-size:11px;font-weight:800;opacity:.45;}
.qm-ticks span:last-child{transform:translateX(-100%);}
.qm-ticks span.on{opacity:1;}
.qm-next{margin:2px 0 0;font-size:13.5px;font-weight:700;}
.qm-body{flex:1;min-height:0;display:flex;gap:22px;padding:14px 26px max(18px, env(safe-area-inset-bottom));}
.qm-stage{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;}
.qm-wrap{position:relative;flex:1;min-height:0;}
.qm-cv{position:absolute;left:0;top:0;display:block;cursor:pointer;}
.qm-wait{flex:1;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;opacity:.6;}
.qm-lab{position:absolute;display:flex;align-items:baseline;gap:8px;height:18px;padding:0;border:0;background:none;cursor:pointer;font-size:12.5px;font-weight:800;line-height:18px;text-align:left;}
.qm-ln{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.qm-lp{flex:none;font-variant-numeric:tabular-nums;opacity:.8;}
.qm-tip{position:absolute;z-index:2;pointer-events:none;display:flex;flex-direction:column;gap:2px;max-width:220px;padding:8px 11px;border-radius:10px;background:var(--qm-ink);color:var(--qm-bg);font-size:12.5px;font-weight:700;line-height:1.35;box-shadow:0 8px 24px rgba(0,0,0,.22);}
.qm-tip b{font-weight:800;}
.qm-legend{display:flex;flex-wrap:wrap;align-items:center;gap:14px;font-size:12px;font-weight:800;}
.qm-legend span{display:inline-flex;align-items:center;gap:6px;}
.qm-legend i{width:11px;height:11px;border-radius:2px;background:color-mix(in srgb, var(--qm-ink) 9%, transparent);}
.qm-legend i.r{background:var(--qm-ink);}
.qm-legend i.m{background:color-mix(in srgb, var(--qm-ink) 35%, transparent);}
.qm-legend em{margin-left:auto;font-style:normal;opacity:.6;}
.qm-side{width:330px;flex:none;display:flex;flex-direction:column;gap:12px;min-height:0;}
.qm-empty{margin:0;padding:12px 14px;border:1px solid var(--qm-ink);border-radius:14px;font-size:13.5px;font-weight:700;line-height:1.45;}
.qm-card{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--qm-ink);border-radius:16px;}
.qm-ct{font-size:17px;font-weight:800;line-height:1.25;padding-bottom:.06em;}
.qm-cp{font-size:13px;font-weight:700;opacity:.8;}
.qm-list{list-style:none;margin:0;padding:0 4px 0 0;flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:2px;}
.qm-row{width:100%;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto 8px auto;column-gap:10px;row-gap:5px;padding:9px 10px;border:0;border-radius:0;background:transparent;cursor:pointer;text-align:left;}
.qm-row.on{background:color-mix(in srgb, var(--qm-ink) 9%, transparent);}
@media(hover:hover){.qm-row:hover{background:color-mix(in srgb, var(--qm-ink) 6%, transparent);}}
.qm-rn{font-size:14px;font-weight:800;line-height:1.3;padding-bottom:.06em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.qm-rp{font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;}
.qm-rb{grid-column:1 / -1;display:flex;height:8px;border-radius:4px;overflow:hidden;background:color-mix(in srgb, var(--qm-ink) 9%, transparent);}
.qm-rb i{display:block;height:100%;transition:width 1.2s cubic-bezier(.2,.7,.2,1);}
.qm-rs{grid-column:1 / -1;font-size:11.5px;font-weight:700;opacity:.65;}
.qm-go{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 18px;border:0;border-radius:999px;background:var(--qm-ink);color:var(--qm-bg) !important;font-size:15px;font-weight:800;cursor:pointer;}
.qm-go.wide{width:100%;flex:none;}
.qm-go:disabled{opacity:.45;cursor:default;}
@media(hover:hover){.qm-go:not(:disabled):hover{filter:brightness(1.12);}}
.qm-note{margin:0;font-size:11.5px;font-weight:700;opacity:.6;line-height:1.4;}
@media (max-width: 860px){
  .qm{overflow-y:auto;}
  .qm-head{padding:max(12px, env(safe-area-inset-top)) 16px 0;}
  .qm-big{gap:12px;}
  .qm-of{font-size:12.5px;padding-bottom:.7em;}
  .qm-of b{font-size:16px;}
  .qm-rank{display:none;}
  .qm-track{padding:6px 16px 0;}
  .qm-body{flex:none;flex-direction:column;padding:12px 16px max(16px, env(safe-area-inset-bottom));}
  .qm-wrap{flex:none;height:66vh;}
  .qm-stage{flex:none;}
  .qm-side{width:auto;}
  .qm-list{overflow:visible;flex:none;}
  .qm-legend em{display:none;}
}
`;
