import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { DOJO_MAX, DOJO_BELTS, dojoTierOf } from '@/lib/dojo';

// ENTER THE DOJO'S SHARE CARD, on Judged's pattern: one route draws both. With
// no ?s it is the invite: the eight belts rising from white to black. With
// ?s=27-30-25&t=82&d=2026-10-12 (each grid's points, the total, the day) it is
// THE LADDER: every belt, yours filled, the next one up outlined in gold with
// how short you came. It names no digit, so a shared card cannot spoil a grid.
// Every figure is Manrope, like the site.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const GROUND = '#0b0f1a';
const GOLD = '#e9cf7f';
const SKY = '#7dd3fc';
const MUTE = '#8b95a8';
const DIM = '#64748b';
const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

function beltBar(t, w, hgt) {
  return d({ position: 'relative', width: w, height: hgt, borderRadius: 4, background: t[3], border: '1.5px solid rgba(255,255,255,0.28)', flexShrink: 0 },
    d({ position: 'absolute', right: Math.round(w * 0.12), top: 0, bottom: 0, width: Math.max(6, Math.round(w * 0.1)), background: t[4] }));
}

function cta() {
  return d({ marginTop: 'auto', alignItems: 'center', gap: 16 },
    d({ padding: '14px 26px', borderRadius: 14, background: SKY, color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }, 'Play free'),
    d({ fontSize: 18, fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap' }, 'mindloftdaily.com/dojo'));
}

function eyebrow(text) {
  return d({ fontSize: 17, fontWeight: 800, letterSpacing: 4, color: MUTE, textTransform: 'uppercase' }, text);
}

function rung(t, i, me, upGap) {
  const mine = i === me;
  const up = i === me - 1;
  const above = i < me - 1;
  const row = { alignItems: 'center', gap: 16, padding: '8px 14px', borderRadius: 12, border: '2px solid transparent' };
  if (mine) Object.assign(row, { background: 'rgba(255,255,255,0.10)', border: `2px solid ${GOLD}` });
  else if (up) Object.assign(row, { border: `2px dashed ${GOLD}` });
  else if (above) Object.assign(row, { opacity: 0.38 });
  else Object.assign(row, { background: 'rgba(255,255,255,0.04)' });
  const ink = mine ? '#ffffff' : up ? GOLD : above ? '#e9edf4' : '#94a3b8';
  const tag = mine
    ? d({ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GROUND, background: GOLD, padding: '4px 9px', borderRadius: 6, flexShrink: 0 }, 'YOU')
    : up
      ? d({ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GOLD, flexShrink: 0 }, `${upGap} SHORT`)
      : null;
  return d(row,
    d({ width: 34, fontSize: 17, fontWeight: 800, color: mine ? GOLD : up ? GOLD : DIM, flexShrink: 0 }, String(t[0])),
    beltBar(t, 74, 18),
    d({ flex: 1, fontSize: 21, fontWeight: 800, color: ink }, t[1]),
    tag);
}

function result(parts, total) {
  const me = dojoTierOf(total);
  const t = DOJO_BELTS[me];
  const upGap = me > 0 ? Math.max(1, DOJO_BELTS[me - 1][0] - total) : 0;
  return d({ width: 1200, height: 630, background: GROUND, padding: '44px 50px', fontFamily: SANS, color: '#f1f5f9', gap: 40 },
    d({ flexDirection: 'column', width: 480 },
      eyebrow('Mind Loft · Enter the Dojo'),
      d({ fontSize: 18, fontWeight: 800, letterSpacing: 3, color: SKY, textTransform: 'uppercase', marginTop: 40 }, 'Tied on the'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 10 }, t[1]),
      d({ marginTop: 22 }, beltBar(t, 300, 40)),
      d({ alignItems: 'baseline', gap: 22, marginTop: 30 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 66, fontWeight: 800, letterSpacing: -2, color: '#ffffff', lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: DIM }, `/${DOJO_MAX}`)),
        parts ? d({ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: MUTE }, parts.join(' · ')) : null),
      cta()),
    d({ flexDirection: 'column', flex: 1, gap: 6, justifyContent: 'center' },
      ...DOJO_BELTS.map((x, i) => rung(x, i, me, upGap))));
}

function invite() {
  const rising = DOJO_BELTS.slice().reverse();
  return d({ width: 1200, height: 630, background: GROUND, padding: '48px 54px', fontFamily: SANS, color: '#f1f5f9', gap: 50 },
    d({ flexDirection: 'column', flex: 1 },
      eyebrow('Mind Loft · Enter the Dojo · Daily run'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 36 }, 'Which belt would you earn?'),
      d({ fontSize: 22, fontWeight: 700, color: '#cbd5e1', marginTop: 18 }, 'Three sudokus: a six by six, the classic, then a variant. Fast and clean ties on black.'),
      cta()),
    d({ width: 380, flexDirection: 'column', justifyContent: 'center', gap: 12 },
      ...rising.map((x, i) => d({ alignItems: 'center', gap: 14, marginLeft: (rising.length - 1 - i) * 10 },
        beltBar(x, 150 + i * 18, 22),
        d({ fontSize: 17, fontWeight: 800, color: i === rising.length - 1 ? GOLD : '#94a3b8' }, x[2])))));
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){2}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(40, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= DOJO_MAX ? Math.round(tq) : null;
    const el = parts ? result(parts, tot != null ? tot : parts.reduce((a, b) => a + b, 0)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('dojo card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/passport.png' } });
  }
}
