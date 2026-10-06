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
//   <name>.json.gz    gzipped JSON { colsIdx, maxId, createdAt, rows }
//   <name>.meta.json  plain JSON   { colsIdx, maxId, createdAt, rowCount }
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
  try {
    const { data, error } = await admin.storage.from(BUCKET).download(`${name}.json.gz`);
    if (error || !data) return null;
    const buf = await blobToBuffer(data);
    if (!buf) return null;
    const snap = JSON.parse(zlib.gunzipSync(buf).toString('utf8'));
    if (!snap || !Array.isArray(snap.rows)) return null;
    return {
      rows: snap.rows,
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
    const { data, error } = await admin.storage.from(BUCKET).download(`${name}.meta.json`);
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
    const body = zlib.gzipSync(Buffer.from(JSON.stringify({ colsIdx, maxId, createdAt, rows }), 'utf8'));
    const meta = Buffer.from(JSON.stringify({ colsIdx, maxId, createdAt, rowCount: rows.length }), 'utf8');
    const put = (path, buf, type) => admin.storage.from(BUCKET).upload(path, buf, {
      contentType: type, upsert: true, cacheControl: '0',
    });
    let r = await put(`${name}.json.gz`, body, 'application/gzip');
    if (r.error && /bucket not found|not found/i.test(r.error.message || '')) {
      if (!(await ensureBucket(admin))) return false;
      r = await put(`${name}.json.gz`, body, 'application/gzip');
    }
    if (r.error) return false;
    const m = await put(`${name}.meta.json`, meta, 'application/json');
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
    const paths = ['quiz-results', 'admin-results'].flatMap((n) => [`${n}.json.gz`, `${n}.meta.json`]);
    const { data, error } = await admin.storage.from(BUCKET).remove(paths);
    if (error && /bucket not found|not found/i.test(error.message || '')) return { data: [], error: null };
    return { data: data || [], error: error || null };
  } catch (e) {
    return { data: [], error: e };
  }
}
