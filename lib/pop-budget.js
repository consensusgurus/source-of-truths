'use client';

// ONE POP-UP A VISIT (owner, 2026-11-15: "New users are getting far too many
// pop-ups - at most once per visit.").
//
// Every pop-up that opens ITSELF asks claimPop('<its name>') at the moment it
// would open, after every other test has passed and BEFORE it stamps itself
// seen. The first one to ask owns the visit; every other one is told no and
// keeps its turn for a later visit, because it never stamped. The entry door
// is a pop-up and claims the visit like any other.
//
// A VISIT is this tab's session, or four hours from the pop-up that claimed it,
// whichever ends first (a tab left open for days would otherwise never see
// another one).
//
// NOT COUNTED: anything the reader opens by pressing a button (How to play, the
// page look menu, Choose a Name, search), a trophy (it is the result of a
// play, held until the game is over), and a game's own in-play sheets. A
// preview link (?premiere=1, ?entry=1 and the rest) always opens.
//
// gameActive() (lib/game-active.js) is still asked separately, first.

const KEY = 'sot_pop_visit';
const VISIT_MS = 4 * 3600 * 1000;
const PREVIEW = /[?&](premiere|entry|drawing|groups|look|spacecadet|eagleeye|eagle|thanks|pop|door|welcome)=/;
let mem = null;

function read() {
  let v = mem;
  try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && s.id) v = s; } catch (e) { /* storage off: this page only */ }
  if (v && Date.now() - (v.at || 0) > VISIT_MS) v = null;
  return v;
}

// True when ANOTHER pop-up already has this visit. Reads only; claims nothing.
export function popSpent(id) {
  if (typeof window === 'undefined') return true;
  try { if (PREVIEW.test(window.location.search)) return false; } catch (e) {}
  const v = read();
  return !!v && v.id !== id;
}

// Ask to open. True means go ahead (and the visit is now this pop-up's).
export function claimPop(id) {
  if (typeof window === 'undefined') return false;
  try { if (PREVIEW.test(window.location.search)) return true; } catch (e) {}
  const v = read();
  if (v && v.id !== id) return false;
  if (!v) {
    mem = { id, at: Date.now() };
    try { sessionStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {}
  }
  return true;
}
