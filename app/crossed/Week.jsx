'use client';

// THE WEEK: Crossed Up's rank mark (owner, 2026-10-20: the run should wear its
// own elements, not the Dojo's belt). Seven squares in a row, an across entry
// that reads MON TUE WED THU FRI SAT PEN. Every rank the run total reaches is
// inked in that rank's colour, and the rank you landed on is circled in red
// pen, the way a solver circles the square they are sure of.
//
// `ti` is the rank index as CROSSED_BELTS (0 In Pen, 6 Monday). `--s` sets the
// square size; the stylesheet is WEEK_CSS, interpolated into the page's own.

import React from 'react';
import { CROSSED_BELTS, crossedDayTag, crossedInkOn } from '@/lib/crossed';

const B = CROSSED_BELTS;
const LOW = B.length - 1;

export default function Week({ ti, circle = true, className = '', style }) {
  const cells = [];
  for (let i = LOW; i >= 0; i--) {
    const on = i >= ti;
    const t = B[i];
    cells.push(
      <i key={i} className={`${on ? 'on' : ''}${circle && i === ti ? ' me' : ''}${i === 0 ? ' pen' : ''}`}
        style={on ? { '--b': t[3], '--k': i === 0 ? '#e9cf7f' : crossedInkOn(t[3]) } : undefined}>
        <b>{crossedDayTag(i)}</b>
      </i>,
    );
  }
  return <div className={`cw ${className}`} style={style} aria-label={`${B[ti][1]}`} role="img">{cells}</div>;
}

export const WEEK_CSS = `
.cw{--s:40px;display:inline-flex;border:2px solid rgba(233,237,244,.75);border-radius:3px;background:rgba(255,255,255,.03)}
.cw i{position:relative;width:var(--s);height:var(--s);flex:none;display:flex;align-items:center;justify-content:center;border-left:1px solid rgba(233,237,244,.28);transition:background .25s ease}
.cw i:first-child{border-left:0}
.cw i b{font-size:calc(var(--s) * .29);font-weight:800;letter-spacing:.03em;font-style:normal;color:rgba(233,237,244,.34);font-variant-numeric:tabular-nums}
.cw i.on{background:var(--b)}
.cw i.on b{color:var(--k)}
.cw i.me::after{content:'';position:absolute;inset:calc(var(--s) * -.16);border:2.5px solid #ef4444;border-radius:50%;transform:rotate(-9deg);pointer-events:none;animation:cwcircle .5s cubic-bezier(.2,.9,.2,1) both}
@keyframes cwcircle{from{opacity:0;transform:rotate(-40deg) scale(1.5)}to{opacity:1;transform:rotate(-9deg) scale(1)}}
@media(prefers-reduced-motion:reduce){.cw i.me::after{animation:none}}
`;
