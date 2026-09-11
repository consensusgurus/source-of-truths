// One-pager PNG of the full MLB consensus, all 30 teams.
// Shared renderer in app/gridiron-poster.jsx; see it for the Satori constraints,
// including why the poster carries NO team logos (owner rule, 2026-09-04): the
// live page and the phone cards show them, but Satori fetches every remote image
// at render time, so thirty of them would be thirty ways for the route to fail.
import { renderGridironPoster } from '@/app/gridiron-poster';
import { GRIDIRON } from '@/lib/gridiron-data';
import { builtAtFor } from '@/lib/gridiron';

export const runtime = 'nodejs';

export async function GET() {
  return renderGridironPoster({
    block: GRIDIRON.mlb,
    sport: 'mlb',
    fetchedAt: builtAtFor('mlb'),
    title: 'MLB Consensus Rankings',
    eyebrow: '2026 season',
    url: 'sourceoftruths.com/mlbrankings',
  });
}
