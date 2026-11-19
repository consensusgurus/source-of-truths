import MuralClient from './MuralClient';
import StageTail from '../StageTail';
import { SITE_URL } from '@/lib/site';
import { categoryCrumb } from '@/lib/game-seo';

// Mural (launched 2026-11-19): one 10,000 piece jigsaw a day that everyone on
// the site builds together. Mural runs noon to noon Eastern. See lib/mural-shared.js for the
// schedule and scoring, lib/mural.js and migrations 69 and 70 for the server side.
// There is no clock and no Give up here by owner ruling. The board is a fixed
// full-screen layer, so the prose and the tail below it are for crawlers and
// for a reader without scripts.

export const metadata = {
  title: 'Free 10,000 Piece Online Jigsaw, Built Together: Mural | Mind Loft',
  description: 'A free daily 10,000 piece online jigsaw puzzle that every player builds together. Harder pieces and first placements score more. New at noon ET.',
  alternates: { canonical: '/mural' },
  openGraph: {
    images: [{ url: '/og/mural.png', width: 1200, height: 630, alt: 'Mural, a 10,000 piece online jigsaw puzzle from Mind Loft that everyone builds together' }],
    title: 'Mural: The 10,000 Piece Jigsaw Puzzle We All Build Together',
    description: 'One giant jigsaw puzzle a day, built by everyone at once. Find where your pieces go and help finish the picture.',
    url: '/mural',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/mural.png'],
    card: 'summary_large_image',
    title: 'Mural: The 10,000 Piece Jigsaw Puzzle We All Build Together',
    description: 'One giant jigsaw puzzle a day, built by everyone at once. Find where your pieces go and help finish the picture.',
  },
};

const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Mural',
  alternateName: 'Mural: The Shared 10,000 Piece Jigsaw Puzzle',
  url: `${SITE_URL}/mural`,
  description: 'A free daily online jigsaw puzzle with 10,000 pieces that every player on the site builds together. Each player gets a tray of pieces from one real photograph; placing a piece scores points, harder pieces score more, and a piece nobody has placed yet scores double. The shared picture updates every two minutes. A new Mural opens every day at noon Eastern and runs for 24 hours. No clock, no signup.',
  genre: ['Puzzle', 'Jigsaw puzzle', 'Multiplayer puzzle'],
  gamePlatform: 'Web browser',
  isAccessibleForFree: true,
  inLanguage: 'en',
  image: `${SITE_URL}/og/mural.png`,
  publisher: { '@type': 'Organization', name: 'Mind Loft', url: `${SITE_URL}` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
    categoryCrumb('mural'),
    { '@type': 'ListItem', position: 3, name: 'Mural' },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gameJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <main>
        <h1>Mural: A 10,000 Piece Jigsaw Puzzle Everyone Builds Together</h1>
        <MuralClient kind="mural" />
      </main>
      <StageTail self="mural" />
    </>
  );
}
