'use client';

// POLYMATH ON THE HOME (owner, 2026-10-19): one card in the Runs pane, in the
// same shape as every run card (.sty-rbig, styled by StageToday). Its state is
// read off this device's three gauntlet saves, so it costs no request: not
// started, in progress (which run is next), or today's title.
import { useEffect, useState } from 'react';
import { POLY_LEGS, localPolymath } from '@/lib/polymath';

export default function PolymathRunCard({ style, hueFor, href = '/polymath' }) {
  const [poly, setPoly] = useState(null);
  useEffect(() => { setPoly(localPolymath()); }, []);
  const done = poly ? poly.done : 0;
  const t = poly ? poly.tier : null;
  const next = poly ? poly.legs.find((l) => l.state !== 'done') : null;
  const nextLeg = next ? POLY_LEGS.find((l) => l.id === next.id) : null;
  const line = t
    ? `${t.name} today, ${poly.score}.${t.next ? ` ${t.toNext} to ${t.next.name}.` : ''}`
    : done
      ? `${done} of 3 played.${nextLeg ? ` ${nextLeg.short} next.` : ''}`
      : 'Trivia, Math and English Gauntlets. One title for all three.';
  return (
    <a className={'sty-rbig' + (t ? ' done' : '')} href={href} style={style}>
      <span className="ey">Three runs, one title</span>
      <b className="nm">Polymath</b>
      <span className="go">{t ? 'Results' : 'Play'}</span>
      <span className="ln">{line}</span>
      <span className="gms" aria-label="Runs in Polymath">
        {POLY_LEGS.map((l, i) => (
          <span key={l.id} className={'gm' + (poly && poly.legs[i].state === 'done' ? ' on' : '')} style={{ '--gc': hueFor(l.cat) }}><i>{i + 1}</i>{l.name}</span>
        ))}
      </span>
      <span className="st"><span>{t ? `Score ${poly.score} of 100` : `${done} of 3 played`}</span></span>
    </a>
  );
}
