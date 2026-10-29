import { Suspense } from 'react';
import JigClient from './JigClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Jig launched 2026-10-15 as the daily jigsaw: one Wikimedia Commons featured
// photograph a day, cut into 80 interlocking pieces, raced on the clock.
//
// /jig is the canonical, evergreen URL; the dated /quiz/jig-* stubs
// canonicalize here. This server page filters live<=today before handing
// puzzles to the client, so a future day's photo title never reaches a
// browser (and /api/jig/img refuses a day that is not live).

const baseMetadata = {
  title: 'Free Daily Jigsaw Puzzle Online: Jig | Mind Loft',
  description:
    'A free daily online jigsaw puzzle: a new photo every day, cut into 80 pieces. Sort by edges or colors and race the clock. No app, no signup.',
  alternates: { canonical: '/jig' },
  openGraph: {
    images: [{ url: '/og/jig.png', width: 1200, height: 630, alt: 'Jig, a daily jigsaw puzzle from Mind Loft' }],
    title: 'Jig: The Daily Jigsaw Puzzle',
    description:
      'A new photograph every day, cut into interlocking pieces. Put it back together faster than everyone else. A free daily jigsaw from Mind Loft.',
    url: '/jig',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/jig.png'],
    card: 'summary_large_image',
    title: 'Jig: The Daily Jigsaw Puzzle',
    description: 'One photo, cut the same way for everyone, against the clock. How fast can you finish today’s picture?',
  },
};

// A PAST board (/jig?p=N) is its own page for search: it names its photo in the
// title, description and structured data, carries the photo as its share image,
// and canonicalizes to itself (owner, 2026-10-18). Today's board stays generic,
// because today's photo is the surprise and never leaves the server. A number
// that is today, future, or not a board falls back to the /jig metadata.
function archivedBoard(searchParams) {
  const n = Number(searchParams && searchParams.p);
  if (!Number.isInteger(n) || n <= 0) return null;
  const p = PUZZLES.find((x) => x.num === n);
  return p && p.live < etTodayServer() ? p : null;
}

export async function generateMetadata({ searchParams }) {
  const p = archivedBoard(searchParams);
  if (!p) return baseMetadata;
  const pieces = p.cols * p.rows;
  const url = `/jig?p=${p.num}`;
  const img = `/api/jig/img?n=${p.num}&w=960`;
  const title = `Jigsaw Puzzle: ${p.name} | Jig No. ${p.num}, Mind Loft`;
  const description = `${p.name}: a free ${pieces}-piece online jigsaw puzzle, Jig No. ${p.num} from ${p.dateLabel}. A Wikimedia Commons featured photo by ${p.by}. Play it free, no app or signup.`;
  const short = `${p.name}, cut into ${pieces} pieces. Play this past daily jigsaw free.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      images: [{ url: img, width: 960, alt: `${p.name}, the photo in Jig No. ${p.num}` }],
      title: `Jig No. ${p.num}: ${p.name}`,
      description: short,
      url,
      type: 'website',
      siteName: 'Mind Loft',
    },
    twitter: { images: [img], card: 'summary_large_image', title: `Jig No. ${p.num}: ${p.name}`, description: short },
  };
}

const commonsFile = (t) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(t.replace(/ /g, '_'))}`;

function boardJsonLd(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: `Jig No. ${p.num}: ${p.name}`,
    caption: `${p.name}, a ${p.cols * p.rows}-piece jigsaw puzzle`,
    contentUrl: `${SITE_URL}/api/jig/img?n=${p.num}`,
    url: `${SITE_URL}/jig?p=${p.num}`,
    acquireLicensePage: commonsFile(p.t),
    creditText: `${p.by}, Wikimedia Commons`,
    creator: { '@type': 'Person', name: p.by },
    datePublished: p.live,
    isPartOf: { '@type': 'CollectionPage', name: 'Jig Puzzle Shelf', url: `${SITE_URL}/jig/shelf` },
  };
}

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Jig',
  alternateName: 'Jig: Daily Jigsaw Puzzle',
  url: `${SITE_URL}/jig`,
  description:
    'A free daily online jigsaw puzzle: a new photograph every day, cut into 80 interlocking pieces, the same cut for everyone. Drag the pieces into place; finish the picture for a perfect score, and ties break on fastest time.',
  genre: ['Jigsaw puzzle', 'Puzzle', 'Casual game'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/jig.png`,
  publisher: {
    '@type': 'Organization',
    name: 'Mind Loft',
    url: `${SITE_URL}`,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('jig'),
    { '@type': 'ListItem', position: 3, name: 'Jig' },
  ],
};

function boardCrumbs(p) {
  return {
    ...breadcrumbJsonLd,
    itemListElement: [
      ...breadcrumbJsonLd.itemListElement.slice(0, 2),
      { '@type': 'ListItem', position: 3, name: 'Jig', item: `${SITE_URL}/jig` },
      { '@type': 'ListItem', position: 4, name: 'Puzzle shelf', item: `${SITE_URL}/jig/shelf` },
      { '@type': 'ListItem', position: 5, name: `No. ${p.num}: ${p.name}` },
    ],
  };
}

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function ComingSoon({ first }) {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'Manrope', system-ui, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Jig launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The daily jigsaw: a new photograph every day, cut into interlocking pieces. Come back when the first picture drops.
        </p>
        <a href="/" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function JigPage({ searchParams }) {
  const today = etTodayServer();
  const visiblePuzzles = PUZZLES.filter((p) => p.live <= today);
  if (!visiblePuzzles.length) return <ComingSoon first={PUZZLES[0]} />;
  const n = Number(searchParams && searchParams.p);
  const forceNum = Number.isInteger(n) && n > 0 ? n : null;
  const board = archivedBoard(searchParams);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(board ? boardCrumbs(board) : breadcrumbJsonLd) }}
      />
      {board && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(boardJsonLd(board)) }}
        />
      )}
      <Suspense fallback={null}>
        <JigClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="jig" stage={isStageServer('jig', searchParams)} />
    </>
  );
}
