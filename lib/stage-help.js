'use client';
// HOW TO PLAY ON THE STAGE (owner, 2026-10-27: "every gameplay page even in new
// mode should have an ? icon that loads how to play").
//
// The old cap (LoftCap) drew a ? from each game's onHelp. The phone stages
// (PlayStage, WordStage, GauntletStage, BracketStage, StageChrome's simple
// header) all share StageTopBar, which had no way to reach that handler:
// the stage and the cap are different components, and threading a prop through
// sixty clients for a button that has nothing to do with the game is the same
// trap lib/stage-theme.js avoids. So the cap REGISTERS its onHelp here, and the
// top bar draws a ? whenever one is registered. Latest mount wins; unmounting
// hands the slot back to whatever was there before.
import { useEffect, useRef, useState } from 'react';

const stack = [];
const subs = new Set();
function current() { return stack.length ? stack[stack.length - 1] : null; }
function emit() { const c = current(); subs.forEach((f) => { try { f(c); } catch (e) {} }); }

// Called by a cap with the game's own onHelp (null registers nothing).
export function useRegisterStageHelp(onHelp) {
  const ref = useRef(onHelp);
  ref.current = onHelp;
  const has = !!onHelp;
  useEffect(() => {
    if (!has) return undefined;
    const h = { open: () => { try { ref.current && ref.current(); } catch (e) {} } };
    stack.push(h);
    emit();
    return () => {
      const i = stack.indexOf(h);
      if (i >= 0) stack.splice(i, 1);
      emit();
    };
  }, [has]);
}

// Returns a function that opens the current game's rules, or null if none.
export function useStageHelp() {
  const [h, setH] = useState(null);
  useEffect(() => {
    setH(current());
    subs.add(setH);
    return () => { subs.delete(setH); };
  }, []);
  return h ? h.open : null;
}
