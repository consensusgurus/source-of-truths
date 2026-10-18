// verify-skills: every live daily carries a skill, and every entry-page tile
// can start a run (owner, 2026-10-16). See lib/daily-skills.js.
//
// Checks:
//  1. every key in SKILL_TAGS is a registered daily, with 1 to 4 known skills,
//     none repeated (a game sits in every skill it lists, owner 2026-10-18);
//  2. every daily live today (and on the last day of the year) has a tag;
//  3. every skill has at least three live games listing it, so a tile always
//     starts a run of two or more even after a game is played;
//  4. every skill's pane is a real category (the tile opens it);
//  5. skillRun (unused by the door since 2026-10-16) is deterministic, skips played games, never exceeds the cap, and
//     only deals live games of its own skill.
//
// Calls the map makes on purpose (owner-approved 2026-10-16): Logic splits into
// Deduction (case files, grid rules) and Spatial reasoning (Parker family,
// Snug, Jig, Plot, Etch, Hedge, Paths); Cards dissolves (Shoe -> Memory,
// Hold -> Estimation, the rest Planning); Trivia and Geography lead with Memory;
// the Price Check five, Ping, Bracket and Slot are Estimation; Series is
// Deduction; Sums (kakuro) is Grid logic; Scour is Focus and speed.
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { DAILY_GAME_MAP, DAILY_GAMES, liveDailyKeys } = await import('../lib/daily-games.js');
const { SKILLS, SKILL_MAP, SKILL_TAGS, skillPool, skillRun, SKILL_RUN_MAX } = await import('../lib/daily-skills.js');

const fails = [];
const fail = (m) => fails.push(m);

for (const [k, tags] of Object.entries(SKILL_TAGS)) {
  if (!DAILY_GAME_MAP[k]) fail(`${k}: tagged but not a registered daily`);
  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 4) fail(`${k}: needs one to four skills`);
  if (tags && new Set(tags).size !== tags.length) fail(`${k}: a skill is listed twice`);
  for (const t of tags || []) if (!SKILL_MAP[t]) fail(`${k}: unknown skill ${t}`);
}

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
for (const day of [today, '2026-12-31']) {
  for (const k of liveDailyKeys(day)) if (!SKILL_TAGS[k]) fail(`${k}: live on ${day} with no skill`);
  for (const s of SKILLS) {
    const n = skillPool(s.id, day).length;
    if (n < 3) fail(`${s.name}: only ${n} live games on ${day} (need 3)`);
  }
}

for (const s of SKILLS) {
  const a = skillRun(s.id, today);
  const b = skillRun(s.id, today);
  if (a.join() !== b.join()) fail(`${s.name}: run not deterministic`);
  if (a.length > SKILL_RUN_MAX) fail(`${s.name}: run over the cap`);
  const live = new Set(liveDailyKeys(today));
  for (const k of a) {
    if (!live.has(k)) fail(`${s.name}: run deals ${k}, not live`);
    if (!SKILL_TAGS[k].includes(s.id)) fail(`${s.name}: run deals ${k}, which does not list it`);
  }
  if (a.length) {
    const played = new Set([a[0]]);
    const c = skillRun(s.id, today, (k) => played.has(k));
    if (c.includes(a[0])) fail(`${s.name}: run deals a played game`);
  }
}

const cats = new Set(DAILY_GAMES.map((g) => g.cat));
for (const s of SKILLS) if (!cats.has(s.pane)) fail(`${s.name}: pane ${s.pane} is not a category`);

const counts = SKILLS.map((s) => `${s.name} ${skillPool(s.id, today).length}`).join(', ');
if (fails.length) {
  console.log(`verify-skills: ${fails.length} failure(s)`);
  for (const f of fails) console.log('  FAIL ' + f);
  process.exit(1);
}
console.log(`verify-skills: ok (${counts})`);
