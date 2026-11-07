import { Suspense } from 'react';
import SawClient from './SawClient';
import StageTail from '../StageTail';
import { isStageServer } from '@/lib/stage';
import { PUZZLES } from './puzzles';
import { T } from '@/lib/theme';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Saw launched 2026-11-06 as the second daily jigsaw, Jig's tall sibling: one
// PORTRAIT Wikimedia Commons featured photograph a day, cut taller than wide,
// played exactly like Jig (from 2026-11-07), raced on the clock.
//
// /saw is the canonical, evergreen URL. This server page filters live<=today
// before handing puzzles to the client, so a future day's photo title never
// reaches a browser (and /api/saw/img refuses a day that is not live).

const baseMetadata = {
  title: 'Free Daily Portrait Jigsaw Puzzle Online: Saw | Mind Loft',
  description:
    'A free daily online jigsaw on a tall photo: a new portrait picture every day, cut into 77 or 80 pieces that snap into place. Race the clock, no signup.',
  alternates: { canonical: '/saw' },
  openGraph: {
    images: [{ url: '/og/saw.png', width: 1200, height: 630, alt: 'Saw, a daily jigsaw puzzle from Mind Loft' }],
    title: 'Saw: The Tall Daily Jigsaw',
    description:
      'A new portrait photograph every day, cut into interlocking pieces. Put it back together faster than everyone else. A free daily jigsaw from Mind Loft.',
    url: '/saw',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/saw.png'],
    card: 'summary_large_image',
    title: 'Saw: The Tall Daily Jigsaw',
    description: 'One tall photo, cut the same way for everyone, against the clock. How fast can you put it together?',
  },
};

// A PAST board (/saw?p=N) is its own page for search: it names its photo in the
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
  const url = `/saw?p=${p.num}`;
  const img = `/api/saw/img?n=${p.num}&w=960`;
  const title = `Jigsaw Puzzle: ${p.name} | Saw No. ${p.num}, Mind Loft`;
  const description = `${p.name}: a free ${pieces}-piece online jigsaw puzzle on a portrait photo, Saw No. ${p.num} from ${p.dateLabel}. A Wikimedia Commons featured photo by ${p.by}. Play it free, no app or signup.`;
  const short = `${p.name}, cut into ${pieces} pieces. Play this past daily jigsaw free.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      images: [{ url: img, width: 960, alt: `${p.name}, the photo in Saw No. ${p.num}` }],
      title: `Saw No. ${p.num}: ${p.name}`,
      description: short,
      url,
      type: 'website',
      siteName: 'Mind Loft',
    },
    twitter: { images: [img], card: 'summary_large_image', title: `Saw No. ${p.num}: ${p.name}`, description: short },
  };
}

const commonsFile = (t) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(t.replace(/ /g, '_'))}`;

function boardJsonLd(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: `Saw No. ${p.num}: ${p.name}`,
    caption: `${p.name}, a ${p.cols * p.rows}-piece jigsaw puzzle`,
    contentUrl: `${SITE_URL}/api/saw/img?n=${p.num}`,
    url: `${SITE_URL}/saw?p=${p.num}`,
    acquireLicensePage: commonsFile(p.t),
    creditText: `${p.by}, Wikimedia Commons`,
    creator: { '@type': 'Person', name: p.by },
    datePublished: p.live,
  };
}

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Saw',
  alternateName: 'Saw: Daily Portrait Jigsaw Puzzle',
  url: `${SITE_URL}/saw`,
  description:
    'A free daily online jigsaw puzzle: a new portrait photograph every day, cut into 77 or 80 interlocking pieces, the same cut for everyone, dragged into place on the board. Finish the picture for a perfect score; ties break on fastest time.',
  genre: ['Jigsaw puzzle', 'Puzzle', 'Casual game'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1 },
  image: `${SITE_URL}/og/saw.png`,
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
    categoryCrumb('saw'),
    { '@type': 'ListItem', position: 3, name: 'Saw' },
  ],
};

function boardCrumbs(p) {
  return {
    ...breadcrumbJsonLd,
    itemListElement: [
      ...breadcrumbJsonLd.itemListElement.slice(0, 2),
      { '@type': 'ListItem', position: 3, name: 'Saw', item: `${SITE_URL}/saw` },
      { '@type': 'ListItem', position: 4, name: `No. ${p.num}: ${p.name}` },
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
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: '0 0 8px' }}>Saw launches {first ? first.dateLabel : 'soon'}.</h1>
        <p style={{ fontSize: 15, color: T.muted, fontWeight: 600, lineHeight: 1.5, margin: '0 0 18px' }}>
          The tall daily jigsaw: a new portrait photograph every day, cut into interlocking pieces. Come back when the first picture drops.
        </p>
        <a href="/" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline' }}>See the other daily puzzles &rarr;</a>
      </div>
    </div>
  );
}

export default function SawPage({ searchParams }) {
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
        <SawClient key={forceNum || 'today'} puzzles={visiblePuzzles} forceNum={forceNum} />
      </Suspense>
      <StageTail self="saw" stage={isStageServer('saw', searchParams)} />
    </>
  );
}
