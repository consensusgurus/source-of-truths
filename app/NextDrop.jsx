'use client';
// NEXT DROP (owner, 2026-10-06): a live countdown to midnight Eastern, when
// every daily rolls over, for the end screens of the three runs (Trivia
// Gauntlet, Passport, Price Check). One component so the three cannot drift.
//
// THE CLOCK IS READ IN AN EFFECT, NEVER DURING RENDER. The server has no idea
// what time it is in Eastern for this reader, so the first paint is a neutral
// dashed figure and the real one lands on mount. At zero it stops counting and
// offers today's new puzzle instead of running negative.
import React, { useEffect, useState } from 'react';

const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const SANS = "'Manrope', system-ui, sans-serif";

function etSecondsPast(now) {
  try {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const o = {};
    f.formatToParts(now).forEach((p) => { o[p.type] = p.value; });
    return ((Number(o.hour) % 24) * 3600) + Number(o.minute) * 60 + Number(o.second);
  } catch (e) {
    return null;
  }
}

const CSS = `
.nd{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 16px;align-items:center;text-align:left;
  border:1px solid color-mix(in srgb,var(--nd-g) 38%,transparent);border-radius:12px;padding:14px 16px;
  background:linear-gradient(90deg,color-mix(in srgb,var(--nd-g) 12%,transparent),transparent 70%);font-family:${SANS}}
.nd-l{grid-column:1/-1;font-family:${MONO};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--nd-g)}
.nd-t{font-family:${MONO};font-weight:500;font-size:34px;line-height:1;letter-spacing:.02em;color:var(--nd-ink);
  font-variant-numeric:tabular-nums;white-space:nowrap}
.nd-t small{font-size:.42em;color:var(--nd-mute);margin:0 3px 0 1px;letter-spacing:.08em}
.nd-s{font-size:13px;color:var(--nd-mute);line-height:1.35;min-width:0}
.nd-s a{color:var(--nd-g);font-weight:700}
.nd-b{grid-column:1/-1;height:3px;border-radius:2px;background:color-mix(in srgb,var(--nd-ink) 10%,transparent);margin-top:8px;overflow:hidden}
.nd-b i{display:block;height:100%;background:var(--nd-g)}
@media (max-width:520px){.nd{grid-template-columns:minmax(0,1fr)}.nd-t{font-size:30px}}
`;

const z = (n) => String(n).padStart(2, '0');

export default function NextDrop({ label, sub, href, accent = '#7dd3fc', ink = 'var(--stg-ink,#eef2fa)', mute = 'var(--stg-mute,#8b95a8)', style }) {
  const [past, setPast] = useState(null);
  useEffect(() => {
    let t = null;
    const tickOnce = () => setPast(etSecondsPast(new Date()));
    tickOnce();
    t = setInterval(tickOnce, 1000);
    return () => clearInterval(t);
  }, []);

  // A jump backwards across midnight (past wraps to a small number) means the
  // new day is live. We latch that so the block says so rather than counting
  // another 24 hours down under a result from yesterday.
  const [rolled, setRolled] = useState(false);
  const [first, setFirst] = useState(null);
  useEffect(() => {
    if (past == null) return;
    if (first == null) { setFirst(past); return; }
    if (past < first) setRolled(true);
  }, [past, first]);

  const left = past == null ? null : 86400 - past;
  const H = left == null ? null : Math.floor(left / 3600);
  const M = left == null ? null : Math.floor((left % 3600) / 60);
  const S = left == null ? null : left % 60;

  return (
    <div className="nd" role="timer" aria-live="off"
      style={{ '--nd-g': accent, '--nd-ink': ink, '--nd-mute': mute, ...(style || {}) }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <span className="nd-l">{label}</span>
      {rolled ? (
        <>
          <span className="nd-t">Live</span>
          <span className="nd-s">Today&rsquo;s puzzle is out.{href ? <> <a href={href}>Play it</a></> : null}</span>
        </>
      ) : (
        <>
          <span className="nd-t" aria-label={left == null ? undefined : `${H} hours ${M} minutes`}>
            {left == null ? '--:--:--' : <>{z(H)}<small>h</small>{z(M)}<small>m</small>{z(S)}<small>s</small></>}
          </span>
          <span className="nd-s">{sub}</span>
          <span className="nd-b"><i style={{ width: past == null ? 0 : `${(past / 864).toFixed(2)}%` }} /></span>
        </>
      )}
    </div>
  );
}
