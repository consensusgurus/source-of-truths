'use client';

// Bag: the daily grocery-bagging puzzle (owner, 2026-11-14: a "practical puzzle"
// beside Mop, Chef, Pack and Seated; "better graphical help"; "start gentle";
// "also need hot foods that cant sit by frozen or cold foods"). Groceries come
// down a belt and only the first few are in reach. Pick one, tap a bag. A bag
// holds so many items and so many pounds, nothing may be crushed, cold things
// share one bag, hot food stays away from cold, cleaning products stay away from
// food, and a melon rides alone.
//
// THE HELP IS DRAWN, NOT WRITTEN (owner). Every item carries pills: its weight,
// how much it takes on top (red 0, yellow a number, green any), and a mark for
// cold, hot, cleaning or alone. Every bag has a weight bar and its slots. With an
// item picked up, EVERY bag answers at once: green "Fits here" with a see-through
// copy in its slot, or red with the reason and the item at fault turned red.
//
// The model is lib/bag-engine.js (shared with the generator and the checker).
// Runs on app/SimpleDaily.jsx. Bagging everything is the solve; re-bags (an item
// taken back out) are the miss column, lower first, then the clock. The Bagging
// Ladder names the rung. The stored answer never reaches the browser.
//
// THE BOARD NEVER MOVES AT THE FINISH (owner rule): the items pop bag by bag
// where they sit, then the full-screen fill opens with the ladder climb.

import React, { useState } from 'react';
import { COLS_CSS } from '@/lib/practical-cols';
import SimpleDaily from '../SimpleDaily';
import { endSolved } from '@/lib/end-verdict';
import { wt, why, holds, anyMove, rankOf } from '@/lib/bag-engine';

const BAND = { intro: 'Intro', gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const STEP = 140, RUNG_H = 8;
const lightStep = (n) => Math.min(100, 1300 / n);
const openAt = (n) => 150 + n * lightStep(n) + 650;
const climbAt = (n) => openAt(n) + 650;
const html = (s) => ({ __html: s });
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];

const PIC = {
  can: '<rect x="6" y="4" width="14" height="18" rx="3"/><path d="M6 10h14M6 16h14"/>', carton: '<path d="M7 9l3-5h6l3 5v13H7z"/><path d="M7 9h12"/>',
  eggs: '<rect x="3" y="11" width="20" height="9" rx="3"/><path d="M5 11a3 3 0 016 0M11 11a3 3 0 016 0M17 11a3 3 0 014 0"/>',
  loaf: '<path d="M4 21V12a5 5 0 015-5h8a5 5 0 015 5v9z"/>', sack: '<path d="M9 5h8l-1 3q5 4 5 9a4 4 0 01-4 4H9a4 4 0 01-4-4q0-5 5-9z"/>',
  tub: '<path d="M5 9h16l-2 12H7z"/><path d="M4 9h18"/>', round: '<circle cx="13" cy="14" r="8"/><path d="M13 6v-3M10 5l3 1 3-1"/>',
  pouch: '<path d="M6 5h14l-1 3 1 13H6l1-13z"/>', box: '<rect x="6" y="4" width="14" height="18" rx="1"/><path d="M9 9h8"/>',
  jar: '<rect x="7" y="9" width="12" height="13" rx="2"/><path d="M8 4h10v5H8z"/>', bottle: '<path d="M11 3h4v5l3 4v10H8V12l3-4z"/>',
  bunch: '<path d="M6 8q1 10 12 12M9 6q3 9 11 10M13 4q3 6 8 8M6 8l3-2 4-2"/>',
  melon: '<ellipse cx="13" cy="14" rx="10" ry="8"/><path d="M8 7.5q-2 6.5 0 13M13 6v16M18 7.5q2 6.5 0 13"/>',
  cup: '<path d="M7 9h12l-1.5 13h-9zM6 9h14M9 9l1-4h6l1 4"/>',
};
const pic = (k) => `<svg class="bg-pic" viewBox="0 0 26 26" fill="none" stroke="#141414" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${PIC[k] || PIC.box}</svg>`;
const G = (p) => `<svg viewBox="0 0 12 12" fill="none" stroke="#141414" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SCALE = G('<path d="M2 10h8M3.2 10l.9-6h3.8l.9 6M4.6 4a1.4 1.4 0 012.8 0"/>'), PRESS = G('<path d="M6 1v5M3.8 4L6 6.2 8.2 4M2 8.5h8M3 10.5h6"/>');
const SNOW = G('<path d="M6 1v10M1.7 3.5l8.6 5M10.3 3.5l-8.6 5"/>'), FLAME = G('<path d="M6 1.2q3.6 3.2 3.6 6a3.6 3.6 0 01-7.2 0q0-1.6 1.4-3 .4 1.6 1.4 1.8-.4-2.4.8-4.8z"/>');
const DROP = G('<path d="M4.5 1.5h3M5 1.5v2.8L2.6 9.6a.9.9 0 00.8 1.4h5.2a.9.9 0 00.8-1.4L7 4.3V1.5"/>'), ALONE = G('<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="6" r="4.6"/>');
const TICK = G('<path d="M2.5 6.5l2.3 2.3 4.7-5.3"/>'), CROSS = G('<path d="M3 3l6 6M9 3l-6 6"/>');
const BAGS = '<svg class="bg-ico" viewBox="0 0 110 56" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M8 20h28l-3 32H11z"/><path d="M15 20v-6a7 7 0 0114 0v6"/><path d="M42 16h28l-3 36H45z"/><path d="M49 16v-5a7 7 0 0114 0v5"/><path d="M76 22h26l-3 30H79z"/><path d="M82 22v-5a7 7 0 0114 0v5"/></svg>';
const FLAG = { cold: ['c', SNOW, 'Cold'], hot: ['h', FLAME, 'Hot'], chem: ['m', DROP, 'Cleaning'], solo: ['s', ALONE, 'Alone'] };
const flagOf = (it) => (it.cold ? 'cold' : it.hot ? 'hot' : it.chem ? 'chem' : it.solo ? 'solo' : null);
const pills = (it) => {
  const f = flagOf(it);
  return `<span class="bg-pills"><span class="bg-pl">${SCALE}${it.w}</span><span class="bg-pl ${it.c === 0 ? 'h0' : it.c > 20 ? 'ha' : 'hn'}">${PRESS}${it.c > 20 ? 'any' : it.c}</span>${f ? `<span class="bg-pl f ${FLAG[f][0]}">${FLAG[f][1]}</span>` : ''}</span>`;
};
const say = (it) => `${it.n}, ${it.w} pounds, ${it.c === 0 ? 'takes nothing on top' : it.c > 20 ? 'takes anything on top' : `takes ${it.c} pounds on top`}${flagOf(it) ? `, ${FLAG[flagOf(it)][2].toLowerCase()}` : ''}`;

const CSS = `
.bag{align-self:center;width:100%;max-width:1040px;display:flex;flex-direction:column;gap:10px;font-family:'Manrope',system-ui,sans-serif;font-weight:600;color:var(--bg-ink);line-height:1.4;
--bg-bg:#ffffff;--bg-ink:#141414;--bg-mute:#6b6b6b;--bg-grey:#f1f1ef;--bg-grey2:#e3e3df;--bg-ok:#bfe6c8;--bg-bad:#f3b0b0;--bg-sat:62%;--bg-lit:84%;--bg-acc:var(--pst-acc,#fecdd3);--bg-on:var(--pst-on-acc,#141414);}
.stage-page[data-stage-theme='dark'] .bag,.pst.dk .bag{--bg-bg:#161616;--bg-ink:#f2f2ee;--bg-mute:#a3a39d;--bg-grey:#232323;--bg-grey2:#333333;--bg-ok:#3f7a52;--bg-bad:#9c5050;--bg-sat:40%;--bg-lit:66%;}
.bag button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0;margin:0;}
.bg-stat{display:flex;border:1px solid var(--bg-ink);border-radius:10px;overflow:hidden;background:var(--bg-bg);}
.bg-stat div{flex:1;padding:6px 4px;text-align:center;border-left:1px solid var(--bg-ink);}
.bg-stat div:first-child{border-left:0;}
.bg-stat b{display:block;font-size:17px;font-weight:800;line-height:1.3;}.bg-stat span{font-size:11px;color:var(--bg-mute);}
.bg-ev{display:flex;align-items:center;gap:12px;color:var(--pst-ink,var(--bg-ink));}
.bg-ico{width:74px;height:38px;flex:none;display:block;}
.bg-ev b{display:block;font-size:15px;font-weight:800;line-height:1.3;}.bg-ev span{font-size:12px;color:var(--pst-mute,var(--bg-mute));}
.bg-h{font-size:12px;letter-spacing:.04em;color:var(--pst-mute,var(--bg-mute));margin:2px 0 -4px;font-weight:700;text-transform:uppercase;}
/* pills: what to read on every item */
.bg-pl{display:inline-flex;align-items:center;gap:2px;height:18px;padding:0 5px 0 3px;border:1px solid #141414;border-radius:999px;font-size:11px;font-weight:800;line-height:1;color:#141414;background:#ffffff;white-space:nowrap;}
.bg-pl svg{width:12px;height:12px;flex:none;}
.bg-pl.h0{background:#f3b0b0;}.bg-pl.hn{background:#f6e3a8;}.bg-pl.ha{background:#bfe6c8;}
.bg-pl.f{padding:0 3px;}.bg-pl.c{background:#bfe0f7;}.bg-pl.h{background:#ffc9a3;}.bg-pl.m{background:#dcc8f5;}.bg-pl.s{background:#ffffff;}
.bg-pills{display:flex;gap:3px;margin-top:3px;}
/* an item */
.bag button.bg-it,.bg-it{border:1px solid #141414;border-radius:9px;display:flex;align-items:center;gap:6px;padding:4px 5px;color:#141414;text-align:left;width:100%;background:hsl(var(--h) var(--bg-sat) var(--bg-lit));}
.bg-it .bg-pic{width:26px;height:26px;flex:none;display:block;}
.bg-it b{display:block;font-size:12px;font-weight:800;line-height:1.2;white-space:nowrap;}
.bag button.bg-it.sel{box-shadow:0 0 0 3px var(--bg-ink);}
.bag button.bg-it.hurt,.bg-it.hurt{background:var(--bg-bad);}
.bg-it.ghost{opacity:.5;}
/* the bags */
.bg-bags{display:grid;gap:7px;}
.bg-bag{border:1px solid var(--bg-ink);border-radius:8px 8px 14px 14px;background:var(--bg-bg);padding:6px 5px 0;display:flex;flex-direction:column;overflow:hidden;min-width:0;cursor:pointer;}
.bg-nm{display:flex;justify-content:space-between;font-size:12px;font-weight:800;line-height:1.3;white-space:nowrap;}.bg-nm span{color:var(--bg-mute);font-weight:700;}
.bg-gauge{display:grid;gap:2px;margin:4px 0 6px;}
.bg-gauge i{height:9px;border:1px solid var(--bg-ink);border-radius:2px;background:var(--bg-bg);}
.bg-gauge i.on{background:var(--bg-ink);}.bg-gauge i.pre{background:var(--bg-acc);}.bg-gauge i.over{background:var(--bg-bad);}
.bg-stack{display:flex;flex-direction:column-reverse;gap:4px;}
.bg-slot{height:50px;border:1px solid var(--bg-grey2);border-radius:9px;background:var(--bg-grey);}
.bg-stack .bg-it{height:50px;flex-direction:column;align-items:flex-start;gap:0;padding:3px 5px;justify-content:center;overflow:hidden;}
.bg-stack .bg-top{display:flex;align-items:center;gap:4px;}.bg-stack .bg-pic{width:18px;height:18px;}
.bg-stack .bg-pills{margin-top:2px;gap:2px;}.bg-stack .bg-pl{padding:0 4px 0 2px;}.bg-stack .bg-pl.f{padding:0 2px;}
.bg-verd{margin:6px -5px 0;padding:5px 3px;font-size:12px;font-weight:800;text-align:center;line-height:1.25;min-height:42px;display:flex;align-items:center;justify-content:center;gap:4px;border-top:1px solid var(--bg-ink);background:var(--bg-grey);color:var(--bg-ink);}
.bg-verd svg{width:15px;height:15px;flex:none;}.bg-verd svg path{stroke:currentColor;}
.bg-verd.ok{background:var(--bg-ok);}.bg-verd.no{background:var(--bg-bad);}
/* four across: everything a size smaller */
.bg-bags.four{gap:5px;}
.four .bg-bag{padding:5px 3px 0;}
.four .bg-nm{font-size:11px;}.four .bg-gauge{gap:1px;}.four .bg-gauge i{height:8px;border-radius:1px;}
.four .bg-stack .bg-it{padding:3px 3px;}
.four .bg-stack .bg-pic{width:15px;height:15px;}.four .bg-top{gap:3px;}
.four .bg-it b{font-size:10.5px;letter-spacing:-.01em;}
.four .bg-pills{gap:2px;}.four .bg-pl{height:16px;font-size:10px;padding:0 3px 0 2px;gap:1px;}.four .bg-pl svg{width:10px;height:10px;}.four .bg-pl.f{padding:0 2px;}
.four .bg-verd{font-size:11px;margin:5px -3px 0;min-height:58px;}.four .bg-verd svg{display:none;}
/* the belt */
.bg-beltw{border:1px solid var(--bg-ink);border-radius:10px;background:var(--bg-grey);padding:0 8px 8px;overflow:hidden;}
.bg-reach{display:flex;gap:6px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;}
.bg-reach b{flex:none;text-align:center;background:var(--bg-ink);color:var(--bg-bg);border-radius:0 0 8px 8px;padding:2px 0 3px;font-weight:800;}
.bg-reach span{align-self:center;color:var(--bg-mute);white-space:nowrap;}
.bg-belt{display:flex;gap:6px;overflow-x:auto;padding-top:7px;scrollbar-width:none;}
.bg-belt::-webkit-scrollbar{display:none;}
.bag .bg-belt button.bg-it{width:108px;flex:none;height:58px;flex-direction:column;align-items:flex-start;justify-content:center;gap:0;padding:4px 6px;overflow:hidden;}
.bg-belt .bg-top{display:flex;align-items:center;gap:5px;}.bg-belt .bg-pic{width:20px;height:20px;}.bg-belt .bg-it b{font-size:13px;}.bg-belt .bg-pills{gap:2px;}.bg-belt .bg-pl{padding:0 4px 0 2px;}.bg-belt .bg-pl.f{padding:0 2px;}
.bag .bg-belt button.bg-it:disabled{opacity:.42;cursor:default;}
.bg-msg{min-height:20px;text-align:center;font-size:13px;font-weight:700;color:var(--pst-ink,var(--bg-ink));}
.bg-card{border:1px solid var(--bg-ink);border-radius:10px;background:var(--bg-bg);overflow:hidden;}
.bg-cardh{font-size:12px;color:var(--bg-mute);font-weight:700;letter-spacing:.04em;padding:10px 12px 6px;text-transform:uppercase;}
.bg-key{display:flex;gap:10px;align-items:center;padding:8px 12px;font-size:13px;border-top:1px solid var(--bg-grey2);}
.bg-key>span:first-child{flex:none;width:86px;display:flex;gap:3px;flex-wrap:wrap;}
.bag button.bg-btn{border:1px solid var(--bg-ink);border-radius:10px;padding:9px 4px;font-weight:800;font-size:14px;background:var(--bg-bg);text-align:center;line-height:1.3;width:100%;}
.bag button.bg-btn:disabled{opacity:.45;cursor:default;}
.bg-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 12px;font-size:14px;border-top:1px solid var(--bg-grey2);}
.bg-row b{font-weight:800;}.bg-row span{color:var(--bg-mute);font-size:12px;text-align:right;}
.bg-row.me{background:var(--bg-acc);color:var(--bg-on);}.bg-row.me span{color:var(--bg-on);font-weight:800;}
/* the ending beat: each item pops where it sits, bag by bag */
.bg-fin-on .bg-stack .bg-it{animation:bg-pop .3s ease-out backwards;}
@keyframes bg-pop{45%{transform:scale(1.12)}}
.bg-fin{position:fixed;inset:0;z-index:60;background:var(--bg-acc);color:#141414;display:flex;align-items:center;justify-content:center;animation:bg-open .5s ease-out backwards;}
@keyframes bg-open{from{clip-path:circle(0 at 50% 36%)}to{clip-path:circle(150% at 50% 36%)}}
.bg-fin-in{text-align:center;width:280px;}
.bg-fin .bg-ico{width:110px;height:56px;margin:0 auto 4px;}
.bg-rung{height:36px;line-height:34px;border:1px solid #141414;border-radius:10px;margin:6px 0;font-weight:800;font-size:15px;background:#ffffff;white-space:nowrap;animation:bg-lit .12s backwards;}
.bg-rung.over{opacity:.3;background:transparent;animation:none;}
.bg-rung.me{background:#141414;color:#ffffff;transform:scale(1.07);animation:bg-earn .15s backwards;}
@keyframes bg-lit{from{opacity:.3;background:transparent}}
@keyframes bg-earn{from{opacity:.3;background:transparent;color:#141414;transform:none}}
.bg-fin-t{font-size:26px;font-weight:800;height:44px;line-height:44px;margin-top:10px;white-space:nowrap;animation:bg-rise .25s backwards;}
.bg-fin-s{font-size:15px;height:22px;animation:bg-rise .25s backwards;}
@keyframes bg-rise{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion: reduce){.bg-fin,.bg-fin *,.bg-fin-on *{animation:none !important;}}
`;

const rb = (n) => `${n} ${n === 1 ? 're-bag' : 're-bags'}`;
const rankName = (P, s) => { const r = rankOf(P, s.rb); return r.rows[r.at].name; };
const shopLine = (P) => `${NUM[P.bags.length][0].toUpperCase()}${NUM[P.bags.length].slice(1)} bags · reach of ${NUM[P.reach]}`;
const REFUSE = (P, r, b) => ({
  full: `Bag ${b + 1} is full.`, heavy: `Bag ${b + 1} would tear over ${P.bags[b].limit} lb.`,
  crush: `That would crush the ${r.hit != null ? P.items[r.hit].n.toLowerCase() : 'item under it'}.`, cold: 'Keep the cold things in one bag.',
  hot: 'Hot food and cold food do not share a bag.', chem: 'Cleaning products stay away from the food.', solo: 'That one needs a bag to itself.',
}[r.code]);

function Board({ P, s, setS, active, done, held, release }) {
  const N = P.items.length, B = P.bags.length;
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const live = active && !done;
  const won = done && !s.belt.length;
  const finale = won && held;
  const picked = live && sel != null && s.belt.indexOf(sel) >= 0 && s.belt.indexOf(sel) < P.reach ? sel : null;
  const four = B === 4;

  const pick = (i) => {
    if (!live) return;
    if (picked === i) { setSel(null); setNote(''); return; }
    setSel(i); setNote(`The green bags will take the ${P.items[i].n.toLowerCase()}.`);
  };
  const tapBag = (b) => {
    if (finale) { release(); return; }
    if (!live) return;
    const st = s.bags[b];
    if (picked == null) {
      // nothing in hand: the top item comes back out, to the head of the belt
      if (!st.length) { setNote('Pick something off the belt first.'); return; }
      const top = st[st.length - 1];
      setNote(`The ${P.items[top].n.toLowerCase()} is back on the belt. That is a re-bag.`);
      setS({ ...s, belt: [top].concat(s.belt), bags: s.bags.map((x, j) => (j === b ? x.slice(0, -1) : x)), rb: s.rb + 1 });
      return;
    }
    const r = why(P, s.bags, b, picked);
    if (r) { setNote(REFUSE(P, r, b)); return; }
    const next = { ...s, belt: s.belt.filter((x) => x !== picked), bags: s.bags.map((x, j) => (j === b ? x.concat(picked) : x)), mv: s.mv + 1 };
    setSel(null);
    setNote(next.belt.length && !anyMove(P, next) ? 'Nothing in reach fits anywhere. Tap a bag to take its top item back out.' : '');
    setS(next);
  };
  const empty = () => {
    const inBags = N - s.belt.length;
    if (!live || !inBags) return;
    setSel(null); setNote('Everything is back on the belt.');
    setS({ ...s, belt: P.items.map((_, i) => i), bags: P.bags.map(() => []), rb: s.rb + inBags });
  };

  const rank = won ? rankOf(P, s.rb) : null;
  const step = lightStep(N);
  let k = 0;
  const flags = ['cold', 'hot', 'chem', 'solo'].filter((f) => P.items.some((it) => it[f]));
  const tile = (i) => {
    const it = P.items[i];
    return `<span class="bg-top">${pic(it.k)}<b>${it.n}</b></span>${pills(it)}`;
  };

  return (
    <div className="bag">
      <style dangerouslySetInnerHTML={html(CSS + COLS_CSS)} />
      <div className="pz-wrap"><div className="pz-cols"><div className="pz-main">
      <div className="bg-stat" aria-label="The shop so far">
        <div><b>{N - s.belt.length}/{N}</b><span>Bagged</span></div>
        <div><b>{s.rb}</b><span>Re-bags</span></div>
        <div><b>{s.belt.length}</b><span>On the Belt</span></div>
      </div>
      <div className="bg-ev">
        <span dangerouslySetInnerHTML={html(BAGS)} />
        <div><b>{P.shop}</b><span>{shopLine(P)}</span></div>
      </div>
      <div className={`bg-bags${four ? ' four' : ''}${finale ? ' bg-fin-on' : ''}`} style={{ gridTemplateColumns: `repeat(${four ? 4 : 3}, minmax(0, 1fr))` }}>
        {s.bags.map((st, b) => {
          const cap = P.bags[b], w = wt(P, st), r = picked != null ? why(P, s.bags, b, picked) : null, ok = picked != null && !r, pre = picked != null ? P.items[picked].w : 0;
          const h = holds(P, st), room = Math.min(h, cap.limit - w);
          const idle = st.length >= cap.slots ? 'Full' : !st.length ? 'Empty' : st.some((x) => P.items[x].solo) ? 'Rides alone' : room <= 0 ? 'Nothing more on top' : h > 20 && room >= cap.limit - w ? `Room for ${room} lb` : `Top takes ${room} lb`;
          return (
            <div key={b} className="bg-bag" data-bag={b} onClick={() => tapBag(b)} role="button" aria-label={`Bag ${b + 1}, ${w} of ${cap.limit} pounds, ${st.length} of ${cap.slots} items`}>
              <div className="bg-nm">Bag {b + 1}<span>{w}/{cap.limit} lb</span></div>
              <div className="bg-gauge" style={{ gridTemplateColumns: `repeat(${cap.limit}, 1fr)` }}>
                {Array.from({ length: cap.limit }, (_, i) => <i key={i} className={i < w ? 'on' : i < w + pre ? (w + pre > cap.limit ? 'over' : 'pre') : undefined} />)}
              </div>
              <div className="bg-stack">
                {st.map((i) => { const n = k++; return <div key={i} className={`bg-it${r && r.hit === i ? ' hurt' : ''}`} style={{ '--h': P.items[i].hue, ...(finale ? { animationDelay: `${150 + n * step}ms` } : null) }} dangerouslySetInnerHTML={html(tile(i))} />; })}
                {ok ? <div className="bg-it ghost" style={{ '--h': P.items[picked].hue }} dangerouslySetInnerHTML={html(tile(picked))} /> : null}
                {Array.from({ length: Math.max(0, cap.slots - st.length - (ok ? 1 : 0)) }, (_, i) => <div key={`s${i}`} className="bg-slot" />)}
              </div>
              {done ? <div className="bg-verd">{st.length ? `${st.length} ${st.length === 1 ? 'item' : 'items'}` : 'Empty'}</div>
                : picked != null ? (ok ? <div className="bg-verd ok"><span dangerouslySetInnerHTML={html(TICK)} />Fits here</div> : <div className="bg-verd no"><span dangerouslySetInnerHTML={html(CROSS)} />{r.text}</div>)
                  : <div className="bg-verd">{idle}</div>}
            </div>);
        })}
      </div>
      {won && !held ? null : (
        <>
          {done ? null : <div className="bg-msg" aria-live="polite">{live ? note || (s.mv || s.rb ? '' : `Tap one of the ${NUM[P.reach]} items in reach, then a bag.`) : ''}</div>}
          {s.belt.length ? (
            <>
              <div className="bg-h">{done ? 'Left on the Belt' : 'The Belt'}</div>
              <div className="bg-beltw">
                {done ? null : <div className="bg-reach"><b style={{ width: Math.min(P.reach, s.belt.length) * 108 + (Math.min(P.reach, s.belt.length) - 1) * 6 }}>Your Reach</b>{s.belt.length > P.reach ? <span>Coming up</span> : null}</div>}
                <div className="bg-belt">
                  {s.belt.map((i, at) => (
                    <button key={i} type="button" data-item={i} className={`bg-it${picked === i ? ' sel' : ''}`} style={{ '--h': P.items[i].hue }} disabled={!live || at >= P.reach} onClick={() => pick(i)} aria-pressed={picked === i} aria-label={say(P.items[i])}
                      dangerouslySetInnerHTML={html(tile(i))} />
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
      </div>
      <div className="pz-side">
      {won && !held ? (
        <>
          <div className="bg-card">
            <div className="bg-cardh">Bagging Ladder</div>
            {rank.rows.map((r, i) => <div key={r.name} className={`bg-row${i === rank.at ? ' me' : ''}`}><b>{r.name}</b><span>{i === rank.at ? 'You · ' : ''}{r.label}</span></div>)}
          </div>
          <div className="bg-card">
            <div className="bg-cardh">The Shop</div>
            <div className="bg-row"><b>Re-bags</b><span>{s.rb}</span></div>
            <div className="bg-row"><b>Items</b><span>{N} in {B} bags</span></div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-card">
            <div className="bg-cardh">How to Read an Item</div>
            <div className="bg-key"><span dangerouslySetInnerHTML={html(`<span class="bg-pl">${SCALE}3</span>`)} /><span>Its weight in pounds. The bar on a bag fills as you load it.</span></div>
            <div className="bg-key"><span dangerouslySetInnerHTML={html(`<span class="bg-pl h0">${PRESS}0</span><span class="bg-pl hn">${PRESS}2</span><span class="bg-pl ha">${PRESS}any</span>`)} /><span>What it takes on top: nothing, 2 lb, or anything.</span></div>
            {flags.includes('cold') ? <div className="bg-key"><span dangerouslySetInnerHTML={html(`<span class="bg-pl f c">${SNOW}</span>`)} /><span>Cold. Every cold thing goes in the same bag.</span></div> : null}
            {flags.includes('hot') ? <div className="bg-key"><span dangerouslySetInnerHTML={html(`<span class="bg-pl f h">${FLAME}</span>`)} /><span>Hot. Never in a bag with anything cold.</span></div> : null}
            {flags.includes('chem') ? <div className="bg-key"><span dangerouslySetInnerHTML={html(`<span class="bg-pl f m">${DROP}</span>`)} /><span>Cleaning. Never in a bag with food.</span></div> : null}
            {flags.includes('solo') ? <div className="bg-key"><span dangerouslySetInnerHTML={html(`<span class="bg-pl f s">${ALONE}</span>`)} /><span>Rides alone, in a bag to itself.</span></div> : null}
          </div>
          {done ? null : <button type="button" className="bg-btn" onClick={empty} disabled={!live || s.belt.length === N}>Empty the Bags</button>}
        </>
      )}
      </div></div></div>

      {finale ? (
        <div className="bg-fin" style={{ animationDelay: `${openAt(N)}ms` }} onClick={release} role="status" aria-label={`${rank.rows[rank.at].name}. ${rb(s.rb)}.`}>
          <div className="bg-fin-in">
            <span dangerouslySetInnerHTML={html(BAGS)} />
            {rank.rows.map((r, i) => (
              <div key={r.name} className={`bg-rung${i < rank.at ? ' over' : i === rank.at ? ' me' : ''}`}
                style={i >= rank.at ? { animationDelay: `${climbAt(N) + (RUNG_H - 1 - i) * STEP}ms` } : undefined}>{r.name}</div>
            ))}
            <div className="bg-fin-t" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rank.rows[rank.at].name}</div>
            <div className="bg-fin-s" style={{ animationDelay: `${climbAt(N) + (RUNG_H - 1 - rank.at) * STEP + 250}ms` }}>{rb(s.rb)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const has = (P, f) => P.items.some((it) => it[f]);

const GAME = {
  key: 'bag', name: 'Bag', cat: 'Logic', miss: 're-bags', missOne: 're-bag',
  fresh: (P) => ({ belt: P.items.map((_, i) => i), bags: P.bags.map(() => []), rb: 0, mv: 0 }),
  validSave: (P, s) => {
    if (!s || !Array.isArray(s.belt) || !Array.isArray(s.bags) || s.bags.length !== P.bags.length || !Number.isInteger(s.rb) || !Number.isInteger(s.mv)) return false;
    if (!s.bags.every((st, b) => Array.isArray(st) && st.length <= P.bags[b].slots)) return false;
    const all = s.belt.concat(...s.bags);
    return all.length === P.items.length && new Set(all).size === all.length && all.every((x) => Number.isInteger(x) && x >= 0 && x < P.items.length);
  },
  touched: (s) => s.mv > 0,
  solved: (P, s) => s.belt.length === 0,
  count: (s) => s.rb,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.rb }),
  metric: (P, s, won) => (won ? s.rb : null),
  Board,
  wide: true,
  holdMs: (P, s, won) => { if (!won) return 1200; const r = rankOf(P, s.rb), n = P.items.length; return climbAt(n) + (RUNG_H - 1 - r.at) * STEP + 250 + 1500; },
  title: (P, s, won) => (won ? rankName(P, s) : endSolved(false)),
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || `${BAND[P.band]} · ${P.shop}`} · No. ${P.num}`,
  foot: (P, s) => `${P.items.length - s.belt.length} of ${P.items.length} bagged · ${rb(s.rb)}`,
  frac: (P, s) => (P.items.length - s.belt.length) / P.items.length,
  // the second intro board falls on a Sunday and is not a Sunday Edition
  sundayLabel: (P) => (P.band === 'sunday' ? 'Sunday Edition · The Big Shop' : null),
  gateTitle: (P) => `Today: the ${P.shop}, ${P.items.length} things to bag`,
  gateLine: (P) => `${P.items.length} groceries come down the belt into ${NUM[P.bags.length]} bags. You can reach the first ${NUM[P.reach]}. Pick one, tap a bag, and do not crush the eggs.`,
  rules: (P) => ({
    lead: 'Bag everything on the belt, and take as little back out as you can.',
    steps: [
      <><b>Pick an item</b> from the first {NUM[P.reach]} on the belt, then <b>tap a bag</b>. It goes on top of whatever is already in there.</>,
      <>Every bag answers as soon as you pick something up: <b>green</b> if it fits, with a faint copy showing where it will sit, or <b>red</b> with the reason.</>,
      <>Each item shows its <b>weight</b> and what it <b>takes on top</b>: red 0 means nothing at all, a yellow number is a limit in pounds, green means anything. A bag holds {P.bags[0].slots} items and tears over {P.bags[0].limit} lb{P.bags.some((b) => b.limit !== P.bags[0].limit) ? ', and today one bag is smaller' : ''}.</>,
      <>All the <b>cold</b> things go in one bag.{has(P, 'hot') ? <> <b>Hot</b> food never shares a bag with cold.</> : null}{has(P, 'chem') ? <> <b>Cleaning</b> products never share a bag with food.</> : null}{has(P, 'solo') ? <> The melon <b>rides alone</b>.</> : null}</>,
      <>With nothing picked up, tap a bag to take its <b>top item</b> back out to the head of the belt. That is a <b>re-bag</b>, and so is each item Empty the Bags removes.</>,
    ],
    knack: 'Look at everything in reach before you place anything. Heavy and sturdy go in first, fragile goes on last, and decide early which bag is the cold one.',
    footer: 'Bagging everything counts. The fewest re-bags ranks first, then the clock, and the Bagging Ladder names your rung.',
  }),
  pitch: (P) => `${P.items.length} groceries, ${NUM[P.bags.length]} bags. Do not crush the eggs.`,
  shareLine: (P, s, won, el) => `Bag #${P.num} · ${won ? `${rankName(P, s)} · ${rb(s.rb)} · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => (won ? `${rb(s.rb)} · ${el}` : `${P.items.length - s.belt.length} of ${P.items.length} bagged · ${el}`),
  aboutTitle: 'About Bag',
  about: [
    'Bag is a free daily grocery-bagging puzzle from Mind Loft. Groceries come down a checkout belt and only the first few are in reach. Pick one, tap a bag, and it goes on top. The whole shop has to end up bagged.',
    'The rules are the ones every bagger knows. A bag holds four items and tears over nine pounds. Nothing can be crushed: eggs, bread and chips take nothing on top, tomatoes and cereal take a little, cans and potatoes take anything. All the cold things share one bag. Hot food never shares a bag with cold food, cleaning products never share a bag with anything you eat, and a melon gets a bag to itself.',
    'Nothing has to be memorised. Every item carries small marks for its weight, what it takes on top and whether it is cold, hot or a cleaning product, and every bag shows a weight bar and its free slots. The moment you pick something up, each bag turns green or red and says why.',
    'The shop grows through the week: a corner shop of eight items on Monday, a hot item on Tuesday, cleaning products and a fourth bag on Wednesday, a belt you can only reach two deep on Friday, and on Sunday the big shop of eighteen items in six bags. Taking an item back out is a re-bag, and the Bagging Ladder names your rung by how few you needed, from Crushed the Eggs up to Bagger of the Year.',
    <>More everyday puzzles: <a href="/seated" style={{ color: 'inherit', fontWeight: 800 }}>Seated</a>, <a href="/chef" style={{ color: 'inherit', fontWeight: 800 }}>Chef</a>, <a href="/pack" style={{ color: 'inherit', fontWeight: 800 }}>Pack</a> and <a href="/mop" style={{ color: 'inherit', fontWeight: 800 }}>Mop</a>.</>,
  ],
};

export default function BagClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
