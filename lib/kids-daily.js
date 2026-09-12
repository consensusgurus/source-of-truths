// Kids dailies: the seven translated puzzles under /kids/<game>.
//
// A SEPARATE TRACK from the daily roster in lib/daily-games.js, on purpose.
// Nothing here posts a result, ranks a player, pays IQ Points, joins a circuit
// or appears on the slate. A kid taps in, plays today's board, gets a cheer,
// and the only memory of it is a localStorage flag on that device. So the
// registry below is display metadata plus a day picker, and nothing reads it
// but the kids pages and the Kids Corner hub.
//
// Day picking. Every kids bank is a CYCLE, not a dated runway: today's board is
// bank[(days since KIDS_EPOCH) % bank.length]. A bank never runs out, and a
// board coming round again after two months is fine on a track with no
// leaderboard. The two games that reuse a grown-up bank (Sixes, Parker) cycle
// over the subset of that bank that is already live and gentle enough, so a
// future board and its solution still never reach a browser.
import { etTodayISO } from './daily-games.js';

export const KIDS_EPOCH = '2026-09-11';

export const KIDS_DAILIES = [
  { key: 'sixes', title: 'Shape Sixes', href: '/kids/sixes', from: 'Sixes', tag: 'Every row, column and box gets all six shapes.', hue: '#3a86ff', band: '#e9f1ff' },
  { key: 'pals', title: 'Pixel Pals', href: '/kids/pals', from: 'Etch', tag: 'Color the squares the numbers say. A picture pops out.', hue: '#ff5a5f', band: '#fdeaea' },
  { key: 'mixup', title: 'Mix-Up', href: '/kids/mixup', from: 'Garble', tag: 'The letters got jumbled. Put five words back together.', hue: '#ff9f1c', band: '#fff3d6' },
  { key: 'sortit', title: 'Sort It', href: '/kids/sortit', from: 'Links', tag: 'Twelve words, three groups. Find who belongs together.', hue: '#3bb273', band: '#e7f6ef' },
  { key: 'ladder', title: 'Ladder', href: '/kids/ladder', from: 'Rung', tag: 'Change one letter at a time to climb from CAT to DOG.', hue: '#8e5ae0', band: '#f1ecfb' },
  { key: 'unpark', title: 'Unpark', href: '/kids/unpark', from: 'Parker', tag: 'Slide the cars out of the way and drive the red one out.', hue: '#ff7bb0', band: '#fde7f0' },
  { key: 'mathdash', title: 'Math Dash', href: '/kids/mathdash', from: 'Blitz', tag: 'Ten sums, three hearts. How many can you get?', hue: '#ffd23f', band: '#fff8dc' },
];

export const KIDS_DAILY_MAP = Object.fromEntries(KIDS_DAILIES.map((g) => [g.key, g]));

// Whole days between two ISO dates, read as calendar days (no DST drift:
// both are parsed as UTC midnights).
export function daysBetween(fromIso, toIso) {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export function kidsDayNumber(today = etTodayISO()) {
  return Math.max(0, daysBetween(KIDS_EPOCH, today)) + 1;
}

// The ISO date puzzle number n fell on (n = 1 is KIDS_EPOCH).
export function kidsDateForDay(n) {
  const d = new Date(Date.UTC(+KIDS_EPOCH.slice(0, 4), +KIDS_EPOCH.slice(5, 7) - 1, +KIDS_EPOCH.slice(8, 10) + (n - 1)));
  return d.toISOString().slice(0, 10);
}

// Which puzzle a kids page shows. `?p=<n>` opens past puzzle n from the
// archive strip; anything missing, malformed, ahead of today or below 1
// falls back to today. Returns the day number, its ISO date (the save key)
// and whether it is today's board. A past board is never a different game,
// only a different pick from the same cycle.
export function resolveKidsDay(searchParams, today = etTodayISO()) {
  const todayNum = kidsDayNumber(today);
  const raw = searchParams && searchParams.p;
  const n = parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
  if (!Number.isInteger(n) || n < 1 || n >= todayNum) return { n: todayNum, dateIso: today, isToday: true, todayNum };
  return { n, dateIso: kidsDateForDay(n), isToday: false, todayNum };
}

// The entry for puzzle number n from a cycling bank. A bank is any non-empty array.
export function pickCycleAt(bank, n) {
  if (!bank || !bank.length) return null;
  return bank[(n - 1) % bank.length];
}

// Today's entry from a cycling bank.
export function pickCycle(bank, today = etTodayISO()) {
  return pickCycleAt(bank, kidsDayNumber(today));
}

// A small deterministic PRNG so a day's generated content (Math Dash sums,
// Mix-Up scrambles) is the same for every kid who opens it that day.
export function seeded(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWith(rand, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function kidsDateLabel(today = etTodayISO()) {
  const d = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)));
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
