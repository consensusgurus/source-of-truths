import { NextResponse } from 'next/server';
import { dropsOf } from '@/lib/daily-index';
import { supabaseAdmin } from '@/lib/supabase-server';
import { loadQuizResultsCached } from '@/lib/quiz-results-cache';
import { findQuizIdentity } from '@/lib/quiz-identity';
import { SUNDAY_EDITION_GAMES } from '@/lib/sunday-editions';


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
// Per-player answer, and playing one should drop it from the slate at once.
const CACHE_HEADERS = { 'Cache-Control': 'private, no-store' };

// Lifted wholesale from /api/quiz/daily-unplayed rather than trimmed to the
// Sunday roster: SUNDAY_EDITION_GAMES is 51 games and counting, so a hand-kept
// subset here would be one more list to remember when a game gains an edition.
// The registry does the filtering at request time instead.
// The games this route has always covered; each one's drops come from the
// slim index (lib/daily-index.js), not the puzzle banks (2026-11-23).
const GAME_PUZZLES = Object.fromEntries(['crux', 'emcee', 'garble', 'scram', 'arcos', 'gram', 'vocab', 'spell', 'origin', 'idiom', 'pulse', 'gene', 'orbit', 'eureka', 'bond', 'scour', 'links', 'span', 'dating', 'tally', 'suds', 'sudstoo', 'circa', 'extra', 'carve', 'stet', 'outwit', 'tuck', 'alibi', 'cipher', 'scales', 'ping', 'carmen', 'warmer', 'jester', 'sworn', 'outrank', 'shards', 'axiom', 'hearsay', 'venn', 'stands', 'bracket', 'lode', 'etch', 'hedge', 'listed', 'mate', 'four', 'park', 'impound', 'junkyard', 'topple', 'roll', 'sudoclue', 'snug', 'jig', 'saw', 'duet', 'lamps', 'clade', 'dossier', 'tape', 'bacon', 'resume', 'filing', 'judges', 'check', 'rung', 'crunch', 'taire', 'fib', 'streak', 'feud', 'herd', 'babel', 'hands', 'finesse', 'yose', 'crib', 'hold', 'mahj', 'swap', 'slide', 'spin', 'connect', 'mop', 'mow', 'plow', 'machine', 'curb', 'crate', 'bot', 'peg', 'glimpse', 'chef', 'seated', 'bag', 'errands', 'dash', 'pack', 'fill', 'pairs', 'cell', 'swindle', 'gift', 'glyph', 'chain', 'turn', 'suffice', 'strata', 'redact', 'paths', 'deep', 'anon', 'blocks', 'snake', 'squash', 'chomp', 'sweep', 'cages', 'coop', 'sando', 'snack', 'docket', 'ergo', 'defend', 'barter', 'plot', 'sixes', 'sixestoo', 'sums', 'hinge', 'niche', 'shoe', 'queen', 'towers', 'mercury', 'mercurytoo', 'fever', 'arrow', 'dart', 'polka', 'dot', 'knight', 'knighttoo', 'atlas', 'sport', 'calc', 'encore', 'biz', 'flank', 'passport', 'script', 'quotes', 'sci', 'art', 'history', 'foodie', 'music', 'books', 'nature', 'tech', 'myth', 'hired', 'focus', 'thread', 'slot', 'whittle', 'pricer', 'dealer', 'realtor', 'agent', 'curator', 'diag', 'diagtoo', 'frame', 'trim', 'rim', 'rimtoo', 'lip', 'liptoo', 'giant', 'gianttoo', 'sumo', 'bout', 'window', 'windowtoo', 'five', 'racecar', 'racecartoo', 'kayak', 'kayaktoo'].map((k) => [k, dropsOf(k)]));

function etTodayServer() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function suffixOfDate(dateStr) { const [Y, M, D] = dateStr.split('-').map(Number); return `${M}-${D}-${Y % 100}`; }

// GET /api/quiz/sunday-slate?anonId=&email=
//   -> { games: [{ key, num, href, live, played, playedAt }] }
//
// One Sunday Edition per game, chosen the way the owner asked for on
// 2026-08-09: walk that game's Sunday drops BACKWARDS from the most recent and
// take the first the viewer has never played, so the tab leads with last Sunday
// and only reaches further back for someone who has already done it. When every
// Sunday of a game has been played, take the one played LONGEST AGO, which is
// the one they are least likely to remember.
//
// Today's drop is excluded (it is on the board already) and so is anything not
// yet live, exactly as /api/quiz/daily-unplayed does. This route is the reason
// the tab needs a server at all: the archive link is /<game>?p=<num>, and num
// only exists inside the game's own puzzle bank, which the client never loads.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const anonId = (searchParams.get('anonId') || '').trim() || null;
  const email = (searchParams.get('email') || '').trim() || null;

  const today = etTodayServer();

  let myKey = null;
  try {
    const ident = await findQuizIdentity(supabaseAdmin, { email, anonId });
    if (ident && ident.id) myKey = `u:${ident.id}`;
    else if (anonId) myKey = `a:${anonId}`;
  } catch (e) { /* identity is best-effort: no history means nothing is played */ }

  // quiz_id -> the NEWEST time this viewer played it. One pass over the shared
  // row cache for every game at once, rather than the per-game pass
  // daily-unplayed makes, since this route answers for the whole slate.
  const playedAt = new Map();
  if (myKey) {
    try {
      const { data } = await loadQuizResultsCached(supabaseAdmin);
      for (const r of (data || [])) {
        const qid = r && r.quiz_id;
        if (!qid) continue;
        const pk = r.user_id ? `u:${r.user_id}` : (r.anon_id ? `a:${r.anon_id}` : null);
        if (pk !== myKey) continue;
        const t = r.created_at ? Date.parse(r.created_at) : 0;
        if (!playedAt.has(qid) || t > playedAt.get(qid)) playedAt.set(qid, t);
      }
    } catch (e) { /* no history -> everything reads as unplayed */ }
  }

  const games = [];
  for (const key of SUNDAY_EDITION_GAMES) {
    const puzzles = GAME_PUZZLES[key];
    if (!puzzles) continue;
    const todayQuizId = `${key}-${suffixOfDate(today)}`;
    // Newest first, so "the first unplayed" IS the most recent one.
    const sundays = puzzles
      .filter((p) => p && p.sunday && p.quizId && p.quizId !== todayQuizId && (!p.live || p.live <= today))
      .sort((a, b) => (b.num || 0) - (a.num || 0));
    if (!sundays.length) continue;

    let pick = sundays.find((p) => !playedAt.has(p.quizId)) || null;
    let played = false;
    if (!pick) {
      // Every Sunday of this game is played, so offer the stalest one.
      played = true;
      pick = sundays.reduce((oldest, p) => (
        (playedAt.get(p.quizId) || 0) < (playedAt.get(oldest.quizId) || 0) ? p : oldest), sundays[0]);
    }
    games.push({
      key,
      num: pick.num,
      href: `/${key}?p=${pick.num}`,
      live: pick.live || null,
      played,
      playedAt: played ? (playedAt.get(pick.quizId) || null) : null,
    });
  }

  // Unplayed first (the point of the tab), then the stalest of the played ones.
  games.sort((a, b) => (a.played === b.played
    ? (a.played ? (a.playedAt || 0) - (b.playedAt || 0) : 0)
    : (a.played ? 1 : -1)));

  return NextResponse.json({ games }, { headers: CACHE_HEADERS });
}
