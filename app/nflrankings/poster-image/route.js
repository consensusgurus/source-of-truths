// One-pager PNG of the full NFL consensus, all 32 teams.
// Shared renderer in app/gridiron-poster.jsx; see it for the Satori constraints.
import { renderGridironPoster } from '@/app/gridiron-poster';
import { GRIDIRON } from '@/lib/gridiron-data';
import { builtAtFor } from '@/lib/gridiron';

export const runtime = 'nodejs';

export async function GET() {
  return renderGridironPoster({
    block: GRIDIRON.nfl,
    sport: 'nfl',
    fetchedAt: builtAtFor('nfl'),
    title: 'NFL Consensus Rankings',
    eyebrow: '2026 season',
    url: 'sourceoftruths.com/nflrankings',
  });
}
