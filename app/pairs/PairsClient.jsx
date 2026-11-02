'use client';

// Pairs: the daily game of Concentration, with real playing cards. The whole
// deal is face down; turn two at a time, and a pair is two cards of the SAME
// RANK AND COLOUR (seven of hearts with seven of diamonds). The other colour is
// the trap. Score: solved or not; fewer turns, then the clock, decide the board.

import React, { useEffect, useMemo } from 'react';
import SimpleDaily from '../SimpleDaily';
import { decodeDeal, isRed, pairOf } from './deal';

const SUIT = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK = (r) => (r === 'T' ? '10' : r);
const NAMES = { A: 'ace', T: 'ten', J: 'jack', Q: 'queen', K: 'king' };
const SUITN = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
const cardName = (c) => `${NAMES[c[0]] || c[0]} of ${SUITN[c[1]]}`;

function Board({ P, s, setS, active, done }) {
  const cards = useMemo(() => decodeDeal(P.deal, P.num), [P]);
  // A missed pair stays up for a moment, then turns back over.
  useEffect(() => {
    if (!s.miss) return undefined;
    const t = setTimeout(() => setS((st) => (st.miss ? { ...st, up: [], miss: null } : st)), 850);
    return () => clearTimeout(t);
  }, [s.miss, setS]);
  const got = new Set(s.got);
  const tap = (i) => {
    if (!active || done || got.has(i) || s.up.includes(i)) return;
    setS((st) => {
      let up = st.miss ? [] : st.up.slice();
      up.push(i);
      if (up.length < 2) return { ...st, up, miss: null };
      const [a, b] = up;
      if (pairOf(cards[a], cards[b])) return { ...st, up: [], got: [...st.got, a, b], turns: st.turns + 1, miss: null };
      return { ...st, up, turns: st.turns + 1, miss: [a, b] };
    });
  };
  const showAll = done;
  return (
    <div className="prs">
      <style dangerouslySetInnerHTML={{ __html: `
.prs{align-self:center;width:100%;max-width:min(560px, calc((100dvh - 300px) * ${P.cols / P.rows} / 1.38));}
@media (min-width:900px){.prs{max-width:min(${P.cols > 6 ? 760 : 600}px, calc((100dvh - 260px) * ${P.cols / P.rows} / 1.38));}}
.prs-g{display:grid;gap:clamp(4px, 1.2vw, 8px);}
.prs-c{position:relative;aspect-ratio:5/7;border-radius:clamp(5px,1.4vw,9px);border:1px solid var(--pst-ink);padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;container-type:inline-size;background:var(--pst-acc,#7dd3fc);transition:transform .18s ease;}
.prs-c::before{content:"";position:absolute;inset:12%;border-radius:4px;border:2px solid color-mix(in srgb, var(--pst-ink) 30%, transparent);}
.prs-c.up,.prs-c.got{background:#ffffff;cursor:default;}
.prs-c.up::before,.prs-c.got::before{display:none;}
.prs-c.got{opacity:.5;}
.prs-c.miss{animation:prsMiss .35s ease;}
@keyframes prsMiss{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
.prs-f{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;line-height:1;}
.prs-f i{font-style:normal;position:absolute;left:8%;top:6%;font-size:24cqw;}
.prs-f b{font-size:52cqw;}
.prs-f.r{color:#c81e1e;}.prs-f.k{color:#0b0f1a;}
@media (prefers-reduced-motion: reduce){.prs-c{transition:none}.prs-c.miss{animation:none}}
` }} />
      <div className="prs-g" style={{ gridTemplateColumns: `repeat(${P.cols}, 1fr)` }} role="grid" aria-label={`${cards.length} cards`}>
        {cards.map((c, i) => {
          const face = showAll || got.has(i) || s.up.includes(i);
          return (
            <button key={i} type="button" className={'prs-c' + (face ? (got.has(i) ? ' got' : ' up') : '') + (s.miss && s.miss.includes(i) ? ' miss' : '')}
              aria-label={face ? cardName(c) : `Card ${i + 1}, face down`} onClick={() => tap(i)}>
              {face ? <span className={'prs-f ' + (isRed(c) ? 'r' : 'k')}><i>{RANK(c[0])}</i><b>{SUIT[c[1]]}</b></span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const GAME = {
  key: 'pairs', name: 'Pairs', cat: 'Cards', miss: 'turns',
  fresh: () => ({ up: [], got: [], turns: 0, miss: null }),
  validSave: (P, s) => Array.isArray(s.got) && Array.isArray(s.up),
  touched: (s) => s.turns > 0,
  solved: (P, s) => s.got.length === P.cols * P.rows,
  count: (s) => s.turns,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.turns }),
  Board,
  wide: true,
  eyebrow: (P, s, { sundayLabel }) => `${(P.cols * P.rows) / 2} pairs${sundayLabel ? ` · ${sundayLabel}` : ''} · No. ${P.num}`,
  foot: (P, s) => `${s.turns} turn${s.turns === 1 ? '' : 's'} · ${s.got.length / 2} of ${(P.cols * P.rows) / 2} pairs`,
  frac: (P, s) => s.got.length / (P.cols * P.rows),
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: ${(P.cols * P.rows) / 2} pairs`,
  gateLine: (P) => `${P.cols * P.rows} playing cards face down. Turn two at a time and find every pair: the same rank in the same colour. Fewest turns wins.`,
  rules: (P) => ({
    lead: 'Concentration, with a real deck and a trap.',
    steps: [
      <><b>{P.cols * P.rows} cards</b> are dealt face down. Tap a card to turn it over, then a second one.</>,
      <>A pair is two cards of the <b>same rank and the same colour</b>: the seven of hearts with the seven of diamonds, the queen of spades with the queen of clubs. A pair stays face up.</>,
      <>Anything else turns back over. The same rank in the <b>other colour</b> is not a pair, and every deal has several of those waiting for you.</>,
    ],
    knack: 'Say each card to yourself as it turns ("red seven, top row"). Colour is half the match, so remember it as carefully as the rank.',
    footer: 'Every finished table ranks on turns, then on the clock.',
  }),
  pitch: (P) => `${(P.cols * P.rows) / 2} pairs of cards face down. Find them in the fewest turns.`,
  shareLine: (P, s, won, el) => `Pairs #${P.num} · ${won ? `${s.turns} turns · ${el}` : 'unfinished'}`,
  detail: (P, s, won, el) => `${s.turns} turn${s.turns === 1 ? '' : 's'} · ${el}`,
  aboutTitle: 'About Pairs',
  about: [
    'Pairs is a free daily game of Concentration from Mind Loft, played with a real deck of cards. Thirty-six cards are dealt face down, and you turn them over two at a time to find all eighteen pairs.',
    'A pair is two cards of the same rank and the same colour, so the seven of hearts goes with the seven of diamonds and not the seven of spades. Every deal mixes in ranks that come in both colours, which is what makes it a test of memory rather than luck. A finished table ranks on turns, then on the clock. The Sunday Edition deals forty-eight cards.',
    <>More card games: <a href="/taire" style={{ color: 'inherit', fontWeight: 800 }}>Taire</a>, <a href="/cell" style={{ color: 'inherit', fontWeight: 800 }}>Cell</a> and <a href="/mahj" style={{ color: 'inherit', fontWeight: 800 }}>Mahj</a>.</>,
  ],
};

export default function PairsClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
