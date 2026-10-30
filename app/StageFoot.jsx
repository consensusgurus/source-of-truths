'use client';

// THE STAGE FOOT (owner, 2026-10-28, "this is new standard"): one row of
// buttons at the bottom of every daily puzzle, under the board:
//
//   Clock        hidden by default, one tap shows the running time, and the
//                choice is remembered site-wide (lib/reveal-pref.js). On the end
//                screen the time is always shown.
//   How to play  the game's rules (lib/stage-help.js).
//   Give up      while the board is in play, when the game offers it. Two taps:
//                the first arms it (it reads Tap again, in the same spot), the
//                second ends the game.
//
// The header keeps only the way back, the game's name, Share and the look, so
// the board gets the room. The row is the same during play and at the end;
// only the clock's face and the Give up button change.

import React from 'react';
import { useRevealPref, REVEAL } from '@/lib/reveal-pref';
import { useStageHelp } from '@/lib/stage-help';
import { useStageFootState } from '@/lib/stage-foot';

export default function StageFoot({ clock = undefined, done = undefined, giveUp = null, onHelp = null, className = '', bg = null }) {
  const [clockShown, toggleClock] = useRevealPref(REVEAL.clock);
  const registered = useStageHelp();
  const pub = useStageFootState();
  const help = onHelp || registered;
  const time = clock !== undefined && clock !== null ? clock : pub.clock;
  const ended = done !== undefined && done !== null ? !!done : pub.done;
  const showTime = ended || clockShown;
  const give = giveUp && !ended ? giveUp : null;
  if (time == null && !help && !give && !ended) return null;
  return (
    <div className={'sft' + (className ? ' ' + className : '')} style={bg ? { '--sft-bg': bg } : undefined}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {time != null ? (
        <button type="button" className={'sft-b sft-clock' + (showTime ? ' on' : '')}
          onClick={(e) => { e.stopPropagation(); if (!ended) toggleClock(); }}
          aria-pressed={ended ? undefined : clockShown}
          aria-label={showTime ? `Time ${time}${ended ? '' : '. Hide the clock'}` : 'Show the clock'}
          title={ended ? 'Your time' : (clockShown ? 'Hide the clock' : 'Show the clock')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5" /><path d="M9.5 2.5h5" /></svg>
          <span>{showTime ? time : 'Clock'}</span>
        </button>
      ) : null}
      {help ? (
        <button type="button" className="sft-b" onClick={(e) => { e.stopPropagation(); help(); }} title="How to play">
          <b aria-hidden="true">?</b><span>How to play</span>
        </button>
      ) : null}
      {ended ? (
        // BACK TO THE RESULT from the board view (owner, 2026-10-30): the
        // revealed board is drawn on the stage now, so the stage carries the
        // way back. It presses the board view's own button, so no game wires it.
        <button type="button" className="sft-b sft-back" onClick={(e) => { e.stopPropagation(); try { const b = document.querySelector('.stf-bv-b'); if (b) b.click(); } catch (err) {} }}>
          <span>Your result</span>
        </button>
      ) : null}
      {give ? (
        <button type="button" aria-label={give.armed ? (give.armedLabel || 'Tap again to give up') : 'Give up'} className={'sft-b sft-give' + (give.armed ? ' on' : '')} onClick={(e) => { e.stopPropagation(); give.onPress && give.onPress(e); }}>
          <span>{give.armed ? 'Tap again' : 'Give up'}</span>
        </button>
      ) : null}
    </div>
  );
}

const CSS = `
.sft{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:nowrap;flex:none;}
.sft .sft-give{min-width:86px;}
.sft .sft-b.sft-back{display:none;}
html:has(.stf-bv) .sft .sft-b.sft-back{display:inline-flex;}
.sft .sft-b{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:34px;box-sizing:border-box;padding:0 12px;border-radius:999px;border:2px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;line-height:1;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;opacity:1;}
.sft .sft-b b{font-size:14px;font-weight:800;line-height:1;}
.sft .sft-clock.on span{font-size:13px;font-variant-numeric:tabular-nums;}
.sft .sft-give.on{background:currentColor;}
.sft .sft-give.on span{color:var(--sft-bg,#fff);}
.sft .sft-b:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
`;
