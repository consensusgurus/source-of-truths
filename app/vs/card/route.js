import { ImageResponse } from 'next/og';
import React from 'react';
import { stageFonts, clamp, size, T, Row, Col } from '@/lib/og-stage-card';
import { sharePalette, markSvg } from '@/lib/share-palette';
import { metricDef } from '@/lib/challenge-metric';
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
function buttonOnly(p, { name, desc, who, stats }) {
  const h = React.createElement;
  return Col([
    T(name, { key: 'n', fontSize: 54, fontWeight: 800, letterSpacing: '-1.8px', lineHeight: 1.05 }),
    ...(desc ? [T(clamp(desc, 110), { key: 'd', fontSize: 29, fontWeight: 600, lineHeight: 1.3, marginTop: '10px', maxWidth: '1000px' })] : []),
    Row([
      T('Accept the Challenge', { key: 't', fontSize: 58, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0 }),
      h('img', { key: 'a', src: arrowURI(p.onCta), width: 54, height: 54, style: { marginLeft: '22px', flexShrink: 0 } }),
    ], { key: 'cta', alignItems: 'center', alignSelf: 'flex-start', marginTop: '34px', background: p.cta, color: p.onCta, borderRadius: '999px', padding: '24px 44px 28px' }),
    // WHO AND WHAT TO BEAT, under the button (owner, 2026-10-25): the GIF beside
    // it says what happened, this line says whose score it is.
    ...(who ? [Row([
      T(who, { key: 'w', fontSize: 36, fontWeight: 800, letterSpacing: '-0.8px' }),
      ...(stats ? [T(stats, { key: 's', fontSize: 36, fontWeight: 600, marginLeft: '16px', opacity: 0.85 })] : []),
    ], { key: 'who', alignItems: 'center', marginTop: '28px' })] : []),
  ], { width: '1200px', height: '630px', background: p.fill, color: p.onFill, fontFamily: 'Manrope', justifyContent: 'center', padding: '0 96px' });
}

// SENT ON ITS OWN (owner, 2026-10-23): the link is the whole message, so the
// puzzle is the headline. The result sits small above it, the name and long
// description large on the pastel panel, and a full-width button runs across
// the foot.
function detailed(p, { line, desc, cta = 'Accept the Challenge' }) {
  const h = React.createElement;
  return Col([
    brandRow(p),
    Col([
      T(clamp(line, 90), { key: 'l', fontSize: 58, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.08, maxWidth: '1000px' }),
      Row([
        T(cta, { key: 't', fontSize: 44, fontWeight: 800, letterSpacing: '-1.2px', lineHeight: 1, whiteSpace: 'nowrap' }),
        h('img', { key: 'a', src: arrowURI(p.onCta), width: 42, height: 42, style: { marginLeft: '18px' } }),
      ], { key: 'btn', alignItems: 'center', alignSelf: 'flex-start', background: p.cta, color: p.onCta, borderRadius: '999px', padding: '22px 40px 26px', marginTop: '28px' }),
      ...(desc ? [T(clamp(desc, 120), { key: 'd', fontSize: 28, fontWeight: 600, lineHeight: 1.3, marginTop: '24px', maxWidth: '1000px' })] : []),
    ], { key: 'mid', flex: 1, justifyContent: 'center', width: '100%', background: p.fill, color: p.onFill, borderRadius: '30px', padding: '0 52px', marginTop: '22px' }),
  ], { width: '1200px', height: '630px', background: p.ground, color: p.ink, fontFamily: 'Manrope', padding: '44px 64px 52px' });
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
    return new ImageResponse(detailed(p, { line: 'Free daily puzzles on Mind Loft.', desc: 'A new set of puzzles every day. No sign-up to play.', cta: 'Play Free' }), opts);
  }
  const name = clamp(c.name, 20);
  const fig = challengeFig(c, key);
  const blank = !run && isBlankMiss(c);
  // ONE SENTENCE, THE DARE (owner, 2026-10-25): "Gator85 challenges you to
  // beat 61 right on the Trivia Encore."
  const target = run ? (run.unit === 'right' ? `${c.s} right` : c.o ? `${c.s}/${c.o}` : `${c.s} points`) : clamp(fig, 18);
  const line = blank ? `${name} challenges you to crack ${g.name}.`
    : `${name} challenges you to beat ${target} on ${run ? run.the : g.name}.`;
  const time = c.t != null && !(c.won && !run && fig === mmssOf(c.t)) ? mmssOf(c.t) : null;
  const shown = !run && c.won && c.t != null && fig === mmssOf(c.t) ? `solved in ${fig}` : target;
  const stats = blank ? 'could not crack it' : [shown, c.x && run ? clamp(c.x, 24) : null, time].filter(Boolean).join(' · ');
  const desc = run ? ((circuitById(key) || {}).blurb || '') : (g.tagLong || g.tag || '');
  if (u.searchParams.get('m') === '1') return new ImageResponse(buttonOnly(p, { name: g.name, desc, who: name, stats }), opts);
  return new ImageResponse(detailed(p, { line, desc }), opts);
}
