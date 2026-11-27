import WantedClient from './WantedClient';
import StageTail from '../StageTail';
import { PUZZLES } from './puzzles';
import { BOARD_BY_NUM, wantedSchedule } from '@/lib/wanted-server';
import { wantedBoardForTime, wantedPublic } from '@/lib/wanted';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Wanted (launched 2026-11-26): the enormous hidden figure hunt. One huge crowd
// scene made of districts, with Otis, his friends, lost things and odd scenes
// hidden in every one, and a crowd hunting the same page (owner, 2026-11-26: "as
// interesting as a where's waldo page, but humongous. It should play like
// search"). See lib/wanted.js, lib/wanted-engine.js and app/api/wanted/route.js.
// No clock and no Give up. The scene is a fixed full-screen layer drawn by the
// browser from the board's seed, so the prose below is for crawlers and for a
// reader without scripts.
//
// THE WHERE'S WALDO REFERENCE IS A COMPARISON, NOTHING MORE (owner, 2026-11-26:
// "The description should reference where's Waldo"). Copy may say Wanted is in
// the spirit of those books. It never says Waldo is here, and nobody in the
// scene is drawn like him: the star is Otis, our own character.

export const metadata = {
  title: "Free Giant Hidden Picture Hunt Like Where's Waldo: Wanted | Mind Loft",
  description: "A free seek-and-find puzzle in the spirit of Where's Waldo, only enormous: one giant crowd scene, hundreds of things to find, and everyone hunting it at once.",
  alternates: { canonical: '/wanted' },
  openGraph: {
    images: [{ url: '/og/wanted.png', width: 1200, height: 630, alt: 'Wanted, the giant hidden picture puzzle from Mind Loft' }],
    title: 'Wanted: The Giant Hidden Picture Puzzle',
    description: "In the spirit of Where's Waldo, only the page is the size of a town. Find Otis, his friends, and hundreds of other things before the crowd does.",
    url: '/wanted',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/wanted.png'],
    card: 'summary_large_image',
    title: 'Wanted: The Giant Hidden Picture Puzzle',
    description: "In the spirit of Where's Waldo, only enormous. One giant crowd scene and hundreds of things to find.",
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Wanted',
  alternateName: 'Wanted: The Giant Hidden Picture Puzzle',
  url: `${SITE_URL}/wanted`,
  description: "A free hidden picture puzzle on an enormous scale, in the spirit of Where's Waldo. Each board is one giant crowd scene made of sixteen districts, such as a fairground, a beach, and a harbor, with more than 250 things to find: Otis in his green cap and orange scarf, his friend Mabel, his dog Biscuit, lost things, odd scenes, and one-of-a-kind people. Everyone searches the same scene; every find is a 100 point pot split among the players who make it.",
  genre: ['Hidden object', 'Seek and find', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  image: `${SITE_URL}/og/wanted.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('wanted'),
    { '@type': 'ListItem', position: 3, name: 'Wanted' },
  ],
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function WantedPage({ searchParams }) {
  const wins = await wantedSchedule();
  const current = wins[wins.length - 1];
  // ?b=<board> opens a board that has opened; ?p=<site day> (the archive's
  // link) opens the board that was up at the end of that Eastern day.
  let win = current;
  const b = Number(searchParams && searchParams.b);
  const pn = Number(searchParams && searchParams.p);
  if (Number.isInteger(b) && b > 0) win = wins.find((w) => w.num === b) || current;
  else if (Number.isInteger(pn) && pn > 0) {
    const day = PUZZLES.find((d) => d.num === pn);
    if (day) win = wantedBoardForTime(wins, Date.parse(day.live + 'T23:59:00-05:00')) || current;
  }
  const board = win ? BOARD_BY_NUM.get(win.num) : null;
  const past = wins.filter((w) => w.num !== (win && win.num)).map((w) => ({ num: w.num, closes: w.closes })).reverse();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main>
        <h1>Wanted: The Giant Hidden Picture Puzzle</h1>
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
          <h2>About Wanted</h2>
          <p>Wanted is a free hidden picture puzzle from Mind Loft, a seek-and-find in the spirit of Where&rsquo;s Waldo, only on an enormous scale. Each board is one giant crowd scene made of sixteen districts, such as a fairground, a beach, a market, a harbor, a ski slope, and a zoo, with close to twenty thousand little figures going about their day. Hidden in every district are Otis, in his green cap and orange scarf, his friend Mabel, his dog Biscuit, a handful of lost things, a few odd scenes, and a couple of one-of-a-kind people: more than 250 things to find on one page.</p>
          <p>Everyone searches the same scene. Every find is a pot of 100 points split among everyone who makes it, so something you find alone is worth 100 and something forty players found is worth 3. Each find tells you who found it before you, and the standings rank points first and total finds second. Plenty of people in the crowd look almost like Otis, and a wrong tap costs nothing.</p>
          <p>A board stays open until the crowd has found everything on it, however long that takes and never less than 24 hours, and the next scene opens the moment it closes with districts nobody has seen before. Drag to move around, pinch or scroll to zoom, and the drawings stay sharp however close you get. The full list waits behind a button. There is no clock and no Give up. No app, no signup, no download.</p>
        </section>
        {board && <WantedClient key={board.num} puzzle={wantedPublic(board)} win={win} currentNum={current.num} past={past} />}
      </main>
      <StageTail self="wanted" />
    </>
  );
}
