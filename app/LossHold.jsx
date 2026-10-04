'use client';

import { useEffect, useRef, useState } from 'react';
import { playLoss, BEAT_FRESH, firePendingBuzz } from '@/lib/finish-beat';

// THE RETRY HOLD (owner, 2026-10-04). It replaced the intermediate "You lost /
// Replay / Show end game card" curtain on the games built for another run
// (End Game, Arcade, and the graded games like Barter and Parker; the set is
// wantsFastRetry in lib/daily-games). The board stays on screen, the gaps go
// dark over it (lib/finish-beat.js playLoss), and then it HOLDS there, with a
// bar along the bottom carrying the two choices: Replay, or the end game card.
// Nothing advances on its own. Tapping the bar anywhere but Replay opens the
// card, so the way out is one tap from wherever the thumb is.
//
// It never collapses the board (that is StageFinish's job, and StageFinish is
// not mounted while this is up), and it never shows the answer: the clients
// keep the answer off the board until Reveal answer is pressed on the card.
// (Lives only on the stage; the legacy Loft card keeps the old retry panel.)
export default function LossHold({ gameKey, verdict, detail, chip, sub, onReplay, onCard }) {
  const [fresh] = useState(() => (typeof performance !== 'undefined' && performance.now ? performance.now() : 0) >= BEAT_FRESH);
  const [up, setUp] = useState(!fresh);
  const replayRef = useRef(null);

  useEffect(() => {
    firePendingBuzz();
    const h = playLoss(gameKey, { keep: true, instant: !fresh });
    const t = fresh ? setTimeout(() => setUp(true), h.ms) : null;
    return () => { if (t) clearTimeout(t); h.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!up) return undefined;
    try { if (replayRef.current) replayRef.current.focus({ preventScroll: true }); } catch (e) {}
    const onKey = (e) => { if (e.key === 'Escape') onCard(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [up, onCard]);

  // Tapping the animation itself skips straight to the hold.
  useEffect(() => {
    if (up) return undefined;
    const skip = () => setUp(true);
    window.addEventListener('pointerdown', skip, true);
    return () => window.removeEventListener('pointerdown', skip, true);
  }, [up]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={'lsh' + (up ? ' on' : '')} role="region" aria-label="Round over"
        onClick={(e) => { if (!e.target.closest('.lsh-re')) onCard(); }}>
        <div className="lsh-in">
          <div className="lsh-tx">
            {chip ? <div className="lsh-eb">{chip}</div> : null}
            <div className="lsh-v">{verdict || 'Not solved'}</div>
            {detail ? <div className="lsh-d">{detail}</div> : null}
          </div>
          <div className="lsh-acts">
            <button type="button" className="lsh-re" ref={replayRef} onClick={(e) => { e.stopPropagation(); onReplay(e); }}>
              <span aria-hidden="true">&#8635;</span> Replay
            </button>
            <button type="button" className="lsh-card">End game card <span aria-hidden="true">&rsaquo;</span></button>
          </div>
        </div>
        {sub ? <div className="lsh-sub">{sub}</div> : null}
      </div>
    </>
  );
}

const CSS = `
.lsh{position:fixed;left:0;right:0;bottom:0;z-index:60;cursor:pointer;
  background:var(--stg-raise,#141822);color:var(--stg-ink,#e9edf4);
  border-top:1px solid var(--stg-line2,rgba(255,255,255,.14));
  box-shadow:0 -10px 30px rgba(0,0,0,.28);
  padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));
  transform:translateY(105%);transition:transform .42s cubic-bezier(.2,.8,.2,1);}
.lsh.on{transform:translateY(0);}
.lsh-in{max-width:760px;margin:0 auto;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.lsh-tx{flex:1 1 220px;min-width:0;}
.lsh-eb{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute,#9aa3b5);}
.lsh-v{font-size:26px;font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-top:2px;}
.lsh-d{font-size:13px;color:var(--stg-mute,#9aa3b5);margin-top:3px;font-variant-numeric:tabular-nums;}
.lsh-acts{display:flex;gap:10px;align-items:center;flex:none;}
.lsh-re{font:inherit;font-size:15px;font-weight:800;border:0;border-radius:10px;padding:12px 20px;cursor:pointer;
  background:var(--stg-acc,#7dd3fc);color:var(--stg-onramp,#08222e);}
.lsh-re:hover{filter:brightness(1.06);}
.lsh-card{font:inherit;font-size:14px;font-weight:700;border:1.5px solid var(--stg-line3,rgba(255,255,255,.3));
  border-radius:10px;padding:10px 14px;cursor:pointer;background:transparent;color:var(--stg-ink,#e9edf4);}
.lsh-re:focus-visible,.lsh-card:focus-visible{outline:2px solid var(--stg-ink,#e9edf4);outline-offset:2px;}
.lsh-sub{max-width:760px;margin:8px auto 0;font-size:12px;color:var(--stg-mute,#9aa3b5);}
@media (max-width:520px){.lsh-acts{width:100%;}.lsh-re{flex:1;}.lsh-v{font-size:22px;}}
@media (prefers-reduced-motion: reduce){.lsh{transition:none;}}
`;
