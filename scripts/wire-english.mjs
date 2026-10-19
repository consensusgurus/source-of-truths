// scripts/wire-english.mjs, wires the English Gauntlet (owner, 2026-10-19):
// five new Word dailies, Gram, Vocab, Spell, Origin and Idiom (ten questions a
// day each, five tiers of two, one life, twenty seconds), and the run that plays
// all fifty back to back at /english (circuit `english`, quiz engine).
//
// Placement follows "Placing a new daily" in CLAUDE.md: category Word, skills,
// every Word key list, a daily group ("Word gauntlets"), finish sets, the
// category page copy. Scoring follows the gauntlet shape (miss 'Asked',
// XP_LINEAR_DAILIES, the dailyAnswered branch in lib/quiz-scoring.js).
//
// THE ONLY POP-UP IS THE RUN'S (owner, 2026-10-19): a PREMIERE_RUNS line for
// `english`, and NO PREMIERES line for any of the five.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose replacement is already present is skipped.
//   node scripts/wire-english.mjs <dir>
import fs from 'fs';
import path from 'path';
const root = process.argv[2] || '.';
let applied = 0, skipped = 0;
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
function sub(f, anchor, repl) {
  const s = rd(f);
  if (s.includes(repl)) { skipped++; return; }
  const n = s.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${f}: anchor matched ${n} times\n  ${anchor.slice(0, 160)}`);
  wr(f, s.replace(anchor, () => repl)); applied++;
}
function afterLine(f, marker, lines) {
  const s = rd(f);
  if (s.includes(lines[0])) { skipped++; return; }
  const parts = s.split('\n');
  const idx = parts.map((l, i) => (l.includes(marker) ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) throw new Error(`${f}: line marker matched ${idx.length} times: ${marker}`);
  parts.splice(idx[0] + 1, 0, lines.join('\n'));
  wr(f, parts.join('\n')); applied++;
}

const KEYS = ['gram', 'vocab', 'spell', 'origin', 'idiom'];
const G = {
  gram: { Name: 'Gram', color: '#4338ca', navy: '#a5b4fc', bg: '#e0e7ff', subject: 'Grammar', generic: 'Grammar quiz',
    tag: 'Grammar, one life', tagLong: 'Ten grammar questions, gimme to expert, one life',
    how: 'Ten grammar questions climb from gimme to expert in five rounds of two: word choice, then punctuation and sentence structure. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten grammar questions, gimme to expert: the right word, then the right punctuation. One wrong answer ends the run.',
    tiers: "['Draft', 'Edit', 'Revise', 'Proof', 'Polish']", skills: "['lang', 'ded']",
    glyph: 'M4 17l8-11 8 11M3 20h18', note: "a proofreader's caret on the line" },
  vocab: { Name: 'Vocab', color: '#0d9488', navy: '#5eead4', bg: '#ccfbf1', subject: 'Vocabulary', generic: 'Vocabulary quiz',
    tag: 'Vocabulary, one life', tagLong: 'Ten vocabulary questions, gimme to expert, one life',
    how: 'Ten vocabulary questions climb from gimme to expert in five rounds of two: what a word means, then its synonyms and opposites. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten vocabulary questions, gimme to expert: what a word means, then what means the same and the opposite. One wrong answer ends the run.',
    tiers: "['Everyday', 'Educated', 'Literary', 'Learned', 'Lexicon']", skills: "['lang', 'mem']",
    glyph: 'M3 5h7l2 2 2-2h7v13h-7l-2 2-2-2H3zM12 7v13', note: 'an open dictionary' },
  spell: { Name: 'Spell', color: '#c2410c', navy: '#fdba74', bg: '#ffedd5', subject: 'Spelling', generic: 'Spelling quiz',
    tag: 'Spelling, one life', tagLong: 'Ten spelling questions, gimme to expert, one life',
    how: 'Ten spelling questions climb from gimme to expert in five rounds of two: pick the right spelling, then spot the misspelled word. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten spelling questions, gimme to expert: pick the right spelling, then spot the wrong one. One wrong answer ends the run.',
    tiers: "['Easy', 'Tricky', 'Treacherous', 'Notorious', 'Championship']", skills: "['lang', 'speed']",
    glyph: 'M3 18l5-12 5 12M5 14h6M15 13l3 3 4-6', note: 'a letter and a tick' },
  origin: { Name: 'Origin', color: '#92400e', navy: '#fcd34d', bg: '#fef3c7', subject: 'Word origins', generic: 'Word origins quiz',
    tag: 'Word origins, one life', tagLong: 'Ten word origin questions, gimme to expert, one life',
    how: 'Ten word origin questions climb from gimme to expert in five rounds of two: where a word comes from, then the people and places words are named after. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten word origin questions, gimme to expert: where a word comes from and who it was named after. One wrong answer ends the run.',
    tiers: "['Roots', 'Stems', 'Borrowings', 'Lineage', 'Deep Roots']", skills: "['lang', 'mem']",
    glyph: 'M12 3v10M7 7l5 3 5-3M12 13l-5 7M12 13l5 7M12 13v8', note: 'a word tree, branches and roots' },
  idiom: { Name: 'Idiom', color: '#be123c', navy: '#fda4af', bg: '#ffe4e6', subject: 'Idioms', generic: 'Idioms quiz',
    tag: 'Idioms, one life', tagLong: 'Ten questions on idioms and sayings, gimme to expert, one life',
    how: 'Ten questions on idioms and sayings climb from gimme to expert in five rounds of two: what a saying means, then how it ends. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten questions on idioms and sayings, gimme to expert: what a saying means, then how it ends. One wrong answer ends the run.',
    tiers: "['Everyday', 'Common', 'Colorful', 'Quaint', 'Archaic']", skills: "['lang', 'mem']",
    glyph: 'M4 5h16v10H10l-4 4v-4H4zM8 9h8M8 12h5', note: 'a speech bubble' },
};
const each = (fn, sep = '\n') => KEYS.map((k) => fn(k, G[k])).join(sep);
const list = (sep = ', ') => KEYS.map((k) => `'${k}'`).join(sep);
const border = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0.4)`; };

// 1. registry rows (after Arcos) and the run premiere
afterLine('lib/daily-games.js', "{ key: 'arcos', miss: null, name: 'Arcos', cat: 'Word'", [
  each((k, g) => `  { key: '${k}', miss: 'Asked', name: '${g.Name}', cat: 'Word', subject: '${g.subject}', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`)]);
sub('lib/daily-games.js', `export const PREMIERE_RUNS = [\n`, `export const PREMIERE_RUNS = [
  { id: 'english', name: 'English Gauntlet', href: '/english', from: '2026-10-19', until: '2026-10-23', keys: [${list()}], cat: 'Word',
    lede: 'Five new English quizzes played back to back as one run: grammar, vocabulary, spelling, word origins and idioms. Ten questions each, one life in each.',
    foot: 'Gram, Vocab, Spell, Origin and Idiom are also their own dailies on the Word shelf.' },
`);

// 2. end card, launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['arcos', `, `const LAUNCH_PIN = { keys: [${list()}, 'arcos', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['arcos', `, `const LAUNCH_PIN = { keys: [${list()}, 'arcos', `);
afterLine('app/DailyEndCard.jsx', "  arcos: { accent: '#1e40af', badgeBg: '#1e40af', badgeInk: T.white, Fin: Trophy },", [
  each((k, g) => `  ${k}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: Trophy },`)]);
afterLine('app/DailyEndCard.jsx', "{ key: 'arcos', cat: 'word',      name: 'Arcos',", [
  each((k, g) => `  { key: '${k}', cat: 'word',      name: '${g.Name}', tag: '${g.tag}',       blurb: '${g.blurb}', href: '/${k}' },`)]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'arcos', href: '/arcos'", [
  each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', tag: '${g.tag.toLowerCase()}', store: 'sot_${k}_day', accent: '${g.color}', bg: '${g.bg}', border: '${border(g.color)}' },`)]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'arcos', href: '/arcos'", [
  each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', tag: '${g.tag}', img: '/games/btn-${k}.png' },`)]);
sub('app/DailyGamesGrid.jsx', `'scour', 'arcos', 'links',`, `'scour', 'arcos', ${list()}, 'links',`);
afterLine('app/DailyStrip.jsx', "{ key: 'arcos', href: '/arcos'", [
  each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${g.tag}" , cat: 'Word' },`)]);
sub('app/DailyStrip.jsx', `const ACCENTS = { arcos: `, `const ACCENTS = { ${each((k, g) => `${k}: '${g.navy}',`, ' ')} arcos: `);
sub('app/DailyStrip.jsx', `const TCOL = { arcos: `, `const TCOL = { ${each((k, g) => `${k}: '${g.color}',`, ' ')} arcos: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as ARCOS_FULL } from '../arcos/puzzles';`,
  `import { PUZZLES as ARCOS_FULL } from '../arcos/puzzles';\n${each((k) => `import { PUZZLES as ${k.toUpperCase()}_FULL } from '../${k}/puzzles';`)}`);
afterLine('app/archive/page.js', 'const ARCOS = ARCOS_FULL.map(', [
  each((k) => `const ${k.toUpperCase()} = ${k.toUpperCase()}_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`)]);
afterLine('app/archive/page.js', "{ key: 'arcos', name: 'Arcos', path: '/arcos'", [
  each((k, g) => `  { key: '${k}', name: '${g.Name}', path: '/${k}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${border(g.color)}', src: ${k.toUpperCase()} },`)]);

// 5. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_arcos } from '@/app/arcos/puzzles';`,
    `import { PUZZLES as P_arcos } from '@/app/arcos/puzzles';\n${each((k) => `import { PUZZLES as P_${k} } from '@/app/${k}/puzzles';`)}`);
  sub(f, `arcos: P_arcos,`, `arcos: P_arcos, ${each((k) => `${k}: P_${k},`, ' ')}`);
}

// 6. alternations, rail, catalog, loft
sub('app/api/quiz/daily-status/route.js', `|scram|arcos|`, `|scram|arcos|gram|vocab|spell|origin|idiom|`);
sub('app/quizzes/QuizHomeClient.jsx', `|scram|arcos|`, `|scram|arcos|gram|vocab|spell|origin|idiom|`);
sub('app/DailySlateRail.jsx', `'scram', 'arcos', 'scour',`, `'scram', 'arcos', ${list()}, 'scour',`);
sub('lib/quiz-catalog.js', `'scram', 'arcos', 'scour', `, `'scram', 'arcos', ${list()}, 'scour', `);
sub('lib/loft.js', `'scram', 'arcos', 'scour',`, `'scram', 'arcos', ${list()}, 'scour',`);

// 7. scoring: linear IQ, answered = cleared + 1 out of ten
sub('lib/quiz-xp.js', `'scram', 'scour', 'arcos']);`, `'scram', 'scour', 'arcos', ${list()}]);`);
sub('lib/quiz-scoring.js',
  `key === 'sci' || key === 'art' || key === 'history') {`,
  `key === 'sci' || key === 'art' || key === 'history' || ${KEYS.map((k) => `key === '${k}'`).join(' || ')}) {`);

// 8. skills, difficulty seeds, finish beat, glyph
sub('lib/daily-skills.js', `  arcos: ['lang'], `, `  arcos: ['lang'], ${each((k, g) => `${k}: ${g.skills},`, ' ')} `);
sub('lib/daily-difficulty.js', `  arcos: 1, // owner, 2026-10-18\n`, `  arcos: 1, // owner, 2026-10-18\n  // The English Gauntlet's five (2026-10-19), estimates.\n  gram: 3, vocab: 3, spell: 3, origin: 3, idiom: 1,\n`);
afterLine('lib/finish-beats.js', '  sci: lock,', [each((k) => `  ${k}: lock,`)]);
afterLine('lib/game-glyphs.js', "  arcos: 'M3 3h5v5H3z", [each((k, g) => `  ${k}: '${g.glyph}', // ${g.note}`)]);

// 9. group and finish sets
afterLine('lib/daily-groups.js', `{ name: 'Crosswords', cat: 'Word', keys: ['emcee', 'encore', 'shards', 'arcos'] },`, [
  `  { name: 'Word gauntlets', cat: 'Word', keys: [${list()}] },`]);
afterLine('lib/finish-sets.js', `{ name: 'Word chains', cat: 'Word', keys: ['rung', 'hinge', 'links', 'arcos'] },`, [
  `  { name: 'Copy desk', cat: 'Word', keys: ['gram', 'spell', 'stet'] },`,
  `  { name: 'Word lore', cat: 'Word', keys: ['vocab', 'origin', 'idiom'] },`,
  `  { name: 'Word nerds', cat: 'Word', keys: ['vocab', 'spell', 'idiom', 'garble'] },`]);

// 10. the word-games page
const PC = 'lib/puzzle-categories.js';
sub(PC, `description: 'Twenty free daily word games in one place: word ladders,`, `description: 'Twenty-five free daily word games in one place: grammar, vocabulary and spelling quizzes, word ladders,`);
sub(PC, `lede: 'Twenty word games, one new puzzle in each every day. Ladders,`, `lede: 'Twenty-five word games, one new puzzle in each every day. Five quick English quizzes on grammar, vocabulary, spelling, word origins and idioms, ladders,`);
sub(PC, `'babel', 'emcee', 'encore', 'arcos', 'crux', 'glyph', 'shards', 'anon'],\n    generic: {\n      garble:`,
  `'babel', 'emcee', 'encore', 'arcos', 'crux', 'glyph', 'shards', 'anon', ${list()}],\n    generic: {\n      ${each((k, g) => `${k}: '${g.generic}',`, ' ')}\n      garble:`);
sub(PC, `Some are about meaning: Warmer scores`, `Five are quick English quizzes, ten questions and one life each: Gram on grammar, Vocab on meanings, Spell on spelling, Origin on where words come from and Idiom on sayings, and the English Gauntlet plays all five as one run. Some are about meaning: Warmer scores`);

sub(PC, `    circuit: 'wordplay',\n    howTitle: 'What kind of word game do you want?',`, `    circuit: 'wordplay',\n    alsoCircuit: 'english',\n    howTitle: 'What kind of word game do you want?',`);

// 11. the circuit
sub('lib/circuits.js', `export const RUN_GAMES = ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'sci', 'art', 'history', 'streak'];`,
  `export const RUN_GAMES = ['deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'sci', 'art', 'history', 'streak', ${list()}];`);
sub('lib/circuits.js', `  {\n    id: 'math',\n    name: 'Math Gauntlet',`, `  {
    id: 'english',
    name: 'English Gauntlet',
    // THE ENGLISH GAUNTLET (owner, 2026-10-19): the five English dailies,
    // ten questions each, played back to back on the trivia run page. Lives at
    // /english (rewritten onto the run page, like /trivia and /math). Board is
    // questions right, clock as the tiebreak. Order is the owner's.
    path: '/english',
    shareHref: '/english',
    blurb: 'Five English quizzes back to back: grammar, vocabulary, spelling, word origins and idioms. One wrong answer ends that quiz and starts the next.',
    share: {
      invite: "Five English quizzes, one life in each: grammar, vocabulary, spelling, word origins and idioms.",
      result: "Five English quizzes, one life in each. How far do you get?",
    },
    run: true,
    score: 'correct',
    ownerOrder: true,
    keys: [${list()}],
    trophy: { name: 'Plain English', tier: 'bronze', icon: 'BookOpen' },
  },
  {
    id: 'math',
    name: 'Math Gauntlet',`);
sub('lib/circuits.js', `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'math',`, `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'math',`);
sub('lib/trophy-defs.js', `  { id: 'circuit-math', name: 'Human Calculator',`, `  { id: 'circuit-english', name: 'Plain English', desc: 'Finish all five quizzes of the English Gauntlet on the same day.', tier: 'bronze', group: 'circuits', icon: 'BookOpen' },\n  { id: 'circuit-math', name: 'Human Calculator',`);
sub('lib/run-titles.js', `  math: [\n`, `  // THE ENGLISH GAUNTLET (2026-10-19): five quizzes of ten, 50 asked. Provisional.
  english: [
    { min: 0, name: 'Lost for Words', line: 'Every speaker started with a first word.', colour: '#e9edf4' },
    { min: 10, name: 'Plain Speaker', line: 'Gets the point across, most days.', colour: '#7dd3fc' },
    { min: 18, name: 'Good with Words', line: 'The one who proofreads the group chat.', colour: '#6ee7b7' },
    { min: 26, name: 'Wordsmith', line: 'Knows the rule and the reason for it.', colour: '#e8b43a' },
    { min: 35, name: 'Copy Chief', line: 'Nothing gets past this desk.', colour: '#fb923c' },
    { min: 44, name: 'Walking Dictionary', line: 'Five subjects, no style guide needed.', colour: '#e879f9' },
  ],
  math: [\n`);

// 12. the run page, share card, run client, finale
const RP = 'app/circuits/[id]/run/page.js';
sub(RP, `import { PUZZLES as streakPuzzles } from '../../../streak/puzzles';`,
  `${each((k) => `import { PUZZLES as ${k}Puzzles } from '../../../${k}/puzzles';\nimport { QUESTION_MAP as ${k}Questions } from '../../../${k}/questions';`)}\nimport { PUZZLES as streakPuzzles } from '../../../streak/puzzles';`);
sub(RP, `  streak: { puzzles: streakPuzzles, questions: streakQuestions,`,
  `${each((k, g) => `  ${k}: { puzzles: ${k}Puzzles, questions: ${k}Questions, tiers: ${g.tiers} },`)}\n  streak: { puzzles: streakPuzzles, questions: streakQuestions,`);
sub(RP, `  if (c.id === 'triviaencore') {\n`, `  if (c.id === 'english') {
    const url = \`\${SITE_URL}\${runHref(c.id)}\`;
    const hook = 'Five English quizzes. One life each.';
    return {
      title: 'English Gauntlet: Grammar, Vocabulary and Spelling Quizzes in One Run | Mind Loft',
      description:
        'Five daily English quizzes played back to back as one run: grammar, vocabulary, spelling, word origins and idioms. Ten questions each, twenty seconds a question, one life in each. Free, no signup.',
      alternates: { canonical: runHref(c.id) },
      robots: { index: false, follow: true },
      openGraph: { title: hook, description: 'One wrong answer ends that quiz, the next one starts on its own, and you get one scorecard at the end.', url, type: 'website', siteName: 'Mind Loft' },
      twitter: { card: 'summary_large_image', title: hook, description: 'One wrong answer ends the quiz. Then the next one starts. How far do you get?' },
    };
  }
  if (c.id === 'triviaencore') {\n`);
const GC = 'app/circuits/[id]/gauntlet-card.js';
sub(GC, `import { PUZZLES as streakPuzzles } from '../../streak/puzzles';`,
  `import { PUZZLES as streakPuzzles } from '../../streak/puzzles';\n${each((k) => `import { PUZZLES as ${k}Puzzles } from '../../${k}/puzzles';`)}`);
sub(GC, `  sci: sciPuzzles, art: artPuzzles, history: historyPuzzles,\n`, `  sci: sciPuzzles, art: artPuzzles, history: historyPuzzles,\n  ${each((k) => `${k}: ${k}Puzzles,`, ' ')}\n`);
sub(GC, `    eyebrow: isMath ? 'MIND LOFT · MATH' : 'MIND LOFT · TRIVIA',`, `    eyebrow: isMath ? 'MIND LOFT · MATH' : (circuit && circuit.id === 'english') ? 'MIND LOFT · ENGLISH' : 'MIND LOFT · TRIVIA',`);
const RC = 'app/circuits/[id]/run/RunClient.jsx';
sub(RC, `  const GAUNT = circuitId === 'gauntlet';\n`, `  const GAUNT = circuitId === 'gauntlet';\n  const ENGLISH = circuitId === 'english';\n`);
sub(RC, `|| circuitId === 'math' || (GAUNT && (!encoreOn || encoreDone));`, `|| circuitId === 'math' || ENGLISH || (GAUNT && (!encoreOn || encoreDone));`);
sub(RC, `  const TOWERS = circuitId === 'gauntlet' || circuitId === 'math' || ENCORE;`, `  const TOWERS = circuitId === 'gauntlet' || circuitId === 'math' || ENCORE || ENGLISH;`);
sub(RC, `  const BTOP = GAUNT || MATHRUN || ENCORE;`, `  const BTOP = GAUNT || MATHRUN || ENCORE || ENGLISH;`);
sub(RC, `\${circuitId === 'math' ? 'Math' : 'Trivia'} · \${dateLabel}`, `\${circuitId === 'math' ? 'Math' : ENGLISH ? 'English' : 'Trivia'} · \${dateLabel}`);
const GF = 'app/circuits/GauntletFinale.jsx';
sub(GF, `  const mode = circuitId === 'gauntlet' ? 'trivia' : circuitId === 'math' ? 'math' : null;`, `  const mode = (circuitId === 'gauntlet' || circuitId === 'english') ? 'trivia' : circuitId === 'math' ? 'math' : null;`);
sub(GF, `  if (c === 'gauntlet' || c === 'math' || c === 'triviaencore') return <GauntletEnding {...props} />;`, `  if (c === 'gauntlet' || c === 'math' || c === 'triviaencore' || c === 'english') return <GauntletEnding {...props} />;`);

// 13. doors, more runs, home, art, seo, entry, rewrites
sub('app/circuits/RunDoorPop.jsx', `  judged: {\n    href: '/judged',`, `  // THE ENGLISH GAUNTLET (2026-10-19): once a day on the gate of any of its five.
  english: {
    href: '/english', name: 'English Gauntlet', eyebrow: 'Daily run \\u00b7 Five quizzes',
    body: 'Gram, Vocab, Spell, Origin and Idiom back to back, ten questions and one life in each: grammar, vocabulary, spelling, word origins and idioms.',
    go: 'Run all five', accent: '#93c5fd',
    tags: [['Gram', '#a5b4fc'], ['Vocab', '#5eead4'], ['Spell', '#fdba74'], ['Origin', '#fcd34d'], ['Idiom', '#fda4af']],
  },
  judged: {\n    href: '/judged',`);
sub('app/circuits/MoreRuns.jsx', `export const RUN_ORDER = ['gauntlet', 'triviaencore', 'math',`, `export const RUN_ORDER = ['gauntlet', 'triviaencore', 'english', 'math',`);
sub('lib/run-seo.js', `export const RUN_LANDINGS = ['gauntlet', 'math', 'triviaencore'];`, `export const RUN_LANDINGS = ['gauntlet', 'math', 'triviaencore', 'english'];`);
sub('lib/run-seo.js', `const RUN_ORDER = ['gauntlet', 'triviaencore', 'math',`, `const RUN_ORDER = ['gauntlet', 'triviaencore', 'english', 'math',`);
sub('app/EntryDoor.jsx', `  math: 'Five math quizzes back to back, one life each',`, `  math: 'Five math quizzes back to back, one life each',\n  english: 'Five English quizzes back to back, one life each',`);
sub('app/today/StageToday.jsx', `const PILL_CIRCUITS = ['gauntlet', 'triviaencore', 'math',`, `const PILL_CIRCUITS = ['gauntlet', 'triviaencore', 'english', 'math',`);
sub('app/today/StageToday.jsx', `triviaencore: 'Encore', pricecheck:`, `triviaencore: 'Encore', english: 'English', pricecheck:`);
sub('app/CircuitArt.jsx', `  // MATH GAUNTLET (owner, 2026-10-13)`, `  // ENGLISH GAUNTLET (2026-10-19): an open book, a proofreader's caret, five pips.
  english: (
    <>
      <path d="M50 26 C74 18 100 20 120 30 C140 20 166 18 190 26 V88 C166 80 140 82 120 92 C100 82 74 80 50 88 Z" {...T} />
      <path d="M120 30 V92" />
      <path d="M66 42 H104 M66 54 H100 M66 66 H96" strokeWidth="2.5" opacity=".6" />
      <path d="M140 66 L156 44 L172 66" strokeWidth="3" />
      <g stroke="none" fill="currentColor">
        <circle cx="96" cy="106" r="4" /><circle cx="108" cy="106" r="4" /><circle cx="120" cy="106" r="4" />
        <circle cx="132" cy="106" r="4" opacity=".35" /><circle cx="144" cy="106" r="4" opacity=".35" />
      </g>
    </>
  ),
  // MATH GAUNTLET (owner, 2026-10-13)`);
sub('next.config.js', `      { source: '/math', destination: '/circuits/math/run' },\n`, `      { source: '/math', destination: '/circuits/math/run' },\n      { source: '/english', destination: '/circuits/english/run' },\n`);
sub('next.config.js', `      { source: '/circuits/math/run', destination: '/math', permanent: true },\n`, `      { source: '/circuits/math/run', destination: '/math', permanent: true },\n      { source: '/circuits/english/run', destination: '/english', permanent: true },\n`);

// 14. verify-circuits clock estimates
sub('scripts/verify-circuits.mjs', `  gap: 60, series: 65, back: 75, blitzed: 80,\n`, `  gap: 60, series: 65, back: 75, blitzed: 80,\n  // The English Gauntlet's five (2026-10-19): ten questions each, estimated.\n  gram: 35, vocab: 25, spell: 25, origin: 30, idiom: 25,\n`);

// 15. CLAUDE.md
{
  const src = rd('CLAUDE.md');
  const marker = '## The English Gauntlet (`/english`) and Gram, Vocab, Spell, Origin, Idiom (launched 2026-10-19)';
  if (!src.includes(marker)) {
    wr('CLAUDE.md', src.replace(/\s*$/, '\n') + `
${marker}

Five new Word dailies on the gauntlet shape, TEN questions a day each (five tiers of two, one life,
twenty seconds, \`miss: 'Asked'\`, no Sunday Edition and no \`sunday\` field), and the run that plays
all fifty back to back. Owner, 2026-10-19: "new dailies will be Gram, Vocab, Spell, Origin, Idiom",
named the English Gauntlet.

- **Lanes, two per game, cycled in order inside every tier:** Gram (Word Choice; Punctuation &
  Structure), Vocab (Definitions; Synonyms & Opposites), Spell (Spelled Right; Spot the Error),
  Origin (Word Origins; Named After), Idiom (What It Means; Finish the Saying). Config is
  \`scripts/english-games.mjs\`; lane sources \`scripts/<game>-lanes/\`, written to
  \`scripts/english-lanes-brief.md\` and checked with \`scripts/trivia-lane-check.mjs\`.
- **One generator, one checker:** \`node scripts/gen-english.mjs <game>\` (append-only, \`--check\`),
  \`scripts/english-check-lib.mjs\` behind \`verify-<game>.mjs\`. Spell's stems are templates, so a
  repeat is the stem plus the same four choices. Banks 2026-10-19 to 2026-11-23.
- **The rules every question lives by:** one defensible answer under Merriam-Webster / AP /
  Chicago, nothing contested (no usage the guides disagree on, no folk etymology, no disputed
  meaning), US spelling, no dashes. Each lane was fact-checked by a separate pass before launch.
- **Clients** are SciClient transformed (mkenglish.py, not committed): long choices drop to one
  column (\`.sp-grid.wide\` past 30 characters). Category **Word**, group "Word gauntlets", sets Copy
  desk / Word lore / Word nerds.
- **The run** is circuit \`english\` on the quiz engine (the keys are in RUN_GAMES), served at
  \`/english\` by a rewrite like \`/trivia\` (never create \`app/english/page.js\`), \`score: 'correct'\`,
  \`ownerOrder\`, towers presentation and the Gauntlet ending, title ladder in lib/run-titles.js,
  trophy "Plain English" (bronze). The five clients mount \`RunDoorPop id="english"\` on today's gate.
- **THE ONLY POP-UP IS THE RUN'S (owner, 2026-10-19):** a PREMIERE_RUNS line for \`english\` and no
  PREMIERES line for any of the five.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-english: ${applied} edits applied, ${skipped} already present`);
