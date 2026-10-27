// verify-freshness — the rules that stop an old version of the site sticking
// around (CLAUDE.md "No tab stays on an old deployment", 2026-10-27).
// Fails if any of the mechanisms is removed or undercut.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const fails = [];
const read = (p) => readFileSync(p, 'utf8');

const layout = read('app/layout.js');
if (!/<VersionGuard\s*\/>/.test(layout)) fails.push('app/layout.js no longer mounts <VersionGuard />');
if (!existsSync('app/api/version/route.js')) fails.push('app/api/version/route.js is missing');
else if (!/no-store/.test(read('app/api/version/route.js'))) fails.push('/api/version must answer no-store');

const cfg = read('next.config.js');
if (!/NEXT_PUBLIC_SOT_BUILD/.test(cfg)) fails.push('next.config.js no longer inlines NEXT_PUBLIC_SOT_BUILD');
if (!/staleTimes:\s*\{\s*dynamic:\s*0/.test(cfg)) fails.push('next.config.js staleTimes.dynamic must stay 0');
// Never put a browser cache lifetime on a page. Assets with hashed names are already immutable.
for (const m of cfg.matchAll(/key:\s*'Cache-Control',\s*value:\s*'([^']*)'/gi)) {
  if (/max-age=([1-9])/.test(m[1])) fails.push(`next.config.js headers() sets a browser cache lifetime: ${m[1]}`);
}

if (!/__sotInPlay/.test(read('app/quiz/[id]/useAbandonFlush.js'))) {
  fails.push('useAbandonFlush no longer registers its in-play probe (VersionGuard would reload under a player)');
}

// No service worker, anywhere: a SW cache on a site that deploys this often is the
// classic way to serve last week's site forever.
const walk = (d, out = []) => {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const p = join(d, n);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out); else if (/\.(jsx?|mjs)$/.test(n) && s.size < 400000) out.push(p);
  }
  return out;
};
for (const f of [...walk('app'), ...walk('lib'), ...walk('public')]) {
  const t = read(f);
  if (/serviceWorker\.register\(|caches\.open\(/.test(t)) fails.push(`${f} registers a service worker or Cache Storage`);
}

if (fails.length) { console.error('verify-freshness FAILED\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('verify-freshness ok');
