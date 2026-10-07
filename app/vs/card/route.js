import { renderStageCard, hueFor, clamp } from '@/lib/og-stage-card';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { decodeChallenge, challengeFig } from '@/lib/challenge';

// THE CHALLENGE LINK'S PREVIEW (owner, 2026-10-07): what a messaging app draws
// when the link is pasted. Layout B is "a result to beat", which is exactly
// what this is. It names the sender and the figure and never the answer.
export const runtime = 'nodejs';

export async function GET(req) {
  const u = new URL(req.url);
  const g = DAILY_GAME_MAP[u.searchParams.get('g') || ''] || null;
  const c = decodeChallenge(u.searchParams.get('vs') || '');
  const name = g ? g.name : 'Mind Loft';
  const hue = hueFor(g ? g.cat : 'Word');
  if (!g || !c) {
    return renderStageCard({ layout: 'A', hue, eyebrow: 'Daily puzzles', headline: 'Mind Loft', sub: 'Free daily puzzles. No sign-up to play.', url: 'mindloftdaily.com', cta: 'Play free' });
  }
  return renderStageCard({
    layout: 'B', hue, glyph: g.key,
    eyebrow: `${name} · Challenge`,
    headline: clamp(`${c.name} ${c.won ? 'solved' : 'played'} ${name} No. ${c.n}`, 64),
    sub: 'Same board. Can you beat that?',
    figure: challengeFig(c), figLabel: 'to beat',
    stats: [[name, g.cat || 'Daily puzzle'], ['Free', 'No sign-up to play']],
    url: 'mindloftdaily.com', cta: 'Take the challenge',
  });
}
