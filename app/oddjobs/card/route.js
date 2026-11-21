import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag } from '@/lib/og-run-card';
import { ODD_MAX, ODD_RANKS, oddTierOf } from '@/lib/odd-jobs';

// ODD JOBS' SHARE CARD (2026-11-21). With no ?t it is the invite: the five
// ranks, Couch Potato up to Foreman, with what each takes. With ?t=<total> it
// is the ladder with your rank filled. It shows no board, so it spoils nothing.
export const runtime = 'nodejs';

const CAT = 'Logic';
const URL_TXT = 'mindloftdaily.com/oddjobs';
const RULE = ['No replays, under 8:20', 'No replays', '1 or 2 replays', '3 to 5 replays', '6+ replays'];

function rung(t, i, me) {
  const state = me == null ? 'below' : i === me ? 'mine' : i === me - 1 ? 'up' : i < me - 1 ? 'above' : 'below';
  const L = rungLook(state);
  return d({ alignItems: 'center', gap: 16, padding: '11px 14px', borderRadius: 12, ...L.row },
    d({ width: 18, height: 18, borderRadius: 999, background: t[3], flexShrink: 0 }),
    d({ flex: 1, fontSize: 23, fontWeight: 800, color: L.ink }, t[1]),
    d({ fontSize: 17, fontWeight: 700, color: L.num }, RULE[i]),
    state === 'mine' ? youTag() : null);
}

function result(total) {
  const me = oddTierOf(total);
  const t = ODD_RANKS[me];
  return frame({
    cat: CAT, url: URL_TXT,
    left: [
      chip('Odd Jobs · Result', CAT),
      d({ fontSize: 30, fontWeight: 800, color: W.mute, marginTop: 30 }, 'You are a'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, marginTop: 4, paddingBottom: 6 }, t[1]),
      d({ alignItems: 'baseline', gap: 20, marginTop: 26 },
        d({ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }, String(total)),
        d({ fontSize: 26, fontWeight: 800, color: W.mute }, `of ${ODD_MAX}`)),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 8 }, ...ODD_RANKS.map((x, i) => rung(x, i, me))),
  });
}

function invite() {
  return frame({
    cat: CAT, url: URL_TXT, rightW: 500,
    left: [
      chip('Odd Jobs · Daily Run', CAT),
      d({ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, marginTop: 30, paddingBottom: 4 }, 'Are you a Couch Potato or a Foreman?'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'Mop a house, mow a yard and plow a town: every tile, square and street exactly once. Fewest replays win, then the clock.'),
      cta(),
    ],
    right: d({ flexDirection: 'column', gap: 8 }, ...ODD_RANKS.map((x, i) => rung(x, i, null))),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const tq = Number(q.get('t'));
    const el = q.get('t') != null && Number.isFinite(tq) && tq >= 0 && tq <= ODD_MAX ? result(Math.round(tq)) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('oddjobs card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/mop.png' } });
  }
}
