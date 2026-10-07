'use client';

// Passport (owner, 2026-10-03): the daily geography run. One mystery country
// a day, played five ways, one score out of 50:
//
//   1 Landmark  a zoomed photo pulls back a frame per wrong country; naming
//               the country unseals the day's destination
//   2 Flag      build its flag in three picks: colors, layout, the real one
//   3 Borders   name every land neighbor (an island names its two nearest
//               countries across the water)
//   4 Capital   drop a pin on an unlabeled map, scored by distance
//   5 Numbers   five bigger-or-smaller calls on land area
//
// PLAYERS SEE IT ONLY AS A CIRCUIT (owner, 2026-10-03). It is registered as a
// daily (key `passport`) so its rows score, rank and pay IQ Points, but it is
// RUN_ONLY in lib/daily-games: no daily list, category or count shows it. The
// page is the run register Price Check and the Trivia Gauntlet wear: its own
// cap, the Launch pregame (departures board, boarding pass, visa page,
// ladder), the rounds, the Finale curtain, then a settled ending with the
// run's leaderboard at /passport/leaderboard. Never LoftFinish.
// The day's content is resolved on the server and only today's ships.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import DailyRules from '../DailyRules';
import useDuelContext, { DuelBanner } from '../quiz/[id]/useDuelContext';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import { isMobileDevice } from '@/lib/is-mobile';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import useCircuitBoard from '../circuits/useCircuitBoard';
import RunNudgePop from '../circuits/RunNudgePop';
import { CONTEST, contestIsLive } from '@/lib/contest';
import { T } from '@/lib/theme';
import { meRequest } from '@/app/quizMeClient';
import { BORDERS, buildAliasMap, buildPrefixAmbiguous, normGuess } from '../flank/borders';
import {
  KEY, TOTAL, ROUNDS, ZOOM, LANDMARK_PTS, flagScore, STRIKES, bordersScore, capitalScore, NUMBER_PTS,
  haversineKm, unproject, TIERS, tierIndex, HENLEY_EDITION, shareLines,
} from '@/lib/passport';
import { flagSteps } from './flagkit';
import NextDrop from '../NextDrop';
import { DOTS, HOME } from './dots';

const NAME = 'Passport';
const PATH = '/passport';
const COLORS = {
  cream: T.surface, ink: T.ink, ember: T.accent, rust: T.danger, faded: T.muted,
  accent: '#be123c', accentSoft: '#fdecef', green: T.successDeep,
};
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";
const STAMP_FONT = "'Stardos Stencil', 'DM Mono', ui-monospace, monospace";
const HELP_KEY = 'sot_passport_help_seen';
const STATS_KEY = 'sot_passport_stats';
const INKS = ['#a78bfa', '#60a5fa', '#34d399', '#f87171', '#fbbf24'];
const INKS_LIGHT = ['#6d28d9', '#1d4ed8', '#047857', '#b91c1c', '#a16207'];
const ROTS = [-7, 5, -4, 6, -5];

const ALIAS = buildAliasMap();
const PREFIX_AMBIG = buildPrefixAmbiguous(ALIAS);
const nameOf = (code) => (BORDERS[code] ? BORDERS[code].name : code);

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
// Printed objects carry their own paper and ink in both registers: the boarding
// pass is card stock and the upgrade chip is gold foil, each with dark ink set
// beside it, so neither follows the stage's ground.
const PASS_PAPER = '#f3efe4';
const UPGRADE_GOLD = '#e8b43a';
function pickPuzzle(puzzles, forceNum) {
  if (forceNum) { const p = puzzles.find((x) => x.num === forceNum); if (p) return p; }
  const today = etToday();
  const open = puzzles.filter((p) => p.live <= today);
  return open.length ? open[open.length - 1] : puzzles[0];
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function msToMidnightET() {
  try {
    const now = new Date();
    const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const next = new Date(et); next.setHours(24, 0, 0, 0);
    return next - et;
  } catch (e) { return 0; }
}
function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch (e) { return null; }
}
function getStats() {
  try { const s = JSON.parse(localStorage.getItem(STATS_KEY)); if (s && s.v === 1 && s.rec) return s; } catch (e) {}
  return { v: 1, rec: {} };
}
function recordStat(num, entry) {
  const s = getStats();
  if (s.rec[num]) return s;
  const s2 = { ...s, rec: { ...s.rec, [num]: entry } };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}
function deriveStats(s, todayNum) {
  const rec = s && s.rec ? s.rec : {};
  let cur = 0, at = rec[todayNum] ? todayNum : todayNum - 1;
  while (rec[at]) { cur++; at--; }
  return { played: Object.keys(rec).length, cur };
}
function mergeServerStats(s, recent, puzzles) {
  if (!s || !Array.isArray(recent) || !recent.length) return s;
  const byQuiz = {};
  for (const p of puzzles) byQuiz[p.quizId] = p;
  let rec = s.rec, changed = false;
  for (const m of recent) {
    const p = m && byQuiz[m.quizId];
    if (!p || m.attempt !== 1 || rec[p.num]) continue;
    const sc = Math.max(0, Math.min(TOTAL, Math.round(((m.scorePct || 0) / 100) * TOTAL)));
    if (!changed) { rec = { ...rec }; changed = true; }
    rec[p.num] = { s: sc, t: TOTAL, won: sc >= 30 };
  }
  if (!changed) return s;
  const s2 = { ...s, rec };
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s2)); } catch (e) {}
  return s2;
}

const HAPT = { tick: [12], wrong: [30, 40, 30], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

const freshState = () => ({
  v: 1, status: 'playing', t0: null, tEnd: null, round: 0, fin: false,
  sc: [null, null, null, null, null],
  r0: { z: 0, wrong: [] },
  r1: { st: 0, miss: 0, bad: [] },
  r2: { found: [], wrong: [], over: false },
  r3: { pin: null, km: null },
  r4: { i: 0, res: [] },
});
const sumScores = (sc) => sc.reduce((t, v) => t + (v || 0), 0);

// ── a stamp ─────────────────────────────────────────────────────────────────
function Stamp({ i, score, big, slam, label, ink }) {
  const r = ROUNDS[i] || {};
  return (
    <div className={`pp-stamp${big ? ' big' : ''}${slam ? ' slam' : ''}`} style={{ '--ink': ink, '--rot': `${ROTS[i % 5] || -6}deg` }}>
      <div>
        <div className="s1">{label || r.n}</div>
        <div className="s2">{score}{label ? null : <span>/10</span>}</div>
      </div>
    </div>
  );
}

// ── the passport cover ──────────────────────────────────────────────────────
function Cover({ tier, flip }) {
  return (
    <div className={`pp-cover${flip ? ' flipping' : ''}`} style={{ '--cv': tier.cv, '--cf': tier.cf }}>
      <div className="t1">{tier.t1}</div>
      <div className="em" aria-hidden="true">
        {tier.swiss ? (
          <svg viewBox="0 0 84 84" width="84" height="84"><path d="M34 14h16v20h20v16H50v20H34V50H14V34h20z" fill="#fff" /></svg>
        ) : (
          <svg viewBox="0 0 84 84" width="84" height="84"><circle cx="42" cy="42" r="30" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="42" cy="42" r="24" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M42 29l3.8 8.2 9 .9-6.8 6 2 8.8L42 48.2l-8 4.7 2-8.8-6.8-6 9-.9z" fill="currentColor" /></svg>
        )}
      </div>
      <div className="t2">{tier.t2}</div>
      <div className="chipi" aria-hidden="true" />
    </div>
  );
}

// ── the finale curtain: stamps land, the cover upgrades rung by rung ────────
function Finale({ scores, total, clock, inks, onDone }) {
  const [phase, setPhase] = useState('book');
  const [shown, setShown] = useState(0);
  const [tot, setTot] = useState(0);
  const [tier, setTier] = useState(0);
  const [flip, setFlip] = useState(false);
  const [upg, setUpg] = useState(null);
  const skipRef = useRef(false);
  const target = tierIndex(total);
  useEffect(() => {
    let alive = true;
    const timers = [];
    const wait = (ms) => new Promise((res) => { if (skipRef.current) { res(); return; } timers.push(setTimeout(res, ms)); });
    (async () => {
      await wait(700);
      let acc = 0;
      for (let i = 0; i < 5; i++) {
        if (!alive) return;
        setShown(i + 1); acc += scores[i] || 0; setTot(acc);
        await wait(560);
      }
      await wait(650);
      if (!alive) return;
      setPhase('cover'); setTot(0);
      await wait(450);
      for (let k = 1; k <= target; k++) {
        if (!alive) return;
        setTot(TIERS[k].min);
        setFlip(true);
        await wait(330);
        setTier(k); setUpg(TIERS[k].short);
        await wait(420);
        setFlip(false);
        await wait(380);
      }
      setTot(total);
      await wait(500);
      if (!alive) return;
      setPhase('issued');
      await wait(1300);
      if (alive) onDone();
    })();
    return () => { alive = false; timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skip = () => { skipRef.current = true; onDone(); };
  return (
    <div className="pp-fin" role="dialog" aria-modal="true" aria-label="Your passport" onClick={skip}>
      {phase === 'book' ? (
        <div className="pp-book">
          <div className="pp-spread">
            <div className="pp-pg">
              <div className="lab">Passport · Mind Loft</div>
              <div className="pp-idrow"><div className="pp-idph" /><div><div className="lab">Surname</div><div className="v">TRAVELER</div><div className="lab" style={{ marginTop: 4 }}>Time</div><div className="v">{clock}</div></div></div>
              <div className="pp-mrz">P&lt;MLFTRAVELER&lt;&lt;YOU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br />ML{String(total).padStart(2, '0')}50&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</div>
            </div>
            <div className="pp-pg r">
              <div className="lab">Visas</div>
              <div className="pp-vstamps">
                {scores.slice(0, shown).map((s, i) => <Stamp key={i} i={i} score={s} slam ink={INKS_LIGHT[i]} />)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pp-cstage">
          <Cover tier={TIERS[tier]} flip={flip} />
          {upg && <span key={upg} className="pp-upg">Upgraded to {upg}</span>}
          {phase === 'issued' && (
            <div className="pp-issued"><Stamp i={0} big slam label="Visa-free" score={TIERS[tier].vf} ink={target === 0 ? '#fb7185' : '#6ee7b7'} /></div>
          )}
        </div>
      )}
      {phase === 'cover' || phase === 'issued' ? (
        <div className="pp-rungs">{TIERS.map((t, k) => <div key={k} className={k <= tier ? 'on' : ''} style={{ '--rc': t.cv }}><i /><b>{t.min}</b></div>)}</div>
      ) : null}
      <div className="pp-fintot"><span>{tot}</span><small>/50</small></div>
      <span className="pp-skip">Tap to skip</span>
    </div>
  );
}

// ── THE LAUNCH PAGE (owner-approved mockup, 2026-10-03) ─────────────────────
// Passport's own pregame, in the run register Price Check and the Trivia
// Gauntlet wear: a split-flap departures board that hunts for the destination
// and never lands, a boarding pass that IS the start button, the flight map,
// the visa page stamping its five rounds, and the six-passport ladder.
const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FLAPS = 9;
const LAUNCH_INKS = ['#a78bfa', '#60a5fa', '#34d399', '#f87171', '#f59e0b'];
const LAUNCH_ROT = ['-7deg', '4deg', '-3deg', '6deg', '-5deg'];
const DEMO_STAMPS = [10, 7, 8, 9, 6];

function etClock() {
  try { return new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }); }
  catch (e) { return ''; }
}

function Launch({ puzzle, canvasRef, onBoard }) {
  const cells = useRef([]);
  const sealedRef = useRef(false);
  const [sealed, setSealed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [clock, setClock] = useState('');
  const [howOpen, setHowOpen] = useState(false);
  const [stampOn, setStampOn] = useState(0);
  const [glint, setGlint] = useState(-1);

  useEffect(() => {
    setClock(etClock());
    const iv = setInterval(() => setClock(etClock()), 15000);
    return () => clearInterval(iv);
  }, []);

  // Each flap runs its own burst and rest, so the row reads like a real board
  // hunting. Written straight to the DOM: nine cells flipping every 85ms would
  // otherwise re-render the page eleven times a second.
  useEffect(() => {
    if (reducedMotion()) { cells.current.forEach((c) => { if (c) c.firstChild.textContent = '?'; }); return undefined; }
    const timers = [];
    const flip = (c, ch) => { c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip'); c.firstChild.textContent = ch; };
    const hunt = (c) => {
      if (sealedRef.current || !c) return;
      let n = 4 + Math.floor(Math.random() * 9);
      const step = () => {
        if (sealedRef.current) return;
        if (n-- <= 0) { timers.push(setTimeout(() => hunt(c), 500 + Math.random() * 1500)); return; }
        flip(c, AZ[Math.floor(Math.random() * 26)]);
        timers.push(setTimeout(step, 85));
      };
      step();
    };
    cells.current.forEach((c, i) => timers.push(setTimeout(() => hunt(c), 300 + i * 90)));
    return () => timers.forEach(clearTimeout);
  }, []);

  // The visa page stamps its five rounds, holds, clears, and goes again.
  useEffect(() => {
    if (reducedMotion()) { setStampOn(5); return undefined; }
    let alive = true; const timers = [];
    const loop = () => {
      if (!alive) return;
      setStampOn(0);
      for (let i = 1; i <= 5; i++) timers.push(setTimeout(() => alive && setStampOn(i), 500 + (i - 1) * 520));
      timers.push(setTimeout(loop, 500 + 5 * 520 + 3200));
    };
    loop();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []);

  // A glint climbs the ladder, cover by cover.
  useEffect(() => {
    if (reducedMotion()) return undefined;
    let i = 0;
    const iv = setInterval(() => { setGlint(i % TIERS.length); i++; }, 420);
    return () => clearInterval(iv);
  }, []);

  function board() {
    if (sealedRef.current) return;
    sealedRef.current = true; setSealed(true);
    'SEALED'.padEnd(FLAPS, ' ').split('').forEach((ch, i) => {
      setTimeout(() => { const c = cells.current[i]; if (c) { c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip'); c.firstChild.textContent = ch; } }, i * 60);
    });
    setTimeout(() => setLeaving(true), reducedMotion() ? 0 : 600);
    setTimeout(onBoard, reducedMotion() ? 50 : 1150);
  }

  return (
    <section className={`pl${leaving ? ' leave' : ''}`}>
      <div className="pl-eb pl-lift">{puzzle.dateLabel} · Passport No. {puzzle.num}{puzzle.sunday ? ' · Sunday Edition' : ''}</div>
      <h1 className="pl-title pl-lift">Passport</h1>
      <p className="pl-lede pl-lift">One mystery country. <b>Five rounds</b>, ten points each. Your score decides <b>which passport</b> you travel home on.</p>

      <div className="pl-board" role="img" aria-label="Departures board: the destination is sealed until you board">
        <div className="pl-bhd"><span>Departures · Mind Loft Air</span><span className="clk">{clock ? `${clock} ET` : ''}</span></div>
        <div className="pl-brow">
          <span className="lab">Destination</span>
          <div className="pl-flaps">
            {Array.from({ length: FLAPS }, (_, i) => (
              <div key={i} className="cell" ref={(el) => { cells.current[i] = el; }}><span>{AZ[(i * 7) % 26]}</span></div>
            ))}
          </div>
          <span className="lab">Status</span>
          <div><span className={`pl-status${sealed ? ' off' : ''}`}><i />{sealed ? 'DEPARTED' : 'BOARDING'}</span></div>
        </div>
        <div className="pl-bfacts">
          <div><span className="lab">Flight</span><b>ML {String(puzzle.num).padStart(3, '0')}</b></div>
          <div><span className="lab">Gate</span><b>5 rounds</b></div>
          <div><span className="lab">Best fare</span><b>50 pts</b></div>
        </div>
      </div>

      <button type="button" className="pl-pass" onClick={board} aria-label="Board now: start the run">
        <span className="main"><small>Boarding pass · Passenger: You</small><b>Board now &rarr;</b></span>
        <span className="stub"><small>Seat</small><b>1A</b></span>
      </button>

      <div className="pl-map pl-lift"><canvas ref={canvasRef} width="1000" height="500" aria-hidden="true" /><span className="tag">Destination sealed until you land</span></div>

      <div className="pl-sec pl-lift">
        <div className="pl-eb">Your visa page</div>
        <h2>Five rounds, five stamps</h2>
        <p>Name the country from a landmark, build its flag, list its neighbors, pin its capital and call its size.</p>
        <div className="pl-visa">
          {ROUNDS.map((r, i) => (
            <div key={r.k} className="slot">
              <div className={`stamp${stampOn > i ? ' on' : ''}`} style={{ '--c': LAUNCH_INKS[i], '--r': LAUNCH_ROT[i] }}><small>{r.n}</small><b>{DEMO_STAMPS[i]}</b><em>/10</em></div>
              <span className="lbl">{i + 1} {r.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pl-sec pl-lift">
        <div className="pl-eb">{HENLEY_EDITION}</div>
        <h2>The passport you travel home on</h2>
        <p>One real passport per continent, in true order of visa-free destinations.</p>
        <div className="pl-ladder">
          {TIERS.map((t, i) => (
            <div key={t.short} className={`pp${i === TIERS.length - 1 ? ' top' : ''}`}>
              <div className={`cv${glint === i ? ' glint' : ''}`} style={{ '--cv': t.cv, '--cf': t.cf, '--i': i }}>
                <span className="t">{t.swiss ? 'Schweizer Pass' : t.t1}</span>
                {t.swiss ? (
                  <svg viewBox="0 0 84 84" aria-hidden="true"><path d="M34 14h16v20h20v16H50v20H34V50H14V34h20z" fill="#fff" /></svg>
                ) : (
                  <svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="30" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="42" cy="42" r="23" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M42 29l3.8 8.2 9 .9-6.8 6 2 8.8L42 48.2l-8 4.7 2-8.8-6.8-6 9-.9z" fill="currentColor" /></svg>
                )}
                <span className="w">{t.t2}</span>
              </div>
              <span className="nm">{t.short}</span>
              <span className="mn"><b>{i === TIERS.length - 1 ? t.min : `${t.min}+`}</b> · {t.vf} free</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pl-row pl-lift">
        <button type="button" className="pl-how" aria-expanded={howOpen} onClick={() => setHowOpen((v) => !v)}>{howOpen ? 'Hide scoring' : 'How scoring works'}</button>
        <span className="pl-eb">Sundays bring a country with 8+ neighbors</span>
      </div>
      {howOpen && (
        <div className="pl-rules">
          <ol>
            <li><b>Landmark.</b> A photo zoomed right in. Each wrong country pulls the camera back: 10, 8, 5 or 3 points.</li>
            <li><b>Flag.</b> Pick its colors, its layout, then the real flag. Each wrong pick takes 3 off.</li>
            <li><b>Borders.</b> Name every land neighbor before three strikes. Islands name the two nearest countries across the water.</li>
            <li><b>Capital.</b> One tap on a blank map. Close enough is a full 10, and a point comes off for every step further out.</li>
            <li><b>Numbers.</b> Five countries, bigger or smaller by land area. Two points each.</li>
          </ol>
          <p>The board ranks your total, then your time. Areas and capitals are from the CIA World Factbook, the passports from the {HENLEY_EDITION}. Photos from Wikimedia Commons, flags from flag-icons.</p>
        </div>
      )}
    </section>
  );
}

const LAUNCH_CSS = `
.pl{max-width:640px;margin:0 auto;padding:6px 0 20px;text-align:center}
.pl-eb{font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--stg-mute,#9aa8c4)}
.pl-title{margin:10px 0 0;font-family:${STAMP_FONT};font-weight:700;font-size:clamp(46px,10vw,84px);letter-spacing:.06em;text-transform:uppercase;line-height:1;color:var(--stg-ink,#e9edf4);display:inline-block;position:relative;animation:plslam .55s cubic-bezier(.2,1.6,.4,1) .15s both}
.pl-title::after{content:'';position:absolute;inset:-6px -14px;border:3px solid #f0718b;border-radius:10px;opacity:0;transform:rotate(-3deg) scale(1.3);animation:plring .5s .55s ease-out both}
@keyframes plslam{from{transform:scale(2.2) rotate(-6deg);opacity:0;filter:blur(3px)}to{transform:none;opacity:1;filter:none}}
@keyframes plring{to{opacity:.85;transform:rotate(-3deg) scale(1)}}
.pl-lede{margin:16px auto 0;max-width:520px;font-size:15.5px;font-weight:600;line-height:1.5;color:var(--stg-mute,#9aa8c4);text-wrap:balance}
.pl-lede b{color:var(--stg-ink,#e9edf4)}
.pl-board{margin:22px auto 0;max-width:600px;background:linear-gradient(180deg,#1b2131,#10141f);border:1.5px solid rgba(255,255,255,.12);border-radius:16px;box-shadow:0 18px 40px rgba(0,0,0,.55);overflow:hidden;text-align:left}
.pl-bhd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.12);font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#c9d3e6}
.pl-bhd .clk{font-size:13px;letter-spacing:.04em;color:#f4d58d;font-variant-numeric:tabular-nums;text-transform:none}
.pl-brow{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;padding:14px 14px 12px;align-items:center}
.pl .lab{font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9aa8c4}
.pl-flaps{display:flex;gap:3px}
.pl-flaps .cell{position:relative;width:clamp(22px,6.2vw,36px);height:clamp(32px,8.6vw,48px);background:#151a26;border-radius:4px;display:flex;align-items:center;justify-content:center;font:500 clamp(18px,5.4vw,30px)/1 ${MONO};color:#f4d58d;box-shadow:inset 0 -2px 0 rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06);overflow:hidden}
.pl-flaps .cell::after{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.65)}
.pl-flaps .cell.flip span{animation:plflip .12s ease-in}
@keyframes plflip{0%{transform:rotateX(0)}50%{transform:rotateX(88deg)}100%{transform:rotateX(0)}}
.pl-status{display:inline-flex;align-items:center;gap:8px;font:500 13px ${MONO};letter-spacing:.14em;color:#6ee7b7}
.pl-status i{width:8px;height:8px;border-radius:50%;background:currentColor;animation:plblink 1.1s steps(1) infinite}
.pl-status.off{color:#f4d58d}.pl-status.off i{animation:none}
@keyframes plblink{50%{opacity:.15}}
.pl-bfacts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid rgba(255,255,255,.12)}
.pl-bfacts div{padding:9px 14px;border-right:1px solid rgba(255,255,255,.12)}
.pl-bfacts div:last-child{border-right:0}
.pl-bfacts b{display:block;font:500 15px ${MONO};color:#e9edf4}
.pl-pass{display:flex;width:100%;max-width:600px;margin:12px auto 0;padding:0;border:0;border-radius:16px;overflow:hidden;cursor:pointer;background:#7dd3fc;color:#08222e;font:inherit;box-shadow:0 14px 34px rgba(0,0,0,.55);text-align:left}
.pl-pass .main{flex:1;padding:14px 18px;display:flex;flex-direction:column;gap:2px;position:relative;overflow:hidden}
.pl-pass .main small,.pl-pass .stub small{font:500 10px ${MONO};letter-spacing:.16em;text-transform:uppercase;opacity:.75}
.pl-pass .main b{font:800 21px ${SANS}}
.pl-pass .main::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%);transform:translateX(-100%);animation:plsheen 2.6s 1.6s ease-in-out infinite}
@keyframes plsheen{to{transform:translateX(100%)}}
.pl-pass .stub{width:112px;border-left:2px dashed rgba(8,34,46,.4);padding:14px 12px;display:flex;flex-direction:column;justify-content:center;gap:2px;position:relative}
.pl-pass .stub::before,.pl-pass .stub::after{content:'';position:absolute;left:-9px;width:16px;height:16px;border-radius:50%;background:var(--stg-ground,#0b0f1a)}
.pl-pass .stub::before{top:-8px}.pl-pass .stub::after{bottom:-8px}
.pl-pass .stub b{font:500 18px ${MONO}}
.pl-pass:focus-visible,.pl-how:focus-visible{outline:2px solid #e9edf4;outline-offset:3px}
.pl-pass:active{transform:scale(.985)}
.pl-map{margin:26px auto 0;max-width:600px;border-radius:16px;border:1.5px solid rgba(255,255,255,.12);background:#0d1220;overflow:hidden;position:relative}
.pl-map canvas{display:block;width:100%;height:auto;aspect-ratio:2/1}
.pl-map .tag{position:absolute;left:12px;bottom:10px;font:500 10px ${MONO};letter-spacing:.14em;text-transform:uppercase;color:#9aa8c4}
.pl-sec{margin:34px auto 0;max-width:600px;text-align:left}
.pl-sec h2{margin:6px 0 4px;font-size:22px;font-weight:800;letter-spacing:-.01em;color:#e9edf4;text-wrap:balance}
.pl-sec p{margin:0;color:#9aa8c4;font-weight:600;font-size:14px;line-height:1.5}
.pl-visa{margin-top:14px;background:#efe9da;border-radius:14px;padding:14px 14px 26px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;position:relative;box-shadow:0 14px 34px rgba(0,0,0,.5)}
.pl-visa::before{content:'VISAS';position:absolute;right:14px;top:8px;font:500 9px ${MONO};letter-spacing:.2em;color:#9b917b}
.pl-visa .slot{aspect-ratio:1/1.05;border:1.5px dashed #c8bfa8;border-radius:10px;margin-top:12px;position:relative}
.pl-visa .stamp{position:absolute;inset:4px;border:2.5px solid var(--c);border-radius:9px;color:var(--c);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:${STAMP_FONT};text-transform:uppercase;transform:rotate(var(--r));opacity:0;box-shadow:inset 0 0 0 2px #efe9da,inset 0 0 0 3.5px var(--c)}
.pl-visa .stamp small{font-size:clamp(7px,1.8vw,10px);letter-spacing:.1em}
.pl-visa .stamp b{font-size:clamp(16px,4.6vw,24px);font-weight:700;line-height:1}
.pl-visa .stamp em{font-style:normal;font-family:${MONO};font-size:clamp(7px,1.7vw,9px);letter-spacing:.08em}
.pl-visa .stamp.on{animation:plstamp .38s cubic-bezier(.2,1.5,.4,1) both}
@keyframes plstamp{0%{opacity:0;transform:rotate(var(--r)) scale(1.9)}60%{opacity:1}100%{opacity:.92;transform:rotate(var(--r)) scale(1)}}
.pl-visa .lbl{position:absolute;bottom:-17px;left:0;right:0;text-align:center;font:500 9px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:#7a7160;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-ladder{margin-top:16px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-items:end}
.pl-ladder .pp{display:flex;flex-direction:column;align-items:center;gap:6px}
.pl-ladder .cv{width:100%;max-width:92px;aspect-ratio:.7/1;border-radius:6px 9px 9px 6px;background:var(--cv);color:var(--cf);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8% 6%;box-shadow:0 12px 26px rgba(0,0,0,.5),inset 4px 0 0 rgba(0,0,0,.2);position:relative;overflow:hidden;animation:plrise .5s cubic-bezier(.2,1.3,.4,1) both;animation-delay:calc(var(--i) * .11s + .4s)}
.pl-ladder .cv::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.22) 45%,transparent 60%);background-size:260% 100%;background-position:130% 0}
.pl-ladder .cv.glint::after{animation:plglint 1.1s ease-out}
@keyframes plglint{to{background-position:-40% 0}}
@keyframes plrise{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
.pl-ladder .t{font-size:clamp(5px,1.3vw,7px);letter-spacing:.12em;text-transform:uppercase;font-weight:700;text-align:center;line-height:1.3;max-height:3.9em;overflow:hidden}
.pl-ladder svg{width:52%;height:auto}
.pl-ladder .w{font-family:${STAMP_FONT};font-size:clamp(6px,1.6vw,9px);letter-spacing:.14em;text-transform:uppercase;min-height:1em}
.pl-ladder .nm{font-size:12px;font-weight:800;text-align:center;line-height:1.2;color:#e9edf4}
.pl-ladder .mn{font:500 11px ${MONO};color:#9aa8c4;text-align:center}
.pl-ladder .mn b{color:#7dd3fc;font-weight:500}
.pl-ladder .pp.top .nm{color:#f6c56b}
.pl-row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:26px auto 0;max-width:600px}
.pl-how{background:none;border:0;padding:6px 0;color:#9aa8c4;font:700 13px ${SANS};text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.pl-rules{max-width:600px;margin:10px auto 0;text-align:left;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px 16px;color:#e9edf4}
.pl-rules ol{margin:0;padding-left:20px;display:grid;gap:8px;font-size:14px;line-height:1.5}
.pl-rules li b{color:#7dd3fc}
.pl-rules p{margin:12px 0 0;font-size:12.5px;color:#9aa8c4;font-weight:600;line-height:1.5}
.pl.leave .pl-lift{transition:transform .55s cubic-bezier(.6,0,.8,.4),opacity .45s;transform:translateY(-40px);opacity:0}
@media(max-width:560px){
  .pl-brow{grid-template-columns:1fr;gap:4px}
  .pl-bfacts div{padding:8px 10px}
  .pl-pass .stub{width:92px}
  .pl-pass .main b{font-size:18px}
  .pl-ladder{gap:5px}
  .pl-ladder .nm{font-size:10px}
  .pl-ladder .mn{font-size:9.5px}
  .pl-visa{gap:5px;padding:12px 10px 26px}
}
@media(prefers-reduced-motion:reduce){.pl *{animation-duration:.01ms !important;animation-iteration-count:1 !important}.pl.leave .pl-lift{transition:none}}
`;

const ENDING_CSS = `
.pc-cap{display:flex;align-items:center;gap:12px;max-width:760px;margin:0 auto;padding:12px 16px;font-size:13px;font-family:${SANS}}
.pc-home{font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--stg-mute,#9aa8c4);text-decoration:none}
.pc-cap b{font-weight:900;letter-spacing:-.01em}
.pc-capd{color:var(--stg-mute,#9aa8c4);font-weight:700}
.pc-capt{display:flex;gap:4px;margin-left:auto}
.pc-capt i{width:18px;height:6px;border-radius:3px;background:rgba(255,255,255,.12)}
.pc-capt i.d{background:#7dd3fc}
.pc-capt i.on{background:#7dd3fc;box-shadow:0 0 0 2px var(--stg-ground,#0b0f1a),0 0 0 3px #e9edf4}
.pc-clock{font-family:${MONO};font-size:12px;color:#e9edf4;font-variant-numeric:tabular-nums}
@media(max-width:520px){.pc-cap{gap:9px;padding:10px 12px}.pc-cap.on .pc-capd{display:none}.pc-capt i{width:12px}.pc-home{font-size:10px}}
.pc-rules{background:none;border:1px solid rgba(255,255,255,.12);color:#9aa8c4;border-radius:999px;padding:4px 10px;font:700 11.5px ${SANS};cursor:pointer}
.pc-lb{margin-left:auto;font-family:${MONO};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#7dd3fc;text-decoration:none}
.pc-lb:hover{color:#e9edf4}
.pe{max-width:900px;margin:0 auto;padding:10px 0 20px;animation:pein .6s ease both}
@keyframes pein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.pe-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:36px;align-items:center;margin-top:22px}
.pe-cov{display:flex;justify-content:center}
.pe-cov .pp-cover{width:min(250px,62vw)}
.pe-copy{min-width:0;text-align:left}
.pe-you{font:800 12px ${SANS};letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc}
.pe-nm{font-size:clamp(32px,5vw,48px);font-weight:900;letter-spacing:-.02em;line-height:1.02;margin:8px 0 10px;text-wrap:balance;color:#e9edf4}
.pe-ln{font-size:16.5px;line-height:1.45;margin:0 0 16px;max-width:38ch;color:#e9edf4}
.pe-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-bottom:10px;max-width:400px}
.pe-stats div{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px 11px;display:flex;flex-direction:column;gap:3px;min-width:0}
.pe-stats b{font:500 20px ${MONO};white-space:nowrap;color:#e9edf4}
.pe-stats span{font:800 9.5px ${SANS};letter-spacing:.12em;text-transform:uppercase;color:#9aa8c4}
.pe-rounds{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;max-width:400px}
.pe-rounds div{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:7px 2px;text-align:center;min-width:0}
.pe-rounds i{display:block;font:normal 800 8.5px ${SANS};letter-spacing:.05em;text-transform:uppercase;color:#9aa8c4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pe-rounds b{font:500 17px ${MONO};color:#e9edf4}
.pe-rounds .hi{border-color:#7dd3fc}.pe-rounds .hi b{color:#7dd3fc}
.pe-rounds .lo b{color:#fb7185}
.pe-next{display:inline-block;margin-top:12px;font-size:13px;font-weight:700;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);color:#e9edf4}
.pe-next b{color:#7dd3fc}
.pe-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.pe-btns a,.pe-btns button{font:800 14px ${SANS};padding:12px 18px;border-radius:12px;text-decoration:none;color:#e9edf4;border:1px solid rgba(255,255,255,.12);background:transparent;cursor:pointer}
.pe-btns .pri{background:#7dd3fc;color:#08222e;border-color:transparent}
.pe-btns a:focus-visible,.pe-btns button:focus-visible{outline:2px solid #e9edf4;outline-offset:3px}
.pe-foot{margin-top:14px;font-size:12.5px;font-weight:700;color:#9aa8c4}
.pe-foot b{color:#e9edf4;font-variant-numeric:tabular-nums}
.pe-foot a{color:#7dd3fc}
.pe-join{max-width:520px;margin:30px auto 0}
@media(max-width:720px){
  .pe-grid{grid-template-columns:1fr;gap:18px;margin-top:14px}
  .pe-cov .pp-cover{width:min(210px,56vw)}
  .pe-stats,.pe-rounds{max-width:none}
  .pe-ln{font-size:15.5px}
  .pe-btns a,.pe-btns button{flex:1 1 40%;text-align:center;padding:12px 10px}
}
`;

export default function PassportClient({ puzzles = [], day = null, forceNum = null }) {
  // The server picked the day; the client follows it so the two never disagree
  // across midnight.
  const PUZZLE = useMemo(() => pickPuzzle(puzzles, (day && day.num) || forceNum), [puzzles, day, forceNum]);
  const DAY = day;
  const STORE_KEY = `sot_${KEY}_${PUZZLE.num}`;
  const REC_KEY = `sot_${KEY}_rec_${PUZZLE.num}`;

  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [now, setNow] = useState(() => Date.now());
  const [q, setQ] = useState('');
  const [notice, setNotice] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [gateRules, setGateRules] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [finale, setFinale] = useState(false);
  const [nudgeReady, setNudgeReady] = useState(false);
  const [slam, setSlam] = useState(-1);
  const [numShow, setNumShow] = useState(null);
  const [shareCta, setShareCta] = useState('Share');
  useEffect(() => { if (contestIsLive()) setShareCta(`Share for ${CONTEST.prizeLabel}*`); }, []);
  const [hydrated, setHydrated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [stats, setStats] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [installEvt, setInstallEvt] = useState(null);
  const [showA2hsHelp, setShowA2hsHelp] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [mobileUi, setMobileUi] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const searchParams = useSearchParams();
  const { duelToken, duelInfo, duelSubmitted } = useDuelContext(PUZZLE.quizId, searchParams);
  const viewedRef = useRef(false);
  const noticeRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const focusMode = playing && !showChrome;
  const LOFT = true;
  // ONE REGISTER, the run's (owner, 2026-10-03): Passport is a circuit, so it
  // wears the Midnight ground Price Check and the Trivia Gauntlet wear.
  const STAGE = true;
  const stageTheme = 'dark';
  const STAGE_ACC = {};
  const INK = STAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = STAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = STAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = STAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : 'rgba(28,30,36,0.42)';
  const ACC_INK = STAGE ? 'var(--stg-acc-ink)' : COLORS.accent;
  const darkReg = STAGE && stageTheme !== 'light';
  const inks = darkReg ? INKS : INKS_LIGHT;
  const VARS = darkReg
    ? { '--pp-sea': '#0a1222', '--pp-land': '#2a3652', '--pp-edge': '#0b0f1a', '--pp-home': '#f0718b', '--pp-hit': '#2f7a64', '--pp-miss': '#5a3340', '--pp-panel': '#181e2d', '--pp-line': 'rgba(255,255,255,0.18)', '--pp-good': '#6ee7b7', '--pp-bad': '#fb7185', '--pp-gold': '#fbbf24', '--pp-label': '#ffffff', '--pp-halo': '#0b0f1a' }
    : { '--pp-sea': '#dbe7f3', '--pp-land': '#c3cbd8', '--pp-edge': '#ffffff', '--pp-home': '#be123c', '--pp-hit': '#15803d', '--pp-miss': '#d6a2ae', '--pp-panel': '#ffffff', '--pp-line': 'rgba(11,15,26,0.16)', '--pp-good': '#047857', '--pp-bad': '#be123c', '--pp-gold': '#b45309', '--pp-label': '#0b0d12', '--pp-halo': '#ffffff' };

  const sc = g.sc;
  const total = sumScores(sc);
  const done = !playing;
  const outcome = total >= 30 ? 'won' : 'lost';
  const ring = DAY ? (DAY.across || DAY.borders || []) : [];
  const steps = useMemo(() => (DAY ? flagSteps(DAY.flag, DAY.c, PUZZLE.num) : []), [DAY, PUZZLE.num]);
  const unsealed = sc[0] != null;

  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    try {
      setStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
      setMobileUi(isMobileDevice());
    } catch {}
    const onBip = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setStandalone(true); setInstallEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const a2hsClick = () => { const e = installEvt; if (e) { setInstallEvt(null); e.prompt(); } else { setShowA2hsHelp(true); } };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1 && Array.isArray(saved.sc)) {
          const next = { ...freshState(), ...saved };
          gRef.current = next;
          setG(next);
        }
      }
      setGateRules(!localStorage.getItem(HELP_KEY));
    } catch (e) {}
    try { setStats(getStats()); } catch (e) {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    try {
      if (PUZZLE.num === pickPuzzle(puzzles, null).num) {
        const fin = g.status !== 'playing';
        if (fin || g.t0) localStorage.setItem(`sot_${KEY}_day`, JSON.stringify({ d: etToday(), done: fin }));
        else localStorage.removeItem(`sot_${KEY}_day`);
      }
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, PUZZLE, puzzles]);

  useEffect(() => {
    if (g.status === 'playing') return undefined;
    const tick = () => setCountdown(fmtCountdown(msToMidnightET()));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [g.status]);

  useEffect(() => {
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    try {
      const anon = getAnonId();
      let em = '';
      try { const idj = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (idj && idj.email) em = `&email=${encodeURIComponent(idj.email)}`; } catch (e) {}
      if (anon || em) {
        meRequest(`/api/quiz/me?anonId=${encodeURIComponent(anon || '')}${em}&history=1`)
          .then((r) => r.json())
          .then((d) => { if (d && Array.isArray(d.recent)) setStats((cur) => mergeServerStats(cur || getStats(), d.recent, puzzles)); })
          .catch(() => {});
      }
    } catch (e) {}
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!started) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(iv);
  }, [started]);

  // The gate's world map: dots, and a plane flying routes out of Boston to
  // nowhere in particular (the destination is sealed).
  useEffect(() => {
    if (!preStart || !hydrated) return undefined;
    const cv = canvasRef.current; if (!cv) return undefined;
    const ctx = cv.getContext('2d');
    const ends = [[860, 170], [300, 330], [545, 380], [900, 370], [455, 85], [560, 160], [700, 210], [190, 250]];
    const B = HOME;
    const paths = ends.map(([x, y]) => [B, [(B[0] + x) / 2, Math.min(B[1], y) - 70 - Math.abs(x - B[0]) * 0.08], [x, y]]);
    const bez = (p, t) => { const [a, b, c] = p; const u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; };
    const still = reducedMotion();
    const dotCol = darkReg ? 'rgba(160,180,220,.32)' : 'rgba(40,60,100,.28)';
    let raf = 0; const t0 = performance.now();
    const frame = (nowT) => {
      ctx.clearRect(0, 0, 1000, 500);
      ctx.fillStyle = dotCol;
      for (let i = 0; i < DOTS.length; i += 2) { ctx.beginPath(); ctx.arc(DOTS[i], DOTS[i + 1], 2.1, 0, 7); ctx.fill(); }
      const el = Math.max(0, nowT - t0) / 1000;
      const leg = Math.floor(el / 2.6) % paths.length, t = still ? 1 : Math.min(1, (el % 2.6) / 2.2);
      paths.forEach((p, i) => {
        ctx.setLineDash([4, 6]); ctx.lineWidth = 1.3;
        ctx.strokeStyle = i === leg ? 'rgba(56,160,230,.9)' : 'rgba(56,160,230,.18)';
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); ctx.quadraticCurveTo(p[1][0], p[1][1], p[2][0], p[2][1]); ctx.stroke();
        ctx.setLineDash([]);
      });
      const [x, y] = bez(paths[leg], t), [x2, y2] = bez(paths[leg], Math.min(1, t + 0.01));
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y2 - y, x2 - x));
      ctx.fillStyle = darkReg ? '#ffffff' : '#0b0d12';
      ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -3); ctx.lineTo(-9, 0); ctx.lineTo(-7, 3); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(-4, -9); ctx.lineTo(-6, -9); ctx.lineTo(-2, 0); ctx.lineTo(-6, 9); ctx.lineTo(-4, 9); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(B[0], B[1], 6 + 4 * Math.sin(nowT / 300), 0, 7); ctx.stroke();
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [preStart, hydrated, darkReg, gateRules]);   // the canvas mounts only when the rules are folded

  const elapsed = g.t0 ? fmtTime((g.tEnd || now) - g.t0) : '0:00';
  const isTodays = PUZZLE.num === pickPuzzle(puzzles, null).num;
  // The run's board, read the way Price Check reads its own.
  const cboard = useCircuitBoard(KEY, hydrated && done);
  const prevPuzzle = puzzles.find((x) => x.num === PUZZLE.num - 1) || null;
  const myStats = deriveStats(stats, pickPuzzle(puzzles, null).num);

  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (!cur.t0 || cur.status !== 'playing') return null;
    if (!cur.sc.some((v) => v != null)) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)));
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const s = sumScores(cur.sc);
    return { quizId: PUZZLE.quizId, score: s, total: TOTAL, correct: s, guessesUsed: 0, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  function postResult(g2) {
    abandon.markFlushed();
    const el = g2.t0 ? Math.max(1, Math.round(((g2.tEnd || Date.now()) - g2.t0) / 1000)) : 1;
    const s = sumScores(g2.sc);
    try { setStats(recordStat(PUZZLE.num, { s, t: TOTAL, won: s >= 30 })); } catch (e) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: s, total: TOTAL, correct: s, guessesUsed: 0, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).catch(() => {});
    } catch (e) {}
  }

  function commit(next) { gRef.current = next; setG(next); }
  function resetGame() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    const f = freshState(); commit(f);
    setQ(''); setNotice(null); setRevealed(false); setFinale(false);
  }
  function startGame() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    setNow(Date.now());
    try { localStorage.setItem(HELP_KEY, '1'); } catch (e) {}
    setTimeout(() => { try { inputRef.current && inputRef.current.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function say(msg, kind) {
    setNotice({ msg, kind: kind || 'note' });
    if (noticeRef.current) clearTimeout(noticeRef.current);
    noticeRef.current = setTimeout(() => setNotice(null), 2800);
  }
  // Stamp a round. The stamp slams into its slot; nothing advances until the
  // player presses on, so the round's reveal can be read.
  function award(cur, i, score, patch) {
    const sc2 = cur.sc.slice(); sc2[i] = score;
    const next = { ...cur, ...patch, sc: sc2 };
    commit(next);
    setSlam(i); setTimeout(() => setSlam(-1), 900);
    vibrate(score >= 7 ? HAPT.win : HAPT.tick);
  }
  function advance() {
    const cur = gRef.current;
    setQ(''); setNotice(null);
    if (cur.round < 4) {
      commit({ ...cur, round: cur.round + 1 });
      // A long round (the borders map, the flag grid) leaves the reader scrolled
      // past the next round's head, so bring the stamp row back into view.
      setTimeout(() => {
        try {
          const el = document.querySelector('.pp-slots');
          if (el) { const top = el.getBoundingClientRect().top; if (top < 0 || top > window.innerHeight * 0.4) window.scrollBy({ top: top - 72, behavior: reducedMotion() ? 'auto' : 'smooth' }); }
          if (inputRef.current) inputRef.current.focus({ preventScroll: true });
        } catch (e) {}
      }, 60);
      return;
    }
    finish();
  }
  function finish() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const fin = { ...cur, status: 'done', tEnd: Date.now() };
    postResult(fin);
    commit(fin);
    if (!reducedMotion()) setFinale(true);
    else commit({ ...fin, fin: true });
  }
  function finaleDone() {
    setFinale(false);
    setNudgeReady(true);
    const cur = gRef.current;
    if (!cur.fin) commit({ ...cur, fin: true });
  }

  // ── round 1: landmark ──
  function guessLandmark() {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.round !== 0 || cur.sc[0] != null) return;
    const v = q; setQ('');
    if (!v.trim()) return;
    const code = ALIAS.get(normGuess(v));
    if (!code) { say(`"${v}" is not a country we know. Try its full name. That cost you nothing.`); return; }
    if (code === DAY.c) { award(cur, 0, LANDMARK_PTS[cur.r0.z], {}); return; }
    if (cur.r0.wrong.includes(code)) { say(`You already tried ${nameOf(code)}.`); return; }
    vibrate(HAPT.wrong);
    const wrong = [...cur.r0.wrong, code];
    if (cur.r0.z >= 3) { award(cur, 0, 0, { r0: { z: 3, wrong } }); return; }
    commit({ ...cur, r0: { z: cur.r0.z + 1, wrong } });
    say(`Not ${nameOf(code)}. The camera pulls back.`, 'bad');
  }
  function zoomOut() {
    const cur = gRef.current;
    if (cur.sc[0] != null) return;
    if (cur.r0.z >= 3) { award(cur, 0, 0, {}); return; }
    commit({ ...cur, r0: { ...cur.r0, z: cur.r0.z + 1 } });
  }

  // ── round 2: flag ──
  function pickFlag(i) {
    const cur = gRef.current;
    if (cur.round !== 1 || cur.sc[1] != null) return;
    const step = steps[cur.r1.st]; if (!step) return;
    const o = step.opts[i];
    const tag = `${cur.r1.st}:${i}`;
    if (cur.r1.bad.includes(tag)) return;
    if (!o.ok) {
      vibrate(HAPT.wrong);
      commit({ ...cur, r1: { ...cur.r1, miss: cur.r1.miss + 1, bad: [...cur.r1.bad, tag] } });
      say(`Not that one. The stamp is now worth ${flagScore(cur.r1.miss + 1)}.`, 'bad');
      return;
    }
    const st = cur.r1.st + 1;
    if (st >= 3) { award(cur, 1, flagScore(cur.r1.miss), { r1: { ...cur.r1, st } }); return; }
    vibrate(HAPT.tick);
    commit({ ...cur, r1: { ...cur.r1, st } });
  }

  // ── round 3: borders / across the water ──
  function bankBorder(code) {
    const cur = gRef.current;
    const r2 = cur.r2;
    if (r2.found.includes(code)) { say(`${nameOf(code)} is already in.`); return; }
    const found = [...r2.found, code];
    vibrate(HAPT.tick);
    if (found.length >= ring.length) { award(cur, 2, bordersScore(found.length, ring.length), { r2: { ...r2, found, over: true } }); return; }
    commit({ ...cur, r2: { ...r2, found } });
    say(DAY.across ? `${nameOf(code)}, yes.` : `${nameOf(code)} borders ${DAY.name}.`, 'good');
  }
  function endBorders() {
    const cur = gRef.current;
    if (cur.round !== 2 || cur.sc[2] != null) return;
    award(cur, 2, bordersScore(cur.r2.found.length, ring.length), { r2: { ...cur.r2, over: true } });
  }
  function typeBorder(v) {
    setQ(v);
    const cur = gRef.current;
    if (cur.round !== 2 || cur.sc[2] != null) return;
    const n = normGuess(v);
    const code = ALIAS.get(n);
    if (code && ring.includes(code) && !PREFIX_AMBIG.has(n)) { setQ(''); bankBorder(code); }
  }
  function enterBorder() {
    const cur = gRef.current;
    if (cur.round !== 2 || cur.sc[2] != null) return;
    const v = q; setQ('');
    if (!v.trim()) return;
    const code = ALIAS.get(normGuess(v));
    if (!code) { say(`"${v}" is not a country we know. That cost you nothing.`); return; }
    if (ring.includes(code)) { bankBorder(code); return; }
    if (code === DAY.c) { say(`That is ${DAY.name} itself.`); return; }
    if (cur.r2.wrong.includes(code)) { say(`You already tried ${nameOf(code)}.`); return; }
    vibrate(HAPT.wrong);
    const wrong = [...cur.r2.wrong, code];
    if (wrong.length >= STRIKES) { award(cur, 2, bordersScore(cur.r2.found.length, ring.length), { r2: { ...cur.r2, wrong, over: true } }); return; }
    commit({ ...cur, r2: { ...cur.r2, wrong } });
    say(DAY.across ? `${nameOf(code)} is not one of the two nearest. Strike ${wrong.length} of ${STRIKES}.` : `${nameOf(code)} does not border ${DAY.name}. Strike ${wrong.length} of ${STRIKES}.`, 'bad');
  }

  // ── round 4: capital ──
  function dropPin(e) {
    const cur = gRef.current;
    if (cur.round !== 3 || cur.sc[3] != null) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const ll = unproject(DAY.map, p.x, p.y);
    const km = Math.round(Math.min(...DAY.cap.at.map((c) => haversineKm(ll, c))));
    award(cur, 3, capitalScore(km, DAY.area), { r3: { pin: [+p.x.toFixed(1), +p.y.toFixed(1)], km } });
  }

  // ── round 5: numbers ──
  function callNumber(bigger) {
    const cur = gRef.current;
    if (cur.round !== 4 || cur.sc[4] != null || numShow != null) return;
    const i = cur.r4.i;
    const [, a] = DAY.cmp[i];
    const ok = bigger === (a > DAY.area);
    const res = [...cur.r4.res, ok];
    vibrate(ok ? HAPT.tick : HAPT.wrong);
    commit({ ...cur, r4: { ...cur.r4, res } });
    setNumShow(i);
    setTimeout(() => {
      setNumShow(null);
      const c2 = gRef.current;
      if (i + 1 >= DAY.cmp.length) award(c2, 4, c2.r4.res.filter(Boolean).length * NUMBER_PTS, { r4: { ...c2.r4, i: i + 1 } });
      else commit({ ...c2, r4: { ...c2.r4, i: i + 1 } });
    }, reducedMotion() ? 500 : 1500);
  }

  // The finale plays itself a beat after the last stamp, as Price Check's does.
  useEffect(() => {
    if (!hydrated || g.round !== 4 || g.sc[4] == null || g.status !== 'playing') return undefined;
    const t = setTimeout(() => finish(), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, g.round, g.sc[4], g.status]);

  // A finished run's link carries its five scores (?s=10-7-8-9-6), so the
  // preview card shows the passport they earned. Never the country.
  function shareUrl(withScores) {
    const q = [];
    if (!isTodays) q.push(`p=${PUZZLE.num}`);
    if (withScores) q.push(`s=${sc.map((v) => v || 0).join('-')}`);
    return withRef(`mindloftdaily.com${PATH}${q.length ? `?${q.join('&')}` : ''}`);
  }
  function copyShare() {
    const text = playing
      ? `${NAME} #${PUZZLE.num}: one mystery country, five rounds, one passport. The daily geography run from Mind Loft.\n${shareUrl()}`
      : shareLines(PUZZLE.num, total, sc, elapsed, shareUrl(true));
    if (notifyShareCredit(text)) return;
    try { if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesBody = (
    <DailyRules
      accent={COLORS.accent} accentSoft={COLORS.accentSoft}
      lead="One mystery country a day, played five ways. Each round stamps your passport with a score out of 10, and your total out of 50 decides which passport you leave with."
      steps={[
        <><b>Landmark.</b> A photo of somewhere in the country, zoomed right in. Type the country. Every wrong country pulls the camera back a frame: 10, 8, 5 or 3 points. Getting it right unseals the destination for the rest of the run.</>,
        <><b>Flag.</b> Build its flag in three picks: its colors, its layout, then the real flag out of four lookalikes. Each wrong pick takes 3 off the stamp.</>,
        <><b>Borders.</b> Name every country it shares a land border with; a name banks the moment it is complete. A real country that does not border costs a strike, and three end the round. An <b>island</b> names its two nearest countries across the water instead.</>,
        <><b>Capital.</b> One tap on an unlabeled map. Close enough is a full 10, and a point comes off for every step further out; the step grows with the country.</>,
        <><b>Numbers.</b> Five countries, one at a time: bigger or smaller than today&rsquo;s by land area? Two points each.</>,
        <>The board ranks your total, then time. <b>Sunday Editions</b> pick a country with eight or more neighbors.</>,
      ]}
      knack="The landmark is worth the most when it is hardest to see. If you have a hunch, type it before you zoom out: a wrong country costs the same frame a zoom does."
      footer={`Borders follow Flank's rules: sovereign states, land borders only. Areas and capitals are from the CIA World Factbook; the passports and their visa-free counts are the ${HENLEY_EDITION}. Photos from Wikimedia Commons, flags from flag-icons.`}
    />
  );

  if (!DAY) return null;

  // ── pieces ──
  const slots = (
    <div className="pp-slots">
      {ROUNDS.map((r, i) => (
        <div key={r.k} className={`pp-slot${playing && g.round === i && g.t0 ? ' on' : ''}`}>
          {sc[i] == null ? <span>{r.n}</span> : <Stamp i={i} score={sc[i]} slam={slam === i} ink={inks[i]} />}
        </div>
      ))}
    </div>
  );

  const mapSvg = (kind) => {
    const m = DAY.map;
    const r2 = g.r2;
    const showLabels = kind === 'borders';
    const over = r2.over || sc[2] != null;
    const foundSet = new Set(r2.found);
    const wrongSet = new Set(r2.wrong);
    const cls = (c) => {
      if (c === DAY.c) return 'home';
      if (kind === 'borders') {
        if (foundSet.has(c)) return 'hit';
        if (over && ring.includes(c)) return 'miss';
        if (wrongSet.has(c)) return 'wrong';
      }
      return '';
    };
    const labelFor = (c) => (c === 'MK' ? 'N. Macedonia' : c === 'CD' ? 'DR Congo' : c === 'BA' ? 'Bosnia' : c === 'AE' ? 'UAE' : c === 'GB' ? 'UK' : c === 'US' ? 'USA' : nameOf(c));
    return (
      <svg viewBox={`0 0 ${m.w} ${m.h}`} className={kind === 'capital' && sc[3] == null ? 'aim' : ''}
        onClick={kind === 'capital' ? dropPin : undefined} role="img"
        aria-label={kind === 'capital' ? `Map with ${DAY.name} shaded. Tap where its capital is.` : `Map of ${DAY.name} and its neighbors`}>
        <rect width={m.w} height={m.h} fill="var(--pp-sea)" />
        {m.paths.map(([c, d], i) => <path key={i} d={d} className={`pp-land ${cls(c)}`} />)}
        {showLabels && (
          <g>
            {ring.filter((c) => foundSet.has(c) || over).map((c) => m.lab[c] ? (
              <g key={c}>
                <text className={`pp-lbl${foundSet.has(c) ? '' : ' lost'}`} x={m.lab[c][0]} y={m.lab[c][1]} textAnchor="middle">{labelFor(c)}</text>
                {foundSet.has(c) && <circle className="pp-ring" cx={m.lab[c][0]} cy={m.lab[c][1] - 4} r="10" />}
              </g>
            ) : null)}
          </g>
        )}
        {kind === 'capital' && g.r3.pin && (() => {
          const [px, py] = g.r3.pin;
          let best = m.pins[0], bd = Infinity;
          for (const q2 of m.pins) { const d = (q2[0] - px) ** 2 + (q2[1] - py) ** 2; if (d < bd) { bd = d; best = q2; } }
          return (
            <g>
              <path className="pp-dash" d={`M${px} ${py}L${best[0]} ${best[1]}`} stroke="var(--pp-gold)" strokeWidth="2" fill="none" />
              {m.pins.map((pp, i) => (
                <g key={i} transform={`translate(${pp[0]} ${pp[1]})`}>
                  <circle className="pp-ring gold" r="9" />
                  <path className="pp-pin" d="M0 -9l2.6 5.6 6.1.6-4.6 4 1.4 6-5.5-3.2-5.5 3.2 1.4-6-4.6-4 6.1-.6z" fill="var(--pp-gold)" stroke="var(--pp-edge)" strokeWidth="1" />
                </g>
              ))}
              <g transform={`translate(${px} ${py})`}>
                <g className="pp-pin"><path d="M0 0 C-7 -10 -9 -14 -9 -18 a9 9 0 1 1 18 0 c0 4 -2 8 -9 18z" fill="#38bdf8" stroke="var(--pp-edge)" strokeWidth="1.5" /><circle cy="-18" r="3.4" fill="var(--pp-edge)" /></g>
              </g>
            </g>
          );
        })()}
      </svg>
    );
  };

  const nextBtn = (label) => (
    <div className="pp-endrow"><button type="button" className="pp-go" onClick={advance}>{label}</button></div>
  );

  const round0 = () => {
    const z = g.r0.z;
    const doneR = sc[0] != null;
    return (
      <>
        <div className="pp-eb"><span>Round 1 of 5</span><b>Landmark</b></div>
        <h2 className="pp-h">{doneR ? (sc[0] ? `${DAY.name}.` : `It was ${DAY.name}.`) : 'Where did you land?'}</h2>
        <div className="pp-photo">
          <div className="pp-pz" style={{ transform: `scale(${doneR ? 1 : ZOOM[z]})`, transformOrigin: `${DAY.land.fx * 100}% ${DAY.land.fy * 100}%` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/passport/img?n=${PUZZLE.num}`} alt={doneR ? DAY.land.name : 'A landmark, zoomed in'} draggable={false} />
          </div>
          {!doneR && <span className="pp-ztag">Frame {z + 1} of 4 · worth {LANDMARK_PTS[z]}</span>}
          {doneR && (
            <div className="pp-over"><Stamp i={0} big slam label={sc[0] ? 'Arrived' : 'Deported'} score={DAY.name} ink={sc[0] ? '#f0718b' : '#94a3b8'} /></div>
          )}
        </div>
        {doneR ? (
          <>
            <p className="pp-reveal"><b>{DAY.land.name}</b>, {DAY.name}. {g.r0.wrong.length ? `Tried first: ${g.r0.wrong.map(nameOf).join(', ')}.` : 'First frame.'}</p>
            <p className="pp-credit">Photo: {DAY.land.by}, {DAY.land.lic}, via Wikimedia Commons.</p>
            {nextBtn('Next: the flag')}
          </>
        ) : (
          <>
            <div className="pp-ask">
              <input ref={inputRef} type="text" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); guessLandmark(); } }}
                placeholder="Type a country" aria-label="Which country is this?" />
              <button type="button" className="pp-go" onClick={guessLandmark}>Guess</button>
            </div>
            <div className="pp-row">
              <span className="pp-pips">{LANDMARK_PTS.map((p, i) => <i key={i} className={i < z ? 'x' : i === z ? 'on' : ''} />)}</span>
              <button type="button" className="pp-ghost" onClick={zoomOut}>{z >= 3 ? 'Give up' : 'Zoom out'}</button>
            </div>
          </>
        )}
      </>
    );
  };

  const round1 = () => {
    const st = g.r1.st;
    const doneR = sc[1] != null;
    const step = steps[Math.min(st, 2)];
    const pal = DAY.flag.pal;
    return (
      <>
        <div className="pp-eb"><span>Round 2 of 5</span><b>Flag</b></div>
        <h2 className="pp-h">Build the flag of {DAY.name}.</h2>
        <div className="pp-flagwrap">
          {st === 0 ? (
            <div className="pp-flag empty">?</div>
          ) : st === 1 ? (
            <div className="pp-flag wash" dangerouslySetInnerHTML={{ __html: steps[0].opts.find((o) => o.ok).svg }} />
          ) : st === 2 ? (
            <div className="pp-flag build" dangerouslySetInnerHTML={{ __html: steps[1].opts.find((o) => o.ok).svg }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="pp-flag real" src={`/passport/flags/${DAY.c.toLowerCase()}.svg`} alt={`Flag of ${DAY.name}`} />
          )}
        </div>
        <div className="pp-steps">{[0, 1, 2].map((i) => <span key={i} className={i < st ? 'done' : i === st && !doneR ? 'on' : ''} />)}</div>
        {!doneR ? (
          <>
            <div className="pp-row"><b className="pp-q">{st + 1}. {step.q}</b><span className="pp-mono">stamp worth {flagScore(g.r1.miss)}</span></div>
            <div className={`pp-opts${st === 2 ? ' real' : ''}`}>
              {step.opts.map((o, i) => {
                const bad = g.r1.bad.includes(`${st}:${i}`);
                return (
                  <button key={i} type="button" className={`pp-opt${bad ? ' no' : ''}`} onClick={() => pickFlag(i)} disabled={bad} aria-label={o.label || `Flag option ${i + 1}`}>
                    {o.src
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={o.src} alt="" draggable={false} />
                      : <span className="sw" dangerouslySetInnerHTML={{ __html: o.svg }} />}
                    {o.label && <span>{o.label}</span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="pp-reveal">{g.r1.miss ? `${g.r1.miss} wrong pick${g.r1.miss === 1 ? '' : 's'}.` : 'Clean build, no wrong picks.'} The lookalikes were {DAY.flag.also.map(nameOf).join(', ')}.</p>
            {nextBtn('Next: the borders')}
          </>
        )}
        {!doneR && pal.length === 0 ? null : null}
      </>
    );
  };

  const round2 = () => {
    const r2 = g.r2;
    const doneR = sc[2] != null;
    const across = !!DAY.across;
    return (
      <>
        <div className="pp-eb"><span>Round 3 of 5</span><b>{across ? 'Across the water' : 'Borders'}</b></div>
        <h2 className="pp-h">{across ? `${DAY.name} has no land border. Name its two nearest countries by sea.` : `Name every land neighbor of ${DAY.name}.`}</h2>
        <div className="pp-map">{mapSvg('borders')}</div>
        <div className="pp-row">
          <span className="pp-mono">{r2.found.length} of {ring.length} found</span>
          <span className="pp-row" style={{ gap: 6, margin: 0 }}><span className="pp-mono">Strikes</span><span className="pp-strikes">{[0, 1, 2].map((i) => <i key={i} className={i < r2.wrong.length ? 'x' : ''} />)}</span></span>
        </div>
        {!doneR && (
          <div className="pp-ask">
            <input ref={inputRef} type="text" autoComplete="off" value={q} onChange={(e) => typeBorder(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enterBorder(); } }}
              placeholder={across ? 'Type a country across the water' : 'Type a neighbor'} aria-label={across ? 'A nearby country' : 'A neighboring country'} />
            <button type="button" className="pp-ghost" onClick={endBorders}>I&rsquo;m done</button>
          </div>
        )}
        <div className="pp-found">
          {r2.found.map((c) => <span key={c}>{nameOf(c)}</span>)}
          {doneR && ring.filter((c) => !r2.found.includes(c)).map((c) => <span key={c} className="lost">{nameOf(c)}</span>)}
        </div>
        {doneR && nextBtn('Next: the capital')}
      </>
    );
  };

  const round3 = () => {
    const doneR = sc[3] != null;
    return (
      <>
        <div className="pp-eb"><span>Round 4 of 5</span><b>Capital</b></div>
        <h2 className="pp-h">{doneR ? `${DAY.cap.names[0]}.` : `Tap the capital of ${DAY.name}.`}</h2>
        <div className="pp-map">{mapSvg('capital')}</div>
        <div className="pp-row" style={{ alignItems: 'flex-end' }}>
          <div><div className="pp-mono">Distance</div><div className="pp-km">{doneR ? `${g.r3.km.toLocaleString()} km` : '— km'}</div></div>
          <div className="pp-mono" style={{ textAlign: 'right' }}>{doneR ? (DAY.cap.names.length > 1 ? `Either seat counts: ${DAY.cap.names.join(' or ')}` : 'One tap counted') : 'One tap counts'}</div>
        </div>
        {doneR && nextBtn('Next: the numbers')}
      </>
    );
  };

  const round4 = () => {
    const r4 = g.r4;
    const doneR = sc[4] != null;
    const i = Math.min(r4.i, DAY.cmp.length - 1);
    const [code, a] = DAY.cmp[i];
    const shown = numShow === i || doneR;
    const MAX = Math.max(DAY.area, ...DAY.cmp.map((x) => x[1])) * 1.05;
    return (
      <>
        <div className="pp-eb"><span>Round 5 of 5</span><b>Numbers</b></div>
        <h2 className="pp-h">Bigger or smaller than {DAY.name}?</h2>
        <div className="pp-vs">
          <div className="pp-vc home"><div className="pp-mono">{DAY.name}</div><div className="v">{DAY.area.toLocaleString()} km²</div><div className="bar"><i style={{ width: `${(DAY.area / MAX) * 100}%` }} /></div></div>
          <div className="pp-vc them"><div className="pp-mono">{doneR ? 'Last one' : `${i + 1} of 5`}</div><div className="n">{nameOf(code)}</div><div className="v">{shown ? `${a.toLocaleString()} km²` : '? km²'}</div><div className="bar"><i style={{ width: shown ? `${(a / MAX) * 100}%` : '0%' }} /></div></div>
        </div>
        {!doneR && (
          <div className="pp-bl">
            <button type="button" className="pp-ghost big" disabled={numShow != null} onClick={() => callNumber(true)}>Bigger</button>
            <button type="button" className="pp-ghost big" disabled={numShow != null} onClick={() => callNumber(false)}>Smaller</button>
          </div>
        )}
        <div className="pp-dots">{DAY.cmp.map((_, k) => <i key={k} className={r4.res[k] === true ? 'ok' : r4.res[k] === false ? 'ko' : k === r4.i ? 'cur' : ''} />)}</div>
        {numShow != null && <p className="pp-reveal">{nameOf(code)} is {a > DAY.area ? 'bigger' : 'smaller'}, by {Math.abs(a - DAY.area).toLocaleString()} km².</p>}
        {doneR && <p className="pp-reveal">{r4.res.filter(Boolean).length} of 5 called right. Areas from the CIA World Factbook.</p>}
      </>
    );
  };

  const k = tierIndex(total);
  const tier = TIERS[k];
  const up = TIERS[k + 1];
  const result = (
    <div className="pp-result">
      <div className="pp-cwrap"><Cover tier={tier} /><div className="pp-issued small"><Stamp i={0} big label="Visa-free" score={tier.vf} ink={k === 0 ? 'var(--pp-bad)' : 'var(--pp-good)'} /></div></div>
      <div style={{ minWidth: 0 }}>
        <div className="pp-mono">You traveled on the</div>
        <div className="pp-persona">{tier.name}</div>
        <div className="pp-vf">Visa-free to {tier.vf} destinations · {tier.where} · {HENLEY_EDITION}</div>
        <p className="pp-line">{tier.line} The destination was <b>{DAY.name}</b>.</p>
        <div className="pp-rs">{ROUNDS.map((r, i) => <div key={r.k}><b style={{ color: inks[i] }}>{sc[i] == null ? '-' : sc[i]}</b><i>{r.n}</i></div>)}</div>
        <div className="pp-next">{up ? `${up.min - total} more and you upgrade to the ${up.name}.` : 'Top of the ladder. Nowhere left to upgrade to.'}</div>
        <div className="pp-ladder">{TIERS.map((t, i) => <div key={i} className={i === k ? 'on' : ''} style={{ '--c': t.cv }}><i /><span>{t.short}</span><b>{i === TIERS.length - 1 ? t.min : `${t.min}+`}</b></div>).reverse()}</div>
      </div>
    </div>
  );

  const CSS = `
    @media(max-width:560px){.pp-wrap{padding-left:10px !important;padding-right:10px !important;}}
    .pp-btn{font-family:${SANS};font-weight:800;font-size:14px;border:2px solid ${STAGE ? 'var(--stg-line2)' : 'var(--blue-deep)'};background:${STAGE ? 'transparent' : 'var(--white)'};color:${STAGE ? 'var(--stg-ink)' : 'var(--blue-deep)'};border-radius:8px;padding:9px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
    .pp-board{border-radius:14px;}
    .pp-slots{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px;}
    .pp-slot{height:54px;border:1.5px dashed var(--pp-line);border-radius:9px;display:grid;place-items:center;position:relative;font-family:${MONO};font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:${FADED};}
    .pp-slot.on{border-style:solid;border-color:var(--stg-acc, ${COLORS.accent});color:${INK};}
    .pp-slot .pp-stamp{position:absolute;inset:3px;}
    .pp-stamp{--ink:#a78bfa;--rot:-6deg;border:2.5px solid var(--ink);color:var(--ink);border-radius:9px;display:grid;place-items:center;text-align:center;font-family:${STAMP_FONT};text-transform:uppercase;line-height:1;transform:rotate(var(--rot));box-shadow:inset 0 0 0 2px var(--pp-panel),inset 0 0 0 3.5px var(--ink);padding:2px;background:transparent;}
    .pp-stamp .s1{font-size:8px;letter-spacing:.08em;}
    .pp-stamp .s2{font-size:15px;font-weight:700;}
    .pp-stamp .s2 span{font-size:.55em;}
    .pp-stamp.big{border-width:4px;border-radius:14px;box-shadow:inset 0 0 0 3px rgba(11,15,26,.55),inset 0 0 0 5.5px var(--ink);padding:10px 16px;background:rgba(11,15,26,.45);}
    .pp-stamp.big .s1{font-size:12px;letter-spacing:.14em;}
    .pp-stamp.big .s2{font-size:28px;}
    .pp-stamp.slam{animation:ppslam .55s cubic-bezier(.2,1.4,.3,1) both;}
    @keyframes ppslam{0%{transform:scale(2.6) rotate(calc(var(--rot) - 14deg));opacity:0}55%{transform:scale(.9) rotate(var(--rot));opacity:1}75%{transform:scale(1.04) rotate(var(--rot))}100%{transform:scale(1) rotate(var(--rot));opacity:1}}
    .pp-eb{display:flex;gap:8px;align-items:center;font-family:${MONO};font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:${FADED};margin-bottom:6px;}
    .pp-eb b{font-weight:500;color:var(--stg-acc-ink, ${COLORS.accent});border:1px solid currentColor;border-radius:999px;padding:2px 9px;}
    .pp-h{margin:0 0 12px;font-size:21px;line-height:1.25;font-weight:800;color:${INK};text-wrap:balance;}
    .pp-photo{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:16/10;background:#1d2230;border:1.5px solid var(--pp-line);}
    .pp-pz{position:absolute;inset:0;transition:transform 1.1s cubic-bezier(.45,0,.2,1);}
    .pp-pz img{width:100%;height:100%;object-fit:cover;display:block;}
    .pp-ztag{position:absolute;left:8px;top:8px;background:rgba(6,10,20,.72);color:#fff;border-radius:999px;padding:3px 10px;font-family:${MONO};font-size:10px;letter-spacing:.1em;}
    .pp-over{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;}
    .pp-ask{display:flex;gap:10px;margin-top:12px;}
    .pp-ask input{flex:1;min-width:0;border:2.5px solid var(--stg-cell-line, rgba(28,30,36,0.4));border-radius:12px;background:var(--pp-panel);padding:12px 14px;color:${INK};font:800 17px ${SANS};outline:0;}
    .pp-ask input:focus{border-color:var(--stg-acc, ${COLORS.accent});}
    .pp-go{font:900 15px ${SANS};border:0;border-radius:12px;padding:0 22px;min-height:46px;cursor:pointer;background:var(--stg-acc, ${COLORS.accent});color:var(--stg-onramp, #ffffff);}
    .pp-ghost{font:800 13.5px ${SANS};border:1.5px solid var(--pp-line);border-radius:999px;padding:8px 16px;cursor:pointer;background:transparent;color:${INK};}
    .pp-ghost.big{border-radius:12px;padding:14px;font-size:16px;width:100%;}
    .pp-ghost:disabled{opacity:.45;cursor:default;}
    .pp-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;}
    .pp-mono{font-family:${MONO};font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${FADED};}
    .pp-pips{display:flex;gap:6px;}
    .pp-pips i{width:26px;height:6px;border-radius:3px;background:var(--pp-line);display:block;}
    .pp-pips i.on{background:var(--stg-acc, ${COLORS.accent});}
    .pp-pips i.x{background:var(--pp-bad);}
    .pp-reveal{margin:12px 0 0;font-size:14.5px;line-height:1.5;color:${INK};font-weight:600;}
    .pp-credit{margin:4px 0 0;font-size:11.5px;color:${FADED};font-weight:600;}
    .pp-endrow{display:flex;justify-content:flex-end;margin-top:14px;}
    .pp-flagwrap{display:grid;place-items:center;padding:16px;background:var(--pp-panel);border:1.5px solid var(--pp-line);border-radius:14px;}
    .pp-flag{width:min(300px,100%);aspect-ratio:3/2;border-radius:3px;box-shadow:0 10px 26px rgba(0,0,0,.28);overflow:hidden;}
    .pp-flag svg{width:100%;height:100%;display:block;}
    .pp-flag.empty{display:grid;place-items:center;border:1.5px dashed var(--pp-line);box-shadow:none;font:800 44px ${SANS};color:${FADED};}
    .pp-flag.wash{animation:ppwash 1s ease-out both;}
    @keyframes ppwash{from{opacity:0;filter:blur(10px)}to{opacity:1;filter:none}}
    .pp-flag.build{animation:ppbuild .7s cubic-bezier(.3,.8,.3,1) both;transform-origin:left center;}
    @keyframes ppbuild{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
    .pp-flag.real{object-fit:cover;animation:ppreal .6s cubic-bezier(.2,1.3,.3,1) both;}
    @keyframes ppreal{from{transform:rotateY(80deg) scale(.9);opacity:.2}to{transform:none;opacity:1}}
    .pp-steps{display:flex;gap:6px;margin:12px 0 2px;}
    .pp-steps span{flex:1;height:4px;border-radius:2px;background:var(--pp-line);}
    .pp-steps span.on{background:var(--stg-acc, ${COLORS.accent});}
    .pp-steps span.done{background:var(--pp-good);}
    .pp-q{font-size:15px;color:${INK};}
    .pp-opts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px;}
    @media(max-width:560px){.pp-opts{grid-template-columns:repeat(2,1fr);}}
    .pp-opt{background:var(--pp-panel);border:1.5px solid var(--pp-line);border-radius:12px;padding:10px 8px 8px;display:flex;flex-direction:column;align-items:center;gap:6px;font:700 12px ${SANS};color:${INK};cursor:pointer;position:relative;transition:transform .15s,border-color .15s;}
    .pp-opt:hover:not(:disabled){transform:translateY(-2px);border-color:var(--stg-acc, ${COLORS.accent});}
    .pp-opt .sw{width:100%;max-width:96px;aspect-ratio:3/2;display:block;border-radius:2px;overflow:hidden;}
    .pp-opt .sw svg{width:100%;height:100%;display:block;}
    .pp-opt img{width:100%;max-width:120px;aspect-ratio:4/3;object-fit:cover;border-radius:2px;display:block;}
    .pp-opt.no{opacity:.35;cursor:default;animation:ppshake .4s;}
    .pp-opt.no::after{content:'';position:absolute;left:12%;right:12%;top:50%;height:2px;background:var(--pp-bad);transform:rotate(-12deg);}
    @keyframes ppshake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
    .pp-map{border-radius:14px;overflow:hidden;border:1.5px solid var(--pp-line);background:var(--pp-sea);}
    .pp-map svg{display:block;width:100%;height:auto;}
    .pp-map svg.aim{cursor:crosshair;}
    .pp-land{fill:var(--pp-land);stroke:var(--pp-edge);stroke-width:.7;transition:fill .6s;}
    .pp-land.home{fill:var(--pp-home);}
    .pp-land.hit{fill:var(--pp-hit);animation:pphit .7s ease-out;}
    .pp-land.miss{fill:var(--pp-miss);}
    .pp-land.wrong{animation:ppwrong 1s ease-out;}
    @keyframes pphit{0%{fill:var(--pp-good)}100%{fill:var(--pp-hit)}}
    @keyframes ppwrong{0%,40%{fill:var(--pp-bad)}100%{fill:var(--pp-land)}}
    .pp-lbl{font-family:${MONO};font-size:11px;letter-spacing:.06em;text-transform:uppercase;fill:var(--pp-label);paint-order:stroke;stroke:var(--pp-halo);stroke-width:3px;animation:pplbl .5s cubic-bezier(.2,1.5,.3,1) both;}
    .pp-lbl.lost{fill:var(--pp-bad);}
    @keyframes pplbl{from{opacity:0;transform:translateY(6px)}}
    .pp-ring{fill:none;stroke:var(--pp-good);stroke-width:2;transform-box:fill-box;transform-origin:center;animation:ppring 1.1s ease-out forwards;}
    .pp-ring.gold{stroke:var(--pp-gold);}
    @keyframes ppring{from{transform:scale(.2);opacity:1}to{transform:scale(4);opacity:0}}
    .pp-pin{transform-box:fill-box;transform-origin:center bottom;animation:ppdrop .55s cubic-bezier(.3,1.6,.4,1) both;}
    @keyframes ppdrop{from{transform:translateY(-60px);opacity:0}}
    .pp-dash{stroke-dasharray:6 5;animation:ppdash 1s ease-out both;}
    @keyframes ppdash{from{stroke-dashoffset:300;opacity:0}to{stroke-dashoffset:0;opacity:1}}
    .pp-km{font-family:${MONO};font-size:26px;color:${INK};font-variant-numeric:tabular-nums;}
    .pp-strikes{display:flex;gap:4px;}
    .pp-strikes i{width:10px;height:10px;border-radius:50%;background:var(--pp-line);display:block;}
    .pp-strikes i.x{background:var(--pp-bad);}
    .pp-found{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;min-height:10px;}
    .pp-found span{font:700 12.5px ${SANS};padding:4px 10px;border-radius:999px;background:color-mix(in srgb, var(--pp-good) 16%, transparent);color:var(--pp-good);animation:pprise .3s both;}
    .pp-found span.lost{background:color-mix(in srgb, var(--pp-bad) 14%, transparent);color:var(--pp-bad);}
    @keyframes pprise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .pp-vs{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .pp-vc{background:var(--pp-panel);border:1.5px solid var(--pp-line);border-radius:14px;padding:12px;min-width:0;}
    .pp-vc .n{font-size:18px;font-weight:800;color:${INK};margin-top:2px;}
    .pp-vc .v{font-family:${MONO};font-size:clamp(14px,4.2vw,20px);white-space:nowrap;color:${INK};margin-top:4px;font-variant-numeric:tabular-nums;}
    .pp-vc.home .v{margin-top:24px;}
    .pp-vc .bar{height:10px;border-radius:5px;background:var(--pp-line);margin-top:10px;overflow:hidden;}
    .pp-vc .bar i{display:block;height:100%;border-radius:5px;transition:width 1s cubic-bezier(.3,.8,.3,1);}
    .pp-vc.home .bar i{background:var(--pp-home);}
    .pp-vc.them .bar i{background:var(--stg-acc, ${COLORS.accent});}
    .pp-bl{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
    .pp-dots{display:flex;gap:6px;margin-top:14px;}
    .pp-dots i{width:12px;height:12px;border-radius:50%;background:var(--pp-line);display:block;}
    .pp-dots i.ok{background:var(--pp-good);}
    .pp-dots i.ko{background:var(--pp-bad);}
    .pp-dots i.cur{outline:2px solid var(--stg-acc, ${COLORS.accent});outline-offset:2px;}
    .pp-gmap{position:relative;border-radius:14px;overflow:hidden;border:1.5px solid var(--pp-line);background:var(--pp-panel);aspect-ratio:2/1;}
    .pp-gmap canvas{width:100%;height:100%;display:block;}
    .pp-pass{margin-top:12px;display:grid;grid-template-columns:minmax(0,1fr) 108px;background:${PASS_PAPER};color:#16202f;border-radius:14px;overflow:hidden;}
    .pp-pass .m{padding:12px 14px;min-width:0;}
    .pp-pass .stub{padding:12px 10px;border-left:2px dashed #b8b1a0;display:flex;flex-direction:column;justify-content:space-between;}
    .pp-pass .lab{font-family:${MONO};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#6b6556;}
    .pp-pass .val{font-weight:800;font-size:15px;}
    .pp-pass .big{font-family:${MONO};font-size:28px;letter-spacing:.06em;line-height:1;}
    .pp-pass .sealed{background:#16202f;color:#f3efe4;padding:1px 7px;border-radius:3px;}
    .pp-pass .bar{height:24px;margin-top:10px;background:repeating-linear-gradient(90deg,#16202f 0 2px,transparent 2px 4px,#16202f 4px 5px,transparent 5px 8px,#16202f 8px 11px,transparent 11px 12px);}
    .pp-how{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px;}
    .pp-how div{border:1.5px solid var(--pp-line);border-radius:10px;padding:7px 4px;text-align:center;font:800 12px ${SANS};color:${INK};}
    .pp-how div i{display:block;font-style:normal;font-family:${MONO};font-size:9px;color:${FADED};font-weight:400;}
    @media(max-width:520px){.pp-how{grid-template-columns:repeat(3,1fr);}}
    .pp-cover{position:relative;width:min(220px,62vw);aspect-ratio:.7/1;border-radius:10px 14px 14px 10px;background:var(--cv);color:var(--cf);box-shadow:0 22px 50px rgba(0,0,0,.45),inset 6px 0 0 rgba(0,0,0,.18);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:20px 12px 16px;text-align:center;transition:background .2s;}
    .pp-cover::after{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.14) 45%,transparent 60%);background-size:250% 100%;animation:ppsheen 3.2s ease-in-out infinite;pointer-events:none;}
    @keyframes ppsheen{from{background-position:120% 0}to{background-position:-60% 0}}
    .pp-cover .t1{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;line-height:1.4;text-wrap:balance;}
    .pp-cover .t2{font-family:${STAMP_FONT};font-size:20px;letter-spacing:.14em;text-transform:uppercase;}
    .pp-cover .chipi{width:28px;height:19px;border:1.6px solid currentColor;border-radius:3px;position:relative;opacity:.9;}
    .pp-cover .chipi::after{content:'';position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px;border:1.6px solid currentColor;border-radius:50%;}
    .pp-cover.flipping{animation:ppcflip .7s cubic-bezier(.5,0,.3,1);}
    @keyframes ppcflip{0%{transform:rotateY(0)}50%{transform:rotateY(90deg) scale(.96)}100%{transform:rotateY(0)}}
    .pp-result{display:grid;grid-template-columns:auto minmax(0,1fr);gap:20px;align-items:center;margin-top:6px;}
    @media(max-width:560px){.pp-result{grid-template-columns:1fr;justify-items:center;text-align:center;}}
    .pp-cwrap{position:relative;}
    .pp-issued.small{position:absolute;right:-18px;bottom:16px;}
    .pp-issued.small .pp-stamp.big{padding:6px 10px;}
    .pp-issued.small .pp-stamp.big .s2{font-size:22px;}
    .pp-persona{font-size:26px;font-weight:800;line-height:1.1;color:${INK};}
    .pp-vf{font-family:${MONO};font-size:11.5px;letter-spacing:.06em;color:var(--pp-gold);margin-top:6px;}
    .pp-line{color:${INK};margin:8px 0 0;font-size:14px;font-weight:600;}
    .pp-rs{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px;}
    .pp-rs div{border:1.5px solid var(--pp-line);border-radius:8px;padding:6px 2px;text-align:center;}
    .pp-rs b{display:block;font-family:${MONO};font-size:17px;}
    .pp-rs i{display:block;font-style:normal;font-family:${MONO};font-size:8.5px;letter-spacing:.08em;color:${FADED};text-transform:uppercase;}
    .pp-next{font-size:13px;color:${FADED};font-weight:700;margin-top:10px;}
    .pp-ladder{display:flex;flex-direction:column;gap:3px;margin-top:10px;}
    .pp-ladder div{display:grid;grid-template-columns:14px 1fr auto;gap:8px;align-items:center;font-size:12px;color:${FADED};font-weight:700;padding:2px 6px;border-radius:6px;}
    .pp-ladder div i{width:12px;height:16px;border-radius:2px;background:var(--c);display:block;}
    .pp-ladder div b{font-family:${MONO};font-weight:500;font-size:11px;}
    .pp-ladder div.on{background:color-mix(in srgb, var(--stg-acc, ${COLORS.accent}) 14%, transparent);color:${INK};}
    .pp-fin{position:fixed;inset:0;z-index:96;background:radial-gradient(120% 90% at 50% 20%,#141c30,#070a12);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:20px;color:#e9edf5;font-family:${SANS};animation:ppfade .3s both;}
    @keyframes ppfade{from{opacity:0}}
    .pp-book{width:min(520px,100%);aspect-ratio:1.42/1;perspective:1600px;}
    .pp-spread{width:100%;height:100%;display:grid;grid-template-columns:1fr 1fr;border-radius:8px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.5);animation:ppopen .9s cubic-bezier(.3,.8,.3,1) both;}
    @keyframes ppopen{from{transform:scaleX(.5) rotateY(30deg);opacity:0}}
    .pp-pg{background:linear-gradient(90deg,#efe9dc,#f7f3ea 40%,#ede6d6);color:#1a2332;padding:12px;position:relative;overflow:hidden;}
    .pp-pg.r{background:linear-gradient(90deg,#e6dfcd,#f7f3ea 30%,#f2ecdf);}
    .pp-pg .lab{font-family:${MONO};font-size:7.5px;letter-spacing:.12em;text-transform:uppercase;color:#6c7486;}
    .pp-pg .v{font-weight:800;font-size:11px;}
    .pp-idrow{display:flex;gap:10px;margin-top:8px;align-items:flex-start;}
    .pp-idph{width:50px;height:62px;border-radius:4px;background:linear-gradient(#cfd6e2,#b9c2d2);flex:none;}
    .pp-mrz{position:absolute;left:10px;right:10px;bottom:8px;font-family:${MONO};font-size:7.5px;letter-spacing:.06em;color:#28324a;word-break:break-all;line-height:1.35;}
    .pp-vstamps{position:absolute;inset:26px 10px 10px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:6px;}
    .pp-vstamps .pp-stamp{box-shadow:inset 0 0 0 2px #f4efe4,inset 0 0 0 3.5px var(--ink);}
    .pp-vstamps .pp-stamp .s2{font-size:17px;}
    .pp-cstage{position:relative;}
    .pp-fin .pp-cover{width:min(240px,64vw);}
    .pp-upg{position:absolute;left:50%;top:-16px;transform:translateX(-50%);background:${UPGRADE_GOLD};color:#2a1f04;font-weight:800;font-size:12px;padding:5px 12px;border-radius:999px;white-space:nowrap;animation:ppupg 1.4s ease-out forwards;z-index:3;}
    @keyframes ppupg{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px)}}
    .pp-issued{position:absolute;right:-26px;bottom:24px;z-index:4;}
    .pp-rungs{display:flex;gap:4px;width:min(320px,100%);}
    .pp-rungs div{flex:1;text-align:center;}
    .pp-rungs i{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.12);transition:background .3s;}
    .pp-rungs div.on i{background:var(--rc);}
    .pp-rungs b{display:block;font-family:${MONO};font-size:9px;font-weight:400;color:#8e98ac;margin-top:4px;}
    .pp-fintot{font-family:${MONO};font-size:44px;font-variant-numeric:tabular-nums;line-height:1;}
    .pp-fintot small{font-size:18px;color:#8e98ac;}
    .pp-skip{position:absolute;right:14px;bottom:12px;font-family:${MONO};font-size:9.5px;letter-spacing:.12em;color:#8e98ac;text-transform:uppercase;}
    @media(prefers-reduced-motion:reduce){.pp-stamp.slam,.pp-flag,.pp-land,.pp-lbl,.pp-ring,.pp-pin,.pp-dash,.pp-found span,.pp-cover::after,.pp-spread,.pp-fin{animation:none !important;}.pp-pz{transition:none;}}
  `;

  const board = (
    <div className={`${STAGE ? 'stg-board' : 'loft-card'} pp-board`} style={{ background: SURF, border: STAGE ? `1px solid ${SURF_B}` : `2px solid ${COLORS.ink}`, padding: 15, marginBottom: 12 }}>
      {slots}
      {done ? result : [round0, round1, round2, round3, round4][g.round]()}
      <div style={{ minHeight: 19, marginTop: 8, fontSize: 12.5, fontWeight: 700, color: notice && notice.kind === 'bad' ? 'var(--pp-bad)' : notice && notice.kind === 'good' ? 'var(--pp-good)' : FADED }}>
        {notice ? notice.msg : null}
      </div>
    </div>
  );

  // ── THE ENDING (owner, 2026-10-03): the run's settled screen, the way Price
  // Check and the Trivia Gauntlet end, not a daily end card. The cover you
  // earned, the figures, the five stamps, and the run's own leaderboard.
  const me = cboard && cboard.data ? (cboard.data.me || cboard.data.meProvisional || null) : null;
  const field = cboard && cboard.data && Array.isArray(cboard.data.overall) ? (cboard.data.overallField || cboard.data.uniquePlayers || cboard.data.overall.length) : null;
  let hiR = 0, loR = 0;
  sc.forEach((v, i) => { if ((v || 0) > (sc[hiR] || 0)) hiR = i; if ((v || 0) < (sc[loR] || 0)) loR = i; });
  const flat = (sc[hiR] || 0) === (sc[loR] || 0);
  const ending = (
    <section className="pe">
      <div className="pl-eb" style={{ textAlign: 'center' }}>{PUZZLE.dateLabel} · Passport No. {PUZZLE.num}</div>
      <div className="pe-grid">
        <div className="pe-cov">
          <div className="pp-cwrap"><Cover tier={tier} /><div className="pp-issued small"><Stamp i={0} big label="Visa-free" score={tier.vf} ink={k === 0 ? 'var(--pp-bad)' : 'var(--pp-good)'} /></div></div>
        </div>
        <div className="pe-copy" role="status">
          <div className="pe-you">You traveled on the</div>
          <h1 className="pe-nm">{tier.name}</h1>
          <p className="pe-ln">{tier.line} The destination was <b>{DAY.name}</b>: {DAY.land.name}.</p>
          <div className="pe-stats">
            <div><b>{total}/50</b><span>Score</span></div>
            {me && me.rank ? <div><b>#{me.rank}</b><span>{field ? `of ${Number(field).toLocaleString()} today` : 'today'}</span></div> : null}
            <div><b>{tier.vf}</b><span>Visa-free</span></div>
          </div>
          {/* NEXT DROP (owner, 2026-10-06): the countdown moved up from the
              last line of the page into its own block under the result. */}
          {isTodays ? (
            <NextDrop label="Next country" sub="A new destination boards at midnight Eastern." href={PATH}
              accent="#c4b5fd" style={{ margin: '4px 0 12px', maxWidth: 400 }} />
          ) : null}
          <div className="pe-rounds">
            {ROUNDS.map((r, i) => <div key={r.k} className={flat ? '' : i === hiR ? 'hi' : i === loR ? 'lo' : ''}><i>{r.n}</i><b>{sc[i] == null ? '-' : sc[i]}</b></div>)}
          </div>
          <div className="pe-next">{up ? <><b>{up.min - total} more</b> and you upgrade to the {up.name}.</> : <>Top of the ladder. <b>Every border waves you through.</b></>}</div>
          <div className="pe-btns">
            <button type="button" className="pri" onClick={copyShare}>{copied ? 'Copied' : 'Share your passport'}</button>
            <a href={`${PATH}/leaderboard`}>Leaderboard</a>
            <button type="button" onClick={() => setFinale(true)}>Replay the ending</button>
            <a href="/">Back to main</a>
          </div>
          {!isTodays ? (
            <div className="pe-foot">
              You played the {PUZZLE.dateLabel} archive. <a href={PATH}>Back to today&rsquo;s Passport</a>
            </div>
          ) : null}
        </div>
      </div>
      {!identity && (
        <div className="pe-join">
          <JoinLeaderboardForm hideIcon heading="Put your passport on the board" identity={identity} onJoined={(id) => setIdentity(id)} />
        </div>
      )}
    </section>
  );

  return (
    <div className="stage-page pp-root" data-stage-theme="dark"
      style={{ ...VARS, minHeight: '100vh', background: 'var(--stg-ground,#0b0f1a)', color: 'var(--stg-ink,#e9edf4)', position: 'relative', overflowX: 'hidden', fontFamily: SANS }}>
      <style dangerouslySetInnerHTML={{ __html: CSS + LAUNCH_CSS + ENDING_CSS }} />
      <div className={`pc-cap${started ? ' on' : ''}`}>
        <a href="/" className="pc-home">Mind Loft</a>
        <b>Passport</b>
        <span className="pc-capd">{PUZZLE.dateLabel.replace(/, \d{4}$/, '')}</span>
        {started ? (
          <>
            <span className="pc-capt" aria-label={`Round ${Math.min(5, g.round + 1)} of 5`}>{ROUNDS.map((r, i) => <i key={r.k} className={i < g.round ? 'd' : i === g.round ? 'on' : ''} />)}</span>
            <span className="pc-clock">{elapsed}</span>
            <button type="button" className="pc-rules" onClick={() => setShowHelp(true)}>Rules</button>
          </>
        ) : (
          <a className="pc-lb" href={`${PATH}/leaderboard`}>Leaderboard</a>
        )}
      </div>

      <div className="pp-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '8px 16px 70px' }}>
        {hydrated && preStart && <Launch puzzle={PUZZLE} canvasRef={canvasRef} onBoard={startGame} />}
        {hydrated && started && <div style={{ maxWidth: 620, margin: '0 auto' }}>{board}</div>}
        {hydrated && done && !finale && ending}
      </div>

      {finale && done && (
        <Finale scores={sc} total={total} clock={elapsed} inks={inks} onDone={finaleDone} />
      )}
      <RunNudgePop target="gauntlet" ready={nudgeReady} delay={10000} fireOnLeave />
      <DuelBanner token={duelToken} info={duelInfo} submitted={duelSubmitted} />

      {showHelp && (
        <div onClick={() => setShowHelp(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,16,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--stg-raise,#0e131f)', borderRadius: 12, border: '1px solid var(--stg-line)', padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: INK }}>How to play</div>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: FADED }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="pp-go" onClick={() => setShowHelp(false)} style={{ marginTop: 14 }}>Back to the round</button>
          </div>
        </div>
      )}

      <section style={{ position: 'relative', display: started ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About {NAME}</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          {NAME} is a free daily geography run from Mind Loft: one mystery country a day, played five ways. Name it from a zoomed-in photo of a landmark, build its flag, name its land neighbors, drop a pin on its capital, and call five countries bigger or smaller by area. Each round scores out of 10, for one total out of 50.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Your total decides the passport you travel home on, from the Sierra Leonean passport up to the Japanese, ranked by the visa-free destinations each opens in the {HENLEY_EDITION}. Everyone gets the same country, and the leaderboard ranks your total, then time. A new country boards every day at midnight Eastern, with a bigger one on Sundays.
        </p>
      </section>
    </div>
  );

}
