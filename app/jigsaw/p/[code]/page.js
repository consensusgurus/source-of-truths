import { notFound } from 'next/navigation';
import PhotoPage from '../../PhotoPage';
import { getMeta, linkLive } from '@/lib/photo-puzzles';

// /jigsaw/p/<code>: A PRIVATE PHOTO JIGSAW (owner, 2026-11-27: "a private puzzle with their
// contacts"; picked "Private link"). Anyone with the link plays, no signup. NEVER in search:
// noindex, nofollow, no share image of the photo, left out of every sitemap. A link turned off
// by its maker, or turned down by the admin, is a 404.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata({ params }) {
  const m = await getMeta(params.code);
  const robots = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } };
  if (!linkLive(m)) return { title: 'Jigsaw Puzzle Not Found | Mind Loft', robots };
  return {
    title: `${m.name}: A Private Jigsaw Puzzle | Mind Loft`,
    description: `${m.by || 'Someone'} made you a jigsaw puzzle on Mind Loft. Free in your browser, no signup.`,
    robots,
    openGraph: { title: `${m.by || 'Someone'} made you a jigsaw puzzle`, description: 'A private photo jigsaw on Mind Loft. Tap to play, no signup.', images: [{ url: '/og/jig-shelf.png?v=2', width: 1200, height: 630 }], siteName: 'Mind Loft', type: 'website' },
    twitter: { card: 'summary_large_image', images: ['/og/jig-shelf.png?v=2'] },
  };
}

export default async function PrivatePhotoPuzzle({ params, searchParams }) {
  const m = await getMeta(params.code);
  if (!linkLive(m)) notFound();
  return <PhotoPage meta={m} base={`/jigsaw/p/${m.code}`} pieces={Number(searchParams && searchParams.pieces)} />;
}
