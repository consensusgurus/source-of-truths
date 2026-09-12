import KidsHubClient from './KidsHubClient';

export const metadata = {
  title: 'Mind Loft Kids | Little puzzles, big thinking',
  description: 'Little puzzles, big thinking. Seven gentle daily puzzles that get kids counting, sorting, spotting patterns and reasoning things out, plus a shelf of matching games. Free, no sign-up, no ads, nothing counts against them.',
  alternates: { canonical: '/kids' },
  openGraph: {
    title: 'Mind Loft Kids | Little puzzles, big thinking',
    description: 'Little puzzles, big thinking. Seven gentle daily puzzles that get kids counting, sorting and spotting patterns. Free, no sign-up, nothing counts against them.',
    url: '/kids',
    type: 'website',
    siteName: 'Mind Loft',
    images: ['/kids/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', title: 'Mind Loft Kids | Little puzzles, big thinking', description: 'Little puzzles, big thinking. Seven gentle daily puzzles that get kids counting, sorting and spotting patterns. Free, no sign-up, nothing counts against them.', images: ['/kids/opengraph-image'] },
};

export default function KidsPage() {
  return <KidsHubClient />;
}
