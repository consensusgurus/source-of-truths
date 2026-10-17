// PASSPORT, THE RUN (owner, 2026-10-14), from 2026-10-15: the day's Span,
// Flank and Ping, then nine bigger-or-smaller calls on their countries. This
// builds one day of it from the three games' own banks, so the run and each
// game's own page deal the same boards. SERVER ONLY: it reads whole banks,
// which ship to no browser; app/passport/page.js hands the client the one
// day's boards and calls. scripts/verify-passport.mjs builds every run day
// through it too, so the page and the check cannot disagree.

import { PUZZLES as SPAN } from '../app/span/puzzles.js';
import { PUZZLES as FLANK } from '../app/flank/puzzles.js';
import { PUZZLES as PING } from '../app/ping/puzzles.js';
import * as SPAN_BORDERS from '../app/span/borders.js';
import { passportSizes, spanRoute } from './passport-sizes.js';

const at = (bank, iso) => bank.find((p) => p.live === iso) || null;

// One run day: { sections: [span, flank, ping], calls } or null when any of
// the three games has no board that day (the bank has run out).
export function passportRunDay(iso, quizId) {
  const sp = at(SPAN, iso), fl = at(FLANK, iso), pg = at(PING, iso);
  if (!sp || !fl || !pg) return null;
  const route = spanRoute(sp, SPAN_BORDERS);
  const spanNamed = [sp.start, sp.end, sp.via, sp.avoid].filter(Boolean);
  const calls = passportSizes({ iso, quizId: quizId || `passport-${iso}`, route, spanNamed, flank: { c: fl.c, a: fl.a }, ping: { country: pg.country } });
  const { num, quizId: fq, live, dateLabel, sunday, a, c } = fl;
  return {
    route,
    sections: [
      { key: 'span', num: sp.num, quizId: sp.quizId, puzzle: sp },
      { key: 'flank', num: fl.num, quizId: fq, light: { num, quizId: fq, live, dateLabel, sunday, total: a.length }, day: { c, a } },
      { key: 'ping', num: pg.num, quizId: pg.quizId, puzzle: pg },
    ],
    calls,
  };
}
