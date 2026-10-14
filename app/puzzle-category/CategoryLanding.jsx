'use client';

// THE BODY OF A PUZZLE CATEGORY PAGE (/sudoku, /word-games, /logic-puzzles...)
// AND OF A PUZZLE SET PAGE UNDER ONE (/sudoku/edge-clue-sudokus, ...). Copy
// and roster come from lib/puzzle-categories.js and lib/puzzle-sets.js; the
// chrome is CircuitFrame, the same one-line cap, register switch and stage
// footer the circuit pages wear, so this reads as the same surface as the
// game a reader presses through to.
//
// TWO LAYOUTS BY COUNT (owner, 2026-10-14, replacing the 2026-09-11 tiles).
// The big tiles left a short row of orphans on every thin page (5 games in
// rows of 3, 4 in rows of 3) and printed each game twice, once on its tile
// and again in the prose. Now:
//
//   * FIVE OR MORE GAMES: THE LEDGER. One full-width row per game (glyph,
//     name, generic, tagline, today's leader, Play), grouped under the set
//     heads where the category has sets. Rows never orphan, 5 games or 25.
//     Beside it, one "Today in <category>" board instead of a top three per
//     tile, so empty boards read as an invitation rather than a dead page.
//   * FOUR OR FEWER: FEATURE + ROW. The first game in roster order (the one
//     the page already called "Play today's") as one large tile with its top
//     three, the rest as compact tiles beside it.
//
// The hero is one short line now: the H1 is the category's search phrase
// (`eyebrow`, e.g. "Free daily card games"), not the long keyword string,
// which stays in the title tag; the long lede moves to the top of the prose,
// so every word the page carried is still in the server HTML for a crawler.
// Each row still carries the registry's one-sentence `how` (clamped to a
// line on desktop, dropped on a phone).
//
// A CLIENT COMPONENT ON PURPOSE. CircuitFrame's stylesheet is repaired on the
// client only when a client parent renders it (see the note in
// app/circuits/CircuitFrame.jsx); render it from a server page and the phone
// cap collapses. The evergreen half (copy, roster, links) is in the server
// HTML, which is the whole point of the page; only the boards arrive later.
//
// NOTHING HERE MAY NAME AN ANSWER. These pages describe the games, never a
// day's board.

import { ArrowRight } from 'lucide-react';
import CircuitFrame from '../circuits/CircuitFrame';
import GameGlyph from '../GameGlyph';
import { useTileBoards } from '../GameTiles';
import { categoryColor, categoryColorLight, categoryAccentInkLight } from '@/lib/category-ramp';
import { circuitPageHref, circuitName } from '@/lib/circuits';
import { useThemeQs } from '@/lib/stage-theme';
import { PUZZLE_CATEGORIES, SUBSET_PARENT } from '@/lib/puzzle-categories';
import { setsIn } from '@/lib/puzzle-sets';
import { dailyScoreText } from '@/lib/daily-games';

const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";
// The ledger takes over at this many games; below it, feature + row.
const LEDGER_AT = 5;

function mss(sec) {
  const x = Math.max(0, Math.round(Number(sec) || 0));
  return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
}

function hue(cat) {
  return { '--cc-dk': categoryColor(cat), '--cc-lt': categoryColorLight(cat), '--cc-ink-lt': categoryAccentInkLight(cat) };
}

function scoreOf(g, r) {
  const sc = dailyScoreText(g.key, r.score, r.total);
  return `${sc || ''}${r.timeElapsed ? `${sc ? ' · ' : ''}${mss(r.timeElapsed)}` : ''}`;
}

// What the viewer and the day say about one game, off the one board read.
function dayOf(g, data) {
  const b = data.boards ? data.boards.get(g.key) : null;
  const rows = b ? b.rows : [];
  const me = data.mine ? data.mine.get(g.key) : null;
  const state = data.done && data.done.has(g.key) ? 'done' : data.open && data.open.has(g.key) ? 'open' : '';
  return { rows, field: b ? b.field : 0, me, state };
}

function ctaText(day) {
  if (day.me) return `You #${day.me.rank}`;
  return day.state === 'open' ? 'Resume' : day.state === 'done' ? 'Played' : 'Play';
}

function andList(names) {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function genericOf(g) {
  return g.generic && g.generic !== g.tag ? g.generic : null;
}

// ---- A. THE LEDGER -------------------------------------------------------

function LedgerRow({ g, href, data }) {
  const day = dayOf(g, data);
  const lead = day.rows[0];
  const generic = genericOf(g);
  return (
    <li>
      <a className={`pcl-row${day.state ? ' ' + day.state : ''}`} href={href} style={hue(g.cat)}>
        <span className="pcl-gi"><GameGlyph gameKey={g.key} size={20} /></span>
        <span className="pcl-id">
          <b className="pcl-nm">{g.name}</b>
          {generic ? <span className="pcl-gen">{generic}</span> : null}
        </span>
        <span className="pcl-desc">
          <span className="pcl-tag">{g.tag}</span>
          {g.how ? <span className="pcl-how">{g.how}</span> : null}
        </span>
        <span className="pcl-lead">
          {!data.ready ? <span className="pcl-wait" aria-hidden="true" />
            : lead ? <><b>{lead.username}</b> <span>{scoreOf(g, lead)}</span></>
            : <span className="pcl-open">Open. Be first.</span>}
          {data.ready && day.field ? <i className="pcl-plays">{day.field.toLocaleString()} {day.field === 1 ? 'play' : 'plays'}</i> : null}
        </span>
        <span className="pcl-cta">{ctaText(day)}</span>
      </a>
    </li>
  );
}

function DayBoard({ label, games, data }) {
  const days = games.map((g) => [g, dayOf(g, data)]);
  const plays = days.reduce((n, [, d]) => n + (d.field || 0), 0);
  const leaders = days.filter(([, d]) => d.rows[0]);
  const empty = days.filter(([, d]) => !d.rows[0]).map(([g]) => g.name);
  return (
    <aside className="pcl-day" aria-label={`Today in ${label.toLowerCase()}`}>
      <h2>Today in {label.toLowerCase()}</h2>
      {!data.ready ? (
        <div className="pcl-day-wait" aria-hidden="true"><span /><span /><span /></div>
      ) : (
        <>
          <p className="pcl-day-n"><b>{plays.toLocaleString()}</b> {plays === 1 ? 'play' : 'plays'} so far</p>
          {leaders.length ? (
            <ol className="pcl-day-list">
              {leaders.map(([g, d]) => (
                <li key={g.key} style={hue(g.cat)}>
                  <span className="pcl-day-g">{g.name}</span>
                  <b>{d.rows[0].username}</b>
                  <span className="pcl-day-s">{scoreOf(g, d.rows[0])}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {empty.length ? (
            <p className="pcl-day-note">
              {empty.length === games.length
                ? 'Nobody is on a board yet today. One play puts you on top.'
                : `${andList(empty)} ${empty.length === 1 ? 'has' : 'have'} no score yet today. One play puts you on top.`}
            </p>
          ) : null}
        </>
      )}
    </aside>
  );
}

function Ledger({ shelves, label, games, data, withTq }) {
  return (
    <div className="pcl-lw">
      <section className="pcl-ledger" aria-label={`The ${games.length} games`}>
        {shelves.map(([set, list]) => (
          <div key={set.name} className="pcl-lg">
            <div className="pcl-lh">
              <h2>{set.href ? <a href={withTq(set.href)}>{set.name}</a> : set.name}</h2>
              <b>{list.length}</b>
              <span className="pcl-lcol">Today&apos;s leader</span>
            </div>
            <ul>
              {list.map((g) => <LedgerRow key={g.key} g={g} href={withTq(g.href)} data={data} />)}
            </ul>
          </div>
        ))}
      </section>
      <DayBoard label={label} games={games} data={data} />
    </div>
  );
}

// ---- B. FEATURE + ROW ----------------------------------------------------

function FeatureTile({ g, href, data }) {
  const day = dayOf(g, data);
  const generic = genericOf(g);
  return (
    <a className={`pcl-big${day.state ? ' ' + day.state : ''}`} href={href} style={hue(g.cat)}>
      <span className="pcl-big-top">
        <span className="pcl-kick">Start here</span>
        {generic ? <span className="pcl-gen">{generic}</span> : null}
      </span>
      <span className="pcl-big-id">
        <span className="pcl-big-gi"><GameGlyph gameKey={g.key} size={28} /></span>
        <span><b className="pcl-big-nm">{g.name}</b><span className="pcl-tag">{g.tag}</span></span>
      </span>
      {g.how ? <span className="pcl-big-how">{g.how}</span> : null}
      <span className="pcl-big-board">
        <span className="pcl-big-bh"><span>Today&apos;s board</span>{data.ready && day.field ? <i>{day.field.toLocaleString()} {day.field === 1 ? 'play' : 'plays'}</i> : null}</span>
        {!data.ready ? (
          <span className="pcl-big-rows" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className="pcl-big-row"><b>{i + 1}</b><span className="pcl-wait" /></span>)}</span>
        ) : day.rows.length ? (
          <span className="pcl-big-rows">
            {day.rows.map((r, i) => (
              <span key={r.userKey || i} className="pcl-big-row">
                <b>{r.rank || i + 1}</b>
                <span className="pcl-big-who">{r.username}</span>
                <span className="pcl-big-sc">{scoreOf(g, r)}</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="pcl-open">Nobody on the board yet. Be first.</span>
        )}
      </span>
      <span className="pcl-big-go">
        {day.me ? `You are #${day.me.rank}${day.me.field ? ` of ${day.me.field}` : ''}` : day.state === 'open' ? `Resume ${g.name}` : day.state === 'done' ? `Played today` : `Play today's ${g.name}`}
        <ArrowRight size={15} strokeWidth={2.6} />
      </span>
    </a>
  );
}

function MiniTile({ g, href, data }) {
  const day = dayOf(g, data);
  const lead = day.rows[0];
  return (
    <a className={`pcl-mini${day.state ? ' ' + day.state : ''}`} href={href} style={hue(g.cat)}>
      <span className="pcl-gi"><GameGlyph gameKey={g.key} size={20} /></span>
      <span className="pcl-mini-body">
        <b className="pcl-nm">{g.name}</b>
        <span className="pcl-tag">{g.tag}</span>
        <span className="pcl-mini-st">
          {!data.ready ? <span className="pcl-wait" aria-hidden="true" />
            : lead ? <><b>{lead.username}</b> {scoreOf(g, lead)}</>
            : <span className="pcl-open">Open. Be first.</span>}
        </span>
      </span>
      <span className="pcl-cta">{ctaText(day)}</span>
    </a>
  );
}

function Feature({ games, data, withTq }) {
  const [lead, ...rest] = games;
  return (
    <div className={`pcl-feat${rest.length ? '' : ' solo'}`}>
      <FeatureTile g={lead} href={withTq(lead.href)} data={data} />
      {rest.length ? (
        <div className={`pcl-minis${rest.length > 3 ? ' two' : ''}`}>
          {rest.map((g) => <MiniTile key={g.key} g={g} href={withTq(g.href)} data={data} />)}
        </div>
      ) : null}
    </div>
  );
}

// `page` is the category or set record (copy), `games` its roster, `parent`
// the category record when `page` is a set or a subset page (null on a whole
// category), `groups` the [set, games] shelves a category page draws.
export default function CategoryLanding({ page, games, parent = null, groups = null }) {
  const tq = useThemeQs();
  // One read of the boards for the whole page.
  const data = useTileBoards();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);
  const first = games[0];
  const cat = page.cat;
  const catPage = parent || page;
  const label = page.label || page.name;
  // Every whole-category page but this one, for the foot nav; subset pages
  // (crosswords, chess) ride along under their parents.
  const siblings = PUZZLE_CATEGORIES.filter((c) => c.slug !== catPage.slug && !SUBSET_PARENT[c.slug]);
  const sets = setsIn(cat).filter((s) => s.href);
  // A set names its own circuit where one fits it better than the category's.
  const circuit = page.circuit || catPage.circuit || null;
  const current = page.href || `/${page.slug}`;
  // A Gauntlet is already a run by name; the rest are named as circuits.
  const circuitCta = circuit ? (circuit === 'room' ? 'Walk into Read the Room' : /^Enter /.test(circuitName(circuit)) ? circuitName(circuit) : /gauntlet/i.test(circuitName(circuit)) ? `Run the ${circuitName(circuit)}` : `Run the ${circuitName(circuit)} circuit`) : '';
  const ledger = games.length >= LEDGER_AT;
  const shelves = groups && groups.length > 1 ? groups : [[{ name: 'Pick a puzzle', href: null }, games]];
  const h1 = page.eyebrow || page.h1;

  return (
    <CircuitFrame cat={cat} label={parent ? `${parent.label} · ${label}` : page.label} wide>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pcl">
        <section className="pcl-hero">
          {parent ? (
            <nav className="pcl-crumb" aria-label="Breadcrumb">
              <a href={withTq(`/${parent.slug}`)}>{parent.label}</a>
              <span aria-hidden="true">/</span>
              <span>{label}</span>
            </nav>
          ) : null}
          <div className="pcl-hrow">
            <div className="pcl-htext">
              <h1 className="pcl-h1">{h1}</h1>
              <p className="pcl-sub">{games.length} {games.length === 1 ? 'game' : 'games'} · a new board in each every day · no signup</p>
            </div>
            <div className="pcl-acts">
              {ledger && first ? <a className="pcl-go" href={withTq(first.href)}>Play today&apos;s {first.name} <ArrowRight size={15} strokeWidth={2.6} /></a> : null}
              {circuit ? <a className="pcl-sh" href={withTq(circuitPageHref(circuit))}>{circuitCta}</a> : null}
              {page.alsoCircuit ? <a className="pcl-sh" href={withTq(circuitPageHref(page.alsoCircuit))}>{`Run the ${circuitName(page.alsoCircuit)}`}</a> : null}
            </div>
          </div>
        </section>

        {/* THE SETS OF A CATEGORY, as chips under the hero: the same next-tier
            pages the ledger heads link, gathered where a reader who knows what
            kind of puzzle they want can jump straight to it. Drawn on the
            category page and on a set page alike, where the current set is
            marked. */}
        {sets.length > 1 ? (
          <nav className="pcl-sets" aria-label={`${catPage.label} sets`}>
            {sets.map((s) => (
              <a key={s.name} href={withTq(s.href)} className={s.href === current ? 'on' : ''}
                aria-current={s.href === current ? 'page' : undefined}>{s.name}</a>
            ))}
          </nav>
        ) : null}

        {ledger
          ? <Ledger shelves={shelves} label={label} games={games} data={data} withTq={withTq} />
          : <Feature games={games} data={data} withTq={withTq} />}

        <section className="pcl-two">
          <div className="pcl-prose">
            <h2>{page.howTitle || `How the ${label.toLowerCase()} play`}</h2>
            {page.lede ? <p>{page.lede}</p> : null}
            {(page.how || []).map((p, i) => <p key={i}>{p}</p>)}
            {page.start ? <><h3>{page.startTitle}</h3><p>{page.start}</p></> : null}
          </div>
          {page.week && page.week.length ? (
            <div>
              <h2>The week</h2>
              <table className="pcl-week">
                <tbody>
                  {page.week.map(([d, w]) => <tr key={d}><th scope="row">{d}</th><td>{w}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {page.faq && page.faq.length ? (
          <section className="pcl-faq">
            <h2>Questions</h2>
            {page.faq.map(([q, a], i) => (
              <details key={q} open={i === 0}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        ) : null}

        <nav className="pcl-more" aria-label="More puzzle categories">
          <h2>More puzzles</h2>
          <div>
            <a href={withTq('/')}>Today&apos;s puzzles</a>
            <a href={withTq('/archive')}>Archive</a>
            <a href={withTq('/circuits')}>Circuits</a>
            {parent ? <a href={withTq(`/${parent.slug}`)}>All {parent.label.toLowerCase()}</a> : null}
            {siblings.map((c) => <a key={c.slug} href={withTq(`/${c.slug}`)}>{c.label}</a>)}
          </div>
        </nav>
      </div>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
// Every row and tile publishes its hue in both registers (--cc-dk / --cc-lt)
// plus the light-register ink (--cc-ink-lt); --cc is the FILL (glyph, hover
// border), --cci the TEXT, exactly as app/GameTiles.jsx does it.
const CSS = `
.pcl{display:flex;flex-direction:column;gap:30px;}
.pcl-row,.pcl-big,.pcl-mini,.pcl-day li{--cc:var(--cc-dk,var(--stg-ink2));--cci:var(--cc);}
[data-stage-theme='light'] .pcl-row,[data-stage-theme='light'] .pcl-big,[data-stage-theme='light'] .pcl-mini,[data-stage-theme='light'] .pcl-day li{--cc:var(--cc-lt,var(--stg-ink2));--cci:var(--cc-ink-lt,var(--cc));}

/* HERO: one line of title, one of facts, the ways in at the right. */
.pcl-crumb{display:flex;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.pcl-crumb a{color:var(--stg-ink2);text-decoration:none;}
.pcl-crumb a:hover{color:var(--stg-acc-ink);}
.pcl-hrow{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 24px;}
.pcl-htext{flex:1 1 420px;min-width:0;}
.pcl-h1{margin:0;font-size:clamp(28px,4vw,40px);font-weight:800;letter-spacing:-0.025em;line-height:1.06;color:var(--stg-ink);text-wrap:balance;}
.pcl-sub{margin:8px 0 0;font-size:14.5px;font-weight:600;color:var(--stg-ink2);}
.pcl-acts{display:flex;gap:9px;flex-wrap:wrap;}
.pcl-go,.pcl-sh{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:0 16px;height:44px;font-size:13.5px;font-weight:800;text-decoration:none;letter-spacing:-0.005em;}
.pcl-go{background:var(--stg-acc);color:var(--stg-onramp,#08222e);border:1.5px solid transparent;}
.pcl-go:hover{filter:brightness(1.07);}
.pcl-sh{background:none;color:var(--stg-ink);border:1.5px solid var(--stg-line2);}
.pcl-sh:hover{border-color:var(--stg-acc);color:var(--stg-acc-ink);}
.pcl a:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;}
.pcl-sets{display:flex;flex-wrap:wrap;gap:6px;margin-top:-12px;}
.pcl-sets a{font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-ink2);text-decoration:none;
  border:1px solid var(--stg-line);border-radius:6px;padding:6px 10px;background:var(--stg-surf);}
.pcl-sets a:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.pcl-sets a.on{border-color:var(--stg-acc);color:var(--stg-acc-ink);}

/* SHARED BITS */
.pcl-gi{flex:none;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:var(--stg-chip);color:var(--cc);}
.pcl-nm{display:block;font-size:16.5px;font-weight:800;letter-spacing:-0.015em;line-height:1.2;color:var(--stg-ink);}
.pcl-gen{display:block;margin-top:2px;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--cci);}
.pcl-tag{display:block;font-size:13px;font-weight:700;color:var(--stg-ink2);}
.pcl-open{color:var(--stg-mute);font-weight:600;}
.pcl-wait{display:inline-block;width:110px;max-width:100%;height:11px;border-radius:3px;background:var(--stg-chip);vertical-align:middle;}
.pcl-cta{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:76px;height:36px;padding:0 12px;border-radius:9px;
  border:1.5px solid var(--stg-line2);font-size:13px;font-weight:800;color:var(--cci);white-space:nowrap;}
.done .pcl-cta{color:var(--stg-mute);}

/* A. THE LEDGER */
.pcl-lw{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;}
.pcl-ledger{flex:999 1 640px;min-width:0;border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);overflow:hidden;}
.pcl-lh{display:flex;align-items:baseline;gap:10px;padding:12px 18px;background:var(--stg-bg,transparent);}
.pcl-lg+.pcl-lg .pcl-lh{border-top:1px solid var(--stg-line);}
.pcl-lh h2{margin:0;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--stg-ink);}
.pcl-lh h2 a{color:inherit;text-decoration:none;}
.pcl-lh h2 a:hover{color:var(--stg-acc-ink);}
.pcl-lh b{font-family:${MONO};font-size:11.5px;font-weight:700;color:var(--stg-ink2);}
.pcl-lcol{margin-left:auto;font-family:${MONO};font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);}
.pcl-ledger ul{list-style:none;margin:0;padding:0;}
.pcl-row{display:grid;grid-template-columns:40px minmax(120px,.9fr) minmax(0,2fr) minmax(150px,1fr) auto;align-items:center;gap:16px;
  padding:12px 18px;border-top:1px solid var(--stg-line);text-decoration:none;color:var(--stg-ink);}
.pcl-row:hover{background:var(--stg-surf2,var(--stg-chip));}
.pcl-row:hover .pcl-cta{border-color:var(--cc);}
.pcl-row.open .pcl-cta{border-color:var(--cc);}
.pcl-id,.pcl-desc,.pcl-lead{min-width:0;}
.pcl-how{display:block;margin-top:2px;font-size:12.5px;font-weight:500;line-height:1.45;color:var(--stg-mute);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pcl-lead{font-size:13.5px;line-height:1.35;}
.pcl-lead b{font-weight:800;}
.pcl-lead>span:not(.pcl-open):not(.pcl-wait){color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.pcl-plays{display:block;font-style:normal;font-size:11.5px;font-weight:600;color:var(--stg-mute);margin-top:1px;}

.pcl-day{flex:1 1 260px;min-width:0;border:1px solid var(--stg-line);border-radius:12px;background:var(--stg-surf);padding:16px 18px;}
.pcl-day h2{margin:0;font-family:${MONO};font-size:9.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);}
.pcl-day-n{margin:8px 0 0;font-size:13px;font-weight:600;color:var(--stg-mute);}
.pcl-day-n b{font-size:26px;font-weight:800;letter-spacing:-0.02em;color:var(--stg-ink);margin-right:4px;font-variant-numeric:tabular-nums;}
.pcl-day-list{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:9px;}
.pcl-day li{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:8px;align-items:baseline;font-size:13px;}
.pcl-day-g{font-weight:800;color:var(--cci);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pcl-day li b{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pcl-day-s{color:var(--stg-ink2);font-variant-numeric:tabular-nums;white-space:nowrap;}
.pcl-day-note{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--stg-line);font-size:12.5px;line-height:1.5;color:var(--stg-mute);font-weight:600;}
.pcl-day-wait{display:flex;flex-direction:column;gap:9px;margin-top:12px;}
.pcl-day-wait span{display:block;height:12px;border-radius:3px;background:var(--stg-chip);}

/* B. FEATURE + ROW */
.pcl-feat{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:16px;align-items:stretch;}
.pcl-feat.solo{grid-template-columns:minmax(0,1fr);}
.pcl-big{display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:14px;text-decoration:none;color:var(--stg-ink);
  background:color-mix(in srgb,var(--cc) 9%,var(--stg-surf));border:1px solid color-mix(in srgb,var(--cc) 38%,var(--stg-line));}
.pcl-big:hover{border-color:var(--cc);}
.pcl-big-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;}
.pcl-kick{font-family:${MONO};font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--cci);}
.pcl-big-top .pcl-gen{margin:0;color:var(--stg-mute);}
.pcl-big-id{display:flex;align-items:center;gap:13px;}
.pcl-big-gi{flex:none;display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:13px;
  background:color-mix(in srgb,var(--cc) 16%,var(--stg-surf));color:var(--cc);}
.pcl-big-nm{display:block;font-size:30px;font-weight:800;letter-spacing:-0.02em;line-height:1.05;}
.pcl-big-how{font-size:14px;line-height:1.6;color:var(--stg-ink2);font-weight:500;max-width:60ch;}
.pcl-big-board{display:block;margin-top:auto;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--cc) 25%,var(--stg-line));}
.pcl-big-bh{display:flex;justify-content:space-between;font-family:${MONO};font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:7px;}
.pcl-big-bh i{font-style:normal;letter-spacing:.04em;text-transform:none;}
.pcl-big-rows{display:flex;flex-direction:column;gap:5px;}
.pcl-big-row{display:flex;align-items:baseline;gap:9px;font-size:14px;}
.pcl-big-row b{flex:none;width:14px;font-family:${MONO};font-size:11px;font-weight:700;color:var(--stg-ink2);}
.pcl-big-row:first-child b{color:var(--cci);}
.pcl-big-who{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;}
.pcl-big-sc{flex:none;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.pcl-big-go{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px;border-radius:10px;
  background:var(--cc);color:var(--stg-onramp,#08222e);font-size:14.5px;font-weight:800;}
.pcl-big.done .pcl-big-go{background:none;border:1.5px solid var(--stg-line2);color:var(--stg-ink2);}
.pcl-minis{display:flex;flex-direction:column;gap:10px;}
.pcl-minis.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}
.pcl-mini{flex:1;display:flex;align-items:center;gap:13px;padding:14px 16px;border-radius:12px;text-decoration:none;color:var(--stg-ink);
  background:var(--stg-surf);border:1px solid var(--stg-line);}
.pcl-mini:hover{border-color:var(--cc);}
.pcl-mini.open{border-color:var(--cc);}
.pcl-mini-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.pcl-mini-st{margin-top:4px;font-size:12.5px;color:var(--stg-ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pcl-mini-st b{font-weight:800;color:var(--stg-ink);}
.pcl-minis.two .pcl-mini{flex-direction:column;align-items:flex-start;}
.pcl-minis.two .pcl-mini .pcl-cta{align-self:stretch;}

/* PROSE, QUESTIONS, THE WAY OUT */
.pcl-two{display:grid;grid-template-columns:1.25fr .75fr;gap:40px;align-items:start;padding-top:28px;border-top:1px solid var(--stg-line);}
.pcl-two h2,.pcl-faq h2,.pcl-more h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.pcl-prose{max-width:70ch;}
.pcl-prose p,.pcl-faq p{margin:9px 0 0;font-size:14.5px;line-height:1.65;color:var(--stg-ink2);font-weight:500;}
.pcl-prose h3{margin:18px 0 0;font-size:15px;font-weight:800;color:var(--stg-ink);}
.pcl-week{width:100%;border-collapse:collapse;margin-top:8px;font-size:13.5px;}
.pcl-week th,.pcl-week td{text-align:left;padding:8px 8px 8px 0;border-top:1px solid var(--stg-line);vertical-align:top;font-weight:500;color:var(--stg-ink2);line-height:1.5;}
.pcl-week th{font-weight:800;color:var(--stg-ink);white-space:nowrap;padding-right:14px;}
.pcl-faq details{border-top:1px solid var(--stg-line);padding:11px 0;}
.pcl-faq details:first-of-type{margin-top:8px;}
.pcl-faq summary{font-weight:800;font-size:14.5px;cursor:pointer;list-style:none;color:var(--stg-ink);}
.pcl-faq summary::-webkit-details-marker{display:none;}
.pcl-faq p{max-width:70ch;}
.pcl-more{padding-top:20px;border-top:1px solid var(--stg-line);}
.pcl-more div{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
.pcl-more a{display:inline-flex;align-items:center;min-height:36px;padding:0 13px;border:1px solid var(--stg-line2);border-radius:999px;
  font-size:13px;font-weight:700;color:var(--stg-ink);text-decoration:none;}
.pcl-more a:hover{border-color:var(--stg-acc);color:var(--stg-acc-ink);}

/* NARROWER DESKTOPS: the leader column folds under the name. */
@media (max-width:1060px){
  .pcl-row{grid-template-columns:40px minmax(130px,1fr) minmax(0,1.6fr) auto;gap:4px 16px;}
  .pcl-gi{grid-row:1 / span 2;}
  .pcl-id{grid-column:2;grid-row:1;}
  .pcl-desc{grid-column:3;grid-row:1 / span 2;}
  .pcl-cta{grid-column:4;grid-row:1 / span 2;}
  .pcl-lead{grid-column:2;grid-row:2;}
  .pcl-plays{display:inline;margin-left:6px;}
}

/* PHONE */
@media (max-width:720px){
  .pcl{gap:24px;}
  .pcl-acts{width:100%;}
  .pcl-acts a{flex:1 1 0;justify-content:center;padding:0 10px;}
  .pcl-lw{gap:14px;}
  .pcl-ledger{border-radius:10px;}
  .pcl-lh{padding:11px 14px;}
  .pcl-lcol{display:none;}
  .pcl-row{grid-template-columns:40px minmax(0,1fr) auto;gap:4px 12px;padding:12px 14px;}
  .pcl-id{grid-column:2;grid-row:1;display:flex;align-items:baseline;gap:8px;min-width:0;}
  .pcl-id .pcl-gen{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .pcl-gi{grid-row:1 / span 2;}
  .pcl-desc{display:none;}
  .pcl-lead{grid-column:2;grid-row:2;margin-top:0;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .pcl-cta{grid-column:3;grid-row:1 / span 2;min-width:64px;}
  .pcl-feat{grid-template-columns:minmax(0,1fr);gap:10px;}
  .pcl-big{padding:18px;}
  .pcl-big-nm{font-size:26px;}
  .pcl-big-go{align-self:stretch;justify-content:center;}
  .pcl-two{grid-template-columns:1fr;gap:28px;}
}
@media (max-width:420px){
  .pcl-minis.two{grid-template-columns:minmax(0,1fr);}
  .pcl-minis.two .pcl-mini{flex-direction:row;align-items:center;}
  .pcl-minis.two .pcl-mini .pcl-cta{align-self:auto;}
}
`;
