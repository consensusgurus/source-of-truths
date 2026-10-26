import { createElement as h } from 'react';
import { ImageResponse } from 'next/og';
import { stageFonts } from '@/lib/og-stage-card';
import { W, d, chip, cta, frame } from '@/lib/og-run-card';
import { PRICE_KEYS, PRICE_GAMES, runRankOf, runTierOf, RUN_RANKS, RUN_RANKS_V2, RUN_RANKS_V3, ranksByTag } from '@/lib/price-games';

// PRICE CHECK'S SHARE CARD (owner, 2026-10-01: "it needs a great share card").
// A result card carries the player's payment card from the run's ending: the
// Shoppers ladder, prepaid up to black (RUN_RANKS in lib/price-games).
// One route draws both: with no ?s it is the invite (the five tags, every
// price a row of question marks), and with ?s=8-10-6-5-5 it is a result,
// the run's own departures board with each tag's points and the total. It
// never carries a price, so a shared card cannot spoil the day.
export const runtime = 'nodejs';

// WHITE WITH COLOR (owner, 2026-10-25): lib/og-run-card draws the frame; the
// price board sits on the Numbers pastel with white flaps and ink digits.
// Manrope only. The payment card keeps its own faces.
const CAT = 'Numbers';
const URL_TXT = 'mindloftdaily.com/pricecheck';

function flap(ch, big) {
  const w = big ? 48 : 34, hgt = big ? 66 : 46, fs = big ? 44 : 30;
  return d({ width: w, height: hgt, borderRadius: 7, background: '#ffffff', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: fs, fontWeight: 800, color: ch === '?' ? W.faint : W.ink, flexShrink: 0 },
    ch,
    d({ position: 'absolute', left: 0, right: 0, top: hgt / 2, height: 1.5, background: 'rgba(11,13,18,0.12)' }));
}

// The run's payment card, one face per Shoppers tier (sharpest first).
const PAY = [
  { bg: 'linear-gradient(140deg, #2b2b30 0%, #0c0c0f 60%, #1e1e23 100%)', ink: '#e9cf7f' },
  { bg: 'linear-gradient(135deg, #ffe9a8 0%, #e6b532 45%, #a97a10 100%)', ink: '#2a1f04' },
  { bg: 'linear-gradient(135deg, #5b8ff0 0%, #2f6fe4 40%, #163a8c 100%)', ink: '#ffffff' },
  { bg: 'linear-gradient(160deg, #4b5a6e 0%, #36424f 100%)', ink: '#e7edf4' },
  { bg: '#fbfaf6', ink: '#22252b' },
];
function payCard(ti, rank, total, max) {
  const f = PAY[ti];
  const prepaid = ti === PAY.length - 1;
  const chipEl = d({ width: 44, height: 34, borderRadius: 7, background: ti >= 3 ? 'linear-gradient(135deg, #eef0f4 0%, #a7adb8 55%, #dfe2e8 100%)' : 'linear-gradient(135deg, #f6dc8a 0%, #c9a227 55%, #f2d272 100%)' });
  return d({ flexDirection: 'column', justifyContent: 'space-between', width: 300, height: 184, borderRadius: 16, background: f.bg, color: f.ink, padding: prepaid ? '30px 22px 18px' : '18px 22px', position: 'relative', overflow: 'hidden', transform: 'rotate(-4deg)', boxShadow: '0 16px 32px rgba(11,13,18,0.22)', border: prepaid ? `1px solid ${W.line}` : 'none' },
    prepaid ? d({ position: 'absolute', left: 0, right: 0, top: 0, height: 20, background: 'linear-gradient(90deg, #ff6b3d 0%, #ffb02e 25%, #28c08a 50%, #3d8bff 75%, #c560ff 100%)' }) : null,
    d({ justifyContent: 'space-between', fontSize: 14, fontWeight: 800 },
      d({}, 'Mind Loft'),
      d({ color: prepaid ? '#e2522a' : f.ink }, rank[3])),
    d({ alignItems: 'center', gap: 14 }, chipEl,
      prepaid ? d({ flexDirection: 'column', fontSize: 11, fontWeight: 800, color: '#6b7280' }, 'Balance', d({ fontSize: 20, fontWeight: 800, color: '#dc2626' }, '$0.00')) : null),
    d({ fontSize: 26, fontWeight: 800, letterSpacing: -1 }, rank[1]),
    d({ alignItems: 'baseline', fontSize: 24, fontWeight: 800 }, String(total), d({ fontSize: 15, fontWeight: 700, opacity: 0.7, marginLeft: 6 }, `/ ${max}`)));
}

function card(scores, ranks = RUN_RANKS_V3) {
  const res = Array.isArray(scores);
  const total = res ? scores.reduce((a, b) => a + b, 0) : null;
  const max = PRICE_KEYS.length * 10;
  const rank = res ? runRankOf(Math.round(total * 50 / max), ranks) : null;
  const rows = PRICE_KEYS.map((k, i) => {
    const g = PRICE_GAMES[k];
    const v = res ? String(scores[i] ?? 0).padStart(2, '0') : '??';
    return d({ alignItems: 'center', gap: 16, padding: '4px 0' },
      d({ width: 150, padding: '6px 12px 6px 20px', borderRadius: '7px 10px 10px 7px', background: g.tagDark, color: W.ink, fontWeight: 800, fontSize: 19, flexShrink: 0 }, g.name),
      d({ flex: 1, fontWeight: 700, fontSize: 21, color: W.ink2 }, g.word),
      d({ gap: 4 }, flap(v[0]), flap(v[1])));
  });
  const totalDigits = res ? String(total).padStart(2, '0') : '??';
  const board = d({ flexDirection: 'column', flex: 1 },
    d({ justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: W.ink2, paddingBottom: 8, borderBottom: `1px solid ${W.line}`, marginBottom: 6 }, d({}, 'Item'), d({}, 'Points')),
    ...rows,
    d({ alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${W.line}` },
      d({ fontSize: 18, fontWeight: 800, color: W.ink2 }, 'Total'),
      d({ alignItems: 'center', gap: 5 }, flap(totalDigits[0], true), flap(totalDigits[1], true),
        d({ fontSize: 34, fontWeight: 800, color: W.mute, margin: '0 4px' }, '/'), flap('5', true), flap('0', true))));
  return frame({
    cat: CAT, url: URL_TXT, rightW: 560, rightPad: '18px 22px', rightStyle: { justifyContent: 'flex-start' },
    left: [
      chip(res ? 'Price Check · Result' : 'Price Check · Daily Run', CAT),
      d({ flexDirection: 'column', fontSize: res ? 48 : 80, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, marginTop: 18 }, d({}, 'Price'), d({}, 'Check')),
      res
        ? d({ marginTop: 16, marginBottom: 18, paddingLeft: 8 }, payCard(runTierOf(Math.round(total * 50 / max), ranks), rank, total, max))
        : d({ flexDirection: 'column', marginTop: 22 },
          d({ fontSize: 26, fontWeight: 600, color: W.ink2, lineHeight: 1.3 }, 'Five real price tags, from pocket change to the auction block.'),
          d({ marginTop: 10, fontSize: 21, fontWeight: 700, color: W.mute }, 'Three guesses each. The first one counts most.')),
      cta(),
    ],
    right: board,
  });
}

export async function GET(req) {
  try {
    const q = new URL(req.url).searchParams;
    const s = q.get('s') || '';
    // A link shared under the five-guess rule carries no r; from 2026-10-11 the
    // share link carries r=2 and the card is graded on the recut ladder.
    // r=3 from 2026-10-17 (the wide-middle recut).
    const ranks = ranksByTag(q.get('r') || '');
    const scores = /^\d{1,2}(-\d{1,2}){1,4}$/.test(s) ? s.split('-').map((x) => Math.max(0, Math.min(10, Number(x)))) : null;
    return new ImageResponse(card(scores, scores ? ranks : RUN_RANKS_V3), { width: 1200, height: 630, fonts: stageFonts(), headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
  } catch (err) {
    console.error('pricecheck card failed', err);
    return new Response(null, { status: 302, headers: { Location: '/og/daily.png' } });
  }
}
