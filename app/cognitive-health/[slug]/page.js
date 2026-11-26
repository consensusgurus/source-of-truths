// /cognitive-health/<slug>: one article (owner, 2026-11-26). Static: content
// is lib/cognitive-health.js, every article is prerendered, an unknown slug
// is a 404.

import { notFound } from 'next/navigation';
import { HealthArticle } from '../HealthViews';
import { ARTICLES, ARTICLE_MAP, COGNITIVE_HEALTH_NOTE, COGNITIVE_HEALTH_UPDATED } from '@/lib/cognitive-health';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const a = ARTICLE_MAP[params.slug];
  if (!a) return {};
  const url = `/cognitive-health/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: url },
    openGraph: { title: a.h1, description: a.description, url, type: 'article', siteName: 'Mind Loft', publishedTime: COGNITIVE_HEALTH_UPDATED },
    twitter: { card: 'summary_large_image', title: a.h1, description: a.description },
  };
}

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

// A play entry is [registryKey, blurb] or [href, name, blurb].
function resolvePlay(p) {
  if (p.length === 3) return { href: p[0], name: p[1], blurb: p[2] };
  const d = DAILY_GAME_MAP[p[0]];
  return d ? { href: d.href, name: d.name, blurb: p[1] } : null;
}

export default function CognitiveHealthArticle({ params }) {
  const a = ARTICLE_MAP[params.slug];
  if (!a) notFound();
  const play = (a.play || []).map(resolvePlay).filter(Boolean);
  const related = (a.related || []).map((s) => ARTICLE_MAP[s]).filter(Boolean).map((r) => ({ slug: r.slug, short: r.short }));
  const url = `${SITE_URL}/cognitive-health/${a.slug}`;
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.h1,
        description: a.description,
        url,
        author: { '@type': 'Organization', name: 'Mind Loft', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'Mind Loft', url: SITE_URL },
        datePublished: COGNITIVE_HEALTH_UPDATED,
        dateModified: COGNITIVE_HEALTH_UPDATED,
        citation: a.sources.map(([name, u]) => ({ '@type': 'CreativeWork', name, url: u })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Cognitive Health', item: `${SITE_URL}/cognitive-health` },
          { '@type': 'ListItem', position: 3, name: a.h1, item: url },
        ],
      })}
      <HealthArticle a={a} play={play} related={related} note={COGNITIVE_HEALTH_NOTE} updated={COGNITIVE_HEALTH_UPDATED} />
    </>
  );
}
