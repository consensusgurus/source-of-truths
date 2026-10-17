// RESERVE for script (owner, 2026-10-17): plain trivia questions lifted out of the
// Quotes bank when it became a quoted-line game. Authored for Quotes days that
// never went live (Oct 18 to Nov 12, 2026), so NO PLAYER HAS SEEN THEM. Each
// entry is already in this game's lane-file shape { c, t, q, a, d }.
//
// THE NEXT BANK EXTENSION OF SCRIPT DRAWS FROM HERE FIRST: move an entry
// into the lane file for its day (same lane, same tier) and delete it from this
// file in the same commit, so nothing is dealt twice. `was` names the retired
// Quotes id for the record; it is not a recycle and carries no `from` field.
export const RESERVE = [
  { c: 'Movies', t: 1, q: 'Which character leads the song \'I Just Can\'t Wait to Be King\' in The Lion King?', a: 'Simba', d: ['Nala', 'Scar', 'Zazu'], was: 'quotes:d55q05' },
  { c: 'Movies', t: 1, q: 'Which character in Moana sings "You\'re Welcome" while listing the gifts he has given humankind?', a: 'Maui', d: ['Gramma Tala', 'Tamatoa', 'Chief Tui'], was: 'quotes:d66q05' },
  { c: 'Television', t: 2, q: 'Which naturalist narrated the BBC series Life on Earth?', a: 'David Attenborough', d: ['Peter Scott', 'Jacques Cousteau', 'Gerald Durrell'], was: 'quotes:d55q08' },
];
