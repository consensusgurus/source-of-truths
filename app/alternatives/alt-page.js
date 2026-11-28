// Shared server builder for the three alternative pages (owner, 2026-11-28).
// Each route (app/nyt-games-alternative, app/sporcle-alternative,
// app/puzzmo-alternative) is two lines over this. Content: lib/alternatives.js.

import { notFound } from 'next/navigation';
import { AltArticle } from './AltViews';
import { ALTERNATIVES, ALTERNATIVES_MAP, ALTERNATIVES_UPDATED, NOT_AFFILIATED } from '@/lib/alternatives';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { SITE_URL } from '@/lib/site';

export function altMetadata(slug) {
  const a = ALTERNATIVES_MAP[slug];
  const url = `/${slug}`;
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: url },
    openGraph: { title: a.h1, description: a.description, url, type: 'article', siteName: 'Mind Loft' },
    twitter: { card: 'summary_large_image', title: a.h1, description: a.description },
  };
}

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

// One match row's buttons: the Mind Loft dailies first (live ones only), then
// catalogue quizzes, then any extra pages.
function rowLinks(m) {
  const out = [];
  for (const k of m.keys || []) {
    const d = DAILY_GAME_MAP[k];
    if (d) out.push({ href: d.href, label: `${out.length ? '' : 'Play '}${d.name}: ${d.tag}`, play: true, name: d.name });
  }
  for (const [id, title] of m.quizzes || []) out.push({ href: `/quiz/${id}`, label: title });
  for (const [href, label] of m.more || []) out.push({ href, label });
  return out;
}

export function AltPage({ slug }) {
  const a = ALTERNATIVES_MAP[slug];
  if (!a) notFound();
  const matches = a.matches.map((m) => ({ theirs: m.theirs, body: m.body, links: rowLinks(m) }));
  const others = ALTERNATIVES.filter((x) => x.slug !== slug).map((x) => ({ slug: x.slug, h1: x.h1 }));
  const url = `${SITE_URL}/${slug}`;
  const games = matches.flatMap((m) => m.links.filter((l) => l.play));
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
        datePublished: ALTERNATIVES_UPDATED,
        dateModified: ALTERNATIVES_UPDATED,
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Free puzzles like ${a.site}`,
        numberOfItems: games.length,
        itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.name, url: `${SITE_URL}${g.href}` })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Alternatives', item: `${SITE_URL}/alternatives` },
          { '@type': 'ListItem', position: 3, name: a.h1, item: url },
        ],
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: a.faq.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })),
      })}
      <AltArticle page={a} matches={matches} others={others} footnote={NOT_AFFILIATED} />
    </>
  );
}
