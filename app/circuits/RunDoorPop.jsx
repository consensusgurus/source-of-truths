"use client";

// RunDoorPop — the offer, on one game's own page, to play the whole run it
// belongs to instead (owner, 2026-10-01): Price Check for the five price
// games, the Trivia Gauntlet for its seven quizzes. ValetDoorPop is the
// original; this is the same card for every other run.
//
// IT FIRES ON THE START GATE, before a move. A player who has already
// started this game has chosen it; the run is offered before the choice.
//
// ONCE PER DAY, and not at all once that run has been finished today or
// is open right now (`sot_run_<id>_<today>`). A game already played on its
// own page does not stop the offer: the run replays it as practice and the
// first score is the one that counts (owner, 2026-10-01).
//
// It also stays quiet when the page was opened FROM a run or a circuit
// (?circuit= / ?five=), where the player is already inside one.
//
// IT WEARS THE RUN STAGE'S CLOTHES: near-black ground, Manrope eyebrow, the
// run's accent call to action carrying dark ink.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { T } from '@/lib/theme';

const WAIT_MS = 900;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";

export const RUN_DOORS = {
  pricecheck: {
    href: '/pricecheck', name: 'Price Check', eyebrow: 'Daily run · Five prices',
    body: 'Pricer, Dealer, Realtor, Agent and Curator back to back: a find, a ride, a home, a trip and a piece. Five guesses at each, one score out of 50.',
    go: 'Run all five', accent: '#fbbf24',
    tags: [['Pricer', '#4ade80'], ['Dealer', '#fbbf24'], ['Realtor', '#7dd3fc'], ['Agent', '#f472b6'], ['Curator', '#c4b5fd']],
  },
  gauntlet: {
    href: '/circuits/gauntlet/run', name: 'Trivia Gauntlet', eyebrow: 'Daily run · Seven quizzes',
    body: 'All seven daily trivia quizzes back to back, one life in each: a topic in depth, the map, sport, business, the screen, who said it, and a streak of anything at all.',
    go: 'Run all seven', accent: '#7dd3fc',
    tags: [['Deep', '#7dd3fc'], ['Atlas', '#6ee7b7'], ['Sport', '#bef264'], ['Biz', '#e8b43a'], ['Script', '#fb923c'], ['Quotes', '#fb7185'], ['Streak', '#e879f9']],
  },
  // Passport is a solo page rather than a RunClient run, so it has no
  // sot_run_passport_<day> save; runDoneToday reads its day breadcrumb.
  passport: {
    href: '/passport', name: 'Passport', eyebrow: 'Daily run · One country',
    body: 'One mystery country in five rounds: a landmark, its flag, its neighbors, its capital and its size. One score out of 50, and a passport to match.',
    go: 'Start Passport', accent: '#6ee7b7',
    tags: [['Landmark', '#a78bfa'], ['Flag', '#60a5fa'], ['Neighbors', '#34d399'], ['Capital', '#f87171'], ['Size', '#fbbf24']],
  },
};

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

// Has this run been finished, or is it open, today on this device?
export function runTouchedToday(id) {
  try {
    const run = JSON.parse(localStorage.getItem(`sot_run_${id}_${etToday()}`) || 'null');
    return !!(run && run.phase && run.phase !== 'idle');
  } catch (e) { return false; }
}
export function runDoneToday(id) {
  try {
    if (id === 'passport') {
      const b = JSON.parse(localStorage.getItem('sot_passport_day') || 'null');
      return !!(b && b.d === etToday() && b.done);
    }
    const run = JSON.parse(localStorage.getItem(`sot_run_${id}_${etToday()}`) || 'null');
    return !!(run && run.phase === 'done');
  } catch (e) { return false; }
}

function shouldOffer(id) {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('circuit') || q.get('five') === '1') return false;
  } catch (e) {}
  const today = etToday();
  try { if (localStorage.getItem(`sot_${id}_door`) === today) return false; } catch (e) { return false; }
  return !runTouchedToday(id);
}

export default function RunDoorPop({ id = 'pricecheck', ready = false, self = '' }) {
  const D = RUN_DOORS[id];
  const [open, setOpen] = useState(false);
  const fired = useRef(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!D || !ready || fired.current) return undefined;
    const t = setTimeout(() => {
      if (fired.current || !shouldOffer(id)) return;
      fired.current = true;
      try { localStorage.setItem(`sot_${id}_door`, etToday()); } catch (e) {}
      setOpen(true);
    }, WAIT_MS);
    return () => clearTimeout(t);
  }, [ready, id, D]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open || !D) return null;
  return (
    <div className="rdp-bd" role="dialog" aria-modal="true" aria-labelledby="rdp-h" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS(D.accent) }} />
      <div className="rdp" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rdp-x" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.4} /></button>
        <i className="rdp-e">{D.eyebrow}</i>
        <h2 className="rdp-h" id="rdp-h">{D.name}</h2>
        <div className="rdp-tags">{D.tags.map(([t, c], i) => <span key={t} style={{ background: c, animationDelay: `${i * 70}ms` }}>{t}</span>)}</div>
        <p className="rdp-p">{D.body}</p>
        <a className="rdp-go" href={D.href}>{D.go}</a>
        <button type="button" className="rdp-no" onClick={close}>Just {self || 'this one'}</button>
      </div>
    </div>
  );
}

const CSS = (acc) => `
.rdp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.74);backdrop-filter:blur(2px);animation:rdpfade .18s ease-out;}
.rdp{position:relative;width:100%;max-width:370px;max-height:calc(100vh - 40px);overflow-y:auto;scrollbar-width:none;
     background:${T.ground};border:1px solid rgba(255,255,255,.14);border-radius:13px;
     padding:18px 20px 18px;font-family:${SANS};color:#eef2fa;box-shadow:0 24px 64px rgba(0,0,0,.6);animation:rdprise .2s ease-out;}
.rdp::-webkit-scrollbar{display:none;}
.rdp-x{position:absolute;top:10px;right:10px;background:transparent;border:none;color:#66748f;cursor:pointer;padding:5px;line-height:0;border-radius:7px;}
.rdp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.rdp-e{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:#66748f;margin-bottom:3px;}
.rdp-h{font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff;margin:0;}
.rdp-tags{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0 0;}
.rdp-tags span{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#0b0f1a;padding:4px 8px 4px 12px;border-radius:4px 6px 6px 4px;position:relative;animation:rdptag .4s cubic-bezier(.2,1.4,.4,1) both;}
.rdp-tags span:before{content:"";position:absolute;left:4px;top:50%;width:4px;height:4px;margin-top:-2px;border-radius:50%;background:${T.ground};}
.rdp-p{margin:12px 0 0;font-size:13.5px;line-height:1.5;color:#9aa8c4;font-weight:600;}
.rdp-go{display:block;margin-top:15px;background:${acc};color:#08222e;border:none;border-radius:9px;padding:13px 18px;font-size:14px;font-weight:800;letter-spacing:.02em;text-align:center;text-decoration:none;position:relative;overflow:hidden;}
.rdp-go:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);animation:rdpsheen 2.6s .6s infinite;}
.rdp-no{display:block;width:100%;margin-top:8px;background:transparent;border:1px solid rgba(255,255,255,.14);color:#9aa8c4;border-radius:9px;padding:10px 18px;font-family:${SANS};font-size:13px;font-weight:800;cursor:pointer;}
.rdp-no:hover{color:#fff;border-color:rgba(255,255,255,.3);}
@keyframes rdpfade{from{opacity:0}to{opacity:1}}
@keyframes rdprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes rdptag{from{opacity:0;transform:translateY(-8px) rotate(-6deg)}to{opacity:1;transform:none}}
@keyframes rdpsheen{0%{left:-60%}40%,100%{left:130%}}
@media(prefers-reduced-motion:reduce){.rdp-bd,.rdp,.rdp-tags span,.rdp-go:after{animation:none;}}
`;
