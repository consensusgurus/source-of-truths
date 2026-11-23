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
// VARIETY (owner, 2026-11-20: "Mural and MuralToo images are too homogeneous
// ... future murals need more variance in the image"). The first boards were a
// lake from above and an alpine meadow: big stretches of one colour. The 11-19
// rule (pass over a photo only when a fifth of it is flat) let those through.
// Now a photo must pass all of these, measured on the 80 x 50 cut:
//   flat pieces (no texture at all)            at most 8%
//   plain pieces (flat or nearly)              at most 30%
//   the biggest flat block                     at most 1% of the board
//   the most common piece colour               at most 12% of pieces
//   colour spread (entropy of piece colours)   at least 5 bits
// Eight candidates are graded and the most varied passing one runs; if none
// pass, the most varied of the eight. Flat pieces still score the most when
// they do appear, so a few plain patches are fine.

import jpeg from 'jpeg-js';
import { PUZZLES } from '@/app/jig/puzzles';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { MURAL_SCALE_FLAT, MURAL_SCALE_V1, MURAL_COLS, MURAL_ROWS, MURAL_TOTAL, MURAL_KINDS, MURAL_MIN_MS, MURAL_FAR_CLOSE, parseMuralId, muralIdAllowed, muralFirstOpens, privateMuralId, PRIVATE_SIZES, muralHeld } from '@/lib/mural-shared';

const FLAT = 5, PLAIN = 10, BUSY = 20;
const MAX_FLAT_SHARE = 0.08, MAX_PLAIN_SHARE = 0.3, MAX_FLAT_BLOCK_SHARE = 0.01, MAX_TOP_COLOUR = 0.12, MIN_COLOUR_BITS = 5;
const CANDIDATES = 8;
// Boards opened before this were picked under the old rule. One that nobody has
// placed a piece on yet is given a new picture the next time it is served.
export const MURAL_VARIETY_FROM = '2026-11-20T12:00:00Z';
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

// `cols` and `rows` default to the public mural's cut; a private mural passes its own.
// `scale` is the points table (lib/mural-shared.js): flat for every new board, V1 only to regrade
// a board that was made on it.
export function gradePixels(data, width, height, COLS = MURAL_COLS, ROWS = MURAL_ROWS, scale = MURAL_SCALE_FLAT) {
  const TOTAL = COLS * ROWS;
  const c = cropOf(width, height);
  const cw = c.w / COLS, ch = c.h / ROWS;
  const detail = new Float32Array(TOTAL);
  const colours = new Map();
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const x0 = c.x + Math.floor(col * cw), x1 = c.x + Math.max(Math.floor(col * cw) + 1, Math.floor((col + 1) * cw));
      const y0 = c.y + Math.floor(r * ch), y1 = c.y + Math.max(Math.floor(r * ch) + 1, Math.floor((r + 1) * ch));
      let n = 0, s = 0, s2 = 0, R = 0, G = 0, B = 0;
      for (let y = y0; y < y1; y++) {
        let o = (y * width + x0) * 4;
        for (let x = x0; x < x1; x++, o += 4) {
          const l = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
          s += l; s2 += l * l; n++; R += data[o]; G += data[o + 1]; B += data[o + 2];
        }
      }
      const m = n ? s / n : 0;
      // The piece's average colour, in an 8 x 8 x 8 cube of bins.
      if (n) { const key = ((R / n) >> 5) * 64 + ((G / n) >> 5) * 8 + ((B / n) >> 5); colours.set(key, (colours.get(key) || 0) + 1); }
      detail[r * COLS + col] = n ? Math.sqrt(Math.max(0, s2 / n - m * m)) : 0;
    }
  }
  const patch = new Int32Array(TOTAL), seen = new Uint8Array(TOTAL);
  let flat = 0, big = 0, plain = 0;
  for (let i = 0; i < TOTAL; i++) {
    if (detail[i] < PLAIN) plain++;
    if (detail[i] >= FLAT) continue;
    flat++;
    if (seen[i]) continue;
    const q = [i], mem = [];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      mem.push(j);
      const col = j % COLS, r = (j / COLS) | 0;
      const nb = [col > 0 ? j - 1 : -1, col < COLS - 1 ? j + 1 : -1, r > 0 ? j - COLS : -1, r < ROWS - 1 ? j + COLS : -1];
      for (const k of nb) if (k >= 0 && !seen[k] && detail[k] < FLAT) { seen[k] = 1; q.push(k); }
    }
    for (const j of mem) patch[j] = mem.length;
    if (mem.length > big) big = mem.length;
  }
  let grades = '';
  for (let i = 0; i < TOTAL; i++) {
    const col = i % COLS, r = (i / COLS) | 0;
    const ec = col === 0 || col === COLS - 1, er = r === 0 || r === ROWS - 1;
    let g;
    if (ec && er) g = scale.corner;
    else if (ec || er) g = scale.edge;
    else if (detail[i] < FLAT) g = patch[i] >= 50 ? scale.large : patch[i] >= 10 ? scale.medium : scale.small;
    else if (detail[i] < PLAIN) g = scale.plain;
    else if (detail[i] < BUSY) g = scale.busy;
    else g = scale.detailed;
    grades += g.toString(36);
  }
  const share = flat / TOTAL, plainShare = plain / TOTAL;
  let bits = 0, top = 0;
  for (const v of colours.values()) { const q = v / TOTAL; bits -= q * Math.log2(q); if (v > top) top = v; }
  const topColour = top / TOTAL;
  const pass = share <= MAX_FLAT_SHARE && plainShare <= MAX_PLAIN_SHARE && big <= Math.round(TOTAL * MAX_FLAT_BLOCK_SHARE)
    && topColour <= MAX_TOP_COLOUR && bits >= MIN_COLOUR_BITS;
  // One number to rank candidates by: more colours, fewer plain pieces, no one colour dominating.
  const variety = bits * (1 - plainShare) * (1 - topColour);
  return { grades, flatShare: share, plainShare, flatBlock: big, topColour, colourBits: bits, variety, pass };
}

async function gradePhoto(title, cols = MURAL_COLS, rows = MURAL_ROWS, scale = MURAL_SCALE_FLAT) {
  const up = await fetch(commonsUrl(title, 1280), { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!up.ok) throw new Error(`photo ${up.status}`);
  const buf = Buffer.from(await up.arrayBuffer());
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
  return gradePixels(img.data, img.width, img.height, cols, rows, scale);
}

// Grades up to CANDIDATES photos side by side and returns the most varied one
// that passes, or the most varied of all if none pass.
async function pickPhoto(list, cols = MURAL_COLS, rows = MURAL_ROWS) {
  const why = [];
  const got = await Promise.all(list.slice(0, CANDIDATES).map(async (cand) => {
    try { return { cand, g: await gradePhoto(cand.t, cols, rows) }; }
    catch (e) { why.push(String((e && e.message) || e).slice(0, 160)); return null; }
  }));
  const ok = got.filter(Boolean);
  const passing = ok.filter((x) => x.g.pass);
  const pool = passing.length ? passing : ok;
  const best = pool.slice().sort((a, b) => b.g.variety - a.g.variety)[0] || null;
  return { best, why };
}

// Photos already used by a public mural, so a new one never repeats them.
async function usedPhotos(admin) {
  const recent = await admin.from('mural_boards').select('photo').neq('kind', 'private').order('opens_at', { ascending: false }).limit(60);
  return new Set((recent.data || []).map((r) => r.photo));
}

// A board opened under the old picture rule that nobody has placed a piece on
// gets a new, more varied picture, in place (same id and window). Returns the
// fresh row, or the board unchanged.
async function repickIfUnplayed(admin, b) {
  if (!b || b.completed_at || b.kind === 'private' || Date.parse(b.opens_at) >= Date.parse(MURAL_VARIETY_FROM)) return b;
  const any = await admin.from('mural_places').select('piece').eq('mural_id', b.id).limit(1);
  if (any.error || (any.data && any.data.length)) return b;
  const weekAgo = etYmd(Date.now() - 7 * 86400000);
  const used = await usedPhotos(admin);
  const pool = PUZZLES.filter((x) => x.t && x.live <= weekAgo && x.cols >= x.rows && /\.jpe?g$/i.test(x.t) && !used.has(x.t));
  const list = pool.slice().sort((a, c) => hash(b.id + 'v2' + a.t) - hash(b.id + 'v2' + c.t));
  const pick = await pickPhoto(list, b.cols, b.rows);
  if (!pick.best) return b;
  const c = pick.best.cand;
  const up = await admin.from('mural_boards').update({ photo: c.t, name: c.name || null, lic: c.lic || null, by: c.by || null, grades: pick.best.g.grades })
    .eq('id', b.id).is('completed_at', null).select(BOARD_COLS).maybeSingle();
  if (up.error || !up.data) { if (up.error) console.error('mural repick', b.id, up.error); return b; }
  return up.data;
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
  // A private mural keeps the size it was started at; only the public one is ever recut.
  if (got.data && !p.priv && (got.data.cols !== MURAL_COLS || got.data.rows !== MURAL_ROWS) && !got.data.completed_at && now < Date.parse(got.data.closes_at)) {
    try {
      const g = await gradePhoto(got.data.photo, MURAL_COLS, MURAL_ROWS, MURAL_SCALE_V1);
      const rz = await admin.rpc('mural_resize', { p_id: id, p_cols: MURAL_COLS, p_rows: MURAL_ROWS, p_grades: g.grades });
      if (rz.error) throw rz.error;
      const fresh = await admin.from('mural_boards').select(BOARD_COLS).eq('id', id).maybeSingle();
      if (fresh.data) return { board: fresh.data };
    } catch (e) { console.error('mural resize', id, e); }
  }
  if (got.data) return { board: got.data };
  if (!win) return { notOpen: true };

  const weekAgo = etYmd(now - 7 * 86400000);
  const used = await usedPhotos(admin);
  const pool = PUZZLES.filter((x) => x.t && x.live <= weekAgo && x.cols >= x.rows && /\.jpe?g$/i.test(x.t));
  const fresh = pool.filter((x) => !used.has(x.t));
  const list = (fresh.length ? fresh : pool).slice().sort((a, b) => hash(id + a.t) - hash(id + b.t));
  if (!list.length) return { notOpen: true };

  const pick = await pickPhoto(list);
  if (!pick.best) { console.error('mural grade', id, pick.why); return { notOpen: true, why: pick.why }; }
  const best = pick.best;

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
  if (!k || muralHeld(kind)) return { notOpen: true };
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
  // Old-rule picture, nobody has started it: swap in a varied one (owner, 2026-11-20).
  try {
    const re = await repickIfUnplayed(admin, b);
    if (re !== b) return { board: re };
  } catch (e) { console.error('mural repick', b.id, e); }
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

// ---------- PRIVATE MURALS (owner, 2026-11-19) ----------
// A private mural's board lives in mural_boards like any other (kind 'private',
// so it is never the open Mural), and who started it and which group it belongs
// to live in mural_private (migration 75). Nothing on the public path reads
// that table, so the public murals run the same with or without the migration.

// The pictures a player may choose from: Jig photos live at least a week, the
// same pool the public murals draw on. `seed` shuffles, `n` is how many.
// `pin` is a picture picked on the Jigsaw Puzzles page (owner, 2026-11-22: "can
// we do that in the jigsaw shelf too?"): it leads the list when it may be used.
export function privatePhotoOptions(seed, n = 3, pin = null) {
  const weekAgo = etYmd(Date.now() - 7 * 86400000);
  const pinned = privatePhotoOk(pin);
  const pool = PUZZLES.filter((x) => x.t && x.live <= weekAgo && x.cols >= x.rows && /\.jpe?g$/i.test(x.t) && (!pinned || x.num !== pinned.num));
  const picks = pool.slice().sort((a, b) => hash(seed + a.t) - hash(seed + b.t)).slice(0, pinned ? n - 1 : n);
  return (pinned ? [pinned, ...picks] : picks).map((x) => ({ n: x.num, name: x.name || '' }));
}

// May a private mural use this Jig picture? Any past Jig photo the Jigsaw
// Puzzles page already shows (never today's or a future one), a JPEG, wide.
export function privatePhotoOk(num) {
  const n = Number(num);
  if (!Number.isInteger(n) || n < 1) return null;
  const today = etYmd(Date.now());
  return PUZZLES.find((x) => x.num === n && x.t && x.live < today && x.cols >= x.rows && /\.jpe?g$/i.test(x.t)) || null;
}

function makePrivateCode() {
  const A = 'abcdefghjkmnpqrstuvwxyz23456789';
  let c = '';
  for (let i = 0; i < 8; i++) c += A[Math.floor(Math.random() * A.length)];
  return c;
}

// Starts one. `photoNum` is a Jig day number from privatePhotoOptions. Returns
// { code, id } or { error }.
export async function createPrivateMural(admin, { size, photoNum, owner, ownerUser, ownerName, groupId }) {
  const sz = PRIVATE_SIZES.find((x) => x.key === size);
  const ph = privatePhotoOk(photoNum);
  if (!sz || !ph) return { error: 'bad_request' };
  let g;
  try { g = await gradePhoto(ph.t, sz.cols, sz.rows); }
  catch (e) { console.error('private mural grade', e); return { error: 'photo' }; }
  // Is migration 75 in? Ask before a board is made, so nothing is left behind.
  const probe = await admin.from('mural_private').select('mural_id').limit(1);
  if (probe.error) { if (missing(probe.error)) return { error: 'unavailable' }; throw probe.error; }
  for (let tries = 0; tries < 4; tries++) {
    const code = makePrivateCode(), id = privateMuralId(code);
    // The board first: mural_private points at it.
    const ins = await admin.from('mural_boards').insert({
      id, kind: 'private',
      opens_at: new Date().toISOString(), closes_at: MURAL_FAR_CLOSE,
      photo: ph.t, name: ph.name || null, lic: ph.lic || null, by: ph.by || null,
      cols: sz.cols, rows: sz.rows, grades: g.grades,
    });
    if (ins.error) {
      if (/duplicate|23505/i.test(String(ins.error.message || ins.error.code))) continue;
      throw ins.error;
    }
    const meta = await admin.from('mural_private').insert({ mural_id: id, code, owner, owner_user: ownerUser, owner_name: ownerName, group_id: groupId || null });
    if (meta.error) { await admin.from('mural_boards').delete().eq('id', id); throw meta.error; }
    return { code, id };
  }
  return { error: 'try_again' };
}

// Who started a private mural and which group it is for, or null.
export async function privateMeta(admin, id) {
  const r = await admin.from('mural_private').select('mural_id, code, owner, owner_user, owner_name, group_id, created_at').eq('mural_id', id).maybeSingle();
  if (r.error) { if (missing(r.error)) return null; throw r.error; }
  return r.data || null;
}

// May this player place on this private mural? A link-only mural: anyone. A
// group's mural: members only.
export async function mayPlacePrivate(admin, meta, userId) {
  if (!meta || !meta.group_id) return true;
  if (!userId) return false;
  const m = await admin.from('quiz_group_members').select('user_id').eq('group_id', meta.group_id).eq('user_id', userId).maybeSingle();
  return !m.error && !!m.data;
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
    pv: (hash(String(b.photo || '')) % 1679616).toString(36),
  };
}

export { missing as muralTableMissing };
