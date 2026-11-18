// Cross-instance results snapshots live in Supabase STORAGE, not in a table
// (Disk IO fix, 2026-10-06).
//
// WHY: migrations 44 and 55 kept the snapshot as one gzipped, base64 row in
// Postgres. That was 0.5MB when it shipped and about 5MB by October, and every
// refresh inserted a new 5MB row and deleted the old one. pg_stat_statements
// put that insert + delete at ~29GB of WAL and ~2.5M written blocks since May,
// against under 1GB for every real write on the site combined, and it is what
// drained the project's Disk IO budget (Supabase warning, 2026-10-06).
//
// Storage is object storage outside the database disk, so writing a snapshot
// costs the database nothing but one small storage.objects metadata row.
//
// LAYOUT, per snapshot name, in the private bucket below:
//   <name>.v2.ndjson.gz  gzipped lines: a header { v: 2, colsIdx, maxId, createdAt,
//                        rowCount }, then one JSON array of up to CHUNK rows a line
//   <name>.v2.meta.json  plain JSON { colsIdx, maxId, createdAt, rowCount }
//   <name>.json.gz / <name>.meta.json  the v1 layout (one JSON object), still READ
//                        as a fallback, never written
//
// WHY LINES (2026-11-18, admin Refresh dying with "instance was killed because it
// ran out of available memory" at 600,006 rows): v1 wrote the snapshot as ONE
// JSON.stringify of every row, copied into a Buffer and gzipped (two ~250MB
// copies on top of the rows), and read it as one ~250MB string before parsing.
// v2 streams the write a chunk at a time and parses the read a line at a time
// out of the gunzipped Buffer, so no whole-table string ever exists, and every
// short string value is interned (JSON.parse makes a fresh copy of "US",
// "Chrome", a quiz id or a player id on every row: interning cut a synthetic
// 600,000-row table from 230MB to 135MB of heap).
// The meta file is what the pre-write freshness check reads, so deciding NOT to
// write never downloads the 5MB body. The body is written first and the meta
// second, so a meta file never describes a body that is not there yet; a reader
// only ever trusts the header inside the body it actually downloaded.
//
// Every call is wrapped and returns null / false on any failure, so a missing
// bucket, a storage outage or a bad file degrades to the plain keyset load the
// caches already fall back to. A snapshot is a cache of ROWS, never a figure.

import zlib from 'node:zlib';

const BUCKET = 'results-snapshots';
const CHUNK = 2000;
const INTERN_MAX = 64;

// One copy of each short string value across the rows (in place).
export function internRows(rows, pool = new Map()) {
  for (const r of rows) {
    for (const k in r) {
      const v = r[k];
      if (typeof v !== 'string' || v.length > INTERN_MAX) continue;
      const c = pool.get(v);
      if (c === undefined) pool.set(v, v); else r[k] = c;
    }
  }
  return rows;
}

// Gzip the snapshot a chunk at a time: the header line, then CHUNK rows a line.
export function encodeSnapshotV2(rows, head) {
  return new Promise((resolve, reject) => {
    const gz = zlib.createGzip();
    const out = [];
    gz.on('data', (b) => out.push(b));
    gz.on('end', () => resolve(Buffer.concat(out)));
    gz.on('error', reject);
    gz.write(JSON.stringify({ v: 2, ...head, rowCount: rows.length }) + '\n');
    let i = 0;
    const pump = () => {
      while (i < rows.length) {
        const line = JSON.stringify(rows.slice(i, i + CHUNK)) + '\n';
        i += CHUNK;
        if (!gz.write(line)) { gz.once('drain', pump); return; }
      }
      gz.end();
    };
    pump();
  });
}

// -> { rows, maxId, colsIdx, createdAt } or null. Parses line by line out of the
// gunzipped Buffer and interns as it goes.
export function decodeSnapshotV2(gzBuf) {
  const buf = zlib.gunzipSync(gzBuf);
  let at = buf.indexOf(10);
  if (at < 0) return null;
  const head = JSON.parse(buf.toString('utf8', 0, at));
  if (!head || head.v !== 2) return null;
  const rows = [];
  const pool = new Map();
  let start = at + 1;
  while (start < buf.length) {
    let end = buf.indexOf(10, start);
    if (end < 0) end = buf.length;
    if (end > start) {
      const part = JSON.parse(buf.toString('utf8', start, end));
      internRows(part, pool);
      for (const r of part) rows.push(r);
    }
    start = end + 1;
  }
  if (Number(head.rowCount) !== rows.length) return null;
  return { rows, maxId: Number(head.maxId) || 0, colsIdx: Number(head.colsIdx), createdAt: Number(head.createdAt) || 0 };
}

async function ensureBucket(admin) {
  try {
    const { error } = await admin.storage.createBucket(BUCKET, { public: false });
    if (error && !/already exists|duplicate/i.test(error.message || '')) return false;
    return true;
  } catch (e) {
    return false;
  }
}

async function blobToBuffer(data) {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (typeof data.arrayBuffer === 'function') return Buffer.from(await data.arrayBuffer());
  return null;
}

// -> { rows, maxId, colsIdx, createdAt } or null
export async function readStoredSnapshot(admin, name) {
  // One retry: Storage reads go through the database too, so a busy minute
  // makes them time out, and the fallback (paging the whole table) is far more
  // expensive than a second attempt.
  const first = await readStoredSnapshotOnce(admin, name);
  if (first) return first;
  await new Promise((r) => setTimeout(r, 400));
  return readStoredSnapshotOnce(admin, name);
}

async function readStoredSnapshotOnce(admin, name) {
  try {
    const v2 = await admin.storage.from(BUCKET).download(`${name}.v2.ndjson.gz`);
    if (!v2.error && v2.data) {
      const buf = await blobToBuffer(v2.data);
      const snap = buf ? decodeSnapshotV2(buf) : null;
      if (snap) return snap;
    }
  } catch (e) { /* fall back to v1 */ }
  try {
    const { data, error } = await admin.storage.from(BUCKET).download(`${name}.json.gz`);
    if (error || !data) return null;
    const buf = await blobToBuffer(data);
    if (!buf) return null;
    const snap = JSON.parse(zlib.gunzipSync(buf).toString('utf8'));
    if (!snap || !Array.isArray(snap.rows)) return null;
    return {
      rows: internRows(snap.rows),
      maxId: Number(snap.maxId) || 0,
      colsIdx: Number(snap.colsIdx),
      createdAt: Number(snap.createdAt) || 0,
    };
  } catch (e) {
    return null;
  }
}

// -> { maxId, colsIdx, createdAt } or null. Tiny; used to skip redundant writes.
export async function readStoredSnapshotMeta(admin, name) {
  try {
    const { data, error } = await admin.storage.from(BUCKET).download(`${name}.v2.meta.json`);
    if (error || !data) return null;
    const buf = await blobToBuffer(data);
    if (!buf) return null;
    const m = JSON.parse(buf.toString('utf8'));
    return { maxId: Number(m.maxId) || 0, colsIdx: Number(m.colsIdx), createdAt: Number(m.createdAt) || 0 };
  } catch (e) {
    return null;
  }
}

export async function writeStoredSnapshot(admin, name, rows, colsIdx) {
  try {
    const createdAt = Date.now();
    const maxId = rows.length ? rows[rows.length - 1].id : 0;
    const body = await encodeSnapshotV2(rows, { colsIdx, maxId, createdAt });
    const meta = Buffer.from(JSON.stringify({ colsIdx, maxId, createdAt, rowCount: rows.length }), 'utf8');
    const put = (path, buf, type) => admin.storage.from(BUCKET).upload(path, buf, {
      contentType: type, upsert: true, cacheControl: '0',
    });
    let r = await put(`${name}.v2.ndjson.gz`, body, 'application/gzip');
    if (r.error && /bucket not found|not found/i.test(r.error.message || '')) {
      if (!(await ensureBucket(admin))) return false;
      r = await put(`${name}.v2.ndjson.gz`, body, 'application/gzip');
    }
    if (r.error) return false;
    const m = await put(`${name}.v2.meta.json`, meta, 'application/json');
    return !m.error;
  } catch (e) {
    return false;
  }
}

// Drops every stored snapshot (quiz and admin), so the next reader rebuilds
// from the table. Used by the admin routes that rewrite or remove rows in a way
// a count+delta check cannot see (renames, merges, clears, credits).
// Same { data, error } shape the old `.delete().select('id')` returned.
export async function dropStoredSnapshots(admin) {
  try {
    const paths = ['quiz-results', 'admin-results'].flatMap((n) => [`${n}.json.gz`, `${n}.meta.json`, `${n}.v2.ndjson.gz`, `${n}.v2.meta.json`]);
    const { data, error } = await admin.storage.from(BUCKET).remove(paths);
    if (error && /bucket not found|not found/i.test(error.message || '')) return { data: [], error: null };
    return { data: data || [], error: error || null };
  } catch (e) {
    return { data: [], error: e };
  }
}

// ── generic stored objects (2026-10-27) ──────────────────────────────────────
// The same body + meta layout for a computed payload rather than rows. Used by
// the shared IQ field (lib/iq-field.js): ~1-2MB gzipped, rewritten every ten
// minutes, which is exactly the kind of write that drained the Disk IO budget
// when it lived in a table row. `at` is the payload's own build time.
//   <name>.json.gz    gzipped JSON payload
//   <name>.meta.json  { at, bytes }

// -> epoch ms the stored payload was built, or 0. Downloads only the meta file.
export async function readStoredObjectAt(admin, name) {
  try {
    const { data, error } = await admin.storage.from(BUCKET).download(`${name}.meta.json`);
    if (error || !data) return 0;
    const buf = await blobToBuffer(data);
    if (!buf) return 0;
    return Number(JSON.parse(buf.toString('utf8')).at) || 0;
  } catch (e) {
    return 0;
  }
}

// -> the parsed payload, or null.
export async function readStoredObject(admin, name) {
  try {
    const { data, error } = await admin.storage.from(BUCKET).download(`${name}.json.gz`);
    if (error || !data) return null;
    const buf = await blobToBuffer(data);
    if (!buf) return null;
    return JSON.parse(zlib.gunzipSync(buf).toString('utf8'));
  } catch (e) {
    return null;
  }
}

// Body first, meta second, so a meta file never describes a body that is not
// there yet. -> { ok, bytes }
export async function writeStoredObject(admin, name, payload, at) {
  try {
    const body = zlib.gzipSync(Buffer.from(JSON.stringify(payload), 'utf8'));
    const meta = Buffer.from(JSON.stringify({ at, bytes: body.length }), 'utf8');
    const put = (path, buf, type) => admin.storage.from(BUCKET).upload(path, buf, {
      contentType: type, upsert: true, cacheControl: '0',
    });
    let r = await put(`${name}.json.gz`, body, 'application/gzip');
    if (r.error && /bucket not found|not found/i.test(r.error.message || '')) {
      if (!(await ensureBucket(admin))) return { ok: false, bytes: body.length };
      r = await put(`${name}.json.gz`, body, 'application/gzip');
    }
    if (r.error) return { ok: false, bytes: body.length };
    const m = await put(`${name}.meta.json`, meta, 'application/json');
    return { ok: !m.error, bytes: body.length };
  } catch (e) {
    return { ok: false, bytes: 0 };
  }
}
