import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { CROSSED_MAX, CROSSED_BELTS, crossedTierOf, crossedDayTag, crossedInkOn } from '@/lib/crossed';

// CROSSED'S SHARE CARD: one route draws both, in Crossed Up's own mark, THE
// WEEK (app/crossed/Week.jsx): seven squares MON to PEN, inked up to a rank.
// With no ?s it is the invite: the week filling in, one row a rank. With
// ?s=12-28-20-18&t=78&d=2026-10-20 (each puzzle's points, the total, the day)
// it is THE LADDER: every rank, yours filled, the next one up outlined in gold
// with how short you came. It names no letter, so a shared card spoils nothing.
// Every figure is Manrope, like the site.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const GROUND = '#0b0f1a';
const GOLD = '#e9cf7f';
const SKY = '#7dd3fc';
const MUTE = '#8b95a8';
const DIM = '#64748b';
const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

const LOW = CROSSED_BELTS.length - 1;
// The week as squares, inked up to rank ti. `me` circles that square in red.
function week(ti, size, me = true) {
  const cells = [];
  for (let i = LOW; i >= 0; i--) {
    const on = i >= ti;
    const t = CROSSED_BELTS[i];
    cells.push(d({ ...(i === LOW ? {} : { borderLeft: '1px solid rgba(233,237,244,0.3)' }), position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center', background: on ? t[3] : 'rgba(255,255,255,0.03)', fontSize: Math.round(size * 0.29), fontWeight: 800, color: on ? (i === 0 ? GOLD : crossedInkOn(t[3])) : 'rgba(233,237,244,0.32)' },
      crossedDayTag(i),
      me && i === ti ? d({ position: 'absolute', left: -Math.round(size * 0.16), top: -Math.round(size * 0.16), width: Math.round(size * 1.32), height: Math.round(size * 1.32), border: '3px solid #ef4444', borderRadius: 999, transform: 'rotate(-9deg)' }) : null));
  }
  return d({ border: '2px solid rgba(233,237,244,0.75)', borderRadius: 3, flexShrink: 0 }, ...cells);
}
function tagCell(t, i) {
  return d({ width: 58, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: t[3], border: '1.5px solid rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 800, color: i === 0 ? GOLD : crossedInkOn(t[3]), flexShrink: 0 }, crossedDayTag(i));
}

function cta() {
  return d({ marginTop: 'auto', alignItems: 'center', gap: 16 },
    d({ padding: '14px 26px', borderRadius: 14, background: SKY, color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }, 'Play free'),
    d({ fontSize: 18, fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap' }, 'mindloftdaily.com/crossed'));
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
    tagCell(t, i),
    d({ flex: 1, fontSize: 21, fontWeight: 800, color: ink }, t[1]),
    tag);
}

function result(parts, total) {
  const me = crossedTierOf(total);
  const t = CROSSED_BELTS[me];
  const upGap = me > 0 ? Math.max(1, CROSSED_BELTS[me - 1][0] - total) : 0;
  return d({ width: 1200, height: 630, background: GROUND, padding: '44px 50px', fontFamily: SANS, color: '#f1f5f9', gap: 40 },
    d({ flexDirection: 'column', width: 480 },
      eyebrow('Mind Loft · Crossed Up'),
      d({ fontSize: 18, fontWeight: 800, letterSpacing: 3, color: SKY, textTransform: 'uppercase', marginTop: 40 }, 'Ranked as a'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 10 }, t[1]),
      d({ marginTop: 24, paddingLeft: 6 }, week(me, 52)),
      d({ alignItems: 'baseline', gap: 22, marginTop: 30 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 66, fontWeight: 800, letterSpacing: -2, color: '#ffffff', lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: DIM }, `/${CROSSED_MAX}`)),
        parts ? d({ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: MUTE }, parts.join(' · ')) : null),
      cta()),
    d({ flexDirection: 'column', flex: 1, gap: 6, justifyContent: 'center' },
      ...CROSSED_BELTS.map((x, i) => rung(x, i, me, upGap))));
}

function invite() {
  const rising = CROSSED_BELTS.slice().reverse();
  return d({ width: 1200, height: 630, background: GROUND, padding: '48px 54px', fontFamily: SANS, color: '#f1f5f9', gap: 50 },
    d({ flexDirection: 'column', flex: 1 },
      eyebrow('Mind Loft · Crossed Up · Daily run'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 36 }, 'Which day could you solve?'),
      d({ fontSize: 22, fontWeight: 700, color: '#cbd5e1', marginTop: 18 }, 'Four crosswords: the mini, the big one, three acrostics, a clueless grid. Fast enough and you solve in pen.'),
      cta()),
    d({ width: 400, flexDirection: 'column', justifyContent: 'center', gap: 10 },
      ...rising.map((x, i) => d({ alignItems: 'center', gap: 14 },
        week(LOW - i, 30, false),
        d({ fontSize: 15, fontWeight: 800, color: i === rising.length - 1 ? GOLD : '#94a3b8' }, x[2])))));
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){3}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(40, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= CROSSED_MAX ? Math.round(tq) : null;
    const el = parts ? result(parts, tot != null ? tot : parts.reduce((a, b) => a + b, 0)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('crossed card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/emcee.png' } });
  }
}
