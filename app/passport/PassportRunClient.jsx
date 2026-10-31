'use client';

// PASSPORT, THE RUN (owner, 2026-10-14), from 2026-10-15. Passport stopped
// being one mystery country played five ways. A day is now:
//
//   1 Span    the day's Span, the real game          10 points (its score scaled)
//   2 Flank   the day's Flank, the real game         10 points
//   3 Ping    the day's Ping, the real game          10 points
//   4 Sizes   nine bigger-or-smaller calls, on land area or population   20 points (14 from 2026-10-21, games 12)
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
// ON THE STAGE (owner, 2026-10-25): the entry, the handover between legs, the
// play page and the ending are the Gauntlet run's screens (app/GauntletScreens),
// with Passport's own booklet as the entry's centerpiece and the six passports
// as the ending's climb. The departures-board curtain and the old cover ending
// are retired here; the five-round client in ./PassportClient keeps its own.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import RunEmbed from '../RunEmbed';
import DailyRules from '../DailyRules';
import ChallengeStrip from '../ChallengeStrip';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { stageAvg } from '../circuits/RunScorecard';
import { rampFor } from '@/lib/circuits';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import GauntletMorePop from '../circuits/GauntletMorePop';
import { RUN_DOORS, runDoneToday } from '../circuits/RunDoorPop';
import { otherRuns } from '@/lib/run-seo';
import { RunChallengeButton, RunChallengeLine, RunMeme } from '../RunChallenge';
import { notifyShareCredit } from '../ShareCreditPop';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { isDarkLook } from '@/lib/stage-look';
import { scoreText } from '@/lib/daily-games';
import { KEY, legsFor, legOrderFor, legOrderBefore, legPoints, TIERS, tierIndex, HENLEY_EDITION, shareLinesRun } from '@/lib/passport';
import { PP_CSS } from './PassportClient';
import { LegShell } from '../StageLeg';
import { GauntletGate, GauntletBetween, GauntletEndStage, GauntletCover, RunPlayFrame, useGauntletLook } from '../GauntletScreens';
import HelpSheet from '../HelpSheet';

const CLIENTS = {
  span: dynamic(() => import('../span/SpanClient'), { ssr: false, loading: () => null }),
  flank: dynamic(() => import('../flank/FlankClient'), { ssr: false, loading: () => null }),
  ping: dynamic(() => import('../ping/PingClient'), { ssr: false, loading: () => null }),
};

const PATH = '/passport';
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
// The same four inks for paper (the stamps inside the earned passport).
const INKS_DEEP = ['#6d28d9', '#1d4ed8', '#047857', '#a16207'];
const STATS_KEY = 'sot_passport_stats';
const SRC_NAME = { span: 'Span', flank: 'Flank', ping: 'Ping' };
// One short line per leg for the entry's lineup bands (the long lines in
// lib/passport.js LEGS wrap under the big name on the handover instead).
const SHORT = { ping: 'Find the secret city', passport: 'Nine size calls', flank: 'Name every neighbor', span: 'Cross the map by borders' };
const BETWEEN_MS = 15000;
const HOLD_PING_MS = 10000;

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

// THE SERVER IS ASKED TOO (owner, 2026-10-15). bankedOf only knows this
// browser, so a Ping finished on a phone was invisible to a laptop, which
// served it again while the board kept the first row. Each leg's quizId is
// now checked against /api/quiz/result?first=1, which returns the row the
// board counts (the earliest completed attempt), and a server row WINS over
// the local reading because it is what the board scores. No leg mounts until
// the check answers or CHECK_MS passes; a late answer is dropped so a game is
// never pulled out from under a player mid-leg.
const CHECK_MS = 4000;

export default function PassportRunClient({ puzzles = [], puzzle, sections = [], calls = [], isTodays = true }) {
  const PUZZLE = puzzle;
  // The leg weights this day runs on (even legs from 2026-10-21).
  const LEGS = legsFor(PUZZLE && PUZZLE.live);
  const STORE_KEY = `sot_${KEY}_${PUZZLE.num}`;
  const REC_KEY = `sot_${KEY}_rec_${PUZZLE.num}`;
  const NC = calls.length || 9;
  // Play order: ORD[step] is an index into LEGS (the storage order). The order
  // a run was STARTED under travels in its save (`ord`), so a run begun before
  // a reorder keeps the order it was played in: g.round is a step in ORD, and
  // re-reading a saved round against a new order would skip or replay a leg.
  const BASE_ORD = legOrderFor(PUZZLE.live);
  const fresh = () => ({ ...freshState(), ord: BASE_ORD });
  const ordOf = (st) => (st && Array.isArray(st.ord) && st.ord.length === 4 ? st.ord : BASE_ORD);
  const [g, setG] = useState(() => fresh());
  const ORD = ordOf(g);
  const SIZES_FIRST = ORD[0] === 3;
  // On days that deal the sizes from anywhere (not from the day's games).
  const OPEN_SIZES = calls.some((c) => c && c.src === 'open');
  const gRef = useRef(g);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [checking, setChecking] = useState(true);
  const srvDone = useRef(false);
  const [holding, setHolding] = useState(null);
  const [numShow, setNumShow] = useState(null);
  const [nudgeReady, setNudgeReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const doneAtLoad = useRef(null);

  const commit = useCallback((next) => { gRef.current = next; setG(next); }, []);
  useEffect(() => { gRef.current = g; }, [g]);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) {}
    const b = {};
    for (const sec of sections) { const x = bankedOf(sec); if (x) b[sec.key] = x; }
    setBanked(b);
    checkServer();
    if (saved && saved.v === 2 && Array.isArray(saved.sc)) {
      // A save written before `ord` existed was started under the order of
      // its day as it stood then (legOrderBefore); one never started takes
      // today's order.
      const ord = Array.isArray(saved.ord) && saved.ord.length === 4 ? saved.ord : (saved.t0 ? legOrderBefore(PUZZLE.live) : BASE_ORD);
      const next = { ...fresh(), ...saved, ord, sz: { ...freshState().sz, ...(saved.sz || {}) } };
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

  function checkServer() {
    let anonId = null, email = null;
    try { anonId = localStorage.getItem('sot_quiz_anon'); } catch (e) {}
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); if (id && id.email) email = id.email; } catch (e) {}
    if ((!anonId && !email) || !sections.length) { srvDone.current = true; setChecking(false); return; }
    const timer = setTimeout(() => { srvDone.current = true; setChecking(false); }, CHECK_MS);
    Promise.all(sections.map((sec) => {
      if (!sec.quizId) return Promise.resolve(null);
      const q = new URLSearchParams({ quizId: sec.quizId, first: '1' });
      if (anonId) q.set('anonId', anonId);
      if (email) q.set('email', email);
      return fetch(`/api/quiz/result?${q.toString()}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
        .then((j) => (j && j.found && Number(j.total) > 0
          ? [sec.key, { score: Number(j.score) || 0, total: Number(j.total), ms: (Number(j.timeElapsed) || 0) * 1000, banked: true, server: true }]
          : null));
    })).then((hits) => {
      clearTimeout(timer);
      if (srvDone.current) return;
      srvDone.current = true;
      const add = Object.fromEntries(hits.filter(Boolean));
      if (Object.keys(add).length) setBanked((b) => ({ ...b, ...add }));
      setChecking(false);
    });
  }

  const playing = g.status === 'playing';
  const preStart = playing && !g.t0;
  const started = playing && !!g.t0;
  const done = !playing;
  const sc = g.sc;
  const total = sumScores(sc);

  useEffect(() => {
    if (!started) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [started]);

  const cboard = useCircuitBoard(KEY, hydrated && done);

  function award(cur, i, score, patch) {
    const sc2 = cur.sc.slice(); sc2[i] = score;
    commit({ ...cur, ...patch, sc: sc2 });
  }

  // A game already finished today stamps its leg the moment the run reaches it.
  useEffect(() => {
    const li = ORD[g.round];
    if (!hydrated || !started || li > 2 || g.sc[li] != null) return;
    const sec = sections[li];
    const b = sec && banked[sec.key];
    if (!b) return;
    award(g, li, legPoints(sec.key, b.score, b.total, PUZZLE.live), { res: { ...g.res, [sec.key]: { ...b } } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, started, g.round, banked]);

  // An embedded game reports its filed result. Its finished board holds for a
  // beat so the player sees it, then the leg's stamp takes its place.
  const onSectionDone = useCallback((res) => {
    const cur = gRef.current;
    const li = ordOf(cur)[cur.round];
    const sec = sections[li];
    if (!sec || !res || res.key !== sec.key || cur.sc[li] != null) return;
    const ms = res.t0 ? Math.max(1000, (res.tEnd || Date.now()) - res.t0) : 0;
    award(cur, li, legPoints(sec.key, res.score, res.total, PUZZLE.live), { res: { ...cur.res, [sec.key]: { score: res.score, total: res.total, ms } } });
    setHolding(sec.key);
    // PING HOLDS LONGER (owner, 2026-10-26: the answer was gone before it
    // could be read). Its finished board names the city and zooms in on it,
    // and stays up for HOLD_PING_MS unless the player moves on first.
    const hold = sec.key === 'ping' ? HOLD_PING_MS : Math.max(1700, (res.beatMs || 0) + 500);
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), hold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  function start() {
    const cur = gRef.current;
    if (cur.t0) return;
    const t0 = Date.now();
    commit({ ...cur, t0, sz: ordOf(cur)[0] === 3 && !cur.sz.t0 ? { ...cur.sz, t0 } : cur.sz });
    setNow(t0);
    toTop();
  }
  function advance() {
    const cur = gRef.current;
    if (cur.round >= 3) return;
    const next = { ...cur, round: cur.round + 1 };
    if (ordOf(next)[next.round] === 3 && !next.sz.t0) next.sz = { ...next.sz, t0: Date.now() };
    commit(next);
    toTop();
  }
  // BACK TO THE TOP FOR EVERY LEG (owner, 2026-10-17). A smooth scroll started
  // as the next game mounts was cut short by the page growing under it, so the
  // next leg could open halfway down. Jump instantly, and again once the game
  // (a dynamic import) has drawn and once its start gate has settled.
  function toTop() {
    const go = () => { try { window.scrollTo(0, 0); } catch (e) {} };
    go();
    try { window.requestAnimationFrame(go); } catch (e) {}
    setTimeout(go, 160);
    setTimeout(go, 520);
  }

  const abandon = useAbandonFlush(() => {
    const cur = gRef.current;
    if (cur.status !== 'playing' || !cur.sz.res.length) return null;
    try { if (localStorage.getItem(REC_KEY)) return null; } catch (e) {}
    try { localStorage.setItem(REC_KEY, '1'); } catch (e) {}
    const right = cur.sz.res.filter(Boolean).length;
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - (cur.sz.t0 || cur.t0 || Date.now())) / 1000)));
    return { quizId: PUZZLE.quizId, score: right, total: NC, correct: right, guessesUsed: cur.sz.res.length - right, timeElapsed: el, abandoned: true, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') };
  });

  // The sizes leg files the day's passport row: calls right, out of nine, on
  // the leg's own clock (each game filed its own row with its own clock).
  function postResult(g2) {
    const s = sumScores(g2.sc);
    recordStat(PUZZLE.num, { s, t: 50, won: s >= 30 });
    postRow(g2);
  }
  // The passport row (the sizes: calls right out of nine). Filed the moment
  // the sizes leg ends, which on a sizes-first day is the start of the run.
  function postRow(g2) {
    abandon.markFlushed();
    const right = g2.sz.res.filter(Boolean).length;
    const el = Math.max(1, Math.round(((g2.sz.tEnd || Date.now()) - (g2.sz.t0 || g2.t0 || Date.now())) / 1000));
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
    if (ordOf(cur)[cur.round] !== 3 || cur.sc[3] != null || numShow != null) return;
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
        const sz2 = { ...c2.sz, i: i + 1, tEnd: Date.now() };
        award(c2, 3, legPoints('passport', right, NC, PUZZLE.live), { sz: sz2 });
        // The passport row files the moment the sizes end, unless they are the
        // last leg (then finish() files it a beat later, as before).
        if (ordOf(c2)[3] !== 3) postRow({ ...c2, sz: sz2 });
      } else commit({ ...c2, sz: { ...c2.sz, i: i + 1 } });
    }, reducedMotion() ? 500 : 1500);
  }

  function finish() {
    const cur = gRef.current;
    if (cur.status !== 'playing') return;
    const fin = { ...cur, status: 'done', tEnd: Date.now() };
    postResult(fin);
    // The stage ending replaced the departures-board curtain (owner,
    // 2026-10-25), so the run lands straight on it; `fin` still marks the
    // ending as seen, and the more-runs pop-up waits its usual 10 seconds.
    commit({ ...fin, fin: true });
    setNudgeReady(true);
  }
  useEffect(() => {
    if (!hydrated || g.round !== 3 || g.sc[ORD[3]] == null || g.status !== 'playing' || holding) return undefined;
    const t = setTimeout(() => finish(), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, g.round, g.sc[ORD[3]], g.status, holding]);

  const elapsed = g.t0 ? fmtClock((g.tEnd || now) - g.t0) : '0:00';
  function shareUrl(withScores) {
    const q = [];
    if (!isTodays) q.push(`p=${PUZZLE.num}`);
    if (withScores) q.push(`s=${sc.map((v) => v || 0).join('-')}`);
    return withRef(`mindloftdaily.com${PATH}${q.length ? `?${q.join('&')}` : ''}`);
  }
  function copyShare() {
    const text = playing
      ? `Passport #${PUZZLE.num}: ${ORD[0] === 2 ? "the day's Ping, nine size calls, then Flank and Span" : SIZES_FIRST ? "nine size calls, then the day's Ping, Flank and Span" : "the day's Span, Flank and Ping, then nine size calls"}. One points total, one passport.\n${shareUrl()}`
      : shareLinesRun(PUZZLE.num, total, sc, elapsed, shareUrl(true));
    if (notifyShareCredit(text)) return;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const sizesStep = (SIZES_FIRST || OPEN_SIZES)
    ? <><b>Sizes.</b> Nine pairs of countries close in size, drawn from anywhere in the world. Is the second bigger or smaller, by area or by population (each call says which)? {LEGS[3].max >= 18 ? 'About 2 points a call' : 'About a point and a half a call'}, {LEGS[3].max} in all.</>
    : <><b>Sizes.</b> Nine pairs, three for each game: a country from that game against another country close to it in size, often one you met today. Is the second bigger or smaller, by area or by population (each call says which)? {LEGS[3].max >= 18 ? 'About 2 points a call' : 'About a point and a half a call'}, {LEGS[3].max} in all.</>;
  const gameSteps = [
    <><b>Span.</b> The day&rsquo;s Span: join two countries by the shortest chain of land borders. Its score is your stamp, worth up to {LEGS[0].max} points.</>,
    <><b>Flank.</b> The day&rsquo;s Flank: name every land neighbor of one country. The share you name is worth up to {LEGS[1].max} points.</>,
    <><b>Ping.</b> The day&rsquo;s Ping: find a secret city by how far each guess lands from it. Its score is worth up to {LEGS[2].max} points.</>,
  ];
  const rulesSteps = [
    ...ORD.map((i) => (i === 3 ? sizesStep : gameSteps[i])),
    <>Played one of the three on its own page today? Your first result stands and the run steps over it. The board ranks your total, then time.</>,
  ];
  const rulesBody = (
    <DailyRules accent="#1a7f37" accentSoft="#e8f5ec"
      lead={ORD[3] !== 3 && !SIZES_FIRST ? `${ORD.map((i) => (i === 3 ? 'a size round' : LEGS[i].n)).join(', ').replace(/^./, (c) => c.toUpperCase()).replace(/, ([^,]*)$/, ' and $1')}: one points total. Your total decides which passport you travel home on.` : SIZES_FIRST ? 'A size round and three geography games, one points total. Your total decides which passport you travel home on.' : 'Three geography games and one size round, one points total. Your total decides which passport you travel home on.'}
      steps={rulesSteps}
      knack={ORD[3] !== 3 && !SIZES_FIRST ? 'The size pairs are close, so trust what you know about each country over a guess at scale.' : SIZES_FIRST ? 'The size pairs are close, so trust what you know about each country over a guess at scale. Then Ping, Flank and Span, in that order.' : "The sizes leg leans on the countries you just met: the road you walked in Span, Flank's country and its ring, and the country Ping's city is in. The pairs are close, so trust what you know over a guess at scale."}
      footer={`Areas are from the CIA World Factbook, checked against a second table so no call turns on a disputed figure. The passports and their visa-free counts are the ${HENLEY_EDITION}.`} />
  );

  const LI = ORD[Math.min(3, g.round)];
  const sec = started && LI < 3 ? sections[LI] : null;
  const showGame = !!(sec && (g.sc[LI] == null || holding === sec.key) && !banked[sec.key] && !checking);
  const Game = sec ? CLIENTS[sec.key] : null;

  // THE STAGE (owner, 2026-10-25): the entry, the handover, the play page and
  // the ending in the Gauntlet run's style. The legs in PLAY order, each on
  // its ladder step (slot = step), as the gate, the handover strip, the play
  // frame and the end table all read them.
  const stageSecs = ORD.map((li, step) => ({ key: LEGS[li].k, name: LEGS[li].n, slot: step, questions: [], li }));
  const dateShort = (PUZZLE.dateLabel || '').replace(/, \d{4}$/, '');
  const dateLine = PUZZLE.sunday ? `Sunday Edition · ${dateShort}` : dateShort;

  // The handover between legs: the leg just stamped, the next leg large, and
  // an automatic start with Hold (owner, 2026-10-25). It shows once a leg has
  // its points and its finished board has had its beat; the last leg goes
  // straight on to the ending.
  const legDone = started && g.sc[LI] != null && g.round < 3;
  const betweenOn = !!(legDone && (LI === 3 ? numShow == null : (!sec || holding !== sec.key)));
  const [held, setHeld] = useState(false);
  const [resumes, setResumes] = useState(0);
  useEffect(() => { setHeld(false); }, [g.round]);
  useEffect(() => {
    if (!betweenOn || held) return undefined;
    const t = setTimeout(() => advance(), BETWEEN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betweenOn, held, resumes, g.round]);

  const [look] = useGauntletLook();
  const darkLook = isDarkLook(look);


  // THE SIZES LEG ON THE STAGE (owner, 2026-10-26): the gauntlet's own shape.
  // The question, the known country's figure, two answers side by side; the
  // right answer fills in ink and carries the other country's figure.
  const sizesLeg = () => {
    const doneR = sc[3] != null;
    const i = Math.min(g.sz.i, NC - 1);
    const c = calls[i] || {};
    const shown = numShow === i || doneR;
    const pop = c.m === 'pop';
    const aV = valA(c), bV = valB(c);
    const more = bV > aV;
    const right = g.sz.res.filter(Boolean).length;
    const ok = g.sz.res[i];
    return (
      <LegShell embed game="passport">
        <div className="lg-kick">Sizes · {doneR ? `${NC} calls` : `Call ${i + 1} of ${NC}`} · {pop ? 'By population' : 'By area'}{SRC_NAME[c.src] ? ` · From ${SRC_NAME[c.src]}` : ''}</div>
        <h2 className="lg-q" key={`q${i}`}>{pop ? <>Does {c.bName} have more or fewer people than {c.aName}?</> : <>Is {c.bName} bigger or smaller than {c.aName} by area?</>}</h2>
        <div className="lg-known"><b>{c.aName}</b><span>{fmtSize(aV, pop)}</span></div>
        <div className="lg-pair">
          {[true, false].map((big) => {
            const truth = shown && big === more;
            return (
              <button key={big ? 'b' : 's'} type="button" className={`lg-ans${truth ? ' ok' : ''}${shown && !truth ? ' dim' : ''}`}
                disabled={doneR || numShow != null} onClick={() => callSize(big)}>
                {big ? (pop ? 'More' : 'Bigger') : (pop ? 'Fewer' : 'Smaller')}
                {truth ? <em>{c.bName} {fmtSize(bV, pop)}</em> : null}
              </button>
            );
          })}
        </div>
        <div className="lg-say" role="status" aria-live="polite">
          {doneR
            ? `${right} of ${NC} called right. Areas and populations from the CIA World Factbook.`
            : (numShow === i ? `${ok ? 'Right.' : 'Not this time.'} ${pop ? `${c.bName} has ${more ? 'more' : 'fewer'} people, by ${fmtSize(Math.abs(bV - aV), true)}.` : `${c.bName} is ${more ? 'bigger' : 'smaller'}, by ${fmtSize(Math.abs(bV - aV), false)}.`}` : '')}
        </div>
        <div className="lg-dots" aria-label={`${g.sz.res.length} of ${NC} called, ${right} right`}>
          {calls.map((_, k) => <i key={k} className={g.sz.res[k] === true ? 'ok' : g.sz.res[k] === false ? 'ko' : (k === g.sz.i && !doneR ? 'cur' : '')} />)}
        </div>
      </LegShell>
    );
  };

  // ── THE ENDING ─────────────────────────────────────────────────────────
  const k = tierIndex(total);
  const tier = TIERS[k];
  const data = cboard && cboard.data;
  const me = data ? (data.me || data.meProvisional || null) : null;
  const field = data && Array.isArray(data.overall) ? (data.overallField || data.uniquePlayers || data.overall.length) : null;
  const runSecs = g.t0 && g.tEnd ? Math.round((g.tEnd - g.t0) / 1000) : null;
  // The ladder is lib/passport.js TIERS, bottom to top: each passport its own
  // rung, its cover colour on the chip.
  const ladder = TIERS.map((t, i) => ({ min: t.min, name: t.name, short: t.short, vf: t.vf, line: t.line, colour: rampFor(i), chip: t.cv }));
  const endBoard = (() => {
    const rows = data && Array.isArray(data.overall) ? data.overall.filter((x) => Number.isFinite(Number(x.total))) : [];
    const isMe = (row) => !!(me && row && me.userKey && row.userKey === me.userKey);
    const out = rows.slice(0, 3).map((row, i) => ({ rank: row.rank || i + 1, name: row.username || 'Guest', score: isMe(row) ? total : Math.round(Number(row.total) || 0), me: isMe(row) }));
    if (me && !out.some((x) => x.me)) {
      if (Number.isFinite(Number(me.rank)) && me.rank > 4) out.push({ gap: true });
      out.push({ rank: Number.isFinite(Number(me.rank)) ? me.rank : '–', name: 'You', score: total, me: true });
    }
    return out.length ? { rows: out, field, href: `${PATH}/leaderboard` } : null;
  })();
  const sf = data && data.stageField;
  const legAvg = stageAvg(sf, stageSecs.map((s) => ({ key: s.key })));
  const fmtF = (a) => (a == null ? '–' : (a < 10 ? Number(a).toFixed(1) : Math.round(a)));
  const rowsIn = stageSecs.map((s, step) => {
    const best = sf && sf.games && sf.games[s.key] && sf.games[s.key].best != null ? sf.games[s.key].best : null;
    return { key: s.key, name: s.name, bg: rampFor(step), you: sc[s.li] == null ? '–' : sc[s.li], field: legAvg && legAvg[s.key] != null ? fmtF(Number(legAvg[s.key])) : '–', best: best != null ? best : '–' };
  });
  const topRow = data && Array.isArray(data.overall) && data.overall[0];
  const leaderScore = topRow && Number.isFinite(Number(topRow.total)) ? Math.round(Number(topRow.total)) : null;
  const [similar, setSimilar] = useState(null);
  useEffect(() => {
    if (!done) return;
    const id = otherRuns('passport').map((x) => x.key).find((x) => x !== 'triviaencore' && !runDoneToday(x));
    setSimilar(id && RUN_DOORS[id] ? { name: RUN_DOORS[id].name, href: RUN_DOORS[id].href } : null);
  }, [done]);

  const doneNames = sections.filter((s) => banked[s.key]).map((s) => s.name);

  return (
    <div className="pr-root" style={{ fontFamily: SANS }}>
      <style dangerouslySetInnerHTML={{ __html: PP_CSS + RUN_CSS }} />
      {!hydrated ? <GauntletCover sections={stageSecs} /> : null}

      {/* 1. ENTRY */}
      {hydrated && preStart ? (
        <GauntletGate
          circuitName="Passport"
          dateLabel={dateLine}
          sections={stageSecs}
          lineFor={(s) => SHORT[s.key]}
          bandNote={(s) => (banked[s.key] ? 'Done' : `${LEGS[s.li].max} pts`)}
          headline={<>Four Legs.<br />One Passport.</>}
          rule="One points total decides the passport you travel home on."
          lineup={null}
          unit="legs"
          startLabel={`Board Now: Start With ${stageSecs[0] ? stageSecs[0].name : 'Ping'}`}
          fieldLine={doneNames.length ? `Already played today: ${doneNames.join(', ')}. Your first ${doneNames.length === 1 ? 'result stands' : 'results stand'}.` : null}
          banner={<ChallengeStrip gameKey="passport" num={PUZZLE.num} />}
          centerpiece={<Booklet num={PUZZLE.num} legs={stageSecs.map((s) => ({ n: s.name, max: LEGS[s.li].max }))} onOpen={start} />}
          onStart={start}
        />
      ) : null}

      {/* 3. PLAY */}
      {hydrated && started && !betweenOn ? (
        <RunPlayFrame sections={stageSecs} idx={Math.min(3, g.round)} title="Passport"
          sub={`Leg ${Math.min(4, g.round + 1)} of 4 · ${LEGS[LI].n}`}
          foot={<>{total} point{total === 1 ? '' : 's'} so far · {elapsed} · <button type="button" className="pr-rules" onClick={() => setShowHelp(true)}>Rules</button></>}>
          <div className="pr-play">
            {sec && showGame && Game ? (
              <div className="pr-host">
                <RunEmbed onResult={onSectionDone} theme={darkLook ? 'dark' : 'light'} autostart>
                  {sec.key === 'flank'
                    ? <Game key={`flank-${sec.num}`} puzzles={[sec.light]} dayByNum={{ [sec.num]: sec.day }} forceNum={null} />
                    : <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />}
                </RunEmbed>
              </div>
            ) : null}
            {sec && holding === sec.key ? (
              <button type="button" className="pr-next" onClick={() => setHolding(null)}>Continue to the next leg</button>
            ) : null}
            {sec && checking && g.sc[LI] == null ? <p className="pr-note">Checking whether you already played {sec.name} today.</p> : null}
            {LI === 3 ? sizesLeg() : null}
            {g.round === 3 && g.sc[LI] != null && !(sec && showGame) ? <p className="pr-note">Landing your passport&hellip;</p> : null}
          </div>
        </RunPlayFrame>
      ) : null}

      {/* 2. BETWEEN */}
      {hydrated && betweenOn ? (() => {
        const i = LI;
        const l = LEGS[i];
        const key = l.k;
        const r = key === 'passport' ? null : (g.res[key] || banked[key] || {});
        const wasBanked = key !== 'passport' && !!banked[key];
        const nx = stageSecs[g.round + 1];
        const nl = LEGS[nx.li];
        const right = g.sz.res.filter(Boolean).length;
        return (
          <GauntletBetween
            circuitName="Passport"
            sections={stageSecs}
            lastSec={stageSecs[g.round]}
            upNext={nx}
            upIdx={g.round + 1}
            stepWord="Leg"
            doneCount={g.round + 1}
            lastBody={(
              <>
                <b>{key === 'passport' ? `Sizes: ${right} of ${NC} called right` : (r.unknown ? `${l.n}: result on file` : `${l.n}: ${scoreText(key, r.score, r.total)}`)}</b>
                {key === 'ping' && sections[i] && sections[i].puzzle && sections[i].puzzle.city ? <span>The city was {sections[i].puzzle.city}{sections[i].puzzle.country ? `, ${sections[i].puzzle.country}` : ''}.</span> : null}
                <span>{wasBanked ? 'Played earlier today, so that first result stands. ' : ''}Worth {sc[i]} point{sc[i] === 1 ? '' : 's'} here.</span>
                <span>Run total: {total} point{total === 1 ? '' : 's'}</span>
              </>
            )}
            lastFig={{ v: sc[i], unit: sc[i] === 1 ? 'point' : 'points' }}
            nextLine={nx.key === 'passport' && OPEN_SIZES ? 'Nine close pairs of countries, bigger or smaller by area or by population.' : nl.line}
            dwellMs={BETWEEN_MS}
            held={held}
            resetKey={`${g.round}:${resumes}`}
            onGo={() => { setHeld(false); advance(); }}
            onHold={() => { if (held) setResumes((x) => x + 1); setHeld(!held); }}
            leaveHref="/circuits/passport"
          />
        );
      })() : null}

      {/* 4. END */}
      {hydrated && done ? (
        <GauntletEndStage
          circuitName="Passport"
          dateLabel={dateLine}
          sections={stageSecs}
          score={total}
          unitWord="points"
          title={{ name: tier.name, line: tier.line, colour: rampFor(k) }}
          ladder={ladder}
          ladderHeading="Which passport takes you home?"
          rank={me && Number.isFinite(Number(me.rank)) ? me.rank : null}
          fieldSize={field}
          board={endBoard}
          rowsIn={rowsIn}
          avg={legAvg}
          colLabel="Leg"
          finale={doneAtLoad.current === false ? { key: 'passport', legWord: 'Leg', legMax: stageSecs.map((s) => (LEGS[s.li] && LEGS[s.li].max) || null) } : null}
          leaderScore={leaderScore}
          topNote={!isTodays ? `${PUZZLE.dateLabel} archive` : null}
          challenge={<>
            <RunChallengeLine gameKey="passport" score={total} n={PUZZLE.num} style={{ margin: 0 }} />
            <RunChallengeButton gameKey="passport" score={total} total={50} n={PUZZLE.num} archive={!isTodays} t={runSecs} status={tier.name || ''} door />
          </>}
          meme={isTodays ? <RunMeme gameKey="passport" score={total} total={50} n={PUZZLE.num} t={runSecs} status={tier.name || ''} cat="Geography" /> : null}
          similar={similar}
          more={<MoreRunsList self="passport" ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
          onShare={copyShare}
          copied={copied}
        />
      ) : null}

      <MoreRunsPop self="passport" ready={nudgeReady} delay={10000} fireOnLeave />
      <GauntletMorePop circuitId="passport" ready={hydrated && done} />

      {showHelp && (
        <HelpSheet onClose={() => setShowHelp(false)} self="passport" name="Passport">
            {rulesBody}
          </HelpSheet>
      )}

      {/* The about prose stays in the page for readers and search, under the entry. */}
      <section className="pr-about" style={{ display: started ? 'none' : 'block' }}>
        <h2>About Passport</h2>
        <p>
          {ORD[0] === 2 ? <>Passport is a free daily geography run from Mind Loft: the day&rsquo;s Ping, then nine bigger-or-smaller calls on area or population, worth {LEGS[3].max}, on pairs of countries close in size, then the day&rsquo;s Flank and Span, each game worth {LEGS[0].max}. One points total.</> : SIZES_FIRST ? <>Passport is a free daily geography run from Mind Loft: nine bigger-or-smaller calls on area or population, worth {LEGS[3].max}, on pairs of countries close in size, then the day&rsquo;s Ping, Flank and Span played back to back, each worth {LEGS[0].max}. One points total.</> : <>Passport is a free daily geography run from Mind Loft: the day&rsquo;s Span, Flank and Ping played back to back, each worth {LEGS[0].max}, then nine bigger-or-smaller calls on area or population, worth {LEGS[3].max}, on countries from those three games set against others close to them in size. One points total.</>}
        </p>
        <p>
          Your total decides the passport you travel home on, from the Sierra Leonean passport up to the Japanese, ranked by the visa-free destinations each opens in the {HENLEY_EDITION}. Everyone plays the same boards, and the leaderboard ranks your total, then time. A new run boards every day at midnight Eastern.
        </p>
      </section>
    </div>
  );
}

// THE ENTRY'S CENTERPIECE (owner-approved mockup, 2026-10-25): a small
// passport booklet whose cover swings open onto the day's four leg stamps.
// It is the start button too, like the Dojo's doors.
function Booklet({ num, legs, onOpen }) {
  return (
    <button type="button" className="ppb" onClick={onOpen} aria-label="Open the passport and start the run">
      <span className="ppb-book">
        <span className="ppb-page ppb-r">
          {legs.map((l, i) => (
            <span key={l.n} className="ppb-st" style={{ '--ink': INKS_DEEP[i % 4], '--rot': `${[-6, 5, -3, 7][i % 4]}deg`, animationDelay: `${1.25 + i * 0.16}s` }}>
              <i>{l.n}</i><b>{l.max}</b>
            </span>
          ))}
        </span>
        <span className="ppb-cover">
          <span className="ppb-front">
            <span className="ppb-t1">Mind Loft</span>
            <svg viewBox="0 0 84 84" width="34" height="34" aria-hidden="true"><circle cx="42" cy="42" r="30" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="42" cy="42" r="23" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M42 27l4.2 9 9.8 1-7.4 6.6 2.2 9.6L42 48l-8.8 5.2 2.2-9.6-7.4-6.6 9.8-1z" fill="currentColor" /></svg>
            <span className="ppb-t2">Passport</span>
          </span>
          <span className="ppb-back">
            <span className="ppb-k">Passport No.</span>
            <span className="ppb-no">{num}</span>
            <span className="ppb-k">Four legs</span>
            <span className="ppb-k">50 points</span>
          </span>
        </span>
      </span>
    </button>
  );
}

const RUN_CSS = `
.pr-play{display:flex;flex-direction:column;gap:6px;padding:0 0 8px}
.pr-host{animation:prrise .45s ease both}
.pr-play .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.gsx-play .pr-host .stg-board{margin-left:0 !important;margin-right:0 !important}
.pr-next{display:block;width:calc(100% - 32px);max-width:568px;margin:6px auto 0;min-height:52px;border-radius:14px;border:0;background:var(--gsx-ink,#08222e);color:var(--gsx-bg,#ffffff);font:800 16px Manrope,system-ui,sans-serif;cursor:pointer}
.pr-note{max-width:520px;margin:10px auto;text-align:center;font-size:14px;font-weight:700;opacity:.8;padding:0 16px}
.pr-rules{background:none;border:0;padding:0;font:inherit;font-weight:800;color:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.pr-back{margin-top:14px;width:100%;min-height:48px;border-radius:14px;border:0;background:#08222e;color:#ffffff;font:800 16px Manrope,system-ui,sans-serif;cursor:pointer}
.pr-about{position:relative;z-index:1;max-width:620px;margin:0 auto;padding:10px 24px 42px}
.pr-about h2{margin:0 0 8px;font-size:15px;font-weight:800}
.pr-about p{margin:0 0 8px;font-size:13px;line-height:1.65;font-weight:600}

.ppb{border-radius:0;flex:1;display:flex;align-items:center;justify-content:center;width:100%;min-height:150px;padding:0;border:0;background:none;cursor:pointer;font-family:Manrope,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.ppb:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:4px;border-radius:12px}
.ppb-book{position:relative;display:block;width:min(272px,72vw);height:min(172px,45vw);perspective:900px;box-sizing:border-box;animation:ppbSlide 1s cubic-bezier(.5,0,.2,1) .55s both}
.ppb-page{position:absolute;top:0;bottom:0;width:50%;box-sizing:border-box;background:var(--gsx-card-paper,#ffffff);border:2px solid var(--gsx-ink,#08222e)}
.ppb-r{right:0;border-radius:3px 14px 14px 3px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:5px;padding:9px 8px}
.ppb-st{--stc:color-mix(in srgb,var(--ink) 60%,var(--gsx-card-ink,#08222e));display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid var(--stc);color:var(--stc);border-radius:7px;transform:rotate(var(--rot));line-height:1;text-transform:uppercase;animation:ppbStamp .4s cubic-bezier(.2,1.4,.3,1) both}
.ppb-st i{font-style:normal;font-size:9px;font-weight:800;letter-spacing:.06em}
.ppb-st b{font-size:17px;font-weight:800;margin-top:2px}
.ppb-cover{position:absolute;top:0;bottom:0;left:50%;width:50%;transform-origin:left center;transform-style:preserve-3d;animation:ppbOpen 1s cubic-bezier(.5,0,.2,1) .55s both}
.ppb-front,.ppb-back{position:absolute;inset:0;box-sizing:border-box;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
.ppb-front{background:var(--gsx-ink,#08222e);color:var(--gsx-bg,#b1e5fd);border-radius:3px 14px 14px 3px;padding:12px 8px 10px;border:2px solid var(--gsx-ink,#08222e)}
.ppb-t1{font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.ppb-t2{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.ppb-back{transform:rotateY(180deg);background:var(--gsx-card-paper,#ffffff);color:var(--gsx-card-ink,#08222e);border:2px solid var(--gsx-ink,#08222e);border-radius:14px 3px 3px 14px;padding:16px 8px;justify-content:center;gap:4px}
.ppb-k{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.ppb-no{font-size:30px;font-weight:800;line-height:1;margin-bottom:8px}
@keyframes ppbOpen{from{transform:rotateY(0)}to{transform:rotateY(-180deg)}}
@keyframes ppbSlide{from{transform:translateX(-25%)}to{transform:none}}
@keyframes ppbStamp{from{opacity:0;transform:rotate(var(--rot)) scale(1.6)}to{opacity:1;transform:rotate(var(--rot)) scale(1)}}
@media(min-width:900px){
  .ppb-book{width:300px;height:190px}
  .ppb-st i{font-size:10px}.ppb-st b{font-size:19px}
  .ppb-no{font-size:38px}
}
/* THE BOOKLET FITS ITS SLOT (owner report, 2026-10-27: the passport on the
   run's entry was cut off). The start screen gives a centerpiece a fixed
   140px (170px from 900px) window with overflow hidden, and the book was 172px
   to 190px tall, so its top and bottom were clipped. Inside that window the
   book now sizes itself from the window's height at the passport's own
   proportions, with room to spare for the stamp and the slide. */
.gsx-piece .ppb{min-height:0;height:100%}
.gsx-piece .ppb-book{height:calc(100% - 18px);width:auto;aspect-ratio:300/190;max-width:calc(100% - 24px)}
.gsx-piece .ppb-st i{font-size:8px}
.gsx-piece .ppb-st b{font-size:14px}
.gsx-piece .ppb-no{font-size:24px;margin-bottom:4px}
.gsx-piece .ppb-back{padding:10px 6px}
.gsx-piece .ppb-front{padding:9px 6px 8px}
.gsx-piece .ppb-front svg{width:26px;height:26px}
@media(min-width:900px){
  .gsx-piece .ppb-st i{font-size:9px}
  .gsx-piece .ppb-st b{font-size:16px}
  .gsx-piece .ppb-no{font-size:30px}
}
@keyframes prrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.pr-host,.ppb-book,.ppb-cover,.ppb-st{animation:none !important}.ppb-cover{transform:rotateY(-180deg)}}
`;
