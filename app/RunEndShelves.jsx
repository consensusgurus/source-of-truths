'use client';
// WHAT TO PLAY NEXT, UNDER EVERY RUN ENDING (owner, 2026-11-09, "Run ending:
// summary up top, what to play next", direction B, approved "push to live for
// all run endings"). The run's result shrinks to one summary card at the top
// (GauntletEndStage); everything under it is the rest of the site:
//
//   RUNS     the runs not finished today, drawn as the home's Details run
//            tiles (RunGateTile), the "One quick play next" run first, then
//            More Runs, which unfolds the rest in place, and Build a Run.
//   PUZZLES  today's open dailies as the home's Details cards: the board
//            drawing in a square, the name, at most two chips, the skills,
//            the description and the crowd strip (leader and plays, always
//            both). "Picked for you" leads with the run's own category, the
//            gentler boards, then the busiest; a chip per category filters.
//
// Every figure here is the crowd's, never the reader's own score (the home
// tile rule). Reads: the day board the home already caches (dailyBoardClient),
// the week's difficulty, and one cached board per run shown.

import { useEffect, useMemo, useRef, useState } from 'react';
import RunGateTile, { RGT_CSS, MoreRunsTile, BuildRunTile } from './today/RunGateTile';
import GamePreview, { GP_CSS } from './GamePreview';
import { RUN_DOORS, runDoneToday } from './circuits/RunDoorPop';
import { RUN_ORDER } from './circuits/MoreRuns';
import { DISPLAY_CIRCUITS, circuitKeysFor, circuitEntryHref } from '@/lib/circuits';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { categoryColor, categoryAccentInkLight } from '@/lib/category-ramp';
import { gameBlurb } from '@/lib/game-blurbs';
import { gameFacts, FACT_ICONS } from '@/lib/game-facts';
import { SKILL_MAP, SKILL_TAGS } from '@/lib/daily-skills';
import { TIERS as DIFF_TIERS } from '@/lib/daily-difficulty';
import { fetchDailyBoard, dailyBoardQuery, dailyBoardIdentity } from './dailyBoardClient';

const CAT_ORDER = ['Word', 'Numbers', 'Logic', 'Visual', 'Sudoku', 'Trivia', 'Geography', 'Table Games', 'Crowd Psychology', 'Arcade'];

function etDay() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function playedToday(key, day) {
  try {
    const b = JSON.parse(localStorage.getItem(`sot_${key}_day`) || 'null');
    return !!(b && b.d === day && b.done);
  } catch (e) { return false; }
}
function catOfGames(games) {
  const t = {};
  for (const g of games) if (g && g.cat) t[g.cat] = (t[g.cat] || 0) + 1;
  return Object.keys(t).sort((a, b) => t[b] - t[a])[0] || null;
}
function descOf(g) {
  const b = gameBlurb(g.key);
  if (b) return b;
  const t = String(g.how || g.tagLong || g.tag || '').trim();
  return t.split(/(?<=[.!?])\s+/)[0] || '';
}
function skillLine(key) {
  return (SKILL_TAGS[key] || []).map((id) => SKILL_MAP[id] && SKILL_MAP[id].name).filter(Boolean).join(' · ');
}

// The home's Details card, drawn on its own so it reads the same off the home.
function DetailCard({ g, day, diff }) {
  const plays = day ? Number(day.plays || day.field) || 0 : 0;
  const lead = day && Array.isArray(day.board) && day.board[0] ? day.board[0] : null;
  const r = diff && Number(diff[g.key]);
  const tier = r ? DIFF_TIERS.find((t) => r >= t.lo && r <= t.hi) : null;
  const facts = gameFacts(g.key).slice(0, tier ? 1 : 2);
  const full = categoryColor(g.cat);
  const deep = categoryAccentInkLight(g.cat);
  return (
    <a className="rbd" href={g.href} style={{ '--cfull': full, '--gpd': deep, '--gpm': full, '--gpw': '#fff', '--gpt': `color-mix(in srgb, ${full} 30%, #fff)` }}>
      <span className="rbd-b" aria-hidden="true"><GamePreview gameKey={g.key} square /></span>
      <span className="rbd-n">{g.name}</span>
      <span className="rbd-fx">
        {facts.map((f) => (
          <span key={f.ic} className="rbd-fc">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={FACT_ICONS[f.ic]} /></svg>{f.tx}
          </span>
        ))}
        {tier ? (
          <span className="rbd-fc" title={`Difficulty ${r} of 5 this week: ${tier.sub}`}>
            <span className="rbd-fm" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= r ? 'on' : ''} style={{ height: 3 + i * 2 }} />)}</span>{tier.label}
          </span>
        ) : null}
      </span>
      <span className="rbd-k">{skillLine(g.key) || ' '}</span>
      <span className="rbd-x">{descOf(g)}</span>
      <span className="rbd-s">
        <span className="ld">{lead ? <>#1 <b>{lead.username}</b></> : plays ? 'No solve yet' : 'Open. Be first.'}</span>
        <span className="ct">{plays.toLocaleString('en-US')} playing</span>
      </span>
    </a>
  );
}

export default function RunEndShelves({ selfId = null, legKeys = [], firstHref = null, groundHue = null, phone = false }) {
  const [day, setDay] = useState(null);
  const [board, setBoard] = useState(null);
  const [diff, setDiff] = useState(null);
  const [runStat, setRunStat] = useState({});
  const [runsOpen, setRunsOpen] = useState(false);
  const [cat, setCat] = useState('for');
  // ONE ROW OF RUNS (owner, 2026-11-09: "as it narrows, other runs should
  // disappear, don't let the page wrap ... with only one box on the second
  // row"). The row's width decides how many tiles fit; More Runs takes the
  // last slot, and the puzzles fill whole rows of the same count.
  const wrapRef = useRef(null);
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const read = () => {
      const w = el.getBoundingClientRect().width;
      const n = Math.max(1, Math.min(4, Math.floor((w + 14) / (240 + 14))));
      setCols((v) => (v === n ? v : n));
    };
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, []);
  useEffect(() => { setDay(etDay()); }, []);
  useEffect(() => {
    let alive = true;
    fetchDailyBoard(dailyBoardQuery(dailyBoardIdentity()))
      .then((d) => { if (alive && d) setBoard(d); }).catch(() => {});
    fetch('/api/quiz/difficulty').then((r) => r.json())
      .then((d) => { if (alive) setDiff((d && d.ratings) || {}); }).catch(() => { if (alive) setDiff({}); });
    return () => { alive = false; };
  }, []);
  const legSet = useMemo(() => new Set(legKeys), [legKeys.join(',')]);   // eslint-disable-line react-hooks/exhaustive-deps
  const selfCat = useMemo(() => catOfGames(legKeys.map((k) => DAILY_GAME_MAP[k]).filter(Boolean)), [legKeys.join(',')]);   // eslint-disable-line react-hooks/exhaustive-deps

  // RUNS: the designed runs (a door each), not this one, not finished today.
  const runs = useMemo(() => {
    if (!day) return [];
    const order = (id) => { const i = RUN_ORDER.indexOf(id); return i < 0 ? 99 : i; };
    return DISPLAY_CIRCUITS
      .filter((c) => c.id !== selfId && RUN_DOORS[c.id] && !runDoneToday(c.id))
      .map((c) => {
        let keys = [];
        try { keys = circuitKeysFor(c.id, day) || []; } catch (e) { keys = []; }
        const games = keys.map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
        if (!games.length) return null;
        const n = games.filter((g) => playedToday(g.key, day)).length;
        return { id: c.id, name: c.name, games, n, cat: catOfGames(games), href: circuitEntryHref(c.id) };
      })
      .filter(Boolean)
      .sort((a, b) => ((b.href === firstHref) - (a.href === firstHref))
        || ((b.cat === selfCat) - (a.cat === selfCat))
        || (order(a.id) - order(b.id)));
  }, [day, selfId, firstHref, selfCat]);
  const one = phone || cols < 2;
  const slots = one ? 3 : cols;
  const leadN = runs.length > slots ? slots - 1 : runs.length;
  const leads = runs.slice(0, leadN);
  const rest = runs.slice(leadN);
  const shownRuns = runsOpen ? runs : leads;
  const runKey = shownRuns.map((c) => c.id).join(',');
  useEffect(() => {
    let alive = true;
    for (const c of shownRuns) {
      if (runStat[c.id]) continue;
      fetch(`/api/quiz/daily-combined?circuit=${encodeURIComponent(c.id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!alive || !d) return;
          const top = Array.isArray(d.overall) ? d.overall.find((x) => x && x.rank === 1 && x.username) : null;
          setRunStat((m) => ({ ...m, [c.id]: { players: d.overallField || (Array.isArray(d.overall) ? d.overall.length : 0), lead: top ? top.username : null } }));
        })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [runKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const done = useMemo(() => {
    const s = new Set();
    if (!day) return s;
    for (const c of runs) for (const g of c.games) if (playedToday(g.key, day)) s.add(g.key);
    return s;
  }, [runs, day]);
  const tile = (c) => {
    const st = runStat[c.id] || {};
    return (
      <RunGateTile key={c.id} c={c} href={c.href} cat={c.cat} className="rbs-rgt"
        plain={!!groundHue && !!c.cat && categoryColor(c.cat) === groundHue}
        lead={st.lead} plays={st.players} fin={false} done={done} />
    );
  };

  // PUZZLES: today's live dailies, not finished here and not in this run.
  const byKey = useMemo(() => {
    const m = {};
    for (const x of (board && Array.isArray(board.games) ? board.games : [])) if (x && x.key) m[x.key] = x;
    return m;
  }, [board]);
  const open = useMemo(() => {
    if (!day) return [];
    return liveDailyKeys(day)
      .filter((k) => !legSet.has(k) && !playedToday(k, day))
      .map((k) => DAILY_GAME_MAP[k]).filter((g) => g && g.href);
  }, [day, legSet]);
  const cats = useMemo(() => {
    const have = new Set(open.map((g) => g.cat));
    return CAT_ORDER.filter((c) => have.has(c));
  }, [open]);
  const plays = (g) => Number((byKey[g.key] || {}).plays) || 0;
  const picks = useMemo(() => {
    const list = cat === 'for' ? open.slice() : open.filter((g) => g.cat === cat);
    const hard = (g) => { const r = diff && Number(diff[g.key]); return r && r >= 4 ? 1 : 0; };
    list.sort((a, b) => (cat === 'for' ? ((b.cat === selfCat) - (a.cat === selfCat)) || (hard(a) - hard(b)) : 0)
      || (plays(b) - plays(a)) || a.name.localeCompare(b.name));
    return list.slice(0, one ? 4 : cols * 2);
  }, [open, cat, diff, byKey, selfCat, one, cols]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rbs" ref={wrapRef} style={{ '--rbs-cols': one ? 1 : cols }}>
      <style dangerouslySetInnerHTML={{ __html: RGT_CSS + GP_CSS + CSS }} />
      {runs.length ? (
        <section className="rbs-sec" aria-label="Runs you have not played today">
          <div className="rbs-h"><span className="rbs-lab">Runs you haven&rsquo;t played today</span><a href="/circuits">All runs</a></div>
          <div className="rbs-runs">
            {shownRuns.map(tile)}
            {rest.length && !runsOpen ? (
              <MoreRunsTile rest={rest} open={runsOpen} onToggle={() => setRunsOpen(true)}
                players={(c) => (runStat[c.id] || {}).players} colorOf={(c) => (c.cat ? categoryColor(c.cat) : '#c7cdd6')} />
            ) : runsOpen || runs.length < slots ? <BuildRunTile /> : null}
          </div>
        </section>
      ) : null}
      <section className="rbs-sec" aria-label="Puzzles">
        <div className="rbs-h">
          <span className="rbs-lab">Puzzles</span>
          <span className="rbs-chips" role="tablist" aria-label="Pick a category">
            <button type="button" role="tab" aria-selected={cat === 'for'} className={'rbs-chip' + (cat === 'for' ? ' on' : '')} onClick={() => setCat('for')}>Picked for you</button>
            {cats.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={cat === c} className={'rbs-chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
            ))}
          </span>
          <a href="/" className="rbs-all">See all Daily Puzzles</a>
        </div>
        {picks.length ? (
          <div className="rbs-games">{picks.map((g) => <DetailCard key={g.key} g={g} day={board ? (byKey[g.key] || { board: [], plays: 0 }) : null} diff={diff} />)}</div>
        ) : day ? (
          <p className="rbs-none">You have played every puzzle today. New ones open at midnight Eastern, and the <a href="/quizzes">quizzes</a> are always open.</p>
        ) : null}
      </section>
    </div>
  );
}

const CSS = `
.rbs{display:flex;flex-direction:column;gap:22px}
.rbs-sec{display:flex;flex-direction:column;gap:12px}
.rbs-h{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
.rbs-lab{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;line-height:1.35}
.rbs-h a{font-size:13px;font-weight:800;color:var(--gsx-ink)}
.rbs-chips{display:flex;gap:6px;flex-wrap:wrap;flex:1 1 auto}
.rbs-chip{font:inherit;font-size:13px;font-weight:700;min-height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--gsx-ink);background:transparent;color:var(--gsx-ink);cursor:pointer}
.rbs-chip.on{background:var(--gsx-ink);color:var(--gsx-bg)}
.rbs-runs,.rbs-games{display:grid;gap:14px;grid-template-columns:repeat(var(--rbs-cols, 4),minmax(0,1fr))}
/* The run ending is always its own pastel ground, so the tiles keep the
   home's light drawing whatever the site register says. */
.gsx .rbs .rgt.rgt{background:var(--rgg);color:#0b1b2b;border-color:#0b1b2b}
.gsx .rbs .rgt.rgt-w{background:#fff}
.gsx .rbs .rgt-more.rgt-more{background:#fff}
.rbd{display:grid;grid-template-columns:74px minmax(0,1fr);grid-template-areas:"b n" "b f" "b k" "x x" "s s";grid-template-rows:auto auto 1fr auto auto;
  column-gap:14px;padding:14px 14px 0 16px;background:#fff;color:#0b0d12;border:1px solid #0b0d12;border-radius:12px;overflow:hidden;text-decoration:none;min-width:0;box-sizing:border-box;
  transition:transform .12s cubic-bezier(.2,.7,.3,1)}
@media (hover:hover){.rbd:hover{transform:translateY(-1px)}}
.gsx a.rbd{color:#0b0d12}
.rbd-b{grid-area:b;width:74px;height:74px;box-sizing:border-box;padding:6px;border:1px solid #0b0d12;border-radius:10px;background:color-mix(in srgb, var(--cfull) 26%, #fff)}
.rbd-n{grid-area:n;font-size:18px;font-weight:800;line-height:1.2;padding-bottom:.12em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rbd-fx{grid-area:f;display:flex;gap:6px;height:24px;overflow:hidden;flex-wrap:wrap;align-content:flex-start;margin-top:5px}
.rbd-fc{display:inline-flex;align-items:center;gap:5px;height:24px;box-sizing:border-box;padding:0 9px 0 7px;border-radius:999px;background:var(--gpt);color:#0b0d12;font-size:12px;font-weight:700;white-space:nowrap}
.rbd-fc svg{color:var(--gpd);flex:none}
.rbd-fm{display:inline-flex;gap:2px;align-items:flex-end}
.rbd-fm i{display:block;width:4px;border-radius:1px;background:color-mix(in srgb, var(--gpd) 28%, transparent)}
.rbd-fm i.on{background:var(--gpd)}
.rbd-k{grid-area:k;margin-top:7px;font-size:12px;font-weight:700;color:#59636e;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rbd-x{grid-area:x;margin:10px 0 12px;font-size:13.5px;font-weight:500;line-height:1.5;height:calc(13.5px * 1.5 * 3);overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.rbd-s{grid-area:s;display:flex;justify-content:space-between;gap:8px;margin:0 -14px 0 -16px;padding:7px 14px 7px 16px;border-top:1px solid #0b0d12;
  background:color-mix(in srgb, var(--cfull) 60%, #fff);font-size:13px;font-weight:600;white-space:nowrap;line-height:1.35}
.rbd-s .ld{min-width:0;overflow:hidden;text-overflow:ellipsis}
.rbd-s b,.rbd-s .ct{font-weight:800}
.rbs-none{margin:0;font-size:14px;font-weight:600;line-height:1.5}
@media (max-width:899px){
  .rbs-h{gap:10px}
  .rbs-all{display:none}
  .rbs-runs,.rbs-games{grid-template-columns:minmax(0,1fr)}
}
`;
