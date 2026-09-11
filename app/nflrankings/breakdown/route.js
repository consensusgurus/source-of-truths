// The condensed one-page breakdown PDF. Builder in lib/gridiron-pdf.js.
import { buildGridironPdf } from '@/lib/gridiron-pdf';
import { computeComposite, builtAtFor } from '@/lib/gridiron';
import { GRIDIRON } from '@/lib/gridiron-data';
import { SOT_URL } from '@/lib/site';

export const runtime = 'nodejs';

export async function GET() {
  const { ranked, columns, tierShare, depth } = computeComposite(GRIDIRON.nfl, 'nfl');
  // Same columns the page renders: the three pillars, each with its sources.
  const PILLAR_ORDER = ['results', 'market', 'model'];
  const sources = [...columns].sort(
    (a, b) => PILLAR_ORDER.indexOf(a.tier) - PILLAR_ORDER.indexOf(b.tier)
  );

  const bytes = buildGridironPdf({
    ranked, sources, tierShare, depth,
    fetchedAt: builtAtFor('nfl'),
    title: 'NFL Consensus Rankings',
    eyebrow: '2026 season',
    url: `${SOT_URL.replace(/^https?:\/\//, '')}/nflrankings`,
  });

  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="nfl-consensus-power-rankings.pdf"',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
