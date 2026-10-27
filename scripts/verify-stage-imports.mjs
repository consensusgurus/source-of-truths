// EVERY NAME A CONVERTED CLIENT USES MUST BE IMPORTED OR DECLARED.
//
//   node scripts/verify-stage-imports.mjs
//
// esbuild parses an undefined identifier without complaint, so a converter that
// emits a call it forgot to import produces a page that throws ReferenceError on
// its FIRST RENDER — live, for every player, flag or no flag. That shipped: the
// stage converter emitted gameColorLight into STAGE_ACC and only ever imported
// gameColor, and thirteen daily pages went down.
//
// This checks the names the stage machinery introduces, which is the set a
// converter can get wrong. It is deliberately narrow: a general no-undef pass is
// eslint's job, and eslint is not run per client here.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const NEEDED = [
  'gameColor', 'gameColorLight', 'RAMP_INK', 'STAGE_GROUND', 'CATEGORY_RAMP',
  'isStage', 'useStageTheme', 'useStageRoom', 'StageChrome', 'StageLadder', 'LoftSheet',
];

let bad = 0;
let checked = 0;
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of readdirSync(join('app', d.name))) {
    if (!/^[A-Z][A-Za-z]*Client\.jsx$/.test(f)) continue;
    const rel = join('app', d.name, f);
    const src = readFileSync(rel, 'utf8');
    if (!/const STAGE = isStage\(/.test(src)) continue;   // unconverted
    checked++;
    // Everything the file imports, by name, plus everything it declares.
    const imported = new Set();
    for (const m of src.matchAll(/import\s+(?:(\w+)\s*,\s*)?\{([^}]*)\}\s+from/g)) {
      if (m[1]) imported.add(m[1]);
      for (const n of m[2].split(',')) {
        const nm = n.trim().split(/\s+as\s+/).pop().trim();
        if (nm) imported.add(nm);
      }
    }
    for (const m of src.matchAll(/import\s+(\w+)\s+from/g)) imported.add(m[1]);
    const declared = new Set([...src.matchAll(/(?:^|\n)\s*(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
    for (const name of NEEDED) {
      // Comments are not uses (Squash's header comment names RAMP_INK).
      const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
      const used = new RegExp(String.raw`(?<![\w$.])${name}\s*[({[]`).test(code)
        || new RegExp(String.raw`(?<![\w$.])${name}(?![\w$])`).test(code.replace(/^import[^\n]*$/gm, ''));
      if (used && !imported.has(name) && !declared.has(name)) {
        console.log(`✗ ${rel}: uses ${name} but never imports or declares it`);
        bad++;
      }
    }
  }
}
// -------------------------------------------------------- TEMPORAL DEAD ZONE
//
// The second way a codemod breaks a client at runtime while parsing fine: it
// inserts a const whose initializer reads a name declared LOWER in the same
// component. Stands imports the theme as `{ T as THEME }` because T is already
// PUZZLE.teams, so an emitted `T.white` was both the wrong object and a dead
// zone, and the page threw 'Cannot access T before initialization'.
//
// Scoped to COMPONENT-TOP-LEVEL consts (two-space indent) on both sides, which
// is where a codemod inserts and is what keeps this quiet enough to be read.
// Function-valued initializers are skipped: their body runs later.
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of readdirSync(join('app', d.name))) {
    if (!/^[A-Z][A-Za-z]*Client\.jsx$/.test(f)) continue;
    const rel = join('app', d.name, f);
    const src = readFileSync(rel, 'utf8');
    if (!/const STAGE = isStage\(/.test(src)) continue;
    const lines = src.split('\n');
    // Names that are a PARAMETER somewhere live in another scope, so a
    // component const reading one is not reading the later declaration.
    const params = new Set();
    for (const m of src.matchAll(/(?:function\s*[\w$]*\s*|\)\s*=>|\()\(?([^()]*)\)\s*(?:\{|=>)/g)) {
      for (const n of (m[1] || '').split(',')) {
        const nm = n.trim().replace(/[={[\]}].*/, '').trim();
        if (/^[A-Za-z_$][\w$]*$/.test(nm)) params.add(nm);
      }
    }
    const at = {};
    lines.forEach((l, i) => {
      const m = l.match(/^  const ([A-Za-z_$][\w$]*)\s*=/);
      if (m && at[m[1]] === undefined) at[m[1]] = i;
    });
    lines.forEach((l, i) => {
      const m = l.match(/^  const ([A-Za-z_$][\w$]*)\s*=\s*(.*)$/);
      if (!m) return;
      if (/=>|\bfunction\b|use(?:Ref|Memo|Callback|State)\(/.test(m[2])) return;
      // Strip STRINGS before scanning, or 'var(--stg-acc)' reads as the
      // identifier `acc`, and object KEYS, or { pts: ... } reads as `pts`.
      const init = m[2]
        // REGEX LITERALS first: Shards' /^#?([0-9a-f]{6})$/ read as the identifier `f`.
        .replace(/(^|[=(,:!&|?]\s*)\/(?:\\.|\[[^\]\n]*\]|[^/\\\n])+\/[gimsuy]*/g, '$1""')
        .replace(/'(?:\\.|[^'\\])*'/g, "''")
        .replace(/"(?:\\.|[^"\\])*"/g, '""')
        .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, '``')
        .replace(/\/\/[^\n]*/g, ' ')            // and COMMENTS: `// radians, per jaw`
        .replace(/([A-Za-z_$][\w$]*)\s*:/g, ' ');
      for (const id of new Set([...init.matchAll(/(?<![.\w$'"])([A-Za-z_$][\w$]*)/g)].map((x) => x[1]))) {
        if (params.has(id)) continue;
        if (at[id] !== undefined && at[id] > i) {
          console.log(`\u2717 ${rel}: const ${m[1]} (line ${i + 1}) reads ${id}, declared at line ${at[id] + 1}`);
          bad++;
        }
      }
    });
  }
}

// ---------------------------------------------------- SUSPENSE BOUNDARIES
//
// A client that calls useSearchParams FAILS THE BUILD on a statically rendered
// page unless it is inside a <Suspense>. The stage converter ADDS that hook to
// any client that never read the query (Garble, Glyph), so it can introduce the
// requirement into a page.js that was fine the day before. Garble broke the
// Vercel build exactly this way, and esbuild cannot see it because it is a
// Next rule, not a syntax error.
for (const d of readdirSync('app', { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const files = readdirSync(join('app', d.name));
  const client = files.find((f) => /^[A-Z][A-Za-z]*Client\.jsx$/.test(f));
  if (!client || !files.includes('page.js')) continue;
  const csrc = readFileSync(join('app', d.name, client), 'utf8');
  if (!/const STAGE = isStage\(/.test(csrc)) continue;       // converted only
  if (!/useSearchParams/.test(csrc)) continue;
  const psrc = readFileSync(join('app', d.name, 'page.js'), 'utf8');
  if (!/Suspense/.test(psrc)) {
    console.log(`\u2717 app/${d.name}/page.js: ${client} reads useSearchParams but the page has no <Suspense> — this fails the Next build`);
    bad++;
  }
}

console.log(bad ? `\n${bad} problem(s) across ${checked} converted clients` : `clean: ${checked} converted clients, every stage name imported and no dead zones`);
process.exit(bad ? 1 : 0);
