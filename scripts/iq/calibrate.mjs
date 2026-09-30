// Calibrates every PLAYED gauntlet question for the /iq tests, and writes
// lib/iq-items.js.
//
//   node scripts/iq/calibrate.mjs [snapshot]
//
// WHERE THE DIFFICULTY COMES FROM. Streak, Deep, Atlas, Sport and Biz are one
// life, in a fixed order, the same for everyone on the day. So a run that
// scores s has answered questions 1..s right and question s+1 wrong (unless it
// cleared the day). A day's score distribution therefore IS its item response
// matrix, and /api/quiz/board hands that distribution out as scoreDist. The
// snapshot file is those distributions, one line per day:
//
//   <G><M>-<D>=<score>:<count>,...     G = S streak, D deep, A atlas, P sport, B biz
//
// THE MODEL is a four-parameter logistic with the slope, the guess and the
// lapse fixed and only the difficulty free:
//
//   P(right) = C + (U - C) * sigmoid(A * (theta - b))
//
// C = .25 because every question has four choices. U = .95 because a
// one-life board with a twenty second clock loses runs to things that are not
// knowledge (a tab closed, a clock missed, a mis-tap), and without a lapse term
// those runs would make gimmes look hard. Abilities are the players' (one per
// (day, score) pattern, weighted by how many runs share it) with a N(0,1)
// prior, which is exactly what makes the scale PLAYER-NORMED: theta 0 is the
// typical Mind Loft player of that game. Difficulties shrink toward their
// game-and-tier mean, and those means are learned too, so a question few
// players reached borrows from its tier rather than from one lucky run.
//
// Runs that scored 0 are dropped: missing the day's first gimme is almost
// always someone opening the page and leaving, not someone who did not know.
//
// Each game is fitted on its own, because a run carries no player id to link
// games. Every game's scale is therefore anchored on its own player base.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const snap = process.argv[2] || path.join(here, 'play-snapshot-2026-09-29.txt');

export const MODEL = { A: 1.1, C: 0.25, U: 0.95 };
const TIER_PRIOR = { 1: -2.0, 2: -1.0, 3: 0.0, 4: 1.0, 5: 2.0 };
const B_SD = 0.9;       // how far an item may sit from its tier mean a priori
const MU_SD = 1.0;      // how far a tier mean may drift from TIER_PRIOR
const GAMES = { S: 'streak', D: 'deep', A: 'atlas', P: 'sport', B: 'biz' };

const sig = (x) => 1 / (1 + Math.exp(-x));
const { A, C, U } = MODEL;
const pr = (t, b) => C + (U - C) * sig(A * (t - b));
// d log L / d theta for one response, and its (negative) curvature.
function grad(t, b, y) {
  const s = sig(A * (t - b));
  const p = C + (U - C) * s;
  const dp = (U - C) * A * s * (1 - s);
  const g = y ? dp / p : -dp / (1 - p);
  const info = (dp * dp) / (p * (1 - p));
  return [g, info];
}

async function load(game) {
  const Q = await import(path.join(root, 'app', game, 'questions.js'));
  const P = await import(path.join(root, 'app', game, 'puzzles.js'));
  return { qmap: Q.QUESTION_MAP, puzzles: P.PUZZLES };
}

export async function calibrate(snapPath = snap) {
  const lines = fs.readFileSync(snapPath, 'utf8').split('\n').filter(Boolean);
  const byGame = {};
  for (const ln of lines) {
    const [k, v] = ln.split('=');
    const G = k[0], md = k.slice(1);
    const dist = v.split(',').map((x) => x.split(':').map(Number));
    (byGame[G] ||= []).push({ quizSuffix: `${md}-26`, dist });
  }
  const out = {};
  for (const [G, days] of Object.entries(byGame)) {
    const game = GAMES[G];
    const { qmap, puzzles } = await load(game);
    const byQuiz = Object.fromEntries(puzzles.map((p) => [p.quizId, p]));
    const items = new Map(); // id -> {tier, b, n}
    const pats = [];          // {qids, s, w}
    for (const d of days) {
      const p = byQuiz[`${game}-${d.quizSuffix}`];
      if (!p) continue;
      const N = p.qids.length;
      for (const qid of p.qids) {
        const q = qmap[qid];
        if (q && !items.has(qid)) items.set(qid, { tier: q.tier, b: TIER_PRIOR[q.tier], n: 0, r: 0 });
      }
      for (const [s, w] of d.dist) {
        if (!(s > 0) || !(w > 0)) continue;
        const seen = Math.min(N, s + 1);
        pats.push({ qids: p.qids.slice(0, seen), s: Math.min(s, N), w, t: 0 });
        for (let i = 0; i < seen; i++) { const it = items.get(p.qids[i]); if (it) { it.n += w; if (i < s) it.r += w; } }
      }
    }
    const mu = { ...TIER_PRIOR };
    for (let iter = 0; iter < 60; iter++) {
      // abilities
      for (const pt of pats) {
        for (let k = 0; k < 4; k++) {
          let g = -pt.t, h = 1;
          pt.qids.forEach((qid, i) => { const it = items.get(qid); if (!it) return; const [gg, ii] = grad(pt.t, it.b, i < pt.s); g += gg; h += ii; });
          pt.t += Math.max(-1, Math.min(1, g / h));
        }
      }
      // difficulties
      const acc = new Map();
      for (const pt of pats) pt.qids.forEach((qid, i) => {
        const it = items.get(qid); if (!it) return;
        const [gg, ii] = grad(pt.t, it.b, i < pt.s);
        const a = acc.get(qid) || [0, 0];
        a[0] += -gg * pt.w; a[1] += ii * pt.w; acc.set(qid, a); // d/db = -d/dtheta
        // eslint-disable-next-line no-unused-expressions
      });
      for (const [qid, it] of items) {
        const [g0, h0] = acc.get(qid) || [0, 0];
        const g = g0 - (it.b - mu[it.tier]) / (B_SD * B_SD);
        const h = h0 + 1 / (B_SD * B_SD);
        it.b += Math.max(-0.8, Math.min(0.8, g / h));
      }
      // tier means, shrunk toward the prior
      for (const t of [1, 2, 3, 4, 5]) {
        const bs = [...items.values()].filter((x) => x.tier === t).map((x) => x.b);
        if (!bs.length) continue;
        const prec = bs.length / (B_SD * B_SD) + 1 / (MU_SD * MU_SD);
        mu[t] = (bs.reduce((a, b) => a + b, 0) / (B_SD * B_SD) + TIER_PRIOR[t] / (MU_SD * MU_SD)) / prec;
      }
      // Re-anchor the LOCATION only: the weighted player mean is 0. The
      // spread is pinned by the fixed slope and the N(0,1) prior, and
      // rescaling it every pass as well feeds back and diverges.
      const W = pats.reduce((a, p) => a + p.w, 0);
      const m = pats.reduce((a, p) => a + p.w * p.t, 0) / W;
      for (const p of pats) p.t -= m;
      for (const it of items.values()) it.b -= m;
      for (const t in mu) mu[t] -= m;
    }
    {
      // Once, at the end: express everything in player standard deviations.
      const W = pats.reduce((a, p) => a + p.w, 0);
      const sd = Math.sqrt(pats.reduce((a, p) => a + p.w * p.t * p.t, 0) / W) || 1;
      for (const p of pats) p.t /= sd;
      for (const it of items.values()) it.b /= sd;
      for (const t in mu) mu[t] /= sd;
      out[game + '_sd'] = sd;
    }
    out[game] = { items, mu, runs: pats.reduce((a, p) => a + p.w, 0) };
  }
  return out;
}

// A question whose players missed it far more than its tier says is usually a
// flawed question (two defensible answers, a stem that misleads) rather than
// a hard one, and a test that leans on it is testing the flaw. Tier 1 and 2
// questions that fitted more than this far above their tier mean are left out.
const MISFIT = 2.2;

if (import.meta.url === `file://${process.argv[1]}`) {
  const cal = await calibrate();
  const rows = [];
  let dropped = 0;
  for (const [game, { items, mu, runs }] of Object.entries(cal).filter(([k]) => !k.endsWith('_sd'))) {
    const bs = [...items.values()].map((x) => x.b);
    console.log(game, 'runs', runs, 'items', items.size, 'tier means', Object.values(mu).map((x) => x.toFixed(2)).join(' '),
      'b range', Math.min(...bs).toFixed(2), Math.max(...bs).toFixed(2));
    for (const [id, it] of items) {
      if (it.tier <= 2 && it.b - mu[it.tier] > MISFIT) { dropped++; continue; }
      rows.push(`['${game}','${id}',${it.b.toFixed(2)},${it.n}]`);
    }
  }
  console.log('dropped as misfit', dropped, 'kept', rows.length);
  const file = `// GENERATED by scripts/iq/calibrate.mjs from ${path.basename(snap)}. Do not edit
// by hand: re-pull the day boards, save a new snapshot, and re-run it.
//
// One row per calibrated question: [game, question id, difficulty b, runs that
// reached it]. b is on the playing population's own scale (0 = the typical
// player's level, 1 = one standard deviation above). Only days that had
// already been played when the snapshot was taken are here, so the tests never
// show a question that is still to come on a daily.
export const IQ_MODEL = ${JSON.stringify(MODEL)};
export const IQ_SNAPSHOT = '${path.basename(snap).replace(/^play-snapshot-|\.txt$/g, '')}';
export const IQ_ITEMS = [
${rows.join(',\n')}
];
`;
  fs.writeFileSync(path.join(root, 'lib', 'iq-items.js'), file);
  console.log('wrote lib/iq-items.js', (file.length / 1024).toFixed(0), 'KB');
}
