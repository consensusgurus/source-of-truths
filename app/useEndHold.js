'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { markEndHold, playBeat } from '@/lib/finish-beat';
import { BEATS } from '@/lib/finish-beats';

// The move that ends an End Game daily lands on the board in the same tick that
// sets the game's status, so the end card used to cover the board before the
// player ever saw what beat them: the engine's fourth disc in Four, the mate in
// Mate, the word the opponent went out on in Babel. This holds the card back for
// a beat while the finished board, winning line and all, stays on screen.
//
// Games call hold() at every path that ends the game and release() when a replay
// starts; the card renders on `!held`.
//
// FOR MOST OF ITS LIFE THIS HOOK DID NOTHING. Only the legacy pre-Loft card was
// gated on `!held`, and every daily moved to the Loft stage, whose flip is gated
// on `!playing`. So the card turned over in the same tick the game ended and the
// hold expired behind it, unseen, on all seven games that call this. Fixed
// 2026-08-18 by gating the flip, the post-game panel and LoftFinish on `held`
// too. Any NEW surface that appears when a game ends belongs behind the same
// gate, or it will cover the board and this hook will go quiet again.
//
// THE HOLD IS LONGER ON A LOSS THAN ON A WIN (owner, 2026-08-18). A win you
// already knew about: you played the move that won, so the card can come in at
// HOLD_SHORT. A loss arrives on the OPPONENT's move, in the tick that ends the
// game, so the player has seen nothing yet and needs HOLD_LONG to read the board
// that beat them. Pass the delay per ending; `ms` is only the fallback for a
// caller that passes none.
//
// hold() also carries an optional NOTE, one line naming what ended the round,
// held and cleared with the board so it can never outlive the beat it belongs
// to. Only Babel uses it: the six End Game titles already print a verdict line
// on the board (their statusLine helpers), which the hold finally makes
// readable, and a second announcement beside it would just say it twice.
export const HOLD_SHORT = 1200;
export const HOLD_LONG = 3000;

export default function useEndHold(ms = HOLD_SHORT) {
  const [end, setEnd] = useState({ held: false, note: null });
  const held = end.held;
  const timer = useRef(null);

  const beat = useRef(null);
  const stopBeat = () => { if (beat.current) { beat.current.cancel(); beat.current = null; } };

  const hold = useCallback((delay, note) => {
    if (timer.current) clearTimeout(timer.current);
    const wait = delay == null ? ms : delay;
    setEnd({ held: true, note: note || null });
    // THE FINISH BEAT PLAYS INSIDE THIS HOLD (owner, 2026-10-03), and the
    // mark tells LoftFinish not to add a second wait on top of it. A game
    // with a beat of its own in lib/finish-beats.js (Four's losing beat)
    // plays it now, in the next frame so the finishing move has rendered.
    markEndHold();
    stopBeat();
    try {
      const seg = (window.location.pathname.split('/')[1] || '').toLowerCase();
      const key = seg === 'parker' ? 'park' : seg === 'jesters' ? 'jester' : seg;
      if (BEATS[key]) {
        requestAnimationFrame(() => { beat.current = playBeat(key, { within: wait }); });
      }
    } catch (e) {}
    timer.current = setTimeout(() => {
      timer.current = null;
      setEnd({ held: false, note: null });
      // Cancelled after the ending has covered the board, so a later Return
      // to board shows it untouched.
      const b = beat.current; beat.current = null;
      if (b) setTimeout(() => b.cancel(), 1500);
    }, wait);
  }, [ms]);

  const release = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    stopBeat();
    setEnd({ held: false, note: null });
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); stopBeat(); }, []);

  return { held, note: end.note, hold, release };
}
