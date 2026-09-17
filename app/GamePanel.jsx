'use client';

// GamePanel — the game's own record, archive and leaderboards, at the foot of
// its own page (owner, 2026-08-24).
//
// WHAT MOVED. This is the panel that used to be reachable ONLY from the home
// board: you expanded a puzzle tile and DailyTilePanel opened as a drawer
// underneath it. The marquee home retired that drawer, and the content is worth
// far more on the game page anyway, where the person reading it is the person
// playing. So the panel lives here now, behind one control at the bottom of the
// board: "See stats, archive, leaderboard, and more".
//
// IT IS THE SAME COMPONENT, NOT A COPY. DailyTilePanel renders the whole thing
// (record, archive calendar, streaks, today's board, all-time board, the
// history chart, and the crowd answers on the three Crowd Psychology games),
// and every rule in it — the phone accordion, the desktop slab, the spoiler
// gate on crowd answers — carries over untouched. A second implementation of
// that panel would have drifted from this one within a week.
//
// IT REPLACES "Show overview and more". That control did one thing: flip the
// page out of focus mode so the tail below the board (report an issue, the
// about prose, the footer) came back. This does that too, via `onShow`, and
// then adds the panel. One button at the foot of the page instead of two.
//
// SELF-CONTAINED, AND LAZY. It is mounted on all 70 daily clients, so it must
// cost nothing on a page nobody opens it on: no fetch fires until the first
// open. Then it asks for exactly two things, both through clients that already
// exist and already de-duplicate:
//   /api/quiz/daily-game  — the archive drops, the all-time board, my record.
//   /api/quiz/daily-me    — today's board for THIS game, and my row on it, via
//                           fetchDailyMe, so it joins the request the end card
//                           or the board panel may already have in flight.
// Nothing is passed down from the game client except which game this is, which
// is what keeps the codemod that mounted it to a single line per file.
//
// `self` IS WHATEVER ReportIssue IS ALREADY PASSED, which is the ROUTE name,
// and the route is not always the registry key (/parker is `park`, /jesters is
// `jester` — see the registry-key note in CLAUDE.md). resolveGame below accepts
// either and resolves through the roster, so the mount line can be copied from
// the ReportIssue line beside it without anyone having to remember which two
// games are the exceptions. A wrong key would render nothing at all rather than
// something subtly empty, because the button is gated on resolving a game.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import DailyTilePanel from './DailyTilePanel';
import { DAILY_GAMES, DAILY_GAME_MAP } from '@/lib/daily-games';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';
import { fetchDayStatus, etToday } from './useDayStats';
// EVERYONE / <group> on the Today board (owner, 2026-09-17).
import { fetchGroupStanding } from './groups/groupStanding';
import GroupSwitch, { useGroupScope } from './groups/GroupSwitch';

const OPEN_LABEL = 'See stats, archive, leaderboard, and more';
const SHUT_LABEL = 'Hide stats, archive, leaderboard, and more';

function resolveGame(self) {
  if (!self) return null;
  const s = String(self).replace(/^\/+/, '');
  if (DAILY_GAME_MAP[s]) return DAILY_GAME_MAP[s];
  return DAILY_GAMES.find((g) => g.href === '/' + s) || null;
}

// Did this browser finish today's puzzle? Only used to decide the panel's
// "Done today" chip and to gate the crowd-answer request on the three crowd
// games; the ROUTE gates the crowd answer itself by account, so a wrong guess
// here can only ever cost a chip, never leak an answer.
function doneToday(key) {
  try {
    const c = JSON.parse(localStorage.getItem(`sot_${key}_day`) || 'null');
    return !!(c && c.d === etToday() && c.done);
  } catch (e) { return false; }
}

export default function GamePanel({ self, name = null, onShow = null }) {
  const game = resolveGame(self);
  const key = game ? game.key : null;

  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);   // /api/quiz/daily-game
  const [me, setMe] = useState(null);       // /api/quiz/daily-me
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  // Is the end card on screen? See the effect below.
  const [finished, setFinished] = useState(false);
  const wrapRef = useRef(null);
  const asked = useRef(false);
  const [grp, setGrp] = useState(null);     // /api/groups/standing
  const grpGroups = grp && grp.groups ? grp.groups.filter((g) => !g.failed) : null;
  const [scope, setScope, scoped] = useGroupScope(grpGroups);

  // The panel is the only thing that wants any of this, so nothing is asked for
  // until it is opened, and nothing is asked for twice.
  useEffect(() => {
    if (!open || !key || asked.current) return undefined;
    asked.current = true;
    let alive = true;

    setDone(doneToday(key));

    const { anonId, email } = dailyMeIdentity();
    const qs = new URLSearchParams({ game: key });
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    fetch('/api/quiz/daily-game?' + qs.toString())
      .then((r) => r.json())
      .then((d) => { if (alive && d && !d.error) setData(d); })
      .catch(() => {});

    fetchDailyMe(dailyMeQuery({ anonId, email, game: key }))
      .then((d) => { if (alive && d && !d.error) setMe(d); })
      .catch(() => {});

    fetchGroupStanding().then((d) => {
      if (alive && d && d.groups && d.groups.length) setGrp(d);
    });

    fetchDayStatus().then((d) => {
      if (!alive || !d || !d.streaks) return;
      const n = Number(d.streaks[key]);
      if (n) setStreak(n);
    }).catch(() => {});

    return () => { alive = false; };
  }, [open, key]);

  // THE END CARD ALREADY SAYS ALL OF THIS (owner, 2026-08-26). A finish puts
  // today's board, the day, the archive and what to play next on the card
  // itself, so this control sitting under it offers the same content a second
  // time and the page reads as repeating itself. It stands down while the card
  // is up and comes back the moment it goes (a replay, or the archive opened
  // from somewhere else).
  //
  // THE SIGNAL IS AN EVENT FROM LoftFinish, NOT A PROP. This component is
  // mounted on 70 game clients from one copied line each, and every one of them
  // names its own finished state differently (`playing`, `g.status`, `ended`),
  // so a prop would mean 70 hand-edits and 70 chances to wire the wrong flag.
  // The DOM read covers the mount itself, where the card may already be up: an
  // archived board that was finished on a previous visit renders its finish in
  // the same commit this mounts in.
  //
  // IT HIDES, IT DOES NOT UNMOUNT, and that is the same reason the button says
  // "Hide" rather than disappearing when the panel is open: LoftCap paints every
  // sibling of the play stage in navy body copy with !important and excludes
  // exactly the wrappers holding .loft-report or .loft-showchrome. :has() is
  // structural, so a display:none wrapper still satisfies it; an unmounted one
  // does not, and the tail below would be repainted.
  useEffect(() => {
    const read = () => {
      try { return !!document.querySelector('.loft-back'); } catch (e) { return false; }
    };
    setFinished(read());
    const onFinish = (e) => {
      const d = e && e.detail;
      setFinished(d && typeof d.open === 'boolean' ? d.open : read());
    };
    window.addEventListener('sot:loft-finish', onFinish);
    return () => window.removeEventListener('sot:loft-finish', onFinish);
  }, []);

  // The side effects live OUT of the state updater on purpose: React may call
  // an updater twice, and onShow reaches into the game client's own state.
  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    // Opening also brings the page tail back, which is the whole job the
    // control this replaced used to do. Called on every open rather than once:
    // a client may have flipped back into focus mode in between.
    if (onShow) { try { onShow(); } catch (e) {} }
    // The button can sit at the very bottom of a long board, so the panel opens
    // off-screen below it. One frame later it has a height to scroll to.
    window.requestAnimationFrame(() => {
      try { wrapRef.current && wrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      catch (e) {}
    });
  }, [open, onShow]);

  if (!game) return null;

  const board = me && me.game ? me.game : null;
  const siteRow = me && me.me && me.me.rank != null
    ? { userKey: me.me.userKey, username: 'You', ...me.me }
    : null;
  const isDone = done || !!siteRow;
  // THE GROUP BOARD, when the switch is on one: that group's rows for this
  // game, in the same shape the site board uses, so the panel draws it as is.
  const grpRows = scoped && scoped.boards ? (scoped.boards[key] || []) : null;
  const grpMine = grpRows && grp ? grpRows.find((r) => r.userKey === grp.userKey) || null : null;
  const myRow = grpRows ? (grpMine ? { ...grpMine, username: 'You' } : null) : siteRow;
  const standingsNow = grpRows || (board && Array.isArray(board.board) ? board.board : []);
  const fieldNow = grpRows ? grpRows.length : (board && typeof board.field === 'number' ? board.field : null);
  const meKeyNow = grpRows ? (grp && grp.userKey) : (me && me.me ? me.me.userKey : null);

  return (
    <div className={'gpn' + (finished ? ' gpn-off' : '')} ref={wrapRef}>
      {/* THE BUTTON KEEPS THE loft-showchrome CLASS, and that is load-bearing
          rather than laziness. LoftCap paints every sibling of the play stage
          in navy body copy with !important, and excludes exactly two wrappers:
          one holding .loft-report and one holding .loft-showchrome. So this
          wrapper must contain that class AT ALL TIMES or the open panel's white
          card is repainted #bfd0ee on white. That is also why the button
          becomes "Hide" rather than unmounting. */}
      <button
        type="button"
        className="loft-showchrome gpn-btn"
        onClick={toggle}
        aria-expanded={open}
      >
        {open ? SHUT_LABEL : OPEN_LABEL}
      </button>

      {open ? (
        <div className="gpn-panel">
          <DailyTilePanel
            game={game}
            accent={game.color}
            isDone={isDone}
            inProgress={false}
            streak={streak}
            todayRow={myRow}
            todayField={fieldNow}
            standings={standingsNow}
            meKey={meKeyNow}
            todaySwitch={grpGroups && grpGroups.length ? (
              <GroupSwitch groups={grpGroups} value={scope} onChange={setScope} />
            ) : null}
            todayScopeName={scoped ? scoped.name : null}
            data={data}
            /* Phone only in effect: it decides which of the drawer's three
               bands start open, and above 900px there are no bands. Here the
               reader pressed a control naming all three, so all three open. */
            expandAll
            canPin={false}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}

      <style dangerouslySetInnerHTML={{ __html: `
        .gpn{max-width:1080px;margin:30px auto 0;padding:0 16px;text-align:center;}
        /* Hidden, never unmounted. See the end-card effect above. */
        .gpn-off{display:none;}
        .gpn-btn{cursor:pointer;font-family:'Manrope',system-ui,-apple-system,sans-serif;
                 font-weight:800;font-size:13px;letter-spacing:.03em;}
        .gpn-panel{margin-top:14px;text-align:left;}
        /* In flow at EVERY width. The panel's own stylesheet already does this
           below 980px; above it the component is built to overlay a board, so
           it would otherwise pin itself to this wrapper's four edges and
           collapse. Same override .tdy-pw used on the home board. */
        .gpn-panel .dtp{position:static;overflow:visible;height:auto;animation:none;}
        /* Both Play controls are self-links here: the reader is already on the
           game's page, so "Play" would reload it and "Play again" would look
           like a replay it is not. The rest of the panel is untouched. */
        .gpn-panel .dtp-play,.gpn-panel .dtp-sgo{display:none;}
        @media(max-width:900px){
          .gpn{padding:0 12px;}
        }
      ` }} />
    </div>
  );
}
