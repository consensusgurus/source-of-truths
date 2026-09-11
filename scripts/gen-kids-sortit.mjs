#!/usr/bin/env node
// gen-kids-sortit: build app/kids/sortit/puzzles.js, the Sort It bank.
//
// Sort It is Links for kids: twelve words, three NAMED groups of four, no
// decoys and no mistake limit. The categories below are written so that no
// word could honestly sit in two of them (verified: a word appears in one
// category only, and a hand-kept AVOID list keeps apart pairs that would read
// as one group to a six-year-old, e.g. Pets beside Farm animals).
// Rules the bank keeps, re-checked by scripts/verify-kids.mjs:
//   - three categories a day, none of the three within an AVOID pair
//   - four words per group, every word in exactly one of the day's groups
//   - a category returns no sooner than 6 days later; a word no sooner than 12
//
//   node scripts/gen-kids-sortit.mjs [--days 60] [--seed 11]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const DAYS = +opt('--days', 60);
const SEED = +opt('--seed', 11);

export const CATS = {
  'Farm animals': ['cow', 'pig', 'hen', 'goat', 'sheep', 'horse', 'duck', 'donkey'],
  'Fruit': ['apple', 'pear', 'grape', 'banana', 'peach', 'cherry', 'melon', 'plum'],
  'Vegetables': ['carrot', 'pea', 'corn', 'onion', 'potato', 'broccoli', 'bean', 'pepper'],
  'Things that fly': ['kite', 'plane', 'bee', 'bird', 'helicopter', 'balloon', 'rocket', 'butterfly'],
  'Colors': ['red', 'blue', 'green', 'pink', 'purple', 'black', 'yellow', 'brown'],
  'Shapes': ['circle', 'square', 'star', 'heart', 'triangle', 'oval', 'diamond', 'rectangle'],
  'Sea animals': ['whale', 'shark', 'crab', 'octopus', 'dolphin', 'seal', 'jellyfish', 'starfish'],
  'Bugs': ['ant', 'ladybug', 'beetle', 'spider', 'worm', 'moth', 'cricket', 'snail'],
  'Things you wear': ['hat', 'sock', 'shoe', 'coat', 'scarf', 'glove', 'shirt', 'dress'],
  'Things in a kitchen': ['spoon', 'fork', 'plate', 'oven', 'pan', 'bowl', 'fridge', 'kettle'],
  'Toys': ['doll', 'blocks', 'puzzle', 'yo-yo', 'teddy', 'marbles', 'robot', 'jump rope'],
  'Things with wheels': ['car', 'bus', 'truck', 'bike', 'train', 'scooter', 'wagon', 'tractor'],
  'Weather': ['rain', 'snow', 'wind', 'fog', 'hail', 'sunshine', 'storm', 'cloud'],
  'Parts of your face': ['nose', 'eye', 'ear', 'mouth', 'chin', 'cheek', 'eyebrow', 'lip'],
  'Musical instruments': ['drum', 'piano', 'flute', 'guitar', 'violin', 'trumpet', 'harp', 'bell'],
  'Sports': ['soccer', 'tennis', 'hockey', 'golf', 'baseball', 'swimming', 'skiing', 'basketball'],
  'Sweet treats': ['cake', 'candy', 'cookie', 'pie', 'donut', 'brownie', 'lollipop', 'fudge'],
  'Drinks': ['milk', 'juice', 'water', 'tea', 'cocoa', 'lemonade', 'smoothie', 'soda'],
  'Jungle animals': ['tiger', 'monkey', 'parrot', 'snake', 'jaguar', 'sloth', 'gorilla', 'toucan'],
  'Things at the beach': ['sand', 'shell', 'wave', 'towel', 'bucket', 'sunscreen', 'sandcastle', 'seaweed'],
  'School things': ['pencil', 'desk', 'book', 'ruler', 'crayon', 'eraser', 'glue', 'backpack'],
  'Tools': ['hammer', 'saw', 'drill', 'wrench', 'ladder', 'nail', 'screw', 'tape'],
  'Baby animals': ['puppy', 'kitten', 'calf', 'foal', 'chick', 'lamb', 'cub', 'piglet'],
  'Things in the sky at night': ['moon', 'stars', 'comet', 'planet', 'owl', 'fireflies', 'satellite', 'meteor'],
  'Rooms in a house': ['kitchen', 'bedroom', 'bathroom', 'attic', 'garage', 'hallway', 'basement', 'closet'],
  'Things that are cold': ['ice', 'snowman', 'popsicle', 'freezer', 'igloo', 'iceberg', 'slush', 'penguin'],
  'Things that are hot': ['sun', 'fire', 'lava', 'soup', 'toast', 'candle', 'stove', 'desert'],
  'Birds': ['robin', 'eagle', 'swan', 'crow', 'pigeon', 'hawk', 'peacock', 'flamingo'],
  'Things on a farm': ['barn', 'hay', 'windmill', 'fence', 'silo', 'scarecrow', 'trough', 'plow'],
  'Things in a bathroom': ['soap', 'toilet', 'toothbrush', 'bathtub', 'shampoo', 'mirror', 'sponge', 'sink'],
  'Ocean things': ['coral', 'reef', 'tide', 'anchor', 'boat', 'lighthouse', 'dune', 'pier'],
};

// Pairs a kid would fairly read as one group, or that share a word.
export const AVOID = [
  ['Farm animals', 'Baby animals'], ['Farm animals', 'Things on a farm'], ['Farm animals', 'Birds'],
  ['Things that fly', 'Birds'], ['Things that fly', 'Bugs'], ['Things that fly', 'Things in the sky at night'],
  ['Sea animals', 'Ocean things'], ['Sea animals', 'Things at the beach'], ['Ocean things', 'Things at the beach'],
  ['Things you wear', 'Things at the beach'], ['Things in a kitchen', 'Things that are hot'], ['Things in a kitchen', 'Rooms in a house'],
  ['Things in a bathroom', 'Rooms in a house'], ['Things in a bathroom', 'Things at the beach'],
  ['Weather', 'Things that are cold'], ['Weather', 'Things that are hot'], ['Weather', 'Things in the sky at night'],
  ['Things that are cold', 'Things that are hot'], ['Things that are cold', 'Sea animals'], ['Things that are cold', 'Birds'],
  ['Jungle animals', 'Birds'], ['Jungle animals', 'Baby animals'], ['Bugs', 'Birds'],
  ['Things with wheels', 'Things on a farm'], ['Toys', 'Sports'], ['Sweet treats', 'Fruit'], ['Sweet treats', 'Drinks'],
  ['Musical instruments', 'Toys'], ['Fruit', 'Vegetables'], ['Fruit', 'Drinks'], ['Drinks', 'Things that are hot'],
  ['Tools', 'Things in a kitchen'], ['School things', 'Toys'], ['Vegetables', 'Things on a farm'],
  ['Drinks', 'Things that are cold'], ['Shapes', 'Things in the sky at night'], ['Toys', 'Things with wheels'],
];
const avoidKey = (a, b) => [a, b].sort().join('|');
const AVOID_SET = new Set(AVOID.map(([a, b]) => avoidKey(a, b)));

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const rand = rng(SEED);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const isMain = process.argv[1] && process.argv[1].endsWith('gen-kids-sortit.mjs');
const names = Object.keys(CATS);
const catLast = new Map();
const wordLast = new Map();
const CAT_GAP = 6;
const WORD_GAP = 12;
const bank = [];
for (let day = 1; isMain && day <= DAYS; day++) {
  const chosen = [];
  const order = shuffle(names).sort((a, b) => (catLast.get(a) || -99) - (catLast.get(b) || -99));
  for (const n of order) {
    if (chosen.length === 3) break;
    const lc = catLast.get(n);
    if (lc != null && day - lc < CAT_GAP) continue;
    if (chosen.some((c) => AVOID_SET.has(avoidKey(c, n)))) continue;
    const free = CATS[n].filter((w) => { const lw = wordLast.get(w); return lw == null || day - lw >= WORD_GAP; });
    if (free.length < 4) continue;
    chosen.push(n);
  }
  if (chosen.length < 3) throw new Error(`day ${day}: only ${chosen.length} categories free`);
  const groups = chosen.map((n) => {
    const free = shuffle(CATS[n].filter((w) => { const lw = wordLast.get(w); return lw == null || day - lw >= WORD_GAP; }));
    return { name: n, words: free.slice(0, 4) };
  });
  for (const g of groups) { catLast.set(g.name, day); for (const w of g.words) wordLast.set(w, day); }
  const board = shuffle(groups.flatMap((g) => g.words));
  bank.push({ num: day, groups, board });
}

const src = `// Sort It bank. GENERATED by scripts/gen-kids-sortit.mjs; do not edit by hand.
// Three named groups of four words, twelve words shuffled on the board. Groups
// are named up front, so this is sorting rather than guessing. The bank CYCLES
// over kids days (lib/kids-daily.js).
export const PUZZLES = [
${bank.map((b) => `  { num: ${b.num}, groups: ${JSON.stringify(b.groups)}, board: ${JSON.stringify(b.board)} },`).join('\n')}
];
`;
if (isMain) {
  writeFileSync(join(here, '..', 'app', 'kids', 'sortit', 'puzzles.js'), src);
  console.log(`wrote ${bank.length} days to app/kids/sortit/puzzles.js`);
}
