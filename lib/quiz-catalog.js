// The QUIZ CATALOG: the one set of quizzes that is both sitemapped and browsable.
//
// Extracted 2026-08-09 after a Search Console audit found 1,748 of the 1,851 catalog
// quizzes were CRAWL ORPHANS: they sat in sitemap.xml with no internal link anywhere on
// the site, so Google filed them under "Discovered - currently not indexed" and never
// spent crawl budget on them. Lists never had this problem because /lists renders all 585
// of them; the quiz catalogue lost its equivalent index on 2026-07-18 when /quizzes was
// 308'd to the homepage, and the homepage only renders ~107 quiz links.
//
// So the fix is /quizzes/all, and the rule that keeps it fixed is THIS file: the sitemap
// (lib/sitemap-entries.js) and the index (app/quizzes/all/page.js) both derive their set
// from catalogQuizzes(), so a sitemapped quiz URL cannot exist without a crawlable link to
// it. Add a quiz and both get it. Never re-inline either filter at a call site.

import { QUIZZES } from '@/lib/quizzes';

// Daily word games live on evergreen URLs (/crux, /garble). Their dated catalog entries are
// thin client-side hops to those pages and canonicalize to them, so the game URL is what
// belongs in the sitemap and the index, never the dated stub.
export const WORD_GAME_FORMATS = new Set(['crux', 'emcee', 'garble', 'links', 'span', 'dating', 'tally', 'suds', 'quilt', 'circa', 'extra', 'carve', 'stet', 'outwit', 'tuck', 'alibi', 'cipher', 'ping', 'warmer', 'jester', 'sworn', 'outrank', 'shards', 'axiom', 'hearsay', 'venn', 'stands', 'bracket', 'lode', 'etch', 'hedge', 'listed', 'mate', 'four', 'park', 'impound', 'junkyard', 'check', 'rung', 'hinge', 'sums', 'crunch', 'taire', 'fib', 'streak', 'feud', 'babel', 'glyph', 'hands', 'finesse', 'chain', 'turn', 'suffice', 'strata', 'redact', 'paths', 'deep', 'anon', 'blocks', 'chomp', 'sweep', 'docket', 'blitz', 'blitzed', 'defend', 'cages', 'sando', 'barter', 'plot', 'sixes', 'niche', 'shoe', 'queen', 'towers', 'mercury', 'polka', 'atlas', 'sport', 'calc', 'encore', 'biz', 'flank', 'knight', 'script', 'quotes', 'focus', 'thread', 'slot', 'whittle', 'diag', 'frame', 'rim']);

// Every quiz a reader may reach today: published (a future publishedAt is a banked quiz and
// stays hidden until its date), and not an unlisted mobile-preview clone.
export function visibleQuizzes() {
  const now = Date.now();
  return QUIZZES.filter(
    (quiz) => !quiz.unlisted && (!quiz.publishedAt || Date.parse(quiz.publishedAt) <= now)
  );
}

// The visible quizzes that own a /quiz/<id> URL of their own, i.e. everything except the
// daily word-game stubs. This is the set that gets a sitemap entry AND an index link.
export function catalogQuizzes() {
  return visibleQuizzes().filter((quiz) => !WORD_GAME_FORMATS.has(quiz.format));
}
