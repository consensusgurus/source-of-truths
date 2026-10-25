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

// WHITE WITH COLOR (owner, 2026-10-25), the same look as every other share
// card: the Mind Loft row on white, the puzzle on its soft pastel panel, and a
// black button. lib/share-palette is the one source, so the sheet's buttons and
// this card agree.
function brandRow(p) {
  const h = React.createElement;
  return Row([
    h('img', { key: 'm', src: svgURI(markSvg(p.ink, p.hue)), width: 44, height: 44 }),
    T('Mind Loft', { key: 'w', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginLeft: '12px' }),
    T('mindloftdaily.com', { key: 'u', fontSize: 22, fontWeight: 700, color: p.mute, marginLeft: 'auto' }),
  ], { key: 'brand', alignItems: 'center', width: '100%', flex: 'none' });
}

// BESIDE THE GIF: the puzzle's name and long description over a big Accept
// the challenge (owner, 2026-10-23). The whole image is the button: the soft
// pastel panel edge to edge, the call to action as a black pill.
function buttonOnly(p, { name, desc }) {
  const h = React.createElement;
  return Col([
    T(name, { key: 'n', fontSize: 56, fontWeight: 800, letterSpacing: '-1.8px', lineHeight: 1.05 }),
    ...(desc ? [T(clamp(desc, 120), { key: 'd', fontSize: 31, fontWeight: 600, lineHeight: 1.3, marginTop: '10px', maxWidth: '1000px' })] : []),
    Row([
      T('Accept the Challenge', { key: 't', fontSize: 60, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }),
      h('img', { key: 'a', src: arrowURI(p.onCta), width: 56, height: 56, style: { marginLeft: '22px', flexShrink: 0 } }),
    ], { key: 'cta', alignItems: 'center', alignSelf: 'flex-start', marginTop: '40px', background: p.cta, color: p.onCta, borderRadius: '999px', padding: '26px 44px 30px' }),
  ], { width: '1200px', height: '630px', background: p.fill, color: p.onFill, fontFamily: 'Manrope', justifyContent: 'center', padding: '0 96px' });
}

// SENT ON ITS OWN (owner, 2026-10-23): the link is the whole message, so the
// puzzle is the headline. The result sits small above it, the name and long
// description large on the pastel panel, and a full-width button runs across
// the foot.
function detailed(p, { line, name, desc, cta = 'Accept the Challenge' }) {
  const h = React.createElement;
  return Col([
    brandRow(p),
    Col([
      T(line, { key: 'l', fontSize: 28, fontWeight: 700, letterSpacing: '-0.3px' }),
      T(name, { key: 'n', fontSize: 80, fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, marginTop: '10px' }),
      ...(desc ? [T(clamp(desc, 132), { key: 'd', fontSize: 30, fontWeight: 600, lineHeight: 1.28, marginTop: '12px', maxWidth: '980px' })] : []),
    ], { key: 'mid', flex: 1, justifyContent: 'center', width: '100%', background: p.fill, color: p.onFill, borderRadius: '30px', padding: '0 48px', marginTop: '22px' }),
    Row([
      T(cta, { key: 't', fontSize: 40, fontWeight: 800, letterSpacing: '-1px' }),
      h('img', { key: 'a', src: arrowURI(p.onCta), width: 38, height: 38, style: { marginLeft: '18px' } }),
    ], { key: 'btn', width: '100%', alignItems: 'center', justifyContent: 'center', background: p.cta, color: p.onCta, borderRadius: '999px', padding: '20px 0 24px', marginTop: '20px', flex: 'none' }),
  ], { width: '1200px', height: '630px', background: p.ground, color: p.ink, fontFamily: 'Manrope', padding: '44px 72px 52px' });
}

export async function GET(req) {
  const u = new URL(req.url);
  const key = u.searchParams.get('g') || '';
  const run = RUN_CHALLENGES[key] || null;
  const g = DAILY_GAME_MAP[key] || run;
  const c = decodeChallenge(u.searchParams.get('vs') || '');
  const p = sharePalette(g && g.cat ? g.cat : 'Word');
  const opts = { width: size.width, height: size.height, fonts: stageFonts() };
  if (!g || !c) {
    return new ImageResponse(detailed(p, { line: 'Free daily puzzles', name: 'Mind Loft', desc: 'A new set of puzzles every day. No sign-up to play.', cta: 'Play Free' }), opts);
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
