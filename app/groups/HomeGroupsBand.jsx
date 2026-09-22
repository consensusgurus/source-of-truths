'use client';
// YOUR GROUP TODAY, on the home (owner, 2026-09-17; reworked 2026-09-22).
//
// It began as ONE CHIP reporting a place and a count. That told a reader where
// they stood and never once told them what anybody else had done, which is the
// thing a group is for. It carries two cards now:
//
//   THE CHASE   who is directly above you, the gap, and the two or three games
//               that account for it. Leading instead, it names the nearest
//               chaser and what they can still take.
//   THE FEED    every finish in the group today, newest first, the reader's own
//               included. A feed that shows only other people reads as
//               surveillance rather than as a room.
//
// ON A PHONE IT IS ONE CARD WITH TWO FACES (owner, 2026-09-22), stepped with
// the arrows the band already used for multiple groups. Four things stacked
// above the slate is most of a 390px first screen, and the two cards answer
// different questions: a reader usually wants one of them, not both. The
// stepper walks every group's faces in turn, so one control does one job.
//
// It takes the standing payload as a prop because the home reads it once for
// four things (this band, the Groups badge, the member ladders and the tiles).
import { useState } from 'react';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { ordinal, fmtPts, relTime, swingVs, MiniAvatar, AVATAR_CSS } from './groupStanding';

const gameName = (k) => (DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].name) || k;

// The line that says where the reader is, used as the band's own subtitle.
function standLabel(g) {
  if (g.failed) return '';
  if (!g.rank) return `${g.played} of ${g.members} played`;
  if (g.rank === 1) return 'you lead';
  return `you’re ${ordinal(g.rank)}`;
}

// A swing bar: the reader's side of centre is green, the other member's is red,
// each scaled against the biggest swing on show so the three read as one set.
function Swing({ rows }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => Math.abs(r.diff)), 1);
  return (
    <div className="hgb-sw">
      {rows.map((r) => (
        <div key={r.key}>
          <span className="g">{gameName(r.key)}</span>
          <span className="bar">
            <i className={r.diff > 0 ? 'up' : 'dn'} style={{ width: (Math.abs(r.diff) / max) * 46 + '%' }} />
            <u />
          </span>
          <span className={'v ' + (r.diff > 0 ? 'up' : 'dn')}>
            {r.diff > 0 ? '+' : '−'}{fmtPts(Math.abs(r.diff))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Chase({ g, myKey }) {
  // NOT PLAYED YET is its own state, and it is not a failure: it says how many
  // members are already on today's board, which is the reason to go and play.
  if (!g.rank) {
    return (
      <div className="hgb-chase">
        <div className="hgb-top">
          <b>Not played yet</b>
          <span className="hgb-em">{g.played} of {g.members} {g.played === 1 ? 'member has' : 'members have'}</span>
        </div>
      </div>
    );
  }
  // LEADING: name the nearest chaser and what they can still take off you.
  if (g.rank === 1) {
    const second = (g.top || [])[1] || null;
    return (
      <div className="hgb-chase">
        <div className="hgb-top">
          <MiniAvatar name={g.leader ? g.leader.username : 'You'} userKey={myKey} />
          <b>You lead</b>
          {second ? <span className="hgb-em">{second.username} is closest</span> : null}
          {second ? <span className="hgb-gap up">{fmtPts(g.total - second.total)}</span> : null}
        </div>
        {second ? <Swing rows={swingVs(g, myKey, second.userKey)} /> : null}
      </div>
    );
  }
  const a = g.ahead;
  if (!a) return null;
  return (
    <div className="hgb-chase">
      <div className="hgb-top">
        <MiniAvatar name={a.username} userKey={a.userKey} />
        <b>{a.username}</b>
        <span className="hgb-em">is ahead of you</span>
        <span className="hgb-gap dn">{fmtPts(g.gap == null ? 0 : g.gap)}</span>
      </div>
      <Swing rows={swingVs(g, myKey, a.userKey)} />
    </div>
  );
}

function Feed({ g, myKey, rows = 5 }) {
  const list = (g.feed || []).slice(0, rows);
  if (!list.length) {
    return <div className="hgb-feed"><div className="hgb-none">Nobody has finished anything yet today.</div></div>;
  }
  return (
    <div className="hgb-feed">
      {list.map((f, i) => (
        <div className="hgb-fr" key={f.userKey + ':' + f.key + ':' + i}>
          <MiniAvatar name={f.username} userKey={f.userKey} />
          <span className="t">
            <b>{f.userKey === myKey ? 'You' : f.username}</b> <em>finished</em> {gameName(f.key)}
            {f.lead ? <span className="lead">Group lead</span> : null}
          </span>
          <span className="p">{fmtPts(f.points)} <i>{relTime(f.at)}</i></span>
        </div>
      ))}
    </div>
  );
}

export default function HomeGroupsBand({ data, withTq = (h) => h, narrow = false }) {
  // Both steppers are declared before the early return, so the hook order is
  // stable for any payload this component is handed.
  const [at, setAt] = useState(0);
  const [face, setFace] = useState(0);
  const groups = (data && data.groups) || [];
  if (!groups.length) return null;
  const myKey = (data && data.userKey) || null;

  // A PHONE WALKS FACES, a desktop walks groups: one stepper either way, and it
  // always steps the thing the reader can see.
  const faces = [];
  for (const g of groups) {
    if (g.failed) continue;
    faces.push({ g, kind: 'stand' });
    faces.push({ g, kind: 'act' });
  }
  if (!faces.length) return null;

  const n = narrow ? faces.length : groups.length;
  const idx = ((((narrow ? face : at) % n) + n) % n);
  const g = narrow ? faces[idx].g : groups[idx];
  const kind = narrow ? faces[idx].kind : null;
  const step = (d) => (narrow ? setFace(idx + d) : setAt(idx + d));

  return (
    <section className="hgb sty-rev" aria-label="Your groups today">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hgb-h">
        <a className="hgb-nm" href={withTq(`/groups/${g.code}`)}>{g.name}</a>
        <span className="hgb-you">{standLabel(g)}</span>
        {n > 1 ? (
          <span className="hgb-step">
            <button type="button" aria-label="Previous" onClick={() => step(-1)}>&lsaquo;</button>
            <i>{idx + 1}/{n}</i>
            <button type="button" aria-label="Next" onClick={() => step(1)}>&rsaquo;</button>
          </span>
        ) : null}
        <a className="hgb-all" href={withTq('/groups')}>All &rarr;</a>
      </div>
      {g.failed ? (
        <div className="hgb-card"><div className="hgb-none">Today&rsquo;s board could not be read.</div></div>
      ) : narrow ? (
        <div className="hgb-card">
          <div className="hgb-ft">{kind === 'stand' ? 'Where you stand' : 'What just happened'}</div>
          {kind === 'stand' ? <Chase g={g} myKey={myKey} /> : <Feed g={g} myKey={myKey} rows={3} />}
        </div>
      ) : (
        <>
          <div className="hgb-card"><Chase g={g} myKey={myKey} /></div>
          <div className="hgb-card"><Feed g={g} myKey={myKey} rows={5} /></div>
        </>
      )}
    </section>
  );
}

const CSS = `
${AVATAR_CSS}
.hgb{display:flex;flex-direction:column;gap:7px;min-width:0;align-self:start;}
.hgb-h{display:flex;align-items:baseline;gap:9px;min-width:0;
  font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.hgb-nm{color:var(--stg-ink);text-decoration:none;font-weight:700;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;max-width:16ch;}
.hgb-nm:hover{text-decoration:underline;text-underline-offset:3px;}
.hgb-you{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-all{margin-left:auto;flex:none;color:var(--stg-acc-ink);text-decoration:none;}
.hgb-all:hover{opacity:.78;}
.hgb-step{display:inline-flex;align-items:center;gap:4px;flex:none;}
.hgb-step i{font-style:normal;font-variant-numeric:tabular-nums;color:var(--stg-ink2);}
.hgb-step button{width:20px;height:18px;border:1px solid var(--stg-line);border-radius:6px;
  background:none;color:var(--stg-ink2);cursor:pointer;font-size:12px;line-height:1;padding:0;}
.hgb-step button:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.hgb-step button:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}

.hgb-card{border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);
  padding:9px 12px;min-width:0;}
.hgb-ft{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:9px;letter-spacing:.11em;
  text-transform:uppercase;color:var(--stg-mute);padding-bottom:6px;}
.hgb-none{font-size:12.5px;color:var(--stg-mute);padding:3px 0;}

.hgb-chase{display:flex;flex-direction:column;gap:8px;min-width:0;}
.hgb-top{display:flex;align-items:center;gap:8px;font-size:14px;min-width:0;}
.hgb-top b{font-weight:800;white-space:nowrap;}
.hgb-em{font-style:normal;color:var(--stg-mute);font-size:12.5px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;}
.hgb-gap{margin-left:auto;flex:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;
  font-size:12.5px;font-variant-numeric:tabular-nums;}
.hgb-gap.dn{color:var(--stg-dn);}
.hgb-gap.up{color:var(--stg-up);}

.hgb-sw{display:grid;gap:5px;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;}
.hgb-sw > div{display:grid;grid-template-columns:minmax(0,58px) minmax(0,1fr) 38px;gap:8px;align-items:center;}
.hgb-sw .g{color:var(--stg-ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-sw .bar{position:relative;height:6px;border-radius:3px;background:var(--stg-surf2,rgba(255,255,255,.07));}
.hgb-sw .bar i{position:absolute;top:0;bottom:0;display:block;border-radius:3px;}
.hgb-sw .bar i.dn{background:var(--stg-dn);right:50%;}
.hgb-sw .bar i.up{background:var(--stg-up);left:50%;}
.hgb-sw .bar u{position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--stg-line2);
  text-decoration:none;}
.hgb-sw .v{text-align:right;font-variant-numeric:tabular-nums;}
.hgb-sw .v.dn{color:var(--stg-dn);}
.hgb-sw .v.up{color:var(--stg-up);}

.hgb-fr{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:center;
  padding:6px 0;border-top:1px solid var(--stg-line);font-size:13px;}
.hgb-fr:first-child{border-top:0;}
.hgb-fr .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-fr b{font-weight:700;}
.hgb-fr em{font-style:normal;color:var(--stg-mute);}
.hgb-fr .p{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12px;
  font-variant-numeric:tabular-nums;color:var(--stg-ink);white-space:nowrap;}
.hgb-fr .p i{font-style:normal;font-size:10.5px;color:var(--stg-mute);margin-left:4px;}
.hgb-fr .lead{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:8.5px;
  letter-spacing:.07em;text-transform:uppercase;color:var(--stg-warn,#fbbf24);
  background:color-mix(in srgb, var(--stg-warn,#fbbf24) 16%, transparent);
  border-radius:999px;padding:2px 6px;margin-left:5px;}

@media (max-width:640px){
  .hgb{width:100%;}
  .hgb-nm{max-width:12ch;}
}
`;
