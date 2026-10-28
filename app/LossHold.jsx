'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playLoss, BEAT_FRESH, pageAge, firePendingBuzz } from '@/lib/finish-beat';

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
  const [fresh] = useState(() => pageAge() >= BEAT_FRESH);
  const [up, setUp] = useState(!fresh);
  const replayRef = useRef(null);
  // Portaled to <body> (2026-10-22): mounted inside the game, the fixed bar was
  // trapped in the board's stacking context, and StageTail (position:relative,
  // z-index:2) painted the About text over it on phones.
  // The stage tokens live on the board's wrappers, so the bar carries the
  // computed values with it, read from an anchor left where it used to mount.
  const anchorRef = useRef(null);
  const [host, setHost] = useState(null);
  const [vars, setVars] = useState(null);
  useEffect(() => {
    const a = anchorRef.current;
    const v = {};
    try {
      const cs = getComputedStyle(a);
      TOKENS.forEach((k) => { const x = cs.getPropertyValue(k).trim(); if (x) v[k] = x; });
    } catch (e) {}
    setVars(v);
    setHost(document.body);
  }, []);

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

  const anchor = <span ref={anchorRef} hidden aria-hidden="true" />;
  if (!host) return anchor;
  return (
    <>
      {anchor}
      {createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={'lsh' + (up ? ' on' : '')} style={vars || undefined} role="region" aria-label="Round over"
        onClick={(e) => { if (!e.target.closest('.lsh-re')) onCard(); }}>
        <div className="lsh-in">
          <div className="lsh-tx">
            {chip ? <div className="lsh-eb">{chip}</div> : null}
            <div className="lsh-v">{verdict || 'Fail'}</div>
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
    </>,
    host
      )}
    </>
  );
}

const TOKENS = ['--stg-ground', '--stg-ink', '--stg-raise', '--stg-line2', '--stg-mute', '--sp-g'];

// THE NEW THEME (owner, 2026-10-28: "the replay button pop-up needs restyling to
// match new theme. Do this everywhere for replays"). The bar is the stage's own
// ground and ink, the same pills as the foot row: Replay filled in the ink, End
// game card outlined, a 2px ink rule along the top. The tokens are read off the
// game's root, so the bar follows the page's look, light or dark.
const CSS = `
.lsh{position:fixed;left:0;right:0;bottom:0;z-index:1000;isolation:isolate;cursor:pointer;
  font-family:'Manrope',system-ui,sans-serif;
  background:var(--stg-ground,#ffffff);color:var(--stg-ink,#08222e);
  border:2px solid var(--stg-ink,#08222e);border-bottom:0;
  border-radius:22px 22px 0 0;
  padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));
  transform:translateY(105%);transition:transform .42s cubic-bezier(.2,.8,.2,1);}
.lsh.on{transform:translateY(0);}
.lsh-in{max-width:520px;margin:0 auto;display:flex;flex-direction:column;align-items:stretch;gap:14px;}
.lsh-tx{min-width:0;text-align:center;}
.lsh-eb{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.75;}
.lsh-eb::before{content:'';width:9px;height:9px;border-radius:50%;background:var(--sp-g,var(--stg-acc,#b1e5fd));box-shadow:inset 0 0 0 1.5px currentColor;}
.lsh-v{font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-top:4px;}
.lsh-d{font-size:13px;font-weight:700;opacity:.8;margin-top:3px;font-variant-numeric:tabular-nums;}
.lsh-acts{display:flex;gap:8px;align-items:center;}
.lsh-re,.lsh-card{flex:1;min-width:0;height:52px;box-sizing:border-box;border-radius:999px;border:2px solid var(--stg-ink,#08222e);
  font:inherit;font-size:16px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap;}
.lsh-re{background:var(--stg-ink,#08222e);color:var(--stg-ground,#ffffff);}
.lsh-card{background:transparent;color:var(--stg-ink,#08222e);}
.lsh-re:focus-visible,.lsh-card:focus-visible{outline:2px solid var(--stg-ink,#08222e);outline-offset:3px;}
.lsh-sub{max-width:520px;margin:10px auto 0;text-align:center;font-size:12px;font-weight:700;opacity:.75;line-height:1.4;}
@media (prefers-reduced-motion: reduce){.lsh{transition:none;}}
`;
