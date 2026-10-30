// scripts/mkscience.mjs - scaffolds the Science Gauntlet (owner, 2026-10-30):
// five new Trivia dailies, Orbit, Bond, Gene, Pulse and Eureka (ten questions a
// day each, five tiers of two, one life, twenty seconds), cloned from the
// English Gauntlet's Vocab client and page and from its generator and checker.
//
// Writes, idempotently (an existing target is overwritten from the template):
//   scripts/science-games.mjs, scripts/gen-science.mjs, scripts/science-check-lib.mjs,
//   scripts/verify-<game>.mjs, app/<game>/<Name>Client.jsx, app/<game>/page.js
// The banks themselves come from `node scripts/gen-science.mjs <game>`.
//
//   node scripts/mkscience.mjs
import fs from 'fs';
import path from 'path';
import url from 'url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };

export const G = {
  orbit: { Name: 'Orbit', color: '#1e40af', what: 'physics and space', Subj: 'Physics and Space', subj: 'physics and space',
    lanes: [['Forces & Energy', 'orbit-forces.mjs'], ['Space', 'orbit-space.mjs']], lanePhrase: 'forces and energy, then space',
    tiers: ['Launch', 'Liftoff', 'Orbit', 'Deep Space', 'Event Horizon'], genre: 'Physics' },
  bond: { Name: 'Bond', color: '#047857', what: 'chemistry', Subj: 'Chemistry', subj: 'chemistry',
    lanes: [['Elements', 'bond-elements.mjs'], ['Compounds & Reactions', 'bond-reactions.mjs']], lanePhrase: 'the elements, then compounds and reactions',
    tiers: ['Beaker', 'Bench', 'Reaction', 'Catalyst', 'Synthesis'], genre: 'Chemistry' },
  gene: { Name: 'Gene', color: '#4d7c0f', what: 'life science', Subj: 'Life Science', subj: 'life science',
    lanes: [['Animals & Plants', 'gene-organisms.mjs'], ['Cells & Evolution', 'gene-cells.mjs']], lanePhrase: 'animals and plants, then cells and evolution',
    tiers: ['Seedling', 'Species', 'Genus', 'Genome', 'Lineage'], genre: 'Biology' },
  pulse: { Name: 'Pulse', color: '#b91c1c', what: 'human body', Subj: 'The Human Body', subj: 'the human body',
    lanes: [['Anatomy', 'pulse-anatomy.mjs'], ['Health & Medicine', 'pulse-medicine.mjs']], lanePhrase: 'anatomy, then health and medicine',
    tiers: ['Checkup', 'Vitals', 'Diagnosis', 'Specialist', 'Surgeon'], genre: 'Anatomy' },
  eureka: { Name: 'Eureka', color: '#b45309', what: 'inventions and scientists', Subj: 'Inventions and Scientists', subj: 'inventions and scientists',
    lanes: [['Inventions', 'eureka-inventions.mjs'], ['Scientists & Discoveries', 'eureka-discoveries.mjs']], lanePhrase: 'inventions, then scientists and their discoveries',
    tiers: ['Spark', 'Prototype', 'Patent', 'Breakthrough', 'Eureka'], genre: 'History of Science' },
};
export const RUN_ORDER = ['pulse', 'gene', 'orbit', 'eureka', 'bond'];
const FIRST_LIVE = process.env.SCIENCE_FIRST_LIVE || '2026-10-30';

// ---- 1. the shared config --------------------------------------------------
wr('scripts/science-games.mjs', `// scripts/science-games.mjs - the shape of the five Science Gauntlet dailies
// (owner, 2026-10-30): Orbit, Bond, Gene, Pulse, Eureka. Each is TEN
// four-choice questions a day, five tiers of two, the tier block always
// cycling the game's two lanes in this order. Read by gen-science.mjs and
// science-check-lib.mjs. Nothing here is copy a reader sees except the lane
// names, which print on the question chip.
export const FIRST_LIVE = '${FIRST_LIVE}';
export const SCIENCE_GAMES = {
${Object.entries(G).map(([k, g]) => `  ${k}: { name: '${g.Name}', what: '${g.what}', lanes: [${g.lanes.map(([n, f]) => `['${n}', '${f}']`).join(', ')}] },`).join('\n')}
};
export const SCIENCE_KEYS = Object.keys(SCIENCE_GAMES);
export const PER_TIER = 2;
export const TOTAL_Q = 10;
`);

// ---- 2. generator and checker, cloned from the English Gauntlet's --------
const swapScripts = (s) => s
  .replace(/english-games\.mjs/g, 'science-games.mjs')
  .replace(/ENGLISH_GAMES/g, 'SCIENCE_GAMES')
  .replace(/gen-english/g, 'gen-science')
  .replace(/verify-english/g, 'verify-science')
  .replace(/english-check-lib/g, 'science-check-lib')
  .replace(/verifyEnglish/g, 'verifyScience')
  .replace(/English Gauntlet/g, 'Science Gauntlet')
  .replace(/<gram\|vocab\|spell\|origin\|idiom>/g, '<orbit|bond|gene|pulse|eureka>')
  .replace(/\(verify-gram, verify-vocab, verify-spell, verify-origin,\n\/\/ verify-idiom\)/g, '(verify-orbit, verify-bond, verify-gene, verify-pulse,\n// verify-eureka)')
  .replace("// ONE DEFENSIBLE ANSWER. The standard is edited American English where\n// Merriam-Webster, AP and Chicago agree; anything they dispute is not asked.",
    '// ONE DEFENSIBLE ANSWER. Settled textbook science only, and every fact is\n// frozen: nothing that can change (counts, records, current holders) is asked.');
let gen = swapScripts(rd('scripts/gen-english.mjs'));
gen = gen.replace(/^\/\/ scripts\/gen-science\.mjs - [\s\S]*?\nimport fs/m, `// scripts/gen-science.mjs - builds, then appends authored days to, one of the
// five Science Gauntlet banks (app/<game>/questions.js and puzzles.js) from its
// two lane files in scripts/<game>-lanes/. Cloned from scripts/gen-english.mjs
// (2026-10-30) by scripts/mkscience.mjs; the only differences are the config
// it reads and the header comments it writes.
//
//   node scripts/gen-science.mjs <orbit|bond|gene|pulse|eureka> [--through YYYY-MM-DD] [--check]
//
// AFTER RUNNING: node scripts/verify-<game>.mjs
import fs`);
wr('scripts/gen-science.mjs', gen);
wr('scripts/science-check-lib.mjs', swapScripts(rd('scripts/science-check-lib.mjs'.replace('science', 'english'))));
for (const k of Object.keys(G)) {
  wr(`scripts/verify-${k}.mjs`, `// Structural gate for the ${k} bank (Science Gauntlet). Run after every authoring pass:
//   node scripts/verify-${k}.mjs
// The checks live in scripts/science-check-lib.mjs.
import { verifyScience } from './science-check-lib.mjs';
if (!(await verifyScience('${k}'))) process.exit(1);
`);
}

// ---- 3. clients and pages, from Vocab --------------------------------------
const VC = rd('app/vocab/VocabClient.jsx');
const VP = rd('app/vocab/page.js');
const others = (k) => RUN_ORDER.filter((x) => x !== k);
const link = (k) => `<a href="/${k}" style={{ color: INK, fontWeight: 800 }}>${G[k].Name}</a>`;
function must(s, from, to) {
  if (!s.includes(from)) throw new Error(`template anchor missing: ${from.slice(0, 120)}`);
  return s.split(from).join(to);
}
for (const [k, g] of Object.entries(G)) {
  let c = VC;
  c = must(c, `// Vocab, the daily vocabulary gauntlet, part of the English Gauntlet.
//
// Ten vocabulary questions a day in five rounds of two, every round cycling the same
// two lanes (what a word means, then synonyms and opposites). One life, twenty seconds a question, every
// question cleared is a point. Forked from VocabClient; the bank is built by
// scripts/gen-english.mjs vocab and checked by scripts/verify-vocab.mjs.
// Every answer is the sense the major dictionaries give first, never a slang meaning that comes and goes.`,
  `// ${g.Name}, the daily ${g.what} gauntlet, part of the Science Gauntlet.
//
// Ten ${g.what} questions a day in five rounds of two, every round cycling the same
// two lanes (${g.lanePhrase}). One life, twenty seconds a question, every
// question cleared is a point. Forked from VocabClient by scripts/mkscience.mjs; the bank is built by
// scripts/gen-science.mjs ${k} and checked by scripts/verify-${k}.mjs.
// Every answer is settled textbook science, never a count or record that can change.`);
  c = must(c, "accent: '#0d9488',", `accent: '${g.color}',`);
  c = must(c, "const TIER_NAMES = ['Everyday', 'Educated', 'Literary', 'Learned', 'Lexicon'];", `const TIER_NAMES = [${g.tiers.map((t) => `'${t}'`).join(', ')}];`);
  c = must(c, 'what a word means, then synonyms and opposites', g.lanePhrase);
  c = must(c, 'so a run rewards an all-round ear for English rather than one trick. Every answer is the sense the major dictionaries give first, never a slang meaning that comes and goes.',
    `so a run rewards an all-round grasp of ${g.subj} rather than one trick. Every answer is settled textbook science, never a count or a record that can change.`);
  c = must(c, `The other four in the <a href="/english" style={{ color: INK, fontWeight: 800 }}>English Gauntlet</a>: <a href="/gram" style={{ color: INK, fontWeight: 800 }}>Gram</a>, <a href="/spell" style={{ color: INK, fontWeight: 800 }}>Spell</a>, <a href="/origin" style={{ color: INK, fontWeight: 800 }}>Origin</a>, and <a href="/idiom" style={{ color: INK, fontWeight: 800 }}>Idiom</a>.`,
    `The other four in the <a href="/science" style={{ color: INK, fontWeight: 800 }}>Science Gauntlet</a>: ${others(k).slice(0, 3).map(link).join(', ')}, and ${link(others(k)[3])}.`);
  c = must(c, "gstSlot('english', 'vocab')", `gstSlot('science', '${k}')`);
  c = must(c, '<RunDoorPop id="english"', '<RunDoorPop id="science"');
  c = must(c, "this game's pastel step of the English Gauntlet ladder", "this game's pastel step of the Science Gauntlet ladder");
  c = must(c, '{/* THE ENGLISH GAUNTLET DOOR: a player who opens one of the five\n          English quizzes', '{/* THE SCIENCE GAUNTLET DOOR: a player who opens one of the five\n          science quizzes');
  c = c.replace(/vocabulary/g, g.what);
  c = c.replace(/VocabClient/g, `${g.Name}Client`).replace(/Vocab/g, g.Name).replace(/vocab/g, k);
  for (const bad of ['English', 'english', 'dictionar', 'synonym', '#0d9488']) if (c.includes(bad)) throw new Error(`${k} client still mentions ${bad}`);
  wr(`app/${k}/${g.Name}Client.jsx`, c);

  let p = VP;
  p = must(p, `// Vocab: ten vocabulary questions a day in five tiers of two, one life, twenty seconds a
// question, part of the English Gauntlet.`, `// ${g.Name}: ten ${g.what} questions a day in five tiers of two, one life, twenty seconds a
// question, part of the Science Gauntlet.`);
  p = must(p, "title: 'Free Daily Vocabulary Quiz: Vocab | Mind Loft',", `title: 'Free Daily ${g.Subj} Quiz: ${g.Name} | Mind Loft',`);
  p = must(p, "'A free daily vocabulary quiz: 10 questions on definitions, synonyms and opposites, easy to expert. One wrong answer ends the run.',",
    `'A free daily ${g.subj} quiz: 10 questions on ${g.lanePhrase.replace(', then', ' and')}, easy to expert. One wrong answer ends the run.',`);
  p = p.split("'Vocab: The Daily Vocabulary Gauntlet'").join(`'${g.Name}: The Daily ${g.Subj.replace(/^The /, '')} Gauntlet'`);
  p = must(p, "alternateName: 'Vocab: Daily Vocabulary Quiz'", `alternateName: '${g.Name}: Daily ${g.Subj.replace(/^The /, '')} Quiz'`);
  p = must(p, "'A free daily vocabulary quiz and part of the English Gauntlet.", `'A free daily ${g.subj} quiz and part of the Science Gauntlet.`);
  p = must(p, 'what a word means, then synonyms and opposites', g.lanePhrase);
  p = must(p, 'Every answer is the sense the major dictionaries give first, never a slang meaning that comes and goes.', 'Every answer is settled textbook science, never a count or a record that can change.');
  p = must(p, "genre: ['Vocabulary', 'Word', 'Quiz', 'Survival'],", `genre: ['${g.genre}', 'Science', 'Trivia', 'Quiz'],`);
  p = p.split('#0d9488').join(g.color);
  p = p.replace(/vocabulary/g, g.what);
  p = p.replace(/VOCAB/g, g.Name.toUpperCase()).replace(/VocabClient/g, `${g.Name}Client`).replace(/Vocab/g, g.Name).replace(/vocab/g, k);
  for (const bad of ['English', 'dictionar', 'synonym']) if (p.includes(bad)) throw new Error(`${k} page still mentions ${bad}`);
  wr(`app/${k}/page.js`, p);
}
console.log('mkscience: config, generator, checker, 5 verifiers, 5 clients, 5 pages');
