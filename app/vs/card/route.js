import { ImageResponse } from 'next/og';
import React from 'react';
import { stageFonts, glyphURI, markURI, clamp, size, T, Row, Col } from '@/lib/og-stage-card';
import { categoryAccentInkLight } from '@/lib/category-ramp';
import { metricDef, metricLine } from '@/lib/challenge-metric';
import { DAILY_GAME_MAP } from '@/lib/daily-games';
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
const GROUND = '#f4f6f9';
const INK = '#0b0d12';
const MUTE = '#5f6774';
const ARROW = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none"><path d="M4 12h15M13 6l6 6-6 6" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>').toString('base64');

function card({ hue, glyph, line, cta }) {
  const h = React.createElement;
  return Col([
    Row([
      h('img', { key: 'm', src: markURI(hue, INK), width: 44, height: 44 }),
      T('Mind Loft', { key: 'w', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginLeft: '10px' }),
    ], { key: 'brand', alignItems: 'center' }),
    Col([
      ...(glyph ? [h('img', { key: 'g', src: glyph, width: 72, height: 72, style: { marginBottom: '22px' } })] : []),
      T(line, { key: 'l', fontSize: 34, fontWeight: 700, color: MUTE, letterSpacing: '-0.4px', marginBottom: '28px', textAlign: 'center' }),
      pill(hue, cta, 64, 54),
    ], { key: 'mid', flex: 1, alignItems: 'center', justifyContent: 'center' }),
    T('mindloftdaily.com', { key: 'u', fontSize: 24, fontWeight: 700, color: MUTE, justifyContent: 'center' }),
  ], { width: '1200px', height: '630px', background: GROUND, color: INK, fontFamily: 'Manrope', padding: '56px 90px 60px', alignItems: 'center' });
}

function pill(hue, cta, fs, ar) {
  const h = React.createElement;
  return Row([
    T(cta, { key: 't', fontSize: fs, fontWeight: 800, letterSpacing: '-1.5px' }),
    h('img', { key: 'a', src: ARROW, width: ar, height: ar, style: { marginLeft: '24px' } }),
  ], { key: 'pill', alignItems: 'center', background: hue, color: '#ffffff', borderRadius: '999px', padding: '30px 64px 34px', boxShadow: '0 10px 30px rgba(16,24,40,.18)' });
}

// BESIDE THE GIF: the whole image is the button (owner, 2026-10-23). The GIF
// above it already says who scored what, so this says one thing, edge to edge.
// Kept inside a 90px inset because a bubble rounds its corners.
function buttonOnly(hue) {
  const h = React.createElement;
  return Row([
    T('Accept the challenge', { key: 't', fontSize: 82, fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }),
    h('img', { key: 'a', src: ARROW, width: 76, height: 76, style: { marginLeft: '26px', flexShrink: 0 } }),
  ], { width: '1200px', height: '630px', background: hue, color: '#ffffff', fontFamily: 'Manrope', alignItems: 'center', justifyContent: 'center', padding: '0 90px' });
}

// SENT ON ITS OWN: the link is the whole message, so it carries the detail.
function detailed({ hue, glyph, line, sub }) {
  const h = React.createElement;
  return Col([
    Row([
      h('img', { key: 'm', src: markURI(hue, INK), width: 40, height: 40 }),
      T('Mind Loft', { key: 'w', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginLeft: '10px' }),
      ...(glyph ? [h('img', { key: 'g', src: glyph, width: 48, height: 48, style: { marginLeft: 'auto' } })] : []),
    ], { key: 'brand', alignItems: 'center', width: '100%' }),
    Col([
      T(line, { key: 'l', fontSize: line.length <= 30 ? 70 : line.length <= 42 ? 60 : 50, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.06, textAlign: 'center', justifyContent: 'center' }),
      T(sub, { key: 's', fontSize: 34, fontWeight: 700, color: MUTE, marginTop: '14px', marginBottom: '30px' }),
      pill(hue, 'Accept the challenge', 52, 44),
    ], { key: 'mid', flex: 1, alignItems: 'center', justifyContent: 'center' }),
  ], { width: '1200px', height: '630px', background: GROUND, color: INK, fontFamily: 'Manrope', padding: '52px 90px 60px', alignItems: 'center' });
}

export async function GET(req) {
  const u = new URL(req.url);
  const key = u.searchParams.get('g') || '';
  const run = RUN_CHALLENGES[key] || null;
  const g = DAILY_GAME_MAP[key] || run;
  const c = decodeChallenge(u.searchParams.get('vs') || '');
  const hue = categoryAccentInkLight(g && g.cat ? g.cat : 'Word');
  const opts = { width: size.width, height: size.height, fonts: stageFonts() };
  if (!g || !c) {
    return new ImageResponse(card({ hue, glyph: null, line: 'Free daily puzzles. No sign-up to play.', cta: 'Play free' }), opts);
  }
  if (u.searchParams.get('m') === '1') return new ImageResponse(buttonOnly(hue), opts);
  const name = clamp(c.name, 20);
  const fig = challengeFig(c, key);
  const blank = !run && isBlankMiss(c);
  const byMetric = !run && c.m != null && !!metricDef(key);
  const line = blank ? `${name} could not crack ${g.name}.`
    : run ? (c.o ? `${name} scored ${c.s}/${c.o} on ${run.the}.` : `${name} scored ${c.s} on ${run.the}.`)
    : byMetric ? metricLine(key, name, g.name, fig)
    : c.won && c.t != null ? `${name} solved ${g.name} in ${clamp(fig, 18)}.`
    : c.won ? `${name} solved ${g.name}: ${clamp(fig, 18)}.` : `${name} scored ${clamp(fig, 18)} on ${g.name}.`;
  const sub = blank ? 'Can you?' : 'Can you beat that?';
  const glyph = run ? null : glyphURI(key, hue, 48);
  return new ImageResponse(detailed({ hue, glyph, line, sub }), opts);
}
