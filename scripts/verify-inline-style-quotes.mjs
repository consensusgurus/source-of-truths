// A <style>{CSS}</style> TEXT CHILD IS BANNED OUTRIGHT (2026-09-17).
//
// React escapes text children on the server (' to &#x27;, > to &gt;, " to
// &quot;, < and &), and <style> is an HTML RAW-TEXT element, so the browser
// never decodes them: the SSR stylesheet literally contains &#x27;. Two
// consequences, both site-wide until this date:
//
//   1. The CSS is wrong on first paint. `.a>svg` ships as `.a&gt;svg` (selector
//      invalid, rule dropped); content:'' and [data-stage-theme='light'] rules
//      drop; font-family:'JetBrains Mono' falls back.
//   2. HYDRATION FAILS. The client renders the same string unescaped, React
//      compares textContent, the two differ, and it throws #425 then #418/#423
//      and client-renders the whole root. The home and every daily logged six
//      console errors on every load for this reason.
//
// The previous version of this gate flagged only three quoted shapes and kept
// a KNOWN list, on the premise that "a client parent re-renders and repairs
// it". That repair IS the hydration failure. There is no benign text-child
// stylesheet, so the rule is now absolute: no KNOWN list, no shape test.
//
// THE FIX IS ALWAYS THE SAME: <style dangerouslySetInnerHTML={{ __html: CSS }} />.
// That path does no escaping, so SSR and client agree and the CSS is right at
// first paint. The 2026-09-17 codemod converted 199 blocks in 169 files.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'lib'];
const files = [];
const walk = (dir) => {
  let entries;
  try { entries = readdirSync(dir); } catch (e) { return; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== 'node_modules' && e !== '.next') walk(p); }
    else if (/\.(jsx|js|tsx)$/.test(e)) files.push(p);
  }
};
for (const r of roots) walk(r);

// COMMENTS ARE STRIPPED FIRST, because the fix is documented in prose that
// quotes the broken form verbatim.
const decomment = (s) => s
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

const findings = [];
for (const f of files) {
  const src = decomment(readFileSync(f, 'utf8'));
  // <style jsx> is styled-jsx: the compiler rewrites it into a scoped sheet, so
  // it is not a raw text child and must NOT be converted (that drops the scoping).
  const n = (src.match(/<style(\s[^>]*[^/>])?>\s*\{/g) || [])
    .filter((m) => !/\sjsx[\s>=]/.test(m)).length;
  if (n) findings.push(`${f.replace(/\\/g, '/')} (${n})`);
}

for (const f of findings) console.log(`✗   ${f} renders <style>{...}</style> as a text child - use dangerouslySetInnerHTML`);
console.log(`\n${files.length} files scanned, ${findings.length} with a text-child stylesheet.`);
process.exit(findings.length ? 1 : 0);
