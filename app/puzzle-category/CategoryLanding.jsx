'use client';

// THE BODY OF A PUZZLE CATEGORY PAGE (/sudoku, /word-games, /logic-puzzles...)
// AND OF A PUZZLE SET PAGE UNDER ONE (/sudoku/edge-clue-sudokus, ...). Copy
// and roster come from lib/puzzle-categories.js and lib/puzzle-sets.js; the
// chrome is CircuitFrame, the same one-line cap, register switch and stage
// footer the circuit pages wear, so this reads as the same surface as the
// game a reader presses through to.
//
// TILED (owner, 2026-09-11). The roster is drawn with app/GameTiles.jsx, the
// same large tile the circuit pages use: the home tile's glyph, name and
// tagline, plus the generic name, the registry's one-sentence how, today's top
// three and the viewer's own rank. On a category page the tiles sit under one
// ruled head per SET, in the home's own head style (uppercase label and a
// count), and the head links the set's page; on a set page the tiles are one
// grid.
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
import { TileGrid, useTileBoards, TILE_CSS } from '../GameTiles';
import { categoryColor, categoryColorLight } from '@/lib/category-ramp';
import { circuitPageHref, circuitName } from '@/lib/circuits';
import { useThemeQs } from '@/lib/stage-theme';
import { PUZZLE_CATEGORIES, SUBSET_PARENT } from '@/lib/puzzle-categories';
import { setsIn } from '@/lib/puzzle-sets';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// `page` is the category or set record (copy), `games` its roster, `parent`
// the category record when `page` is a set or a subset page (null on a whole
// category), `groups` the [set, games] shelves a category page draws.
export default function CategoryLanding({ page, games, parent = null, groups = null }) {
  const tq = useThemeQs();
  // One read of the boards for every grid on the page.
  const tiles = useTileBoards();
  const withTq = (href) => (tq ? href + (href.includes('?') ? tq : `?${tq.slice(1)}`) : href);
  const first = games[0];
  const cat = page.cat;
  const catPage = parent || page;
  // Every whole-category page but this one, for the foot nav; subset pages
  // (crosswords, chess) ride along under their parents.
  const siblings = PUZZLE_CATEGORIES.filter((c) => c.slug !== catPage.slug && !SUBSET_PARENT[c.slug]);
  const sets = setsIn(cat).filter((s) => s.href);
  // A set names its own circuit where one fits it better than the category's.
  const circuit = page.circuit || catPage.circuit || null;
  const current = page.href || `/${page.slug}`;
  // A Gauntlet is already a run by name; the rest are named as circuits.
  const circuitCta = circuit ? (/gauntlet/i.test(circuitName(circuit)) ? `Run the ${circuitName(circuit)}` : `Run the ${circuitName(circuit)} circuit`) : '';

  return (
    <CircuitFrame cat={cat} label={parent ? `${parent.label} · ${page.label || page.name}` : page.label}>
      <style dangerouslySetInnerHTML={{ __html: CSS + TILE_CSS }} />
      <div className="pcl">
        <section className="pcl-hero">
          {parent ? (
            <nav className="pcl-crumb" aria-label="Breadcrumb">
              <a href={withTq(`/${parent.slug}`)}>{parent.label}</a>
              <span aria-hidden="true">/</span>
              <span>{page.label || page.name}</span>
            </nav>
          ) : null}
          <p className="pcl-eb">{page.eyebrow}</p>
          <h1 className="pcl-h1">{page.h1}</h1>
          <p className="pcl-lede">{page.lede}</p>
          <div className="pcl-acts">
            {first ? <a className="pcl-go" href={withTq(first.href)}>Play today&apos;s {first.name} <ArrowRight size={15} strokeWidth={2.6} /></a> : null}
            {circuit ? <a className="pcl-sh" href={withTq(circuitPageHref(circuit))}>{circuitCta}</a> : null}
          </div>
          <div className="pcl-figs">
            <div><b>{games.length}</b><i>{games.length === 1 ? 'game' : 'games'}</i></div>
            <div><b>1</b><i>new board a day, each</i></div>
            <div><b>0</b><i>signups needed</i></div>
          </div>
        </section>

        {/* THE SETS OF A CATEGORY, as chips under the hero: the same next-tier
            pages the shelves below link from their heads, gathered where a
            reader who knows what kind of puzzle they want can jump straight
            to it. Drawn on the category page and on a set page alike, where
            the current set is marked. */}
        {sets.length > 1 ? (
          <nav className="pcl-sets" aria-label={`${catPage.label} sets`}>
            {sets.map((s) => (
              <a key={s.name} href={withTq(s.href)} className={s.href === current ? 'on' : ''}
                aria-current={s.href === current ? 'page' : undefined}>{s.name}</a>
            ))}
          </nav>
        ) : null}

        {groups && groups.length > 1 ? groups.map(([set, list]) => (
          <section key={set.name} className="pcl-shelf"
            style={{ '--cc-dk': categoryColor(cat), '--cc-lt': categoryColorLight(cat) }}>
            <div className="pcl-head">
              {set.href ? <h2><a href={withTq(set.href)}>{set.name}</a></h2> : <h2>{set.name}</h2>}
              <b>{list.length}</b>
              {set.href ? <a className="pcl-headgo" href={withTq(set.href)}>About these {list.length} <ArrowRight size={12} strokeWidth={2.6} /></a> : null}
            </div>
            <TileGrid games={list} hrefFor={(g) => withTq(g.href)} data={tiles} />
          </section>
        )) : (
          <section className="pcl-sec">
            <div className="pcl-head"><h2>Pick a puzzle</h2><b>{games.length}</b></div>
            <TileGrid games={games} hrefFor={(g) => withTq(g.href)} data={tiles} />
          </section>
        )}

        <section className="pcl-two">
          <div className="pcl-prose">
            <h2>{page.howTitle || `How the ${(page.label || page.name).toLowerCase()} play`}</h2>
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
          <span>More puzzles:</span>
          <a href={withTq('/')}>Today&apos;s puzzles</a>
          <a href={withTq('/daily')}>Archive</a>
          <a href={withTq('/circuits')}>Circuits</a>
          {parent ? <a href={withTq(`/${parent.slug}`)}>All {parent.label.toLowerCase()}</a> : null}
          {siblings.map((c) => <a key={c.slug} href={withTq(`/${c.slug}`)}>{c.label}</a>)}
        </nav>
      </div>
    </CircuitFrame>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
const CSS = `
.pcl{display:flex;flex-direction:column;gap:34px;}
.pcl-hero{position:relative;padding-left:16px;}
.pcl-hero::before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:4px;background:var(--stg-acc);border-radius:2px;}
.pcl-crumb{display:flex;gap:8px;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:10px;}
.pcl-crumb a{color:var(--stg-ink2);text-decoration:none;}
.pcl-crumb a:hover{color:var(--stg-acc-ink);}
.pcl-eb{margin:0;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute);}
.pcl-h1{margin:7px 0 0;font-size:clamp(26px,4.2vw,38px);font-weight:800;letter-spacing:-0.025em;line-height:1.06;color:var(--stg-ink);text-wrap:balance;}
.pcl-lede{margin:12px 0 0;font-size:15.5px;font-weight:600;line-height:1.58;max-width:66ch;color:var(--stg-ink2);}
.pcl-acts{display:flex;gap:9px;margin-top:20px;flex-wrap:wrap;}
.pcl-go,.pcl-sh{display:inline-flex;align-items:center;gap:8px;border-radius:10px;padding:0 16px;height:42px;font-size:13.5px;font-weight:800;text-decoration:none;letter-spacing:-0.005em;}
.pcl-go{background:var(--stg-acc);color:var(--stg-onramp,#08222e);border:1.5px solid transparent;}
.pcl-go:hover{filter:brightness(1.07);}
.pcl-sh{background:none;color:var(--stg-ink);border:1.5px solid var(--stg-line2);}
.pcl-sh:hover{border-color:var(--stg-acc);color:var(--stg-acc-ink);}
.pcl-go:focus-visible,.pcl-sh:focus-visible,.pcl-more a:focus-visible,.pcl-sets a:focus-visible,.pcl-head a:focus-visible{outline:2px solid var(--stg-acc);outline-offset:3px;}
.pcl-figs{display:flex;gap:26px;margin-top:20px;flex-wrap:wrap;}
.pcl-figs b{display:block;font-size:22px;font-weight:800;letter-spacing:-0.02em;line-height:1;color:var(--stg-ink);font-variant-numeric:tabular-nums;}
.pcl-figs i{font-style:normal;display:block;font-family:${MONO};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute);margin-top:5px;}
.pcl-sets{display:flex;flex-wrap:wrap;gap:6px;margin-top:-14px;}
.pcl-sets a{font-family:${MONO};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-ink2);text-decoration:none;
  border:1px solid var(--stg-line);border-radius:6px;padding:6px 10px;background:var(--stg-surf);}
.pcl-sets a:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.pcl-sets a.on{border-color:var(--stg-acc);color:var(--stg-acc-ink);}
.pcl-sec,.pcl-shelf{display:block;}
/* A SHELF IS THE HOME'S CATEGORY ROW: the rule down its edge in the category
   step, the uppercase head with its count. */
.pcl-shelf{--cc:var(--cc-dk,var(--stg-ink2));position:relative;padding-left:16px;}
[data-stage-theme='light'] .pcl-shelf{--cc:var(--cc-lt,var(--stg-ink2));}
.pcl-shelf::before{content:'';position:absolute;left:0;top:2px;bottom:2px;width:4px;border-radius:2px;background:var(--cc);}
.pcl-shelf+.pcl-shelf{margin-top:-14px;}
.pcl-head{display:flex;align-items:baseline;gap:11px;margin-bottom:10px;}
.pcl-head h2,.pcl-two h2,.pcl-faq h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--stg-ink);}
.pcl-head h2 a{color:inherit;text-decoration:none;}
.pcl-head h2 a:hover{color:var(--stg-acc-ink);}
.pcl-head b{font-family:${MONO};font-size:12px;font-weight:700;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.pcl-headgo{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-family:${MONO};font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute);text-decoration:none;white-space:nowrap;}
.pcl-headgo:hover{color:var(--stg-ink);}
.pcl-two{display:grid;grid-template-columns:1.2fr .8fr;gap:34px;align-items:start;}
.pcl-prose{max-width:66ch;}
.pcl-prose p,.pcl-faq p{margin:8px 0 0;font-size:14.5px;line-height:1.62;color:var(--stg-ink2);font-weight:500;}
.pcl-prose h3{margin:18px 0 0;font-size:15px;font-weight:800;color:var(--stg-ink);}
.pcl-week{width:100%;border-collapse:collapse;margin-top:8px;font-size:13.5px;}
.pcl-week th,.pcl-week td{text-align:left;padding:8px 8px 8px 0;border-top:1px solid var(--stg-line);vertical-align:top;font-weight:500;color:var(--stg-ink2);line-height:1.5;}
.pcl-week th{font-weight:800;color:var(--stg-ink);white-space:nowrap;padding-right:14px;}
.pcl-faq details{border-top:1px solid var(--stg-line);padding:11px 0;}
.pcl-faq details:first-of-type{margin-top:8px;}
.pcl-faq summary{font-weight:800;font-size:14.5px;cursor:pointer;list-style:none;color:var(--stg-ink);}
.pcl-faq summary::-webkit-details-marker{display:none;}
.pcl-faq p{max-width:66ch;}
.pcl-more{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;font-weight:600;color:var(--stg-mute);padding-top:18px;border-top:1px solid var(--stg-line);}
.pcl-more a{color:var(--stg-ink);font-weight:700;text-decoration:none;}
.pcl-more a:hover{color:var(--stg-acc-ink);}
@media (max-width:720px){.pcl{gap:28px;}.pcl-two{grid-template-columns:1fr;}.pcl-headgo{display:none;}}
`;
