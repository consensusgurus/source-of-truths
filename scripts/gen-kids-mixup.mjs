#!/usr/bin/env node
// gen-kids-mixup: build app/kids/mixup/puzzles.js, the Mix-Up bank.
//
// Mix-Up is Garble for kids: five words, each scrambled, each with a picture
// clue (an emoji, so the page needs no image pipeline). Words are 3 to 5
// letters from the list below, every one a thing a six-year-old can name from
// its picture. Rules the bank keeps, and scripts/verify-kids.mjs re-checks:
//   - five words a day: two 3s, two 4s, one 5 on days 1-2 of each 3-day block,
//     one 3, two 4s, two 5s on the third (a soft ramp, never a wall)
//   - a scramble is never the word itself and never leaves a 3+ letter prefix
//     of the word in place
//   - no word returns inside 14 days, and no word more than 3 times in the bank
//   - no day holds two words that share a first letter AND a length (two
//     scrambles of the same shape are a guessing game)
//
//   node scripts/gen-kids-mixup.mjs [--days 60] [--seed 7]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const DAYS = +opt('--days', 60);
const SEED = +opt('--seed', 7);

// word, emoji
export const WORDS = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['car', '🚗'], ['egg', '🥚'], ['cow', '🐮'], ['pig', '🐷'],
  ['hat', '🎩'], ['bed', '🛏️'], ['bee', '🐝'], ['ant', '🐜'], ['key', '🔑'], ['cup', '☕'], ['bug', '🐛'], ['fox', '🦊'],
  ['pie', '🥧'], ['bat', '🦇'], ['hen', '🐔'], ['owl', '🦉'], ['jam', '🫙'], ['box', '📦'], ['map', '🗺️'], ['bag', '👜'],
  ['pen', '🖊️'], ['ice', '🧊'], ['web', '🕸️'], ['gem', '💎'], ['leg', '🦵'], ['eye', '👁️'], ['ear', '👂'], ['toy', '🧸'],
  ['bow', '🏹'], ['saw', '🪚'], ['pot', '🍲'], ['nut', '🥜'], ['ham', '🍖'], ['rat', '🐀'], ['tie', '👔'], ['van', '🚐'], ['jet', '🛩️'], ['cap', '🧢'], ['log', '🪵'], ['pin', '📌'],
  ['frog', '🐸'], ['fish', '🐟'], ['star', '⭐'], ['cake', '🎂'], ['bike', '🚲'], ['moon', '🌙'], ['tree', '🌳'], ['ball', '⚽'],
  ['book', '📚'], ['duck', '🦆'], ['boat', '⛵'], ['kite', '🪁'], ['bear', '🐻'], ['lion', '🦁'], ['milk', '🥛'], ['corn', '🌽'],
  ['pear', '🍐'], ['drum', '🥁'], ['ring', '💍'], ['shoe', '👟'], ['sock', '🧦'], ['bell', '🔔'], ['leaf', '🍁'], ['rain', '🌧️'],
  ['snow', '❄️'], ['bird', '🐦'], ['crab', '🦀'], ['taco', '🌮'], ['nose', '👃'], ['hand', '✋'], ['door', '🚪'], ['lamp', '💡'],
  ['rose', '🌹'], ['seal', '🦭'], ['goat', '🐐'], ['wolf', '🐺'], ['deer', '🦌'], ['worm', '🪱'], ['ship', '🚢'], ['gift', '🎁'],
  ['fire', '🔥'], ['coat', '🧥'], ['nest', '🪺'], ['bone', '🦴'], ['bath', '🛁'], ['kiwi', '🥝'], ['plum', '🫐'], ['mask', '🎭'],
  ['pizza', '🍕'], ['train', '🚆'], ['house', '🏠'], ['horse', '🐴'], ['mouse', '🐭'], ['sheep', '🐑'], ['snake', '🐍'], ['tiger', '🐯'],
  ['whale', '🐳'], ['zebra', '🦓'], ['bread', '🍞'], ['grape', '🍇'], ['lemon', '🍋'], ['clock', '⏰'], ['plane', '✈️'], ['truck', '🚚'],
  ['robot', '🤖'], ['ghost', '👻'], ['crown', '👑'], ['heart', '❤️'], ['cloud', '☁️'], ['candy', '🍬'], ['chair', '🪑'], ['shark', '🦈'],
  ['panda', '🐼'], ['koala', '🐨'], ['camel', '🐫'], ['tooth', '🦷'], ['apple', '🍎'], ['piano', '🎹'], ['melon', '🍉'], ['onion', '🧅'],
  ['spoon', '🥄'], ['broom', '🧹'], ['scarf', '🧣'], ['glove', '🧤'], ['shirt', '👕'], ['dress', '👗'], ['brush', '🪥'], ['juice', '🧃'],
];

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const rand = rng(SEED);
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function goodScramble(word, s) {
  if (s === word) return false;
  for (let k = 3; k <= word.length; k++) if (s.slice(0, k) === word.slice(0, k)) return false;
  return true;
}
function scramble(word) {
  for (let t = 0; t < 200; t++) {
    const s = shuffle([...word]).join('');
    if (goodScramble(word, s)) return s;
  }
  throw new Error(`cannot scramble ${word}`);
}

const byLen = { 3: WORDS.filter((w) => w[0].length === 3), 4: WORDS.filter((w) => w[0].length === 4), 5: WORDS.filter((w) => w[0].length === 5) };
const lastUsed = new Map();
const uses = new Map();
const SPACING = 14;
const CAP = 3;

function pick(len, day, taken) {
  const pool = shuffle(byLen[len]).filter(([w]) => {
    if (taken.some((t) => t[0] === w[0] && t.length === w.length)) return false;
    if ((uses.get(w) || 0) >= CAP) return false;
    const lu = lastUsed.get(w);
    return lu == null || day - lu >= SPACING;
  });
  pool.sort((a, b) => (uses.get(a[0]) || 0) - (uses.get(b[0]) || 0));
  if (!pool.length) throw new Error(`no ${len}-letter word free on day ${day}`);
  const [w, e] = pool[0];
  return { w, e };
}

const isMain = process.argv[1] && process.argv[1].endsWith('gen-kids-mixup.mjs');
const bank = [];
for (let day = 1; isMain && day <= DAYS; day++) {
  const shape = day % 3 === 0 ? [3, 4, 4, 5, 5] : [3, 3, 4, 4, 5];
  const words = [];
  for (const len of shape) {
    const p = pick(len, day, words.map((x) => x.w));
    words.push(p);
  }
  for (const { w } of words) { lastUsed.set(w, day); uses.set(w, (uses.get(w) || 0) + 1); }
  bank.push({ num: day, words: words.map(({ w, e }) => ({ w, e, s: scramble(w) })) });
}

const src = `// Mix-Up bank. GENERATED by scripts/gen-kids-mixup.mjs; do not edit by hand.
// Five scrambled words a day with a picture clue each. \`w\` is the answer,
// \`s\` the scramble, \`e\` the emoji clue. The bank CYCLES over kids days
// (lib/kids-daily.js). The answer ships to the browser too: with a picture clue
// and the letters in hand it is not a secret, and the board checks itself.
export const PUZZLES = [
${bank.map((b) => `  { num: ${b.num}, words: ${JSON.stringify(b.words)} },`).join('\n')}
];
`;
if (isMain) {
  writeFileSync(join(here, '..', 'app', 'kids', 'mixup', 'puzzles.js'), src);
  console.log(`wrote ${bank.length} days to app/kids/mixup/puzzles.js`);
}
