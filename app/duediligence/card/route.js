import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag } from '@/lib/og-run-card';
import { DD_MAX, DD_RANKS, ddTierOf } from '@/lib/due-diligence';

// DUE DILIGENCE'S SHARE CARD (2026-11-10). With no ?t it is the invite: the
// five ranks, Anon Fintwit Account up to Ken Griffin, with their cutoffs. With
// ?t=<total> it is the ladder with your rank filled. It names no answer, so a
// shared card spoils nothing.
export const runtime = 'nodejs';

const CAT = 'Trivia';
const URL_TXT = 'mindloftdaily.com/duediligence';

function rung(t, i, me) {
  const state = me == null ? 'below' : i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 16, padding: '11px 14px', borderRadius: 12, ...L.row },
    d({ width: 18, height: 18, borderRadius: 999, background: t[3], flexShrink: 0 }),
    d({ flex: 1, fontSize: 23, fontWeight: 800, color: L.ink }, t[1]),
    d({ fontSize: 17, fontWeight: 700, color: L.num }, `${t[0]}+`),
    state === 'mine' ? youTag() : null);
}

function result(total) {
  const me = ddTierOf(total);
  const t = DD_RANKS[me];
  return frame({
    cat: CAT, url: URL_TXT,
    left: [
      chip('Due Diligence · Result', CAT),
      label('Ranked as', { marginTop: 30 }),
      d({ fontSize: 58, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, marginTop: 6 }, t[1]),
      d({ alignItems: 'baseline', gap: 20, marginTop: 26 },
        d({ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, String(total)),
        d({ fontSize: 26, fontWeight: 800, color: W.mute }, `of ${DD_MAX}`)),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 8 }, ...DD_RANKS.map((x, i) => rung(x, i, me))),
  });
}

function invite() {
  return frame({
    cat: CAT, url: URL_TXT, rightW: 500,
    left: [
      chip('Due Diligence · Daily Run', CAT),
      d({ fontSize: 60, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'Did you do your homework?'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'A stock chart, an IPO filing and a resume. Name each one in the fewest clues.'),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 8 }, ...DD_RANKS.map((x, i) => rung(x, i, null))),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const tq = Number(q.get('t'));
    const el = q.get('t') != null && Number.isFinite(tq) && tq >= 0 && tq <= DD_MAX ? result(Math.round(tq)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('duediligence card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/filing.png' } });
  }
}
