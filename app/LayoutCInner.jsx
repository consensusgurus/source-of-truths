'use client';

// LAYOUT C, behind a hidden link (owner, 2026-10-09). Opened only by ?layout=c
// on a game page whose page.js mounts this, on a desktop-width window.
//
// Round two (owner, same night):
//  - THE HEADER IS THE MAIN PAGE'S CAP, same markup, same classes, same rules
//    (copied from StageToday's CSS), same reads: the brand and date, the day's
//    StageLadder strip, your name, one figure per group, Today, All-Time, and
//    the light switch on the shared stage-theme store.
//  - THE LEFT INDEX IS THE MAIN PAGE'S INDEX, item for item and in the same
//    order (hand order from sot_cat_order when the reader set one), and it is
//    WIRED to the main page: a category writes sot_home_pane and opens /
//    on that pane, the info panes open /#<pane>, exactly the two things
//    the home reads on load. The game's own category opens under its button.
//  - "Hide menus & leaderboard" lives in the SUBHEADER, the game's own figures
//    row (.stg-fg), so the control stays in place when the frame is hidden.
//  - Nothing in the frame scrolls on its own (owner, 2026-10-14): the index and
//    the right panel ride the page, so the whole page scrolls together.
//
// It PORTALS INTO the game's .stage-page root (the one holding .stg-top) so it
// inherits the register's --stg-* tokens, which are undefined outside it.
// The finish flood is position:fixed at z 9000 and covers all of this on its own.

import { cycleSiteLook, useStageLook, isColorLook } from '@/lib/stage-look';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { DAILY_GAMES as ALL_GAMES, DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { SKILLS, SKILL_MAP, hasSkill, primarySkill } from '@/lib/daily-skills';
import { RAMP_ORDER, categoryColor, categoryColorLight, categoryAccentInkLight } from '@/lib/category-ramp';
import { gameStatsShort } from '@/lib/daily-row-stats';
import { savedIdentity } from '@/lib/saved-identity';
import { useStageTheme, openLook } from '@/lib/stage-theme';
import { fetchDailyMe, dailyMeQuery, dailyMeIdentity } from './dailyMeClient';
import useDayStats, { etToday } from './useDayStats';
import useGroupStanding from './groups/groupStanding';
import StageLadder from './StageLadder';
import MindLoftMark from './MindLoftMark';
import { LightOffer } from './ThemePop';
import { shareForCredit } from '@/lib/share-credit';
import { SNAP_KEY } from '@/lib/home-snapshot';
import { useRevealPref, REVEAL } from '@/lib/reveal-pref';
import { sharedGet } from './sharedGet';
import { meRequest } from './quizMeClient';
import useMyGames from './useMyGames';

const MIN_W = 1100;
const CAT_FIXED = ['Word', 'Numbers', 'Logic', 'Sudoku', 'Trivia', 'Geography', 'End Game', 'Cards', 'Arcade', 'Crowd Psychology'];
const catLabel = (c) => (c === 'Word' ? 'Words' : c);
const PANE_KEY = 'sot_home_pane';
// SKILLS OR CATEGORIES (owner, 2026-10-20): the same switch the home's index
// carries, on the same remembered key, so a pick on either page holds on both.
const IX_KEY = 'sot_home_ix';
const SK_PRE = 'sk:';
const skillOfId = (id) => (typeof id === 'string' && id.startsWith(SK_PRE) ? SKILL_MAP[id.slice(SK_PRE.length)] || null : null);
const ixLabel = (c) => { const sk = skillOfId(c); return sk ? sk.name : catLabel(c); };
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const MONO = "'Manrope', ui-monospace, SFMono-Regular, Menlo, monospace";

function fmtDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function monthName(iso) {
  try { return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}
function identityQs() {
  const { anonId, email } = dailyMeIdentity();
  const p = new URLSearchParams();
  if (anonId) p.set('anonId', anonId);
  if (email) p.set('email', email);
  return p.toString();
}

// The main page's cap and index rules, copied from app/today/StageToday.jsx
// (desktop only) so the two read identically. Keep them in step.
const CSS = `
html.lc-on .lc-host{padding:var(--lc-hh,62px) 330px 0 260px !important;box-sizing:border-box;min-height:100vh;}
html.lc-on.lc-focus .lc-host{padding:0 !important;}
html.lc-on .lc-host .stg-cap,html.lc-on .lc-host .stg-strip,html.lc-on .lc-host .stg-prog{display:none !important;}
/* The phone's rankings panel shares the leaderboard preference with this
   column's Board tab, so on a desktop frame it must not also open inline. */
html.lc-on .lc-host .stg-panel{display:none !important;}
html.lc-on .stage-tail{display:none !important;}
html.lc-on .lc-host .stg-fg{position:relative;padding-right:400px;}
.lc-subs,.stg-fg>.lc-subs{position:absolute;right:20px;top:50%;transform:translateY(-50%);display:flex;flex-direction:row;align-items:center;gap:8px;}
.lc-shw{position:relative;display:inline-flex;}
.lc-shr{display:inline-flex;align-items:center;gap:6px;color:var(--stg-acc-ink,var(--stg-acc)) !important;border-color:var(--stg-acc-ink,var(--stg-acc)) !important;}
.lc-shm{position:absolute;top:calc(100% + 8px);right:0;z-index:95;width:max-content;max-width:260px;padding:8px 11px;border-radius:10px;background:var(--stg-ink,#e9edf4);color:var(--stg-ground,#0b0f1a);font:700 12px/1.35 Manrope,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);white-space:normal;}
.lc-sub-btn{height:30px;padding:0 12px;border-radius:999px;
  border:1px solid var(--stg-line,rgba(255,255,255,.16));background:transparent;color:var(--stg-ink2,var(--stg-ink));
  font:700 12px Manrope,system-ui,sans-serif;letter-spacing:0;text-transform:none;cursor:pointer;white-space:nowrap;}
.lc-sub-btn:hover{border-color:var(--stg-acc-ink, var(--stg-acc));color:var(--stg-ink);}
.lc-cap,.lc-nav,.lc-side{font-family:Manrope,ui-sans-serif,system-ui,sans-serif;color:var(--stg-ink);box-sizing:border-box;-webkit-font-smoothing:antialiased;}
.lc-cap *,.lc-nav *,.lc-side *{box-sizing:border-box;}
.lc-cap{position:absolute;top:0;left:0;right:0;z-index:90;background:var(--stg-ground);}
.lc-cap .sty-cap{display:grid;grid-template-columns:auto minmax(60px,1fr) auto;align-items:center;gap:26px;padding:11px 22px;position:relative;
  border-bottom:1px solid var(--stg-line);}
.lc-cap .sty-id{display:flex;align-items:baseline;gap:11px;min-width:0;}
.lc-cap .sty-brand{display:flex;align-items:baseline;gap:8px;min-width:0;color:inherit;text-decoration:none;}
.lc-cap .sty-brand>svg{align-self:center;}
.lc-cap .sty-id b{font-size:16px;font-weight:800;letter-spacing:-0.01em;white-space:nowrap;}
.lc-cap .sty-id b em{font-style:normal;color:var(--stg-brand,#7dd3fc);}
.lc-cap .sty-date{font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lc-cap .sty-capl{min-width:0;width:100%;}
.lc-cap .sty-capl .stl{height:12px;}
.lc-cap .sty-rt{display:flex;align-items:center;gap:22px;min-width:0;}
.lc-cap .sty-figs{display:flex;gap:20px;}
.lc-cap .sty-figs>div{text-align:right;}
.lc-cap .sty-figs b{display:block;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1;}
.lc-cap .sty-figs b i{font-style:normal;font-weight:600;color:var(--stg-mute);font-size:12px;}
.lc-cap .sty-figs>div>i{font-style:normal;font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.lc-cap .sty-who b{font-weight:800;}
.lc-cap .sty-fca{display:block;text-align:right;text-decoration:none;color:inherit;}
.lc-cap .sty-fca>i{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;
  text-transform:uppercase;color:var(--stg-mute);}
.lc-cap .sty-fca:hover>b{color:var(--stg-acc-ink);}
.lc-cap .sty-keep{display:inline-flex;align-items:center;border-radius:999px;background:var(--stg-acc);
  color:var(--stg-onramp,#08222e);padding:8px 14px;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;}
.lc-cap .sty-cx{flex:none;font-family:${MONO};font-size:9.5px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-ink2);text-decoration:none;border:1px solid var(--stg-line);border-radius:8px;padding:6px 10px;}
.lc-cap .sty-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}
.lc-cap .sty-tg{display:inline-flex;align-items:center;justify-content:center;padding:6px 9px;background:none;cursor:pointer;font:inherit;}
@media (max-width:1400px){ .lc-cap .sty-date{display:none;} }

/* NO RULES BETWEEN THE COLUMNS (owner, 2026-10-14): the home draws none, so a
   game page draws none either. The index sits exactly where the home's does:
   22px in, 26px under the cap, 212px wide, 26px to the content. Both side
   columns are absolute, not fixed, so they scroll with the page (owner,
   2026-10-14: no scroller of their own). */
.lc-nav{position:absolute;top:var(--lc-hh,62px);left:0;width:260px;z-index:80;padding:26px 0 24px 22px;
  background:var(--stg-ground);}
.lc-nav .sty-ixn{display:flex;flex-direction:column;gap:2px;width:212px;}
.lc-nav .sty-ixb{display:grid;grid-template-columns:10px minmax(0,1fr) auto;align-items:center;gap:10px;border:0;
  background:none;border-radius:8px;padding:8px 10px;font:inherit;font-size:13.5px;font-weight:700;
  color:var(--stg-ink2);text-align:left;cursor:pointer;text-decoration:none;}
.lc-nav .sty-ixb > i{width:10px;height:10px;border-radius:3px;background:var(--cc);}
.lc-nav .sty-ixb > span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.16em;margin-bottom:-.16em;}
.lc-nav .sty-ixb:hover{color:var(--stg-ink);background:var(--stg-surf);}
.lc-nav .sty-ixb.on{background:var(--stg-chip);color:var(--stg-ink);font-weight:800;}
.lc-nav .sty-ixb:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:2px;}
.lc-nav .sty-ixsep{flex:none;height:1px;background:var(--stg-line);margin:6px 10px;}
.lc-nav .lc-sub{display:flex;flex-direction:column;gap:1px;margin:2px 0 6px 20px;}
.lc-nav .lc-g{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:7px;color:var(--stg-mute);
  text-decoration:none;font-size:13px;font-weight:600;}
.lc-nav .lc-g:hover{color:var(--stg-ink);background:var(--stg-surf);}
.lc-nav .lc-g.now{color:var(--stg-ink);background:var(--stg-surf);box-shadow:inset 2px 0 0 var(--cc);font-weight:800;}
.lc-nav .lc-g s{text-decoration:none;margin-left:auto;font-size:11px;font-weight:700;}
.lc-nav .lc-g s.up{color:var(--stg-acc-ink,var(--stg-acc));}
.lc-nav .lc-g s.pz{color:var(--stg-warn,#e8b43a);display:inline-flex;}
.lc-nav button.sty-ixb{width:100%;}
/* The home's Skills / Categories switch, same rule (keep in step with StageToday). */
.lc-nav .sty-ixsw{display:flex;gap:2px;padding:2px;margin:2px 4px 6px;border:1px solid var(--stg-cell-line);border-radius:999px;}
.lc-nav .sty-ixsw button{flex:1 1 auto;border:0;border-radius:999px;background:transparent;color:var(--stg-ink2);
  font:800 10.5px/1 Manrope,system-ui,sans-serif;letter-spacing:.02em;text-transform:uppercase;padding:7px 3px;cursor:pointer;white-space:nowrap;}
.lc-nav .sty-ixsw button[aria-pressed="true"]{background:var(--stg-ink);color:var(--stg-ground);}
.lc-nav .sty-ixsw button:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:2px;}

.lc-side{position:absolute;top:var(--lc-hh,62px);right:0;width:330px;z-index:80;display:flex;flex-direction:column;
  background:var(--stg-ground);}
/* The tab bar is exactly as tall as the game's subheader (.stg-fg, measured
   into --lc-fgh), so its rule and the subheader's are one line. */
.lc-tabs{display:flex;border-bottom:1px solid var(--stg-line);padding:0 8px;flex:none;height:var(--lc-fgh,41px);}
.lc-tab{flex:1;height:100%;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--stg-mute);font:700 12.5px Manrope,system-ui,sans-serif;cursor:pointer;}
.lc-tab.on{color:var(--stg-ink);border-bottom-color:var(--stg-acc-ink, var(--stg-acc));}
.lc-body{padding:16px 20px;font-size:13px;}
.lc-cap2{display:flex;justify-content:space-between;font-size:12px;color:var(--stg-mute);margin-bottom:6px;}
.lc-row{display:grid;grid-template-columns:24px 1fr auto;gap:10px;padding:7px 0;border-bottom:1px solid var(--stg-line);align-items:baseline;}
.lc-row span:first-child{color:var(--stg-mute);font-weight:700;}
.lc-row em{font-style:normal;color:var(--stg-mute);}
.lc-row.me{background:var(--stg-chip);margin:0 -10px;padding:7px 10px;border-radius:6px;box-shadow:inset 3px 0 0 var(--stg-acc-ink, var(--stg-acc));border-bottom:0;}
.lc-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.lc-stat{background:var(--stg-surf);border-radius:10px;padding:12px;}
.lc-stat b{display:block;font-size:22px;font-weight:800;}
.lc-stat i{font-style:normal;font-size:11px;color:var(--stg-mute);}
.lc-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;}
.lc-day{aspect-ratio:1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-decoration:none;
  color:var(--stg-mute);background:var(--stg-surf);}
.lc-wk{font-size:9.5px;font-weight:800;letter-spacing:.08em;color:var(--stg-mute);text-align:center;padding-bottom:2px;}
.lc-day.x{background:none;}
.lc-day.p{background:var(--stg-acc);color:var(--stg-onramp,#08222e);}
.lc-day.t{box-shadow:inset 0 0 0 2px var(--stg-acc-ink, var(--stg-acc));color:var(--stg-ink);}
.lc-mo{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin:14px 0 8px;}
.lc-mo:first-child{margin-top:0;}
.lc-how{font-size:14px;line-height:1.55;}
.lc-empty{color:var(--stg-mute);}
.lc-hold{height:200px;}
.lc-reveal{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:36px 8px;color:var(--stg-mute);}
.lc-reveal-btn{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 16px;border-radius:999px;cursor:pointer;
  border:1px solid var(--stg-line,rgba(255,255,255,.16));background:transparent;color:var(--stg-ink);
  font:700 13px Manrope,system-ui,sans-serif;}
.lc-reveal-btn:hover{border-color:var(--stg-acc-ink, var(--stg-acc));}
.lc-reveal-btn:focus-visible,.lc-hide:focus-visible{outline:2px solid var(--stg-acc-ink, var(--stg-acc));outline-offset:2px;}
.lc-hide{border:0;background:none;padding:0;cursor:pointer;color:var(--stg-mute);font:600 12px Manrope,system-ui,sans-serif;text-decoration:underline;text-underline-offset:2px;}
.lc-hide:hover{color:var(--stg-ink);}

/* ── THE PUZZLE PAGE IN THE PHONE'S LOOK (owner, 2026-10-26) ──
   The same treatment as the desktop home: no rule under the cap, the cap as
   the home draws it (name at 20px, bold date, the strip in 16px blocks, the
   figures plain, the name a pill the height of the look switch), the index as
   outlined tiles, ink pills for the subheader's controls, and the right panel
   one outlined box with its tabs along the top. */
.lc-cap{--dk:2px solid var(--stg-ink);}
/* Under the desktop tone (app/SudokuPastel.jsx) the frame's tiles and panel sit on the raised step, not the tinted surface. */
html[data-stage-tone] .lc-cap,html[data-stage-tone] .lc-nav,html[data-stage-tone] .lc-side{--stg-surf:var(--stg-raise);}
.lc-cap .sty-cap{border-bottom:0;padding:14px 28px 8px;}
.lc-cap .sty-id b{font-size:20px;line-height:1.3;}
.lc-cap .sty-date{font-family:inherit;font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--stg-ink);}
.lc-cap .sty-capl .stl{height:16px;gap:5px;}
.lc-cap .sty-capl .stl-b{gap:1px;}
.lc-cap .sty-capl .stl-r{height:100% !important;border-radius:2px;}
.lc-cap .sty-capl .stl-r.off{background:color-mix(in srgb, var(--stg-ink) 13%, transparent) !important;}
.lc-cap .sty-figs{align-items:center;gap:24px;}
.lc-cap .sty-figs > *{order:5;}
.lc-cap .sty-figs > .lc-fday{order:1;}
.lc-cap .sty-figs > .lc-fg{order:2;}
.lc-cap .sty-figs > .lc-fall{order:3;}
.lc-cap .sty-figs > .sty-who{order:6;display:inline-flex;align-items:center;height:40px;padding:0 16px;border:var(--dk);border-radius:999px;}
.lc-cap .sty-who > i{display:none;}
.lc-cap .sty-who > b{font-size:14px;line-height:1.3;}
.lc-cap .sty-fca{text-align:center;}
.lc-cap .sty-fca > b{font-size:19px;line-height:1.2;}
.lc-cap .sty-fca > i{font-family:inherit;font-size:10px;font-weight:700;letter-spacing:.07em;color:var(--stg-ink);}
.lc-cap .sty-tg{width:40px;height:40px;padding:0;border:var(--dk);border-radius:50%;color:var(--stg-ink);}
.lc-nav{--dk:2px solid var(--stg-ink);padding-top:10px;}
.lc-nav .sty-ixn{gap:8px;width:236px;}
.lc-nav .sty-ixsep{margin:2px 0;background:transparent;}
.lc-nav .sty-ixb{grid-template-columns:minmax(0,1fr);border:var(--dk);border-radius:12px;padding:7px 12px;
  background:var(--stg-surf);color:var(--stg-ink);font-size:14px;font-weight:800;}
.lc-nav .sty-ixb > i{display:none;}
.lc-nav .sty-ixb:hover{background:var(--stg-surf);color:var(--stg-ink);filter:brightness(.97);}
.lc-nav.slc .sty-ixb.ct{background:color-mix(in srgb, var(--cfull) 60%, #fff);color:#0b0d12;}
.lc-nav .sty-ixb.on,.lc-nav .sty-ixb.ct.on{background:var(--stg-ink);color:var(--stg-ground);border-color:var(--stg-ink);}
.lc-nav .sty-ixb.lc-ee{border-color:transparent;background:transparent;padding:5px 12px;font-weight:700;font-size:13.5px;}
.lc-nav .sty-ixsw{border:var(--dk);margin:0;padding:3px;}
.lc-nav .sty-ixsw button{font-size:13px;letter-spacing:0;text-transform:none;padding:7px 3px;}
.lc-nav .sty-ixsw button:first-child{order:2;}
.lc-nav .lc-sub{margin:-4px 0 2px;border:var(--dk);border-radius:12px;overflow:hidden;background:var(--stg-surf);gap:0;}
.lc-nav .lc-g{border-radius:0;color:var(--stg-ink);font-weight:600;padding:5px 12px;border-top:1.5px solid color-mix(in srgb, var(--stg-ink) 14%, transparent);}
.lc-nav .lc-g:first-child{border-top:0;}
.lc-nav .lc-gx{white-space:normal;line-height:1.4;padding:8px 12px;}
.lc-nav .lc-g.now{background:var(--stg-ink);color:var(--stg-ground);box-shadow:none;}
.lc-nav .lc-g s.up,.lc-nav .lc-g s.pz{color:inherit;}
html.lc-on .lc-host{padding-left:290px !important;}
.lc-sub-btn,.lc-reveal-btn{border:2px solid var(--stg-ink) !important;color:var(--stg-ink) !important;font-size:13px;height:34px;}
.lc-sub-btn:hover,.lc-reveal-btn:hover{filter:brightness(.96);}
.lc-shr{color:var(--stg-ink) !important;}
.lc-side{--dk:2px solid var(--stg-ink);right:22px;width:300px;top:calc(var(--lc-hh,62px) + 10px);border:var(--dk);border-radius:12px;overflow:hidden;background:var(--stg-surf);}
.lc-tabs{height:auto;padding:0;border-bottom:2px solid var(--stg-ink);}
.lc-tab{padding:10px 0;border-bottom:0;color:var(--stg-ink);font-weight:800;}
.lc-tab{border-radius:0 !important;margin:0;}
.lc-tab.on{background:var(--stg-ink);color:var(--stg-ground);}
.lc-body{padding:12px 14px;}
.lc-row{border-bottom:1.5px solid color-mix(in srgb, var(--stg-ink) 14%, transparent);}
.lc-row span:first-child,.lc-row em,.lc-cap2,.lc-empty,.lc-hide{color:var(--stg-ink);}
.lc-row.me{background:color-mix(in srgb, var(--stg-ink) 8%, transparent);box-shadow:none;}
.lc-stat{border:var(--dk);background:var(--stg-surf);}
.lc-stat i{color:var(--stg-ink);font-weight:700;}
.lc-day{border:2px solid var(--stg-ink);background:var(--stg-surf);color:var(--stg-ink);border-radius:8px;}
.lc-day.x{border:0;}
.lc-day.p{background:var(--stg-ink);color:var(--stg-ground);}
.lc-day.t{box-shadow:inset 0 0 0 2px var(--stg-ink);}
/* The game's own subheader and gate, inside the frame only: no rule under the
   figures, the figures in plain bold type, the gate's title larger and its
   start button the one ink button (the button every gate puts first in its
   action row, row-reversed to the right edge). */
html.lc-on .lc-host .stg-fg{border-bottom:0;}
html.lc-on .lc-host .stg-fg b{font-family:inherit;font-size:18px;font-weight:800;}
html.lc-on .lc-host .stg-fg i{font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.07em;color:var(--stg-ink);}
html.lc-on .lc-host .stg-gate > div:first-child{font-size:26px !important;line-height:1.3;}
html.lc-on .lc-host .stg-gate > div:last-child > button:first-child:not([type=button]){background:var(--stg-ink) !important;color:var(--stg-ground) !important;
  border:2px solid var(--stg-ink) !important;border-radius:10px !important;font-weight:800 !important;}
`;

export default function LayoutCInner({ gameKey }) {
  const game = DAILY_GAME_MAP[gameKey] || null;
  const [host, setHost] = useState(null);
  const [fgEl, setFgEl] = useState(null);
  const [focus, setFocus] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const shareTimer = useRef(null);
  const [tab, setTab] = useState('board');
  const [statusRaw, setStatusRaw] = useState(null);
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [mine, setMine] = useState(null);
  const [who, setWho] = useState('');
  const [day, setDay] = useState('');
  const [order, setOrder] = useState(null);
  const [tick, setTick] = useState(0);
  const [flag, setFlag] = useState(true);
  const [openCat, setOpenCat] = useState(null);
  const [ixLens, setIxLens] = useState('skill');
  const capRef = useRef(null);
  const [theme, setTheme] = useStageTheme();
  const [siteLook] = useStageLook();
  const { favorites } = useMyGames();
  const MINE = '__mine';
  const light = theme === 'light';
  const stats = useDayStats();
  // Groups standing is a 5-10s server read for a side rail, so it waits until
  // the board has loaded instead of competing with it (2026-10-14).
  const [grpOn, setGrpOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrpOn(true), 2500); return () => clearTimeout(t); }, []);
  const grp = useGroupStanding('today', !!host && grpOn);
  // THE BOARD TAB IS HIDDEN UNTIL ASKED FOR (owner, 2026-10-13): the same
  // remembered preference the phone's "Show leaderboard" sets, so the two
  // can never disagree. See lib/reveal-pref.js.
  const [boardShown, toggleBoard] = useRevealPref(REVEAL.leaderboard);

  // The gate (app/LayoutC.jsx) decides whether this mounts at all.
  useIsoLayoutEffect(() => { setFlag(true); }, []);

  const live = useMemo(() => new Set(liveDailyKeys()), []);
  const games = useMemo(() => ALL_GAMES.filter((g) => live.has(g.key)), [live]);
  const cats = useMemo(() => RAMP_ORDER
    .map((cat) => ({ cat, games: games.filter((g) => g.cat === cat).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((c) => c.games.length), [games]);
  const orderedCats = useMemo(() => {
    if (order && order.length) {
      const r = new Map(order.map((c, i) => [c, i]));
      return [...cats].sort((a, b) => (r.has(a.cat) ? r.get(a.cat) : 99) - (r.has(b.cat) ? r.get(b.cat) : 99));
    }
    const at = (c) => { const i = CAT_FIXED.indexOf(c.cat); return i < 0 ? 99 : i; };
    return [...cats].map((c, i) => [c, i]).sort((a, b) => (at(a[0]) - at(b[0])) || (a[1] - b[1])).map(([c]) => c);
  }, [cats, order]);
  const hueFor = (cat) => (light ? categoryColorLight(cat) : categoryColor(cat));
  // Small marks (the nav swatch, the current-game bar) need the ink step: the
  // light fill is a pastel since 2026-10-16 and vanishes on the pale page.
  const inkFor = (cat) => (light ? categoryAccentInkLight(cat) : categoryColor(cat));
  // Every skill a live game lists, in the order lib/daily-skills.js gives
  // them, each holding its games A to Z (the home's skill index, exactly).
  const skillCats = useMemo(() => SKILLS
    .map((s) => ({ cat: SK_PRE + s.id, games: games.filter((g) => hasSkill(g.key, s.id)).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((c) => c.games.length), [games]);
  const lensCats = ixLens === 'skill' ? skillCats : orderedCats;
  // A skill wears its ramp step; a category its own hue.
  const swatchCat = (c) => { const sk = skillOfId(c); return sk ? RAMP_ORDER[sk.ramp] || c : c; };
  const mySkill = game && primarySkill(game.key) ? SK_PRE + primarySkill(game.key) : null;
  const myCat = game ? (ixLens === 'skill' && mySkill ? mySkill : game.cat) : null;
  const shownCat = openCat === null ? myCat : openCat;
  const pickIx = (v) => {
    setIxLens(v);
    setOpenCat(null);
    try { localStorage.setItem(IX_KEY, v); } catch (e) {}
  };

  // Attach on a wide window only, BEFORE paint so a page switch never shows
  // a frame without the panels. The server never renders any of this.
  useIsoLayoutEffect(() => {
    if (!game || !flag) return undefined;
    let el = null;
    let fgNow = null;
    const attach = () => {
      const next = Array.from(document.querySelectorAll('.stage-page')).find((n) => n.querySelector('.stg-top')) || null;
      if (el && el !== next) el.classList.remove('lc-host');
      el = next;
      if (!el || window.innerWidth < MIN_W) {
        document.documentElement.classList.remove('lc-on');
        // Too narrow means the reserve is wrong too. A missing host leaves it:
        // the reserve rules key on .stg-top, so with no host they do nothing.
        if (window.innerWidth < MIN_W) document.documentElement.classList.remove('lc-pre');
        if (el) el.classList.remove('lc-host');
        setHost(null);
        return;
      }
      el.classList.add('lc-host');
      document.documentElement.classList.add('lc-on');
      setHost(el);
      fgNow = el.querySelector('.stg-fg');
      setFgEl(fgNow);
    };
    attach();
    const late = setTimeout(attach, 500);
    window.addEventListener('resize', attach);
    // An ARCHIVE board (?p=N) remounts the game client (every page keys it by
    // the puzzle number), which throws away the .stage-page the panels were
    // portalled into. Watch for that and re-attach to the new one, or the
    // index, the right panel and the subheader vanish on every archive play.
    // A timer, never requestAnimationFrame: rAF does not run in a background
    // tab, so a page opened behind another would never re-attach.
    let raf = 0;
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => {
      if (raf) return;
      raf = setTimeout(() => {
        raf = 0;
        const cur = Array.from(document.querySelectorAll('.stage-page')).find((n) => n.querySelector('.stg-top')) || null;
        const fg = cur ? cur.querySelector('.stg-fg') : null;
        if (cur !== el || (el && !el.isConnected) || (cur && fg !== fgNow)) attach();
      }, 30);
    }) : null;
    if (mo) mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(late);
      if (raf) clearTimeout(raf);
      if (mo) mo.disconnect();
      window.removeEventListener('resize', attach);
      document.documentElement.classList.remove('lc-on', 'lc-focus');
      document.documentElement.style.removeProperty('--lc-hh');
      if (el) el.classList.remove('lc-host');
    };
  }, [game, flag]);

  useEffect(() => { document.documentElement.classList.toggle('lc-focus', focus); }, [focus]);

  // The subheader's bottom edge, measured, so the right panel's tab bar ends on
  // the same line. Its height varies by game (some carry more figures), so this
  // is never a constant. Read in document space so a scrolled page measures right.
  useEffect(() => {
    if (!fgEl || typeof ResizeObserver === 'undefined') return undefined;
    const root = document.documentElement;
    const set = () => {
      const hh = parseFloat(getComputedStyle(root).getPropertyValue('--lc-hh')) || 62;
      const h = Math.round(fgEl.getBoundingClientRect().bottom + window.scrollY - hh);
      if (h > 20 && h < 200) root.style.setProperty('--lc-fgh', h + 'px');
      else root.style.removeProperty('--lc-fgh');
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(fgEl);
    if (capRef.current) ro.observe(capRef.current);
    return () => { ro.disconnect(); root.style.removeProperty('--lc-fgh'); };
  }, [fgEl]);

  // The cap's real height drives the padding and the side columns' top.
  useEffect(() => {
    const el = capRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    // The height is also kept for the next load, so the reserve the inline
    // script in app/layout.js applies before first paint is this reader's
    // real cap height (it varies with name, groups and the keep-stats link).
    const set = () => {
      const h = el.offsetHeight;
      document.documentElement.style.setProperty('--lc-hh', h + 'px');
      try { if (h > 30 && h < 200) localStorage.setItem('sot_lc_hh', String(h)); } catch (e) {}
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  });

  useEffect(() => {
    setWho(savedIdentity().username || '');
    setDay(etToday());
    try {
      const raw = JSON.parse(localStorage.getItem('sot_cat_order') || 'null');
      if (Array.isArray(raw) && raw.length) setOrder(raw);
    } catch (e) {}
  }, []);
  useIsoLayoutEffect(() => {
    try { if (localStorage.getItem(IX_KEY) === 'cat') setIxLens('cat'); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!host || !game) return undefined;
    let alive = true;
    const qs = identityQs();
    const fresh = tick > 0;
    if (qs) {
      sharedGet('/api/quiz/daily-status?' + qs, { fresh })
        .then((d) => { if (alive && d) setStatusRaw(d); }).catch(() => {});
      meRequest('/api/quiz/me?light=1&' + qs + (fresh ? '&fresh=1' : '')).then((r) => r.json())
        .then((d) => { if (alive && d && d.found !== false) setMine(d); }).catch(() => {});
    }
    const { anonId, email } = dailyMeIdentity();
    fetchDailyMe(dailyMeQuery({ anonId, email, game: game.key }), { fresh })
      .then((d) => { if (alive && d && !d.error) setMe(d); }).catch(() => {});
    const gq = new URLSearchParams({ game: game.key });
    if (anonId) gq.set('anonId', anonId);
    if (email) gq.set('email', email);
    sharedGet('/api/quiz/daily-game?' + gq.toString(), { fresh })
      .then((d) => { if (alive && d && !d.error) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, [host, game, tick]);

  useEffect(() => {
    const on = (e) => {
      const d = e && e.detail;
      if (d && d.open === false) return;
      setTimeout(() => setTick((t) => t + 1), 1500);
    };
    window.addEventListener('sot:loft-finish', on);
    return () => window.removeEventListener('sot:loft-finish', on);
  }, []);

  // Today's done / in-progress sets, read the way the main page reads them.
  const { done, inprog } = useMemo(() => {
    const d = new Set();
    const p = new Set();
    const t = day || etToday();
    const [Y, M, D] = t.split('-').map(Number);
    const yy = Y % 100;
    if (statusRaw) {
      const completed = new Set(statusRaw.completed || []);
      const played = new Set(statusRaw.played || []);
      const abandoned = new Set(statusRaw.abandoned || []);
      const open = new Set(statusRaw.inProgress || []);
      for (const g of games) {
        const id = `${g.key}-${M}-${D}-${yy}`;
        if (completed.has(id) || played.has(id)) d.add(g.key);
        else if (abandoned.has(id) || open.has(id)) p.add(g.key);
      }
    }
    if (typeof window !== 'undefined') {
      for (const g of games) {
        try {
          const c = JSON.parse(localStorage.getItem(`sot_${g.key}_day`) || 'null');
          if (c && c.d === t && c.done) d.add(g.key);
        } catch (e) {}
      }
    }
    return { done: d, inprog: p };
  }, [statusRaw, games, day, tick]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || !host || !flag) return null;

  const blocks = orderedCats.map(({ cat, games: gs }) => ({
    n: gs.length,
    c: `color-mix(in srgb, ${categoryColor(cat)} 60%, #fff)`,
    on: gs.map((g) => done.has(g.key)),
    half: gs.map((g) => inprog.has(g.key) || g.key === game.key),
    pop: gs.map(() => false),
  }));
  const rank = mine ? ((mine.ranks && mine.ranks.xp) || mine.rank || null) : null;
  const mineGames = games.filter((g) => (favorites || []).includes(g.key)).sort((a, b) => a.name.localeCompare(b.name));
  const openGames = shownCat === MINE ? mineGames : (lensCats.find((c) => c.cat === shownCat) || { games: [] }).games;
  const nextUp = openGames.find((g) => g.key !== game.key && !done.has(g.key) && !inprog.has(g.key));
  const toggleCat = (cat) => setOpenCat(shownCat === cat ? '' : cat);
  const gameHref = (g) => (g.href || '/' + g.key);

  // The main page reads sot_home_pane for a games pane and the hash for an info pane.
  // The main page reads sot_home_pane for a games pane and the hash for an
  // info pane. Both go through next/link, so the switch is a client navigation
  // inside the same document: no reload, no boot flash.
  // THE HOME'S SNAPSHOT SHOWS THE PANE IT WAS TAKEN ON (lib/home-snapshot.js),
  // so opening a DIFFERENT pane from here would paint the old one first and
  // then swap. Changing the pane drops the snapshot for that one visit; the
  // home stores a fresh one once its reads land.
  const setPane = (id) => () => {
    try {
      if (localStorage.getItem(PANE_KEY) !== id) localStorage.removeItem(SNAP_KEY);
      localStorage.setItem(PANE_KEY, id);
    } catch (err) {}
  };
  const ixLink = (id, label, hue, cls) => (
    <Link key={id} className={'sty-ixb' + (cls ? ' ' + cls : '')} href="/" style={{ '--cc': hue }} onClick={setPane(id)}>
      <i aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const ixHash = (hash, label) => (
    <Link key={hash} className="sty-ixb lc-ee" href={'/#' + hash} style={{ '--cc': 'var(--stg-mute)' }}>
      <i aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const ixDoor = (href, label) => (
    <Link key={href} className="sty-ixb lc-ee" href={href} style={{ '--cc': 'var(--stg-mute)' }}>
      <i aria-hidden="true" /><span>{label}</span>
    </Link>
  );
  const pauseIcon = (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-label="Paused" role="img"><rect x="2.5" y="2" width="2.6" height="8" rx=".8" fill="currentColor" /><rect x="6.9" y="2" width="2.6" height="8" rx=".8" fill="currentColor" /></svg>
  );
  const subList = (gs, empty) => (
    <div className="lc-sub">
      {gs.length ? gs.map((g) => {
        const isNow = g.key === game.key;
        const paused = !done.has(g.key) && inprog.has(g.key) && !isNow;
        const mark = done.has(g.key) ? '\u2713' : isNow ? 'Playing' : paused ? pauseIcon : (nextUp && nextUp.key === g.key ? 'Up next' : '');
        return isNow ? (
          <span key={g.key} aria-current="page" className="lc-g now" style={{ '--cc': inkFor(g.cat) }}>
            {g.name}<s>{mark}</s>
          </span>
        ) : (
          <Link key={g.key} href={gameHref(g)} className="lc-g" style={{ '--cc': inkFor(g.cat) }}>
            {g.name}<s className={mark === 'Up next' ? 'up' : paused ? 'pz' : undefined}>{mark}</s>
          </Link>
        );
      }) : <span className="lc-g lc-gx">{empty || ''}</span>}
    </div>
  );
  const groups = grp && Array.isArray(grp.groups) ? grp.groups.filter((g) => !g.failed) : [];
  const tabs = [['board', 'Board']].concat(groups.length ? [['group', 'Group']] : [], [['you', 'You'], ['archive', 'Archive'], ['rules', 'Rules']]);
  const ago = (iso) => {
    const t = Date.parse(iso);
    if (!t) return '';
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : Math.round(m / 60) + 'h ago';
  };

  const board = me && me.game && Array.isArray(me.game.board) ? me.game.board : null;
  const field = me && me.game && typeof me.game.field === 'number' ? me.game.field : (board ? board.length : 0);
  const meRow = me && me.me && me.me.rank != null ? me.me : null;
  const mineRec = data && data.mine ? data.mine : null;
  const drops = data && Array.isArray(data.drops) ? data.drops.slice(-42) : [];
  const months = [];
  drops.forEach((d) => {
    const m = monthName(d.dateISO);
    if (!months.length || months[months.length - 1].m !== m) months.push({ m, days: [] });
    months[months.length - 1].days.push(d);
  });
  // Each month laid out on its weekdays, Sunday first: blanks before the first
  // drop, and a blank for any date in between that has no drop.
  months.forEach((mo) => {
    const dayMs = (iso) => Date.parse(String(iso).slice(0, 10) + 'T12:00:00Z');
    const first = mo.days[0];
    const cells = [];
    const lead = first ? new Date(dayMs(first.dateISO)).getUTCDay() : 0;
    for (let i = 0; i < lead; i++) cells.push(null);
    mo.days.forEach((d, i) => {
      if (i > 0) {
        const gap = Math.round((dayMs(d.dateISO) - dayMs(mo.days[i - 1].dateISO)) / 86400000) - 1;
        for (let k = 0; k < gap && k < 31; k++) cells.push(null);
      }
      cells.push(d);
    });
    mo.cells = cells;
  });

  // SHARE FOR CREDIT sits beside the menus toggle (owner, 2026-10-23), which
  // shows in every mode, so it is there before, during and after the game.
  const subBtn = (
    <div className="lc-subs">
      <span className="lc-shw">
        <button type="button" className="lc-sub-btn lc-shr" onClick={() => shareForCredit((m) => {
          setShareMsg(m); clearTimeout(shareTimer.current); shareTimer.current = setTimeout(() => setShareMsg(''), 4200);
        })} title="Share this puzzle. New players from your link earn you drawing tickets.">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 13v7h14v-7" />
          </svg>
          Share for credit
        </button>
        {shareMsg ? <span className="lc-shm" role="status">{shareMsg}</span> : null}
      </span>
      <button type="button" className="lc-sub-btn" onClick={() => setFocus((v) => !v)}>
        {focus ? 'Show menus & leaderboard' : 'Hide menus & leaderboard'}
      </button>
    </div>
  );

  const frame = focus ? null : (
    <>
      <div className="lc-cap" ref={capRef}>
        <div className="sty-cap v2">
          <div className="sty-id">
            <Link className="sty-brand" href="/">
              <MindLoftMark size={20} ink="var(--stg-ink)" accent="var(--stg-brand,#7dd3fc)" />
              <b>Mind <em>Loft</em></b>
            </Link>
            <span className="sty-date">{fmtDate(day)}</span>
          </div>
          <div className="sty-capl"><StageLadder blocks={blocks} light={light} /></div>
          <div className="sty-rt">
            <div className="sty-figs">
              {!who ? <a className="sty-keep" href="/?signup=1">Keep stats, play with friends</a> : null}
              {who ? <div className="sty-who"><b>{who}</b><i>player</i></div> : null}
              {who && grp && Array.isArray(grp.groups) ? grp.groups.map((g) => (
                <Link key={g.code} className="sty-fca lc-fg" href={`/groups/${g.code}`}>
                  <b>{g.rank ? '#' + g.rank : '–'}{typeof g.members === 'number' && g.members ? <i> of {g.members}</i> : null}</b>
                  <i>{g.name}</i>
                </Link>
              )) : null}
              {who ? (
                <Link className="sty-fca lc-fday" href="/#sty-board">
                  <b>{stats.dayRank ? '#' + stats.dayRank : '–'}</b><i>Today</i>
                </Link>
              ) : null}
              {who ? (
                <a className="sty-fca lc-fall" href="/quizzes/hub">
                  <b>{rank ? '#' + rank : '–'}</b><i>All-Time</i>
                </a>
              ) : null}
            </div>
            <button type="button" className="sty-cx sty-tg"
              data-look="" onClick={(e) => cycleSiteLook()}
          aria-haspopup="dialog"
              aria-label="Page look: light or dark, and how much color" title="Page look">
              {light ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
                </svg>
              )}
            </button>
          </div>
          <LightOffer gameKey={gameKey} />
        </div>
      </div>

      <nav className={'lc-nav' + (isColorLook(siteLook) ? ' slc' : '')} aria-label="Sections">
        <div className="sty-ixn">
          {ixLink('all', 'All Puzzles', 'var(--stg-ink)')}
          {/* MY PUZZLES OPENS IN PLACE (owner, 2026-10-26), the starred games
              under it like a category's, rather than leaving for the home. */}
          <button type="button" className={'sty-ixb' + (shownCat === MINE ? ' on' : '')} style={{ '--cc': 'var(--stg-acc)' }}
            aria-expanded={shownCat === MINE} onClick={() => toggleCat(MINE)}>
            <i aria-hidden="true" /><span>My Puzzles</span>
          </button>
          {shownCat === MINE ? subList(mineGames, 'Star a puzzle on the home page and it shows up here.') : null}
          <span className="sty-ixsep" aria-hidden="true" />
          <div className="sty-ixsw" role="group" aria-label="Group puzzles by">
            <button type="button" aria-pressed={ixLens === 'skill'} onClick={() => pickIx('skill')}>Skills</button>
            <button type="button" aria-pressed={ixLens === 'cat'} onClick={() => pickIx('cat')}>Categories</button>
          </div>
          {lensCats.map(({ cat, games: gs }) => (
            <React.Fragment key={cat}>
              <button type="button" className={'sty-ixb ct' + (cat === shownCat ? ' on' : '')} style={{ '--cc': inkFor(swatchCat(cat)), '--cfull': categoryColor(swatchCat(cat)) }}
                aria-expanded={cat === shownCat} onClick={() => toggleCat(cat)}>
                <i aria-hidden="true" /><span>{ixLabel(cat)}</span>
              </button>
              {cat === shownCat ? subList(gs) : null}
            </React.Fragment>
          ))}
          <span className="sty-ixsep" aria-hidden="true" />
          {ixLink('sty-circs', 'Runs', 'var(--stg-mute)', 'lc-ee')}
          {ixHash('sty-quizzes', 'Quizzes')}
          {ixHash('sty-iq', 'IQ Tests')}
          {ixHash('sty-exams', 'School Tests')}
          {ixDoor('/kids', 'Kids')}
          {ixDoor('/lists', 'Top 10 Lists')}
          {ixDoor('/archive', 'Puzzle Archive')}
          <span className="sty-ixsep" aria-hidden="true" />
          {ixHash('sty-board', 'Leaderboards + Stats')}
          {ixHash('sty-comm', 'Most Appreciated')}
        </div>
      </nav>

      <aside className="lc-side" aria-label={game.name + ' panel'}>
        <div className="lc-tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id}
              className={'lc-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="lc-body">
          {tab === 'board' && !boardShown ? (
            <div className="lc-reveal">
              <span>Today's leaderboard is hidden.</span>
              <button type="button" className="lc-reveal-btn" onClick={toggleBoard} aria-pressed="false">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
                </svg>
                Show leaderboard
              </button>
            </div>
          ) : null}
          {tab === 'board' && boardShown ? (
            board === null ? <div className="lc-hold" aria-hidden="true" /> : (
              <>
                <div className="lc-cap2"><span>Today{field ? ` · ${field} ${field === 1 ? 'player' : 'players'}` : ''}</span>
                  <button type="button" className="lc-hide" onClick={toggleBoard} aria-pressed="true">Hide leaderboard</button></div>
                {board.length ? board.slice(0, 14).map((r, i) => {
                  const isMe = meRow && r.userKey && r.userKey === meRow.userKey;
                  return (
                    <div key={(r.userKey || r.username || '') + i} className={'lc-row' + (isMe ? ' me' : '')}>
                      <span>{r.rank != null ? r.rank : i + 1}</span>
                      <b>{isMe ? 'You' : (r.username || 'Guest')}</b>
                      <em>{gameStatsShort(r, game.key) || ''}</em>
                    </div>
                  );
                }) : <div className="lc-empty">Nobody on the board yet today.</div>}
                {meRow && !board.slice(0, 14).some((r) => r.userKey && r.userKey === meRow.userKey) ? (
                  <div className="lc-row me"><span>{meRow.rank}</span><b>You</b><em>{gameStatsShort(meRow, game.key) || ''}</em></div>
                ) : null}
              </>
            )
          ) : null}
          {tab === 'group' ? (
            groups.length ? groups.map((g) => {
              const rows = (g.boards && g.boards[game.key]) || [];
              const feed = Array.isArray(g.feed) ? g.feed.slice(0, 8) : [];
              return (
                <div key={g.code} style={{ marginBottom: 18 }}>
                  <div className="lc-cap2"><b style={{ color: 'var(--stg-ink)' }}>{g.name}</b><span>{g.rank ? `You #${g.rank}${g.members ? ' of ' + g.members : ''} today` : ''}</span></div>
                  <div className="lc-mo">{game.name} in the group</div>
                  {rows.length ? rows.slice(0, 8).map((r, i) => {
                    const isMe = r.userKey && r.userKey === grp.userKey;
                    return (
                      <div key={(r.userKey || '') + i} className={'lc-row' + (isMe ? ' me' : '')}>
                        <span>{r.rank != null ? r.rank : i + 1}</span>
                        <b>{isMe ? 'You' : (r.username || 'Member')}</b>
                        <em>{r.abandoned ? 'Paused' : (gameStatsShort(r, game.key) || '')}</em>
                      </div>
                    );
                  }) : <div className="lc-empty">Nobody in the group has played {game.name} today.</div>}
                  <div className="lc-mo">Group activity</div>
                  {feed.length ? feed.map((f, i) => (
                    <div key={i} className="lc-row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <span style={{ color: 'var(--stg-ink)', fontWeight: 600 }}>
                        <b>{f.userKey === grp.userKey ? 'You' : f.username}</b>{' finished '}{(DAILY_GAME_MAP[f.key] || {}).name || f.key}{f.lead ? ' \u00b7 leads' : ''}
                      </span>
                      <em>{ago(f.at)}</em>
                    </div>
                  )) : <div className="lc-empty">No finishes in the group yet today.</div>}
                </div>
              );
            }) : null
          ) : null}
          {tab === 'you' ? (
            mineRec ? (
              <div className="lc-stats">
                <div className="lc-stat"><b>{mineRec.plays || 0}</b><i>Played</i></div>
                <div className="lc-stat"><b>{mineRec.currentStreak || 0}</b><i>Current streak</i></div>
                <div className="lc-stat"><b>{mineRec.longestStreak || 0}</b><i>Longest streak</i></div>
                <div className="lc-stat"><b>{mineRec.avgPoints != null ? mineRec.avgPoints : '–'}</b><i>Avg points</i></div>
              </div>
            ) : (data ? <div className="lc-empty">Play a day and your record shows up here.</div> : <div className="lc-hold" aria-hidden="true" />)
          ) : null}
          {tab === 'archive' ? (
            months.length ? months.map((mo) => (
              <div key={mo.m}>
                <div className="lc-mo">{mo.m}</div>
                {/* A REAL CALENDAR (owner, 2026-10-17: "sunday isn't on far left").
                    The days used to flow seven to a row from wherever the month's
                    first drop fell, so October 1 (a Thursday) sat in the Sunday
                    column. Sunday is now the first column, the first drop is
                    pushed to its own weekday, and a date with no drop keeps its
                    square empty so every later day stays under its weekday. */}
                <div className="lc-cal">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => <div key={'w' + i} className="lc-wk" aria-hidden="true">{w}</div>)}
                  {mo.cells.map((d, i) => (d ? (
                    <Link key={d.num} className={'lc-day' + (d.isToday ? ' t' : d.played ? ' p' : '')}
                      href={d.isToday ? `${game.href || '/' + game.key}` : `${game.href || '/' + game.key}?p=${d.num}`}
                      title={d.dateISO}>{Number(String(d.dateISO).slice(8, 10))}</Link>
                  ) : <div key={'b' + i} className="lc-day x" aria-hidden="true" />))}
                </div>
              </div>
            )) : <div className="lc-hold" aria-hidden="true" />
          ) : null}
          {tab === 'rules' ? (
            <div className="lc-how"><p style={{ marginTop: 0 }}><b>{game.tag}.</b></p><p>{game.how}</p></div>
          ) : null}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {createPortal(<><style dangerouslySetInnerHTML={{ __html: CSS }} />{frame}{fgEl ? null : <div style={{ position: 'fixed', top: 8, right: 16, zIndex: 91 }}>{subBtn}</div>}</>, host)}
      {fgEl ? createPortal(subBtn, fgEl) : null}
    </>
  );
}
