'use client';

// Glimpse: the daily flash-recall game (owner, 2026-11-22: "a daily that gives
// you a glimpse of something and forces recall", then "can we combine multiple
// elements of these into one daily?", approved from the mockup and ordered
// built the same day). A square panel in four quadrants (dots, a lit grid, a
// clock, a string) shows for a second or two, blanks, and asks about ONE
// quadrant. Five flashes, six on the Sunday Edition, each worth 100 on
// closeness. Runs on the shared stage shell (app/SimpleDaily.jsx); everything
// the panel draws and every score comes from lib/glimpse-engine.js, the module
// the generator and checker read.
//
// ONE LOOK PER FLASH. The moment Show me is pressed is stamped into the save
// (s.t), and the panel's window is read off that stamp, so a reload during the
// flash comes back to the question with the time already spent: leaving and
// returning never buys a second look. The panel blanks on the frame its time
// runs out, with no fade.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import SimpleDaily from '../SimpleDaily';
import { endGrade } from '@/lib/end-verdict';
import {
  QUADS, QUAD_NAME, BANDS, COUNT_MS, BEAT_MS, quadSvg, askPoints, flashPoints, dayPoints, maxPoints, truthOf, dialOff, fmtClock,
} from '@/lib/glimpse-engine';

const ansOf = (s, i) => (Array.isArray(s.ans) && Array.isArray(s.ans[i]) ? s.ans[i] : []);
const flashDone = (P, s, i) => ansOf(s, i).length >= P.flashes[i].asks.length;
const doneCount = (P, s) => P.flashes.filter((_, i) => flashDone(P, s, i)).length;
const points = (P, s) => dayPoints(P, s.ans || []);
const secs = (ms) => (ms / 1000).toFixed(ms % 1000 ? (ms % 100 ? 2 : 1) : 0);
const askTitle = (a) => (a.kind === 'dots' ? (a.red ? 'Red dots' : 'Dots') : QUAD_NAME[a.kind]);

const CSS = `
.gl{display:flex;flex-direction:column;gap:12px;width:100%;max-width:500px;margin:0 auto;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);}
.gl-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:15px;font-weight:800;line-height:1.4;}
.gl-box{position:relative;width:100%;aspect-ratio:1/1;border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;overflow:hidden;background:#ffffff;color:#0b0f1a;}
.gl-panel{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:1px;background:#0b0f1a;}
.gl-q{position:relative;background:#ffffff;line-height:0;}
.gl-q.ask{box-shadow:inset 0 0 0 3px var(--pst-acc,#e879f9);}
.gl-tag{position:absolute;left:8px;top:7px;line-height:1.2;font-size:12px;font-weight:800;color:#0b0f1a;background:#ffffff;padding:1px 5px;border-radius:6px;}
.gl-over{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;text-align:center;padding:20px;background:#ffffff;}
.gl-big{font-size:clamp(64px,22vw,120px);font-weight:800;line-height:1.05;}
.gl-mid{font-size:24px;font-weight:800;line-height:1.3;}
.gl-sm{font-size:14px;font-weight:600;line-height:1.5;opacity:.75;}
.gl-time{position:absolute;left:0;bottom:0;height:6px;width:100%;background:#0b0f1a;transform-origin:left;}
.gl-q2{margin:0;text-align:center;font-size:clamp(21px,6vw,26px);font-weight:800;line-height:1.3;}
.gl-hint{margin:0;text-align:center;font-size:14px;font-weight:600;line-height:1.5;opacity:.8;}
.gl-num{width:min(78%,300px);min-height:76px;border-radius:14px;border:1px solid #0b0f1a;background:#f4f5f8;color:#0b0f1a;font-family:inherit;font-size:44px;font-weight:800;text-align:center;outline:none;}
.gl-num.str{font-size:32px;letter-spacing:.16em;text-transform:uppercase;}
.gl-num:focus{box-shadow:0 0 0 3px var(--pst-acc,#e879f9);}
.gl-pick{position:absolute;inset:7%;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:8px;}
.gl-cell{border:0;border-radius:10px;background:#eceef2;cursor:pointer;padding:0;}
.gl-cell.on{background:var(--pst-acc,#f1aff6);box-shadow:inset 0 0 0 2px #0b0f1a;}
.gl-cell.hit{background:var(--pst-acc,#f1aff6);box-shadow:inset 0 0 0 2px #0b0f1a;}
.gl-cell.lost{background:var(--pst-acc,#f1aff6);opacity:.45;box-shadow:inset 0 0 0 2px #0b0f1a;}
.gl-cell.miss{background:#ffffff;box-shadow:inset 0 0 0 3px #c2410c;}
.gl-cell:focus-visible{outline:3px solid #0b0f1a;outline-offset:2px;}
.gl-dial{position:absolute;inset:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:10px;padding:14px;}
.gl-dial>div:first-child{line-height:0;display:flex;justify-content:center;}
.gl-dial>div:first-child>div{height:100%;aspect-ratio:1/1;}
.gl-ctl{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.gl-step{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;border:1px solid #0b0f1a;border-radius:12px;overflow:hidden;}
.gl-step span{text-align:center;font-size:17px;font-weight:800;}
.gl-step button{height:48px;border:0;background:#eceef2;color:#0b0f1a;font-family:inherit;font-size:22px;font-weight:800;cursor:pointer;}
.gl-step button:first-child{border-right:1px solid #0b0f1a;}
.gl-step button:last-child{border-left:1px solid #0b0f1a;}
.gl-list{display:flex;flex-direction:column;border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;overflow:hidden;}
.gl-li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 14px;}
.gl-li+.gl-li{border-top:1px solid color-mix(in srgb,var(--pst-ink,#0b0f1a) 22%,transparent);}
.gl-li b{display:block;font-size:15px;font-weight:800;line-height:1.35;}
.gl-li span{display:block;font-size:14px;font-weight:600;line-height:1.45;opacity:.8;}
.gl-pts{font-size:22px;font-weight:800;white-space:nowrap;}
.gl-meter{height:6px;border-radius:3px;margin-top:6px;background:color-mix(in srgb,var(--pst-ink,#0b0f1a) 14%,transparent);overflow:hidden;}
.gl-meter i{display:block;height:100%;background:var(--pst-ink,#0b0f1a);}
.gl-total{display:flex;justify-content:space-between;align-items:baseline;font-size:17px;font-weight:800;}
@media (prefers-reduced-motion:reduce){.gl-time{display:none;}}
`;

function Panel({ f, show, asked = [], tags = false, grid = null }) {
  return (
    <div className="gl-panel">
      {QUADS.map((k) => (
        <div key={k} className={'gl-q' + (asked.includes(k) ? ' ask' : '')}>
          {show && f.quads.includes(k) ? (k === 'grid' && grid ? grid : <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: quadSvg(f, k) }} />) : null}
          {tags && asked.includes(k) ? <span className="gl-tag">{QUAD_NAME[k]}</span> : null}
        </div>
      ))}
    </div>
  );
}

// The reveal grid: lit squares you picked full, lit ones you missed faded, and
// a picked square that was not lit ringed.
function RevealGrid({ f, picks }) {
  return (
    <div className="gl-pick" style={{ inset: '9%', gap: 5 }} aria-label="The grid: your picks against the lit squares">
      {Array.from({ length: 16 }, (_, i) => {
        const L = f.lit.includes(i), Pk = picks.includes(i);
        return <div key={i} className={'gl-cell' + (L && Pk ? ' hit' : Pk ? ' miss' : L ? ' lost' : '')} style={{ cursor: 'default' }} />;
      })}
    </div>
  );
}

function answerLine(f, a, y) {
  const t = truthOf(f, a);
  if (y == null) return `Not answered. It was ${a.kind === 'dial' ? fmtClock(t[0], t[1]) : a.kind === 'grid' ? `${t.length} squares` : t}.`;
  if (a.kind === 'dots') { const off = t ? Math.round((Math.abs(y - t) / t) * 100) : 0; return `You said ${y}, it was ${t}${off ? ` · ${off}% off` : ' · exact'}`; }
  if (a.kind === 'grid') { const hit = [...new Set(y)].filter((i) => f.lit.includes(i)).length; return `${hit} of ${f.lit.length} squares right`; }
  if (a.kind === 'dial') { const d = dialOff(y, t); return `You said ${fmtClock(y[0], y[1])}, it was ${fmtClock(t[0], t[1])}${d ? ` · ${d} min off` : ' · exact'}`; }
  let ok = 0; for (let i = 0; i < t.length; i++) if ((y || '')[i] === t[i]) ok++;
  return `You typed ${y || 'nothing'}, it was ${t} · ${ok} of ${t.length} in place`;
}

function Results({ P, s, upto }) {
  const rows = [];
  P.flashes.forEach((f, i) => {
    if (i > upto) return;
    const ans = ansOf(s, i);
    f.asks.forEach((a, k) => {
      const y = ans[k];
      const pts = askPoints(f, a, y);
      rows.push(
        <div className="gl-li" key={`${i}-${k}`}>
          <div>
            <b>{`Flash ${i + 1} · ${askTitle(a)}`}</b>
            <span>{answerLine(f, a, y)}</span>
            <div className="gl-meter"><i style={{ width: `${pts}%` }} /></div>
          </div>
          <div className="gl-pts">{pts}</div>
        </div>,
      );
    });
  });
  return <div className="gl-list">{rows}</div>;
}

// ── the four answer pads ─────────────────────────────────────────────────────
function NumberPad({ kind, len, onSubmit }) {
  const [v, setV] = useState('');
  const ref = useRef(null);
  useEffect(() => { const t = setTimeout(() => { try { ref.current && ref.current.focus(); } catch (e) {} }, 40); return () => clearTimeout(t); }, []);
  const ok = kind === 'dots' ? /^\d+$/.test(v) : v.length > 0;
  const go = () => { if (ok) onSubmit(kind === 'dots' ? Number(v) : v.toUpperCase()); };
  return (
    <>
      <div className="gl-box"><div className="gl-over">
        <input ref={ref} className={'gl-num' + (kind === 'string' ? ' str' : '')} value={v} aria-label={kind === 'dots' ? 'How many' : 'The string'}
          {...(kind === 'dots' ? { inputMode: 'numeric', pattern: '[0-9]*' } : { maxLength: len, autoCapitalize: 'characters', autoComplete: 'off', autoCorrect: 'off', spellCheck: false })}
          onChange={(e) => setV(kind === 'dots' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value.replace(/\s/g, '').slice(0, len).toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') go(); }} />
        <div className="gl-sm">{kind === 'dots' ? 'Your best guess. Close counts.' : `${len} characters. Each one in the right place scores.`}</div>
      </div></div>
      <button type="button" className="pst-tb wide on" disabled={!ok} onClick={go}>Lock it in</button>
    </>
  );
}
function GridPad({ n, onSubmit }) {
  const [picks, setPicks] = useState([]);
  const tap = (i) => setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length < n ? [...p, i] : p));
  return (
    <>
      <div className="gl-box"><div className="gl-pick">
        {Array.from({ length: 16 }, (_, i) => (
          <button type="button" key={i} className={'gl-cell' + (picks.includes(i) ? ' on' : '')} aria-pressed={picks.includes(i)} aria-label={`Row ${Math.floor(i / 4) + 1}, square ${(i % 4) + 1}`} onClick={() => tap(i)} />
        ))}
      </div></div>
      <p className="gl-hint">{picks.length} of {n} picked</p>
      <button type="button" className="pst-tb wide on" disabled={picks.length !== n} onClick={() => onSubmit(picks.slice().sort((a, b) => a - b))}>Lock it in</button>
    </>
  );
}
function DialPad({ onSubmit }) {
  const [h, setH] = useState(12);
  const [m, setM] = useState(0);
  const face = useMemo(() => quadSvg({ h, m }, 'dial'), [h, m]);
  return (
    <>
      <div className="gl-box"><div className="gl-dial">
        <div><div dangerouslySetInnerHTML={{ __html: face }} /></div>
        <div className="gl-ctl">
          <div className="gl-step"><button type="button" aria-label="Hour back" onClick={() => setH((x) => (x === 1 ? 12 : x - 1))}>−</button><span>{h}</span><button type="button" aria-label="Hour forward" onClick={() => setH((x) => (x === 12 ? 1 : x + 1))}>+</button></div>
          <div className="gl-step"><button type="button" aria-label="Five minutes back" onClick={() => setM((x) => (x + 55) % 60)}>−</button><span>:{String(m).padStart(2, '0')}</span><button type="button" aria-label="Five minutes forward" onClick={() => setM((x) => (x + 5) % 60)}>+</button></div>
        </div>
      </div></div>
      <p className="gl-hint">Hours on the left, minutes in fives on the right.</p>
      <button type="button" className="pst-tb wide on" onClick={() => onSubmit([h, m])}>Lock it in</button>
    </>
  );
}

function Board({ P, s, setS, active, done }) {
  const N = P.flashes.length;
  const i = Math.min(s.i || 0, N - 1);
  const f = P.flashes[i];
  const [now, setNow] = useState(() => Date.now());
  const looking = !done && active && s.ph === 'look' && !!s.t;
  // The flash clock: a frame loop while looking, so the panel blanks on time.
  useEffect(() => {
    if (!looking) return undefined;
    let raf = 0;
    const end = s.t + COUNT_MS + f.ms;
    const tick = () => {
      const n = Date.now();
      if (n >= end) { setS((st) => (st.ph === 'look' && st.i === i ? { ...st, ph: 'ask', q: 0 } : st)); return; }
      setNow(n);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [looking, s.t, f.ms, i, setS]);

  if (done) {
    const last = Math.max(0, P.flashes.findIndex((_, k) => !flashDone(P, s, k)) - 1);
    const shown = P.flashes.every((_, k) => flashDone(P, s, k)) ? N - 1 : last;
    const lf = P.flashes[shown];
    const gq = lf.asks.findIndex((a) => a.kind === 'grid');
    const picks = gq >= 0 ? ansOf(s, shown)[gq] : null;
    return (
      <div className="gl">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="gl-total"><span>{points(P, s).toLocaleString('en-US')} points</span><span>{doneCount(P, s)} of {N} flashes</span></div>
        <div className="gl-box"><Panel f={lf} show asked={lf.asks.map((a) => a.kind)} tags grid={Array.isArray(picks) ? <RevealGrid f={lf} picks={picks} /> : null} /></div>
        <p className="gl-hint">{`Flash ${shown + 1}, as it was shown.`}</p>
        <Results P={P} s={s} upto={N - 1} />
      </div>
    );
  }

  const head = <div className="gl-row"><span>{`Flash ${i + 1} of ${N}`}</span><span>{`${points(P, s).toLocaleString('en-US')} points`}</span></div>;

  if (s.ph === 'ready' || !s.ph) {
    return (
      <div className="gl">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {head}
        <div className="gl-box"><Panel f={f} show={false} /><div className="gl-over" style={{ background: 'transparent' }}>
          <div className="gl-mid" style={{ background: '#fff', padding: '6px 12px', borderRadius: 10 }}>{`${secs(f.ms)} seconds`}</div>
          <div className="gl-sm" style={{ background: '#fff', padding: '2px 10px', borderRadius: 8 }}>{f.quads.length === 2 ? 'Two quadrants' : 'All four quadrants'}{f.asks.length > 1 ? ' · two questions' : ''}</div>
        </div></div>
        <p className="gl-hint">One quadrant is asked about after it disappears. You will not know which.</p>
        <button type="button" className="pst-tb wide on" disabled={!active} onClick={() => setS((st) => (st.ph === 'ready' && st.i === i ? { ...st, ph: 'look', t: Date.now() } : st))}>Show me</button>
      </div>
    );
  }

  if (s.ph === 'look') {
    const el = s.t ? now - s.t : 0;
    const counting = el < COUNT_MS;
    const left = Math.max(0, COUNT_MS + f.ms - el);
    return (
      <div className="gl">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {head}
        <div className="gl-box">
          {counting
            ? <><Panel f={f} show={false} /><div className="gl-over" style={{ background: 'transparent' }}><div className="gl-big" style={{ background: '#fff', borderRadius: 18, padding: '0 22px' }}>{3 - Math.floor(el / BEAT_MS)}</div></div></>
            : <><Panel f={f} show /><div className="gl-time" style={{ transform: `scaleX(${left / f.ms})` }} /></>}
        </div>
        <p className="gl-hint">{counting ? 'Eyes on the panel.' : 'Look.'}</p>
        <button type="button" className="pst-tb wide" disabled>Watch</button>
      </div>
    );
  }

  if (s.ph === 'ask') {
    const q = Math.min(s.q || 0, f.asks.length - 1), a = f.asks[q];
    const submit = (y) => setS((st) => {
      if (st.ph !== 'ask' || st.i !== i || (st.q || 0) !== q) return st;
      const all = Array.isArray(st.ans) ? st.ans.slice() : [];
      const mine = (all[i] || []).slice(0, q); mine[q] = y; all[i] = mine;
      if (q + 1 < f.asks.length) return { ...st, ans: all, q: q + 1 };
      return { ...st, ans: all, ph: 'seen', q: 0, t: null };
    });
    const title = a.kind === 'dots' ? (a.red ? 'How many red dots?' : 'How many dots?') : a.kind === 'grid' ? `Tap the ${f.lit.length} lit squares.` : a.kind === 'dial' ? 'What time was on the clock?' : 'Type the string.';
    return (
      <div className="gl" key={`${i}-${q}`}>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {head}
        <h2 className="gl-q2">{title}</h2>
        {f.asks.length > 1 ? <p className="gl-hint" style={{ marginTop: -6 }}>{`Question ${q + 1} of 2`}</p> : null}
        {a.kind === 'grid' ? <GridPad n={f.lit.length} onSubmit={submit} />
          : a.kind === 'dial' ? <DialPad onSubmit={submit} />
            : <NumberPad kind={a.kind} len={f.str.length} onSubmit={submit} />}
      </div>
    );
  }

  // 'seen': the panel comes back with the asked quadrant outlined, and the scores.
  const gq = f.asks.findIndex((a) => a.kind === 'grid');
  const picks = gq >= 0 ? ansOf(s, i)[gq] : null;
  const fp = flashPoints(f, ansOf(s, i));
  return (
    <div className="gl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {head}
      <div className="gl-box"><Panel f={f} show asked={f.asks.map((a) => a.kind)} tags grid={Array.isArray(picks) ? <RevealGrid f={f} picks={picks} /> : null} /></div>
      <div className="gl-list">
        {f.asks.map((a, k) => {
          const y = ansOf(s, i)[k], pts = askPoints(f, a, y);
          return (
            <div className="gl-li" key={k}>
              <div><b>{askTitle(a)}</b><span>{answerLine(f, a, y)}</span><div className="gl-meter"><i style={{ width: `${pts}%` }} /></div></div>
              <div className="gl-pts">{pts}</div>
            </div>
          );
        })}
        {f.asks.length > 1 ? <div className="gl-li"><div><b>{`Flash ${i + 1}`}</b><span>The two answers are averaged</span></div><div className="gl-pts">{fp}</div></div> : null}
      </div>
      <button type="button" className="pst-tb wide on" onClick={() => setS((st) => (st.ph === 'seen' && st.i === i ? { ...st, i: i + 1, ph: 'ready', q: 0, t: null } : st))}>{i + 1 < N ? 'Next flash' : 'See results'}</button>
    </div>
  );
}

const share = (P, s) => P.flashes.map((f, i) => {
  if (!flashDone(P, s, i)) return '⬜';
  const p = flashPoints(f, ansOf(s, i));
  return p >= 80 ? '\u{1F7E9}' : p >= 50 ? '\u{1F7E8}' : '\u{1F7E5}';
}).join('');

const GAME = {
  key: 'glimpse', name: 'Glimpse', cat: 'Visual', miss: null,
  fresh: () => ({ i: 0, q: 0, ph: 'ready', t: null, ans: [] }),
  validSave: (P, s) => Number.isInteger(s.i) && s.i >= 0 && s.i < P.flashes.length && ['ready', 'look', 'ask', 'seen'].includes(s.ph) && Array.isArray(s.ans),
  touched: (s) => !!s.t || (Array.isArray(s.ans) && s.ans.length > 0),
  // The day ends on the last answer of the last flash; its reveal is the finish board.
  solved: (P, s) => P.flashes.every((_, i) => flashDone(P, s, i)),
  count: (s) => (Array.isArray(s.ans) ? s.ans.filter((a) => Array.isArray(a) && a.length).length : 0),
  // Points out of 500 (600 on the Sunday Edition); a give-up keeps the flashes already answered.
  result: (P, s) => ({ score: points(P, s), total: maxPoints(P), correct: doneCount(P, s), guessesUsed: doneCount(P, s) }),
  title: (P, s) => endGrade(points(P, s), maxPoints(P), 'Perfect!'),
  metric: (P, s) => points(P, s),
  Board,
  sundayLabel: () => 'Sunday Edition',
  eyebrow: (P, s, { sundayLabel } = {}) => `No. ${P.num} · ${sundayLabel || BANDS[P.band].label} · Flash ${Math.min((s.i || 0) + 1, P.flashes.length)} of ${P.flashes.length}`,
  foot: (P, s) => `${points(P, s).toLocaleString('en-US')} of ${maxPoints(P)} points · every flash scores up to 100`,
  frac: (P, s) => doneCount(P, s) / P.flashes.length,
  gateTitle: (P) => (P.sunday ? 'Today\'s Glimpse: the Sunday Edition' : `Today's Glimpse: ${BANDS[P.band].label}`),
  gateLine: (P) => `${P.flashes.length === 6 ? 'Six' : 'Five'} flashes of a panel with dots, a grid, a clock and a string, each gone in a second or two. Then one question about one part of it. You get one look at each.`,
  rules: (P) => ({
    lead: 'One look, then one question.',
    banner: 'Everyone sees the same flashes today.',
    steps: [
      <>Press <b>Show me</b>. After a 3, 2, 1 the panel appears for <b>{secs(P.flashes[0].ms)} seconds</b> or less: a cloud of <b>dots</b>, a <b>grid</b> with some squares lit, a <b>clock</b> and a <b>string</b> of letters and digits.</>,
      <>Then it is gone and you are asked about <b>one</b> part: how many dots (or how many red ones), which squares were lit, what time it was, or the string. You do not know which until it disappears.</>,
      <>Every answer scores up to <b>100</b> on how close it was. The panel comes back after each flash so you can see what you missed.</>,
      <>Flashes get faster: 2.5 seconds for the first two, 2 for the next two, 1.5 for the fifth, which asks two questions.{P.sunday ? <> The Sunday Edition adds a sixth flash at 1.25 seconds.</> : null}</>,
    ],
    knack: 'Do not try to count the dots. Take a fast impression of the whole panel: the shape of the lit squares, where the hands point, the first and last characters. Estimates beat half-finished counts.',
    footer: 'Scored on points, then the clock. The panel fills up through the week: Gentle on Monday and Tuesday, Moderate midweek, Tough on Friday and Saturday, and the Sunday Edition with a sixth flash.',
  }),
  pitch: () => 'A panel flashes for two seconds. Then one question about it.',
  shareLine: (P, s, won, el) => `Glimpse #${P.num} · ${points(P, s).toLocaleString('en-US')} points · ${el}\n${share(P, s)}`,
  detail: (P, s, won, el) => `${points(P, s).toLocaleString('en-US')} of ${maxPoints(P)} points · ${BANDS[P.band].label} · ${el}`,
  aboutTitle: 'About Glimpse',
  about: [
    'Glimpse is a free daily memory game from Mind Loft built on one idea: you get one look. A square panel flashes for about two seconds with four things on it: a cloud of dots, a grid with some squares lit, a clock face and a short string of letters and digits. Then it disappears, and you are asked about just one of them.',
    'Because you never know which part comes up, you cannot fix on one corner. You learn to take in the whole panel at once, the way you glance at a dashboard. Each answer scores up to 100 on how close it was: a dot estimate 10% off still scores 75, a clock five minutes off scores 90, and every character of the string in its right place counts.',
    'Each part is a classic test of visual memory and number sense: estimating a quantity at a glance, recalling a pattern of lit squares, reading a clock face from a glimpse and holding a string of characters in mind. Five flashes a day, six on the Sunday Edition, getting faster as they go. The panel fills up through the week, and everyone sees the same flashes, so the daily leaderboard ranks points first and then the clock.',
  ],
};

export default function GlimpseClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
