'use client';

// DailySlateRail — today's slate, as a sliding rail of game NAMES, sitting
// directly under the navy masthead on a daily game page (owner-approved
// mockup, 2026-08-04, "Direction C").
//
// WHY IT EXISTS: a game page used to be a dead end. You finished Crux and the
// only way to the next daily was back to the home board. The rail puts all 42
// dailies one tap away from inside any game, marks the ones you have already
// finished today, and highlights the one you are on.
//
// COLOUR (owner, 2026-08-07): the rail is the THIRD NAVY BAND, #0e183b, one
// step darker than the stat bar above it, so the whole masthead group reads as
// one continuous block: #233a63 masthead, #101d44 stat bar, #0e183b slate.
// It was #eef3ff (accentSoft) until now, borrowed from the home page's own
// "Today's Slate" panel. That made the rail rhyme with the HOME PAGE but read
// as a separate object stuck under the HEADER, which is what the owner asked
// to fix. The chips are translucent white on the navy rather than a new blue,
// so the band stays one colour no matter how many games sit in it, and the
// 3px var(--blue) rule under the stat bar (.qchm-r2 in QuizCommandHeader,
// shared with the quiz surfaces so it is NOT ours to change) becomes the seam
// between the two navy bands. Done stays green and the current game stays
// var(--blue); both are simply retuned to read on navy. Do not retint any of
// this in isolation: the three bands are one system.
//
// NOTHING HERE IS PINNED. The rail scrolls away with the rest of the chrome:
// the board must be able to own the viewport (owner rule, 2026-08-04).
//
// The roster is a copy of DailyStrip's GAMES key order (the home slate order),
// resolved through DAILY_GAME_MAP so names and hrefs can never drift from
// lib/daily-games. Add a game there and to this list to have it appear here.

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DAILY_GAME_MAP, isRetiredDaily } from '@/lib/daily-games';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';

// Manrope, matching the header's own micro-labels (PLAYER / RANK / IQ POINTS).
// Owner ruling 2026-08-04: no mono anywhere in the daily chrome.
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

const SLATE_KEYS = [
  'crux', 'emcee', 'shards', 'garble', 'links', 'span', 'dating', 'tally', 'suds', 'quilt', 'cages', 'sando', 'carve',
  'extra', 'stet', 'outwit', 'outrank', 'tuck', 'alibi', 'cipher', 'ping', 'warmer', 'jester',
  'sworn', 'axiom', 'hearsay', 'venn', 'stands', 'bracket', 'lode', 'etch', 'glyph', 'hedge',
  'listed', 'mate', 'four', 'park', 'impound', 'junkyard', 'check', 'rung', 'crunch', 'taire', 'fib', 'streak',
  'feud', 'babel', 'hands', 'finesse', 'chain', 'turn', 'suffice', 'strata', 'redact', 'paths',
  'deep', 'anon', 'blocks', 'chomp', 'sweep', 'docket', 'blitz', 'blitzed', 'sums', 'hinge', 'defend', 'barter', 'plot', 'sixes', 'niche', 'shoe', 'queen', 'towers', 'mercury', 'polka', 'atlas', 'sport', 'calc', 'encore', 'biz', 'flank', 'knight', 'script', 'quotes', 'focus', 'thread', 'slot', 'whittle', 'diag',
// A retired game leaves the rail on its own the morning after its bank's last
// drop (RETIRED_DAILY in lib/daily-games). Its key stays listed above so the
// home board's order is unbroken if the bank is ever extended.
].filter((k) => !isRetiredDaily(k));

export default function DailySlateRail({ current = null }) {
  const railRef = useRef(null);
  const [perGame, setPerGame] = useState(null);

  // Same completion source as DailyGamesGrid: /api/quiz/daily-me without a
  // `game`, which is its cheapest form (row counts only). A signed-out visitor
  // has no identity to ask about, so the rail simply shows no ticks.
  useEffect(() => {
    const { anonId, email } = dailyMeIdentity();
    if (!anonId && !email) return undefined;
    let alive = true;
    fetchDailyMe(dailyMeQuery({ anonId, email }))
      .then((d) => { if (alive && d && d.perGame) setPerGame(d.perGame); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const done = perGame
    ? new Set(Object.keys(perGame).filter((k) => !(perGame[k] && perGame[k].abandoned)))
    : new Set();

  // lib/daily-games derives a row's href from its key when the row has none,
  // but the jester row's route is /jesters (the directory was pluralised, the
  // key never was), so the derived /jester would 404. Corrected here rather
  // than in the shared registry, where the derived href has other consumers.
  // Sorted A-Z by display name (owner, 2026-08-07). SLATE_KEYS keeps the home
  // board's order, which is meaningful there but makes a 49-name rail a linear
  // search: you cannot find the game you want without reading every chip. The
  // key list stays as-is (it is still the roster, see the header note); only
  // the render order changes.
  const games = SLATE_KEYS.map((k) => DAILY_GAME_MAP[k]).filter(Boolean)
    .map((g) => (g.key === 'jester' ? { ...g, href: '/jesters' } : g))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const played = games.filter((g) => done.has(g.key)).length;

  // Park the current game near the left edge so the games either side of it are
  // in view on arrival. Measured with getBoundingClientRect, NOT offsetLeft:
  // .dsr is position:relative (it has to be, to sit above the fixed Grain
  // overlay), so it becomes the offsetParent and offsetLeft would include the
  // label and arrow gutters, over-scrolling the rail by ~200px and pushing the
  // current game off the left edge (seen live on /garble, 2026-08-04).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const el = rail.querySelector('[data-now="1"]');
    if (!el) return;
    const delta = el.getBoundingClientRect().left - rail.getBoundingClientRect().left;
    rail.scrollLeft = Math.max(0, rail.scrollLeft + delta - 96);
  }, [current]);

  const nudge = (dx) => { const r = railRef.current; if (r) r.scrollBy({ left: dx, behavior: 'smooth' }); };

  return (
    <div className="dsr">
      <style>{`
        .dsr{background:#0e183b;border-bottom:1px solid #0b132f;position:relative;z-index:2;}
        .dsr-in{max-width:1560px;margin:0 auto;padding:7px clamp(14px,2.5vw,34px);display:flex;align-items:center;gap:11px;}
        .dsr-k{font-family:${SANS};font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#93aae2;white-space:nowrap;flex:none;}
        .dsr-btn{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.10);border:1px solid #1f305c;color:#dbe6ff;display:flex;align-items:center;justify-content:center;font:inherit;font-size:13px;font-weight:800;line-height:1;cursor:pointer;flex:none;padding:0;}
        .dsr-btn:hover{background:rgba(255,255,255,.22);border-color:#5f80cf;}
        .dsr-rail{flex:1;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;}
        .dsr-rail::-webkit-scrollbar{display:none;}
        .dsr-row{display:flex;gap:6px;width:max-content;padding:1px 0;}
        .dsr-g{background:rgba(255,255,255,.10);border:1px solid #1f305c;border-radius:999px;padding:5px 12px;font-size:11.5px;font-weight:700;color:#dbe6ff;white-space:nowrap;text-decoration:none;flex:none;}
        .dsr-g:hover{background:rgba(255,255,255,.22);border-color:#5f80cf;}
        .dsr-g.is-done{background:rgba(52,211,153,.15);border-color:#2f7d5e;color:#8ff0c4;}
        .dsr-g.is-now{background:var(--blue);border-color:#6d9bff;color:var(--white);box-shadow:0 1px 3px rgba(0,0,0,.35);}
        .dsr-n{font-size:11px;font-weight:800;color:#a9bee8;white-space:nowrap;flex:none;}
        @media(max-width:860px){.dsr-btn{display:none;}.dsr-in{gap:9px;padding-left:12px;padding-right:12px;}}
        @media(max-width:520px){.dsr-k{display:none;}}
      `}</style>
      <div className="dsr-in">
        <span className="dsr-k">Today&rsquo;s slate</span>
        <button type="button" className="dsr-btn" aria-label="Scroll slate left" onClick={() => nudge(-240)}>&lsaquo;</button>
        <div className="dsr-rail" ref={railRef}>
          <div className="dsr-row">
            {games.map((g) => {
              const now = g.key === current;
              const cls = `dsr-g${now ? ' is-now' : (done.has(g.key) ? ' is-done' : '')}`;
              return (
                <Link key={g.key} href={g.href} className={cls} data-now={now ? '1' : undefined}
                  aria-current={now ? 'page' : undefined} title={g.tag || g.name}>
                  {done.has(g.key) && !now ? '✓ ' : ''}{g.name}
                </Link>
              );
            })}
          </div>
        </div>
        <button type="button" className="dsr-btn" aria-label="Scroll slate right" onClick={() => nudge(240)}>&rsaquo;</button>
        <span className="dsr-n">{played}/{games.length}</span>
      </div>
    </div>
  );
}
