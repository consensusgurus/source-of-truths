'use client';

// CircuitScorecard — the ONE ending a circuit has (owner, 2026-08-28).
//
// A circuit ended in two different places wearing two different faces. The
// Gauntlet run drew its own white scorecard at /circuits/gauntlet/run (a rail
// of per-game chips across the top, then a card: eyebrow, headline, three
// figures, one row per game, the actions), and every other circuit ended on
// /daily-five?circuit=<id>, which drew a navy header block with the figures
// inside it and a separate board below. Same event, same five games, two
// layouts that had to be kept in step by hand. This is the layout, once, and
// both callers hand it data.
//
// IT OWNS NO DATA AND FETCHES NOTHING. Every figure, row and board row is a
// prop, because the two callers know different things: the run knows how far
// into each quiz the player got and what its own clock said, the summary knows
// what the server recorded and what it paid. Normalising that here would mean
// this file having an opinion about scoring, which is the one thing it must
// never have.
//
// THE LEADERBOARD IS PART OF THE ENDING, not a page you go to next (owner,
// 2026-08-28). The run card used to close with "See the board", which is a
// link away from the moment a player most wants the answer to "how did that go
// against everyone else". The board renders here, and the link stays for the
// full one.
//
// WHITE CARD ON A DARK GROUND, on both callers. /circuits/<id>/run is a loft
// page and /daily-five sits in NavyFrame, so the text colours here are written
// with !important: LoftCap ships a set of rules that repaint text for a dark
// background and two of them reach into any div under the page column. Nothing
// here is a <section> and no <p> is a direct child of the root, which are the
// other two shapes those rules catch.

import React from 'react';
import GameGlyph from '../GameGlyph';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

const r1 = (n) => Math.round(Number(n) * 10) / 10;


// THE NEW GLYPHS, not the old multicolour PNGs (owner, 2026-08-31). One stroke
// drawing in currentColor, so it takes the surface's own colour instead of
// importing a second palette. See lib/game-glyphs.js.

export default function CircuitScorecard({
  eyebrow = '',
  headline = '',
  lead = null,
  figures = [],          // [{ v, k, big }]
  rows = [],             // [{ key, name, sub, accent, score, total, right, state, action, href }]
  rail = true,
  // An optional graphic that REPLACES the pip rail. The Gauntlet hands over
  // its ladder, which says everything the pips did plus how far into each bank
  // the player never got. Every other circuit passes nothing and keeps the
  // pips, because a ladder of questions means nothing on a circuit whose games
  // are a sudoku and a crossword.
  hero = null,
  board = null,          // { rows, me, field, keys, maxTotal, limit }
  boardState = 'ready',  // 'loading' | 'error' | 'ready'
  boardNote = null,
  actions = [],          // [{ label, href, onClick, icon, primary, key }]
  fine = null,
}) {
  const limit = board && board.limit ? board.limit : 10;
  const top = board && Array.isArray(board.rows) ? board.rows.slice(0, limit) : [];
  const me = (board && board.me) || null;
  const meIn = !!(me && top.some((x) => x.userKey === me.userKey));
  const keys = (board && board.keys) || rows.map((x) => x.key);
  const maxTotal = (board && board.maxTotal) || 0;
  // A CLOCK BOARD (the Valet Gauntlet): the figure on a row is the combined
  // time, not a total, and a row that has not parked every lot says how many.
  const clock = !!(board && board.clock);

  return (
    <div className="csc">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* THE RAIL. It is the one element that names every game at once, and it
          is at the top for the same reason it is at the top during a run: the
          shape of the sitting is the first thing to read and the detail below
          is the elaboration. */}
      {hero ? <div className="csc-hero">{hero}</div> : rail && rows.length ? (
        <div className="csc-rail" style={{ '--n': rows.length }}>
          {rows.map((x) => (
            <div key={x.key} className={`csc-pip${x.state ? ` ${x.state}` : ''}`}
                 style={{ '--acc': x.accent || 'var(--border,#e5e7eb)' }} title={x.name}>
              <span className="csc-pipn">{x.name}</span>
              <span className="csc-pips">
                {Number.isFinite(x.score) && Number.isFinite(x.total) && x.total > 0
                  ? `${x.score}/${x.total}` : (x.railText || '—')}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="csc-card">
        <div className="csc-hd">
          {eyebrow ? <span className="csc-eye">{eyebrow}</span> : null}
          <h1 className="csc-h1">{headline}</h1>
          {lead ? <p className="csc-lead">{lead}</p> : null}
        </div>

        {figures.length ? (
          <div className="csc-figs" style={{ '--fn': figures.length }}>
            {figures.map((f, i) => (
              <div key={i} className={`csc-fig${f.big ? ' big' : ''}`}>
                <b>{f.v}</b><i>{f.k}</i>
              </div>
            ))}
          </div>
        ) : null}

        {rows.length ? (
          <div className="csc-rows">
            {rows.map((x) => {
              const pct = Number.isFinite(x.score) && x.total > 0
                ? Math.max(0, Math.min(100, Math.round((x.score / x.total) * 100))) : 0;
              return (
                <div key={x.key}
                     className={`csc-row${x.state === 'won' ? ' won' : ''}${x.state === 'open' ? ' open' : ''}`}
                     style={{ '--acc': x.accent || 'var(--accent,#233a63)' }}>
                  {/* THE GLYPH TAKES THE GAME'S DARK COLOUR, not x.accent.
                      accent is `colorNavy` (DailyFiveSummary sets it), which is
                      the BRIGHT variant for a navy ground — and this card is
                      white, so it would have been a pastel on white. The
                      registry's `color` is the same hue at the value a light
                      card needs. */}
                  <span className="csc-ic"><GameGlyph gameKey={x.key} size={26} on="light" /></span>
                  <div className="csc-rt">
                    {x.href
                      ? <a className="csc-rn" href={x.href}>{x.name}</a>
                      : <b className="csc-rn">{x.name}</b>}
                    <i>{x.sub}</i>
                  </div>
                  <div className="csc-rb"><span style={{ width: `${pct}%` }} /></div>
                  {x.action ? (
                    <a className="csc-play" href={x.action.href}>{x.action.label}</a>
                  ) : (
                    <>
                      <div className="csc-rv">
                        {Number.isFinite(x.score) ? x.score : '—'}
                        {Number.isFinite(x.total) && x.total > 0 ? <em>/{x.total}</em> : null}
                      </div>
                      <div className="csc-rr">{x.right || ''}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {board ? (
          <div className="csc-board">
            <div className="csc-bh">
              <span>Combined placement</span>
              {board.field ? <em>{board.field} {board.field === 1 ? 'player' : 'players'}</em> : null}
            </div>
            {boardState === 'loading' ? (
              <div className="csc-bmsg">Reading the board.</div>
            ) : boardState === 'error' ? (
              <div className="csc-bmsg">The board could not be loaded just now.</div>
            ) : top.length ? (
              <div className="csc-lb">
                {top.map((row, i) => (
                  <BoardRow key={row.userKey} row={row} pos={i + 1} keys={keys} clock={clock}
                            me={!!(me && row.userKey === me.userKey)} maxTotal={maxTotal} />
                ))}
                {me && !meIn ? (
                  <BoardRow row={me} pos={me.rank} keys={keys} me maxTotal={maxTotal} clock={clock} />
                ) : null}
              </div>
            ) : (
              <div className="csc-bmsg">Nobody has scored on this run yet today.</div>
            )}
            {boardNote ? <p className="csc-bnote">{boardNote}</p> : null}
          </div>
        ) : null}

        {actions.length ? (
          <div className="csc-acts">
            {actions.map((a, i) => {
              const cls = a.primary ? 'csc-go' : 'csc-alt';
              return a.href
                ? <a key={a.key || i} className={cls} href={a.href}>{a.icon}{a.label}</a>
                : <button key={a.key || i} type="button" className={cls} onClick={a.onClick}>{a.icon}{a.label}</button>;
            })}
          </div>
        ) : null}

        {fine ? <p className="csc-fine">{fine}</p> : null}
      </div>
    </div>
  );
}

// One board row. The pips say the SHAPE of a run at a glance (gold where they
// topped that game, blue where they finished it, empty where they have not
// played it), which is the thing a combined total on its own hides: an
// all-rounder and a specialist reach the same number by different shapes.
function clockOf(secs) {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function BoardRow({ row, pos, keys, me, maxTotal, clock }) {
  const pg = row.perGame || {};
  return (
    <div className={`csc-lbr${me ? ' me' : ''}`}>
      <span className={`csc-rk${pos === 1 ? ' g1' : pos === 2 ? ' g2' : pos === 3 ? ' g3' : ''}`}>{pos || '—'}</span>
      <span className="csc-who">
        {me ? 'You' : (row.username || 'Guest')}
        <s>{row.gamesFinished || row.gamesPlayed || 0} of {keys.length} played</s>
      </span>
      <span className="csc-pipbar">
        {keys.map((k) => {
          const p = pg[k];
          const cls = !p || p.abandoned ? '' : (p.rank === 1 ? 'top' : 'on');
          return <span key={k} className={`csc-bp ${cls}`} />;
        })}
      </span>
      {clock
        ? <span className="csc-tot">{clockOf(row.timeTotal)}{maxTotal && Number(row.total) < maxTotal ? <i>&nbsp;{r1(row.total)}/{maxTotal}</i> : null}</span>
        : <span className="csc-tot">{r1(row.total)}{maxTotal ? <i>/{maxTotal}</i> : null}</span>}
    </div>
  );
}

const CSS = `
.csc{font-family:'Manrope',system-ui,-apple-system,sans-serif;color:var(--ink,#0b0d12);}

.csc-hero{margin:16px 0 16px;}
.csc-rail{display:grid;grid-template-columns:repeat(var(--n,5),1fr);gap:6px;margin:16px 0 14px;}
.csc-pip{border-radius:8px;background:var(--white,#fff);border:1.5px solid var(--border,#e5e7eb);
  padding:7px 8px 8px;border-top:4px solid var(--border,#e5e7eb);min-width:0;}
.csc-pip.now{border-top-color:var(--acc);box-shadow:0 2px 10px rgba(15,23,42,.10);}
.csc-pip.won{border-top-color:#15803d;background:#f0fdf4;}
.csc-pip.done{border-top-color:var(--acc);}
.csc-pip.out{border-top-color:#c0392b;}
.csc-pip.bank{opacity:.62;}
.csc-pip.open{opacity:.55;}
.csc-pipn{display:block;font-weight:800;font-size:11.5px;letter-spacing:.02em;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;line-height:1.45;}
.csc-pips{display:block;font-family:'Manrope',ui-monospace,monospace;font-size:10.5px;}

.csc-card{background:var(--white,#fff);border:1.5px solid var(--border,#e5e7eb);border-radius:14px;
  overflow:hidden;margin-bottom:34px;}
.csc-hd{padding:20px 18px 0;}
.csc-eye{display:block;font-family:'Manrope',ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;font-weight:800;margin-bottom:6px;}
.csc-h1{font-size:26px;font-weight:800;line-height:1.2;margin:0;letter-spacing:-.01em;}
.csc-lead{font-size:13.5px;font-weight:600;line-height:1.5;margin:7px 0 0;}

.csc-figs{display:grid;grid-template-columns:1.4fr repeat(calc(var(--fn,3) - 1),1fr);gap:1px;
  background:var(--border,#e5e7eb);margin:16px 0 0;border-top:1px solid var(--border,#e5e7eb);
  border-bottom:1px solid var(--border,#e5e7eb);}
.csc-fig{background:var(--white,#fff);padding:14px 16px;}
.csc-fig b{display:block;font-size:26px;font-weight:800;line-height:1.1;letter-spacing:-.02em;}
.csc-fig.big b{font-size:34px;}
.csc-fig i{display:block;font-style:normal;font-size:11.5px;font-weight:700;margin-top:3px;}

.csc-rows{padding:6px 0;}
.csc-row{display:flex;align-items:center;gap:11px;padding:11px 18px;
  border-bottom:1px solid var(--border,#e5e7eb);}
.csc-row:last-child{border-bottom:0;}
.csc-row.open{background:var(--surface,#f7f8fa);}
/* Sized explicitly: this replaced a 44px <img>, and a bare span collapses to
   the glyph and takes the row's alignment with it. object-fit went with the
   image it was written for. */
.csc-ic{flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  border-radius:8px;background:var(--surface,#f7f8fa);border:1px solid var(--border,#e5e7eb);}
.csc-rt{min-width:0;width:150px;flex:none;}
.csc-rt .csc-rn{display:block;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;text-decoration:none;}
.csc-rt a.csc-rn:hover{text-decoration:underline;}
.csc-rt i{display:block;font-style:normal;font-size:11.5px;font-weight:600;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.csc-rb{flex:1;min-width:40px;height:8px;border-radius:4px;background:var(--surface-alt,#eef2f7);overflow:hidden;}
.csc-rb span{display:block;height:100%;background:var(--acc);}
.csc-rv{font-family:'Manrope',ui-monospace,monospace;font-size:15px;font-weight:700;flex:none;}
.csc-rv em{font-style:normal;font-size:11.5px;}
.csc-rr{width:58px;flex:none;text-align:right;font-family:'Manrope',ui-monospace,monospace;font-size:11px;}
.csc-play{flex:none;display:inline-flex;align-items:center;gap:6px;background:var(--accent,#233a63);
  border-radius:8px;padding:8px 13px;font-size:11px;font-weight:800;letter-spacing:.06em;
  text-transform:uppercase;text-decoration:none;}

/* THE BOARD, inside the card rather than a page away. */
.csc-board{border-top:1px solid var(--border,#e5e7eb);padding:14px 18px 2px;}
.csc-bh{display:flex;align-items:baseline;gap:9px;margin-bottom:9px;}
.csc-bh span{font-family:'Manrope',ui-monospace,monospace;font-size:10.5px;letter-spacing:.14em;
  text-transform:uppercase;font-weight:800;}
.csc-bh em{font-style:normal;font-size:11px;font-weight:700;}
.csc-lb{border:1.5px solid var(--border,#e5e7eb);border-radius:11px;overflow:hidden;}
.csc-lbr{display:flex;align-items:center;gap:11px;padding:9px 12px;border-bottom:1px solid #f0f2f6;}
.csc-lbr:last-child{border-bottom:0;}
.csc-lbr.me{background:var(--accent-soft,#eef3ff);box-shadow:inset 3px 0 0 var(--blue,#2563eb);}
.csc-rk{flex:none;width:24px;text-align:right;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;}
.csc-who{flex:1;min-width:0;font-size:13.5px;font-weight:800;letter-spacing:-.15px;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.csc-who s{display:block;text-decoration:none;font-size:10.5px;font-weight:700;margin-top:1px;}
.csc-pipbar{flex:none;display:flex;gap:3px;}
.csc-bp{width:16px;height:5px;border-radius:2px;background:#e3e8f0;}
.csc-bp.on{background:var(--blue,#2563eb);}
.csc-bp.top{background:var(--gold,#e8b43a);}
.csc-tot{flex:none;width:66px;text-align:right;font-size:16px;font-weight:800;
  font-variant-numeric:tabular-nums;}
.csc-tot i{font-style:normal;font-size:9.5px;font-weight:700;margin-left:2px;}
.csc-bmsg{padding:16px;text-align:center;font-size:12.5px;font-weight:600;
  background:var(--surface,#f7f8fa);border:1.5px solid var(--border,#e5e7eb);border-radius:11px;}
.csc-bnote{font-size:11.5px;font-weight:600;line-height:1.6;margin:9px 0 0;}

.csc-acts{display:flex;gap:8px;flex-wrap:wrap;padding:16px 18px 0;}
.csc-go{display:inline-flex;align-items:center;gap:8px;background:var(--accent,#233a63);border:0;
  border-radius:10px;padding:13px 18px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer;
  text-decoration:none;}
.csc-go:hover{filter:brightness(1.08);}
.csc-alt{display:inline-flex;align-items:center;gap:7px;background:var(--white,#fff);
  border:1.5px solid var(--border,#e5e7eb);border-radius:10px;padding:12px 15px;font-family:inherit;
  font-weight:800;font-size:14px;cursor:pointer;text-decoration:none;}
.csc-alt:hover{background:var(--surface,#f7f8fa);}
.csc-fine{font-size:12px;font-weight:600;margin:12px 0 0;padding:0 18px 18px;}

/* THE DARK-GROUND OVERRIDES. Both callers sit on navy, and on a loft page
   LoftCap repaints text under the page column for that ground. These say what
   colour every piece of this card is, on white, and carry the same weapon. */
.csc .csc-card h1,.csc .csc-card b,.csc .csc-card .csc-rn,
.csc .csc-card .csc-rv,.csc .csc-card .csc-who,.csc .csc-card .csc-rk,
.csc .csc-card .csc-alt,.csc .csc-rail .csc-pipn{color:var(--ink,#0b0d12)!important;}
.csc .csc-card .csc-play,.csc .csc-card .csc-go{color:#fff!important;}
.csc .csc-card p,.csc .csc-card i,.csc .csc-card em,.csc .csc-card s,
.csc .csc-card .csc-rr,.csc .csc-card .csc-bmsg,.csc .csc-card .csc-bh em,
.csc .csc-rail .csc-pips{color:var(--muted,#3f4757)!important;}
.csc .csc-card .csc-fig.big b,.csc .csc-card .csc-eye,.csc .csc-card .csc-bh span,
.csc .csc-card .csc-tot{color:var(--accent,#233a63)!important;}
.csc .csc-card .csc-rk.g1{color:var(--gold-ink,#8a6b12)!important;}
.csc .csc-card .csc-rk.g2{color:#8b919b!important;}
.csc .csc-card .csc-rk.g3{color:var(--bronze,#a1662f)!important;}
.csc .csc-card .csc-row.won .csc-rr{color:#15803d!important;font-weight:700;}

@media (max-width:640px){
  .csc-rail{grid-template-columns:repeat(auto-fit,minmax(60px,1fr));}
  .csc-pipn{font-size:10.5px;}
  .csc-h1{font-size:22px;}
  .csc-figs{grid-template-columns:1fr 1fr;}
  .csc-fig.big{grid-column:1 / -1;}
  .csc-rt{width:auto;flex:1;}
  .csc-rb{display:none;}
  .csc-lbr .csc-pipbar{display:none;}
}
`;
