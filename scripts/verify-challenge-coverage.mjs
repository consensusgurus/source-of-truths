// EVERY CONCLUSION CARRIES A CHALLENGE DOOR (owner, 2026-10-15).
//
// The door kept going missing because it was opt-in: RunClient showed it only
// when circuitId === 'gauntlet', and lib/challenge.js listed three runs by
// hand. Every run built after those (Math Gauntlet, Trivia Encore, Judged,
// Dojo, Read the Room, Valet) shipped without it and nothing failed. This
// checker is what fails now.
//
//   1. Every runnable circuit has a RUN_CHALLENGES entry (derived, so a new run
//      passes by existing), with a name, an href and a unit.
//   2. A link for every run round-trips, at zero and above, so the landing and
//      the card always have something to print.
//   3. Every file that ends a run renders <RunChallengeButton>, and none of
//      them gates it on one circuit's id.
//   4. The button never hides itself on a zero, and the daily end card offers
//      it on the retry ending.
//
// Run: node scripts/verify-challenge-coverage.mjs
import { register } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
register('./alias-loader.mjs', import.meta.url);

const { CIRCUITS, isMarquee } = await import('../lib/circuits.js');
const { RAMP_ORDER } = await import('../lib/category-ramp.js');
const { RUN_CHALLENGES, encodeChallenge, decodeChallenge, challengeFig } = await import('../lib/challenge.js');

const fails = [];
const fail = (m) => fails.push(m);

// 1 + 2
const runs = CIRCUITS.filter((c) => c && c.run && !isMarquee(c.id));
for (const c of runs) {
  const e = RUN_CHALLENGES[c.id];
  if (!e) { fail(`run "${c.id}" has no RUN_CHALLENGES entry, so it cannot be challenged`); continue; }
  if (!e.name || !e.href || !e.unit) fail(`run "${c.id}" entry is missing name, href or unit`);
  if (!RAMP_ORDER.includes(e.cat)) fail(`run "${c.id}" has category "${e.cat}", which the card has no colour for`);
  for (const s of [0, 7]) {
    const raw = encodeChallenge({ name: 'Tester', t: s ? 95 : 0, s, o: e.unit === 'right' ? 0 : 50, n: 1015, won: false, d: '20261015', x: 'status' });
    const back = decodeChallenge(raw);
    if (!back) { fail(`run "${c.id}": a score of ${s} makes a link that does not decode`); continue; }
    if (!challengeFig(back, c.id)) fail(`run "${c.id}": a score of ${s} has no figure to print`);
  }
}
// A daily miss with nothing to beat must still decode (it used not to).
if (!decodeChallenge(encodeChallenge({ name: 'T', t: null, s: 0, o: 10, n: 5, won: false, d: '20261015' }))) {
  fail('a 0-score daily miss makes a link that does not decode');
}

// 3: every file that ends a run renders the button, ungated by one id.
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const jsx = walk('app').filter((p) => /\.jsx$/.test(p));
const enders = jsx.filter((p) => {
  const s = readFileSync(p, 'utf8');
  // A run ending: it reads the circuit board on finish, or it is a known run client.
  return /useCircuitBoard\(/.test(s) && /phase === 'done'/.test(s);
});
const KNOWN = ['app/circuits/[id]/run/RunClient.jsx', 'app/circuits/ValetRunClient.jsx', 'app/dojo/DojoClient.jsx',
  'app/judged/JudgedClient.jsx', 'app/room/RoomClient.jsx', 'app/pricecheck/PriceCheckClient.jsx', 'app/passport/PassportRunClient.jsx'];
for (const p of new Set([...KNOWN, ...enders])) {
  let s = '';
  try { s = readFileSync(p, 'utf8'); } catch (e) { fail(`${p} is listed as a run ending but does not exist`); continue; }
  if (!/<RunChallengeButton\b/.test(s)) fail(`${p} ends a run and renders no <RunChallengeButton>`);
  if (/circuitId === '[a-z]+' && !r\.practice \? \(\s*<div[^>]*>\s*<RunChallengeLine/.test(s)) fail(`${p} gates the challenge on one circuit id`);
}

// 4
const rc = readFileSync('app/RunChallenge.jsx', 'utf8');
if (/if \(!\(score > 0\)\) return null/.test(rc)) fail('RunChallengeButton hides itself on a zero score');
const sf = readFileSync('app/StageFinish.jsx', 'utf8');
if (/const canChallenge = [^;]*!isRetry/.test(sf)) fail('StageFinish withholds the challenge on the retry ending');
if (sf.indexOf('if (isRetry) {') < sf.indexOf('const chalDoor')) fail('StageFinish returns the retry ending before the challenge door is built');

if (fails.length) {
  console.error(`verify-challenge-coverage: ${fails.length} failure(s)`);
  for (const f of fails) console.error('  FAIL ' + f);
  process.exit(1);
}
console.log(`verify-challenge-coverage: ok. ${runs.length} runs challengeable (${runs.map((c) => c.id).join(', ')}); ${new Set([...KNOWN, ...enders]).size} run endings carry the door.`);
