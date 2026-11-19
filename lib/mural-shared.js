// Mural and MuralToo: the parts the browser and the server must agree on.
// Client safe: no server imports here.
//
// RUN UNTIL FINISHED (owner, 2026-11-19: "make mural and MuralToo run until
// finished, minimum of 24 hours", and the next one opens right when the last is
// finished). A board stays open until the crowd places its last piece; the next
// of its kind opens at the later of that moment and 24 hours after the board
// opened. The very first board of each kind still opens at its slot (Mural noon,
// MuralToo midnight). A mural's id is `<kind>-<YYYY-MM-DD>`, the Eastern date it
// actually opened on; two are always at least 24 hours apart, so ids never clash.
// The server (lib/mural.js currentBoard) decides which board is current.
export const MURAL_MIN_MS = 24 * 3600000;
export const MURAL_FAR_CLOSE = '2100-01-01T00:00:00Z';
// When the board after this one opens: the later of its finish and 24 hours
// after it opened. null while it is unfinished.
export function muralNextOpens(board) {
  if (!board || !board.completed) return null;
  return Math.max(board.opens + MURAL_MIN_MS, board.completed);
}

// 4,000 PIECES, 80 x 50 (owner, 2026-11-19: "Let's go to 4,000 now"). It opened at
// 10,000 (125 x 80), but the largest photo the site loads is 3,840 px wide, which
// left 30 source pixels a piece and looked grainy on a phone; 80 across is 48.
// These are the size of a NEW mural. A board row carries its own cols and rows,
// and the page reads those, so an older mural on the shelf keeps its size.
export const MURAL_COLS = 80;
export const MURAL_ROWS = 50;
export const MURAL_TOTAL = MURAL_COLS * MURAL_ROWS;

export const MURAL_KINDS = {
  mural: { key: 'mural', name: 'Mural', openHour: 12, route: '/mural', runs: 'Until Finished', first: '2026-11-19', opensAt: 'Noon ET' },
  muraltoo: { key: 'muraltoo', name: 'MuralToo', openHour: 0, route: '/muraltoo', runs: 'Until Finished', first: '2026-11-20', opensAt: 'Midnight ET' },
};

// THE FIRST BOARD OF EACH KIND (owner, 2026-11-19: "Only mural should be open
// now. MuralToo a waiting screen until Midnight."). `first` is the Eastern date
// the first one opens; nothing of that kind exists before it. A mural id dated
// earlier is never served, and the page shows a waiting screen instead.
export function muralLaunched(kind, now = Date.now()) {
  const k = MURAL_KINDS[kind];
  if (!k) return false;
  const w = muralWindow(`${kind}-${k.first}`);
  return !!w && now >= w.opens;
}
export function muralFirstOpens(kind) {
  const k = MURAL_KINDS[kind];
  const w = k && muralWindow(`${kind}-${k.first}`);
  return w ? w.opens : null;
}
export function muralIdAllowed(id) {
  const p = parseMuralId(id);
  return !!p && id.slice(p.kind.length + 1) >= MURAL_KINDS[p.kind].first;
}

// WHICH OF THE TWO THE HOME FEATURES (owner, 2026-11-19: "one of the two in
// Featured ... the Featured one is the one expiring soonest"). Before noon
// Eastern that is Mural, which closes at noon; from noon it is MuralToo, which
// closes at midnight. Until MuralToo's first board opens it is always Mural.
export function muralFeaturedKey(now = Date.now()) {
  if (!muralLaunched('muraltoo', now)) return 'mural';
  return etParts(new Date(now)).h < 12 ? 'mural' : 'muraltoo';
}

const ID_RE = /^(mural|muraltoo)-(\d{4})-(\d{2})-(\d{2})$/;

function etParts(d) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  });
  const o = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24 };
}

// The UTC instant of an Eastern wall-clock hour. Eastern is UTC-5 or UTC-4, so
// start from -5 and correct by whatever the formatter reports.
function etInstant(y, m, d, hour) {
  let t = Date.UTC(y, m - 1, d, hour + 5);
  const got = etParts(new Date(t));
  const want = Date.UTC(y, m - 1, d, hour);
  const have = Date.UTC(got.y, got.m - 1, got.d, got.h);
  t += want - have;
  return t;
}

function ymd(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

export function parseMuralId(id) {
  const m = ID_RE.exec(String(id || ''));
  if (!m) return null;
  return { kind: m[1], y: +m[2], m: +m[3], d: +m[4] };
}

// { opens, closes } as epoch milliseconds. A mural closes when the next one of
// its kind opens, so a daylight-saving day is 23 or 25 hours, never a gap.
export function muralWindow(id) {
  const p = parseMuralId(id);
  if (!p) return null;
  const hour = MURAL_KINDS[p.kind].openHour;
  const next = new Date(Date.UTC(p.y, p.m - 1, p.d + 1));
  return {
    opens: etInstant(p.y, p.m, p.d, hour),
    closes: etInstant(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), hour),
  };
}

export function currentMuralId(kind, now = Date.now()) {
  const k = MURAL_KINDS[kind];
  if (!k) return null;
  const e = etParts(new Date(now));
  let day = new Date(Date.UTC(e.y, e.m - 1, e.d));
  if (e.h < k.openHour) day = new Date(day.getTime() - 86400000);
  return `${kind}-${ymd(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate())}`;
}

export function muralDateLabel(id) {
  const p = parseMuralId(id);
  if (!p) return '';
  return new Date(Date.UTC(p.y, p.m - 1, p.d, 12)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
}

// Grades travel as one base-36 character per piece.
export function gradeAt(grades, piece) {
  const g = parseInt(grades.charAt(piece), 36);
  return g >= 1 ? g : 3;
}

export const MURAL_GRADE_NAMES = {
  1: 'Corner', 2: 'Edge', 3: 'Detailed', 4: 'Busy', 6: 'Plain',
  8: 'Flat color, small patch', 10: 'Flat color, medium block', 12: 'Flat color, large block',
};

// The same arithmetic as mural_place() in migration 69. The server's answer is
// the one that counts; this is what the tray shows before you place.
export function pieceValue({ grade, hours, neighbours, first }) {
  let v = grade * Math.max(0.2, 1 - 0.2 * neighbours);
  if (first) v = v * (1 + Math.min(1, 0.05 * Math.max(0, hours))) * 2;
  return Math.max(1, Math.round(v));
}
