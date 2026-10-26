'use client';

// THE SHOPPING WEEK (owner, 2026-10-25): Price Check's weekly shopper rank.
// The data is /api/quiz/price-week (best five runs, Monday to Sunday ET, the
// sum ranks and the sum / 5 is the weekly average). The card is graded on the
// same live ladder as a single run (ranksFor), so a week reads in the cards
// players already know.
//
//   WeekStrip  the ending's "This Week" card: seven day chips coloured by the
//              card each run earned, the weekly card and rank, a link on.
//   WeekPage   /pricecheck/week: the day bars, the weekly card ladder, and the
//              week's board.

import React, { useEffect, useMemo, useState } from 'react';
import { dailyMeIdentity } from '../dailyMeClient';
import { ranksFor, runTierOf } from '@/lib/price-games';
import { rampFor } from '@/lib/circuits';
import { softGround } from '@/lib/category-ramp';
import { stagePalette, useStageChrome, PLAIN, DARK } from '../GauntletScreens';
import StageTopBar from '../StageTopBar';
import { nextLook, isDarkLook, useStageLook } from '@/lib/stage-look';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY1 = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHIP = ['#111111', '#d4a017', '#2563eb', '#0f766e', '#94a3b8']; // card swatch, best first

export function useShopWeek(on = true, refresh = 0) {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!on) return undefined;
    let dead = false;
    const { anonId, email } = dailyMeIdentity();
    const qs = new URLSearchParams();
    if (anonId) qs.set('anonId', anonId);
    if (email) qs.set('email', email);
    fetch(`/api/quiz/price-week?${qs}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (!dead && j && !j.error) setD(j); }).catch(() => {});
    return () => { dead = true; };
  }, [on, refresh]);
  return d;
}

// The live ladder, graded on a 50-point run (every Price Check run is 50).
function useLadder(today) {
  return useMemo(() => {
    const [y, m, d] = (today || '2026-10-25').split('-').map(Number);
    return ranksFor(`pricer-${m}-${d}-${String(y).slice(2)}`);
  }, [today]);
}
// Tier index (0 best) to its colour on the run's ladder (bottom rung = step 0).
const tierBg = (ti, n) => softGround(rampFor(n - 1 - ti));
const dayLabel = (ymd) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function WeekStrip({ data, today = null }) {
  const RANKS = useLadder(data ? data.today : today);
  if (!data) return null;
  const me = data.me;
  const n = RANKS.length;
  const days = data.week.map((ymd, i) => {
    const v = me && me.days ? me.days[ymd] : undefined;
    const future = ymd > data.today;
    const ti = typeof v === 'number' ? runTierOf(v, RANKS) : null;
    return { ymd, d: DAY1[i], v, future, ti, isToday: ymd === data.today };
  });
  const wti = me ? runTierOf(me.avg, RANKS) : null;
  const up = wti != null && wti > 0 ? RANKS[wti - 1] : null;
  return (
    <section className="gsx-rise gsx-card pcwk" style={{ animationDelay: '2.3s' }} aria-label="This week">
      <style dangerouslySetInnerHTML={{ __html: STRIP_CSS }} />
      <div className="gsx-ch"><b>This Week</b><a href="/pricecheck/week">Your week</a></div>
      <div className="pcwk-days">
        {days.map((x) => (
          <span key={x.ymd} className={`pcwk-d${x.isToday ? ' on' : ''}${x.future ? ' fut' : ''}${x.v == null && !x.future ? ' miss' : ''}`}>
            <b style={x.ti != null ? { background: tierBg(x.ti, n) } : undefined}>{x.v != null ? x.v : x.future ? '' : '–'}</b>
            <i>{x.d}</i>
          </span>
        ))}
      </div>
      {me ? (
        <p className="pcwk-line">Your week so far: <b>{RANKS[wti][1]}</b>, {me.avg} average, #{me.rank} of {Number(data.field).toLocaleString()}.{up ? <> {RANKS[wti - 1][3]} needs {up[0]}.</> : null}</p>
      ) : <p className="pcwk-line">Your best five runs this week make your weekly card.</p>}
    </section>
  );
}

const STRIP_CSS = `
.pcwk{display:flex;flex-direction:column;gap:10px}
.pcwk .gsx-ch a{font-size:13px;font-weight:800;color:inherit}
.pcwk-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}
.pcwk-d{display:flex;flex-direction:column;align-items:center;gap:3px}
.pcwk-d b{width:100%;height:34px;border-radius:8px;border:2px solid currentColor;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#08222e;background:transparent}
.pcwk-d.miss b,.pcwk-d.fut b{border-style:solid;color:inherit;opacity:.6}
.pcwk-d.on b{outline:3px solid currentColor;outline-offset:2px}
.pcwk-d i{font-style:normal;font-size:11px;font-weight:800}
.pcwk-line{margin:0;font-size:14px;font-weight:700;line-height:1.4}
`;

// ── /pricecheck/week ─────────────────────────────────────────────────────
export function WeekPage() {
  const data = useShopWeek(true);
  const [look, setLook] = useStageLook();
  const pastel = rampFor(2);
  const pal = stagePalette(pastel, look);
  useStageChrome(pal.bg);
  const dark = isDarkLook(look);
  const RANKS = useLadder(data && data.today);
  const n = RANKS.length;
  const me = data && data.me;
  const wti = me ? runTierOf(me.avg, RANKS) : null;
  const ink = pal.ink;
  const card = look === 'plain' ? PLAIN.bg : dark ? DARK.fill : 'rgba(255,255,255,.45)';
  return (
    <main className="pwk" style={{ background: pal.bg, color: ink, '--pwk-card': card, '--pwk-bg': pal.bg }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="pwk-col">
        <StageTopBar look={look} onFlip={() => setLook(nextLook(look))} ink={ink} href="/pricecheck" title="Your Week" sub="Price Check" />
        <div className="pwk-head">
          <div className="pwk-eye">Price Check · Week of {data ? dayLabel(data.week[0]) : ''}</div>
          <h2>{me ? <>This Week You Shop Like {RANKS[wti][1]}</> : 'Your Shopping Week'}</h2>
          <p>{me ? <>{me.avg} average over your best five runs · #{me.rank} of {Number(data.field).toLocaleString()} this week</> : data ? 'Play Price Check to start your week. Your best five runs, Monday to Sunday, make your weekly card.' : 'Loading your week'}</p>
        </div>

        <section className="pwk-card" aria-label="Day by day">
          <div className="pwk-ch"><b>Day By Day</b><span>out of 50</span></div>
          {(data ? data.week : []).map((ymd, i) => {
            const v = me && me.days ? me.days[ymd] : undefined;
            const fut = ymd > data.today;
            const ti = typeof v === 'number' ? runTierOf(v, RANKS) : null;
            return (
              <div key={ymd} className="pwk-day">
                <b className="pwk-dn">{DAYS[i]}</b>
                <span className="pwk-bar">
                  {v != null ? <i style={{ width: `${Math.round((v / 50) * 100)}%`, background: tierBg(ti, n), animationDelay: `${0.15 + i * 0.06}s` }} /> : null}
                  <em>{v != null ? `${RANKS[ti][3]} card` : fut ? (ymd === data.today ? 'Today' : 'Still to come') : 'No run'}</em>
                </span>
                <b className="pwk-dv">{v != null ? v : '–'}</b>
              </div>
            );
          })}
          <p className="pwk-note">Your week counts your best five runs, so one missed day costs nothing. Weeks reset Monday at midnight ET.</p>
        </section>

        <section aria-label="Your weekly card" className="pwk-ladder">
          <b className="pwk-lh">Your Weekly Card</b>
          {RANKS.map((r, ti) => {
            const here = wti === ti;
            const lit = me && me.avg >= r[0];
            const tail = here ? 'You' : me && wti != null && ti === wti - 1 ? `${Math.round((r[0] - me.avg) * 10) / 10} to go` : r[0] > 0 ? `${r[0]}+` : '';
            return (
              <div key={r[1]} className={`pwk-rung${here ? ' here' : ''}`} style={here ? { background: dark ? '#e9edf4' : '#08222e', color: dark ? '#08222e' : pal.bg } : lit ? { background: tierBg(ti, n), color: '#08222e' } : undefined}>
                <span className="pwk-chip" style={{ background: CHIP[ti] }} />
                <b>{r[1]} · {r[3]} card</b>
                <span>{tail}</span>
              </div>
            );
          })}
        </section>

        <section className="pwk-card" aria-label="This week's board">
          <div className="pwk-ch"><b>This Week&rsquo;s Board</b><a href="/pricecheck/leaderboard">Today&rsquo;s board</a></div>
          <div className="pwk-row pwk-rh"><span /><span>Player</span><span>Card</span><span>Avg</span></div>
          {(data ? data.top : []).map((x, i) => (
            <div key={i} className="pwk-row"><b>{x.rank}</b><span>{x.name}</span><span>{RANKS[runTierOf(x.avg, RANKS)][3]}</span><b>{x.avg}</b></div>
          ))}
          {me && !(data.top || []).some((x) => x.rank === me.rank && x.name === (me.name || 'Guest')) ? (
            <div className="pwk-row pwk-me"><b>{me.rank}</b><b>You</b><span>{RANKS[wti][3]}</span><b>{me.avg}</b></div>
          ) : null}
          {data && data.fieldAvg != null ? <div className="pwk-row"><span /><span>Field average</span><span /><b>{data.fieldAvg}</b></div> : null}
          {data && !data.top.length ? <p className="pwk-note">No full runs yet this week.</p> : null}
        </section>
        <a className="pwk-go" href="/pricecheck"><span>Play Today&rsquo;s Price Check</span></a>
      </div>
    </main>
  );
}

const PAGE_CSS = `
.pwk{min-height:100vh;font-family:'Manrope',system-ui,sans-serif;padding:14px 16px 32px;box-sizing:border-box}
.pwk-col{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.pwk-eye{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.pwk-head h2{margin:4px 0;font-size:32px;line-height:1.05;font-weight:800;letter-spacing:-.02em}
.pwk-head p{margin:0;font-size:15px;font-weight:700}
.pwk-card{border:2px solid currentColor;border-radius:16px;padding:12px 14px;background:var(--pwk-card);display:flex;flex-direction:column;gap:8px}
.pwk-ch{display:flex;justify-content:space-between;align-items:baseline}
.pwk-ch b,.pwk-lh{font-size:16px;font-weight:800}
.pwk-ch span{font-size:12px;font-weight:800;opacity:.75}
.pwk-ch a,.pwk-card a{color:inherit;font-size:13px;font-weight:800}
.pwk-day{display:flex;align-items:center;gap:8px}
.pwk-dn{width:34px;font-size:13px}
.pwk-dv{width:26px;text-align:right;font-size:15px}
.pwk-bar{flex:1;position:relative;height:32px;border:2px solid currentColor;border-radius:8px;overflow:hidden;box-sizing:border-box}
.pwk-bar i{position:absolute;left:0;top:0;bottom:0;transform-origin:left;animation:pwkF .8s cubic-bezier(.2,.8,.2,1) both}
.pwk-bar em{position:absolute;left:8px;top:0;bottom:0;display:flex;align-items:center;font-style:normal;font-size:13px;font-weight:800}
.pwk-note{margin:2px 0 0;font-size:13px;font-weight:700;opacity:.85}
.pwk-ladder{display:flex;flex-direction:column;gap:6px}
.pwk-rung{display:flex;align-items:center;gap:12px;min-height:44px;padding:6px 14px;border:2px solid currentColor;border-radius:12px;box-sizing:border-box;opacity:.55}
.pwk-rung[style]{opacity:1}
.pwk-rung b{flex:1;font-size:15px}
.pwk-rung span:last-child{font-size:13px;font-weight:800;white-space:nowrap}
.pwk-rung.here{padding:12px 14px}
.pwk-rung.here b{font-size:18px}
.pwk-chip{flex:0 0 auto;width:34px;height:22px;border-radius:4px;border:2px solid currentColor;box-sizing:border-box}
.pwk-row{display:grid;grid-template-columns:28px minmax(0,1fr) 64px 44px;align-items:center;gap:6px;min-height:36px;font-size:14px;font-weight:700;border-top:1px solid color-mix(in srgb,currentColor 30%,transparent)}
.pwk-row span:nth-child(2){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pwk-row > :last-child{text-align:right}
.pwk-rh{border-top:0;font-size:11px;opacity:.75}
.pwk-me{border-top:0;border-radius:10px;padding:0 4px;background:currentColor}
.pwk-me > *{color:var(--pwk-bg)}
.pwk-go{display:flex;align-items:center;justify-content:center;min-height:54px;border-radius:16px;background:currentColor;text-decoration:none;font-size:17px;font-weight:800}
.pwk-go span{color:var(--pwk-bg)}
@keyframes pwkF{from{transform:scaleX(0)}}
@media (prefers-reduced-motion:reduce){.pwk-bar i{animation:none}}
`;
