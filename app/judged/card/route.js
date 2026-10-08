import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { LAW_KEYS, LAW_CASES, LAW_CASE_MAX, LAW_MAX, lawLadderFor, lawTierOf, lawIndexOf } from '@/lib/law-school';

// LAW SCHOOL'S SHARE CARD (2026-10-08), on the Passport pattern: one route
// draws both. With no ?s it is the invite, Yale held up as the prize. With
// ?s=8-10-6-5-9&t=38&d=2026-10-08 (each case on its 0 to 10 scale, the total,
// and the day, which picks that day's rotating school) it is a result: the
// transcript, the admissions score and the school that took you. It names no
// suspect and no answer, so a shared card cannot spoil the day.
export const runtime = 'nodejs';

const SANS = 'Manrope';
const MONO = 'DM Mono';
const GROUND = '#0b0f1a';
const GOLD = '#e9cf7f';
const NAMES = { docket: 'Docket', sworn: 'Sworn', hearsay: 'Hearsay', alibi: 'Alibi', stands: 'Stands' };

function pennant(t, w) {
  const ht = Math.round(w * 0.62);
  const fly = w - 14;
  return h('div', { style: { display: 'flex', position: 'relative', width: w, height: ht + 40 } },
    h('div', { style: { display: 'flex', position: 'absolute', left: 0, top: 0, width: 14, height: ht + 40, background: '#d6c7a1', borderRadius: 4 } }),
    h('div', { style: { display: 'flex', position: 'absolute', left: 14, top: 0, width: 0, height: 0, borderTop: `${ht / 2}px solid transparent`, borderBottom: `${ht / 2}px solid transparent`, borderLeft: `${fly}px solid ${t[5]}` } }),
    h('div', { style: { display: 'flex', position: 'absolute', left: 26, top: 0, height: ht, alignItems: 'center', fontSize: Math.round(w / (t[2].length > 8 ? 12 : 8.5)), fontWeight: 800, letterSpacing: 2, color: t[6] } }, t[2]));
}

function card(parts, tot, day) {
  // The school is the one that day's rotating ladder dealt (?d=), today's otherwise.
  const LAW_LADDER = lawLadderFor(day);
  const res = Array.isArray(parts);
  const total = res ? (Number.isFinite(tot) ? tot : parts.reduce((a, b) => a + b, 0)) : null;
  const t = res ? LAW_LADDER[lawTierOf(total)] : LAW_LADDER[0];
  const rows = LAW_KEYS.map((k, i) => {
    const v = res ? String(parts[i] ?? 0) : '--';
    return h('div', { key: k, style: { display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' } },
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 15, color: '#64748b', width: 74 } }, `CASE ${i + 1}`),
      h('div', { style: { display: 'flex', flex: 1, fontSize: 23, fontWeight: 800, color: '#e9edf4' } }, NAMES[k]),
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 15, color: '#8b95a8', marginRight: 16 } }, LAW_CASES[k].file.toUpperCase()),
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 26, color: res ? GOLD : '#475569', width: 70, justifyContent: 'flex-end' } }, `${v}/${LAW_CASE_MAX}`));
  });

  const left = h('div', { style: { display: 'flex', alignItems: 'center', gap: 26, marginTop: 30 } },
    pennant(t, 190),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1 } },
      h('div', { style: { display: 'flex', fontSize: 17, fontWeight: 800, letterSpacing: 3, color: '#7dd3fc', textTransform: 'uppercase' } }, res ? 'Admitted to' : `Score ${LAW_LADDER[0][0]} and get into`),
      h('div', { style: { display: 'flex', fontSize: 34, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1, marginTop: 8 } }, t[1]),
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, color: GOLD, marginTop: 10 } }, t[3])));

  return h('div', { style: { width: 1200, height: 630, display: 'flex', background: GROUND, padding: '44px 54px', fontFamily: SANS, color: '#f1f5f9' } },
    h('div', { style: { display: 'flex', flexDirection: 'column', width: 540, paddingRight: 34 } },
      h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 19, letterSpacing: 4, color: '#8b95a8', textTransform: 'uppercase' } }, 'Mind Loft · Daily run'),
      h('div', { style: { display: 'flex', marginTop: 16, fontSize: 78, fontWeight: 800, letterSpacing: -2, lineHeight: 1 } }, 'Judged'),
      h('div', { style: { display: 'flex', fontSize: 21, fontWeight: 700, color: '#cbd5e1', marginTop: 10 } }, 'Five cases. Right and fast.'),
      left,
      h('div', { style: { display: 'flex', marginTop: 'auto', alignItems: 'center', gap: 16 } },
        h('div', { style: { display: 'flex', padding: '14px 26px', borderRadius: 14, background: '#7dd3fc', color: '#08222e', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 } }, 'Play free'),
        h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 18, color: '#cbd5e1', whiteSpace: 'nowrap' } }, 'mindloftdaily.com/judged'))),
    h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: '#f6f1e4', borderRadius: 18, padding: 10 } },
      h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, background: '#121827', borderRadius: 12, padding: '20px 26px' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: '#64748b', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.1)' } }, h('span', null, 'OFFICIAL TRANSCRIPT'), h('span', null, res ? 'GRADED' : 'SEALED')),
        ...rows,
        h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12 } },
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 15, letterSpacing: 4, color: '#64748b' } }, 'ADMISSIONS SCORE'),
            h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 54, color: res ? '#ffffff' : '#475569' } }, res ? String(lawIndexOf(total)) : '1??')),
          h('div', { style: { display: 'flex', fontFamily: MONO, fontSize: 30, color: res ? GOLD : '#475569' } }, res ? `${total} / ${LAW_MAX}` : `?? / ${LAW_MAX}`)))));
}

export async function GET(req) {
  try {
    const s = new URL(req.url).searchParams.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){4}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(LAW_CASE_MAX, Number(x)))) : null;
    const tRaw = new URL(req.url).searchParams.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= LAW_MAX ? Math.round(tq) : null;
    const dq = new URL(req.url).searchParams.get('d') || '';
    const day = /^\d{4}-\d{2}-\d{2}$/.test(dq) ? dq : new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    return new ImageResponse(card(parts, tot, day), { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('judged card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/passport.png' } });
  }
}
