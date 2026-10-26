import { markSvg as markSvgShared, SKY as SKY_FILL } from './mindloft-mark';
// THE STAGE'S SHARE CARD. ONE RENDERER, THREE LAYOUTS, EVERY ROUTE.
//
// This replaces the 93 render*Card functions in lib/og-brand-card.js, of which
// seventy-odd were per-game board snapshots: a hand-drawn fake Crux grid, a
// hand-drawn fake Suds grid, one per game, each needing a redraw whenever that
// board moved, and each reducing to grey mush at the ~600px a timeline renders.
//
// A card here is a HUE and a GLYPH over the Stage's own ground. Both already
// exist and are already maintained elsewhere:
//
//   hue   -> CATEGORY_RAMP[RAMP_ORDER.indexOf(cat)], lib/category-ramp.js
//   glyph -> GLYPHS[key], lib/game-glyphs.js  (one 24x24 stroke drawing per
//            game, drawn to the rule "draw the board, not the genre")
//
// So a new daily game gets a share card by being added to lib/daily-games.js.
// There is no per-game card body to write and nothing to redraw when a board
// changes.
//
// -- THE FOUR SATORI RULES THIS FILE OBEYS ----------------------------------
//
// 1. NO CUSTOM PROPERTIES. Satori does not resolve var(--x); it drops the
//    declaration silently. Every colour below is a literal. A card is a baked
//    PNG and cannot follow a register, so it is always WHITE WITH COLOR, on the
//    light pastel palette (owner, 2026-10-25; it was always dark before).
//
// 2. EVERY CHILD OF A MULTI-CHILD FLEX PARENT SETS display flex. The helpers T,
//    Row and Col below do it, so the rule is enforced in one place instead of in
//    ninety-three.
//
// 3. SVG GOES IN AS A DATA URI, NOT AS MARKUP. Satori ignores SVG masks outright
//    (app/api/quiz/day-card faked a masked fill with two flat PNGs and a clip
//    for years before its meter became a flex ladder) and is unreliable with
//    stroke-linecap on inline markup. glyphURI and markURI build the SVG as a
//    STRING with the colour baked in and hand Satori one img. Because they are
//    strings, a colour codemod must not touch them: an attribute written as
//    fill={T.white} in there is not JSX, it is broken markup inside a base64
//    payload. Same warning as og-brand-card.js, same reason.
//
// 4. FONTS COME FROM node_modules, NOT THE NETWORK. og-brand-card.js fetches
//    Manrope from jsdelivr on every render, which is a network round trip inside
//    an image route and a 500 when it fails. The fontsource packages are
//    dependencies; read the woff off disk.
//
// -- WHY DM MONO ------------------------------------------------------------
// It is the Stage's utility face. StageToday, StageFinish and StageFooter all
// declare JetBrains Mono first and app/layout.js has never loaded it, so what
// those surfaces actually render is ui-monospace. The cap (StageChrome) is the
// one place the mono is real, and it is DM Mono. The cards match the cap.

import { ImageResponse } from 'next/og';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { GLYPHS } from './game-glyphs.js';
import { CATEGORY_RAMP, RAMP_ORDER, softGround } from './category-ramp.js';

export const size = { width: 1200, height: 630 };
export const square = { width: 1080, height: 1080 };
export const contentType = 'image/png';

const h = React.createElement;

// -- THE WHITE REGISTER, AS LITERALS (owner, 2026-10-25) ------------------
// Share cards are WHITE WITH COLOR, on the light pastel palette only: a white
// ground, the category's softened pastel (softGround, the same 40%-toward-white
// step the phone stages use) as the one coloured panel, near-black ink, and a
// black call to action. No deep accents, no dark set: a card is a baked PNG and
// the owner picked the white ones. Literals, never var(): Satori drops var().
//
// The keys keep their old names so the routes that compose their own body
// (api/quiz/day-card, api/quiz/share-card) follow without a rewrite.
export const D = Object.freeze({
  ground: '#ffffff',
  raise: '#f7f8fa',
  surf: '#f4f6f9',
  surf2: '#eef1f6',
  line: '#e3e7ee',
  line2: '#d3d9e2',
  ink: '#0b0d12',
  ink2: '#3f4757',
  mute: '#5f6774',
  mute2: '#5f6774',
  // Ink ON a pastel fill. The pastels are high lightness, so the near-black
  // carries on every one of them, softened or full.
  onramp: '#0b0d12',
  brand: '#7dd3fc',
  good: '#6ee7b7',
  cta: '#0b0d12',
  onCta: '#ffffff',
});

// The panel colour for a hue: the pastel step mixed 40% toward white.
export const soft = function (hue) { return softGround(hue || D.brand); };

// Every first letter capitalised (owner rule, Title Case on titles, chips and
// buttons). Leaves the rest of each word alone so "IQ" and "2,200+" survive.
export function titleCase(s) {
  return String(s == null ? '' : s).replace(/(^|[\s(\/-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
}

const SANS = 'Manrope';
const MONO = 'DM Mono';

// -- FONTS ------------------------------------------------------------------
// Read once per process. Any weight that fails to load is backfilled from one
// that did, so Satori always resolves a family: a missing family is a 500, and
// a slightly wrong weight is still a card.
let FONT_CACHE = null;

function readFont(rel) {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'node_modules', rel));
  } catch (e) {
    return null;
  }
}

export function stageFonts() {
  if (FONT_CACHE) return FONT_CACHE;
  const want = [
    ['@fontsource/manrope/files/manrope-latin-800-normal.woff', SANS, 800],
    ['@fontsource/manrope/files/manrope-latin-700-normal.woff', SANS, 700],
    ['@fontsource/manrope/files/manrope-latin-600-normal.woff', SANS, 600],
    ['@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff', MONO, 500],
    ['@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff', MONO, 400],
  ];
  const got = want.map(function (row) {
    return { name: row[1], weight: row[2], style: 'normal', data: readFont(row[0]) };
  });
  const sansOk = got.filter(function (f) { return f.name === SANS && f.data; })[0];
  const monoOk = got.filter(function (f) { return f.name === MONO && f.data; })[0];
  const sansFallback = sansOk ? sansOk.data : null;
  const monoFallback = monoOk ? monoOk.data : sansFallback;
  FONT_CACHE = got
    .map(function (f) {
      return { name: f.name, weight: f.weight, style: f.style, data: f.data || (f.name === SANS ? sansFallback : monoFallback) };
    })
    .filter(function (f) { return !!f.data; });
  return FONT_CACHE;
}

// -- HUE --------------------------------------------------------------------
export function hueFor(cat) {
  const i = RAMP_ORDER.indexOf(cat);
  return i >= 0 ? CATEGORY_RAMP[i] : D.brand;
}

// -- ART, AS DATA URIS (rule 3) ---------------------------------------------

function svgURI(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// The Mind Loft mark (lib/mindloft-mark.js, the one copy of the drawing), on the
// "A2" rule (owner, 2026-10-26): the house takes the card's hue (sky when there is
// none), the words beside it stay ink, and a pale house gets a deeper outline of its
// own colour so it holds on the white card. `ink` is kept for the callers' signature.
// eslint-disable-next-line no-unused-vars
export function markURI(hue, ink) {
  return svgURI(markSvgShared({ ink: hue || SKY_FILL, ground: D.ground, size: 120 }));
}

// A game's glyph at card scale. The source is 24x24 at stroke 2; drawn at 128
// that stroke lands near 10.7px, which is the weight the rest of the card is
// set in. Returns null for an unknown key so the caller can fall back to the
// mark rather than emit a blank square.
export function glyphURI(key, hue, px) {
  const d = GLYPHS[key];
  if (!d) return null;
  const s = px || 128;
  return svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none">'
    + '<path d="' + d + '" stroke="' + hue + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
}

// -- PRIMITIVES (rule 2) ----------------------------------------------------
// `key` is a REACT PROP, not a style declaration, and these helpers take one
// object for both. Split it back out here rather than at ninety call sites: a
// key left inside the style object means React warns about list keys AND Satori
// is handed a property it has no rule for.
function split(style) {
  const s = Object.assign({}, style);
  const key = s.key;
  delete s.key;
  return [key, s];
}

export const T = function (txt, style) {
  const parts = split(style);
  return h('div', { key: parts[0], style: Object.assign({ display: 'flex' }, parts[1]) }, txt);
};
export const Row = function (children, style) {
  const parts = split(style);
  return h('div', { key: parts[0], style: Object.assign({ display: 'flex' }, parts[1]) }, children);
};
export const Col = function (children, style) {
  const parts = split(style);
  return h('div', { key: parts[0], style: Object.assign({ display: 'flex', flexDirection: 'column' }, parts[1]) }, children);
};
// ONE TYPEFACE (owner, 2026-10-08): Manrope only, no mono. Kept as a helper so
// callers that styled a label with it read the same, now in Manrope 700.
export const mono = function (extra) {
  return Object.assign({ fontFamily: SANS, fontWeight: 700 }, extra);
};

export function clamp(s, n) {
  const v = String(s == null ? '' : s);
  return v.length > n ? v.slice(0, n - 1).trimEnd() + '…' : v;
}

// -- THE CHROME (white with color, 2026-10-25) -------------------------------
// The Mind Loft mark and name top left, the address top right, then the body.
// Every mark sits at least 52px in from the edge, so iMessage's rounded bubble
// never clips a word.
const PAD_X = 64;

function arrowURI(col) {
  return svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="' + col + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>');
}

function brandRow(o) {
  return Row([
    Row([
      h('img', { key: 'mk', src: markURI(o.hue, D.ink), width: 46, height: 46 }),
      T('Mind Loft', { key: 'wm', fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginLeft: '12px' }),
    ], { key: 'brand', alignItems: 'center' }),
    T(clamp(o.url || '', 40), { key: 'u', fontSize: 22, fontWeight: 700, color: D.mute }),
  ], { key: 'cap', alignItems: 'center', justifyContent: 'space-between', flex: 'none' });
}

// The chip: white on a panel, the soft pastel on the white ground.
function chip(text, onPanel, hue) {
  return T(titleCase(text), {
    key: 'chip', fontSize: 20, fontWeight: 800, color: D.ink,
    background: onPanel ? '#ffffff' : soft(hue), padding: '10px 20px', borderRadius: '999px',
  });
}

// The call to action is a real button: black, white words, an arrow.
function ctaPill(text) {
  if (!text) return null;
  return Row([
    T(titleCase(text), { key: 't', fontSize: 24, fontWeight: 800, whiteSpace: 'nowrap' }),
    h('img', { key: 'a', src: arrowURI(D.onCta), width: 24, height: 24, style: { marginLeft: '12px' } }),
  ], { key: 'cta', alignItems: 'center', background: D.cta, color: D.onCta, padding: '14px 24px 14px 28px', borderRadius: '999px', flex: 'none' });
}

function topRow(o, onPanel) {
  const kids = [chip(o.eyebrow, onPanel, o.hue)];
  const c = ctaPill(o.cta);
  if (c) kids.push(c);
  return Row(kids, { key: 'top', alignItems: 'center', justifyContent: 'space-between' });
}

export function shell(o, body) {
  const w = o.w || 1200;
  const ht = o.ht || 630;
  return h('div', {
    style: {
      width: w + 'px', height: ht + 'px', display: 'flex', flexDirection: 'column',
      background: D.ground, color: D.ink, fontFamily: SANS,
      padding: '52px ' + PAD_X + 'px 56px', gap: '26px',
    },
  }, [brandRow(o), body]);
}

function panel(o, kids) {
  return Col(kids, {
    key: 'panel', flex: 1, background: soft(o.hue), borderRadius: '32px',
    padding: '44px 56px 48px', justifyContent: 'space-between', color: D.onramp,
  });
}

// A headline's size by its length: a game name runs huge, a quiz title steps down.
function headSize(txt, big) {
  if (big) return big;
  const n = String(txt || '').length;
  return n <= 10 ? 116 : n <= 18 ? 96 : n <= 28 ? 78 : n <= 44 ? 64 : 56;
}

// -- LAYOUT A - THE GAME ----------------------------------------------------
// No glyph tile any more (owner, 2026-10-23): the name and its how-to line take
// the panel. Every daily, the quiz cards and the hub cards.
function layoutA(o) {
  const hs = headSize(o.headline, null);
  return shell(o, panel(o, [
    topRow(o, true),
    Col([
      T(o.headline, { key: 'h', fontSize: hs, fontWeight: 800, letterSpacing: (hs >= 90 ? -4.5 : -2) + 'px', lineHeight: hs >= 90 ? 0.95 : 1.04 }),
      o.sub ? T(clamp(o.sub, 160), { key: 's', fontSize: 31, fontWeight: 600, lineHeight: 1.3, marginTop: '14px', maxWidth: '960px' }) : null,
    ].filter(Boolean), { key: 'w', minWidth: 0 }),
  ]));
}

// -- LAYOUT B - A FIGURE TO BEAT --------------------------------------------
// A quiz result or a player. The figure sits big at the right of the panel;
// the stats, when there are any, are white pills under the name.
function layoutB(o) {
  const stats = (o.stats || []).slice(0, 4).map(function (s, i) {
    return Row([
      T(String(s[0]), { key: 'v', fontSize: 22, fontWeight: 800 }),
      T(titleCase(String(s[1])), { key: 'l', fontSize: 18, fontWeight: 700, color: D.ink2, marginLeft: '8px' }),
    ], { key: 's' + i, alignItems: 'baseline', background: '#ffffff', borderRadius: '999px', padding: '8px 16px', marginRight: '8px' });
  });
  const fig = String(o.figure);
  const figSize = fig.length <= 3 ? 150 : fig.length <= 5 ? 132 : 104;
  return shell(o, panel(o, [
    topRow(o, true),
    Row([
      Col([
        T(clamp(o.headline, 64), { key: 'h', fontSize: 48, fontWeight: 800, letterSpacing: '-1.6px', lineHeight: 1.05 }),
        o.sub ? T(clamp(o.sub, 90), { key: 's', fontSize: 27, fontWeight: 700, marginTop: '12px' }) : null,
        stats.length ? Row(stats, { key: 'st', marginTop: '16px', flexWrap: 'wrap' }) : null,
      ].filter(Boolean), { key: 'l', flex: 1, minWidth: 0 }),
      Col([
        T(fig, { key: 'f', fontSize: figSize, fontWeight: 800, letterSpacing: '-5px', lineHeight: 0.86 }),
        o.figLabel ? T(titleCase(String(o.figLabel)), { key: 'fl', fontSize: 22, fontWeight: 800, marginTop: '10px' }) : null,
      ].filter(Boolean), { key: 'r', alignItems: 'flex-end', flex: 'none', marginLeft: '36px' }),
    ], { key: 'bot', alignItems: 'flex-end' }),
  ]));
}

// -- LAYOUT C - A LIST ------------------------------------------------------
// Ranked rows, each filled with its own soft pastel (a circuit's banks) or the
// card's (a Top 10). Two columns past four rows when the caller asks for all.
function rowCell(o, r, i, big) {
  return Row([
    T(String(r.pos), { key: 'p', fontSize: big ? 22 : 20, fontWeight: 800, color: D.ink2, width: big ? '46px' : '40px', flex: 'none' }),
    T(clamp(r.name, big ? 40 : 22), { key: 'n', fontSize: big ? 30 : 27, fontWeight: 800, flex: 1 }),
    r.right ? T(String(r.right), { key: 'r', fontSize: 19, fontWeight: 700, color: D.ink2 }) : null,
  ].filter(Boolean), {
    key: 'r' + i, alignItems: 'center', background: soft(r.hue || o.hue), borderRadius: '16px',
    padding: '0 22px', flex: 1, minHeight: 0,
  });
}

function layoutC(o) {
  const rows = o.rows || [];
  const two = o.all && rows.length > 4;
  let grid;
  if (two) {
    const list = rows.slice(0, 8);
    const per = Math.ceil(list.length / 2);
    const cols = [list.slice(0, per), list.slice(per)];
    grid = Row(cols.map(function (c, ci) {
      const cells = c.map(function (r, i) { return rowCell(o, r, ci * per + i, false); });
      // Keep both columns on the same row height when the second is short.
      for (let k = c.length; k < per; k += 1) cells.push(h('div', { key: 'e' + k, style: { display: 'flex', flex: 1 } }));
      return Col(cells, { key: 'c' + ci, flex: 1, minWidth: 0, gap: '10px', marginRight: ci === 0 ? '12px' : '0' });
    }), { key: 'rows', flex: 1, minHeight: 0 });
  } else {
    grid = Col(rows.slice(0, 4).map(function (r, i) { return rowCell(o, r, i, true); }), { key: 'rows', flex: 1, minHeight: 0, gap: '10px' });
  }
  return shell(o, Col([
    topRow(o, false),
    T(clamp(o.headline, 56), { key: 'h', fontSize: 48, fontWeight: 800, letterSpacing: '-1.6px', lineHeight: 1.05, marginTop: '14px' }),
    Row([grid], { key: 'g', flex: 1, minHeight: 0, marginTop: '20px' }),
  ], { key: 'body', flex: 1, minHeight: 0 }));
}

// -- LAYOUT D - THE BRAND --------------------------------------------------
// The site's own card. The three lines in a fixed order, each on a band of its
// own soft pastel, then every category as a soft chip, then the counts.
function layoutD(o) {
  const lines = (o.lines || []).map(function (l, i) {
    return T(l.text, {
      key: 'l' + i, fontSize: o.big || 72, fontWeight: 800, letterSpacing: '-2.6px', lineHeight: 1.05,
      background: soft(l.hue), padding: '4px 24px 10px', borderRadius: '22px', marginBottom: i < o.lines.length - 1 ? '12px' : '0',
    });
  });
  const chips = (o.cats || []).map(function (c, i) {
    return T(c.name, {
      key: 'c' + i, fontSize: 17, fontWeight: 800, background: soft(c.hue), padding: '8px 13px',
      borderRadius: '999px', marginRight: i < o.cats.length - 1 ? '7px' : '0',
    });
  });
  return shell(o, Col([
    Col(lines, { key: 'lines', alignItems: 'flex-start' }),
    Col([
      Row(chips, { key: 'chips' }),
      o.cta ? T(titleCase(o.cta), { key: 'n', fontSize: 22, fontWeight: 700, color: D.mute, marginTop: '22px' }) : null,
    ].filter(Boolean), { key: 'foot' }),
  ], { key: 'body', flex: 1, justifyContent: 'space-between' }));
}

const LAYOUTS = { A: layoutA, B: layoutB, C: layoutC, D: layoutD };

// -- THE ONE ENTRY POINT ----------------------------------------------------
export function stageCardElement(o) {
  return (LAYOUTS[o.layout] || layoutA)(o);
}

export function renderStageCard(o) {
  const dims = o.w && o.ht ? { width: o.w, height: o.ht } : size;
  return new ImageResponse(stageCardElement(o), { width: dims.width, height: dims.height, fonts: stageFonts() });
}
