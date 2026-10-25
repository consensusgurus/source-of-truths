import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag, shortTag } from '@/lib/og-run-card';
import { ROOM_MAX, ROOM_LADDER, roomTierOf } from '@/lib/read-room';

// READ THE ROOM'S SHARE CARD, on the Judged and Dojo pattern: one route draws
// both. With no ?s it is the invite: what a Mind Reader is, and the party's six
// places rising toward it. With ?s=64-81-71&t=72&d=2026-10-13 (the share of
// each room out-read, the total read, the day) it is THE LADDER: every place
// at the party, yours filled, the one just above outlined in gold with how
// short you came. Each place carries what kind of room reader it is. The card
// names no prompt and no answer, so a shared card cannot spoil tonight's crowd.
// Every figure is Manrope, like the site.
export const runtime = 'nodejs';

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// party sits on the Crowd Psychology pastel. Lit people are ink, unlit white.
const CAT = 'Crowd Psychology';
const URL_TXT = 'mindloftdaily.com/room';
// Three shares are a day before Herd joined (2026-10-17); four open with Herd.
const NAMES3 = ['Outwit', 'Outrank', 'Feud'];
const NAMES4 = ['Herd', 'Outwit', 'Outrank', 'Feud'];

function person(color, size) {
  return d({ flexDirection: 'column', alignItems: 'center', width: size, flexShrink: 0 },
    d({ width: Math.round(size * 0.48), height: Math.round(size * 0.48), borderRadius: size, background: color }),
    d({ width: size, height: Math.round(size * 0.62), marginTop: Math.round(size * 0.08), borderTopLeftRadius: size, borderTopRightRadius: size, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, background: color }));
}

// A place's glyph: five people, as many lit as the place out-reads.
function crowd(i, size = 13, off = '#ffffff') {
  const lit = ROOM_LADDER.length - 1 - i;
  return d({ gap: 4, alignItems: 'flex-end', flexShrink: 0 },
    ...Array.from({ length: 5 }, (_, k) => person(k < lit ? W.ink : off, size)));
}

function rung(t, i, me, upGap) {
  const state = i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 14, padding: '6px 14px', borderRadius: 12, ...L.row },
    d({ width: 30, fontSize: 16, fontWeight: 800, color: L.num, flexShrink: 0 }, String(t[0])),
    crowd(i, 13, state === 'mine' ? '#dfe3ea' : '#ffffff'),
    d({ flexDirection: 'column', flex: 1 },
      d({ fontSize: 20, fontWeight: 800, color: L.ink, lineHeight: 1.1 }, t[1]),
      d({ fontSize: 13, fontWeight: 700, color: W.ink2, marginTop: 1, lineHeight: 1.2 }, t[2])),
    state === 'mine' ? youTag() : state === 'up' ? shortTag(upGap) : null);
}

function result(pcts, total) {
  const me = roomTierOf(total);
  const t = ROOM_LADDER[me];
  const upGap = me > 0 ? Math.max(1, ROOM_LADDER[me - 1][0] - total) : 0;
  return frame({
    cat: CAT, url: URL_TXT, rightW: 590,
    left: [
      chip('Read the Room · Result', CAT),
      label('At the party I was', { marginTop: 26 }),
      d({ fontSize: t[1].length > 14 ? 52 : 60, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1.5, marginTop: 6 }, t[1]),
      d({ fontSize: 21, fontWeight: 700, color: W.ink2, marginTop: 10, lineHeight: 1.3 }, `${t[2]}.`),
      d({ alignItems: 'baseline', gap: 16, marginTop: 20 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 62, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, String(total)),
          d({ fontSize: 28, fontWeight: 800, color: W.mute }, `/${ROOM_MAX}`)),
        d({ fontSize: 18, fontWeight: 700, color: W.ink2 }, `Out-read ${total}% of the room`)),
      d({ gap: 8, marginTop: 12, flexWrap: 'wrap' },
        ...pcts.map((p, i) => d({ padding: '6px 12px', borderRadius: 999, background: '#f1f3f6', fontSize: 15, fontWeight: 800, color: W.ink }, `${(pcts.length === 4 ? NAMES4 : NAMES3)[i]} ${p}%`))),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 5 }, ...ROOM_LADDER.map((x, i) => rung(x, i, me, upGap))),
  });
}

function invite() {
  const rising = ROOM_LADDER.slice().reverse();
  const top = ROOM_LADDER[0];
  return frame({
    cat: CAT, url: URL_TXT, rightW: 430, rightPad: '22px 30px',
    left: [
      chip('Read the Room · Daily Run', CAT),
      d({ fontSize: 52, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 22 }, 'Can you read the room?'),
      d({ fontSize: 21, fontWeight: 600, color: W.ink2, marginTop: 10, lineHeight: 1.35 }, 'Four crowd games with no answer key: run with the herd, dodge it, call its order, say what it said.'),
      d({ flexDirection: 'column', marginTop: 14, marginBottom: 18, padding: '12px 16px', borderRadius: 16, border: `2px solid ${W.ink}` },
        d({ fontSize: 17, fontWeight: 800 }, `${top[1]} · ${top[0]}+`),
        d({ fontSize: 19, fontWeight: 600, color: W.ink2, marginTop: 4, lineHeight: 1.35 }, 'Knows what the crowd will say before it says it, and which way the herd will run.')),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 12 },
      ...rising.map((x, j) => {
        const i = ROOM_LADDER.length - 1 - j;
        return d({ alignItems: 'center', gap: 14, marginLeft: (rising.length - 1 - j) * 10 },
          crowd(i, 16),
          d({ fontSize: 18, fontWeight: 800, color: i === 0 ? W.ink : W.ink2 }, x[1]));
      })),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const pcts = /^\d{1,3}(-\d{1,3}){2,3}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(100, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const fromParts = pcts ? Math.round(pcts.reduce((a, p) => a + ((ROOM_MAX / pcts.length) * p) / 100, 0)) : null;
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= ROOM_MAX ? Math.round(tq) : fromParts;
    const el = pcts ? result(pcts, tot) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('room card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
