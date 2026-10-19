// scripts/english-games.mjs - the shape of the five English Gauntlet dailies
// (owner, 2026-10-19): Gram, Vocab, Spell, Origin, Idiom. Each is TEN
// four-choice questions a day, five tiers of two, the tier block always
// cycling the game's two lanes in this order. Read by gen-english.mjs and
// verify-english.mjs. Nothing here is copy a reader sees except the lane
// names, which print on the question chip.
export const FIRST_LIVE = '2026-10-19';
export const ENGLISH_GAMES = {
  gram: { name: 'Gram', what: 'grammar', lanes: [['Word Choice', 'gram-choice.mjs'], ['Punctuation & Structure', 'gram-punct.mjs']] },
  vocab: { name: 'Vocab', what: 'vocabulary', lanes: [['Definitions', 'vocab-define.mjs'], ['Synonyms & Opposites', 'vocab-syn.mjs']] },
  spell: { name: 'Spell', what: 'spelling', lanes: [['Spelled Right', 'spell-right.mjs'], ['Spot the Error', 'spell-error.mjs']] },
  origin: { name: 'Origin', what: 'word origins', lanes: [['Word Origins', 'origin-words.mjs'], ['Named After', 'origin-names.mjs']] },
  idiom: { name: 'Idiom', what: 'idioms and sayings', lanes: [['What It Means', 'idiom-meaning.mjs'], ['Finish the Saying', 'idiom-finish.mjs']] },
};
export const ENGLISH_KEYS = Object.keys(ENGLISH_GAMES);
export const PER_TIER = 2;
export const TOTAL_Q = 10;
