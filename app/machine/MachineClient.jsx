'use client';

// Machine: the daily contraption puzzle, The Incredible Machine as a daily
// (owner, 2026-11-17: "look up the game the incredible machine. could we build
// a daily puzzle like that?", "the physics dont work. ball doesnt carry
// momentum", "we also need a number of other elements for use on future days",
// "placement should be more dynamic, too? rather than just big tiled grid?",
// "it will be called 'machine'", then "push and implement immediately ... the
// mock-up here can be the first run"). Mockup:
// https://claude.ai/artifact/8uCJWnR44chidCH3aCpH8H
//
// Most of a machine is built. The player drags a few parts from the tray onto
// the board (free placement, 10px snap), presses Run, and the chain reaction
// plays out in real physics (lib/machine-engine.js). A miss leaves the ball
// paths drawn; Reset goes back to building with the parts where they were.
// Every Run counts. Ranked on runs, then the clock (the default first-attempt
// order: score, guesses_used, time). A solved machine is 10, a give-up 0.
//
// The surface is lib/machine-ui.js, mounted on one div; this file only wires it
// to the shell (app/SimpleDaily.jsx): the save is { parts, runs, won }.

import React, { useEffect, useRef } from 'react';
import SimpleDaily from '../SimpleDaily';
import { mountMachine, MACHINE_CSS } from '@/lib/machine-ui';
import { run } from '@/lib/machine-engine';

const BAND = { gentle: 'Gentle', moderate: 'Moderate', tough: 'Tough', sunday: 'Sunday Edition' };
const runsOf = (n) => `${n} ${n === 1 ? 'run' : 'runs'}`;

export function Board({ P, s, setS, active, done }) {
  const host = useRef(null), ctl = useRef(null);
  const sRef = useRef(s); sRef.current = s;
  useEffect(() => {
    if (!host.current) return undefined;
    const c = mountMachine(host.current, {
      level: P, parts: sRef.current.parts || [], goalText: P.goalText,
      onParts: (parts) => setS((st) => ({ ...st, parts })),
      onRun: () => setS((st) => ({ ...st, runs: (st.runs || 0) + 1 })),
      onEnd: (won) => { if (won) setS((st) => ({ ...st, won: true })); },
    });
    c.setRuns(sRef.current.runs || 0);
    ctl.current = c;
    return () => { c.destroy(); ctl.current = null; };
  }, [P]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ctl.current) ctl.current.setState({ active, done }); }, [active, done, P]);
  return (
    <div style={{ width: '100%', maxWidth: 'min(900px, calc((100dvh - 330px) * 1.4))', alignSelf: 'center' }}>
      <style dangerouslySetInnerHTML={{ __html: MACHINE_CSS }} />
      <div ref={host} />
    </div>
  );
}

function partsOk(P, parts) {
  if (!Array.isArray(parts)) return false;
  const seen = new Set();
  for (const p of parts) {
    if (!p || !Number.isInteger(p.ti) || p.ti < 0 || p.ti >= P.tray.length || seen.has(p.ti)) return false;
    if (!Number.isFinite(p.px) || !Number.isFinite(p.py)) return false;
    if (p.dir != null && p.dir !== 'l' && p.dir !== 'r') return false;
    seen.add(p.ti);
  }
  return true;
}
const partsFor = (P, parts) => parts.map((q) => ({ ...P.tray[q.ti], dir: q.dir || P.tray[q.ti].dir, px: q.px, py: q.py }));

export const GAME = {
  key: 'machine', name: 'Machine', cat: 'Visual', miss: 'Runs', missOne: 'run', wide: true,
  fresh: () => ({ parts: [], runs: 0, won: false }),
  // a stored win is replayed through the engine before it is believed
  validSave: (P, s) => !!s && partsOk(P, s.parts) && Number.isInteger(s.runs) && s.runs >= 0 && (!s.won || run(P, partsFor(P, s.parts), 1800).won),
  touched: (s) => (s.runs || 0) > 0 || (s.parts || []).length > 0,
  solved: (P, s) => !!s.won,
  count: (s) => s.runs || 0,
  metric: (P, s, won) => (won ? s.runs || 0 : null),
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: s.runs || 0 }),
  Board,
  eyebrow: (P, s, { sundayLabel }) => `${sundayLabel || BAND[P.band]} · ${P.title} · No. ${P.num}`,
  foot: (P, s) => `${runsOf(s.runs || 0)} · ${(s.parts || []).length} of ${P.tray.length} parts placed`,
  frac: (P, s) => (s.won ? 1 : 0),
  sundayLabel: () => 'Sunday Edition',
  gateTitle: (P) => `Today: ${P.goalText}`,
  gateLine: (P) => `Most of the machine is built. Drag parts from the tray into place, press Run and watch it go. Not every part is needed. Every run counts, so look before you press.`,
  rules: () => ({
    lead: 'Finish the machine so it does the day\'s job.',
    steps: [
      <><b>Drag</b> a part from the tray onto the board. Drag it again to move it. <b>Tap</b> it to flip it or put it back, or drag it off the board.</>,
      <>Press <b>Run</b>. The balls have real weight and momentum: they arc off ledges, speed up down ramps, bounce off springs and bumpers, and knock each other along.</>,
      <>If it misses, the paths stay drawn so you can see what happened. <b>Reset</b>, move parts, and run again.</>,
      <>A red button opens whatever its wire runs to. Not every part in the tray is needed.</>,
    ],
    knack: 'Watch where the ball goes on its own first. Then fix one thing at a time.',
    footer: 'A working machine ranks on runs, fewest first, then the clock. Giving up scores nothing.',
  }),
  pitch: (P) => `${P.goalText}. Most of the machine is built: drag a few parts into place and press Run.`,
  shareLine: (P, s, won, el) => `Machine #${P.num} · ${P.title} · ${won ? `${runsOf(s.runs || 0)} · ${el}` : 'not working yet'}`,
  detail: (P, s, won, el) => `${P.title} · ${runsOf(s.runs || 0)} · ${el}`,
  aboutTitle: 'About Machine',
  about: [
    'Machine is a free daily contraption puzzle from Mind Loft, in the spirit of The Incredible Machine. Each day a chain-reaction machine is mostly built: shelves, crates, trapdoors, buttons and wires, a hoop, a bell or a bucket. You get a small tray of parts, a ramp, a spring, a belt and the like, and you drag them into place so that pressing Run gets the day\'s job done.',
    'The balls carry real weight and momentum. A bowling ball rolls hard and is hard to stop, a tennis ball is light enough for a fan to lift, and a ball that leaves a ledge keeps flying the way it was going. The physics is exact and the same on every device, so the machine that worked for you works for everybody, and the daily board ranks on how few runs it took.',
    'The week starts easy and adds new parts as it goes: bumpers, fans, seesaws, pipes, magnets, dominoes and cannons. Every board is checked before it goes live: the stored machine works, the empty board does not, and no single part can do the job alone.',
    <>More puzzles about space and motion: <a href="/topple" style={{ color: 'inherit', fontWeight: 800 }}>Topple</a>, <a href="/roll" style={{ color: 'inherit', fontWeight: 800 }}>Roll</a> and <a href="/pack" style={{ color: 'inherit', fontWeight: 800 }}>Pack</a>.</>,
  ],
};

export default function MachineClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
