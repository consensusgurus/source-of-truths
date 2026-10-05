'use client';

import { useEffect, useRef, useState } from 'react';
import {
  playBeat, playLoss, heldRecently, BEAT_FRESH,
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
// A beat that HOLDS (the sudokus' lock and burst) keeps its middle act going
// until `ready` (LoftFinish's figuresShow: every figure on the verdict has
// loaded) or until HOLD_CAP after it started, whichever comes first. Then it
// bursts into the curtain, and the curtain's figures land in their own order.
const HOLD_CAP = 7000;

export default function useFinishBeat({ key, enabled = true, lost = false, ready = true, progress = 0, finale = false } = {}) {
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [on, setOn] = useState(() => {
    if (!enabled || !key || typeof window === 'undefined') return false;
    const q = window.location.search || '';
    if (/[?&]beat=0(&|$)/.test(q)) return false;
    if (/[?&]beat=1(&|$)/.test(q)) return true;
    const since = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    if (since < BEAT_FRESH) return false;
    // An End Game hold already played the beat over the board; a win that the
    // curtain follows still gets the orbit and the burst.
    if (heldRecently()) return finale && !lost ? 'finale' : false;
    return true;
  });

  useEffect(() => {
    if (!on) return undefined;
    setBeatLive(true);
    // A loss plays the gaps going dark, never the win beat (owner, 2026-10-04).
    const h = lost ? playLoss(key) : playBeat(key, { finale, finaleOnly: on === 'finale' });
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      setBeatLive(false);
      firePendingBuzz();
      setOn(false);
      // The board is collapsed by the time this fires, so cancelling the
      // animations only matters to a reader who later presses Return to board.
      // A held beat ends on a sheet of colour the curtain mounts over; it goes
      // once the curtain has faded in on top of it.
      setTimeout(() => h.cancel(), h.hold ? 700 : 1500);
    };
    let t = 0;
    let poll = 0;
    let covered = false;
    if (h.hold) {
      const t0 = Date.now();
      const check = () => {
        if (done) return;
        if (h.setProgress) h.setProgress(progressRef.current);
        if (readyRef.current || Date.now() - t0 >= HOLD_CAP) {
          h.release(() => { covered = true; end(); });
          return;
        }
        poll = setTimeout(check, 80);
      };
      t = setTimeout(check, h.ms);
    } else {
      t = setTimeout(end, h.ms);
    }
    // Any tap or key skips straight to the result. A held beat's tiles sit
    // over the page, so a skip before they have covered it clears them now.
    const skip = () => { if (h.hold && !covered) h.cancel(); end(); };
    window.addEventListener('pointerdown', skip, true);
    window.addEventListener('keydown', skip, true);
    return () => {
      clearTimeout(t);
      clearTimeout(poll);
      window.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', skip, true);
      if (!done) { setBeatLive(false); firePendingBuzz(); h.cancel(); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  return on;
}
