import { DAILY_GAMES, DAILY_GAME_MAP } from './daily-games';

// The Loft format flag.
//
// Two ways in, both explicit:
//
//   1. A ROUTE can opt in by passing `loft` down (app/new-daily-preview does
//      this), which is how a page shows the format at a URL of its own.
//   2. A SLUG listed here, which is the real rollout switch.
//
// `?loft=1` is a third way, handled in app/useLoft.js, and it is for REVIEW
// only: it lets a game be looked at before its slug is added.
//
// LIVE ON EVERY DAILY (2026-08-14). The list is the exact `slug` each client
// passes to DailyChrome, NOT the directory name and not the registry key: two
// of them differ, `jester` lives at /jesters and `park` at /parker, and keying
// off the wrong one would silently miss those two games.
//
// WHAT A LISTED GAME GETS depends on how far its own client has been taken.
// Every game here gets the shared chrome: no selector ribbon, no stat row, and
// the cap in place of the old title block, all of it from DailyMasthead with no
// per-game code. The navy play stage, the controls inside the card and the
// flip-to-options finish live in the game client, so today only Crux has them.
// The rest gain those as each client is wired.
export const LOFT_GAMES = new Set([
  'alibi', 'anon', 'axiom', 'babel', 'barter', 'blitz', 'blitzed', 'sums', 'hinge',
  'blocks', 'bracket', 'cages', 'carve', 'chain', 'check',
  'chomp', 'cipher', 'circa', 'crunch', 'crux', 'dating',
  'deep', 'defend', 'docket', 'emcee', 'etch', 'extra',
  'feud', 'fib', 'finesse', 'four', 'garble', 'glyph', 'hands',
  'hearsay', 'hedge', 'jester', 'links', 'listed', 'lode',
  'impound', 'junkyard', 'mate', 'mercury', 'niche', 'outrank', 'outwit', 'park', 'paths', 'ping', 'plot',
  'polka', 'pricer', 'queen', 'quilt', 'redact', 'rung', 'sando', 'shards',
  'shoe', 'sixes', 'span', 'stands', 'stet', 'strata', 'streak', 'suds',
  'suffice', 'sweep', 'sworn', 'taire', 'tally', 'towers', 'tuck',
  'turn', 'venn', 'warmer', 'atlas', 'sport', 'calc', 'encore', 'biz', 'flank', 'knight', 'script', 'quotes', 'focus', 'thread', 'slot', 'whittle', 'diag', 'frame', 'rim',
]);

// A ROUTE is not always a KEY. Two clients hand DailyChrome their registry key
// and DailyMasthead their route: jester lives at /jesters, park at /parker. The
// map is built from the registry's own href overrides rather than hardcoded, so
// the next game that moves route is handled without anyone remembering to come
// back here.
const ROUTE_TO_KEY = {
  ...Object.fromEntries(
    DAILY_GAMES
      .filter((g) => g.href && g.href !== `/${g.key}`)
      .map((g) => [String(g.href).replace(/^\//, ''), g.key])
  ),
  // Jesters is NOT covered by the line above, because its registry row declares
  // no href at all, so the registry believes it lives at /jester while the only
  // route in the app is /jesters. Parker declares its override and is picked up
  // automatically; this one has to be stated. Worth fixing at the source: any
  // link built from that row's href points at a route that does not exist.
  jesters: 'jester',
};

export function loftKey(slug) {
  if (!slug) return slug;
  return DAILY_GAME_MAP[slug] ? slug : (ROUTE_TO_KEY[slug] || slug);
}

export function isLoft(slug) {
  if (!slug) return false;
  return LOFT_GAMES.has(slug) || LOFT_GAMES.has(loftKey(slug));
}
