// scripts/wire-finale.mjs - the anchored site wiring for the five Trivia Finale
// gauntlets (Music, Books, Nature, Tech, Myth). Every edit hangs off Foodie's own
// entry, the last 25-question gauntlet added, and fails loudly if its anchor is
// missing or not unique. Run once (2026-11-23); kept as the record of what a new
// 25-question gauntlet has to touch. The run itself (Trivia Finale) is wired by hand.
import fs from 'fs';
import path from 'path';
import url from 'url';
import { FINALE_GAMES as G, FINALE_FIRST_LIVE as L } from './finale-games.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const W = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const SQ = (x) => `'${String(x).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
let edits = 0;
// Replace one exact, unique string.
function one(f, a, b) { const s = R(f); const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${f}: anchor found ${n} times: ${a.slice(0, 80)}`); W(f, s.replace(a, () => b)); edits++; }
// Insert text after the one line that contains `needle`.
function after(f, needle, add) { const lines = R(f).split('\n'); const hit = lines.map((l, i) => (l.includes(needle) ? i : -1)).filter((i) => i >= 0); if (hit.length !== 1) throw new Error(`${f}: line anchor found ${hit.length} times: ${needle.slice(0, 80)}`); lines.splice(hit[0] + 1, 0, add); W(f, lines.join('\n')); edits++; }
const keys = G.map((g) => g.key);
const list = keys.map((k) => `'${k}'`).join(', ');
const each = (fn, sep = '\n') => G.map(fn).join(sep);
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const U = (g) => g.key.toUpperCase();

// ---- the registry
after('lib/daily-games.js', `{ key: 'foodie', miss: 'Asked', name: 'Foodie'`, each((g) => `  { key: '${g.key}', miss: 'Asked', name: '${g.name}', cat: 'Trivia', subject: ${SQ(g.subject)}, tag: ${SQ(g.tag.replace(', one life', ''))}, tagLong: ${SQ(`Twenty-five ${g.subj} questions, one life`)}, how: ${SQ(`Twenty-five ${g.subj} questions climb from gimme to expert, five rounds of five cycling ${g.lanesProse}. One wrong answer or an empty clock ends the run.`)}, color: '${g.accent}', colorNavy: '${g.navy}' },`));
one('lib/daily-games.js', `export const LAUNCH_DAILY = { foodie: '2026-10-27',`, `export const LAUNCH_DAILY = { ${keys.map((k) => `${k}: '${L}'`).join(', ')}, foodie: '2026-10-27',`);

// ---- lists that name every gauntlet
for (const f of ['app/DailySlateRail.jsx', 'app/api/quiz/sunday-slate/route.js', 'lib/loft.js', 'lib/quiz-catalog.js', 'lib/quiz-xp.js'])
  one(f, `'history', 'foodie',`, `'history', 'foodie', ${list},`);
one('app/DailyGamesGrid.jsx', `'art', 'history', 'foodie', 'potluck'`, `'art', 'history', 'foodie', ${list}, 'potluck'`);
one('lib/puzzle-categories.js', `'art', 'history', 'foodie', 'potluck'`, `'art', 'history', 'foodie', ${list}, 'potluck'`);
one('lib/puzzle-categories.js', `foodie: 'Food and drink trivia',`, `foodie: 'Food and drink trivia', ${G.map((g) => `${g.key}: ${SQ(g.seoKind)}`).join(', ')},`);
one('lib/circuits.js', `'sci', 'art', 'history', 'foodie', 'streak',`, `'sci', 'art', 'history', 'foodie', ${list}, 'streak',`);
for (const f of ['app/api/quiz/daily-status/route.js', 'app/quizzes/QuizHomeClient.jsx']) one(f, `|history|foodie|`, `|history|foodie|${keys.join('|')}|`);
one('lib/quiz-scoring.js', `key === 'foodie' ||`, `key === 'foodie' || ${keys.map((k) => `key === '${k}'`).join(' || ')} ||`);
one('lib/daily-skills.js', `foodie: ['mem'],`, `foodie: ['mem'], ${keys.map((k) => `${k}: ['mem']`).join(', ')},`);
one('lib/daily-difficulty.js', `foodie: 3,`, `foodie: 3, ${keys.map((k) => `${k}: 3`).join(', ')},`);
one('app/useNextUnplayed.js', `foodie: 'food',`, `foodie: 'food', ${G.map((g) => `${g.key}: '${g.next}'`).join(', ')},`);
after('lib/daily-groups.js', `keys: ['sci', 'art', 'history', 'foodie'] },`, `  { name: 'Finale gauntlets', cat: 'Trivia', keys: [${list}] },`);
after('lib/finish-sets.js', `keys: ['foodie', 'potluck', 'biz'] },`, `  { name: 'Liner notes', cat: 'Trivia', keys: ['music', 'books', 'quotes'] },\n  { name: 'Wild and wired', cat: 'Trivia', keys: ['nature', 'tech', 'myth'] },`);
// New games lead the still-to-play list for their first days (an order pin, not a pop-up).
for (const f of ['app/DailyEndCard.jsx', 'app/api/quiz/daily-order/route.js']) one(f, `const LAUNCH_PIN = { keys: [`, `const LAUNCH_PIN = { keys: [${list}, `);

// ---- one line per game
after('lib/game-blurbs.js', `  foodie: "Food and drink, from the pantry to the tasting menu.",`, each((g) => `  ${g.key}: ${JSON.stringify(g.blurb)},`));
after('lib/game-glyphs.js', `  foodie: 'M7 3v18M4.5`, each((g) => `  ${g.key}: '${g.glyph}', // ${g.glyphNote}`));
after('lib/finish-beats.js', `  foodie: lock,`, each((g) => `  ${g.key}: lock,`));
after('app/DailyStrip.jsx', `{ key: 'foodie', href: '/foodie', name: 'Foodie', img:`, each((g) => `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', img: '/games/btn-${g.key}.png', store: 'sot_${g.key}_day', tag: ${JSON.stringify(g.tag)} , cat: 'Trivia' },`));
one('app/DailyStrip.jsx', `history: '#fde68a', foodie: '#fdba74',`, `history: '#fde68a', foodie: '#fdba74', ${G.map((g) => `${g.key}: '${g.navy}'`).join(', ')},`);
one('app/DailyStrip.jsx', `history: '#854d0e', foodie: '#c2410c',`, `history: '#854d0e', foodie: '#c2410c', ${G.map((g) => `${g.key}: '${g.accent}'`).join(', ')},`);
after('app/DailyGamesGrid.jsx', `{ key: 'foodie', href: '/foodie', name: 'Foodie', tag: 'Food and drink, one life', img:`, each((g) => `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: ${SQ(g.tag)}, img: '/games/btn-${g.key}.png' },`));
after('app/DailyGamesPromo.jsx', `{ key: 'foodie', href: '/foodie', name: 'Foodie', tag: 'food and drink, one life'`, each((g) => `  { key: '${g.key}', href: '/${g.key}', name: '${g.name}', tag: ${SQ(g.tag.charAt(0).toLowerCase() + g.tag.slice(1))}, store: 'sot_${g.key}_day', accent: '${g.accent}', bg: '${g.accentSoft}', border: '${rgba(g.accent, 0.4)}' },`));
after('app/DailyEndCard.jsx', `  foodie: { accent: '#c2410c', badgeBg: '#c2410c', badgeInk: T.white, Fin: UtensilsCrossed },`, each((g) => `  ${g.key}: { accent: '${g.accent}', badgeBg: '${g.accent}', badgeInk: T.white, Fin: ${g.icon} },`));
after('app/DailyEndCard.jsx', `{ key: 'foodie', cat: 'trivia',   name: 'Foodie', tag: 'Food and drink', blurb:`, each((g) => `  { key: '${g.key}', cat: 'trivia',   name: '${g.name}', tag: ${SQ(g.tag.replace(', one life', ''))}, blurb: ${SQ(`Twenty-five ${g.subj} questions, gimme to expert, five lanes a round: ${g.lanesProse}. One wrong answer ends the run.`)}, href: '/${g.key}' },`));

// ---- the archive
after('app/archive/page.js', `import { PUZZLES as FOODIE_FULL } from '../foodie/puzzles';`, each((g) => `import { PUZZLES as ${U(g)}_FULL } from '../${g.key}/puzzles';`));
after('app/archive/page.js', `const FOODIE = FOODIE_FULL.map(`, each((g) => `const ${U(g)} = ${U(g)}_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`));
after('app/archive/page.js', `{ key: 'foodie', name: 'Foodie', path: '/foodie', tag: 'Food and drink, one life'`, each((g) => `  { key: '${g.key}', name: '${g.name}', path: '/${g.key}', tag: ${SQ(g.tag)}, accent: '${g.accent}', bg: '${g.accentSoft}', border: '${rgba(g.accent, 0.4)}', src: ${U(g)} },`));

// ---- the runs and the slate read each bank
after('app/circuits/[id]/run/page.js', `import { QUESTION_MAP as foodieQuestions } from '../../../foodie/questions';`, each((g) => `import { PUZZLES as ${g.key}Puzzles } from '../../../${g.key}/puzzles';\nimport { QUESTION_MAP as ${g.key}Questions } from '../../../${g.key}/questions';`));
after('app/circuits/[id]/run/page.js', `  foodie: { puzzles: foodiePuzzles, questions: foodieQuestions, tiers:`, each((g) => `  ${g.key}: { puzzles: ${g.key}Puzzles, questions: ${g.key}Questions, tiers: ${JSON.stringify(g.tiers)} },`));
after('app/circuits/[id]/gauntlet-card.js', `import { PUZZLES as foodiePuzzles } from '../../foodie/puzzles';`, each((g) => `import { PUZZLES as ${g.key}Puzzles } from '../../${g.key}/puzzles';`));
one('app/circuits/[id]/gauntlet-card.js', `foodie: foodiePuzzles,`, `foodie: foodiePuzzles, ${keys.map((k) => `${k}: ${k}Puzzles`).join(', ')},`);
after('app/circuits/GauntletMorePop.jsx', `      foodie: ['pricecheck', 'potluck', 'bracket'],`, each((g) => `      ${g.key}: [${g.more.map((k) => `'${k}'`).join(', ')}],`));
after('app/circuits/GauntletMorePop.jsx', `      foodie: 'Price Check prices real things, groceries included.',`, each((g) => `      ${g.key}: ${SQ(g.moreLine)},`));
after('lib/daily-slate.js', `import { PUZZLES as P_foodie } from '@/app/foodie/puzzles';`, each((g) => `import { PUZZLES as P_${g.key} } from '@/app/${g.key}/puzzles';`));
one('lib/daily-slate.js', `foodie: P_foodie,`, `foodie: P_foodie, ${keys.map((k) => `${k}: P_${k}`).join(', ')},`);

// ---- the question databases: one new topic per bank, ahead of Deep Cuts
after('lib/qdb-library.js', `import * as foodieQ from '@/app/foodie/questions'; import * as foodieP from '@/app/foodie/puzzles';`, each((g) => `import * as ${g.key}Q from '@/app/${g.key}/questions'; import * as ${g.key}P from '@/app/${g.key}/puzzles';`));
one('lib/qdb-library.js', `foodie: [foodieQ, foodieP],`, `foodie: [foodieQ, foodieP], ${keys.map((k) => `${k}: [${k}Q, ${k}P]`).join(', ')},`);
one('lib/trivia-topics.js', `  { slug: 'deep-cuts', label: 'Deep Cuts',`, each((g) => `  { slug: '${g.topic.slug}', label: '${g.topic.label}', icon: '${g.topic.icon}', color: '${g.topic.color}', banks: ['${g.key}'],\n    h1: ${SQ(g.topic.h1)}, title: ${SQ(g.topic.title)},\n    blurb: ${SQ(g.topic.blurb)} },`) + `\n  { slug: 'deep-cuts', label: 'Deep Cuts',`);
console.log(`wire-finale: ${edits} edits`);
