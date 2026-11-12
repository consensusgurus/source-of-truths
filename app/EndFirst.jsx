'use client';

// THE FIRST SCREEN OF THE ENDING (owner, 2026-11-11, "Clean Ending Mockups"
// canvas, the combined B + A direction). The owner on the retention ending of
// 2026-11-07: "these end screens suck ... clean them up, keep people playing".
// So the ending now LANDS on this, on the full category pastel, and nothing
// else:
//
//   the result        the verdict and the game's key figure
//   three pills       this puzzle's rank (press it: today's leaderboard opens
//                     in place on a desktop, as a sheet on a phone), the group
//                     standing, and Today's Puzzles (the day board, which the
//                     owner renamed from "All" the same day). No streak.
//   three big plays   Play Similar, the run (Finish the <run> when this game
//                     is part of one, else Start a Run) IN THE MIDDLE, and
//                     Switch Gears (the easiest pick from another category).
//                     Each says its category or size, its minutes and how many
//                     played it today.
//   three quiet ones  Challenge (the GIF share), Full Results Page (the
//                     ending as it was: the sheet on a desktop, the rolling
//                     page on a phone) and All puzzles.
//
// Nothing here starts by itself. Every figure is computed by StageStick and
// passed in; this file lays them out. It reads the --sst-* colours of the
// surface it sits on, so it follows the dark look with the rest of the ending.

import { useState } from 'react';
import GameGlyph from './GameGlyph';

// The reader's place among their group on this game, or null: the same read
// the phone's result bar makes (app/StageRoll.jsx).
export function groupStandingOf(grp, gameKey) {
  if (!grp || !Array.isArray(grp.groups) || !gameKey) return null;
  for (const g of grp.groups) {
    if (!g || g.failed) continue;
    const all = (g.boards && g.boards[gameKey]) || [];
    const mine = all.find((r) => r.userKey === grp.userKey);
    if (mine && all.length > 1) return { rank: mine.rank, n: all.length, name: g.name };
  }
  return null;
}

function Chevron({ up }) {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Big({ p, tone }) {
  if (!p) return null;
  return (
    <a className={'ef-bb ' + tone} href={p.href} onClick={p.onClick || undefined}>
      <span className="g">{p.glyph ? <GameGlyph gameKey={p.glyph} size={40} /> : null}</span>
      <span className="t">
        <small>{p.eyebrow}</small>
        <b className="n">{p.name}</b>
        {p.sub ? <span className="s">{p.sub}</span> : null}
      </span>
    </a>
  );
}

function Board({ board }) {
  return (
    <>
      {board.rows.map((r, i) => (r.gap
        ? <div key={'g' + i} className="ef-lg" aria-hidden="true" />
        : (
          <div key={i} className={'ef-lr' + (r.me ? ' me' : '')}>
            <span className="k">{typeof r.rank === 'number' ? `#${r.rank}` : (r.rank || '')}</span>
            <span className="w">{r.me ? 'You' : r.name}</span>
            <span className="f">{r.fig}</span>
          </div>
        )))}
    </>
  );
}

export default function EndFirst({
  phone = false, on = true, ready = true,
  eyebrow, verdict, metricNode = null, metricLabel = null,
  gamePill = null, groupPill = null, dayPill = null, board = null,
  sim = null, run = null, gear = null, retry = null,
  chal = null, onFull, allHref = '/#all', homeHref = '/',
  replay = null, onBack = null, backLabel = 'Show board', archiveHref = null, archiveLabel = 'Past puzzles',
}) {
  const [open, setOpen] = useState(false);
  const canOpen = !!(board && board.rows && board.rows.length);
  const bigs = [sim ? ['a', sim] : null, run ? ['b', run] : null, gear ? ['c', gear] : null].filter(Boolean);
  const replayNode = replay ? (replay.href
    ? <a className="ef-tl" href={replay.href} onClick={replay.onClick || undefined}>Replay</a>
    : <button type="button" className="ef-tl" onClick={replay.onClick}>Replay</button>) : null;
  return (
    <div className={'ef' + (phone ? ' ef-ph' : ' ef-dk') + (on ? ' on' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ef-top">
        {phone ? <a className="ef-tl ef-home" href={homeHref}><span aria-hidden="true">&lsaquo;</span> Mind Loft</a> : null}
        <span className="ef-tr">
          {replayNode}
          {onBack ? <button type="button" className="ef-tl" onClick={onBack}>{backLabel}</button> : null}
          {archiveHref && !phone ? <a className="ef-tl" href={archiveHref}>{archiveLabel}</a> : null}
        </span>
      </div>

      <div className="ef-mid">
        <div className="ef-eb">{eyebrow}</div>
        <div className="ef-vm">
          <span className="v">{verdict}</span>
          {metricNode ? <b>{metricNode}</b> : null}
          {metricNode && metricLabel ? <i>{metricLabel}</i> : null}
        </div>
        {(gamePill || groupPill || dayPill) ? (
          <div className="ef-pills">
            {gamePill ? (canOpen
              ? (
                <button type="button" className="ef-pill ef-pb" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                  <span>{gamePill.name}: <b>#{gamePill.rank}</b>{gamePill.of ? ` of ${gamePill.of}` : ''}</span><Chevron up={open} />
                </button>
              )
              : <span className="ef-pill">{gamePill.name}: <b>#{gamePill.rank}</b>{gamePill.of ? ` of ${gamePill.of}` : ''}</span>) : null}
            {groupPill ? <span className="ef-pill"><b>#{groupPill.rank}</b> of {groupPill.n} in {groupPill.name}</span> : null}
            {dayPill ? (
              <span className="ef-pill">Today&rsquo;s Puzzles: <b>#{dayPill.rank}</b> of {dayPill.of}{dayPill.up ? <em>Up {dayPill.up}</em> : null}</span>
            ) : null}
          </div>
        ) : null}
        {!phone && open && canOpen ? (
          <div className="ef-lb">
            <div className="ef-lh">{board.title}</div>
            <Board board={board} />
          </div>
        ) : null}
      </div>

      <div className={'ef-acts' + (ready ? ' on' : '')}>
        {retry ? (
          <button type="button" className="ef-sb ef-retry" onClick={retry.onReplay}>
            Replay instantly{retry.chip ? <span> &middot; {retry.chip}</span> : null}
          </button>
        ) : null}
        {bigs.length ? (
          <div className="ef-big" style={{ '--ef-n': bigs.length }}>
            {bigs.map(([tone, p]) => <Big key={tone} p={p} tone={tone} />)}
          </div>
        ) : null}
        <div className="ef-sm" style={{ '--ef-n': (chal ? 1 : 0) + 1 + (allHref ? 1 : 0) }}>
          {chal ? <button type="button" className="ef-sb" onClick={chal.onClick}>{chal.label}</button> : null}
          <button type="button" className="ef-sb" onClick={onFull}>Full Results Page</button>
          {allHref ? <a className="ef-sb" href={allHref}>All puzzles</a> : null}
        </div>
      </div>

      {phone && open && canOpen ? (
        <div className="ef-sheet" role="dialog" aria-label={board.title}>
          <div className="ef-sh">
            <div className="ef-lh">{board.title}</div>
            <button type="button" className="ef-tl" onClick={() => setOpen(false)}>Close</button>
          </div>
          <Board board={board} />
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
.ef{position:relative;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
  color:var(--sst-ink);text-align:center;cursor:default;opacity:0;transition:opacity .3s ease;}
.ef.on{opacity:1;}
.ef-dk{padding:64px 40px 40px;}
.ef-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ef-dk .ef-top{position:absolute;top:16px;right:24px;}
.ef-tr{display:flex;align-items:center;gap:2px;margin-left:auto;}
.ef-tl{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 10px;border:0;border-radius:8px;background:transparent;
  color:var(--sst-ink);font:inherit;font-size:14px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;}
.ef-tl:hover{background:var(--sst-wash);}
.ef-home{font-size:15px;font-weight:800;padding-left:2px;}
.ef-mid{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;}
.ef-eb{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}
.ef-vm{display:flex;align-items:baseline;justify-content:center;flex-wrap:wrap;gap:0 .26em;font-size:clamp(46px,6.2vw,88px);
  line-height:1.04;letter-spacing:-.035em;}
.ef-vm .v{font-weight:800;}
.ef-vm b{font-weight:600;font-variant-numeric:tabular-nums;}
.ef-vm i{font-style:normal;font-size:.24em;font-weight:700;letter-spacing:0;}
.ef-pills{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;}
.ef-pill{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 16px;border-radius:99px;background:var(--sst-wash);
  color:var(--sst-ink);font-size:15px;font-weight:600;white-space:nowrap;}
.ef-pill b{font-weight:800;}
.ef-pill em{font-style:normal;font-size:12px;font-weight:800;padding:2px 9px;margin-right:-8px;border-radius:99px;background:var(--sst-ink);color:var(--sst-bg);}
.ef-pb{min-height:44px;border:1px solid var(--sst-ink);font:inherit;font-size:15px;font-weight:600;cursor:pointer;}
.ef-pb:hover{background:var(--sst-card);}
.ef-lb{width:100%;max-width:640px;max-height:250px;overflow-y:auto;padding:14px 16px;border:1px solid var(--sst-ink);border-radius:16px;
  background:var(--sst-wash);text-align:left;}
.ef-lh{font-size:12px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;padding:0 12px 6px;}
.ef-lr{display:flex;align-items:center;gap:16px;padding:8px 12px;border-radius:8px;font-size:15px;font-weight:600;}
.ef-lr.me{background:color-mix(in srgb,var(--sst-ink) 12%,transparent);font-weight:800;}
.ef-lr .k{width:44px;flex:none;font-variant-numeric:tabular-nums;}
.ef-lr .w{flex:1;min-width:0;overflow-wrap:anywhere;}
.ef-lr .f{font-variant-numeric:tabular-nums;white-space:nowrap;}
.ef-lg{height:1px;margin:4px 12px;background:var(--sst-rule);}
.ef-acts{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:1000px;opacity:0;transform:translateY(10px);
  pointer-events:none;transition:opacity .3s ease,transform .3s cubic-bezier(.2,.8,.2,1);}
.ef-acts.on{opacity:1;transform:none;pointer-events:auto;}
.ef-big{display:grid;grid-template-columns:repeat(var(--ef-n,3),minmax(0,1fr));gap:16px;width:100%;}
.ef-bb{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:"e e" "g n" "s s";align-items:center;gap:10px 14px;
  min-width:0;padding:22px 24px;border:1px solid var(--sst-ink);border-radius:20px;color:var(--sst-ink);text-align:left;text-decoration:none;
  transition:transform .15s ease;}
.ef-bb:hover{transform:translateY(-2px);}
.ef-bb:focus-visible,.ef-sb:focus-visible,.ef-tl:focus-visible,.ef-pb:focus-visible{outline:2px solid var(--sst-ink);outline-offset:3px;}
.ef-bb.a{background:var(--sst-ink);color:var(--sst-bg);}
.ef-bb.b{background:transparent;}
.ef-bb.c{background:var(--sst-card);}
.ef-bb .t{display:contents;}
.ef-bb small{grid-area:e;font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}
.ef-bb .g{grid-area:g;display:flex;align-items:center;justify-content:center;width:44px;height:44px;}
.ef-bb .n{grid-area:n;font-size:clamp(24px,2.5vw,34px);font-weight:800;line-height:1.18;letter-spacing:-.02em;overflow-wrap:anywhere;}
.ef-bb .s{grid-area:s;font-size:15px;font-weight:700;line-height:1.35;}
.ef-sm{display:grid;grid-template-columns:repeat(var(--ef-n,3),minmax(0,1fr));gap:12px;width:100%;}
.ef-sb{display:flex;align-items:center;justify-content:center;gap:6px;min-height:52px;padding:0 12px;border:1px solid var(--sst-ink);border-radius:12px;
  background:transparent;color:var(--sst-ink);font:inherit;font-size:15px;font-weight:800;text-align:center;text-decoration:none;cursor:pointer;}
.ef-sb:hover{background:var(--sst-wash);}
.ef-retry{width:100%;border-radius:12px;background:var(--sst-ink);color:var(--sst-bg);}
.ef-retry:hover{background:var(--sst-ink);filter:brightness(1.12);}
.ef-retry span{font-weight:700;}

/* THE PHONE: the colour is the page. The header sits at the top, the result
   takes the middle, the three plays stack, and two quiet buttons close it. */
.ef-ph{justify-content:flex-start;gap:12px;min-height:100vh;min-height:100dvh;
  padding:max(10px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));}
.ef-ph .ef-top{width:100%;}
.ef-ph .ef-mid{flex:1;justify-content:center;gap:12px;padding:8px 0;}
.ef-ph .ef-eb{font-size:12px;}
.ef-ph .ef-vm{flex-direction:column;align-items:center;gap:4px;font-size:clamp(44px,14vw,60px);}
.ef-ph .ef-vm b{font-size:.82em;}
.ef-ph .ef-pill{min-height:36px;padding:0 14px;font-size:14px;font-weight:700;}
.ef-ph .ef-pb{min-height:44px;}
.ef-ph .ef-acts{gap:10px;}
.ef-ph .ef-big{grid-template-columns:minmax(0,1fr);gap:10px;}
.ef-ph .ef-bb{grid-template-areas:"g e" "g n" "g s";gap:2px 14px;min-height:84px;padding:12px 18px;border-radius:18px;}
.ef-ph .ef-bb small{font-size:12px;}
.ef-ph .ef-bb .n{font-size:26px;}
.ef-ph .ef-bb .s{font-size:13px;}
.ef-ph .ef-sm{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.ef-ph .ef-sm .ef-sb{font-size:14px;}
.ef-ph .ef-sm a.ef-sb{grid-column:1 / -1;}
.ef-sheet{position:fixed;left:0;right:0;bottom:0;z-index:5;max-height:62vh;overflow-y:auto;padding:12px 12px max(22px,env(safe-area-inset-bottom));
  border-top:1px solid var(--sst-ink);border-radius:20px 20px 0 0;background:var(--sst-card);color:var(--sst-ink);text-align:left;
  animation:ef-up .3s cubic-bezier(.2,.7,.2,1) both;}
.ef-sh{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ef-sh .ef-lh{padding-bottom:0;}
.ef-sheet .ef-lr{padding:11px 12px;font-size:16px;}
@keyframes ef-up{from{transform:translateY(100%);}to{transform:none;}}
@media (max-width:1180px){.ef-dk .ef-bb{padding:18px;}}
@media (prefers-reduced-motion:reduce){.ef,.ef-acts,.ef-bb{transition:none;}.ef-sheet{animation:none;}}
`;
