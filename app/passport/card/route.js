import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, cta, frame } from '@/lib/og-run-card';
import { ROUNDS, TIERS, tierIndex, LEGS, legsFor, isLegsDay } from '@/lib/passport';

// PASSPORT'S SHARE CARD (owner, 2026-10-03: a link to Passport must not look
// like a daily puzzle). The run's own picture, on the Price Check pattern:
// one route draws both. With no ?s it is the invite: the departures board with
// the destination sealed, the five rounds unscored, and the six passports you
// could travel home on. With ?s=10-7-8-9-6 it is a result: the five stamps,
// the total, and the passport that score earned. It never names the country,
// so a shared card cannot spoil the day.
export const runtime = 'nodejs';

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// departures board sits on the Geography pastel with white flaps and ink
// digits. Manrope only. The passport covers keep their own colours.
const CAT = 'Geography';
const URL_TXT = 'mindloftdaily.com/passport';
const SWISS = TIERS.find((t) => t.swiss);
const STAMP_TILT = [-3, 2, -2, 3, -2];

function flap(ch, big) {
  const w = big ? 46 : 32, hgt = big ? 62 : 44, fs = big ? 40 : 28;
  return d({ width: w, height: hgt, borderRadius: 6, background: '#ffffff', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: fs, fontWeight: 800, color: ch === '?' ? W.faint : W.ink, flexShrink: 0 },
    ch,
    d({ position: 'absolute', left: 0, right: 0, top: hgt / 2, height: 1.5, background: 'rgba(11,13,18,0.12)' }));
}

function cover(t, w, rot) {
  const ht = Math.round(w / 0.7);
  const s = w / 100;
  const emblem = t.swiss
    ? d({ position: 'relative', width: 40 * s, height: 40 * s },
      d({ position: 'absolute', left: 14 * s, top: 0, width: 12 * s, height: 40 * s, background: '#ffffff' }),
      d({ position: 'absolute', left: 0, top: 14 * s, width: 40 * s, height: 12 * s, background: '#ffffff' }))
    : d({ alignItems: 'center', justifyContent: 'center', width: 46 * s, height: 46 * s, borderRadius: 999, border: `${Math.max(1.5, 2.4 * s)}px solid ${t.cf}` },
      d({ width: 30 * s, height: 30 * s, borderRadius: 999, border: `${Math.max(1, 1.2 * s)}px solid ${t.cf}` }));
  return d({ flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: w, height: ht, borderRadius: `${6 * s}px ${10 * s}px ${10 * s}px ${6 * s}px`, background: t.cv, color: t.cf, padding: `${10 * s}px ${6 * s}px`, boxShadow: '0 14px 28px rgba(11,13,18,0.22)', flexShrink: 0, ...(rot ? { transform: `rotate(${rot}deg)` } : {}) },
    d({ fontSize: Math.max(7, 7.5 * s), fontWeight: 800, letterSpacing: 1.2 * s, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.25 }, t.swiss ? 'Schweizer Pass' : t.short),
    emblem,
    d({ fontSize: Math.max(7, 8.5 * s), fontWeight: 700, letterSpacing: 2 * s, textTransform: 'uppercase' }, t.t2 || 'Pass'));
}

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function card(scores) {
  const res = Array.isArray(scores);
  const legsCard = res ? scores.length === 4 : isLegsDay(etToday());
  const ROWS = legsCard ? legsFor(etToday()) : ROUNDS;
  const total = res ? scores.reduce((a, b) => a + b, 0) : null;
  const tier = res ? TIERS[tierIndex(total)] : SWISS;

  const rows = ROWS.map((r, i) => {
    const v = res ? String(scores[i] ?? 0).padStart(2, '0') : '??';
    return d({ alignItems: 'center', gap: 14, padding: '4px 0' },
      d({ alignItems: 'center', justifyContent: 'center', width: 130, padding: '6px 0', borderRadius: 9, border: `2.5px solid ${W.ink}`, fontSize: 17, fontWeight: 800, transform: `rotate(${STAMP_TILT[i]}deg)`, flexShrink: 0 }, r.n),
      d({ flex: 1, fontSize: 16, fontWeight: 700, color: W.ink2 }, legsCard ? `Leg ${i + 1} · /${r.max}` : `Round ${i + 1}`),
      d({ gap: 4 }, flap(v[0]), flap(v[1])));
  });
  const totalDigits = res ? String(total).padStart(2, '0') : '??';

  const board = d({ flexDirection: 'column', flex: 1 },
    d({ justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: W.ink2, paddingBottom: 8, borderBottom: `1px solid ${W.line}` }, d({}, 'Departures · Mind Loft Air'), d({}, res ? 'Landed' : 'Boarding')),
    d({ alignItems: 'center', gap: 12, padding: '10px 0 6px' },
      d({ fontSize: 15, fontWeight: 800, color: W.ink2, width: 104 }, 'Destination'),
      d({ gap: 3 }, ...'???????'.split('').map((c) => flap(c)))),
    ...rows,
    d({ alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: `1px dashed ${W.line}` },
      d({ fontSize: 18, fontWeight: 800, color: W.ink2 }, 'Total'),
      d({ alignItems: 'center', gap: 5 }, flap(totalDigits[0], true), flap(totalDigits[1], true),
        d({ fontSize: 32, fontWeight: 800, color: W.mute, margin: '0 4px' }, '/'), flap('5', true), flap('0', true))));

  return frame({
    cat: CAT, url: URL_TXT, rightW: 560, rightPad: '18px 22px', rightStyle: { justifyContent: 'flex-start' },
    left: [
      chip(res ? 'Passport · Result' : 'Passport · Daily Run', CAT),
      d({ marginTop: 18 },
        d({ padding: '4px 18px 2px', border: '4px solid #f0718b', borderRadius: 12, transform: 'rotate(-3deg)', fontSize: 56, fontWeight: 800, letterSpacing: 3, lineHeight: 1, textTransform: 'uppercase' }, 'Passport')),
      d({ alignItems: 'center', gap: 24, marginTop: 24 },
        cover(tier, 120, -5),
        d({ flexDirection: 'column', flex: 1 },
          d({ fontSize: 20, fontWeight: 700, color: W.ink2 }, res ? 'I traveled on the' : 'Score 48 and earn the'),
          d({ fontSize: 32, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1, marginTop: 6 }, tier.name),
          d({ fontSize: 18, fontWeight: 700, color: W.ink2, marginTop: 8 }, `Visa-free to ${tier.vf} countries`),
          res ? null : d({ fontSize: 18, fontWeight: 600, color: W.ink2, marginTop: 8 }, 'Ping, nine size calls, Flank and Span.'))),
      cta(),
    ],
    right: board,
  });
}

export async function GET(req) {
  try {
    const s = new URL(req.url).searchParams.get('s') || '';
    const v1 = /^\d{1,2}(-\d{1,2}){4}$/.test(s);
    const v2 = /^\d{1,2}(-\d{1,2}){3}$/.test(s);
    const scores = v1 || v2 ? s.split('-').map((x, i) => Math.max(0, Math.min(v2 ? Math.max(LEGS[i].max, legsFor('9999-12-31')[i].max) : 10, Number(x)))) : null;
    return new ImageResponse(card(scores), { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('passport card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/passport.png' } });
  }
}
