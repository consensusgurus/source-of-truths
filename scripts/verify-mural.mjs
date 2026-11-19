// verify-mural: Mural and MuralToo, the 4,000 piece jigsaws the site builds
// together. There is no authored board to check (the server picks and grades
// each photo when it opens), so this checks everything a wrong edit could
// silently break around it:
//  1. the day lists: one row per Eastern day, in order, no gaps, quizId and
//     dateLabel read off `live`, and each starting on its kind's first day
//  2. the schedule: Mural opens at noon Eastern and MuralToo at midnight, each
//     closes when the next opens, across both daylight-saving changes
//  3. nothing of a kind is served before its first board, and LAUNCH_DAILY
//     keeps it off the rosters until that day
//  4. the Featured rule: Mural until MuralToo exists, then whichever closes
//     soonest (Mural before noon, MuralToo from noon)
//  5. the piece values the rules sheet promises, and that the SQL in migration
//     69 carries the same constants
//  6. the registry rows: Visual, a points tally, complete on any score
//  7. the name is MuralToo, never "Mural Too", in every shipped file
// Discovered by scripts/verify-all.mjs.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const S = await import('../lib/mural-shared.js');
const { DAILY_GAME_MAP, LAUNCH_DAILY, SOLVES_ON_SCORE, dailyUnit, liveDailyKeys } = await import('../lib/daily-games.js');
const root = new URL('../', import.meta.url).pathname;
const fails = [];
const fail = (m) => fails.push(m);
const eq = (got, want, what) => { if (got !== want) fail(`${what}: got ${got}, want ${want}`); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const et = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms)).replace(',', '');

// 1. the day lists
for (const k of ['mural', 'muraltoo']) {
  const { PUZZLES } = await import(`../app/${k}/puzzles.js`);
  if (!PUZZLES.length) { fail(`${k}: empty day list`); continue; }
  eq(PUZZLES[0].live, S.MURAL_KINDS[k].first, `${k}: first day`);
  eq(LAUNCH_DAILY[k], S.MURAL_KINDS[k].first, `${k}: LAUNCH_DAILY`);
  let prev = null;
  PUZZLES.forEach((p, i) => {
    const d = new Date(p.live + 'T00:00:00Z');
    eq(p.num, i + 1, `${k} ${p.live}: num`);
    eq(p.quizId, `${k}-${d.getUTCMonth() + 1}-${d.getUTCDate()}-${String(d.getUTCFullYear()).slice(2)}`, `${k} ${p.live}: quizId`);
    eq(p.dateLabel, `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`, `${k} ${p.live}: dateLabel`);
    if (prev && d.getTime() - prev !== 86400000) fail(`${k} ${p.live}: not the day after the row before`);
    prev = d.getTime();
  });
  const left = Math.round((prev - Date.now()) / 86400000);
  if (left < 30) fail(`${k}: only ${left} days left in the day list; run scripts/gen-mural-bank.mjs --until <date>`);
}

// 2. the schedule
for (const day of ['2026-11-19', '2027-03-13', '2027-03-14', '2027-07-04', '2027-11-06', '2027-11-07']) {
  const m = S.muralWindow(`mural-${day}`), t = S.muralWindow(`muraltoo-${day}`);
  eq(et(m.opens), `${day} 12:00`, `mural-${day} opens`);
  eq(et(t.opens), `${day} 00:00`, `muraltoo-${day} opens`);
  eq(et(m.closes).slice(11), '12:00', `mural-${day} closes at`);
  eq(et(t.closes).slice(11), '00:00', `muraltoo-${day} closes at`);
  eq(S.currentMuralId('mural', m.opens), `mural-${day}`, `current at mural-${day} open`);
  eq(S.currentMuralId('mural', m.closes - 1), `mural-${day}`, `current a millisecond before mural-${day} closes`);
  eq(S.currentMuralId('muraltoo', t.opens), `muraltoo-${day}`, `current at muraltoo-${day} open`);
  eq(S.currentMuralId('muraltoo', t.closes - 1), `muraltoo-${day}`, `current a millisecond before muraltoo-${day} closes`);
  const hrs = (w) => (w.closes - w.opens) / 3600000;
  if (![23, 24, 25].includes(hrs(m)) || ![23, 24, 25].includes(hrs(t))) fail(`${day}: a window is ${hrs(m)} / ${hrs(t)} hours`);
}

// 3. nothing before the first board
const tooOpens = S.muralFirstOpens('muraltoo');
eq(et(tooOpens), '2026-11-20 00:00', 'MuralToo first opens');
eq(S.muralLaunched('muraltoo', tooOpens - 1), false, 'MuralToo launched a millisecond early');
eq(S.muralLaunched('muraltoo', tooOpens), true, 'MuralToo launched at its opening');
eq(S.muralIdAllowed('muraltoo-2026-11-19'), false, 'muraltoo-2026-11-19 allowed');
eq(S.muralIdAllowed('muraltoo-2026-11-20'), true, 'muraltoo-2026-11-20 allowed');
eq(S.muralIdAllowed('mural-2026-11-18'), false, 'mural-2026-11-18 allowed');
eq(S.muralIdAllowed('mural-2026-11-19'), true, 'mural-2026-11-19 allowed');
if (liveDailyKeys('2026-11-19').includes('muraltoo')) fail('MuralToo is on the roster on 2026-11-19');
if (!liveDailyKeys('2026-11-19').includes('mural')) fail('Mural is not on the roster on 2026-11-19');
if (!liveDailyKeys('2026-11-20').includes('muraltoo')) fail('MuralToo is not on the roster on 2026-11-20');

// 4. Featured: the one closing soonest
const H = 3600000;
eq(S.muralFeaturedKey(tooOpens - 11 * H), 'mural', 'featured the afternoon before MuralToo exists');
eq(S.muralFeaturedKey(tooOpens + 1), 'mural', 'featured just after midnight');
eq(S.muralFeaturedKey(tooOpens + 12 * H - 1), 'mural', 'featured a millisecond before noon');
eq(S.muralFeaturedKey(tooOpens + 12 * H), 'muraltoo', 'featured at noon');
eq(S.muralFeaturedKey(tooOpens + 24 * H - 1), 'muraltoo', 'featured a millisecond before midnight');
eq(S.muralFeaturedKey(tooOpens + 24 * H), 'mural', 'featured at the next midnight');
for (const t of [tooOpens + 1, tooOpens + 5 * H, tooOpens + 12 * H, tooOpens + 20 * H]) {
  const f = S.muralFeaturedKey(t), o = f === 'mural' ? 'muraltoo' : 'mural';
  const cf = S.muralWindow(S.currentMuralId(f, t)).closes, co = S.muralWindow(S.currentMuralId(o, t)).closes;
  if (!(cf < co)) fail(`featured at ${et(t)} is ${f}, which does not close first`);
}

// 5. piece values
const V = (grade, hours, neighbours, first) => S.pieceValue({ grade, hours, neighbours, first });
const val = (x) => (x && typeof x === 'object' ? x.v : x);
eq(val(V(1, 0, 0, true)), 2, 'corner, first, hour 0');
eq(val(V(3, 15, 0, true)), 11, 'detailed, first, hour 15');
eq(val(V(3, 15, 0, false)), 3, 'detailed, already claimed');
eq(val(V(12, 15, 0, true)), 42, 'large flat block, first, hour 15');
eq(val(V(12, 40, 0, true)), 48, 'large flat block, first, past the cap');
eq(val(V(3, 0, 4, true)), 1, 'detailed, four neighbours, first');
eq(val(V(2, 0, 4, false)), 1, 'edge, four neighbours: the floor of 1');
const sql = readFileSync(join(root, 'supabase/migrations/69_mural.sql'), 'utf8');
for (const frag of ['greatest(0.2, 1 - 0.2 * n)', '(1 + least(1, 0.05 * hrs)) * 2', 'greatest(1, round(val))']) {
  if (!sql.includes(frag)) fail(`migration 69 no longer carries "${frag}"; pieceValue() and the SQL must agree`);
}

// 6. the registry rows
for (const k of ['mural', 'muraltoo']) {
  const g = DAILY_GAME_MAP[k];
  if (!g) { fail(`${k}: not in the registry`); continue; }
  eq(g.cat, 'Visual', `${k}: category`);
  eq(dailyUnit(k), 'points', `${k}: unit`);
  if (!SOLVES_ON_SCORE.has(k)) fail(`${k}: must complete on any score (solvesOnScore)`);
}
eq(DAILY_GAME_MAP.muraltoo && DAILY_GAME_MAP.muraltoo.name, 'MuralToo', 'MuralToo name');

// 7. MuralToo has no space, anywhere it ships
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f.startsWith('.')) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs|md|sql)$/.test(f) && statSync(p).size < 400000) out.push(p);
  }
  return out;
};
for (const p of [...walk(join(root, 'app/mural')), ...walk(join(root, 'app/muraltoo')), ...walk(join(root, 'app/api/mural')), ...walk(join(root, 'lib')), ...walk(join(root, 'docs/claude'))]) {
  if (p.endsWith('verify-mural.mjs')) continue;
  const m = /Mural[ -]Too\b|Mural too\b/.exec(readFileSync(p, 'utf8'));
  if (m) fail(`${p.replace(root, '')}: "${m[0]}" (the name is MuralToo)`);
}

if (fails.length) {
  console.log(`verify-mural: ${fails.length} failure(s)`);
  for (const m of fails) console.log('  FAIL ' + m);
  process.exit(1);
}
console.log('verify-mural: ok (day lists, schedule, launch floor, Featured rule, piece values, registry, name)');
