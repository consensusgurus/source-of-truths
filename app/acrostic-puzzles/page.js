// /acrostic-puzzles: the acrostic hub (Search Console pass, 2026-11-23).
//
// WHY. Over the twelve months to 2026-11-22 "daily acrostic" and its cousins
// ("acrostic puzzles", "free acrostics", "acrostic daily") earned about 400
// impressions at an average position near 10, and no page on the site was
// called an acrostic: Google was matching Anon and Arcos one at a time off their
// title tags. This page owns the head term and hands the reader to both games.
//
// It is the category page's body (CategoryLanding) under Crosswords, the same
// way a set page sits under its category, but it is NOT a set: Anon lives in the
// Clueless crosswords group and Arcos in Crosswords, and moving either would
// reshuffle the home shelves. The roster is read off liveDailyKeys at render
// time, so a game that retires drops off the morning it goes.
//
// COPY RULES as for the categories: no em dash, no answers, nothing that goes
// stale with a bank regeneration.

import { notFound } from 'next/navigation';
import CategoryLanding from '../puzzle-category/CategoryLanding';
import { PUZZLE_CATEGORY_MAP } from '@/lib/puzzle-categories';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

const KEYS = ['anon', 'arcos'];

const PAGE = {
  slug: 'acrostic-puzzles',
  href: '/acrostic-puzzles',
  cat: 'Word',
  label: 'Acrostics',
  eyebrow: 'Free daily acrostic puzzles',
  title: 'Free Daily Acrostic Puzzles: A Classic Acrostic and a Daily Set | Mind Loft',
  h1: 'Free Daily Acrostic Puzzles: A Classic Acrostic and a Daily Set',
  description: 'Two free daily acrostic puzzles: a classic acrostic where the answers spell the author of a hidden passage, and a set of three clued acrostics tied together by one last word. New puzzles at midnight Eastern, no signup.',
  lede: 'An acrostic is a puzzle where the first letters of the answers spell something on their own. Mind Loft runs two every day. Anon is the classic kind: a passage hidden in a grid and a bank of answers whose first letters name whoever wrote it. Arcos is three small clued acrostics, each hiding a word, and one more word that goes with all three.',
  howTitle: 'How the acrostics differ',
  how: [
    'Anon hands you an unsigned passage, one box per letter, and a bank of answers built from the same letters. Every box belongs to both halves, so a letter you type in an answer appears in the passage and the reverse. Some answers carry a category you can work out in your head and about half carry nothing at all, which is why the passage is the way in: fill a word you can read there and the answers start to give. Finish it and the first letters of the answers have spelled the author.',
    'Arcos is shorter and fully clued. Each of its three acrostics is a short stack of answers, and the first letters, the last letters and the diagonal each spell a hidden word. Solve all three, then name the one word that ties the three hidden words together. Each acrostic is worth three points, the finale one, and time breaks ties.',
  ],
  startTitle: 'Where to start',
  start: 'Arcos if you want a clue for every answer and a quicker solve. Anon if you want the slower, more satisfying solve: it has no clues to speak of, and the passage does the work.',
  week: [
    ['Monday to Saturday', 'A fresh puzzle in each game, every day.'],
    ['Sunday Edition', 'Anon runs a longer passage, and Arcos hides five- and six-letter words.'],
  ],
  faq: [
    ['What is an acrostic puzzle?', 'A word puzzle where the first letters of the answers, read in order, spell a word or a name. Anon spells the author of a hidden passage; Arcos also reads the last letters and the diagonal.'],
    ['Are the acrostics free?', 'Yes, both, every day. An account only keeps your streak and puts your time on the leaderboard.'],
    ['Is there an archive of past acrostics?', 'Every past puzzle is in the puzzle archive and can be replayed unscored.'],
    ['Can I play on my phone?', 'Yes. Both games are built for a phone first, and Anon switches between the passage and the answers with one tap.'],
  ],
};

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

function jsonLd(obj) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />;
}

export const metadata = {
  title: PAGE.title,
  description: PAGE.description,
  alternates: { canonical: PAGE.href },
  openGraph: { title: PAGE.h1, description: PAGE.description, url: PAGE.href, type: 'website', siteName: 'Mind Loft' },
  twitter: { card: 'summary_large_image', title: PAGE.h1, description: PAGE.description },
};

export default function AcrosticPuzzlesPage() {
  const parent = PUZZLE_CATEGORY_MAP.crosswords;
  const gen = (parent && parent.generic) || {};
  const live = liveDailyKeys(etTodayServer());
  const games = KEYS.filter((k) => live.includes(k) && DAILY_GAME_MAP[k])
    .map((k) => ({ ...DAILY_GAME_MAP[k], generic: gen[k] || DAILY_GAME_MAP[k].tag }));
  if (!games.length) notFound();
  return (
    <>
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: PAGE.h1,
        numberOfItems: games.length,
        itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: `${g.name}: ${g.generic}`, url: `${SITE_URL}${g.href}` })),
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Crosswords', item: `${SITE_URL}/crosswords` },
          { '@type': 'ListItem', position: 3, name: 'Acrostics', item: `${SITE_URL}${PAGE.href}` },
        ],
      })}
      {jsonLd({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: PAGE.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      })}
      <CategoryLanding page={PAGE} games={games} parent={parent} />
    </>
  );
}
