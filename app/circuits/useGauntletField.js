'use client';

// TODAY'S FIELD, per bank, from data the site already keeps.
//
// This is the second layer of the ladder: how far everyone else got. It needs
// NO new endpoint. /api/quiz/board already returns `scoreDist`, the exact score
// distribution over every completed attempt at that quizId, which its own
// comment describes as being there so a client can report the real share of
// attempts a finished run beat. On a one-life quiz the score IS the number of
// questions answered before the miss, so that histogram is a survival curve
// read backwards, and everything below falls out of it:
//
//   curve[i]   the share of today's players still alive at question i, which is
//              what lights the rungs nobody has reached yet
//   avg        the average score, which the roster prints and the ladder marks
//   beaten(s)  the share of attempts a score of s beat
//
// A BANK WITH TOO FEW FINISHERS IS REPORTED AS HAVING NO CURVE rather than a
// noisy one. A quiz that launched this morning has nothing to say about its
// field, and an average of 0.4 drawn from three plays is worse than no average:
// it is wrong AND it looks authoritative. Everything downstream treats a missing
// curve as "draw the plain version", so a new bank simply has no second layer
// until it has a field.

import { useEffect, useState } from 'react';

// Finishers before a bank's curve is worth drawing. Below this the shape is
// mostly noise and a single strong run moves the average by whole questions.
export const FIELD_FLOOR = 20;

// Turn { score: count } into the run's view of the day.
export function readDist(dist, total) {
  if (!dist) return null;
  let plays = 0;
  let sum = 0;
  for (const k of Object.keys(dist)) {
    const s = Number(k);
    const c = Number(dist[k]) || 0;
    if (!Number.isFinite(s) || c <= 0) continue;
    plays += c;
    sum += s * c;
  }
  if (plays < FIELD_FLOOR) return { plays, curve: null, avg: null };

  // atLeast[i] = how many scored i or more, so atLeast[0] is everyone.
  const atLeast = new Array(total + 2).fill(0);
  for (const k of Object.keys(dist)) {
    const s = Math.max(0, Math.min(total, Number(k)));
    const c = Number(dist[k]) || 0;
    if (c > 0) atLeast[s] += c;
  }
  for (let i = total - 1; i >= 0; i -= 1) atLeast[i] += atLeast[i + 1];

  const curve = new Array(total + 1);
  for (let i = 0; i <= total; i += 1) curve[i] = atLeast[i] / plays;
  return { plays, curve, avg: sum / plays, atLeast };
}

// `refresh` is the SECOND READ, at the end of a run (2026-09-20). This used to
// fetch once, at hydration, which on a run page is BEFORE the player has
// answered a question: every "of N on this bank" in the ending described the
// field as it stood several minutes and everyone-else's-run ago, and the
// response is shared-cacheable on top of that. Flipping `refresh` re-asks with
// the CDN skipped. It deliberately does NOT wait on this tab's own result post
// the way the board read does, because it does not need to: a player's own row
// cannot change their own place (nobody outranks themselves), so the only thing
// their row adds here is one to the play count.
export default function useGauntletField(sections, active = true, refresh = 0) {
  const [field, setField] = useState(null);

  // Keyed on the quiz ids rather than the array identity: `sections` is rebuilt
  // on every server request, and a new array each render would refetch forever.
  const sig = (sections || []).map((s) => s.quizId).join(',');

  useEffect(() => {
    if (!active || !sig) return undefined;
    let alive = true;
    const list = sections || [];
    const bust = refresh ? `&_=${Date.now()}` : '';
    Promise.all(list.map((s) => (
      // No identity on the query, deliberately: a response carrying the
      // caller's own placement is per-player and skips the shared cache, and
      // none of this needs to know who is asking.
      fetch(`/api/quiz/board?quizId=${encodeURIComponent(s.quizId)}${bust}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => [s, d])
        .catch(() => [s, null])
    ))).then((pairs) => {
      if (!alive) return;
      const curves = {};
      const avg = {};
      const plays = {};
      const atLeast = {};
      let started = 0;
      for (const [s, d] of pairs) {
        const n = s.questions ? s.questions.length : 0;
        const read = d ? readDist(d.scoreDist, n) : null;
        if (!read) continue;
        plays[s.key] = read.plays;
        started = Math.max(started, read.plays);
        if (read.curve) {
          curves[s.key] = read.curve;
          avg[s.key] = read.avg;
          atLeast[s.key] = read.atLeast;
        }
      }
      setField({
        curves, avg, plays, atLeast, started,
        // The share of attempts a score of `s` beat on that bank. Everyone who
        // scored strictly less, over everyone who played.
        beaten(key, score) {
          const al = atLeast[key];
          const p = plays[key];
          if (!al || !p) return null;
          const i = Math.max(0, Math.min(al.length - 1, score));
          return (p - al[i]) / p;
        },
        // The place a score of `s` takes on that bank's field today: everyone
        // who scored strictly more, plus one. Null under the floor, like the
        // curve, because a rank over eleven attempts is noise that looks exact.
        rank(key, score) {
          const al = atLeast[key];
          if (!al) return null;
          const i = Math.max(0, Math.min(al.length - 1, score + 1));
          return al[i] + 1;
        },
        has(key) { return !!curves[key]; },
        any: Object.keys(curves).length > 0,
      });
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, active, refresh]);

  return field;
}
