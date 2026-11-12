'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { T } from '@/lib/theme';
import { useStageTheme } from '@/lib/stage-theme';

// Fullscreen live-play popup for mobile quiz play.
//
// When `open`, the play surface (HUD + answer board) is rendered as a fixed,
// app-like overlay portaled to document.body. When NOT open (desktop, or before
// Play is pressed), it renders its children inline exactly as before, so the page
// layout is untouched. There is intentionally NO close control: a game is left
// only by finishing it or letting the timer expire (owner ruling).
//
// The overlay TRACKS THE VISUAL VIEWPORT (top/left/size follow
// window.visualViewport) so that when the on-screen keyboard opens, the overlay
// is exactly the visible area ABOVE the keyboard. This is what makes the whole
// board scrollable to the very top: with a plain `inset:0` overlay, iOS scrolls
// the page underneath the position:fixed overlay when an input is focused, which
// strands the top rows above the visible area with no way to scroll back. Pinning
// the overlay to the visual viewport removes that, and keeps a bottom-docked input
// (position:fixed, bottom:kbInset) aligned to the top of the keyboard.

// ⚠️ THE STAGE DOES NOT REACH THROUGH A PORTAL, AND THIS IS WHERE THAT BITES.
//
// Every --stg-* token is defined ON .stage-page. This overlay is portaled to
// document.body, so it is a SIBLING of the page rather than a descendant, and
// inside it not one of those custom properties resolves. That does not fail
// loudly -- var(--stg-x, <original>) simply falls back, so the board paints in
// its old cream palette while the ink the client computed for it resolves to
// var(--stg-ink,#e9edf4), a near-WHITE fallback, on a near-white sheet.
//
// This is the whole mobile play surface for nine of the twelve quiz clients,
// and it is the ONE state a desktop review never sees: it exists only on a
// phone, only after Play is pressed. Looking at the page at rest cannot find
// it, a residue count cannot find it, and it is invisible in the diff.
//
// The fix is to carry the token bag across the portal, and .stage-page is
// exactly that and nothing else -- app/globals.css declares custom properties
// on it and not one ordinary property, so putting the class on a fixed overlay
// changes no layout and inherits the register wholesale. The register itself
// still has to be stamped here: data-stage-theme is what selects the light set,
// and an ancestor's attribute cannot be seen from outside its subtree either.
export default function QuizPlayOverlay({ open, background = T.surface, stage = false, vars = null, children }) {
  const [vp, setVp] = useState(null); // { top, left, width, height } from visualViewport
  // Called unconditionally, above every early return: this component returns
  // its children untouched when it is closed, and a hook behind that branch
  // would change the hook order between a closed and an open overlay.
  const [stageTheme] = useStageTheme();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const update = () => {
      // Height MUST be the VISUAL viewport height (area above the keyboard), not
      // the full layout height: window.innerHeight stays full when the on-screen
      // keyboard opens (iOS), so innerHeight-based sizing left the overlay bottom
      // (and the last ~1/3 of a long answer list) stranded BEHIND the keyboard,
      // unreachable at max scroll. vv.height is exactly the visible band, so the
      // internal scroll can bring every row up above the keyboard + bottom-docked input.
      if (vv) setVp({ top: vv.offsetTop, left: vv.offsetLeft, width: vv.width, height: vv.height });
    };
    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    return () => {
      document.body.style.overflow = prev;
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
    };
  }, [open]);

  if (!open) return <>{children}</>;
  if (typeof document === 'undefined') return <>{children}</>;

  // Pin to the visual viewport when we have it; otherwise fall back to the full
  // layout viewport.
  const pos = vp
    ? { top: vp.top, left: vp.left, width: vp.width, height: vp.height }
    : { inset: 0 };

  const overlay = (
    <div
      className={stage ? 'stage-page qz-stage' : undefined}
      data-stage-theme={stage ? stageTheme : undefined}
      style={{
        ...(stage && vars ? vars : null),
        position: 'fixed',
        ...pos,
        zIndex: 60,
        // The caller's own background still wins where it passes one; nobody
        // does today, so the default is what every mobile player actually sees.
        background: stage ? 'var(--stg-ground)' : background,
        color: stage ? 'var(--stg-ink)' : T.ink,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        padding: 'calc(12px + env(safe-area-inset-top)) calc(14px + env(safe-area-inset-right)) 0 calc(14px + env(safe-area-inset-left))',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );

  return createPortal(overlay, document.body);
}
