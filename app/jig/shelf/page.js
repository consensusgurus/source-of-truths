import ShelfClient from './ShelfClient';
import PageViewBeacon from '../../PageViewBeacon';
import { PUZZLES } from '../puzzles';
import { SITE_URL } from '@/lib/site';
import { gameCategory } from '@/lib/game-seo';

// /jig/shelf: THE PUZZLE SHELF (owner, 2026-10-16). Every Jig board so far,
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
  title: 'Jig Puzzle Shelf: Free Daily Jigsaw Archive | Mind Loft',
  description:
    'Every Jig daily jigsaw so far, 48 to 80 pieces, a new photo each day. Play any past puzzle free, no app or signup.',
  alternates: { canonical: '/jig/shelf' },
  openGraph: {
    images: [{ url: '/og/jig.png', width: 1200, height: 630, alt: 'Jig, a daily jigsaw puzzle from Mind Loft' }],
    title: 'The Jig Puzzle Shelf',
    description: 'Every daily jigsaw so far, one photograph a day. Pick a box and play it free.',
    url: '/jig/shelf',
    type: 'website',
    siteName: 'Mind Loft',
  },
  twitter: {
    images: ['/og/jig.png'],
    card: 'summary_large_image',
    title: 'The Jig Puzzle Shelf',
    description: 'Every daily jigsaw so far, one photograph a day. Pick a box and play it free.',
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
    q: 'What is the Jig puzzle shelf?',
    a: 'It is every Jig daily jigsaw so far, one box per day, a week to a shelf. Each box shows that day’s photograph and its piece count. Pick any past box to play that puzzle free from the archive.',
  },
  {
    q: 'How many pieces is each Jig puzzle?',
    a: 'Monday is 48 pieces and the week builds from there: 54 on Tuesday, 60 on Wednesday, 63 on Thursday, 70 on Friday and 77 on Saturday. The Sunday Edition is the biggest, 80 pieces.',
  },
  {
    q: 'Why is today’s box a question mark?',
    a: 'Today’s photograph is the surprise, so the shelf keeps it covered. Finish today’s Jig and its box shows the picture on this device.',
  },
];

export default function JigShelfPage() {
  const today = etTodayServer();
  const live = PUZZLES.filter((p) => p.live <= today);
  const todays = live.length ? live[live.length - 1] : null;
  const cat = gameCategory('jig');

  // Newest first. Today's board carries nothing that could show its picture.
  const boards = live.slice().reverse().map((p) => (p === todays && p.live === today
    ? { n: p.num, d: p.live, l: p.dateLabel, s: p.sunday ? 1 : 0, c: p.cols, r: p.rows, today: 1 }
    : { n: p.num, d: p.live, l: p.dateLabel, s: p.sunday ? 1 : 0, c: p.cols, r: p.rows, name: p.name, by: p.by, lic: p.lic, src: commonsPage(p.t) }));

  const past = boards.filter((b) => !b.today);
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Jig Puzzle Shelf',
    description: metadata.description,
    url: `${SITE_URL}/jig/shelf`,
    isPartOf: { '@type': 'WebSite', name: 'Mind Loft', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Jig daily jigsaw puzzles',
      numberOfItems: past.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: past.map((b, i) => {
        const lic = licenceUrl(b.lic);
        return {
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/jig?p=${b.n}`,
          item: {
            '@type': 'ImageObject',
            name: `Jig No. ${b.n}: ${b.name}`,
            caption: b.name,
            contentUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent((PUZZLES.find((p) => p.num === b.n) || {}).t || '')}`,
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
      { '@type': 'ListItem', position: 3, name: 'Jig', item: `${SITE_URL}/jig` },
      { '@type': 'ListItem', position: 4, name: 'Puzzle shelf' },
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
