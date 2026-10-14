// scripts/trivia-lane-check.mjs - authoring self-check for one gauntlet lane file.
//
//   node scripts/trivia-lane-check.mjs <lane-file.mjs> [--days N] [--lane "Name"]
//
// A lane file exports LANE_DAYS: an array of days, each day five entries in
// tier order 1..5, shaped { c, t, q, a, d: [w1, w2, w3] }. This reports, as
// FAIL lines, everything a verifier will refuse later, and as WARN lines the
// things a person has to judge (the same fact asked twice, a fact already in
// another bank). Written for the Sci / Art / History authoring pass,
// 2026-10-14, and usable on any lane file of the same shape.
import path from 'path';
import url from 'url';
import { scanUS } from './us-spellings.mjs';

const argv = process.argv.slice(2);
const file = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const daysIdx = argv.indexOf('--days');
const WANT_DAYS = daysIdx >= 0 ? Number(argv[daysIdx + 1]) : null;
const laneIdx = argv.indexOf('--lane');
const WANT_LANE = laneIdx >= 0 ? argv[laneIdx + 1] : null;
if (!file) { console.error('usage: node scripts/trivia-lane-check.mjs <lane-file.mjs> [--days N] [--lane "Name"]'); process.exit(2); }

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const mod = await import(url.pathToFileURL(path.resolve(file)).href + `?t=${Date.now()}`);
const DAYS = mod.LANE_DAYS;

const fails = [];
const warns = [];
const STOP = new Set('the a an of in on at to for and or by with from which what who whom whose when where how is was were are be been being this that these those its it his her their they he she as into than then also famous first known called named name most best only one two three four five many much more under over after before during about between century year years world became become did does do have has had used use made make city country state american british french german great new old'.split(' '));
const norm = (s) => ` ${String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
const words = (s) => norm(s).trim().split(' ').filter((w) => w.length >= 4 && !STOP.has(w));
const stripThe = (s) => norm(s).trim().replace(/^(the|a|an) /, '');

if (!Array.isArray(DAYS)) { console.error('FAIL no LANE_DAYS array exported'); process.exit(1); }
if (WANT_DAYS != null && DAYS.length !== WANT_DAYS) fails.push(`has ${DAYS.length} days, wants ${WANT_DAYS}`);

const all = [];
DAYS.forEach((day, di) => {
  if (!Array.isArray(day) || day.length !== 5) { fails.push(`day ${di + 1}: needs exactly 5 entries`); return; }
  day.forEach((e, ti) => {
    const tag = `day ${di + 1} tier ${ti + 1}`;
    if (!e || typeof e !== 'object') { fails.push(`${tag}: not an object`); return; }
    if (e.t !== ti + 1) fails.push(`${tag}: t is ${e.t}, want ${ti + 1}`);
    if (WANT_LANE && e.c !== WANT_LANE) fails.push(`${tag}: c is "${e.c}", want "${WANT_LANE}"`);
    if (!e.q || !String(e.q).trim().endsWith('?')) fails.push(`${tag}: question must end with "?"`);
    if (!e.a) fails.push(`${tag}: no answer`);
    if (!Array.isArray(e.d) || e.d.length !== 3) { fails.push(`${tag}: needs exactly 3 wrong answers in d`); return; }
    const ch = [e.a, ...e.d];
    if (new Set(ch.map((x) => norm(x))).size !== 4) fails.push(`${tag}: the four choices are not all distinct`);
    for (const s of [e.q, ...ch]) {
      if (/[—–]/.test(String(s))) fails.push(`${tag}: em or en dash in "${s}"`);
      for (const hit of scanUS(String(s))) fails.push(`${tag}: British spelling "${hit.found}" (US: ${hit.us})`);
    }
    const qn = norm(e.q);
    const an = stripThe(e.a);
    if (an && qn.includes(` ${an} `)) fails.push(`${tag}: question contains its own answer "${e.a}"`);
    const aw = words(e.a);
    if (aw.length && aw.every((w) => qn.includes(` ${w} `))) fails.push(`${tag}: question contains every distinctive word of its answer "${e.a}"`);
    for (const c of ch) if (qn.includes(` ${stripThe(c)} `) && stripThe(c).length > 3) fails.push(`${tag}: choice "${c}" is named in the question itself`);
    for (const w of words(e.q)) {
      const inA = norm(e.a).includes(` ${w} `);
      const inD = e.d.some((x) => norm(x).includes(` ${w} `));
      if (inA && !inD && w.length >= 5) warns.push(`${tag}: stem word "${w}" appears only in the correct choice`);
    }
    all.push({ tag, ...e });
  });
});

const byAns = new Map();
for (const e of all) { const k = stripThe(e.a); if (!byAns.has(k)) byAns.set(k, []); byAns.get(k).push(e.tag); }
for (const [k, tags] of byAns) if (tags.length > 3) fails.push(`answer "${k}" is correct ${tags.length} times (max 3): ${tags.join(', ')}`);

for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  const x = all[i], y = all[j];
  const sameAns = stripThe(x.a) === stripThe(y.a);
  const shared = words(x.q).filter((w) => words(y.q).includes(w));
  if (sameAns && shared.length) warns.push(`possible repeat: ${x.tag} and ${y.tag} share answer "${x.a}" and word(s) ${shared.join(', ')}`);
  const xa = stripThe(x.a), ya = stripThe(y.a);
  if (xa.length > 4 && norm(y.q).includes(` ${xa} `) && shared.length) warns.push(`possible mirror: ${y.tag} names "${x.a}", the answer to ${x.tag}`);
  if (ya.length > 4 && norm(x.q).includes(` ${ya} `) && shared.length) warns.push(`possible mirror: ${x.tag} names "${y.a}", the answer to ${y.tag}`);
}

const BANKS = ['streak', 'deep', 'atlas', 'sport', 'biz', 'script', 'quotes', 'sci', 'art', 'history'];
const other = [];
for (const g of BANKS) {
  try {
    const m = await import(url.pathToFileURL(path.join(ROOT, `app/${g}/questions.js`)).href);
    for (const q of m.QUESTIONS || []) other.push({ g, id: q.id, q: q.q, a: q.choices[q.correct] });
  } catch (_) { /* bank not built yet */ }
}
const otherByAns = new Map();
for (const o of other) { const k = stripThe(o.a); if (!otherByAns.has(k)) otherByAns.set(k, []); otherByAns.get(k).push(o); }
for (const e of all) {
  for (const o of otherByAns.get(stripThe(e.a)) || []) {
    const shared = words(e.q).filter((w) => words(o.q).includes(w));
    if (shared.length >= 1) warns.push(`already in ${o.g} ${o.id}: ${e.tag} "${e.q}" / "${o.q}" (answer "${e.a}")`);
  }
}

for (const f of fails) console.log(`FAIL ${f}`);
for (const w of warns) console.log(`WARN ${w}`);
console.log(`${path.basename(file)}: ${DAYS.length} days, ${all.length} questions, ${fails.length} fail, ${warns.length} warn`);
process.exit(fails.length ? 1 : 0);
