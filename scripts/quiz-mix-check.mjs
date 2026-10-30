// scripts/quiz-mix-check.mjs: the checker body shared by verify-mixtape.mjs and
// verify-mishmash.mjs. Re-derives every rule in scripts/quiz-mix-rules.mjs from
// the quiz catalog and all three quiz-mix banks rather than trusting the
// generator. A failure on a day already played is a WARNING (frozen past).
import { register } from 'node:module';
register('./alias-loader.mjs', import.meta.url);

export async function checkMix(game) {
  const R = await import('./quiz-mix-rules.mjs');
  const { QUIZZES } = await import('../lib/quizzes.js');
  const { LISTS } = await import('../lib/data.js');
  const { quizDept } = await import('../lib/quiz-departments.js');
  const { POTLUCK_FAMILY, potluckEligible } = await import('../lib/potluck.js');
  const banks = {
    potluck: (await import('../app/potluck/puzzles.js')).PUZZLES,
    mixtape: (await import('../app/mixtape/puzzles.js')).PUZZLES,
    mishmash: (await import('../app/mishmash/puzzles.js')).PUZZLES,
  };
  const PUZZLES = banks[game];
  let fails = 0, warns = 0;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const bad = (p, m) => { if (p.live < today) { warns++; console.warn(`… ${p.quizId} (played): ${m}`); } else { fails++; console.error(`✗ ${p.quizId}: ${m}`); } };
  const byId = new Map(QUIZZES.map((q) => [q.id, q]));
  const listMode = new Map(LISTS.map((l) => [l.id, l.mode || 'consensus']));
  const fam = (q) => POTLUCK_FAMILY[q.format || 'default'];

  // Every use of every quiz across the three banks.
  const uses = new Map(); const onDay = new Map();
  for (const g of R.ALL_MIX) for (const p of banks[g]) for (const id of p.quizzes || []) {
    if (!uses.has(id)) uses.set(id, []);
    uses.get(id).push({ g, live: p.live, n: R.dayNum(p.live) });
    const k = p.live; if (!onDay.has(k)) onDay.set(k, []); onDay.get(k).push({ g, id });
  }

  let lastMap = null; let firstN = null;
  PUZZLES.forEach((p, k) => {
    if (p.num !== k + 1) bad(p, `num ${p.num}, expected ${k + 1}`);
    if (p.game !== game) bad(p, `game field is ${p.game}, expected ${game}`);
    if (p.quizId !== R.mixQuizId(game, p.live)) bad(p, `quizId does not match live ${p.live}`);
    if (k > 0 && R.dayNum(p.live) !== R.dayNum(PUZZLES[k - 1].live) + 1) bad(p, `dates not contiguous after ${PUZZLES[k - 1].live}`);
    if (p.sunday) bad(p, `${R.NAMES[game]} has no Sunday Edition`);
    if (!Array.isArray(p.quizzes) || p.quizzes.length !== 3) { bad(p, 'needs exactly three quizzes'); return; }
    const fams = new Set(), depts = new Set();
    let hasMap = false;
    for (const id of p.quizzes) {
      const q = byId.get(id);
      if (!q) { bad(p, `${id} is not a quiz`); continue; }
      if (!potluckEligible(q, listMode, Date.parse(p.live + 'T04:00:00Z'))) bad(p, `${id} is not eligible (format ${q.format || 'default'})`);
      fams.add(fam(q)); depts.add(quizDept(q));
      if (q.format === 'map') hasMap = true;
      const sameDay = (onDay.get(p.live) || []).filter((u) => u.id === id);
      if (sameDay.length > 1) bad(p, `${id} is served ${sameDay.length} times on ${p.live} (${sameDay.map((u) => u.g).join(', ')})`);
      const others = uses.get(id).filter((u) => !(u.g === game && u.live === p.live));
      if (fam(q) !== 'visual') {
        if (others.length) bad(p, `${id} (${fam(q)}) is not fresh: also ${others.map((u) => `${u.g} ${u.live}`).join(', ')}`);
      } else {
        const near = others.filter((u) => Math.abs(u.n - R.dayNum(p.live)) < R.MIN_GAP);
        if (near.length) bad(p, `${id} (visual) back within ${R.MIN_GAP} days: ${near.map((u) => `${u.g} ${u.live}`).join(', ')}`);
      }
    }
    if (fams.size !== 3) bad(p, `formats not varied: ${[...fams].join(', ')}`);
    if (depts.size !== 3) bad(p, `departments not varied: ${[...depts].join(', ')}`);
    const n = R.dayNum(p.live);
    if (firstN == null) firstN = n;
    if (hasMap) lastMap = n;
    else if (n - (lastMap == null ? firstN - 1 : lastMap) >= R.MAP_WINDOW) bad(p, `no map quiz in the ${R.MAP_WINDOW} days to ${p.live}`);
  });
  const last = PUZZLES[PUZZLES.length - 1];
  const left = Math.round((Date.parse(last.live) - Date.parse(today)) / 86400000);
  if (left < 0) { fails++; console.error(`✗ bank ran out on ${last.live}`); }
  else if (left < 14) { warns++; console.warn(`… bank ends ${last.live}, ${left} days left: run scripts/gen-quiz-mix.mjs`); }
  const maps = PUZZLES.filter((p) => p.quizzes.some((id) => (byId.get(id) || {}).format === 'map')).length;
  console.log(`${fails ? 'FAIL' : 'ok'}  ${game}: ${PUZZLES.length} days to ${last.live}, ${maps} map days, ${fails} failures, ${warns} warnings`);
  process.exit(fails ? 1 : 0);
}
