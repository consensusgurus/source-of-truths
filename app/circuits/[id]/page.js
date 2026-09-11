import { notFound } from 'next/navigation';
import CircuitLanding from './CircuitLanding';
import { ALL_CIRCUITS, circuitById, circuitGamesFor, circuitPageHref, isMarquee } from '@/lib/circuits';
import { categoryColor, categoryColorLight } from '@/lib/category-ramp';
import { SITE_URL } from '@/lib/site';
import { genericFor } from '@/lib/puzzle-categories';

// /circuits/<id> — a circuit's own page, and the thing a shared circuit link
// lands on.
//
// WHY IT EXISTS (owner, 2026-08-18). Until this page, a circuit had two public
// faces and neither was shareable. The console band on the home page is the
// real one, but it is a band inside a much larger page and a link to it hands a
// recipient the whole homepage rather than the run. /daily-five?circuit=<id> is
// the run SUMMARY: noindex on purpose, one viewer's own results and an hourly
// leaderboard, and it reads as an ending. Sharing that to somebody who has
// never played is sharing them a stranger's scorecard.
//
// So this page answers the one question a recipient actually has: what IS this,
// and where do I start? Name, the line the circuit is shared with, the games in
// run order with what each one is, the trophy it pays, and a button that starts
// the run. It is the destination for share.invite, the crawlable link path to
// every daily in that circuit, and the only circuit surface a search engine can
// index.
//
// INDEXED, unlike the summary. Everything here is evergreen: the roster of a
// skill circuit is fixed, so this page says the same true thing tomorrow. The
// live parts (whether the viewer has played today, today's board) are a client
// island underneath, exactly so the server-rendered half stays cacheable and
// stays honest to a crawler.
//
// IT IS A STAGE PAGE (owner, 2026-08-31: "the circuit landing pages have the
// old header and lack the updated style"). There is no QuizNavHeader, no Grain
// and no NavyFrame here any more: CircuitLanding renders CircuitFrame, which
// carries the stage's one-line cap, the register switch and the stage footer,
// so this page and the daily it sends the reader into are the same surface. The
// old chrome was the Loft's, and every other daily surface left it that day.
//
// force-dynamic, for ONE reason: the marquee's roster is a daily read out of
// lib/daily-five and a statically rendered /circuits/five would freeze
// whichever day it was built on. The fourteen skill circuits would be happy
// static; they share the route, so they share the setting.

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return ALL_CIRCUITS.map((c) => ({ id: c.id }));
}

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export async function generateMetadata({ params }) {
  const c = circuitById(decodeURIComponent(params.id));
  if (!c) return {};
  const games = circuitGamesFor(c.id, etTodayServer());
  const n = games.length || 5;
  const names = games.map((g) => g.name).join(', ');
  const title = isMarquee(c.id)
    ? 'The Daily Five: Five Daily Puzzles, One Run | Mind Loft'
    : `The ${c.name} Circuit: ${n} Daily Puzzles, One Run | Mind Loft`;
  // The description is the share invite plus the roster, which is the pair a
  // searcher needs: what the run is, and which games are in it.
  const description = `${c.share.invite}${names ? ` Today: ${names}.` : ''} Free, no account needed, and ranked on your combined placement across all ${n}.`;
  const url = circuitPageHref(c.id);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: isMarquee(c.id) ? 'The Daily Five' : `The ${c.name} Circuit`,
      description: c.share.invite,
      url,
      type: 'website',
      siteName: 'Mind Loft',
    },
    twitter: {
      card: 'summary_large_image',
      title: isMarquee(c.id) ? 'The Daily Five' : `The ${c.name} Circuit`,
      description: c.share.invite,
    },
  };
}

export default function CircuitPage({ params }) {
  const c = circuitById(decodeURIComponent(params.id));
  if (!c) notFound();

  const day = etTodayServer();
  // Server-rendered so the roster is in the HTML: it is the crawlable link path
  // to every daily in the circuit, and it is the half of the page that is true
  // whether or not anyone is signed in.
  //
  // BOTH REGISTERS OF EACH GAME'S CATEGORY STEP travel with the game, and the
  // stylesheet picks one off data-stage-theme. A hue chosen in JS would have to
  // wait for the stored register to resolve, and the whole list would repaint
  // under the reader on first paint.
  const games = circuitGamesFor(c.id, day).map((g) => ({
    key: g.key, name: g.name, cat: g.cat, tag: g.tag, how: g.how, subject: g.subject || '',
    href: g.href, generic: genericFor(g.key),
    hue: categoryColor(g.cat), hueLight: categoryColorLight(g.cat),
  }));

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isMarquee(c.id) ? 'The Daily Five' : `The ${c.name} Circuit`,
    description: c.share.invite,
    url: `${SITE_URL}${circuitPageHref(c.id)}`,
    numberOfItems: games.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: games.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.name,
      url: `${SITE_URL}${g.href}`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Circuits', item: `${SITE_URL}/circuits` },
      { '@type': 'ListItem', position: 3, name: c.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* Plain serializable props only: this is the server/client boundary.
          The blurb is deliberately NOT passed. It says almost exactly what
          share.invite says, and the header can only carry one of them.

          `cat` is the LEAD GAME'S category, which is the page's accent. A
          circuit spans categories, so it has no category of its own, and the
          lead game's step is the colour the reader is about to be handed. */}
      {/* `order` was READ by CircuitLanding and never PASSED, so the note under
          the run list has always said "shortest first, longest last" — which is
          untrue of a circuit that shuffles its middle every morning. It is one
          circuit today (the Gauntlet's order.tail), and it now says so. */}
      <CircuitLanding circuit={{
        id: c.id, name: c.name, share: c.share,
        trophy: c.trophy || null, marquee: !!isMarquee(c.id),
        order: c.order || null,
        cat: (games[0] && games[0].cat) || null,
      }} games={games} />
    </>
  );
}
