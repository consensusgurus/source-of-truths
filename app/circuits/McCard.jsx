'use client';

// MULTIPLE CHOICE ON THE RUNS (owner, 2026-11-03; mockups A, B and C of
// "Multiple Choice in the Runs"). It replaced the Polymath meter.
//
//   McCard: on the ending of each of the five multiple choice runs, in the
//   slot the Polymath meter held (the dark tray under Challenge on desktop,
//   the challenge block on a phone). This run's slot fills in, the day's total
//   adds it, and the combined rank climbs from where it stood without this run
//   to where it stands now. Five slots show what is left today, and one button
//   offers the shortest run still open ("Climb").
//
//   McGateBar: a full-width outlined bar under Start on the same five runs'
//   start screens: today's combined champion and the reader's rank.
//
// Local saves draw the card at once (lib/multiple-choice localMc); the ranks
// come from /api/quiz/multiple-choice once this tab's result rows have landed.

import { useEffect, useRef, useState } from 'react';
import { MC_RUNS, MC_HREF, MC_INK, localMc, nextMcRun, mcQuery, etTodayIso } from '@/lib/multiple-choice';
import { dailyMeIdentity } from '../dailyMeClient';
import { resultPostsSettled } from '../ResultQueue';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

const CSS = `
.mcc{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;
  background:rgba(255,255,255,.04);color:#e9edf4;font-variant-numeric:tabular-nums;font-family:Manrope,system-ui,-apple-system,sans-serif}
.mcc-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.mcc-eb{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#aab5c7}
.mcc a.mcc-lnk{font-size:13px;font-weight:800;color:#7dd3fc;text-decoration:none}
.mcc a.mcc-lnk:hover{text-decoration:underline;text-underline-offset:3px}
.mcc-hd{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}
.mcc-rank{font-size:48px;font-weight:800;letter-spacing:-.04em;line-height:.9;min-width:2.6ch}
.mcc-meta{display:flex;flex-direction:column;gap:3px;padding-bottom:2px;min-width:0}
.mcc-meta b{font-size:15px;font-weight:800}
.mcc-meta span{font-size:13px;font-weight:700;color:#aab5c7}
.mcc-up{align-self:center;display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:800;background:#e9edf4;color:${MC_INK};border-radius:999px;padding:3px 10px;
  opacity:0;transform:translateY(6px);transition:opacity .3s,transform .4s cubic-bezier(.2,1.4,.4,1)}
.mcc-up.in{opacity:1;transform:none}
.mcc-strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid rgba(255,255,255,.3);border-radius:12px;overflow:hidden}
.mcc-strip > *{position:relative;display:block;padding:8px 9px 9px;border-left:1px solid rgba(255,255,255,.3);min-width:0;text-decoration:none;color:#e9edf4}
.mcc-strip > *:first-child{border-left:0}
.mcc-strip .f{position:absolute;inset:0;background:var(--c);transform-origin:left;transform:scaleX(0);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.mcc-strip .on .f{transform:scaleX(1)}
.mcc-strip .on{color:${MC_INK}}
.mcc-strip b,.mcc-strip i{position:relative;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mcc-strip b{font-size:11.5px;font-weight:800}
.mcc-strip i{font-style:normal;font-size:17px;font-weight:800;line-height:1.15;margin-top:2px}
.mcc-strip a i{font-size:12px;font-weight:800;color:#7dd3fc;margin-top:4px}
.mcc-strip a:hover i{text-decoration:underline;text-underline-offset:3px}
.mcc-ch{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:13px;font-weight:700;color:#cbd5e1}
.mcc-ch b{color:#e9edf4;font-weight:800}
.mcc a.mcc-go{display:flex;align-items:center;justify-content:center;gap:8px;height:44px;border-radius:10px;background:#7dd3fc;color:${MC_INK};font-weight:800;font-size:14.5px;text-decoration:none;text-align:center;padding:0 12px}
.mcc a.mcc-go:hover{filter:brightness(1.05)}
.mcc a:focus-visible{outline:2px solid #e9edf4;outline-offset:2px}
@media (max-width:560px){.mcc-rank{font-size:40px}.mcc-strip > *{padding:7px 6px 8px}.mcc-strip b{font-size:10.5px}.mcc-strip i{font-size:15px}}
@media (prefers-reduced-motion:reduce){.mcc-strip .f,.mcc-up{transition:none}}

.mcg{display:flex;align-items:center;gap:12px;margin-top:10px;width:100%;box-sizing:border-box;border:1px solid var(--gsx-ink,${MC_INK});border-radius:18px;padding:11px 16px;
  color:var(--gsx-ink,${MC_INK});text-decoration:none;font-family:Manrope,system-ui,-apple-system,sans-serif}
.mcg:hover{background:color-mix(in srgb, var(--gsx-ink,${MC_INK}) 8%, transparent)}
.mcg .l{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;text-align:left}
.mcg .l b{font-size:15px;font-weight:800}
.mcg .l span{font-size:12.5px;font-weight:600;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mcg .y{font-size:13px;font-weight:800;text-align:right;line-height:1.15;flex:none}
.mcg svg{width:14px;height:14px;flex:none}
`;

function countTo(from, to, ms, set) {
  const t0 = performance.now();
  let raf = 0;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / ms);
    set(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export default function McCard({ circuitId, right = 0 }) {
  const [local, setLocal] = useState(null);
  const [fill, setFill] = useState(false);
  const [srv, setSrv] = useState(null);
  const [shown, setShown] = useState(null);
  const [climbed, setClimbed] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setLocal(localMc(etTodayIso(), { id: circuitId, right }));
    const t = setTimeout(() => setFill(true), reduce.current ? 0 : 450);
    return () => clearTimeout(t);
  }, [circuitId, right]);

  useEffect(() => {
    let alive = true;
    resultPostsSettled().then(() => {
      const qs = mcQuery('today', dailyMeIdentity(), { fresh: 1, less: circuitId });
      fetch(`/api/quiz/multiple-choice?${qs}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => { if (alive && d && !d.error) setSrv(d); })
        .catch(() => {});
    });
    return () => { alive = false; };
  }, [circuitId]);

  // The climb: from the rank held without this run to the rank now.
  useEffect(() => {
    if (!srv || !srv.me || !srv.me.rank) return undefined;
    const to = srv.me.rank;
    const from = srv.me.before && srv.me.before > to ? srv.me.before : null;
    if (!from || reduce.current) { setShown(to); setClimbed(!!from); return undefined; }
    setShown(from);
    let stop = () => {};
    const t = setTimeout(() => { stop = countTo(from, to, 1100, setShown); setTimeout(() => setClimbed(true), 1100); }, 500);
    return () => { clearTimeout(t); stop(); };
  }, [srv]);

  if (!local) return null;
  const me = srv && srv.me ? srv.me : null;
  const ranked = srv && srv.field ? srv.field.all : null;
  const total = me ? me.total : local.total;
  const runsN = me ? MC_RUNS.filter((r) => me.by[r.id] > 0).length : local.runs.filter((x) => x.state !== 'none').length;
  const climb = me && me.before && me.rank && me.before > me.rank ? me.before - me.rank : 0;
  const next = nextMcRun(local, circuitId);
  const champ = srv && srv.champions ? srv.champions.all : null;

  return (
    <section className="mcc" aria-label="Multiple Choice today">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="mcc-top">
        <span className="mcc-eb">Multiple Choice · Today</span>
        <a className="mcc-lnk" href={MC_HREF}>See all leaders</a>
      </div>
      <div className="mcc-hd">
        <span className="mcc-rank">{shown != null ? `#${shown}` : me && me.rank ? `#${me.rank}` : '–'}</span>
        <span className="mcc-meta">
          <b>{fmt(total)} correct across {runsN} {runsN === 1 ? 'run' : 'runs'}</b>
          <span>{ranked ? `of ${fmt(Math.max(ranked, me && me.rank ? me.rank : 0))} ranked today${me && me.provisional ? ' if you claim a name' : ''}` : 'Reading the board'}</span>
        </span>
        {climb ? <span className={'mcc-up' + (climbed ? ' in' : '')}>&#9650; {climb}</span> : null}
      </div>
      <div className="mcc-strip">
        {MC_RUNS.map((r) => {
          const x = local.runs.find((y) => y.id === r.id);
          const n = me ? me.by[r.id] : (x && x.state !== 'none' ? x.right : 0);
          const has = (x && x.state !== 'none') || n > 0;
          if (!has) {
            return <a key={r.id} href={r.href}><b>{r.short}</b><i>Play</i></a>;
          }
          const on = r.id === circuitId ? fill : true;
          return (
            <div key={r.id} className={on ? 'on' : ''} style={{ '--c': r.colour }}>
              <span className="f" />
              <b>{r.short}</b><i>{fmt(n)}</i>
            </div>
          );
        })}
      </div>
      {champ || (me && me.toPass) ? (
        <div className="mcc-ch">
          <span>{champ ? <>Champion: <b>{champ.name}</b> · {fmt(champ.total)} correct</> : null}</span>
          <span>{me && me.toPass ? `${fmt(me.toPass.need)} to pass #${me.toPass.rank}` : me && me.rank === 1 ? 'You lead today' : ''}</span>
        </div>
      ) : null}
      {next ? (
        <a className="mcc-go" href={next.href}>Climb: {next.name}</a>
      ) : (
        <a className="mcc-go" href={MC_HREF}>See Multiple Choice Leaders</a>
      )}
    </section>
  );
}

export function McGateBar() {
  const [d, setD] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/quiz/multiple-choice?${mcQuery('today', dailyMeIdentity())}`)
      .then((r) => r.json())
      .then((x) => { if (alive && x && !x.error) setD(x); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const champ = d && d.champions ? d.champions.all : null;
  const rank = d && d.me && d.me.rank ? d.me.rank : null;
  return (
    <a className="mcg" href={MC_HREF} onClick={(e) => e.stopPropagation()}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="l">
        <b>Multiple Choice Leaders</b>
        <span>{champ ? `Champion ${champ.name} · ${fmt(champ.total)} across five runs` : d ? 'No leader yet today' : 'Five runs, one board'}</span>
      </span>
      <span className="y">{d ? (rank ? <>You<br />#{rank}</> : <>Not ranked<br />yet</>) : null}</span>
      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 2.5 9.5 7 5 11.5" /></svg>
    </a>
  );
}
