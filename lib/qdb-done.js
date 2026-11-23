// THE DATABASES' COMPLETION RECORD (owner, 2026-11-23: a full-screen view "for
// players in the various databases that show progress to completion").
//
// One record for all four databases, in this browser only: every question key
// ('bank:id') this reader has answered on a database page, 1 = answered right
// at least once, 2 = answered but never right yet. Keys are shared across
// databases on purpose: the science banks play in both the Science Database and
// Trivia's Science topic, so a question answered in one is done in the other.
//
// `f` holds the keys answered since the map was last opened (newest first), so
// the map can light them up on its next opening. `bf` marks the databases whose
// older record (lib/qdb.js storeKey: the 4,000 most recent seen keys and the
// missed list) has been folded in, once, so nobody opens the map to a blank wall.
//
// Safe in a client bundle: no question data.

import { storeKey } from './qdb.js';

export const DONE_KEY = 'sot_qdb_done';
const FRESH_CAP = 2000;
let mem = null;

function load() {
  if (mem) return mem;
  let s = null;
  try { s = JSON.parse(localStorage.getItem(DONE_KEY) || 'null'); } catch (e) {}
  mem = s && typeof s === 'object' && s.d && typeof s.d === 'object'
    ? { d: s.d, f: Array.isArray(s.f) ? s.f : [], bf: s.bf && typeof s.bf === 'object' ? s.bf : {} }
    : { d: {}, f: [], bf: {} };
  return mem;
}
function save() { try { localStorage.setItem(DONE_KEY, JSON.stringify(mem)); } catch (e) {} }

// Fold a database's older record in, the first time it is read.
function backfill(db) {
  const s = load();
  if (s.bf[db]) return;
  try {
    const old = JSON.parse(localStorage.getItem(storeKey(db)) || 'null');
    if (old && Array.isArray(old.s)) {
      const miss = new Set(Array.isArray(old.m) ? old.m : []);
      for (const k of old.s) if (typeof k === 'string' && !s.d[k]) s.d[k] = miss.has(k) ? 2 : 1;
    }
  } catch (e) {}
  s.bf[db] = 1;
  save();
}

export function readDone(db) {
  if (typeof window === 'undefined') return { d: {}, f: [] };
  backfill(db);
  return load();
}

export function markDone(key, right) {
  if (typeof window === 'undefined' || !key) return;
  const s = load();
  const was = s.d[key];
  s.d[key] = right || was === 1 ? 1 : 2;
  if (!was || (was === 2 && right)) s.f = [key, ...s.f.filter((k) => k !== key)].slice(0, FRESH_CAP);
  save();
}

// The map has been looked at: nothing is fresh any more.
export function clearFresh() {
  const s = load();
  if (!s.f.length) return;
  s.f = [];
  save();
}

// Done keys from the given banks, for the deal's `seen` list (oldest questions
// first, never the ones already answered), beyond the 4,000 the page keeps.
export function doneKeysFor(banks) {
  if (typeof window === 'undefined') return [];
  const s = load();
  const set = new Set(banks || []);
  return Object.keys(s.d).filter((k) => set.has(k.slice(0, k.indexOf(':'))));
}
