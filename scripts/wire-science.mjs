// scripts/wire-science.mjs, wires the Science Gauntlet (owner, 2026-10-30):
// five new Trivia dailies, Orbit (physics and space), Bond (chemistry), Gene
// (life science), Pulse (the human body) and Eureka (inventions and
// scientists), ten questions a day each (five tiers of two, one life, twenty
// seconds), and the run that plays all fifty back to back at /science
// (circuit `science`, quiz engine, Lab to Laureate title ladder, the filled
// flask ending in app/circuits/GauntletFinale.jsx).
//
// Placement copies the English Gauntlet's (scripts/wire-english.mjs), in the
// Trivia lists rather than the Word ones. THE ONLY POP-UP IS THE RUN'S, as
// with English: a PREMIERE_RUNS line for `science`, no PREMIERES line for any
// of the five.
//
// Anchored edits: every anchor must match EXACTLY ONCE or the script throws,
// and an edit whose replacement is already present is skipped.
//   node scripts/wire-science.mjs <dir>
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

// Run order (easiest read first, chemistry last).
const KEYS = ['pulse', 'gene', 'orbit', 'eureka', 'bond'];
const G = {
  orbit: { Name: 'Orbit', color: '#1e40af', navy: '#93c5fd', bg: '#dbeafe', subject: 'Physics and space', generic: 'Physics and space quiz',
    tag: 'Physics and space, one life', tagLong: 'Ten physics and space questions, gimme to expert, one life',
    how: 'Ten physics and space questions climb from gimme to expert in five rounds of two: forces and energy, then space. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten physics and space questions, gimme to expert: forces and energy, then the planets and stars. One wrong answer ends the run.',
    tiers: "['Launch', 'Liftoff', 'Orbit', 'Deep Space', 'Event Horizon']", skills: "['mem']",
    glyph: 'M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M3 12c0-2.5 4-4.5 9-4.5s9 2 9 4.5-4 4.5-9 4.5-9-2-9-4.5M19 6h.01', note: 'a planet in its orbit' },
  bond: { Name: 'Bond', color: '#047857', navy: '#6ee7b7', bg: '#d1fae5', subject: 'Chemistry', generic: 'Chemistry quiz',
    tag: 'Chemistry, one life', tagLong: 'Ten chemistry questions, gimme to expert, one life',
    how: 'Ten chemistry questions climb from gimme to expert in five rounds of two: the elements, then compounds and reactions. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten chemistry questions, gimme to expert: the elements, then compounds and reactions. One wrong answer ends the run.',
    tiers: "['Beaker', 'Bench', 'Reaction', 'Catalyst', 'Synthesis']", skills: "['mem']",
    glyph: 'M6 6m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M18 18m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M18 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M8 8l8 8M16.5 7.5l-1 1', note: 'atoms joined by bonds' },
  gene: { Name: 'Gene', color: '#4d7c0f', navy: '#bef264', bg: '#ecfccb', subject: 'Life science', generic: 'Life science quiz',
    tag: 'Life science, one life', tagLong: 'Ten life science questions, gimme to expert, one life',
    how: 'Ten life science questions climb from gimme to expert in five rounds of two: animals and plants, then cells and evolution. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten life science questions, gimme to expert: animals and plants, then cells and evolution. One wrong answer ends the run.',
    tiers: "['Seedling', 'Species', 'Genus', 'Genome', 'Lineage']", skills: "['mem']",
    glyph: 'M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12s10 6 10 6M8 7h8M8 17h8M9.5 12h5', note: 'a DNA double helix' },
  pulse: { Name: 'Pulse', color: '#b91c1c', navy: '#fca5a5', bg: '#fee2e2', subject: 'The human body', generic: 'Human body quiz',
    tag: 'The human body, one life', tagLong: 'Ten questions on the human body, gimme to expert, one life',
    how: 'Ten questions on the human body climb from gimme to expert in five rounds of two: anatomy, then health and medicine. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten questions on the human body, gimme to expert: anatomy, then health and medicine. One wrong answer ends the run.',
    tiers: "['Checkup', 'Vitals', 'Diagnosis', 'Specialist', 'Surgeon']", skills: "['mem']",
    glyph: 'M3 12h4l2-5 4 10 2-5h6', note: 'a heartbeat trace' },
  eureka: { Name: 'Eureka', color: '#b45309', navy: '#fcd34d', bg: '#fef3c7', subject: 'Inventions and scientists', generic: 'Inventions and discoveries quiz',
    tag: 'Inventions and scientists, one life', tagLong: 'Ten questions on inventions and scientists, gimme to expert, one life',
    how: 'Ten questions on inventions and scientists climb from gimme to expert in five rounds of two: inventions, then scientists and their discoveries. One wrong answer or an empty clock ends the run.',
    blurb: 'Ten questions on inventions and scientists, gimme to expert: who built what, then who discovered it. One wrong answer ends the run.',
    tiers: "['Spark', 'Prototype', 'Patent', 'Breakthrough', 'Eureka']", skills: "['mem']",
    glyph: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z', note: 'a light bulb' },
};
const each = (fn, sep = '\n') => KEYS.map((k) => fn(k, G[k])).join(sep);
const list = (sep = ', ') => KEYS.map((k) => `'${k}'`).join(sep);
const border = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0.4)`; };

// 1. registry rows (after Sci) and the run premiere
afterLine('lib/daily-games.js', "{ key: 'sci', miss: 'Asked', name: 'Sci', cat: 'Trivia'", [
  each((k, g) => `  { key: '${k}', miss: 'Asked', name: '${g.Name}', cat: 'Trivia', subject: '${g.subject}', tag: '${g.tag}', tagLong: '${g.tagLong}', how: '${g.how}', color: '${g.color}', colorNavy: '${g.navy}' },`)]);
sub('lib/daily-games.js', `export const PREMIERE_RUNS = [\n`, `export const PREMIERE_RUNS = [
  { id: 'science', name: 'Science Gauntlet', href: '/science', from: '${process.env.SCIENCE_FIRST_LIVE || '2026-10-30'}', until: '2026-11-04', keys: [${list()}], cat: 'Trivia',
    lede: 'Five new science quizzes played back to back as one run: the human body, life science, physics and space, inventions and chemistry. Ten questions each, one life in each.',
    foot: 'Pulse, Gene, Orbit, Eureka and Bond are also their own dailies on the Trivia shelf.' },
`);

// 2. end card, launch pins
sub('app/DailyEndCard.jsx', `const LAUNCH_PIN = { keys: ['mahj', `, `const LAUNCH_PIN = { keys: [${list()}, 'mahj', `);
sub('app/api/quiz/daily-order/route.js', `const LAUNCH_PIN = { keys: ['mahj', `, `const LAUNCH_PIN = { keys: [${list()}, 'mahj', `);
afterLine('app/DailyEndCard.jsx', "  sci: { accent: '#0f766e', badgeBg: '#0f766e', badgeInk: T.white, Fin: FlaskConical },", [
  each((k, g) => `  ${k}: { accent: '${g.color}', badgeBg: '${g.color}', badgeInk: T.white, Fin: FlaskConical },`)]);
afterLine('app/DailyEndCard.jsx', "{ key: 'sci', cat: 'trivia',   name: 'Sci',", [
  each((k, g) => `  { key: '${k}', cat: 'trivia',   name: '${g.Name}', tag: '${g.tag}', blurb: '${g.blurb}', href: '/${k}' },`)]);

// 3. promo, grid, strip
afterLine('app/DailyGamesPromo.jsx', "{ key: 'sci', href: '/sci'", [
  each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', tag: '${g.tag.toLowerCase()}', store: 'sot_${k}_day', accent: '${g.color}', bg: '${g.bg}', border: '${border(g.color)}' },`)]);
afterLine('app/DailyGamesGrid.jsx', "{ key: 'sci', href: '/sci'", [
  each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', tag: '${g.tag}', img: '/games/btn-${k}.png' },`)]);
sub('app/DailyGamesGrid.jsx', `'quotes', 'sci', 'art', 'history', 'foodie', 'potluck',`, `'quotes', 'sci', ${list()}, 'art', 'history', 'foodie', 'potluck',`);
afterLine('app/DailyStrip.jsx', "{ key: 'sci', href: '/sci'", [
  each((k, g) => `  { key: '${k}', href: '/${k}', name: '${g.Name}', img: '/games/btn-${k}.png', store: 'sot_${k}_day', tag: "${g.tag}" , cat: 'Trivia' },`)]);
sub('app/DailyStrip.jsx', `const ACCENTS = { mahj: `, `const ACCENTS = { ${each((k, g) => `${k}: '${g.navy}',`, ' ')} mahj: `);
sub('app/DailyStrip.jsx', `const TCOL = { mahj: `, `const TCOL = { ${each((k, g) => `${k}: '${g.color}',`, ' ')} mahj: `);

// 4. archive
sub('app/archive/page.js', `import { PUZZLES as SCI_FULL } from '../sci/puzzles';`,
  `import { PUZZLES as SCI_FULL } from '../sci/puzzles';\n${each((k) => `import { PUZZLES as ${k.toUpperCase()}_FULL } from '../${k}/puzzles';`)}`);
afterLine('app/archive/page.js', 'const SCI = SCI_FULL.map(', [
  each((k) => `const ${k.toUpperCase()} = ${k.toUpperCase()}_FULL.map(({ num, quizId, live, dateLabel }) => ({ num, quizId, live, dateLabel }));`)]);
afterLine('app/archive/page.js', "{ key: 'sci', name: 'Sci', path: '/sci'", [
  each((k, g) => `  { key: '${k}', name: '${g.Name}', path: '/${k}', tag: '${g.tag}', accent: '${g.color}', bg: '${g.bg}', border: '${border(g.color)}', src: ${k.toUpperCase()} },`)]);

// 5. the four puzzle-map registries
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  sub(f, `import { PUZZLES as P_idiom } from '@/app/idiom/puzzles';`,
    `import { PUZZLES as P_idiom } from '@/app/idiom/puzzles';\n${each((k) => `import { PUZZLES as P_${k} } from '@/app/${k}/puzzles';`)}`);
  sub(f, `idiom: P_idiom,`, `idiom: P_idiom, ${each((k) => `${k}: P_${k},`, ' ')}`);
}

// 6. alternations, rail, catalog, loft
const ALT = KEYS.join('|');
sub('app/api/quiz/daily-status/route.js', `|idiom|scour|`, `|idiom|${ALT}|scour|`);
sub('app/quizzes/QuizHomeClient.jsx', `|idiom|scour|`, `|idiom|${ALT}|scour|`);
sub('app/DailySlateRail.jsx', `'idiom', 'scour',`, `'idiom', ${list()}, 'scour',`);
sub('lib/quiz-catalog.js', `'idiom', 'scour', `, `'idiom', ${list()}, 'scour', `);
sub('lib/loft.js', `'quotes', 'sci', 'art', 'history', 'foodie',`, `'quotes', 'sci', ${list()}, 'art', 'history', 'foodie',`);

// 7. scoring: linear IQ, answered = cleared + 1 out of ten
sub('lib/quiz-xp.js', `'origin', 'idiom']);`, `'origin', 'idiom', ${list()}]);`);
sub('lib/quiz-scoring.js', `|| key === 'idiom'`, `|| key === 'idiom' || ${KEYS.map((k) => `key === '${k}'`).join(' || ')}`);

// 8. skills, difficulty seeds, finish beat, glyph
sub('lib/daily-skills.js', `sci: ['mem'], `, `sci: ['mem'], ${each((k, g) => `${k}: ${g.skills},`, ' ')} `);
sub('lib/daily-difficulty.js', `  gram: 3, vocab: 3, spell: 3, origin: 3, idiom: 1,\n`, `  gram: 3, vocab: 3, spell: 3, origin: 3, idiom: 1,\n  // The Science Gauntlet's five (2026-10-30), estimates.\n  orbit: 3, bond: 3, gene: 3, pulse: 3, eureka: 3,\n`);
afterLine('lib/finish-beats.js', '  sci: lock,', [each((k) => `  ${k}: lock,`)]);
afterLine('lib/game-glyphs.js', "  sci: 'M9 3h6M10 3v6l-5", [each((k, g) => `  ${k}: '${g.glyph}', // ${g.note}`)]);

// 9. group and finish sets
afterLine('lib/daily-groups.js', `{ name: 'Classroom gauntlets', cat: 'Trivia', keys: ['sci', 'art', 'history', 'foodie'] },`, [
  `  { name: 'Science gauntlets', cat: 'Trivia', keys: [${list()}] },`]);
afterLine('lib/finish-sets.js', `{ name: 'Back to school', cat: 'Trivia', keys: ['sci', 'art', 'history'] },`, [
  `  { name: 'Lab day', cat: 'Trivia', keys: ['bond', 'orbit', 'sci'] },`,
  `  { name: 'Natural world', cat: 'Trivia', keys: ['gene', 'pulse', 'atlas'] },`,
  `  { name: 'Great minds', cat: 'Trivia', keys: ['eureka', 'history', 'quotes'] },`]);

// 10. the trivia page
const PC = 'lib/puzzle-categories.js';
sub(PC, `'quotes', 'sci', 'art', 'history', 'foodie', 'potluck', 'focus',`, `'quotes', 'sci', ${list()}, 'art', 'history', 'foodie', 'potluck', 'focus',`);
sub(PC, `sci: 'Science trivia', `, `sci: 'Science trivia', ${each((k, g) => `${k}: '${g.generic}',`, ' ')} `);

// 11. the circuit
sub('lib/circuits.js', `'gram', 'vocab', 'spell', 'origin', 'idiom'];`, `'gram', 'vocab', 'spell', 'origin', 'idiom', ${list()}];`);
sub('lib/circuits.js', `  {\n    id: 'math',\n    name: 'Math Gauntlet',`, `  {
    id: 'science',
    name: 'Science Gauntlet',
    // THE SCIENCE GAUNTLET (owner, 2026-10-30): the five science dailies, ten
    // questions each, played back to back on the trivia run page. Lives at
    // /science (rewritten onto the run page, like /trivia and /english). Board
    // is questions right, clock as the tiebreak. Easiest read first, chemistry
    // last. Its ending is the filled flask (app/circuits/GauntletFinale.jsx).
    path: '/science',
    shareHref: '/science',
    blurb: 'Five science quizzes back to back: the human body, life science, physics and space, inventions and chemistry. One wrong answer ends that quiz and starts the next.',
    share: {
      invite: "Five science quizzes, one life in each: the human body, life science, physics and space, inventions and chemistry.",
      result: "Five science quizzes, one life in each. How far do you get?",
    },
    run: true,
    score: 'correct',
    ownerOrder: true,
    keys: [${list()}],
    trophy: { name: 'Lab Coat', tier: 'bronze', icon: 'FlaskConical' },
  },
  {
    id: 'math',
    name: 'Math Gauntlet',`);
sub('lib/circuits.js', `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'math',`, `const SHOWN = ['pricecheck', 'gauntlet', 'triviaencore', 'english', 'science', 'math',`);
sub('lib/trophy-defs.js', `  { id: 'circuit-math', name: 'Human Calculator',`, `  { id: 'circuit-science', name: 'Lab Coat', desc: 'Finish all five quizzes of the Science Gauntlet on the same day.', tier: 'bronze', group: 'circuits', icon: 'FlaskConical' },\n  { id: 'circuit-math', name: 'Human Calculator',`);
sub('lib/run-titles.js', `  math: [\n`, `  // THE SCIENCE GAUNTLET (owner, 2026-10-30: option A, Lab to Laureate): five
  // quizzes of ten, 50 asked, the English Gauntlet's cutoffs. Provisional.
  science: [
    { min: 0, name: 'Safety Goggles On', line: 'Every scientist broke a beaker once.', colour: '#e9edf4' },
    { min: 10, name: 'Lab Partner', line: 'Good to have at the next bench.', colour: '#7dd3fc' },
    { min: 18, name: 'Science Fair Winner', line: 'The volcano actually erupted.', colour: '#6ee7b7' },
    { min: 26, name: 'Grad Student', line: 'Knows the textbook and the footnotes.', colour: '#e8b43a' },
    { min: 35, name: 'Professor', line: 'Tenured, and it shows.', colour: '#fb923c' },
    { min: 44, name: 'Nobel Laureate', line: 'Five fields, no lab manual needed.', colour: '#e879f9' },
  ],
  math: [\n`);

// 12. the run page, share card, run client
const RP = 'app/circuits/[id]/run/page.js';
sub(RP, `import { PUZZLES as streakPuzzles } from '../../../streak/puzzles';`,
  `${each((k) => `import { PUZZLES as ${k}Puzzles } from '../../../${k}/puzzles';\nimport { QUESTION_MAP as ${k}Questions } from '../../../${k}/questions';`)}\nimport { PUZZLES as streakPuzzles } from '../../../streak/puzzles';`);
sub(RP, `  streak: { puzzles: streakPuzzles, questions: streakQuestions,`,
  `${each((k, g) => `  ${k}: { puzzles: ${k}Puzzles, questions: ${k}Questions, tiers: ${g.tiers} },`)}\n  streak: { puzzles: streakPuzzles, questions: streakQuestions,`);
sub(RP, `  if (c.id === 'english') {\n`, `  if (c.id === 'science') {
    const url = \`\${SITE_URL}\${runHref(c.id)}\`;
    const hook = 'Five science quizzes. One life each.';
    return {
      title: 'Science Gauntlet: Physics, Chemistry and Biology Quizzes in One Run | Mind Loft',
      description:
        'Five daily science quizzes played back to back as one run: the human body, life science, physics and space, inventions and chemistry. Ten questions each, twenty seconds a question, one life in each. Free, no signup.',
      alternates: { canonical: runHref(c.id) },
      robots: { index: false, follow: true },
      openGraph: { title: hook, description: 'One wrong answer ends that quiz, the next one starts on its own, and you get one scorecard at the end.', url, type: 'website', siteName: 'Mind Loft' },
      twitter: { card: 'summary_large_image', title: hook, description: 'One wrong answer ends the quiz. Then the next one starts. How far do you get?' },
    };
  }
  if (c.id === 'english') {\n`);
const GC = 'app/circuits/[id]/gauntlet-card.js';
sub(GC, `import { PUZZLES as streakPuzzles } from '../../streak/puzzles';`,
  `import { PUZZLES as streakPuzzles } from '../../streak/puzzles';\n${each((k) => `import { PUZZLES as ${k}Puzzles } from '../../${k}/puzzles';`)}`);
sub(GC, `origin: originPuzzles, idiom: idiomPuzzles,\n`, `origin: originPuzzles, idiom: idiomPuzzles,\n  ${each((k) => `${k}: ${k}Puzzles,`, ' ')}\n`);
sub(GC, `    eyebrow: isMath ? 'MIND LOFT · MATH' : (circuit && circuit.id === 'english') ? 'MIND LOFT · ENGLISH' : 'MIND LOFT · TRIVIA',`,
  `    eyebrow: isMath ? 'MIND LOFT · MATH' : (circuit && circuit.id === 'english') ? 'MIND LOFT · ENGLISH' : (circuit && circuit.id === 'science') ? 'MIND LOFT · SCIENCE' : 'MIND LOFT · TRIVIA',`);
sub(GC, "      : (circuit && circuit.id === 'english') ? `${banks.length} quizzes, one life each.`", "      : (circuit && (circuit.id === 'english' || circuit.id === 'science')) ? `${banks.length} quizzes, one life each.`");
const RC = 'app/circuits/[id]/run/RunClient.jsx';
sub(RC, `  const ENGLISH = circuitId === 'english';\n`, `  const ENGLISH = circuitId === 'english';\n  const SCIENCE = circuitId === 'science';\n`);
sub(RC, `|| circuitId === 'math' || ENGLISH || (GAUNT`, `|| circuitId === 'math' || ENGLISH || SCIENCE || (GAUNT`);
sub(RC, `circuitId === 'triviaencore' || circuitId === 'english')) setCurtain(true);`, `circuitId === 'triviaencore' || circuitId === 'english' || circuitId === 'science')) setCurtain(true);`);
sub(RC, `  const TOWERS = circuitId === 'gauntlet' || circuitId === 'math' || ENCORE || ENGLISH;`, `  const TOWERS = circuitId === 'gauntlet' || circuitId === 'math' || ENCORE || ENGLISH || SCIENCE;`);
sub(RC, `  const BTOP = GAUNT || MATHRUN || ENCORE || ENGLISH;`, `  const BTOP = GAUNT || MATHRUN || ENCORE || ENGLISH || SCIENCE;`);
sub(RC, `ENGLISH ? 'How good are you with words?' : 'Where`, `ENGLISH ? 'How good are you with words?' : SCIENCE ? 'How far up the lab do you go?' : 'Where`);
sub(RC, "${circuitId === 'math' ? 'Math' : ENGLISH ? 'English' : 'Trivia'} · ${dateLabel}", "${circuitId === 'math' ? 'Math' : ENGLISH ? 'English' : SCIENCE ? 'Science' : 'Trivia'} · ${dateLabel}");

// 13. doors, more runs, home, art, seo, entry, rewrites
sub('app/circuits/RunDoorPop.jsx', `  // THE ENGLISH GAUNTLET (2026-10-19): once a day on the gate of any of its five.\n`, `  // THE SCIENCE GAUNTLET (2026-10-30): once a day on the gate of any of its five.
  science: {
    href: '/science', name: 'Science Gauntlet', eyebrow: 'Daily run \\u00b7 Five quizzes',
    body: 'Pulse, Gene, Orbit, Eureka and Bond back to back, ten questions and one life in each: the human body, life science, physics and space, inventions and chemistry.',
    go: 'Run all five', accent: '#93c5fd',
    tags: [['Pulse', '#fca5a5'], ['Gene', '#bef264'], ['Orbit', '#93c5fd'], ['Eureka', '#fcd34d'], ['Bond', '#6ee7b7']],
  },
  // THE ENGLISH GAUNTLET (2026-10-19): once a day on the gate of any of its five.\n`);
sub('app/circuits/MoreRuns.jsx', `export const RUN_ORDER = ['gauntlet', 'triviaencore', 'english', 'math',`, `export const RUN_ORDER = ['gauntlet', 'triviaencore', 'english', 'science', 'math',`);
sub('lib/run-seo.js', `export const RUN_LANDINGS = ['gauntlet', 'math', 'triviaencore', 'english'];`, `export const RUN_LANDINGS = ['gauntlet', 'math', 'triviaencore', 'english', 'science'];`);
sub('lib/run-seo.js', `const RUN_ORDER = ['gauntlet', 'triviaencore', 'english', 'math',`, `const RUN_ORDER = ['gauntlet', 'triviaencore', 'english', 'science', 'math',`);
sub('app/EntryDoor.jsx', `  english: 'Five English quizzes back to back, one life each',`, `  english: 'Five English quizzes back to back, one life each',\n  science: 'Five science quizzes back to back, one life each',`);
sub('app/today/StageToday.jsx', `const PILL_CIRCUITS = ['gauntlet', 'triviaencore', 'english', 'math',`, `const PILL_CIRCUITS = ['gauntlet', 'triviaencore', 'english', 'science', 'math',`);
sub('app/today/StageToday.jsx', `english: 'English', pricecheck:`, `english: 'English', science: 'Science', pricecheck:`);
sub('app/CircuitArt.jsx', `  // ENGLISH GAUNTLET (2026-10-19)`, `  // SCIENCE GAUNTLET (2026-10-30): an Erlenmeyer flask, half full, five pips.
  science: (
    <>
      <path d="M104 22 H136 M108 22 V52 L76 96 Q70 106 82 106 H158 Q170 106 164 96 L132 52 V22" />
      <path d="M90 82 H150" strokeWidth="2.5" opacity=".6" />
      <g stroke="none" fill="currentColor">
        <circle cx="112" cy="94" r="3" opacity=".5" /><circle cx="126" cy="88" r="2.5" opacity=".5" />
        <circle cx="96" cy="118" r="4" /><circle cx="108" cy="118" r="4" /><circle cx="120" cy="118" r="4" />
        <circle cx="132" cy="118" r="4" opacity=".35" /><circle cx="144" cy="118" r="4" opacity=".35" />
      </g>
    </>
  ),
  // ENGLISH GAUNTLET (2026-10-19)`);
sub('next.config.js', `      { source: '/english', destination: '/circuits/english/run' },\n`, `      { source: '/english', destination: '/circuits/english/run' },\n      { source: '/science', destination: '/circuits/science/run' },\n`);
sub('next.config.js', `      { source: '/circuits/english/run', destination: '/english', permanent: true },\n`, `      { source: '/circuits/english/run', destination: '/english', permanent: true },\n      { source: '/circuits/science/run', destination: '/science', permanent: true },\n`);

// 14. verify-circuits clock estimates
sub('scripts/verify-circuits.mjs', `  gram: 35, vocab: 25, spell: 25, origin: 30, idiom: 25,\n`, `  gram: 35, vocab: 25, spell: 25, origin: 30, idiom: 25,\n  // The Science Gauntlet's five (2026-10-30): ten questions each, estimated.\n  orbit: 30, bond: 30, gene: 30, pulse: 30, eureka: 30,\n`);

console.log(`wire-science: ${applied} edits applied, ${skipped} already present`);
