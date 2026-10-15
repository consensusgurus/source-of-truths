'use client';

// PASSPORT, THE RUN (owner, 2026-10-14), from 2026-10-15. Passport stopped
// being one mystery country played five ways. A day is now:
//
//   1 Span    the day's Span, the real game          10 points (its score scaled)
//   2 Flank   the day's Flank, the real game         10 points
//   3 Ping    the day's Ping, the real game          10 points
//   4 Sizes   nine bigger-or-smaller calls, on land area or population   20 points
//             area, three on Span's road, three on Flank's country and its
//             ring, three on Ping's city's country (lib/passport-sizes.js)
//
// Still out of 50, on the same six passports. EACH GAME IS THE REAL GAME,
// mounted through app/RunEmbed.jsx exactly as the Judged and Dojo runs mount
// theirs: its own start gate, save and /api/quiz/result row. A game already
// finished today on its own page is not replayed; its first result stands.
// The sizes leg files the day's passport row (score = calls right, out of 9).
// The circuit board (lib/circuits 'passport', scorer 'passport') adds the four
// rows up with lib/passport.js legPoints, the same rounding shown here.
//
// The pregame, the finale curtain and the ending are Passport's own (the
// departures board, the visa page, the cover upgrading rung by rung), shared
// with the five-round client in ./PassportClient.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import RunEmbed from '../RunEmbed';
import DailyRules from '../DailyRules';
import NextDrop from '../NextDrop';
import ChallengeStrip from '../ChallengeStrip';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useCircuitBoard from '../circuits/useCircuitBoard';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import GauntletMorePop from '../circuits/GauntletMorePop';
import { RunChallengeButton, RunChallengeLine } from '../RunChallenge';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { KEY, LEGS, legPoints, TIERS, tierIndex, HENLEY_EDITION, shareLinesRun } from '@/lib/passport';
import { Stamp, Cover, Finale, Launch, PP_CSS, LAUNCH_CSS, ENDING_CSS, usePlaneMap } from './PassportClient';

const CLIENTS = {
  span: dynamic(() => import('../span/SpanClient'), { ssr: false, loading: () => null }),
  flank: dynamic(() => import('../flank/FlankClient'), { ssr: false, loading: () => null }),
  ping: dynamic(() => import('../ping/PingClient'), { ssr: false, loading: () => null }),
};

const PATH = '/passport';
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'Manrope', ui-monospace, 'SFMono-Regular', monospace";
const INKS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24'];
const STATS_KEY = 'sot_passport_stats';
const VARS = { '--pp-sea': '#0a1222', '--pp-land': '#2a3652', '--pp-edge': '#0b0f1a', '--pp-home': '#f0718b', '--pp-hit': '#2f7a64', '--pp-miss': '#5a3340', '--pp-panel': '#181e2d', '--pp-line': 'rgba(255,255,255,0.18)', '--pp-good': '#6ee7b7', '--pp-bad': '#fb7185', '--pp-gold': '#fbbf24', '--pp-label': '#ffffff', '--pp-halo': '#0b0f1a' };
const SRC_NAME = { span: 'Span', flank: 'Flank', ping: 'Ping' };

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const fmtClock = (ms) => { const s = Math.max(0, Math.round((ms || 0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
function getAnonId() {
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) { a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`; localStorage.setItem('sot_quiz_anon', a); }
    return a;
  } catch (e) { return null; }
}
function recordStat(num, entry) {
  try {
    let s = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    if (!s || s.v !== 1 || !s.rec) s = { v: 1, rec: {} };
    if (s.rec[num]) return;
    s.rec[num] = entry;
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch (e) {}
}

const freshState = () => ({ v: 2, status: 'playing', t0: null, tEnd: null, round: 0, fin: false, sc: [null, null, null, null], res: {}, sz: { i: 0, res: [], t0: null, tEnd: null } });
const sumScores = (sc) => sc.reduce((t, v) => t + (v || 0), 0);

// A game finished today on its own page: its first result, read off that
// game's own save and stats record. Null when it has not been finished.
function bankedOf(sec) {
  try {
    const save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null');
    if (!save || !save.status || save.status === 'playing') return null;
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || null;
    const ms = save.t0 && save.tEnd ? save.tEnd - save.t0 : 0;
    if (rec && Number.isFinite(Number(rec.s)) && Number(rec.t)) return { score: Number(rec.s), total: Number(rec.t), ms, banked: true };
    if (save.status === 'revealed') return { score: 0, total: 10, ms, banked: true };
    if (sec.key === 'flank' && Array.isArray(save.found) && sec.light && sec.light.total) return { score: save.found.length, total: sec.light.total, ms, banked: true };
    return { score: 0, total: 0, ms, banked: true, unknown: true };
  } catch (e) { return null; }
}

export default function PassportRunClient({ puzzles = [], puzzle, sections = [], calls = [], isTodays = true }) {
  const PUZZLE = puzzle;
  const STORE_KEY = `sot_${KEY}_${PUZZLE.num}`;
  const REC_KEY = `sot_${KEY}_rec_${PUZZLE.num}`;
  const NC = calls.length || 9;
  const [g, setG] = useState(() => freshState());
  const gRef = useRef(g);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [holding, setHolding] = useState(null);
  const [numShow, setNumShow] = useState(null);
  const [slam, setSlam] = useState(-1);
  const [finale, setFinale] = useState(false);
  const [nudgeReady, setNudgeReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const doneAtLoad = useRef(null);
  const canvasRef = useRef(null);

  const commit = useCallback((next) => { gRef.current = next; setG(next); }, []);
  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) {}
    const b = {};
    for (const sec of sections) { const x = bankedOf(sec); if (x) b[sec.key] = x; }
    setBanked(b);
    if (saved && saved.v === 2 && Array.isArray(saved.sc)) {
      const next = { ...freshState(), ...saved, sz: { ...freshState().sz, ...(saved.sz || {}) } };
      gRef.current = next; setG(next);
      doneAtLoad.current = next.status !== 'playing';
    } else doneAtLoad.current = false;
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (id && id.email) setIdentity(id); } catch (e) {}
    setHydrated(true);
    try { fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId: PUZZLE.quizId }) }).catch(() => {}); } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The save, and the day breadcrumb every daily surface reads (t0 is the
  // started signal; a page merely opened writes nothing).
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(g)); } catch (e) {}
    if (!isTodays) return;
    try {
      const fin = g.status !== 'playing';
      if (fin || g.t0) localStorage.setItem(`sot_${KEY}_day`, JSON.stringify({ d: etToday(), done: fin }));
      else localStorage.removeItem(`sot_${KEY}_day`);
    } catch (e) {}
  }, [g, hydrated, STORE_KEY, isTodays]);

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const done = !playing;
  const sc = g.sc;
  const total = sumScores(sc);
  usePlaneMap(canvasRef, preStart && hydrated, true, 0);

  useEffect(() => {
    if (!started) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [started]);

  const cboard = useCircuitBoard(KEY, hydrated && done);

  function award(cur, i, score, patch) {
    const sc2 = cur.sc.slice(); sc2[i] = score;
    commit({ ...cur, ...patch, sc: sc2 });
    setSlam(i); setTimeout(() => setSlam(-1), 900);
  }

  // A game already finished today stamps its leg the moment the run reaches it.
  useEffect(() => {
    if (!hydrated || !started || g.round > 2 || g.sc[g.round] != null) return;
    const sec = sections[g.round];
    const b = sec && banked[sec.key];
    if (!b) return;
    award(g, g.round, legPoints(sec.key, b.score, b.total), { res: { ...g.res, [sec.key]: { ...b } } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, started, g.round, banked]);

  // An embedded game reports its filed result. Its finished board holds for a
  // beat so the player sees it, then the leg's stamp takes its place.
  const onSectionDone = useCallback((res) => {
    const cur = gRef.current;
    const sec = sections[cur.round];
    if (!sec || !res || res.key !== sec.key || cur.sc[cur.round] != null) return;
    const ms = res.t0 ? Math.max(1000, (res.tEnd || Date.now()) - res.t0) : 0;
    award(cur, cur.round, legPoints(sec.key, res.score, res.total), { res: { ...cur.res, [sec.key]: { score: res.score, total: res.total, ms } } });
    setHolding(sec.key);
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), 1700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  function start() {
    const cur = gRef.current;
    if (cur.t0) return;
    commit({ ...cur, t0: Date.now() });
    setNow(Date.now());
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  function advance() {
    const cur = gRef.current;
    if (cur.round >= 3) return;
    const next = { ...cur, round: cur.round + 1 };
    if (next.round === 3 && !next.sz.t0) next.sz = { ...next.sz, t0: Date.now() };
    commit(next);
    try { window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch (e) {}
  }

  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || cur.round !== 3 || !cur.sz.res.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const right = cur.sz.res.filter(Boolean).length;
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.sz.t0 || cur.t0 || Date.now())) / 1000)));
    return { quizId: PUZZLE.quizId, score: right, total: NC, correct: right, guessesUsed: cur.sz.res.length - right, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // The sizes leg files the day's passport row: calls right, out of nine, on
  // the leg's own clock (each game filed its own row with its own clock).
  function postResult(g2) {
    abandon.markFlushed();
    const right = g2.sz.res.filter(Boolean).length;
    const el = Math.max(1, Math.round(((g2.sz.tEnd || Date.now()) - (g2.sz.t0 || g2.t0 || Date.now())) / 1000));
    const s = sumScores(g2.sc);
    recordStat(PUZZLE.num, { s, t: 50, won: s >= 30 });
    try { if (localStorage.getItem(REC_KEY)) return; localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: PUZZLE.quizId, score: right, total: NC, correct: right, guessesUsed: NC - right, timeElapsed: el, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
      }).catch(() => {});
    } catch (e) {}
  }

  // A call is on area (km2) or population (owner, 2026-10-14). Days dealt
  // before the measure existed carry no `m` and are area calls.
  const valA = (c) => (c.aVal != null ? c.aVal : c.aArea);
  const valB = (c) => (c.bVal != null ? c.bVal : c.bArea);
  const fmtSize = (v, pop) => {
    const n = Number(v) || 0;
    if (!pop) return `${Math.round(n).toLocaleString()} km\u00b2`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(/\.?0+$/, '')} billion people`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '')} million people`;
    return `${Math.round(n).toLocaleString()} people`;
  };

  function callSize(bigger) {
    const cur = gRef.current;
    if (cur.round !== 3 || cur.sc[3] != null || numShow != null) return;
    const i = cur.sz.i;
    const c = calls[i]; if (!c) return;
    const ok = bigger === (valB(c) > valA(c));
    commit({ ...cur, sz: { ...cur.sz, res: [...cur.sz.res, ok] } });
    setNumShow(i);
    setTimeout(() => {
      setNumShow(null);
      const c2 = gRef.current;
      if (i + 1 >= NC) {
        const right = c2.sz.res.filter(Boolean).length;
        award(c2, 3, legPoints('passport', right, NC), { sz: { ...c2.sz, i: i + 1, tEnd: Date.now() } });
      } else commit({ ...c2, sz: { ...c2.sz, i: i + 1 } });
    }, reducedMotion() ? 500 : 1500);
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
  useEffect(() => {
    if (!hydrated || g.round !== 3 || g.sc[3] == null || g.status !== 'playing') return undefined;
    const t = setTimeout(() => finish(), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, g.round, g.sc[3], g.status]);
  function finaleDone() {
    setFinale(false); setNudgeReady(true);
    const cur = gRef.current;
    if (!cur.fin) commit({ ...cur, fin: true });
  }

  const elapsed = g.t0 ? fmtClock((g.tEnd || now) - g.t0) : '0:00';
  function shareUrl(withScores) {
    const q = [];
    if (!isTodays) q.push(`p=${PUZZLE.num}`);
    if (withScores) q.push(`s=${sc.map((v) => v || 0).join('-')}`);
    return withRef(`mindloftdaily.com${PATH}${q.length ? `?${q.join('&')}` : ''}`);
  }
  function copyShare() {
    const text = playing
      ? `Passport #${PUZZLE.num}: the day's Span, Flank and Ping, then nine size calls. One score out of 50, one passport.\n${shareUrl()}`
      : shareLinesRun(PUZZLE.num, total, sc, elapsed, shareUrl(true));
    if (notifyShareCredit(text)) return;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const rulesSteps = [
    <><b>Span.</b> The day&rsquo;s Span: join two countries by the shortest chain of land borders. Its score out of 10 is your stamp.</>,
    <><b>Flank.</b> The day&rsquo;s Flank: name every land neighbor of one country. The share you name, out of 10.</>,
    <><b>Ping.</b> The day&rsquo;s Ping: find a secret city by how far each guess lands from it. Its score out of 10.</>,
    <><b>Sizes.</b> Nine countries from those three games, one pair at a time: is the second bigger or smaller than the first, by area or by population (each call says which)? About 2 points a call, 20 in all.</>,
    <>Played one of the three on its own page today? Your first result stands and the run steps over it. The board ranks your total, then time.</>,
  ];
  const rulesBody = (
    <DailyRules accent="#be123c" accentSoft="#fdecef"
      lead="Three geography games and one size round, one score out of 50. Your total decides which passport you travel home on."
      steps={rulesSteps}
      knack="The sizes leg rewards the countries you just met: the road you walked in Span, Flank's country and its ring, and the country Ping's city is in."
      footer={`Areas are from the CIA World Factbook, checked against a second table so no call turns on a disputed figure. The passports and their visa-free counts are the ${HENLEY_EDITION}.`} />
  );

  const sec = started && g.round < 3 ? sections[g.round] : null;
  const showGame = !!(sec && (g.sc[g.round] == null || holding === sec.key) && !banked[sec.key]);
  const Game = sec ? CLIENTS[sec.key] : null;

  const slots = (
    <div className="pp-slots pr-slots">
      {LEGS.map((l, i) => (
        <div key={l.k} className={`pp-slot${started && g.round === i ? ' on' : ''}`}>
          {sc[i] == null ? <span>{l.n}</span> : <Stamp i={i} score={sc[i]} slam={slam === i} ink={INKS[i]} name={l.n} max={l.max} />}
        </div>
      ))}
    </div>
  );

  const between = () => {
    const i = g.round;
    const l = LEGS[i];
    const r = g.res[sec.key] || banked[sec.key] || {};
    const wasBanked = !!banked[sec.key];
    const nextL = LEGS[i + 1];
    return (
      <div className="pr-between">
        <div className="pp-eb"><span>Leg {i + 1} of 4</span><b>{l.n}</b></div>
        <div className="pr-bstamp"><Stamp i={i} big slam={slam === i} score={sc[i]} name={l.n} max={l.max} ink={INKS[i]} /></div>
        <p className="pp-reveal" style={{ textAlign: 'center' }}>
          {wasBanked ? `${l.n} was played earlier today, so that first result stands. ` : ''}
          {r.unknown ? 'Result on file.' : `${l.n} ${r.score}/${r.total}, worth ${sc[i]} of ${l.max} here.`}
        </p>
        <div className="pp-endrow" style={{ justifyContent: 'center' }}>
          <button type="button" className="pp-go" onClick={advance}>Next: {nextL.k === 'passport' ? 'the sizes' : nextL.n} &rarr;</button>
        </div>
      </div>
    );
  };

  const sizes = () => {
    const doneR = sc[3] != null;
    const i = Math.min(g.sz.i, NC - 1);
    const c = calls[i] || {};
    const shown = numShow === i || doneR;
    const pop = c.m === 'pop';
    const aV = valA(c), bV = valB(c);
    const MAX = Math.max(aV || 1, bV || 1) * 1.05;
    const right = g.sz.res.filter(Boolean).length;
    return (
      <>
        <div className="pp-eb"><span>Leg 4 of 4</span><b>Sizes</b><span className="pr-src">From {SRC_NAME[c.src] || ''}</span></div>
        <h2 className="pp-h">{pop ? <>Does {c.bName} have more or fewer people than {c.aName}?</> : <>Is {c.bName} bigger or smaller than {c.aName} by area?</>}</h2>
        <div className="pp-vs">
          <div className="pp-vc home"><div className="pp-mono">{c.aName}</div><div className="v">{fmtSize(aV, pop)}</div><div className="bar"><i style={{ width: `${((aV || 0) / MAX) * 100}%` }} /></div></div>
          <div className="pp-vc them"><div className="pp-mono">{doneR ? 'Last one' : `${i + 1} of ${NC}`}</div><div className="n">{c.bName}</div><div className="v">{shown ? fmtSize(bV, pop) : (pop ? '? people' : '? km²')}</div><div className="bar"><i style={{ width: shown ? `${((bV || 0) / MAX) * 100}%` : '0%' }} /></div></div>
        </div>
        {!doneR && (
          <div className="pp-bl">
            <button type="button" className="pp-ghost big" disabled={numShow != null} onClick={() => callSize(true)}>{pop ? 'More' : 'Bigger'}</button>
            <button type="button" className="pp-ghost big" disabled={numShow != null} onClick={() => callSize(false)}>{pop ? 'Fewer' : 'Smaller'}</button>
          </div>
        )}
        <div className="pp-dots">{calls.map((_, k) => <i key={k} className={g.sz.res[k] === true ? 'ok' : g.sz.res[k] === false ? 'ko' : k === g.sz.i ? 'cur' : ''} />)}</div>
        {numShow != null && <p className="pp-reveal">{pop ? <>{c.bName} has {bV > aV ? 'more' : 'fewer'} people, by {fmtSize(Math.abs(bV - aV), true)}.</> : <>{c.bName} is {bV > aV ? 'bigger' : 'smaller'}, by {fmtSize(Math.abs(bV - aV), false)}.</>}</p>}
        {doneR && <p className="pp-reveal">{right} of {NC} called right. Areas and populations from the CIA World Factbook.</p>}
      </>
    );
  };

  const k = tierIndex(total);
  const tier = TIERS[k];
  const up = TIERS[k + 1];
  const me = cboard && cboard.data ? (cboard.data.me || cboard.data.meProvisional || null) : null;
  const field = cboard && cboard.data && Array.isArray(cboard.data.overall) ? (cboard.data.overallField || cboard.data.uniquePlayers || cboard.data.overall.length) : null;
  const frac = sc.map((v, i) => (v || 0) / LEGS[i].max);
  let hiR = 0, loR = 0;
  frac.forEach((v, i) => { if (v > frac[hiR]) hiR = i; if (v < frac[loR]) loR = i; });
  const flat = frac[hiR] === frac[loR];
  const runSecs = g.t0 && g.tEnd ? Math.round((g.tEnd - g.t0) / 1000) : null;

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
          <p className="pe-ln">{tier.line}</p>
          <div className="pe-stats">
            <div><b>{total}/50</b><span>Score</span></div>
            {me && me.rank ? <div><b>#{me.rank}</b><span>{field ? `of ${Number(field).toLocaleString()} today` : 'today'}</span></div> : null}
            <div><b>{tier.vf}</b><span>Visa-free</span></div>
          </div>
          {isTodays ? (
            <NextDrop label="Next flight" sub="A new Span, Flank and Ping board at midnight Eastern." href={PATH}
              accent="#c4b5fd" style={{ margin: '4px 0 12px', maxWidth: 400 }} />
          ) : null}
          <div className="pe-rounds pr-legs">
            {LEGS.map((l, i) => <div key={l.k} className={flat ? '' : i === hiR ? 'hi' : i === loR ? 'lo' : ''}><i>{l.n}</i><b>{sc[i] == null ? '-' : sc[i]}<small>/{l.max}</small></b></div>)}
          </div>
          <div className="pe-next">{up ? <><b>{up.min - total} more</b> and you upgrade to the {up.name}.</> : <>Top of the ladder. <b>Every border waves you through.</b></>}</div>
          <RunChallengeLine gameKey="passport" score={total} n={PUZZLE.num} />
          <div className="pe-btns">
            <RunChallengeButton gameKey="passport" score={total} total={50} n={PUZZLE.num} archive={!isTodays}
              t={runSecs} status={tier.name || ''} />
            <button type="button" className="pri" onClick={copyShare}>{copied ? 'Copied' : 'Share your passport'}</button>
            <a href={`${PATH}/leaderboard`}>Leaderboard</a>
            <button type="button" onClick={() => setFinale(true)}>Replay the ending</button>
            <a href="/">Back to main</a>
          </div>
          <MoreRunsList self="passport" />
          <div className="pe-foot">
            Each leg is also its own daily: {sections.map((s, i) => <React.Fragment key={s.key}>{i ? ' · ' : ''}<a href={s.path}>{s.name}</a></React.Fragment>)}
            {!isTodays ? <> · You played the {PUZZLE.dateLabel} archive. <a href={PATH}>Back to today&rsquo;s Passport</a></> : null}
          </div>
        </div>
      </div>
      {!identity && (
        <div className="pe-join">
          <JoinLeaderboardForm hideIcon heading="Put your passport on the board" identity={identity} onJoined={(id) => setIdentity(id)} />
        </div>
      )}
    </section>
  );

  const doneNames = sections.filter((s) => banked[s.key]).map((s) => s.name);
  const launchRules = (
    <div className="pl-rules">
      <ol>{rulesSteps.map((x, i) => <li key={i}>{x}</li>)}</ol>
      <p>The passports are the {HENLEY_EDITION}. Areas from the CIA World Factbook.</p>
    </div>
  );

  return (
    <div className="stage-page pp-root pr-root" data-stage-theme="dark"
      style={{ ...VARS, minHeight: '100vh', background: 'var(--stg-ground,#0b0f1a)', color: 'var(--stg-ink,#e9edf4)', position: 'relative', overflowX: 'hidden', fontFamily: SANS }}>
      <style dangerouslySetInnerHTML={{ __html: PP_CSS + LAUNCH_CSS + ENDING_CSS + RUN_CSS }} />
      {playing ? <ChallengeStrip gameKey="passport" num={PUZZLE.num} /> : null}
      <div className={`pc-cap${started ? ' on' : ''}`}>
        <a href="/" className="pc-home">Mind Loft</a>
        <b>Passport</b>
        <span className="pc-capd">{PUZZLE.dateLabel.replace(/, \d{4}$/, '')}</span>
        {started ? (
          <>
            <span className="pc-capt" aria-label={`Leg ${Math.min(4, g.round + 1)} of 4`}>{LEGS.map((l, i) => <i key={l.k} className={i < g.round ? 'd' : i === g.round ? 'on' : ''} />)}</span>
            <span className="pc-clock">{elapsed}</span>
            <button type="button" className="pc-rules" onClick={() => setShowHelp(true)}>Rules</button>
          </>
        ) : (
          <a className="pc-lb" href={`${PATH}/leaderboard`}>Leaderboard</a>
        )}
      </div>

      <div className="pp-wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '8px 16px 70px' }}>
        {hydrated && preStart && (
          <>
            <Launch puzzle={PUZZLE} canvasRef={canvasRef} onBoard={start}
              legs={LEGS} demo={[8, 10, 7, 16]} gate="4 legs"
              lede={<>The day&rsquo;s <b>Span</b>, <b>Flank</b> and <b>Ping</b>, then <b>nine countries</b> from them called bigger or smaller. Your score decides <b>which passport</b> you travel home on.</>}
              visaTitle="Four legs, four stamps"
              visaText="Cross the map in Span, ring a country in Flank, hunt a city in Ping, then size up the countries you met."
              rules={launchRules}
              sundayNote="Sundays bring each game's own Sunday Edition"
              boardLabel="Board now: start the run" />
            {doneNames.length ? <p className="pr-note">Already played today: {doneNames.join(', ')}. Your first {doneNames.length === 1 ? 'result stands' : 'results stand'}, so the run steps over {doneNames.length === 1 ? 'it' : 'them'}.</p> : null}
          </>
        )}
        {hydrated && started && (
          <div className="pr-play">
            <div style={{ width: '100%', maxWidth: 620, margin: '0 auto' }}>{slots}</div>
            {sec && showGame && Game ? (
              <div className="pr-host">
                <RunEmbed onResult={onSectionDone} theme="dark">
                  {sec.key === 'flank'
                    ? <Game key={`flank-${sec.num}`} puzzles={[sec.light]} dayByNum={{ [sec.num]: sec.day }} forceNum={null} />
                    : <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />}
                </RunEmbed>
              </div>
            ) : null}
            {sec && !showGame && g.sc[g.round] != null ? (
              <div className="stg-board pp-board" style={{ maxWidth: 620, margin: '0 auto', background: 'var(--stg-surf,rgba(255,255,255,0.045))', border: '1px solid var(--stg-line,rgba(255,255,255,0.11))', padding: 15 }}>{between()}</div>
            ) : null}
            {g.round === 3 ? (
              <div className="stg-board pp-board" style={{ maxWidth: 620, margin: '0 auto', background: 'var(--stg-surf,rgba(255,255,255,0.045))', border: '1px solid var(--stg-line,rgba(255,255,255,0.11))', padding: 15 }}>{sizes()}</div>
            ) : null}
          </div>
        )}
        {hydrated && done && !finale && ending}
      </div>

      {finale && done && <Finale scores={sc} total={total} clock={elapsed} inks={INKS} onDone={finaleDone} legs={LEGS} />}
      <MoreRunsPop self="passport" ready={nudgeReady} delay={10000} fireOnLeave />
      <GauntletMorePop circuitId="passport" ready={hydrated && done && !finale} />

      {showHelp && (
        <div onClick={() => setShowHelp(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,16,0.7)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--stg-raise,#0e131f)', borderRadius: 12, border: '1px solid var(--stg-line)', padding: '20px 22px', fontFamily: SANS, maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--stg-ink,#e9edf4)' }}>How to play</div>
              <button onClick={() => setShowHelp(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stg-mute,#8b95a8)' }}><X size={20} /></button>
            </div>
            {rulesBody}
            <button className="pp-go" onClick={() => setShowHelp(false)} style={{ marginTop: 14 }}>Back to the run</button>
          </div>
        </div>
      )}

      <section style={{ position: 'relative', display: started ? 'none' : 'block', zIndex: 2, maxWidth: 620, margin: '0 auto', padding: '10px 24px 42px', fontFamily: SANS }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--stg-ink,#e9edf4)' }}>About Passport</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: 'var(--stg-mute,#8b95a8)', fontWeight: 600 }}>
          Passport is a free daily geography run from Mind Loft: the day&rsquo;s Span, Flank and Ping played back to back, each worth 10, then nine bigger-or-smaller calls on area or population, worth 20, on countries from those three games. One total out of 50.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'var(--stg-mute,#8b95a8)', fontWeight: 600 }}>
          Your total decides the passport you travel home on, from the Sierra Leonean passport up to the Japanese, ranked by the visa-free destinations each opens in the {HENLEY_EDITION}. Everyone plays the same boards, and the leaderboard ranks your total, then time. A new run boards every day at midnight Eastern.
        </p>
      </section>
    </div>
  );
}

const RUN_CSS = `
.pr-slots{grid-template-columns:repeat(4,1fr) !important}
.pr-play{display:flex;flex-direction:column;gap:6px}
.pr-host{animation:prrise .45s ease both}
.pr-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
html:has(.stage-page.pr-root),body:has(.stage-page.pr-root){background:#0b0f1a !important}
.pr-between{text-align:center;padding:8px 0 4px;animation:prrise .4s ease both}
.pr-between .pp-eb{justify-content:center}
.pr-bstamp{display:flex;justify-content:center;margin:14px 0 6px}
.pr-src{margin-left:auto;font-weight:500;color:#9aa8c4}
.pr-note{max-width:520px;margin:-4px auto 16px;text-align:center;font-size:13px;font-weight:700;color:#9aa8c4}
.pr-legs{grid-template-columns:repeat(4,minmax(0,1fr)) !important}
.pr-legs b small{font-size:11px;color:#9aa8c4}
@keyframes prrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.pr-host,.pr-between{animation:none !important}}
`;
