'use client';

// THE MULTIPLE CHOICE LEADERS PAGE (owner, 2026-11-03; approved on the
// "Multiple Choice Leaders" mockup). Full page with only a Back button, in the
// run landing's type (eyebrow, giant title, bold two-line lede) on the site's
// grey ground with white cards and 1px ink outlines.
//
//   1. The period switch: Today, Last Week, Last Month, All Time.
//   2. CHAMPIONS, the default view (owner): the combined champion, then one
//      champion per run in that run's pastel. Tapping one ranks the podium and
//      the field on that run alone; tapping it again returns to all five.
//   3. Top Three: towers built like the run roster stood on end, one band per
//      run sized by that player's correct answers in it.
//   4. The Field: places 4 to 25 with a lane split by run, runs played and the
//      move since the window before. The viewer's own row is always shown.
//
// Data: /api/quiz/multiple-choice (lib/multiple-choice.js), one request per
// period, kept for the visit. Light and dark follow the site look.

import { useEffect, useMemo, useRef, useState } from 'react';
import { MC_RUNS, MC_PERIODS, MC_INK, mcQuery } from '@/lib/multiple-choice';
import { useStageLook, isDarkLook } from '@/lib/stage-look';
import { dailyMeIdentity } from '../dailyMeClient';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const ord = ['1st', '2nd', '3rd'];

function dateLong(iso) {
  try { return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}
function dateShort(iso) {
  try { return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  catch (e) { return ''; }
}

export default function MultipleChoiceClient() {
  const [look] = useStageLook();
  const dark = isDarkLook(look);
  const [period, setPeriod] = useState('today');
  const [sel, setSel] = useState('all');
  const [data, setData] = useState({});
  const [err, setErr] = useState({});
  const [tip, setTip] = useState(null);
  const [tries, setTries] = useState(0);
  const asked = useRef({});

  useEffect(() => {
    try { const p = sessionStorage.getItem('mcl_period'); if (MC_PERIODS.some((x) => x.id === p)) setPeriod(p); } catch (e) { /* private window */ }
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem('mcl_period', period); } catch (e) { /* private window */ }
    if (asked.current[period]) return;
    asked.current[period] = true;
    const qs = mcQuery(period, dailyMeIdentity());
    fetch(`/api/quiz/multiple-choice?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d || d.error) { setErr((e) => ({ ...e, [period]: true })); asked.current[period] = false; return; }
        setData((x) => ({ ...x, [period]: d }));
      })
      .catch(() => { setErr((e) => ({ ...e, [period]: true })); asked.current[period] = false; });
  }, [period, tries]);

  const d = data[period] || null;
  const P = MC_PERIODS.find((x) => x.id === period) || MC_PERIODS[0];
  const runName = sel === 'all' ? 'All Five Runs' : (MC_RUNS.find((r) => r.id === sel) || {}).name;
  const board = d && d.boards ? (d.boards[sel] || []) : [];
  const meName = d && d.me ? d.me.name : null;
  const isMe = (r) => !!(meName && r && r.name === meName);

  const back = (e) => {
    try {
      if (document.referrer && new URL(document.referrer).origin === window.location.origin && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    } catch (x) { /* fall through to the link */ }
  };

  const windowNote = !d ? '' : period === 'today' ? dateLong(d.to)
    : `${dateShort(d.from)} to ${dateShort(d.to)}`;

  // The field: places 4 to 25, plus the viewer's own row when it sits lower.
  const field = useMemo(() => {
    const rows = board.slice(3, 25);
    if (d && d.me && d.me.ranks && d.me.ranks[sel] && !board.slice(0, 25).some(isMe)) {
      const v = sel === 'all' ? d.me.total : d.me.by[sel];
      if (v > 0) rows.push({ name: d.me.name || 'You', rank: d.me.ranks[sel], value: v, total: d.me.total, by: d.me.by, runs: d.me.runs, move: sel === 'all' ? d.me.move : null, mine: true });
    }
    return rows;
  }, [d, sel, board]); // eslint-disable-line react-hooks/exhaustive-deps
  const fmax = board.length ? board[0].value : 1;
  const keys = sel === 'all' ? MC_RUNS.map((r) => r.id) : [sel];

  const showTip = (e, r) => {
    const x = e.clientX, y = e.clientY;
    setTip({ r, x, y });
  };

  return (
    <div className={'mcl' + (dark ? ' dk' : '')}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="mcl-wrap">
        <div className="mcl-cap">
          <a className="mcl-back" href="/" onClick={back}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 2.5 4.5 7 9 11.5" /></svg>
            Back
          </a>
        </div>

        <div className="mcl-eb">Multiple Choice Runs{windowNote ? ` · ${windowNote}` : ''}</div>
        <h1>Multiple Choice Leaders</h1>
        <p className="mcl-lead">Five Runs. One Board.</p>
        <p className="mcl-lead2">Every correct answer from the Trivia Gauntlet, Trivia Encore, Math Gauntlet, Science Gauntlet and English Gauntlet.</p>

        <div className="mcl-seg" role="group" aria-label="Period">
          {MC_PERIODS.map((p) => (
            <button key={p.id} type="button" aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>{p.label}</button>
          ))}
        </div>

        <div className="mcl-figs" aria-live="polite">
          <div><b>{d ? fmt(d.players) : ' '}</b><i>Players</i></div>
          <div><b>{d ? fmt(d.runsPlayed) : ' '}</b><i>Runs Played</i></div>
          <div><b>{d ? fmt(d.correct) : ' '}</b><i>Correct Answers</i></div>
        </div>

        {err[period] && !d ? (
          <div className="mcl-empty">The board could not be read just now. <button type="button" onClick={() => { setErr((e) => ({ ...e, [period]: false })); setTries((t) => t + 1); }}>Try again</button></div>
        ) : null}

        {/* CHAMPIONS */}
        <div className="mcl-sec"><h2>Champions</h2><span>Tap one to rank on it alone</span></div>
        <div className={'mcl-champs' + (sel !== 'all' ? ' filtering' : '')}>
          {(() => {
            const c = d && d.champions ? d.champions.all : null;
            const played = c ? MC_RUNS.filter((r) => c.by[r.id] > 0) : [];
            return (
              <button type="button" className={'mcl-cc' + (d ? '' : ' wait')} aria-pressed={sel === 'all'} onClick={() => setSel('all')}>
                <span className="l">
                  <span className="e">Combined Champion · {P.label}</span>
                  <span className="n">{c ? c.name : d ? 'Nobody yet' : ' '}{c && isMe(c) ? <span className="you">You</span> : null}</span>
                  <span className="v">{c ? `${fmt(c.total)} correct across ${played.length} ${played.length === 1 ? 'run' : 'runs'}` : d ? 'Play any of the five runs to take the lead.' : 'Reading the board'}</span>
                </span>
                <span className="bar" aria-hidden="true">
                  {played.map((r) => (
                    <span key={r.id} style={{ flexGrow: c.by[r.id], background: r.colour }}><b>{r.short}</b><i>{fmt(c.by[r.id])}</i></span>
                  ))}
                </span>
              </button>
            );
          })()}
          <div className="mcl-rcg">
            {MC_RUNS.map((r) => {
              const c = d && d.champions ? d.champions[r.id] : null;
              return (
                <button key={r.id} type="button" className="mcl-rc" aria-pressed={sel === r.id} style={{ background: r.colour }}
                  onClick={() => setSel((s) => (s === r.id ? 'all' : r.id))}>
                  <span className="r">{r.name}</span>
                  <span className="n">{c ? c.name : d ? 'Nobody yet' : ' '}{c && isMe(c) ? <span className="you">You</span> : null}</span>
                  <span className="v">{c ? fmt(c.value) : ' '}{c ? <small> correct</small> : null}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TOP THREE */}
        <div className="mcl-sec"><h2>Top Three</h2><span>{runName} · {P.label}</span></div>
        <div className="mcl-podium">
          {[1, 0, 2].map((i) => {
            const r = board[i];
            const h = [1, 0.8, 0.66][i];
            const bands = r ? MC_RUNS.filter((x) => keys.includes(x.id) && r.by[x.id] > 0) : [];
            return (
              <div key={i} className={'mcl-pc p' + (i + 1)}>
                <div className="who">
                  <span className="place" style={{ background: ['#fdd97c', '#dce6f7', '#f1d289'][i] }}>{ord[i]}</span>
                  <div className="nm">{r ? r.name : ' '}{r && isMe(r) ? <span className="you">You</span> : null}</div>
                  <div className="num">{r ? fmt(r.value) : '–'}<small>correct</small></div>
                </div>
                <div className={'tower' + (r ? '' : ' none')} style={{ '--th': h }}
                  onMouseMove={r ? (e) => showTip(e, r) : undefined} onMouseLeave={() => setTip(null)}>
                  {bands.map((x) => {
                    const v = r.by[x.id];
                    const thin = (v / Math.max(1, r.value)) * h < 0.09;
                    return (
                      <div key={x.id} className={'band' + (thin ? ' thin' : '')} style={{ flexGrow: v, background: x.colour }}>
                        <b>{x.short}</b><em>{fmt(v)}</em>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* THE FIELD */}
        <div className="mcl-sec"><h2>The Field</h2><span>{d && d.boards ? `Movement vs ${P.prevLabel}` : ''}</span></div>
        <div className="mcl-field">
          <div className="fh"><span>{runName} · {P.label}</span><i>{d && d.field ? `${fmt(d.field[sel])} ranked` : ''}</i></div>
          {field.length ? field.map((r) => {
            const mv = r.move;
            const mine = r.mine || isMe(r);
            return (
              <div key={r.rank + '|' + r.name} className={'row' + (mine ? ' me' : '')}
                onMouseMove={(e) => showTip(e, r)} onMouseLeave={() => setTip(null)}>
                <span className="rk">{r.rank}
                  {mv === 'new' ? <span className="mv n">New</span> : typeof mv === 'number' && mv > 0 ? <span className="mv u">&#9650;{mv}</span> : typeof mv === 'number' && mv < 0 ? <span className="mv d">&#9660;{-mv}</span> : null}
                </span>
                <span className="nm"><b>{r.name}{mine ? <span className="you">You</span> : null}</b><span>{r.runs} {r.runs === 1 ? 'run' : 'runs'}</span></span>
                <span className="lane" aria-hidden="true">
                  {keys.filter((k) => r.by[k] > 0).map((k) => (
                    <span key={k} className="s" style={{ width: `${(r.by[k] / Math.max(1, fmax)) * 100}%`, background: MC_RUNS.find((x) => x.id === k).strong }} />
                  ))}
                </span>
                <span className="tot">{fmt(r.value)}</span>
              </div>
            );
          }) : (
            <div className="mcl-none">{!d ? 'Reading the board' : board.length ? 'Everyone who played is in the Top Three.' : 'No correct answers yet. Every run below is open.'}</div>
          )}
        </div>

        <div className="mcl-runs">
          {MC_RUNS.map((r) => (
            <a key={r.id} href={r.href} style={{ background: r.colour }}>{r.name}</a>
          ))}
        </div>
        <p className="mcl-foot">Ranked on correct answers. A tie goes to the player with fewer runs played. Last Week and Last Month are the last 7 and 30 days, today included.</p>
      </div>

      {tip ? (
        <div className="mcl-tip" style={{ left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 230), top: tip.y + 14 }} role="tooltip">
          <h4>{tip.r.name}</h4>
          {MC_RUNS.map((x) => (
            <div key={x.id}><span><i style={{ background: x.colour }} />{x.name}</span><b>{fmt(tip.r.by[x.id])}</b></div>
          ))}
          <div className="t"><span>Total</span><b>{fmt(tip.r.total)}</b></div>
        </div>
      ) : null}
    </div>
  );
}

const CSS = `
html:has(.mcl),body:has(.mcl){background:#eef1f6}
html[data-stage-boot="dark"]:has(.mcl),html[data-stage-boot="dark"] body:has(.mcl),html:has(.mcl.dk),body:has(.mcl.dk){background:#0b0f1a}
.mcl{--g:#eef1f6;--card:#fff;--ink:${MC_INK};--ink2:#2b4250;--mute:#66748f;--hair:#dfe4ec;--me:#e6ebf3;--on:${MC_INK};--up:#15803d;--dn:#c0392b;
  min-height:100vh;background:var(--g);color:var(--ink);font-family:Manrope,system-ui,-apple-system,sans-serif;font-variant-numeric:tabular-nums;
  padding:0 max(16px,env(safe-area-inset-right,0px)) 64px max(16px,env(safe-area-inset-left,0px));box-sizing:border-box;-webkit-font-smoothing:antialiased}
html[data-stage-boot="dark"] .mcl,.mcl.dk{--g:#0b0f1a;--card:#0e131f;--ink:#e9edf4;--ink2:#c9d0de;--mute:#8b95a8;--hair:rgba(255,255,255,.1);--me:#141b2b;--up:#6ee7b7;--dn:#f87171}
.mcl *{box-sizing:border-box}
.mcl button{font:inherit;color:inherit}
.mcl :focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.mcl-wrap{max-width:880px;margin:0 auto}
.mcl-cap{display:flex;align-items:center;height:66px;padding-top:6px}
.mcl-back{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--ink);border-radius:999px;padding:6px 14px 6px 10px;font-weight:800;font-size:13px;color:var(--ink);text-decoration:none}
.mcl-back svg{width:13px;height:13px}
.mcl-eb{margin-top:52px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2)}
.mcl h1{margin:10px 0 0;font-size:clamp(46px,9.5vw,96px);font-weight:800;letter-spacing:-.035em;line-height:.95;text-wrap:balance;color:var(--ink)}
.mcl-lead{margin:18px 0 0;font-size:clamp(17px,2.3vw,21px);font-weight:800;letter-spacing:-.01em}
.mcl-lead2{margin:4px 0 0;font-size:clamp(15px,2vw,18px);font-weight:500;color:var(--ink2);max-width:56ch}
.mcl-seg{display:flex;gap:4px;margin-top:28px;border:1px solid var(--ink);border-radius:999px;padding:4px;width:max-content;max-width:100%;background:var(--card)}
.mcl-seg button{border:0;background:transparent;border-radius:999px;padding:9px 18px;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap}
.mcl-seg button[aria-pressed="true"]{background:var(--ink);color:var(--g)}
.mcl-figs{display:flex;flex-wrap:wrap;gap:14px 40px;margin-top:26px}
.mcl-figs b{display:block;font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1;min-width:3ch}
.mcl-figs i{display:block;font-style:normal;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin-top:6px}
.mcl-empty{margin-top:18px;font-weight:700;color:var(--ink2)}
.mcl-empty button{border:1px solid var(--ink);background:transparent;border-radius:999px;padding:4px 12px;font-weight:800;cursor:pointer;margin-left:8px}
.mcl-sec{margin-top:52px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.mcl-sec h2{margin:0;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.mcl-sec span{font-size:13px;font-weight:600;color:var(--mute)}
.you{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:1px solid currentColor;border-radius:999px;padding:0 6px;margin-left:7px;vertical-align:2px}

.mcl-champs{margin-top:16px;display:flex;flex-direction:column;gap:10px}
.mcl-cc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:24px;align-items:center;text-align:left;border:1px solid var(--ink);border-radius:14px;background:var(--card);padding:20px 22px;cursor:pointer;width:100%;min-height:108px}
.mcl-cc .l{display:flex;flex-direction:column;gap:7px;min-width:0}
.mcl-cc .e{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.mcl-cc .n{font-size:clamp(28px,4.6vw,46px);font-weight:800;letter-spacing:-.03em;line-height:1.08;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-bottom:.08em}
.mcl-cc .v{font-size:15px;font-weight:700;color:var(--ink2)}
.mcl-cc .bar{display:flex;height:66px;border:1px solid ${MC_INK};border-radius:12px;overflow:hidden;min-width:0}
.mcl-cc .bar:empty{border-color:var(--hair)}
.mcl-cc .bar span{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:0 10px;color:${MC_INK};min-width:0;overflow:hidden;border-left:1px solid ${MC_INK};transition:flex-grow .6s cubic-bezier(.2,.8,.2,1)}
.mcl-cc .bar span:first-child{border-left:0}
.mcl-cc .bar b{font-size:12px;font-weight:800;white-space:nowrap}
.mcl-cc .bar i{font-style:normal;font-size:19px;font-weight:800;line-height:1}
.mcl-rcg{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.mcl-rc{display:flex;flex-direction:column;gap:4px;text-align:left;border:1px solid ${MC_INK};border-radius:14px;padding:14px;cursor:pointer;color:${MC_INK};min-width:0;transition:filter .2s}
.mcl-rc .r{font-size:12px;font-weight:800;opacity:.75}
.mcl-rc .n{font-size:17px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:8px;padding-bottom:.08em}
.mcl-rc .v{font-size:28px;font-weight:800;letter-spacing:-.03em;line-height:1}
.mcl-rc .v small{font-size:12px;letter-spacing:0;opacity:.75}
.mcl-cc[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--ink)}
.mcl-rc[aria-pressed="true"]{box-shadow:inset 0 0 0 2px ${MC_INK}}
.mcl-champs.filtering .mcl-rc:not([aria-pressed="true"]){filter:saturate(.45)}

.mcl-podium{display:grid;grid-template-columns:1fr 1.12fr 1fr;gap:clamp(10px,2.4vw,22px);align-items:end;margin-top:16px;border-bottom:1px solid var(--ink);--tmax:300px}
.mcl-pc{display:flex;flex-direction:column;min-width:0}
.mcl-pc .who{padding:0 2px 12px;min-width:0}
.mcl-pc .place{display:inline-flex;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:1px solid ${MC_INK};color:${MC_INK};border-radius:999px;padding:3px 10px}
.mcl-pc .nm{margin-top:10px;font-weight:800;font-size:clamp(15px,2.2vw,22px);letter-spacing:-.015em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.08em}
.mcl-pc .num{font-weight:800;font-size:clamp(30px,5.6vw,56px);letter-spacing:-.04em;line-height:1}
.mcl-pc .num small{font-size:13px;font-weight:700;color:var(--mute);letter-spacing:0;margin-left:6px}
.mcl-pc .tower{height:calc(var(--tmax) * var(--th));border:1px solid ${MC_INK};border-bottom:0;border-radius:14px 14px 0 0;overflow:hidden;display:flex;flex-direction:column;transition:height .65s cubic-bezier(.2,.8,.2,1)}
.mcl-pc .tower.none{border-color:var(--hair);background:var(--card)}
.mcl-pc .band{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 12px;color:${MC_INK};overflow:hidden;min-height:0;border-top:1px solid ${MC_INK};flex-basis:0}
.mcl-pc .band:first-child{border-top:0}
.mcl-pc .band b{font-size:13px;font-weight:800;white-space:nowrap}
.mcl-pc .band em{font-style:normal;font-size:12px;font-weight:800;opacity:.8}
.mcl-pc .band.thin b,.mcl-pc .band.thin em{display:none}

.mcl-field{margin-top:14px;border:1px solid var(--ink);border-radius:14px;background:var(--card);overflow:hidden}
.mcl-field .fh{display:flex;justify-content:space-between;gap:10px;padding:11px 16px;border-bottom:1px solid var(--hair);font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.mcl-field .fh i{font-style:italic;color:var(--mute);font-weight:700;letter-spacing:.06em}
.mcl-field .row{display:grid;grid-template-columns:52px minmax(96px,180px) minmax(0,1fr) 60px;align-items:center;gap:14px;padding:9px 16px;border-top:1px solid var(--hair)}
.mcl-field .fh + .row{border-top:0}
.mcl-field .row.me{background:var(--me)}
.mcl-field .rk{font-size:13px;font-weight:600;color:var(--mute);display:flex;gap:4px;align-items:baseline}
.mcl-field .mv{font-size:10px;font-weight:800}
.mcl-field .mv.u{color:var(--up)}.mcl-field .mv.d{color:var(--dn)}.mcl-field .mv.n{color:var(--mute)}
.mcl-field .nm{min-width:0}
.mcl-field .nm b{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.08em}
.mcl-field .nm span{font-size:11.5px;color:var(--mute);font-weight:600}
.mcl-field .lane{height:12px;border:1px solid var(--ink);border-radius:999px;display:flex;overflow:hidden;min-width:0;background:var(--card)}
.mcl-field .lane .s{height:100%;transition:width .6s cubic-bezier(.2,.8,.2,1)}
.mcl-field .lane .s+.s{border-left:1px solid ${MC_INK}}
.mcl-field .tot{text-align:right;font-size:15px;font-weight:800}
.mcl-none{padding:22px 16px;font-weight:700;color:var(--mute)}
.mcl-runs{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.mcl-runs a{padding:9px 14px;border:1px solid ${MC_INK};border-radius:999px;color:${MC_INK};text-decoration:none;font-size:13px;font-weight:800}
.mcl-runs a:hover{text-decoration:underline;text-underline-offset:3px}
.mcl-foot{margin-top:14px;font-size:12px;font-weight:600;color:var(--mute);max-width:70ch}
.mcl-tip{position:fixed;z-index:20;pointer-events:none;background:var(--card);color:var(--ink);border:1px solid var(--ink);border-radius:12px;padding:10px 12px;font-size:13px;width:216px;font-family:Manrope,system-ui,sans-serif}
.mcl-tip h4{margin:0 0 6px;font-size:13px;font-weight:800}
.mcl-tip div{display:flex;justify-content:space-between;gap:10px;padding:2px 0;font-weight:600;color:var(--ink2)}
.mcl-tip div span{display:flex;align-items:center;gap:7px}
.mcl-tip div i{width:11px;height:11px;border-radius:3px;border:1px solid ${MC_INK};flex:none}
.mcl-tip div b{color:var(--ink)}
.mcl-tip .t{border-top:1px solid var(--hair);margin-top:4px;padding-top:6px}
@media (hover:none){.mcl-tip{display:none}}
@media (max-width:760px){
  .mcl-cc{grid-template-columns:1fr;gap:16px;padding:16px}.mcl-cc .bar{height:54px}.mcl-cc .bar i{font-size:15px}.mcl-cc .bar b{font-size:10.5px}.mcl-cc .bar span{padding:0 6px}
  .mcl-rcg{grid-template-columns:1fr;gap:0;border:1px solid ${MC_INK};border-radius:14px;overflow:hidden}
  .mcl-rc{flex-direction:row;align-items:center;gap:10px;border:0;border-top:1px solid ${MC_INK};border-radius:0;padding:12px 14px}
  .mcl-rc:first-child{border-top:0}.mcl-rc .r{flex:0 0 108px}.mcl-rc .n{margin:0;flex:1;font-size:15px}.mcl-rc .v{font-size:19px}
}
@media (max-width:640px){
  .mcl-eb{margin-top:34px}
  .mcl-seg{width:100%}.mcl-seg button{flex:1;padding:9px 4px;font-size:13px}
  .mcl-podium{--tmax:220px}
  .mcl-pc .band b,.mcl-pc .band em{font-size:11px}.mcl-pc .band{padding:0 7px}
  .mcl-field .row{grid-template-columns:34px minmax(0,1fr) 52px;grid-template-areas:"rk nm tot" "rk ln ln";row-gap:7px;padding:10px 14px}
  .mcl-field .rk{grid-area:rk;align-self:start;flex-direction:column;gap:0}.mcl-field .nm{grid-area:nm}.mcl-field .lane{grid-area:ln;height:10px}.mcl-field .tot{grid-area:tot}
}
@media (prefers-reduced-motion:reduce){.mcl *{transition:none!important}}
`;
