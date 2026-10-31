// THE LOGIC BOARDS ON THE WHITE STAGE (owner, 2026-10-31: "alibi for instance
// still has old format"). The five Judged cases, Ergo, Docket, Alibi, Sworn and
// Hearsay, play on app/PlayStage.jsx on their own pages, in the rose look the
// owner approved for them inside Judged (AlibiRose / AlibiRoseDark): a white
// page, rounded tiles with a 2px ink rule, pale rose on what can be tapped,
// the full rose (with dark ink) on what is confirmed, selected or primary, and
// the brief (rules, conditions, the story) sitting straight on the page. The
// layouts follow the approved mockups (2026-10-31): rule numbers are plain
// ink, a selected witness or the second speaker is an ink card with pale rose
// type (`lgs-inv`), the question sits large and centred above its answers.
//
// This is the shared half: the brief, the rose tile, the boxed panel and the
// primary button. Each client adds its own board rules under its own prefix
// (egs-, dks-, als-, sws-, hss-). Everything reads PlayStage's board tokens
// (--pst-acc, --pst-on-acc, --pst-pale, --pst-deep, --pst-cell-line,
// --pst-mute, --pst-bad), so the dark looks and the black-and-white run looks
// need nothing of their own.
//
// THE SAME BOARD INSIDE JUDGED. A client mounted in a run (app/RunEmbed.jsx)
// draws this stage INLINE in the run's frame and follows the run's look; its
// old page column is hidden by `lgs-hosted` on its root, so the run and the
// game's own page show one board.

export const LOGIC_STAGE_CSS = `
.lgs-hosted > [class$="-wrap"]{display:none !important;}
.pst .lgs-lab{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--pst-mute);line-height:1.3;}
.pst .lgs-eb{text-align:center;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.7;line-height:1.3;}
.pst .lgs-q{margin:0;text-align:center;font-size:clamp(22px,6.6vw,27px);font-weight:800;line-height:1.2;letter-spacing:-.02em;}
.pst .lgs-p{margin:0;font-size:14px;line-height:1.45;font-weight:600;color:var(--pst-mute);text-align:left;}
.pst .lgs-p b{color:var(--pst-ink);font-weight:800;}
.pst .lgs-line{text-align:center;font-size:13px;font-weight:700;opacity:.8;font-variant-numeric:tabular-nums;}
.pst .lgs-sec{display:flex;flex-direction:column;gap:8px;min-width:0;}
.pst .lgs-rules{display:flex;flex-direction:column;gap:7px;padding:2px;}
.pst .lgs-rule{display:flex;gap:9px;align-items:baseline;font-size:14px;font-weight:700;line-height:1.35;text-align:left;}
.pst .lgs-rule>b{flex:none;width:14px;font-weight:800;opacity:.6;}
.pst .lgs-rule>span{flex:1;min-width:0;}
.pst button.lgs-rule{background:transparent;border:0;border-radius:0;padding:0;width:100%;}
.pst .lgs-tile{border:2px solid var(--pst-ink);border-radius:14px;background:var(--pst-pale);color:var(--pst-ink);}
.pst .lgs-tile.on{background:var(--pst-acc);}
.pst .lgs-tile.on,.pst .lgs-tile.on *{color:var(--pst-on-acc);}
.pst .lgs-inv{background:var(--pst-ink);color:var(--pst-inv);}
.pst .lgs-inv *{color:var(--pst-inv);}
.pst .lgs-box{border:2px solid var(--pst-ink);border-radius:14px;background:var(--pst-bg);padding:12px 14px;}
.pst .lgs-big{min-height:56px;border-radius:14px;border:2px solid var(--pst-ink);font-size:17px;font-weight:800;width:100%;}
.pst .pst-tb.lgs-pri{background:var(--pst-acc);color:var(--pst-on-acc);}
.pst .pst-tb.lgs-pri *{color:var(--pst-on-acc);}
.pst .pst-tb.lgs-sm{min-height:34px;padding:0 12px;font-size:13px;}
.pst .lgs-bad{color:var(--pst-bad);}
.pst .lgs-cols{display:flex;flex-direction:column;gap:14px;}
/* FILL THE SCREEN as the mockups do: the brief at the top, the question in
   the middle, the answers at the foot. */
.pst .pst-top:has(> .lgs-fill, > .lgs-grow){justify-content:flex-start;}
.pst .lgs-fill{flex:1 0 auto;}
.pst .lgs-grow{flex:1 0 auto;display:flex;flex-direction:column;justify-content:center;}
@media (min-width:900px){.pst.wide .lgs-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start;}}
@media (hover:hover) and (pointer:fine){.pst .lgs-tile:not(:disabled):not(.on):hover{background:color-mix(in srgb, var(--pst-acc) 34%, var(--pst-bg));}}
`;

// The look a board embedded in a run draws in: the run's own look when it
// passed one, else the run's register.
export function embedLook(embed) {
  if (!embed) return null;
  if (embed.look) return embed.look === 'color' ? 'tint' : embed.look;
  return embed.theme === 'dark' ? 'darktint' : 'tint';
}
