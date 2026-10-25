import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag, shortTag } from '@/lib/og-run-card';
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

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// day's schools sit on the Logic pastel in their own colours.
const CAT = 'Logic';
const URL_TXT = 'mindloftdaily.com/judged';

function swatch(p, s, size, extra) {
  return d({ flexDirection: 'column', width: size, height: size, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${W.line}`, ...extra },
    d({ flex: 2, background: p }), d({ flex: 1, background: s }));
}

function rung(t, i, me, upGap) {
  const state = i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  const name = t[1];
  const fs = name.length > 38 ? 15 : name.length > 30 ? 17 : 19;
  return d({ alignItems: 'center', gap: 14, padding: '6px 14px', borderRadius: 12, ...L.row },
    d({ width: 34, fontSize: 17, fontWeight: 800, color: L.num, flexShrink: 0 }, String(t[0])),
    swatch(t[5], t[6], 28),
    d({ flex: 1, fontSize: fs, fontWeight: 800, color: L.ink, lineHeight: 1.15 }, name),
    state === 'mine' ? youTag() : state === 'up' ? shortTag(upGap) : null);
}

function result(parts, total, L) {
  const me = lawTierOf(total);
  const t = L[me];
  const upGap = me > 0 ? Math.max(1, L[me - 1][0] - total) : 0;
  const nf = t[1].length > 30 ? 40 : t[1].length > 20 ? 48 : 58;
  return frame({
    cat: CAT, url: URL_TXT, rightW: 580,
    left: [
      chip('Judged · Result', CAT),
      label('Admitted to', { marginTop: 30 }),
      d({ fontSize: nf, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 6 }, t[1]),
      d({ alignItems: 'center', gap: 12, marginTop: 14 }, swatch(t[5], t[6], 30), d({ fontSize: 20, fontWeight: 700, color: W.ink2 }, t[3])),
      d({ alignItems: 'baseline', gap: 20, marginTop: 24 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: W.mute }, `/${LAW_MAX}`)),
        d({ fontSize: 18, fontWeight: 700, color: W.ink2 }, `Score ${lawIndexOf(total)}`)),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 5 }, ...L.map((x, i) => rung(x, i, me, upGap))),
  });
}

function invite(L) {
  const top = L[0];
  const rising = L.slice().reverse();
  return frame({
    cat: CAT, url: URL_TXT, rightW: 440, rightPad: '0', rightStyle: { alignItems: 'center' },
    left: [
      chip('Judged · Daily Run', CAT),
      d({ fontSize: 60, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 28 }, 'Which law school would take you?'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 14, lineHeight: 1.35 }, `Five logic cases. Right and fast. ${top[2].charAt(0) + top[2].slice(1).toLowerCase()} takes ${top[0]}.`),
      d({ gap: 8, marginTop: 22, alignItems: 'flex-end' },
        ...rising.map((x, i) => d({ flexDirection: 'column', width: 44, height: 36 + i * 9, borderRadius: 6, overflow: 'hidden', border: `1.5px solid ${W.line}` },
          d({ flex: 2, background: x[5] }), d({ flex: 1, background: x[6] })))),
      cta(),
    ],
    right: d({ position: 'relative', width: 360, height: 246, background: '#fbf8f0', borderRadius: 8, transform: 'rotate(-4deg)', overflow: 'hidden', boxShadow: '0 18px 36px rgba(11,13,18,0.18)' },
      d({ position: 'absolute', left: 0, top: 0, width: 360, height: 132, background: '#efe8d6', borderBottom: '2px solid #ded3b8' }),
      d({ position: 'absolute', left: 142, top: 94, width: 76, height: 76, borderRadius: 38, background: top[5], border: `4px solid ${top[6]}`, alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800, color: top[6] }, top[2].charAt(0)),
      d({ position: 'absolute', left: 0, right: 0, bottom: 22, justifyContent: 'center', fontSize: 14, fontWeight: 800, color: W.mute }, 'Office of Admissions')),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){3,4}$/.test(s) ? s.split('-').map((x, _i, a) => Math.max(0, Math.min(LAW_MAX / a.length, Number(x)))) : null;
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
