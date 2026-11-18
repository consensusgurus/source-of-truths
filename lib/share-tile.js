// THE SHARE-CARD ART ON THE DETAILS CARD (owner, 2026-11-15: "make the detail
// tiles on main look as close to the share image links as possible ...
// including nicer ones for the ones we have nicer ones for", then "go ahead
// with the update in A" and "lean more heavily on category colors").
//
// Every Details card is now drawn like its share card: the category colour as
// the card, a small "Category · Daily Puzzle" line, the name set large, and the
// board in a white square on the right. Most games keep their own GamePreview
// drawing in that square. The games below have a better picture on their share
// card (a hand-built scene, or a board drawn into the card), so the square
// shows a cut of that picture instead.
//
// The cuts are public/og/tile/<key>.png, 224px square, taken from
// public/og/<key>.png: the right-hand art half for a scene card, the white board
// card for a board card. Re-cut one whenever its share card is re-baked. A key
// missing here simply falls back to its drawing, so the list never has to be
// complete.
// RETIRED (owner, 2026-11-17: "go back to all consistent coloring and utilizing
// the category color. they should still be somewhat detailed"). The full-colour
// cuts sat beside one-colour drawings and broke the set, so every Details tile
// now draws its own GamePreview square in its category's three steps. Do not
// add keys back; improve the game's drawing in app/GamePreviewTiles.jsx instead.
const KEYS = [];
export const SHARE_TILE = Object.fromEntries(KEYS.map((k) => [k, `/og/tile/${k}.png`]));
