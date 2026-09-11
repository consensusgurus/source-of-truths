// THE BOARD CARD IS GONE ON THE STAGE, AND NOTHING CHECKED THAT IT STAYED GONE.
//
//   node scripts/verify-stage-board.mjs
//
// The owner's 2026-08-31 ruling is in app/globals.css: on the stage the ground
// already IS the play surface, so a card under the board paints --stg-surf
// beneath a board that paints --stg-surf itself and the two stack into a
// faintly lighter rectangle nobody designed. The rule that removes it is
// `.stage-page .stg-board`, and the class was placed by
// scripts/patch-stg-board.mjs.
//
// THAT SCRIPT'S HOOK WAS THE `loft-card` MARKER, and its first line is a
// SILENT skip of any client that does not carry one:
//
//     if (!/className=\{[^\n]*loft-card/.test(src)) continue;
//
// Seven boards were never marked. Glyph's wrapper is a literal
// className="gl-card"; warmer, feud, outrank, outwit, blocks and sweep are
// bare divs. All seven kept their card for six weeks and the owner found it by
// looking at a board (2026-09-11). Nothing could have reported it: the class
// is absent, so the rule simply does not match, and an unmatched CSS rule is
// the quietest failure there is.
//
// WHAT THIS CHECKS, and why that shape. A board wrapper has one property no
// raised panel shares: it is revealed BY THE GATE. So the signature is a
// card-shaped element (a stage surface, a border and a radius) opening within
// two lines of a `!preStart` gate. That is narrow enough to leave the ~190
// other `STAGE ? SURF` panels alone -- stat rows, prompt cards, docks, modals
// -- and wide enough that a new game copying any existing board wrapper is
// caught on its first run.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Card-shaped on the stage: it paints a surface, a boundary and a radius.
const SURFACE = /background(?:Color)?:\s*(?:STAGE \? SURF|`var\(--stg-surf|STAGE \? `?var\(--stg-surf)/;
const BOUNDARY = /border:\s*(?:STAGE \?|`|'1|'2)/;
const RADIUS = /borderRadius:\s*\d/;
const MARKED = /stg-board|stg-gate/;

// NOT A BOARD, each read and each deliberate. Keyed by file:line-ish anchor
// text rather than a line number, so an edit above them cannot silently move
// the exemption onto something else.
const ALLOW = [
  // The CLUE STRIP, the second panel under the board. patch-stg-board.mjs
  // names emcee and encore as FIRST_OF_TWO and marks only the board on
  // purpose: the strip is a shape you read the contents of.
  ['app/emcee/EmceeClient.jsx', 'mc-cols'],
  ['app/encore/EncoreClient.jsx', 'ec-cols'],
  // The briefing paragraph above the board. Prose in a raised panel, not the
  // play surface; the gate rule deliberately leaves prose its inset and this
  // is the same shape.
  ['app/alibi/AlibiClient.jsx', 'Georgia, serif'],
  ['app/sworn/SwornClient.jsx', 'Georgia, serif'],
  ['app/hearsay/HearsayClient.jsx', 'Georgia, serif'],
  ['app/axiom/AxiomClient.jsx', 'Find the one rule'],
];
const allowed = (file, block) =>
  ALLOW.some(([f, mark]) => f === file && block.includes(mark));

let bad = 0;
let checked = 0;
let boards = 0;
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of readdirSync(join('app', d.name))) {
    if (!/^[A-Z][A-Za-z]*Client\.jsx$/.test(f)) continue;
    const rel = join('app', d.name, f).replace(/\\/g, '/');
    const src = readFileSync(rel, 'utf8');
    if (!/const STAGE = isStage\(/.test(src)) continue;   // unconverted
    checked++;
    const L = src.split('\n');
    L.forEach((line, i) => {
      if (!/\{\s*!preStart\b/.test(line)) return;
      // The element the gate reveals: the next opening <div, at most two lines
      // down (a gate can carry a second condition on its own line).
      for (let j = i + 1; j < Math.min(i + 3, L.length); j++) {
        const el = L[j];
        if (!/^\s*<div/.test(el)) continue;
        if (!(SURFACE.test(el) && BOUNDARY.test(el) && RADIUS.test(el))) break;
        boards++;
        // The className can sit a line or two above the style object.
        const win = L.slice(Math.max(0, j - 3), j + 1).join('\n');
        if (MARKED.test(win)) break;
        // A wrapper whose STAGE branch already paints nothing needs no class.
        if (/STAGE[\s\S]{0,40}\?\s*\{\s*background:\s*'transparent'/.test(win)) break;
        if (allowed(rel, L.slice(j, j + 3).join('\n'))) break;
        console.log(`✗ ${rel}:${j + 1}  board card painted on the stage — mark the wrapper stg-board`);
        console.log(`    ${el.trim().slice(0, 130)}`);
        bad++;
        break;
      }
    });
  }
}

console.log(bad
  ? `\n${bad} unmarked board card(s) across ${checked} converted clients`
  : `clean: ${boards} gated board wrapper(s) across ${checked} converted clients, every one marked or exempt`);
process.exit(bad ? 1 : 0);
