#!/usr/bin/env node
// gen-chomp-gates: the Chomp generator for THE GATES ERA (boards from 2026-11-25).
//
// WHY THIS EXISTS. The obstacle-era boards were unique and filled the board, and
// the owner still found them "far too easy" (2026-11-23). Measured cause: the
// route was laid in Warnsdorff order (always the square with the fewest ways on),
// which is exactly how a person plays a fill-every-square board by feel, so the
// one true route was the one you walk without thinking. Over the 23 obstacle-era
// boards live 2026-11-07..11-30 the feel player went wrong 0.6 times a board.
//
// WHAT IT DOES DIFFERENTLY
//   1. lays a snake over the open 8x8 and SCRAMBLES it with backbite moves, so it
//      stops following the tightest square; each bleacher is then the route's
//      current end square, cut off and scrambled again (no search, never fails)
//   2. puts GATES on route squares that sit next to a much earlier route square
//      (a sweep would grab them too early); each opens after a mascot that comes
//      after that tempting moment
//   3. carves mascots off while exactly one winning route survives (several
//      removal orders, keeps the leanest), cast <= 11
//   4. keeps a board only if TRAPS >= the floor and the gates never make it easier
//      (traps with gates >= traps without). scripts/verify-chomp.mjs re-proves it.
//
// The uniqueness counter carries one extra prune the older counters do not: every
// mascot still to eat, except the last, must have two open sides (it is entered
// and left). True of ANY winning route, so it is sound, and it made each count
// take milliseconds instead of seconds.
//
// USAGE  node scripts/gen-chomp-gates.mjs <gates> <ms> <seed> <minTraps> <out.jsonl>
//   weekday: 3 gates, minTraps 7     Sunday: 4 gates, minTraps 8
// Every kept board is appended to out.jsonl with its route. Pick distinct boards,
// give each a cast (bulldog first, the rest shuffled), and splice them into
// app/chomp/puzzles.js as { ..., w: 8, h: 8, start, floor, min, cast, pellets, walls, gates }.
import { rng } from './gen-chomp-unique.mjs';
import fs from 'fs';
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// board: {w,h,start,pellets,walls,gates:[{x,y,after}]}; a gate is solid while fewer than `after` mascots are eaten
function ctx(p) {
  const w = p.w, h = p.h, C = w*h, idx = (x,y)=>y*w+x;
  const inside = (x,y)=>x>=0&&y>=0&&x<w&&y<h;
  const occ = new Uint8Array(C);
  for (const [x,y] of (p.walls||[])) occ[idx(x,y)] = 1;
  const K = p.pellets.length;
  const pel = new Int16Array(C).fill(-1); p.pellets.forEach(([x,y],k)=>pel[idx(x,y)]=k);
  const gate = new Int16Array(C).fill(-1); (p.gates||[]).forEach(g=>gate[idx(g.x,g.y)]=g.after);
  const bl = (pi,x,y) => { if (!inside(x,y)) return true; const i = idx(x,y); return !!occ[i] || pel[i] > pi || gate[i] > pi; };
  const seen = new Uint8Array(C);
  // gates and later mascots count as passable here on purpose (they open later), which keeps the prune sound
  const reach = (q,x,y) => { seen.fill(0); const i0=idx(x,y); seen[i0]=1; const st=[i0];
    for (let i=0;i<st.length;i++){ const c=st[i],cx=c%w,cy=(c-cx)/w; for (const d of DIRS){const nx=cx+d[0],ny=cy+d[1]; if(!inside(nx,ny))continue; const j=idx(nx,ny); if(occ[j]||seen[j])continue; seen[j]=1; st.push(j);} }
    for (let k=q;k<K;k++) if(!seen[idx(p.pellets[k][0],p.pellets[k][1])]) return false;
    // every mascot still to eat, except the last, must be entered AND left: it needs two open sides
    // (the head counts as one if it is next to it). True of ANY winning route, so the prune is sound.
    const hi=idx(x,y);
    for (let k=q;k<K-1;k++){ const mx=p.pellets[k][0], my=p.pellets[k][1]; let dg=0;
      for (const d of DIRS){ const nx=mx+d[0],ny=my+d[1]; if(!inside(nx,ny)) continue; const j=idx(nx,ny); if(!occ[j]||j===hi) dg++; }
      if (dg<2) return false; }
    return true; };
  return { w,h,C,idx,inside,occ,K,bl,reach };
}
export function countRoutes(p, want=2, cap=3000000) {
  const s = ctx(p), { idx, occ, K, bl, reach } = s;
  occ[idx(p.start[0],p.start[1])] = 1;
  let n=0, nodes=0, capped=false;
  const go=(x,y,pi)=>{ if(pi>=K){n++;return n>=want;} if(++nodes>cap){capped=true;return true;}
    for(const d of DIRS){const nx=x+d[0],ny=y+d[1]; if(bl(pi,nx,ny))continue; const np=(nx===p.pellets[pi][0]&&ny===p.pellets[pi][1])?pi+1:pi;
      occ[idx(nx,ny)]=1; const stop=(np>=K||reach(np,nx,ny))?go(nx,ny,np):false; occ[idx(nx,ny)]=0; if(stop)return true;}
    return false; };
  go(p.start[0],p.start[1],0); return { n, capped };
}


// Backbite: scramble a Hamiltonian path into a near-random one. The live generator stops at the
// Warnsdorff path, which is exactly the route a person finds by always taking the tightest square.
function backbite(w,h,wall,path,rnd,iters){
  let P = path.map(([x,y])=>y*w+x); const n=P.length; const at=new Int32Array(w*h).fill(-1); P.forEach((c,i)=>at[c]=i);
  for (let t=0;t<iters;t++){
    if (rnd()<0.5){ P.reverse(); P.forEach((c,i)=>at[c]=i); }
    const e=P[n-1], ex=e%w, ey=(e-ex)/w; const nb=[];
    for (const d of DIRS){ const nx=ex+d[0],ny=ey+d[1]; if(nx<0||ny<0||nx>=w||ny>=h) continue; const c=ny*w+nx; if(wall[c]) continue; const i=at[c]; if(i>=0 && i<n-2) nb.push(i); }
    if (!nb.length) continue; const i=nb[(rnd()*nb.length)|0];
    // reverse P[i+1 .. n-1]
    for (let a=i+1,b=n-1;a<b;a++,b--){ const tmp=P[a]; P[a]=P[b]; P[b]=tmp; at[P[a]]=a; at[P[b]]=b; }
  }
  return P.map(c=>[c%w,(c-c%w)/w]);
}

// human = rules first (no cut-offs, no 1-way squares), then the tightest square. A TRAP is a
// point where that player takes the wrong square.
export function traps(p, route){
  const w=p.w,h=p.h,C=w*h,idx=(x,y)=>y*w+x,inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h;
  const vis=new Uint8Array(C); for(const [x,y] of p.walls||[]) vis[idx(x,y)]=1;
  const K=p.pellets.length; const pel=new Int16Array(C).fill(-1); p.pellets.forEach(([x,y],k)=>pel[idx(x,y)]=k);
  const gate=new Int16Array(C).fill(-1); (p.gates||[]).forEach(g=>gate[idx(g.x,g.y)]=g.after);
  const last=idx(...p.pellets[K-1]);
  const bl=(pi,x,y)=>!inside(x,y)||vis[idx(x,y)]||pel[idx(x,y)]>pi||gate[idx(x,y)]>pi;
  const deg=(x,y)=>DIRS.filter(d=>inside(x+d[0],y+d[1])&&!vis[idx(x+d[0],y+d[1])]).length;
  const ok=(hx,hy)=>{ const hi=idx(hx,hy); const seen=new Uint8Array(C); const st=[hi]; seen[hi]=1; let tot=0,got=0;
    for(let i=0;i<C;i++) if(!vis[i]) tot++;
    for(let i=0;i<st.length;i++){const c=st[i],cx=c%w,cy=(c-cx)/w; for(const d of DIRS){const nx=cx+d[0],ny=cy+d[1]; if(!inside(nx,ny))continue; const j=idx(nx,ny); if(vis[j]||seen[j])continue; seen[j]=1; got++; st.push(j);}}
    if(got!==tot) return false;
    for(let i=0;i<C;i++){ if(vis[i]||i===last) continue; const cx=i%w,cy=(i-cx)/w; let dg=0; for(const d of DIRS){const nx=cx+d[0],ny=cy+d[1]; if(!inside(nx,ny))continue; const j=idx(nx,ny); if(!vis[j]||j===hi) dg++;} if(dg<2) return false; }
    return true; };
  let x=p.start[0],y=p.start[1],pi=0; vis[idx(x,y)]=1; let trap=0, guess=0; const at=[];
  for (const t of route){
    const L=DIRS.filter(d=>!bl(pi,x+d[0],y+d[1]));
    if (L.length>1){
      const S=L.filter(d=>{const j=idx(x+d[0],y+d[1]); vis[j]=1; const r=ok(x+d[0],y+d[1]); vis[j]=0; return r;});
      if (S.length>1){
        const sc=S.map(d=>{const j=idx(x+d[0],y+d[1]); vis[j]=1; const g=deg(x+d[0],y+d[1]); vis[j]=0; return {d,g};});
        const m=Math.min(...sc.map(s=>s.g)); const best=sc.filter(s=>s.g===m);
        const good=best.some(s=>s.d[0]===t[0]&&s.d[1]===t[1]);
        if(!good){ trap++; at.push([x,y]); } else if(best.length>1) guess++;
      }
    }
    const nx=x+t[0],ny=y+t[1]; if(pel[idx(nx,ny)]===pi) pi++; vis[idx(nx,ny)]=1; x=nx;y=ny;
  }
  return { trap, guess, at };
}

export function build(w,h,nWalls,nGates,castTarget,rnd,minTrapPre=3,cap=900000){
  // a snake over the open board, scrambled; then each bleacher is the route's current END square,
  // cut off and scrambled again. Never fails, and needs no search.
  const wall=new Uint8Array(w*h); const cells=[];
  let walk=[]; for(let y=0;y<h;y++) for(let i=0;i<w;i++) walk.push([y%2?w-1-i:i,y]);
  walk=backbite(w,h,wall,walk,rnd,300+((rnd()*300)|0));
  for (let k=0;k<nWalls;k++){ const e=walk.pop(); wall[e[1]*w+e[0]]=1; cells.push(e); walk=backbite(w,h,wall,walk,rnd,200+((rnd()*300)|0)); }
  const wi={ cells, wall, playable: w*h-nWalls };
  const T=walk.length-1;
  const route=[]; for(let i=1;i<=T;i++) route.push([walk[i][0]-walk[i-1][0], walk[i][1]-walk[i-1][1]]);
  // pre-screen on the bare path (start + end only)
  const pre=traps({w,h,start:walk[0],pellets:[walk[T]],walls:wi.cells},route);
  if (pre.trap<minTrapPre) return { pre: pre.trap };
  const pos=new Map(walk.map(([x,y],i)=>[y*w+x,i]));
  // gates go on route squares next to a much EARLIER route square: a sweep wants them too early
  const cands=[];
  for (let i=8;i<T-2;i++){ const [x,y]=walk[i]; let jm=1e9;
    for(const d of DIRS){const nx=x+d[0],ny=y+d[1]; if(nx<0||nx>=w||ny<0||ny>=h) continue; const j=pos.get(ny*w+nx); if(j!==undefined && j<i-1) jm=Math.min(jm,j);}
    if (jm<i-6) cands.push({i,jm,gain:i-jm,r:rnd()}); }
  cands.sort((a,b)=>(b.gain-a.gain)||(a.r-b.r));
  const gates=[],used=[];
  for (const c of cands){ if(gates.length>=nGates) break; if(used.some(u=>Math.abs(u-c.i)<6)) continue;
    const u=c.jm+2+((rnd()*Math.max(1,c.i-c.jm-4))|0); if(u>=c.i || used.includes(u) || gates.some(g=>g.u===c.i)) continue; gates.push({i:c.i,u}); used.push(c.i); }
  // a gate opens on a MASCOT, so its unlock square can never be another gate's square
  if (gates.length<nGates) return null;
  const forced=new Set(gates.map(g=>g.u)); forced.add(T); const gateSet=new Set(gates.map(g=>g.i));
  const boardOf=(ks,gs=gates)=>{ const s=[...ks].sort((a,b)=>a-b); return { w,h,start:walk[0], pellets:s.map(i=>walk[i]), walls:wi.cells,
    gates:gs.map(g=>({x:walk[g.i][0],y:walk[g.i][1],after:s.indexOf(g.u)+1})) }; };
  const all=[]; for(let j=1;j<=T;j++) if(!gateSet.has(j)) all.push(j);
  let keep=null;
  for (let rep=0; rep<(Number(process.env.REPS)||5); rep++){
    let k2=all.slice();
    for (const j of shuffle(k2.filter(k=>!forced.has(k)),rnd)){ const trial=k2.filter(k=>k!==j);
      const c=countRoutes(boardOf(trial),2,cap); if(c.capped) continue; if(c.n===1) k2=trial; }
    if (!keep || k2.length<keep.length) keep=k2;
    if (keep.length<=castTarget-1) break;
    if (rep===0 && keep.length>castTarget+3) break;
  }
  if (keep.length>castTarget) return { tight: keep.length };
  if (gates.some(g=>!keep.includes(g.u))) return null;
  const board=boardOf(keep);
  const chk=countRoutes(board,2,8000000); if(chk.capped||chk.n!==1) return null;
  const nog=countRoutes({...board,gates:[]},2,3000000);
  const tr=traps(board,route);
  const tr0=traps({...board,gates:[]},route);
  return { board, route, cast:keep.length, gateBites: nog.capped?'?':nog.n>1, trapNoGates: tr0.trap, ...tr };
}


if (import.meta.url === `file://${process.argv[1]}`) {
  const [nG, ms, seed, minTrap, out] = process.argv.slice(2);
  const rnd = rng(Number(seed)); const t0 = Date.now(); let kept = 0;
  while (Date.now() - t0 < Number(ms)) {
    const r = build(8, 8, 3, Number(nG), 11, rnd, 9);   // a bare-route pre-screen of 9 predicts a final 7+
    if (!r || r.pre !== undefined || r.tight) continue;
    if (r.trap < Number(minTrap) || r.trap < r.trapNoGates) continue;
    fs.appendFileSync(out, JSON.stringify({ trap: r.trap, trap0: r.trapNoGates, bite: r.gateBites, cast: r.cast, board: r.board, route: r.route }) + '\n');
    kept += 1;
  }
  console.error(`kept ${kept}`);
}
