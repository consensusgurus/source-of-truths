import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { ROUNDS, TIERS, tierIndex } from '@/lib/passport';

// PASSPORT'S SHARE CARD (owner, 2026-10-03: a link to Passport must not look
// like a daily puzzle). The run's own picture, on the Price Check pattern:
// one route draws both. With no ?s it is the invite: the departures board with
// the destination sealed, the five rounds unscored, and the six passports you
// could travel home on. With ?s=10-7-8-9-6 it is a result: the five stamps,
// the total, and the passport that score earned. It never names the country,
// so a shared card cannot spoil the day.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const MONO = 'DM Mono';
const GROUND = '#0b0f1a';
const AMBER = '#f4d58d';
const SWISS = TIERS.find((t) => t.swiss);
const INKS = ['#a78bfa', '#60a5fa', '#34d399', '#f87171', '#f59e0b'];

function flap(ch, big) {
  const w = big ? 50 : 34, hgt = big ? 70 : 48, fs = big ? 48 : 32;
  return h('div', { style: { width: w, height: hgt, borderRadius: 6, background: '#1a2133', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: MONO, fontSize: fs, color: ch === '?' ? '#64748b' : AMBER } },
    ch,
    h('div', { style: { position: 'absolute', left: 0, right: 0, top: hgt / 2, height: 2, background: '#05070d' } }));
}

// A passport cover, drawn small (the ladder) or large (the result).
function cover(t, w, rot) {
  const ht = Math.round(w / 0.7);
  const s = w / 100;
  const emblem = t.swiss
    ? h('div', { style: { display: 'flex', position: 'relative', width: 40 * s, height: 40 * s } },
      h('div', { style: { position: 'absolute', left: 14 * s, top: 0, width: 12 * s, height: 40 * s, background: '#ffffff' } }),
      h('div', { style: { position: 'absolute', left: 0, top: 14 * s, width: 40 * s, height: 12 * s, background: '#ffffff' } }))
    : h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46 * s, height: 46 * s, borderRadius: 999, border: `${Math.max(1.5, 2.4 * s)}px solid ${t.cf}` } },
      h('div', { style: { display: 'flex', width: 30 * s, height: 30 * s, borderRadius: 999, border: `${Math.max(1, 1.2 * s)}px solid ${t.cf}` } }));
  return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: w, height: ht, borderRadius: `${6 * s}px ${10 * s}px ${10 * s}px ${6 * s}px`, background: t.cv, color: t.cf, padding: `${10 * s}px ${6 * s}px`, boxShadow: '0 16px 30px rgba(0,0,0,0.5)', ...(rot ? { transform: `rotate(${rot}deg)` } : {}) } },
    h('div', { style: { display: 'flex', fontSize: Math.max(7, 7.5 * s), fontWeight: 800, letterSpacing: 1.2 * s, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.25 } }, t.swiss ? 'Schweizer Pass' : t.short),
    emblem,
    h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: Math.max(7, 8.5 * s), letterSpacing: 2 * s, textTransform: 'uppercase' } }, t.t2 || 'Pass'));
}

function card(scores) {
  const res = Array.isArray(scores);
  const total = res ? scores.reduce((a, b) => a + b, 0) : null;
  const k = res ? tierIndex(total) : null;
  const tier = res ? TIERS[k] : null;

  const rows = ROUNDS.map((r, i) => {
    const v = res ? String(scores[i] ?? 0).padStart(2, '0') : '??';
    return h('div', { key: r.k, style: { display: 'flex', alignItems: 'center', gap: 16, padding: '5px 0' } },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 150, padding: '7px 0', borderRadius: 9, border: `2.5px solid ${INKS[i]}`, color: INKS[i], fontFamily: MONO, fontSize: 17, letterSpacing: 3, textTransform: 'uppercase', transform: `rotate(${[-3, 2, -2, 3, -2][i]}deg)` } }, r.n),
      h('div', { style: { display: 'flex', flex: 1, fontFamily: MONO, fontSize: 15, color: '#64748b' } }, `ROUND ${i + 1}`),
      h('div', { style: { display: 'flex', gap: 5 } }, flap(v[0]), flap(v[1])));
  });
  const totalDigits = res ? String(total).padStart(2, '0') : '??';

  const left = res
    ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 28, marginTop: 28 } },
      cover(tier, 150, -5),
      h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
        h('div', { style: { display: 'flex', fontSize: 17, fontWeight: 800, letterSpacing: 3, color: '#7dd3fc', textTransform: 'uppercase' } }, 'I traveled on the'),
        h('div', { style: { display: 'flex', fontSize: 38, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, marginTop: 8 } }, tier.name),
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, color: AMBER, marginTop: 12 } }, `Visa-free to ${tier.vf} countries`)))
    // THE INVITE LEADS WITH THE SWISS PASSPORT (owner, 2026-10-03): the cover
    // a sharp run earns, held up as the prize.
    : h('div', { style: { display: 'flex', alignItems: 'center', gap: 28, marginTop: 28 } },
      cover(SWISS, 150, -5),
      h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
        h('div', { style: { display: 'flex', fontSize: 17, fontWeight: 800, letterSpacing: 3, color: '#7dd3fc', textTransform: 'uppercase' } }, 'Score 48 and earn the'),
        h('div', { style: { display: 'flex', fontSize: 38, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, marginTop: 8 } }, SWISS.name),
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, color: AMBER, marginTop: 12 } }, `Visa-free to ${SWISS.vf} countries`),
        h('div', { style: { display: 'flex', fontSize: 19, fontWeight: 700, color: '#cbd5e1', marginTop: 14, lineHeight: 1.3 } }, 'One mystery country. Five rounds.')));

  return h('div', { style: { width: 1200, height: 630, display: 'flex', background: GROUND, padding: '44px 54px', fontFamily: SANS, color: '#f1f5f9' } },
    h('div', { style: { display: 'flex', flexDirection: 'column', width: 520, paddingRight: 34 } },
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 19, letterSpacing: 4, color: '#8b95a8', textTransform: 'uppercase' } }, 'Mind Loft · Daily run'),
      h('div', { style: { display: 'flex', marginTop: 18 } },
        h('div', { style: { display: 'flex', padding: '6px 22px 4px', border: '5px solid #f0718b', borderRadius: 14, transform: 'rotate(-3deg)', fontSize: 70, fontWeight: 800, letterSpacing: 4, lineHeight: 1, textTransform: 'uppercase' } }, 'Passport')),
      left,
      h('div', { style: { display: 'flex', marginTop: 'auto', alignItems: 'center', gap: 16 } },
        h('div', { style: { display: 'flex', padding: '14px 26px', borderRadius: 14, background: '#7dd3fc', color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 } }, 'Play free'),
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, color: '#cbd5e1', whiteSpace: 'nowrap' } }, 'mindloftdaily.com/passport'))),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: '#05070d', borderRadius: 22, padding: '20px 26px', border: '1px solid rgba(255,255,255,0.08)' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: '#64748b', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' } }, h('span', null, 'DEPARTURES · MIND LOFT AIR'), h('span', null, res ? 'LANDED' : 'BOARDING')),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0 8px' } },
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: '#8b95a8', width: 120 } }, 'DESTINATION'),
        h('div', { style: { display: 'flex', gap: 4 } }, ...'???????'.split('').map((c, i) => h('div', { key: i, style: { display: 'flex' } }, flap(c))))),
      ...rows,
      h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,0.14)' } },
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: '#64748b' } }, 'TOTAL'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } }, flap(totalDigits[0], true), flap(totalDigits[1], true),
          h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 36, color: '#475569', margin: '0 6px' } }, '/'), flap('5', true), flap('0', true)))));
}

export async function GET(req) {
  try {
    const s = new URL(req.url).searchParams.get('s') || '';
    const scores = /^\d{1,2}(-\d{1,2}){4}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(10, Number(x)))) : null;
    return new ImageResponse(card(scores), { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('passport card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/passport.png' } });
  }
}
