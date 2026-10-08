import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { LAW_CASE_MAX, LAW_MAX, lawLadderFor, lawTierOf, lawIndexOf } from '@/lib/law-school';

// JUDGED'S SHARE CARD, on the Passport pattern: one route draws both. With no
// ?s it is the invite: a sealed envelope from the top school and the day's
// eight schools rising toward it. With ?s=17-19-11-16-17&t=80&d=2026-10-08
// (each case on its 0 to 20 scale, the total, and the day, which picks that
// day's rotating schools) it is THE LADDER (owner pick, 2026-10-08): every
// rung of the day in its school's colours, yours filled, the one you just
// missed outlined in gold with how short you came. It names no suspect and no
// answer, so a shared card cannot spoil the day. Every figure is Manrope, like
// the site (one typeface since 2026-10-08).
export const runtime = 'nodejs';

const SANS = 'Manrope';
const GROUND = '#0b0f1a';
const GOLD = '#e9cf7f';
const SKY = '#7dd3fc';
const MUTE = '#8b95a8';
const DIM = '#64748b';
const d = (style, ...kids) => h('div', { style: { display: 'flex', ...style } }, ...kids);

function swatch(p, s, size, extra) {
  return d({ flexDirection: 'column', width: size, height: size, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.3)', ...extra },
    d({ flex: 2, background: p }), d({ flex: 1, background: s }));
}

function cta() {
  return d({ marginTop: 'auto', alignItems: 'center', gap: 16 },
    d({ padding: '14px 26px', borderRadius: 14, background: SKY, color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }, 'Play free'),
    d({ fontSize: 18, fontWeight: 700, color: '#cbd5e1', whiteSpace: 'nowrap' }, 'mindloftdaily.com/judged'));
}

function eyebrow(text) {
  return d({ fontSize: 17, fontWeight: 800, letterSpacing: 4, color: MUTE, textTransform: 'uppercase' }, text);
}

function rung(t, i, me, upGap) {
  const mine = i === me;
  const up = i === me - 1;
  const above = i < me - 1;
  const name = t[1];
  const fs = name.length > 38 ? 15 : name.length > 30 ? 17 : 19;
  const row = { alignItems: 'center', gap: 14, padding: '7px 14px', borderRadius: 12, border: '2px solid transparent' };
  if (mine) Object.assign(row, { background: t[5], border: `2px solid ${t[6]}` });
  else if (up) Object.assign(row, { border: `2px dashed ${GOLD}` });
  else if (above) Object.assign(row, { opacity: 0.38 });
  else Object.assign(row, { background: 'rgba(255,255,255,0.04)' });
  const ink = mine ? '#ffffff' : up ? GOLD : above ? '#e9edf4' : '#94a3b8';
  const tag = mine
    ? d({ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GROUND, background: t[6], padding: '4px 9px', borderRadius: 6, flexShrink: 0 }, 'YOU')
    : up
      ? d({ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GOLD, flexShrink: 0 }, `${upGap} SHORT`)
      : null;
  return d(row,
    d({ width: 34, fontSize: 17, fontWeight: 800, color: mine ? t[6] : up ? GOLD : DIM, flexShrink: 0 }, String(t[0])),
    swatch(t[5], t[6], 30),
    d({ flex: 1, fontSize: fs, fontWeight: 800, color: ink, lineHeight: 1.15 }, name),
    tag);
}

function result(parts, total, L) {
  const me = lawTierOf(total);
  const t = L[me];
  const upGap = me > 0 ? Math.max(1, L[me - 1][0] - total) : 0;
  const nf = t[1].length > 30 ? 40 : t[1].length > 20 ? 48 : 58;
  return d({ width: 1200, height: 630, background: GROUND, padding: '44px 50px', fontFamily: SANS, color: '#f1f5f9', gap: 40 },
    d({ flexDirection: 'column', width: 470 },
      eyebrow('Mind Loft · Judged'),
      d({ fontSize: 18, fontWeight: 800, letterSpacing: 3, color: SKY, textTransform: 'uppercase', marginTop: 40 }, 'Admitted to'),
      d({ fontSize: nf, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 10 }, t[1]),
      d({ fontSize: 19, fontWeight: 700, color: GOLD, marginTop: 14 }, t[3]),
      d({ alignItems: 'baseline', gap: 22, marginTop: 30 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 66, fontWeight: 800, letterSpacing: -2, color: '#ffffff', lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: DIM }, `/${LAW_MAX}`)),
        d({ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: MUTE }, `SCORE ${lawIndexOf(total)}`)),
      cta()),
    d({ flexDirection: 'column', flex: 1, gap: 6, justifyContent: 'center' },
      ...L.map((x, i) => rung(x, i, me, upGap))));
}

function invite(L) {
  const top = L[0];
  const rising = L.slice().reverse();
  return d({ width: 1200, height: 630, background: GROUND, padding: '48px 54px', fontFamily: SANS, color: '#f1f5f9', gap: 50 },
    d({ flexDirection: 'column', flex: 1 },
      eyebrow('Mind Loft · Judged · Daily run'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 36 }, 'Which law school would take you?'),
      d({ fontSize: 22, fontWeight: 700, color: '#cbd5e1', marginTop: 18 }, `Five logic cases. Right and fast. ${top[2].charAt(0) + top[2].slice(1).toLowerCase()} takes ${top[0]}.`),
      d({ gap: 8, marginTop: 30, alignItems: 'flex-end' },
        ...rising.map((x, i) => d({ flexDirection: 'column', width: 48, height: 40 + i * 10, borderRadius: 6, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.25)' },
          d({ flex: 2, background: x[5] }), d({ flex: 1, background: x[6] })))),
      cta()),
    d({ width: 400, alignItems: 'center', justifyContent: 'center' },
      d({ position: 'relative', width: 380, height: 260, background: '#f6f1e4', borderRadius: 8, transform: 'rotate(-4deg)', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' },
        d({ position: 'absolute', left: 0, top: 0, width: 380, height: 140, background: '#e7dfcb', borderBottom: '2px solid #d6ccb2' }),
        d({ position: 'absolute', left: 150, top: 100, width: 80, height: 80, borderRadius: 40, background: top[5], border: `4px solid ${top[6]}`, alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: top[6] }, top[2].charAt(0)),
        d({ position: 'absolute', left: 0, right: 0, bottom: 22, justifyContent: 'center', fontSize: 13, fontWeight: 800, letterSpacing: 4, color: '#6b7280' }, 'OFFICE OF ADMISSIONS'))));
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){4}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(LAW_CASE_MAX, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= LAW_MAX ? Math.round(tq) : null;
    const dq = q.get('d') || '';
    const day = /^\d{4}-\d{2}-\d{2}$/.test(dq) ? dq : new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const L = lawLadderFor(day);
    const el = parts ? result(parts, tot != null ? tot : parts.reduce((a, b) => a + b, 0), L) : invite(L);
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('judged card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/passport.png' } });
  }
}
