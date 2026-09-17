'use client';

// The expanded state of a daily-puzzle tile on the quiz home board (owner
// request, 2026-07-29). It OVERLAYS the tile grid rather than being inserted
// into it, so the board's height never changes and nothing on the page moves.
// DailyStrip renders it absolutely inside .dhome, so it covers the ENTIRE
// console including the stats bar at the top: the bar's own Play button sat
// inches from this panel's Play button, which read as two competing controls
// (owner, 2026-07-29).
//
// LAYOUT (owner, 2026-07-29): the panel is pinned to all four edges of the board
// body so it covers the grid, but its CONTENT is compact and top-aligned. An
// earlier version stretched the rows and the calendar to fill every pixel; that
// spread the stats into widely spaced lines and left the month floating in its
// column, so it was reverted. Natural row heights and a square calendar read
// cleaner, and the leftover navy at the bottom is simply quiet space.
//
// EQUAL CARD HEIGHTS (owner rule, 2026-08-01, and NOT a return to the above):
// the three cards in that row always end on the same line. The height comes
// from the archive card, whose calendar is padded to six week rows so it is
// the tallest possible month rather than whatever month is on screen; the
// record and leaderboard cards stretch to that line and spend the extra space
// on their own rows. The bottom strip below the row is unaffected, so the
// panel still ends in quiet space rather than stretching to the floor.
//
// What it shows: identity plus a one-sentence how-to-play (roster field `how` in
// lib/daily-games.js), a large Play button and an equally obvious close, today's
// record, the viewer's all-time record for the game, archive completion, streak
// detail, community size, a month calendar of the archive, and the game's
// all-time leaderboard. Everything past "today" comes from ONE lazy fetch of
// /api/quiz/daily-game, cached per game by the parent.

import React, { useEffect, useMemo, useState } from 'react';
import GameGlyph from './GameGlyph';
import { Play, X, Flame, Crown, ChevronLeft, ChevronRight, CalendarDays, Trophy, TrendingUp, Share2, Users, Star } from 'lucide-react';
import { DAILY_GAME_MAP } from '../lib/daily-games';
import { T } from '@/lib/theme';
import { CONTEST, contestIsLive } from '@/lib/contest';
// gameStats/mmss moved to lib/daily-row-stats.js so the stage's leader strip
// reads a board row the SAME way this panel does (owner, 2026-08-31).
import { gameStats } from '@/lib/daily-row-stats';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CAL_WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TREND_MAX = 24; // most recent drops charted, so the row stays readable
// The phone drawer's three section bands, in the order they are placed by CSS
// order below 900px. One list, so the bands and the open-by-default set can
// never disagree about what a section is called.
const PHONE_SECTIONS = [['rec', 'Your record'], ['lb', 'Leaderboards'], ['arc', 'Archive']];
const PHONE_SECS = PHONE_SECTIONS.map(([k]) => k);

// The Crowd Psychology games (owner, 2026-08-01). For these three the panel's
// bottom section leads with TODAY'S CROWD ANSWERS rather than the viewer's score
// history, because the crowd tally IS the game's artifact: the answer key is
// whatever the day's players said, and it moves all day. The history chart is
// still there, one click away, and stays the only view for every other game.
//
// SPOILER GATE (owner rule, 2026-08-01): the crowd view is offered ONLY to a
// player who has already locked in today's puzzle. Someone who has not played
// sees no crowd tab at all and lands on the chart, and /api/quiz/crowd-today
// independently refuses to return any tally to them, so the answers cannot be
// reached from here either by clicking or by calling the route.
const CROWD_GAMES = new Set(['outwit', 'outrank', 'feud']);
function shortDate(iso) {
  const p = String(iso || '').split('-');
  return p.length === 3 ? MONTH_SHORT[Number(p[1]) - 1] + ' ' + Number(p[2]) : '';
}

function etTodayISO() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function fmtPts(x) { const v = Math.round(Number(x) * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); }
// m:ss, or h:mm:ss on the rare long one. A board row's timeElapsed is wall clock
// from open to finish, so a puzzle someone left in a tab can genuinely run hours.

export default function DailyTilePanel({
  game, accent, isDone = false, inProgress = false, streak = 0,
  todayRow = null, todayField = null, standings = [], meKey = null,
  data = null, canPin = false, pinned = false, onTogglePin = null, onClose,
  expandAll = false,
}) {
  const todayISO = etTodayISO();
  const how = (DAILY_GAME_MAP[game.key] && DAILY_GAME_MAP[game.key].how) || game.tag;
  // THIS GAME'S OWN WORD for the figure every daily posts in `guessesUsed`,
  // read from the registry the same way DailyBoardPanel and DailyEndCard read
  // it. Null on the sixteen games that post no such figure, which drops the
  // term rather than printing a borrowed one (owner, 2026-09-01).
  const missLabel = (DAILY_GAME_MAP[game.key] || {}).miss || null;

  const drops = (data && Array.isArray(data.drops)) ? data.drops : [];
  const allTime = (data && data.allTime) || null;
  const mine = (data && data.mine) || null;
  const loading = !data;

  // Which phone sections are open. On the home board this is an ACCORDION, one
  // at a time: the whole point there is height, and two open sections is most of
  // the way back to the single-level drawer it replaced.
  //
  // ON THE GAME'S OWN PAGE IT OPENS FLAT (owner, 2026-08-26). `expandAll` is set
  // by GamePanel, where the reader has already pressed a control that names all
  // three sections by name, so meeting it with three shut bands is a lid on top
  // of a lid: the height the accordion saves is height they asked for. The bands
  // stay, and each one closes on its own there rather than closing its
  // neighbours, because with everything open an accordion tap reads as the panel
  // collapsing rather than as one section shutting.
  //
  // DESKTOP IS UNTOUCHED EITHER WAY. Above 900px the bands are display:none and
  // all three columns render regardless, so this state decides nothing there.
  const [secs, setSecs] = useState(() => new Set(expandAll ? PHONE_SECS : []));
  const secOpen = (k) => secs.has(k);
  const toggleSec = (k) => setSecs((cur) => {
    const next = new Set(expandAll ? cur : []);   // accordion unless expandAll
    if (cur.has(k)) next.delete(k); else next.add(k);
    return next;
  });
  // The share chip named a dollar figure as a hardcoded literal, which went
  // stale the moment the prize changed (it still said $20 after the top prize
  // became $200) and promised a contest outside its own window. Both come from
  // lib/contest now. Resolved after mount, never during render: contestIsLive()
  // reads the clock and this panel ships inside a statically rendered page.
  const [promo, setPromo] = useState(false);
  // Feedback for the share chip below. It used to hand the share to the
  // share pop-up, which owned its own confirmation; with that gone the chip
  // does the share itself and has to say so.
  const [shared, setShared] = useState(false);
  useEffect(() => { setPromo(contestIsLive()); }, []);
  const [calMonth, setCalMonth] = useState(() => todayISO.slice(0, 7));
  useEffect(() => { setCalMonth(todayISO.slice(0, 7)); }, [game.key, todayISO]);

  // Today's crowd answers, for the three crowd games only, and only once the
  // viewer has finished today's puzzle. `isDone` gates the REQUEST (so a
  // non-player's browser never even asks) and the route gates the ANSWER by
  // account, which is what covers the case where this browser looks unplayed
  // but the account played elsewhere. crowd === null means still loading.
  const isCrowdGame = CROWD_GAMES.has(game.key);
  const [crowd, setCrowd] = useState(null);
  const [crowdFailed, setCrowdFailed] = useState(false);
  useEffect(() => {
    setCrowd(null); setCrowdFailed(false);
    if (!isCrowdGame || !isDone) return;
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); email = id && id.email; } catch (e) {}
    if (!anonId && !email) { setCrowdFailed(true); return; }
    const qs = new URLSearchParams({ game: game.key });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    let alive = true;
    fetch('/api/quiz/crowd-today?' + qs.toString())
      .then((r) => r.json())
      .then((d) => { if (!alive) return; if (d && d.ok) setCrowd(d); else setCrowdFailed(true); })
      .catch(() => { if (alive) setCrowdFailed(true); });
    return () => { alive = false; };
  }, [game.key, isCrowdGame, isDone]);

  // The crowd tab exists only when there is (or may still be) crowd data to
  // show. `view` stays null until the reader picks a side, so the default is
  // crowd wherever it is available and the chart everywhere else, but an
  // explicit click is never overridden by data landing late.
  const crowdGroups = (crowd && crowd.played && Array.isArray(crowd.groups)) ? crowd.groups : [];
  const crowdReady = crowdGroups.length > 0;
  const crowdPending = isCrowdGame && isDone && !crowd && !crowdFailed;
  const crowdOffered = crowdReady || crowdPending;
  const [view, setView] = useState(null);
  const showCrowd = crowdOffered && view !== 'trend';

  // NO AUTO-SCROLL ON OPEN (owner, 2026-08-07). There used to be a
  // scrollIntoView here for small screens: back when the home board was a TILE
  // GRID, the in-flow panel replaced tiles that were hidden beneath it, so a
  // tile tapped low down could leave the page scrolled past where the panel
  // now began. The slate opens this drawer directly under its own row and
  // hides nothing, so the call had nothing left to correct and simply shifted
  // the page down on every open. Do not reintroduce it.

  // Esc closes, matching the Close button.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dropByISO = useMemo(() => new Map(drops.map((d) => [d.dateISO, d])), [drops]);
  const earliestYM = drops.length ? drops[0].dateISO.slice(0, 7) : todayISO.slice(0, 7);
  const latestYM = todayISO.slice(0, 7);
  const [calY, calM] = calMonth.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(calY, calM - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(calY, calM, 0)).getUTCDate();
  const cells = [];
  for (let k = 0; k < firstWeekday; k++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // ALWAYS six week rows, even for a month that only needs four or five (owner,
  // 2026-08-01). The calendar is the tallest of the three columns, so letting
  // its height float by month made the whole row of cards change height as the
  // reader paged through the archive. Padding to the tallest POSSIBLE month
  // fixes the column, and the two columns to its left stretch to match it.
  while (cells.length < 42) cells.push(null);
  const shiftMonth = (delta) => {
    let y = calY, m = calM + delta;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setCalMonth(y + '-' + String(m).padStart(2, '0'));
  };

  const todayScore = todayRow
    ? (todayRow.total != null && Number(todayRow.total) > 0
      ? fmtPts(todayRow.score) + '/' + fmtPts(todayRow.total)
      : (todayRow.score != null ? fmtPts(todayRow.score) : fmtPts(todayRow.points)))
    : null;
  const beatPct = (todayRow && todayField > 0)
    ? Math.max(0, Math.round(((todayField - todayRow.rank) / todayField) * 100)) : null;

  const totalDrops = drops.length;
  const playedCount = mine ? mine.plays : drops.filter((d) => d.played).length;
  const archivePct = totalDrops ? Math.round((playedCount / totalDrops) * 100) : null;
  const longest = mine ? Math.max(mine.longestStreak || 0, streak || 0) : streak;
  const dash = loading ? '·' : '—';

  const trend = useMemo(() => {
    const per = (mine && mine.perDrop) || {};
    const vals = drops.slice(-TREND_MAX).map((d) => ({
      iso: d.dateISO, href: d.href, isToday: d.isToday,
      pts: (per[d.dateISO] != null ? Number(per[d.dateISO]) : null),
    }));
    const played = vals.filter((v) => v.pts != null);
    const max = played.length ? Math.max(...played.map((v) => v.pts)) : 0;
    const avg = played.length ? played.reduce((a, v) => a + v.pts, 0) / played.length : null;
    return { vals, max, avg, count: played.length };
  }, [drops, mine]);
  const avgPct = (trend.max > 0 && trend.avg != null) ? Math.min(97, (trend.avg / trend.max) * 100) : null;
  // Past ~12 columns a per-bar date label stops fitting, so the chart falls back
  // to the two end dates.
  const denseTrend = trend.vals.length > 12;

  const board = (allTime && Array.isArray(allTime.board)) ? allTime.board.slice(0, 3) : [];
  const meOnBoard = board.some((r) => r.isMe);
  const myRank = allTime && allTime.myRank;
  const todayTop = (standings || []).slice(0, 3);
  const meInTodayTop = !!(meKey && todayTop.some((r) => r.userKey === meKey));

  // ── THE SLAB (DESKTOP ONLY, owner-approved direction B2, 2026-08-10) ──────
  // The drawer opens to answer one question, "how am I doing at this game", and
  // the desktop version used to answer it with four dashes in a 2x2 grid of
  // bordered tiles. This is that answer in one line, in the shape of the
  // slate's Up next cap bar: eyebrow, big name, sub, one control on the right
  // edge. It carries PLAY, so the desktop header keeps only Close.
  //
  // THE PHONE DRAWER IS DELIBERATELY UNCHANGED by this pass (owner,
  // 2026-08-10). Every rule that builds the slab, the bands and the recoloured
  // calendar lives in a min-width:901px block appended at the END of the
  // stylesheet, so nothing below 900px resolves differently than it did before:
  // the phone drawer already carries Play in its navy header strip and already
  // renders each card as a band plus full-width content, which is the same
  // direction, arrived at first.
  const playLabel = isDone ? 'Play again' : (inProgress ? 'Resume' : 'Play');
  const slabEyebrow = isDone ? 'Today · done' : (inProgress ? 'Today · in progress' : 'Today · not played yet');
  const slabHeadline = todayScore
    ? 'You scored ' + todayScore
    : (mine && mine.avgPoints != null
      ? 'You average ' + fmtPts(mine.avgPoints) + ' a day'
      : (loading ? '…' : 'Your first run'));
  const slabBits = [];
  if (todayRow && todayRow.rank) slabBits.push('#' + todayRow.rank + ' today');
  if (mine && mine.bestPoints != null) slabBits.push('best ' + fmtPts(mine.bestPoints));
  if (myRank) slabBits.push('#' + myRank + (allTime && allTime.field ? ' of ' + allTime.field.toLocaleString() : '') + ' all time');
  if (longest) slabBits.push(longest + ' day streak');
  if (archivePct != null) slabBits.push(archivePct + '% of the archive');
  const slabSub = slabBits.length
    ? slabBits.join(' · ')
    : (loading ? ' ' : 'Play it once and your record starts here.');

  return (
    <div className="dtp" style={{ '--gc': accent }} role="region" aria-label={game.name + ' details'}>
      <div className="dtp-hd">
        <span className="dtp-ic"><GameGlyph gameKey={game.key} size={26} on="light" /></span>
        <div className="dtp-idt">
          <div className="dtp-nm">
            <span className="dtp-nmt">{game.name}</span>
            {streak >= 2 ? <span className="dtp-flame"><Flame size={12} strokeWidth={2.6} />{streak}</span> : null}
            {isDone ? <span className="dtp-donechip">Done today</span> : null}
            {/* Shares THIS game rather than the quizzes home the panel sits on,
                so the credit link sends people straight to it. */}
            {/* THE ONE SHARE HANDLER THAT HAD NO FALLBACK. Every other Share
                button on the site tries the share pop-up and then does its own
                native-share or clipboard copy when the pop-up declines, so when
                the pop-up was stubbed out on 2026-08-30 they all carried on
                working. This chip's only action WAS the pop-up, so it needed
                the fallback writing. Native sheet where there is one, clipboard
                everywhere else. */}
            <button
              type="button"
              className="dtp-sharechip"
              onClick={() => {
                const base = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';
                const url = base + game.href;
                const text = `${game.name} on Mind Loft\n${url}`;
                try {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({ text }).catch(() => {});
                    return;
                  }
                } catch (e) { /* fall through to the clipboard */ }
                try {
                  navigator.clipboard?.writeText(text).then(() => {
                    setShared(true);
                    setTimeout(() => setShared(false), 1800);
                  });
                } catch (e) { /* no clipboard: the chip simply does nothing */ }
              }}
            ><Share2 size={11} strokeWidth={2.6} />{shared ? 'Link copied' : (promo ? `Share for ${CONTEST.prizeLabel}*` : 'Share this game')}</button>
            {/* Pin this game to the top of the home board (owner, 2026-08-02).
                This is the ONLY pin control for a FINISHED game: that tile is
                itself a button, so it can only carry a static star, and the
                panel it opens is where the toggle lives. Registered viewers
                only, since the set is stored on the account. */}
            {canPin && onTogglePin ? (
              <button
                type="button"
                className={'dtp-pinchip' + (pinned ? ' on' : '')}
                onClick={onTogglePin}
                aria-pressed={pinned}
                title={pinned ? 'Remove from your games' : 'Show this game first on your board'}
              >
                <Star size={11} strokeWidth={2.6} fill={pinned ? T.gold : 'none'} />
                {pinned ? 'One of your games' : 'Pin to your games'}
              </button>
            ) : null}
          </div>
          <p className="dtp-how">{how}</p>
        </div>
        <div className="dtp-acts">
          <a href={game.href} className="dtp-play">
            <Play size={15} fill="currentColor" strokeWidth={0} />
            {isDone ? 'Play again' : (inProgress ? 'Resume' : 'Play')}
          </a>
          <button type="button" className="dtp-shrink" onClick={onClose}><X size={14} strokeWidth={2.6} />Close</button>
        </div>
      </div>

      {/* Desktop only, see the slab comment above. display:none below 901px,
          where the phone header strip is already the drawer's control row. */}
      <div className="dtp-slab">
        <div className="dtp-stxt">
          <div className="dtp-seye">{slabEyebrow}</div>
          <div className="dtp-snm">{slabHeadline}</div>
          <div className="dtp-ssub">{slabSub}</div>
        </div>
        <a href={game.href} className="dtp-sgo">
          <Play size={14} fill="currentColor" strokeWidth={0} />{playLabel}
        </a>
      </div>

      {/* Phone-only section bands. They are rendered here but PLACED by CSS
          order inside the <=900px block, each one immediately above the block it
          opens, so the reader gets band / content / band / content down the
          drawer. Above 900px they are display:none and the three cards sit side
          by side exactly as before. */}
      {PHONE_SECTIONS.map(([k, label]) => (
        <button
          key={k}
          type="button"
          className={`dtp-sec ${k}${secOpen(k) ? ' on' : ''}`}
          onClick={() => toggleSec(k)}
          aria-expanded={secOpen(k)}
        >
          <span>{label}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      ))}

      {/* `cw` = a crowd game, whose bottom strip is a grid of prompt cards and
          therefore needs the full panel width rather than the record column.
          See the desktop grid placement at the foot of the stylesheet. */}
      <div className={`dtp-grid${isCrowdGame ? ' cw' : ''}`}>
        <section className={`dtp-col${secOpen('rec') ? ' open' : ''}`}>
          <div className="dtp-lab">Your record</div>
          <div className="dtp-stats">
            <div><b>{todayScore || (isDone ? 'Done' : '—')}</b><span>Today</span></div>
            <div><b>{todayRow && todayRow.rank ? '#' + todayRow.rank : '—'}</b><span>Rank today</span></div>
            <div><b>{streak || '—'}</b><span>Streak</span></div>
            <div><b>{loading ? dash : (myRank ? '#' + myRank : '—')}</b><span>All-time rank</span></div>
          </div>
          <div className="dtp-rows">
            <div className="dtp-row"><span>Archive played</span><b>{loading ? dash : playedCount + ' of ' + totalDrops + (archivePct != null ? ' · ' + archivePct + '%' : '')}</b></div>
            <div className="dtp-row"><span>Best day</span><b>{loading ? dash : (mine && mine.bestPoints != null ? fmtPts(mine.bestPoints) + ' pts' : '—')}</b></div>
            <div className="dtp-row"><span>Average day</span><b>{loading ? dash : (mine && mine.avgPoints != null ? fmtPts(mine.avgPoints) + ' pts' : '—')}</b></div>
            <div className="dtp-row"><span>Longest streak</span><b>{loading ? dash : (longest ? longest + ' day' + (longest === 1 ? '' : 's') : '—')}</b></div>
            {beatPct != null ? <div className="dtp-row beat"><span>Today you beat</span><b>{beatPct}% of players</b></div> : null}
          </div>
        </section>

        <section className={`dtp-col${secOpen('lb') ? ' open' : ''}`}>
          <div className="dtp-lab"><Trophy size={12} strokeWidth={2.4} />Today
            {todayField != null ? <span className="dtp-labct">{todayField.toLocaleString()} playing</span> : null}
          </div>
          <div className="dtp-lb">
            {todayTop.length ? (
              <>
                {todayTop.map((r, i) => {
                  const mineRow = meKey && r.userKey === meKey;
                  return (
                    <div key={'t' + (r.userKey || i)} className={'dtp-lrow' + (i === 0 ? ' first' : '') + (mineRow ? ' me' : '')}>
                      <span className="pl">{r.rank === 1 ? <Crown size={12} /> : (r.rank || i + 1)}</span>
                      <b>{r.username || 'Player'}{mineRow ? ' (you)' : ''}</b>
                      <span className="sc">{fmtPts(r.points)}</span>
                      {gameStats(r, missLabel) ? <span className="dtp-lst">{gameStats(r, missLabel)}</span> : null}
                    </div>
                  );
                })}
                {todayRow && !meInTodayTop ? (
                  <div className="dtp-lrow me">
                    <span className="pl">{todayRow.rank || '—'}</span>
                    <b>You</b>
                    <span className="sc">{todayRow.points != null ? fmtPts(todayRow.points) : '—'}</span>
                    {gameStats(todayRow, missLabel) ? <span className="dtp-lst">{gameStats(todayRow, missLabel)}</span> : null}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="dtp-empty">No scores yet today. Be the first.</div>
            )}
          </div>

          <div className="dtp-lab sm"><Trophy size={12} strokeWidth={2.4} />All-time
            {!loading && allTime && allTime.plays != null ? <span className="dtp-labct">{allTime.plays.toLocaleString()} players</span> : null}
          </div>
          <div className="dtp-lb">
            {loading ? (
              <div className="dtp-empty">Loading standings…</div>
            ) : board.length ? (
              <>
                {board.map((r, i) => (
                  <div key={r.userKey || i} className={'dtp-lrow' + (i === 0 ? ' first' : '') + (r.isMe ? ' me' : '')}>
                    <span className="pl">{r.rank === 1 ? <Crown size={12} /> : r.rank}</span>
                    <b>{r.username || 'Player'}{r.isMe ? ' (you)' : ''}</b>
                    <span className="sc">{fmtPts(r.points)}</span>
                  </div>
                ))}
                {myRank && !meOnBoard ? (
                  <div className="dtp-lrow me">
                    <span className="pl">{myRank}</span>
                    <b>You{allTime && allTime.provisional ? ' (prov.)' : ''}</b>
                    <span className="sc">{allTime.myPoints != null ? fmtPts(allTime.myPoints) : '—'}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="dtp-empty">No all-time standings yet. Be the first.</div>
            )}
          </div>
          <div className="dtp-lfoot">
            {allTime && allTime.field ? allTime.field.toLocaleString() + ' ranked' : ''}
            <a href={`/quizzes/hub?tab=daily&game=${game.key}`}>Full standings →</a>
          </div>
        </section>

        <section className={`dtp-col${secOpen('arc') ? ' open' : ''}`}>
          <div className="dtp-lab"><CalendarDays size={12} strokeWidth={2.4} />Archive</div>
          <div className="dtp-calhd">
            <button type="button" onClick={() => shiftMonth(-1)} disabled={calMonth <= earliestYM} aria-label="Previous month"><ChevronLeft size={15} strokeWidth={2.6} /></button>
            <span className="dtp-mo">{MONTH_NAMES[(calM - 1) % 12]} {calY}</span>
            <button type="button" onClick={() => shiftMonth(1)} disabled={calMonth >= latestYM} aria-label="Next month"><ChevronRight size={15} strokeWidth={2.6} /></button>
          </div>
          <div className="dtp-wd">{CAL_WD.map((w, i) => <span key={'w' + i}>{w}</span>)}</div>
          <div className="dtp-cal">
            {cells.map((d, i) => {
              if (d === null) return <span key={'e' + i} className="dtp-cell empty" />;
              const iso = calY + '-' + String(calM).padStart(2, '0') + '-' + String(d).padStart(2, '0');
              const drop = dropByISO.get(iso);
              if (!drop) return <span key={iso} className="dtp-cell none">{d}</span>;
              // THREE states, not two (owner, 2026-08-09). Green is a day you
              // solved, red a day you played and did not, and only the games
              // that never showed you the answer can be red at all: everywhere
              // else the day is simply over. Grey stays "not played yet".
              const cls = 'dtp-cell'
                + (drop.played ? (drop.incomplete ? ' incomplete' : ' played') : ' open')
                + (drop.isToday ? ' today' : '');
              const label = drop.played
                ? (drop.incomplete ? 'Played, not solved' : 'Played')
                : 'Not played yet';
              return <a key={iso} href={drop.href} className={cls} title={label}>{d}</a>;
            })}
          </div>
          <div className="dtp-key">
            <span><i className="sw played" />Solved</span>
            {drops.some((d) => d.incomplete) ? <span><i className="sw incomplete" />Not solved</span> : null}
            <span><i className="sw open" />Open</span>
            <span><i className="sw today" />Today</span>
          </div>
        </section>

      {/* The bottom strip: today's crowd answers on the three crowd games (the
          default there), the day-by-day history everywhere else. Both fill the
          space the compact columns above leave behind. */}
      <section className={`dtp-trend${secOpen('rec') ? ' open' : ''}`}>
        <div className="dtp-lab">
          {showCrowd ? <Users size={12} strokeWidth={2.4} /> : <TrendingUp size={12} strokeWidth={2.4} />}
          {showCrowd
            ? 'Today’s crowd answers'
            : (trend.count > 0 ? `Your last ${trend.vals.length} days` : 'Your history')}
          {showCrowd
            ? (crowdReady && crowd.headline ? <span className="dtp-tsum">{crowd.headline}{crowd.field ? ' · ' + crowd.field.toLocaleString() + ' played' : ''}</span> : null)
            : (trend.count > 0 ? <span className="dtp-tsum">all-time best {fmtPts(mine.bestPoints)} &middot; avg {fmtPts(mine.avgPoints)}</span> : null)}
          {/* Only a player who has finished today's puzzle ever sees this
              toggle: with no crowd data there is nothing to switch to. */}
          {crowdOffered ? (
            <span className="dtp-tabs" role="group" aria-label="Bottom panel view">
              <button type="button" className={showCrowd ? 'on' : ''} aria-pressed={showCrowd} onClick={() => setView('crowd')}>Crowd</button>
              <button type="button" className={showCrowd ? '' : 'on'} aria-pressed={!showCrowd} onClick={() => setView('trend')}>Your history</button>
            </span>
          ) : null}
        </div>
        {showCrowd ? (
          crowdReady ? (
            <div className="dtp-cwrap">
              <div className="dtp-cg">
                {crowdGroups.map((g, gi) => (
                  <div className="dtp-ccard" key={'g' + gi}>
                    <div className="dtp-cq">
                      <span>{g.q}</span>
                      {g.note ? <b>{g.note}</b> : null}
                    </div>
                    {(g.rows || []).length ? (
                      <div className="dtp-crows">
                        {g.rows.map((r, ri) => (
                          <div className={'dtp-crow' + (r.you ? ' you' : '')} key={'r' + ri}>
                            <i className="bar" style={{ width: Math.max(3, Math.min(100, r.pct || 0)) + '%' }} aria-hidden="true" />
                            <span className="nm">{r.label}</span>
                            {r.sub ? <span className="sub">{r.sub}</span> : null}
                            {r.tag && !r.sub ? <span className="tg">{r.tag}</span> : null}
                            <span className="pc">{r.pct}%</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {g.text ? <div className="dtp-ctext">{g.text}</div> : null}
                  </div>
                ))}
              </div>
              {crowd.houseActive ? (
                <div className="dtp-cfoot">Early crowd: the day&rsquo;s pool is still seeded, so these shares will move as players arrive.</div>
              ) : null}
            </div>
          ) : (
            <div className="dtp-empty">Loading today&rsquo;s crowd&hellip;</div>
          )
        ) : loading ? (
          <div className="dtp-empty">Loading your history…</div>
        ) : trend.count > 0 ? (
          <>
            {/* The chart is two parallel rows sharing one column rule, so the
                bar and its date always line up. The dashed average line stays
                inside the bar row, whose height is the only thing the bar
                percentages are measured against. The per-day player counts
                that used to ride above the bars are gone (owner, 2026-07-31):
                on a phone the pills were wider than their own column and piled
                into an unreadable smear, and the chart is about YOUR scores. */}
            <div className="dtp-tkey">
              <span><i className="sw bar" />Your daily points</span>
              {trend.avg != null ? <span><i className="sw avg" />Your average, {fmtPts(trend.avg)}</span> : null}
            </div>
            <div className="dtp-bars">
              {avgPct != null ? (
                <span className="dtp-avg" style={{ bottom: avgPct + '%' }} aria-hidden="true">
                  <i>avg {fmtPts(trend.avg)}</i>
                </span>
              ) : null}
              {trend.vals.map((v) => {
                const h = v.pts != null && trend.max > 0 ? Math.max(5, (v.pts / trend.max) * 100) : 0;
                const title = shortDate(v.iso)
                  + (v.pts != null ? ' · you scored ' + fmtPts(v.pts) : ' · you did not play');
                return (
                  <a key={v.iso} href={v.href} className="dtp-barw" title={title} aria-label={title}>
                    {v.pts != null
                      ? <span className={'dtp-bar' + (v.isToday ? ' today' : '')} style={{ height: h + '%' }} />
                      : <span className="dtp-bar miss" />}
                  </a>
                );
              })}
            </div>
            {denseTrend ? (
              <div className="dtp-bx">
                <span>{shortDate(trend.vals[0].iso)}</span>
                <span>{shortDate(trend.vals[trend.vals.length - 1].iso)}</span>
              </div>
            ) : (
              <div className="dtp-daterow">
                {trend.vals.map((v) => (
                  <span key={'d' + v.iso} className={'dtp-dc' + (v.isToday ? ' today' : '')}>{shortDate(v.iso)}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="dtp-empty">Play it once and your day by day history shows up here.</div>
        )}
      </section>
      </div>

      {/* Phone-only, and deliberately at the very bottom: see .dtp-mclose. */}
      <button type="button" className="dtp-mclose" onClick={onClose}>
        <X size={13} strokeWidth={2.8} />Close
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        .dtp{position:absolute;inset:0;z-index:6;background:var(--white);border-radius:13px;color:var(--ink);
             padding:13px 16px;display:flex;flex-direction:column;gap:10px;overflow:hidden;
             font-family:'Manrope',system-ui,-apple-system,sans-serif;animation:dtpIn .16s ease-out;}
        /* Opacity only. A scale here left the panel measurably inset from the
           board edges: the component re-renders when its data lands, which
           re-inserts this stylesheet and restarts the animation, so the 0.99
           scale never settled and the panel sat ~4px inside its box. */
        @keyframes dtpIn{from{opacity:0;}to{opacity:1;}}
        .dtp-hd{display:flex;align-items:flex-start;gap:13px;flex:none;}
        .dtp-ic{flex:none;width:50px;height:50px;border-radius:12px;background:#f7f9fc;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;}
        .dtp-ic img{height:32px;width:auto;max-width:42px;object-fit:contain;}
        .dtp-idt{flex:1;min-width:0;}
        .dtp-nm{font-size:22px;font-weight:800;letter-spacing:-.3px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;line-height:1.1;}
        .dtp-flame{display:inline-flex;align-items:center;gap:3px;background:rgba(232,180,58,0.16);border:1px solid rgba(232,180,58,0.42);border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:800;color:#8a5300;}
        .dtp-donechip{display:inline-flex;align-items:center;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);border-radius:999px;padding:1px 9px;font-size:11px;font-weight:800;color:#116932;}
        .dtp-sharechip{display:inline-flex;align-items:center;gap:5px;background:rgba(232,180,58,0.12);border:1px solid rgba(232,180,58,0.42);border-radius:999px;padding:2px 10px;font-size:11px;font-weight:800;color:#8a5300;font-family:inherit;cursor:pointer;transition:background .12s,color .12s;}
        .dtp-sharechip svg{transition:color .12s;}
        .dtp-sharechip:hover{background:var(--cta);color:var(--cta-ink);}
        .dtp-sharechip:hover svg{color:var(--ink);}
        /* Pin chip. The panel is WHITE (.dtp above), so this takes the same ink
           treatment as the share chip beside it rather than the navy-panel
           palette the board's tiles use. Unpinned it is a grey outline, pinned
           it fills gold, which matches the star on the tiles. This is the only
           pin control a FINISHED game has, so it has to be plainly visible. */
        .dtp-pinchip{display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--border);border-radius:999px;padding:2px 10px;font-size:11px;font-weight:800;color:#4d5872;font-family:inherit;cursor:pointer;transition:background .12s,color .12s,border-color .12s;}
        .dtp-pinchip:hover{background:rgba(232,180,58,0.16);border-color:rgba(232,180,58,0.55);color:#8a5300;}
        .dtp-pinchip.on{background:var(--cta);border-color:var(--cta);color:var(--cta-ink);}
        .dtp-how{font-size:12.5px;line-height:1.4;color:var(--slate);font-weight:600;margin:4px 0 0;max-width:64ch;}
        .dtp-acts{flex:none;display:flex;align-items:center;gap:8px;}
        /* Phone-only furniture, revealed in the <=900px block. */
        .dtp-mclose{display:none;}
        .dtp-sec{display:none;}
        .dtp-play{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:var(--cta);color:var(--cta-ink);font-weight:800;font-size:15px;
                  border-radius:10px;padding:12px 24px;text-decoration:none;border:none;cursor:pointer;transition:background .12s,transform .12s;}
        .dtp-play:hover{background:var(--cta-hover);transform:translateY(-1px);}
        .dtp-shrink{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--gold);background:var(--cta);color:var(--cta-ink);
                    font-weight:800;font-size:13px;border-radius:10px;padding:12px 16px;cursor:pointer;font-family:inherit;transition:background .12s,transform .12s;}
        .dtp-shrink:hover{background:var(--cta-hover);border-color:var(--cta-hover);transform:translateY(-1px);}
        /* THE SLAB IS DESKTOP ONLY, AND IT IS HIDDEN BY DEFAULT (fixed
           2026-08-10). It was added in the 2026-08-10 desktop pass with every
           one of its rules inside the min-width:901px block, and its comment in
           the JSX already claimed it was "display:none below 901px" -- but
           nobody wrote that rule, so on a phone it rendered as an unstyled
           110px block of raw text between the navy button strip and the first
           band. Hiding it at BASE level rather than inside the <=900px block is
           deliberate: the desktop block below turns it back on with
           display:flex, so any future breakpoint added between them cannot leak
           it again. */
        .dtp-slab{display:none;}
        /* THE THREE CARDS ARE ALWAYS THE SAME HEIGHT (owner rule, 2026-08-01).
           The archive card sets that height, because its calendar is padded to
           six week rows (the tallest possible month, see the cells builder), so
           the row never changes height as the reader pages through months. The
           record and leaderboard cards stretch to meet it and hand the extra
           space to their own content: the stat rows spread, the leaderboard
           rows spread, and each card's footer sits on the bottom edge.
           (This is NOT the old "stretch everything to the panel floor" layout
           that was reverted on 2026-07-29 for looking sparse. The cards match
           the calendar and stop there; the leftover navy below is untouched.) */
        .dtp-grid{flex:none;display:grid;grid-template-columns:1.05fr .95fr .95fr;gap:13px;align-items:stretch;}
        .dtp-col{min-width:0;display:flex;flex-direction:column;background:var(--white);border:1.5px solid var(--border);border-radius:11px;padding:12px 13px;}
        .dtp-lab{display:flex;align-items:center;gap:6px;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:8px;flex:none;}
        .dtp-lab.sm{margin-top:10px;}
        /* community size lives in the leaderboard label, right aligned, rather than
           as its own stat row in column one (owner, 2026-07-29). */
        .dtp-labct{margin-left:auto;font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.06em;color:#8a9bb8;font-weight:500;flex:none;}
        .dtp-lab svg{color:var(--gc);}
        .dtp-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:none;}
        .dtp-stats>div{background:#f7f9fc;border:1px solid #dde3ec;border-radius:9px;padding:6px 9px;}
        .dtp-stats b{display:block;font-size:17px;font-weight:800;line-height:1.15;font-variant-numeric:tabular-nums;}
        .dtp-stats span{font-family:'DM Mono',ui-monospace,monospace;font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:2px;display:block;}
        /* the rows take the height the calendar handed this column and spread
           through it, rather than bunching under the stat tiles */
        .dtp-rows{flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-between;margin-top:8px;}
        .dtp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid #dde3ec;font-size:11.5px;}
        .dtp-row:last-child{border-bottom:none;}
        .dtp-row span{color:var(--muted);font-weight:600;}
        .dtp-row b{color:var(--ink);font-weight:700;font-variant-numeric:tabular-nums;text-align:right;}
        .dtp-row.beat b{color:var(--success-deep);}
        .dtp-calhd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;flex:none;}
        .dtp-mo{font-size:13px;font-weight:800;}
        .dtp-calhd button{width:25px;height:25px;display:flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid #c8d0dc;background:transparent;color:var(--slate);cursor:pointer;}
        .dtp-calhd button:hover:not(:disabled){background:var(--surface);color:var(--ink);}
        .dtp-calhd button:disabled{opacity:.3;cursor:default;}
        .dtp-wd{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;flex:none;margin-bottom:3px;}
        .dtp-wd span{font-family:'DM Mono',ui-monospace,monospace;font-size:9px;color:var(--muted);text-align:center;}
        /* the month fills the column: each week row is an equal share of the height */
        .dtp-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;flex:none;}
        .dtp-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border-radius:6px;color:#4b5563;text-decoration:none;font-variant-numeric:tabular-nums;}
        .dtp-cell.empty{background:transparent;}
        .dtp-cell.none{color:#3d4f70;}
        a.dtp-cell.played{background:#dcfce7;border:1px solid rgba(34,197,94,0.45);color:var(--success-deep);}
        a.dtp-cell.incomplete{background:#fee2e2;border:1px solid rgba(220,38,38,0.45);color:#b91c1c;}
        a.dtp-cell.open{background:var(--surface);border:1px solid #c8d0dc;color:var(--slate);}
        a.dtp-cell.open:hover{border-color:var(--gc);color:var(--ink);}
        a.dtp-cell.today{box-shadow:0 0 0 2px var(--gold);}
        .dtp-key{display:flex;flex-wrap:wrap;gap:5px 13px;margin-top:auto;padding-top:8px;font-size:10.5px;color:var(--muted);font-weight:600;flex:none;}
        .dtp-key span{display:inline-flex;align-items:center;gap:5px;}
        .dtp-key .sw{width:10px;height:10px;border-radius:3px;flex:none;}
        .dtp-key .sw.played{background:rgba(34,197,94,0.35);border:1px solid rgba(34,197,94,0.55);}
        .dtp-key .sw.incomplete{background:rgba(220,38,38,0.28);border:1px solid rgba(220,38,38,0.55);}
        .dtp-key .sw.open{background:var(--surface);border:1px solid #c8d0dc;}
        .dtp-key .sw.today{background:transparent;border:2px solid var(--gold);}
        /* leaderboard rows share the leftover height the same way: the two
           boards split it evenly and each spreads its own rows */
        .dtp-lb{flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-between;}
        .dtp-lrow{display:flex;align-items:center;gap:9px;padding:4px 0;border-bottom:1px solid #dde3ec;font-size:11.5px;color:var(--muted);}
        .dtp-lrow:last-child{border-bottom:none;}
        .dtp-lrow .pl{width:17px;font-family:'DM Mono',ui-monospace,monospace;font-size:10.5px;color:var(--muted);flex:none;display:flex;align-items:center;}
        .dtp-lrow .pl svg{color:var(--gold-ink);}
        .dtp-lrow b{color:var(--ink);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;}
        .dtp-lrow .sc{margin-left:auto;font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;color:var(--ink);flex:none;}
        /* The game's own result, under the name. Phone-only: the desktop column
           is 320px wide and already tight with three cells on one line. */
        .dtp-lst{display:none;}
        .dtp-lrow.me{background:#fdf4dd;border-radius:6px;padding:3px 8px;border-bottom:none;margin:1px -8px;}
        .dtp-lrow.me b,.dtp-lrow.me .pl,.dtp-lrow.me .sc{color:#8a5300;}
        .dtp-lfoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding-top:9px;font-size:10.5px;color:var(--muted);font-weight:600;flex:none;}
        .dtp-lfoot a{color:#8a5300;text-decoration:none;font-weight:700;}
        .dtp-lfoot a:hover{text-decoration:underline;}
        .dtp-empty{font-size:12px;color:var(--muted);font-weight:600;padding:6px 0;}
        /* score trend */
        .dtp-trend{flex:1 1 auto;min-height:92px;display:flex;flex-direction:column;padding-top:2px;}
        .dtp-tsum{margin-left:auto;font-family:'Manrope',system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--muted);}
        /* legend, so the bars, the dashed line and the bubbles all say what they are */
        .dtp-tkey{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:3px 14px;margin:-3px 0 6px;
                  font-family:'DM Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.05em;text-transform:uppercase;color:#5b6577;}
        .dtp-tkey span{display:inline-flex;align-items:center;gap:5px;}
        .dtp-tkey .sw{flex:none;display:inline-block;}
        .dtp-tkey .sw.bar{width:7px;height:11px;border-radius:2px;background:var(--gc);opacity:.85;}
        .dtp-tkey .sw.avg{width:14px;height:0;border-top:1px dashed #8a9bb8;}
        /* every row reserves the same right gutter (--agut) so the columns stay in
           lockstep and the average label has clear space to sit in */
        .dtp-trend{--agut:44px;}
        .dtp-bars{position:relative;flex:1 1 auto;min-height:48px;display:flex;align-items:flex-end;gap:3px;border-bottom:1px solid #dde3ec;padding-bottom:1px;padding-right:var(--agut);}
        .dtp-avg{position:absolute;left:0;right:var(--agut);height:0;border-top:1px dashed var(--border);pointer-events:none;}
        .dtp-avg i{position:absolute;left:100%;bottom:-6px;margin-left:5px;font-style:normal;white-space:nowrap;
                   font-family:'DM Mono',ui-monospace,monospace;font-size:8.5px;line-height:12px;letter-spacing:.04em;color:#5b6577;}
        .dtp-daterow{flex:none;display:flex;gap:3px;margin-top:5px;padding-right:var(--agut);font-family:'DM Mono',ui-monospace,monospace;font-size:9px;color:#5b6577;}
        .dtp-dc{flex:1 1 0;min-width:0;max-width:48px;display:flex;justify-content:center;white-space:nowrap;overflow:hidden;}
        .dtp-dc.today{color:#8a5300;font-weight:500;}
        .dtp-barw{flex:1 1 0;min-width:0;max-width:48px;height:100%;display:flex;align-items:flex-end;justify-content:center;text-decoration:none;border-radius:3px;}
        .dtp-barw:hover{background:var(--surface);}
        .dtp-bar{display:block;width:100%;max-width:22px;background:var(--gc);border-radius:3px 3px 0 0;min-height:3px;opacity:.85;transition:opacity .12s;}
        .dtp-barw:hover .dtp-bar{opacity:1;}
        .dtp-bar.today{background:var(--cta);opacity:1;}
        .dtp-bar.miss{height:5px;background:var(--surface);border-radius:2px;}
        .dtp-bx{display:flex;justify-content:space-between;margin-top:5px;padding-right:var(--agut);font-family:'DM Mono',ui-monospace,monospace;font-size:9px;color:var(--muted);}
        /* crowd answers (outwit / outrank / feud) — the default bottom view for
           those three, with the history chart one click away via .dtp-tabs */
        .dtp-tabs{margin-left:auto;display:inline-flex;gap:2px;background:#f0f3f8;border:1px solid #dde3ec;border-radius:8px;padding:2px;flex:none;}
        .dtp-tabs button{font-family:'Manrope',system-ui,sans-serif;font-size:10.5px;font-weight:800;letter-spacing:0;text-transform:none;
                         border:none;background:transparent;color:var(--slate);border-radius:6px;padding:3px 9px;cursor:pointer;transition:background .12s,color .12s;}
        /* When the summary line is present it owns the free space, so the two
           of them ride right together instead of splitting the gap. */
        .dtp-tsum + .dtp-tabs{margin-left:8px;}
        .dtp-tabs button:hover{color:var(--ink);}
        .dtp-tabs button.on{background:var(--white);color:var(--ink);box-shadow:0 1px 2px rgba(28,30,36,.12);}
        .dtp-cwrap{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:6px;overflow:auto;}
        /* One card per prompt. Feud and Outwit run five, so they sit side by
           side; Outrank has a single slate and its card simply spans the row. */
        .dtp-cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:8px;align-items:start;}
        .dtp-ccard{min-width:0;background:var(--white);border:1.5px solid var(--border);border-radius:9px;padding:8px 9px;}
        .dtp-cq{display:flex;align-items:flex-start;gap:6px;font-size:11.5px;font-weight:800;line-height:1.3;color:var(--ink);margin-bottom:6px;}
        .dtp-cq span{flex:1 1 auto;min-width:0;}
        .dtp-cq b{flex:none;font-family:'DM Mono',ui-monospace,monospace;font-size:9.5px;font-weight:500;color:#5b6577;white-space:nowrap;padding-top:1px;}
        .dtp-crows{display:flex;flex-direction:column;gap:3px;}
        .dtp-crow{position:relative;display:flex;align-items:center;gap:6px;padding:3px 7px;border-radius:5px;background:#f7f9fc;overflow:hidden;font-size:11px;}
        .dtp-crow .bar{position:absolute;left:0;top:0;bottom:0;background:var(--gc);opacity:.17;border-radius:5px;}
        .dtp-crow.you{background:#fdf4dd;}
        .dtp-crow.you .bar{background:var(--cta);opacity:.34;}
        .dtp-crow .nm{position:relative;flex:1 1 auto;min-width:0;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dtp-crow.you .nm{color:#8a5300;}
        .dtp-crow .sub,.dtp-crow .tg{position:relative;flex:none;font-family:'DM Mono',ui-monospace,monospace;font-size:8.5px;letter-spacing:.04em;text-transform:uppercase;color:#5b6577;white-space:nowrap;}
        .dtp-crow.you .sub,.dtp-crow.you .tg{color:#8a5300;}
        .dtp-crow .pc{position:relative;flex:none;font-family:'DM Mono',ui-monospace,monospace;font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums;}
        .dtp-ctext{font-size:10.5px;font-weight:600;line-height:1.45;color:var(--slate);margin-top:6px;}
        .dtp-cfoot{flex:none;font-size:10.5px;font-weight:600;color:#5b6577;}
        @media(max-width:980px){
          /* IN FLOW below 980px. As an absolutely positioned overlay with its
             own scrollbar, the panel swallowed the touch gesture: the page
             could only be scrolled by grabbing the thin margin outside it,
             which is near impossible on a phone (owner, 2026-07-29). In flow it
             grows to its natural height, DailyStrip hides the grid underneath
             it, and the page scrolls normally with no nested scroller. */
          .dtp{position:static;overflow:visible;height:auto;border-radius:11px;animation:none;}
          .dtp-trend{min-height:0;}
          /* An explicit HEIGHT, not min-height (owner, 2026-07-31: "the graphs
             look completely broken on mobile"). In flow the panel is auto
             height, so .dtp-bars had no definite height, so every bar's
             percentage height resolved against nothing and collapsed to the
             3px min: the chart rendered as a row of identical nubs. A real
             height makes the percentages resolve again. */
          .dtp-bars{height:118px;min-height:0;}
          /* In flow the panel is auto height, so the crowd list grows instead
             of becoming a nested scroller the page can't scroll past. */
          .dtp-cwrap{overflow:visible;min-height:0;}
          .dtp-grid{grid-template-columns:1fr 1fr;gap:16px;}
          .dtp-col:nth-child(3){grid-column:1/-1;}
          /* .dtp-trend joined the grid on 2026-08-10, so the tablet layout has
             to place it too or it lands in a half-width auto cell. */
          .dtp-trend{grid-column:1/-1;}
        }
        /* 901-980: two columns from the block above, but the bands, the slab
           and the gap:0 divider treatment from the desktop block below. Column
           three spans the row, so its right border would land on the panel edge
           and it needs a top border instead. */
        @media(min-width:901px) and (max-width:980px){
          .dtp-col:nth-child(3){border-right:0;border-top:1px solid var(--border);}
          .dtp-trend{border-right:0;border-top:1px solid var(--border);}
        }
        /* ── phone drawer: direction A, full bleed (owner-approved 2026-08-07) ──
           Breakpoint is 900px, matching the SLATE's phone breakpoint, so the
           drawer and the row it opens under switch layouts together. It was
           720px, which left 721-900px showing the phone slate row with a
           desktop-shaped drawer under it.

           The whole point: the drawer used to be a 13px-padded white panel
           holding five rounded, bordered cards, with the 2x2 stat tiles
           bordered AGAIN inside one of them, sitting directly under rows that
           run edge to edge. Here every card becomes a dark band plus
           full-width content, and each piece reuses an object the page already
           ships: the band is the slate's own .sl-band, the stat strip is the
           page header's divided row, and the leaderboard's #1 and you rows are
           the rails' gold and blue rules. Desktop is untouched. */
        @media(max-width:900px){
          /* no panel padding, no radius, no gap: the sections butt together and
             each supplies its own edge */
          .dtp{padding:0;border-radius:0;gap:0;}
          /* The drawer opens directly under the slate row, which ALREADY shows
             the tile art, the game name and a Play button, and the row's own
             chevron closes it again. Repeating all of that plus the one-line
             definition cost most of a phone screen before the first real stat,
             so on a phone the drawer opens straight into the chip line (owner,
             2026-08-07): Done today, the streak flame, Share for credit and the
             pin, none of which the row repeats in full. */
          /* The identity is gone (the slate row above shows the tile art and
             the name), but PLAY IS BACK, at the top of the drawer alongside the
             chips (owner, 2026-08-07): the row no longer carries a Play button,
             so this is the only one. Close leaves instead, since the drawer
             ends in a full-width Close bar. */
          .dtp-ic,.dtp-nmt,.dtp-how,.dtp-shrink{display:none;}
          /* THE HEADER IS THE NAVY BUTTON STRIP AND ITS BUTTONS SPREAD ACROSS
             THE WIDTH. flex:1 1 auto, not 1 1 0: an equal split sizes every
             button to the longest label, so "Pin to your games" fits while the
             streak flame sits in a third of empty space. Growing from natural
             width spends the slack evenly, fills the strip, and never truncates
             a label, at any count from two buttons to five. */
          .dtp-hd{background:var(--accent);padding:9px 11px;gap:8px;flex-wrap:wrap;align-items:center;}
          /* display:contents, so the chips and Play are flex items of ONE strip
             rather than two nested boxes. Neither wrapper draws anything on a
             phone, and this is what lets Play sit in the same row as the chips
             without moving it in the JSX. */
          .dtp-idt,.dtp-nm{display:contents;}
          .dtp-hd > *,.dtp-nm > *{flex:1 1 auto;min-width:0;justify-content:center;font-size:11px;}
          /* PLAY TAKES THE WHOLE LINE AND SHARE DROPS TO THE CHIPS (owner,
             2026-08-23: "i hate how the share + play buttons look on mobile ...
             play should be prominent"). From 2026-08-07 they were half and half,
             which said the two were worth the same tap, and Share was the louder
             of them: translucent gold on navy carrying gold ink is a fill and an
             ink of the same hue at low contrast, so the one control nobody came
             for was also the one that was hardest to read.
             So Play is now the drawer's single primary, full width, solid white,
             the only filled thing in the strip; and Share joins the line below as
             one more outline chip beside the pin, which is what it is. Nothing on
             the strip competes with Play, and nothing is gold-on-navy. */
          .dtp-hd{padding:8px;gap:8px;align-items:stretch;}
          /* flex:1 1 auto, matching the flame / done / pin rule below, so the
             chip line spends its slack evenly whatever chips this game has:
             Share alone fills the line, Share and the pin split it, and four
             chips wrap without any of them truncating a label. */
          .dtp-sharechip{order:0;flex:1 1 auto;justify-content:center;box-shadow:none;}
          /* 100%, not calc(50% - 4px): the basis is what reserves the line, so
             this is the single property that moves the chips off Play's row. */
          .dtp-acts{order:-1;flex:1 1 100%;box-sizing:border-box;display:flex;gap:0;}
          .dtp-play{flex:1 1 auto;background:var(--white);color:var(--blue-deep);
            font-size:15px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
            border-radius:10px;padding:16px 8px;gap:9px;}
          .dtp-play svg{width:17px;height:17px;}
          /* Line two: the status chips, spaced by the strip's own gap. */
          .dtp-flame,.dtp-donechip,.dtp-pinchip{flex:1 1 auto;margin:0;}
          .dtp-play:hover{background:var(--blue-200);transform:none;}
          /* A touch taller than the desktop chips (owner, 2026-08-07): these are
             the drawer's real controls on a phone, not decoration beside a name.
             .dtp-sharechip is excluded: it is a half-width rectangle now, sized
             with Play above. */
          .dtp-flame,.dtp-donechip,.dtp-pinchip{padding:6px 12px;}
          .dtp-flame{background:rgba(232,180,58,0.2);border-color:rgba(232,180,58,0.5);color:var(--gold);}
          .dtp-donechip{background:rgba(34,197,94,0.22);border-color:rgba(74,222,128,0.5);color:#bfe6cf;}
          /* Quiet, and the same object the pin is (owner, 2026-08-23). This is
             the LATER declaration of the two, so it is the one that decides the
             colour: the gold fill above it was what made Share compete with
             Play and what made its own label hard to read on navy. */
          .dtp-sharechip{background:transparent;border-color:rgba(255,255,255,0.3);color:#cfe0fb;padding:6px 12px;}
          .dtp-sharechip:hover{background:rgba(255,255,255,0.1);color:var(--white);}
          /* The white-panel hover ink from the desktop block would put a near
             black icon on navy at this width. */
          .dtp-sharechip:hover svg{color:inherit;}
          .dtp-pinchip{border-color:rgba(255,255,255,0.3);color:#cfe0fb;}
          .dtp-pinchip.on{background:var(--white);border-color:var(--white);color:var(--accent);}
          /* TWO-LEVEL DRAWER (owner, 2026-08-07). display:contents on the grid
             promotes the three cards to children of .dtp, which is already a
             flex column, so the cards, the history section and the new bands are
             all siblings and the order property can interleave them band /
             content / band / content. .dtp-trend is the FOURTH child of
             .dtp-grid (it was a sibling of the grid until 2026-08-10, when the
             desktop layout moved it under the record column); display:contents
             promotes it here exactly like the three cards, so the order below
             still puts it under the Your record band with no JSX branch.
             Nothing but the bands shows until one is tapped: the single-level
             version ran ~1,100px, three screens for a drawer you opened to check
             one number. */
          .dtp-grid{display:contents;}
          .dtp-col{border:0;border-radius:0;padding:0;display:none;}
          .dtp-col.open{display:flex;}
          .dtp-trend{display:none;}
          .dtp-trend.open{display:flex;}
          .dtp-hd{order:0;}
          .dtp-sec.rec{order:1;}
          /* nth-child counts within .dtp-grid, which display:contents does not
             change: the DOM is untouched, only box generation. */
          .dtp-col:nth-child(1){order:2;}
          .dtp-trend{order:3;}
          .dtp-sec.lb{order:4;}
          .dtp-col:nth-child(2){order:5;}
          .dtp-sec.arc{order:6;}
          .dtp-col:nth-child(3){order:7;}
          .dtp-mclose{order:8;}
          /* The band. Same object as the slate's group bands, plus a chevron. */
          .dtp-sec{display:flex;align-items:center;gap:8px;width:100%;padding:14px 13px;border:0;border-radius:0;
            border-bottom:1px solid rgba(255,255,255,.14);background:#2c4fa8;
            font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
            color:var(--white);cursor:pointer;text-align:left;}
          .dtp-sec svg{margin-left:auto;flex:none;color:var(--blue-200);transition:transform .15s;}
          .dtp-sec.on{background:var(--accent);}
          .dtp-sec.on svg{transform:rotate(180deg);color:var(--white);}
          .dtp-sec:active{background:var(--accent);}
          /* A section's own first label repeats the band that opens it. The
             Leaderboards card keeps its Today and All-time labels, which are
             sub-headings rather than a repeat. */
          .dtp-col:nth-child(1) > .dtp-lab,.dtp-col:nth-child(3) > .dtp-lab{display:none;}
          /* every section label becomes the slate's band */
          .dtp-lab,.dtp-lab.sm{margin:0;padding:8px 13px;background:#2c4fa8;
            font-family:'Manrope',system-ui,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--white);}
          .dtp-lab svg{color:var(--blue-200);}
          .dtp-labct{color:var(--blue-200);font-size:9.5px;}
          /* Two things ride INSIDE a label, so they have to come along onto the
             navy: the trend summary (all-time best / avg) and the crowd-vs-
             history toggle. Both shipped in their white-panel colours and the
             summary was near-invisible on the band (owner, 2026-08-07). */
          .dtp-tsum{color:var(--blue-200);}
          .dtp-tabs{background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.26);}
          .dtp-tabs button{color:#cfe0fb;}
          .dtp-tabs button:hover{color:var(--white);}
          .dtp-tabs button.on{background:var(--white);color:var(--accent);box-shadow:none;}
          /* the 2x2 bordered tiles become the header's 4-up divided strip */
          .dtp-stats{grid-template-columns:repeat(4,minmax(0,1fr));gap:0;background:var(--surface);border-bottom:1px solid var(--border);}
          .dtp-stats>div{min-width:0;background:transparent;border:0;border-right:1px solid var(--border);border-radius:0;padding:9px 8px;}
          .dtp-stats>div:last-child{border-right:none;}
          .dtp-stats span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          /* stat rows and leaderboard rows: full-width, hairline separated. The
             desktop justify-content:space-between exists to stretch a card to
             the calendar's height, which no longer applies in one column. */
          .dtp-rows,.dtp-lb{display:block;margin-top:0;}
          .dtp-row,.dtp-lrow{padding:8px 13px;border-bottom:1px solid #f0f2f6;font-size:12.5px;}
          .dtp-lrow{font-size:13px;}
          .dtp-lrow .sc{font-size:12.5px;}
          .dtp-lrow.first{background:#fdf7e8;box-shadow:inset 3px 0 0 var(--gold);}
          .dtp-lrow.first b,.dtp-lrow.first .sc{color:var(--gold-ink);}
          /* .me AFTER .first, so being #1 yourself reads as you, not as the
             leader you happen to be */
          .dtp-lrow.me{margin:0;padding:8px 13px;border-radius:0;background:#eef3ff;box-shadow:inset 3px 0 0 var(--blue);}
          .dtp-lrow.me b,.dtp-lrow.me .pl,.dtp-lrow.me .sc{color:var(--blue-deep);}
          /* The game stats take their own line under the name, indented past the
             rank cell. flex-wrap plus a 100% basis, so no wrapper element and no
             change to the desktop row. */
          .dtp-lrow{flex-wrap:wrap;}
          .dtp-lst{display:block;flex:1 1 100%;margin:1px 0 0 26px;
            font-size:10.5px;font-weight:600;color:var(--slate);font-variant-numeric:tabular-nums;}
          .dtp-lrow.me .dtp-lst{color:var(--blue-deep);opacity:.85;}
          .dtp-lfoot{margin-top:0;padding:8px 13px;border-bottom:1px solid var(--border);}
          .dtp-lfoot a{color:var(--blue-deep);}
          .dtp-empty{padding:10px 13px;}
          /* calendar spans the full width, so the cells grow */
          .dtp-calhd{margin:0;padding:9px 13px;border-bottom:1px solid #f0f2f6;}
          .dtp-mo{flex:1;text-align:center;font-size:14px;}
          .dtp-calhd button{width:28px;height:28px;}
          .dtp-wd{margin:0;padding:6px 10px 4px;gap:4px;}
          .dtp-wd span{font-size:9.5px;}
          .dtp-cal{gap:4px;padding:0 10px 11px;}
          .dtp-cell{font-size:12.5px;border-radius:7px;}
          .dtp-key{margin:0;padding:0 13px 12px;}
          /* the history chart keeps its own side padding now that the panel has none */
          .dtp-trend{padding:0 0 12px;}
          .dtp-tkey{margin:0;padding:10px 13px 8px;}
          .dtp-bars{margin:0 13px;}
          .dtp-daterow,.dtp-bx{margin:6px 13px 0;}
          /* One prompt per row on a phone: two 168px columns would truncate the
             answer labels, which are the whole point of the view. The crowd
             cards stay cards, they are one-per-prompt rather than one-per-idea,
             so the wrap supplies their inset instead. */
          .dtp-cwrap{padding:10px 13px 2px;gap:8px;}
          .dtp-cg{grid-template-columns:1fr;}
          .dtp-cfoot{padding:0 13px 10px;}
          /* Close, full width, at the foot. The phone drawer runs past a
             screen, so closing it should not mean scrolling back up to the
             chevron on the row that opened it. */
          .dtp-mclose{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;
            padding:13px;border:0;border-radius:0;border-top:1px solid var(--border);background:var(--surface);
            font-family:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
            color:var(--slate);cursor:pointer;}
          .dtp-mclose:active{background:#eef1f6;color:var(--ink);}
        }
        /* ── DESKTOP DRAWER: direction B2 (owner-approved 2026-08-10) ─────────
           EVERY rule in this block is min-width:901px, and nothing above it was
           touched, so the phone drawer resolves exactly as it did before. That
           is the owner's explicit call: the phone version already arrived at
           this direction in August 2026, and only the desktop version was left
           behind on three bordered cards with DM Mono labels.

           What changes, and why:
           - THE SLAB. The panel opens with a one-line answer instead of four
             dashes, in the shape of the slate's Up next cap bar, and it takes
             Play so there is one control on the right edge rather than a Play
             and a Close side by side in the header.
           - BANDS, NOT CARDS. Three 1.5px bordered cards holding bordered stat
             tiles was three levels of border. One border around the grid, a
             navy band per column, hairline rows: the same objects the slate and
             the rails already ship.
           - THE CHART MOVES INTO THE RECORD COLUMN. It is the best object in
             the panel and it sat below the fold. In the left column it also
             fills the height the calendar sets, which is what lets the columns
             end on one line without spreading the rows to get there.
           - THE 2x2 STAT TILES GO. Today, rank, streak and all-time rank are
             all on the slab now, so the tiles were saying it twice; the four
             detail rows underneath are what is left, and they are the part the
             slab does not carry.
           - THE CALENDAR JOINS THE BLUE RAMP. A green/red/grey month read as a
             traffic light next to a page that retired that palette in August
             2026 (see ringBlue in lib/home-blues.js). Solid blue solved, faint
             red missed, pale outline open, gold ring today. */
        @media(min-width:901px){
          /* Play lives on the slab. The header keeps Close. */
          .dtp-play{display:none;}
          /* Type and padding are the CAP BAR'S, copied from .dh-cell in
             DailyStrip.jsx and mirrored in .hr-lslab in HomeRails.jsx, so all
             three slabs on the home surface are one object at one size: 14px
             padding, a 9.5px eyebrow, a 20px name on a 26px line, an 11px sub.
             84.8px tall. Move one and move all three. */
          .dtp-slab{position:relative;display:flex;align-items:center;gap:12px;flex:none;
                    padding:14px 14px 14px 22px;border-radius:11px;background:var(--blue);color:var(--white);}
          .dtp-slab::before{content:'';position:absolute;left:10px;top:13px;bottom:13px;width:4px;border-radius:2px;background:var(--gold);}
          .dtp-stxt{min-width:0;flex:1;}
          .dtp-seye{font-size:9.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#dbe8ff;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          /* An explicit 26px line plus a pixel of pad, not a tight multiple:
             these lines are overflow:hidden for the ellipsis, so a tight box
             clips a descender. Same reasoning as .hr-hnm in HomeRails. */
          .dtp-snm{font-size:20px;font-weight:800;letter-spacing:-.3px;line-height:26px;padding-bottom:1px;
                   white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .dtp-ssub{font-size:11px;font-weight:600;line-height:1.35;margin-top:1px;padding-bottom:1px;color:var(--blue-200);
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .dtp-sgo{margin-left:auto;flex:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;
                   background:var(--white);color:var(--blue-deep);font-weight:800;font-size:13px;letter-spacing:.04em;
                   border-radius:9px;padding:11px 22px;text-decoration:none;transition:background .12s,transform .12s;}
          .dtp-sgo:hover{background:var(--blue-200);transform:translateY(-1px);}
          /* ONE border around the grid, hairline dividers inside it. */
          .dtp-grid{gap:0;border:1px solid var(--border);border-radius:11px;overflow:hidden;background:var(--white);}
          .dtp-col{border:0;border-radius:0;padding:0;border-right:1px solid var(--border);background:transparent;}
          .dtp-col:nth-child(3){border-right:0;}
          /* Each column's first label becomes the band. The leaderboard's
             second label (All-time) is a sub-heading, not a band, so it takes
             the quiet surface treatment instead. */
          .dtp-col > .dtp-lab:first-child{margin:0;padding:9px 13px;min-height:36px;box-sizing:border-box;
            background:var(--accent);color:var(--white);
            font-family:'Manrope',system-ui,sans-serif;font-size:11.5px;font-weight:800;letter-spacing:.13em;}
          .dtp-col > .dtp-lab:first-child svg{color:var(--blue-200);}
          .dtp-col > .dtp-lab:first-child .dtp-labct{color:var(--blue-200);font-family:'Manrope',system-ui,sans-serif;
            font-size:10px;font-weight:800;letter-spacing:.06em;}
          .dtp-lab.sm{margin:0;padding:6px 13px;background:var(--surface);
            border-top:1px solid var(--border);border-bottom:1px solid var(--border);
            font-family:'Manrope',system-ui,sans-serif;font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--slate);}
          .dtp-lab.sm svg{color:var(--slate);}
          .dtp-lab.sm .dtp-labct{font-family:'Manrope',system-ui,sans-serif;font-size:10px;font-weight:800;color:#9aa2b1;}
          /* The slab carries today / rank / streak / all-time rank, so the tile
             grid that also carried them is redundant here. */
          .dtp-stats{display:none;}
          .dtp-rows{margin:0;display:block;flex:none;}
          .dtp-row{padding:7px 13px;border-bottom:1px solid #f0f2f6;font-size:12px;}
          .dtp-row:last-child{border-bottom:1px solid #f0f2f6;}
          .dtp-row span{color:var(--slate);}
          /* leaderboard */
          .dtp-lb{display:block;flex:none;}
          .dtp-lrow{padding:6px 13px;border-bottom:1px solid #f0f2f6;font-size:12px;}
          .dtp-lrow:last-child{border-bottom:1px solid #f0f2f6;}
          .dtp-lrow b{font-weight:600;}
          .dtp-lrow .pl{font-family:'Manrope',system-ui,sans-serif;font-size:11px;font-weight:800;color:#9aa2b1;width:16px;}
          .dtp-lrow .sc{font-family:'Manrope',system-ui,sans-serif;font-size:12px;font-weight:700;}
          /* Gold / silver / bronze numerals, the same podium the rails use, so
             one board reads the same in the rail and in the drawer. */
          .dtp-lb .dtp-lrow:nth-child(1) .pl{color:var(--gold);}
          .dtp-lb .dtp-lrow:nth-child(2) .pl{color:var(--silver);}
          .dtp-lb .dtp-lrow:nth-child(3) .pl{color:var(--bronze);}
          .dtp-lrow.first .pl svg{color:var(--gold);}
          /* .me last, so being #1 yourself reads as YOU rather than as the
             leader you happen to be (same ordering rule as the phone block). */
          .dtp-lrow.me{margin:0;padding:6px 13px;border-radius:0;background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--blue);}
          .dtp-lrow.me b,.dtp-lrow.me .pl,.dtp-lrow.me .sc{color:var(--blue-deep);}
          .dtp-lrow.me b{font-weight:800;}
          .dtp-lfoot{margin-top:auto;padding:8px 13px;border-top:1px solid var(--border);
            font-family:'Manrope',system-ui,sans-serif;font-size:10.5px;font-weight:800;
            letter-spacing:.04em;text-transform:uppercase;color:var(--slate);}
          .dtp-lfoot a{color:var(--blue-deep);font-size:11px;text-transform:none;letter-spacing:0;}
          .dtp-empty{padding:9px 13px;}
          /* archive */
          .dtp-calhd{margin:0;padding:9px 13px 5px;}
          .dtp-wd{margin:0;padding:0 11px 3px;}
          .dtp-wd span{font-family:'Manrope',system-ui,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:.06em;color:var(--slate);}
          .dtp-cal{padding:0 11px;}
          .dtp-cell.none{color:#b3bccb;}
          a.dtp-cell.played{background:var(--blue);border:1px solid var(--blue);color:var(--white);}
          a.dtp-cell.incomplete{background:#f3e3e2;border:1px solid #e6cfcc;color:#a8362c;}
          a.dtp-cell.open{background:var(--accent-soft);border:1px solid var(--accent-border);color:var(--blue-deep);}
          a.dtp-cell.open:hover{background:var(--blue-200);border-color:var(--blue);color:var(--blue-deep);}
          .dtp-key{margin-top:auto;padding:9px 13px 11px;
            font-family:'Manrope',system-ui,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:.06em;
            text-transform:uppercase;color:var(--slate);}
          .dtp-key .sw.played{background:var(--blue);border:1px solid var(--blue);}
          .dtp-key .sw.incomplete{background:#f3e3e2;border:1px solid #e6cfcc;}
          .dtp-key .sw.open{background:var(--accent-soft);border:1px solid var(--accent-border);}
          /* the chart, now a cell of the grid rather than a strip under it */
          .dtp-trend{min-height:0;padding:0 0 11px;}
          .dtp-trend > .dtp-lab{margin:0;padding:9px 13px 7px;
            font-family:'Manrope',system-ui,sans-serif;font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--slate);}
          .dtp-trend > .dtp-lab svg{color:var(--slate);}
          .dtp-tsum{font-size:10.5px;color:#9aa2b1;}
          .dtp-tkey{margin:0;padding:0 13px 6px;font-family:'Manrope',system-ui,sans-serif;font-size:9px;font-weight:800;letter-spacing:.06em;}
          .dtp-bars{margin:0 13px;}
          .dtp-daterow,.dtp-bx{margin:5px 13px 0;font-family:'Manrope',system-ui,sans-serif;font-size:9px;font-weight:700;}
          .dtp-cwrap{padding:0 13px;}
        }
        @media(min-width:981px){
          /* Column one is the record band plus the chart under it; columns two
             and three span both rows, and the calendar (always padded to six
             week rows) is what sets the height they all end on. */
          .dtp-grid{grid-template-rows:auto 1fr;}
          .dtp-col:nth-child(1){grid-column:1;grid-row:1;}
          .dtp-col:nth-child(2){grid-column:2;grid-row:1/3;}
          .dtp-col:nth-child(3){grid-column:3;grid-row:1/3;}
          .dtp-trend{grid-column:1;grid-row:2;border-right:1px solid var(--border);}
          /* A crowd game's bottom strip is a grid of prompt cards, which needs
             the full panel width, so on those three the columns keep to row one
             and the strip runs underneath exactly as it always has. */
          .dtp-grid.cw .dtp-col:nth-child(2),.dtp-grid.cw .dtp-col:nth-child(3){grid-row:1;}
          .dtp-grid.cw .dtp-trend{grid-column:1/-1;grid-row:2;border-right:0;border-top:1px solid var(--border);}
        }
      ` }} />
    </div>
  );
}
