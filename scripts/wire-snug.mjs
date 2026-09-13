// scripts/wire-snug.mjs — wires the daily game `snug` (Logic) and its kids
// translation `fitit` into every registry.
//
// An ANCHORED script, per the daily-game checklist and in the shape of
// scripts/wire-sums-hinge.mjs: half these registries fail SILENTLY when missed
// (a key in one list and not its partner is dropped with no error and no gap),
// so every anchor must match EXACTLY ONCE or the script throws. Idempotent: an
// edit whose replacement is already present is skipped, so a re-run after a
// partial push is safe.
//
//   node scripts/wire-snug.mjs <dir>
//
// <dir> is a tree exported from a same-step `git archive FETCH_HEAD`, never the
// working tree. Snug sits after Junkyard in every ordered Logic list. It runs a
// Sunday Edition (7x7, eight pieces), so it joins lib/sunday-editions.js and
// the sunday-slate route. The kids half touches lib/kids-daily.js, lib/kids.js,
// app/kids/KidsHubClient.jsx and scripts/verify-kids.mjs.
import fs from 'fs';
import path from 'path';

const root = process.argv[2];
if (!root) { console.error('usage: node wire-snug.mjs <dir>'); process.exit(1); }

let applied = 0, skipped = 0;
function edit(file, anchor, replacement) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, 'utf8');
  if (src.includes(replacement)) { skipped++; return; }
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${file}: anchor matched ${n} times, expected 1\n  ${anchor.slice(0, 120)}`);
  fs.writeFileSync(p, src.replace(anchor, replacement));
  applied++;
}

const S = {
  TAG: 'Fit the pieces, one way only',
  HOW: 'A board with a few squares missing and a handful of pieces that fill it exactly. Tap a piece, turn or flip it, tap the board to drop it. Every board fits together exactly one way, so a full board is always the right board. Weekdays are 6x6, the Sunday Edition is 7x7 with eight pieces.',
  COLOR: '#3b5bdb', NAVY: '#91a7ff', BG: '#e8ecfb', BORDER: 'rgba(59,91,219,0.35)',
  BLURB: 'A board with a few squares missing and pieces that fill it exactly. Turn them, flip them, find the one way they all fit. Six by six on weekdays, seven by seven with eight pieces on Sundays.',
};

// ─── 1. lib/daily-games.js — the single source of truth, plus the premieres ──
edit('lib/daily-games.js',
  `  { key: 'junkyard', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Junkyard', cat: 'Logic',`,
  `  { key: 'snug', miss: null, name: 'Snug', cat: 'Logic', tag: '${S.TAG}', how: '${S.HOW}', color: '${S.COLOR}', colorNavy: '${S.NAVY}' },\n  { key: 'junkyard', keepsAnswer: true, attempts: 'graded', miss: 'Tries', name: 'Junkyard', cat: 'Logic',`);
edit('lib/daily-games.js',
  `  { key: 'junkyard', from: '2026-09-04', until: '2026-09-08' },`,
  `  { key: 'junkyard', from: '2026-09-04', until: '2026-09-08' },\n  { key: 'snug', from: '2026-09-13', until: '2026-09-17' },`);

// ─── 2. lib/sunday-editions.js — it runs one ────────────────────────────────
edit('lib/sunday-editions.js',
  `//   junkyard a perfect line of 44 and up against a weekday 22 to 47, on the`,
  `//   snug    a 7x7 board with four holes and eight pieces against the weekday\n//           6x6 with six or seven, still exactly one way to fit\n//   junkyard a perfect line of 44 and up against a weekday 22 to 47, on the`);
edit('lib/sunday-editions.js',
  `  'listed', 'mate', 'four', 'park', 'impound', 'junkyard', 'check',`,
  `  'listed', 'mate', 'four', 'park', 'impound', 'junkyard', 'snug', 'check',`);

// ─── 3. app/DailyEndCard.jsx — LAUNCH_PIN, GAME_META, tile copy ─────────────
// (Puzzle is already imported from lucide-react.)
edit('app/DailyEndCard.jsx',
  `const LAUNCH_PIN = { keys: ['frame', 'rim', 'diag', 'junkyard',`,
  `const LAUNCH_PIN = { keys: ['snug', 'frame', 'rim', 'diag', 'junkyard',`);
edit('app/DailyEndCard.jsx',
  `  junkyard: { accent: '#5c3a16', badgeBg: '#5c3a16', badgeInk: T.white, Fin: Boxes },`,
  `  junkyard: { accent: '#5c3a16', badgeBg: '#5c3a16', badgeInk: T.white, Fin: Boxes },\n  snug: { accent: '${S.COLOR}', badgeBg: '${S.COLOR}', badgeInk: T.white, Fin: Puzzle },`);
edit('app/DailyEndCard.jsx',
  `  { key: 'junkyard',   cat: 'logic',     name: 'Junkyard', tag: 'Parker on the biggest lot',`,
  `  { key: 'snug',   cat: 'logic',     name: 'Snug', tag: '${S.TAG}',   blurb: '${S.BLURB}', href: '/snug' },\n  { key: 'junkyard',   cat: 'logic',     name: 'Junkyard', tag: 'Parker on the biggest lot',`);

// ─── 4. app/api/quiz/daily-order/route.js — the LAUNCH_PIN mirror ───────────
edit('app/api/quiz/daily-order/route.js',
  `const LAUNCH_PIN = { keys: ['frame', 'rim', 'diag', 'junkyard',`,
  `const LAUNCH_PIN = { keys: ['snug', 'frame', 'rim', 'diag', 'junkyard',`);

// ─── 5. app/DailyGamesPromo.jsx ─────────────────────────────────────────────
edit('app/DailyGamesPromo.jsx',
  `  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', tag: 'parker on the biggest lot', store: 'sot_junkyard_day', accent: '#5c3a16', bg: '#f0e7d8', border: 'rgba(92,58,22,0.35)' },`,
  `  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', tag: 'parker on the biggest lot', store: 'sot_junkyard_day', accent: '#5c3a16', bg: '#f0e7d8', border: 'rgba(92,58,22,0.35)' },\n  { key: 'snug', href: '/snug', name: 'Snug', tag: 'fit the pieces, one way only', store: 'sot_snug_day', accent: '${S.COLOR}', bg: '${S.BG}', border: '${S.BORDER}' },`);

// ─── 6. app/DailyGamesGrid.jsx — BOTH lists, or the tile is dropped silently ─
edit('app/DailyGamesGrid.jsx',
  `  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', tag: 'Parker on the biggest lot', img: '/games/btn-junkyard.png' },`,
  `  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', tag: 'Parker on the biggest lot', img: '/games/btn-junkyard.png' },\n  { key: 'snug', href: '/snug', name: 'Snug', tag: '${S.TAG}', img: '/games/btn-snug.png' },`);
edit('app/DailyGamesGrid.jsx',
  `  { key: 'logic', label: 'Logic', keys: ['alibi', 'jester', 'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'etch', 'hedge', 'park', 'impound', 'junkyard', 'fib',`,
  `  { key: 'logic', label: 'Logic', keys: ['alibi', 'jester', 'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'etch', 'hedge', 'park', 'impound', 'junkyard', 'snug', 'fib',`);

// ─── 7. app/DailyStrip.jsx — the row, plus both colour maps ─────────────────
edit('app/DailyStrip.jsx',
  `  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', img: '/games/btn-junkyard.png', store: 'sot_junkyard_day', tag: "Parker on the biggest lot" , cat: 'Logic' },`,
  `  { key: 'junkyard', href: '/junkyard', name: 'Junkyard', img: '/games/btn-junkyard.png', store: 'sot_junkyard_day', tag: "Parker on the biggest lot" , cat: 'Logic' },\n  { key: 'snug', href: '/snug', name: 'Snug', img: '/games/btn-snug.png', store: 'sot_snug_day', tag: "${S.TAG}" , cat: 'Logic' },`);
edit('app/DailyStrip.jsx',
  `const ACCENTS = { frame: '#f2c27a',`,
  `const ACCENTS = { snug: '${S.NAVY}', frame: '#f2c27a',`);
edit('app/DailyStrip.jsx',
  `const TCOL = { frame: '#b45309',`,
  `const TCOL = { snug: '${S.COLOR}', frame: '#b45309',`);

// ─── 8. app/daily/page.js — import AND the map AND the card, or the build fails
edit('app/daily/page.js',
  `import { PUZZLES as JUNKYARD_FULL } from '../junkyard/puzzles';`,
  `import { PUZZLES as JUNKYARD_FULL } from '../junkyard/puzzles';\nimport { PUZZLES as SNUG_FULL } from '../snug/puzzles';`);
edit('app/daily/page.js',
  `const JUNKYARD = JUNKYARD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`,
  `const JUNKYARD = JUNKYARD_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));\nconst SNUG = SNUG_FULL.map(({ num, quizId, live, dateLabel, sunday }) => ({ num, quizId, live, dateLabel, sunday }));`);
edit('app/daily/page.js',
  `  { key: 'junkyard', name: 'Junkyard', path: '/junkyard', tag: 'Parker on the biggest lot', accent: '#5c3a16', bg: '#f0e7d8', border: 'rgba(92,58,22,0.35)', src: JUNKYARD },`,
  `  { key: 'junkyard', name: 'Junkyard', path: '/junkyard', tag: 'Parker on the biggest lot', accent: '#5c3a16', bg: '#f0e7d8', border: 'rgba(92,58,22,0.35)', src: JUNKYARD },\n  { key: 'snug', name: 'Snug', path: '/snug', tag: '${S.TAG}', accent: '${S.COLOR}', bg: '${S.BG}', border: '${S.BORDER}', src: SNUG },`);

// ─── 9. app/daily/DailyArchiveClient.jsx — family keys + the navy accent ────
edit('app/daily/DailyArchiveClient.jsx',
  `  { key: 'logic', label: 'Logic', keys: ['alibi', 'jester', 'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'etch', 'hedge', 'park', 'impound', 'junkyard', 'fib',`,
  `  { key: 'logic', label: 'Logic', keys: ['alibi', 'jester', 'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'etch', 'hedge', 'park', 'impound', 'junkyard', 'snug', 'fib',`);
edit('app/daily/DailyArchiveClient.jsx',
  `impound: '#e3bd85', junkyard: '#d9b070',`,
  `impound: '#e3bd85', junkyard: '#d9b070', snug: '${S.NAVY}',`);

// ─── 10. lib/sitemap-entries.js ─────────────────────────────────────────────
edit('lib/sitemap-entries.js',
  `'parker', 'impound', 'junkyard', 'check',`,
  `'parker', 'impound', 'junkyard', 'snug', 'check',`);

// ─── 11. the puzzle-map registries, sunday-slate included (it runs a Sunday) ─
for (const f of ['lib/daily-slate.js', 'app/api/quiz/daily-game/route.js', 'app/api/quiz/daily-unplayed/route.js', 'app/api/quiz/sunday-slate/route.js']) {
  edit(f, `import { PUZZLES as P_junkyard } from '@/app/junkyard/puzzles';`,
    `import { PUZZLES as P_junkyard } from '@/app/junkyard/puzzles';\nimport { PUZZLES as P_snug } from '@/app/snug/puzzles';`);
  edit(f, `junkyard: P_junkyard,`, `junkyard: P_junkyard, snug: P_snug,`);
}

// ─── 12. the two hardcoded alternations ─────────────────────────────────────
edit('app/api/quiz/daily-status/route.js', `|junkyard|`, `|junkyard|snug|`);
edit('app/quizzes/QuizHomeClient.jsx', `|junkyard|`, `|junkyard|snug|`);

// ─── 13. app/DailySlateRail.jsx — the A-Z rail ──────────────────────────────
edit('app/DailySlateRail.jsx',
  `'park', 'impound', 'junkyard', 'check',`,
  `'park', 'impound', 'junkyard', 'snug', 'check',`);

// ─── 14. lib/quiz-catalog.js ────────────────────────────────────────────────
edit('lib/quiz-catalog.js', `'impound', 'junkyard', 'check'`, `'impound', 'junkyard', 'snug', 'check'`);

// ─── 15. lib/loft.js — WITHOUT this the client renders the pre-Loft page ────
edit('lib/loft.js',
  `  'impound', 'junkyard', 'mate',`,
  `  'impound', 'junkyard', 'snug', 'mate',`);

// ─── 16. lib/game-glyphs.js — the one-colour glyph every stage surface draws ─
edit('lib/game-glyphs.js',
  `  junkyard: 'M21 11V3H3v18h18v-5M8 11h6v5H8zM6 6h9M18 6v4M6 18h10',  // the biggest lot, one gap`,
  `  junkyard: 'M21 11V3H3v18h18v-5M8 11h6v5H8zM6 6h9M18 6v4M6 18h10',  // the biggest lot, one gap
  snug: 'M3 3h6v6H3zM9 3h6v6H9zM9 9h6v6H9zM15 9h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z',  // pieces meeting, one square missing`);

// ─── 17. lib/puzzle-categories.js — the Logic landing page ──────────────────
edit('lib/puzzle-categories.js',
  `    keys: ['etch', 'hedge', 'plot', 'park', 'impound', 'junkyard', 'paths',`,
  `    keys: ['etch', 'hedge', 'plot', 'snug', 'park', 'impound', 'junkyard', 'paths',`);
edit('lib/puzzle-categories.js',
  `      etch: 'Nonogram (picross)', hedge: 'Slitherlink', plot: 'Shikaku', park: 'Sliding block puzzle',`,
  `      etch: 'Nonogram (picross)', hedge: 'Slitherlink', plot: 'Shikaku', snug: 'Shape-fitting (polyomino tiling)', park: 'Sliding block puzzle',`);
edit('lib/puzzle-categories.js',
  `    description: 'Eighteen free daily logic puzzles: a nonogram, slitherlink, shikaku, three sizes of sliding block puzzle,`,
  `    description: 'Nineteen free daily logic puzzles: a nonogram, slitherlink, shikaku, a shape-fitting puzzle, three sizes of sliding block puzzle,`);
edit('lib/puzzle-categories.js',
  `    lede: 'Eighteen logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a sliding block puzzle in three sizes)`,
  `    lede: 'Nineteen logic puzzles with one new board apiece every day. Pencil-and-paper classics (a nonogram, a slitherlink loop, shikaku rectangles, a shape-fitting puzzle, a sliding block puzzle in three sizes)`);
edit('lib/puzzle-categories.js',
  `Plot is shikaku: cut the board into rectangles so each number owns exactly its own. Parker`,
  `Plot is shikaku: cut the board into rectangles so each number owns exactly its own. Snug is the shape-fitting puzzle: a board with a few squares missing and pieces that cover it exactly one way, turned and flipped as you need. Parker`);
edit('lib/puzzle-categories.js',
  `      ['Sunday Edition', 'Etch runs 20x20, Hedge 10x10, Alibi seats five suspects, Sworn swears six.'],`,
  `      ['Sunday Edition', 'Etch runs 20x20, Hedge 10x10, Snug lays eight pieces on a 7x7, Alibi seats five suspects, Sworn swears six.'],`);

// ─── 18. the kids track: Fit It ─────────────────────────────────────────────
edit('lib/kids-daily.js',
  `  { key: 'mathdash', title: 'Math Dash', href: '/kids/mathdash', from: 'Blitz', tag: 'Ten sums, three hearts. How many can you get?', hue: '#ffd23f', band: '#fff8dc' },`,
  `  { key: 'mathdash', title: 'Math Dash', href: '/kids/mathdash', from: 'Blitz', tag: 'Ten sums, three hearts. How many can you get?', hue: '#ffd23f', band: '#fff8dc' },\n  { key: 'fitit', title: 'Fit It', href: '/kids/fitit', from: 'Snug', tag: 'A few pieces, a board with holes. Make them all fit.', hue: '#3a86ff', band: '#e9f1ff' },`);
edit('lib/kids-daily.js', `// Kids dailies: the six translated puzzles under /kids/<game>.`, `// Kids dailies: the seven translated puzzles under /kids/<game>.`);
edit('lib/kids.js',
  `  { id: 'mathdash', title: 'Math Dash', href: '/kids/mathdash' },`,
  `  { id: 'mathdash', title: 'Math Dash', href: '/kids/mathdash' },\n  { id: 'fitit', title: 'Fit It', href: '/kids/fitit' },`);
edit('app/kids/KidsHubClient.jsx',
  `// Little pictures for the six daily tiles, drawn inline so the hub needs no image.`,
  `// Little pictures for the daily tiles, drawn inline so the hub needs no image.`);
edit('app/kids/KidsHubClient.jsx',
  `<p>Six little puzzles that change every day,`,
  `<p>Seven little puzzles that change every day,`);
edit('app/kids/KidsHubClient.jsx',
  `  mathdash: '<svg viewBox="0 0 110 50">`,
  `  fitit: '<svg viewBox="0 0 76 76"><rect x="4" y="4" width="68" height="68" rx="10" fill="#1b1f3b"/><g><rect x="9" y="9" width="18" height="18" rx="4" fill="#ff5a5f"/><rect x="29" y="9" width="18" height="18" rx="4" fill="#ff5a5f"/><rect x="29" y="29" width="18" height="18" rx="4" fill="#ff5a5f"/><rect x="49" y="9" width="18" height="18" rx="4" fill="#3bb273"/><rect x="49" y="29" width="18" height="18" rx="4" fill="#3bb273"/><rect x="49" y="49" width="18" height="18" rx="4" fill="#3bb273"/><rect x="9" y="29" width="18" height="18" rx="4" fill="#ffd23f"/><rect x="9" y="49" width="18" height="18" rx="4" fill="#ffd23f"/><rect x="29" y="49" width="18" height="18" rx="4" fill="#fffdf6"/></g></svg>',\n  mathdash: '<svg viewBox="0 0 110 50">`);

// verify-kids: a fitit section with its own fixed-orientation solver.
edit('scripts/verify-kids.mjs',
  `//   sixes / unpark  the grown-up banks carry their own verifiers; here only`,
  `//   fitit   5x5 mask with 2 or 3 holes, a connected region, 4 or 5 pieces of
//           3 to 6 squares each normalised and pairwise distinct as printed,
//           areas summing to the region, sol tiling it exactly, and EXACTLY
//           ONE fixed-orientation tiling (no rotation on the kids board) by a
//           piece-driven solver; no two boards share a region
//   sixes / unpark  the grown-up banks carry their own verifiers; here only`);
edit('scripts/verify-kids.mjs',
  `// ---------------------------------------------------------------- sixes / unpark pools`,
  `// ---------------------------------------------------------------- fitit
{
  const { PUZZLES } = await load('app/kids/fitit/puzzles.js');
  const N = 5;
  const masks = new Set();
  const tile = (mask, pieces) => {
    // Piece-driven: place piece 0 everywhere it fits, then piece 1, ... Cap 2.
    const grid = mask.map((row) => [...row].map((ch) => (ch === '1' ? 0 : 1)));
    let count = 0;
    (function rec(i) {
      if (count >= 2) return;
      if (i === pieces.length) { if (grid.every((row) => row.every((v) => v !== 0))) count++; return; }
      for (let dr = 0; dr < N; dr++) for (let dc = 0; dc < N; dc++) {
        let good = true;
        for (const [r, c] of pieces[i]) { const rr = r + dr, cc = c + dc; if (rr >= N || cc >= N || grid[rr][cc] !== 0) { good = false; break; } }
        if (!good) continue;
        for (const [r, c] of pieces[i]) grid[r + dr][c + dc] = 2;
        rec(i + 1);
        for (const [r, c] of pieces[i]) grid[r + dr][c + dc] = 0;
        if (count >= 2) return;
      }
    })(0);
    return count;
  };
  for (const p of PUZZLES) {
    const id = \`fitit #\${p.num}\`;
    if (!Array.isArray(p.mask) || p.mask.length !== N || p.mask.some((r) => r.length !== N || /[^01]/.test(r))) { bad(\`\${id}: malformed mask\`); continue; }
    const cells = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (p.mask[r][c] === '1') cells.push([r, c]);
    const holes = N * N - cells.length;
    if (holes < 2 || holes > 3) bad(\`\${id}: \${holes} holes, want 2 or 3\`);
    const seen = new Set([cells[0].join(',')]); const st = [cells[0]];
    while (st.length) { const [r, c] = st.pop(); for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < N && cc < N && p.mask[rr][cc] === '1' && !seen.has(\`\${rr},\${cc}\`)) { seen.add(\`\${rr},\${cc}\`); st.push([rr, cc]); } } }
    if (seen.size !== cells.length) bad(\`\${id}: region not connected\`);
    const mk = p.mask.join('/');
    if (masks.has(mk)) bad(\`\${id}: repeats a region\`); masks.add(mk);
    if (!Array.isArray(p.pieces) || p.pieces.length < 4 || p.pieces.length > 5) { bad(\`\${id}: \${p.pieces && p.pieces.length} pieces, want 4 or 5\`); continue; }
    let area = 0; const sigs = new Set();
    p.pieces.forEach((pc, j) => {
      area += pc.length;
      if (pc.length < 3 || pc.length > 6) bad(\`\${id}: piece \${j} has \${pc.length} squares\`);
      const mr = Math.min(...pc.map((q) => q[0])), mc = Math.min(...pc.map((q) => q[1]));
      if (mr !== 0 || mc !== 0) bad(\`\${id}: piece \${j} not normalised\`);
      const sg = pc.map((q) => q.join(':')).join(',');
      if (sigs.has(sg)) bad(\`\${id}: piece \${j} duplicates another as printed\`); sigs.add(sg);
    });
    if (area !== cells.length) bad(\`\${id}: pieces cover \${area}, region is \${cells.length}\`);
    if (!Array.isArray(p.sol) || p.sol.length !== p.pieces.length) bad(\`\${id}: sol length\`);
    else {
      const g = p.mask.map((row) => [...row].map((ch) => (ch === '1' ? 0 : 1))); let clash = false;
      p.pieces.forEach((pc, j) => { for (const [r, c] of pc) { const rr = r + p.sol[j][0], cc = c + p.sol[j][1]; if (rr < 0 || cc < 0 || rr >= N || cc >= N || g[rr][cc] !== 0) { clash = true; break; } g[rr][cc] = 2; } });
      if (clash || g.some((row) => row.some((v) => v === 0))) bad(\`\${id}: sol does not tile the board exactly\`);
    }
    const n = tile(p.mask, p.pieces);
    if (n !== 1) bad(\`\${id}: \${n >= 2 ? 'two or more' : 'no'} fixed-orientation tilings\`);
  }
  ok(\`fitit: \${PUZZLES.length} boards, every one unique as printed\`);
}

// ---------------------------------------------------------------- sixes / unpark pools`);

// ─── 19. CLAUDE.md — the Sunday table row and the launch section ───────────
edit('CLAUDE.md',
  `| Sixes | a grid in the top fraction of a percent of the difficulty distribution`,
  `| Snug | a 7x7 board with four holes and eight pieces against the weekday 6x6 with six or seven, still one way to fit (from launch, 2026-09-13) |\n| Sixes | a grid in the top fraction of a percent of the difficulty distribution`);
{
  const p = path.join(root, 'CLAUDE.md');
  const src = fs.readFileSync(p, 'utf8');
  const marker = '## Snug (`/snug`) and Fit It (`/kids/fitit`)';
  if (!src.includes(marker)) {
    fs.writeFileSync(p, src.replace(/\s*$/, '\n') + `
${marker}: fit the pieces, one way only (launched 2026-09-13)

Key/route/folder \`snug\`, category **Logic**, registry \`miss: null\` (Sixes' manners: a solve is a
flat 10, nothing counts against you, the clock decides the day, one free first-play hint through
\`lib/hint-gate\`), legacy accent \`#3b5bdb\` / navy \`#91a7ff\`. Day 1 is **2026-09-13**, a Sunday, so
No. 1 is a Sunday Edition. Bank runs 78 days to **2026-11-29**. Wired by \`scripts/wire-snug.mjs\`
(anchored on the Junkyard rows, idempotent). No PNG tile; \`lib/game-glyphs.js\` has \`snug\`. Share
card is the static \`public/og/snug.png\` from \`scripts/bake-og.mjs snug\`. Design study with the
grown-up and kids boards: https://claude.ai/code/artifact/a9c7b827-5af7-4c1a-8fef-7db991b253dc.

**The game.** A board with a few squares missing and a handful of polyomino pieces whose areas add
up to the board exactly. Tap a piece on the pad to arm it, R or the Rotate chip turns it, F or Flip
mirrors it, tap a board square where one of its squares goes and it drops in if it fits (the piece's
row-major first square is preferred when several placements fit; a tap that fits nowhere flashes and
costs nothing). Tap a placed piece to lift it. The pad shows every piece SCRAMBLED (a fixed rotation
and flip per slot), never in its solution orientation. THE BANK ONLY SHIPS BOARDS WITH ONE TILING
under all eight orientations, so a full board is always the right board.

**Uniqueness by FILTERING, and difficulty is MEASURED.** \`scripts/gen-snug.mjs\` makes a region (a
square minus a few holes, connected), floods it into k pieces, and keeps the board only when the
tiling count under rotations and reflections is exactly one; it does not design toward uniqueness.
\`nodes\` is the size of the search tree the canonical counting solver walks (defined in the bank
header: row-major first empty square, every unused piece, every deduplicated orientation anchored by
its row-major first cell, every entry counted). Each weekday draws a POOL of unique boards and takes
the quantile its day asks for (Monday easiest, Saturday hardest), then a second pass re-picks any
weekday whose nodes fall below the day before, so \`nodes\` never falls inside a Mon-Sat run.

**The shape ramp is pinned per weekday and was measured before it was chosen:** Mon 6x6, 3 holes,
6 pieces of 4-7; Tue 3 holes, 6 of 4-6; Wed 3 holes, 7 of 4-6; Thu 2 holes, 7 of 4-6; Fri 1 hole,
7 of 4-6; Sat 1 hole, 7 of 4-6 from the HARD end of its pool; **Sunday 7x7, 4 holes, 8 pieces of
4-7.** A hole is a constraint, so the week takes them away. A Saturday of seven pieces of 3-6 was
tried first and measured EASIER than Friday (median nodes about 2,800 against 5,000: a tromino
constrains less than a tetromino), so Saturday shares Friday's shape and the quantile does the work. Eight pieces of 3-5 on a 6x6, or a full 6x6 with no hole, almost never
come out unique (0 to 1 in 1,500 tries), which is why the weekday count stops at seven. No two pieces
on a board are congruent under the free symmetry, and no two boards share a region and piece set.

**⚠️ A ONE-HOLE 6x6 HAS ONLY 36 REGIONS, and fewer than twenty of them admit a unique tiling at
all.** The first run keyed board identity on the region alone and reserved every pool candidate's, so
it ran out on the third Friday (2026-10-02); reserving only the chosen board's region moved the
failure to the sixth. A board's identity is therefore its region PLUS its piece set (\`rkey\` in the
generator, the same key in the verifier), which is what a player actually sees.

**\`scripts/verify-snug.mjs\` shares no code with the generator.** It re-derives the spec per
weekday, connectivity, piece normalisation and pairwise non-congruence, that \`sol\` tiles the region
exactly, uniqueness with a DIFFERENT solver (most-constrained empty square first, cap 2), \`nodes\`
by a fresh walk of the canonical definition, the weekday climb, the Sunday flag on real Sundays, and
that no mask repeats. 78 boards in a few seconds.

**Fit It is Snug for kids, on the kids track and NOT in the registry** (per the kids rules above):
5x5, two or three holes, four or five pieces of 3-6, and EVERY PIECE PRINTED THE WAY IT GOES IN.
There is no rotation on the kids board, so uniqueness is proved with the pieces FIXED, and
\`scripts/gen-kids-fitit.mjs\` keeps only boards with exactly one fixed-orientation tiling (sixty
boards, cycling). Tap a piece, tap the board; a piece that will not fit wobbles; "Show me one" drops
the next piece home for free, unlimited; Undo and Start over. \`scripts/verify-kids.mjs\` re-proves
every board with its own piece-driven solver.
`);
    applied++;
  } else skipped++;
}

console.log(`wire-snug: ${applied} edits applied, ${skipped} already present`);
