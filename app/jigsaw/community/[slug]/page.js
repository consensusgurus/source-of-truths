import { notFound } from 'next/navigation';
import PhotoPage from '../../PhotoPage';
import { getMeta, communityIndex } from '@/lib/photo-puzzles';
import { SITE_URL } from '@/lib/site';
import { topicNoun, imgSrc } from '@/lib/photo-puzzle-shared';
import { sizeLabel } from '@/lib/jigsaw-sizes';

// /jigsaw/community/<slug>: AN APPROVED COMMUNITY PHOTO (owner, 2026-11-27: "a separate tab of
// user submitted photos", every one approved by him first). Its own indexed page, the SEO half of
// the feature: the title names the picture and its topic ("Biscuit at the Beach Jigsaw Puzzle
// (Pet and Animal Photo)"), ImageObject + BreadcrumbList JSON-LD, in the photos sitemap.
// With ?pieces=N it is the board, noindex and canonical to the plain page.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

async function load(slug) {
  const items = await communityIndex().catch(() => []);
  const row = items.find((x) => x.slug === slug);
  if (!row) return { m: null, items };
  const m = await getMeta(row.code);
  return { m: m && m.status === 'approved' && m.up ? m : null, items };
}

export async function generateMetadata({ params, searchParams }) {
  const { m } = await load(params.slug);
  if (!m) return { title: 'Jigsaw Puzzle Not Found | Mind Loft', robots: { index: false, follow: true } };
  const board = !!(searchParams && searchParams.pieces);
  const title = `${m.name} Jigsaw Puzzle (${topicNoun(m.topic)}) | Free Online | Mind Loft`;
  const description = `Play ${m.name} as a free online jigsaw puzzle, 24 to ${sizeLabel(m.max)} pieces, from a photo shared by ${m.by || 'a Mind Loft player'}. No download, no signup.`;
  const img = `${SITE_URL}${imgSrc(m.code)}&w=960`;
  return {
    title, description,
    alternates: { canonical: `/jigsaw/community/${m.slug}` },
    robots: board ? { index: false, follow: true } : undefined,
    openGraph: { title: `${m.name} Jigsaw Puzzle`, description, images: [{ url: img, alt: m.name }], url: `/jigsaw/community/${m.slug}`, type: 'website', siteName: 'Mind Loft' },
    twitter: { card: 'summary_large_image', images: [img], title: `${m.name} Jigsaw Puzzle`, description },
  };
}

export default async function CommunityPhotoPuzzle({ params, searchParams }) {
  const { m, items } = await load(params.slug);
  if (!m) notFound();
  const pieces = Number(searchParams && searchParams.pieces);
  const same = items.filter((x) => x.code !== m.code && x.topic === m.topic);
  const rest = items.filter((x) => x.code !== m.code && x.topic !== m.topic);
  const related = [...same, ...rest].slice(0, 8);
  const url = `${SITE_URL}/jigsaw/community/${m.slug}`;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': url, url, name: `${m.name} Jigsaw Puzzle`, isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
        primaryImageOfPage: { '@type': 'ImageObject', contentUrl: `${SITE_URL}${imgSrc(m.code)}&w=1280`, name: m.name, creditText: m.by || 'a Mind Loft player', width: m.w, height: m.h },
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Jigsaw Puzzles', item: `${SITE_URL}/jig/shelf` },
          { '@type': 'ListItem', position: 3, name: 'Community Photos', item: `${SITE_URL}/jig/shelf?tab=community` },
          { '@type': 'ListItem', position: 4, name: m.name, item: url },
        ],
      },
    ],
  };
  return (
    <>
      {!pieces ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} /> : null}
      <PhotoPage meta={m} base={`/jigsaw/community/${m.slug}`} pieces={pieces} community related={related} />
    </>
  );
}
