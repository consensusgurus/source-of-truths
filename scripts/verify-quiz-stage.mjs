// THE QUIZ STAGE, MEASURED.
//
//   node scripts/verify-quiz-stage.mjs
//
// Two jobs, and they fail for two different reasons.
//
// 1. THE QUIZ ACCENTS are the ramp's Trivia and Geography steps, checked value
//    for value against lib/category-ramp.js (owner, 2026-11-12).
//
// 2. A CONVERTED QUIZ CLIENT MUST IMPORT WHAT IT USES, and must not still be
//    rendering the furniture the stage takes away. esbuild parses an undefined
//    identifier without complaint, so a converter that emits a name it forgot
//    to import produces a page that throws ReferenceError on its FIRST render,
//    live, for every reader, flag or no flag. That has shipped on this codebase
//    (thirteen daily pages at once) and it is the reason this file exists.
//
//    scripts/verify-stage-imports.mjs does the daily half and cannot do this
//    one: it walks app/<dir>/*Client.jsx, one level deep, and every quiz client
//    lives two levels down in app/quiz/[id]/.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let bad = 0;
const fail = (m) => { console.log('✗ ' + m); bad++; };
const note = (m) => console.log('… ' + m);

// ── 1. THE ACCENTS ARE THE RAMP'S TRIVIA AND GEOGRAPHY STEPS ───────────────
//
// Since 2026-11-12 (owner, "Quiz Stage Restyle", option 2) a quiz wears the
// Trivia step, or the Geography step if it is a geography quiz, instead of the
// old neutral slate. lib/quiz-stage.js writes those values literally (to keep
// the daily registry out of the quiz bundle), so this checks every literal
// against lib/category-ramp.js: the dark step, the light step, the ink on the
// light step and the light text ink. A copy that drifts from the ramp is a
// second colour system wearing the first one's names. The ramp's own contrast
// is verify-category-ramp.mjs's job, so it is not re-measured here.
const src = readFileSync('lib/quiz-stage.js', 'utf8');
const ramp = readFileSync('lib/category-ramp.js', 'utf8');
const arr = (name) => {
  const at = ramp.indexOf('export const ' + name + ' = [');
  if (at < 0) { fail(`lib/category-ramp.js has no ${name} array`); return []; }
  const body = ramp.slice(at, ramp.indexOf('];', at));
  return [...body.matchAll(/^\s*('(#[0-9a-fA-F]{6})'|RAMP_INK)\s*,/gm)].map((m) => (m[2] || '#08222e').toLowerCase());
};
const alias = (name) => {
  const m = new RegExp('export const ' + name + ' = (\\w+);').exec(ramp);
  return m ? m[1] : name;
};
const order = (() => {
  const at = ramp.indexOf('export const RAMP_ORDER = [');
  return [...ramp.slice(at, ramp.indexOf('];', at)).matchAll(/'([^']+)'/g)].map((m) => m[1]);
})();
const DARK = arr('CATEGORY_RAMP');
const LIGHT = arr(alias('CATEGORY_RAMP_LIGHT'));
const ON_LT = arr('RAMP_INK_LIGHT');
const INK_LT = arr('CATEGORY_RAMP_INK_LIGHT');
for (const [list, nm] of [[DARK, 'CATEGORY_RAMP'], [LIGHT, 'CATEGORY_RAMP_LIGHT'], [ON_LT, 'RAMP_INK_LIGHT'], [INK_LT, 'CATEGORY_RAMP_INK_LIGHT']]) {
  if (list.length !== order.length) fail(`read ${list.length} entries of ${nm}, expected ${order.length} (one per RAMP_ORDER category)`);
}
const subj = (key) => {
  const at = src.indexOf('  ' + key + ': {');
  if (at < 0) { fail(`lib/quiz-stage.js QUIZ_SUBJECTS has no ${key}`); return null; }
  const body = src.slice(at, src.indexOf('},', at));
  const f = (k) => { const m = new RegExp(k + ": '(#[0-9a-fA-F]{6})'").exec(body); return m ? m[1].toLowerCase() : null; };
  const lab = /label: '([^']+)'/.exec(body);
  return { label: lab ? lab[1] : null, dk: f('dk'), lt: f('lt'), onLt: f('onLt'), inkLt: f('inkLt') };
};
for (const key of ['trivia', 'geography']) {
  const v = subj(key);
  if (!v) continue;
  const i = order.indexOf(v.label);
  if (i < 0) { fail(`QUIZ_SUBJECTS.${key} names category "${v.label}", which is not in RAMP_ORDER`); continue; }
  const want = { dk: DARK[i], lt: LIGHT[i], onLt: ON_LT[i], inkLt: INK_LT[i] };
  for (const k of Object.keys(want)) {
    if (v[k] !== want[k]) fail(`QUIZ_SUBJECTS.${key}.${k} is ${v[k]}, but the ramp's ${v.label} step says ${want[k]}`);
  }
  note(`${key}: ${v.label} step, dark ${v.dk}, light ${v.lt} with ink ${v.onLt}, text ${v.inkLt}`);
}

// ── 2. CONVERTED QUIZ CLIENTS ───────────────────────────────────────────────
const DIR = 'app/quiz/[id]';
const NEEDED = ['isQuizStage', 'quizAccVars', 'quizTint', 'QUIZ_SUBJECTS', 'useStageTheme', 'StageChrome', 'StageLadder'];
let checked = 0;
for (const f of readdirSync(DIR)) {
  if (!/\.jsx$/.test(f)) continue;
  const rel = join(DIR, f);
  const s = readFileSync(rel, 'utf8');
  if (!/const QSTAGE = isQuizStage\(/.test(s)) continue;   // unconverted
  checked++;

  // Everything it imports by name, plus everything it declares.
  const known = new Set();
  for (const m of s.matchAll(/import\s+(?:(\w+)\s*,\s*)?\{([^}]*)\}\s+from/g)) {
    if (m[1]) known.add(m[1]);
    for (const nm of m[2].split(',')) {
      const t = nm.trim().split(/\s+as\s+/).pop().trim();
      if (t) known.add(t);
    }
  }
  for (const m of s.matchAll(/^import\s+(\w+)\s+from/gm)) known.add(m[1]);
  for (const m of s.matchAll(/^\s*(?:const|let|function)\s+(\w+)/gm)) known.add(m[1]);
  for (const name of NEEDED) {
    if (!new RegExp('(?<![\\w$])' + name + '(?![\\w$])').test(s)) continue;   // unused
    if (!known.has(name)) fail(`${rel} uses ${name} and neither imports nor declares it`);
  }

  // THE ORDERING, asserted rather than guarded at runtime. typeof on a const in
  // its TEMPORAL DEAD ZONE THROWS, so a flag reading searchParams declared
  // below it is a live bomb that esbuild and eslint both pass and only a render
  // catches. This codebase has shipped that bug twice.
  const lines = s.split('\n');
  const spAt = lines.findIndex((l) => /^\s*const searchParams\s*=/.test(l));
  const flagAt = lines.findIndex((l) => /const QSTAGE = isQuizStage\(/.test(l));
  if (spAt < 0) fail(`${rel} has no \`const searchParams\` for the stage flag to read`);
  else if (spAt > flagAt) {
    fail(`${rel} declares searchParams at line ${spAt + 1}, BELOW the stage flag at ${flagAt + 1}: `
      + 'that is a temporal dead zone and it throws on render');
  }

  // ── EVERY STAGE CONST IS USED ONLY INSIDE THE COMPONENT THAT DECLARES IT ──
  //
  // ⚠️ THIS CHECK EXISTS BECAUSE ITS ABSENCE TOOK THE QUIZ SURFACE DOWN.
  // The converter rewrites `color: COLORS.faded` to `color: FADED`, and FADED
  // is declared inside the component. QuizClient defines four helpers at the
  // FOOT of the file, past the component's closing brace, and one rewritten
  // colour landed in one of them: `ReferenceError: FADED is not defined`, a 500
  // on all ~1,200 quiz pages, with the flag off, because a module-level style
  // object is evaluated whatever the flag says.
  //
  // esbuild parses it. eslint's no-undef is not run per client here. A render
  // catches it and nothing else does, which is exactly the shape of bug worth a
  // checker. The bound is the component's own braces: from `export default
  // function X({ quizId` down to the first bare `}` in column zero.
  {
    const start = lines.findIndex((l) => /^export default function [A-Za-z_$][\w$]*\(\{ quizId/.test(l));
    let end = lines.length - 1;
    for (let i = start + 1; i < lines.length; i++) { if (/^\}\s*$/.test(lines[i])) { end = i; break; } }
    const NAMES = ['QSTAGE', 'stageTheme', 'INK', 'FADED', 'SURF', 'SURF_B', 'QACC', 'ON_ACC', 'Cap', 'stageBlocks'];
    // Declared at the top level by this file itself? Then it is genuinely in
    // scope everywhere and is not one of the converter's component-locals.
    const topLevel = new Set(
      lines.filter((l, i) => (i < start || i > end) && /^(?:export )?(?:const|let|function) /.test(l))
        .map((l) => (l.match(/^(?:export )?(?:const|let|function) (\w+)/) || [])[1])
        .filter(Boolean)
    );
    for (let i = 0; i < lines.length; i++) {
      if (i > start && i <= end) continue;      // inside the component: fine
      for (const name of NAMES) {
        if (topLevel.has(name)) continue;
        if (!new RegExp('(?<![\\w$.])' + name + '(?![\\w$])').test(lines[i])) continue;
        // A comment mentioning the name is not a use of it.
        const code = lines[i].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '');
        if (!new RegExp('(?<![\\w$.])' + name + '(?![\\w$])').test(code)) continue;
        fail(`${rel}:${i + 1} uses ${name} OUTSIDE the component that declares it `
          + `(component body is lines ${start + 1}-${end + 1}): that is a ReferenceError at render, `
          + 'not a dead zone, and it 500s the page whatever the flag says');
      }
    }
  }

  // THE TAKEOVER. The stage pattern's first rule is that the page is the thing:
  // no site masthead above it, no footer below it, no paper grain on a
  // near-black ground. An UNGATED one of those is a piece of the old page
  // rendering on the new one -- the half-conversion that reads as broken
  // rather than as unfinished.
  // Line-based, because the gate is not always immediately in front of the
  // element: QuizClient renders the masthead as one arm of a JSX ternary and
  // the whole ternary is gated, which a lookbehind on the element cannot see.
  // A check that cries wolf on every run is a check nobody reads.
  for (const [what, re] of [
    ['<Footer />', /<Footer \/>/],
    ['<Grain />', /<Grain \/>/],
    ['<QuizNavHeader />', /<QuizNavHeader \/>/],
  ]) {
    lines.forEach((l, i) => {
      if (!re.test(l)) return;
      if (l.includes('!QSTAGE') || l.includes('QSTAGE ?')) return;
      fail(`${rel}:${i + 1} renders ${what} with no QSTAGE gate on that line: `
        + 'the stage takes the page over, so a piece of the old page here is player-facing');
    });
  }
}
note(`${checked} converted quiz client${checked === 1 ? '' : 's'} checked`);
if (!checked) note('no converted quiz client found: nothing on the quiz surface is on the stage yet');

console.log(bad ? `✗ ${bad} problem${bad === 1 ? '' : 's'}` : '✓ quiz stage clean');
process.exit(bad ? 1 : 0);
