// The Chain motif lines: the reader-facing sentence revealed after the game,
// by the SHAPE of the key. Shared by scripts/gen-chain.mjs (which deals them)
// and scripts/verify-chain.mjs (which checks every board from
// MOTIF_FAMILY_FROM carries a line from the family its own solve implies).
// Content only: no search code lives here. Split out of gen-chain.mjs
// 2026-11-12, lines unchanged except the additions marked below.
//
// ── motif: describes the shape of the key, never names the edge ────────────
// Two families, because the bank runs both: days where the boxes on offer are
// bait, and days where the double-cross reflex is the mistake and you should
// simply take what is there.
export const MOTIFS = {
  declineDouble: [
    'Two boxes are sitting there and both are poison. Leave the whole thing alone, hand the move over, and every chain behind it comes back to you.',
    'The pair on offer costs more than it pays. Give it back, stay off move, and the opponent has to open the chain that decides this.',
    'Both boxes are bait. Take neither, and the shape that is left forces the opponent to hand you the rest of the board.',
    'Two free boxes, and both of them cost the game. Play the quiet edge, and the opponent has to be the one who opens the next chain.',
    'Taking the pair feels like two boxes for nothing. It is really the whole board, so leave them and keep the move where it is.',
    'The double on offer is a loan, not a gift. Decline it and the chains behind it come back to you with the count in your favor.',
    'Both of those boxes are the opponent handing you the move. Refuse the gift, play safe, and let them run out of quiet edges first.',
    'You can have two boxes now or the board later. Take the quiet edge, because later is worth more.',
    'A free pair is the oldest trap on this board. Leave it standing and every chain on the table opens in your favor.',
    'Do not touch the pair. The moment you take it you own the next opening, and the next opening is the game.',
    'The two boxes pay you now and charge you the rest of the board. Play quietly and let the opponent break the shape.',
  ],
  declineSingle: [
    'The box on offer is bait. Decline it, keep the opponent on move, and the long chain pays you back with interest.',
    'One free box, and taking it is the whole mistake. Play the quiet edge instead and let the opponent break the board open.',
    'Refuse the box. Whoever moves next has to open a chain, and it should not be you.',
    'A single box, and it costs the game. Leave it, and the opponent runs out of safe edges before you do.',
    'Count the chains before you reach for it. The box is worth one and the move is worth more than that.',
    'Walk past the free box. Every edge that takes it hands over the shape, and the shape is the whole game here.',
    'One box for free, and it costs you the move. Play the quiet edge instead and let the opponent run out of them.',
    'The free box is the opponent buying the move off you. Do not sell it.',
    'Leave the box where it is. The count only works while the opponent is the one who has to open a chain.',
    'Take the box and you take the next opening with it. Play the quiet edge and stay off the hook.',
    'That box is worth one and the move is worth the board. Play safe and let the opponent spend the last quiet edge.',
    'Skip it. Every capture on this board ends with you breaking a chain you cannot afford to break.',
    'The box is real and it is still the wrong move. Hand the turn over and the shape does the work for you.',
    'Do not reach. This board is short of safe edges, and the player who runs out of them first is the one who loses.',
    'One box now, or the last two chains later. Leave the box and the chains are yours.',
    'Play the quiet edge and let the box sit. Whoever touches it opens the board, and that has to be the opponent.',
    'The capture is free and the position it leaves is not. Decline it, then count the chains again from the other side.',
    'It is one box against the whole endgame. Refuse it, keep your safe edge in reserve, and wait.',
    // added 2026-11-12: the 18 lines above were all at the ceiling by 2026-12-07
    'The box is a lure. Leave it standing, play the quiet edge, and let the opponent be the one who breaks the shape.',
    'Taking the box hands you the next move, and the next move is the one that loses. Decline it.',
    'Say no to the single box. The quiet edge puts the opponent on move, and on this board that is where you want them.',
    'A box for the taking, and the game for the giving. Play quietly and let the chains come to you.',
    'Patience wins this one. Leave the box, play safe, and the opponent is the one forced to open a chain.',
    'Hold back. Grab the box and you are the one left to open the board.',
    'Pass on the box. Count the safe edges that are left and you will see who has to break first.',
    'Not this box. Play the edge that gives nothing away and make the opponent open the next chain.',
    'That single box is the opponent trying to pass you the move. Turn it down and leave the move with them.',
    'Taking the box loses here, free as it looks. Find the quiet edge and play it.',
  ],
  takePair: [
    'Here the pair really is free. Take both, keep the move, and the shape that is left cannot be turned against you.',
    'This is the day the double-cross is wrong. Take both boxes, hold the move, and the rest falls out on its own.',
    'Both boxes are genuinely yours. Bank them, keep the turn, and nothing the opponent has left changes the count.',
    'The pair really is free today. Take both, hold the turn, and nothing left on the board turns the count around.',
    'No trap in this one. Bank both boxes, keep the move, and the shape that is left is still yours.',
    'Take the two and carry on. The clever refusal here just hands back boxes you have already earned.',
    'Both boxes are yours to keep. Collect them, stay on move, and let the opponent look for a safe edge that is not there.',
    'This is the pair you take. Giving it back gives the opponent the count along with the boxes.',
    'Two boxes, no strings. Take them, keep the turn, and play the rest of the board a move ahead.',
    'Bank the pair. The double-cross is the right habit and this is not the position for it.',
    'The pair pays and it keeps paying, because taking it leaves you on move with the shape unchanged.',
  ],
  takeOne: [
    'Take one and stop. The greedy version of the same idea opens the next chain yourself, which is the one thing you cannot afford.',
    'One box, then leave it. Taking the second is what hands over the chain you were trying to protect.',
    'Bank the single box and go no further. The move after it is the one that loses the board.',
    'Stop after the first. The pair looks like one move and it is really two, and the second one loses.',
    'Half of what is on offer is yours. Reaching for the other half opens the board at exactly the wrong moment.',
    'Take the near box only. The greedy edge takes the same boxes and leaves you the one to break the next chain.',
    'One box, then stop. Finishing the chain opens the next one yourself, and you cannot afford to go first.',
    'Take the near box and leave the rest standing. The second capture is the move that loses the board.',
    'Collect one and hold. Greed here spends the safe edge you need two moves from now.',
    'The first box is free and the rest of it is a bill. Take one and let the opponent decide who opens next.',
    'Bank one box and no more. The edge that takes the others hands over the chain you have been protecting.',
    'Stop halfway. What is left on offer belongs to whoever is not on move, and you want that to be the opponent.',
    'Take a single box and step back. Clearing the whole thing is the same as handing over the shape.',
    'One is enough here. The greedy edge scores the same boxes and leaves you breaking the next chain.',
  ],
  takePlain: [
    'This is the day to just take it. Declining looks clever and loses: hand the move over here and the chain that opens is the one you wanted.',
    'No trick today. The box is free, the count says take it, and the fancy refusal throws the game away.',
    'Take the box. The double-cross reflex is a good habit, and this is the position where it costs you the game.',
    'The clever move is the losing move here. Bank the box, keep the turn, and let the count do the rest.',
    'Refusing costs you the board. Take what is offered and the opponent is the one left without a safe edge.',
    'Nothing to be cute about. The box is yours, and giving it back only buys the opponent the move they need.',
    'Take the box. The refusal is the trap here, and it gives away the move you already own.',
    'The count says take it, so take it. There is nothing behind this one worth declining for.',
    'This is a plain capture day. Bank the box, keep the turn, and the rest of the board is arithmetic.',
    'Do not overthink it. The box is free, the shape holds, and giving it back is the only way to lose from here.',
    'The habit of declining is right most days and wrong on this one. Take the box and stay on move.',
    'Take what is offered. The opponent is the one short of safe edges, and refusing fixes that for them.',
    'Play the capture. Every quiet edge on this board is the edge that opens a chain you wanted left closed.',
    'Bank it. There is no double-cross left in this board, so the box is simply a box.',
    'The box is yours and there is no bill attached. Take it, and let the opponent go looking for a safe edge.',
    'Just take it and keep the turn. Declining hands over the box and the tempo, and the tempo is the whole margin.',
    // added 2026-11-12, as the 16 lines above neared the ceiling
    'No catch on this board. The capture is safe, and the quiet edge is the one that gives the game away.',
    'A free box with nothing behind it. Bank it and keep the turn.',
    'Capture and carry on. Holding back here hands the opponent exactly the move they were hoping for.',
    'This box is exactly what it looks like. Take it and the count stays on your side.',
    'Here the patient move is the wrong one. Take the box and keep playing.',
    'Grab it. Every edge that leaves the box alone loses, so the capture is the only move.',
  ],
};

export function motifFamily(c) {
  if (c.keyGain === 0) return c.greedyGain >= 2 ? 'declineDouble' : 'declineSingle';
  if (c.keyGain === 2) return 'takePair';
  return c.greedyGain > c.keyGain ? 'takeOne' : 'takePlain';
}

