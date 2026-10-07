import { ImageResponse } from 'next/og';
import { renderStageCard, stageFonts, shell, hueFor, clamp, size, D, T, Row, Col } from '@/lib/og-stage-card';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { decodeChallenge, challengeFig } from '@/lib/challenge';

// THE CHALLENGE LINK'S PREVIEW (owner, 2026-10-07): what a messaging app draws
// when the link is pasted. It names the sender and the figure, never the answer.
//
// THE NAME AND THE FIGURE ARE THE SAME SIZE (owner, same day). The first cut
// used the stock "result to beat" layout, whose figure is three times its
// headline: in an iMessage bubble the time shouted and the name could not be
// read. Two things on this card matter equally, so they are set equally, and
// both are large enough to survive the ~300px a message bubble gives them.
export const runtime = 'nodejs';

export async function GET(req) {
  const u = new URL(req.url);
  const g = DAILY_GAME_MAP[u.searchParams.get('g') || ''] || null;
  const c = decodeChallenge(u.searchParams.get('vs') || '');
  const hue = hueFor(g ? g.cat : 'Word');
  if (!g || !c) {
    return renderStageCard({ layout: 'A', hue, eyebrow: 'Daily puzzles', headline: 'Mind Loft', sub: 'Free daily puzzles. No sign-up to play.', url: 'mindloftdaily.com', cta: 'Play free' });
  }
  const pad = 56;
  const name = clamp(c.name, 20);
  const big = name.length <= 9 ? 104 : name.length <= 13 ? 82 : name.length <= 17 ? 64 : 54;
  const o = { hue, eyebrow: `${g.name} · Challenge`, url: 'mindloftdaily.com', cta: 'Tap to play', pad };
  const body = Col([
    Row([
      T(name, { key: 'n', fontSize: big, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1 }),
      T(challengeFig(c), { key: 'f', fontSize: big, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1, marginLeft: '36px', flex: 'none' }),
    ], { key: 'curtain', alignItems: 'center', justifyContent: 'space-between', background: hue, color: D.onramp, padding: '44px ' + pad + 'px' }),
    T(`Can you beat that on ${g.name}?`, { key: 'q', fontSize: 46, fontWeight: 800, letterSpacing: '-1.2px', padding: '30px ' + pad + 'px 0' }),
  ], { key: 'body', margin: '0 -' + pad + 'px' });
  return new ImageResponse(shell(o, body), { width: size.width, height: size.height, fonts: stageFonts() });
}
