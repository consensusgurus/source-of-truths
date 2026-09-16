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
//    declaration silently. Every colour below is a literal, taken from the DARK
//    register of app/globals.css as a JS value. A card is a baked PNG and cannot
//    follow a register, so it is always dark. That is also the right call in a
//    timeline, where near-black with one bright step is the only card in the
//    column that is not white.
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
import { CATEGORY_RAMP, RAMP_ORDER, RAMP_INK } from './category-ramp.js';

export const size = { width: 1200, height: 630 };
export const square = { width: 1080, height: 1080 };
export const contentType = 'image/png';

const h = React.createElement;

// -- THE DARK REGISTER, AS LITERALS -----------------------------------------
// From the .stage-page block in app/globals.css. Kept as a frozen object rather
// than imported from a token module on purpose: these must be resolved hex by
// the time Satori sees them, and a var() that silently becomes nothing is the
// failure this whole file is written around.
export const D = Object.freeze({
  ground: '#0b0f1a',
  raise: '#0e131f',
  // --stg-surf and the line tokens are white at 4.5% / 11% / 17% in the app.
  // A card is always on the same known ground, so they are pre-composited to
  // opaque hex here. Same rendered colour, one less thing Satori can get wrong.
  surf: '#151922',
  surf2: '#1d222c',
  line: '#252b36',
  line2: '#333a47',
  ink: '#e9edf4',
  ink2: '#aab5c7',
  mute: '#8b95a8',
  mute2: '#78859d',
  onramp: RAMP_INK,
  brand: '#7dd3fc',
  // --stg-good, the dark register's "cleared" step. A card only needs the
  // positive one: a share card never reports a failure.
  good: '#6ee7b7',
});

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
const BRAIN = 'M14 42C12 28 22 16 36 16C40 8 54 6 60 14C70 8 84 14 86 26C96 30 98 44 88 50'
  + 'C92 58 86 66 76 64C74 72 64 74 60 66C48 70 36 66 32 56C20 56 12 50 14 42Z';

function svgURI(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// The Mind Loft mark: caret and floor line in ink, brain in the category step.
// Same geometry as app/MindLoftMark.jsx. If that moves, move this with it.
export function markURI(hue, ink) {
  return svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">'
    + '<path d="M20 52l40-34 40 34" stroke="' + (ink || D.ink) + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    + '<path d="M14 102h92" stroke="' + (ink || D.ink) + '" stroke-width="6" stroke-linecap="round"/>'
    + '<g transform="translate(31,48) scale(0.53)"><path d="' + BRAIN + '" fill="' + hue + '"/></g></svg>');
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
export const mono = function (extra) {
  return Object.assign({ fontFamily: MONO, fontWeight: 400 }, extra);
};

export function clamp(s, n) {
  const v = String(s == null ? '' : s);
  return v.length > n ? v.slice(0, n - 1).trimEnd() + '…' : v;
}

// -- THE CHROME -------------------------------------------------------------
// A full-bleed band in the category step, the mark and wordmark with the second
// word in that step, a mono eyebrow, and a footer split between the URL and one
// instruction. Identical on every route, which is the point: it replaces the
// 9px #0b0c0e -> #1e3a8a -> #2563eb gradient, which belonged to the Loft brand
// rather than to the Stage.
export function shell(o, body) {
  const w = o.w || 1200;
  const ht = o.ht || 630;
  const pad = o.pad || 56;
  const band = o.band || 10;
  const markPx = o.markPx || 54;
  return h('div', {
    style: {
      width: w + 'px', height: ht + 'px', display: 'flex', flexDirection: 'column',
      background: D.ground, color: D.ink, fontFamily: SANS,
    },
  }, [
    h('div', { key: 'band', style: { display: 'flex', width: w + 'px', height: band + 'px', background: o.hue, flex: 'none' } }),
    Col([
      Row([
        Row([
          h('img', { key: 'mk', src: markURI(o.hue), width: markPx, height: markPx }),
          Row([
            T('Mind', { key: 'a' }),
            T('Loft', { key: 'b', color: o.hue, marginLeft: '10px' }),
          ], { key: 'wm', fontSize: 30, fontWeight: 800, letterSpacing: '-0.3px', marginLeft: '13px', alignItems: 'center' }),
        ], { key: 'brand', alignItems: 'center', paddingRight: '22px', borderRight: '1px solid ' + D.line }),
        T(String(o.eyebrow || '').toUpperCase(), mono({ key: 'eb', fontSize: 17, letterSpacing: '2.7px', color: D.mute, marginLeft: '16px' })),
      ], { key: 'cap', alignItems: 'center' }),
      body,
      Row([
        T(o.url, mono({ key: 'u', fontSize: 19, letterSpacing: '0.9px', color: D.ink2 })),
        T(String(o.cta || '').toUpperCase(), mono({ key: 'c', fontSize: 17, letterSpacing: '2.4px', color: o.hue })),
      ], { key: 'foot', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid ' + D.line }),
    ], { key: 'in', flex: 1, justifyContent: 'space-between', padding: pad + 'px ' + pad + 'px ' + (pad - 8) + 'px' }),
  ]);
}

// -- LAYOUT A - GLYPH -------------------------------------------------------
// The category is a tile, the game is the words. Every daily puzzle, plus the
// site-level cards, which pass no glyph and let the headline take the width.
function layoutA(o) {
  const uri = o.glyph ? glyphURI(o.glyph, o.hue) : null;
  const tile = uri
    ? Row([
      h('div', { key: 'rule', style: { display: 'flex', width: '8px', height: '196px', background: o.hue, borderRadius: '4px 0 0 4px' } }),
      h('div', {
        key: 'box',
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
          width: '188px', height: '196px', borderRadius: '0 18px 18px 0', background: D.surf,
          borderTop: '1px solid ' + D.line, borderRight: '1px solid ' + D.line, borderBottom: '1px solid ' + D.line,
        },
      }, h('img', { src: uri, width: 116, height: 116 })),
    ], { key: 'tile', flex: 'none', marginRight: '44px' })
    : null;
  const words = Col([
    T(o.headline, Object.assign({ key: 'h', fontSize: o.big || (uri ? 92 : 100), fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.0 }, o.headMax ? { maxWidth: o.headMax } : {})),
    T(clamp(o.sub, 170), { key: 's', fontSize: 29, fontWeight: 600, color: D.ink2, marginTop: '16px', lineHeight: 1.25, maxWidth: uri ? '640px' : '940px' }),
  ], { key: 'w', minWidth: 0 });
  return shell(o, Row(tile ? [tile, words] : [words], { key: 'body', alignItems: 'center' }));
}

// -- LAYOUT B - FIGURE ------------------------------------------------------
// A result to beat. The figure sits in a full-bleed curtain in the category
// step with onramp ink, the same move StageFinish makes in the app, so the card
// and the screen behind it read as one thing. Nothing in the curtain is dimmed
// with opacity (CLAUDE.md rule 1): hierarchy is size and weight, which is also
// what keeps the three warm steps legible.
function layoutB(o) {
  const pad = o.pad || 56;
  return shell(o, Col([
    Row([
      Col([
        T(clamp(o.headline, 64), { key: 'h', fontSize: 38, fontWeight: 800, letterSpacing: '-1.1px', lineHeight: 1.05 }),
        T(clamp(o.sub, 90), { key: 's', fontSize: 22, fontWeight: 700, marginTop: '10px' }),
      ], { key: 'l', flex: 1, minWidth: 0 }),
      Col([
        T(String(o.figure), { key: 'f', fontSize: o.figSize || 108, fontWeight: 800, letterSpacing: '-4px', lineHeight: 0.92 }),
        T(String(o.figLabel || '').toUpperCase(), { key: 'fl', fontSize: 21, fontWeight: 700, marginTop: '9px', letterSpacing: '0.4px' }),
      ], { key: 'r', alignItems: 'flex-end', flex: 'none', marginLeft: '30px' }),
    ], { key: 'curtain', alignItems: 'flex-end', background: o.hue, color: D.onramp, padding: '34px ' + pad + 'px 32px' }),
    Row((o.stats || []).map(function (s, i) {
      return Col([
        T(String(s[0]), { key: 'v', fontSize: 32, fontWeight: 800, letterSpacing: '-0.6px' }),
        T(String(s[1]).toUpperCase(), mono({ key: 'l', fontSize: 15, letterSpacing: '2.1px', color: D.mute2, marginTop: '6px' })),
      ], { key: 's' + i, marginRight: '44px' });
    }), { key: 'stats', padding: '26px ' + pad + 'px 0' }),
  ], { key: 'body', margin: '0 -' + pad + 'px' }));
}

// -- LAYOUT C - LIST --------------------------------------------------------
// Ranked rows. Each row takes the left rule the Stage uses everywhere else, in
// its own hue when it has one (a circuit's banks) or the card's when it does
// not (a Top 10).
function layoutC(o) {
  return shell(o, Col([
    T(clamp(o.headline, 52), { key: 'h', fontSize: 52, fontWeight: 800, letterSpacing: '-1.6px', lineHeight: 1.05 }),
    Col((o.rows || []).slice(0, 4).map(function (r, i) {
      return Row([
        T(String(r.pos), mono({ key: 'p', fontSize: 24, color: D.mute, width: '46px' })),
        T(clamp(r.name, 40), { key: 'n', fontSize: 31, fontWeight: 700, flex: 1 }),
        T(String(r.right || ''), mono({ key: 'r', fontSize: 23, color: r.hue || o.hue })),
      ], {
        key: 'r' + i, alignItems: 'center', background: D.surf, borderRadius: '12px',
        border: '1px solid ' + D.line, borderLeft: '6px solid ' + (r.hue || o.hue),
        padding: '15px 22px', marginBottom: '9px',
      });
    }), { key: 'rows', marginTop: '18px' }),
  ], { key: 'body' }));
}

const LAYOUTS = { A: layoutA, B: layoutB, C: layoutC };

// -- THE ONE ENTRY POINT ----------------------------------------------------
export function stageCardElement(o) {
  return (LAYOUTS[o.layout] || layoutA)(o);
}

export function renderStageCard(o) {
  const dims = o.w && o.ht ? { width: o.w, height: o.ht } : size;
  return new ImageResponse(stageCardElement(o), { width: dims.width, height: dims.height, fonts: stageFonts() });
}
