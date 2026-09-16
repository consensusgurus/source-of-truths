'use client';

// A NUMBER THAT ROLLS, NOT ONE THAT SWAPS (owner, 2026-09-16, motion pass).
//
// Every figure on the stage used to change by replacement: the old string
// unmounted and the new one appeared, which reads as a label being corrected
// rather than a count moving. This renders each DIGIT as a column of 0 to 9
// inside a one-line-high clip and slides the column to the digit it should
// show, so a change from 47 to 48 rolls the last digit up one step and a change
// from 9 to 10 rolls both. Everything that is not a digit (a plus, a hash, a
// slash, a colon) renders as plain text, so "+62", "#37" and "3/5" all work.
//
// THREE RULES, all learned on the arrival curtain and the home:
//   - It is a CSS transition on a transform, so a hidden tab holds the final
//     value rather than a blank: the column is positioned by inline style at
//     the digit it should show, and the transition is only the way it gets
//     there. Nothing here ever sits at opacity 0.
//   - `from` lets a caller land a figure by rolling UP to it on mount (the cap
//     counts up to the day's IQ on arrival). It is applied through a timeout,
//     never a requestAnimationFrame, because a throttled or hidden frame does
//     not run rAF and the figure would stick at `from`. The timeout is also
//     the backstop: whatever else happens, the real value is set.
//   - A figure whose LENGTH changes re-keys its digits, so a new leading digit
//     appears rather than rolling from nothing. That is the honest rendering
//     of 9 becoming 10: there was no digit there to roll.
//
// The look lives in app/globals.css under .rln so every surface that rolls a
// number shares one stylesheet, and prefers-reduced-motion turns the slide off
// there in one place.
import React, { useEffect, useState } from 'react';

const DIGITS = '0123456789';

export default function RollNum({ value, from = null, className = '', delay = 40 }) {
  const target = value === null || value === undefined ? '' : String(value);
  // A `from` is padded to the target's width so every column exists from the
  // first frame and rolls, rather than re-keying at the length change.
  const [shown, setShown] = useState(from === null || from === undefined
    ? target
    : String(from).padStart(target.length, '0'));
  useEffect(() => {
    if (shown === target) return undefined;
    const t = setTimeout(() => setShown(target), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  // The column count comes from the value being SHOWN, so a length change
  // re-keys rather than stretches; the aria-label carries the real figure.
  const chars = shown.split('');
  return (
    <span className={'rln' + (className ? ' ' + className : '')} aria-label={target}>
      {chars.map((ch, i) => (/\d/.test(ch) ? (
        <span key={chars.length + ':' + i} className="rln-d" aria-hidden="true">
          <span className="rln-c" style={{ transform: 'translateY(-' + Number(ch) + 'em)' }}>
            {/* Plain spans, never <i> or <b>: the figure strips these sit in
                style <i> as a label and <b> as a figure, and a nested one
                would inherit the label size. */}
            {DIGITS.split('').map((d) => <span key={d} className="rln-i">{d}</span>)}
          </span>
        </span>
      ) : (
        <span key={chars.length + ':' + i} aria-hidden="true">{ch}</span>
      )))}
    </span>
  );
}
