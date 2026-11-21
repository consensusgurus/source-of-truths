'use client';

import { useEffect, useRef } from 'react';
import { MURAL_CSS, MURAL_HTML } from '../../mural/markup';
import { bootMural } from '../../mural/engine';
import { MEMORIAL_CSS } from '../../mural/memorial';

// The free-play jigsaw board (/jig/big, owner 2026-11-21): one past Jig or Saw
// photo at the size picked on the jigsaw portal, played on the Mural board
// (app/mural/engine.js, photo mode). React mounts the markup once and the
// engine owns everything inside it.
export default function BigClient({ photo }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    return bootMural(ref.current, { kind: 'mural', photo });
  }, [photo]);
  const n = (photo.cols * photo.rows).toLocaleString('en-US');
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MURAL_CSS + MEMORIAL_CSS }} />
      {/* Crawlable prose before the board, as on Mural (a sibling after the raw board markup fails hydration). */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h1>{photo.name}: a {n} piece jigsaw puzzle</h1>
        <p>A free online jigsaw puzzle of {photo.name}, cut into {n} pieces ({photo.cols} across, {photo.rows} down). Drag a piece from the tray onto its spot, or tap the piece and then the spot. Nothing is scored, there is no clock, and your progress is kept in this browser.</p>
        <p>Photo: {photo.by}, {photo.lic}, Wikimedia Commons. Pick another picture or size on the <a href="/jig/shelf">jigsaw puzzles</a> page.</p>
      </section>
      <div ref={ref} className="mrl app" data-theme="light" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MURAL_HTML }} />
    </>
  );
}
