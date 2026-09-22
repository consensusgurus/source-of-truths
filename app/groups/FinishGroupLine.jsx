'use client';
// THE GROUP LINE ON THE FINISH SCREEN (owner, 2026-09-17, idea 1 of the group
// standings set). The moment a daily ends, where that result puts the player in
// each of their groups: the first group gets a small board, any others one line
// each. Nothing renders for a player in no group, or before the read lands.
//
// THE MOVE IS WORKED OUT, NOT STORED. The standing read carries the player's
// points per game and every member's total, so "before this game" is the same
// day's best-N total with this game taken out, placed against the others. A
// score can post a beat after the card opens, so the read is retried until this
// game's points appear (three tries), and the line simply waits till then.
import { useEffect, useState } from 'react';
import {
  fetchGroupStanding, invalidateGroupStanding, ordinal, fmtPts, placeFor, totalWithout,
  MiniAvatar, AVATAR_CSS,
} from './groupStanding';
// The run in the GAME'S own units, the same reading the board above the card
// and the tile panel use.
import { gameStats } from '@/lib/daily-row-stats';

const TRIES = [0, 2500, 6000, 12000];

// THE GAME COMES FIRST WHEN THE GROUP PLAYED IT (owner, 2026-09-21: "this
// should show you vs group members for the game, if others played the game.
// otherwise this is fine"). A player who just finished Sando wants to know how
// that run compares with the people they play with, not only where the day's
// totals leave them. So when another member has a row on THIS game, the card
// leads with that board and keeps the day's standing as one line under it. When
// nobody else has played it, the card is exactly what it was.
const GAME_ROWS = 5;

export default function FinishGroupLine({ gameKey, gameName = null, missLabel = null }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!gameKey) return undefined;
    invalidateGroupStanding();
    let alive = true;
    const timers = [];
    let n = 0;
    const attempt = () => {
      fetchGroupStanding({ fresh: true }).then((d) => {
        if (!alive) return;
        const groups = d && d.groups ? d.groups.filter((g) => !g.failed) : [];
        if (!groups.length) { if (d) setData(null); return; }
        const landed = groups.some((g) => g.myPoints && g.myPoints[gameKey] != null);
        if (landed || n >= TRIES.length - 1) {
          setData(landed ? d : null);
          return;
        }
        n += 1;
        timers.push(setTimeout(attempt, TRIES[n] - TRIES[n - 1]));
      });
    };
    attempt();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [gameKey]);

  if (!data) return null;
  const groups = data.groups.filter((g) => !g.failed && g.rank);
  if (!groups.length) return null;

  // An archive replay (?p=) does not move today's board, so it gets no arrow.
  const archived = typeof window !== 'undefined' && /[?&]p=/.test(window.location.search);
  const moveOf = (g) => {
    if (archived) return null;
    const before = totalWithout(g.myPoints, gameKey, data.bestN);
    // No earlier total means this is their first game of the day in that
    // group: there is no move to report, so the headline stands alone.
    const prev = placeFor(before, g.rows, data.userKey);
    if (prev == null) return null;
    return { delta: prev - g.rank };
  };
  const Move = ({ m }) => {
    if (!m) return null;
    if (!m.delta) return null;
    return <em className={'fgl-mv ' + (m.delta > 0 ? 'up' : 'dn')}>{m.delta > 0 ? '▲' : '▼'} {Math.abs(m.delta)}</em>;
  };

  const [lead, ...rest] = groups;
  const lm = moveOf(lead);
  const rows = lead.top.slice(0, 3);
  const mineInTop = rows.some((r) => r.userKey === data.userKey);
  const mine = mineInTop ? null : { userKey: data.userKey, username: data.username, rank: lead.rank, total: lead.total };

  // This game's own group board, when somebody else in the group has played it.
  const gAll = (lead.boards && lead.boards[gameKey]) || [];
  const gMine = gAll.find((r) => r.userKey === data.userKey) || null;
  const onGame = gAll.length > 1 && !!gMine;
  let gRows = gAll.slice(0, GAME_ROWS);
  if (gMine && !gRows.some((r) => r.userKey === data.userKey)) gRows = gRows.slice(0, GAME_ROWS - 1).concat([gMine]);
  const gField = gAll.length;

  return (
    <section className="fgl">
      <style dangerouslySetInnerHTML={{ __html: AVATAR_CSS + CSS }} />
      <div className="stf-eb">Your groups today</div>
      <div className="fgl-card">
        <div className="fgl-h">
          <b>{lead.name}</b>
          <span className="fgl-pill">{lead.members} {lead.members === 1 ? 'member' : 'members'}</span>
        </div>
        {onGame ? (
          <>
            <p className="fgl-big">
              {gMine.rank === 1
                ? `You lead${gameName ? ` on ${gameName}` : ''}`
                : `You're ${ordinal(gMine.rank)} of ${gField}${gameName ? ` on ${gameName}` : ''}`}
            </p>
            <div className="fgl-rows">
              {gRows.map((r) => (
                <div key={r.userKey} className={'fgl-r g' + (r.userKey === data.userKey ? ' me' : '')}>
                  <span className="k">{r.rank}</span>
                  <MiniAvatar name={r.username} userKey={r.userKey} />
                  <span className="n">{r.userKey === data.userKey ? 'You' : r.username}</span>
                  <span className="run">{gameStats(r, missLabel) || '\u2014'}</span>
                  <span className="s">{fmtPts(r.points)}</span>
                </div>
              ))}
            </div>
            {/* The day is still worth a line: this game is one of its games. */}
            <p className="fgl-gap">
              <b>{ordinal(lead.rank)} of {lead.played} on today&rsquo;s board</b> <Move m={lm} />
              {lead.gap != null && lead.ahead ? ` \u00b7 ${fmtPts(lead.gap)} behind ${lead.ahead.username}` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="fgl-big">
              {lead.rank === 1 ? 'You lead today' : `You're ${ordinal(lead.rank)} today`} <Move m={lm} />
            </p>
            <div className="fgl-rows">
              {rows.map((r) => (
                <div key={r.userKey} className={'fgl-r' + (r.userKey === data.userKey ? ' me' : '')}>
                  <span className="k">{r.rank}</span>
                  <MiniAvatar name={r.username} userKey={r.userKey} />
                  <span className="n">{r.userKey === data.userKey ? 'You' : r.username}</span>
                  <span className="s">{fmtPts(r.total)}</span>
                </div>
              ))}
              {mine ? (
                <div className="fgl-r me">
                  <span className="k">{mine.rank}</span>
                  <MiniAvatar name={mine.username} userKey={mine.userKey} />
                  <span className="n">You</span>
                  <span className="s">{fmtPts(mine.total)}</span>
                </div>
              ) : null}
            </div>
            {lead.gap != null && lead.ahead ? (
              <p className="fgl-gap">{fmtPts(lead.gap)} behind {lead.ahead.username}</p>
            ) : null}
          </>
        )}
        <a className="fgl-link" href={`/groups/${lead.code}`}>Open the group board &rarr;</a>
      </div>
      {rest.map((g) => (
        <a key={g.code} className="fgl-mini" href={`/groups/${g.code}`}>
          <span><b>{g.name}</b> &middot; {ordinal(g.rank)} of {g.played}</span>
          <Move m={moveOf(g)} />
        </a>
      ))}
    </section>
  );
}

const CSS = `
.fgl{margin-top:4px;}
.fgl-card{background:var(--stg-raise,#0e131f);border:1px solid var(--stg-line,rgba(255,255,255,.11));border-radius:14px;padding:13px 14px 10px;}
.fgl-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;}
.fgl-h b{font-size:14.5px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fgl-pill{flex:none;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;
  border:1px solid var(--stg-line2,rgba(255,255,255,.17));border-radius:999px;padding:2px 8px;color:var(--stg-ink2,#aab5c7);}
.fgl-big{margin:4px 0 6px;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.fgl-mv{font-style:normal;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12.5px;font-weight:600;margin-left:6px;white-space:nowrap;}
.fgl-mv.up{color:var(--stg-up,#6ee7b7);}
.fgl-mv.dn{color:var(--stg-dn,#fb7185);}
.fgl-rows{display:flex;flex-direction:column;}
.fgl-r{display:grid;grid-template-columns:18px 22px 1fr auto;gap:10px;align-items:center;padding:6px 0;border-top:1px solid var(--stg-line,rgba(255,255,255,.11));font-size:13.5px;}
.fgl-r:first-child{border-top:0;}
.fgl-r .k{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12px;color:var(--stg-mute,#8b95a8);text-align:right;}
.fgl-r .n{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fgl-r .s{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12.5px;font-variant-numeric:tabular-nums;}
/* A GAME ROW carries the run as well as what it was worth: 10/10 · 4:49 · 15. */
.fgl-r.g{grid-template-columns:18px 22px minmax(0,1fr) auto auto;}
.fgl-r.g .run{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11.5px;
  color:var(--stg-mute,#8b95a8);white-space:nowrap;}
.fgl-gap b{font-weight:800;color:var(--stg-ink,#e9edf4);}
.fgl-r.me{background:color-mix(in srgb, var(--stg-brand,#7dd3fc) 14%, transparent);margin:0 -8px;padding:6px 8px;border-radius:8px;border-top-color:transparent;}
.fgl-r.me + .fgl-r{border-top-color:transparent;}
.fgl-r.me .n{font-weight:800;}
.fgl-gap{margin:6px 0 0;font-size:12.5px;color:var(--stg-mute,#8b95a8);}
.fgl-link{display:inline-block;margin-top:8px;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--stg-ink,#e9edf4);text-decoration:underline;text-underline-offset:3px;}
.fgl-mini{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;padding:10px 14px;border-radius:12px;
  border:1px solid var(--stg-line,rgba(255,255,255,.11));background:var(--stg-raise,#0e131f);color:var(--stg-ink,#e9edf4);text-decoration:none;font-size:13.5px;}
.fgl-mini:hover{border-color:var(--stg-line2,rgba(255,255,255,.17));}
`;
