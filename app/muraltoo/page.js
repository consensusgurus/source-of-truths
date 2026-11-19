import MuralClient from '../mural/MuralClient';

// MuralToo (launched 2026-11-19): one 10,000 piece jigsaw a day that everyone on
// the site builds together. MuralToo runs midnight to midnight Eastern. See lib/mural-shared.js for the
// schedule and scoring, lib/mural.js and migration 69 for the server side.
// There is no clock and no Give up here by owner ruling.

export const metadata = {
  title: 'MuralToo: A Second 10,000 Piece Online Jigsaw Puzzle, Built Together | Mind Loft',
  description: 'MuralToo is a second free daily online jigsaw puzzle with 10,000 pieces, built by every player at once. Place pieces, score more for the hard ones and for being first. New every day at midnight ET. No app, no signup.',
  alternates: { canonical: '/muraltoo' },
  openGraph: {
    images: [{ url: '/og/muraltoo.png', width: 1200, height: 630, alt: 'MuralToo, a 10,000 piece online jigsaw puzzle from Mind Loft that everyone builds together' }],
    title: 'MuralToo: A Second Giant Jigsaw Puzzle We All Build Together',
    description: 'Another 10,000 piece jigsaw puzzle, new at midnight ET, built by everyone at once.',
    url: '/muraltoo',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/muraltoo.png'],
    card: 'summary_large_image',
    title: 'MuralToo: A Second Giant Jigsaw Puzzle We All Build Together',
    description: 'Another 10,000 piece jigsaw puzzle, new at midnight ET, built by everyone at once.',
  },
};

export default function Page() {
  return (
    <main>
      <h1>MuralToo: A Second 10,000 Piece Jigsaw Puzzle, Built Together</h1>
      <p>MuralToo is a second free daily online jigsaw puzzle with 10,000 pieces, built by every player at once. Place pieces, score more for the hard ones and for being first. New every day at midnight ET. No app, no signup.</p>
      <MuralClient kind="muraltoo" />
    </main>
  );
}
