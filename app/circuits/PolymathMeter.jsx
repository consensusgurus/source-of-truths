'use client';

// THE POLYMATH METER (owner, 2026-10-19), on the Trivia, Math and English
// Gauntlet end screens. Three tiles, one per gauntlet, filled from this
// device's run saves (the run just finished is passed in, so it is never
// stale), and a door to the one still to play. When this run is the third, the
// title is revealed: the tiles land in turn, the score counts up and the tier
// stamps in its colour. The rank comes from /api/quiz/polymath once this tab's
// own result rows have landed. The run page is always dark, so the colours are
// literals rather than stage tokens.
import { useEffect, useRef, useState } from 'react';
import { categoryColor } from '@/lib/category-ramp';
import { POLY_LEGS, localPolymath, etToday } from '@/lib/polymath';
import { dailyMeIdentity } from '../dailyMeClient';
import { resultPostsSettled } from '../ResultQueue';

const CSS = `
.pmm{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:16px;margin:18px 0;display:flex;flex-direction:column;gap:12px;
  background:rgba(255,255,255,.04);color:#e9edf4;font-variant-numeric:tabular-nums;}
.pmm-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;}
.pmm-eb{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#aab5c7;}
.pmm-lnk{font-size:13px;font-weight:800;color:#7dd3fc;text-decoration:none;}
.pmm-lnk:hover{text-decoration:underline;text-underline-offset:3px;}
.pmm-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
.pmm-t{border-radius:10px;padding:10px 11px;min-height:76px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px;
  border:1.5px solid rgba(255,255,255,.14);}
.pmm-t small{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#aab5c7;}
.pmm-t b{font-size:26px;font-weight:800;line-height:1;min-width:2.4ch;}
.pmm-t.on{background:var(--lh);border-color:var(--lh);color:#08222e;}
.pmm-t.on small{color:#08222e;}
.pmm-t.go{border-style:dashed;justify-content:space-between;text-decoration:none;color:#e9edf4;}
.pmm-t.go span{font-size:13px;font-weight:800;color:#7dd3fc;}
.pmm-res{display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:12px;padding:12px 14px;color:#0b0d12;min-height:56px;box-sizing:border-box;}
.pmm-res b{font-size:24px;font-weight:800;letter-spacing:-.01em;}
.pmm-res span{font-size:13px;font-weight:700;}
.pmm-res i{font-style:normal;font-size:24px;font-weight:800;min-width:2.4ch;text-align:right;}
.pmm-next{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.pmm-next p{margin:0;font-size:13.5px;font-weight:700;color:#cbd5e1;}
.pmm-btn{display:inline-flex;align-items:center;height:42px;padding:0 16px;border-radius:10px;background:#7dd3fc;color:#08222e;
  font-weight:800;font-size:14px;text-decoration:none;white-space:nowrap;}
.pmm-btn:focus-visible,.pmm-t.go:focus-visible{outline:2px solid #e9edf4;outline-offset:2px;}
.pmm.rev .pmm-t.on{animation:pmmLand .5s cubic-bezier(.2,1.4,.4,1) both;}
.pmm.rev .pmm-t.on:nth-child(2){animation-delay:.25s;}
.pmm.rev .pmm-t.on:nth-child(3){animation-delay:.5s;}
.pmm.rev .pmm-res{animation:pmmStamp .55s cubic-bezier(.2,1.5,.4,1) .95s both;}
@keyframes pmmLand{from{opacity:0;transform:translateY(10px) scale(.9);}to{opacity:1;transform:none;}}
@keyframes pmmStamp{0%{opacity:0;transform:scale(1.25);}60%{opacity:1;transform:scale(.96);}100%{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){.pmm.rev .pmm-t.on,.pmm.rev .pmm-res{animation:none;}}
@media (max-width:560px){.pmm-t b{font-size:22px;}}
`;

export default function PolymathMeter({ circuitId, right = 0 }) {
  const [poly, setPoly] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [rank, setRank] = useState(null);
  const [shown, setShown] = useState(null);
  const raf = useRef(0);

  useEffect(() => {
    const day = etToday();
    const before = localPolymath(day);
    const after = localPolymath(day, { id: circuitId, right });
    setPoly(after);
    // The reveal plays when THIS run is the one that completes the three, once
    // per day on this device.
    void before;
    if (after.score != null) {
      let seen = false;
      try { seen = localStorage.getItem('sot_polymath_rev') === day; } catch (e) { seen = false; }
      if (!seen) {
        setReveal(true);
        try { localStorage.setItem('sot_polymath_rev', day); } catch (e) { /* private window */ }
      }
    }
  }, [circuitId, right]);

  // Count the score up during the reveal, otherwise show it straight away.
  useEffect(() => {
    if (!poly || poly.score == null) return undefined;
    if (!reveal) { setShown(poly.score); return undefined; }
    const t0 = performance.now() + 950;
    const tick = (now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / 700));
      setShown(Math.round(poly.score * k));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [poly, reveal]);

  useEffect(() => {
    if (!poly || poly.score == null) return undefined;
    let alive = true;
    resultPostsSettled().then(() => {
      const { anonId, email } = dailyMeIdentity();
      const qs = new URLSearchParams({ fresh: '1' });
      if (anonId) qs.set('anonId', anonId);
      if (email) qs.set('email', email);
      fetch(`/api/quiz/polymath?${qs.toString()}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (alive && d && d.me && d.me.rank) setRank({ rank: d.me.rank, field: Math.max(d.field || 0, d.me.rank), provisional: d.me.provisional }); })
        .catch(() => {});
    });
    return () => { alive = false; };
  }, [poly]);

  if (!poly) return null;
  const next = poly.legs.find((l) => l.state !== 'done');
  const nextLeg = next ? POLY_LEGS.find((l) => l.id === next.id) : null;
  const t = poly.tier;

  return (
    <section className={'pmm' + (reveal ? ' rev' : '')} aria-label="Polymath today">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pmm-top">
        <span className="pmm-eb">Polymath today · {poly.done} of 3</span>
        <a className="pmm-lnk" href="/polymath">{t ? 'See the Polymath board' : 'What is Polymath?'}</a>
      </div>
      <div className="pmm-tiles">
        {POLY_LEGS.map((l, i) => {
          const g = poly.legs[i];
          const style = { '--lh': categoryColor(l.cat) };
          if (g.state === 'done') {
            return (
              <div key={l.id} className="pmm-t on" style={style}>
                <small>{l.short}</small>
                <b>{g.points}</b>
              </div>
            );
          }
          return (
            <a key={l.id} className="pmm-t go" href={l.href} style={style}>
              <small>{l.short}</small>
              <span>{g.state === 'started' ? 'Resume' : 'Play'} &rarr;</span>
            </a>
          );
        })}
      </div>
      {t ? (
        <div className="pmm-res" style={{ background: t.colour }}>
          <div>
            <b>{t.name}</b>
            <span style={{ display: 'block' }}>
              {rank ? `#${rank.rank} of ${rank.field}${rank.provisional ? ' if you claim a name' : ''}` : 'Reading the board'}
              {t.next ? ` · ${t.toNext} to ${t.next.name}` : ''}
            </span>
          </div>
          <i>{shown == null ? poly.score : shown}</i>
        </div>
      ) : nextLeg ? (
        <div className="pmm-next">
          <p>Finish all three to earn your Polymath title.</p>
          <a className="pmm-btn" href={nextLeg.href}>Play the {nextLeg.name}</a>
        </div>
      ) : null}
    </section>
  );
}
