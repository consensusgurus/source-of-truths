import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag } from '@/lib/og-run-card';
import { EE_MAX, EE_RANKS, EE_GROUND, eeTierOf, eeLead } from '@/lib/eagle-eye';

// EAGLE EYE'S SHARE CARD (owner, 2026-11-13: "it needs a cool share link image
// too"). With no ?t it is the invite: the eye over the seven ranks, Mole up to
// Eagle Eye. With ?t=<total> it is the result: "You are an Owl" beside the
// ladder with your rung in focus (white, ringed) and the rest fallen back. It
// names no answer, so a shared card spoils nothing.
export const runtime = 'nodejs';

const CAT = 'Visual';
const URL_TXT = 'mindloftdaily.com/eagleeye';
const INK = '#08222e';
const svgURI = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
// The eye: white almond, magenta iris, ink pupil with a catchlight, looking at you.
const EYE = svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="220" viewBox="0 0 440 220"><path d="M14 110 C96 6 344 6 426 110 C344 214 96 214 14 110 Z" fill="#ffffff" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/><circle cx="220" cy="110" r="70" fill="${EE_GROUND}" stroke="${INK}" stroke-width="8"/><circle cx="220" cy="110" r="30" fill="${INK}"/><circle cx="242" cy="88" r="11" fill="#ffffff"/></svg>`);

function rung(t, i, me) {
  const state = me == null ? 'below' : i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 14, padding: '6px 14px', borderRadius: 12, ...L.row },
    d({ width: 16, height: 16, borderRadius: 999, background: t[3], flexShrink: 0 }),
    d({ flex: 1, fontSize: 21, fontWeight: 800, color: L.ink }, t[1]),
    d({ fontSize: 16, fontWeight: 700, color: L.num }, t[0] > 0 ? `${t[0]}+` : 'Any run'),
    state === 'mine' ? youTag() : null);
}
const panel = (me) => d({ flexDirection: 'column', gap: 5 },
  d({ justifyContent: 'center', marginBottom: 6 }, h('img', { src: EYE, width: 210, height: 105 })),
  ...EE_RANKS.map((x, i) => rung(x, i, me)));

function result(total) {
  const me = eeTierOf(total);
  const t = EE_RANKS[me];
  return frame({
    cat: CAT, url: URL_TXT, rightW: 500, rightPad: '14px 20px',
    left: [
      chip('Eagle Eye · Result', CAT),
      label(eeLead(t[1]), { marginTop: 30 }),
      d({ fontSize: t[1].length > 6 ? 84 : 104, fontWeight: 800, lineHeight: 1.08, letterSpacing: -3, marginTop: 2 }, t[1]),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 10, lineHeight: 1.35 }, t[5]),
      d({ alignItems: 'baseline', gap: 10, marginTop: 18 },
        d({ fontSize: 52, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }, String(total)),
        d({ fontSize: 24, fontWeight: 800, color: W.mute }, `of ${EE_MAX}`)),
      cta('How Sharp Are You?'),
    ],
    right: panel(me),
  });
}

function invite() {
  return frame({
    cat: CAT, url: URL_TXT, rightW: 500, rightPad: '14px 20px',
    left: [
      chip('Eagle Eye · Daily Run', CAT),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'How sharp is your eye?'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'Five visual puzzles in one run: spot the differences, build two jigsaws, sweep a word search, remember a scene.'),
      cta(),
    ],
    right: panel(null),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const tq = Number(q.get('t'));
    const el = q.get('t') != null && Number.isFinite(tq) && tq >= 0 && tq <= EE_MAX ? result(Math.round(tq)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('eagleeye card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/spot.png' } });
  }
}
