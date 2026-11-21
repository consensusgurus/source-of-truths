// JIGSAW TOPICS (SEO pass, 2026-11-21). Every Jig and Saw photo sorted into one
// topic, so the Jigsaw Puzzle Shelf can link out to topic pages
// (/jig/shelf/<slug>) that answer searches like "animal jigsaw puzzles" or
// "landscape jigsaw puzzles online". A photo gets the FIRST topic whose words
// match its printed name; anything unmatched falls to Landscapes. OVERRIDE
// pins a name the words get wrong. New photos sort themselves; check a new
// batch with:  node -e "import('./lib/jigsaw-topics.js').then(m=>m.debugTopics())"

export const JIGSAW_TOPICS = [
  {
    slug: 'animals',
    label: 'Animals',
    h1: 'Animal Jigsaw Puzzles',
    title: 'Animal Jigsaw Puzzles: Free Online, No Download | Mind Loft',
    blurb: 'Free animal jigsaw puzzles online: puppies, foxes, owls, otters, red pandas and more, each a real wildlife or pet photograph you can play in your browser.',
    words: /\b(dogs?|pupp(y|ies)|cats?|kittens?|foxe?s?|owls?|otters?|pandas?|hedgehogs?|chipmunks?|penguins?|zebras?|raccoons?|goats?|poodles?|dalmatians?|bulldogs?|prairie dogs?|wildcat|cardinal|drongo|rooster|birds?|starfish|horses?|deer|bears?|lions?|tigers?|elephants?|giraffes?|monkeys?|squirrels?|rabbits?|bunn(y|ies)|ducks?|swans?|parrots?|turtles?|frogs?|butterfl(y|ies)|bees?|seals?|whales?|dolphins?|fish|lambs?|sheep|cows?|pigs?|hens?|eagles?|hawks?|herons?|kingfishers?|lemurs?|koalas?|sloths?|meerkats?|alpacas?|llamas?|goby|marmots?|rollers?|jays?|lynx|ibex|stags?)\b/i,
  },
  {
    slug: 'food',
    label: 'Food',
    h1: 'Food Jigsaw Puzzles',
    title: 'Food Jigsaw Puzzles: Free Online Photo Jigsaws | Mind Loft',
    blurb: 'Free food jigsaw puzzles online: cakes, buns, mushrooms, markets and more, each a mouthwatering photograph cut into pieces you can play in your browser.',
    words: /\b(cakes?|buns?|bread|mushrooms?|ice cream|pie|cookies?|fruit|apples?|berries|cheese|pastr(y|ies)|tea ceremony|coffee|vegetables?|pizza|sushi|chocolate|donuts?|doughnuts?|macarons?|lemons?|grapes?|pumpkins?|candy|sweets)\b/i,
  },
  {
    slug: 'flowers',
    label: 'Flowers',
    h1: 'Flower Jigsaw Puzzles',
    title: 'Flower Jigsaw Puzzles: Free Online Photo Jigsaws | Mind Loft',
    blurb: 'Free flower jigsaw puzzles online: poppies, daylilies, clematis, hydrangeas, autumn leaves and more, close up photographs full of colour to piece together.',
    words: /\b(flowers?|poppies|poppy|lil(y|ies)|daylil(y|ies)|clematis|hydrangeas?|roses?|tulips?|daisies|daisy|sunflowers?|orchids?|lavender|blossoms?|bud|leaves|petals?|bloom|iris|cranesbill|oakmoss|magnolias?)\b/i,
  },
  {
    slug: 'cities-and-landmarks',
    label: 'Cities and Landmarks',
    h1: 'City and Landmark Jigsaw Puzzles',
    title: 'City and Landmark Jigsaw Puzzles: Free Online | Mind Loft',
    blurb: 'Free jigsaw puzzles of cities and famous landmarks: Venice, Kyoto, Copenhagen, castles, cathedrals, bridges, windmills and lighthouses from around the world.',
    words: /\b(city|town|street|castle|cathedral|dom|church|towers?|torre|viaduct|park, chicago|bridge|windmill|lighthouse|torii|temple|palace|nyhavn|venice|kyoto|frankfurt|lviv|havana|berlin|moscow|florence|singapore|carnival|oktoberfest|harbou?r|house|village|amalfi|atrani|square|skyline|basilica|mosque|abbey|market|thrill ride|vintage car|rain vortex|bench)\b/i,
  },
  {
    slug: 'landscapes',
    label: 'Landscapes',
    h1: 'Landscape Jigsaw Puzzles',
    title: 'Landscape and Nature Jigsaw Puzzles: Free Online | Mind Loft',
    blurb: 'Free landscape and nature jigsaw puzzles online: waterfalls, mountain lakes, forests, rice terraces, beaches and coastlines, each a featured photograph to piece together.',
    words: null, // the fallback
  },
];

// Names the word lists sort wrongly.
const OVERRIDE = {
  'A fisherman at Muzhappilangad Beach, India': 'landscapes',
  'Autumn beech leaves, Münster': 'flowers',
  'A woman and her pet rooster, Havana': 'animals',
  'A northern cardinal in Central Park': 'animals',
  'A raccoon in Central Park': 'animals',
  'A bench above Lech, Austria': 'landscapes',
  'A house on the coast near Eiði, Faroe Islands': 'landscapes',
  'Chimney Rock, Point Reyes': 'landscapes',
  'A waterfall at the New York Botanical Garden': 'landscapes',
  'A Christmas scene by Jenny Nyström': 'cities-and-landmarks',
};

export function topicOf(name) {
  if (OVERRIDE[name]) return OVERRIDE[name];
  for (const t of JIGSAW_TOPICS) if (t.words && t.words.test(name || '')) return t.slug;
  return 'landscapes';
}

export const topicBySlug = (slug) => JIGSAW_TOPICS.find((t) => t.slug === slug) || null;

export async function debugTopics() {
  const jig = (await import('../app/jig/puzzles.js')).PUZZLES;
  const saw = (await import('../app/saw/puzzles.js')).PUZZLES;
  const out = {};
  for (const p of [...jig, ...saw]) (out[topicOf(p.name)] ||= []).push(p.name);
  for (const [k, v] of Object.entries(out)) console.log(`\n${k} (${v.length})\n  ${v.join('\n  ')}`);
}
