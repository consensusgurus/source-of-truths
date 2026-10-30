'use client';

// THE CROWD GUESS (owner, 2026-10-25): after a price tag is over, how everyone
// else's FIRST guess landed. Two parts, each drawn only when there is data:
//
//   the line  "68% of players were further off than your first guess", from
//             every finished player's first-guess miss (price_tiebreak), which
//             every row since 2026-10-11 carries.
//   the strip everyone's first guess on a log scale from a quarter of the price
//             to four times it, with you, the typical guess and the price
//             marked. Needs first_guess (migration 62), so it fills in as rows
//             arrive.
//
// Shown only once the item is finished: /api/quiz/price-crowd never sends a
// price or a raw guess, but a typical-miss line is still a hint, so the panel
// is never mounted on a live item. Ink is currentColor throughout, so it reads
// on every stage ground and in the plain and dark looks.

import React, { useEffect, useState } from 'react';
import { errOf } from '@/lib/price-games';

const MIN_N = 5;          // fewer players than this: say nothing
const MIN_STRIP = 12;     // fewer first guesses than this: no strip yet

function useCrowd(quizId) {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!quizId) return undefined;
    let dead = false;
    fetch(`/api/quiz/price-crowd?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!dead && j && !j.error) setD(j); })
      .catch(() => {});
    return () => { dead = true; };
  }, [quizId]);
  return d;
}

const pctOf = (l, lo, hi) => Math.max(1.5, Math.min(98.5, ((l - lo) / (hi - lo)) * 100));

export default function PriceCrowd({ quizId, price, first, compact = false, style }) {
  const d = useCrowd(quizId);
  if (!d || !(d.n >= MIN_N) || !(first > 0) || !(price > 0)) return null;
  const mine = Math.round(errOf(first, price) * 10000);
  const others = d.bps.length;
  const further = d.bps.filter((b) => b > mine).length;
  const share = Math.round((further / Math.max(1, others)) * 100);
  const strip = Array.isArray(d.bins) && d.nFirst >= MIN_STRIP;
  const top = strip ? Math.max(...d.bins, 1) : 1;
  const lo = d.lo, hi = d.hi;
  const youL = Math.log2(first / price);
  const midL = d.median ? Math.log2(d.median) : null;
  const typical = d.median ? (d.median >= 1 ? `${Math.round((d.median - 1) * 100)}% high` : `${Math.round((1 - d.median) * 100)}% low`) : null;
  const near = d.median && Math.abs(d.median - 1) < 0.03;
  return (
    <section className={`pcw${compact ? ' pcw-c' : ''}`} style={style} aria-label="How everyone guessed">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pcw-h"><b>How Everyone Guessed</b><span>{strip ? `${d.nFirst.toLocaleString()} first guesses` : `${d.n.toLocaleString()} players`}</span></div>
      {strip ? (
        <div className="pcw-strip">
          <div className="pcw-bars" aria-hidden="true">
            {d.bins.map((v, i) => <i key={i} style={{ height: `${Math.max(v ? 6 : 0, Math.round((v / top) * 100))}%` }} />)}
          </div>
          {/* MARKS WITHOUT WORDS ON THE STRIP (owner report, 2026-10-30: the
              labels overlapped whenever two marks landed close together). Each
              mark is a shape on the axis; a legend underneath names them, so
              nothing can collide however the guesses fall. */}
          <div className="pcw-marks" aria-hidden="true">
            <span className="pcw-m pcw-price" style={{ left: `${pctOf(0, lo, hi)}%` }}><i /></span>
            {midL != null && !near ? <span className="pcw-m pcw-mid" style={{ left: `${pctOf(midL, lo, hi)}%` }}><i /></span> : null}
            <span className="pcw-m pcw-you" style={{ left: `${pctOf(youL, lo, hi)}%` }}><i /></span>
          </div>
          <div className="pcw-ax" aria-hidden="true"><span>¼ of it</span><span>4×</span></div>
          <div className="pcw-key" aria-hidden="true">
            <span className="pcw-price"><i />Price</span>
            {midL != null && !near ? <span className="pcw-mid"><i />Typical guess</span> : null}
            <span className="pcw-you"><i />You</span>
          </div>
        </div>
      ) : null}
      <div className="pcw-stats">
        <div><b>{share}%</b><span>of players were further off than your first guess</span></div>
        {typical ? <div><b>{near ? 'On it' : typical}</b><span>the typical first guess</span></div> : null}
      </div>
    </section>
  );
}

const CSS = `
.pcw{border:2px solid currentColor;border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:9px;text-align:left;font-size:13px;line-height:1.35}
.pcw-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.pcw-h b{font-size:15px;font-weight:800}
.pcw-h span{font-size:11.5px;font-weight:700;opacity:.75}
.pcw-strip{display:flex;flex-direction:column}
.pcw-bars{display:flex;align-items:flex-end;gap:2px;height:58px;border-bottom:2px solid currentColor}
.pcw-c .pcw-bars{height:42px}
.pcw-bars i{flex:1;border:1.5px solid currentColor;border-bottom:0;border-radius:3px 3px 0 0;background:color-mix(in srgb,currentColor 14%,transparent);transform-origin:bottom;animation:pcwG .6s cubic-bezier(.2,.8,.2,1) both}
.pcw-marks{position:relative;height:16px}
.pcw-m{position:absolute;top:-1px;transform:translateX(-50%);display:flex}
.pcw-m i,.pcw-key i{display:block;width:12px;height:12px;border-radius:50%;border:2px solid currentColor;box-sizing:border-box}
.pcw-price i{width:3px;height:16px;border-radius:2px;background:currentColor;border:0}
.pcw-m.pcw-price{top:-7px;z-index:1}
.pcw-mid i{background:transparent}
.pcw-you i{background:currentColor}
.pcw-ax{display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;opacity:.7;margin-top:2px}
.pcw-key{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11.5px;font-weight:800;margin-top:6px}
.pcw-key span{display:inline-flex;align-items:center;gap:6px}
.pcw-key .pcw-price i{height:12px}
.pcw-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px}
.pcw-stats div{display:flex;flex-direction:column;border-radius:10px;padding:7px 9px;background:color-mix(in srgb,currentColor 9%,transparent)}
.pcw-stats b{font-size:19px;font-weight:800;line-height:1.1}
.pcw-stats span{font-size:12px;font-weight:700;opacity:.85}
.pcw-c .pcw-stats b{font-size:17px}
@keyframes pcwG{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.pcw-bars i{animation:none}}
`;
