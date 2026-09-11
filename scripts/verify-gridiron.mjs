// Verifier for the Sports Ranking pages (lib/gridiron.js v2).
//
// Imports the REAL engine through alias-loader.mjs rather than restating it, so
// it cannot drift from what it certifies. Run: node scripts/verify-gridiron.mjs
// Discovered by scripts/verify-all.mjs. Exit 1 on any failure.
//
// What it proves, per sport:
//   1. every game and line resolves to a registered team (CFB: or the FCS pool)
//   2. no game or line references a team id the registry does not know AND
//      names an FBS-looking opponent twice (a duplicate id, a copy-paste slip)
//   3. the composite runs, the board is full depth, unique, and its ranks are
//      the COMPETITION RANKING (a tie group shares the lower rank, the next
//      rank skips past it) with the tied flag set on exactly the shared rows
//   4. pillar shares sum to 1 and follow the ramp for the snapshot's week
//   5. every pillar is centred (mean 0 over the board) and the analytics pillar
//      is on the market's scale
//   6. a team's composite is the weighted sum the shares say it is
//   7. the results pillar prefers the team that won every game between two
//      otherwise equal teams (a sanity check on sign conventions: a home team
//      that WINS by 20 must rate above its opponent, and the line sign is the
//      home spread, so -7 means the home team is favoured by 7)
//   8. no media or poll source is present in the snapshot at all
//   9. no source, gamesAt or linesAt in a sport's block is dated AFTER that
//      block's build date (`builtAt`, else the file-level `fetchedAt`), which is
//      what stops a negative age sailing through the 30-day gate
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

const { computeComposite, PILLARS, pillarsFor, RAMP_WEEKS, DEPTH, PARAMS } = await import('../lib/gridiron.js');
const { ridgeLS, bradleyTerry, bradleyTerryFit, devigTwoWay, mean } = await import('../lib/gridiron-math.js');
const { GRIDIRON } = await import('../lib/gridiron-data.js');
const { teamById } = await import('../lib/gridiron-teams.js');

let fails = 0;
const fail = (m) => { fails++; console.log('✗', m); };
const ok = (m) => console.log('  ok', m);
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// ---- 7 first: sign conventions on a synthetic league ----
{
  const rows = [
    { h: 0, a: 1, site: 1, y: 20 - 2.5 }, { h: 1, a: 2, site: 1, y: 3 - 2.5 }, { h: 2, a: 0, site: 1, y: -10 - 2.5 },
  ];
  const { x } = ridgeLS(rows, 3, { lam: 0.5, fitH: false });
  if (!(x[0] > x[1] && x[0] > x[2])) fail(`ridgeLS sign: team 0 should lead, got ${x.map((v) => v.toFixed(2))}`);
  else ok('ridgeLS: the team that wins big rates highest');
  const b = bradleyTerry([{ h: 0, a: 1, site: 1, y: 1 }, { h: 0, a: 1, site: 0, y: 1 }, { h: 1, a: 0, site: 1, y: 0 }], 2, { lam: 0.5, h: 0.3 });
  if (!(b[0] > b[1])) fail('bradleyTerry sign: the 3-0 team should lead');
  else ok('bradleyTerry: the team that wins rates highest');
}

// The baseball market pillar fits a PROBABILITY, so its sign convention needs
// its own check: a team the market prices as a heavy favourite in every game
// must rate above the team it is favoured over.
{
  const rows = [
    { h: 0, a: 1, site: 1, y: 0.80 }, { h: 1, a: 0, site: 1, y: 0.25 },
    { h: 1, a: 2, site: 1, y: 0.60 }, { h: 2, a: 0, site: 1, y: 0.20 },
  ];
  const m = bradleyTerryFit(rows, 3, { lam: 0, h: 0.108 });
  if (!(m[0] > m[1] && m[1] > m[2])) fail(`bradleyTerryFit sign: expected 0 > 1 > 2, got ${m.map((v) => v.toFixed(2))}`);
  else ok('bradleyTerryFit: the priced favourite rates highest');
  // devig must strip the overround and keep the favourite the favourite
  const p = devigTwoWay(-150, 130);
  if (!(p > 0.5 && p < 0.65)) fail(`devigTwoWay(-150, 130) = ${p}, expected a shade over 0.6`);
  else if (Math.abs(devigTwoWay(-110, -110) - 0.5) > 1e-9) fail('devigTwoWay(-110,-110) should be exactly 0.5');
  else ok('devigTwoWay strips the overround');
}

for (const sport of ['cfb', 'nfl', 'mlb']) {
  console.log(`== ${sport}`);
  const block = GRIDIRON[sport];
  if (!block) { fail(`${sport}: no block in the snapshot`); continue; }
  const depth = DEPTH[sport];
  const MLB = sport === 'mlb';

  // 8. no polls, no media
  for (const [id, s] of Object.entries(block.sources)) {
    if (s.tier !== 'market' && s.tier !== 'model') fail(`${sport}: source ${id} has tier "${s.tier}"; only market and model are allowed`);
  }
  ok('no media or poll source in the snapshot');

  // 9. NOTHING IN A SPORT'S BLOCK MAY BE DATED AFTER THE DATE IT WAS BUILT.
  // A source dated into the future gives `ageOf` a NEGATIVE number: the 30-day
  // gate waves it through and the page renders "-3 days old". That is exactly
  // what refreshing the NFL sources on 2026-09-11 against a file-level
  // `fetchedAt` of 2026-09-08 produced, and it is why a sport may now carry its
  // own `builtAt` (lib/gridiron.js). Set `builtAt` in the same edit that dates a
  // source forward, or this fails.
  {
    const built = block.builtAt || GRIDIRON.fetchedAt;
    const iso = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null);
    if (!iso(built)) fail(`${sport}: builtAt/fetchedAt "${built}" is not an ISO date`);
    for (const [id, s] of Object.entries(block.sources)) {
      if (iso(s.asOf) && s.asOf > built) {
        fail(`${sport}: source ${id} is dated ${s.asOf}, after the block's build date ${built}; set ${sport}.builtAt`);
      }
    }
    for (const k of ['gamesAt', 'linesAt']) {
      if (iso(block[k]) && block[k] > built) fail(`${sport}: ${k} ${block[k]} is after the build date ${built}`);
    }
    ok(`built ${built}; no source, game or line dated after it`);
  }

  // 1, 2. resolution
  const seen = new Set();
  for (const g of block.games || []) {
    if (seen.has(g.id)) fail(`${sport}: game ${g.id} listed twice`);
    seen.add(g.id);
    for (const id of [g.hid, g.aid]) {
      if (!teamById(sport, id) && (sport === 'nfl' || MLB)) fail(`${sport}: game ${g.id} has unknown team id ${id}`);
    }
    if (!(Number.isFinite(g.hs) && Number.isFinite(g.as))) fail(`${sport}: game ${g.id} has no score`);
    const hasBox = g.hy != null || g.ay != null;
    if (hasBox && !(Number.isFinite(g.hy) && Number.isFinite(g.ay) && g.hy >= 0 && g.ay >= 0)) fail(`${sport}: game ${g.id} has a half box score`);
    // MLB carries BaseRuns instead of yards. Half a pair is worse than none:
    // the Luck column would then compare a real figure to a missing one.
    const hasBR = g.hbr != null || g.abr != null;
    if (hasBR && !(Number.isFinite(g.hbr) && Number.isFinite(g.abr) && g.hbr >= 0 && g.abr >= 0)) fail(`${sport}: game ${g.id} has a half BaseRuns pair`);
    if (MLB && !hasBR) fail(`mlb: game ${g.id} has no BaseRuns figures`);
    if (MLB && (g.hs < 0 || g.as < 0 || g.hs > 40 || g.as > 40)) fail(`mlb: game ${g.id} has an implausible score ${g.hs}-${g.as}`);
    if (g.n !== 0 && g.n !== 1) fail(`${sport}: game ${g.id} neutral flag must be 0 or 1`);
  }
  const lseen = new Set();
  for (const l of block.lines || []) {
    if (lseen.has(l.id)) fail(`${sport}: line ${l.id} listed twice`);
    lseen.add(l.id);
    if (MLB) {
      // Baseball stores the two moneylines, not a spread. American odds are
      // never between -100 and +100 exclusive, and a pair that both sit on the
      // same side of even is a sign the two teams were swapped somewhere.
      for (const v of [l.hml, l.aml]) {
        if (!Number.isFinite(v) || (v > -100 && v < 100)) fail(`mlb: line ${l.id} has an impossible moneyline ${v}`);
      }
      if (l.sp != null) fail(`mlb: line ${l.id} carries a spread; baseball's runline is not a spread and must not be stored`);
      const p = devigTwoWay(l.hml, l.aml);
      if (!(p > 0.02 && p < 0.98)) fail(`mlb: line ${l.id} devigs to ${p}, outside anything a baseball game is priced at`);
    } else if (!Number.isFinite(l.sp)) fail(`${sport}: line ${l.id} has no spread`);
    if ((sport === 'nfl' || MLB) && (!teamById(sport, l.hid) || !teamById(sport, l.aid))) fail(`${sport}: line ${l.id} has an unknown team`);
  }
  // CFB: a game or line where NEITHER side is registered is a bug (two FCS teams
  // cannot appear in an FBS scoreboard pull).
  if (sport === 'cfb') {
    for (const g of [...(block.games || []), ...(block.lines || [])]) {
      if (!teamById(sport, g.hid) && !teamById(sport, g.aid)) fail(`cfb: ${g.id} has no registered team on either side`);
    }
  }
  const boxed = (block.games || []).filter((g) => g.hy != null).length;
  ok(`${(block.games || []).length} games (${boxed} with box scores) and ${(block.lines || []).length} lines resolve`);

  // 3. the board
  const r = computeComposite(block, sport);
  if (r.problems.length) r.problems.forEach((p) => fail(`${sport}: ${p}`));
  if (r.ranked.length !== depth) fail(`${sport}: board has ${r.ranked.length} rows, expected ${depth}`);
  // Ranks are 1..depth EXCEPT where the composite ties, and a tie shares the
  // rank of the first row in its group (lib/gridiron.js collapses them and
  // marks them `tied`). This check read `rank === i + 1` until 2026-09-04,
  // which went red the moment the CFB board went full-FBS and produced real
  // ties among the teams that have not played yet. Allow the shared rank, and
  // still require it to be the group's own first index.
  const ranks = r.ranked.map((x) => x.rank);
  // 1..N stopped being the rule on 2026-09-04, when teams the composite cannot
  // separate started SHARING a rank and being marked T7 rather than being handed
  // an alphabetical order the data never supported. The rule is now COMPETITION
  // RANKING: a row's rank is one more than the number of rows strictly ahead of
  // it, so a tie group shares the lower rank and the next rank skips past it.
  // That is stricter than the check it replaces rather than looser, because it
  // also pins where a group has to restart; the old one simply went red on every
  // tied board and would have been ignored inside a week.
  let groupStart = 0;
  r.ranked.forEach((x, i) => {
    if (i > 0 && x.rank !== ranks[i - 1]) groupStart = i;
    if (x.rank !== groupStart + 1) {
      fail(`${sport}: row ${i + 1} ranks ${x.rank}, competition ranking says ${groupStart + 1}`);
    }
  });
  // And the flag cannot lie in either direction: a row marked tied must share
  // its rank with a neighbour, and a row that shares one must be marked.
  const sharesRank = (i) => (i > 0 && ranks[i - 1] === ranks[i]) || (i + 1 < ranks.length && ranks[i + 1] === ranks[i]);
  const liar = r.ranked.findIndex((x, i) => !!x.tied !== sharesRank(i));
  if (liar !== -1) {
    fail(`${sport}: row ${liar + 1} (${r.ranked[liar].team}) is marked tied=${!!r.ranked[liar].tied} and shares its rank with ${sharesRank(liar) ? 'somebody' : 'nobody'}`);
  }
  const tiedRows = r.ranked.filter((x) => x.tied).length;
  if (new Set(r.ranked.map((x) => x.team)).size !== r.ranked.length) fail(`${sport}: duplicate team on the board`);
  for (let i = 1; i < r.ranked.length; i++) {
    if (r.ranked[i].score > r.ranked[i - 1].score + 1e-9) fail(`${sport}: board not sorted at ${i}`);
  }
  ok(`board is ${depth} deep, sorted, unique${tiedRows ? `, ${tiedRows} rows in ties` : ''}`);

  // 4. shares and ramp
  const shares = Object.values(r.tierShare);
  if (!near(shares.reduce((a, b) => a + b, 0), 1)) fail(`${sport}: pillar shares sum to ${shares.reduce((a, b) => a + b, 0)}`);
  const weeksPlayed = Math.max(0, (block.week || 1) - 1);
  const expectR = (block.games || []).length ? pillarsFor(sport).results * Math.min(1, weeksPlayed / RAMP_WEEKS[sport]) : 0;
  if (!near(r.tierShare.results || 0, expectR)) fail(`${sport}: results share ${r.tierShare.results} != ramp ${expectR}`);
  if ((r.tierShare.market || 0) < (r.tierShare.model || 0) - 1e-9) fail(`${sport}: models outweigh markets`);
  ok(`shares ${JSON.stringify(Object.fromEntries(Object.entries(r.tierShare).map(([k, v]) => [k, +v.toFixed(3)])))}`);

  // 5. centring and scale
  const all = r.all;
  const mO = mean(all.map((x) => x.O));
  if (!near(mO, 0, 1e-6)) fail(`${sport}: odds pillar not centred (${mO})`);
  if (all[0].A != null) {
    const mA = mean(all.map((x) => x.A));
    if (!near(mA, 0, 1e-6)) fail(`${sport}: analytics pillar not centred (${mA})`);
    const sdv = (v) => Math.sqrt(mean(v.map((x) => x * x)));
    const sO = sdv(all.map((x) => x.O)), sA = sdv(all.map((x) => x.A));
    if (!near(sO, sA, 1e-6)) fail(`${sport}: analytics scale ${sA} != market scale ${sO}`);
  }
  if (all[0].R != null && !near(mean(all.map((x) => x.R)), 0, 1e-6)) fail(`${sport}: results pillar not centred`);
  ok('pillars centred, analytics on the market scale');

  // 6. the composite is the weighted sum
  for (const x of r.ranked.slice(0, 10)) {
    const s = (r.tierShare.results || 0) * (x.R || 0) + (r.tierShare.market || 0) * x.O + (r.tierShare.model || 0) * (x.A || 0);
    if (!near(s, x.score, 1e-6)) fail(`${sport}: ${x.team} composite ${x.score} != weighted sum ${s}`);
  }
  ok('composite equals the weighted sum of the pillars');

  // columns: every column id the rows carry exists, and vice versa
  const colIds = new Set(r.columns.map((c) => c.id));
  for (const x of r.ranked) for (const id of Object.keys(x.shown)) if (!colIds.has(id)) fail(`${sport}: row carries unknown column ${id}`);
  ok(`${r.columns.length} columns, ${r.excluded.length} excluded by age`);

  console.log('   top 5:', r.ranked.slice(0, 5).map((x) => `${x.team} ${x.score > 0 ? '+' : ''}${x.score.toFixed(1)}`).join(' | '));
}

console.log(fails ? `\n${fails} FAILURE(S)` : '\nall gridiron checks pass');
process.exit(fails ? 1 : 0);
