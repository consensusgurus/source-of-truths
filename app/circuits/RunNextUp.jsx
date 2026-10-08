'use client';

// RunNextUp — what to do when a circuit run ends (owner, 2026-08-30).
//
// A run used to end at a dead stop: the scorecard, three actions, and the only
// one of them that led anywhere on this site was Home. The player who has just
// answered sixty questions in one sitting is the likeliest person on the site
// to play something else, and the card asked them nothing.
//
// It is TWO OFFERS AND TWO DRAWERS, in that order, because they are two
// different sizes of ask:
//
//   Four single puzzles, none of them played today, ordered by how close they
//   are to what was just finished. This is the small ask and it leads.
//
//   Two more circuits, the ones nearest this one that still have most of their
//   roster open. This is the bigger ask and it sits under the small one.
//
//   Then everything: all the open puzzles by category, and every other
//   circuit. Both open IN PLACE, which is the rule the rest of the finish
//   already follows (see LoftFinish's header: nothing navigates away that does
//   not have to).
//
// NOTHING OFFERED AT REST IS ALREADY PLAYED. That is the whole reason this is
// not simply the end card's category browser: that panel opens on the category
// just played, and a seven-game trivia run has half emptied it, so the first
// thing a Gauntlet player would read is six rows saying Played.
//
// The two orderings, and there are no others:
//
//   GAMES  tier 0, a game in one of this circuit's own categories; tier 1, a
//          game sharing a circuit with one of this circuit's games; tier 2,
//          everything else still open. Registry order inside a tier, so the
//          result is stable across a page load.
//   CIRCUITS  most overlap with this circuit's categories first, then most of
//          its roster still unplayed, then the shorter one. Never this
//          circuit, and never one with fewer than two games left, because an
//          almost-finished circuit is not an invitation.
//
// It reads the roster through useDailyRoster, the hook the end card already
// uses, so what counts as played here is what counts as played there, and the
// circuits come out of the registry. No new request and no new endpoint.
//
// Dark by design: this renders on the run's stage, which paints its own near
// black ground. Every colour below is written down rather than inherited, for
// the reason RunClient's own stylesheet gives — the loft ground ships rules
// that repaint text for a dark background.
import React, { useMemo, useState } from 'react';
import useDailyRoster from '../useDailyRoster';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { CIRCUITS, circuitById, circuitEntryHref } from '@/lib/circuits';
import { T } from '@/lib/theme';
import GameGlyph from '../GameGlyph';

const PICKS = 4;      // single puzzles shown at rest
const FEATURED = 2;   // circuits shown at rest
const MIN_LEFT = 2;   // a circuit with fewer games left than this is not offered

// NO TROPHY ON THIS CARD (owner, 2026-08-30). A circuit's trophy is a reward
// for finishing it, and naming it beside a card that has not been started
// reads as a second scoring system arriving in the middle of a scorecard that
// has just finished explaining its own. What the card offers is the run: its
// name, what it is, how long it is, and how much of it is still open today.

export default function RunNextUp({ circuitId }) {
  const roster = useDailyRoster({ active: true });
  // Which drawer is open, if either. One at a time: two open drawers is the
  // whole roster and every circuit on one card, which is the wall this is
  // meant to replace.
  const [open, setOpen] = useState(null);
  const [pickCat, setPickCat] = useState(null);

  const me = circuitById(circuitId);
  const mine = useMemo(() => new Set((me && me.keys) || []), [me]);

  // The categories this circuit is made of, WITH how many of its games each
  // one holds, which is what "close to what you just played" means for a
  // single game. The Gauntlet is six Trivia and one Geography, so a Trivia
  // game is nearer than a Geography one and the count is what says so.
  const myCats = useMemo(() => {
    const m = new Map();
    mine.forEach((k) => {
      const g = DAILY_GAME_MAP[k];
      if (g && g.cat) m.set(g.cat, (m.get(g.cat) || 0) + 1);
    });
    return m;
  }, [mine]);

  // Every game that shares a circuit with one of this circuit's games, and the
  // name of the circuit that connects them, which is what the tile says.
  const nearBy = useMemo(() => {
    const m = new Map();
    CIRCUITS.forEach((c) => {
      if (c.id === circuitId || !Array.isArray(c.keys)) return;
      if (!c.keys.some((k) => mine.has(k))) return;
      c.keys.forEach((k) => { if (!m.has(k)) m.set(k, c.name); });
    });
    return m;
  }, [mine, circuitId]);

  const cats = roster.cats || [];
  const allGames = useMemo(() => cats.reduce((a, c) => a.concat(c.games), []), [cats]);
  const openCount = allGames.filter((g) => !g.played).length;

  const picks = useMemo(() => {
    const rows = allGames
      .filter((g) => !g.played && !mine.has(g.key))
      .map((g) => (myCats.has(g.cat)
        ? { g, tier: 0, weight: myCats.get(g.cat), why: `Also ${g.cat.toLowerCase()}` }
        : nearBy.has(g.key)
          ? { g, tier: 1, weight: 0, why: nearBy.get(g.key) }
          : { g, tier: 2, weight: 0, why: g.cat }));
    rows.sort((a, b) => a.tier - b.tier || b.weight - a.weight);
    // A LIGHT DIVERSITY RULE, and the reason is the Gauntlet itself: a player
    // who has just answered seven banks of trivia questions does not want four
    // more trivia games, they want the nearest thing that is not quite the
    // same. So a category may take at most CAP of the four, and anything
    // displaced falls to the end rather than off.
    const CAP = 3;
    const seen = new Map();
    const first = [];
    const rest = [];
    rows.forEach((r) => {
      const n = seen.get(r.g.cat) || 0;
      if (n < CAP) { seen.set(r.g.cat, n + 1); first.push(r); } else rest.push(r);
    });
    return first.concat(rest).slice(0, PICKS);
  }, [allGames, mine, myCats, nearBy]);

  const circs = useMemo(() => {
    const played = roster.played || {};
    return CIRCUITS
      .filter((c) => c.id !== circuitId && Array.isArray(c.keys) && c.keys.length)
      .map((c) => ({
        c,
        left: c.keys.filter((k) => !played[k]).length,
        overlap: c.keys.reduce((n, k) => {
          const g = DAILY_GAME_MAP[k];
          return n + ((g && myCats.get(g.cat)) || 0);
        }, 0),
      }))
      .filter((x) => x.left >= MIN_LEFT)
      .sort((a, b) => b.overlap - a.overlap || b.left - a.left || a.c.keys.length - b.c.keys.length);
  }, [roster.played, circuitId, myCats]);

  // The drawer opens on the category with the most left to play, never on the
  // one the run just emptied.
  const fullest = useMemo(() => {
    let best = null;
    cats.forEach((c) => {
      const left = c.games.filter((g) => !g.played).length;
      if (!best || left > best.left) best = { cat: c.cat, left };
    });
    return best ? best.cat : null;
  }, [cats]);
  const shownCat = pickCat || fullest;
  const shownGames = (cats.find((c) => c.cat === shownCat) || {}).games || [];

  if (!picks.length && !circs.length) return null;

  const toggle = (which) => setOpen((v) => (v === which ? null : which));

  return (
    <div className="rnx">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {picks.length ? (
        <>
          <div className="rnx-h">
            <span className="rnx-cap">Still open today</span>
            <em>{openCount} of {allGames.length}</em>
          </div>
          <div className="rnx-tiles">
            {picks.map(({ g, why }) => (
              <a key={g.key} className="rnx-tile" href={g.href}>
                <span className="rnx-ic"><GameGlyph gameKey={g.key} size={22} on="dark" /></span>
                <span><b>{g.name}</b><i>{g.tag}</i></span>
                <em>{why}</em>
              </a>
            ))}
          </div>
        </>
      ) : null}

      {circs.length ? (
        <>
          <div className="rnx-h mt">
            <span className="rnx-cap">Or another run</span>
            <em>{circs.length} circuits</em>
          </div>
          <div className="rnx-circs">
            {circs.slice(0, FEATURED).map(({ c, left }) => (
              <a key={c.id} className="rnx-circ" href={circuitEntryHref(c.id)}>
                <span className="rnx-cn">{c.name}</span>
                <span className="rnx-cb">{c.blurb}</span>
                <span className="rnx-pips">
                  {c.keys.map((k) => <span key={k} />)}
                </span>
                <span className="rnx-cm">
                  <i>{c.keys.length} games &middot; {left} still open</i>
                  <b>Start</b>
                </span>
              </a>
            ))}
          </div>
        </>
      ) : null}

      <div className="rnx-more">
        <button type="button" className={open === 'games' ? 'rnx-gh on' : 'rnx-gh'}
                onClick={() => toggle('games')}>
          {open === 'games' ? 'Hide the puzzles' : `All ${openCount} puzzles`}<s>by category</s>
        </button>
        <button type="button" className={open === 'circs' ? 'rnx-gh on' : 'rnx-gh'}
                onClick={() => toggle('circs')}>
          {open === 'circs' ? 'Hide the circuits' : `All ${circs.length} circuits`}<s>every other run</s>
        </button>
      </div>

      {open === 'games' ? (
        <div className="rnx-draw">
          <div className="rnx-pills">
            {cats.map((c) => (
              <button key={c.cat} type="button" className={c.cat === shownCat ? 'on' : undefined}
                      onClick={() => setPickCat(c.cat)}>
                {c.cat}<i>{c.games.filter((g) => !g.played).length}</i>
              </button>
            ))}
          </div>
          <div className="rnx-tiles">
            {shownGames.map((g) => (
              <a key={g.key} className={g.played ? 'rnx-tile played' : 'rnx-tile'} href={g.href}>
                <span className="rnx-ic"><GameGlyph gameKey={g.key} size={22} on="dark" /></span>
                <span><b>{g.name}</b><i>{g.tag}</i></span>
                {g.played ? <em className="done">Played</em> : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {open === 'circs' ? (
        <div className="rnx-draw">
          <div className="rnx-circs mini">
            {circs.map(({ c, left }) => (
              <a key={c.id} className="rnx-circ" href={circuitEntryHref(c.id)}>
                <span className="rnx-cn">{c.name}</span>
                <span className="rnx-pips">
                  {c.keys.map((k) => <span key={k} />)}
                </span>
                <span className="rnx-cm">
                  <i>{c.keys.length} games &middot; {left} open</i>
                  <b>Go</b>
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
.rnx{margin-top:24px;border-top:1px solid rgba(96,165,250,.34);padding-top:16px;
  font-family:'Manrope',system-ui,-apple-system,sans-serif;}
.rnx-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:11px;}
.rnx-h.mt{margin-top:18px;}
.rnx-cap{font-family:'Manrope',ui-monospace,monospace;font-size:9px;letter-spacing:.13em;
  text-transform:uppercase;color:#66748f;}
.rnx-h em{font-style:normal;font-family:'Manrope',ui-monospace,monospace;font-size:9px;
  letter-spacing:.13em;text-transform:uppercase;color:${T.blue400};}

.rnx-tiles{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.rnx-tile{display:flex;align-items:center;gap:9px;text-decoration:none;border:1px solid rgba(255,255,255,.14);
  border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.05);color:#eef2fa;min-width:0;}
.rnx-tile:hover{border-color:${T.blue400};background:rgba(47,111,228,.16);}
.rnx-tile .rnx-ic{flex:0 0 auto;width:30px;height:30px;border-radius:7px;display:flex;
  align-items:center;justify-content:center;background:rgba(255,255,255,.07);}
.rnx-tile > span{min-width:0;flex:1;}
.rnx-tile b{display:block;font-weight:800;font-size:13px;line-height:1.1;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;color:#eef2fa;}
.rnx-tile i{display:block;font-style:normal;font-weight:600;font-size:10.5px;line-height:1.25;
  margin-top:2px;color:#9aa8c4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rnx-tile em{flex:0 0 auto;font-style:normal;font-weight:800;font-size:9px;letter-spacing:.08em;
  text-transform:uppercase;color:${T.blue400};}
.rnx-tile.played{background:rgba(255,255,255,.02);border-color:rgba(255,255,255,.08);}
.rnx-tile.played b,.rnx-tile.played i,.rnx-tile em.done{color:#66748f;}

.rnx-circs{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
.rnx-circ{display:block;text-decoration:none;border:1px solid rgba(255,255,255,.14);border-radius:12px;
  background:rgba(255,255,255,.05);padding:12px 13px;color:#eef2fa;}
.rnx-circ:hover{border-color:${T.blue400};background:rgba(47,111,228,.14);}
.rnx-cn{display:block;font-size:16px;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:#fff;}
.rnx-cb{display:block;font-size:11.5px;font-weight:600;color:#9aa8c4;margin-top:5px;line-height:1.4;}
.rnx-pips{display:flex;gap:3px;margin:11px 0 10px;}
.rnx-pips span{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.14);}
.rnx-cm{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.rnx-cm i{font-style:normal;font-family:'Manrope',ui-monospace,monospace;font-size:10px;color:#66748f;}
/* Sky, not the brand CTA blue: see the note in RunClient's stylesheet. This
   stage's colour family is the ladder ramp, and every hue in it is a light
   pastel carrying dark ink. */
.rnx-cm b{background:#7dd3fc;color:#08222e;border-radius:8px;padding:7px 12px;font-weight:800;font-size:12px;}

.rnx-circs.mini{grid-template-columns:repeat(3,1fr);gap:7px;}
.rnx-circs.mini .rnx-circ{padding:10px 11px;}
.rnx-circs.mini .rnx-cn{font-size:14px;}
.rnx-circs.mini .rnx-pips{margin:8px 0 7px;}
.rnx-circs.mini .rnx-cm i{font-size:9.5px;}
.rnx-circs.mini .rnx-cm b{padding:5px 9px;font-size:11px;}

.rnx-more{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px;}
.rnx-gh{display:block;width:100%;padding:10px;border-radius:9px;border:1px dashed rgba(255,255,255,.14);
  background:transparent;color:#9aa8c4;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer;}
.rnx-gh:hover{border-color:${T.blue400};color:#fff;}
.rnx-gh.on{border-style:solid;border-color:${T.blue400};background:rgba(47,111,228,.12);color:#fff;}
.rnx-gh s{text-decoration:none;font-family:'Manrope',ui-monospace,monospace;font-weight:400;font-size:11px;
  color:#66748f;margin-left:6px;}
.rnx-gh.on s{color:${T.blue200};}

.rnx-draw{margin-top:12px;border-top:1px solid rgba(255,255,255,.09);padding-top:12px;}
.rnx-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.rnx-pills button{font-family:inherit;font-weight:800;font-size:11.5px;cursor:pointer;padding:6px 10px;
  border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);
  color:#9aa8c4;display:inline-flex;align-items:center;gap:6px;}
.rnx-pills button i{font-style:normal;font-weight:700;font-size:9.5px;color:#66748f;
  background:rgba(255,255,255,.08);border-radius:999px;padding:1px 5px;}
.rnx-pills button:hover{border-color:rgba(96,165,250,.5);color:#fff;}
.rnx-pills button.on{background:#7dd3fc;border-color:#7dd3fc;color:#08222e;}
.rnx-pills button.on i{background:rgba(8,34,46,.14);color:#08222e;}

@media (max-width:640px){
  .rnx-tiles,.rnx-circs,.rnx-more{grid-template-columns:1fr;}
  .rnx-circs.mini{grid-template-columns:1fr 1fr;}
}
`;
