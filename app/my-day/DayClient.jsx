'use client';

// MIND LOFT DAILY: THE PAPER (owner, 2026-11-21, the Morning Loft mockups on
// the real site). One page, three states, read from this browser:
//   no day yet    the invite and Build Your Day
//   being read    the front page: masthead, the edition line, the button to
//                 the next unread page, then every page in order
//   all read      the back page: the results, then What's New, What's
//                 Popular and What's Similar in three newspaper columns
// The masthead's edition follows the reader's own clock (Morning, Afternoon,
// Evening, Night Edition); the puzzles and the date stay on the Eastern day.
// No time estimates anywhere (owner: "I don't like the time requirement").
// Each page is the game's own daily, opened with ?run= so the rail hands the
// reader to the next page and back here (app/DailyRunRail.jsx).
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { DAILY_GAME_MAP, PREMIERES, LAUNCH_DAILY } from '@/lib/daily-games';
import { getMyDay, saveMyDay, dailyRunHref, playedToday, DAY_META, editionNow, buildableGames, countDayEvent, trackMyDay } from '@/lib/daily-run';
import { dailyMeIdentity } from '../dailyMeClient';
import { savedIdentity } from '@/lib/saved-identity';
import { catWord, hueVars, resultText, CSS as RUN_CSS } from '../run/RunPageClient';

function etDay() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function longDay(iso) {
  try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}
function weekday(iso) {
  try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }); }
  catch (e) { return 'Today'; }
}
// A game's launch day, as the home's Newest sort reads it.
const LAUNCHED = (() => {
  const m = {};
  try {
    for (const x of PREMIERES) if (x && x.key && x.from && (!m[x.key] || x.from < m[x.key])) m[x.key] = x.from;
    for (const k of Object.keys(LAUNCH_DAILY || {})) if (!m[k]) m[k] = LAUNCH_DAILY[k];
  } catch (e) { /* no dates: What's New stays empty */ }
  return m;
})();

export default function DayClient() {
  const [keys, setKeys] = useState(null);
  const [played, setPlayed] = useState({});
  const [me, setMe] = useState('');
  const [ed, setEd] = useState(null);
  const [day, setDay] = useState(null);
  const [board, setBoard] = useState(null);
  const [week, setWeek] = useState(null);
  const [added, setAdded] = useState({});

  useEffect(() => {
    const read = () => {
      const k = getMyDay();
      setKeys(k);
      setPlayed(Object.fromEntries(k.map((x) => [x, playedToday(x)])));
      setEd(editionNow());
      setDay(etDay());
    };
    read();
    setMe(savedIdentity().username || '');
    // Back from a game with the browser's back button: read the ticks again.
    const vis = () => { if (document.visibilityState === 'visible') read(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', read);
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('pageshow', read); };
  }, []);

  const n = keys ? keys.length : 0;
  const doneN = keys ? keys.filter((k) => played[k]).length : 0;
  const allDone = n >= 2 && doneN === n;
  const nextKey = keys ? keys.find((k) => !played[k]) || null : null;
  const next = nextKey ? DAILY_GAME_MAP[nextKey] : null;

  useEffect(() => { if (n >= 2) countDayEvent(allDone ? 'my-day-finished' : 'my-day-opened'); }, [n, allDone]);
  useEffect(() => { if (keys && n >= 2) trackMyDay('opened', keys, doneN); }, [keys, n, doneN]);

  // The back page's results: today's rows for these games, ranked the way a run is.
  useEffect(() => {
    if (!allDone || !keys) return undefined;
    let alive = true;
    const { anonId, email } = dailyMeIdentity();
    const q = new URLSearchParams({ keys: keys.join(','), full: '1', fresh: '1' });
    if (anonId) q.set('anonId', anonId);
    if (email) q.set('email', email);
    fetch(`/api/quiz/daily-combined?${q.toString()}`).then((r) => r.json()).then((d) => { if (alive) setBoard(d || {}); }).catch(() => { if (alive) setBoard({}); });
    fetch('/api/quiz/my-plays').then((r) => r.json()).then((d) => { if (alive) setWeek((d && d.week) || {}); }).catch(() => { if (alive) setWeek({}); });
    return () => { alive = false; };
  }, [allDone, keys && keys.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // THE BACK PAGE'S THREE COLUMNS (owner, 2026-11-21: "an end screen that
  // advertises what is new, what is popular, what is similar, in three
  // newspaper columns"). Never a puzzle already in the paper or played today.
  const cols = useMemo(() => {
    if (!allDone || !keys) return null;
    const inDay = new Set(keys);
    const pool = buildableGames().map((g) => g.key).filter((k) => !inDay.has(k) && !playedToday(k));
    const taken = new Set();
    const take = (list) => { const out = []; for (const k of list) { if (out.length >= 3) break; if (!taken.has(k)) { out.push(k); taken.add(k); } } return out; };
    const fresh = take(pool.filter((k) => LAUNCHED[k]).sort((a, b) => String(LAUNCHED[b]).localeCompare(String(LAUNCHED[a]))));
    const w = week || {};
    const pop = week ? take(pool.slice().sort((a, b) => (w[b] || 0) - (w[a] || 0))) : [];
    const catN = {};
    keys.forEach((k) => { const c = (DAILY_GAME_MAP[k] || {}).cat; if (c) catN[c] = (catN[c] || 0) + 1; });
    const sim = take(pool.filter((k) => catN[(DAILY_GAME_MAP[k] || {}).cat])
      .sort((a, b) => (catN[DAILY_GAME_MAP[b].cat] - catN[DAILY_GAME_MAP[a].cat]) || ((w[b] || 0) - (w[a] || 0))));
    return [['What’s New', fresh], ['What’s Popular', pop], ['What’s Similar', sim]];
  }, [allDone, keys, week]);

  const add = (k) => {
    const cur = getMyDay();
    if (!cur.includes(k)) { saveMyDay([...cur, k]); trackMyDay('edited', [...cur, k], doneN); }
    setAdded((m) => ({ ...m, [k]: true }));
  };

  const edVars = ed ? { '--ed': ed.colour } : {};
  const mast = (line) => (
    <div className="dl-mast">
      <b>Mind Loft Daily</b>
      <span>{line}</span>
    </div>
  );
  const dateLine = day ? longDay(day) : '';

  // Not read yet: the masthead alone, so the page never flashes the invite.
  if (!keys || !ed) {
    return (
      <CircuitFrame label="Mind Loft Daily" bar={{ title: 'Mind Loft Daily' }}>
        <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
        <div className="br dl">{mast(' ')}</div>
      </CircuitFrame>
    );
  }

  if (n < 2) {
    return (
      <CircuitFrame label="Mind Loft Daily" bar={{ title: 'Mind Loft Daily' }}>
        <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
        <div className="br dl" style={edVars}>
          {mast(`${dateLine} · ${ed.name} Edition`)}
          <section className="br-card br-pad dl-inv">
            <h2>Your puzzles. One paper. Every day.</h2>
            <p>Pick the puzzles you love once. Every day they arrive here as one paper, played straight through, page by page.</p>
          </section>
          <div className="br-acts">
            <a className="br-go dl-go" href="/build-a-run">Build Your Day</a>
            <p className="br-tiny">No sign up needed. Each puzzle also counts on its own daily board.</p>
          </div>
        </div>
      </CircuitFrame>
    );
  }

  const hello = `${ed.hello}${me ? `, ${me}` : ''}${ed.id === 'night' ? '?' : ''}`;
  const myPer = (board && board.me && board.me.perGame) || {};
  const myRank = board && board.me && board.me.rank ? board.me.rank : null;
  const field = board ? (board.overallField || 0) : 0;

  return (
    <CircuitFrame label="Mind Loft Daily" progress={n ? doneN / n : 0} bar={{ title: 'Mind Loft Daily', sub: day ? weekday(day) : null }}>
      <style dangerouslySetInnerHTML={{ __html: RUN_CSS + CSS }} />
      <div className="br dl" style={edVars}>
        {mast(allDone ? `Final Edition · ${dateLine}` : `${dateLine} · ${ed.name} Edition`)}
        <div className="dl-greet"><span>{hello}</span><span>{n} Pages</span></div>

        {allDone ? (
          <>
            <section className="br-band dl-band" aria-label="Your paper">
              <span className="br-bl">{weekday(day)}&rsquo;s Paper</span>
              <b className="br-bv">All {n} Pages Read</b>
              <span className="br-bs">{myRank ? `#${myRank} of ${Math.max(field, myRank)} who read this paper today` : board ? (board.me ? 'Choose a name to take a rank on the board' : 'Your results are landing') : 'Reading the board'}</span>
            </section>
            <section className="br-card" aria-label="Your results">
              <div className="br-hh"><span>Page</span><span>Result</span><span>Rank</span></div>
              {keys.map((k) => {
                const g = DAILY_GAME_MAP[k];
                const p = myPer[k];
                return (
                  <a key={k} className="br-hrow dl-hrow" href={g.href}>
                    <span className="br-gn"><span className="br-sw sm" style={hueVars(k)}><GameGlyph gameKey={k} size={15} /></span>{g.name}</span>
                    <span className="br-v win">{resultText(k, p) || (board ? 'Read' : '...')}</span>
                    <span className="br-v">{p && p.rank ? `#${p.rank} of ${p.field || p.rank}` : ''}</span>
                  </a>
                );
              })}
            </section>
            {cols ? (
              <section className="dl-cols" aria-label="More to play">
                {cols.map(([h, list]) => (
                  <div key={h} className="dl-col">
                    <div className="dl-ch">{h}</div>
                    {!list.length ? <p className="dl-none">{h === 'What’s Popular' && !week ? 'Reading the counts' : 'Nothing new today'}</p> : null}
                    {list.map((k) => {
                      const g = DAILY_GAME_MAP[k];
                      return (
                        <div key={k} className="dl-it">
                          <a className="dl-itl" href={g.href}>
                            <span className="br-sw" style={hueVars(k)}><GameGlyph gameKey={k} size={18} /></span>
                            <span className="dl-ey">{catWord(g.cat)}</span>
                            <b>{g.name}</b>
                            <small>{g.tag}</small>
                          </a>
                          <button type="button" className="dl-add" onClick={() => add(k)} disabled={!!added[k]}>{added[k] ? 'Added to Your Day' : '+ Add to My Day'}</button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </section>
            ) : null}
            <div className="br-acts">
              <a className="br-btn" href="/build-a-run">Edit My Day</a>
              <a className="br-btn" href="/">Back to Mind Loft</a>
            </div>
          </>
        ) : (
          <>
            <section className="br-card dl-front" aria-label="Today's paper">
              <div className="br-ch"><h2>{weekday(day)}&rsquo;s Paper</h2><span>{doneN} of {n} read</span></div>
              <div className="dl-strip" aria-hidden="true">
                {keys.map((k) => <span key={k} className={played[k] ? 'on' : ''} style={hueVars(k)} />)}
              </div>
              <div className="br-pad">
                <a className="br-go dl-go" href={dailyRunHref(nextKey, keys, DAY_META)}>
                  {!doneN ? 'Open the Paper' : ed.id === 'night' ? `Finish the Paper: ${next.name}` : `Keep Reading: ${next.name}`}
                </a>
              </div>
            </section>
            <section className="br-card" aria-label="Today's edition">
              <div className="br-ch"><h2>Today&rsquo;s Edition</h2><a className="dl-edit" href="/build-a-run">Edit My Day</a></div>
              {keys.map((k, i) => {
                const g = DAILY_GAME_MAP[k];
                return (
                  <a key={k} className={'br-row' + (played[k] ? ' done' : '')} href={dailyRunHref(k, keys, DAY_META)}>
                    <span className="dl-pg">{i + 1}</span>
                    <span className="br-sw" style={hueVars(k)}><GameGlyph gameKey={k} size={18} /></span>
                    <span className="br-rt"><b>{g.name}</b><small>{catWord(g.cat)} · {g.tag}</small></span>
                    {played[k] ? <span className="br-chip">Read</span> : k === nextKey ? <span className="dl-next">Next</span> : null}
                  </a>
                );
              })}
            </section>
            <p className="br-tiny">Each puzzle also counts on its own daily board, first try only.</p>
          </>
        )}
      </div>
    </CircuitFrame>
  );
}

const CSS = `
.dl{--ed:#7dd3fc;}
.dl-mast{border-top:5px solid var(--ed);border-bottom:1px solid var(--stg-ink);text-align:center;padding:12px 0 10px;}
.dl-mast b{display:block;font-size:40px;font-weight:900;letter-spacing:-.03em;line-height:1.1;padding-bottom:.08em;color:var(--stg-ink);}
.dl-mast span{display:block;margin-top:3px;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);}
.dl-greet{display:flex;justify-content:space-between;gap:10px;margin-top:-6px;padding:0 2px;font-size:13.5px;font-weight:700;color:var(--stg-ink);}
.dl .br-go.dl-go{background:var(--ed);color:#0b1b2b;}
.dl-band{background:var(--ed);}
html:not([data-stage-boot='dark']) .cfr[data-stage-theme='light'] .dl-band{background:color-mix(in srgb, var(--ed) 60%, #fff);}
.dl-strip{display:flex;height:14px;border-bottom:1px solid var(--stg-ink);}
.dl-strip span{flex:1;border-left:1px solid var(--stg-ink);background:transparent;}
.dl-strip span:first-child{border-left:0;}
.dl-strip span.on{background:var(--gp);}
.dl-pg{flex:none;width:18px;text-align:center;font-size:13px;font-weight:800;color:var(--stg-mute);}
.dl-next{flex:none;height:24px;padding:0 10px;border-radius:12px;border:1px solid var(--stg-ink);display:inline-flex;align-items:center;font-size:11px;font-weight:800;color:var(--stg-ink);}
.dl-edit{font-size:12.5px;font-weight:800;color:var(--stg-ink);text-decoration:underline;text-underline-offset:3px;}
.dl-hrow{text-decoration:none;color:inherit;}
.dl-hrow:hover{background:var(--stg-surf2);}
.dl-inv h2{margin:0 0 6px;font-size:20px;font-weight:800;color:var(--stg-ink);}
.dl-inv p{margin:0;font-size:14px;line-height:1.45;font-weight:600;color:var(--stg-ink2);}
.dl-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;border-top:3px solid var(--stg-ink);padding-top:10px;}
.dl-ch{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--stg-ink);padding-bottom:6px;margin-bottom:10px;color:var(--stg-ink);white-space:nowrap;}
.dl-it{padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--stg-line);}
.dl-it:last-child{border-bottom:0;margin-bottom:0;}
.dl-itl{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-decoration:none;color:var(--stg-ink);}
.dl-itl b{font-size:16px;font-weight:800;line-height:1.2;padding-bottom:.06em;}
.dl-itl small{font-size:12px;font-weight:600;line-height:1.3;color:var(--stg-mute);}
.dl-ey{margin-top:8px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}
.dl-add{margin-top:6px;border:0;background:transparent;padding:4px 0;font-family:inherit;font-size:12px;font-weight:800;text-align:left;text-decoration:underline;text-underline-offset:3px;color:var(--stg-ink);cursor:pointer;}
.dl-add:disabled{text-decoration:none;color:var(--stg-mute);cursor:default;}
.dl-none{margin:0;font-size:12px;font-weight:600;color:var(--stg-mute);}
@media (max-width:420px){.dl-mast b{font-size:34px;}.dl-itl b{font-size:14.5px;}.dl-ch{font-size:10px;letter-spacing:.05em;}.dl-cols{gap:9px;}}
`;
