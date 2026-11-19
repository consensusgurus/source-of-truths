'use client';

import { useEffect, useRef } from 'react';
import { MURAL_CSS, MURAL_HTML } from './markup';
import { bootMural } from './engine';
import { MURAL_KINDS } from '@/lib/mural-shared';

// Mural and MuralToo share this client; `kind` picks which one. React mounts
// the static markup once and hands the node to the board engine, which owns
// everything inside it from then on (see engine.js).
export default function MuralClient({ kind }) {
  const K = MURAL_KINDS[kind] || MURAL_KINDS.mural;
  const NAME = K.name;
  const opens = kind === 'muraltoo' ? 'midnight Eastern' : 'noon Eastern';
  const span = kind === 'muraltoo' ? 'until the next midnight' : 'for 24 hours';
  const other = kind === 'muraltoo' ? 'Mural' : 'MuralToo';
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    // ?solo=<mural id> is the Puzzle Shelf's link to a finished mural.
    let solo = null;
    try { solo = new URLSearchParams(window.location.search).get('solo'); } catch (e) { solo = null; }
    return bootMural(ref.current, { kind, solo });
  }, [kind]);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MURAL_CSS }} />
      {/* Crawlable prose, BEFORE the board: the board's markup is raw HTML, and a
          sibling after it failed hydration (2026-11-19). The board below is a fixed full-screen layer drawn over it, so a
          player never sees this; a search engine and a reader without scripts do. */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h2>About {NAME}</h2>
        <p>{NAME} is a free daily online jigsaw puzzle with 10,000 pieces, 125 across and 80 down, cut from one real photograph. Everyone on Mind Loft builds the same one at the same time. Your tray holds a random handful of pieces: drag one to its spot, or tap the piece and then the spot. A wrong drop costs nothing.</p>
        <p>Every piece you place scores points. Corners and edges are worth the least, detailed pieces more, and plain sky or water the most, because they are the hardest to place. A piece nobody on the site has placed yet is worth double, and its value creeps up the longer it goes unclaimed. The shared picture updates itself every two minutes, with no clock and no Give up.</p>
        <p>A new {NAME} opens every day at {opens} and runs {span}. Its twin, {other}, runs on the opposite half of the day, so there is always a mural open. The points you earn count toward your Mind Loft total for the day you earn them.</p>
      </section>
      <div ref={ref} className="mrl app" data-theme="light" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MURAL_HTML }} />
    </>
  );
}
