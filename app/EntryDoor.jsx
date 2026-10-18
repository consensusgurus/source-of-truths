'use client';

// THE ENTRY DOOR (owner, 2026-10-16). A first visit gets it on arrival, and a
// returning reader gets it again once a week (ENTRY_EVERY_MS). Every other
// visit opens straight on the home, with no arrival animation at all.
//
// It replaced app/StageWelcome.jsx, the once-a-day arrival that played the Ramp
// and then stamped the reader's own figures (IQ today, rank, streak, the two
// boards). The owner retired that whole sequence and the reads that fed it on
// the same day, so nothing here fetches anything: the only figures on screen are
// the games per skill, from the static registry.
//
// WHAT IT IS: the ten category bands rise and the ground wipes across them (the
// Ramp, kept as a one-time opening), the mark and the three brand lines land,
// and the curtain lifts onto "what do you want to sharpen today?" with one tile
// per SKILL (owner, 2026-10-16; lib/daily-skills.js). A tile opens the level
// and puzzle steps below (owner, 2026-10-18), which end on a game or a run.
// The button at the foot just closes the door onto the home as it is.
//
// ALWAYS DARK, whatever the reader's register (the door itself). The owner asked for the dark
// version for everyone, so every colour here is a literal on the near-black
// ground and the dark ramp, and none of it reads the stage tokens.
//
// THE KEY IS VERSIONED. A future change to who sees this takes a new key, never
// an edit to the gate, or every browser that stamped the old one is shut out.
// ?entry=1 previews it without stamping. A load carrying a #hash is a deep link
// to a section of the home, so it is not interrupted and nothing is stamped:
// the door simply waits for the next plain visit.
//
// IT HOLDS THE OTHER HOME CARDS BACK while it is up: data-sot-modal on <html>
// (GauntletPop and the rest read it) and the .ent-door class (PremierePop and
// the theme bubble poll for it).

// STEPS 2 AND 3 (owner, 2026-10-18). A skill tile no longer jumps to the home:
// it opens a LEVEL page (Gentle, Steady, Tough, or Surprise me, from the week's
// ratings in lib/daily-difficulty.js), then a page of TILES, today's runs for
// that skill first and then every game in it at that level, ranked by the
// whole site's plays over the last seven days. A tile goes straight to the
// game. On a Sunday a NEW visitor also gets a card saying today's boards are
// the week's Sunday Editions, with last Monday's boards from the archive as
// the gentler choice (/api/quiz/entry-boards); a returning reader knows the
// week and gets the level buttons alone.
//
// A NEW VISITOR LANDS IN DARK. Picking a tile from the door on a browser with
// no play footprint and no stored register, or proceeding to the home, stores
// 'dark' and leaves a pending light offer (LIGHT_OFFER_KEY), which
// app/ThemePop.jsx shows on the home cap or the game's start gate (never during
// play) until it is answered. Anyone who has played
// before keeps the register they have.

import { useEffect, useMemo, useRef, useState } from 'react';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { CATEGORY_RAMP, RAMP_INK, RAMP_ORDER, categoryColor } from '@/lib/category-ramp';
import { SKILLS, SKILL_MAP, skillPool, primarySkill } from '@/lib/daily-skills';
import { TIERS } from '@/lib/daily-difficulty';
import { GLYPHS, GLYPH_BOX } from '@/lib/game-glyphs';
import { DISPLAY_CIRCUITS, circuitKeysFor, runHref } from '@/lib/circuits';
import { hasSundayEdition, isSundayET } from '@/lib/sunday-editions';
import { LIGHT_OFFER_KEY, writeStageTheme } from '@/lib/stage-theme';
import MindLoftMark from './MindLoftMark';
import { etToday } from './useDayStats';

const KEY = 'sot_entry_v1';
// ONCE A WEEK (owner, 2026-10-16): the first visit, then a returning reader
// sees it again when a week has passed since it last showed. The key holds the
// time it last showed, in ms; any other value (or none) counts as never.
export const ENTRY_EVERY_MS = 7 * 24 * 3600 * 1000;
const LIFT_AT = 6600;   // the curtain's hold, then the lift (the three lines arrive one at a time)
const LIFT_MS = 640;

const LINES = ['Sharpen your mind', 'Gain IQ points', 'Elevate your thinking'];

// The level tiles' colours: three steps of the ramp plus the first for Surprise me.
const TIER_C = { gentle: CATEGORY_RAMP[1], steady: CATEGORY_RAMP[3], tough: CATEGORY_RAMP[5], any: CATEGORY_RAMP[0] };
// A run's one-line pitch on its tile. Falls back to the circuit's blurb.
const RUN_TAG = {
  deduction: 'Five logic cases, one law school verdict',
  dojo: 'Three sudokus, one score, a belt',
  room: 'The crowd games, one read of the room',
  math: 'Five math quizzes back to back, one life each',
  pricecheck: 'Five price guesses, one card',
  gauntlet: 'Seven trivia quizzes as one long run',
  triviaencore: 'The three trivia banks that sat out the Gauntlet',
  passport: 'One country, four legs, a passport',
};
const RUN_GLYPH = 'M3 7h8v4H3zM13 13h8v4h-8zM11 9h4v6';

function hasFootprint() {
  try {
    if (localStorage.getItem('sot_quiz_identity')) return true;
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i) || '';
      if (!k.startsWith('sot_')) continue;
      if (/^sot_(?!welcome_|hub_|theme|quiz_|vid_)[a-z]+_day$/.test(k)) return true;
      if (/^sot_(?!welcome_|hub_|theme|quiz_|vid_)[a-z]+_\d/.test(k)) return true;
    }
    return false;
  } catch (e) { return true; }
}

const fmtN = (n) => Number(n || 0).toLocaleString('en-US');
const catShort = (c) => (c === 'Crowd Psychology' ? 'Crowd' : c || '');
const tierOf = (r) => (r ? TIERS.find((t) => r >= t.lo && r <= t.hi) || null : null);
const inTier = (keys, ratings, t) => (t ? keys.filter((k) => { const r = ratings[k]; return r && r >= t.lo && r <= t.hi; }) : keys);
function monLabel(iso) {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) { return 'Monday'; }
}

function Glyph({ d }) {
  return (
    <svg viewBox={GLYPH_BOX} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d || ''} />
    </svg>
  );
}

export default function EntryDoor({ onPick }) {
  // null: not showing. 'cur': the curtain is up. 'lift': it is lifting.
  // 'page': the skill tiles. 'level': how hard. 'tiles': the puzzles.
  // Nothing renders on the server.
  const [phase, setPhase] = useState(null);
  const [skill, setSkill] = useState(null);
  const [tier, setTier] = useState('any');
  const [mon, setMon] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [data, setData] = useState(null);   // { ratings, week, monday }
  const [isNew, setIsNew] = useState(false);
  const [sunday, setSunday] = useState(false);
  const timers = useRef([]);
  const btnRef = useRef(null);
  const headRef = useRef(null);
  const stRef = useRef(null);
  const asked = useRef(false);

  const today = useMemo(() => { try { return etToday(); } catch (e) { return null; } }, [phase]);
  const phaseRef = useRef(null);
  phaseRef.current = phase;

  // Live games per skill (any listing), for the count on each tile.
  const counts = useMemo(() => {
    if (!phase) return {};
    const out = {};
    try { for (const sk of SKILLS) out[sk.id] = skillPool(sk.id, today).length; } catch (e) {}
    return out;
  }, [phase, today]);

  useEffect(() => {
    let preview = false;
    let fresh = false;
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('entry');
      preview = q === '1' || q === 'new' || q === 'ret';
      if (!preview) {
        if (q === '0') return undefined;
        const last = Number(window.localStorage.getItem(KEY)) || 0;
        if (last && Date.now() - last < ENTRY_EVERY_MS) return undefined;
        if (window.location.hash) return undefined;
        // A NEW visitor: first door on this browser, nothing played, no register stored.
        fresh = !last && !hasFootprint() && !window.localStorage.getItem('sot_theme2');
        window.localStorage.setItem(KEY, String(Date.now()));
      } else {
        // ?entry=1 or ?entry=new previews the new-visitor door; ?entry=ret the returning one.
        fresh = q !== 'ret';
      }
    } catch (e) {
      // Storage refused (private mode): the read failing is not evidence it was
      // seen, but a door on every load would be worse, so it stays shut.
      if (!preview) return undefined;
    }
    setIsNew(fresh);
    setSunday(isSundayET());
    let still = false;
    try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    setPhase(still ? 'page' : 'cur');
    if (!still) {
      timers.current.push(setTimeout(() => setPhase((p) => (p === 'cur' ? 'lift' : p)), LIFT_AT));
    }
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  // The lift ends on the page.
  useEffect(() => {
    if (phase !== 'lift') return undefined;
    const t = setTimeout(() => setPhase('page'), LIFT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // The week's ratings and plays are asked for once the skill page is up, so
  // they are in hand by the time a reader has picked a skill.
  useEffect(() => {
    if (phase !== 'page' || asked.current) return;
    asked.current = true;
    const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([
      j('/api/quiz/difficulty'),
      j('/api/quiz/my-plays'),
      sunday && isNew ? j('/api/quiz/entry-boards') : Promise.resolve(null),
    ]).then(([d, p, m]) => {
      setData({
        ratings: (d && d.ratings) || {},
        week: (p && p.week) || {},
        monday: m && m.boards && Object.keys(m.boards).length ? m : null,
      });
    });
  }, [phase, sunday, isNew]);

  // Hold the page still and the other cards back while the door is up.
  useEffect(() => {
    if (!phase) return undefined;
    const html = document.documentElement;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    try { html.dataset.sotModal = 'entry'; } catch (e) {}
    const onKey = (e) => { if (e.key === 'Escape') back(); };
    window.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prev;
      try { if (html.dataset.sotModal === 'entry') delete html.dataset.sotModal; } catch (e) {}
      window.removeEventListener('keydown', onKey);
    };
    // back only calls setPhase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!phase]);

  useEffect(() => {
    if (phase === 'page' && btnRef.current) {
      try { btnRef.current.focus({ preventScroll: true }); } catch (e) {}
    }
    if ((phase === 'level' || phase === 'tiles')) {
      try { if (stRef.current) stRef.current.scrollTop = 0; } catch (e) {}
      try { if (headRef.current) headRef.current.focus({ preventScroll: true }); } catch (e) {}
    }
  }, [phase]);

  // A NEW visitor lands in dark wherever the door sends them (owner,
  // 2026-10-18), with the light offer pending. Existing registers are kept.
  function landDark(live) {
    if (!isNew) return;
    try {
      if (window.localStorage.getItem('sot_theme2')) return;
      window.localStorage.setItem(LIGHT_OFFER_KEY, 'pending');
      if (live) { writeStageTheme('dark'); return; }
      window.localStorage.setItem('sot_theme2', 'dark');
      document.documentElement.setAttribute('data-stage-boot', 'dark');
    } catch (e) {}
  }
  function close() {
    landDark(true);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    try { window.__sotPopAt = Date.now(); } catch (e) {}
    setPhase(null);
  }
  // Escape steps back a page, and closes the door from the skill page.
  function back() {
    const p = phaseRef.current;
    if (p === 'tiles') setPhase('level');
    else if (p === 'level') setPhase('page');
    else close();
  }
  function skip() {
    setPhase((p) => (p === 'cur' ? 'lift' : p));
  }
  function pickSkill(id) {
    setSkill(id);
    setTier('any');
    setShowNew(false);
    setPhase('level');
  }
  function pickTier(id) {
    setTier(id);
    setShowNew(false);
    setPhase('tiles');
  }
  function toHome(id) {
    close();
    if (onPick) {
      try { requestAnimationFrame(() => onPick(id)); } catch (e) { onPick(id); }
    }
  }
  // Leaving the door for a game or a run. A new visitor lands in dark, with
  // the light offer pending for the game's start gate.
  function go(href) {
    landDark(false);
    try { window.__sotPopAt = Date.now(); } catch (e) {}
    window.location.assign(href);
  }

  // ---- step data ----
  const sk = skill ? SKILL_MAP[skill] : null;
  const ratings = (data && data.ratings) || {};
  const week = (data && data.week) || {};
  const monday = data && data.monday;
  const all = useMemo(() => (sk ? skillPool(sk.id, today) : []), [sk, today]);
  const sunN = useMemo(() => all.filter((k) => hasSundayEdition(k)).length, [all]);
  const showSun = isNew && sunday && sunN > 0;
  const monOn = showSun && mon && !!monday;

  const runs = useMemo(() => {
    if (!sk || !today) return [];
    const out = [];
    for (const c of DISPLAY_CIRCUITS) {
      let keys = [];
      try { keys = circuitKeysFor(c.id, today) || []; } catch (e) { keys = []; }
      if (!keys.length) continue;
      const n = {};
      for (const k of keys) { const p = primarySkill(k); if (p) n[p] = (n[p] || 0) + 1; }
      let best = primarySkill(keys[0]); let bn = 0;
      for (const [s, v] of Object.entries(n)) if (v > bn) { bn = v; best = s; }
      if (best !== sk.id) continue;
      const g0 = DAILY_GAME_MAP[keys[0]];
      out.push({
        id: c.id, name: c.name, tag: RUN_TAG[c.id] || c.blurb || '',
        color: categoryColor(g0 && g0.cat), href: runHref(c.id),
        names: keys.map((k) => (DAILY_GAME_MAP[k] && DAILY_GAME_MAP[k].name) || k),
      });
    }
    return out;
  }, [sk, today]);

  const t = tier === 'any' ? null : TIERS.find((x) => x.id === tier) || null;
  const pool = monOn ? all.filter((k) => monday.boards[k]) : all;
  const byPlays = (a, b) => (week[b] || 0) - (week[a] || 0) || String(a).localeCompare(String(b));
  const list = inTier(pool, ratings, t).slice().sort(byPlays);
  const unrated = t ? pool.filter((k) => !ratings[k]).sort(byPlays) : [];
  const shown = showNew ? list.concat(unrated) : list;
  const shownRuns = monOn ? [] : runs;

  if (!phase) return null;
  const curtain = phase === 'cur' || phase === 'lift';
  const steps = phase === 'level' || phase === 'tiles';

  const dots = (n) => (
    <div className="ent-dots" aria-label={`Step ${n} of 3`}>
      {[1, 2, 3].map((k) => <i key={k} className={k <= n ? 'on' : ''} />)}
    </div>
  );

  const levelTile = (x) => {
    const id = x ? x.id : 'any';
    const n = data ? inTier(pool, ratings, x).length : null;
    return (
      <button key={id} type="button" className="ent-lv" style={{ '--c': TIER_C[id] }} onClick={() => pickTier(id)}>
        <span className="ent-meter" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((k) => <i key={k} className={!x || k <= x.hi ? 'on' : ''} />)}
        </span>
        <b>{x ? x.label : 'Surprise me'}</b>
        <span className="ent-lsub">{x ? x.sub : 'Every level, most played first'}</span>
        <span className="ent-lct">{n == null ? ' ' : `${n} games`}<em aria-hidden="true">→</em></span>
      </button>
    );
  };

  const gameTile = (k, i) => {
    const g = DAILY_GAME_MAP[k];
    if (!g) return null;
    const r = ratings[k];
    const lvl = tierOf(r);
    const plays = week[k] || 0;
    const href = monOn ? monday.boards[k].href : g.href;
    const chip = monOn ? `${monLabel(monday.date)}` : (sunday && hasSundayEdition(k) ? 'Sunday Edition' : '');
    return (
      <li key={k} style={{ '--i': Math.min(i, 14) }}>
        <button type="button" className="ent-gt" style={{ '--c': categoryColor(g.cat) }} onClick={() => go(href)}
          aria-label={`${g.name}: ${g.tag}. Play`}>
          <span className="ent-disc"><Glyph d={GLYPHS[k]} /></span>
          <span className="ent-gnm"><b>{g.name}</b><span className="ent-rk">#{i + 1}</span></span>
          <span className="ent-gtg">{g.tag}</span>
          <span className="ent-gmeta">
            <span className="ent-pl">{plays ? `${fmtN(plays)} plays` : 'New'}</span>
            <span className="ent-gcat">{lvl ? lvl.label : 'Unrated'} {catShort(g.cat)}</span>
            {chip ? <span className="ent-chip">{chip}</span> : null}
          </span>
        </button>
      </li>
    );
  };

  const runTile = (r, i) => (
    <li key={r.id} style={{ '--i': i }}>
      <button type="button" className="ent-gt" style={{ '--c': r.color }} onClick={() => go(r.href)} aria-label={`${r.name}: ${r.tag}. Start the run`}>
        <span className="ent-disc"><Glyph d={RUN_GLYPH} /></span>
        <span className="ent-gnm"><b>{r.name}</b><span className="ent-rk">Run</span></span>
        <span className="ent-gtg">{r.tag}</span>
        <span className="ent-gmeta">
          <span className="ent-pl">{r.names.length} games</span>
          <span className="ent-gcat ent-gcl">{r.names.join(', ')}</span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="ent-door" role="dialog" aria-modal="true" aria-label="Welcome to Mind Loft">
      <style dangerouslySetInnerHTML={{ __html: CSS + CSS2 }} />
      {steps ? (
        <div className="ent-st" ref={stRef}>
          {phase === 'level' && sk ? (
            <div className="ent-stp" key="level">
              <div className="ent-top">
                <button type="button" className="ent-back" onClick={() => setPhase('page')}>← Skills</button>
                {dots(2)}
              </div>
              <div className="ent-hd">
                <span className="ent-skchip" style={{ '--c': CATEGORY_RAMP[sk.ramp] }}>{sk.name} · {all.length} games today</span>
                <h2 className="ent-h2" tabIndex={-1} ref={headRef}>How hard do you want it today?</h2>
              </div>
              {showSun ? (
                <section className="ent-sun" aria-label="Sunday boards">
                  <div>
                    <h3><span className="ent-pill">Sunday</span>Today is Sunday Edition day</h3>
                    <p><b>{sunN} of your {all.length} {sk.name} puzzles</b> run their Sunday Edition today: bigger boards, fewer givens and longer answers. They are the toughest boards of the week, whatever level you pick below.</p>
                  </div>
                  <div className="ent-pick" role="group" aria-label="Which boards">
                    <button type="button" aria-pressed={!mon} onClick={() => setMon(false)}>
                      <b>Today&apos;s Sunday boards</b><span>Bigger and harder. They count on today&apos;s leaderboard.</span>
                    </button>
                    {monday ? (
                      <button type="button" aria-pressed={mon} onClick={() => setMon(true)}>
                        <b>Last Monday&apos;s boards instead</b><span>{monLabel(monday.date)}, from the archive</span>
                      </button>
                    ) : null}
                    {monday ? (
                      <p className="ent-why">Why Monday: most of our dailies build in difficulty through the week, so Monday&apos;s boards are the gentlest. A good warm-up, but archive plays do not count toward today&apos;s leaderboard.</p>
                    ) : null}
                  </div>
                </section>
              ) : null}
              <div className="ent-lvs">
                {TIERS.map((x) => levelTile(x))}
                {levelTile(null)}
              </div>
              <p className="ent-fine">Levels come from last week&apos;s play: how many players finish a game and how long it takes them. They update every Sunday night.</p>
            </div>
          ) : null}
          {phase === 'tiles' && sk ? (
            <div className="ent-stp" key="tiles">
              <div className="ent-top">
                <button type="button" className="ent-back" onClick={() => setPhase('level')}>← Level</button>
                {dots(3)}
              </div>
              <div className="ent-hd">
                <span className="ent-skchip" style={{ '--c': CATEGORY_RAMP[sk.ramp] }}>{sk.name}</span>
                <h2 className="ent-h2" tabIndex={-1} ref={headRef}>{t ? t.label : 'Every level'}, most played this week</h2>
                <p className="ent-lede">
                  {shownRuns.length ? (shownRuns.length > 1 ? 'Today’s runs first, then puzzles' : 'Today’s run first, then puzzles') + ' ranked by plays over the last 7 days.' : 'Ranked by plays over the last 7 days.'} Pick one to start.
                </p>
              </div>
              <div className="ent-tierbar" role="group" aria-label="Level">
                {TIERS.map((x) => (
                  <button key={x.id} type="button" aria-pressed={tier === x.id} onClick={() => { setTier(x.id); setShowNew(false); }}>
                    {x.label} · {data ? inTier(pool, ratings, x).length : '…'}
                  </button>
                ))}
                <button type="button" aria-pressed={!t} onClick={() => { setTier('any'); setShowNew(false); }}>Every level · {pool.length}</button>
              </div>
              {monOn ? (
                <div className="ent-monbar">
                  <span>Showing last Monday&apos;s boards ({monLabel(monday.date)}). Archive plays do not count toward today&apos;s leaderboard.</span>
                  <button type="button" onClick={() => setMon(false)}>Switch to today&apos;s Sunday boards</button>
                </div>
              ) : null}
              {!data ? <div className="ent-empty">Loading this week&apos;s picks…</div> : null}
              {data && (shownRuns.length || shown.length) ? (
                <ul className="ent-gts">
                  {shownRuns.map((r, i) => runTile(r, i))}
                  {shown.map((k, i) => gameTile(k, i))}
                </ul>
              ) : null}
              {data && !shown.length ? (
                <div className="ent-empty">No {sk.name} games rated {t ? t.label : ''} last week. Try another level above.</div>
              ) : null}
              {data && t && unrated.length && !showNew ? (
                <div className="ent-more">
                  <span>{unrated.length} newer {sk.name} {unrated.length === 1 ? 'game is' : 'games are'} not rated yet.</span>
                  <button type="button" onClick={() => setShowNew(true)}>Show {unrated.length === 1 ? 'it' : 'them'} too</button>
                </div>
              ) : null}
              <div className="ent-tail">
                <button type="button" className="ent-link" onClick={() => toHome('sk:' + sk.id)}>See every {sk.name} puzzle on the home page <span aria-hidden="true">→</span></button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={'ent-pg' + (phase === 'page' ? ' rise' : '')} aria-hidden={curtain ? 'true' : undefined}>
          <h2 className="ent-ask">What do you want to sharpen today?</h2>
          <ul className="ent-tiles">
            {SKILLS.map((x, i) => {
              const n = counts[x.id] || 0;
              const meta = n ? `${n} games` : '';
              return (
                <li key={x.id} style={{ '--i': i }}>
                  <button type="button" className="ent-tile" style={{ '--c': CATEGORY_RAMP[x.ramp] }} onClick={() => pickSkill(x.id)}
                    aria-label={`${x.name}: choose a level`}>
                    <span className="ent-sk">
                      {x.short ? <><span className="ent-cl">{x.name}</span><span className="ent-cs">{x.short}</span></> : x.name}
                    </span>
                    <span className="ent-meta">
                      <span>{meta}</span>
                      <span className="ent-go" aria-hidden="true">→</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="ent-foot">
            <button type="button" ref={btnRef} className="ent-go-all" onClick={close}>
              Proceed to all of today&apos;s puzzles <span aria-hidden="true">→</span>
            </button>
            <p className="ent-h">
              Loft your Mind in the{' '}
              <span className="ent-bn">
                <span className="ent-mk"><MindLoftMark size="1em" ink="#eef2f9" accent="#7dd3fc" title="" /></span>
                Mind <span className="ent-loft">Loft</span>
              </span>
            </p>
          </div>
        </div>
      )}

      {curtain ? (
        <div className={'ent-cur run' + (phase === 'lift' ? ' lift' : '')} onClick={skip} aria-hidden="true">
          <div className="ent-bands">
            {RAMP_ORDER.map((c, i) => <span key={c} style={{ '--c': CATEGORY_RAMP[i], '--i': i }} />)}
          </div>
          <div className="ent-wipe" />
          <div className="ent-say">
            <div className="ent-word">
              <MindLoftMark size="1.2em" ink="#eef2f9" accent="#7dd3fc" title="" />
              <span>Mind <span className="ent-loft">Loft</span></span>
            </div>
            <div className="ent-lines">
              {LINES.map((l, i) => <span key={l} style={{ '--i': i }}>{l}</span>)}
            </div>
          </div>
          <div className="ent-ladder">
            {RAMP_ORDER.map((c, i) => <i key={c} style={{ '--c': CATEGORY_RAMP[i], '--i': i }} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const CSS2 = `
.ent-st{position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
.ent-stp{box-sizing:border-box;min-height:100%;display:flex;flex-direction:column;gap:20px;max-width:1080px;margin:0 auto;
  padding:max(22px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(28px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));
  animation:ent-up .4s cubic-bezier(.2,.7,.2,1) both}
@media (min-width:761px){.ent-stp{padding-left:48px;padding-right:48px}}
.ent-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.ent-back{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#a7b1c4;font:inherit;font-weight:700;font-size:14px;cursor:pointer;padding:6px 2px;border-radius:6px}
.ent-back:hover{color:#eef2f9}
.ent-dots{display:flex;align-items:center;gap:6px}
.ent-dots i{width:22px;height:4px;border-radius:2px;background:rgba(255,255,255,.12)}
.ent-dots i.on{background:#7dd3fc}
.ent-hd{display:flex;flex-direction:column;gap:10px}
.ent-skchip{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--c);letter-spacing:.01em}
.ent-skchip::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--c)}
.ent-h2{margin:0;font-size:clamp(26px,3.6vw,40px);line-height:1.1;font-weight:800;letter-spacing:-.03em;text-wrap:balance;color:#eef2f9;outline:none}
.ent-lede{margin:0;font-size:15px;color:#a7b1c4;line-height:1.5;max-width:60ch}
.ent-sun{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;padding:18px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.11)}
.ent-sun h3{margin:0 0 6px;font-size:16px;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;color:#eef2f9}
.ent-pill{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:#e8b43a;color:${RAMP_INK};padding:3px 7px;border-radius:4px}
.ent-sun p{margin:0;font-size:13.5px;line-height:1.55;color:#a7b1c4}
.ent-sun p b{color:#eef2f9;font-weight:700}
.ent-pick{display:flex;flex-direction:column;gap:8px}
.ent-pick button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:11px 13px;border-radius:10px;border:1.5px solid rgba(255,255,255,.14);background:transparent;cursor:pointer;font:inherit;color:#eef2f9}
.ent-pick button b{font-size:14.5px;font-weight:800}
.ent-pick button span{font-size:12.5px;color:#a7b1c4;font-weight:600}
.ent-pick button[aria-pressed="true"]{border-color:#7dd3fc;background:rgba(125,211,252,.08)}
.ent-pick .ent-why{font-size:12.5px;color:#8b95a8;line-height:1.5;margin:2px 2px 0}
.ent-lvs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.ent-lv{display:flex;flex-direction:column;gap:10px;text-align:left;padding:16px;border-radius:10px;border:0;background:var(--c);color:${RAMP_INK};cursor:pointer;min-height:156px;font:inherit;transition:transform .18s ease,box-shadow .18s ease}
.ent-lv:hover{transform:translateY(-3px);box-shadow:0 12px 26px -14px rgba(0,0,0,.7)}
.ent-meter{display:flex;gap:4px}
.ent-meter i{width:16px;height:6px;border-radius:3px;background:rgba(8,34,46,.2)}
.ent-meter i.on{background:${RAMP_INK}}
.ent-lv b{font-size:20px;font-weight:800;letter-spacing:-.02em}
.ent-lsub{font-size:13px;line-height:1.45;font-weight:700}
.ent-lct{margin-top:auto;display:flex;justify-content:space-between;font-size:12.5px;font-weight:800}
.ent-lct em{font-style:normal;transition:transform .18s ease}
.ent-lv:hover .ent-lct em{transform:translateX(3px)}
.ent-fine{font-size:12.5px;color:#8b95a8;line-height:1.5;margin:0}
.ent-tierbar{display:flex;flex-wrap:wrap;gap:6px}
.ent-tierbar button{border:1px solid rgba(255,255,255,.14);background:transparent;border-radius:999px;padding:7px 13px;font:inherit;font-size:13px;font-weight:700;color:#a7b1c4;cursor:pointer}
.ent-tierbar button[aria-pressed="true"]{background:#eef2f9;color:#0b0f1a;border-color:#eef2f9}
.ent-monbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px;padding:11px 14px;border-radius:10px;background:rgba(232,180,58,.1);border:1px solid rgba(232,180,58,.35);font-size:13.5px;font-weight:600;color:#f3d48a}
.ent-monbar button{border:0;background:transparent;color:#eef2f9;font:inherit;font-weight:800;font-size:13px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ent-gts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;list-style:none;margin:0;padding:0}
.ent-gts li{display:flex;min-width:0;animation:ent-up .45s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i) * .03s)}
.ent-gt{flex:1;min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto 1fr;column-gap:12px;row-gap:3px;text-align:left;padding:14px;border-radius:10px;border:0;background:var(--c);color:${RAMP_INK};cursor:pointer;font:inherit;transition:transform .18s ease,box-shadow .18s ease}
.ent-gt:hover{transform:translateY(-3px);box-shadow:0 12px 26px -14px rgba(0,0,0,.7)}
.ent-disc{grid-row:1 / span 2;width:42px;height:42px;border-radius:10px;background:rgba(8,34,46,.1);display:grid;place-items:center}
.ent-disc svg{width:26px;height:26px}
.ent-gnm{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.ent-gnm b{font-size:17px;font-weight:800;letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ent-rk{font-size:11.5px;font-weight:800;font-variant-numeric:tabular-nums}
.ent-gtg{font-size:12.5px;font-weight:700;line-height:1.35;min-width:0}
.ent-gmeta{grid-column:1 / -1;align-self:end;display:flex;flex-wrap:nowrap;white-space:nowrap;align-items:center;gap:6px 10px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(8,34,46,.25);font-size:12px;font-weight:700}
.ent-pl{font-weight:800;font-variant-numeric:tabular-nums}
.ent-gcat{min-width:0;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase;letter-spacing:.06em;font-size:11px;font-weight:800}
.ent-gcl{text-transform:none;letter-spacing:0;font-size:12px;font-weight:700}
.ent-chip{margin-left:auto;flex:none;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 6px;border-radius:4px;background:${RAMP_INK};color:var(--c)}
.ent-more{border:1px dashed rgba(255,255,255,.18);border-radius:10px;padding:12px 14px;font-size:13px;color:#a7b1c4;font-weight:600;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
.ent-more button,.ent-link{border:0;background:transparent;color:#7dd3fc;font:inherit;font-weight:800;cursor:pointer;font-size:13.5px;padding:4px 0}
.ent-empty{padding:24px;border-radius:12px;background:rgba(255,255,255,.045);color:#a7b1c4;font-size:14px;line-height:1.5}
.ent-tail{display:flex;justify-content:center;padding-top:4px}
.ent-back:focus-visible,.ent-lv:focus-visible,.ent-gt:focus-visible,.ent-pick button:focus-visible,.ent-tierbar button:focus-visible,.ent-more button:focus-visible,.ent-link:focus-visible,.ent-monbar button:focus-visible{outline:3px solid #eef2f9;outline-offset:3px}
@media (min-width:1000px){.ent-gts{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:760px){
  .ent-stp{gap:16px}
  .ent-sun{grid-template-columns:minmax(0,1fr);padding:15px;gap:12px}
  .ent-lvs{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .ent-lv{min-height:0;padding:13px;gap:7px}
  .ent-lv b{font-size:17px}
  .ent-lsub{font-size:12px}
  .ent-gt{padding:12px}
  .ent-gmeta{margin-top:8px;padding-top:8px}
}
@media (max-width:599px){.ent-gts{grid-template-columns:minmax(0,1fr);gap:8px}}
@media (prefers-reduced-motion:reduce){.ent-stp,.ent-gts li{animation:none!important}}
`;

const INK = RAMP_INK;
const CSS = `
.ent-door{position:fixed;inset:0;z-index:6000;background:#0b0f1a;color:#eef2f9;font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
.ent-pg{position:absolute;inset:0;box-sizing:border-box;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(16px,3.4vh,34px);
  padding:max(28px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(24px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.ent-ask{margin:0;font-size:clamp(30px,4.2vw,50px);line-height:1.1;font-weight:800;letter-spacing:-0.03em;text-align:center;text-wrap:balance;max-width:900px;color:#eef2f9}
.ent-foot{display:flex;flex-direction:column;align-items:center;gap:14px}
.ent-h{margin:0;font-size:clamp(17px,1.7vw,21px);font-weight:700;color:#a7b1c4;text-align:center;letter-spacing:-0.01em}
.ent-bn{white-space:nowrap;color:#eef2f9}
.ent-mk{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;margin-right:.16em}
.ent-loft{color:#7dd3fc}
.ent-tiles{width:100%;max-width:960px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;list-style:none;margin:0;padding:0}
.ent-tiles li{display:flex;min-width:0}
.ent-tile{flex:1;min-width:0;min-height:128px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;text-align:left;padding:16px 16px 14px;border:0;border-radius:10px;cursor:pointer;
  font:inherit;background:var(--c);color:${INK};transition:transform .18s ease,box-shadow .18s ease}
.ent-tile:hover{transform:translateY(-3px);box-shadow:0 12px 26px -14px rgba(0,0,0,.7)}
.ent-tile:focus-visible{outline:3px solid #eef2f9;outline-offset:3px}
.ent-sk{font-size:19px;font-weight:800;letter-spacing:-0.015em;line-height:1.15}
.ent-meta{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:12.5px;font-weight:700}
.ent-meta b{font-weight:800;font-variant-numeric:tabular-nums}
.ent-cs{display:none}
.ent-go{transition:transform .18s ease}
.ent-tile:hover .ent-go{transform:translateX(3px)}
.ent-go-all{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:16px 28px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-weight:700;font-size:16px;
  background:#7dd3fc;color:${INK};transition:background .18s ease}
.ent-go-all:hover{background:#bae6fd}
.ent-go-all:focus-visible{outline:3px solid #eef2f9;outline-offset:3px}
/* ONE ENTRANCE, NOT TWO (owner, 2026-10-17). The page sits under the curtain, so
   the lift used to uncover it fully drawn and then the rise below played it in again.
   It stays invisible until the rise starts; reduced motion lands on 'page' directly. */
.ent-pg:not(.rise){opacity:0}
.ent-pg.rise .ent-ask,.ent-pg.rise .ent-tiles li,.ent-pg.rise .ent-foot{animation:ent-up .55s cubic-bezier(.2,.7,.2,1) both}
.ent-pg.rise .ent-tiles li{animation-delay:calc(.12s + var(--i) * .04s)}
.ent-pg.rise .ent-foot{animation-delay:.6s}
.ent-pg.rise .ent-mk{animation:ent-mk .7s cubic-bezier(.2,.9,.25,1.2) .8s both}
@keyframes ent-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes ent-mk{from{opacity:0;transform:translateX(-.6em) scale(.7)}to{opacity:1;transform:none}}

.ent-cur{position:absolute;inset:0;z-index:2;background:#0b0f1a;overflow:hidden;cursor:pointer}
.ent-bands{position:absolute;inset:0;display:flex}
.ent-bands span{flex:1;background:var(--c);transform:translateY(101%)}
.ent-wipe{position:absolute;inset:0;background:#0b0f1a;transform:scaleX(0);transform-origin:left}
.ent-say{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 20px}
.ent-word{display:flex;align-items:center;gap:14px;font-size:clamp(32px,6vw,54px);font-weight:800;letter-spacing:-0.035em;opacity:0}
.ent-lines{display:flex;flex-direction:column;gap:8px;font-size:clamp(18px,2.5vw,23px);font-weight:600;color:#a7b1c4}
.ent-lines span{opacity:0}
.ent-ladder{position:absolute;left:0;right:0;bottom:0;height:6px;display:flex;opacity:0}
.ent-ladder i{flex:1;background:var(--c);opacity:.25}
.ent-cur.run .ent-bands span{animation:ent-rise .55s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * .06s)}
.ent-cur.run .ent-wipe{animation:ent-wipe .5s cubic-bezier(.7,0,.2,1) 1.15s forwards}
.ent-cur.run .ent-word{animation:ent-stamp .5s cubic-bezier(.2,.9,.25,1.2) 1.6s forwards}
/* ONE AT A TIME (owner, 2026-10-16): each line rises in on its own, 1.1s apart. */
.ent-cur.run .ent-lines span{animation:ent-line .8s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:calc(2.4s + var(--i) * 1.1s)}
.ent-cur.run .ent-ladder{animation:ent-fade .3s ease 2.1s forwards}
.ent-cur.run .ent-ladder i{animation:ent-rung 1.1s ease-in-out infinite;animation-delay:calc(2.1s + var(--i) * .09s)}
.ent-cur.lift{animation:ent-lift ${LIFT_MS}ms cubic-bezier(.7,0,.2,1) forwards}
@keyframes ent-rise{to{transform:translateY(0)}}
@keyframes ent-wipe{to{transform:scaleX(1)}}
@keyframes ent-stamp{from{opacity:0;transform:scale(1.12)}to{opacity:1;transform:none}}
@keyframes ent-fade{to{opacity:1}}
@keyframes ent-line{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes ent-rung{0%,100%{opacity:.25}40%{opacity:1}}
@keyframes ent-lift{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 100% 0)}}

/* A PHONE FITS ON ONE SCREEN (owner, 2026-10-16). The tiles take whatever height
   the headline and the button leave, five rows of two, so the button is always
   on screen without scrolling. */
@media (max-width:760px){
  .ent-pg{justify-content:flex-start;gap:clamp(12px,2.4vh,22px);padding-top:max(22px,env(safe-area-inset-top,0px));padding-bottom:max(16px,env(safe-area-inset-bottom,0px))}
  .ent-ask{font-size:clamp(26px,8vw,34px)}
  .ent-foot{width:100%;gap:12px}
  .ent-h{font-size:clamp(15px,4.3vw,18px)}
  .ent-tiles{flex:1 1 auto;min-height:0;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,minmax(52px,1fr));gap:8px}
  .ent-tile{min-height:0;gap:6px;padding:11px 12px 10px}
  .ent-sk{font-size:16.5px}
  .ent-meta{font-size:12px}
  .ent-cl{display:none}
  .ent-cs{display:inline}
  .ent-go-all{width:100%;flex:none;padding:15px 18px}
}
@media (max-width:760px) and (max-height:600px){
  .ent-tile{padding:8px 11px}
  .ent-sk{font-size:15px}
}
@media (prefers-reduced-motion:reduce){
  .ent-pg.rise *, .ent-pg.rise .ent-mk{animation:none!important}
}
`;
