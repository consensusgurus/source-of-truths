'use client';

import { useEffect, useState } from 'react';
import {
  playBeat, heldRecently, BEAT_FRESH,
  installBuzzDefer, setBeatLive, firePendingBuzz,
} from '@/lib/finish-beat';

// Wrapped once, as soon as any daily's finish card is loaded (every client
// imports LoftFinish statically, so this runs on page load, well before the
// game's own finish() calls vibrate). See lib/finish-beat.js.
if (typeof window !== 'undefined') installBuzzDefer();

// THE FINISH BEAT, as LoftFinish sees it: true while the board should stay on
// screen and the ending should wait. See lib/finish-beat.js for the why.
//
// DECIDED IN THE INITIAL STATE, not in an effect, because the very first
// render of LoftFinish is the one that must not mount StageFinish: its first
// effect collapses the board, and a frame of the curtain before the beat is
// exactly the cut-away this exists to remove. LoftFinish only ever mounts on
// the client after a game ends (a daily renders `playing` on the server), so
// reading window here cannot disagree with a server render.
//
// No beat when: the page opened on a board finished earlier (the same
// freshness test StageFinish's flood uses), an End Game hold already showed
// the board, or the caller is not a daily. ?beat=1 forces one on an archived
// finished board for review; ?beat=0 switches it off.
export default function useFinishBeat({ key, enabled = true } = {}) {
  const [on, setOn] = useState(() => {
    if (!enabled || !key || typeof window === 'undefined') return false;
    const q = window.location.search || '';
    if (/[?&]beat=0(&|$)/.test(q)) return false;
    if (/[?&]beat=1(&|$)/.test(q)) return true;
    const since = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    if (since < BEAT_FRESH) return false;
    if (heldRecently()) return false;
    return true;
  });

  useEffect(() => {
    if (!on) return undefined;
    setBeatLive(true);
    const h = playBeat(key);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      setBeatLive(false);
      firePendingBuzz();
      setOn(false);
      // The board is collapsed by the time this fires, so cancelling the
      // animations only matters to a reader who later presses Return to board.
      setTimeout(() => h.cancel(), 1500);
    };
    const t = setTimeout(end, h.ms);
    // Any tap or key skips straight to the result.
    const skip = () => end();
    window.addEventListener('pointerdown', skip, true);
    window.addEventListener('keydown', skip, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', skip, true);
      if (!done) { setBeatLive(false); firePendingBuzz(); h.cancel(); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  return on;
}
