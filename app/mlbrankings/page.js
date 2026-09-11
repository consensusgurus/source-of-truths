// app/mlbrankings/page.js
//
// The MLB consensus ranking, the third page on the framework after
// /collegefootballrankings and /nflrankings. All three share GridironTable and
// the engine in lib/gridiron.js; baseball differs in what the market states (a
// moneyline, not a spread) and in how much results are worth. Rules in
// CLAUDE-RANKINGS.md, sections 2e and 3.

import RankingsStage from '@/app/RankingsStage';
import SotHeader from '@/app/SotHeader';
import StageFooter from '@/app/StageFooter';
import GridironTable from '@/app/GridironTable';
import PageViewBeacon from '@/app/PageViewBeacon';
import { GRIDIRON } from '@/lib/gridiron-data';
import { computeComposite, builtAtFor } from '@/lib/gridiron';
import { SOT_URL } from '@/lib/site';

const TITLE = 'MLB Consensus Rankings: All 30 Teams | Source of Truths';
const DESCRIPTION =
  'All 30 teams rated on results, betting markets and analytics models, with no media polls: what happened, what money says and what the models say, each in runs and shown side by side. Power rankings without the voters.';

const SHARE_TITLE = 'The MLB Consensus, All 30 Teams';
// Kept under ~200 characters: Twitter truncates a card description around there.
const SHARE_DESCRIPTION =
  'Every MLB team rated on results, betting markets and analytics models, no media polls. In runs better than average, with the résumé and the market side by side so you can see where they disagree.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Absolute, on the old host: these pages are canonical there (see lib/site.js).
  alternates: { canonical: `${SOT_URL}/mlbrankings` },
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: `${SOT_URL}/mlbrankings`,
    type: 'website',
    siteName: 'Source of Truths',
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export default function MlbRankingsPage() {
  const { ranked } = computeComposite(GRIDIRON.mlb, 'mlb');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MLB Consensus Rankings',
    url: `${SOT_URL}/mlbrankings`,
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
      { '@type': 'ListItem', position: 2, name: 'MLB Consensus Rankings' },
    ],
  };

  return (
    <RankingsStage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PageViewBeacon id="mlb-rankings" />
      <SotHeader active="mlb" />
      <div className="rk-col">
        <div className="rk-head">
          <h1>MLB <span>consensus rankings</span></h1>
          <p className="rk-lede">
            Results, betting markets and analytics models, scored into one rating in runs. No media
            polls: a score, a price and a measurement each answer to something real, while media
            voters lean on reputation and on last week&rsquo;s series.
          </p>
          <p className="rk-stamp">
            <i>New</i>
            <span>
              <b>Baseball is not football, and the weights say so.</b> Results carry 15% here
              against football&rsquo;s 40%, because a run differential over 140 games says less
              about the next 20 than the market already does. The rating is in runs, and the market
              pillar is fit to closing moneylines rather than to a spread.
            </span>
          </p>
        </div>

        <GridironTable
          data={GRIDIRON.mlb}
          fetchedAt={builtAtFor('mlb')}
          sport="mlb"
          eyebrow="MLB &middot; 2026 season"
          boardTitle="Consensus 1 through 30"
        />

        <div className="rk-acts">
          <a className="rk-btn p" href="/mlbrankings/breakdown" target="_blank" rel="noopener">
            Download the breakdown (PDF)
          </a>
          <a className="rk-btn s" href="/mlbrankings/poster-image" target="_blank" rel="noopener">
            Share image
          </a>
          <span className="rk-fine">
            One page, every source column. The share image is the ranking only.
          </span>
        </div>

        <p className="rk-cross">
          Looking for football? See the{' '}
          <a href="/collegefootballrankings">college football consensus</a> and the{' '}
          <a href="/nflrankings">NFL consensus</a>.
        </p>
      </div>
      <StageFooter />
    </RankingsStage>
  );
}
