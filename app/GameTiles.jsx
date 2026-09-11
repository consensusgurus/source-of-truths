'use client';

// THE LARGE GAME TILE, for the landing pages (owner, 2026-09-11: the category,
// set and circuit pages "will be tiled, one larger tile for each game, with the
// same content as the main page tiles, but with the top three on the
// leaderboard listed for each and a longer description").
//
// ONE DRAWING, THREE PAGES. /sudoku and its siblings, the set pages under them
// and /circuits/<id> all render this, so a tile reads the same wherever the
// reader meets it and there is one place to change what a tile shows. It is
// the home's GameCard (app/today/StageToday.jsx) grown up: the same glyph,
// name and tagline in the same type, the same hue rule (the glyph and the
// hover border wear the game's category step, the name stays ink), the same
// done/open states, and the same "You: #N of M" line once the day has an
// answer. What it adds is the room a landing page has and a home does not: the
// generic name of the puzzle as an eyebrow (a stranger from a search knows
// "killer sudoku" and not "Cages"), the registry's one-sentence `how`, and
// today's top three off the same board the home reads.
//
// SERVER HTML FIRST. Everything evergreen (name, generic, tag, how, the link)
// is in the markup the server sends, because these pages exist to be crawled.
// Only the board and the viewer's own state arrive in an effect, and until
// they do the board block holds its shape with three blank rows so the page
// does not jump when they land. A game nobody has played yet says so.
//
// IT COSTS ONE REQUEST PER PAGE, not one per tile. daily-combined already
// carries every game's top ten and the viewer's per-game ranks in one payload
// (app/dailyBoardClient.js caches it besides), and daily-status carries which
// games the viewer has finished or left open. Both are read once here and
// handed down.
//
// Hues are published as BOTH registers on every tile (--cc-dk / --cc-lt) and
// the stylesheet picks one off data-stage-theme, exactly as the circuit cards
// do: this list is server rendered, so a hue chosen in JS would repaint under
// the reader on first paint. THE TEXT WEARS A THIRD VALUE. --cc is the FILL
// (glyph, border, rule) and on the light register three of the ten steps are
// pastels that cannot be text on paper (lib/category-ramp.js, the ink table:
// orange measures 2.26:1 on a white card), so every word painted in the hue
// (the generic eyebrow, the leader numeral, Play, You) takes --cci, which is
// --cc on the dark register and categoryAccentInkLight on the light one.

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import GameGlyph from './GameGlyph';
import { fetchDailyBoard, dailyBoardQuery, dailyBoardIdentity } from './dailyBoardClient';
import { fetchDayStatus, etToday } from './useDayStats';
import { categoryColor, categoryColorLight, categoryAccentInkLight } from '@/lib/category-ramp';
import { dailyScoreText } from '@/lib/daily-games';

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const TOP = 3;

function mss(sec) {
  const x = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(x / 60);
  const s = x % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// THE DAY'S BOARDS AND THE VIEWER'S DAY, read once for a page of tiles.
// Returns { boards: Map key -> {rows, field}, mine: Map key -> {rank, field},
// done: Set, open: Set, ready }.
export function useTileBoards() {
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchDailyBoard(dailyBoardQuery(dailyBoardIdentity()))
      .then((d) => { if (alive && d && Array.isArray(d.games)) setBoard(d); })
      .catch(() => {});
    fetchDayStatus().then((d) => { if (alive) setStatus(d || {}); }).catch(() => { if (alive) setStatus({}); });
    return () => { alive = false; };
  }, []);

  return useMemo(() => deriveTileData(board, status), [board, status]);
}

// The tile data off a daily-combined payload (any scope: the full slate or
// one circuit, both carry games[].board and me.perGame) and a daily-status
// payload (may be null: then done/open come from perGame alone, which is what
// a circuit page has). Exported so a page that already holds the payload can
// feed its tiles without a second request.
export function deriveTileData(board, status) {
  const boards = new Map();
  const mine = new Map();
  const done = new Set();
  const open = new Set();
  if (board && Array.isArray(board.games)) {
    for (const g of board.games) {
      if (!g || !g.key) continue;
      boards.set(g.key, { rows: Array.isArray(g.board) ? g.board.slice(0, TOP) : [], field: Number(g.field) || 0, plays: Number(g.plays) || 0 });
    }
    const pg = board.me && board.me.perGame;
    if (pg) {
      for (const key of Object.keys(pg)) {
        const r = pg[key];
        if (!r) continue;
        // A started-and-left run carries a rank it did not earn (see the
        // standing memo on the home); a registered player's row says so.
        if (r.abandoned === true) { if (!status) open.add(key); continue; }
        if (!status) done.add(key);
        if (r.rank == null) continue;
        mine.set(key, { rank: r.rank, field: r.field || (boards.get(key) || {}).field || 0 });
      }
    }
  }
  if (status) {
    const [Y, M, D] = etToday().split('-').map(Number);
    const suffix = `-${M}-${D}-${Y % 100}`;
    const take = (list, set) => { for (const id of list || []) if (typeof id === 'string' && id.endsWith(suffix)) set.add(id.slice(0, -suffix.length)); };
    take(status.completed, done);
    take(status.played, done);
    take(status.inProgress, open);
    take(status.abandoned, open);
    for (const k of done) open.delete(k);
  }
  return { boards, mine, done, open, ready: !!board };
}

// One tile. `g` is a registry row plus an optional `generic` label and an
// optional `href` override (the circuit pages hand a ?circuit= link).
export function GameTile({ g, href, num = null, boards, mine, done, open, ready }) {
  const b = boards ? boards.get(g.key) : null;
  const rows = b ? b.rows : [];
  const me = mine ? mine.get(g.key) : null;
  const state = done && done.has(g.key) ? 'done' : open && open.has(g.key) ? 'open' : '';
  const generic = g.generic && g.generic !== g.tag ? g.generic : null;
  return (
    <a className={`gtl${state ? ' ' + state : ''}`} href={href || g.href}
      style={{ '--cc-dk': categoryColor(g.cat), '--cc-lt': categoryColorLight(g.cat), '--cc-ink-lt': categoryAccentInkLight(g.cat) }}>
      <span className="gtl-top">
        {num != null ? <span className="gtl-num">{num}</span> : null}
        <span className="gtl-nm"><GameGlyph gameKey={g.key} size={20} className="gtl-gi" />{g.name}</span>
        {generic ? <span className="gtl-gen">{generic}</span> : null}
      </span>
      <span className="gtl-tag">{g.tag}</span>
      <span className="gtl-how">{g.how}</span>
      <span className="gtl-board" aria-label={`Today's top ${TOP} on ${g.name}`}>
        <span className="gtl-bh">
          <span>Today&apos;s board</span>
          {b && b.field ? <i>{b.field.toLocaleString()} {b.field === 1 ? 'player' : 'players'}</i> : null}
        </span>
        {!ready ? (
          <span className="gtl-rows gtl-wait">{[0, 1, 2].map((i) => <span key={i} className="gtl-row"><b>{i + 1}</b><span className="gtl-who">&nbsp;</span></span>)}</span>
        ) : rows.length ? (
          <span className="gtl-rows">
            {rows.map((r, i) => {
              const sc = dailyScoreText(g.key, r.score, r.total);
              return (
                <span key={r.userKey || i} className="gtl-row">
                  <b>{r.rank || i + 1}</b>
                  <span className="gtl-who">{r.username}</span>
                  <span className="gtl-sc">{sc ? sc : ''}{r.timeElapsed ? `${sc ? ' · ' : ''}${mss(r.timeElapsed)}` : ''}</span>
                </span>
              );
            })}
          </span>
        ) : (
          <span className="gtl-none">Nobody on the board yet. Be first.</span>
        )}
      </span>
      <span className="gtl-foot">
        {me ? (
          <span className="gtl-me"><span className="gtl-mel">You:</span><b>#{me.rank}</b>{me.field ? <i>of {me.field}</i> : null}</span>
        ) : (
          <span className="gtl-me gtl-cta">{state === 'open' ? 'Resume' : state === 'done' ? 'Played today' : 'Play'}</span>
        )}
        <ArrowRight className="gtl-arr" size={16} strokeWidth={2.4} />
      </span>
    </a>
  );
}

// A grid of tiles with the data handed in, for a page that draws several
// grids off one read (the category pages, one shelf per set). Carries no
// stylesheet: the page that owns the read owns the CSS too (import TILE_CSS).
export function TileGrid({ games, hrefFor = null, numbered = false, className = '', data }) {
  return (
    <div className={`gtl-grid ${className}`.trim()}>
      {games.map((g, i) => (
        <GameTile key={g.key} g={g} href={hrefFor ? hrefFor(g) : undefined} num={numbered ? i + 1 : null} {...data} />
      ))}
    </div>
  );
}

// One grid, self-contained: reads the boards and carries its own stylesheet.
export default function GameTiles({ games, hrefFor = null, numbered = false, className = '' }) {
  const data = useTileBoards();
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TILE_CSS }} />
      <TileGrid games={games} hrefFor={hrefFor} numbered={numbered} className={className} data={data} />
    </>
  );
}

// NOTE: a JS template literal, so no backticks and no apostrophes in comments.
export const TILE_CSS = `
.gtl-grid{display:grid;gap:9px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));}
.gtl{--cc:var(--cc-dk,var(--stg-ink2));--cci:var(--cc);position:relative;display:flex;flex-direction:column;gap:4px;min-width:0;
  text-decoration:none;color:var(--stg-ink);background:var(--stg-surf);border:1px solid var(--stg-line);
  border-radius:10px;padding:13px 14px 12px;}
[data-stage-theme='light'] .gtl{--cc:var(--cc-lt,var(--stg-ink2));--cci:var(--cc-ink-lt,var(--cc));}
.gtl>*{min-width:0;max-width:100%;}
.gtl:hover{border-color:var(--cc);}
.gtl.open{border-color:var(--cc);}
.gtl:focus-visible{outline:2px solid var(--cc);outline-offset:2px;}
.gtl-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.gtl-num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--stg-chip);color:var(--stg-ink2);
  font-family:${MONO};font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;
  font-variant-numeric:tabular-nums;}
.gtl-nm{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:800;letter-spacing:-0.015em;line-height:1.15;}
.gtl-gi{flex:none;color:var(--cc);}
.gtl-gen{margin-left:auto;font-family:${MONO};font-size:9px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--cci);font-weight:700;white-space:nowrap;}
.gtl-tag{display:block;font-size:12.5px;font-weight:700;color:var(--stg-ink2);}
.gtl-how{display:block;margin-bottom:10px;font-size:12.5px;font-weight:500;line-height:1.55;color:var(--stg-mute);margin-top:2px;}
.gtl-board{display:block;margin-top:auto;padding-top:9px;border-top:1px solid var(--stg-line);}
.gtl-bh{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-family:${MONO};font-size:9px;
  letter-spacing:.13em;text-transform:uppercase;color:var(--stg-mute);margin-bottom:5px;}
.gtl-bh i{font-style:normal;letter-spacing:.06em;text-transform:none;}
.gtl-rows{display:flex;flex-direction:column;gap:3px;}
.gtl-row{display:flex;align-items:baseline;gap:8px;font-size:12.5px;line-height:1.35;min-width:0;}
.gtl-row b{flex:none;width:14px;font-family:${MONO};font-size:10.5px;font-weight:700;color:var(--stg-ink2);
  font-variant-numeric:tabular-nums;}
.gtl-row:first-child b{color:var(--cci);}
.gtl-who{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;color:var(--stg-ink);}
.gtl-sc{flex:none;font-family:${MONO};font-size:10.5px;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}
.gtl-wait .gtl-who{height:12px;border-radius:3px;background:var(--stg-chip);}
.gtl-none{display:block;font-size:12px;font-weight:600;color:var(--stg-mute);padding:6px 0 4px;}
.gtl-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px;}
.gtl-me{display:flex;align-items:baseline;gap:6px;font-size:12px;font-weight:600;color:var(--stg-mute);}
.gtl-me b{font-weight:800;color:var(--stg-ink);font-size:13px;}
.gtl-me i{font-style:normal;}
.gtl-mel{font-family:${MONO};font-size:9px;letter-spacing:.1em;text-transform:uppercase;}
.gtl-cta{font-weight:800;color:var(--cci);font-size:12.5px;}
.gtl.done .gtl-cta{color:var(--stg-mute);}
.gtl-arr{flex:none;color:var(--stg-mute);}
.gtl:hover .gtl-arr{color:var(--cci);}
@media (max-width:560px){.gtl-grid{grid-template-columns:1fr;}}
`;
