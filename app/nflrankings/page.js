// app/nflrankings/page.js
//
// The NFL consensus ranking. Its college sibling is /collegefootballrankings;
// the two share GridironTable and differ only in copy and which slice of the
// snapshot they render. Rules in CLAUDE-RANKINGS.md.

import RankingsStage from '@/app/RankingsStage';
import SotHeader from '@/app/SotHeader';
import StageFooter from '@/app/StageFooter';
import GridironTable from '@/app/GridironTable';
import PageViewBeacon from '@/app/PageViewBeacon';
import { GRIDIRON } from '@/lib/gridiron-data';
import { computeComposite, builtAtFor } from '@/lib/gridiron';
import { SOT_URL } from '@/lib/site';

const TITLE = 'NFL Consensus Rankings: All 32 Teams | Source of Truths';
const DESCRIPTION =
  'All 32 teams rated on results, betting markets and analytics models, with no media polls: what happened, what money says and what the models say, each in points and shown side by side. Power rankings without the voters.';

// Share copy is written for the moment someone sees it in a feed, so it leads
// with what makes the page different (the consensus, and that the disagreement
// is visible) rather than repeating the page title. The site name already rides
// along in `siteName`, so the share title does not carry the "| Mind Loft".
const SHARE_TITLE = 'The NFL Consensus, All 32 Teams';
// Kept under ~200 characters: Twitter truncates a card description around there.
const SHARE_DESCRIPTION =
  'The NFL rated on results, betting markets and analytics models, no media polls. Every team in points better than average, with the résumé and the market side by side so you can see exactly where they disagree.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Absolute, on the old host: these pages are canonical there (see lib/site.js).
  alternates: { canonical: `${SOT_URL}/nflrankings` },
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: `${SOT_URL}/nflrankings`,
    type: 'website',
    siteName: 'Source of Truths',
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export default function NflRankingsPage() {
  const { ranked } = computeComposite(GRIDIRON.nfl, 'nfl');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'NFL Consensus Rankings',
    url: `${SOT_URL}/nflrankings`,
    description: DESCRIPTION,
    numberOfItems: ranked.length,
    itemListElement: ranked.map((r) => ({
      '@type': 'ListItem', position: r.rank, name: r.team,
    })),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Source of Truths Sports Rankings', item: `${SOT_URL}/collegefootballrankings` },
      { '@type': 'ListItem', position: 2, name: 'NFL Consensus Rankings' },
    ],
  };

  return (
    <RankingsStage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PageViewBeacon id="nfl-rankings" />
      <SotHeader active="nfl" />
      <div className="rk-col">
        <div className="rk-head">
          <h1>NFL <span>consensus rankings</span></h1>
          <p className="rk-lede">
            Results, betting markets and analytics models, scored into one rating in points. No
            media polls: a score, a price and a measurement each answer to something real, while
            media voters lean on reputation and on last season.
          </p>
          <p className="rk-stamp">
            <i>Updated</i>
            <span>
              <b>This board is current for the 2026 season</b>, the college football consensus now
              rates every FBS team rather than a top 50, and the{' '}
              <a href="/mlbrankings">MLB consensus</a> has joined them.
            </span>
          </p>
        </div>

        <GridironTable
          data={GRIDIRON.nfl}
          fetchedAt={builtAtFor('nfl')}
          sport="nfl"
          eyebrow="NFL &middot; 2026 season"
          boardTitle="Consensus 1 through 32"
        />

        <div className="rk-acts">
          <a className="rk-btn p" href="/nflrankings/breakdown" target="_blank" rel="noopener">
            Download the breakdown (PDF)
          </a>
          <a className="rk-btn s" href="/nflrankings/poster-image" target="_blank" rel="noopener">
            Share image
          </a>
          <span className="rk-fine">
            One page, every source column. The share image is the ranking only.
          </span>
        </div>

        <p className="rk-cross">
          Looking for college? See the{' '}
          <a href="/collegefootballrankings">college football consensus, every FBS team</a>.
        </p>
      </div>
      <StageFooter />
    </RankingsStage>
  );
}
