'use client';

// Defuse: the daily wire-cutting logic puzzle (owner, 2026-11-12, picked from
// a list of immersive daily ideas and approved from the mockup). A device with
// a row of colored wires and a manual of rules; exactly one order of cuts
// obeys them all. Tap the wires in that order. ONE WRONG CUT ENDS THE DAY,
// which is the whole tension of it: a solve scores 10, anything else 0, and
// the clock ranks the solvers.
//
// Runs on the shared stage shell (app/SimpleDaily.jsx). The rules' words and
// the test each cut is held to both come from lib/defuse-engine.js, the same
// module the generator and verifier run, so the manual cannot say one thing
// and the board judge another.
//
// A cut is wrong the moment it differs from the board's one safe order
// (P.solution, proved unique by scripts/verify-defuse.mjs). The ending then
// names the rule that cut broke; on Tough days a cut can break nothing
// outright and still leave no safe way to finish, and the ending says that.

import React from 'react';
import SimpleDaily from '../SimpleDaily';
import { WIRE_COLORS, ruleText, breach, condTrue } from '@/lib/defuse-engine';

const INK = '#0b0f1a';
const cut1 = (n) => `${n} cut${n === 1 ? '' : 's'}`;

const CSS = `
.df{display:flex;flex-direction:column;gap:12px;width:100%;max-width:520px;margin:0 auto;font-family:'Manrope',system-ui,sans-serif;color:var(--pst-ink,#0b0f1a);}
.df-dev{border:1px solid ${INK};border-radius:14px;background:#f4f6f9;color:${INK};padding:12px 12px 10px;display:flex;flex-direction:column;gap:8px;}
.df-plate{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;font-weight:800;line-height:1.4;}
.df-plate span{display:inline-flex;align-items:center;gap:6px;}
.df-led{width:12px;height:12px;border-radius:6px;border:1px solid ${INK};background:#fff;}
.df-led.on{background:#fb7185;}
.df-wires{position:relative;display:flex;border-top:8px solid #fff;border-bottom:8px solid #fff;outline:1px solid ${INK};outline-offset:-1px;border-radius:4px;background:#f4f6f9;}
.df-w{flex:1;min-width:0;background:none;border:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;color:${INK};font-family:inherit;}
.df-w:disabled{cursor:default;}
.df-w svg{display:block;width:100%;height:112px;}
.df-w:not(:disabled):hover .df-hit{opacity:.12;}
.df-hit{opacity:0;}
.df-lab{display:flex;}
.df-lab div{flex:1;min-width:0;text-align:center;line-height:1.35;}
.df-lab b{display:block;font-size:13px;font-weight:800;}
.df-lab span{display:block;font-size:11.5px;font-weight:700;opacity:.75;text-transform:capitalize;}
.df-man{border:1px solid var(--pst-ink,#0b0f1a);border-radius:14px;overflow:hidden;}
.df-man h3{margin:0;padding:10px 14px 2px;font-size:14px;font-weight:800;line-height:1.4;}
.df-base{margin:0;padding:0 14px 8px;font-size:13px;font-weight:600;line-height:1.45;opacity:.8;}
.df-rule{display:flex;gap:10px;padding:6px 14px;font-size:14px;font-weight:600;line-height:1.45;}
.df-rule b{flex:none;width:14px;font-weight:800;}
.df-rule.bad{background:#ffe4e6;color:${INK};}
.df-rule em{font-style:normal;font-weight:800;color:#be123c;}
.df-end{display:flex;flex-direction:column;gap:8px;font-size:14px;font-weight:700;line-height:1.45;}
.df-chips{display:flex;flex-wrap:wrap;gap:6px;}
.df-chips span{padding:5px 9px;border:1px solid var(--pst-ink,#0b0f1a);border-radius:8px;font-size:13px;font-weight:800;line-height:1.4;text-transform:capitalize;}
`;

function Wire({ color, order, bad }) {
  const fill = WIRE_COLORS[color];
  const seg = (a, b) => (<g><line x1="20" y1={a} x2="20" y2={b} stroke={INK} strokeWidth="12" /><line x1="20" y1={a} x2="20" y2={b} stroke={fill} strokeWidth="10" /></g>);
  return (
    <svg viewBox="0 0 40 112" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect className="df-hit" x="2" y="0" width="36" height="112" rx="6" fill={INK} />
      {order ? <>{seg(0, 40)}{seg(72, 112)}<circle cx="20" cy="56" r="13" fill={bad ? '#be123c' : '#ffffff'} stroke={INK} /><text x="20" y="61" textAnchor="middle" fontSize="14" fontWeight="800" fill={bad ? '#ffffff' : INK} fontFamily="Manrope, system-ui, sans-serif">{order}</text></> : seg(0, 112)}
    </svg>
  );
}

function Board({ P, s, setS, active, done }) {
  const cuts = s.cuts || [];
  const wrongAt = s.out ? cuts.length - 1 : -1;
  const broken = s.out ? breach(P, cuts) : -1;
  const press = (i) => setS((st) => {
    const c = st.cuts || [];
    if (st.out || c.includes(i)) return st;
    return { ...st, cuts: [...c, i], out: i !== P.solution[c.length] };
  });
  return (
    <div className="df">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="df-dev">
        <div className="df-plate">
          <span>Serial {P.serial}</span>
          <span>{P.batteries} {P.batteries === 1 ? 'battery' : 'batteries'}</span>
          <span><i className={`df-led${P.light.on ? ' on' : ''}`} aria-hidden="true" />{P.light.label} light {P.light.on ? 'on' : 'off'}</span>
        </div>
        <div className="df-wires">
          {P.wires.map((color, i) => {
            const at = cuts.indexOf(i);
            return (
              <button type="button" key={i} className="df-w" disabled={!active || done || at >= 0} onClick={() => press(i)}
                aria-label={`Wire ${i + 1}, ${color}${at >= 0 ? `, cut ${at + 1}` : ''}`}>
                <Wire color={color} order={at >= 0 ? at + 1 : 0} bad={at >= 0 && at === wrongAt} />
              </button>
            );
          })}
        </div>
        <div className="df-lab" aria-hidden="true">{P.wires.map((color, i) => <div key={i}><b>{i + 1}</b><span>{color}</span></div>)}</div>
      </div>
      <div className="df-man">
        <h3>Manual</h3>
        <p className="df-base">Cut every wire, in the one safe order, unless a rule protects it.</p>
        {P.rules.map((r, x) => (
          <div key={x} className={`df-rule${done && x === broken ? ' bad' : ''}`}><b>{x + 1}</b><div>{ruleText(P, r)}{done && x === broken ? <> <em>Rule broken.</em></> : null}{done && !condTrue(P, r.cond) ? <> <em style={{ color: 'inherit', opacity: 0.7 }}>Did not apply today.</em></> : null}</div></div>
        ))}
        <div style={{ height: 6 }} />
      </div>
      {done ? (
        <div className="df-end">
          {s.out && broken < 0 ? <div>Cutting wire {cuts[cuts.length - 1] + 1} broke no rule outright, but it left no safe way to finish.</div> : null}
          <div>Safe order</div>
          <div className="df-chips">{P.solution.map((i) => <span key={i}>{i + 1} {P.wires[i]}</span>)}</div>
        </div>
      ) : null}
    </div>
  );
}

const GAME = {
  key: 'defuse', name: 'Defuse', cat: 'Logic', miss: 'cuts',
  fresh: () => ({ cuts: [], out: false }),
  validSave: (P, s) => Array.isArray(s.cuts) && s.cuts.length <= P.wires.length,
  touched: (s) => (s.cuts || []).length > 0,
  solved: (P, s) => !s.out && (s.cuts || []).length === P.solution.length,
  failed: (P, s) => !!s.out,
  count: (s) => (s.cuts || []).length,
  result: (P, s, won) => ({ score: won ? 10 : 0, total: 10, correct: won ? 1 : 0, guessesUsed: (s.cuts || []).length }),
  Board,
  eyebrow: (P) => `No. ${P.num} · ${P.tier}`,
  // The foot never says how many cuts the board needs: which wires stay whole is part of the puzzle.
  foot: (P, s) => `${cut1((s.cuts || []).length)} made · one wrong cut ends the day`,
  gateTitle: (P) => `Today's device: ${P.tier}`,
  gateLine: (P) => `${P.wires.length} wires and a manual of ${P.rules.length} rules. Exactly one order of cuts obeys them all. Read the device, read the manual, and tap the wires in that order. One wrong cut ends the day.`,
  rules: (P) => ({
    lead: 'Cut the wires in the one safe order.',
    banner: 'One wrong cut ends the day.',
    steps: [
      <>Read the <b>device</b>: the colors of the wires from left to right, the serial number, the battery count and whether the indicator light is on.</>,
      <>Read the <b>manual</b>. Every wire gets cut unless a rule protects it. Some rules start with a condition (&ldquo;With exactly two batteries&rdquo;): if the condition is not true of today&rsquo;s device, that rule does nothing.</>,
      <>Exactly <b>one order</b> of cuts obeys every rule. <b>Tap a wire</b> to cut it. Each cut is final.</>,
      <>Cut them all in the safe order and the device is defused. The first wrong cut ends the day and shows you the rule it broke.</>,
    ],
    knack: 'Cross out the rules whose conditions are false first. Then find the cut that is pinned down (a first cut, a final cut, a wire that must stay whole) and work outward from it.',
    footer: 'A solve ranks on the clock. Boards grow through the week: four wires on Monday and Tuesday, five midweek, six on Friday and Saturday and seven on Sunday. From Friday on, a cut can break no rule outright and still leave no safe way to finish, so plan the whole order first.',
  }),
  pitch: () => 'Read the manual. Cut the wires in the one safe order.',
  shareLine: (P, s, won, el) => `Defuse #${P.num} · ${won ? `Defused in ${el}` : `Wrong cut on move ${(s.cuts || []).length}`}\n${P.solution.map((_, k) => (k < (s.cuts || []).length - (s.out ? 1 : 0) ? '✂️' : (s.out && k === (s.cuts || []).length - 1 ? '\u{1F4A5}' : '➖'))).join('')}`,
  detail: (P, s, won, el) => (won ? `Defused · ${cut1(P.solution.length)} · ${el}` : s.out ? `Wrong cut on move ${(s.cuts || []).length} · ${el}` : `Stopped after ${cut1((s.cuts || []).length)} · ${el}`),
  aboutTitle: 'About Defuse',
  about: [
    'Defuse is a free daily logic puzzle from Mind Loft. Every day it shows one device: a row of colored wires, a serial number, a battery count and an indicator light, with a short manual of rules beside it. Every wire is cut unless a rule protects it, and exactly one order of cuts obeys every rule. You work out that order and tap the wires in it.',
    'The rules are plain sentences. Never cut a wire right beside the one you just cut. The black wire is the final cut. With exactly two batteries, cut every yellow wire before any white wire. Some rules only apply when their condition is true of the device in front of you, so part of the puzzle is working out which rules count today. There is no guessing: the first wrong cut ends the day, and the ending shows which rule it broke and what the safe order was.',
    'Boards grow through the week. Monday and Tuesday are Gentle, four wires and three rules. Midweek is Moderate, five wires and a rule that does not apply. Friday and Saturday are Tough, six wires where the order has to be planned ahead, and Sunday is the biggest board of the week with seven. Everyone gets the same device, and the fastest solve leads the board.',
  ],
};

export default function DefuseClient(props) {
  return <SimpleDaily {...props} game={GAME} />;
}
