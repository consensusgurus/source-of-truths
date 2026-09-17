'use client';

import React, { useMemo, useState } from 'react';
import { T } from '@/lib/theme';

// Two-column matching board (the `pairs` quiz format). The LEFT column holds the
// clues (the prompt you pick first); the RIGHT column holds the answers, listed
// ALPHABETICALLY. Optionally the left column is alphabetised too (sortLeft) when
// that helps scanning (novels, companies); otherwise it is shuffled (slogans,
// quotes). Pick a clue, then its answer. A wrong answer is struck through and
// locked for good — and because every wrong pick buries one answer, the final
// matched count is exactly (total − errors) at a natural end, so "score =
// matched" ranks fewest errors first. The board owns its interaction state and
// reports up to QuizClient via callbacks, mirroring how MapQuizBoard reports picks.

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  forest: T.success,
  faded: T.muted,
};
// Distinct column tints so the two sides read as separate at a glance: the
// clues (prompt) sit on a warm parchment panel with an ember accent, the
// answers on a cool sage panel with a forest accent.
const LEFT_PANEL = '#efe6d2';
const RIGHT_PANEL = '#e5ece0';
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

export default function MatchQuizBoard({ pairs, started, ended, revealed, onMatch, onError, onEnd, onHint, leftLabel, rightLabel, sortLeft, mobile = false }) {
  // index i is the canonical pair id: pairs[i] === [answer, clue].
  // Left column = clues (pairs[i][1]); right column = answers (pairs[i][0]).
  const leftOrder = useMemo(
    () =>
      sortLeft
        ? pairs.map((_, i) => i).sort((a, b) => pairs[a][1].localeCompare(pairs[b][1]))
        : shuffle(pairs.map((_, i) => i)),
    [pairs, sortLeft]
  );
  // Answers (right column) are ALWAYS listed alphabetically — true for every
  // `pairs` matching game, so the answers read as a clean reference column.
  const rightOrder = useMemo(
    () => pairs.map((_, i) => i).sort((a, b) => pairs[a][0].localeCompare(pairs[b][0])),
    [pairs]
  );
  const [sel, setSel] = useState(null); // selected clue pair id (left), or null
  const [matched, setMatched] = useState(() => new Set()); // matched pair ids
  const [dead, setDead] = useState(() => new Set()); // answers (right) struck out
  const [errors, setErrors] = useState(0);
  const [tray, setTray] = useState([]); // [{ clue, answer }]

  const live = started && !ended;
  const lLabel = leftLabel || 'Slogans';
  const rLabel = rightLabel || 'Companies';

  function hasMovesLeft(matchedSet, deadSet) {
    for (let i = 0; i < pairs.length; i++) {
      if (!matchedSet.has(i) && !deadSet.has(i)) return true;
    }
    return false;
  }

  function clickClue(i) {
    if (!live || matched.has(i)) return;
    setSel(i);
    if (onHint) onHint(`Now pick the match for “${pairs[i][1]}”.`, false);
  }

  function clickAnswer(j) {
    if (!live || dead.has(j) || matched.has(j)) return;
    if (sel == null) {
      if (onHint) onHint('Pick from the left column first.', true);
      return;
    }
    if (sel === j) {
      const nm = new Set(matched);
      nm.add(j);
      setMatched(nm);
      setTray((t) => [...t, { clue: pairs[j][1], answer: pairs[j][0] }]);
      setSel(null);
      if (onMatch) onMatch(j, nm.size, pairs[j][0], pairs[j][1]);
      if (nm.size === pairs.length && onEnd) onEnd(true, nm.size);
    } else {
      const nd = new Set(dead);
      nd.add(j);
      setDead(nd);
      const ne = errors + 1;
      setErrors(ne);
      setSel(null);
      if (onError) onError(ne, pairs[j][0]);
      if (!hasMovesLeft(matched, nd) && onEnd) onEnd(false, matched.size);
    }
  }

  const cellBase = {
    display: 'block',
    textAlign: 'left',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: SANS,
    fontSize: 13.5,
    lineHeight: 1.3,
    padding: '8px 11px',
    marginBottom: 6,
    // Lets each option flow inside a balanced CSS multi-column without a box
    // ever splitting across the gap.
    breakInside: 'avoid',
    WebkitColumnBreakInside: 'avoid',
    background: `var(--stg-surf,#fffdf8)`,
    borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`,
    color: `var(--stg-ink,${COLORS.ink})`,
    borderRadius: 0,
    transition: 'all .12s',
    cursor: live ? 'pointer' : 'default',
  };

  const colHead = {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginBottom: 8,
  };
  const panel = {
    borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}44)`,
    padding: '10px 10px 12px',
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .mqb-cols { column-count: 2; column-gap: 6px; }
        @media (max-width: 600px) { .mqb-cols { column-count: 1; } }
      ` }} />
      {tray.length > 0 && (
        <div style={{ marginBottom: 16, background: `var(--stg-surf,#fffdf8)`, borderRadius: 10, border: `1px solid ${COLORS.forest}66`, padding: '12px 14px' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: COLORS.forest, marginBottom: 8 }}>
            Matched · {tray.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {tray.map((m, k) => (
              <div key={k} style={{ fontFamily: SANS, fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ color: COLORS.forest, fontWeight: 700 }}>&#10003;</span>
                <span style={{ fontStyle: 'italic', color: 'var(--stg-ink2,#4a4339)' }}>&ldquo;{m.clue}&rdquo;</span>
                <span style={{ color: `var(--stg-mute,${COLORS.faded})` }}>&rarr;</span>
                <span style={{ fontWeight: 700 }}>{m.answer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ ...panel, background: LEFT_PANEL, borderTop: `3px solid ${COLORS.ember}` }}>
          <div style={{ ...colHead, color: `var(--stg-acc-ink,${COLORS.ember})` }}>{lLabel}{sortLeft ? ' (A–Z)' : ''}</div>
          <div className="mqb-cols">
            {leftOrder.map((i) => {
              if (matched.has(i)) return null;
              const isSel = sel === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => clickClue(i)}
                  disabled={!live}
                  style={{
                    ...cellBase,
                    borderColor: isSel ? COLORS.ember : `${COLORS.faded}55`,
                    boxShadow: isSel ? `inset 0 0 0 1px ${COLORS.ember}` : 'none',
                    fontStyle: 'italic',
                  }}
                >
                  {pairs[i][1]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ ...panel, background: RIGHT_PANEL, borderTop: `3px solid ${COLORS.forest}` }}>
          <div style={{ ...colHead, color: COLORS.forest }}>{rLabel} (A–Z)</div>
          <div className="mqb-cols">
            {rightOrder.map((j) => {
              if (matched.has(j)) return null;
              const isDead = dead.has(j);
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => clickAnswer(j)}
                  disabled={!live || isDead}
                  style={{
                    ...cellBase,
                    fontWeight: 500,
                    textDecoration: isDead ? 'line-through' : 'none',
                    color: isDead ? `var(--stg-mute,${COLORS.faded})` : `var(--stg-ink,${COLORS.ink})`,
                    opacity: isDead ? 0.5 : 1,
                    background: isDead ? `var(--stg-surf2,${COLORS.paper})` : `var(--stg-surf,${T.paper})`,
                    cursor: isDead || !live ? 'default' : 'pointer',
                  }}
                >
                  {pairs[j][0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
