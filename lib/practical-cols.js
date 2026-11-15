// THE PRACTICAL PUZZLES SPREAD OUT ON A WIDE SCREEN (owner, 2026-11-15: "many of these new
// puzzles should use wider screen space better ... puzzle area and clues should adjust
// dynamically. here the tickets can fit on the right side on wider screen").
//
// A game wraps its play area in .pz-main and its clues (tickets, requests, rules, the tray)
// in .pz-side, both inside .pz-cols inside .pz-wrap. Narrow, the two wrappers vanish
// (display:contents) and everything stacks in one 560px column exactly as before, in DOM
// order. Once the space the stage gives the game is 820px or more, the clues move to a
// column of their own on the right. It is a CONTAINER query, not a media query, so the
// game follows the room it is actually given: the full-screen stage, the stage with the
// site navigation open, or a run embed.
//
// .pz-wrap must NOT wrap the game's full-screen finale: a size container is a containing
// block for position:fixed, which would shrink the fill to the board.
export const COLS_CSS = `
.pz-wrap{width:100%;container:pz/inline-size;}
.pz-cols{display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px;margin:0 auto;}
.pz-main,.pz-side{display:contents;}
@container pz (min-width:820px){
.pz-cols{max-width:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,360px);gap:20px;align-items:start;}
.pz-main,.pz-side{display:flex;flex-direction:column;gap:10px;min-width:0;}
}
`;
