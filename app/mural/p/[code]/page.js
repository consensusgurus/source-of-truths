import MuralClient from '../../MuralClient';

// A PRIVATE MURAL (owner, 2026-11-19): /mural/p/<code>, the link a player shares.
// The same board and engine as Mural, on a board only the people invited build.
// Not indexed: the link is the invitation.

export const metadata = {
  title: 'Private Mural | Mind Loft',
  description: 'A private jigsaw mural on Mind Loft, built together by the people who have the link.',
  robots: { index: false, follow: false },
  openGraph: {
    images: [{ url: '/og/mural.png', width: 1200, height: 630, alt: 'A private jigsaw mural on Mind Loft' }],
    title: 'Join My Private Mural',
    description: 'A jigsaw puzzle we build together, piece by piece. Open the link and help finish the picture.',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: { images: ['/og/mural.png'], card: 'summary_large_image', title: 'Join My Private Mural', description: 'A jigsaw puzzle we build together, piece by piece.' },
};

export default function Page({ params }) {
  const code = String((params && params.code) || '').toLowerCase();
  return (
    <main>
      <h1>Private Mural</h1>
      <MuralClient kind="mural" priv={code} />
    </main>
  );
}
