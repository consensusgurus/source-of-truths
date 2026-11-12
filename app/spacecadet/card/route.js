import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag } from '@/lib/og-run-card';
import { SPACE_MAX, SPACE_RANKS, spaceTierOf } from '@/lib/space-cadet';

// SPACE CADET'S SHARE CARD (2026-11-07). With no ?t it is the invite: the six
// ranks, Lost in Space up to Architect-Engineer, with their time cutoffs. With
// ?t=<total>&c=<clock seconds>&f=1 (f: every puzzle solved) it is the ladder
// with your rank filled. It names no move, so a shared card spoils nothing.
export const runtime = 'nodejs';

const CAT = 'Visual';
const URL_TXT = 'mindloftdaily.com/spacecadet';
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const under = (t) => (t[6] ? `Under ${clock(t[6])}` : 'Any finish');

function rung(t, i, me) {
  const state = me == null ? 'below' : i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 16, padding: '9px 14px', borderRadius: 12, ...L.row },
    d({ width: 18, height: 18, borderRadius: 999, background: t[3], flexShrink: 0 }),
    d({ flex: 1, fontSize: 22, fontWeight: 800, color: L.ink }, t[1]),
    d({ fontSize: 16, fontWeight: 700, color: L.num }, under(t)),
    state === 'mine' ? youTag() : null);
}

function result(total, secs, full) {
  const me = spaceTierOf(total, full);
  const t = SPACE_RANKS[me];
  return frame({
    cat: CAT, url: URL_TXT,
    left: [
      chip('Space Cadet · Result', CAT),
      label('Ranked as', { marginTop: 30 }),
      d({ fontSize: 58, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 6 }, t[1]),
      d({ alignItems: 'baseline', gap: 20, marginTop: 26 },
        secs ? d({ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, clock(secs)) : null,
        d({ fontSize: 26, fontWeight: 800, color: W.mute }, `${total}/${SPACE_MAX}`)),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 6 }, ...SPACE_RANKS.map((x, i) => rung(x, i, me))),
  });
}

function invite() {
  return frame({
    cat: CAT, url: URL_TXT, rightW: 500,
    left: [
      chip('Space Cadet · Daily Run', CAT),
      d({ fontSize: 60, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'How well do you see space?'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'Four spatial puzzles on one clock: roll a die, free a car, untangle the ropes, land a block.'),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 6 }, ...SPACE_RANKS.map((x, i) => rung(x, i, null))),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const tq = Number(q.get('t'));
    const cq = Number(q.get('c'));
    const el = q.get('t') != null && Number.isFinite(tq) && tq >= 0 && tq <= SPACE_MAX
      ? result(Math.round(tq), Number.isFinite(cq) && cq > 0 && cq < 36000 ? Math.round(cq) : 0, q.get('f') === '1')
      : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('spacecadet card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/tangled.png' } });
  }
}
