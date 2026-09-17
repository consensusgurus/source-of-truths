"use client";

// PremierePop — the once-per-launch card for a RETURNING player who has not
// yet played a daily that just premiered (owner, 2026-09-01). Built for Thread
// and Focus; any later launch is one line in PREMIERES (lib/daily-games.js).
//
// It is the second unasked-for thing on the site after the 8/30 cleanup left
// only the Gauntlet nudge, so it says exactly three things: which games are
// new, one line each on what they are, and Play. The X closes it.
//
// FOUR CONDITIONS, all required:
//
//   OPEN. Today (ET) is inside a premiere's [from, until] window. A premiere
//   past its `until` is silent forever; nobody back after a month is handed a
//   stack of old launches.
//
//   RETURNING. Positive play signals only: a stored identity, any
//   sot_<key>_day breadcrumb, or any per-puzzle save. sot_quiz_anon is minted
//   on first paint and proves nothing (same test WelcomeOverlay used).
//
//   UNPLAYED. No local footprint for that game (stats record, breadcrumb, a
//   save that was actually started) AND the server's archive count for it is
//   zero. The server read is what stops it nudging somebody who played on
//   their phone this morning. It waits for daily-status, which the page
//   fetches anyway, so it costs no request.
//
//   ONCE. sot_premiere_<key> is stamped the moment it renders, per game, per
//   browser, never per day. Seeing the card burns every game on it.
//
// IT WAITS ITS TURN. The theme intro (first visit ever) and StageWelcome (first
// visit of the ET day) both own the arrival; this polls until neither is on
// screen, then opens. Two full-screen events never share a load.
//
// ?premiere=0 suppresses, ?premiere=1 previews without stamping, matching
// ?welcome=. Stage tokens only, so it follows the light switch.

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DAILY_GAME_MAP, PREMIERES } from '@/lib/daily-games';
import { RAMP_INK, RAMP_INK_LIGHT, categoryColor, categoryColorLight, rampIndexFor } from '@/lib/category-ramp';
import GameGlyph from './GameGlyph';
import { fetchDayStatus, etToday } from './useDayStats';

const KEY = (k) => `sot_premiere_${k}`;

function returning() {
  try {
    if (localStorage.getItem('sot_quiz_identity')) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^sot_[a-z]+_day$/.test(k) || /^sot_[a-z]+_stats$/.test(k) || /^sot_[a-z]+_\d+$/.test(k)) return true;
    }
  } catch (e) {}
  return false;
}

function playedLocally(key) {
  try {
    if (localStorage.getItem(`sot_${key}_stats`)) return true;
    if (localStorage.getItem(`sot_${key}_day`)) return true;
    const re = new RegExp(`^sot_${key}_\\d+$`);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (!re.test(k)) continue;
      const sv = JSON.parse(localStorage.getItem(k) || 'null');
      // Opening a game is not starting it: t0 is the started signal.
      if (sv && (sv.t0 || sv.status === 'done' || sv.status === 'won' || sv.status === 'lost')) return true;
    }
  } catch (e) {}
  return false;
}

function arrivalBusy() {
  // The first-load theme flip is RETIRED and no longer stamps sot_theme_intro2
  // (lib/stage-theme.js), so waiting on that key held this card back forever
  // for every browser that arrived after 2026-09-01. The theme bubble that
  // replaced it is read off the DOM instead, like everything else here.
  // .gpp-scrim: the Groups launch card (app/GroupsPop.jsx). Never two cards at once.
  return !!document.querySelector('.stw.up, .stw.shrink, .gpp-scrim, .stg-tpop');
}

export default function PremierePop() {
  const [games, setGames] = useState(null);

  useEffect(() => {
    let alive = true;
    let force = false;
    try {
      const q = new URLSearchParams(window.location.search).get('premiere');
      if (q === '0') return;
      force = q === '1';
    } catch (e) {}

    const today = etToday();
    const open = PREMIERES.filter((p) => today >= p.from && today <= p.until && DAILY_GAME_MAP[p.key]);
    if (!open.length) return;
    if (!force && !returning()) return;

    let cands = open.map((p) => p.key).filter((k) => force || (!playedLocally(k) && !safeGet(KEY(k))));
    if (!cands.length) return;

    const timers = [];
    fetchDayStatus().then((d) => {
      if (!alive) return;
      if (d && d.archive && !force) {
        cands = cands.filter((k) => !(d.archive[k] && d.archive[k].played > 0));
      }
      if (!cands.length) return;
      // Wait out the arrival, then open. Give up after ~15s rather than open
      // onto a page the reader has already started using.
      const started = Date.now();
      const tick = () => {
        if (!alive) return;
        if (arrivalBusy() && Date.now() - started < 15000) { timers.push(setTimeout(tick, 300)); return; }
        if (Date.now() - started >= 15000 && arrivalBusy()) return;
        if (!force) for (const k of cands) { try { localStorage.setItem(KEY(k), today); } catch (e) {} }
        setGames(cands);
      };
      timers.push(setTimeout(tick, 600));
    });
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (!games) return;
    const k = (e) => { if (e.key === 'Escape') setGames(null); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [games]);

  if (!games) return null;
  const rows = games.map((k) => DAILY_GAME_MAP[k]).filter(Boolean);
  const many = rows.length > 1;
  const cat = rows[0].cat || 'Trivia';
  const since = PREMIERES.find((p) => p.key === rows[0].key);
  // THE CATEGORY'S RAMP STEP, in whichever register the page is in. The home
  // has no accent of its own (its cap is the default sky), so this is read off
  // the category rather than off --stg-acc. Safe at render time: this only
  // renders after the effect above, so the DOM is there.
  let light = true;
  try { const el = document.querySelector('.stage-page'); light = !el || el.getAttribute('data-stage-theme') !== 'dark'; } catch (e) {}
  const acc = light ? categoryColorLight(cat) : categoryColor(cat);
  const ri = rampIndexFor(cat);
  const onAcc = light ? (ri >= 0 ? RAMP_INK_LIGHT[ri] : RAMP_INK) : RAMP_INK;
  const vars = { '--prm-acc': acc, '--prm-on': onAcc, '--prm-tint': `color-mix(in srgb, ${acc} 16%, transparent)` };

  return (
    <div className="prm-scrim" onClick={() => setGames(null)}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="prm" role="dialog" aria-labelledby="prm-t" style={vars} onClick={(e) => e.stopPropagation()}>
        <button className="prm-x" aria-label="Close" onClick={() => setGames(null)}><X size={16} /></button>
        <div className="prm-eye"><i /><span>New this week · {cat}</span></div>
        <h2 id="prm-t">{many ? `${rows.length === 2 ? 'Two' : rows.length} new dailies` : 'A new daily'}</h2>
        <p className="prm-lede">
          {many ? `Both premiered ${dateLabel(since && since.from)}. You have not played either yet.`
            : `${rows[0].name} premiered ${dateLabel(since && since.from)}. You have not played it yet.`}
        </p>
        <div className="prm-rows">
          {rows.map((g) => (
            <div className="prm-row" key={g.key}>
              <div className="prm-gl"><GameGlyph gameKey={g.key} size={26} /></div>
              <div className="prm-t"><b>{g.name}</b><span>{g.tag}</span></div>
              <a className="prm-play" href={g.href} onClick={() => setGames(null)}>Play</a>
            </div>
          ))}
        </div>
        <div className="prm-foot">{many ? `Both are in the ${cat} shelf every day.` : `It is in the ${cat} shelf every day.`}</div>
      </div>
    </div>
  );
}

function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

function dateLabel(iso) {
  if (!iso) return 'this week';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const CSS = `
.prm-scrim{position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;padding:18px;
  background:rgba(11,15,26,.55);}
.prm{width:min(440px,100%);background:var(--stg-raise,#fff);color:var(--stg-ink,#0b0d12);
  border:1px solid var(--stg-line2,rgba(11,15,26,.24));border-radius:16px;padding:22px 22px 18px;position:relative;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.45);animation:prm-in .28s ease-out;font-family:Manrope,system-ui,sans-serif;}
@keyframes prm-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.prm{animation:none}}
.prm-x{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:0;background:transparent;
  color:var(--stg-mute,#5f6774);cursor:pointer;display:grid;place-items:center;}
.prm-x:hover{background:var(--stg-surf2,#e4e9f1);color:var(--stg-ink,#0b0d12);}
.prm-eye{font:500 11px "DM Mono",ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;
  color:var(--stg-mute,#5f6774);display:flex;align-items:center;gap:8px;}
.prm-eye i{width:8px;height:8px;border-radius:2px;background:var(--prm-acc,#fb923c);display:inline-block;}
.prm h2{font-size:24px;font-weight:800;letter-spacing:-.015em;margin:6px 0 4px;line-height:1.15;}
.prm-lede{color:var(--stg-ink2,#3f4757);margin:0 0 16px;font-size:13.5px;line-height:1.45;}
.prm-rows{display:flex;flex-direction:column;gap:8px;}
.prm-row{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;background:var(--stg-surf,#fff);
  border:1px solid var(--stg-line,rgba(11,15,26,.14));border-radius:12px;padding:10px;position:relative;overflow:hidden;}
.prm-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--prm-acc,#fb923c);}
.prm-gl{width:44px;height:44px;border-radius:10px;background:var(--prm-tint,rgba(251,146,60,.16));display:grid;
  place-items:center;color:var(--stg-ink,#0b0d12);}
.prm-t b{display:block;font-size:15px;font-weight:800;}
.prm-t span{display:block;font-size:12px;color:var(--stg-mute,#5f6774);line-height:1.3;}
.prm-play{font:500 12px "DM Mono",ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;
  background:var(--prm-acc,#fb923c);color:var(--prm-on,${RAMP_INK});border-radius:8px;padding:9px 14px;text-decoration:none;white-space:nowrap;}
.prm-play:hover{filter:brightness(1.05);}
.prm-play:focus-visible,.prm-x:focus-visible{outline:2px solid var(--stg-ink,#0b0d12);outline-offset:2px;}
.prm-foot{margin-top:14px;font:400 11px "DM Mono",ui-monospace,Menlo,monospace;letter-spacing:.06em;
  color:var(--stg-mute,#5f6774);text-transform:uppercase;}
@media (max-width:480px){
  .prm-row{grid-template-columns:40px 1fr;}
  .prm-play{grid-column:1/-1;text-align:center;}
}
`;
