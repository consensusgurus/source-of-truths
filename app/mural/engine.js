// Mural's board engine: the approved mockup's canvas code (owner, 2026-11-19)
// wired to the real mural. It is plain DOM and canvas on purpose; React only
// mounts the markup (markup.js) and calls bootMural once.
//
//   board  /api/mural/board   the cut, the window and the grade of every piece
//   photo  /api/mural/img     cut here on a canvas
//   crowd  /api/mural/state   one shared snapshot, polled every two minutes
//   mine   /api/mural/me      my own pieces, points and place
//   place  /api/mural/place   one call per piece; the SERVER decides the value
//                             and whether I was first, and its answer wins
//
// No clock and no Give up (owner ruling for Mural, 2026-11-19). Wrong drops are
// not counted. Nothing here pops up over the board mid game.

import {
  MURAL_COLS, MURAL_ROWS, MURAL_KINDS, MURAL_GRADE_NAMES, currentMuralId, gradeAt, pieceValue, muralLaunched, muralFirstOpens, parseMuralId, muralWindow,
} from '@/lib/mural-shared';

function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
function getEmail() {
  try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); return j && j.email ? String(j.email) : ''; } catch (e) { return ''; }
}
async function getJSON(url) {
  const r = await fetch(url);
  let j = null;
  try { j = await r.json(); } catch (e) { j = null; }
  return { ok: r.ok, status: r.status, j };
}

export function bootMural(root, cfg) {
  const ac = new AbortController();
  const timers = [];
  const cleanups = [];
  let dead = false;
  let ro = null;
  const $ = (id) => root.querySelector('#' + id);
  const every = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
  const K = MURAL_KINDS[cfg.kind] || MURAL_KINDS.mural;

  let theme = 'light';
  try { if (localStorage.getItem('sot_theme2') === 'dark') theme = 'dark'; } catch (e) {}
  root.setAttribute('data-theme', theme);
  root.querySelectorAll('#muralSeg a').forEach((a) => a.classList.toggle('on', a.dataset.k === K.key));
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  if (window.innerWidth <= 720) root.classList.add('full');

  function bootMsg(t) { const e = $('msg'); if (e) e.textContent = t; }
  // THE WAITING SCREEN (owner, 2026-11-19): a kind whose first board has not
  // opened yet shows when it opens and counts down, and sends the reader to the
  // one that is open. It reloads itself into the board at the opening.
  let waitT = null;
  function waitScreen() {
    const other = K.key === 'mural' ? MURAL_KINDS.muraltoo : MURAL_KINDS.mural;
    const opens = muralFirstOpens(K.key);
    const el = document.createElement('div');
    el.className = 'fin show';
    el.innerHTML = '<div class="finIn" style="padding-top:12vh">'
      + '<div class="eb">' + K.name + ' \u00b7 ' + K.runs + '</div>'
      + '<h2>Opens At ' + K.opensAt + '</h2>'
      + '<p class="lead" id="waitLead"></p>'
      + '<p class="rule">' + K.name + ' is a 10,000 piece jigsaw the whole site builds together, the twin of ' + other.name + '. A new one opens every day at ' + K.opensAt.toLowerCase().replace(' et', ' ET') + ' and runs for 24 hours.</p>'
      + (muralLaunched(other.key) ? '<a class="primary" style="display:inline-block;width:auto;margin-top:14px;text-decoration:none" href="' + other.route + '">Play ' + other.name + ' Now</a>' : '')
      + '<p class="rule" style="margin-top:18px"><a href="/" style="color:inherit">Back To Mind Loft</a></p>'
      + '</div>';
    root.appendChild(el);
    const lead = el.querySelector('#waitLead');
    const tick = () => {
      const left = opens - Date.now();
      if (left <= 0) { clearInterval(waitT); window.location.reload(); return; }
      const m = Math.ceil(left / 60000), h = Math.floor(m / 60);
      lead.textContent = 'The first ' + K.name + ' opens in ' + (h ? h + (h === 1 ? ' hour' : ' hours') + ' and ' : '') + (m % 60) + (m % 60 === 1 ? ' minute.' : ' minutes.');
    };
    tick();
    waitT = setInterval(tick, 15000);
  }
  function loadImg(id, w) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = `/api/mural/img?id=${id}&w=${w}`; });
  }

  (async () => {
    try {
      // A SHELF COPY (owner, 2026-11-19): ?solo=<id> opens a finished or closed
      // mural to build alone. Nothing is sent to the server and nothing scores;
      // the pieces placed are kept in this browser.
      const sp = parseMuralId(cfg.solo);
      const solo = sp && sp.kind === K.key && muralWindow(cfg.solo).closes <= Date.now() ? cfg.solo : null;
      if (!solo && !muralLaunched(K.key)) { waitScreen(); return; }
      const id = solo || currentMuralId(K.key);
      bootMsg(`Opening ${K.name}.`);
      const b = await getJSON(`/api/mural/board?id=${id}`);
      if (dead) return;
      if (!b.ok || !b.j || !b.j.grades) { bootMsg(`${K.name} is not open yet. Check back in a minute.`); return; }
      const phone = window.innerWidth <= 720;
      // Phones take the full 3840 photo too (see SHARPNESS in start): half size
      // left 15 source pixels a piece. Only a device that reports little memory
      // starts smaller, and a failed load falls back a size.
      const big = !((navigator.deviceMemory || 8) <= 4);
      let img;
      try { img = await loadImg(id, big ? 3840 : 1920); }
      catch (e) { img = await loadImg(id, big ? 1920 : 960); }
      const anon = getAnonId(), email = getEmail();
      const q = `id=${id}&anonId=${encodeURIComponent(anon || '')}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
      const [st, me] = await Promise.all([getJSON(`/api/mural/state?id=${id}`), getJSON(`/api/mural/me?${q}`)]);
      if (dead) return;
      const wasDone = !!(st.j && (st.j.completed || (st.j.n || 0) >= MURAL_COLS * MURAL_ROWS));
      if (solo || (cfg.solo === id && wasDone)) {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem('mural_solo_' + id) || 'null'); } catch (e) { saved = null; }
        start({ id, board: b.j, img, state: {}, me: { pieces: (saved && saved.pieces) || [], points: 0, firsts: 0 }, anon, email, q, solo: true, crowd: st.j || {} });
        return;
      }
      start({ id, board: b.j, img, state: st.j || {}, me: me.j || {}, anon, email, q });
    } catch (e) {
      console.error('mural', e);
      bootMsg(`${K.name} could not load. Refresh to try again.`);
    }
  })();

  return () => {
    dead = true;
    if (waitT) clearInterval(waitT);
    ac.abort();
    timers.forEach(clearInterval);
    cleanups.forEach((f) => { try { f(); } catch (e) {} });
    if (ro) ro.disconnect();
    document.body.style.overflow = prevOverflow;
  };

  function start(env) {
const COLS=MURAL_COLS,ROWS=MURAL_ROWS,TOTAL=COLS*ROWS,UPDATE=120,GN=MURAL_GRADE_NAMES,GRADES=env.board.grades;
const img=env.img,want=COLS/ROWS;
let cw0=img.naturalWidth,ch0=Math.round(cw0/want);if(ch0>img.naturalHeight){ch0=img.naturalHeight;cw0=Math.round(ch0*want);}
const cx0=Math.floor((img.naturalWidth-cw0)/2),cy0=Math.floor((img.naturalHeight-ch0)/2);
const PS=Math.max(6,Math.min(30,Math.floor(cw0/COLS))),W=COLS*PS,H=ROWS*PS,MARG=PS*.27;
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function hashId(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

/* ---------- pieces ---------- */
let Hs,Vs;
function cutEdges(seed){const R=rng32(seed*31+7);Hs=new Int8Array((ROWS+1)*COLS);Vs=new Int8Array(ROWS*(COLS+1));for(let i=0;i<Hs.length;i++)Hs[i]=R()<.5?1:-1;for(let i=0;i<Vs.length;i++)Vs[i]=R()<.5?1:-1;}
function edge(ctx,ax,ay,bx,by,s,nx,ny){
  if(!s){ctx.lineTo(bx,by);return;}
  const L=Math.abs(bx-ax)+Math.abs(by-ay),p=(a,b)=>[ax+(bx-ax)*a+nx*b*s*L,ay+(by-ay)*a+ny*b*s*L];
  let q=p(.4,0);ctx.lineTo(q[0],q[1]);
  let c1=p(.44,.04),c2=p(.36,.1),e=p(.38,.16);ctx.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],e[0],e[1]);
  c1=p(.39,.26);c2=p(.61,.26);e=p(.62,.16);ctx.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],e[0],e[1]);
  c1=p(.64,.1);c2=p(.56,.04);e=p(.6,0);ctx.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],e[0],e[1]);
  ctx.lineTo(bx,by);
}
function piecePath(ctx,id){
  const c=id%COLS,r=(id/COLS)|0,x=c*PS,y=r*PS;
  ctx.beginPath();ctx.moveTo(x,y);
  edge(ctx,x,y,x+PS,y,r>0?Hs[r*COLS+c]:0,0,1);
  edge(ctx,x+PS,y,x+PS,y+PS,c<COLS-1?Vs[r*(COLS+1)+c+1]:0,1,0);
  edge(ctx,x+PS,y+PS,x,y+PS,r<ROWS-1?Hs[(r+1)*COLS+c]:0,0,1);
  edge(ctx,x,y+PS,x,y,c>0?Vs[r*(COLS+1)+c]:0,1,0);
  ctx.closePath();
}
function drawPiece(ctx,id,line){
  const c=id%COLS,r=(id/COLS)|0,x0=Math.max(0,c*PS-MARG),y0=Math.max(0,r*PS-MARG),x1=Math.min(W,(c+1)*PS+MARG),y1=Math.min(H,(r+1)*PS+MARG);
  ctx.save();piecePath(ctx,id);ctx.clip();ctx.drawImage(src,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0);ctx.restore();
  piecePath(ctx,id);ctx.strokeStyle=line||'rgba(0,0,0,.3)';ctx.lineWidth=.8;ctx.stroke();
}
function pieceCanvas(id,cssPx,cv){
  const dpr=Math.min(2,window.devicePixelRatio||1),full=PS+2*MARG,k=cssPx*dpr/full;
  cv=cv||document.createElement('canvas');cv.width=cv.height=Math.round(cssPx*dpr);cv.style.width=cv.style.height=cssPx+'px';
  const ctx=cv.getContext('2d'),c=id%COLS,r=(id/COLS)|0;
  ctx.setTransform(k,0,0,k,-(c*PS-MARG)*k,-(r*PS-MARG)*k);
  drawPiece(ctx,id,'rgba(0,0,0,.55)');
  return cv;
}
const src=mk(W,H),crowdL=mk(W,H),mineL=mk(W,H);
const sctx=src.getContext('2d'),cctx=crowdL.getContext('2d'),mctx=mineL.getContext('2d');
sctx.drawImage(img,cx0,cy0,cw0,ch0,0,0,W,H);
const cv=$('cv'),ctx=cv.getContext('2d'),refCv=$('refCv');refCv.height=Math.round(refCv.width*H/W);const rctx=refCv.getContext('2d');
const M={crowd:new Set(),mine:new Set(),pts:0,firsts:0,hours:0,hand:[],loose:[],done:false,rank:null,name:null};
let STATE=env.state||{};
// SHARPNESS (owner, 2026-11-19, a phone screenshot of a smeared piece: "have to
// fix this piece clarity, looks awful"). A piece is only PS source pixels wide
// (30 from the 3840 photo), so the closest zoom stops at 64 CSS px a piece;
// it used to go to 110 and the phone loaded the half-size photo on top of that.
const view={s:1,tx:0,ty:0,cw:0,ch:0,min:.1,max:64/PS};
let valDirty=true,isPhone=false,C={},sel=null,refTab='pic',pulses=[],needDraw=false,tick=UPDATE,HANDN=8,TSZ=68,finShown=false;
function colors(){const cs=getComputedStyle(root);C={bd:cs.getPropertyValue('--bd').trim(),slot:cs.getPropertyValue('--slot').trim(),ink:cs.getPropertyValue('--ink').trim(),page:cs.getPropertyValue('--page').trim()};}
const SOLO=!!env.solo;
function hoursOpen(){return SOLO?0:Math.max(0,Math.floor((Date.now()-env.board.opens)/3600000));}

/* ---------- grading ---------- */
function has(id){return M.crowd.has(id)||M.mine.has(id);}
function nbCount(id){const c=id%COLS,r=(id/COLS)|0;let n=0;if(c>0&&has(id-1))n++;if(c<COLS-1&&has(id+1))n++;if(r>0&&has(id-COLS))n++;if(r<ROWS-1&&has(id+COLS))n++;return n;}
function valueOf(id){const g=gradeAt(GRADES,id),first=!M.crowd.has(id),n=nbCount(id),age=first?1+Math.min(1,.05*Math.max(0,M.hours)):1;return {v:pieceValue({grade:g,hours:M.hours,neighbours:n,first}),g,first,age,n};}
function explainVal(id){const o=valueOf(id),p=['grade '+o.g];if(o.age>1)p.push('plus '+Math.round((o.age-1)*100)+'% for going unclaimed');if(o.first)p.push('doubled for a first');if(o.n)p.push(Math.min(80,o.n*20)+'% off for '+o.n+' neighbor'+(o.n>1?'s':'')+' in place');return GN[o.g]+'. Worth '+o.v+': '+p.join(', ')+'.';}
let valCv=null;
function valueMap(){if(valCv&&!valDirty)return valCv;valCv=valCv||mk(COLS,ROWS);const x=valCv.getContext('2d'),im=x.createImageData(COLS,ROWS),d=im.data;
  for(let id=0;id<TOTAL;id++){const o=id*4;if(has(id)){d[o+3]=0;continue;}const t=Math.min(1,valueOf(id).v/40);d[o]=253-131*t;d[o+1]=243-184*t;d[o+2]=208-208*t;d[o+3]=255;}
  x.putImageData(im,0,0);valDirty=false;return valCv;}
/* ---------- view ---------- */
function resize(){
  const r=$('stage').getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  view.cw=r.width;view.ch=r.height;cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);
  const phone=window.innerWidth<=720;isPhone=phone;HANDN=2*(phone?5:Math.max(6,Math.floor((window.innerWidth-28+8)/76)));/* two rows (owner, 2026-11-19: "show more pieces ... Second row?") */TSZ=phone?Math.floor((window.innerWidth-20-4*8)/5):68;TSZ=Math.min(TSZ,68);
  view.min=Math.min(view.cw/W,view.ch/H)*.94;
}
function fit(){view.s=view.min;view.tx=(view.cw-W*view.s)/2;view.ty=(view.ch-H*view.s)/2;req();}
function clampView(){view.tx=Math.min(view.cw*.5,Math.max(view.cw*.5-W*view.s,view.tx));view.ty=Math.min(view.ch*.5,Math.max(view.ch*.5-H*view.s,view.ty));}
function zoomAt(px,py,f){const ns=Math.min(view.max,Math.max(view.min,view.s*f));view.tx=px-(px-view.tx)*ns/view.s;view.ty=py-(py-view.ty)*ns/view.s;view.s=ns;clampView();req();}
function req(){if(!needDraw){needDraw=true;requestAnimationFrame(draw);}}
function draw(){
  needDraw=false;const dpr=cv.width/view.cw;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=C.bd;ctx.fillRect(0,0,view.cw,view.ch);
  ctx.save();ctx.translate(view.tx,view.ty);ctx.scale(view.s,view.s);
  ctx.fillStyle=C.slot;ctx.fillRect(0,0,W,H);ctx.imageSmoothingQuality='high';
  ctx.globalAlpha=.4;ctx.drawImage(crowdL,0,0);ctx.globalAlpha=1;ctx.drawImage(mineL,0,0);
  const now=performance.now();pulses=pulses.filter(p=>now-p.t<(p.nw?4000:700));
  for(const p of pulses){const c=p.id%COLS,r=(p.id/COLS)|0;if(p.nw){const a=1-(now-p.t)/4000;ctx.globalAlpha=a*.75;ctx.fillStyle='#f2c230';ctx.fillRect(c*PS,r*PS,PS,PS);continue;}const a=1-(now-p.t)/700,g=(1-a)*PS*.9;ctx.strokeStyle=C.ink;ctx.globalAlpha=a;ctx.lineWidth=3/view.s;ctx.strokeRect(c*PS-g,r*PS-g,PS+2*g,PS+2*g);}
  ctx.globalAlpha=1;
  for(const l of M.loose){ctx.save();ctx.translate(l.x-(l.id%COLS+.5)*PS,l.y-(((l.id/COLS)|0)+.5)*PS);ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=6;drawPiece(ctx,l.id,'rgba(0,0,0,.6)');ctx.restore();}
  ctx.restore();
  ctx.strokeStyle=C.ink;ctx.lineWidth=1;ctx.strokeRect(Math.round(view.tx)+.5,Math.round(view.ty)+.5,Math.round(W*view.s),Math.round(H*view.s));
  drawRef();
  if(pulses.length)req();
}
function drawRef(){
  if($('ref').classList.contains('mini'))return;
  const w=refCv.width,h=refCv.height;rctx.setTransform(1,0,0,1,0,0);rctx.fillStyle=C.slot;rctx.fillRect(0,0,w,h);rctx.imageSmoothingQuality='high';
  if(refTab==='pic')rctx.drawImage(src,0,0,w,h);else if(refTab==='val'){rctx.imageSmoothingEnabled=false;rctx.drawImage(valueMap(),0,0,w,h);rctx.imageSmoothingEnabled=true;}else{rctx.drawImage(crowdL,0,0,w,h);rctx.drawImage(mineL,0,0,w,h);}
  const k=w/W,x=Math.max(0,-view.tx/view.s)*k,y=Math.max(0,-view.ty/view.s)*k,x2=Math.min(W,(view.cw-view.tx)/view.s)*k,y2=Math.min(H,(view.ch-view.ty)/view.s)*k;
  if(x2-x<w-2||y2-y<h-2){rctx.strokeStyle='#ffffff';rctx.lineWidth=5;rctx.strokeRect(x,y,x2-x,y2-y);rctx.strokeStyle='#15171c';rctx.lineWidth=2;rctx.strokeRect(x,y,x2-x,y2-y);}
}
const toSrc=(px,py)=>[(px-view.tx)/view.s,(py-view.ty)/view.s];
/* ---------- hand ---------- */
function allOpen(){const busy=new Set(M.loose.map(l=>l.id)),out=[];for(let id=0;id<TOTAL;id++)if(!M.mine.has(id)&&!busy.has(id))out.push(id);return out;}
function dealAll(){M.hand=[];const pool=allOpen();for(let k=0;k<HANDN;k++){if(!pool.length){M.hand.push(null);continue;}const j=Math.floor(Math.random()*pool.length);M.hand.push(pool[j]);pool[j]=pool[pool.length-1];pool.pop();}sel=null;renderHand();}
function renderHand(){
  const h=$('hand');h.innerHTML='';
  for(let k=0;k<HANDN;k++){
    const id=M.hand[k],b=document.createElement('button');b.className='piece'+(id===null||id===undefined?' empty':'')+(sel===k?' sel':'');b.dataset.k=k;b.style.width=b.style.height=TSZ+'px';
    if(id!==null&&id!==undefined&&!M.done){b.appendChild(pieceCanvas(id,TSZ-10));const o=valueOf(id),t=document.createElement('span');t.className='x2'+(o.first?'':' v1');t.textContent=(o.first?'1st ':'')+o.v;b.appendChild(t);b.setAttribute('aria-label','Piece worth '+o.v+(o.first?', first placement':''));}
    else b.disabled=true;
    h.appendChild(b);
  }
}
function setMsg(t){$('msg').textContent=t;}
function ui(){
  $('sPts').textContent=M.pts;$('menuBtn').textContent='Menu \u00b7 '+M.pts+' pts';$('sLeft').textContent=M.mine.size;$('sFirst').textContent=M.firsts;
  const done=M.crowd.size+[...M.mine].filter(i=>!M.crowd.has(i)).length;
  $('meta').textContent='Open '+M.hours+(M.hours===1?' hour':' hours')+' \u00b7 '+Math.round(done/TOTAL*100)+'% placed';
  coolTick();
}
function tol(){return Math.max(PS*.8,26/view.s);}
function attempt(id,sx,sy,from){
  if(M.done)return;
  const hx=(id%COLS+.5)*PS,hy=(((id/COLS)|0)+.5)*PS;
  if(Math.hypot(sx-hx,sy-hy)<=tol()){
    const val=valueOf(id),first=val.first;send(id,val,0);M.mine.add(id);drawPiece(mctx,id);M.pts+=val.v;if(first)M.firsts++;valDirty=true;
    M.loose=M.loose.filter(l=>l.id!==id);
    if(from!==null&&from!==undefined&&M.hand[from]===id)M.hand[from]=null;const hi=M.hand.indexOf(id);if(hi>=0)M.hand[hi]=null;if(M.hand.every(x=>x===null||x===undefined)&&M.mine.size<TOTAL)dealAll();
    pulses.push({id,t:performance.now()});sel=null;
    setMsg((first?'First on the mural. ':'Placed. ')+val.v+(val.v===1?' point':' points')+' ('+GN[val.g].toLowerCase()+').');
    if(M.mine.size>=TOTAL)finish();
    renderHand();ui();req();return true;
  }
  const ex=M.loose.find(l=>l.id===id);
  if(ex){ex.x=sx;ex.y=sy;}else{M.loose.push({id,x:sx,y:sy});if(from!==null&&from!==undefined)M.hand[from]=null;}
  sel=null;setMsg('Not there. It stays on the board until you move it home. No penalty.');renderHand();req();return false;
}
function finish(){
  M.done=true;
  $('dTitle').textContent='You placed all 10,000';
  $('dLead').textContent='Every piece of '+K.name+' is on your board. Standings settle when it closes.';
  $('dPts').textContent=M.pts;$('dFirst').textContent=M.firsts;$('dMiss').textContent=M.mine.size;
  setTimeout(()=>$('doneSheet').classList.add('show'),700);
}
/* ---------- the server ---------- */
function applyState(s){
  const add=[];
  if(s&&typeof s.placed==='string'){STATE=s;for(let i=0;i<TOTAL;i++)if(s.placed.charCodeAt(i)===49&&!M.crowd.has(i)){M.crowd.add(i);add.push(i);}}
  return add;
}
function applyMe(j){
  if(!j||!Array.isArray(j.pieces))return;
  M.name=j.name||null;M.rank=j.rank||null;
  for(const id of j.pieces)if(Number.isInteger(id)&&id>=0&&id<TOTAL&&!M.mine.has(id)){M.mine.add(id);drawPiece(mctx,id);}
  if(typeof j.points==='number'&&!pending){M.pts=j.points;M.firsts=j.firsts||0;}
}
let pending=0;
/* SITE POINTS: the place route files the day's running total at most every ten
   minutes; this forces the last one through when the player goes idle or leaves. */
let creditDirty=false,creditT=null;
function creditBody(){return JSON.stringify({id:env.id,anonId:env.anon,email:env.email||undefined});}
function creditNow(){
  if(!creditDirty||SOLO)return;creditDirty=false;
  fetch('/api/mural/credit',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:creditBody()}).catch(()=>{creditDirty=true;});
}
function creditSoon(){creditDirty=true;clearTimeout(creditT);creditT=setTimeout(creditNow,45000);}
function creditLeave(){
  if(!creditDirty||SOLO)return;creditDirty=false;
  try{if(navigator.sendBeacon&&navigator.sendBeacon('/api/mural/credit',creditBody()))return;}catch(e){}
  creditDirty=true;creditNow();
}
const onHide=()=>{if(document.visibilityState==='hidden')creditLeave();};
document.addEventListener('visibilitychange',onHide);window.addEventListener('pagehide',creditLeave);
cleanups.push(()=>{document.removeEventListener('visibilitychange',onHide);window.removeEventListener('pagehide',creditLeave);clearTimeout(creditT);});
function saveSolo(){try{localStorage.setItem('mural_solo_'+env.id,JSON.stringify({pieces:[...M.mine]}));}catch(e){}}
function send(id,val,tries){
  if(SOLO){setTimeout(saveSolo,0);return;}
  if(!tries)pending++;
  fetch('/api/mural/place',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:env.id,piece:id,anonId:env.anon,email:env.email||undefined})})
    .then(r=>r.json().then(j=>({ok:r.ok,status:r.status,j})))
    .then(o=>{
      if(dead)return;
      if(o.ok&&o.j&&typeof o.j.points==='number'){
        pending--;creditSoon();
        if(o.j.points!==val.v||o.j.first!==val.first){
          M.pts+=o.j.points-val.v;
          if(val.first&&!o.j.first){M.firsts--;M.crowd.add(id);drawPiece(cctx,id);setMsg('Someone got there first. '+o.j.points+(o.j.points===1?' point.':' points.'));}
          else if(!val.first&&o.j.first)M.firsts++;
          valDirty=true;renderHand();ui();req();
        }
      }else if(o.status===409){pending--;setMsg(K.name+' has closed.');poll();}
      else throw new Error('place');
    })
    .catch(()=>{if(dead)return;if(tries<3)setTimeout(()=>send(id,val,tries+1),1500*(tries+1));else{pending--;setMsg('That piece did not save. Check your connection.');}});
}
let flashUntil=0,lastPoll=Date.now(),polling=false;
function flashUpdate(n){flashUntil=Date.now()+5000;$('updBox').classList.add('flash');$('sUpd').textContent='+'+n;$('updLab').textContent=n===1?'New piece':'New pieces';}
async function poll(){
  if(polling||dead||SOLO)return;polling=true;
  try{
    const had=M.hand.filter(x=>x!==null&&x!==undefined&&!M.crowd.has(x));
    const [st,me]=await Promise.all([getJSON('/api/mural/state?id='+env.id),getJSON('/api/mural/me?'+env.q)]);
    if(dead)return;
    lastPoll=Date.now();tick=UPDATE;M.hours=hoursOpen();
    if(me.ok)applyMe(me.j);
    if(st.ok){
      const add=applyState(st.j),t0=performance.now(),fresh=add.filter(id=>!M.mine.has(id));
      add.forEach(id=>drawPiece(cctx,id));fresh.forEach(id=>pulses.push({id,t:t0,nw:true}));
      if(fresh.length){
        const lost=had.filter(x=>M.crowd.has(x)).length;valDirty=true;flashUpdate(fresh.length);
        setMsg(K.name+' updated: '+fresh.length+(fresh.length===1?' new piece':' new pieces')+' from the crowd.'+(lost?' '+lost+' in your tray '+(lost>1?'were':'was')+' placed by someone else and '+(lost>1?'have':'has')+' lost the first bonus.':''));
      }
    }
    renderHand();ui();req();
    if($('lbSheet').classList.contains('show'))standings();
    checkEnd();
  }catch(e){}finally{polling=false;}
}
function checkEnd(){
  if(finShown)return;
  const complete=SOLO?M.mine.size>=TOTAL:(!!STATE.completed||(STATE.n||0)>=TOTAL),closed=!SOLO&&Date.now()>=env.board.closes;
  if(complete||closed){M.done=true;renderHand();ui();finShown=true;setTimeout(()=>showFinish(complete,closed),900);}
}
every(()=>{
  tick--;
  if(tick<=0){tick=UPDATE;if(!document.hidden)poll();}
  if(Date.now()<flashUntil)return;
  $('updBox').classList.remove('flash');$('updLab').textContent='To update';$('sUpd').textContent=Math.floor(tick/60)+':'+String(tick%60).padStart(2,'0');
},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastPoll>UPDATE*1000)poll();},{signal:ac.signal});

function standings(){
  const n=STATE.n||0;
  $('lbTitle').textContent=K.name+' Standings';
  $('lbProg').textContent=n.toLocaleString()+' of '+TOTAL.toLocaleString()+' pieces placed';
  $('lbBar').style.width=(n/TOTAL*100)+'%';
  const rows=(STATE.top||[]).map((r,i)=>({rank:i+1,n:r.name,pts:r.points,first:r.firsts,pieces:r.pieces,me:!!(M.name&&r.member&&r.name===M.name)}));
  if(!rows.some(r=>r.me)&&M.mine.size)rows.push({rank:M.rank||'',n:'You',pts:M.pts,first:M.firsts,pieces:M.mine.size,me:true});
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  $('lbTable').innerHTML='<tr><th></th><th>Player</th><th class="n">Points</th><th class="n">Firsts</th><th class="n">Placed</th></tr>'+(rows.length?rows.map(r=>'<tr class="'+(r.me?'me':'')+'"><td>'+r.rank+'</td><td>'+esc(r.n)+'</td><td class="n">'+r.pts.toLocaleString()+'</td><td class="n">'+r.first.toLocaleString()+'</td><td class="n">'+r.pieces.toLocaleString()+'</td></tr>').join(''):'<tr><td></td><td>Nobody has placed a piece yet.</td><td></td><td></td><td></td></tr>');
}

/* ---------- board gestures ---------- */
const ptrs=new Map();let gest=null;
function looseAt(sx,sy){for(let i=M.loose.length-1;i>=0;i--){const l=M.loose[i];if(Math.abs(sx-l.x)<PS*.7&&Math.abs(sy-l.y)<PS*.7)return l;}return null;}
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;ptrs.set(e.pointerId,{x,y});
  if(ptrs.size===1){const s=toSrc(x,y),l=M.done?null:looseAt(s[0],s[1]);gest={x0:x,y0:y,tx:view.tx,ty:view.ty,moved:false,loose:l,ox:l?l.x-s[0]:0,oy:l?l.y-s[1]:0};}
  else if(ptrs.size===2){const a=[...ptrs.values()];gest={pinch:true,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),s:view.s};}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;ptrs.set(e.pointerId,{x,y});
  if(!gest)return;
  if(gest.pinch&&ptrs.size>=2){const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;zoomAt(mx,my,(gest.s*d/gest.d)/view.s);return;}
  if(gest.pinch)return;
  if(!gest.moved&&Math.hypot(x-gest.x0,y-gest.y0)>6)gest.moved=true;
  if(!gest.moved)return;
  if(gest.loose){const s=toSrc(x,y);gest.loose.x=s[0]+gest.ox;gest.loose.y=s[1]+gest.oy;req();}
  else{cv.classList.add('pan');view.tx=gest.tx+x-gest.x0;view.ty=gest.ty+y-gest.y0;clampView();req();}
});
function up(e){
  if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);cv.classList.remove('pan');
  if(gest&&!gest.pinch&&ptrs.size===0){
    if(gest.loose){if(gest.moved)attempt(gest.loose.id,gest.loose.x,gest.loose.y,null);}
    else if(!gest.moved&&sel!==null&&M.hand[sel]!==null){const s=toSrc(p.x,p.y);if(s[0]>=0&&s[0]<=W&&s[1]>=0&&s[1]<=H)attempt(M.hand[sel],s[0],s[1],sel);}
  }
  if(ptrs.size===0)gest=null;
}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(-e.deltaY*.0016));},{passive:false});
$('zIn').onclick=()=>zoomAt(view.cw/2,view.ch/2,1.6);$('zOut').onclick=()=>zoomAt(view.cw/2,view.ch/2,1/1.6);$('zFit').onclick=fit;
/* ---------- tray drag ---------- */
let td=null;
const hand=$('hand');
hand.addEventListener('pointerdown',e=>{const b=e.target.closest('.piece');if(!b||b.disabled)return;const k=+b.dataset.k;if(M.hand[k]===null||M.done)return;b.setPointerCapture(e.pointerId);td={k,id:M.hand[k],x0:e.clientX,y0:e.clientY,b,drag:false,touch:e.pointerType==='touch'};});
hand.addEventListener('pointermove',e=>{
  if(!td)return;
  if(!td.drag&&Math.hypot(e.clientX-td.x0,e.clientY-td.y0)>8){td.drag=true;const g=Math.max(46,(PS+2*MARG)*view.s);td.g=pieceCanvas(td.id,g);td.g.className='ghost';td.gs=g;root.appendChild(td.g);td.b.classList.add('out');}
  if(td.drag){td.cx=e.clientX;td.cy=e.clientY-(td.touch?td.gs*.75:0);td.g.style.left=(td.cx-td.gs/2)+'px';td.g.style.top=(td.cy-td.gs/2)+'px';}
});
function tup(e){
  if(!td)return;const t=td;td=null;
  if(t.drag){t.g.remove();t.b.classList.remove('out');const r=cv.getBoundingClientRect();
    if(t.cx>=r.left&&t.cx<=r.right&&t.cy>=r.top&&t.cy<=r.bottom){const s=toSrc(t.cx-r.left,t.cy-r.top);if(s[0]>=0&&s[0]<=W&&s[1]>=0&&s[1]<=H){attempt(t.id,s[0],s[1],t.k);return;}}
    renderHand();
  }else{sel=sel===t.k?null:t.k;renderHand();if(sel!==null)setMsg(explainVal(t.id));}
}
hand.addEventListener('pointerup',tup);hand.addEventListener('pointercancel',tup);
/* ---------- reference panel ---------- */
function refJump(e){const r=refCv.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*W,sy=(e.clientY-r.top)/r.height*H;if(view.s<view.min*1.8)view.s=Math.min(view.max,view.min*3.2);view.tx=view.cw/2-sx*view.s;view.ty=view.ch/2-sy*view.s;clampView();req();}
let refDown=false;
refCv.addEventListener('pointerdown',e=>{refDown=true;refCv.setPointerCapture(e.pointerId);refJump(e);});
refCv.addEventListener('pointermove',e=>{if(refDown)refJump(e);});
refCv.addEventListener('pointerup',()=>refDown=false);refCv.addEventListener('pointercancel',()=>refDown=false);
root.querySelectorAll('#refSeg button').forEach(b=>b.onclick=()=>{refTab=b.dataset.r;root.querySelectorAll('#refSeg button').forEach(x=>x.classList.toggle('on',x===b));$('refCap').textContent=refTab==='pic'?'The finished picture. Tap it to jump there. Drag the bar to move it.':refTab==='val'?'Pieces nobody has placed. Darker is worth more.':'Everything placed so far, by everyone.';req();});
let refState=0;
function setRef(n){refState=n;const r=$('ref');r.classList.toggle('big',n===1);r.classList.toggle('mini',n===2);$('refSize').textContent=n===0?'Larger':'Hide';clampRef();req();}
$('refSize').onclick=()=>setRef((refState+1)%3);
const refEl=$('ref');let rdrag=null;
function clampRef(){if(!refEl.style.left)return;const st=$('stage').getBoundingClientRect(),r=refEl.getBoundingClientRect();refEl.style.left=Math.max(4,Math.min(st.width-r.width-4,parseFloat(refEl.style.left)))+'px';refEl.style.top=Math.max(4,Math.min(st.height-r.height-4,parseFloat(refEl.style.top)))+'px';}
function refDragStart(e){const st=$('stage').getBoundingClientRect(),r=refEl.getBoundingClientRect();rdrag={ox:e.clientX-r.left,oy:e.clientY-r.top,x0:e.clientX,y0:e.clientY,moved:false,pill:e.currentTarget.id==='refShow'};e.currentTarget.setPointerCapture(e.pointerId);refEl.style.left=(r.left-st.left)+'px';refEl.style.top=(r.top-st.top)+'px';refEl.style.right='auto';refEl.classList.add('moving');e.preventDefault();}
function refDragMove(e){if(!rdrag)return;if(!rdrag.moved&&Math.hypot(e.clientX-rdrag.x0,e.clientY-rdrag.y0)<6)return;rdrag.moved=true;const st=$('stage').getBoundingClientRect();refEl.style.left=(e.clientX-st.left-rdrag.ox)+'px';refEl.style.top=(e.clientY-st.top-rdrag.oy)+'px';clampRef();}
function refDragEnd(){const d=rdrag;rdrag=null;refEl.classList.remove('moving');if(d&&d.pill&&!d.moved)setRef(0);}
[$('refGrip'),$('refCap'),$('refShow')].forEach(el=>{el.addEventListener('pointerdown',refDragStart);el.addEventListener('pointermove',refDragMove);el.addEventListener('pointerup',refDragEnd);el.addEventListener('pointercancel',refDragEnd);});
/* ---------- the finish ---------- */
function packBubbles(items,BW,BH){
  const total=items.reduce((a,b)=>a+b.p,0),k=Math.sqrt(.5*BW*BH/(Math.PI*total));
  items.forEach(o=>{o.r=Math.max(7,k*Math.sqrt(o.p));});
  items.sort((a,b)=>b.r-a.r);const done=[];
  for(const o of items){
    let ok=false;
    for(let t=0;t<6000&&!ok;t++){
      const a=t*.31,d=t*.42,x=BW/2+Math.cos(a)*d*(BW/BH),y=BH/2+Math.sin(a)*d;
      if(x-o.r<4||x+o.r>BW-4||y-o.r<4||y+o.r>BH-4)continue;
      ok=true;for(const q of done){const dx=q.x-x,dy=q.y-y,m=q.r+o.r+3;if(dx*dx+dy*dy<m*m){ok=false;break;}}
      if(ok){o.x=x;o.y=y;}
    }
    if(ok)done.push(o);
  }
  return done;
}
function confetti(){
  const c=$('confetti'),x=c.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);c.width=innerWidth*dpr;c.height=innerHeight*dpr;x.setTransform(dpr,0,0,dpr,0,0);
  const cols=['#e2574c','#f2a23a','#ffd23f','#3fa37a','#2f7fbf','#8a5ad1','#e86a92'],P=[];
  for(let i=0;i<170;i++)P.push({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.6,vx:(Math.random()-.5)*2.4,vy:2+Math.random()*3.5,w:6+Math.random()*7,h:4+Math.random()*5,a:Math.random()*6.3,va:(Math.random()-.5)*.3,c:cols[i%cols.length]});
  const t0=performance.now();
  (function step(){const t=performance.now()-t0;x.clearRect(0,0,innerWidth,innerHeight);if(t>5200||!$('fin').classList.contains('show'))return;
    x.globalAlpha=t>4200?1-(t-4200)/1000:1;
    for(const p of P){p.x+=p.vx+Math.sin((t+p.a*200)/300)*.6;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore();}
    requestAnimationFrame(step);})();
}
function showFinish(complete,closed){
  const phone=window.innerWidth<=720,BW=phone?360:748,BH=phone?470:440,fills=['pb','accent','pl','pp','pr','gold'];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const items=(STATE.contrib||[]).filter(o=>o.firsts>0).map((o,i)=>({n:o.name,p:o.firsts,f:fills[i%fills.length],me:!!(M.name&&o.name===M.name)}));
  const g=STATE.guests||{players:0,firsts:0};
  if(g.firsts>0)items.push({n:'Guests',p:g.firsts,f:'chip',sub:g.players+(g.players===1?' guest':' guests')});
  items.forEach(o=>{if(o.me)o.f='gold';});
  const placed=items.length?packBubbles(items,BW,BH):[];
  $('bubbles').setAttribute('viewBox','0 0 '+BW+' '+BH);
  $('bubbles').innerHTML=placed.map((o,i)=>{
    const fs=Math.max(10,Math.min(20,o.r*.3)),max=Math.floor(o.r*2/(fs*.6)),nm=o.me?'You':o.n,name=esc(nm.length>max?nm.slice(0,Math.max(1,max-1))+'.':nm);
    let t='';
    if(o.r>=24)t='<text x="'+o.x.toFixed(1)+'" y="'+(o.y-1).toFixed(1)+'" font-size="'+fs.toFixed(1)+'">'+name+'</text><text class="ct" x="'+o.x.toFixed(1)+'" y="'+(o.y+fs*1.05).toFixed(1)+'" font-size="'+(fs*.78).toFixed(1)+'">'+o.p.toLocaleString()+(o.sub&&o.r>=58?' · '+o.sub:'')+'</text>';
    else if(o.r>=13)t='<text class="'+(o.me?'':'ct')+'" x="'+o.x.toFixed(1)+'" y="'+(o.y+3.5).toFixed(1)+'" font-size="10">'+(o.me?'You':o.p)+'</text>';
    return '<g class="'+(o.me?'me':'')+'" style="animation-delay:'+(350+i*45)+'ms"><circle cx="'+o.x.toFixed(1)+'" cy="'+o.y.toFixed(1)+'" r="'+o.r.toFixed(1)+'" style="fill:var(--'+o.f+')"><title>'+esc(o.n)+': '+o.p.toLocaleString()+' pieces</title></circle>'+t+'</g>';
  }).join('');
  const pc=$('finPic');pc.width=Math.min(1500,W);pc.height=Math.round(pc.width*H/W);
  const px=pc.getContext('2d');
  if(complete)px.drawImage(src,0,0,pc.width,pc.height);else{px.fillStyle=C.slot;px.fillRect(0,0,pc.width,pc.height);px.drawImage(crowdL,0,0,pc.width,pc.height);px.drawImage(mineL,0,0,pc.width,pc.height);}
  const n=STATE.n||0,players=STATE.players||0,hrs=STATE.completed?Math.max(0,Math.floor((Date.parse(STATE.completed)-env.board.opens)/3600000)):hoursOpen();
  $('finEb').textContent=K.name+' · '+K.runs;
  $('finTitle').textContent=K.name+(complete?' Complete':' Closed');
  $('finLead').textContent=(complete?TOTAL.toLocaleString()+' pieces, placed by ':n.toLocaleString()+' of '+TOTAL.toLocaleString()+' pieces placed, by ')+players.toLocaleString()+(players===1?' player':' players')+' and '+(g.players||0).toLocaleString()+((g.players||0)===1?' guest':' guests')+'.'+(complete&&!closed?' Finished '+hrs+(hrs===1?' hour':' hours')+' after it opened.':'');
  $('fFirst').textContent=M.firsts.toLocaleString();$('fShare').textContent=(M.firsts/TOTAL*100).toFixed(M.firsts/TOTAL<.1?1:0)+'%';$('fPts').textContent=M.pts.toLocaleString();$('fRank').textContent=M.mine.size&&M.rank?M.rank:'–';
  $('finCredit').textContent=creditLine();
  if(closed){$('finClose').textContent='Play The New '+K.name;$('finClose').onclick=()=>window.location.reload();}
  if(SOLO){$('finTitle').textContent=K.name+' Complete';$('finLead').textContent='All '+TOTAL.toLocaleString()+' pieces, placed by you alone.';}
  else finNext(complete,closed);
  $('fin').classList.add('show');$('fin').scrollTop=0;if(complete)confetti();
}
/* WHAT COMES AFTER (owner, 2026-11-19): a finished mural is closed. Say so, say
   what this player gave it, point at the Puzzle Shelf where it can be built
   alone, and either offer the other mural (if it is open and unfinished) or
   count down to the next one of this kind, which the page then loads itself. */
let nextT=null;
function finNext(complete,closed){
  let box=$('finNext');
  if(!box){box=document.createElement('div');box.id='finNext';$('finLead').insertAdjacentElement('afterend',box);}
  const other=K.key==='mural'?MURAL_KINDS.muraltoo:MURAL_KINDS.mural;
  const mine=M.firsts?' You placed '+M.firsts.toLocaleString()+(M.firsts===1?' piece':' pieces')+' first and scored '+M.pts.toLocaleString()+(M.pts===1?' point.':' points.'):(M.mine.size?' You placed '+M.mine.size.toLocaleString()+(M.mine.size===1?' piece.':' pieces.'):'');
  const note=complete?'This '+K.name+' is finished, so it is closed. Every piece is on the wall.'+mine:'This '+K.name+' has closed.'+mine;
  box.innerHTML='<p class="rule" style="margin-top:4px">'+note+'</p>'
    +'<p class="rule" id="finCount" style="font-weight:800;color:var(--ink)"></p>'
    +'<div id="finOther"></div>'
    +'<p class="rule"><a href="/jig/shelf?tab=murals" style="color:inherit;font-weight:800">Build It Yourself On The Puzzle Shelf</a></p>';
  clearInterval(nextT);
  if(!closed){
    const opens=env.board.closes;
    const tickN=()=>{
      const left=opens-Date.now();
      if(left<=0){clearInterval(nextT);window.location.reload();return;}
      const m=Math.ceil(left/60000),h=Math.floor(m/60);
      const e=$('finCount');if(e)e.textContent='The next '+K.name+' opens in '+(h?h+(h===1?' hour':' hours')+' and ':'')+(m%60)+(m%60===1?' minute.':' minutes.');
    };
    tickN();nextT=setInterval(tickN,15000);timers.push(nextT);
    $('finClose').textContent='Look At The Finished '+K.name;
  }
  if(muralLaunched(other.key)){
    getJSON('/api/mural/state?id='+currentMuralId(other.key)).then(o=>{
      if(dead||!o.ok||!o.j)return;
      const open=!o.j.completed&&(o.j.n||0)<(o.j.total||TOTAL);
      const e=$('finOther');
      if(e&&open)e.innerHTML='<a class="primary" style="display:inline-block;width:auto;text-decoration:none" href="'+other.route+'">Play '+other.name+' Now</a>';
    }).catch(()=>{});
  }
}
function creditLine(){const p=env.board.photo||{};return p.name?'Photo: '+p.name+(p.by?', by '+p.by:'')+(p.lic?' ('+p.lic+')':'')+', Wikimedia Commons.':'';}
$('finClose').onclick=()=>$('fin').classList.remove('show');
$('finLb').onclick=()=>{$('fin').classList.remove('show');standings();$('lbSheet').classList.add('show');};

/* ---------- wiring ---------- */
/* No wait on Refresh (owner, 2026-11-19: "Remove the refresh limit"); the 10 second timer is gone. */
function coolTick(){const b=$('dealBtn');b.disabled=!!(M&&M.done);b.textContent='Refresh';}
function refreshSet(){if(M.done)return;dealAll();setMsg(M.hand.some(x=>x!==null)?'New set, from anywhere on the mural. Use the picture to find where each one goes.':'You have placed everything.');}
$('dealBtn').onclick=refreshSet;
$('helpBtn').onclick=()=>$('helpSheet').classList.add('show');
$('lbBtn').onclick=()=>{standings();$('lbSheet').classList.add('show');};
$('dOther').onclick=()=>{window.location.href=K.key==='mural'?'/muraltoo':'/mural';};
$('themeBtn').onclick=()=>{theme=theme==='dark'?'light':'dark';root.setAttribute('data-theme',theme);$('themeBtn').textContent=theme==='dark'?'Light':'Dark';colors();valDirty=true;req();};
$('themeBtn').textContent=theme==='dark'?'Light':'Dark';
root.querySelectorAll('.sheet .in').forEach(el=>{const sc=document.createElement('div');sc.className='sc';while(el.firstChild)sc.appendChild(el.firstChild);el.appendChild(sc);});
root.querySelectorAll('.sheet').forEach(s=>{s.addEventListener('click',e=>{if(e.target===s||e.target.hasAttribute('data-close'))s.classList.remove('show');});});
document.addEventListener('keydown',e=>{if(e.key==='Escape')root.querySelectorAll('.sheet').forEach(s=>s.classList.remove('show'));if(e.key==='+'||e.key==='=')zoomAt(view.cw/2,view.ch/2,1.4);if(e.key==='-')zoomAt(view.cw/2,view.ch/2,1/1.4);if(e.key==='0')fit();},{signal:ac.signal});
window.addEventListener('resize',()=>{resize();clampView();clampRef();if(M.hand.length!==HANDN)dealAll();else renderHand();req();},{signal:ac.signal});
function setFull(on){const wasFit=view.s<=view.min*1.001;root.classList.toggle('full',on);const cx=(view.cw/2-view.tx)/view.s,cy=(view.ch/2-view.ty)/view.s;resize();if(M){if(wasFit)fit();else{view.tx=view.cw/2-cx*view.s;view.ty=view.ch/2-cy*view.s;clampView();}clampRef();req();}}
$('fullBtn').onclick=()=>setFull(true);$('menuBtn').onclick=()=>setFull(false);

cutEdges(hashId(env.id));
colors();resize();
M.hours=hoursOpen();
applyState(env.state).forEach(id=>drawPiece(cctx,id));
applyMe(env.me);
if(SOLO){for(const q of ['#lbBtn','#updBox']){const sg=root.querySelector(q);if(sg)sg.style.display='none';}}
$('credit').textContent=creditLine();
fit();if(isPhone){view.s=Math.min(view.max,37/PS);view.tx=view.cw/2-W*.5*view.s;view.ty=view.ch/2-H*.5*view.s;clampView();}
dealAll();
setMsg(SOLO?'Shelf copy: build it alone, at your own pace. Nothing here scores, and your pieces are kept in this browser.':'Drag a piece onto the mural, or tap a piece and then tap its spot.');
ui();draw();
ro=new ResizeObserver(()=>{const r=$('stage').getBoundingClientRect();if(Math.abs(r.width-view.cw)<1&&Math.abs(r.height-view.ch)<1)return;const wasFit=view.s<=view.min*1.001;resize();if(wasFit)fit();else clampView();clampRef();req();});
ro.observe($('stage'));
checkEnd();
  }
}
