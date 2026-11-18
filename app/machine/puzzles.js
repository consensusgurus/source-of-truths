// Puzzle data for Machine, the daily contraption puzzle (lib/machine-engine.js).
// Checked by scripts/verify-machine.mjs. Imported only by the server page, which
// strips days not yet live AND the stored machine (`sol`) before anything reaches
// a browser. Boards are hand-built and tuned in the engine; a board that has gone
// live is frozen (never edit one: the physics would replay it differently).
//
//   band      gentle | moderate | tough | sunday     title  the machine's name
//   goalText  the day's job, printed on the goal pill
//   w, h      the board in 60px cells (14 x 10 on weekdays)
//   pieces    the fixed parts: { t, x, y, ... } in cells. t is one of shelf (w),
//             crate, wall (h), post (h, side), floor (w, the bottom row; a gap is
//             a pit), door (id: a trapdoor), button (face l|r|u, wires: [ids]),
//             plunger (kicks the ball beside it on Run), hoop, bucket, bell,
//             balloon, ramp (dir), spring, belt (dir), bumper, fan (dir u|l|r,
//             reach in cells, id: off until a button wires it), seesaw (two
//             cells, tilt -1|1), pipe (dir), magnet, dominoes (n, dir), cannon
//             (dir, id), glue, gate (dir: the way it lets balls through)
//   wireX     where the button's wire runs up the side (art only)
//   balls     { id, kind: bowling|basket|tennis|steel, x, y (cells, resting on
//             what is below) or px, py, vx (the plunger's kick), role: 'kick',
//             cannon: id (loaded in that cannon, fired by its button) }
//   goal      { type: hoop|bucket|bell|balloon, ball?: the ball that must do it }
//   tray      the parts the player gets, one of each entry: { t, dir? }. Any
//             part with a dir can be flipped by the player.
//   sol       one working machine, [{ ti, px, py, dir? }] (server only)
//   sunday    the Sunday Edition (bigger board, more parts)
//
// THE RULES A BOARD MUST MEET (verify-machine enforces each):
//   - the stored machine wins, and every part in it fits (no overlaps);
//   - the empty board does not win;
//   - no single tray part wins anywhere on the board (every 10px spot near a
//     ball's path is tried), so every day needs at least two parts working
//     together;
//   - the tray has at least one part the stored machine does not use (the
//     copy says "not every part is needed").
export const PUZZLES = [
  {"num":1,"quizId":"machine-11-17-26","live":"2026-11-17","dateLabel":"November 17, 2026","band":"gentle","title":"The Trapdoor","goalText":"Sink the basketball in the hoop","w":14,"h":10,"wireX":832,"pieces":[{"t":"plunger","x":0,"y":1},{"t":"shelf","x":0,"y":2,"w":4},{"t":"post","x":11,"y":1,"h":2,"side":"r"},{"t":"post","x":13,"y":1,"h":2,"side":"l"},{"t":"door","x":12,"y":2,"id":"trap"},{"t":"crate","x":6,"y":6},{"t":"shelf","x":5,"y":7,"w":7},{"t":"button","x":11,"y":6,"face":"l","wires":["trap"]},{"t":"hoop","x":0,"y":9},{"t":"floor","x":1,"y":9,"w":5},{"t":"floor","x":8,"y":9,"w":6}],"balls":[{"id":"red","kind":"bowling","role":"kick","x":1,"y":1,"vx":2.0},{"id":"blue","kind":"basket","x":12,"y":1}],"goal":{"type":"hoop","ball":"blue"},"tray":[{"t":"spring"},{"t":"ramp","dir":"l"},{"t":"ramp","dir":"r"},{"t":"belt","dir":"l"}],"sol":[{"ti":0,"px":300,"py":300},{"ti":1,"px":720,"py":480,"dir":"l"},{"ti":3,"px":360,"py":540,"dir":"l"}]},
  {"num":2,"quizId":"machine-11-18-26","live":"2026-11-18","dateLabel":"November 18, 2026","band":"moderate","title":"The Jump","goalText":"Sink the tennis ball in the hoop","w":14,"h":10,"wireX":832,"pieces":[{"t":"plunger","x":0,"y":1},{"t":"shelf","x":0,"y":2,"w":5},{"t":"shelf","x":10,"y":6,"w":4},{"t":"button","x":13,"y":5,"face":"l","wires":["trap"]},{"t":"bumper","x":5,"y":8},{"t":"hoop","x":0,"y":9},{"t":"floor","x":1,"y":9,"w":13},{"t":"post","x":7,"y":1,"h":2,"side":"r"},{"t":"post","x":9,"y":1,"h":2,"side":"l"},{"t":"door","x":8,"y":2,"id":"trap"},{"t":"gate","x":10,"y":5,"dir":"r"}],"balls":[{"id":"red","kind":"bowling","role":"kick","x":1,"y":1,"vx":2.0},{"id":"blue","kind":"tennis","x":8,"y":1}],"goal":{"type":"hoop","ball":"blue"},"tray":[{"t":"spring"},{"t":"ramp","dir":"l"},{"t":"ramp","dir":"r"},{"t":"glue"}],"sol":[{"ti":0,"px":320,"py":300},{"ti":1,"px":480,"py":480,"dir":"l"},{"ti":2,"px":360,"py":480,"dir":"r"}]},
  {"num":3,"quizId":"machine-11-19-26","live":"2026-11-19","dateLabel":"November 19, 2026","band":"moderate","title":"The Wind Tunnel","goalText":"Ring the bell","w":14,"h":10,"pieces":[{"t":"plunger","x":0,"y":1},{"t":"shelf","x":0,"y":2,"w":4},{"t":"floor","x":0,"y":9,"w":6},{"t":"floor","x":8,"y":9,"w":6},{"t":"button","x":8,"y":8,"face":"l","wires":["lift"]},{"t":"crate","x":10,"y":8},{"t":"fan","x":11,"y":8,"dir":"u","reach":3,"id":"lift"},{"t":"crate","x":12,"y":8},{"t":"bell","x":13,"y":6},{"t":"wall","x":9,"y":4,"h":4}],"balls":[{"id":"red","kind":"bowling","role":"kick","x":1,"y":1,"vx":2.4},{"id":"blue","kind":"tennis","px":690,"py":501}],"goal":{"type":"bell"},"tray":[{"t":"belt","dir":"r"},{"t":"fan","dir":"r"},{"t":"ramp","dir":"r"},{"t":"glue"}],"sol":[{"ti":0,"px":360,"py":540,"dir":"r"},{"ti":1,"px":610,"py":320,"dir":"r"}]},
];
