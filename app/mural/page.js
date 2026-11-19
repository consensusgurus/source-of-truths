import MuralClient from './MuralClient';

// Mural (launched 2026-11-19): one 10,000 piece jigsaw a day that everyone on
// the site builds together. Mural runs noon to noon Eastern. See lib/mural-shared.js for the
// schedule and scoring, lib/mural.js and migration 69 for the server side.
// There is no clock and no Give up here by owner ruling.

export const metadata = {
  title: 'Mural: A 10,000 Piece Online Jigsaw Puzzle Everyone Builds Together | Mind Loft',
  description: 'Mural is a free daily online jigsaw puzzle with 10,000 pieces that every player builds together. Place pieces, score more for the hard ones and for being first, and watch the picture fill in. New every day at noon ET. No app, no signup.',
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

export default function Page() {
  return (
    <main>
      <h1>Mural: A 10,000 Piece Jigsaw Puzzle Everyone Builds Together</h1>
      <p>Mural is a free daily online jigsaw puzzle with 10,000 pieces that every player builds together. Place pieces, score more for the hard ones and for being first, and watch the picture fill in. New every day at noon ET. No app, no signup.</p>
      <MuralClient kind="mural" />
    </main>
  );
}
