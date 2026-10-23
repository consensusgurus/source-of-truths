import { ImageResponse } from 'next/og';
import React from 'react';
import { stageFonts, clamp, size, T, Row, Col } from '@/lib/og-stage-card';
import { sharePalette, markSvg } from '@/lib/share-palette';
import { metricDef, metricLine } from '@/lib/challenge-metric';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
import { circuitById } from '@/lib/circuits';
import { decodeChallenge, challengeFig, mmssOf, RUN_CHALLENGES, isBlankMiss } from '@/lib/challenge';

// THE CHALLENGE LINK'S PREVIEW (owner, 2026-10-07): what a messaging app draws
// when the link is pasted. It names the sender and the figure, never the answer.
//
// Two earlier cuts split the name and the time into separate figures; in an
// iMessage bubble neither read as a sentence. It is one sentence now.
export const runtime = 'nodejs';

// THE LINK IS THE BUTTON (owner, 2026-10-23). A share now arrives as two
// bubbles: the meme GIF says what happened, and this card, the link's preview,
// says what to do about it. So it is a button and nothing else: one pill in the
// same category colour as the GIF's game strip (categoryAccentInkLight, the
// colour MemeShare paints it), on the light register's ground, with one small
// line naming the score to beat. The score is not repeated as a headline: the
// GIF already carries it, and the page title prints under the card.
//
// SAFE ZONE: iMessage rounds the bubble's corners and wraps the image at about
// 2:1 or it drops to a thumbnail, so the card stays 1200x630 and every mark sits
// well inside a 90px inset.
const svgURI = (svg) => 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const arrowURI = (col) => svgURI('<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="' + col + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>');

// TWO SETS, LIGHT AND DARK (owner, 2026-10-23), from lib/share-palette, the
// same one the GIF draws with, so the card always matches the GIF beside it.
// The arrow is drawn, not typed: Manrope's latin subset has no U+2192, and a
// missing glyph makes Satori fetch a font over the network.

function pill(p, cta, fs, ar) {
  const h = React.createElement;
  return Row([
    T(cta, { key: 't', fontSize: fs, fontWeight: 800, letterSpacing: '-1.5px' }),
    h('img', { key: 'a', src: arrowURI(p.onFill), width: ar, height: ar, style: { marginLeft: '24px' } }),
  ], { key: 'pill', alignItems: 'center', background: p.fill, color: p.onFill, borderRadius: '999px', padding: '26px 60px 30px' });
}

// The Mind Loft row: mark and name on the left, the address on the right
// (where the game glyph used to sit, now given to the name and description).
function brandRow(p) {
  const h = React.createElement;
  return Row([
    h('img', { key: 'm', src: svgURI(markSvg(p.ink, p.fill)), width: 40, height: 40 }),
    T('Mind Loft', { key: 'w', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginLeft: '10px' }),
    T('mindloftdaily.com', { key: 'u', fontSize: 22, fontWeight: 700, color: p.mute, marginLeft: 'auto' }),
  ], { key: 'brand', alignItems: 'center', width: '100%' });
}

// BESIDE THE GIF: the puzzle's name and long description over a big Accept
// the challenge, on the category fill (owner, 2026-10-23). The GIF carries the
// result and the Mind Loft row, so this card carries the game and the action.
function buttonOnly(p, { name, desc }) {
  const h = React.createElement;
  return Col([
    T(name, { key: 'n', fontSize: 52, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.05 }),
    ...(desc ? [T(desc, { key: 'd', fontSize: 32, fontWeight: 600, lineHeight: 1.3, marginTop: '10px', maxWidth: '1000px' })] : []),
    Row([
      T('Accept the challenge', { key: 't', fontSize: 78, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }),
      h('img', { key: 'a', src: arrowURI(p.onFill), width: 72, height: 72, style: { marginLeft: '26px', flexShrink: 0 } }),
    ], { key: 'cta', alignItems: 'center', marginTop: '48px' }),
  ], { width: '1200px', height: '630px', background: p.fill, color: p.onFill, fontFamily: 'Manrope', justifyContent: 'center', padding: '0 96px' });
}

// SENT ON ITS OWN: the link is the whole message, so it carries the result,
// the game's name and its long description, and the button.
function detailed(p, { line, name, desc }) {
  const big = line.length <= 30 ? 64 : line.length <= 42 ? 56 : 48;
  return Col([
    brandRow(p),
    Col([
      T(line, { key: 'l', fontSize: big, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.06, textAlign: 'center', justifyContent: 'center' }),
      Col([
        T(name, { key: 'n', fontSize: 32, fontWeight: 800, color: p.ink, justifyContent: 'center' }),
        ...(desc ? [T(desc, { key: 'd', fontSize: 28, fontWeight: 600, color: p.mute, textAlign: 'center', justifyContent: 'center', marginTop: '4px', lineHeight: 1.25 })] : []),
      ], { key: 'gm', alignItems: 'center', marginTop: '22px', marginBottom: '30px', maxWidth: '960px' }),
      pill(p, 'Accept the challenge', 46, 40),
    ], { key: 'mid', flex: 1, alignItems: 'center', justifyContent: 'center' }),
  ], { width: '1200px', height: '630px', background: p.ground, color: p.ink, fontFamily: 'Manrope', padding: '50px 90px 56px', alignItems: 'center' });
}

export async function GET(req) {
  const u = new URL(req.url);
  const key = u.searchParams.get('g') || '';
  const run = RUN_CHALLENGES[key] || null;
  const g = DAILY_GAME_MAP[key] || run;
  const c = decodeChallenge(u.searchParams.get('vs') || '');
  const p = sharePalette(g && g.cat ? g.cat : 'Word', u.searchParams.get('t') === 'd');
  const opts = { width: size.width, height: size.height, fonts: stageFonts() };
  if (!g || !c) {
    return new ImageResponse(detailed(p, { line: 'Free daily puzzles.', name: 'Mind Loft', desc: 'No sign-up to play.' }), opts);
  }
  const name = clamp(c.name, 20);
  const fig = challengeFig(c, key);
  const blank = !run && isBlankMiss(c);
  const byMetric = !run && c.m != null && !!metricDef(key);
  const line = blank ? `${name} could not crack ${g.name}.`
    : run ? (c.o ? `${name} scored ${c.s}/${c.o} on ${run.the}.` : `${name} scored ${c.s} on ${run.the}.`)
    : byMetric ? metricLine(key, name, g.name, fig)
    : c.won && c.t != null ? `${name} solved ${g.name} in ${clamp(fig, 18)}.`
    : c.won ? `${name} solved ${g.name}: ${clamp(fig, 18)}.` : `${name} scored ${clamp(fig, 18)} on ${g.name}.`;
  const desc = run ? ((circuitById(key) || {}).blurb || '') : (g.tagLong || g.tag || '');
  if (u.searchParams.get('m') === '1') return new ImageResponse(buttonOnly(p, { name: g.name, desc }), opts);
  return new ImageResponse(detailed(p, { line, name: g.name, desc }), opts);
}
