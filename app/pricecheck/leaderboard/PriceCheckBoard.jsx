'use client';

// PriceCheckBoard — the Price Check leaderboard page. A copy of the Trivia
// Gauntlet run's Rankings panel (app/circuits/[id]/run/RunClient.jsx, the
// .rn-rank block), standing on its own page rather than expanding under a cap:
// the tabs lead, Today's board opens on the podium, Archive is the crowned
// days, All time is the champion tally and the best run on record. The class
// names keep the rn- prefix so the two can be diffed against each other; if
// the Gauntlet panel changes, change this to match.

import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import useCircuitBoard from '../../circuits/useCircuitBoard';
import useCircuitHistory from '../../circuits/useCircuitHistory';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function ord(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
}

// Passport (2026-10-03) reuses this page with its own circuit, name and path.
export default function PriceCheckBoard({ dateLabel = '', circuit: CIRCUIT = 'pricecheck', name = 'Price Check', path = '/pricecheck', emptyLine = 'Nobody has run all five tags today yet. Yours would be the first.', rankedLine = 'Ranked on the five tag scores added up', max = 50 }) {
  const [tab, setTab] = useState('today');
  const [myName, setMyName] = useState('');
  useEffect(() => { setMyName(savedIdentity().username || ''); }, []);

  const boardQ = useCircuitBoard(CIRCUIT, true);
  const boardNow = boardQ.data || null;
  const boardRows = boardNow && Array.isArray(boardNow.overall) ? boardNow.overall : [];
  const fieldToday = Math.max((boardNow && boardNow.overallField) || 0, boardRows.length);
  const scoreWord = 'pts';
  // Five tags at 0 to 10 each. The payload's maxTotal is the day's best score
  // so far, which reads as "out of 30" early in a day; the run is out of 50.
  const maxTotal = max;
  const myRow = boardNow ? (boardNow.me || boardNow.meProvisional || null) : null;
  const leaderRow = boardRows.length ? boardRows[0] : null;

  // The archive is a second, cacheable read; fetched once the page is up.
  const hist = useCircuitHistory(CIRCUIT, true);
  const histDays = hist.data && Array.isArray(hist.data.history) ? hist.data.history : [];
  const champions = hist.data && Array.isArray(hist.data.champions) ? hist.data.champions : [];
  const bestDay = histDays.reduce(
    (best, d) => (!best || (d.winner && d.winner.total > best.winner.total) ? d : best), null);
  // All time reads the route's all-time figures (the history is 30 days).
  const allBest = (hist.data && hist.data.bestRun) || bestDay;
  const allDays = (hist.data && hist.data.crownedDays) || (hist.data && hist.data.days) || 0;
  const histMax = histDays.reduce((m, d) => Math.max(m, Number(d.winner && d.winner.total) || 0), 0);

  return (
    <div className="pcb">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pcb-cap">
        <a className="pcb-home" href="/" aria-label="Home" title="Home"><Home size={13} strokeWidth={2.4} /></a>
        <b>{name}</b>
        <span className="pcb-capd">Leaderboard</span>
        <a className="pcb-play" href={path}>Play {name} <span aria-hidden="true">&rsaquo;</span></a>
      </div>

      {leaderRow ? (
        <div className="rn-strip" role="note">
          <span className="rn-se">Today</span>
          <b className="rn-sn">{leaderRow.username || 'Guest'}</b>
          <span className="rn-sf">{Math.round(Number(leaderRow.total) || 0)} / {maxTotal}</span>
          <span className="rn-sd">&middot; {fieldToday} {fieldToday === 1 ? 'player' : 'players'}</span>
          <span className="rn-sy">{myRow && myRow.rank ? `You ${ord(myRow.rank)}` : 'Not run yet'}</span>
        </div>
      ) : null}

      <div className="rn-rank" id="rn-rankings" role="region" aria-label="Rankings">
        <div className="rn-rin">
          <h1 className="pcb-h1">{name} leaderboard</h1>
          <div className="rn-thd">
            <div className="rn-tabs" role="tablist">
              {[['today', "Today's board"], ['arch', 'Archive'], ['all', 'All time']].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  className={`rn-tab${tab === k ? ' on' : ''}`}
                  onClick={() => setTab(k)}
                >{label}</button>
              ))}
            </div>
          </div>

          {tab === 'today' ? (
            <div className="rn-rpane">
              <div className="rn-rhd">
                <span>Today &middot; <b>{dateLabel}</b></span>
                <s>{boardNow ? `${fieldToday} ` : ''}{boardNow && fieldToday === 1 ? 'player' : 'players'}</s>
              </div>
              {boardRows.length ? (
                <div className="rn-pod">
                  {[boardRows[1], boardRows[0], boardRows[2]].map((row, i) => {
                    const place = i === 1 ? 1 : (i === 0 ? 2 : 3);
                    if (!row) return <div key={place} className="rn-pstep empty" />;
                    return (
                      <div key={place} className={`rn-pstep p${place}`}>
                        <span className="rn-ppl">{ord(place)}</span>
                        <b className="rn-pnm">{row.username || 'Guest'}</b>
                        <span className="rn-pfg">
                          {Math.round(Number(row.total) || 0)} <u>{scoreWord}</u>
                          {row.timeTotal ? ` · ${fmtTime(row.timeTotal * 1000)}` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rn-rmsg">
                  {boardQ.state === 'loading'
                    ? 'Reading the board.'
                    : (boardQ.state === 'error' ? 'The board could not be loaded just now.' : emptyLine)}
                </div>
              )}
              {boardRows.length > 3 ? (
                <div className="rn-rlist">
                  {boardRows.slice(3).map((row) => (
                    <div key={row.userKey || row.username} className={`rn-rrow2${myRow && row.userKey && myRow.userKey === row.userKey ? ' me' : ''}`}>
                      <span className="rn-rpos">{row.rank || ''}</span>
                      <b className="rn-rnm">{row.username || 'Guest'}</b>
                      <span className="rn-rfg">
                        {Math.round(Number(row.total) || 0)} {scoreWord}
                        {row.timeTotal ? <s>{` · ${fmtTime(row.timeTotal * 1000)}`}</s> : null}
                      </span>
                    </div>
                  ))}
                  {myRow && !boardRows.some((row) => row.userKey && myRow.userKey && row.userKey === myRow.userKey) ? (
                    <div className="rn-rrow2 me">
                      <span className="rn-rpos">{myRow.rank || ''}</span>
                      <b className="rn-rnm">You</b>
                      <span className="rn-rfg">{Math.round(Number(myRow.total) || 0)} {scoreWord}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <p className="rn-rfine">
                {rankedLine}, out of {maxTotal}; the clock breaks a tie.
                {boardNow && boardNow.partial
                  ? ` ${boardNow.partial} ${boardNow.partial === 1 ? 'is' : 'are'} partway through it.`
                  : ''}
              </p>
            </div>
          ) : null}

          {tab === 'arch' ? (
            <div className="rn-rpane">
              <div className="rn-rhd">
                <span>Crowned days</span>
                <s>{hist.data && hist.data.days ? `${hist.data.days} ${hist.data.days === 1 ? 'day' : 'days'}` : ''}</s>
              </div>
              {hist.state === 'loading' ? <div className="rn-rmsg">Reading the archive.</div> : null}
              {hist.state === 'error' ? <div className="rn-rmsg">The archive could not be loaded just now.</div> : null}
              {histDays.length ? (
                <>
                  <div className="rn-hist">
                    {histDays.slice(0, 10).reverse().map((d) => {
                      const mine = !!myName && d.winner && d.winner.username === myName;
                      const h = histMax ? Math.max(6, Math.round((Number(d.winner.total) || 0) / histMax * 62)) : 6;
                      return (
                        <span key={d.date} className={`rn-hcol${mine ? ' win' : ''}`}>
                          <i>{Math.round(Number(d.winner.total) || 0)}</i>
                          <span className="rn-hbar" style={{ height: `${h}px` }} />
                          <b>{String(d.label || '').replace(/^[A-Za-z]+ /, '')}</b>
                        </span>
                      );
                    })}
                  </div>
                  <div className="rn-rlist">
                    {histDays.slice(0, 8).map((d) => (
                      <div key={d.date} className={`rn-rrow2${myName && d.winner.username === myName ? ' me' : ''}`}>
                        <span className="rn-rpos day">{d.label}</span>
                        <b className="rn-rnm">{d.winner.username}</b>
                        <span className="rn-rfg">
                          {Math.round(Number(d.winner.total) || 0)} pts
                          <s>{` · ${d.field} ${d.field === 1 ? 'player' : 'players'}`}</s>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (hist.state === 'ready' ? (
                <div className="rn-rmsg">No completed day has been crowned yet. Today is crowned at midnight Eastern.</div>
              ) : null)}
            </div>
          ) : null}

          {tab === 'all' ? (
            <div className="rn-rpane">
              <div className="rn-rhd">
                <span>All time</span>
                <s>{champions.length ? `${champions.length} ${champions.length === 1 ? 'champion' : 'champions'}` : ''}</s>
              </div>
              {hist.state === 'loading' ? <div className="rn-rmsg">Reading the record.</div> : null}
              {champions.length ? (
                <div className="rn-rlist">
                  {champions.slice(0, 8).map((c, i) => (
                    <div key={c.userKey} className={`rn-rrow2${myName && c.username === myName ? ' me' : ''}`}>
                      <span className="rn-rpos">{i + 1}</span>
                      <b className="rn-rnm">{c.username}</b>
                      <span className="rn-rfg">{c.wins} {c.wins === 1 ? 'day' : 'days'}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {allBest ? (
                <p className="rn-rfine">
                  Best run on record: <b>{allBest.winner.username}</b>,{' '}
                  {Math.round(Number(allBest.winner.total) || 0)} pts on {allBest.label}.
                  {allDays ? ` ${allDays} ${allDays === 1 ? 'day' : 'days'} crowned.` : ''}
                </p>
              ) : null}
              {!champions.length && hist.state === 'ready' ? (
                <div className="rn-rmsg">Nobody has taken a day yet.</div>
              ) : null}
            </div>
          ) : null}

          <div className="pcb-foot">
            <a className="pcb-go" href={path}>Play today&rsquo;s {name}</a>
            <a className="pcb-alt" href="/circuits/gauntlet/run">Or run the Trivia Gauntlet &rsaquo;</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.pcb{min-height:100vh;background:${T.ground};color:#eef2fa;font-family:${SANS};}
.pcb-cap{display:flex;align-items:center;gap:10px;max-width:660px;margin:0 auto;padding:12px 20px;font-size:13px;}
.pcb-cap b{font-weight:800;letter-spacing:-.01em;color:#fff;}
.pcb-capd{font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#66748f;}
.pcb-home{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;
  border:1px solid rgba(255,255,255,.14);color:#9aa8c4;text-decoration:none;flex:none;}
.pcb-home:hover{color:#fff;}
.pcb-play{margin-left:auto;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:#7dd3fc;text-decoration:none;white-space:nowrap;}
.pcb-play:hover{color:#fff;}
.pcb-home:focus-visible,.pcb-play:focus-visible,.pcb-go:focus-visible,.pcb-alt:focus-visible,.rn-tab:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}
.pcb-h1{margin:6px 0 14px;font-size:clamp(26px,4vw,36px);font-weight:800;letter-spacing:-.035em;color:#fff;}
.pcb-foot{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin-top:22px;}
.pcb-go{display:block;text-align:center;font-weight:800;font-size:15px;padding:13px;border-radius:12px;
  background:#7dd3fc;color:#08222e;text-decoration:none;}
.pcb-alt{display:block;text-align:center;font-weight:700;font-size:13px;color:#9aa8c4;text-decoration:none;padding:6px;}
.pcb-alt:hover{color:#fff;}

.rn-strip{display:flex;align-items:center;gap:11px;width:100%;text-align:left;
  background:rgba(255,255,255,.03);border-top:1px solid rgba(255,255,255,.09);border-bottom:1px solid rgba(255,255,255,.09);
  padding:10px max(20px,calc((100% - 620px) / 2));font-family:${MONO};font-size:11.5px;color:#9aa8c4;box-sizing:border-box;}
.rn-se{color:${T.gold};letter-spacing:.1em;text-transform:uppercase;font-size:9.5px;flex:none;}
.rn-sn{font-family:${SANS};font-weight:800;font-size:13.5px;color:#fff;flex:none;
  max-width:38vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rn-sf{font-variant-numeric:tabular-nums;flex:none;}
.rn-sd{color:#66748f;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rn-sy{margin-left:auto;flex:none;color:#7dd3fc;letter-spacing:.1em;text-transform:uppercase;font-size:9.5px;}

.rn-rank{background:#0d1220;border-bottom:1px solid rgba(255,255,255,.09);}
.rn-rin{max-width:660px;margin:0 auto;padding:16px 20px 28px;}
.rn-rhd{display:flex;align-items:baseline;gap:10px;font-family:${MONO};font-size:9.5px;
  letter-spacing:.13em;text-transform:uppercase;color:#66748f;margin-bottom:12px;}
.rn-rhd b{color:#9fc2ff;font-weight:400;}
.rn-rhd s{text-decoration:none;margin-left:auto;color:#66748f;}
.rn-thd{display:flex;align-items:stretch;gap:10px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.09);}

.rn-pod{display:flex;align-items:flex-end;gap:8px;margin-bottom:14px;}
.rn-pstep{flex:1;min-width:0;border-radius:9px 9px 0 0;padding:12px 12px 11px;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-bottom:0;}
.rn-pstep.empty{background:none;border-color:transparent;}
.rn-pstep.p1{padding-top:26px;border-color:rgba(232,180,58,.42);
  background:linear-gradient(180deg,rgba(232,180,58,.2),rgba(232,180,58,.05));}
.rn-pstep.p2{padding-top:17px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));}
.rn-ppl{display:block;font-family:${MONO};font-size:10px;color:#66748f;letter-spacing:.1em;margin-bottom:6px;}
.rn-pstep.p1 .rn-ppl{color:${T.gold};}
.rn-pnm{display:block;font-size:16px;font-weight:800;letter-spacing:-.02em;color:#fff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rn-pstep.p1 .rn-pnm{font-size:19px;}
.rn-pfg{display:block;font-family:${MONO};font-size:12.5px;color:#9aa8c4;margin-top:5px;font-variant-numeric:tabular-nums;}
.rn-pfg u{text-decoration:none;color:#66748f;}

.rn-tabs{display:flex;gap:2px;min-width:0;}
.rn-tab{background:none;border:0;border-bottom:2px solid transparent;cursor:pointer;
  font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#66748f;
  padding:8px 12px;margin-bottom:-1px;}
.rn-tab:hover{color:#9aa8c4;}
.rn-tab.on{color:#fff;border-bottom-color:#7dd3fc;}

.rn-rlist{display:grid;gap:1px;background:rgba(255,255,255,.06);border-radius:9px;overflow:hidden;}
.rn-rrow2{display:flex;align-items:center;gap:11px;background:#0e131f;padding:9px 12px;}
.rn-rrow2.me{background:rgba(125,211,252,.11);}
.rn-rpos{font-family:${MONO};font-size:11.5px;color:#66748f;min-width:26px;flex:none;font-variant-numeric:tabular-nums;}
.rn-rpos.day{min-width:46px;}
.rn-rrow2.me .rn-rpos{color:#7dd3fc;}
.rn-rnm{flex:1;min-width:0;font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rn-rfg{font-family:${MONO};font-size:12.5px;color:#9aa8c4;flex:none;font-variant-numeric:tabular-nums;}
.rn-rfg s{text-decoration:none;color:#66748f;}
.rn-rfine{font-size:12px;line-height:1.6;font-weight:600;color:#66748f;margin:12px 0 0;}
.rn-rfine b{color:#9aa8c4;}
.rn-rmsg{padding:14px;text-align:center;font-size:12.5px;font-weight:600;color:#66748f;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:11px;}

.rn-hist{display:flex;gap:4px;align-items:flex-end;margin-bottom:14px;}
.rn-hcol{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;}
.rn-hbar{width:100%;border-radius:3px 3px 0 0;background:rgba(255,255,255,.13);}
.rn-hcol.win .rn-hbar{background:#7dd3fc;}
.rn-hcol i{font-style:normal;font-size:10.5px;font-weight:700;color:#9aa8c4;}
.rn-hcol.win i{color:#7dd3fc;}
.rn-hcol b{font-family:${MONO};font-size:9px;color:#66748f;white-space:nowrap;}

@media (max-width:820px){
  .pcb-cap{padding:10px 14px;}
  .rn-strip{padding:9px 14px;gap:8px;}
  .rn-sd{display:none;}
  .rn-rin{padding:14px 14px 22px;}
  .rn-thd{gap:6px;}
  .rn-pod{gap:5px;margin-bottom:11px;}
  .rn-pstep{padding:10px 8px 9px;border-radius:7px 7px 0 0;}
  .rn-pstep.p1{padding-top:20px;}
  .rn-pnm{font-size:13px;}
  .rn-pstep.p1 .rn-pnm{font-size:15px;}
  .rn-pfg{font-size:11px;}
  .rn-tab{padding:8px 7px;letter-spacing:.06em;}
  .rn-hcol i{font-size:9.5px;}
}
`;
