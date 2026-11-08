"use client";

// PremierePop — the once-per-launch card for a RETURNING player who has not
// yet played a daily that just premiered (owner, 2026-09-01). Built for Thread
// and Focus; any later launch is one line in PREMIERES (lib/daily-games.js).
//
// It is the second unasked-for thing on the site after the 8/30 cleanup left
// only the Gauntlet nudge, so it says exactly three things: which games are
// new, one line each on what they are, and Play. The X closes it.
//
// FOUR CONDITIONS, all required:
//
//   OPEN. Today (ET) is inside a premiere's [from, until] window. A premiere
//   past its `until` is silent forever; nobody back after a month is handed a
//   stack of old launches.
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
//   ONCE. sot_premiere_<key> is stamped the moment it renders, per game, per
//   browser, never per day. Seeing the card burns every game on it.
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

const KEY = (k) => `sot_premiere_${k}`;

// FRESH ONLY (owner report, 2026-09-17: "it served a popup for old games").
// A browser that had never been stamped was handed every open window at once:
// Snug from 9/13 on the same card as that day's Yose and Crib, under Snug's
// date and category. Now the card names only the NEWEST launch batch, and only
// while that batch is at most MAX_AGE_DAYS old, whatever `until` says.
const MAX_AGE_DAYS = 2;
function daysAgo(iso, today) {
  const a = Date.parse(`${iso}T12:00:00Z`), b = Date.parse(`${today}T12:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86400000) : 99;
}
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

function arrivalBusy() {
  // The first-load theme flip is RETIRED and no longer stamps sot_theme_intro2
  // (lib/stage-theme.js), so waiting on that key held this card back forever
  // for every browser that arrived after 2026-09-01. The theme bubble that
  // replaced it is read off the DOM instead, like everything else here.
  // .gpp-scrim: the Groups launch card (app/GroupsPop.jsx). Never two cards at once.
  return !!document.querySelector('.ent-door, .gpp-scrim, .stg-tpop');
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
    const open = PREMIERES.filter((p) => today >= p.from && today <= p.until && DAILY_GAME_MAP[p.key] && !NO_PREMIERE.has(p.key) && !runMembers.has(p.key));
    if (!open.length && !runOpen.length) return;
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
        if (!force) for (const k of [runCand.id, ...runCand.keys, ...open.map((p) => p.key)]) { try { localStorage.setItem(KEY(k), today); } catch (e) {} }
        setRun(runCand);
      };
      timers.push(setTimeout(tick, 600));
      return () => { alive = false; timers.forEach(clearTimeout); };
    }
    if (!open.length) return;

    let cands = open.map((p) => p.key).filter((k) => force || (!playedLocally(k) && !safeGet(KEY(k))));
    if (!cands.length) return;
    const fromOf = (k) => (PREMIERES.find((p) => p.key === k) || {}).from || '';

    const timers = [];
    fetchDayStatus().then((d) => {
      if (!alive) return;
      if (d && d.archive && !force) {
        cands = cands.filter((k) => !(d.archive[k] && d.archive[k].played > 0));
      }
      if (!cands.length) return;
      // The newest batch only, and only while it is fresh.
      const newest = cands.map(fromOf).sort().pop();
      if (!force && daysAgo(newest, today) > MAX_AGE_DAYS) return;
      cands = cands.filter((k) => fromOf(k) === newest);
      if (!cands.length) return;
      // Wait out the arrival, then open. Give up after ~15s rather than open
      // onto a page the reader has already started using.
      const started = Date.now();
      const tick = () => {
        if (!alive) return;
        if (arrivalBusy() && Date.now() - started < 15000) { timers.push(setTimeout(tick, 300)); return; }
        if (Date.now() - started >= 15000 && arrivalBusy()) return;
        if (gameActive()) return;
        // Stamp every open premiere, not just the ones on the card, so an
        // older launch left off it never turns up on a later visit.
        if (!force) for (const k of open.map((p) => p.key)) { try { localStorage.setItem(KEY(k), today); } catch (e) {} }
        setGames(cands);
      };
      timers.push(setTimeout(tick, 600));
    });
    return () => { alive = false; timers.forEach(clearTimeout); };
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
      <div className="prm-scrim" onClick={() => setRun(null)}>
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
    <div className="prm-scrim" onClick={() => setGames(null)}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="prm" role="dialog" aria-labelledby="prm-t" style={vars} onClick={(e) => e.stopPropagation()}>
        <div className="prm-in">
        <div className="prm-top">
          <div className="prm-eye"><i /><span>{when === 'today' ? 'New today' : 'New this week'}{oneCat ? ` · ${cat}` : ''}</span></div>
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
    <div className="prm-scrim" onClick={onClose}>
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
