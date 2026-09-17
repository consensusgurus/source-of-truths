'use client';
// THE STAT HUB'S TODAY BOARD, NARROWED TO A GROUP (owner, 2026-09-17, idea 3).
// Wraps the site's combined board: a reader in no group sees exactly what they
// saw before. A reader in a group gets Everyone / <group> above it, and a group
// board that keeps each member's site place beside their group place.
import useGroupStanding, { fmtPts, MiniAvatar, AVATAR_CSS } from './groupStanding';
import GroupSwitch, { useGroupScope } from './GroupSwitch';

export default function StatHubGroupBoard({ children }) {
  const data = useGroupStanding('today');
  const groups = data && data.groups ? data.groups.filter((g) => !g.failed) : null;
  const [scope, setScope, active] = useGroupScope(groups);
  if (!groups || !groups.length) return children;
  return (
    <div className="shg">
      <style dangerouslySetInnerHTML={{ __html: AVATAR_CSS + CSS }} />
      <GroupSwitch groups={groups} value={scope} onChange={setScope} />
      {active ? (
        <div className="card shg-card">
          <div className="shg-h">
            <b>{active.name}</b>
            <span>{active.played} of {active.members} played today</span>
          </div>
          {active.rows && active.rows.length ? (
            <div className="shg-rows">
              <div className="shg-r shg-hd"><span>#</span><span /><span>Player</span><span>Site</span><span>Points</span></div>
              {active.rows.map((r) => (
                <div key={r.userKey} className={'shg-r' + (r.userKey === data.userKey ? ' me' : '')}>
                  <span className="k">{r.rank}</span>
                  <MiniAvatar name={r.username} userKey={r.userKey} />
                  <span className="n">{r.username}{r.userKey === data.userKey ? ' (you)' : ''}</span>
                  <span className="st">{r.siteRank ? `#${r.siteRank}` : ''}</span>
                  <span className="s">{fmtPts(r.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="shg-empty">Nobody in {active.name} has played today yet.</p>
          )}
          <a className="shg-link" href={`/groups/${active.code}`}>Open {active.name} &rarr;</a>
        </div>
      ) : children}
    </div>
  );
}

const CSS = `
.shg-card{padding:16px 18px;}
.shg-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:8px;}
.shg-h b{font-size:15px;font-weight:800;}
.shg-h span{font-size:12px;color:var(--stg-mute);font-weight:600;}
.shg-r{display:grid;grid-template-columns:24px 22px minmax(0,1fr) 64px 60px;gap:10px;align-items:center;padding:8px 4px;
  border-top:1px solid var(--stg-line);font-size:13.5px;}
.shg-r.shg-hd{border-top:0;padding-top:0;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-mute);}
.shg-r .k{font-weight:800;color:var(--stg-mute);text-align:right;font-variant-numeric:tabular-nums;}
.shg-r .n{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.shg-r .st{text-align:right;font-size:12px;color:var(--stg-mute);font-variant-numeric:tabular-nums;}
.shg-r .s{text-align:right;font-weight:800;font-variant-numeric:tabular-nums;}
.shg-hd span:nth-child(4),.shg-hd span:nth-child(5){text-align:right;}
.shg-r.me{background:color-mix(in srgb, var(--stg-brand,#7dd3fc) 14%, transparent);border-radius:8px;border-top-color:transparent;}
.shg-r.me + .shg-r{border-top-color:transparent;}
.shg-empty{color:var(--stg-mute);font-size:13px;margin:6px 0;}
.shg-link{display:inline-block;margin-top:10px;font-size:12.5px;font-weight:700;color:var(--stg-acc-ink,var(--stg-ink));}
`;
