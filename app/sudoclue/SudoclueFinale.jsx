'use client';

// SUDOCLUE'S CASE-CLOSED FINALE (owner, 2026-10-31: "Mock up a run-like ending animation and scoring
// process for Sudoclue" ... "Looks great. Implement."). Played once, full screen, on a fresh finish,
// before the daily ending takes over. Four beats, about ten seconds, any tap or key skips to the hand-off:
//   1. WHO DID IT. The solved board; everything dims but the victim's room, a red thread draws from the
//      killer to the victim, and Victim / Killer / Accomplice tags land.
//   2. THE RECAP RING. One arc per leg of the case points (Place, Accuse, Clean record), each sized by
//      what it can score; the ground takes each leg's colour and the total counts up dead centre. A wrong
//      check shows as a red tick on Clean record.
//   3. THE CASE FILE. A manila folder climbs the detective ranks rung by rung to the one earned, then a
//      CLOSED stamp (COLD CASE on a give-up) slams down.
//   4. THE GLIDE. The points and the title rise and shrink to the top of the screen as the ground clears,
//      and the client marks an end hold so the daily ending opens straight on its iris and verdict.
// Reduced motion skips straight to the hand-off. Colours are the Logic rose pastels, fixed, like the
// full-colour ending that follows.

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const LEG_COL = { Place: '#7dd3fc', Accuse: '#fb7185', 'Clean record': '#fcd34d' };
const LEG_GROUND = { Place: '#e0f4fe', Accuse: '#ffe0e6', 'Clean record': '#fff4cc' };
const ROSE_GROUND = '#ffe4e8';

export default function SudoclueFinale({ boardSvg, N, sol, colors, face, pts, cold, roomName, caseLine, ladder, rankAt, font, onDone }) {
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef(null);
  const doneRef = useRef(false);
  useEffect(() => { setMounted(true); }, []);

  const W = typeof window !== 'undefined' ? window.innerWidth : 390;
  const H = typeof window !== 'undefined' ? window.innerHeight : 780;
  const phone = W < 700;
  const bw = Math.round(Math.max(240, Math.min(W - 40, H - 230, 520)));
  const ringD = Math.round(Math.max(230, Math.min(W - 120, H - 260, 400)));
  const fw = Math.round(Math.min(W - 32, 520));
  const killer = Object.keys(sol.roles).find((p) => sol.roles[p] === 'Killer');
  const victim = Object.keys(sol.roles).find((p) => sol.roles[p] === 'Victim');
  const acc = Object.keys(sol.roles).find((p) => sol.roles[p] === 'Accomplice');

  useEffect(() => {
    if (!mounted) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const $ = (s) => root.querySelector(s);
    const timers = [];
    let raf = 0;
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
    let title = null;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      timers.forEach(clearTimeout); cancelAnimationFrame(raf);
      onDone(title || ladder[rankAt()].t);
    };
    // 4. THE GLIDE: points and title rise to where the ending's verdict will sit, the ground clears.
    const glide = () => {
      if (root.dataset.glide) return;
      root.dataset.glide = '1';
      timers.forEach(clearTimeout); cancelAnimationFrame(raf);
      const idx = rankAt(); title = ladder[idx].t;
      const tot = $('.scf-tot'); if (tot) tot.textContent = pts.total;
      const fly = $('.scf-fly');
      fly.querySelector('.scf-fly-t').textContent = title;
      ['.scf-a1', '.scf-a2', '.scf-a3'].forEach((s) => $(s).classList.remove('on'));
      fly.classList.add('on');
      requestAnimationFrame(() => requestAnimationFrame(() => { fly.classList.add('up'); root.classList.add('clear'); }));
      setTimeout(finish, 900);
    };
    if (reduce) { title = ladder[rankAt()].t; finish(); return undefined; }
    const skip = () => glide();
    root.addEventListener('click', skip);
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); glide(); } };
    window.addEventListener('keydown', onKey);

    // 1. WHO DID IT
    const a1 = $('.scf-a1'), a2 = $('.scf-a2'), a3 = $('.scf-a3'), ground = $('.scf-ground');
    const cxy = (p) => { const [r, c] = sol.place[p]; return [c * 100 + 50, r * 100 + 50]; };
    at(120, () => a1.classList.add('on'));
    at(650, () => { const d = $('.scf-dim'); if (d) d.setAttribute('opacity', '.55'); });
    at(1050, () => {
      $('.scf-tag-v').classList.add('on');
      const [kx, ky] = cxy(killer), [vx, vy] = cxy(victim);
      const th = $('.scf-thread');
      th.setAttribute('d', `M${kx} ${ky}Q${(kx + vx) / 2 + 40} ${(ky + vy) / 2 - 10} ${vx} ${vy}`);
      try {
        const L = th.getTotalLength();
        th.style.strokeDasharray = `${L}`; th.style.strokeDashoffset = `${L}`; th.getBoundingClientRect();
        th.style.transition = 'stroke-dashoffset .7s ease-out'; th.style.strokeDashoffset = '0';
      } catch (e) {}
    });
    at(1650, () => $('.scf-tag-k').classList.add('on'));
    if (acc) at(2200, () => { $('.scf-acc').setAttribute('opacity', '1'); $('.scf-tag-a').classList.add('on'); });
    // 2. THE RECAP RING
    at(3350, () => { a1.classList.remove('on'); a2.classList.add('on'); });
    let running = 0;
    const countTo = (from, to, ms) => {
      const n = $('.scf-tot'); const t0 = performance.now();
      cancelAnimationFrame(raf);
      const step = (t) => { const k = Math.min(1, (t - t0) / ms); n.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    pts.legs.forEach((g, i) => at(3650 + i * 750, () => {
      ground.style.background = LEG_GROUND[g.k];
      const arc = root.querySelector(`.scf-arc[data-i="${i}"]`);
      if (arc) { arc.style.transition = 'stroke-dashoffset .65s cubic-bezier(.3,.8,.3,1)'; arc.style.strokeDashoffset = '0'; }
      const chip = root.querySelector(`.scf-chip[data-i="${i}"]`); if (chip) chip.classList.add('on');
      if (g.k === 'Clean record') at(450, () => root.querySelectorAll('.scf-miss').forEach((m) => m.setAttribute('opacity', '1')));
      countTo(running, running + g.v, 600); running += g.v;
    }));
    // 3. THE CASE FILE: climb the ranks, then stamp
    at(6150, () => { ground.style.background = ROSE_GROUND; a2.classList.remove('on'); a3.classList.add('on'); at(80, () => $('.scf-folder').classList.add('on')); });
    at(6800, () => {
      const idx = rankAt(); title = ladder[idx].t;
      const rs = [...root.querySelectorAll('.scf-rung')];
      for (let i = 0; i <= idx; i++) at(i * 260, () => rs.forEach((r) => { const k = +r.dataset.i; r.classList.toggle('passed', k < i); r.classList.toggle('here', k === i); }));
      at((idx + 1) * 260 + 250, () => { $('.scf-stamp').classList.add('on'); });
      at((idx + 1) * 260 + 1550, glide);
    });
    return () => {
      timers.forEach(clearTimeout); cancelAnimationFrame(raf);
      root.removeEventListener('click', skip); window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  // the ring's geometry
  const R = ringD / 2 - 22, C = ringD / 2, gapDeg = 6;
  const pt = (a, r = R) => [C + r * Math.cos(a * Math.PI / 180), C + r * Math.sin(a * Math.PI / 180)];
  const arcPath = (from, to) => { const [x0, y0] = pt(from), [x1, y1] = pt(to); return `M${x0} ${y0}A${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  let ang = -90;
  const ring = pts.legs.map((g, i) => {
    const span = 360 * g.max / pts.max - gapDeg, a0 = ang + gapDeg / 2, a1 = a0 + span;
    ang += 360 * g.max / pts.max;
    const fillTo = a0 + span * (g.max ? g.v / g.max : 0);
    const misses = g.k === 'Clean record' ? Array.from({ length: Math.min(pts.wrong, 3) }, (_, w) => { const a = a1 - (w + 0.5) * span / 4; const [x0, y0] = pt(a, R - 17), [x1, y1] = pt(a, R + 17); return `M${x0} ${y0}L${x1} ${y1}`; }) : [];
    const [cx, cy] = pt((a0 + a1) / 2, R + (phone ? 42 : 52));
    return { g, i, track: arcPath(a0, a1), fill: g.v > 0 ? arcPath(a0, Math.max(a0 + 0.5, fillTo)) : null, misses, cx, cy };
  });
  const cell = (p) => { const [r, c] = sol.place[p]; return [(c * 100 + 50) * bw / (N * 100), (r * 100 + 50) * bw / (N * 100)]; };
  const tagAt = (p, label, dy) => { const [x, y] = cell(p); const half = (label.length * 7.4 + 18) / 2; return { left: Math.max(half + 4, Math.min(bw - half - 4, x)), top: y + dy }; };
  const vr = sol.place[victim] || [0, 0];
  // the victim's room, for the spotlight
  const holeRects = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (roomName.grid[r][c] === roomName.grid[vr[0]][vr[1]]) holeRects.push([r, c]);

  return createPortal(
    <div ref={rootRef} className="scf" role="dialog" aria-label="Case closed" style={{ fontFamily: font }}>
      <div className="scf-ground" />
      <div className="scf-act scf-a1">
        <div className="scf-cap">{cold ? 'Case gone cold' : 'Case closed'}</div>
        <div className="scf-capbig">{cold ? `It was ${killer}, ${roomName.at}.` : `${killer} did it, ${roomName.at}.`}</div>
        <div className="scf-board" style={{ width: bw }}>
          <div dangerouslySetInnerHTML={{ __html: boardSvg }} />
          <svg className="scf-over" viewBox={`0 0 ${N * 100} ${N * 100}`} aria-hidden="true">
            <defs><mask id="scf-hole"><rect width={N * 100} height={N * 100} fill="#fff" />{holeRects.map(([r, c]) => <rect key={`${r},${c}`} x={c * 100 - 1} y={r * 100 - 1} width="102" height="102" fill="#000" />)}</mask></defs>
            <rect className="scf-dim" width={N * 100} height={N * 100} fill="#0b0d12" opacity="0" mask="url(#scf-hole)" style={{ transition: 'opacity .5s' }} />
            <path className="scf-thread" d="" fill="none" stroke="#e11d48" strokeWidth="9" strokeLinecap="round" />
            {acc && <circle className="scf-acc" cx={sol.place[acc][1] * 100 + 50} cy={sol.place[acc][0] * 100 + 50} r="40" fill="none" stroke="#fcd34d" strokeWidth="8" opacity="0" style={{ transition: 'opacity .3s' }} />}
          </svg>
          <div className="scf-tag scf-tag-v" style={tagAt(victim, `Victim · ${victim}`, phone ? -46 : -58)}>Victim · {victim}</div>
          <div className="scf-tag scf-tag-k" style={tagAt(killer, `Killer · ${killer}`, phone ? 26 : 34)}>Killer · {killer}</div>
          {acc && <div className="scf-tag scf-tag-a" style={tagAt(acc, `Accomplice · ${acc}`, phone ? -46 : -58)}>Accomplice · {acc}</div>}
        </div>
      </div>
      <div className="scf-act scf-a2">
        <div style={{ position: 'relative', width: ringD, height: ringD }}>
          <svg viewBox={`0 0 ${ringD} ${ringD}`} width={ringD} height={ringD} aria-hidden="true">
            {ring.map((a) => <path key={`t${a.i}`} d={a.track} stroke="rgba(31,34,41,.09)" strokeWidth="26" fill="none" strokeLinecap="round" />)}
            {ring.map((a) => a.fill && <path key={`f${a.i}`} className="scf-arc" data-i={a.i} d={a.fill} stroke={LEG_COL[a.g.k]} strokeWidth="26" fill="none" strokeLinecap="round" pathLength="1" style={{ strokeDasharray: '1 1', strokeDashoffset: 1 }} />)}
            {ring.flatMap((a) => a.misses.map((d, j) => <path key={`m${a.i}${j}`} className="scf-miss" d={d} stroke="#e11d48" strokeWidth="5" strokeLinecap="round" opacity="0" />))}
          </svg>
          <div className="scf-total">
            <div className="scf-tot" style={{ fontSize: phone ? 70 : 92 }}>0</div>
            <div className="scf-unit">case points</div>
          </div>
          {ring.map((a) => (
            <div key={`c${a.i}`} className="scf-chip" data-i={a.i} style={{ left: a.cx, top: a.cy }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: LEG_COL[a.g.k], marginRight: 6 }} />{a.g.k}<small>+{a.g.v}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="scf-act scf-a3">
        <div className="scf-folder" style={{ width: fw }}>
          <div className="scf-paper">
            <div className="scf-caseline">{caseLine}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 6px' }}>
              <span className="scf-face" style={{ boxShadow: `0 0 0 3px #fff,0 0 0 6px ${colors[killer] || '#be123c'}` }} dangerouslySetInnerHTML={{ __html: face(killer) }} />
              <div style={{ fontWeight: 800, fontSize: phone ? 14 : 16, lineHeight: 1.25 }}>
                {cold ? 'Unsolved. ' : ''}{killer} killed {victim} {roomName.at}.
                {acc && <><br /><span style={{ fontWeight: 700, color: '#7c4a14' }}>{acc} helped.</span></>}
              </div>
            </div>
            {ladder.map((r, i) => ({ r, i })).reverse().map(({ r, i }) => (
              <div key={r.t} className="scf-rung" data-i={i}><span>{r.t}</span><small>{r.note}</small></div>
            ))}
          </div>
          <div className={`scf-stamp${cold ? ' cold' : ''}`}>{cold ? 'COLD CASE' : 'CLOSED'}</div>
        </div>
      </div>
      <div className="scf-fly" aria-live="polite">
        <div className="scf-fly-n">{pts.total}</div>
        <div className="scf-fly-u">case points</div>
        <div className="scf-fly-t" />
      </div>
      <div className="scf-skip">Tap to skip</div>
      <style>{CSS}</style>
    </div>,
    document.body,
  );
}

const CSS = `
.scf{position:fixed;inset:0;z-index:2147483000;color:#1f2229;overflow:hidden;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;transition:opacity .7s ease}
.scf.clear{opacity:0}
.scf-ground{position:absolute;inset:0;background:${ROSE_GROUND};transition:background .5s ease}
.scf-act{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .45s ease;padding:16px}
.scf-act.on{opacity:1}
.scf-cap{font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:14px;color:#9f1239;text-align:center}
.scf-capbig{font-weight:800;font-size:clamp(21px,4.6vw,30px);text-align:center;margin:2px 8px 14px;text-wrap:balance;line-height:1.2}
.scf-board{position:relative;border-radius:12px;overflow:visible;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.scf-board>div:first-child{border-radius:12px;overflow:hidden}
.scf-board svg{display:block;width:100%;height:auto}
.scf-over{position:absolute;inset:0;border-radius:12px}
.scf-tag{position:absolute;transform:translate(-50%,0);font-weight:800;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:4px 9px;border-radius:999px;white-space:nowrap;opacity:0;transition:opacity .3s}
.scf-tag.on{opacity:1}
.scf-tag-v{background:#1f2229;color:#fff}
.scf-tag-k{background:#e11d48;color:#fff}
.scf-tag-a{background:#fcd34d;color:#3b2a00}
.scf-total{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}
.scf-tot{font-weight:800;font-variant-numeric:tabular-nums;line-height:1;min-width:4ch;text-align:center}
.scf-unit{font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9f1239;font-size:13px}
.scf-chip{position:absolute;transform:translate(-50%,-50%);font-weight:800;font-size:12.5px;padding:6px 11px;border-radius:999px;background:#fff;box-shadow:0 3px 10px rgba(0,0,0,.12);white-space:nowrap;opacity:0;transition:opacity .35s}
.scf-chip.on{opacity:1}
.scf-chip small{font-weight:700;color:#6b6470;margin-left:4px;font-variant-numeric:tabular-nums;font-size:12px}
.scf-folder{position:relative;background:#f5d9a8;border-radius:6px 14px 14px 14px;box-shadow:0 14px 34px rgba(80,40,0,.28);padding:14px;transform:translateY(60px) rotate(-2deg);opacity:0;transition:transform .6s cubic-bezier(.2,1.2,.3,1),opacity .4s}
.scf-folder.on{transform:none;opacity:1}
.scf-folder::before{content:"";position:absolute;left:0;top:-18px;width:38%;height:22px;background:#f5d9a8;border-radius:8px 8px 0 0}
.scf-paper{background:#fffdf7;border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,.12);padding:16px 18px;display:flex;flex-direction:column;gap:7px}
.scf-caseline{font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#7c4a14;font-size:12px;line-height:1.35}
.scf-face{display:inline-block;flex:none;width:40px;height:40px;border-radius:50%;overflow:hidden}
.scf-rung{display:flex;align-items:center;justify-content:space-between;border-radius:999px;padding:0 14px;height:38px;font-weight:800;font-size:14.5px;color:#a08a6a;background:#f3ead8;transition:background .25s,color .25s,transform .25s}
.scf-rung.passed{background:#fde2b8;color:#7c4a14}
.scf-rung.here{background:#be123c;color:#fff;transform:scale(1.04)}
.scf-rung small{font-weight:700;font-variant-numeric:tabular-nums;opacity:.85;font-size:12px}
.scf-stamp{position:absolute;right:26px;bottom:28px;border:5px solid #be123c;color:#be123c;font-weight:800;letter-spacing:.12em;border-radius:10px;padding:4px 14px;font-size:clamp(26px,6vw,38px);transform:rotate(-12deg) scale(2.6);opacity:0;transition:transform .28s cubic-bezier(.3,1.6,.5,1),opacity .2s;mix-blend-mode:multiply}
.scf-stamp.on{transform:rotate(-12deg) scale(1);opacity:.92}
.scf-stamp.cold{border-color:#475569;color:#475569}
.scf-fly{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;opacity:0;transition:transform .8s cubic-bezier(.5,0,.15,1),opacity .4s}
.scf-fly.on{opacity:1}
.scf-fly.up{transform:translate(-50%,calc(-50% - 30vh)) scale(.62)}
.scf-fly-n{font-weight:800;font-size:clamp(64px,14vw,92px);line-height:1;font-variant-numeric:tabular-nums}
.scf-fly-u{font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#9f1239;font-size:13px}
.scf-fly-t{font-weight:800;font-size:clamp(26px,6vw,38px);color:#be123c;margin-top:6px}
.scf-skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));font-weight:700;font-size:11.5px;color:#9f1239;opacity:.75}
.scf[data-glide] .scf-skip{opacity:0}
@media (prefers-reduced-motion: reduce){.scf *{transition:none!important}}
`;
