'use client';
// THE PROFILE, ON THE STAGE.
//
// The old page (app/player/ProfileShared.jsx) is four pill tabs — Trophies,
// Categories, IQ & Level, Activity — over white cards separated by a 30%-black
// hairline. It put a player's standing three clicks deep: you land on Trophies,
// and rank, IQ, level and streak are each behind a different pill.
//
// The Stage already solved this shape on the finish card: cap, curtain,
// figures, then bands. This is that shape. Everything that was a tab is a band
// you scroll past.
//
// WHY A FORK RATHER THAN AN EDIT. ProfileShared's five components are imported
// by app/quizzes/hub/StatHubClient.jsx, which is not a Stage page and keeps its
// own superset of the .qzhub rules. Re-inking them in place would land this
// design on the Hub too, half-applied, and would mean keeping two stylesheets
// in step. So ProfileShared is untouched and the Hub is untouched; when the Hub
// moves to the Stage it can import from here and ProfileShared can go.
//
// ONE COLOUR. The page takes the player's CROWN CATEGORY (lib/crown.js) as
// --stg-acc and uses nothing else, per the Stage's rule. The Loft tier palette
// is deliberately dropped: tierBg/tierFg are three more fills competing with
// the accent, and the tier is stated in the cap pill instead.

import React, { useMemo } from 'react';
import Link from 'next/link';
import { categoryColor, categoryColorLight } from '@/lib/category-ramp';
import { categoryTotals } from '@/lib/crown';
import { dailyLabel, DAILY_DATED_RE, DAILY_GAME_MAP } from '@/lib/daily-games';

const MONO = "'DM Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

// -- SMALL PIECES -----------------------------------------------------------

export function Band({ id, children, count, title, hue }) {
  return (
    <section className="pfb" id={id} style={hue ? { '--cc': hue } : undefined}>
      <div className="pfb-h">
        <h2>{title}</h2>
        {count ? <b>{count}</b> : null}
      </div>
      {children}
    </section>
  );
}

// A figure is a value over a mono micro-label. The Stage states a rank as a
// figure rather than as a chip: .rankchip was a blue lozenge repeated forty
// times down the old page, and forty lozenges is not a hierarchy.
export function Figs({ items }) {
  return (
    <div className="pf-figs">
      {items.filter(Boolean).map(([v, l]) => (
        <div key={l}><b>{v}</b><i>{l}</i></div>
      ))}
    </div>
  );
}

// -- THE CURTAIN ------------------------------------------------------------
// Full-bleed accent, onramp ink. NOTHING here is dimmed with opacity: the live
// .stf-detail carries opacity .78, which contradicts CLAUDE.md rule 1 and lands
// the three warm steps near 3:1. Hierarchy is size and weight.
export function Curtain({ level, xp, toNext, accuracy, pct }) {
  return (
    <div className="pf-curtain">
      <div className="pf-cin">
        <div className="pf-cl">
          <div className="pf-verdict">Level {level || 1}</div>
          <div className="pf-detail">
            {(xp || 0).toLocaleString()} IQ Points
            {toNext ? ` · ${toNext.toLocaleString()} to level ${(level || 1) + 1}` : ''}
          </div>
        </div>
        {accuracy != null ? (
          <div className="pf-ciq"><b>{accuracy}%</b><i>career accuracy</i></div>
        ) : null}
      </div>
      <div className="pf-lv"><i style={{ width: `${Math.max(3, Math.min(100, pct || 0))}%` }} /></div>
    </div>
  );
}

// -- STANDING ---------------------------------------------------------------
// The cumulative IQ curve, hand-rolled so it can be drawn from the accent and
// flip register with the page. Renders only with enough points to be a shape;
// below that the figures alone say it.
function curve(series, w, hgt) {
  const n = series.length;
  const max = Math.max(...series, 1);
  const pad = { t: 16, b: 10, l: 4, r: 8 };
  const x = (i) => pad.l + (i / Math.max(1, n - 1)) * (w - pad.l - pad.r);
  const y = (v) => hgt - pad.b - (v / max) * (hgt - pad.t - pad.b);
  let d = `M${x(0).toFixed(1)} ${y(series[0]).toFixed(1)}`;
  for (let i = 1; i < n; i += 1) {
    const cx = (x(i - 1) + x(i)) / 2;
    d += ` C${cx.toFixed(1)} ${y(series[i - 1]).toFixed(1)} ${cx.toFixed(1)} ${y(series[i]).toFixed(1)} ${x(i).toFixed(1)} ${y(series[i]).toFixed(1)}`;
  }
  return { d, end: [x(n - 1), y(series[n - 1])], max };
}

export function Standing({ recent, rank, totalPlayers, ranks, nextAt }) {
  const series = useMemo(() => {
    const asc = (recent || []).slice().reverse();
    let run = 0;
    const all = asc.map((r) => { run += Number(r.xp) || 0; return run; });
    if (all.length <= 70) return all;
    const step = all.length / 70;
    return Array.from({ length: 70 }, (_, i) => all[Math.min(all.length - 1, Math.round(i * step))]);
  }, [recent]);

  const W = 420;
  const H = 150;
  const c = series.length >= 4 ? curve(series, W, H) : null;
  const goalY = c && nextAt ? Math.max(10, H - 10 - (nextAt / c.max) * (H - 26)) : null;

  return (
    <>
      {c ? (
        <svg className="pf-chart" viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
          aria-label={`Cumulative IQ Points, ending at ${Math.round(c.max).toLocaleString()}`}>
          <line x1="0" y1={H * 0.28} x2={W} y2={H * 0.28} stroke="var(--stg-line)" strokeWidth="1" />
          <line x1="0" y1={H * 0.56} x2={W} y2={H * 0.56} stroke="var(--stg-line)" strokeWidth="1" />
          <line x1="0" y1={H * 0.84} x2={W} y2={H * 0.84} stroke="var(--stg-line)" strokeWidth="1" />
          <path d={`${c.d} L${W} ${H} L0 ${H} Z`} fill="var(--stg-acc)" fillOpacity="0.14" />
          <path d={c.d} fill="none" stroke="var(--stg-acc)" strokeWidth="2.25" strokeLinecap="round" />
          {goalY != null ? (
            <line x1="0" y1={goalY} x2={W} y2={goalY} stroke="var(--stg-acc)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.55" />
          ) : null}
          <circle cx={c.end[0]} cy={c.end[1]} r="4" fill="var(--stg-acc)" stroke="var(--stg-ground)" strokeWidth="1.5" />
        </svg>
      ) : (
        <p className="pf-empty">A few more finished games and the IQ Points curve appears here.</p>
      )}
      <Figs items={[
        rank ? [`#${rank}`, totalPlayers ? `of ${totalPlayers.toLocaleString()}` : 'overall'] : null,
        ranks && ranks.correct ? [`#${ranks.correct}`, 'correct'] : null,
        ranks && ranks.daysPlayed ? [`#${ranks.daysPlayed}`, 'days played'] : null,
        ranks && ranks.accuracy ? [`#${ranks.accuracy}`, 'accuracy'] : null,
      ]} />
    </>
  );
}

// -- TROPHIES ---------------------------------------------------------------
// Earned takes the accent rule; locked is a CELL, not a card — a shape you see
// the edges of before anything is in it (CLAUDE.md, "a drop zone is a cell").
export function Trophies({ trophies }) {
  if (!trophies || !trophies.list) return <p className="pf-empty">No trophies on record yet.</p>;
  const list = trophies.list.slice().sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0) || a.pct - b.pct);
  return (
    <div className="pf-tro">
      {list.slice(0, 12).map((t) => (
        <div key={t.id} className={`pf-t${t.earned ? '' : ' off'}`}>
          <span className="pf-tn">{t.name}</span>
          <span className="pf-tp">
            {((t.pct > 0 && t.pct < 1) || (t.earned && !t.pct)) ? '<1' : Math.round(t.pct)}% have this
          </span>
        </div>
      ))}
    </div>
  );
}

// -- CATEGORIES -------------------------------------------------------------
// The ten ramp categories, from the player's daily play, each bar in its own
// step. This is the axis the Stage owns; profile.byCategory is keyed by the
// sixteen QUIZ DEPARTMENTS, which is a different taxonomy and a different
// palette, so it stays on the Stat Hub where its table already lives.
export function Categories({ recent, light }) {
  const rows = useMemo(() => categoryTotals(recent), [recent]);
  if (!rows.length) return <p className="pf-empty">Play a daily puzzle and the category breakdown shows up here.</p>;
  const max = Math.max(...rows.map((r) => r.xp), 1);
  return (
    <div className="pf-bars">
      {rows.map((r) => (
        <div key={r.cat} className="pf-bar" style={{ '--cc': light ? categoryColorLight(r.cat) : categoryColor(r.cat) }}>
          <span className="pf-bn">{r.cat}</span>
          <span className="pf-bt"><i style={{ width: `${Math.max(4, Math.round((r.xp / max) * 100))}%` }} /></span>
          <span className="pf-bv">{r.xp.toLocaleString()} <i>{r.played} played</i></span>
        </div>
      ))}
    </div>
  );
}

// -- ACTIVITY ---------------------------------------------------------------
// Twelve weeks. The Loft ramp (#eef0f2 -> #b5d4f4 -> #85b7eb -> #1e3a8a) was a
// second blue scale on the page; this mixes the accent into the ground instead,
// so it flips register for free and stays in the crown category.
function dayKeys(recent) {
  const counts = new Map();
  (recent || []).forEach((r) => {
    if (!r || !r.createdAt) return;
    const k = String(r.createdAt).slice(0, 10);
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  return counts;
}

export function Activity({ recent }) {
  const counts = useMemo(() => dayKeys(recent), [recent]);
  const { cur, best } = useMemo(() => {
    const keys = Array.from(counts.keys()).sort();
    if (!keys.length) return { cur: 0, best: 0 };
    const has = new Set(keys);
    const day = (d) => d.toISOString().slice(0, 10);
    const t = new Date();
    let cursor = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    if (!has.has(day(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
    let c = 0;
    while (has.has(day(cursor))) { c += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    let b = 0; let run = 0; let prev = null;
    keys.forEach((k) => {
      const d = new Date(k + 'T00:00:00Z');
      run = prev && (d - prev) === 86400000 ? run + 1 : 1;
      if (run > b) b = run;
      prev = d;
    });
    return { cur: c, best: b };
  }, [counts]);

  const cells = useMemo(() => {
    const t = new Date();
    const end = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    return Array.from({ length: 84 }, (_, i) => {
      const d = new Date(end);
      d.setUTCDate(d.getUTCDate() - (83 - i));
      const k = d.toISOString().slice(0, 10);
      const n = counts.get(k) || 0;
      return { k, lvl: n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4 };
    });
  }, [counts]);

  return (
    <>
      <Figs items={[
        [cur.toLocaleString(), 'day streak'],
        [best.toLocaleString(), 'best streak'],
        [counts.size.toLocaleString(), 'days played'],
      ]} />
      <div className="pf-hm" aria-label="Twelve weeks of play, brighter is more played">
        {cells.map((c) => <i key={c.k} className={c.lvl ? `l${c.lvl}` : undefined} />)}
      </div>
      <div className="pf-hcap">Last 12 weeks · brighter is more played</div>
    </>
  );
}

// -- THE GAME LOG -----------------------------------------------------------
// The old log was a six-column grey table. Each row now takes a 3px left rule
// in its own category step, so a year of play reads as a colour spine before
// you read a word. A row with no result gives up its fill rather than its
// contrast: .sty-g.done wears opacity .42 on the home, and opacity on a parent
// cannot be undone by a child, so a row that has something to say says "played"
// in COLOUR instead (CLAUDE.md).
export function GameLog({ recent, titleById, light, limit = 40 }) {
  if (!recent || !recent.length) return <p className="pf-empty">No games on record yet.</p>;
  return (
    <div className="pf-log">
      {recent.slice(0, limit).map((r, i) => {
        const m = DAILY_DATED_RE.exec(r.quizId || '');
        const g = m ? DAILY_GAME_MAP[m[1]] : null;
        const hue = g ? (light ? categoryColorLight(g.cat) : categoryColor(g.cat)) : 'var(--stg-line2)';
        const name = g ? g.name : (titleById && titleById[r.quizId]) || dailyLabel(r.quizId) || r.quizId;
        let when = '';
        try {
          when = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        } catch (e) { when = ''; }
        return (
          <Link key={`${r.quizId}-${i}`} href={`/quiz/${r.quizId}`}
            className={`pf-lr${r.abandoned ? ' done' : ''}`} style={{ '--cc': hue }}>
            <span className="g">{name}</span>
            <span className="w">{when}</span>
            <span className="v">
              {r.perfect ? <u>Perfect</u> : null}
              <span>{r.scorePct != null ? `${r.scorePct}%` : '—'}</span>
              {r.xp > 0 ? <b>+{r.xp} IQ</b> : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// -- THE STYLESHEET ---------------------------------------------------------
// No backticks may appear anywhere in this string, comments included: it is
// injected as <style dangerouslySetInnerHTML={{ __html: CSS }} /> and React escapes what it does not expect.
// Every [data-stage-theme='light'] rule carries html:not([data-stage-boot=dark])
// in front of it, per the standing rule — without it the rule fires for one
// frame on a dark reader and the page comes apart in halves.
export const profileStageCss = [
  '.pf{font-family:Manrope,ui-sans-serif,system-ui,-apple-system,sans-serif;color:var(--stg-ink);background:var(--stg-ground);min-height:100vh;}',

  '.pf-cap{display:flex;align-items:center;gap:16px;padding:12px 20px;}',
  '.pf-brand{display:flex;align-items:center;gap:8px;flex:none;text-decoration:none;color:var(--stg-ink);padding-right:15px;border-right:1px solid var(--stg-line);}',
  '.pf-brand b{font-size:13px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;}',
  '.pf-brand b em{font-style:normal;color:var(--stg-acc-ink,var(--stg-acc));}',
  '.pf-id{display:flex;flex-direction:column;gap:1px;min-width:0;}',
  '.pf-id i{font-family:' + MONO + ';font-style:normal;font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--stg-mute2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
  '.pf-id h1{margin:0;font-size:16px;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:9px;min-width:0;}',
  '.pf-id h1 span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
  '.pf-id h1 u{text-decoration:none;flex:none;font-family:' + MONO + ';font-size:9px;letter-spacing:.11em;text-transform:uppercase;font-weight:500;color:var(--stg-onramp,#08222e);background:var(--stg-acc);border-radius:99px;padding:3px 8px;}',
  '.pf-cx{display:inline-flex;align-items:center;gap:6px;font-family:' + MONO + ';font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:var(--stg-ink2);border:1px solid var(--stg-line);border-radius:99px;padding:5px 11px;background:none;cursor:pointer;text-decoration:none;white-space:nowrap;}',
  '.pf-cx:hover{border-color:var(--stg-line2);color:var(--stg-ink);}',
  '.pf-cx:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}',
  '.pf-rank{margin-left:auto;color:var(--stg-onramp,#08222e);background:var(--stg-acc);border-color:var(--stg-acc);}',
  '.pf-rank:hover{color:var(--stg-onramp,#08222e);}',

  '.pf-curtain{background:var(--stg-acc);color:var(--stg-onramp,#08222e);padding:26px 22px 24px;}',
  '.pf-cin{max-width:940px;margin:0 auto;display:flex;align-items:flex-end;gap:22px;flex-wrap:wrap;}',
  '.pf-cl{flex:1 1 280px;min-width:0;}',
  '.pf-verdict{font-size:36px;font-weight:800;letter-spacing:-.03em;line-height:1.05;}',
  '.pf-detail{margin-top:7px;font-size:14px;font-weight:700;}',
  '.pf-ciq{flex:none;text-align:right;}',
  '.pf-ciq b{display:block;font-size:34px;font-weight:800;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}',
  '.pf-ciq i{display:block;font-style:normal;font-size:13px;font-weight:700;margin-top:8px;}',
  '.pf-lv{max-width:940px;margin:16px auto 0;height:8px;border-radius:4px;background:var(--stg-ground);overflow:hidden;}',
  '.pf-lv i{display:block;height:100%;background:var(--stg-onramp,#08222e);border-radius:4px;}',

  '.pf-fg{display:flex;gap:26px;padding:9px 20px;border-top:1px solid var(--stg-line);border-bottom:1px solid var(--stg-line);flex-wrap:wrap;}',
  '.pf-fg>div{display:flex;flex-direction:column;}',
  '.pf-fg b{font-family:' + MONO + ';font-size:14px;font-weight:500;line-height:1.15;font-variant-numeric:tabular-nums;}',
  '.pf-fg i{font-family:' + MONO + ';font-style:normal;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute2);}',

  '.pf-wrap{max-width:940px;margin:0 auto;padding:24px 22px 40px;display:flex;flex-direction:column;gap:26px;}',
  '.pf-pair{display:grid;gap:22px;align-items:start;}',
  '@media(min-width:820px){.pf-pair{grid-template-columns:minmax(0,1fr) minmax(0,1fr);}}',

  '.pfb{position:relative;padding-left:16px;min-width:0;}',
  '.pfb::before{content:"";position:absolute;left:0;top:2px;bottom:2px;width:4px;border-radius:2px;background:var(--cc,var(--stg-acc));}',
  '.pfb-h{display:flex;align-items:baseline;gap:11px;margin-bottom:11px;}',
  '.pfb-h h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;}',
  '.pfb-h b{font-family:' + MONO + ';font-size:12px;font-weight:500;font-variant-numeric:tabular-nums;color:var(--stg-ink2);}',

  '.pf-figs{display:flex;gap:22px;flex-wrap:wrap;margin-top:12px;}',
  '.pf-figs>div{display:flex;flex-direction:column;}',
  '.pf-figs b{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.05;font-variant-numeric:tabular-nums;}',
  '.pf-figs i{font-family:' + MONO + ';font-style:normal;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute2);margin-top:3px;}',

  '.pf-chart{display:block;overflow:visible;}',
  '.pf-empty{margin:0;font-size:13px;color:var(--stg-mute);}',

  '.pf-tro{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}',
  '.pf-t{display:flex;flex-direction:column;gap:2px;background:var(--stg-surf);border:1px solid var(--stg-line);border-left:3px solid var(--stg-acc);border-radius:8px;padding:9px 11px;min-width:0;}',
  '.pf-t.off{background:none;border:1px dashed var(--stg-cell-line);}',
  '.pf-t.off .pf-tn{color:var(--stg-mute);}',
  '.pf-tn{font-size:12.5px;font-weight:800;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
  '.pf-tp{font-family:' + MONO + ';font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--stg-mute);}',

  '.pf-bars{display:flex;flex-direction:column;gap:9px;}',
  '.pf-bar{display:grid;grid-template-columns:104px minmax(0,1fr) auto;align-items:center;gap:11px;}',
  '.pf-bn{font-family:' + MONO + ';font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:var(--stg-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
  '.pf-bt{display:block;height:14px;border-radius:5px;background:var(--stg-surf2);overflow:hidden;}',
  '.pf-bt i{display:block;height:100%;background:var(--cc);border-radius:5px;}',
  '.pf-bv{font-family:' + MONO + ';font-size:12px;font-weight:500;color:var(--stg-ink2);white-space:nowrap;font-variant-numeric:tabular-nums;text-align:right;}',
  '.pf-bv i{font-style:normal;color:var(--stg-mute);}',

  '.pf-hm{display:grid;grid-template-rows:repeat(7,10px);grid-auto-flow:column;grid-auto-columns:10px;gap:3px;justify-content:start;margin-top:14px;overflow-x:auto;}',
  '.pf-hm i{display:block;border-radius:2px;background:var(--stg-line);}',
  '.pf-hm i.l1{background:color-mix(in srgb,var(--stg-acc) 28%,var(--stg-ground));}',
  '.pf-hm i.l2{background:color-mix(in srgb,var(--stg-acc) 52%,var(--stg-ground));}',
  '.pf-hm i.l3{background:color-mix(in srgb,var(--stg-acc) 76%,var(--stg-ground));}',
  '.pf-hm i.l4{background:var(--stg-acc);}',
  '.pf-hcap{font-family:' + MONO + ';font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--stg-mute2);margin-top:8px;}',

  '.pf-log{display:flex;flex-direction:column;gap:5px;}',
  '.pf-lr{display:flex;align-items:center;gap:10px;background:var(--stg-surf);border:1px solid var(--stg-line);border-left:3px solid var(--cc);border-radius:8px;padding:8px 11px;font-size:13px;color:var(--stg-ink);text-decoration:none;min-width:0;}',
  '.pf-lr:hover{border-color:var(--stg-line2);border-left-color:var(--cc);}',
  '.pf-lr .g{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
  '.pf-lr .w{font-family:' + MONO + ';font-size:10.5px;color:var(--stg-mute);flex:none;}',
  '.pf-lr .v{margin-left:auto;flex:none;display:flex;align-items:baseline;gap:9px;font-family:' + MONO + ';font-size:11.5px;color:var(--stg-ink2);font-variant-numeric:tabular-nums;}',
  '.pf-lr .v b{color:var(--stg-acc-ink,var(--stg-acc));font-weight:500;}',
  '.pf-lr .v u{text-decoration:none;color:var(--stg-good);}',
  '.pf-lr.done{background:none;}',
  '.pf-lr.done .g{color:var(--stg-mute);}',

  '.pf-act{display:flex;gap:8px;flex-wrap:wrap;}',
  '.pf-btn{display:inline-flex;align-items:center;gap:7px;background:var(--stg-acc);color:var(--stg-onramp,#08222e);border:0;border-radius:9px;padding:9px 15px;font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer;text-decoration:none;}',
  '.pf-btn.ghost{background:none;color:var(--stg-ink2);border:1px solid var(--stg-line);font-weight:700;}',
  '.pf-btn:focus-visible{outline:2px solid var(--stg-acc);outline-offset:2px;}',

  '@media(max-width:640px){',
  '.pf-cap{gap:10px;padding:10px 13px;}',
  '.pf-verdict{font-size:27px;}',
  '.pf-ciq b{font-size:26px;}',
  '.pf-fg{gap:0;justify-content:space-between;padding:8px 13px;}',
  '.pf-wrap{padding:18px 14px 32px;gap:22px;}',
  '.pf-bar{grid-template-columns:80px minmax(0,1fr) auto;gap:8px;}',
  '}',
].join('');
