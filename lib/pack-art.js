// lib/pack-art.js: what the things in Pack look like. Every item is a set of whole
// cells (the model in lib/pack-engine.js only ever sees those) with details painted
// on its faces: straps and a handle on a suitcase, a white lid on a cooler, drawers,
// a washer door, books on a shelf. A detail is a flat outline or fill lying on one
// face of the item, in the item's own coordinates, so it turns and tips with it.
//
// Owner, 2026-11-14: "Make those items look like the items but carry the same
// dimensions", then "Color the items a little more". The colours are [hue, sat,
// light]; a face is shaded by which way it points, and the dark register lowers both.
//
// drawPieces paints any list of placed items back to front, one cell at a time, so
// items hide each other correctly from all four views. It is the only drawing code:
// the board, the item list and the share card all call it.
import { ROTS, ap, orient } from './pack-engine.js';

function dkc(c,d){return [c[0],Math.min(90,c[1]+6),Math.max(8,c[2]-(d||26))]}
export const C = { rose: [350, 62, 80], teal: [176, 48, 66], sky: [204, 68, 76], sand: [38, 58, 76], wood: [28, 52, 68], wood2: [18, 44, 58], slate: [218, 24, 58], sage: [135, 36, 68], must: [44, 76, 68], lilac: [266, 52, 78], coral: [10, 76, 74], mint: [152, 48, 74], navy: [224, 44, 60], cream: [46, 68, 88], green: [108, 44, 66], white: [205, 18, 92], card: [32, 56, 72], red: [2, 68, 66], plum: [312, 34, 64], aqua: [190, 58, 72], pine: [150, 30, 52] };
const SIDES=['+x','-x','+y','-y'];
function mk(a,b,c,col){
 const o={a:a,b:b,c:c,col:col,cells:[],feats:[]};
 for(var x=0;x<a;x++)for(var y=0;y<b;y++)for(var z=0;z<c;z++)o.cells.push([x,y,z]);
 o.pt=function(f,s,t){switch(f){case '+z':return[s,t,c];case '-z':return[s,t,0];case '+x':return[a,s,t];case '-x':return[0,s,t];case '+y':return[s,b,t];default:return[s,0,t]}};
 o.sz=function(f){return f[1]==='z'?[a,b]:f[1]==='x'?[b,c]:[a,c]};
 o.poly=function(f,st,arr){o.feats.push({ax:'xyz'.indexOf(f[1]),pts:arr.map(function(q){return o.pt(f,q[0],q[1])}),f:st.f||null,s:st.s||null,w:st.w||1,closed:arr.length>2});return o};
 o.rect=function(f,s0,t0,s1,t1,st){return o.poly(f,st,[[s0,t0],[s1,t0],[s1,t1],[s0,t1]])};
 o.line=function(f,s0,t0,s1,t1,st){return o.poly(f,{s:st.s,w:st.w},[[s0,t0],[s1,t1]])};
 o.circ=function(f,cs,ct,r,st){var arr=[];for(var i=0;i<18;i++)arr.push([cs+r*Math.cos(i*Math.PI/9),ct+r*Math.sin(i*Math.PI/9)]);return o.poly(f,st,arr)};
 return o;
}
function cx(cells,col){const o={cells:cells,feats:[],col:col};
 o.p3=function(ax,st,pts){o.feats.push({ax:ax,pts:pts,f:st.f||null,s:st.s||null,w:st.w||1,closed:pts.length>2});return o};return o}
export const K={
 suitcase:function(s,col){var o=mk(s[2],s[0],s[1],col),d=dkc(col),a=o.a,b=o.b,c=o.c;
  ['+y','-y'].forEach(function(f){o.rect(f,.1,.1,a-.1,c-.1,{s:d});o.rect(f,a*.3-.07,0,a*.3+.07,c,{f:d});o.rect(f,a*.7-.07,0,a*.7+.07,c,{f:d})});
  ['+z','-z'].forEach(function(f){o.line(f,0,b/2,a,b/2,{s:d})});o.rect('+z',a/2-.28,b/2-.12,a/2+.28,b/2+.12,{f:dkc(col,42)});
  ['+x','-x'].forEach(function(f){o.line(f,b/2,0,b/2,c,{s:d})});return o},
 cooler:function(s,col){var o=mk(s[2],s[1],s[0],col),d=dkc(col),wh=[0,0,96],a=o.a,b=o.b,c=o.c;
  SIDES.forEach(function(f){var w=o.sz(f)[0];o.rect(f,0,c-.3,w,c,{f:wh});o.line(f,0,c-.3,w,c-.3,{s:d})});
  ['+z','-z'].forEach(function(f){o.rect(f,0,0,a,b,{f:wh});o.rect(f,.14,.14,a-.14,b-.14,{s:[0,0,72]})});
  ['+y','-y'].forEach(function(f){o.rect(f,a/2-.2,c-.56,a/2+.2,c-.4,{f:wh,s:d})});return o},
 box:function(s,col,x){col=col||C.card;var o=mk(s[2],s[1],s[0],col),d=dkc(col),tp=x&&C[x]?C[x]:[42,35,62],a=o.a,b=o.b,c=o.c;
  ['+z','-z'].forEach(function(f){o.rect(f,0,b/2-.1,a,b/2+.1,{f:tp})});
  ['+x','-x'].forEach(function(f){o.rect(f,b/2-.1,c-.36,b/2+.1,c,{f:tp})});
  ['+y','-y'].forEach(function(f){o.line(f,.15,.3,.62,.3,{s:d});o.line(f,.15,.46,.45,.46,{s:d})});return o},
 crate:function(s,col,mode){var o=mk(s[2],s[1],s[0],col),d=dkc(col),a=o.a,b=o.b,c=o.c;
  SIDES.forEach(function(f){var w=o.sz(f)[0],t;
   if(mode==='dog'){o.rect(f,.1,.1,w-.1,c-.1,{s:d});for(t=.3;t<w-.15;t+=.2)o.line(f,t,.1,t,c-.1,{s:d})}
   else for(t=1/3;t<c-.01;t+=1/3)o.line(f,0,t,w,t,{s:d})});
  if(mode==='dog')o.rect('+z',a/2-.25,b/2-.08,a/2+.25,b/2+.08,{f:d});
  else if(mode==='basket'){o.line('+z',a/2,0,a/2,b,{s:d});o.rect('+z',a/2-.06,b/2-.3,a/2+.06,b/2+.3,{f:d})}
  else{o.rect('+z',.12,.12,a-.12,b-.12,{f:dkc(col,16)});var pc=[[10,60,70],[95,45,66],[35,75,68],[50,70,72]],n=0;
   for(var i=.38;i<a-.2;i+=.42)for(var j=.38;j<b-.2;j+=.42)o.circ('+z',i,j,.16,{f:pc[n++%4],s:dkc(pc[n%4],30)})}
  return o},
 roll:function(s,col){var o=mk(s[2],s[0],s[1],col),d=dkc(col),a=o.a,b=o.b,c=o.c,r=Math.min(b,c);
  ['+x','-x'].forEach(function(f){o.circ(f,b/2,c/2,.42*r,{s:d});o.circ(f,b/2,c/2,.27*r,{s:d});o.circ(f,b/2,c/2,.11*r,{f:d})});
  ['+y','-y','+z','-z'].forEach(function(f){var h=o.sz(f)[1];o.rect(f,a*.18-.06,0,a*.18+.06,h,{f:d});o.rect(f,a*.82-.06,0,a*.82+.06,h,{f:d})});return o},
 fridge:function(s,col){var o=mk(s[1],s[0],s[2],col||C.white),d=[205,10,58],a=o.a,c=o.c,m=c*.62;
  o.line('+y',0,m,a,m,{s:d});o.rect('+y',.16,m+.15,.27,c-.25,{f:d});o.rect('+y',.16,m-.8,.27,m-.15,{f:d});
  for(var t=.2;t<.7;t+=.15)o.line('-y',.2,t,a-.2,t,{s:d});return o},
 washer:function(s,col,x){var glass=x==='dryer'?[250,8,40]:[200,58,74],o=mk(s[2],s[1],s[0],col||C.white),d=[205,10,55],a=o.a,c=o.c,R=Math.min(a,c-.34)*.36,cy=(c-.34)/2;
  o.rect('+y',0,c-.34,a,c,{f:[205,10,80]});o.circ('+y',a*.2,c-.17,.07,{f:d});o.circ('+y',a*.36,c-.17,.07,{f:d});
  o.circ('+y',a/2,cy,R,{f:[205,8,74],s:d});o.circ('+y',a/2,cy,R*.7,{f:glass,s:d});return o},
 microwave:function(s){var o=mk(s[2],s[0],s[1],[205,8,84]),d=[205,10,50],a=o.a,c=o.c;
  o.rect('+y',.12,.15,a-.42,c-.15,{f:[210,15,36]});o.circ('+y',a-.22,c*.3,.07,{f:d});o.line('+y',a-.32,c*.7,a-.12,c*.7,{s:d});return o},
 tv:function(s){var o=mk(s[2],s[0],s[1],[220,8,40]),a=o.a,c=o.c;
  o.rect('+y',.1,.1,a-.1,c-.1,{f:[205,30,64]});o.line('+y',a*.18,c*.7,a*.36,c*.88,{s:[205,30,88],w:1.6});return o},
 mirror:function(s,col){col=col||C.wood;var o=mk(s[2],s[0],s[1],col),a=o.a,c=o.c;
  o.rect('+y',.14,.14,a-.14,c-.14,{f:[195,48,86],s:dkc(col)});o.line('+y',a*.25,c*.55,a*.45,c*.8,{s:[0,0,98],w:1.6});o.line('+y',a*.38,c*.5,a*.5,c*.65,{s:[0,0,98],w:1.6});return o},
 speaker:function(s){var o=mk(s[1],s[0],s[2],[250,6,36]),a=o.a,c=o.c;
  for(var k=0;k<c;k++){o.circ('+y',a/2,k+.5,.32,{f:[250,5,56],s:[250,6,20]});o.circ('+y',a/2,k+.5,.12,{f:[250,6,24]})}return o},
 drawers:function(s,col,tall){var o=tall?mk(s[1],s[0],s[2],col):mk(s[2],s[0],s[1],col),d=dkc(col),a=o.a,c=o.c,rh=.5;
  for(var t=0;t<c-.01;t+=rh)for(var k=0;k<a;k++){o.rect('+y',k+.08,t+.07,k+.92,t+rh-.07,{s:d});o.circ('+y',k+.5,t+rh/2,.06,{f:d})}return o},
 bookcase:function(s,col){col=col||C.wood;var o=mk(s[1],s[0],s[2],col),a=o.a,c=o.c,pal=[C.rose,C.teal,C.must,C.sky,C.lilac,C.coral,C.sage],n=0;
  o.rect('+y',.1,.1,a-.1,c-.1,{f:dkc(col,24)});
  for(var k=0;k<c;k++){var base=k?k+.04:.1;if(k)o.rect('+y',.1,k-.04,a-.1,k+.04,{f:col});
   for(var x=.14;x<a-.3;){var w=.13+(n*7%5)*.02,h=.5+(n*5%4)*.09;if(n%6!==4)o.rect('+y',x,base,x+w,Math.min(base+h,k+.9),{f:pal[n%7],s:dkc(pal[n%7],34)});x+=w+.02;n++}}
  return o},
 wardrobe:function(s,col){col=col||C.wood2;var o=mk(s[1],s[0],s[2],col),d=dkc(col),a=o.a,c=o.c;
  o.rect('+y',.08,.08,a/2-.03,c-.08,{s:d});o.rect('+y',a/2+.03,.08,a-.08,c-.08,{s:d});o.circ('+y',a/2-.14,c/2,.06,{f:d});o.circ('+y',a/2+.14,c/2,.06,{f:d});return o},
 slab:function(s,col){var o=mk(s[2],s[0],s[1],col),d=dkc(col,14),a=o.a,c=o.c;
  ['+y','-y'].forEach(function(f){for(var t=.25;t<c;t+=.5)o.line(f,.1,t,a-.1,t,{s:d})});return o},
 lumber:function(s){var col=[34,48,80],o=mk(s[2],s[1],s[0],col),d=dkc(col,22),a=o.a,b=o.b,c=o.c,t;
  ['+x','-x'].forEach(function(f){for(t=.5;t<b;t+=.5)o.line(f,t,0,t,c,{s:d});for(t=.5;t<c;t+=.5)o.line(f,0,t,b,t,{s:d})});
  ['+y','-y'].forEach(function(f){for(t=.5;t<c;t+=.5)o.line(f,0,t,a,t,{s:d})});
  ['+z','-z'].forEach(function(f){for(t=.5;t<b;t+=.5)o.line(f,0,t,a,t,{s:d})});return o},
 mattress:function(s,col,stripes){var o=mk(s[2],s[1],s[0],col),d=dkc(col,22),a=o.a,b=o.b,c=o.c;
  ['+z','-z'].forEach(function(f){o.rect(f,.1,.1,a-.1,b-.1,{s:d});for(var i=.5;i<a;i++)for(var j=.5;j<b;j++)o.circ(f,i,j,.06,{f:d})});
  SIDES.forEach(function(f){var w=o.sz(f)[0];if(stripes)for(var t=.25;t<w;t+=.25)o.line(f,t,0,t,c,{s:d});else o.line(f,0,c/2,w,c/2,{s:d})});return o},
 firstaid:function(){var o=mk(1,1,1,[0,0,95]),r=[2,60,62];['+z','+y','+x'].forEach(function(f){o.rect(f,.4,.2,.6,.8,{f:r});o.rect(f,.2,.4,.8,.6,{f:r})});return o},
 toolbox:function(s,col){col=col||C.red;var o=mk(s[2],s[1],s[0],col),d=dkc(col),a=o.a,b=o.b,c=o.c;
  SIDES.forEach(function(f){o.line(f,0,c*.65,o.sz(f)[0],c*.65,{s:d})});
  ['+y','-y'].forEach(function(f){o.rect(f,a/2-.12,c*.65-.14,a/2+.12,c*.65+.1,{f:[45,10,82],s:d})});
  o.rect('+z',a/2-.3,b/2-.08,a/2+.3,b/2+.08,{f:[0,0,30]});return o},
 backpack:function(s,col){var o=mk(s[1],s[0],s[2],col),d=dkc(col),a=o.a,c=o.c;
  o.rect('+y',.15,.12,a-.15,c*.45,{f:dkc(col,10),s:d});o.line('+y',.15,c*.75,a-.15,c*.75,{s:d});
  o.rect('-y',.18,.1,.32,c-.1,{f:d});o.rect('-y',a-.32,.1,a-.18,c-.1,{f:d});o.rect('+z',a/2-.15,.4,a/2+.15,.6,{f:d});return o},
 piano:function(s){var o=mk(s[2],s[0],s[1],[0,0,26]),a=o.a,c=o.c,m=c*.45;
  o.rect('+y',.1,m,a-.1,m+.3,{f:[0,0,96]});for(var t=.25;t<a-.1;t+=.15)o.line('+y',t,m+.1,t,m+.3,{s:[0,0,20]});return o},
 sofa:function(s,col,opt){var n=opt.n,stripe=opt.stripe,cells=[],x,d=dkc(col),arm=dkc(col,12);for(x=0;x<n;x++)cells.push([x,0,0],[x,0,1],[x,1,0]);
  var o=cx(cells,col);
  if(stripe){for(var q=0;q<1;q+=.4){o.p3(2,{f:[0,0,97]},[[q,1,1],[q+.2,1,1],[q+.2,2,1],[q,2,1]]);o.p3(1,{f:[0,0,97]},[[q,1,1],[q+.2,1,1],[q+.2,1,2],[q,1,2]])}return o}
  [[0,.18],[n-.18,n]].forEach(function(e){o.p3(2,{f:arm},[[e[0],1,1],[e[1],1,1],[e[1],2,1],[e[0],2,1]]);o.p3(1,{f:arm},[[e[0],2,0],[e[1],2,0],[e[1],2,1],[e[0],2,1]])});
  o.p3(1,{s:d},[[0,2,.3],[n,2,.3]]);
  for(x=1;x<n;x++){o.p3(2,{s:d},[[x,1,1],[x,2,1]]);o.p3(1,{s:d},[[x,1,1],[x,1,2]]);o.p3(1,{s:d},[[x,2,.3],[x,2,1]])}
  return o},
 table:function(s,col,opt){var a=opt.a,b=opt.b,cells=[],seen={},x,y,d=dkc(col,14);for(x=0;x<a;x++)for(y=0;y<b;y++)cells.push([x,y,1]);
  [[0,0],[a-1,0],[0,b-1],[a-1,b-1]].forEach(function(q){if(!seen[q]){seen[q]=1;cells.push([q[0],q[1],0])}});
  var o=cx(cells,col);for(y=.5;y<b;y+=.5)o.p3(2,{s:d},[[.08,y,2],[a-.08,y,2]]);
  o.p3(1,{s:d},[[0,b,1.35],[a,b,1.35]]);o.p3(0,{s:d},[[a,0,1.35],[a,b,1.35]]);return o}
};

// A row's item ({ k: kind, d: its box sorted small to large, c: a colour key, x: extra }) as a shape.
export function shapeOf(it) { return K[it.k](it.d, it.c ? C[it.c] : null, it.x); }

export function shade(c, f, dark, up) {
  let l = c[2] - [0, 6, 12][f] + (up || 0), s = c[1];
  if (dark) { l *= 0.8; s *= 0.82; }
  return `hsl(${c[0]},${s}%,${l}%)`;
}
// The four views walk round the space a quarter turn at a time.
export const cellV = (v, x, y) => (v.r === 0 ? [x, y] : v.r === 1 ? [y, v.W - 1 - x] : v.r === 2 ? [v.W - 1 - x, v.D - 1 - y] : [v.D - 1 - y, x]);
export const ptV = (v, x, y) => (v.r === 0 ? [x, y] : v.r === 1 ? [y, v.W - x] : v.r === 2 ? [v.W - x, v.D - y] : [v.D - y, x]);
export const unV = (v, a, b) => (v.r === 0 ? [a, b] : v.r === 1 ? [v.W - 1 - b, a] : v.r === 2 ? [v.W - 1 - a, v.D - 1 - b] : [b, v.D - 1 - a]);

const path = (c, pts, closed) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (closed) c.closePath(); };
// list: [{ shape, r, pos, ghost, bad, lit }]   v: { r, W, D }   Pf(u, v, z) -> [x, y] on the canvas
export function drawPieces(c, list, v, Pf, scale, opt = {}) {
  const V = {}, cells = [], dark = !!opt.dark, badFill = opt.bad || '#e9a0a0', ink = '#1b1a18';
  for (const p of list) {
    const o = orient(p.shape, p.r), R = ROTS[p.r];
    p.feats = {};
    if (!(p.ghost && p.bad)) for (const ft of p.shape.feats) {
      let wa = 0; for (let j = 0; j < 3; j++) if (R[j][ft.ax]) wa = j;
      const va = wa === 2 ? 2 : (v.r % 2 ? 1 - wa : wa);
      const pts = ft.pts.map((q) => { const w = ap(R, q), uv = ptV(v, w[0] - o.m[0] + p.pos[0], w[1] - o.m[1] + p.pos[1]); return [uv[0], uv[1], w[2] - o.m[2] + p.pos[2]]; });
      const mn = [0, 1, 2].map((i) => Math.min(...pts.map((q) => q[i]))), mx = [0, 1, 2].map((i) => Math.max(...pts.map((q) => q[i])));
      const k = `${va}:${Math.round(pts[0][va] * 100)}`;
      (p.feats[k] = p.feats[k] || []).push({ pts, mn, mx, ft });
    }
    for (const q of o.cells) { const uv = cellV(v, q[0] + p.pos[0], q[1] + p.pos[1]), cl = { u: uv[0], v: uv[1], z: q[2] + p.pos[2], p }; V[`${cl.u},${cl.v},${cl.z}`] = cl; cells.push(cl); }
  }
  cells.sort((a, b) => (a.u + a.v + a.z) - (b.u + b.v + b.z));
  const same = (cl, u, w, z) => { const o = V[`${u},${w},${z}`]; return !!o && o.p === cl.p; };
  c.lineJoin = 'round'; c.lineCap = 'round';
  for (const cl of cells) {
    const u = cl.u, w = cl.v, z = cl.z, gh = cl.p.ghost, up = cl.p.lit ? 8 : 0, col = cl.p.shape.col, F = [];
    c.globalAlpha = gh ? 0.62 : 1;
    if (!same(cl, u, w, z + 1)) F.push([0, [[u, w, z + 1], [u + 1, w, z + 1], [u + 1, w + 1, z + 1], [u, w + 1, z + 1]], [[0, -1, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0]], [0, 0, 1], 2, z + 1]);
    if (!same(cl, u + 1, w, z)) F.push([1, [[u + 1, w, z], [u + 1, w + 1, z], [u + 1, w + 1, z + 1], [u + 1, w, z + 1]], [[0, 0, -1], [0, 1, 0], [0, 0, 1], [0, -1, 0]], [1, 0, 0], 0, u + 1]);
    if (!same(cl, u, w + 1, z)) F.push([2, [[u, w + 1, z], [u + 1, w + 1, z], [u + 1, w + 1, z + 1], [u, w + 1, z + 1]], [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]], [0, 1, 0], 1, w + 1]);
    for (const f of F) {
      const pts = f[1].map((q) => Pf(q[0], q[1], q[2])), fill = gh && cl.p.bad ? badFill : shade(col, f[0], dark, up);
      path(c, pts, true); c.fillStyle = fill; c.fill(); c.strokeStyle = fill; c.lineWidth = 0.6; c.stroke();
      const lo = [u, w, z];
      const fs = (cl.p.feats[`${f[4]}:${Math.round(f[5] * 100)}`] || []).filter((g) => { for (let i = 0; i < 3; i++) { if (i === f[4]) continue; if (g.mx[i] < lo[i] - 1e-6 || g.mn[i] > lo[i] + 1 + 1e-6) return false; } return true; });
      if (fs.length) {
        c.save(); path(c, pts, true); c.clip();
        for (const g of fs) {
          path(c, g.pts.map((q) => Pf(q[0], q[1], q[2])), g.ft.closed);
          if (g.ft.f) { c.fillStyle = shade(g.ft.f, f[0], dark, up); c.fill(); }
          if (g.ft.s) { c.strokeStyle = shade(g.ft.s, f[0], dark, up); c.lineWidth = Math.max(0.8, scale * 0.035 * g.ft.w); c.stroke(); }
        }
        c.restore();
      }
      for (let k = 0; k < 4; k++) {
        const n = f[2][k], nu = u + n[0], nv = w + n[1], nz = z + n[2];
        if (!(same(cl, nu, nv, nz) && !same(cl, nu + f[3][0], nv + f[3][1], nz + f[3][2]))) { c.beginPath(); c.moveTo(pts[k][0], pts[k][1]); c.lineTo(pts[(k + 1) % 4][0], pts[(k + 1) % 4][1]); c.strokeStyle = ink; c.lineWidth = 1; c.stroke(); }
      }
    }
    c.globalAlpha = 1;
  }
}
