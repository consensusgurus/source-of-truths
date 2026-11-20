import MuralClient from '../mural/MuralClient';
import StageTail from '../StageTail';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// MuralToo (launched 2026-11-19): one 4,000 piece jigsaw a day that everyone on
// the site builds together. MuralToo runs midnight to midnight Eastern; its first board opens 2026-11-20. See lib/mural-shared.js for the
// schedule and scoring, lib/mural.js and migrations 69 and 70 for the server side.
// There is no clock and no Give up here by owner ruling. The board is a fixed
// full-screen layer, so the prose and the tail below it are for crawlers and
// for a reader without scripts.

export const metadata = {
  title: 'Free Giant Online Jigsaw Puzzle at Midnight: MuralToo | Mind Loft',
  description: 'The midnight twin of Mural: a free 4,000 piece jigsaw puzzle the whole site builds together, open from midnight Eastern until it is finished. No signup.',
  alternates: { canonical: '/muraltoo' },
  openGraph: {
    images: [{ url: '/og/muraltoo.png', width: 1200, height: 630, alt: 'MuralToo, a 4,000 piece online jigsaw puzzle from Mind Loft that everyone builds together' }],
    title: 'MuralToo: A Second 4,000 Piece Jigsaw Puzzle, Built Together',
    description: 'A second giant jigsaw puzzle every day, built by everyone at once, open until it is finished.',
    url: '/muraltoo',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/muraltoo.png'],
    card: 'summary_large_image',
    title: 'MuralToo: A Second 4,000 Piece Jigsaw Puzzle, Built Together',
    description: 'A second giant jigsaw puzzle every day, built by everyone at once, open until it is finished.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'MuralToo',
  alternateName: 'MuralToo: The Second Shared 4,000 Piece Jigsaw Puzzle',
  url: `${SITE_URL}/muraltoo`,
  description: 'A free daily online jigsaw puzzle with 4,000 pieces that every player on the site builds together, the twin of Mural. Each player gets a tray of pieces from one real photograph; placing a piece scores points, harder pieces score more, and a piece nobody has placed yet scores double. The shared picture updates every two minutes. A new MuralToo opens at midnight Eastern and stays open until its last piece is placed, at least 24 hours; the next one opens when it closes. No clock, no signup.',
  genre: ['Puzzle', 'Jigsaw puzzle', 'Multiplayer puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  image: `${SITE_URL}/og/muraltoo.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('muraltoo'),
    { '@type': 'ListItem', position: 3, name: 'MuralToo' },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main>
        <h1>MuralToo: A Second 4,000 Piece Jigsaw Puzzle Everyone Builds Together</h1>
        <MuralClient kind="muraltoo" />
      </main>
      <StageTail self="muraltoo" />
    </>
  );
}
