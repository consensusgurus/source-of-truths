// THE FACT CHIPS ON THE DETAILS CARD (owner, 2026-11-08). Read only from what
// a game already says about itself (its tagLong and How to play text, its
// attempts mode, its Sunday Edition) and the weekly difficulty rating, so a
// chip never states a number the game does not. A game whose text names none
// of these shows the chips it has, or none.
import { DAILY_GAME_MAP } from './daily-games';
import { hasSundayEdition } from './sunday-editions';

const NUM = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
// Tens and their hyphenated compounds ("twenty-five", "thirty-two"). Without
// these the parser skipped "twenty-" and read "Twenty-five history questions"
// as five (owner caught it on the tiles, 2026-11-10).
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const ONES = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const NUM_TOK = `(?:(?:${Object.keys(TENS).join('|')})(?:-(?:${Object.keys(ONES).join('|')}))?|${Object.keys(NUM).join('|')}|\\d{1,3})`;
const NOUNS = 'problems|questions|equations|series|lines|words|clues|rounds|quotes|items|products|pictures|puzzles|categories|sentences|songs|charts|cards|answers|names|places|countries';
// Up to three words may sit between the number and the noun ("twenty-five
// film and TV questions").
const COUNT_RE = new RegExp(`\\b(${NUM_TOK})\\s+(?:[a-z&-]+\\s+){0,3}?(${NOUNS})\\b`, 'i');
const EACH_RE = new RegExp(`\\b(${NUM_TOK})\\s+seconds\\s+each\\b`, 'i');
const LIFE_RE = /\bone (?:wrong answer|miss|mistake|wrong pick) ends\b/i;
const n = (s) => {
  const w = String(s).toLowerCase();
  if (/^\d+$/.test(w)) return Number(w);
  const [t, o] = w.split('-');
  if (TENS[t] != null) return TENS[t] + (o ? ONES[o] || 0 : 0);
  return NUM[w];
};

export function gameFacts(key) {
  const g = DAILY_GAME_MAP[key];
  if (!g) return [];
  const txt = `${g.tagLong || ''} ${g.how || ''}`;
  const out = [];
  const c = txt.match(COUNT_RE);
  if (c && n(c[1])) out.push({ ic: 'count', tx: `${n(c[1])} ${c[2].toLowerCase()}` });
  const e = txt.match(EACH_RE);
  if (e && n(e[1])) out.push({ ic: 'clock', tx: `${n(e[1])}s each` });
  // No "Timed" chip (owner, 2026-11-08: "all are timed"). Only a stated
  // per-question clock earns the clock chip.
  if (LIFE_RE.test(txt)) out.push({ ic: 'life', tx: '1 life' });
  else if (g.miss === 'Tries') out.push({ ic: 'tries', tx: 'Counts tries' });
  // No "Counts errors" chip (owner, 2026-11-08: "a dumb tag to begin with").
  // Worded as a fact about the GAME, not today's board (owner, 2026-11-09): the
  // chip shows every day, and "Sunday Edition" on a Monday read as a date bug.
  if (out.length < 3 && hasSundayEdition(key)) out.push({ ic: 'cal', tx: 'Bigger Sundays' });
  return out.slice(0, 3);
}

export const FACT_ICONS = {
  count: 'M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16',
  clock: 'M12 3a9 9 0 1 0 .01 0M12 7v5l3 2',
  life: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  tries: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  cal: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
};
