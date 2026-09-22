'use client';
// THE SLOT IS EMPTY FOR ALMOST EVERY READER (owner, 2026-09-22).
//
// The groups band renders nothing at all for somebody in no group, which is
// nearly everyone, so the largest piece of home-page room groups have was going
// unused by the people who have not joined one. This takes that slot, and only
// for a reader who is already playing: it names what a group would do with the
// puzzles they have ALREADY finished today, rather than advertising a feature.
//
// IT IS NEVER SHOWN TO A FIRST-TIME VISITOR. `returning` is the home's own
// footprint test (a saved identity, a day breadcrumb, any per-puzzle save), and
// a reader who has finished nothing today has nothing for the line to be about.
//
// It retires itself after two dismissals, and joining a group retires it by
// making the band render instead.
//
// BECAUSE OF THAT, NOBODY WHO WORKS ON THIS SITE EVER SEES IT: an owner is in a
// group, so the band takes the slot and this never mounts. `?groupinvite=1`
// forces it for a look, the way `?welcome=1` does for the arrival overlay and
// `?install=1` for the install card. A forced draw writes no dismissal, and
// substitutes a sample count when the reader has finished nothing today, so a
// preview never reads "you have finished 0 puzzles".
import { useEffect, useState } from 'react';

const KEY = 'sot_grp_invite';
const MAX_DISMISS = 2;

const SAMPLE = 5;

export default function HomeInvite({ playedToday = 0, returning = null, withTq = (h) => h, preview = false }) {
  // localStorage decides this, so it is read in an effect and the server and the
  // first client paint both render nothing. Same rule the rest of this page
  // follows for anything it keeps on the device.
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    let n = 0;
    try { n = Number(localStorage.getItem(KEY) || 0) || 0; } catch (e) { n = 0; }
    setHidden(n >= MAX_DISMISS);
  }, []);

  if (!preview && (hidden || returning !== true || playedToday < 1)) return null;

  const n = playedToday > 0 ? playedToday : SAMPLE;
  const dismiss = () => {
    if (!preview) {
      try { localStorage.setItem(KEY, String((Number(localStorage.getItem(KEY) || 0) || 0) + 1)); } catch (e) {}
    }
    setHidden(true);
  };

  return (
    <section className="hgi sty-rev" aria-label="Play with people you know">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hgi-h">Play with people you know</div>
      <div className="hgi-c">
        <div className="hgi-t">
          <b>Rank your {n} against theirs</b>
          <i>
            You have finished {n} {n === 1 ? 'puzzle' : 'puzzles'} today. A group
            puts everyone who joins on one private board, on the same points, every day.
          </i>
        </div>
        <div className="hgi-r">
          <a className="hgi-go" href={withTq('/groups')}>Start a group</a>
          <a className="hgi-alt" href={withTq('/groups')}>Have a code?</a>
          <button type="button" className="hgi-x" onClick={dismiss} aria-label="Hide this">&times;</button>
        </div>
      </div>
    </section>
  );
}

const CSS = `
.hgi{display:flex;flex-direction:column;gap:6px;min-width:0;align-self:start;}
.hgi-h{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.hgi-c{border:1px dashed var(--stg-line2);border-radius:12px;background:var(--stg-surf);
  padding:10px 12px;display:flex;flex-direction:column;gap:9px;min-width:0;}
.hgi-t b{display:block;font-size:14.5px;font-weight:800;}
.hgi-t i{font-style:normal;display:block;margin-top:3px;font-size:12.5px;color:var(--stg-mute);}
.hgi-r{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
/* THE INK THAT CARRIES ON THE ACCENT IS --stg-onramp, never a literal and
   never an invented token: it is #08222e on the dark stage and WHITE in the
   light register, where --stg-acc is a deep blue. This shipped as
   var(--stg-on-acc), which does not exist, so both registers took the dark
   fallback and the light one read near-black on deep blue (owner report). */
.hgi-go{flex:none;background:var(--stg-acc);color:var(--stg-onramp,#08222e);border-radius:9px;
  padding:7px 13px;text-decoration:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;
  font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
.hgi-go:hover{opacity:.9;}
.hgi-alt{flex:none;border:1px solid var(--stg-line2);color:var(--stg-ink2);border-radius:9px;
  padding:7px 11px;text-decoration:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;
  font-size:10px;letter-spacing:.08em;text-transform:uppercase;}
.hgi-alt:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.hgi-x{margin-left:auto;background:none;border:0;color:var(--stg-mute);cursor:pointer;
  font-size:17px;line-height:1;padding:2px 4px;}
.hgi-x:hover{color:var(--stg-ink);}
.hgi-go:focus-visible,.hgi-alt:focus-visible,.hgi-x:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
`;
