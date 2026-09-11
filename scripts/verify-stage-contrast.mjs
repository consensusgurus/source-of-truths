// HALF-CONVERTED ELEMENTS, in both directions.
//
//   node scripts/verify-stage-contrast.mjs
//
// The stage converter moves TEXT colours generically and SURFACES by rule, so
// the two can end up out of step on one element. Both directions are invisible
// to a build and to the eye until the page is open:
//
//   A. stage ink on a light literal ground  -> near-white type on a white card.
//      This is what the owner hit on Tuck's start gate.
//   B. a stage surface under a dark literal ink -> near-black type on the
//      near-black ground. Nobody had looked for this one.
//
// Per line, because these are inline style objects and a line is one element.
//
// THE BLIND SPOT, and what closes it (2026-08-31). Both checks above need a
// background on the SAME LINE as the colour, so neither can see a BOARD: Plot's
// clue ink was computed into a variable (`const col = ... : COLORS.ink`) on a
// line carrying no background at all, and it shipped at 1.24:1 on the dark
// register until a player reported it. A rendered sweep of all 80 dailies then
// found the same class on 18 of them, in both directions.
//
// A static checker cannot resolve a ground that is set by a different rule, so
// this file does NOT pretend to. It adds the part that IS static, direction C
// below, and the rest is covered by the LIVE sweep documented at the foot of
// this file, which is the instrument that found them.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// DIRECTION C. Inside a client's own <style> template, ONE rule that sets both a
// pale literal ground and the stage-aware ${INK}. Same rule, so no cross-element
// guessing is needed, and it is exactly how Tuck's rack tile (1.01:1), Babel's
// and Crunch's tiles went out: the stage sweep moved the ink and left the face.
const PALE = /background:\s*(?:\$\{COLORS\.(?:tile|paper|cream|accentSoft)\}|#(?:fff|[e-f][0-9a-f]{5})\b|\$\{(?:TILE_FACE|PAPER|NEWSPRINT|TILE)\})/;
const STAGE_INK = /color:\s*\$\{INK\}/;

// Text that is only legible on a LIGHT ground.
const DARK_INK = /color: (?:COLORS\.(?:ink|faded)|T\.ink)\b|color:\s*'#(?:0|1|2)[0-9a-f]{5}'|color:\s*'rgba\(2[08],\s*30,\s*36/;
// A LIGHT ground, inline or in the client's own CSS template.
const LIGHT_BG = /background(?:Color)?:\s*(?:T\.white|COLORS\.(?:cream|paper)|'#(?:fff|ffffff|[e-f][0-9a-f]{5})')|background:\s*(?:var\(--white\)|#(?:fff|[e-f][0-9a-f]{5}))\b/;
const STAGE_BG = /background(?:Color)?:\s*(?:STAGE \? (?:SURF|'var\(--stg)|'var\(--stg-(?:surf|raise|panel|ground))|background:\$\{STAGE/;

let bad = 0;
let n = 0;
const swatches = [];
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of readdirSync(join('app', d.name))) {
    if (!/^[A-Z][A-Za-z]*Client\.jsx$/.test(f)) continue;
    const rel = join('app', d.name, f);
    const src = readFileSync(rel, 'utf8');
    if (!/const STAGE = isStage\(/.test(src)) continue;
    n++;
    src.split('\n').forEach((l, i) => {
      const gatedBg = /background(?:Color)?:\s*(?:STAGE\s*\?|\$\{STAGE)/.test(l);
      const gatedInk = /color:\s*(?:STAGE\s*\?|\$\{STAGE)/.test(l);
      // A .cl-key is re-grounded by an !important rule in the client's own
      // stylesheet, so its inline light background never applies on the stage.
      // An !important stylesheet rule beats a non-important inline style.
      if (/className="cl-key/.test(l)) return;
      // The ELSE branch of a STAGE ternary that spans lines. A per-line counter
      // cannot see that `: { background: T.white ... }` is the non-stage half.
      if (/^\s*[:?]\s*[{']/.test(l)) return;
      // A LEGEND SWATCH shows the reader a colour the board actually uses, so
      // it must MATCH the board rather than be re-grounded. Collected and
      // printed at the end instead of failing: whether each still matches is a
      // judgement, and Crux's legend was genuinely wrong once.
      if (/label:.*style:\s*\{/.test(l)) { swatches.push(`${rel}:${i + 1}`); return; }
      // DIRECTION A. Any ungated light ground on a converted client. NOT paired
      // with an ink test on the same line: a card and its text are different
      // elements on different lines, which is exactly why Tuck's white gate with
      // near-white type slipped past the first version of this check.
      if (LIGHT_BG.test(l) && !gatedBg) {
        console.log(`\u2717 ${rel}:${i + 1}  light ground on the stage`);
        console.log(`    ${l.trim().slice(0, 130)}`);
        bad++;
      } else if (PALE.test(l) && STAGE_INK.test(l) && !/STAGE \?/.test(l.split('background:')[1] || '')) {
        // DIRECTION C. A pale face carrying the stage's near-white ink.
        console.log(`\u2717 ${rel}:${i + 1}  stage ink on a pale literal face`);
        console.log(`    ${l.trim().slice(0, 130)}`);
        bad++;
      } else if (DARK_INK.test(l) && STAGE_BG.test(l) && !gatedInk) {
        // DIRECTION B. The reverse, which nobody had looked for: a stage surface
        // under ink that only works on paper.
        console.log(`\u2717 ${rel}:${i + 1}  dark ink on a stage ground`);
        console.log(`    ${l.trim().slice(0, 130)}`);
        bad++;
      }
    });
  }
}
/* DIRECTION D — THE SHARED COMPONENTS, which is where this checker was blind.
   Everything above walks app/<game>/<Name>Client.jsx carrying `const STAGE =
   isStage(`. That is 80 files, and every shared component that renders INSIDE
   .stage-page — ReportIssue, the end card, the panels, the modals — was outside
   the scan entirely. app/ReportIssue.jsx printed --stg-ink on a hardcoded
   var(--white) sheet at 1.11:1 for as long as the stage has existed, and a
   PLAYER reported it (2026-09-01), by typing into the box they could not read.

   The signature of a half-converted shared file: it references a stage token at
   all (so its ink can be near-white on the dark register) AND carries a light
   literal ground that is not itself register-aware. Reported as CANDIDATES, not
   failures, because a shared component may legitimately sit on a light surface
   — ReportIssue's own header comment claimed exactly that and was wrong — so
   each one is a LIVE read, never a reasoned one.

   The sweep that followed: 31 candidates over 6 files, three of them real, all
   in DailyBoardPanel and all in states an at-rest sweep cannot reach (a :hover
   at 1.42:1, a calendar legend describing a board it no longer looked like, and
   a nav button at 2.07:1 that only exists once the archive tile is open). The
   rest were sound — a .loft-* rule gated by `STAGE ? undefined : 'loft-report'`,
   a [data-stage-theme='light'] block setting ground and ink together, and a
   page that is not on the stage at all. */
const SHARED_LIGHT = new RegExp([
  String.raw`background(?:Color)?:\s*(?:T\.white|COLORS\.(?:cream|paper|tile|white|accentSoft))\b`,
  String.raw`background(?:Color)?:\s*['"]#(?:fff|ffffff|[e-f][0-9a-f]{5})['"]`,
  String.raw`background(?:-color)?:\s*var\(--white\)`,
  String.raw`background(?:-color)?:\s*#(?:fff|[e-f][0-9a-f]{5})\b`,
].join('|'), 'i');
// Already register-aware on this line, or scoped to the light register by its
// own selector — not a candidate either way.
const SHARED_OK = /STAGE\s*\?|\$\{STAGE|var\(--stg-|isStage\(|\[data-stage-theme='light'\]|\bdark\s*\?/;
const SHARED_STAGEY = /var\(--stg-|isStage\(|stage-page/;

const shared = [];
(function walkShared(dir) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.name === 'node_modules' || d.name.startsWith('.')) continue;
    const p = join(dir, d.name);
    if (d.isDirectory()) { walkShared(p); continue; }
    if (!/\.(jsx|js)$/.test(d.name)) continue;
    const rel = p.replace(/\\/g, '/');
    if (/^app\/[a-z0-9-]+\/[A-Z][A-Za-z]*Client\.jsx$/.test(rel)) continue;  // covered above
    const src = readFileSync(p, 'utf8');
    if (!SHARED_STAGEY.test(src)) continue;
    src.split('\n').forEach((l, i) => {
      if (SHARED_LIGHT.test(l) && !SHARED_OK.test(l)) {
        shared.push(`${rel}:${i + 1}  ${l.trim().slice(0, 110)}`);
      }
    });
  }
})('app');

if (shared.length) {
  console.log(`\n… ${shared.length} light ground(s) in SHARED components that render on the stage.`);
  console.log('   Candidates, not failures: read each one LIVE before changing it.');
  for (const s of shared) console.log(`   ${s}`);
}

/* DIRECTION E — A MARK ON A SQUARE, MEASURED RATHER THAN READ (2026-09-11).
   Turn's legal-move pip and Valet's exit targets were one literal,
   rgba(255,255,255,0.42), on a square filled with --stg-surf. Correct on the
   dark register and 1.00:1 on the light one, where --stg-surf is #ffffff: the
   pip was not dim, it was ABSENT, and a Turn player in light mode was shown
   none of the squares they were allowed to play. Nothing above can see it —
   the fill and the ground are set by different rules in different files, which
   is the blind spot this file's header admits to and hands to the live sweep.

   A mark is not a hairline: it IS the affordance, so it owes the same 3:1 a
   boundary owes and then some. What makes it checkable at all is that both
   halves are now tokens, so the pair can be composited here: each register's
   value over its OWN square, which is --stg-surf over --stg-ground, never the
   page ground on its own. Move a dot or move --stg-surf and this says so. */
const css = readFileSync('app/globals.css', 'utf8');
const blockOf = (head) => {
  const at = css.indexOf(head);
  return at < 0 ? '' : css.slice(at, css.indexOf('\n}', at));
};
const REG = [
  ['dark', blockOf('.stage-page {')],
  ['light', blockOf(".stage-page[data-stage-theme='light'] {")],
];
const tok = (block, name) => {
  const m = block.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
};
const px = (s) => {
  let m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)$/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16), a: 1 };
  return null;
};
const over = (f, b) => ({ r: f.a * f.r + (1 - f.a) * b.r, g: f.a * f.g + (1 - f.a) * b.g, b: f.a * f.b + (1 - f.a) * b.b, a: 1 });
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
const ratio = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };

let marks = 0;
for (const [reg, block] of REG) {
  const ground = px(tok(block, 'stg-ground') || '');
  const surf = px(tok(block, 'stg-surf') || '');
  if (!ground || !surf) { console.log(`✗ globals.css: ${reg} register is missing --stg-ground or --stg-surf`); marks++; continue; }
  const square = over(surf, ground);
  for (const name of ['stg-cell-dot', 'stg-cell-dot2']) {
    const v = px(tok(block, name) || '');
    if (!v) { console.log(`✗ globals.css: --${name} missing on the ${reg} register`); marks++; continue; }
    const r = ratio(over(v, square), square);
    if (r < 3) { console.log(`✗ --${name} is ${r.toFixed(2)}:1 on the ${reg} register's own square — a mark on a square owes 3:1`); marks++; }
  }
  /* DIRECTION F — A LETTER ON A SQUARE, which is TYPE and owes 4.5 (2026-09-11).
     Same shape as E and the same blind spot, one rung up: Glyph's given letters
     were the literal #0f766e, a teal picked for the paper register, printed on
     a stage square. 3.15:1 on a bare --stg-surf square and 2.83 on Glyph's real
     one, where a board of --stg-surf cells sits on a --stg-surf card and the
     two lifts stack (owner report). A dot is an affordance and clears at 3; a
     letter is the content and clears at 4.5, so it gets its own threshold
     rather than riding E's. Measured on the single-lift square for consistency
     with E — the stacked board reads a little lower, so leave headroom. */
  for (const name of ['stg-cell-given']) {
    const v = px(tok(block, name) || '');
    if (!v) { console.log(`✗ globals.css: --${name} missing on the ${reg} register`); marks++; continue; }
    const r = ratio(over(v, square), square);
    if (r < 4.5) { console.log(`✗ --${name} is ${r.toFixed(2)}:1 on the ${reg} register's own square — a letter on a square owes 4.5:1`); marks++; }
  }
}
if (!marks) console.log('marks: the dot tokens clear 3:1 and the given letter clears 4.5:1 on their own square, both registers');
bad += marks;

if (swatches.length) {
  console.log(`\n\u2026 ${swatches.length} legend swatch(es) skipped — a swatch must MATCH its board, so check by eye:`);
  console.log('   ' + swatches.join(' '));
}
console.log(bad ? `\n${bad} half-converted element(s) across ${n} clients` : `clean: ${n} clients, no half-converted elements`);

// THE LIVE SWEEP, which is what catches a board. Run it in the browser on each
// /<game>?p=1&theme=dark, after clicking Start, and read the result: it walks
// every rendered element, composites the REAL stacked ground behind it (an
// ancestor chain of translucent surfaces, which is why a single getComputedStyle
// is not enough), and reports anything under 3:1. Composite BOTTOM UP; folding
// each layer as you walk outward reports a:1 on the first translucent surface
// and makes every element look like it sits on paper, which is a false clean.
//
//   const ground = (el) => { const L = []; let n = el;
//     while (n && n !== document.documentElement) {
//       const q = px(getComputedStyle(n).backgroundColor);
//       if (q && q.a > 0) { L.push(q); if (q.a >= 0.999) break; }
//       n = n.parentElement; }
//     let a = { r: 11, g: 15, b: 26, a: 1 };
//     for (let i = L.length - 1; i >= 0; i--) a = over(L[i], a);
//     return a; };
//
// Do this before shipping any change to a board's palette, and after any stage
// sweep that touches ink or surfaces.
process.exit(bad ? 1 : 0);
