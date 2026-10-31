'use client';

// THE RUN FINALE (owner, 2026-10-31: "a single screen, centered, more elaborate
// animation view of the run conclusions ... then that final standing moves to
// where it is now on top left", approved on the "Run Ending Mockups" page).
//
// One full-screen, centred sequence in two parts, played once over a freshly
// finished run, then handed to the end page underneath (GauntletEndStage):
//
//   1. THE RECAP RING. Every leg of the run is one arc of a ring, sized by
//      what the leg could score. Each arc fills in turn while the ground takes
//      that leg's colour, its label pops (name, score, subject), and the total
//      counts up dead centre. One-life quizzes mark the question that ended them
//      with a red tick; the line under the ring is the rank on that leg today.
//   2. THE TITLE, IN THE RUN'S OWN PIECE. The ring clears, the score rises to
//      the top, and the run plays its own title climb (PIECES below): books for
//      the Trivia Gauntlet and Encore, the flask for Science, a calculator for
//      Math, the dictionary for English, a belt for the Dojo, a name tag for
//      Read the Room, school letters for Judged, a wallet for Price Check, the
//      passport for Passport, the morning papers for Crossed Up. The title and
//      the standing land under it.
//
// Then THE GLIDE: the score, its unit, the title and the standing fly to their
// own places on the end page (data-rf="score|unit|title|rank" on desktop, the
// rolled bar data-rf="bar" on a phone) while the end page's other blocks rise
// in around them. The end page arrives already landed: no second count-up and
// no second climb.
//
// Rules: any tap or key skips straight to the glide; it never posts anything;
// reduced motion never mounts it (GauntletEndStage decides); it invents no
// figure, and a leg rank it was not handed simply draws no line.
//
// The sequence is imperative on purpose (one innerHTML build, then class flips
// and a few rAF loops), so a ten-second show costs no React renders.

import React, { useEffect, useRef } from 'react';
import { softGround } from '@/lib/category-ramp';
import { useStageChrome } from './GauntletScreens';

const DINK = '#08222e';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ease = (p) => 1 - Math.pow(1 - p, 3);
const C = 250, RAD = 192, SW = 30;
const pt = (r, deg) => [C + r * Math.cos(deg * Math.PI / 180), C + r * Math.sin(deg * Math.PI / 180)];
function arcD(r, a0, a1) {
  const [x0, y0] = pt(r, a0), [x1, y1] = pt(r, a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}
const FLASK = 'M84 14 L136 14 L136 112 L206 384 Q210 400 194 400 L26 400 Q10 400 14 384 L84 112 Z';
const firstWord = (s) => String(s || '').split(/\s+/)[0];

// Which piece each run plays. Anything unlisted gets the books.
export const FINALE_PIECE = {
  gauntlet: 'shelf', triviaencore: 'shelf', science: 'flask', math: 'calc', english: 'dict',
  dojo: 'belt', room: 'tag', judged: 'letters', pricecheck: 'wallet', passport: 'passport', crossed: 'papers',
};

// ── THE PIECES ─────────────────────────────────────────────────────────────
// html(L, X) draws the piece for ladder L (bottom to top); step(q, L, k) shows
// that the score has just reached title k; prog(q, v) follows the count (flask
// only); land(q, L, K, X) is the reveal. `q` is a querySelector scoped to the
// finale. X carries the score and the run's maximum.
const PIECES = {
  shelf: {
    html: (L) => `<div class="shelf">${L.map((t, i) => `<div class="bk" id="pk${i}" style="bottom:${14 + i * 44}px;width:${Math.max(220, 400 - i * 26)}px;background:${softGround(t.colour)}"><span>${esc(t.name)}</span><small>${t.min}+</small></div>`).join('')}<div class="plank"></div></div>`,
    step: (q, L, k) => q(`#pk${k}`).classList.add('drop'),
    land: (q, L, K) => { const b = q(`#pk${K}`); b.classList.remove('drop'); b.style.opacity = '1'; void b.offsetWidth; b.classList.add('out'); },
  },
  flask: {
    html: (L, X) => {
      const cap = X.cap;
      const y = (v) => 398 - (Math.min(cap, v) / cap) * 300;
      return `<div class="flk"><svg viewBox="0 0 220 410" width="160" height="300" aria-hidden="true"><defs><clipPath id="rfxFc"><path d="${FLASK}"/></clipPath></defs>
        <path d="${FLASK}" fill="rgba(8,34,46,.07)"/><g clip-path="url(#rfxFc)"><rect id="liq" x="0" y="398" width="220" height="420" fill="${L[0].colour}"/><rect id="liqs" x="0" y="398" width="220" height="6" fill="${DINK}" opacity=".22"/></g>
        ${L.map((t) => `<line x1="150" x2="180" y1="${y(t.min)}" y2="${y(t.min)}" stroke="currentColor" stroke-width="3" opacity=".5"/>`).join('')}
        <path d="${FLASK}" fill="none" stroke="currentColor" stroke-width="5"/></svg>
        ${L.map((t, i) => `<div class="fmark" id="fm${i}" style="top:${y(t.min) * 300 / 410}px">${esc(t.name)}</div>`).join('')}
        ${[0, 1, 2, 3].map((i) => `<i class="bub" id="bb${i}" style="left:${150 + i * 14}px;top:200px"></i>`).join('')}</div>`;
    },
    prog: (q, v, X) => { const y = 398 - (Math.min(X.cap, v) / X.cap) * 300; q('#liq').setAttribute('y', y); q('#liqs').setAttribute('y', y); },
    step: (q, L, k) => { q('#liq').setAttribute('fill', L[k].colour); q(`#fm${k}`).classList.add('lit'); },
    land: (q, L, K, X) => {
      q(`#fm${K}`).classList.add('here'); q('#liqs').classList.add('fwob');
      const y = (398 - (Math.min(X.cap, X.score) / X.cap) * 300) * 300 / 410;
      [0, 1, 2, 3].forEach((i) => { const b = q(`#bb${i}`); b.style.top = `${y + 6}px`; setTimeout(() => b.classList.add('go'), i * 160); });
    },
  },
  calc: {
    html: (L) => `<div class="calc"><div class="lcd"><span id="lcdt">${esc(L[0].name).toUpperCase()}</span></div>
      <div class="keys">${Array.from({ length: 16 }, (_, i) => `<i id="ky${i}">${'789÷456×123−0.=+'[i]}</i>`).join('')}</div></div>`,
    step: (q, L, k) => {
      q('#lcdt').textContent = String(L[k].name).toUpperCase();
      const ky = q(`#ky${(k * 7 + 3) % 16}`); ky.classList.remove('hit'); void ky.offsetWidth; ky.classList.add('hit');
    },
    land: (q) => { q('.lcd').classList.add('blink'); const e = q('#ky14'); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); },
  },
  dict: {
    html: (L) => `<div class="dict"><div class="dh"><span>${esc(firstWord(L[0].name))}</span><span>Mind Loft Dictionary</span><span>${esc(String(L[L.length - 1].name).split(/\s+/).slice(-1)[0])}</span></div>
      ${L.map((t, i) => `<div class="de" id="de${i}"><b>${esc(t.name)}</b> <i>n.</i><span>${esc(t.line || '')}</span></div>`).join('')}</div>`,
    step: (q, L, k) => q(`#de${k}`).classList.add('lit'),
    land: (q, L, K) => q(`#de${K}`).classList.add('here'),
  },
  belt: {
    html: (L) => `<div class="belt" id="beltp" style="--bc:${L[0].chip || L[0].colour}"><div class="band"></div><div class="tail l"></div><div class="tail r"></div><div class="knot"></div>
      <div class="sw">${L.map((t, i) => `<i id="bs${i}" style="background:${t.chip || t.colour}"></i>`).join('')}</div></div>`,
    step: (q, L, k) => { q('#beltp').style.setProperty('--bc', L[k].chip || L[k].colour); q(`#bs${k}`).classList.add('lit'); },
    land: (q, L, K) => { q(`#bs${K}`).classList.add('here'); q('#beltp').classList.add('tie'); },
  },
  tag: {
    html: (L) => `<div class="ntag" id="ntag"><div class="hd"><b>HELLO</b><span>my name is</span></div><div class="bd">${L.map((t, i) => `<div class="nm" id="nm${i}">${esc(t.name)}</div>`).join('')}</div></div>`,
    step: (q, L, k) => {
      for (let j = 0; j < k; j += 1) { const n = q(`#nm${j}`); n.classList.add('x'); if (j < k - 1) n.classList.add('gone'); }
      q(`#nm${k}`).classList.add('w');
    },
    land: (q) => q('#ntag').classList.add('sway'),
  },
  letters: {
    html: (L) => `<div class="ltrs">${L.map((t, i) => `<div class="ltr" id="lt${i}"><div class="lh" style="background:${t.chip || t.colour}">${esc(String(t.short || t.name)).toUpperCase()}</div><div class="lb"><b>ADMITTED</b><span>${esc(t.name)}</span></div></div>`).join('')}<div class="env"></div><div class="flap" id="flap"></div></div>`,
    step: (q, L, k) => L.forEach((t, j) => q(`#lt${j}`).classList.toggle('peek', j === k)),
    land: (q, L, K) => { q('#flap').classList.add('open'); setTimeout(() => { const l = q(`#lt${K}`); if (l) { l.classList.remove('peek'); l.classList.add('win'); } }, 280); },
  },
  wallet: {
    html: (L) => `<div class="walp">${L.map((t, i) => {
      const lab = String(t.label || (String(t.name).split('·')[1] || t.name)).replace(/\s*card$/i, '').trim().toUpperCase();
      return `<div class="cd" id="cd${i}" style="background:${t.chip || t.colour};z-index:${10 - i};transform:translateX(${(i - (L.length - 1) / 2) * 10}px);--up:${100 - i * 12}px"><b>${esc(lab)}</b></div>`;
    }).join('')}<div class="wal"></div></div>`,
    step: (q, L, k) => q(`#cd${k}`).classList.add('up'),
    land: (q, L, K) => { L.forEach((t, j) => { if (j !== K) q(`#cd${j}`).classList.remove('up'); }); const c = q(`#cd${K}`); c.style.transform = 'none'; c.classList.add('win'); },
  },
  passport: {
    html: (L, X) => `<div class="ppk"><div class="ppg"><small>${X.earned.vf != null ? 'VISA-FREE TO' : 'WELCOME HOME'}</small><b>${X.earned.vf != null ? esc(X.earned.vf) : '&#9992;'}</b><span>${X.earned.vf != null ? 'destinations' : esc(X.earned.short || '')}</span><div class="stamp" id="stmp">ENTRY</div></div>
      <div class="cov" id="cov" style="background:${L[0].chip || L[0].colour}"><b>PASSPORT</b><i></i><span id="covn">${esc(String(L[0].short || L[0].name)).toUpperCase()}</span></div></div>`,
    step: (q, L, k) => {
      const c = q('#cov'); c.classList.add('flip');
      setTimeout(() => { c.style.background = L[k].chip || L[k].colour; q('#covn').textContent = String(L[k].short || L[k].name).toUpperCase(); c.classList.remove('flip'); }, 200);
    },
    land: (q) => setTimeout(() => { q('#cov').classList.add('open'); q('#stmp').classList.add('hit'); }, 260),
  },
  papers: {
    html: (L) => L.map((t, i) => {
      const r1 = ((i * 37) % 7) - 3;
      const blk = [2, 7, 13, 16, 21];
      return `<div class="pap" id="pp${i}" style="top:${110 - i * 5}px;--r0:${r1 * 4}deg;--r1:${r1}deg;transform:rotate(${r1}deg);opacity:0;z-index:${i + 1}"><span class="mh">${esc(firstWord(t.name)).toUpperCase()}</span>
        <div class="ln"><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div><div class="gr">${Array.from({ length: 25 }, (_, j) => `<i class="${blk.includes(j) ? 'k' : ''}"></i>`).join('')}</div></div>`;
    }).join(''),
    step: (q, L, k) => { const p = q(`#pp${k}`); p.style.opacity = '1'; p.classList.add('drop'); },
    land: (q, L, K) => {
      const mh = q(`#pp${K} .mh`); const w = mh.offsetWidth + 28, h = mh.offsetHeight + 22;
      mh.insertAdjacentHTML('beforeend', `<svg class="inkc go" width="${w}" height="${h}"><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 3}" ry="${h / 2 - 3}" fill="none" stroke="#b4232a" stroke-width="3.5"/></svg>`);
    },
  },
};

export default function RunFinale({
  runKey, circuitName = '', dateLabel = '', unitWord = 'right', heading = '', legWord = 'Quiz',
  legs = [], oneLife = false, score = 0, ladder = [], rankText = '', ink = DINK, endBg = '#ffffff',
  colorGround = true, onGlide, onDone,
}) {
  const rootRef = useRef(null);
  const groundRef = useRef(endBg);
  const [ground, setGround] = React.useState(legs[0] && colorGround ? softGround(legs[0].colour) : endBg);
  useStageChrome(ground);
  // Pop-ups wait while the finale is up (they show once it hands over).
  useEffect(() => {
    const h = document.documentElement;
    h.classList.add('rfx-on');
    return () => h.classList.remove('rfx-on');
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !ladder.length) { if (onDone) onDone(); return undefined; }
    const L = ladder;
    let K = 0;
    L.forEach((t, i) => { if (score >= t.min) K = i; });
    const earned = L[K];
    const pieceKey = FINALE_PIECE[runKey] || 'shelf';
    const P = PIECES[pieceKey];
    const capMax = Math.max(score, L[L.length - 1].min + 6, legs.reduce((a, g) => a + (Number(g.max) || 0), 0) || 0);
    const X = { score, cap: pieceKey === 'flask' ? Math.max(capMax, 1) : capMax, earned };
    const phone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:899px)').matches;
    const gOf = (c) => (colorGround && c ? softGround(c) : endBg);
    const paint = (c) => { root.style.background = c; groundRef.current = c; setGround(c); };

    // ── build ──
    const maxSum = legs.reduce((a, g) => a + Math.max(0.0001, Number(g.max) || 0), 0) || 1;
    const GAP = legs.length > 1 ? 3.2 : 0;
    const usable = 360 - legs.length * GAP;
    let a = -90 + GAP / 2;
    const segs = [], labs = [];
    legs.forEach((g, i) => {
      const max = Math.max(0.0001, Number(g.max) || 0);
      const span = usable * max / maxSum, a0 = a, a1 = a + span; a = a1 + GAP;
      const d = arcD(RAD, a0, a1); const len = RAD * span * Math.PI / 180;
      const got = Math.max(0, Math.min(max, Number(g.got) || 0));
      const frac = got / max;
      const am = a0 + span * frac; const [mx1, my1] = pt(RAD - SW / 2 - 4, am), [mx2, my2] = pt(RAD + SW / 2 + 4, am);
      segs.push(`<path d="${d}" fill="none" stroke="${softGround(g.colour)}" stroke-width="${SW}"/><path d="${d}" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-width="${SW}"/>
        <path class="sf" id="sf${i}" d="${d}" fill="none" stroke="currentColor" stroke-width="${SW}" stroke-dasharray="${len} ${len}" stroke-dashoffset="${len}" data-l="${len}" data-f="${frac}"/>
        ${oneLife && got < max ? `<line class="miss" id="mx${i}" x1="${mx1}" y1="${my1}" x2="${mx2}" y2="${my2}" stroke="#b4232a" stroke-width="5" stroke-linecap="round"/>` : ''}`);
      const [lx, ly] = pt(phone ? RAD + 92 : RAD + 70, (a0 + a1) / 2);
      labs.push(`<div class="lab" id="lb${i}" style="left:${lx / 5}%;top:${ly / 5}%"><b>${esc(g.name)}</b><i>${esc(g.shown != null ? g.shown : Math.round(Number(g.got) || 0))}</i>${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</div>`);
    });
    root.innerHTML = `<div class="cap"><span>${esc(circuitName)}${dateLabel ? ` · ${esc(dateLabel)}` : ''}</span><span id="capR"></span></div>
      <div class="ringw" id="ringw"><svg viewBox="0 0 500 500" aria-hidden="true">${segs.join('')}</svg>${labs.join('')}</div>
      <div class="tline" id="tline"></div>
      <div class="rcol">
        <div class="rhero" id="rhero"><span class="num" id="f-score">0</span><span class="unit" id="f-unit">${esc(unitWord)}</span></div>
        <div class="pbox"><div class="piece">${P.html(L, X)}</div></div>
        <div class="tblock"><span class="ttl" id="f-title">${esc(earned.name)}</span>${rankText ? `<span class="rank" id="f-rank">${esc(rankText)}</span>` : ''}</div>
      </div>`;
    const q = (s) => root.querySelector(s);

    let alive = true;
    let skipped = false;
    const timers = [];
    const wait = (ms) => new Promise((res, rej) => { timers.push(setTimeout(() => (alive && !skipped ? res() : rej(new Error('stop'))), ms)); });
    const count = (el, from, to, ms) => new Promise((res) => {
      const t0 = performance.now();
      const tick = (now) => {
        if (!alive || skipped) { res(); return; }
        const p = Math.min(1, (now - t0) / ms);
        el.textContent = String(Math.round(from + (to - from) * ease(p)));
        if (p < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });

    const toPart2 = (animate) => {
      const hero = q('#rhero'); const r0 = hero.getBoundingClientRect();
      root.classList.add('p2');
      if (!animate) return;
      const r1 = hero.getBoundingClientRect();
      hero.style.transition = 'none'; hero.style.transform = `translateY(${r0.top - r1.top}px)`;
      void hero.offsetWidth;
      hero.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; hero.style.transform = 'none';
      const pb = q('.pbox'); pb.style.opacity = '0'; pb.style.transition = 'opacity .45s ease .3s';
      requestAnimationFrame(() => { pb.style.opacity = '1'; });
    };

    const landNow = () => {
      q('#f-score').textContent = String(score);
      legs.forEach((g, i) => {
        const sf = q(`#sf${i}`); if (sf) { sf.style.transition = 'none'; sf.style.strokeDashoffset = String(sf.dataset.l * (1 - sf.dataset.f)); }
      });
      const tl = q('#tline'); if (tl) tl.classList.remove('in');
      q('#capR').textContent = '';
      if (!root.classList.contains('p2')) toPart2(false);
      if (!root.dataset.landed) {
        for (let k = 0; k <= K; k += 1) { try { P.step(q, L, k); } catch (e) { /* a piece step on a skipped run */ } }
        if (P.prog) P.prog(q, score, X);
        try { P.land(q, L, K, X); } catch (e) { /* ditto */ }
        root.dataset.landed = '1';
      }
      q('#f-title').classList.add('in');
      const fr = q('#f-rank'); if (fr) fr.classList.add('in');
      paint(endBg);
    };

    // ── THE GLIDE ──
    let glided = false;
    const glide = () => {
      if (glided || !alive) return;
      glided = true;
      if (onGlide) onGlide();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!alive) return;
        const host = root.parentElement || document;
        const bar = host.querySelector('[data-rf="bar"]');
        const pairs = bar
          ? [['f-score', bar], ['f-title', bar], ['f-rank', bar]]
          : [['f-score', host.querySelector('[data-rf="score"]')], ['f-unit', host.querySelector('[data-rf="unit"]')],
            ['f-title', host.querySelector('[data-rf="title"]')], ['f-rank', host.querySelector('[data-rf="rank"]')]];
        const flies = [];
        pairs.forEach(([id, t]) => {
          const s = q(`#${id}`);
          if (!s || !t) return;
          const r1 = s.getBoundingClientRect(), r2 = t.getBoundingClientRect();
          if (!r1.width || !r2.width) return;
          const cs = getComputedStyle(s), ct = getComputedStyle(t);
          const c = document.createElement('div');
          c.className = 'rfx-fly';
          c.textContent = s.textContent;
          Object.assign(c.style, {
            left: `${r1.left}px`, top: `${r1.top}px`, height: `${r1.height}px`, lineHeight: `${r1.height}px`,
            fontSize: cs.fontSize, fontWeight: cs.fontWeight, letterSpacing: cs.letterSpacing, color: cs.color,
          });
          document.body.appendChild(c);
          s.style.visibility = 'hidden';
          let sc = parseFloat(ct.fontSize) / parseFloat(cs.fontSize) || 1;
          let dx, dy;
          if (bar) {
            // On a phone everything folds into the one bar: the score lands
            // where the bar's text starts, the title and standing shrink into
            // the bar's middle and fade as they go.
            sc = Math.min(1, (r2.height * 0.42) / r1.height);
            dx = id === 'f-score' ? r2.left + 16 - r1.left : (r2.left + r2.width / 2) - (r1.left + r1.width * sc / 2);
            dy = r2.top + r2.height / 2 - (r1.top + r1.height * sc / 2);
          } else {
            const centred = ct.textAlign === 'center' || ct.display.indexOf('inline') === 0;
            dx = centred ? (r2.left + r2.width / 2) - (r1.left + r1.width * sc / 2) : r2.left - r1.left;
            dy = (r2.top + r2.height / 2) - (r1.top + r1.height * sc / 2);
          }
          flies.push({ c, dx, dy, sc, color: ct.color, fade: bar ? (id === 'f-score' ? 'late' : 'early') : null });
        });
        root.classList.add('out');
        requestAnimationFrame(() => {
          flies.forEach(({ c, dx, dy, sc, color, fade }) => {
            c.style.transition = `transform .95s cubic-bezier(.65,0,.25,1), color .6s ease .3s, opacity ${fade === 'early' ? '.4s ease .1s' : '.35s ease .65s'}`;
            c.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
            c.style.color = color;
            if (fade) c.style.opacity = '0';
          });
        });
        timers.push(setTimeout(() => {
          flies.forEach(({ c }) => c.remove());
          if (onDone) onDone();
        }, 1000));
      }));
    };

    const skip = () => {
      if (glided) return;
      skipped = true;
      landNow();
      requestAnimationFrame(glide);
    };
    root.addEventListener('click', skip);
    const onKey = () => skip();
    window.addEventListener('keydown', onKey);

    // ── THE SEQUENCE ──
    (async () => {
      try {
        const num = q('#f-score');
        let sum = 0;
        paint(gOf(legs[0] && legs[0].colour));
        await wait(420);
        for (let i = 0; i < legs.length; i += 1) {
          const g = legs[i];
          paint(gOf(g.colour));
          q('#capR').textContent = `${legWord} ${i + 1} of ${legs.length}`;
          const sf = q(`#sf${i}`); sf.style.strokeDashoffset = String(sf.dataset.l * (1 - sf.dataset.f));
          const mx = q(`#mx${i}`); if (mx) mx.classList.add('in');
          q(`#lb${i}`).classList.add('in');
          const tl = q('#tline'); tl.classList.remove('in');
          const add = Number(g.got) || 0;
          count(num, Math.round(sum), Math.round(sum + add), 620);
          sum += add;
          await wait(360);
          if (g.rank != null && g.plays != null) { tl.textContent = `#${g.rank} of ${g.plays} on ${g.name} today`; tl.classList.add('in'); }
          await wait(480);
        }
        num.textContent = String(score);
        q('#tline').classList.remove('in');
        await wait(280);
        // part two
        q('#capR').textContent = heading || 'Your title';
        toPart2(true);
        await wait(720);
        paint(gOf(L[0].colour));
        P.step(q, L, 0);
        await wait(600);
        const DUR = 600 + K * 600;
        let k = 0;
        const t0 = performance.now();
        await new Promise((res) => {
          const tick = (now) => {
            if (!alive || skipped) { res(); return; }
            const p = Math.min(1, (now - t0) / DUR);
            const v = score * (pieceKey === 'flask' ? ease(p) : p);
            if (P.prog) P.prog(q, v, X);
            while (k < K && v >= L[k + 1].min) { k += 1; paint(gOf(L[k].colour)); P.step(q, L, k); }
            if (p < 1) requestAnimationFrame(tick); else res();
          };
          requestAnimationFrame(tick);
        });
        if (skipped) return;
        await wait(320);
        paint(endBg);
        P.land(q, L, K, X);
        root.dataset.landed = '1';
        await wait(500);
        q('#f-title').classList.add('in');
        await wait(320);
        const fr = q('#f-rank'); if (fr) fr.classList.add('in');
        q('#capR').textContent = '';
        await wait(1700);
        glide();
      } catch (e) { /* skipped or unmounted */ }
    })();

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      root.removeEventListener('click', skip);
      window.removeEventListener('keydown', onKey);
      document.querySelectorAll('.rfx-fly').forEach((n) => n.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div ref={rootRef} className="rfx" role="dialog" aria-label={`${circuitName} results`} style={{ background: ground, color: ink, '--rfx-ink': ink }} />
    </>
  );
}

const CSS = `
.rfx{position:fixed;inset:0;z-index:96;overflow:hidden;font-family:Manrope,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .38s ease,opacity .55s ease;user-select:none}
.rfx *{box-sizing:border-box}
html.rfx-on .mrp-bd,html.rfx-on .gmp-bd,html.rfx-on .enp-bd,html.rfx-on .rnp-bd{visibility:hidden !important}
.rfx.out{opacity:0;pointer-events:none}
.rfx-fly{position:fixed;z-index:97;transform-origin:0 0;white-space:nowrap;pointer-events:none;font-family:Manrope,system-ui,sans-serif;font-variant-numeric:tabular-nums}
.rfx .cap{position:absolute;top:max(18px, env(safe-area-inset-top));left:24px;right:24px;display:flex;justify-content:space-between;gap:12px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
.rfx .ringw{position:absolute;left:50%;top:50%;width:480px;height:480px;transform:translate(-50%,-50%);transition:opacity .5s ease,transform .6s cubic-bezier(.2,.8,.2,1)}
.rfx.p2 .ringw{opacity:0;transform:translate(-50%,-50%) scale(.82)}
.rfx .ringw svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.rfx .sf{transition:stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)}
.rfx .miss{opacity:0;transition:opacity .25s ease .55s}.rfx .miss.in{opacity:1}
.rfx .lab{position:absolute;transform:translate(-50%,-50%) scale(.6);opacity:0;transition:transform .45s cubic-bezier(.2,1.4,.4,1),opacity .3s ease;text-align:center;line-height:1.15;white-space:nowrap}
.rfx .lab.in{opacity:1;transform:translate(-50%,-50%) scale(1)}
.rfx .lab b{font-size:15px;font-weight:800}.rfx .lab i{font-style:normal;font-size:15px;font-weight:800;margin-left:5px;font-variant-numeric:tabular-nums}
.rfx .lab small{display:block;font-size:11px;font-weight:700;opacity:.65;letter-spacing:.02em}
.rfx .tline{position:absolute;left:0;right:0;top:calc(50% + 300px);height:22px;font-size:15px;font-weight:800;opacity:0;transition:opacity .3s ease;text-align:center}
.rfx .tline.in{opacity:.85}
.rfx .rcol{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 16px}
.rfx .rhero{display:flex;flex-direction:column;align-items:center;gap:6px}
.rfx .rhero .num{font-size:120px;font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;display:inline-block;transition:font-size .6s cubic-bezier(.2,.8,.2,1)}
.rfx .rhero .unit{font-size:17px;font-weight:800;line-height:1;display:inline-block}
.rfx.p2 .rhero .num{font-size:78px}
.rfx .pbox,.rfx .tblock{display:none}
.rfx.p2 .pbox{display:block}.rfx.p2 .tblock{display:flex}
.rfx .pbox{width:420px;height:300px;position:relative}
.rfx .piece{position:absolute;left:0;top:0;width:420px;height:300px;transform-origin:0 0;perspective:900px}
.rfx .tblock{flex-direction:column;align-items:center;gap:8px;min-height:62px}
.rfx .ttl{font-size:30px;font-weight:800;letter-spacing:-.01em;line-height:1.1;display:inline-block;opacity:0;max-width:90vw}
.rfx .ttl.in{animation:rfxFlip .45s cubic-bezier(.2,.8,.2,1) both}
.rfx .rank{font-size:15px;font-weight:800;line-height:1;display:inline-block;opacity:0;transition:opacity .4s ease;font-variant-numeric:tabular-nums}
.rfx .rank.in{opacity:1}
@keyframes rfxFlip{from{transform:translateY(60%);opacity:0}to{transform:none;opacity:1}}
@media (max-width:899px){
  .rfx .cap{left:18px;right:18px;font-size:10.5px;letter-spacing:.1em}
  .rfx .ringw{width:280px;height:280px}
  .rfx .lab b,.rfx .lab i{font-size:11.5px}.rfx .lab small{font-size:9px;max-width:84px;white-space:normal}
  .rfx .tline{top:calc(50% + 205px);font-size:12.5px}
  .rfx .rhero .num{font-size:74px}.rfx .rhero .unit{font-size:13px}
  .rfx.p2 .rhero .num{font-size:52px}
  .rfx .pbox{width:286px;height:204px}
  .rfx .piece{transform:scale(.68)}
  .rfx .ttl{font-size:21px}.rfx .rank{font-size:12px}
}

/* books */
.rfx .shelf .plank{position:absolute;left:0;right:0;bottom:0;height:10px;border-radius:3px;background:currentColor}
.rfx .bk{position:absolute;left:50%;height:38px;border:2.5px solid currentColor;border-radius:5px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:15px;font-weight:800;color:${DINK};opacity:.18;transform:translateX(-50%);transition:transform .5s cubic-bezier(.2,1.3,.4,1),opacity .2s ease,box-shadow .3s ease}
.rfx .bk small{font-size:12px;font-weight:800;opacity:.75}
.rfx .bk.drop{opacity:1;animation:rfxBk .45s cubic-bezier(.3,1.4,.5,1) both}
.rfx .bk.out{opacity:1;transform:translateX(calc(-50% + 46px)) rotate(-3deg);box-shadow:0 0 0 3px ${DINK},0 14px 28px rgba(8,34,46,.25)}
@keyframes rfxBk{from{transform:translate(-50%,-70px);opacity:0}to{transform:translateX(-50%);opacity:1}}
/* flask */
.rfx .flk svg{position:absolute;left:96px;top:0;overflow:visible}
.rfx .fmark{position:absolute;left:262px;transform:translateY(-50%);font-size:13px;font-weight:800;white-space:nowrap;opacity:.35;transition:opacity .25s ease;text-align:left}
.rfx .fmark::before{content:'';display:inline-block;width:18px;height:2.5px;background:currentColor;vertical-align:middle;margin-right:7px}
.rfx .fmark.lit{opacity:1}.rfx .fmark.here{font-size:16px}
.rfx .fwob{animation:rfxWob .9s ease-in-out 2}
@keyframes rfxWob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.rfx .bub{position:absolute;width:10px;height:10px;border-radius:50%;border:2px solid currentColor;opacity:0}
.rfx .bub.go{animation:rfxBub 1.1s ease-out both}
@keyframes rfxBub{0%{opacity:0;transform:translateY(0)}20%{opacity:.8}100%{opacity:0;transform:translateY(-120px)}}
/* calculator */
.rfx .calc{position:absolute;left:90px;top:6px;width:240px;height:288px;border:3px solid currentColor;border-radius:22px;padding:16px;background:rgba(8,34,46,.06)}
.rfx .lcd{height:70px;border-radius:10px;background:#131c12;display:flex;align-items:center;justify-content:flex-end;padding:0 14px;overflow:hidden}
.rfx .lcd span{color:#bef264;font-size:17px;font-weight:800;letter-spacing:.08em;white-space:nowrap;text-shadow:0 0 12px rgba(190,242,100,.5)}
.rfx .lcd.blink span{animation:rfxBlink .3s steps(2) 4}
@keyframes rfxBlink{50%{opacity:0}}
.rfx .keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.rfx .keys i{font-style:normal;height:36px;border-radius:8px;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800}
.rfx .keys i.hit{animation:rfxKey .35s ease both}
@keyframes rfxKey{40%{background:currentColor;transform:scale(.9)}100%{transform:none}}
/* dictionary */
.rfx .dict{position:absolute;left:40px;right:40px;top:0;bottom:0;background:#fffdf6;border:3px solid ${DINK};border-radius:6px;padding:12px 16px;text-align:left;color:${DINK}}
.rfx .dict *{color:${DINK}}
.rfx .dh{display:flex;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;border-bottom:2px solid ${DINK};padding-bottom:5px;margin-bottom:6px;opacity:.75}
.rfx .de{padding:4px 6px;border-radius:4px;font-size:13px;line-height:1.25;opacity:.32;transition:opacity .2s ease,background .3s ease}
.rfx .de b{font-size:15px;font-weight:800}.rfx .de i{font-weight:700;opacity:.7}
.rfx .de span{display:block;font-size:11.5px;font-weight:600;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rfx .de.lit{opacity:1}
.rfx .de.here{background:linear-gradient(90deg,#fde68a,#fde68a);background-size:100% 100%;animation:rfxHl .5s ease-out both}
@keyframes rfxHl{from{background-size:0 100%}to{background-size:100% 100%}}
/* belt */
.rfx .belt .band{position:absolute;left:24px;right:24px;top:96px;height:44px;border:3px solid currentColor;border-radius:7px;background:var(--bc);transition:background .25s ease}
.rfx .belt .knot{position:absolute;left:50%;top:84px;width:62px;height:68px;margin-left:-31px;border:3px solid currentColor;border-radius:10px;background:var(--bc);transition:background .25s ease;z-index:2}
.rfx .belt .tail{position:absolute;top:140px;width:30px;height:104px;border:3px solid currentColor;border-radius:0 0 6px 6px;background:var(--bc);transition:background .25s ease;transform-origin:top center}
.rfx .belt .tail.l{left:calc(50% - 34px);transform:rotate(14deg)}.rfx .belt .tail.r{left:calc(50% + 4px);transform:rotate(-14deg)}
.rfx .belt.tie .knot{animation:rfxKnot .6s cubic-bezier(.3,1.6,.5,1) both}
.rfx .belt.tie .tail.l{animation:rfxSwl 1.4s ease-in-out both}.rfx .belt.tie .tail.r{animation:rfxSwr 1.4s ease-in-out both}
@keyframes rfxKnot{0%{transform:scale(1)}40%{transform:scale(1.28,.8)}100%{transform:scale(1)}}
@keyframes rfxSwl{0%{transform:rotate(14deg)}30%{transform:rotate(32deg)}60%{transform:rotate(6deg)}100%{transform:rotate(14deg)}}
@keyframes rfxSwr{0%{transform:rotate(-14deg)}30%{transform:rotate(-32deg)}60%{transform:rotate(-6deg)}100%{transform:rotate(-14deg)}}
.rfx .belt .sw{position:absolute;left:24px;right:24px;top:266px;display:flex;gap:6px}
.rfx .belt .sw i{flex:1;height:14px;border-radius:3px;border:2px solid currentColor;opacity:.25;transition:opacity .2s ease,transform .3s ease}
.rfx .belt .sw i.lit{opacity:1}.rfx .belt .sw i.here{transform:scaleY(1.6)}
/* name tag */
.rfx .ntag{position:absolute;left:40px;right:40px;top:18px;height:262px;border:3px solid ${DINK};border-radius:18px;background:#fff;overflow:hidden;transform-origin:50% 0}
.rfx .ntag .hd{background:#c0392b;height:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
.rfx .ntag .hd b{font-size:38px;font-weight:800;letter-spacing:.06em;line-height:1;color:#fff}.rfx .ntag .hd span{font-size:15px;font-weight:700;margin-top:4px;color:#fff}
.rfx .ntag .bd{position:absolute;left:0;right:0;top:86px;bottom:0;color:${DINK}}
.rfx .nm{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);font-size:32px;font-weight:800;letter-spacing:-.01em;clip-path:inset(0 100% 0 0);transition:transform .45s ease,opacity .45s ease,font-size .45s ease;color:${DINK}}
.rfx .nm.w{animation:rfxWrite .5s ease-out both}
.rfx .nm.x{clip-path:none;transform:translateY(-200%);font-size:16px;opacity:.45}
.rfx .nm.x::after{content:'';position:absolute;left:50%;top:52%;height:2.5px;width:0;background:${DINK};animation:rfxStrike .3s ease-out both;transform:translateX(-50%)}
.rfx .nm.gone{opacity:0}
@keyframes rfxWrite{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes rfxStrike{to{width:60%}}
.rfx .ntag.sway{animation:rfxSway 1.2s ease-in-out both}
@keyframes rfxSway{0%{transform:rotate(0)}25%{transform:rotate(-4deg)}55%{transform:rotate(3deg)}80%{transform:rotate(-1.5deg)}100%{transform:rotate(0)}}
/* letters */
.rfx .env{position:absolute;left:50px;right:50px;top:128px;height:168px;background:#efe9dc;border:3px solid ${DINK};border-radius:8px;z-index:3}
.rfx .flap{position:absolute;left:50px;right:50px;top:128px;height:96px;z-index:4;transform-origin:50% 0;transition:transform .6s cubic-bezier(.4,0,.2,1)}
.rfx .flap::before{content:'';position:absolute;inset:0;background:${DINK};clip-path:polygon(0 0,100% 0,50% 100%)}
.rfx .flap::after{content:'';position:absolute;inset:3px 5px 6px;background:#e3dac6;clip-path:polygon(0 0,100% 0,50% 100%)}
.rfx .flap.open{transform:rotateX(180deg);z-index:1}
.rfx .ltr{position:absolute;left:78px;right:78px;top:150px;height:140px;background:#fff;border:3px solid ${DINK};border-radius:6px;z-index:2;overflow:hidden;transition:top .45s cubic-bezier(.2,1.2,.4,1);color:${DINK}}
.rfx .ltr .lh{height:40px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;letter-spacing:.1em;color:#fff}
.rfx .ltr .lb{padding:14px 12px;text-align:center}
.rfx .ltr .lb b{display:block;font-size:30px;font-weight:800;letter-spacing:.06em;color:${DINK}}
.rfx .ltr .lb span{display:block;font-size:13px;font-weight:700;margin-top:6px;opacity:.75;color:${DINK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rfx .ltr.peek{top:70px}
.rfx .ltr.win{top:22px;z-index:5;box-shadow:0 18px 40px rgba(8,34,46,.25)}
/* wallet */
.rfx .wal{position:absolute;left:62px;right:62px;top:166px;height:128px;background:${DINK};border-radius:18px;z-index:20}
.rfx .wal::after{content:'';position:absolute;left:14px;right:14px;top:12px;height:3px;border-radius:2px;background:rgba(255,255,255,.18)}
.rfx .cd{position:absolute;left:50%;width:230px;height:120px;margin-left:-115px;top:168px;border:2.5px solid ${DINK};border-radius:13px;transition:top .45s cubic-bezier(.2,1.3,.4,1),transform .5s cubic-bezier(.2,1.2,.4,1);overflow:hidden}
.rfx .cd::before{content:'';position:absolute;left:16px;top:34px;width:30px;height:22px;border-radius:4px;background:#e3c77a;border:2px solid ${DINK}}
.rfx .cd b{position:absolute;right:14px;bottom:12px;font-size:14px;font-weight:800;letter-spacing:.14em;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.rfx .cd.up{top:var(--up)}
.rfx .cd.win{top:14px;transform:scale(1.14);z-index:30;box-shadow:0 20px 40px rgba(8,34,46,.3)}
.rfx .cd.win::after{content:'';position:absolute;top:0;bottom:0;width:60px;left:-80px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);animation:rfxShine 1s .3s ease-out both}
@keyframes rfxShine{to{left:120%}}
/* passport */
.rfx .ppk{position:absolute;left:150px;top:22px;width:180px;height:256px}
.rfx .ppg{position:absolute;inset:0;background:#fff;border:3px solid ${DINK};border-radius:6px 14px 14px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:12px;color:${DINK}}
.rfx .ppg small{font-size:11px;font-weight:800;letter-spacing:.12em;opacity:.7;color:${DINK}}
.rfx .ppg b{font-size:44px;font-weight:800;line-height:1;color:${DINK}}
.rfx .ppg span{font-size:13px;font-weight:800;color:${DINK}}
.rfx .stamp{width:84px;height:84px;border-radius:50%;border:3px solid #b4232a;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:.08em;color:#b4232a;transform:rotate(-14deg) scale(1.6);opacity:0}
.rfx .stamp.hit{animation:rfxStamp .35s cubic-bezier(.3,1.5,.5,1) .55s both}
@keyframes rfxStamp{to{transform:rotate(-14deg) scale(1);opacity:1}}
.rfx .cov{position:absolute;inset:0;border:3px solid ${DINK};border-radius:6px 14px 14px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;transform-origin:0 50%;transition:transform .2s ease-in,background .1s;backface-visibility:hidden;z-index:2;color:#e3c77a}
.rfx .cov i{width:58px;height:58px;border-radius:50%;border:3px solid #e3c77a}
.rfx .cov b{font-size:14px;font-weight:800;letter-spacing:.16em;color:#e3c77a}
.rfx .cov span{font-size:12px;font-weight:800;letter-spacing:.06em;color:#e3c77a;text-align:center;padding:0 8px}
.rfx .cov.flip{transform:rotateY(-90deg)}
.rfx .cov.open{transform:rotateY(-170deg);transition:transform .8s cubic-bezier(.4,0,.2,1)}
/* papers */
.rfx .pap{position:absolute;left:80px;width:260px;height:168px;background:#fff;border:3px solid ${DINK};border-radius:3px;padding:10px 12px;text-align:left;color:${DINK}}
.rfx .pap .mh{font-size:22px;font-weight:800;letter-spacing:.14em;border-bottom:3px solid ${DINK};padding-bottom:4px;display:inline-block;position:relative;color:${DINK}}
.rfx .pap .ln{display:flex;flex-direction:column;gap:7px;margin-top:12px;width:120px}
.rfx .pap .ln i{display:block;height:5px;border-radius:2px;background:rgba(8,34,46,.25)}
.rfx .pap .gr{position:absolute;right:12px;bottom:12px;display:grid;grid-template-columns:repeat(5,16px);gap:2px}
.rfx .pap .gr i{width:16px;height:16px;border:1.5px solid ${DINK}}
.rfx .pap .gr i.k{background:${DINK}}
.rfx .pap.drop{animation:rfxDrop .45s cubic-bezier(.3,1.3,.5,1) both}
@keyframes rfxDrop{from{transform:translateY(-240px) rotate(var(--r0));opacity:0}to{transform:rotate(var(--r1));opacity:1}}
.rfx .inkc{position:absolute;left:-14px;top:-10px;overflow:visible;pointer-events:none}
.rfx .inkc ellipse{stroke-dasharray:420;stroke-dashoffset:420}
.rfx .inkc.go ellipse{animation:rfxInk .6s ease-out .1s forwards}
@keyframes rfxInk{to{stroke-dashoffset:0}}
`;
