'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Footer from '../Footer';
import { KIDS_DAILIES, kidsDayNumber, kidsDateForDay } from '@/lib/kids-daily';

// The frame every kids daily renders inside: the Kids masthead, the title
// row, the board, a "how to play" panel, the cheer, and the strip of the other
// six puzzles. One component so the seven games read as one place.
//
// The look is deliberately louder than the grown-up site (Fredoka display
// over Nunito body, butter ground, candy hues) and deliberately NOT the
// stage: no navy, no leaderboard, no clock that scolds. A kid's daily is done
// when it is done, and the only score is the cheer.

export const KIDS_INK = '#1b1f3b';

export const SHAPE_HUES = ['#ff5a5f', '#ffd23f', '#ff7bb0', '#3bb273', '#3a86ff', '#8e5ae0'];

// Six shapes for Shape Sixes and the confetti. Shape n (1-6) as an SVG string.
export const SHAPES = [
  null,
  '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#ff5a5f"/><circle cx="14" cy="14" r="4" fill="#fff" opacity=".55"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l5 11 12 1.5-9 8 2.6 12L20 29.5 9.4 35.5 12 23.5l-9-8L15 14z" fill="#ffd23f" stroke="#e6b400" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 35S4 25 4 14a8 8 0 0116-3 8 8 0 0116 3c0 11-16 21-16 21z" fill="#ff7bb0"/><circle cx="13" cy="13" r="3" fill="#fff" opacity=".5"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 5L37 34H3z" fill="#3bb273" stroke="#2f9a60" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="6" width="28" height="28" rx="6" fill="#3a86ff"/><rect x="10" y="10" width="9" height="9" rx="3" fill="#fff" opacity=".45"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l16 17-16 17L4 20z" fill="#8e5ae0" stroke="#7345c4" stroke-width="1.5" stroke-linejoin="round"/></svg>',
];

const SAVE_PREFIX = 'sot_kids_';

// Where a board's save lives. Today's board keeps the original slot
// (sot_kids_<key>) so saves from before the archive existed still load; a
// past board from the archive strip gets its own slot per date, so replaying
// #3 never wipes today's half-finished board.
function saveSlot(key, dayKey) {
  return SAVE_PREFIX + key + (kidsDayNumber() === kidsDayNumber(dayKey) ? '' : '_' + dayKey);
}

// The dates this device has finished a game on: sot_kids_<key>_done, an
// array of ISO dates. Written whenever a save carries done:true, read by the
// archive strip so a finished past puzzle wears its check. Nothing else.
function readDoneDays(key) {
  try { const a = JSON.parse(localStorage.getItem(SAVE_PREFIX + key + '_done') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function markDoneDay(key, dayKey) {
  try {
    const a = readDoneDays(key);
    if (a.includes(dayKey)) return;
    a.push(dayKey);
    localStorage.setItem(SAVE_PREFIX + key + '_done', JSON.stringify(a.slice(-400)));
  } catch (e) { /* ignore */ }
}

// Per-device memory of one board: { day, ...state }. Nothing here ever
// leaves the browser.
export function useKidsSave(key, dayKey, initial) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(saveSlot(key, dayKey));
      if (raw) {
        const sv = JSON.parse(raw);
        if (sv && sv.day === dayKey && sv.state) setState(sv.state);
      }
    } catch (e) { /* storage may be unavailable */ }
    setReady(true);
  }, [key, dayKey]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(saveSlot(key, dayKey), JSON.stringify({ day: dayKey, state })); } catch (e) { /* ignore */ }
    if (state && state.done) markDoneDay(key, dayKey);
  }, [key, dayKey, state, ready]);
  return [state, setState, ready];
}

function readDone(key, dayKey) {
  try {
    const raw = localStorage.getItem(saveSlot(key, dayKey));
    if (!raw) return false;
    const sv = JSON.parse(raw);
    return !!(sv && sv.day === dayKey && sv.state && sv.state.done);
  } catch (e) { return false; }
}

// Which of the seven are done today, read on the client only.
export function useKidsDone(dayKey) {
  const [done, setDone] = useState({});
  const refresh = useCallback(() => {
    const d = {};
    for (const g of KIDS_DAILIES) d[g.key] = readDone(g.key, dayKey);
    setDone(d);
  }, [dayKey]);
  useEffect(() => { refresh(); }, [refresh]);
  return [done, refresh];
}

export function KidsMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
      <path d="M20 52l40-34 40 34" stroke={KIDS_INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 102h92" stroke={KIDS_INK} strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(31,48) scale(0.53)">
        <path d="M14 42C12 28 22 16 36 16C40 8 54 6 60 14C70 8 84 14 86 26C96 30 98 44 88 50C92 58 86 66 76 64C74 72 64 74 60 66C48 70 36 66 32 56C20 56 12 50 14 42Z" fill="#3a86ff" />
      </g>
    </svg>
  );
}

export function KidsHeader({ active }) {
  return (
    <header className="kd-hdr">
      <Link className="kd-brand" href="/kids">
        <KidsMark />
        <span className="kd-nm">Mind <span>Loft</span></span>
        <span className="kd-kidstag">Kids</span>
      </Link>
      <nav className="kd-nav">
        <Link className={active === 'today' ? 'on' : ''} href="/kids#today">Today</Link>
        <Link className={active === 'match' ? 'on' : ''} href="/kids#match">Match games</Link>
      </nav>
    </header>
  );
}

export const KIDS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');
.kd{--kbg:#fff6e0;--kpaper:#fff;--kink:#1b1f3b;--kink2:#4a4f6e;--kline:#ecdfbd;--ktile:#fffdf6;--kshadow:0 6px 0 #e9d9ad;--kblue:#3a86ff;--kred:#ff5a5f;--korange:#ff9f1c;--kyellow:#ffd23f;--kgreen:#3bb273;--kpink:#ff7bb0;--kpurple:#8e5ae0;
  --kdisp:'Fredoka','Nunito',system-ui,sans-serif;--kbody:'Nunito',system-ui,sans-serif;
  min-height:100vh;background:var(--kbg);color:var(--kink);font-family:var(--kbody);font-size:16px;line-height:1.5;
  background-image:radial-gradient(#f3e3b5 1.4px,transparent 1.6px);background-size:26px 26px;}
.kd *{box-sizing:border-box}
.kd a{color:inherit}
.kd h1,.kd h2,.kd h3{font-family:var(--kdisp);margin:0;line-height:1.1;text-wrap:balance}
.kd button{font-family:var(--kdisp);font-size:inherit;color:inherit;cursor:pointer}
.kd button:focus-visible,.kd a:focus-visible{outline:3px solid var(--kblue);outline-offset:2px}
.kd-wrap{max-width:1040px;margin:0 auto;padding:0 16px 56px}
.kd-hdr{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0 10px;flex-wrap:wrap}
.kd-brand{display:flex;align-items:center;gap:10px;text-decoration:none}
.kd-nm{font-family:var(--kdisp);font-weight:700;font-size:26px;letter-spacing:-.01em}
.kd-nm span{color:var(--kblue)}
.kd-kidstag{font-family:var(--kdisp);font-weight:700;font-size:15px;background:var(--kyellow);color:var(--kink);padding:4px 12px;border-radius:999px;transform:rotate(-3deg);display:inline-block;margin-left:4px}
.kd-nav{display:flex;gap:6px;flex-wrap:wrap}
.kd-nav a{font-family:var(--kdisp);font-weight:600;text-decoration:none;padding:8px 14px;border-radius:999px;background:var(--kpaper);border:2px solid var(--kline)}
.kd-nav a.on{background:var(--kink);color:#fff;border-color:var(--kink)}
.kd-lbl{font-family:var(--kdisp);font-weight:600;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--kink2)}
.kd-title{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:16px 0 12px}
.kd-title h1{font-size:clamp(30px,5vw,42px);font-weight:700}
.kd-title .kd-sub{color:var(--kink2);font-size:15px}
.kd-card{background:var(--kpaper);border:2px solid var(--kline);border-radius:28px;padding:22px;box-shadow:var(--kshadow)}
.kd-game{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,4fr);gap:28px;align-items:start}
.kd-game > *{min-width:0}
@media (max-width:820px){.kd-game{grid-template-columns:1fr}}
.kd-side{display:flex;flex-direction:column;align-items:stretch}
.kd-side > *{max-width:100%;min-width:0}
.kd-side > h2{order:20;font-size:17px;font-weight:700;margin:22px 0 0;padding-top:16px;border-top:2px solid var(--kline);width:100%;color:var(--kink2)}
.kd-side > h2::before{content:'How to play';display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--kink2);opacity:.8;margin-bottom:2px}
.kd-side > .kd-how{order:21;color:var(--kink2);margin:6px 0 0;max-width:40ch;font-size:15px}
.kd-btn{font-family:var(--kdisp);font-weight:600;font-size:15px;border:2px solid var(--kink);background:var(--kpaper);color:var(--kink);border-radius:999px;padding:8px 16px;cursor:pointer;box-shadow:0 3px 0 var(--kink);transition:transform .08s}
.kd-btn.pri{background:var(--kink);color:#fff}
.kd-btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--kink)}
.kd-btn:disabled{opacity:.45;cursor:default}
.kd-ctrls{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center}
.kd-seg{display:inline-flex;border:2px solid var(--kink);border-radius:999px;overflow:hidden}
.kd-seg button{font-family:var(--kdisp);font-weight:600;font-size:14px;border:0;background:var(--kpaper);padding:7px 14px;cursor:pointer;color:var(--kink)}
.kd-seg button.on{background:var(--kink);color:#fff}
.kd-stats{display:flex;gap:18px;margin-top:18px;font-family:var(--kdisp);font-weight:600;color:var(--kink2);font-size:14px;font-variant-numeric:tabular-nums;flex-wrap:wrap}
.kd-stats b{display:block;font-size:26px;color:var(--kink);font-weight:700;line-height:1}
.kd-cheer{margin-top:16px;background:linear-gradient(90deg,var(--kyellow),#ffe58a);border-radius:16px;padding:12px 16px;font-family:var(--kdisp);font-weight:700;font-size:20px;display:none;align-items:center;gap:10px;flex-wrap:wrap}
.kd-cheer.show{display:flex}
.kd-cheer small{font-family:var(--kbody);font-weight:700;font-size:14px;color:var(--kink2);display:block;width:100%}
.kd-note{margin-top:12px;font-size:14px;color:var(--kink2)}
.kd-shake{animation:kdshake .35s}
@keyframes kdshake{20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes kdpop{40%{transform:scale(1.12)}}
.kd-pop{animation:kdpop .5s both}
/* strip of the other puzzles */
.kd-strip{margin-top:36px}
.kd-strip h2{font-size:22px;font-weight:700;margin-bottom:12px}
.kd-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.kd-mini{background:var(--kpaper);border:2px solid var(--kline);border-radius:18px;padding:12px 14px;text-decoration:none;box-shadow:0 4px 0 #e9d9ad;display:flex;flex-direction:column;gap:4px;position:relative;transition:transform .12s}
.kd-mini:hover{transform:translateY(-2px)}
.kd-mini b{font-family:var(--kdisp);font-weight:700;font-size:17px}
.kd-mini span{font-size:12px;color:var(--kink2);line-height:1.35}
.kd-mini .kd-dot{width:12px;height:12px;border-radius:50%;position:absolute;top:12px;right:12px}
.kd-mini.done{background:#f0faf3;border-color:#bfe7d1}
.kd-mini.done .kd-dot{background:var(--kgreen)!important;box-shadow:0 0 0 3px #d8f2e2}
.kd-mini.on{border-color:var(--kink)}
.kd-arch{margin-top:28px}
.kd-arch h2{font-family:var(--kdisp);font-size:20px;margin:0 0 10px}
.kd-archrow{display:flex;flex-wrap:wrap;gap:8px}
.kd-chip{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:58px;padding:7px 10px;border:2.5px solid var(--kline);border-radius:14px;background:#fff;color:var(--kink);text-decoration:none;line-height:1.1}
.kd-chip b{font-family:var(--kdisp);font-size:17px}
.kd-chip span{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--kink2);min-height:12px}
.kd-chip.done{background:#f0faf3;border-color:#bfe7d1}
.kd-chip.done span{color:var(--kgreen)}
.kd-chip.done b::after{content:' ✓';color:var(--kgreen)}
.kd-chip.cur{background:#fff;box-shadow:0 0 0 3px #fff, 0 0 0 5px currentColor}
.kd-chip:hover{transform:translateY(-1px)}
.kd-foot{margin-top:40px;color:var(--kink2);font-size:13px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:2px solid var(--kline);padding-top:16px}
@media (prefers-reduced-motion:reduce){.kd *{animation:none!important;transition:none!important}}
`;

// The archive strip: every past puzzle of this game as a numbered chip,
// newest first, directly under the board. A chip links to ?p=<n>; the one on
// screen is marked, and a puzzle this device has finished wears its check.
// Local only, like everything else on the kids track: the checks are read
// from sot_kids_<key>_done and never leave the browser.
export function KidsArchive({ game, dayNum, todayNum }) {
  const [doneDays, setDoneDays] = useState([]);
  useEffect(() => { setDoneDays(readDoneDays(game.key)); }, [game.key, dayNum]);
  const total = todayNum || dayNum;
  if (total < 2) return null;
  const chips = [];
  for (let n = total; n >= 1; n--) chips.push(n);
  const doneSet = new Set(doneDays);
  return (
    <section className="kd-arch" aria-label="Past puzzles">
      <h2>{dayNum === total ? 'Play a past puzzle' : `You are on #${dayNum}. Pick another`}</h2>
      <div className="kd-archrow">
        {chips.map((n) => {
          const isCur = n === dayNum;
          const isToday = n === total;
          const done = doneSet.has(kidsDateForDay(n));
          const href = isToday ? game.href : `${game.href}?p=${n}`;
          return (
            <Link key={n} href={href} className={`kd-chip${isCur ? ' cur' : ''}${done ? ' done' : ''}`} aria-current={isCur ? 'page' : undefined} style={isCur ? { borderColor: game.hue, color: game.hue } : undefined}>
              <b>#{n}</b>
              <span>{isToday ? 'Today' : done ? 'Done' : ' '}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function KidsStrip({ selfKey, dayKey }) {
  const [done] = useKidsDone(dayKey);
  return (
    <section className="kd-strip" aria-label="Today's other puzzles">
      <h2>{selfKey ? 'The other puzzles today' : "Today's puzzles"}</h2>
      <div className="kd-row">
        {KIDS_DAILIES.filter((g) => g.key !== selfKey).map((g) => (
          <Link key={g.key} href={g.href} className={`kd-mini${done[g.key] ? ' done' : ''}`}>
            <span className="kd-dot" style={{ background: g.hue }} />
            <b>{g.title}</b>
            <span>{done[g.key] ? 'Done for today!' : g.tag}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Confetti pop: six shapes flung from the cheer. Pure CSS, no library.
export function Confetti({ go }) {
  if (!go) return null;
  const bits = [];
  for (let i = 0; i < 18; i++) {
    const s = (i % 6) + 1;
    bits.push(
      <span
        key={i}
        className="kd-cf"
        style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.08}s`, animationDuration: `${1.4 + (i % 4) * 0.25}s` }}
        dangerouslySetInnerHTML={{ __html: SHAPES[s] }}
      />
    );
  }
  return (
    <div className="kd-cfwrap" aria-hidden="true">
      <style>{`
        .kd-cfwrap{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}
        .kd-cf{position:absolute;top:-40px;width:28px;height:28px;animation:kdfall linear forwards}
        .kd-cf svg{width:100%;height:100%}
        @keyframes kdfall{to{transform:translateY(110vh) rotate(540deg);opacity:.2}}
      `}</style>
      {bits}
    </div>
  );
}

export default function KidsShell({ game, dayLabel, dayNum, dayKey, todayNum, sub, children }) {
  return (
    <div className="kd">
      <style dangerouslySetInnerHTML={{ __html: KIDS_CSS }} />
      <div className="kd-wrap">
        <KidsHeader active="today" />
        <div className="kd-title">
          <h1>{game.title}</h1>
          <span className="kd-sub">{dayLabel} · Puzzle #{dayNum}{sub ? ` · ${sub}` : ''}</span>
        </div>
        {children}
        <KidsArchive game={game} dayNum={dayNum} todayNum={todayNum} />
        <KidsStrip selfKey={game.key} dayKey={dayKey} />
        <div className="kd-foot">
          <span>Mind Loft Kids · free, no sign-up, no ads. Grown-ups can find the full slate at <Link href="/">mindloftdaily.com</Link>.</span>
          <span>Puzzle #{dayNum} · {dayLabel}</span>
        </div>
      </div>
      <Footer />
    </div>
  );
}
