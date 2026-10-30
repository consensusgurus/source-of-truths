// scripts/gen-quiz-mix.mjs: builds app/mixtape/puzzles.js and
// app/mishmash/puzzles.js together, around Potluck's fixed bank, so the three
// quiz-mix dailies never serve the same quiz on the same day. The rules are in
// scripts/quiz-mix-rules.mjs; the checkers are verify-mixtape / verify-mishmash.
//
//   node scripts/gen-quiz-mix.mjs [--from 2026-10-30] [--to 2027-01-07] [--seed 11]
//
// EXTENDING: the banks are dated and frozen once live. To add days, re-run with
// --from set to the day AFTER the current last day; the script keeps every
// existing day before --from as is and appends. (Potluck's own bank ends
// 2027-01-07 and its generator does not know about these two: when Potluck is
// extended it must recycle visual quizzes too, and must respect rule 1 against
// these banks. Extend all three together.)
import fs from 'fs';
import path from 'path';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FROM = arg('--from', '2026-10-30');
const TO = arg('--to', '2027-01-07');
const SEED = Number(arg('--seed', '11'));

const { QUIZZES } = await import(path.join(root, 'lib/quizzes.js'));
const { LISTS } = await import(path.join(root, 'lib/data.js'));
const { quizDept } = await import(path.join(root, 'lib/quiz-departments.js'));
const { POTLUCK_FAMILY, potluckEligible } = await import(path.join(root, 'lib/potluck.js'));
const { PUZZLES: POT } = await import(path.join(root, 'app/potluck/puzzles.js'));
const R = await import('./quiz-mix-rules.mjs');

async function loadBank(game) {
  const f = path.join(root, `app/${game}/puzzles.js`);
  if (!fs.existsSync(f)) return [];
  return (await import(f + '?t=' + Date.now())).PUZZLES || [];
}
const keep = {};
for (const g of R.MIX_GAMES) keep[g] = (await loadBank(g)).filter((p) => p.live < FROM);

const byId = new Map(QUIZZES.map((q) => [q.id, q]));
const listMode = new Map(LISTS.map((l) => [l.id, l.mode || 'consensus']));
const fam = (q) => POTLUCK_FAMILY[q.format || 'default'];
const pool = QUIZZES.filter((q) => potluckEligible(q, listMode, Date.parse(FROM + 'T04:00:00Z')));
const byFam = { typed: [], match: [], visual: [] };
for (const q of pool) byFam[fam(q)].push(q);
let s = SEED >>> 0;
const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
for (const f of Object.keys(byFam)) { const a = byFam[f]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

// Every scheduled use of every quiz: id -> [dayNumber...], and date -> Set(ids).
const uses = new Map();
const onDay = new Map();
function addUse(id, iso) {
  if (!uses.has(id)) uses.set(id, []);
  uses.get(id).push(R.dayNum(iso));
  if (!onDay.has(iso)) onDay.set(iso, new Set());
  onDay.get(iso).add(id);
}
for (const p of POT) for (const id of p.quizzes) addUse(id, p.live);
for (const g of R.MIX_GAMES) for (const p of keep[g]) for (const id of p.quizzes) addUse(id, p.live);
const gapTo = (id, iso) => { const n = R.dayNum(iso); const u = uses.get(id) || []; return u.length ? Math.min(...u.map((x) => Math.abs(x - n))) : Infinity; };

function addDays(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function label(iso) { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; }

const out = {}; const prevDepts = {}; const lastMap = {};
for (const g of R.MIX_GAMES) {
  out[g] = [...keep[g]];
  const last = keep[g][keep[g].length - 1];
  prevDepts[g] = last ? new Set(last.quizzes.map((id) => quizDept(byId.get(id)))) : new Set();
  const lm = [...keep[g]].reverse().find((p) => p.quizzes.some((id) => (byId.get(id) || {}).format === 'map'));
  lastMap[g] = lm ? R.dayNum(lm.live) : R.dayNum(FROM) - R.MAP_NUDGE + (g === 'mixtape' ? 1 : 4);
}

for (let live = FROM, n = 0; live <= TO; live = addDays(live, 1), n++) {
  R.MIX_GAMES.forEach((g, gi) => {
    const today = onDay.get(live) || new Set();
    const depts = new Set();
    const okDept = (q, strict) => !depts.has(quizDept(q)) && (!strict || !prevDepts[g].has(quizDept(q)));
    // Visual first: the scarce, recycled family.
    const wantMap = R.dayNum(live) - lastMap[g] >= R.MAP_NUDGE;
    const vis = byFam.visual.filter((q) => !today.has(q.id) && gapTo(q.id, live) >= R.MIN_GAP);
    const rank = (a) => [...a].sort((x, y) => gapTo(y.id, live) - gapTo(x.id, live));
    let pickV = null;
    if (wantMap) pickV = rank(vis.filter((q) => q.format === 'map' && okDept(q, false)))[0] || null;
    if (!pickV) pickV = rank(vis.filter((q) => q.format !== 'map' && okDept(q, true)))[0] || rank(vis.filter((q) => okDept(q, false)))[0];
    if (!pickV) { console.error(`no visual quiz for ${g} on ${live} at gap ${R.MIN_GAP}`); process.exit(1); }
    const picks = [pickV]; depts.add(quizDept(pickV));
    for (const f of ['match', 'typed']) {
      const fresh = (q) => !uses.has(q.id);
      const c = byFam[f].find((q) => fresh(q) && okDept(q, true)) || byFam[f].find((q) => fresh(q) && okDept(q, false));
      if (!c) { console.error(`ran out of fresh ${f} quizzes for ${g} on ${live}`); process.exit(1); }
      picks.push(c); depts.add(quizDept(c));
    }
    for (const q of picks) addUse(q.id, live);
    if (pickV.format === 'map') lastMap[g] = R.dayNum(live);
    prevDepts[g] = depts;
    const num = out[g].length + 1;
    const rot = (num + gi + 1) % 3;
    const ids = picks.map((q) => q.id);
    out[g].push({ num, quizId: R.mixQuizId(g, live), live, dateLabel: label(live), game: g, quizzes: [...ids.slice(rot), ...ids.slice(0, rot)] });
  });
}

for (const g of R.MIX_GAMES) {
  const header = `// ${R.NAMES[g]} bank: three catalog quizzes a day, Potluck's format. GENERATED by
// scripts/gen-quiz-mix.mjs (to ${TO}, seed ${SEED}) together with the other quiz-mix bank, so
// Potluck, Mixtape and Mishmash never serve the same quiz on the same day.
// Checked by scripts/verify-${g}.mjs. Never hand-edit a day that has gone live.
`;
  fs.writeFileSync(path.join(root, `app/${g}/puzzles.js`), header + 'export const PUZZLES = [\n' + out[g].map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n];\n');
  const maps = out[g].filter((p) => p.quizzes.some((id) => byId.get(id).format === 'map')).length;
  console.log(`gen-quiz-mix: ${g} ${out[g].length} days ${out[g][0].live} to ${out[g].at(-1).live}, ${maps} map days`);
}
