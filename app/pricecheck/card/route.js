import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { PRICE_KEYS, PRICE_GAMES, runRankOf } from '@/lib/price-games';

// PRICE CHECK'S SHARE CARD (owner, 2026-10-01: "it needs a great share card").
// One route draws both: with no ?s it is the invite (the five tags, every
// price a row of question marks), and with ?s=8-10-6-5-5 it is a result,
// the run's own departures board with each tag's points and the total. It
// never carries a price, so a shared card cannot spoil the day.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const MONO = 'DM Mono';
const GROUND = '#0b0f1a';

function flap(ch, big) {
  const w = big ? 70 : 44, hgt = big ? 100 : 62, fs = big ? 72 : 44;
  return h('div', { style: { width: w, height: hgt, borderRadius: 7, background: '#1a2133', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: MONO, fontSize: fs, color: ch === '?' ? '#64748b' : '#f8fafc' } },
    ch,
    h('div', { style: { position: 'absolute', left: 0, right: 0, top: hgt / 2, height: 2, background: '#05070d' } }));
}

function card(scores) {
  const res = Array.isArray(scores);
  const total = res ? scores.reduce((a, b) => a + b, 0) : null;
  const max = PRICE_KEYS.length * 10;
  const rank = res ? runRankOf(Math.round(total * 50 / max)) : null;
  const rows = PRICE_KEYS.map((k, i) => {
    const g = PRICE_GAMES[k];
    const v = res ? String(scores[i] ?? 0).padStart(2, '0') : '??';
    return h('div', { key: k, style: { display: 'flex', alignItems: 'center', gap: 18, padding: '7px 0' } },
      h('div', { style: { display: 'flex', width: 170, padding: '8px 14px 8px 22px', borderRadius: '7px 10px 10px 7px', background: g.tagDark, color: GROUND, fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 1, textTransform: 'uppercase' } }, g.name),
      h('div', { style: { display: 'flex', flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#cbd5e1' } }, g.word),
      h('div', { style: { display: 'flex', gap: 5 } }, flap(v[0]), flap(v[1])));
  });
  const totalDigits = res ? String(total).padStart(2, '0') : '??';
  return h('div', { style: { width: 1200, height: 630, display: 'flex', background: GROUND, padding: '46px 56px', fontFamily: SANS, color: '#f1f5f9' } },
    h('div', { style: { display: 'flex', flexDirection: 'column', width: 470, paddingRight: 34 } },
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: '#8b95a8', textTransform: 'uppercase' } }, 'Mind Loft · Daily run'),
      h('div', { style: { display: 'flex', flexDirection: 'column', fontSize: 92, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, marginTop: 18 } }, h('span', null, 'Price'), h('span', null, 'Check')),
      res
        ? h('div', { style: { display: 'flex', flexDirection: 'column', marginTop: 26 } },
          h('div', { style: { display: 'flex', alignSelf: 'flex-start', padding: '8px 22px', border: '5px solid #fbbf24', borderRadius: 12, color: '#fbbf24', fontSize: 52, fontWeight: 800, letterSpacing: 6, transform: 'rotate(-4deg)' } }, 'SOLD'),
          h('div', { style: { display: 'flex', marginTop: 18, fontSize: 30, fontWeight: 800 } }, `${rank[1]} · ${total} of ${max}`),
          h('div', { style: { display: 'flex', marginTop: 8, fontSize: 24, fontWeight: 700, color: '#8b95a8' } }, 'Can you price it closer?'))
        : h('div', { style: { display: 'flex', flexDirection: 'column', marginTop: 26 } },
          h('div', { style: { display: 'flex', fontSize: 30, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.3 } }, 'Five real price tags, from pocket change to the auction block.'),
          h('div', { style: { display: 'flex', marginTop: 14, fontSize: 24, fontWeight: 700, color: '#8b95a8' } }, 'Five guesses at each. One score out of 50.')),
      h('div', { style: { display: 'flex', marginTop: 'auto', alignItems: 'center', gap: 16 } },
        h('div', { style: { display: 'flex', padding: '14px 26px', borderRadius: 14, background: '#fbbf24', color: '#1f1300', fontSize: 26, fontWeight: 800 } }, 'Play free'),
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 22, color: '#cbd5e1' } }, 'mindloftdaily.com/pricecheck'))),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: '#05070d', borderRadius: 22, padding: '22px 26px', border: '1px solid rgba(255,255,255,0.08)' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 16, letterSpacing: 4, color: '#64748b', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 6 } }, h('span', null, 'ITEM'), h('span', null, 'POINTS')),
      ...rows,
      h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14, borderTop: '1px dashed rgba(255,255,255,0.14)' } },
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
