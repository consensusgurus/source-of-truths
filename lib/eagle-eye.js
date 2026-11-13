// EAGLE EYE: the daily visual run (owner, 2026-11-13).
//
// Spot, Jig, Saw, Scour, then Witness, back to back on one page (app/eagleeye).
// The Visual category's run: five puzzles you solve by looking closely.
//
// TIME AND ACCURACY, WHERE EACH IS RELEVANT (owner: "scored like other runs
// with time and accuracy factoring in, where relevant"). Each leg pays up to
// 100, in Crossed Up's shape: 100 x accuracy x ((1 - share) + share x speed).
//   accuracy  the share of the leg got right: differences found (Spot), the
//             picture finished or not (Jig, Saw), words found (Scour),
//             questions right (Witness).
//   speed     1 at no time at all, falling in a straight line to 0 at the
//             leg's cap. No clock on file (a result banked on another device)
//             pays no speed.
//   share     how much of the leg rides on the clock: most of a jigsaw (the
//             picture is either finished or it is not, so the clock is the
//             measure), half of the word search, less of Spot, and none of
//             Witness, which is a memory test and is scored on answers alone.
// The run is out of 500 and the board's scorer (lib/circuits SCORERS.eagleeye)
// adds the five filed rows up with the same function used on the page.
//
// THE LADDER (owner picked option A, the animals): Mole, Bat, Pigeon, Magpie,
// Owl, Hawk, Eagle Eye. The top rung is the run's own name on purpose (the
// owner's ladder climbs to it). The reveal reads with an article (owner: "you
// are an owl", not "you are owl"): eeLead() gives it. THE CUTOFFS ARE
// PLACEHOLDERS, set so a middling run lands on Magpie or Owl; tune them from a
// fortnight of real runs.

export const EE_RUN_ID = 'eagleeye';
export const EE_PATH = '/eagleeye';
export const EE_KEYS = ['spot', 'jig', 'saw', 'scour', 'witness'];
export const EE_FROM = '2026-11-13';
export const EE_LEG_MAX = 100;
export const EE_MAX = EE_KEYS.length * EE_LEG_MAX;
export const EE_GROUND = '#e879f9';     // Visual's magenta

// cap: seconds at which the leg's speed share is spent. share: see above.
export const EE_FORMS = {
  spot: { name: 'Spot', form: 'The Differences', chip: 'Find the seven differences', band: '#fda4af', cap: 240, share: 0.4, both: true },
  jig: { name: 'Jig', form: 'The Jigsaw', chip: 'Put the photo back together', band: '#fde68a', cap: 1200, share: 0.6, both: false },
  saw: { name: 'Saw', form: 'The Tall Jigsaw', chip: 'A tall photo in pieces', band: '#a7e8cf', cap: 1200, share: 0.6, both: false },
  scour: { name: 'Scour', form: 'The Word Search', chip: 'Find every hidden word', band: '#bae6fd', cap: 600, share: 0.5, both: true },
  witness: { name: 'Witness', form: 'The Scene', chip: 'Study a scene, answer from memory', band: '#d8b4fe', cap: 0, share: 0, both: false },
};

export function eeAcc(score, total) {
  const t = Number(total) > 0 ? Number(total) : 10;
  const s = Number(score);
  if (!Number.isFinite(s) || s <= 0) return 0;
  return Math.max(0, Math.min(1, s / t));
}
export function eeSpeed(key, secs) {
  const f = EE_FORMS[key];
  if (!f || !f.cap) return 0;
  const s = Number(secs);
  if (!Number.isFinite(s) || s <= 0) return 0;
  return Math.max(0, 1 - Math.min(s, f.cap) / f.cap);
}
export function eeLegPoints(key, score, total, secs) {
  const f = EE_FORMS[key];
  if (!f) return 0;
  const a = eeAcc(score, total);
  if (!a) return 0;
  return EE_LEG_MAX * a * ((1 - f.share) + f.share * eeSpeed(key, secs));
}
// The circuit board's scorer: (key, row) => points, off a filed result row.
export function eeScorerFor() {
  return (key, p) => eeLegPoints(key, p && p.score, p && p.total, p && p.timeElapsed);
}

// [cutoff in points, name, short, chip colour, stripe, line], top to bottom.
export const EE_RANKS = [
  [430, 'Eagle Eye', 'EAGLE EYE', '#86198f', '#f5d0fe', 'Nothing gets past you.'],
  [390, 'Hawk', 'HAWK', '#9a3412', '#fed7aa', 'Circling. Almost nothing escapes.'],
  [350, 'Owl', 'OWL', '#1e3a8a', '#bfdbfe', 'Sharp, even in the dark.'],
  [300, 'Magpie', 'MAGPIE', '#0e7490', '#a5f3fc', 'Good eye for the shiny stuff.'],
  [240, 'Pigeon', 'PIGEON', '#15803d', '#bbf7d0', 'Saw the crumbs. Missed the bread.'],
  [150, 'Bat', 'BAT', '#b45309', '#fde68a', 'Bold strategy, flying blind.'],
  [0, 'Mole', 'MOLE', '#475569', '#e2e8f0', 'It was right in front of you.'],
];
export function eeTierOf(points) {
  const p = Number(points) || 0;
  for (let i = 0; i < EE_RANKS.length; i++) if (p >= EE_RANKS[i][0]) return i;
  return EE_RANKS.length - 1;
}
// "You are an Owl", "You are a Hawk", "You have an Eagle Eye" (owner, 2026-11-13).
export function eeLead(name) {
  if (name === 'Eagle Eye') return 'You have an';
  return /^[AEIOU]/i.test(String(name || '')) ? 'You are an' : 'You are a';
}
export const eeSentence = (name) => `${eeLead(name)} ${name}`;
