'use client';

// ODD JOBS: Mop, Mow and Plow as one run (owner, 2026-11-21).
//
// The house, the yard, then the town (lib/odd-jobs.js), back to back on one
// page, then a rank from Couch Potato up to Foreman. "Odd Jobs" is the run's
// name, never a rung. Fewest replays decide, then the clock: each solved leg
// pays 100, less 20 a replay and up to 6 for time, so one replay always counts
// for more than all the time across the run.
//
// EACH PUZZLE IS THE REAL GAME (that day's board, Sunday Editions included),
// mounted inside app/RunEmbed.jsx (SimpleDaily reports through useRunEmbed,
// with its replays as `guesses`), exactly as it plays on its own page. The save
// and the /api/quiz/result row are that game's own, so the run leaves exactly
// what three separate plays would, and the circuit board (scorer 'oddjobs')
// adds those rows up with the same points used here. A puzzle already finished
// today on its own page is not replayed: its first result stands.
//
// Forked from app/duediligence/DueDiligenceClient.jsx.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import RunEmbed from '../RunEmbed';
import { RunChallengeButton, RunChallengeLine, RunChallengeCapture, runToken, RunMeme } from '../RunChallenge';
import RunOtherDeviceBar from '../RunOtherDeviceBar';
import MoreRunsPop, { MoreRunsList } from '../circuits/MoreRuns';
import useCircuitBoard from '../circuits/useCircuitBoard';
import { stageAvg } from '../circuits/RunScorecard';
import { GauntletGate, GauntletBetween, GauntletEndStage, GauntletCover, RunPlayFrame, useGauntletLook } from '../GauntletScreens';
import { isDarkLook } from '@/lib/stage-look';
import { rampFor } from '@/lib/circuits';
import { withRef } from '@/lib/referrals';
import { isMobileDevice } from '@/lib/is-mobile';
import { ODD_RUN_ID, ODD_RANKS, ODD_LEG_MAX, ODD_REPLAY, ODD_TIME, oddTierOf, oddLegPoints, oddSentence } from '@/lib/odd-jobs';

const CLIENTS = {
  mop: dynamic(() => import('../mop/MopClient'), { ssr: false, loading: () => null }),
  mow: dynamic(() => import('../mow/MowClient'), { ssr: false, loading: () => null }),
  plow: dynamic(() => import('../plow/PlowClient'), { ssr: false, loading: () => null }),
};
const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const B = ODD_RANKS;
const GROUND = '#fcd34d';
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };
const repWord = (n) => `${n} ${n === 1 ? 'replay' : 'replays'}`;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });

// The first (counted) play of a puzzle today, read off the game's own save
// (SimpleDaily: { status, t0, tEnd, s: { replays } }) and stats record. Null
// when it has not been finished today. A result filed on another device leaves
// only a won/lost record here: no replays known and no clock, so it is shown as
// a clean leg at the full time charge; the board reads the real row.
function bankedOf(sec) {
  try {
    let save = null;
    try { save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null'); } catch (e) { save = null; }
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || null;
    if (!save || !save.status || save.status === 'playing') {
      return rec ? { score: rec.won ? 10 : 0, total: 10, replays: 0, secs: 0, banked: true } : null;
    }
    const secs = save.t0 && save.tEnd ? Math.max(1, Math.round((save.tEnd - save.t0) / 1000)) : 0;
    const replays = save.s && Number.isFinite(Number(save.s.replays)) ? Number(save.s.replays) : 0;
    return { score: save.status === 'won' ? 10 : 0, total: 10, replays, secs, banked: true };
  } catch (e) { return null; }
}

// THE ENTRY CENTREPIECE: the work order (the mockup's "Today's work order"
// card), with the ranks low to high. Pressing it starts the run. It sits in
// GauntletGate's fixed-height piece slot.
function Order({ go, allBanked, onStart, sections }) {
  const up = [...B].reverse();
  return (
    <button type="button" className={`oj-order${go ? ' go' : ''}`} onClick={onStart} aria-label={allBanked ? 'See your rank' : 'Clock in'}>
      <span className="oj-oh"><small>Work order</small><small>Today</small></span>
      <b>{go ? 'Clocking in' : allBanked ? 'All three jobs done. So, who are you?' : 'Are you a Couch Potato or a Foreman?'}</b>
      <span className="oj-ol" aria-label={`Ranks, low to high: ${up.map((t) => t[1]).join(', ')}`}>
        {up.map((t, k) => <span key={t[1]} className={k === up.length - 1 ? 'top' : ''} style={{ '--c': t[4] }}>{t[1]}</span>)}
      </span>
    </button>
  );
}

export default function OddJobsClient({ day = null, dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const NW = COUNT_WORD[N] || String(N);
  const STORE = `sot_run_${ODD_RUN_ID}_${etToday()}`;
  const [r, setR] = useState(() => freshRun());
  const rRef = useRef(r);
  const [hydrated, setHydrated] = useState(false);
  const [banked, setBanked] = useState({});
  const [leaving, setLeaving] = useState(false);
  const [holding, setHolding] = useState(null);
  const [peek, setPeek] = useState(false);
  const [helpSeq, setHelpSeq] = useState(0);
  const [copied, setCopied] = useState(false);
  const doneAtLoad = useRef(null);
  const [settled, setSettled] = useState(false);
  const [look] = useGauntletLook();
  const boardTheme = isDarkLook(look) ? 'dark' : 'light';

  useEffect(() => { rRef.current = r; }, [r]);
  const commit = useCallback((next) => {
    rRef.current = next; setR(next);
    try { localStorage.setItem(STORE, JSON.stringify(next)); } catch (e) {}
  }, [STORE]);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
    const b = {};
    for (const sec of sections) { const x = bankedOf(sec); if (x) b[sec.key] = x; }
    setBanked(b);
    if (saved && saved.v === 1) {
      const next = { ...freshRun(), ...saved };
      rRef.current = next; setR(next);
      doneAtLoad.current = next.phase === 'done';
    } else {
      doneAtLoad.current = false;
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = r.phase === 'done';
  const playing = r.phase === 'playing';
  const board = useCircuitBoard(ODD_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => r.results[sec.key] || banked[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c) => (c ? oddLegPoints(c.score, c.replays, c.secs) : 0));
  const exact = parts.reduce((a, b) => a + b, 0);
  const total = Math.round(exact);
  const allSolved = N > 0 && counted.every((c) => c && c.score > 0);
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);
  const replays = counted.reduce((a, c) => a + ((c && c.replays) || 0), 0);
  const runClock = counted.reduce((a, c) => a + ((c && c.secs) || 0), 0);
  const ODD_RUN_MAX = N * ODD_LEG_MAX;

  function start() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      const cur = rRef.current;
      if (allBanked) { commit({ ...cur, phase: 'done', t0: cur.t0 || Date.now(), tEnd: Date.now() }); return; }
      commit({ ...cur, phase: 'playing', si: 0, t0: cur.t0 || Date.now() });
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) {}
    }, 760);
  }

  // A puzzle reports its filed result. The finished board holds for its finish
  // beat (RunEmbed plays it) and a moment more, then the handover covers it.
  const onSectionDone = useCallback((res) => {
    const cur = rRef.current;
    const sec = sections[cur.si];
    if (!sec || !res || res.key !== sec.key || cur.results[sec.key]) return;
    const score = res.won === false ? 0 : Number(res.score) || 0;
    const secs = res.t0 ? Math.max(1, Math.round(((res.tEnd || Date.now()) - res.t0) / 1000)) : 0;
    const reps = Math.max(0, Number(res.guesses) || 0);
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score, total: res.total || 10, replays: reps, secs } } });
    setHolding(sec.key);
    // The finished board holds a moment so the last move lands, then the handover covers it.
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), Math.max(2600, (res.beatMs || 0) + 1600));
  }, [sections, commit]);

  const sec = playing ? sections[r.si] : null;
  const secDone = sec ? (r.results[sec.key] || banked[sec.key]) : null;
  const between = !!(sec && secDone && holding !== sec.key);
  const last = playing && r.si >= N - 1;

  function advance() {
    const cur = rRef.current;
    setPeek(false);
    if (cur.si >= N - 1) commit({ ...cur, phase: 'done', tEnd: Date.now() });
    else commit({ ...cur, si: cur.si + 1 });
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) {}
    setTimeout(() => { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) {} }, 80);
  }
  useEffect(() => {
    if (!between || !last || peek) return undefined;
    const t = setTimeout(() => advance(), 6000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between, last, peek]);

  const tier = oddTierOf(total, allSolved);
  const rank = B[tier];

  const legWord = (c) => (c && c.score > 0 ? `${c.secs ? fmtClock(c.secs) : 'done'}, ${repWord(c.replays || 0)}` : 'not finished');
  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? legWord(counted[i]) : '-'}`).join(' · ');
    const link = `mindloftdaily.com/oddjobs?t=${total}`;
    return `Odd Jobs, ${dateShort}: ${oddSentence(rank[1])}. ${repWord(replays)}${runClock ? `, ${fmtClock(runClock)}` : ''}.\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Are you a Couch Potato or a Foreman? Odd Jobs: mop a house, mow a yard and plow a town, every tile, square and street exactly once. Fewest replays, then the clock.\n${withRef('mindloftdaily.com/oddjobs')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  // Inside the run each leg wears its label (The stock, ...), not the game's name.
  const gs = useMemo(() => sections.map((s, i) => ({ ...s, name: s.form || s.name, game: s.name, slot: i, questions: [] })), [sections]);

  const Game = sec ? CLIENTS[sec.key] : null;
  const mounted = !!(Game && sec && !banked[sec.key]);

  useEffect(() => {
    if (!hydrated || !done) return undefined;
    const t = setTimeout(() => setSettled(true), doneAtLoad.current === false ? 6500 : 0);
    return () => clearTimeout(t);
  }, [hydrated, done]);

  function doneBody() {
    if (!sec || !secDone) return null;
    const earlier = banked[sec.key] && !r.results[sec.key];
    const solved = secDone.score > 0;
    return (
      <>
        <b>Job {r.si + 1} · {sec.form}{earlier ? ', done earlier today' : ''}</b>
        <span>{sec.name}: {solved ? `finished${secDone.secs ? ` in ${fmtClock(secDone.secs)}` : ''}` : 'not finished'}</span>
        {solved ? <span>{repWord(secDone.replays || 0)}</span> : null}
        <span>Each replay costs {ODD_REPLAY} points; the clock costs at most {ODD_TIME} a job.</span>
      </>
    );
  }

  const nextSec = playing && !last ? gs[r.si + 1] : null;
  const rankSec = { key: '__rank', name: 'Your Rank', slot: N, questions: [] };

  const bd = board && board.data;
  const sf = bd && bd.stageField;
  const avg = stageAvg(sf, sections);
  const rows = sections.map((s, i) => {
    const g = sf && sf.games && sf.games[s.key];
    const a = avg && avg[s.key] != null ? Number(avg[s.key]) : null;
    return {
      key: s.key, name: s.name, bg: s.color || rampFor(i),
      you: counted[i] ? Math.round(parts[i]) : '–',
      field: a != null ? Math.round(a) : '–',
      best: g && Number.isFinite(Number(g.best)) ? Math.round(Number(g.best)) : '–',
    };
  });
  const overall = bd && Array.isArray(bd.overall) ? bd.overall.filter((x) => Number.isFinite(Number(x.total))) : [];
  const meB = bd ? (bd.me || null) : null;
  const boardOut = (() => {
    if (!bd) return null;
    const isMe = (row) => !!(meB && row && meB.userKey && row.userKey === meB.userKey);
    const out = overall.slice(0, 3).map((row, i) => ({ rank: row.rank || i + 1, name: row.username || 'Guest', score: Math.round(Number(row.total)), me: isMe(row) }));
    if (meB && !out.some((x) => x.me) && Number.isFinite(Number(meB.total))) {
      if (Number.isFinite(meB.rank) && meB.rank > 4) out.push({ gap: true });
      out.push({ rank: Number.isFinite(meB.rank) ? meB.rank : '–', name: 'You', score: Math.round(Number(meB.total)), me: true });
    }
    return out.length ? { rows: out, field: bd.overallField || bd.uniquePlayers || null, href: '/oddjobs/leaderboard' } : null;
  })();
  // Bottom to top: Couch Potato up to Foreman.
  const ladder = [...B].reverse().map((t, i) => ({ min: t[0], name: t[1], short: t[2], line: t[5], colour: rampFor(i), chip: t[3] }));
  const up = tier > 0 ? B[tier - 1] : null;
  const upGap = up ? Math.max(1, up[0] - total) : 0;

  return (
    <>
      {!hydrated ? <GauntletCover sections={gs} /> : null}
      <div className="dd" data-sot-wait="">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {hydrated && r.phase === 'idle' && (
          <div className="dd-gate">
            <GauntletGate
              circuitName="Odd Jobs"
              ground={GROUND}
              banner={<RunOtherDeviceBar runId={ODD_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} />}
              dateLabel={dateShort}
              sections={gs}
              lineFor={(s) => `${s.game}: ${s.chip || ''}`}
              bandNote={(s) => (
                <span className="dd-bq">{banked[s.key] ? (banked[s.key].score > 0 ? `Done, ${repWord(banked[s.key].replays || 0)}` : 'Played') : `Job ${s.slot + 1}`}</span>
              )}
              headline={<>{NW} Jobs.<br />No Second Pass.</>}
              rule="Mop the house, mow the yard, plow the town. Fewest replays win, then the clock."
              lineup={`From ${B[B.length - 1][1]} up to ${B[0][1]}.`}
              startLabel={leaving ? 'Clocking in…' : (allBanked ? 'See your rank' : 'Clock In')}
              fieldLine={Object.keys(banked).length ? 'Done one today already? Your first result stands.' : null}
              centerpiece={<Order go={leaving} allBanked={allBanked} onStart={start} sections={sections} />}
              onStart={start}
            />
          </div>
        )}

        {hydrated && playing && sec && (
          <RunPlayFrame sections={gs} idx={r.si} pastel={sec.color} title="Odd Jobs" sub={`Job ${r.si + 1} of ${N} · ${sec.form}`}
            foot={<>
              {repWord(counted.slice(0, r.si + (secDone ? 1 : 0)).reduce((a, c) => a + ((c && c.replays) || 0), 0))} so far · {fmtClock(counted.slice(0, r.si).reduce((a, c) => a + ((c && c.secs) || 0), 0))} banked
              {mounted && !between ? <> · <button type="button" className="dd-lk" onClick={() => setHelpSeq((x) => x + 1)}>How to play {sec.name}</button></> : null}
              {between && peek ? <> · <button type="button" className="dd-lk" onClick={() => setPeek(false)}>Back to the results</button></> : null}
            </>}>
            {mounted ? (
              <div className="dd-host">
                <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq} autostart>
                  <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            ) : null}
          </RunPlayFrame>
        )}

        {hydrated && playing && sec && between && !peek && (
          <div className={last ? 'dd-final' : ''}>
            <GauntletBetween
              circuitName="Odd Jobs"
              sections={gs}
              results={[]}
              doneCount={r.si + 1}
              lastSec={gs[r.si]}
              upNext={nextSec || rankSec}
              upIdx={nextSec ? r.si + 1 : -1}
              stepWord="Job"
              nextLine={nextSec ? `${nextSec.game}: ${nextSec.chip}` : 'How handy are you?'}
              lastBody={doneBody()}
              lastFig={{ v: secDone && secDone.score > 0 ? (secDone.replays || 0) : '–', unit: secDone && secDone.score > 0 ? ((secDone.replays || 0) === 1 ? 'replay' : 'replays') : 'not finished' }}
              auto={false}
              goLabel={nextSec ? `Next: ${nextSec.name}` : 'See My Rank'}
              fine={<>Fewest replays first, then the clock.{mounted ? <><br /><button type="button" className="dd-lk" onClick={() => setPeek(true)}>See your finished board</button></> : null}</>}
              onGo={advance}
              leaveHref="/circuits/oddjobs"
            />
          </div>
        )}

        <RunChallengeCapture gameKey={ODD_RUN_ID} />
        {hydrated && done && (
          <GauntletEndStage
            runId={ODD_RUN_ID}
            circuitName="Odd Jobs"
            dateLabel={dateShort}
            sections={gs}
            results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '–' }))}
            score={total}
            unitWord="points"
            colLabel="Job"
            ladder={ladder}
            ladderHeading="How handy are you?"
            title={{ name: rank[1], line: rank[5], colour: rampFor(B.length - 1 - tier) }}
            topNote={`${oddSentence(rank[1])} · ${repWord(replays)}${runClock > 0 ? `, ${fmtClock(runClock)}` : ''}${!allSolved ? ' · a job not finished' : tier === 0 ? ' · top rank' : ''}`}
            rank={meB && Number.isFinite(Number(meB.rank)) ? Number(meB.rank) : null}
            fieldSize={bd ? (bd.overallField || bd.uniquePlayers || overall.length || null) : null}
            board={boardOut}
            rowsIn={rows}
            leaderScore={overall[0] ? Math.round(Number(overall[0].total)) : null}
            extra={<RunChallengeLine gameKey={ODD_RUN_ID} score={total} total={ODD_RUN_MAX} n={runToken()} style={{ margin: 0 }} />}
            challenge={<RunChallengeButton gameKey={ODD_RUN_ID} score={total} total={ODD_RUN_MAX} n={runToken()} status={rank[1]} door />}
            meme={<RunMeme gameKey={ODD_RUN_ID} score={total} total={ODD_RUN_MAX} n={runToken()} status={rank[1]} cat="Logic" />}
            more={<MoreRunsList self={ODD_RUN_ID} ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
            finale={doneAtLoad.current === false ? { key: ODD_RUN_ID, legWord: 'Job', legMax: sections.map(() => ODD_LEG_MAX) } : null}
          />
        )}
        <MoreRunsPop self={ODD_RUN_ID} ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
      </div>
    </>
  );
}

const CSS = `
.dd{min-height:100vh;font-family:'Manrope',system-ui,sans-serif}
.dd *{box-sizing:border-box}
/* The embedded puzzle sits on the leg's band colour, not its own sheet; the
   board inside (the chart, the filing, the profile) keeps its own colours. */
.dd-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.gsx-play[data-stage-theme='light'] .dd-host .stage-page{--stg-mute:#33495a !important;--stg-mute2:#33495a !important;--stg-dim:#3d5263 !important;--stg-ink:#08222e !important}
.dd-lk{background:none;border:0;padding:4px 2px;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.dd-bq{font-weight:800}
.dd-final .gsx-eye2{font-size:0 !important}
.dd-final .gsx-eye2::after{content:'Up Next \\00B7  Your Rank';font-size:15px}
/* ENTRY CENTREPIECE: the work order, on paper in the stage ink. */
.oj-order{display:flex;flex-direction:column;justify-content:center;gap:7px;width:100%;height:100%;margin:0;padding:10px 16px;overflow:hidden;border:1px solid var(--gsx-ink);border-radius:16px;background:#ffffff;color:#08222e;box-shadow:4px 4px 0 var(--gsx-ink);cursor:pointer;font:inherit;text-align:left;transition:transform .2s ease}
.oj-order:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.oj-order:hover{background:#fffbeb}
.oj-order.go{transform:translateY(-3px)}
.oj-oh{display:flex;justify-content:space-between;border-bottom:2px solid #08222e;padding-bottom:6px}
.oj-oh small{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.oj-oh small:first-child{color:#b45309}
.oj-order b{font-size:19px;line-height:1.2;font-weight:800;letter-spacing:-.01em;padding-bottom:1px}
.oj-ol{display:flex;flex-wrap:wrap;align-items:center;gap:5px}
.oj-ol > span{display:inline-flex;align-items:center;padding:3px 9px;border:1.5px solid #08222e;border-radius:999px;background:var(--c);font-size:12.5px;font-weight:800;line-height:1.3;white-space:nowrap}
.oj-ol > span.top{background:#08222e;color:#ffffff}
@media(max-width:480px){.oj-order{gap:6px}.oj-order b{font-size:16px}.oj-ol{gap:4px}.oj-ol > span{padding:2px 7px;font-size:11.5px}}
@media(min-width:900px){
  .dd-gate .gsx-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;row-gap:18px}
  .dd-gate .gsx-split > .gsx-top{margin-bottom:0}
  .dd-gate .gsx-head{grid-row:2 / span 2}
  .dd-gate .gsx-piece{display:flex}
}
@media(prefers-reduced-motion:reduce){.dd *{animation:none !important;transition:none !important}}
`;
