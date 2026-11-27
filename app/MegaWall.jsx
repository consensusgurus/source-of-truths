'use client';

// THE CLOSING SCREEN of Colossus and Mammoth (owner, 2026-11-22: picked "Update
// ticker, closing screen" from the community ideas, approved the mockup and
// said "Implement"). One full pastel screen in the manner of the Mural wall
// (app/mural/memorial.js): the Sudoku pastel on the light looks, the near-black
// stage on the dark ones, dark ink, Manrope.
//
//   - Headline: "61 Sudokus. 34 Solvers. 31 Hours."
//   - The board fills in the order the site first cracked each sudoku, each in
//     its first solver's colour. Tap the board to skip; Watch It Fall replays.
//     First Solver / How Many / Yours switch what the board shows.
//   - Who Solved It: one block a player sized by sudokus solved, EVERY GUEST A
//     BLOCK OF THEIR OWN (owner on Mural, 2026-11-20: never one guest bucket),
//     the reader's block outlined. Hover or tap a block for its details (owner
//     on Mural, 2026-11-19: names cannot be read on small squares); a tap also
//     lights up only that player's sudokus.
//   - Your Part, Top Points (six), By Country (owner on Mural, 2026-11-22).
//
// It opens by itself once a board is over and is the first thing shown on a
// return to a closed board (?b=, ?p=). Replay This Board closes it onto the
// board, which is then played for fun. Its data is /api/mega?wall=1, served
// for a CLOSED board only: while a board is open, who solved which sudoku
// stays hidden (owner, 2026-11-21).

import { useEffect, useMemo, useRef, useState } from 'react';
import { MEGA_HUES } from './mega-hues';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const TREE_MAX = 120;

// One block a player: halve the list by weight, split the longer side, repeat.
function treemap(items, x, y, w, h, out) {
  if (!items.length) return;
  if (items.length === 1) { out.push({ it: items[0], x, y, w, h }); return; }
  const tot = items.reduce((t, s) => t + s.w, 0);
  let acc = 0, i = 0;
  while (i < items.length - 1 && acc + items[i].w <= tot / 2) { acc += items[i].w; i++; }
  if (!i) { acc = items[0].w; i = 1; }
  const f = acc / tot;
  if (w * 1.6 >= h) { treemap(items.slice(0, i), x, y, w * f, h, out); treemap(items.slice(i), x + w * f, y, w * (1 - f), h, out); }
  else { treemap(items.slice(0, i), x, y, w, h * f, out); treemap(items.slice(i), x, y + h * f, w, h * (1 - f), out); }
}

export default function MegaWall({ game, name, G, board, win, crowd, me, theme, isCurrent, past = [], onClose }) {
  const dark = theme === 'dark';
  const SUD = G.grids.length;
  const [wall, setWall] = useState(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState('first'); // 'first' | 'heat' | 'mine'
  const [pick, setPick] = useState(null);    // a player index, or null
  const [hover, setHover] = useState(null);
  const [shown, setShown] = useState(0);
  const cvRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`/api/mega?game=${game}&board=${board.num}&wall=1`);
        const d = await r.json();
        if (dead) return;
        if (d && Array.isArray(d.players) && Array.isArray(d.solvers)) setWall(d); else setFailed(true);
      } catch (e) { if (!dead) setFailed(true); }
    })();
    const key = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    return () => { dead = true; window.removeEventListener('keydown', key); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, board.num]);

  const colorOf = (k) => `hsl(${Math.round((k * 137.5) % 360)} ${dark ? '38% 36%' : '62% 80%'})`;
  const meIx = useMemo(() => (wall ? wall.players.findIndex((p) => p.id === me) : -1), [wall, me]);
  const order = wall ? wall.order : [];
  const total = order.length;

  // The fall: sudokus appear in the order the site first cracked them.
  function play() {
    if (timer.current) clearInterval(timer.current);
    setPick(null); setShown(0);
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce) { setShown(total); return; }
    const step = Math.max(1, Math.ceil(total / 70));
    let n = 0;
    timer.current = setInterval(() => { n = Math.min(total, n + step); setShown(n); if (n >= total) clearInterval(timer.current); }, 45);
  }
  const skip = () => { if (timer.current) clearInterval(timer.current); setShown(total); };
  useEffect(() => { if (wall) play(); return () => { if (timer.current) clearInterval(timer.current); }; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [wall]);

  // The board, one rectangle a sudoku.
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv || !wall) return undefined;
    const paint = () => {
      const w = cv.clientWidth; if (!w) return;
      const dpr = Math.min(2.5, window.devicePixelRatio || 1), m = w / G.W, h = Math.round(G.H * m), N = G.N;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = `${h}px`; }
      const c = cv.getContext('2d');
      const ink = dark ? '#e9edf4' : '#0b0d12', card = dark ? '#0e131f' : '#ffffff', blank = dark ? '#1a1d28' : '#eef1f6';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = card; c.fillRect(0, 0, w, h);
      const rank = new Map(order.map((g, i) => [g, i]));
      let max = 1; for (const s of wall.solvers) if (s.length > max) max = s.length;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      // unsolved first, then the solved ones in the order they fell
      const seq = G.pos.map((p, g) => g).sort((a, b) => (rank.has(a) ? rank.get(a) : -1) - (rank.has(b) ? rank.get(b) : -1));
      for (const g of seq) {
        const [gr, gc] = G.pos[g], so = wall.solvers[g] || [], x = gc * m, y = gr * m, s = N * m;
        const on = rank.has(g) && rank.get(g) < shown;
        let f = blank;
        if (on) {
          if (pick != null) f = so.includes(pick) ? colorOf(pick) : blank;
          else if (view === 'first') f = colorOf(so[0]);
          else if (view === 'heat') f = `rgba(${dark ? '165,180,252' : '57,73,171'},${(0.14 + 0.86 * so.length / max).toFixed(2)})`;
          else f = meIx >= 0 && so.includes(meIx) ? MEGA_HUES[dark ? 'dark' : 'light'][G.hues[g]].deep : blank;
        }
        c.fillStyle = card; c.fillRect(x, y, s, s);
        c.fillStyle = f; c.fillRect(x, y, s, s);
        c.strokeStyle = ink; c.lineWidth = 1; c.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, s - 1, s - 1);
        if (on && view === 'heat' && pick == null && s > 24) {
          c.fillStyle = so.length / max > 0.55 ? (dark ? '#0b0d12' : '#ffffff') : ink;
          c.font = `800 ${Math.min(13, s * 0.32)}px ${SANS}`; c.fillText(so.length, x + s / 2, y + s / 2 + 0.5);
        }
      }
    };
    paint();
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wall, view, pick, shown, dark, meIx]);

  const blocks = useMemo(() => {
    if (!wall) return [];
    const list = wall.players.map((p, k) => ({ k, w: Math.max(1, p.t) })).sort((a, b) => b.w - a.w);
    const head = list.slice(0, TREE_MAX), rest = list.slice(TREE_MAX);
    if (rest.length) head.push({ k: -1, w: rest.reduce((t, s) => t + s.w, 0), n: rest.length });
    const out = []; treemap(head, 0, 0, 100, 100, out);
    return out;
  }, [wall]);

  let regionName = (c) => c;
  try { const dn = new Intl.DisplayNames(['en'], { type: 'region' }); regionName = (c) => { try { return dn.of(c) || c; } catch (e) { return c; } }; } catch (e) { /* old browser: the code */ }
  const countries = useMemo(() => {
    if (!wall) return [];
    const m = new Map();
    for (const p of wall.players) if (p.c) m.set(p.c, (m.get(p.c) || 0) + p.t);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [wall]);

  const hours = win && win.closes && win.opens ? Math.max(1, Math.round((win.closes - win.opens) / 3600000)) : null;
  const solvers = wall ? wall.players.length : crowd ? crowd.players : 0;
  const cracked = wall ? wall.crowdSolved : crowd ? crowd.crowdSolved : SUD;
  const mine = meIx >= 0 ? wall.players[meIx] : null;
  const detail = hover != null ? hover : pick;
  const dp = detail != null && detail >= 0 && wall ? wall.players[detail] : null;
  const nameOf = (k) => (k === meIx ? 'You' : wall.players[k].n);

  const css = `
.mgw{position:fixed;inset:0;z-index:960;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:${dark ? '#0b0f1a' : '#c9d2fd'};color:var(--ink);font-family:${SANS};animation:mgwIn .35s ease-out}
@keyframes mgwIn{from{opacity:0}to{opacity:1}}
.mgw *{box-sizing:border-box}
.mgw .in{max-width:1000px;margin:0 auto;padding:14px 16px 30px}
.mgw .wtop{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.mgw .wtop b{font:800 15px/1.4 ${SANS}}
.mgw .wtop span{display:flex;gap:6px}
.mgw h2{font:800 clamp(24px,6.2vw,46px)/1.15 ${SANS};margin:16px 0 4px;letter-spacing:-.01em}
.mgw .sub{font:600 13.5px/1.5 ${SANS};margin:0 0 14px;opacity:.82}
.mgw .wgrid{display:grid;grid-template-columns:1.15fr 1fr;gap:18px;align-items:start}
.mgw .stack{display:grid;gap:18px;min-width:0}
.mgw .wcard{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.mgw .wcard h3{margin:0;padding:10px 14px;font:800 14px/1.4 ${SANS};border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:8px}
.mgw .pad2{padding:12px 14px}
.mgw canvas{display:block;width:100%;cursor:pointer}
.mgw .tree{position:relative;height:220px}
.mgw .tree button{position:absolute;border:1px solid var(--line);border-radius:0;margin:0;overflow:hidden;font:800 11.5px/1.3 ${SANS};padding:3px 5px;color:var(--ink);cursor:pointer;white-space:nowrap;text-overflow:ellipsis;text-align:left;display:block}
.mgw .tree button small{display:block;font:600 10.5px/1.3 ${SANS}}
.mgw .tree button.me{box-shadow:inset 0 0 0 2px var(--line)}
.mgw .tree button.off{opacity:.35}
.mgw .tdet{font:600 12.5px/1.5 ${SANS};color:var(--mute);margin-top:8px;min-height:19px}
.mgw .tdet b{color:var(--ink);font-weight:800}
.mgw .kv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center}
.mgw .kv b{display:block;font:800 22px/1.25 ${SANS};font-variant-numeric:tabular-nums}
.mgw .kv span{font:700 11.5px/1.4 ${SANS};color:var(--mute)}
.mgw .rows{font:600 13px/1.5 ${SANS}}
.mgw .rows div{display:grid;grid-template-columns:24px 1fr auto;gap:8px;padding:4px 0;border-bottom:1px solid var(--soft)}
.mgw .rows div:last-child{border-bottom:0}
.mgw .rows .me{font-weight:800}
.mgw .rows span:nth-child(2){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mgw .cty div{grid-template-columns:minmax(80px,38%) 1fr 40px;align-items:center}
.mgw .cty i{display:block;height:10px;border:1px solid var(--line);border-radius:5px;background:${dark ? '#3949ab' : '#c9d2fd'}}
.mgw .wbtn{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.mgw .wbtn > *{flex:1;min-width:200px;text-align:center;border:1px solid var(--line);border-radius:12px;padding:11px 12px;font:800 14px/1.4 ${SANS};cursor:pointer;text-decoration:none;color:var(--ink);background:var(--card)}
.mgw .wbtn .pri{background:var(--ink);color:var(--page)}
.mgw .note{font:700 12.5px/1.5 ${SANS};margin:12px 0 0;opacity:.82}
.mgw .note a{color:inherit;font-weight:800}
@media (max-width:760px){.mgw .wgrid{grid-template-columns:1fr}.mgw .in{padding:10px 10px 26px}.mgw .wtop b{font-size:14px}}
`;

  return (
    <div className="mgw" role="dialog" aria-label={`${name} No. ${board.num}: closing screen`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="in">
        <div className="wtop">
          <b>{name} · No. {board.num}</b>
          <span>
            {wall ? <button className="pill" onClick={play}>Watch It Fall</button> : null}
            <button className="pill" onClick={onClose}>Show Board</button>
          </span>
        </div>
        <h2>{fmt(SUD)} Sudokus. {fmt(solvers)} {solvers === 1 ? 'Solver' : 'Solvers'}.{hours ? ` ${fmt(hours)} Hours.` : ''}</h2>
        <p className="sub">{cracked >= SUD ? 'Every sudoku fell.' : `${fmt(cracked)} of the ${fmt(SUD)} sudokus fell before the board closed.`} The board fills in the order the site first cracked each one, in the color of whoever got there first.</p>
        {!wall ? (
          <div className="wcard"><div className="pad2">
            {failed && crowd ? (
              <div className="rows">{crowd.standings.slice(0, 10).map((x) => <div key={x.id} className={x.id === me ? 'me' : ''}><span>{x.place}</span><span>{x.name}</span><span>{fmt(x.points)}</span></div>)}</div>
            ) : <p className="note" style={{ margin: 0 }}>{failed ? 'The closing screen could not load. Try again in a moment.' : 'Loading the closing screen...'}</p>}
          </div></div>
        ) : (
          <div className="wgrid">
            <div className="stack">
              <div className="wcard">
                <h3><span>Board</span>
                  <span className="seg" role="group" aria-label="What the board shows">
                    {[['first', 'First Solver'], ['heat', 'How Many'], ['mine', 'Yours']].map(([v, l]) => (
                      <button key={v} className={view === v && pick == null ? 'on' : ''} onClick={() => { setView(v); setPick(null); skip(); }}>{l}</button>
                    ))}
                  </span>
                </h3>
                <canvas ref={cvRef} onClick={skip} aria-label="The board, one square a sudoku" />
              </div>
              <div className="wcard">
                <h3>Who Solved It</h3>
                <div className="pad2">
                  <div className="tree">
                    {blocks.map(({ it, x, y, w, h }) => {
                      const big = w > 13 && h > 15;
                      if (it.k < 0) return <button key="rest" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: 'var(--soft)', cursor: 'default' }}>{big ? <>{fmt(it.n)} More</> : null}</button>;
                      const p = wall.players[it.k];
                      return (
                        <button key={it.k} className={(it.k === meIx ? 'me' : '') + (pick != null && pick !== it.k ? ' off' : '')}
                          style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, background: colorOf(it.k) }}
                          title={`${nameOf(it.k)}: ${p.t} solved`}
                          onPointerEnter={() => setHover(it.k)} onPointerLeave={() => setHover(null)}
                          onClick={() => { setPick(pick === it.k ? null : it.k); skip(); }}>
                          {big ? <>{nameOf(it.k)}<small>{fmt(p.t)}</small></> : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className="tdet">
                    {dp ? <><b>{nameOf(detail)}</b> · {fmt(dp.t)} Solved · {fmt(dp.f)} First · {fmt(dp.p)} Points{dp.c ? ` · ${regionName(dp.c)}` : ''}</> : <>Tap a block to light up that player&apos;s sudokus.</>}
                  </div>
                </div>
              </div>
            </div>
            <div className="stack">
              <div className="wcard">
                <h3>Your Part</h3>
                <div className="pad2">
                  {mine ? (
                    <div className="kv">
                      <div><b>{fmt(mine.t)}</b><span>Solved</span></div>
                      <div><b>{fmt(mine.f)}</b><span>First</span></div>
                      <div><b>{fmt(mine.p)}</b><span>Points</span></div>
                      <div><b>{fmt(mine.pl)}</b><span>Place Of {fmt(wall.players.length)}</span></div>
                    </div>
                  ) : <p className="note" style={{ margin: 0 }}>You did not solve a sudoku on this board before it closed.</p>}
                </div>
              </div>
              <div className="wcard">
                <h3>Top Points</h3>
                <div className="pad2 rows">
                  {wall.players.slice(0, 6).map((p, k) => <div key={p.id} className={k === meIx ? 'me' : ''}><span>{p.pl}</span><span>{nameOf(k)}</span><span>{fmt(p.p)}</span></div>)}
                </div>
              </div>
              {countries.length > 0 && (
                <div className="wcard">
                  <h3>By Country</h3>
                  <div className="pad2 rows cty">
                    {countries.map(([c, v]) => <div key={c}><span>{regionName(c)}</span><i style={{ width: `${Math.max(6, Math.round(100 * v / countries[0][1]))}%` }} /><span style={{ textAlign: 'right' }}>{fmt(v)}</span></div>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="wbtn">
          {!isCurrent ? <a className="pri" href={`/${game}`}>Play The Open Board</a> : null}
          <button className={isCurrent ? 'pri' : ''} onClick={onClose}>Replay This Board</button>
        </div>
        {past.length > 0 && <p className="note">Other boards: {past.slice(0, 12).map((b, k) => <span key={b.num}>{k ? ', ' : ''}<a href={`/${game}?b=${b.num}`}>No. {b.num}</a></span>)}</p>}
      </div>
    </div>
  );
}
