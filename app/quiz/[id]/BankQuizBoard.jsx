'use client';

import React, { useMemo, useState } from 'react';
import ClueBox from './ClueBox';
import { T } from '@/lib/theme';

// Single-bank matching board (`format: 'bank'`). ONE prompt (the clue, e.g. a
// company) shows at a time with a Next button to cycle through the prompts not
// yet matched; below sits ONE bank of answer tiles (e.g. headquarters cities),
// alphabetical. GUESS-BUDGET model (same as the map quiz): you start with one
// guess per item. Every tap, right OR wrong, spends one guess. A correct tile
// turns green and is removed; a wrong tap just costs a guess, NOTHING is removed
// or revealed, and the missed prompt keeps looping so you can try it again later
// (at the cost of another guess). The game ends when you run out of guesses,
// match everything, or the clock runs out. Next skips the current prompt without
// spending a guess. Score = number of tiles matched. Reports up to QuizClient
// like the other boards.
//
// MANY-TO-MANY MATCHING. A tile counts as a correct answer for the current
// prompt when it shares the prompt (book-characters: three characters that all
// belong to one book) OR shows the same answer VALUE (companies-to-headquarters:
// several companies share a city, so the bank can list "Houston, Texas" on more
// than one tile and ANY Houston tile is correct for ANY Houston company). A
// prompt string is complete once it has been answered as many times as it
// appears in the data (`required`): three taps for a 3-character book, one tap
// for a single company. For a 1-to-1 quiz (capitals, taglines) both relations
// reduce to the exact tile, so behaviour is unchanged.

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  forest: T.success,
  faded: T.muted,
};
const MONO = "'Manrope', system-ui, -apple-system, sans-serif";
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BankQuizBoard({ pairs, started, ended, revealed, onMatch, onWrong, onEnd, onHint, promptLabel, bankLabel, stickyTop = 150, mobile = false }) {
  // pairs[i] === [answer, prompt]: answer = the tile (e.g. headquarters city),
  // prompt = the clue shown one at a time (e.g. company).
  const total = pairs.length;
  const promptOrder = useMemo(() => shuffle(pairs.map((_, i) => i)), [pairs]);
  const bankOrder = useMemo(
    () => pairs.map((_, i) => i).sort((a, b) => pairs[a][0].localeCompare(pairs[b][0])),
    [pairs]
  );
  // How many tiles each PROMPT string needs before it is complete (book: 3 per
  // book; companies: 1 per company).
  const required = useMemo(() => {
    const m = {};
    for (let i = 0; i < pairs.length; i++) m[pairs[i][1]] = (m[pairs[i][1]] || 0) + 1;
    return m;
  }, [pairs]);

  const [matched, setMatched] = useState(() => new Set()); // tile ids consumed (green). score = size
  const [donePrompts, setDonePrompts] = useState(() => new Set()); // completed prompt STRINGS
  const [hits, setHits] = useState(() => ({})); // prompt string -> correct taps so far
  const [errors, setErrors] = useState(0); // wrong taps
  const [cur, setCur] = useState(() => (promptOrder.length ? promptOrder[0] : null));
  const [flash, setFlash] = useState(null); // { key, ok }

  const live = started && !ended;
  const dock = mobile && live;
  const barStyle = dock
    ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, background: live ? COLORS.ink : `var(--stg-surf2,${COLORS.paper})`, color: live ? COLORS.cream : `var(--stg-mute,${COLORS.faded})`, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', minHeight: 30, boxShadow: '0 -6px 18px rgba(20,22,28,0.10)' }
    : { position: 'sticky', top: stickyTop, zIndex: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, background: live ? COLORS.ink : `var(--stg-surf2,${COLORS.paper})`, color: live ? COLORS.cream : `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '14px 16px', marginBottom: 10, minHeight: 30 };
  const guessesLeft = total - matched.size - errors;
  const remaining = total - matched.size;

  // A tile k is a correct answer for prompt pair c when it belongs to the same
  // prompt OR carries the same answer value. (For unique data this is just k===c.)
  function isAnswer(k, c) {
    return pairs[k][1] === pairs[c][1] || pairs[k][0] === pairs[c][0];
  }

  // First prompt pair (in promptOrder, after `fromPair`, wrapping) whose prompt
  // string is not yet complete. null when every prompt is done.
  function nextPrompt(fromPair, doneSet) {
    if (!promptOrder.length) return null;
    const start = promptOrder.indexOf(fromPair);
    for (let s = 1; s <= promptOrder.length; s++) {
      const p = promptOrder[(start + s) % promptOrder.length];
      if (!doneSet.has(pairs[p][1])) return p;
    }
    return null;
  }
  // Like nextPrompt but prefers a DIFFERENT prompt string (used by Skip).
  function nextDifferentPrompt(fromPair, doneSet) {
    if (!promptOrder.length) return null;
    const fromPrompt = pairs[fromPair][1];
    const start = promptOrder.indexOf(fromPair);
    for (let s = 1; s <= promptOrder.length; s++) {
      const p = promptOrder[(start + s) % promptOrder.length];
      if (!doneSet.has(pairs[p][1]) && pairs[p][1] !== fromPrompt) return p;
    }
    return nextPrompt(fromPair, doneSet);
  }
  // Like nextDifferentPrompt but walking BACKWARD (used by Back).
  function prevDifferentPrompt(fromPair, doneSet) {
    if (!promptOrder.length) return null;
    const fromPrompt = pairs[fromPair][1];
    const L = promptOrder.length;
    const start = promptOrder.indexOf(fromPair);
    for (let s = 1; s <= L; s++) {
      const p = promptOrder[((start - s) % L + L) % L];
      if (!doneSet.has(pairs[p][1]) && pairs[p][1] !== fromPrompt) return p;
    }
    for (let s = 1; s <= L; s++) {
      const p = promptOrder[((start - s) % L + L) % L];
      if (!doneSet.has(pairs[p][1])) return p;
    }
    return null;
  }
  // A still-unmatched tile that belongs to prompt string `ps`, to keep showing
  // while a multi-tile prompt (book) still has tiles left. Falls back to cur.
  function sameUnmatchedTile(ps, matchedSet, fallback) {
    const p = promptOrder.find((q) => !matchedSet.has(q) && pairs[q][1] === ps);
    return p != null ? p : fallback;
  }

  function flashTile(key, ok) {
    setFlash({ key, ok });
    setTimeout(() => setFlash((f) => (f && f.key === key ? null : f)), 480);
  }

  function clickTile(k) {
    if (!live || cur == null || matched.has(k)) return;
    const ps = pairs[cur][1]; // current prompt string
    if (isAnswer(k, cur)) {
      const nm = new Set(matched);
      nm.add(k);
      const nh = { ...hits, [ps]: (hits[ps] || 0) + 1 };
      const promptComplete = nh[ps] >= (required[ps] || 1);
      const nd = new Set(donePrompts);
      if (promptComplete) nd.add(ps);
      const used = nm.size + errors;
      setMatched(nm);
      setHits(nh);
      if (promptComplete) setDonePrompts(nd);
      flashTile(k, true);
      if (onMatch) onMatch(k, nm.size, pairs[k][0], ps);
      const np = nextPrompt(cur, nd);
      if (used >= total || np == null) {
        setCur(null);
        if (onEnd) onEnd(np == null, nm.size);
      } else {
        // keep the same prompt up while it still owes tiles (multi-tile book),
        // otherwise move on to the next unfinished prompt.
        setCur(promptComplete ? np : sameUnmatchedTile(ps, nm, cur));
      }
    } else {
      const ne = errors + 1;
      const used = matched.size + ne;
      setErrors(ne);
      flashTile(k, false);
      if (onWrong) onWrong(ne, ps);
      if (used >= total) {
        setCur(null);
        if (onEnd) onEnd(false, matched.size);
      } else {
        setCur(nextPrompt(cur, donePrompts));
      }
    }
  }

  function skip() {
    if (!live || cur == null) return;
    const np = nextDifferentPrompt(cur, donePrompts);
    if (np != null && pairs[np][1] !== pairs[cur][1]) { setCur(np); if (onHint) onHint(`Next up: ${pairs[np][1]}.`, false); }
    else if (onHint) onHint('That is the only one left, take your shot.', false);
  }
  function back() {
    if (!live || cur == null) return;
    const np = prevDifferentPrompt(cur, donePrompts);
    if (np != null && pairs[np][1] !== pairs[cur][1]) { setCur(np); if (onHint) onHint(`Back to: ${pairs[np][1]}.`, false); }
    else if (onHint) onHint('That is the only one left, take your shot.', false);
  }

  return (
    <div>
      <div style={barStyle}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, flex: 'none' }}>{promptLabel || 'Prompt'}</span>
        {(() => { const clueText = !started ? 'Press Play to start' : (ended ? 'Game over' : (cur != null ? pairs[cur][1] : 'All done')); return (<ClueBox current={clueText} clues={pairs.map((p) => p[1])} align="left" style={{ flex: '1 1 320px', minWidth: 0 }} textStyle={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(20px, 3.4vw, 28px)', lineHeight: 1.15, overflowWrap: 'break-word' }} />); })()}
        {live && cur != null && (
          <button onClick={back} title="Go back to the previous prompt." style={{ marginLeft: 'auto', flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '9px 16px', background: 'transparent', color: COLORS.cream, border: '1px solid rgba(244,237,224,0.4)', cursor: 'pointer' }}>&larr; Back</button>
        )}
        {live && cur != null && (
          <button onClick={skip} title="Skip to the next prompt without spending a guess, you can come back." style={{ flex: 'none', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, padding: '9px 16px', background: 'transparent', color: COLORS.cream, border: '1px solid rgba(244,237,224,0.4)', cursor: 'pointer' }}>Skip &rarr;</button>
        )}
      </div>

      {!ended && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', background: `var(--stg-surf2,${COLORS.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '16px 14px' }}>
        {bankOrder.map((k) => {
          const isMatched = matched.has(k);
          const isFlash = flash && flash.key === k;
          let bg = `var(--stg-surf,#fffdf8)`;
          let fg = `var(--stg-ink,${COLORS.ink})`;
          if (isMatched) { bg = COLORS.forest; fg = COLORS.cream; }
          else if (isFlash) { bg = flash.ok ? COLORS.forest : COLORS.ember; fg = COLORS.cream; }
          return (
            <button
              key={k}
              type="button"
              disabled={!live || isMatched}
              onClick={() => clickTile(k)}
              style={{ fontFamily: SANS, fontSize: 13.5, padding: '9px 13px', background: bg, color: fg, borderRadius: 10, border: `1px solid ${isMatched ? COLORS.forest : COLORS.faded + '66'}`, borderRadius: 0, cursor: live && !isMatched ? 'pointer' : 'default', transition: 'all .12s', fontWeight: 500 }}
            >
              {pairs[k][0]}
            </button>
          );
        })}
      </div>
      )}
      {ended && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8, marginTop: 4 }}>
          {pairs.map((p, i) => {
            const got = donePrompts.has(p[1]);
            return (
              <div key={i} style={{ borderRadius: 10, border: `1px solid ${got ? `var(--stg-good,${COLORS.forest})` : `var(--stg-line,${COLORS.faded + '55'})`}`, background: got ? `var(--stg-surf2,#e8efdd)` : `var(--stg-surf,#fbf7ef)`, padding: '8px 11px', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p[1]}</span>
                <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 16, lineHeight: 1.15, color: got ? COLORS.forest : (revealed ? COLORS.rust : `var(--stg-mute,${COLORS.faded})`) }}>{got ? '\u2713 ' + p[0] : (revealed ? p[0] : '\u2022 \u2022 \u2022')}</span>
              </div>
            );
          })}
        </div>
      )}
      {dock && <div aria-hidden="true" style={{ height: 'calc(110px + env(safe-area-inset-bottom))' }} />}
    </div>
  );
}
