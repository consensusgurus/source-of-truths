import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { categoryColor } from '@/lib/category-ramp';
import { POLY_LEGS, POLY_TIERS, tierFor, tierRange, parseShare } from '@/lib/polymath';

// POLYMATH'S SHARE CARD (2026-10-19), on the Dojo card's pattern. With no ?s it
// is the invite: the six tiers rising. With ?s=75-65-70&t=70&d=... it is the
// result: the title, the score, each leg's points as a bar, and the ladder with
// the viewer's rung lit. It names no question, so it cannot spoil a run.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const GROUND = '#0b0f1a';
const SKY = '#7dd3fc';
const MUTE = '#8b95a8';
const DIM = '#64748b';
const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

function eyebrow(text) {
  return d({ fontSize: 17, fontWeight: 800, letterSpacing: 4, color: MUTE, textTransform: 'uppercase' }, text);
}

function cta() {
  return d({ marginTop: 'auto', alignItems: 'center', gap: 16 },
    d({ padding: '14px 26px', borderRadius: 14, background: SKY, color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }, 'Play free'),
    d({ fontSize: 18, fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap' }, 'mindloftdaily.com/polymath'));
}

function ladder(me) {
  return d({ flexDirection: 'column-reverse', gap: 8, width: 360, justifyContent: 'center' },
    ...POLY_TIERS.map((t, i) => {
      const mine = i === me;
      return d({ height: 52, borderRadius: 12, border: `2.5px solid ${t.colour}`, background: mine ? t.colour : 'rgba(255,255,255,0.03)', padding: '0 16px', alignItems: 'center', justifyContent: 'space-between' },
        d({ fontSize: 21, fontWeight: 800, color: mine ? '#0b0d12' : '#e9edf4' }, t.name),
        d({ fontSize: 15, fontWeight: 700, color: mine ? '#0b0d12' : '#94a3b8' }, tierRange(i)));
    }));
}

function result(points, score) {
  const t = tierFor(score);
  return d({ width: 1200, height: 630, background: GROUND, padding: '44px 50px', fontFamily: SANS, color: '#f1f5f9', gap: 44 },
    d({ flexDirection: 'column', flex: 1 },
      eyebrow('Mind Loft · Polymath'),
      d({ fontSize: 18, fontWeight: 800, letterSpacing: 3, color: SKY, textTransform: 'uppercase', marginTop: 30 }, 'Three gauntlets, one title'),
      d({ alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, gap: 20 },
        d({ fontSize: 70, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: t.colour }, t.name),
        d({ fontSize: 70, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: '#ffffff' }, String(score))),
      d({ flexDirection: 'column', gap: 14, marginTop: 26 },
        ...POLY_LEGS.map((l, i) => {
          const p = points[i];
          const hue = categoryColor(l.cat);
          return d({ alignItems: 'center', gap: 16 },
            d({ width: 110, fontSize: 19, fontWeight: 800, color: '#cbd5e1' }, l.short),
            d({ flex: 1, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
              d({ width: `${p == null ? 0 : Math.max(2, p)}%`, height: 16, background: hue })),
            d({ width: 60, justifyContent: 'flex-end', fontSize: 24, fontWeight: 800, color: p == null ? DIM : '#ffffff' }, p == null ? '–' : String(p)));
        })),
      cta()),
    ladder(t.index));
}

function invite() {
  return d({ width: 1200, height: 630, background: GROUND, padding: '48px 54px', fontFamily: SANS, color: '#f1f5f9', gap: 50 },
    d({ flexDirection: 'column', flex: 1 },
      eyebrow('Mind Loft · Polymath · Daily'),
      d({ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 36 }, 'Trivia, math and English. One title.'),
      d({ fontSize: 22, fontWeight: 700, color: '#cbd5e1', marginTop: 18 }, 'Play the day’s three gauntlets. Each counts a third. Top all three to be named a Polymath.'),
      cta()),
    ladder(-1));
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const share = parseShare({ s: q.get('s'), t: q.get('t'), d: q.get('d') });
    const el = share && share.score != null ? result(share.points, share.score) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('polymath card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
