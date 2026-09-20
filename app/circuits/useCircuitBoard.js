'use client';

// useCircuitBoard — the combined board for ONE circuit, fetched once.
//
// The board a circuit ends on is /api/quiz/daily-combined narrowed to that
// circuit: `?five=1` for the marquee and `?circuit=<id>` for a skill circuit,
// which is the same query the console band and the summary page already use.
// It lives here rather than in a component because BOTH endings need it now
// (the run's finish card and the summary page), and two hand-written copies of
// a fetch that has to carry the right identity, the right narrowing param and
// `fresh=1` is exactly the kind of pair that drifts.
//
// FRESH IS NOT OPTIONAL. A player reaches this the second after their last
// result posts, so a cached board is a board that does not have them on it.
//
// `active` gates the call rather than the caller gating the hook: a run only
// wants the board once it is over, and hooks cannot be called conditionally.
//
// FRESH IS NOT ENOUGH ON ITS OWN, EITHER (2026-09-20). `fresh=1` forces an
// authoritative read of the database; it cannot force the database to contain a
// row that is still in flight. The last quiz's result POST and this read left
// in the same tick, so the read won, and a seven-game run came back with six
// games on it: the total short by the last quiz's score and the rank a dash,
// because a circuit ranks nobody who has not finished every game in it. So the
// read waits for this tab's own writes to land first. With nothing in flight
// (the gate read, the summary page) it resolves at once and nothing is delayed.

import { useEffect, useState } from 'react';
import { isMarquee, CIRCUIT_PARAM } from '@/lib/circuits';
import { dailyMeIdentity } from '../dailyMeClient';
import { resultPostsSettled } from '../ResultQueue';

export default function useCircuitBoard(runId, active = true) {
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!active || !runId) return undefined;
    let alive = true;
    setState('loading');
    resultPostsSettled().then(() => {
      if (!alive) return;
      const { anonId, email } = dailyMeIdentity();
      const qs = new URLSearchParams({ fresh: '1' });
      if (isMarquee(runId)) qs.set('five', '1');
      else qs.set(CIRCUIT_PARAM, runId);
      if (anonId) qs.set('anonId', anonId);
      if (email) qs.set('email', email);
      fetch(`/api/quiz/daily-combined?${qs.toString()}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d && !d.error) { setData(d); setState('ready'); } else { setState('error'); }
        })
        .catch(() => { if (alive) setState('error'); });
    });
    return () => { alive = false; };
  }, [runId, active]);

  return { data, state };
}
