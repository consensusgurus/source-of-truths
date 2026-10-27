#!/usr/bin/env node
// verify-full-bleed-corners.mjs
//
// globals.css rounds EVERY button, input, select and textarea 8px. A row or
// band that is built from a <button> and stretched edge to edge inside a framed
// panel (width:100% with its own border removed) inherits that 8px. While the
// row is transparent nobody sees it; the moment it fills (a selected black row,
// a coloured card head) its corners curve away from the panel edge and leave
// notches, so the fill reads as not covering the element.
//
// Rule: a CSS rule that stretches an element full width AND strips its border
// must also say what its corners are (border-radius). Set it to 0 for a
// full-bleed row, or to the value you want. Anything else fails this gate.
//
// Usage:
//   node scripts/verify-full-bleed-corners.mjs            # working tree
//   REF=origin/main node scripts/verify-full-bleed-corners.mjs   # a git ref
//
// Opt out on one rule with a trailing comment inside the block:
//   /* corners-ok: why */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REF = process.env.REF || '';
const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
// Only files that stretch something to width:100% can hold the defect.
const grepped = (() => { try { return git(`grep -l -E "width *: *100%" ${REF} -- app lib`); } catch { return ''; } })();
const files = grepped.split('\n').map((f) => (REF ? f.replace(`${REF}:`, '') : f)).filter((f) => /\.(css|jsx|js)$/.test(f) && !/puzzles\.js$|\/bank|\.new$/.test(f));
const read = (f) => (REF ? git(`show ${REF}:${f}`) : readFileSync(f, 'utf8'));

const FULL = /(?:^|[;{\s])width\s*:\s*100%/;
const NOBORDER = /(?:^|[;{\s])border\s*:\s*(?:0|none)\b/;
const RADIUS = /border(?:-(?:top|bottom)-(?:left|right))?-radius\s*:/;

let bad = 0;
for (const f of files) {
  let src;
  try { src = read(f); } catch { continue; }
  // Template-literal CSS interpolates ${...}; blank it so its braces do not split rules.
  src = src.replace(/\$\{[^{}]*\}/g, (x) => ' '.repeat(x.length));
  if (!src.includes('width') || !src.includes('border')) continue;
  // Only CSS text: whole .css files, or template-literal CSS in components.
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(src))) {
    const sel = m[1].trim().split('\n').pop().trim();
    const body = m[2];
    if (!sel || /[()=;]|^\/\/|=>/.test(sel.replace(/:(?:not|is|where|has)\([^)]*\)/g, ''))) continue;
    if (!/^[.#\[a-z*:]/i.test(sel)) continue;
    if (!FULL.test(body) || !NOBORDER.test(body)) continue;
    if (RADIUS.test(body) || /corners-ok/.test(body)) continue;
    // The same selector may set its radius in a later rule; accept that.
    const later = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*border(?:-[a-z-]+)?-radius', 'm');
    if (later.test(src)) continue;
    const line = src.slice(0, m.index + m[1].length).split('\n').length;
    console.log(`${f}:${line}  ${sel}  (width:100% + border:0, no border-radius)`);
    bad++;
  }
}
if (bad) {
  console.log(`\n${bad} full-bleed rule(s) inherit the global 8px button radius. Add border-radius:0 (or the radius you mean).`);
  process.exit(1);
}
console.log('full-bleed corners: OK');
