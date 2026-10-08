// app/about/page.js
//
// The page that says what Mind Loft is, in sentences.
//
// It exists because /terms was doing this job by accident: for the query "mind
// loft" Google returned mindloftdaily.com/terms and not the homepage, because
// the Terms page was the only page on the site whose prose actually described
// the service. Legal boilerplate is a bad answer to "what is this". This is the
// good one, and the homepage carries a short version of it above the footer.

import LegalLayout, { H2 } from '@/app/LegalLayout';
import { QUIZZES } from '@/lib/quizzes';
import { getAllSources } from '@/lib/sources';
import { SITE_URL } from '@/lib/site';

const SOURCE_COUNT = getAllSources().length;
const QUIZ_COUNT = Array.isArray(QUIZZES) ? QUIZZES.filter((q) => !q.unlisted).length : 0;

const TITLE = 'About Mind Loft';
const DESCRIPTION = `Mind Loft is a free daily brain games site: more than sixty daily word, number, logic and trivia puzzles, ${QUIZ_COUNT} timed quizzes, and consensus Top 10 Lists scored from ${SOURCE_COUNT} expert publications and rating platforms.`;

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/about',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: TITLE,
  url: `${SITE_URL}/about`,
  description: DESCRIPTION,
  mainEntity: {
    '@type': 'Organization',
    name: 'Mind Loft',
    alternateName: 'Mind Loft Daily',
    url: `${SITE_URL}`,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [
      'https://x.com/mindloftdaily',
      'https://www.instagram.com/mindloftdaily/',
    ],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    { '@type': 'ListItem', position: 2, name: 'About Mind Loft' },
  ],
};

const LINK = { color: 'inherit', textDecoration: 'underline' };

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <LegalLayout kicker="About" title="About" italic="Mind Loft">
        <p>
          Mind Loft is a free daily brain games site. It publishes a fresh slate of puzzles
          every morning, a large library of timed quizzes, and a set of consensus Top 10
          Lists built from published expert rankings. Everything on it is free to play, and
          nothing requires an account.
        </p>

        <H2>The daily puzzles</H2>
        <p>
          Every day at midnight Eastern, Mind Loft rolls over to a new slate of more than
          sixty puzzles. They run across nine categories: word, numbers, logic, trivia,
          geography, cards, arcade, crowd, and end game. On any given day that includes a
          clueless crossword, a mini crossword, several sudoku variants, a word ladder, a
          nonogram, a whodunit, a chess mate in a handful of moves, and a round where the
          answer key is what everyone else playing today said.
        </p>
        <p>
          Sunday carries a Sunday Edition of most games: a bigger grid, a longer ladder, or
          a harder position than the same game runs on a weekday. Every game keeps a full
          archive, so a puzzle you missed is still there to play.
        </p>

        <H2>The quiz library</H2>
        <p>
          Mind Loft holds {QUIZ_COUNT.toLocaleString()} timed quizzes across films, music,
          sports, geography, business, history, literature, food and drink, travel, and
          brands. The formats vary by subject: name them all against a clock, match two
          columns, fill in a blank, click a country on a map, identify a photograph, or
          answer timed multiple choice where answering faster is worth more.
        </p>
        <p>
          Finishing a game posts your result to that day's leaderboard and earns IQ Points
          toward a running rank across the whole site. You can play signed out; claiming a
          display name is optional and only affects whether you appear on the boards.
        </p>

        <H2>The Top 10 Lists</H2>
        <p>
          Mind Loft also publishes consensus Top 10 Lists: the best restaurants in a city,
          the best hotels in a region, the best films by a director, the best products in a
          category. A list is not one editor's opinion. It is a blend of published rankings
          from {SOURCE_COUNT} expert publications and rating platforms, from Michelin and
          Condé Nast Traveler to Wirecutter, Goodreads, Yelp, and Google.
        </p>

        <H2>How the consensus is scored</H2>
        <p>
          Each source ranks its own picks, and those rankings are combined with Borda
          scoring: a source's first pick earns the most points, its second slightly fewer,
          and so on down. An item a source does not list earns nothing from it. Sources
          that publish no order, an alphabetical roundup for instance, contribute a flat
          score instead of a rank. Add it up and the consensus is the items the most
          credible sources agree on most strongly, not the ones any single publication
          happened to lead with.
        </p>
        <p>
          Every source behind every list is named and linked. You can see the full roster on
          the <a href="/experts-and-aggregators" style={LINK}>Experts and Aggregators</a>{' '}
          page, and each list shows its own sources, the ranking each one published, and a
          log of every change since the list went up.
        </p>

        <H2>How Mind Loft makes money</H2>
        <p>
          Many outbound links on the list pages are affiliate links, which means a
          commission may be earned when a reader clicks through and buys something. As an
          Amazon Associate, Mind Loft earns from qualifying purchases. Rankings are decided
          before any link is attached, and commission rates play no part in them. The{' '}
          <a href="/disclosure" style={LINK}>Affiliate Disclosure</a> covers this in full.
        </p>

        <H2>Contact</H2>
        <p>
          Corrections, source suggestions, and quiz ideas are welcome. You can{' '}
          <a href="/request" style={LINK}>request a list or quiz</a>, or write to{' '}
          <a href="mailto:admin@mindloftdaily.com" style={{ color: 'inherit' }}><strong>admin@mindloftdaily.com</strong></a>. Mind Loft is also on{' '}
          <a href="https://x.com/mindloftdaily" style={LINK}>X</a> and{' '}
          <a href="https://www.instagram.com/mindloftdaily/" style={LINK}>Instagram</a>.
        </p>
      </LegalLayout>
    </>
  );
}
