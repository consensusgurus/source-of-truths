'use client';
// THE FIGURE TO BEAT, ON THE WAY IN (owner, 2026-10-07). Renders nothing unless
// this tab arrived on a challenge link for this game (lib/challenge.js).
//
// It carries NO button on purpose. The game's own Start control is directly
// below it, and a second control that also starts the game would have to reach
// into ninety different clients to do it.
//
// Read in an EFFECT, never during render: the server has no URL to read, so a
// value computed in render would hydrate against a different one.
import { useEffect, useState } from 'react';
import { readChallenge, dropChallenge, challengeFig } from '@/lib/challenge';

const CSS = `
/* A FULL-WIDTH BAND, CENTRED (owner, 2026-10-07). It shipped for one preview as
   a 720px card floating between the cap and the leader strip, lined up with
   neither, and read as a stray box. Everything else in this stack is a band
   that runs edge to edge, so this is one too: solid gold, its own dark ink set
   on every part of it, the sentence in the middle. */
.stg-chal{position:relative;display:flex;align-items:baseline;justify-content:center;flex-wrap:wrap;
  column-gap:10px;row-gap:2px;text-align:center;background:#e8b43a;color:#2a1f04;
  padding:10px 48px;font-family:Manrope,system-ui,sans-serif;}
.stg-chal b{font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1.25;color:#2a1f04;}
.stg-chal span{font-size:13px;font-weight:700;color:#2a1f04;}
.stg-chal a{color:#2a1f04;font-weight:800;}
.stg-chal button{position:absolute;right:8px;top:50%;transform:translateY(-50%);font:inherit;font-size:20px;line-height:1;
  background:none;border:0;cursor:pointer;color:#2a1f04;padding:6px 10px;border-radius:6px;}
.stg-chal button:focus-visible{outline:2px solid #2a1f04;outline-offset:1px;}
body:has(.stf) .stg-chal{display:none;}
`;

export default function ChallengeStrip({ gameKey, num = null }) {
  const [c, setC] = useState(null);
  useEffect(() => { setC(readChallenge(gameKey)); }, [gameKey]);
  if (!c) return null;
  const other = num != null && Number(num) !== c.n;
  const close = () => { dropChallenge(gameKey); setC(null); };
  return (
    <div className="stg-chal" role="status">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {other ? (
        <>
          <b>{c.name}&rsquo;s challenge was on No. {c.n}</b>
          <span>This is a different board. <a href={`?p=${c.n}`}>Open No. {c.n}</a> to take it on.</span>
        </>
      ) : (
        <>
          <b>{c.name} {c.won ? 'set' : 'scored'} {challengeFig(c)} on this board</b>
          <span>Same puzzle. Can you beat it?</span>
        </>
      )}
      <button type="button" aria-label="Dismiss the challenge" onClick={close}>&times;</button>
    </div>
  );
}
