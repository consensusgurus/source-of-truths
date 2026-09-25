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
import { ordinal, fmtPts, relTime, memberRows, MiniAvatar, AVATAR_CSS } from './groupStanding';

const gameName = (k) => (DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].name) || k;

// EVERY GAME NAMED IN THE BAND IS A WAY INTO THAT GAME (owner, 2026-09-22).
// The route comes off the registry, never the key: /parker is `park` and
// /jesters is `jester`, and a key-built href 404s on exactly those two.
function GameLink({ k, withTq = (h) => h, className = '' }) {
  const g = DAILY_GAME_MAP[k];
  if (!g) return <span className={className}>{k}</span>;
  return <a className={'hgb-gl' + (className ? ' ' + className : '')} href={withTq(g.href || '/' + k)}>{g.name}</a>;
}

// The line that says where the reader is, used as the band's own subtitle.
function standLabel(g) {
  if (g.failed) return '';
  if (!g.rank) return `${g.played} of ${g.members} played`;
  if (g.rank === 1) return 'you lead';
  return `you’re ${ordinal(g.rank)}`;
}

// THE STANDINGS (owner, 2026-09-25). Replaces the chase card, whose swing bars
// listed the games where you and one rival differ most without ever saying so.
// This is every member, their place, games finished, points and how far each
// is off the lead: nothing to decode. Games are FINISHED games (memberRows skips
// abandoned runs), the same count the ladders beside it use. Five rows at most;
// a reader outside the top four is kept as the fifth.
const SHOW = 5;
// ONE MEMBER'S DAY as a thin strip, the same height for everyone (owner,
// 2026-09-25). This replaced the separate day's-progress chart, whose rows
// repeated the names, games and points this table already carries.
function Strip({ cats, keys, hueFor }) {
  return (
    <span className="hgb-lad" aria-hidden="true">
      {cats.map(({ cat, games }) => (
        <span key={cat} style={{ flex: games.length + ' 1 0', '--cc': hueFor(cat) }}>
          {games.map((x) => <i key={x.key} className={keys && keys.has(x.key) ? 'on' : ''} />)}
        </span>
      ))}
    </span>
  );
}

function Standings({ g, myKey, cats = null, hueFor = null, total = 0 }) {
  const m = memberRows(g, myKey, 999);
  const all = [m.me, ...m.rows].filter(Boolean).sort((a, b) => b.total - a.total
    || b.games - a.games
    || String(a.username || '').localeCompare(String(b.username || '')));
  if (!all.length) return <div className="hgb-none">Nobody is in this group yet.</div>;
  let list = all.slice(0, SHOW);
  const meRow = all.find((x) => x.me);
  if (meRow && !list.includes(meRow)) list = all.slice(0, SHOW - 1).concat(meRow);
  const lead = all[0] && all[0].total > 0 ? all[0].total : 0;
  const more = all.length - list.length;
  const strips = !!(cats && hueFor);
  return (
    <div className={'hgb-st' + (strips ? ' s' : '')}>
      <div className="h"><span /><span /><span>Player</span>{strips ? <span>Today</span> : null}<span className="rt">Games</span><span className="rt">Pts</span><span className="rt">Gap</span></div>
      {list.map((r) => {
        const on = r.total > 0 || r.games > 0;
        const gap = !on ? '' : r.total >= lead ? 'lead' : '\u2212' + fmtPts(lead - r.total);
        return (
          <div key={r.userKey} className={r.me ? 'me' : ''}>
            <span className="rk">{on && r.rank ? r.rank : '\u2013'}</span>
            <MiniAvatar name={r.username} userKey={r.userKey} />
            <span className="nm">{r.me ? 'You' : r.username}</span>
            {strips ? <Strip cats={cats} keys={r.keys} hueFor={hueFor} /> : null}
            <span className="rt mu">{r.games}</span>
            <span className="rt">{on ? fmtPts(r.total) : '\u2013'}</span>
            <span className={'rt ' + (gap === 'lead' ? 'mu' : 'dn')}>{gap || '\u2013'}</span>
          </div>
        );
      })}
      {more > 0 ? <div className="more">+{more} more</div> : null}
      {strips && total ? (
        <div className="foot">Between you, <b>{memberRows(g, myKey, 999).played} of today&rsquo;s {total}</b> played</div>
      ) : null}
    </div>
  );
}

// ONE LINE PER RUN OF FINISHES (owner, 2026-09-25). Back-to-back finishes by
// the same player fold into one row: the name, a small chip per game with its
// points, the time of the newest. Five near-identical rows reading "LookAtLeo
// finished X" become one. A chip in gold is a run that leads that game in the
// group. The feed arrives newest first, so the first run is the latest.
function foldFeed(feed) {
  const out = [];
  for (const f of feed || []) {
    const last = out[out.length - 1];
    if (last && last.userKey === f.userKey) last.items.push(f);
    else out.push({ userKey: f.userKey, username: f.username, at: f.at, items: [f] });
  }
  return out;
}

function Feed({ g, myKey, rows = 5, withTq, hueFor = null }) {
  const list = foldFeed(g.feed).slice(0, rows);
  if (!list.length) {
    return <div className="hgb-feed"><div className="hgb-none">Nobody has finished anything yet today.</div></div>;
  }
  return (
    <div className="hgb-feed">
      {list.map((r, i) => (
        <div className="hgb-fx" key={r.userKey + ':' + i}>
          <MiniAvatar name={r.username} userKey={r.userKey} />
          <span className="ln">
            <b>{r.userKey === myKey ? 'You' : r.username}</b>
            {r.items.map((f, j) => {
              const gm = DAILY_GAME_MAP[f.key];
              const hue = gm && hueFor ? hueFor(gm.cat) : null;
              return (
                <a key={f.key + ':' + j} className={'hgb-chip' + (f.lead ? ' top' : '')}
                  href={withTq(gm ? (gm.href || '/' + f.key) : '/' + f.key)}
                  style={hue ? { '--cc': hue } : undefined}
                  title={f.lead ? 'Leads the group on this game' : undefined}>
                  {gameName(f.key)} <em>{fmtPts(f.points)}</em>
                </a>
              );
            })}
          </span>
          <time>{relTime(r.at)}</time>
        </div>
      ))}
    </div>
  );
}

export default function HomeGroupsBand({ data, withTq = (h) => h, narrow = false, group = null, onPick = null, cats = null, hueFor = null, total = 0 }) {
  // The face stepper is declared before the early return, so the hook order is
  // stable for any payload this component is handed. WHICH GROUP is not state
  // here: the page owns it, because it drives the ladders and the tiles too
  // (owner, 2026-09-22), and two copies of that choice would disagree.
  const [face, setFace] = useState(0);
  const groups = (data && data.groups) || [];
  if (!groups.length) return null;
  const myKey = (data && data.userKey) || null;
  const g = group || groups[0];
  if (!g) return null;

  const kind = face % 2 === 0 ? 'stand' : 'act';

  return (
    <section className="hgb sty-rev" aria-label="Your group today">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="hgb-h">
        {groups.length > 1 && onPick ? (
          // ONE GROUP AT A TIME, chosen here, and the whole page follows: the
          // panel, the member ladders, the tiles and the cap's badge.
          <span className="hgb-pick" role="group" aria-label="Which group">
            {groups.map((x) => (
              <button type="button" key={x.code} className={x.code === g.code ? 'on' : ''}
                aria-pressed={x.code === g.code} title={x.name} onClick={() => onPick(x.code)}>
                {x.name}
              </button>
            ))}
          </span>
        ) : (
          <a className="hgb-nm" href={withTq(`/groups/${g.code}`)}>{g.name}</a>
        )}
        <span className="hgb-you">{standLabel(g)}</span>
        <a className="hgb-all" href={withTq('/groups')}>All &rarr;</a>
      </div>
      {g.failed ? (
        <div className="hgb-card"><div className="hgb-none">Today&rsquo;s board could not be read.</div></div>
      ) : narrow ? (
        <div className="hgb-card">
          <div className="hgb-ft">
            {kind === 'stand' ? 'Where you stand' : 'What just happened'}
            <span className="hgb-step">
              <button type="button" aria-label="Previous" onClick={() => setFace(face + 1)}>&lsaquo;</button>
              <i>{(face % 2) + 1}/2</i>
              <button type="button" aria-label="Next" onClick={() => setFace(face + 1)}>&rsaquo;</button>
            </span>
          </div>
          {kind === 'stand' ? <Standings g={g} myKey={myKey} /> : <Feed g={g} myKey={myKey} rows={3} withTq={withTq} hueFor={hueFor} />}
        </div>
      ) : (
        <div className="hgb-cols">
          <div className="hgb-card"><Standings g={g} myKey={myKey} cats={cats} hueFor={hueFor} total={total} /></div>
          <div className="hgb-card fd"><Feed g={g} myKey={myKey} rows={24} withTq={withTq} hueFor={hueFor} /></div>
        </div>
      )}
    </section>
  );
}

const CSS = `
${AVATAR_CSS}
.hgb{display:flex;flex-direction:column;gap:7px;min-width:0;align-self:stretch;
  -webkit-text-size-adjust:100%;text-size-adjust:100%;}
/* TWO PANELS OF ONE HEIGHT (owner, 2026-09-25). The standings set the row's
   height; the right panel is size-contained, so it adds none of its own and
   simply stretches to match. NO SCROLLBAR: its list is a wrapping column
   inside a clipped box, so whichever rows do not fit wrap into a second
   column that sits outside the box. It shows the newest entries that fit,
   whole rows only, and needs no JS to measure. */
.hgb-cols{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:14px;align-items:stretch;}
.hgb-cols > .fd{contain:size;display:flex;flex-direction:column;overflow:hidden;}
.hgb-cols > .fd > .hgb-feed{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;flex-wrap:wrap;
  align-content:flex-start;overflow:hidden;column-gap:40px;}
.hgb-cols > .fd > .hgb-feed > *{width:100%;flex:none;}
@media (max-width:900px){
  .hgb-cols{grid-template-columns:minmax(0,1fr);}
  .hgb-cols > .fd{contain:none;}
  .hgb-cols > .fd > .hgb-feed{display:block;}
  .hgb-cols > .fd > .hgb-feed > :nth-child(n+6){display:none;}
}
.hgb-h{display:flex;align-items:baseline;gap:9px;min-width:0;
  font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.hgb-nm{color:var(--stg-ink);text-decoration:none;font-weight:700;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;max-width:16ch;}
.hgb-nm:hover{text-decoration:underline;text-underline-offset:3px;}
.hgb-you{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-all{margin-left:auto;flex:none;color:var(--stg-acc-ink);text-decoration:none;}
.hgb-all:hover{opacity:.78;}
.hgb-pick{display:inline-flex;align-items:center;gap:4px;min-width:0;}
.hgb-pick button{border:1px solid var(--stg-line);border-radius:999px;background:none;cursor:pointer;
  padding:2px 8px;font:inherit;color:var(--stg-ink2);max-width:11ch;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap;}
.hgb-pick button.on{border-color:transparent;background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.hgb-pick button:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.hgb-pick button.on:hover{color:var(--stg-onramp,#08222e);}
.hgb-pick button:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.hgb-ft{display:flex;align-items:center;gap:9px;}
.hgb-step{display:inline-flex;align-items:center;gap:4px;flex:none;margin-left:auto;}
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
.hgb-gl{color:inherit;text-decoration:underline;text-decoration-color:var(--stg-line2);
  text-underline-offset:3px;}
.hgb-gl:hover{text-decoration-color:currentColor;color:var(--stg-ink);}
.hgb-gl:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;border-radius:2px;}
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

.hgb-st{display:grid;font-size:13px;min-width:0;}
.hgb-st > div{display:grid;grid-template-columns:16px 22px minmax(0,1fr) 42px 36px 44px;gap:8px;
  align-items:center;padding:5px 0;border-top:1px solid var(--stg-line);}
.hgb-st > div:nth-child(2){border-top:0;}
.hgb-st > .h{border-top:0;padding:0 0 3px;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;
  font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:var(--stg-mute);}
.hgb-st .rk,.hgb-st .rt{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12px;
  font-variant-numeric:tabular-nums;}
.hgb-st .rk{color:var(--stg-mute);}
.hgb-st .rt{text-align:right;color:var(--stg-ink);}
.hgb-st .h .rt{font-size:9px;color:var(--stg-mute);}
.hgb-st .rt.mu{color:var(--stg-mute);}
.hgb-st .rt.dn{color:var(--stg-dn);}
.hgb-st .nm{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-st.s > div{grid-template-columns:16px 22px minmax(0,130px) minmax(0,1fr) 42px 40px 48px;gap:10px;padding:8px 0;}
.hgb-st.s > .h{padding:0 0 4px;}
.hgb-lad{display:flex;gap:4px;height:12px;min-width:0;}
.hgb-lad > span{display:flex;gap:1px;min-width:0;}
.hgb-lad i{flex:1 1 0;min-width:0;border-radius:1px;background:var(--stg-line);}
.hgb-lad i.on{background:var(--cc);}
/* A PHONE IN LANDSCAPE BLEW THIS LINE UP (owner, 2026-09-25). It is the only
   free-running block of prose in the band, which is exactly what mobile text
   autosizing ("font boosting") inflates on a wide viewport; every other cell
   is a nowrap grid item it leaves alone. One line, a bounded height and an
   explicit text-size-adjust take it out of the autosizer's reach. */
.hgb-st > .foot{display:block;margin-top:4px;border-top:1px solid var(--stg-line);padding-top:7px;
  font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10.5px;line-height:1.4;color:var(--stg-mute);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-height:3em;
  -webkit-text-size-adjust:100%;text-size-adjust:100%;}
.hgb-st > .foot b{font-weight:500;color:var(--stg-ink2);}
@media (max-width:640px){ .hgb-st.s .hgb-lad,.hgb-st.s .h > span:nth-child(4){display:none;}
  .hgb-st.s > div{grid-template-columns:16px 22px minmax(0,1fr) 42px 36px 44px;gap:8px;} }
.hgb-st .me .nm{color:var(--stg-acc-ink);}
.hgb-st > .more{display:block;border-top:1px solid var(--stg-line);font-size:11.5px;color:var(--stg-mute);padding-top:5px;}

.hgb-fx{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:start;
  padding:6px 0;border-top:1px solid var(--stg-line);}
.hgb-fx:first-child{border-top:0;padding-top:0;}
.hgb-fx .ln{display:flex;flex-wrap:wrap;align-items:center;gap:4px 5px;min-width:0;line-height:22px;}
.hgb-fx .ln b{font-size:13px;font-weight:700;margin-right:3px;white-space:nowrap;}
.hgb-fx time{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10.5px;color:var(--stg-mute);
  line-height:22px;white-space:nowrap;}
.hgb-chip{display:inline-flex;align-items:center;gap:4px;height:20px;padding:0 7px;border-radius:5px;
  background:var(--stg-surf2,rgba(255,255,255,.08));color:var(--stg-ink2);text-decoration:none;
  font-size:11.5px;white-space:nowrap;}
.hgb-chip::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--cc,var(--stg-mute));}
.hgb-chip em{font-style:normal;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:10.5px;
  color:var(--stg-mute);}
.hgb-chip:hover{color:var(--stg-ink);}
.hgb-chip:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}
.hgb-chip.top{background:color-mix(in srgb, var(--stg-warn,#fbbf24) 16%, transparent);
  box-shadow:inset 0 0 0 1px var(--stg-warn,#fbbf24);}
.hgb-chip.top em{color:var(--stg-warn,#fbbf24);}
.hgb-fr{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:9px;align-items:center;
  padding:6px 0;border-top:1px solid var(--stg-line);font-size:13px;}
.hgb-fr:first-child{border-top:0;}
.hgb-fr .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hgb-fr b{font-weight:700;}
.hgb-fr em{font-style:normal;color:var(--stg-mute);}
.hgb-fr .p{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12px;
  font-variant-numeric:tabular-nums;color:var(--stg-ink);white-space:nowrap;}
.hgb-fr .p i{font-style:normal;font-size:10.5px;color:var(--stg-mute);margin-left:4px;}
.hgb-fr .lead{font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:9.5px;font-weight:500;
  letter-spacing:.12em;text-transform:uppercase;color:var(--stg-warn,#fbbf24);
  background:color-mix(in srgb, var(--stg-warn,#fbbf24) 16%, transparent);
  border-radius:999px;padding:2px 6px;margin-left:5px;}

@media (max-width:640px){
  .hgb{width:100%;}
  .hgb-nm{max-width:12ch;}
}
`;

// Shared with HomeFieldBand, so the Everyone band wears exactly these cards.
export const HGB_CSS = CSS;
