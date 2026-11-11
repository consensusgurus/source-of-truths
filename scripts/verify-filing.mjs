// scripts/verify-filing.mjs: re-proves app/filing/puzzles.js.
//
//   node scripts/verify-filing.mjs
//
// What it enforces:
//   - num, quizId and dateLabel from the live date; dates run day after day
//     with no gap from the launch, 2026-11-10. No Sunday Edition, so no board
//     carries a sunday flag.
//   - every answer ticker, and every accepted ticker, is in Tape's universe
//     (app/tape/universe.js, the guess list both games share); no company repeats.
//   - every board has the six clues filled: a risk factor, the cover page
//     (exchange, filed date, four-digit SIC code and its name), competition,
//     key metrics (a title and 1 to 6 items; an S-1 with no metrics section, Google 2004, gives a second risk factor here), 1 to 4 business lines, the
//     founders in their own words (src and text), the famous line and an
//     sec.gov source.
//   - NOTHING BUT [[ ]] NAMES THE COMPANY: outside a [[redacted]] span, no clue
//     shows the name, an alt or a ticker. The famous line is exempt: it shows
//     only on the ending, after the answer.
//   - no em dash anywhere, and no board shares its day with the same company
//     on Tape.
import { PUZZLES } from '../app/filing/puzzles.js';
import { PUZZLES as TAPE } from '../app/tape/puzzles.js';
import { UNIVERSE } from '../app/tape/universe.js';

const START = '2026-11-10';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let fails = 0;
const fail = (m) => { fails++; console.error('FAIL ' + m); };
const day = (s) => new Date(`${s}T12:00:00Z`).getTime();
const TICK = new Set(UNIVERSE.map((u) => u[0]));
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const tapeOn = new Map(TAPE.map((t) => [t.live, t.ticker]));
const unred = (t) => String(t || '').replace(/\[\[[^\]]*\]\]/g, ' ');

const used = new Set();
let prev = null;
PUZZLES.forEach((p, i) => {
  const tag = `#${p.num} ${p.live} ${p.name}`;
  if (p.num !== i + 1) fail(`${tag}: num should be ${i + 1}`);
  if (i === 0 && p.live !== START) fail(`${tag}: the bank should open on ${START}`);
  if (prev && day(p.live) - day(prev) !== 86400000) fail(`${tag}: dates are not contiguous`);
  prev = p.live;
  const [y, m, d] = p.live.split('-').map(Number);
  if (p.quizId !== `filing-${m}-${d}-${String(y).slice(2)}`) fail(`${tag}: quizId does not match the date`);
  if (p.dateLabel !== `${MONTHS[m - 1]} ${d}, ${y}`) fail(`${tag}: dateLabel does not match the date`);
  if (p.sunday) fail(`${tag}: Filing has no Sunday Edition`);
  if (!TICK.has(p.ticker)) fail(`${tag}: ticker ${p.ticker} is not in Tape's universe`);
  if (!Array.isArray(p.accept) || !p.accept.includes(p.ticker)) fail(`${tag}: accept must list the ticker`);
  for (const a of p.accept || []) if (!TICK.has(a)) fail(`${tag}: accepted ticker ${a} is not in the universe`);
  if (used.has(p.ticker)) fail(`${tag}: company repeats`);
  used.add(p.ticker);
  if (tapeOn.get(p.live) && p.accept.includes(tapeOn.get(p.live))) fail(`${tag}: Tape plays the same company that day`);

  if (!p.risk) fail(`${tag}: no risk factor`);
  if (p.live >= '2026-11-11') {
    const ids = ['cover', 'risk', 'comp', 'c4', 'biz', 'words'];
    if (!Array.isArray(p.order) || p.order.length !== 6 || ids.some((x) => !p.order.includes(x))) fail(`${tag}: order must list all six clues once`);
    else if (p.order[0] !== 'cover') fail(`${tag}: the cover page is always the first clue`);
  }
  if (!p.exchange || !p.filed) fail(`${tag}: cover page lacks exchange or filed date`);
  if (!/^\d{4}$/.test(String(p.sic || '')) || !p.sicName) fail(`${tag}: cover page needs a four-digit SIC code and its name`);
  if (!p.comp) fail(`${tag}: no competition`);
  if (!p.c4 || !p.c4.title || !Array.isArray(p.c4.items) || p.c4.items.length < 1 || p.c4.items.length > 6) fail(`${tag}: key metrics need a title and 1 to 6 items`);
  if (!Array.isArray(p.biz) || p.biz.length < 1 || p.biz.length > 4) fail(`${tag}: needs 1 to 4 business lines`);
  if (!p.words || !p.words.src || !p.words.text) fail(`${tag}: "in their own words" needs src and text`);
  if (!p.famous) fail(`${tag}: no famous line`);
  if (!/^https:\/\/www\.sec\.gov\//.test(p.src || '')) fail(`${tag}: source must be an sec.gov address`);

  const clues = [p.risk, p.comp, p.c4 && p.c4.title, ...((p.c4 && p.c4.items) || []), ...(p.biz || []), p.words && p.words.text, p.words && p.words.src];
  for (const t of [...clues, p.famous, p.sicName]) if (/—/.test(t || '')) fail(`${tag}: em dash in "${t}"`);
  for (const t of clues) {
    if (/\[\[[^\]]*$|^[^\[]*\]\]/.test(t || '')) fail(`${tag}: unbalanced [[ ]] in "${t}"`);
  }
  const names = [p.name, ...(p.alt || [])].map(fold).filter((w) => w.length >= 3);
  const first = fold(p.name).split(' ')[0];
  if (first.length >= 4) names.push(first);
  for (const t of clues) {
    const f = ` ${fold(unred(t))} `;
    for (const w of names) if (f.includes(` ${w} `)) fail(`${tag}: "${t}" names the company (${w}) outside [[ ]]`);
    for (const k of p.accept) if (new RegExp(`\\b${k}\\b`).test(unred(t))) fail(`${tag}: "${t}" shows the ticker ${k}`);
  }
});

console.log(fails ? `verify-filing: ${fails} failure(s)` : `verify-filing: ${PUZZLES.length} boards OK, through ${PUZZLES[PUZZLES.length - 1].live}`);
process.exit(fails ? 1 : 0);
