// /guides/<slug>: one how-to guide (owner, 2026-11-25). Static: the content
// is lib/guides.js, so every guide is prerendered at build and an unknown slug
// is a 404. See lib/guides.js for the linking rules.

import { notFound } from 'next/navigation';
import { GuideArticle } from '../GuideViews';
import { GUIDES, GUIDE_MAP } from '@/lib/guides';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { gameCategory } from '@/lib/game-seo';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.filter((g) => DAILY_GAME_MAP[g.game]).map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }) {
  const g = GUIDE_MAP[params.slug];
  if (!g) return {};
  const url = `/guides/${g.slug}`;
  const img = `/og/${g.game}.png`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: url },
    openGraph: { title: g.h1, description: g.description, url, type: 'article', siteName: 'Mind Loft', images: [{ url: img, width: 1200, height: 630, alt: `${g.h1}, a Mind Loft puzzle guide` }] },
    twitter: { card: 'summary_large_image', title: g.h1, description: g.description, images: [img] },
  };
}

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

const pick = (k) => {
  const d = DAILY_GAME_MAP[k];
  return d ? { key: k, name: d.name, href: d.href, tag: d.tag, cat: d.cat } : null;
};

export default function GuidePage({ params }) {
  const g = GUIDE_MAP[params.slug];
  if (!g || !DAILY_GAME_MAP[g.game]) notFound();
  const game = pick(g.game);
  const alsoGames = (g.also || []).map(pick).filter(Boolean);
  const cat = gameCategory(g.game) || { href: '/', label: 'Puzzles' };
  const same = GUIDES.filter((x) => x.slug !== g.slug && x.cat === g.cat && DAILY_GAME_MAP[x.game]);
  const other = GUIDES.filter((x) => x.slug !== g.slug && x.cat !== g.cat && DAILY_GAME_MAP[x.game]);
  const more = [...same, ...other].slice(0, 5).map((x) => ({ slug: x.slug, h1: x.h1 }));
  const url = `${SITE_URL}/guides/${g.slug}`;
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: g.h1,
        description: g.description,
        url,
        image: `${SITE_URL}/og/${g.game}.png`,
        author: { '@type': 'Organization', name: 'Mind Loft', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'Mind Loft', url: SITE_URL },
        datePublished: '2026-11-25',
        about: { '@type': 'Game', name: game.name, url: `${SITE_URL}${game.href}` },
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Puzzle Guides', item: `${SITE_URL}/guides` },
          { '@type': 'ListItem', position: 3, name: g.h1, item: url },
        ],
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      })}
      <GuideArticle guide={g} game={game} alsoGames={alsoGames} catHref={cat.href} catLabel={`All ${cat.label.toLowerCase()}`} more={more} />
    </>
  );
}
