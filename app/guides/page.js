// /guides: the Puzzle Guides hub (owner, 2026-11-25). One row per how-to
// guide, grouped by category. See lib/guides.js for why the guides exist,
// where they are linked from, and how to add one.

import { GuidesHub } from './GuideViews';
import { GUIDES, GUIDE_CATS } from '@/lib/guides';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { SITE_URL } from '@/lib/site';

const TITLE = 'Puzzle Guides: How to Solve Sudoku, Nonograms, and More | Mind Loft';
const H1 = 'Puzzle Guides: How to Solve Every Daily';
const DESCRIPTION = 'Free how-to guides for sudoku variants, killer sudoku, windoku, kakuro, nonograms, slitherlink, acrostics, and logic grids. Learn the rules, then play free.';
const LEDE = 'Short, plain guides to the puzzles on Mind Loft: the rules, a method that works, the techniques that open hard boards, and the mistakes that cost the most time. Each one ends with a free daily board to try it on.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/guides' },
  openGraph: { title: H1, description: DESCRIPTION, url: '/guides', type: 'website', siteName: 'Mind Loft' },
  twitter: { card: 'summary_large_image', title: H1, description: DESCRIPTION },
};

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

export default function GuidesPage() {
  const live = GUIDES.filter((g) => DAILY_GAME_MAP[g.game]);
  const groups = GUIDE_CATS
    .map((c) => [c === 'Numbers' ? 'Number Puzzles' : c === 'Word' ? 'Word Puzzles' : c === 'Logic' ? 'Logic Puzzles' : c,
      live.filter((g) => g.cat === c).map((g) => ({ slug: g.slug, h1: g.h1, description: g.description, gameName: DAILY_GAME_MAP[g.game].name }))])
    .filter(([, l]) => l.length);
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: H1,
        url: `${SITE_URL}/guides`,
        hasPart: live.map((g) => ({ '@type': 'Article', headline: g.h1, url: `${SITE_URL}/guides/${g.slug}` })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Puzzle Guides', item: `${SITE_URL}/guides` },
        ],
      })}
      <GuidesHub h1={H1} lede={LEDE} groups={groups} />
    </>
  );
}
