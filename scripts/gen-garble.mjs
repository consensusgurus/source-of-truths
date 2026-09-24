// scripts/gen-garble.mjs — Garble bank generator (added 2026-09-23 for the
// Nov 2026 restock). Deterministic: every board is seeded off its own num, so
// re-running reproduces the same output and never replays a frozen board.
//
//   node scripts/gen-garble.mjs --from 2026-11-01 --days 30 --startnum 116
//
// Prints board objects (one per day, trailing commas) ready to splice in
// before the closing `];` of app/garble/puzzles.js.
//
// The CREATIVE half (the finale word and its punny clue) is authored by hand
// in FINALS below, keyed by live date. The generator does the mechanical half,
// under the game's rules (CLAUDE.md "Daily word games", verify-daily-banks.mjs
// garble block, and the Aug 28 extension commit fec106b):
//   * five answers per board: five letters on weekdays, six on a Sunday Edition;
//   * each answer carries 1 to 3 marked letters, and the marked letters across
//     the five answers are exactly an anagram of the finale;
//   * answers are common words (zipf >= MIN_ZIPF in scripts/.lode-freq.json),
//     lowercase entries in hunspell en_US (no proper nouns), US spellings, and
//     not plurals;
//   * the anagram-twin rule: NO answer has another anagram anywhere in
//     public/tuck-dict.txt, so a player's valid unscramble is never refused;
//   * no answer word already banked anywhere in the bank, and none repeated in
//     this batch;
//   * every scramble moves all but at most one letter, differs from its answer,
//     and is not itself a dictionary word.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanUS } from './us-spellings.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-11-01');
const DAYS = +arg('--days', 30);
const STARTNUM = +arg('--startnum', 116);
const MIN_ZIPF = 3.3;
// Reviewed out by hand: slang, names that hunspell also lists lowercase,
// and words that do not belong on a family puzzle.
const BLOCK = new Set(('gonna wanna gotta dixie shiva leone donna jenny welsh queer booty obese idiot booze '
  + 'hindu negro gypsy midget moron dummy tipsy crack horny sexy boobs bitch penis pussy sperm semen whore '
  + 'porno nazis nazi rapist abort cocky satan devil demon bloody blood killer murder corpse lynch opium '
  + 'mamma kappa roger molly cutie sigma delta alpha gamma omega betty larry '
  + 'sonny hogan butch dunno psych mafia women gotcha kinda sorta yeah nope '
  + 'benny burke cisco bobby brent romeo hindi texan paris milan dante bible '
  + 'vodka whisky crypt hooker drunk stoned tumor cancer cardio cyber promo gonad').split(' '));

// Authored finales and clues, keyed by live date. Sunday Editions (six-letter
// answers) are the real Sundays: Nov 1, 8, 15, 22, 29.
const FINALS = {
  '2026-11-01': ['BLACKSMITH', 'Strikes while the iron is hot, and gets paid for it.'],
  '2026-11-02': ['CHOPSTICK', 'Half of a pair that only works as a team.'],
  '2026-11-03': ['SKYLIGHT', 'A window with its head in the clouds.'],
  '2026-11-04': ['BOOKWORM', 'Devours every chapter and never gains a pound.'],
  '2026-11-05': ['PINECONE', "The evergreen's scaly little seed vault."],
  '2026-11-06': ['DOORBELL', 'One press and the whole house knows.'],
  '2026-11-07': ['SNOWBALL', 'Starts small, rolls downhill, gets out of hand.'],
  '2026-11-08': ['HEADSTRONG', 'Stubborn from the top down.'],
  '2026-11-09': ['TEAKETTLE', 'It only whistles once things come to a boil.'],
  '2026-11-10': ['KEYBOARD', 'Every letter waiting its turn to be pressed.'],
  '2026-11-11': ['BACKPACK', 'Luggage that insists on a piggyback ride.'],
  '2026-11-12': ['MOONLIGHT', 'Borrowed glow, returned by morning.'],
  '2026-11-13': ['FINGERTIP', 'Where your prints are kept on file.'],
  '2026-11-14': ['HOURGLASS', 'A clock that runs on sand, not batteries.'],
  '2026-11-15': ['BUTTERMILK', "What's left after the cream makes its escape."],
  '2026-11-16': ['BEDSPREAD', 'The mattress in its Sunday best.'],
  '2026-11-17': ['CROSSWORD', 'A grid where every answer has to get along with its neighbors.'],
  '2026-11-18': ['LIFEBOAT', "The ship's plan B."],
  '2026-11-19': ['NUTSHELL', 'Where the whole story fits, briefly.'],
  '2026-11-20': ['SANDPAPER', 'Rough around the edges, and proud of it.'],
  '2026-11-21': ['WATERMELON', 'A summer fruit that is mostly beverage.'],
  '2026-11-22': ['SCOREBOARD', 'Keeps count and never picks a side.'],
  '2026-11-23': ['BUTTERFLY', "A caterpillar's grand makeover."],
  '2026-11-24': ['HOMEWORK', "The dog's favorite meal, allegedly."],
  '2026-11-25': ['CUPBOARD', 'Where the dishes go to bed.'],
  '2026-11-26': ['DRUMSTICK', 'The only percussion served at the feast.'],
  '2026-11-27': ['LEFTOVERS', "The feast's encore performance."],
  '2026-11-28': ['SHOWDOWN', 'The final scene where somebody has to blink.'],
  '2026-11-29': ['SNOWFLAKE', 'No two alike, and none of them last.'],
  '2026-11-30': ['TIGHTROPE', 'A walk where every step is a balancing act.'],
};

// ── seeded rng ──────────────────────────────────────────────────────────────
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── word pools ──────────────────────────────────────────────────────────────
const tuck = new Set(readFileSync(join(here, '../public/tuck-dict.txt'), 'utf8').trim().split('\n'));
const freq = JSON.parse(readFileSync(join(here, '.lode-freq.json'), 'utf8'));
const hun = new Set();
for (const line of readFileSync('/usr/share/hunspell/en_US.dic', 'utf8').split('\n').slice(1)) {
  const w = line.split('/')[0];
  if (/^[a-z]+$/.test(w)) hun.add(w);
}
const sortKey = (w) => [...w].sort().join('');
const anag = new Map();
for (const w of tuck) { const k = sortKey(w); anag.set(k, (anag.get(k) || 0) + 1); }

const { PUZZLES } = await import('../app/garble/puzzles.js');
const banked = new Set();
for (const p of PUZZLES) for (const w of p.words) banked.add(w.answer.toLowerCase());
const bankedFinals = new Set(PUZZLES.map((p) => p.final));

const pool = (len) => Object.keys(freq).filter((w) =>
  w.length === len && /^[a-z]+$/.test(w) && freq[w] >= MIN_ZIPF && hun.has(w) && tuck.has(w)
  && !banked.has(w) && !BLOCK.has(w) && anag.get(sortKey(w)) === 1
  && !(w.endsWith('s') && (tuck.has(w.slice(0, -1)) || tuck.has(w.slice(0, -2))))
  && !scanUS(w).length);
const POOL = { 5: pool(5), 6: pool(6) };

const used = new Set();
const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function scramble(ans, r) {
  for (let t = 0; t < 500; t++) {
    const s = shuffle([...ans], r).join('');
    let fixed = 0; for (let i = 0; i < ans.length; i++) if (s[i] === ans[i]) fixed++;
    if (s !== ans && fixed <= 1 && !tuck.has(s.toLowerCase())) return s;
  }
  return null;
}

// Split the finale's letters into five groups of 1..3 and find, for each, an
// unused pool word containing that group. Randomized restarts, seeded.
function build(final, len, r) {
  const P = POOL[len];
  for (let t = 0; t < 20000; t++) {
    const letters = shuffle([...final.toLowerCase()], r);
    // group sizes: five parts of 1..3 summing to final.length, varied
    let sizes;
    for (;;) { sizes = Array.from({ length: 5 }, () => 1 + Math.floor(r() * 3)); if (sizes.reduce((a, b) => a + b) === letters.length) break; }
    const words = []; const taken = new Set(); let pos = 0, okAll = true;
    for (const sz of sizes) {
      const grp = letters.slice(pos, pos + sz); pos += sz;
      const cands = P.filter((w) => !used.has(w) && !taken.has(w) && (() => { const a = [...w]; for (const c of grp) { const i = a.indexOf(c); if (i < 0) return false; a[i] = '#'; } return true; })());
      if (!cands.length) { okAll = false; break; }
      const w = cands[Math.floor(r() * cands.length)];
      // mark positions: choose a random index for each group letter
      const a = [...w], marks = [];
      for (const c of grp) { const idx = []; a.forEach((x, i) => { if (x === c) idx.push(i); }); const i = idx[Math.floor(r() * idx.length)]; marks.push(i); a[i] = '#'; }
      const sc = scramble(w.toUpperCase(), r);
      if (!sc) { okAll = false; break; }
      taken.add(w); words.push({ answer: w.toUpperCase(), scramble: sc, marks: marks.sort((x, y) => x - y) });
    }
    if (okAll) { for (const w of taken) used.add(w); return words; }
  }
  throw new Error(`no fill for ${final}`);
}

const out = [];
for (let d = 0; d < DAYS; d++) {
  const live = addDays(FROM, d), num = STARTNUM + d;
  const [y, m, dd] = live.split('-').map(Number);
  const sunday = new Date(live + 'T12:00:00Z').getUTCDay() === 0;
  const f = FINALS[live];
  if (!f) throw new Error(`no authored finale for ${live}`);
  const [final, clue] = f;
  if (bankedFinals.has(final)) throw new Error(`${final} already banked`);
  if (scanUS(clue).length || clue.includes('—')) throw new Error(`clue copy: ${clue}`);
  const words = build(final, sunday ? 6 : 5, rng(num * 7919 + 17));
  const q = (s) => (s.includes("'") ? JSON.stringify(s) : `'${s}'`);
  out.push(`  {
    num: ${num},
    quizId: 'garble-${m}-${dd}-${String(y).slice(2)}',
    live: '${live}',
    dateLabel: '${MONTHS[m - 1]} ${dd}, ${y}',
    sunday: ${sunday},
    clue: ${q(clue)},
    final: '${final}',
    words: [
${words.map((w) => `      { answer: '${w.answer}', scramble: '${w.scramble}', marks: [${w.marks.join(', ')}] },`).join('\n')}
    ],
  },`);
}
process.stdout.write(out.join('\n') + '\n');
