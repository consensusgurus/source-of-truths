import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { PRICE_KEYS, PRICE_GAMES, runRankOf, runTierOf } from '@/lib/price-games';

// PRICE CHECK'S SHARE CARD (owner, 2026-10-01: "it needs a great share card").
// A result card carries the player's payment card from the run's ending: the
// Shoppers ladder, prepaid up to black (RUN_RANKS in lib/price-games).
// One route draws both: with no ?s it is the invite (the five tags, every
// price a row of question marks), and with ?s=8-10-6-5-5 it is a result,
// the run's own departures board with each tag's points and the total. It
// never carries a price, so a shared card cannot spoil the day.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const MONO = 'DM Mono';
const GROUND = '#0b0f1a';

function flap(ch, big) {
  const w = big ? 56 : 36, hgt = big ? 78 : 50, fs = big ? 56 : 34;
  return h('div', { style: { width: w, height: hgt, borderRadius: 7, background: '#1a2133', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: MONO, fontSize: fs, color: ch === '?' ? '#64748b' : '#f8fafc' } },
    ch,
    h('div', { style: { position: 'absolute', left: 0, right: 0, top: hgt / 2, height: 2, background: '#05070d' } }));
}


// The run's payment card, one face per Shoppers tier (sharpest first).
const PAY = [
  { bg: 'linear-gradient(140deg, #2b2b30 0%, #0c0c0f 60%, #1e1e23 100%)', ink: '#e9cf7f' },
  { bg: 'linear-gradient(135deg, #ffe9a8 0%, #e6b532 45%, #a97a10 100%)', ink: '#2a1f04' },
  { bg: 'linear-gradient(135deg, #5b8ff0 0%, #2f6fe4 40%, #163a8c 100%)', ink: '#ffffff' },
  { bg: 'linear-gradient(160deg, #4b5a6e 0%, #36424f 100%)', ink: '#e7edf4' },
  { bg: '#fbfaf6', ink: '#22252b' },
];
function payCard(ti, rank, total, max) {
  const f = PAY[ti];
  const prepaid = ti === PAY.length - 1;
  const chip = h('div', { style: { display: 'flex', width: 46, height: 36, borderRadius: 7, background: ti >= 3 ? 'linear-gradient(135deg, #eef0f4 0%, #a7adb8 55%, #dfe2e8 100%)' : 'linear-gradient(135deg, #f6dc8a 0%, #c9a227 55%, #f2d272 100%)' } });
  return h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 380, height: 240, borderRadius: 20, background: f.bg, color: f.ink, padding: prepaid ? '34px 24px 20px' : '20px 24px', position: 'relative', overflow: 'hidden', transform: 'rotate(-4deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' } },
    prepaid ? h('div', { style: { display: 'flex', position: 'absolute', left: 0, right: 0, top: 0, height: 22, background: 'linear-gradient(90deg, #ff6b3d 0%, #ffb02e 25%, #28c08a 50%, #3d8bff 75%, #c560ff 100%)' } }) : null,
    h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' } },
      h('div', { style: { display: 'flex' } }, 'Mind Loft'),
      h('div', { style: { display: 'flex', color: prepaid ? '#e2522a' : f.ink } }, rank[3])),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 14 } }, chip,
      prepaid ? h('div', { style: { display: 'flex', flexDirection: 'column', fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#6b7280' } }, 'BALANCE', h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 22, letterSpacing: 0, color: '#dc2626' } }, '$0.00')) : null),
    h('div', { style: { display: 'flex', fontSize: 32, fontWeight: 800, letterSpacing: -1 } }, rank[1]),
    h('div', { style: { display: 'flex', alignItems: 'baseline', fontFamily: MONO, fontSize: 26 } }, String(total), h('span', { style: { fontSize: 15, opacity: 0.7, marginLeft: 6 } }, `/ ${max}`)));
}

function card(scores) {
  const res = Array.isArray(scores);
  const total = res ? scores.reduce((a, b) => a + b, 0) : null;
  const max = PRICE_KEYS.length * 10;
  const rank = res ? runRankOf(Math.round(total * 50 / max)) : null;
  const rows = PRICE_KEYS.map((k, i) => {
    const g = PRICE_GAMES[k];
    const v = res ? String(scores[i] ?? 0).padStart(2, '0') : '??';
    return h('div', { key: k, style: { display: 'flex', alignItems: 'center', gap: 18, padding: '5px 0' } },
      h('div', { style: { display: 'flex', width: 170, padding: '6px 14px 6px 22px', borderRadius: '7px 10px 10px 7px', background: g.tagDark, color: GROUND, fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: 1, textTransform: 'uppercase' } }, g.name),
      h('div', { style: { display: 'flex', flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#cbd5e1' } }, g.word),
      h('div', { style: { display: 'flex', gap: 5 } }, flap(v[0]), flap(v[1])));
  });
  const totalDigits = res ? String(total).padStart(2, '0') : '??';
  return h('div', { style: { width: 1200, height: 630, display: 'flex', background: GROUND, padding: '46px 56px', fontFamily: SANS, color: '#f1f5f9' } },
    h('div', { style: { display: 'flex', flexDirection: 'column', width: 490, paddingRight: 30 } },
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: '#8b95a8', textTransform: 'uppercase' } }, 'Mind Loft · Daily run'),
      h('div', { style: { display: 'flex', flexDirection: 'column', fontSize: res ? 72 : 92, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, marginTop: 18 } }, h('span', null, 'Price'), h('span', null, 'Check')),
      res
        ? h('div', { style: { display: 'flex', marginTop: 26, paddingLeft: 6 } }, payCard(runTierOf(Math.round(total * 50 / max)), rank, total, max))
        : h('div', { style: { display: 'flex', flexDirection: 'column', marginTop: 26 } },
          h('div', { style: { display: 'flex', fontSize: 30, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.3 } }, 'Five real price tags, from pocket change to the auction block.'),
          h('div', { style: { display: 'flex', marginTop: 14, fontSize: 24, fontWeight: 700, color: '#8b95a8' } }, 'Five guesses each, one score out of 50.')),
      h('div', { style: { display: 'flex', marginTop: 'auto', alignItems: 'center', gap: 16 } },
        h('div', { style: { display: 'flex', padding: '14px 26px', borderRadius: 14, background: '#7dd3fc', color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 } }, 'Play free'),
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 17, color: '#cbd5e1', whiteSpace: 'nowrap' } }, 'mindloftdaily.com/pricecheck'))),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: '#05070d', borderRadius: 22, padding: '22px 26px', border: '1px solid rgba(255,255,255,0.08)' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: '#64748b', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 6 } }, h('span', null, 'ITEM'), h('span', null, 'POINTS')),
      ...rows,
      h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,0.14)' } },
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: '#64748b' } }, 'TOTAL'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } }, flap(totalDigits[0], true), flap(totalDigits[1], true),
          h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 40, color: '#475569', margin: '0 6px' } }, '/'), flap('5', true), flap('0', true)))));
}

export async function GET(req) {
  try {
    const s = new URL(req.url).searchParams.get('s') || '';
    const scores = /^\d{1,2}(-\d{1,2}){1,4}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(10, Number(x)))) : null;
    return new ImageResponse(card(scores), { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('pricecheck card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/daily.png' } });
  }
}
