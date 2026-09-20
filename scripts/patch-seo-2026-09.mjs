#!/usr/bin/env node
// SEO pass, 2026-09-20. Anchored edits against a FRESH origin export.
// Every anchor must match EXACTLY ONCE (0 = origin moved, 2 = anchor too loose).
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) { console.error('usage: patch-seo.mjs <exported-tree>'); process.exit(1); }
const changed = new Set(); const removed = [];
let fails = 0;

function read(f) { return readFileSync(join(ROOT, f), 'utf8'); }
function write(f, s) { writeFileSync(join(ROOT, f), s); changed.add(f); }

function edit(f, anchor, repl, label) {
  const src = read(f);
  const n = src.split(anchor).length - 1;
  if (n !== 1) { console.error(`FAIL ${label}: anchor matched ${n}x in ${f}`); fails++; return; }
  write(f, src.replace(anchor, repl));
  console.log(`  ok  ${label}`);
}

function drop(f) {
  const p = join(ROOT, f);
  if (existsSync(p)) unlinkSync(p);
  removed.push(f); console.log(`  rm  ${f}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIST PAGES SERVER-RENDER. The gate was `!loaded`, which only flips after a
//    client-side fetchBootstrap, so Googlebot got "Loading the ranking..." and
//    no H1, no title, no blurb, no ranking on all 586 list pages. `list` comes
//    from the statically imported LISTS, so it resolves during the server
//    render; bootstrap now only enriches (votes, views, extras). Every browser
//    access in this file is already inside an effect behind a typeof guard, and
//    the first client render starts from the same empty voteData/extras the
//    server used, so hydration matches.
// ─────────────────────────────────────────────────────────────────────────────
edit('app/list/[id]/DetailClient.jsx', '      {!loaded ? (', '      {!list ? (', 'list SSR gate');

// ─────────────────────────────────────────────────────────────────────────────
// 2. QUIZ TAIL. 1,853 sitemapped quiz URLs earned 12 clicks in 90 days and were
//    136 of 175 duplicate-without-canonical pages. lib/quiz-seo.js keeps the
//    ones with demand or editorial investment; the rest go noindex,follow and
//    leave the sitemap.
// ─────────────────────────────────────────────────────────────────────────────
const keep = JSON.parse(readFileSync(process.env.HOME + '/seowork/keep-final.json', 'utf8'));
const OBSERVED_LIST = keep.observed;
write('lib/quiz-seo.js', `// WHICH QUIZZES ARE INDEXABLE (Search Console pass, 2026-09-20).
//
// WHY. The quiz segment submitted 1,853 URLs. Over 90 days 206 of them earned a
// single impression between them and the whole segment earned 12 clicks, while
// 136 of the site's 175 "Duplicate without user-selected canonical" pages were
// /quiz/ URLs. Until 2026-09-17 every quiz page server-rendered an empty
// Suspense fallback (see QuizStageShell), so Google saw ~1,850 identical bodies
// and clustered them; the shell fixed the render, but a page whose unique text
// is a title plus a blurb is still thin, and 1,600 of them were spending the
// crawl budget of the pages that do convert.
//
// THE RULE. A quiz stays indexable when it has either DEMAND or INVESTMENT:
//   observed  it earned at least one impression in the 90 days to 2026-09-20
//   heroed    it carries a curated hero (lib/quiz-heroes.js QUIZ_HEROES)
//   qotd      it is in the Quiz of the Day pool or an override
//   company   it is a company earnings quiz (lib/company-quiz-meta.js)
//   business  it is a Business News hub quiz (news recap, earnings, sector)
// Everything else renders robots noindex,follow and is dropped from the
// sitemap. noindex rather than a 404 or a redirect: the page is real and worth
// playing, it just should not compete for crawl budget. follow so the links on
// it still flow.
//
// IT IS NOT A BLOCKLIST AND NOT PERMANENT. Hero a quiz, put it in the QOTD pool
// or give it real content and it comes back. To refresh the observed set, read
// the /quiz/ rows out of the Search Console page report over 90 days, keep the
// slugs (dropping dated daily-game stubs, which canonicalize to their game
// page), and replace OBSERVED below.
//
// Do NOT re-inline this filter at a call site. lib/sitemap-entries.js and
// app/quiz/[id]/page.js both read quizIndexable(), so a sitemapped quiz URL
// cannot exist without an indexable page behind it, which is the same
// invariant lib/quiz-catalog.js exists to keep.

// Search Console, 90 days to 2026-09-20: every /quiz/ URL with >= 1 impression.
const OBSERVED = ${JSON.stringify(OBSERVED_LIST)};

import { QUIZ_HEROES, QOTD_POOL, QOTD_OVERRIDES } from '@/lib/quiz-heroes';
import { COMPANY_META } from '@/lib/company-quiz-meta';

// The Business News hub's own patterns (app/quizzes/business-news).
const NEWS_RE = /^(daily-market-news|daily-business|weekly-business|earnings-reporter)/;
const EARN_RE = /-\\dq\\d\\d-earnings-quiz$/i;
const SECTOR_RE = /-sector-update$/;

let cache = null;
function keepSet() {
  if (cache) return cache;
  cache = new Set([
    ...OBSERVED,
    ...Object.keys(QUIZ_HEROES || {}),
    ...(QOTD_POOL || []),
    ...Object.values(QOTD_OVERRIDES || {}),
    ...Object.keys(COMPANY_META || {}),
  ]);
  return cache;
}

export function quizIndexable(id) {
  if (!id) return false;
  if (NEWS_RE.test(id) || EARN_RE.test(id) || SECTOR_RE.test(id)) return true;
  return keepSet().has(id);
}

export function indexableQuizzes(quizzes) {
  return (quizzes || []).filter((q) => quizIndexable(q.id));
}
`);
console.log('  ok  lib/quiz-seo.js written');

edit('lib/sitemap-entries.js',
`export function quizzesEntries(baseUrl) {
  return catalogQuizzes().map((quiz) => ({`,
`export function quizzesEntries(baseUrl) {
  // Only the indexable set (lib/quiz-seo.js). A noindex page in a sitemap is a
  // crawl request the page then refuses, which is the worst of both.
  return indexableQuizzes(catalogQuizzes()).map((quiz) => ({`,
  'sitemap quiz filter');

edit('lib/sitemap-entries.js',
  "import { catalogQuizzes, visibleQuizzes } from '@/lib/quiz-catalog';",
  "import { catalogQuizzes, visibleQuizzes } from '@/lib/quiz-catalog';\nimport { indexableQuizzes } from '@/lib/quiz-seo';",
  'sitemap quiz-seo import');

edit('app/quiz/[id]/page.js',
  `    alternates: { canonical: gameCanonical || url },`,
  `    alternates: { canonical: gameCanonical || url },
    // The thin tail is noindex,follow (lib/quiz-seo.js). A dated game stub is
    // already canonicalized above, so it needs no second signal.
    ...(gameCanonical || quizIndexable(id) ? {} : { robots: { index: false, follow: true } }),`,
  'quiz noindex');

edit('app/quiz/[id]/page.js',
  "import { getQuiz } from '@/lib/quizzes';",
  "import { getQuiz } from '@/lib/quizzes';\nimport { quizIndexable } from '@/lib/quiz-seo';",
  'quiz page quiz-seo import');


// ─────────────────────────────────────────────────────────────────────────────
// 3. THE SHARE-CARD ROUTES. All five of Search Console's server errors were
//    /opengraph-image or /twitter-image routes (root, /quizzes, and two per-item
//    ones), crawled Sep 10-15. The cause was the Satori fonts missing from the
//    function bundle, fixed by outputFileTracingIncludes in c3b2ee18c on
//    2026-09-17, i.e. AFTER those crawls. Three things here on top of that:
//
//    (a) X-Robots-Tag: noindex on every share-card route. These are assets for a
//        social crawler, not pages, and they have no business in the index. A
//        robots.txt Disallow would have been the blunter tool: Facebook and
//        LinkedIn honour robots.txt when fetching og:image, so disallowing would
//        have cost link previews. A header leaves them fetchable.
//    (b) The singleton cards are STATIC PNGs already (public/og/, baked by
//        scripts/bake-og.mjs --site on 2026-09-17), so the dynamic routes beside
//        them were redundant: every crawl paid for a Satori render of a picture
//        that exists on disk. Deleted, and each page's metadata now names the
//        file.
//    (c) The per-item routes (quiz, list, circuit, player, kids, contest) stay
//        dynamic, because there are 2,400+ of them and they cannot be baked. They
//        now fall back to the matching static card instead of throwing a 500, so
//        the worst case is a generic share image rather than a server error.
// ─────────────────────────────────────────────────────────────────────────────
edit('next.config.js', '  async redirects() {', `  // Share-card image routes are assets, not pages. noindex keeps them out of
  // the index (they were 5 of the 5 "Server error (5xx)" rows in Search
  // Console) while leaving them fetchable, which a robots.txt Disallow would
  // not: the social crawlers honour robots.txt for og:image.
  async headers() {
    return [
      {
        source: '/:path*/opengraph-image',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/:path*/twitter-image',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/:path*/share-image',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        source: '/:path*/poster-image',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },
  async redirects() {`, 'next.config X-Robots-Tag');

// (b) Static cards in place of the redundant dynamic singleton routes.
const STATIC_CARDS = [
  ['app/layout.js', 'brand', 'Mind Loft: daily puzzles and quizzes'],
  ['app/daily/page.js', 'daily', 'Mind Loft: the daily puzzle archive'],
  ['app/lists/page.js', 'lists', 'Mind Loft: consensus Top 10 Lists'],
  ['app/quizzes/page.js', 'quizzes', 'Mind Loft quizzes'],
  ['app/alibi/page.js', 'alibi', 'Alibi: a daily logic puzzle from Mind Loft'],
  ['app/shoe/page.js', 'shoe', 'Shoe: a daily card-counting puzzle from Mind Loft'],
  ['app/span/page.js', 'span', 'Span: a daily route puzzle from Mind Loft'],
  ['app/sweep/page.js', 'sweep', 'Sweep: a daily arcade puzzle from Mind Loft'],
];
for (const [file, card, alt] of STATIC_CARDS) {
  edit(file, '  openGraph: {', `  openGraph: {
    images: [{ url: '/og/${card}.png', width: 1200, height: 630, alt: '${alt}' }],`, `static og: ${card}`);
  const src = read(file);
  if (src.includes('  twitter: {')) {
    edit(file, '  twitter: {', `  twitter: {
    images: ['/og/${card}.png'],`, `static twitter: ${card}`);
  }
}
// Both kinds go together: the twitter route re-exports the OG route's default,
// so deleting one alone would break the build.
for (const dir of ['', 'daily/', 'lists/', 'quizzes/', 'alibi/', 'shoe/', 'span/', 'sweep/']) {
  for (const kind of ['opengraph-image.js', 'twitter-image.js']) drop(`app/${dir}${kind}`);
}

// (c) Per-item routes fall back to a static card rather than a 500.
const FALLBACKS = [
  ['app/quiz/[id]/opengraph-image.js', 'quizzes'],
  ['app/list/[id]/opengraph-image.js', 'lists'],
  ['app/circuits/[id]/opengraph-image.js', 'daily'],
  ['app/circuits/[id]/run/opengraph-image.js', 'daily'],
  ['app/kids/opengraph-image.js', 'brand'],
  ['app/kids/twitter-image.js', 'brand'],
  ['app/player/[name]/opengraph-image.js', 'brand'],
  ['app/quizzes/contest/opengraph-image.js', 'quizzes'],
];
for (const [f, card] of FALLBACKS) {
  if (!existsSync(join(ROOT, f))) { console.error(`FAIL fallback: missing ${f}`); fails++; continue; }
  const src = read(f);
  const m = src.match(/export default (async )?function Image\s*\(/);
  if (!m) { console.error(`FAIL fallback: no Image export in ${f}`); fails++; continue; }
  if (src.includes('ogFallback')) { console.log(`  --  ${f} already wrapped`); continue; }
  // Rename the original and wrap it. A thrown Satori render becomes a 302 to
  // the baked card, so a crawler gets an image and never a 5xx.
  const renamed = src.replace(m[0], `${m[1] ? 'async ' : ''}function renderCard(`)
    .replace('export default ', '');
  write(f, `${renamed}

// A Satori render that throws used to surface as a 500, which is how these
// routes became every one of Search Console's server errors. Fall back to the
// baked card in public/og/ instead: a generic share image beats an error.
export default async function Image(ctx) {
  try {
    return await renderCard(ctx);
  } catch (err) {
    console.error('share card failed, serving /og/${card}.png', err);
    return new Response(null, { status: 302, headers: { Location: '/og/${card}.png' } });
  }
}
`);
  console.log(`  ok  fallback ${f}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DATED GAME STUBS: canonicalize ALL of them, not the 21 hardcoded here.
//    GAME_URLS listed 21 formats while lib/quiz-catalog.js knows 95, so a stub
//    for any game launched after that map was written (encore, knight, towers,
//    atlas, biz...) canonicalized to itself and competed with its own game page.
// ─────────────────────────────────────────────────────────────────────────────
edit('app/quiz/[id]/page.js',
  '  const gameCanonical = GAME_URLS[quiz.format] || null;',
  `  // Fall back to the registry so a stub for a game launched after GAME_URLS
  // was written still points at its evergreen page instead of competing with
  // it. WORD_GAME_FORMATS is the same set lib/quiz-catalog.js keeps out of the
  // sitemap, and DAILY_GAME_MAP carries the href overrides (/jesters, /parker).
  const registryHref = WORD_GAME_FORMATS.has(quiz.format)
    ? (DAILY_GAME_MAP[quiz.format]?.href || \`/\${quiz.format}\`)
    : null;
  const gameCanonical = GAME_URLS[quiz.format] || registryHref;`,
  'stub canonical fallback');

edit('app/quiz/[id]/page.js',
  "import { quizIndexable } from '@/lib/quiz-seo';",
  `import { quizIndexable } from '@/lib/quiz-seo';
import { WORD_GAME_FORMATS } from '@/lib/quiz-catalog';
import { DAILY_GAME_MAP } from '@/lib/daily-games';`,
  'stub canonical imports');

// ─────────────────────────────────────────────────────────────────────────────
// 5. THE HOMEPAGE HAD NO H1 (13 h2s, no h1). Promoting the About heading is a
//    pure element change: same class, same text, same CSS, so nothing moves on
//    the page. The homepage title tag was already doing the real work here, so
//    this is the small end of the pass.
// ─────────────────────────────────────────────────────────────────────────────
edit('app/quizzes/QuizHomeClient.jsx',
  `<h2 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: '#e8eefc' }}>About Mind Loft</h2>`,
  `<h1 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: '#e8eefc' }}>About Mind Loft</h1>`,
  'home h1');


writeFileSync(process.env.HOME + '/seowork/manifest.json', JSON.stringify({ changed: [...changed], removed }, null, 1));
console.log(`\nchanged ${changed.size} files, removed ${removed.length}`);
console.log(fails ? `\n${fails} FAILURES` : '\nall anchors matched');
process.exit(fails ? 1 : 0);
