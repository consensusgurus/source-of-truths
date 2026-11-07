import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, label, cta, frame } from '@/lib/og-run-card';
import { categoryColor, sitePastelHex } from '@/lib/category-ramp';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { parseRunKeys, cleanRunName, cleanMaker } from '@/lib/daily-run';

// A BUILT RUN'S SHARE CARD (owner, 2026-11-07), on the run cards' white frame.
// With ?g= it is the invite: the run's name, its maker and its games in order,
// each on its category pastel. With no ?g= it is the builder's own card.
// It names no answer and no score, so it never spoils a game.
export const runtime = 'nodejs';

const URL_TXT = 'mindloftdaily.com/run';

function gamesPanel(keys) {
  const big = keys.length <= 5;
  return d({ flexDirection: 'column', gap: big ? 12 : 8 },
    ...keys.map((k, i) => {
      const g = DAILY_GAME_MAP[k];
      return d({ height: big ? 70 : 52, borderRadius: 14, border: `2px solid ${W.ink}`, background: sitePastelHex(categoryColor(g.cat)), padding: '0 18px', alignItems: 'center', gap: 14 },
        d({ fontSize: big ? 22 : 18, fontWeight: 800, color: W.ink2, width: 26 }, String(i + 1)),
        d({ fontSize: big ? 28 : 22, fontWeight: 800, color: W.ink }, g.name));
    }));
}

function invite(keys, name, by) {
  const cat = DAILY_GAME_MAP[keys[0]].cat;
  return frame({
    cat, url: URL_TXT, rightW: 420, rightPad: '22px 24px',
    left: [
      chip(`A Run · ${keys.length} Games`, cat),
      d({ fontSize: name.length > 18 ? 58 : 70, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, name),
      label(by ? `Built by ${by}. Can you beat it?` : 'Free daily puzzles, back to back. Can you beat it?', { marginTop: 18, fontSize: 25 }),
      cta('Play the Run'),
    ],
    right: gamesPanel(keys),
  });
}

function builder() {
  const demo = ['deep', 'strata', 'sums', 'alibi', 'shoe'].filter((k) => DAILY_GAME_MAP[k]);
  return frame({
    cat: 'Word', url: 'mindloftdaily.com/build-a-run', rightW: 420, rightPad: '22px 24px',
    left: [
      chip('Build a Run', 'Word'),
      d({ fontSize: 64, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, marginTop: 30 }, 'Your puzzles. Your order.'),
      label('Pick two to eight free dailies, name the run and send it to friends.', { marginTop: 18, fontSize: 25, lineHeight: 1.35 }),
      cta('Build a Run'),
    ],
    right: gamesPanel(demo),
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const keys = parseRunKeys(q.get('g'));
    const el = keys.length >= 2
      ? invite(keys, cleanRunName(q.get('n')) || 'A Mind Loft Run', cleanMaker(q.get('by')))
      : builder();
    return new ImageResponse(el, { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('run card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/brand.png' } });
  }
}
