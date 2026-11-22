import CrayonClient from './CrayonClient';

// Crayon (owner, 2026-11-22): color a simple outline picture with 96 colors,
// then play it as a jigsaw on the kids Puzzle Shelf (My Pictures). Not a
// daily and not scored: no registry row, only a view count (kids-crayon).

const DESC = 'A free coloring game for kids: pick a simple picture, color it with 96 colors using fill, a crayon that stays inside the lines, and an eraser, then play it as your own jigsaw puzzle. No sign-up, no ads.';

export const metadata = {
  title: 'Crayon: Free Coloring Pages That Turn Into Jigsaws | Mind Loft Kids',
  description: DESC,
  alternates: { canonical: '/kids/crayon' },
  openGraph: { title: 'Crayon | Mind Loft Kids', description: DESC, url: '/kids/crayon', type: 'website', siteName: 'Mind Loft', images: ['/kids/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'Crayon | Mind Loft Kids', description: DESC, images: ['/kids/opengraph-image'] },
};

// The browser chrome takes the kids butter ground; see html:has(.kd).
export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 5, userScalable: true, viewportFit: 'cover', themeColor: '#fff6e0' };

export default function CrayonPage() {
  return <CrayonClient />;
}
