'use client';
// YOUR GROUPS TODAY, on the home (owner, 2026-09-17, idea 2). One row per group:
// its name, how many members have played, the gap to the place above, and the
// viewer's place as a pill. The whole row opens the group. A reader in no group
// gets nothing, so the page is unchanged for them.
//
// It takes the standing payload as a prop because the home reads it once for
// three things (this band, the Groups badge and the tile dots).
import { ordinal, fmtPts } from './groupStanding';

export default function HomeGroupsBand({ data, withTq = (h) => h }) {
  if (!data || !data.groups || !data.groups.length) return null;
  return (
    <section className="hgb sty-rev" aria-label="Your groups today">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hgb-h">
        <span className="sty-eb">Your groups today</span>
        <a className="sty-eb hgb-all" href={withTq('/groups')}>All groups &rarr;</a>
      </div>
      <div className="hgb-rows">
        {data.groups.map((g) => {
          let sub = '';
          let pill = null;
          if (g.failed) {
            sub = `${g.members} ${g.members === 1 ? 'member' : 'members'}`;
          } else {
            sub = `${g.played} of ${g.members} played`;
            if (g.rank === 1) {
              const second = (g.top || [])[1];
              if (second) sub += ` · ${fmtPts(g.total - second.total)} ahead of ${second.username}`;
              pill = <span className="hgb-pill gold">1st</span>;
            } else if (g.rank) {
              if (g.ahead && g.gap != null) sub += ` · ${fmtPts(g.gap)} behind ${g.ahead.username}`;
              pill = <span className="hgb-pill">{ordinal(g.rank)}</span>;
            } else {
              pill = <span className="hgb-pill wait">Not played</span>;
            }
          }
          return (
            <a key={g.code} className="hgb-row" href={withTq(`/groups/${g.code}`)}>
              <span className="hgb-nm"><b>{g.name}</b><i>{sub}</i></span>
              {pill}
            </a>
          );
        })}
      </div>
    </section>
  );
}

const CSS = `
.hgb{background:var(--stg-surf);border:1px solid var(--stg-line);border-radius:14px;padding:12px 16px 4px;}
.hgb-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.hgb-h .sty-eb{margin-bottom:4px;}
.hgb-all{color:var(--stg-ink2);text-decoration:none;}
.hgb-all:hover{color:var(--stg-ink);}
.hgb-rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));column-gap:28px;}
.hgb-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;
  border-top:1px solid var(--stg-line);text-decoration:none;color:var(--stg-ink);min-width:0;}
.hgb-row:hover b{text-decoration:underline;text-underline-offset:3px;}
.hgb-nm{display:flex;flex-direction:column;min-width:0;}
.hgb-nm b{font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-nm i{font-style:normal;font-size:12.5px;color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-variant-numeric:tabular-nums;}
.hgb-pill{flex:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.06em;
  text-transform:uppercase;border:1px solid var(--stg-line2);border-radius:999px;padding:3px 9px;color:var(--stg-ink);}
.hgb-pill.gold{border-color:transparent;background:color-mix(in srgb, var(--stg-warn,#fbbf24) 20%, transparent);color:var(--stg-warn,#fbbf24);}
.hgb-pill.wait{border-color:transparent;background:var(--stg-surf2);color:var(--stg-mute);}
@media (max-width:640px){
  .hgb{border-radius:0;border-left:0;border-right:0;margin:0 -14px;padding:10px 14px 2px;}
}
`;
