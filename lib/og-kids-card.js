// THE MIND LOFT KIDS SHARE CARD.
//
// Every /kids link (the hub and every kids game, which point openGraph.images
// at /kids/opengraph-image) shares this card. It wears the KIDS page, not the
// grown-up Stage: butter ground with the dot pattern, Fredoka and Nunito, the
// house-and-brain mark, the tilted yellow Kids tag, and the six shapes from the
// hub's confetti. The words are the old card's words, unchanged.
//
// Colours are the kd tokens from app/kids/KidsShell.jsx (KIDS_CSS), copied as
// resolved hex because Satori cannot read CSS custom properties. Fonts are
// committed woffs in lib/og-fonts (listed in next.config.js
// outputFileTracingIncludes), never fetched: a network font is a 500 waiting.

import { ImageResponse } from 'next/og';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { SHARE_HOST } from './site.js';

const h = React.createElement;
const K = {
  bg: '#fff6e0', dot: '#f3e3b5', paper: '#ffffff', ink: '#1b1f3b', ink2: '#4a4f6e',
  line: '#ecdfbd', shadow: '#e9d9ad', blue: '#3a86ff', red: '#ff5a5f', yellow: '#ffd23f',
};
const DISP = 'Fredoka';
const BODY = 'Nunito';

const SHAPES = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#ff5a5f"/><circle cx="14" cy="14" r="4" fill="#fff" opacity=".55"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 3l5 11 12 1.5-9 8 2.6 12L20 29.5 9.4 35.5 12 23.5l-9-8L15 14z" fill="#ffd23f" stroke="#e6b400" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 35S4 25 4 14a8 8 0 0116-3 8 8 0 0116 3c0 11-16 21-16 21z" fill="#ff7bb0"/><circle cx="13" cy="13" r="3" fill="#fff" opacity=".5"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 5L37 34H3z" fill="#3bb273" stroke="#2f9a60" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="6" y="6" width="28" height="28" rx="6" fill="#3a86ff"/><rect x="10" y="10" width="9" height="9" rx="3" fill="#fff" opacity=".45"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 3l16 17-16 17L4 20z" fill="#8e5ae0" stroke="#7345c4" stroke-width="1.5" stroke-linejoin="round"/></svg>',
];

// KidsMark from app/kids/KidsShell.jsx: a roof, a floor, the blue brain.
const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M20 52l40-34 40 34" stroke="#1b1f3b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 102h92" stroke="#1b1f3b" stroke-width="6" stroke-linecap="round"/><g transform="translate(31,48) scale(0.53)"><path d="M14 42C12 28 22 16 36 16C40 8 54 6 60 14C70 8 84 14 86 26C96 30 98 44 88 50C92 58 86 66 76 64C74 72 64 74 60 66C48 70 36 66 32 56C20 56 12 50 14 42Z" fill="#3a86ff"/></g></svg>';

const uri = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

let FONTS = null;
function kidsFonts() {
  if (FONTS) return FONTS;
  const rd = (f) => { try { return fs.readFileSync(path.join(process.cwd(), 'lib', 'og-fonts', f)); } catch (e) { return null; } };
  FONTS = [
    [DISP, 700, 'fredoka-latin-700-normal.woff'],
    [DISP, 600, 'fredoka-latin-600-normal.woff'],
    [BODY, 800, 'nunito-latin-800-normal.woff'],
    [BODY, 700, 'nunito-latin-700-normal.woff'],
  ].map(([name, weight, f]) => ({ name, weight, style: 'normal', data: rd(f) })).filter((f) => f.data);
  return FONTS;
}

const box = (style, kids, key) => h('div', { key, style: Object.assign({ display: 'flex' }, style) }, kids);

export function kidsCardElement() {
  const host = SHARE_HOST.replace(/^https?:\/\//, '');
  // Two rows of three, each shape a little tilted, like the hub's confetti.
  const tilt = [-8, 6, -4, 7, -6, 5];
  const shapes = SHAPES.map((s, i) => box({
    width: '112px', height: '112px', alignItems: 'center', justifyContent: 'center',
    transform: 'rotate(' + tilt[i] + 'deg)', margin: '10px',
  }, h('img', { src: uri(s), width: 112, height: 112 }), 's' + i));

  // The hub's dotted butter ground, as one SVG behind everything: Satori does
  // not tile a radial-gradient background.
  let dots = '';
  for (let y = 15; y < 630; y += 30) for (let x = 15; x < 1200; x += 30) dots += '<circle cx="' + x + '" cy="' + y + '" r="2.2"/>';
  const ground = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="' + K.bg + '"/><g fill="' + K.dot + '">' + dots + '</g></svg>';

  return box({ width: '1200px', height: '630px', position: 'relative', background: K.bg, color: K.ink, fontFamily: BODY }, [
    h('img', { key: 'g', src: uri(ground), width: 1200, height: 630, style: { position: 'absolute', left: 0, top: 0 } }),
    box({ position: 'absolute', left: '60px', top: '46px', width: '1080px', height: '540px', flexDirection: 'column' }, [
    // The page header: mark, wordmark with Loft in blue, the tilted Kids tag.
    box({ alignItems: 'center' }, [
      h('img', { key: 'm', src: uri(MARK), width: 64, height: 64 }),
      box({ fontFamily: DISP, fontWeight: 700, fontSize: 44, marginLeft: '12px', letterSpacing: '-0.5px' }, [
        box({}, 'Mind', 'a'), box({ color: K.blue, marginLeft: '11px' }, 'Loft', 'b'),
      ], 'wm'),
      box({
        fontFamily: DISP, fontWeight: 700, fontSize: 26, background: K.yellow, color: K.ink,
        padding: '5px 18px', borderRadius: '999px', transform: 'rotate(-3deg)', marginLeft: '14px',
      }, 'Kids', 'tag'),
    ], 'hdr'),

    box({ height: '380px', alignItems: 'center', justifyContent: 'space-between' }, [
      box({ flexDirection: 'column', width: '660px' }, [
        box({ flexDirection: 'column', fontFamily: DISP, fontWeight: 700, fontSize: 84, lineHeight: 1.02, letterSpacing: '-1px' }, [
          box({}, 'Little puzzles,', 'l1'),
          box({ color: K.red }, 'big thinking.', 'l2'),
        ], 'hl'),
        box({ fontSize: 27, fontWeight: 700, color: K.ink2, lineHeight: 1.35, marginTop: '20px' },
          'Six gentle puzzles a day that get kids counting, sorting, spotting patterns and reasoning things out. No sign-up, no ads, nothing counts against them.', 'sub'),
      ], 'words'),
      box({ flexWrap: 'wrap', width: '396px', justifyContent: 'center' }, shapes, 'conf'),
    ], 'body'),

    box({ justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '18px', borderTop: '3px solid ' + K.line }, [
      box({ fontFamily: DISP, fontWeight: 600, fontSize: 28, color: K.ink2 }, host + '/kids', 'u'),
      box({
        fontFamily: DISP, fontWeight: 700, fontSize: 26, background: K.paper, color: K.ink,
        border: '3px solid ' + K.ink, borderRadius: '999px', padding: '8px 24px', boxShadow: '0 5px 0 ' + K.ink,
      }, 'Free · for ages 5 and up', 'c'),
    ], 'foot'),
    ], 'in'),
  ], 'card');
}

export function renderKidsCardImage() {
  return new ImageResponse(kidsCardElement(), { width: 1200, height: 630, fonts: kidsFonts() });
}

export { kidsFonts };
