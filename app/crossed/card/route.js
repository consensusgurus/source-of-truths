import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag, shortTag } from '@/lib/og-run-card';
import { CROSSED_MAX, CROSSED_BELTS, crossedTierOf, crossedDayTag, crossedInkOn } from '@/lib/crossed';

// CROSSED'S SHARE CARD: one route draws both, in Crossed Up's own mark, THE
// WEEK (app/crossed/Week.jsx): seven squares MON to PEN, inked up to a rank.
// With no ?s it is the invite: the week filling in, one row a rank. With
// ?s=12-28-20-18&t=78&d=2026-10-20 (each puzzle's points, the total, the day)
// it is THE LADDER: every rank, yours filled, the next one up outlined in gold
// with how short you came. It names no letter, so a shared card spoils nothing.
// Every figure is Manrope, like the site.
export const runtime = 'nodejs';

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// week sits on the Word pastel. Squares not yet inked are white.
const tc = (s) => String(s).toLowerCase().replace(/(^|\s)([a-z])/g, (m, a, b) => a + b.toUpperCase());
const CAT = 'Word';
const URL_TXT = 'mindloftdaily.com/crossed';
const LOW = CROSSED_BELTS.length - 1;

function week(ti, size, me = true) {
  const cells = [];
  for (let i = LOW; i >= 0; i--) {
    const on = i >= ti;
    const t = CROSSED_BELTS[i];
    cells.push(d({ ...(i === LOW ? {} : { borderLeft: `1px solid ${W.line}` }), position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center', background: on ? t[3] : '#ffffff', fontSize: Math.round(size * 0.29), fontWeight: 800, color: on ? crossedInkOn(t[3]) : W.faint },
      crossedDayTag(i),
      me && i === ti ? d({ position: 'absolute', left: -Math.round(size * 0.16), top: -Math.round(size * 0.16), width: Math.round(size * 1.32), height: Math.round(size * 1.32), border: '3px solid #ef4444', borderRadius: 999, transform: 'rotate(-9deg)' }) : null));
  }
  return d({ border: `2px solid ${W.ink}`, borderRadius: 3, flexShrink: 0 }, ...cells);
}
function tagCell(t, i) {
  return d({ width: 58, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: t[3], border: `1.5px solid ${W.line}`, fontSize: 14, fontWeight: 800, color: crossedInkOn(t[3]), flexShrink: 0 }, crossedDayTag(i));
}

function rung(t, i, me, upGap) {
  const state = i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 16, padding: '7px 14px', borderRadius: 12, ...L.row },
    d({ width: 34, fontSize: 17, fontWeight: 800, color: L.num, flexShrink: 0 }, String(t[0])),
    tagCell(t, i),
    d({ flex: 1, fontSize: 21, fontWeight: 800, color: L.ink }, t[1]),
    state === 'mine' ? youTag() : state === 'up' ? shortTag(upGap) : null);
}

function result(parts, total) {
  const me = crossedTierOf(total);
  const t = CROSSED_BELTS[me];
  const upGap = me > 0 ? Math.max(1, CROSSED_BELTS[me - 1][0] - total) : 0;
  return frame({
    cat: CAT, url: URL_TXT,
    left: [
      chip('Crossed Up · Result', CAT),
      label('Ranked as a', { marginTop: 30 }),
      d({ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 6 }, t[1]),
      d({ marginTop: 22, paddingLeft: 6 }, week(me, 50)),
      d({ alignItems: 'baseline', gap: 20, marginTop: 26 },
        d({ alignItems: 'baseline' },
          d({ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, String(total)),
          d({ fontSize: 30, fontWeight: 800, color: W.mute }, `/${CROSSED_MAX}`)),
        parts ? d({ fontSize: 18, fontWeight: 700, color: W.ink2 }, parts.join(' · ')) : null),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 5 }, ...CROSSED_BELTS.map((x, i) => rung(x, i, me, upGap))),
  });
}

function invite() {
  const rising = CROSSED_BELTS.slice().reverse();
  return frame({
    cat: CAT, url: URL_TXT, rightW: 470, rightPad: '22px 30px',
    left: [
      chip('Crossed Up · Daily Run', CAT),
      d({ fontSize: 62, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'Which day could you solve?'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'Five crosswords: the mini, the big one, three acrostics, a clueless grid and a hidden quote. Fast enough and you solve in pen.'),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 10 },
      ...rising.map((x, i) => d({ alignItems: 'center', gap: 14 },
        week(LOW - i, 30, false),
        d({ fontSize: 16, fontWeight: 800, color: i === rising.length - 1 ? W.ink : W.ink2 }, tc(x[2]))))),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    const parts = /^\d{1,2}(-\d{1,2}){3,4}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(40, Number(x)))) : null;
    const tRaw = q.get('t');
    const tq = tRaw == null || tRaw === '' ? NaN : Number(tRaw);
    const tot = Number.isFinite(tq) && tq >= 0 && tq <= CROSSED_MAX ? Math.round(tq) : null;
    const el = parts ? result(parts, tot != null ? tot : parts.reduce((a, b) => a + b, 0)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('crossed card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/emcee.png' } });
  }
}
