'use client';

import { useEffect, useRef } from 'react';
import { MURAL_CSS, MURAL_HTML } from '../mural/markup';
import { bootMural } from '../mural/engine';
import { MEMORIAL_CSS } from '../mural/memorial';

// A player's own photo as a jigsaw (YOUR PHOTO JIGSAWS, owner 2026-11-27), on the Mural board in
// PHOTO MODE like /jig/big: built alone, nothing scored, pieces kept in this browser. `photo.src`
// points the engine at /api/photo-puzzles/img instead of a Jig or Saw bank row.
export default function PhotoBoard({ photo }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    return bootMural(ref.current, { kind: 'mural', photo });
  }, [photo]);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MURAL_CSS + MEMORIAL_CSS }} />
      <div ref={ref} className="mrl app" data-theme="light" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MURAL_HTML }} />
    </>
  );
}
