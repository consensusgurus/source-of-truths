'use client';
import { gameActive } from './game-active.js';

// THE POST-GAME POP-UP GATE (owner rule, 2026-10-17).
//
// "Bring a friend for $100" opened in the middle of a game. The pop-ups waited
// a flat five seconds after ANY saved result and then checked almost nothing,
// so the timer from the game you just finished fired on top of the game you had
// already moved on to: a client-side hop to the next daily, an instant replay of
// an End Game loss, a circuit hand-off. The layout never unmounts, so the timer
// survived all of them.
//
// The rule now, for every pop-up that follows a finished game:
//   1. NEVER WHILE A GAME IS ONGOING. The pop-up is cancelled outright if the
//      page moved since the save, or if the finish card that came up has since
//      gone away (Replay, Play again, Next: a new game is on the board).
//   2. TEN SECONDS AFTER THE CONCLUSION, AND TEN QUIET ONES. The clock starts at
//      the save, waits out the finish beat and the curtain flood, and restarts
//      on any key press or any tap outside the finish card. Reading or scrolling
//      the end card does not hold it up; playing does.
// When in doubt it does NOT show. These pop-ups are once a week, so a skipped
// showing costs nothing and the next finished game tries again.

export const POST_GAME_QUIET_MS = 10000;

const FINISH_SEL = '.stf, .loft-back, .dec-backdrop';
let installed = false;
let lastInput = 0;
let finishOpen = false;
let finishClosedAt = 0;

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const onKey = () => { lastInput = Date.now(); };
  const onPoint = (e) => {
    try { if (e && e.target && e.target.closest && e.target.closest(FINISH_SEL)) return; } catch (err) {}
    lastInput = Date.now();
  };
  window.addEventListener('keydown', onKey, { capture: true, passive: true });
  window.addEventListener('pointerdown', onPoint, { capture: true, passive: true });
  window.addEventListener('sot:loft-finish', (e) => {
    const open = !!(e && e.detail && e.detail.open);
    finishOpen = open;
    if (!open) finishClosedAt = Date.now();
  });
}

// Install the listeners at mount, so input and finish-card events that happen
// BEFORE the first save are already being tracked.
export function trackPostGame() { install(); }

function finishNow() {
  if (finishOpen) return true;
  try { return !!document.querySelector(FINISH_SEL); } catch (e) { return false; }
}

function here() {
  try { return window.location.pathname + window.location.search; } catch (e) { return ''; }
}

// Call when a finished game is saved. onReady fires once the game has been over
// for POST_GAME_QUIET_MS of quiet, or never. Returns a cancel function.
export function afterGameConcludes(onReady, quietMs = POST_GAME_QUIET_MS) {
  install();
  const savedAt = Date.now();
  const url = here();
  let sawFinish = finishNow();
  let timer = null;
  let dead = false;
  const tick = () => {
    if (dead) return;
    if (here() !== url) return;                         // moved on to another page
    if (finishNow()) sawFinish = true;
    else if (sawFinish || finishClosedAt > savedAt) return; // the card left: a new game is on
    const html = document.documentElement;
    if ((html.dataset && html.dataset.sotBeat) || document.querySelector('.stf-flood, .sst')) {
      timer = setTimeout(tick, 600);
      return;
    }
    const since = Date.now() - Math.max(savedAt, lastInput);
    if (since < quietMs) { timer = setTimeout(tick, quietMs - since + 50); return; }
    if (document.visibilityState === 'hidden') return;
    if (gameActive()) return;                           // owner, 2026-10-23: never mid game
    dead = true;
    onReady();
  };
  timer = setTimeout(tick, quietMs);
  return () => { dead = true; clearTimeout(timer); };
}
