'use client';
// ONE GROUP'S PAGE (owner, 2026-09-17). The board is visible before joining and
// the join bar sits on top of it, pre-filled, so an invite link is one tap.
// Every figure here is the site's own daily board kept to the members; see the
// `group` branch in /api/quiz/daily-combined.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GroupsShell, {
  readIdentity, identityQs, suggestName, groupAction, shareInvite, inviteUrl,
  etTodayIso, shiftIso, suffixOfIso, labelOfIso, ordinal, Avatar,
} from '../GroupsShell';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { categoryColor, categoryColorLight } from '@/lib/category-ramp';
import { gameStats } from '@/lib/daily-row-stats';
import { useStageTheme } from '@/lib/stage-theme';
import GameGlyph from '../../GameGlyph';
import SignupJoin from '../SignupJoin';

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'games', label: 'By game' },
  { id: 'members', label: 'Members' },
  { id: 'history', label: 'History' },
];
const BACK_DAYS = 13;

function pts(n) { return (Math.round((Number(n) || 0) * 10) / 10).toLocaleString(); }

export default function GroupClient({ code }) {
  const router = useRouter();
  const [info, setInfo] = useState(null);       // /api/groups/<code>
  const [infoErr, setInfoErr] = useState('');
  const [tab, setTab] = useState('today');
  const [today, setToday] = useState('');
  const [day, setDay] = useState('');
  const [board, setBoard] = useState(null);
  const [boardErr, setBoardErr] = useState(false);
  const [gameKey, setGameKey] = useState('');
  const [history, setHistory] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [joinErr, setJoinErr] = useState('');
  const [flash, setFlash] = useState('');
  const [fresh, setFresh] = useState(false);
  const [theme] = useStageTheme();
  const light = theme === 'light';

  const loadInfo = useCallback(async () => {
    try {
      const r = await fetch(`/api/groups/${encodeURIComponent(code)}?${identityQs()}`, { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (d.available === false) { setInfoErr('Groups are being set up. Check back soon.'); return; }
      if (!r.ok) { setInfoErr(d.error || 'Could not load this group.'); return; }
      setInfo(d);
      setInfoErr('');
    } catch (e) { setInfoErr('Could not reach the server. Check your connection and try again.'); }
  }, [code]);

  // First paint: resolve the day and the identity in an effect, never during
  // render (the server cannot know either).
  useEffect(() => {
    const t = etTodayIso();
    setToday(t);
    setDay(t);
    const me = readIdentity();
    setName(me.username || suggestName());
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('new') === '1') setFresh(true);
    } catch (e) {}
    loadInfo();
  }, [loadInfo]);

  useEffect(() => {
    if (!day) return;
    let dead = false;
    setBoard(null);
    setBoardErr(false);
    fetch(`/api/quiz/daily-combined?group=${encodeURIComponent(code)}&date=${suffixOfIso(day)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (!dead) setBoard(d); })
      .catch(() => { if (!dead) setBoardErr(true); });
    return () => { dead = true; };
  }, [code, day, info && info.members && info.members.length]);

  useEffect(() => {
    if (tab !== 'members' && tab !== 'history') return;
    if (history) return;
    let dead = false;
    fetch(`/api/groups/${encodeURIComponent(code)}/history`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (!dead) setHistory(d); })
      .catch(() => { if (!dead) setHistory({ failed: true }); });
    return () => { dead = true; };
  }, [tab, code, history]);

  const viewer = (info && info.viewer) || {};
  const members = (info && info.members) || [];
  const group = info && info.group;

  // The group half of a join. The account half is done first, either by the
  // one-tap button (already registered) or by SignupJoin (new or returning).
  async function joinGroupNow() {
    const d = await groupAction(code, 'join');
    if (d.error) {
      if (d.code === 'no_account') return { error: 'Pick a name for the board, then join.' };
      return { error: d.error };
    }
    setInfo(d);
    setHistory(null);
    const who = d.viewer && d.viewer.username;
    setFlash(`You joined${who ? ` as ${who}` : ''}. Play any daily and your points show up here.`);
    return {};
  }

  async function join() {
    setBusy(true);
    setJoinErr('');
    const res = await joinGroupNow();
    setBusy(false);
    if (res.error) setJoinErr(res.error);
  }

  async function leave() {
    if (typeof window !== 'undefined' && !window.confirm(`Leave ${group.name}?`)) return;
    const d = await groupAction(code, 'leave');
    if (d.error) { setFlash(d.error); return; }
    router.push('/groups');
  }

  async function ownerAction(action, extra, done) {
    const d = await groupAction(code, action, extra);
    if (d.error) { setFlash(d.error); return; }
    setInfo(d);
    setHistory(null);
    if (done) setFlash(done);
    if (action === 'reset' && d.group && d.group.code !== code) router.replace(`/groups/${d.group.code}`);
  }

  async function share() {
    if (!group) return;
    const how = await shareInvite(group.code, group.name);
    if (how === 'copied') setFlash('Invite link copied.');
    else if (how === 'failed') setFlash(`Share this link: ${inviteUrl(group.code)}`);
  }

  if (infoErr) {
    return (
      <GroupsShell eyebrow="Groups">
        <div className="grp-card gp-empty">
          <span className="grp-lbl">Group {code}</span>
          <h1 className="grp-h1">{infoErr}</h1>
          <div className="grp-row" style={{ marginTop: 16 }}>
            <Link className="grp-btn solid" href="/groups">Go to your groups</Link>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </GroupsShell>
    );
  }

  return (
    <GroupsShell eyebrow={group ? `Group · ${group.code}` : 'Groups'}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <article className="grp-card gp">
        {info && !viewer.member ? (
          <div className="gp-join">
            <div className="gp-joinmsg">
              <b>{info.owner ? `You're invited by ${info.owner}.` : `You're invited.`}</b>{' '}
              <span className="grp-mute">
                {viewer.registered
                  ? 'Join with one tap.'
                  : 'Sign up and join in one step. Keep the suggested name or pick your own.'}
              </span>
            </div>
            {viewer.registered ? (
              <form className="gp-jform" onSubmit={(e) => { e.preventDefault(); if (!busy) join(); }}>
                <button className="grp-btn solid" type="submit" disabled={busy}>
                  {busy ? 'Joining…' : `Join as ${viewer.username}`}
                </button>
              </form>
            ) : (
              <div className="gp-full">
                <SignupJoin initialName={name} cta="Sign up and join" onDone={joinGroupNow} />
              </div>
            )}
            {joinErr ? <p className="grp-err gp-full">{joinErr}</p> : null}
          </div>
        ) : null}
        {flash ? <div className="gp-flash"><span>{flash}</span><button type="button" className="grp-btn" onClick={() => setFlash('')}>OK</button></div> : null}
        {fresh && viewer.owner ? (
          <div className="gp-flash">
            <span>Your group is ready. Send the link to the people you play with. Code <b>{group.code}</b>.</span>
            <button type="button" className="grp-btn solid" onClick={() => { share(); setFresh(false); }}>Share invite</button>
          </div>
        ) : null}

        <div className="gp-head">
          <div>
            <span className="grp-lbl">
              {info ? `${members.length} ${members.length === 1 ? 'member' : 'members'}` : 'Loading'}
              {group ? ` · since ${new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            </span>
            <h1 className="grp-h1">{group ? group.name : ' '}</h1>
            {info ? <p className="grp-note grp-mute" style={{ marginTop: 6 }}>Made by {info.owner || 'a former member'}{viewer.member ? ' · You are a member' : ''}</p> : null}
          </div>
          {group ? (
            <div className="grp-row gp-invite">
              <span className="grp-code" title="Invite code">{group.code}</span>
              <button type="button" className="grp-btn" onClick={share}>Share invite</button>
            </div>
          ) : null}
        </div>

        <div className="gp-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" className="grp-tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'today' ? (
          <TodayPane board={board} boardErr={boardErr} members={members} viewer={viewer}
            day={day} today={today} setDay={setDay} />
        ) : null}
        {tab === 'games' ? (
          <GamesPane board={board} boardErr={boardErr} members={members} viewer={viewer}
            day={day} today={today} setDay={setDay} gameKey={gameKey} setGameKey={setGameKey} light={light} />
        ) : null}
        {tab === 'members' ? (
          <MembersPane history={history} members={members} viewer={viewer}
            onRemove={(m) => { if (window.confirm(`Remove ${m.username} from the group?`)) ownerAction('remove', { userId: m.userId }, `${m.username} was removed.`); }}
            onRename={(n) => ownerAction('rename', { name: n }, 'Group renamed.')}
            onReset={() => { if (window.confirm('Make a new code? The old link and code stop working.')) ownerAction('reset', {}, 'New code made. Share the new link.'); }}
            onLeave={leave} groupName={group ? group.name : ''} />
        ) : null}
        {tab === 'history' ? <HistoryPane history={history} viewer={viewer} /> : null}
      </article>
    </GroupsShell>
  );
}

function DayNav({ day, today, setDay, frozen }) {
  const oldest = today ? shiftIso(today, -BACK_DAYS) : '';
  return (
    <div className="gp-dayline">
      <div className="gp-daynav">
        <button type="button" aria-label="Previous day" disabled={!day || day <= oldest} onClick={() => setDay(shiftIso(day, -1))}>‹</button>
        <strong>{day ? labelOfIso(day, today) : ' '}</strong>
        <button type="button" aria-label="Next day" disabled={!day || day >= today} onClick={() => setDay(shiftIso(day, 1))}>›</button>
      </div>
      {day ? <span className={`grp-pill ${frozen ? 'wait' : 'line'}`}>{frozen ? 'Final' : 'Live · settles at midnight ET'}</span> : null}
    </div>
  );
}

function Who({ name, userKey, sub, nameOnly }) {
  return (
    <div className="gp-who">
      <Avatar name={name} userKey={userKey} />
      <div style={{ minWidth: 0 }}>
        <div className="gp-nm">{name}{nameOnly ? <span className="grp-tag">name only</span> : null}</div>
        {sub ? <div className="gp-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

function Loading({ err }) {
  return <p className="grp-note grp-mute" style={{ padding: '18px 0' }}>{err ? 'Could not load this board. Try again in a moment.' : 'Loading the board…'}</p>;
}

function TodayPane({ board, boardErr, members, viewer, day, today, setDay }) {
  const rows = (board && board.overall) || [];
  const nameOnly = new Map(members.map((m) => [m.userKey, m.nameOnly]));
  const played = new Set(rows.filter((r) => (r.total || 0) > 0).map((r) => r.userKey));
  const scored = rows.filter((r) => (r.total || 0) > 0);
  const waiting = members.filter((m) => !played.has(m.userKey));
  const max = (board && board.maxTotal) || 375;
  return (
    <div className="gp-pane">
      <DayNav day={day} today={today} setDay={setDay} frozen={board && board.frozen} />
      {!board ? <Loading err={boardErr} /> : (
        <>
          <table className="gp-board">
            <thead><tr><th>#</th><th>Member</th><th className="r hide-sm">Games</th><th className="r">Points</th></tr></thead>
            <tbody>
              {scored.map((r) => (
                <tr key={r.userKey} className={r.userKey === viewer.userKey ? 'me' : ''}>
                  <td className={`gp-rk${r.rank === 1 ? ' first' : ''}`}>{r.rank}</td>
                  <td><Who name={r.username} userKey={r.userKey} nameOnly={nameOnly.get(r.userKey)} /></td>
                  <td className="r hide-sm num">{r.gamesPlayed}</td>
                  <td className="r">
                    <div className="gp-pts num">{pts(r.total)}</div>
                    <div className="gp-bar"><i style={{ width: `${Math.min(100, Math.round((r.total / max) * 100))}%` }} /></div>
                  </td>
                </tr>
              ))}
              {waiting.map((m) => (
                <tr key={m.userKey} className={m.userKey === viewer.userKey ? 'me' : ''}>
                  <td className="gp-rk">–</td>
                  <td><Who name={m.username} userKey={m.userKey} nameOnly={m.nameOnly} /></td>
                  <td className="r hide-sm" />
                  <td className="r"><span className="grp-pill wait">Not played</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="gp-foot">Points are the same Mind Loft Daily points the site board uses, out of {max}.</p>
          {waiting.length && board && !board.frozen && scored.length ? (
            <p className="gp-foot"><b>{waiting.length}</b> {waiting.length === 1 ? 'member has' : 'members have'} not played today.</p>
          ) : null}
          {viewer.member && !played.has(viewer.userKey) && board && !board.frozen ? (
            <div className="gp-cta"><span>You have not played today.</span><Link className="grp-btn solid" href="/">Play today&apos;s puzzles</Link></div>
          ) : null}
        </>
      )}
    </div>
  );
}

function GamesPane({ board, boardErr, members, viewer, day, today, setDay, gameKey, setGameKey, light }) {
  const games = useMemo(() => ((board && board.games) || [])
    .filter((g) => g.board && g.board.length && DAILY_GAME_MAP[g.key])
    .sort((a, b) => b.board.length - a.board.length || DAILY_GAME_MAP[a.key].name.localeCompare(DAILY_GAME_MAP[b.key].name)), [board]);
  const pick = games.find((g) => g.key === gameKey) || games[0];
  const meta = pick ? DAILY_GAME_MAP[pick.key] : null;
  const nameOnly = new Map(members.map((m) => [m.userKey, m.nameOnly]));
  const inBoard = new Set(pick ? pick.board.map((r) => r.userKey) : []);
  const hue = (cat) => (light ? categoryColorLight(cat) : categoryColor(cat));
  return (
    <div className="gp-pane">
      <DayNav day={day} today={today} setDay={setDay} frozen={board && board.frozen} />
      {!board ? <Loading err={boardErr} /> : !games.length ? (
        <p className="grp-note grp-mute" style={{ padding: '14px 0' }}>No member has played a daily on this day yet.</p>
      ) : (
        <>
          <div className="gp-gamepick">
            {games.map((g) => {
              const m = DAILY_GAME_MAP[g.key];
              const on = pick && g.key === pick.key;
              return (
                <button key={g.key} type="button" className="grp-gbtn" aria-pressed={on} onClick={() => setGameKey(g.key)}
                  style={{ '--gc': hue(m.cat) }}>
                  <i aria-hidden="true" />{m.name}<span className="gp-gn">{g.board.length}</span>
                </button>
              );
            })}
          </div>
          {pick && meta ? (
            <>
              <div className="gp-ghead">
                <GameGlyph gameKey={pick.key} size={18} style={{ color: hue(meta.cat) }} />
                <h2>{meta.name}</h2>
                <span className="grp-lbl">{meta.cat}</span>
                <Link className="gp-play" href={pick.href || meta.href}>{day === today ? 'Play' : 'Open this day'} →</Link>
              </div>
              <table className="gp-board">
                <thead><tr><th>#</th><th>Member</th><th className="r">Result</th><th className="r">Pts</th></tr></thead>
                <tbody>
                  {pick.board.map((r) => (
                    <tr key={r.userKey} className={r.userKey === viewer.userKey ? 'me' : ''}>
                      <td className={`gp-rk${r.rank === 1 && !r.abandoned ? ' first' : ''}`}>{r.abandoned ? '–' : r.rank}</td>
                      <td><Who name={r.username} userKey={r.userKey} nameOnly={nameOnly.get(r.userKey)} /></td>
                      <td className="r num gp-res">{r.abandoned ? 'Left unfinished' : (gameStats(r, meta.miss) || '—')}</td>
                      <td className="r num"><b>{pts(r.points)}</b></td>
                    </tr>
                  ))}
                  {members.filter((m) => !inBoard.has(m.userKey)).map((m) => (
                    <tr key={m.userKey} className={m.userKey === viewer.userKey ? 'me' : ''}>
                      <td className="gp-rk">–</td>
                      <td><Who name={m.username} userKey={m.userKey} nameOnly={m.nameOnly} /></td>
                      <td className="r"><span className="grp-pill wait">Not played</span></td>
                      <td className="r" />
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="gp-foot">Order follows this game&apos;s own leaderboard rule. Pts is what the game added to each member&apos;s daily total.</p>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function Spark({ series, peak }) {
  // One scale for every card, so two members' bars can be compared.
  const max = Math.max(1, peak || 0, ...series);
  return (
    <div className="gp-spark" aria-label={`Daily points, last ${series.length} days`}>
      {series.map((v, i) => (
        <i key={i} className={v ? '' : 'miss'} style={{ height: v ? `${Math.max(10, Math.round((v / max) * 100))}%` : '12%' }} />
      ))}
    </div>
  );
}

function MembersPane({ history, members, viewer, onRemove, onRename, onReset, onLeave, groupName }) {
  const [rename, setRename] = useState('');
  const byKey = new Map(((history && history.members) || []).map((m) => [m.userKey, m]));
  const days = (history && history.window) || 0;
  const peak = Math.max(0, ...((history && history.members) || []).flatMap((m) => m.series || []));
  return (
    <div className="gp-pane">
      {!history ? <Loading /> : history.failed ? <Loading err /> : null}
      <div className="gp-mgrid">
        {members.map((m) => {
          const s = byKey.get(m.userKey);
          const bg = s && s.bestGame ? DAILY_GAME_MAP[s.bestGame.key] : null;
          return (
            <div key={m.userKey} className={`gp-mcard${m.userKey === viewer.userKey ? ' me' : ''}`}>
              <Who name={m.username} userKey={m.userKey} nameOnly={m.nameOnly}
                sub={m.owner ? 'Owner' : (s && s.streak ? `${s.streak}-day streak` : 'Member')} />
              <div className="gp-kv">
                <div><span className="grp-lbl">Days played</span><b className="num">{s ? s.days : 0}</b></div>
                <div><span className="grp-lbl">Group wins</span><b className="num">{s ? s.wins : 0}</b></div>
                <div><span className="grp-lbl">Avg points</span><b className="num">{s ? s.avg : '—'}</b></div>
                <div><span className="grp-lbl">Most won</span><b>{bg ? bg.name : '—'}</b></div>
              </div>
              {s ? <Spark series={s.series} peak={peak} /> : null}
              {viewer.owner && !m.owner ? (
                <button type="button" className="grp-btn danger gp-rm" onClick={() => onRemove(m)}>Remove</button>
              ) : null}
            </div>
          );
        })}
      </div>
      {days ? <p className="gp-foot">Figures cover the last {days} {days === 1 ? 'day' : 'days'}. Bars show daily points, and an empty bar means no play that day.</p> : null}

      {viewer.member ? (
        <div className="gp-settings">
          {viewer.owner ? (
            <>
              <span className="grp-lbl">Owner settings</span>
              <form className="grp-row" onSubmit={(e) => { e.preventDefault(); if (rename.trim()) { onRename(rename.trim()); setRename(''); } }}>
                <input className="grp-in" id="gp-rename" aria-label="New group name" maxLength={40} placeholder={groupName} value={rename} onChange={(e) => setRename(e.target.value)} />
                <button className="grp-btn" type="submit" disabled={!rename.trim()}>Rename</button>
                <button className="grp-btn" type="button" onClick={onReset}>New invite code</button>
              </form>
              <p className="grp-note grp-mute">If you leave, the group passes to its longest-standing member.</p>
            </>
          ) : null}
          <div><button type="button" className="grp-btn danger" onClick={onLeave}>Leave group</button></div>
        </div>
      ) : null}
    </div>
  );
}

function HistoryPane({ history, viewer }) {
  if (!history) return <div className="gp-pane"><Loading /></div>;
  if (history.failed) return <div className="gp-pane"><Loading err /></div>;
  const today = etTodayIso();
  const days = (history.days || []).slice().reverse();
  const table = history.members || [];
  return (
    <div className="gp-pane gp-hgrid">
      <div>
        <span className="grp-lbl">Recent days · group winner</span>
        <ul className="gp-hlist">
          {days.map((d) => (
            <li key={d.date}>
              <span className="gp-hd">{labelOfIso(d.date, today)}</span>
              <b>{d.winners.length ? d.winners.join(', ') : (d.failed ? 'Could not load' : 'Nobody played')}</b>
              <span className="num grp-mute">{d.top != null ? `${pts(d.top)} pts` : ''}{d.final ? '' : ' · live'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <span className="grp-lbl">Standings · last {history.window} days</span>
        <table className="gp-board" style={{ marginTop: 4 }}>
          <thead><tr><th>#</th><th>Member</th><th className="r">Wins</th><th className="r hide-sm">Top 3</th><th className="r">Avg</th></tr></thead>
          <tbody>
            {table.map((m, i) => (
              <tr key={m.userKey} className={m.userKey === viewer.userKey ? 'me' : ''}>
                <td className={`gp-rk${i === 0 && m.wins ? ' first' : ''}`}>{ordinal(i + 1)}</td>
                <td><Who name={m.username} userKey={m.userKey} /></td>
                <td className="r num"><b>{m.wins}</b></td>
                <td className="r hide-sm num">{m.top3}</td>
                <td className="r num">{m.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!table.length ? <p className="grp-note grp-mute" style={{ padding: '12px 0' }}>No plays yet. The first day anyone plays shows up here.</p> : null}
        <p className="gp-foot">Ranked by days won, then average daily points on days played.</p>
      </div>
    </div>
  );
}

const CSS = `
.gp{overflow:hidden;}
.gp-empty{padding:24px;}
.gp-join{display:flex;align-items:center;justify-content:space-between;gap:10px 14px;flex-wrap:wrap;padding:14px 22px;background:var(--stg-acc-tint);border-bottom:1px solid var(--stg-line);}
.gp-joinmsg{font-size:14px;}
.gp-joinmsg b{font-weight:800;}
.gp-jform{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.gp-full{flex-basis:100%;}
.gp-small{font-size:12px;}
.gp-small a{color:var(--stg-acc-ink);font-weight:700;}
.gp-flash{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 22px;border-bottom:1px solid var(--stg-line);background:var(--stg-surf2);font-size:14px;}
.gp-head{padding:20px 22px 0;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.gp-invite{align-self:flex-start;}
.gp-tabs{display:flex;gap:4px;padding:16px 22px 0;border-bottom:1px solid var(--stg-line);overflow-x:auto;}
.grp-tab{border:0;background:none;padding:10px 12px 12px;font:inherit;font-weight:700;font-size:14px;color:var(--stg-mute);border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;cursor:pointer;}
.grp-tab[aria-selected=true]{color:var(--stg-ink);border-bottom-color:var(--stg-acc);}
.gp-pane{padding:18px 22px 22px;}
.gp-dayline{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
.gp-daynav{display:flex;align-items:center;gap:6px;}
.gp-daynav button{border:1px solid var(--stg-line2);background:none;color:var(--stg-ink);border-radius:8px;width:30px;height:30px;font-size:16px;cursor:pointer;}
.gp-daynav button:disabled{opacity:.35;cursor:default;}
.gp-daynav strong{font-size:14px;min-width:150px;text-align:center;}
.gp-board{width:100%;border-collapse:collapse;}
.gp-board th{font-family:"DM Mono",ui-monospace,monospace;font-weight:400;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);text-align:left;padding:0 8px 8px;border-bottom:1px solid var(--stg-line);}
.gp-board th.r,.gp-board td.r{text-align:right;}
.gp-board td{padding:10px 8px;border-bottom:1px solid var(--stg-line);vertical-align:middle;}
.gp-board tr.me td{background:var(--stg-acc-tint);}
.num{font-variant-numeric:tabular-nums;}
.gp-rk{font-family:"DM Mono",ui-monospace,monospace;font-size:13px;width:46px;white-space:nowrap;color:var(--stg-mute);}
.gp-rk.first{color:var(--stg-ink);font-weight:500;}
.gp-rk.first::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#e8b43a;margin-right:6px;vertical-align:1px;}
.gp-who{display:flex;align-items:center;gap:10px;min-width:0;}
.gp-nm{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gp-sub{font-size:12px;color:var(--stg-mute);}
.gp-pts{font-weight:800;font-size:16px;}
.gp-bar{height:5px;border-radius:3px;background:var(--stg-surf2);margin-top:5px;overflow:hidden;min-width:60px;}
.gp-bar i{display:block;height:100%;background:var(--stg-acc);border-radius:3px;}
.gp-res{font-size:13px;color:var(--stg-ink2);}
.gp-foot{margin:12px 0 0;font-size:12.5px;color:var(--stg-mute);}
.gp-cta{margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:10px;background:var(--stg-surf2);font-size:14px;}
.gp-gamepick{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.grp-gbtn{border:1px solid var(--stg-line2);background:none;color:var(--stg-ink);border-radius:999px;padding:6px 10px 6px 9px;font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:7px;cursor:pointer;}
.grp-gbtn i{width:8px;height:8px;border-radius:50%;display:block;background:var(--gc);}
.grp-gbtn[aria-pressed=true]{border-color:var(--stg-ink);background:var(--stg-ink);color:var(--stg-ground);}
.gp-gn{font-family:"DM Mono",ui-monospace,monospace;font-size:10.5px;opacity:.75;}
.gp-ghead{display:flex;align-items:center;gap:9px;margin-bottom:10px;flex-wrap:wrap;}
.gp-ghead h2{margin:0;font-size:18px;font-weight:800;}
.gp-play{margin-left:auto;font-size:13px;font-weight:800;color:var(--stg-acc-ink);text-decoration:none;}
.gp-mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
.gp-mcard{border:1px solid var(--stg-line);background:var(--stg-surf);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:12px;}
.gp-mcard.me{border-color:var(--stg-acc);}
.gp-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;}
.gp-kv div{display:flex;flex-direction:column;min-width:0;}
.gp-kv b{font-size:16px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gp-spark{display:flex;gap:3px;align-items:flex-end;height:26px;}
.gp-spark i{flex:1;background:var(--stg-acc);border-radius:2px 2px 0 0;}
.gp-spark i.miss{background:var(--stg-surf2);}
.gp-rm{align-self:flex-start;padding:5px 12px;font-size:12px;}
.gp-settings{margin-top:22px;padding-top:16px;border-top:1px solid var(--stg-line);display:flex;flex-direction:column;gap:10px;}
.gp-hgrid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.gp-hlist{list-style:none;margin:6px 0 0;padding:0;}
.gp-hlist li{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--stg-line);font-size:14px;}
.gp-hlist li b{flex:1;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;}
.gp-hd{color:var(--stg-mute);font-family:"DM Mono",ui-monospace,monospace;font-size:11.5px;min-width:112px;}
@media(max-width:900px){.gp-hgrid{grid-template-columns:1fr;}}
@media(max-width:560px){
  .gp-join,.gp-flash,.gp-head,.gp-pane{padding-left:14px;padding-right:14px;}
  .gp-tabs{padding-left:8px;padding-right:8px;}
  .gp-jform{width:100%;}
  .gp-jform .grp-in{flex:1;}
  .hide-sm{display:none;}
  .gp-daynav strong{min-width:0;}
  .gp-board td,.gp-board th{padding-left:5px;padding-right:5px;}
}
`;
