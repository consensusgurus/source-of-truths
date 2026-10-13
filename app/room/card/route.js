import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { ROOM_MAX, ROOM_PART, ROOM_LADDER, roomTierOf } from '@/lib/read-room';

// READ THE ROOM'S SHARE CARD, on Judged's pattern: one route draws both. With
// no ?s it is the invite: a room of a hundred figures filling up. With
// ?s=64-81-71&t=72&d=2026-10-13 (the share of each room out-read, the total
// read, the day) it is the verdict: your place at the party and a room with
// the share you out-read lit, you in gold. It names no prompt and no answer,
// so a shared card cannot spoil tonight's crowd. Every figure is Manrope.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const GROUND = '#0b0f1a';
const PANEL = '#121828';
const ACC = '#4338ca';
const LT = '#a5b4fc';
const GOLD = '#e8b43a';
const DIM = '#262d4a';
const NAMES = ['Outwit', 'Outrank', 'Feud'];
const CHIPS = ['#1d2552', '#2e33a3', '#24296d'];
const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

function figure(color, key) {
  return h('div', { key, style: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, height: 30 } },
    d({ width: 11, height: 11, borderRadius: 6, background: color }),
    d({ width: 20, height: 16, marginTop: 2, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, background: color }));
}

function room(lit) {
  const ME = 44;
  const kids = [];
  for (let i = 0; i < 100; i++) {
    if (i === ME) { kids.push(figure(GOLD, i)); continue; }
    const hsh = (i * 61 + 7) % 101;
    kids.push(figure(lit != null && hsh < lit ? LT : DIM, i));
  }
  return d({ flexWrap: 'wrap', width: 360, rowGap: 14, columnGap: 9, padding: 28, borderRadius: 20, background: PANEL, justifyContent: 'center' }, ...kids);
}

function cta() {
  return d({ alignItems: 'center', gap: 16 },
    d({ padding: '14px 26px', borderRadius: 14, background: ACC, color: '#ffffff', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }, 'Play free'),
    d({ fontSize: 18, fontWeight: 700, color: LT, whiteSpace: 'nowrap' }, 'mindloftdaily.com/room'));
}

function dayLabel(iso) {
  try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}

function result(pcts, total, day) {
  const L = ROOM_LADDER[roomTierOf(total)];
  const nf = L[1].length > 14 ? 66 : 76;
  return d({ width: 1200, height: 630, background: GROUND, fontFamily: SANS, color: '#e9edf4' },
    d({ flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '54px 56px' },
      d({ flexDirection: 'column', gap: 10 },
        d({ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: LT, textTransform: 'uppercase' }, `Read the Room · ${dayLabel(day)}`),
        d({ fontSize: nf, fontWeight: 800, lineHeight: 0.98, letterSpacing: -2 }, L[1]),
        d({ fontSize: 26, fontWeight: 700, color: '#c9d4ea' }, `Out-read ${total}% of the room · ${total}/${ROOM_MAX}`)),
      d({ gap: 12 }, ...pcts.map((p, i) => d({ padding: '12px 18px', borderRadius: 12, background: CHIPS[i], fontSize: 20, fontWeight: 800 }, `${NAMES[i]} ${p}%`))),
      cta()),
    d({ width: 470, background: ACC, alignItems: 'center', justifyContent: 'center' }, room(total)));
}

function invite() {
  return d({ width: 1200, height: 630, background: GROUND, fontFamily: SANS, color: '#e9edf4' },
    d({ flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '54px 56px' },
      d({ flexDirection: 'column', gap: 14 },
        d({ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: LT, textTransform: 'uppercase' }, 'Mind Loft · Daily run'),
        d({ fontSize: 76, fontWeight: 800, lineHeight: 0.98, letterSpacing: -2 }, 'Read the Room'),
        d({ fontSize: 26, fontWeight: 700, color: '#c9d4ea', lineHeight: 1.3 }, 'Three crowd games. No answer key. How well do you read tonight’s players?')),
      d({ gap: 12 }, ...NAMES.map((n, i) => d({ padding: '12px 18px', borderRadius: 12, background: CHIPS[i], fontSize: 20, fontWeight: 800 }, n))),
      cta()),
    d({ width: 470, background: ACC, alignItems: 'center', justifyContent: 'center' }, room(null)));
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
    const dq = q.get('d') || '';
    const day = /^\d{4}-\d{2}-\d{2}$/.test(dq) ? dq : new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const el = pcts ? result(pcts, tot, day) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('room card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
