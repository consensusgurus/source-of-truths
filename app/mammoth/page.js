import MegaClient from '../MegaClient';
import StageTail from '../StageTail';
import { PUZZLES } from './puzzles';
import { megaBoard, megaSchedule, publicBoard } from '@/lib/mega-server';
import { megaBoardForTime } from '@/lib/mega';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mammoth (launched 2026-11-21): the massive 6x6 sudoku, one enormous board of
// overlapping sudokus that everyone plays their own copy of. See lib/mega.js for
// the rules and app/api/mega/route.js for the crowd. No clock and no Give up, as
// on Search. The board is a fixed full-screen layer, so the prose below is for
// crawlers and for a reader without scripts.
//
// Only the one board being played reaches the browser, and never its solution:
// the open board, or a past one asked for with ?b=<num> (or ?p=<site day> from
// the archive). Boards that have not opened never leave the server.

export const metadata = {
  title: 'Free Giant 6x6 Sudoku, 257 Linked Grids: Mammoth | Mind Loft',
  description: 'A free giant mini sudoku: 257 linked 6x6 grids on one enormous board. Solve the ones nobody else does. No clock, no signup, new boards all the time.',
  alternates: { canonical: '/mammoth' },
  openGraph: {
    images: [{ url: '/og/mammoth.png', width: 1200, height: 630, alt: 'Mammoth, the giant field of linked 6x6 sudokus from Mind Loft' }],
    title: 'Mammoth: 257 Linked 6x6 Sudokus',
    description: 'A field of 257 overlapping 6x6 sudokus on one enormous board. Every one is a 100 point pot split among the players who solve it.',
    url: '/mammoth',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mammoth.png'],
    card: 'summary_large_image',
    title: 'Mammoth: 257 Linked 6x6 Sudokus',
    description: 'A field of 257 overlapping 6x6 sudokus on one enormous board. Every one is a 100 point pot split among the players who solve it.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mammoth',
  alternateName: 'Mammoth: 257 Linked 6x6 Sudokus',
  url: `${SITE_URL}/mammoth`,
  description: 'A free giant mini sudoku. Each board is a field of 257 6x6 sudokus (digits 1 to 6, boxes two rows by three) that overlap at their corner boxes, so a digit in a shared corner counts in both. Everyone plays their own copy; every sudoku is a 100 point pot split among the players who solve it, and a board stays open until every sudoku has been solved by somebody, with no time limit. No clock, no signup.',
  genre: ['Number puzzle', 'Sudoku', 'Mini sudoku', 'Puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  image: `${SITE_URL}/og/mammoth.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('mammoth'),
    { '@type': 'ListItem', position: 3, name: 'Mammoth' },
  ],
};

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function MammothPage({ searchParams }) {
  const wins = await megaSchedule('mammoth');
  const current = wins[wins.length - 1];
  let win = current;
  const b = Number(searchParams && searchParams.b);
  const pn = Number(searchParams && searchParams.p);
  if (Number.isInteger(b) && b > 0) win = wins.find((w) => w.num === b) || current;
  else if (Number.isInteger(pn) && pn > 0) {
    const day = PUZZLES.find((d) => d.num === pn);
    if (day) win = megaBoardForTime(wins, Date.parse(day.live + 'T23:59:00-05:00')) || current;
  }
  const full = win ? megaBoard('mammoth', win.num) : null;
  const board = full ? publicBoard('mammoth', full) : null;
  const past = wins.filter((w) => w.num !== (win && win.num)).map((w) => ({ num: w.num, closes: w.closes })).reverse();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main>
        <h1>Mammoth: 257 Linked 6x6 Sudokus</h1>
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
          <h2>About Mammoth</h2>
          <p>Mammoth is a free giant mini sudoku from Mind Loft. Each board is a field of 257 small sudokus, each 6x6 with the digits 1 to 6 in boxes two rows tall and three columns wide, laid in a weave so that every sudoku shares each of its four corner boxes with a neighbor. A digit in a shared corner counts in both sudokus, so each one you finish starts the four around it. The middle rows carry few printed digits, so there is always real solving left.</p>
          <p>Everyone plays their own copy of the same board, so nobody can take a sudoku from you and it does not matter what hour you play. Nothing is marked right or wrong until a whole sudoku is full: then it either locks in or tells you something is off, with no penalty. Every sudoku is a pot of 100 points split among everyone who solves it, so one you solve alone is worth 100 and one forty players solve is worth 3. Who else solved a sudoku stays hidden until you solve it.</p>
          <p>A board stays open until every sudoku on it has been solved by at least one player, however long that takes and no sooner than 24 hours, and the next board opens the moment it closes. Every sudoku has exactly one solution, reachable by logic alone from its own printed digits. There is no clock and no Give up. No app, no signup, play free in your browser. For the same idea in full 9x9 sudokus, play <a href="/colossus">Colossus</a>. For one quick 6x6 on the clock, try <a href="/sixes">Sixes</a>.</p>
        </section>
        {board && <MegaClient key={board.num} game="mammoth" board={board} win={win} currentNum={current.num} past={past} />}
      </main>
      <StageTail self="mammoth" />
    </>
  );
}
