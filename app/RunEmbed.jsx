'use client';

// RUN EMBED (owner, 2026-10-08, for the Lawyering run). A daily client that
// is mounted INSIDE a one-page run reads this context and:
//   - drops its own page furniture (the cap, the finish card, the about
//     prose, the report row, the join form), so the run page owns the frame;
//   - forces the dark stage register, so it sits on the run's Midnight ground;
//   - tells the run when it has filed its result, through onResult.
// Everything else is the game exactly as it plays on its own page: the same
// start gate, the same save, the same /api/quiz/result row. Outside a run the
// context is null and nothing about the client changes.
//
// onResult is deferred a tick on purpose: some clients file their result from
// inside a state updater, and setting the parent's state from there is a
// render-phase update React warns about.

import React, { createContext, useContext, useMemo } from 'react';

const RunEmbedContext = createContext(null);

export function useRunEmbed() {
  return useContext(RunEmbedContext);
}

export default function RunEmbed({ onResult, children }) {
  const value = useMemo(() => ({
    onResult: (res) => { setTimeout(() => { try { onResult && onResult(res); } catch (e) {} }, 0); },
  }), [onResult]);
  return <RunEmbedContext.Provider value={value}>{children}</RunEmbedContext.Provider>;
}
