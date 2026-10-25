// Checker for the Blocks bank. Run: node scripts/verify-blocks.mjs
//
// Blocks authors no board, so there is no solution to re-solve. What CAN go
// wrong is the frame and the deal, and both are checked here from the SAME
// module the game plays from (lib/blocks-seq.js), never from a copy:
//
//   frame  num sequence, quizId format, live/dateLabel agreement, and the
//          sunday flag matching the real weekday of `live` (rule: never infer
//          a Sunday Edition from a proxy such as the column count).
//   deal   the day's 6,000-shape order is re-generated and proved fair: all
//          nine shapes present, each classic within a whisker of its 1-in-7
//          share, no classic disappearing for long, and the two additions
//          staying a spice rather than the meal.
//
// A floor is not a target (CLAUDE.md, bulk-bank rule 2): the drought and share
// checks run across the WHOLE bank, not one sample day.
import { PUZZLES } from '../app/blocks/puzzles.js';
import { buildSequence, CLASSIC, EXTRA, PIECES, ROT, SEQ_LEN, scoreRows } from '../lib/blocks-seq.js';

let BAD = 0;
const fail = (id, msg) => { BAD++; console.error(`✗ ${id}: ${msg}`); };
const ok   = (id, msg) => console.log(`✓ ${id}  ${msg}`);
const note = (id, msg) => console.log(`… ${id}  ${msg}`);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CELLS  = { I:4, O:4, T:4, S:4, Z:4, J:4, L:4, C:3, P:5 };

// ---------- 1. the shape set ------------------------------------------------
(function shapes() {
  const keys = Object.keys(PIECES);
  if (keys.length !== 9) fail('shapes', `expected 9 shapes, found ${keys.length}`);
  for (const k of keys) {
    const states = ROT[k];
    if (4 % states.length !== 0) fail('shapes', `${k} has ${states.length} rotation states, which does not divide 4`);
    for (const m of states) {
      const n = m.flat().filter(Boolean).length;
      if (n !== CELLS[k]) fail('shapes', `${k} changes cell count under rotation (${n} vs ${CELLS[k]})`);
    }
  }
  const ls = keys.map((k) => PIECES[k].l);
  if (new Set(ls).size !== keys.length) fail('shapes', 'two shapes share a lightness step, so they are indistinguishable');
  const extraMax = Math.max(...EXTRA.map((k) => PIECES[k].l));
  const classicMin = Math.min(...CLASSIC.map((k) => PIECES[k].l));
  if (extraMax >= classicMin) fail('shapes', 'the additions must own the darkest steps');
  if (BAD === 0) ok('shapes', `9 shapes, ${CLASSIC.length} classic + ${EXTRA.length} added, distinct shades, cell counts stable under rotation`);
})();

// ---------- 2. the frame ----------------------------------------------------
(function frame() {
  let bad = BAD;
  const seenNum = new Set(), seenId = new Set(), seenLive = new Set();
  PUZZLES.forEach((p, i) => {
    const at = `#${p.num}`;
    if (p.num !== i + 1) fail('frame', `${at} num is out of sequence at index ${i} (streaks are num-adjacency, gaps break them)`);
    if (seenNum.has(p.num)) fail('frame', `${at} duplicate num`);
    if (seenId.has(p.quizId)) fail('frame', `${at} duplicate quizId`);
    if (seenLive.has(p.live)) fail('frame', `${at} duplicate live date`);
    seenNum.add(p.num); seenId.add(p.quizId); seenLive.add(p.live);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.live)) fail('frame', `${at} live "${p.live}" is not YYYY-MM-DD`);
    const d = new Date(`${p.live}T12:00:00Z`);
    const m = d.getUTCMonth() + 1, day = d.getUTCDate(), yy = String(d.getUTCFullYear()).slice(2);
    const wantId = `blocks-${m}-${day}-${yy}`;
    if (p.quizId !== wantId) fail('frame', `${at} quizId "${p.quizId}" should be "${wantId}" (no zero padding)`);
    const wantLabel = `${MONTHS[m - 1]} ${day}, ${d.getUTCFullYear()}`;
    if (p.dateLabel !== wantLabel) fail('frame', `${at} dateLabel "${p.dateLabel}" should be "${wantLabel}"`);

    // Arcade plays the same every day from 2026-10-26 (owner, 2026-10-25).
    const reallySunday = d.getUTCDay() === 0 && p.live < '2026-10-26';
    if (!!p.sunday !== reallySunday) fail('frame', `${at} sunday=${p.sunday} but ${p.live} is ${reallySunday ? 'a Sunday Edition day' : 'not a Sunday Edition day'}`);

    if (p.rows !== 16) fail('frame', `${at} rows=${p.rows}, the well is always 16 deep`);
    const wantCols = p.sunday ? 8 : 10;
    if (p.cols !== wantCols) fail('frame', `${at} cols=${p.cols}, a ${p.sunday ? 'Sunday' : 'weekday'} well is ${wantCols} wide`);
    // Par is a HUMAN benchmark now, not a solver's median, so the range is the
    // band a real strong run lives in. Retuned 2026-08-08 off the live field.
    if (!(p.par >= 6 && p.par <= 60)) fail('frame', `${at} par ${p.par} rows is out of range`);
    if (p.sunday && p.par >= 15) fail('frame', `${at} Sunday par should sit below the weekday par (a narrower well ends runs sooner)`);
  });
  if (BAD === bad) ok('frame', `${PUZZLES.length} days, ${PUZZLES[0].live} to ${PUZZLES[PUZZLES.length - 1].live}, ids/labels/weekdays all agree`);
})();

// ---------- 3. the Sunday Edition actually scales ---------------------------
(function sunday() {
  const suns = PUZZLES.filter((p) => p.sunday);
  if (!suns.length) return fail('sunday', 'the bank authors no Sunday Edition, but blocks is listed in SUNDAY_EDITION_GAMES');
  const wide = PUZZLES.filter((p) => !p.sunday);
  const narrowed = suns.every((p) => p.cols < wide[0].cols);
  if (!narrowed) fail('sunday', 'a Sunday board did not actually narrow the well');
  else ok('sunday', `${suns.length} Sunday Editions, well narrows ${wide[0].cols} -> ${suns[0].cols}`);
})();

// ---------- 4. the deal, across the WHOLE bank ------------------------------
(function deal() {
  let worstDrought = 0, worstDroughtAt = '', minShare = 1, maxShare = 0, minExtra = 1, maxExtra = 0;
  for (const p of PUZZLES) {
    const seq = buildSequence(p.quizId);
    if (seq.length !== SEQ_LEN) { fail('deal', `#${p.num} sequence is ${seq.length}, expected ${SEQ_LEN}`); break; }
    const cnt = {};
    seq.forEach((k) => { cnt[k] = (cnt[k] || 0) + 1; });
    if (Object.keys(cnt).length !== 9) fail('deal', `#${p.num} deals only ${Object.keys(cnt).length} of the 9 shapes`);

    const extras = EXTRA.reduce((s, k) => s + (cnt[k] || 0), 0);
    const exShare = extras / seq.length;
    minExtra = Math.min(minExtra, exShare); maxExtra = Math.max(maxExtra, exShare);
    if (exShare < 0.08 || exShare > 0.20) fail('deal', `#${p.num} additions are ${(exShare*100).toFixed(1)}% of the deal, outside 8-20%`);
    if ((cnt.C || 0) <= (cnt.P || 0)) fail('deal', `#${p.num} deals more plus than corner; relief must outnumber punishment`);

    const classicTotal = seq.length - extras;
    for (const k of CLASSIC) {
      const share = (cnt[k] || 0) / classicTotal;
      minShare = Math.min(minShare, share); maxShare = Math.max(maxShare, share);
      if (Math.abs(share - 1 / 7) > 0.02) fail('deal', `#${p.num} ${k} is ${(share*100).toFixed(2)}% of classics, off its 1-in-7 share`);
    }
    for (const k of CLASSIC) {
      let last = -1, gap = 0;
      for (let i = 0; i < seq.length; i++) {
        if (seq[i] !== k) continue;
        if (last >= 0 && i - last > gap) gap = i - last;
        last = i;
      }
      if (gap > worstDrought) { worstDrought = gap; worstDroughtAt = `#${p.num} ${k}`; }
    }
  }
  if (worstDrought > 24) fail('deal', `a classic shape vanished for ${worstDrought} pieces (${worstDroughtAt}); the 7-bag should cap this near 20`);
  if (!BAD) ok('deal', `${PUZZLES.length} sequences re-generated: classic share ${(minShare*100).toFixed(2)}-${(maxShare*100).toFixed(2)}%, additions ${(minExtra*100).toFixed(1)}-${(maxExtra*100).toFixed(1)}%, worst drought ${worstDrought} (${worstDroughtAt})`);

  // every day must deal a DIFFERENT order, or the shared-sequence promise is a lie
  const heads = new Set(PUZZLES.map((p) => buildSequence(p.quizId, 40).join('')));
  if (heads.size !== PUZZLES.length) fail('deal', `only ${heads.size} distinct openings across ${PUZZLES.length} days`);
  else ok('deal', 'every day opens with a different order, and the same quizId always deals the same one');

  const a = buildSequence(PUZZLES[0].quizId).join('');
  const b = buildSequence(PUZZLES[0].quizId).join('');
  if (a !== b) fail('deal', 'the sequence is not deterministic');
})();

// ---------- 5. scoring ------------------------------------------------------
(function scoring() {
  const p = PUZZLES[0];
  // The score IS the row count, uncapped: identity, so a run above par keeps
  // separating players instead of pinning at a maximum. The old 0-10 mapping
  // is what put day one's whole field on 0 or 1 (see lib/blocks-seq).
  for (const rows of [0, 1, 7, p.par, p.par * 2, 1200]) {
    const got = scoreRows(rows);
    if (got !== rows) fail('scoring', `${rows} rows scored ${got}, expected the row count itself`);
  }
  if (scoreRows(-3) !== 0) fail('scoring', 'a negative row count should floor at 0');
  let prev = -1;
  for (let rows = 0; rows <= 1200; rows += 1) {
    const s = scoreRows(rows);
    if (s <= prev) { fail('scoring', 'score is not strictly rising in rows cleared'); break; }
    prev = s;
  }
  if (!BAD) ok('scoring', `score = rows cleared, uncapped and strictly rising (par ${p.par} rows weekday / ${PUZZLES.find(x=>x.sunday).par} Sunday, a benchmark only)`);
})();

// ---------- 6. US spellings in reader-facing strings -------------------------
(function spelling() {
  const BRIT = /\b(colour|centre|grey|neighbour|favourite|defence|practise|licence|metre|theatre)\b/i;
  const hits = [];
  for (const p of PUZZLES) for (const v of [p.dateLabel, p.quizId]) if (BRIT.test(String(v))) hits.push(`${p.num}:${v}`);
  if (hits.length) fail('spelling', `British spellings: ${hits.join(', ')}`);
  else note('spelling', 'no British spellings in bank strings');
})();

console.log(BAD ? `\n${BAD} problem${BAD === 1 ? '' : 's'}` : '\nblocks bank verified');
process.exit(BAD ? 1 : 0);
