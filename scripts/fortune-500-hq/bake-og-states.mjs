// Share card for the Fortune 500 HQ States series (one card for all 20 parts).
// Run from repo root: node scripts/fortune-500-hq/bake-og-states.mjs
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/package.json');
const { ImageResponse } = require('next/dist/compiled/@vercel/og/index.node.js');
const React = require('react'); const h = React.createElement;
const { US_ALBERS: G } = await import(process.env.US_GEO || '../../lib/us-albers-geo.js');
const Q = JSON.parse(fs.readFileSync(process.env.SNIP || 'scripts/fortune-500-hq/states-snippet.json','utf8'));
const count = {}; Q.forEach(q => q.cities.forEach(c => { const st = c.hq.slice(-2); count[st] = (count[st]||0) + 1; }));
const max = Math.max(...Object.values(count));
const ACC = '#fbbf24';
const W = 680, H = Math.round(W * G.H / G.W);
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${G.W} ${G.H}">`;
for (const st of G.states) {
  const n = count[st.a] || 0;
  const op = n ? (0.18 + 0.72 * Math.sqrt(n / max)).toFixed(2) : 0;
  svg += `<path d="${st.d}" fill="#162036" stroke="#4a5a7d" stroke-width="1.3" stroke-linejoin="round"/>`;
  if (n) svg += `<path d="${st.d}" fill="${ACC}" fill-opacity="${op}" stroke="none"/>`;
}
// one wrong pick highlighted, like the board's reveal
const nv = G.states.find(s => s.a === 'NV');
svg += `<path d="${nv.d}" fill="#f87171" fill-opacity="0.75" stroke="#4a5a7d" stroke-width="1.3"/>`;
svg += `</svg>`;
const mapURI = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="22" viewBox="0 0 100 100"><polygon points="0,35 50,0 100,35 100,100 72,100 72,55 50,75 28,55 28,100 0,100" fill="${ACC}"/></svg>`;
const markURI = 'data:image/svg+xml;base64,' + Buffer.from(mark).toString('base64');
const font = w => fs.readFileSync(`node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff`);
const T = (t, s) => h('div', { style: { display: 'flex', ...s } }, t);
const el = h('div', { style: { width: 1200, height: 630, display: 'flex', position: 'relative', background: '#0b0f1a', fontFamily: 'M', color: '#e9edf4' } }, [
  h('div', { key: 'glow', style: { position: 'absolute', left: 480, top: -60, width: 820, height: 720, display: 'flex', background: 'radial-gradient(closest-side, rgba(251,191,36,0.14), rgba(11,15,26,0))' } }),
  h('img', { key: 'map', src: mapURI, width: W, height: H, style: { position: 'absolute', left: 500, top: Math.round(340 - H / 2) + 18 } }),
  h('div', { key: 'pill', style: { position: 'absolute', left: 640, top: 58, display: 'flex', alignItems: 'center', background: '#e9edf4', color: '#0b0f1a', borderRadius: 999, padding: '12px 24px', fontSize: 26, fontWeight: 800, boxShadow: '0 10px 30px rgba(0,0,0,.5)' } }, 'Which state is it based in?'),
  h('div', { key: 'l', style: { position: 'absolute', left: 64, top: 48, width: 470, display: 'flex', flexDirection: 'column' } }, [
    h('div', { key: 'b', style: { display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 800 } }, [h('img', { key: 'i', src: markURI, width: 26, height: 22, style: { marginRight: 10 } }), 'Mind Loft']),
    h('div', { key: 'c', style: { display: 'flex', marginTop: 26, alignSelf: 'flex-start', fontSize: 17, fontWeight: 800, letterSpacing: 2, color: ACC, border: `2px solid ${ACC}88`, borderRadius: 999, padding: '7px 16px' } }, 'FORTUNE 500 · 20 PARTS'),
    T('HQ States', { marginTop: 18, fontSize: 86, whiteSpace: 'nowrap', fontWeight: 800, lineHeight: 1.04, letterSpacing: -4 }),
    T("Click the home state of each of America's 500 biggest companies.", { marginTop: 10, fontSize: 27, fontWeight: 700, lineHeight: 1.3, color: '#cfd6e3' }),
    T('25 companies a round. Right state, 100 points.', { marginTop: 16, fontSize: 22, fontWeight: 800, lineHeight: 1.3, color: ACC }),
    h('div', { key: 'p', style: { display: 'flex', alignSelf: 'flex-start', marginTop: 20, fontSize: 22, fontWeight: 800, color: '#0b0f1a', background: ACC, borderRadius: 999, padding: '12px 26px' } }, 'Play free'),
  ]),
  T('mindloftdaily.com', { position: 'absolute', right: 56, bottom: 36, fontSize: 22, fontWeight: 700, color: '#8b95a8' }),
]);
const res = new ImageResponse(el, { width: 1200, height: 630, fonts: [600, 700, 800].map(w => ({ name: 'M', data: font(w), weight: w, style: 'normal' })) });
fs.writeFileSync(process.env.OUT || 'public/og/fortune-500-hq-states.png', Buffer.from(await res.arrayBuffer()));
console.log('ok', H);
