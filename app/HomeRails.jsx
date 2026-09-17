'use client';

// The homepage's two side rails, rebuilt 2026-08-03 (owner-approved mockup:
// mindloft-B4-scoreboard).
//
// It replaces the three stacked hero-name leaderboard cards on the left and the
// Last Played / Quick play / Category Mastery stack on the right with a single
// consistent panel system: a solid navy header band, a top-5 table, and a footer
// carrying the expander and the real "Full leaderboard" link.
//
// It is deliberately a PRESENTATION component. Every figure it renders is
// already fetched by QuizHomeClient and handed down as a prop, so no fetch, no
// identity read, and no API surface moved. That held again on 2026-08-12: the
// category leaders are derived from the per-game boards already in `dailyBoard`
// and the day's player count is a field on the totals payload the header
// already reads.
//
// Left rail, top to bottom (rebuilt 2026-08-14):
//   1. Leaderboard: Contest (or Community) | Today | All time, ONE panel,
//      auto-flips every 7s, five rows deep
//   1b. Share strip           - PHONE ONLY, sits directly under the board above
//   2. Category leaders      (dailyBoard.games)  - all nine, listed, no flip
// Right rail:
//   1. Live feed             (lastPlayed/totals) - one face, no flip
//   2. Your streak           (daily-status)      - days in a row, any game
//   3. Challenge             (dailyBoard.rival)  - duel whoever is next to you
//
// The flip replaces the old dot-only affordance with a named pill plus dots, so
// a reader can always tell WHICH board they are looking at; hovering the pill
// pauses the rotation and the dots are clickable.
//
// 2026-08-08 (owner): the right rail's Live feed | Your results TABS became a
// timed flip like the left rail's panels. The "Your results" face became DAILY
// MASTERY, which in turn moved out to the Category Mastery tile on 2026-08-12,
// see the note above.
//
// 2026-08-12 (owner): DAILY MASTERY LEFT THE LOFT for the Category Mastery tile
// on the browse row, which now flips between Quiz mastery and Daily mastery on
// the same 8s beat. In its place the Loft's second face is DAILY CATEGORY
// LEADERS: who is top of End Game, Word, Logic and the rest today, each one a
// hero slip. Nine categories do not fit one panel, so that face SUB-ROTATES
// three views of three on the same timer, which is why the flip now has four
// steps (live, then leaders 1/2/3) rather than two. The live face gained the
// day's PLAYER count beside its play count: plays and time said how busy the
// day was without saying how many people that was.
//
// 2026-08-10 (owner, mockup home-rails-mockups.html): the last two elements
// still on the pre-direction-B look were brought over. The Loft gained a cap
// slab per face (the live one deliberately anonymous: day TOTALS, never the
// newest player), its feed rings became 4px left rules, and its mastery list is
// now banded closest-to-done first with category-coloured bars. Featured became
// three cap cards on the ramp with a real control each, replacing three equal
// pastel rows. The remaining pastel-free rule: no tinted icon squares and no
// chevrons anywhere in these rails.
//
// 2026-08-14 (owner): BOTH RAILS REBALANCED. The left rail's three leaderboard
// panels became ONE three-face panel: three panels each leading with a hero
// slab and then two runners-up put nine names on a 282px rail and made none of
// them land, so it now shows one board at a time, five rows deep. The daily
// category leaders came off the Loft's second face to sit under it, where the
// other boards are, and lost the waterfall rotation with the flip (nothing is
// hidden behind a turn any more, so there is nothing to rotate into view).
//
// The right rail lost the NAME "The Loft" and the flip with it, so the panel is
// the live feed and says so. Featured was deleted outright, and the Daily
// Challenge and Quiz of the Day were dropped from the home page rather than
// rehoused (both are still on the quiz hub). In its place: a STREAK tile, on a
// site-wide consecutive-day run that daily-status did not compute until this
// shipped, and a CHALLENGE tile prefilled with the player immediately ahead of
// the reader on today's combined board (or immediately behind, when they are
// already first). The rival cannot be read off the board in this file: it is a
// top 10, and most readers sit outside it, so /api/quiz/daily-combined resolves
// the neighbour and the anon the duel composer needs.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { T } from '@/lib/theme';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { notifyShareCredit } from './ShareCreditPop';
import { ringBlue, catBlue } from '@/lib/home-blues';
import { CONTEST, COPY, contestIsLive, formatScore } from '@/lib/contest';
// The streak tile's figures ride along with the day-status payload the page
// header and the slate are already asking for: fetchDayStatus memoizes the
// promise for the page load, so a third reader costs no third request.
import { fetchDayStatus } from './useDayStats';

const MEDAL = [T.gold, T.silver, T.bronze];

// Collapsed every board shows five; expanded it shows TEN, never "all"
// (owner, 2026-08-08). The boards run to dozens of rows, so "Show all 11" both
// under-promised and over-delivered: it named a number that is not the size of
// the field, and dumping the whole field into a rail is not what the reader
// wanted from a top-five card either. Ten is the readable full page.
const ROWS_COLLAPSED = 5;
const ROWS_OPEN = 10;
function boardSlice(rows, open) {
  return (rows || []).slice(0, open ? ROWS_OPEN : ROWS_COLLAPSED);
}
// The expander only earns its place when there is a second page to show.
function hasMore(rows) { return (rows || []).length > ROWS_COLLAPSED; }

// Blue tile art, the same pair DailyStrip uses for the slate rows and cap tiles
// (kept local rather than imported: DailyStrip does not export them, and this is
function num(n) { return (n || 0).toLocaleString(); }

// Two faint states only (owner, 2026-08-03): a solid green/gold/red chip column
// read as a traffic light and pulled the eye off the feed itself.
function scoreTone(pct) {
  return pct >= 70
    ? { background: '#f0faf5', color: T.successDeep, border: '1px solid #d8eee4' }
    : { background: '#fdf1f0', color: '#a8362c', border: '1px solid #f2dcd9' };
}

// The green/red traffic light was retired 2026-08-04: the ring now steps down a
// blue ramp, deep navy for a strong run through pale for a weak one. The arc
// length and the printed percentage were always the actual readout.
function ringTone(pct) { return ringBlue(pct); }

function Rows({ rows, fmt, open, hrefFor, hero, cap }) {
  // The phone hero slab: the panel's #1 rendered in the same shape as the Up
  // next / Easiest board cap bars (eyebrow, big name, sub, big figure), with
  // its table row hidden underneath so the list starts at 2. Both renders sit
  // in the DOM at once and each is display:none at the other width, which keeps
  // the hidden one out of the accessibility tree, so nothing is read twice.
  const lead = (hero && rows.length) ? rows[0] : null;
  return (
    <>
    {lead ? (
      <div className={`hr-hero${hero.tone === 'lite' ? ' lite' : ''}`}>
        <div className="hr-htxt">
          <div className="hr-heye">{hero.eyebrow}</div>
          <div className="hr-hnm"><Link href={hrefFor(lead.name)}>{lead.name}</Link></div>
          {hero.sub ? <div className="hr-hsub">{hero.sub}</div> : null}
        </div>
        <div className="hr-hval"><b>{fmt(lead.value)}</b><span>{hero.unit || 'score'}</span></div>
      </div>
    ) : null}
    <table className={`hr-tbl${cap ? ' cap3' : ''}`}><tbody>
      {rows.map((r, i) => (
        <tr key={`${r.name}-${i}`} className={i === 0 ? 'lead1' : undefined}>
          <td className="rk" style={i < 3 ? { color: MEDAL[i] } : undefined}>{i + 1}</td>
          <td><Link href={hrefFor(r.name)} className="hr-nm" style={{ fontWeight: i === 0 ? 800 : 600 }}>{r.name}</Link></td>
          <td className="r hr-v">{fmt(r.value)}</td>
        </tr>
      ))}
      {!rows.length ? <tr><td colSpan={3} className="hr-none">Nothing here yet today.</td></tr> : null}
    </tbody></table>
    </>
  );
}

// Shared face rotation for every flipping panel: which face is showing, a hover
// hold so a reader can stop it on the one they are looking at, and the pill +
// dots control. `ms` is per panel (the leaderboards run at 7s, the right rail's
// Loft at 8s, per owner) so the two rails never tick in lockstep.
function useFlip(count, ms) {
  const [ix, setIx] = useState(0);
  const holdRef = useRef(false);
  useEffect(() => {
    if (count < 2) return undefined;
    const id = setInterval(() => { if (!holdRef.current) setIx((v) => (v + 1) % count); }, ms);
    return () => clearInterval(id);
  }, [count, ms]);
  return { ix: Math.min(ix, Math.max(0, count - 1)), setIx, holdRef };
}

// FIT THE LIST TO THE PANEL, DO NOT SCROLL IT (owner, 2026-08-14). Both rail
// lists used to render a fixed number of rows into a fixed-height box and let
// the overflow scroll, so the panel always ended mid-row and read as
// unfinished whatever was in it.
//
// This measures the box and answers two questions: how many rows fit (`n`),
// and how much height is left over once they do (`pad`, split evenly onto the
// top and bottom of every row, so the last one ends where the panel ends).
// `cap: false` keeps every row and only distributes the slack, which is what
// the category list wants: nine categories with one missing is worse than
// nine slightly taller rows.
//
// The base row height is measured ONCE, on a pass where pad is still zero, so
// the padding this adds can never feed back into the number it divides by.
// Rows mark themselves with data-fitrow, because an empty list renders a
// placeholder div and measuring THAT would set a nonsense base.
function useFitRows(total, cap, dataLen) {
  const boxRef = useRef(null);
  const [fit, setFit] = useState({ n: total, pad: 0 });
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    let raf = 0;
    const timers = [];
    const measure = () => {
      // A box that is not height-constrained (the stacked layout below 1200px
      // sets overflow:visible) has no slack to divide and no reason to cap:
      // measuring it would also loop, since its height follows the padding.
      if (getComputedStyle(box).overflow === 'visible') {
        setFit((p) => (p.n === total && p.pad === 0 ? p : { n: total, pad: 0 }));
        return;
      }
      const rows = box.querySelectorAll('[data-fitrow]');
      if (!rows.length) return;
      // THE BASE IS DERIVED EVERY PASS, NEVER CACHED, and the pad it subtracts
      // is READ BACK OFF THE ELEMENT rather than remembered.
      //
      // Two bugs live here, both shipped on 2026-08-14. Caching the base left
      // the category list pinned at the padding floor with 79px of dead space:
      // the pass that set the cache caught the box mid-layout while it was
      // still short, and every pass after divided by a base that no longer
      // described the rows on screen. Replacing the cache with a ref of the
      // pad we last DECIDED was no better and clipped 142px, because React
      // applies that decision on the next render: a re-measure a frame later
      // read a row still carrying the old padding while the ref already held
      // the new one, so the base moved every pass and never converged.
      // getComputedStyle reports what is actually rendered, so the subtraction
      // always matches the height it is subtracted from.
      const applied = parseFloat(getComputedStyle(box).getPropertyValue('--rowpad')) || 0;
      const base = rows[0].getBoundingClientRect().height - 2 * applied;
      const h = box.clientHeight;
      if (!h || base <= 0) return;
      const room = Math.max(1, Math.floor(h / base));
      const n = cap ? Math.min(total, room) : total;
      // SIGNED, and fractional. Nine category rows at 43.5px want 391px in a
      // 381px panel, so the fix is nine rows 0.6px shorter, not a clipped
      // ninth. The floor keeps ~1px of real padding at the tightest.
      const raw = n > 0 ? (h - n * base) / n / 2 : 0;
      const pad = Math.max(-5, Math.round(raw * 100) / 100);
      setFit((p) => (p.n === n && Math.abs(p.pad - pad) < 0.05 ? p : { n, pad }));
    };
    measure();
    // SETTLE PASSES, and there are several on purpose. First paint is exactly
    // when the box is least likely to be its final height: the rail's height
    // comes from a measurement of the centre console an effect away, the panel
    // above it resolves its own content, and web fonts reflow the rows under
    // it. The observer alone did NOT catch the last of those changes on the
    // live page (owner-reported, 2026-08-14: the category list sat at a pad
    // computed against a 523px box while the box was 381px, and one synthetic
    // resize event fixed it instantly), so the settle is scheduled rather than
    // waited for. Six passes over two seconds cost nothing; each is a couple
    // of reads and a setState that usually changes nothing.
    if (typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(measure);
    for (const ms of [150, 400, 900, 1800]) timers.push(setTimeout(measure, ms));
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {}); }
    catch (e) { /* no font loading API */ }
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(box); }
    window.addEventListener('resize', measure);
    return () => {
      if (raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // dataLen is the RAW item count, and it is the dep that matters: `total`
    // for the feed is min(14, len || 14), which reads 14 before the fetch and
    // 14 after, so keying on it alone meant the one run this effect ever got
    // was against an empty box (owner-reported, 2026-08-14).
  }, [total, cap, dataLen]);
  return { boxRef, n: fit.n, pad: fit.pad };
}

// The pill naming the visible face, plus its clickable dots. Rendered into the
// panel's navy header band, where the flip control has always lived.
// `names` is optional and only for assistive tech: the Loft's three leader
// views all show the same pill label ("Category leaders"), so the labels array
// carries duplicates and the dots need their own distinct descriptions. Keys are
// the INDEX for the same reason, a duplicate label cannot be a React key.
function FlipPill({ labels, names, ix, setIx, holdRef }) {
  if (labels.length < 2) return null;
  return (
    <span
      className="hr-flip"
      onMouseEnter={() => { holdRef.current = true; }}
      onMouseLeave={() => { holdRef.current = false; }}
    >
      <span className="hr-lbl">{labels[ix]}</span>
      <span className="hr-dots">
        {labels.map((l, i) => (
          <i
            key={`${l}-${i}`}
            className={i === ix ? 'on' : undefined}
            role="button"
            tabIndex={0}
            aria-label={(names && names[i]) || l}
            onClick={() => setIx(i)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIx(i); }}
          />
        ))}
      </span>
    </span>
  );
}

// A panel whose body flips between two faces on a timer. `faces` is an array of
// { label, sub, rows, href }, and the pill names the face that is showing.
// Three optional per-face fields were added 2026-08-14, when the left rail's
// three panels became one: `heroSub` (the phone slab's sub line is ONE nowrap
// line, so a face whose band carries an extra clause keeps the short version
// for the slab), `footLabel`, and `emptyAction` (what the expander slot offers
// on a board too short to expand, rather than an invisible spacer).
function FlipPanel({ icon, title, faces, open, onToggle }) {
  const { ix, setIx, holdRef } = useFlip(faces.length, 7000);
  const face = faces[Math.min(ix, faces.length - 1)] || faces[0];
  if (!face) return null;
  return (
    <section className="hr-panel hr-flex hr-lb">
      {/* A third face means a wider pill in a 282px header, and the TITLE is
          the thing that must never be squeezed into an ellipsis here (it has
          happened before). The header tightens its own type instead. */}
      <div className={`hr-ph${faces.length > 2 ? ' hr-ph3' : ''}`}>
        <span className="hr-pi">{icon}</span>
        <h2>{title}</h2>
        <FlipPill labels={faces.map((f) => f.label)} ix={ix} setIx={setIx} holdRef={holdRef} />
      </div>
      <div className="hr-sub">{face.sub}</div>
      <div className="hr-scroll hr-flex">
        <Rows
          rows={boardSlice(face.rows, open)}
          fmt={face.fmt}
          hrefFor={face.hrefFor}
          hero={{ eyebrow: face.eyebrow || face.label, sub: face.heroSub || face.sub, unit: face.unit, tone: face.tone }}
        />
      </div>
      <div className="hr-foot">
        {hasMore(face.rows) ? (
          <button type="button" className="hr-exp" onClick={onToggle}>
            {open ? 'Show fewer' : `Show top ${ROWS_OPEN}`}
          </button>
        ) : (face.emptyAction
          ? <button type="button" className="hr-exp" onClick={face.emptyAction.onClick}>{face.emptyAction.label}</button>
          : <span className="hr-exp" style={{ opacity: 0 }} aria-hidden="true">·</span>)}
        <Link href={face.href} className="hr-link">{face.footLabel || 'Full leaderboard'} &rarr;</Link>
      </div>
    </section>
  );
}

export default function HomeRails({
  side,
  refData,
  dailyBoard,
  me,
  myCats = [],
  dailyMastery = [],
  qotd = null,
  xpToday = [],
  xp30 = [],
  xpAll = [],
  totals,
  lastPlayed = [],
  titleFor,
  catFor,
  hrefFor,
  onCredit,
  onAllLive,
}) {
  // ONE expand key, not three: the left rail's three boards are one panel now.
  const [open, setOpen] = useState({ lb: false });
  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  // side="board" only: which tab is showing, and which accordion section is
  // open inside the Leaderboard tab. Declared here with the other hooks.
  const [bTab, setBTab] = useState('lb');
  const [bSec, setBSec] = useState('comm');
  // You tab: DAILIES LEAD (owner, 2026-08-15). Quiz mastery already has its
  // own tile on the browse row below, so the Loft's personal board opens on
  // the thing that is only here: how much of each daily archive you have
  // played. The quiz-category ranking stays one tap away.
  const [bYou, setBYou] = useState('daily');

  // ── LEFT ──────────────────────────────────────────────────────────────────
  const community = useMemo(() => {
    const top = (refData && Array.isArray(refData.top)) ? refData.top : [];
    return top.map((r) => ({ name: r.username || 'Player', value: r.credits }));
  }, [refData]);

  // Contest board for the top-left slot. Resolved after mount (contestIsLive
  // reads the clock, so evaluating it during SSR risks a hydration mismatch at
  // the window boundary), and fetched only while the contest is running, so a
  // finished contest costs nothing. A failed fetch leaves contestRows empty and
  // the panel falls back to the normal community board.
  const [contestLive, setContestLive] = useState(false);
  const [contest, setContest] = useState(null);
  useEffect(() => { if (side === 'left' || side === 'board') setContestLive(contestIsLive()); }, [side]);
  useEffect(() => {
    if (!contestLive) return undefined;
    let alive = true;
    const qs = new URLSearchParams();
    try {
      const anon = localStorage.getItem('sot_quiz_anon') || '';
      if (anon) qs.set('anonId', anon);
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null');
      if (id && id.email) qs.set('email', id.email);
    } catch { /* private mode */ }
    fetch(`/api/quiz/contest${qs.toString() ? `?${qs}` : ''}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setContest(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [contestLive]);

  const contestRows = useMemo(() => {
    const b = (contest && Array.isArray(contest.board)) ? contest.board : [];
    return b.map((r) => ({ name: r.username || 'Player', value: r.score }));
  }, [contest]);

  const contestDays = contest && contest.contest ? contest.contest.daysLeft : 0;
  // Only take over the slot once there is actually something to show; an empty
  // contest board would otherwise blank a panel that had real content in it.
  const showContest = contestLive && contestRows.length > 0;
  const communityRows = showContest ? contestRows : community;

  // The combined daily-games score (best-N total), NOT games played: "29/42"
  // read as a fraction of the slate and told you nothing about how well anyone
  // did (owner, 2026-08-03).
  const dailyRows = useMemo(() => {
    const ov = (dailyBoard && Array.isArray(dailyBoard.overall)) ? dailyBoard.overall : [];
    return ov.map((r) => ({ name: r.username || 'Player', value: r.total }));
  }, [dailyBoard]);

  // ── RIGHT ─────────────────────────────────────────────────────────────────
  // THE DAILY-GAME CATEGORIES, in the order the slate's filter strip lists them:
  // first appearance down the live roster, so the two surfaces name the same
  // groups in the same order without either owning a hardcoded list. Built from
  // the STATIC roster rather than from today's board, which is what makes the
  // view count stable from the first render: the flip timer resets whenever its
  // count changes, and a count that waited on a fetch would restart the rotation
  // the moment the board landed.
  const catList = useMemo(() => {
    const out = [];
    for (const k of liveDailyKeys()) {
      const c = (DAILY_GAME_MAP[k] || {}).cat;
      if (c && !out.includes(c)) out.push(c);
    }
    return out;
  }, []);

  // DAILY CATEGORY LEADERS (owner, 2026-08-12). Who is top of End Game, of Word,
  // of Logic today. The leader of a category is the player with the MOST
  // COMBINED POINTS across every game in it, the same currency the combined
  // daily board runs on, so sweeping five Word games beats one big Crux run,
  // which is the behaviour the owner asked for.
  //
  // It is computed from `dailyBoard.games`, which the page already fetches, so
  // this costs no request. The caveat that comes with that: each per-game board
  // carries its top 10 NAMED players, so a player who is 11th in every game of a
  // category is invisible here. That cannot cost anyone the lead in practice (a
  // leader is by definition near the top of the games they played) and the
  // alternative is a new server route to answer a rail slip.
  const catLeaders = useMemo(() => {
    const games = (dailyBoard && Array.isArray(dailyBoard.games)) ? dailyBoard.games : [];
    const acc = new Map();
    for (const c of catList) acc.set(c, { games: 0, plays: 0, players: new Map() });
    for (const g of games) {
      const c = acc.get((DAILY_GAME_MAP[g.key] || {}).cat);
      if (!c) continue;
      c.games += 1;
      c.plays += Number(g.plays) || 0;
      for (const pl of (g.board || [])) {
        if (!pl || !pl.username) continue;
        const cur = c.players.get(pl.username) || { name: pl.username, pts: 0, n: 0 };
        cur.pts += Number(pl.points) || 0;
        cur.n += 1;
        c.players.set(pl.username, cur);
      }
    }
    return catList.map((name) => {
      const c = acc.get(name) || { games: 0, plays: 0, players: new Map() };
      // Points, then games played in the category, then name: a tie on points
      // goes to whoever earned it across more of the category.
      const ranked = [...c.players.values()]
        .sort((a, b) => b.pts - a.pts || b.n - a.n || a.name.localeCompare(b.name));
      const best = ranked[0] || null;
      return {
        name,
        games: c.games,
        plays: c.plays,
        field: c.players.size,
        leader: best ? { name: best.name, pts: Math.round(best.pts * 10) / 10, n: best.n } : null,
      };
    });
  }, [dailyBoard, catList]);

  // The Loft's two-face flip and its waterfall rotation were removed
  // 2026-08-14: the category leaders moved to the left rail beside the other
  // boards, so the right panel has one face and nothing to rotate. catLeaders
  // above is now read by the LEFT branch.

  const playsToday = (totals && totals.today) || 0;
  // Distinct PLAYERS today, guests included, straight off /api/quiz/totals
  // (added 2026-08-12 with this slip). Plays and time said how busy the day was
  // without ever saying how many people that was: 600 plays is a different day
  // depending on whether it is eighty people or eight.
  const playersToday = (totals && totals.todayPlayers) || 0;
  const timeToday = (() => {
    const x = Math.round((totals && totals.todayTime) || 0);
    const h = Math.floor(x / 3600); const m = Math.round((x % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  // YOUR STREAK, for the right rail's tile. The route computes a site-wide
  // consecutive-day run alongside the per-game ones it already had; see
  // /api/quiz/daily-status. Signed out, fetchDayStatus resolves null and the
  // tile renders its "not started" state, which is the honest answer for a
  // reader the server cannot identify.
  const [day, setDay] = useState(null);
  useEffect(() => {
    if (side !== 'right' && side !== 'board') return undefined;
    let alive = true;
    fetchDayStatus().then((d) => { if (alive && d) setDay(d); }).catch(() => {});
    return () => { alive = false; };
  }, [side]);

  // Streak figures, and the rival the challenge tile offers. Both are read
  // straight off payloads the rail already has, so neither costs a request:
  // `day` is the shared day-status promise, `dailyBoard.rival` is computed by
  // /api/quiz/daily-combined, which is the only place that can see who sits
  // immediately either side of a reader outside the top 10.
  // Both hooks run on every render, whichever side this instance is: hooks
  // cannot sit behind the side branch below, and the one whose ref never
  // attaches simply measures nothing.
  const FEED_MAX = 14;
  const feedLen = (lastPlayed || []).length;
  const feedFit = useFitRows(Math.min(FEED_MAX, feedLen || FEED_MAX), true, feedLen);
  const catFit = useFitRows(catLeaders.length, false, catLeaders.length);

  const streak = (day && typeof day.streak === 'number') ? day.streak : 0;
  const playedToday = !!(day && day.playedToday);
  const rival = (dailyBoard && dailyBoard.rival) || null;
  const duelHref = (rival && rival.anon)
    ? `/duel/new?opponent=${encodeURIComponent(rival.anon)}&oppName=${encodeURIComponent(rival.username || 'Player')}`
    : '/duel/new';
  // The distance, never the direction: `behind` already carries that, and a
  // dead heat reads as one rather than as "0 points ahead".
  const gapLine = rival
    ? (rival.gap > 0
      ? `${rival.gap} ${rival.gap === 1 ? 'point' : 'points'} ${rival.behind ? 'back' : 'ahead'}`
      : 'level with you')
    : '';

  const CSS = (
    <style dangerouslySetInnerHTML={{ __html: `
      /* The panel's white ground STOPS below its header (owner, 2026-08-12).
         A square-cornered child clipped by a rounded parent double-blends at
         the curve: the corner pixel comes out part header navy, part whatever
         the parent paints under it, so a white panel ground surfaced as a white
         nick on each rail cap that the centre console never showed, since
         .dhome.slate is transparent and its .sl-bar draws its own 13px corner
         over a border of its own fill colour (DailyStrip.jsx). Both halves of
         that treatment are copied here: 24px of accent under the top of the
         panel (well inside the header's 42px, so it can never surface below
         it) and a header that carries the corner and a 1px ring of its own. */
      .hr-panel{background:var(--white) linear-gradient(var(--accent) 0 24px,transparent 24px);border:1px solid #d9dfe9;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:0;box-shadow:0 1px 2px rgba(16,24,40,.06),0 8px 20px -12px rgba(16,24,40,.28);}
      .hr-flex{flex:1 1 auto;min-height:0;}
      /* Every panel header is the SAME height across all three columns, so the
         first band of each panel (the hero slab here, the Up next bar on the
         slate) starts on one line (owner, 2026-08-08). Two things enforce it:
         a min-height of 42px (the 24px icon plus 9px of pad either side, which
         is what a one-line header already measured), and a title that can never
         wrap. A wrapped title is what broke the row before: "Community
         Leaderboard ($)" ran to two lines in a 282px rail and pushed that one
         header to 48px. Titles are kept SHORT for that reason; nowrap plus
         ellipsis is the belt-and-braces so a future rename cannot reintroduce
         the misalignment, it just clips. The slate's .sl-bar in DailyStrip.jsx
         carries the matching 43px (42 plus the 1px panel border the rails have
         above their header) and must move with this number. */
      .hr-ph{display:flex;align-items:center;gap:9px;padding:9px 13px;min-height:42px;box-sizing:border-box;background:var(--accent);flex:none;border-radius:12px 12px 0 0;box-shadow:inset 0 0 0 1px var(--accent);}
      .hr-ph h2{font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--white);margin:0;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-pi{width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);color:var(--white);display:flex;align-items:center;justify-content:center;flex:none;}
      /* Countdown chip in the panel header, contest only. Sits where the flip
         pill sits on the rotating panels, so the header keeps one shape. */
      .hr-chip{margin-left:auto;flex-shrink:0;font-size:10px;font-weight:800;letter-spacing:.06em;color:#bfdbfe;background:rgba(255,255,255,.14);border-radius:999px;padding:3px 8px;}
      .hr-flip{margin-left:auto;display:flex;align-items:center;gap:7px;}
      /* Both the chip and the pill claim the auto margin, so a header carrying
         BOTH would split the free space between them and leave the chip
         stranded mid-header. The pill gives its margin up in that case and the
         pair sits together on the right edge. */
      .hr-chip + .hr-flip{margin-left:0;}
      /* Three-face header: 11px/.1em buys back ~10px against the wider pill,
         which is the difference between the full title and "LEADERBOA...". */
      .hr-ph3 h2{font-size:11px;letter-spacing:.1em;}
      /* The two right-rail tiles are fixed-height cards under a feed that
         takes the slack, so they must not stretch with it. */
      .hr-tile{flex:none;}
      /* THE BOARD TAKES ITS CONTENT, THE CATEGORIES TAKE THE REST (2026-08-14).
         Both panels are .hr-flex, i.e. flex:1 1 auto, so they divide the rail
         by content size, and nine category slabs (~770px) against a five-row
         table (~140px) is not a fight the board can win: it shipped at 159px
         with rows 4 and 5 behind a scrollbar. The board is a fixed, knowable
         height, so it claims that and stops scrolling; the category list was
         always the scroller here and now genuinely is one. Both rules sit
         above the <=1200px block, which sets .hr-flex to flex:none and takes
         over from them when the rails stack. */
      .hr-lb{flex:0 0 auto;}
      .hr-lb .hr-scroll{overflow:visible;}
      .hr-cats{flex:1 1 0;min-height:240px;}
      .hr-lbl{font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--white);background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.26);padding:3px 9px;border-radius:999px;white-space:nowrap;}
      .hr-dots{display:flex;gap:4px;}
      .hr-dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.38);cursor:pointer;display:block;}
      .hr-dots i.on{background:var(--white);}
      .hr-sub{font-size:11px;color:var(--slate);padding:7px 13px;background:var(--surface);border-bottom:1px solid var(--border);flex:none;}
      .hr-scroll{overflow-y:auto;scrollbar-width:thin;scrollbar-color:#d3d9e2 transparent;}
      .hr-scroll::-webkit-scrollbar{width:6px;}
      .hr-scroll::-webkit-scrollbar-track{background:transparent;}
      .hr-scroll::-webkit-scrollbar-thumb{background:#dfe4ec;border-radius:3px;}
      .hr-tbl{width:100%;border-collapse:collapse;}
      .hr-tbl td{padding:5px 13px;border-bottom:1px solid #f0f2f6;font-size:13px;}
      .hr-tbl tr:last-child td{border-bottom:none;}
      .hr-tbl tr:hover{background:var(--surface);}
      .hr-tbl td.r{text-align:right;}
      .hr-tbl td.rk{font-size:11px;font-weight:800;width:24px;color:#9aa2b1;font-variant-numeric:tabular-nums;}
      /* The #1 is the SLAB at both widths, so its table row is always hidden
         and the list starts at 2.
         cap3 held the collapsed panel to a slab plus a top THREE (owner,
         2026-08-08), which is what let all THREE boards stack in this rail at
         once. They became one three-face panel on 2026-08-14, so the reason is
         gone and the cap with it: one board can afford the five rows
         boardSlice already hands it. The Rows component still accepts a cap
         prop and the phone override below still lifts it, so restoring the
         old behaviour is one prop away if a second board ever comes back to
         this rail.
         NO BACKTICKS IN THIS BLOCK, EVER: it lives inside the CSS template
         literal, so a backtick here closes the string and breaks the build.
         That shipped once, on 2026-08-14. */
      .hr-tbl tr.lead1{display:none;}
      .hr-tbl.cap3 tr:nth-child(n+4){display:none;}
      .hr-nm{color:var(--ink);text-decoration:none;}
      .hr-nm:hover{text-decoration:underline;}
      .hr-v{font-weight:700;font-variant-numeric:tabular-nums;}
      .hr-none{font-size:12px;color:var(--muted);padding:8px 13px;}
      /* Phone hero slab (direction B, owner-approved 2026-08-07). Hidden above
         900px, where the panel keeps its plain ranked table. Below 900px it
         shows, the #1 table row hides, and the panel's grey sub-strip folds
         INTO the slab so each rail reads with the cap bars' shape. The strip is
         hidden only where a hero actually rendered (:has), so an empty board
         keeps its descriptor.
         The ground is BLUE, not the header's navy: .hr-ph stays visible (it
         carries the contest countdown and the flip panel's face switcher, which
         a phone still needs), so a navy slab would abut a navy header with no
         edge between them. Blue over navy is the same pairing the two cap bars
         already use, and the gold rule marks this one as a leaderboard #1
         rather than a "go play this". */
      .hr-hero{display:flex;position:relative;align-items:center;gap:12px;padding:14px 14px 14px 22px;background:var(--blue);color:var(--white);}
      .hr-hero::before{content:'';position:absolute;left:10px;top:13px;bottom:13px;width:4px;border-radius:2px;background:var(--gold);}
      .hr-hero.lite{background:#4d84f3;}
      .hr-htxt{min-width:0;}
      .hr-heye{font-size:9.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#dbe8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      /* line-height 1.3 plus a pixel of pad, not 1.1: these lines are
         overflow:hidden for the ellipsis, so a tight box clips a descender. */
      .hr-hnm{font-size:19px;font-weight:800;letter-spacing:-.3px;line-height:1.3;padding-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-hnm a{color:var(--white);text-decoration:none;}
      .hr-hsub{font-size:11px;font-weight:600;line-height:1.35;padding-bottom:1px;color:var(--blue-200);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-hval{margin-left:auto;flex:none;text-align:right;}
      .hr-hval b{display:block;font-size:23px;font-weight:800;letter-spacing:-.6px;line-height:1.1;font-variant-numeric:tabular-nums;}
      .hr-hval span{display:block;font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--blue-200);margin-top:2px;}
      .hr-panel:has(.hr-hero) .hr-sub{display:none;}
      .hr-foot{display:flex;align-items:center;gap:10px;padding:7px 13px;border-top:1px solid var(--border);flex:none;}
      .hr-exp{border:0;background:none;padding:0;font:inherit;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--slate);cursor:pointer;white-space:nowrap;flex:none;}
      .hr-exp:hover{color:var(--blue-deep);}
      .hr-link{margin-left:auto;font-size:11px;font-weight:800;color:var(--blue-deep);text-decoration:none;white-space:nowrap;flex:none;}
      .hr-link:hover{text-decoration:underline;}
      /* The right rail's slab. Same object as .hr-hero above (the leaderboard
         #1 on a phone) but it shows at EVERY width, because a feed and a tile
         are lists rather than boards and had no anchor of any kind. The live
         feed and the streak take the lighter blue; the category leader slips,
         which are the same object over on the LEFT rail now, run the navy ramp
         below so a stack of them still reads as a stack. */
      /* IT IS EXACTLY AS TALL AS A CAP BAR, and that is measured, not eyeballed
         (owner, 2026-08-10: the first cut came out 80.5px against the cap's
         84.8px and read as a near miss, which is worse than an obvious
         difference). It sits directly beside the Up next / Easiest cap cards in
         the three-column console, so the two have to start and end on the same
         lines. Every number below is copied from .dh-cell / .dh-bue / .dh-bun /
         .dh-busub in DailyStrip.jsx: 14px padding, a 9.5px eyebrow, a 20px name
         on a 26px line with 1px of pad, and an 11px sub with a 1px top margin.
         14 + 13 + 27 + 15.8 + 14 = 84.8. IF THE CAP BAR'S TYPE OR PADDING
         CHANGES, CHANGE IT HERE TOO, and re-measure both rather than trusting
         the arithmetic in this comment. */
      .hr-lslab{position:relative;display:flex;align-items:center;gap:12px;flex:none;
                padding:14px 14px 14px 22px;background:var(--accent);color:var(--white);}
      .hr-lslab::before{content:'';position:absolute;left:10px;top:13px;bottom:13px;width:4px;border-radius:2px;background:var(--blue-400);}
      .hr-lslab.lite{background:var(--blue);}
      .hr-lslab.lite::before{background:var(--blue-200);}
      .hr-lstxt{min-width:0;flex:1;}
      .hr-lseye{font-size:9.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#dbe8ff;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      /* An explicit 26px line plus a pixel of pad, not a tight multiple: these
         lines are overflow:hidden for the ellipsis, so a tight box clips a
         descender, and a unitless line-height would drift from the cap bar the
         moment either font size moved. Same reasoning as .hr-hnm. */
      .hr-lsnm{font-size:20px;font-weight:800;letter-spacing:-.3px;line-height:26px;padding-bottom:1px;
               font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-lssub{font-size:11px;font-weight:600;line-height:1.35;margin-top:1px;padding-bottom:1px;color:var(--blue-200);
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-lsval{margin-left:auto;flex:none;text-align:right;}
      .hr-lsval b{display:block;font-size:20px;font-weight:800;letter-spacing:-.5px;line-height:1.1;font-variant-numeric:tabular-nums;}
      .hr-lsval span{display:block;font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--blue-200);margin-top:2px;}
      /* The live face's supporting pair: players and time played, stacked, at a
         size that reads as support rather than as two more headlines. Label
         beside the figure rather than under it, so two stats fit the slab's
         fixed height with room between them. */
      .hr-lspair{margin-left:auto;flex:none;display:flex;flex-direction:column;gap:6px;text-align:right;}
      .hr-lspair span{display:block;font-size:13px;font-weight:800;line-height:1.05;font-variant-numeric:tabular-nums;white-space:nowrap;}
      .hr-lspair span i{font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--blue-200);margin-left:4px;}
      /* CATEGORY LEADERS: UNIFORM ROWS (owner, 2026-08-14). Each one used to be
         a full .hr-lslab, ~85px of eyebrow, 20px name, sub line and a value
         cell, on a ground that stepped navy / blue / pale down the ramp. That
         was built for a ROTATING FACE showing a few at a time, where a slab
         sized object with its own ground made sense. All nine are listed at
         once now, and at that length the three-tone alternation reads as the
         panel changing colour nine times rather than as structure, and the
         third line of every slip is noise. Nine slabs came to ~770px, which
         also lost the flex fight with the board above it.

         So: one shape, ~34px, on the same white ground the live feed rows use,
         which is what makes the two rails read as one page. The category keeps
         its own colour, but only in the 3px rule, the same value its chip
         wears on the slate. Category above, leader below, points on the right
         edge, and the plays-and-games line is gone. */
      /* NEITHER LIST SCROLLS (owner, 2026-08-14). useFitRows sizes them to the
         panel and hands back the leftover height as --rowpad, which each row
         adds to its own top and bottom. So the rows grow to fill the space
         evenly rather than the last one being sliced by an overflow edge. */
      .hr-scroll.hr-clbody{display:flex;flex-direction:column;min-height:0;overflow:hidden;}
      .hr-scroll.hr-actbody{overflow:hidden;}
      .hr-actbody .hr-res{padding-top:calc(7px + var(--rowpad,0px));padding-bottom:calc(7px + var(--rowpad,0px));}
      .hr-clbody .hr-cl{padding-top:calc(6px + var(--rowpad,0px));padding-bottom:calc(6px + var(--rowpad,0px));}
      .hr-cl{position:relative;display:flex;align-items:center;gap:9px;flex:none;
             padding:6px 13px 6px 20px;border-bottom:1px solid #f0f2f6;}
      .hr-cl:last-child{border-bottom:none;}
      .hr-cl::before{content:'';position:absolute;left:9px;top:7px;bottom:7px;width:3px;
                     border-radius:2px;background:var(--clr,var(--blue-400));}
      .hr-cltxt{flex:1;min-width:0;}
      /* The label takes the CATEGORY's own colour (owner, 2026-08-14: "maybe
         slightly more colour"). It is the same value from lib/home-blues that
         the 3px rule uses and that the category's chip wears on the slate, so
         the row gains colour without gaining a second palette, and nine rows
         still read as one object rather than nine coloured cards. */
      .hr-clcat{display:block;font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;
                color:var(--clr,#8b90a0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-clnm{display:block;font-size:13px;font-weight:800;color:var(--ink);line-height:1.35;
               white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      /* The right column mirrors the left: a small line on top, the figure
         under it, both right-aligned, so every row is the same four cells. */
      .hr-clr{flex:none;text-align:right;}
      .hr-clg{display:block;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
              color:#8b90a0;white-space:nowrap;font-variant-numeric:tabular-nums;}
      .hr-clv{display:block;font-size:13px;font-weight:800;color:var(--ink);line-height:1.35;
              font-variant-numeric:tabular-nums;white-space:nowrap;}
      .hr-clv i{font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.09em;
                text-transform:uppercase;color:#8b90a0;margin-left:3px;}
      /* A category nobody has played today still gets its row, greyed back: a
         gap in the list reads as a bug, and "nobody yet" is a real and useful
         thing for the panel to say. */
      .hr-cl.open .hr-clnm{color:var(--muted);font-weight:700;}
      .hr-res{display:flex;align-items:center;gap:10px;padding:7px 13px;border-bottom:1px solid #f0f2f6;text-decoration:none;color:var(--ink);}
      .hr-res:last-child{border-bottom:none;}
      .hr-res:hover{background:var(--surface);}
      .hr-mid{flex:1;min-width:0;}
      .hr-t{display:flex;align-items:baseline;gap:7px;min-width:0;font-size:12.5px;font-weight:800;}
      .hr-ttl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
      .hr-cat{flex:none;font-size:9.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;padding:2px 6px;border-radius:4px;}
      /* "(x25)": how many times this game has been played today, site-wide. */
      .hr-x{flex:none;font-size:10.5px;font-weight:700;color:#8b90a0;font-variant-numeric:tabular-nums;}
      .hr-s{display:block;font-size:11px;color:var(--slate);}
      /* The live feed's completion cue: a 4px left rule on the blue ramp, which
         replaced the 32px conic ring this panel used to stack fourteen of
         (2026-08-10). ringBlue still supplies the colour, so a strong run still
         renders deep and a weak one pale; only the shape changed, and the
         printed percentage on the right edge was always the real readout. */
      .hr-res.rule{position:relative;padding-left:20px;}
      .hr-rl{position:absolute;left:9px;top:9px;bottom:9px;width:4px;border-radius:2px;}
      .hr-pc{flex:none;font-size:13px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums;}
      .hr-res-sc{font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums;}
      .hr-sc{font-family:var(--font-mono,ui-monospace,monospace);font-size:12.5px;font-weight:700;padding:4px 8px;border-radius:6px;flex:none;min-width:54px;text-align:center;font-variant-numeric:tabular-nums;}
      /* CAP CARDS. Built for Featured, which was deleted 2026-08-14; the
         challenge tile is the one card left using them, and it takes t0 (the
         deepest ground and the gold rule) because it is the only thing in that
         panel. Each is .hr-lslab's shape at a slightly tighter padding, with a
         real control on the right edge instead of a chevron. */
      .hr-fcard{position:relative;display:flex;align-items:center;gap:11px;padding:12px 13px 12px 22px;
                text-decoration:none;color:var(--white);border-bottom:1px solid rgba(255,255,255,.16);}
      .hr-fcard:last-child{border-bottom:none;}
      .hr-fcard::before{content:'';position:absolute;left:10px;top:12px;bottom:12px;width:4px;border-radius:2px;background:var(--blue-200);}
      /* The leading card is the day's event, so it takes the deepest ground and
         the gold rule the site reserves for "this is the one". */
      .hr-fcard.t0{background:var(--accent);}
      .hr-fcard.t0::before{background:var(--gold);}
      .hr-fcard.t1{background:var(--blue);}
      .hr-fcard.t2{background:#4d84f3;}
      .hr-fcard:hover .hr-fcgo{background:var(--blue-200);}
      .hr-fctxt{flex:1;min-width:0;}
      .hr-fceye{display:block;font-size:9.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#dbe8ff;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-fcnm{display:block;font-size:16px;font-weight:800;letter-spacing:-.2px;line-height:1.3;padding-bottom:1px;
               white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-fcsub{display:flex;align-items:center;gap:5px;min-width:0;font-size:11px;font-weight:600;line-height:1.35;
                color:var(--blue-200);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-fcdot{flex:none;opacity:.7;}
      /* Current leader (owner, 2026-08-04). Only the cards that HAVE a live
         board carry one; the duel card passes no leader and renders without it.
         On a coloured ground the gold ink it used on white is unreadable, so it
         takes the medal gold itself. */
      .hr-fl{display:inline-flex;align-items:center;gap:3px;min-width:0;flex:none;max-width:60%;
             font-size:10.5px;font-weight:800;color:var(--gold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .hr-fl svg{flex:none;}
      .hr-fcgo{margin-left:auto;flex:none;font-size:11px;font-weight:800;letter-spacing:.04em;
               background:var(--white);color:var(--blue-deep);border-radius:8px;padding:8px 15px;transition:background .12s;}
      /* PHONE SHARE STRIP (owner, 2026-08-08). The only share affordance on the
         phone home used to be a text button far down the page, below every
         board, which nobody was going to find. This is a full-bleed bar sitting
         directly under the community leaderboard, i.e. immediately under the
         board that ranks people BY sharing, so the ask lands where the reason
         for it is already on screen.
         It is PHONE ONLY: the desktop rail keeps its "Get credit" footer button
         and the header carries the same offer, so a second full-width bar there
         would be a third ask in one column. Tapping it fires the global
         share-credit pop-up, the same one every Share button on the site opens,
         which is where the contest terms are stated. */
      /* GOLD, not --cta. --cta is #2563eb, the same family as the navy panel
         headers this bar is sandwiched between, and a blue bar between two blue
         bands is precisely the "not obvious enough" problem it exists to fix
         (compared side by side on the live page before choosing). Gold is
         already the money colour here, on the #1 rules and the leader crowns,
         so it reads as "there is a prize" and is the one tone on the phone
         stack that nothing else is wearing. Ink is a dark brown rather than
         --gold-ink (#a16207), which is a text-on-white tone and far too low
         contrast on the gold itself.
         border-radius:0 is explicit and required: a global button rule gives
         every button an 8px radius, so the strip shipped with rounded corners
         inside a stack of square full-bleed bands (owner, 2026-08-08). */
      .hr-share{display:none;width:100%;box-sizing:border-box;align-items:center;gap:11px;padding:13px 16px;border:0;border-radius:0;background:var(--gold,#e8b43a);color:#3a2a05;font:inherit;font-family:inherit;text-align:left;cursor:pointer;}
      .hr-share:active{background:#d9a52e;}
      .hr-share .hr-shtxt{flex:1;min-width:0;}
      .hr-share b{display:block;font-size:15px;font-weight:800;letter-spacing:-.2px;line-height:1.25;}
      .hr-share span{display:block;font-size:11px;font-weight:700;opacity:.78;line-height:1.35;margin-top:2px;}
      .hr-share .hr-sharr{flex:none;font-size:19px;font-weight:800;line-height:1;opacity:.55;}
      /* The rails stack at natural height on a phone, but the activity list is
         unbounded, so it alone keeps a cap and scrolls inside it. The leader
         slips are two fixed bars and need no cap, but they DO need a height to
         grow into once .hr-flex stops stretching them. */
      @media(max-width:1200px){.hr-flex{flex:none;}.hr-scroll{overflow:visible;}.hr-actbody{max-height:none;overflow:visible;}
        .hr-scroll.hr-clbody{max-height:none;overflow:visible;}}
      /* The rail pins every panel to the center console's measured height, so a
         slab plus two names left a band of white sitting above the footer
         (owner, 2026-08-08). The TABLE takes that slack rather than the scroll
         box: as a flex child at flex:1 it hands the extra height to rows 2 and
         3, which fills the panel and buys the two names room to read a size up.
         It follows the rail, so nothing here needs retuning when the center's
         cap changes. :has(> .hr-tbl) keeps it off the right rail, whose scroll
         box holds the feed rather than a board. */
      @media(min-width:901px){
        .hr-scroll:has(> .hr-tbl){display:flex;flex-direction:column;}
        .hr-scroll > .hr-tbl{flex:1 1 auto;}
        .hr-scroll > .hr-tbl td{font-size:14.5px;vertical-align:middle;}
        .hr-scroll > .hr-tbl td.rk{font-size:12px;}
      }
      /* Phone: the rail panels run edge to edge like the slate, rather than
         sitting as tiles inside the page gutter (owner, 2026-08-03). */
      @media(max-width:900px){
        .hr-panel{margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);width:auto;max-width:none;border-left:none;border-right:none;border-radius:0;box-shadow:none;}
        /* Square panel, square cap: a 12px header corner inside a square
           panel would put the nick back, on the other side of the curve. */
        .hr-ph{border-radius:0;}
        .hr-tbl.cap3 tr:nth-child(n+4){display:table-row;}
        .hr-share{display:flex;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);width:100vw;max-width:none;}
        /* The panels butt against each other on a phone (the rail gap is zeroed
           in QuizHomeClient), so the second of any adjacent pair would otherwise
           draw a second 1px line right under the first one's. */
        .hr-panel + .hr-panel,.hr-share + .hr-panel{border-top:0;}
      }
      /* ...but from 641px the two rails sit SIDE BY SIDE (the tablet tier in
         QuizHomeClient), and a full-bleed child of a two-column grid escapes its
         column: measured once at 800px, every panel came out 785px wide with the
         left rail at x=-190 and the right at x=190, overlapping each other and
         hanging off the page. The BLEED MOVES UP THERE, onto .dhx itself, so the
         bands still run to both page edges; a panel just stays inside its own
         half. It keeps the square, borderless, shadowless edge-to-edge look the
         phone gives it, since the rails are still full-bleed as a pair. */
      @media(min-width:641px) and (max-width:900px){
        .hr-panel,.hr-share{margin-left:0;margin-right:0;width:100%;}
      }
    ` }} />
  );

  if (side === 'board') {
    /* THE LOFT (home v3). One pinned panel replacing both rails: the left
       rail's three-face leaderboard and its Category leaders, plus the right
       rail's live feed and streak, all in one place.

       TWO LEVELS OF TABS, not an accordion. The accordion this replaced put the
       other boards as bands at the FOOT of the open one, so the thing you
       wanted was always below the thing you did not (owner, 2026-08-15). The
       sub-sorts now sit directly under Leaderboard / Live / You, where they
       read as what they are: another way to slice the same board. Exactly one
       pane is mounted, so the panel's height is the height of ONE board and
       nothing stacks, which is what keeps it inside a single screen.

       COMMUNITY LEADS, because it is the board with something at stake on it:
       it carries the contest while one is running and falls back to referrals
       otherwise (owner, 2026-08-15).

       No new data. communityRows, dailyRows, catLeaders, xp30 and xpAll are all
       already computed above for the left rail, and Live and You reuse the
       right rail's own feed, streak and rival. */
    const bRows = (rows, fmt, unit, eyebrow, sub_, href, footLabel) => (
      <>
        <div className="hr-scroll hrb-body">
          <Rows
            rows={boardSlice(rows, true)}
            fmt={fmt}
            hrefFor={(n) => `/player/${encodeURIComponent(n)}`}
            hero={{ eyebrow, sub: sub_, unit, tone: 'lite' }}
          />
        </div>
        <div className="hr-foot">
          <span className="hr-exp" style={{ opacity: 0 }} aria-hidden="true">&middot;</span>
          <Link href={href} className="hr-link">{footLabel} &rarr;</Link>
        </div>
      </>
    );
    const TABS = [['lb', 'Leaderboard'], ['live', 'Live'], ['you', 'You']];
    const SUBS = [['comm', showContest ? 'Contest' : 'Community'], ['today', 'Today'],
      ['cats', 'Category'], ['m30', '30 days'], ['all', 'All time']];
    const sec = SUBS.some((x) => x[0] === bSec) ? bSec : 'comm';
    // Only offer a sub-tab the player has data for: a brand new account has
    // neither, in which case the strip does not render and the pane is the
    // streak slab plus the duel, exactly as before.
    const youSubs = [];
    if (dailyMastery.length) youSubs.push(['daily', 'Dailies']);
    if (myCats.length) youSubs.push(['quiz', 'Quizzes']);
    const youSec = youSubs.some((x) => x[0] === bYou) ? bYou : (youSubs.length ? youSubs[0][0] : 'daily');
    return (
      <>
        {CSS}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Scoped to .hr-board and placed AFTER the shared sheet on purpose:
             the max-width:1200px block in CSS flattens .hr-flex to flex:none,
             so anything that has to stretch must be declared later. Pinning is
             min-width:1201px only, the same threshold the parent uses to pin a
             rail at all, so 901-1200 and mobile keep their stacked flow.

             EVERY CONTROL IN HERE IS A RECTANGLE. globals.css rounds every
             button on the site to 8px, so a tab strip built out of buttons
             arrives with rounded corners unless it says otherwise, which is
             what it looked like and what the owner objected to. */
          .hr-board{display:flex;flex-direction:column;min-height:0;}
          .hrb-tabs{display:flex;flex:none;background:#0c1a35;}
          .hrb-tabs button{flex:1;border:none;border-radius:0;background:transparent;color:#a3bce8;font:inherit;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:11px 4px;cursor:pointer;border-bottom:3px solid transparent;}
          .hrb-tabs button.on{color:var(--white);border-bottom-color:var(--white);background:var(--accent);}
          /* ALL FIVE ON ONE LINE. They used to wrap 3 and 2, and the owner read
             the strip as three sub-sorts and asked where All time had gone: a
             wrapped second row does not look like more of the same control, it
             looks like a different one. Tightened until five fit (9px, .03em,
             2px side padding), which they do inside 340px with room over. */
          .hrb-subs{display:flex;flex-wrap:nowrap;flex:none;background:#eef2f8;border-bottom:1px solid var(--border);}
          .hrb-subs button{flex:1 1 auto;min-width:0;border:none;border-radius:0;background:transparent;color:#5b6478;font:inherit;font-size:9px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;padding:9px 2px;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .hrb-subs button:hover{color:var(--ink);}
          .hrb-subs button.on{color:var(--blue-dark);border-bottom-color:var(--blue);background:var(--white);}
          .hrb-pane{display:flex;flex-direction:column;min-height:0;}
          .hrb-body{min-height:0;overflow-y:auto;}
          /* The foot. flex:none so it never gives up its height to the board
             above it, which is the whole point of it being here. */
          .hrb-foot{flex:none;border-top:1px solid var(--border);}
          .hrb-qotd{display:flex;flex-direction:column;justify-content:flex-end;gap:3px;min-height:196px;padding:14px 15px;text-decoration:none;
            background-color:var(--blue-dark);background-size:cover;background-position:center;position:relative;isolation:isolate;}
          /* The scrim, not a filter on the image: the photo keeps its colour
             and only the bottom third darkens, which is where the type sits. */
          .hrb-qotd::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(10,20,45,.88),rgba(10,20,45,.35) 55%,rgba(10,20,45,.12));}
          .hrb-qe{font-size:8.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#bcd3ff;}
          .hrb-qt{font-size:19px;font-weight:800;line-height:1.2;letter-spacing:-.01em;color:var(--white);}
          .hrb-duel{display:flex;flex-direction:column;align-items:stretch;gap:9px;padding:12px 13px;text-decoration:none;background:var(--accent-soft);border-top:1px solid var(--border);}
          .hrb-duel:hover{background:var(--white);}
          .hrb-dtx{display:flex;flex-direction:column;min-width:0;}
          .hrb-de{font-size:8.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--slate);}
          .hrb-dn{font-size:14px;font-weight:800;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .hrb-dgo{display:block;text-align:center;background:var(--blue);color:var(--white);border-radius:7px;padding:11px 15px;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;}
          .hrb-duel:hover .hrb-dgo{background:var(--cta-hover);}
          /* YOU IS A REAL PANEL NOW (owner, 2026-08-15: it needs more content,
             your ranking and stats across categories). Streak, three headline
             figures, then where you rank inside every category you have played,
             then the duel. The category list is the part that scrolls, so the
             panel fills its height whatever the player's history looks like. */
          .hrb-stats{display:flex;flex:none;border-bottom:1px solid var(--border);}
          .hrb-stats span{flex:1;display:flex;flex-direction:column;gap:1px;padding:9px 11px;border-right:1px solid var(--border);min-width:0;}
          .hrb-stats span:last-child{border-right:none;}
          .hrb-stats i{font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);}
          .hrb-stats b{font-size:16px;font-weight:800;letter-spacing:-.01em;}
          .hrb-stats em{font-style:normal;font-size:9.5px;font-weight:700;color:var(--slate);}
          .hrb-clab{padding:8px 13px 6px;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);background:#f5f7fa;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1;}
          @media(max-width:1200px){
            .hrb-you .hrb-body{max-height:222px;overflow-y:auto;}
          }
          /* DAILY MASTERY ROWS. A meter behind the label, the same shape the
             Category Mastery tile on the browse row uses, so the two mastery
             surfaces read as one idea. The fill is a child rather than a
             background gradient so a row can carry its category colour on the
             dot without the meter having to know about it. */
          .hrb-mrow{position:relative;display:flex;align-items:center;gap:8px;padding:8px 13px;
            border-bottom:1px solid var(--border);text-decoration:none;overflow:hidden;}
          .hrb-mrow:last-child{border-bottom:none;}
          .hrb-mrow:hover{background:var(--surface);}
          .hrb-mfill{position:absolute;left:0;top:0;bottom:0;background:#e3ecfc;pointer-events:none;}
          .hrb-mdot{position:relative;width:7px;height:7px;border-radius:2px;flex:none;}
          .hrb-mnm{position:relative;flex:1;min-width:0;font-size:12.5px;font-weight:700;color:var(--ink);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .hrb-mp{position:relative;flex:none;font-size:11.5px;font-weight:800;color:#4a4f5c;font-variant-numeric:tabular-nums;}
          .hrb-duel{flex:none;}
          @media(min-width:1201px){
            .hrb-you .hrb-body{flex:1 1 auto;}
          }
          @media(min-width:1201px){
            .hr-board{flex:1 1 auto;}
            .hrb-pane{flex:1 1 auto;}
            .hrb-pane .hrb-body{flex:1 1 auto;}
          }
        ` }} />
        <section className="hr-panel hr-board">
          <div className="hr-ph">
            <span className="hr-pi"><CrownIcon /></span>
            <h2>The Loft</h2>
            <span className="hr-chip">TODAY</span>
          </div>
          <div className="hrb-tabs" role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={bTab === k}
                className={bTab === k ? 'on' : undefined} onClick={() => setBTab(k)}>{label}</button>
            ))}
          </div>

          {bTab === 'lb' ? (
            <>
              <div className="hrb-subs" role="tablist">
                {SUBS.map(([k, label]) => (
                  <button key={k} type="button" role="tab" aria-selected={sec === k}
                    className={sec === k ? 'on' : undefined} onClick={() => setBSec(k)}>{label}</button>
                ))}
              </div>
              <div className="hrb-pane">
                {sec === 'comm' ? bRows(
                  communityRows,
                  showContest ? ((v) => formatScore(v)) : ((v) => '+' + num(v)),
                  showContest ? 'score' : 'brought in',
                  showContest ? 'Contest leader' : 'Top community member',
                  showContest ? COPY.prizeLine : 'New players brought in, last 90 days',
                  showContest ? '/quizzes/contest' : '/quizzes/community',
                  showContest ? 'Board and rules' : 'Full leaderboard') : null}
                {sec === 'today' ? bRows(dailyRows, (v) => v, 'points', "Today's leader", 'Combined daily games score', '/quizzes/hub?tab=daily', 'Full daily board') : null}
                {sec === 'm30' ? bRows(xp30, num, 'IQ pts', 'Top of the month', 'IQ points earned in 30 days', '/quizzes/hub?tab=player', 'Monthly board') : null}
                {sec === 'all' ? bRows(xpAll.length ? xpAll : xp30, num, 'IQ pts', 'Top player, all time', 'Lifetime IQ points', '/quizzes/hub?tab=player', 'All time board') : null}
                {sec === 'cats' ? (
                  <>
                    <div className="hr-scroll hrb-body">
                      {catLeaders.map((row) => <CatSlip key={row.name} row={row} />)}
                      {!catLeaders.length ? <div className="hr-none" style={{ padding: '10px 13px' }}>No categories on the board yet today.</div> : null}
                    </div>
                    <div className="hr-foot">
                      <span className="hr-exp" style={{ opacity: 0 }} aria-hidden="true">&middot;</span>
                      <Link href="/quizzes/hub?tab=daily" className="hr-link">Daily boards &rarr;</Link>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}

          {bTab === 'live' ? (
            <div className="hrb-pane">
              <div className="hr-lslab lite">
                <div className="hr-lstxt">
                  <div className="hr-lseye">Live &middot; today</div>
                  <div className="hr-lsnm">{num(playsToday)} {playsToday === 1 ? 'play' : 'plays'}</div>
                  <div className="hr-lssub">every puzzle and quiz</div>
                </div>
                <div className="hr-lspair">
                  <span>{num(playersToday)}<i>{playersToday === 1 ? 'player' : 'players'}</i></span>
                  <span>{timeToday}<i>played</i></span>
                </div>
              </div>
              <div className="hr-scroll hrb-body">
                {(lastPlayed || []).map((f, i) => {
                  const pct = Math.round((f.total ? f.score / f.total : 0) * 100);
                  const cat = catFor ? catFor(f.quizId) : null;
                  return (
                    <Link key={`${f.quizId}-${i}`} href={hrefFor ? hrefFor(f.quizId) : '#'} className="hr-res rule">
                      <i className="hr-rl" style={{ background: ringTone(pct) }} aria-hidden="true" />
                      <span className="hr-mid">
                        <span className="hr-t">
                          <span className="hr-ttl">{titleFor ? titleFor(f.quizId) : f.quizId}</span>
                          {f.dayCount > 0 ? <span className="hr-x">(x{f.dayCount})</span> : null}
                          {cat ? <span className="hr-cat" style={{ background: cat.tint, color: cat.color }}>{cat.label}</span> : null}
                        </span>
                        <span className="hr-s">
                          <b className="hr-res-sc">{f.score}/{f.total}</b>
                          {typeof f.pct === 'number' ? ' \u00b7 beat ' + f.pct + '%' : ''}{f.when ? ' \u00b7 ' + f.when : ''}
                        </span>
                      </span>
                      <span className="hr-pc">{pct}%</span>
                    </Link>
                  );
                })}
                {!(lastPlayed || []).length ? <div className="hr-none" style={{ padding: '10px 13px' }}>No recent plays yet.</div> : null}
              </div>
              <div className="hr-foot">
                <button type="button" className="hr-exp" onClick={onAllLive}>All activity</button>
                <Link href="/quizzes/hub?tab=player" className="hr-link">Stat hub &rarr;</Link>
              </div>
            </div>
          ) : null}

          {bTab === 'you' ? (
            <div className="hrb-pane hrb-you">
              <div className={`hr-lslab${streak > 0 ? ' lite' : ''}`}>
                <div className="hr-lstxt">
                  <div className="hr-lseye">Days in a row</div>
                  <div className="hr-lsnm">{streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'}` : 'Not started'}</div>
                  <div className="hr-lssub">
                    {streak <= 0
                      ? 'Finish any daily today and it begins'
                      : (playedToday ? 'Today is in. Back tomorrow to extend it.' : 'Finish any daily today to keep it')}
                  </div>
                </div>
              </div>
              {me && me.found ? (
                <div className="hrb-stats">
                  {/* These are the fields me.activity actually carries
                      (correct, played, completed, accuracy) and the rank the
                      player bar itself reads. There is no activity.xp, so an IQ
                      figure here would have rendered a confident zero. */}
                  <span><i>Rank</i><b>{((me.ranks && me.ranks.xp) || me.rank) ? '#' + num((me.ranks && me.ranks.xp) || me.rank) : '—'}</b>{me.totalPlayers ? <em>of {num(me.totalPlayers)}</em> : null}</span>
                  <span><i>Played</i><b>{num((me.activity && me.activity.played) || 0)}</b></span>
                  <span><i>Completed</i><b>{num((me.activity && me.activity.completed) || 0)}</b></span>
                </div>
              ) : null}
              {youSubs.length > 1 ? (
                <div className="hrb-subs" role="tablist">
                  {youSubs.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={youSec === k}
                      className={youSec === k ? 'on' : undefined} onClick={() => setBYou(k)}>{label}</button>
                  ))}
                </div>
              ) : null}
              {youSec === 'daily' && dailyMastery.length ? (
                <div className="hr-scroll hrb-body">
                  <div className="hrb-clab">Your share of each daily archive</div>
                  {dailyMastery.map((r) => (
                    <Link key={r.key} href={r.href || `/${r.key}`} className="hrb-mrow">
                      <span className="hrb-mfill" style={{ width: `${Math.max(0, Math.min(100, r.acc || 0))}%` }} aria-hidden="true" />
                      <span className="hrb-mdot" style={{ background: catBlue(r.cat) }} aria-hidden="true" />
                      <span className="hrb-mnm">{r.label}</span>
                      <span className="hrb-mp">{r.acc || 0}%</span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {youSec === 'quiz' && myCats.length ? (
                <div className="hr-scroll hrb-body">
                  <div className="hrb-clab">Your rank by category</div>
                  {myCats.map((c) => (
                    <div key={c.key} className="hr-cl" style={{ '--clr': catBlue(c.key) }}>
                      <span className="hr-cltxt">
                        <span className="hr-clcat">{c.name}</span>
                        <span className="hr-clnm">{c.rank ? '#' + num(c.rank) + (c.total ? ' of ' + num(c.total) : '') : 'Unranked'}</span>
                      </span>
                      <span className="hr-clr">
                        <span className="hr-clg">{num(c.completed)} done</span>
                        <span className="hr-clv">{num(c.matches)}<i>played</i></span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="hr-foot">
                <span className="hr-exp" style={{ opacity: 0 }} aria-hidden="true">&middot;</span>
                <Link href="/quizzes/hub?tab=player" className="hr-link">Your stat hub &rarr;</Link>
              </div>
            </div>
          ) : null}
          <div className="hrb-foot">
            {qotd ? (
              <a className="hrb-qotd" href={`/quiz/${qotd.id}`}
                style={qotd.hero ? { backgroundImage: `url(${qotd.hero})`, backgroundPosition: qotd.pos || 'center' } : undefined}>
                <span className="hrb-qe">{qotd.eyebrow}</span>
                <span className="hrb-qt">{qotd.title}</span>
              </a>
            ) : null}
            <Link href={rival ? duelHref : '/duel/new'} className="hrb-duel">
              <span className="hrb-dtx">
                <span className="hrb-de">{rival ? (rival.behind ? 'Ranked one behind you' : 'Ranked one ahead of you') : 'Head to head'}</span>
                <span className="hrb-dn">{rival ? rival.username : 'Start a duel'}</span>
              </span>
              <span className="hrb-dgo">Challenge your rival</span>
            </Link>
          </div>
        </section>
      </>
    );
  }

  if (side === 'left') {
    return (
      <>
        {CSS}
        {/* ONE BOARD, THREE FACES (owner, 2026-08-14). The rail used to carry
            three separate leaderboard panels, each leading with a hero slab and
            then two runners-up, so nine names competed for the eye and none of
            them won. It is one panel now with a face switcher, showing one
            board at a time five rows deep instead of three boards three rows
            deep. Same content, a third of the noise.

            The contest countdown moved OUT of the header and into the face's
            own band. The header already carries a title and the switcher pill,
            and a third element at 282px is what has previously eaten this
            rail's titles down to an ellipsis.

            The first face still SWAPS between the contest board and the rolling
            90-day community board on its own the moment the contest ends
            (owner, 2026-08-05), and for the same reason as before: both answer
            "who is bringing people in", and side by side they would show two
            different rankings of the same thing with no way to tell which one
            counted. */}
        <FlipPanel
          icon={<CrownIcon />}
          title="Leaderboard"
          open={open.lb}
          onToggle={() => toggle('lb')}
          faces={[
            {
              label: showContest ? 'Contest' : 'Community',
              // The countdown rides in the EYEBROW as well as the band,
              // because the band is the thing a phone hides once the hero slab
              // is showing (.hr-panel:has(.hr-hero) .hr-sub), and a contest
              // deadline that only exists on desktop is worse than no chip.
              // Short form here, long form in the band.
              eyebrow: showContest
                ? `Contest leader${contestDays ? ` · ${contestDays}d left` : ''}`
                : 'Top community member',
              unit: showContest ? 'score' : 'brought in',
              sub: showContest
                ? `${COPY.prizeLine}${contestDays ? ` · ${contestDays} days left` : ''}`
                : 'New players brought in, last 90 days',
              heroSub: showContest ? COPY.prizeLine : 'New players brought in, last 90 days',
              rows: communityRows,
              fmt: showContest ? (v) => formatScore(v) : (v) => `+${num(v)}`,
              hrefFor: (n) => `/player/${encodeURIComponent(n)}`,
              href: showContest ? '/quizzes/contest' : '/quizzes/community',
              footLabel: showContest ? 'Board and rules' : 'Full leaderboard',
              // A board too short to expand offers the thing this board is
              // actually about instead of an invisible spacer.
              emptyAction: onCredit ? { label: 'Get credit', onClick: onCredit } : null,
            },
            {
              label: 'Today',
              eyebrow: "Today's leader",
              unit: 'points',
              tone: 'lite',
              // The combined daily-games score (best-N total), NOT games
              // played: "29/42" read as a fraction of the slate and told you
              // nothing about how well anyone did (owner, 2026-08-03).
              sub: 'Combined daily games score',
              rows: dailyRows,
              fmt: (v) => (Math.round((v || 0) * 10) / 10).toLocaleString(),
              hrefFor: (n) => `/player/${encodeURIComponent(n)}`,
              href: '/quizzes/hub?tab=daily',
            },
            {
              label: 'All time',
              eyebrow: 'Top player, all time',
              unit: 'IQ pts',
              sub: 'Lifetime IQ points',
              rows: xpAll.length ? xpAll : xp30,
              fmt: num,
              hrefFor: (n) => `/player/${encodeURIComponent(n)}`,
              href: '/quizzes/hub?tab=player',
            },
          ]}
        />

        {/* Phone-only share bar, directly under the board it explains. The
            headline names the prize only while the contest is actually running,
            so the offer can never outlive it: contestLive is resolved after
            mount for the same hydration reason the contest board is. */}
        <button type="button" className="hr-share" onClick={() => { if (!notifyShareCredit('')) { if (onCredit) onCredit(); } }}>
          <span className="hr-shtxt">
            <b>{contestLive ? `Share Mind Loft for ${CONTEST.prizeLabel}*` : 'Share Mind Loft for credit'}</b>
            <span>{contestLive ? `${COPY.prizeLine}. Ends ${CONTEST.endLabel}.` : 'Anyone who plays through your link credits you.'}</span>
          </span>
          <span className="hr-sharr" aria-hidden="true">&rsaquo;</span>
        </button>

        {/* CATEGORY LEADERS, moved here off the Loft's second face (owner,
            2026-08-14). They are a leaderboard, so they belong in the rail that
            holds the leaderboards. Off a flip face they no longer wait their
            turn either: all nine are simply listed and the panel scrolls. The
            rotation the old face ran (the list shifting by one each turn so
            every category got a spell at the top) went with the flip, since
            nothing here is hidden behind a turn any more. */}
        <section className="hr-panel hr-flex hr-cats">
          <div className="hr-ph">
            <span className="hr-pi"><StarIcon /></span>
            <h2>Category leaders</h2>
            <span className="hr-chip">TODAY</span>
          </div>
          <div
            className="hr-scroll hr-flex hr-clbody"
            ref={catFit.boxRef}
            style={{ '--rowpad': `${catFit.pad}px` }}
          >
            {catLeaders.slice(0, catFit.n).map((row) => <CatSlip key={row.name} row={row} />)}
            {!catLeaders.length ? <div className="hr-none" style={{ padding: '10px 13px' }}>No categories on the board yet today.</div> : null}
          </div>
          <div className="hr-foot">
            <span className="hr-exp" style={{ opacity: 0 }} aria-hidden="true">·</span>
            <Link href="/quizzes/hub?tab=daily" className="hr-link">Daily boards &rarr;</Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {CSS}
      {/* THE NAME "THE LOFT" IS GONE (owner, 2026-08-14), and so is the second
          face: this panel is the live feed and now says so. Its category
          leaders moved to the left rail with the other boards. The header keeps
          its shape, icon and title, with the day's player count taking the slot
          the face switcher used to hold, so the row still reads as a header
          rather than a bare label. */}
      <section className="hr-panel hr-flex">
        <div className="hr-ph">
          <span className="hr-pi"><PulseIcon /></span>
          <h2>Live feed</h2>
          {playersToday ? <span className="hr-chip">{num(playersToday)} PLAYING</span> : null}
        </div>
        {/* THE SLAB IS DELIBERATELY ANONYMOUS (owner, 2026-08-10). It reads the
            day's TOTALS, plays and time played, never the newest player's name
            or score: the rows below already carry results without attribution,
            and promoting one person's run into a headline is a different thing
            from a live feed. */}
        <div className="hr-lslab lite">
          <div className="hr-lstxt">
            <div className="hr-lseye">Live &middot; today</div>
            <div className="hr-lsnm">{num(playsToday)} {playsToday === 1 ? 'play' : 'plays'}</div>
            <div className="hr-lssub">every puzzle and quiz</div>
          </div>
          {/* TWO SMALL FIGURES IN ONE STACKED CELL, not two 20px .hr-lsval
              cells (owner, 2026-08-12). The play count is already this slab's
              hero number, so a second and third at the same weight both
              competed with it and ate the rail. */}
          <div className="hr-lspair">
            <span>{num(playersToday)}<i>{playersToday === 1 ? 'player' : 'players'}</i></span>
            <span>{timeToday}<i>played</i></span>
          </div>
        </div>
        <div
          className="hr-scroll hr-flex hr-actbody"
          ref={feedFit.boxRef}
          style={{ '--rowpad': `${feedFit.pad}px` }}
        >
          {(lastPlayed || []).slice(0, feedFit.n).map((f, i) => {
            const frac = f.total ? f.score / f.total : 0;
            const pct = Math.round(frac * 100);
            const cat = catFor ? catFor(f.quizId) : null;
            return (
              /* The 32px conic ring became the 4px left rule the rest of the
                 page uses: fourteen of them stacked down a 300px rail were
                 the busiest object on the homepage, and the percentage was
                 always the real readout. The rule keeps the depth cue (ramp
                 deep for a strong run, pale for a weak one) and the number
                 moves out to the right edge as plain text. */
              <Link key={`${f.quizId}-${i}`} data-fitrow="" href={hrefFor ? hrefFor(f.quizId) : '#'} className="hr-res rule">
                <i className="hr-rl" style={{ background: ringTone(pct) }} aria-hidden="true" />
                <span className="hr-mid">
                  <span className="hr-t">
                    <span className="hr-ttl">{titleFor ? titleFor(f.quizId) : f.quizId}</span>
                    {f.dayCount > 0 ? <span className="hr-x" title={`${f.dayCount} play${f.dayCount === 1 ? '' : 's'} today`}>(x{f.dayCount})</span> : null}
                    {cat ? <span className="hr-cat" style={{ background: cat.tint, color: cat.color }}>{cat.label}</span> : null}
                  </span>
                  <span className="hr-s">
                    <b className="hr-res-sc">{f.score}/{f.total}</b>
                    {typeof f.pct === 'number' ? ` · beat ${f.pct}%` : ''}{f.when ? ` · ${f.when}` : ''}
                  </span>
                </span>
                <span className="hr-pc">{pct}%</span>
              </Link>
            );
          })}
          {!(lastPlayed || []).length ? <div className="hr-none" style={{ padding: '10px 13px' }}>No recent plays yet.</div> : null}
        </div>
        <div className="hr-foot">
          <button type="button" className="hr-exp" onClick={onAllLive}>All activity</button>
          <Link href="/quizzes/hub?tab=player" className="hr-link">Stat hub &rarr;</Link>
        </div>
      </section>

      {/* STREAK (owner, 2026-08-14). The site had no streak of its own until
          this shipped: daily-status computed a consecutive-day run PER GAME,
          which is a narrower question, so a player who plays five different
          games across five days read as having none. The route now unions those
          day sets and this tile carries the result, with the single game most
          worth protecting on the right edge.

          `playedToday` is what decides the sub line, not the streak itself: an
          unbroken run says nothing about whether today is already banked, and
          "keep it going" under a day you have finished is just wrong. */}
      <section className="hr-panel hr-tile">
        <div className="hr-ph">
          <span className="hr-pi"><FlameIcon /></span>
          <h2>Your streak</h2>
          {streak > 0 ? <span className="hr-chip">{playedToday ? 'TODAY BANKED' : 'AT RISK'}</span> : null}
        </div>
        <div className={`hr-lslab${streak > 0 ? ' lite' : ''}`}>
          <div className="hr-lstxt">
            <div className="hr-lseye">Days in a row</div>
            <div className="hr-lsnm">{streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'}` : 'Not started'}</div>
            <div className="hr-lssub">
              {streak <= 0
                ? 'Finish any daily today and it begins'
                : (playedToday ? 'Today is in. Back tomorrow to extend it.' : 'Finish any daily today to keep it')}
            </div>
          </div>
          {/* NO SECOND FIGURE HERE. The longest single-game run was in this
              slot and read "14 STREAK", because the game holding the longest
              run is the one CALLED Streak, and at 8.5px in a 60px cell there
              is no label that disambiguates a game name from the word for what
              the tile measures. daily-status still returns streakGame and
              streakGameDays; they want a surface with room for a caption. */}
        </div>
      </section>

      {/* CHALLENGE (owner, 2026-08-14). Prefilled with the player immediately
          AHEAD of you on today's combined daily board, or immediately behind
          when you are already first, because a duel is only worth offering
          against someone you are actually racing.

          The rival comes off /api/quiz/daily-combined rather than being picked
          out of `dailyRows` here: that board is the top 10, so a reader sitting
          outside it has no neighbour anywhere in the payload the rail holds.
          The link hands the composer an opponent already chosen, keyed on their
          browser anon, which is the only handle /duel/new accepts.

          With no rival (signed out, or nobody else on the board yet) the card
          becomes the open composer. That fallback is load-bearing now that
          Featured is gone: this is the only duel entry left on the home page. */}
      <section className="hr-panel hr-tile">
        <div className="hr-ph">
          <span className="hr-pi"><SwordsIcon /></span>
          <h2>Challenge</h2>
          <span className="hr-chip">HEAD TO HEAD</span>
        </div>
        {rival ? (
          <Link href={duelHref} className="hr-fcard t0">
            <span className="hr-fctxt">
              <span className="hr-fceye">{rival.behind ? 'Right behind you' : 'Next one ahead'}</span>
              <span className="hr-fcnm">{rival.username}</span>
              <span className="hr-fcsub">
                {rival.rank ? `#${rival.rank} today` : 'On the board today'}
                {gapLine ? <span className="hr-fcdot">&middot;</span> : null}
                {gapLine || null}
              </span>
            </span>
            <span className="hr-fcgo">Duel</span>
          </Link>
        ) : (
          <Link href="/duel/new" className="hr-fcard t0">
            <span className="hr-fctxt">
              <span className="hr-fceye">Head to head</span>
              <span className="hr-fcnm">Start a duel</span>
              <span className="hr-fcsub">Pick anyone and a quiz, one round each</span>
            </span>
            <span className="hr-fcgo">Open</span>
          </Link>
        )}
      </section>
    </>
  );
}

/* One category leader, as a uniform row: category, leader, points. It was a
   full hero slab until 2026-08-14, which was the right object for the rotating
   face it used to live on and the wrong one for a list of nine (see the CSS).

   The category takes its colour from lib/home-blues, the same value its chip
   wears on the slate, and it is the only thing on the row that is not ink or
   grey. `tone` is gone with the alternating grounds, so nothing here depends
   on the row's position in the list.

   THE GAMES COUNT CAME BACK, in the right column rather than as the third
   line it used to be (owner, 2026-08-14). "8 of 15" is how much of the
   category the leader actually played, and stacked over the points it costs no
   height. The plays-today count did NOT come back: it was the rest of that
   line and the least useful part of it, and the board this links to has it.

   A category with no board yet renders the same row reading "Nobody yet"
   rather than being skipped. */
function CatSlip({ row }) {
  if (!row) return null;
  const led = row.leader;
  return (
    <div className={`hr-cl${led ? '' : ' open'}`} data-fitrow="" style={{ '--clr': catBlue(row.name) }}>
      <span className="hr-cltxt">
        <span className="hr-clcat">{row.name}</span>
        <span className="hr-clnm">{led ? led.name : 'Nobody yet'}</span>
      </span>
      <span className="hr-clr">
        {/* How much of the category the leader actually played: "8 of 15".
            This was a whole third line on the old slab and read as clutter
            there; on the row's own right column it costs no height at all. */}
        <span className="hr-clg">{led ? `${led.n} of ${row.games}` : `${row.games} game${row.games === 1 ? '' : 's'}`}</span>
        {led ? <span className="hr-clv">{led.pts}<i>pts</i></span> : null}
      </span>
    </div>
  );
}

/* Inline icons: the rails only need four, and importing four more lucide
   components onto a page that already ships ~30 of them is not worth the
   bytes. */
function CrownIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M3 17h18M4 17 3 7l5 4 4-7 4 7 5-4-1 10" /></svg>; }
function FlameIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 2c1 4-2 5.2-2 8a2 2 0 0 0 4 0c2 2 3 4 3 6a5 5 0 0 1-10 0C7 12 11 10 12 2z" /></svg>; }
function StarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.3 6.5 19.2l1.2-6.1L3.2 8.9l6.1-.8z" /></svg>; }
function SwordsIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 14.5 21 21M18 3h3v3l-9 9-3-3zM6 3H3v3l9 9 3-3M9.5 14.5 3 21" /></svg>; }
function PulseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>; }
