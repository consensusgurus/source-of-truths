'use client';

// EAGLE EYE: five visual puzzles as one run (owner, 2026-11-13).
//
// Spot, Jig, Saw, Scour, then Witness (lib/eagle-eye.js), back to back on one
// page, then a rank from Mole up to Eagle Eye. Time and accuracy both count,
// each where it is relevant to the leg (see the scoring note in the lib).
//
// EACH PUZZLE IS THE REAL GAME, mounted inside app/RunEmbed.jsx, exactly as it
// plays on its own page. The start, the save and the /api/quiz/result row are
// that game's own, so the run leaves exactly what five separate plays would,
// and the circuit board (scorer 'eagleeye') adds those rows up with the same
// scorer used here. A puzzle already finished today on its own page is not
// replayed: its first result stands.
//
// Forked from app/spacecadet/SpaceCadetClient.jsx (the run stage: entry, play
// frame, handover, ending), on Visual's magenta ground, each leg on its own
// band colour. The finale's piece is the lens (app/RunFinale.jsx PIECES.lens),
// from the approved "Eagle Eye Run Mockup" canvas.

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
import { EE_RUN_ID, EE_RANKS, EE_MAX, EE_LEG_MAX, EE_FORMS, EE_GROUND, eeTierOf, eeLegPoints, eeAcc, eeSpeed, eeSentence } from '@/lib/eagle-eye';

const CLIENTS = {
  spot: dynamic(() => import('../spot/SpotClient'), { ssr: false, loading: () => null }),
  jig: dynamic(() => import('../jig/JigClient'), { ssr: false, loading: () => null }),
  saw: dynamic(() => import('../saw/SawClient'), { ssr: false, loading: () => null }),
  scour: dynamic(() => import('../scour/ScourClient'), { ssr: false, loading: () => null }),
  witness: dynamic(() => import('../witness/WitnessClient'), { ssr: false, loading: () => null }),
};
const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const B = EE_RANKS;

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
const freshRun = () => ({ v: 1, phase: 'idle', si: 0, t0: null, results: {} });
const fmtClock = (s) => { const v = Math.max(0, Math.round(Number(s) || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; };

// The first (counted) play of a puzzle today, read off the game's own save and
// stats record: { score, total, secs }. Null when it has not been finished
// today. The five games keep three save shapes:
//   Jig, Saw   { status: 'won' | 'revealed', t0, tEnd, pen }   10 of 10 or 0
//   Scour      { status: 'won' | 'done', t0, tEnd, found: { i: [...] } }
//   Spot, Witness (SimpleDaily)  { status: 'won' | 'done', t0, tEnd, s }
// A result filed on another device leaves only the stats record here, which
// carries no clock, so it pays no speed on this screen; the board reads the row.
function bankedOf(sec) {
  try {
    const P = sec.puzzle || {};
    let save = null;
    try { save = JSON.parse(localStorage.getItem(`sot_${sec.key}_${sec.num}`) || 'null'); } catch (e) { save = null; }
    const st = JSON.parse(localStorage.getItem(`sot_${sec.key}_stats`) || 'null') || {};
    const rec = (st.rec && st.rec[sec.num]) || null;
    const jigsaw = sec.key === 'jig' || sec.key === 'saw';
    const totalOf = () => (sec.key === 'scour' ? (P.words || []).length : sec.key === 'spot' ? (P.diffs || []).length : sec.key === 'witness' ? (P.qs || []).length : 10) || 10;
    if (!save || !save.status || save.status === 'playing') {
      if (!rec) return null;
      const total = totalOf();
      if (jigsaw) return { score: rec.won ? 10 : 0, total: 10, secs: 0, banked: true };
      if (sec.key === 'scour') return { score: Math.min(total, Number(rec.s) || 0), total, secs: 0, banked: true };
      return { score: rec.won ? total : 0, total, secs: 0, banked: true };
    }
    const secs = save.t0 && save.tEnd ? Math.max(1, Math.round(((save.tEnd - save.t0) + (Number(save.pen) || 0)) / 1000)) : 0;
    if (jigsaw) return { score: save.status === 'won' ? 10 : 0, total: 10, secs, banked: true };
    const total = totalOf();
    if (sec.key === 'scour') return { score: Math.min(total, Object.keys(save.found || {}).length), total, secs, banked: true };
    const s = save.s || {};
    if (sec.key === 'spot') return { score: Math.min(total, (s.found || []).length), total, secs, banked: true };
    const right = (s.ans || []).reduce((n, a, i) => n + (P.qs && P.qs[i] && a === P.qs[i].a ? 1 : 0), 0);
    return { score: right, total, secs, banked: true };
  } catch (e) { return null; }
}

// THE ENTRY CENTREPIECE: the eye test. Pressing it starts the run.
function EyeTest({ go, allBanked, onStart }) {
  return (
    <button type="button" className={`ee-et${go ? ' go' : ''}`} onClick={onStart} aria-label={allBanked ? 'See your rank' : 'Start'}>
      <svg className="ee-eye" width="96" height="96" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M8 60 C28 28 92 28 112 60 C92 92 28 92 8 60 Z" fill="#fff" strokeWidth="3" strokeLinejoin="round" />
        <g className="ee-iris"><circle cx="60" cy="60" r="20" fill={EE_GROUND} strokeWidth="3" /><circle cx="60" cy="60" r="8" stroke="none" /><circle cx="66" cy="54" r="3" fill="#fff" stroke="none" /></g>
      </svg>
      <span className="ee-fl">
        <small>Eye test</small>
        <b>{go ? 'Eyes open' : allBanked ? 'All five played. So, how sharp?' : <>Are you a {B[B.length - 1][1]} or an {B[0][1]}?</>}</b>
        <span>{B.length} ranks, {[...B].reverse().map((t) => t[1]).join(', ')}</span>
      </span>
    </button>
  );
}

export default function EagleEyeClient({ day = null, dateLabel, dateShort, sections = [] }) {
  const N = sections.length;
  const NW = COUNT_WORD[N] || String(N);
  const STORE = `sot_run_${EE_RUN_ID}_${etToday()}`;
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
  const board = useCircuitBoard(EE_RUN_ID, hydrated && done);

  const counted = useMemo(() => sections.map((sec) => r.results[sec.key] || banked[sec.key] || null), [sections, banked, r.results]);
  const parts = counted.map((c, i) => (c ? eeLegPoints(sections[i].key, c.score, c.total, c.secs) : 0));
  const total = Math.round(parts.reduce((a, b) => a + b, 0));
  const allBanked = N > 0 && sections.every((s) => banked[s.key]);
  const runClock = counted.reduce((a, c) => a + ((c && c.secs) || 0), 0);

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
    const secs = res.t0 ? Math.max(1, Math.round(((res.tEnd || Date.now()) - res.t0) / 1000)) : 0;
    const score = Math.max(0, Number(res.score) || 0);
    commit({ ...cur, results: { ...cur.results, [sec.key]: { score, total: Number(res.total) || 10, secs } } });
    setHolding(sec.key);
    setTimeout(() => setHolding((h) => (h === sec.key ? null : h)), Math.max(1700, (res.beatMs || 0) + 500));
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
    const t = setTimeout(() => advance(), 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [between, last, peek]);

  const tier = eeTierOf(total);
  const rank = B[tier];

  function shareText() {
    const per = sections.map((s, i) => `${s.name} ${counted[i] ? Math.round(parts[i]) : '-'}`).join(' · ');
    const link = `mindloftdaily.com/eagleeye?t=${total}`;
    return `Eagle Eye, ${dateShort}: ${eeSentence(rank[1])}. ${total} of ${EE_MAX}.\n${per}\n${withRef(link)}`;
  }
  function copyShare() {
    const text = done ? shareText() : `Eagle Eye: ${NW.toLowerCase()} visual puzzles in one run. Spot the differences, build two jigsaws, sweep a word search, remember a scene. Rank from Mole up to Eagle Eye.\n${withRef('mindloftdaily.com/eagleeye')}`;
    try { if (navigator.share && isMobileDevice()) { navigator.share({ text }).catch(() => {}); return; } } catch (e) {}
    try { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {}
  }

  const gs = useMemo(() => sections.map((s, i) => ({ ...s, slot: i, questions: [] })), [sections]);
  const runSoFar = sections.slice(0, r.si).reduce((a, s, i) => a + (counted[i] ? parts[i] : 0), 0);
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
    const f = EE_FORMS[sec.key] || {};
    const jigsaw = sec.key === 'jig' || sec.key === 'saw';
    const acc = eeAcc(secDone.score, secDone.total);
    const spd = eeSpeed(sec.key, secDone.secs);
    const what = jigsaw ? (acc ? 'Picture finished' : 'Not finished')
      : sec.key === 'scour' ? `${secDone.score} of ${secDone.total} words`
        : sec.key === 'spot' ? `${secDone.score} of ${secDone.total} differences`
          : `${secDone.score} of ${secDone.total} right`;
    return (
      <>
        <b>Leg {r.si + 1} · {sec.name}{earlier ? ', played earlier today' : ''}</b>
        <span>{what}{f.share && secDone.secs ? ` in ${fmtClock(secDone.secs)}` : ''}</span>
        <span className="ee-bars">
          {!jigsaw ? <span><em>Accuracy</em><i><u style={{ width: `${Math.round(100 * acc)}%` }} /></i></span> : null}
          {f.share ? <span><em>Speed</em><i><u style={{ width: `${Math.round(100 * (acc ? spd : 0))}%` }} /></i></span> : null}
        </span>
        <span>{jigsaw ? `A finished picture pays up to ${EE_LEG_MAX}; the clock decides how much.` : f.share ? 'What you found counts first, then how fast you found it.' : 'A memory test: answers alone decide this one.'}</span>
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
    return out.length ? { rows: out, field: bd.overallField || bd.uniquePlayers || null, href: '/eagleeye/leaderboard' } : null;
  })();
  // Bottom to top: Mole up to Eagle Eye.
  const ladder = [...B].reverse().map((t, i) => ({ min: t[0], name: t[1], line: t[5], colour: rampFor(i), chip: t[3] }));
  const up = tier > 0 ? B[tier - 1] : null;
  const upGap = up ? Math.max(1, up[0] - total) : 0;

  return (
    <>
      {!hydrated ? <GauntletCover sections={gs} /> : null}
      <div className="ee" data-sot-wait="">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {hydrated && r.phase === 'idle' && (
          <div className="ee-gate">
            <GauntletGate
              circuitName="Eagle Eye"
              ground={EE_GROUND}
              banner={<RunOtherDeviceBar runId={EE_RUN_ID} keys={sections.map((s) => s.key)} show={hydrated && r.phase === 'idle' && !r.t0 && !allBanked} />}
              dateLabel={dateShort}
              sections={gs}
              unit="puzzles"
              lineFor={(s) => s.chip || ''}
              bandNote={(s) => (
                <span className="ee-bq">{banked[s.key] ? `Done ${Math.round(eeLegPoints(s.key, banked[s.key].score, banked[s.key].total, banked[s.key].secs))}` : `Leg ${s.slot + 1}`}</span>
              )}
              headline={<>{NW} Looks.<br />One Sharp Eye.</>}
              rule="Five visual puzzles in one run. Speed counts, and so does everything you miss."
              lineup={`From ${B[B.length - 1][1]} up to ${B[0][1]}.`}
              startLabel={leaving ? 'Eyes open…' : (allBanked ? 'See your rank' : 'Start')}
              fieldLine={Object.keys(banked).length ? 'Played one today already? Your first result stands.' : null}
              centerpiece={<EyeTest go={leaving} allBanked={allBanked} onStart={start} />}
              onStart={start}
            />
          </div>
        )}

        {hydrated && playing && sec && (
          <RunPlayFrame sections={gs} idx={r.si} pastel={sec.color} title="Eagle Eye" sub={`Leg ${r.si + 1} of ${N} · ${sec.name}`}
            foot={<>
              Run total {Math.round(runSoFar + (secDone ? parts[r.si] : 0))} of {EE_MAX}
              {mounted && !between ? <> · <button type="button" className="ee-lk" onClick={() => setHelpSeq((x) => x + 1)}>How to play {sec.name}</button></> : null}
              {between && peek ? <> · <button type="button" className="ee-lk" onClick={() => setPeek(false)}>Back to the results</button></> : null}
            </>}>
            {mounted ? (
              <div className={`ee-host ee-host-${sec.key}`}>
                <RunEmbed onResult={onSectionDone} theme={boardTheme} help={helpSeq} autostart>
                  <Game key={`${sec.key}-${sec.num}`} puzzles={[sec.puzzle]} forceNum={null} />
                </RunEmbed>
              </div>
            ) : null}
          </RunPlayFrame>
        )}

        {hydrated && playing && sec && between && !peek && (
          <div className={last ? 'ee-final' : ''}>
            <GauntletBetween
              circuitName="Eagle Eye"
              sections={gs}
              results={[]}
              doneCount={r.si + 1}
              lastSec={gs[r.si]}
              upNext={nextSec || rankSec}
              upIdx={nextSec ? r.si + 1 : -1}
              stepWord="Leg"
              nextLine={nextSec ? `${nextSec.chip} · up to ${EE_LEG_MAX} points` : 'How sharp were you?'}
              lastBody={doneBody()}
              lastFig={{ v: Math.round(parts[r.si]), unit: `of ${EE_LEG_MAX}` }}
              auto={false}
              goLabel={nextSec ? `Next: ${nextSec.name}` : 'See My Rank'}
              fine={<>The clock waits: each puzzle&rsquo;s clock starts when it opens.{mounted ? <><br /><button type="button" className="ee-lk" onClick={() => setPeek(true)}>See your finished board</button></> : null}</>}
              onGo={advance}
              leaveHref="/circuits/eagleeye"
            />
          </div>
        )}

        <RunChallengeCapture gameKey={EE_RUN_ID} />
        {hydrated && done && (
          <GauntletEndStage
            runId={EE_RUN_ID}
            circuitName="Eagle Eye"
            dateLabel={dateShort}
            sections={gs}
            results={sections.map((s, i) => ({ key: s.key, score: counted[i] ? Math.round(parts[i]) : '–' }))}
            score={total}
            unitWord="points"
            colLabel="Leg"
            ladder={ladder}
            ladderHeading="How sharp were you?"
            title={{ name: rank[1], line: rank[5], colour: rampFor(B.length - 1 - tier) }}
            topNote={`${eeSentence(rank[1])}${up ? ` · ${upGap} point${upGap === 1 ? '' : 's'} from ${up[1]}` : ' · top rank'}`}
            rank={meB && Number.isFinite(Number(meB.rank)) ? Number(meB.rank) : null}
            fieldSize={bd ? (bd.overallField || bd.uniquePlayers || overall.length || null) : null}
            board={boardOut}
            rowsIn={rows}
            leaderScore={overall[0] ? Math.round(Number(overall[0].total)) : null}
            extra={<RunChallengeLine gameKey={EE_RUN_ID} score={total} total={EE_MAX} n={runToken()} style={{ margin: 0 }} />}
            challenge={<RunChallengeButton gameKey={EE_RUN_ID} score={total} total={EE_MAX} n={runToken()} t={runClock > 0 ? Math.round(runClock) : null} status={rank[1]} door />}
            meme={<RunMeme gameKey={EE_RUN_ID} score={total} total={EE_MAX} n={runToken()} status={rank[1]} cat="Visual" />}
            more={<MoreRunsList self={EE_RUN_ID} ink="var(--gsx-ink)" mute="var(--gsx-ink)" line="color-mix(in srgb, var(--gsx-ink) 30%, transparent)" style={{ margin: 0 }} />}
            onShare={copyShare}
            copied={copied}
            sweep={doneAtLoad.current === false}
            finale={doneAtLoad.current === false ? { key: EE_RUN_ID, legWord: 'Leg', legMax: sections.map(() => EE_LEG_MAX) } : null}
          />
        )}
        <MoreRunsPop self={EE_RUN_ID} ready={settled && doneAtLoad.current === false} delay={2500} fireOnLeave />
      </div>
    </>
  );
}

const CSS = `
.ee{min-height:100vh;font-family:'Manrope',system-ui,sans-serif}
.ee *{box-sizing:border-box}
/* The embedded puzzle sits on the leg's band colour, not its own sheet; the
   board inside keeps its own colours and play. */
.ee-host .stage-page{min-height:0 !important;background:transparent !important;overflow-x:visible !important}
.gsx-play[data-stage-theme='light'] .ee-host .stage-page{--stg-mute:#33495a !important;--stg-mute2:#33495a !important;--stg-dim:#3d5263 !important;--stg-ink:#08222e !important}
/* The jigsaws and the word search want the width: board and tray side by side. */
.ee .gsx-pbody:has(.ee-host-jig),.ee .gsx-pbody:has(.ee-host-saw){max-width:1280px;padding-left:10px;padding-right:10px}
.ee .gsx-pbody:has(.ee-host-scour),.ee .gsx-pbody:has(.ee-host-spot){max-width:1100px}
.ee-lk{background:none;border:0;padding:4px 2px;color:inherit;font:inherit;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.ee-bq{font-weight:800}
.ee-bars{display:flex;flex-direction:column;gap:5px;margin:4px 0 2px}
.ee-bars > span{display:flex;align-items:center;gap:8px}
.ee-bars em{width:72px;flex:none;font-style:normal;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
.ee-bars i{flex:1;height:8px;border:1.5px solid var(--gsx-ink);border-radius:999px;overflow:hidden}
.ee-bars u{display:block;height:100%;background:var(--gsx-ink);text-decoration:none;transform-origin:left;animation:eefill .7s ease .6s both}
@keyframes eefill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ee-final .gsx-eye2{font-size:0 !important}
.ee-final .gsx-eye2::after{content:'Up Next \\00B7  Your Rank';font-size:15px}
/* ENTRY CENTREPIECE: the eye test, on paper in the stage ink. */
.ee-et{display:flex;align-items:center;gap:16px;width:100%;margin:0;padding:14px 16px;border:1px solid var(--gsx-ink);border-radius:16px;background:#ffffff;color:#08222e;box-shadow:4px 4px 0 var(--gsx-ink);cursor:pointer;font:inherit;text-align:left}
.ee-et:focus-visible{outline:3px solid var(--gsx-ink);outline-offset:3px}
.ee-et:hover{background:#fdf4ff}
.ee-eye{flex:none;stroke:#08222e;fill:#08222e}
.ee-iris{animation:eelook 5s ease-in-out infinite}
.ee-et.go .ee-iris{animation-duration:.7s}
@keyframes eelook{0%,100%{transform:translateX(0)}25%{transform:translateX(-14px)}75%{transform:translateX(14px)}}
.ee-fl{display:flex;flex-direction:column;gap:3px;min-width:0}
.ee-fl small{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
.ee-fl b{font-size:19px;font-weight:800;letter-spacing:-.01em;line-height:1.2}
.ee-fl span{font-size:12.5px;font-weight:700;line-height:1.35}
@media(min-width:900px){
  .ee-gate .gsx-split{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;row-gap:18px}
  .ee-gate .gsx-split > .gsx-top{margin-bottom:0}
  .ee-gate .gsx-head{grid-row:2 / span 2}
  .ee-gate .gsx-piece{display:flex}
}
@media(prefers-reduced-motion:reduce){.ee *{animation:none !important;transition:none !important}}
`;
