import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame, rungLook, youTag, shortTag } from '@/lib/og-run-card';
import { categoryColor } from '@/lib/category-ramp';
import { POLY_LEGS, POLY_TIERS, tierFor, tierRange, parseShare } from '@/lib/polymath';

// POLYMATH'S SHARE CARD (2026-10-19), on the Dojo card's pattern. With no ?s it
// is the invite: the six tiers rising. With ?s=75-65-70&t=70&d=... it is the
// result: the title, the score, each leg's points as a bar, and the ladder with
// the viewer's rung lit. It names no question, so it cannot spoil a run.
export const runtime = 'nodejs';

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// title ladder sits on the Trivia pastel, each tier outlined in its own colour.
const CAT = 'Trivia';
const URL_TXT = 'mindloftdaily.com/polymath';

function ladder(me) {
  return d({ flexDirection: 'column-reverse', gap: 8 },
    ...POLY_TIERS.map((t, i) => {
      const mine = i === me;
      return d({ height: 52, borderRadius: 12, border: `3px solid ${mine ? W.ink : t.colour}`, background: mine ? t.colour : '#ffffff', padding: '0 16px', alignItems: 'center', justifyContent: 'space-between' },
        d({ fontSize: 21, fontWeight: 800, color: W.ink }, t.name),
        mine ? youTag() : d({ fontSize: 15, fontWeight: 700, color: W.ink2 }, tierRange(i)));
    }));
}

function result(points, score) {
  const t = tierFor(score);
  return frame({
    cat: CAT, url: URL_TXT, rightW: 400, rightPad: '20px 22px',
    left: [
      chip('Polymath · Result', CAT),
      label('Three gauntlets, one title', { marginTop: 26 }),
      d({ alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6, gap: 20 },
        d({ fontSize: 66, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }, t.name),
        d({ fontSize: 66, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }, String(score))),
      d({ flexDirection: 'column', gap: 14, marginTop: 24 },
        ...POLY_LEGS.map((l, i) => {
          const p = points[i];
          return d({ alignItems: 'center', gap: 16 },
            d({ width: 110, fontSize: 19, fontWeight: 800, color: W.ink2 }, l.short),
            d({ flex: 1, height: 16, borderRadius: 8, background: '#eef1f6', overflow: 'hidden' },
              d({ width: `${p == null ? 0 : Math.max(2, p)}%`, height: 16, background: categoryColor(l.cat) })),
            d({ width: 60, justifyContent: 'flex-end', fontSize: 24, fontWeight: 800, color: p == null ? W.mute : W.ink }, p == null ? '-' : String(p)));
        })),
      cta(),
    ],
    right: ladder(t.index),
  });
}

function invite() {
  return frame({
    cat: CAT, url: URL_TXT, rightW: 400, rightPad: '20px 22px',
    left: [
      chip('Polymath · Daily Run', CAT),
      d({ fontSize: 60, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'Trivia, math and English. One title.'),
      d({ fontSize: 23, fontWeight: 600, color: W.ink2, marginTop: 16, lineHeight: 1.35 }, 'Play the day\u2019s three gauntlets. Each counts a third. Top all three to be named a Polymath.'),
      cta(),
    ],
    right: ladder(-1),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const share = parseShare({ s: q.get('s'), t: q.get('t'), d: q.get('d') });
    const el = share && share.score != null ? result(share.points, share.score) : invite();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('polymath card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
