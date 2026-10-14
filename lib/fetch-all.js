// PostgREST (Supabase) caps any single select at 1000 rows, and the overflow
// is dropped SILENTLY: no error, the rows just never arrive. list_sources_seen
// crossed the cap on 2026-06-07 and quietly broke the consensus cron's
// first-sighting detection. Use this helper for any read that is meant to
// return a WHOLE table that grows with content (votes, views, extras,
// vote_events, list_sources_seen, comments...). It pages in stable key order
// until a short page arrives.
//
// Returns the familiar { data, error } shape so call sites written for a
// plain supabase select keep working: on a mid-pagination error you get the
// rows collected so far plus the error.
// Keyset paging for the common `['id']` order (Disk IO fix, 2026-10-14).
//
// The offset loop below asks Postgres for "rows N to N+999 in id order" on
// every page. Whenever the filter is served by a different index (quiz_id IN
// (...), created_at >= ...), Postgres has to SORT every matching row up to the
// offset on every page, and past work_mem that sort spills to temp files. On
// quiz_results this was ~270 GB of temp writes across ~49k calls, the single
// largest consumer of the Supabase Disk IO budget. `id > lastId ... LIMIT 1000`
// bounds every page's sort to 1000 rows (or walks the pkey with no sort at
// all), so nothing spills. Same rows, same ascending id order, same contract.
// If the select omits `id`, it is added so the cursor can advance; callers
// that ignore extra fields are unaffected.
function idOnlyOrder(orderCols) {
  if (!Array.isArray(orderCols) || orderCols.length !== 1) return false;
  const o = orderCols[0];
  if (o === 'id') return true;
  return Array.isArray(o) && o[0] === 'id' && o[1] !== false;
}

async function fetchAllRowsKeyset(client, table, cols, filter, STEP) {
  const parts = String(cols || '*').split(',').map((c) => c.trim());
  const sel = (parts.includes('*') || parts.includes('id')) ? cols : `id,${cols}`;
  const out = [];
  let lastId = null;
  for (;;) {
    let q = client.from(table).select(sel).order('id', { ascending: true });
    if (filter) q = filter(q);
    if (lastId != null) q = q.gt('id', lastId);
    const { data, error } = await q.limit(STEP);
    if (error) return { data: out, error };
    const page = data || [];
    out.push(...page);
    if (page.length < STEP) break;
    lastId = page[page.length - 1].id;
    if (lastId == null) break; // defensive: never loop on a row with no id
  }
  return { data: out, error: null };
}

export async function fetchAllRows(client, table, cols, orderCols = [], filter) {
  const STEP = 1000;
  if (idOnlyOrder(orderCols)) return fetchAllRowsKeyset(client, table, cols, filter, STEP);
  const out = [];
  for (let from = 0; ; from += STEP) {
    let q = client.from(table).select(cols);
    for (const o of orderCols) {
      const [col, ascending] = Array.isArray(o) ? o : [o, true];
      q = q.order(col, { ascending });
    }
    if (filter) q = filter(q);
    const { data, error } = await q.range(from, from + STEP - 1);
    if (error) return { data: out, error };
    out.push(...(data || []));
    if (!data || data.length < STEP) break;
  }
  return { data: out, error: null };
}
