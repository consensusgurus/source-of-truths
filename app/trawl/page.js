import TrawlClient from './TrawlClient';
import StageTail from '../StageTail';
import { PUZZLES } from './puzzles';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Trawl (launched 2026-11-20): the enormous daily word search. One big topic a
// day (700 movie titles on day one) in one huge grid that everyone shares, and
// standings ranked on unique finds, then total finds (owner, 2026-11-20). See
// lib/trawl.js and app/api/trawl/route.js. No clock and no Give up, as on
// Mural. The board is a fixed full-screen layer, so the prose below is for
// crawlers and for a reader without scripts.
//
// Only the one board being played reaches the browser: today's, or a past day
// asked for with ?p=<num>. Future boards never leave the server.

export const metadata = {
  title: 'Free Giant Daily Word Search, 700 Words: Trawl | Mind Loft',
  description: 'A free daily word search on an enormous scale: hundreds of words on one big topic in one huge grid. Find the ones nobody else finds. New topic daily.',
  alternates: { canonical: '/trawl' },
  openGraph: {
    images: [{ url: '/og/trawl.png', width: 1200, height: 630, alt: 'Trawl, the giant daily word search from Mind Loft' }],
    title: 'Trawl: The Giant Daily Word Search',
    description: 'Hundreds of hidden words on one big topic, one enormous grid, and a crowd hunting the same one. Find the ones nobody else finds.',
    url: '/trawl',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/trawl.png'],
    card: 'summary_large_image',
    title: 'Trawl: The Giant Daily Word Search',
    description: 'Hundreds of hidden words on one big topic, one enormous grid. Find the ones nobody else finds.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Trawl',
  alternateName: 'Trawl: The Giant Daily Word Search',
  url: `${SITE_URL}/trawl`,
  description: 'A free daily word search on an enormous scale. Each day hides hundreds of entries from one big topic, such as 700 movie titles, in one huge grid in all eight directions. Everyone plays the same grid; each find shows how many players have found it, and the standings rank unique finds (ones nobody else found) first and total finds second. No clock, no signup.',
  genre: ['Word puzzle', 'Word search', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  image: `${SITE_URL}/og/trawl.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('trawl'),
    { '@type': 'ListItem', position: 3, name: 'Trawl' },
  ],
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function TrawlPage({ searchParams }) {
  const today = etTodayServer();
  const open = PUZZLES.filter((p) => p.live <= today);
  const todays = open[open.length - 1] || null;
  const n = Number(searchParams && searchParams.p);
  const asked = Number.isInteger(n) && n > 0 ? open.find((p) => p.num === n) : null;
  const puzzle = asked || todays;
  const archive = !!(puzzle && todays && puzzle.num !== todays.num);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main>
        <h1>Trawl: The Giant Daily Word Search</h1>
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
          <h2>About Trawl</h2>
          <p>Trawl is a free daily word search from Mind Loft on an enormous scale. Each day picks one big topic and hides hundreds of entries from it in one huge grid: day one is 700 movie titles in a grid a hundred letters across. Every entry runs in a straight line in any of the eight directions, backward too, with its spaces and punctuation dropped.</p>
          <p>Everyone plays the same grid. Each find tells you how many other players have found it, and the standings rank unique finds, the ones nobody else has found, ahead of total finds. The famous titles count, but the deep cuts win. Refresh to see the crowd catch up; the counts settle at midnight Eastern, when a new topic opens.</p>
          <p>The full list waits behind a button, so you can hunt with it or without it. There is no clock and no Give up. No app, no signup, play free in your browser. For a quick themed search with a stopwatch, try <a href="/scour">Scour</a>.</p>
        </section>
        {puzzle && <TrawlClient key={puzzle.num} puzzle={puzzle} archive={archive} />}
      </main>
      <StageTail self="trawl" />
    </>
  );
}
