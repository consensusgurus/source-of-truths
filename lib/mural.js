// Mural and MuralToo, server side. Never import this from a 'use client' file.
//
// A mural's board (its photo and the grade of every piece) is made the first
// time anyone asks for it and kept in mural_boards (migration 69). Grading
// needs the photo's pixels, so this is the one place the site decodes a JPEG.
//
// PHOTOS: a mural reuses a Jig photo that went live at least a week ago, so it
// never gives away a coming Jig. The pick is seeded by the mural id, skips
// anything used by the last two weeks of murals, and prefers a photo that
// passes the flat-colour check below.
//
// FLAT COLOUR (owner, 2026-11-19): because flat pieces now score the most, the
// picture rule is looser than the first draft, but still a limit: a photo is
// passed over when more than a fifth of its pieces are flat, or one flat block
// covers more than 2.5% of it. If no candidate passes, the least flat one runs.

import jpeg from 'jpeg-js';
import { PUZZLES } from '@/app/jig/puzzles';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { MURAL_COLS, MURAL_ROWS, MURAL_TOTAL, MURAL_KINDS, MURAL_MIN_MS, MURAL_FAR_CLOSE, parseMuralId, muralIdAllowed, muralFirstOpens } from '@/lib/mural-shared';

const FLAT = 5, PLAIN = 10, BUSY = 20;
const MAX_FLAT_SHARE = 0.2;
const MAX_FLAT_BLOCK = Math.round(MURAL_TOTAL * 0.025);
const UA = 'MindLoft/1.0 (https://mindloftdaily.com; mural daily) node-fetch';

export function commonsUrl(title, width) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=${width}`;
}

// The crop every client makes too: the centred 25:16 window of the photo.
export function cropOf(w, h) {
  const want = MURAL_COLS / MURAL_ROWS;
  let cw = w, ch = Math.round(w / want);
  if (ch > h) { ch = h; cw = Math.round(h * want); }
  return { x: Math.floor((w - cw) / 2), y: Math.floor((h - ch) / 2), w: cw, h: ch };
}

export function gradePixels(data, width, height) {
  const c = cropOf(width, height);
  const cw = c.w / MURAL_COLS, ch = c.h / MURAL_ROWS;
  const detail = new Float32Array(MURAL_TOTAL);
  for (let r = 0; r < MURAL_ROWS; r++) {
    for (let col = 0; col < MURAL_COLS; col++) {
      const x0 = c.x + Math.floor(col * cw), x1 = c.x + Math.max(Math.floor(col * cw) + 1, Math.floor((col + 1) * cw));
      const y0 = c.y + Math.floor(r * ch), y1 = c.y + Math.max(Math.floor(r * ch) + 1, Math.floor((r + 1) * ch));
      let n = 0, s = 0, s2 = 0;
      for (let y = y0; y < y1; y++) {
        let o = (y * width + x0) * 4;
        for (let x = x0; x < x1; x++, o += 4) {
          const l = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
          s += l; s2 += l * l; n++;
        }
      }
      const m = n ? s / n : 0;
      detail[r * MURAL_COLS + col] = n ? Math.sqrt(Math.max(0, s2 / n - m * m)) : 0;
    }
  }
  const patch = new Int32Array(MURAL_TOTAL), seen = new Uint8Array(MURAL_TOTAL);
  let flat = 0, big = 0;
  for (let i = 0; i < MURAL_TOTAL; i++) {
    if (detail[i] >= FLAT) continue;
    flat++;
    if (seen[i]) continue;
    const q = [i], mem = [];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      mem.push(j);
      const col = j % MURAL_COLS, r = (j / MURAL_COLS) | 0;
      const nb = [col > 0 ? j - 1 : -1, col < MURAL_COLS - 1 ? j + 1 : -1, r > 0 ? j - MURAL_COLS : -1, r < MURAL_ROWS - 1 ? j + MURAL_COLS : -1];
      for (const k of nb) if (k >= 0 && !seen[k] && detail[k] < FLAT) { seen[k] = 1; q.push(k); }
    }
    for (const j of mem) patch[j] = mem.length;
    if (mem.length > big) big = mem.length;
  }
  let grades = '';
  for (let i = 0; i < MURAL_TOTAL; i++) {
    const col = i % MURAL_COLS, r = (i / MURAL_COLS) | 0;
    const ec = col === 0 || col === MURAL_COLS - 1, er = r === 0 || r === MURAL_ROWS - 1;
    let g;
    if (ec && er) g = 1;
    else if (ec || er) g = 2;
    else if (detail[i] < FLAT) g = patch[i] >= 50 ? 12 : patch[i] >= 10 ? 10 : 8;
    else if (detail[i] < PLAIN) g = 6;
    else if (detail[i] < BUSY) g = 4;
    else g = 3;
    grades += g.toString(36);
  }
  const share = flat / MURAL_TOTAL;
  return { grades, flatShare: share, flatBlock: big, pass: share <= MAX_FLAT_SHARE && big <= MAX_FLAT_BLOCK };
}

async function gradePhoto(title) {
  const up = await fetch(commonsUrl(title, 1280), { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!up.ok) throw new Error(`photo ${up.status}`);
  const buf = Buffer.from(await up.arrayBuffer());
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
  return gradePixels(img.data, img.width, img.height);
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function etYmd(ms) {
  try { return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date(ms).toISOString().slice(0, 10); }
}

function missing(error) {
  const m = String((error && (error.message || error.code)) || '');
  return /does not exist|schema cache|PGRST202|PGRST205|42P01|42883/i.test(m);
}

const BOARD_COLS = 'id, kind, opens_at, closes_at, completed_at, photo, name, lic, by, cols, rows, grades';

// The board row for a mural. With `opens` (only currentBoard passes it) a
// missing row is made, opening at that instant and open until finished; without
// it only an existing board is returned (a shelf copy reads one by id).
// Returns { board } or { unavailable: true } (migration 69 not applied) or
// { notOpen: true }.
export async function ensureBoard(admin, id, opts = null) {
  const p = parseMuralId(id);
  if (!p || !muralIdAllowed(id)) return { notOpen: true };
  const now = Date.now();
  const win = opts && opts.opens ? { opens: opts.opens, closes: Date.parse(MURAL_FAR_CLOSE) } : null;
  if (win && now < win.opens) return { notOpen: true };

  const got = await admin.from('mural_boards').select(BOARD_COLS).eq('id', id).maybeSingle();
  if (got.error) { if (missing(got.error)) return { unavailable: true }; throw got.error; }
  // AN OPEN MURAL OF THE OLD SIZE IS RECUT (2026-11-19, 10,000 to 4,000 pieces).
  // mural_resize() (migration 71) keeps the old board and every placement on it
  // under an archive id, so nothing is lost and the day's points still count,
  // then gives this id the new cut. It happens once, on the first ask.
  if (got.data && (got.data.cols !== MURAL_COLS || got.data.rows !== MURAL_ROWS) && !got.data.completed_at && now < Date.parse(got.data.closes_at)) {
    try {
      const g = await gradePhoto(got.data.photo);
      const rz = await admin.rpc('mural_resize', { p_id: id, p_cols: MURAL_COLS, p_rows: MURAL_ROWS, p_grades: g.grades });
      if (rz.error) throw rz.error;
      const fresh = await admin.from('mural_boards').select(BOARD_COLS).eq('id', id).maybeSingle();
      if (fresh.data) return { board: fresh.data };
    } catch (e) { console.error('mural resize', id, e); }
  }
  if (got.data) return { board: got.data };
  if (!win) return { notOpen: true };

  const weekAgo = etYmd(now - 7 * 86400000);
  const recent = await admin.from('mural_boards').select('photo').order('opens_at', { ascending: false }).limit(28);
  const used = new Set((recent.data || []).map((r) => r.photo));
  const pool = PUZZLES.filter((x) => x.t && x.live <= weekAgo && x.cols >= x.rows && /\.jpe?g$/i.test(x.t));
  const fresh = pool.filter((x) => !used.has(x.t));
  const list = (fresh.length ? fresh : pool).slice().sort((a, b) => hash(id + a.t) - hash(id + b.t));
  if (!list.length) return { notOpen: true };

  let best = null;
  const why = [];
  for (const cand of list.slice(0, 4)) {
    let g = null;
    try { g = await gradePhoto(cand.t); } catch (e) { why.push(String((e && e.message) || e).slice(0, 160)); continue; }
    if (!best || g.flatShare < best.g.flatShare) best = { cand, g };
    if (g.pass) { best = { cand, g }; break; }
  }
  if (!best) { console.error('mural grade', id, why); return { notOpen: true, why }; }

  const row = {
    id, kind: p.kind,
    opens_at: new Date(win.opens).toISOString(), closes_at: new Date(win.closes).toISOString(),
    photo: best.cand.t, name: best.cand.name || null, lic: best.cand.lic || null, by: best.cand.by || null,
    cols: MURAL_COLS, rows: MURAL_ROWS, grades: best.g.grades,
  };
  const ins = await admin.from('mural_boards').upsert(row, { onConflict: 'id', ignoreDuplicates: true });
  if (ins.error) { if (missing(ins.error)) return { unavailable: true }; throw ins.error; }
  const again = await admin.from('mural_boards').select(BOARD_COLS).eq('id', id).maybeSingle();
  if (again.error) throw again.error;
  return again.data ? { board: again.data } : { notOpen: true };
}

// PACING (owner, 2026-11-19: "max number of puzzles complete in 72 hours should
// be 3 ... if there is inventory left, open it up, but only until pacing of new
// puzzles is once every 24 hours"). A finished board's successor opens the
// moment it is finished, as long as no more than three boards of the kind open
// in any 72 hours: so the earliest is 72 hours after the board two before the
// current one opened. Before there is that much history, the missing boards
// count as if they had opened a day apart, so a fast first board still waits
// out its 24 hours, and a slow board lets the next two catch up back to one a day.
function muralNextAt(rows, done) {
  const cur = Date.parse(rows[0].opens_at);
  const prev = rows[1] ? Date.parse(rows[1].opens_at) : cur - MURAL_MIN_MS;
  const prev2 = rows[2] ? Date.parse(rows[2].opens_at) : prev - MURAL_MIN_MS;
  return Math.max(done, prev2 + 3 * MURAL_MIN_MS);
}

// WHICH BOARD IS OPEN NOW for a kind (run until finished, 2026-11-19). The
// newest board of the kind is current until it is finished and 24 hours old;
// then the next is made, opening at the later of those two moments, and the old
// one is closed at that instant. Boards made under the old noon-to-noon rule get
// their close pushed out on first sight, so they too run until finished.
export async function currentBoard(admin, kind) {
  const k = MURAL_KINDS[kind];
  if (!k) return { notOpen: true };
  const now = Date.now();
  const lat = await admin.from('mural_boards').select(BOARD_COLS)
    .eq('kind', kind).like('id', `${kind}-____-__-__`)
    .order('opens_at', { ascending: false }).limit(3);
  if (lat.error) { if (missing(lat.error)) return { unavailable: true }; throw lat.error; }
  const rows = lat.data || [];
  const b = rows[0] || null;
  if (!b) {
    const first = muralFirstOpens(kind);
    if (!first || now < first) return { notOpen: true };
    return ensureBoard(admin, `${kind}-${k.first}`, { opens: first });
  }
  const opened = Date.parse(b.opens_at);
  const done = b.completed_at ? Date.parse(b.completed_at) : null;
  if (done != null) {
    const nextAt = muralNextAt(rows, done);
    if (now >= nextAt) {
      // Catch-up can open two boards on one Eastern date, and an id is a date, so a
      // second one that day takes the next free date as its id (only a label).
      let id = `${kind}-${etYmd(nextAt)}`;
      // Another request may have opened the next board a moment ago; if so, serve it.
      const newer = await admin.from('mural_boards').select(BOARD_COLS).eq('kind', kind).like('id', `${kind}-____-__-__`).gt('opens_at', b.opens_at).order('opens_at', { ascending: false }).limit(1).maybeSingle();
      if (!newer.error && newer.data) return { board: newer.data };
      for (let i = 0; i < 7; i++) {
        const taken = await admin.from('mural_boards').select('id').eq('id', id).maybeSingle();
        if (taken.error || !taken.data) break;
        const d = new Date(Date.parse(id.slice(kind.length + 1) + 'T12:00:00Z') + 86400000);
        id = `${kind}-${d.toISOString().slice(0, 10)}`;
      }
      if (id !== b.id) {
        const made = await ensureBoard(admin, id, { opens: nextAt });
        if (made.board) {
          await admin.from('mural_boards').update({ closes_at: new Date(nextAt).toISOString() }).eq('id', b.id).gt('closes_at', new Date(nextAt).toISOString());
          return made;
        }
      }
    }
    return { board: b, nextAt };
  }
  if (Date.parse(b.closes_at) < Date.parse(MURAL_FAR_CLOSE)) {
    const up = await admin.from('mural_boards').update({ closes_at: MURAL_FAR_CLOSE }).eq('id', b.id).is('completed_at', null);
    if (up.error) console.error('mural extend', b.id, up.error);
    else b.closes_at = MURAL_FAR_CLOSE;
  }
  return { board: b };
}

// THE BOARD THAT WAS OPEN ON A SITE DAY (the Puzzle Archive's ?p= link, owner
// 2026-11-19). A mural runs until it is finished, so a day has no board of its
// own: this is the newest board of the kind that had opened by the end of that
// Eastern day. Read only; it never makes a board.
export async function boardOnDay(admin, kind, day) {
  if (!MURAL_KINDS[kind] || !/^\d{4}-\d{2}-\d{2}$/.test(String(day || ''))) return { notOpen: true };
  // The Eastern day ends at 04:00 or 05:00 UTC the next day; 05:00 covers both.
  const end = new Date(Date.parse(`${day}T05:00:00Z`) + 86400000);
  if (Number.isNaN(end.getTime())) return { notOpen: true };
  const r = await admin.from('mural_boards').select(BOARD_COLS)
    .eq('kind', kind).like('id', `${kind}-____-__-__`)
    .lt('opens_at', end.toISOString())
    .order('opens_at', { ascending: false }).limit(1).maybeSingle();
  if (r.error) { if (missing(r.error)) return { unavailable: true }; throw r.error; }
  return r.data ? { board: r.data } : { notOpen: true };
}

// Who is placing: a signed-in player by account, anyone else by their browser's
// anonymous id. Guests are players; the finish screen puts them in one bubble.
export async function muralPlayer(admin, { anonId, email }) {
  const anon = typeof anonId === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(anonId) ? anonId : null;
  let user = null;
  try { user = await findQuizIdentity(admin, { email, anonId: anon }); } catch (e) { user = null; }
  if (user && user.id && user.username) return { player: `u:${user.id}`, userId: user.id, name: user.username };
  if (!anon) return null;
  return { player: `a:${anon}`, userId: null, name: null };
}

export function publicBoard(b) {
  return {
    id: b.id, kind: b.kind, name: MURAL_KINDS[b.kind] ? MURAL_KINDS[b.kind].name : 'Mural',
    opens: Date.parse(b.opens_at), closes: Date.parse(b.closes_at),
    completed: b.completed_at ? Date.parse(b.completed_at) : null,
    cols: b.cols, rows: b.rows, grades: b.grades,
    photo: { name: b.name, lic: b.lic, by: b.by },
  };
}

export { missing as muralTableMissing };
