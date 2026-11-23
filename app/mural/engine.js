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
  MURAL_COLS, MURAL_ROWS, MURAL_KINDS, muralGradeNames, muralScaleOf, gradeAt, pieceValue, muralWhoKey, muralLaunched, muralHeld, muralFirstOpens, parseMuralId, MURAL_MIN_MS, muralDateLabel, privateMuralId,
} from '@/lib/mural-shared';
import { openMemorial } from './memorial';
import { holdThemeColor } from '@/lib/theme-color-hold';

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

  // THE LOADING SCREEN (owner, 2026-11-20): the board is a 4,000 piece photo and
  // can take several seconds, so a large centred card covers the page until the
  // board is drawn, in place of the small tray line. Errors land on it too.
  const bootEl = document.createElement('div');
  bootEl.className = 'mrlBoot';
  bootEl.setAttribute('role', 'status');
  bootEl.setAttribute('aria-live', 'polite');
  bootEl.innerHTML = '<style>'
    + '.mrlBoot{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:var(--page);color:var(--ink);transition:opacity .35s ease;padding:24px}'
    + '.mrlBoot.out{opacity:0;pointer-events:none}'
    + '.mrlBoot .bIn{max-width:460px;width:100%;text-align:center}'
    + '.mrlBoot .bEb{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-bottom:10px}'
    + '.mrlBoot h2{font-size:clamp(30px,6vw,44px);line-height:1.1;margin:0 0 12px;font-weight:800}'
    + '.mrlBoot p{font-size:17px;line-height:1.5;margin:0 0 6px;color:var(--ink)}'
    + '.mrlBoot .bStep{color:var(--mute);font-size:15px;margin-top:4px}'
    + '.mrlBoot .bBar{height:8px;border-radius:99px;background:var(--soft);overflow:hidden;margin:22px auto 0;max-width:320px}'
    + '.mrlBoot .bBar i{display:block;height:100%;width:35%;border-radius:99px;background:var(--ink);animation:mrlBootSlide 1.3s ease-in-out infinite}'
    + '.mrlBoot.err .bBar{display:none}'
    + '.mrlBoot a{color:inherit}'
    + '@keyframes mrlBootSlide{0%{transform:translateX(-110%)}100%{transform:translateX(320%)}}'
    + '@media (prefers-reduced-motion:reduce){.mrlBoot .bBar i{animation:none;width:100%;opacity:.35}}'
    + '</style><div class="bIn">'
    + '<div class="bEb">' + (cfg.photo ? 'Jigsaw Puzzle' : K.name) + '</div>'
    + '<h2 id="bootH">Loading</h2>'
    + '<p id="bootP">' + (cfg.photo ? 'Cutting ' + cfg.photo.name + ' into ' + (cfg.photo.cols * cfg.photo.rows).toLocaleString('en-US') + ' pieces. A big puzzle can take a few seconds.' : 'This is a big page: one 4,000 piece picture the whole site builds together. It can take a few seconds.') + '</p>'
    + '<p class="bStep" id="bootStep"></p>'
    + '<div class="bBar"><i></i></div>'
    + '</div>';
  root.appendChild(bootEl);
  function bootStep(t) { const e = bootEl.querySelector('#bootStep'); if (e) e.textContent = t; }
  function hideBoot() { if (!bootEl.parentNode) return; bootEl.classList.add('out'); setTimeout(() => { if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl); }, 400); }
  // A message that ends the load (not open, bad link, failed) replaces the card's text.
  function bootMsg(t) {
    const e = $('msg'); if (e) e.textContent = t;
    if (!bootEl.parentNode) return;
    bootEl.classList.add('err');
    bootEl.querySelector('#bootH').textContent = 'Not Loaded';
    bootEl.querySelector('#bootP').textContent = t;
    bootEl.querySelector('#bootStep').innerHTML = '<a href="/">Back To Mind Loft</a>';
  }
  const paint = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  // THE WAITING SCREEN (owner, 2026-11-19): a kind whose first board has not
  // opened yet shows when it opens and counts down, and sends the reader to the
  // one that is open. It reloads itself into the board at the opening.
  let waitT = null;
  function waitScreen() {
    hideBoot();
    const other = K.key === 'mural' ? MURAL_KINDS.muraltoo : MURAL_KINDS.mural;
    const opens = muralFirstOpens(K.key);
    const el = document.createElement('div');
    el.className = 'fin show';
    // HELD (owner, 2026-11-20): resting while its pictures are reworked. No countdown.
    if (muralHeld(K.key)) {
      el.innerHTML = '<div class="finIn" style="padding-top:12vh">'
        + '<div class="eb">' + K.name + '</div>'
        + '<h2>Back Soon</h2>'
        + '<p class="rule">' + K.name + ' is taking a short break while we pick livelier pictures for it. ' + other.name + ', the 4,000 piece jigsaw the whole site builds together, is open now.</p>'
        + (muralLaunched(other.key) ? '<a class="primary" style="display:inline-block;width:auto;margin-top:14px;text-decoration:none" href="' + other.route + '">Play ' + other.name + ' Now</a>' : '')
        + '<p class="rule" style="margin-top:18px"><a href="/" style="color:inherit">Back To Mind Loft</a></p>'
        + '</div>';
      root.appendChild(el);
      return;
    }
    el.innerHTML = '<div class="finIn" style="padding-top:12vh">'
      + '<div class="eb">' + K.name + ' \u00b7 ' + K.runs + '</div>'
      + '<h2>Opens At ' + K.opensAt + '</h2>'
      + '<p class="lead" id="waitLead"></p>'
      + '<p class="rule">' + K.name + ' is a 4,000 piece jigsaw the whole site builds together, the twin of ' + other.name + '. The first one opens at ' + K.opensAt.toLowerCase().replace(' et', ' ET') + '. Each one stays open until the whole site finishes it, at least 24 hours, and the next opens as soon as it is done.</p>'
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
  // `v` names the photo: the image is cached forever by URL, and an unplayed
  // board can be given a new picture (lib/mural.js repickIfUnplayed).
  let imgV = '';
  function loadImg(id, w) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = `/api/mural/img?id=${id}&w=${w}${imgV ? `&v=${imgV}` : ''}`; });
  }

  (async () => {
    try {
      // A FREE-PLAY JIGSAW (owner, 2026-11-21: the jigsaw portal plays any photo at
      // any size, "up to mural count"). /jig/big hands over one past Jig or Saw
      // photo and its cut; it is built alone like a shelf copy: nothing is sent to
      // the server, nothing scores, and the pieces are kept in this browser.
      if (cfg.photo) {
        const P = cfg.photo;
        const big = P.cols * P.rows > 1000 && !((navigator.deviceMemory || 8) <= 4);
        const loadPhoto = (w) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img')); i.src = `/api/${P.g}/img?n=${P.n}${w ? `&w=${w}` : ''}`; });
        bootStep('Loading the picture.');
        let img;
        try { img = await loadPhoto(big ? 3840 : 1920); }
        catch (e) { img = await loadPhoto(0); }
        if (dead) return;
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem('mural_solo_' + P.id) || 'null'); } catch (e) { saved = null; }
        bootStep('Setting out the pieces.');
        await paint();
        if (dead) return;
        start({ id: P.id, board: { cols: P.cols, rows: P.rows, grades: '', opens: Date.now(), closes: Infinity, photo: { name: P.name, by: P.by, lic: P.lic } }, img, state: {}, me: { pieces: (saved && saved.pieces) || [], points: 0, firsts: 0 }, anon: null, email: '', q: '', solo: true, photo: P, crowd: {}, crowdMe: {}, wall: null });
        hideBoot();
        return;
      }
      // A SHELF COPY (owner, 2026-11-19): ?solo=<id> opens a finished or closed
      // mural to build alone. Nothing is sent to the server and nothing scores;
      // the pieces placed are kept in this browser.
      // RUN UNTIL FINISHED (2026-11-19): the server says which board is open now
      // (?kind=); a shelf copy asks for its own board by id and is built alone
      // once that board is finished or closed.
      const sp = parseMuralId(cfg.solo);
      let solo = null, b = null;
      if (sp && sp.kind === K.key) {
        const sb = await getJSON(`/api/mural/board?id=${cfg.solo}`);
        if (dead) return;
        if (sb.ok && sb.j && sb.j.grades && (sb.j.completed || sb.j.closes <= Date.now())) { solo = cfg.solo; b = sb; }
      }
      // FROM THE ARCHIVE (owner, 2026-11-19): /mural?p=<day number> is a past site
      // day. The mural that was open that day, once finished, opens on its wall
      // like a shelf copy does. A day whose mural is still open plays as usual.
      const pn = parseInt(cfg.p, 10);
      if (!solo && pn >= 1 && pn < 20000) {
        const day = new Date(Date.parse(K.first + 'T12:00:00Z') + (pn - 1) * 86400000).toISOString().slice(0, 10);
        const db = await getJSON(`/api/mural/board?kind=${K.key}&day=${day}`);
        if (dead) return;
        if (db.ok && db.j && db.j.grades && (db.j.completed || db.j.closes <= Date.now())) { solo = db.j.id; b = db; }
      }
      // A PRIVATE MURAL (owner, 2026-11-19): /mural/p/<code>. Its board is asked for
      // by id; it is live play like the public one, with its own standings and wall.
      const privId = !solo ? privateMuralId(cfg.priv) : null;
      if (cfg.priv && !solo) {
        if (!privId) { bootMsg('That private mural link is not right. Check the link and try again.'); return; }
        bootStep('Opening your private mural.');
        b = await getJSON(`/api/mural/board?id=${privId}`);
        if (dead) return;
        if (!b.ok || !b.j || !b.j.grades) { bootMsg('That private mural could not be found. Check the link and try again.'); return; }
      }
      if (!solo && !privId && !muralLaunched(K.key)) { waitScreen(); return; }
      if (!privId) bootStep(`Opening ${K.name}.`);
      if (!b) b = await getJSON(`/api/mural/board?kind=${K.key}`);
      if (dead) return;
      if (!b.ok || !b.j || !b.j.grades) { bootMsg(`${K.name} is not open yet. Check back in a minute.`); return; }
      const id = b.j.id;
      imgV = b.j.pv || '';
      const phone = window.innerWidth <= 720;
      // Phones take the full 3840 photo too (see SHARPNESS in start): half size
      // left 15 source pixels a piece. Only a device that reports little memory
      // starts smaller, and a failed load falls back a size.
      const big = !((navigator.deviceMemory || 8) <= 4);
      bootStep('Loading the picture.');
      let img;
      try { img = await loadImg(id, big ? 3840 : 1920); }
      catch (e) { img = await loadImg(id, big ? 1920 : 960); }
      const anon = getAnonId(), email = getEmail();
      const q = `id=${id}&anonId=${encodeURIComponent(anon || '')}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
      bootStep('Setting out the pieces.');
      const [st, me] = await Promise.all([getJSON(`/api/mural/state?id=${id}`), getJSON(`/api/mural/me?${q}`)]);
      if (dead) return;
      const wasDone = !!(st.j && (st.j.completed || (st.j.n || 0) >= (b.j.cols || MURAL_COLS) * (b.j.rows || MURAL_ROWS)));
      if (solo || (cfg.solo === id && wasDone)) {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem('mural_solo_' + id) || 'null'); } catch (e) { saved = null; }
        // The wall comes first on a return visit, so its data is fetched before the board starts.
        let wall = null;
        try { const w = await getJSON(`/api/mural/wall?id=${id}`); if (w.ok && w.j && Array.isArray(w.j.order)) wall = w.j; } catch (e) { wall = null; }
        if (dead) return;
        await paint();
        if (dead) return;
        start({ id, board: b.j, img, state: {}, me: { pieces: (saved && saved.pieces) || [], points: 0, firsts: 0 }, anon, email, q, solo: true, crowd: st.j || {}, crowdMe: me.j || {}, wall });
        hideBoot();
        return;
      }
      await paint();
      if (dead) return;
      start({ id, board: b.j, img, state: st.j || {}, me: me.j || {}, anon, email, q, priv: privId ? { code: cfg.priv, ...(b.j.private || {}) } : null });
      hideBoot();
    } catch (e) {
      console.error('mural', e);
      bootMsg(`${K.name} could not load. Reload the page to try again.`);
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
    if (bootEl.parentNode) bootEl.parentNode.removeChild(bootEl);
  };

  function start(env) {
const COLS=env.board.cols||MURAL_COLS,ROWS=env.board.rows||MURAL_ROWS,TOTAL=COLS*ROWS,UPDATE=120,GRADES=env.board.grades,GN=muralGradeNames(GRADES),SCALE=muralScaleOf(GRADES);
/* THE RULES TABLE FOLLOWS THE BOARD'S SCALE (owner, 2026-11-23: flatter points from the next mural on). The markup carries the flat scale; a board made before it shows its own numbers. */
try{root.querySelectorAll('[data-grade]').forEach(td=>{const v=SCALE[td.getAttribute('data-grade')];if(v)td.textContent=String(v);});const ex=$('mrlExample');if(ex){const L=SCALE.large,a=Math.round(L*.8*10)/10;ex.innerHTML='<b>Example.</b> A large block piece ('+L+'), with one neighbor in place (minus 20%, so '+a+'), placed first (doubled): '+pieceValue({grade:L,hours:0,neighbours:1,first:true})+' points.';}}catch(e){}
const img=env.img,want=COLS/ROWS;
let cw0=img.naturalWidth,ch0=Math.round(cw0/want);if(ch0>img.naturalHeight){ch0=img.naturalHeight;cw0=Math.round(ch0*want);}
const cx0=Math.floor((img.naturalWidth-cw0)/2),cy0=Math.floor((img.naturalHeight-ch0)/2);
const PHOTO=env.photo||null;
/* A small free-play jigsaw gets bigger source pieces and a closer zoom, or 24 pieces would draw from a few hundred pixels. */
const PS=Math.max(6,Math.min(PHOTO?240:64,Math.floor(cw0/COLS))),W=COLS*PS,H=ROWS*PS,MARG=PS*.27;
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
  if(ctx===cctx){layV++;for(const m of MIP)if(m.c)m.d.push(id);}
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
/* One layer holds every placed piece, the crowd's and yours: the two were always drawn together,
   and a second full-size layer doubled the work of every frame (2026-11-20). */
const src=mk(W,H),crowdL=mk(W,H),mineL=crowdL;
/* SPEED (owner, 2026-11-20: "everything on page is so laggy"). Every frame used to scale two
   full-size layers (3840 x 2400 each) onto the board and rebuild the picture panel from the full
   photo, even for a one-pixel pan. Now: zoomed out, the board draws from a smaller copy of the
   placed pieces (rebuilt only when a piece lands); zoomed in, it draws only the part on screen;
   and the picture panel is redrawn only when what it shows changes. layV counts piece changes. */
let layV=0;const MIP=[{f:.5,c:null,v:-1,d:[]},{f:.25,c:null,v:-1,d:[]}];
/* A placed piece only touches its own patch, so the small copy is patched, not rebuilt. */
function mipLayer(m){
  if(m.v===layV)return m.c;
  const fresh=!m.c;if(fresh)m.c=mk(Math.round(W*m.f),Math.round(H*m.f));
  const x=m.c.getContext('2d');x.imageSmoothingQuality='high';
  if(fresh||m.d.length>300){x.clearRect(0,0,m.c.width,m.c.height);x.drawImage(crowdL,0,0,m.c.width,m.c.height);}
  else for(const id of m.d){const c=id%COLS,r=(id/COLS)|0,f=m.f;
    const a=Math.max(0,Math.floor((c*PS-MARG)*f)),b=Math.max(0,Math.floor((r*PS-MARG)*f)),a2=Math.min(m.c.width,Math.ceil(((c+1)*PS+MARG)*f)),b2=Math.min(m.c.height,Math.ceil(((r+1)*PS+MARG)*f));
    x.clearRect(a,b,a2-a,b2-b);x.drawImage(crowdL,a/f,b/f,(a2-a)/f,(b2-b)/f,a,b,a2-a,b2-b);}
  m.d=[];m.v=layV;return m.c;}
function drawPlaced(dpr){
  const px=view.s*dpr;/* device pixels per picture pixel */
  const m=px<=.25?MIP[1]:px<=.5?MIP[0]:null;
  if(m){ctx.drawImage(mipLayer(m),0,0,W,H);return;}
  const x0=Math.max(0,Math.floor(-view.tx/view.s)),y0=Math.max(0,Math.floor(-view.ty/view.s)),x1=Math.min(W,Math.ceil((view.cw-view.tx)/view.s)),y1=Math.min(H,Math.ceil((view.ch-view.ty)/view.s));
  if(x1<=x0||y1<=y0)return;const w=x1-x0,h=y1-y0;
  ctx.drawImage(crowdL,x0,y0,w,h,x0,y0,w,h);
}
const sctx=src.getContext('2d'),cctx=crowdL.getContext('2d'),mctx=mineL.getContext('2d');
sctx.drawImage(img,cx0,cy0,cw0,ch0,0,0,W,H);
const cv=$('cv'),ctx=cv.getContext('2d'),refCv=$('refCv');refCv.width=1056;refCv.height=Math.round(refCv.width*H/W);const rctx=refCv.getContext('2d');
const M={crowd:new Set(),mine:new Set(),pts:0,firsts:0,hours:0,hand:[],loose:[],done:false,rank:null,name:null};
let STATE=env.state||{};
// SHARPNESS (owner, 2026-11-19, a phone screenshot of a smeared piece: "have to
// fix this piece clarity, looks awful"). A piece is only PS source pixels wide
// (30 from the 3840 photo), so the closest zoom stops at 64 CSS px a piece;
// it used to go to 110 and the phone loaded the half-size photo on top of that.
const view={s:1,tx:0,ty:0,cw:0,ch:0,min:.1,max:(PHOTO?150:72)/PS};
let valDirty=true,isPhone=false,C={},sel=null,refTab='pic',pulses=[],pops=[],needDraw=false,tick=UPDATE,HANDN=8,TSZ=68,HCOLS=8,TRAYR=2,finShown=false;
try{const v=+localStorage.getItem('mural_tray_rows');if(v>=1&&v<=3)TRAYR=v;}catch(e){}
function colors(){const cs=getComputedStyle(root);C={bd:cs.getPropertyValue('--bd').trim(),slot:cs.getPropertyValue('--slot').trim(),ink:cs.getPropertyValue('--ink').trim(),page:cs.getPropertyValue('--page').trim()};}
const SOLO=!!env.solo,PRIV=env.priv||null;
function hoursOpen(){return SOLO?0:Math.max(0,Math.floor((Date.now()-env.board.opens)/3600000));}

/* ---------- grading ---------- */
function has(id){return M.crowd.has(id)||M.mine.has(id);}
function nbCount(id){const c=id%COLS,r=(id/COLS)|0;let n=0;if(c>0&&has(id-1))n++;if(c<COLS-1&&has(id+1))n++;if(r>0&&has(id-COLS))n++;if(r<ROWS-1&&has(id+COLS))n++;return n;}
function valueOf(id){const g=gradeAt(GRADES,id),first=!M.crowd.has(id),n=nbCount(id),age=1;return {v:pieceValue({grade:g,hours:M.hours,neighbours:n,first}),g,first,age,n};}
function explainVal(id){const o=valueOf(id),p=['grade '+o.g];if(o.first)p.push('doubled for a first');if(o.n)p.push(Math.min(80,o.n*20)+'% off for '+o.n+' neighbor'+(o.n>1?'s':'')+' in place');return GN[o.g]+'. Worth '+o.v+': '+p.join(', ')+'.';}
let valCv=null,valGen=0;
function valueMap(){if(valCv&&!valDirty)return valCv;valCv=valCv||mk(COLS,ROWS);const x=valCv.getContext('2d'),im=x.createImageData(COLS,ROWS),d=im.data;
  for(let id=0;id<TOTAL;id++){const o=id*4;if(has(id)){d[o+3]=0;continue;}const t=Math.min(1,valueOf(id).v/40);d[o]=253-131*t;d[o+1]=243-184*t;d[o+2]=208-208*t;d[o+3]=255;}
  x.putImageData(im,0,0);valDirty=false;valGen++;return valCv;}
/* ---------- view ---------- */
function resize(){
  const r=$('stage').getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  view.cw=r.width;view.ch=r.height;cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);
  const phone=window.innerWidth<=720;isPhone=phone;sizeHand();
  view.min=Math.min(view.cw/W,view.ch/H)*.94;
}
function fit(){view.s=view.min;view.tx=(view.cw-W*view.s)/2;view.ty=(view.ch-H*view.s)/2;req();}
function clampView(){view.tx=Math.min(view.cw*.5,Math.max(view.cw*.5-W*view.s,view.tx));view.ty=Math.min(view.ch*.5,Math.max(view.ch*.5-H*view.s,view.ty));}
function zoomAt(px,py,f){hot();const ns=Math.min(view.max,Math.max(view.min,view.s*f));view.tx=px-(px-view.tx)*ns/view.s;view.ty=py-(py-view.ty)*ns/view.s;view.s=ns;clampView();req();}
function req(){if(!needDraw){needDraw=true;requestAnimationFrame(draw);}}
/* While the board is moving (pan, zoom, dragging a loose piece) frames draw with cheap scaling and no
   shadows, then one full-quality frame follows once it settles (owner, 2026-11-19: dragging was laggy). */
let hotUntil=0,hotT=0;function hot(){hotUntil=performance.now()+140;clearTimeout(hotT);hotT=setTimeout(req,170);}
function draw(){
  needDraw=false;const dpr=cv.width/view.cw;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=C.bd;ctx.fillRect(0,0,view.cw,view.ch);
  ctx.save();ctx.translate(view.tx,view.ty);ctx.scale(view.s,view.s);
  ctx.fillStyle=C.slot;ctx.fillRect(0,0,W,H);const moving=performance.now()<hotUntil||pulses.length>0;ctx.imageSmoothingQuality=moving?'low':'high';
  /* crowd pieces at full colour (owner, 2026-11-19: faded pieces made the picture impossible to match) */drawPlaced(dpr);
  const now=performance.now();pulses=pulses.filter(p=>now-p.t<(p.nw?4000:700));
  for(const p of pulses){const c=p.id%COLS,r=(p.id/COLS)|0;if(p.nw){const a=1-(now-p.t)/4000;ctx.globalAlpha=a*.75;ctx.fillStyle='#f2c230';piecePath(ctx,p.id);ctx.fill();continue;}/* the crowd flash takes the piece's own shape (owner, 2026-11-19) */const a=1-(now-p.t)/700,g=(1-a)*PS*.9;ctx.strokeStyle=C.ink;ctx.globalAlpha=a;ctx.lineWidth=3/view.s;ctx.strokeRect(c*PS-g,r*PS-g,PS+2*g,PS+2*g);}
  ctx.globalAlpha=1;
  for(const l of M.loose){ctx.save();ctx.translate(l.x-(l.id%COLS+.5)*PS,l.y-(((l.id/COLS)|0)+.5)*PS);if(!moving){ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=6;}drawPiece(ctx,l.id,'rgba(0,0,0,.6)');ctx.restore();}
  ctx.restore();
  ctx.strokeStyle=C.ink;ctx.lineWidth=1;ctx.strokeRect(Math.round(view.tx)+.5,Math.round(view.ty)+.5,Math.round(W*view.s),Math.round(H*view.s));
  drawPops(now);
  drawRef();popDraw();
  if(pulses.length||pops.length)req();
}
/* POINTS POP (owner, 2026-11-19: "a subtle scoring animation for each placed piece ... that shows the
   number of points awarded when piece locked in"). A small "+N" rises off the piece's home and fades,
   drawn in screen space so it reads the same at any zoom. A first placement pops in gold. The server's
   verdict can still change the value (send() below): a taken piece drops its pop, a corrected one
   updates it in place. */
const POP_MS=1100,calm=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();
function popFor(id,v,first){pops=pops.filter(p=>p.id!==id);pops.push({id,v,first,t:performance.now()});}
function drawPops(now){
  pops=pops.filter(p=>now-p.t<POP_MS);if(!pops.length)return;
  const ff=getComputedStyle(root).fontFamily||'Manrope,sans-serif';
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  for(const p of pops){
    const k=(now-p.t)/POP_MS,ease=1-Math.pow(1-k,3);
    const x=view.tx+(p.id%COLS+.5)*PS*view.s,y=view.ty+((((p.id/COLS)|0)+.5)*PS)*view.s-(calm?0:6+22*ease);
    const sc=calm?1:(k<.15?.7+.3*(k/.15):1),fs=Math.round(15*sc);
    ctx.globalAlpha=k<.6?1:Math.max(0,1-(k-.6)/.4);
    ctx.font='800 '+fs+'px '+ff;const t='+'+p.v;
    ctx.lineWidth=4;ctx.strokeStyle=C.page||'#fff';ctx.strokeText(t,x,y);
    ctx.fillStyle=p.first?'#c9970f':(C.ink||'#111');ctx.fillText(t,x,y);
  }
  ctx.restore();
}
let refBase=null,refKey='',refHotUntil=0;
function refHot(){refHotUntil=performance.now()+140;}
function drawRef(){
  if($('ref').classList.contains('mini')||$('ref').classList.contains('popped'))return;
  /* THE PICTURE ZOOMS (owner, 2026-11-19: "add ability to zoom even more on the viewfinder of the
     full image of the mural. currently you cant zoom in to see detail"). RZ is the part of the
     picture the panel shows: s times closer, centred on (cx, cy) in picture pixels. */
  const w=refCv.width,h=refCv.height,sw=W/RZ.s,sh=H/RZ.s,sx=Math.max(0,Math.min(W-sw,RZ.cx-sw/2)),sy=Math.max(0,Math.min(H-sh,RZ.cy-sh/2));
  const vm=refTab==='val'?valueMap():null;
  const rq=performance.now()<refHotUntil?'low':'high';
  const key=rq+'|'+refTab+'|'+w+'x'+h+'|'+sx+','+sy+','+sw+'|'+C.slot+'|'+(refTab==='crowd'?layV:0)+'|'+(refTab==='val'?valGen:0);
  if(!refBase||refBase.width!==w||refBase.height!==h){refBase=mk(w,h);refKey='';}
  if(key!==refKey){const b=refBase.getContext('2d');refKey=key;
    b.setTransform(1,0,0,1,0,0);b.fillStyle=C.slot;b.fillRect(0,0,w,h);b.imageSmoothingQuality=rq;
    if(refTab==='pic')b.drawImage(src,sx,sy,sw,sh,0,0,w,h);else if(vm){const kx=COLS/W,ky=ROWS/H;b.imageSmoothingEnabled=false;b.drawImage(vm,sx*kx,sy*ky,sw*kx,sh*ky,0,0,w,h);b.imageSmoothingEnabled=true;}else{b.drawImage(crowdL,sx,sy,sw,sh,0,0,w,h);}}
  rctx.setTransform(1,0,0,1,0,0);rctx.drawImage(refBase,0,0);
  const k=w/sw,x=(Math.max(0,-view.tx/view.s)-sx)*k,y=(Math.max(0,-view.ty/view.s)-sy)*k,x2=(Math.min(W,(view.cw-view.tx)/view.s)-sx)*k,y2=(Math.min(H,(view.ch-view.ty)/view.s)-sy)*k;
  if(x2-x<w-2||y2-y<h-2){rctx.strokeStyle='#ffffff';rctx.lineWidth=8;rctx.strokeRect(x,y,x2-x,y2-y);rctx.strokeStyle='#15171c';rctx.lineWidth=3;rctx.strokeRect(x,y,x2-x,y2-y);}
}
const RZ={s:1,cx:W/2,cy:H/2,max:10};
function rzClamp(){RZ.s=Math.max(1,Math.min(RZ.max,RZ.s));const sw=W/RZ.s,sh=H/RZ.s;RZ.cx=Math.max(sw/2,Math.min(W-sw/2,RZ.cx));RZ.cy=Math.max(sh/2,Math.min(H-sh/2,RZ.cy));}
/* Where on the picture a point of the panel is. */
function rzAt(e){const r=refCv.getBoundingClientRect(),sw=W/RZ.s,sh=H/RZ.s;return [RZ.cx-sw/2+(e.clientX-r.left)/r.width*sw,RZ.cy-sh/2+(e.clientY-r.top)/r.height*sh];}
function rzUi(){const l=$('rzLab');if(l)l.textContent=(RZ.s<9.95?(Math.round(RZ.s*10)/10):Math.round(RZ.s))+'x';refCv.classList.toggle('zoomed',RZ.s>1.01);const o=$('rzOut'),i=$('rzIn');if(o)o.disabled=RZ.s<=1.01;if(i)i.disabled=RZ.s>=RZ.max-.01;}
/* Zoom by f, keeping the picture point (px, py) under the same spot of the panel. */
function rzZoom(f,px,py){const s0=RZ.s,s1=Math.max(1,Math.min(RZ.max,s0*f));if(s1===s0)return;hot();refHot();if(px===undefined){px=RZ.cx;py=RZ.cy;}RZ.cx=px+(RZ.cx-px)*s0/s1;RZ.cy=py+(RZ.cy-py)*s0/s1;RZ.s=s1;rzClamp();rzUi();req();}
const toSrc=(px,py)=>[(px-view.tx)/view.s,(py-view.ty)/view.s];
/* ---------- hand ---------- */
/* THE TRAY (owner, 2026-11-19): one to three rows, the player's choice (two by
   default, remembered), on every format; every row is filled edge to edge, so
   the column count comes from the hand's own width and the piece size stretches
   to fill it (never past 68px). */
function sizeHand(){const h=$('hand'),g=8;const w=Math.max(200,(h&&h.clientWidth)||(window.innerWidth-(isPhone?20:28)));const cols=Math.max(isPhone?5:6,Math.ceil((w+g)/(68+g)));HCOLS=cols;TSZ=Math.min(68,Math.floor((w-g*(cols-1))/cols));HANDN=cols*TRAYR;}
function fitHand(){if(M.hand.length>HANDN){M.hand.length=HANDN;if(sel!==null&&sel>=HANDN)sel=null;}else if(M.hand.length<HANDN){const inHand=new Set(M.hand.filter(x=>x!==null&&x!==undefined)),pool=allOpen().filter(id=>!inHand.has(id));while(M.hand.length<HANDN){if(!pool.length){M.hand.push(null);continue;}const j=Math.floor(Math.random()*pool.length);M.hand.push(pool[j]);pool[j]=pool[pool.length-1];pool.pop();}}renderHand();}
function rowsUi(){root.querySelectorAll('.rows [data-rows]').forEach(b=>{const on=+b.dataset.rows===TRAYR;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');});}
/* ONLY OPEN PIECES (owner, 2026-11-19: the tray kept offering pieces already on the board, so you could place one twice). The tray deals pieces nobody has placed yet. */
function allOpen(){const busy=new Set(M.loose.map(l=>l.id).concat(M.hand.filter(x=>x!==null&&x!==undefined))),out=[];for(let id=0;id<TOTAL;id++)if(!has(id)&&!busy.has(id))out.push(id);return out;}
function dealAll(){M.hand=[];const pool=allOpen();for(let k=0;k<HANDN;k++){if(!pool.length){M.hand.push(null);continue;}const j=Math.floor(Math.random()*pool.length);M.hand.push(pool[j]);pool[j]=pool[pool.length-1];pool.pop();}sel=null;renderHand();}
/* THE TRAY REDRAW WAS THE LAG (owner, 2026-11-19: "the click into place is still very laggy").
   Every placement rebuilt every tray piece from the full photo, up to 75 clipped draws of a
   3840 px image. Piece images are now cached by id and size and reused, so a redraw only moves
   them. */
let td=null,handDirty=false;
const PCACHE=new Map();
function trayCanvas(id,size){const k=id+'|'+size;let c=PCACHE.get(k);if(!c){c=pieceCanvas(id,size);if(PCACHE.size>400)PCACHE.clear();PCACHE.set(k,c);}return c;}
function renderHand(){
  /* FROZEN PIECES IN THE TRAY (owner, 2026-11-19 screenshot): the board refresh redrew the tray in
     the middle of a drag, the dragged piece's button vanished, its pointerup never came, and the
     drag image stayed stuck over the tray. A redraw now waits for the drop, and any stray drag
     image is cleared. */
  if(td&&td.drag){handDirty=true;return;}
  handDirty=false;root.querySelectorAll('.ghost').forEach(g=>g.remove());
  const h=$('hand');h.innerHTML='';h.style.setProperty('--hc',HCOLS);h.style.setProperty('--ts',TSZ+'px');
  for(let k=0;k<HANDN;k++){
    const id=M.hand[k],b=document.createElement('button');b.className='piece'+(id===null||id===undefined?' empty':'')+(sel===k?' sel':'');b.dataset.k=k;b.style.width=b.style.height=TSZ+'px';
    if(id!==null&&id!==undefined&&!M.done){b.appendChild(trayCanvas(id,TSZ-10));const o=valueOf(id);/* no value badge on tray pieces (owner, 2026-11-19: it covered the piece) */b.setAttribute('aria-label','Piece worth '+o.v+(o.first?', first placement':''));}
    else b.disabled=true;
    h.appendChild(b);
  }
}
function setMsg(t){$('msg').textContent=t;}
function ui(){
  $('sPts').textContent=M.pts;$('menuBtn').textContent=PHOTO?'Menu':'Menu \u00b7 '+M.pts+' pts';$('sLeft').textContent=M.mine.size;
  /* THE SITE'S TOTAL, NOT FIRSTS (owner, 2026-11-19: "dont need to show 'firsts', instead also give total places along with %. and that number will have the '+5' or whatever on every refresh"). */
  const done=M.crowd.size+[...M.mine].filter(i=>!M.crowd.has(i)).length,pc=done/TOTAL*100;
  $('sAll').textContent=done.toLocaleString();$('sAllLab').textContent=(PRIV?'All Placed':'Site Total')+' \u00b7 '+(pc>0&&pc<10?pc.toFixed(1):Math.round(pc))+'%';
  /* PLAYERS IN THE HEADER (owner, 2026-11-19): everyone who has placed a piece, members and guests, in the stats row, no new row. */
  const ply=Math.max((STATE.players||0)+((STATE.guests&&STATE.guests.players)||0),M.mine.size?1:0);
  $('sPly').textContent=ply.toLocaleString();$('plyBox').style.display=SOLO?'none':'';
  /* ACTIVE = placed a piece in the last 15 minutes (owner, 2026-11-19: "show contributing players and active players"). */
  $('sAct').textContent=(STATE.active||0).toLocaleString();$('actBox').style.display=SOLO?'none':'';
  $('meta').innerHTML='<b>'+M.hours+'</b>'+(M.hours===1?'Hour Open':'Hours Open');
  coolTick();
}
/* SNAP DISTANCE (owner, 2026-11-19: it accepted pieces far too easily, worst zoomed out). A third of a
   piece when zoomed in, and never more than half a piece however far out you are; it used to be
   26 screen px, which zoomed out covered more than a whole piece. */
function tol(){return Math.max(PS*.34,Math.min(PS*.5,14/view.s));}
function attempt(id,sx,sy,from){
  if(M.done)return;
  const hx=(id%COLS+.5)*PS,hy=(((id/COLS)|0)+.5)*PS;
  if(Math.hypot(sx-hx,sy-hy)<=tol()){
    const val=valueOf(id),first=val.first;send(id,val,0);M.mine.add(id);drawPiece(mctx,id);M.pts+=val.v;UPD.pts+=val.v;UPD.n++;if(first)M.firsts++;valDirty=true;
    M.loose=M.loose.filter(l=>l.id!==id);saveLoose();
    if(from!==null&&from!==undefined&&M.hand[from]===id)M.hand[from]=null;const hi=M.hand.indexOf(id);if(hi>=0)M.hand[hi]=null;if(M.hand.every(x=>x===null||x===undefined)&&M.mine.size<TOTAL)dealAll();
    pulses.push({id,t:performance.now()});if(!SOLO)popFor(id,val.v,first);sel=null;
    setMsg((first?'First on the mural. ':'Placed. ')+val.v+(val.v===1?' point':' points')+' ('+GN[val.g].toLowerCase()+').');
    if(M.mine.size>=TOTAL)finish();
    renderHand();ui();req();return true;
  }
  const ex=M.loose.find(l=>l.id===id);
  let lp=ex;if(ex){ex.x=sx;ex.y=sy;}else{lp={id,x:sx,y:sy,g:id};M.loose.push(lp);if(from!==null&&from!==undefined)M.hand[from]=null;}
  const joined=snapJoin(lp.g);
  saveLoose();sel=null;setMsg(joined?'Joined. Pieces that fit together stay together; move the group to its spot to score it.':'Not there. It stays on the board until you move it home, or drag it back to the tray. No penalty.');renderHand();req();return false;
}
/* PIECES CLICK TOGETHER OFF THE BOARD (owner, 2026-11-19: "can pieces click together without clicking
   into correct spot on board? ... they shouldn't count for player until in correct spot"). A loose piece
   dropped next to its true neighbour, in the right relative spot, joins it; the group then moves as one.
   Nothing scores until the group lands on its home, and then every piece in it scores. Loose pieces live
   in this browser only, as before. */
const NB=[[1,0],[-1,0],[0,1],[0,-1]];
/* LOOSE PIECES SURVIVE A REFRESH (owner, 2026-11-19). Kept in this browser, per mural. */
function saveLoose(){try{localStorage.setItem('mural_loose_'+env.id,JSON.stringify(M.loose.map(l=>[l.id,Math.round(l.x),Math.round(l.y),l.g])));}catch(e){}}
function loadLoose(){let a=null;try{a=JSON.parse(localStorage.getItem('mural_loose_'+env.id)||'null');}catch(e){a=null;}if(!Array.isArray(a))return;const seen=new Set();for(const q of a){if(!Array.isArray(q))continue;const[id,x,y,g]=q;if(!Number.isInteger(id)||id<0||id>=TOTAL||M.mine.has(id)||M.crowd.has(id)||seen.has(id))continue;seen.add(id);M.loose.push({id,x:+x||0,y:+y||0,g:Number.isInteger(g)?g:id});}}
function grp(g){return M.loose.filter(l=>l.g===g);}
function snapJoin(g){
  let joined=false,again=true;
  while(again){again=false;
    const mine=grp(g),t=tol();
    outer:for(const m of mine){const c=m.id%COLS,rw=(m.id/COLS)|0;
      for(const [dc,dr] of NB){const nc=c+dc,nr=rw+dr;if(nc<0||nc>=COLS||nr<0||nr>=ROWS)continue;const nid=nr*COLS+nc;
        const n=M.loose.find(l=>l.id===nid&&l.g!==g);if(!n)continue;
        const ex2=m.x+dc*PS,ey2=m.y+dr*PS;if(Math.hypot(n.x-ex2,n.y-ey2)>t)continue;
        const ddx=n.x-ex2,ddy=n.y-ey2;for(const q of mine){q.x+=ddx;q.y+=ddy;q.g=n.g;}g=n.g;joined=true;again=true;break outer;}}
  }
  if(joined){const all=grp(g);M.loose=M.loose.filter(l=>l.g!==g).concat(all);}
  return joined;
}
function dropGroup(l){
  const hx=(l.id%COLS+.5)*PS,hy=(((l.id/COLS)|0)+.5)*PS,members=grp(l.g);
  if(Math.hypot(l.x-hx,l.y-hy)<=tol()){
    if(members.length===1){attempt(l.id,l.x,l.y,null);return;}
    const p0=M.pts;let n=0;
    for(const m of members){if(M.done)break;if(has(m.id)&&M.mine.has(m.id)){M.loose=M.loose.filter(x=>x!==m);continue;}attempt(m.id,(m.id%COLS+.5)*PS,(((m.id/COLS)|0)+.5)*PS,null);n++;}
    if(n>1&&!M.done)setMsg('Placed '+n+' pieces. '+(M.pts-p0)+' points.');
    return;
  }
  const joined=snapJoin(l.g);saveLoose();
  setMsg(joined?'Joined. Move the group to its spot to score it.':(members.length>1?'Not there yet. The group stays together until you move it home.':'Not there. It stays on the board until you move it home, or drag it back to the tray. No penalty.'));req();
}
function finish(){
  M.done=true;
  $('dTitle').textContent='You placed all '+TOTAL.toLocaleString();
  $('dLead').textContent='Every piece of '+(PRIV?'this mural':K.name)+' is on your board. Standings settle when it closes.';
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
  M.name=j.name||null;M.rank=j.rank||null;if(j.player)meKey=muralWhoKey(j.player);
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
/* ONE AT A TIME (owner, 2026-11-20: "why did i get a -1 on an update when i'm the only active
   player?"). A piece's value drops 20% for each neighbor already in place. Sent all at once, a
   quick run of placements (or a group dropped home) could reach the server out of order, so it
   counted a neighbor the page had not, scored the piece a point lower, and the page showed the
   difference as a loss. Placements now go to the server in the order they were made. */
let sendQ=Promise.resolve();
function send(id,val){
  if(SOLO){setTimeout(saveSolo,0);return;}
  pending++;sendQ=sendQ.then(()=>sendOne(id,val,0)).catch(()=>{});
}
function sendOne(id,val,tries){
  /* a stalled request must not hold up the queue: give up after 12s and retry (a retry of a saved piece comes back as a repeat with its real score) */
  const ac=typeof AbortController!=='undefined'?new AbortController():null,tm=ac?setTimeout(()=>ac.abort(),12000):0;
  return fetch('/api/mural/place',{method:'POST',headers:{'Content-Type':'application/json'},signal:ac?ac.signal:undefined,body:JSON.stringify({id:env.id,piece:id,total:TOTAL,anonId:env.anon,email:env.email||undefined})})
    .finally(()=>clearTimeout(tm))
    .then(r=>r.json().then(j=>({ok:r.ok,status:r.status,j})))
    .then(o=>{
      if(dead)return;
      if(o.ok&&o.j&&typeof o.j.points==='number'){
        pending--;creditSoon();
        if(o.j.taken){
          M.pts-=val.v;UPD.pts-=val.v;UPD.lost+=val.v;UPD.ov++;if(val.first)M.firsts--;M.crowd.add(id);drawPiece(cctx,id);valDirty=true;pops=pops.filter(p=>p.id!==id);
          setMsg('Someone else placed that piece first, so it scores nothing.');renderHand();ui();req();return;
        }
        if(o.j.points!==val.v||o.j.first!==val.first){
          M.pts+=o.j.points-val.v;UPD.pts+=o.j.points-val.v;if(o.j.points<val.v){if(val.first&&!o.j.first){UPD.lost+=val.v-o.j.points;UPD.ov++;}else{UPD.nb+=val.v-o.j.points;UPD.nbn++;}}{const pp=pops.find(p=>p.id===id);if(pp){pp.v=o.j.points;pp.first=!!o.j.first;}}
          if(val.first&&!o.j.first){M.firsts--;M.crowd.add(id);drawPiece(cctx,id);setMsg('Someone got there first. '+o.j.points+(o.j.points===1?' point.':' points.'));}
          else if(!val.first&&o.j.first)M.firsts++;
          valDirty=true;renderHand();ui();req();
        }
      }else if(o.status===409){pending--;setMsg(K.name+' has closed.');poll();}
      else if(o.status===403){pending--;setMsg('Only members of '+((PRIV&&PRIV.group)||'this group')+' can place pieces here. Join the group to play.');}
      else throw new Error('place');
    })
    .catch(()=>{if(dead)return;if(tries<3)return new Promise(r=>setTimeout(r,1500*(tries+1))).then(()=>sendOne(id,val,tries+1));else{pending--;setMsg('That piece did not save. Check your connection.');}});
}
let flashUntil=0,lastPoll=Date.now(),polling=false;
/* What the last refresh brought sits beside the site total until the next one. */
function flashUpdate(n){$('sNew').textContent=n>0?'+'+n.toLocaleString():'';}
/* THE UPDATE NOTE (owner, 2026-11-20: "a light overlay at the top showing who contributed on a given
   update? and maybe total points you got, and the subtracted amount for overlapping placements").
   Each refresh compares the crowd's tallies with the last ones: who added pieces (members by name,
   guests together, since the snapshot does not name them), and what this player scored since the last
   refresh, less anything lost to a piece someone else placed first. Tap to close; it fades on its own. */
const UPD={pts:0,lost:0,ov:0,nb:0,nbn:0,n:0,swapped:0};let updT=0;
let lastAt=+(STATE&&STATE.at)||Date.now(),meKey=null;
function meLabel(){return M.name||(meKey?'Guest '+meKey:null);}
/* Who added pieces between the last snapshot and this one, by name, a guest as "Guest" plus a
   short code (owner, 2026-11-20: guests are never lumped together). Read from the snapshot's `who`
   (first placements in the last 15 minutes, with times). */
function whoSince(st,from){if(!st||!Array.isArray(st.who))return null;const to=+st.at||Date.now(),out=[];
  for(const p of st.who){if(!p||!Array.isArray(p.t))continue;let d=0;const f0=Math.floor(from/1000),t0=Math.floor(to/1000);for(const t of p.t)if(t>f0&&t<=t0)d++;if(d>0)out.push([p.n||('Guest '+p.k),d]);}
  return out;}
const tallyOf=(st)=>{const m=new Map();for(const r of (st&&st.contrib)||[])if(r&&r.name)m.set(r.name,(m.get(r.name)||0)+(r.firsts||0));return {m,g:(st&&st.guests&&st.guests.firsts)||0};};
function showUpdNote(before,after,fresh){
  const el=$('updo');if(!el||SOLO)return;
  let who=[],gd=0;
  if(after.ev){who=after.ev;}else{for(const [n,f] of after.m){const d=f-(before.m.get(n)||0);if(d>0)who.push([n,d]);}gd=Math.max(0,after.g-before.g);}
  who.sort((a,b)=>b[1]-a[1]);
  const mine=UPD.n>0||UPD.lost>0||UPD.nb>0;if(!fresh&&!mine){UPD.pts=0;UPD.lost=0;UPD.ov=0;UPD.nb=0;UPD.nbn=0;UPD.n=0;UPD.swapped=0;return;}
  el.textContent='';const line=(cls)=>{const d=document.createElement('div');d.className=cls;el.appendChild(d);return d;};
  const add=(d,t,b)=>{const x=document.createElement(b?'b':'span');x.textContent=t;d.appendChild(x);return x;};
  const a=line('ul');add(a,'Update',1);add(a,' \u00b7 '+fresh.toLocaleString()+(fresh===1?' new piece':' new pieces'));
  if(who.length||gd){const b=line('uw');const list=who.slice(0,6).map(([n,d])=>[n===M.name||n===meLabel()?'You':n,d]);if(gd)list.push(['Guests',gd]);
    list.forEach(([n,d],i)=>{if(i)add(b,', ');add(b,n,1);add(b,' '+d.toLocaleString());});
    if(who.length>6){const r=who.slice(6).reduce((x,y)=>x+y[1],0);add(b,', '+(who.length-6)+' more '+r.toLocaleString());}}
  if(mine){const c=line('um');add(c,'You',1);add(c,' '+(UPD.pts>=0?'+':'\u2212')+Math.abs(UPD.pts).toLocaleString()+(Math.abs(UPD.pts)===1?' point':' points'));
    if(UPD.lost>0){const x=add(c,' \u00b7 \u2212'+UPD.lost.toLocaleString()+' lost on '+UPD.ov+(UPD.ov===1?' piece':' pieces')+' placed first by someone else');x.className='neg';}
    if(UPD.nb>0){const x=add(c,' \u00b7 \u2212'+UPD.nb.toLocaleString()+' on '+UPD.nbn+(UPD.nbn===1?' piece':' pieces')+' where someone had just placed a neighbor');x.className='neg';}}
  if(UPD.swapped){const c=line('um');add(c,UPD.swapped+(UPD.swapped===1?' tray piece was':' tray pieces were')+' placed by someone else and swapped.');}
  UPD.pts=0;UPD.lost=0;UPD.ov=0;UPD.nb=0;UPD.nbn=0;UPD.n=0;UPD.swapped=0;
  el.classList.add('show');clearTimeout(updT);updT=setTimeout(()=>el.classList.remove('show'),9000);
}
async function poll(){
  if(polling||dead||SOLO)return;polling=true;
  try{
    const had=M.hand.filter(x=>x!==null&&x!==undefined&&!M.crowd.has(x));
    const [st,me]=await Promise.all([getJSON('/api/mural/state?id='+env.id),getJSON('/api/mural/me?'+env.q)]);
    if(dead)return;
    lastPoll=Date.now();tick=UPDATE;M.hours=hoursOpen();
    if(me.ok)applyMe(me.j);
    let note=null;
    if(st.ok){
      const tb=tallyOf(STATE),from=lastAt,add=applyState(st.j),t0=performance.now(),fresh=add.filter(id=>!M.mine.has(id)),ta=tallyOf(st.j),ev=whoSince(st.j,from);if(+st.j.at>lastAt)lastAt=+st.j.at;if(ev)ta.ev=ev;note=[tb,ta,ev?ev.reduce((x,y)=>x+y[1],0):fresh.length];
      add.forEach(id=>drawPiece(cctx,id));fresh.forEach(id=>pulses.push({id,t:t0,nw:true}));
      if(!fresh.length)flashUpdate(0);
      if(fresh.length){
        /* Until this refresh a tray piece someone else placed could still be placed for partial points
           (owner, 2026-11-19); once the refresh shows it on the board it is swapped for an open piece. */
        /* A PIECE IN THE HAND AT THE REFRESH GOES TOO (owner, 2026-11-19: "i pulled out a piece just as the
           refresh happened, and it seems to be one that someone just placed. when the refresh happens,
           those pieces placed should disappear no matter what"). A tray piece being dragged kept its old
           id and could still be dropped; so could a loose piece being carried across the board. Both
           are let go of here, and the tray slot is refilled below like any other. */
        if(td&&M.crowd.has(td.id)){const t=td;td=null;if(t.raf)cancelAnimationFrame(t.raf);if(t.g)t.g.remove();if(t.b)t.b.classList.remove('out');}
        if(gest&&gest.loose&&gest.mem&&gest.mem.some(o=>M.crowd.has(o.q.id)))gest=null;
        let lost=0;const pool=allOpen();
        for(let k=0;k<M.hand.length;k++){const x=M.hand[k];if(x!==null&&x!==undefined&&M.crowd.has(x)){lost++;if(sel===k)sel=null;if(pool.length){const j=Math.floor(Math.random()*pool.length);M.hand[k]=pool[j];pool[j]=pool[pool.length-1];pool.pop();}else M.hand[k]=null;}}
        const lb=M.loose.length;M.loose=M.loose.filter(l=>!M.crowd.has(l.id));if(M.loose.length!==lb)saveLoose();
        valDirty=true;flashUpdate(fresh.length);UPD.swapped+=lost;
        setMsg(K.name+' updated: '+fresh.length+(fresh.length===1?' new piece':' new pieces')+' from the crowd.'+(lost?' '+lost+' in your tray '+(lost>1?'were':'was')+' placed by someone else, so '+(lost>1?'they were':'it was')+' swapped for '+(lost>1?'new ones.':'a new one.'):''));
      }
    }
    if(note)showUpdNote(note[0],note[1],note[2]);
    renderHand();ui();req();
    if($('lbSheet').classList.contains('show'))standings();
    checkEnd();
  }catch(e){}finally{polling=false;}
}
let booted=false;
function checkEnd(){
  if(finShown)return;
  const complete=SOLO?M.mine.size>=TOTAL:(!!STATE.completed||(STATE.n||0)>=TOTAL),closed=!SOLO&&Date.now()>=env.board.closes;
  if(complete||closed){M.done=true;renderHand();ui();finShown=true;liveFinish=booted&&complete;coolTick();setTimeout(()=>showFinish(complete,closed),liveFinish?350:900);}
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
  $('lbTable').innerHTML='<tr><th></th><th>Player</th><th class="n">Points</th><th class="n">Placed</th></tr>'+(rows.length?rows.map(r=>'<tr class="'+(r.me?'me':'')+'"><td>'+r.rank+'</td><td>'+esc(r.n)+'</td><td class="n">'+r.pts.toLocaleString()+'</td><td class="n">'+r.pieces.toLocaleString()+'</td></tr>').join(''):'<tr><td></td><td>Nobody has placed a piece yet.</td><td></td><td></td></tr>');
}

/* ---------- board gestures ---------- */
const ptrs=new Map();let gest=null;
function looseAt(sx,sy){for(let i=M.loose.length-1;i>=0;i--){const l=M.loose[i];if(Math.abs(sx-l.x)<PS*.7&&Math.abs(sy-l.y)<PS*.7)return l;}return null;}
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;ptrs.set(e.pointerId,{x,y});
  if(ptrs.size===1){const s=toSrc(x,y),l=M.done?null:looseAt(s[0],s[1]);let mem=null;if(l){mem=grp(l.g).map(q=>({q,dx:q.x-l.x,dy:q.y-l.y}));M.loose=M.loose.filter(q=>q.g!==l.g).concat(mem.map(o=>o.q));}gest={x0:x,y0:y,tx:view.tx,ty:view.ty,moved:false,loose:l,mem,ox:l?l.x-s[0]:0,oy:l?l.y-s[1]:0};}
  else if(ptrs.size===2){const a=[...ptrs.values()];gest={pinch:true,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),s:view.s};}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;ptrs.set(e.pointerId,{x,y});
  if(!gest)return;
  if(gest.pinch&&ptrs.size>=2){const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;zoomAt(mx,my,(gest.s*d/gest.d)/view.s);return;}
  if(gest.pinch)return;
  if(!gest.moved&&Math.hypot(x-gest.x0,y-gest.y0)>6)gest.moved=true;
  if(!gest.moved)return;
  hot();
  if(gest.loose){const s=toSrc(x,y),ax=s[0]+gest.ox,ay=s[1]+gest.oy;for(const o of gest.mem){o.q.x=ax+o.dx;o.q.y=ay+o.dy;}trayHover(overTray(e.clientX,e.clientY));req();}
  else{cv.classList.add('pan');view.tx=gest.tx+x-gest.x0;view.ty=gest.ty+y-gest.y0;clampView();req();}
});
function up(e){
  if(!ptrs.has(e.pointerId))return;const p=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);cv.classList.remove('pan');
  if(gest&&!gest.pinch&&ptrs.size===0){
    if(gest.loose){trayHover(false);if(gest.moved){if(overTray(e.clientX,e.clientY))toTray(gest.loose);else dropGroup(gest.loose);}}
    else if(!gest.moved&&sel!==null&&M.hand[sel]!==null){const s=toSrc(p.x,p.y);if(s[0]>=0&&s[0]<=W&&s[1]>=0&&s[1]<=H)attempt(M.hand[sel],s[0],s[1],sel);}
  }
  if(ptrs.size===0)gest=null;
}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{trayHover(false);up(e);});
/* BACK TO THE TRAY (owner, 2026-11-20: "need ability to take pieces back to tray"). Drag a loose piece,
   or a joined group, off the board and drop it on the tray: it leaves the board and goes back in your
   tray. Empty slots fill first; if the tray is full, the returned pieces bump other tray pieces back to
   the open pile so every row stays full. A group bigger than the tray sends the extras to the pile. */
function overTray(cx,cy){const t=root.querySelector('.tray');if(!t)return false;const r=t.getBoundingClientRect();return cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom;}
function trayHover(on){const t=root.querySelector('.tray');if(t)t.classList.toggle('drop',!!on);}
function toTray(l){
  if(M.done||!l)return;const ids=grp(l.g).map(q=>q.id).filter(id=>!has(id));
  M.loose=M.loose.filter(q=>q.g!==l.g);saveLoose();if(gest&&gest.loose)gest=null;
  const back=ids.slice(0,HANDN);
  for(const id of back){let k=M.hand.findIndex(x=>x===null||x===undefined);
    if(k<0){const keep=new Set(back);k=-1;for(let j=M.hand.length-1;j>=0;j--){if(!keep.has(M.hand[j])){k=j;break;}}if(k<0)break;}
    M.hand[k]=id;}
  sel=null;
  renderHand();ui();req();
  setMsg(ids.length===1?'Back in your tray.':(back.length===ids.length?ids.length+' pieces back in your tray.':back.length+' pieces back in your tray, '+(ids.length-back.length)+' back to the pile.'));
}
cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(-e.deltaY*.0016));},{passive:false});
$('zIn').onclick=()=>zoomAt(view.cw/2,view.ch/2,1.6);$('zOut').onclick=()=>zoomAt(view.cw/2,view.ch/2,1/1.6);$('zFit').onclick=fit;
/* ---------- tray drag ---------- */
const hand=$('hand');
hand.addEventListener('pointerdown',e=>{const b=e.target.closest('.piece');if(!b||b.disabled)return;const k=+b.dataset.k;if(M.hand[k]===null||M.done)return;b.setPointerCapture(e.pointerId);td={k,id:M.hand[k],x0:e.clientX,y0:e.clientY,b,drag:false,touch:e.pointerType==='touch'};});
window.addEventListener('pointermove',e=>{
  if(!td)return;
  if(!td.drag&&Math.hypot(e.clientX-td.x0,e.clientY-td.y0)>8){td.drag=true;const g=Math.max(46,(PS+2*MARG)*view.s);td.g=pieceCanvas(td.id,g);td.g.className='ghost';td.gs=g;root.appendChild(td.g);td.b.classList.add('out');}
  if(td.drag){td.cx=e.clientX;td.cy=e.clientY-(td.touch?td.gs*.75:0);if(!td.raf){const t=td;t.raf=requestAnimationFrame(()=>{t.raf=0;if(t.g)t.g.style.transform='translate3d('+(t.cx-t.gs/2)+'px,'+(t.cy-t.gs/2)+'px,0)';});}}
},{signal:ac.signal});
function tup(e){
  if(!td)return;const t=td;td=null;
  if(t.drag){if(t.raf)cancelAnimationFrame(t.raf);t.g.remove();t.b.classList.remove('out');const r=cv.getBoundingClientRect();
    if(t.cx>=r.left&&t.cx<=r.right&&t.cy>=r.top&&t.cy<=r.bottom){const s=toSrc(t.cx-r.left,t.cy-r.top);if(s[0]>=0&&s[0]<=W&&s[1]>=0&&s[1]<=H&&M.hand[t.k]===t.id){attempt(t.id,s[0],s[1],t.k);return;}}
    renderHand();
  }else{sel=sel===t.k?null:t.k;renderHand();if(sel!==null)setMsg(explainVal(t.id));}
}
window.addEventListener('pointerup',tup,{signal:ac.signal});window.addEventListener('pointercancel',tup,{signal:ac.signal});
/* ---------- reference panel ---------- */
function refJump(e){hot();refHot();const p=rzAt(e),sx=p[0],sy=p[1];if(view.s<view.min*1.8)view.s=Math.min(view.max,view.min*3.2);view.tx=view.cw/2-sx*view.s;view.ty=view.ch/2-sy*view.s;clampView();req();}
/* On the whole picture a press jumps the board there and a drag keeps jumping, as before. Zoomed
   in, a drag moves the picture instead and a tap jumps. Two fingers pinch; the wheel zooms. */
const rptr=new Map();let rg=null;
refCv.addEventListener('pointerdown',e=>{
  refCv.setPointerCapture(e.pointerId);rptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(rptr.size===2){const a=[...rptr.values()];rg={pinch:true,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,s:RZ.s};return;}
  rg={x0:e.clientX,y0:e.clientY,cx:RZ.cx,cy:RZ.cy,moved:false,pan:RZ.s>1.01};
  if(!rg.pan)refJump(e);
});
refCv.addEventListener('pointermove',e=>{
  if(!rptr.has(e.pointerId)||!rg)return;rptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(rg.pinch){if(rptr.size<2)return;const a=[...rptr.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,mid={clientX:(a[0].x+a[1].x)/2,clientY:(a[0].y+a[1].y)/2},p=rzAt(mid);rzZoom((rg.s*d/rg.d)/RZ.s,p[0],p[1]);return;}
  if(!rg.pan){refJump(e);return;}
  if(!rg.moved&&Math.hypot(e.clientX-rg.x0,e.clientY-rg.y0)<5)return;
  rg.moved=true;hot();refHot();const r=refCv.getBoundingClientRect();RZ.cx=rg.cx-(e.clientX-rg.x0)/r.width*(W/RZ.s);RZ.cy=rg.cy-(e.clientY-rg.y0)/r.height*(H/RZ.s);rzClamp();req();
});
function refUp(e){if(!rptr.has(e.pointerId))return;rptr.delete(e.pointerId);const g=rg;if(rptr.size===0)rg=null;if(g&&!g.pinch&&g.pan&&!g.moved&&e.type==='pointerup')refJump(e);}
refCv.addEventListener('pointerup',refUp);refCv.addEventListener('pointercancel',refUp);
refCv.addEventListener('wheel',e=>{e.preventDefault();const p=rzAt(e);rzZoom(e.deltaY<0?1.25:1/1.25,p[0],p[1]);},{passive:false});
$('rzIn').onclick=()=>rzZoom(1.6);$('rzOut').onclick=()=>rzZoom(1/1.6);$('rzLab').onclick=()=>{RZ.s=1;rzClamp();rzUi();req();};
rzUi();
/* One switch for the view tab, shared by the panel here and the pop-out window (owner, 2026-11-22:
   the Picture / Crowd / Value controls go with the pop-out). */
function setRefTab(r){refTab=r;root.querySelectorAll('#refSeg button').forEach(x=>x.classList.toggle('on',x.dataset.r===r));$('refCap').textContent=refTab==='pic'?'The finished picture. Zoom in to see detail. Tap it to jump there.':refTab==='val'?'Pieces nobody has placed. Darker is worth more.':'Everything placed so far, by everyone.';
  try{if(popW&&!popW.closed)popW.document.querySelectorAll('[data-pr]').forEach(x=>x.classList.toggle('on',x.dataset.pr===r));}catch(err){}popKey='';req();}
root.querySelectorAll('#refSeg button').forEach(b=>b.onclick=()=>setRefTab(b.dataset.r));
let refState=0;
function setRef(n){refState=n;const r=$('ref');r.classList.toggle('big',n===1);r.classList.toggle('mini',n===2);$('refSize').textContent=n===0?'Larger':'Hide';clampRef();req();}
$('refSize').onclick=()=>setRef((refState+1)%3);
/* POP OUT (owner, 2026-11-20: "can we give users ability to pop-out view finder to new window?"). The
   picture opens in its own window, drawn by this page: the same tab (Picture, Crowd, Value), the whole
   mural, the board's view boxed; a click there jumps the board. The panel here tucks away meanwhile and
   comes back when that window closes. */
let popW=null,popCv=null,popBase=null,popKey='',popTimer=0;const POPTOP=56;
/* THE POP-OUT ZOOMS (owner, 2026-11-20: "you need to be able to zoom in on the pop-out window for
   mural"). PZ is the part of the picture the window shows: s times closer than fit, centred on
   (cx, cy) in picture pixels. Wheel, pinch and the +/- buttons zoom; drag pans when zoomed; a tap
   (no drag) still jumps the board there. Fit button (the zoom label) goes back to the whole mural. */
const PZ={s:1,cx:W/2,cy:H/2,max:24};
function pzClamp(){PZ.s=Math.max(1,Math.min(PZ.max,PZ.s));const sw=W/PZ.s,sh=H/PZ.s;PZ.cx=Math.max(sw/2,Math.min(W-sw/2,PZ.cx));PZ.cy=Math.max(sh/2,Math.min(H-sh/2,PZ.cy));}
function pzAt(e){const r=popCv.getBoundingClientRect(),sw=W/PZ.s,sh=H/PZ.s;return [PZ.cx-sw/2+(e.clientX-r.left)/r.width*sw,PZ.cy-sh/2+(e.clientY-r.top)/r.height*sh];}
function pzUi(){if(!popW||popW.closed)return;const d=popW.document,l=d.getElementById('pzLab'),o=d.getElementById('pzOut'),i=d.getElementById('pzIn');if(l)l.textContent=PZ.s<1.01?'Fit':((PZ.s<9.95?Math.round(PZ.s*10)/10:Math.round(PZ.s))+'x');if(o)o.disabled=PZ.s<=1.01;if(i)i.disabled=PZ.s>=PZ.max-.01;if(popCv)popCv.style.cursor=PZ.s>1.01?'grab':'crosshair';}
function pzZoom(f,px,py){const s0=PZ.s,s1=Math.max(1,Math.min(PZ.max,s0*f));if(s1===s0)return;if(px===undefined){px=PZ.cx;py=PZ.cy;}PZ.cx=px+(PZ.cx-px)*s0/s1;PZ.cy=py+(PZ.cy-py)*s0/s1;PZ.s=s1;pzClamp();pzUi();popDraw();}
function popDraw(){
  if(!popW||popW.closed||!popCv)return;
  const d=popW.document,ww=d.documentElement.clientWidth||600,wh=Math.max(60,(d.documentElement.clientHeight||400)-POPTOP),dp=Math.min(2,popW.devicePixelRatio||1);
  const k0=Math.min(ww/W,wh/H),cw=Math.max(50,Math.floor(W*k0)),ch=Math.max(50,Math.floor(H*k0));
  if(popCv.width!==Math.round(cw*dp)||popCv.height!==Math.round(ch*dp)){popCv.width=Math.round(cw*dp);popCv.height=Math.round(ch*dp);popCv.style.width=cw+'px';popCv.style.height=ch+'px';popKey='';}
  const w=popCv.width,h=popCv.height,vm=refTab==='val'?valueMap():null;
  const sw=W/PZ.s,sh=H/PZ.s,sx=Math.max(0,Math.min(W-sw,PZ.cx-sw/2)),sy=Math.max(0,Math.min(H-sh,PZ.cy-sh/2));
  const key=refTab+'|'+w+'x'+h+'|'+sx+','+sy+','+sw+'|'+(refTab==='crowd'?layV:0)+'|'+(refTab==='val'?valGen:0)+'|'+C.slot;
  if(!popBase||popBase.width!==w||popBase.height!==h){popBase=mk(w,h);popKey='';}
  if(key!==popKey){popKey=key;const b=popBase.getContext('2d');b.fillStyle=C.slot;b.fillRect(0,0,w,h);b.imageSmoothingEnabled=true;b.imageSmoothingQuality='high';
    if(refTab==='pic')b.drawImage(src,sx,sy,sw,sh,0,0,w,h);else if(vm){b.imageSmoothingEnabled=false;b.drawImage(vm,sx*COLS/W,sy*ROWS/H,sw*COLS/W,sh*ROWS/H,0,0,w,h);b.imageSmoothingEnabled=true;}else b.drawImage(crowdL,sx,sy,sw,sh,0,0,w,h);}
  const x=popCv.getContext('2d');x.setTransform(1,0,0,1,0,0);x.drawImage(popBase,0,0);
  const kx=w/sw,ky=h/sh,a=(Math.max(0,-view.tx/view.s)-sx)*kx,c=(Math.max(0,-view.ty/view.s)-sy)*ky,a2=(Math.min(W,(view.cw-view.tx)/view.s)-sx)*kx,c2=(Math.min(H,(view.ch-view.ty)/view.s)-sy)*ky;
  if((a>1||c>1||a2<w-1||c2<h-1)&&a2>0&&c2>0&&a<w&&c<h){x.strokeStyle='#ffffff';x.lineWidth=6*dp;x.strokeRect(a,c,a2-a,c2-c);x.strokeStyle='#15171c';x.lineWidth=2.5*dp;x.strokeRect(a,c,a2-a,c2-c);}
}
function popClosed(){clearInterval(popTimer);popW=null;popCv=null;$('ref').classList.remove('popped');const b=$('refPop');if(b)b.title='Pop the picture out to its own window';req();}
function popOut(){
  if(popW&&!popW.closed){popW.close();popClosed();return;}
  const w=window.open('','mural_viewfinder','popup,width=760,height='+Math.round(760*H/W+40+POPTOP));
  if(!w){setMsg('Your browser blocked the window. Allow pop-ups for this site to pop the picture out.');return;}
  if(refState===2)setRef(0);popW=w;const d=w.document;d.title=K.name+': Picture';
  PZ.s=Math.max(1,RZ.s);PZ.cx=RZ.cx;PZ.cy=RZ.cy;pzClamp();
  d.body.innerHTML='';d.body.style.cssText='margin:0;background:'+(C.bd||'#e9e7e1')+';display:flex;align-items:center;justify-content:center;height:100vh;box-sizing:border-box;padding-top:'+POPTOP+'px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none';
  popCv=d.createElement('canvas');popCv.style.touchAction='none';d.body.appendChild(popCv);
  const bar=d.createElement('div');bar.style.cssText='position:fixed;right:12px;bottom:12px;display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(21,23,28,.82);box-shadow:0 4px 14px rgba(0,0,0,.25);font:600 14px Manrope,system-ui,sans-serif';
  const bs='border:0;background:transparent;color:#fff;min-width:34px;height:34px;border-radius:999px;font:inherit;font-size:18px;cursor:pointer;padding:0 8px';
  bar.innerHTML='<button id="pzOut" title="Zoom out" style="'+bs+'">−</button><button id="pzLab" title="Back to the whole mural" style="'+bs+';font-size:13px;min-width:46px">Fit</button><button id="pzIn" title="Zoom in" style="'+bs+'">+</button>';
  d.body.appendChild(bar);
  const tb=d.createElement('div');tb.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);display:flex;gap:2px;padding:4px;border-radius:999px;background:rgba(21,23,28,.82);box-shadow:0 4px 14px rgba(0,0,0,.25);font:800 13px Manrope,system-ui,sans-serif';
  tb.innerHTML=[['pic','Picture'],['crowd','Crowd'],['val','Value']].map(t=>'<button data-pr="'+t[0]+'"'+(refTab===t[0]?' class="on"':'')+' style="'+bs+';font-size:13px;padding:0 14px">'+t[1]+'</button>').join('');
  d.body.appendChild(tb);
  tb.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>setRefTab(b.dataset.pr));
  const st=d.createElement('style');st.textContent='#pzOut:disabled,#pzIn:disabled{opacity:.35;cursor:default}button:hover:not(:disabled){background:rgba(255,255,255,.14)!important}[data-pr].on,[data-pr].on:hover{background:#fff!important;color:#15171c!important}button:focus{outline:none}button:focus-visible{outline:2px solid #fff;outline-offset:2px}';d.head.appendChild(st);
  d.getElementById('pzIn').onclick=()=>pzZoom(1.6);d.getElementById('pzOut').onclick=()=>pzZoom(1/1.6);d.getElementById('pzLab').onclick=()=>{PZ.s=1;pzClamp();pzUi();popDraw();};
  const ptr=new Map();let g=null;
  popCv.addEventListener('pointerdown',(e)=>{popCv.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptr.size===2){const q=[...ptr.values()];g={pinch:true,d:Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y)||1,s:PZ.s};return;}
    g={x0:e.clientX,y0:e.clientY,cx:PZ.cx,cy:PZ.cy,moved:false};e.preventDefault();});
  popCv.addEventListener('pointermove',(e)=>{if(!ptr.has(e.pointerId)||!g)return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(g.pinch){if(ptr.size<2)return;const q=[...ptr.values()],dd=Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y)||1,p=pzAt({clientX:(q[0].x+q[1].x)/2,clientY:(q[0].y+q[1].y)/2});pzZoom((g.s*dd/g.d)/PZ.s,p[0],p[1]);return;}
    if(!g.moved&&Math.hypot(e.clientX-g.x0,e.clientY-g.y0)<6)return;g.moved=true;if(PZ.s<=1.01)return;popCv.style.cursor='grabbing';
    const r=popCv.getBoundingClientRect();PZ.cx=g.cx-(e.clientX-g.x0)/r.width*(W/PZ.s);PZ.cy=g.cy-(e.clientY-g.y0)/r.height*(H/PZ.s);pzClamp();popDraw();});
  const up=(e)=>{const had=ptr.has(e.pointerId);ptr.delete(e.pointerId);const gg=g;if(ptr.size===0)g=null;else if(gg&&gg.pinch)g={pinch:false,moved:true};pzUi();
    if(!had||!gg||gg.pinch||gg.moved||e.type==='pointercancel')return;
    const p=pzAt(e);hot();if(view.s<view.min*1.8)view.s=Math.min(view.max,view.min*3.2);view.tx=view.cw/2-p[0]*view.s;view.ty=view.ch/2-p[1]*view.s;clampView();req();};
  popCv.addEventListener('pointerup',up);popCv.addEventListener('pointercancel',up);
  popCv.addEventListener('wheel',(e)=>{e.preventDefault();const p=pzAt(e);pzZoom(e.deltaY<0?1.25:1/1.25,p[0],p[1]);},{passive:false});
  w.addEventListener('keydown',(e)=>{if(e.key==='+'||e.key==='=')pzZoom(1.6);else if(e.key==='-'||e.key==='_')pzZoom(1/1.6);else if(e.key==='0'){PZ.s=1;pzClamp();pzUi();popDraw();}});
  w.addEventListener('resize',()=>{popKey='';popDraw();});
  w.addEventListener('beforeunload',()=>setTimeout(popClosed,0));w.addEventListener('pagehide',()=>setTimeout(popClosed,0));
  popTimer=setInterval(()=>{if(!popW||popW.closed)popClosed();},1000);
  $('ref').classList.add('popped');$('refPop').title='Bring the picture back';pzUi();popDraw();
}
$('refPop').onclick=popOut;
/* While the picture is out, the panel here shrinks to one small button that brings it back; closing
   the window does the same on its own (owner, 2026-11-22). */
{const rb=document.createElement('button');rb.className='pill on';rb.id='refBack';rb.type='button';rb.textContent='Bring Back Picture';rb.title='Close the picture window and show the picture here again';
  rb.onclick=()=>{try{if(popW&&!popW.closed)popW.close();}catch(err){}popClosed();};$('ref').appendChild(rb);}
$('updo').onclick=()=>{clearTimeout(updT);$('updo').classList.remove('show');};
cleanups.push(()=>{try{if(popW&&!popW.closed)popW.close();}catch(e){}clearInterval(popTimer);});
const refEl=$('ref');let rdrag=null;
function clampRef(){if(!refEl.style.left)return;const st=$('stage').getBoundingClientRect(),r=refEl.getBoundingClientRect();refEl.style.left=Math.max(4,Math.min(st.width-r.width-4,parseFloat(refEl.style.left)))+'px';refEl.style.top=Math.max(4,Math.min(st.height-r.height-4,parseFloat(refEl.style.top)))+'px';}
function refDragStart(e){const st=$('stage').getBoundingClientRect(),r=refEl.getBoundingClientRect();rdrag={ox:e.clientX-r.left,oy:e.clientY-r.top,x0:e.clientX,y0:e.clientY,moved:false,pill:e.currentTarget.id==='refShow'};e.currentTarget.setPointerCapture(e.pointerId);refEl.style.left=(r.left-st.left)+'px';refEl.style.top=(r.top-st.top)+'px';refEl.style.right='auto';refEl.classList.add('moving');e.preventDefault();}
function refDragMove(e){if(!rdrag)return;if(!rdrag.moved&&Math.hypot(e.clientX-rdrag.x0,e.clientY-rdrag.y0)<6)return;rdrag.moved=true;const st=$('stage').getBoundingClientRect();refEl.style.left=(e.clientX-st.left-rdrag.ox)+'px';refEl.style.top=(e.clientY-st.top-rdrag.oy)+'px';clampRef();}
function refDragEnd(){const d=rdrag;rdrag=null;refEl.classList.remove('moving');if(d&&d.pill&&!d.moved)setRef(0);}
[$('refGrip'),$('refCap'),$('refShow')].forEach(el=>{el.addEventListener('pointerdown',refDragStart);el.addEventListener('pointermove',refDragMove);el.addEventListener('pointerup',refDragEnd);el.addEventListener('pointercancel',refDragEnd);});
/* ---------- the finish: THE WALL (memorial.js) ----------
   Owner, 2026-11-19: the closing screen is a full pastel screen like the
   gauntlet endings, it is kept for good, and a player who comes back through
   the archive or the Puzzle Shelf sees it FIRST, before Replay. So there are
   three ways in: 'live' (the open mural was just finished, or is closed),
   'visit' (a finished mural opened from the shelf or the archive) and
   'rebuilt' (a shelf copy the player has now finished alone). */
function confetti(){
  const c=$('confetti'),x=c.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);c.width=innerWidth*dpr;c.height=innerHeight*dpr;x.setTransform(dpr,0,0,dpr,0,0);
  const cols=['#7dd3fc','#6ee7b7','#fbbf24','#fb7185','#a5b4fc','#bef264','#fb923c','#c084fc','#ffffff'],P=[];
  for(let i=0;i<170;i++)P.push({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.6,vx:(Math.random()-.5)*2.4,vy:2+Math.random()*3.5,w:6+Math.random()*7,h:4+Math.random()*5,a:Math.random()*6.3,va:(Math.random()-.5)*.3,c:cols[i%cols.length]});
  const t0=performance.now();
  (function step(){const t=performance.now()-t0;x.clearRect(0,0,innerWidth,innerHeight);if(t>5200||!$('fin').classList.contains('show'))return;
    x.globalAlpha=t>4200?1-(t-4200)/1000:1;
    for(const p of P){p.x+=p.vx+Math.sin((t+p.a*200)/300)*.6;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h);x.restore();}
    requestAnimationFrame(step);})();
}
let memo=null,wallData=env.wall||null,wallAsked=!!env.wall;
function barsHold(color){
  /* The phone's browser bars take the wall's colour while it is up (see GauntletScreens useStageChrome). */
  const rel=holdThemeColor(color),html=document.documentElement,body=document.body,ph=html.style.backgroundColor,pb=body.style.backgroundColor;
  html.style.backgroundColor=color;body.style.backgroundColor=color;
  const bands=['top','bottom'].map(side=>{const n=document.createElement('div');n.setAttribute('data-mural-edge','');n.style.cssText='position:fixed;left:0;right:0;'+side+':0;height:12px;z-index:899;pointer-events:none;background:'+color;body.appendChild(n);return n;});
  let off=false;const undo=()=>{if(off)return;off=true;rel();html.style.backgroundColor=ph;body.style.backgroundColor=pb;bands.forEach(n=>n.remove());};
  cleanups.push(undo);return undo;
}
function closeWall(){if(memo){memo.close();memo=null;}}
function openWall(mode,o){
  o=o||{};
  const complete=o.complete!==undefined?o.complete:true,closed=!!o.closed,live=mode==='live';
  const crowd=live?STATE:(env.crowd||{}),cm=env.crowdMe||{};
  const me=live?{name:M.name,firsts:M.firsts,pts:M.pts,rank:M.mine.size?M.rank:null,pieces:M.mine}:{name:cm.name||null,firsts:cm.firsts||0,pts:cm.points||0,rank:cm.rank||null,pieces:Array.isArray(cm.pieces)?cm.pieces:[]};
  const done=env.board.completed||Date.parse(crowd.completed||'')||0;
  const hrs=done?Math.max(0,(done-env.board.opens)/3600000):Math.max(0,(Math.min(Date.now(),env.board.closes)-env.board.opens)/3600000);
  const fullPic=mode==='live'?complete:!!(done||(crowd.n||0)>=TOTAL);
  const shelf={label:'Jigsaw Puzzles',href:'/jig/shelf?tab=murals'};
  let primary=null,alts=[],top=[shelf],note='',next=null;
  if(mode==='visit'){
    const had=M.mine.size;
    primary={label:had>=TOTAL?'See Your Finished Copy':had?'Continue Your Replay':'Replay This '+K.name,sub:'Build it yourself. No points, no clock, and your pieces are kept on this device.',onClick:closeWall};
    top=[shelf,{label:had&&had<TOTAL?'Continue':'Replay',onClick:closeWall}];
    alts=[{label:'Play Today’s '+K.name,href:K.route},shelf];
  }else if(mode==='rebuilt'){
    note='You have now rebuilt all '+TOTAL.toLocaleString()+' pieces on your own.';
    primary={label:'Play Today’s '+K.name,href:K.route};
    alts=[{label:'See Your Finished Copy',onClick:closeWall},shelf];
  }else if(PRIV){
    primary={label:'Start Another Private Mural',href:'/mural/private'};
    alts=[{label:'See The Finished Mural',onClick:closeWall},{label:'Standings',onClick:()=>{closeWall();standings();$('lbSheet').classList.add('show');}},{label:'Play '+K.name,href:K.route}];
    top=[{label:'Standings',onClick:()=>{closeWall();standings();$('lbSheet').classList.add('show');}}];
  }else{
    if(closed)primary={label:'Play The New '+K.name,onClick:()=>window.location.reload()};
    alts=[{label:complete?'See The Finished '+K.name:'See The '+K.name,onClick:closeWall},{label:'Standings',onClick:()=>{closeWall();standings();$('lbSheet').classList.add('show');}},{label:'Build It Yourself',href:K.route+'?solo='+env.id}];
    top=[shelf,{label:'Standings',onClick:()=>{closeWall();standings();$('lbSheet').classList.add('show');}}];
    next=el=>finNext(el,complete,closed);
  }
  closeWall();
  memo=openMemorial($('fin'),{
    name:PRIV?'private mural':K.name,eyebrow:(PRIV?'Private Mural'+(PRIV.group?' · '+PRIV.group:''):K.name+' · '+muralDateLabel(env.id))+(fullPic?' · Finished':' · Closed'),
    cols:COLS,rows:ROWS,src,wall:wallData,state:crowd,me,complete:fullPic,hoursOpen:hrs,
    dark:theme==='dark',animate:o.animate!==false,credit:creditLine(),homeHref:'/',
    top,primary,alts,note,next,bars:barsHold,sweep:o.sweep!==false,
  });
  if(o.confetti)confetti();
}
/* THE REVEAL (owner, 2026-11-19: "we also need an end animation to reveal the final screen you
   built"). When the last piece lands while the player is here, the board pulls back to show the
   whole picture, a ring and a band of light cross it, and the wall's own colour opens out from the
   middle of the picture until it covers the screen; the wall is then built underneath it. A page
   opened on an already finished mural goes straight to the wall. */
function reveal(then){
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!liveFinish){then(false);return;}
  liveFinish=false;
  root.querySelectorAll('.sheet').forEach(x=>x.classList.remove('show'));
  fit();req();
  const st=$('stage').getBoundingClientRect(),bx=st.left+view.tx,by=st.top+view.ty,bw=W*view.s,bh=H*view.s;
  const fx=document.createElement('div');fx.className='finFx';fx.style.setProperty('--fx',(bx+bw/2)+'px');fx.style.setProperty('--fy',(by+bh/2)+'px');
  fx.innerHTML='<div class="ring" style="left:'+bx+'px;top:'+by+'px;width:'+bw+'px;height:'+bh+'px"><i></i></div><div class="fill" style="background:'+(theme==='dark'?'#0b0f1a':'#f1affb')+'"></div>';
  root.appendChild(fx);
  setMsg(PHOTO?'That is every piece. Puzzle finished.':SOLO?'That is every piece. You rebuilt it.':'The last piece is in. '+(PRIV?'Your mural':K.name)+' is complete.');
  setTimeout(()=>{if(!dead)fx.classList.add('go');},1500);
  setTimeout(()=>{if(dead)return;then(true);setTimeout(()=>fx.remove(),60);},2500);
}
let liveFinish=false;
function showFinish(complete,closed){
  const open=(swept)=>{if(dead)return;if(PHOTO){photoFinish();return;}if(SOLO)openWall('rebuilt',{complete:true,sweep:!swept});else openWall('live',{complete,closed,confetti:complete,sweep:!swept});};
  const go=()=>{if(dead)return;if(complete)reveal(open);else open(false);};
  if(PHOTO||(wallAsked&&wallData)){go();return;}
  /* Who placed what, in order, for the build and the blocks. Without it the wall still opens, from the standings snapshot. */
  wallAsked=true;
  getJSON('/api/mural/wall?id='+env.id).then(w=>{if(w.ok&&w.j&&Array.isArray(w.j.order))wallData=w.j;}).catch(()=>{}).then(go);
}
/* WHAT COMES AFTER (owner, 2026-11-19): a finished mural is closed. Either offer
   the other mural (if it is open and unfinished) or count down to the next one
   of this kind, which the page then loads itself. */
let nextT=null;
function finNext(box,complete,closed){
  if(!box)return;
  box.innerHTML='<p id="finCount"></p><div id="finOther"></div>';
  clearInterval(nextT);
  if(!closed){
    /* The next one opens the moment this one is finished, or 24 hours after this one opened if that is later. */
    const doneAt=Date.parse(STATE.completed||'')||Date.now(),opens=env.board.nextAt?Math.max(env.board.nextAt,doneAt):Math.max(env.board.opens+MURAL_MIN_MS,doneAt),live=opens>Date.now();
    const tickN=()=>{
      const left=opens-Date.now(),e=$('finCount');
      if(left<=0&&live){clearInterval(nextT);window.location.reload();return;}
      if(left<=0){clearInterval(nextT);if(e)e.innerHTML='<a class="mwGo" href="'+K.route+'">Play The New '+K.name+'</a>';return;}
      const m=Math.ceil(left/60000),h=Math.floor(m/60);
      if(e)e.textContent='The next '+K.name+' opens in '+(h?h+(h===1?' hour':' hours')+' and ':'')+(m%60)+(m%60===1?' minute.':' minutes.');
    };
    tickN();nextT=setInterval(tickN,15000);timers.push(nextT);
  }
  const other=K.key==='mural'?MURAL_KINDS.muraltoo:MURAL_KINDS.mural;
  if(muralLaunched(other.key)){
    getJSON('/api/mural/board?kind='+other.key).then(ob=>(ob.ok&&ob.j&&ob.j.id?getJSON('/api/mural/state?id='+ob.j.id):{ok:false})).then(o=>{
      if(dead||!o.ok||!o.j)return;
      const open=!o.j.completed&&(o.j.n||0)<(o.j.total||TOTAL);
      const e=$('finOther');
      if(e&&open)e.innerHTML='<a class="mwGo" href="'+other.route+'">Play '+other.name+' Now</a>';
    }).catch(()=>{});
  }
}
function creditLine(){const p=env.board.photo||{};return p.name?'Photo: '+p.name+(p.by?', by '+p.by:'')+(p.lic?' ('+p.lic+')':'')+', Wikimedia Commons.':'';}

/* ---------- wiring ---------- */
/* No wait on Shuffle (owner, 2026-11-19: "Remove the refresh limit"); the 10 second timer is gone.
   The button reads Shuffle (owner, 2026-11-20: "change 'swap' to shuffle"; it was Swap, and Refresh before that):
   "refresh" is the board's own two-minute update. */
function coolTick(){const b=$('dealBtn'),w=!!(M&&M.done&&finShown);b.disabled=!!(M&&M.done)&&!w;b.textContent=w?(PHOTO?'Finished':'The Wall'):'Shuffle';const cb=$('clearBtn');if(cb)cb.style.display=M&&M.done?'none':'';}
function refreshSet(){if(M.done){if(finShown)showFinish(SOLO||!!STATE.completed||(STATE.n||0)>=TOTAL,!SOLO&&Date.now()>=env.board.closes);return;}dealAll();setMsg(M.hand.some(x=>x!==null)?'New set, from anywhere on the mural. Use the picture to find where each one goes.':'You have placed everything.');}
$('dealBtn').onclick=refreshSet;
/* CLEAR LOOSE PIECES (owner, 2026-11-20). It acts on the board, so it sits on the board beside the zoom
   control, not in the tray beside Shuffle (owner, later that day: "adjust where the 'clear' button is"). Takes every
   loose piece off the board, back into the open pile, and fills any empty tray slots. */
function clearLoose(){
  if(M.done)return;const n=M.loose.length;
  if(!n){setMsg('No loose pieces on the board to clear.');return;}
  M.loose=[];saveLoose();if(gest&&gest.loose)gest=null;
  const pool=allOpen();for(let k=0;k<M.hand.length;k++){if(M.hand[k]!==null&&M.hand[k]!==undefined)continue;if(!pool.length)break;const j=Math.floor(Math.random()*pool.length);M.hand[k]=pool[j];pool[j]=pool[pool.length-1];pool.pop();}
  renderHand();ui();req();setMsg(n+(n===1?' loose piece':' loose pieces')+' cleared off the board.');
}
$('clearBtn').onclick=clearLoose;
$('helpBtn').onclick=()=>$('helpSheet').classList.add('show');
$('lbBtn').onclick=()=>{if(SOLO){openWall('visit',{animate:false});return;}standings();$('lbSheet').classList.add('show');};
$('dOther').onclick=()=>{window.location.href=K.key==='mural'?'/muraltoo':'/mural';};
$('themeBtn').onclick=()=>{theme=theme==='dark'?'light':'dark';root.setAttribute('data-theme',theme);$('themeBtn').textContent=theme==='dark'?'Light':'Dark';colors();valDirty=true;req();};
$('themeBtn').textContent=theme==='dark'?'Light':'Dark';
root.querySelectorAll('.sheet .in').forEach(el=>{const sc=document.createElement('div');sc.className='sc';while(el.firstChild)sc.appendChild(el.firstChild);el.appendChild(sc);});
root.querySelectorAll('.sheet').forEach(s=>{s.addEventListener('click',e=>{if(e.target===s||e.target.hasAttribute('data-close'))s.classList.remove('show');});});
document.addEventListener('keydown',e=>{if(e.key==='Escape')root.querySelectorAll('.sheet').forEach(s=>s.classList.remove('show'));if(e.key==='+'||e.key==='=')zoomAt(view.cw/2,view.ch/2,1.4);if(e.key==='-')zoomAt(view.cw/2,view.ch/2,1/1.4);if(e.key==='0')fit();},{signal:ac.signal});
window.addEventListener('resize',()=>{resize();clampView();clampRef();fitHand();req();},{signal:ac.signal});
root.querySelectorAll('.rows [data-rows]').forEach(b=>{b.onclick=()=>{const n=+b.dataset.rows;if(n===TRAYR)return;TRAYR=n;try{localStorage.setItem('mural_tray_rows',String(n));}catch(e){}rowsUi();sizeHand();fitHand();};});
rowsUi();
function setFull(on){const wasFit=view.s<=view.min*1.001;root.classList.toggle('full',on);const cx=(view.cw/2-view.tx)/view.s,cy=(view.ch/2-view.ty)/view.s;resize();if(M){if(wasFit)fit();else{view.tx=view.cw/2-cx*view.s;view.ty=view.ch/2-cy*view.s;clampView();}clampRef();req();}}
$('fullBtn').onclick=()=>setFull(true);$('menuBtn').onclick=()=>setFull(false);

cutEdges(hashId(env.id));
colors();resize();
M.hours=hoursOpen();
applyState(env.state).forEach(id=>drawPiece(cctx,id));
applyMe(env.me);
loadLoose();
if(SOLO){for(const q of ['#updBox','#allBox']){const ub=root.querySelector(q);if(ub)ub.style.display='none';}$('lbBtn').textContent='The Wall';}
$('credit').textContent=creditLine();
if(PRIV){
  /* A PRIVATE MURAL'S HEADER: no Mural / MuralToo switch, a tag that says whose it is, and Invite,
     which copies the link. Site Total reads All Placed: only the people invited build it. */
  const sg=$('muralSeg');if(sg){const tag=document.createElement('span');tag.className='privTag';tag.textContent=PRIV.group?PRIV.group+'\u2019s Mural':'Private Mural';sg.replaceWith(tag);}
  const pb=$('privBtn');
  if(pb){pb.textContent='Invite';pb.removeAttribute('href');pb.setAttribute('role','button');pb.style.cursor='pointer';
    pb.onclick=(ev)=>{ev.preventDefault();const link=window.location.origin+'/mural/p/'+PRIV.code;const done=()=>setMsg('Invite link copied. '+(PRIV.group?'Members of '+PRIV.group+' can open it and play.':'Anyone you send it to can open it and play.'));
      try{navigator.clipboard.writeText(link).then(done,()=>setMsg('Invite link: '+link));}catch(e){setMsg('Invite link: '+link);}};}
  const hl=root.querySelector('#helpSheet .lead');
  if(hl)hl.textContent='A private mural: one picture, '+TOTAL.toLocaleString()+' pieces, built by '+(PRIV.group?'the members of '+PRIV.group:'everyone who has the invite link')+'. It stays open until every piece is placed. It scores on its own standings and does not count toward your Mind Loft points.';
  $('dOther').textContent='Play '+K.name;$('dOther').onclick=()=>{window.location.href=K.route;};
}
if(PHOTO){
  /* A FREE-PLAY JIGSAW'S HEADER (2026-11-21): no Mural / MuralToo switch, no points, standings or
     private murals. A tag names the size, and the pill that was Private Mural goes back to the
     jigsaw portal. The picture panel keeps only Picture. */
  const sg=$('muralSeg');if(sg){const tag=document.createElement('span');tag.className='privTag';tag.textContent=PHOTO.cols*PHOTO.rows>=1000?(PHOTO.cols*PHOTO.rows).toLocaleString('en-US')+' Pieces':(PHOTO.cols*PHOTO.rows)+' Pieces';sg.replaceWith(tag);}
  const pts=$('sPts');if(pts&&pts.parentNode)pts.parentNode.style.display='none';
  const pb=$('privBtn');if(pb){pb.textContent='All Jigsaws';pb.setAttribute('href','/jig/shelf');}
  for(const q of ['#lbBtn','#dOther','#meta','#refSeg [data-r="crowd"]','#refSeg [data-r="val"]']){const x=root.querySelector(q);if(x)x.style.display='none';}
  const hl=root.querySelector('#helpSheet .lead');
  if(hl)hl.textContent=PHOTO.name+', cut into '+TOTAL.toLocaleString('en-US')+' pieces. Drag a piece from the tray onto its spot, or tap the piece and then the spot. Shuffle deals a new handful. Pieces can lock together anywhere, but a piece only counts once it is in its right spot. Nothing here scores, there is no clock, and your pieces are kept in this browser, so you can stop and come back.';
}
function photoFinish(){
  try{const d=JSON.parse(localStorage.getItem('sot_jigsaw_done')||'{}');d[PHOTO.key]=1;localStorage.setItem('sot_jigsaw_done',JSON.stringify(d));}catch(e){}
  const old=root.querySelector('.photoFin');if(old)old.remove();
  const el=document.createElement('div');el.className='photoFin';el.setAttribute('role','dialog');el.setAttribute('aria-label','Jigsaw finished');
  const n=TOTAL.toLocaleString('en-US'),esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  el.innerHTML='<style>.photoFin{position:fixed;inset:0;z-index:55;display:flex;align-items:center;justify-content:center;padding:20px;background:'+(theme==='dark'?'#0b0f1a':'#f1affb')+';color:#0b0d12;overflow:auto}'
    +'.mrl[data-theme="dark"] .photoFin{color:#eef1f6}.photoFin .pfIn{max-width:560px;width:100%;text-align:center}'
    +'.photoFin .pfEb{font-size:13px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px}'
    +'.photoFin h2{font-size:clamp(26px,5vw,38px);line-height:1.15;margin:0 0 10px;font-weight:800}'
    +'.photoFin p{font-size:16px;line-height:1.5;margin:0 0 16px;font-weight:600}'
    +'.photoFin img{display:block;width:100%;height:auto;border-radius:12px;border:1px solid currentColor;margin:0 0 18px}'
    +'.photoFin .pfB{display:flex;flex-direction:column;gap:10px}'
    +'.photoFin a,.photoFin button{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;font-weight:800;padding:14px;border-radius:12px;border:1px solid currentColor;background:transparent;color:inherit;text-decoration:none;cursor:pointer}'
    +'.photoFin .pfP{background:#0b0d12;color:#fff;border-color:#0b0d12}.mrl[data-theme="dark"] .photoFin .pfP{background:#eef1f6;color:#0b0d12;border-color:#eef1f6}'
    +'.photoFin .pfC{font-size:12.5px;font-weight:600;margin:14px 0 0;opacity:.8}</style>'
    +'<div class="pfIn"><p class="pfEb">Jigsaw Finished</p><h2>'+esc(PHOTO.name)+'</h2>'
    +'<p>All '+n+' pieces, built on your own.</p>'
    +'<img src="/api/'+PHOTO.g+'/img?n='+PHOTO.n+'&w=960" alt="'+esc(PHOTO.name)+', finished"/>'
    +'<div class="pfB"><a class="pfP" href="/jig/shelf">Back to Jigsaw Puzzles</a><a href="/jig">Play Today\u2019s Jig</a><button type="button" data-close="1">See Your Finished Puzzle</button></div>'
    +'<p class="pfC">'+esc(creditLine())+'</p></div>';
  el.addEventListener('click',e=>{if(e.target.hasAttribute('data-close'))el.remove();});
  root.appendChild(el);
}
/* THE OPENING VIEW (owner, 2026-11-20: "mural seems to work best when zoomed in... make that change").
   The whole board fitted to a desktop screen made each piece about 10 px, too small to match or drop.
   Both phone and desktop now open zoomed in (37 and 42 CSS px a piece), centred on the open edge of the
   build: the middle of the empty slots that touch a placed piece. 0 still shows the whole board. */
function openView(){fit();const px=isPhone?37:42;if(W*view.s/COLS>=px)return;view.s=Math.min(view.max,Math.max(view.min,px/PS));
  let sx=0,sy=0,n=0;for(let id=0;id<TOTAL;id++){if(has(id)||!nbCount(id))continue;sx+=id%COLS;sy+=(id/COLS)|0;n++;}
  const fx=n?(sx/n+.5)*PS:W*.5,fy=n?(sy/n+.5)*PS:H*.5;view.tx=view.cw/2-fx*view.s;view.ty=view.ch/2-fy*view.s;clampView();req();}
openView();
dealAll();
setMsg(PHOTO?'Build it at your own pace. Nothing here scores, and your pieces are kept in this browser.':SOLO?'Shelf copy: build it alone, at your own pace. Nothing here scores, and your pieces are kept in this browser.':'Drag a piece onto the mural, or tap a piece and then tap its spot.');
ui();draw();
ro=new ResizeObserver(()=>{const r=$('stage').getBoundingClientRect();if(Math.abs(r.width-view.cw)<1&&Math.abs(r.height-view.ch)<1)return;const wasFit=view.s<=view.min*1.001,hn=HANDN,ts=TSZ;resize();if(HANDN!==hn||TSZ!==ts)fitHand();if(wasFit)fit();else clampView();clampRef();req();});
ro.observe($('stage'));
/* A RETURN VISIT (shelf or archive) opens on the wall, before Replay. A copy already rebuilt does not fire the finish again. */
if(SOLO){if(M.mine.size>=TOTAL){finShown=true;M.done=true;renderHand();ui();coolTick();}if(!PHOTO)openWall('visit');}
checkEnd();booted=true;
  }
}
