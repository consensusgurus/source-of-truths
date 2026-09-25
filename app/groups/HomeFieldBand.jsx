'use client';
// EVERYONE, on the home (owner, 2026-09-25). The group band's twin for the
// whole field: the same two cards in the same classes, so the top row reads
// the same whichever view is chosen.
//
//   WHERE YOU STAND   your place on today's site board, the player directly
//                     above you and the gap, and the players either side.
//   WHAT JUST HAPPENED  the live feed, which carries NO NAMES. That is the
//                     feed's standing rule and it holds here too.
//
// Everything comes from reads the home already makes (the combined board and
// the live feed), handed down as props. No request of its own.
import { useState } from 'react';
import { MiniAvatar, fmtPts } from './groupStanding';
import { HGB_CSS } from './HomeGroupsBand';

function Stand({ overall, meKey, me: meRow = null, field = 0 }) {
  const idx = meKey ? overall.findIndex((r) => r && r.userKey === meKey) : -1;
  // OUTSIDE THE TOP TEN (2026-09-25). The board payload carries the top ten in
  // `overall` and the reader's own row in `me`, so a reader in 12th was told
  // they were "not on today's board yet". Show the top three, then the reader,
  // and how far they are from the tenth place.
  if (idx < 0 && meRow && meRow.rank) {
    const tenth = overall[overall.length - 1] || null;
    const near = overall.slice(0, 3);
    return (
      <div className="hgb-chase">
        <div className="hgb-top">
          <MiniAvatar name={meRow.username} userKey={meRow.userKey} />
          <b>You&rsquo;re #{meRow.rank}</b>
          {tenth ? <span className="hgb-em">to reach #{tenth.rank}</span> : null}
          {tenth ? <span className="hgb-gap dn">{fmtPts((tenth.total || 0) - (meRow.total || 0))}</span> : null}
        </div>
        <div className="hfb-near">
          {near.map((r) => (
            <div key={r.userKey}>
              <span className="rk">#{r.rank}</span>
              <MiniAvatar name={r.username} userKey={r.userKey} />
              <span className="nm">{r.username}</span>
              <span className="gp">{typeof r.gamesPlayed === 'number' ? r.gamesPlayed : ''}</span>
              <span className="pt">{fmtPts(r.total)}</span>
            </div>
          ))}
          <div className="me sep">
            <span className="rk">#{meRow.rank}</span>
            <MiniAvatar name={meRow.username} userKey={meRow.userKey} />
            <span className="nm">You</span>
            <span className="gp">{typeof meRow.gamesPlayed === 'number' ? meRow.gamesPlayed : ''}</span>
            <span className="pt">{fmtPts(meRow.total)}</span>
          </div>
        </div>
      </div>
    );
  }
  if (idx < 0) {
    const n = field || overall.length;
    return (
      <div className="hgb-chase">
        <div className="hgb-top">
          <b>Not on today&rsquo;s board yet</b>
          <span className="hgb-em">{n.toLocaleString()} {n === 1 ? 'player is' : 'players are'}</span>
        </div>
      </div>
    );
  }
  const me = overall[idx];
  const above = idx > 0 ? overall[idx - 1] : null;
  const below = overall[idx + 1] || null;
  const near = [above, me, below].filter(Boolean);
  return (
    <div className="hgb-chase">
      {above ? (
        <div className="hgb-top">
          <MiniAvatar name={above.username} userKey={above.userKey} />
          <b>{above.username}</b>
          <span className="hgb-em">is ahead of you</span>
          <span className="hgb-gap dn">{fmtPts((above.total || 0) - (me.total || 0))}</span>
        </div>
      ) : (
        <div className="hgb-top">
          <MiniAvatar name={me.username} userKey={me.userKey} />
          <b>You lead</b>
          {below ? <span className="hgb-em">{below.username} is closest</span> : null}
          {below ? <span className="hgb-gap up">{fmtPts((me.total || 0) - (below.total || 0))}</span> : null}
        </div>
      )}
      <div className="hfb-near">
        {near.map((r) => (
          <div key={r.userKey} className={r.userKey === meKey ? 'me' : ''}>
            <span className="rk">#{r.rank}</span>
            <MiniAvatar name={r.username} userKey={r.userKey} />
            <span className="nm">{r.userKey === meKey ? 'You' : r.username}</span>
            <span className="gp">{typeof r.gamesPlayed === 'number' ? r.gamesPlayed : ''}</span>
            <span className="pt">{fmtPts(r.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Live({ live, rows }) {
  const list = live.slice(0, rows);
  if (!list.length) {
    return <div className="hgb-feed"><div className="hgb-none">No plays yet today.</div></div>;
  }
  return (
    <div className="hgb-feed">
      {list.map((f, i) => (
        <div className="hgb-fr hfb-fr" key={f.href + i} style={{ '--cc': f.hue }}>
          <span className="dot" aria-hidden="true" />
          <span className="t"><em>Someone finished</em> <a className="hgb-gl" href={f.href}>{f.name}</a></span>
          <span className="p">{f.score}<i>/{f.total}</i> <i>{f.when}</i></span>
        </div>
      ))}
    </div>
  );
}

export default function HomeFieldBand({ overall = [], meKey = null, me = null, live = [], field = 0, narrow = false, boardHref = '#sty-board' }) {
  const [face, setFace] = useState(0);
  const idx = meKey ? overall.findIndex((r) => r && r.userKey === meKey) : -1;
  const count = field || overall.length;
  const kind = face % 2 === 0 ? 'stand' : 'act';
  return (
    <section className="hgb sty-rev" aria-label="Everyone today">
      <style dangerouslySetInnerHTML={{ __html: HGB_CSS + CSS }} />
      <div className="hgb-h">
        <span className="hgb-nm">Everyone</span>
        <span className="hgb-you">{idx >= 0 ? `you’re #${overall[idx].rank} of ${count.toLocaleString()}` : me && me.rank ? `you’re #${me.rank} of ${count.toLocaleString()}` : `${count.toLocaleString()} playing today`}</span>
        <a className="hgb-all" href={boardHref}>Board &rarr;</a>
      </div>
      {narrow ? (
        <div className="hgb-card">
          <div className="hgb-ft">
            {kind === 'stand' ? 'Where you stand' : 'What just happened'}
            <span className="hgb-step">
              <button type="button" aria-label="Previous" onClick={() => setFace(face + 1)}>&lsaquo;</button>
              <i>{(face % 2) + 1}/2</i>
              <button type="button" aria-label="Next" onClick={() => setFace(face + 1)}>&rsaquo;</button>
            </span>
          </div>
          {kind === 'stand' ? <Stand overall={overall} meKey={meKey} me={me} field={count} /> : <Live live={live} rows={3} />}
        </div>
      ) : (
        <div className="hgb-cols">
          <div className="hgb-card"><Stand overall={overall} meKey={meKey} me={me} field={count} /></div>
          <div className="hgb-card fd"><Live live={live} rows={24} /></div>
        </div>
      )}
    </section>
  );
}

const CSS = `
.hfb-near{display:grid;gap:0;font-size:13px;}
.hfb-near > div{display:grid;grid-template-columns:34px 22px minmax(0,1fr) auto 38px;gap:8px;align-items:center;
  padding:5px 0;border-top:1px solid var(--stg-line);}
.hfb-near > div:first-child{border-top:0;}
.hfb-near .rk,.hfb-near .gp,.hfb-near .pt{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12px;
  font-variant-numeric:tabular-nums;}
.hfb-near .rk,.hfb-near .gp{color:var(--stg-mute);}
.hfb-near .pt{text-align:right;color:var(--stg-ink);}
.hfb-near .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;}
.hfb-near .me .nm{color:var(--stg-acc-ink);}
.hfb-near > div.sep{border-top:1px dashed var(--stg-line2);}
.hfb-fr .dot{width:8px;height:8px;border-radius:2px;background:var(--cc,var(--stg-mute));justify-self:center;}
`;
