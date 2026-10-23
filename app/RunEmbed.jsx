'use client';

// RUN EMBED (owner, 2026-10-08, for the Judged run). A daily client that
// is mounted INSIDE a one-page run reads this context and:
//   - drops its own page furniture (the cap, the finish card, the about
//     prose, the report row, the join form), so the run page owns the frame;
//   - forces the dark stage register, so it sits on the run's Midnight ground,
//     unless the run passes theme='light' (the Dojo's board switch, owner
//     2026-10-13). The client then also stamps data-stage-pin, which lets the
//     light token block in globals.css apply without the boot-stamp guard:
//     an embedded client is never server-rendered, so its register is a
//     choice rather than a first-paint guess;
//   - tells the run when it has filed its result, through onResult.
// Everything else is the game exactly as it plays on its own page: the same
// start gate, the same save, the same /api/quiz/result row. Outside a run the
// context is null and nothing about the client changes.
//
// onResult is deferred a tick on purpose: some clients file their result from
// inside a state updater, and setting the parent's state from there is a
// render-phase update React warns about.
//
// THE BOARD'S OWN FINISH BEAT PLAYS HERE (owner, 2026-10-20). On its own page a
// daily ends with its beat (lib/finish-beat.js), played by LoftFinish. An
// embedded client drops LoftFinish, so inside a run the board used to sit
// still and then get swapped out. RunEmbed now plays the same beat (the loss
// beat when the board was not solved) over the embedded board the moment the
// result lands, and hands its length to the run as res.beatMs, so the run
// holds the board at least that long before moving on. Never the full-screen
// finale: the run owns the frame.

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { playBeat, playLoss } from '@/lib/finish-beat';

const RunEmbedContext = createContext(null);

export function useRunEmbed() {
  return useContext(RunEmbedContext);
}

// HOW TO PLAY FROM THE RUN (owner, 2026-10-20). An embedded client drops its
// cap, and the cap's ? was the only way back to the rules once a grid had
// started. The run page draws its own How to play button and bumps `help`;
// each embedded client opens its own rules modal through this hook. A fresh
// mount does not open it (it only answers a bump made after mounting).
export function useRunHelp(embed, open) {
  const seq = embed ? embed.help || 0 : 0;
  const seen = useRef(seq);
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    if (seq && seq !== seen.current) { seen.current = seq; try { openRef.current && openRef.current(); } catch (e) {} }
  }, [seq]);
}

const FULL_ONLY = new Set(['emcee', 'encore', 'anon']);

// Returns the beat's handle (or null). The caller owns it: the beat's overlays
// sit on document.body, so they must go the moment this embed leaves the page,
// or they float over whatever the run shows next (owner, 2026-10-20: it
// overlapped the next puzzle's start page).
function playRunBeat(host, res) {
  if (!host || !res || !res.key) return null;
  try {
    const root = host.querySelector('.stage-page') || host;
    // A solve is any credit, since most dailies grade a solve below full marks
    // (Glyph docks a point a check) and post 0 for a give-up. The crosswords
    // score squares or words filled, so a give-up still carries credit there:
    // only a full board counts as solved. A client may pass `won` outright.
    const won = typeof res.won === 'boolean' ? res.won
      : (FULL_ONLY.has(res.key) ? res.score >= res.total : res.score > 0);
    const h = won ? playBeat(res.key, { root }) : playLoss(res.key, { root });
    return h;
  } catch (e) { return null; }
}

export default function RunEmbed({ onResult, theme, help = 0, children }) {
  const hostRef = useRef(null);
  const beatRef = useRef(null);
  const stopBeat = () => {
    const h = beatRef.current;
    beatRef.current = null;
    if (h) { try { h.cancel(); } catch (e) {} }
  };
  // Leaving the page (the run swaps in its between card or the next puzzle)
  // clears the beat at once.
  useEffect(() => stopBeat, []);
  // So does a new puzzle mounted into this same embed (the run swaps the
  // child's key rather than the embed).
  const childKey = React.isValidElement(children) ? children.key : null;
  useEffect(() => { stopBeat(); }, [childKey]);
  const value = useMemo(() => ({
    theme: theme === 'light' ? 'light' : 'dark',
    help,
    onResult: (res) => {
      setTimeout(() => {
        stopBeat();
        const h = playRunBeat(hostRef.current, res);
        const beatMs = h ? Math.max(0, h.ms || 0) : 0;
        if (h) {
          beatRef.current = h;
          // A run that keeps the board up (Judged, Room) clears it once played.
          setTimeout(() => { if (beatRef.current === h) stopBeat(); }, beatMs + 400);
        }
        try { onResult && onResult(res ? { ...res, beatMs } : res); } catch (e) {}
      }, 0);
    },
  }), [onResult, theme, help]);
  return (
    <RunEmbedContext.Provider value={value}>
      <div ref={hostRef} style={{ display: 'contents' }}>{children}</div>
    </RunEmbedContext.Provider>
  );
}
