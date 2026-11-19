"use client";

// PremierePop — the once-per-launch card for a RETURNING player who has not
// yet played a daily that just premiered (owner, 2026-09-01). Built for Thread
// and Focus; any later launch is one line in PREMIERES (lib/daily-games.js).
//
// It is the second unasked-for thing on the site after the 8/30 cleanup left
// only the Gauntlet nudge, so it says exactly three things: which games are
// new, one line each on what they are, and Play. The X closes it.
//
// ONE GAME A DAY, FROM A BACKLOG (owner, 2026-11-14: "stagger our pop-ups. i
// want one per day, and use the backlog across users who haven't played it").
// The card names a single game. Launches wait in a queue (lib/premiere-queue.js),
// oldest first, and a browser is shown one card per Eastern day until the queue
// is empty: Mop, then Chef the next day, then Pack, then Seated. A run's launch
// card counts as that day's card.
//
// FOUR CONDITIONS, all required:
//
//   OPEN. The launch is from 2026-11-13 or later and today (ET) is inside its
//   [from, until] window or within 30 days of `from`. Past that it is silent
//   forever; nobody back after two months is handed old launches.
//
//   RETURNING. Seen on an earlier ET day (lib/visitor seenBeforeToday, since
//   2026-10-12) AND a positive play signal: a stored identity, any
//   sot_<key>_day breadcrumb, or any per-puzzle save. sot_quiz_anon is minted
//   on first paint and proves nothing (same test WelcomeOverlay used).
//
//   UNPLAYED. No local footprint for that game (stats record, breadcrumb, a
//   save that was actually started) AND the server's archive count for it is
//   zero. The server read is what stops it nudging somebody who played on
//   their phone this morning. It waits for daily-status, which the page
//   fetches anyway, so it costs no request.
//
//   ONCE. sot_premiere_q_<key> is stamped the moment it renders, for the game on
//   the card and no other, so the rest of the queue keeps its turn.
//   sot_premiere_day is stamped with today, and nothing more opens that day.
//
// IT WAITS ITS TURN. The theme intro and the entry door (app/EntryDoor.jsx,
// first visit, then weekly) both own the arrival; this polls until neither is on
// screen, then opens. Two full-screen events never share a load.
//
// ?premiere=0 suppresses, ?premiere=1 previews without stamping, matching
// ?welcome=. Stage tokens only, so it follows the light switch.
//
// THE SITE'S SHEET LOOK (owner, 2026-11-01: "update the pop-up to match new
// site style"). Drawn like the How to play sheet (app/HelpSheet.jsx) and the
// white stage: one Manrope face (no mono labels), a 2px ink rule round a 16px
// card, round 2px-ruled buttons, each game a ruled tile with its glyph on its
// category's pastel and a pastel Play pill with dark ink, and a full-width
// pill for the one action of a single-game or run card. No accent rail.

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DAILY_GAME_MAP, PREMIERES, PREMIERE_RUNS, NO_PREMIERE } from '@/lib/daily-games';
import { PRICE_GAMES } from '@/lib/price-games';
import { runDoneToday } from './circuits/RunDoorPop';
import { RAMP_INK, categoryColor, categoryAccentInkLight } from '@/lib/category-ramp';
import GameGlyph from './GameGlyph';
import { fetchDayStatus, etToday } from './useDayStats';
import { seenBeforeToday } from '@/lib/visitor';
import { gameActive } from '@/lib/game-active';
import { premiereQueue, daysAgo } from '@/lib/premiere-queue';
import { claimPop, popSpent, holdPop, releasePop } from '@/lib/pop-budget';

const KEY = (k) => `sot_premiere_${k}`;      // a run's launch card
// A game's card. A new name on 2026-11-14: the old stamp was written for every open
// launch whenever any card showed, so it cannot say this browser saw this game.
const GKEY = (k) => `sot_premiere_q_${k}`;

// THE DAY'S ONE CARD. Stamped with the Eastern date when any premiere card
// (a game's or a run's) opens; a browser carrying today's date is shown nothing more.
const DAY_KEY = 'sot_premiere_day';
// 2026-09-17 ("it served a popup for old games") was a browser handed every open
// window on one card under the oldest game's date. The queue answers that
// differently: one game to a card, each under its own date.
const NUM = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

function returning() {
  try {
    if (localStorage.getItem('sot_quiz_identity')) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^sot_[a-z]+_day$/.test(k) || /^sot_[a-z]+_stats$/.test(k) || /^sot_[a-z]+_\d+$/.test(k)) return true;
    }
  } catch (e) {}
  return false;
}

function playedLocally(key) {
  try {
    if (localStorage.getItem(`sot_${key}_stats`)) return true;
    if (localStorage.getItem(`sot_${key}_day`)) return true;
    const re = new RegExp(`^sot_${key}_\\d+$`);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (!re.test(k)) continue;
      const sv = JSON.parse(localStorage.getItem(k) || 'null');
      // Opening a game is not starting it: t0 is the started signal.
      if (sv && (sv.t0 || sv.status === 'done' || sv.status === 'won' || sv.status === 'lost')) return true;
    }
  } catch (e) {}
  return false;
}

// THE HOME SNAPSHOT HIDES THE LIVE PAGE (owner report, 2026-11-08: the sudoku
// launch card "showed, but only for one second"). On a returning visit the
// home paints its last-known snapshot (lib/home-snapshot.js) over the live
// page, which sits at opacity 0 with pointer-events off until every read has
// landed (up to 9s). This card lives in the live page, so it opened, stamped
// itself as seen, and stayed invisible under the snapshot. The reader's first
// tap released the snapshot, the card appeared, and the same tap's click
// landed on its scrim and shut it. So it now waits for the snapshot to go,
// and the scrim only closes on a press that STARTED on the scrim.
function snapUp() {
  try { return document.documentElement.hasAttribute('data-sot-snap'); } catch (e) { return false; }
}
// Scrim props: close only on a press that began on the scrim itself, after it
// was on screen, never on the tail of a tap that opened under it.
// The flag is module-level so a re-render between press and release keeps it.
let scrimDown = false;
export function scrimClose(close) {
  return {
    onPointerDown: (e) => { scrimDown = e.target === e.currentTarget; },
    onClick: (e) => { if (scrimDown && e.target === e.currentTarget) close(); scrimDown = false; },
  };
}

function arrivalBusy() {
  // The first-load theme flip is RETIRED and no longer stamps sot_theme_intro2
  // (lib/stage-theme.js), so waiting on that key held this card back forever
  // for every browser that arrived after 2026-09-01. The theme bubble that
  // replaced it is read off the DOM instead, like everything else here.
  // .gpp-scrim: the Groups launch card (app/GroupsPop.jsx). Never two cards at once.
  return snapUp() || !!document.querySelector('.ent-door, .gpp-scrim, .stg-tpop');
}

export default function PremierePop() {
  const [games, setGames] = useState(null);
  const [run, setRun] = useState(null);

  useEffect(() => {
    let alive = true;
    let force = false;
    try {
      const q = new URLSearchParams(window.location.search).get('premiere');
      if (q === '0') return;
      force = q === '1';
    } catch (e) {}

    const today = etToday();
    // A run premiere wins outright: one card for the run, nothing for its
    // members, and every member stamped so no single-game card follows.
    const runOpen = PREMIERE_RUNS.filter((r) => r.lede && today >= r.from && today <= r.until && !r.keys.some((k) => NO_PREMIERE.has(k)) && !NO_PREMIERE.has(r.id));
    const runMembers = new Set(runOpen.flatMap((r) => r.keys));
    // the queue, in the order the cards are owed (lib/premiere-queue.js)
    const open = premiereQueue(PREMIERES, today, (k) => DAILY_GAME_MAP[k] && !NO_PREMIERE.has(k) && !runMembers.has(k));
    if (!open.length && !runOpen.length) return;
    // one card a day
    if (!force && safeGet(DAY_KEY) === today) return;
    // NEW ARRIVALS GET NOTHING (owner, 2026-10-12, after a first-day visitor was
    // handed Ergo): the browser must have been here on an earlier ET day as
    // well as carry a play signal. A save written by today's first game proves
    // nothing on its own.
    if (!force && !(seenBeforeToday() && returning())) return;
    const runCand = runOpen.find((r) => force || (!safeGet(KEY(r.id)) && !runDoneToday(r.id)));
    if (runCand) {
      const timers = [];
      const started = Date.now();
      const tick = () => {
        if (!alive) return;
        if (arrivalBusy() && Date.now() - started < 15000) { timers.push(setTimeout(tick, 300)); return; }
        if (Date.now() - started >= 15000 && arrivalBusy()) return;
        if (gameActive()) return;
        if (!force && !claimPop('premiere')) return;   // one pop-up a visit; nothing stamped, so the card keeps its day
        // the run and its members are stamped, and the day; the single-game queue keeps its turn
        if (!force) { try { localStorage.setItem(KEY(runCand.id), today); for (const k of runCand.keys) localStorage.setItem(GKEY(k), today); } catch (e) {} try { localStorage.setItem(DAY_KEY, today); } catch (e) {} }
        setRun(runCand);
      };
      timers.push(setTimeout(tick, 600));
      return () => { alive = false; timers.forEach(clearTimeout); };
    }
    if (!open.length) return;

    let cands = open.filter((k) => force || (!playedLocally(k) && !safeGet(GKEY(k))));
    if (!cands.length) return;
    // A FRONT launch (Machine, owner 2026-11-17: "the first pop-up people see
    // upon return") holds the visit while the day status and the arrival are
    // awaited, so a faster card cannot take it first (lib/pop-budget holdPop).
    const isFront = (k) => PREMIERES.some((p) => p.key === k && p.front);
    if (!force && isFront(cands[0])) holdPop('premiere');
    const letGo = () => releasePop('premiere');

    const timers = [];
    fetchDayStatus().then((d) => {
      if (!alive) { letGo(); return; }
      if (d && d.archive && !force) {
        cands = cands.filter((k) => !(d.archive[k] && d.archive[k].played > 0));
      }
      if (!cands.length) { letGo(); return; }
      // The head of the queue, alone. A game played on another device was dropped
      // just above without using up the day, so the next in line takes its place.
      const next = cands[0];
      if (!isFront(next)) letGo();
      // Wait out the arrival, then open. Give up after ~15s rather than open
      // onto a page the reader has already started using.
      const started = Date.now();
      const tick = () => {
        if (!alive) { letGo(); return; }
        if (arrivalBusy() && Date.now() - started < 15000) { timers.push(setTimeout(tick, 300)); return; }
        if (Date.now() - started >= 15000 && arrivalBusy()) { letGo(); return; }
        if (gameActive()) { letGo(); return; }
        letGo();
        if (!force && !claimPop('premiere')) return;   // one pop-up a visit; nothing stamped, so the card keeps its day
        // Stamp the game on the card and the day. Every other launch keeps its turn.
        if (!force) { try { localStorage.setItem(GKEY(next), today); localStorage.setItem(DAY_KEY, today); } catch (e) {} }
        setGames([next]);
      };
      timers.push(setTimeout(tick, 600));
    });
    return () => { alive = false; timers.forEach(clearTimeout); letGo(); };
  }, []);

  useEffect(() => {
    if (!games && !run) return;
    const k = (e) => { if (e.key === 'Escape') { setGames(null); setRun(null); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [games, run]);

  if (run && run.special === 'sudoku') return <SudokuLaunch run={run} onClose={() => setRun(null)} />;
  if (run) {
    let lightR = true;
    try { const el = document.querySelector('.stage-page'); lightR = !el || el.getAttribute('data-stage-theme') !== 'dark'; } catch (e) {}
    const catR = run.cat || 'Numbers';
    const accR = categoryColor(catR);
    const onR = RAMP_INK;
    const varsR = { '--prm-acci': lightR ? categoryAccentInkLight(catR) : accR, '--prm-acc': accR, '--prm-on': onR, '--prm-tint': `color-mix(in srgb, ${accR} 16%, transparent)` };
    const whenR = run.from === etToday() ? 'today' : dateLabel(run.from);
    return (
      <div className="prm-scrim" {...scrimClose(() => setRun(null))}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="prm" role="dialog" aria-labelledby="prm-t" style={varsR} onClick={(e) => e.stopPropagation()}>
          <div className="prm-in">
          <div className="prm-top">
            <div className="prm-eye"><i /><span>{whenR === 'today' ? 'New today' : 'New this week'} · Daily run</span></div>
            <button className="prm-x" aria-label="Close" onClick={() => setRun(null)}><X size={16} strokeWidth={2.8} /></button>
          </div>
          <h2 id="prm-t">{run.name}</h2>
          <p className="prm-lede">{run.lede}</p>
          <div className="prm-tags">
            {run.keys.length > 1 && run.keys.map((k) => {
              const p = PRICE_GAMES[k];
              if (p) return <span key={k} style={{ background: lightR ? p.tagLight : p.tagDark, color: lightR ? '#ffffff' : '#0b0f1a' }}>{p.name}</span>;
              const g = DAILY_GAME_MAP[k];
              return g ? <span key={k} style={{ background: accR, color: onR }}>{g.name}</span> : null;
            })}
          </div>
          <a className="prm-go" href={run.href} onClick={() => setRun(null)}>Play {run.name}</a>
          {run.foot ? <div className="prm-foot">{run.foot}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  if (!games) return null;
  if (games.length === 1 && games[0] === 'mural') return <MuralLaunch onClose={() => setGames(null)} />;
  const rows = games.map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
  const many = rows.length > 1;
  const cat = rows[0].cat || 'Trivia';
  const cats = [...new Set(rows.map((g) => g.cat || 'Trivia'))];
  const oneCat = cats.length === 1;
  const since = PREMIERES.find((p) => p.key === rows[0].key);
  const when = since && since.from === etToday() ? 'today' : dateLabel(since && since.from);
  const allOf = rows.length === 2 ? 'Both' : 'All';
  const neither = rows.length === 2 ? 'either' : 'any';
  const shelves = oneCat ? `the ${cat} shelf` : `the ${cats.slice(0, -1).join(', ')} and ${cats[cats.length - 1]} shelves`;
  // THE CATEGORY'S RAMP STEP, in whichever register the page is in. The home
  // has no accent of its own (its cap is the default sky), so this is read off
  // the category rather than off --stg-acc. Safe at render time: this only
  // renders after the effect above, so the DOM is there.
  let light = true;
  try { const el = document.querySelector('.stage-page'); light = !el || el.getAttribute('data-stage-theme') !== 'dark'; } catch (e) {}
  // EACH ROW WEARS ITS OWN CATEGORY (owner, 2026-10-15). The pair used to be
  // read off rows[0] and set once on the dialog, so a mixed premiere (a card
  // game beside a sudoku beside a chess puzzle) painted every row in the first
  // game's colour. The dialog keeps a category colour only when every row
  // shares it; otherwise its eyebrow dot falls back to plain ink.
  // THE STAGE'S PASTEL IN BOTH LOOKS (2026-11-01): the white stage puts the
  // category's full pastel under dark ink on what can be pressed, light or dark,
  // so the pop-up's tiles and Play pills do the same rather than the deep step.
  const varsFor = (c) => {
    const acc = categoryColor(c);
    const onAcc = RAMP_INK;
    return { '--prm-acci': light ? categoryAccentInkLight(c) : acc, '--prm-acc': acc, '--prm-on': onAcc, '--prm-tint': `color-mix(in srgb, ${acc} 16%, transparent)` };
  };
  const vars = oneCat ? varsFor(cat) : { '--prm-acc': 'var(--stg-ink, #0b0d12)' };

  return (
    <div className="prm-scrim" {...scrimClose(() => setGames(null))}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="prm" role="dialog" aria-labelledby="prm-t" style={vars} onClick={(e) => e.stopPropagation()}>
        <div className="prm-in">
        <div className="prm-top">
          <div className="prm-eye"><i /><span>{when === 'today' ? 'New today' : since && daysAgo(since.from, etToday()) <= 6 ? 'New this week' : 'New this month'}{oneCat ? ` · ${cat}` : ''}</span></div>
          <button className="prm-x" aria-label="Close" onClick={() => setGames(null)}><X size={16} strokeWidth={2.8} /></button>
        </div>
        <h2 id="prm-t">{many ? `${NUM[rows.length] || rows.length} new dailies` : 'A new daily'}</h2>
        <p className="prm-lede">
          {many ? `${allOf} premiered ${when}. You have not played ${neither} yet.`
            : `${rows[0].name} premiered ${when}. You have not played it yet.`}
        </p>
        <div className="prm-rows">
          {rows.map((g) => (
            <div className="prm-row" key={g.key} style={varsFor(g.cat || 'Trivia')}>
              <div className="prm-gl"><GameGlyph gameKey={g.key} size={26} /></div>
              <div className="prm-t"><b>{g.name}</b><span>{g.tag}</span></div>
              {many ? <a className="prm-play" href={g.href} onClick={() => setGames(null)}>Play</a> : null}
            </div>
          ))}
        </div>
        {!many ? <a className="prm-go" style={varsFor(rows[0].cat || 'Trivia')} href={rows[0].href} onClick={() => setGames(null)}>Play {rows[0].name}</a> : null}
        <div className="prm-foot">{many ? `${allOf} are in ${shelves} every day.` : `It is in ${shelves} every day.`}</div>
        </div>
      </div>
    </div>
  );
}

// THE MURAL LAUNCH CARD (owner, 2026-11-19, from the mockup at
// https://claude.ai/artifact/WXXofv9BdxsvLLjwkc5tS7: "Do the new game pop-up for
// mural - note that this is a new concept"). Mural is not another solo daily,
// so its card says what is different instead of the usual one-row card: a
// small mural with the Blank / Faded / Bright legend, four reasons, one button.
// On a phone the reasons keep their titles and drop the second line so the card
// fits one screen. MuralToo has no card of its own.
const ML_GAPS = [[3, 0], [4, 0], [9, 0], [15, 1], [16, 1], [6, 2], [7, 2], [12, 3], [13, 3], [2, 4], [18, 4], [8, 5], [9, 5], [10, 5], [14, 6], [4, 7], [5, 7], [17, 7], [11, 8], [1, 9], [2, 9], [15, 9], [7, 10], [8, 10], [19, 10], [12, 11]];
const ML_MINE = [[5, 3], [6, 3], [10, 6], [11, 6], [11, 7]];
const ML_WHY = [
  ['crowd', 'We All Build The Same One', 'Every other daily is yours alone. Here the crowd\u2019s pieces fade in on your board every two minutes.'],
  ['clock', 'No Clock, No Give Up', 'It is open for 24 hours. Place five pieces or five hundred, and come back whenever you like.'],
  ['bars', 'Hard Pieces Pay More', 'Plain sky beats a corner, and a piece nobody has placed yet pays double.'],
  ['two', 'Two A Day', 'Mural opens at noon ET. MuralToo, its twin, opens at midnight.'],
];
const ML_ICON = {
  crowd: <><circle cx="8" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M2.5 20c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5M14.5 15.2c.8-.3 1.6-.4 2.5-.4 2.3 0 4 1.3 4.5 4.2" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2M4.5 4.5l15 15" /></>,
  bars: <path d="M4 18h4v-5H4zM10 18h4V9h-4zM16 18h4V5h-4z" />,
  two: <><circle cx="7.5" cy="12" r="3.5" /><path d="M7.5 5v1.5M7.5 17.5V19M1 12h1.5M12.5 12H14" /><path d="M21 14.5A5 5 0 0 1 16 8.5a5 5 0 1 0 5 6z" /></>,
};
function MuralPicture() {
  const pic = (
    <>
      <rect width="400" height="180" fill="#8fd0f5" /><circle cx="300" cy="46" r="20" fill="#f7c948" />
      <path d="M0 120 Q90 60 190 112 T400 96 V180 H0Z" fill="#7d8fc4" /><path d="M0 138 Q110 96 230 132 T400 124 V180 H0Z" fill="#5fae5a" />
      <path d="M0 160 Q140 128 260 156 T400 150 V180 H0Z" fill="#3f8f52" /><path d="M150 180 Q170 150 196 128" stroke="#4aa3e0" strokeWidth="7" fill="none" />
    </>
  );
  return (
    <svg className="ml-pic" viewBox="0 0 400 180" role="img" aria-label="A wide landscape photo cut into a grid of small pieces. Most are faded, a few are bright, and some are still blank.">
      <defs><clipPath id="ml-mine">{ML_MINE.map(([x, y]) => <rect key={x + '-' + y} x={x * 20} y={y * 15} width="20" height="15" />)}</clipPath></defs>
      <rect className="ml-gap" width="400" height="180" />
      <g opacity="0.45">{pic}</g>
      {ML_GAPS.map(([x, y]) => <rect key={x + '-' + y} className="ml-gap" x={x * 20} y={y * 15} width="20" height="15" />)}
      <g clipPath="url(#ml-mine)">{pic}</g>
      <g className="ml-grid">
        {Array.from({ length: 19 }, (_, i) => <path key={'v' + i} d={`M${(i + 1) * 20} 0V180`} />)}
        {Array.from({ length: 11 }, (_, i) => <path key={'h' + i} d={`M0 ${(i + 1) * 15}H400`} />)}
      </g>
    </svg>
  );
}
function MuralLaunch({ onClose }) {
  const acc = categoryColor('Visual');
  const vars = { '--prm-acc': acc, '--prm-on': RAMP_INK, '--prm-tint': `color-mix(in srgb, ${acc} 18%, transparent)` };
  const since = PREMIERES.find((p) => p.key === 'mural');
  const when = since && since.from === etToday() ? 'New today' : 'New this week';
  return (
    <div className="prm-scrim" {...scrimClose(onClose)}>
      <style dangerouslySetInnerHTML={{ __html: CSS + MURAL_LAUNCH_CSS }} />
      <div className="prm" role="dialog" aria-labelledby="prm-t" style={vars} onClick={(e) => e.stopPropagation()}>
        <div className="prm-in">
          <div className="prm-top">
            <div className="prm-eye"><i /><span>{when} · A new kind of puzzle</span></div>
            <button className="prm-x" aria-label="Close" onClick={onClose}><X size={16} strokeWidth={2.8} /></button>
          </div>
          <h2 id="prm-t">Mural: One Jigsaw, Built By Everyone</h2>
          <p className="prm-lede">A new kind of puzzle for Mind Loft. Every other daily here is solved alone. Mural is 10,000 pieces of one photograph, and everyone on the site builds the same one at the same time.</p>
          <MuralPicture />
          <div className="ml-leg"><span><b>Blank</b> nobody yet</span><span><b>Faded</b> the crowd has it</span><span><b>Bright</b> yours</span></div>
          <div className="prm-rows">
            {ML_WHY.map(([k, t, s]) => (
              <div className="prm-row ml-row" key={k}>
                <div className="prm-gl"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ML_ICON[k]}</svg></div>
                <div className="prm-t"><b>{t}</b><span>{s}</span></div>
              </div>
            ))}
          </div>
          <a className="prm-go" href="/mural" onClick={onClose}>Play Mural</a>
          <div className="prm-foot">Every piece you place scores, and your Mural points count toward your total for the day.</div>
        </div>
      </div>
    </div>
  );
}
const MURAL_LAUNCH_CSS = `
.ml-pic{display:block;width:100%;height:auto;border-radius:10px;border:1px solid var(--stg-ink,#08222e);box-sizing:border-box;}
.ml-gap{fill:var(--stg-ground,#ffffff);}
.ml-grid{stroke:var(--stg-ink,#08222e);stroke-width:.5;opacity:.35;fill:none;}
.ml-leg{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0 14px;font-size:12px;font-weight:700;}
.ml-leg span{opacity:.8;}
.ml-leg b{font-weight:800;}
.ml-row{grid-template-columns:44px 1fr;}
.ml-row .prm-t span{line-height:1.4;margin-top:2px;}
@media (max-width:420px){
  .ml-row{grid-template-columns:40px 1fr;}
  .ml-row .prm-t span{display:none;}
}
`;

// THE SUDOKU LAUNCH CARD (owner, 2026-11-08). One card for the whole drop:
// two sample boards (a 6x6 Kayak and a 9x9 color board), the 6x6 list, then the
// color list, and one button to the Sudoku page. 6x6 leads (owner: "6x6 should
// be the first emphasis"); American spelling throughout.
const LAUNCH_P9 = ['#b1e5fd', '#f1d289', '#a8f1d4', '#fdaab6', '#d9b5fd', '#d8f7a2', '#f1b0fb', '#c9d2fd', '#fdbd92'];
const LAUNCH_S9 = [[5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],[8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],[9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9]];
const LAUNCH_M9 = '101001010010110001100010100001101000010000010000101100010001100011010010100100101';
const LAUNCH_S6 = [[1,2,3,4,5,6],[4,5,6,1,2,3],[2,3,1,5,6,4],[5,6,4,2,3,1],[3,1,2,6,4,5],[6,4,5,3,1,2]];
const LAUNCH_M6 = '100101010010001100100010010100101001';
const LAUNCH_LINE = new Set(['1,1', '2,2', '2,3', '1,4']);
const SMALL_OF = { kayak: 'Racecar', lip: 'Rim', fever: 'Mercury', snack: 'Sando', coop: 'Cages', dart: 'Arrow', trim: 'Frame', bout: 'Sumo', dot: 'Polka' };

function MiniBoard({ n, bw, bh, cell, over }) {
  const W = 90, pad = 2, c = (W - 2 * pad) / n, out = [];
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) { const el = cell(r, k, pad + k * c, pad + r * c, c); if (el) out.push(el); }
  const lines = [];
  for (let k = 1; k < n; k++) {
    const hc = k % bw === 0, hr = k % bh === 0;
    lines.push(<line key={'v' + k} x1={pad + k * c} y1={pad} x2={pad + k * c} y2={W - pad} stroke={hc ? '#08222e' : '#c9d0db'} strokeWidth={hc ? 1.4 : 0.5} />);
    lines.push(<line key={'h' + k} x1={pad} y1={pad + k * c} x2={W - pad} y2={pad + k * c} stroke={hr ? '#08222e' : '#c9d0db'} strokeWidth={hr ? 1.4 : 0.5} />);
  }
  return (
    <svg viewBox="0 0 90 90" aria-hidden="true">
      <rect x={pad} y={pad} width={W - 2 * pad} height={W - 2 * pad} rx="3" fill="#ffffff" />
      {out}{over ? over(c, pad) : null}{lines}
      <rect x={pad} y={pad} width={W - 2 * pad} height={W - 2 * pad} rx="3" fill="none" stroke="#08222e" strokeWidth="2" />
    </svg>
  );
}

function SudokuLaunch({ run, onClose }) {
  const acc = categoryColor('Sudoku');
  const vars = { '--prm-acc': acc, '--prm-on': RAMP_INK, '--prm-tint': `color-mix(in srgb, ${acc} 18%, transparent)` };
  const small = run.keys.filter((k) => SMALL_OF[k] && DAILY_GAME_MAP[k]);
  const color = run.keys.filter((k) => !SMALL_OF[k] && DAILY_GAME_MAP[k]);
  const when = run.from === etToday() ? 'New today' : 'New this week';
  return (
    <div className="prm-scrim" {...scrimClose(onClose)}>
      <style dangerouslySetInnerHTML={{ __html: CSS + LAUNCH_CSS }} />
      <div className="prm" role="dialog" aria-labelledby="prm-t" style={vars} onClick={(e) => e.stopPropagation()}>
        <div className="prm-in">
          <div className="prm-top">
            <div className="prm-eye"><i /><span>{when} · Sudoku</span></div>
            <button className="prm-x" aria-label="Close" onClick={onClose}><X size={16} strokeWidth={2.8} /></button>
          </div>
          <h2 id="prm-t">{run.name}</h2>
          <p className="prm-lede">{run.lede}</p>
          <div className="sl-feat">
            <a className="sl-ft" href="/sudoku" onClick={onClose}>
              <MiniBoard n={6} bw={3} bh={2}
                cell={(r, k, x, y, c) => (LAUNCH_M6[r * 6 + k] === '1' && !LAUNCH_LINE.has(r + ',' + k)
                  ? <text key={r + '-' + k} x={x + c / 2} y={y + c / 2 + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="11" fill="#0b1220">{LAUNCH_S6[r][k]}</text> : null)}
                over={(c, pad) => { const p = (r, k) => `${pad + k * c + c / 2},${pad + r * c + c / 2}`; return <polyline points={`${p(1, 1)} ${p(2, 2)} ${p(2, 3)} ${p(1, 4)}`} fill="none" stroke="rgba(59,70,86,0.30)" strokeWidth={c * 0.38} strokeLinecap="round" strokeLinejoin="round" />; }} />
              <b>In 6x6</b><span>{small.length} new variants, about two minutes each</span>
            </a>
            <a className="sl-ft" href="/sudoku" onClick={onClose}>
              <MiniBoard n={9} bw={3} bh={3}
                cell={(r, k, x, y, c) => (LAUNCH_M9[r * 9 + k] === '1' ? <rect key={r + '-' + k} x={x} y={y} width={c} height={c} fill={LAUNCH_P9[(LAUNCH_S9[r][k] + 2) % 9]} /> : null)} />
              <b>In color</b><span>{color.length} games, a second daily for each</span>
            </a>
          </div>
          <div className="sl-sec">
            <div className="sl-h"><b>In 6x6</b><span>{small.length} new</span></div>
            <div className="sl-chips">
              {small.map((k) => (
                <a key={k} className="sl-chip" href={'/' + k} onClick={onClose}><span className="sl-six">6x6</span>{DAILY_GAME_MAP[k].name} <small>{SMALL_OF[k]}</small></a>
              ))}
            </div>
          </div>
          <div className="sl-sec">
            <div className="sl-h"><b>In color</b><span>{color.length} new</span></div>
            <div className="sl-chips">
              {color.map((k, j) => (
                <a key={k} className="sl-chip" href={'/' + k} onClick={onClose}>
                  <span className="sl-sw" aria-hidden="true">{[0, 1, 2, 3].map((q) => <i key={q} style={{ background: LAUNCH_P9[(j + q * 2) % 9] }} />)}</span>
                  {DAILY_GAME_MAP[k].name}
                </a>
              ))}
            </div>
          </div>
          <a className="prm-go" href={run.href} onClick={onClose}>See all 39 sudokus</a>
          <div className="sl-alt"><a href="/mercurytoo" onClick={onClose}>Play MercuryToo</a><a href="/gianttoo" onClick={onClose}>Play GiantToo</a></div>
          {run.foot ? <div className="prm-foot">{run.foot}</div> : null}
        </div>
      </div>
    </div>
  );
}

const LAUNCH_CSS = `
.sl-feat{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.sl-ft{display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:1px solid var(--stg-ink,#08222e);border-radius:14px;padding:10px 10px 12px;
  background:var(--prm-tint);color:inherit;text-decoration:none;}
.sl-ft svg{width:100%;height:auto;display:block;margin-bottom:6px;}
.sl-ft b{font-size:16px;font-weight:800;line-height:1.2;}
.sl-ft span{font-size:12px;font-weight:600;opacity:.78;line-height:1.3;}
.sl-sec{margin-top:14px;}
.sl-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:7px;}
.sl-h b{font-size:15px;font-weight:800;}
.sl-h span{font-size:12px;font-weight:700;opacity:.7;}
.sl-chips{display:flex;flex-wrap:wrap;gap:6px;}
.sl-chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;padding:6px 11px 6px 7px;border-radius:999px;
  border:1px solid var(--stg-ink,#08222e);background:var(--stg-surf,#ffffff);color:inherit;text-decoration:none;}
.sl-chip small{font-size:11px;font-weight:700;opacity:.65;}
.sl-six{font-size:10px;font-weight:800;padding:2px 5px;border-radius:999px;background:var(--prm-acc);color:var(--prm-on);}
.sl-sw{display:inline-grid;grid-template-columns:repeat(2,7px);grid-template-rows:repeat(2,7px);gap:1px;border-radius:3px;overflow:hidden;}
.sl-sw i{display:block;}
.sl-alt{display:flex;gap:8px;margin-top:8px;}
.sl-alt a{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:999px;border:1px solid var(--stg-ink,#08222e);
  color:inherit;font-size:14px;font-weight:800;text-decoration:none;}
.sl-ft:focus-visible,.sl-chip:focus-visible,.sl-alt a:focus-visible{outline:3px solid var(--stg-acc-ink,var(--stg-acc,#2563eb));outline-offset:2px;}
`;

function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

function dateLabel(iso) {
  if (!iso) return 'this week';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const CSS = `
.prm-scrim{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:16px;
  background:rgba(6,10,18,.58);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
.prm{width:min(460px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;position:relative;
  /* The dark look's --stg-surf is a 4.5% white wash, so on its own the card was
     see-through over the home tiles; it now sits on the page ground. */
  background:linear-gradient(var(--stg-surf,#ffffff),var(--stg-surf,#ffffff)),var(--stg-ground,#ffffff);color:var(--stg-ink,#08222e);border:1px solid var(--stg-ink,#08222e);border-radius:16px;
  padding:0;box-shadow:0 18px 50px rgba(0,0,0,.28);animation:prm-in .28s ease-out;
  font-family:'Manrope',system-ui,-apple-system,sans-serif;}
/* The scroller sits INSIDE the rounded frame (owner, 2026-11-08): a scrollbar on
   the frame itself squared off its right corners. */
.prm-in{overflow-y:auto;padding:18px 20px 18px;scrollbar-width:thin;}
@keyframes prm-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.prm{animation:none}}
.prm-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.prm-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;
  border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0;}
.prm-eye{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  padding:6px 11px;border-radius:999px;background:var(--prm-tint,color-mix(in srgb, currentColor 8%, transparent));}
.prm-eye i{width:8px;height:8px;border-radius:50%;background:var(--prm-acc,currentColor);box-shadow:0 0 0 1.5px var(--stg-ink,#08222e);display:inline-block;}
.prm h2{font-size:24px;font-weight:800;letter-spacing:-.015em;margin:14px 0 4px;line-height:1.15;text-wrap:balance;}
.prm-lede{margin:0 0 14px;font-size:14px;line-height:1.5;font-weight:600;opacity:.85;}
.prm-rows{display:flex;flex-direction:column;gap:8px;}
.prm-row{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;border:1px solid var(--stg-ink,#08222e);
  border-radius:14px;padding:8px 8px 8px 10px;background:var(--stg-surf,#ffffff);}
.prm-gl{width:44px;height:44px;border-radius:12px;background:var(--prm-acc,#7dd3fc);display:grid;place-items:center;color:var(--prm-on,#0b0f1a);}
.prm-t b{display:block;font-size:16px;font-weight:800;line-height:1.2;}
.prm-t span{display:block;font-size:12.5px;font-weight:600;opacity:.75;line-height:1.3;margin-top:1px;}
.prm-play{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 16px;border-radius:999px;
  border:1px solid var(--stg-ink,#08222e);background:var(--prm-acc,#7dd3fc);color:var(--prm-on,${RAMP_INK});
  font-size:14px;font-weight:800;text-decoration:none;white-space:nowrap;}
.prm-play:hover,.prm-go:hover{filter:brightness(1.04);}
.prm-go{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;margin-top:14px;box-sizing:border-box;
  border-radius:999px;border:1px solid var(--stg-ink,#08222e);background:var(--prm-acc,#7dd3fc);color:var(--prm-on,${RAMP_INK});
  font-size:16px;font-weight:800;text-decoration:none;}
.prm-tags{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px;}
.prm-tags span{font-size:12px;font-weight:800;padding:5px 11px;border-radius:999px;border:1px solid var(--stg-ink,#08222e);}
.prm-foot{margin-top:12px;font-size:12.5px;font-weight:600;opacity:.7;line-height:1.4;text-align:center;}
.prm-play:focus-visible,.prm-go:focus-visible,.prm-x:focus-visible{outline:3px solid var(--stg-acc-ink,var(--stg-acc,#2563eb));outline-offset:2px;}
@media (max-width:420px){
  .prm-in{padding:16px 14px 16px;}
  .prm-row{grid-template-columns:40px 1fr auto;gap:10px;}
  .prm-gl{width:40px;height:40px;}
  .prm-play{padding:0 13px;}
}
`;
