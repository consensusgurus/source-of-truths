// Gate for the Deep subjects cross-filed under their parent topics in the
// question databases (owner, 2026-11-23: "yes, map deep subjects").
//
//   node scripts/verify-deep-parents.mjs [--counts]
//
// Proves: every Deep subject in the bank is either mapped (DEEP_PARENT) or
// knowingly left under Deep Cuts alone (DEEP_NO_PARENT); every mapping ends in
// a topic that exists; a database's total counts each question once; a mix of
// everything never deals a question twice; a topic's printed samples are its
// own questions; and a Deep subject's only page is the one under Deep Cuts.
// --counts prints what each parent topic gained as of today.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);
const { TRIVIA_TOPICS, DEEP_PARENT, DEEP_NO_PARENT, DEEP_SCIENCE, deepParent } = await import('../lib/trivia-topics.js');
const { QDBS } = await import('../lib/qdb.js');
const lib = await import('../lib/qdb-library.js');
const { PUZZLES } = await import('../app/deep/puzzles.js');

let fails = 0;
const fail = (m) => { console.error(`FAIL ${m}`); fails++; };
const slugs = new Set(TRIVIA_TOPICS.map((t) => t.slug));
const sci = new Set(QDBS.science.topics.map((t) => t.slug));

const subjects = [...new Set(PUZZLES.map((p) => p.topic).filter(Boolean))];
for (const s of subjects) if (!DEEP_PARENT[s] && !DEEP_NO_PARENT.includes(s)) fail(`Deep subject "${s}" is neither in DEEP_PARENT nor in DEEP_NO_PARENT (lib/trivia-topics.js)`);
for (const [s, want] of Object.entries(DEEP_PARENT)) {
  if (!Array.isArray(want) || !want.length) { fail(`DEEP_PARENT["${s}"] is not a list of topic slugs`); continue; }
  if (!slugs.has(want[want.length - 1])) fail(`DEEP_PARENT["${s}"] ends in "${want[want.length - 1]}", which is not a Trivia Database topic`);
  if (want.includes('deep-cuts')) fail(`DEEP_PARENT["${s}"] names deep-cuts`);
  if (DEEP_NO_PARENT.includes(s)) fail(`"${s}" is in both DEEP_PARENT and DEEP_NO_PARENT`);
  if (!subjects.includes(s)) fail(`DEEP_PARENT lists "${s}", which is not a Deep subject in the bank`);
}
for (const [s, slug] of Object.entries(DEEP_SCIENCE)) {
  if (!sci.has(slug)) fail(`DEEP_SCIENCE["${s}"] is "${slug}", not a Science Database topic`);
  if (!subjects.includes(s)) fail(`DEEP_SCIENCE lists "${s}", which is not a Deep subject in the bank`);
}

// Checked on a day when the whole bank has run, so nothing is hidden by the calendar.
const DAY = '2099-01-01';
for (const db of ['trivia', 'science']) {
  const pool = lib.pastPool(db, DAY);
  const stats = lib.poolStats(db, DAY);
  const all = Object.values(pool).flat();
  const own = Object.values(stats).reduce((a, s) => a + s.own, 0);
  const uniq = new Set(all.map((x) => x.k)).size;
  if (own !== uniq) fail(`${db}: the total (${own}) is not the number of distinct questions (${uniq})`);
  const mix = lib.pickSet({ db, topic: 'mix', n: 120, seed: 3, today: DAY });
  if (new Set(mix.map((x) => x.k)).size !== mix.length) fail(`${db}: a mix of everything dealt a question twice`);
  for (const t of QDBS[db].topics) {
    if (pool[t.slug].some((x) => !x.deep) && lib.samples(db, t.slug, 40, DAY).some((x) => x.deep && t.slug !== 'deep-cuts')) fail(`${db}/${t.slug}: the topic page prints a Deep copy`);
    for (const lane of stats[t.slug].deep) {
      if (stats[t.slug].lanes.filter(([l]) => l === lane).length !== 1) fail(`${db}/${t.slug}: Deep subject "${lane}" collides with another lane`);
      if (pool[t.slug].some((x) => x.lane === lane && !x.deep)) fail(`${db}/${t.slug}: lane "${lane}" mixes Deep and bank questions`);
    }
  }
  for (const p of lib.lanePages(db, DAY)) if (p.topic !== 'deep-cuts' && stats[p.topic].deep.includes(p.lane)) fail(`${db}: ${p.href} is a second page for a Deep subject`);
  if (db === 'trivia') {
    const cuts = new Set(pool['deep-cuts'].map((x) => x.k));
    for (const x of all) if (x.x && !cuts.has(x.k)) fail(`trivia: ${x.k} is marked as a copy but is not under Deep Cuts`);
    for (const s of subjects) { const want = deepParent(s); if (want && !pool[want].some((x) => x.deep && (x.lane === s || x.lane === `${s}: Deep Cut`))) fail(`trivia: "${s}" maps to ${want} but no question arrived there`); }
  }
}

if (process.argv.includes('--counts')) {
  const today = lib.etToday();
  for (const db of ['trivia', 'science']) {
    const stats = lib.poolStats(db, today);
    const pool = lib.pastPool(db, today);
    console.log(`${db} as of ${today}:`);
    for (const t of QDBS[db].topics) {
      const d = pool[t.slug].filter((x) => x.deep && t.slug !== 'deep-cuts');
      if (d.length) console.log(`  ${t.label}: ${stats[t.slug].n - d.length} + ${d.length} from ${stats[t.slug].deep.length} Deep subjects = ${stats[t.slug].n}`);
    }
  }
}
console.log(fails ? `verify-deep-parents: ${fails} failure(s)` : `verify-deep-parents: OK (${subjects.length} Deep subjects, ${Object.keys(DEEP_PARENT).length} mapped, ${DEEP_NO_PARENT.length} left under Deep Cuts)`);
process.exit(fails ? 1 : 0);
