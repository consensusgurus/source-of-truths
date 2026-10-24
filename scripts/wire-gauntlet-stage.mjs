// scripts/wire-gauntlet-stage.mjs: puts every gauntlet daily's questions on the
// full-screen GauntletStage (owner, 2026-10-23), in its gauntlet's pastel step.
// Anchored edits: each anchor must match exactly once; a re-run skips files
// that already carry the stage.
//   node scripts/wire-gauntlet-stage.mjs
import fs from 'fs';
const RUNS = {
  gauntlet: ['streak', 'atlas', 'sport', 'biz', 'quotes', 'script', 'sci', 'art', 'history', 'deep'],
  english: ['gram', 'vocab', 'spell', 'origin', 'idiom'],
  math: ['gap', 'series', 'back', 'blitz', 'blitzed'],
};
let done = 0, skipped = 0;
for (const [run, keys] of Object.entries(RUNS)) {
  for (const key of keys) {
    const dir = `app/${key}`;
    const file = fs.readdirSync(dir).find((f) => f.endsWith('Client.jsx'));
    const p = `${dir}/${file}`;
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes('<GauntletStage')) { skipped++; continue; }
    const math = run === 'math';
    const one = (a) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${p}: anchor x${n}: ${a}`); };
    const firstImport = s.match(/\nimport [^\n]+\n/);
    if (!firstImport) throw new Error(`${p}: no import`);
    s = s.replace(firstImport[0], `${firstImport[0]}import GauntletStage from '../GauntletStage';\nimport { rampFor as gstRamp, circuitSlotFor as gstSlot } from '@/lib/circuits';\n`);
    const grain = '{!STAGE && <Grain />}';
    one(grain);
    const v = math ? 'problem' : 'question';
    const qNode = math
      ? (/function lineOf\(/.test(s) ? '<h2>{lineOf(problem.q)}</h2>' : '<h2>{mathText(problem.q)}</h2>')
      : 'question.line ? <><blockquote>&ldquo;{question.line}&rdquo;</blockquote><h2>{question.ask}</h2></> : <h2>{question.q}</h2>';
    const stage = `${grain}
      {/* THE GAUNTLET STAGE (owner, 2026-10-23): while a ${math ? 'problem' : 'question'} is up it plays full screen on
          this game's pastel step of the ${run === 'gauntlet' ? 'Trivia' : run === 'math' ? 'Math' : 'English'} Gauntlet ladder, the ${math ? 'problem' : 'question'} and answers only, with the
          clock in one quiet line below. The board further down still renders under it and keeps every rule. */}
      {STAGE && started && playing && ${v} ? (
        <GauntletStage
          bg={gstRamp(gstSlot('${run}', '${key}'))}
          qKey={g.i}
          label={\`${math ? 'Problem' : 'Question'} \${g.i + 1} of \${TOTAL_Q}\`}
          question={${qNode}}
          choices={${v}.choices.map((c) => (typeof c === 'number' ? c.toLocaleString('en-US') : c))}
          onPick={answer}
          lockIdx={lock && g.lastRight != null ? ${v}.correct : null}
          disabled={lock}
          frac={remainFrac}
          hot={remainFrac < 0.25}
          footer={<>{Math.ceil(remainMs / 1000)}s &middot; {g.i + 1} of {TOTAL_Q}</>}
        />
      ) : null}`;
    s = s.replace(grain, stage);
    fs.writeFileSync(p, s);
    done++;
  }
}
console.log(`wire-gauntlet-stage: ${done} clients wired, ${skipped} already carried it`);
