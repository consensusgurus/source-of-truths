import SearchClient from './SearchClient';
import StageTail from '../StageTail';
import { PUZZLES } from './puzzles';
import { BOARD_BY_NUM, searchSchedule } from '@/lib/search-server';
import { searchBoardForTime } from '@/lib/search';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Search (launched 2026-11-20): the enormous daily word search. One big topic a
// day (700 movie titles on day one) in one huge grid that everyone shares, and
// standings ranked on unique finds, then total finds (owner, 2026-11-20). See
// lib/search.js and app/api/search/route.js. No clock and no Give up, as on
// Mural. The board is a fixed full-screen layer, so the prose below is for
// crawlers and for a reader without scripts.
//
// Only the one board being played reaches the browser: the open one, or a past
// board asked for with ?b=<num> (or ?p=<site day> from the archive). Boards that
// have not opened never leave the server.

export const metadata = {
  title: 'Free Giant Daily Word Search, 700 Words: Search | Mind Loft',
  description: 'A free word search on an enormous scale: hundreds of words on one big topic in one huge grid. Find the ones nobody else finds. New topics all the time.',
  alternates: { canonical: '/search' },
  openGraph: {
    images: [{ url: '/og/search.png', width: 1200, height: 630, alt: 'Search, the giant daily word search from Mind Loft' }],
    title: 'Search: The Giant Daily Word Search',
    description: 'Hundreds of hidden words on one big topic, one enormous grid, and a crowd hunting the same one. Find the ones nobody else finds.',
    url: '/search',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/search.png'],
    card: 'summary_large_image',
    title: 'Search: The Giant Daily Word Search',
    description: 'Hundreds of hidden words on one big topic, one enormous grid. Find the ones nobody else finds.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Search',
  alternateName: 'Search: The Giant Daily Word Search',
  url: `${SITE_URL}/search`,
  description: 'A free daily word search on an enormous scale. Each board hides hundreds of entries from one big pop culture topic, such as 700 movie titles, in one huge grid in all eight directions. Everyone plays the same grid; every entry is a 100 point pot split among the players who find it, and a board stays open until the crowd has found everything, with no time limit. No clock, no signup.',
  genre: ['Word puzzle', 'Word search', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  image: `${SITE_URL}/og/search.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('search'),
    { '@type': 'ListItem', position: 3, name: 'Search' },
  ],
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function SearchPage({ searchParams }) {
  const wins = await searchSchedule();
  const current = wins[wins.length - 1];
  // ?b=<board> opens a board that has opened; ?p=<site day> (the archive's
  // link) opens the board that was up at the end of that Eastern day.
  let win = current;
  const b = Number(searchParams && searchParams.b);
  const pn = Number(searchParams && searchParams.p);
  if (Number.isInteger(b) && b > 0) win = wins.find((w) => w.num === b) || current;
  else if (Number.isInteger(pn) && pn > 0) {
    const day = PUZZLES.find((d) => d.num === pn);
    if (day) win = searchBoardForTime(wins, Date.parse(day.live + 'T23:59:00-05:00')) || current;
  }
  const board = win ? BOARD_BY_NUM.get(win.num) : null;
  const past = wins.filter((w) => w.num !== (win && win.num)).map((w) => ({ num: w.num, theme: BOARD_BY_NUM.get(w.num).theme, closes: w.closes })).reverse();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main>
        <h1>Search: The Giant Daily Word Search</h1>
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
          <h2>About Search</h2>
          <p>Search is a free word search from Mind Loft on an enormous scale. Each board picks one big pop culture topic and hides hundreds of entries from it in one huge grid: the first is 700 movie titles in a grid a hundred letters across. Every entry runs in a straight line in any of the eight directions, backward too, with its spaces and punctuation dropped.</p>
          <p>Everyone plays the same grid. Every entry is a pot of 100 points split among everyone who finds it, so a title you find alone is worth 100 and one forty players found is worth 3. Each find tells you how many others have it, and the standings rank points first and total finds second.</p>
          <p>A board stays open until the crowd has found every entry, however long that takes and never less than 24 hours, and the next topic opens the moment it closes. The full list waits behind a button. There is no clock and no Give up. No app, no signup, play free in your browser. For a quick themed search with a stopwatch, try <a href="/scour">Scour</a>.</p>
        </section>
        {board && <SearchClient key={board.num} puzzle={board} win={win} currentNum={current.num} past={past} />}
      </main>
      <StageTail self="search" />
    </>
  );
}
