'use client';

// TangledBoard — the rope board for Tangled (owner, 2026-11-07), ported from
// the approved mockup (project doc claude/tangled-mockup-2026-11-07.md).
//
// The ropes are drawn imperatively into two stacked SVGs, as in the mockup: a
// static layer (linen, the raised felt frame) and a live layer (holes, ropes,
// pegs) redrawn every animation frame while anything moves.
//
//  - Each rope is a verlet chain between its two pegs, so it swings and settles
//    like rope; a held end follows the finger, and an end that misses a hole
//    springs back to its own.
//  - ROPES ARE ONE CREAM CORD (owner); the PEGS carry the colour, and a rope's
//    two pegs never share one (lib/tangled-engine.js pegColours).
//  - THE PICTURE IS THE STATE (owner, 2026-11-09: "make it real"). The wraps
//    (lib/tangled-engine.js applyMove) say how many times each pair is wound
//    and which rope is on top at every turn. A pair wound twice or more is
//    drawn as a two-strand cord with exactly that many crossings, in that
//    over/under order; a single crossing shows its stored top; ropes that are
//    not wound never swap over/under on their own. While a peg is held, its
//    rope rides over the ropes it is not yet wound with: that is where it will
//    land when dropped.
//  - The two strands of a cord are held a rope's width apart at the widest, so
//    each one can be followed through every turn.
// The rules (what crosses, what is solved) are lib/tangled-engine.js, never the
// picture: crossing is the interleave test on the hole order.

import React, { useEffect, useRef } from 'react';
import { holes, framePath, emptyHoles, applyMove, isSolved, cloneWraps, cordFrame, PEG_PASTELS, CX, CY, RAD } from '@/lib/tangled-engine';

const SEG = 18;
const M = 140, AMP = 13;

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = (v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function segX(p1, p2, p3, p4) {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-6) return null;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  if (t <= 0 || t >= 1) return null;
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
}
function segHit(a, b, c, d) {
  const r1x = b.x - a.x, r1y = b.y - a.y, r2x = d.x - c.x, r2y = d.y - c.y, den = r1x * r2y - r1y * r2x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * r2y - (c.y - a.y) * r2x) / den, u = ((c.x - a.x) * r1y - (c.y - a.y) * r1x) / den;
  return (t > 0 && t < 1 && u > 0 && u < 1) ? { t, u } : null;
}
function arcInfo(P) {
  const cum = [0];
  for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k].x - P[k - 1].x, P[k].y - P[k - 1].y));
  return { P, cum, L: cum[cum.length - 1] };
}
function at(A, u) {
  const { P, cum } = A;
  let k = 1;
  while (k < cum.length - 1 && cum[k] < u) k++;
  const a = P[k - 1], b = P[k], seg = (cum[k] - cum[k - 1]) || 1e-6, t = Math.max(0, Math.min(1, (u - cum[k - 1]) / seg));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, tx: (b.x - a.x) / seg, ty: (b.y - a.y) / seg };
}
function pieceD(A, s0, s1) {
  s0 = Math.max(0, s0); s1 = Math.min(A.L, s1);
  const { P, cum } = A;
  const pts = [at(A, s0)];
  for (let k = 0; k < P.length; k++) if (cum[k] > s0 && cum[k] < s1) pts.push(P[k]);
  pts.push(at(A, s1));
  return 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L');
}

// The whole board as one closure over its own state, mounted into two SVGs.
function makeBoard(bgEl, svgEl, opts) {
  const P0 = opts.puzzle;
  const pid = opts.pid;
  const pos = holes(P0.shape, P0.H);
  const G = { ropes: (opts.ropes || P0.ropes).map((r) => r.slice()), solved: P0.solved, H: P0.H, shape: P0.shape };
  let drag = null, sel = null, finished = !opts.live, giving = false, loopOn = false, raf = 0, dead = false;
  let zorder = G.ropes.map((_, i) => i);
  let W = cloneWraps(opts.wraps || P0.wraps || {});
  let CORD = {};
  const TG = [];
  let pegDefs = '';

  const R = G.ropes.map((rp, i) => {
    const a = pos[rp[0]], b = pos[rp[1]], pts = [];
    for (let k = 0; k <= SEG; k++) { const t = k / SEG, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; pts.push({ x, y, px: x, py: y }); }
    return { ends: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }], pts, slack: 0, peg: P0.pegs[i] };
  });

  const DEFS = `<defs>
<filter id="${pid}felt" filterUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="440"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0" result="na"/><feComposite in="na" in2="SourceGraphic" operator="in" result="nm"/><feBlend in="SourceGraphic" in2="nm" mode="multiply"/></filter>
<filter id="${pid}fs" filterUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="440"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".18"/></filter>
<filter id="${pid}rs" filterUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="440"><feDropShadow dx="1" dy="2" stdDeviation="1.2" flood-color="#1d1f24" flood-opacity=".3" result="a"/><feDropShadow in="a" dx="2" dy="5" stdDeviation="4" flood-color="#1d1f24" flood-opacity=".22"/></filter>
<filter id="${pid}linen" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><feTurbulence type="fractalNoise" baseFrequency="1.4 .06" numOctaves="1" seed="7" result="h"/><feTurbulence type="fractalNoise" baseFrequency=".06 1.4" numOctaves="1" seed="9" result="v"/><feBlend in="h" in2="v" mode="multiply" result="w"/><feColorMatrix in="w" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.45 .3" result="wa"/><feComposite in="wa" in2="SourceGraphic" operator="in" result="wm"/><feBlend in="SourceGraphic" in2="wm" mode="multiply"/></filter>
<radialGradient id="${pid}gr" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="var(--tg-gr1)"/><stop offset="1" stop-color="var(--tg-gr2)"/></radialGradient>
<filter id="${pid}soft" filterUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="440"><feGaussianBlur stdDeviation="2.4"/></filter>
<radialGradient id="${pid}hole" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#0c0d0f"/><stop offset=".7" stop-color="#1c1e22"/><stop offset="1" stop-color="#4a4d54"/></radialGradient>
</defs>`;

  function buildStatic() {
    const fp = framePath(G.shape);
    const ring = (w, stroke, extra) => (fp
      ? `<path d="${fp}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="miter" stroke-miterlimit="3" ${extra || ''}/>`
      : `<circle cx="${CX}" cy="${CY}" r="${RAD}" fill="none" stroke="${stroke}" stroke-width="${w}" ${extra || ''}/>`);
    let s = DEFS;
    s += `<rect x="0" y="0" width="400" height="400" fill="var(--tg-linen)" filter="url(#${pid}linen)"/>`;
    s += `<g filter="url(#${pid}fs)">${ring(47, 'var(--tg-felt-edge)')}</g>`;
    s += `<g filter="url(#${pid}felt)">${ring(45, 'var(--tg-felt-edge)')}${ring(39, 'var(--tg-felt)')}${ring(22, 'var(--tg-felt-rim)', 'stroke-opacity=".55"')}</g>`;
    bgEl.innerHTML = s;
    pegDefs = DEFS.replace('</defs>', PEG_PASTELS.map((c, i) => `<radialGradient id="${pid}peg${i}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${shade(c, 0.5)}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.3)}"/></radialGradient>`).join('') + '</defs>');
  }

  const dragging = () => !!(drag && drag.moved);
  function endTarget(r, e) {
    if (dragging() && drag.r === r && drag.e === e) return drag.pt;
    return pos[G.ropes[r][e]];
  }
  function chords() {
    return R.map((rp) => { const a = rp.ends[0], b = rp.ends[1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { a, b, L, dx: (b.x - a.x) / L, dy: (b.y - a.y) / L }; });
  }
  // Keep CORD in step with the wraps: a pair wound twice or more is a cord,
  // eased in after a move and faded out once it unwinds below two turns.
  function easeCords(instant) {
    let moving = false;
    for (const k in W) {
      if (W[k].c.length < 2) continue;
      let rec = CORD[k];
      if (!rec) { rec = CORD[k] = { amt: instant ? 1 : 0 }; moving = true; }
      rec.c = W[k].c.slice(); rec.a = W[k].a.slice();
      if (rec.amt < 1) { rec.amt = Math.min(1, rec.amt + 0.08); moving = true; }
    }
    for (const k in CORD) {
      if (W[k] && W[k].c.length >= 2) continue;
      const rec = CORD[k];
      rec.amt = Math.max(0, rec.amt - 0.08); moving = true;
      if (rec.amt <= 0) delete CORD[k];
    }
    return moving;
  }
  // Each cord: a straight two-strand twist from its side A pegs' middle to its
  // side B pegs' middle (lib/tangled-engine.js cordFrame). s runs 0..1 from
  // side A; the strands cross where cos(pi N s) is zero, exactly N times, and
  // turn m (from side A) has rope c[m] on top. Always drawn, however cramped.
  function cordList() {
    const out = [];
    for (const k in CORD) {
      const rec = CORD[k];
      if (rec.amt < 0.01) continue;
      const [i, j] = k.split('-').map(Number), N = rec.c.length;
      const iA = R[i].ends[rec.a[0]], iB = R[i].ends[1 - rec.a[0]], jA = R[j].ends[rec.a[1]], jB = R[j].ends[1 - rec.a[1]];
      const F = cordFrame(iA, iB, jA, jB), n = { x: -F.d.y, y: F.d.x };
      const sg = ((iA.x - jA.x) * n.x + (iA.y - jA.y) * n.y) >= 0 ? 1 : -1;
      const half = Math.max(12 * N + 8, Math.min(100, F.room, 16 + 26 * N));
      // a cramped twist winds tighter rather than overrunning its pegs
      const amp = Math.min(AMP, Math.max(10.5, ((2 * half) / N) * 0.3));
      out.push({ i, j, key: k, N, M: F.M, d: F.d, n, sg, Lc: 2 * half, amp, amt: rec.amt, c: rec.c, a: rec.a });
    }
    return out;
  }
  function chainAt(r, f) {
    const P = R[r].pts, x = Math.max(0, Math.min(1, f)) * SEG, i0 = Math.min(SEG - 1, Math.floor(x)), tt = x - i0;
    return { x: P[i0].x + (P[i0 + 1].x - P[i0].x) * tt, y: P[i0].y + (P[i0 + 1].y - P[i0].y) * tt };
  }
  // Rope r's drawn path: straight tails from its pegs into each cord it is
  // wound in, along that cord's strand, then on to the other peg; the chain's
  // sag and swing laid over the tails. Every point carries its cord tag
  // { key, v } (or null), so the over/under is read off the wraps exactly.
  function shapedRope(r, C, T) {
    const E0 = R[r].ends[0], E1 = R[r].ends[1];
    const items = T.filter((t) => t.i === r || t.j === r)
      .map((t) => {
        const at = Math.max(0, Math.min(1, ((t.M.x - C[r].a.x) * C[r].dx + (t.M.y - C[r].a.y) * C[r].dy) / C[r].L));
        // walking rope r from its end 0 runs from side A when that end is at side A
        return { t, at, fwd: (t.i === r ? t.a[0] : t.a[1]) === 0 };
      })
      .sort((p, q) => p.at - q.at);
    let pts = [{ x: E0.x, y: E0.y, tag: null }];
    for (const it of items) {
      const t = it.t, side = t.i === r ? t.sg : -t.sg, NS = 16 + 8 * t.N;
      for (let q = 0; q <= NS; q++) {
        const vv = q / NS, v = it.fwd ? vv : 1 - vv;
        const off = side * t.amp * Math.cos(Math.PI * t.N * v);
        const cx = t.M.x + t.d.x * (v - 0.5) * t.Lc + t.n.x * off, cy = t.M.y + t.d.y * (v - 0.5) * t.Lc + t.n.y * off;
        // fading in or out: slide from the plain chord
        const fc = Math.max(0, Math.min(1, it.at + (vv - 0.5) * (t.Lc / C[r].L)));
        const sx = E0.x + (E1.x - E0.x) * fc, sy = E0.y + (E1.y - E0.y) * fc;
        pts.push({ x: sx + (cx - sx) * t.amt, y: sy + (cy - sy) * t.amt, tag: { key: t.key, v } });
      }
    }
    pts.push({ x: E1.x, y: E1.y, tag: null });
    if (items.length) {
      // round the corners where a tail meets a cord (one Chaikin pass)
      const sm = [pts[0]];
      for (let k = 0; k < pts.length - 1; k++) {
        const p = pts[k], q = pts[k + 1];
        if (!!p.tag === !!q.tag && !(p.tag && q.tag && p.tag.key !== q.tag.key)) { if (k) sm.push(p); continue; }
        if (k) sm.push({ x: p.x * 0.75 + q.x * 0.25, y: p.y * 0.75 + q.y * 0.25, tag: p.tag });
        sm.push({ x: p.x * 0.25 + q.x * 0.75, y: p.y * 0.25 + q.y * 0.75, tag: q.tag });
      }
      sm.push(pts[pts.length - 1]);
      pts = sm;
    }
    // resample to M+1 points evenly along the path
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
    const Ltot = cum[cum.length - 1] || 1, out = [], tags = [];
    let k = 1;
    for (let q = 0; q <= M; q++) {
      const u = (q / M) * Ltot;
      while (k < pts.length - 1 && cum[k] < u) k++;
      const a = pts[k - 1], b = pts[k], sl = (cum[k] - cum[k - 1]) || 1e-6, tt = Math.max(0, Math.min(1, (u - cum[k - 1]) / sl));
      out.push({ x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt });
      const ta = a.tag, tb = b.tag;
      tags.push(ta && tb && ta.key === tb.key ? { key: ta.key, v: ta.v + (tb.v - ta.v) * tt } : (tt < 0.5 ? ta : tb));
    }
    // the chain's sag and swing, on the tails only (tapered off near a cord)
    let lastTag = -1e9;
    const near = tags.map(() => 1e9);
    tags.forEach((tg, q) => { if (tg) lastTag = q; near[q] = q - lastTag; });
    lastTag = 1e9;
    for (let q = M; q >= 0; q--) { if (tags[q]) lastTag = q; near[q] = Math.min(near[q], lastTag - q); }
    for (let q = 0; q <= M; q++) {
      const f = q / M, B = chainAt(r, f), wd = Math.min(1, near[q] / 10);
      out[q].x += (B.x - (E0.x + (E1.x - E0.x) * f)) * wd;
      out[q].y += (B.y - (E0.y + (E1.y - E0.y) * f)) * wd;
    }
    TG[r] = tags;
    return out;
  }
  // Which rope is on top where ropes i < j meet at drawn point (seg a, t) of i.
  function topAt(i, j, a, t, C, T, held) {
    const key = `${i}-${j}`, tw = T.find((x) => x.key === key);
    if (tw && tw.amt > 0.3) {
      const ta = TG[i][a], tb = TG[i][a + 1];
      let v = null;
      if (ta && tb && ta.key === key && tb.key === key) v = ta.v + (tb.v - ta.v) * t;
      if (v === null) {
        // a tail crossing belongs to the turn at that end of the cord
        let q = a;
        while (q >= 0 && !(TG[i][q] && TG[i][q].key === key)) q--;
        const nearEnd0 = q < 0;
        v = (nearEnd0 === (tw.a[0] === 0)) ? 0 : 0.999;
      }
      return { o: tw.c[Math.max(0, Math.min(tw.N - 1, Math.floor(tw.N * v)))], tw };
    }
    const w = W[key];
    if (w && w.c.length) return { o: w.c[0], tw: null };
    if (held === i || held === j) return { o: held, tw: null };
    return { o: zorder.indexOf(i) > zorder.indexOf(j) ? i : j, tw: null };
  }
  function ropePiece(A, s0, s1, cap, noShadow) {
    const { P, cum } = A;
    s0 = Math.max(0, s0); s1 = Math.min(A.L, s1);
    if (s1 - s0 < 0.5) return '';
    const pts = [at(A, s0)];
    for (let k = 0; k < P.length; k++) if (cum[k] > s0 && cum[k] < s1) pts.push({ x: P[k].x, y: P[k].y });
    pts.push(at(A, s1));
    const d = 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L');
    let st = '', sc = '', gr = '', hi = '';
    const W = 7.6, G0 = 7;
    for (let u = Math.ceil(s0 / G0) * G0; u <= s1; u += G0) {
      const q = at(A, u), nx = -q.ty, ny = q.tx, sk = 3.6;
      st += `M${(q.x + nx * W + q.tx * sk).toFixed(1)} ${(q.y + ny * W + q.ty * sk).toFixed(1)}L${(q.x - nx * W - q.tx * sk).toFixed(1)} ${(q.y - ny * W - q.ty * sk).toFixed(1)}`;
      const Wc = W * 0.5;
      sc += `M${(q.x + nx * Wc + q.tx * sk * 0.5).toFixed(1)} ${(q.y + ny * Wc + q.ty * sk * 0.5).toFixed(1)}L${(q.x - nx * Wc - q.tx * sk * 0.5).toFixed(1)} ${(q.y - ny * Wc - q.ty * sk * 0.5).toFixed(1)}`;
      const g = G0 / 2, gx = q.x + q.tx * g, gy = q.y + q.ty * g;
      gr += `M${(gx + nx * (W + 1) + q.tx * sk).toFixed(1)} ${(gy + ny * (W + 1) + q.ty * sk).toFixed(1)}L${(gx - nx * (W + 1) - q.tx * sk).toFixed(1)} ${(gy - ny * (W + 1) - q.ty * sk).toFixed(1)}`;
    }
    for (let i = 0; i < pts.length; i++) {
      const j = Math.min(i + 1, pts.length - 1), h = Math.max(i - 1, 0);
      let tx = pts[j].x - pts[h].x, ty = pts[j].y - pts[h].y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      hi += (i ? 'L' : 'M') + (pts[i].x + ty * 3.4).toFixed(1) + ' ' + (pts[i].y - tx * 3.4).toFixed(1);
    }
    const lj = 'stroke-linejoin="round"';
    return `<g ${noShadow ? '' : `filter="url(#${pid}rs)"`}><path d="${d}" fill="none" stroke="#8f826b" stroke-width="19.5" stroke-linecap="${cap}" ${lj}/>`
      + `<path d="${d}" fill="none" stroke="#cdc2ab" stroke-width="17.6" stroke-linecap="${cap}" ${lj}/></g>`
      + `<path d="${d}" fill="none" stroke="#ddd3bf" stroke-width="12.5" stroke-linecap="${cap}" ${lj}/>`
      + `<path d="${st}" fill="none" stroke="#e6dece" stroke-width="4.8" stroke-opacity=".7" stroke-linecap="round"/>`
      + `<path d="${sc}" fill="none" stroke="#f2ece0" stroke-width="5" stroke-linecap="round"/>`
      + `<path d="${sc}" fill="none" stroke="#fffdf8" stroke-width="1.4" stroke-opacity=".6" stroke-linecap="round" transform="translate(-.6,-.8)"/>`
      + `<path d="${gr}" fill="none" stroke="#a89b83" stroke-width="1" stroke-opacity=".6" stroke-linecap="round"/>`
      + `<path d="${hi}" fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".3" stroke-linecap="${cap}" ${lj}/>`;
  }
  function ropeLayer() {
    const C = chords(), T = cordList();
    const A = R.map((_, r) => arcInfo(shapedRope(r, C, T)));
    const held = dragging() ? drag.r : -1, patches = [];
    const test = (i, j, ra, rb) => {
      const Pi = A[i].P, Pj = A[j].P;
      for (let a = ra[0]; a < ra[1]; a++) for (let b = rb[0]; b < rb[1]; b++) {
        const h = segHit(Pi[a], Pi[a + 1], Pj[b], Pj[b + 1]); if (!h) continue;
        const si = A[i].cum[a] + (A[i].cum[a + 1] - A[i].cum[a]) * h.t, sj = A[j].cum[b] + (A[j].cum[b + 1] - A[j].cum[b]) * h.u;
        const X = { x: Pi[a].x + (Pi[a + 1].x - Pi[a].x) * h.t, y: Pi[a].y + (Pi[a + 1].y - Pi[a].y) * h.t };
        const { o, tw } = topAt(i, j, a, h.t, C, T, held);
        const u2 = o === i ? j : i, so = o === i ? si : sj, su = o === i ? sj : si;
        const ti = at(A[i], si), tj = at(A[j], sj), sin = Math.abs(ti.tx * tj.ty - ti.ty * tj.tx), cos = Math.abs(ti.tx * tj.tx + ti.ty * tj.ty);
        let half = Math.min(90, (14 + 10 * cos) / Math.max(0.14, sin) + 6);
        if (tw) half = Math.min(half, (0.5 * tw.Lc) / tw.N + 2);
        patches.push({ o, u: u2, so, su, half, hd: Math.min(half, 11 / Math.max(0.14, sin) + 3, tw ? (0.5 * tw.Lc) / tw.N - 2 : 1e9), top: o === held });
      }
    };
    const CH = 8;
    const boxes = A.map((Ai) => {
      const P = Ai.P, bx = [];
      for (let k = 0; k < M; k += CH) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (let q = k; q <= Math.min(M, k + CH); q++) { x0 = Math.min(x0, P[q].x); y0 = Math.min(y0, P[q].y); x1 = Math.max(x1, P[q].x); y1 = Math.max(y1, P[q].y); }
        bx.push({ k, e: Math.min(M, k + CH), x0, y0, x1, y1 });
      }
      return bx;
    });
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++)
      for (const ba of boxes[i]) for (const bb of boxes[j]) {
        if (ba.x1 < bb.x0 - 1 || bb.x1 < ba.x0 - 1 || ba.y1 < bb.y0 - 1 || bb.y1 < ba.y0 - 1) continue;
        test(i, j, [ba.k, ba.e], [bb.k, bb.e]);
      }
    // LAYERED, NOT PATCHED (owner, 2026-11-10: "the ropes run together ... seem
    // to go transparent"). Every drawn point of every rope gets a height; at
    // each crossing the top rope's stretch is lifted above the under rope's
    // stretch there, so a pile of three or four ropes still stacks in one
    // consistent order. The ropes are then drawn as runs of equal height,
    // lowest first, each with its own shadow, so nothing is ever painted over
    // a rope that should sit above it. Runs meet butt to butt on the same
    // rope (the twist marks are laid by arc length, so the seam is invisible)
    // and the rope ends are always under a peg.
    const D = A.map((_, r) => new Array(M + 1).fill(zorder.indexOf(r)));
    const span = (Ai, s0, s1) => { let a = 0, b = M; while (a < M && Ai.cum[a + 1] < s0) a++; while (b > 0 && Ai.cum[b - 1] > s1) b--; return [a, b]; };
    const win = patches.map((p) => ({ p, o: span(A[p.o], p.so - p.hd, p.so + p.hd), u: span(A[p.u], p.su - p.hd, p.su + p.hd) }));
    win.sort((x, y) => x.p.top - y.p.top);
    for (let pass = 0; pass < 8; pass++) {
      let changed = false;
      for (const w of win) {
        const Do = D[w.p.o], Du = D[w.p.u];
        let need = -1e9;
        for (let q = w.u[0]; q <= w.u[1]; q++) need = Math.max(need, Du[q]);
        need += 1;
        for (let q = w.o[0]; q <= w.o[1]; q++) if (Do[q] < need) { Do[q] = need; changed = true; }
      }
      if (!changed) break;
    }
    const runs = [];
    A.forEach((Ai, r) => {
      let q0 = 0;
      for (let q = 1; q <= M + 1; q++) {
        if (q <= M && D[r][q] === D[r][q0]) continue;
        // the run covers points q0..q-1; it reaches half way to each neighbour
        const s0 = q0 === 0 ? 0 : (Ai.cum[q0 - 1] + Ai.cum[q0]) / 2;
        const s1 = q > M ? Ai.L : (Ai.cum[q - 1] + Ai.cum[q]) / 2;
        runs.push({ r, s0, s1, h: D[r][q0], z: zorder.indexOf(r), first: q0 === 0, last: q > M });
        q0 = q;
      }
    });
    runs.sort((x, y) => x.h - y.h || x.z - y.z);
    let s = '';
    // a hair of overlap where a run meets a lower run of its own rope
    for (const u of runs) s += ropePiece(A[u.r], u.first ? 0 : u.s0 - 0.8, u.last ? A[u.r].L : u.s1 + 0.8, 'butt');
    // A pile no stacking can draw (three ropes over one another in a ring at
    // one spot): lay just the top rope's crossing back over the under rope
    // there, clipped to the under rope, so that one crossing still reads right.
    let n = 0;
    for (const w of win) {
      let mx = -1e9, mn = 1e9;
      for (let q = w.u[0]; q <= w.u[1]; q++) mx = Math.max(mx, D[w.p.u][q]);
      for (let q = w.o[0]; q <= w.o[1]; q++) mn = Math.min(mn, D[w.p.o][q]);
      if (mn > mx) continue;
      const p = w.p, id = `${pid}mk${n++}`;
      s += `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><path d="${pieceD(A[p.u], p.su - p.half, p.su + p.half)}" fill="none" stroke="#fff" stroke-width="22.5"/></mask>`
        + `<g mask="url(#${id})">${ropePiece(A[p.o], p.so - p.hd, p.so + p.hd, 'butt', true)}</g>`;
    }
    return s;
  }
  function buttonSvg(x, y, on, r, e) {
    const c = R[r].peg[e], col = PEG_PASTELS[c], edge = shade(col, -0.5), dark = shade(col, -0.32);
    return (on ? `<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="var(--tg-ink)" stroke-width="2"/>` : '')
      + `<circle cx="${x + 1}" cy="${y + 3}" r="16" fill="#000" fill-opacity=".2"/>`
      + `<circle cx="${x}" cy="${y}" r="${on ? 17.5 : 16}" fill="url(#${pid}peg${c})" stroke="${edge}" stroke-width="1.3"/>`
      + `<circle cx="${x}" cy="${y}" r="${on ? 12 : 11}" fill="none" stroke="${dark}" stroke-opacity=".55" stroke-width="1.4"/>`
      + `<ellipse cx="${x - 5}" cy="${y - 6}" rx="5" ry="3" fill="#fff" fill-opacity=".35"/>`;
  }
  function draw() {
    if (dead) return;
    let s = pegDefs;
    const free = emptyHoles(G.ropes, G.H);
    const dg = dragging();
    const shown = new Set(free);
    if (dg) shown.add(G.ropes[drag.r][drag.e]);
    for (const h of shown) {
      const p = pos[h];
      s += `<circle cx="${p.x}" cy="${p.y + 1}" r="16.5" fill="#000" fill-opacity=".18"/><circle cx="${p.x}" cy="${p.y}" r="16" fill="url(#${pid}gr)"/><circle cx="${p.x}" cy="${p.y}" r="11.5" fill="url(#${pid}hole)"/><path d="M${p.x - 12} ${p.y - 6}A13 13 0 0 1 ${p.x + 6} ${p.y - 12}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    if ((sel || dg) && !finished) for (const h of free) s += `<circle class="tg-target" cx="${pos[h].x}" cy="${pos[h].y}" r="19" fill="none" stroke="var(--tg-ink)" stroke-width="1.5"/>`;
    s += ropeLayer();
    const top = dg ? drag.r : -1;
    for (const r of zorder) for (const e of [0, 1]) { if (dg && r === top && e === drag.e) continue; const E = R[r].ends[e]; s += buttonSvg(E.x, E.y, !!(sel && sel.r === r && sel.e === e), r, e); }
    if (dg) { const E = R[top].ends[drag.e]; s += buttonSvg(E.x, E.y, true, top, drag.e); }
    if (!finished && !giving) {
      for (const h of free) s += `<circle data-hole="${h}" cx="${pos[h].x}" cy="${pos[h].y}" r="24" fill="transparent"/>`;
      for (const r of zorder) for (const e of [0, 1]) { const E = R[r].ends[e]; s += `<circle data-r="${r}" data-e="${e}" cx="${E.x}" cy="${E.y}" r="24" fill="transparent" style="cursor:grab"/>`; }
    }
    svgEl.innerHTML = s;
  }
  function step() {
    let moving = easeCords(false);
    R.forEach((rp, r) => {
      for (const e of [0, 1]) {
        const t = endTarget(r, e), E = rp.ends[e];
        const k = (dragging() && drag.r === r && drag.e === e) ? 1 : (giving ? 0.12 : 0.38);
        const dx = t.x - E.x, dy = t.y - E.y;
        E.x += dx * k; E.y += dy * k;
        if (Math.abs(dx) + Math.abs(dy) > 0.2) moving = true; else { E.x = t.x; E.y = t.y; }
      }
      const isDrag = dragging() && drag.r === r;
      rp.slack += ((isDrag ? 0.10 : 0) - rp.slack) * (isDrag ? 0.2 : 0.08);
      if (rp.slack > 0.002) moving = true;
      const P = rp.pts, a = rp.ends[0], b = rp.ends[1];
      for (let k = 1; k < SEG; k++) {
        const p = P[k], vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9;
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy;
        if (Math.abs(vx) + Math.abs(vy) > 0.06) moving = true;
      }
      P[0].x = a.x; P[0].y = a.y; P[SEG].x = b.x; P[SEG].y = b.y;
      const rest = (Math.hypot(b.x - a.x, b.y - a.y) * (1 + rp.slack)) / SEG;
      for (let it = 0; it < 14; it++) {
        for (let k = 0; k < SEG; k++) {
          const p = P[k], q = P[k + 1];
          const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-6;
          const diff = ((d - rest) / d) * 0.5;
          if (k > 0) { p.x += dx * diff; p.y += dy * diff; }
          if (k + 1 < SEG) { q.x -= dx * diff; q.y -= dy * diff; }
        }
        P[0].x = a.x; P[0].y = a.y; P[SEG].x = b.x; P[SEG].y = b.y;
      }
    });
    return moving;
  }
  function settleStraight() {
    R.forEach((rp) => { const a = rp.ends[0], b = rp.ends[1]; rp.pts.forEach((p, k) => { const t = k / SEG; p.x = p.px = a.x + (b.x - a.x) * t; p.y = p.py = a.y + (b.y - a.y) * t; }); rp.slack = 0; });
  }
  function tick() {
    if (dead) return;
    const moving = step(); draw();
    if (moving || drag) raf = requestAnimationFrame(tick);
    else {
      loopOn = false; settleStraight(); draw();
      if (giving) { giving = false; finished = true; draw(); opts.onGaveUp && opts.onGaveUp(); }
    }
  }
  function kick() { if (loopOn || dead) return; loopOn = true; raf = requestAnimationFrame(tick); }
  function raise(r) { zorder.splice(zorder.indexOf(r), 1); zorder.push(r); }
  function moveEnd(r, e, h) {
    const nx = applyMove(G.ropes, W, r, e, h, pos);
    G.ropes = nx.ropes; W = nx.wraps;
    raise(r); sel = null;
    R[r].slack = Math.max(R[r].slack, 0.06); kick();
    const solved = isSolved(G.ropes, W);
    if (solved) finished = true;
    opts.onMove && opts.onMove(G.ropes.map((x) => x.slice()), cloneWraps(W), solved);
  }
  function svgPt(ev) {
    const pt = svgEl.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svgEl.getScreenCTM().inverse());
  }
  const onDown = (ev) => {
    if (finished || giving) return;
    const t = ev.target;
    if (t.dataset && t.dataset.r !== undefined) {
      ev.preventDefault();
      opts.onTouch && opts.onTouch();
      const p = svgPt(ev);
      drag = { r: +t.dataset.r, e: +t.dataset.e, start: p, pt: p, moved: false };
      try { svgEl.setPointerCapture(ev.pointerId); } catch (e) {}
    } else if (t.dataset && t.dataset.hole !== undefined && sel) {
      const h = +t.dataset.hole;
      if (emptyHoles(G.ropes, G.H).includes(h)) moveEnd(sel.r, sel.e, h);
    } else if (sel) { sel = null; draw(); }
  };
  const onMove = (ev) => {
    if (!drag) return;
    drag.pt = svgPt(ev);
    if (!drag.moved && Math.hypot(drag.pt.x - drag.start.x, drag.pt.y - drag.start.y) > 7) { drag.moved = true; sel = null; raise(drag.r); kick(); }
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved) {
      let best = null, bd = 42;
      for (const h of emptyHoles(G.ropes, G.H)) { const q = pos[h], dd = Math.hypot(q.x - d.pt.x, q.y - d.pt.y); if (dd < bd) { bd = dd; best = h; } }
      if (best !== null) { moveEnd(d.r, d.e, best); return; }
      kick();
    } else {
      sel = (sel && sel.r === d.r && sel.e === d.e) ? null : { r: d.r, e: d.e }; draw();
    }
  };
  const onCancel = () => { drag = null; kick(); };
  svgEl.addEventListener('pointerdown', onDown);
  svgEl.addEventListener('pointermove', onMove);
  svgEl.addEventListener('pointerup', onUp);
  svgEl.addEventListener('pointercancel', onCancel);

  buildStatic();
  easeCords(true);
  draw();

  return {
    giveUp() {
      // The client turns the board read-only (setLive false) in the same
      // render that asks for this, so `finished` is not a reason to refuse.
      if (giving) return;
      giving = true; sel = null; drag = null;
      G.ropes = G.solved.map((p) => p.slice()); W = {};
      R.forEach((rp) => { rp.slack = 0.05; });
      draw(); kick();
    },
    redrawStatic() { buildStatic(); draw(); },
    setLive(v) { finished = !v; sel = null; draw(); },
    destroy() {
      dead = true; cancelAnimationFrame(raf);
      svgEl.removeEventListener('pointerdown', onDown);
      svgEl.removeEventListener('pointermove', onMove);
      svgEl.removeEventListener('pointerup', onUp);
      svgEl.removeEventListener('pointercancel', onCancel);
    },
  };
}

let SEQ = 0;
export default function TangledBoard({ puzzle, ropes = null, wraps = null, live = true, dark = false, giveUpSeq = 0, onTouch, onMove, onGaveUp, width = null }) {
  const bgRef = useRef(null);
  const svgRef = useRef(null);
  const boardRef = useRef(null);
  const cb = useRef({});
  cb.current = { onTouch, onMove, onGaveUp };
  const pidRef = useRef(null);
  if (!pidRef.current) pidRef.current = `tg${++SEQ}`;

  useEffect(() => {
    const b = makeBoard(bgRef.current, svgRef.current, {
      puzzle, ropes, wraps: ropes ? (wraps || {}) : null, live, pid: pidRef.current,
      onTouch: () => cb.current.onTouch && cb.current.onTouch(),
      onMove: (r, w, s) => cb.current.onMove && cb.current.onMove(r, w, s),
      onGaveUp: () => cb.current.onGaveUp && cb.current.onGaveUp(),
    });
    boardRef.current = b;
    return () => { b.destroy(); boardRef.current = null; };
    // A new board only for a new puzzle (or a new starting layout key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.quizId]);
  useEffect(() => { if (boardRef.current) boardRef.current.setLive(live); }, [live]);
  useEffect(() => { if (giveUpSeq && boardRef.current) boardRef.current.giveUp(); }, [giveUpSeq]);
  useEffect(() => { if (boardRef.current) boardRef.current.redrawStatic(); }, [dark]);

  return (
    <div className={`tg-board${dark ? ' dk' : ''}`} style={width ? { width: `min(100%, ${width}px)` } : undefined}>
      <div className="tg-stage">
        <svg ref={bgRef} className="tg-bg" viewBox="0 0 400 400" aria-hidden="true" />
        <svg ref={svgRef} className="tg-fg" viewBox="0 0 400 400" role="img" aria-label="Rope board: drag a rope end into an empty hole" />
      </div>
    </div>
  );
}

export const TANGLED_BOARD_CSS = `
.tg-board{--tg-ink:var(--pst-ink,var(--stg-ink,#1d1f24));--tg-linen:#f4f3f0;--tg-felt:#e7e6e2;--tg-felt-edge:#cfcdc7;--tg-felt-rim:#f3f2ee;--tg-gr1:#d9dadd;--tg-gr2:#8b8f97;
  position:relative;width:100%;max-width:520px;margin:0 auto;background:var(--tg-linen);border:1px solid var(--tg-ink);border-radius:18px;overflow:hidden}
.tg-board.dk{--tg-linen:#1f2227;--tg-felt:#3b3e44;--tg-felt-edge:#2c2f34;--tg-felt-rim:#474b52;--tg-gr1:#6d7179;--tg-gr2:#2e3137}
.tg-stage{position:relative}
.tg-bg{position:absolute;inset:0;width:100%;height:100%;display:block}
.tg-fg{position:relative;display:block;width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.tg-target{animation:tgGlow 1.1s ease-in-out infinite}
@keyframes tgGlow{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.tg-target{animation:none}}
`;
