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
  archive: { title: 'Puzzle Archive', href: '/archive' },
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
  'iq-general': { title: 'General Knowledge IQ Test', href: '/iq/general' },
  'iq-general-finished': { title: 'General Knowledge IQ Test (finished)', href: '/iq/general' },
  'iq-geography': { title: 'Geography IQ Test', href: '/iq/geography' },
  'iq-geography-finished': { title: 'Geography IQ Test (finished)', href: '/iq/geography' },
  'iq-history': { title: 'History IQ Test', href: '/iq/history' },
  'iq-history-finished': { title: 'History IQ Test (finished)', href: '/iq/history' },
  'iq-science': { title: 'Science and Nature IQ Test', href: '/iq/science' },
  'iq-science-finished': { title: 'Science and Nature IQ Test (finished)', href: '/iq/science' },
  'iq-screen': { title: 'Movies and TV IQ Test', href: '/iq/screen' },
  'iq-screen-finished': { title: 'Movies and TV IQ Test (finished)', href: '/iq/screen' },
  'iq-music': { title: 'Music IQ Test', href: '/iq/music' },
  'iq-music-finished': { title: 'Music IQ Test (finished)', href: '/iq/music' },
  'iq-literature': { title: 'Words and Books IQ Test', href: '/iq/literature' },
  'iq-literature-finished': { title: 'Words and Books IQ Test (finished)', href: '/iq/literature' },
  'iq-sports': { title: 'Sports IQ Test', href: '/iq/sports' },
  'iq-sports-finished': { title: 'Sports IQ Test (finished)', href: '/iq/sports' },
  'iq-business': { title: 'Business IQ Test', href: '/iq/business' },
  'iq-business-finished': { title: 'Business IQ Test (finished)', href: '/iq/business' },
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
