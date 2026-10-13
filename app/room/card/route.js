import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { ROOM_MAX, ROOM_PART, ROOM_LADDER, roomTierOf } from '@/lib/read-room';

// READ THE ROOM'S SHARE CARD, on the Judged and Dojo pattern: one route draws
// both. With no ?s it is the invite: what a Mind Reader is, and the party's six
// places rising toward it. With ?s=64-81-71&t=72&d=2026-10-13 (the share of
// each room out-read, the total read, the day) it is THE LADDER: every place
// at the party, yours filled, the one just above outlined in gold with how
// short you came. Each place carries what kind of room reader it is. The card
// names no prompt and no answer, so a shared card cannot spoil tonight's crowd.
// Every figure is Manrope, like the site.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const GROUND = '#0b0f1a';
const GOLD = '#e9cf7f';
const LT = '#a5b4fc';
const ACC = '#4338ca';
const MUTE = '#8b95a8';
const DIM = '#64748b';
const OFF = '#2a3150';
const NAMES = ['Outwit', 'Outrank', 'Feud'];
const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

// One small person: a head over shoulders.
function person(color, size) {
  return d({ flexDirection: 'column', alignItems: 'center', width: size, flexShrink: 0 },
    d({ width: Math.round(size * 0.48), height: Math.round(size * 0.48), borderRadius: size, background: color }),
    d({ width: size, height: Math.round(size * 0.62), marginTop: Math.round(size * 0.08), borderTopLeftRadius: size, borderTopRightRadius: size, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, background: color }));
}

// A place's glyph: five people, as many facing you as the place out-reads.
// Mind Reader lights all five, Wrong Party none.
function crowd(i, mine, size = 13) {
  const lit = ROOM_LADDER.length - 1 - i;
  const on = mine ? GOLD : LT;
  return d({ gap: 4, alignItems: 'flex-end', flexShrink: 0 },
    ...Array.from({ length: 5 }, (_, k) => person(k < lit ? on : OFF, size)));
}

function cta() {
  return d({ marginTop: 'auto', alignItems: 'center', gap: 16 },
    d({ padding: '14px 26px', borderRadius: 14, background: LT, color: '#14123a', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }, 'Play free'),
    d({ fontSize: 18, fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap' }, 'mindloftdaily.com/room'));
}

function eyebrow(text) {
  return d({ fontSize: 17, fontWeight: 800, letterSpacing: 4, color: MUTE, textTransform: 'uppercase' }, text);
}

function rung(t, i, me, upGap) {
  const mine = i === me;
  const up = i === me - 1;
  const above = i < me - 1;
  const row = { alignItems: 'center', gap: 16, padding: '7px 14px', borderRadius: 12, border: '2px solid transparent' };
  if (mine) Object.assign(row, { background: 'rgba(165,180,252,0.12)', border: `2px solid ${GOLD}` });
  else if (up) Object.assign(row, { border: `2px dashed ${GOLD}` });
  else if (above) Object.assign(row, { opacity: 0.4 });
  else Object.assign(row, { background: 'rgba(255,255,255,0.04)' });
  const ink = mine ? '#ffffff' : up ? GOLD : above ? '#e9edf4' : '#94a3b8';
  const tag = mine
    ? d({ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GROUND, background: GOLD, padding: '4px 9px', borderRadius: 6, flexShrink: 0 }, 'YOU')
    : up
      ? d({ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GOLD, flexShrink: 0 }, `${upGap} SHORT`)
      : null;
  return d(row,
    d({ width: 30, fontSize: 16, fontWeight: 800, color: mine || up ? GOLD : DIM, flexShrink: 0 }, String(t[0])),
    crowd(i, mine),
    d({ flexDirection: 'column', flex: 1 },
      d({ fontSize: 20, fontWeight: 800, color: ink, lineHeight: 1.1 }, t[1]),
      d({ fontSize: 13.5, fontWeight: 700, color: mine ? '#c7d2fe' : DIM, marginTop: 2 }, t[2])),
    tag);
}

function result(pcts, total) {
  const me = roomTierOf(total);
  const t = ROOM_LADDER[me];
  const upGap = me > 0 ? Math.max(1, ROOM_LADDER[me - 1][0] - total) : 0;
  return d({ width: 1200, height: 630, background: GROUND, padding: '44px 50px', fontFamily: SANS, color: '#f1f5f9', gap: 36 },
    d({ flexDirection: 'column', width: 470 },
      eyebrow('Mind Loft · Read the Room'),
      d({ fontSize: 18, fontWeight: 800, letterSpacing: 3, color: LT, textTransform: 'uppercase', marginTop: 34 }, 'At the party I was'),
      d({ fontSize: t[1].length > 14 ? 54 : 62, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1.5, marginTop: 10 }, t[1]),
      d({ fontSize: 21, fontWeight: 700, color: GOLD, marginTop: 12, lineHeight: 1.3 }, `${t[2]}.`),
      d({ alignItems: 'baseline', gap: 18, marginTop: 26 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 66, fontWeight: 800, letterSpacing: -2, color: '#ffffff', lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: DIM }, `/${ROOM_MAX}`)),
        d({ fontSize: 16, fontWeight: 800, letterSpacing: 2, color: MUTE, textTransform: 'uppercase' }, `Out-read ${total}% of the room`)),
      d({ gap: 8, marginTop: 14 },
        ...pcts.map((p, i) => d({ padding: '6px 11px', borderRadius: 8, background: 'rgba(165,180,252,0.12)', fontSize: 15, fontWeight: 800, color: '#dfe3ff' }, `${NAMES[i]} ${p}%`))),
      cta()),
    d({ flexDirection: 'column', flex: 1, gap: 6, justifyContent: 'center' },
      ...ROOM_LADDER.map((x, i) => rung(x, i, me, upGap))));
}

function invite() {
  const rising = ROOM_LADDER.slice().reverse();
  const top = ROOM_LADDER[0];
  return d({ width: 1200, height: 630, background: GROUND, padding: '48px 54px', fontFamily: SANS, color: '#f1f5f9', gap: 44 },
    d({ flexDirection: 'column', flex: 1 },
      eyebrow('Mind Loft · Read the Room · Daily run'),
      d({ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 34 }, 'Can you read the room?'),
      d({ fontSize: 22, fontWeight: 700, color: '#cbd5e1', marginTop: 18, lineHeight: 1.35 }, 'Three crowd games with no answer key: dodge the herd, call its order, say what it said.'),
      d({ flexDirection: 'column', marginTop: 24, padding: '16px 20px', borderRadius: 14, border: `2px solid ${GOLD}`, background: 'rgba(233,207,127,0.07)' },
        d({ fontSize: 15, fontWeight: 800, letterSpacing: 3, color: GOLD, textTransform: 'uppercase' }, `${top[1]} · ${top[0]}+`),
        d({ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginTop: 6, lineHeight: 1.35 }, 'Knows what the crowd will say before it says it, and which way the herd will run.')),
      cta()),
    d({ width: 390, flexDirection: 'column', justifyContent: 'center', gap: 12 },
      ...rising.map((x, j) => {
        const i = ROOM_LADDER.length - 1 - j;
        const isTop = i === 0;
        return d({ alignItems: 'center', gap: 14, marginLeft: (rising.length - 1 - j) * 12 },
          crowd(i, isTop, 16),
          d({ fontSize: 18, fontWeight: 800, color: isTop ? GOLD : '#94a3b8' }, x[1]));
      })));
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const pcts = /^\d{1,3}(-\d{1,3}){2}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(100, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const fromParts = pcts ? Math.round(pcts.reduce((a, p) => a + (ROOM_PART * p) / 100, 0)) : null;
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= ROOM_MAX ? Math.round(tq) : fromParts;
    const el = pcts ? result(pcts, tot) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('room card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
