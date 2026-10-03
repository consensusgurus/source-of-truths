// verify-daily-chrome — every <DailyChrome> on a page must say whether the
// page is on the Loft, by passing a `loft` prop.
//
// WHY (2026-10-03): DailyChrome draws the A to Z "Today's slate" rail whenever
// the page is NOT Loft, and it decides that from its props. Finesse shipped on
// 2026-09-03 calling a bare <DailyChrome />, so it was the one daily page with
// the rail on it, and it carried no slug either, so its own chip never lit.
// Nothing errored and nothing looked broken, which is why it lasted a month.
//
// Discovered by verify-all automatically.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== 'node_modules' && !f.startsWith('.')) walk(p); }
    else if (/\.jsx?$/.test(f)) files.push(p);
  }
})(join(root, 'app'));

let bad = 0, seen = 0;
for (const f of files) {
  // Comments mention <DailyChrome /> by name (LoftCap does), so drop them first.
  const src = readFileSync(f, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
  for (const m of src.matchAll(/<DailyChrome\b([^>]*)\/?>/g)) {
    seen++;
    const attrs = m[1];
    const rel = f.slice(root.length + 1);
    if (!/\bloft\b/.test(attrs)) { bad++; console.log(`✗ ${rel}: <DailyChrome${attrs}> passes no loft prop (the slate rail will show)`); }
    else if (/Client\.jsx$/.test(f) && !/app[\\/]quiz[\\/]/.test(f) && !/\bslug=/.test(attrs)) { bad++; console.log(`✗ ${rel}: <DailyChrome${attrs}> passes no slug`); }
  }
}
console.log(`verify-daily-chrome: ${seen} mounts, ${bad} failed`);
process.exit(bad ? 1 : 0);
