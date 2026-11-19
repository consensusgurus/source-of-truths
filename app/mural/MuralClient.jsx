'use client';

import { useEffect, useRef } from 'react';
import { MURAL_CSS, MURAL_HTML } from './markup';
import { bootMural } from './engine';

// Mural and MuralToo share this client; `kind` picks which one. React mounts
// the static markup once and hands the node to the board engine, which owns
// everything inside it from then on (see engine.js).
export default function MuralClient({ kind }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    return bootMural(ref.current, { kind });
  }, [kind]);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MURAL_CSS }} />
      <div ref={ref} className="mrl app" data-theme="light" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MURAL_HTML }} />
    </>
  );
}
