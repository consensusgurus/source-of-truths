// scripts/wire-sci-art-history.mjs, wires the three new daily trivia gauntlets
// `sci` (Science), `art` (Arts & Culture) and `history` (History) into every
// registry a gauntlet game like Biz, Script or Quotes is registered in.
//
// Copied from scripts/wire-script-quotes.mjs (same edit() helper, same rule):
// half these registries fail SILENTLY when missed (a key in one list and not
// its partner is dropped with no error and no gap), so every anchor here must
// match EXACTLY ONCE or the script throws. It is idempotent: an edit whose
// whole replacement is already present is skipped, so a re-run after a partial
// push is safe and a second run reports 0 applied.
//
//   node scripts/wire-sci-art-history.mjs <dir>
//
// <dir> is the repo root (or a tree exported from a same-step
// `git archive FETCH_HEAD`, which satisfies the stale-base rule for free).
//
// DELIBERATELY NOT EDITED:
//   * lib/circuits.js's 'gauntlet' circuit. Its keys, order and copy stay as
//     they are; a separate circuit for these three is another change. Only
//     RUN_GAMES grows, which is what makes them DEALABLE into a run at all
//     (scripts/verify-circuits.mjs checks a run circuit against it).
//   * lib/sunday-editions.js. None of the three runs a Sunday Edition and the
//     verifiers fail any day that carries a `sunday` field.
//   * the IQ test pools (lib/iq-pool.js, lib/iq-items.js, lib/iq-tests.js).
//   * app/circuits/GauntletMorePop.jsx. Its lead/why maps are keyed by the
//     Trivia Gauntlet's members, which these are not.
//   * lib/daily-five.js (a retired hand-picked bank).
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-sci-art-history.mjs <dir>'); process.exit(1); }

let applied = 0, skipped = 0;
// The idempotency test is "is the finished text already here", i.e. the WHOLE
// replacement, never a suffix of it.
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 120)}`);
  fs.writeFileSync(p, src.replace(anchor, () => replacement));
  applied++;
}

const KEYS = ['sci', 'art', 'history'];
const G = {
  sci: {
    Name: 'Sci', color: '#0f766e', navy: '#5eead4', bg: '#e8f5f3', border: 'rgba(15,118,110,0.4)',
    subject: 'Science', icon: 'FlaskConical',
    tag: 'Twenty-five questions, one life',
    dtag: 'Science, one life',
    promoTag: 'science, one life',
    generic: 'Science trivia',
    how: 'Twenty-five science questions climb from gimme to expert, five rounds of five cycling the human body, space, chemistry and physics, life science, and inventions. One wrong answer or an empty clock ends the run.',
    ecBlurb: 'Twenty-five science questions, gimme to expert, five lanes a round from the human body and space to the lab bench, living things and the inventions that changed everything. One wrong answer ends the run.',
    tiers: "['Hypothesis', 'Experiment', 'Observation', 'Analysis', 'Discovery']",
    // a flask: neck, lip, the conical body, and the liquid line
    glyph: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.3 15h9.4',
    glyphNote: 'a flask',
  },
  art: {
    Name: 'Art', color: '#9d174d', navy: '#f9a8d4', bg: '#fbeef3', border: 'rgba(157,23,77,0.4)',
    subject: 'Arts & Culture', icon: 'Palette',
    tag: 'Twenty-five questions, one life',
    dtag: 'Arts and culture, one life',
    promoTag: 'arts and culture, one life',
    generic: 'Arts and culture trivia',
    how: 'Twenty-five arts and culture questions climb from gimme to expert, five rounds of five cycling art, music, books, architecture and design, and food and drink. One wrong answer or an empty clock ends the run.',
    ecBlurb: 'Twenty-five arts and culture questions, gimme to expert, five lanes a round from the gallery and the concert hall to the bookshelf, the skyline and the kitchen. One wrong answer ends the run.',
    tiers: "['Sketch', 'Draft', 'Study', 'Gallery', 'Masterpiece']",
    // a palette: the board with its thumb notch, and two wells of paint
    glyph: 'M12 3a9 9 0 1 0 0 18c1.7 0 2.4-1.3 1.9-2.6-.6-1.5.4-2.9 2-2.9H18a3 3 0 0 0 3-3C21 7 17 3 12 3zM7.5 12a1.5 1.5 0 1 0 .01 0M11.5 7.5a1.5 1.5 0 1 0 .01 0',
    glyphNote: 'a palette',
  },
  history: {
    Name: 'History', color: '#854d0e', navy: '#fde68a', bg: '#f8f1e4', border: 'rgba(133,77,14,0.4)',
    subject: 'History', icon: 'Landmark',
    tag: 'Twenty-five questions, one life',
    dtag: 'History, one life',
    promoTag: 'history, one life',
    generic: 'History trivia',
    how: 'Twenty-five history questions climb from gimme to expert, five rounds of five cycling the ancient world, the Middle Ages, empires and revolutions, war and conflict, and the modern era. One wrong answer or an empty clock ends the run.',
    ecBlurb: 'Twenty-five history questions, gimme to expert, five lanes a round from the ancient world and the Middle Ages to empires, wars and the modern era. One wrong answer ends the run.',
    tiers: "['Living memory', 'The textbook', 'The archive', 'The footnotes', 'The primary sources']",
    // a column: capital, two flutes of the shaft, the plinth and the ground
    glyph: 'M6 4h12v3H6zM9 7v11M15 7v11M7 18h10M5 21h14',
    glyphNote: 'a column',
  },
};
const each = (fn, sep = '\n') => KEYS.map((k) => fn(k, G[k])).join(sep);

// ─── 1. lib/daily-games.js, the single source of truth, one row each ───────
edit('lib/daily-games.js',
  `  { key: 'potluck', miss: null, name: 'Potluck',`,
  `${each((k, g) => `  { key: '${k}', miss: 'Asked', name: '${g.Name}', cat: 'Trivia', subject: '${g.subject}', tag: '${g.tag}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`)}\n  { key: 'potluck', miss: null, name: 'Potluck',`);

// ─── 2. lib/daily-games.js PREMIERES, the five-day launch window ───────────
edit('lib/daily-games.js',
  `  { key: 'sumo', from: '2026-10-13', until: '2026-10-17' },\n];`,
  `  { key: 'sumo', from: '2026-10-13', until: '2026-10-17' },\n${each((k) => `  { key: '${k}', from: '2026-10-15', until: '2026-10-19' },`)}\n];`);

// ─── 3. app/DailyEndCard.jsx: icons, LAUNCH_PIN, GAME_META, tile copy ──────
// FlaskConical is already imported (Axiom uses it); Palette and Landmark are new.
edit('app/DailyEndCard.jsx',
  `  Clapperboard, Quote, CookingPot, ZoomIn,`,
  `  Palette, Landmark,\n  Clapperboard, Quote, CookingPot, ZoomIn,`);
edit('app/DailyEndCard.jsx',
  `const LAUNCH_PIN = { keys: ['sumo',`,
  `const LAUNCH_PIN = { keys: ['sci', 'art', 'history', 'sumo',`);
edit('app/DailyEndCard.jsx',
  `'glyph', 'babel'], until: '2026-10-15' };`,
  `'glyph', 'babel'], until: '2026-10-18' };`);
edit('app/DailyEndCard.jsx',
  `  potluck: { accent: '#b4532a', badgeBg: '#b4532a', badgeInk: T.white, Fin: CookingPot },`,
  `${each((k, g) => `  ${k}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: ${g.icon} },`)}\n  potluck: { accent: '#b4532a', badgeBg: '#b4532a', badgeInk: T.white, Fin: CookingPot },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'potluck', cat: 'trivia',  name: 'Potluck',`,
  `${each((k, g) => `  { key: '${k}', cat: 'trivia',   name: '${g.Name}', tag: '${g.dtag}', blurb: '${g.ecBlurb}', href: '/${k}' },`)}\n  { key: 'potluck', cat: 'trivia',  name: 'Potluck',`);

// ─── 4. app/api/quiz/daily-order/route.js, the LAUNCH_PIN mirror ───────────
edit('app/api/quiz/daily-order/route.js',
  `const LAUNCH_PIN = { keys: ['sumo',`,
  `const LAUNCH_PIN = { keys: ['sci', 'art', 'history', 'sumo',`);
edit('app/api/quiz/daily-order/route.js',
  `'glyph', 'babel'], until: '2026-10-15' };`,
  `'glyph', 'babel'], until: '2026-10-18' };`);

// ─── 5. app/DailyGamesPromo.jsx ────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'potluck', href: '/potluck', name: 'Potluck',`,
  `${each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', tag: '${g.promoTag}', store: 'sot_${k}_day', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}' },`)}\n  { key: 'potluck', href: '/potluck', name: 'Potluck',`);

// ─── 6. app/DailyGamesGrid.jsx, BOTH lists, or the tile is dropped silently ─
edit('app/DailyGamesGrid.jsx',
  `  { key: 'potluck', href: '/potluck', name: 'Potluck',`,
  `${each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', tag: '${g.dtag}', img: '/games/btn-${k}.png' },`)}\n  { key: 'potluck', href: '/potluck', name: 'Potluck',`);
edit('app/DailyGamesGrid.jsx',
  `'biz', 'script', 'quotes', 'potluck',`,
  `'biz', 'script', 'quotes', 'sci', 'art', 'history', 'potluck',`);

// ─── 7. app/DailyStrip.jsx, the row plus both colour maps ──────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'potluck', href: '/potluck', name: 'Potluck',`,
  `${each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${g.dtag}" , cat: 'Trivia' },`)}\n  { key: 'potluck', href: '/potluck', name: 'Potluck',`);
edit('app/DailyStrip.jsx',
  `const ACCENTS = { sumo:`,
  `const ACCENTS = { ${each((k, g) => `${k}: '${g.navy}',`, ' ')} sumo:`);
edit('app/DailyStrip.jsx',
  `const TCOL = { sumo:`,
  `const TCOL = { ${each((k, g) => `${k}: '${g.color}',`, ' ')} sumo:`);

// ─── 8. app/archive/page.js: import AND the map AND the row ────────────────
edit('app/archive/page.js',
  `import { PUZZLES as POTLUCK_FULL } from '../potluck/puzzles';`,
  `${each((k) => `import { PUZZLES as ${k.toUpperCase()}_FULL } from '../${k}/puzzles';`)}\nimport { PUZZLES as POTLUCK_FULL } from '../potluck/puzzles';`);
edit('app/archive/page.js',
  `const POTLUCK = POTLUCK_FULL.map(`,
  `${each((k) => `const ${k.toUpperCase()} = ${k.toUpperCase()}_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`)}\nconst POTLUCK = POTLUCK_FULL.map(`);
edit('app/archive/page.js',
  `  { key: 'potluck', name: 'Potluck', path: '/potluck',`,
  `${each((k, g) => `  { key: '${k}', name: '${g.Name}', path: '/${k}', tag: '${g.dtag}', accent: '${g.color}', bg: '${g.bg}', border: '${g.border}', src: ${k.toUpperCase()} },`)}\n  { key: 'potluck', name: 'Potluck', path: '/potluck',`);

// ─── 9. the FOUR puzzle-map registries ─────────────────────────────────────
for (const f of ['lib/daily-slate.js', 'app/api/quiz/sunday-slate/route.js',
                 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js']) {
  edit(f, `import { PUZZLES as P_quotes } from '@/app/quotes/puzzles';`,
    `import { PUZZLES as P_quotes } from '@/app/quotes/puzzles';\n${each((k) => `import { PUZZLES as P_${k} } from '@/app/${k}/puzzles';`)}`);
  edit(f, `script: P_script, quotes: P_quotes,`, `script: P_script, quotes: P_quotes, sci: P_sci, art: P_art, history: P_history,`);
}

// ─── 10. the two hardcoded quizId alternations ─────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|knight|script|quotes|`, `|knight|script|quotes|sci|art|history|`);
edit('app/quizzes/QuizHomeClient.jsx', `|knight|script|quotes|`, `|knight|script|quotes|sci|art|history|`);

// ─── 11. the A-Z rail, the catalog's daily-format set, and the Loft list ────
edit('app/DailySlateRail.jsx', `'knight', 'script', 'quotes', 'potluck',`, `'knight', 'script', 'quotes', 'sci', 'art', 'history', 'potluck',`);
edit('lib/quiz-catalog.js', `'knight', 'script', 'quotes', 'potluck',`, `'knight', 'script', 'quotes', 'sci', 'art', 'history', 'potluck',`);
// WITHOUT this the client renders the pre-Loft page.
edit('lib/loft.js', `'knight', 'script', 'quotes', 'potluck',`, `'knight', 'script', 'quotes', 'sci', 'art', 'history', 'potluck',`);

// ─── 12. the two scoring registries the gauntlet shape needs ───────────────
// A battery of independent questions pays IQ Points linearly, and its
// answered count is cleared + 1 (the question that ended the run was faced).
edit('lib/quiz-xp.js',
  `'biz', 'script', 'quotes', 'potluck', 'feud']);`,
  `'biz', 'script', 'quotes', 'sci', 'art', 'history', 'potluck', 'feud']);`);
edit('lib/quiz-scoring.js',
  `key === 'biz' || key === 'script' || key === 'quotes') {`,
  `key === 'biz' || key === 'script' || key === 'quotes' || key === 'sci' || key === 'art' || key === 'history') {`);

// ─── 13. lib/puzzle-categories.js, the Trivia category page ────────────────
edit('lib/puzzle-categories.js',
  `'atlas', 'biz', 'script', 'quotes', 'potluck', 'focus',`,
  `'atlas', 'biz', 'script', 'quotes', 'sci', 'art', 'history', 'potluck', 'focus',`);
edit('lib/puzzle-categories.js',
  `      script: 'Film and TV trivia', quotes: 'Who said it', potluck:`,
  `      script: 'Film and TV trivia', quotes: 'Who said it', ${each((k, g) => `${k}: '${g.generic}',`, ' ')} potluck:`);
edit('lib/puzzle-categories.js',
  `'Streak, Deep, Sport, Atlas, Biz, Script and Quotes share one shape:`,
  `'Streak, Deep, Sport, Atlas, Biz, Script, Quotes, Sci, Art and History share one shape:`);
edit('lib/puzzle-categories.js',
  `A shelf of trivia games with new questions every day. Seven one-life gauntlets`,
  `A shelf of trivia games with new questions every day. Ten one-life gauntlets`);

// ─── 14. the home's groups (a partition) and the finish card's sets ────────
// lib/daily-groups.js partitions the category into groups of three to five;
// "Trivia gauntlets" is already at five, so the three join as their own group.
edit('lib/daily-groups.js',
  `  { name: 'Trivia gauntlets', cat: 'Trivia', keys: ['streak', 'biz', 'sport', 'quotes', 'script'] },`,
  `  { name: 'Trivia gauntlets', cat: 'Trivia', keys: ['streak', 'biz', 'sport', 'quotes', 'script'] },\n  { name: 'Classroom gauntlets', cat: 'Trivia', keys: ['sci', 'art', 'history'] },`);
// lib/finish-sets.js: small overlapping sets; every live game in at least one.
edit('lib/finish-sets.js',
  `  { name: 'Quiz night', cat: 'Trivia', keys: ['potluck', 'streak', 'listed'] },`,
  `  { name: 'Quiz night', cat: 'Trivia', keys: ['potluck', 'streak', 'listed'] },\n  { name: 'Back to school', cat: 'Trivia', keys: ['sci', 'art', 'history'] },\n  { name: 'Then and now', cat: 'Trivia', keys: ['history', 'dating', 'sci'] },\n  { name: 'Arts and letters', cat: 'Trivia', keys: ['art', 'quotes', 'script'] },`);

// ─── 15. lib/finish-beats.js, the one-life runs lock in ────────────────────
edit('lib/finish-beats.js',
  `  biz: lock,\n  streak: lock,`,
  `  biz: lock,\n${each((k) => `  ${k}: lock,`)}\n  streak: lock,`);

// ─── 16. lib/game-glyphs.js, one stroke drawing each ───────────────────────
edit('lib/game-glyphs.js',
  `  script: 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h3',             // a page of dialogue`,
  `  script: 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h3',             // a page of dialogue\n${each((k, g) => `  ${k}: '${g.glyph}', // ${g.glyphNote}`)}`);

// ─── 17. lib/circuits.js RUN_GAMES: dealable into a run ────────────────────
// NOT a roster change: the 'gauntlet' circuit's keys are untouched.
edit('lib/circuits.js',
  `export const RUN_GAMES = ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'streak'];`,
  `export const RUN_GAMES = ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'sci', 'art', 'history', 'streak'];`);

// ─── 18. app/circuits/[id]/run/page.js, the runnable banks ─────────────────
edit('app/circuits/[id]/run/page.js',
  `import { PUZZLES as streakPuzzles } from '../../../streak/puzzles';`,
  `${each((k) => `import { PUZZLES as ${k}Puzzles } from '../../../${k}/puzzles';\nimport { QUESTION_MAP as ${k}Questions } from '../../../${k}/questions';`)}\nimport { PUZZLES as streakPuzzles } from '../../../streak/puzzles';`);
edit('app/circuits/[id]/run/page.js',
  `  streak: { puzzles: streakPuzzles, questions: streakQuestions,`,
  `${each((k, g) => `  ${k}: { puzzles: ${k}Puzzles, questions: ${k}Questions, tiers: ${g.tiers} },`)}\n  streak: { puzzles: streakPuzzles, questions: streakQuestions,`);

// ─── 19. app/circuits/[id]/gauntlet-card.js, the share card's DAYS map ──────
edit('app/circuits/[id]/gauntlet-card.js',
  `import { PUZZLES as streakPuzzles } from '../../streak/puzzles';`,
  `${each((k) => `import { PUZZLES as ${k}Puzzles } from '../../${k}/puzzles';`)}\nimport { PUZZLES as streakPuzzles } from '../../streak/puzzles';`);
edit('app/circuits/[id]/gauntlet-card.js',
  `  script: scriptPuzzles, quotes: quotesPuzzles, streak: streakPuzzles,`,
  `  script: scriptPuzzles, quotes: quotesPuzzles, streak: streakPuzzles,\n  sci: sciPuzzles, art: artPuzzles, history: historyPuzzles,`);

console.log(`wire-sci-art-history: ${applied} edits applied, ${skipped} already present`);
