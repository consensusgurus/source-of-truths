'use client';
// YOUR GROUPS TODAY, on the home (owner, 2026-09-17, idea 2; narrowed the same
// day: "groups should only take up the size necessary, the size of one chip at
// a time. users could press an arrow to see more").
//
// So it is ONE CHIP, sized to its own contents, and arrows to step through the
// rest. It never stretches: the day's progress ladder beside it takes the room
// that is left. A reader in no group gets nothing at all.
//
// It takes the standing payload as a prop because the home reads it once for
// three things (this band, the Groups badge and the tile discs).
import { useState } from 'react';
import { ordinal, fmtPts } from './groupStanding';

export default function HomeGroupsBand({ data, withTq = (h) => h }) {
  const [at, setAt] = useState(0);
  const groups = (data && data.groups) || [];
  if (!groups.length) return null;
  const n = groups.length;
  const i = ((at % n) + n) % n;
  const g = groups[i];

  let sub = `${g.members} ${g.members === 1 ? 'member' : 'members'}`;
  let pill = null;
  if (!g.failed) {
    sub = `${g.played} of ${g.members} played`;
    if (g.rank === 1) {
      const second = (g.top || [])[1];
      if (second) sub += ` · ${fmtPts(g.total - second.total)} ahead`;
      pill = <span className="hgb-pill gold">1st</span>;
    } else if (g.rank) {
      if (g.ahead && g.gap != null) sub += ` · ${fmtPts(g.gap)} behind ${g.ahead.username}`;
      pill = <span className="hgb-pill">{ordinal(g.rank)}</span>;
    } else {
      pill = <span className="hgb-pill wait">Not played</span>;
    }
  }

  return (
    <section className="hgb sty-rev" aria-label="Your groups today">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hgb-h">
        <span className="sty-eb">Your groups today{n > 1 ? <span className="hgb-of">{i + 1}/{n}</span> : null}</span>
        <a className="hgb-all" href={withTq('/groups')}>All &rarr;</a>
      </div>
      <div className="hgb-row">
        {n > 1 ? (
          <button type="button" className="hgb-arw" aria-label="Previous group" onClick={() => setAt(i - 1)}>&lsaquo;</button>
        ) : null}
        <a className="hgb-chip" href={withTq(`/groups/${g.code}`)}>
          <span className="hgb-nm"><b>{g.name}</b><i>{sub}</i></span>
          {pill}
        </a>
        {n > 1 ? (
          <button type="button" className="hgb-arw" aria-label="Next group" onClick={() => setAt(i + 1)}>&rsaquo;</button>
        ) : null}
      </div>
    </section>
  );
}

const CSS = `
/* SIZED TO ITS CONTENTS. justify-self keeps it from filling a grid column, and
   max-width stops a long group name from pushing the ladder off the row. */
.hgb{display:inline-flex;flex-direction:column;gap:5px;justify-self:start;align-self:center;
  max-width:min(100%,420px);min-width:0;}
.hgb-h{display:flex;align-items:baseline;gap:12px;}
.hgb-h .sty-eb{margin-bottom:0;}
.hgb-of{margin-left:7px;font-variant-numeric:tabular-nums;color:var(--stg-ink2);}
.hgb-all{margin-left:auto;flex:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;
  font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-acc-ink);text-decoration:none;}
.hgb-all:hover{opacity:.78;}
.hgb-row{display:flex;align-items:stretch;gap:4px;min-width:0;}
.hgb-arw{flex:none;width:26px;border:1px solid var(--stg-line);border-radius:10px;background:var(--stg-surf);
  color:var(--stg-ink2);font-size:16px;line-height:1;cursor:pointer;padding:0;}
.hgb-arw:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.hgb-arw:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.hgb-chip{display:flex;align-items:center;gap:12px;min-width:0;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:12px;padding:8px 12px;}
.hgb-chip:hover{border-color:var(--stg-line2);}
.hgb-chip:hover b{text-decoration:underline;text-underline-offset:3px;}
.hgb-nm{display:flex;flex-direction:column;min-width:0;}
.hgb-nm b{font-size:14.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-nm i{font-style:normal;font-size:12px;color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;font-variant-numeric:tabular-nums;}
.hgb-pill{flex:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.06em;
  text-transform:uppercase;border:1px solid var(--stg-line2);border-radius:999px;padding:3px 8px;color:var(--stg-ink);}
.hgb-pill.gold{border-color:transparent;background:color-mix(in srgb, var(--stg-warn,#fbbf24) 20%, transparent);color:var(--stg-warn,#fbbf24);}
.hgb-pill.wait{border-color:transparent;background:var(--stg-surf2);color:var(--stg-mute);}
@media (max-width:640px){
  .hgb{max-width:100%;width:100%;}
  .hgb-chip{flex:1;}
}
`;
