// READ THE ROOM, the run (owner, 2026-10-13): mindloftdaily.com/room.
//
// The crowd games, Herd (from 2026-10-17), Outwit, Outrank and Feud, back to back on one page,
// then a verdict on how well you read the people in the room. Every member is
// a crowd game: there is no answer key, the key is whatever today's players
// do, and it keeps moving until midnight Eastern. So the run does not grade
// you on points, which mean different things in each game (Outwit is out of
// 10, Outrank 12, Feud 500), but on WHERE YOU STAND in each room.
//
// THE READ is out of 100, a third per room. A room pays its third times the
// share of the other players in it you out-read: first of N pays the whole
// third, last pays nothing, and you alone in a room pays the whole third.
// `beat = (field - rank) / (field - 1)`. The standings are the crowd games'
// own live standings (registered players, ties broken by who submitted
// first), so the verdict and the circuit board read the same positions and
// can never disagree. A guest is placed where they would stand if they
// registered (the crowd APIs' `read` field, see roomReadFrom below).
//
// IT MOVES (owner, 2026-10-13: "let it move"). A crowd game re-scores every
// player as the field fills, so the read at the moment you finish is a
// reading, not a result. The run shows the verdict at the finish, says it is
// still filling, refreshes it while the page is open, and the next morning
// shows where the room settled.

export const ROOM_RUN_ID = 'room';
export const ROOM_PATH = '/room';
// HERD JOINED ON 2026-10-17 (owner, 2026-10-16) as the FIRST room: run with
// the herd, then dodge it, call its order, and say what it said. Four rooms,
// a quarter each. Days before that ran the original three, a third each, and
// are scored that way forever (roomKeysFor / roomScorerFor), so no settled
// room changes its read.
export const HERD_FROM = '2026-10-17';
export const ROOM_KEYS = ['herd', 'outwit', 'outrank', 'feud'];
export const ROOM_KEYS_BEFORE = ['outwit', 'outrank', 'feud'];
export const ROOM_MAX = 100;
export const ROOM_PART = ROOM_MAX / ROOM_KEYS.length;
export function roomKeysFor(iso) {
  return String(iso || '') < HERD_FROM ? ROOM_KEYS_BEFORE : ROOM_KEYS;
}
export function roomPartFor(iso) {
  return ROOM_MAX / roomKeysFor(iso).length;
}

// How each room is introduced. `line` is the pregame card, `phrase` the lede.
export const ROOM_ROOMS = {
  herd: { line: 'Ten quick calls. Pick what you think most players picked.', phrase: 'go with the crowd', unit: '10 calls' },
  outwit: { line: 'Five prompts. Side with the herd, dodge it, or undercut it.', phrase: 'dodge the herd', unit: '5 prompts' },
  outrank: { line: 'Cast your vote, then call the order everyone else put them in.', phrase: 'call its order', unit: 'One vote, one order' },
  feud: { line: 'Three answers a prompt. You score when the room said it too.', phrase: 'say what it said', unit: '5 prompts' },
};

// The share of the room you out-read, 0 to 1. Null when the position is unknown.
export function roomBeat(rank, field) {
  const r = Number(rank), f = Number(field);
  if (!Number.isFinite(r) || !Number.isFinite(f) || r < 1 || f < 1) return null;
  if (f <= 1) return 1;
  return Math.max(0, Math.min(1, (f - r) / (f - 1)));
}
// One room's points, 0 to `part` (the day's share of 100), unrounded.
export function roomPoints(rank, field, part = ROOM_PART) {
  const b = roomBeat(rank, field);
  return b == null ? 0 : part * b;
}
// The board's scorer (lib/circuits SCORERS.room): a combined-board perGame row
// in, points out. The crowd games' perGame rows carry the registered-only rank
// and field the game's own live board shows.
export function roomScorer(key, p) {
  return p ? roomPoints(p.rank, p.field) : 0;
}
// The day's scorer: a room is worth 100 split over THAT day's rooms.
export function roomScorerFor(iso) {
  const part = roomPartFor(iso);
  return (key, p) => (p ? roomPoints(p.rank, p.field, part) : 0);
}

// The crowd APIs' `read` field: where the requester stands among the named
// players, as if they were named. `ranked` is the API's sorted named list
// (rank 1..N, total desc, earliest submission first); a guest is placed after
// everyone who scored more or the same (they submitted later or not at all).
export function roomReadFrom(ranked, you, points) {
  const list = Array.isArray(ranked) ? ranked : [];
  if (you && you.rank) return { rank: you.rank, field: list.length };
  const above = list.filter((e) => Number(e.total) >= Number(points)).length;
  return { rank: above + 1, field: list.length + 1 };
}

// THE PARTY. Six places to stand, read out of 100.
export const ROOM_LADDER = [
  [95, 'Mind Reader', 'You knew what they would say before they did', 'You called the room before it called itself. Almost nobody tonight read it better.'],
  [80, 'The Host', 'You know every guest by name', 'You know this crowd. You saw the herd coming, ranked the room nearly right, and said what they said.'],
  [60, 'Life of the Party', 'In the middle of every conversation', 'You read most of the room. A couple of calls went sideways, but the crowd was mostly where you thought it would be.'],
  [40, 'Plus-One', 'Came with a friend, getting the hang of it', 'Half the room made sense to you. The other half is a mystery you can solve tomorrow.'],
  [20, 'Wallflower', 'Watching from the snack table', 'The room zigged where you zagged. Sometimes the crowd is just weird.'],
  [0, 'Wrong Party', 'Wandered in from next door', 'Bold reads, every one. The room disagreed with all of them, which is its own kind of talent.'],
];
export function roomTierOf(total) {
  const t = Number(total) || 0;
  for (let i = 0; i < ROOM_LADDER.length; i++) if (t >= ROOM_LADDER[i][0]) return i;
  return ROOM_LADDER.length - 1;
}
