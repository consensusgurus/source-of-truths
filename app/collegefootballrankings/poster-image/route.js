// One-sheet PNG of the whole FBS consensus, every bowl team.
// Shared renderer in app/gridiron-poster.jsx; see it for the Satori constraints
// and for why the sheet gains columns rather than height as the board deepens.
import { renderGridironPoster } from '@/app/gridiron-poster';
import { GRIDIRON } from '@/lib/gridiron-data';
import { builtAtFor } from '@/lib/gridiron';

export const runtime = 'nodejs';

export async function GET() {
  return renderGridironPoster({
    block: GRIDIRON.cfb,
    sport: 'cfb',
    fetchedAt: builtAtFor('cfb'),
    title: 'College Football Consensus: Every Bowl Team',
    eyebrow: 'FBS · 2026 season',
    url: 'sourceoftruths.com/collegefootballrankings',
  });
}
