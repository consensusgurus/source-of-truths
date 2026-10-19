import PolymathClient from './PolymathClient';
import PageViewBeacon from '../PageViewBeacon';
import { SITE_URL } from '@/lib/site';
import { parseShare } from '@/lib/polymath';

// POLYMATH (owner, 2026-10-19): mindloftdaily.com/polymath. The day's Trivia,
// Math and English Gauntlets read as one title. A share link carries
// ?s=75-65-70&t=70&d=<day> and its card is /polymath/card with the same query.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const share = parseShare(searchParams || {});
  const q = share ? new URLSearchParams(Object.entries({ s: searchParams.s, t: searchParams.t || '', d: searchParams.d || '' }).filter(([, v]) => v)).toString() : '';
  const img = q ? `/polymath/card?${q}` : '/polymath/card';
  const title = 'Polymath: Trivia, Math and English, One Daily Title | Mind Loft';
  const description = 'Play the day’s Trivia, Math and English Gauntlets free. Each counts a third, and the three together earn your title, Dabbler to Polymath.';
  return {
    title, description,
    alternates: { canonical: '/polymath' },
    openGraph: { title: 'Polymath · Mind Loft', description, url: '/polymath', type: 'website', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: 'Polymath, the daily title for three gauntlets at Mind Loft' }] },
    twitter: { card: 'summary_large_image', title: 'Polymath · Mind Loft', description, images: [img] },
  };
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export default function PolymathPage({ searchParams }) {
  const today = etTodayServer();
  const d = new Date(`${today}T12:00:00Z`);
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const shared = parseShare(searchParams || {});
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Game', name: 'Polymath', url: `${SITE_URL}/polymath`,
    description: 'A free daily title from Mind Loft for the day’s Trivia, Math and English Gauntlets, each counting a third.',
    gamePlatform: 'Web browser', isAccessibleForFree: true, inLanguage: 'en',
    image: `${SITE_URL}/polymath/card`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageViewBeacon id="polymath" />
      <PolymathClient dateLabel={dateLabel} shared={shared} />
    </>
  );
}
