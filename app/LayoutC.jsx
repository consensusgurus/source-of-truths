'use client';

// LAYOUT C, behind a hidden link (owner, 2026-10-09). Opened only by ?layout=c
// on a game page whose page.js mounts this, on a desktop-width window. It
// wraps the real game in the "nothing below the fold" frame mocked up the same
// day: one header (the site, the game, today's slate as squares, your rank),
// the home's index on the left, and a tabbed panel on the right (Board, You,
// Archive, Rules). Nothing about the game, its scoring or its finish changes:
// the flood is position:fixed at z 9000 and covers all of this on its own, and
// the end card lands in the centre column with these panels back around it.
//
// It PORTALS INTO the game's .stage-page root so it inherits the register's
// --stg-* tokens (they are undefined outside it), and pads that root to make
// room. Off the flag, or under 1100px, it renders nothing and touches nothing.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { DAILY_GAMES, DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { circuitById } from '@/lib/circuits';
import { catBlue } from '@/lib/home-blues';
import { gameStatsShort } from '@/lib/daily-row-stats';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';
import { etToday } from './useDayStats';

const MIN_W = 1100;
const CAT_FIXED = ['Word', 'Numbers', 'Logic', 'Sudoku', 'Trivia', 'Geography', 'End Game', 'Cards', 'Arcade', 'Crowd Psychology'];
const CAT_LABEL = { Word: 'Words', 'Crowd Psychology': 'Crowd' };
const TABS = [['board', 'Board'], ['you', 'You'], ['archive', 'Archive'], ['rules', 'Rules']];

const CSS = `
html.lc-on .lc-host{padding:56px 330px 0 232px !important;box-sizing:border-box;min-height:100vh;}
html.lc-on.lc-focus .lc-host{padding:0 !important;}
html.lc-on .lc-host .stg-cap,html.lc-on .lc-host .stg-strip,html.lc-on .lc-host .stg-prog{display:none !important;}
html.lc-on .stage-tail{display:none !important;}
.lc-hd,.lc-nav,.lc-side,.lc-show{font-family:Manrope,system-ui,sans-serif;color:var(--stg-ink,#e9edf4);box-sizing:border-box;}
.lc-hd{position:fixed;top:0;left:0;right:0;height:56px;z-index:80;display:flex;align-items:center;gap:18px;padding:0 20px;
  background:var(--stg-ground,#0b0f1a);border-bottom:1px solid var(--stg-line,rgba(255,255,255,.1));}
.lc-brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:16px;color:inherit;text-decoration:none;flex:none;}
.lc-brand em{font-style:normal;color:var(--stg-acc,#7dd3fc);}
.lc-id{flex:none;display:flex;flex-direction:column;line-height:1.15;padding-left:16px;border-left:1px solid var(--stg-line,rgba(255,255,255,.12));}
.lc-id i{font-style:normal;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.lc-id b{font-size:17px;font-weight:800;}
.lc-strip{flex:1;min-width:0;display:flex;align-items:center;gap:2px;}
.lc-sq{flex:1;min-width:0;height:14px;border-radius:2px;background:var(--stg-line,rgba(255,255,255,.12));display:block;}
.lc-sq.gap{flex:0 0 6px;background:none;}
.lc-sq.now{height:20px;background:transparent;box-shadow:inset 0 0 0 2px var(--c);}
.lc-sq.done{background:var(--c);}
.lc-rk{flex:none;text-align:right;}
.lc-rk b{display:block;font-size:15px;font-weight:800;}
.lc-rk i{font-style:normal;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--stg-mute,#8b95a8);}
.lc-btn{flex:none;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--stg-line,rgba(255,255,255,.16));background:transparent;color:inherit;
  font:700 12px Manrope,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
.lc-btn:hover{border-color:var(--stg-acc,#7dd3fc);}
.lc-nav{position:fixed;top:56px;left:0;bottom:0;width:232px;z-index:80;overflow-y:auto;padding:14px 12px 24px;
  background:var(--stg-ground,#0b0f1a);border-right:1px solid var(--stg-line,rgba(255,255,255,.1));display:flex;flex-direction:column;gap:1px;}
.lc-ix{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;color:inherit;text-decoration:none;font-size:14px;font-weight:600;}
.lc-ix:hover{background:var(--stg-surf,rgba(255,255,255,.05));}
.lc-ix.on{background:var(--stg-surf,rgba(255,255,255,.07));}
.lc-dot{width:8px;height:8px;border-radius:2px;flex:none;}
.lc-sub{display:flex;flex-direction:column;margin:2px 0 6px 18px;}
.lc-g{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:6px;color:var(--stg-mute,#aab5c7);text-decoration:none;font-size:13px;font-weight:600;}
.lc-g:hover{color:var(--stg-ink,#e9edf4);}
.lc-g.now{background:var(--stg-surf,rgba(255,255,255,.07));color:var(--stg-ink,#e9edf4);box-shadow:inset 2px 0 0 var(--c);}
.lc-g s{text-decoration:none;margin-left:auto;font-size:11px;}
.lc-rule{height:1px;background:var(--stg-line,rgba(255,255,255,.1));margin:6px 10px;}
.lc-side{position:fixed;top:56px;right:0;bottom:0;width:330px;z-index:80;display:flex;flex-direction:column;
  background:var(--stg-ground,#0b0f1a);border-left:1px solid var(--stg-line,rgba(255,255,255,.1));}
.lc-tabs{display:flex;border-bottom:1px solid var(--stg-line,rgba(255,255,255,.1));padding:0 8px;flex:none;}
.lc-tab{flex:1;height:38px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--stg-mute,#8b95a8);font:700 12px Manrope,system-ui,sans-serif;cursor:pointer;}
.lc-tab.on{color:var(--stg-ink,#e9edf4);border-bottom-color:var(--stg-acc,#7dd3fc);}
.lc-body{flex:1;overflow-y:auto;padding:16px 20px;font-size:13px;}
.lc-cap{display:flex;justify-content:space-between;font-size:12px;color:var(--stg-mute,#8b95a8);margin-bottom:6px;}
.lc-row{display:grid;grid-template-columns:24px 1fr auto;gap:10px;padding:7px 0;border-bottom:1px solid var(--stg-line,rgba(255,255,255,.07));align-items:baseline;}
.lc-row span:first-child{color:var(--stg-mute,#8b95a8);font-weight:700;}
.lc-row em{font-style:normal;color:var(--stg-mute,#8b95a8);}
.lc-row.me{background:var(--stg-surf,rgba(255,255,255,.07));margin:0 -10px;padding:7px 10px;border-radius:6px;box-shadow:inset 3px 0 0 var(--stg-acc,#7dd3fc);border-bottom:0;}
.lc-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.lc-stat{background:var(--stg-surf,rgba(255,255,255,.05));border-radius:10px;padding:12px;}
.lc-stat b{display:block;font-size:22px;font-weight:800;}
.lc-stat i{font-style:normal;font-size:11px;color:var(--stg-mute,#8b95a8);}
.lc-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}
.lc-day{aspect-ratio:1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-decoration:none;
  color:var(--stg-mute,#8b95a8);background:var(--stg-surf,rgba(255,255,255,.05));}
.lc-day.p{background:var(--stg-acc,#7dd3fc);color:var(--stg-onramp,#08222e);}
.lc-day.t{box-shadow:inset 0 0 0 2px var(--stg-acc,#7dd3fc);color:var(--stg-ink,#e9edf4);}
.lc-mo{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin:14px 0 8px;}
.lc-mo:first-child{margin-top:0;}
.lc-how{font-size:14px;line-height:1.55;}
.lc-show{position:fixed;top:12px;right:16px;z-index:80;}
.lc-empty{color:var(--stg-mute,#8b95a8);}
`;

function readLocalDone(keys, today) {
  const out = new Set();
  for (const k of keys) {
    try {
      const c = JSON.parse(localStorage.getItem(`sot_${k}_day`) || 'null');
      if (c && c.d === today && c.done) out.add(k);
    } catch (e) {}
  }
  return out;
}

function monthName(iso) {
  try { return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}

export default function LayoutC({ gameKey }) {
  const game = DAILY_GAME_MAP[gameKey] || null;
  const [host, setHost] = useState(null);
  const [focus, setFocus] = useState(false);
  const [tab, setTab] = useState('board');
  const [status, setStatus] = useState(null);
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [localDone, setLocalDone] = useState(() => new Set());
  const [tick, setTick] = useState(0);

  const sudokuKeys = useMemo(() => new Set(((circuitById('sudoku') || {}).keys) || []), []);
  const catOf = useCallback((k) => (sudokuKeys.has(k) ? 'Sudoku' : (DAILY_GAME_MAP[k] || {}).cat), [sudokuKeys]);
  const roster = useMemo(() => liveDailyKeys(), []);
  const myCat = game ? catOf(game.key) : null;

  // Only on a wide window, and only once mounted: the server never renders this.
  useEffect(() => {
    if (!game) return undefined;
    let el = null;
    const attach = () => {
      const tops = Array.from(document.querySelectorAll('.stage-page'));
      el = tops.find((n) => n.querySelector('.stg-top')) || null;
      if (!el || window.innerWidth < MIN_W) {
        document.documentElement.classList.remove('lc-on');
        if (el) el.classList.remove('lc-host');
        setHost(null);
        return;
      }
      el.classList.add('lc-host');
      document.documentElement.classList.add('lc-on');
      setHost(el);
    };
    attach();
    const late = setTimeout(attach, 400);
    window.addEventListener('resize', attach);
    return () => {
      clearTimeout(late);
      window.removeEventListener('resize', attach);
      document.documentElement.classList.remove('lc-on', 'lc-focus');
      if (el) el.classList.remove('lc-host');
    };
  }, [game]);

  useEffect(() => {
    document.documentElement.classList.toggle('lc-focus', focus);
  }, [focus]);

  // The data: today's slate status, this game's board, this game's record.
  useEffect(() => {
    if (!host || !game) return undefined;
    let alive = true;
    const fresh = tick > 0;
    setLocalDone(readLocalDone(roster, etToday()));
    const { anonId, email } = dailyMeIdentity();
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    if (qs.toString()) {
      fetch('/api/quiz/daily-status?' + qs.toString())
        .then((r) => r.json()).then((d) => { if (alive && d) setStatus(d); }).catch(() => {});
    }
    fetchDailyMe(dailyMeQuery({ anonId, email, game: game.key }), { fresh })
      .then((d) => { if (alive && d && !d.error) setMe(d); }).catch(() => {});
    const gq = new URLSearchParams({ game: game.key });
    if (anonId) gq.set('anonId', anonId);
    if (email) gq.set('email', email);
    fetch('/api/quiz/daily-game?' + gq.toString())
      .then((r) => r.json()).then((d) => { if (alive && d && !d.error) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, [host, game, tick, roster]);

  // A finish changes the slate, the board and the record: ask again once the card is up.
  useEffect(() => {
    const on = (e) => {
      const d = e && e.detail;
      if (d && d.open === false) return;
      setTimeout(() => setTick((t) => t + 1), 1500);
    };
    window.addEventListener('sot:loft-finish', on);
    return () => window.removeEventListener('sot:loft-finish', on);
  }, []);

  if (!game || !host) return null;

  const played = new Set([...(status && status.played ? status.played : []), ...localDone]);
  const groups = CAT_FIXED.map((c) => ({ cat: c, keys: roster.filter((k) => catOf(k) === c) })).filter((g) => g.keys.length);
  const strip = [];
  groups.forEach((g, gi) => {
    g.keys.forEach((k) => strip.push({ k, cat: g.cat }));
    if (gi < groups.length - 1) strip.push({ gap: true, k: 'gap' + gi });
  });
  const myGames = roster.filter((k) => catOf(k) === myCat)
    .map((k) => DAILY_GAME_MAP[k]).sort((a, b) => a.name.localeCompare(b.name));
  const nextUp = myGames.find((g) => g.key !== game.key && !played.has(g.key));

  const board = me && me.game && Array.isArray(me.game.board) ? me.game.board : [];
  const field = me && me.game && typeof me.game.field === 'number' ? me.game.field : board.length;
  const meRow = me && me.me && me.me.rank != null ? me.me : null;
  const mine = data && data.mine ? data.mine : null;
  const drops = data && Array.isArray(data.drops) ? data.drops.slice(-42) : [];
  const months = [];
  drops.forEach((d) => {
    const m = monthName(d.dateISO);
    if (!months.length || months[months.length - 1].m !== m) months.push({ m, days: [] });
    months[months.length - 1].days.push(d);
  });
  const theme = () => { try { const b = document.querySelector('.stg-theme'); if (b) b.click(); } catch (e) {} };

  const ui = (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {focus ? (
        <button type="button" className="lc-btn lc-show" onClick={() => setFocus(false)}>Show menus &amp; leaderboard</button>
      ) : (
        <>
          <header className="lc-hd">
            <a className="lc-brand" href="/today">Mind <em>Loft</em></a>
            <div className="lc-id">
              <i>{CAT_LABEL[myCat] || myCat}</i>
              <b>{game.name}</b>
            </div>
            <nav className="lc-strip" aria-label="Today's puzzles">
              {strip.map((s) => (s.gap ? <span key={s.k} className="lc-sq gap" /> : (
                <a key={s.k} href={DAILY_GAME_MAP[s.k].href || '/' + s.k}
                  title={DAILY_GAME_MAP[s.k].name + (played.has(s.k) ? ' (played)' : '')}
                  className={'lc-sq' + (s.k === game.key ? ' now' : played.has(s.k) ? ' done' : '')}
                  style={{ '--c': catBlue(s.cat) }} />
              )))}
            </nav>
            {status && status.dayRank ? (
              <div className="lc-rk"><b>#{status.dayRank}</b><i>Today</i></div>
            ) : null}
            <button type="button" className="lc-btn" onClick={theme} aria-label="Switch light or dark">Light / dark</button>
            <button type="button" className="lc-btn" onClick={() => setFocus(true)}>Hide menus &amp; leaderboard</button>
          </header>

          <nav className="lc-nav" aria-label="Puzzles">
            <a className="lc-ix" href="/today"><span className="lc-dot" style={{ background: 'var(--stg-ink,#e9edf4)' }} />All Puzzles</a>
            <div className="lc-rule" />
            {groups.map((g) => (
              <React.Fragment key={g.cat}>
                <a className={'lc-ix' + (g.cat === myCat ? ' on' : '')} href="/today">
                  <span className="lc-dot" style={{ background: catBlue(g.cat) }} />{CAT_LABEL[g.cat] || g.cat}
                </a>
                {g.cat === myCat ? (
                  <div className="lc-sub">
                    {myGames.map((x) => (
                      <a key={x.key} href={x.key === game.key ? '#' : (x.href || '/' + x.key)}
                        className={'lc-g' + (x.key === game.key ? ' now' : '')} style={{ '--c': catBlue(g.cat) }}>
                        {x.name}
                        <s>{x.key === game.key ? (played.has(x.key) ? '✓' : 'now') : played.has(x.key) ? '✓' : (nextUp && nextUp.key === x.key ? 'Up next' : '')}</s>
                      </a>
                    ))}
                  </div>
                ) : null}
              </React.Fragment>
            ))}
            <div className="lc-rule" />
            <a className="lc-ix" href="/today"><span className="lc-dot" style={{ background: '#64748b' }} />Circuits</a>
            <a className="lc-ix" href="/quizzes"><span className="lc-dot" style={{ background: '#64748b' }} />Quizzes</a>
          </nav>

          <aside className="lc-side" aria-label={game.name + ' panel'}>
            <div className="lc-tabs" role="tablist">
              {TABS.map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id}
                  className={'lc-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{label}</button>
              ))}
            </div>
            <div className="lc-body">
              {tab === 'board' ? (
                <>
                  <div className="lc-cap"><span>Today{field ? ` · ${field} ${field === 1 ? 'player' : 'players'}` : ''}</span></div>
                  {board.length ? board.slice(0, 14).map((r, i) => {
                    const isMe = meRow && r.userKey && r.userKey === meRow.userKey;
                    return (
                      <div key={(r.userKey || r.username || '') + i} className={'lc-row' + (isMe ? ' me' : '')}>
                        <span>{r.rank != null ? r.rank : i + 1}</span>
                        <b>{isMe ? 'You' : (r.username || 'Guest')}</b>
                        <em>{gameStatsShort(r, game.key) || ''}</em>
                      </div>
                    );
                  }) : <div className="lc-empty">Nobody on the board yet today.</div>}
                  {meRow && !board.slice(0, 14).some((r) => r.userKey && r.userKey === meRow.userKey) ? (
                    <div className="lc-row me"><span>{meRow.rank}</span><b>You</b><em>{gameStatsShort(meRow, game.key) || ''}</em></div>
                  ) : null}
                </>
              ) : null}
              {tab === 'you' ? (
                mine ? (
                  <div className="lc-stats">
                    <div className="lc-stat"><b>{mine.plays || 0}</b><i>Played</i></div>
                    <div className="lc-stat"><b>{mine.currentStreak || 0}</b><i>Current streak</i></div>
                    <div className="lc-stat"><b>{mine.longestStreak || 0}</b><i>Longest streak</i></div>
                    <div className="lc-stat"><b>{mine.avgPoints != null ? mine.avgPoints : '–'}</b><i>Avg points</i></div>
                  </div>
                ) : <div className="lc-empty">Play a day and your record shows up here.</div>
              ) : null}
              {tab === 'archive' ? (
                months.length ? months.map((mo) => (
                  <div key={mo.m}>
                    <div className="lc-mo">{mo.m}</div>
                    <div className="lc-cal">
                      {mo.days.map((d) => (
                        <a key={d.num} className={'lc-day' + (d.isToday ? ' t' : d.played ? ' p' : '')}
                          href={d.isToday ? `/${game.key}?layout=c` : `/${game.key}?p=${d.num}&layout=c`}
                          title={d.dateISO}>{Number(String(d.dateISO).slice(8, 10))}</a>
                      ))}
                    </div>
                  </div>
                )) : <div className="lc-empty">Loading the archive.</div>
              ) : null}
              {tab === 'rules' ? (
                <div className="lc-how"><p style={{ marginTop: 0 }}><b>{game.tag}.</b></p><p>{game.how}</p></div>
              ) : null}
            </div>
          </aside>
        </>
      )}
    </>
  );
  return createPortal(ui, host);
}
