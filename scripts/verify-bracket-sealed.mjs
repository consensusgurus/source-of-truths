// Bracket hands back NOTHING until the sheet is handed in (reader report
// 2026-10-08: the cap's running score was graded against the true winners on
// every pick, so it told the player which picks were right mid-play).
//
// This is a static gate on app/bracket/BracketClient.jsx:
//   1. the cap's IN-PLAY figures are built only from neutral names (picks made,
//      the clock), never from score / TRUE / perRound / won / champion
//   2. the score and perRound memos return early while the status is
//      'playing', so no in-play render can read a graded figure at all
//   3. every read of the truth (TRUE[...]) is one of the known sites, each of
//      which is either the grading itself or sits behind a !playing branch;
//      a NEW read fails here and has to be reviewed and added on purpose
//   4. the board's right/wrong classes are only assigned inside !playing
//
// Run: node scripts/verify-bracket-sealed.mjs
import { readFileSync } from 'node:fs';

const FILE = process.argv[2] || new URL('../app/bracket/BracketClient.jsx', import.meta.url);
const src = readFileSync(FILE, 'utf8');
let fails = 0;
const fail = (m) => { console.error('FAIL:', m); fails++; };

// 1. in-play cap figures
{
  const at = src.indexOf('figures={playing ? [');
  if (at < 0) fail('could not find the cap figures ternary (figures={playing ? [ ... ] : [ ... ]})');
  else {
    const end = src.indexOf('] : [', at);
    const branch = src.slice(at + 'figures={playing ? ['.length, end).replace(/\/\/.*$/gm, '');
    const ids = new Set((branch.replace(/\$\{/g, '{').match(/[A-Za-z_][\w]*/g) || []));
    const allowed = new Set(['v', 'k', 'filled', 'MATCHES', 'elapsed', 'picks', 'time']);
    for (const id of ids) if (!allowed.has(id)) fail(`in-play cap figure reads "${id}", which is not a neutral progress figure`);
  }
}

// 2. graded memos are sealed while playing
for (const name of ['score', 'perRound']) {
  const re = new RegExp(`const ${name} = useMemo\\(\\(\\) => \\{\\s*(?:\\/\\/[^\\n]*\\s*)*if \\(g\\.status === 'playing'\\) return`);
  if (!re.test(src)) fail(`${name} is computed during play; it must return early while g.status === 'playing'`);
}

// 3. every read of the truth is a known, reviewed site
{
  const KNOWN = [
    /out\[idOf\(r, m\)\] = better/,                                   // the TRUE memo itself (writes out, not TRUE)
    /g\.picks\[idOf\(r, m\)\] === TRUE\[idOf\(r, m\)\]\) s \+= Math\.pow/, // score memo (sealed) and submit()
    /if \(g\.picks\[idOf\(r, m\)\] === TRUE\[idOf\(r, m\)\]\) hit\+\+/,    // perRound memo (sealed)
    /if \(g2\.picks\[idOf\(r, m\)\] === TRUE\[idOf\(r, m\)\]\) s \+= /,     // submit(), grading the handed-in sheet
    /const champion = PUZZLE\.items\[TRUE\[MATCHES - 1\]\]/,              // read only when !playing && solShown
    /const truth = TRUE\[idOf\(r, m\)\];/,                                // slotButton, inside the !playing branch
  ];
  src.split('\n').forEach((line, i) => {
    if (!/\bTRUE\[/.test(line)) return;
    if (!KNOWN.some((re) => re.test(line))) fail(`line ${i + 1} reads the truth at an unreviewed site: ${line.trim()}`);
  });
  // the slotButton read must sit inside the !playing branch
  const t = src.indexOf('const truth = TRUE[idOf(r, m)];');
  if (t >= 0) {
    const before = src.slice(Math.max(0, t - 200), t);
    if (!/else if \(!playing\) \{\s*$/.test(before)) fail('slotButton reads the truth outside its !playing branch');
  }
  // champion is only printed behind (playing || !solShown)
  const uses = src.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => /\bchampion\.name\b/.test(l));
  for (const [l, n] of uses) {
    if (!/!playing|playing \|\| !solShown|solShown \?/.test(l)) fail(`line ${n} prints the true champion without a !playing / solShown guard`);
  }
}

// 4. right/wrong classes only after hand-in
src.split('\n').forEach((line, i) => {
  if (/cls \+= ' (right|wrong)'/.test(line)) {
    const ctx = src.split('\n').slice(Math.max(0, i - 6), i).join('\n');
    if (!/!playing/.test(ctx)) fail(`line ${i + 1} assigns a graded class outside a !playing branch`);
  }
});

if (fails) { console.error(`\n${fails} failure(s): Bracket can leak a graded figure during play.`); process.exit(1); }
console.log('Bracket sealed: in-play cap figures are picks + clock, graded memos are sealed while playing, every read of the truth is reviewed.');
