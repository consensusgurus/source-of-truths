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
//  - A board's real tangles WIND INTO TWO-STRAND CORDS (owner: "twisted means
//    wrapped around each other"). The tangles are fixed when the board starts
//    (initTwists, TW) and never added to. A tangle only unwinds once its two
//    ropes no longer cross, and never while one of them is held (owner: "things
//    that are tangled shouldn't become untangled" just by moving pegs).
//  - Over and under alternate (a checkerboard off the straight chords), and
//    within a cord they alternate turn by turn; the rope on top is patched over
//    the one beneath, masked to the under-rope's footprint.
//
// The rules (what crosses, what is solved) are lib/tangled-engine.js, never the
// picture: crossing is the interleave test on the hole order.

import React, { useEffect, useRef } from 'react';
import { holes, framePath, crossPairs, emptyHoles, PEG_PASTELS, CX, CY, RAD } from '@/lib/tangled-engine';

const SEG = 18;
const M = 110, AMP = 8;

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
  let TW = {};
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
  function crossingsGeo(C) {
    const all = [];
    for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
      const q = segX(C[i].a, C[i].b, C[j].a, C[j].b); if (!q) continue;
      const si = Math.hypot(q.x - C[i].a.x, q.y - C[i].a.y), sj = Math.hypot(q.x - C[j].a.x, q.y - C[j].a.y);
      const di = { x: C[i].dx, y: C[i].dy }, dot = C[i].dx * C[j].dx + C[i].dy * C[j].dy, sig = dot < 0 ? -1 : 1;
      const dj2 = { x: C[j].dx * sig, y: C[j].dy * sig };
      const dx = di.x + dj2.x, dy = di.y + dj2.y, dl = Math.hypot(dx, dy) || 1;
      const d = { x: dx / dl, y: dy / dl }, n = { x: -d.y, y: d.x };
      const room = Math.min(si, C[i].L - si, sj, C[j].L - sj) - 30;
      const neg = Math.min(si, sig > 0 ? sj : C[j].L - sj) - 22, posx = Math.min(C[i].L - si, sig > 0 ? C[j].L - sj : sj) - 22;
      all.push({ i, j, X: q, si, sj, di, dj2, sig, d, n, sg: (di.x * n.x + di.y * n.y) > 0 ? -1 : 1, cos: Math.abs(dot), key: `${i}-${j}`, room, neg, pos: posx, Lz: 0, N: 0, amt: 0 });
    }
    return all;
  }
  function initTwists() {
    TW = {};
    const all = crossingsGeo(chords()), used = new Set();
    all.filter((t) => t.room > 30 && t.cos > 0.5).sort((p, q) => (q.room * (0.6 + q.cos)) - (p.room * (0.6 + p.cos))).forEach((t) => {
      if (used.has(t.i) || used.has(t.j)) return;
      used.add(t.i); used.add(t.j);
      TW[t.key] = { N: Math.max(2, 2 * Math.round((2 * t.room) / 50)), len: 2 * t.room, amt: 1, geo: null };
    });
  }
  function fitTwist(t, rec) {
    const want = rec.len / 2;
    t.lo = Math.max(0, Math.min(want, t.neg)); t.hi = Math.max(0, Math.min(want, t.pos));
    t.Lz = t.lo + t.hi;
    let N = rec.N;
    while (N > 2 && t.Lz / N < 18) N -= 2;
    t.N = N;
    t.amt = t.Lz < 24 ? rec.amt * Math.max(0, (t.Lz - 8) / 16) : rec.amt;
  }
  function twistList(C) {
    const all = crossingsGeo(C), out = [], seen = new Set();
    for (const t of all) { const rec = TW[t.key]; if (rec) { fitTwist(t, rec); seen.add(t.key); } out.push(t); }
    for (const k in TW) if (!seen.has(k) && TW[k].geo && TW[k].amt > 0) { const g = { ...TW[k].geo }; g.amt = TW[k].amt; g.ghost = true; out.push(g); }
    return out;
  }
  function easeTwists() {
    const C = chords(), all = crossingsGeo(C);
    let moving = false;
    const now = new Set(all.map((t) => t.key));
    for (const t of all) {
      const rec = TW[t.key]; if (!rec) continue;
      fitTwist(t, rec); rec.geo = t;
      if (rec.amt < 1) { rec.amt = Math.min(1, rec.amt + 0.08); moving = true; }
    }
    for (const k in TW) {
      if (now.has(k)) continue;
      const rec = TW[k];
      const [a, b] = k.split('-').map(Number);
      if (dragging() && (drag.r === a || drag.r === b)) { moving = true; continue; }
      rec.amt = Math.max(0, rec.amt - 0.05); moving = true;
      if (rec.amt <= 0) delete TW[k];
    }
    return moving;
  }
  function chainAt(r, f) {
    const P = R[r].pts, x = Math.max(0, Math.min(1, f)) * SEG, i0 = Math.min(SEG - 1, Math.floor(x)), tt = x - i0;
    return { x: P[i0].x + (P[i0 + 1].x - P[i0].x) * tt, y: P[i0].y + (P[i0 + 1].y - P[i0].y) * tt };
  }
  function shapedRope(r, C, T) {
    const out = [];
    for (let k = 0; k <= M; k++) {
      const f = k / M, B = chainAt(r, f);
      let px = B.x, py = B.y;
      for (const t of T) {
        if (t.amt < 0.01 || t.Lz < 20 || (t.i !== r && t.j !== r)) continue;
        const me = t.i === r, p = me ? t.j : t.i, s0 = me ? t.si : t.sj, u = (f * C[r].L - s0) * (me ? 1 : t.sig);
        if (u <= -t.lo || u >= t.hi) continue;
        const fp = me ? (t.sj + u * t.sig) / C[p].L : (t.si + u) / C[p].L, Bp = chainAt(p, fp);
        const e = Math.min(1, Math.min(u + t.lo, t.hi - u) / Math.min(34, t.Lz * 0.4)), w = e * e * (3 - 2 * e) * t.amt;
        const off = (me ? t.sg : -t.sg) * AMP * Math.sin((Math.PI * t.N * (u + t.lo)) / t.Lz);
        const mx = (B.x + Bp.x) / 2, my = (B.y + Bp.y) / 2;
        px += w * (mx + t.n.x * off - B.x); py += w * (my + t.n.y * off - B.y);
      }
      out.push({ x: px, y: py });
    }
    return out;
  }
  function overRope(i, j, X) {
    if (dragging() && (drag.r === i || drag.r === j)) return drag.r;
    const ch = (k) => [R[k].ends[0], R[k].ends[1]];
    const [a0, a1] = ch(i), [b0, b1] = ch(j);
    let dix = a1.x - a0.x, diy = a1.y - a0.y; const dl = Math.hypot(dix, diy) || 1; dix /= dl; diy /= dl;
    let djx = b1.x - b0.x, djy = b1.y - b0.y; const dm = Math.hypot(djx, djy) || 1; djx /= dm; djy /= dm;
    const px = X.x + (dix + djx) * 2, py = X.y + (diy + djy) * 2;
    let par = 0;
    for (let k = 0; k < R.length; k++) { const [e0, e1] = ch(k); if ((e1.x - e0.x) * (py - e0.y) - (e1.y - e0.y) * (px - e0.x) > 0) par ^= 1; }
    return (par ^ ((dix * djy - diy * djx) > 0 ? 1 : 0)) ? i : j;
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
    const C = chords(), T = twistList(C);
    const A = R.map((_, r) => arcInfo(shapedRope(r, C, T)));
    let s = '';
    for (const r of zorder) s += ropePiece(A[r], 0, A[r].L, 'round');
    const held = dragging() ? drag.r : -1, patches = [];
    const test = (i, j, ra, rb) => {
      const Pi = A[i].P, Pj = A[j].P;
      for (let a = ra[0]; a < ra[1]; a++) for (let b = rb[0]; b < rb[1]; b++) {
        const h = segHit(Pi[a], Pi[a + 1], Pj[b], Pj[b + 1]); if (!h) continue;
        const si = A[i].cum[a] + (A[i].cum[a + 1] - A[i].cum[a]) * h.t, sj = A[j].cum[b] + (A[j].cum[b + 1] - A[j].cum[b]) * h.u;
        const X = { x: Pi[a].x + (Pi[a + 1].x - Pi[a].x) * h.t, y: Pi[a].y + (Pi[a + 1].y - Pi[a].y) * h.t };
        let o, inTwist = false;
        const tw = T.find((t) => t.i === i && t.j === j && t.amt > 0);
        const base = overRope(i, j, X);
        if (tw && tw.amt > 0.3 && tw.Lz >= 20) {
          const u = (si / A[i].L) * C[i].L - tw.si;
          if (u > -tw.lo && u < tw.hi) { inTwist = true; const m = Math.round((tw.N * (u + tw.lo)) / tw.Lz); o = (m % 2) ? base : (base === i ? j : i); }
          else o = (held === i || held === j) ? held : base;
        } else o = (held === i || held === j) ? held : base;
        const u2 = o === i ? j : i, so = o === i ? si : sj, su = o === i ? sj : si;
        const ti = at(A[i], si), tj = at(A[j], sj), sin = Math.abs(ti.tx * tj.ty - ti.ty * tj.tx), cos = Math.abs(ti.tx * tj.tx + ti.ty * tj.ty);
        let half = Math.min(90, (14 + 10 * cos) / Math.max(0.14, sin) + 6);
        if (inTwist) half = Math.min(half, (0.5 * tw.Lz) / tw.N + 2);
        patches.push({ o, u: u2, so, su, half, top: o === held });
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
    patches.sort((p, q) => p.top - q.top);
    let n = 0;
    for (const p of patches) {
      const id = `${pid}mk${n}`, id2 = `${pid}mo${n++}`;
      s += `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><path d="${pieceD(A[p.u], p.su - p.half, p.su + p.half)}" fill="none" stroke="#fff" stroke-width="19"/></mask>`
        + `<g mask="url(#${id})"><path d="${pieceD(A[p.o], p.so - p.half, p.so + p.half)}" fill="none" stroke="#14161a" stroke-opacity=".38" stroke-width="22" filter="url(#${pid}soft)" transform="translate(1.5,3)"/></g>`;
      s += `<mask id="${id2}" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400"><path d="${pieceD(A[p.u], p.su - p.half, p.su + p.half)}" fill="none" stroke="#fff" stroke-width="22.5"/></mask>`
        + `<g mask="url(#${id2})">${ropePiece(A[p.o], p.so - p.half, p.so + p.half, 'butt', true)}</g>`;
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
    let moving = easeTwists();
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
    G.ropes[r][e] = h; raise(r); sel = null;
    R[r].slack = Math.max(R[r].slack, 0.06); kick();
    const ropes = G.ropes.map((x) => x.slice());
    const solved = crossPairs(ropes).length === 0;
    if (solved) finished = true;
    opts.onMove && opts.onMove(ropes, solved);
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
  initTwists();
  draw();

  return {
    giveUp() {
      // The client turns the board read-only (setLive false) in the same
      // render that asks for this, so `finished` is not a reason to refuse.
      if (giving) return;
      giving = true; sel = null; drag = null;
      G.ropes = G.solved.map((p) => p.slice());
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
export default function TangledBoard({ puzzle, ropes = null, live = true, dark = false, giveUpSeq = 0, onTouch, onMove, onGaveUp, width = null }) {
  const bgRef = useRef(null);
  const svgRef = useRef(null);
  const boardRef = useRef(null);
  const cb = useRef({});
  cb.current = { onTouch, onMove, onGaveUp };
  const pidRef = useRef(null);
  if (!pidRef.current) pidRef.current = `tg${++SEQ}`;

  useEffect(() => {
    const b = makeBoard(bgRef.current, svgRef.current, {
      puzzle, ropes, live, pid: pidRef.current,
      onTouch: () => cb.current.onTouch && cb.current.onTouch(),
      onMove: (r, s) => cb.current.onMove && cb.current.onMove(r, s),
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
