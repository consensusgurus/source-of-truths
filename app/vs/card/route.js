import { ImageResponse } from 'next/og';
import { renderStageCard, stageFonts, shell, hueFor, clamp, size, D, T, Col } from '@/lib/og-stage-card';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { decodeChallenge, challengeFig } from '@/lib/challenge';

// THE CHALLENGE LINK'S PREVIEW (owner, 2026-10-07): what a messaging app draws
// when the link is pasted. It names the sender and the figure, never the answer.
//
// Two earlier cuts split the name and the time into separate figures; in an
// iMessage bubble neither read as a sentence. It is one sentence now.
export const runtime = 'nodejs';

export async function GET(req) {
  const u = new URL(req.url);
  const g = DAILY_GAME_MAP[u.searchParams.get('g') || ''] || null;
  const c = decodeChallenge(u.searchParams.get('vs') || '');
  const hue = hueFor(g ? g.cat : 'Word');
  if (!g || !c) {
    return renderStageCard({ layout: 'A', hue, eyebrow: 'Daily puzzles', headline: 'Mind Loft', sub: 'Free daily puzzles. No sign-up to play.', url: 'mindloftdaily.com', cta: 'Play free' });
  }
  // THE END CARD'S OWN BAND, AND ONE SENTENCE (owner, 2026-10-07). The band is
  // the curtain a finished game ends on: the category colour edge to edge, its
  // dark ink, the verdict's weight. It says the one thing the link is for.
  const pad = 56;
  const name = clamp(c.name, 20);
  const fig = challengeFig(c);
  const line = c.won && c.t != null ? `${name} solved ${g.name} in ${fig}.`
    : c.won ? `${name} solved ${g.name}: ${fig}.` : `${name} scored ${fig} on ${g.name}.`;
  const big = line.length <= 30 ? 74 : line.length <= 40 ? 64 : 54;
  const o = { hue, eyebrow: `${g.name} \u00b7 Challenge`, url: 'mindloftdaily.com', cta: 'Tap to play', pad };
  const body = Col([
    Col([
      T(line, { key: 'l', fontSize: big, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.06 }),
      T('Can you beat that?', { key: 'q', fontSize: 40, fontWeight: 700, letterSpacing: '-0.8px', marginTop: '16px' }),
    ], { key: 'curtain', background: hue, color: D.onramp, padding: '40px ' + pad + 'px 38px' }),
  ], { key: 'body', margin: '0 -' + pad + 'px' });
  return new ImageResponse(shell(o, body), { width: size.width, height: size.height, fonts: stageFonts() });
}
