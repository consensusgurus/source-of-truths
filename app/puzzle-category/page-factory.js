// ONE SERVER PAGE FOR EVERY PUZZLE CATEGORY ROUTE, AND ONE FOR EVERY SET.
//
// /sudoku, /crosswords, /word-games, /logic-puzzles, /number-puzzles,
// /trivia-games, /geography-games, /chess-puzzles, /end-game-puzzles,
// /card-games, /crowd-psychology-games and /arcade-games are each a two-line
// page.js that calls categoryPage(slug). The routes are real folders rather
// than one app/[category] catch-all, because a root catch-all would shadow the
// 404 for every mistyped daily route and sit one line away from every game
// page in the router.
//
// The SET pages (owner, 2026-09-11) are /<category>/<set>: one [set] folder
// under each category that has sets, whose page.js calls setPage(catSlug,
// params.set). A set slug the category does not have is a 404, so the folder
// shadows nothing that exists.
//
// force-dynamic for the same reason the circuit pages are: the roster is read
// off liveDailyKeys at Eastern midnight, and a statically rendered page would
// freeze the day it was built on (Extra retires 2026-09-29, and the page must
// drop it that morning without a deploy).

import { notFound } from 'next/navigation';
import CategoryLanding from './CategoryLanding';
import { puzzleCategory, categoryGames, SUBSET_PARENT, PUZZLE_CATEGORY_MAP } from '@/lib/puzzle-categories';
import { puzzleSet, setsIn, setGames } from '@/lib/puzzle-sets';
import { SITE_URL } from '@/lib/site';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

function listLd(name, games) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: games.length,
    itemListElement: games.map((g, i) => ({
      '@type': 'ListItem', position: i + 1, name: `${g.name}: ${g.generic}`, url: `${SITE_URL}${g.href}`,
    })),
  };
}

function crumbLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
      ...trail.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 2, name, item: `${SITE_URL}${url}` }))],
  };
}

function faqLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

function metadataFor(page, url) {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.h1, description: page.description, url, type: 'website', siteName: 'Mind Loft' },
    twitter: { card: 'summary_large_image', title: page.h1, description: page.description },
  };
}

export function categoryPage(slug) {
  const cat = puzzleCategory(slug);
  if (!cat) throw new Error('unknown puzzle category ' + slug);
  const url = `/${slug}`;
  const parentSlug = SUBSET_PARENT[slug] || null;
  const parent = parentSlug ? PUZZLE_CATEGORY_MAP[parentSlug] : null;

  function Page() {
    const games = categoryGames(cat, etTodayServer());
    if (!games.length) notFound();
    // THE SHELVES. A whole category with sets draws one shelf per set, in set
    // order, and any live game no set names (there should be none: the
    // verifier fails a grouped category with a game left out) goes on a last
    // shelf so it cannot vanish. A subset page and an ungrouped category draw
    // one grid.
    let groups = null;
    if (!parent) {
      const sets = setsIn(cat.cat);
      if (sets.length) {
        const byKey = new Map(games.map((g) => [g.key, g]));
        const seen = new Set();
        groups = sets.map((s) => [s, s.keys.filter((k) => byKey.has(k)).map((k) => { seen.add(k); return byKey.get(k); })])
          .filter(([, list]) => list.length);
        const rest = games.filter((g) => !seen.has(g.key));
        // Atlas sits on the trivia page by name while being a Geography
        // game, so this shelf is real there.
        if (rest.length) groups.push([{ name: 'Also here', href: null }, rest]);
      }
    }
    const trail = parent ? [[parent.label, `/${parent.slug}`], [cat.label, url]] : [[cat.label, url]];
    return (
      <>
        {jsonLd(listLd(cat.h1, games))}
        {jsonLd(crumbLd(trail))}
        {jsonLd(faqLd(cat.faq))}
        <CategoryLanding page={cat} games={games} parent={parent} groups={groups} />
      </>
    );
  }

  return { metadata: metadataFor(cat, url), Page };
}

// The set pages. `generateMetadata` rather than a constant, because the set
// is a route param. No generateStaticParams on purpose: with one, Next builds
// the routes static and the force-dynamic above is ignored (measured: the
// build table marked them SSG).
export function setPages(catSlug) {
  const parent = puzzleCategory(catSlug);
  if (!parent) throw new Error('unknown puzzle category ' + catSlug);

  function generateMetadata({ params }) {
    const set = puzzleSet(catSlug, params.set);
    return set ? metadataFor(set, set.href) : {};
  }

  function Page({ params }) {
    const set = puzzleSet(catSlug, params.set);
    if (!set) notFound();
    const games = setGames(set, etTodayServer());
    if (!games.length) notFound();
    return (
      <>
        {jsonLd(listLd(set.h1, games))}
        {jsonLd(crumbLd([[parent.label, `/${parent.slug}`], [set.name, set.href]]))}
        {set.faq && set.faq.length ? jsonLd(faqLd(set.faq)) : null}
        <CategoryLanding page={set} games={games} parent={parent} />
      </>
    );
  }

  return { generateMetadata, Page };
}
