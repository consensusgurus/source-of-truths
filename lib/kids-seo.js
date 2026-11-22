// SEO for every Mind Loft Kids page (owner, 2026-11-22: "build SEO support for
// all kids pages"). One table, KIDS_SEO, holds each page's search title (70
// characters or fewer, the searcher's words first) and description (160 or
// fewer, "free" in it, no em dash). Every kids page.js reads its metadata from
// kidsMetadata(id) and mounts <KidsSeo id> (app/kids/KidsSeo.jsx) for the
// structured data, and lib/sitemap-entries.js lists every path here in the
// `kids` sitemap segment. A NEW kids page adds a row here, a page that calls
// both, and nothing else. scripts/verify-kids-seo.mjs checks all of it.
//
// kind: 'hub' | 'daily' (a new board every day) | 'match' (a card matching
// game) | 'make' (a make-your-own activity).

import { SITE_URL } from './site.js';

const row = (id, name, kind, title, description, extra = {}) => ({ id, name, kind, path: id === 'kids' ? '/kids' : `/kids/${id}`, title, description, ...extra });

export const KIDS_SEO_ROWS = [
  row('kids', 'Mind Loft Kids', 'hub',
    'Free Puzzles and Games for Kids, New Every Day | Mind Loft Kids',
    'Free daily puzzles, jigsaws, coloring, and matching games for kids. New boards every day, no sign-up, no ads, and nothing counts against them.'),

  // The kids dailies (lib/kids-daily.js).
  row('sixes', 'Shape Sixes', 'daily',
    'Shape Sudoku for Kids, Free Daily: Shape Sixes | Mind Loft Kids',
    'A free daily shape sudoku for kids. Every row, column, and box gets all six shapes, one of each. Real logic with shapes instead of numbers.'),
  row('mixup', 'Mix-Up', 'daily',
    'Word Scramble for Kids, Free Daily: Mix-Up | Mind Loft Kids',
    'A free daily word scramble for kids. The letters got jumbled: put five short words back together. Gentle spelling practice with hints anytime.'),
  row('sortit', 'Sort It', 'daily',
    'Word Sorting Game for Kids, Free Daily: Sort It | Mind Loft Kids',
    'A free daily word sorting puzzle for kids. Twelve words, three groups: find which words belong together. A gentle take on category puzzles.'),
  row('ladder', 'Ladder', 'daily',
    'Word Ladder for Kids, Free Daily: Ladder | Mind Loft Kids',
    'A free daily word ladder for kids. Change one letter at a time to climb from one word to another, like CAT to DOG. Spelling and logic in one.'),
  row('unpark', 'Unpark', 'daily',
    'Car Parking Puzzle for Kids, Free Daily: Unpark | Mind Loft Kids',
    'A free daily traffic jam puzzle for kids. Slide the cars out of the way and drive the red car out of the lot. Planning ahead made fun.'),
  row('mathdash', 'Math Dash', 'daily',
    'Math Practice Game for Kids, Free Daily: Math Dash | Mind Loft Kids',
    'A free daily math game for kids. Ten quick addition and subtraction sums and three hearts. How many can you get right? New sums every day.'),
  row('fitit', 'Fit It', 'daily',
    'Shape Fitting Puzzle for Kids, Free Daily: Fit It | Mind Loft Kids',
    'A free daily shape fitting puzzle for kids. A few pieces and a board with holes: make every piece fit. Spatial thinking for little hands.'),
  row('jigsaw', 'Puzzle Shelf', 'daily',
    'Free Jigsaw Puzzles for Kids, 6 to 30 Pieces | Mind Loft Kids',
    'Free online jigsaw puzzles for kids: real photos, two new every day, plus pictures kids color themselves. Pick 6, 12, 20, or 30 pieces.'),
  row('spot', 'Spot', 'daily',
    'Spot the Difference for Kids, Free Daily: Spot | Mind Loft Kids',
    'A free daily spot the difference game for kids. Two real photos, a few changes: tap what is different. New pictures every day.'),
  row('mop', 'Mop', 'daily',
    'Path Puzzle for Kids, Free Daily: Mop | Mind Loft Kids',
    'A free daily path puzzle for kids. Mop every tile of a little house once, never step on a wet tile, then get out the door.'),
  row('spin', 'Spin', 'daily',
    'Picture Rotation Puzzle for Kids, Free Daily: Spin | Mind Loft Kids',
    'A free daily picture puzzle for kids. Every square of the photo is turned: tap each one to spin it the right way round.'),

  // Make your own.
  row('crayon', 'Crayon', 'make',
    'Free Coloring Pages for Kids That Become Jigsaws | Mind Loft Kids',
    'Free online coloring for kids: color a picture with 96 colors, or draw your own, then play it as your own jigsaw puzzle. No sign-up, no ads.'),

  // The match games (app/kids/MatchGame.jsx).
  row('color-match', 'Color Match', 'match',
    'Color Matching Game for Kids, Free | Mind Loft Kids',
    'A free color matching memory game for kids. Match each color word to its color, ten pairs. Play alone or with up to four players.'),
  row('letter-match', 'Letter Match', 'match',
    'Uppercase and Lowercase Letter Match, Free | Mind Loft Kids',
    'A free letter matching game for kids. Match every capital letter to its lowercase letter, A to Z. Play alone or with up to four players.'),
  row('addition-match', 'Addition Match', 'match',
    'Addition Matching Game for Kids, Free | Mind Loft Kids',
    'A free addition memory game for kids. Match each addition fact to its answer, fourteen pairs. Play alone or with up to four players.'),
  row('memory-match', 'Treats Match', 'match',
    'Memory Matching Game for Kids: Treats Match | Mind Loft Kids',
    'A free memory card game for kids. Flip the cards and find the matching treats. Play alone or with up to four players.'),
  row('pizza-match', 'Pizza Match', 'match',
    'Pizza Memory Game for Kids, Free | Mind Loft Kids',
    'A free pizza memory matching game for kids. Find all fourteen matching pizzas. Play alone or with up to four players.'),
  row('dog-match', 'Dog Match', 'match',
    'Dog Breed Memory Game for Kids, Free | Mind Loft Kids',
    'A free dog memory matching game for kids. Find all fourteen matching dog breeds. Play alone or with up to four players.'),
  row('fantasy-match', 'Fantasy Match', 'match',
    'Unicorn and Dragon Memory Game for Kids, Free | Mind Loft Kids',
    'A free fantasy memory game for kids. Match unicorns, princesses, princes, castles, and dragons, fifteen pairs. Up to four players.'),
  row('word-match', 'Word Match', 'match',
    'Picture Word Matching Game for Kids, Free | Mind Loft Kids',
    'A free reading game for kids. Match each word to its picture, twelve pairs. Early reading practice that feels like a game.'),
  row('number-match', 'Number Match', 'match',
    'Number Words Matching Game for Kids, Free | Mind Loft Kids',
    'A free number matching game for kids. Match each number to its spelling, from 0 to 15. Play alone or with up to four players.'),

  // The learning match sets (app/kids/learning-matches.js).
  row('shape-match', 'Shape Match', 'match',
    'Shape Matching Game for Kids, Free | Mind Loft Kids',
    'A free shape matching game for kids. Match each shape to its name: circle, square, triangle, star, hexagon, and more. Twelve pairs.'),
  row('counting-match', 'Counting Match', 'match',
    'Counting Game for Kids, 1 to 12, Free | Mind Loft Kids',
    'A free counting game for kids. Count the dots and match each set to its number, 1 to 12. Twelve pairs, up to four players.'),
  row('subtraction-match', 'Subtraction Match', 'match',
    'Subtraction Matching Game for Kids, Free | Mind Loft Kids',
    'A free subtraction memory game for kids. Match each subtraction fact to its answer, fourteen pairs. Up to four players.'),
  row('times-table-match', 'Times Table Match', 'match',
    'Times Tables Matching Game for Kids, Free | Mind Loft Kids',
    'A free times tables game for kids. Match each multiplication fact to its answer, fourteen pairs. Up to four players.'),
  row('clock-match', 'Clock Match', 'match',
    'Telling Time Game for Kids: Clock Match, Free | Mind Loft Kids',
    'A free telling time game for kids. Match each clock face to its time, on the hour and half hour. Twelve pairs.'),
  row('mama-baby-match', 'Mama and Baby Match', 'match',
    'Animal Mama and Baby Matching Game, Free | Mind Loft Kids',
    'A free animal matching game for kids. Match each mama animal to her baby, twelve pairs. Up to four players.'),
  row('animal-sound-match', 'Animal Sound Match', 'match',
    'Animal Sounds Matching Game for Kids, Free | Mind Loft Kids',
    'A free animal sounds game for kids. Match each animal to the sound it makes, twelve pairs. Up to four players.'),
  row('opposites-match', 'Opposites Match', 'match',
    'Opposites Matching Game for Kids, Free | Mind Loft Kids',
    'A free opposites game for kids. Match each word to its opposite, like hot and cold. Twelve pairs, up to four players.'),
  row('rhyme-match', 'Rhyme Match', 'match',
    'Rhyming Words Game for Kids, Free | Mind Loft Kids',
    'A free rhyming game for kids. Match the words that rhyme, twelve pairs. Early reading and phonics practice that feels like play.'),
  row('flag-match', 'Flag Match', 'match',
    'Flags of the World Matching Game for Kids, Free | Mind Loft Kids',
    'A free flag matching game for kids. Match each flag to its country, twelve pairs. A first step into world geography.'),
  row('animal-home-match', 'Animal Home Match', 'match',
    'Animal Homes Matching Game for Kids, Free | Mind Loft Kids',
    'A free animal homes game for kids. Match each animal to where it lives, like a bee and its hive. Twelve pairs.'),
  row('job-match', 'Job Match', 'match',
    'Community Helpers Matching Game for Kids, Free | Mind Loft Kids',
    'A free jobs and tools matching game for kids. Match each job to the tool it uses. Twelve pairs, up to four players.'),
];

export const KIDS_SEO = Object.fromEntries(KIDS_SEO_ROWS.map((r) => [r.id, r]));

const OG = '/kids/opengraph-image';

// The full Next metadata object for a kids page.
export function kidsMetadata(id) {
  const r = KIDS_SEO[id];
  if (!r) throw new Error(`kids-seo: no row for ${id}`);
  const short = r.kind === 'hub' ? 'Mind Loft Kids' : `${r.name} | Mind Loft Kids`;
  return {
    title: r.title,
    description: r.description,
    alternates: { canonical: r.path },
    openGraph: { title: short, description: r.description, url: r.path, type: 'website', siteName: 'Mind Loft', images: [OG] },
    twitter: { card: 'summary_large_image', title: short, description: r.description, images: [OG] },
  };
}

const AUDIENCE = { '@type': 'PeopleAudience', suggestedMinAge: 4, suggestedMaxAge: 10 };
const GENRE = { daily: 'Puzzle', match: 'Memory game', make: 'Coloring', hub: 'Puzzle' };

// The structured data for a kids page: a Game (a CollectionPage for the hub)
// plus a BreadcrumbList. Only what the page really shows.
export function kidsJsonLd(id) {
  const r = KIDS_SEO[id];
  if (!r) return [];
  const url = `${SITE_URL}${r.path}`;
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Mind Loft', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Kids', item: `${SITE_URL}/kids` },
      ...(r.kind === 'hub' ? [] : [{ '@type': 'ListItem', position: 3, name: r.name, item: url }]),
    ],
  };
  if (r.kind === 'hub') {
    return [{
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: r.name,
      url,
      description: r.description,
      isAccessibleForFree: true,
      audience: AUDIENCE,
      hasPart: KIDS_SEO_ROWS.filter((x) => x.kind !== 'hub').map((x) => ({ '@type': 'Game', name: x.name, url: `${SITE_URL}${x.path}` })),
    }, crumbs];
  }
  return [{
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: r.name,
    url,
    description: r.description,
    genre: GENRE[r.kind],
    isAccessibleForFree: true,
    inLanguage: 'en',
    audience: AUDIENCE,
    image: `${SITE_URL}${OG}`,
    publisher: { '@type': 'Organization', name: 'Mind Loft', url: SITE_URL },
  }, crumbs];
}

// Every kids path for the sitemap (lib/sitemap-entries.js `kids` segment).
export function kidsPaths() {
  return KIDS_SEO_ROWS.map((r) => ({ path: r.path, daily: r.kind === 'daily' || r.kind === 'hub' }));
}
