// scripts/science-games.mjs - the shape of the five Science Gauntlet dailies
// (owner, 2026-10-30): Orbit, Bond, Gene, Pulse, Eureka. Each is TEN
// four-choice questions a day, five tiers of two, the tier block always
// cycling the game's two lanes in this order. Read by gen-science.mjs and
// science-check-lib.mjs. Nothing here is copy a reader sees except the lane
// names, which print on the question chip.
export const FIRST_LIVE = '2026-10-30';
export const SCIENCE_GAMES = {
  orbit: { name: 'Orbit', what: 'physics and space', lanes: [['Forces & Energy', 'orbit-forces.mjs'], ['Space', 'orbit-space.mjs']] },
  bond: { name: 'Bond', what: 'chemistry', lanes: [['Elements', 'bond-elements.mjs'], ['Compounds & Reactions', 'bond-reactions.mjs']] },
  gene: { name: 'Gene', what: 'life science', lanes: [['Animals & Plants', 'gene-organisms.mjs'], ['Cells & Evolution', 'gene-cells.mjs']] },
  pulse: { name: 'Pulse', what: 'human body', lanes: [['Anatomy', 'pulse-anatomy.mjs'], ['Health & Medicine', 'pulse-medicine.mjs']] },
  eureka: { name: 'Eureka', what: 'inventions and scientists', lanes: [['Inventions', 'eureka-inventions.mjs'], ['Scientists & Discoveries', 'eureka-discoveries.mjs']] },
};
export const SCIENCE_KEYS = Object.keys(SCIENCE_GAMES);
export const PER_TIER = 2;
export const TOTAL_Q = 10;
