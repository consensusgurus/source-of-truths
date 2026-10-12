"use client";

// GauntletMorePop — more trivia (or more math), offered to a Trivia Gauntlet
// or Math Gauntlet player who has played nothing else on the site (owner,
// 2026-10-12). One component, one CONFIG entry per gauntlet. It replaced the /trivia
// door card (TriviaDoorPop), which only reached first-timers who typed /trivia
// and only said "there is a site here".
//
// WHO SEES IT: anyone finishing a gauntlet whose ENTIRE play history is the
// two gauntlets' twelve games plus Passport (playing several runs still counts
// as runs-only). Passport mounts it too, with its own CONFIG entry. First run or fifth day, same test. Read two ways,
// and both must agree:
//   this device  no stats record, day breadcrumb, or started save for any
//                daily outside the seven (a save that was only opened has no
//                t0 and proves nothing);
//   the server   daily-status's archive has no plays for any key outside the
//                seven, which catches somebody who played Crux on their phone.
// The moment they play anything else, it stops for good, by itself.
//
// HOW OFTEN: at most once per ET day, two seconds into the scorecard, and at
// most MAX_SHOWS days in all. ?more=preview shows it regardless, unstamped.
//
// WHAT IT SAYS: led by the quiz they went furthest in (score over total).
// Atlas leads with geography, Script with the screen, Biz with Price Check.
// Sport has no sports daily to send them to, so it reads TODAY's Bracket and
// Listed boards (passed in by the run page) and leads with whichever is a
// sports board today, naming it; on a day neither is, it says so honestly.
//
// It wears the run stage's clothes (near-black ground, Manrope, sky call to
// action with dark ink), like TriviaDoorPop and GauntletPop before it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DAILY_GAME_MAP, liveDailyKeys } from '@/lib/daily-games';
import { circuitById } from '@/lib/circuits';
import { fetchDayStatus, etToday } from '../useDayStats';
import GameGlyph from '../GameGlyph';
import { T } from '@/lib/theme';

const WAIT_MS = 2000;
const MAX_SHOWS = 5;
const DAY_KEY = (c) => `sot_gmore_${c}_day`;
const COUNT_KEY = (c) => `sot_gmore_${c}_n`;
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

const keysOf = (id) => ((circuitById(id) || {}).keys) || [];
// Plays inside either gauntlet do not disqualify; anything else does.
const RUNS_ONLY = new Set([...keysOf('gauntlet'), ...keysOf('math'), 'passport']);

// Price Check is a run, not a daily, so it is described here rather than read
// off the registry. Its glyph is Pricer's.
const EXTRA = {
  pricecheck: { name: 'Price Check', tag: 'Five real prices, three guesses each', href: '/pricecheck', glyph: 'pricer', color: '#15803d' },
};

const CONFIG = {
  gauntlet: {
    eyebrow: 'Mind Loft · More trivia',
    fallbackHead: 'Seven quizzes down. The trivia does not stop here.',
    fallbackLead: ['bracket', 'listed', 'potluck'],
    fallbackWhy: 'More trivia, new every day.',
    lead: {
      atlas: ['passport', 'ping', 'flank'],
      script: ['thread', 'focus', 'potluck'],
      biz: ['pricecheck', 'bracket', 'listed'],
      quotes: ['dating', 'listed', 'potluck'],
      deep: ['potluck', 'bracket', 'listed'],
      streak: ['potluck', 'bracket', 'listed'],
    },
    why: {
      atlas: 'These three are geography too.',
      script: 'More for the screen and the eye.',
      biz: 'Price Check is five real price tags, from pocket change to the auction block.',
      quotes: 'More for the well read.',
      deep: 'More quick-fire trivia.',
      streak: 'More quick-fire trivia.',
    },
    also: ['passport', 'bracket', 'listed', 'ping', 'dating', 'thread', 'focus', 'potluck', 'dossier', 'flank'],
  },
  // Passport is one country in five rounds, so there is no "went furthest";
  // it always leads with the geography dailies.
  passport: {
    eyebrow: 'Mind Loft · More geography',
    fallbackHead: 'Passport stamped. The map does not stop here.',
    fallbackSub: 'Three more geography games, new every day, the same for everyone.',
    fallbackLead: ['atlas', 'ping', 'flank'],
    fallbackWhy: 'More geography, new every day.',
    lead: {},
    why: {},
    also: ['span', 'bracket', 'listed', 'dating'],
  },
  math: {
    eyebrow: 'Mind Loft · More numbers',
    fallbackHead: 'Five math games down. The numbers do not stop here.',
    fallbackLead: ['tally', 'crunch', 'calc'],
    fallbackWhy: 'More number puzzles, new every day.',
    lead: {
      blitz: ['crunch', 'calc', 'tally'],
      blitzed: ['crunch', 'tally', 'calc'],
      gap: ['cipher', 'tally', 'carve'],
      series: ['calc', 'cipher', 'crunch'],
      back: ['crunch', 'calc', 'tally'],
    },
    why: {
      blitz: 'More mental arithmetic, with time to think.',
      blitzed: 'More ways to make the numbers work.',
      gap: 'More missing numbers to work out.',
      series: 'More patterns to crack.',
      back: 'More ways to make the number.',
    },
    also: ['tally', 'crunch', 'calc', 'cipher', 'carve', 'sums', 'pricecheck'],
  },
};

// "Which hitter had MORE career home runs?" reads as shouting out of context.
const calm = (s) => String(s || '').replace(/\b([A-Z]{2,})\b/g, (w) => w.toLowerCase());

function gameOf(key, boards) {
  if (EXTRA[key]) return { key, ...EXTRA[key] };
  const g = DAILY_GAME_MAP[key];
  if (!g) return null;
  const b = boards && boards[key];
  return { key, name: g.name, tag: b && b.label ? `Today: ${calm(b.label)}` : g.tag, href: g.href || `/${key}`, glyph: key, color: g.color || '#33415c' };
}

function outsideFootprint() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      let m = /^sot_([a-z]+)_(stats|day)$/.exec(k);
      if (m && DAILY_GAME_MAP[m[1]] && !RUNS_ONLY.has(m[1])) return true;
      m = /^sot_([a-z]+)_\d+$/.exec(k);
      if (m && DAILY_GAME_MAP[m[1]] && !RUNS_ONLY.has(m[1])) {
        const sv = JSON.parse(localStorage.getItem(k) || 'null');
        if (sv && (sv.t0 || sv.status === 'done' || sv.status === 'won' || sv.status === 'lost')) return true;
      }
    }
  } catch (e) {}
  return false;
}

export default function GauntletMorePop({ circuitId = 'gauntlet', ready = false, results = [], sections = [], boards = null, onOpenChange, onShown }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const fired = useRef(false);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => { if (onOpenChange) onOpenChange(open); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || fired.current || !CONFIG[circuitId]) return undefined;
    let alive = true;
    let timer = null;
    let force = false;
    try { force = new URLSearchParams(window.location.search).get('more') === 'preview'; } catch (e) {}
    const today = etToday();
    if (!force) {
      try {
        if (localStorage.getItem(DAY_KEY(circuitId)) === today) return undefined;
        if ((Number(localStorage.getItem(COUNT_KEY(circuitId))) || 0) >= MAX_SHOWS) return undefined;
      } catch (e) { return undefined; }
      if (outsideFootprint()) return undefined;
    }
    (force ? Promise.resolve(null) : fetchDayStatus()).then((d) => {
      if (!alive || fired.current) return;
      if (!force && d && d.archive) {
        for (const [k, v] of Object.entries(d.archive)) {
          if (!RUNS_ONLY.has(k) && v && v.played > 0) return;
        }
      }
      timer = setTimeout(() => {
        if (!alive || fired.current) return;
        fired.current = true;
        if (!force) {
          try {
            localStorage.setItem(DAY_KEY(circuitId), today);
            localStorage.setItem(COUNT_KEY(circuitId), String((Number(localStorage.getItem(COUNT_KEY(circuitId))) || 0) + 1));
          } catch (e) {}
        }
        setCount(liveDailyKeys().length);
        setOpen(true);
        if (onShown) onShown();
      }, WAIT_MS);
    });
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const C = CONFIG[circuitId];
  if (!open || !C) return null;

  // The quiz they went furthest in: share of the quiz cleared, raw score breaks a tie.
  const scored = (results || []).filter((x) => x && x.total > 0 && x.score > 0);
  scored.sort((a, b) => (b.score / b.total - a.score / a.total) || (b.score - a.score));
  const best = scored[0] || null;
  const bestSec = best ? (sections || []).find((s) => s.key === best.key) : null;

  let leadKeys;
  let why;
  if (circuitId === 'gauntlet' && best && best.key === 'sport') {
    const sp = ['bracket', 'listed'].filter((k) => boards && boards[k] && boards[k].sport);
    leadKeys = [...sp, ...['bracket', 'listed', 'potluck'].filter((k) => !sp.includes(k))].slice(0, 3);
    why = sp.length
      ? `Today's ${DAILY_GAME_MAP[sp[0]].name} is a sports one: ${calm(boards[sp[0]].label)}`
      : 'There is no other all-sports daily, but Bracket and Listed often run on sports stats.';
  } else {
    leadKeys = C.lead[best && best.key] || C.fallbackLead;
    why = C.why[best && best.key] || C.fallbackWhy;
  }
  const lead = leadKeys.map((k) => gameOf(k, boards)).filter(Boolean);
  const also = C.also.filter((k) => !leadKeys.includes(k)).map((k) => gameOf(k, boards)).filter(Boolean).slice(0, 4);

  const head = bestSec ? `You went furthest in ${bestSec.name}. Try these next.` : C.fallbackHead;
  const sub = bestSec ? `${best.score} of ${best.total} on ${bestSec.name}. ${why}` : (C.fallbackSub || 'Every one of these is new every day, the same for everyone.');

  const tile = (g, size) => (
    <span className="gmp-tile" style={{ background: g.color, width: size, height: size }}>
      <GameGlyph gameKey={g.glyph} size={Math.round(size * 0.56)} />
    </span>
  );

  return (
    <div className="gmp-bd" onClick={close}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gmp" role="dialog" aria-modal="true" aria-labelledby="gmp-h" onClick={(e) => e.stopPropagation()}>
        <span className="gmp-grab" aria-hidden="true" />
        <button type="button" className="gmp-x" onClick={close} aria-label="Close">
          <X size={16} strokeWidth={2.4} />
        </button>
        <i className="gmp-e">{C.eyebrow}</i>
        <h2 className="gmp-h" id="gmp-h">{head}</h2>
        <p className="gmp-p">{sub} Free, no signup.</p>

        <div className="gmp-lead">
          {lead.map((g, i) => (
            <a key={g.key} className={'gmp-card' + (i ? ' gmp-donly' : '')} href={g.href}>
              <span className="gmp-ch">
                {tile(g, 48)}
                <span className="gmp-ct">
                  {i === 0 ? <span className="gmp-k gmp-monly">Best next pick</span> : null}
                  <span className="gmp-cn">{g.name}</span>
                  <span className="gmp-cg">{g.tag}</span>
                </span>
              </span>
              <span className="gmp-go">Play {g.name}</span>
            </a>
          ))}
        </div>

        <div className="gmp-k gmp-alsoh">Also today</div>
        <div className="gmp-rows">
          {lead.slice(1).map((g) => (
            <a key={'m' + g.key} className="gmp-row gmp-monly" href={g.href}>
              {tile(g, 34)}
              <span className="gmp-rt"><span className="gmp-rn">{g.name}</span><span className="gmp-rg">{g.tag}</span></span>
              <span className="gmp-arr" aria-hidden="true">&rsaquo;</span>
            </a>
          ))}
          {also.map((g, i) => (
            <a key={g.key} className={'gmp-row' + (i >= 2 ? ' gmp-donly' : '')} href={g.href}>
              {tile(g, 34)}
              <span className="gmp-rt"><span className="gmp-rn">{g.name}</span><span className="gmp-rg">{g.tag}</span></span>
              <span className="gmp-arr" aria-hidden="true">&rsaquo;</span>
            </a>
          ))}
        </div>

        <div className="gmp-foot">
          <a className="gmp-all" href="/">See all {count} daily puzzles</a>
          <button type="button" className="gmp-back" onClick={close}>Back to my scorecard</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.gmp-bd{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(3,6,14,.78);backdrop-filter:blur(2px);animation:gmpfade .18s ease-out;}
.gmp{position:relative;width:100%;max-width:860px;max-height:calc(100vh - 40px);overflow-y:auto;box-sizing:border-box;
     background:#10151f;border:1px solid #263046;border-radius:18px;padding:32px 36px 26px;
     font-family:${SANS};color:#e8edf6;box-shadow:0 30px 80px rgba(0,0,0,.55);animation:gmprise .22s ease-out;}
.gmp-grab{display:none;}
.gmp-x{position:absolute;top:14px;right:14px;width:44px;height:44px;border:0;border-radius:22px;background:transparent;
       color:#9aa6bb;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.gmp-x:hover{color:#fff;background:rgba(255,255,255,.07);}
.gmp-x:focus-visible,.gmp a:focus-visible,.gmp-back:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}
.gmp-e{display:block;font-style:normal;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc;margin:0 44px 10px 0;}
.gmp-h{margin:0 44px 0 0;font-size:29px;line-height:1.15;font-weight:800;letter-spacing:-.01em;color:#fff;}
.gmp-p{margin:10px 0 0;font-size:16px;line-height:1.5;color:#b4bfd1;}
.gmp-lead{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px;}
.gmp-card{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:14px;background:#151c2b;
          border:1px solid #263046;text-decoration:none;color:#e8edf6;}
.gmp-card:hover{border-color:#3a4a6b;}
.gmp-ch{display:flex;flex-direction:column;gap:12px;}
.gmp-ct{display:flex;flex-direction:column;gap:4px;min-width:0;}
.gmp-tile{flex:none;border-radius:11px;color:#fff;display:inline-flex;align-items:center;justify-content:center;}
.gmp-cn{font-size:19px;font-weight:800;}
.gmp-cg{font-size:14px;line-height:1.4;color:#a7b2c6;}
.gmp-go{margin-top:auto;height:42px;border-radius:21px;background:#7dd3fc;color:#08222e;display:flex;align-items:center;
        justify-content:center;font-size:14px;font-weight:800;}
.gmp-card:hover .gmp-go{filter:brightness(1.06);}
.gmp-k{display:block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#9aa6bb;}
.gmp-alsoh{margin:22px 0 8px;}
.gmp-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
.gmp-row{display:flex;align-items:center;gap:12px;padding:10px 14px;min-height:44px;border-radius:12px;background:#151c2b;
         border:1px solid #222b3e;text-decoration:none;color:#e8edf6;}
.gmp-row:hover{background:#1b2336;}
.gmp-rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}
.gmp-rn{font-size:15px;font-weight:800;}
.gmp-rg{font-size:13px;color:#a7b2c6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.gmp-arr{color:#7a869b;font-size:20px;line-height:1;}
.gmp-monly{display:none;}
.gmp-foot{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:22px;flex-wrap:wrap;}
.gmp-all{color:#7dd3fc;font-size:15px;font-weight:700;text-decoration:none;}
.gmp-all:hover{color:#bae6fd;}
.gmp-back{height:44px;padding:0 22px;border-radius:22px;border:1px solid #2f3b55;background:transparent;color:#cdd5e3;
          font-family:${SANS};font-size:15px;font-weight:700;cursor:pointer;}
.gmp-back:hover{color:#fff;border-color:#43527a;}
@keyframes gmpfade{from{opacity:0}to{opacity:1}}
@keyframes gmprise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes gmpsheet{from{transform:translateY(100%)}to{transform:none}}
@media(max-width:640px){
  .gmp-bd{align-items:flex-end;padding:0;}
  .gmp{max-width:none;max-height:92vh;border-radius:22px 22px 0 0;border-width:1px 0 0;padding:10px 18px 22px;animation:gmpsheet .26s ease-out;}
  .gmp-grab{display:block;width:40px;height:4px;border-radius:2px;background:#33405a;margin:0 auto 14px;}
  .gmp-x{top:16px;right:8px;}
  .gmp-e{font-size:11px;}
  .gmp-h{font-size:23px;line-height:1.2;}
  .gmp-p{font-size:15px;line-height:1.45;}
  .gmp-lead{grid-template-columns:minmax(0,1fr);margin-top:16px;}
  .gmp-donly{display:none;}
  .gmp-monly{display:flex;}
  .gmp-k.gmp-monly{display:block;font-size:11px;}
  .gmp-ch{flex-direction:row;align-items:center;}
  .gmp-card{padding:16px;gap:12px;}
  .gmp-go{height:46px;border-radius:23px;font-size:15px;}
  .gmp-alsoh{margin:16px 0 8px;font-size:11px;}
  .gmp-rows{grid-template-columns:minmax(0,1fr);gap:0;border:1px solid #222b3e;border-radius:12px;overflow:hidden;}
  .gmp-row{border-radius:0;border:0;border-top:1px solid #1d2536;}
  .gmp-row:first-child{border-top:0;}
  .gmp-foot{flex-direction:column-reverse;align-items:stretch;gap:10px;margin-top:16px;}
  .gmp-back{height:48px;border-radius:24px;}
  .gmp-all{text-align:center;font-size:14px;padding:4px 0;}
}
@media(prefers-reduced-motion:reduce){.gmp-bd,.gmp{animation:none;}}
`;
