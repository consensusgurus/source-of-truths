'use client';

// FULL VIEW OF THE CLUES (owner, 2026-10-31: "a fuller view option on desktop
// to show all clues for alibi and others"; players had complained about Alibi
// and Stands). Games whose clues only make sense side by side (Alibi's chained
// clues, Stands' points facts) show one clue at a time on the phone stage. On a
// desktop wide enough to hold the board and every clue (1000px and up) they
// open in FULL VIEW: the whole board with every clue beside it. A switch under
// the eyebrow goes back to One at a time. The choice is the player's own and
// is remembered on this browser for every game that offers it; full view is
// the default (owner, 2026-10-30: whole board by default on desktop).
//
// Full view needs the desktop FULL SCREEN (html.lc-focus). With the site
// navigation showing, the stage sits in the page's column between the menus,
// too narrow for the board and the clues side by side, so it keeps one clue at
// a time there and the card's All clues swaps the list in.
//
// THE SWITCH ON THE PHONE TOO (owner, 2026-11-01): below 1000px, and on a
// desktop with the navigation showing, the same switch sits under the eyebrow.
// Full view there STACKS: every clue as a list above the whole board, and the
// page scrolls (`stack`). Beside-the-board is `side`. The narrow choice is kept
// apart from the desktop one (KEY_SM) and starts at One at a time, so a player
// who likes full view on the computer is not handed a long page on the phone.
// The card's All clues button still swaps the list in for one-at-a-time play.
//
// Presentation only. Nothing here touches a save, a score or a result.

import { useEffect, useState } from 'react';
import { useStageMode } from './StageHost';

const KEY = 'ml_clue_view';
const KEY_SM = 'ml_clue_view_sm';
const WIDE = '(min-width: 1000px)';

export function useClueView() {
  const [wide, setWide] = useState(false);
  const stageMode = useStageMode();
  const desk = wide && stageMode === 'full';
  const [mode, setMode] = useState('full');
  const [modeSm, setModeSm] = useState('one');
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY); if (v === 'one' || v === 'full') setMode(v);
      const w = window.localStorage.getItem(KEY_SM); if (w === 'one' || w === 'full') setModeSm(w);
    } catch (e) {}
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(WIDE);
    const f = () => setWide(mq.matches);
    f();
    if (mq.addEventListener) mq.addEventListener('change', f); else mq.addListener(f);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', f); else mq.removeListener(f); };
  }, []);
  const set = (m) => {
    if (desk) setMode(m); else setModeSm(m);
    try { window.localStorage.setItem(desk ? KEY : KEY_SM, m); } catch (e) {}
  };
  const full = (desk ? mode : modeSm) === 'full';
  return { desk, full, side: desk && full, stack: !desk && full, setFull: (on) => set(on ? 'full' : 'one') };
}

// The One at a time | Full view switch, drawn under the eyebrow at every width.
export function ClueViewSwitch({ view }) {
  if (!view) return null;
  return (
    <div className="cvw" role="group" aria-label="Clue view">
      <button type="button" className={view.full ? undefined : 'on'} aria-pressed={!view.full} onClick={() => view.setFull(false)}>One at a time</button>
      <button type="button" className={view.full ? 'on' : undefined} aria-pressed={view.full} onClick={() => view.setFull(true)}>Full view</button>
    </div>
  );
}

// Shared styles: the switch, and the clue sheet (every clue as a row you can
// cross off; hovering one lights what it names on the board).
export const CLUE_VIEW_CSS = `
.pst .cvw{display:flex;align-self:center;width:min(360px,100%);border:2px solid var(--pst-ink);border-radius:999px;overflow:hidden;flex:none;}
.pst .cvw button{flex:1;height:40px;border:0;border-radius:0;background:transparent;font-size:14px;font-weight:800;padding:0 14px;white-space:nowrap;}
.pst .cvw button+button{border-left:2px solid var(--pst-ink);}
.pst .cvw button.on{background:var(--pst-acc);color:var(--pst-on-acc);}
.pst .cvs{border-radius:16px;background:var(--pst-pale);border:2px solid var(--pst-ink);overflow:hidden;}
.pst .cvs-hd{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px 11px;}
.pst .cvs-hd .lb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--pst-mute);}
.pst .cvs-hd .ct{white-space:nowrap;flex:none;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;}
.pst .cvs-r{display:flex;align-items:baseline;gap:12px;width:100%;padding:12px 16px;border:0;border-top:1.5px solid color-mix(in srgb, var(--pst-ink) 14%, transparent);border-radius:0;background:transparent;text-align:left;}
.pst .cvs-r>b{flex:none;width:20px;font-size:12px;font-weight:800;color:var(--pst-mute);}
.pst .cvs-r>span{flex:1;min-width:0;font-size:16px;font-weight:700;line-height:1.38;}
.pst .cvs-r>span b{font-weight:800;}
.pst .cvs-r.off>span{opacity:.4;text-decoration:line-through;}
.pst .cvs-r.off>b{opacity:.45;}
.pst .cvs-r.hov{background:color-mix(in srgb, var(--pst-acc) 30%, var(--pst-pale));}
.pst .cvs-note{text-align:center;font-size:12px;font-weight:700;color:var(--pst-mute);margin-top:10px;}
.pst .cvs-wrap{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start;justify-content:center;width:100%;}
.pst .cvs-board{flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:12px;}
.pst .cvs-side{flex:1 1 360px;min-width:0;max-width:460px;}
.pst .cvs-stack{display:flex;flex-direction:column;gap:12px;width:100%;}
@media (max-width:640px){.pst .cvs-hd{padding:11px 14px 9px;}.pst .cvs-r{padding:10px 14px;gap:10px;}.pst .cvs-r>span{font-size:14.5px;}}
`;
