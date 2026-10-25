import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag, shortTag } from '@/lib/og-run-card';
import { DOJO_MAX, DOJO_BELTS, dojoTierOf } from '@/lib/dojo';

// ENTER THE DOJO'S SHARE CARD, on Judged's pattern: one route draws both. With
// no ?s it is the invite: the eight belts rising from white to black. With
// ?s=27-30-25&t=82&d=2026-10-12 (each grid's points, the total, the day) it is
// THE LADDER: every belt, yours filled, the next one up outlined in gold with
// how short you came. It names no digit, so a shared card cannot spoil a grid.
// Every figure is Manrope, like the site.
export const runtime = 'nodejs';

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// belts sit on the Sudoku pastel. A belt carries a hairline so the white belt
// still reads on white.
const tc = (s) => String(s).toLowerCase().replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());
const CAT = 'Sudoku';
const URL_TXT = 'mindloftdaily.com/dojo';

function beltBar(t, w, hgt) {
  return d({ position: 'relative', width: w, height: hgt, borderRadius: 4, background: t[3], border: `1.5px solid ${W.line}`, flexShrink: 0 },
    d({ position: 'absolute', right: Math.round(w * 0.12), top: 0, bottom: 0, width: Math.max(6, Math.round(w * 0.1)), background: t[4] }));
}

function rung(t, i, me, upGap) {
  const state = i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 16, padding: '6px 14px', borderRadius: 12, ...L.row },
    d({ width: 34, fontSize: 17, fontWeight: 800, color: L.num, flexShrink: 0 }, String(t[0])),
    beltBar(t, 74, 18),
    d({ flex: 1, fontSize: 21, fontWeight: 800, color: L.ink }, t[1]),
    state === 'mine' ? youTag() : state === 'up' ? shortTag(upGap) : null);
}

function result(parts, total) {
  const me = dojoTierOf(total);
  const t = DOJO_BELTS[me];
  const upGap = me > 0 ? Math.max(1, DOJO_BELTS[me - 1][0] - total) : 0;
  return frame({
    cat: CAT, url: URL_TXT,
    left: [
      chip('Enter the Dojo · Result', CAT),
      label('Tied on the', { marginTop: 30 }),
      d({ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 6 }, t[1]),
      d({ marginTop: 20 }, beltBar(t, 300, 40)),
      d({ alignItems: 'baseline', gap: 20, marginTop: 26 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: W.mute }, `/${DOJO_MAX}`)),
        parts ? d({ fontSize: 18, fontWeight: 700, color: W.ink2 }, parts.join(' · ')) : null),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 5 }, ...DOJO_BELTS.map((x, i) => rung(x, i, me, upGap))),
  });
}

function invite() {
  const rising = DOJO_BELTS.slice().reverse();
  return frame({
    cat: CAT, url: URL_TXT, rightW: 460, rightPad: '22px 34px',
    left: [
      chip('Enter the Dojo · Daily Run', CAT),
      d({ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'Which belt would you earn?'),
      d({ fontSize: 24, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'Three sudokus: a six by six, the classic, then a variant. Fast and clean ties on black.'),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 11 },
      ...rising.map((x, i) => d({ alignItems: 'center', gap: 14, marginLeft: (rising.length - 1 - i) * 10 },
        beltBar(x, 150 + i * 18, 22),
        d({ fontSize: 18, fontWeight: 800, color: i === rising.length - 1 ? W.ink : W.ink2 }, tc(x[2]))))),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){2}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(40, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= DOJO_MAX ? Math.round(tq) : null;
    const el = parts ? result(parts, tot != null ? tot : parts.reduce((a, b) => a + b, 0)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('dojo card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/passport.png' } });
  }
}
