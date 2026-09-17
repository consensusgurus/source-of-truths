'use client';
import { useMemo, useEffect, useRef, useState } from 'react';
import { guestHandleFromAnon } from '@/lib/quiz-xp';
import Link from 'next/link';
import SourcesPopover from '../SourcesPopover';
import { getAllSources } from '@/lib/sources';
import { T } from '@/lib/theme';
import MindLoftMark from '../MindLoftMark';
import useDayStats from '../useDayStats';
import { CONTEST } from '@/lib/contest';

// Full-bleed command-bar header for the quizzes HOME page only (individual
// quiz pages, the Stat Hub, and the lists site keep SiteHeader). One 56px
// blue bar spanning the whole viewport: brand, welcome + rank chip,
// Lists/Quizzes nav, Stat Hub CTA. The search box moved OUT of this bar on
// 2026-07-29 and now lives in the full-width row below the three-column daily
// section (see QuizHomeClient's .qz-toolrow). Under it runs
// a live ticker tape of recent plays, correct-today leaders, duel results,
// and new quizzes, built from data the page already fetches. Collapse order
// as the window narrows: sources pill -> player stat subline + Stat Hub text
// -> wordmark shortens to SoT and the search icon button appears -> avatar
// circle drops.
const FONT = "'Manrope', system-ui, -apple-system, sans-serif";
const SOURCE_COUNT = getAllSources().length;

function fmtK(n) { return (typeof n === 'number' && n > 999) ? `${(n / 1000).toFixed(1)}k` : (n != null ? n.toLocaleString() : n); }

let __qchLogoSeq = 0;
function Logo({ size = 30 }) {
  return <MindLoftMark size={size} />;
}

// eslint-disable-next-line no-unused-vars -- size default kept at 30

const SearchIcon = ({ c = T.ink }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" style={{ flex: 'none' }} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);

// Per-type ticker icons (play / lead / duel / new / stat).
const TICO = {
  play: <svg width="10" height="10" viewBox="0 0 24 24" fill="#5ad48f" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>,
  lead: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.4" aria-hidden="true"><path d="M3 17h18M4 17 3 7l5 4 4-7 4 7 5-4-1 10" /></svg>,
  duel: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f08a8a" strokeWidth="2.2" aria-hidden="true"><path d="m4 4 16 16M20 4 4 20" /></svg>,
  new: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9dbcf7" strokeWidth="2.4" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  stat: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9dbcf7" strokeWidth="2.4" aria-hidden="true"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>,
  // Community leader (crown), category champion (trophy), achievement (star), streak (flame).
  top: <svg width="11" height="11" viewBox="0 0 24 24" fill={T.gold} aria-hidden="true"><path d="M3 7l3.8 3.4L12 3l5.2 7.4L21 7l-1.7 12H4.7z" /></svg>,
  champ: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.1" aria-hidden="true"><path d="M6 4h12v3.5a6 6 0 0 1-12 0zM6 5H3.5v1.8a3 3 0 0 0 3 3M18 5h2.5v1.8a3 3 0 0 1-3 3M9.5 20h5M12 13.5V20" /></svg>,
  ach: <svg width="11" height="11" viewBox="0 0 24 24" fill="#b79cf2" aria-hidden="true"><path d="M12 2.5l2.7 5.6 6.1.8-4.5 4.2 1.2 6.1L12 16.3 6.5 19.2l1.2-6.1L3.2 8.9l6.1-.8z" /></svg>,
  streak: <svg width="11" height="11" viewBox="0 0 24 24" fill="#f5893e" aria-hidden="true"><path d="M12 2c1 4-2 5.2-2 8a2 2 0 0 0 4 0c2 2 3 4 3 6a5 5 0 0 1-10 0C7 12 11 10 12 2z" /></svg>,
};

function TickSet({ items, hidden }) {
  return (
    <div className="qch-set" aria-hidden={hidden ? 'true' : undefined}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Link href={it.href || '/quizzes'} className="qch-titem" tabIndex={hidden ? -1 : undefined}>
            <span className={`qch-tico qch-tico-${it.type}`}>{TICO[it.type] || TICO.stat}</span>
            {it.segs.map((s, j) => (
              <span key={j} className={s.strong ? 'qch-ts' : s.dim ? 'qch-td' : undefined}>{s.text}</span>
            ))}
          </Link>
          <span className="qch-tdot" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

function focusListSearch() {
  try {
    const el = document.getElementById('qz-main-search');
    if (!el) return;
    // Focus FIRST, synchronously inside the click's gesture stack: iOS/Android
    // only raise the soft keyboard for a focus() that is still part of the user
    // gesture, so deferring it behind a setTimeout silently kills the keyboard.
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {}
}

// The homepage's Quizzes button does not just focus the browse field, it parks
// that whole row at the TOP of the viewport (owner, 2026-08-03), so the quiz
// catalogue starts at the fold rather than sitting mid-screen. scrollIntoView
// with block:'center' cannot express that, hence the explicit scrollTo.
export function jumpToQuizzes() {
  try {
    // TWO search fields exist and they swap at 820px: the tool row's
    // #qz-hero-search on desktop, the browse row's #qz-main-search below it.
    // The hidden one measures as a zero-height box at the top of the document,
    // so targeting it blindly scrolled the row clean off screen. Take whichever
    // is actually laid out.
    const vis = (id) => { const el = document.getElementById(id); return (el && el.offsetParent !== null) ? el : null; };
    const el = vis('qz-hero-search') || vis('qz-main-search')
      || document.getElementById('qz-main-search') || document.getElementById('qz-hero-search');
    if (!el) return;
    // Focus first, synchronously inside the click gesture, or mobile keyboards
    // never open (same reason as focusListSearch above).
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    const box = el.closest('.qz-toolrow') || el.closest('.qz-browserow') || el.closest('.qz-searchwrap') || el;
    // The bar is sticky, so "top of screen" means below it, not under it.
    const bar = document.querySelector('.qchm');
    const off = (bar ? bar.getBoundingClientRect().height : 0) + 8;
    const y = box.getBoundingClientRect().top + window.scrollY - off;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(max, Math.max(0, y)), behavior: 'smooth' });
  } catch (e) {}
}

// THE LEADERBOARDS JUMP LIVES IN THE BAR NOW (owner, 2026-08-25). The welcome
// band under this header carried two jump chips; the band is gone and its
// figures moved up here, so the one jump worth keeping came with them (the Live
// feed chip did not: the feed is beside the boards it links to). Offsetting is
// TodayClient's own recipe, because a bare hash lands the heading UNDER the
// pinned masthead: take the tallest bar whose COMPUTED position is sticky or
// fixed, then add the category jump bar that sticks beneath it.
export function jumpToBoards(e) {
  try {
    const el = document.getElementById('tdy-boards');
    if (!el) return;
    if (e) e.preventDefault();
    let h = 0;
    for (const sel of ['.qch-bar', '.qchm-r1', '.qchm']) {
      const b = document.querySelector(sel);
      if (!b) continue;
      let pos = '';
      try { pos = getComputedStyle(b).position; } catch (x) {}
      if (pos !== 'sticky' && pos !== 'fixed') continue;
      h = Math.max(h, b.getBoundingClientRect().height);
    }
    const jb = document.querySelector('.tdy-jb');
    if (jb) {
      try { if (getComputedStyle(jb).position === 'sticky') h += jb.getBoundingClientRect().height; } catch (x) {}
    }
    const y = el.getBoundingClientRect().top + window.scrollY - (h + 14);
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(max, Math.max(0, y)), behavior: 'smooth' });
    try { window.history.replaceState(null, '', '#tdy-boards'); } catch (x) {}
  } catch (x) {}
}

export default function QuizCommandHeader({ me, onSignup, ticker = [], variant = 'default', onCredit }) {
  const found = !!(me && me.found);
  // A signed-out visitor still gets a name: the same stable Guest-XXXX handle
  // the leaderboards already show them under, derived from this browser's anon
  // id. Resolved after mount because it reads localStorage.
  const [guestName, setGuestName] = useState('');
  useEffect(() => {
    if (found) return;
    try {
      const a = localStorage.getItem('sot_quiz_anon');
      if (a) setGuestName(guestHandleFromAnon(a));
    } catch (e) {}
  }, [found]);
  const signed = !!(found && me.signed);
  const rank = found ? ((me.ranks && me.ranks.xp) || me.rank) : null;
  // Lifetime IQ Points. A running total, so it renders bare: the "+" prefix is
  // reserved for amounts EARNED (the Your day strip, the end card).
  const xp = (found && typeof me.xp === 'number') ? me.xp : null;
  const totalPlayers = (found && typeof me.totalPlayers === 'number' && me.totalPlayers > 0) ? me.totalPlayers : null;
  // "Your day" moved off the daily board's cap and into this bar (owner,
  // 2026-08-03). Each figure is a COLUMN: the actual on the top line, the day's
  // figure on the bottom line with the word "today" spelled out, so a delta can
  // never be misread as a total. A climb toward #1 is a POSITIVE rankChange even
  // though the rank number falls, so an up arrow reads green. A flat or unknown
  // move says "no change today" rather than blanking the line, which would leave
  // the column short and knock the row out of alignment.
  const day = useDayStats();
  const moved = (day.rankChange != null && day.rankChange !== 0);
  const moveTxt = moved
    ? (day.rankChange > 0 ? `\u25b2${day.rankChange} today` : `\u25bc${Math.abs(day.rankChange)} today`)
    : 'no change today';
  const moveCls = !moved ? '' : (day.rankChange > 0 ? 'qch-tup' : 'qch-tdown');
  const dayXp = (typeof day.todayXp === 'number' && day.todayXp > 0) ? day.todayXp : null;
  // Today's standing among everyone who has banked IQ today (owner, 2026-08-08).
  // A different figure from the lifetime Rank column beside it: that one moves in
  // months, this one is the day's race, and it is the reason to come back tonight.
  const dayRank = (typeof day.dayRank === 'number' && day.dayRank > 0) ? day.dayRank : null;
  const dayField = (typeof day.dayField === 'number' && day.dayField > 0) ? day.dayField : null;
  // COMMUNITY RANK (owner, 2026-08-25): the player's place on the 90-day
  // community board at /quizzes/community, out of every REGISTERED user. That
  // board ranks by referrals, so most of the roster has brought nobody in and
  // the whole zero tail SHARES one rank rather than being ordered arbitrarily
  // (see the server note in api/quiz/daily-status). The cell links to the board
  // it reports, which is the one thing a reader wants next from a standing.
  const commRank = (typeof day.communityRank === 'number' && day.communityRank > 0) ? day.communityRank : null;
  const commTotal = (typeof day.communityTotal === 'number' && day.communityTotal > 0) ? day.communityTotal : null;
  const commCredits = (typeof day.communityCredits === 'number' && day.communityCredits >= 0) ? day.communityCredits : null;
  // Lifetime "N completed / X% of the catalogue" was dropped on 2026-08-03: it
  // measures the QUIZ catalogue, which is not what this bar is about now that
  // the day figures live here. The third column counts today's dailies instead.
  // Duplicate short item lists so the looping track never shows a hole.
  const items = ticker.length ? (ticker.length < 8 ? [...ticker, ...ticker] : ticker) : [];
  const dur = `${Math.min(96, Math.max(36, items.length * 5))}s`;
  // Progressive collapse on mobile: a long player name gets room by dropping
  // the brand logo first, then the search icon. CSS cannot see truncation, so
  // measure it (scrollWidth > clientWidth) and re-run on every resize. Always
  // clear the classes before measuring so the elements come back when the name
  // shortens or the viewport grows.
  const barRef = useRef(null);
  const nmRef = useRef(null);
  const logoRef = useRef(null);
  const btnRef = useRef(null);
  const meName = me && me.name;
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const fit = () => {
      const logo = logoRef.current, btn = btnRef.current, nm = nmRef.current;
      if (logo) logo.classList.remove('qch-hidefit');
      if (btn) btn.classList.remove('qch-hidefit');
      if (!nm || window.innerWidth > 820) return;
      const cut = () => nm.scrollWidth > nm.clientWidth + 1;
      if (!cut()) return;
      if (logo) { logo.classList.add('qch-hidefit'); if (!cut()) return; }
      if (btn) btn.classList.add('qch-hidefit');
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(bar);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [meName, found]);
  // ── Homepage bar (owner-approved scoreboard redesign, 2026-08-03) ──
  // Two rows on a navy ground: identity + nav up top, the day's figures and the
  // two actions beneath. HOMEPAGE ONLY, via variant="home": this component is
  // shared with /quizzes and the daily pages, which keep the white bar until
  // the owner says otherwise. It is a separate branch rather than a restyle of
  // the bar below so none of that bar's tuned breakpoints move.
  // Anything that wants to lock UNDER this bar needs its height, and the bar is
  // two rows whose height moves with the breakpoint, so it publishes it as a
  // custom property rather than every consumer hardcoding a guess.
  useEffect(() => {
    if (variant !== 'home' || typeof document === 'undefined') return undefined;
    const el = document.querySelector('.qchm');
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const row1 = el.querySelector('.qchm-r1');
    const set = () => {
      // What this publishes is the LOCKED height, not the bar's total. In the
      // landscape-touch layout (see the media block below) .qchm is
      // display:contents and only row one sticks, so .qchm has no box of its
      // own and its rect measures 0: row one's height is the answer there.
      const h = Math.round(el.getBoundingClientRect().height)
        || (row1 ? Math.round(row1.getBoundingClientRect().height) : 0);
      document.documentElement.style.setProperty('--ml-headh', `${h}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    // ...and row one directly, since a display:contents element generates no box
    // for the observer to watch.
    if (row1) ro.observe(row1);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty('--ml-headh'); };
  }, [variant, found]);

  if (variant === 'home' || variant === 'inner') {
    // `inner` is the same two-row navy bar on every quiz surface that used to
    // carry the white 56px bar (quiz boards, Stat Hub, Duel, Challenge,
    // Business News, Community, player profiles). Two deliberate differences
    // from `home`, both below: it sits in normal flow rather than sticking, and
    // its nav links out instead of scrolling the page it is on.
    const inner = variant === 'inner';
    // THE HEADER CARRIES THE WHOLE PLAYER LINE AGAIN (owner, 2026-08-25).
    // For two days the home stripped Played and Daily rank out of this strip
    // because a welcome band 60px below said both, bigger and warmer. The band
    // is gone now and its figures came up here, so the home renders the same
    // five cells every other surface (`inner`: quiz boards, Stat Hub, Duel,
    // profiles) always has: Player, Rank, IQ points, Played, Daily rank.
    //
    // `home` still means something: only the homepage has boards further down
    // the page, so only the homepage turns the Daily rank cell into a jump and
    // adds the Leaderboards chip to the actions.
    const home = !inner;
    // `jump` scrolls this page to the boards below; `href` navigates to another
    // page. Both render the cell as a link and share .qchm-jump's affordance.
    const stat = (label, value, sub, subCls, cellCls, jump, href) => {
      const body = (
        <>
          <div className="qchm-k">{label}</div>
          <div className="qchm-v">{value}</div>
          <div className={`qchm-ch${subCls ? ` ${subCls}` : ''}`}>{sub}</div>
        </>
      );
      const cls = `qchm-cell${cellCls ? ` ${cellCls}` : ''}${(jump || href) ? ' qchm-jump' : ''}`;
      if (href) return <Link className={cls} href={href}>{body}</Link>;
      return jump
        ? <a className={cls} href="#tdy-boards" onClick={jumpToBoards}>{body}</a>
        : <div className={cls}>{body}</div>;
    };
    return (
      <div className={inner ? 'qchm qchm-inner' : 'qchm'}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
          /* Locked to the top (owner, 2026-08-03). sticky rather than fixed so it
             keeps its own space in flow and needs no spacer element the way the
             white bar below does. */
          .qchm{font-family:${FONT};position:sticky;top:0;z-index:90;}
          /* Inner surfaces sit in normal FLOW (no sticking: see the note in the
             component), but stay position:relative rather than static so .qchm's
             z-index still applies. Several of these pages render <Grain /> as a
             fixed z-index:1 noise overlay, and a static header paints beneath it,
             so the bar would have come out under a multiply-blended grain wash. */
          .qchm-inner{position:relative;}
          .qchm-r1{background:var(--accent);color:var(--white);}
          .qchm-in{max-width:1560px;margin:0 auto;padding:12px clamp(16px,2.5vw,34px);display:flex;align-items:center;gap:16px;}
          .qchm-brand{display:flex;align-items:center;gap:9px;text-decoration:none;flex:none;}
          .qchm-wm{font-size:18px;font-weight:800;letter-spacing:-.025em;color:var(--white);line-height:1;white-space:nowrap;}
          .qchm-wm em{font-style:normal;color:#7dd3fc;}
          .qchm-tag{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--blue-200);border-left:1px solid #1e2e5a;padding-left:13px;font-weight:800;white-space:nowrap;}
          .qchm-nav{margin-left:auto;display:flex;gap:20px;align-items:center;}
          /* THE TOP ROW CARRIES NO BOXES (owner, 2026-08-26). Three
             outlined #2f4d85 rectangles at 7px radius were the oldest-looking
             object on the site, and they competed with the gold CTA one row
             below for the same attention while pointing at pages rather than
             actions. The nav is TYPE now: the section you are in is white with
             a 2px gold rule under it, and the other two are the same type at
             74% white, which is 6.8:1 on the accent ground. Nothing about the
             row's height, order or hit area moves. */
          .qchm-nav a,.qchm-nav button{position:relative;color:rgba(255,255,255,.74);background:none;border:none;text-decoration:none;font-family:inherit;font-size:13px;font-weight:700;letter-spacing:normal;text-transform:none;padding:7px 1px;border-radius:0;display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap;transition:color .14s;}
          .qchm-nav a:hover,.qchm-nav button:hover{background:none;color:var(--white);}
          .qchm-nav a.on{background:none;color:var(--white);font-weight:800;}
          .qchm-nav a.on::after{content:'';position:absolute;left:0;right:0;bottom:1px;height:2px;border-radius:2px;background:var(--gold);}
          .qchm-user{display:none;margin-left:auto;align-items:center;gap:8px;}
          /* THE NAME, AND ONLY THE NAME (owner). A loft page hides the stat row
             below, so the header is where a signed-in player is named; the rank
             figures that briefly sat here were noise. The name reads to the LEFT
             of the nav with the whole group right-aligned, which takes an
             explicit order because the name comes AFTER the nav in the DOM and
             both used margin-left:auto, so the nav was winning the space. An
             anonymous player gets the Sign Up button here instead, unchanged. */
          .dch-loft .qchm-user{display:flex;order:3;margin-left:auto;}
          .dch-loft .qchm-nav{order:4;margin-left:12px;}
          .qchm-user .nm{font-size:13.5px;font-weight:800;color:var(--white);line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:44vw;}
          .qchm-pic{width:30px;height:30px;border-radius:50%;background:var(--blue);color:var(--white);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex:none;}
          .qchm-r2{background:#101d44;color:var(--white);border-bottom:3px solid var(--blue);}
          /* ONE SHAPE FOR EVERY CELL (owner, 2026-08-25). The row used to size
             each box to its own contents and set them flush left, so the column
             starts were ragged and a wide value (the IQ total) crowded its
             neighbours. Every cell is now an equal share of the row with its
             label, value and sub-line centred, which is what the phone has
             always done, so the two widths finally read as the same object.
             The gap goes to 0 on this row: with equal cells the 1px dividers
             ARE the spacing, and a 16px gap on top of the cell padding pushed
             each divider off the true midpoint between two values. */
          .qchm-r2 .qchm-in{gap:0;}
          .qchm-cell{flex:1;min-width:0;text-align:center;padding:0 clamp(8px,1.2vw,16px);border-right:1px solid #192b59;white-space:nowrap;}
          /* :nth-last-child(2) rather than :last-of-type: the actions block is
             always the last child, so the cell before it is the last cell. A
             jump cell renders as an <a> and every other as a <div>, and
             :last-of-type counts per element type, so it would have stranded a
             divider on the last <div> in the row. */
          .qchm-cell:nth-last-child(2){border-right:none;}
          .qchm-jump{text-decoration:none;color:inherit;cursor:pointer;display:block;}
          .qchm-jump:hover .qchm-v{color:var(--blue-200);}
          .qchm-k,.qchm-v,.qchm-ch{overflow:hidden;text-overflow:ellipsis;}
          .qchm-k{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:#9fb8ee;font-weight:800;}
          .qchm-v{font-size:18px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
          .qchm-v i{font-style:normal;font-size:11.5px;font-weight:600;color:#9fb8ee;}
          /* THE CHANGE LINE IS WHERE A GAIN OR A LOSS IS COLOURED, so it
             renders at every width (owner, 2026-08-25). It was phone-only,
             which left a desktop reader with no green or red anywhere: the
             rank movement and the day's IQ gain were simply not on the page. */
          .qchm-ch{display:block;font-size:10px;font-weight:700;color:#9fb8ee;margin-top:1px;}
          /* A sub-line that is the PHONE'S LABEL rather than a delta (Played,
             Daily rank: the phone hides .qchm-k). On desktop the label is right
             above it, so printing it again read as the same fact stated twice.
             visibility rather than display, so the cell keeps its height and the
             values stay on one line across the row. */
          .qchm-ch.qchm-mob{visibility:hidden;}
          .qchm-up{color:#6ee7b7;}
          .qchm-down{color:#fca5a5;}
          .qchm-acts{flex:none;margin-left:auto;display:flex;align-items:center;gap:18px;padding-left:20px;}
          /* ONE BUTTON IN THIS GROUP IS ASKING FOR SOMETHING, so exactly one of
             them is SHAPED like a button. Leaderboards and Stat Hub are places
             you go, so they read as type; the gold CTA and Sign Up keep a
             filled pill and are the only things in the whole stack that look
             pressable, which is what makes them read as the actions. */
          .qchm-bt{border:none;background:none;color:rgba(255,255,255,.82);border-radius:0;padding:7px 1px;font-family:inherit;font-size:12.5px;font-weight:700;letter-spacing:normal;text-transform:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;text-decoration:none;transition:color .14s;}
          .qchm-bt:hover{background:none;border:none;color:var(--white);}
          /* The share CTA is the one button in this row that is asking for
             something, so it leaves the blue set and takes the contest's gold
             (owner, 2026-08-08). Dark ink, because gold cannot carry white. */
          .qchm-bt.qchm-gold{background:var(--gold);border:none;color:#3b2a04;font-weight:800;border-radius:999px;padding:8px 16px;box-shadow:0 1px 2px rgba(4,9,22,.32);}
          .qchm-bt.qchm-gold:hover{background:#f2c451;border:none;color:#3b2a04;}
          .qchm-signup{background:var(--blue);border:none;color:var(--white);font-weight:800;border-radius:999px;padding:8px 16px;box-shadow:0 1px 2px rgba(4,9,22,.32);}
          .qchm-signup:hover{background:#3b7bf5;color:var(--white);}
          /* SIX EQUAL CELLS NEED THE ROOM (owner, 2026-08-25). With the actions
             block holding its natural width, a 1000px window left each cell
             about 90px, which is narrower than "13,628 IQ pts". Community rank
             is the slowest-moving of the six and has a page of its own, so it
             is the first to go. Its divider rule has to move with it: Community
             rank is LAST in the DOM, so once it hides the final visible cell is
             Daily rank, which loses its divider here and keeps it above. That
             is a CLASS rather than :nth-last-child(3), because the signed-out
             branch renders only two cells and a positional rule would have
             stripped the divider between them instead. */
          @media(max-width:1240px){
            .qchm-hidel{display:none;}
            .qchm-lastl{border-right:none;}
          }
          @media(max-width:1100px){.qchm-tag{display:none;}}
          @media(max-width:860px){
            .qchm-in{padding:11px 14px;gap:10px;}
            .qchm-nav{display:none;}
            .qchm-user{display:flex;}
            .qchm-r2 .qchm-in{padding:9px 6px;}
            .qchm-cell{flex:1;padding:0 6px;text-align:center;}
            .qchm-hidem{display:none;}
            /* Owner, 2026-08-08: three boxes on a phone, and Daily rank earns one
               of them. Played moves out (the slate's Ready-to-play band now
               carries the same x-of-N figure, right above the rows it counts) and
               keeps its desktop slot, where there is no band to carry it. It sits
               BEFORE Daily rank in the DOM so the visible last cell is still
               :last-of-type here and no divider strands at the right edge. */
            .qchm-hided{display:none;}
            .qchm-k{display:none;}
            .qchm-v{font-size:17px;}
            .qchm-v .qchm-day{display:none;}
            .qchm-ch.qchm-mob{visibility:visible;}
            .qchm-acts{display:none;}
          }
          @media(max-width:560px){.qchm-r1{padding-top:env(safe-area-inset-top);}}
          /* LANDSCAPE ON A PHONE OR TABLET (owner, 2026-08-08). Held sideways a
             device has 390 to 820px of height, and 119px of permanently locked
             header is a quarter of it. Two moves, both gated on a COARSE POINTER
             so a short desktop window keeps the bar it has: every box in the bar
             tightens, and only ROW ONE stays locked. Row two is the day's
             figures, a reference line rather than navigation, so it scrolls away
             with the page and comes back at the top.
             display:contents is what lets row one stick to the PAGE rather than
             to the bar: a sticky box is confined to its own parent's box, so
             leaving .qchm as a box would unstick row one the instant row two
             scrolled past it. Scoped :not(.qchm-inner) because the inner
             surfaces' copy of this bar sits in normal flow and sticks nothing.
             The height this publishes as --ml-headh follows (see the effect). */
          @media(orientation:landscape) and (pointer:coarse) and (max-height:1100px){
            .qchm:not(.qchm-inner){display:contents;}
            .qchm:not(.qchm-inner) .qchm-r1{position:sticky;top:0;z-index:90;}
            .qchm-in{padding:7px clamp(12px,2vw,26px);gap:12px;}
            .qchm-r2 .qchm-in{padding:6px clamp(12px,2vw,26px);}
            /* the mark's size is a JSX prop, so the box is resized here */
            .qchm-brand svg{width:24px;height:24px;}
            .qchm-wm{font-size:16px;}
            .qchm-pic{width:25px;height:25px;font-size:11px;}
            .qchm-nav{gap:15px;}
            .qchm-nav a,.qchm-nav button{padding:5px 1px;font-size:12px;}
            .qchm-k{font-size:8px;}
            .qchm-v{font-size:15px;}
            .qchm-v i{font-size:10px;}
            .qchm-ch{font-size:9px;margin-top:0;}
            .qchm-acts{gap:14px;padding-left:14px;}
            .qchm-bt{padding:5px 1px;font-size:11.5px;}
            .qchm-bt.qchm-gold,.qchm-signup{padding:6px 13px;}
            .qchm-r2{border-bottom-width:2px;}
          }
        ` }} />
        <div className="qchm-r1"><div className="qchm-in">
          <Link href="/" className="qchm-brand" aria-label="Mind Loft home">
            <MindLoftMark size={30} ink="#ffffff" accent="#7dd3fc" />
            <span className="qchm-wm">Mind <em>Loft</em></span>
          </Link>
          <span className="qchm-tag">Sharpen Your Mind</span>
          <nav className="qchm-nav">
            {/* On the homepage Today IS this page and Quizzes is a scroll, so one
                is marked active and the other is a button. On an inner surface
                neither is the current page: both navigate, and Quizzes carries
                the #quizzes hash the homepage reads on arrival. */}
            <Link href="/" className={inner ? undefined : 'on'}>Today</Link>
            {inner
              ? <Link href="/#quizzes">Quizzes</Link>
              : <button type="button" onClick={jumpToQuizzes}>Quizzes</button>}
            <Link href="/lists">Top 10 Lists</Link>
          </nav>
          <div className="qchm-user">
            {found ? (
              <>
                <Link href="/quizzes/hub" className="nm" style={{ color: '#fff', textDecoration: 'none' }}>{me.name}</Link>
                <span className="qchm-pic">{(me.name || '?').slice(0, 1).toUpperCase()}</span>
              </>
            ) : (
              <button type="button" className="qchm-bt qchm-signup" onClick={onSignup}>Sign Up</button>
            )}
          </div>
        </div></div>
        <div className="qchm-r2"><div className="qchm-in">
          {found ? (
            <>
              {/* Through stat() like every other cell, with an invisible
                  sub-line (.qchm-mob hides on desktop, and the cell itself is
                  hidden on a phone), so this box is the same three lines tall
                  as its neighbours. Two lines against three centred differently
                  and knocked the label off the row's top line. */}
              {stat('Player', me.name, 'player', 'qchm-mob', 'qchm-hidem')}
              {rank ? stat('Rank', <>{`#${fmtK(rank)}`}{totalPlayers ? <i>{` of ${totalPlayers.toLocaleString()}`}</i> : null}</>, moveTxt, moved ? (day.rankChange > 0 ? 'qchm-up' : 'qchm-down') : '') : null}
              {/* The big value is the LIFETIME total on the home, with the day's
                  gain left to the small change sub-line the way the Rank cell
                  leaves its movement there. On `inner` the inline +N stays,
                  since nothing else on those pages reports the day. */}
              {/* The big value is the LIFETIME total; the day's gain is the
                  small change line under it, coloured, the way the Rank cell
                  leaves its movement there. It used to also print inline beside
                  the total on the inner surfaces, back when the change line was
                  a phone-only thing. The line renders at every width now, so
                  the inline copy was the same number twice. */}
              {xp != null ? stat('IQ points', <>{xp.toLocaleString()}<i> IQ pts</i></>, dayXp ? `+${dayXp.toLocaleString()} today` : '+0 today', dayXp ? 'qchm-up' : '') : null}
              {stat('Played', <>{day.done}<i>{`/${day.total}`}</i></>, 'played today', 'qchm-mob', 'qchm-hided')}
              {stat(
                'Daily rank',
                dayRank
                  ? <>{`#${fmtK(dayRank)}`}{dayField ? <i className="qchm-day">{` of ${dayField.toLocaleString()}`}</i> : null}</>
                  : <>{'\u2014'}</>,
                // The phone hides the little cell LABELS (.qchm-k), so without the
                // word here this column is a bare "#32" sitting two boxes from the
                // lifetime rank's bare "#1" and there is nothing to tell them apart.
                dayRank
                  ? (dayField ? `daily rank of ${dayField.toLocaleString()}` : 'daily rank today')
                  : 'play to rank today',
                // NEUTRAL, not green. Green and red on this row mean a gain or a
                // loss; a standing is neither, and colouring it read as a climb.
                // qchm-mob: it is the phone's label, so it hides on desktop,
                // where the cell's own label is right above it.
                'qchm-mob',
                // .qchm-lastl: below 1240px Community rank is hidden and this
                // becomes the last visible cell, so its divider comes off.
                'qchm-lastl',
                home,
              )}
              {/* Desktop only, like Played: a phone has three boxes and this is
                  the slowest-moving figure of the six. The sub-line names the
                  window and the credits behind the standing, since "#62 of
                  1,204" on its own says nothing about what earns a place. */}
              {stat(
                'Community rank',
                commRank
                  ? <>{`#${fmtK(commRank)}`}{commTotal ? <i>{` of ${commTotal.toLocaleString()}`}</i> : null}</>
                  : <>{'\u2014'}</>,
                commRank
                  ? `${(commCredits || 0).toLocaleString()} referral${commCredits === 1 ? '' : 's'} \u00b7 90 days`
                  : 'community board',
                '',
                'qchm-hided qchm-hidel',
                false,
                '/quizzes/community',
              )}
            </>
          ) : (
            <>
              {stat('IQ today', <>{dayXp ? `+${dayXp.toLocaleString()}` : '+0'}<i> IQ pts</i></>, 'sign up to keep it', '')}
              {stat('Played', <>{day.done}<i>{`/${day.total}`}</i></>, 'played today', '')}
            </>
          )}
          <div className="qchm-acts">
            {/* Homepage only: it scrolls to today's boards, which exist on no
                other surface. */}
            {home ? <a className="qchm-bt" href="#tdy-boards" onClick={jumpToBoards}>{TICO.champ}Leaderboards</a> : null}
            <Link href="/quizzes/hub" className="qchm-bt">Stat Hub</Link>
            {/* The figure comes from CONTEST, never a literal: the prize is a
                one-file edit and this button has to follow it. */}
            {onCredit ? <button type="button" className="qchm-bt qchm-gold" onClick={onCredit}>{`Share for ${CONTEST.prizeLabel}*`}</button> : null}
            {!found ? <button type="button" className="qchm-bt qchm-signup" onClick={onSignup}>Sign Up</button> : null}
          </div>
        </div></div>
      </div>
    );
  }

  return (
    <div className="qch" style={{ fontFamily: FONT }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        /* The bar is position:fixed, so this wrapper reserves the height it no longer
           occupies in flow. Kept on .qch, which wraps nothing but the bar, so there is
           one rule to keep in sync instead of a separate spacer element. */
        .qch{min-height:56px;}
        .qch-bar{display:flex;align-items:center;gap:12px;min-height:56px;position:fixed;top:0;left:0;right:0;z-index:90;padding:9px clamp(14px,2vw,24px);background:var(--white);border-bottom:1.5px solid var(--border);}
        .qch-word{font-size:18px;font-weight:800;letter-spacing:-0.025em;line-height:1;color:var(--ink);text-decoration:none;white-space:nowrap;flex:none;}
        .qch-word em{font-style:normal;color:var(--blue);font-weight:800;}
        .qch-ws{display:none;}
        .qch-src{font-size:9.5px;font-weight:800;letter-spacing:normal;text-transform:uppercase;color:var(--ink);flex:none;}
        /* The search INPUT left this bar on 2026-07-29 (it now sits in the
           full-width tool row under the three-column daily section), so the
           welcome/rank block simply takes the free space with margin-left:auto
           and the Stat Hub + toggle group stays flush right. The mobile search
           ICON button stays exactly as it was: hidden on desktop, shown at
           <=820px, where it focuses the browse-row field (the one visible at
           that width) so phone layout is untouched. */
        .qch-searchbtn{display:none;align-items:center;justify-content:center;width:36px;height:36px;flex:none;background:var(--surface);border:1.5px solid var(--border);border-radius:10px;cursor:pointer;padding:0;}
        .qch-me{margin-left:auto;flex:none;min-width:0;}
        .qch-melink{display:flex;align-items:center;gap:8px;text-decoration:none;min-width:0;}
        .qch-ava{width:30px;height:30px;border-radius:50%;background:var(--surface-alt);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--ink);flex:none;}
        /* Name beside the stat block, not above it: the stats are themselves two
           lines now, so stacking all three would make the bar three deep. Below
           900px it does stack, and the bar grows to suit (see that breakpoint). */
        .qch-mecol{display:flex;flex-direction:row;align-items:center;min-width:0;}
        .qch-nm{display:flex;align-items:center;gap:5px;font-size:13.5px;font-weight:800;color:var(--ink);line-height:1;white-space:nowrap;max-width:260px;overflow:hidden;text-overflow:ellipsis;}
        .qch-hi{font-weight:600;color:var(--slate);}
        /* ── the stat block (owner, 2026-08-03) ──
           One column per figure, ACTUAL on the top line and TODAY on the bottom,
           with the word "today" spelled out on every lower line so a delta can
           never be mistaken for a total. Three columns: the player's rank, their
           lifetime IQ, and how much of today's daily slate they have played (a
           today-only figure, so its top line is the count and its lower line is
           the label). Lifetime "completed / %" used to sit here and was dropped:
           it counts quizzes, which is a different subject from this bar. */
        .qch-stats{display:flex;align-items:center;min-width:0;margin-left:clamp(11px,1.6vw,20px);padding-left:clamp(11px,1.6vw,20px);border-left:1.5px solid var(--border);}
        .qch-col{display:flex;flex-direction:column;align-items:flex-start;gap:2.5px;line-height:1;white-space:nowrap;min-width:0;}
        .qch-col + .qch-col{margin-left:13px;padding-left:13px;border-left:1px solid var(--border);}
        .qch-col b{font-size:13px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
        .qch-col em{font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.01em;color:var(--muted);font-variant-numeric:tabular-nums;}
        .qch-tup{color:var(--success-deep);}
        .qch-tdown{color:var(--danger);}
        .qch-tblue{color:var(--blue);}
        .qch-tgreen{color:var(--success-deep);}
        .qch-of{font-style:normal;font-weight:700;color:var(--muted);}
        .qch-nudge{font-size:10.5px;font-weight:700;color:var(--slate);line-height:1;white-space:nowrap;}
        /* Wide bars had a large dead gap between the brand and the player chip
           (owner 2026-07-29). From 1181px up the welcome and the rank detail sit
           on ONE line, separated by a rule and a fluid gap that grows with the
           viewport, so the block reaches back into that space instead of
           huddling at the right edge. Rank also gains its "of N players" tail
           here. Below 1181px everything collapses to the stacked two-line chip,
           unchanged, and the existing 980 / 620 rules still take over from there. */
        @media(min-width:1181px){
          /* The welcome block is centred on the PAGE, not parked at the right
             edge (owner, 2026-07-29). Taking it out of flow is what makes it a
             true centre: the brand keeps the left, and the Stat Hub + toggle
             group is pushed flush right by the auto margin below. */
          /* sticky rather than relative: it still establishes the containing block that
             .qch-me is centred against, and keeps the bar pinned at this breakpoint. */
          .qch-bar{position:fixed;top:0;left:0;right:0;z-index:90;}
          .qch-me{position:absolute;left:50%;transform:translateX(-50%);margin-left:0;flex:none;display:flex;justify-content:center;max-width:min(56vw,780px);}
          .qch-me ~ .qch-hub{margin-left:auto;}
          .qch-melink{gap:13px;}
          .qch-nm{font-size:15px;max-width:none;}
          .qch-col b{font-size:14px;}
          .qch-col em{font-size:10px;}
          .qch-col + .qch-col{margin-left:16px;padding-left:16px;}
        }
        .qch-chk{display:inline-flex;width:13px;height:13px;border-radius:50%;background:var(--surface-alt);color:var(--accent);font-size:8.5px;font-weight:800;align-items:center;justify-content:center;flex:none;}
        .qch-signup{display:inline-flex;align-items:center;gap:6px;background:var(--cta);border:1px solid var(--cta);border-radius:9px;color:var(--cta-ink);font-family:inherit;font-size:12.5px;font-weight:800;padding:8px 13px;cursor:pointer;white-space:nowrap;flex:none;}
        .qch-signup:hover{background:var(--cta-hover);border-color:var(--cta-hover);color:var(--cta-ink);}
        .qch-seg{display:flex;gap:2px;background:var(--surface-alt);border-radius:999px;padding:3px;flex:none;}.qch-burger{display:none;position:relative;flex:none;}.qch-burger>summary{list-style:none;display:flex;align-items:center;justify-content:center;width:38px;height:34px;border-radius:9px;background:var(--surface-alt);border:1.5px solid var(--border);cursor:pointer;}.qch-burger>summary::-webkit-details-marker{display:none;}.qch-bmenu{position:absolute;top:calc(100% + 8px);right:0;z-index:70;min-width:200px;background:var(--white);border:1px solid rgba(20,22,28,0.12);border-radius:11px;box-shadow:0 12px 30px rgba(10,16,32,0.28);padding:4px;}.qch-bmenu a{display:block;padding:11px 13px;border-radius:8px;font-size:14px;font-weight:700;color:var(--ink);text-decoration:none;white-space:nowrap;}.qch-bmenu a.on,.qch-bmenu a:hover{background:#eef2fb;color:var(--accent);}@media(max-width:600px){.qch-seg{display:none;}.qch-burger{display:block;}}
        .qch-seg a{font-size:12px;font-weight:700;color:var(--ink);text-decoration:none;padding:6px 12px;border-radius:999px;white-space:nowrap;}
        .qch-seg a.on{background:var(--accent);color:var(--white);}
        .qch-hub{display:inline-flex;align-items:center;gap:6px;background:var(--cta);color:var(--cta-ink);font-size:12.5px;font-weight:800;border-radius:10px;padding:8px 13px;text-decoration:none;white-space:nowrap;flex:none;}
        .qch-hub:hover{background:var(--cta-hover);color:var(--cta-ink);}
        .qch-tickwrap{display:flex;align-items:stretch;background:var(--white);}
        .qch-tlabel{display:flex;align-items:center;gap:6px;flex:none;padding:0 14px 0 clamp(14px,2vw,24px);background:var(--white);font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);position:relative;z-index:2;}
        .qch-pulse{width:6px;height:6px;border-radius:50%;background:#5ad48f;box-shadow:0 0 0 0 rgba(90,212,143,0.5);animation:qchpul 2s infinite;}
        @keyframes qchpul{0%{box-shadow:0 0 0 0 rgba(90,212,143,0.45)}70%{box-shadow:0 0 0 7px rgba(90,212,143,0)}100%{box-shadow:0 0 0 0 rgba(90,212,143,0)}}
        .qch-ticker{position:relative;overflow:hidden;flex:1 1 0;min-width:0;height:34px;}
        .qch-ticker:before,.qch-ticker:after{content:'';position:absolute;top:0;bottom:0;width:30px;z-index:1;pointer-events:none;}
        .qch-ticker:before{left:0;background:linear-gradient(90deg,var(--white),rgba(255,255,255,0));}
        .qch-ticker:after{right:0;background:linear-gradient(270deg,var(--white),rgba(255,255,255,0));}
        .qch-track{display:flex;align-items:center;height:34px;width:max-content;animation:qchtick linear infinite;}
        @keyframes qchtick{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .qch-ticker:hover .qch-track{animation-play-state:paused;}
        @media (prefers-reduced-motion: reduce){.qch-track{animation:none;}}
        .qch-set{display:flex;align-items:center;flex:none;}
        .qch-titem{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--slate);text-decoration:none;white-space:nowrap;}
        .qch-titem:hover .qch-ts{text-decoration:underline;text-underline-offset:2px;}
        .qch-ts{color:var(--ink);font-weight:800;}
        .qch-td{color:var(--muted);}
        .qch-tdot{width:4px;height:4px;border-radius:50%;background:var(--border);margin:0 14px;flex:none;}
        .qch-tico{width:17px;height:17px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;flex:none;}
        .qch-tico-play{background:rgba(46,163,106,0.22);}
        .qch-tico-lead{background:rgba(232,180,58,0.2);}
        .qch-tico-duel{background:rgba(201,79,79,0.22);}
        .qch-tico-new,.qch-tico-stat{background:rgba(59,116,232,0.28);}
        .qch-tico-top{background:rgba(232,180,58,0.22);}
        .qch-tico-champ{background:rgba(232,180,58,0.16);}
        .qch-tico-ach{background:rgba(183,156,242,0.24);}
        .qch-tico-streak{background:rgba(245,137,62,0.22);}
        .qch-hub-me{margin-left:2px;}
        .qch-hidefit{display:none !important;}
        @media(max-width:1180px){.qch-src{display:none;}}
        @media(max-width:1024px){.qch-hub-me{display:none;}}
        /* First things to go as the bar narrows: the "of N players" tail, then
           a size step on both lines. The columns themselves never drop. */
        @media(max-width:980px){.qch-of{display:none;}.qch-col b{font-size:12px;}.qch-col em{font-size:9px;}.qch-col + .qch-col{margin-left:10px;padding-left:10px;}.qch-hubtxt{display:none;}.qch-hub{padding:8px 10px;}}
        /* Below 900 the name sits ABOVE the stat block instead of beside it, so
           the identity is three lines deep and the bar has to grow with it. The
           .qch reserve must move in lockstep, since the bar is position:fixed and
           .qch is what holds its space in flow. */
        @media(max-width:900px){
          .qch{min-height:64px;}
          .qch-bar{min-height:64px;}
          .qch-mecol{flex-direction:column;align-items:center;gap:3px;}
          .qch-stats{margin-left:0;padding-left:0;border-left:none;}
        }
        @media(max-width:820px){.qch-wl{display:none;}.qch-ws{display:inline-flex;align-items:center;}.qch-brandlogo{display:none !important;}.qch-searchbtn{display:inline-flex;margin-left:auto;}.qch-me{margin-left:0;}.qch-nm{max-width:none;}}
        @media(max-width:620px){.qch-ava{display:none;}.qch-hi{display:none;}.qch-bar{gap:9px;padding-left:12px;padding-right:12px;}.qch-seg a{padding:6px 10px;font-size:11px;}.qch-tlabel{display:none;}.qch-word{font-size:17px;}}
        @media(max-width:768px){.qch-tickwrap{display:none;}}
        @media(max-width:560px){.qch-bar{padding-top:calc(9px + env(safe-area-inset-top));}.qch{min-height:calc(64px + env(safe-area-inset-top));}}
        /* Mobile header (owner 2026-07-29, rev 3): three slots, edges fixed, the
           identity absolutely centred in the bar for BOTH states so it is centred
           in the header rather than merely sitting between the side controls.
           Registered players put the search button on the left edge, so the brand
           steps aside there. Guests keep the brand on the left instead, since they
           get no search, and no Stat Hub either. Note .qch-brandlogo carries an
           inline display:flex, so hiding it needs !important. */
        @media(max-width:600px){
          .qch-bar{justify-content:space-between;}
          /* Owner 2026-07-30: keep the SoT wordmark on the left edge (it already
             precedes the search button in the DOM). Only the tagline goes. */
          .qch-src{display:none !important;}
          .qch-word{font-size:15px;flex:none;}
          .qch-hub{display:none !important;}
          .qch-searchbtn{margin-left:0 !important;flex:none;}
          .qch-burger{margin-left:auto;flex:none;}
          /* Reserve grew from 132px: the wordmark now sits on the left edge
             alongside the search button, and the identity is absolutely centred,
             so it must be told about the extra side furniture or it overlaps. */
          .qch-me{position:absolute;left:50%;transform:translateX(-50%);margin:0;display:flex;justify-content:center;flex:none;max-width:calc(100% - 188px);}
          .qch-melink{justify-content:center;min-width:0;gap:0;}
          .qch-mecol{flex-direction:column;align-items:center;gap:2px;min-width:0;}
          .qch-nm{text-align:center;max-width:100%;}
          /* Tight on a phone (owner, 2026-08-03): same three columns, same
             two-line reading, just condensed. Each column centres its own pair
             so the block reads as a row of little stats under the name. */
          .qch-stats{justify-content:center;}
          .qch-col{align-items:center;gap:2px;}
          .qch-col b{font-size:11.5px;letter-spacing:-.02em;}
          .qch-col em{font-size:8px;letter-spacing:0;}
          .qch-col + .qch-col{margin-left:8px;padding-left:8px;}
          .qch-bar.is-user .qch-brandlogo{display:none !important;}
          .qch-bar.is-guest .qch-searchbtn{display:none !important;}
          .qch-bar.is-guest .qch-brandlogo{flex:none;}
          /* Guest phone layout (owner, Aug 2026). A signed-out visitor carries
             the widest furniture on this bar: the guest chip AND the Sign Up
             button. Absolutely centring that pair inside a fixed 188px reserve
             left the nudge line wider than its column, so it slid UNDER the
             Sign Up button at one end and up against the wordmark at the other.
             Two changes fix it. The hamburger goes on guest phones: its two
             links are still in the footer, and getting a guest signed up is
             worth more than the nav here. And the chip drops out of the
             absolute centring, so the chip + button are a normal right-aligned
             flex group that takes whatever the wordmark leaves, with the text
             column allowed to shrink (min-width:0) and ellipsis rather than
             overflow when it runs out of room. */
          .qch-bar.is-guest .qch-burger{display:none !important;}
          /* With the hamburger gone the chip + button group is the last thing
             in the bar, so it right-ALIGNS rather than centring in the leftover
             space, and the bar's right gutter widens 12 -> 14px to match the
             page gutter below it. Net effect: the Sign Up button's right edge
             lands exactly on the right edge of the tiles underneath (verified
             flush at 320 / 360 / 390 / 430). */
          .qch-bar.is-guest{padding-right:14px;}
          .qch-bar.is-guest .qch-me{position:static;transform:none;margin:0 0 0 auto;max-width:none;min-width:0;flex:1 1 auto;justify-content:flex-end;}
          .qch-bar.is-guest .qch-melink{gap:9px;justify-content:flex-end;min-width:0;}
          /* The two text lines CENTRE on each other (owner, Aug 2026): the
             guest handle sits centred over the nudge beneath it, not flush to
             one edge. Line-height is also relaxed off the bar-wide 1 on both
             lines, because the nudge clips its own overflow to get the ellipsis
             and a line box exactly one em tall cut the descenders off the g, p
             and y. The clip stays on the nudge itself, never on the column, so
             nothing else in the chip is trimmed vertically. */
          .qch-bar.is-guest .qch-mecol{align-items:stretch;min-width:0;text-align:center;}
          .qch-bar.is-guest .qch-nm{justify-content:center;max-width:100%;line-height:1.25;}
          .qch-bar.is-guest .qch-nudge{max-width:100%;line-height:1.3;overflow:hidden;text-overflow:ellipsis;}
          .qch-bar.is-guest .qch-stats{justify-content:center;}
        }
        /* Under ~380px the nudge line stops fitting beside the button, and it
           only restates what the button already says, so it goes rather than
           truncating to a stub. The button keeps its full label at every width:
           a bare person icon does not read as "sign up". */
        @media(max-width:380px){
          .qch-bar.is-guest .qch-nudge{display:none;}
        }
      ` }} />
      <div className={`qch-bar ${found ? 'is-user' : 'is-guest'}`} ref={barRef}>
        <Link href="/" className="qch-brandlogo" ref={logoRef} style={{ flex: 'none', display: 'flex' }} aria-label="Mind Loft home"><Logo size={30} /></Link>
        <Link href="/" className="qch-word"><span className="qch-wl">Mind <em>Loft</em></span><span className="qch-ws"><MindLoftMark size={32} /></span></Link>
        <span className="qch-src">Sharpen Your Mind</span>
        <button type="button" className="qch-searchbtn" ref={btnRef} onClick={focusListSearch} aria-label="Search quizzes"><SearchIcon /></button>
        <div className="qch-me">
          {found ? (
            <Link href="/quizzes/hub" className="qch-melink" title="Stat Hub - your stats">
              <span className="qch-ava">{(me.name || '?').slice(0, 1).toUpperCase()}</span>
              <span className="qch-mecol">
                <span className="qch-nm" ref={nmRef}><span className="qch-hi">Welcome</span> {me.name}{signed ? <span className="qch-chk">✓</span> : null}</span>
                <span className="qch-stats">
                  {rank ? (
                    <span className="qch-col">
                      <b>{`#${fmtK(rank)}`}{totalPlayers ? <i className="qch-of">{` of ${totalPlayers.toLocaleString()}`}</i> : null}</b>
                      <em className={moveCls} title="Places moved on the IQ board today">{moveTxt}</em>
                    </span>
                  ) : null}
                  {xp != null ? (
                    <span className="qch-col">
                      <b>{`${xp.toLocaleString()} IQ`}</b>
                      <em className={dayXp ? 'qch-tblue' : ''} title="IQ Points earned today">{dayXp ? `+${dayXp.toLocaleString()} today` : '+0 today'}</em>
                    </span>
                  ) : null}
                  <span className="qch-col">
                    <b>{`${day.done}/${day.total}`}</b>
                    <em className={day.done ? 'qch-tgreen' : ''} title="Daily puzzles played today">played today</em>
                  </span>
                </span>
              </span>
            </Link>
          ) : (
            <div className="qch-melink">
              {guestName ? (
                <>
                  <span className="qch-ava">G</span>
                  <span className="qch-mecol">
                    <span className="qch-nm" ref={nmRef}><span className="qch-hi">Welcome</span> {guestName}</span>
                    {/* A guest has no lifetime rank or IQ to head a column, so
                        they get the day figures alone once their day starts, and
                        the sign-up nudge until then. */}
                    {dayXp || day.done ? (
                      <span className="qch-stats">
                        {dayXp ? (
                          <span className="qch-col">
                            <b className="qch-tblue">{`+${dayXp.toLocaleString()}`}</b>
                            <em>IQ today</em>
                          </span>
                        ) : null}
                        <span className="qch-col">
                          <b>{`${day.done}/${day.total}`}</b>
                          <em className={day.done ? 'qch-tgreen' : ''}>played today</em>
                        </span>
                      </span>
                    ) : (
                      <span className="qch-nudge">Sign up to keep your scores and rank</span>
                    )}
                  </span>
                </>
              ) : null}
              <button type="button" className="qch-signup" onClick={onSignup}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 19a5 5 0 0 0-10 0M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6M22 11h-6" /></svg>
                Sign Up
              </button>
            </div>
          )}
        </div>
        {/* Stat Hub button. ALWAYS sits immediately to the LEFT of the
            Lists/Quizzes toggle, whether or not the visitor is signed in.
            Signed-in players get qch-hub-me, which collapses at <=1024px (one
            step after the sources pill at 1180px, since the name/avatar also
            links to the hub). New visitors get the plain qch-hub, which shrinks
            to an icon on mobile but never fully hides. Same responsive hide /
            shift-to-icon rules as before; only the signed-out button moved (it
            used to sit to the RIGHT of the toggle). */}
        <Link href="/quizzes/hub" className={found ? 'qch-hub qch-hub-me' : 'qch-hub'} title="Stat Hub — your stats">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
          <span className="qch-hubtxt">Stat Hub</span>
        </Link>
        <nav className="qch-seg">
          <Link href="/" className="on">Puzzles &amp; Quizzes</Link>
          <Link href="/lists">Top 10 Lists</Link>
        </nav>
        <details className="qch-burger">
          <summary aria-label="Open menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2.4" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></summary>
          <div className="qch-bmenu">
            <Link href="/" className="on">Puzzles &amp; Quizzes</Link>
            <Link href="/lists">Top 10 Lists</Link>
          </div>
        </details>
      </div>
      {items.length ? (
        <div className="qch-tickwrap">
          <div className="qch-tlabel"><span className="qch-pulse" /> Live</div>
          <div className="qch-ticker">
            <div className="qch-track" style={{ animationDuration: dur }}>
              <TickSet items={items} />
              <TickSet items={items} hidden />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
