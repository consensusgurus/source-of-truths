import ShelfClient from './ShelfClient';
import PageViewBeacon from '../../PageViewBeacon';
import { PUZZLES } from '../puzzles';
import { PUZZLES as SAW } from '../../saw/puzzles';
import { SITE_URL } from '@/lib/site';
import { gameCategory } from '@/lib/game-seo';

// /jig/shelf: THE JIGSAW PUZZLE SHELF (owner, 2026-10-16; Saw added and the
// shelf renamed from "Jig Puzzle Shelf" 2026-11-11, same URL so it keeps its
// search standing). Every Jig AND Saw board so far, a Jig plank and (from
// Saw's first week) a Saw plank per week. Originally every Jig board so far,
// each a small box with its photograph on a wooden shelf, a week to a shelf,
// newest first. Today's box is a question mark. Design: the "Jig Puzzle Shelf"
// canvas (approved 2026-10-16).
//
// SERVER HTML IS THE CRAWL PATH. Every past box is a real link to /jig?p=N
// with alt text naming the photo, so a crawler sees the whole archive of
// pictures without running a line of script; which ones the reader has solved
// layers on in the browser.
//
// TODAY'S PHOTO NEVER LEAVES THE SERVER. Today's board reaches the client as a
// number, a date and a cut: no title, no name, no credit, and no future day at
// all. The image route refuses a day that is not live, so tomorrow cannot be
// fetched either.

export const metadata = {
  title: 'Jigsaw Puzzle Shelf: Free Daily Jigsaw Archive | Mind Loft',
  description:
    'Every Jig and Saw daily jigsaw so far, wide and tall, a new photo for each every day. Play any past puzzle free, no app or signup.',
  alternates: { canonical: '/jig/shelf' },
  openGraph: {
    images: [{ url: '/og/jig-shelf.png', width: 1200, height: 630, alt: 'The Jigsaw Puzzle Shelf: past daily jigsaw photos on wooden shelves, today a question mark' }],
    title: 'The Jigsaw Puzzle Shelf',
    description: 'Every Jig and Saw daily jigsaw so far. Pick a box and play it free.',
    url: '/jig/shelf',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/jig-shelf.png'],
    card: 'summary_large_image',
    title: 'The Jigsaw Puzzle Shelf',
    description: 'Every Jig and Saw daily jigsaw so far. Pick a box and play it free.',
  },
};

export const dynamic = 'force-dynamic';

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// The licence a credit names, as the deed it points to. Unknown strings get no
// URL rather than a guessed one.
function licenceUrl(lic) {
  if (lic === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (lic === 'Public domain') return 'https://creativecommons.org/publicdomain/mark/1.0/';
  const m = /^CC (BY(?:-SA)?) (\d\.\d)/.exec(lic || '');
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/` : null;
}
const commonsPage = (t) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(t.replace(/ /g, '_'))}`;

const FAQ = [
  {
    q: 'What is the Jigsaw Puzzle Shelf?',
    a: 'It is every Jig and Saw daily jigsaw so far, one box per puzzle per day, a week to a shelf: Jig on top, the tall Saw below it. Each box shows that day’s photograph and its piece count. Pick any past box to play that puzzle free from the archive.',
  },
  {
    q: 'How many pieces is each puzzle?',
    a: 'Every Jig is 80 pieces of a wide photo; boards before October 30, 2026 grew through the week, from 48 on a Monday to an 80-piece Sunday Edition. Every Saw is a tall photo cut 7 by 11 or 8 by 10, so 77 or 80 pieces, and its pieces lock to each other on a loose table.',
  },
  {
    q: 'Why are today’s boxes question marks?',
    a: 'Today’s photographs are the surprise, so the shelf keeps them covered. Finish today’s Jig or Saw and its box shows the picture on this device.',
  },
];

export default function JigShelfPage() {
  const today = etTodayServer();
  const cat = gameCategory('jig');

  // Newest first, both games. Today's board of each carries nothing that
  // could show its picture.
  const rows = (g, bank) => {
    const live = bank.filter((p) => p.live <= today);
    const todays = live.length ? live[live.length - 1] : null;
    return live.map((p) => (p === todays && p.live === today
      ? { g, k: `${g}-${p.num}`, n: p.num, d: p.live, l: p.dateLabel, s: p.sunday ? 1 : 0, c: p.cols, r: p.rows, today: 1 }
      : { g, k: `${g}-${p.num}`, n: p.num, d: p.live, l: p.dateLabel, s: p.sunday ? 1 : 0, c: p.cols, r: p.rows, name: p.name, by: p.by, lic: p.lic, src: commonsPage(p.t), t: p.t }));
  };
  const all = [...rows('jig', PUZZLES), ...rows('saw', SAW)]
    .sort((a, b) => (a.d === b.d ? (a.g === 'jig' ? -1 : 1) : a.d < b.d ? 1 : -1));
  const boards = all.map(({ t, ...b }) => b);
  const titleOf = new Map(all.map((b) => [b.k, b.t]));
  const GNAME = { jig: 'Jig', saw: 'Saw' };

  const past = boards.filter((b) => !b.today);
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Jigsaw Puzzle Shelf',
    description: metadata.description,
    url: `${SITE_URL}/jig/shelf`,
    isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Jig and Saw daily jigsaw puzzles',
      numberOfItems: past.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: past.map((b, i) => {
        const lic = licenceUrl(b.lic);
        return {
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/${b.g}?p=${b.n}`,
          item: {
            '@type': 'ImageObject',
            name: `${GNAME[b.g]} No. ${b.n}: ${b.name}`,
            caption: b.name,
            contentUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(titleOf.get(b.k) || '')}`,
            acquireLicensePage: b.src,
            creditText: `${b.by}, Wikimedia Commons`,
            creator: { '@type': 'Person', name: b.by },
            ...(lic ? { license: lic } : {}),
            datePublished: b.d,
          },
        };
      }),
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}` },
      cat
        ? { '@type': 'ListItem', position: 2, name: cat.label, item: `${SITE_URL}${cat.href}` }
        : { '@type': 'ListItem', position: 2, name: 'Puzzle Archive', item: `${SITE_URL}/archive` },
      { '@type': 'ListItem', position: 3, name: 'Jigsaw Puzzle Shelf' },
    ],
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageViewBeacon id="jig-shelf" />
      <ShelfClient boards={boards} today={today} crumb={cat ? { label: cat.label, href: cat.href } : null} faq={FAQ} />
    </>
  );
}
