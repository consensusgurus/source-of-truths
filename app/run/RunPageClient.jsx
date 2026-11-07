'use client';

// THE BUILT RUN'S PAGE (owner, 2026-11-07). One page, three states, read from
// what this browser has played today:
//   not started  the invite: the games in order and Start the Run
//   part played  the same list with ticks, and Keep Going: <next game>
//   all played   the head-to-head against the maker (game by game) and the
//                run board: everyone who played all of them today
// Every game is its own ordinary daily, opened with ?run= so its rail carries
// the player to the next one and back here at the end (app/DailyRunRail.jsx).
// A game already played today is BANKED: it counts as it stands, first try only.
import { useEffect, useMemo, useState } from 'react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { DAILY_GAME_MAP, scoreText, scoreView } from '@/lib/daily-games';
import { categoryColor, sitePastelHex } from '@/lib/category-ramp';
import { dailyRunHref, playedToday, builtRunHref, rememberRun, listMyRuns, cleanRunName, cleanMaker } from '@/lib/daily-run';
import { dailyMeIdentity } from '../dailyMeClient';
import { savedIdentity } from '@/lib/saved-identity';

const LIGHT = "html:not([data-stage-boot='dark']) .cfr[data-stage-theme='light']";

export function catWord(cat) {
  if (cat === 'Word') return 'Words';
  if (cat === 'Crowd Psychology') return 'Crowd';
  return cat || '';
}
export function hueVars(key) {
  const g = DAILY_GAME_MAP[key] || {};
  const raw = categoryColor(g.cat);
  return { '--gd': raw, '--gp': sitePastelHex(raw) };
}

function etDay() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function dayLabel(iso) {
  try { return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}
function clock(s) {
  const n = Number(s);
  if (s == null || !Number.isFinite(n) || n <= 0) return '';
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
}
// One game's result as the boards print it: the deciding stat, plus the clock
// where the game is solve-or-not (Solved 2:14).
function resultText(key, p) {
  if (!p) return null;
  if (p.abandoned) return 'Fail';
  const t = scoreText(key, p.score, p.total);
  const sv = scoreView(key);
  const c = clock(p.timeElapsed);
  if (t === 'Unfinished') return 'Fail';
  if (sv && sv.v === 'verdict' && t === 'Solved' && c) return `Solved ${c}`;
  return t;
}
// Who took a game: more placement points wins; equal points is a tie.
function winner(a, b) {
  const pa = a && !a.abandoned ? Number(a.points) || 0 : -1;
  const pb = b && !b.abandoned ? Number(b.points) || 0 : -1;
  if (pa === pb) return 0;
  return pa > pb ? 1 : -1;
}

export default function RunPageClient({ keys = [], name = 'A Mind Loft Run', by = '', fresh = false }) {
  const meta = useMemo(() => ({ name, by }), [name, by]);
  const [day, setDay] = useState(null);
  const [played, setPlayed] = useState({});
  const [me, setMe] = useState('');
  const [board, setBoard] = useState(null);
  const [state, setState] = useState('loading');
  const [copied, setCopied] = useState('');
  // Built in this browser (My Runs marks it), which is how a maker with no
  // name is still recognised as the maker.
  const [mine, setMine] = useState(false);
  const link = builtRunHref(keys, meta, true);

  useEffect(() => {
    setDay(etDay());
    setPlayed(Object.fromEntries(keys.map((k) => [k, playedToday(k)])));
    setMe(savedIdentity().username || '');
    if (keys.length >= 2) {
      rememberRun(keys, meta, fresh);
      const id = keys.join(',') + '|' + cleanRunName(name) + '|' + cleanMaker(by);
      setMine(!!listMyRuns().find((r) => r.id === id && r.mine));
    }
    // ?new=1 is the builder's hand-off, not part of the run: take it off the
    // address bar so a copied URL or a reload is the plain run link.
    if (fresh) { try { const u = new URL(window.location.href); u.searchParams.delete('new'); window.history.replaceState(null, '', u.pathname + u.search); } catch (e) {} }
  }, [keys.join(','), name, by, fresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneN = keys.filter((k) => played[k]).length;
  const allDone = keys.length >= 2 && doneN === keys.length;
  const isMaker = !!(by && me && by.toLowerCase() === me.toLowerCase()) || mine || fresh;
  const rival = by && !(by && me && by.toLowerCase() === me.toLowerCase()) && !mine && !fresh ? by : '';

  useEffect(() => {
    if (!day || keys.length < 2) return undefined;
    let alive = true;
    const { anonId, email } = dailyMeIdentity();
    const q = new URLSearchParams({ keys: keys.join(','), full: '1' });
    if (rival) q.set('vs', rival);
    if (anonId) q.set('anonId', anonId);
    if (email) q.set('email', email);
    if (allDone) q.set('fresh', '1');
    fetch(`/api/quiz/daily-combined?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (alive) { setBoard(d || null); setState('ok'); } })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [day, keys.join(','), rival, allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  if (keys.length < 2) {
    return (
      <CircuitFrame label="Runs">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="br">
          <div className="br-head">
            <h1 className="br-h1">This run link is incomplete</h1>
            <p className="br-sub">A run needs at least two of today&rsquo;s puzzles. You can build one in under a minute.</p>
          </div>
          <a className="br-go" href="/build-a-run">Build a Run</a>
        </div>
      </CircuitFrame>
    );
  }

  const myPer = (board && board.me && board.me.perGame) || {};
  const vsRow = board && board.vs && board.vs.username ? board.vs : null;
  const vsPer = (vsRow && vsRow.perGame) || {};
  const vsDone = !!vsRow && keys.every((k) => vsPer[k] && !vsPer[k].abandoned);
  const nextKey = keys.find((k) => !played[k]) || null;
  const next = nextKey ? DAILY_GAME_MAP[nextKey] : null;
  const wins = allDone && vsRow ? keys.filter((k) => winner(myPer[k], vsPer[k]) > 0).length : 0;
  const rows = (board && board.overall) || [];
  const myRank = board && board.me && board.me.rank ? board.me.rank : null;
  const field = board ? (board.overallField || 0) : 0;

  const share = async (kind) => {
    const text = kind === 'result'
      ? [`${name} · Mind Loft`, vsRow && vsDone ? `I took ${wins} of ${keys.length} against ${vsRow.username}.` : (myRank ? `#${myRank} on the run today.` : `I played all ${keys.length}.`), 'Can you beat it?', link].join('\n')
      : [`${name} · Mind Loft`, `${by ? `${by} built` : 'I built'} a run of ${keys.length} daily puzzles. Can you beat it?`, link].join('\n');
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    } catch (e) { /* the sheet was dismissed: fall through to copy */ }
    try { await navigator.clipboard.writeText(text); setCopied(kind); setTimeout(() => setCopied(''), 2200); } catch (e) {}
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); setCopied('link'); setTimeout(() => setCopied(''), 2200); } catch (e) {}
  };

  const editHref = `/build-a-run?g=${keys.join(',')}&n=${encodeURIComponent(name)}`;
  const progress = keys.length ? doneN / keys.length : 0;

  return (
    <CircuitFrame label="Runs" progress={progress}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="br">
        <div className="br-head">
          <span className="br-pill">{isMaker ? 'Your Run' : by ? `${by} Built You a Run` : 'A Built Run'}</span>
          <h1 className="br-h1">{name}</h1>
          <p className="br-sub">{keys.length} games, back to back{day ? ` · ${dayLabel(day)}` : ''}</p>
        </div>

        {fresh ? (
          <section className="br-card br-share" aria-label="Share your run">
            <div className="br-ch"><h2>Your Run Is Ready</h2></div>
            <div className="br-pad">
              <p className="br-note">Send the link. It deals each day&rsquo;s new boards for these games, so friends can come back to it every day. Play it first and your results are the ones to beat.</p>
              <div className="br-link">
                <span className="br-url"><span>{link.replace(/^https:\/\//, '')}</span></span>
                <button type="button" className="br-btn sm" onClick={copyLink}>{copied === 'link' ? 'Copied' : 'Copy'}</button>
              </div>
              <button type="button" className="br-btn" onClick={() => share('invite')}>{copied === 'invite' ? 'Copied' : 'Share the Run'}</button>
            </div>
          </section>
        ) : null}

        {allDone ? (
          <section className="br-band" aria-label="Your result">
            <span className="br-bl">{vsRow && vsDone ? `You vs ${vsRow.username}` : `All ${keys.length} Played`}</span>
            <b className="br-bv">{vsRow && vsDone ? `You Took ${wins} of ${keys.length}` : 'Run Complete'}</b>
            <span className="br-bs">
              {myRank ? `#${myRank} of ${Math.max(field, myRank)} on this run today` : (state === 'loading' ? 'Reading the board' : (board && board.me ? 'Choose a name to take a rank on the board' : 'Your results are landing'))}
            </span>
          </section>
        ) : null}

        <section className="br-card" aria-label="The games">
          {allDone ? (
            <div className="br-hh">
              <span>Game</span><span>You</span><span>{vsRow && vsDone ? vsRow.username : 'Your Rank'}</span>
            </div>
          ) : null}
          {keys.map((k, i) => {
            const g = DAILY_GAME_MAP[k];
            const mine = myPer[k];
            if (allDone) {
              const w = vsRow && vsDone ? winner(mine, vsPer[k]) : 0;
              return (
                <div key={k} className="br-hrow">
                  <span className="br-gn"><span className="br-sw sm" style={hueVars(k)}><GameGlyph gameKey={k} size={15} /></span>{g.name}</span>
                  <span className={w > 0 ? 'br-v win' : 'br-v'}>{resultText(k, mine) || (state === 'loading' ? '...' : 'Played')}</span>
                  <span className={w < 0 ? 'br-v win' : 'br-v'}>
                    {vsRow && vsDone ? resultText(k, vsPer[k]) : (mine && mine.rank ? `#${mine.rank} of ${mine.field || mine.rank}` : '')}
                  </span>
                </div>
              );
            }
            return (
              <a key={k} className={'br-row' + (played[k] ? ' done' : '')} href={dailyRunHref(k, keys, meta)}>
                <span className="br-sw" style={hueVars(k)}><GameGlyph gameKey={k} size={18} /></span>
                <span className="br-rt">
                  <b>{g.name}</b>
                  <small>{played[k] ? `Played today${resultText(k, mine) ? ` · ${resultText(k, mine)}` : ''}` : `${catWord(g.cat)} · ${g.tag}`}</small>
                </span>
                {played[k] ? <span className="br-chip">Banked</span> : <span className="br-num">{i + 1}</span>}
              </a>
            );
          })}
        </section>

        {!allDone && rival ? (
          <section className="br-card br-pad br-who" aria-label="The run's maker">
            <span className="br-av" aria-hidden="true">{rival.charAt(0).toUpperCase()}</span>
            <span className="br-rt">
              <b>{vsDone ? `${rival} has played today's run` : `${rival} has not finished today's run yet`}</b>
              <small>{vsDone ? 'Their results show game by game once you finish.' : 'Finish it and see how you compare once they do.'}</small>
            </span>
          </section>
        ) : null}

        {allDone ? (
          <section className="br-card" aria-label="Today's run board">
            <div className="br-ch"><h2>Run Board, Today</h2><span>Points</span></div>
            {state === 'loading' ? <div className="br-msg">Reading the board.</div>
              : state === 'error' ? <div className="br-msg">The board could not be loaded just now.</div>
                : !rows.length ? <div className="br-msg">Nobody with a name has played all {keys.length} today yet.</div>
                  : rows.slice(0, 10).map((r) => (
                    <div key={r.userKey} className={'br-lb' + (board.me && board.me.userKey === r.userKey ? ' me' : '')}>
                      <span className="r">{r.rank}</span>
                      <span className="n">{r.username}{by && r.username && r.username.toLowerCase() === by.toLowerCase() ? <i>Maker</i> : null}</span>
                      <span className="s">{Math.round((r.total || 0) * 10) / 10}</span>
                    </div>
                  ))}
            {rows.length ? <div className="br-foot">Everyone who played all {keys.length} today, first tries only. Each game&rsquo;s place pays 15 points down to 1.</div> : null}
          </section>
        ) : null}

        <div className="br-acts">
          {allDone ? (
            <button type="button" className="br-go" onClick={() => share('result')}>{copied === 'result' ? 'Copied' : 'Share Result'}</button>
          ) : next ? (
            <a className="br-go" href={dailyRunHref(nextKey, keys, meta)}>{doneN ? `Keep Going: ${next.name}` : 'Start the Run'}</a>
          ) : null}
          {!allDone && !fresh ? (
            <button type="button" className="br-btn" onClick={() => share('invite')}>{copied === 'invite' ? 'Copied' : 'Share the Run'}</button>
          ) : null}
          {isMaker ? <a className="br-btn" href={editHref}>Edit This Run</a> : null}
          <a className="br-btn" href="/build-a-run">{isMaker ? 'Build Another Run' : 'Build Your Own Run'}</a>
          {!allDone ? <p className="br-tiny">No sign up needed. Each game also counts on its own daily board, first try only.</p> : null}
        </div>
      </div>
    </CircuitFrame>
  );
}

export const CSS = `
.br{display:flex;flex-direction:column;gap:16px;max-width:560px;margin:0 auto;padding:6px 0 32px;font-variant-numeric:tabular-nums;}
.br-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;}
.br-pill{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:14px;border:1px solid var(--stg-ink);font-size:12px;font-weight:800;color:var(--stg-ink);}
.br-h1{margin:6px 0 0;font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:var(--stg-ink);padding-bottom:.08em;}
.br-sub{margin:0;font-size:14px;font-weight:600;color:var(--stg-mute);}
.br-card{background:var(--stg-surf);border:1px solid var(--stg-ink);border-radius:16px;overflow:hidden;}
.br-pad{padding:14px 16px;}
.br-ch{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:12px 16px;border-bottom:1px solid var(--stg-ink);}
.br-ch h2{margin:0;font-size:15px;font-weight:800;color:var(--stg-ink);}
.br-ch span{font-size:12px;font-weight:700;color:var(--stg-mute);}
.br-row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid var(--stg-line);text-decoration:none;color:var(--stg-ink);min-height:60px;box-sizing:border-box;}
.br-row:last-child{border-bottom:0;}
.br-row:hover{background:var(--stg-surf2);}
.br-row.done{background:var(--stg-surf2);}
.br-sw{flex:none;width:34px;height:34px;border-radius:9px;border:1px solid var(--stg-ink);display:inline-flex;align-items:center;justify-content:center;background:var(--gd);color:#0b0d12;}
.br-sw.sm{width:26px;height:26px;border-radius:7px;}
${LIGHT} .br-sw{background:var(--gp);}
.br-rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.br-rt b{font-size:15px;font-weight:800;color:var(--stg-ink);}
.br-rt small{font-size:12.5px;font-weight:600;color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.br-num{flex:none;font-size:12px;font-weight:800;color:var(--stg-mute);min-width:18px;text-align:right;}
.br-chip{flex:none;height:24px;padding:0 10px;border-radius:12px;background:var(--stg-ink);color:var(--stg-ground);display:inline-flex;align-items:center;font-size:11px;font-weight:800;}
.br-who{display:flex;align-items:center;gap:12px;}
.br-av{flex:none;width:40px;height:40px;border-radius:20px;border:1px solid var(--stg-ink);display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:var(--stg-ink);}
.br-who .br-rt small{white-space:normal;}
.br-band{border:1px solid var(--stg-ink);border-radius:16px;padding:18px;text-align:center;display:flex;flex-direction:column;gap:4px;background:#6ee7b7;color:#0b0d12;}
${LIGHT} .br-band{background:${sitePastelHex('#6ee7b7')};}
.br-bl{font-size:12px;font-weight:700;}
.br-bv{font-size:30px;font-weight:800;letter-spacing:-.01em;line-height:1.15;}
.br-bs{font-size:13px;font-weight:600;}
.br-hh,.br-hrow{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:center;padding:10px 14px;}
.br-hh{border-bottom:1px solid var(--stg-ink);font-size:12px;font-weight:700;color:var(--stg-mute);}
.br-hh span:not(:first-child),.br-hrow .br-v{text-align:right;}
.br-hh span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.br-hrow{border-bottom:1px solid var(--stg-line);font-size:14px;}
.br-hrow:last-child{border-bottom:0;}
.br-gn{display:flex;align-items:center;gap:8px;font-weight:800;color:var(--stg-ink);min-width:0;}
.br-v{color:var(--stg-mute);font-weight:600;}
.br-v.win{color:var(--stg-ink);font-weight:800;}
.br-lb{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--stg-line);font-size:14px;color:var(--stg-ink);}
.br-lb:last-of-type{border-bottom:0;}
.br-lb.me{background:var(--stg-surf2);font-weight:800;}
.br-lb .r{width:22px;font-weight:800;}
.br-lb .n{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.br-lb .n i{font-style:normal;font-size:11px;font-weight:700;color:var(--stg-mute);margin-left:6px;}
.br-lb .s{font-weight:800;}
.br-msg{padding:16px;font-size:13.5px;font-weight:600;color:var(--stg-mute);}
.br-foot{padding:10px 16px;border-top:1px solid var(--stg-line);font-size:12px;font-weight:600;color:var(--stg-mute);}
.br-acts{display:flex;flex-direction:column;gap:8px;}
.br-go{display:flex;align-items:center;justify-content:center;width:100%;height:52px;border-radius:14px;border:0;background:#7dd3fc;color:#08222e;
  font-family:inherit;font-size:16px;font-weight:800;text-decoration:none;cursor:pointer;box-sizing:border-box;}
.br-go:hover{filter:brightness(1.05);}
.br-btn{display:flex;align-items:center;justify-content:center;width:100%;height:48px;border-radius:14px;border:1px solid var(--stg-ink);background:transparent;
  color:var(--stg-ink);font-family:inherit;font-size:15px;font-weight:800;text-decoration:none;cursor:pointer;box-sizing:border-box;}
.br-btn:hover{background:var(--stg-surf2);}
.br-btn.sm{width:auto;height:44px;padding:0 16px;flex:none;}
.br-go:focus-visible,.br-btn:focus-visible,.br-row:focus-visible{outline:2px solid var(--stg-ink);outline-offset:2px;}
.br-tiny{margin:4px 0 0;text-align:center;font-size:12px;font-weight:600;color:var(--stg-mute);}
.br-note{margin:0 0 12px;font-size:13.5px;line-height:1.45;font-weight:600;color:var(--stg-ink2);}
.br-link{display:flex;gap:8px;align-items:center;margin-bottom:10px;}
.br-url{flex:1;min-width:0;height:44px;box-sizing:border-box;border:1px solid var(--stg-ink);border-radius:12px;padding:0 12px;display:flex;align-items:center;
  font-size:13.5px;font-weight:600;color:var(--stg-ink);}
.br-url span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
@media (max-width:640px){.br-h1{font-size:30px;}.br-bv{font-size:26px;}}
`;
