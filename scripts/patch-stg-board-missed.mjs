// PATCH: the seven board wrappers scripts/patch-stg-board.mjs never reached.
//
// The board card is gone on the stage (owner, 2026-08-31) and the rule that
// removes it is `.stage-page .stg-board` in app/globals.css. The original
// patch took its hook from the `loft-card` marker, and its very first line is
//
//     if (!/className=\{[^\n]*loft-card/.test(src)) continue;
//
// a SILENT skip. Seven clients draw a board card whose wrapper never carried
// loft-card, so they were skipped, no error was raised, and they have painted
// a card on the stage ever since (owner report, 2026-09-11, on Glyph).
//
// Marking them by hand rather than widening that script's anchor set: the
// seven have seven different shapes (a literal className, four bare divs, two
// with an unconditional paper drop-shadow), and a hook broad enough to catch
// all of them would also catch the raised panels that are meant to stay.
//
// NOT PATCHED, and each for a reason, all confirmed by reading them:
//   emcee / encore  the CLUE STRIP, the second panel under the board. The
//                   original script names these two as FIRST_OF_TWO and marks
//                   only the board on purpose.
//   alibi / sworn / hearsay / axiom
//                   the briefing paragraph above the board, prose in a raised
//                   panel. Not the play surface. The gate rule deliberately
//                   left prose its inset; this is the same shape.
//
// Every anchor must match EXACTLY ONCE. Zero means origin moved under us, two
// means the anchor is not specific enough and the patch would land twice; both
// throw rather than write, per the deploy section's stale-base rule.
import { readFileSync, writeFileSync } from 'node:fs';

// Glyph is the one that already has a className, so it keeps it: .gl-card
// carries the board's padding in the client's own stylesheet.
const EDITS = [
  ['app/glyph/GlyphClient.jsx',
   '<div className="gl-card" style={{ background: STAGE ? SURF : T.white,',
   "<div className={STAGE ? 'gl-card stg-board' : 'gl-card'} style={{ background: STAGE ? SURF : T.white,"],

  ['app/warmer/WarmerClient.jsx',
   "<div style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 16px 16px',",
   "<div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : T.white, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, borderRadius: 10, padding: '15px 16px 16px',"],

  // The three crowd games share one board panel, byte for byte, and it is the
  // only element in each file with an UNCONDITIONAL paper drop-shadow, so the
  // stage was carrying a 5px hard shadow as well as the card.
  ['app/feud/FeudClient.jsx',
   "<div style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px',",
   "<div className={STAGE ? 'stg-board' : undefined} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px',"],
  ['app/outrank/OutrankClient.jsx',
   "<div style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px',",
   "<div className={STAGE ? 'stg-board' : undefined} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px',"],
  ['app/outwit/OutwitClient.jsx',
   "<div style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px',",
   "<div className={STAGE ? 'stg-board' : undefined} style={{ background: `var(--stg-surf, ${COLORS.accentSoft})`, border: `2px solid var(--stg-line, ${COLORS.ink})`, borderRadius: 10, padding: '15px 17px 12px',"],

  ['app/blocks/BlocksClient.jsx',
   "<div style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, position: 'relative' }}>",
   "<div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, position: 'relative' }}>"],
  ['app/sweep/SweepClient.jsx',
   "<div style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>",
   "<div className={STAGE ? 'stg-board' : undefined} style={{ background: STAGE ? SURF : '#fff', border: STAGE ? `1px solid ${SURF_B}` : `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14 }}>"],
];

let touched = 0;
for (const [file, from, to] of EDITS) {
  const src = readFileSync(file, 'utf8');
  const hits = src.split(from).length - 1;
  if (hits !== 1) throw new Error(`${file}: anchor matched ${hits} times, expected 1`);
  writeFileSync(file, src.replace(from, to));
  touched++;
}
console.log(`patched ${touched} board wrappers`);
