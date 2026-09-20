'use client';

// THE RUN — a circuit played as ONE LONG QUIZ.
//
// Every game in a runnable circuit is the same shape: a bank of four-choice
// questions in play order, twenty seconds each, one life. Played on their own
// pages that is five games with five start gates, five end cards and four page
// navigations between them. Played here it is one board: you answer, you are
// told in a line when a quiz has ended for you, and the next quiz starts on its
// own. Nothing is skipped and nothing is merged. It is the same five quizzes in
// the same order, with the furniture between them taken out.
//
// WHAT THIS IS NOT: a new game. It files exactly the rows the five clients
// file, one ordinary /api/quiz/result per section, with that section's own
// quizId, score, total, guesses and clock. So every per-game leaderboard, the
// circuit board, IQ Points, trophies, the archive and the slate all see a
// player who played those five games, because they did. There is no run row,
// no run table and no run scoring. The combined placement is computed the way
// it always was, by /api/quiz/daily-combined?circuit=<id>.
//
// THE SECTION CLOCK IS PER SECTION, NOT THE RUN. Each game posts the time from
// its own first question to its own last, so a run player's time is comparable
// with a solo player's on that game's board. The run's total clock is a display
// figure on the scorecard and is posted nowhere.
//
// A GAME ALREADY PLAYED TODAY IS BANKED, NOT REPLAYED. The daily board keeps a
// player's first attempt, so re-serving a game they already finished this
// morning could only produce a row that does not count and a score the board
// ignores. Those sections are marked banked at the start, their recorded score
// is read out of that game's own local stats, and the run steps over them.
//
// EVERY LOCAL WRITE THE SOLO CLIENT MAKES IS MADE HERE TOO, in finishSection:
// the per-puzzle save, the day breadcrumb, the write-once stats record and the
// abandon-dedupe key. Miss any one of them and the slate shows a game as
// unplayed that the server has a row for, which is the failure this file has to
// avoid rather than the one it is likely to notice.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHoverStale } from '@/lib/hover-armed';
import { ArrowRight, Pause, Play, Home, Share2, Check, RotateCcw } from 'lucide-react';
import useAbandonFlush from '../../../quiz/[id]/useAbandonFlush';
import JoinLeaderboardForm from '../../../quiz/[id]/JoinLeaderboardForm';
import { savedIdentity } from '@/lib/saved-identity';
import { isMobileDevice } from '@/lib/is-mobile';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '../../../ShareCreditPop';
import { runSummaryHref, circuitShareUrl, circuitScoreMode, circuitShareResult } from '@/lib/circuits';
import GauntletLadder, { rampFor } from '../../GauntletLadder';
import RunNextUp from '../../RunNextUp';
import TriviaDoorPop from '../../TriviaDoorPop';
import useGauntletField, { FIELD_FLOOR } from '../../useGauntletField';
import useCircuitBoard from '../../useCircuitBoard';
import GauntletFinale from '../../GauntletFinale';
import MissList, { missOf, MISS_CSS } from '../../RunMisses';
import useCircuitHistory from '../../useCircuitHistory';
import { T } from '@/lib/theme';

const SANS = "'Manrope', system-ui, -apple-system, sans-serif";
const MONO = "'DM Mono', ui-monospace, 'SFMono-Regular', monospace";

const Q_SECONDS = 20;        // the same clock all five games run
// HOW LONG THE HANDOVER HOLDS. 4.2s when the card was two lines, 8s once it
// carried the verdict and six figures, and THIRTY from 2026-08-30 (owner), when
// it also began naming the question that ended the quiz and the answer that was
// wanted. That is something to read and think about rather than glance at, and
// the cost of erring long is nil: Next now advances immediately, Hold stops the
// clock, and nobody who wants to move on is made to wait. Erring short cannot
// be undone, because the next quiz has already started. The drain bar reads its
// duration from this same constant (--dwell below) so the bar and the timeout
// cannot drift apart. 22.5s from 2026-09-05 (owner: "cut 25% off of it"), once
// the card slimmed to the missed question, the button and two chips.
const VERDICT_MS = 22500;
const RIGHT_MS = 420;        // the green flash between questions, as in the solo clients

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
// 1st, 2nd, 3rd, 4th... including the teens, which are all -th however they end.
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

// The write-once local stats record each solo client keeps, by that client's
// own key. Write-once per puzzle number is the rule there and the rule here:
// the first completed attempt is what the streak and the board keep.
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

// What a game already played today scored, for a section the run banks rather
// than serves. The stats record is the first answer and the puzzle's own save
// is the fallback: the save is what alreadyDone reads, so anything the run
// treats as played has one, while the stats record can be missing (cleared
// stats, an older client) and a missing one used to read as a score of zero on
// the card. Both are local, so neither exists on a device that has not played.
// WHICH ANSWER ENDED IT, for a game finished on its own page today. The run
// never saw the section, so the per-puzzle save is the only record of the pick,
// and it is the same record the game's own page wrote.
function bankedMiss(gameKey, num) {
  const sv = readJson(`sot_${gameKey}_${num}`);
  if (!sv) return {};
  return { pick: Number.isFinite(sv.pick) ? sv.pick : null, timedOut: !!sv.timedOut };
}

function bankedScore(gameKey, num) {
  const st = statFor(gameKey, num);
  if (st && Number.isFinite(st.s)) return st.s;
  const sv = readJson(`sot_${gameKey}_${num}`);
  return sv && Number.isFinite(sv.i) ? sv.i : 0;
}

// Has this game already been finished today, outside the run? The per-puzzle
// save is the authority, exactly as it is for the game's own page: a status
// other than 'playing' means the day is over for it.
function alreadyDone(gameKey, num) {
  const sv = readJson(`sot_${gameKey}_${num}`);
  return !!(sv && sv.status && sv.status !== 'playing');
}

// A SECTION IS AN ORDINARY PLAY OF THAT GAME, so it owes that game's view as
// well as its result (owner, 2026-08-27). Each solo client posts one view per
// page load; the run posts one per section, when the section actually starts.
// Without it a game's plays figure counts the run and its views does not, and
// the two disagree for no reason a reader could ever work out. A section never
// reached is never viewed, which is the same rule a page load follows.
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

const freshRun = () => ({ v: 1, si: 0, i: 0, t0: null, sT0: null, phase: 'idle', results: [] });

export default function RunClient({ circuitId, circuitName, dateLabel, sections = [] }) {
  const N = sections.length;
  const STORE_KEY = `sot_run_${circuitId}_${etToday()}`;

  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [qStart, setQStart] = useState(null);
  const [lock, setLock] = useState(false);
  // Hover off until the pointer moves again: see lib/hover-armed.js. The key
  // is the section AND the question, since every section restarts at 0.
  const hovStale = useHoverStale(`${r.si}:${r.i}`);
  const [hold, setHold] = useState(false);
  const [resumes, setResumes] = useState(0);
  const [identity, setIdentity] = useState(null);
  const [copied, setCopied] = useState(false);
  // THE RANKINGS PANEL. Shut by default in every phase: it is a thing a player
  // asks for, and the run is the page. `tab` survives a close so reopening
  // lands where they left off.
  const [panel, setPanel] = useState(false);
  const [tab, setTab] = useState('today');
  // THE CURTAIN. The finale plays once, when the run finishes IN THIS
  // SESSION. A player who comes back to a finished run, or who played the
  // seven games on their own pages and lands on the done card, gets the card
  // directly: the sequence is the moment a run ends, not a thing to sit
  // through on the way to a leaderboard you have already seen.
  const [curtain, setCurtain] = useState(false);
  // THE MISS SUMMARY IS ASKED FOR (owner, 2026-08-30). It used to play as the
  // finale's last screen, which made every run sit through seven questions on
  // the way to its scorecard. It is a button on the card now: the player who
  // wants to know what beat them presses it, and the one who does not never
  // sees it.
  const [misses, setMisses] = useState(false);
  const curtainOnce = useRef(false);
  const doneAtLoad = useRef(null);
  const lockRef = useRef(false);
  const holdRef = useRef(false);

  useEffect(() => { rRef.current = r; }, [r]);
  useEffect(() => { lockRef.current = lock; }, [lock]);
  useEffect(() => { holdRef.current = hold; }, [hold]);

  const sec = sections[r.si] || null;
  const question = r.phase === 'playing' && sec && r.i < sec.questions.length ? sec.questions[r.i] : null;
  const done = r.phase === 'done';

  useEffect(() => {
    if (!hydrated) return;
    // The first hydrated render decides whether this page ARRIVED finished.
    if (doneAtLoad.current === null) doneAtLoad.current = done;
    if (done && !doneAtLoad.current && !curtainOnce.current) {
      curtainOnce.current = true;
      setCurtain(true);
    }
  }, [hydrated, done]);

  // THE BOARD IS PART OF THE ENDING, not a page you go to next (owner,
  // 2026-08-28). The card used to close with "See the board", which is a link
  // away at the moment a player most wants to know how that went against
  // everyone else. It is fetched by the same hook /daily-five uses, so the two
  // endings cannot ask the route different questions, and only once the run is
  // over: mid-run it would be a board the player is not on yet.
  const boardQ = useCircuitBoard(circuitId, done);
  // The same board, read once on the gate, for the headline. It stops when the
  // run starts and the call above takes over at the finish.
  // HELD OPEN THROUGH THE RUN (2026-09-02). This used to go inactive the
  // moment the first question came up, and useCircuitBoard's cleanup drops an
  // in-flight response, so a player who pressed Start briskly ran the whole way
  // with no board at all. The hook does not refetch while `active` stays true,
  // so this is the same single request it always was.
  const boardGate = useCircuitBoard(circuitId, hydrated && !done);

  // ── hydration ────────────────────────────────────────────────────────────
  // Restores a run in progress, and on a fresh one marks every game already
  // finished today as banked so the run steps over it rather than serving a
  // second attempt the board would ignore.
  useEffect(() => {
    const saved = readJson(STORE_KEY);
    if (saved && saved.v === 1 && Array.isArray(saved.results)) {
      const next = { ...freshRun(), ...saved };
      rRef.current = next;
      setR(next);
      if (next.phase === 'playing') setQStart(Date.now());
    } else {
      const banked = [];
      for (const s of sections) {
        if (!alreadyDone(s.key, s.num)) break;
        banked.push({
          key: s.key, score: bankedScore(s.key, s.num), total: s.questions.length,
          status: 'banked', secs: 0, ...bankedMiss(s.key, s.num),
        });
      }
      if (banked.length) {
        // EVERY SECTION ALREADY PLAYED means the run is over before it starts,
        // so restore the FINISHED card rather than a gate whose Start button
        // has nothing left to serve (owner, 2026-08-30: returning to the page
        // should show the leaderboard). It is the state a player reaches by
        // playing the seven games on their own pages, or by coming back on
        // another device, where there is no saved run to restore.
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
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || r.practice) return;
    // A PRACTICE PASS IS NOT PERSISTED. The save is the day's real run, and
    // overwriting it would mean a reload showed a run that counted for nothing
    // in place of the one that counted. Losing a practice pass to a reload is
    // the right trade.
    writeJson(STORE_KEY, r);
  }, [r, hydrated, STORE_KEY]);

  // One ticker, and only while a question is actually on screen.
  useEffect(() => {
    if (r.phase !== 'playing' || !qStart) return;
    const iv = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(iv);
  }, [r.phase, qStart]);

  const remainMs = qStart ? Math.max(0, Q_SECONDS * 1000 - (now - qStart)) : Q_SECONDS * 1000;
  const remainFrac = remainMs / (Q_SECONDS * 1000);

  useEffect(() => {
    if (r.phase !== 'playing' || !qStart || lock) return;
    if (remainMs > 0) return;
    finishSection('lost', { pick: null, timedOut: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainMs, r.phase, qStart, lock]);

  // ── the abandon row ──────────────────────────────────────────────────────
  // Leaving mid-section files the same abandoned row the solo client files, so
  // a walked-away run is a started game rather than a game with no trace. The
  // dedupe key is that game's own, so the section cannot be posted twice.
  const abandon = useAbandonFlush(() => {
    const cur = rRef.current;
    if (cur.phase !== 'playing' || !cur.sT0 || cur.practice) return null;
    const s = sections[cur.si];
    if (!s) return null;
    const REC = `sot_${s.key}_rec_${s.num}`;
    try { if (localStorage.getItem(REC)) return null; } catch (e) {}
    try { localStorage.setItem(REC, '1'); } catch (e) {}
    const el = Math.min(36000, Math.max(1, Math.round((Date.now() - cur.sT0) / 1000)));
    return {
      quizId: s.quizId, score: cur.i, total: s.questions.length, correct: cur.i,
      guessesUsed: cur.i, timeElapsed: el, abandoned: true,
      email: identity?.email || undefined, anonId: getAnonId(),
      isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
    };
  });

  function commit(next) { rRef.current = next; setR(next); }

  function startRun() {
    const cur = rRef.current;
    if (cur.t0 || cur.phase !== 'idle') return;
    const t = Date.now();
    commit({ ...cur, t0: t, sT0: t, phase: 'playing', i: 0 });
    if (sections[cur.si]) pingView(sections[cur.si].quizId);
    setQStart(t);
    setNow(t);
  }

  // PLAY IT AGAIN, FOR PRACTICE (owner, 2026-08-30). The day's results are
  // already filed and the board keeps them, so a second pass exists to play the
  // questions again and nothing else: it posts NO result, writes NO local save,
  // pings NO view, and files no abandon row. It also ignores the already-played
  // skip, because skipping every game is exactly what it is here to undo.
  function startPractice() {
    const t = Date.now();
    commit({ ...freshRun(), practice: true, t0: t, sT0: t, phase: 'playing', si: 0, i: 0 });
    setQStart(t);
    setNow(t);
  }

  // The next section that has not already been played today, plus the banked
  // ones stepped over on the way. Shared by the end of a section and the
  // verdict's own advance, so the two can never disagree about whether the run
  // has anything left in it.
  function scanAhead(cur) {
    let j = cur.si + 1;
    const banked = [];
    while (j < N && !cur.practice && alreadyDone(sections[j].key, sections[j].num)) {
      banked.push({ key: sections[j].key, score: bankedScore(sections[j].key, sections[j].num), total: sections[j].questions.length, status: 'banked', secs: 0 });
      j += 1;
    }
    return { j, banked };
  }

  // Everything a finished section owes: the four local writes the solo client
  // makes, then the ordinary result post. Called exactly once per section.
  function finishSection(status, { pick = null, timedOut = false } = {}) {
    const cur = rRef.current;
    const s = sections[cur.si];
    if (!s || cur.phase !== 'playing') return;
    const total = s.questions.length;
    const score = status === 'won' ? total : cur.i;
    const end = Date.now();
    const secs = Math.min(36000, Math.max(1, Math.round((end - (cur.sT0 || end)) / 1000)));

    abandon.markFlushed();
    if (!cur.practice) {
      writeJson(`sot_${s.key}_${s.num}`, { v: 1, i: score, status, t0: cur.sT0, tEnd: end, pick, timedOut });
      writeJson(`sot_${s.key}_day`, { d: etToday(), done: true });
      try { localStorage.setItem(`sot_${s.key}_rec_${s.num}`, '1'); } catch (e) {}
      try { recordStatFor(s.key, s.num, { s: score, t: total, won: status === 'won' }); } catch (e) {}

      try {
        fetch('/api/quiz/result', {
          method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: s.quizId, score, total, correct: score,
            guessesUsed: score + (status === 'lost' ? 1 : 0), timeElapsed: secs,
            email: identity?.email || undefined, anonId: getAnonId(),
            isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : ''),
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    vibrate(status === 'won' ? HAPT.win : HAPT.wrong);
    const results = [...cur.results, { key: s.key, score, total, status, secs, pick, timedOut }];
    // THE LAST QUIZ ENDS THE RUN, IT DOES NOT HAND OVER (owner, 2026-09-06).
    // The handover card is a bridge to the next quiz, so after the last one it
    // stood there as a dead end: a "See the run" button over figures the
    // scorecard says again a moment later, with the player made to press
    // through it to reach the ending. The run goes straight to the finish now,
    // which is where the curtain plays and the scorecard reads.
    const { j, banked } = scanAhead(cur);
    if (j >= N) {
      commit({ ...cur, si: N, i: score, phase: 'done', results: banked.length ? [...results, ...banked] : results });
    } else {
      commit({ ...cur, phase: 'verdict', i: score, results });
    }
    setQStart(null);
    setHold(false);
  }

  // The next section that has not already been played today. A run that finds
  // none is over.
  function nextSection() {
    const cur = rRef.current;
    const { j, banked } = scanAhead(cur);
    const results = banked.length ? [...cur.results, ...banked] : cur.results;
    if (j >= N) { commit({ ...cur, si: N, phase: 'done', results }); return; }
    const t = Date.now();
    commit({ ...cur, si: j, i: 0, sT0: t, phase: 'playing', results });
    if (!cur.practice) pingView(sections[j].quizId);
    setQStart(t);
    setNow(t);
  }

  // The verdict advances itself. Hold stops the clock, Next now skips the wait.
  useEffect(() => {
    if (r.phase !== 'verdict') return;
    // A verdict with nothing after it is a dead end. finishSection no longer
    // writes one, but a save from before that did can still be restored into
    // this state, so it goes to the scorecard at once and Hold cannot stall it
    // there.
    if (hydrated && !upNext) { nextSection(); return; }
    if (hold) return;
    const t = setTimeout(() => { if (!holdRef.current) nextSection(); }, VERDICT_MS);
    return () => clearTimeout(t);
    // `upNext` is READ IN THE CALLBACK, NEVER IN THE DEPS. It is declared
    // below this effect, so naming it in the array touches it during render,
    // inside its own temporal dead zone, and every render of the page throws
    // (shipped 4064ba709, caught same day). `r.si` and `hydrated` are the
    // only two things it derives from, so they cover it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.phase, r.si, hold, hydrated]);

  function answer(k) {
    const cur = rRef.current;
    if (cur.phase !== 'playing' || !cur.t0 || lockRef.current) return;
    const s = sections[cur.si];
    const qq = s && s.questions[cur.i];
    if (!qq) return;
    if (k !== qq.correct) { finishSection('lost', { pick: k, timedOut: false }); return; }
    vibrate(HAPT.ok);
    if (cur.i + 1 >= s.questions.length) { finishSection('won'); return; }
    setLock(true);
    lockRef.current = true;
    commit({ ...cur, lastRight: k });
    setTimeout(() => {
      const c2 = rRef.current;
      if (c2.phase !== 'playing') { setLock(false); lockRef.current = false; return; }
      commit({ ...c2, i: c2.i + 1, lastRight: null });
      const t = Date.now();
      setQStart(t);
      setNow(t);
      setLock(false);
      lockRef.current = false;
    }, RIGHT_MS);
  }

  useEffect(() => {
    if (r.phase !== 'playing') return;
    const onKey = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4) answer(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.phase, r.si, r.i, lock]);

  // ── figures ──────────────────────────────────────────────────────────────
  const cleared = r.results.reduce((a, x) => a + x.score, 0);
  const askable = sections.reduce((a, s) => a + s.questions.length, 0);
  // A game banked before the run that was itself run clean is cleared too. It
  // is the same feat whichever surface it happened on, and counting only the
  // sections played here would tell a player who aced Streak this morning that
  // they cleared one fewer than they did.
  const perfect = r.results.filter((x) => x.status === 'won' || (x.status === 'banked' && x.total > 0 && x.score === x.total)).length;
  // The run clock is the sum of the sections actually played, not wall time
  // from the first question: a run held on a verdict, or picked back up after
  // lunch, should not read as an hour. It is a display figure and is posted
  // nowhere; each section posts its own clock.
  const runSecs = r.results.reduce((a, x) => a + x.secs, 0);
  const answeredSoFar = r.results.reduce((a, x) => a + x.score, 0) + (r.phase === 'playing' ? r.i : 0);

  const last = r.results.length ? r.results[r.results.length - 1] : null;
  // Gated on hydration because it reads localStorage, and a render-time read
  // answers differently on the server than on the first client paint.
  const upNext = (() => {
    if (!hydrated) return null;
    let j = r.si + 1;
    while (j < N && alreadyDone(sections[j].key, sections[j].num)) j += 1;
    return j < N ? sections[j] : null;
  })();

  function shareRun() {
    const url = withRef(circuitShareUrl(circuitId));
    // ONE BUILDER FOR BOTH ENDINGS (2026-08-30). /daily-five already shared
    // through circuitShareResult and this hand-rolled two lines of its own, so
    // the same run went out two different ways depending on which screen the
    // player happened to press. The builder adds the rank and the field, and it
    // takes its unit from the circuit's own board rule, so a Gauntlet share can
    // never quote a points figure its leaderboard does not use.
    const me = boardQ.data && boardQ.data.me;
    const text = circuitShareResult(circuitId, {
      points: cleared,
      maxTotal: askable,
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

  const tierName = sec && sec.tierNames && sec.tierNames.length
    ? sec.tierNames[Math.min(sec.tierNames.length - 1, Math.floor(r.i / Math.max(1, sec.perTier)))]
    : '';

  // The cap's live figures, in the same vocabulary every daily uses: how far
  // you are into the quiz on screen, the clock, and which quiz of the run this
  // is. It is the run's version of the strip Atlas and Streak carry.
  const capFigures = (() => {
    if (r.phase === 'playing' && sec) return [
      { v: `${r.i}/${sec.questions.length}`, k: 'straight' },
      { v: fmtTime(now - (r.sT0 || now)), k: 'time' },
      { v: `${r.si + 1}/${N}`, k: `quiz · ${sec.name}` },
    ];
    // NOTHING ONCE THE RUN IS OVER (owner, 2026-08-28). The finish card below
    // carries these three figures, and by then the cap has swapped the game
    // name for the A-Z strip, so a second copy of them lands squeezed against
    // the right edge underneath it and reads as a glitch. The result belongs in
    // the box the player is reading, not in the header.
    if (done) return [];
    if (r.phase === 'verdict') return [
      { v: `${cleared}/${askable}`, k: 'questions' },
      { v: `${r.results.length}/${N}`, k: 'quizzes done' },
    ];
    // Three columns rather than two, and short labels: the cap gives each
    // figure a fixed 124px and centres it, so two long words ("quizzes",
    // "questions") sit shoulder to shoulder and read as one.
    return [
      { v: `${N}`, k: 'quizzes' },
      { v: `${askable}`, k: 'asked' },
      { v: '1', k: 'life each' },
    ];
  })();

  // ── the field ──────────────────────────────────────────────────────────
  // Today's survival curve per bank, from the score distribution the board
  // route already returns. Fetched once, on the gate, because the gate's own
  // headline is made of it. A bank with too small a field simply has no curve
  // and every surface below falls back to its plain form.
  // ══ RENDER BOUNDARY ══ everything below is presentation; the run's logic is
  // above and is never rewritten. scripts split the file here.

  // ── the field ──────────────────────────────────────────────────────────
  // Today's survival curve per bank, from the score distribution the board
  // route already returns. Read on the gate, because the gate's own headline is
  // made of it, and AGAIN when the run ends, because the gate's copy is from
  // before the player answered anything. A bank with too small a field simply
  // has no curve and every surface below falls back to its plain form.
  const field = useGauntletField(sections, hydrated, done ? 1 : 0);
  const fieldOn = !!(field && field.any);

  // TODAY'S BOARD, read once and used by three things: the gate headline, the
  // strip under the cap, and the rankings panel. boardQ is the fresh read the
  // finish makes and wins whenever it has landed; boardGate is the one taken
  // on the gate, which keeps holding its snapshot through the run because the
  // hook does not clear `data` when it goes inactive.
  const boardNow = boardQ.data || boardGate.data || null;
  const boardRows = boardNow && Array.isArray(boardNow.overall) ? boardNow.overall : [];

  // ONE FIGURE FOR TODAY'S FIELD (owner, 2026-09-04). Two of them were on the
  // same screen and they disagreed: the gate headline printed field.started,
  // which is the biggest single BANK's play count, while the strip and the
  // rankings panel printed overallField, the distinct players on the circuit's
  // board. Both are true and they answer different questions, which is exactly
  // why having both visible reads as one of them being broken (live 2026-09-04:
  // 52 players in the panel, 47 played today on the gate).
  //
  // THE WIDER ONE IS THE CIRCUIT'S FIELD, and it is also the honest one: a
  // player who has run any bank is on this circuit today, and a per-bank count
  // can only ever be a floor for that. Every surface on the run now reads this
  // and nothing can drift again. boardRows.length is the floor for a payload
  // that has rows but no overallField.
  const fieldToday = Math.max(
    (boardNow && boardNow.overallField) || 0,
    boardRows.length,
    (field && field.started) || 0,
  );
  // A row's `total` is questions right on this circuit and ladder points on
  // any other, which is exactly what the payload's scoreMode says. Nothing
  // below assumes a unit.
  const rightUnit = boardNow && boardNow.scoreMode === 'correct';
  const scoreWord = rightUnit ? 'right' : 'pts';
  const leaderRow = boardRows.length ? boardRows[0] : null;
  // THE LEADER'S SCORE, not a count of clean runs (owner, 2026-08-30). Nobody
  // clears 180 questions on one life each, so "nobody has cleared all 7" is a
  // line that will be true every single day, and a headline that never changes
  // says nothing. What the leader actually managed does change, daily, and it
  // is the number a player is about to be measured against.
  const leaderScore = leaderRow && Number.isFinite(Number(leaderRow.total))
    ? Math.round(Number(leaderRow.total)) : null;
  const myRow = boardNow ? (boardNow.me || boardNow.meProvisional || null) : null;
  // The strip needs a leader to be worth a line. With nobody through the whole
  // roster yet it says nothing, so it is not drawn and the cap chip is the way
  // in. Hidden while a question is up, and at the finish where the scorecard
  // carries all of it at full size.
  const stripOn = hydrated && !done && r.phase !== 'playing' && !!leaderRow && leaderScore != null;
  // NOTHING IS EVER HELD OPEN FOR IT (owner, 2026-08-30). A placeholder row
  // was tried here for one deploy, to stop the strip pushing the gate down
  // when the board landed. It cost a whole empty row of the one thing this
  // screen has none of, height: the gate is a headline, a seven row roster,
  // the button and the fine print, and 39px of deliberate nothing put the
  // button off the bottom of the phone. A row that appears late is a smaller
  // problem than a row of dead space that is there the whole time.

  // TODAY'S AVERAGE RUN, for the mark the climb column is measured against.
  // It is the sum of each bank's own mean, which useGauntletField already
  // reads off the score distribution, and it is drawn ONLY when every bank
  // has one: a sum missing a bank is a line a player can pass without having
  // passed anything, which is worse than no line.
  const finaleAvg = useMemo(() => {
    if (!field || !field.avg) return null;
    let sum = 0;
    for (const s of sections) {
      const a = field.avg[s.key];
      if (!Number.isFinite(a)) return null;
      sum += a;
    }
    return sum;
  }, [field, sections]);

  // THE ARCHIVE, fetched only once the panel is open, and only once. Today's
  // board is already in hand; completed days are a second, cacheable read that
  // most players never ask for.
  const hist = useCircuitHistory(circuitId, panel);
  const histDays = hist.data && Array.isArray(hist.data.history) ? hist.data.history : [];
  const champions = hist.data && Array.isArray(hist.data.champions) ? hist.data.champions : [];
  const bestDay = histDays.reduce(
    (best, d) => (!best || (d.winner && d.winner.total > best.winner.total) ? d : best), null);
  // "You took this day" is decided here rather than by the route, which folds
  // no per-player data on purpose so it can stay CDN-cached.
  const myName = (identity && identity.username) || savedIdentity().username || '';
  const histMax = histDays.reduce((m, d) => Math.max(m, Number(d.winner && d.winner.total) || 0), 0);

  // Escape shuts the panel, the way every other overlay on the site behaves.
  useEffect(() => {
    if (!panel) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setPanel(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  // CLAIM YOUR SPOT. The ladder pays REGISTERED positions only, and a finish is
  // where the attention is, so a guest's scorecard carries the canonical join
  // form inline. This surface needed it twice over: dropping the site header
  // took the only Sign Up control off the page with it. Identity is read in an
  // effect because localStorage does not exist on the server.
  const [guest, setGuest] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  useEffect(() => { if (!savedIdentity().username) setGuest(true); }, []);

  // THE LINE UNDER EACH GAME'S NAME. Normally the game's SUBJECT, per the note
  // in lib/daily-games. Deep is the exception the owner asked for here
  // (2026-08-30): its subject is the word "Trivia", which says nothing, while
  // its day TOPIC is the whole point of it. `topic` is only set by a game whose
  // day has one, so this reads as the subject everywhere else with no special
  // casing by key.
  const lineFor = (s) => s.topic || s.subject || s.cat || s.tag;

  // WHERE YOU STAND, WHILE YOU PLAY (owner, 2026-09-02). The footer counted
  // the questions you had right and stopped there, so the one thing a player
  // wants mid-run, whether the run is going anywhere, was only answerable at
  // the end.
  //
  // IT IS A PROJECTION AND SAYS SO. Every row on the board is a FINISHED total
  // and the player's own climbs with each answer, so the position below is a
  // FLOOR: it is where they would sit if they stopped on this question, and it
  // can only improve. Ties take the competition rank (everyone strictly above,
  // plus one), which is what the board itself does. Totals come back sorted
  // best first, so the nearest score above the player is simply the last one
  // that beats them.
  const liveStand = useMemo(() => {
    if (!boardRows.length) return null;
    const totals = boardRows
      .map((x) => Math.round(Number(x.total) || 0))
      .filter((t) => Number.isFinite(t));
    if (!totals.length) return null;
    const mine = answeredSoFar;
    const ahead = totals.filter((t) => t > mine).length;
    const nextUp = ahead ? totals[ahead - 1] : null;
    const lead = totals[0];
    return {
      pos: ahead + 1,
      field: (boardNow && boardNow.overallField) || totals.length,
      // What it takes to PASS, not to tie, which is the number a player can
      // act on. Null when nobody is above them.
      toNext: nextUp != null ? Math.max(1, nextUp - mine + 1) : null,
      toLead: lead > mine ? lead - mine + 1 : 0,
    };
  }, [boardRows, boardNow, answeredSoFar]);

  const lastSec = last ? sections.find((s) => s.key === last.key) : null;
  const lastMiss = missOf(lastSec, last);

  return (
    // NO SITE CHROME AT ALL. Every other daily wears DailyChrome (the site
    // masthead plus the stat bar) over LoftCap, which on this page put two
    // full headers and a rank strip between the reader and the run, and a
    // footer of site links under it. The Gauntlet is a sitting rather than a
    // page you browse to, so it is the dark screen and nothing else: its own
    // one-line cap below, and no footer. That means this page owns its ground
    // and its ink outright, which the stylesheet does explicitly.
    <div className="rn" style={{ minHeight: '100vh', background: T.ground, position: 'relative', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* THE ONLY CHROME. Not LoftCap and not the site footer: the run is a
          sitting you sit down to, and every band above or below it was another
          thing between the reader and the question. This is the mockup's cap,
          which is all it ever had: what you are in, what today is, the three
          live figures, and the way out. Dropping LoftCap also drops the
          `loft-page` ground rules it injects, so this page paints its own
          background and its own ink, which it was doing already. */}
      <div className="rn-cap">
        <div className="rn-cid">
          <i>{done ? (perfect === N ? 'Run cleared' : 'Run complete') : `Trivia · ${dateLabel}`}</i>
          <b>{circuitName}</b>
        </div>
        {capFigures.length ? (
          <div className="rn-cf">
            {capFigures.map((f) => (
              <div key={f.k}><b>{f.v}</b><i>{f.k}</i></div>
            ))}
          </div>
        ) : null}
        {/* RANKINGS, then HOME. Two chips fit on one line only because Home
            gave up its words for its glyph (owner, 2026-08-30): "Back to home"
            ran 110px against 32px for the house, and the chip is the only exit
            on the page, so the words were saying what the icon says. Rankings
            keeps its label and takes a PODIUM mark rather than a second house,
            since two identical glyphs side by side read as one control drawn
            twice. It is on screen in EVERY phase, the finish included: the
            strip comes down while a question is up and again at the finish, so
            without the chip there the archive and the all time record would be
            reachable only by somebody who had NOT run it yet, which is exactly
            backwards. The scorecard below still carries today's board; the
            panel is what carries the days before it. */}
        <button
          type="button"
          className={`rn-cx rn-cxr${panel ? ' on' : ''}`}
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          aria-controls="rn-rankings"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 21v-7" /><path d="M12 21V4" /><path d="M20 21v-10" />
          </svg>
          Rankings
        </button>
        <a className="rn-cx rn-cxi" href="/" aria-label="Home" title="Home">
          <Home size={13} strokeWidth={2.4} />
        </a>
      </div>
      <div className="rn-cprog">
        <span style={{ width: `${askable ? Math.round((answeredSoFar / askable) * 100) : 0}%` }} />
      </div>

      {/* THE STRIP. One line carrying the two facts a player wants without
          asking: what the best run today is, and where they sit against it.
          It is itself the button for the panel below.

          IT COMES DOWN WHILE A QUESTION IS UP. A live figure about other
          people is the one thing that should not sit above a 20 second clock,
          and it goes at the finish too, where the scorecard says all of it at
          full size. So: the gate and the handover, which is exactly where a
          player looks up from the run. */}
      {stripOn ? (
        <button
          type="button"
          className={`rn-strip${panel ? ' on' : ''}`}
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          aria-controls="rn-rankings"
        >
          <span className="rn-se">Today</span>
          <b className="rn-sn">{leaderRow.username || 'Guest'}</b>
          <span className="rn-sf">{leaderScore} {scoreWord}</span>
          <span className="rn-sd">
            &middot; {fieldToday}{' '}
            {fieldToday === 1 ? 'player' : 'players'}
          </span>
          <span className="rn-sy">
            {myRow && myRow.rank ? `You ${ord(myRow.rank)}` : 'Not run yet'}
            <i>{panel ? '\u2039' : '\u203A'}</i>
          </span>
        </button>
      ) : null}

      {/* THE CLOCK, full bleed on the stage's own top edge, so it sits in
          peripheral vision instead of competing with the question. Red under
          five seconds. It holds its lane at every phase so the stage does not
          jump by three pixels between question and verdict. */}
      <div className={`rn-tick${r.phase === 'playing' && remainFrac < 0.25 ? ' hot' : ''}`}>
        <span style={{
          width: r.phase === 'playing' ? `${remainFrac * 100}%` : '0%',
          background: sec ? sec.accent : 'transparent',
        }} />
      </div>

      {/* THE PANEL. It EXPANDS in flow rather than dropping over the stage as
          a sheet: an overlay needs a scrim, a z-index, a clipping parent and a
          focus trap to be honest, and all a reader asked for was to see the
          board. Pushing the run down for as long as they are reading it costs
          nothing on the gate, where the panel is opened nine times out of ten,
          and nothing is ever hidden behind it. */}
      {panel ? (
        <div className="rn-rank" id="rn-rankings" role="region" aria-label="Rankings">
          <div className="rn-rin">
            {/* THE TABS LEAD, and everything under them belongs to the one that
                is on, the podium included. The podium is TODAY's three, so it
                cannot sit ABOVE the control that switches the day out from
                under it: read in that order it looks like the three cards
                should change when you press Archive, and they never did. Each
                pane then states its own span on the line beneath, because the
                three of them describe three different stretches of time and
                one header at the top of the panel can only be honest about
                one of them. */}
            <div className="rn-thd">
              <div className="rn-tabs" role="tablist">
                {[['today', "Today's board"], ['arch', 'Archive'], ['all', 'All time']].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    className={`rn-tab${tab === k ? ' on' : ''}`}
                    onClick={() => setTab(k)}
                  >{label}</button>
                ))}
              </div>
              <button type="button" className="rn-rx" onClick={() => setPanel(false)}>Close</button>
            </div>

            {/* TODAY: the podium, then its own tail from 4th down, with the
                reader's row pinned to the end however far down it really is. */}
            {tab === 'today' ? (
              <div className="rn-rpane">
                <div className="rn-rhd">
                  <span>Today &middot; <b>{dateLabel}</b></span>
                  <s>
                    {boardNow ? `${fieldToday} ` : ''}
                    {boardNow && fieldToday === 1 ? 'player' : 'players'}
                  </s>
                </div>

                {/* THE PODIUM. Height carries the place, so first reads as
                    first before a single figure is read. */}
                {boardRows.length ? (
                  <div className="rn-pod">
                    {[boardRows[1], boardRows[0], boardRows[2]].map((row, i) => {
                      const place = i === 1 ? 1 : (i === 0 ? 2 : 3);
                      if (!row) return <div key={place} className="rn-pstep empty" />;
                      return (
                        <div key={place} className={`rn-pstep p${place}`}>
                          <span className="rn-ppl">{ord(place)}</span>
                          <b className="rn-pnm">{row.username || 'Guest'}</b>
                          <span className="rn-pfg">
                            {Math.round(Number(row.total) || 0)} <u>{scoreWord}</u>
                            {rightUnit && row.timeTotal ? ` \u00B7 ${fmtTime(row.timeTotal * 1000)}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rn-rmsg">
                    {boardQ.state === 'loading' || boardGate.state === 'loading'
                      ? 'Reading the board.'
                      : 'Nobody has run the whole thing today yet. Yours would be the first.'}
                  </div>
                )}

                {boardRows.length > 3 ? (
                  <div className="rn-rlist">
                    {boardRows.slice(3).map((row) => (
                      <div key={row.userKey || row.username} className="rn-rrow2">
                        <span className="rn-rpos">{row.rank || ''}</span>
                        <b className="rn-rnm">{row.username || 'Guest'}</b>
                        <span className="rn-rfg">
                          {Math.round(Number(row.total) || 0)} {scoreWord}
                          {rightUnit && row.timeTotal ? <s>{` \u00B7 ${fmtTime(row.timeTotal * 1000)}`}</s> : null}
                        </span>
                      </div>
                    ))}
                    {myRow && !boardRows.some((row) => row.userKey && myRow.userKey && row.userKey === myRow.userKey) ? (
                      <div className="rn-rrow2 me">
                        <span className="rn-rpos">{myRow.rank || ''}</span>
                        <b className="rn-rnm">You</b>
                        <span className="rn-rfg">{Math.round(Number(myRow.total) || 0)} {scoreWord}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <p className="rn-rfine">
                  {rightUnit
                    ? 'Ranked on questions right, the clock breaks a tie.'
                    : 'Ranked on points across the roster.'}
                  {boardNow && boardNow.partial
                    ? ` ${boardNow.partial} ${boardNow.partial === 1 ? 'is' : 'are'} partway through it.`
                    : ''}
                </p>
              </div>
            ) : null}

            {/* ARCHIVE: completed days only. A day is crowned at Eastern
                midnight and never re-crowned, so nothing here can move. */}
            {tab === 'arch' ? (
              <div className="rn-rpane">
                <div className="rn-rhd">
                  <span>Crowned days</span>
                  <s>
                    {hist.data && hist.data.days
                      ? `${hist.data.days} ${hist.data.days === 1 ? 'day' : 'days'}`
                      : ''}
                  </s>
                </div>
                {hist.state === 'loading' ? <div className="rn-rmsg">Reading the archive.</div> : null}
                {hist.state === 'error' ? <div className="rn-rmsg">The archive could not be loaded just now.</div> : null}
                {histDays.length ? (
                  <>
                    <div className="rn-hist">
                      {histDays.slice(0, 10).reverse().map((d) => {
                        const mine = !!myName && d.winner && d.winner.username === myName;
                        const h = histMax ? Math.max(6, Math.round((Number(d.winner.total) || 0) / histMax * 62)) : 6;
                        return (
                          <span key={d.date} className={`rn-hcol${mine ? ' win' : ''}`}>
                            <i>{Math.round(Number(d.winner.total) || 0)}</i>
                            <span className="rn-hbar" style={{ height: `${h}px` }} />
                            <b>{String(d.label || '').replace(/^[A-Za-z]+ /, '')}</b>
                          </span>
                        );
                      })}
                    </div>
                    <div className="rn-rlist">
                      {histDays.slice(0, 8).map((d) => (
                        <div key={d.date} className={`rn-rrow2${myName && d.winner.username === myName ? ' me' : ''}`}>
                          <span className="rn-rpos day">{d.label}</span>
                          <b className="rn-rnm">{d.winner.username}</b>
                          <span className="rn-rfg">
                            {Math.round(Number(d.winner.total) || 0)} {hist.data.scoreMode === 'correct' ? 'right' : 'pts'}
                            <s>{` \u00B7 ${d.field} ${d.field === 1 ? 'player' : 'players'}`}</s>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (hist.state === 'ready' ? (
                  <div className="rn-rmsg">No completed day has been crowned yet.</div>
                ) : null)}
              </div>
            ) : null}

            {/* ALL TIME: who has taken the most days, and the best run anyone
                has put together on it. */}
            {tab === 'all' ? (
              <div className="rn-rpane">
                <div className="rn-rhd">
                  <span>All time</span>
                  <s>
                    {champions.length
                      ? `${champions.length} ${champions.length === 1 ? 'champion' : 'champions'}`
                      : ''}
                  </s>
                </div>
                {hist.state === 'loading' ? <div className="rn-rmsg">Reading the record.</div> : null}
                {champions.length ? (
                  <div className="rn-rlist">
                    {champions.slice(0, 8).map((c, i) => (
                      <div key={c.userKey} className={`rn-rrow2${myName && c.username === myName ? ' me' : ''}`}>
                        <span className="rn-rpos">{i + 1}</span>
                        <b className="rn-rnm">{c.username}</b>
                        <span className="rn-rfg">{c.wins} {c.wins === 1 ? 'day' : 'days'}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {bestDay ? (
                  <p className="rn-rfine">
                    Best run on record: <b>{bestDay.winner.username}</b>,{' '}
                    {Math.round(Number(bestDay.winner.total) || 0)}{' '}
                    {hist.data.scoreMode === 'correct' ? 'right' : 'pts'} on {bestDay.label}.
                    {hist.data.days ? ` ${hist.data.days} days crowned.` : ''}
                  </p>
                ) : null}
                {!champions.length && hist.state === 'ready' ? (
                  <div className="rn-rmsg">Nobody has taken a day yet.</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rn-wrap">
        <div className={`rn-stage${done ? " full" : ""}`}>
          {/* THE LADDER, in its own gutter, the one thing on screen that
              persists across every quiz. It is what makes this read as one
              sitting rather than seven pages. On a phone it lies down across
              the top instead (the component's own media query).

              IT COMES DOWN AT THE FINISH (owner, 2026-08-30). The scorecard
              below draws the same object at full width with each bank named
              under it, so leaving the gutter up said the run's shape twice,
              and on a phone the gutter is a 26px strip with its labels
              suppressed: a row of bars carrying nothing the labelled ladder
              beneath it does not carry better. */}
          {done ? null : (
            <div className="rn-gutter">
              <span className="rn-lcap">{fieldOn ? "Today's field" : 'Run'}</span>
              <GauntletLadder
                orientation="col"
                height={640}
                sections={sections}
                results={r.results}
                activeIndex={r.phase === 'playing' ? r.si : -1}
                activeAnswered={r.i}
                field={fieldOn ? field.curves : null}
                labels
              />
            </div>
          )}

          <div className="rn-body">
            {r.phase === 'idle' ? (
              <div className="rn-gate">
                <span className="rn-eye">{circuitName} · one long quiz</span>
                {/* The headline is the field when there is one, and the rule
                    when there is not. THE SECOND LINE IS THE LEADER'S SCORE
                    (owner, 2026-08-30). It used to count clean runs, which on
                    180 questions at one life each is zero for everybody, every
                    day, so it always fell through to "nobody has cleared all
                    seven" and said the same thing forever. What the best run
                    today actually managed moves daily, and it is the number
                    the reader is about to be measured against. */}
                {fieldOn && field.started >= FIELD_FLOOR ? (
                  <h1 className="rn-h1">
                    <var>{fieldToday}</var> played today.<br />
                    {leaderScore != null
                      ? <>The leader nailed <var>{leaderScore}</var>.</>
                      : <><u>One life each.</u></>}
                  </h1>
                ) : (
                  <h1 className="rn-h1">
                    <var>{askable}</var> questions, <var>{N}</var> quizzes.<br />
                    <u>One life each.</u>
                  </h1>
                )}
                <div className="rn-roster">
                  {sections.map((s) => (
                    <div key={s.key} className="rn-rrow" style={{ '--acc': rampFor(s.slot != null ? s.slot : 0) }}>
                      <b>{s.name}</b>
                      <i>{lineFor(s)}</i>
                      {fieldOn && field.avg[s.key] != null
                        ? <s>avg {field.avg[s.key].toFixed(1)}</s>
                        : <s />}
                      <em>{s.questions.length}</em>
                    </div>
                  ))}
                </div>
                <button type="button" className="rn-go" onClick={startRun}>
                  Take your run<ArrowRight size={17} strokeWidth={2.8} />
                </button>
                <p className="rn-fine">
                  Twenty seconds a question. Keys 1 to 4 answer.
                  {fieldOn ? <><br />The dim rungs beside you are where today&rsquo;s players fell, and the bright one on each block is the average.</> : null}
                </p>
              </div>
            ) : null}

            {r.phase === 'playing' && question ? (
              <div className="rn-play" style={{ '--acc': sec.accent }}>
                <div className="rn-meta">
                  <span className="rn-game">{sec.name}</span>
                  {/* THE CARD NAMES WHAT THE QUIZ IS ABOUT (owner,
                      2026-09-02: Deep's topic "is not shown anywhere i can
                      see"). Most banks tag every question with its own
                      subject and that chip has always been drawn. Deep does
                      not, because on Deep the subject is the DAY: fifteen
                      questions, all on one topic, named once on the game's own
                      start gate and nowhere in the run. So a Gauntlet player
                      answered fifteen questions about Japan without being told
                      they were about Japan. The section's topic stands in
                      wherever the question carries no category of its own,
                      which is Deep and nothing else today. */}
                  {question.cat || sec.topic
                    ? <span className="rn-chip">{question.cat || sec.topic}</span> : null}
                  {tierName ? <span className="rn-chip tier">{tierName}</span> : null}
                  <span className="rn-count">{r.i + 1} of {sec.questions.length}</span>
                </div>
                <h2 className="rn-q">{question.q}</h2>
                <div className={`rn-ch${hovStale ? ' nohov' : ''}`}>
                  {question.choices.map((c, k) => (
                    <button
                      key={k}
                      type="button"
                      className={`rn-c${lock && k === question.correct ? ' ok' : ''}`}
                      onClick={() => answer(k)}
                      disabled={lock}
                    >
                      <span className="rn-k">{k + 1}</span>{c}
                    </button>
                  ))}
                </div>
                <div className="rn-foot">
                  {/* THE LIFE TOKEN. One lit dot, always on screen, in the
                      quiz's own colour. The mechanic that separates this from
                      every other quiz on the site had no picture before it. */}
                  <span className="rn-life"><s />One life · {sec.name}</span>
                  {fieldOn && field.curves[sec.key] ? (
                    <span className="rn-chip alive">
                      {Math.round((field.curves[sec.key][r.i] || 0) * (field.plays[sec.key] || 0))} of {field.plays[sec.key]} still alive here
                    </span>
                  ) : null}
                  {liveStand ? (
                    <span className="rn-stand">
                      <s>If you stopped here</s>
                      <b>#{liveStand.pos}</b>
                      <i>of {liveStand.field}</i>
                      {liveStand.toLead === 0 ? (
                        <em className="lead">you lead</em>
                      ) : (
                        <>
                          {liveStand.toNext != null && liveStand.pos > 2 ? (
                            <em>+{liveStand.toNext} passes {ord(liveStand.pos - 1)}</em>
                          ) : null}
                          <em>+{liveStand.toLead} takes the lead</em>
                        </>
                      )}
                    </span>
                  ) : null}
                  <span className="rn-tally"><b>{answeredSoFar}</b> right in the run · {fmtTime(Date.now() - r.t0)}</span>
                </div>
              </div>
            ) : null}

            {r.phase === 'verdict' && last && upNext ? (
              /* THE HANDOVER. The finished quiz's colour washes out to the
                 left, the next one's arrives on the right, and its name is set
                 large enough to be the thing you read. It is the same screen
                 the run always held between quizzes, doing more with it. */
              <div
                className="rn-chm"
                /* THE RAMP, NOT THE REGISTRY ACCENT (owner, 2026-08-30: the
                   colour "almost blends fully into the background"). A game's
                   registry colour is a deep navy-green chosen against a light
                   slate row, and the next quiz's name is set in it at 58px on a
                   near-black stage, where #0f5132 is very nearly the ground. The
                   ladder's ramp is the palette this stage actually runs on, every
                   step a high-lightness pastel, and it is already the colour that
                   bank wears on the ladder two inches away. */
                style={{
                  '--from': lastSec ? rampFor(lastSec.slot) : T.blue,
                  '--to': upNext ? rampFor(upNext.slot) : T.blue,
                }}
              >
                {/* THREE THINGS ON THE CARD (owner, 2026-09-05): the question
                    that ended the quiz with the score inline after it, one big
                    Continue that IS the next quiz's name, and the two lesser
                    actions under it. The headline, the eyebrow, the figure row
                    and the separate "next up" block are gone: the last quiz
                    gets one line of ink, the next one gets the button. */}
                <div className="rn-vlast">
                  {lastMiss && !lastMiss.cleared ? (
                    <>
                      <div className="rnm-q">
                        {lastMiss.q}
                        <b className="rn-vsc">
                          <i style={{ color: lastSec ? rampFor(lastSec.slot) : T.blue }}>{lastSec ? lastSec.name : 'That quiz'}</i> {last.score} of {last.total}
                        </b>
                      </div>
                      <div className="rnm-ans">
                        {lastMiss.yours ? <span className="rnm-w">you said {lastMiss.yours}</span> : null}
                        {lastMiss.timedOut ? <span className="rnm-w">the clock ran out</span> : null}
                        {lastMiss.unknown ? <span className="rnm-w">answered wrong</span> : null}
                        <span className="rnm-r">{lastMiss.right}</span>
                      </div>
                    </>
                  ) : (
                    <div className="rnm-q cleared">
                      {lastSec ? lastSec.name : 'That quiz'} run clean, no misses.
                      <b className="rn-vsc ok">{last.score} of {last.total}</b>
                    </div>
                  )}
                </div>
                {/* THE BUTTON IS THE NEXT QUIZ. Its ramp step is the fill, its
                    name is the label, its subject and count are the second
                    line, and the dwell bar drains along its bottom edge so the
                    countdown is part of the thing it counts down to. Keyed on
                    the resume count so the bar RESTARTS with the fresh timeout
                    a resume starts; the duration comes from VERDICT_MS so the
                    bar and the timeout cannot drift apart. */}
                <button
                  type="button"
                  className={`rn-vgo${hold ? ' held' : ''}`}
                  style={{ '--dwell': `${VERDICT_MS}ms` }}
                  onClick={() => { setHold(false); nextSection(); }}
                >
                  <span className="rn-vge">Continue to</span>
                  <span className="rn-vgn">{upNext.name}</span>
                  <span className="rn-vgs">{lineFor(upNext)} · {upNext.questions.length} questions · your life resets</span>
                  <ArrowRight className="rn-vga" size={26} strokeWidth={2.8} />
                  <span className="rn-vgbar"><span key={resumes} /></span>
                </button>
                <div className="rn-vacts rn-hacts">
                  <button type="button" className="rn-vb" onClick={() => { if (hold) setResumes((k) => k + 1); setHold(!hold); }}>
                    {hold ? <><Play size={14} strokeWidth={2.8} />Resume</> : <><Pause size={14} strokeWidth={2.8} />Hold</>}
                  </button>
                  <a className="rn-vb" href={`/circuits/${circuitId}`}>Leave the run</a>
                </div>
              </div>
            ) : null}

            {done ? (
              <div className="rn-done">
                {/* ONE PER-BANK READOUT, AT THE TOP (owner, 2026-08-30). This
                    card carried three: the gutter strip above it, this ladder,
                    and a row-per-bank list under it saying the same scores again
                    in words. The ladder is the one that reads at a glance and
                    names every bank, so it is the one that stays, and it leads
                    the card. */}
                <span className="rn-lcap">
                  {r.practice ? 'Practice run' : 'The run'}
                  {r.practice ? <i className="rn-pchip">nothing posted</i> : null}
                </span>
                <GauntletLadder
                  orientation="row"
                  sections={sections}
                  results={r.results}
                  field={fieldOn ? field.curves : null}
                  labels
                />

                <div className="rn-sc-hero">
                  <div className="rn-sc-big">
                    {cleared}<small>/{askable}</small>
                    <i>questions cleared</i>
                  </div>
                  {/* NO "0 of 7 CLEARED" (owner, 2026-08-30). Clearing a
                      one-life quiz of twenty-five questions is rare, so for
                      almost everyone that figure is a zero, and a scorecard
                      that leads with a zero reads as a failure whatever the
                      real score was. The number right is the achievement and
                      the hero already carries it. */}
                  <div className="rn-sc-figs">
                    {/* A run restored from the games themselves, rather than
                        from a saved run, has no clock to report. Zero is not
                        the answer to "how long did it take you". */}
                    {runSecs > 0 ? <div><b>{fmtTime(runSecs * 1000)}</b><i>on the clock</i></div> : null}
                    {boardQ.data && boardQ.data.me && Number.isFinite(boardQ.data.me.rank)
                      ? <div><b>#{boardQ.data.me.rank}</b><i>of {boardQ.data.overallField || 0}</i></div> : null}
                    {/* NO POINTS FIGURE ON A QUESTIONS-RIGHT CIRCUIT (owner,
                        2026-08-30). The board's total IS the number in the hero
                        directly above this row, so printing it again in a
                        different unit was the confusing half of the old
                        scorecard: two figures for one fact. */}
                    {boardQ.data && boardQ.data.scoreMode !== 'correct'
                      && boardQ.data.me && Number.isFinite(boardQ.data.me.total)
                      ? <div><b>{Math.round(boardQ.data.me.total * 10) / 10}</b><i>of {(boardQ.data && boardQ.data.maxTotal) || N * 15} points</i></div> : null}
                  </div>
                </div>

                <div className="rn-board">
                  <span className="rn-lcap">
                    Today&rsquo;s circuit board{boardQ.data && boardQ.data.overallField ? ` · ${boardQ.data.overallField} on it` : ''}
                  </span>
                  {boardQ.state === 'loading' ? (
                    <div className="rn-bmsg">Reading the board.</div>
                  ) : boardQ.state === 'error' ? (
                    <div className="rn-bmsg">The board could not be loaded just now.</div>
                  ) : (
                    <div className="rn-lb">
                      {((boardQ.data && boardQ.data.overall) || []).slice(0, 5).map((row, i) => (
                        <div key={row.userKey || i} className={`rn-brow${boardQ.data.me && row.userKey === boardQ.data.me.userKey ? ' me' : ''}`}>
                          <span className="rn-bp">{i + 1}</span>
                          <span className="rn-bn">{row.username || 'Guest'}</span>
                          <span className="rn-bs">{Math.round(row.total * 10) / 10}</span>
                        </div>
                      ))}
                      {boardQ.data && boardQ.data.me
                        && !((boardQ.data.overall || []).slice(0, 5).some((x) => x.userKey === boardQ.data.me.userKey)) ? (
                          <div className="rn-brow me">
                            <span className="rn-bp">{boardQ.data.me.rank || '—'}</span>
                            <span className="rn-bn">You</span>
                            <span className="rn-bs">{Math.round(boardQ.data.me.total * 10) / 10}</span>
                          </div>
                        ) : null}
                    </div>
                  )}
                </div>

                {guest && !claimed ? (
                  <div className="rn-claim">
                    <span className="rn-clabel">Playing as a guest</span>
                    <div className="rn-chd">
                      <span className="rn-cnm">Claim a free name to hold your spot</span>
                      {!claimOpen ? (
                        <button type="button" className="rn-cgo" onClick={() => setClaimOpen(true)}>
                          Claim my name
                        </button>
                      ) : null}
                    </div>
                    <p className="rn-ctg">
                      Ranks and points count for registered names only. A display name is enough, no
                      password, and every quiz you have already finished comes with you.
                    </p>
                    {claimOpen ? (
                      <div className="rn-cform">
                        <JoinLeaderboardForm
                          heading="Claim your name"
                          hideIcon
                          onJoined={() => {
                            setClaimed(true);
                            try { window.dispatchEvent(new Event('sot:daily-updated')); } catch (e) {}
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {claimed ? (
                  <div className="rn-claimed">
                    You&rsquo;re on the board. Every finish counts under your name now.
                  </div>
                ) : null}

                {/* WHERE NEXT (owner, 2026-08-30). The scorecard used to end on three
                    controls, and the only one that led anywhere on this site was Home:
                    the player likeliest to play something else was asked nothing. Four
                    open puzzles and two more circuits, none of them played today, with
                    the whole roster and every other circuit one press away IN PLACE.
                    It sits above the actions because it is the offer and they are the
                    exits. See app/circuits/RunNextUp.jsx for the two orderings. */}
                <RunNextUp circuitId={circuitId} />

                <div className="rn-vacts rn-sacts">
                  <button type="button" className="rn-vb pri" onClick={shareRun}>
                    {copied ? <Check size={15} strokeWidth={2.8} /> : <Share2 size={15} strokeWidth={2.8} />}
                    {copied ? 'Copied' : 'Share the run'}
                  </button>
                  <button type="button" className={`rn-vb${misses ? ' on' : ''}`} onClick={() => setMisses((v) => !v)}>
                    Miss summary
                  </button>
                  <a className="rn-vb" href={runSummaryHref(circuitId)}>The full board</a>
                  {/* PLAY IT AGAIN (owner, 2026-08-30). Today's result is filed
                      and the board keeps it, so the only thing left to offer is
                      the questions again. It posts nothing, which is what the
                      chip says. */}
                  <button type="button" className="rn-vb" onClick={startPractice}>
                    <RotateCcw size={15} strokeWidth={2.8} />Try again for practice
                  </button>
                  <a className="rn-vb" href="/"><Home size={15} strokeWidth={2.8} />Home</a>
                </div>
                {misses ? (
                  <MissList sections={sections} results={r.results} colourOf={(s) => rampFor(s.slot)} />
                ) : null}
                <p className="rn-fine">
                  {r.practice
                    ? `A practice run posts nothing. Today's results are already on the board above, and they are the ones that count.`
                    : circuitScoreMode(circuitId) === 'correct'
                      ? `Each quiz counted on its own board as you played it. The circuit board is the plain count of questions you got right across all ${N}, and the shorter clock takes a tie.`
                      : `Each quiz counted on its own board as you played it. The circuit board ranks the combined placement across all ${N}. Each quiz pays 15 points for a win down to 1 for finishing, and the run adds the ${N} up.`}
                </p>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {curtain ? (
        <GauntletFinale
          sections={sections}
          results={r.results}
          score={cleared}
          total={askable}
          avgTotal={finaleAvg}
          field={field}
          leaderScore={rightUnit ? leaderScore : null}
          rank={boardQ.data && boardQ.data.me && Number.isFinite(boardQ.data.me.rank) ? boardQ.data.me.rank : null}
          fieldSize={(boardQ.data && boardQ.data.overallField) || null}
          rows={(boardQ.data && boardQ.data.overall) || []}
          meKey={(boardQ.data && boardQ.data.me && boardQ.data.me.userKey) || null}
          guest={guest && !claimed}
          onDone={() => setCurtain(false)}
        />
      ) : null}

      {/* THE DOOR'S ONE WORD ABOUT THE REST OF THE SITE (owner, 2026-09-03).
          Mounted in every phase so it can read the /trivia arrival at mount;
          it opens only on the scorecard, after the curtain, and only for a
          first-timer who came in through /trivia. See TriviaDoorPop. */}
      <TriviaDoorPop ready={hydrated && done && !curtain} />
    </div>
  );
}
const CSS = `
${MISS_CSS}
/* THE RUN IS A DARK STAGE, not white cards on navy (owner, 2026-08-30, "it
   should look just like the mock-up"). Every other daily puts its board in a
   white card because the board is an object you manipulate; this is a question
   on a screen, and the mockup put it straight on the ground with the ladder
   beside it. That also means the loft ground's ink rules, which repaint text
   for a dark background and which the old white cards had to fight with
   three-class !important overrides, are now doing exactly what is wanted. The
   overrides are gone with the cards.

   Anything added here that must NOT be repainted has to carry its own colour:
   the rule catches every <p> that is a direct child of a direct div child of
   the page column, and every <section>. Nothing here is a section. */
.rn{font-family:${SANS};color:#eef2fa;}
.rn-wrap{max-width:1120px;margin:0 auto;padding:0 20px 40px;}

/* THE GROUND REACHES THE EDGES (owner, 2026-08-30, "i want the whole page to
   be uniform color dark"). globals.css paints html, body AND the safe-area
   dome brand navy, on the standing rule that every route lays an opaque ground
   of its own over the viewport. This one does, and navy STILL showed above and
   below it, because those three surfaces are not the page: the overscroll
   canvas, the installed-app dome and Safari's bottom bar all read body's
   background, never the element covering it. So the run claims them, scoped by
   :has(.rn) so no other route is touched and nothing has to be put back on
   unmount. theme-color is the fourth surface and is set by the route's own
   viewport export in page.js, since a meta tag is not reachable from CSS. */
html:has(.rn),body:has(.rn){background:${T.ground};}
body:has(.rn)::before{background:${T.ground};}

/* THE CAP. NOT A BAND (owner, 2026-08-30, "i want the whole page to be
   uniform color dark"). It was a navy panel across the top of a near-black
   page, which is the one horizontal seam left on a screen whose whole point is
   that it is a dark stage rather than a stack of cards. It takes the ground,
   so what marks it is its own contents and the progress hairline under it. */
.rn-cap{background:${T.ground};display:flex;align-items:center;gap:16px;padding:12px 20px;}
.rn-cid{min-width:0;flex:1;}
.rn-cid i{display:block;font-style:normal;font-family:${MONO};font-size:9.5px;letter-spacing:.15em;
  text-transform:uppercase;color:#9fc2ff;margin-bottom:2px;}
.rn-cid b{display:block;font-size:16px;font-weight:800;letter-spacing:-.02em;color:#fff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rn-cf{display:flex;gap:2px;flex:none;}
.rn-cf div{width:84px;text-align:center;}
.rn-cf div b{display:block;font-family:${MONO};font-size:16px;font-weight:500;color:#fff;
  line-height:1;font-variant-numeric:tabular-nums;}
.rn-cf div i{display:block;font-style:normal;font-size:8.5px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:#8ea6d6;margin-top:5px;}
.rn-cx{flex:none;font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:#9fc2ff;text-decoration:none;border:1px solid rgba(255,255,255,.2);border-radius:7px;
  padding:7px 11px;white-space:nowrap;}
.rn-cx:hover{color:#fff;border-color:rgba(255,255,255,.4);}
.rn-cx.rn-cxi{padding:7px 9px;display:inline-flex;align-items:center;}
.rn-cx.rn-cxr{display:inline-flex;align-items:center;gap:6px;background:none;cursor:pointer;
  font-family:${MONO};}
.rn-cx.rn-cxr.on{color:#08222e;background:${T.blue200};border-color:${T.blue200};}
.rn-cx:focus-visible{outline:2px solid #7dd3fc;outline-offset:2px;}

/* THE STRIP. One line, the cap's own register, and a button: the leader on the
   left, the reader's own place on the right. It carries a faint lift rather
   than a fill so it reads as part of the cap rather than as a banner laid over
   the stage. */
.rn-strip{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;
  background:rgba(255,255,255,.03);border:0;border-bottom:1px solid rgba(255,255,255,.09);
  padding:10px 20px;font-family:${MONO};font-size:11.5px;color:#9aa8c4;}
.rn-strip:hover{background:rgba(255,255,255,.055);}
.rn-strip:focus-visible{outline:2px solid #7dd3fc;outline-offset:-2px;}
.rn-strip.on{background:rgba(125,211,252,.08);}
.rn-se{color:${T.gold};letter-spacing:.1em;text-transform:uppercase;font-size:9.5px;flex:none;}
.rn-sn{font-family:${SANS};font-weight:800;font-size:13.5px;color:#fff;flex:none;
  max-width:38vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rn-sf{font-variant-numeric:tabular-nums;flex:none;}
.rn-sd{color:#66748f;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rn-sy{margin-left:auto;flex:none;color:#7dd3fc;letter-spacing:.1em;text-transform:uppercase;
  font-size:9.5px;display:inline-flex;align-items:center;gap:7px;}
.rn-sy i{font-style:normal;font-size:13px;line-height:1;}

/* THE PANEL. In flow, so nothing is ever hidden behind it. */
.rn-rank{border-bottom:1px solid rgba(255,255,255,.09);background:#0d1220;
  animation:rn-rdrop .22s ease;}
@keyframes rn-rdrop{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){.rn-rank{animation:none;}}
.rn-rin{max-width:660px;margin:0 auto;padding:16px 20px 20px;}
.rn-rhd{display:flex;align-items:baseline;gap:10px;font-family:${MONO};font-size:9.5px;
  letter-spacing:.13em;text-transform:uppercase;color:#66748f;margin-bottom:12px;}
.rn-rhd b{color:#9fc2ff;font-weight:400;}
.rn-rhd s{text-decoration:none;margin-left:auto;color:#66748f;}
/* THE TAB ROW leads the panel and carries Close on its own right edge, so the
   one control in it that is not a tab sits outside the tablist. */
.rn-thd{display:flex;align-items:stretch;gap:10px;margin-bottom:12px;
  border-bottom:1px solid rgba(255,255,255,.09);}
.rn-rx{background:none;border:0;cursor:pointer;color:#66748f;font-family:${MONO};font-size:9.5px;
  letter-spacing:.12em;text-transform:uppercase;padding:0 2px;margin-left:auto;flex:none;
  align-self:center;}
.rn-rx:hover{color:#fff;}

/* The podium: three steps, height carrying the place. */
.rn-pod{display:flex;align-items:flex-end;gap:8px;margin-bottom:14px;}
.rn-pstep{flex:1;min-width:0;border-radius:9px 9px 0 0;padding:12px 12px 11px;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-bottom:0;}
.rn-pstep.empty{background:none;border-color:transparent;}
.rn-pstep.p1{padding-top:26px;border-color:rgba(232,180,58,.42);
  background:linear-gradient(180deg,rgba(232,180,58,.2),rgba(232,180,58,.05));}
.rn-pstep.p2{padding-top:17px;
  background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02));}
.rn-ppl{display:block;font-family:${MONO};font-size:10px;color:#66748f;letter-spacing:.1em;
  margin-bottom:6px;}
.rn-pstep.p1 .rn-ppl{color:${T.gold};}
.rn-pnm{display:block;font-size:16px;font-weight:800;letter-spacing:-.02em;color:#fff;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rn-pstep.p1 .rn-pnm{font-size:19px;}
.rn-pfg{display:block;font-family:${MONO};font-size:12.5px;color:#9aa8c4;margin-top:5px;
  font-variant-numeric:tabular-nums;}
.rn-pfg u{text-decoration:none;color:#66748f;}

.rn-tabs{display:flex;gap:2px;min-width:0;}
.rn-tab{background:none;border:0;border-bottom:2px solid transparent;cursor:pointer;
  font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#66748f;
  padding:8px 12px;margin-bottom:-1px;}
.rn-tab:hover{color:#9aa8c4;}
.rn-tab.on{color:#fff;border-bottom-color:#7dd3fc;}

.rn-rlist{display:grid;gap:1px;background:rgba(255,255,255,.06);border-radius:9px;overflow:hidden;}
.rn-rrow2{display:flex;align-items:center;gap:11px;background:#0e131f;padding:9px 12px;}
.rn-rrow2.me{background:rgba(125,211,252,.11);}
.rn-rpos{font-family:${MONO};font-size:11.5px;color:#66748f;min-width:26px;flex:none;
  font-variant-numeric:tabular-nums;}
.rn-rpos.day{min-width:46px;}
.rn-rrow2.me .rn-rpos{color:#7dd3fc;}
.rn-rnm{flex:1;min-width:0;font-size:14px;font-weight:700;color:#fff;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.rn-rfg{font-family:${MONO};font-size:12.5px;color:#9aa8c4;flex:none;
  font-variant-numeric:tabular-nums;}
.rn-rfg s{text-decoration:none;color:#66748f;}
.rn-rfine{font-size:12px;line-height:1.6;font-weight:600;color:#66748f;margin:12px 0 0;}
.rn-rfine b{color:#9aa8c4;}
.rn-rmsg{padding:14px;text-align:center;font-size:12.5px;font-weight:600;color:#66748f;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:11px;}

/* One column per crowned day: the winning score, and yours in sky. */
.rn-hist{display:flex;gap:4px;align-items:flex-end;margin-bottom:14px;}
.rn-hcol{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;}
.rn-hbar{width:100%;border-radius:3px 3px 0 0;background:rgba(255,255,255,.13);}
.rn-hcol.win .rn-hbar{background:#7dd3fc;}
.rn-hcol i{font-style:normal;font-size:10.5px;font-weight:700;color:#9aa8c4;}
.rn-hcol.win i{color:#7dd3fc;}
.rn-hcol b{font-family:${MONO};font-size:9px;color:#66748f;white-space:nowrap;}

.rn-cprog{height:2px;background:rgba(255,255,255,.1);}
.rn-cprog span{display:block;height:100%;background:${T.blue400};transition:width .3s ease;}

/* THE CLOCK, full bleed under the cap. It keeps its lane at every phase so the
   stage does not jump three pixels between a question and a verdict. */
.rn-tick{height:3px;background:rgba(255,255,255,.07);}
.rn-tick span{display:block;height:100%;transition:width .2s linear;}
.rn-tick.hot span{background:${T.danger}!important;}

/* THE STAGE: the ladder's gutter, then the run. */
.rn-stage{display:flex;gap:0;align-items:stretch;min-height:560px;}
.rn-gutter{flex:none;width:136px;padding:20px 16px 24px 0;margin-right:24px;
  border-right:1px solid rgba(255,255,255,.08);}
.rn-body{flex:1;min-width:0;padding:22px 0 30px;max-width:720px;}
/* With the gutter down at the finish, the card would otherwise sit at 720px
   hard against the left edge of an 1120px page. It centres instead. */
.rn-stage.full .rn-body{max-width:840px;margin:0 auto;}
.rn-lcap{display:block;font-family:${MONO};font-size:9px;letter-spacing:.13em;
  text-transform:uppercase;color:#66748f;margin-bottom:12px;}
.rn-pchip{display:inline-block;margin-left:9px;padding:2px 7px;border-radius:999px;font-style:normal;
  background:rgba(125,211,252,.16);color:${T.blue200};letter-spacing:.1em;}

/* Shared type. */
.rn-eye{display:block;font-family:${MONO};font-size:10.5px;letter-spacing:.16em;
  text-transform:uppercase;font-weight:500;color:${T.blue400};margin-bottom:8px;}
.rn-eye.ok{color:${T.success};}
.rn-eye.out{color:#ef8577;}
/* BOTH HEADLINES ARE TWO LINES, WHICH IS WHY THERE IS NO RESERVE HERE.
   The gate has two of them and the rule form is not a placeholder, it is the
   FALLBACK BRANCH: it renders until useGauntletField's seven board fetches
   have all landed, and the swap to "N played today." used to take a whole line
   out from under the roster, the button and the fine print, so the gate jumped
   while the reader was looking at it. The first fix reserved three lines of
   box. That was worse: it left ~46px of dead space under the shorter headline
   for the whole rest of the session, on the one screen with no height to
   spare. Re-breaking the rule to "180 questions, 7 quizzes. / One life each."
   costs no words, makes the two forms the same shape, and takes the gate 46px
   UP rather than down. Measured on the live page: both are two lines at every
   width from a 346px content box (iPhone SE) to the 720px body.
   The floor below is only the 1 to 2px between them, which comes from the mono
   <var> overshooting the 1.03 strut by about .045em on the lines that carry
   one. It is in em, so the mobile font-size carries it with no second number. */
.rn-h1{font-size:clamp(30px,4vw,44px);font-weight:800;letter-spacing:-.04em;line-height:1.03;
  margin:0;color:#fff;min-height:2.18em;}
.rn-h1 var{font-style:normal;font-family:${MONO};font-weight:500;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;}
.rn-h1 u{text-decoration:none;color:#ef8577;}
.rn-lead{font-size:15px;line-height:1.55;font-weight:600;color:#9aa8c4;margin:16px 0 0;max-width:56ch;}
.rn-fine{font-size:12px;line-height:1.65;font-weight:600;color:#66748f;margin:16px 0 0;}

/* The start list. */
/* THE START LIST IS THE BODY OF THE GATE. The paragraph that used to sit above
   it restated the headline in grey, so it went and the list took the height:
   the seven quizzes are the thing a reader is actually deciding about, and at
   this size the names carry from across a room. */
.rn-roster{display:grid;margin:26px 0 0;border-top:1px solid rgba(255,255,255,.09);}
.rn-rrow{display:flex;align-items:center;gap:16px;padding:15px 0 15px 16px;
  border-bottom:1px solid rgba(255,255,255,.07);border-left:4px solid var(--acc);}
.rn-rrow b{font-size:19px;font-weight:800;letter-spacing:-.02em;color:#fff;width:96px;flex:none;}
.rn-rrow i{font-style:normal;font-size:15px;font-weight:600;color:#9aa8c4;flex:1;min-width:0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rn-rrow s{text-decoration:none;font-family:${MONO};font-size:12.5px;color:#66748f;
  width:78px;text-align:right;flex:none;}
.rn-rrow em{font-style:normal;font-family:${MONO};font-size:14px;color:#8ea6d6;
  font-variant-numeric:tabular-nums;width:34px;text-align:right;flex:none;}

/* THE CALL TO ACTION IS SKY, NOT THE BRAND CTA BLUE (owner, 2026-08-30).
   This stage is near black plus exactly one family of colour, the ladder ramp:
   sky, mint, lime, gold, orange, rose, magenta. Every one of those is a
   high-lightness pastel carrying DARK ink. The brand CTA blue was the only
   mid-tone saturated fill on the page and the only one carrying white, so it
   read as a button imported from a different design rather than as part of
   the stage.
   It was never a contrast failure, it was a register failure.
   Sky is LADDER_RAMP's own first step, so the primary now belongs to the same
   palette as everything around it: #08222e on #7dd3fc is 9.85:1, and the
   button sits at 11.48:1 against the ground, both far past where the royal
   blue was (4.65 and 4.11). The known cost, accepted: sky is also slot one's
   identity on the ladder above these buttons. */
.rn-go{display:inline-flex;align-items:center;gap:9px;background:#7dd3fc;color:#08222e;border:0;
  border-radius:11px;padding:15px 22px;font-family:inherit;font-weight:800;font-size:15px;
  cursor:pointer;margin-top:24px;}
.rn-go:hover{filter:brightness(1.1);}

/* The question. */
.rn-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px;}
.rn-game{font-size:12.5px;font-weight:800;color:var(--acc);}
.rn-chip{font-family:${MONO};font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;
  color:#9aa8c4;border:1px solid rgba(255,255,255,.12);border-radius:5px;padding:3px 7px;}
.rn-chip.tier{border-color:rgba(232,180,58,.42);color:${T.gold};}
.rn-chip.alive{border-color:rgba(96,165,250,.4);color:${T.blue200};}
.rn-count{margin-left:auto;font-family:${MONO};font-size:11.5px;color:#66748f;
  font-variant-numeric:tabular-nums;}
.rn-q{font-size:clamp(21px,2.7vw,29px);font-weight:800;letter-spacing:-.025em;line-height:1.28;
  color:#fff;margin:0 0 22px;max-width:28ch;}
.rn-ch{display:grid;gap:9px;}
.rn-c{display:flex;align-items:center;gap:12px;text-align:left;background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.12);border-radius:11px;padding:15px 16px;font-family:inherit;
  font-size:15.5px;font-weight:600;color:#eef2fa;cursor:pointer;transition:border-color .12s,background .12s;}
.rn-ch:not(.nohov) .rn-c:hover:not(:disabled){border-color:var(--acc);background:rgba(255,255,255,.08);}
.rn-c:disabled{cursor:default;}
.rn-c.ok{border-color:${T.successDeep};background:rgba(16,185,129,.16);color:#c6f5e2;}
.rn-c.ok .rn-k{border-color:${T.successDeep};color:#6ee7b7;}
.rn-k{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none;
  border-radius:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
  font-family:${MONO};font-size:11px;font-weight:500;color:#66748f;}

.rn-foot{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-top:22px;padding-top:16px;
  border-top:1px solid rgba(255,255,255,.08);}
.rn-life{display:inline-flex;align-items:center;gap:9px;padding:9px 13px;border-radius:9px;
  border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);
  font-family:${MONO};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9aa8c4;}
.rn-life s{text-decoration:none;width:9px;height:9px;border-radius:50%;background:var(--acc);flex:none;
  box-shadow:0 0 0 4px color-mix(in srgb,var(--acc) 22%,transparent);}
.rn-tally{margin-left:auto;font-family:${MONO};font-size:11.5px;color:#66748f;
  font-variant-numeric:tabular-nums;}
.rn-tally b{font-weight:600;font-size:13.5px;color:#dbe6ff;}
/* THE LIVE STANDING. A projection, so it says so on its face rather than in a
   tooltip nobody opens on a phone. */
.rn-stand{display:inline-flex;align-items:baseline;gap:8px;flex-wrap:wrap;
  padding:8px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.03);font-family:${MONO};font-size:11px;
  color:#9aa8c4;font-variant-numeric:tabular-nums;}
.rn-stand s{text-decoration:none;font-size:9.5px;letter-spacing:.14em;
  text-transform:uppercase;color:#66748f;}
.rn-stand b{font-family:${SANS};font-size:15px;font-weight:800;color:#fff;}
.rn-stand i{font-style:normal;color:#66748f;}
.rn-stand em{font-style:normal;color:${T.blue200};}
.rn-stand em.lead{color:${T.gold};}
@media (max-width:640px){
  .rn-stand{width:100%;gap:6px;}
  .rn-stand s{width:100%;}
}

/* THE HANDOVER. The outgoing quiz's colour leaves on the left, the incoming
   one arrives on the right, and the name is the thing you read. */
.rn-chm{position:relative;border-radius:14px;border:1px solid rgba(255,255,255,.09);
  padding:26px 26px 24px;overflow:hidden;}
.rn-chm::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(112deg,color-mix(in srgb,var(--from) 26%,transparent) 0%,
    ${T.ground} 48%,color-mix(in srgb,var(--to) 18%,transparent) 100%);}
.rn-chm > *{position:relative;}
/* 1. THE LAST QUIZ, ONE LINE OF INK. The question that ended it, its name and
   score inline after it in the ramp step it wore, and the answer line under. */
.rn-vlast .rnm-q{font-size:15.5px;margin:0 0 7px;}
.rn-vlast .rnm-q.cleared{margin:0;color:#eef2fa;font-weight:600;}
.rn-vsc{display:inline-block;margin-left:10px;font-family:${MONO};font-weight:500;font-size:13.5px;
  color:#ef8577;white-space:nowrap;vertical-align:baseline;font-variant-numeric:tabular-nums;}
.rn-vsc.ok{color:${T.success};}
.rn-vsc i{font-style:normal;font-weight:800;font-family:${SANS};font-size:11px;letter-spacing:.12em;
  text-transform:uppercase;margin-right:7px;}

/* 2. THE BUTTON IS THE NEXT QUIZ. Full width at every size, the incoming ramp
   step as its fill (every LADDER_RAMP step holds 6:1 or better against
   #08222e: sky 9.85, mint 10.78, lime 12.57, gold 8.62, orange 7.26, rose 6.1,
   magenta 6.67), the name set big, and the countdown draining along its
   bottom edge in the same ink at low alpha. */
.rn-vgo{position:relative;display:block;width:100%;text-align:left;margin-top:22px;
  background:var(--to,#7dd3fc);border:0;border-radius:14px;padding:18px 74px 20px 22px;
  font-family:inherit;color:#08222e;cursor:pointer;overflow:hidden;}
.rn-vgo:hover{filter:brightness(1.06);}
.rn-vge{display:block;font-family:${MONO};font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  font-weight:600;opacity:.7;}
.rn-vgn{display:block;font-size:clamp(30px,4.6vw,44px);font-weight:800;letter-spacing:-.045em;
  line-height:.95;text-transform:uppercase;margin-top:5px;}
.rn-vgs{display:block;font-size:12.5px;font-weight:700;opacity:.72;margin-top:8px;}
.rn-vga{position:absolute;right:24px;top:50%;transform:translateY(-50%);}
.rn-vgbar{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(8,34,46,.12);}
.rn-vgbar span{display:block;height:100%;background:rgba(8,34,46,.45);width:100%;transform-origin:left;
  animation:rnv var(--dwell,8000ms) linear forwards;}
.rn-vgo.held .rn-vgbar span{animation-play-state:paused;}
@keyframes rnv{from{transform:scaleX(1);}to{transform:scaleX(0);}}
@media (prefers-reduced-motion:reduce){.rn-vgbar span{animation:none;transform:scaleX(0);}}

/* 3. The two lesser actions, the chips they were. */
.rn-vacts{display:flex;gap:8px;flex-wrap:wrap;}
.rn-vb{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.14);border-radius:9px;padding:11px 14px;font-family:inherit;
  font-weight:800;font-size:13.5px;color:#eef2fa;cursor:pointer;text-decoration:none;}
.rn-vb.on{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);}
.rn-vb.pri{background:#7dd3fc;border-color:#7dd3fc;color:#08222e;}
.rn-vb:hover{filter:brightness(1.1);}
.rn-hacts{margin-top:10px;}
.rn-sacts{margin-top:22px;}

/* The scorecard. */
.rn-sc-hero{display:flex;align-items:flex-end;gap:28px;flex-wrap:wrap;margin-top:24px;
  padding-bottom:22px;border-bottom:1px solid rgba(255,255,255,.09);}
.rn-sc-big{font-family:${MONO};font-size:clamp(46px,7vw,64px);font-weight:500;color:#fff;
  line-height:.86;letter-spacing:-.04em;font-variant-numeric:tabular-nums;}
.rn-sc-big small{font-size:.36em;color:#66748f;letter-spacing:0;}
.rn-sc-big i{display:block;font-style:normal;font-family:${SANS};font-size:9.5px;font-weight:800;
  letter-spacing:.13em;text-transform:uppercase;color:#66748f;margin-top:10px;}
.rn-sc-figs{display:flex;gap:24px;margin-left:auto;flex-wrap:wrap;}
.rn-sc-figs div b{display:block;font-family:${MONO};font-size:21px;color:#fff;font-weight:500;
  line-height:1;font-variant-numeric:tabular-nums;}
.rn-sc-figs div i{display:block;font-style:normal;font-size:9px;font-weight:800;letter-spacing:.12em;
  text-transform:uppercase;color:#66748f;margin-top:6px;}

/* CLAIM YOUR SPOT, under the board (owner, 2026-08-30), because that is the
   moment a guest has just read a column of ranked names and found that none of
   them is theirs. It sat between the figures and the ladder, which put a form
   in the middle of the result.
   The join form inks itself from --join-* custom properties. LoftFinish resets
   them to light values because its card is white; this card is dark, so they
   are set here for a dark ground or the heading ships black on near-black. */
.rn-claim{margin:20px 0 0;border:2px solid rgba(96,165,250,.34);border-radius:12px;
  background:rgba(47,111,228,.13);padding:14px 16px;
  --join-head:#ffffff;--join-body:#c6d2e8;--join-soft:#9aa8c4;
  --join-ok:${T.success};--join-err:#ef8577;}
.rn-clabel{display:block;font-family:${MONO};font-size:9.5px;letter-spacing:.13em;
  text-transform:uppercase;color:${T.blue200};margin-bottom:7px;}
.rn-chd{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.rn-cnm{flex:1;min-width:0;font-size:16.5px;font-weight:800;letter-spacing:-.02em;color:#fff;}
.rn-cgo{flex:none;border:0;background:#7dd3fc;color:#08222e;border-radius:9px;padding:11px 15px;
  font-family:inherit;font-weight:800;font-size:13px;cursor:pointer;}
.rn-cgo:hover{filter:brightness(1.1);}
.rn-ctg{font-size:12.5px;font-weight:600;line-height:1.5;color:#9aa8c4;margin:8px 0 0;}
.rn-cform{margin-top:14px;}
.rn-claimed{margin:20px 0 0;border:2px solid rgba(16,185,129,.4);border-radius:12px;
  background:rgba(16,185,129,.1);padding:12px 15px;font-weight:800;font-size:13.5px;
  color:#6ee7b7;}

.rn-board{margin-top:24px;border-top:1px solid rgba(255,255,255,.09);padding-top:16px;}
.rn-lb{display:grid;gap:2px;}
.rn-brow{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:7px;
  font-size:13.5px;font-weight:600;color:#9aa8c4;}
.rn-brow .rn-bp{font-family:${MONO};font-size:11.5px;color:#66748f;width:26px;flex:none;}
.rn-brow .rn-bn{flex:1;min-width:0;color:#dce6f7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rn-brow .rn-bs{font-family:${MONO};font-size:13px;color:#fff;font-variant-numeric:tabular-nums;}
.rn-brow.me{background:rgba(47,111,228,.18);border:1px solid rgba(96,165,250,.35);color:#fff;}
.rn-brow.me .rn-bp,.rn-brow.me .rn-bn{color:#fff;}
.rn-bmsg{padding:16px;text-align:center;font-size:12.5px;font-weight:600;color:#66748f;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:11px;}

/* PHONE. The vertical gutter lies down into a single condensed strip, because
   a 640px column of rungs beside a question is most of a phone screen spent on
   furniture. Everything here is about giving the height back: the strip is
   26px of ladder plus its caption, the cap loses its figure columns (the same
   numbers are in the strip and the footer line), and the stage padding halves.
   The ladder's own media query does the flip; this trims what is around it. */
@media (max-width:820px){
  .rn-wrap{padding:0 14px 24px;}
  .rn-cap{padding:10px 14px;gap:10px;}
  .rn-cid b{font-size:14px;}
  .rn-cf{display:none;}
  .rn-stage{flex-direction:column;min-height:0;}
  .rn-gutter{width:auto;padding:12px 0 10px;margin:0;border-right:0;
    border-bottom:1px solid rgba(255,255,255,.08);}
  .rn-lcap{margin-bottom:7px;}
  .rn-body{padding:16px 0 22px;max-width:none;}
  .rn-h1{font-size:27px;}
  .rn-lead{font-size:13.5px;margin-top:12px;}
  .rn-roster{margin-top:18px;}
  .rn-rrow{gap:12px;padding:12px 0 12px 13px;}
  .rn-rrow b{width:74px;font-size:16px;}
  .rn-rrow i{font-size:13px;}
  .rn-rrow em{font-size:12.5px;}
  .rn-rrow s{display:none;}
  .rn-go{width:100%;justify-content:center;margin-top:18px;}
  .rn-q{font-size:20px;margin-bottom:16px;}
  .rn-c{padding:13px 14px;font-size:14.5px;}
  .rn-foot{margin-top:16px;padding-top:13px;gap:8px;}
  .rn-tally{margin-left:0;width:100%;}
  .rn-chm{padding:18px 15px;}
  .rn-vlast .rnm-q{font-size:14px;}
  .rn-vsc{display:block;margin:6px 0 0;}
  .rn-vgo{margin-top:16px;padding:16px 60px 18px 18px;border-radius:12px;}
  .rn-vgn{font-size:32px;}
  .rn-vga{right:18px;}
  /* The two chips share the row under the button. */
  .rn-hacts .rn-vb{flex:1 1 0;justify-content:center;}
  .rn-sc-figs{margin-left:0;gap:18px;}
  /* The strip keeps the two facts that matter and drops the denominator. */
  .rn-strip{padding:9px 14px;gap:8px;}
  .rn-sd{display:none;}
  .rn-rin{padding:14px 14px 18px;}
  .rn-thd{gap:6px;}
  .rn-pod{gap:5px;margin-bottom:11px;}
  .rn-pstep{padding:10px 8px 9px;border-radius:7px 7px 0 0;}
  .rn-pstep.p1{padding-top:20px;}
  .rn-pnm{font-size:13px;}
  .rn-pstep.p1 .rn-pnm{font-size:15px;}
  .rn-pfg{font-size:11px;}
  .rn-tab{padding:8px 7px;letter-spacing:.06em;}
  .rn-hcol i{font-size:9.5px;}
}
`;
