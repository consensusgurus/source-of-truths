// app/collegefootballrankings/page.js
//
// The college football consensus, EVERY FBS TEAM (owner rule, 2026-09-04,
// raised from a top 50). Its NFL sibling is /nflrankings; the two share
// GridironTable and differ only in copy and which slice of the snapshot they
// render. Rules in CLAUDE-RANKINGS.md.
//
// The team count is read off the board rather than written into the copy, for
// the reason the layout rules give for the callouts: the FBS changes
// membership most years, and a number typed into a title goes stale silently
// while a number computed from the board cannot.

import RankingsStage from '@/app/RankingsStage';
import SotHeader from '@/app/SotHeader';
import StageFooter from '@/app/StageFooter';
import GridironTable from '@/app/GridironTable';
import PageViewBeacon from '@/app/PageViewBeacon';
import { GRIDIRON } from '@/lib/gridiron-data';
import { computeComposite, builtAtFor } from '@/lib/gridiron';
import { SOT_URL } from '@/lib/site';

const TITLE = 'College Football Consensus Rankings: Every FBS Team | Source of Truths';
const DESCRIPTION =
  'All 138 FBS teams rated on results, betting markets and analytics models, with no polls: what happened, what money says and what the models say, each in points and shown side by side. Power rankings without the voters.';

// Share copy is written for the moment someone sees it in a feed, so it leads
// with what makes the page different (the consensus, and that the disagreement
// is visible) rather than repeating the page title. The site name already rides
// along in `siteName`, so the share title does not carry the "| Mind Loft".
// "Every bowl team" is the hook: everyone ranks 25, a few rank 50, and nobody
// publishes a rated board that runs all the way to the bottom of the FBS.
const SHARE_TITLE = 'The College Football Consensus: Every Bowl Team, Ranked';
// Kept under ~200 characters: Twitter truncates a card description around there.
const SHARE_DESCRIPTION =
  'All 138 FBS teams rated on results, betting markets and analytics models, no polls. Every team in points better than average, with the résumé and the market side by side so you can see where they disagree.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Absolute, on the old host: these pages are canonical there (see lib/site.js).
  alternates: { canonical: `${SOT_URL}/collegefootballrankings` },
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: `${SOT_URL}/collegefootballrankings`,
    type: 'website',
    siteName: 'Source of Truths',
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export default function CollegeFootballRankingsPage() {
  const { ranked } = computeComposite(GRIDIRON.cfb, 'cfb');
  const N = ranked.length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `College Football Rankings Consensus: All ${N} FBS Teams`,
    url: `${SOT_URL}/collegefootballrankings`,
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
      { '@type': 'ListItem', position: 2, name: 'College Football Consensus Rankings' },
    ],
  };

  return (
    <RankingsStage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <PageViewBeacon id="cfb-rankings" />
      <SotHeader active="cfb" />
      <div className="rk-col">
        <div className="rk-head">
          <h1>College football <span>consensus, all {N} bowl teams</span></h1>
          <p className="rk-lede">
            Results, betting markets and analytics models, scored into one rating in points. No
            polls: a score, a price and a measurement each answer to something real, while poll
            voters lean on reputation and preseason expectation. Every team that can play in a bowl
            is rated, not just the ones already being talked about.
          </p>
          <p className="rk-stamp">
            <i>Updated</i>
            <span>
              <b>This board now rates every FBS team</b>, where it used to stop at 50, the NFL
              consensus is current for the season too, and the{' '}
              <a href="/mlbrankings">MLB consensus</a> has joined them.
            </span>
          </p>
        </div>

        <GridironTable
          data={GRIDIRON.cfb}
          fetchedAt={builtAtFor('cfb')}
          sport="cfb"
          eyebrow="College football &middot; FBS &middot; 2026 season"
          boardTitle={`Consensus, all ${N} FBS teams`}
        />

        <div className="rk-acts">
          <a className="rk-btn p" href="/collegefootballrankings/breakdown" target="_blank" rel="noopener">
            Download the breakdown (PDF)
          </a>
          <a className="rk-btn s" href="/collegefootballrankings/poster-image" target="_blank" rel="noopener">
            Share image
          </a>
          <span className="rk-fine">
            All {N} teams, every source column. The share image is the ranking only.
          </span>
        </div>

        <p className="rk-cross">
          Looking for the pros? See the{' '}
          <a href="/nflrankings">NFL consensus rankings</a>.
        </p>
      </div>
      <StageFooter />
    </RankingsStage>
  );
}
