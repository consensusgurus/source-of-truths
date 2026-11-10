'use client';

// Carmen: the daily globe chase (owner, 2026-11-08). A thief flies city to
// city; each leg the player reads up to three tips (Evidence, Witness,
// Informant), drops a pin on a spinning globe, and scores on how close it
// lands. Five legs, six on the Sunday Edition. Land the last pin within 500 km
// and she is caught. A Geography daily that also sits on the Trivia shelf
// (alsoCat), green by default. The Noir look (black water, lime land) is the
// owner's pick of three mockups.
//
// Runs on the shared stage shell (app/SimpleDaily.jsx); the board, globe and
// run-style interstitials are app/carmen/CarmenBoard.jsx. Rules and scoring:
// lib/carmen-engine.js.

import React from 'react';
import SimpleDaily from '../SimpleDaily';
import CarmenBoard, { CarmenTools } from './CarmenBoard';
import { maxPoints, caught, CATCH_KM, TIP_COST, titleFor } from '@/lib/carmen-engine';
import { endGrade } from '@/lib/end-verdict';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const total = (s) => (s.res || []).reduce((a, r) => a + (r.pts || 0), 0);
const gotHer = (P, s) => s.res.length === P.legs.length && caught(s.res[s.res.length - 1].km);
const square = (r) => (!r ? '⬜' : r.pts >= 800 ? '🟩' : r.pts >= 400 ? '🟨' : '🟥');

const GAME = {
  key: 'carmen', name: 'Carmen', cat: 'Geography', miss: 'tips', wide: true, full: true,
  // IN SPACE (owner, 2026-11-10): play always sits on the black look, the
  // true-colour Earth on a starfield, whichever look the site is on.
  look: 'darktint',
  fresh: () => ({ leg: 0, tips: 1, guess: null, phase: 'play', res: [], closed: false }),
  validSave: (P, s) => Array.isArray(s.res) && typeof s.leg === 'number' && s.res.length <= P.legs.length,
  touched: (s) => s.res.length > 0 || s.tips > 1 || !!s.guess,
  solved: (P, s) => !!s.closed,
  count: (s) => (s.res || []).reduce((a, r) => a + (r.tips || 1), 0) + (s.closed ? 0 : (s.phase === 'play' ? (s.tips || 1) : 0)),
  // Points out of the day's maximum; the miss column is tips opened.
  result: (P, s) => ({
    score: total(s), total: maxPoints(P.legs.length), correct: gotHer(P, s) ? 1 : 0,
    guessesUsed: (s.res || []).reduce((a, r) => a + (r.tips || 1), 0),
  }),
  holdMs: () => 16000,
  title: (P, s) => endGrade(total(s), maxPoints(P.legs.length), 'Perfect!'),
  metric: (P, s) => total(s),
  Board: CarmenBoard,
  tools: (props) => <CarmenTools {...props} />,
  // Short, so it holds one line on a phone; the case title is on the gate.
  eyebrow: (P, s, { sundayLabel }) => `Case ${P.num}${sundayLabel ? ` · ${sundayLabel}` : ''}`,
  foot: (P, s) => `${fmt(total(s))} points · catch her within ${fmt(CATCH_KM)} km on the last leg`,
  frac: (P, s) => s.res.length / P.legs.length,
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => (P.sunday ? `Sunday Edition: ${P.title}` : `Case ${P.num}: ${P.title}`),
  gateLine: (P) => `${P.suspect} stole ${P.stolen.toLowerCase()} in ${P.start.name.split(',')[0]} and is on the move. Read the tips, pin her next stop on the globe, and stay on her trail for ${P.legs.length} legs. Land within ${fmt(CATCH_KM)} km on the last one to make the arrest.`,
  rules: (P) => ({
    lead: 'A thief is loose. Follow her across the globe, one city at a time.',
    banner: 'Everyone chases the same thief today.',
    sub: `Five legs, six on Sundays. Every pin scores up to 1,000 points.`,
    steps: [
      <>Each leg opens with a piece of <b>evidence</b> about where she went. Spin the globe, pinch or use <b>+</b> to zoom, and <b>tap to drop your pin</b>.</>,
      <>Stuck? Open a <b>witness</b> tip, then an <b>informant</b> tip. Each extra tip costs <b>{TIP_COST} points</b>. Every tip points to one city.</>,
      <>Lock in. The closer your pin, the more points: <b>1,000</b> within 50 km, falling away with distance. Then watch her flight and see how far off you were.</>,
      <>Pin the final leg within <b>{fmt(CATCH_KM)} km</b> and she is caught.</>,
    ],
    knack: 'Read the evidence for the currency and the language, then hunt for the one detail only a single city has: a market, a tram line, a landmark, a nickname.',
    footer: 'Scored in points, highest first; fewer tips opened breaks a tie, then the clock. Your rank on the ending climbs from Rookie to Sherlock Holmes. The Sunday Edition adds a sixth leg and harder cities.',
  }),
  pitch: (P) => `Follow ${P.suspect} across the globe and pin every city she runs to.`,
  shareLine: (P, s) => {
    const t = total(s), got = gotHer(P, s);
    return `Carmen #${P.num}${P.sunday ? ' · Sunday' : ''} · ${got ? 'Caught!' : 'She got away'} · ${fmt(t)} points · ${titleFor(t, P.legs.length).title}\n${P.legs.map((_, i) => square(s.res[i])).join('')}`;
  },
  detail: (P, s, won, el) => `${fmt(total(s))} points · ${gotHer(P, s) ? 'Caught' : 'She got away'} · ${titleFor(total(s), P.legs.length).title} · ${el}`,
  aboutTitle: 'About Carmen',
  about: [
    'Carmen is a free daily geography game from Mind Loft. A thief has stolen something precious and is flying from city to city. Each leg you get a tip about where she went, written like evidence from a case file, and you drop a pin on a spinning 3D globe where you think she landed.',
    'Every pin scores up to 1,000 points by its distance from the real city, and extra tips cost points, so reading the first clue well pays. Five legs a day, six on the Sunday Edition. Land the final pin within 500 kilometers to make the arrest, and see where your total ranks you, from Rookie up to Sherlock Holmes.',
    <>More daily geography: <a href="/ping" style={{ color: 'inherit', fontWeight: 800 }}>Ping</a>, <a href="/span" style={{ color: 'inherit', fontWeight: 800 }}>Span</a>, <a href="/flank" style={{ color: 'inherit', fontWeight: 800 }}>Flank</a> and <a href="/atlas" style={{ color: 'inherit', fontWeight: 800 }}>Atlas</a>.</>,
  ],
};

export default function CarmenClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
