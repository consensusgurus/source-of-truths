// verify-fill: the checker for Fill (app/fill/puzzles.js), discovered by
// scripts/verify-all.mjs. Imports nothing from scripts/gen-fill.mjs; every rule
// is re-derived from the rows, and uniqueness is proved by this file's own search.
//   - one board a day from 2026-11-01, quizId / dateLabel / sunday from `live`
//   - the ramp: Mon, Tue 16 words; Wed, Thu 17; Fri, Sat 18 (board at most
//     15x15); Sunday Edition 22 (at most 17x17)
//   - one slot per word, every word 4 to 11 letters, slot lengths and word
//     lengths are the same multiset
//   - slots are listed in reading order (never paired with the word list)
//   - the slots form a proper criss-cross: every slot crosses another, no two
//     slots in the same direction overlap or touch end to end, and every pair of
//     side-by-side letters belongs to one slot (no stray runs)
//   - every given letter sits in a slot and agrees with the unique fill, and at
//     most one word's worth plus three single letters is given
//   - EXACTLY ONE FILL: counted by a search with a cap of 2
//   - the words are real members of the theme in scripts/scram-pools.mjs, no word
//     twice on a board, no word again within 30 days, the theme not repeated
//     within 3 days, and never that day's Scour theme
import { checker, checkDays, dowOf } from './six-verify-common.mjs';
import { THEMES } from './scram-pools.mjs';
const { PUZZLES } = await import(new URL('../app/fill/puzzles.js', import.meta.url));
const { PUZZLES: SCOUR } = await import(new URL('../app/scour/puzzles.js', import.meta.url));
const { bad, done } = checker('fill');
checkDays('fill', PUZZLES, bad);
const SPEC = { 1: [16, 15], 2: [16, 15], 3: [17, 15], 4: [17, 15], 5: [18, 15], 6: [18, 15], 0: [22, 17] };
const L = (w) => w.replace(/ /g, '');
const norm = (w) => w.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
const themeWords = Object.fromEntries(THEMES.map((t) => [t.id, new Set(t.words.trim().split(/\s+/).map(norm))]));
const scourTheme = Object.fromEntries(SCOUR.map((p) => [p.live, p.themeId]));
const cellsOf = ([r, c, d, n]) => Array.from({ length: n }, (_, i) => (d === 'a' ? [r, c + i] : [r + i, c]));

function fills(p, cap) {
  const W = p.words.map(L), used = new Array(W.length).fill(false), done2 = new Array(p.slots.length).fill(false);
  const g = Array.from({ length: p.rows }, () => Array(p.cols).fill(''));
  for (const [r, c, ch] of p.given) g[r][c] = ch;
  const cs = p.slots.map(cellsOf);
  const out = [];
  const opts = (s) => { const o = [], seen = new Set(); W.forEach((w, i) => { if (used[i] || w.length !== cs[s].length || seen.has(w)) return; if (cs[s].every(([r, c], k) => !g[r][c] || g[r][c] === w[k])) { o.push(i); seen.add(w); } }); return o; };
  (function go() {
    if (out.length >= cap) return;
    let b = -1, bo = null;
    for (let s = 0; s < cs.length; s++) { if (done2[s]) continue; const o = opts(s); if (!o.length) return; if (!bo || o.length < bo.length) { b = s; bo = o; } }
    if (b < 0) { out.push(g.map((x) => x.map((ch) => ch || '.').join(''))); return; }
    for (const i of bo) {
      const prev = cs[b].map(([r, c]) => g[r][c]);
      cs[b].forEach(([r, c], k) => { g[r][c] = W[i][k]; }); used[i] = true; done2[b] = true;
      go();
      used[i] = false; done2[b] = false; cs[b].forEach(([r, c], k) => { g[r][c] = prev[k]; });
      if (out.length >= cap) return;
    }
  })();
  return out;
}

const lastSeen = new Map(), themeSeen = new Map();
const dd = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
for (const p of PUZZLES) {
  const [want, max] = SPEC[dowOf(p.live)];
  if (p.words.length !== want) bad(p.num, `${p.words.length} words, should be ${want}`);
  if (p.rows > max || p.cols > max) bad(p.num, `board ${p.rows}x${p.cols} over ${max}`);
  if (p.slots.length !== p.words.length) bad(p.num, 'slots and words differ in number');
  const sl = p.slots.map((s) => s[3]).sort((a, b) => a - b).join(), wl = p.words.map((w) => L(w).length).sort((a, b) => a - b).join();
  if (sl !== wl) bad(p.num, 'slot lengths and word lengths differ');
  if (p.words.some((w) => L(w).length < 4 || L(w).length > 11 || !/^[A-Z ]+$/.test(w))) bad(p.num, 'a word outside 4 to 11 plain letters');
  if (new Set(p.words).size !== p.words.length) bad(p.num, 'a word twice');
  const sorted = p.slots.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : 1));
  if (JSON.stringify(sorted) !== JSON.stringify(p.slots)) bad(p.num, 'slots are not in reading order');
  // the shape
  const own = Array.from({ length: p.rows }, () => Array.from({ length: p.cols }, () => []));
  p.slots.forEach((s, i) => cellsOf(s).forEach(([r, c]) => { if (r >= p.rows || c >= p.cols) bad(p.num, 'a slot runs off the board'); else own[r][c].push(i); }));
  for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
    if (own[r][c].length > 2) bad(p.num, `square ${r},${c} in three slots`);
    if (own[r][c].length === 2 && p.slots[own[r][c][0]][2] === p.slots[own[r][c][1]][2]) bad(p.num, `two ${p.slots[own[r][c][0]][2]} slots overlap at ${r},${c}`);
    for (const [r2, c2, d] of [[r, c + 1, 'a'], [r + 1, c, 'd']]) {
      if (r2 >= p.rows || c2 >= p.cols || !own[r][c].length || !own[r2][c2].length) continue;
      if (!own[r][c].some((i) => own[r2][c2].includes(i) && p.slots[i][2] === d)) bad(p.num, `stray run at ${r},${c}`);
    }
  }
  p.slots.forEach((s, i) => { if (!cellsOf(s).some(([r, c]) => own[r] && own[r][c] && own[r][c].length === 2)) bad(p.num, `slot ${i} crosses nothing`); });
  // uniqueness
  const f = fills(p, 2);
  if (f.length !== 1) bad(p.num, `${f.length} fills, should be exactly 1`);
  else for (const [r, c, ch] of p.given) if (f[0][r][c] !== ch) bad(p.num, `given ${r},${c} disagrees with the fill`);
  if (p.given.length > Math.max(...p.words.map((w) => L(w).length)) + 3) bad(p.num, `${p.given.length} givens, too many`);
  // theme and freshness
  const tw = themeWords[p.themeId];
  if (!tw) bad(p.num, `unknown theme ${p.themeId}`);
  else for (const w of p.words) if (!tw.has(w)) bad(p.num, `${w} is not in the ${p.themeId} pool`);
  if (scourTheme[p.live] === p.themeId) bad(p.num, 'same theme as that day’s Scour');
  if (themeSeen.has(p.themeId) && dd(themeSeen.get(p.themeId), p.live) < 3) bad(p.num, `theme ${p.themeId} back within 3 days`);
  themeSeen.set(p.themeId, p.live);
  for (const w of p.words) { if (lastSeen.has(w) && dd(lastSeen.get(w), p.live) < 30) bad(p.num, `${w} back within 30 days`); lastSeen.set(w, p.live); }
}
done(PUZZLES);
