// scripts/mkfinale.mjs - scaffolds the five Trivia Finale gauntlets (Music, Books,
// Nature, Tech, Myth) from Foodie's files: gen-<key>.mjs, verify-<key>.mjs,
// app/<key>/<Name>Client.jsx and app/<key>/page.js. Config: scripts/finale-games.mjs.
// Re-run it only before the games diverge from the template; after launch, edit
// the clients directly (same rule as scripts/mkscience.mjs).
import fs from 'fs';
import path from 'path';
import url from 'url';
import { FINALE_GAMES, FINALE_FIRST_LIVE } from './finale-games.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const R = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const W = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const must = (s, a, f) => { if (!s.includes(a)) throw new Error(`mkfinale: anchor missing in ${f}: ${a.slice(0, 70)}`); };
const rep = (s, a, b, f) => { must(s, a, f); return s.split(a).join(b); };
const J = (x) => JSON.stringify(x);
const SQ = (x) => `'${String(x).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const FOOD_LANES = 'world dishes, ingredients, drinks, kitchen craft, and food history';
const rename = (s, g) => s.split('FoodieClient').join(`${g.name}Client`).split('FoodiePage').join(`${g.name}Page`).split('Foodie').join(g.name).split('foodie').join(g.key).split('FOODIE').join(g.key.toUpperCase());
const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

for (const g of FINALE_GAMES) {
  const SUBJ = `[${g.lanes.map(([n]) => SQ(n)).join(', ')}]`;
  const laneList = g.lanes.map(([n]) => n).join(', ');

  // ---- generator
  let f = 'scripts/gen-foodie.mjs'; let s = R(f);
  s = rep(s, `const SUBJECTS = ['World Dishes', 'Ingredients', 'Drinks', 'Kitchen Craft', 'Food History'];`, `const SUBJECTS = ${SUBJ};`, f);
  s = s.replace(/const LANE_FILE = \{[\s\S]*?\n\};/, () => `const LANE_FILE = {\n${g.lanes.map(([n, file]) => `  ${SQ(n)}: ${SQ(file)},`).join('\n')}\n};`);
  s = rep(s, `const FIRST_LIVE = '2026-10-27';`, `const FIRST_LIVE = '${FINALE_FIRST_LIVE}';`, f);
  s = rep(s, 'World Dishes, Ingredients, Drinks, Kitchen Craft, Food History', laneList, f);
  s = rep(s, `// REUSED FROM ART (owner, 2026-10-26): Foodie's bank began with the 240 food
// and drink questions lifted out of Art. Each carries \`was: 'art:<id>'\`, the
// question it came from, for the record.`, `// \`was\` is carried for a bank seeded from another game's questions (Foodie's
// began with Art's). Nothing in this bank uses it.`, f);
  s = rep(s, `// Food moves too: a restaurant loses a star, a brand changes hands, a price
// goes up. So this bank asks only about settled things: what a dish is, where
// it comes from, who made it and when, with any superlative pinned to a date
// in the stem. Nothing later than the 2024 calendar year.
//
//   was      on a question reused from Art's old Food & Drink lane, the Art id
//            it came from (owner, 2026-10-26).`, `// ${g.frozen}
// Nothing later than the 2024 calendar year.`, f);
  s = rep(s, 'Cloned from scripts/gen-biz.mjs (2026-10-14)', 'Scaffolded from scripts/gen-foodie.mjs by scripts/mkfinale.mjs (2026-11-23)', f);
  s = rep(s, 'writes both files from scratch, day 1 live on FIRST_LIVE (2026-10-14)', `writes both files from scratch, day 1 live on FIRST_LIVE (${FINALE_FIRST_LIVE})`, f);
  s = s.split('food and drink').join(g.subj);
  s = rename(s, g);
  W(`scripts/gen-${g.key}.mjs`, s);

  // ---- verifier
  f = 'scripts/verify-foodie.mjs'; s = R(f);
  s = rep(s, `const SUBJECTS = ['World Dishes', 'Ingredients', 'Drinks', 'Kitchen Craft', 'Food History'];`, `const SUBJECTS = ${SUBJ};`, f);
  s = rep(s, `// Cloned from scripts/verify-art.mjs (2026-10-26); the differences are the
// lane list, the quizId prefix and the launch date. Foodie launched
// 2026-10-27 under the current authoring rules, so the copy window opens on
// day 1. Its bank began with Art's 240 food and drink questions (each
// carrying \`was: 'art:<id>'\`), which is why the same text can also appear in
// Art's frozen history; this checker only looks inside Foodie.`, `// Scaffolded from scripts/verify-foodie.mjs by scripts/mkfinale.mjs (2026-11-23);
// the differences are the lane list, the quizId prefix and the launch date.
// Foodie launches ${FINALE_FIRST_LIVE} under the current authoring rules, so the
// copy window opens on day 1. This checker only looks inside Foodie.`, f);
  s = rep(s, `const ART_COPY_FROM = '2026-10-27';`, `const ART_COPY_FROM = '${FINALE_FIRST_LIVE}';`, f);
  s = s.split('food and drink').join(g.subj);
  s = rename(s, g);
  W(`scripts/verify-${g.key}.mjs`, s);

  // ---- client
  f = 'app/foodie/FoodieClient.jsx'; s = R(f);
  const head0 = s.indexOf('// Foodie, the daily food and drink gauntlet.');
  const head1 = s.indexOf("import React, { useState");
  if (head0 < 0 || head1 < 0) throw new Error('mkfinale: client header anchors missing');
  s = s.slice(0, head0) + `// ${g.name}, the daily ${g.subj} gauntlet (launched ${FINALE_FIRST_LIVE} with the Trivia Finale).
//
// Twenty-five questions on ${g.subj} stand between you and a perfect run. They
// climb from gimme to expert in five tiers of five, every tier cycling the same
// five lanes (${g.lanesProse}), and everyone faces the same twenty-five in the
// same order. Twenty seconds a question and one life: answer wrong, or let the
// clock hit zero, and the run is over. Every question you clear is a point.
//
// EVERY FACT IN THE BANK IS FROZEN.
// ${g.frozen}
// Nothing later than 2024.
//
// Scaffolded from FoodieClient.jsx by scripts/mkfinale.mjs; same shape as Foodie,
// Sci, Art and History. Ties on the daily board break by time.

` + s.slice(head1);
  s = rep(s, `  accent: '#c2410c',        // Foodie identity, paprika`, `  accent: '${g.accent}',        // ${g.name} identity`, f);
  s = rep(s, `accentSoft: '#fbeee6'`, `accentSoft: '${g.accentSoft}'`, f);
  s = rep(s, `const TIER_NAMES = ['Snack', 'Appetizer', 'Main Course', 'Chef\\'s Table', 'Tasting Menu'];`, `const TIER_NAMES = ${J(g.tiers)};`, f);
  s = rep(s, FOOD_LANES, g.lanesProse, f);
  s = rep(s, 'so a run rewards someone who cooks, travels and orders widely rather than someone who knows one cuisine', g.rewards, f);
  s = rep(s, 'never a menu price or a ranking that moves next week', g.never, f);
  s = rep(s, `'FOOD'.split('')`, `'${g.block}'.split('')`, f);
  s = rep(s, '<RunDoorPop id="gauntlet"', '<RunDoorPop id="triviafinale"', f);
  s = s.split('food and drink').join(g.subj);
  if (/[Ff]ood|drink|dish|kitchen|paprika/.test(s.replace(/foodie|Foodie/g, ''))) {
    const left = s.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /[Ff]ood|drink|dish|kitchen|paprika/.test(l.replace(/foodie|Foodie/g, ''))).map(([i, l]) => `${i}: ${l.trim().slice(0, 120)}`);
    throw new Error(`mkfinale: food words left in the ${g.key} client:\n${left.join('\n')}`);
  }
  s = rename(s, g);
  W(`app/${g.key}/${g.name}Client.jsx`, s);

  // ---- page
  f = 'app/foodie/page.js'; s = R(f);
  s = rep(s, `// Foodie launches 2026-10-27. Twenty-five food and drink questions`, `// Foodie launches ${FINALE_FIRST_LIVE}. Twenty-five ${g.subj} questions`, f);
  s = rep(s, `title: 'Free Daily Food and Drink Trivia Game: Foodie | Mind Loft',`, `title: ${SQ(g.title)},`, f);
  s = rep(s, `'A free daily food quiz: 25 questions on dishes, ingredients, drinks, cooking and food history, easy to expert. One wrong answer ends the run.',`, `${SQ(g.desc)},`, f);
  s = rep(s, `title: 'Foodie: The Daily Food and Drink Gauntlet',\n    description:`, `title: 'Foodie: The Daily ${g.subject} Gauntlet',\n    description:`, f);
  s = rep(s, `card: 'summary_large_image', title: 'Foodie: The Daily Food and Drink Gauntlet'`, `card: 'summary_large_image', title: 'Foodie: The Daily ${g.subject} Gauntlet'`, f);
  s = rep(s, `alternateName: 'Foodie: Daily Food and Drink Trivia'`, `alternateName: 'Foodie: Daily ${g.subject} Trivia'`, f);
  s = rep(s, FOOD_LANES, g.lanesProse.replace(/'/g, "\\'"), f);   // it sits inside a single-quoted string here
  s = rep(s, `genre: ['Food', 'Drink', 'Trivia', 'Quiz', 'Survival'],`, `genre: [${g.genre.map(SQ).join(', ')}],`, f);
  s = rep(s, `{'FOOD'.split('')`, `{'${g.block}'.split('')`, f);
  s = s.split('#c2410c').join(g.accent);
  s = s.split('food and drink').join(g.subj);
  if (/[Ff]ood|[Dd]rink|dish|kitchen/.test(s.replace(/foodie|Foodie/g, ''))) throw new Error(`mkfinale: food words left in the ${g.key} page: ${s.split('\n').filter((l) => /[Ff]ood|[Dd]rink|dish|kitchen/.test(l.replace(/foodie|Foodie/g, ''))).map((l) => l.trim().slice(0, 140)).join(' || ')}`);
  s = rename(s, g);
  W(`app/${g.key}/page.js`, s);
  console.log(`scaffolded ${g.key}`);
}
