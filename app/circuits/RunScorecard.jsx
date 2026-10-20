'use client';

// THE RUN SCORECARD (owner, 2026-10-20, mockup "A · Matrix"). Every run ends on
// ONE element that carries both the scoring and the ranking across its stages:
// the result and title at the top, then a table whose columns are the run's
// stages and whose rows are today's top three, the field's average and you.
// Each cell is a figure and a bar on that stage's own scale; your row adds the
// stage rank, the field average as a tick, and a red cap where a miss ended it.
// Under it sit the challenge and the "next" slot (Polymath, or more runs and
// puzzles). On a phone each row folds into two lines: who and total, then a
// mini bar per stage.
//
// Pure presentation. Every caller hands it figures it already has; it invents
// nothing, and a figure that is missing simply draws no bar. Colours come in as
// CSS variables so a run in its own dress (the Dojo, Judged, Read the Room)
// keeps its ink, and the defaults are the dark run stage's.

import { useEffect, useState } from 'react';

const CSS = `
.rsc{--rs-ink:#e9edf4;--rs-mute:#9aa8c4;--rs-line:rgba(255,255,255,.12);--rs-surf:rgba(255,255,255,.04);
  --rs-me:#7dd3fc;--rs-lcd:#bef264;--rs-lcdbg:#131c12;--rs-bad:#fb7185;--rs-gold:#e8b43a;
  color:var(--rs-ink);font-family:Manrope,system-ui,-apple-system,'Segoe UI',sans-serif;font-variant-numeric:tabular-nums;
  margin:0 0 22px;text-align:left}
.rsc *{box-sizing:border-box}
.rsc-card{border:1px solid var(--rs-line);border-radius:16px;background:var(--rs-surf);padding:20px 20px 14px}
.rsc-hero{display:flex;align-items:center;gap:18px;margin-bottom:6px}
.rsc-lcd{flex:none;min-width:96px;height:80px;padding:0 14px;border-radius:12px;background:var(--rs-lcdbg);display:flex;align-items:center;justify-content:center;
  box-shadow:inset 0 0 0 3px rgba(0,0,0,.5);color:var(--rs-lcd);font-weight:800;font-size:44px;line-height:1;text-shadow:0 0 18px rgba(190,242,100,.45)}
.rsc-lcd small{font-size:15px;opacity:.7;margin-left:3px;align-self:flex-end;margin-bottom:16px}
.rsc-who{min-width:0;flex:1}
.rsc-eb{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--rs-me)}
.rsc-ttl{font-size:30px;font-weight:800;line-height:1.08;letter-spacing:-.01em;margin-top:2px}
.rsc-sub{font-size:14px;font-weight:700;color:var(--rs-mute);margin-top:5px}
.rsc-sub b{color:var(--rs-ink);font-weight:800}
.rsc-line{font-size:14px;font-weight:700;color:#c9d3e6;margin:10px 0 0}
.rsc-line b{color:var(--rs-gold)}
.rsc-card{container-type:inline-size}
.rsc-num{flex:none;display:flex;flex-direction:column;align-items:flex-start;line-height:1;min-width:64px}
.rsc-num b{font-size:60px;font-weight:800;letter-spacing:-.02em;color:var(--rs-tone,var(--rs-me))}
.rsc-num small{font-size:12px;font-weight:700;color:var(--rs-mute);margin-top:5px;white-space:nowrap}
.rsc-who .rsc-line{margin-top:6px;font-size:13px}
.rsc-lad{flex:0 1 380px;min-width:250px;padding-left:20px;border-left:1px solid var(--rs-line);align-self:stretch;display:flex;flex-direction:column;justify-content:center}
.rsc-lk{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--rs-mute);margin-bottom:10px}
.rsc-wk{display:flex;gap:5px}
.rsc-wk>div{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}
.rsc-wk i{position:relative;font-style:normal;width:100%;max-width:44px;aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;letter-spacing:.04em;
  color:#5d6a83;border:1.5px dashed #33405c}
.rsc-wk i.on{background:var(--rs-ink);color:#0b0f1a;border:0}
.rsc-wk i.top{color:#e9cf7f;border-color:#6b5a2a}
.rsc-wk i.cur::after{content:'';position:absolute;inset:-6px;border:2.5px solid #ef4444;border-radius:50%;transform:rotate(-8deg)}
.rsc-wk span,.rsc-bt span{font-size:10px;font-weight:700;color:#5d6a83}
.rsc-bt{display:flex;gap:4px;align-items:flex-end;height:56px}
.rsc-bt>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px;min-width:0;height:100%}
.rsc-bt i{display:block;width:100%;height:16px;border-radius:5px;opacity:.28}
.rsc-bt i.on{opacity:1}
.rsc-bt i.cur{height:32px;box-shadow:0 0 0 2px var(--rs-ink)}
.rsc-bt span{font-size:9px;font-weight:800;letter-spacing:.05em;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;min-height:11px}
.rsc-bt span.cur{color:var(--rs-ink)}
.rsc-pr{margin-top:10px;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}
.rsc-pr>div{height:100%;border-radius:3px;background:var(--rs-tone,var(--rs-me));transform-origin:left center}
.rsc.anim .rsc-pr>div{animation:rscGrow .9s .2s cubic-bezier(.2,.8,.2,1) both}
.rsc-pe{display:flex;justify-content:space-between;font-size:11px;color:var(--rs-mute);margin-top:4px}
.rsc-nx{font-size:13px;font-weight:700;color:var(--rs-gold);margin-top:8px}
.rsc-tb{position:relative;display:flex;height:12px;margin-top:8px}
.rsc-tb>i{display:block;height:100%;border-right:2px solid #121826;opacity:.22}
.rsc-tb>i.on{opacity:1}
.rsc-tb>i:first-child{border-radius:6px 0 0 6px}.rsc-tb>i:last-of-type{border-radius:0 6px 6px 0;border-right:0}
.rsc-tb>b{position:absolute;top:-7px;width:3px;height:26px;margin-left:-1px;background:#ef4444;border-radius:2px}
.rsc-tt{position:relative;height:14px;margin-top:6px}
.rsc-tt span{position:absolute;top:0;font-size:10px;font-weight:800;color:#5d6a83;transform:translateX(-50%)}
.rsc-tt span.on{color:var(--rs-ink)}
@keyframes rscGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@container (max-width:640px){
  .rsc-hero{flex-wrap:wrap}
  .rsc-lad{flex:1 1 100%;min-width:0;border-left:0;padding-left:0;border-top:1px solid var(--rs-line);padding-top:14px}
  .rsc-num b{font-size:48px}
}
.rsc-hd{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:18px 0 6px;flex-wrap:wrap}
.rsc-hd span{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--rs-mute)}
.rsc-hd a{font-size:13px;font-weight:800;color:var(--rs-me);text-decoration:none}
.rsc-hd a:hover{text-decoration:underline;text-underline-offset:3px}
.rsc-t{display:grid;grid-template-columns:34px minmax(132px,1fr) repeat(var(--n),minmax(44px,calc(var(--cw) + 12px))) 52px;column-gap:0;align-items:stretch}
.rsc-th,.rsc-r>div{padding-right:12px}
.rsc-th.r{padding-right:0}
.rsc-th{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--rs-mute);padding:6px 0 8px;
  border-bottom:1px solid var(--rs-line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rsc-th.st{color:var(--sc)}
.rsc-th.r,.rsc-c.r{text-align:right}
.rsc-r{display:contents}
.rsc-r>div{padding-top:10px;padding-bottom:10px;border-bottom:1px solid var(--rs-line);min-width:0;display:flex;flex-direction:column;justify-content:center}
.rsc-r>.rsc-mb{display:none}
.rsc-r>.rsc-tot{padding-right:0;align-items:flex-end}
.rsc-rk{font-size:17px;font-weight:800}
.rsc-nm{font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rsc-ti{font-size:12px;font-weight:700;color:var(--rs-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.rsc-v{font-size:14px;font-weight:800;display:flex;align-items:baseline;gap:6px}
.rsc-v i{font-style:normal;font-size:11px;font-weight:800;color:var(--rs-mute)}
.rsc-bar{position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,.08);margin-top:5px;overflow:visible}
.rsc-f{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:var(--sc);transform-origin:left center}
.rsc-x{position:absolute;top:0;bottom:0;width:5%;min-width:4px;border-radius:0 3px 3px 0;background:var(--rs-bad)}
.rsc-tk{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;background:rgba(233,237,244,.7);border-radius:1px}
.rsc-tot{font-size:20px;font-weight:800;text-align:right}
.rsc-r.avg .rsc-nm{font-style:italic;color:var(--rs-mute);font-weight:700}
.rsc-r.avg .rsc-v,.rsc-r.avg .rsc-tot{color:var(--rs-mute)}
.rsc-r.avg .rsc-f{background:rgba(233,237,244,.32)}
.rsc-r.me>div{background:rgba(125,211,252,.08)}
.rsc-r.me>div:first-child{border-radius:10px 0 0 10px;padding-left:10px;box-shadow:inset 3px 0 0 var(--rs-me)}
.rsc-r.me>.rsc-tot{border-radius:0 10px 10px 0;padding-right:10px}
.rsc-r.me .rsc-bar{height:8px}
.rsc-r.me .rsc-rk{color:var(--rs-me)}
.rsc-empty{font-size:13px;font-weight:700;color:var(--rs-mute);padding:12px 0}
.rsc-key{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:11.5px;font-weight:700;color:var(--rs-mute);margin-top:10px;align-items:center}
.rsc-key span{display:inline-flex;align-items:center;gap:6px}
.rsc-key .k1{width:2px;height:12px;background:rgba(233,237,244,.7);border-radius:1px}
.rsc-key .k2{width:10px;height:6px;background:var(--rs-bad);border-radius:2px}
.rsc-mb{display:none}
.rsc-low{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;margin-top:16px;align-items:start}
.rsc-low>div{min-width:0}
.rsc-low>div>*:first-child{margin-top:0}
.rsc.anim .rsc-f{animation:rscGrow .8s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0s)}
.rsc.anim .rsc-r{animation:none}
.rsc.anim .rsc-tk{animation:rscFade .4s ease both;animation-delay:calc(var(--d,0s) + .6s)}
@keyframes rscGrow{from{transform:scaleX(0)}to{transform:none}}
@keyframes rscFade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.rsc.anim .rsc-f,.rsc.anim .rsc-tk,.rsc.anim .rsc-pr>div{animation:none}}
@media (max-width:680px){
  .rsc-card{padding:16px 14px 12px}
  .rsc-hero{gap:14px}
  .rsc-lcd{min-width:74px;height:64px;font-size:34px}
  .rsc-lcd small{margin-bottom:12px;font-size:12px}
  .rsc-ttl{font-size:24px}
  .rsc-t{grid-template-columns:38px minmax(0,1fr) 52px}
  .rsc-th.st,.rsc-r .rsc-c.st{display:none}
  .rsc-r>div{padding-top:9px;padding-bottom:4px;border-bottom:none}
  .rsc-r>.rsc-mb{display:grid;grid-column:1 / -1;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:6px;padding:0 0 10px;border-bottom:1px solid var(--rs-line)}
  .rsc-r.me>.rsc-mb{background:rgba(125,211,252,.08);border-radius:0 0 10px 10px;padding:0 8px 10px;box-shadow:inset 3px 0 0 var(--rs-me)}
  .rsc-r.me>div:first-child{border-radius:10px 0 0 0}
  .rsc-r.me>.rsc-tot{border-radius:0 10px 0 0}
  .rsc-mb .rsc-bar{margin-top:0}
  .rsc-mb small{display:block;font-size:10px;font-weight:800;color:var(--rs-mute);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rsc-mb small b{color:var(--rs-ink)}
  .rsc-mh{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:6px;margin:4px 0 2px}
  .rsc-mh span{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--sc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rsc-low{grid-template-columns:minmax(0,1fr);gap:14px}
}
@media (min-width:681px){.rsc-mh{display:none}}
`;

// The share of a full bar a figure fills. A clock reads the other way round:
// the stage's best time is full, and slower times fill less of it.
function fillOf(v, scale, lower) {
  const x = Number(v);
  const m = Number(scale);
  if (!Number.isFinite(x) || !Number.isFinite(m) || m <= 0) return 0;
  if (lower) return x > 0 ? Math.max(0.04, Math.min(1, m / x)) : 0;
  return Math.max(0, Math.min(1, x / m));
}

// The run's own ladder, drawn beside the heading (owner, 2026-10-20): the week
// for Crossed Up, the belts for the Dojo, the schools for Judged, the title bar
// for the gauntlets. steps run lowest first: [{ min, name, short, colour }].
function Ladder({ ladder }) {
  const { kind = 'bar', label, steps = [], value = 0, next = null } = ladder || {};
  if (!steps.length) return null;
  let cur = 0;
  steps.forEach((t, i) => { if (value >= t.min) cur = i; });
  const up = steps[cur + 1] || null;
  const prog = up ? (
    <>
      <div className="rsc-pr"><div style={{ width: `${Math.round(Math.max(0, Math.min(1, (value - steps[cur].min) / Math.max(1, up.min - steps[cur].min))) * 100)}%` }} /></div>
      <div className="rsc-pe"><span>{steps[cur].min}</span><span>{up.min}</span></div>
    </>
  ) : null;
  let body = null;
  if (kind === 'week') {
    body = (
      <div className="rsc-wk">
        {steps.map((t, i) => (
          <div key={t.name} title={`${t.name} at ${t.min}`}>
            <i className={`${i <= cur ? 'on' : ''}${i === cur ? ' cur' : ''}${i === steps.length - 1 && i > cur ? ' top' : ''}`}>{t.short}</i>
            <span>{t.min}</span>
          </div>
        ))}
      </div>
    );
  } else if (kind === 'belts') {
    body = (
      <div className="rsc-bt">
        {steps.map((t, i) => (
          <div key={t.name} title={`${t.name} at ${t.min}`}>
            <i className={`${i <= cur ? 'on' : ''}${i === cur ? ' cur' : ''}`} style={{ background: t.colour, border: /^#1[0-9a-f]{5}$/i.test(t.colour || '') ? '1px solid #444b5c' : undefined }} />
            <span className={i === cur ? 'cur' : ''}>{i === cur || i === cur + 1 ? t.short : ''}</span>
          </div>
        ))}
      </div>
    );
  } else {
    const top = Math.max(1, Math.round(steps[steps.length - 1].min * 1.18));
    const v = Math.max(0, Math.min(top, value));
    body = (
      <>
        <div className="rsc-tb">
          {steps.map((t, i) => {
            const end = i + 1 < steps.length ? steps[i + 1].min : top;
            return <i key={t.name} className={i <= cur ? 'on' : ''} title={`${t.name} at ${t.min}`} style={{ width: `${((end - t.min) / top) * 100}%`, background: t.colour }} />;
          })}
          <b style={{ left: `${(v / top) * 100}%` }} />
        </div>
        <div className="rsc-tt">
          {steps.slice(1).map((t) => <span key={t.name} className={value >= t.min ? 'on' : ''} style={{ left: `${(t.min / top) * 100}%` }}>{t.min}</span>)}
        </div>
        <div className="rsc-pe"><span>{steps[cur].name}</span><span>{steps[steps.length - 1].name} at {steps[steps.length - 1].min}</span></div>
      </>
    );
  }
  return (
    <div className="rsc-lad">
      {label ? <div className="rsc-lk">{label}</div> : null}
      {body}
      {kind !== 'bar' ? prog : null}
      {next ? <div className="rsc-nx">{next}</div> : null}
    </div>
  );
}

export default function RunScorecard({
  stages = [],
  rows = [],
  you = null,
  avg = null,
  ranks = null,
  scale = {},
  lower = false,
  fmt = (v) => String(Math.round(Number(v) || 0)),
  totalFmt = (v) => String(Math.round(Number(v) || 0)),
  avgTotal = null,
  hero = null,
  head = 'Today’s board',
  field = null,
  boardHref = '',
  boardState = 'ready',
  aside = null,
  next = null,
  vars = null,
  keyNote = null,
}) {
  const [anim, setAnim] = useState(false);
  // Bars grow once, when the card is first drawn, and only in a visible tab:
  // a hidden tab holds an animation at its first frame.
  useEffect(() => {
    try { if (document.visibilityState === 'visible') setAnim(true); } catch (e) { /* no document */ }
  }, []);
  const n = stages.length;
  if (!n) return null;

  const cw = n >= 7 ? 84 : n >= 5 ? 96 : 110;
  const anyAvg = !!(avg && stages.some((s) => Number.isFinite(Number(avg[s.key]))));
  const anyMiss = !!(you && you.miss && stages.some((s) => you.miss[s.key]));
  const anyRank = !!(ranks && stages.some((s) => Number.isFinite(Number(ranks[s.key]))));

  const cell = (r, s, i, isMe) => {
    const v = r.per ? r.per[s.key] : null;
    const has = v != null && Number.isFinite(Number(v));
    const f = has ? fillOf(v, scale[s.key], lower) : 0;
    const a = isMe && anyAvg ? avg[s.key] : null;
    const ta = a != null && Number.isFinite(Number(a)) ? fillOf(a, scale[s.key], lower) : null;
    const miss = isMe && you && you.miss && you.miss[s.key];
    const rk = isMe && ranks && Number.isFinite(Number(ranks[s.key])) ? Number(ranks[s.key]) : null;
    const d = `${0.15 + i * 0.07}s`;
    return { has, v, f, ta, miss, rk, d };
  };

  const bar = (c, s) => (
    <div className="rsc-bar">
      {c.has ? <div className="rsc-f" style={{ width: `${Math.round(c.f * 100)}%`, '--d': c.d }} /> : null}
      {c.has && c.miss && c.f > 0 ? <div className="rsc-x" style={{ left: `calc(${Math.round(c.f * 100)}% - 5%)` }} /> : null}
      {c.ta != null ? <div className="rsc-tk" style={{ left: `${Math.round(c.ta * 100)}%`, '--d': c.d }} /> : null}
    </div>
  );

  const allRows = [...rows];
  // The field's average sits above your own row so your row is the one the
  // eye lands on last.
  const meIx = allRows.findIndex((r) => r.me && r.below);
  const avgRow = anyAvg ? {
    key: 'avg', rank: '', name: 'Field average', title: field ? `${Number(field).toLocaleString()} played` : '',
    per: Object.fromEntries(stages.map((s) => [s.key, avg[s.key]])), total: avgTotal, avg: true,
  } : null;
  if (avgRow) {
    if (meIx >= 0) allRows.splice(meIx, 0, avgRow);
    else allRows.push(avgRow);
  }

  return (
    <div className={`rsc${anim ? ' anim' : ''}`} style={vars || undefined}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="rsc-card">
        {hero ? (
          <>
            <div className="rsc-hero" style={hero.tone ? { '--rs-tone': hero.tone } : undefined}>
              {hero.tone
                ? <div className="rsc-num"><b>{hero.value}</b>{hero.ofText || hero.of ? <small>{hero.ofText || `out of ${hero.of}`}</small> : null}</div>
                : <div className="rsc-lcd">{hero.value}{hero.of ? <small>/{hero.of}</small> : null}</div>}
              <div className="rsc-who">
                {hero.eyebrow ? <div className="rsc-eb" style={hero.tone ? { color: hero.tone } : undefined}>{hero.eyebrow}</div> : null}
                {hero.title ? <div className="rsc-ttl" style={hero.colour ? { color: hero.colour } : undefined}>{hero.title}</div> : null}
                {hero.sub ? <div className="rsc-sub">{hero.sub}</div> : null}
                {hero.ladder && hero.line ? <p className="rsc-line">{hero.line}</p> : null}
              </div>
              {hero.ladder ? <Ladder ladder={hero.ladder} /> : null}
            </div>
            {!hero.ladder && hero.line ? <p className="rsc-line">{hero.line}</p> : null}
          </>
        ) : null}

        <div className="rsc-hd">
          <span>{head}{field ? ` · ${Number(field).toLocaleString()} ${field === 1 ? 'player' : 'players'}` : ''}</span>
          {boardHref ? <a href={boardHref}>Full board</a> : null}
        </div>
        <div className="rsc-mh" style={{ '--n': n }} aria-hidden="true">
          {stages.map((s) => <span key={s.key} style={{ '--sc': s.colour }}>{s.name}</span>)}
        </div>
        {allRows.length ? (
          <div className="rsc-t" style={{ '--n': n, '--cw': `${cw}px` }} role="table">
            <div className="rsc-th" role="columnheader">#</div>
            <div className="rsc-th" role="columnheader">Player</div>
            {stages.map((s) => <div key={s.key} className="rsc-th st" role="columnheader" style={{ '--sc': s.colour }} title={s.name}>{s.name}</div>)}
            <div className="rsc-th r" role="columnheader">Total</div>
            {allRows.map((r) => {
              const isMe = !!r.me;
              const cells = stages.map((s, i) => cell(r, s, i, isMe));
              return (
                <div key={r.key} className={`rsc-r${isMe ? ' me' : ''}${r.avg ? ' avg' : ''}`} role="row">
                  <div className="rsc-rk" style={!isMe && r.rc ? { color: r.rc } : undefined}>{r.rank}</div>
                  <div className="rsc-who">
                    <div className="rsc-nm">{r.name}</div>
                    {r.title ? <div className="rsc-ti">{r.title}</div> : null}
                  </div>
                  {stages.map((s, i) => {
                    const c = cells[i];
                    return (
                      <div key={s.key} className="rsc-c st" style={{ '--sc': s.colour }}>
                        <div className="rsc-v">{c.has ? fmt(c.v, s.key) : '–'}{c.rk ? <i>#{c.rk}</i> : null}</div>
                        {bar(c, s)}
                      </div>
                    );
                  })}
                  <div className="rsc-tot">{r.total != null && Number.isFinite(Number(r.total)) ? totalFmt(r.total) : '–'}</div>
                  <div className="rsc-mb" style={{ '--n': n }}>
                    {stages.map((s, i) => {
                      const c = cells[i];
                      return (
                        <div key={s.key} style={{ '--sc': s.colour }}>
                          {bar(c, s)}
                          {isMe ? <small><b>{c.has ? fmt(c.v, s.key) : '–'}</b>{c.rk ? ` #${c.rk}` : ''}</small> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rsc-empty">{boardState === 'error' ? 'The board could not be loaded just now.' : boardState === 'ready' ? 'Nobody on the board yet.' : 'Reading the board.'}</div>
        )}
        {allRows.length && (anyAvg || anyMiss || anyRank || keyNote) ? (
          <div className="rsc-key">
            {anyAvg ? <span><i className="k1" />Field average</span> : null}
            {anyMiss ? <span><i className="k2" />Where a miss ended it</span> : null}
            {anyRank ? <span><b>#</b>Your rank on that stage</span> : null}
            {keyNote ? <span>{keyNote}</span> : null}
          </div>
        ) : null}
      </div>
      {aside || next ? (
        <div className="rsc-low">
          {aside ? <div>{aside}</div> : null}
          {next ? <div>{next}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

// ── shared helpers for callers ─────────────────────────────────────────────

// A stage's place for a figure against the run board's stageField: everyone
// who did strictly better, plus one. Null when nobody else has played it.
export function stageRank(stageField, key, v) {
  const g = stageField && stageField.games && stageField.games[key];
  if (!g || !Array.isArray(g.vals) || !g.vals.length || v == null) return null;
  const lower = !!stageField.lower;
  let ahead = 0;
  for (const x of g.vals) { if (lower ? x < v : x > v) ahead += 1; else break; }
  return ahead + 1;
}

// Every stage's average and best off the board payload, or null.
export function stageAvg(stageField, stages) {
  if (!stageField || !stageField.games) return null;
  const out = {};
  let any = false;
  for (const s of stages) {
    const g = stageField.games[s.key];
    if (g && Number.isFinite(Number(g.avg)) && (g.plays || 0) >= 2) { out[s.key] = g.avg; any = true; }
  }
  return any ? out : null;
}

export const MEDAL = ['#e8b43a', '#b8bcc4', '#c8814b'];

// Today's top three plus your own row, in the shape RunScorecard draws.
// perOf(row) returns a row's per-stage figures; titleOf(total) the title its
// total earns; mePer and meTotal are your own figures from the run itself, so
// your row and your hero can never disagree.
export function boardRows({ data, perOf, titleOf = null, mePer = null, meTotal = null, meTitle = null }) {
  const rows = data && Array.isArray(data.overall) ? data.overall.filter((x) => Number.isFinite(Number(x.total))) : [];
  const me = data ? (data.me || data.meProvisional || null) : null;
  const meKey = me && me.userKey ? me.userKey : null;
  const meRank = me && Number.isFinite(Number(me.rank)) ? Number(me.rank) : null;
  const field = data ? Number(data.overallField || data.uniquePlayers || rows.length) || null : null;
  const ahead = meRank && field && field >= 2 ? Math.max(0, Math.round(((field - meRank) / field) * 100)) : null;
  const top = rows.slice(0, 3);
  const out = top.map((x, i) => {
    const mine = !!(meKey && x.userKey === meKey);
    const total = mine && meTotal != null ? meTotal : x.total;
    const t = titleOf ? titleOf(total) : '';
    return {
      key: x.userKey || `r${i}`, rank: String(x.rank || i + 1), name: x.username || 'Player',
      title: mine ? [meTitle || t, ahead != null ? `ahead of ${ahead}%` : ''].filter(Boolean).join(' · ') : t,
      total, per: mine && mePer ? mePer : perOf(x), me: mine, rc: MEDAL[i],
    };
  });
  if (!out.some((r) => r.me) && (mePer || me)) {
    const total = meTotal != null ? meTotal : (me ? me.total : null);
    const t = meTitle || (titleOf && total != null ? titleOf(total) : '');
    out.push({
      key: 'me', rank: meRank ? String(meRank) : '–', name: (me && me.username) || 'You',
      title: [t, ahead != null ? `ahead of ${ahead}%` : ''].filter(Boolean).join(' · '),
      total, per: mePer || (me ? perOf(me) : null), me: true, below: true,
    });
  }
  return { rows: out, field, meRank, ahead };
}
