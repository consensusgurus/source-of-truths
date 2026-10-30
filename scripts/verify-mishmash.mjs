// scripts/verify-mishmash.mjs: checks app/mishmash/puzzles.js against the quiz-mix rules
// (scripts/quiz-mix-rules.mjs), including no same-day overlap with Potluck and
// the other quiz-mix bank. The body is scripts/quiz-mix-check.mjs.
import { checkMix } from './quiz-mix-check.mjs';
await checkMix('mishmash');
