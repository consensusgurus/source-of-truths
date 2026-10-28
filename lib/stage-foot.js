'use client';
// THE STAGE FOOT'S SHARED STATE (owner, 2026-10-28: "clock option goes at bottom
// by give up, make both of those buttons. Also put the how to there... same
// format for every daily puzzle... the time becomes visible on end screen").
//
// The daily's elapsed time and whether the board is finished live in the game's
// cap (StageChrome reads both off the figures and the save it already watches).
// The full-screen phone stages (PlayStage, WordStage, BracketStage) are separate
// components drawn over the page, so the cap PUBLISHES both here and any foot
// bar reads them, the same latest-wins store lib/stage-help.js uses for How to
// play. A stage that knows its own time or end may still pass them as props.
import { useEffect, useState } from 'react';

const state = { clock: null, done: false };
const subs = new Set();
function emit() { subs.forEach((f) => { try { f({ ...state }); } catch (e) {} }); }

export function publishStageClock(v) {
  const next = v == null ? null : String(v);
  if (state.clock === next) return;
  state.clock = next;
  emit();
}
export function publishStageDone(d) {
  if (state.done === !!d) return;
  state.done = !!d;
  emit();
}

export function useStageFootState() {
  const [s, setS] = useState({ clock: null, done: false });
  useEffect(() => {
    setS({ ...state });
    subs.add(setS);
    return () => { subs.delete(setS); };
  }, []);
  return s;
}
