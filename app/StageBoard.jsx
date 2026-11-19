'use client';

// THE PHONE LEADERBOARD UNDER THE STAGE (owner, 2026-11-19: "every puzzle page
// on mobile needs a button at bottom of screen to show leaderboard. It would
// then appear below and toggle back to hidden").
//
// Mounted by StageFoot, so every daily that draws the stage foot gets it with no
// per-game wiring. The game is read off the page's own route and resolved
// through the roster (the same way GamePanel resolves `self`), so a page that is
// not a daily (a run, a quiz) resolves to nothing and draws nothing.
//
// Hidden by default and remembered site-wide once shown, per the 2026-10-13
// reveal rulings (lib/reveal-pref.js, REVEAL.leaderboard). Nothing is fetched
// until it is opened; it reads the same /api/quiz/daily-me request the end card
// and GamePanel already share, and reads it fresh once the game ends so the
// player's own finish shows up. Phone only: at 900px and up the page has its
// own standings.

import React, { useEffect, useState } from 'react';
import { useRevealPref, REVEAL } from '@/lib/reveal-pref';
import { DAILY_GAMES, DAILY_GAME_MAP } from '@/lib/daily-games';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';

const SHOW_ROWS = 10;

function gameFromPath() {
  try {
    const seg = (window.location.pathname || '').split('/').filter(Boolean)[0];
    if (!seg) return null;
    if (DAILY_GAME_MAP[seg]) return DAILY_GAME_MAP[seg];
    return DAILY_GAMES.find((g) => g.href === '/' + seg) || null;
  } catch (e) { return null; }
}

function fmtPts(x) {
  if (x == null || x === '') return '';
  const v = Math.round(Number(x) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function fmtTime(s) {
  const n = Number(s);
  if (!n || n < 0) return '';
  const m = Math.floor(n / 60), r = Math.round(n % 60);
  return m ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}

export default function StageBoard({ ended = false }) {
  const [game, setGame] = useState(null);
  const [shown, toggle] = useRevealPref(REVEAL.leaderboard);
  const [me, setMe] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setGame(gameFromPath()); }, []);

  const key = game ? game.key : null;
  useEffect(() => {
    if (!shown || !key) return undefined;
    let alive = true;
    const { anonId, email } = dailyMeIdentity();
    fetchDailyMe(dailyMeQuery({ anonId, email, game: key }), { fresh: !!ended })
      .then((d) => { if (alive) { if (d && !d.error) { setMe(d); setFailed(false); } else setFailed(true); } })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [shown, key, ended]);

  if (!game) return null;

  const board = me && me.game ? me.game : null;
  const rows = board && Array.isArray(board.board) ? board.board.slice(0, SHOW_ROWS) : [];
  const field = board && typeof board.field === 'number' ? board.field : null;
  const mine = me && me.me && me.me.rank != null ? me.me : null;
  const meKey = mine ? mine.userKey : null;
  const meShown = !!(meKey && rows.some((r) => r.userKey === meKey));

  return (
    <div className="sbd">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button type="button" className="sbd-b" onClick={(e) => { e.stopPropagation(); toggle(); }} aria-expanded={shown}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4" /></svg>
        <span>{shown ? 'Hide leaderboard' : 'Show leaderboard'}</span>
      </button>
      {shown ? (
        <div className="sbd-p" role="region" aria-label={`${game.name} leaderboard today`}>
          <div className="sbd-h">
            <b>Today</b>
            {field != null ? <span>{field.toLocaleString('en-US')} playing</span> : null}
          </div>
          {!me && !failed ? <div className="sbd-e">Loading standings&hellip;</div> : null}
          {failed && !me ? <div className="sbd-e">Standings could not load. Try again in a moment.</div> : null}
          {me && !rows.length ? <div className="sbd-e">No scores yet today. Be the first.</div> : null}
          {rows.map((r, i) => {
            const isMe = meKey && r.userKey === meKey;
            return (
              <div key={r.userKey || i} className={'sbd-r' + (isMe ? ' me' : '')}>
                <span className="pl">{r.rank || i + 1}</span>
                <span className="nm">{r.username || 'Player'}{isMe ? ' (you)' : ''}</span>
                <span className="tm">{fmtTime(r.timeElapsed)}</span>
                <span className="sc">{fmtPts(r.points != null ? r.points : r.score)}</span>
              </div>
            );
          })}
          {mine && !meShown ? (
            <div className="sbd-r me">
              <span className="pl">{mine.rank}</span>
              <span className="nm">You</span>
              <span className="tm">{fmtTime(mine.time)}</span>
              <span className="sc">{fmtPts(mine.points != null ? mine.points : mine.score)}</span>
            </div>
          ) : null}
          <a className="sbd-a" href={`/quizzes/hub?tab=daily&game=${game.key}`}>Full standings</a>
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
.sbd{display:none;}
@media (max-width:899px){
  .sbd{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;flex:none;padding:4px 0 14px;box-sizing:border-box;}
  .sbd-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;box-sizing:border-box;padding:0 14px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:800;line-height:1;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;}
  .sbd-b[aria-expanded='true']{background:currentColor;}
  .sbd-b[aria-expanded='true'] span,.sbd-b[aria-expanded='true'] svg{color:var(--pst-bg, var(--sft-bg, #fff));}
  .sbd-p{width:100%;box-sizing:border-box;border:1px solid currentColor;border-radius:14px;overflow:hidden;text-align:left;}
  .sbd-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 14px 8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.4;}
  .sbd-h span{letter-spacing:.04em;opacity:.8;}
  .sbd-e{padding:10px 14px 12px;font-size:13px;font-weight:700;line-height:1.4;border-top:1px solid color-mix(in srgb, currentColor 18%, transparent);}
  .sbd-r{display:flex;align-items:center;gap:10px;min-height:42px;padding:6px 14px;box-sizing:border-box;font-size:14px;font-weight:700;line-height:1.35;border-top:1px solid color-mix(in srgb, currentColor 18%, transparent);}
  .sbd-r.me{font-weight:800;background:color-mix(in srgb, currentColor 9%, transparent);}
  .sbd-r .pl{flex:none;width:26px;font-weight:800;font-variant-numeric:tabular-nums;}
  .sbd-r .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
  .sbd-r .tm{flex:none;font-size:12.5px;opacity:.8;font-variant-numeric:tabular-nums;}
  .sbd-r .sc{flex:none;min-width:30px;text-align:right;font-weight:800;font-variant-numeric:tabular-nums;}
  .sbd-a{display:block;padding:11px 14px;border-top:1px solid color-mix(in srgb, currentColor 18%, transparent);color:inherit;font-size:13px;font-weight:800;text-decoration:none;text-align:center;}
}
`;
