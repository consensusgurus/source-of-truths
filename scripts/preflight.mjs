// scripts/preflight.mjs — the one command to run before pushing.
//
// WHY THIS EXISTS. On 2026-09-04 a nineteen-game bank restock shipped without
// the gate. Each changed game's own checker was green, which felt like proof
// and was not: `verify-encore` was red on 226 boards from a shared wordbank the
// restock had widened, and 72 British spellings sat in freshly authored copy
// that no checker screened. Both were found by an audit AFTER the push. The
// gate had been available the whole time; the failure was that running it was a
// thing to remember rather than a thing to run.
//
//   node scripts/preflight.mjs                 full gate, the pre-push run
//   node scripts/preflight.mjs --fast          skip next build (iterating only)
//   node scripts/preflight.mjs --changed       verify only what the change reaches
//   node scripts/preflight.mjs --skip-install  node_modules is already current
//
// PASTE THE SUMMARY INTO THE COMMIT MESSAGE. That is the point of printing it:
// a skipped gate should be conspicuous in the history rather than invisible.
//
// --changed and --fast are for the loop, NOT for the push. The full run is the
// gate CLAUDE.md names, and a subset cannot see a checker for a game the change
// did not touch, which is the exact case that got through.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const args = process.argv.slice(2);
const fast = args.includes('--fast');
const changed = args.includes('--changed');
const skipInstall = args.includes('--skip-install');

const steps = [];
const run = (name, cmd, argv, opts = {}) => {
  const t0 = Date.now();
  process.stdout.write(`\n──── ${name} ────\n`);
  const r = spawnSync(cmd, argv, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, ...opts });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  const ok = opts.pass ? opts.pass(out, r.status) : r.status === 0;
  steps.push({ name, ok, secs, tail: out.trim().split('\n').slice(-3).join(' | ') });
  // The blast-radius step IS its list: truncating it to the last 12 lines hid
  // most of the checkers on a 43-file change, which is the exact question the
  // step exists to answer. Everything else is summarised by its tail.
  console.log(opts.full ? out.trim() : out.trim().split('\n').slice(-12).join('\n'));
  return { out, ok };
};

// 1. deps. Without them verify-endgame-board false-fails on a missing
//    lucide-react, which reads exactly like a real defect.
if (!skipInstall && !existsSync(join(root, 'node_modules'))) {
  run('npm ci', 'npm', ['ci', '--ignore-scripts', '--silent']);
} else {
  steps.push({ name: 'npm ci', ok: true, secs: '0', tail: 'skipped, node_modules present' });
}

// 2. blast radius. Not a pass/fail, a REPORT: which checkers this change can
//    reach, including the ones for games it never touched.
run('blast radius', process.execPath, [join(here, 'blast-radius.mjs')], { full: true });

// 3. Parse every changed source file. `next lint` needs an eslint config this
//    repo does not commit and prompts to create one, so it cannot be the gate
//    here; esbuild parsing is the documented fast check for a many-file edit,
//    and it catches the breakers that actually happen (a stray comma from a
//    splice, a backtick inside a <style> block, a NUL byte).
{
  //    Untracked files count: a bulk restock adds brand new generators, and
  //    `git diff` cannot see a file git has never heard of. The 2026-09-06 run
  //    had 12 new scripts that this step reported as "11 files parse".
  const listed = (argv) => spawnSync('git', argv, { cwd: root, encoding: 'utf8' }).stdout.split('\n');
  const files = [...new Set([
    ...listed(['diff', '--name-only', 'origin/main']),
    ...listed(['ls-files', '--others', '--exclude-standard']),
  ].map((f) => f.trim()))]
    .filter((f) => /\.(mjs|jsx?)$/.test(f) && existsSync(join(root, f)));
  const broken = [];
  for (const f of files) {
    const r = spawnSync('npx', ['esbuild', f, '--loader:.js=jsx', '--loader:.jsx=jsx', '--outfile=/dev/null'],
      { cwd: root, encoding: 'utf8' });
    if (r.status !== 0) broken.push(`${f}: ${(r.stderr || '').split('\n')[1] || 'parse error'}`);
  }
  steps.push({ name: 'parse changed files', ok: !broken.length, secs: '0',
    tail: broken.length ? broken.slice(0, 3).join(' | ') : `${files.length} file(s) parse` });
  console.log(`\n──── parse changed files ────\n${broken.length ? broken.join('\n') : `${files.length} changed source file(s) parse`}`);
}

// 4. THE GATE.
run(changed ? 'verify-all --changed' : 'verify-all',
  process.execPath, [join(here, 'verify-all.mjs'), ...(changed ? ['--changed'] : []), '--quiet']);

// 5. next build. "Compiled successfully" is the pass; the page-data collection
//    error that follows it is the known missing-SUPABASE artifact in a sandbox.
if (!fast) {
  run('next build', 'npx', ['next', 'build'], {
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=7000' },
    pass: (out) => /Compiled successfully/.test(out),
  });
} else {
  steps.push({ name: 'next build', ok: true, secs: '0', tail: 'SKIPPED (--fast)' });
}

console.log('\n════ preflight ════');
for (const s of steps) console.log(`${(s.ok ? '✓ PASS' : '✗ FAIL').padEnd(8)} ${s.name.padEnd(22)} ${s.secs}s`);
const bad = steps.filter((s) => !s.ok);
if (bad.length) {
  console.log(`\n${bad.length} step(s) failing: ${bad.map((s) => s.name).join(', ')}`);
  console.log('Do not push. If a failure predates your change, prove it: copy the tree,');
  console.log('git checkout <base> -- . , run the same checker there, and diff with paths stripped.');
} else if (fast || changed) {
  console.log('\nGreen, but this was NOT the gate (--fast/--changed). Run it clean before pushing.');
} else {
  console.log('\nGreen. Quote this summary in the commit message.');
}
process.exit(bad.length ? 1 : 0);
