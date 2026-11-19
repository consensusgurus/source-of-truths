'use client';
// THE POST-GAME TALK BAND (owner, 2026-11-18). On the endings: one line, "Talk About Today's
// <Game>", and the two plain doors, See The Discussion and Suggest An Idea (shortened from Suggest A <Game> Idea, owner 2026-11-18).
//
// Where it sits: on the ending's first screen it goes BELOW the three big plays
// (owner: "one row lower below the next up tiles"), and on the Full Results
// page below Up next, desktop and phone alike.
//
// JUST THE LINE AND THE BUTTONS (owner, 2026-11-18: "How about just the text above and the
// buttons?"). No Post-Game Talk eyebrow, no player count, no finishers-only note; the
// discussion page itself says who can read it. With no count it makes no request at all.
import React from 'react';
import { talkHref, suggestHref } from './communityClient';

export default function TalkBand({ gameKey, gameName, where = 'first', phone = false }) {
  if (!gameKey) return null;
  const name = gameName || 'this puzzle';
  return (
    <div className={'tkb tkb-' + where + (phone ? ' tkb-ph' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="tkb-tx">
        <b>{`Talk About Today\u2019s ${name}`}</b>
      </div>
      <div className="tkb-bt">
        <a className="tkb-go" href={talkHref(gameKey)}>See The Discussion</a>
        <a className="tkb-alt" href={suggestHref(gameKey)}>Suggest An Idea</a>
      </div>
    </div>
  );
}

const CSS = `
.tkb{--tk-ink:var(--sst-ink,var(--stg-ink,#0b0d12));display:flex;align-items:center;gap:18px;box-sizing:border-box;width:100%;
  border:1px solid var(--tk-ink);color:var(--tk-ink);text-align:left;font-family:inherit;}
.tkb-first{border-radius:20px;padding:16px 20px;background:var(--sst-wash,transparent);}
.tkb-sheet{border-radius:14px;padding:12px 14px 12px 16px;margin-top:16px;
  background:color-mix(in srgb,var(--sst-bg,#ffd6dc) 45%,var(--stg-raise,#ffffff));}
.tkb-tx{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;}
.tkb-tx small{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.8;}
.tkb-tx b{font-size:20px;font-weight:800;line-height:1.25;letter-spacing:-.01em;}
.tkb-sheet .tkb-tx small{display:none;}
.tkb-sheet .tkb-tx b{font-size:15.5px;}
.tkb-tx span{font-size:14px;font-weight:600;line-height:1.4;opacity:.85;}
.tkb-sheet .tkb-tx span{font-size:12.5px;}
.tkb-bt{display:flex;gap:10px;flex:none;}
.tkb-bt a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;box-sizing:border-box;border-radius:12px;
  border:1px solid var(--tk-ink);font-size:15px;font-weight:800;text-decoration:none;white-space:nowrap;line-height:1.25;}
.tkb-sheet .tkb-bt a{min-height:40px;padding:0 12px;border-radius:10px;font-size:13.5px;}
.tkb-go{background:var(--tk-ink);color:var(--sst-bg,var(--stg-raise,#ffffff)) !important;}
.tkb-sheet .tkb-go{color:var(--stg-raise,#ffffff) !important;}
.tkb-alt{background:transparent;color:var(--tk-ink) !important;}
.tkb-sheet .tkb-alt{background:var(--stg-raise,#ffffff);}
.tkb-go:hover{filter:brightness(1.15);}
.tkb-alt:hover{background:color-mix(in srgb,var(--tk-ink) 8%,transparent);}
.tkb a:focus-visible{outline:2px solid var(--tk-ink);outline-offset:2px;}
.tkb-ph{flex-direction:column;align-items:stretch;gap:12px;padding:14px;border-radius:18px;}
.tkb-ph .tkb-tx b{font-size:17px;}
.tkb-ph .tkb-tx span{font-size:13px;}
.tkb-ph .tkb-bt a{flex:1;min-width:0;padding:0 8px;font-size:14px;white-space:normal;text-align:center;}
.tkb-sheet.tkb-ph{padding:12px;border-radius:14px;}
@container (max-width:560px){ .tkb-sheet{flex-direction:column;align-items:stretch;} .tkb-sheet .tkb-bt a{flex:1;} }
@media (max-width:900px){ .tkb-first:not(.tkb-ph){flex-direction:column;align-items:stretch;} .tkb-first:not(.tkb-ph) .tkb-bt a{flex:1;} }
`;
