// scripts/six-verify-common.mjs: the date and bookkeeping checks every one of the
// six 2026-11-01 dailies (Swap, Slide, Spin, Fill, Connect, Pairs) shares. Each
// game's own checker (scripts/verify-<key>.mjs) imports this and adds its rules.
// Nothing here is imported from a generator.
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function checker(key) {
  let fails = 0;
  const bad = (n, msg) => { fails++; console.log(`✗ ${key} #${n}: ${msg}`); };
  return { bad, done(PUZZLES) {
    const last = PUZZLES[PUZZLES.length - 1];
    const left = Math.round((Date.parse(last.live + 'T12:00:00Z') - Date.now()) / 86400000);
    if (left < 14) console.log(`… ${key}: the bank ends ${last.live}, ${left} days away`);
    console.log(`${key}: ${PUZZLES.length} boards, ${PUZZLES[0].live} to ${last.live}`);
    console.log(fails ? `\n${fails} failure(s)` : `${key}: all clean`);
    process.exit(fails ? 1 : 0);
  } };
}

// num runs 1..n, one board a day with no gap, quizId / dateLabel / sunday agree with live.
export function checkDays(key, PUZZLES, bad, start = '2026-11-01') {
  if (!PUZZLES.length) { bad(0, 'empty bank'); return; }
  if (PUZZLES[0].live !== start) bad(PUZZLES[0].num, `the bank should open ${start}`);
  PUZZLES.forEach((p, i) => {
    if (p.num !== i + 1) bad(p.num, `num should be ${i + 1}`);
    const d = new Date(Date.parse(start + 'T12:00:00Z') + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    if (p.live !== iso) bad(p.num, `live ${p.live} should be ${iso}`);
    const [y, m, dd] = iso.split('-').map(Number);
    if (p.quizId !== `${key}-${m}-${dd}-${String(y).slice(2)}`) bad(p.num, `quizId ${p.quizId}`);
    if (p.dateLabel !== `${MONTHS[m - 1]} ${dd}, ${y}`) bad(p.num, `dateLabel ${p.dateLabel}`);
    if (!!p.sunday !== (d.getUTCDay() === 0)) bad(p.num, `sunday flag ${!!p.sunday} on a ${DOW[d.getUTCDay()]}`);
    if (JSON.stringify(p).includes('—')) bad(p.num, 'em dash in the row');
  });
}
export const dowOf = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();
