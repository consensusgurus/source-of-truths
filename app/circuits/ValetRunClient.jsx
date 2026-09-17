'use client';

// THE VALET RUN — the jam ladder played as ONE SITTING on ONE CLOCK.
//
// Parker (6x6), Impound (7x7) and Junkyard (8x8) are the same game at three
// sizes, and the Valet Gauntlet deals them back to back: you park the red car
// out of one lot, the car drives off, the next lot is dealt, and the thing you
// are racing is the CLOCK across all three. Moves do not count here. Each lot
// still grades its own board on moves against par, exactly as it does on its
// own page; this run just does not care about them.
//
// WHAT THIS IS NOT: a new game, and not a new scoring path. It files exactly
// the rows the three solo clients file, one ordinary /api/quiz/result per
// lot, with that lot's own quizId, its par-graded score, its move count and
// its own clock. So every per-game board, best-N, IQ Points, the crown and the
// trophies see a player who played those three games, because they did. The
// circuit's own board (/api/quiz/daily-combined?circuit=valet) is what ranks
// on the combined clock, by rankByTime in lib/daily-combined, and only a run
// that parked all three takes a rank on it.
//
// THE SECTION CLOCK IS PER LOT, from the moment the lot is dealt to the move
// that parks the car. The handover between lots is NOT on the clock: it is a
// picture and a button, and a player who reads it slowly loses nothing. The
// run's total is the sum of the three section clocks, which is the figure the
// circuit board ranks, and it is posted nowhere as a figure of its own.
//
// A LOT ALREADY PLAYED TODAY IS BANKED, NOT REPLAYED, as the trivia run banks a
// quiz: its clock is read off that game's own save (tEnd - t0) and the run
// steps over it. The pop-up that offers this run only fires for a player who
// has started none of the three, so on the intended path nothing is banked.
//
// EVERY LOCAL WRITE THE SOLO CLIENT MAKES IS MADE HERE TOO, in finishSection:
// the per-puzzle save in the solo client's own shape (so /parker opened
// afterwards restores the finished board), the day breadcrumb, the write-once
// stats record and the abandon-dedupe key. Miss one and the slate disagrees
// with the server about a game it holds a row for.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Pause, Play, Home, Share2, Check, RotateCcw, Eye } from 'lucide-react';
import useAbandonFlush from '../quiz/[id]/useAbandonFlush';
import JoinLeaderboardForm from '../quiz/[id]/JoinLeaderboardForm';
import { savedIdentity } from '@/lib/saved-identity';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../ShareCreditPop';
import { runSummaryHref, circuitShareUrl, circuitShareResult, circuitPageHref } from '@/lib/circuits';
import { parFor, scoreFor } from '@/lib/par';
import { gameColor, gameColorLight, gameOnrampLight, gameAccentInkLight } from '@/lib/category-ramp';
import { fromData, solved as jamSolved } from '@/lib/jam-core';
import JamBoard, { blockTones, apply } from './JamBoard';
import ValetScene from './ValetScene';
import useCircuitBoard from './useCircuitBoard';
import { T } from '@/lib/theme';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

// How long the handover holds before the next lot deals itself. Long enough to
// read the verdict and watch the car leave; Continue skips it, Hold stops it.
const VERDICT_MS = 9000;
const ARM_MIN_MS = 400;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function ord(n) {
  const v = Number(n) || 0;
  const t = v % 100;
  if (t >= 11 && t <= 13) return `${v}th`;
  const suf = ['th', 'st', 'nd', 'rd'][v % 10] || 'th';
  return `${v}${suf}`;
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
function readJson(k) {
  try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; }
}
function writeJson(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
}
// The write-once local stats record each solo client keeps, by its own key.
function recordStatFor(gameKey, num, entry) {
  const K = `sot_${gameKey}_stats`;
  let s = readJson(K);
  if (!s || s.v !== 1 || !s.rec) s = { v: 1, rec: {} };
  if (s.rec[num]) return s.rec[num];
  writeJson(K, { ...s, rec: { ...s.rec, [num]: entry } });
  return entry;
}
function statFor(gameKey, num) {
  const s = readJson(`sot_${gameKey}_stats`);
  return (s && s.rec && s.rec[num]) || null;
}
// Has this lot already been finished today, outside the run? The per-puzzle
// save is the authority, exactly as it is for the game's own page.
function alreadyDone(gameKey, num) {
  const sv = readJson(`sot_${gameKey}_${num}`);
  return !!(sv && sv.status && sv.status !== 'playing');
}
// What a banked lot scored and how long it took, read off the solo save.
function bankedResult(s) {
  const sv = readJson(`sot_${s.key}_${s.num}`) || {};
  const st = statFor(s.key, s.num);
  const moves = Array.isArray(sv.moves) ? sv.moves.length : (st && Number.isFinite(st.g) ? st.g : 0);
  const won = sv.status === 'won';
  const score = st && Number.isFinite(st.s) ? st.s : (won ? scoreFor(moves, s.perfect) : 0);
  const secs = sv.t0 && sv.tEnd ? Math.max(1, Math.round((sv.tEnd - sv.t0) / 1000)) : 0;
  return { key: s.key, status: 'banked', won, score, moves, secs };
}
function pingView(quizId) {
  try {
    fetch('/api/quiz/view', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    }).catch(() => {});
  } catch (e) {}
}
const HAPT = { ok: [7], wrong: [0, 26, 34, 26], win: [10, 40, 20, 40, 20, 60] };
function vibrate(p) { try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

const freshRun = () => ({ v: 1, si: 0, phase: 'idle', t0: null, sT0: null, moves: [], restarts: 0, results: [] });

export default function ValetRunClient({ circuitId, circuitName, dateLabel, sections = [] }) {
  const N = sections.length;
  const sizes = useMemo(() => sections.map((s) => s.n), [sections]);
  const STORE_KEY = `sot_run_${circuitId}_${etToday()}`;

  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [hold, setHold] = useState(false);
  const holdRef = useRef(false);
  const [identity, setIdentity] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [armReveal, setArmReveal] = useState(false);
  const [guest, setGuest] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  // The finish plays its picture once, when the run ends IN THIS SESSION.
  const [curtain, setCurtain] = useState(false);
  const doneAtLoad = useRef(null);

  useEffect(() => { rRef.current = r; }, [r]);
  useEffect(() => { holdRef.current = hold; }, [hold]);

  const sec = sections[r.si] || null;
  const done = r.phase === 'done';
  const playing = r.phase === 'playing';

  // The starting layout and its fixed tone map, per section.
  const starts = useMemo(() => sections.map((s) => fromData(s.pieces)), [sections]);
  const tones = useMemo(() => starts.map((ps) => blockTones(ps)), [starts]);
  const blocks = useMemo(() => {
    if (!sec) return [];
    let ps = starts[r.si];
    for (const mv of r.moves) ps = apply(ps, mv);
    return ps;
  }, [sec, starts, r.si, r.moves]);

  const boardQ = useCircuitBoard(circuitId, done);
  const boardGate = useCircuitBoard(circuitId, hydrated && !done);

  useEffect(() => {
    if (!hydrated) return;
    if (doneAtLoad.current === null) doneAtLoad.current = done;
    if (done && !doneAtLoad.current) setCurtain(true);
  }, [hydrated, done]);

  // ── hydration ────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = readJson(STORE_KEY);
    if (saved && saved.v === 1 && Array.isArray(saved.results)) {
      const next = { ...freshRun(), ...saved };
      rRef.current = next;
      setR(next);
    } else {
      const banked = [];
      for (const s of sections) {
        if (!alreadyDone(s.key, s.num)) break;
        banked.push(bankedResult(s));
      }
      if (banked.length) {
        const all = banked.length === sections.length;
        const next = { ...freshRun(), si: banked.length, results: banked, phase: all ? 'done' : 'idle' };
        rRef.current = next;
        setR(next);
      }
    }
    try {
      const id = readJson('sot_quiz_identity');
      if (id && id.email) setIdentity(id);
    } catch (e) {}
    if (!savedIdentity().username) setGuest(true);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(STORE_KEY, r);
  }, [r, hydrated, STORE_KEY]);

  // One ticker, only while a lot is on the clock.
  useEffect(() => {
    if (!playing || !r.sT0) return undefined;
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [playing, r.sT0]);

  useEffect(() => {
    if (!armReveal) return undefined;
    const t = setTimeout(() => setArmReveal(false), 3500);
    return () => clearTimeout(t);
  }, [armReveal]);

  function say(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  // ── the abandon row ──────────────────────────────────────────────────────
  const abandon = useAbandonFlush(() => {
    const cur = rRef.current;
    if (cur.phase !== 'playing' || !cur.sT0 || !cur.moves.length) return null;
    const s = sections[cur.si];
    if (!s) return null;
    const REC = `sot_${s.key}_rec_${s.num}`;
    try { if (localStorage.getItem(REC)) return null; } catch (e) {}
    try { localStorage.setItem(REC, '1'); } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - cur.sT0) / 1000)));
    return {
      quizId: s.quizId, score: 0, total: 10, correct: 0, guessesUsed: cur.moves.length,
      timeElapsed: el, abandoned: true,
      email: identity?.email || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  function commit(next) { rRef.current = next; setR(next); }

  function startRun() {
    const cur = rRef.current;
    if (cur.phase !== 'idle') return;
    const t = Date.now();
    commit({ ...cur, t0: cur.t0 || t, sT0: t, phase: 'playing', moves: [], restarts: 0 });
    if (sections[cur.si]) pingView(sections[cur.si].quizId);
    setNow(t);
  }

  // Everything a finished lot owes: the four local writes the solo client
  // makes, in the solo client's own save shape, then the ordinary result post.
  function finishSection(status) {
    const cur = rRef.current;
    const s = sections[cur.si];
    if (!s || cur.phase !== 'playing') return;
    const end = Date.now();
    const secs = Math.min(36000, Math.max(1, Math.round((end - (cur.sT0 || end)) / 1000)));
    const won = status === 'won';
    const moves = cur.moves.length;
    const score = won ? scoreFor(moves, s.perfect) : 0;

    abandon.markFlushed();
    writeJson(`sot_${s.key}_${s.num}`, { v: 1, moves: cur.moves, restarts: cur.restarts, hintUsed: false, status: won ? 'won' : 'gaveup', t0: cur.sT0 || end, tEnd: end });
    writeJson(`sot_${s.key}_day`, { d: etToday(), done: true });
    try { localStorage.setItem(`sot_${s.key}_rec_${s.num}`, '1'); } catch (e) {}
    try { recordStatFor(s.key, s.num, { s: score, t: 10, g: moves, won: won && moves === s.perfect }); } catch (e) {}
    try {
      fetch('/api/quiz/result', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: s.quizId, score, total: 10, correct: won ? 1 : 0,
          guessesUsed: moves, timeElapsed: secs,
          email: identity?.email || undefined, anonId: getAnonId(),
          isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
        }),
      }).catch(() => {});
    } catch (e) {}

    vibrate(won ? HAPT.win : HAPT.wrong);
    commit({
      ...cur, phase: 'verdict',
      results: [...cur.results, { key: s.key, status, won, score, moves, secs }],
    });
    setHold(false);
  }

  function nextSection() {
    const cur = rRef.current;
    let j = cur.si + 1;
    const banked = [];
    while (j < N && alreadyDone(sections[j].key, sections[j].num)) {
      banked.push(bankedResult(sections[j]));
      j += 1;
    }
    const results = banked.length ? [...cur.results, ...banked] : cur.results;
    if (j >= N) { commit({ ...cur, si: N, phase: 'done', results, moves: [] }); return; }
    const t = Date.now();
    commit({ ...cur, si: j, sT0: t, phase: 'playing', moves: [], restarts: 0, results });
    pingView(sections[j].quizId);
    setNow(t);
  }

  useEffect(() => {
    if (r.phase !== 'verdict' || hold) return undefined;
    const t = setTimeout(() => { if (!holdRef.current) nextSection(); }, VERDICT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.phase, r.si, hold]);

  function onMove(mv) {
    const cur = rRef.current;
    if (cur.phase !== 'playing') return;
    const s = sections[cur.si];
    const nextMoves = [...cur.moves, mv];
    let ps = starts[cur.si];
    for (const m of nextMoves) ps = apply(ps, m);
    if (jamSolved(ps, s.n)) {
      commit({ ...cur, moves: nextMoves });
      // finishSection reads rRef, which commit just set.
      finishSection('won');
      return;
    }
    vibrate(HAPT.ok);
    commit({ ...cur, moves: nextMoves });
  }

  function restart() {
    const cur = rRef.current;
    if (cur.phase !== 'playing' || !cur.moves.length) return;
    commit({ ...cur, moves: [], restarts: cur.restarts + 1 });
    say('Back to the start. The clock keeps running.');
  }

  function giveUp() {
    if (rRef.current.phase !== 'playing') return;
    finishSection('gaveup');
  }

  // ── figures ──────────────────────────────────────────────────────────────
  const runSecs = r.results.reduce((a, x) => a + (x.secs || 0), 0);
  const parked = r.results.filter((x) => x.won).length;
  const lotMs = playing && r.sT0 ? now - r.sT0 : 0;
  const liveRunMs = runSecs * 1000 + lotMs;
  const last = r.results.length ? r.results[r.results.length - 1] : null;
  const lastSec = last ? sections.find((s) => s.key === last.key) : null;
  const upNext = (() => {
    if (!hydrated) return null;
    let j = r.si + 1;
    while (j < N && alreadyDone(sections[j].key, sections[j].num)) j += 1;
    return j < N ? sections[j] : null;
  })();

  const boardNow = boardQ.data || boardGate.data || null;
  const boardRows = boardNow && Array.isArray(boardNow.overall) ? boardNow.overall : [];
  const leaderRow = boardRows.length ? boardRows[0] : null;
  const myRow = boardNow ? (boardNow.me || boardNow.meProvisional || null) : null;
  const fieldToday = Math.max((boardNow && boardNow.overallField) || 0, boardRows.length);
  const partial = (boardNow && boardNow.partial) || 0;

  function shareRun() {
    const url = withRef(circuitShareUrl(circuitId));
    const me = boardQ.data && boardQ.data.me;
    const text = circuitShareResult(circuitId, {
      points: parked,
      maxTotal: N,
      secs: runSecs,
      rank: me && Number.isFinite(me.rank) ? me.rank : null,
      field: (boardQ.data && boardQ.data.overallField) || 0,
      done: r.results.length,
      total: N,
    }, url);
    if (notifyShareCredit(text, `https://${circuitShareUrl(circuitId)}`)) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share && isMobileDevice()) {
        navigator.share({ text }).catch(() => {});
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }).catch(() => {});
    } catch (e) {}
  }

  const capFigures = (() => {
    if (playing && sec) return [
      { v: fmtTime(lotMs), k: 'this lot' },
      { v: fmtTime(liveRunMs), k: 'run clock' },
      { v: `${r.si + 1}/${N}`, k: 'lot' },
    ];
    if (done) return [];
    if (r.phase === 'verdict') return [
      { v: fmtTime(runSecs * 1000), k: 'run clock' },
      { v: `${r.results.length}/${N}`, k: 'lots done' },
    ];
    return [
      { v: `${N}`, k: 'lots' },
      { v: sections.map((s) => s.n).join('·'), k: 'sizes' },
      { v: '1', k: 'clock' },
    ];
  })();

  const STAGE_ACC = {
    '--stg-acc-dk': gameColor('park'), '--stg-acc-lt': gameColorLight('park'),
    '--stg-onramp-lt': gameOnrampLight('park'), '--stg-acc-ink-lt': gameAccentInkLight('park'),
  };

  const verdictLine = (x, s) => {
    if (!x || !s) return '';
    const par = parFor(s.perfect);
    if (!x.won) return `Left parked. Par here was ${par}.`;
    if (x.moves === s.perfect) return `Out in ${x.moves}. That is perfect.`;
    return `Out in ${x.moves} moves. Par was ${par}.`;
  };

  return (
    <div className="stage-page vr" style={{ ...STAGE_ACC, minHeight: '100vh', background: T.ground, position: 'relative', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* THE ONLY CHROME, as on the trivia run: what you are in, the date,
          the live figures, and the way out. */}
      <div className="vr-cap">
        <div className="vr-cid">
          <i>{done ? (parked === N ? 'All three parked' : 'Run complete') : `Logic · ${dateLabel}`}</i>
          <b>{circuitName}</b>
        </div>
        {capFigures.length ? (
          <div className="vr-cf">
            {capFigures.map((f) => (
              <div key={f.k}><b>{f.v}</b><i>{f.k}</i></div>
            ))}
          </div>
        ) : null}
        <a className="vr-cx" href={circuitPageHref(circuitId)}>Board</a>
        <a className="vr-cx vr-cxi" href="/" aria-label="Home" title="Home">
          <Home size={13} strokeWidth={2.4} />
        </a>
      </div>
      <div className="vr-pips" aria-hidden="true">
        {sections.map((s, i) => {
          const res = r.results.find((x) => x.key === s.key);
          const cls = res ? (res.won ? 'won' : 'out') : (playing && i === r.si ? 'now' : '');
          return <span key={s.key} className={`vr-pip ${cls}`} style={{ '--w': s.n }} />;
        })}
      </div>

      {/* THE STRIP: today's fastest, and where you sit. On the gate and the
          handover only, never over a live board. */}
      {hydrated && !done && !playing && leaderRow ? (
        <div className="vr-strip">
          <span className="vr-se">Today</span>
          <b className="vr-sn">{leaderRow.username || 'Guest'}</b>
          <span className="vr-sf">{fmtTime((leaderRow.timeTotal || 0) * 1000)}</span>
          <span className="vr-sd">&middot; {fieldToday} {fieldToday === 1 ? 'player' : 'players'}</span>
          <span className="vr-sy">{myRow && myRow.rank ? `You ${ord(myRow.rank)}` : 'Not run yet'}</span>
        </div>
      ) : null}

      <div className="vr-stage">
        {/* ── THE GATE ── */}
        {hydrated && r.phase === 'idle' ? (
          <div className="vr-gate">
            <ValetScene mode="arrive" sizes={sizes} step={r.results.length} />
            <div className="vr-gh">
              <h1 className="vr-h1">Three lots. One clock.</h1>
              <p className="vr-lead">
                Parker, Impound and Junkyard back to back, the same three boards everyone gets today.
                Park the red car out of each lot and the next one is dealt. The board ranks on your
                combined time across all three, and moves do not count here.
              </p>
            </div>
            <div className="vr-roster">
              {sections.map((s, i) => {
                const res = r.results.find((x) => x.key === s.key);
                return (
                  <div key={s.key} className={`vr-ro${res ? ' bank' : ''}`}>
                    <span className="vr-ron">{i + 1}</span>
                    <span className="vr-rob">
                      <b>{s.name}</b>
                      <i>{s.n} by {s.n} &middot; par {parFor(s.perfect)}{s.sunday ? ' · Sunday Edition' : ''}</i>
                    </span>
                    <span className="vr-rot">{res ? (res.won ? `parked · ${fmtTime(res.secs * 1000)}` : 'left parked') : `${s.pieces.length} blocks`}</span>
                  </div>
                );
              })}
            </div>
            <button type="button" className="vr-go" onClick={startRun}>
              {r.results.length ? 'Continue the run' : 'Start the clock'} <ArrowRight size={18} strokeWidth={2.8} />
            </button>
            <p className="vr-fine">
              Tap a block, then tap where it goes. There is no undo, only a restart that puts the
              lot back while the clock keeps running. Each lot still grades its own leaderboard on
              moves against par; only this board is the clock. Give up on a lot and the run goes on,
              but the board ranks full runs only.
              {partial ? ` ${partial} ${partial === 1 ? 'player is' : 'players are'} part way through today.` : ''}
            </p>
          </div>
        ) : null}

        {/* ── A LOT ── */}
        {playing && sec ? (
          <div className="vr-play">
            <div className="vr-lot">
              <div className="vr-lh">
                <span className="vr-le">Lot {r.si + 1} of {N}</span>
                <b className="vr-ln">{sec.name}</b>
                <span className="vr-lp">{sec.n}&times;{sec.n} &middot; par {parFor(sec.perfect)}</span>
              </div>
              <JamBoard
                n={sec.n} exitRow={sec.exitRow} blocks={blocks} tones={tones[r.si]}
                playing onMove={onMove} onRefuse={say} maxWidth={sec.n >= 8 ? 520 : sec.n >= 7 ? 480 : 430}
              />
              <div className="vr-lf">
                <span className="vr-lm">{r.moves.length} {r.moves.length === 1 ? 'move' : 'moves'}{r.restarts ? ` · ${r.restarts} restart${r.restarts === 1 ? '' : 's'}` : ''}</span>
                <button type="button" className="vr-tool" onClick={restart} disabled={!r.moves.length} style={{ opacity: r.moves.length ? 1 : 0.4 }}>
                  <RotateCcw size={13} /> Restart lot
                </button>
                <button type="button" className={`vr-giveup${armReveal ? ' arm' : ''}`}
                  onClick={() => { if (armReveal) { if (Date.now() - armReveal < ARM_MIN_MS) return; setArmReveal(false); giveUp(); } else { setArmReveal(Date.now()); } }}>
                  <Eye size={13} /> {armReveal ? 'Tap again: leaves this lot parked, no rank today' : 'Give up this lot'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── THE HANDOVER ── */}
        {r.phase === 'verdict' && last ? (
          <div className="vr-hand">
            <ValetScene mode="depart" compact sizes={sizes} step={r.results.length - 1} />
            <div className="vr-hv">
              <span className="vr-he">{lastSec ? lastSec.name : 'Lot'} &middot; {fmtTime((last.secs || 0) * 1000)}</span>
              <b className="vr-hl">{verdictLine(last, lastSec)}</b>
              <span className="vr-hs">Run clock {fmtTime(runSecs * 1000)} &middot; {r.results.length} of {N} lots</span>
            </div>
            {upNext ? (
              <div className="vr-hn">
                <i>Up next</i>
                <b>{upNext.name}</b>
                <span>{upNext.n} by {upNext.n} &middot; par {parFor(upNext.perfect)} &middot; {upNext.pieces.length} blocks</span>
              </div>
            ) : null}
            <div className={`vr-vbar${hold ? ' held' : ''}`} style={{ '--dwell': `${VERDICT_MS}ms` }} key={r.si}><span /></div>
            <div className="vr-hacts">
              <button type="button" className="vr-vb pri vr-vgo" onClick={() => { setHold(false); nextSection(); }}>
                {upNext ? <>Deal <i className="vr-vgn">&middot; {upNext.name}</i></> : 'See the run'} <ArrowRight size={18} strokeWidth={2.8} />
              </button>
              <button type="button" className="vr-vb" onClick={() => setHold((v) => !v)}>
                {hold ? <><Play size={14} strokeWidth={2.8} /> Resume</> : <><Pause size={14} strokeWidth={2.8} /> Hold</>}
              </button>
              <a className="vr-vb" href={circuitPageHref(circuitId)}>Leave the run</a>
            </div>
          </div>
        ) : null}

        {/* ── THE FINISH ── */}
        {done ? (
          <div className={`vr-fin${curtain ? ' in' : ''}`}>
            <ValetScene mode={curtain ? 'park' : 'still'} sizes={sizes} />
            <div className="vr-fhero">
              <div className="vr-fbig">
                {parked === N ? fmtTime(runSecs * 1000) : `${parked}/${N}`}
                <i>{parked === N ? 'all three parked' : 'lots parked'}</i>
              </div>
              <div className="vr-figs">
                {parked !== N ? <div><b>{fmtTime(runSecs * 1000)}</b><i>on the clock</i></div> : null}
                <div><b>{myRow && myRow.rank ? `#${myRow.rank}` : '—'}</b><i>{fieldToday ? `of ${fieldToday} today` : 'today'}</i></div>
                <div><b>{r.results.reduce((a, x) => a + (x.moves || 0), 0)}</b><i>moves, for the record</i></div>
              </div>
            </div>
            <div className="vr-frows">
              {sections.map((s) => {
                const x = r.results.find((y) => y.key === s.key);
                const par = parFor(s.perfect);
                return (
                  <div key={s.key} className={`vr-fr${x && x.won ? ' won' : ''}`}>
                    <span className="vr-frn"><b>{s.name}</b><i>{s.n}&times;{s.n}{x && x.status === 'banked' ? ' · played earlier' : ''}</i></span>
                    <span className="vr-frm">{x ? `${x.moves} mv · par ${par}` : ''}</span>
                    <span className="vr-frt">{x ? (x.won ? fmtTime((x.secs || 0) * 1000) : 'left parked') : '—'}</span>
                  </div>
                );
              })}
            </div>
            {parked !== N ? (
              <p className="vr-fine">A lot left parked keeps a run off the board. The three games still count on their own boards.</p>
            ) : null}

            <div className="vr-board">
              <div className="vr-bh"><span>Today&rsquo;s board</span><s>{boardNow ? `${fieldToday} ${fieldToday === 1 ? 'player' : 'players'}${partial ? ` · ${partial} part way` : ''}` : ''}</s></div>
              {boardRows.length ? boardRows.slice(0, 8).map((row, i) => (
                <div key={row.userKey || i} className={`vr-br${myRow && row.userKey === myRow.userKey ? ' me' : ''}`}>
                  <span className="vr-brk">{row.rank || i + 1}</span>
                  <span className="vr-brn">{row.username || 'Guest'}</span>
                  <span className="vr-brt">{Number(row.total) < N ? `${row.total}/${N} · ` : ''}{fmtTime((row.timeTotal || 0) * 1000)}</span>
                </div>
              )) : (
                <div className="vr-bmsg">{boardQ.state === 'loading' ? 'Reading the board.' : boardQ.state === 'error' ? 'The board could not be read just now. It is on the circuit page.' : 'Nobody has parked all three today yet. Yours would be the first full run.'}</div>
              )}
              {myRow && myRow.rank && !boardRows.slice(0, 8).some((row) => row.userKey === myRow.userKey) ? (
                <div className="vr-br me">
                  <span className="vr-brk">{myRow.rank}</span>
                  <span className="vr-brn">You</span>
                  <span className="vr-brt">{fmtTime((myRow.timeTotal || 0) * 1000)}</span>
                </div>
              ) : null}
            </div>

            {guest && !claimed ? (
              <div className="vr-claim">
                <span className="vr-clabel">Playing as a guest</span>
                <div className="vr-chd">
                  <span className="vr-cnm">Claim a free name to hold your spot</span>
                  {!claimOpen ? (
                    <button type="button" className="vr-cgo" onClick={() => setClaimOpen(true)}>Claim my name</button>
                  ) : null}
                </div>
                <p className="vr-ctg">Ranks count for registered names only. A display name is enough, no password, and every game you have already finished comes with you.</p>
                {claimOpen ? (
                  <div className="vr-cform">
                    <JoinLeaderboardForm heading="Claim your name" hideIcon
                      onJoined={() => { setClaimed(true); try { window.dispatchEvent(new Event('sot:daily-updated')); } catch (e) {} }} />
                  </div>
                ) : null}
              </div>
            ) : null}
            {claimed ? <div className="vr-claimed">You&rsquo;re on the board. Every finish counts under your name now.</div> : null}

            <div className="vr-hacts vr-sacts">
              <button type="button" className="vr-vb pri" onClick={shareRun}>
                {copied ? <Check size={15} strokeWidth={2.8} /> : <Share2 size={15} strokeWidth={2.8} />}
                {copied ? 'Copied' : 'Share the run'}
              </button>
              <a className="vr-vb" href={runSummaryHref(circuitId)}>The full board</a>
              <a className="vr-vb" href="/"><Home size={15} strokeWidth={2.8} />Home</a>
            </div>
          </div>
        ) : null}
      </div>

      {toast ? <div className="vr-toast">{toast}</div> : null}
    </div>
  );
}

const CSS = `
.vr{font-family:${SANS};color:#eef2fa;}
.vr .vr-cap{background:${T.ground};display:flex;align-items:center;gap:16px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.08);}
.vr-cid{min-width:0;flex:1;}
.vr-cid i{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:#66748f;}
.vr-cid b{display:block;font-size:16px;font-weight:800;letter-spacing:-.02em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vr-cf{display:flex;gap:2px;flex:none;}
.vr-cf div{width:84px;text-align:center;}
.vr-cf div b{display:block;font-family:${MONO};font-size:16px;font-weight:500;color:#fff;font-variant-numeric:tabular-nums;}
.vr-cf div i{display:block;font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#66748f;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vr-cx{flex:none;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9aa8c4;border:1px solid rgba(255,255,255,.18);border-radius:7px;padding:7px 10px;text-decoration:none;}
.vr-cx:hover{color:#fff;border-color:rgba(255,255,255,.4);}
.vr-cx.vr-cxi{padding:7px 9px;display:inline-flex;align-items:center;}
.vr-pips{display:flex;gap:4px;height:4px;background:rgba(255,255,255,.06);}
.vr-pip{flex:var(--w,1) 1 0;background:rgba(255,255,255,.08);transition:background .3s;}
.vr-pip.now{background:var(--stg-acc,#bef264);animation:vrpulse 1.4s ease-in-out infinite;}
.vr-pip.won{background:#6ee7b7;}
.vr-pip.out{background:${T.danger};}
@keyframes vrpulse{0%,100%{opacity:1;}50%{opacity:.45;}}
.vr-strip{display:flex;align-items:center;gap:11px;padding:9px 20px;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.07);font-size:13px;}
.vr-se{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:#66748f;}
.vr-sn{color:#fff;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vr-sf{font-family:${MONO};color:#bef264;font-variant-numeric:tabular-nums;}
.vr-sd{color:#66748f;font-weight:700;}
.vr-sy{margin-left:auto;font-weight:800;color:#9aa8c4;white-space:nowrap;}
.vr-stage{max-width:640px;margin:0 auto;padding:22px 20px 80px;}

.vr-gate{animation:vrrise .3s ease-out both;}
.vr-h1{font-size:clamp(26px,5vw,36px);font-weight:800;letter-spacing:-.03em;line-height:1.05;color:#fff;margin:14px 0 8px;}
.vr-lead{font-size:14.5px;line-height:1.55;color:#9aa8c4;font-weight:600;margin:0;}
.vr-roster{margin:20px 0 0;border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;}
.vr-ro{display:flex;align-items:center;gap:14px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.07);}
.vr-ro:first-child{border-top:0;}
.vr-ro.bank{opacity:.6;}
.vr-ron{font-family:${MONO};font-size:12px;color:#66748f;width:16px;}
.vr-rob{flex:1;min-width:0;}
.vr-rob b{display:block;font-size:15px;font-weight:800;color:#fff;}
.vr-rob i{display:block;font-style:normal;font-size:12px;color:#9aa8c4;font-weight:600;margin-top:1px;}
.vr-rot{font-family:${MONO};font-size:11.5px;color:#9aa8c4;white-space:nowrap;}
.vr-go{display:inline-flex;align-items:center;gap:9px;background:var(--stg-acc,#bef264);color:#08222e;border:0;border-radius:11px;padding:15px 22px;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer;margin-top:22px;}
.vr-go:hover{filter:brightness(1.06);}
.vr-fine{font-size:12px;line-height:1.65;font-weight:600;color:#66748f;margin:16px 0 0;}

.vr-play{animation:vrdeal .42s cubic-bezier(.2,.8,.2,1) both;}
.vr-lh{display:flex;align-items:baseline;gap:10px;margin:0 0 12px;flex-wrap:wrap;}
.vr-le{font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:#66748f;}
.vr-ln{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em;}
.vr-lp{font-family:${MONO};font-size:11px;color:#9aa8c4;margin-left:auto;}
.vr-lf{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap;}
.vr-lm{font-family:${MONO};font-size:11.5px;color:#9aa8c4;}
.vr-tool{display:inline-flex;align-items:center;gap:6px;font-family:inherit;font-weight:800;font-size:12.5px;border:1.5px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#eef2fa;border-radius:8px;padding:7px 11px;cursor:pointer;margin-left:auto;}
.vr-giveup{display:inline-flex;align-items:center;gap:5px;background:none;border:0;cursor:pointer;font-family:inherit;font-weight:700;font-size:12px;color:#66748f;text-decoration:underline;text-underline-offset:3px;}
.vr-giveup.arm{color:${T.danger};}

.vr-hand{animation:vrrise .3s ease-out both;}
.vr-hv{margin-top:14px;}
.vr-he{display:block;font-family:${MONO};font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6ee7b7;}
.vr-hl{display:block;font-size:22px;font-weight:800;letter-spacing:-.02em;color:#fff;margin-top:4px;}
.vr-hs{display:block;font-size:13px;color:#9aa8c4;font-weight:600;margin-top:4px;}
.vr-hn{margin-top:18px;padding:14px 16px;border:1px solid rgba(255,255,255,.1);border-radius:12px;}
.vr-hn i{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:#66748f;}
.vr-hn b{display:block;font-size:24px;font-weight:800;color:var(--stg-acc,#bef264);letter-spacing:-.02em;margin-top:2px;}
.vr-hn span{display:block;font-size:12.5px;color:#9aa8c4;font-weight:600;margin-top:2px;}
.vr-vbar{height:3px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;margin:20px 0 14px;}
.vr-vbar span{display:block;height:100%;background:var(--stg-acc,#bef264);width:100%;transform-origin:left;animation:vrdrain var(--dwell,9000ms) linear both;}
.vr-vbar.held span{animation-play-state:paused;}
@keyframes vrdrain{from{transform:scaleX(1);}to{transform:scaleX(0);}}
.vr-hacts{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.vr-vb{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:11px 14px;font-family:inherit;font-weight:800;font-size:13.5px;color:#eef2fa;cursor:pointer;text-decoration:none;}
.vr-vb.pri{background:var(--stg-acc,#bef264);border-color:var(--stg-acc,#bef264);color:#08222e;}
.vr-vb:hover{filter:brightness(1.1);}
.vr-vb.vr-vgo{border-radius:11px;padding:15px 22px;font-size:16px;gap:9px;}
.vr-vgn{font-style:normal;font-weight:700;opacity:.72;}
.vr-sacts{margin-top:22px;}

.vr-fin{animation:vrrise .35s ease-out both;}
.vr-fhero{display:flex;align-items:flex-end;gap:28px;flex-wrap:wrap;margin-top:18px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.09);}
.vr-fbig{font-family:${MONO};font-size:clamp(46px,7vw,64px);font-weight:500;color:#fff;line-height:.86;letter-spacing:-.04em;font-variant-numeric:tabular-nums;}
.vr-fbig i{display:block;font-style:normal;font-family:${SANS};font-size:9.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#66748f;margin-top:10px;}
.vr-figs{display:flex;gap:24px;margin-left:auto;flex-wrap:wrap;}
.vr-figs div b{display:block;font-family:${MONO};font-size:20px;color:#fff;font-weight:500;}
.vr-figs div i{display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#66748f;margin-top:3px;}
.vr-frows{margin-top:6px;}
.vr-fr{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07);}
.vr-frn{flex:1;min-width:0;}
.vr-frn b{display:block;font-size:15px;font-weight:800;color:#fff;}
.vr-frn i{display:block;font-style:normal;font-size:11.5px;color:#66748f;font-weight:600;}
.vr-frm{font-family:${MONO};font-size:11px;color:#9aa8c4;white-space:nowrap;}
.vr-frt{font-family:${MONO};font-size:16px;color:#66748f;min-width:58px;text-align:right;font-variant-numeric:tabular-nums;}
.vr-fr.won .vr-frt{color:#6ee7b7;}
.vr-board{margin-top:22px;border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden;}
.vr-bh{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,.04);font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9aa8c4;}
.vr-bh s{text-decoration:none;color:#66748f;}
.vr-br{display:flex;align-items:center;gap:12px;padding:9px 14px;border-top:1px solid rgba(255,255,255,.07);font-size:13.5px;}
.vr-br.me{background:rgba(190,242,100,.08);}
.vr-brk{font-family:${MONO};color:#66748f;width:22px;}
.vr-brn{flex:1;min-width:0;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vr-br.me .vr-brn{color:var(--stg-acc,#bef264);}
.vr-brt{font-family:${MONO};color:#eef2fa;font-variant-numeric:tabular-nums;}
.vr-bmsg{padding:16px 14px;font-size:13px;color:#9aa8c4;font-weight:600;line-height:1.5;}
.vr-claim{margin:20px 0 0;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px;}
.vr-clabel{display:block;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:#66748f;}
.vr-chd{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:4px;}
.vr-cnm{font-size:15px;font-weight:800;color:#fff;flex:1;min-width:0;}
.vr-cgo{background:var(--stg-acc,#bef264);color:#08222e;border:0;border-radius:9px;padding:10px 14px;font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;}
.vr-ctg{margin:8px 0 0;font-size:12.5px;line-height:1.55;color:#9aa8c4;font-weight:600;}
.vr-cform{margin-top:12px;--join-ink:#eef2fa;--join-mute:#9aa8c4;--join-cta:var(--stg-acc,#bef264);}
.vr-claimed{margin:20px 0 0;border:2px solid rgba(16,185,129,.4);border-radius:12px;padding:12px 16px;font-size:13.5px;font-weight:700;color:#6ee7b7;}
.vr-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#fff;color:#0b0d12;font-family:${SANS};font-weight:800;font-size:13.5px;padding:10px 18px;border-radius:9px;z-index:60;box-shadow:0 6px 18px rgba(0,0,0,.4);max-width:86vw;text-align:center;}
@keyframes vrrise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
@keyframes vrdeal{from{opacity:0;transform:translateX(60px);}to{opacity:1;transform:none;}}
@media(max-width:820px){
  .vr .vr-cap{padding:10px 14px;gap:10px;}
  .vr-cf div{width:64px;}
  .vr-cf div b{font-size:14px;}
  .vr-cx{display:none;}
  .vr-cx.vr-cxi{display:inline-flex;}
  .vr-stage{padding:16px 12px 70px;}
  .vr-strip{padding:8px 12px;font-size:12px;}
  .vr-vb.vr-vgo{width:100%;justify-content:center;padding:16px 18px;font-size:17px;}
  .vr-hacts > .vr-vb:not(.vr-vgo){flex:1 1 0;justify-content:center;}
  .vr-go{width:100%;justify-content:center;}
  .vr-lp{margin-left:0;flex-basis:100%;}
}
@media(prefers-reduced-motion:reduce){
  .vr-gate,.vr-play,.vr-hand,.vr-fin{animation:none;}
  .vr-pip.now{animation:none;}
}
`;
