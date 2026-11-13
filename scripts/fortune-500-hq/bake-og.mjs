import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/package.json');
const { ImageResponse } = require('next/dist/compiled/@vercel/og/index.node.js');
const React = require('react'); const h = React.createElement;
import { PLACE_MAP_GEO } from '../../lib/place-map-geo.js'; // run from repo root: node scripts/fortune-500-hq/bake-og.mjs
const Q = JSON.parse(fs.readFileSync('scripts/fortune-500-hq/quizzes-snippet.json','utf8'));
const pts = Q.flatMap(q => q.cities.map(c => [c.lon, c.lat]));
const u = PLACE_MAP_GEO.usa;
const rings = [u.mainland, ...(u.islands||[])];
const all = [].concat(...rings);
const lats = all.map(p=>p[1]); const minLat=Math.min(...lats), maxLat=Math.max(...lats);
const kx = Math.cos((minLat+maxLat)/2*Math.PI/180);
const xs = all.map(p=>p[0]*kx); const minX=Math.min(...xs), maxX=Math.max(...xs);
const W=660; const H=W*(maxLat-minLat)/(maxX-minX);
const P=(lon,lat)=>[((lon*kx-minX)/(maxX-minX)*W).toFixed(1), ((maxLat-lat)/(maxLat-minLat)*H).toFixed(1)];
const path = r => 'M'+r.map((p,i)=>(i?'L':'')+P(p[0],p[1]).join(',')).join('')+'Z';
const ACC='#fbbf24';
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H.toFixed(0)}" viewBox="-6 -6 ${W+12} ${(H+12).toFixed(0)}">`;
svg += `<path d="${rings.filter(r=>r.length>3).map(path).join('')}" fill="#162036" stroke="#3b4a6b" stroke-width="1.6" stroke-linejoin="round"/>`;
svg += (u.lakes||[]).filter(r=>r.length>3).map(r=>`<path d="${path(r)}" fill="#0b0f1a" stroke="#3b4a6b" stroke-width="1"/>`).join('');
svg += pts.map(p=>{const [x,y]=P(p[0],p[1]);return `<circle cx="${x}" cy="${y}" r="7" fill="${ACC}" opacity="0.10"/>`}).join('');
svg += pts.map(p=>{const [x,y]=P(p[0],p[1]);return `<circle cx="${x}" cy="${y}" r="2.6" fill="${ACC}"/>`}).join('');
// decoy click mark in the Great Basin (no HQ there)
const [cx,cy]=P(-115.2,39.6).map(Number);
svg += `<g stroke="#f87171" stroke-width="4" stroke-linecap="round"><line x1="${cx-9}" y1="${cy-9}" x2="${cx+9}" y2="${cy+9}"/><line x1="${cx-9}" y1="${cy+9}" x2="${cx+9}" y2="${cy-9}"/></g>`;
svg += `</svg>`;
const mapURI = 'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="22" viewBox="0 0 100 100"><polygon points="0,35 50,0 100,35 100,100 72,100 72,55 50,75 28,55 28,100 0,100" fill="${ACC}"/></svg>`;
const markURI = 'data:image/svg+xml;base64,'+Buffer.from(mark).toString('base64');
const font = w => fs.readFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff`);
const T=(t,s)=>h('div',{style:{display:'flex',...s}},t);
const el = h('div',{style:{width:1200,height:630,display:'flex',position:'relative',background:'#0b0f1a',fontFamily:'M',color:'#e9edf4'}},[
  h('div',{key:'glow',style:{position:'absolute',left:480,top:-60,width:820,height:720,display:'flex',background:'radial-gradient(closest-side, rgba(251,191,36,0.16), rgba(11,15,26,0))'}}),
  h('img',{key:'map',src:mapURI,width:W,height:Math.round(H),style:{position:'absolute',left:510,top:Math.round(330-H/2)+14}}),
  h('div',{key:'pill',style:{position:'absolute',left:640,top:62,display:'flex',alignItems:'center',background:'#e9edf4',color:'#0b0f1a',borderRadius:999,padding:'12px 24px',fontSize:26,fontWeight:800,boxShadow:'0 10px 30px rgba(0,0,0,.5)'}},'Where is it headquartered?'),
  h('div',{key:'l',style:{position:'absolute',left:64,top:48,width:470,display:'flex',flexDirection:'column'}},[
    h('div',{key:'b',style:{display:'flex',alignItems:'center',fontSize:22,fontWeight:800}},[h('img',{key:'i',src:markURI,width:26,height:22,style:{marginRight:10}}),'Mind Loft']),
    h('div',{key:'c',style:{display:'flex',marginTop:26,alignSelf:'flex-start',fontSize:17,fontWeight:800,letterSpacing:2,color:ACC,border:`2px solid ${ACC}88`,borderRadius:999,padding:'7px 16px'}},'FORTUNE 500 · 20 PARTS'),
    T('HQ Hunt',{marginTop:14,fontSize:104,fontWeight:800,lineHeight:1.02,letterSpacing:-4}),
    T("Click where America's 500 biggest companies keep their headquarters.",{marginTop:10,fontSize:27,fontWeight:700,lineHeight:1.3,color:'#cfd6e3'}),
    T('25 companies a round. Same city or suburb scores full points.',{marginTop:16,fontSize:22,fontWeight:800,lineHeight:1.3,color:ACC}),
    h('div',{key:'p',style:{display:'flex',alignSelf:'flex-start',marginTop:20,fontSize:22,fontWeight:800,color:'#0b0f1a',background:ACC,borderRadius:999,padding:'12px 26px'}},'Play free'),
  ]),
  T('mindloftdaily.com',{position:'absolute',right:56,bottom:36,fontSize:22,fontWeight:700,color:'#8b95a8'}),
]);
const res = new ImageResponse(el,{width:1200,height:630,fonts:[600,700,800].map(w=>({name:'M',data:font(w),weight:w,style:'normal'}))});
fs.writeFileSync('public/og/fortune-500-hq.png', Buffer.from(await res.arrayBuffer()));
console.log('ok', H.toFixed(0));
