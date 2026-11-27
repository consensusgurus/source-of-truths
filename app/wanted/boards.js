// The boards for Wanted, the enormous hidden figure hunt (launched 2026-11-26), in
// the order they open. A board is a seed and a list of districts; the scene is
// built from them by lib/wanted-engine.js, in the browser. `n` is how many
// things are on the list and `sum` the checksum of the built scene, both stored
// when the board was generated (scripts/verify-wanted.mjs rebuilds and compares).
// `pool` pins how long the engine's lists were that day, so appending to them
// never moves an older board.
//
// A board opens when the one before it closes, and it closes only when the
// crowd has found everything on it (lib/wanted.js: no automatic turnover).
//
// Written by scripts/gen-wanted.mjs (append-only). SERVER-ONLY: the page hands
// the browser just the one board being played.
export const BOARDS = [
  {"num":1,"key":"wanted-b1","seed":-1689424292,"cols":4,"districts":["fairground","beach","market","harbor","slopes","zoo","camp","sportsday","station","castle","farm","downtown","airfield","museum","waterpark","parade"],"pool":{"u":38,"t":24,"s":16},"n":257,"sum":"e6qjoz"},
  {"num":2,"key":"wanted-b2","seed":957670543,"cols":4,"districts":["farm","filmset","airfield","sportsday","buildsite","harbor","downtown","camp","zoo","museum","parade","station","beach","waterpark","market","castle"],"pool":{"u":38,"t":24,"s":16},"n":257,"sum":"sob668"},
];
