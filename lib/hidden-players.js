// HIDDEN FINISHES (owner, 2026-11-07).
//
// Results a player posted from a cutoff onward are kept in quiz_results but
// left out of every public board, point ladder, IQ field and drawing. Nothing
// is deleted, so lifting a hide is one line here.
//
// Applied at the two shared row loaders (lib/quiz-results-cache and
// lib/daily-results-cache), so every board built from them inherits it. Routes
// that show a player their OWN record (my-plays, daily-status, history, me...)
// pass { includeHidden: true } so the hidden player still sees what they played
// and is not offered a day they already finished.
//
// A guest browser the player has also posted from signed in (same anon_id on a
// signed-in row) is hidden from the same cutoff.

export const HIDDEN_PLAYERS = [
  // LoftyStandard: answer-perfect finishes in seconds across many games from
  // late October (Dossier 10/10 in 2s, Feud perfect daily, Warmer 100/100 in
  // under 15s). Owner ruling 2026-11-07: remove finishes from 2026-10-28 on.
  { userId: '2a74b78a-b49d-41dd-a75f-30608c300c9d', from: '2026-10-28T04:00:00Z' },
];

const BY_USER = new Map(HIDDEN_PLAYERS.map((h) => [h.userId, Date.parse(h.from)]));
const memo = new WeakMap();

function rowMs(r) {
  const t = r && r.created_at ? Date.parse(r.created_at) : NaN;
  return Number.isFinite(t) ? t : null;
}

// Returns `rows` itself when nothing is hidden, else a filtered copy, memoized
// on the array so the shared caches keep handing out one stable array per
// version (the derived caches key on array identity).
export function withoutHidden(rows) {
  if (!Array.isArray(rows) || !BY_USER.size) return rows;
  const hit = memo.get(rows);
  if (hit) return hit;
  const anonFrom = new Map();
  for (const r of rows) {
    const from = r && r.user_id ? BY_USER.get(r.user_id) : undefined;
    if (from !== undefined && r.anon_id) {
      const prev = anonFrom.get(r.anon_id);
      if (prev === undefined || from < prev) anonFrom.set(r.anon_id, from);
    }
  }
  let dropped = 0;
  const out = rows.filter((r) => {
    let from;
    if (r && r.user_id && BY_USER.has(r.user_id)) from = BY_USER.get(r.user_id);
    else if (r && !r.user_id && r.anon_id && anonFrom.has(r.anon_id)) from = anonFrom.get(r.anon_id);
    if (from === undefined) return true;
    const t = rowMs(r);
    // A row with no timestamp cannot be placed before the cutoff: hide it.
    if (t === null || t >= from) { dropped += 1; return false; }
    return true;
  });
  const res = dropped ? out : rows;
  memo.set(rows, res);
  return res;
}

// SHADOW VIEW (owner, 2026-11-07): a hidden player still sees their own
// finishes, leader spot included, on every board request that names them.
// Everyone else, signed in or not, gets the hidden rows dropped. `keys` is the
// Set from resolvePlayerKeys ('u:<id>' / 'a:<anon>'). A response built this
// way is personal and must be sent no-store.
export function isHiddenViewer(keys) {
  if (!keys || !BY_USER.size) return false;
  for (const k of keys) if (typeof k === 'string' && k.startsWith('u:') && BY_USER.has(k.slice(2))) return true;
  return false;
}
