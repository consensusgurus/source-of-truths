// The admin panel's quiz-id -> title map (2026-08-28).
//
// Extracted from app/admin/page.js so that page and
// app/api/admin/player-plays/route.js resolve a play's title the same way. The
// route serves the per-play detail behind an expanded player row; if it titled
// a play differently from the page, the same game would read one way in the
// summary and another in the detail directly beneath it.

import { QUIZZES } from '@/lib/quizzes';

// Non-quiz pages whose page views are tracked through the quiz-view system so
// they surface in the analytics panel. Adding an entry is COSMETIC: a tracked
// id shows up here on its own, this map only gives the row a real title and a
// working link instead of the raw id and a dead /quiz/<id>. Every id below is
// RESERVED; never create a real quiz with one.
export const TRACKED_PAGES = {
  kids: { title: 'Kids Corner (hub)', href: '/kids' },
  'kids-memory-match': { title: 'Kids · Treats Match', href: '/kids/memory-match' },
  'kids-pizza-match': { title: 'Kids · Pizza Match', href: '/kids/pizza-match' },
  'kids-dog-match': { title: 'Kids · Dog Match', href: '/kids/dog-match' },
  'kids-color-match': { title: 'Kids · Color Match', href: '/kids/color-match' },
  'kids-addition-match': { title: 'Kids · Addition Match', href: '/kids/addition-match' },
  'kids-letter-match': { title: 'Kids · Letter Match', href: '/kids/letter-match' },
  'kids-fantasy-match': { title: 'Kids · Fantasy Match', href: '/kids/fantasy-match' },
  'kids-word-match': { title: 'Kids · Word Match', href: '/kids/word-match' },
  'kids-number-match': { title: 'Kids · Number Match', href: '/kids/number-match' },
  'cfb-rankings': { title: 'Sports · College Football Rankings', href: '/collegefootballrankings' },
  'nfl-rankings': { title: 'Sports · NFL Consensus Rankings', href: '/nflrankings' },
  'mlb-rankings': { title: 'Sports · MLB Consensus Rankings', href: '/mlbrankings' },
  iq: { title: 'IQ Tests (hub)', href: '/iq' },
  'iq-general': { title: 'IQ Test · General Knowledge', href: '/iq/general' },
  'iq-general-finished': { title: 'IQ Test · General Knowledge (finished)', href: '/iq/general' },
  'iq-geography': { title: 'IQ Test · Geography', href: '/iq/geography' },
  'iq-geography-finished': { title: 'IQ Test · Geography (finished)', href: '/iq/geography' },
  'iq-history': { title: 'IQ Test · History', href: '/iq/history' },
  'iq-history-finished': { title: 'IQ Test · History (finished)', href: '/iq/history' },
  'iq-science': { title: 'IQ Test · Science and Nature', href: '/iq/science' },
  'iq-science-finished': { title: 'IQ Test · Science and Nature (finished)', href: '/iq/science' },
  'iq-screen': { title: 'IQ Test · Movies and TV', href: '/iq/screen' },
  'iq-screen-finished': { title: 'IQ Test · Movies and TV (finished)', href: '/iq/screen' },
  'iq-music': { title: 'IQ Test · Music', href: '/iq/music' },
  'iq-music-finished': { title: 'IQ Test · Music (finished)', href: '/iq/music' },
  'iq-literature': { title: 'IQ Test · Words and Books', href: '/iq/literature' },
  'iq-literature-finished': { title: 'IQ Test · Words and Books (finished)', href: '/iq/literature' },
  'iq-sports': { title: 'IQ Test · Sports', href: '/iq/sports' },
  'iq-sports-finished': { title: 'IQ Test · Sports (finished)', href: '/iq/sports' },
  'iq-business': { title: 'IQ Test · Business', href: '/iq/business' },
  'iq-business-finished': { title: 'IQ Test · Business (finished)', href: '/iq/business' },
};

// Note this deliberately does NOT resolve the daily games' per-date ids
// (crux-8-17-26 and friends): they are not in QUIZZES, so a daily play falls
// back to its raw id, exactly as it did before this map was extracted. Changing
// that is a separate decision, not a side effect of the extraction.
export function buildQuizTitles() {
  const titles = new Map((Array.isArray(QUIZZES) ? QUIZZES : []).map((q) => [q.id, q.title]));
  for (const [id, m] of Object.entries(TRACKED_PAGES)) titles.set(id, m.title);
  return titles;
}
