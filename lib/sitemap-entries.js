// The sitemap URL SET, parameterised by origin, in FOUR SEGMENTS.
//
// Extracted from app/sitemap.js on 2026-08-05 so the old hosts can serve the same set of
// pages under their own origin during the domain move (see app/legacy-sitemap). Keeping one
// generator means the old sitemap can never drift from the real one: add a page here and
// both sitemaps get it.
//
// SPLIT INTO SEGMENTS 2026-08-17 (Search Console audit). One flat 457KB file carrying 2,511
// urls made the index rate unreadable: Search Console reports coverage per sitemap, so a
// single file could only ever say "130 of 2,511 indexed" and never which KIND of page was
// failing. It also let 1,852 static quiz urls dilute the crawl signal on the ~70 game urls
// that genuinely change every day. Four segments (games / lists / quizzes / pages) under an
// index at /sitemap.xml fix both: each is submitted separately and reports separately.
//
// sitemapEntries() still returns the whole set, in one array, because app/legacy-sitemap
// depends on it and must keep emitting every old url in one file. Do not remove it.

import { LISTS } from '@/lib/data';
import { catalogQuizzes, visibleQuizzes } from '@/lib/quiz-catalog';
import { ALL_CIRCUITS, circuitPageHref, circuitKeysFor } from './circuits.js';
import { GRIDIRON } from './gridiron-data';
import { SOT_URL } from './site';
import { PUZZLE_CATEGORIES } from './puzzle-categories.js';
import { ownSets } from './puzzle-sets.js';

// Midnight Eastern today, as a Date. The daily games roll their puzzle at ET midnight, so
// this is the honest lastmod for them and it is STABLE within a day (never Date.now(), which
// is the fake churn that teaches Google to ignore the field entirely).
//
// Why the games need it: every game url was carrying the publish date of its newest CATALOG
// STUB, which for /crux read 2026-08-02 for two solid weeks while the puzzle changed daily.
// A url that claims not to have changed does not get recrawled, and these are the only pages
// on the site currently earning search traffic.
function easternMidnight() {
  const now = new Date();
  // en-CA gives YYYY-MM-DD directly. The 04:00Z stamp is EDT midnight; it drifts an hour in
  // winter, which does not matter for a date-granularity field.
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${ymd}T04:00:00.000Z`);
}

function dateOf(entry) {
  return new Date(entry.publishedAt || `${entry.publishedDate}T12:00:00Z`);
}

// Every daily game that owns an evergreen url. The dated catalog stubs are thin client-side
// hops to these pages and canonicalize to them, so the game url is what belongs in the
// sitemap, never the stub. PRICER PULLED 2026-08-09 (see CLAUDE.md); restore by adding
// 'pricer' back to this list.
const GAME_PATHS = [
  'crux', 'emcee', 'garble', 'links', 'span', 'dating', 'tally', 'suds', 'quilt', 'cages',
  'sando', 'carve', 'circa', 'extra', 'stet', 'outwit', 'outrank', 'shards', 'tuck', 'alibi',
  'cipher', 'ping', 'warmer', 'jesters', 'sworn', 'axiom', 'hearsay', 'venn', 'stands',
  'bracket', 'lode', 'etch', 'glyph', 'hedge', 'listed', 'mate', 'four', 'parker', 'impound', 'junkyard', 'check',
  'rung', 'crunch', 'taire', 'fib', 'streak', 'feud', 'babel', 'chain', 'turn', 'suffice',
  'docket', 'plot', 'barter', 'sixes', 'niche', 'shoe', 'queen', 'defend', 'blitz', 'blitzed', 'sums', 'hinge', 'strata', 'blocks', 'chomp',
  'sweep', 'redact', 'paths', 'deep', 'anon', 'hands', 'finesse', 'atlas', 'sport', 'towers', 'mercury', 'polka',
  'calc', 'encore', 'biz', 'flank', 'knight', 'script', 'quotes', 'focus', 'thread', 'slot', 'whittle', 'diag', 'frame', 'rim',
];

// ─── segments ───────────────────────────────────────────────────────────────

// The daily games. Fresh lastmod every day, because that is what actually happens to them.
export function gamesEntries(baseUrl) {
  const today = easternMidnight();
  return GAME_PATHS.map((path) => ({
    url: `${baseUrl}/${path}`,
    lastModified: today,
    changeFrequency: 'daily',
    priority: 0.9,
  }));
}

export function listsEntries(baseUrl) {
  return LISTS.map((list) => ({
    url: `${baseUrl}/list/${list.id}`,
    lastModified: dateOf(list),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}

// The visible/catalog filters live in lib/quiz-catalog.js so this sitemap and the
// /quizzes/all index are guaranteed to cover the SAME set: a sitemapped quiz url can never
// exist without a crawlable link to it. Unlisted quizzes (mobile-preview clones) stay out of
// both, so they are reachable only by direct link.
export function quizzesEntries(baseUrl) {
  return catalogQuizzes().map((quiz) => ({
    url: `${baseUrl}/quiz/${quiz.id}`,
    lastModified: dateOf(quiz),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));
}

// Hubs, evergreen pages and legal. Everything that is neither a game, a list, nor a quiz.
export function pagesEntries(baseUrl) {
  const rankingsDate = new Date(`${GRIDIRON.fetchedAt}T12:00:00Z`);
  const listDates = LISTS.map(dateOf);
  const newestList = new Date(Math.max(...listDates.map((d) => d.getTime())));

  const visible = visibleQuizzes();
  const quizDates = visible.map(dateOf);
  const newestQuiz = quizDates.length
    ? new Date(Math.max(...quizDates.map((d) => d.getTime())))
    : newestList;

  return [
    { url: baseUrl, lastModified: newestQuiz, changeFrequency: 'daily', priority: 1.0 },
    // The puzzle category landing pages (lib/puzzle-categories.js): the pages that can rank
    // for the generic terms, and a second crawl path into every daily.
    ...PUZZLE_CATEGORIES.map((c) => ({ url: `${baseUrl}/${c.slug}`, lastModified: newestQuiz, changeFrequency: 'weekly', priority: 0.8 })),
    // The set pages under them (lib/puzzle-sets.js): the next tier of terms.
    ...ownSets().map((s) => ({ url: `${baseUrl}${s.href}`, lastModified: newestQuiz, changeFrequency: 'weekly', priority: 0.7 })),
    { url: `${baseUrl}/lists`, lastModified: newestList, changeFrequency: 'daily', priority: 0.9 },
    // The full quiz index. High priority on purpose: it is the only crawlable link path
    // to most of the /quiz/<id> pages (see lib/quiz-catalog.js).
    { url: `${baseUrl}/quizzes/all`, lastModified: newestQuiz, changeFrequency: 'daily', priority: 0.9 },
    // The quiz HOME (app/quizzes/page.js), which until 2026-09-04 was a 308 to the site
    // root and so had no business here. It is a browsing surface rather than an index --
    // the featured row, then the catalogue by topic -- and it links into /quizzes/all for
    // every one of the fifteen topics, so it adds a second crawl path rather than a
    // competing one. The index above keeps the higher priority: it is the path that
    // reaches every quiz page.
    { url: `${baseUrl}/quizzes`, lastModified: newestQuiz, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/geo/nyc-restaurants`, lastModified: new Date('2026-06-25'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/sporcle-alternative`, lastModified: newestQuiz, changeFrequency: 'monthly', priority: 0.6 },
    // The two Sports Ranking pages. Weekly, and lastModified is the snapshot's own
    // fetch date rather than Date.now(), which would be fake churn.
    // Absolute SOT_URL, not baseUrl: these two are canonical on the old host, so the sitemap
    // has to name the same origin their canonical tag does or the two signals disagree.
    { url: `${SOT_URL}/collegefootballrankings`, lastModified: rankingsDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SOT_URL}/nflrankings`, lastModified: rankingsDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SOT_URL}/mlbrankings`, lastModified: rankingsDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/experts-and-aggregators`, lastModified: newestList, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: newestQuiz, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/request`, lastModified: new Date('2026-01-01'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date('2026-01-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date('2026-01-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclosure`, lastModified: new Date('2026-01-01'), changeFrequency: 'yearly', priority: 0.3 },
  ];
}

// The circuit pages. Evergreen for the fourteen skill circuits (a fixed roster says the same
// true thing tomorrow) and daily for the marquee, whose roster is a daily read. They are also
// the crawlable link path INTO the dailies a circuit contains, which is the same job
// /quizzes/all does for the quiz pages.
//
// The run SUMMARY (/daily-five) is deliberately absent and must stay absent: it is noindex,
// it renders one viewer's own results, and it carries an hourly leaderboard.
export function circuitsEntries(baseUrl) {
  const today = easternMidnight();
  const live = ALL_CIRCUITS.filter((c) => circuitKeysFor(c.id).length >= 2);
  return [
    { url: `${baseUrl}/circuits`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    ...live.map((c) => ({
      url: `${baseUrl}${circuitPageHref(c.id)}`,
      lastModified: today,
      changeFrequency: c.marquee ? 'daily' : 'weekly',
      priority: c.marquee ? 0.8 : 0.7,
    })),
  ];
}

// ─── the whole set ──────────────────────────────────────────────────────────

// Named segments, in the order the index lists them. Adding a segment here adds it to the
// index, to /sitemaps/<name>.xml, and to the legacy old-host sitemap, all at once.
export const SITEMAP_SEGMENTS = [
  { name: 'games', build: gamesEntries },
  { name: 'lists', build: listsEntries },
  { name: 'quizzes', build: quizzesEntries },
  { name: 'circuits', build: circuitsEntries },
  { name: 'pages', build: pagesEntries },
];

// Every url in one array. app/legacy-sitemap serves the OLD hosts from this, and must keep
// serving all of them in a single file, so this cannot become an index.
export function sitemapEntries(baseUrl) {
  return SITEMAP_SEGMENTS.flatMap((segment) => segment.build(baseUrl));
}
